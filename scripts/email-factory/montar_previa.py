# -*- coding: utf-8 -*-
"""Monta a prévia fiel dos e-mails de um input_gaas_emails_*.json, sem acesso ao GaaS.

Os esqueletos em assets/previa/ foram renderizados pelo próprio GaaS a partir do template
real da régua (PLURIX V13): todo o layout, links, assinatura e textos legais já estão lá, e
cada campo editorial virou um marcador @@CAMPO@@. Este script só troca os marcadores pelos
textos do arquivo, monta o segundo bloco com scripts/content_blocks.py e aplica as mesmas
regras do template para nome, limite e supermercado.

Uso:
    python scripts/montar_previa.py input.json                 # rede AMIGAO, com e sem nome
    python scripts/montar_previa.py input.json --todas         # as 6 redes
    python scripts/montar_previa.py input.json --rede BOA --email "E-mail 4"
    python scripts/montar_previa.py input.json --saida pasta/  # padrão: ./previa

Gera previa/index.html (uma página com desktop 680px e celular 375px lado a lado, alternando
com/sem nome) e um .html solto por e-mail e rede. Mostre o index.html para o analista.
Só usa a biblioteca padrão do Python.
"""
import argparse
import html as html_lib
import json
import re
import sys
from pathlib import Path

SCRIPTS = Path(__file__).resolve().parent
SKILL_DIR = SCRIPTS.parent
sys.path.insert(0, str(SCRIPTS))
from validar_input import FIRST_NAME, is_governed, load_manifest, render_blocks, validate  # noqa: E402

SAMPLE_NAME = "Vania"
SAMPLE_LIMIT = "3.500,00"
NAME_REMOVALS = [", {{nome}}", "{{nome}}, ", " {{nome}}", "{{nome}}"]  # mesma ordem do template
TOKEN = re.compile(r"@@([A-Z0-9_]+)@@")
IMAGE_FIELDS = {"HEADER", "HEADER_IMAGEM_CARTAO", "BANNER_1_CORPO", "BANNER_2_CORPO"}
STRUCTURAL = {"DT_INICIO", "TP_CAMPANHA", "SEQUENCIA", "NM_PRODUTO_INTERNO"}


def band(message, with_name):
    text = message.strip()
    if not text:
        return ""
    if with_name:
        text = text.replace("{{nome}}", SAMPLE_NAME)
    else:
        for marker in NAME_REMOVALS:
            text = text.replace(marker, "")
    text = text.replace("{{limite}}", SAMPLE_LIMIT)
    return "" if "{{" in text or "%%" in text else text


def number(sequence):
    return int(re.sub(r"\D", "", sequence) or 0)


def pick_email(ruler, sequence):
    """Esqueleto do próprio e-mail; e-mail além do próximo usa o mais próximo de mesma paridade
    (a cor da faixa alterna entre ímpar e par)."""
    exact = next((e for e in ruler["emails"] if e["sequence"] == sequence), None)
    if exact:
        return exact, False
    n = number(sequence)
    same_parity = [e for e in ruler["emails"] if number(e["sequence"]) % 2 == n % 2]
    pool = same_parity or ruler["emails"]
    return max(pool, key=lambda e: number(e["sequence"])), True


def fill(skeleton, values, with_name):
    def swap(match):
        field = match.group(1)
        value = values.get(field, "")
        if field == "MENSAGEM_LIMITE":
            return band(value, with_name)
        return value
    page = TOKEN.sub(swap, skeleton)
    page = page.replace(FIRST_NAME, SAMPLE_NAME if with_name else "")
    # Campo de imagem vazio: o template real esconde a imagem; o esqueleto ficaria com src vazio.
    return re.sub(r'<img\b[^>]*\bsrc=""[^>]*>', "", page)


def email_values(email, entry, network, place):
    current = dict(entry["networks"][network]["current"])
    fields = {**email.get("fields", {}), **(email.get("networkOverrides") or {}).get(network, {})}
    for field, data in fields.items():
        if is_governed(field) or field == "COPY_2_PRETO" or field in STRUCTURAL or not data:
            continue
        value = re.sub(r"%%PRI_NOME%%|\bPRI_NOME\b", FIRST_NAME, data.get("value", ""))
        current[field] = value
    if email.get("secondBlock"):
        current["COPY_2_PRETO"] = render_blocks(email["secondBlock"])
    return {k: v.replace("{no_mercado}", place) for k, v in current.items()}


