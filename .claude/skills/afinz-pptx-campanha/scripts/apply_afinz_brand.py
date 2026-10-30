#!/usr/bin/env python3
"""Aplica a identidade de marca Afinz a um .pptx de forma determinística.

Resolve o problema de o template ainda carregar cores default do Office: varre
todo texto/shape, troca a fonte para a fonte de marca e remapeia cores "fora da
marca" para a paleta Afinz, respeitando o público (PF/PJ/institucional).

Uso:
    python apply_afinz_brand.py deck.pptx --audience pf
    python apply_afinz_brand.py deck.pptx --audience pj --font "Lembra"

--audience  pf | pj | institucional   (define a cor dominante)
--font      fonte gravada no arquivo (default: Calibri — fallback seguro da Lembra)

O script é idempotente: rodar duas vezes produz o mesmo resultado.
"""
import argparse
import sys

try:
    from pptx import Presentation
    from pptx.dml.color import RGBColor
except ImportError:
    sys.exit("python-pptx não instalado. Rode: pip install python-pptx --break-system-packages")

# --- Paleta oficial Afinz (Guia de Marca 2024) ---
VERDE_PJ = RGBColor(0xD3, 0xFF, 0x00)
AZUL_PF = RGBColor(0x00, 0xC6, 0xCC)
VERMELHO = RGBColor(0xE7, 0x47, 0x42)
PRETO = RGBColor(0x00, 0x00, 0x00)
BRANCO = RGBColor(0xFF, 0xFF, 0xFF)

AFINZ_PALETTE = {VERDE_PJ, AZUL_PF, VERMELHO, PRETO, BRANCO}

# Cores default do Office que NÃO pertencem à marca e devem ser remapeadas.
# Mapeamos para o acento dominante do público escolhido.
OFFICE_DEFAULTS = {
    RGBColor(0x44, 0x72, 0xC4),  # azul Office
    RGBColor(0xED, 0x7D, 0x31),  # laranja Office
    RGBColor(0x5B, 0x9B, 0xD5),  # azul claro Office
    RGBColor(0x70, 0xAD, 0x47),  # verde Office
    RGBColor(0xFF, 0xC0, 0x00),  # amarelo Office
    RGBColor(0xA5, 0xA5, 0xA5),  # cinza Office (mantido como cinza neutro -> preto)
    RGBColor(0x05, 0x63, 0xC1),  # azul hyperlink Office
    RGBColor(0x95, 0x4F, 0x72),  # roxo Office
}


def dominant_for(audience: str) -> RGBColor:
    """Cor dominante de acento conforme o público."""
    if audience == "pf":
        return AZUL_PF
    if audience == "pj":
        return VERDE_PJ
    # institucional: usa azul como acento primário, verde apoia (alternância manual nos slides)
    return AZUL_PF


def is_grayish(color: RGBColor) -> bool:
    """True se a cor é um cinza/preto/branco neutro (não deve virar acento)."""
    r, g, b = color[0], color[1], color[2]
    return abs(r - g) <= 12 and abs(g - b) <= 12 and abs(r - b) <= 12


def remap_color(color: RGBColor, dominant: RGBColor) -> RGBColor | None:
    """Decide a cor de marca para uma cor existente. Retorna None se deve manter."""
    if color is None:
        return None
    # Já é cor de marca → mantém.
    if color in AFINZ_PALETTE:
        return None
    # Cinza neutro → vira preto (texto/elemento neutro da marca).
    if is_grayish(color):
        return PRETO
    # Cor default do Office ou qualquer cor "fora da marca" → vira o acento dominante.
    return dominant


def process_run(run, font_name: str, dominant: RGBColor) -> None:
    """Aplica fonte e remapeia cor de fonte de um run de texto."""
    run.font.name = font_name
    try:
        if run.font.color and run.font.color.type is not None:
            current = run.font.color.rgb
            new = remap_color(current, dominant)
            if new is not None:
                run.font.color.rgb = new
    except (AttributeError, TypeError):
        pass  # cor herdada do tema/placeholder — deixamos o tema resolver


def process_shape_fill(shape, dominant: RGBColor) -> None:
    """Remapeia preenchimento sólido de shapes (barras, blocos, ícones)."""
    try:
        fill = shape.fill
        if fill.type is not None and fill.type == 1:  # solid
            current = fill.fore_color.rgb
            new = remap_color(current, dominant)
            if new is not None:
                fill.fore_color.rgb = new
    except (AttributeError, TypeError, ValueError):
        pass


def walk_shapes(shapes, font_name: str, dominant: RGBColor) -> int:
    """Percorre shapes recursivamente (inclui grupos). Retorna nº de runs tocados."""
    touched = 0
    for shape in shapes:
        if shape.shape_type == 6:  # group
            touched += walk_shapes(shape.shapes, font_name, dominant)
            continue
        process_shape_fill(shape, dominant)
        if shape.has_text_frame:
            for para in shape.text_frame.paragraphs:
                for run in para.runs:
                    process_run(run, font_name, dominant)
                    touched += 1
        # Tabelas
        if shape.has_table:
            for row in shape.table.rows:
                for cell in row.cells:
                    for para in cell.text_frame.paragraphs:
                        for run in para.runs:
                            process_run(run, font_name, dominant)
                            touched += 1
    return touched


def main() -> None:
    ap = argparse.ArgumentParser(description="Aplica marca Afinz a um .pptx")
    ap.add_argument("pptx", help="caminho do .pptx a processar (editado in place)")
    ap.add_argument("--audience", choices=["pf", "pj", "institucional"], required=True)
    ap.add_argument("--font", default="Calibri",
                    help="fonte gravada (default Calibri, fallback seguro da Lembra)")
    ap.add_argument("--extra-accent", default="",
                    help="hex extras (separados por vírgula) a PRESERVAR sem remapear — "
                         "use para acentos sazonais/temáticos (ex: dourado de campanha de "
                         "Copa do Mundo: --extra-accent C8A94A,FFC107). Sem isso, qualquer "
                         "cor fora da paleta padrão vira o acento dominante do público.")
    args = ap.parse_args()

    prs = Presentation(args.pptx)
    dominant = dominant_for(args.audience)

    extra_hexes = [h.strip().lstrip("#") for h in args.extra_accent.split(",") if h.strip()]
    extra_colors = {RGBColor.from_string(h.upper()) for h in extra_hexes}
    if extra_colors:
        AFINZ_PALETTE.update(extra_colors)  # preserva acentos temáticos p/ esta execução

    total = 0
    for slide in prs.slides:
        total += walk_shapes(slide.shapes, args.font, dominant)

    prs.save(args.pptx)
    cor = {"pf": "azul #00C6CC", "pj": "verde #D3FF00",
           "institucional": "azul+verde"}[args.audience]
    print(f"OK — marca Afinz aplicada ({args.audience}, acento {cor}). "
          f"Fonte: {args.font}. Runs tocados: {total}.")


if __name__ == "__main__":
    main()
