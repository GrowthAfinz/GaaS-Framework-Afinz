# -*- coding: utf-8 -*-
"""Monta a prévia fiel dos e-mails de um input_gaas_emails_*.json, sem acesso ao GaaS.

Os esqueletos em assets/previa/ foram renderizados pelo próprio GaaS a partir do template
real da régua (PLURIX V13): todo o layout, links, assinatura e textos legais já estão lá, e
cada campo editorial virou um marcador @@CAMPO@@. Este script só troca os marcadores pelos
textos do arquivo, monta o segundo bloco com scripts/content_blocks.py e aplica as mesmas
regras do template para nome, limite e supermercado.

Uso:
    python scripts/montar_previa.py input.json              # quadros da régua na rede AMIGAO
    python scripts/montar_previa.py input.json --rede BOA   # outra assinatura
    python scripts/montar_previa.py input.json --sem-nome   # pessoa sem nome na base
    python scripts/montar_previa.py input.json --todas      # um par de quadros por rede

Gera dois quadros com todos os e-mails da régua lado a lado (os que o arquivo não mexe
aparecem como estão hoje, com o rótulo "pronto (atual)"):
    previa/quadro_celular.png   (375px por e-mail)
    previa/quadro_desktop.png   (680px por e-mail)
Esses dois PNGs são a entrega para o analista. O PNG usa o Playwright
(pip install playwright && python -m playwright install chromium); sem ele, o script deixa
quadro_celular.html e quadro_desktop.html com o mesmo conteúdo. Cada e-mail também sai
solto em previa/emails/.
Fora o Playwright (opcional, só para o PNG), usa a biblioteca padrão do Python.
"""
import argparse
import base64
import mimetypes
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


def embed_images(page, manifest):
    """O sandbox da IA não tem internet: troca a URL de cada imagem pelo arquivo do pacote,
    embutido no próprio HTML (data URI), para o PNG sair com as imagens."""
    for url, path in manifest.get("images", {}).items():
        if url in page:
            file = SKILL_DIR / path
            if file.exists():
                mime = mimetypes.guess_type(file.name)[0] or "image/png"
                page = page.replace(url, f"data:{mime};base64,{base64.b64encode(file.read_bytes()).decode()}")
    return page


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


STATUS_LABEL = {"ready": "pronto", "draft": "rascunho", "needs_review": "em revisão", "blocked": "bloqueado"}

BOARD = """<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<title>{title}</title><style>
body{{margin:0;padding:24px 18px 32px;background:#e9ebf3;font-family:Segoe UI,Arial,sans-serif;color:#2C3490}}
.board{{display:flex;gap:18px;align-items:flex-start}}
.col{{flex:0 0 auto}} .col h2{{margin:0;font-size:17px;letter-spacing:.3px}} .col p{{margin:2px 0 10px;font-size:11px;font-weight:700;color:#4A4F6A}}
.frame{{background:#f2f4f7;padding:{pad}px;border-radius:4px}}
.col.nova .frame{{outline:2px dashed #E7A921;outline-offset:-2px}}
iframe{{display:block;border:0;width:{width}px;background:#f2f4f7}}
</style></head><body><div class="board">{columns}</div>
<script>
const frames=[...document.querySelectorAll("iframe")];let pending=frames.length;
const fit=f=>{{const d=f.contentDocument;f.style.height=Math.max(d.documentElement.scrollHeight,d.body.scrollHeight)+"px";}};
frames.forEach(f=>{{const done=()=>{{fit(f);if(--pending===0)setTimeout(()=>{{frames.forEach(fit);window.__ready=true;}},400);}};
  if(f.contentDocument&&f.contentDocument.readyState==="complete"&&f.contentDocument.body&&f.contentDocument.body.childElementCount)done();else f.addEventListener("load",done,{{once:true}});}});
setTimeout(()=>{{frames.forEach(fit);window.__ready=true;}},15000);
</script></body></html>"""


def label(entry, email):
    """Rótulo da coluna: e-mail que o arquivo não mexe aparece como está hoje."""
    if email is None:
        return f'{STATUS_LABEL.get(entry.get("status", ""), entry.get("status", "") or "atual")} (atual)'
    return "proposta" if entry.get("exists") else "proposta (novo)"


def board_html(ruler, columns, width, title):
    cells = []
    for sequence, week, caption, page, new in columns:
        doc = html_lib.escape(page, quote=True)
        cells.append(f'<div class="col{" nova" if new else ""}"><h2>{html_lib.escape(sequence)} · {html_lib.escape(week)}</h2>'
                     f'<p>{html_lib.escape(caption)}</p><div class="frame"><iframe srcdoc="{doc}" title="{html_lib.escape(sequence)}"></iframe></div></div>')
    return BOARD.format(title=html_lib.escape(title), columns="".join(cells), width=width, pad=6 if width < 500 else 8)


