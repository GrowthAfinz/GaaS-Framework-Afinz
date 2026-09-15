import test from 'node:test';
import assert from 'node:assert/strict';
import {
  editorialNumberFormat,
  evaluateMaturedOutcomes,
  projectSlidesForProfile,
} from '../supabase/functions/report-sync/report-live-engine.ts';
import { buildGenerationRetentionPlan } from '../supabase/functions/report-sync/report-live-generation.ts';
import { archetypeFor, layoutGeometryFor } from '../supabase/functions/_shared/report-live-design.ts';

const slide = (slideCode, index, partner = null) => ({
  run_id: '00000000-0000-0000-0000-000000000001',
  slide_instance_id: `${slideCode.toLowerCase()}_${index}`,
  slide_code: slideCode,
  partner,
  source_view: 'VIEW_TEST',
  implementation_readiness: 'pronto_dado',
  run_eligibility: 'render',
  confidence_status: 'confirmed',
  confidence_label: 'Alta',
  data_coverage: 1,
  cutoff_maturity: 1,
  execution_volume: 100 - index,
  missing_required_fields: [],
  fallback_applied: null,
  evidence: {},
});

const codes = [
  'C0', 'C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8',
  ...Array.from({ length: 5 }, () => ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7']).flat(),
  'M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7',
  'B1', 'B2', 'B3', 'K-SEG', 'K-TPL', 'K-EXP', 'K-QLT',
  'A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7',
];
const slides = codes.map((code, index) => slide(code, index, code.startsWith('P') ? `Parceiro ${Math.floor(index / 7)}` : null));

test('monthly and deep-dive profiles are deterministic projections of one artifact', () => {
  const monthly = projectSlidesForProfile(slides, 'executivo_mensal');
  const monthlyAlias = projectSlidesForProfile(slides, 'monthly_report');
  const deepDive = projectSlidesForProfile(slides, 'deep_dive');
  assert.equal(monthly.length, 12);
  assert.equal(deepDive.length, 31);
  assert.deepEqual(monthlyAlias.map((item) => item.slide_instance_id), monthly.map((item) => item.slide_instance_id));
  assert.ok(monthly.some((item) => item.slide_code === 'C7'));
  assert.ok(monthly.some((item) => item.slide_code === 'B1'));
  assert.equal(monthly.filter((item) => item.slide_code.startsWith('P')).length, 4);
  assert.deepEqual({
    core: deepDive.filter((item) => item.slide_code.startsWith('C')).length,
    partner: deepDive.filter((item) => item.slide_code.startsWith('P')).length,
    media: deepDive.filter((item) => item.slide_code.startsWith('M')).length,
    b2c: deepDive.filter((item) => item.slide_code.startsWith('B')).length,
    conditional: deepDive.filter((item) => item.slide_code.startsWith('K-')).length,
    annex: deepDive.filter((item) => item.slide_code.startsWith('A')).length,
  }, { core: 5, partner: 11, media: 5, b2c: 1, conditional: 2, annex: 7 });
  assert.ok(deepDive.every((item) => item.run_eligibility !== 'omitir_bloqueado'));
});

test('editorial chart formats distinguish volumes, currency and rates', () => {
  assert.deepEqual(editorialNumberFormat('volume'), {
    number_format_type: 'NUMBER', number_format_pattern: '#,##0',
  });
  assert.deepEqual(editorialNumberFormat('currency'), {
    number_format_type: 'CURRENCY', number_format_pattern: 'R$ #,##0.00',
  });
  assert.deepEqual(editorialNumberFormat('rate'), {
    number_format_type: 'PERCENT', number_format_pattern: '0.0%',
  });
});

test('matured outcomes close in all three deterministic states', () => {
  const base = {
    periodStart: '2026-09-01',
    periodEnd: '2026-09-30',
    actionOutcomes: [],
    actionCandidates: [
      { action_candidate_id: '1', review_status: 'approved', expected_value: 0.8, expected_unit: '%', expected_direction: 'maior_melhor', outcome_window_end: '2026-09-30', verification_view: 'VIEW_METRIC', success_metric: 'coverage', created_at: '2026-08-01' },
      { action_candidate_id: '2', review_status: 'approved', expected_value: 0.1, expected_unit: '%', expected_direction: 'menor_melhor', outcome_window_end: '2026-09-30', verification_view: 'VIEW_PARTNER_ROUTER', success_metric: 'share_cartoes_parceiro_NA', partner: 'N/A', created_at: '2026-08-01' },
      { action_candidate_id: '3', review_status: 'approved', expected_value: 1, expected_unit: 'conv.', expected_direction: 'maior_melhor', outcome_window_end: '2026-09-30', verification_view: 'VIEW_MISSING', success_metric: 'conversions', created_at: '2026-08-01' },
    ],
  };
  const tabs = {
    VIEW_METRIC: [['coverage'], [0.85]],
    VIEW_PARTNER_ROUTER: [['partner', 'card_share'], ['N/A', 0.2]],
  };
  const outcomes = evaluateMaturedOutcomes(base, tabs);
  assert.deepEqual(outcomes.map((item) => item.outcome_status), [
    'confirmado', 'nao_confirmado', 'premissa_invalida',
  ]);
  assert.equal(outcomes[2].observed_value, null);
});

test('retention preserves the live and previous generation and only selects known superseded releases', () => {
  const publications = [
    { publication_id: 'p4', run_id: 'r4', release_key: 'live', status: 'published', publication_version: 4 },
    { publication_id: 'p3', run_id: 'r3', release_key: 'previous', status: 'superseded', publication_version: 3 },
    { publication_id: 'p2', run_id: 'r2', release_key: 'old', status: 'superseded', publication_version: 2 },
    { publication_id: 'p1', run_id: 'r1', release_key: 'rolled', status: 'rolled_back', publication_version: 1 },
  ];
  const plan = buildGenerationRetentionPlan(publications, 'p4', 2);
  assert.deepEqual(plan.retained_release_keys, ['live', 'previous']);
  assert.deepEqual(plan.deletable.map((item) => item.release_key), ['old', 'rolled']);
  assert.equal(plan.immutable_artifacts_preserved, true);
});

test('every editorial archetype stays inside the 720 x 405 point canvas', () => {
  const archetypes = new Set(codes.map(archetypeFor));
  assert.ok(archetypes.size >= 10);
  for (const archetype of archetypes) {
    const geometry = layoutGeometryFor(archetype, false);
    for (const box of [geometry.visual, geometry.narrative]) {
      assert.ok(box.x >= 0 && box.y >= 0, archetype);
      assert.ok(box.x + box.width <= 720, archetype);
      assert.ok(box.y + box.height <= 371, archetype);
    }
    const overlapX = Math.max(0, Math.min(geometry.visual.x + geometry.visual.width, geometry.narrative.x + geometry.narrative.width) - Math.max(geometry.visual.x, geometry.narrative.x));
    const overlapY = Math.max(0, Math.min(geometry.visual.y + geometry.visual.height, geometry.narrative.y + geometry.narrative.height) - Math.max(geometry.visual.y, geometry.narrative.y));
    assert.equal(overlapX * overlapY, 0, archetype);
  }
});
