import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import Papa from 'papaparse';
import {
  REPORT_LIVE_COVERAGE_BASELINE,
  tableToRenderDataset,
  validateReportRenderPackage,
} from '../supabase/functions/report-sync/report-live-render-package.ts';
import {
  archetypeFor,
  layoutGeometryFor,
  minimumBodySize,
} from '../supabase/functions/_shared/report-live-design.ts';

const ROOT = process.cwd();
const FIXTURE_DIR = path.join(ROOT, 'docs', 'plans', 'report-live-async', 'fixtures');
const INVENTORY_PATH = path.join(ROOT, 'docs', 'plans', 'inventario_slides.csv');
const GOLDEN_PATH = path.join(FIXTURE_DIR, 'august-2026-baseline-57.coverage.json');
const CHECK = process.argv.includes('--check');

const stableJson = (value) => `${JSON.stringify(value, null, 2)}\n`;

async function persist(targetPath, value) {
  const next = stableJson(value);
  if (CHECK) {
    const current = await readFile(targetPath, 'utf8');
    assert.equal(current, next, `${path.relative(ROOT, targetPath)} está desatualizado; rode o gerador.`);
    return;
  }
  await mkdir(path.dirname(targetPath), { recursive: true });
  await writeFile(targetPath, next, 'utf8');
}

function partnerSlug(sourceView) {
  const match = /^VP_(BEM_BARATO|PROPRIETARIA|SERASA|PLURIX|DIA)_/.exec(sourceView);
  return match?.[1]?.toLowerCase() ?? null;
}

function historicalSlideInstanceId(row) {
  const base = row.codigo.toLowerCase();
  const partner = partnerSlug(row.view_origem);
  return partner ? `${base}_${partner}` : base;
}

async function buildCoverageBaseline() {
  const csv = await readFile(INVENTORY_PATH, 'utf8');
  const parsed = Papa.parse(csv, { header: true, skipEmptyLines: true });
  if (parsed.errors.length) throw new Error(parsed.errors.map((item) => item.message).join('; '));
  assert.equal(parsed.data.length, 57, 'O inventário histórico precisa ter 57 páginas.');

  return {
    schema_version: '1.0',
    manifest_kind: 'historical_coverage_baseline',
    renderable: false,
    run_id: REPORT_LIVE_COVERAGE_BASELINE.run_id,
    publication_id: REPORT_LIVE_COVERAGE_BASELINE.publication_id,
    period: { start: '2026-08-01', end: '2026-08-31' },
    published_slide_count: 57,
    artifact_path: 'runs/9bb55892-4b17-4f76-825a-0ac97c92b525/blueprints/report-build.json',
    pdf_path: 'runs/9bb55892-4b17-4f76-825a-0ac97c92b525/publications/54649269-7cce-460a-a87d-b4cc5f310a62-generation-selected-v6.pdf',
    evidence_scope: 'Estrutura e procedência. Não contém as linhas do artefato e não pode ser renderizado como report operacional.',
    slides: parsed.data.map((row) => ({
      baseline_page: Number(row.numero),
      historical_slide_instance_id: historicalSlideInstanceId(row),
      slide_code: row.codigo,
      section: row.secao,
      archetype: row.arquetipo,
      source_view: row.view_origem,
      title: row.titulo,
      element_count: Number(row.num_elementos),
      chart_count: Number(row.num_graficos),
      confidence_badge: row.badge_confianca,
      inspection_status: row.marcacao,
      historical_status: row.codigo === 'K-VISA' ? 'retired_after_publication' : 'active_at_publication',
      historical_only: row.codigo === 'K-VISA',
      provenance: row.procedencia,
    })),
  };
}

