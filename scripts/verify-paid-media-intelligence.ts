import { dataService } from '../src/services/dataService';
import {
  compareEquivalentMonth,
  diagnoseEntity,
  projectMetrics,
  simulateIncrementalSpend,
} from '../src/modules/paid-media-afinz/utils/mediaIntelligence';

const assert = (condition: unknown, message: string) => {
  if (!condition) throw new Error(message);
};

const closeTo = (actual: number, expected: number, tolerance: number, label: string) => {
  assert(Math.abs(actual - expected) <= tolerance, `${label}: esperado ${expected}, recebido ${actual}`);
};

const rows = await dataService.fetchPaidMediaByAd();
const now = new Date('2026-07-19T12:00:00-03:00');
const from = new Date('2026-07-01T00:00:00-03:00');
const to = new Date('2026-07-31T23:59:59-03:00');
const projection = projectMetrics(rows, to, now);
const comparison = compareEquivalentMonth(rows, from, to, now);

assert(rows.length >= 6800, 'A leitura deve carregar a base granular viva.');
assert(projection.evidence.observedDays === 18, 'A projeção deve consolidar 18 dias, não contar linhas como dias.');
assert(projection.remainingDays === 13, 'Julho deve ter 13 dias restantes após 18/07.');
closeTo(projection.current.spend, 11010.33, 0.1, 'Spend MTD');
closeTo(comparison.previous.spend, 10829.07, 0.1, 'Spend MTD anterior');
closeTo(projection.current.ctr, (projection.current.clicks / projection.current.impressions) * 100, 0.0001, 'CTR ponderado');
closeTo(projection.projected.cpm, (projection.projected.spend / projection.projected.impressions) * 1000, 0.0001, 'CPM projetado derivado');
assert(projection.lower.cpm <= projection.upper.cpm, 'A faixa de CPM deve combinar limites de numerador e denominador.');

const signals = diagnoseEntity('global', 'Mídia paga', comparison, projection);
assert(signals.length > 0, 'O diagnóstico deve produzir pelo menos uma leitura explicável.');
assert(signals.every((signal) => signal.action && signal.evidence.length), 'Todo sinal deve conter ação e evidência.');

const scenario = simulateIncrementalSpend(projection, 1000);
assert(scenario.impressions[1] >= scenario.impressions[0], 'A faixa da simulação deve ser ordenada.');
assert(scenario.clicks[0] > 0, 'A simulação deve estimar cliques quando existe CPC.');

console.log(JSON.stringify({
  rows: rows.length,
  observedDays: projection.evidence.observedDays,
  spendMtd: projection.current.spend,
  projectedSpend: projection.projected.spend,
  confidence: projection.evidence.confidence,
  comparisonSpendPct: comparison.percent.spend,
  signals: signals.map((signal) => signal.signal),
}, null, 2));
