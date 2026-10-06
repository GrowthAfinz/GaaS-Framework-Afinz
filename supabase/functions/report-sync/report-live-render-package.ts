import type {
  BuiltReport,
  DataState,
  ReportInputs,
  SlideContract,
  SlideRun,
} from "./report-live-engine.ts";
import type { SlideBlueprint } from "./report-live-versioning.ts";
import {
  archetypeFor,
  layoutGeometryFor,
  minimumBodySize,
  type SlideArchetype,
} from "../_shared/report-live-design.ts";

export const REPORT_RENDER_PACKAGE_SCHEMA_VERSION = "1.0" as const;
export const REPORT_LIVE_COVERAGE_BASELINE = {
  run_id: "9bb55892-4b17-4f76-825a-0ac97c92b525",
  publication_id: "54649269-7cce-460a-a87d-b4cc5f310a62",
  slide_count: 57,
  coverage_map_path: "docs/plans/report-live-async/SLIDE_COVERAGE_MAP.csv",
} as const;

export type RenderPackageKind = "production" | "archetype_fixture";
export type RenderSection = "core" | "partner" | "media" | "b2c" | "conditional" | "annex";
export type CoverageDisposition =
  | "preserve"
  | "merge"
  | "omit_no_data"
  | "retire_closed_scope"
  | "retain_as_quality_status";

export type RenderPrimitive = string | number | boolean | null;

export interface RenderCell {
  value: RenderPrimitive;
  state: DataState;
}

export interface RenderDataset {
  columns: string[];
  rows: RenderCell[][];
  row_count: number;
}

export type RenderMetadataRow = Record<string, RenderPrimitive>;

export interface RenderChartContract {
  chart_key: string;
  family_view: string;
  chart_type: string;
  title: string;
  domain_column_index: number;
  domain_title: string;
  left_axis_title: string;
  right_axis_title: string;
  series: RenderMetadataRow[];
  dataset: RenderDataset;
}

export interface RenderNarrative {
  takeaway: string;
  evidence: string[];
  action: string | null;
  limitation: string;
}

export interface RenderVisual {
  archetype: SlideArchetype;
  geometry: ReturnType<typeof layoutGeometryFor>;
  minimum_body_pt: number;
  dataset: RenderDataset;
  editorial_layout: RenderMetadataRow | null;
  editorial_rulers: RenderMetadataRow[];
  chart_contract: RenderChartContract | null;
}

export interface RenderProvenance {
  source_view: string | null;
  evidence_refs: string[];
  window_label: string;
  source_cutoffs: Record<string, string | null>;
  data_hash: string;
}

export interface RenderSlide {
  slide_instance_id: string;
  slide_code: string;
  display_order: number;
  section: RenderSection;
  archetype: SlideArchetype;
  title: string;
  subtitle: string | null;
  partner: string | null;
  audience: string;
  eligibility: "render" | "render_com_limites";
  confidence: "confirmed" | "directional" | "suspect" | "blocked";
  narrative: RenderNarrative;
  visual: RenderVisual;
  provenance: RenderProvenance;
}

export interface CoverageAccountingEntry {
  baseline_page: number;
  baseline_slide_code: string;
  disposition: CoverageDisposition;
  target_slide_instance_ids: string[];
  rationale: string;
}

export interface ReportRenderPackage {
  schema_version: typeof REPORT_RENDER_PACKAGE_SCHEMA_VERSION;
  package_kind: RenderPackageKind;
  run_id: string;
  profile: string;
  expected_slide_count: number;
  coverage_baseline: typeof REPORT_LIVE_COVERAGE_BASELINE;
  coverage_accounting: CoverageAccountingEntry[];
  period: { start: string; end: string; data_through: string | null };
  publication: {
    generated_at: string;
    spec_version: string;
    semantic_version: string;
    renderer_version: string;
  };
  source_cutoffs: Record<string, string | null>;
  quality_status: "confirmed" | "directional" | "suspect" | "blocked";
  slides: RenderSlide[];
}

export interface ReportRenderPackageAdapterInput {
  built: BuiltReport;
  inputs: ReportInputs;
  blueprints: SlideBlueprint[];
  narratives: Record<string, RenderNarrative | string>;
  coverage_accounting: CoverageAccountingEntry[];
  generated_at: string;
  versions: {
    spec: string;
    semantic: string;
    renderer: string;
  };
  package_kind?: RenderPackageKind;
}

