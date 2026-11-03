import math
import os
import re
import sys
from datetime import date

# Achar a raiz do projeto (uma pasta acima da pasta do script)
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)

VAULT_DIR = os.path.join(PROJECT_ROOT, "Afinz-CRM-Midia-Vault")
OUTPUT_FILE = os.path.join(PROJECT_ROOT, "docs", "AFINZ_GAAS_ONTOLOGY.md")
LAYER_DIR = os.path.join(PROJECT_ROOT, "docs", "ontology")
IGNORE_DIRS = [".obsidian", "99-Templates"]

GENERATED_MARKER = "<!-- gerado por scripts/bundle_vault.py: não editar à mão -->"

# Decisão D-2 do ADR-001: até 120k tokens um arquivo pode ser carregado inteiro.
# A divisão mira abaixo disso para sobrar janela para a tarefa.
TOKEN_BUDGET = 120_000
SPLIT_TARGET = 100_000
# Estimativa por caracteres. Português com tabelas markdown fica perto de 3,5.
CHARS_PER_TOKEN = 3.5

# Camadas: (chave, título, quando carregar). A ordem define a ordem no INDEX.
LAYERS = [
    ("core", "Núcleo: conceitos, dimensões, estratégia e IA",
     "Primeira camada de qualquer tarefa. Conceitos, dimensões, função-objetivo, regras de proveniência e de memória."),
    ("dados", "Dados: entidades do Supabase, produtos e performance",
     "Tarefa que lê ou escreve tabela, cruza métrica, cita produto ou usa snapshot de performance."),
    ("operacao", "Operação: SFMC, e-mails dinâmicos e abas do GaaS",
     "Tarefa de jornada, DE, template, ingestão ou comportamento de uma aba."),
    ("engenharia", "Engenharia: código, arquitetura e Report Live",
     "Tarefa que muda código, migration, deploy ou o Report Live."),
    ("ia", "IA e aprendizado: loop, Report Live, Dossiê Mestre e conectores",
     "Tarefa sobre o loop de Aprendizado e Memória, Report Live, motor de insights ou conectores (GA4, MCP)."),
    ("evolucao", "Evolução: decisões, governança, catálogos e changelog",
     "Tarefa que precisa de decisão aberta ou tomada, inconsistência de dado, glossário ou histórico do vault."),
    ("resultados", "Resultados: histórico, segmentos, parceiros e retrospectivas",
     "Tarefa que lê resultado passado de CRM, B2C ou mídia, ou fala de um segmento ou parceiro."),
    ("legado", "Legado: notas fora da estrutura nova (foto de jun/2026)",
     "Só para consultar histórico. Nada aqui é regra vigente: cada nota aponta para a página atual."),
    ("assuntos-crm", "Assuntos gerados: CRM, Copa, B2C, funis e documentos",
     "Só quando a tarefa é sobre uma operação específica de CRM. Inventário gerado em 03/10/2026."),
    ("assuntos-midia", "Assuntos gerados: mídia paga e mapeamento de campanhas",
     "Só quando a tarefa é sobre uma campanha de mídia específica."),
    ("assuntos-rentabilizacao", "Assuntos gerados: rentabilização",
     "Só quando a tarefa é sobre uma operação específica de rentabilização."),
]

FOLDER_LAYER = {
    "00-Indice": "core",
    "01-Conceitos": "core",
    "03-Dimensoes": "core",
    "05-Estrategia": "core",
    "09-Inteligencia-IA": "ia",
    "02-Entidades-Dados": "dados",
    "06-Performance": "dados",
    "04-Operacao": "operacao",
    "08-Engenharia": "engenharia",
    "07-Evolucao": "evolucao",
    "10-Resultados": "resultados",
    "98-Legado": "legado",
}

# Regras de como pessoas e IAs leem e escrevem no vault: vão para o core mesmo
# morando em 09-Inteligencia-IA, porque valem para qualquer tarefa.
CORE_AI_NOTES = {
    "MOC-Inteligencia-IA.md",
    "Fontes-e-Proveniencia-Growth.md",
    "Roteamento-de-Memoria.md",
    "Padrao-Editorial-Enciclopedia.md",
    "Convenções-do-Vault.md",
    "Estrategia-de-Contexto.md",
    "Vault-como-Contexto.md",
    "Inteligencia-Compartilhada-GaaS.md",
}

RESULT_PREFIXES = ("Resultados-", "Historico-Resultados-", "Segmento-", "Parceiro-", "Retrospectiva-")


def fmt(number):
    return f"{number:,}".replace(",", ".")


def estimate_tokens(text):
    return math.ceil(len(text) / CHARS_PER_TOKEN)


