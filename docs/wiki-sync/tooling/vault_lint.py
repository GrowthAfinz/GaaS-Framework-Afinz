"""Lint do vault: compara o Obsidian local com a wiki publicada no GaaS e acusa drift.

Checagens:
  1. Sync local x wiki (`gaas_vault_notes`): só local, só na wiki, conteúdo diferente.
  2. Notas duplicadas por hash (local e wiki).
  3. Wikilinks sem alvo ou ambíguos, anexos ausentes e links `[Nota](#ancora)`
     copiados da ontologia compilada para dentro das notas.
  4. Notas sem frontmatter `atualizado` ou revisadas há mais de N dias.
  5. Orçamento de tokens dos arquivos de `docs/ontology/` (decisão D-2 do ADR-001).
  6. Com `--conservacao <manifesto.json>`: teste de conservação de uma reorganização.
     Nenhuma linha de conteúdo das notas de origem pode faltar nas notas de destino
     (regra combinada em 28/10/2026: reorganizar sem apagar nem enxugar).

A leitura da wiki é só SELECT, via REST do Supabase. Credenciais vêm de
SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no ambiente ou no arquivo de `--env-file`
(padrão: calendar-estrategico/.env.agent). Sem credencial, use `--remote-file`
com um JSON [{relative_path, content_hash}] ou linhas `caminho|hash`, ou rode só
as checagens locais com `--offline`.

Uso:
  python scripts/vault_lint.py
  python scripts/vault_lint.py --stale-days 120 --strict
  python scripts/vault_lint.py --conservacao docs/plans/wiki-migracao/publico-carrinho-abandonado.json

Manifesto de conservação (JSON):
  {"nome": "...", "destinos": ["10-Resultados/.../Pagina.md"],
   "fontes": [{"caminho": "01-Conceitos/Nota.md"},
              {"caminho": "03-Dimensoes/Segmentos.md", "linhas": "regex: só as linhas que migram"}]}
"""
import argparse
import hashlib
import json
import math
import os
import re
import sys
import urllib.request
from collections import defaultdict
from datetime import date, datetime

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
VAULT_DIR = os.path.join(PROJECT_ROOT, "Afinz-CRM-Midia-Vault")
LAYER_DIR = os.path.join(PROJECT_ROOT, "docs", "ontology")
DEFAULT_ENV_FILE = os.path.join(PROJECT_ROOT, "calendar-estrategico", ".env.agent")
REPORT_DIR = os.path.join(PROJECT_ROOT, "outputs", "vault-lint")

# Mesma elegibilidade de calendar-estrategico/scripts/export-vault-projection.mjs.
IGNORED_DIRS = {".obsidian", ".git", "99-Templates"}
VAULT_KEY = "afinz-crm-midia"
TOKEN_BUDGET = 120_000
CHARS_PER_TOKEN = 3.5
WIKILINK = re.compile(r"(!?)\[\[([^\]]+)\]\]")
FRONTMATTER = re.compile(r"^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?")
CODE_BLOCK = re.compile(r"```[\s\S]*?```|`[^`\n]*`")
ANCHOR_LINK = re.compile(r"\[([^\]\n]+)\]\(#([^)\s]+)\)")


def load_local():
    notes, attachments = {}, defaultdict(list)
    for root, dirs, files in os.walk(VAULT_DIR):
        dirs[:] = [d for d in dirs if d not in IGNORED_DIRS]
        for name in files:
            absolute = os.path.join(root, name)
            relative = os.path.relpath(absolute, VAULT_DIR).replace(os.sep, "/")
            if not name.lower().endswith(".md"):
                attachments[name.lower()].append(relative)
                continue
            with open(absolute, "rb") as f:
                raw = f.read()
            text = raw.decode("utf-8", errors="replace")
            notes[relative] = {"hash": hashlib.sha256(raw).hexdigest(), "text": text}
    return notes, attachments


def read_env_file(path):
    values = {}
    if not path or not os.path.exists(path):
        return values
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, value = line.split("=", 1)
                values[key.strip()] = value.strip().strip('"').strip("'")
    return values


def supabase_get(url, key, path):
    rows, offset, page = [], 0, 1000
    while True:
        request = urllib.request.Request(f"{url}/rest/v1/{path}", headers={
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Range-Unit": "items",
            "Range": f"{offset}-{offset + page - 1}",
        })
        with urllib.request.urlopen(request, timeout=60) as response:
            batch = json.loads(response.read().decode("utf-8"))
        rows.extend(batch)
        if len(batch) < page:
            return rows
        offset += page


