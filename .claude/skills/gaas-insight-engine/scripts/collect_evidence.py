#!/usr/bin/env python3
"""GaaS Insight Engine - Camada 1 (deterministica).

Coleta dados do Supabase, agrega com ponderacao sum/sum (nunca avg de taxas),
compara com baselines e emite um EVIDENCE PACK (JSON) com sinais candidatos.
Nenhuma narrativa aqui - apenas numeros conferiveis.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from collections import defaultdict
from datetime import date, datetime, timedelta
from pathlib import Path
from urllib.error import HTTPError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

DEFAULT_SUPABASE_URL = "https://mipiwxadnpwtcgfcedym.supabase.co"
DEFAULT_SUPABASE_KEY = os.environ.get("SUPABASE_ANON_KEY", "")

PAGE_SIZE = 1000

# Baselines do vault (snapshot 2026-06-10) - ver references/baselines.md
FUNNEL_BASELINE_FRIA = {
    "entrega": 0.90,
    "abertura": 0.092,
    "proposta": 0.118,
    "aprovacao": 0.58,
    "conversao": 0.067,
}
SEGMENT_BASELINE = {
    "Abandonados": {"conv": 0.061, "cac": 4.83},
    "Aprovados_nao_convertidos": {"conv": 0.164, "cac": 93.51},
    "Negados": {"conv": 0.167, "cac": 39.04},
    "Leads_Parceiros": {"conv": 0.089, "cac": 13.55},
    "CRM": {"conv": 0.033, "cac": 10.15},
    "Base_Proprietaria": {"conv": 0.026, "cac": 14.29},
}

ETAPAS_FOCO = ("Aquisicao", "Meio_de_Funil")


# ---------------------------------------------------------------- Supabase REST

def fetch_all(base_url: str, key: str, table: str, params: dict) -> list[dict]:
    """Pagina via Range headers ate esgotar a tabela/consulta."""
    rows: list[dict] = []
    offset = 0
    while True:
        query = urlencode(params, doseq=True)
        url = f"{base_url}/rest/v1/{table}?{query}"
        req = Request(url, headers={
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Range-Unit": "items",
            "Range": f"{offset}-{offset + PAGE_SIZE - 1}",
        })
        try:
            with urlopen(req, timeout=60) as resp:
                chunk = json.loads(resp.read().decode("utf-8"))
        except HTTPError as exc:
            body = exc.read().decode("utf-8", errors="replace")
            raise SystemExit(f"Supabase HTTP {exc.code} em {table}: {body}") from exc
        rows.extend(chunk)
        if len(chunk) < PAGE_SIZE:
            return rows
        offset += PAGE_SIZE


def num(value) -> float:
    if value is None:
        return 0.0
    if isinstance(value, (int, float)):
        return float(value)
    try:
        return float(str(value).replace("R$", "").replace("%", "").replace(".", "").replace(",", ".").strip())
    except ValueError:
        return 0.0


def safe_div(a: float, b: float) -> float | None:
    return round(a / b, 6) if b else None


# ---------------------------------------------------------------- agregadores

class Cell:
    """Acumulador ponderado: sempre sum/sum, nunca media de taxas."""

    __slots__ = ("disparos", "base", "enviados_calc", "propostas", "aprovados",
                 "cartoes", "custo", "aberturas", "cliques")

    def __init__(self) -> None:
        self.disparos = 0
        self.base = 0.0
        self.propostas = 0.0
        self.aprovados = 0.0
        self.cartoes = 0.0
        self.custo = 0.0
        self.aberturas = 0.0
        self.cliques = 0.0

    def add(self, row: dict) -> None:
        self.disparos += 1
        self.base += num(row.get("Base Acionável"))
        self.propostas += num(row.get("Propostas"))
        self.aprovados += num(row.get("Aprovados"))
        self.cartoes += num(row.get("Cartões Gerados"))
        self.custo += num(row.get("Custo Total Campanha"))
        self.aberturas += num(row.get("Abertura"))
        self.cliques += num(row.get("Cliques"))

    def confianca(self) -> str:
        if self.disparos >= 10 and self.base >= 10_000:
            return "alta"
        if self.disparos >= 3:
            return "media"
        return "baixa"

    def to_dict(self) -> dict:
        return {
            "disparos": self.disparos,
            "base_acionavel": round(self.base),
            "propostas": round(self.propostas),
            "aprovados": round(self.aprovados),
            "cartoes": round(self.cartoes),
            "custo_total": round(self.custo, 2),
            "conv_ponderada": safe_div(self.cartoes, self.base),
            "cac_ponderado": safe_div(self.custo, self.cartoes),
            "tx_proposta_pond": safe_div(self.propostas, self.base),
            "tx_aprovacao_pond": safe_div(self.aprovados, self.propostas),
            "confianca": self.confianca(),
        }


def group_rows(rows: list[dict], key_fn) -> dict:
    groups: dict = defaultdict(Cell)
    for row in rows:
        groups[key_fn(row)].add(row)
    return groups


# ---------------------------------------------------------------- sinais

def signal_funnel_bottleneck(rows: list[dict]) -> list[dict]:
    """Gargalo de funil POR ETAPA de aquisicao (guardrail: fria != meio de funil)."""
    out = []
    for etapa in ETAPAS_FOCO:
        cell = Cell()
        for r in rows:
            if r.get("Etapa de aquisição") == etapa:
                cell.add(r)
        if cell.disparos == 0:
            continue
        d = cell.to_dict()
        baseline = FUNNEL_BASELINE_FRIA if etapa == "Aquisicao" else None
        out.append({
            "signal_type": "gargalo",
            "etapa": etapa,
            "janela": "periodo_analise",
            "funil_ponderado": d,
            "baseline_fria": baseline,
            "nota": "comparar com baseline SOMENTE dentro da mesma etapa; meio de funil nao tem baseline de funil completo - usar segment baseline",
        })
    return out


def signal_cac_decomposition(cur: list[dict], prev: list[dict]) -> dict | None:
    """Decomposicao aritmetica: delta CAC = efeito custo vs efeito cartoes."""
    c_cur, c_prev = Cell(), Cell()
    for r in cur:
        c_cur.add(r)
    for r in prev:
        c_prev.add(r)
    if not (c_cur.cartoes and c_prev.cartoes and c_prev.custo):
        return None
    cac_cur = c_cur.custo / c_cur.cartoes
    cac_prev = c_prev.custo / c_prev.cartoes
    # efeito custo: o que o CAC seria se cartoes ficassem constantes
    cac_so_custo = c_cur.custo / c_prev.cartoes
    return {
        "signal_type": "decomposicao_cac",
        "cac_atual": round(cac_cur, 2),
        "cac_anterior": round(cac_prev, 2),
        "delta_cac": round(cac_cur - cac_prev, 2),
        "efeito_custo": round(cac_so_custo - cac_prev, 2),
        "efeito_cartoes": round(cac_cur - cac_so_custo, 2),
        "custo": {"atual": round(c_cur.custo, 2), "anterior": round(c_prev.custo, 2)},
        "cartoes": {"atual": round(c_cur.cartoes), "anterior": round(c_prev.cartoes)},
        "confianca": min(c_cur.confianca(), c_prev.confianca(), key=["baixa", "media", "alta"].index),
    }


def signal_portfolio_share(rows: list[dict]) -> list[dict]:
    """Share de volume vs share de emissoes por Segmento x BU."""
    total = Cell()
    for r in rows:
        total.add(r)
    if not (total.base and total.cartoes):
        return []
    groups = group_rows(rows, lambda r: (r.get("Segmento") or "N/A", r.get("BU") or "N/A"))
    out = []
    for (segmento, bu), cell in groups.items():
        if cell.disparos < 3:
            continue
        share_vol = cell.base / total.base
        share_em = cell.cartoes / total.cartoes
        if share_vol < 0.02 and share_em < 0.02:
            continue  # materialidade
        d = cell.to_dict()
        d.update({
            "signal_type": "share_portfolio",
            "segmento": segmento,
            "bu": bu,
            "share_volume": round(share_vol, 4),
            "share_emissoes": round(share_em, 4),
            "indice_eficiencia": safe_div(share_em, share_vol),
            "baseline_segmento": SEGMENT_BASELINE.get(segmento),
        })
        out.append(d)
    return sorted(out, key=lambda x: -(x["share_emissoes"] or 0))


def signal_concentration(rows: list[dict]) -> dict | None:
    """Quantos segmentos somam 70% das emissoes + concentracao por canal."""
    seg = group_rows(rows, lambda r: r.get("Segmento") or "N/A")
    canal = group_rows(rows, lambda r: r.get("Canal") or "N/A")
    total_cartoes = sum(c.cartoes for c in seg.values())
    if not total_cartoes:
        return None
    ranked = sorted(seg.items(), key=lambda kv: -kv[1].cartoes)
    cum, n70, top = 0.0, 0, []
    for name, cell in ranked:
        cum += cell.cartoes
        n70 += 1
        top.append({"segmento": name, "cartoes": round(cell.cartoes), "share": round(cell.cartoes / total_cartoes, 4)})
        if cum / total_cartoes >= 0.70:
            break
    canais = sorted(
        ({"canal": k, "cartoes": round(c.cartoes), "share": round(c.cartoes / total_cartoes, 4), "disparos": c.disparos}
         for k, c in canal.items()), key=lambda x: -x["cartoes"])
    return {
        "signal_type": "risco_concentracao",
        "total_cartoes": round(total_cartoes),
        "segmentos_ate_70pct": n70,
        "top_segmentos": top,
        "emissoes_por_canal": canais,
    }


def signal_opportunities(rows: list[dict]) -> list[dict]:
    """Lacunas: canal zerado em segmento forte; segmentos eficientes com pouco volume."""
    out = []
    seg_canal = group_rows(rows, lambda r: (r.get("Segmento") or "N/A", r.get("Canal") or "N/A"))
    seg_tot = group_rows(rows, lambda r: r.get("Segmento") or "N/A")
    canais_existentes = sorted({r.get("Canal") for r in rows if r.get("Canal")})
    for segmento, cell in seg_tot.items():
        baseline = SEGMENT_BASELINE.get(segmento)
        if not baseline or cell.disparos < 10:
            continue
        usados = {c for (s, c) in seg_canal if s == segmento and seg_canal[(s, c)].disparos > 0}
        zerados = [c for c in canais_existentes if c not in usados]
        if zerados:
            out.append({
                "signal_type": "oportunidade",
                "subtipo": "canal_zerado_em_segmento_forte",
                "segmento": segmento,
                "canais_zerados": zerados,
                "canais_usados": {c: seg_canal[(segmento, c)].to_dict() for c in usados},
                "baseline_segmento": baseline,
                "totais_segmento": cell.to_dict(),
            })
    return out


def signal_drop_7d(rows_by_date: dict[str, Cell], today: date) -> dict | None:
    """Ultimos 7 dias fechados vs 7 anteriores (intervalos semiabertos, dia corrente fora)."""
    end = today  # exclusivo
    mid = end - timedelta(days=7)
    start = mid - timedelta(days=7)

    def window(a: date, b: date) -> Cell:
        acc = Cell()
        for ds, cell in rows_by_date.items():
            try:
                d = date.fromisoformat(ds[:10])
            except ValueError:
                continue
            if a <= d < b:
                for attr in Cell.__slots__:
                    if attr != "enviados_calc" and hasattr(cell, attr):
                        setattr(acc, attr, getattr(acc, attr) + getattr(cell, attr))
        return acc

    cur, prev = window(mid, end), window(start, mid)
    if cur.disparos == 0 and prev.disparos == 0:
        return None
    return {
        "signal_type": "queda_performance",
        "janela_atual": {"inicio": str(mid), "fim_exclusivo": str(end), **cur.to_dict()},
        "janela_anterior": {"inicio": str(start), "fim_exclusivo": str(mid), **prev.to_dict()},
    }


def signal_safra_turns(base_url: str, key: str) -> list[dict]:
    """Viradas safra-over-safra via view ponderada (so confianca != baixa)."""
    rows = fetch_all(base_url, key, "vw_performance_bu_segmento_safra", {
        "select": "*",
        "confianca": "neq.baixa",
        "order": "safra.asc",
    })
    series: dict = defaultdict(list)
    for r in rows:
        series[(r.get("bu"), r.get("segmento"))].append(r)
    out = []
    for (bu, segmento), seq in series.items():
        seq = [r for r in seq if r.get("cac_ponderado") is not None]
        for prev, cur in zip(seq, seq[1:]):
            cac_p, cac_c = num(prev["cac_ponderado"]), num(cur["cac_ponderado"])
            conv_p, conv_c = num(prev.get("conv_ponderada")), num(cur.get("conv_ponderada"))
            if not cac_p or not cac_c:
                continue
            ratio = cac_c / cac_p
            if ratio <= 0.5 or ratio >= 2.0:  # virada material: CAC dobrou ou caiu pela metade
                out.append({
                    "signal_type": "virada_safra",
                    "bu": bu,
                    "segmento": segmento,
                    "safra_anterior": prev["safra"],
                    "safra_atual": cur["safra"],
                    "cac": {"anterior": round(cac_p, 2), "atual": round(cac_c, 2), "ratio": round(ratio, 2)},
                    "conv": {"anterior": round(conv_p, 4), "atual": round(conv_c, 4)},
                    "disparos": {"anterior": prev["disparos"], "atual": cur["disparos"]},
                    "confianca": cur.get("confianca"),
                })
    return sorted(out, key=lambda x: x["safra_atual"], reverse=True)[:10]


# ---------------------------------------------------------------- main

def main() -> None:
    parser = argparse.ArgumentParser(description="GaaS Insight Engine - evidence pack")
    parser.add_argument("--window-days", type=int, default=28, help="janela de analise (dias fechados)")
    parser.add_argument("--output", default=None, help="caminho do JSON de saida")
    parser.add_argument("--supabase-url", default=os.environ.get("SUPABASE_URL", DEFAULT_SUPABASE_URL))
    parser.add_argument("--supabase-key", default=os.environ.get("SUPABASE_ANON_KEY", DEFAULT_SUPABASE_KEY))
    parser.add_argument("--activities-json", default=None,
                        help="JSON {cols, rows} com activities das duas janelas, exportado via conector "
                             "Supabase (a leitura anonima de activities foi revogada). Ver gaas-loop/loop/queries.sql Q10.")
    args = parser.parse_args()

    today = date.today()
    window_start = today - timedelta(days=args.window_days)
    prev_start = window_start - timedelta(days=args.window_days)

    base_url, key = args.supabase_url.rstrip("/"), args.supabase_key

    select_cols = ",".join([
        '"BU"', '"Canal"', '"Segmento"', '"Etapa de aquisição"', '"Safra"', '"Parceiro"',
        '"Data de Disparo"', '"Base Acionável"', '"Propostas"', '"Aprovados"',
        '"Cartões Gerados"', '"Custo Total Campanha"', '"Abertura"', '"Cliques"',
        '"Taxa de Entrega"', '"Taxa de Abertura"', "status",
    ])

    exported: list[dict] | None = None
    if args.activities_json:
        payload = json.loads(Path(args.activities_json).read_text(encoding="utf-8"))
        cols = payload["cols"]
        exported = [dict(zip(cols, row)) for row in payload["rows"]]

    def fetch_window(a: date, b: date) -> list[dict]:
        if exported is not None:
            return [r for r in exported
                    if r.get("status") == "Realizado"
                    and a.isoformat() <= (r.get("Data de Disparo") or "")[:10] < b.isoformat()]
        return fetch_all(base_url, key, "activities", {
            "select": select_cols,
            "status": "eq.Realizado",
            "Data de Disparo": [f"gte.{a.isoformat()}", f"lt.{b.isoformat()}"],
        })

    print(f"Coletando activities {window_start} -> {today} (janela atual)...", file=sys.stderr)
    cur_rows = [r for r in fetch_window(window_start, today)
                if r.get("Etapa de aquisição") in ETAPAS_FOCO]
    print(f"  {len(cur_rows)} disparos na janela atual", file=sys.stderr)
    prev_rows = [r for r in fetch_window(prev_start, window_start)
                 if r.get("Etapa de aquisição") in ETAPAS_FOCO]
    print(f"  {len(prev_rows)} disparos na janela anterior", file=sys.stderr)

    by_date: dict[str, Cell] = defaultdict(Cell)
    for r in cur_rows + prev_rows:
        ds = (r.get("Data de Disparo") or "")[:10]
        if ds:
            by_date[ds].add(r)

    pack = {
        "meta": {
            "gerado_em": datetime.now().isoformat(timespec="seconds"),
            "janela_dias": args.window_days,
            "periodo_atual": {"inicio": str(window_start), "fim_exclusivo": str(today)},
            "periodo_anterior": {"inicio": str(prev_start), "fim_exclusivo": str(window_start)},
            "escopo": "aquisicao CRM (etapas Aquisicao + Meio_de_Funil, status Realizado)",
            "disparos_janela_atual": len(cur_rows),
            "disparos_janela_anterior": len(prev_rows),
            "regra_ponderacao": "sum/sum - nunca media de taxas",
            "regra_confianca": "alta: >=10 disparos e >=10k base; media: >=3 disparos; baixa: resto",
        },
        "sinais": {
            "gargalo_funil": signal_funnel_bottleneck(cur_rows),
            "decomposicao_cac": signal_cac_decomposition(cur_rows, prev_rows),
            "share_portfolio": signal_portfolio_share(cur_rows),
            "risco_concentracao": signal_concentration(cur_rows),
            "oportunidades": signal_opportunities(cur_rows),
            "queda_7d_vs_7d": signal_drop_7d(by_date, today),
            "viradas_safra": signal_safra_turns(base_url, key),
        },
    }

    out_path = Path(args.output) if args.output else Path("outputs") / f"evidence_pack_{datetime.now():%Y%m%d_%H%M%S}.json"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(pack, ensure_ascii=False, indent=2), encoding="utf-8")
    print(str(out_path))


if __name__ == "__main__":
    main()
