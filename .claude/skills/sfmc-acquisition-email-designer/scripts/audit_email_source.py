#!/usr/bin/env python3
"""Auditoria estática conservadora de HTML/AMPscript para e-mail."""

from __future__ import annotations

import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path


class EmailParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.images: list[dict[str, str | None]] = []
        self.tables: list[dict[str, str | None]] = []
        self.links: list[dict[str, str | None]] = []
        self.has_lang = False
        self.has_viewport = False

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        data = dict(attrs)
        if tag == "html":
            self.has_lang = bool(data.get("lang"))
        elif tag == "meta" and data.get("name", "").lower() == "viewport":
            self.has_viewport = True
        elif tag == "img":
            self.images.append(data)
        elif tag == "table":
            self.tables.append(data)
        elif tag == "a":
            self.links.append(data)


def finding(severity: str, code: str, message: str) -> dict[str, str]:
    return {"severity": severity, "code": code, "message": message}


def audit(source: str) -> list[dict[str, str]]:
    results: list[dict[str, str]] = []
    parser = EmailParser()
    parser.feed(source)

    if not parser.has_lang:
        results.append(finding("review", "html.lang", "Documento sem atributo lang."))
    if not parser.has_viewport:
        results.append(finding("review", "html.viewport", "Documento sem meta viewport."))
    if re.search(r"<script\b(?![^>]*runat\s*=\s*['\"]server)", source, re.I):
        results.append(finding("blocked", "html.client_script", "JavaScript cliente não é seguro para e-mail."))
    if re.search(r"javascript\s*:", source, re.I):
        results.append(finding("blocked", "html.javascript_url", "URL javascript: encontrada."))
    if re.search(r"<meta[^>]+http-equiv\s*=\s*['\"]?refresh", source, re.I):
        results.append(finding("blocked", "html.meta_refresh", "Meta refresh encontrado."))

    for index, image in enumerate(parser.images, 1):
        if "alt" not in image:
            results.append(finding("review", "image.alt", f"Imagem {index} sem atributo alt."))
        if not image.get("width"):
            results.append(finding("review", "image.width", f"Imagem {index} sem atributo width para fallback."))
        src = image.get("src") or ""
        if src and not (src.startswith("https://") or "%%" in src):
            results.append(finding("review", "image.src", f"Imagem {index} não usa HTTPS nem origem dinâmica."))

    layout_tables = [table for table in parser.tables if table.get("role") != "presentation"]
    if layout_tables:
        results.append(finding("review", "table.role", f"{len(layout_tables)} tabela(s) sem role=\"presentation\"; confirme se são dados ou layout."))

    for index, link in enumerate(parser.links, 1):
        href = link.get("href") or ""
        if not href:
            results.append(finding("blocked", "link.empty", f"Link {index} sem href."))
        elif href.startswith("http://"):
            results.append(finding("review", "link.http", f"Link {index} usa HTTP."))

    opens = len(re.findall(r"%%\[", source))
    closes = len(re.findall(r"\]%%", source))
    if opens != closes:
        results.append(finding("blocked", "ampscript.delimiters", f"Blocos AMPscript desequilibrados: {opens} abertura(s), {closes} fechamento(s)."))
    if_count = len(re.findall(r"\bIF\b[^\n]*\bTHEN\b", source, re.I))
    endif_count = len(re.findall(r"\bENDIF\b", source, re.I))
    if if_count != endif_count:
        results.append(finding("blocked", "ampscript.if_balance", f"IF/ENDIF possivelmente desequilibrados: {if_count}/{endif_count}."))
    if re.search(r"TreatAsContent\s*\(", source, re.I):
        results.append(finding("review", "ampscript.treat_as_content", "TreatAsContent encontrado; confirme origem governada e sanitização."))
    if re.search(r"\bRow\s*\(", source, re.I) and not re.search(r"RowCount\s*\(|Empty\s*\(|IsNull\s*\(", source, re.I):
        results.append(finding("review", "ampscript.row_guard", "Row() encontrado sem guarda RowCount/Empty/IsNull identificável."))
    if re.search(r"href\s*=\s*['\"]%%=v\s*\(", source, re.I):
        results.append(finding("review", "ampscript.redirect_tracking", "URL dinâmica usa v() direto no href; avalie RedirectTo() para tracking."))

    return results


def main() -> int:
    if len(sys.argv) != 2:
        print("Uso: audit_email_source.py <arquivo.html>", file=sys.stderr)
        return 2
    path = Path(sys.argv[1])
    results = audit(path.read_text(encoding="utf-8"))
    print(json.dumps({"file": str(path), "findings": results}, ensure_ascii=False, indent=2))
    return 1 if any(item["severity"] == "blocked" for item in results) else 0


if __name__ == "__main__":
    raise SystemExit(main())
