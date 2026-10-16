# -*- coding: utf-8 -*-
"""Encaixa artes geradas (Gemini, ChatGPT) no header dinâmico e compara as opções no e-mail.

Uso:
    python scripts/preparar_arte.py input.json --email "E-mail 5" gemini_A1.png chatgpt_A1.png
    python scripts/preparar_arte.py input.json --email "E-mail 5" cena.png --caminho B

Para cada imagem:
    - corta no formato do header (1247 x 977) sem distorcer;
    - caminho B (--caminho B ou nome terminando em _B1, _B2...): a IA fez só a cena e o script
      coloca o cartão oficial (assets/marca/cartao_oficial_frente.png), inclinado, com espessura
      e sombra;
    - esfuma a borda esquerda até o azul exato do header (#4A5BA6) e aplica o esfumado de cantos
      das artes aprovadas (assets/marca/mascara_bordas.png);
    - confere proporção original e se as bordas fundem com o header.

Saída em previa/artes/: arte_<nome>.png (a arte final, pronta para subir no SFMC) e
quadro_artes_desktop.png / quadro_artes_celular.png, com a arte atual e as candidatas lado a lado
dentro do e-mail do arquivo. Depois de escolher, rode montar_previa.py com
--arte "E-mail 5=previa/artes/arte_<nome>.png". Precisa de Pillow; o PNG usa o Playwright.
"""
import argparse
import base64
import html as html_lib
import io
import json
import re
import sys
from pathlib import Path

from PIL import Image, ImageChops, ImageFilter

SCRIPTS = Path(__file__).resolve().parent
SKILL_DIR = SCRIPTS.parent
sys.path.insert(0, str(SCRIPTS))
from montar_previa import email_values, embed_images, fill, load_manifest, pick_email, to_png  # noqa: E402

W, H = 1247, 977
HEADER_BLUE = (74, 91, 166)  # #4A5BA6
MARCA = SKILL_DIR / "assets" / "marca"


def cover(img, w, h):
    scale = max(w / img.width, h / img.height)
    resized = img.resize((round(img.width * scale), round(img.height * scale)), Image.LANCZOS)
    left, top = (resized.width - w) // 2, (resized.height - h) // 2
    return resized.crop((left, top, left + w, top + h))


def place_card(scene):
    """Cartão oficial em pé, inclinado, com espessura e sombra, no centro da metade inferior."""
    card = Image.open(MARCA / "cartao_oficial_frente.png").convert("RGBA")
    target_h = int(H * 0.62)
    card = card.resize((int(card.width * target_h / card.height), target_h), Image.LANCZOS)
    edge = Image.new("RGBA", card.size, (200, 205, 225, 255))
    edge.putalpha(card.getchannel("A"))
    stack = Image.new("RGBA", (card.width + 8, card.height + 8), (0, 0, 0, 0))
    stack.alpha_composite(edge, (6, 6))
    stack.alpha_composite(card, (0, 0))
    rotated = stack.rotate(-14, expand=True, resample=Image.BICUBIC)
    shadow = Image.new("RGBA", rotated.size, (18, 22, 70, 0))
    shadow.putalpha(rotated.getchannel("A").point(lambda v: int(v * 0.55)).filter(ImageFilter.GaussianBlur(26)))
    x, y = int(W * 0.52 - rotated.width / 2), int(H * 0.58 - rotated.height / 2)
    out = scene.copy()
    out.alpha_composite(shadow, (x + 30, y + 40))
    out.alpha_composite(rotated, (x, y))
    return out


