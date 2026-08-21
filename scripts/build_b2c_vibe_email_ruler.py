from __future__ import annotations

import hashlib
import html
import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
INPUTS = [
    Path(r"C:\Users\Pablo Prado\.codex\attachments\5a56bbdc-9874-4266-bc0f-6373c8c646fe\pasted-text.txt"),
    Path(r"C:\Users\Pablo Prado\.codex\attachments\6894a84f-abfb-439a-866d-a24e076eb24c\pasted-text.txt"),
    Path(r"C:\Users\Pablo Prado\.codex\attachments\505ca617-037e-4726-8358-5b8255cc585f\pasted-text.txt"),
    Path(r"C:\Users\Pablo Prado\.codex\attachments\4c044eb4-e559-4ff4-963d-34ff77c6b64c\pasted-text.txt"),
    Path(r"C:\Users\Pablo Prado\.codex\attachments\2bf390b5-cf9c-4328-9338-d42246df1a17\pasted-text.txt"),
    Path(r"C:\Users\Pablo Prado\.codex\attachments\9b3aca83-ff35-43c5-b206-0425c08bfbb4\pasted-text.txt"),
    Path(r"C:\Users\Pablo Prado\.codex\attachments\33c4cfd2-4be5-48db-85f5-0385ee478306\pasted-text.txt"),
    Path(r"C:\Users\Pablo Prado\.codex\attachments\4976f151-6dc3-45d0-9263-b31a7a779950\pasted-text.txt"),
]

SUBJECTS = [
    "Peça seu cartão Afinz e concorra a R$100 mil todo mês!",
    "GANHE Créditos Vibe com o cartão Afinz Visa! 💳",
    "Concorra a R$100 MIL todo mês com o cartão Afinz!",
    "Cartão Afinz com limite para usar na hora. Peça já!",
    "Economize todo mês com seus Créditos Vibe!",
    "Quer concorrer a R$100 MIL todo mês? Peça seu Cartão Afinz!",
    "Não perca seu cartão Afinz com Créditos Vibe exclusivos!",
    "ÚLTIMA CHANCE: ganhe até R$100 Créditos Vibe!",
]

PREHEADERS = [
    "Aproveite os descontos incríveis nas melhores marcas.",
    "Peça seu cartão e tenha descontos em cinema, delivery e muito mais!",
    "Peça seu cartão e ganhe R$100 em créditos Vibe na 1ª compra.",
    "Ganhe até R$100 em Créditos Vibe para suas compras. Aproveite!",
    "Peça seu cartão Afinz e concorra a R$100 MIL todo mês.",
    "Ganhe R$100 em Créditos Vibe na 1ª compra e aproveite nas melhores marcas.",
    "Ganhe R$100 em Créditos Vibe para economizar nas melhores marcas.",
    "Concorra R$100 MIL todo mês e economize em +250 marcas. Aproveite!",
]

ATTR = re.compile(r'''([:\w-]+)\s*=\s*(["'])(.*?)\2''', re.I | re.S)
IMG = re.compile(r"<img\b[^>]*>", re.I | re.S)
ANCHOR_IMG = re.compile(r"<a\b(?P<a>[^>]*)>\s*(?P<img><img\b[^>]*>)", re.I | re.S)


def attrs(fragment: str) -> dict[str, str]:
    return {key.lower(): html.unescape(value.strip()) for key, _, value in ATTR.findall(fragment)}


def sql_text(value: str) -> str:
    tag = "$gaas$"
    if tag in value:
        raise ValueError("Unexpected SQL delimiter in source")
    return f"{tag}{value}{tag}"


def q(value: str | None) -> str:
    return "null" if value is None else "'" + value.replace("'", "''") + "'"


