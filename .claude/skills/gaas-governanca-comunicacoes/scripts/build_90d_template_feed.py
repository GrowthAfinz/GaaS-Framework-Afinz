#!/usr/bin/env python
import argparse
import json
import os
import re
import unicodedata
from collections import Counter
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

CHANNEL_CODE = {
    "whatsapp": "wpp",
    "whatsapp mkt": "wpp",
    "wpp": "wpp",
    "e mail": "email",
    "email": "email",
    "sms": "sms",
    "push": "push",
}

SEGMENT_CODE = {
    "abandonados": "abn",
    "base proprietaria": "bsp",
    "base_proprietaria": "bsp",
    "negados": "ngd",
    "crm": "crm",
    "aprovados nao convertidos": "anc",
    "aprovados_nao_convertidos": "anc",
    "leads parceiros": "leads",
    "leads_parceiros": "leads",
    "recencia de compra": "rec",
    "recencia_de_compra": "rec",
    "instabilidade": "inst",
    "rentabilizacao": "rnt",
}

BU_SORT_ORDER = {
    "b2c": 0,
    "plurix": 1,
    "b2b2c": 2,
}


def norm(value):
    if pd.isna(value):
        return ""
    return unicodedata.normalize("NFKC", str(value).strip()).replace("\u200b", "").strip()


def plain(value):
    s = norm(value).lower()
    s = "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")
    return re.sub(r"[_\-\s]+", " ", s).strip()


def slug(value):
    s = plain(value)
    s = re.sub(r"[^a-z0-9]+", "_", s)
    return re.sub(r"_+", "_", s).strip("_")


def bu_sort_order(value):
    return BU_SORT_ORDER.get(plain(value), 99)


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
    if not path:
        return pd.DataFrame()
    df = pd.read_excel(path, sheet_name="Base_Links_CRM")
    mapping = {
        "ID TEMPLATE (AF_SUB3)": "template_id",
        "NOME DO TEMPLATE (auditoria)": "template_name",
        "ACTIVITY NAME (auditoria)": "activity_name",
        "APP": "app",
        "CAMPANHA (C)": "campaign",
        "SEMANA / MOMENTO (AF_SUB2)": "moment",
        "CANAL (AF_CHANNEL)": "channel",
        "SEGMENTO (AF_SUB1)": "segment",
        "LINK AJUSTADO?": "link_adjusted",
        "TEMPLATE SALVO?": "template_saved",
    }
    df = df.rename(columns={c: mapping.get(c, c) for c in df.columns})
    keep = [c for c in mapping.values() if c in df.columns]
    df = df[keep].copy()
    for c in df.columns:
        df[c] = df[c].map(norm)
    df["activity_key"] = df["activity_name"].map(slug)
    df = df[df["activity_key"].astype(bool)].copy()
    return df


def load_sfmc(path):
    df = pd.read_excel(path, sheet_name=0)
    for c in df.columns:
        if df[c].dtype == object:
            df[c] = df[c].map(norm)
    df["activity_key"] = df["Journey Activity Name"].map(slug)
    grouped = df.groupby("activity_key", dropna=False).agg(
        sfmc_activity_name=("Journey Activity Name", "first"),
        sfmc_journey_name=("Journey Name", "first"),
        email_content_name=("Email Content Name", lambda s: sorted(set(norm(v) for v in s if norm(v)))[0] if any(norm(v) for v in s) else ""),
        sfmc_rows=("Journey Activity Name", "size"),
        sfmc_latest_send=("Send Date", "max"),
    )
    return grouped.reset_index()


def app_code(row):
    bu = plain(row.get("BU", ""))
    partner = plain(row.get("Parceiro", ""))
    activity = row.get("activity_name", "")
    activity_text = f"_{slug(activity)}_"
    if "plurix" in bu or "plurix" in partner or activity.startswith("plu_"):
        return "plurix"
    if partner == "dia" or "_dia_" in activity_text:
        return "dia"
    if partner in {"bem barato", "bem_barato"} or "_bbt_" in activity_text or "_bb_" in activity_text:
        return "bb"
    if "seguros" in bu:
        return "seguros"
    return "b2c"


def app_label(code):
    return {
        "b2c": "afinz",
        "dia": "afinz",
        "bb": "afinz",
        "plurix": "plurix",
        "seguros": "afinz",
    }.get(code, "afinz")


def channel_code(value):
    p = plain(value)
    return CHANNEL_CODE.get(p, slug(value) or "canal")


def segment_code(value):
    p = plain(value)
    return SEGMENT_CODE.get(p, slug(value)[:12] or "seg")


