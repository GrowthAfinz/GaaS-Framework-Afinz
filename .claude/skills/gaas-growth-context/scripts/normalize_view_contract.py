#!/usr/bin/env python3
"""Normalize a pasted TSV slide/view contract into JSON or TSV.

The expected input is the spreadsheet-like contract used by the GaaS report:
first columns are order, block, view, grain, then arbitrary metric columns.
"""

from __future__ import annotations

import argparse
import csv
import json
import re
import sys
import unicodedata
from pathlib import Path


def repair_text(value: str) -> str:
    value = value.strip()
    try:
        return value.encode("latin1").decode("utf-8")
    except UnicodeError:
        return value


def ascii_text(value: str) -> str:
    value = repair_text(value)
    decomposed = unicodedata.normalize("NFKD", value)
    return "".join(ch for ch in decomposed if ord(ch) < 128)


def slug(value: str) -> str:
    value = ascii_text(value).lower()
    replacements = {
        "%": "pct",
        "/": "_",
        "\\": "_",
        " ": "_",
        "-": "_",
    }
    for old, new in replacements.items():
        value = value.replace(old, new)
    value = re.sub(r"[^a-z0-9_]+", "", value)
    value = re.sub(r"_+", "_", value).strip("_")
    return value


def normalize_rows(path: Path) -> list[dict[str, object]]:
    text = path.read_text(encoding="utf-8-sig")
    rows = list(csv.reader(text.splitlines(), delimiter="\t"))
    if not rows:
        return []

    normalized: list[dict[str, object]] = []
    for row in rows[1:]:
        if len(row) < 4 or not any(cell.strip() for cell in row):
            continue
        order = ascii_text(row[0])
        block = ascii_text(row[1])
        view = ascii_text(row[2])
        grain = ascii_text(row[3])
        if not order or not view:
            continue
        columns: list[str] = []
        previous_metric = ""
        for cell in row[4:]:
            if not cell.strip():
                continue
            normalized_cell = slug(cell)
            is_variation = (
                ("pct" in normalized_cell and "vs" in normalized_cell)
                or "vs_mesmo_periodio" in normalized_cell
                or "vs_mesmo_periodo" in normalized_cell
                or normalized_cell.startswith("delta")
            )
            if is_variation and previous_metric:
                if "ponto" in normalized_cell:
                    column = f"{previous_metric}_var_pontos"
                else:
                    column = f"{previous_metric}_var_pct"
            else:
                column = normalized_cell
                previous_metric = column
            columns.append(column)
        normalized.append(
            {
                "order": order,
                "block": block,
                "view": view,
                "grain": grain,
                "columns": columns,
            }
        )
    return normalized


def write_tsv(rows: list[dict[str, object]], out: Path | None) -> None:
    target = out.open("w", encoding="utf-8", newline="") if out else sys.stdout
    close = out is not None
    try:
        writer = csv.writer(target, delimiter="\t")
        writer.writerow(["order", "block", "view", "grain", "columns"])
        for row in rows:
            writer.writerow(
                [
                    row["order"],
                    row["block"],
                    row["view"],
                    row["grain"],
                    ";".join(row["columns"]),
                ]
            )
    finally:
        if close:
            target.close()


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("input", type=Path)
    parser.add_argument("--output", "-o", type=Path)
    parser.add_argument("--format", choices=["json", "tsv"], default="json")
    args = parser.parse_args()

    rows = normalize_rows(args.input)
    if args.format == "json":
        payload = json.dumps(rows, ensure_ascii=False, indent=2)
        if args.output:
            args.output.write_text(payload + "\n", encoding="utf-8")
        else:
            print(payload)
    else:
        write_tsv(rows, args.output)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
