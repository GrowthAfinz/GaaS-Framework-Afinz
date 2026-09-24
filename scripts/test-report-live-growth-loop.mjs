import test from 'node:test';
import assert from 'node:assert/strict';
import { buildReport } from '../supabase/functions/report-sync/report-live-engine.ts';
import {
  freezeEditorialGrowthSources,
  selectEditorialGrowthBets,
  selectEditorialGrowthLearnings,
  selectEditorialGrowthOutcomes,
} from '../supabase/functions/report-sync/report-live-growth-loop.ts';

const records = (table) => table.slice(1).map((row) =>
  Object.fromEntries(table[0].map((key, index) => [key, row[index]]))
);

const bet = {
  id: 'bet-1',
  front: 'crm_acquisition',
  team_scope: 'CRM Aquisição',
  status: 'approved',
  hypothesis: 'Se a fonte voltar a D-1, decisões operacionais deixam de usar dado vencido.',
  action_text: 'Restabelecer a ingestão diária.',
  metric_name: 'defasagem da fonte',
  baseline_value: 9,
  expected_value: 1,
  expected_direction: 'menor_melhor',
  expected_unit: 'dias',
  success_criterion: 'Fonte em D-1 sem novas duplicidades.',
  execution_due_at: '2026-09-25T12:00:00Z',
  outcome_window_start: '2026-09-24',
  outcome_window_end: '2026-09-30',
  evidence_period_start: '2026-09-01',
  evidence_period_end: '2026-09-30',
  source_confidence_status: 'user_confirmed',
  last_execution_status: 'not_started',
  updated_at: '2026-09-24T12:00:00Z',
};

const outcome = {
  outcome_id: 'outcome-1',
  bet_id: 'bet-1',
  front: 'crm_acquisition',
  hypothesis: bet.hypothesis,
  metric_name: bet.metric_name,
  baseline_value: 9,
  expected_value: 1,
  observed_value: 1,
  observed_unit: 'dias',
  system_verdict: 'confirmed',
  review_status: 'confirmed_by_user',
  resolved_verdict: 'confirmed',
  due_bucket: 'reviewed',
  conclusion: 'A fonte voltou a D-1.',
  outcome_window_start: '2026-09-24',
  outcome_window_end: '2026-09-30',
  evaluated_at: '2026-09-30T12:00:00Z',
  reviewed_at: '2026-09-30T13:00:00Z',
};

const learning = {
  id: 'learning-1',
  source_kind: 'vault_curated',
  source_title: 'Ausência não é zero',
  source_ref: 'vault/teste.md',
  front: 'crm_acquisition',
  classification: 'confirmed',
  lifecycle_status: 'active',
  statement: 'Uma fonte atrasada bloqueia leitura; não representa produção zero.',
  confidence_status: 'confirmed',
  valid_from: '2026-09-01',
  review_at: '2026-12-01',
  valid_until: null,
  validated_by_loop: false,
  review_due: false,
  reused_count: 0,
  updated_at: '2026-09-20T12:00:00Z',
};

test('editorial selectors keep material objects in the report period', () => {
  assert.deepEqual(selectEditorialGrowthBets([bet], '2026-09-01', '2026-09-30').map((row) => row.id), ['bet-1']);
  assert.deepEqual(selectEditorialGrowthOutcomes([outcome], '2026-09-01', '2026-09-30').map((row) => row.outcome_id), ['outcome-1']);
  assert.deepEqual(selectEditorialGrowthLearnings([learning], '2026-09-01', '2026-09-30').map((row) => row.id), ['learning-1']);
});

test('scheduled bets without an outcome never become retrospective evidence', () => {
  const scheduled = { ...outcome, outcome_id: null, due_bucket: 'scheduled', evaluated_at: null };
  assert.deepEqual(selectEditorialGrowthOutcomes([scheduled], '2026-09-01', '2026-09-30'), []);
});

test('direct and durable builds freeze the same Growth source scope without actor ids', () => {
  const sources = freezeEditorialGrowthSources({
    bets: [{ ...bet, created_by: 'actor' }, { ...bet, id: 'closed', status: 'closed' }],
    outcomes: [{ ...outcome, reviewed_by: 'actor' }, { ...outcome, outcome_id: null }],
    learnings: [{ ...learning, created_by: 'vault-curator' }],
  });
  assert.deepEqual(sources.bets.map((row) => row.id), ['bet-1']);
  assert.equal('created_by' in sources.bets[0], false);
  assert.deepEqual(sources.outcomes.map((row) => row.outcome_id), ['outcome-1']);
  assert.equal('reviewed_by' in sources.outcomes[0], false);
  assert.equal('created_by' in sources.learnings[0], false);
});

test('C7 distinguishes outcomes from curated memory and C8 distinguishes bets from candidates', () => {
  const contract = (slide_code, source_view, required_fields) => ({
    slide_code,
    section: 'core',
    title: slide_code,
    audience: 'executivo',
    source_view,
    required_fields,
    optional_fields: [],
    fallback_view: null,
    implementation_readiness: 'pronto_dado',
    conditional: false,
    display_order: slide_code === 'C7' ? 7 : 8,
    active: true,
  });
  const input = {
    runId: '11111111-1111-4111-8111-111111111111',
    profile: 'test',
    periodStart: '2026-09-01',
    periodEnd: '2026-09-30',
    manifest: {
      period_start: '2026-09-01', period_end: '2026-09-30',
      source_cutoffs: { crm: '2026-09-30', media: '2026-09-30', b2c: '2026-09-30' },
      data_reading_integrated: '2026-09-30', gap_closure_days: 0,
      quality_status: 'confirmed', field_coverage: { crm_template: 1 }, comparability: {},
    },
    crm: [{
      'Data de Disparo': '2026-09-01', BU: 'B2C', Parceiro: 'Serasa',
      parceiro_canonico: 'Serasa', parceiro_canonico_motivo: 'EXPLICIT_PARTNER',
      parceiro_canonico_confianca: 'alta', 'Base Acionável': 100,
      'Cartões Gerados': 10, 'Custo Total Campanha': 100, template_id: 't1',
    }],
    media: [], mediaActions: [], eventMap: [], b2c: [], goals: [], budgets: [], targets: [],
    collectionRuns: [], collectionLogs: [], experiments: [], insurance: [],
    communicationSlots: [], communicationTemplates: [], aliases: [],
    actionCandidates: [], actionOutcomes: [], metricCertifications: [], monthlyAcquisition: [],
    growthBets: [bet], growthOutcomes: [outcome], growthLearnings: [learning],
    slideContracts: [
      contract('C7', 'VIEW_GROWTH_LEARNING_RETROSPECTIVE', ['cycle_records']),
      contract('C8', 'VIEW_ACTION_QUEUE', ['action_candidates']),
    ],
    config: { quality: { minimum_execution_rows: 1, minimum_field_coverage: 0.1 } },
  };

  const built = buildReport(input);
  const retrospective = records(built.tabs.VIEW_GROWTH_LEARNING_RETROSPECTIVE);
  assert.deepEqual(retrospective.map((row) => row.record_type), ['outcome', 'memoria_curada']);
  assert.match(retrospective[1].decision, /não equivale a validação causal/i);

  const queue = records(built.tabs.VIEW_ACTION_QUEUE);
  assert.equal(queue[0].editorial_origin, 'growth_bet');
  assert.match(queue[0].reading_limit, /ainda não constitui prova causal/i);
  assert.ok(built.slides.every((slide) => slide.implementation_readiness === 'pronto_dado'));
  assert.ok(built.slides.every((slide) => slide.run_eligibility === 'render'));
});
