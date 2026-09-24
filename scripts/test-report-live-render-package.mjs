import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import {
  buildReportRenderPackage,
  REPORT_LIVE_COVERAGE_BASELINE,
  tableToRenderDataset,
  validateReportRenderPackage,
} from '../supabase/functions/report-sync/report-live-render-package.ts';

const ROOT = process.cwd();
const FIXTURE_DIR = path.join(ROOT, 'docs', 'plans', 'report-live-async', 'fixtures');
const readJson = async (name) => JSON.parse(await readFile(path.join(FIXTURE_DIR, name), 'utf8'));

test('the formal schema and fixtures cover all twelve renderer archetypes', async () => {
  const schema = JSON.parse(await readFile(path.join(ROOT, 'docs', 'plans', 'report-live-async', 'report-render-package.schema.json'), 'utf8'));
  assert.equal(schema.properties.schema_version.const, '1.0');
  assert.deepEqual(schema.allOf[0].then.properties.coverage_accounting, { type: 'array', minItems: 57, maxItems: 57 });
  const expected = new Set(schema.$defs.visual.properties.archetype.enum);
  assert.equal(expected.size, 12);

  const fixtures = await Promise.all([
    readJson('archetypes-core.fixture.json'),
    readJson('archetypes-charts.fixture.json'),
    readJson('archetypes-operations.fixture.json'),
  ]);
  const observed = new Set(fixtures.flatMap((pkg) => pkg.slides.map((slide) => slide.archetype)));
  assert.deepEqual(observed, expected);
  for (const fixture of fixtures) assert.deepEqual(validateReportRenderPackage(fixture), []);
});

test('the August golden is a structural 57-page baseline, not a renderable data artifact', async () => {
  const golden = await readJson('august-2026-baseline-57.coverage.json');
  assert.equal(golden.renderable, false);
  assert.equal(golden.run_id, REPORT_LIVE_COVERAGE_BASELINE.run_id);
  assert.equal(golden.publication_id, REPORT_LIVE_COVERAGE_BASELINE.publication_id);
  assert.equal(golden.published_slide_count, 57);
  assert.equal(golden.slides.length, 57);
  assert.deepEqual(golden.slides.map((slide) => slide.baseline_page), Array.from({ length: 57 }, (_, index) => index + 1));
  const visa = golden.slides.find((slide) => slide.slide_code === 'K-VISA');
  assert.equal(visa.baseline_page, 47);
  assert.equal(visa.historical_only, true);
  assert.equal(visa.historical_status, 'retired_after_publication');
});

const slide = (id, code, eligibility, sourceView) => ({
  run_id: 'fixture-adapter',
  slide_instance_id: id,
  slide_code: code,
  partner: null,
  source_view: sourceView,
  implementation_readiness: 'pronto_dado',
  run_eligibility: eligibility,
  confidence_status: eligibility === 'render_com_limites' ? 'suspect' : 'confirmed',
  confidence_label: eligibility === 'render_com_limites' ? 'Baixa' : 'Alta',
  data_coverage: 1,
  cutoff_maturity: 1,
  execution_volume: 1,
  missing_required_fields: [],
  fallback_applied: null,
  evidence: { fixture: true },
});

