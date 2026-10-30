"""Liga as mensagens extraídas aos resultados de `activities` e ranqueia os templates.

Uso:
  python rank_templates.py --messages <saida>/messages.json --results <resultados.json|.csv>
                           --out <saida> [--min-base 300] [--maturacao-dias 10] [--hoje AAAA-MM-DD]
                           [--agrupar canal|canal_caminho] [--incluir-optout]

resultados = retorno do results_query.sql (lista de objetos JSON ou CSV com cabeçalho).

Gera ranking.md e ranking.csv em <saida>. Métrica principal: conversão = cartões / base acionável
(função-objetivo tática do CLAUDE.md). CAC = custo / cartões, só de linhas com cartão preenchido.
"""
import argparse
import csv
import datetime as dt
import hashlib
import json
import os
from collections import defaultdict


def load_results(path):
    if path.lower().endswith(".csv"):
        with open(path, encoding="utf-8-sig") as fh:
            sample = fh.read(2048)
            fh.seek(0)
            delim = ";" if sample.count(";") > sample.count(",") else ","
            return list(csv.DictReader(fh, delimiter=delim))
    with open(path, encoding="utf-8") as fh:
        data = json.load(fh)
    return data["rows"] if isinstance(data, dict) and "rows" in data else data


def num(v):
    if v in (None, "", "null"):
        return None
    try:
        return float(str(v).replace(",", "."))
    except ValueError:
        return None


def norm_j(j):
    """Mesma jornada com prefixo JOR_AQS_ ou JOR_AQUISICAO_ e espaço sobrando no fim."""
    import re
    return re.sub(r"^JOR_(AQS|AQUISICAO)_", "JOR_AQ_", (j or "").strip().upper())


def template_key(m):
    if m.get("af_sub3"):
        return f"af_sub3:{m['af_sub3']}"
    if m.get("template_meta"):
        return f"meta:{m['template_meta']}"
    if m.get("texto"):
        return "texto:" + hashlib.md5(m["texto"].strip().encode("utf-8")).hexdigest()[:8]
    return f"asset:{m.get('asset_nome') or m['activity_name']}"


def template_label(m):
    bits = []
    if m.get("template_meta"):
        bits.append(m["template_meta"])
    if m.get("af_sub3"):
        bits.append(m["af_sub3"])
    if not bits and m.get("asset_nome"):
        bits.append(m["asset_nome"])
    txt = (m.get("texto") or "").replace("\n", " ").strip()
    if txt:
        bits.append("“" + (txt[:70] + "…" if len(txt) > 70 else txt) + "”")
    return " · ".join(bits) or m["activity_name"]


def confianca(base):
    if base is None:
        return "sem base"
    if base >= 5000:
        return "alta"
    if base >= 1000:
        return "média"
    if base >= 300:
        return "baixa"
    return "insuficiente"


def pct(a, b):
    return (a / b) if (a is not None and b) else None


def fmt_pct(v, casas=2):
    return "" if v is None else f"{v * 100:.{casas}f}%".replace(".", ",")


def fmt_brl(v):
    return "" if v is None else ("R$ " + f"{v:,.2f}").replace(",", "X").replace(".", ",").replace("X", ".")


def fmt_int(v):
    return "" if v is None else f"{v:,.0f}".replace(",", ".")


