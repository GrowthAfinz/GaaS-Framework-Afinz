export type QualityStatus = "confirmed" | "directional" | "suspect" | "blocked";
export type Eligibility = "render" | "render_com_limites" | "omitir_bloqueado";
export type DataState = "valor_observado" | "zero_observado" | "missing" | "nao_aplicavel";

export type Row = Record<string, unknown>;

export interface SourceManifest {
  period_start: string;
  period_end: string;
  source_cutoffs: Record<string, string | null>;
  data_reading_integrated: string | null;
  gap_closure_days: number | null;
  quality_status: QualityStatus;
  field_coverage: Record<string, number | null>;
  comparability: Record<string, unknown>;
}

export interface SlideContract {
  slide_code: string;
  section: string;
  title: string;
  audience: string;
  source_view: string | null;
  required_fields: string[];
  optional_fields: string[];
  fallback_view: string | null;
  implementation_readiness: string;
  conditional: boolean;
  display_order: number;
}

export interface ReportInputs {
  runId: string;
  profile: string;
  periodStart: string;
  periodEnd: string;
  manifest: SourceManifest;
  crm: Row[];
  media: Row[];
  mediaActions: Row[];
  b2c: Row[];
  goals: Row[];
  budgets: Row[];
  targets: Row[];
  collectionRuns: Row[];
  collectionLogs: Row[];
  experiments: Row[];
  insurance: Row[];
  communicationSlots: Row[];
  communicationTemplates: Row[];
  slideContracts: SlideContract[];
  aliases: Row[];
  actionCandidates: Row[];
  actionOutcomes: Row[];
  metricCertifications: Row[];
  config: Record<string, unknown>;
}

export interface SlideRun {
  run_id: string;
  slide_instance_id: string;
  slide_code: string;
  partner: string | null;
  source_view: string | null;
  implementation_readiness: string;
  run_eligibility: Eligibility;
  confidence_status: QualityStatus;
  confidence_label: string;
  data_coverage: number | null;
  cutoff_maturity: number | null;
  execution_volume: number | null;
  missing_required_fields: string[];
  fallback_applied: string | null;
  evidence: Record<string, unknown>;
}

export interface BuiltReport {
  tabs: Record<string, unknown[][]>;
  slides: SlideRun[];
  actionCandidates: Row[];
  partnerModes: Array<Record<string, unknown>>;
  previousPeriod: { start: string; end: string };
  fieldCoverage: Array<Record<string, unknown>>;
}

const DAY = 86_400_000;

export const toIsoDay = (value: unknown): string =>
  value == null ? "" : String(value).slice(0, 10);

export const toNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = typeof value === "string"
    ? Number(value.includes(",") ? value.replace(/\./g, "").replace(",", ".") : value)
    : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const dataState = (value: unknown, applicable = true): DataState => {
  if (!applicable) return "nao_aplicavel";
  const number = toNumber(value);
  if (number === null) return "missing";
  return number === 0 ? "zero_observado" : "valor_observado";
};

const dateValue = (value: string): number => new Date(`${value}T00:00:00Z`).getTime();
const isoFromMs = (value: number): string => new Date(value).toISOString().slice(0, 10);
const inclusiveDays = (start: string, end: string): number =>
  Math.max(1, Math.floor((dateValue(end) - dateValue(start)) / DAY) + 1);

export function previousEquivalentPeriod(start: string, end: string) {
  const days = inclusiveDays(start, end);
  const previousEnd = dateValue(start) - DAY;
  return {
    start: isoFromMs(previousEnd - (days - 1) * DAY),
    end: isoFromMs(previousEnd),
  };
}

export function classifyMediaFront(campaign: unknown): string {
  const value = String(campaign ?? "");
  if (/COPA|RENTABILIZA|LP_Visa|DISPLAY_B2C_VISA|\[Demand\]|\[Youtube\]/i.test(value)) {
    return "Marca B2C (Copa)";
  }
  if (/\[SEGUROS\]/i.test(value)) return "Seguros";
  if (/\[PLURIX\]|mais_amigo/i.test(value)) return "Aquisição Plurix";
  return "Aquisição B2C";
}

export function slug(value: unknown): string {
  const normalized = String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return normalized.slice(0, 40) || "sem_valor";
}

const inWindow = (value: unknown, start: string, end: string): boolean => {
  const day = toIsoDay(value);
  return Boolean(day && day >= start && day <= end);
};

export type PartnerConfidence = "alta" | "media" | "baixa";
export type PartnerResolution = {
  canonical_partner: string;
  reason: string;
  confidence: PartnerConfidence;
};

const PLURIX_TOKEN = /(^|_)(plu|plx|plurix)/i;
const INSTITUTIONAL_TOKEN = /institucional|inst(?![a-z])/i;

/**
 * Resolve o parceiro canônico SEM sobrescrever o dado bruto.
 *
 * `Parceiro` (partner_raw) permanece intacto na base; esta derivação existe apenas
 * em tempo de leitura, é auditável por VIEW_PARTNER_RESOLUTION e reversível.
 *
 * `N/A` é um valor bruto ambíguo, não uma classificação final: pode ser emissão
 * institucional da própria base B2C, autoatribuição da BU Plurix, ou falta real de
 * mapeamento. Precedência (do mais forte para o mais fraco):
 *   1. Parceiro explicitamente preenchido.
 *   2. Regra contextual certificada por BU (Plurix / B2C).
 *   3. Não mapeado -> permanece N/A e cai na faixa de integridade.
 *
 * Atenção: a JORNADA não é fonte confiável de parceiro. O token `_NA_` aparece tanto
 * em jornadas da Proprietaria quanto em `N/A` real, e em Serasa a 4a posição é cadência
 * (CARRINHO/21D/SAB). O sinal confiável é BU + prefixo do Activity Name.
 */
export function resolvePartner(row: Row): PartnerResolution {
  const raw = String(row.Parceiro ?? "").trim();
  if (raw && raw.toUpperCase() !== "N/A") {
    return { canonical_partner: raw, reason: "EXPLICIT_PARTNER", confidence: "alta" };
  }

  const bu = String(row.BU ?? "").trim();
  const activity = String(row["Activity name / Taxonomia"] ?? "");
  const journey = String(row.jornada ?? "");

  // BU Plurix: o parceiro implícito é o próprio Plurix. Confirmado por prefixo
  // `plu_`/`plx` no activity OU `PLURIX` no nome da jornada (cobre a jornada de
  // carrinho assistido, cujo activity é genérico `afz_..._grl_`).
  if (bu === "Plurix" && (PLURIX_TOKEN.test(activity) || /plurix/i.test(journey))) {
    return { canonical_partner: "Plurix", reason: "BU_PLURIX_SELF_ATTRIBUTION", confidence: "alta" };
  }

  // BU B2C sem parceiro externo: é base própria da Afinz, cujo rótulo canônico já
  // existe como "Proprietaria" (mesma jornada e mesmo padrão de activity name das
  // linhas já rotuladas). Certificado pela operação em 23/07/2026.
  if (bu === "B2C") {
    return {
      canonical_partner: "Proprietaria",
      reason: INSTITUTIONAL_TOKEN.test(activity)
        ? "B2C_INSTITUTIONAL_OWN_BASE"
        : "B2C_CAMPAIGN_TWIN_MATCH",
      confidence: "alta",
    };
  }

  return { canonical_partner: "N/A", reason: "UNRESOLVED", confidence: "baixa" };
}

/** Anexa partner_raw/canonical_partner/reason/confidence sem mutar a origem. */
const withCanonicalPartner = (rows: Row[]): Row[] =>
  rows.map((row) => {
    const resolution = resolvePartner(row);
    return {
      ...row,
      partner_raw: row.Parceiro ?? null,
      canonical_partner: resolution.canonical_partner,
      partner_classification_reason: resolution.reason,
      partner_classification_confidence: resolution.confidence,
    };
  });

const sumNullable = (rows: Row[], key: string): number | null => {
  let total = 0;
  let observed = 0;
  for (const row of rows) {
    const value = toNumber(row[key]);
    if (value === null) continue;
    total += value;
    observed += 1;
  }
  return observed ? total : null;
};