export interface RenderPackageValidationIssue {
  path: string;
  code: string;
  message: string;
}

function normalizeSection(section: string): RenderSection {
  const normalized = section.trim().toLowerCase();
  if (["core", "partner", "media", "b2c", "conditional", "annex"].includes(normalized)) {
    return normalized as RenderSection;
  }
  throw new Error(`Seção editorial inválida: ${section}`);
}

function cellState(value: unknown): DataState {
  if (value === null || value === undefined || value === "") return "missing";
  if (typeof value === "number" && value === 0) return "zero_observado";
  return "valor_observado";
}

function toPrimitive(value: unknown): RenderPrimitive {
  if (value === null || value === undefined) return null;
  if (["string", "number", "boolean"].includes(typeof value)) return value as RenderPrimitive;
  return JSON.stringify(value);
}

export function tableToRenderDataset(table: unknown[][]): RenderDataset {
  const [rawColumns = [], ...rawRows] = table;
  const columns = rawColumns.map((value, index) => {
    const name = String(value ?? "").trim();
    return name || `column_${index + 1}`;
  });
  const rows = rawRows.map((row) => columns.map((_, index) => ({
    value: toPrimitive(row[index]),
    state: cellState(row[index]),
  })));
  return { columns, rows, row_count: rows.length };
}

function tableRecords(table: unknown[][]): RenderMetadataRow[] {
  const [rawColumns = [], ...rows] = table;
  const columns = rawColumns.map((value, index) => String(value ?? "").trim() || `column_${index + 1}`);
  return rows.map((row) => Object.fromEntries(
    columns.map((column, index) => [column, toPrimitive(row[index])]),
  ));
}

function editorialVisualContract(built: BuiltReport, slideInstanceId: string): {
  editorial_layout: RenderMetadataRow | null;
  editorial_rulers: RenderMetadataRow[];
  chart_contract: RenderChartContract | null;
} {
  const layouts = tableRecords(built.tabs.VIEW_EDITORIAL_LAYOUTS ?? []);
  const rulers = tableRecords(built.tabs.VIEW_EDITORIAL_RULERS ?? []);
  const charts = tableRecords(built.tabs.VIEW_EDITORIAL_CHART_REGISTRY ?? []);
  const editorialLayout = layouts.find((row) => row.slide_instance_id === slideInstanceId) ?? null;
  const editorialRulers = rulers.filter((row) => row.slide_instance_id === slideInstanceId);
  const rawChart = charts.find((row) => row.slide_instance_id === slideInstanceId);
  if (!rawChart) return { editorial_layout: editorialLayout, editorial_rulers: editorialRulers, chart_contract: null };

  const familyView = String(rawChart.family_view ?? "");
  const start = Number(rawChart.start_row_index);
  const end = Number(rawChart.end_row_index);
  if (!familyView || !Number.isInteger(start) || !Number.isInteger(end) || end <= start) {
    throw new Error(`Contrato de gráfico inválido para ${slideInstanceId}.`);
  }
  let series: RenderMetadataRow[];
  try {
    const parsed = JSON.parse(String(rawChart.series_json ?? "[]"));
    if (!Array.isArray(parsed)) throw new Error("series_json não é array");
    series = parsed.map((item) => Object.fromEntries(
      Object.entries(item as Record<string, unknown>).map(([key, value]) => [key, toPrimitive(value)]),
    ));
  } catch (error) {
    throw new Error(`series_json inválido para ${slideInstanceId}: ${String(error)}`);
  }
  const chartTable = (built.tabs[familyView] ?? []).slice(start, end);
  return {
    editorial_layout: editorialLayout,
    editorial_rulers: editorialRulers,
    chart_contract: {
      chart_key: String(rawChart.chart_key ?? ""),
      family_view: familyView,
      chart_type: String(rawChart.chart_type ?? ""),
      title: String(rawChart.title ?? ""),
      domain_column_index: Number(rawChart.domain_column_index),
      domain_title: String(rawChart.domain_title ?? ""),
      left_axis_title: String(rawChart.left_axis_title ?? ""),
      right_axis_title: String(rawChart.right_axis_title ?? ""),
      series,
      dataset: tableToRenderDataset(chartTable),
    },
  };
}

