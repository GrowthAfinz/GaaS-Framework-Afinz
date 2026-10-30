#!/usr/bin/env python3
"""Inventory likely GaaS growth context files in a workspace."""

from __future__ import annotations

import argparse
import json
from pathlib import Path


PATTERNS = [
    "CLAUDE.md",
    "AGENTS.md",
    "docs/AFINZ_GAAS_ONTOLOGY.md",
    "Afinz-CRM-Midia-Vault/08-Engenharia/Report-Live-Sheets-Slides.md",
    "Afinz-CRM-Midia-Vault/09-Inteligencia-IA/Agente-Report-Live-Handoff.md",
    "Afinz-CRM-Midia-Vault/09-Inteligencia-IA/Dossie-Mestre-Operacao-CRM-Midia.md",
    "calendar-estrategico/src/components/relatorio/ReportLiveCard.tsx",
    "calendar-estrategico/src/utils/aquisicaoCrmExcelExport.ts",
    "calendar-estrategico/src/utils/crmAquisicaoMonthlyReportExport.ts",
    "calendar-estrategico/src/utils/midiaPagaMonthlyReportExport.ts",
    "calendar-estrategico/src/utils/midiaPagaDiarizadoSheet.ts",
    "calendar-estrategico/src/services/supabaseClient.ts",
]


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("workspace", type=Path)
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()

    root = args.workspace.resolve()
    found = []
    missing = []
    for rel in PATTERNS:
        path = root / rel
        item = {"relative_path": rel, "path": str(path)}
        if path.exists():
            item["size"] = path.stat().st_size
            found.append(item)
        else:
            missing.append(item)

    payload = {"workspace": str(root), "found": found, "missing": missing}
    if args.json:
        print(json.dumps(payload, ensure_ascii=False, indent=2))
    else:
        print(f"workspace: {root}")
        print("\nfound:")
        for item in found:
            print(f"- {item['relative_path']}")
        print("\nmissing:")
        for item in missing:
            print(f"- {item['relative_path']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