def main():
    import sys
    sys.stdout.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser()
    ap.add_argument("--messages", required=True)
    ap.add_argument("--results", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--min-base", type=float, default=300)
    ap.add_argument("--maturacao-dias", type=int, default=10)
    ap.add_argument("--hoje", default=dt.date.today().isoformat())
    ap.add_argument("--agrupar", choices=["canal", "canal_caminho"], default="canal")
    ap.add_argument("--incluir-optout", action="store_true")
    ap.add_argument("--filtro-jornada", help="só mensagens cuja jornada contém este texto (ex.: 21D)")
    ap.add_argument("--filtro-caminho", help="só mensagens cujo caminho na jornada contém este texto "
                                             "(ex.: 'api serasa' ou 'institucional' para separar públicos)")
    ap.add_argument("--somar-outras-jornadas", action="store_true",
                    help="soma resultados do mesmo activity_name em jornadas que não vieram no pacote "
                         "(ex.: a mesma atividade reaproveitada em MAIO26 e JUL26). Só use se o conteúdo é o mesmo.")
    args = ap.parse_args()
    hoje = dt.date.fromisoformat(args.hoje)

    with open(args.messages, encoding="utf-8") as fh:
        msgs = json.load(fh)
    if not args.incluir_optout:
        msgs = [m for m in msgs if not m["tipo_resposta_optout"]]
    if args.filtro_jornada:
        msgs = [m for m in msgs if args.filtro_jornada.lower() in m["jornada"].lower()]
    if args.filtro_caminho:
        msgs = [m for m in msgs if args.filtro_caminho.lower() in (m["caminho"] or "").lower()]
    results = load_results(args.results)
    jornadas_pacote = {norm_j(m["jornada"]) for m in msgs}

    by_act_jor = defaultdict(list)
    by_act = defaultdict(list)
    for i, r in enumerate(results):
        r["_id"] = i
        a = (r.get("activity_name") or "").strip()
        by_act_jor[(a, norm_j(r.get("jornada")))].append(r)
        by_act[a].append(r)

    groups = {}
    unmatched = []
    outras = defaultdict(set)
    for m in msgs:
        exatas = by_act_jor.get((m["activity_name"], norm_j(m["jornada"])), [])
        fora = [r for r in by_act.get(m["activity_name"], [])
                if norm_j(r.get("jornada")) not in jornadas_pacote]
        rs = exatas + (fora if args.somar_outras_jornadas else [])
        if not exatas and not rs:
            unmatched.append(m)
        for r in fora:
            outras[m["activity_name"]].add((r.get("jornada") or "").strip())
        gkey = (m["canal"],) if args.agrupar == "canal" else (m["canal"], m["caminho"])
        key = gkey + (template_key(m),)
        g = groups.setdefault(key, {"canal": m["canal"], "caminho": set(), "label": template_label(m),
                                     "activities": set(), "jornadas": set(), "results": {}, "msg": m})
        g["caminho"].add(m["caminho"] or "(sem decisão)")
        g["activities"].add(m["activity_name"])
        g["jornadas"].add(m["jornada"])
        for r in rs:
            g["results"][r["_id"]] = r

    table = []
    for key, g in groups.items():
        rs = list(g["results"].values())
        linhas = sum(num(r.get("linhas")) or 0 for r in rs)
        com_cart = sum(num(r.get("linhas_com_cartoes")) or 0 for r in rs)
        base = sum(num(r.get("base_acionavel")) or 0 for r in rs) or None
        prop = sum(num(r.get("propostas")) or 0 for r in rs)
        aprov = sum(num(r.get("aprovados")) or 0 for r in rs)
        cart = sum(num(r.get("cartoes")) or 0 for r in rs)
        custo_cart = sum((num(r.get("custo")) or 0) for r in rs if num(r.get("cartoes")) is not None)
        ultimos = [r.get("ultimo_disparo") for r in rs if r.get("ultimo_disparo")]
        ultimo = max(ultimos)[:10] if ultimos else None
        imaturo = bool(ultimo and (hoje - dt.date.fromisoformat(ultimo)).days < args.maturacao_dias)
        table.append({
            "canal": g["canal"],
            "caminho": " | ".join(sorted(g["caminho"])),
            "template": g["label"],
            "activity_names": " | ".join(sorted(g["activities"])),
            "jornadas": " | ".join(sorted(g["jornadas"])),
            "linhas": linhas, "cobertura": pct(com_cart, linhas),
            "base": base, "propostas": prop, "aprovados": aprov, "cartoes": cart,
            "conversao": pct(cart, base), "proposta_por_base": pct(prop, base),
            "finalizacao": pct(cart, aprov), "cac": (custo_cart / cart) if cart else None,
            "confianca": confianca(base), "ultimo_disparo": ultimo, "imaturo": imaturo,
            "sem_resultado": not rs,
        })

    def elegivel(t):
        return (not t["sem_resultado"]) and t["base"] and t["base"] >= args.min_base and (t["cobertura"] or 0) > 0

    out_md = [f"# Ranking de templates ({args.hoje})", "",
              f"Métrica principal: conversão = cartões / base acionável. Base mínima para ranquear: {fmt_int(args.min_base)}. "
              f"Disparo nos últimos {args.maturacao_dias} dias = imaturo.", ""]
    csv_rows = []
    for canal in sorted({t["canal"] for t in table}):
        sub = [t for t in table if t["canal"] == canal]
        ok = sorted([t for t in sub if elegivel(t)], key=lambda t: (-(t["conversao"] or 0), -(t["cartoes"] or 0)))
        rest = [t for t in sub if not elegivel(t)]
        out_md += [f"## {canal}", "",
                   "| # | Template | Caminho | Base | Propostas | Cartões | Conversão | Prop/base | CAC | Confiança | Cobertura | Último |",
                   "|---:|---|---|---:|---:|---:|---:|---:|---:|---|---:|---|"]
        for i, t in enumerate(ok, 1):
            flag = " ⏳" if t["imaturo"] else ""
            out_md.append(f"| {i} | {t['template']}<br>`{t['activity_names']}` | {t['caminho']} | {fmt_int(t['base'])} | "
                          f"{fmt_int(t['propostas'])} | {fmt_int(t['cartoes'])} | **{fmt_pct(t['conversao'])}** | "
                          f"{fmt_pct(t['proposta_por_base'])} | {fmt_brl(t['cac'])} | {t['confianca']} | "
                          f"{fmt_pct(t['cobertura'], 0)} | {t['ultimo_disparo'] or ''}{flag} |")
            csv_rows.append(dict(t, rank=i))
        if rest:
            out_md += ["", "Fora do ranking (sem resultado, base abaixo do mínimo ou sem cartão preenchido):", ""]
            for t in rest:
                motivo = "sem linha em activities" if t["sem_resultado"] else (
                    "sem cartão preenchido" if not (t["cobertura"] or 0) else f"base {fmt_int(t['base'])}")
                out_md.append(f"- {t['template']} (`{t['activity_names']}`): {motivo}")
                csv_rows.append(dict(t, rank=None))
        out_md.append("")
    if unmatched:
        out_md += ["## Mensagens do pacote sem resultado ligado", ""]
        out_md += [f"- `{m['activity_name']}` ({m['jornada']} v{m['jornada_versao']})" for m in unmatched]
        out_md.append("")
    if outras:
        acao = "somadas" if args.somar_outras_jornadas else "NÃO somadas (use --somar-outras-jornadas se o conteúdo for o mesmo)"
        out_md += [f"## Mesmo activity_name em jornadas fora do pacote: {acao}", ""]
        out_md += [f"- `{a}`: {', '.join(sorted(js))}" for a, js in sorted(outras.items())]

    os.makedirs(args.out, exist_ok=True)
    with open(os.path.join(args.out, "ranking.md"), "w", encoding="utf-8") as fh:
        fh.write("\n".join(out_md) + "\n")
    cols = ["rank", "canal", "template", "activity_names", "caminho", "jornadas", "linhas", "cobertura", "base",
            "propostas", "aprovados", "cartoes", "conversao", "proposta_por_base", "finalizacao", "cac",
            "confianca", "ultimo_disparo", "imaturo", "sem_resultado"]
    with open(os.path.join(args.out, "ranking.csv"), "w", encoding="utf-8-sig", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=cols, delimiter=";", extrasaction="ignore")
        w.writeheader()
        w.writerows(csv_rows)
    print("\n".join(out_md))


if __name__ == "__main__":
    main()
