# -*- coding: utf-8 -*-
"""Pré-checagem do arquivo input_gaas_emails_*.json, antes de entregar ao analista.

Espelha as regras da importação do GaaS (src/modules/dynamic-email/domain/emailInput.ts).
O GaaS continua sendo a autoridade: ele valida tudo de novo ao importar. Este script existe
para a IA corrigir o arquivo na própria conversa, sem ida e volta.

Uso:
    python scripts/validar_input.py caminho/input_gaas_emails_<segmento>_<AAAAMMDD>.json

Saída: lista de BLOQUEIA (o GaaS recusa) e REVISAR (o analista decide). Código de saída 1
quando há bloqueio. Só usa a biblioteca padrão do Python.
"""
import json
import re
import sys
import unicodedata
from pathlib import Path

SKILL_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(Path(__file__).resolve().parent))
from content_blocks import benefit_grid, check_list, closing, lead, stat_tiles, steps  # noqa: E402

CONTRACT = "gaas-emails-input/1"
GOVERNED_EXACT = {"UTM_CAMPANHA", "BANNER_3_CORPO", "NOTA_LEGAL", "RODAPE", "HEADER_LOGO",
                  "CARTAO_NM_COMERCIAL", "DT_FIM", "template_slot_id"}
CTA_VERBS = ("PEÇA", "PEDIR", "SOLICITE", "SOLICITAR", "CONFIRA", "CONFERIR", "APROVEITE", "APROVEITAR",
             "CONHEÇA", "CONHECER", "ACESSE", "ACESSAR", "DESCUBRA", "DESCOBRIR", "VEJA", "COMECE", "SAIBA",
             "QUERO", "FAÇA", "BAIXE", "ATIVE")
SOFT_LIMITS = {"ASSUNTO": 50, "PRE_CABECALHO": 90, "HEADER_TITULO": 34, "HEADER_SUBTITULO": 60}
# Chamada que hesita derruba a venda: a condição vai no corpo e na nota legal, não aqui.
HEADLINE_FIELDS = {"ASSUNTO", "PRE_CABECALHO", "HEADER_TITULO", "HEADER_SUBTITULO", "MENSAGEM_LIMITE",
                   "TITULO_COPY_1_AZUL", "TITULO_COPY_2", "TITULO_CTA_1", "TITULO_CTA_2"}
HEDGES = re.compile(r"\bse (?:for )?aprovad|\bcaso (?:seja )?aprovad|sujeit[oa] a|\bmediante\b|\bpode ser que\b", re.I)
RISKY_PROMISES = re.compile(r"garantid|aprova[çc][ãa]o (?:j[áa] )?(?:definitiv|certa)|sem an[áa]lise|100% aprovad|j[áa] est[áa] aprovad", re.I)
FIRST_NAME = "%%=v(@FirstName)=%%"


def is_governed(field):
    return bool(re.match(r"^(LINK_|COR_|TAMANHO_)", field)) or field in GOVERNED_EXACT