def layer_of(relative_path):
    parts = relative_path.split("/")
    if len(parts) == 1:
        return "core"
    folder = parts[0]
    if folder == "07-Evolucao" and parts[-1].startswith("Assunto-"):
        prefix = parts[-1].split("-")[1]
        if prefix == "RENT":
            return "assuntos-rentabilizacao"
        if prefix in ("MID", "MAP", "meta"):
            return "assuntos-midia"
        return "assuntos-crm"
    if folder == "07-Evolucao" and parts[-1].startswith(RESULT_PREFIXES):
        return "resultados"
    if folder == "09-Inteligencia-IA" and parts[-1] in CORE_AI_NOTES:
        return "core"
    if relative_path == "00-Indice/Changelog-do-Vault.md":
        return "evolucao"
    return FOLDER_LAYER.get(folder, "evolucao")


def slugify(title):
    anchor = title.lower().replace(" ", "-").replace("/", "").replace("&", "")
    # Remove caracteres indesejados para âncoras válidas em markdown
    return re.sub(r"[^\w\-]", "", anchor)


def load_notes():
    notes = {}
    by_title = {}
    if not os.path.exists(VAULT_DIR):
        print(f"Erro: A pasta {VAULT_DIR} não existe no diretório atual.")
        return notes

    for root, dirs, files in os.walk(VAULT_DIR):
        # Ignorar diretórios específicos
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]

        for file in files:
            if file.endswith(".md"):
                file_path = os.path.join(root, file)
                title = os.path.splitext(file)[0]

                content = ""
                # Tentar ler com UTF-8 e cair para Latin-1 caso dê erro
                try:
                    with open(file_path, "r", encoding="utf-8") as f:
                        content = f.read()
                except UnicodeDecodeError:
                    try:
                        with open(file_path, "r", encoding="latin-1") as f:
                            content = f.read()
                    except Exception as e:
                        print(f"Erro ao ler arquivo {file_path}: {e}")
                        continue

                relative_path = os.path.relpath(file_path, VAULT_DIR).replace('\\', '/')
                by_title.setdefault(title, []).append({
                    "path": file_path,
                    "relative_path": relative_path,
                    "content": content
                })
    # Several folders contain README.md. Keep each source instead of silently
    # overwriting earlier notes under a basename-only dictionary key.
    for title, sources in by_title.items():
        for source in sources:
            key = title if len(sources) == 1 else source['relative_path'][:-3]
            notes[key] = source
    return notes

def parse_frontmatter(content):
    # Regex para capturar frontmatter YAML entre ---
    match = re.match(r"^---\s*\n(.*?)\n---\s*\n(.*)", content, re.DOTALL)
    if match:
        yaml_content = match.group(1)
        body = match.group(2)
        # Parse simples do YAML
        metadata = {}
        for line in yaml_content.split("\n"):
            if ":" in line:
                parts = line.split(":", 1)
                k = parts[0].strip()
                v = parts[1].strip().strip("[]'\"")
                metadata[k] = v
        return metadata, body
    return {}, content


def make_resolver(notes):
    by_path = {note["relative_path"].removesuffix(".md"): key for key, note in notes.items()}

    def resolve(link_target):
        destination, _, _ = link_target.partition('#')
        normalized = destination.replace('\\', '/').removesuffix('.md')
        resolved = by_path.get(normalized)
        if resolved is None and normalized in notes:
            resolved = normalized
        return resolved, normalized

    return resolve


def rewrite_wikilinks(body, resolve, href_for):
    # Limpar wikilinks do Obsidian para markdown padrão: [[Nota]] -> [Nota](#nota)
    # Trata links com alias: [[Nota|Texto]] -> [Texto](#nota)
    def replace_wikilink(match):
        link_content = match.group(1)
        if "|" in link_content:
            link_target, link_text = link_content.replace("\\|", "|").split("|", 1)
        else:
            link_target = link_content
            link_text = link_content
        resolved, normalized = resolve(link_target)
        return f"[{link_text}]({href_for(resolved, normalized)})"

    return re.sub(r"\[\[(.*?)\]\]", replace_wikilink, body)


def render_note(key, note, resolve, href_for):
    metadata, body = parse_frontmatter(note["content"])
    lines = [f"## {key}\n"]
    # Formatar metadados de forma legível
    if metadata:
        meta_str = " | ".join(f"**{k}:** `{v}`" for k, v in metadata.items())
        lines.append(f"> {meta_str}\n")
    lines.append(rewrite_wikilinks(body, resolve, href_for).strip())
    lines.append("\n\n---\n")
    return "\n".join(lines)


