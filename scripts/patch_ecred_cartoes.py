#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Patch retroativo: ECRED-API → Cartões Gerados na tabela activities
Lê o bloco PERF da Dinâmica BI, extrai rows com canal='ECRED-API',
e atualiza Cartões Gerados / Propostas / Aprovados nas activities correspondentes.

Uso:
    python patch_ecred_cartoes.py <arquivo_dinamica_bi.csv> [--dry-run]

Flags:
    --dry-run   Mostra o que seria atualizado sem gravar nada
    --overwrite Sobrescreve mesmo se já tiver valor (padrão: só preenche NULL)
"""

import sys, csv, argparse
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
from datetime import datetime, timedelta
from collections import defaultdict

SUPABASE_URL = 'https://mipiwxadnpwtcgfcedym.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pcGl3eGFkbnB3dGNnZmNlZHltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NjU1NDUsImV4cCI6MjA4NTA0MTU0NX0.kIPhFfqvcJJh2S4yS2PsopmSYsZfC7ZNausumJGtmrM'

# ── Extração do bloco PERF ────────────────────────────────────────────────────
# Layout PERF no CSV: cols 23=journey, 24=activity, 25=data_inicio, 26=canal,
#   27=proposta, 28=aprovados, 29=finalizados, 30=assistida, 31=independente

def parse_date(val: str) -> datetime | None:
    for fmt in ['%d/%m/%Y', '%Y-%m-%d', '%d/%m/%y']:
        try:
            return datetime.strptime(val.strip(), fmt)
        except ValueError:
            pass
    return None

def safe_int(v: str) -> int:
    try:
        return int(float(v.strip()))
    except:
        return 0

def extract_ecred_rows(csv_path: str) -> list[dict]:
    """Lê o CSV e retorna todos os rows ECRED-API do bloco PERF com conversões."""
    rows = []
    with open(csv_path, encoding='latin-1') as f:
        all_rows = list(csv.reader(f, delimiter=';'))

    for i, row in enumerate(all_rows):
        if len(row) < 30:
            continue
        canal    = row[26].strip()
        activity = row[24].strip()
        date_str = row[25].strip()

        # Pular headers e pivot filters
        if canal != 'ECRED-API':
            continue
        if not activity or not date_str:
            continue
        if date_str in ('data_inicio', 'DATA', ''):
            continue

        dt = parse_date(date_str)
        if not dt:
            continue

        proposta    = safe_int(row[27]) if len(row) > 27 else 0
        aprovados   = safe_int(row[28]) if len(row) > 28 else 0
        finalizados = safe_int(row[29]) if len(row) > 29 else 0
        assistida   = safe_int(row[30]) if len(row) > 30 else 0
        independente= safe_int(row[31]) if len(row) > 31 else 0

        # Só interessa se houver pelo menos um cartão finalizado
        if finalizados <= 0 and proposta <= 0:
            continue

        rows.append({
            'activity':     activity,
            'date':         dt.strftime('%Y-%m-%d'),
            'proposta':     proposta,
            'aprovados':    aprovados,
            'finalizados':  finalizados,
            'assistida':    assistida,
            'independente': independente,
        })

    return rows

# ── Busca e patch no Supabase ─────────────────────────────────────────────────

def run_patch(ecred_rows: list[dict], dry_run: bool, overwrite: bool):
    from supabase import create_client

    client = create_client(SUPABASE_URL, SUPABASE_KEY)

    # Agrupar por activity para fazer buscas em lote
    by_activity: dict[str, list[dict]] = defaultdict(list)
    for r in ecred_rows:
        by_activity[r['activity']].append(r)

    print(f'\n  Activities únicas a processar: {len(by_activity)}')
    print(f'  Pares (activity+data) totais:  {len(ecred_rows)}')
    print(f'  Modo: {"DRY RUN" if dry_run else "GRAVANDO"} | '
          f'{"SOBRESCREVE" if overwrite else "só NULL"}\n')

    total_matched  = 0
    total_updated  = 0
    total_skipped  = 0
    total_notfound = 0
    activity_summary = []

    for activity_name, rows_for_act in sorted(by_activity.items()):

        # Buscar todas as activities com esse nome no banco
        res = client.table('activities')\
            .select('id, "Data de Disparo", "Cartões Gerados", "Propostas", "Aprovados"')\
            .eq('"Activity name / Taxonomia"', activity_name)\
            .execute()

        db_rows = res.data or []
        if not db_rows:
            print(f'  ⚠  NÃO ENCONTRADO no banco: {activity_name}')
            total_notfound += len(rows_for_act)
            activity_summary.append({'activity': activity_name, 'status': 'not_found',
                                      'matched': 0, 'updated': 0, 'skipped': 0})
            continue

        # Índice por data (YYYY-MM-DD) → db row
        # Tenta match exato D0, depois D+1, D+2
        db_by_date: dict[str, dict] = {}
        for db_row in db_rows:
            raw = db_row.get('Data de Disparo') or ''
            dt = parse_date(str(raw)[:10])
            if dt:
                db_by_date[dt.strftime('%Y-%m-%d')] = db_row

        act_matched = act_updated = act_skipped = 0

        for ecred in rows_for_act:
            ecred_date = ecred['date']
            ecred_dt   = datetime.strptime(ecred_date, '%Y-%m-%d')

            # Tentar D0, D-1, D-2 (ECRED pode registrar result D após disparo)
            target_row = None
            for delta in [0, 1, 2]:
                candidate_date = (ecred_dt - timedelta(days=delta)).strftime('%Y-%m-%d')
                if candidate_date in db_by_date:
                    target_row = db_by_date[candidate_date]
                    break

            if not target_row:
                print(f'  ⚠  Sem match data {ecred_date} → {activity_name}')
                total_notfound += 1
                continue

            act_matched += 1
            total_matched += 1

            # Verificar se já tem valor:
            # - NULL  → sempre atualiza
            # - 0     → atualiza (provável default sem resultado real)
            # - > 0   → só atualiza com --overwrite (valor existente pode ser correto)
            cartoes_atual = target_row.get('Cartões Gerados')
            has_real_value = cartoes_atual is not None and int(cartoes_atual or 0) > 0
            if has_real_value and not overwrite:
                act_skipped += 1
                total_skipped += 1
                if dry_run:
                    print(f'  skip (ja tem {cartoes_atual}): {activity_name} | {ecred_date}')
                continue

            # Construir patch
            patch: dict = {}
            if ecred['finalizados'] > 0:
                patch['Cartões Gerados'] = ecred['finalizados']
            if ecred['proposta'] > 0 and (target_row.get('Propostas') is None or overwrite):
                patch['Propostas'] = ecred['proposta']
            if ecred['aprovados'] > 0 and (target_row.get('Aprovados') is None or overwrite):
                patch['Aprovados'] = ecred['aprovados']
            if ecred['assistida'] > 0:
                patch['Emissões Assistidas'] = ecred['assistida']
            if ecred['independente'] > 0:
                patch['Emissões Independentes'] = ecred['independente']

            if not patch:
                act_skipped += 1
                total_skipped += 1
                continue

            act_updated += 1
            total_updated += 1

            if dry_run:
                print(f'  ✓  UPDATE {activity_name} | {ecred_date} → {patch}')
            else:
                upd = client.table('activities')\
                    .update({**patch, 'updated_at': datetime.utcnow().isoformat()})\
                    .eq('id', target_row['id'])\
                    .execute()

        activity_summary.append({
            'activity': activity_name,
            'status':   'processed',
            'matched':  act_matched,
            'updated':  act_updated,
            'skipped':  act_skipped,
        })

    # Resumo final
    print('\n' + '='*70)
    print('RESUMO')
    print('='*70)
    for item in activity_summary:
        if item['status'] == 'not_found':
            print(f'  ❌ NOT FOUND: {item["activity"]}')
        else:
            print(f'  {"✅" if item["updated"] > 0 else "↷"} {item["activity"]}')
            print(f'     matched={item["matched"]} | updated={item["updated"]} | skipped={item["skipped"]}')

    print()
    print(f'Total matched:   {total_matched}')
    print(f'Total updated:   {total_updated}  {"(DRY RUN — nada gravado)" if dry_run else "✅ gravados"}')
    print(f'Total skipped:   {total_skipped}  (já tinham valor)')
    print(f'Total not found: {total_notfound}')

# ── Main ───────────────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('csv', help='Caminho para o CSV da Dinâmica BI')
    parser.add_argument('--dry-run',   action='store_true', help='Apenas mostra, não grava')
    parser.add_argument('--overwrite', action='store_true', help='Sobrescreve valores existentes')
    args = parser.parse_args()

    print(f'Lendo CSV: {args.csv}')
    ecred_rows = extract_ecred_rows(args.csv)
    total_cartoes = sum(r['finalizados'] for r in ecred_rows)
    print(f'  Rows ECRED-API com conversão: {len(ecred_rows)}')
    print(f'  Total cartões no CSV:         {total_cartoes:,}')

    if not ecred_rows:
        print('Nenhum row ECRED-API encontrado.')
        return

    run_patch(ecred_rows, dry_run=args.dry_run, overwrite=args.overwrite)

if __name__ == '__main__':
    main()
