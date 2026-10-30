"""Extrai cada mensagem (WhatsApp, SMS, e-mail, push) de um pacote do Package Manager.

Uso:
  python extract_messages.py <pacote.zip|pasta> [<pacote2.zip> ...] --out <pasta_saida>

Gera em <pasta_saida>:
  messages.json      uma linha por atividade de mensagem, com jornada, caminho na jornada,
                     texto, parâmetros, link, af_sub1/2/3 e alertas de campo
  messages.csv       o mesmo em tabela (UTF-8 com BOM, abre direto no Excel)
  results_query.sql  consulta pronta pra buscar os resultados dessas atividades em `activities`
"""
import argparse
import csv
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from pkg_common import PERSONALIZATION, Package, asset_content, crit_text, link_params  # noqa: E402

MSG_TYPES = {"WHATSAPPACTIVITY": "WhatsApp", "SMSSYNC": "SMS", "EMAILV2": "E-mail",
             "PUSHNOTIFICATIONACTIVITY": "Push"}
OPTOUT = re.compile(r"optout|opt_out|resposta", re.I)


def channel_from_name(name):
    m = re.search(r"_(wpp|sms|email|push)_", name or "")
    return {"wpp": "WhatsApp", "sms": "SMS", "email": "E-mail", "push": "Push"}.get(m.group(1)) if m else None


def journey_paths(pkg, d):
    """Para cada atividade, a lista de rótulos de decisão/split/espera percorridos até ela."""
    acts = {a["key"]: a for a in d["activities"]}
    nexts = {o.get("next") for a in d["activities"] for o in a.get("outcomes", []) if o.get("next")}
    roots = [a["key"] for a in d["activities"] if a["key"] not in nexts]
    paths = {}

    def label(a, o):
        md = o.get("metaData", {})
        if a["type"] == "MULTICRITERIADECISION":
            crit = a.get("configurationArguments", {}).get("criteria", {})
            lab = md.get("label") or o["key"]
            if o["key"] in crit:
                return f"{lab} ({md.get('criteriaDescription') or crit_text(pkg, crit[o['key']])})"
            return lab
        if a["type"] == "RANDOMSPLIT":
            return f"split {o.get('arguments', {}).get('percentage')}%"
        if a["type"] == "WAITUNTILCHATRESPONSE":
            return md.get("label") or {"EventFired": "respondeu outra coisa", "no_event": "sem resposta"}.get(o["key"], o["key"])
        if a['type'] == 'ENGAGEMENTDECISION':
            return f"{a.get('name') or a['key']}: {md.get('label') or o['key']}"
        return md.get('label')

    def walk(key, trail, waits, seen):
        if key in seen or key not in acts:
            return
        seen = seen | {key}
        a = acts[key]
        paths.setdefault(key, (trail, waits))
        c = a.get("configurationArguments", {})
        w = waits
        if a["type"] == "WAIT":
            w = waits + [f"{c.get('waitDuration')} {c.get('waitUnit')}"]
        for o in a.get("outcomes", []):
            lab = label(a, o) if len(a.get("outcomes", [])) > 1 else None
            if o.get("next"):
                walk(o["next"], trail + ([lab] if lab else []), w, seen)

    for r in roots:
        walk(r, [], [], set())
    return paths