def build_ontology(notes, total_tokens_hint=None):
    resolve = make_resolver(notes)
    compiled_content = []
    compiled_content.append("# 🌐 AFINZ GaaS - Ontologia e Contexto de Negócio\n")
    compiled_content.append(GENERATED_MARKER + "\n")
    warning = ("> **IMPORTANTE:** arquivo único legado, gerado a partir do vault do Obsidian. "
               "Ele passa do limite de carga integral da decisão D-2 do ADR-001: "
               "**não carregue inteiro**. Para agentes, comece por `docs/ontology/INDEX.md` "
               "e carregue só as camadas da tarefa.")
    if total_tokens_hint:
        warning += f" Tamanho estimado: ~{fmt(total_tokens_hint)} tokens."
    compiled_content.append(warning + "\n")
    compiled_content.append("## 📌 Índice de Notas Compiladas\n")

    # Gerar índice ordenado
    for title in sorted(notes.keys()):
        compiled_content.append(f"- [{title}](#{slugify(title)})")
    compiled_content.append("\n---\n")

    # Adicionar o conteúdo de cada nota
    for title in sorted(notes.keys()):
        compiled_content.append(render_note(
            title, notes[title], resolve,
            lambda resolved, normalized: f"#{slugify(resolved or normalized)}"))

    return "\n".join(compiled_content)


def plan_layer_files(notes):
    """Distribui as notas em arquivos por camada, dividindo camadas acima do alvo."""
    resolve = make_resolver(notes)
    local_href = lambda resolved, normalized: f"#{slugify(resolved or normalized)}"
    by_layer = {key: [] for key, _, _ in LAYERS}
    for key in sorted(notes, key=lambda k: notes[k]["relative_path"]):
        by_layer[layer_of(notes[key]["relative_path"])].append(key)

    files = []  # (file_name, layer_key, [note keys])
    for layer_key, _, _ in LAYERS:
        sizes = {key: estimate_tokens(render_note(key, notes[key], resolve, local_href))
                 for key in by_layer[layer_key]}
        # Partes de tamanho parecido em vez de uma cheia e uma sobra minúscula.
        parts = max(1, math.ceil(sum(sizes.values()) / SPLIT_TARGET))
        target = sum(sizes.values()) / parts
        chunks, current, size = [], [], 0
        for key in by_layer[layer_key]:
            tokens = sizes[key]
            if current and size + tokens > target and len(chunks) < parts - 1:
                chunks.append(current)
                current, size = [], 0
            current.append(key)
            size += tokens
        if current:
            chunks.append(current)
        for index, chunk in enumerate(chunks, start=1):
            name = f"{layer_key}.md" if len(chunks) == 1 else f"{layer_key}-{index}.md"
            files.append((name, layer_key, chunk))
    return files


def build_layer_files(notes, files):
    resolve = make_resolver(notes)
    note_file = {key: name for name, _, keys in files for key in keys}
    layer_meta = {key: (title, when) for key, title, when in LAYERS}
    today = date.today().isoformat()
    rendered = {}

    for name, layer_key, keys in files:
        def href_for(resolved, normalized, current=name):
            anchor = slugify(resolved or normalized)
            target = note_file.get(resolved)
            if target is None or target == current:
                return f"#{anchor}"
            return f"{target}#{anchor}"

        title, when = layer_meta[layer_key]
        body = [render_note(key, notes[key], resolve, href_for) for key in keys]
        header = [
            f"# {title} ({name})\n",
            GENERATED_MARKER + "\n",
            f"> Compilado do vault em {today}. {len(keys)} notas. Quando carregar: {when}",
            "> Arquivo derivado: a fonte canônica é a nota no vault. Mapa completo em [INDEX.md](INDEX.md).\n",
            "## 📌 Notas neste arquivo\n",
        ]
        header += [f"- [{key}](#{slugify(key)})" for key in keys]
        header.append("\n---\n")
        rendered[name] = "\n".join(header) + "\n" + "\n".join(body)
    return rendered