test('the adapter emits every eligible slide once and preserves missing versus observed zero', () => {
  const slides = [
    slide('c0', 'C0', 'render', 'VIEW_RUN_MANIFEST'),
    slide('c2', 'C2', 'render_com_limites', 'VIEW_QUALITY'),
    slide('c4', 'C4', 'render', 'VIEW_PACING'),
    slide('k-exp', 'K-EXP', 'omitir_bloqueado', 'VIEW_EXPERIMENTS'),
  ];
  const tabs = {
    VIEW_RUN_MANIFEST: [['metric', 'value'], ['observed zero', 0], ['missing', null]],
    VIEW_QUALITY: [['source', 'status'], ['crm', 'available']],
    VIEW_PACING: [['day', 'cards'], [1, 10], [2, 20]],
    VIEW_EXPERIMENTS: [['experiment'], ['must not render']],
    VIEW_EDITORIAL_LAYOUTS: [
      ['slide_instance_id', 'expected_chart', 'layout'],
      ['c4', true, 'pacing_isodays'],
    ],
    VIEW_EDITORIAL_RULERS: [
      ['slide_instance_id', 'metric_key', 'value'],
      ['c4', 'cartoes', 20],
    ],
    VIEW_EDITORIAL_CHART_REGISTRY: [
      ['slide_instance_id', 'chart_key', 'family_view', 'chart_type', 'title', 'start_row_index', 'end_row_index', 'domain_column_index', 'domain_title', 'left_axis_title', 'right_axis_title', 'series_json'],
      ['c4', 'c4', 'VIEW_EDITORIAL_PACING_CHARTS', 'LINE', 'Cartões acumulados', 0, 3, 0, 'Dia', 'Cartões', '', JSON.stringify([{ column_index: 1, label: 'Realizado', axis: 'LEFT_AXIS', color: '#00C6CC', number_format_type: 'NUMBER', number_format_pattern: '#,##0' }])],
    ],
    VIEW_EDITORIAL_PACING_CHARTS: [['dia', 'Realizado'], [1, 10], [2, 20]],
  };
  const contracts = [
    ['C0', 'core', 'Capa', 'VIEW_RUN_MANIFEST'],
    ['C2', 'core', 'Qualidade', 'VIEW_QUALITY'],
    ['C4', 'core', 'Pacing', 'VIEW_PACING'],
    ['K-EXP', 'conditional', 'Experimentos', 'VIEW_EXPERIMENTS'],
  ].map(([slide_code, section, title, source_view], index) => ({
    slide_code, section, title, source_view, audience: 'fixture', required_fields: [], optional_fields: [],
    fallback_view: null, implementation_readiness: 'pronto_dado', conditional: slide_code.startsWith('K-'), display_order: index + 1,
  }));
  const blueprints = slides.map((item) => ({
    slide_instance_id: item.slide_instance_id,
    slide_code: item.slide_code,
    renderer_version: 'fixture',
    archetype: 'fixture',
    density: 'standard',
    data_hash: item.slide_instance_id.padEnd(64, '0'),
    narrative_hash: '1'.repeat(64), visual_hash: '2'.repeat(64), blueprint_hash: '3'.repeat(64), blueprint: {},
  }));
  const pkg = buildReportRenderPackage({
    built: { tabs, slides, actionCandidates: [], evaluatedOutcomes: [], partnerModes: [], previousPeriod: { start: '2026-07-01', end: '2026-07-31' }, fieldCoverage: [] },
    inputs: {
      runId: 'fixture-adapter', profile: 'fixture', periodStart: '2026-08-01', periodEnd: '2026-08-31',
      manifest: { period_start: '2026-08-01', period_end: '2026-08-31', source_cutoffs: { crm: '2026-08-31' }, data_reading_integrated: null, gap_closure_days: null, quality_status: 'suspect', field_coverage: {}, comparability: {} },
      crm: [], media: [], mediaActions: [], b2c: [], goals: [], budgets: [], targets: [], collectionRuns: [], collectionLogs: [], experiments: [], insurance: [], communicationSlots: [], communicationTemplates: [], slideContracts: contracts, aliases: [], actionCandidates: [], actionOutcomes: [], metricCertifications: [], config: {},
    },
    blueprints,
    narratives: {
      c0: 'Snapshot sintético do contrato.',
      c2: 'Qualidade sintética com limite explícito.',
      c4: 'Pacing sintético com contrato editorial completo.',
    },
    coverage_accounting: [],
    generated_at: '2026-09-24T12:00:00.000Z',
    versions: { spec: 'fixture', semantic: 'fixture', renderer: 'fixture' },
    package_kind: 'archetype_fixture',
  });

  assert.deepEqual(pkg.slides.map((item) => item.slide_instance_id), ['c0', 'c2', 'c4']);
  assert.equal(pkg.expected_slide_count, 3);
  assert.equal(pkg.period.data_through, '2026-08-31');
  assert.equal(pkg.slides[0].visual.dataset.rows[0][1].state, 'zero_observado');
  assert.equal(pkg.slides[0].visual.dataset.rows[1][1].state, 'missing');
  assert.match(pkg.slides[1].narrative.limitation, /limites registrados/);
  assert.equal(pkg.slides[2].visual.editorial_rulers.length, 1);
  assert.equal(pkg.slides[2].visual.chart_contract.title, 'Cartões acumulados');
  assert.equal(pkg.slides[2].visual.chart_contract.dataset.row_count, 2);
});

test('production validation blocks cardinality drift, silent loss, missing provenance and K-VISA resurrection', async () => {
  const source = await readJson('archetypes-core.fixture.json');
  const baseSlide = structuredClone(source.slides[0]);
  const coverage = Array.from({ length: 57 }, (_, index) => ({
    baseline_page: index + 1,
    baseline_slide_code: index === 46 ? 'K-VISA' : `BASE-${index + 1}`,
    disposition: index === 46 ? 'retire_closed_scope' : 'preserve',
    target_slide_instance_ids: index === 46 ? [] : [baseSlide.slide_instance_id],
    rationale: index === 46 ? 'Escopo encerrado e preservado somente no histórico.' : 'Cobertura mantida no slide de fixture.',
  }));
  const production = { ...source, package_kind: 'production', slides: [baseSlide], expected_slide_count: 1, coverage_accounting: coverage };
  assert.deepEqual(validateReportRenderPackage(production), []);

  const broken = structuredClone(production);
  broken.expected_slide_count = 2;
  broken.coverage_accounting.pop();
  broken.slides[0].provenance.data_hash = '';
  broken.slides[0].slide_code = 'K-VISA';
  const codes = new Set(validateReportRenderPackage(broken).map((issue) => issue.code));
  assert.ok(codes.has('cardinality'));
  assert.ok(codes.has('baseline_cardinality'));
  assert.ok(codes.has('missing_page'));
  assert.ok(codes.has('required'));
  assert.ok(codes.has('retired_scope'));
});

test('table normalization never turns missing into zero', () => {
  const dataset = tableToRenderDataset([['metric'], [null], [0], [12]]);
  assert.deepEqual(dataset.rows.map((row) => row[0]), [
    { value: null, state: 'missing' },
    { value: 0, state: 'zero_observado' },
    { value: 12, state: 'valor_observado' },
  ]);
});
