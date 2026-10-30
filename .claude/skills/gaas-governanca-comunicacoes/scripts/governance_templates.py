#!/usr/bin/env python3
"""GaaS — Governança de Comunicações (template_id x activity_name).

Lê a planilha de governança (CSV ';', latin-1), cruza com o Supabase
(`activities` e `communication_templates`) e:

  analyze  -> DRY-RUN. Valida cada linha, classifica e gera um relatório
              (JSON + resumo no stdout). NÃO grava nada no banco.
  apply    -> Aplica o relatório aprovado: pré-cria templates como 'draft'
              (sem asset) e vincula activities.template_id para as linhas OK.
              Por padrão NÃO importa linhas 'suspeito'.

Sem dependências externas (urllib stdlib). Encoding latin-1 corrige o mojibake.
"""

from __future__ import annotations

import argparse
import csv
import io
import json
import os
import re
import sys
from collections import defaultdict
from datetime import datetime
from pathlib import Path
from urllib.error import HTTPError
from urllib.parse import quote, urlencode
from urllib.request import Request, urlopen

DEFAULT_SUPABASE_URL = "https://mipiwxadnpwtcgfcedym.supabase.co"
DEFAULT_SUPABASE_KEY = os.environ.get("SUPABASE_ANON_KEY", "")
PAGE_SIZE = 1000

ACTIVITY_COL = "Activity name / Taxonomia"

# ── Canal: planilha -> rótulo canônico do app (coluna "Canal" de activities) ──
CHANNEL_MAP = {
    "email": "E-mail", "e-mail": "E-mail", "mail": "E-mail",
    "sms": "SMS",
    "whatsapp": "WhatsApp", "wpp": "WhatsApp", "whats": "WhatsApp",
    "push": "Push",
}

# ── Marca esperada pelo prefixo do template_id (família Afinz x Plurix) ──
#   b2c_/dia_/bb_ = família Afinz (taxonomia começa com 'afz')
#   plurix_       = Plurix (taxonomia 'plu' ou 'afz_grl')
AFINZ_PREFIXES = ("b2c_", "dia_", "bb_")
PLURIX_PREFIXES = ("plurix_",)

TEMPLATE_ID_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9_-]{2,79}$")


# ----------------------------------------------------------- Supabase REST

def fetch_all(base_url: str, key: str, table: str, params: dict) -> list[dict]:
    rows: list[dict] = []
    offset = 0
    while True:
        url = f"{base_url}/rest/v1/{table}?{urlencode(params, doseq=True)}"
        req = Request(url, headers={
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Range-Unit": "items",
            "Range": f"{offset}-{offset + PAGE_SIZE - 1}",
        })
        with urlopen(req) as resp:
            batch = json.loads(resp.read().decode("utf-8"))
        rows.extend(batch)
        if len(batch) < PAGE_SIZE:
            break
        offset += PAGE_SIZE
    return rows


def post_json(base_url: str, key: str, path: str, body, prefer: str) -> None:
    url = f"{base_url}/rest/v1/{path}"
    data = json.dumps(body).encode("utf-8")
    req = Request(url, data=data, method="POST", headers={
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "Prefer": prefer,
    })
    with urlopen(req) as resp:
        resp.read()


def patch_activities_template(base_url: str, key: str, activity_name: str, template_id: str) -> None:
    """PATCH activities.template_id por Activity name (coluna com espaços/barra)."""
    col = quote(f'"{ACTIVITY_COL}"', safe="")
    val = quote(activity_name, safe="")
    url = f"{base_url}/rest/v1/activities?{col}=eq.{val}"
    data = json.dumps({"template_id": template_id}).encode("utf-8")
    req = Request(url, data=data, method="PATCH", headers={
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    })
    with urlopen(req) as resp:
        resp.read()


# ----------------------------------------------------------- Helpers

def normalize_template_id(raw: str) -> str:
    # Preserva a caixa: template_id = af_sub3 exato do link AppsFlyer.
    import unicodedata
    s = unicodedata.normalize("NFD", raw.strip())
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return re.sub(r"\s+", "_", s)


def map_channel(raw: str) -> str | None:
    return CHANNEL_MAP.get((raw or "").strip().lower())


def app_family(template_id_lower: str) -> str | None:
    """'afinz' | 'plurix' | None — pela convenção do prefixo do template_id."""
    if template_id_lower.startswith(PLURIX_PREFIXES):
        return "plurix"
    if template_id_lower.startswith(AFINZ_PREFIXES):
        return "afinz"
    return None


def taxonomy_emissor(activity_name: str) -> str:
    """Primeiro token da taxonomia: 'afz', 'plu', etc."""
    return (activity_name or "").strip().lower().split("_", 1)[0]