def build_index(notes, files, rendered, monolith_tokens):
    layer_meta = {key: (title, when) for key, title, when in LAYERS}
    note_file = {key: name for name, _, keys in files for key in keys}
    today = date.today().isoformat()
    lines = [
        "# 🧭 Índice da ontologia por camada\n",
        GENERATED_MARKER + "\n",
        f"> Compilado em {today} a partir de `Afinz-CRM-Midia-Vault/` ({len(notes)} notas). "
        "Gerado por `python scripts/bundle_vault.py`.\n",
        "## Como usar (pessoas e IAs)\n",
        "1. Leia este índice inteiro. Ele é pequeno de propósito.",
        "2. Carregue `core.md`. É a camada que quase toda tarefa precisa.",
        "3. Carregue só as outras camadas que a tarefa toca, pela coluna \"Quando carregar\".",
        "4. Estes arquivos são derivados. A fonte canônica é a nota no vault: corrija lá e recompile.",
        "5. Número com 📊 é snapshot datado. Antes de afirmar tendência, confira no Supabase.",
        f"6. Nenhum arquivo aqui passa de {fmt(TOKEN_BUDGET)} tokens estimados (decisão D-2 do ADR-001). "
        "O arquivo único `docs/AFINZ_GAAS_ONTOLOGY.md` continua sendo gerado por compatibilidade, "
        f"mas tem ~{fmt(monolith_tokens)} tokens: não carregue inteiro.\n",
        "## Camadas\n",
        "| Arquivo | Camada | Notas | Tokens (est.) | Quando carregar |",
        "|---|---|---:|---:|---|",
    ]
    for name, layer_key, keys in files:
        title, when = layer_meta[layer_key]
        tokens = estimate_tokens(rendered[name])
        lines.append(f"| [{name}]({name}) | {title} | {len(keys)} | {fmt(tokens)} | {when} |")
    lines.append("\n## Catálogo de notas\n")
    lines.append("Notas geradas `Assunto-*` não são listadas uma a uma: abra o arquivo `assuntos-*` da tarefa.\n")

    current_folder = None
    for key in sorted(notes, key=lambda k: notes[k]["relative_path"]):
        relative_path = notes[key]["relative_path"]
        if layer_of(relative_path).startswith("assuntos-"):
            continue
        folder = relative_path.split("/")[0] if "/" in relative_path else "(raiz)"
        if folder != current_folder:
            lines.append(f"\n### {folder}\n")
            current_folder = folder
        metadata, _ = parse_frontmatter(notes[key]["content"])
        details = [metadata.get(field) for field in ("tipo", "atualizado", "status")]
        suffix = " · ".join(value for value in details if value)
        lines.append(f"- [{key}]({note_file[key]}#{slugify(key)})" + (f" · {suffix}" if suffix else ""))
    return "\n".join(lines) + "\n"


def write_text(path, text):
    with open(path, "w", encoding="utf-8") as f:
        f.write(text)


def remove_stale_layer_files(keep):
    for name in os.listdir(LAYER_DIR):
        path = os.path.join(LAYER_DIR, name)
        if name in keep or not name.endswith(".md"):
            continue
        with open(path, "r", encoding="utf-8", errors="replace") as f:
            head = f.read(400)
        if GENERATED_MARKER in head:
            os.remove(path)
            print(f"Removido arquivo de camada antigo: {name}")


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    print("Iniciando compilação do vault Obsidian...")
    notes = load_notes()
    if not notes:
        print("Nenhuma nota encontrada para compilar.")
        return

    print(f"Total de {len(notes)} notas carregadas.")

    # Garantir que as pastas de saída existem
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    os.makedirs(LAYER_DIR, exist_ok=True)

    monolith_tokens = estimate_tokens(build_ontology(notes))
    write_text(OUTPUT_FILE, build_ontology(notes, monolith_tokens))
    print(f"Arquivo único (legado) em: {OUTPUT_FILE}")
    print(f"  {os.path.getsize(OUTPUT_FILE) / 1024:.0f} KB, ~{fmt(monolith_tokens)} tokens estimados")

    files = plan_layer_files(notes)
    rendered = build_layer_files(notes, files)
    index = build_index(notes, files, rendered, monolith_tokens)
    for name, text in rendered.items():
        write_text(os.path.join(LAYER_DIR, name), text)
    write_text(os.path.join(LAYER_DIR, "INDEX.md"), index)
    remove_stale_layer_files(set(rendered) | {"INDEX.md"})

    print(f"\nCamadas em: {LAYER_DIR}")
    over_budget = []
    for name in ["INDEX.md"] + [name for name, _, _ in files]:
        text = index if name == "INDEX.md" else rendered[name]
        tokens = estimate_tokens(text)
        flag = "  ACIMA DO LIMITE" if tokens > TOKEN_BUDGET else ""
        print(f"  {name:32} ~{fmt(tokens):>8} tokens{flag}")
        if tokens > TOKEN_BUDGET:
            over_budget.append(name)

    if over_budget:
        print(f"\nAtenção: {len(over_budget)} arquivo(s) acima de {fmt(TOKEN_BUDGET)} tokens. "
              "Provavelmente uma nota sozinha é grande demais: quebre a nota no vault.")
    print("\nPróximo passo sugerido: python scripts/vault_lint.py (compara o vault local com a wiki do GaaS).")


if __name__ == "__main__":
    main()