const fixtureGroups = {
  'archetypes-core.fixture.json': [
    ['C0', 'Capa e contrato'],
    ['C1', 'Leitura executiva'],
    ['C2', 'Integridade e cobertura'],
    ['C3', 'Scorecard'],
  ],
  'archetypes-charts.fixture.json': [
    ['C4', 'Série temporal'],
    ['C5', 'Ranking'],
    ['C6', 'Dispersão'],
    ['P4', 'Funil'],
    ['P3', 'Mapa de calor'],
  ],
  'archetypes-operations.fixture.json': [
    ['C7', 'Tabela analítica'],
    ['C8', 'Fila de ação'],
    ['A2', 'Anexo técnico'],
  ],
};

const sectionFor = (code) => {
  if (code.startsWith('P')) return 'partner';
  if (code.startsWith('A')) return 'annex';
  return 'core';
};

function sha256(value) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function fixturePackage(filename, cases) {
  const sourceCutoffs = { fixture: '2026-08-31' };
  const slides = cases.map(([code, title], index) => {
    const archetype = archetypeFor(code);
    const sourceView = `FIXTURE_${code.replaceAll('-', '_')}`;
    const table = [
      ['label', 'value', 'note'],
      ['Amostra A', 100, 'valor sintético'],
      ['Amostra B', 0, 'zero observado sintético'],
      ['Amostra sem leitura', null, 'missing sintético'],
    ];
    const dataset = tableToRenderDataset(table);
    return {
      slide_instance_id: `fixture_${code.toLowerCase().replaceAll('-', '_')}`,
      slide_code: code,
      display_order: index + 1,
      section: sectionFor(code),
      archetype,
      title: `[FIXTURE] ${title}`,
      subtitle: 'Dados exclusivamente sintéticos para teste visual',
      partner: code.startsWith('P') ? 'Parceiro sintético' : null,
      audience: 'teste_de_renderer',
      eligibility: 'render_com_limites',
      confidence: 'suspect',
      narrative: {
        takeaway: 'Fixture visual: não representa resultado de negócio.',
        evidence: ['100 = valor sintético', '0 = zero observado', 'null = missing'],
        action: null,
        limitation: 'Uso exclusivo em testes automatizados e QA de layout.',
      },
      visual: {
        archetype,
        geometry: layoutGeometryFor(archetype, ['P4', 'C4'].includes(code)),
        minimum_body_pt: minimumBodySize(code.startsWith('A') ? 'annex' : 'body'),
        dataset,
        editorial_layout: null,
        editorial_rulers: [],
        chart_contract: null,
      },
      provenance: {
        source_view: sourceView,
        evidence_refs: [`fixture:${filename}:${code}`],
        window_label: 'fixture 2026-08-01 a 2026-08-31',
        source_cutoffs: sourceCutoffs,
        data_hash: sha256(dataset),
      },
    };
  });

  const pkg = {
    schema_version: '1.0',
    package_kind: 'archetype_fixture',
    run_id: `fixture-${filename.replace('.fixture.json', '')}`,
    profile: 'fixture_only_non_operational',
    expected_slide_count: slides.length,
    coverage_baseline: REPORT_LIVE_COVERAGE_BASELINE,
    coverage_accounting: [],
    period: { start: '2026-08-01', end: '2026-08-31', data_through: '2026-08-31' },
    publication: {
      generated_at: '2026-09-24T12:00:00.000Z',
      spec_version: 'fixture-1',
      semantic_version: 'fixture-1',
      renderer_version: 'python-pptx-candidate',
    },
    source_cutoffs: sourceCutoffs,
    quality_status: 'suspect',
    slides,
  };
  assert.deepEqual(validateReportRenderPackage(pkg), []);
  return pkg;
}

await persist(GOLDEN_PATH, await buildCoverageBaseline());
for (const [filename, cases] of Object.entries(fixtureGroups)) {
  await persist(path.join(FIXTURE_DIR, filename), fixturePackage(filename, cases));
}

console.log(`${CHECK ? 'Checked' : 'Generated'} 1 baseline + ${Object.keys(fixtureGroups).length} renderer fixtures.`);
