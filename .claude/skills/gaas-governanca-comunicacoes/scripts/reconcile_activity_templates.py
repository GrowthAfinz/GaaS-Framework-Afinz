#!/usr/bin/env python
import argparse
import json
import os
import re
import unicodedata
from pathlib import Path
from urllib.parse import parse_qs, urlparse

import pandas as pd


def norm(value):
    if pd.isna(value):
        return ""
    return unicodedata.normalize("NFKC", str(value).strip()).replace("\u200b", "").strip()


def key(value):
    s = norm(value).lower()
    s = "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")
    return re.sub(r"\s+", "_", s)


def parse_bool(value):
    if isinstance(value, bool):
        return value
    s = key(value)
    if s in {"true", "sim", "yes", "1", "x", "ok"}:
        return True
    if s in {"false", "nao", "no", "0", ""}:
        return False
    return bool(s)


def extract_query(url, param):
    raw = norm(url)
    if not raw or "?" not in raw:
        return ""
    try:
        return parse_qs(urlparse(raw).query).get(param, [""])[0]
    except Exception:
        return ""


def latest_matching_xlsx(folder, needle):
    matches = [
        Path(folder) / name
        for name in os.listdir(folder)
        if name.lower().endswith(".xlsx") and needle.lower() in name.lower()
    ]
    if not matches:
        raise FileNotFoundError(f"No .xlsx matching {needle!r} in {folder}")
    return max(matches, key=lambda p: p.stat().st_mtime)


def load_governance(path):
    df = pd.read_excel(path, sheet_name="Base_Links_CRM")
    colmap = {
        "LINK AJUSTADO?": "link_ajustado",
        "TEMPLATE SALVO?": "template_salvo",
        "APP": "app",
        "CAMPANHA (C)": "campanha_c",
        "SEMANA / MOMENTO (AF_SUB2)": "af_sub2",
        "ID TEMPLATE (AF_SUB3)": "template_id",
        "NOME DO TEMPLATE (auditoria)": "template_name",
        "ACTIVITY NAME (auditoria)": "activity_name",
        "CANAL (AF_CHANNEL)": "channel",
        "SEGMENTO (AF_SUB1)": "af_sub1",
        "LINK URL FINAL": "link_url_final",
        "LINK_CANAL": "link_canal",
        "OBS": "obs",
    }
    df = df.rename(columns={c: colmap.get(c, c) for c in df.columns})
    df = df[[c for c in colmap.values() if c in df.columns]].copy()
    for c in df.columns:
        df[c] = df[c].map(norm)
    df = df[df["template_id"].astype(bool) | df["activity_name"].astype(bool)].copy()
    df["template_key"] = df["template_id"].map(key)
    df["activity_key"] = df["activity_name"].map(key)
    df["link_ajustado_bool"] = df.get("link_ajustado", "").map(parse_bool)
    df["template_salvo_bool"] = df.get("template_salvo", "").map(parse_bool)
    for p in ["c", "af_sub1", "af_sub2", "af_sub3", "pid", "af_channel", "af_ad", "af_adset", "af_ad_id", "deep_link_value", "af_sub4"]:
        df[f"url_{p}"] = df["link_url_final"].map(lambda u, p=p: extract_query(u, p))
    return df


def load_sfmc(path):
    df = pd.read_excel(path, sheet_name=0)
    for c in df.columns:
        if df[c].dtype == object:
            df[c] = df[c].map(norm)
    df["activity_key"] = df["Journey Activity Name"].map(key)
    return df.groupby("activity_key", dropna=False).agg(
        sfmc_activity_name=("Journey Activity Name", "first"),
        sfmc_journey_name=("Journey Name", "first"),
        sfmc_email_content_names=("Email Content Name", lambda s: " | ".join(sorted(set(norm(v) for v in s if norm(v)))[:5])),
        sfmc_rows=("Journey Activity Name", "size"),
        sfmc_latest_send=("Send Date", "max"),
        sfmc_sends=("Email Sends", lambda s: pd.to_numeric(s, errors="coerce").sum(min_count=1)),
    ).reset_index()