# ----------------------------------------------------------- Leitura do CSV

def _norm_header(h: str) -> str:
    return " ".join(h.split()).strip().upper()


# Nomes de coluna aceitos (a planilha exportada do Sheets varia a ordem/qtd de
# colunas entre exports — ex.: uma variante tem "SALVO NA PASTA?" extra que
# desloca tudo). Por isso lemos por NOME de cabeçalho, nunca por posição fixa.
_COLUMN_ALIASES: dict[str, tuple[str, ...]] = {
    "flag": ("TEMPLATE SALVO?",),
    "app": ("APP",),
    "campanha": ("CAMPANHA (C)",),
    "semana": ("SEMANA / MOMENTO (AF_SUB2)",),
    "tid": ("ID TEMPLATE (AF_SUB3)",),
    "nome": ("NOME DO TEMPLATE (AUDITORIA)",),
    "activity": ("ACTIVITY NAME (AUDITORIA)",),
    "canal": ("CANAL (AF_CHANNEL)",),
    "segmento": ("SEGMENTO (AF_SUB1)",),
    "cod_canal": ("COD_CANAL",),
    "cod_campanha": ("COD_CAMPANHA",),
    "cod_segmento": ("COD_SEGMENTO",),
}


def read_governance(csv_path: str) -> list[dict]:
    with io.open(csv_path, encoding="latin-1", newline="") as fh:
        reader = list(csv.reader(fh, delimiter=";"))
    header = reader[0]
    idx_by_name = {_norm_header(h): i for i, h in enumerate(header)}

    def col(key: str) -> int:
        for candidate in _COLUMN_ALIASES[key]:
            if candidate in idx_by_name:
                return idx_by_name[candidate]
        raise KeyError(
            f"Coluna '{key}' (aliases {_COLUMN_ALIASES[key]!r}) não encontrada "
            f"no cabeçalho: {header!r}"
        )

    i_flag = col("flag")
    i_app = col("app")
    i_campanha = col("campanha")
    i_semana = col("semana")
    i_tid = col("tid")
    i_nome = col("nome")
    i_activity = col("activity")
    i_canal = col("canal")
    i_segmento = col("segmento")
    i_cod_canal = col("cod_canal")
    i_cod_campanha = col("cod_campanha")
    i_cod_segmento = col("cod_segmento")
    max_idx = max(i_flag, i_app, i_campanha, i_semana, i_tid, i_nome,
                  i_activity, i_canal, i_segmento, i_cod_canal,
                  i_cod_campanha, i_cod_segmento)

    out = []
    for i, r in enumerate(reader[1:], start=2):
        if len(r) <= max_idx:
            r = r + [""] * (max_idx + 1 - len(r))
        tid = r[i_tid].strip()
        if not tid:
            continue  # linha vazia / sem template_id
        out.append({
            "linha": i,
            "template_salvo_flag": r[i_flag].strip().upper() == "VERDADEIRO",
            "app": r[i_app].strip(),
            "campanha": r[i_campanha].strip(),
            "semana": r[i_semana].strip(),
            "template_id_planilha": tid,
            "nome_template": r[i_nome].strip(),
            "activity_name": r[i_activity].strip(),
            "canal_raw": r[i_canal].strip(),
            "segmento_af_sub1": r[i_segmento].strip(),
            "cod_canal": r[i_cod_canal].strip(),
            "cod_campanha": r[i_cod_campanha].strip(),
            "cod_segmento": r[i_cod_segmento].strip(),
        })
    return out


# ----------------------------------------------------------- Validação

