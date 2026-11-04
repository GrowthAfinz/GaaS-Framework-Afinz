import type { Activity, AnomalyType } from '../../types/framework';

export const ANOMALY_LABELS: Record<AnomalyType, string> = {
  pending: 'Pendente',
  no_sent: 'Sem envio',
  no_delivered: 'Sem entrega',
  no_open: 'Sem abertura',
};
export const ANOMALY_TYPES = Object.keys(ANOMALY_LABELS) as AnomalyType[];

/** Só estes canais medem abertura; SMS e Push não entram em "Sem abertura". */
const OPEN_TRACKED = new Set(['e-mail', 'email', 'whatsapp']);
const AFFIRMATIVE = new Set(['sim', 's', 'yes', 'y', 'enviado', 'ok', 'true', '1']);

const empty = (value: unknown) => value === null || value === undefined || value === '';
const zeroOrEmpty = (value: unknown) => empty(value) || Number(value) === 0;

/**
 * Anomalias de um disparo, a partir dos dados reais do Supabase:
 * - Pendente: disparo enviado sem resultado de cartões registrado (status Enviado, Cartões Gerados vazio
 *   ou texto "aguardando/confirmar" vindo de CSV antigo).
 * - Sem envio: disparado com Base Total zerada.
 * - Sem entrega: teve base, mas Base Acionável zerada.
 * - Sem abertura: E-mail ou WhatsApp entregue sem nenhuma abertura registrada.
 */
export function anomalyFlags(activity: Activity): Record<AnomalyType, boolean> {
  const raw = (activity.raw || {}) as Record<string, unknown>;
  const status = String(activity.status || raw.status || '').trim();
  const dispatched = status === 'Realizado' || status === 'Enviado' || AFFIRMATIVE.has(String(raw['Disparado?'] ?? '').toLowerCase().trim());
  if (!dispatched) return { pending: false, no_sent: false, no_delivered: false, no_open: false };
  const rawCards = raw['Cartões Gerados'];
  const cardsText = typeof rawCards === 'string' ? rawCards.toLowerCase() : '';
  const k = activity.kpis;
  const sent = Number(k.baseEnviada) || 0;
  const delivered = Number(k.baseEntregue) || 0;
  return {
    pending: status === 'Enviado' || empty(rawCards) || cardsText.includes('aguardando') || cardsText.includes('confirmar'),
    no_sent: sent === 0,
    no_delivered: sent > 0 && delivered === 0,
    no_open: delivered > 0 && OPEN_TRACKED.has(String(activity.canal || '').toLowerCase().trim()) && zeroOrEmpty(k.aberturas) && zeroOrEmpty(k.taxaAbertura),
  };
}

/** Sem filtro escolhido, qualquer anomalia conta; com filtro, só os tipos escolhidos. */
export function matchesAnomaly(activity: Activity, filters: AnomalyType[]): boolean {
  const flags = anomalyFlags(activity);
  const types = filters.length ? filters : ANOMALY_TYPES;
  return types.some(type => flags[type]);
}