def main() -> None:
    sources = [path.read_text(encoding="utf-8-sig") for path in INPUTS]
    assets: dict[str, dict] = {}
    warnings: list[dict] = []

    for number, source in enumerate(sources, 1):
        linked: dict[str, str] = {}
        for match in ANCHOR_IMG.finditer(source):
            image_attrs = attrs(match.group("img"))
            anchor_attrs = attrs(match.group("a"))
            if image_attrs.get("src") and anchor_attrs.get("href"):
                linked[image_attrs["src"]] = anchor_attrs["href"]

        seen = 0
        for match in IMG.finditer(source):
            data = attrs(match.group(0))
            url = data.get("src", "").strip()
            if not url.startswith("https://"):
                continue
            seen += 1
            record = assets.setdefault(url, {
                "url": url,
                "asset_id": data.get("data-assetid"),
                "alt": data.get("alt") or None,
                "width": int(data["width"]) if data.get("width", "").isdigit() else None,
                "height": int(data["height"]) if data.get("height", "").isdigit() else None,
                "click_url": linked.get(url),
                "emails": [],
                "positions": [],
            })
            record["emails"].append(number)
            record["positions"].append(seen)
            if not record["click_url"] and linked.get(url):
                record["click_url"] = linked[url]

        for href in re.findall(r'''href\s*=\s*["']([^"']+)["']''', source, re.I):
            decoded = html.unescape(href)
            if decoded.count("https://") > 1 or "?chttps://" in decoded:
                warnings.append({"email": number, "type": "malformed-link", "value": decoded})

    sql: list[str] = [
        "alter table public.dynamic_email_briefings",
        "  add column if not exists template_slot_id text",
        "  references public.dynamic_email_template_slots(id) on delete set null;",
        "",
        "create index if not exists dynamic_email_briefings_template_slot_idx",
        "  on public.dynamic_email_briefings (template_slot_id);",
        "",
    ]

    for number, source in enumerate(sources, 1):
        slot_id = f"b2c-classic-vibe-email-{number:02d}-control"
        sql.extend([
            "insert into public.dynamic_email_template_slots",
            "  (id, name, source, is_principal, status, version, created_by, updated_by)",
            f"values ({q(slot_id)}, {q(f'B2C Classic + Vibe · E-mail {number} · Controle')}, {sql_text(source)}, false, 'active', 1, null, null)",
            "on conflict (id) do update set",
            "  name = excluded.name, source = excluded.source, status = 'active',",
            "  version = greatest(public.dynamic_email_template_slots.version, excluded.version), updated_at = now();",
            "",
        ])

    for url, asset in sorted(assets.items()):
        emails = sorted(set(asset["emails"]))
        first_position = min(asset["positions"])
        slot = "header" if first_position == 2 else "generic"
        if first_position > 2:
            slot = f"banner_{min(first_position - 2, 3)}"
        label = asset["alt"] or ("Logo Afinz" if first_position == 1 else f"Ativo visual B2C {asset['asset_id'] or hashlib.sha1(url.encode()).hexdigest()[:8]}")
        tags = ["b2c", "classic-vibe", "controle", "historico-aprovado"] + [f"email-{n}" for n in emails]
        sql.extend([
            "insert into public.dynamic_email_assets",
            "  (name, external_url, click_url, slot, bu, partner, segment, subgroup, product, alt_text, width, height, tags, status, version, created_by, updated_by)",
            f"values ({q(label[:180])}, {q(url)}, {q(asset['click_url'])}, {q(slot)}, 'B2C', 'Institucional B2C', 'Base_Proprietaria', 'Classic + Vibe', 'Cartao', {q(asset['alt'])}, {asset['width'] or 'null'}, {asset['height'] or 'null'}, array[{','.join(q(tag) for tag in tags)}], 'ready', 1, null, null)",
            "on conflict (external_url) do update set",
            "  tags = (select array_agg(distinct tag) from unnest(public.dynamic_email_assets.tags || excluded.tags) tag),",
            "  updated_at = now();",
            "",
        ])

    for number, (subject, preheader) in enumerate(zip(SUBJECTS, PREHEADERS), 1):
        week = (number + 1) // 2
        activity = f"afz_car_vis_aqs_email_bsp_disp{1 if number % 2 else 2}s{week}vibe_pontual"
        row_id = f"b2c00000-0000-4000-8000-{number:012d}"
        group_id = f"b2c10000-0000-4000-8000-{number:012d}"
        slot_id = f"b2c-classic-vibe-email-{number:02d}-control"
        briefing = {
            "DT_INICIO": "", "DT_FIM": "", "UTM_CAMPANHA": f"B2C_CLASSIC_VIBE_S{week}_D{1 if number % 2 else 2}",
            "TP_CAMPANHA": "Aquisicao", "SEQUENCIA": f"E-mail {number}", "ASSUNTO": subject,
            "PRE_CABECALHO": preheader, "HEADER": "", "CARTAO_NM_COMERCIAL": "Afinz Visa",
            "NM_PRODUTO_INTERNO": "INSTITUCIONAL",
        }
        sql.extend([
            "insert into public.dynamic_email_briefings",
            "  (id, briefing_data, partner, segment, subgroup, week_key, activity_names, campaign_group_id, template_slot_id, status, version, journey_confirmed, acknowledged_missing_activity, legal_override, created_by, updated_by)",
            f"values ({q(row_id)}::uuid, {q(json.dumps(briefing, ensure_ascii=False))}::jsonb, 'Institucional B2C', 'Base_Proprietaria', 'Classic + Vibe', {q(f'Semana {week}')}, array[{q(activity)}], {q(group_id)}::uuid, {q(slot_id)}, 'needs_review', 1, false, false, false, null, null)",
            "on conflict (id) do update set",
            "  briefing_data = excluded.briefing_data, partner = excluded.partner, segment = excluded.segment,",
            "  subgroup = excluded.subgroup, week_key = excluded.week_key, activity_names = excluded.activity_names,",
            "  campaign_group_id = excluded.campaign_group_id, template_slot_id = excluded.template_slot_id,",
            "  status = excluded.status, updated_at = now();",
            "",
        ])

    migration = ROOT / "supabase" / "migrations" / "20260821153000_b2c_vibe_email_ruler.sql"
    migration.write_text("\n".join(sql), encoding="utf-8", newline="\n")
    report = {
        "templates": len(sources),
        "unique_assets": len(assets),
        "briefings": len(SUBJECTS),
        "warnings": warnings,
        "source_sha256": [hashlib.sha256(source.encode()).hexdigest() for source in sources],
    }
    output = ROOT / "outputs" / "b2c-vibe-email-ruler-audit.json"
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