def load_activities(path):
    if not path:
        return pd.DataFrame(columns=["activity_key"])
    rows = json.loads(Path(path).read_text(encoding="utf-8"))
    df = pd.DataFrame(rows)
    if df.empty:
        return pd.DataFrame(columns=["activity_key"])
    df["activity_name_live"] = df["Activity name / Taxonomia"].map(norm)
    df["activity_key"] = df["activity_name_live"].map(key)
    return df.groupby("activity_key", dropna=False).agg(
        live_activity_name=("activity_name_live", "first"),
        live_jornada=("jornada", "first"),
        live_channel=("Canal", "first"),
        live_bu=("BU", "first"),
        live_partner=("Parceiro", "first"),
        live_segment=("Segmento", "first"),
        live_rows=("activity_name_live", "size"),
        live_latest_date=("Data de Disparo", "max"),
        live_template_ids=("template_id", lambda s: " | ".join(sorted(set(norm(v) for v in s if norm(v)))[:10])),
    ).reset_index()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--governance", help="GOVERNANCA_LINKS_E_TEMPLATES workbook")
    ap.add_argument("--sfmc-overview", help="SFMC Overview_Jornadas_B2C workbook")
    ap.add_argument("--activities-json", help="JSON produced by export_live_activities.js")
    ap.add_argument("--downloads", default=str(Path.home() / "Downloads"))
    ap.add_argument("--out", required=True)
    args = ap.parse_args()

    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)
    governance = Path(args.governance) if args.governance else latest_matching_xlsx(args.downloads, "governan")
    sfmc = Path(args.sfmc_overview) if args.sfmc_overview else latest_matching_xlsx(args.downloads, "overview_jornadas_b2c")

    gov = load_governance(governance)
    cross = gov.merge(load_sfmc(sfmc), on="activity_key", how="left").merge(load_activities(args.activities_json), on="activity_key", how="left")
    cross["exists_in_sfmc_overview"] = cross["sfmc_activity_name"].fillna("").astype(bool)
    cross["exists_in_live_activities"] = cross["live_activity_name"].fillna("").astype(bool)
    cross["url_af_sub3_matches_template_id"] = cross.apply(lambda r: key(r["url_af_sub3"]) == key(r["template_id"]) if norm(r.get("url_af_sub3")) else False, axis=1)
    cross["url_af_sub2_matches_sheet"] = cross.apply(lambda r: key(r["url_af_sub2"]) == key(r["af_sub2"]) if norm(r.get("url_af_sub2")) else False, axis=1)
    cross["url_c_matches_sheet"] = cross.apply(lambda r: key(r["url_c"]) == key(r["campanha_c"]) if norm(r.get("url_c")) else False, axis=1)
    cross["url_af_sub1_matches_sheet"] = cross.apply(lambda r: key(r["url_af_sub1"]) == key(r["af_sub1"]) if norm(r.get("url_af_sub1")) else False, axis=1)
    forbidden = ["pid", "af_channel", "af_ad", "af_adset", "af_ad_id", "deep_link_value", "af_sub4"]
    cross["crm_forbidden_params_present"] = cross.apply(lambda r: ", ".join([p for p in forbidden if norm(r.get(f"url_{p}"))]), axis=1)

    def status(r):
        if r["exists_in_live_activities"] and r["exists_in_sfmc_overview"] and r["url_af_sub3_matches_template_id"] and not r["crm_forbidden_params_present"]:
            return "confirmado"
        if r["exists_in_live_activities"] or r["exists_in_sfmc_overview"]:
            return "revisar"
        return "nao_encontrado"

    cross["mapping_status"] = cross.apply(status, axis=1)
    template_to_acts = cross.groupby("template_key")["activity_key"].nunique().to_dict()
    activity_to_templates = cross.groupby("activity_key")["template_key"].nunique().to_dict()
    cross["template_maps_to_activity_count"] = cross["template_key"].map(template_to_acts)
    cross["activity_maps_to_template_count"] = cross["activity_key"].map(activity_to_templates)
    cross["relationship_note"] = cross.apply(
        lambda r: "template_1_para_N_activity_names" if r["template_maps_to_activity_count"] > 1 else ("activity_name_N_para_1_templates" if r["activity_maps_to_template_count"] > 1 else "1_para_1_na_planilha"),
        axis=1,
    )

    cols = [
        "mapping_status", "template_id", "activity_name", "template_name", "app", "campanha_c", "af_sub2", "af_sub1", "channel",
        "link_ajustado_bool", "template_salvo_bool", "exists_in_sfmc_overview", "exists_in_live_activities", "live_latest_date", "live_rows",
        "sfmc_latest_send", "sfmc_rows", "sfmc_sends", "url_c_matches_sheet", "url_af_sub1_matches_sheet", "url_af_sub2_matches_sheet",
        "url_af_sub3_matches_template_id", "crm_forbidden_params_present", "relationship_note", "link_url_final",
    ]
    cross[cols].to_csv(out_dir / "activity_template_crosswalk.csv", index=False, encoding="utf-8-sig")
    summary = {
        "governance_rows": int(len(cross)),
        "unique_template_ids": int(cross["template_key"].nunique()),
        "unique_activity_names": int(cross["activity_key"].nunique()),
        "templates_saved_true": int(cross["template_salvo_bool"].sum()),
        "links_adjusted_true": int(cross["link_ajustado_bool"].sum()),
        "found_in_sfmc_overview": int(cross["exists_in_sfmc_overview"].sum()),
        "found_in_live_activities": int(cross["exists_in_live_activities"].sum()),
        "found_in_both": int((cross["exists_in_sfmc_overview"] & cross["exists_in_live_activities"]).sum()),
        "url_af_sub3_matches_template_id": int(cross["url_af_sub3_matches_template_id"].sum()),
        "rows_with_forbidden_crm_params": int(cross["crm_forbidden_params_present"].astype(bool).sum()),
        "status_counts": {str(k): int(v) for k, v in cross["mapping_status"].value_counts().to_dict().items()},
    }
    (out_dir / "crosswalk_summary.json").write_text(json.dumps(summary, indent=2, ensure_ascii=False), encoding="utf-8")
    lines = ["# Diagnostico activity_name x template_id", "", "## Resumo"]
    lines.extend(f"- {k}: {v}" for k, v in summary.items())
    lines.extend(["", "## Amostra confirmada"])
    for _, r in cross[cross["mapping_status"].eq("confirmado")].head(10).iterrows():
        lines.append(f"- `{r.template_id}` -> `{r.activity_name}` | {r.channel} | {r.campanha_c}")
    lines.extend(["", "## Primeiras linhas para revisar"])
    for _, r in cross[cross["mapping_status"].eq("revisar")].head(15).iterrows():
        reasons = []
        if not r.exists_in_live_activities:
            reasons.append("nao achei em activities")
        if not r.exists_in_sfmc_overview:
            reasons.append("nao achei no overview SFMC")
        if not r.url_af_sub3_matches_template_id:
            reasons.append("af_sub3 diverge/ausente")
        if r.crm_forbidden_params_present:
            reasons.append(f"params proibidos: {r.crm_forbidden_params_present}")
        lines.append(f"- `{r.template_id}` -> `{r.activity_name}` | {'; '.join(reasons)}")
    (out_dir / "diagnostico_activity_template.md").write_text("\n".join(lines), encoding="utf-8")
    print(json.dumps({"out": str(out_dir), **summary}, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