def prepare(path, with_card):
    raw = Image.open(path)
    notes = [f"original {raw.width}x{raw.height} (proporção {raw.width / raw.height:.2f}; o header usa 1.28)"]
    img = raw.convert("RGBA")
    if img.getchannel("A").getextrema()[0] < 250:
        bg = Image.new("RGBA", img.size, HEADER_BLUE + (255,))
        bg.alpha_composite(img)
        img = bg
        notes.append("tinha transparência: fundo azul do header aplicado")
    img = cover(img, W, H)
    if with_card:
        img = place_card(img)
        notes.append("cartão oficial colocado pelo script (caminho B)")

    def edge(points):
        avg = tuple(sum(img.getpixel(p)[i] for p in points) // len(points) for i in range(3))
        return sum(abs(avg[i] - HEADER_BLUE[i]) for i in range(3))
    left = edge([(x, y) for y in range(0, H, 10) for x in (1, 6, 12)])
    rest = edge([(x, y) for x in range(0, W, 25) for y in (2, H - 3)] + [(W - 3, y) for y in range(0, H, 25)])
    if left > 3:
        ramp = Image.linear_gradient("L").rotate(-90, expand=True).resize((int(W * 0.12), H))
        band = Image.new("RGBA", ramp.size, HEADER_BLUE + (255,))
        band.putalpha(ramp)
        img.alpha_composite(band, (0, 0))
        notes.append(f"borda esquerda esfumada até #4A5BA6 (antes: distância {left})")
    notes.append("bordas fundem com o header" if rest <= 70 else f"ATENÇÃO: bordas de cima, baixo ou direita destoam do azul (distância {rest})")
    mask = Image.open(MARCA / "mascara_bordas.png").convert("L").resize((W, H))
    img.putalpha(ImageChops.multiply(img.getchannel("A"), mask))
    return img, notes


def data_uri_bytes(data, mime="image/png"):
    return f"data:{mime};base64,{base64.b64encode(data).decode()}"


def data_uri(img):
    buf = io.BytesIO()
    img.save(buf, "PNG")
    return data_uri_bytes(buf.getvalue())


BOARD = """<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>{title}</title><style>
body{{margin:0;padding:24px 18px;background:#e9ebf3;font-family:Segoe UI,Arial,sans-serif;color:#2C3490}}
.board{{display:flex;gap:18px;align-items:flex-start}} h2{{margin:0;font-size:16px}} p{{margin:2px 0 10px;font-size:11px;font-weight:700;color:#4A4F6A;max-width:{width}px}}
.frame{{background:#f2f4f7;padding:6px;border-radius:4px;height:{clip}px;overflow:hidden}} .atual .frame{{outline:2px solid #2C3490}}
iframe{{display:block;border:0;width:{width}px;height:1700px;background:#f2f4f7}}
</style></head><body><div class="board">{cols}</div>
<script>let n=document.querySelectorAll("iframe").length;document.querySelectorAll("iframe").forEach(f=>f.addEventListener("load",()=>{{if(--n===0)setTimeout(()=>window.__ready=true,500)}}));setTimeout(()=>window.__ready=true,12000);</script>
</body></html>"""


def main():
    parser = argparse.ArgumentParser(description="Encaixa e compara artes do header dinâmico.")
    parser.add_argument("input", help="input_gaas_emails_*.json com o e-mail")
    parser.add_argument("artes", nargs="+", help="imagens geradas")
    parser.add_argument("--email", required=True, help='ex.: "E-mail 5"')
    parser.add_argument("--caminho", choices=["A", "B"], help="B: colocar o cartão oficial em todas")
    parser.add_argument("--rede", default=None)
    parser.add_argument("--saida", default="previa/artes")
    args = parser.parse_args()

    payload = json.loads(Path(args.input).read_text(encoding="utf-8"))
    manifest = load_manifest()
    ruler = next(r for r in manifest["rulers"] if r["segment"] == payload["ruler"]["segment"] and r["partner"] == payload["ruler"]["partner"])
    network = args.rede or next(iter(ruler["places"]))
    email = next((e for e in payload["emails"] if e["sequence"] == args.email), {})
    entry, _ = pick_email(ruler, args.email)
    values = email_values(email, entry, network, ruler["places"][network])
    skeleton = (SKILL_DIR / entry["networks"][network]["skeleton"]["nome"]).read_text(encoding="utf-8")
    if "@@HEADER_IMAGEM_CARTAO@@" not in skeleton:
        sys.exit("Este e-mail não tem header com imagem no template: não há onde encaixar a arte.")
    out = Path(args.saida)
    out.mkdir(parents=True, exist_ok=True)

    columns = [("Atual", embed_images(values.get("HEADER_IMAGEM_CARTAO", ""), manifest), "arte que está no e-mail hoje", True)]
    for path in map(Path, args.artes):
        with_card = args.caminho == "B" or bool(re.search(r"_b\d*$", path.stem, re.I))
        img, notes = prepare(path, with_card)
        final = out / f"arte_{path.stem}.png"
        img.save(final)
        print(f"{path.name}: " + "; ".join(notes) + f" -> {final}")
        columns.append((path.stem, data_uri(img), notes[-1], False))

    for kind, width, clip in (("desktop", 680, 760), ("celular", 375, 1180)):
        cols = []
        for name, src, note, current in columns:
            page = embed_images(fill(skeleton, {**values, "HEADER_IMAGEM_CARTAO": src}, True), manifest)
            cols.append(f'<div class="col{" atual" if current else ""}"><h2>{html_lib.escape(name)}</h2><p>{html_lib.escape(note)}</p>'
                        f'<div class="frame"><iframe srcdoc="{html_lib.escape(page, quote=True)}"></iframe></div></div>')
        board = out / f"quadro_artes_{kind}.html"
        board.write_text(BOARD.format(title=f"Artes do header · {kind}", cols="".join(cols), width=width, clip=clip), encoding="utf-8")
        problem = to_png(board, board.with_suffix(".png"), len(cols) * (width + 30) + 40)
        print(f"Quadro: {board.with_suffix('.png') if not problem else board}" + (f"  ({problem})" if problem else ""))


if __name__ == "__main__":
    main()
