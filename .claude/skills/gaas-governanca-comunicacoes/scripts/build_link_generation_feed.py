#!/usr/bin/env python
import argparse
from pathlib import Path

import pandas as pd


FEED_COLUMNS = [
    "LINK AJUSTADO?",
    "TEMPLATE SALVO?",
    "APP",
    "CAMPANHA (C)",
    "SEMANA / MOMENTO (AF_SUB2)",
    "ID TEMPLATE (AF_SUB3)",
    "NOME DO TEMPLATE (auditoria)",
    "ACTIVITY NAME (auditoria)",
    "CANAL (AF_CHANNEL)",
    "SEGMENTO (AF_SUB1)",
    "LINK URL FINAL",
    "LINK_CANAL",
    "TESTE (A/B)",
    "COD_CANAL",
    "COD_CAMPANHA",
    "COD_SEGMENTO",
    "OBS",
]


def yn(value):
    return "TRUE" if bool(value) else "FALSE"


def build_feed(df, include_formulas=False, obs_value="(made skill)"):
    out = pd.DataFrame()
    out["LINK AJUSTADO?"] = df["link_ajustado_bool"].fillna(False).map(yn)
    out["TEMPLATE SALVO?"] = df["template_salvo_bool"].fillna(False).map(yn)
    out["APP"] = df["app"].fillna("")
    out["CAMPANHA (C)"] = df["campanha_c"].fillna("")
    out["SEMANA / MOMENTO (AF_SUB2)"] = df["af_sub2"].fillna("")
    out["ID TEMPLATE (AF_SUB3)"] = df["template_id"].fillna("")
    out["NOME DO TEMPLATE (auditoria)"] = df["template_name"].fillna("")
    out["ACTIVITY NAME (auditoria)"] = df["activity_name"].fillna("")
    out["CANAL (AF_CHANNEL)"] = df["channel"].fillna("")
    out["SEGMENTO (AF_SUB1)"] = df["af_sub1"].fillna("")

    # These columns are formula-driven in the governance workbook. Keep them empty
    # unless the caller explicitly wants to carry existing calculated values.
    out["LINK URL FINAL"] = df["link_url_final"].fillna("") if include_formulas else ""
    out["LINK_CANAL"] = ""
    out["TESTE (A/B)"] = ""
    out["COD_CANAL"] = ""
    out["COD_CAMPANHA"] = ""
    out["COD_SEGMENTO"] = ""
    out["OBS"] = obs_value
    return out[FEED_COLUMNS]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--crosswalk", required=True)
    parser.add_argument("--out", required=True)
    parser.add_argument("--include-formulas", action="store_true", help="Carry existing LINK URL FINAL values instead of leaving formula columns blank.")
    parser.add_argument("--obs-value", default="(made skill)")
    args = parser.parse_args()

    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)
    df = pd.read_csv(args.crosswalk).fillna("")
    feed_all = build_feed(df, include_formulas=args.include_formulas, obs_value=args.obs_value)
    feed_confirmed = build_feed(df[df["mapping_status"].eq("confirmado")].copy(), include_formulas=args.include_formulas, obs_value=args.obs_value)

    all_path = out_dir / "geracao_links_feed_todas.csv"
    confirmed_path = out_dir / "geracao_links_feed_confirmadas.csv"
    all_tsv_path = out_dir / "geracao_links_feed_todas_colar.tsv"
    confirmed_tsv_path = out_dir / "geracao_links_feed_confirmadas_colar.tsv"
    feed_all.to_csv(all_path, index=False, encoding="utf-8-sig")
    feed_confirmed.to_csv(confirmed_path, index=False, encoding="utf-8-sig")
    feed_all.to_csv(all_tsv_path, index=False, encoding="utf-8-sig", sep="\t")
    feed_confirmed.to_csv(confirmed_tsv_path, index=False, encoding="utf-8-sig", sep="\t")
    print({
        "all_path": str(all_path),
        "all_rows": int(len(feed_all)),
        "confirmed_path": str(confirmed_path),
        "confirmed_rows": int(len(feed_confirmed)),
        "all_tsv_path": str(all_tsv_path),
        "confirmed_tsv_path": str(confirmed_tsv_path),
        "formula_columns_left_blank": not args.include_formulas,
    })


if __name__ == "__main__":
    main()
