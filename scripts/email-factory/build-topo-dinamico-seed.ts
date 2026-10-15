/**
 * Migration da régua TOPO DE FUNIL DINÂMICO (template PLURIX V13).
 * Uso: npx vite-node scripts/email-factory/build-topo-dinamico-seed.ts <topo_dinamico_rows.json>
 * A entrada sai de scripts/email-factory/build_topo_dinamico_rows.py.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { PLURIX_V13_TEMPLATE, PLURIX_V13_TEMPLATE_ID, PLURIX_V13_TEMPLATE_NAME } from '../../src/modules/dynamic-email/fixtures/plurixV13Template';
import { BRIEFING_COLUMNS, emptyBriefingRow, validateRows, type BriefingRow } from '../../src/modules/dynamic-email/domain/briefing';

type InputRow = { sequence: string; week: string; network: string; subgroup: string; v10_id: string; data: Record<string, string> };
const input = JSON.parse(readFileSync(process.argv[2], 'utf-8')) as { rows: InputRow[] };
const root = join(__dirname, '../..');

const SEGMENT = 'Topo de Funil Dinâmico';
const RULER_ID = 'd1d10000-0000-4000-8000-000000000001';
const GROUP: Record<string, string> = {
  'E-mail 1': 'd1d10000-0000-4000-8000-0000000000e1',
  'E-mail 2': 'd1d10000-0000-4000-8000-0000000000e2',
  'E-mail 3': 'd1d10000-0000-4000-8000-0000000000e3',
};
const ORDER = ['AMIGAO', 'AVENIDA', 'BOA', 'COMPRE MAIS', 'PARANA', 'SUPERPAO'];
const tag = (s: string) => `$gaas$${s}$gaas$`;
const json = (value: unknown) => `${tag(JSON.stringify(value))}::jsonb`;

const rows = input.rows.map((item) => {
  const index = ORDER.indexOf(item.network) + 1 + (Number(item.sequence.slice(-1)) - 1) * 10;
  const id = `d1d10000-0000-4000-8000-0000000001${String(index).padStart(2, '0')}` as `${string}-${string}-${string}-${string}-${string}`;
  const row = emptyBriefingRow(id);
  BRIEFING_COLUMNS.forEach((column) => { row[column] = item.data[column] ?? ''; });
  return { ...item, id, row: Object.assign(row, { __journeyConfirmed: true, __meta: { segment: SEGMENT } }) as BriefingRow };
});

const issues = validateRows(rows.map((item) => item.row));
const errors = rows.flatMap((item) => (issues.get(item.id) ?? []).filter((issue) => issue.severity === 'error').map((issue) => `${item.sequence} ${item.network}: ${issue.message}`));
if (errors.length) throw new Error(`Briefings com erro bloqueante:\n${errors.join('\n')}`);
const warnings = [...new Set(rows.flatMap((item) => (issues.get(item.id) ?? []).filter((issue) => issue.severity === 'warning' && issue.code !== 'window').map((issue) => issue.message)))];

const SOURCE = { file: 'Regua_Plurix_TopoFunil_Proposta_Outubro26.xlsx', sheet: 'Briefing Fábrica', rows: '9-46', columns: 'E-mail 1 a 3', importedAt: '2026-10-15' };

const briefingSql = rows.map((item) => {
  const data = Object.fromEntries([['__id', item.id], ...BRIEFING_COLUMNS.map((column) => [column, item.row[column]])]);
  return `(${tag(item.id)}::uuid, ${json(data)}, 'Plurix', ${tag(SEGMENT)}, ${tag(item.subgroup)}, ${tag(item.week)}, array[]::text[], ${tag(GROUP[item.sequence])}::uuid, 'draft', 1, ${tag(PLURIX_V13_TEMPLATE_ID)}, false, ${json({ ...SOURCE, importKey: `${SEGMENT.toUpperCase()}|${item.sequence}|${item.network}`, network_fields_from: `rascunho V10 ${item.v10_id}` })})`;
});

const strategySql = Object.entries(GROUP).map(([sequence, group]) => {
  const amigao = rows.find((item) => item.sequence === sequence && item.network === 'AMIGAO')!;
  return `(${tag(RULER_ID)}::uuid, ${tag(group)}::uuid, 'Plurix', ${tag(SEGMENT)}, ${tag(amigao.week)}, ${tag(sequence)}, ${tag(amigao.row.ASSUNTO)}, ${tag(amigao.row.PRE_CABECALHO)}, 'draft', 'draft', 'needs_review', 'not_tested', ${json({ import: SOURCE, header: 'header dinâmico no briefing (V13)' })}, 'llm', 'llm', 'Importação da planilha Briefing Fábrica (E-mail 1 a 3) como rascunho', 'claude-opus-5-5', ${tag(`TOPO DINÂMICO · ${sequence}`)})`;
});

const sql = `-- TOPO DE FUNIL DINÂMICO: régua nova de topo Plurix com o template PLURIX V13.
-- Gerado por scripts/email-factory/build-topo-dinamico-seed.ts a partir da aba "Briefing Fábrica"
-- (linhas 9 a 46, E-mail 1 a 3). Idempotente.
--
-- 1. Template candidato PLURIX V13 (fonte completa, sem placeholder).
-- 2. A régua V10 em rascunho (TP "Topo de Funil", nunca publicada) vai para a Lixeira: a régua nova
--    usa o mesmo TP_CAMPANHA e passa a ser a única com essa chave.
-- 3. Régua, 3 planos de e-mail e 18 rascunhos (3 e-mails x 6 redes), com versão 1 no histórico.
-- Colunas novas do header (HEADER_TITULO, HEADER_SUBTITULO, HEADER_IMAGEM_CARTAO, HEADER_LOGO)
-- vivem em briefing_data (jsonb): não exigem DDL.

insert into public.dynamic_email_template_slots (id, name, source, is_principal, status, version)
values (${tag(PLURIX_V13_TEMPLATE_ID)}, ${tag(PLURIX_V13_TEMPLATE_NAME)}, ${tag(PLURIX_V13_TEMPLATE)}, false, 'active', 1)
on conflict (id) do update set name = excluded.name, source = excluded.source, updated_at = now();

update public.dynamic_email_briefings
set status = 'archived', updated_at = now()
where segment = 'Topo de Funil' and briefing_data->>'TP_CAMPANHA' = 'Topo de Funil' and status = 'draft';

update public.dynamic_email_ruler_strategies
set editorial_status = 'archived', updated_at = now()
where id = 'c10e0000-0000-4000-8000-000000000001';

insert into public.dynamic_email_ruler_strategies (id, name, description, partner, product, segment, objective, audience, journey_stage, business_front, ruler_family, journey_family, journey_type, editorial_status, template_slot_id, version)
values (${tag(RULER_ID)}::uuid, 'TOPO DE FUNIL DINÂMICO',
  ${tag('Régua de topo Plurix com header dinâmico (textos e imagens no próprio briefing), faixa de limite vinda do briefing e oferta do pool no bloco 3. Template PLURIX V13: motor único com sequência atual (base V12 testada). Começa com E-mail 1 a 3 da planilha Briefing Fábrica.')},
  'Plurix', '+amigo', ${tag(SEGMENT)},
  'Levar membros do Clube +amigo das 6 redes a pedir o cartão pelo app.',
  'Somente membros do Clube +amigo das 6 redes Plurix. Faixa de limite só para LIMITE_CRD positivo.',
  'Topo de funil', 'acquisition', 'top_of_funnel', 'Aquisição', 'Topo de Funil', 'draft', ${tag(PLURIX_V13_TEMPLATE_ID)}, 1)
on conflict (id) do nothing;

insert into public.dynamic_email_email_strategies (ruler_strategy_id, campaign_group_id, partner, segment, week_key, sequence, subject, preheader, technical_status, editorial_status, visual_status, certification_status, field_provenance, updated_by_type, update_source, change_reason, llm_model, functional_name)
values
${strategySql.join(',\n')}
on conflict (campaign_group_id) do nothing;

insert into public.dynamic_email_briefings (id, briefing_data, partner, segment, subgroup, week_key, activity_names, campaign_group_id, status, version, template_slot_id, journey_confirmed, import_source)
values
${briefingSql.join(',\n')}
on conflict (id) do nothing;

insert into public.dynamic_email_briefing_versions (briefing_id, version, snapshot, change_summary, warnings)
select b.id, 1, b.briefing_data, 'Importado da planilha Briefing Fábrica (linhas 9 a 46) como rascunho: negrito em <b>, quebras em <br>, lista em •.', ${json(warnings)}
from public.dynamic_email_briefings b
where b.id in (${rows.map((item) => `${tag(item.id)}::uuid`).join(', ')})
on conflict (briefing_id, version) do nothing;
`;

const out = join(root, 'supabase/migrations/20261015120000_dynamic_email_topo_dinamico_v13.sql');
writeFileSync(out, sql, 'utf-8');
console.log(`${out}\n${rows.length} briefings\nAvisos:\n- ${warnings.join('\n- ') || 'nenhum'}`);