def campaign_code(row):
    text = plain(" ".join([row.get("activity_name", ""), row.get("jornada", ""), row.get("template_name", "")]))
    if "seguro mulher" in text:
        return "seg_mulher"
    if "residencia" in text or "residencia24h" in text:
        return "seg_resid"
    if "black friday" in text or "blackfriday" in text:
        return "bf"
    if "halloween" in text or "hallowen" in text:
        return "halloween"
    if "aniversario" in text:
        return "niver"
    if "vibe" in text:
        return "vibe"
    if "copa" in text:
        return "copa"
    if "pesquisa" in text:
        return "pesquisa"
    if "instabilidade" in text or "erro app" in text:
        return "erro_app"
    if "carrinho abandonado" in text or "carrinhoabandonado" in text:
        return "carrinho"
    if "rentabilizacao" in text:
        return "renta"
    return "pad"


def campaign_label(row):
    code = campaign_code(row)
    app = app_code(row)
    prefix = {"dia": "DIA ", "bb": "BB ", "plurix": "Plurix ", "seguros": "Seguros "}.get(app, "")
    labels = {
        "copa": "Topo de Funil Copa",
        "vibe": "Vibe",
        "seg_mulher": "Seguro Mulher",
        "seg_resid": "Seguro Residencia",
        "bf": "Black Friday",
        "halloween": "Halloween",
        "niver": "Aniversario Afinz",
        "pesquisa": "Pesquisa",
        "erro_app": "Erro App",
        "carrinho": "Carrinho Abandonado",
        "renta": "Rentabilizacao",
        "pad": "Padrao",
    }
    base = labels.get(code, code)
    return f"{prefix}{base}".strip()


def moment(row):
    text = row.get("activity_name", "")
    for pattern in [
        r"disp\d+s(\d+)",
        r"s(\d+)d\d+",
        r"disp(\d+)s\d+",
        r"_d(\d+)",
        r"disp(?:aro)?(\d+)",
    ]:
        m = re.search(pattern, text, flags=re.I)
        if m:
            if pattern in [r"disp\d+s(\d+)", r"s(\d+)d\d+"]:
                return f"s{int(m.group(1))}"
            return f"d{int(m.group(1)):02d}"
    j = row.get("jornada", "")
    m = re.search(r"SEM(\d+)", j, flags=re.I)
    if m:
        return f"s{int(m.group(1))}"
    return "d01"


def moment_detail(row):
    activity = row.get("activity_name", "")
    jornada = row.get("jornada", "")
    combined = " ".join([activity, jornada, row.get("template_name", "")])
    inferred = moment(row)

    if re.search(r"disp\d+s\d+|s\d+d\d+|SEM\d+", combined, flags=re.I):
        return {
            "inferred_moment": inferred,
            "moment_type": "regua_semana",
            "moment_confidence": "alta",
            "moment_evidence": "sequencia semanal encontrada em activity_name ou jornada",
        }
    if re.search(r"_d\d+|disp(?:aro)?\d+", combined, flags=re.I):
        return {
            "inferred_moment": inferred,
            "moment_type": "regua_disparo",
            "moment_confidence": "alta",
            "moment_evidence": "sequencia de disparo encontrada em activity_name",
        }
    if re.search(r"pontual|avulso|reativacao|pesquisa|black friday|halloween|aniversario", plain(combined), flags=re.I):
        return {
            "inferred_moment": inferred,
            "moment_type": "pontual",
            "moment_confidence": "media",
            "moment_evidence": "campanha parece pontual pela taxonomia",
        }
    return {
        "inferred_moment": inferred,
        "moment_type": "sem_padrao",
        "moment_confidence": "baixa",
        "moment_evidence": "sem token explicito de semana, disparo ou campanha pontual",
    }


def dispatch_suffix(row):
    m = moment(row)
    if re.match(r"s\d+$", m):
        text = row.get("activity_name", "")
        d = re.search(r"disp(\d+)", text, flags=re.I)
        if d:
            return f"{m}d{int(d.group(1)):02d}"
        return f"{m}d01"
    return m


def aggregate_activities(path):
    rows = json.loads(Path(path).read_text(encoding="utf-8"))
    df = pd.DataFrame(rows)
    df = df.rename(columns={"Activity name / Taxonomia": "activity_name"})
    for c in df.columns:
        if df[c].dtype == object:
            df[c] = df[c].map(norm)
    df["activity_key"] = df["activity_name"].map(slug)

    def first_nonempty(s):
        for v in s:
            if norm(v):
                return norm(v)
        return ""

    grouped = df.groupby("activity_key", dropna=False).agg(
        activity_name=("activity_name", "first"),
        jornada=("jornada", first_nonempty),
        Canal=("Canal", first_nonempty),
        BU=("BU", first_nonempty),
        Parceiro=("Parceiro", first_nonempty),
        Segmento=("Segmento", first_nonempty),
        latest_date=("Data de Disparo", "max"),
        first_date=("Data de Disparo", "min"),
        executions=("activity_name", "size"),
        existing_template_id=("template_id", first_nonempty),
    ).reset_index()
    return grouped