def to_png(html_path, png_path, page_width):
    """PNG do quadro com o Chromium do Playwright. Sem Playwright, fica o HTML (mesmo conteúdo)."""
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        return "sem Playwright: pip install playwright && python -m playwright install chromium"
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch()
            page = browser.new_page(viewport={"width": page_width, "height": 1000})
            page.goto(html_path.resolve().as_uri())
            page.wait_for_function("window.__ready === true", timeout=30000)
            page.screenshot(path=str(png_path), full_page=True)
            browser.close()
        return None
    except Exception as error:  # navegador ausente, sem rede para as imagens etc.
        return f"falhou ao gerar PNG ({error.__class__.__name__}: {str(error).splitlines()[0][:160]})"


def main():
    parser = argparse.ArgumentParser(description="Quadros de prévia (celular e desktop) da régua com o input_gaas_emails.")
    parser.add_argument("input")
    parser.add_argument("--rede", default=None, help="assinatura mostrada (padrão: a primeira da régua, AMIGAO)")
    parser.add_argument("--todas", action="store_true", help="um par de quadros para cada uma das 6 redes")
    parser.add_argument("--sem-nome", action="store_true", help="amostra de pessoa sem nome na base")
    parser.add_argument("--so-arquivo", action="store_true", help="só os e-mails do arquivo, sem os atuais da régua")
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
    networks = list(ruler["places"]) if args.todas else [args.rede or next(iter(ruler["places"]))]
    with_name = not args.sem_nome
    variant = "nome" if with_name else "sem_nome"
    out = Path(args.saida)
    (out / "emails").mkdir(parents=True, exist_ok=True)

    by_sequence = {e["sequence"]: e for e in payload["emails"]}
    sequences = sorted({e["sequence"] for e in ruler["emails"] if e.get("exists")} | set(by_sequence), key=number)
    if args.so_arquivo:
        sequences = [s for s in sequences if s in by_sequence]

    results = []
    for network in networks:
        columns = []
        for sequence in sequences:
            email = by_sequence.get(sequence)
            entry, approximate = pick_email(ruler, sequence)
            if network not in entry["networks"]:
                continue
            if approximate:
                print(f"REVISAR   {sequence}: sem esqueleto próprio, usei o layout do {entry['sequence']}.")
            values = email_values(email or {}, entry, network, ruler["places"][network])
            tokens = set(entry["networks"][network].get("tokens", []))
            hidden = [f for f, v in values.items() if v and f not in tokens and f in IMAGE_FIELDS]
            if email and hidden and network == networks[0]:
                print(f"REVISAR   {sequence}: {', '.join(hidden)} estava(m) sem imagem no e-mail atual; "
                      "a prévia mantém o layout sem imagem. Confira na importação do GaaS.")
            skeleton = (SKILL_DIR / entry["networks"][network]["skeleton"][variant]).read_text(encoding="utf-8")
            page = embed_images(fill(skeleton, values, with_name), manifest)
            missing = sorted(set(re.findall(r'https://[^\s"\'()<>]+?\.(?:png|jpe?g|gif|webp)', page)))
            if missing and network == networks[0]:
                print(f"REVISAR   {sequence}: {len(missing)} imagem(ns) fora do pacote; sem internet ela(s) aparece(m) quebrada(s). "
                      "Use imagens da régua ou da biblioteca listadas em references/regua-*.md.")
            slug = f'{sequence.replace(" ", "").replace("-", "").lower()}_{network.replace(" ", "").lower()}_{variant}.html'
            (out / "emails" / slug).write_text(page, encoding="utf-8")
            week = (email or {}).get("weekKey") or entry.get("weekKey", "")
            columns.append((sequence, week, label(entry, email), page, email is not None and not entry.get("exists")))

        suffix = "" if len(networks) == 1 else f"_{network.replace(' ', '').lower()}"
        for kind, width in (("celular", 375), ("desktop", 680)):
            html_path = out / f"quadro_{kind}{suffix}.html"
            title = f'{ruler["segment"]} · {network} · {kind}'
            html_path.write_text(board_html(ruler, columns, width, title), encoding="utf-8")
            page_width = len(columns) * (width + 34) + 40
            problem = to_png(html_path, html_path.with_suffix(".png"), page_width)
            results.append((html_path.with_suffix(".png") if not problem else html_path, problem))

    for path, problem in results:
        print(f"Quadro: {path}" + (f"  ({problem}; entregue o HTML)" if problem else ""))


if __name__ == "__main__":
    main()
