# -*- coding: utf-8 -*-
"""Blocos de conteúdo fixos para os campos de texto do briefing (COPY_1_PRETO, COPY_2_PRETO).

Cada função devolve HTML de e-mail compacto, em uma linha só (seguro para CSV), com estilos
inline e tabelas, que funciona no Outlook e empilha no celular pela classe `stack-column`
do template Plurix V13. O HTML é sempre o mesmo: só o texto muda. Ver
references/content-blocks.md para quando usar cada bloco.

Uso como módulo:
    from content_blocks import benefit_grid, stat_tiles, check_list, steps, lead, closing
"""
from html import escape

NAVY = "#2C3490"
YELLOW = "#E7A921"
CARD = "#F4F5FB"
BORDER = "#E1E3F2"
MUTED = "#4A4F6A"
INK = "#242424"  # mesmo preto do texto principal (COR_COPY_PRETO_1)
DE_FIELD_LIMIT = 4000  # tamanho das colunas de texto da TB_BRIEFING_CAMPANHA_AQUISICAO


def _t(text, allow_html=False):
    """Texto do marketing: escapa, a não ser que já venha com <b>/<br> governado."""
    return text if allow_html else escape(text, quote=False)


def _badge(mark):
    return (f'<div style="width:30px;height:30px;line-height:30px;border-radius:15px;background-color:{YELLOW};'
            f'color:{NAVY};font-size:14px;font-weight:700;text-align:center;">{mark}</div>')


def lead(text, allow_html=True):
    """Frase de abertura do bloco, centralizada."""
    return f'<p style="margin:0 0 14px 0;text-align:center;">{_t(text, allow_html)}</p>'


def closing(text, allow_html=True):
    """Frase de fechamento em destaque, logo antes do botão."""
    return f'<p style="margin:16px 0 0 0;text-align:center;font-weight:700;color:{NAVY};">{_t(text, allow_html)}</p>'


def _highlight(text):
    """Negrito do marketing na explicação do cartão: sai em preto, para o número se destacar do cinza."""
    return text.replace("<b>", f'<b style="color:{INK};">')


def benefit_grid(items, mark="&#10003;", allow_html=False):
    """Grade 2x2 (ou 2xN) de cartões: selo, título curto e uma linha de explicação.
    items: lista de (titulo, descricao). Use de 2 a 6 itens, número par de preferência.
    allow_html=True aceita <b> na explicação (ex.: "<b>Até 70%</b> de desconto"), em preto.

    Cada cartão é a própria célula da tabela: células da mesma linha sempre têm a mesma
    altura (inclusive no Outlook), então a grade fica simétrica mesmo com textos de tamanhos
    diferentes. O espaço entre cartões vem de cellspacing; no celular a classe stack-column
    empilha as células e a margin-bottom (ignorada em célula de tabela) passa a valer."""
    cells = []
    for title, desc in items:
        body = _highlight(desc) if allow_html else _t(desc)
        cells.append(
            f'<td class="stack-column" width="50%" valign="top" bgcolor="{CARD}" '
            f'style="width:50%;padding:16px;text-align:left;background-color:{CARD};border:1px solid {BORDER};'
            f'border-radius:12px;margin-bottom:10px;">{_badge(mark)}'
            f'<p style="margin:10px 0 4px 0;font-size:14px;line-height:1.3;font-weight:700;color:{NAVY};">{_t(title)}</p>'
            f'<p style="margin:0;font-size:13px;line-height:1.45;color:{MUTED};">{body}</p></td>')
    rows = ["".join(cells[i:i + 2]) for i in range(0, len(cells), 2)]
    body = "".join(f"<tr>{row}</tr>" for row in rows)
    return (f'<table role="presentation" width="100%" cellpadding="0" cellspacing="10" border="0" '
            f'style="margin:0 auto;border-collapse:separate;">{body}</table>')


def stat_tiles(items):
    """Números em destaque lado a lado (2 ou 3). items: lista de (numero, legenda).

    Mesma técnica da grade: cada quadro é uma célula da mesma linha, então todos ficam com a
    mesma altura e o número fica alinhado no topo, independente do tamanho da legenda."""
    width = f"{100 // len(items)}%"
    cells = "".join(
        f'<td class="stack-column" width="{width}" valign="top" bgcolor="{CARD}" '
        f'style="width:{width};padding:16px 10px;text-align:center;background-color:{CARD};border:1px solid {BORDER};'
        f'border-radius:12px;margin-bottom:10px;">'
        f'<p style="margin:0;font-size:26px;line-height:1.1;font-weight:700;color:{NAVY};">{_t(number)}</p>'
        f'<p style="margin:6px 0 0 0;font-size:13px;line-height:1.35;color:{MUTED};">{_t(label)}</p></td>'
        for number, label in items)
    return (f'<table role="presentation" width="100%" cellpadding="0" cellspacing="10" border="0" '
            f'style="margin:0 auto;border-collapse:separate;"><tr>{cells}</tr></table>')


def check_list(items):
    """Lista vertical com selo de check, alinhada à esquerda, texto em preto. items: lista de textos (aceita <b>)."""
    rows = "".join(
        f'<tr><td width="38" valign="top" style="width:38px;padding:6px 0;">{_badge("&#10003;")}</td>'
        f'<td valign="middle" style="padding:6px 0;text-align:left;font-size:15px;line-height:1.45;color:{INK};">{_t(text, True)}</td></tr>'
        for text in items)
    return f'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">{rows}</table>'


def steps(items):
    """Passo a passo numerado. items: lista de (titulo, descricao)."""
    rows = "".join(
        f'<tr><td width="38" valign="top" style="width:38px;padding:8px 0;">{_badge(str(index))}</td>'
        f'<td valign="top" style="padding:8px 0;text-align:left;">'
        f'<p style="margin:4px 0 2px 0;font-size:15px;font-weight:700;color:{NAVY};">{_t(title)}</p>'
        f'<p style="margin:0;font-size:13px;line-height:1.45;color:{MUTED};">{_t(desc)}</p></td></tr>'
        for index, (title, desc) in enumerate(items, start=1))
    return f'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">{rows}</table>'


def check_size(field, html):
    """Garante que o campo cabe na coluna da DE; devolve o tamanho."""
    size = len(html)
    if size > DE_FIELD_LIMIT:
        raise ValueError(f"{field} tem {size} caracteres; a coluna aceita {DE_FIELD_LIMIT}.")
    if "\n" in html or "\r" in html:
        raise ValueError(f"{field} tem quebra de linha crua; o importador do SFMC rejeita.")
    return size