def normalize(text):
    text = unicodedata.normalize("NFD", text)
    text = "".join(ch for ch in text if not unicodedata.combining(ch)).lower()
    text = re.sub(r"<[^>]*>", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def check_text(value):
    """Mesmas regras de validateBlockText: só <b> e <br>, negrito fechado, sem quebra crua."""
    if "%%" in value.replace(FIRST_NAME, ""):
        return "Personalização não permitida: use só %%=v(@FirstName)=%% (ou PRI_NOME)."
    if "\n" in value or "\r" in value:
        return "Quebra de linha crua: use <br>."
    if len(value) > 4000:
        return f"Texto com {len(value)} caracteres; a coluna aceita 4000."
    if re.search(r"[<>]", re.sub(r"<b>|</b>|<br>", "", value)):
        return "Somente <b> e <br> são permitidos, sem atributos."
    depth = 0
    for tag in re.findall(r"</?b>", value):
        depth += 1 if tag == "<b>" else -1
        if depth < 0:
            return "Negrito fechado sem abertura."
    if depth:
        return "Negrito sem fechamento."
    return None


def render_blocks(blocks):
    parts = []
    for block in blocks:
        kind = block.get("type")
        if kind == "lead":
            parts.append(lead(block["text"]))
        elif kind == "closing":
            parts.append(closing(block["text"]))
        elif kind == "benefit_grid":
            items = block["items"]
            if len(items) < 2 or len(items) % 2:
                raise ValueError("Grade exige número par de itens, a partir de 2.")
            parts.append(benefit_grid([(i["title"], i["text"]) for i in items], allow_html=True))
        elif kind == "stat_tiles":
            if len(block["items"]) not in (2, 3):
                raise ValueError("Números em destaque exigem 2 ou 3 itens.")
            parts.append(stat_tiles([(i["number"], i["label"]) for i in block["items"]]))
        elif kind == "check_list":
            parts.append(check_list(block["items"]))
        elif kind == "steps":
            parts.append(steps([(i["title"], i["text"]) for i in block["items"]]))
        else:
            raise ValueError(f"Tipo de bloco desconhecido: {kind}")
    html = "".join(parts)
    if len(html) > 4000:
        raise ValueError(f"Segundo bloco gera {len(html)} caracteres de HTML; o limite é 4000.")
    return html


def block_texts(blocks):
    for block in blocks:
        if "text" in block:
            yield block["text"]
        for item in block.get("items", []):
            if isinstance(item, str):
                yield item
            else:
                yield from (v for v in item.values() if isinstance(v, str))


def load_manifest():
    path = SKILL_DIR / "assets" / "previa" / "manifesto.json"
    return json.loads(path.read_text(encoding="utf-8")) if path.exists() else {"rulers": [], "facts": ""}


def validate(payload, manifest):
    errors, warnings = [], []
    err = lambda where, msg: errors.append(f"{where}: {msg}")  # noqa: E731
    warn = lambda where, msg: warnings.append(f"{where}: {msg}")  # noqa: E731

    if payload.get("contract") != CONTRACT:
        err("contract", f'Use "{CONTRACT}".')
    if payload.get("status") != "draft":
        err("status", 'Todo arquivo entra como "draft".')
    ruler = payload.get("ruler", {})
    known = next((r for r in manifest["rulers"] if r["segment"] == ruler.get("segment") and r["partner"] == ruler.get("partner")), None)
    if manifest["rulers"] and not known:
        err("ruler", "Régua não está no pacote exportado; confira segment e partner.")
    if known and (ruler.get("tpCampanha") != known["tpCampanha"] or ruler.get("templateSlotId") != known["templateSlotId"]):
        err("ruler", f'Use tpCampanha "{known["tpCampanha"]}" e templateSlotId "{known["templateSlotId"]}".')

    existing = {e["sequence"] for e in (known or {}).get("emails", []) if e.get("exists")}
    used_greetings = {e["sequence"]: e.get("greeting", "") for e in (known or {}).get("emails", [])}
    facts_corpus = manifest.get("facts", "")
    emails = payload.get("emails", [])
    sequences = [e.get("sequence", "") for e in emails]

    for index, email in enumerate(emails):
        seq = email.get("sequence", f"emails[{index}]")
        if not re.fullmatch(r"E-mail [1-9]\d*", seq):
            err(seq, 'sequence no formato "E-mail N".')
        if not re.fullmatch(r"Semana [1-9]\d*", email.get("weekKey", "")):
            err(seq, 'weekKey no formato "Semana N".')
        if sequences.count(seq) > 1:
            err(seq, "Sequência duplicada no arquivo.")
        if not email.get("secondBlock") and seq not in existing:
            err(seq, "E-mail novo precisa de secondBlock.")
        if email.get("secondBlock"):
            try:
                render_blocks(email["secondBlock"])
            except (ValueError, KeyError, TypeError) as error:
                err(f"{seq}.secondBlock", str(error))
            for text in block_texts(email["secondBlock"]):
                problem = check_text(text)
                if problem:
                    err(f"{seq}.secondBlock", problem)

        layers = [("", email.get("fields", {}))] + [(f".{net}", f) for net, f in (email.get("networkOverrides") or {}).items()]
        for suffix, fields in layers:
            for field, data in fields.items():
                where = f"{seq}{suffix}.{field}"
                if is_governed(field) or field == "COPY_2_PRETO":
                    warn(where, "Campo governado: o GaaS descarta o valor e preenche sozinho.")
                    continue
                value = (data or {}).get("value", "")
                value = re.sub(r"%%PRI_NOME%%|\bPRI_NOME\b", FIRST_NAME, value)
                problem = check_text(value)
                if problem:
                    err(where, problem)
                plain = normalize(value)
                if "%%INVESTIDA%%" in value.upper() or re.search(r"compre\s*mais|super\s*pao", plain):
                    err(where, "Não cite Compre Mais nem Superpão e não use %%INVESTIDA%%: use {no_mercado}.")
                if field in SOFT_LIMITS and len(value) > SOFT_LIMITS[field]:
                    warn(where, f"{len(value)} caracteres; o recomendado é até {SOFT_LIMITS[field]}.")
                if field in HEADLINE_FIELDS and HEDGES.search(value):
                    warn(where, 'Chamada hesitante ("se aprovado", "sujeito a"...): venda a ação e o ganho; '
                                'a condição vai uma vez no corpo, junto do benefício.')
                if field == "ASSUNTO":
                    if re.search(r"FirstName|\{\{nome\}\}|PRI_NOME", value, re.I):
                        err(where, "Assunto não leva o nome da pessoa.")
                    elif re.search(r"amig[aã]o|avenida|paran[aá]|compre mais|superp[aã]o", value, re.I):
                        warn(where, "Assunto cita a rede; ele vale para as 6 assinaturas.")
                if field.startswith("TITULO_CTA") and value:
                    if value != value.upper() or not value.startswith(CTA_VERBS):
                        err(where, "Botão em caixa alta começando com verbo (PEÇA, QUERO, CONHEÇA...).")
                if field == "MENSAGEM_LIMITE" and value:
                    if not re.match(r"^[^,:]+, \{\{nome\}\}: .+", value):
                        err(where, 'Formato "Abertura, {{nome}}: ...".')
                    if set(re.findall(r"\{\{[^}]*\}\}", value)) - {"{{nome}}", "{{limite}}"}:
                        err(where, "Só {{nome}} e {{limite}}, em minúsculas.")
                    if "{{limite}}" not in value:
                        warn(where, "A faixa não mostra o valor ({{limite}}).")
                    if RISKY_PROMISES.search(value):
                        err(where, "Promessa de aprovação: pré-aprovação é sujeita a análise de crédito.")
                    if len(value) > 300:
                        err(where, "Faixa passa de 300 caracteres.")
                    opening = normalize(value.split(",")[0])
                    for other_seq, greeting in used_greetings.items():
                        if other_seq != seq and greeting and normalize(greeting.split(",")[0]) == opening:
                            err(where, f"Abertura da faixa repete a do {other_seq}.")

        supplied = " ".join((d or {}).get("value", "") for _, f in layers for k, d in f.items() if not is_governed(k))
        supplied += " " + json.dumps(email.get("secondBlock") or [], ensure_ascii=False)
        facts = set(email.get("factsUsed", [])) | set(re.findall(r"\d+(?:[.,]\d+)?\s*(?:%|dias\b)", normalize(supplied)))
        for fact in sorted(facts):
            if facts_corpus and normalize(fact) not in facts_corpus:
                err(f"{seq}.factsUsed", f'"{fact}" não está na ficha do produto. Tire do texto ou registre em pendencies.')

    if emails and all(e.get("secondBlock") for e in emails):
        ordered = sorted(emails, key=lambda e: int(re.sub(r"\D", "", e.get("sequence", "0")) or 0))
        for previous, current in zip(ordered, ordered[1:]):
            if [b["type"] for b in previous["secondBlock"]] == [b["type"] for b in current["secondBlock"]]:
                warn(current["sequence"], "Segundo bloco repete o formato do e-mail anterior; varie.")
    return errors, warnings


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(2)
    payload = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    errors, warnings = validate(payload, load_manifest())
    print(f"BLOQUEIA ({len(errors)})")
    for line in errors:
        print(f"  - {line}")
    print(f"REVISAR ({len(warnings)})")
    for line in warnings:
        print(f"  - {line}")
    if not errors:
        print("Arquivo pronto para importar no GaaS (aba Prompt e IA > Importar).")
    sys.exit(1 if errors else 0)


if __name__ == "__main__":
    main()
