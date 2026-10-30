"""Leitura de pacotes do SFMC Package Manager (ZIP ou pasta extraída).

Só biblioteca padrão. Usado por extract_messages.py, xray.py e rank_templates.py.
O pacote traz estrutura (jornadas, DEs, assets), nunca registros de DE.
"""
import json
import os
import re
import tempfile
import zipfile

MCPM_REF = re.compile(r"\{\{mcpm#/entities/([^/]+)/([^/]+)/data/([^}]*)\}\}")
MCPM_FIELD = re.compile(r"\{\{mcpm:([^}|]+)[^}]*\}\}")
PERSONALIZATION = re.compile(r"%%([A-Za-z0-9_]+)%%")


def open_package(path):
    """Devolve a pasta raiz do pacote (extrai o ZIP numa pasta temporária)."""
    if os.path.isfile(path) and path.lower().endswith(".zip"):
        tmp = tempfile.mkdtemp(prefix="sfmcpkg_")
        zipfile.ZipFile(path).extractall(tmp)
        return tmp
    return path


class Package:
    def __init__(self, path):
        self.root = open_package(path)
        self.ents = {}
        ent_dir = os.path.join(self.root, "entities")
        for t in os.listdir(ent_dir):
            for f in os.listdir(os.path.join(ent_dir, t)):
                if not f.endswith(".json"):
                    continue
                try:
                    with open(os.path.join(ent_dir, t, f), encoding="utf-8") as fh:
                        self.ents[f"{t}/{f[:-5]}"] = json.load(fh)
                except (ValueError, OSError):
                    pass
        self.info = self._load_top("info.json") or {}

    def _load_top(self, name):
        p = os.path.join(self.root, name)
        if os.path.exists(p):
            with open(p, encoding="utf-8") as fh:
                return json.load(fh)
        return None

    def of_type(self, t):
        return {k: v for k, v in self.ents.items() if k.startswith(t + "/")}

    def data(self, ref):
        return (self.ents.get(ref) or {}).get("data", {})

    def name_of(self, ref):
        return self.data(ref).get("name") or ref

    def resolve(self, s):
        """Troca referências internas do pacote pelo nome legível."""
        if not isinstance(s, str):
            return s

        def rep(m):
            t, i, path = m.groups()
            fld = re.search(r"name:([^/]+)", path)
            base = self.name_of(f"{t}/{i}")
            return f"[{base}.{fld.group(1)}]" if fld else f"[{base}]"

        s = MCPM_REF.sub(rep, s)
        return MCPM_FIELD.sub(r"<campo de deploy: \1>", s)

    def de_fields(self, de_name):
        for t in ("dataExtensions", "sharedDataExtensions"):
            for v in self.of_type(t).values():
                d = v.get("data", {})
                if d.get("name") == de_name:
                    return [f.get("name") for f in d.get("fields", [])]
        return None


def crit_text(pkg, xml):
    xml = pkg.resolve(xml or "")
    conds = re.findall(
        r'Key="([^"]+)" Operator="([^"]+)"[^>]*>(?:<Value><!\[CDATA\[(.*?)\]\]></Value>)?', xml
    )
    return " E ".join(f"{k.split('.')[-1]} {op}{(' ' + v) if v else ''}" for k, op, v in conds) or "?"


def walk_strings(o, path=""):
    if isinstance(o, dict):
        for k, v in o.items():
            yield from walk_strings(v, f"{path}.{k}")
    elif isinstance(o, list):
        for i, v in enumerate(o):
            yield from walk_strings(v, f"{path}[{i}]")
    elif isinstance(o, str):
        yield path, o


TRACKED_URL_RE = re.compile(r"https?://[^\s\"'<>\\]+?af_sub3=[^\s\"'<>\\]+")
AMP_RE = re.compile(r"%%\[|LookupRows?\(|LookupOrderedRows\(")


def asset_content(pkg, asset_id):
    """Texto, rodapé, link do botão e banner de um asset (WhatsApp, SMS, e-mail)."""
    a = pkg.data(f"assets/{asset_id}")
    if not a:
        return {}
    out = {"asset_name": a.get("name"), "asset_type": (a.get("assetType") or {}).get("name")}
    wanted = {
        "display:message": "text",
        "display:footer": "footer",
        "display:buttons.button1.value": "link",
        "display:buttons.button1.title": "cta1",
        "display:buttons.button2.title": "cta2",
        "display:title:parameters.1.display:media:filename": "banner",
    }
    for path, val in walk_strings(a.get("views", {})):
        if "selectedTemplate" in path or ".template." in path or "languages" in path:
            continue
        key = path.split("customBlockData.")[-1]
        if key in wanted and wanted[key] not in out:
            out[wanted[key]] = val
        if path.endswith("displaymessage") and "text" not in out:
            out["text"] = val
    # SMS e e-mail HTML não têm botão: o link rastreado está no corpo do asset.
    tracked, dynamic = [], False
    for _p, val in walk_strings(a):
        if AMP_RE.search(val):
            dynamic = True
        for m in TRACKED_URL_RE.finditer(val):
            url = m.group(0).replace("&amp;", "&")
            if url not in tracked:
                tracked.append(url)
    if "link" not in out and tracked:
        out["link"] = tracked[0]
    out["af_sub3_todos"] = sorted({link_params(u).get("af_sub3") for u in tracked} - {None})
    out["dinamico"] = dynamic
    # e-mail: só o assunto/pré-cabeçalho estático, se houver
    views = a.get("views", {})
    if "text" not in out and isinstance(views.get("subjectline"), dict):
        out["subject"] = views["subjectline"].get("content")
    return out


def link_params(url):
    if not url:
        return {}
    q = url.split("?", 1)[1] if "?" in url else ""
    params = dict(p.split("=", 1) for p in q.split("&") if "=" in p)
    return {k: params.get(k) for k in ("c", "af_sub1", "af_sub2", "af_sub3")}
