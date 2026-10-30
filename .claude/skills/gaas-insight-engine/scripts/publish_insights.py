#!/usr/bin/env python3
"""GaaS Insight Engine - Camada 3 (persistencia).

Valida o JSON de insights gerado pelo Claude contra o schema da tabela
crm_insights e faz upsert idempotente por insight_key.
Insights ja marcados como resolvido/descartado no banco NAO voltam a ativo.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import sys
from datetime import datetime
from pathlib import Path
from urllib.error import HTTPError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

DEFAULT_SUPABASE_URL = "https://mipiwxadnpwtcgfcedym.supabase.co"
DEFAULT_SUPABASE_KEY = os.environ.get("SUPABASE_ANON_KEY", "")

TIPOS = {"gargalo", "decomposicao_cac", "share_portfolio", "risco_concentracao",
         "oportunidade", "queda_performance", "virada_safra"}
SEVERIDADES = {"critico", "alto", "medio", "baixo"}
CONFIANCAS = {"alta", "media", "baixa"}
REQUIRED = ("tipo", "severidade", "confianca", "titulo", "sinal", "impacto",
            "causa_provavel", "evidencia", "acao", "prioridade")
MAX_INSIGHTS = 12
MAX_BAIXO = 2


def make_key(insight: dict) -> str:
    """Hash estavel: tipo + dimensoes de contexto (sem janela - o upsert atualiza o mesmo card)."""
    ctx = "|".join(str(insight.get(k) or "") for k in
                   ("tipo", "bu", "canal", "segmento", "etapa", "safra", "titulo"))
    return hashlib.sha256(ctx.encode("utf-8")).hexdigest()[:24]


def validate(insights: list[dict]) -> list[str]:
    errors: list[str] = []
    if len(insights) > MAX_INSIGHTS:
        errors.append(f"{len(insights)} insights excede o limite de {MAX_INSIGHTS}")
    if sum(1 for i in insights if i.get("severidade") == "baixo") > MAX_BAIXO:
        errors.append(f"mais de {MAX_BAIXO} insights de severidade 'baixo'")
    for idx, ins in enumerate(insights):
        where = f"insight[{idx}] ({ins.get('titulo', 'sem titulo')!r})"
        for field in REQUIRED:
            if ins.get(field) in (None, "", {}):
                errors.append(f"{where}: campo obrigatorio '{field}' ausente/vazio")
        if ins.get("tipo") not in TIPOS:
            errors.append(f"{where}: tipo invalido {ins.get('tipo')!r}")
        if ins.get("severidade") not in SEVERIDADES:
            errors.append(f"{where}: severidade invalida {ins.get('severidade')!r}")
        if ins.get("confianca") not in CONFIANCAS:
            errors.append(f"{where}: confianca invalida {ins.get('confianca')!r}")
        if not isinstance(ins.get("evidencia"), dict):
            errors.append(f"{where}: evidencia deve ser objeto JSON")
        try:
            p = float(ins.get("prioridade", -1))
            if p < 0 or p > 90:
                errors.append(f"{where}: prioridade {p} fora do range 0-90")
        except (TypeError, ValueError):
            errors.append(f"{where}: prioridade nao numerica")
    return errors


def rest(base_url: str, key: str, method: str, path: str, payload=None, headers_extra=None):
    url = f"{base_url}/rest/v1/{path}"
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
    }
    if headers_extra:
        headers.update(headers_extra)
    data = json.dumps(payload, ensure_ascii=False).encode("utf-8") if payload is not None else None
    req = Request(url, data=data, headers=headers, method=method)
    try:
        with urlopen(req, timeout=60) as resp:
            body = resp.read().decode("utf-8")
            return json.loads(body) if body else None
    except HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        raise SystemExit(f"Supabase HTTP {exc.code} ({method} {path}): {body}") from exc


def main() -> None:
    parser = argparse.ArgumentParser(description="Valida e publica insights em crm_insights")
    parser.add_argument("input", help="JSON array de insights gerado pelo Claude")
    parser.add_argument("--dry-run", action="store_true", help="so valida, nao publica")
    parser.add_argument("--supabase-url", default=os.environ.get("SUPABASE_URL", DEFAULT_SUPABASE_URL))
    parser.add_argument("--supabase-key", default=os.environ.get("SUPABASE_ANON_KEY", DEFAULT_SUPABASE_KEY))
    args = parser.parse_args()

    insights = json.loads(Path(args.input).read_text(encoding="utf-8"))
    if not isinstance(insights, list):
        raise SystemExit("O arquivo deve conter um JSON array de insights")

    errors = validate(insights)
    if errors:
        print("VALIDACAO FALHOU:", file=sys.stderr)
        for e in errors:
            print(f"  - {e}", file=sys.stderr)
        raise SystemExit(1)
    print(f"Validacao OK: {len(insights)} insights")
    if args.dry_run:
        return

    base_url, key = args.supabase_url.rstrip("/"), args.supabase_key

    # status existentes: resolvido/descartado nao voltam a ativo
    existing = rest(base_url, key, "GET", "crm_insights?select=insight_key,status") or []
    frozen = {r["insight_key"]: r["status"] for r in existing
              if r["status"] in ("resolvido", "descartado")}
    pinned = {r["insight_key"] for r in existing if r["status"] == "fixado"}

    now = datetime.now().isoformat(timespec="seconds")
    rows, skipped = [], 0
    for ins in insights:
        ins_key = ins.get("insight_key") or make_key(ins)
        if ins_key in frozen:
            skipped += 1
            continue
        rows.append({
            "insight_key": ins_key,
            "tipo": ins["tipo"],
            "severidade": ins["severidade"],
            "confianca": ins["confianca"],
            "periodo_inicio": ins.get("periodo_inicio"),
            "periodo_fim": ins.get("periodo_fim"),
            "bu": ins.get("bu"),
            "canal": ins.get("canal"),
            "segmento": ins.get("segmento"),
            "etapa": ins.get("etapa"),
            "safra": ins.get("safra"),
            "titulo": ins["titulo"],
            "sinal": ins["sinal"],
            "impacto": ins["impacto"],
            "causa_provavel": ins["causa_provavel"],
            "evidencia": ins["evidencia"],
            "acao": ins["acao"],
            "criterio_sucesso": ins.get("criterio_sucesso"),
            "prioridade": ins["prioridade"],
            "status": "fixado" if ins_key in pinned else "ativo",
            "fonte": "skill",
            "atualizado_em": now,
        })

    if rows:
        rest(base_url, key, "POST", "crm_insights?on_conflict=insight_key",
             payload=rows,
             headers_extra={"Prefer": "resolution=merge-duplicates,return=minimal"})
    print(f"Publicados/atualizados: {len(rows)} | pulados (resolvido/descartado): {skipped}")


if __name__ == "__main__":
    main()