const ratio = (numerator: number | null, denominator: number | null): number | null => {
  if (numerator === null || denominator === null || denominator === 0) return null;
  return numerator / denominator;
};

const delta = (current: number | null, previous: number | null): number | null => {
  if (current === null || previous === null || previous === 0) return null;
  return current / previous - 1;
};

const uniqueCount = (rows: Row[], key: string): number =>
  new Set(rows.map((row) => String(row[key] ?? "").trim()).filter(Boolean)).size;

const groupRows = (rows: Row[], keys: string[]): Map<string, Row[]> => {
  const grouped = new Map<string, Row[]>();
  for (const row of rows) {
    const key = keys.map((field) => String(row[field] ?? "")).join("\u241f");
    const bucket = grouped.get(key) ?? [];
    bucket.push(row);
    grouped.set(key, bucket);
  }
  return grouped;
};

const round = (value: number | null, digits = 4): number | null => {
  if (value === null) return null;
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

const labelForQuality = (status: QualityStatus): string => ({
  confirmed: "Alta",
  directional: "Média",
  suspect: "Baixa",
  blocked: "Indisponível",
})[status];

const qualityRank: Record<QualityStatus, number> = {
  confirmed: 0,
  directional: 1,
  suspect: 2,
  blocked: 3,
};

const worstQuality = (...statuses: QualityStatus[]): QualityStatus =>
  statuses.reduce((worst, current) =>
    qualityRank[current] > qualityRank[worst] ? current : worst, "confirmed");

function crmMetrics(rows: Row[]) {
  const baseTotal = sumNullable(rows, "Base Total");
  const base = sumNullable(rows, "Base Acionável");
  const proposals = sumNullable(rows, "Propostas");
  const approved = sumNullable(rows, "Aprovados");
  const cards = sumNullable(rows, "Cartões Gerados");
  const cost = sumNullable(rows, "Custo Total Campanha");
  const channelCost = sumNullable(rows, "Custo total canal");
  const offerCost = sumNullable(rows, "Custo Total da Oferta");
  const opens = sumNullable(rows, "Abertura");
  const clicks = sumNullable(rows, "Cliques");
  return {
    dispatches: rows.length,
    base_total: baseTotal,
    base,
    proposals,
    approved,
    cards,
    cost,
    channel_cost: channelCost,
    offer_cost: offerCost,
    opens,
    clicks,
    proposal_rate: ratio(proposals, base),
    approval_rate: ratio(approved, proposals),
    card_rate_base: ratio(cards, base),
    cac: ratio(cost, cards),
    open_rate_proxy_base: ratio(opens, base),
    click_rate_open: ratio(clicks, opens),
  };
}

function mediaMetrics(rows: Row[]) {
  const spend = sumNullable(rows, "spend");
  const impressions = sumNullable(rows, "impressions");
  const clicks = sumNullable(rows, "clicks");
  const conversions = sumNullable(rows, "conversions");
  const reach = sumNullable(rows, "reach");
  const installs = sumNullable(rows, "installs");
  const startTrials = sumNullable(rows, "start_trials");
  let weightedFrequencyNumerator = 0;
  let weightedFrequencyDenominator = 0;
  for (const row of rows) {
    const frequency = toNumber(row.frequency);
    const rowImpressions = toNumber(row.impressions);
    if (frequency === null || rowImpressions === null) continue;
    weightedFrequencyNumerator += frequency * rowImpressions;
    weightedFrequencyDenominator += rowImpressions;
  }
  return {
    rows: rows.length,
    spend,
    impressions,
    clicks,
    conversions,
    reach,
    installs,
    start_trials: startTrials,
    ctr: ratio(clicks, impressions),
    cpc: ratio(spend, clicks),
    cpm: impressions ? (spend ?? 0) / impressions * 1000 : null,
    cpa_platform: ratio(spend, conversions),
    cost_per_install: ratio(spend, installs),
    cost_per_start_trial: ratio(spend, startTrials),
    frequency_weighted: weightedFrequencyDenominator
      ? weightedFrequencyNumerator / weightedFrequencyDenominator
      : null,
  };
}

const rowsToTable = (headers: string[], rows: Array<object>): unknown[][] => [
  headers,
  ...rows.map((rawRow) => headers.map((header) => {
    const value = (rawRow as Record<string, unknown>)[header];
    if (value === null || value === undefined) return "";
    if (typeof value === "object") return JSON.stringify(value);
    return value;
  })),
];

const objectEntriesTable = (value: Record<string, unknown>): unknown[][] => [
  ["campo", "valor"],
  ...Object.entries(value).map(([key, item]) => [
    key,
    item != null && typeof item === "object" ? JSON.stringify(item) : item ?? "",
  ]),
];

const tabName = (prefix: string, value: unknown, suffix: string): string =>
  `${prefix}_${slug(value).toUpperCase().slice(0, 18)}_${suffix}`.slice(0, 99);

const sourceDate = (row: Row, source: "crm" | "media" | "b2c" | "action" | "insurance"): unknown => {
  if (source === "crm" || source === "insurance") return row["Data de Disparo"];
  if (source === "b2c") return row.data;
  if (source === "action") return row.business_date;
  return row.date;
};

function buildPartnerModes(crmCurrent: Row[], config: Record<string, unknown>) {
  const materiality = (config.materiality ?? {}) as Record<string, unknown>;
  const threshold = toNumber(materiality.card_share_full) ?? 0.05;
  const minSegments = toNumber(materiality.min_segments_for_variety) ?? 2;
  const minChannels = toNumber(materiality.min_channels_for_variety) ?? 2;
  const strategic = new Set(
    (Array.isArray(materiality.strategic_partners) ? materiality.strategic_partners : [])
      .map((value) => String(value).toLowerCase()),
  );
  const excluded = new Set(
    (Array.isArray(materiality.excluded_partners) ? materiality.excluded_partners : ["N/A", ""])
      .map((value) => String(value).toLowerCase()),
  );
  const totalCards = crmMetrics(crmCurrent).cards ?? 0;
  const grouped = groupRows(crmCurrent, ["canonical_partner"]);
  const output: Array<Record<string, unknown>> = [];
  for (const rows of grouped.values()) {
    const partner = String(rows[0]?.canonical_partner ?? "").trim();
    const metrics = crmMetrics(rows);
    const share = totalCards > 0 ? (metrics.cards ?? 0) / totalCards : 0;
    const segments = uniqueCount(rows, "Segmento");
    const channels = uniqueCount(rows, "Canal");
    const variety = segments >= minSegments || channels >= minChannels;
    const signal = (metrics.base ?? 0) > 0 && (metrics.cards ?? 0) === 0;
    const isStrategic = strategic.has(partner.toLowerCase());
    const excludedPartner = excluded.has(partner.toLowerCase());
    const full = !excludedPartner && (isStrategic || (share >= threshold && (variety || signal)));
    output.push({
      partner,
      bu: [...new Set(rows.map((row) => String(row.BU ?? "")).filter(Boolean))].join(", "),
      dispatches: metrics.dispatches,
      base: metrics.base,
      cards: metrics.cards,
      cost: metrics.cost,
      cac: metrics.cac,
      conversion: metrics.card_rate_base,
      card_share: share,
      segment_count: segments,
      channel_count: channels,
      strategic: isStrategic,
      material: share >= threshold,
      variety,
      signal,
      mode: excludedPartner ? "quality_flag" : full ? "full" : "compact",
      alert: excludedPartner ? "Parceiro N/A: corrigir taxonomia" : signal ? "Base executada sem cartão observado" : "",
    });
  }
  return output.sort((a, b) => (toNumber(b.cards) ?? 0) - (toNumber(a.cards) ?? 0));
}

function canonicalCampaignKey(row: Row, aliases: Row[]): string {
  const channel = String(row.channel ?? "").toLowerCase();
  const campaign = String(row.campaign ?? row.campaign_name ?? "");
  const sourceId = String(row.campaign_id ?? "");
  const found = aliases.find((alias) => {
    const samePlatform = String(alias.platform ?? "").toLowerCase() === channel;
    if (!samePlatform) return false;
    if (sourceId && String(alias.source_campaign_id ?? "") === sourceId) return true;
    return String(alias.source_campaign_name ?? "") === campaign;
  });
  return String(found?.canonical_campaign_id ?? `${channel || "unknown"}:name:${slug(campaign)}`);
}

function buildDeterministicCandidates(
  input: ReportInputs,
  partnerModes: Array<Record<string, unknown>>,
  crmCurrent: Row[],
  mediaCurrent: Row[],
): Row[] {
  const candidates: Row[] = [];
  const add = (candidate: Row) => {
    const key = `${candidate.entity_key}\u241f${candidate.signal_code}`;
    if (candidates.some((row) => `${row.entity_key}\u241f${row.signal_code}` === key)) return;
    candidates.push({
      run_id: input.runId,
      bucket: "Investigar",
      confidence_status: input.manifest.quality_status,
      generated_by: "deterministic_rule_v1",
      review_status: "pending",
      status: "candidate",
      ...candidate,
    });
  };

  if ((input.manifest.gap_closure_days ?? 0) > 2) {
    add({
      source_view: "VIEW_COVERAGE_COMPARABILITY",
      entity_key: "quality:cross_source_cutoff",
      signal_code: "CUTOFF_GAP_GT_2",
      domain: "qualidade",
      signal: `Gap de fechamento de ${input.manifest.gap_closure_days} dias entre fontes.`,
      impact: "Números cross-source não representam o mesmo corte operacional.",
      probable_cause: "Fontes concluíram a coleta em datas diferentes.",
      evidence_refs: [{ view: "VIEW_RUN_MANIFEST", field: "source_cutoffs" }],
      reading_limit: "Usar o cutoff integrado e expor os cutoffs nativos.",
      action_text: "Regularizar a fonte atrasada antes de decisões cross-source.",
      success_metric: "gap_fechamento <= 2 dias",
    });
  }

  const templateCoverage = toNumber(input.manifest.field_coverage?.crm_template);
  if (templateCoverage !== null && templateCoverage < 0.8) {
    add({
      source_view: "VIEW_TEMPLATE_COVERAGE",
      entity_key: "crm:template_mapping",
      signal_code: "TEMPLATE_COVERAGE_LT_80",
      domain: "crm",
      bucket: "Acompanhar",
      signal: `Cobertura de template_id em ${round(templateCoverage * 100, 1)}%.`,
      impact: "P5 perde profundidade de conteúdo e repetibilidade por template.",
      probable_cause: "Backlog de ligação entre Activity Name, slots e templates.",
      evidence_refs: [{ view: "VIEW_TEMPLATE_COVERAGE", field: "activities_template_coverage" }],
      reading_limit: "Campanhas BAU podem ser analisadas por Activity Name enquanto o mapeamento avança.",
      action_text: "Priorizar o mapeamento das atividades BAU de maior volume.",
      success_metric: "activities_template_coverage >= 80%",
      confidence_status: "confirmed",
    });
  }

  for (const partner of partnerModes) {
    if (partner.mode === "quality_flag") {
      add({
        source_view: "VIEW_PARTNER_ROUTER",
        entity_key: `partner:${slug(partner.partner)}`,
        signal_code: "PARTNER_NA_CLASSIFICATION",
        domain: "crm",
        partner: partner.partner,
        signal: `${round((toNumber(partner.card_share) ?? 0) * 100, 1)}% dos cartões estão em parceiro N/A.`,
        impact: "O router não consegue atribuir corretamente a contribuição.",
        probable_cause: "Taxonomia de parceiro ausente no cadastro/importação.",
        evidence_refs: [{ view: "VIEW_PARTNER_ROUTER", partner: partner.partner }],
        action_text: "Corrigir a taxonomia das atividades N/A de maior volume.",
        success_metric: "share_cartoes_parceiro_NA",
        confidence_status: "confirmed",
      });
    } else if (partner.signal) {
      add({
        source_view: "VIEW_PARTNER_ROUTER",
        entity_key: `partner:${slug(partner.partner)}`,
        signal_code: "BASE_WITHOUT_CARDS",
        domain: "crm",
        partner: partner.partner,
        bucket: "Investigar",
        signal: "Base executada sem cartão observado no período.",
        impact: "Possível quebra de funil, baixa maturidade ou medição incompleta.",
        probable_cause: "Hipótese a validar no funil e no cutoff.",
        evidence_refs: [{ view: "VIEW_PARTNER_ROUTER", partner: partner.partner }],
        reading_limit: "Zero observado não prova ineficiência causal.",
        action_text: "Validar proposta, aprovação, cartão e maturidade do parceiro.",
        success_metric: "cartoes_gerados",
      });
    }
  }

  for (const rows of groupRows(mediaCurrent, ["channel", "objective"]).values()) {
    const metrics = mediaMetrics(rows);
    const channel = String(rows[0]?.channel ?? "");
    const objective = String(rows[0]?.objective ?? "");
    if ((metrics.clicks ?? 0) > 200 && metrics.conversions === 0) {
      add({
        source_view: "VIEW_MEDIA_QUALITY",
        entity_key: `media:${slug(channel)}:${slug(objective)}`,
        signal_code: "MEDIA_ZERO_CONVERSION_WITH_CLICKS",
        domain: "midia",
        signal: `${metrics.clicks} cliques e zero conversão de plataforma observada.`,
        impact: "Performance e tracking não podem ser separados sem auditoria.",
        probable_cause: "Evento, janela, importação ou conversão real podem explicar o zeramento.",
        evidence_refs: [{ view: "VIEW_MEDIA_QUALITY", channel, objective }],
        reading_limit: "Não recomendar corte ou escala até concluir o quality gate.",
        action_text: "Auditar evento nomeado, janela de atribuição e última coleta.",
        success_metric: "event_coverage_status",
        confidence_status: "suspect",
      });
    }
  }

  return candidates;
}

function buildFieldCoverage(input: ReportInputs): Array<Record<string, unknown>> {
  const consumers: Record<string, string> = {
    "Data de Disparo": "CT-1, P1-P5, iso-dias",
    "BU": "C3, P1, A1",
    "Parceiro": "C5, P1-P7, A1",
    "Segmento": "P2, P3, P6, A1",
    "Canal": "P3, C6",
    "Safra": "P1, P4, P5",
    "Activity name / Taxonomia": "P5, K-TPL",
    "jornada": "P5",
    "Base Total": "P5, A4",
    "Base Acionável": "C3, C6, P1-P6",
    "Propostas": "P4, B1",
    "Aprovados": "P4",
    "Cartões Gerados": "C3-C6, P1-P5",
    "Custo Total Campanha": "C3, C6, P1-P5",
    "Custo total canal": "P3",
    "Custo Total da Oferta": "P5",
    "Abertura": "P5",
    "Cliques": "P5",
    "template_id": "P5, K-TPL",
    "date": "M1-M6, CT-1",
    "channel": "M2-M6",
    "campaign": "M3-M5",
    "objective": "M1-M4",
    "spend": "C3, M1-M5",
    "impressions": "M2-M5",
    "clicks": "M2-M5",
    "conversions": "M1-M3, M6",
    "reach": "M2",
    "frequency": "M2, M5",
    "installs": "M4",
    "start_trials": "M4",
    "ad_id": "M5",
    "ad_name": "M5",
    "adset_id": "M5",
    "adset_name": "M5",
    "business_date": "M3-M6",
    "campaign_id": "M3, A6",
    "source_event_name": "M3, M4, M6",
    "canonical_event": "M3, M4, M6",
    "effective_attribution_window": "M3, M6",
    "value": "M3, M4",
    "observation_status": "M6",
    "data": "B1-B3",
    "tipo": "B1-B3",
    "propostas_total": "B1-B3",
    "emissoes_total": "B1-B3",
  };
  const sources: Array<[string, Row[]]> = [
    ["activities", input.crm],
    ["paid_media_metrics", input.media],
    ["paid_media_actions", input.mediaActions],
    ["b2c_daily_metrics", input.b2c],
    ["goals", input.goals],
    ["paid_media_budgets", input.budgets],
    ["paid_media_targets", input.targets],
    ["paid_media_collection_runs", input.collectionRuns],
    ["collection_execution_logs", input.collectionLogs],
    ["experiments", input.experiments],
    ["rentabilizacao_activities", input.insurance],
    ["communication_slots", input.communicationSlots],
    ["communication_templates", input.communicationTemplates],
    ["report_metric_certifications", input.metricCertifications],
  ];
  const output: Array<Record<string, unknown>> = [];
  for (const [source, rows] of sources) {
    const fields = [...new Set(rows.flatMap((row) => Object.keys(row)))].sort();
    for (const field of fields) {
      const observed = rows.filter((row) => row[field] !== null && row[field] !== undefined && row[field] !== "").length;
      const privacyExcluded = field === "user_id" || field === "owner_id" || field === "created_by";
      output.push({
        source,
        field,
        row_count: rows.length,
        observed_count: observed,
        coverage: rows.length ? observed / rows.length : null,
        consumer: privacyExcluded ? "" : consumers[field] ?? "",
        exclusion: privacyExcluded
          ? "Excluído do snapshot por privacidade; não é necessário para a decisão."
          : consumers[field]
          ? ""
          : "Preservado na fonte; sem consumidor analítico na v1.0.",
        status: privacyExcluded ? "excluded_privacy" : consumers[field] ? "consumed" : "excluded_justified",
      });
    }
  }
  return output;
}

function buildSlides(
  input: ReportInputs,
  partnerModes: Array<Record<string, unknown>>,
  tabs: Record<string, unknown[][]>,
): SlideRun[] {
  const output: SlideRun[] = [];
  const manifestQuality = input.manifest.quality_status;
  const coverageValues = Object.values(input.manifest.field_coverage ?? {})
    .map(toNumber)
    .filter((value): value is number => value !== null && value >= 0 && value <= 1);
  const averageCoverage = coverageValues.length
    ? coverageValues.reduce((sum, value) => sum + value, 0) / coverageValues.length
    : null;
  const add = (
    contract: SlideContract,
    instance: string,
    partner: string | null,
    view: string | null,
    override?: Partial<SlideRun>,
  ) => {
    const hasView = Boolean(view && tabs[view] && tabs[view].length > 1);
    let eligibility: Eligibility = hasView ? "render" : "omitir_bloqueado";
    let quality = manifestQuality;
    let fallback: string | null = null;
    if (!hasView && contract.fallback_view && tabs[contract.fallback_view]?.length > 1) {
      eligibility = "render_com_limites";
      fallback = contract.fallback_view;
      quality = worstQuality(quality, "directional");
    } else if (!hasView && !contract.conditional && contract.section === "core") {
      eligibility = "render_com_limites";
      quality = "blocked";
    }
    if (contract.implementation_readiness === "bloqueado_fonte") {
      eligibility = contract.conditional ? "omitir_bloqueado" : "render_com_limites";
      quality = worstQuality(quality, "blocked");
    }
    output.push({
      run_id: input.runId,
      slide_instance_id: instance,
      slide_code: contract.slide_code,
      partner,
      source_view: view,
      implementation_readiness: contract.implementation_readiness,
      run_eligibility: eligibility,
      confidence_status: quality,
      confidence_label: labelForQuality(quality),
      data_coverage: averageCoverage,
      cutoff_maturity: input.manifest.data_reading_integrated === input.periodEnd ? 1 : 0.5,
      execution_volume: null,
      missing_required_fields: hasView ? [] : contract.required_fields,
      fallback_applied: fallback,
      evidence: {
        view_exists: hasView,
        native_cutoffs: input.manifest.source_cutoffs,
        gap_closure_days: input.manifest.gap_closure_days,
      },
      ...override,
    });
  };

  for (const contract of input.slideContracts.sort((a, b) => a.display_order - b.display_order)) {
    if (contract.section === "partner") continue;
    const view = contract.source_view;
    const conditionalAvailability: Record<string, boolean> = {
      "K-VISA": Boolean(tabs.VIEW_VISA_OPTIN?.length > 1),
      "K-SEG": Boolean(tabs.VIEW_INSURANCE_SUMMARY?.length > 1),
      "K-TPL": true,
      "K-EXP": Boolean(tabs.VIEW_EXPERIMENTS?.length > 1),
      "K-QLT": Boolean(tabs.VIEW_QUALITY_INCIDENTS?.length > 1),
    };
    if (contract.conditional && conditionalAvailability[contract.slide_code] === false) {
      add(contract, contract.slide_code.toLowerCase(), null, view, {
        run_eligibility: "omitir_bloqueado",
        confidence_status: "blocked",
        confidence_label: "Indisponível",
      });
      continue;
    }
    add(contract, contract.slide_code.toLowerCase(), null, view);
  }

  const partnerContracts = input.slideContracts
    .filter((contract) => contract.section === "partner")
    .sort((a, b) => a.display_order - b.display_order);
  for (const partner of partnerModes.filter((item) => item.mode !== "quality_flag")) {
    const partnerName = String(partner.partner);
    const mode = String(partner.mode);
    const partnerSlug = slug(partnerName);
    for (const contract of partnerContracts) {
      if (mode === "compact" && !["P1", "P4", "P7"].includes(contract.slide_code)) continue;
      const suffix: Record<string, string> = {
        P1: "RESULT",
        P2: "SEGMENTS",
        P3: "CHANNELS",
        P4: "FUNNEL",
        P5: "CAMPAIGNS",
        P6: "PRESSURE",
        P7: "ACTION",
      };
      const view = tabName("VP", partnerName, suffix[contract.slide_code]);
      add(contract, `${contract.slide_code.toLowerCase()}_${partnerSlug}`, partnerName, view, {
        execution_volume: toNumber(partner.dispatches),
      });
    }
  }
  return output;
}

export function buildReport(input: ReportInputs): BuiltReport {
  const previous = previousEquivalentPeriod(input.periodStart, input.periodEnd);
  // Parceiro canônico é derivado aqui, uma única vez, antes de qualquer agrupamento.
  // O bruto continua disponível em `partner_raw` para a trilha de auditoria.
  const crmCurrent = withCanonicalPartner(input.crm.filter((row) =>
    inWindow(sourceDate(row, "crm"), input.periodStart, input.periodEnd)));
  const crmPrevious = withCanonicalPartner(input.crm.filter((row) =>
    inWindow(sourceDate(row, "crm"), previous.start, previous.end)));
  const mediaCurrent = input.media.filter((row) =>
    inWindow(sourceDate(row, "media"), input.periodStart, input.periodEnd));
  const mediaPrevious = input.media.filter((row) =>
    inWindow(sourceDate(row, "media"), previous.start, previous.end));
  const b2cCurrent = input.b2c.filter((row) =>
    inWindow(sourceDate(row, "b2c"), input.periodStart, input.periodEnd));
  const b2cPrevious = input.b2c.filter((row) =>
    inWindow(sourceDate(row, "b2c"), previous.start, previous.end));
  const actionsCurrent = input.mediaActions.filter((row) =>
    inWindow(sourceDate(row, "action"), input.periodStart, input.periodEnd));
  const insuranceCurrent = input.insurance.filter((row) =>
    inWindow(sourceDate(row, "insurance"), input.periodStart, input.periodEnd));

  const crmNow = crmMetrics(crmCurrent);
  const crmBefore = crmMetrics(crmPrevious);
  const mediaNow = mediaMetrics(mediaCurrent);
  const mediaBefore = mediaMetrics(mediaPrevious);
  const partnerModes = buildPartnerModes(crmCurrent, input.config);
  const fieldCoverage = buildFieldCoverage(input);
  const actionCandidates = buildDeterministicCandidates(input, partnerModes, crmCurrent, mediaCurrent);
  const tabs: Record<string, unknown[][]> = {};

  tabs.VIEW_RUN_MANIFEST = objectEntriesTable({
    run_id: input.runId,
    spec_version: "1.0",
    report_profile: input.profile,
    period_start: input.periodStart,
    period_end: input.periodEnd,
    previous_equivalent_start: previous.start,
    previous_equivalent_end: previous.end,
    data_reading_integrated: input.manifest.data_reading_integrated,
    gap_closure_days: input.manifest.gap_closure_days,
    quality_status: input.manifest.quality_status,
    source_cutoffs: input.manifest.source_cutoffs,
  });

  tabs.VIEW_COVERAGE_COMPARABILITY = rowsToTable(
    ["source", "native_cutoff", "integrated_cutoff", "gap_days", "coverage_key", "coverage", "comparability_rule"],
    [
      {
        source: "CRM",
        native_cutoff: input.manifest.source_cutoffs.crm,
        integrated_cutoff: input.manifest.data_reading_integrated,
        gap_days: input.manifest.gap_closure_days,
        coverage_key: "template_id",
        coverage: input.manifest.field_coverage.crm_template,
        comparability_rule: (input.manifest.comparability as Row).crm_vs_b2c_rule,
      },
      {
        source: "Mídia",
        native_cutoff: input.manifest.source_cutoffs.media,
        integrated_cutoff: input.manifest.data_reading_integrated,
        gap_days: input.manifest.gap_closure_days,
        coverage_key: "named_event",
        coverage: input.manifest.field_coverage.media_named_event,
        comparability_rule: "CPA sempre nomeia evento; CPA não é CAC.",
      },
      {
        source: "B2C",
        native_cutoff: input.manifest.source_cutoffs.b2c,
        integrated_cutoff: input.manifest.data_reading_integrated,
        gap_days: input.manifest.gap_closure_days,
        coverage_key: "tipo",
        coverage: b2cCurrent.length ? 1 : null,
        comparability_rule: (input.manifest.comparability as Row).serasa_rule,
      },
    ],
  );

  tabs.VIEW_SCORECARD_INTEGRATED = rowsToTable(
    ["metric", "current", "previous_equivalent", "delta", "state", "definition"],
    [
      { metric: "investimento_midia", current: mediaNow.spend, previous_equivalent: mediaBefore.spend, delta: delta(mediaNow.spend, mediaBefore.spend), state: dataState(mediaNow.spend), definition: "SUM(spend)" },
      { metric: "cartoes_crm", current: crmNow.cards, previous_equivalent: crmBefore.cards, delta: delta(crmNow.cards, crmBefore.cards), state: dataState(crmNow.cards), definition: "SUM(Cartões Gerados)" },
      { metric: "custo_crm", current: crmNow.cost, previous_equivalent: crmBefore.cost, delta: delta(crmNow.cost, crmBefore.cost), state: dataState(crmNow.cost), definition: "SUM(Custo Total Campanha)" },
      { metric: "cac_crm", current: crmNow.cac, previous_equivalent: crmBefore.cac, delta: delta(crmNow.cac, crmBefore.cac), state: dataState(crmNow.cac), definition: "SUM(custo)/SUM(cartões)" },
      { metric: "conversao_crm_base", current: crmNow.card_rate_base, previous_equivalent: crmBefore.card_rate_base, delta: delta(crmNow.card_rate_base, crmBefore.card_rate_base), state: dataState(crmNow.card_rate_base), definition: "SUM(cartões)/SUM(base acionável)" },
    ],
  );

  const daily = new Map<string, Record<string, unknown>>();
  for (const row of crmCurrent) {
    const day = toIsoDay(sourceDate(row, "crm"));
    const item = daily.get(day) ?? { date: day, crm_cards: 0, crm_cost: 0, media_spend: 0 };
    item.crm_cards = (toNumber(item.crm_cards) ?? 0) + (toNumber(row["Cartões Gerados"]) ?? 0);
    item.crm_cost = (toNumber(item.crm_cost) ?? 0) + (toNumber(row["Custo Total Campanha"]) ?? 0);
    daily.set(day, item);
  }
  for (const row of mediaCurrent) {
    const day = toIsoDay(sourceDate(row, "media"));
    const item = daily.get(day) ?? { date: day, crm_cards: 0, crm_cost: 0, media_spend: 0 };
    item.media_spend = (toNumber(item.media_spend) ?? 0) + (toNumber(row.spend) ?? 0);
    daily.set(day, item);
  }
  let cumulativeCards = 0;
  let cumulativeCrmCost = 0;
  let cumulativeMediaSpend = 0;
  const dailyRows = [...daily.values()].sort((a, b) => String(a.date).localeCompare(String(b.date))).map((row) => {
    cumulativeCards += toNumber(row.crm_cards) ?? 0;
    cumulativeCrmCost += toNumber(row.crm_cost) ?? 0;
    cumulativeMediaSpend += toNumber(row.media_spend) ?? 0;
    return {
      ...row,
      cumulative_cards: cumulativeCards,
      cumulative_crm_cost: cumulativeCrmCost,
      cumulative_media_spend: cumulativeMediaSpend,
      cumulative_cac: cumulativeCards ? cumulativeCrmCost / cumulativeCards : null,
    };
  });
  tabs.VIEW_PACING_ISODAYS = rowsToTable(
    ["date", "crm_cards", "crm_cost", "media_spend", "cumulative_cards", "cumulative_crm_cost", "cumulative_media_spend", "cumulative_cac"],
    dailyRows,
  );

  tabs.VIEW_PARTNER_ROUTER = rowsToTable(
    ["partner", "bu", "dispatches", "base", "cards", "cost", "cac", "conversion", "card_share", "segment_count", "channel_count", "strategic", "material", "variety", "signal", "mode", "alert"],
    partnerModes,
  );

  // Trilha de auditoria da resolução de parceiro: mostra de onde veio cada
  // canonical_partner e permite reverter a leitura ao dado bruto.
  const resolutionRows = [...groupRows(crmCurrent, [
    "partner_raw",
    "canonical_partner",
    "partner_classification_reason",
  ]).values()].map((rows) => {
    const metrics = crmMetrics(rows);
    return {
      partner_raw: rows[0]?.partner_raw ?? "(vazio)",
      canonical_partner: rows[0]?.canonical_partner,
      reason: rows[0]?.partner_classification_reason,
      confidence: rows[0]?.partner_classification_confidence,
      bu: [...new Set(rows.map((row) => String(row.BU ?? "")).filter(Boolean))].join(", "),
      dispatches: metrics.dispatches,
      cards: metrics.cards,
      cost: metrics.cost,
    };
  }).sort((a, b) => (toNumber(b.cards) ?? 0) - (toNumber(a.cards) ?? 0));
  tabs.VIEW_PARTNER_RESOLUTION = rowsToTable(
    ["partner_raw", "canonical_partner", "reason", "confidence", "bu", "dispatches", "cards", "cost"],
    resolutionRows,
  );

  const driverRows: Array<Record<string, unknown>> = [];
  for (const rows of groupRows(crmCurrent, ["canonical_partner", "Segmento", "Canal"]).values()) {
    const metrics = crmMetrics(rows);
    driverRows.push({
      partner: rows[0]?.canonical_partner,
      segment: rows[0]?.Segmento,
      channel: rows[0]?.Canal,
      cards: metrics.cards,
      base: metrics.base,
      cost: metrics.cost,
      cac: metrics.cac,
      conversion: metrics.card_rate_base,
    });
  }
  tabs.VIEW_CAC_DRIVERS = rowsToTable(
    ["partner", "segment", "channel", "cards", "base", "cost", "cac", "conversion"],
    driverRows.sort((a, b) => (toNumber(b.cards) ?? 0) - (toNumber(a.cards) ?? 0)),
  );

  tabs.VIEW_ACTION_QUEUE = rowsToTable(
    ["bucket", "domain", "partner", "signal", "impact", "probable_cause", "evidence_refs", "reading_limit", "action_text", "owner", "due_date", "success_metric", "confidence_status", "review_status"],
    actionCandidates,
  );
  tabs.VIEW_ACTION_OUTCOMES = rowsToTable(
    ["action_candidate_id", "metric_name", "baseline_value", "expected_value", "observed_value", "unit", "window_start", "window_end", "outcome_status", "conclusion"],
    input.actionOutcomes,
  );

  for (const partner of partnerModes.filter((item) => item.mode !== "quality_flag")) {
    const partnerName = String(partner.partner);
    const rows = crmCurrent.filter((row) => String(row.canonical_partner ?? "") === partnerName);
    const previousRows = crmPrevious.filter((row) => String(row.canonical_partner ?? "") === partnerName);
    const currentMetrics = crmMetrics(rows);
    const previousMetrics = crmMetrics(previousRows);
    tabs[tabName("VP", partnerName, "RESULT")] = rowsToTable(
      ["partner", "metric", "current", "previous_equivalent", "delta", "state"],
      [
        { partner: partnerName, metric: "cards", current: currentMetrics.cards, previous_equivalent: previousMetrics.cards, delta: delta(currentMetrics.cards, previousMetrics.cards), state: dataState(currentMetrics.cards) },
        { partner: partnerName, metric: "cost", current: currentMetrics.cost, previous_equivalent: previousMetrics.cost, delta: delta(currentMetrics.cost, previousMetrics.cost), state: dataState(currentMetrics.cost) },
        { partner: partnerName, metric: "cac", current: currentMetrics.cac, previous_equivalent: previousMetrics.cac, delta: delta(currentMetrics.cac, previousMetrics.cac), state: dataState(currentMetrics.cac) },
        { partner: partnerName, metric: "conversion", current: currentMetrics.card_rate_base, previous_equivalent: previousMetrics.card_rate_base, delta: delta(currentMetrics.card_rate_base, previousMetrics.card_rate_base), state: dataState(currentMetrics.card_rate_base) },
      ],
    );
    const segmentRows = [...groupRows(rows, ["Segmento"]).values()].map((group) => {
      const metrics = crmMetrics(group);
      return { segment: group[0]?.Segmento, cards: metrics.cards, base: metrics.base, cost: metrics.cost, cac: metrics.cac, conversion: metrics.card_rate_base };
    });
    tabs[tabName("VP", partnerName, "SEGMENTS")] = rowsToTable(
      ["segment", "cards", "base", "cost", "cac", "conversion"],
      segmentRows.sort((a, b) => (toNumber(b.cards) ?? 0) - (toNumber(a.cards) ?? 0)),
    );
    const channelRows = [...groupRows(rows, ["Segmento", "Canal"]).values()].map((group) => {
      const metrics = crmMetrics(group);
      return { segment: group[0]?.Segmento, channel: group[0]?.Canal, cards: metrics.cards, base: metrics.base, cost: metrics.cost, channel_cost: metrics.channel_cost, cac: ratio(metrics.channel_cost ?? metrics.cost, metrics.cards), conversion: metrics.card_rate_base };
    });
    tabs[tabName("VP", partnerName, "CHANNELS")] = rowsToTable(
      ["segment", "channel", "cards", "base", "cost", "channel_cost", "cac", "conversion"],
      channelRows.sort((a, b) => (toNumber(b.cards) ?? 0) - (toNumber(a.cards) ?? 0)),
    );
    tabs[tabName("VP", partnerName, "FUNNEL")] = rowsToTable(
      ["stage", "value", "rate_from_previous", "state"],
      [
        { stage: "Base acionável", value: currentMetrics.base, rate_from_previous: null, state: dataState(currentMetrics.base) },
        { stage: "Propostas", value: currentMetrics.proposals, rate_from_previous: ratio(currentMetrics.proposals, currentMetrics.base), state: dataState(currentMetrics.proposals) },
        { stage: "Aprovados", value: currentMetrics.approved, rate_from_previous: ratio(currentMetrics.approved, currentMetrics.proposals), state: dataState(currentMetrics.approved) },
        { stage: "Cartões", value: currentMetrics.cards, rate_from_previous: ratio(currentMetrics.cards, currentMetrics.approved), state: dataState(currentMetrics.cards) },
      ],
    );
    const campaignRows = [...groupRows(rows, ["Safra", "jornada", "Activity name / Taxonomia", "Segmento", "Canal", "template_id"]).values()].map((group) => {
      const metrics = crmMetrics(group);
      return {
        safra: group[0]?.Safra,
        journey: group[0]?.jornada,
        activity_name: group[0]?.["Activity name / Taxonomia"],
        segment: group[0]?.Segmento,
        channel: group[0]?.Canal,
        template_id: group[0]?.template_id,
        dispatches: metrics.dispatches,
        base: metrics.base,
        opens: metrics.opens,
        clicks: metrics.clicks,
        proposals: metrics.proposals,
        approved: metrics.approved,
        cards: metrics.cards,
        cost: metrics.cost,
        open_rate_proxy_base: metrics.open_rate_proxy_base,
        click_rate_open: metrics.click_rate_open,
        conversion: metrics.card_rate_base,
        cac: metrics.cac,
      };
    });
    tabs[tabName("VP", partnerName, "CAMPAIGNS")] = rowsToTable(
      ["safra", "journey", "activity_name", "segment", "channel", "template_id", "dispatches", "base", "opens", "clicks", "proposals", "approved", "cards", "cost", "open_rate_proxy_base", "click_rate_open", "conversion", "cac"],
      campaignRows.sort((a, b) => (toNumber(b.cards) ?? 0) - (toNumber(a.cards) ?? 0)),
    );
    tabs[tabName("VP", partnerName, "PRESSURE")] = rowsToTable(
      ["segment", "dispatches", "base_sum", "cards", "dispatches_per_100k_base", "interpretation_limit"],
      [...groupRows(rows, ["Segmento"]).values()].map((group) => {
        const metrics = crmMetrics(group);
        return {
          segment: group[0]?.Segmento,
          dispatches: metrics.dispatches,
          base_sum: metrics.base,
          cards: metrics.cards,
          dispatches_per_100k_base: metrics.base ? metrics.dispatches / metrics.base * 100_000 : null,
          interpretation_limit: "Proxy agregado; não deduplica pessoas e não mede unsubscribe.",
        };
      }),
    );
    tabs[tabName("VP", partnerName, "ACTION")] = rowsToTable(
      ["bucket", "signal", "action_text", "success_metric", "confidence_status", "review_status"],
      actionCandidates.filter((candidate) => String(candidate.partner ?? "") === partnerName).slice(0, 1),
    );
  }

  const mediaPacingRows = [...groupRows(mediaCurrent, ["objective", "channel"]).values()].map((rows) => {
    const metrics = mediaMetrics(rows);
    const objective = String(rows[0]?.objective ?? "");
    const channel = String(rows[0]?.channel ?? "");
    const month = input.periodStart.slice(0, 7);
    const certifiedBudgetRows = input.metricCertifications.filter((row) =>
      String(row.certification_status ?? "") === "certified" &&
      String(row.metric_domain ?? "") === "media_budget" &&
      String(row.period_key ?? "") === month &&
      (
        String(row.metric_key ?? "") === `${channel}|${objective}` ||
        String(row.metric_key ?? "") === objective
      ));
    const budget = sumNullable(certifiedBudgetRows, "target_value");
    return {
      objective,
      channel,
      spend: metrics.spend,
      platform_result: metrics.conversions,
      budget,
      budget_state: dataState(budget),
      pacing: ratio(metrics.spend, budget),
      cpa_event: objective ? `CPA ${objective}` : "CPA evento não certificado",
      cpa_value: metrics.cpa_platform,
    };
  });
  tabs.VIEW_MEDIA_PACING = rowsToTable(
    ["objective", "channel", "spend", "platform_result", "budget", "budget_state", "pacing", "cpa_event", "cpa_value"],
    mediaPacingRows,
  );

  const mediaMixRows = [...groupRows(mediaCurrent, ["channel", "objective"]).values()].map((rows) => {
    const metrics = mediaMetrics(rows);
    return {
      channel: rows[0]?.channel,
      objective: rows[0]?.objective,
      spend: metrics.spend,
      impressions: metrics.impressions,
      clicks: metrics.clicks,
      conversions: metrics.conversions,
      reach: metrics.reach,
      frequency_weighted: metrics.frequency_weighted,
      ctr: metrics.ctr,
      cpc: metrics.cpc,
      cpa_event: rows[0]?.objective ? `CPA ${rows[0]?.objective}` : "CPA evento não certificado",
      cpa_value: metrics.cpa_platform,
    };
  });
  tabs.VIEW_MEDIA_MIX = rowsToTable(
    ["channel", "objective", "spend", "impressions", "clicks", "conversions", "reach", "frequency_weighted", "ctr", "cpc", "cpa_event", "cpa_value"],
    mediaMixRows,
  );

  const campaignRows = [...groupRows(mediaCurrent, ["channel", "campaign", "objective"]).values()].map((rows) => {
    const metrics = mediaMetrics(rows);
    const canonicalId = canonicalCampaignKey(rows[0], input.aliases);
    const events = actionsCurrent.filter((action) =>
      String(action.channel ?? "").toLowerCase() === String(rows[0]?.channel ?? "").toLowerCase() &&
      (String(action.campaign_name ?? "") === String(rows[0]?.campaign ?? "") ||
        String(action.campaign_id ?? "") === canonicalId.split(":").slice(-1)[0]));
    const eventGroups = [...groupRows(events, ["canonical_event", "source_event_name", "effective_attribution_window"]).values()]
      .map((group) => ({
        event: group[0]?.canonical_event ?? group[0]?.source_event_name,
        attribution_window: group[0]?.effective_attribution_window ?? group[0]?.reported_attribution_window,
        value: sumNullable(group, "value"),
      }))
      .sort((a, b) => (toNumber(b.value) ?? 0) - (toNumber(a.value) ?? 0));
    const primaryEvent = eventGroups[0];
    return {
      canonical_campaign_id: canonicalId,
      display_name: rows[0]?.campaign,
      channel: rows[0]?.channel,
      objective: rows[0]?.objective,
      spend: metrics.spend,
      result_event: primaryEvent?.event ?? rows[0]?.objective ?? "evento não certificado",
      result_value: primaryEvent?.value ?? metrics.conversions,
      attribution_window: primaryEvent?.attribution_window ?? "",
      cpa_event: primaryEvent?.event ? `CPA ${primaryEvent.event}` : "CPA plataforma",
      cpa_value: ratio(metrics.spend, primaryEvent?.value ?? metrics.conversions),
      identity_status: canonicalId.includes(":name:") ? "alias_pending" : "source_id",
    };
  });
  tabs.VIEW_MEDIA_CAMPAIGNS = rowsToTable(
    ["canonical_campaign_id", "display_name", "channel", "objective", "spend", "result_event", "result_value", "attribution_window", "cpa_event", "cpa_value", "identity_status"],
    campaignRows.sort((a, b) => (toNumber(b.spend) ?? 0) - (toNumber(a.spend) ?? 0)),
  );

  const mediaFunnelRows = [...groupRows(mediaCurrent, ["channel", "campaign"]).values()].map((rows) => {
    const metrics = mediaMetrics(rows);
    return {
      canonical_campaign_id: canonicalCampaignKey(rows[0], input.aliases),
      campaign: rows[0]?.campaign,
      channel: rows[0]?.channel,
      impressions: metrics.impressions,
      clicks: metrics.clicks,
      installs: metrics.installs,
      start_trials: metrics.start_trials,
      impression_to_click: metrics.ctr,
      click_to_install: ratio(metrics.installs, metrics.clicks),
      install_to_trial: ratio(metrics.start_trials, metrics.installs),
    };
  });
  tabs.VIEW_MEDIA_FUNNEL = rowsToTable(
    ["canonical_campaign_id", "campaign", "channel", "impressions", "clicks", "installs", "start_trials", "impression_to_click", "click_to_install", "install_to_trial"],
    mediaFunnelRows,
  );

  const creativeRows = [...groupRows(mediaCurrent, ["channel", "campaign", "adset_id", "adset_name", "ad_id", "ad_name"]).values()].map((rows) => {
    const metrics = mediaMetrics(rows);
    return {
      channel: rows[0]?.channel,
      campaign: rows[0]?.campaign,
      adset_id: rows[0]?.adset_id,
      adset_name: rows[0]?.adset_name,
      ad_id: rows[0]?.ad_id,
      ad_name: rows[0]?.ad_name,
      spend: metrics.spend,
      impressions: metrics.impressions,
      clicks: metrics.clicks,
      ctr: metrics.ctr,
      cpc: metrics.cpc,
      frequency_weighted: metrics.frequency_weighted,
      result: metrics.conversions,
    };
  });
  tabs.VIEW_MEDIA_CREATIVES = rowsToTable(
    ["channel", "campaign", "adset_id", "adset_name", "ad_id", "ad_name", "spend", "impressions", "clicks", "ctr", "cpc", "frequency_weighted", "result"],
    creativeRows.filter((row) => row.ad_id || row.ad_name),
  );

  tabs.VIEW_MEDIA_QUALITY = rowsToTable(
    ["channel", "objective", "rows", "spend", "clicks", "conversions", "named_event_coverage", "attribution_coverage", "quality_status"],
    mediaMixRows.map((row) => ({
      channel: row.channel,
      objective: row.objective,
      rows: mediaCurrent.filter((item) => item.channel === row.channel && item.objective === row.objective).length,
      spend: row.spend,
      clicks: row.clicks,
      conversions: row.conversions,
      named_event_coverage: input.manifest.field_coverage.media_named_event,
      attribution_coverage: input.manifest.field_coverage.media_attribution_window,
      quality_status: (toNumber(row.clicks) ?? 0) > 200 && row.conversions === 0 ? "suspect" : input.manifest.quality_status,
    })),
  );

  const b2cGroups = [...groupRows(b2cCurrent, ["tipo"]).values()].map((rows) => ({
    source_type: rows[0]?.tipo,
    proposals: sumNullable(rows, "propostas_total"),
    emissions: sumNullable(rows, "emissoes_total"),
    conversion: ratio(sumNullable(rows, "emissoes_total"), sumNullable(rows, "propostas_total")),
    additive: false,
  }));
  tabs.VIEW_B2C_PARALLEL_FUNNELS = rowsToTable(
    ["source_type", "proposals", "emissions", "conversion", "additive", "comparison_note"],
    [
      ...b2cGroups.map((row) => ({ ...row, comparison_note: "Origens B2C exibidas em paralelo; nunca somar CRM e Serasa." })),
      { source_type: "CRM activities", proposals: crmNow.proposals, emissions: crmNow.cards, conversion: ratio(crmNow.cards, crmNow.proposals), additive: false, comparison_note: (input.manifest.comparability as Row).crm_vs_b2c_rule },
    ],
  );
  tabs.VIEW_B2C_DAILY = rowsToTable(
    ["date", "source_type", "proposals", "emissions", "proposal_state", "emission_state"],
    b2cCurrent.map((row) => ({
      date: toIsoDay(row.data),
      source_type: row.tipo,
      proposals: toNumber(row.propostas_total),
      emissions: toNumber(row.emissoes_total),
      proposal_state: dataState(row.propostas_total),
      emission_state: dataState(row.emissoes_total),
    })),
  );

  tabs.VIEW_TEMPLATE_COVERAGE = rowsToTable(
    ["scope", "total", "mapped", "coverage", "status"],
    [
      {
        scope: "activities.template_id",
        total: input.crm.length,
        mapped: input.crm.filter((row) => String(row.template_id ?? "").trim()).length,
        coverage: input.manifest.field_coverage.crm_template,
        status: (toNumber(input.manifest.field_coverage.crm_template) ?? 0) >= 0.8 ? "adequate" : "backlog_visible",
      },
      {
        scope: "communication_slots.current_template_id",
        total: input.communicationSlots.length,
        mapped: input.communicationSlots.filter((row) => String(row.current_template_id ?? "").trim()).length,
        coverage: input.manifest.field_coverage.communication_slot_coverage,
        status: (toNumber(input.manifest.field_coverage.communication_slot_coverage) ?? 0) >= 0.8 ? "adequate" : "backlog_visible",
      },
    ],
  );
  tabs.VIEW_EXPERIMENTS = rowsToTable(
    ["id", "title", "hypothesis", "status", "decision", "learning", "started_on", "ended_on"],
    input.experiments.filter((row) => String(row.status ?? "").toLowerCase() !== "rascunho").map((row) => ({
      id: row.id,
      title: row.titulo,
      hypothesis: row.hipotese,
      status: row.status,
      decision: row.decisao,
      learning: row.aprendizado,
      started_on: row.iniciado_em,
      ended_on: row.encerrado_em,
    })),
  );
  tabs.VIEW_INSURANCE_SUMMARY = rowsToTable(
    ["metric", "value", "state", "cutoff"],
    [
      { metric: "crm_dispatches", value: insuranceCurrent.length, state: dataState(insuranceCurrent.length), cutoff: input.manifest.source_cutoffs.insurance },
      { metric: "crm_base", value: crmMetrics(insuranceCurrent).base, state: dataState(crmMetrics(insuranceCurrent).base), cutoff: input.manifest.source_cutoffs.insurance },
      { metric: "crm_cards", value: crmMetrics(insuranceCurrent).cards, state: dataState(crmMetrics(insuranceCurrent).cards), cutoff: input.manifest.source_cutoffs.insurance },
      { metric: "media_spend", value: mediaMetrics(mediaCurrent.filter((row) => classifyMediaFront(row.campaign) === "Seguros")).spend, state: dataState(mediaMetrics(mediaCurrent.filter((row) => classifyMediaFront(row.campaign) === "Seguros")).spend), cutoff: input.manifest.source_cutoffs.media },
    ],
  );
  tabs.VIEW_VISA_OPTIN = rowsToTable(
    ["channel", "campaign", "spend", "platform_result", "measurement_rule"],
    mediaCurrent
      .filter((row) => classifyMediaFront(row.campaign) === "Marca B2C (Copa)")
      .map((row) => ({
        channel: row.channel,
        campaign: row.campaign,
        spend: row.spend,
        platform_result: row.conversions,
        measurement_rule: "Medir por opt-in/evento nomeado; nunca CAC.",
      })),
  );
  tabs.VIEW_QUALITY_INCIDENTS = rowsToTable(
    ["source", "status", "started_at", "finished_at", "rows_received", "rows_rejected", "error_summary"],
    input.collectionRuns.filter((row) =>
      !["success", "done", "completed"].includes(String(row.status ?? "").toLowerCase()) ||
      (toNumber(row.rows_rejected) ?? 0) > 0),
  );

  const matrixRows = [...groupRows(crmCurrent, ["BU", "canonical_partner", "Segmento"]).values()].map((rows) => {
    const metrics = crmMetrics(rows);
    return {
      bu: rows[0]?.BU,
      partner: rows[0]?.canonical_partner,
      segment: rows[0]?.Segmento,
      dispatches: metrics.dispatches,
      base: metrics.base,
      proposals: metrics.proposals,
      approved: metrics.approved,
      cards: metrics.cards,
      cost: metrics.cost,
      cac: metrics.cac,
      conversion: metrics.card_rate_base,
    };
  });
  tabs.VIEW_GROWTH_MATRIX = rowsToTable(
    ["bu", "partner", "segment", "dispatches", "base", "proposals", "approved", "cards", "cost", "cac", "conversion"],
    matrixRows,
  );
  tabs.VIEW_FIELD_COVERAGE = rowsToTable(
    ["source", "field", "row_count", "observed_count", "coverage", "consumer", "exclusion", "status"],
    fieldCoverage,
  );
  tabs.VIEW_CAMPAIGN_ALIASES = rowsToTable(
    ["canonical_campaign_id", "platform", "source_campaign_id", "source_campaign_name", "certification_status"],
    input.aliases,
  );
  tabs.VIEW_COLLECTION_LOGS = rowsToTable(
    ["source", "status", "mode", "since_date", "until_date", "data_as_of", "started_at", "finished_at", "rows_received", "rows_written", "rows_rejected", "error_summary"],
    input.collectionRuns,
  );
  tabs.VIEW_METRIC_DICTIONARY = rowsToTable(
    ["metric", "definition", "unit", "good_direction", "missing_rule"],
    [
      { metric: "CAC CRM", definition: "SUM(Custo Total Campanha)/SUM(Cartões Gerados)", unit: "R$/cartão", good_direction: "down", missing_rule: "—" },
      { metric: "Conversão CRM", definition: "SUM(Cartões Gerados)/SUM(Base Acionável)", unit: "%", good_direction: "up", missing_rule: "—" },
      { metric: "CTR", definition: "SUM(clicks)/SUM(impressions)", unit: "%", good_direction: "up", missing_rule: "—" },
      { metric: "CPC", definition: "SUM(spend)/SUM(clicks)", unit: "R$/click", good_direction: "down", missing_rule: "—" },
      { metric: "CPA evento", definition: "SUM(spend)/SUM(evento nomeado)", unit: "R$/evento", good_direction: "down", missing_rule: "—" },
    ],
  );
  tabs.VIEW_AGGREGATION_RULES = rowsToTable(
    ["rule_code", "rule"],
    [
      { rule_code: "CT-2", rule: "Null nunca vira zero; missing não entra em delta." },
      { rule_code: "CT-3", rule: "Taxas sempre SUM(numerador)/SUM(denominador)." },
      { rule_code: "CT-4", rule: "Comparação primária usa período anterior com a mesma quantidade de dias." },
      { rule_code: "CT-7", rule: "Aliases são exatos e governados; similaridade textual nunca funde campanhas." },
    ],
  );
  tabs.VIEW_CONFIDENCE_RULES = rowsToTable(
    ["canonical_status", "display_label", "definition"],
    [
      { canonical_status: "confirmed", display_label: "Alta", definition: "Cobertura, maturidade e volume válidos." },
      { canonical_status: "directional", display_label: "Média", definition: "Uma dimensão degradada; leitura com limite." },
      { canonical_status: "suspect", display_label: "Baixa", definition: "Duas dimensões degradadas ou anomalia de qualidade." },
      { canonical_status: "blocked", display_label: "Indisponível", definition: "Campo obrigatório ausente sem fallback válido." },
    ],
  );

  const slides = buildSlides(input, partnerModes, tabs);
  tabs.SLIDE_READINESS = rowsToTable(
    ["run_id", "slide_instance_id", "slide_code", "partner", "source_view", "implementation_readiness", "run_eligibility", "confidence_status", "confidence_label", "data_coverage", "cutoff_maturity", "execution_volume", "missing_required_fields", "fallback_applied", "evidence"],
    slides,
  );
  tabs.VIEW_REGISTRY = rowsToTable(
    ["slide_instance_id", "slide_code", "section", "title", "audience", "source_view", "partner", "eligibility", "confidence", "display_order"],
    slides.map((slide) => {
      const contract = input.slideContracts.find((item) => item.slide_code === slide.slide_code);
      return {
        slide_instance_id: slide.slide_instance_id,
        slide_code: slide.slide_code,
        section: contract?.section,
        title: slide.partner ? `${contract?.title} — ${slide.partner}` : contract?.title,
        audience: contract?.audience,
        source_view: slide.source_view,
        partner: slide.partner,
        eligibility: slide.run_eligibility,
        confidence: slide.confidence_label,
        display_order: (contract?.display_order ?? 999) + (slide.partner ? partnerModes.findIndex((item) => item.partner === slide.partner) * 10 : 0),
      };
    }).sort((a, b) => (toNumber(a.display_order) ?? 999) - (toNumber(b.display_order) ?? 999)),
  );

  return {
    tabs,
    slides,
    actionCandidates,
    partnerModes,
    previousPeriod: previous,
    fieldCoverage,
  };
}
