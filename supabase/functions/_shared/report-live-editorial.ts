export type EditorialRow = Record<string, unknown>;

export type RulerVerdict =
  | "serie_insuficiente"
  | "amostra_insuficiente"
  | "regime_incomparavel"
  | "dentro_da_faixa"
  | "acima_da_faixa"
  | "abaixo_da_faixa";

export type RulerMetricKey =
  | "disparos"
  | "base_acionavel"
  | "propostas"
  | "aprovados"
  | "cartoes"
  | "custo"
  | "cac"
  | "tx_finalizacao"
  | "tx_aprovacao"
  | "tx_proposta";

export interface RulerMetricDefinition {
  key: RulerMetricKey;
  label: string;
  kind: "volume" | "currency" | "rate";
  valueField: string;
  minimumField: string;
  maximumField: string;
  validMonthsField: string | null;
}

export interface RulerElements {
  metric: RulerMetricDefinition;
  value: number | null;
  previousValue: number | null;
  minimum: number | null;
  maximum: number | null;
  valueText: string;
  deltaText: string;
  rangeText: string;
  verdict: RulerVerdict | null;
  verdictText: string;
  showChart: boolean;
  showBounds: boolean;
  currentMonthOpen: boolean;
  comparisonEligible: boolean;
  limitation: string;
  series: EditorialRow[];
}

const metric = (
  key: RulerMetricKey,
  label: string,
  kind: RulerMetricDefinition["kind"],
  minimumField: string,
  maximumField: string,
  validMonthsField: string | null = null,
): RulerMetricDefinition => ({
  key,
  label,
  kind,
  valueField: key,
  minimumField,
  maximumField,
  validMonthsField,
});

export const RULER_METRICS: Record<RulerMetricKey, RulerMetricDefinition> = {
  disparos: metric("disparos", "Disparos", "volume", "disparos_min_6m", "disparos_max_6m"),
  base_acionavel: metric(
    "base_acionavel",
    "Base acionável",
    "volume",
    "base_acionavel_min_6m",
    "base_acionavel_max_6m",
  ),
  propostas: metric("propostas", "Propostas", "volume", "propostas_min_6m", "propostas_max_6m"),
  aprovados: metric("aprovados", "Aprovados", "volume", "aprovados_min_6m", "aprovados_max_6m"),
  cartoes: metric("cartoes", "Cartões", "volume", "cartoes_min_6m", "cartoes_max_6m"),
  custo: metric("custo", "Custo CRM", "currency", "custo_min_6m", "custo_max_6m"),
  cac: metric("cac", "CAC", "currency", "cac_min_6m", "cac_max_6m", "cac_meses_validos_6m"),
  tx_finalizacao: metric(
    "tx_finalizacao",
    "Finalização",
    "rate",
    "tx_final_min_6m",
    "tx_final_max_6m",
    "tx_final_meses_validos_6m",
  ),
  tx_aprovacao: metric(
    "tx_aprovacao",
    "Aprovação",
    "rate",
    "tx_aprovacao_min_6m",
    "tx_aprovacao_max_6m",
    "tx_aprovacao_meses_validos_6m",
  ),
  tx_proposta: metric(
    "tx_proposta",
    "Proposta / base",
    "rate",
    "tx_proposta_min_6m",
    "tx_proposta_max_6m",
    "tx_proposta_meses_validos_6m",
  ),
};

export const editorialNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = typeof value === "string"
    ? Number(value.includes(",") ? value.replace(/\./g, "").replace(",", ".") : value)
    : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const boolValue = (value: unknown): boolean => value === true || String(value).toLowerCase() === "true";

const monthKey = (value: unknown): string => String(value ?? "").slice(0, 10);

const formatNumber = (value: number | null, maximumFractionDigits = 0): string =>
  value === null
    ? "—"
    : new Intl.NumberFormat("pt-BR", { maximumFractionDigits }).format(value);

const formatCurrency = (value: number | null): string =>
  value === null
    ? "—"
    : new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);

