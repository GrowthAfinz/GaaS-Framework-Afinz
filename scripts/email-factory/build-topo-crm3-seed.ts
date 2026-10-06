/**
 * Gera a migration da régua TOPO DE FUNIL (CRM) 3 a partir do payload validado.
 * Uso: npx vite-node scripts/email-factory/build-topo-crm3-seed.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { PLURIX_V12_TEMPLATE, PLURIX_V12_TEMPLATE_ID, PLURIX_V12_TEMPLATE_NAME } from '../../src/modules/dynamic-email/fixtures/plurixV12Template';
import { importSourceFor, validateImportPayload } from '../../src/modules/dynamic-email/domain/xlsxImport';
import { BRIEFING_COLUMNS } from '../../src/modules/dynamic-email/domain/briefing';

const root = join(__dirname, '../..');
const payload = JSON.parse(readFileSync(join(root, 'docs/email-factory/examples/topo-crm3-import-payload.json'), 'utf-8'));
const { payload: valid, rows, problems } = validateImportPayload(payload);
const errors = problems.filter((problem) => problem.severity === 'error');
if (!valid || errors.length) throw new Error(`Payload inválido:\n${errors.map((e) => `${e.where}: ${e.message}`).join('\n')}`);

const RULER_ID = 'c3c30000-0000-4000-8000-000000000001';
const GROUP: Record<string, string> = { 'E-mail 1': 'c3c30000-0000-4000-8000-0000000000e1', 'E-mail 2': 'c3c30000-0000-4000-8000-0000000000e2' };
const LABELS: Record<string, string> = { AMIGAO: 'Amigão', BOA: 'Boa Supermercados', AVENIDA: 'Supermercados Avenida', 'COMPRE MAIS': 'Compre Mais', PARANA: 'Paraná', SUPERPAO: 'Superpão' };
const ORDER = ['AMIGAO', 'AVENIDA', 'BOA', 'COMPRE MAIS', 'PARANA', 'SUPERPAO'];
const IMPORTED_AT = '2026-10-06T21:00:00-03:00';
const tag = (s: string) => `$gaas$${s}$gaas$`;
const json = (value: unknown) => `${tag(JSON.stringify(value))}::jsonb`;

const VALIDATION = {
  date: '2026-10-06', template: 'builtin-plurix-v11', by: 'Pablo (operação)',
  scope: 'Jornada restrita ao próprio contato: E-mail 1 e E-mail 2 recebidos pelo mesmo motor V11.',
  certifies_this_version: false,
  note: 'Validação histórica do conteúdo CRM E1/E2 de origem. A V12 (faixa vinda do briefing) ainda não teve Test Send.',
};

const briefingSql = rows.map((item) => {
  const index = ORDER.indexOf(item.network) + 1 + (item.sequence === 'E-mail 2' ? 10 : 0);
  const id = `c3c30000-0000-4000-8000-0000000001${String(index).padStart(2, '0')}`;
  const data = Object.fromEntries([['__id', id], ...BRIEFING_COLUMNS.map((column) => [column, item.row[column] ?? ''])]);
  const activity = `PLURIX_CRM_${item.network.replace(' ', '_')}_EMAIL${item.sequence.slice(-1)}_SEMANA1_20260817`;
  const source = importSourceFor(valid, item, IMPORTED_AT);
  return { id, data, sql: `(${tag(id)}::uuid, ${json(data)}, 'Plurix', ${tag(valid.ruler.segment)}, ${tag(LABELS[item.network])}, ${tag(item.weekKey)}, array[${tag(activity)}], ${tag(GROUP[item.sequence])}::uuid, 'draft', 1, ${tag(PLURIX_V12_TEMPLATE_ID)}, false, ${json(source)})` };
});

const strategySql = valid.touches.map((touch) => {
  const amigao = rows.find((row) => row.sequence === touch.sequence && row.network === 'AMIGAO')!;
  return `(${tag(RULER_ID)}::uuid, ${tag(GROUP[touch.sequence])}::uuid, 'Plurix', ${tag(valid.ruler.segment)}, ${tag(touch.weekKey)}, ${tag(touch.sequence)}, ${tag(amigao.row.ASSUNTO)}, ${tag(amigao.row.PRE_CABECALHO)}, ${tag(touch.sequence === 'E-mail 1' ? 'Apresentação do cartão +amigo com limite pré-aprovado' : 'Reforço de benefícios com limite pré-aprovado')}, 'draft', 'draft', 'needs_review', 'not_tested', ${json({ import: { contract: valid.contract, file: valid.source.file, sheet: valid.source.sheet, readAt: valid.source.readAt }, validation_history: [VALIDATION], pendencies: valid.pendencies.filter((p) => p.scope.includes(touch.sequence) || !p.scope.startsWith('E-mail')) })}, 'llm', 'llm', 'Importação do XLSX editorial TOPO DE FUNIL (CRM) 3 como rascunho enriquecido', ${tag(valid.source.reader)}, ${tag(`TOPO CRM 3 · ${touch.sequence}`)})`;
});

const sql = `-- TOPO DE FUNIL (CRM) 3: dois toques Plurix com a mensagem de limite no briefing.
-- Gerado por scripts/email-factory/build-topo-crm3-seed.ts a partir de
-- docs/email-factory/examples/topo-crm3-import-payload.json. Idempotente.
--
-- 1. import_source: guarda a base da última importação para a reimportação não sobrescrever
--    edições feitas no GaaS. Coluna nova e anulável: linhas antigas seguem sem ela.
-- 2. Template candidato PLURIX V12 com a fonte completa (nada de placeholder).
-- 3. Régua, dois planos de e-mail e 12 rascunhos (2 toques x 6 redes), com versão 1 no histórico.
-- MENSAGEM_LIMITE vive dentro de briefing_data (jsonb); não exige DDL nos briefings.

alter table public.dynamic_email_briefings add column if not exists import_source jsonb;
comment on column public.dynamic_email_briefings.import_source is
  'Contrato fabrica-xlsx-import/1: chave estável, arquivo/aba de origem, base da planilha e origem de cada campo.';
create unique index if not exists dynamic_email_briefings_import_key_idx
  on public.dynamic_email_briefings ((import_source->>'importKey'))
  where import_source is not null and status <> 'archived';

insert into public.dynamic_email_template_slots (id, name, source, is_principal, status, version)
values (${tag(PLURIX_V12_TEMPLATE_ID)}, ${tag(PLURIX_V12_TEMPLATE_NAME)}, ${tag(PLURIX_V12_TEMPLATE)}, false, 'active', 1)
on conflict (id) do update set name = excluded.name, source = excluded.source, updated_at = now();

insert into public.dynamic_email_ruler_strategies (id, name, description, partner, product, segment, objective, audience, journey_stage, business_front, ruler_family, journey_family, journey_type, editorial_status, template_slot_id, version)
values (${tag(RULER_ID)}::uuid, ${tag(valid.ruler.name)},
  ${tag('Dois toques Plurix (E-mail 1 e E-mail 2) no motor único com sequência atual. Conteúdo clonado dos briefings CRM testados com a V11 em 06/10/2026, com a faixa de limite escrita por e-mail (MENSAGEM_LIMITE) e sem o nome repetido no corpo. Exporta TP_CAMPANHA = CRM: no SFMC substitui as linhas CRM E1/E2.')},
  'Plurix', ${tag(valid.ruler.product)}, ${tag(valid.ruler.segment)},
  'Levar membros do Clube +amigo a pedir o cartão, destacando o limite pré-aprovado de quem tem.',
  'Membros do Clube +amigo das 6 redes Plurix na COMUNICACAO_PLX; faixa de limite só para LIMITE_CRD positivo.',
  'Topo de funil', 'acquisition', 'top_of_funnel', 'Aquisição', 'Topo de Funil', 'draft', ${tag(PLURIX_V12_TEMPLATE_ID)}, 1)
on conflict (id) do nothing;

insert into public.dynamic_email_email_strategies (ruler_strategy_id, campaign_group_id, partner, segment, week_key, sequence, subject, preheader, role_in_ruler, technical_status, editorial_status, visual_status, certification_status, field_provenance, updated_by_type, update_source, change_reason, llm_model, functional_name)
values
${strategySql.join(',\n')}
on conflict (campaign_group_id) do nothing;

insert into public.dynamic_email_briefings (id, briefing_data, partner, segment, subgroup, week_key, activity_names, campaign_group_id, status, version, template_slot_id, journey_confirmed, import_source)
values
${briefingSql.map((item) => item.sql).join(',\n')}
on conflict (id) do nothing;

insert into public.dynamic_email_briefing_versions (briefing_id, version, snapshot, change_summary, warnings)
select b.id, 1, b.briefing_data, 'Importado do XLSX editorial (TOPO CRM 3) como rascunho enriquecido; origem por campo em import_source.', '[]'::jsonb
from public.dynamic_email_briefings b
where b.id in (${briefingSql.map((item) => `${tag(item.id)}::uuid`).join(', ')})
on conflict (briefing_id, version) do nothing;
`;

const out = join(root, 'supabase/migrations/20261006210000_dynamic_email_topo_crm3_limit_message.sql');
writeFileSync(out, sql, 'utf-8');
console.log(`${out}\n${rows.length} briefings, ${problems.length} avisos/pendências`);