def analyze(rows: list[dict], existing_activities: set[str],
            templates_with_asset: set[str], templates_existing: set[str]) -> dict:
    # Mapeia activity_name -> conjunto de apps (família) declarados na planilha
    apps_por_activity: dict[str, set[str]] = defaultdict(set)
    for r in rows:
        if r["activity_name"]:
            fam = app_family(r["template_id_planilha"].lower()) or r["app"].lower()
            apps_por_activity[r["activity_name"]].add(fam)

    report_rows = []
    for r in rows:
        tid_norm = normalize_template_id(r["template_id_planilha"])
        canal = map_channel(r["canal_raw"])
        an = r["activity_name"]
        fam = app_family(r["template_id_planilha"].lower())

        problemas: list[str] = []
        if not TEMPLATE_ID_RE.match(tid_norm):
            problemas.append(f"template_id inválido após normalizar: {tid_norm}")
        if canal is None:
            problemas.append(f"canal não reconhecido: '{r['canal_raw']}'")

        # Classificação. Consistência de taxonomia é checada SEMPRE que há
        # activity_name (independe de existir no banco) — uma cópia entre apps é
        # erro mesmo que a activity ainda não exista em `activities`.
        if not an:
            status = "planejado_sem_activity"
        else:
            suspeitas = []
            if len(apps_por_activity.get(an, set())) > 1:
                suspeitas.append(
                    f"activity_name reusado entre apps {sorted(apps_por_activity[an])} (provável cópia)"
                )
            emissor = taxonomy_emissor(an)
            if fam == "afinz" and emissor == "plu":
                suspeitas.append("template é família Afinz mas a taxonomia começa com 'plu' (Plurix)")
            if fam == "plurix" and emissor == "afz" and "grl" not in an.lower():
                suspeitas.append("template é Plurix mas a taxonomia começa com 'afz' sem marca 'grl'")

            existe = an in existing_activities
            if suspeitas:
                status = "suspeito"
                if not existe:
                    suspeitas.append("activity_name não encontrado em activities")
                problemas.extend(suspeitas)
            elif not existe:
                status = "activity_nao_encontrada"
            else:
                status = "ok"

        ja_cadastrado = tid_norm in templates_with_asset
        template_existe = tid_norm in templates_existing

        report_rows.append({
            "linha": r["linha"],
            "template_id": tid_norm,
            "template_id_planilha": r["template_id_planilha"],
            "activity_name": an,
            "app": r["app"],
            "canal": canal,
            "campanha": r["campanha"],
            "semana": r["semana"],
            "segmento_af_sub1": r["segmento_af_sub1"],
            "nome_template": r["nome_template"],
            "cod_canal": r["cod_canal"],
            "cod_campanha": r["cod_campanha"],
            "cod_segmento": r["cod_segmento"],
            "status": status,
            "ja_tem_asset": ja_cadastrado,
            "template_ja_existe": template_existe,
            "problemas": problemas,
        })

    # Agrega por status
    buckets: dict[str, list] = defaultdict(list)
    for rr in report_rows:
        buckets[rr["status"]].append(rr)

    templates_unicos = sorted({rr["template_id"] for rr in report_rows})
    return {
        "gerado_em": None,  # preenchido pelo chamador
        "total_linhas": len(report_rows),
        "templates_unicos": len(templates_unicos),
        "contagem_por_status": {k: len(v) for k, v in sorted(buckets.items())},
        "linhas": report_rows,
    }


# ----------------------------------------------------------- Apply

def _sql_str(s) -> str:
    if s is None:
        return "NULL"
    return "'" + str(s).replace("'", "''") + "'"


def build_sql(report: dict, include_suspeito: bool) -> str:
    """Gera o SQL idempotente do apply (para rodar via MCP/SQL editor)."""
    importaveis = [rr for rr in report["linhas"]
                   if rr["status"] != "suspeito" or include_suspeito]

    by_tid: dict[str, dict] = {}
    names_por_tid: dict[str, set[str]] = defaultdict(set)
    for rr in importaveis:
        if rr["activity_name"] and rr["status"] == "ok":
            names_por_tid[rr["template_id"]].add(rr["activity_name"])
        if rr["template_id"] in by_tid or rr["template_ja_existe"] or rr["canal"] is None:
            continue
        by_tid[rr["template_id"]] = rr

    # Metadados enxutos (decisão do operador): só app, campanha, semana, segmento_af_sub1.
    # NÃO grava activity_names — o vínculo template↔activity é marcado por humano depois
    # (quando a activity já existir no Supabase). Sem auto-link aqui.
    lines = ["-- GaaS governança: upsert de templates draft (metadados enxutos, sem vínculo)", "BEGIN;"]
    for tid, rr in by_tid.items():
        meta = {
            "source": "governanca_csv",
            "app": rr["app"],
            "campanha": rr["campanha"],
            "semana": rr["semana"],
            "segmento_af_sub1": rr["segmento_af_sub1"],
        }
        lines.append(
            "INSERT INTO public.communication_templates "
            "(template_id, title, channel, status, source_system, storage_bucket, metadata) VALUES ("
            f"{_sql_str(tid)}, {_sql_str(rr['nome_template'] or tid)}, {_sql_str(rr['canal'])}, "
            f"'draft', 'governanca', 'crm-communications', {_sql_str(json.dumps(meta, ensure_ascii=False))}::jsonb) "
            "ON CONFLICT (template_id) DO NOTHING;"
        )
    lines.append("COMMIT;")
    return "\n".join(lines)


