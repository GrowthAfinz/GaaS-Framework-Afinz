"""Carga da LP do Pool Visa (GA4 -> Supabase).

Lê a GA4 Data API com as credenciais padrão do Google (ADC, só leitura) e gera um SQL que chama
public.pool_visa_lp_replace. O SQL tem dado de negócio: grave fora do repositório (ex.: ../../outputs).

Uso (Python com google-analytics-data, por exemplo o venv do analytics-mcp):
  python scripts/pool-visa-lp-ga4.py --start 2026-10-29 --end 2026-11-25 --out ../../outputs/pool-visa-relatorio/carga.sql
  python scripts/pool-visa-lp-ga4.py --out ../../outputs/pool-visa-relatorio/carga.sql --apply   # últimos 3 dias até ontem

--apply roda `npx supabase db query --linked --yes -f <out>` (escreve em produção) no checkout atual.
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import subprocess
import sys

from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import (
    DateRange,
    Dimension,
    Filter,
    FilterExpression,
    FilterExpressionList,
    Metric,
    RunReportRequest,
)

PROPERTY_ID = "439540906"  # cloud.relacionamento.afinz
HOST = "cloud.relacionamento.afinz.com.br"
DEFAULT_PAGES = ["/black afinz"]
EVENTS = ["clique_oferta", "clique_site_visa"]
PAGE_LIMIT = 100000


def exact(field: str, value: str) -> FilterExpression:
    return FilterExpression(filter=Filter(field_name=field, string_filter=Filter.StringFilter(match_type=Filter.StringFilter.MatchType.EXACT, value=value)))


def in_list(field: str, values: list[str]) -> FilterExpression:
    return FilterExpression(filter=Filter(field_name=field, in_list_filter=Filter.InListFilter(values=values)))


def all_of(*exprs: FilterExpression) -> FilterExpression:
    return FilterExpression(and_group=FilterExpressionList(expressions=list(exprs)))


def run(client: BetaAnalyticsDataClient, start: str, end: str, dims: list[str], metrics: list[str], flt: FilterExpression) -> list[dict]:
    out: list[dict] = []
    offset = 0
    while True:
        resp = client.run_report(RunReportRequest(
            property=f"properties/{PROPERTY_ID}",
            date_ranges=[DateRange(start_date=start, end_date=end)],
            dimensions=[Dimension(name=d) for d in dims],
            metrics=[Metric(name=m) for m in metrics],
            dimension_filter=flt,
            limit=PAGE_LIMIT,
            offset=offset,
        ))
        for row in resp.rows:
            rec = {d: v.value for d, v in zip(dims, row.dimension_values)}
            rec.update({m: int(v.value or 0) for m, v in zip(metrics, row.metric_values)})
            out.append(rec)
        offset += len(resp.rows)
        if not resp.rows or offset >= resp.row_count:
            return out


def iso(yyyymmdd: str) -> str:
    return f"{yyyymmdd[:4]}-{yyyymmdd[4:6]}-{yyyymmdd[6:]}"


def main() -> int:
    yesterday = dt.date.today() - dt.timedelta(days=1)
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--start", default=(yesterday - dt.timedelta(days=2)).isoformat())
    ap.add_argument("--end", default=yesterday.isoformat())
    ap.add_argument("--page", action="append", dest="pages", help="pagePath exato da LP (repetível). Padrão: /black afinz")
    ap.add_argument("--out", required=True, help="arquivo .sql de saída, fora do repositório")
    ap.add_argument("--apply", action="store_true", help="aplica o SQL com npx supabase db query --linked")
    args = ap.parse_args()
    pages = args.pages or DEFAULT_PAGES

    out_abs = os.path.abspath(args.out)
    repo = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    if out_abs.startswith(repo + os.sep):
        print("Grave o SQL fora do repositório: ele leva dado de negócio.", file=sys.stderr)
        return 2

    client = BetaAnalyticsDataClient()
    base = all_of(exact("hostName", HOST), in_list("pagePath", pages))

    traffic = run(client, args.start, args.end, ["date", "hostName", "pagePath", "sessionSourceMedium"], ["sessions", "screenPageViews", "totalUsers"], base)
    # A Data API conta dimensões de filtro no limite de 9; os eventos já usam 9 dimensões,
    # então aqui o filtro fica em página + evento (a página é exclusiva do host da LP).
    event_filter = all_of(in_list("pagePath", pages), in_list("eventName", EVENTS))
    events = run(client, args.start, args.end,
                 ["date", "eventName", "pagePath", "sessionSourceMedium", "customEvent:marca", "customEvent:oferta_id", "customEvent:parceiro", "customEvent:grupo", "customEvent:celula"],
                 ["eventCount", "totalUsers"], event_filter)
    totals = run(client, args.start, args.end, ["eventName"], ["eventCount"], event_filter)
    api_total = sum(r["eventCount"] for r in totals)

    payload = {
        "source": "ga4_api",
        "property_id": PROPERTY_ID,
        "date_start": args.start,
        "date_end": args.end,
        "api_total_events": api_total,
        "note": f"pages={pages}",
        "traffic": [
            {"event_date": iso(r["date"]), "host_name": r["hostName"], "page_path": r["pagePath"], "source_medium": r["sessionSourceMedium"],
             "sessions": r["sessions"], "page_views": r["screenPageViews"], "users_day": r["totalUsers"]}
            for r in traffic
        ],
        "events": [
            {"event_date": iso(r["date"]), "event_name": r["eventName"], "page_path": r["pagePath"], "source_medium": r["sessionSourceMedium"],
             "marca_raw": r["customEvent:marca"], "oferta_id_raw": r["customEvent:oferta_id"], "parceiro_raw": r["customEvent:parceiro"],
             "grupo_raw": r["customEvent:grupo"], "celula_raw": r["customEvent:celula"], "event_count": r["eventCount"], "users_day": r["totalUsers"]}
            for r in events
        ],
    }
    body = json.dumps(payload, ensure_ascii=False)
    tag = "$pool$"
    if tag in body:
        print("Payload contém o delimitador do SQL.", file=sys.stderr)
        return 2
    os.makedirs(os.path.dirname(out_abs), exist_ok=True)
    with open(out_abs, "w", encoding="utf-8") as fh:
        fh.write(f"select public.pool_visa_lp_replace({tag}{body}{tag}::jsonb) as resultado;\n")

    summed = sum(e["event_count"] for e in payload["events"])
    print(f"Período {args.start} a {args.end} · páginas {pages}")
    print(f"Visitas: {len(payload['traffic'])} linhas · {sum(t['sessions'] for t in payload['traffic'])} sessões")
    print(f"Eventos: {len(payload['events'])} linhas · soma {summed} · total GA4 {api_total} · {'ok' if summed == api_total else 'DIVERGENTE'}")
    print(f"SQL: {out_abs}")

    if args.apply:
        # --yes confirma a escrita em produção: --apply já é a autorização explícita de quem roda.
        proc = subprocess.run(f'npx supabase db query --linked --yes -f "{out_abs}"', shell=True, cwd=repo)
        return proc.returncode
    return 0


if __name__ == "__main__":
    sys.exit(main())