def make_template_id(row):
    existing = norm(row.get("existing_template_id", ""))
    if existing:
        return existing
    return "_".join([
        app_code(row),
        channel_code(row.get("Canal", "")),
        campaign_code(row),
        segment_code(row.get("Segmento", "")),
        dispatch_suffix(row),
    ])


def bool_text(value):
    return "TRUE" if str(value).lower() in {"true", "1", "sim", "yes"} else "FALSE"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--activities-json", required=True)
    parser.add_argument("--sfmc-overview")
    parser.add_argument("--governance")
    parser.add_argument("--downloads", default=str(Path.home() / "Downloads"))
    parser.add_argument("--out", required=True)
    args = parser.parse_args()

    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)
    governance = Path(args.governance) if args.governance else latest_matching_xlsx(args.downloads, "governan")
    sfmc = Path(args.sfmc_overview) if args.sfmc_overview else latest_matching_xlsx(args.downloads, "overview_jornadas_b2c")

    live = aggregate_activities(args.activities_json)
    sfmc_df = load_sfmc(sfmc)
    gov = load_governance(governance)

    df = live.merge(sfmc_df, on="activity_key", how="left", suffixes=("", "_sfmc"))
    gov_first = gov.sort_values("template_id").drop_duplicates("activity_key", keep="first")
    df = df.merge(gov_first.add_prefix("gov_"), left_on="activity_key", right_on="gov_activity_key", how="left")

    df["template_name"] = df.apply(
        lambda r: norm(r.get("gov_template_name")) or norm(r.get("email_content_name")) or norm(r.get("activity_name")),
        axis=1,
    )
    df["existing_template_id"] = df.apply(lambda r: norm(r.get("existing_template_id")) or norm(r.get("gov_template_id")), axis=1)
    df["generated_template_id"] = df.apply(make_template_id, axis=1)
    moment_details = pd.DataFrame(df.apply(moment_detail, axis=1).tolist(), index=df.index)
    df = pd.concat([df, moment_details], axis=1)

    counts = Counter()
    final_ids = []
    for _, row in df.iterrows():
        existing = norm(row.get("existing_template_id", ""))
        if existing:
            final_ids.append(existing)
            continue
        base = slug(row.get("generated_template_id", ""))
        counts[base] += 1
        final_ids.append(base if counts[base] == 1 else f"{base}_{counts[base]:02d}")
    df["final_template_id"] = final_ids

    feed = pd.DataFrame(index=df.index)
    feed["LINK AJUSTADO?"] = "FALSE"
    feed["TEMPLATE SALVO?"] = df["existing_template_id"].map(lambda v: "TRUE" if norm(v) else "FALSE")
    feed["APP"] = df.apply(lambda r: norm(r.get("gov_app")) or app_label(app_code(r)), axis=1)
    feed["CAMPANHA (C)"] = df.apply(lambda r: norm(r.get("gov_campaign")) or campaign_label(r), axis=1)
    feed["SEMANA / MOMENTO (AF_SUB2)"] = df.apply(lambda r: norm(r.get("gov_moment")) or moment(r), axis=1)
    feed["ID TEMPLATE (AF_SUB3)"] = df["final_template_id"]
    feed["NOME DO TEMPLATE (auditoria)"] = df["template_name"]
    feed["ACTIVITY NAME (auditoria)"] = df["activity_name"]
    feed["CANAL (AF_CHANNEL)"] = df.apply(lambda r: norm(r.get("gov_channel")) or channel_code(r.get("Canal", "")), axis=1)
    feed["SEGMENTO (AF_SUB1)"] = df.apply(lambda r: norm(r.get("gov_segment")) or norm(r.get("Segmento")), axis=1)
    feed["LINK URL FINAL"] = ""
    feed["LINK_CANAL"] = ""
    feed["TESTE (A/B)"] = ""
    feed["COD_CANAL"] = ""
    feed["COD_CAMPANHA"] = ""
    feed["COD_SEGMENTO"] = ""
    feed["OBS"] = "(made skill)"
    feed["_sort_bu"] = df["BU"].map(bu_sort_order)
    feed["_sort_partner"] = df["Parceiro"].map(plain)
    feed["_sort_segmento"] = df["Segmento"].map(plain)
    feed["_sort_latest_date"] = pd.to_datetime(df["latest_date"], errors="coerce", utc=True)
    feed["_sort_activity"] = df["activity_name"].map(plain)
    feed = feed.sort_values(
        ["_sort_bu", "_sort_partner", "_sort_segmento", "_sort_latest_date", "_sort_activity"],
        ascending=[True, True, True, False, True],
        na_position="last",
    )[FEED_COLUMNS]

    moment_audit = pd.DataFrame(index=df.index)
    moment_audit["BU"] = df["BU"]
    moment_audit["Parceiro"] = df["Parceiro"]
    moment_audit["Segmento"] = df["Segmento"]
    moment_audit["Data de Disparo mais recente"] = df["latest_date"]
    moment_audit["Data de Disparo mais antiga"] = df["first_date"]
    moment_audit["Execucoes 90d"] = df["executions"]
    moment_audit["APP"] = df.apply(lambda r: app_code(r), axis=1)
    moment_audit["Canal"] = df["Canal"]
    moment_audit["Campanha inferida"] = df.apply(campaign_code, axis=1)
    moment_audit["Segmento cod"] = df["Segmento"].map(segment_code)
    moment_audit["Activity Name"] = df["activity_name"]
    moment_audit["Template ID"] = df["final_template_id"]
    moment_audit["Nome do Template"] = df["template_name"]
    moment_audit["Momento inferido"] = df["inferred_moment"]
    moment_audit["Tipo de momento"] = df["moment_type"]
    moment_audit["Confianca"] = df["moment_confidence"]
    moment_audit["Evidencia"] = df["moment_evidence"]
    moment_audit["Chave de analise"] = (
        moment_audit["BU"].map(slug)
        + "|"
        + moment_audit["Segmento"].map(slug)
        + "|"
        + moment_audit["Canal"].map(slug)
        + "|"
        + moment_audit["Campanha inferida"].map(slug)
    )
    moment_audit["_sort_bu"] = df["BU"].map(bu_sort_order)
    moment_audit["_sort_partner"] = df["Parceiro"].map(plain)
    moment_audit["_sort_segmento"] = df["Segmento"].map(plain)
    moment_audit["_sort_latest_date"] = pd.to_datetime(df["latest_date"], errors="coerce", utc=True)
    moment_audit["_sort_activity"] = df["activity_name"].map(plain)
    moment_audit = moment_audit.sort_values(
        ["_sort_bu", "_sort_partner", "_sort_segmento", "_sort_latest_date", "_sort_activity"],
        ascending=[True, True, True, False, True],
        na_position="last",
    ).drop(columns=["_sort_bu", "_sort_partner", "_sort_segmento", "_sort_latest_date", "_sort_activity"])

    out_csv = out_dir / "gaas_feed_90d_todos_template_ids.csv"
    missing_csv = out_dir / "gaas_feed_90d_template_ids_faltantes.csv"
    moment_csv = out_dir / "gaas_feed_90d_inteligencia_momento.csv"
    feed.to_csv(out_csv, index=False, encoding="utf-8-sig")
    feed[feed["TEMPLATE SALVO?"].astype(str).str.upper().eq("FALSE")].to_csv(missing_csv, index=False, encoding="utf-8-sig")
    moment_audit.to_csv(moment_csv, index=False, encoding="utf-8-sig")

    audit = {
        "rows": int(len(feed)),
        "unique_activity_names": int(df["activity_name"].nunique()),
        "existing_template_ids_reused": int(df["existing_template_id"].astype(bool).sum()),
        "generated_template_ids": int((~df["existing_template_id"].astype(bool)).sum()),
        "email_names_from_sfmc": int(df["email_content_name"].map(lambda v: bool(norm(v))).sum()),
        "non_email_or_missing_name_repeated_activity": int((~df["email_content_name"].map(lambda v: bool(norm(v)))).sum()),
        "missing_template_rows": int(feed["TEMPLATE SALVO?"].astype(str).str.upper().eq("FALSE").sum()),
        "source_activities_json": str(args.activities_json),
        "source_sfmc": str(sfmc),
        "source_governance": str(governance),
        "sort_order": "BU custom (B2C > Plurix > B2B2C > others) > Parceiro asc > Segmento asc > Data de Disparo desc > Activity Name asc",
        "moment_intelligence_csv": str(moment_csv),
        "moment_type_counts": {str(k): int(v) for k, v in moment_audit["Tipo de momento"].value_counts(dropna=False).items()},
    }
    (out_dir / "gaas_feed_90d_auditoria.json").write_text(json.dumps(audit, indent=2, ensure_ascii=False), encoding="utf-8")
    print(json.dumps({"out_csv": str(out_csv), "missing_csv": str(missing_csv), "moment_csv": str(moment_csv), **audit}, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