def apply(report: dict, base_url: str, key: str, include_suspeito: bool) -> dict:
    importaveis = [
        rr for rr in report["linhas"]
        if rr["status"] != "suspeito" or include_suspeito
    ]

    # Upsert de templates como draft (agrupado por template_id). Metadados enxutos:
    # só app, campanha, semana, segmento_af_sub1. SEM activity_names e SEM auto-link —
    # o vínculo template↔activity é marcado por humano depois (camada B), quando a
    # activity já existir no Supabase.
    by_tid: dict[str, dict] = {}
    for rr in importaveis:
        if rr["template_id"] in by_tid or rr["template_ja_existe"] or rr["canal"] is None:
            continue
        by_tid[rr["template_id"]] = {
            "template_id": rr["template_id"],
            "title": rr["nome_template"] or rr["template_id"],
            "channel": rr["canal"],
            "status": "draft",
            "source_system": "governanca",
            "storage_bucket": "crm-communications",
            "metadata": {
                "source": "governanca_csv",
                "app": rr["app"],
                "campanha": rr["campanha"],
                "semana": rr["semana"],
                "segmento_af_sub1": rr["segmento_af_sub1"],
            },
        }

    drafts = list(by_tid.values())
    created = 0
    if drafts:
        for i in range(0, len(drafts), 100):
            post_json(base_url, key, "communication_templates", drafts[i:i + 100],
                      prefer="resolution=merge-duplicates,return=minimal")
        created = len(drafts)

    return {
        "templates_draft_upsert": created,
        "suspeitos_incluidos": include_suspeito,
    }


# ----------------------------------------------------------- main

def main() -> int:
    p = argparse.ArgumentParser()
    sub = p.add_subparsers(dest="cmd", required=True)

    pa = sub.add_parser("analyze")
    pa.add_argument("csv_path")
    pa.add_argument("--output", default=None)

    pp = sub.add_parser("apply")
    pp.add_argument("report_path")
    pp.add_argument("--include-suspeito", action="store_true")
    pp.add_argument("--emit-sql", action="store_true",
                    help="Imprime o SQL idempotente em vez de chamar a REST (para rodar via MCP).")

    default_key = (os.environ.get("SUPABASE_SERVICE_KEY")
                   or os.environ.get("SUPABASE_ANON_KEY")
                   or DEFAULT_SUPABASE_KEY)
    for sp in (pa, pp):
        sp.add_argument("--supabase-url", default=os.environ.get("SUPABASE_URL", DEFAULT_SUPABASE_URL))
        sp.add_argument("--supabase-key", default=default_key)

    args = p.parse_args()
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass
    base_url, key = args.supabase_url.rstrip("/"), args.supabase_key

    if args.cmd == "analyze":
        rows = read_governance(args.csv_path)
        acts = fetch_all(base_url, key, "activities",
                         {"select": f'"{ACTIVITY_COL}"'})
        existing = {a.get(ACTIVITY_COL) for a in acts if a.get(ACTIVITY_COL)}
        try:
            tmpls = fetch_all(base_url, key, "communication_templates",
                              {"select": "template_id,original_path"})
        except HTTPError as e:
            if e.code in (401, 403):
                print("AVISO: sem permissão para ler communication_templates com esta key "
                      "(RLS exige authenticated). Seguindo sem o cruzamento de 'já cadastrado'. "
                      "Para apply, use a service key (SUPABASE_SERVICE_KEY).", file=sys.stderr)
                tmpls = []
            else:
                raise
        with_asset = {t["template_id"] for t in tmpls if t.get("original_path")}
        existing_t = {t["template_id"] for t in tmpls}

        report = analyze(rows, existing, with_asset, existing_t)
        report["gerado_em"] = datetime.now().isoformat(timespec="seconds")

        out = args.output or str(Path(__file__).resolve().parents[1] /
                                 "outputs" / f"governance_report_{datetime.now():%Y%m%d_%H%M%S}.json")
        Path(out).parent.mkdir(parents=True, exist_ok=True)
        Path(out).write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")

        print(f"Relatório: {out}")
        print(f"Linhas: {report['total_linhas']} | template_ids únicos: {report['templates_unicos']}")
        print("Por status:")
        for k, v in report["contagem_por_status"].items():
            print(f"  - {k}: {v}")
        susp = [rr for rr in report["linhas"] if rr["status"] == "suspeito"]
        if susp:
            print("\nSUSPEITOS (revisar antes de aplicar):")
            for rr in susp:
                print(f"  linha {rr['linha']} | {rr['template_id']} <- {rr['activity_name']}")
                for pr in rr["problemas"]:
                    print(f"      · {pr}")
        return 0

    if args.cmd == "apply":
        report = json.loads(Path(args.report_path).read_text(encoding="utf-8"))
        if args.emit_sql:
            print(build_sql(report, args.include_suspeito))
            return 0
        result = apply(report, base_url, key, args.include_suspeito)
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return 0

    return 1


if __name__ == "__main__":
    sys.exit(main())
