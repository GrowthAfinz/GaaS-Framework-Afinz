"""Raio-X de pacote do SFMC Package Manager (ZIP ou pasta extraída).

Uso: python xray.py <pacote.zip|pasta>  > relatorio.md
Lê só a estrutura (o pacote não traz registros de DE).
"""
import json, os, re, sys, zipfile, tempfile, collections

sys.stdout.reconfigure(encoding="utf-8")
src = sys.argv[1]
if src.lower().endswith(".zip"):
    tmp = tempfile.mkdtemp()
    zipfile.ZipFile(src).extractall(tmp)
    src = tmp

ENT = os.path.join(src, "entities")
ents = {}
for t in os.listdir(ENT):
    for f in os.listdir(os.path.join(ENT, t)):
        try:
            ents[f"{t}/{f[:-5]}"] = json.load(open(os.path.join(ENT, t, f), encoding="utf-8"))
        except Exception:
            pass

def name_of(ref):
    e = ents.get(ref)
    return (e or {}).get("data", {}).get("name") or ref

MCPM = re.compile(r"\{\{mcpm#/entities/([^/]+)/([^/]+)/data/([^}]*)\}\}")
def resolve(s):
    if not isinstance(s, str):
        return s
    def rep(m):
        t, i, path = m.groups()
        fld = re.search(r"name:([^/]+)", path)
        base = name_of(f"{t}/{i}")
        return f"[{base}.{fld.group(1)}]" if fld else f"[{base}]"
    s = MCPM.sub(rep, s)
    return re.sub(r"\{\{mcpm:([^}|]+)[^}]*\}\}", r"<campo de deploy: \1>", s)

def crit_text(xml):
    xml = resolve(xml or "")
    conds = re.findall(r'Key="([^"]+)" Operator="([^"]+)"[^>]*>(?:<Value><!\[CDATA\[(.*?)\]\]></Value>)?', xml)
    return " E ".join(f"{k.split('.')[-1]} {op}{(' ' + v) if v else ''}" for k, op, v in conds) or "?"

def describe(a):
    t, c, ar = a["type"], a.get("configurationArguments", {}), a.get("arguments", {})
    if t == "WAIT":
        return f"espera {c.get('waitDuration')} {c.get('waitUnit')}" + (f" até {c['specifiedTime']} {c.get('timeZone','')}" if c.get("specifiedTime") and a.get("metaData", {}).get("isExtended") else "")
    if t == "WAITUNTILCHATRESPONSE":
        kws = [k["keyword"] for k in json.loads(c.get("keywords") or "[]")]
        return f"espera resposta WhatsApp até {c.get('waitDuration')} {c.get('waitUnit')} (palavras: {kws})"
    if t == "EMAILV2":
        ts = c.get("triggeredSend", {})
        aid = re.search(r"assets/(\d+)", ts.get("emailId", ""))
        return f"E-MAIL '{a.get('name')}' asset={name_of('assets/' + aid.group(1)) if aid else ts.get('emailId')}"
    if t == "SMSSYNC":
        msg = a.get("metaData", {}).get("store", {}).get("selectedContentBuilderMessage", "")
        return f"SMS '{a.get('name')}' de {c.get('fromName')}: \"{msg}\""
    if t == "WHATSAPPACTIVITY":
        tpl = c.get("requestBody", {}).get("template") or {}
        params = [p.get("text") for comp in tpl.get("components", []) if comp.get("type") == "body" for p in comp.get("parameters", [])]
        aid = re.search(r"assets/(\d+)", c.get("assetId", ""))
        return f"WHATSAPP '{a.get('name')}' template={tpl.get('name')} params={params} asset={name_of('assets/' + aid.group(1)) if aid else '?'}"
    if t == "UPDATECONTACTDATA":
        fs = ar.get("activityData", {}).get("updateContactFields", [])
        return "UPDATE CONTACT " + "; ".join(f"{resolve(f['field'])} = {f['value']}" for f in fs)
    if t == "MULTICRITERIADECISION":
        return "DECISÃO"
    if t == "RANDOMSPLIT":
        return "SPLIT ALEATÓRIO"
    return t