def load_remote(args):
    if args.remote_file:
        with open(args.remote_file, encoding="utf-8") as f:
            content = f.read().strip()
        if content.startswith("["):
            rows = json.loads(content)
        else:
            rows = [dict(zip(("relative_path", "content_hash"), line.rsplit("|", 1)))
                    for line in content.splitlines() if "|" in line]
        return {row["relative_path"]: row["content_hash"].strip() for row in rows}, None, f"arquivo {args.remote_file}"

    env = {**read_env_file(args.env_file), **os.environ}
    url, key = env.get("SUPABASE_URL"), env.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key or "COLE_AQUI" in key:
        return None, None, "sem credencial (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)"
    url = url.rstrip("/")
    notes = supabase_get(url, key, f"gaas_vault_notes?select=relative_path,content_hash"
                                   f"&vault_key=eq.{VAULT_KEY}&deleted_at=is.null&order=relative_path")
    runs = supabase_get(url, key, f"gaas_vault_sync_runs?select=status,source,started_at,completed_at,note_count,changed_count"
                                  f"&vault_key=eq.{VAULT_KEY}&status=eq.completed&order=completed_at.desc&limit=1")
    return {row["relative_path"]: row["content_hash"] for row in notes}, (runs[0] if runs else None), "Supabase (gaas_vault_notes)"


def frontmatter_of(text):
    match = FRONTMATTER.match(text)
    if not match:
        return None
    fields = {}
    for line in match.group(1).splitlines():
        if ":" in line and not line.startswith((" ", "-")):
            key, value = line.split(":", 1)
            fields[key.strip()] = value.strip().strip("'\"")
    return fields


def check_links(notes, attachments):
    by_path = {path[:-3].lower(): path for path in notes}
    by_name, by_alias = defaultdict(list), defaultdict(list)
    for path in notes:
        by_name[os.path.basename(path)[:-3].lower()].append(path)
    # Obsidian e o leitor do GaaS resolvem link pelo nome do arquivo; apelido só
    # entra quando nenhum arquivo tem aquele nome.
    for path, note in notes.items():
        fields = frontmatter_of(note["text"]) or {}
        for alias in re.split(r"[,;]", fields.get("aliases", "").strip("[]")):
            if alias.strip():
                by_alias[alias.strip().strip("'\"").lower()].append(path)

    broken, ambiguous, missing_files, anchor_links = [], [], [], []
    for path, note in notes.items():
        body = CODE_BLOCK.sub("", note["text"])
        # `[Nota](#nota)` é a sintaxe da ontologia compilada. Dentro do vault não abre
        # a nota: alguém copiou do arquivo gerado de volta para a fonte.
        for text, _ in ANCHOR_LINK.findall(body):
            if text.strip().lower() in by_name or text.strip().lower() in by_alias:
                anchor_links.append((path, text.strip()))
        for embed, raw in WIKILINK.findall(body):
            target = raw.replace("\\|", "|").split("|", 1)[0].split("#", 1)[0].strip().replace("\\", "/")
            if not target:
                continue  # link para seção da própria nota
            extension = os.path.splitext(target)[1].lower()
            if extension and extension != ".md":
                if os.path.basename(target).lower() not in attachments:
                    missing_files.append((path, raw))
                continue
            normalized = target.removesuffix(".md").lower()
            if normalized in by_path:
                continue
            name = os.path.basename(normalized)
            candidates = sorted(set(by_name.get(name) or by_alias.get(name, [])))
            if not candidates:
                broken.append((path, raw))
            elif len(candidates) > 1 and "/" not in normalized:
                ambiguous.append((path, raw, candidates))
    return broken, ambiguous, missing_files, anchor_links


def check_staleness(notes, stale_days, today):
    no_frontmatter, no_date, stale = [], [], []
    for path, note in sorted(notes.items()):
        if os.path.basename(path).startswith("Assunto-") or path.startswith("98-Legado/"):
            continue  # gerados pelo inventário (data própria) ou legado (foto de propósito)
        fields = frontmatter_of(note["text"])
        if fields is None:
            no_frontmatter.append(path)
            continue
        value = fields.get("atualizado") or fields.get("updated")
        try:
            updated = datetime.strptime(value[:10], "%Y-%m-%d").date()
        except (TypeError, ValueError):
            no_date.append(path)
            continue
        age = (today - updated).days
        if age > stale_days:
            stale.append((path, updated.isoformat(), age, fields.get("status", "")))
    return no_frontmatter, no_date, stale


def check_budget():
    if not os.path.isdir(LAYER_DIR):
        return None
    sizes = []
    for name in sorted(os.listdir(LAYER_DIR)):
        if name.endswith(".md"):
            with open(os.path.join(LAYER_DIR, name), encoding="utf-8") as f:
                sizes.append((name, math.ceil(len(f.read()) / CHARS_PER_TOKEN)))
    return sizes


def duplicates(hashes):
    groups = defaultdict(list)
    for path, digest in hashes.items():
        groups[digest].append(path)
    return [sorted(paths) for paths in groups.values() if len(paths) > 1]


