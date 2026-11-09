export const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

function singularOf(unit: string) {
  if (unit.endsWith('ões')) return unit.slice(0, -3) + 'ão';
  if (unit.endsWith('ais')) return unit.slice(0, -3) + 'al';
  if (unit.endsWith('s') && !unit.endsWith('ss')) return unit.slice(0, -1);
  return unit;
}

/** Valor com unidade do contrato, concordando com 1: "1 dias" vira "1 dia". */
export function withUnit(value: unknown, unit?: string | null) {
  const text = String(value ?? '');
  if (!unit) return text;
  const n = Number(text.replace(',', '.'));
  return `${text} ${Number.isFinite(n) && Math.abs(n) === 1 ? singularOf(unit) : unit}`;
}

const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

/** Mesma data nas três telas: "25 set 2026". Aceita data pura ou ISO com horário. */
export function ledgerDate(value: string | null | undefined) {
  if (!value) return '';
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return value;
  const local = value.length > 10 ? new Date(value) : null;
  const [y, m, d] = local && Number.isFinite(local.getTime()) ? [local.getFullYear(), local.getMonth() + 1, local.getDate()] : [Number(match[1]), Number(match[2]), Number(match[3])];
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

/** Junta frases de atenção: com um item só, fala dele direto. */
export function attentionSentence(total: number, one: string[], many: string[]) {
  const parts = total === 1 ? one : many;
  if (!parts.length) return '';
  const joined = parts.length === 1 ? parts[0] : `${parts.slice(0, -1).join(', ')} e ${parts[parts.length - 1]}`;
  return total === 1 ? `Ela ${joined}.` : `Delas, ${joined}.`;
}
