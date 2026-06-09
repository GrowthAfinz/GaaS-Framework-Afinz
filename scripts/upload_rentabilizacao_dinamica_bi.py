#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Upload Direto — Dinâmica BI Rentabilização → rentabilizacao_activities
Lê o CSV multi-bloco SFMC (WPP | EMAIL | SMS | PUSH) e insere diretamente
na tabela rentabilizacao_activities no Supabase.

Uso:
    python upload_rentabilizacao_dinamica_bi.py <arquivo.csv> [--start YYYY-MM-DD] [--end YYYY-MM-DD] [--dry-run]
"""

import sys, os, csv, re, argparse
from datetime import datetime
from collections import defaultdict

SUPABASE_URL = 'https://mipiwxadnpwtcgfcedym.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pcGl3eGFkbnB3dGNnZmNlZHltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NjU1NDUsImV4cCI6MjA4NTA0MTU0NX0.kIPhFfqvcJJh2S4yS2PsopmSYsZfC7ZNausumJGtmrM'

# ── Jornadas que entram no escopo ────────────────────────────────────────────
def is_rentabilizacao(jornada: str) -> bool:
    j = jornada.upper().strip()
    return (
        j.startswith('JOR_RENTABILIZACAO_')
        or j.startswith('JOR_ATIVACAO_')
        or j.startswith('JOR_ATIVAÇÃO_')      # com acento
        or j.startswith('JOR_INCENTIVO_AO_USO_')
        or j.startswith('JOR_POS_TOMBAMENTO_DESBLOQUEIO_')
        or j.startswith('JOR_Cartao_VC_Welcome')
    )

# ── Inferência de BU a partir da jornada ─────────────────────────────────────
def infer_bu(jornada: str, activity: str = '') -> str:
    j = jornada.upper()
    a = activity.upper()
    # Plurix
    if 'PLURIX' in j or 'MAISAMIGO' in j or a.startswith('PLU_'):
        return 'Plurix'
    # B2B2C
    if 'B2B2C' in j or '_BB_' in j or 'BB_' in j:
        return 'B2B2C'
    # Seguros
    if 'SEGURO' in j or a.startswith('AFZ_SEG_'):
        return 'Seguros'
    # Default B2C
    return 'B2C'

# ── Inferência de Segmento ────────────────────────────────────────────────────
def infer_segmento(jornada: str) -> str:
    j = jornada.upper()
    if 'SEGURO' in j:           return 'Rentabilizacao'
    if 'NOVOS' in j:            return 'Novos'
    if 'REATIVACAO' in j:       return 'Reativacao'
    if 'CARTONISTAS' in j:      return 'Cartonistas'
    if 'ATIVACAO' in j or 'ATIVAÇÃO' in j: return 'Ativacao'
    if 'WELCOME' in j:          return 'Ativacao'
    if 'DESBLOQUEIO' in j:      return 'Ativacao'
    if 'INCENTIVO' in j:        return 'Rentabilizacao'
    return 'Rentabilizacao'

# ── Normalização de canal ─────────────────────────────────────────────────────
CANAL_MAP = {
    'wpp': 'WhatsApp', 'whatsapp': 'WhatsApp',
    'email': 'E-mail', 'e-mail': 'E-mail',
    'sms': 'SMS',
    'push': 'Push',
}
def norm_canal(raw: str) -> str:
    return CANAL_MAP.get(raw.lower().strip(), raw.strip())

# ── Parse de data ─────────────────────────────────────────────────────────────
def parse_date(val: str) -> str | None:
    if not val or not val.strip():
        return None
    for fmt in ['%d/%m/%Y', '%Y-%m-%d', '%d/%m/%y', '%Y%m%d']:
        try:
            return datetime.strptime(val.strip(), fmt).strftime('%Y-%m-%d')
        except ValueError:
            pass
    return None

def safe_int(v: str) -> int | None:
    try: return int(float(v.strip()))
    except: return None

# ── Layout dos blocos (0-indexed) ─────────────────────────────────────────────
BLOCKS = [
    # (canal, journey_col, activity_col, date_col, sent_col, delivered_col, opens_col, clicks_col)
    ('WhatsApp', 0, 1, 2, 3, 4, 5, None),
    ('E-mail',   8, 9, 10, 11, 12, 13, 14),
    ('SMS',      16, 17, 18, 19, 20, None, None),
    ('Push',     24, 25, 26, 27, 28, None, None),
]

# ── Extração de linhas dos blocos ─────────────────────────────────────────────
def extract_rows(csv_rows: list[list[str]]) -> list[dict]:
    records = {}  # (jornada, activity, canal, date) → dict

    for row in csv_rows[3:]:  # pular 3 linhas de header
        if not any(row):
            continue

        for canal_name, jcol, acol, dcol, scol, delcol, opcol, clcol in BLOCKS:
            jornada = row[jcol].strip() if jcol < len(row) else ''
            activity = row[acol].strip() if acol < len(row) else ''
            date_str = parse_date(row[dcol]) if dcol < len(row) else None

            if not jornada or not activity or not date_str:
                continue
            if not is_rentabilizacao(jornada):
                continue
            if jornada in ('Total Geral', 'journeyname (whatsapp)', 'journeyname (e-mail)', 'journeyname (sms)', 'journeyname (push)'):
                continue

            key = (jornada, activity, canal_name, date_str)
            if key not in records:
                records[key] = {
                    'jornada':                  jornada,
                    'Activity name / Taxonomia': activity,
                    'Canal':                    canal_name,
                    'Data de Disparo':          date_str + 'T03:00:00+00:00',
                    'BU':                       infer_bu(jornada, activity),
                    'Segmento':                 infer_segmento(jornada),
                    'Etapa de aquisição':       'Rentabilizacao',
                    'Base Total':               None,
                    'Base Acionável':           None,
                    'Abertura':                 None,
                    'Cliques':                  None,
                    'Parceiro':                 'N/A',
                    'Produto':                  'Cartao',
                    'status':                   'Enviado',
                    'prog_gaas':                False,
                }

            r = records[key]
            sent = safe_int(row[scol]) if scol is not None and scol < len(row) else None
            deliv = safe_int(row[delcol]) if delcol is not None and delcol < len(row) else None
            opens = safe_int(row[opcol]) if opcol is not None and opcol < len(row) else None
            clicks = safe_int(row[clcol]) if clcol is not None and clcol < len(row) else None

            def add(field, value):
                if value is not None:
                    r[field] = (r[field] or 0) + value

            add('Base Total', sent)
            add('Base Acionável', deliv)
            add('Abertura', opens)
            add('Cliques', clicks)

    # Deduplicar pela chave de unicidade da tabela: (activity, canal, data)
    # para evitar conflitos intra-batch
    deduped: dict[tuple, dict] = {}
    for rec in records.values():
        uq = (rec['Activity name / Taxonomia'], rec['Canal'], rec['Data de Disparo'])
        if uq not in deduped:
            deduped[uq] = rec
        else:
            # Somar métricas se mesma activity em jornadas diferentes
            for f in ('Base Total', 'Base Acionável', 'Abertura', 'Cliques'):
                a = deduped[uq].get(f) or 0
                b = rec.get(f) or 0
                deduped[uq][f] = (a + b) if (a or b) else None

    return list(deduped.values())

def filter_period(records: list[dict], start: str | None = None, end: str | None = None) -> list[dict]:
    if not start and not end:
        return records

    for label, value in (('start', start), ('end', end)):
        if value and not parse_date(value):
            raise ValueError(f'--{label} invalido: {value}. Use YYYY-MM-DD ou DD/MM/YYYY.')

    start_iso = parse_date(start) if start else None
    end_iso = parse_date(end) if end else None
    filtered = []

    for rec in records:
        day = str(rec.get('Data de Disparo') or '')[:10]
        if start_iso and day < start_iso:
            continue
        if end_iso and day > end_iso:
            continue
        filtered.append(rec)

    return filtered

# ── Upload em batches ─────────────────────────────────────────────────────────
def upload(records: list[dict], dry_run: bool = False) -> None:
    from supabase import create_client

    print(f'\nTotal registros a inserir: {len(records)}')

    # Resumo por jornada
    by_jornada = defaultdict(int)
    for r in records:
        by_jornada[r['jornada']] += 1
    print('\nResumo por jornada:')
    for j, qtd in sorted(by_jornada.items()):
        print(f'  {j}: {qtd} disparos')

    if dry_run:
        print('\n[DRY RUN] Nenhum dado foi inserido.')
        return

    client = create_client(SUPABASE_URL, SUPABASE_KEY)
    batch_size = 100
    inserted = 0
    errors = 0

    for i in range(0, len(records), batch_size):
        batch = records[i:i + batch_size]
        try:
            res = client.table('rentabilizacao_activities').upsert(
                batch,
                on_conflict='"Activity name / Taxonomia","Canal","Data de Disparo"'
            ).execute()
            inserted += len(batch)
            print(f'  Batch {i//batch_size + 1}: {len(batch)} inseridos ({inserted}/{len(records)})')
        except Exception as e:
            errors += 1
            print(f'  ERRO batch {i//batch_size + 1}: {e}')

    print(f'\nConcluído: {inserted} inseridos, {errors} erros')

# ── Main ───────────────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(description='Upload Direto - Dinamica BI Rentabilizacao -> rentabilizacao_activities')
    parser.add_argument('path', help='Arquivo CSV multi-bloco da Dinamica BI')
    parser.add_argument('--start', help='Data inicial inclusiva, YYYY-MM-DD ou DD/MM/YYYY')
    parser.add_argument('--end', help='Data final inclusiva, YYYY-MM-DD ou DD/MM/YYYY')
    parser.add_argument('--dry-run', action='store_true', help='Processa e resume sem inserir no Supabase')
    args = parser.parse_args()

    path = args.path
    dry_run = args.dry_run

    if not os.path.exists(path):
        sys.exit(f'Arquivo não encontrado: {path}')

    print(f'Lendo: {path}')
    with open(path, encoding='latin-1') as f:
        all_rows = list(csv.reader(f, delimiter=';'))
    print(f'Linhas brutas: {len(all_rows)}')

    records = extract_rows(all_rows)
    print(f'Registros de Rentabilização extraídos: {len(records)}')
    records = filter_period(records, args.start, args.end)
    if args.start or args.end:
        print(f'Registros após filtro de período ({args.start or "inicio"} a {args.end or "fim"}): {len(records)}')

    upload(records, dry_run=dry_run)

if __name__ == '__main__':
    main()