def normalize_unit(line):
    """Forma comparável de uma linha: sem marcador de citação ou lista, wikilink pelo texto
    exibido e espaços colapsados. Assim mover conteúdo de lugar ou trocar o caminho de um
    link não conta como perda; mudar o texto conta."""
    text = line.strip()
    while text.startswith(">"):
        text = text[1:].strip()
    text = re.sub(r"^([-*+]|\d+\.)\s+", "", text)

    def shown(match):
        inner = match.group(2)
        target, _, label = inner.partition("|")
        return label or os.path.basename(target.split("#", 1)[0]) or target.split("#", 1)[-1]

    text = WIKILINK.sub(shown, text)
    return re.sub(r"\s+", " ", text).strip()


def content_units(text, line_filter=None):
    """Linhas de conteúdo de uma nota: fora frontmatter, títulos, cercas de código,
    separadores de tabela e linhas vazias."""
    match = FRONTMATTER.match(text)
    body = text[match.end():] if match else text
    offset = text[:match.end()].count("\n") if match else 0
    units, headings = [], []
    for number, raw in enumerate(body.splitlines(), start=offset + 1):
        if line_filter and not re.search(line_filter, raw):
            continue
        stripped = raw.strip()
        if stripped.startswith("#"):
            headings.append((number, stripped.lstrip("#").strip()))
            continue
        if stripped.startswith(("```", "~~~")) or re.fullmatch(r"\|?[\s:|-]+\|?", stripped or "-"):
            continue
        unit = normalize_unit(raw)
        if len(unit) >= 4:
            units.append((number, unit))
    return units, headings


def check_conservation(manifest_path):
    """Confere se cada linha de conteúdo das notas de origem existe nas notas de destino."""
    with open(manifest_path, encoding="utf-8") as f:
        manifest = json.load(f)

    def read_note(relative):
        with open(os.path.join(VAULT_DIR, *relative.split("/")), encoding="utf-8") as f:
            return f.read()

    target_units, target_headings = set(), set()
    for relative in manifest["destinos"]:
        units, headings = content_units(read_note(relative))
        target_units.update(unit for _, unit in units)
        target_headings.update(normalize_unit(title) for _, title in headings)

    report = []
    for source in manifest["fontes"]:
        units, headings = content_units(read_note(source["caminho"]), source.get("linhas"))
        missing = [(number, unit) for number, unit in units if unit not in target_units]
        renamed = [(number, title) for number, title in headings
                   if not source.get("linhas") and normalize_unit(title) not in target_headings]
        report.append((source["caminho"], len(units), missing, renamed))
    return manifest.get("nome", manifest_path), report


def print_conservation(manifests):
    failed = False
    for manifest_path in manifests:
        name, report = check_conservation(manifest_path)
        total = sum(count for _, count, _, _ in report)
        lost = sum(len(missing) for _, _, missing, _ in report)
        status = "APROVADO" if lost == 0 else "REPROVADO"
        print(f"# Conservação: {name}\n")
        print(f"- Manifesto: `{os.path.relpath(manifest_path, PROJECT_ROOT)}`")
        print(f"- {status}: {fmt(total - lost)} de {fmt(total)} linhas de conteúdo encontradas no destino\n")
        for path, count, missing, renamed in report:
            mark = "ok" if not missing else f"{len(missing)} linha(s) faltando"
            print(f"- `{path}`: {count} linhas, {mark}")
            for number, unit in missing[:40]:
                print(f"    - linha {number}: {unit[:160]}")
            if len(missing) > 40:
                print(f"    - ... e mais {len(missing) - 40}")
            for number, title in renamed:
                print(f"    - (título reescrito, só informativo) linha {number}: {title[:120]}")
        print()
        failed = failed or lost > 0
    return failed


def fmt(number):
    return f"{number:,}".replace(",", ".")