def journey_occurrence_paths(pkg, d):
    """Todos os percursos: decisões identificadas, esperas e janelas sem inferir atraso fixo."""
    acts = {a['key']: a for a in d['activities']}
    incoming = {o.get('next') for a in acts.values() for o in a.get('outcomes', []) if o.get('next')}
    paths, traversals = {}, 0
    def walk(key, steps, seen):
        nonlocal traversals
        if key in seen or key not in acts:
            return
        traversals += 1
        if traversals > 20000:
            raise ValueError('Jornada excede limite de percursos; não truncar silenciosamente.')
        a = acts[key]
        if steps not in paths.setdefault(key, []):
            paths[key].append(steps)
        c = a.get('configurationArguments', {})
        for o in a.get('outcomes', []):
            if not o.get('next'):
                continue
            md = o.get('metaData', {})
            step = {'activity_key': key, 'type': a['type'], 'name': a.get('name'),
                    'outcome_key': o.get('key'), 'label': md.get('label'),
                    'condition': md.get('criteriaDescription') or crit_text(pkg, c.get('criteria', {}).get(o.get('key'), '')),
                    'engagement_reference': c.get('refActivityCustomerKey')}
            if a['type'] == 'WAIT':
                step['wait'] = {'duration': c.get('waitDuration'), 'unit': c.get('waitUnit'), 'wait_type': a.get('metaData', {}).get('waitType'), 'configuration': c}
            if a['type'] == 'STOWAIT':
                step['optimization_window_hours'] = c.get('params', {}).get('slidingWindowHours')
            if a['type'] == 'RANDOMSPLIT':
                step['percentage'] = o.get('arguments', {}).get('percentage')
            walk(o['next'], steps + [step], seen | {key})
    for key in acts:
        if key not in incoming:
            walk(key, [], set())
    return paths


def entry_info(pkg, d):
    tr = (d.get("triggers") or [{}])[0]
    md = tr.get("metaData", {})
    m = re.search(r"eventDefinitions/([^/]+)/", md.get("eventDefinitionId", "") or "")
    ev = pkg.data(f"eventDefinitions/{m.group(1)}") if m else {}
    dm = re.search(r"dataExtensions/([^/]+)/", ev.get("dataExtensionId", "") or "")
    de = pkg.name_of(f"dataExtensions/{dm.group(1)}") if dm else None
    return de, tr.get("description") or crit_text(pkg, tr.get("configurationArguments", {}).get("criteria"))


def extract(pkg, source):
    rows = []
    for ref, e in sorted(pkg.of_type("journeys").items()):
        d = e["data"]
        de, entry_filter = entry_info(pkg, d)
        de_fields = {f.lower() for f in (pkg.de_fields(de) or [])}
        paths = journey_paths(pkg, d)
        occurrence_paths = journey_occurrence_paths(pkg, d)
        for a in d["activities"]:
            if a["type"] not in MSG_TYPES:
                continue
            c = a.get("configurationArguments", {})
            asset_ref = c.get("assetId") or (c.get("triggeredSend") or {}).get("emailId") or ""
            am = re.search(r"assets/(\d+)", asset_ref)
            content = asset_content(pkg, am.group(1)) if am else {}
            tpl = (c.get("requestBody") or {}).get("template") or {}
            params = [p.get("text") for comp in tpl.get("components", []) if comp.get("type") == "body"
                      for p in comp.get("parameters", [])]
            header_img = next((((p.get("image") or {}).get("link")) for comp in tpl.get("components", [])
                               if comp.get("type") == "header" for p in comp.get("parameters", [])
                               if (p.get("image") or {}).get("link")), None)
            text = content.get("text")
            if a["type"] == "SMSSYNC":
                text = text or a.get("metaData", {}).get("store", {}).get("selectedContentBuilderMessage")
            trail, waits = paths.get(a["key"], ([], []))
            lp = link_params(content.get("link"))
            used = set(PERSONALIZATION.findall(" ".join(params) + " " + (text or "")))
            missing = sorted(t for t in used if de_fields and t.lower() not in de_fields)
            name = (a.get("name") or "").strip()
            alerts = []
            if missing:
                alerts.append(f"campo fora da DE de entrada: {', '.join(missing)}")
            ch_name = channel_from_name(name)
            if ch_name and ch_name != MSG_TYPES[a["type"]]:
                alerts.append(f"nome diz {ch_name}, atividade é {MSG_TYPES[a['type']]}")
            if not re.match(r"^[a-z0-9]+_[a-z0-9]+_", name):
                alerts.append("activity sem nome de taxonomia")
            if a["type"] == "WHATSAPPACTIVITY" and content.get("link") and not lp.get("af_sub3"):
                alerts.append("link sem af_sub3")
            if len(content.get("af_sub3_todos") or []) > 1:
                alerts.append(f"mais de um af_sub3 no conteúdo: {', '.join(content['af_sub3_todos'])}")
            if a["type"] == "EMAILV2" and content.get("dinamico"):
                alerts.append("e-mail dinâmico (AMPscript): texto e af_sub vêm do briefing")
            rows.append({
                "pacote": source,
                "jornada": d["name"].strip(),
                "jornada_nome_bruto": d["name"],
                "jornada_versao": d.get("version"),
                "jornada_id_origem": e.get("originID"),
                "de_entrada": de,
                "filtro_entrada": entry_filter,
                "caminho": " > ".join(t for t in trail if t),
                "esperas_antes": " + ".join(waits),
                "activity_name": name,
                "activity_key": a["key"],
                "occurrence_key": f"{ref}:{d.get('version', 1)}:{a['key']}",
                "caminhos_estruturados": occurrence_paths.get(a["key"], []),
                "asset_id": am.group(1) if am else None,
                "tipo_resposta_optout": bool(OPTOUT.search(name)),
                "canal": MSG_TYPES[a["type"]],
                "template_meta": tpl.get("name"),
                "asset_nome": content.get("asset_name"),
                "parametros": params,
                "texto": text,
                "rodape": content.get("footer"),
                "cta1": content.get("cta1"),
                "cta2": content.get("cta2"),
                "banner": content.get("banner"),
                "banner_url": header_img,
                "link": content.get("link"),
                "c": lp.get("c"),
                "af_sub1": lp.get("af_sub1"),
                "af_sub2": lp.get("af_sub2"),
                "af_sub3": lp.get("af_sub3"),
                "sms_remetente": c.get("fromName") if a["type"] == "SMSSYNC" else None,
                "alertas": alerts,
            })
    return rows


