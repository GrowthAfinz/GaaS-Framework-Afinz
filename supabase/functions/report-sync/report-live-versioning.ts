import type { BuiltReport, ReportInputs, Row, SlideRun } from "./report-live-engine.ts";
import {
  archetypeFor,
  layoutGeometryFor,
  minimumBodySize,
  REPORT_LIVE_DESIGN_VERSION,
  REPORT_LIVE_SPEC_VERSION,
} from "../_shared/report-live-design.ts";

export const RELEASE_VERSIONS = {
  source: "1.4",
  semantic: "1.4.0",
  spec: REPORT_LIVE_SPEC_VERSION,
  narrative: "1",
  renderer: REPORT_LIVE_DESIGN_VERSION,
  validator: "3",
} as const;

export type ValidationSeverity = "info" | "warning" | "error" | "blocking";
export type ValidationStatus = "passed" | "failed" | "skipped";

export interface ValidationResult {
  validation_key: string;
  scope: "run" | "slide";
  slide_instance_id: string | null;
  severity: ValidationSeverity;
  status: ValidationStatus;
  message: string;
  evidence: Record<string, unknown>;
  validator_version: string;
}

export interface SlideBlueprint {
  slide_instance_id: string;
  slide_code: string;
  renderer_version: string;
  archetype: string;
  density: "executive" | "standard" | "analytical";
  data_hash: string;
  narrative_hash: string;
  visual_hash: string;
  blueprint_hash: string;
  blueprint: Record<string, unknown>;
}

export interface ReportBuildArtifact {
  artifact_version: "1";
  run_id: string;
  report_profile: string;
  period_start: string;
  period_end: string;
  versions: typeof RELEASE_VERSIONS;
  manifest: ReportInputs["manifest"];
  sources: Record<string, Row[]>;
  source_snapshots?: Record<string, {
    artifact_path: string;
    artifact_paths?: string[];
    row_count: number;
    source_hash: string;
    fields?: string[];
  }>;
  tabs: BuiltReport["tabs"];
  slides: BuiltReport["slides"];
  slide_blueprints: SlideBlueprint[];
  action_candidates: BuiltReport["actionCandidates"];
  partner_modes: BuiltReport["partnerModes"];
  previous_period: BuiltReport["previousPeriod"];
  field_coverage: BuiltReport["fieldCoverage"];
  narratives: Record<string, string>;
  source_hash: string;
  narrative_hash: string;
  blueprint_hash: string;
  input_fingerprint: string;
  content_hash: string;
  tabs_hash?: string;
  idempotency_key: string;
  built_at: string;
}

export interface BlueprintDiff {
  added: string[];
  changed: string[];
  unchanged: string[];
  removed: string[];
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, item]) => [key, canonicalize(item)]),
    );
  }
  if (typeof value === "number" && !Number.isFinite(value)) throw new Error("Número não finito no artefato.");
  return value;
}

export function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}