def section(lines, title, items, render, limit=60):
    lines.append(f"\n## {title} ({len(items)})\n")
    if not items:
        lines.append("Nada a apontar.")
        return
    for item in items[:limit]:
        lines.append(f"- {render(item)}")
    if len(items) > limit:
        lines.append(f"- ... e mais {len(items) - limit}")


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--env-file", default=DEFAULT_ENV_FILE)
    parser.add_argument("--remote-file", help="JSON ou linhas caminho|hash da wiki publicada")
    parser.add_argument("--offline", action="store_true", help="só checagens locais")
    parser.add_argument("--stale-days", type=int, default=120)
    parser.add_argument("--strict", action="store_true", help="sai com código 1 se houver drift ou link quebrado")
    parser.add_argument("--no-report", action="store_true", help="não grava o relatório em outputs/vault-lint/")
    parser.add_argument("--conservacao", nargs="+", metavar="MANIFESTO",
                        help="só o teste de conservação: confere se o conteúdo das notas de origem "
                             "existe nas notas de destino (sai com 1 se faltar alguma linha)")
    args = parser.parse_args()

    if args.conservacao:
        sys.exit(1 if print_conservation(args.conservacao) else 0)

    today = date.today()
    notes, attachments = load_local()
    local_hashes = {path: note["hash"] for path, note in notes.items()}

    remote, last_run, remote_source = (None, None, "pulado (--offline)")
    if not args.offline:
        try:
            remote, last_run, remote_source = load_remote(args)
        except Exception as error:  # rede ou credencial: o lint local continua valendo
            remote_source = f"falhou ao ler a wiki: {error.__class__.__name__}: {error}"

    only_local = only_remote = changed = []
    if remote is not None:
        only_local = sorted(set(local_hashes) - set(remote))
        only_remote = sorted(set(remote) - set(local_hashes))
        changed = sorted(path for path in set(local_hashes) & set(remote) if local_hashes[path] != remote[path])

    broken, ambiguous, missing_files, anchor_links = check_links(notes, attachments)
    no_frontmatter, no_date, stale = check_staleness(notes, args.stale_days, today)
    budget = check_budget()

    lines = [
        f"# Lint do vault: {today.isoformat()}\n",
        f"- Vault local: {len(notes)} notas elegíveis em `Afinz-CRM-Midia-Vault/`",
        f"- Wiki publicada: {fmt(len(remote)) + ' notas, ' if remote is not None else ''}fonte {remote_source}",
    ]
    if last_run:
        lines.append(f"- Último sync concluído: {last_run['completed_at'][:16].replace('T', ' ')} UTC, "
                     f"origem `{last_run['source']}`, {last_run['changed_count']} notas alteradas")
    if remote is not None:
        status = "sincronizado" if not (only_local or only_remote or changed) else "COM DRIFT"
        lines.append(f"- Estado: **{status}** ({len(only_local)} só local, {len(only_remote)} só na wiki, "
                     f"{len(changed)} com conteúdo diferente)")

    if remote is not None:
        section(lines, "Só no vault local (não publicadas)", only_local, lambda p: f"`{p}`")
        section(lines, "Só na wiki (apagadas ou renomeadas no local)", only_remote, lambda p: f"`{p}`")
        section(lines, "Conteúdo diferente (local mais novo ou wiki editada)", changed, lambda p: f"`{p}`")
        section(lines, "Duplicadas por hash na wiki", duplicates(remote), lambda g: " = ".join(f"`{p}`" for p in g))
    section(lines, "Duplicadas por hash no local", duplicates(local_hashes), lambda g: " = ".join(f"`{p}`" for p in g))
    section(lines, "Wikilinks sem alvo", broken, lambda b: f"`{b[0]}` → `[[{b[1]}]]`")
    section(lines, "Wikilinks ambíguos (mesmo nome em mais de uma pasta)", ambiguous,
            lambda a: f"`{a[0]}` → `[[{a[1]}]]` pode ser {', '.join(a[2])}")
    section(lines, "Anexos referenciados que não existem", missing_files, lambda m: f"`{m[0]}` → `{m[1]}`")
    section(lines, "Links copiados da ontologia compilada (trocar por wikilink)", anchor_links,
            lambda a: f"`{a[0]}` → `[{a[1]}](#...)` deveria ser `[[{a[1]}]]`")
    section(lines, "Notas sem frontmatter", no_frontmatter, lambda p: f"`{p}`")
    section(lines, "Notas sem data `atualizado` legível", no_date, lambda p: f"`{p}`")
    section(lines, f"Notas sem revisão há mais de {args.stale_days} dias (fora `Assunto-*`)", stale,
            lambda s: f"`{s[0]}` · atualizado {s[1]} ({s[2]} dias) · {s[3] or 'sem status'}", limit=200)

    if budget is None:
        lines.append("\n## Orçamento de contexto\n\n`docs/ontology/` não existe: rode `python scripts/bundle_vault.py`.")
    else:
        over = [(name, tokens) for name, tokens in budget if tokens > TOKEN_BUDGET]
        section(lines, f"Arquivos de `docs/ontology/` acima de {fmt(TOKEN_BUDGET)} tokens", over,
                lambda o: f"`{o[0]}` ~{fmt(o[1])} tokens")

    report = "\n".join(lines) + "\n"
    print(report)
    if not args.no_report:
        os.makedirs(REPORT_DIR, exist_ok=True)
        path = os.path.join(REPORT_DIR, f"vault-lint-{today.isoformat()}.md")
        with open(path, "w", encoding="utf-8") as f:
            f.write(report)
        print(f"Relatório salvo em {path}")

    has_problem = bool(only_local or only_remote or changed or broken or anchor_links)
    sys.exit(1 if args.strict and has_problem else 0)


if __name__ == "__main__":
    main()