const formatRate = (value: number | null): string =>
  value === null
    ? "—"
    : new Intl.NumberFormat("pt-BR", {
      style: "percent",
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value);

export function formatRulerValue(definition: RulerMetricDefinition, value: number | null): string {
  if (definition.kind === "currency") return formatCurrency(value);
  if (definition.kind === "rate") return formatRate(value);
  return formatNumber(value);
}

function formatDelta(
  definition: RulerMetricDefinition,
  current: number | null,
  previous: number | null,
): string {
  if (current === null || previous === null) return "";
  if (definition.kind === "rate") {
    const points = (current - previous) * 100;
    const arrow = points > 0 ? "▲" : points < 0 ? "▼" : "→";
    return `${arrow} ${formatNumber(Math.abs(points), 1)} p.p.`;
  }
  if (previous === 0) return "";
  const relative = (current - previous) / Math.abs(previous);
  const arrow = relative > 0 ? "▲" : relative < 0 ? "▼" : "→";
  return `${arrow} ${formatRate(Math.abs(relative))}`;
}

const verdictLabel = (verdict: RulerVerdict | null): string => {
  if (verdict === "serie_insuficiente") return "série insuficiente";
  if (verdict === "amostra_insuficiente") return "amostra insuficiente";
  if (verdict === "regime_incomparavel") return "regime incomparável";
  if (verdict === "dentro_da_faixa") return "dentro";
  if (verdict === "acima_da_faixa") return "acima";
  if (verdict === "abaixo_da_faixa") return "abaixo";
  return "sem comparação";
};

/**
 * Única implementação da régua mensal. A linha corrente vem da view
 * canônica; o contexto contém apenas outras linhas do mesmo snapshot imutável.
 * Nenhuma métrica material é reconstituída a partir de activities.
 */
export function buildMonthlyRuler(
  currentRow: EditorialRow,
  snapshotRows: EditorialRow[],
  metricKey: RulerMetricKey,
): RulerElements {
  const definition = RULER_METRICS[metricKey];
  const currentMonth = monthKey(currentRow.mes);
  const partner = String(currentRow.parceiro ?? "");
  const allSeries = snapshotRows
    .filter((row) => String(row.parceiro ?? "") === partner && monthKey(row.mes) <= currentMonth)
    .sort((a, b) => monthKey(a.mes).localeCompare(monthKey(b.mes)))
    .slice(-6);
  const currentRegime = String(currentRow.regime_serie ?? "");
  const regimes = new Set(allSeries.map((row) => String(row.regime_serie ?? "")));
  const regimeChanged = regimes.size > 1;
  const series = regimeChanged
    ? allSeries.filter((row) => String(row.regime_serie ?? "") === currentRegime)
    : allSeries;
  const value = editorialNumber(currentRow[definition.valueField]);
  const minimum = editorialNumber(currentRow[definition.minimumField]);
  const maximum = editorialNumber(currentRow[definition.maximumField]);
  const monthsObserved = editorialNumber(currentRow.meses_observados) ?? 0;
  const validMonths = definition.validMonthsField
    ? editorialNumber(currentRow[definition.validMonthsField]) ?? 0
    : monthsObserved;
  const currentMonthOpen = !boolValue(currentRow.mes_fechado);
  const previousRow = [...series].reverse().find((row) =>
    monthKey(row.mes) < currentMonth &&
    boolValue(row.mes_fechado) &&
    String(row.regime_serie ?? "") === currentRegime &&
    editorialNumber(row[definition.valueField]) !== null
  );
  const previousValue = previousRow ? editorialNumber(previousRow[definition.valueField]) : null;

  let verdict: RulerVerdict | null = null;
  if (!currentMonthOpen && value !== null) {
    if (monthsObserved < 2) verdict = "serie_insuficiente";
    else if (monthsObserved <= 3) verdict = "amostra_insuficiente";
    else if (validMonths < 4) verdict = "amostra_insuficiente";
    else if (regimeChanged) verdict = "regime_incomparavel";
    else if (minimum !== null && maximum !== null) {
      verdict = value < minimum
        ? "abaixo_da_faixa"
        : value > maximum
        ? "acima_da_faixa"
        : "dentro_da_faixa";
    }
  }

  const showChart = monthsObserved >= 2 && series.length >= 2 && value !== null;
  const showBounds = showChart && monthsObserved >= 4 && validMonths >= 4 && !regimeChanged &&
    minimum !== null && maximum !== null;
  const comparisonEligible = !currentMonthOpen && previousValue !== null && !regimeChanged;
  const rangeText = showBounds
    ? `faixa ${formatRulerValue(definition, minimum)} – ${formatRulerValue(definition, maximum)}`
    : regimeChanged
    ? "faixa suprimida no corte de regime"
    : "faixa sem amostra suficiente";
  const limitation = regimeChanged ? String(currentRow.limitacao_medicao ?? "") : "";

  return {
    metric: definition,
    value,
    previousValue,
    minimum,
    maximum,
    valueText: formatRulerValue(definition, value),
    deltaText: comparisonEligible ? formatDelta(definition, value, previousValue) : "",
    rangeText,
    verdict,
    verdictText: currentMonthOpen ? "mês aberto · sem comparação" : verdictLabel(verdict),
    showChart,
    showBounds,
    currentMonthOpen,
    comparisonEligible,
    limitation,
    series,
  };
}