def results_sql(rows):
    names = sorted({r["activity_name"] for r in rows if r["activity_name"] and not r["tipo_resposta_optout"]})
    in_list = ",\n  ".join("'" + n.replace("'", "''") + "'" for n in names)
    return f"""-- Resultados em activities para as atividades do pacote (projeto Supabase mipiwxadnpwtcgfcedym).
-- Rodar via MCP do Supabase ou psql e salvar o retorno como JSON (lista de objetos) ou CSV.
select
  btrim("Activity name / Taxonomia")              as activity_name,
  btrim(jornada)                                  as jornada,
  "Canal"                                         as canal,
  template_id,
  parceiro_canonico,
  "Segmento"                                      as segmento,
  count(*)                                        as linhas,
  count("Cartões Gerados")                        as linhas_com_cartoes,
  min("Data de Disparo")::date                    as primeiro_disparo,
  max("Data de Disparo")::date                    as ultimo_disparo,
  sum("Base Acionável")                           as base_acionavel,
  sum("Propostas")                                as propostas,
  sum("Aprovados")                                as aprovados,
  sum("Cartões Gerados")                          as cartoes,
  sum("Custo Total Campanha")                     as custo
from activities
where btrim("Activity name / Taxonomia") in (
  {in_list}
)
group by 1,2,3,4,5,6
order by 1, 2;
"""


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser()
    ap.add_argument("pacotes", nargs="+")
    ap.add_argument("--out", required=True)
    args = ap.parse_args()
    os.makedirs(args.out, exist_ok=True)
    rows = []
    for p in args.pacotes:
        rows += extract(Package(p), os.path.basename(p))
    with open(os.path.join(args.out, "messages.json"), "w", encoding="utf-8") as fh:
        json.dump(rows, fh, ensure_ascii=False, indent=1)
    cols = [k for k in rows[0].keys()] if rows else []
    with open(os.path.join(args.out, "messages.csv"), "w", encoding="utf-8-sig", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=cols, delimiter=";")
        w.writeheader()
        for r in rows:
            w.writerow({k: (json.dumps(v, ensure_ascii=False) if isinstance(v, (list, dict)) else v) for k, v in r.items()})
    with open(os.path.join(args.out, "results_query.sql"), "w", encoding="utf-8") as fh:
        fh.write(results_sql(rows))
    n_alert = sum(1 for r in rows if r["alertas"])
    print(f"{len(rows)} mensagens extraídas de {len(args.pacotes)} pacote(s); {n_alert} com alerta.")
    print(f"Saída: {args.out}")


if __name__ == "__main__":
    main()
