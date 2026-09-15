#!/usr/bin/env python3
"""Valida estrutura e conteúdo mínimo dos outputs Office do Report Live."""

from __future__ import annotations

import argparse
import json
import zipfile
from pathlib import Path

from pptx import Presentation
from pypdf import PdfReader


EXPECTED_SLIDES = ("c0", "c4", "p1_serasa")
EXPECTED_TEXT = (
    "report live",
    "ritmo vs período equivalente e meta",
    "resultado & contribuição — serasa",
)


def validate(plan_path: Path, pptx_path: Path, pdf_path: Path) -> dict[str, object]:
    plan = json.loads(plan_path.read_text(encoding="utf-8"))
    slide_ids = tuple(item["slide_instance_id"] for item in plan["slides"])
    if slide_ids != EXPECTED_SLIDES:
        raise ValueError(f"Slice inesperado: {slide_ids}")

    if not zipfile.is_zipfile(pptx_path):
        raise ValueError("PPTX inválido: pacote ZIP ausente")
    prs = Presentation(str(pptx_path))
    if len(prs.slides) != len(EXPECTED_SLIDES):
        raise ValueError(f"PPTX com {len(prs.slides)} slides; esperado 3")
    charts = sum(
        1 for slide in prs.slides for shape in slide.shapes if getattr(shape, "has_chart", False)
    )
    if charts != 1:
        raise ValueError(f"PPTX com {charts} gráficos nativos; esperado 1")
    pptx_text = "\n".join(
        shape.text for slide in prs.slides for shape in slide.shapes if getattr(shape, "has_text_frame", False)
    ).lower()

    reader = PdfReader(str(pdf_path))
    if len(reader.pages) != len(EXPECTED_SLIDES):
        raise ValueError(f"PDF com {len(reader.pages)} páginas; esperado 3")
    pdf_text = "\n".join(page.extract_text() or "" for page in reader.pages).lower()
    for expected in EXPECTED_TEXT:
        if expected not in pptx_text:
            raise ValueError(f"Texto ausente no PPTX: {expected}")
        if expected not in pdf_text:
            raise ValueError(f"Texto ausente no PDF: {expected}")

    page_sizes = [
        (round(float(page.mediabox.width)), round(float(page.mediabox.height)))
        for page in reader.pages
    ]
    if any(size != (960, 540) for size in page_sizes):
        raise ValueError(f"Canvas PDF inesperado: {page_sizes}")

    return {
        "ok": True,
        "run_id": plan["run_id"],
        "slides": list(slide_ids),
        "pptx_slides": len(prs.slides),
        "native_charts": charts,
        "pdf_pages": len(reader.pages),
        "pdf_canvas_points": [960, 540],
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--plan", type=Path, required=True)
    parser.add_argument("--pptx", type=Path, required=True)
    parser.add_argument("--pdf", type=Path, required=True)
    args = parser.parse_args()
    print(json.dumps(validate(args.plan, args.pptx, args.pdf), ensure_ascii=False))


if __name__ == "__main__":
    main()