function resolveContract(slide: SlideRun, contracts: SlideContract[]): SlideContract {
  const contract = contracts.find((candidate) => candidate.slide_code === slide.slide_code);
  if (!contract) throw new Error(`Contrato editorial ausente para ${slide.slide_instance_id}.`);
  return contract;
}

function normalizeNarrative(
  slide: SlideRun,
  value: RenderNarrative | string | undefined,
): RenderNarrative {
  if (!value) throw new Error(`Narrativa ausente para ${slide.slide_instance_id}.`);
  if (typeof value !== "string") return value;
  const takeaway = value.trim();
  if (!takeaway) throw new Error(`Narrativa vazia para ${slide.slide_instance_id}.`);
  return {
    takeaway,
    evidence: [],
    action: null,
    limitation: slide.run_eligibility === "render_com_limites"
      ? `Leitura condicionada aos limites registrados no slide ${slide.slide_code}.`
      : "",
  };
}

function evidenceRefs(slide: SlideRun): string[] {
  const refs = new Set<string>();
  if (slide.source_view) refs.add(slide.source_view);
  for (const [key, value] of Object.entries(slide.evidence ?? {})) {
    if (value === null || value === undefined || value === "") continue;
    refs.add(`${key}=${typeof value === "string" ? value : JSON.stringify(value)}`);
  }
  return [...refs];
}

function latestCutoff(cutoffs: Record<string, string | null>): string | null {
  return Object.values(cutoffs)
    .filter((value): value is string => Boolean(value))
    .sort()
    .at(-1) ?? null;
}

export function buildReportRenderPackage(input: ReportRenderPackageAdapterInput): ReportRenderPackage {
  const blueprintById = new Map(input.blueprints.map((item) => [item.slide_instance_id, item]));
  const eligibleSlides = input.built.slides.filter(
    (slide): slide is SlideRun & { run_eligibility: "render" | "render_com_limites" } =>
      slide.run_eligibility !== "omitir_bloqueado",
  );

  const slides = eligibleSlides.map((slide, index): RenderSlide => {
    const contract = resolveContract(slide, input.inputs.slideContracts);
    const blueprint = blueprintById.get(slide.slide_instance_id);
    if (!blueprint) throw new Error(`Blueprint ausente para ${slide.slide_instance_id}.`);
    const sourceTable = slide.source_view ? input.built.tabs[slide.source_view] ?? [] : [];
    const archetype = archetypeFor(slide.slide_code);
    const editorial = editorialVisualContract(input.built, slide.slide_instance_id);
    return {
      slide_instance_id: slide.slide_instance_id,
      slide_code: slide.slide_code,
      display_order: index + 1,
      section: normalizeSection(contract.section),
      archetype,
      title: contract.title,
      subtitle: slide.partner,
      partner: slide.partner,
      audience: contract.audience,
      eligibility: slide.run_eligibility,
      confidence: slide.confidence_status,
      narrative: normalizeNarrative(slide, input.narratives[slide.slide_instance_id]),
      visual: {
        archetype,
        geometry: layoutGeometryFor(archetype, ["P1", "P4", "C4"].includes(slide.slide_code)),
        minimum_body_pt: minimumBodySize(contract.section === "annex" ? "annex" : "body"),
        dataset: tableToRenderDataset(sourceTable),
        ...editorial,
      },
      provenance: {
        source_view: slide.source_view,
        evidence_refs: evidenceRefs(slide),
        window_label: `${input.inputs.periodStart} a ${input.inputs.periodEnd}`,
        source_cutoffs: input.inputs.manifest.source_cutoffs,
        data_hash: blueprint.data_hash,
      },
    };
  });

  const result: ReportRenderPackage = {
    schema_version: REPORT_RENDER_PACKAGE_SCHEMA_VERSION,
    package_kind: input.package_kind ?? "production",
    run_id: input.inputs.runId,
    profile: input.inputs.profile,
    expected_slide_count: slides.length,
    coverage_baseline: REPORT_LIVE_COVERAGE_BASELINE,
    coverage_accounting: input.coverage_accounting,
    period: {
      start: input.inputs.periodStart,
      end: input.inputs.periodEnd,
      data_through: input.inputs.manifest.data_reading_integrated ?? latestCutoff(input.inputs.manifest.source_cutoffs),
    },
    publication: {
      generated_at: input.generated_at,
      spec_version: input.versions.spec,
      semantic_version: input.versions.semantic,
      renderer_version: input.versions.renderer,
    },
    source_cutoffs: input.inputs.manifest.source_cutoffs,
    quality_status: input.inputs.manifest.quality_status,
    slides,
  };

  const issues = validateReportRenderPackage(result);
  if (issues.length) {
    throw new Error(`Pacote de render inválido:\n${issues.map((issue) => `${issue.path}: ${issue.message}`).join("\n")}`);
  }
  return result;
}