PAGE = """<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Prévia dos e-mails</title><style>
body{{margin:0;font-family:system-ui,Segoe UI,Arial,sans-serif;background:#eef1f6;color:#1f2937}}
header{{position:sticky;top:0;z-index:2;background:#0f3d4a;color:#fff;padding:14px 20px;display:flex;gap:16px;align-items:center;flex-wrap:wrap}}
header h1{{font-size:16px;margin:0}} header span{{font-size:12px;opacity:.8}}
.tabs{{display:flex;gap:6px;flex-wrap:wrap}} .tabs button{{border:0;border-radius:999px;padding:6px 12px;font-weight:600;cursor:pointer;background:#ffffff22;color:#fff}}
.tabs button[aria-pressed=true]{{background:#fff;color:#0f3d4a}}
section{{padding:18px 20px}} h2{{font-size:15px;margin:0 0 4px}} .meta{{font-size:12px;color:#64748b;margin-bottom:10px}}
.row{{display:flex;gap:18px;align-items:flex-start;overflow-x:auto}} figure{{margin:0}} figcaption{{font-size:11px;color:#64748b;margin-bottom:4px}}
iframe{{border:0;background:#fff;border-radius:10px;box-shadow:0 4px 18px #0f172a1f;height:1500px}}
.warn{{font-size:12px;background:#fff7e6;border:1px solid #f5c26b;border-radius:8px;padding:6px 10px;margin-bottom:8px}}
</style></head><body>
<header><h1>Prévia dos e-mails</h1><span>{subtitle}</span>
<div class="tabs" id="nome"><button aria-pressed="true" data-v="nome">Com nome ({name})</button><button aria-pressed="false" data-v="sem_nome">Sem nome na base</button></div>
<div class="tabs" id="redes">{network_tabs}</div></header>
{sections}
<script>
const data = {data};
let variant = "nome", network = {first_network};
function paint() {{
  document.querySelectorAll("section[data-email]").forEach(sec => {{
    const html = (data[sec.dataset.email][network] || {{}})[variant] || "<p style='font-family:sans-serif;padding:20px'>Sem prévia para esta rede.</p>";
    sec.querySelectorAll("iframe").forEach(f => {{ f.srcdoc = html; }});
  }});
  document.querySelectorAll("#nome button").forEach(b => b.setAttribute("aria-pressed", b.dataset.v === variant));
  document.querySelectorAll("#redes button").forEach(b => b.setAttribute("aria-pressed", b.dataset.v === network));
}}
document.querySelectorAll("#nome button").forEach(b => b.onclick = () => {{ variant = b.dataset.v; paint(); }});
document.querySelectorAll("#redes button").forEach(b => b.onclick = () => {{ network = b.dataset.v; paint(); }});
paint();
</script></body></html>"""


def main():
    parser = argparse.ArgumentParser(description="Prévia fiel dos e-mails do input_gaas_emails.")
    parser.add_argument("input")
    parser.add_argument("--rede", default="AMIGAO")
    parser.add_argument("--todas", action="store_true", help="gera as 6 redes")
    parser.add_argument("--email", help='só um e-mail, ex.: "E-mail 4"')
    parser.add_argument("--saida", default="previa")
    args = parser.parse_args()

    payload = json.loads(Path(args.input).read_text(encoding="utf-8"))
    manifest = load_manifest()
    errors, warnings = validate(payload, manifest)
    for line in errors:
        print(f"BLOQUEIA  {line}")
    for line in warnings:
        print(f"REVISAR   {line}")

    ruler = next((r for r in manifest["rulers"] if r["segment"] == payload["ruler"]["segment"] and r["partner"] == payload["ruler"]["partner"]), None)
    if not ruler:
        sys.exit("A régua do arquivo não está no pacote: exporte de novo no GaaS incluindo essa régua.")
    networks = list(ruler["places"]) if args.todas else [args.rede]
    out = Path(args.saida)
    out.mkdir(parents=True, exist_ok=True)

    data, sections = {}, []
    for email in payload["emails"]:
        if args.email and email["sequence"] != args.email:
            continue
        entry, approximate = pick_email(ruler, email["sequence"])
        data[email["sequence"]] = {}
        for network in networks:
            if network not in entry["networks"]:
                continue
            values = email_values(email, entry, network, ruler["places"][network])
            tokens = set(entry["networks"][network].get("tokens", []))
            hidden = [f for f, v in values.items() if v and f not in tokens and f in IMAGE_FIELDS]
            if hidden and network == networks[0]:
                print(f"REVISAR   {email['sequence']}: {', '.join(hidden)} estava(m) sem imagem no e-mail atual; "
                      "a prévia mantém o layout sem imagem. Confira na importação do GaaS.")
            data[email["sequence"]][network] = {}
            for variant, with_name in (("nome", True), ("sem_nome", False)):
                skeleton = (SKILL_DIR / entry["networks"][network]["skeleton"][variant]).read_text(encoding="utf-8")
                page = fill(skeleton, values, with_name)
                data[email["sequence"]][network][variant] = page
                slug = f'{email["sequence"].replace(" ", "").replace("-", "").lower()}_{network.replace(" ", "").lower()}_{variant}.html'
                (out / slug).write_text(page, encoding="utf-8")
        note = (f'<div class="warn">Sem esqueleto próprio: layout do {entry["sequence"]}. Links e semana são '
                f'definidos pelo GaaS na importação.</div>') if approximate else ""
        subject = html_lib.escape(email.get("fields", {}).get("ASSUNTO", {}).get("value", ""))
        pre = html_lib.escape(email.get("fields", {}).get("PRE_CABECALHO", {}).get("value", ""))
        sections.append(
            f'<section data-email="{html_lib.escape(email["sequence"])}"><h2>{html_lib.escape(email["sequence"])} · {html_lib.escape(email.get("weekKey", ""))}</h2>'
            f'<div class="meta">Assunto: <b>{subject or "(mantido)"}</b> · Pré-cabeçalho: {pre or "(mantido)"}</div>{note}'
            f'<div class="row"><figure><figcaption>Desktop (janela de 680px)</figcaption><iframe title="desktop" style="width:680px"></iframe></figure>'
            f'<figure><figcaption>Celular 375px</figcaption><iframe title="celular" style="width:375px"></iframe></figure></div></section>')

    tabs = "".join(f'<button aria-pressed="false" data-v="{html_lib.escape(n)}">{html_lib.escape(n)}</button>' for n in networks)
    index = PAGE.format(subtitle=html_lib.escape(f'{ruler["partner"]} · {ruler["segment"]}'), name=SAMPLE_NAME,
                        network_tabs=tabs, sections="".join(sections),
                        data=json.dumps(data, ensure_ascii=False).replace("</", "<\\/"),
                        first_network=json.dumps(networks[0]))
    (out / "index.html").write_text(index, encoding="utf-8")
    print(f"Prévia em {out / 'index.html'} ({len(data)} e-mail(s), {len(networks)} rede(s)).")


if __name__ == "__main__":
    main()
