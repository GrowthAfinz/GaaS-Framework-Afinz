"""Deterministic metadata-only seed. Does not connect to a database or edit the vault."""
import argparse
import hashlib
import json
import re
from pathlib import Path


def build(inventory, output):
    raw = inventory.read_bytes()
    rows = json.loads(raw.decode('utf-8-sig'))
    source_hash = hashlib.sha256(raw).hexdigest()
    ids = [r['id'] for r in rows]
    if len(ids) != len(set(ids)):
        raise ValueError('Duplicate inventory_id')
    operations, destinations = [], []
    for r in sorted(rows, key=lambda r: r['id']):
        ident = r['id']
        scope, domain, front, reason = None, None, None, ''
        disposition = 'pending'
        if ident.startswith('CRM-'):
            domain, front = 'CRM', 'crm_aquisicao'
            scope = dict(r['scope_key'])
            if set(scope) != {'bu', 'segment', 'partner'} or any(not v for v in scope.values()):
                raise ValueError('Invalid CRM scope: ' + ident)
            reason = 'Exact inventory scope; business confirmation pending'
        elif ident.startswith('MID-'):
            canonical = r.get('canonical_ids', [])
            if len(canonical) == 1:
                domain, scope = 'MID', {'canonical_campaign_id': canonical[0]}
                families = set(r.get('canonical_objectives', []))
                if families == {'seguros'}:
                    front = 'cross_sell_seguros'
                elif families and families <= {'aquisicao', 'plurix'}:
                    front = 'midia_aquisicao'
                elif families and families <= {'marca', 'rentabilizacao', 'copa'}:
                    front = 'fora_de_escopo'
                else:
                    scope, domain = None, None
                reason = ('Unique exact canonical identity from inventory; classification remains candidate'
                    if scope is not None else 'Canonical identity known, business front ambiguous; B2C alone does not prove acquisition')
            else:
                reason = 'Missing or ambiguous canonical identity; no name similarity matching'
        elif ident.startswith('RENT-'):
            domain, scope = 'RENT', {'bu': r['bu'], 'family': r['family']}
            # Explicit inventory family, not broad BU='Seguros' (which includes tests).
            insurance = r['family'] in {'Oferta de seguro em Plurix', 'Carrinho de Seguro Mulher', 'Oferta Seguro Mulher', 'Seguro Residência 24h'}
            front = 'cross_sell_seguros' if insurance else 'fora_de_escopo'
            reason = 'Explicit inventory family; no certified sale metric'
        elif ident.startswith('B2C-'):
            domain, front = 'B2C', 'originacao_b2c'
            scope = {'population': r['title'].split(' — ')[-1]}
            reason = 'Population preserved; never add total to its components'
        elif ident.startswith('FUN-'):
            domain, front = 'FUN', 'originacao_b2c'
            scope = {'funnel': r['source'], 'population': r['title'].split(' — ')[-1]}
            reason = 'Exact source and measurement partition; no population equivalence inferred'
        elif ident.startswith('DOC-') or re.fullmatch(r'[0-9a-f-]{36}', ident):
            disposition = 'document'
            reason = 'Editorial/documentary entity; operation link requires reconciliation'
        elif ident.startswith('COP-'):
            disposition = 'out_of_scope'
            reason = 'Copa measurement slice, not an acquisition operation or campaign alias'
        else:
            reason = 'Unobserved mapping/canonical identity; alias target not proven'
        if scope is not None:
            disposition = 'operation'
            op = {
                'operation_id': ident, 'front': front, 'domain': domain, 'scope': scope,
                'display_name': r['title'], 'lifecycle': 'candidata', 'aliases': [],
                'vault_note_path': '07-Evolucao/Assunto-' + re.sub('[^a-zA-Z0-9]+', '-', ident).strip('-') + '.md',
                'confirmed_by': None, 'confirmed_at': None,
                'valid_from': (r.get('first_date') or '2026-10-03')[:7] + '-01',
                'valid_to': None,
                'regime_start': '2026-02-01' if scope.get('partner') == 'Serasa' else None,
                'scope_schema_version': 1,
                'provenance': {'inventory_id': ident, 'inventory_date': '2026-10-03',
                    'registry_sha256': source_hash, 'source': r['source'], 'classification_reason': reason,
                    'validity_basis': 'first observed calendar month; not a certified business start'},
            }
            operations.append(op)
        destinations.append({'inventory_id': ident, 'source': r['source'], 'disposition': disposition,
            'operation_id': ident if scope is not None else None, 'front': front, 'reason': reason})
    if sum(o['domain'] == 'CRM' for o in operations) != 33:
        raise ValueError('Inventory CRM cardinality changed; review before seed')
    scope_ids = [(o['domain'], json.dumps(o['scope'], sort_keys=True)) for o in operations]
    if len(scope_ids) != len(set(scope_ids)):
        raise ValueError('Duplicate operation scopes; reconcile before seeding')
    rules = []
    def rule(name, family, metric, front, params):
        rules.append({'rule_id': name + '_v1', 'front': front, 'family': family, 'metric': metric,
            'params': params, 'enabled': True, 'mode': 'observacao', 'version': 1,
            'valid_from': '2026-10-27', 'valid_to': None,
            'backtest_ref': 'docs/plans/learning-loop/RELEASE_8_BACKTEST_2026-04_a_09.md',
            'created_by': 'release8-reviewed-spec-v3'})
    common = {'window_months': 6, 'minimum_months': 4, 'relative_threshold': '0.30'}
    rule('T1_crm_moderado', 'T1', 'cards', 'crm_aquisicao', {**common, 'materiality': '50'})
    rule('T2_crm_moderado', 'T2', 'cac_brl_per_card', 'crm_aquisicao', {**common, 'materiality': '1000', 'minimum_cards': '30'})
    for source, tolerance in [('activities', 7), ('paid_media_metrics:meta', 3), ('paid_media_metrics:google', 3), ('b2c_daily_metrics', 7), ('app_afinz_funnel_daily_raw', 7), ('serasa_bi_daily_funnel', 7)]:
        rule('T5_frescor_' + source.replace(':', '_'), 'T5', source, 'source_quality',
            {'tolerance_days': tolerance, 'provisional': True, 'source_partition': source})
    rule('T6_revisao_certificado', 'T6', 'cards', 'crm_aquisicao', {'absolute_threshold': '20', 'relative_threshold': '0.02'})
    output.mkdir(parents=True, exist_ok=True)
    for name, data in [('operations.json', operations), ('rules.json', rules), ('inventory-dispositions.json', {'inventory_sha256': source_hash, 'entries': destinations})]:
        (output / name).write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    sql = ['-- PREPARED ONLY. Requires accepted backtest and explicit production application approval.', 'begin;']
    for table, data in [('growth_operations', operations), ('growth_trigger_rules', rules)]:
        payload = json.dumps(data, ensure_ascii=False, separators=(',', ':')).replace("'", "''")
        keys = list(data[0])
        sql.append('insert into public.' + table + ' (' + ', '.join(keys) + ')\nselect ' + ', '.join(keys) + " from jsonb_populate_recordset(null::public." + table + ", '" + payload + "'::jsonb);")
    # No ON CONFLICT DO UPDATE: a drifted production registry must stop, not be overwritten.
    sql.append('commit;')
    (output / 'seed.sql').write_text('\n\n'.join(sql) + '\n', encoding='utf-8')
    print(json.dumps({'operations': len(operations), 'crm': 33, 'destinations': len(destinations), 'rules': len(rules)}))


if __name__ == '__main__':
    p = argparse.ArgumentParser()
    p.add_argument('--inventory', required=True, type=Path)
    p.add_argument('--output', required=True, type=Path)
    a = p.parse_args()
    build(a.inventory, a.output)