export function validateReportRenderPackage(pkg: ReportRenderPackage): RenderPackageValidationIssue[] {
  const issues: RenderPackageValidationIssue[] = [];
  const add = (path: string, code: string, message: string) => issues.push({ path, code, message });
  const chartRequiredArchetypes = new Set<SlideArchetype>([
    "time_series_pacing",
    "router_ranking",
    "driver_scatter",
    "funnel",
    "heatmap",
  ]);

  if (pkg.schema_version !== REPORT_RENDER_PACKAGE_SCHEMA_VERSION) {
    add("schema_version", "schema_version", `Esperado ${REPORT_RENDER_PACKAGE_SCHEMA_VERSION}.`);
  }
  if (pkg.expected_slide_count !== pkg.slides.length) {
    add("expected_slide_count", "cardinality", "A contagem declarada deve ser igual a slides.length.");
  }
  const ids = new Set<string>();
  pkg.slides.forEach((slide, index) => {
    const path = `slides[${index}]`;
    if (ids.has(slide.slide_instance_id)) add(`${path}.slide_instance_id`, "duplicate", "ID duplicado.");
    ids.add(slide.slide_instance_id);
    if (slide.display_order !== index + 1) add(`${path}.display_order`, "order", "A ordem deve ser contínua e começar em 1.");
    if (slide.slide_code === "K-VISA") add(`${path}.slide_code`, "retired_scope", "K-VISA é histórico e não pode entrar em novo render.");
    if (!slide.title.trim()) add(`${path}.title`, "required", "Título vazio.");
    if (!slide.narrative.takeaway.trim()) add(`${path}.narrative.takeaway`, "required", "Takeaway vazio.");
    if (pkg.package_kind === "production" && slide.narrative.evidence.length === 0) {
      add(`${path}.narrative.evidence`, "narrative_contract", "Slide de produção precisa declarar evidência estruturada.");
    }
    if (pkg.package_kind === "production" && !slide.narrative.limitation.trim()) {
      add(`${path}.narrative.limitation`, "narrative_contract", "Slide de produção precisa declarar limite de leitura.");
    }
    if (!slide.provenance.data_hash.trim()) add(`${path}.provenance.data_hash`, "required", "Hash de dados ausente.");
    if (!/^[a-f0-9]{64}$/.test(slide.provenance.data_hash)) add(`${path}.provenance.data_hash`, "hash", "Hash de dados deve ser SHA-256 hexadecimal.");
    if (!slide.provenance.source_view && slide.provenance.evidence_refs.length === 0) {
      add(`${path}.provenance`, "provenance", "É necessário source_view ou evidence_refs.");
    }
    if (slide.eligibility === "render_com_limites" && !slide.narrative.limitation.trim()) {
      add(`${path}.narrative.limitation`, "limitation", "Slide com limites precisa declarar a limitação.");
    }
    for (const [rowIndex, row] of slide.visual.dataset.rows.entries()) {
      if (row.length !== slide.visual.dataset.columns.length) {
        add(`${path}.visual.dataset.rows[${rowIndex}]`, "row_width", "Número de células difere das colunas.");
      }
      row.forEach((cell, columnIndex) => {
        if (cell.value === 0 && cell.state !== "zero_observado") {
          add(`${path}.visual.dataset.rows[${rowIndex}][${columnIndex}]`, "zero_state", "Zero precisa ser zero_observado.");
        }
        if (cell.value === null && cell.state !== "missing" && cell.state !== "nao_aplicavel") {
          add(`${path}.visual.dataset.rows[${rowIndex}][${columnIndex}]`, "missing_state", "Null não pode ser valor_observado.");
        }
      });
    }
    if (slide.visual.dataset.row_count !== slide.visual.dataset.rows.length) {
      add(`${path}.visual.dataset.row_count`, "cardinality", "row_count deve ser igual a rows.length.");
    }
    if (slide.archetype !== slide.visual.archetype) {
      add(`${path}.visual.archetype`, "archetype", "Arquétipo visual diverge do arquétipo do slide.");
    }
    const expectedChart = slide.visual.editorial_layout?.expected_chart === true ||
      String(slide.visual.editorial_layout?.expected_chart).toLowerCase() === "true";
    if (expectedChart && !slide.visual.chart_contract) {
      add(`${path}.visual.chart_contract`, "chart_contract", "Layout exige gráfico, mas o contrato está ausente.");
    }
    if (pkg.package_kind === "production" && chartRequiredArchetypes.has(slide.archetype) && !slide.visual.chart_contract) {
      add(`${path}.visual.chart_contract`, "chart_contract", `Arquétipo ${slide.archetype} exige contrato de gráfico em produção.`);
    }
    if (slide.visual.chart_contract) {
      if (!slide.visual.chart_contract.series.length) add(`${path}.visual.chart_contract.series`, "chart_contract", "Gráfico sem séries.");
      if (slide.visual.chart_contract.dataset.row_count < 1) add(`${path}.visual.chart_contract.dataset`, "chart_contract", "Range de gráfico sem dados.");
      if (!slide.visual.chart_contract.title.trim()) add(`${path}.visual.chart_contract.title`, "chart_contract", "Gráfico sem título.");
      if (!slide.visual.chart_contract.domain_title.trim()) add(`${path}.visual.chart_contract.domain_title`, "chart_contract", "Gráfico sem eixo de domínio.");
      if (!slide.visual.chart_contract.left_axis_title.trim()) add(`${path}.visual.chart_contract.left_axis_title`, "chart_contract", "Gráfico sem eixo esquerdo.");
      slide.visual.chart_contract.series.forEach((series, seriesIndex) => {
        const seriesPath = `${path}.visual.chart_contract.series[${seriesIndex}]`;
        if (!["LEFT_AXIS", "RIGHT_AXIS"].includes(String(series.axis))) add(`${seriesPath}.axis`, "chart_contract", "Eixo da série inválido.");
        if (!/^#[0-9a-f]{6}$/i.test(String(series.color ?? ""))) add(`${seriesPath}.color`, "chart_contract", "Cor da série inválida.");
        if (!["NUMBER", "CURRENCY", "PERCENT"].includes(String(series.number_format_type))) {
          add(`${seriesPath}.number_format_type`, "chart_contract", "Formato numérico da série inválido.");
        }
        if (!String(series.number_format_pattern ?? "").trim()) add(`${seriesPath}.number_format_pattern`, "chart_contract", "Padrão numérico da série ausente.");
      });
    }
  });

  if (pkg.package_kind === "production") {
    if (pkg.coverage_accounting.length !== REPORT_LIVE_COVERAGE_BASELINE.slide_count) {
      add("coverage_accounting", "baseline_cardinality", "A baseline precisa ter exatamente 57 páginas contabilizadas.");
    }
    const pages = new Set<number>();
    for (const [index, entry] of pkg.coverage_accounting.entries()) {
      const path = `coverage_accounting[${index}]`;
      if (pages.has(entry.baseline_page)) add(`${path}.baseline_page`, "duplicate", "Página da baseline repetida.");
      pages.add(entry.baseline_page);
      if (!entry.rationale.trim()) add(`${path}.rationale`, "required", "Toda decisão de cobertura precisa de justificativa.");
      if (["preserve", "merge", "retain_as_quality_status"].includes(entry.disposition)) {
        if (entry.target_slide_instance_ids.length === 0) {
          add(`${path}.target_slide_instance_ids`, "silent_loss", "Cobertura preservada precisa apontar para ao menos um slide de destino.");
        }
        for (const id of entry.target_slide_instance_ids) {
          if (!ids.has(id)) add(`${path}.target_slide_instance_ids`, "unknown_target", `Slide de destino inexistente: ${id}.`);
        }
      }
      if (entry.baseline_slide_code === "K-VISA" && entry.disposition !== "retire_closed_scope") {
        add(`${path}.disposition`, "retired_scope", "K-VISA deve permanecer como retire_closed_scope.");
      }
    }
    for (let page = 1; page <= REPORT_LIVE_COVERAGE_BASELINE.slide_count; page += 1) {
      if (!pages.has(page)) add("coverage_accounting", "missing_page", `Página ${page} da baseline não foi contabilizada.`);
    }
  }

  return issues;
}