export async function sha256(value: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(
    typeof value === "string" ? value : canonicalJson(value),
  );
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function reportSourceRows(input: ReportInputs): Record<string, Row[]> {
  return {
    crm: input.crm,
    media: input.media,
    media_actions: input.mediaActions,
    event_map: input.eventMap ?? [],
    b2c: input.b2c,
    goals: input.goals,
    budgets: input.budgets,
    targets: input.targets,
    collection_runs: input.collectionRuns,
    collection_logs: input.collectionLogs,
    experiments: input.experiments,
    insurance: input.insurance,
    communication_slots: input.communicationSlots,
    communication_templates: input.communicationTemplates,
    aliases: input.aliases,
    action_candidates: input.actionCandidates,
    action_outcomes: input.actionOutcomes,
    metric_certifications: input.metricCertifications,
    monthly_acquisition: input.monthlyAcquisition ?? [],
    slide_contracts: input.slideContracts as unknown as Row[],
    config: [input.config as Row],
  };
}

export async function buildSourceVersions(input: ReportInputs) {
  const sources = reportSourceRows(input);
  const entries: Array<{
    run_id: string;
    source_key: string;
    source_version: string;
    native_cutoff: string | null;
    row_count: number;
    field_coverage: Record<string, unknown>;
    source_hash: string;
    artifact_path: string | null;
  }> = [];
  // Hash sequentially. Running several multi-megabyte canonicalizations in
  // parallel creates avoidable memory spikes in the Edge runtime.
  for (const [source_key, rows] of Object.entries(sources)) {
    entries.push({
      run_id: input.runId,
      source_key,
      source_version: RELEASE_VERSIONS.source,
      native_cutoff: input.manifest.source_cutoffs[source_key] ?? null,
      row_count: rows.length,
      field_coverage: {},
      source_hash: await sha256(rows),
      artifact_path: null,
    });
  }
  return entries;
}

// SlideRun is intentionally kept lean in the database. These helpers read optional
// fields defensively so older runs remain serializable.
function slideMeta(slide: SlideRun): Record<string, unknown> {
  return {
    slide_instance_id: slide.slide_instance_id,
    slide_code: slide.slide_code,
    partner: slide.partner,
    source_view: slide.source_view,
    readiness: slide.implementation_readiness,
    eligibility: slide.run_eligibility,
    confidence: slide.confidence_status,
    missing_required_fields: slide.missing_required_fields,
    fallback_applied: slide.fallback_applied,
    evidence: slide.evidence,
  };
}

export async function buildSlideBlueprints(
  built: BuiltReport,
  narratives: Record<string, string>,
): Promise<SlideBlueprint[]> {
  return Promise.all(built.slides.map(async (slide) => {
    const sourceRows = slide.source_view ? built.tabs[slide.source_view] ?? [] : [];
    const narrative = narratives[slide.slide_instance_id] ?? "";
    const archetype = archetypeFor(slide.slide_code);
    const density = slide.slide_code.startsWith("A") ? "analytical" : "standard";
    const dataHash = await sha256(contentRows(slide.source_view, sourceRows));
    const narrativeHash = await sha256(narrative);
    const visualContract = {
      archetype,
      density,
      renderer_version: RELEASE_VERSIONS.renderer,
      theme: "afinz_light",
      minimum_body_pt: minimumBodySize(slide.slide_code.startsWith("A") ? "annex" : "body"),
      geometry: layoutGeometryFor(archetype, ["P1", "P4", "C4"].includes(slide.slide_code)),
    };
    const visualHash = await sha256(visualContract);
    const blueprint = {
      ...slideMeta(slide),
      narrative,
      source_row_count: sourceRows.length,
      source_data_hash: dataHash,
      visual: visualContract,
    };
    return {
      slide_instance_id: slide.slide_instance_id,
      slide_code: slide.slide_code,
      renderer_version: RELEASE_VERSIONS.renderer,
      archetype,
      density,
      data_hash: dataHash,
      narrative_hash: narrativeHash,
      visual_hash: visualHash,
      blueprint_hash: await sha256(blueprint),
      blueprint,
    };
  }));
}

// Only this explicit attempt field is excluded. Source timestamps and business
// identifiers remain part of the content identity.
function contentRows(view: string | null, rows: unknown[][]) {
  if (view === "SLIDE_READINESS") {
    const attemptColumn = rows[0]?.indexOf("run_id") ?? -1;
    return rows.map((row) => row.filter((_, index) => index !== attemptColumn));
  }
  return view === "VIEW_RUN_MANIFEST" ? rows.filter((row) => row[0] !== "run_id") : rows;
}

function contentCandidates(rows: Row[]) {
  return rows.map(({ run_id: _attempt, ...content }) => content);
}

export async function buildArtifact(
  input: ReportInputs,
  built: BuiltReport,
  narratives: Record<string, string>,
): Promise<ReportBuildArtifact> {
  const sourceVersions = await buildSourceVersions(input);
  const sourceHash = await sha256(
    [...sourceVersions].sort((a,b) => a.source_key.localeCompare(b.source_key)).map(({ source_key, row_count, source_hash }) => ({
      source_key,
      row_count,
      source_hash,
    })),
  );
  const narrativeHash = await sha256(narratives);
  const inputFingerprint = await sha256({
    profile: input.profile,
    period_start: input.periodStart,
    period_end: input.periodEnd,
    source_cutoffs: input.manifest.source_cutoffs,
    data_reading_integrated: input.manifest.data_reading_integrated,
    source_hash: sourceHash,
  });
  const slideBlueprints = await buildSlideBlueprints(built, narratives);
  const blueprintHash = await sha256(
    slideBlueprints.map((slide) => [slide.slide_instance_id, slide.blueprint_hash]),
  );
  const tabsHash = await sha256(Object.fromEntries(Object.entries(built.tabs).map(([view, rows]) => [view, contentRows(view, rows)])));
  const contentHash = await sha256({
    tabs_hash: tabsHash,
    blueprint_hash: blueprintHash,
    narrative_hash: narrativeHash,
    action_candidates: contentCandidates(built.actionCandidates),
  });
  const idempotencyKey = await sha256({
    input_fingerprint: inputFingerprint,
    semantic_version: RELEASE_VERSIONS.semantic,
    spec_version: RELEASE_VERSIONS.spec,
    content_hash: contentHash,
    tabs_hash: tabsHash,
    renderer_version: RELEASE_VERSIONS.renderer,
  });
  return {
    artifact_version: "1",
    run_id: input.runId,
    report_profile: input.profile,
    period_start: input.periodStart,
    period_end: input.periodEnd,
    versions: RELEASE_VERSIONS,
    manifest: input.manifest,
    sources: reportSourceRows(input),
    source_snapshots: Object.fromEntries(
      sourceVersions.map(({ source_key, row_count, source_hash }) => [
        source_key,
        { artifact_path: "", row_count, source_hash },
      ]),
    ),
    tabs: built.tabs,
    slides: built.slides,
    slide_blueprints: slideBlueprints,
    action_candidates: built.actionCandidates,
    partner_modes: built.partnerModes,
    previous_period: built.previousPeriod,
    field_coverage: built.fieldCoverage,
    narratives,
    source_hash: sourceHash,
    narrative_hash: narrativeHash,
    blueprint_hash: blueprintHash,
    input_fingerprint: inputFingerprint,
    content_hash: contentHash,
    idempotency_key: idempotencyKey,
    tabs_hash: tabsHash,
    built_at: new Date().toISOString(),
  };
}

export function diffBlueprints(
  current: SlideBlueprint[],
  previous: SlideBlueprint[] = [],
): BlueprintDiff {
  const currentById = new Map(
    current.map((slide) => [slide.slide_instance_id, slide.blueprint_hash]),
  );
  const previousById = new Map(
    previous.map((slide) => [slide.slide_instance_id, slide.blueprint_hash]),
  );
  const added: string[] = [];
  const changed: string[] = [];
  const unchanged: string[] = [];
  for (const [slideId, hash] of currentById) {
    if (!previousById.has(slideId)) added.push(slideId);
    else if (previousById.get(slideId) === hash) unchanged.push(slideId);
    else changed.push(slideId);
  }
  const removed = [...previousById.keys()].filter((slideId) => !currentById.has(slideId));
  return {
    added: added.sort(),
    changed: changed.sort(),
    unchanged: unchanged.sort(),
    removed: removed.sort(),
  };
}

function push(
  output: ValidationResult[],
  key: string,
  status: ValidationStatus,
  severity: ValidationSeverity,
  message: string,
  evidence: Record<string, unknown> = {},
  slideInstanceId: string | null = null,
) {
  output.push({
    validation_key: key,
    scope: slideInstanceId ? "slide" : "run",
    slide_instance_id: slideInstanceId,
    severity,
    status,
    message,
    evidence,
    validator_version: RELEASE_VERSIONS.validator,
  });
}

export async function validateArtifactIntegrity(artifact: ReportBuildArtifact): Promise<ValidationResult[]> {
  const output: ValidationResult[] = [];
  const check = (key: string, valid: boolean, slideId: string | null = null) => push(output, key,
    valid ? "passed" : "failed", "blocking", valid ? "Hash verificado." : "Conteúdo diverge do hash persistido.", {}, slideId);
  check("integrity.attempt_identity", artifact.tabs.VIEW_RUN_MANIFEST?.find((row) => row[0] === "run_id")?.[1] === artifact.run_id &&
    artifact.slides.every((slide) => slide.run_id === artifact.run_id));
  for (const slide of artifact.slide_blueprints) {
    const model = artifact.slides.find((item) => item.slide_instance_id === slide.slide_instance_id);
    const data = model?.source_view ? artifact.tabs[model.source_view] ?? [] : [];
    check("integrity.slide_data", await sha256(contentRows(model?.source_view ?? null, data)) === slide.data_hash, slide.slide_instance_id);
    check("integrity.slide_narrative", await sha256(artifact.narratives[slide.slide_instance_id] ?? "") === slide.narrative_hash, slide.slide_instance_id);
    check("integrity.slide_blueprint", await sha256(slide.blueprint) === slide.blueprint_hash, slide.slide_instance_id);
  }
  check("integrity.narrative", await sha256(artifact.narratives) === artifact.narrative_hash);
  check("integrity.tabs", await sha256(Object.fromEntries(Object.entries(artifact.tabs).map(([view, rows]) => [view, contentRows(view, rows)]))) === artifact.tabs_hash);
  check("integrity.blueprints", await sha256(artifact.slide_blueprints.map((slide) => [slide.slide_instance_id, slide.blueprint_hash])) === artifact.blueprint_hash);
  check("integrity.content", await sha256({ tabs_hash: artifact.tabs_hash, blueprint_hash: artifact.blueprint_hash,
    narrative_hash: artifact.narrative_hash, action_candidates: contentCandidates(artifact.action_candidates) }) === artifact.content_hash);
  const sourceEntries = [];
  for (const [key, snapshot] of Object.entries(artifact.source_snapshots ?? {})) {
    const rows = artifact.sources[key];
    if (rows) check(`integrity.source.${key}`, rows.length === snapshot.row_count && await sha256(rows) === snapshot.source_hash);
    sourceEntries.push({ source_key: key, row_count: snapshot.row_count, source_hash: snapshot.source_hash });
  }
  // JSONB reorders object keys; source identity must use a stable key order.
  sourceEntries.sort((a,b) => a.source_key.localeCompare(b.source_key));
  check("integrity.sources_manifest", await sha256(sourceEntries) === artifact.source_hash);
  return output;
}

export function validateArtifact(artifact: ReportBuildArtifact): ValidationResult[] {
  const output: ValidationResult[] = [];
  const manifestSpecVersion = artifact.tabs.VIEW_RUN_MANIFEST
    ?.find((row) => row[0] === "spec_version")?.[1];
  const manifestSpecMatches = manifestSpecVersion === artifact.versions.spec;
  push(
    output,
    "versions.manifest_spec",
    manifestSpecMatches ? "passed" : "failed",
    "blocking",
    manifestSpecMatches
      ? "A versão da spec no manifesto coincide com a versão do artefato."
      : "A versão da spec no manifesto diverge da versão do artefato; publicação proibida.",
    { manifest_spec: manifestSpecVersion ?? null, artifact_spec: artifact.versions.spec },
  );
  const sourceCounts = Object.keys(artifact.sources ?? {}).length
    ? Object.fromEntries(
      Object.entries(artifact.sources).map(([key, rows]) => [key, rows.length]),
    )
    : Object.fromEntries(
      Object.entries(artifact.source_snapshots ?? {})
        .map(([key, snapshot]) => [key, snapshot.row_count]),
    );
  const allSourcesEmpty = Object.values(sourceCounts).every((count) => count === 0);
  push(
    output,
    "sources.not_empty",
    allSourcesEmpty ? "failed" : "passed",
    "blocking",
    allSourcesEmpty
      ? "Todas as fontes do snapshot estão vazias; publicação proibida."
      : "O snapshot contém evidência observada.",
    { source_counts: sourceCounts },
  );

  const crmRows = sourceCounts.crm ?? 0;
  const crmEmpty = crmRows === 0;
  push(
    output,
    "sources.crm_required",
    crmEmpty ? "failed" : "passed",
    "blocking",
    crmEmpty
      ? "A fonte CRM obrigatória está vazia; o core de aquisição não pode ser publicado."
      : "A fonte CRM obrigatória possui linhas.",
    { crm_rows: crmRows },
  );

  const renderedSlides = artifact.slides.filter((slide) =>
    slide.run_eligibility !== "omitir_bloqueado"
  );
  push(
    output,
    "slides.rendered_non_empty",
    renderedSlides.length ? "passed" : "failed",
    "blocking",
    renderedSlides.length
      ? "O artefato possui slides elegíveis para publicação."
      : "Nenhum slide está elegível; publicação vazia proibida.",
    { rendered_slides: renderedSlides.length },
  );

  const expectedProfileSlides = artifact.report_profile === "deep_dive"
    ? 31
    : ["monthly_report", "executivo_mensal"].includes(artifact.report_profile)
    ? 12
    : null;
  if (expectedProfileSlides !== null) {
    push(
      output,
      "slides.profile_cardinality",
      renderedSlides.length === expectedProfileSlides ? "passed" : "failed",
      "blocking",
      renderedSlides.length === expectedProfileSlides
        ? `Perfil ${artifact.report_profile} contém ${expectedProfileSlides} slides.`
        : `Perfil ${artifact.report_profile} exige ${expectedProfileSlides} slides; foram gerados ${renderedSlides.length}.`,
      { profile: artifact.report_profile, expected: expectedProfileSlides, actual: renderedSlides.length },
    );
  }

  const chartTable = artifact.tabs.VIEW_EDITORIAL_CHART_REGISTRY ?? [];
  const chartHeaders = (chartTable[0] ?? []).map(String);
  const chartRows = chartTable.slice(1).map((row) =>
    Object.fromEntries(chartHeaders.map((header, index) => [header, row[index]])) as Row
  );
  const layoutTable = artifact.tabs.VIEW_EDITORIAL_LAYOUTS ?? [];
  const layoutHeaders = (layoutTable[0] ?? []).map(String);
  const expectedChartSlides = layoutTable.slice(1).flatMap((row) => {
    const item = Object.fromEntries(layoutHeaders.map((header, index) => [header, row[index]])) as Row;
    return String(item.expected_chart).toLowerCase() === "true" ? [String(item.slide_instance_id)] : [];
  });
  const plannedChartSlides = new Set(chartRows.map((row) => String(row.slide_instance_id ?? "")));
  const chartContractFailures: Array<{ slide_instance_id: unknown; reasons: string[] }> =
    expectedChartSlides
      .filter((slideId) => !plannedChartSlides.has(slideId))
      .map((slideId) => ({ slide_instance_id: slideId, reasons: ["grafico_esperado_sem_plano"] }));
  chartContractFailures.push(...chartRows.flatMap((row) => {
    const reasons: string[] = [];
    let series: Row[] = [];
    try {
      const parsed = JSON.parse(String(row.series_json ?? "[]"));
      if (Array.isArray(parsed)) series = parsed as Row[];
    } catch (_) {
      reasons.push("series_json_invalido");
    }
    if (!String(row.title ?? "").trim()) reasons.push("titulo_ausente");
    if (!String(row.domain_title ?? "").trim()) reasons.push("eixo_dominio_ausente");
    if (!String(row.left_axis_title ?? "").trim()) reasons.push("eixo_esquerdo_ausente");
    if (Number(row.expected_chart_count) !== 1) reasons.push("quantidade_grafico_invalida");
    if (!artifact.tabs[String(row.family_view ?? "")]) reasons.push("familia_ausente");
    if (!(Number(row.end_row_index) > Number(row.start_row_index) + 1)) reasons.push("range_sem_dados");
    if (!series.length) reasons.push("serie_ausente");
    for (const item of series) {
      if (!["LEFT_AXIS", "RIGHT_AXIS"].includes(String(item.axis))) reasons.push("eixo_serie_invalido");
      if (!String(item.color ?? "").match(/^#[0-9a-f]{6}$/i)) reasons.push("cor_serie_invalida");
      if (!["NUMBER", "CURRENCY", "PERCENT"].includes(String(item.number_format_type))) reasons.push("formato_serie_invalido");
      if (!String(item.number_format_pattern ?? "").trim()) reasons.push("padrao_numerico_ausente");
    }
    const hasRight = series.some((item) => item.axis === "RIGHT_AXIS");
    if (hasRight && !String(row.right_axis_title ?? "").trim()) reasons.push("eixo_direito_ausente");
    return reasons.length
      ? [{ slide_instance_id: row.slide_instance_id, reasons: [...new Set(reasons)] }]
      : [];
  }));
  push(
    output,
    "charts.editorial_contract_complete",
    chartContractFailures.length ? "failed" : "passed",
    "blocking",
    chartContractFailures.length
      ? "Há gráfico editorial sem range, série, eixo, cor ou formato numérico completo."
      : "Todos os gráficos editoriais declaram range, séries, eixos, cores e formatos.",
    { charts: chartRows.length, failures: chartContractFailures },
  );

  const rectangularFailures = Object.entries(artifact.tabs)
    .filter(([, rows]) => rows.length > 0)
    .filter(([, rows]) => rows.some((row) => row.length !== rows[0].length))
    .map(([tab]) => tab);
  push(
    output,
    "tables.rectangular",
    rectangularFailures.length ? "failed" : "passed",
    "blocking",
    rectangularFailures.length
      ? "Há tabelas com linhas posicionais incompletas; missing poderia deslocar colunas."
      : "Todas as linhas preservam a mesma quantidade e posição de colunas.",
    { tabs: rectangularFailures },
  );

  const contradictory = artifact.slides.filter((slide) =>
    (slide.implementation_readiness.startsWith("bloqueado_") &&
      slide.run_eligibility === "render") ||
    (slide.confidence_status === "blocked" && slide.run_eligibility === "render")
  );
  push(
    output,
    "slides.readiness_confidence_eligibility",
    contradictory.length ? "failed" : "passed",
    "blocking",
    contradictory.length
      ? "Prontidão, confiança e elegibilidade se contradizem."
      : "Prontidão, confiança e elegibilidade são coerentes.",
    { slides: contradictory.map((slide) => slide.slide_instance_id) },
  );

  const missingNarratives = artifact.slides
    .filter((slide) => slide.run_eligibility !== "omitir_bloqueado")
    .filter((slide) => !(artifact.narratives[slide.slide_instance_id] ?? "").trim());
  push(
    output,
    "slides.narrative_present",
    missingNarratives.length ? "failed" : "passed",
    "error",
    missingNarratives.length
      ? "Slides renderizados sem narrativa governada."
      : "Todos os slides renderizados possuem narrativa.",
    { slides: missingNarratives.map((slide) => slide.slide_instance_id) },
  );

  const c1 = artifact.slides.find((slide) => slide.slide_code === "C1");
  push(
    output,
    "c1.no_fallback",
    c1?.fallback_applied ? "failed" : "passed",
    "blocking",
    c1?.fallback_applied
      ? "C1 ainda depende de fallback e pode divergir do scorecard."
      : "C1 usa sua fonte declarada.",
    { fallback: c1?.fallback_applied ?? null },
    c1?.slide_instance_id ?? null,
  );

  // Reprova por ausência de conteúdo, não por ausência de uma fonte.
  //
  // Até 10/09/2026 este gate reprovava sempre que o manifesto viesse "blocked",
  // e o manifesto virava "blocked" com qualquer uma das três fontes faltando.
  // Na prática, B2C ausente em agosto/2026 tornava o relatório inteiro
  // impublicável — mesmo com CRM completo (809 disparos, 31 dias, zero nulos) e
  // Meta completo. Isso contraria a regra de produto: uma frente indisponível
  // não deve bloquear frentes independentes.
  //
  // O manifesto agora só devolve "blocked" quando falta CRM, que é o esqueleto
  // do deck. Aqui a checagem é a consequência prática disso: se nenhum slide
  // sobreviveu à elegibilidade, não há relatório a publicar. Corrupção de
  // artefato e falha de autorização continuam reprovando nos gates próprios.
  const renderableSlides = artifact.slides.filter(
    (slide) => slide.run_eligibility !== "omitir_bloqueado",
  );
  const missingSources = artifact.manifest.missing_sources ?? [];
  const manifestBlocked = artifact.manifest.quality_status === "blocked";
  const partnerResolutionGate = artifact.manifest.comparability?.partner_resolution_equivalence as
    | { status?: string; mismatch_count?: number }
    | undefined;
  const nothingToPublish = renderableSlides.length === 0;
  const publicationBlocked = manifestBlocked || nothingToPublish;
  push(
    output,
    "manifest.publication_gate",
    publicationBlocked ? "failed" : "passed",
    "blocking",
    nothingToPublish
      ? "Nenhum slide elegível: não há relatório a publicar."
      : manifestBlocked
      ? partnerResolutionGate?.status === "blocked"
        ? `Manifesto bloqueado: ${partnerResolutionGate.mismatch_count ?? 0} divergência(s) entre parceiro canônico SQL e TypeScript.`
        : "Manifesto bloqueado: sem CRM não há relatório, apenas status."
      : missingSources.length
      ? `Publicação permitida com limites; fonte(s) ausente(s): ${missingSources.join(", ")}.`
      : "Manifesto permite certificação.",
    {
      quality_status: artifact.manifest.quality_status,
      renderable_slides: renderableSlides.length,
      missing_sources: missingSources,
    },
  );
  return output;
}

function observedNumber(row: Row, keys: string[]): number {
  for (const key of keys) {
    const value = row[key];
    if (value === null || value === undefined || value === "") continue;
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

function comparableTabMetric(artifact: ReportBuildArtifact, metric: string) {
  for (const [source, table] of [
    ["integrated", artifact.tabs.VIEW_SCORECARD_INTEGRATED ?? []],
    ["native", artifact.tabs.VIEW_SCORECARD_NATIVE ?? []],
  ] as const) {
    if (table.length < 2) continue;
    const headers = table[0].map(String);
    const metricIndex = headers.indexOf("metric");
    const currentIndex = headers.indexOf("current");
    const previousIndex = headers.indexOf("previous_equivalent");
    if (metricIndex < 0 || currentIndex < 0 || previousIndex < 0) continue;
    const row = table.slice(1).find((item) => String(item[metricIndex]) === metric);
    if (!row || row[currentIndex] === "" || row[currentIndex] == null ||
      row[previousIndex] === "" || row[previousIndex] == null) continue;
    const current = Number(row[currentIndex]);
    const previousEquivalent = Number(row[previousIndex]);
    if (Number.isFinite(current) && Number.isFinite(previousEquivalent)) {
      return { current, previousEquivalent, source };
    }
  }
  return null;
}

function regressionMetric(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return (current - previous) / previous;
}

/**
 * Guardrail against syntactically valid but materially incomplete snapshots.
 * Large drops require an explicit human approval before the live targets mutate.
 */
export function validateRegression(
  current: ReportBuildArtifact,
  previous: ReportBuildArtifact | null,
  maximumDrop = 0.3,
): ValidationResult[] {
  const output: ValidationResult[] = [];
  if (!previous) {
    push(
      output,
      "regression.baseline_available",
      "skipped",
      "info",
      "Primeira publicação versionada: não há baseline anterior.",
    );
    return output;
  }

  const currentRendered = current.slides.filter((slide) =>
    slide.run_eligibility !== "omitir_bloqueado"
  ).length;
  const previousRendered = previous.slides.filter((slide) =>
    slide.run_eligibility !== "omitir_bloqueado"
  ).length;
  const slideDelta = regressionMetric(currentRendered, previousRendered);
  const slideFailed = slideDelta !== null && slideDelta < -maximumDrop;
  push(
    output,
    "regression.rendered_slide_count",
    slideFailed ? "failed" : "passed",
    "blocking",
    slideFailed
      ? "A quantidade de slides renderizáveis caiu acima do limite permitido."
      : "A quantidade de slides renderizáveis está dentro do limite de regressão.",
    {
      current: currentRendered,
      previous: previousRendered,
      delta: slideDelta,
      maximum_drop: maximumDrop,
    },
  );

  // Compare the current snapshot with its own equivalent prior window. A
  // cross-publication comparison can compare 31 days with a partial prior
  // month and falsely classify a valid release as a source collapse. When an
  // integrated cutoff is unavailable, CRM's native comparable window remains
  // valid and must not be converted into zero.
  const cardMetric = comparableTabMetric(current, "cartoes_crm");
  const currentCards = cardMetric?.current ?? null;
  const previousCards = cardMetric?.previousEquivalent ?? null;
  const cardDelta = currentCards == null || previousCards == null
    ? null
    : regressionMetric(currentCards, previousCards);
  const cardFailed = !cardMetric || (cardDelta !== null && cardDelta < -maximumDrop);
  push(
    output,
    "regression.crm_cards",
    cardFailed ? "failed" : "passed",
    "blocking",
    cardFailed
      ? !cardMetric
        ? "O volume CRM comparável não está disponível; aprovação humana é obrigatória."
        : "O volume CRM de cartões caiu acima do limite; aprovação humana é obrigatória."
      : "O volume CRM de cartões está dentro do limite de regressão.",
    {
      current: currentCards,
      previous: previousCards,
      delta: cardDelta,
      maximum_drop: maximumDrop,
      comparison_source: cardMetric?.source ?? null,
    },
  );
  return output;
}

export function certificationPassed(validations: ValidationResult[]): boolean {
  return !validations.some((item) =>
    item.status === "failed" && (item.severity === "blocking" || item.severity === "error")
  );
}