out = []
P = out.append
info = json.load(open(os.path.join(src, "info.json"), encoding="utf-8"))
P(f"# Raio-X do pacote '{info.get('name')}' (v{info.get('version')})\n")
cnt = collections.Counter(k.split("/")[0] for k in ents)
P("**Conteúdo:** " + ", ".join(f"{n} {t}" for t, n in sorted(cnt.items())) + "\n")
sel = json.load(open(os.path.join(src, "selected-entities.json"), encoding="utf-8"))
P("**Selecionado à mão:** " + ", ".join(f"{t}: {[name_of(t + '/' + i) for i in v]}" for t, v in sel.items() if v) + "\n")
inp = json.load(open(os.path.join(src, "input.json"), encoding="utf-8"))
P("**Campos pedidos no deploy:** " + ", ".join(f"{i['key']} ({len(i.get('entities', []))} itens)" for i in inp) + "\n")

for k, e in sorted((k, e) for k, e in ents.items() if k.startswith("journeys/")):
    d = e["data"]
    acts = {a["key"]: a for a in d["activities"]}
    P(f"\n## {d['name']}  (versão {d.get('version')}, origem {e.get('originID')})")
    P(f"- entrada única: `{d.get('entryMode')}` · exits: {len(d.get('exits', []))} · goals: {len(d.get('goals', []))}")
    for tr in d.get("triggers", []):
        md = tr.get("metaData", {})
        evref = re.search(r"eventDefinitions/([^/]+)/", md.get("eventDefinitionId", ""))
        ev = ents.get(f"eventDefinitions/{evref.group(1)}", {}).get("data", {}) if evref else {}
        de = re.search(r"dataExtensions/([^/]+)/", ev.get("dataExtensionId", "") or "")
        sched = ev.get("metaData", {})
        P(f"- gatilho `{tr.get('type')}` · DE de entrada: **{name_of('dataExtensions/' + de.group(1)) if de else '?'}** · filtro: {tr.get('description') or crit_text(tr.get('configurationArguments', {}).get('criteria'))} · agenda: {sched.get('scheduleState')} / {sched.get('scheduleFlowMode')} {sched.get('runOnceScheduleMode','')}")
    nexts = {o.get("next") for a in d["activities"] for o in a.get("outcomes", []) if o.get("next")}
    roots = [a["key"] for a in d["activities"] if a["key"] not in nexts]
    seen = set()
    def walk(key, depth, label=""):
        a = acts.get(key)
        pre = "  " * depth + "- " + (f"[{label}] " if label else "")
        if a is None:
            P(pre + f"?? {key}")
            return
        if key in seen:
            P(pre + f"↪ junta em {key}")
            return
        seen.add(key)
        P(pre + f"`{key}` {describe(a)}")
        outs = a.get("outcomes", [])
        crits = a.get("configurationArguments", {}).get("criteria", {}) if a["type"] == "MULTICRITERIADECISION" else {}
        for o in outs:
            md = o.get("metaData", {})
            lab = md.get("label") or md.get("name") or md.get("i18nLabel") or ""
            if a["type"] == "MULTICRITERIADECISION" and o["key"] in crits:
                lab = f"{lab}: {md.get('criteriaDescription') or crit_text(crits[o['key']])}"
            if a["type"] == "RANDOMSPLIT":
                lab = f"{o.get('arguments', {}).get('percentage')}%"
            if a["type"] == "WAITUNTILCHATRESPONSE":
                lab = md.get("label") or {"EventFired": "respondeu outra coisa", "no_event": "não respondeu"}.get(o["key"], lab)
            if o.get("next"):
                walk(o["next"], depth + 1, lab if len(outs) > 1 else "")
            elif len(outs) > 1:
                P("  " * (depth + 1) + f"- [{lab}] FIM (sai sem ação)")
    for r in roots:
        walk(r, 0)
    iss = [i.get("issue") or i.get("type") for i in e.get("issues", [])]
    if iss:
        P(f"- avisos do pacote: {iss}")

print("\n".join(out))
