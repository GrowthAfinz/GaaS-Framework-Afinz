import { Activity } from '../../types/framework';
import { DimensionKey, getDimensionValue, getGroupableDimensionLabel } from './reportColumnsConfig';

export interface AggregatedRow {
  label: string;
  baseEnviada: number;
  baseEntregue: number;
  aberturas: number;
  cliques: number;
  propostas: number;
  aprovados: number;
  emissoes: number;
  emissoesIndependentes: number;
  emissoesAssistidas: number;
  custoTotal: number;
  cac: number;
  taxaEntrega: number;
  taxaAbertura: number;
  taxaProposta: number;
  taxaAprovacao: number;
  taxaFinalizacao: number;
  custoPorCartao: number;
  taxaConversaoBase: number;
}

const safeSum = (activities: Activity[], pick: (a: Activity) => number | null | undefined): number =>
  activities.reduce((acc, a) => acc + (pick(a) ?? 0), 0);

export function computeRow(activities: Activity[], label: string): AggregatedRow {
  const baseEnviada = safeSum(activities, a => a.kpis.baseEnviada);
  const baseEntregue = safeSum(activities, a => a.kpis.baseEntregue);
  const aberturas = safeSum(activities, a => a.kpis.aberturas);
  const cliques = safeSum(activities, a => a.kpis.cliques);
  const propostas = safeSum(activities, a => a.kpis.propostas);
  const aprovados = safeSum(activities, a => a.kpis.aprovados);
  const emissoes = safeSum(activities, a => a.kpis.emissoes ?? a.kpis.cartoes);
  const emissoesIndependentes = safeSum(activities, a => a.kpis.emissoesIndependentes);
  const emissoesAssistidas = safeSum(activities, a => a.kpis.emissoesAssistidas);
  const custoTotal = safeSum(activities, a => a.kpis.custoTotal);
  const cacRows = activities.filter(a => (a.kpis.cac ?? 0) > 0);
  const cac = cacRows.length > 0 ? cacRows.reduce((s, a) => s + (a.kpis.cac ?? 0), 0) / cacRows.length : 0;

  return {
    label,
    baseEnviada,
    baseEntregue,
    aberturas,
    cliques,
    propostas,
    aprovados,
    emissoes,
    emissoesIndependentes,
    emissoesAssistidas,
    custoTotal,
    cac,
    taxaEntrega: baseEnviada > 0 ? baseEntregue / baseEnviada : 0,
    taxaAbertura: baseEntregue > 0 ? aberturas / baseEntregue : 0,
    taxaProposta: baseEntregue > 0 ? propostas / baseEntregue : 0,
    taxaAprovacao: propostas > 0 ? aprovados / propostas : 0,
    taxaFinalizacao: baseEntregue > 0 ? emissoes / baseEntregue : 0,
    custoPorCartao: emissoes > 0 ? custoTotal / emissoes : 0,
    taxaConversaoBase: baseEnviada > 0 ? emissoes / baseEnviada : 0,
  };
}

export function groupActivitiesByDimension(
  activities: Activity[],
  dim: DimensionKey
): AggregatedRow[] {
  const groups = new Map<string, Activity[]>();
  const fallback = `Sem ${getGroupableDimensionLabel(dim)}`;
  activities.forEach((activity) => {
    const key = getDimensionValue(activity, dim) || fallback;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(activity);
  });
  const rows: AggregatedRow[] = [];
  groups.forEach((acts, label) => rows.push(computeRow(acts, label)));
  return rows.sort((a, b) => b.emissoes - a.emissoes);
}

export function groupActivitiesByDimensionAsMap(
  activities: Activity[],
  dim: DimensionKey
): Map<string, AggregatedRow> {
  const groups = new Map<string, Activity[]>();
  const fallback = `Sem ${getGroupableDimensionLabel(dim)}`;
  activities.forEach((activity) => {
    const key = getDimensionValue(activity, dim) || fallback;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(activity);
  });
  const rows = new Map<string, AggregatedRow>();
  groups.forEach((acts, label) => rows.set(label, computeRow(acts, label)));
  return rows;
}
