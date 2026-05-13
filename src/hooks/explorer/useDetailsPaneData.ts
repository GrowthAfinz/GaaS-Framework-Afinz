import { useMemo } from 'react';
import { TreeNode, DetailsPaneData, ChannelDistributionItem, TopOfferItem, TopPromocionalItem, TopDimensionItem, NodeMetrics } from '../../types/explorer';
import { ActivityRow } from '../../types/activity';
import { format, subDays, differenceInDays } from 'date-fns';

const CANAL_COLORS: Record<string, string> = {
  Email: '#60A5FA',
  SMS: '#34D399',
  WhatsApp: '#A78BFA',
  Push: '#FBBF24',
};

const toDay = (v?: string) => (v || '').slice(0, 10);
const isInPeriod = (date: string, start: string, end: string) => date >= start && date <= end;
const ignoredDimensionValues = new Set(['n/a', 'na', 'nao se aplica', 'sem', 'sem valor', '-', '--']);

const normalizeDimensionValue = (value?: string | null): string | null => {
  const cleaned = String(value ?? '').trim();
  if (!cleaned) return null;
  if (ignoredDimensionValues.has(cleaned.toLowerCase())) return null;
  return cleaned;
};

const buildTopDimension = (
  activities: ActivityRow[],
  getValue: (activity: ActivityRow) => string | number | null | undefined,
  limit = 3
): TopDimensionItem[] => {
  const counts = new Map<string, { cartoes: number; count: number }>();

  for (const activity of activities) {
    const label = normalizeDimensionValue(getValue(activity)?.toString());
    if (!label) continue;
    const existing = counts.get(label) ?? { cartoes: 0, count: 0 };
    counts.set(label, {
      cartoes: existing.cartoes + (activity['Cartões Gerados'] ?? 0),
      count: existing.count + 1,
    });
  }

  return Array.from(counts.entries())
    .map(([label, { cartoes, count }]) => ({ label, cartoes, count }))
    .sort((a, b) => b.cartoes - a.cartoes)
    .slice(0, limit);
};

export function useDetailsPaneData(
  nodeId: string | null,
  nodeMap: Map<string, TreeNode>,
  allActivities: ActivityRow[],
  filters: { inicio: string; fim: string }
): DetailsPaneData | null {
  return useMemo(() => {
    if (!nodeId) return null;
    const node = nodeMap.get(nodeId);
    if (!node) return null;

    const actIdSet = new Set(node.activityIds);
    const activities = allActivities.filter((a) => actIdSet.has(a.id));

    // Channel distribution
    const canalCounts = new Map<string, { count: number; cartoes: number }>();
    for (const a of activities) {
      const canal = a.Canal ?? 'Outro';
      const existing = canalCounts.get(canal) ?? { count: 0, cartoes: 0 };
      canalCounts.set(canal, {
        count: existing.count + 1,
        cartoes: existing.cartoes + (a['Cartões Gerados'] ?? 0),
      });
    }

    const totalCount = activities.length;
    const channelDistribution: ChannelDistributionItem[] = Array.from(canalCounts.entries())
      .map(([canal, { count, cartoes: _c }]) => ({
        canal,
        count,
        percentage: totalCount > 0 ? Math.round((count / totalCount) * 100) : 0,
        color: CANAL_COLORS[canal] ?? '#94A3B8',
      }))
      .sort((a, b) => b.count - a.count);

    // Top offers by cartões
    const ofertaCounts = new Map<string, { cartoes: number; count: number }>();
    for (const a of activities) {
      const oferta = normalizeDimensionValue(a.Oferta);
      if (!oferta) continue;
      const existing = ofertaCounts.get(oferta) ?? { cartoes: 0, count: 0 };
      ofertaCounts.set(oferta, {
        cartoes: existing.cartoes + (a['Cartões Gerados'] ?? 0),
        count: existing.count + 1,
      });
    }

    const topOffers: TopOfferItem[] = Array.from(ofertaCounts.entries())
      .map(([oferta, { cartoes, count }]) => ({ oferta, cartoes, count }))
      .sort((a, b) => b.cartoes - a.cartoes)
      .slice(0, 3);

    // Top promocionais by cartões
    const promocionalCounts = new Map<string, { cartoes: number; count: number }>();
    for (const a of activities) {
      const promos = [a.Promocional, a['Promocional 2']]
        .map(normalizeDimensionValue)
        .filter((promo): promo is string => Boolean(promo));

      for (const promo of Array.from(new Set(promos))) {
        const existing = promocionalCounts.get(promo) ?? { cartoes: 0, count: 0 };
        promocionalCounts.set(promo, {
          cartoes: existing.cartoes + (a['Cartões Gerados'] ?? 0),
          count: existing.count + 1,
        });
      }
    }

    const topPromocionais: TopPromocionalItem[] = Array.from(promocionalCounts.entries())
      .map(([promocional, { cartoes, count }]) => ({ promocional, cartoes, count }))
      .sort((a, b) => b.cartoes - a.cartoes)
      .slice(0, 3);

    const topParceiros = buildTopDimension(activities, (a) => a.Parceiro);
    const topSubgrupos = buildTopDimension(activities, (a) => a.Subgrupos);
    const topPerfisCredito = buildTopDimension(activities, (a) => a['Perfil de Crédito']);
    const topEtapasAquisicao = buildTopDimension(activities, (a) => a['Etapa de aquisição']);
    const topOrdensDisparo = buildTopDimension(
      activities,
      (a) => (a['Ordem de disparo'] === undefined || a['Ordem de disparo'] === null ? null : `Ordem ${a['Ordem de disparo']}`)
    );

    let baseTotal = 0;
    let baseAcionavel = 0;
    let otimBaseSum = 0;
    let otimBaseCount = 0;
    for (const a of activities) {
      baseTotal += a['Base Total'] ?? 0;
      baseAcionavel += a['Base Acionável'] ?? 0;
      if (typeof a['% Otimização de base'] === 'number' && Number.isFinite(a['% Otimização de base'])) {
        otimBaseSum += a['% Otimização de base'];
        otimBaseCount += 1;
      }
    }

    const funnelSummary = {
      propostas: node.metrics.propostas,
      aprovados: node.metrics.aprovados,
      cartoes: node.metrics.cartoes,
      taxaAprovacao: node.metrics.propostas > 0 ? (node.metrics.aprovados / node.metrics.propostas) * 100 : 0,
      taxaFinalizacao: node.metrics.aprovados > 0 ? (node.metrics.cartoes / node.metrics.aprovados) * 100 : 0,
    };

    const baseSummary = {
      baseTotal,
      baseAcionavel,
      taxaAcionavel: baseTotal > 0 ? (baseAcionavel / baseTotal) * 100 : 0,
      otimBaseMedia: otimBaseCount > 0 ? otimBaseSum / otimBaseCount : 0,
    };

    // Period label
    const period = `${format(new Date(filters.inicio + 'T00:00:00'), 'MMM yyyy')} – ${format(new Date(filters.fim + 'T00:00:00'), 'MMM yyyy')}`;

    let prevMetrics: NodeMetrics | undefined = undefined;

    {
      const sDate = new Date(`${filters.inicio}T00:00:00`);
      const eDate = new Date(`${filters.fim}T00:00:00`);
      const diff = differenceInDays(eDate, sDate) + 1;
      const prevEnd = format(subDays(sDate, 1), 'yyyy-MM-dd');
      const prevStart = format(subDays(sDate, diff), 'yyyy-MM-dd');

      // Filter all activities that match the node's scope but for the previous period
      // Since `node.activityIds` only contains IDs for the *current* period (from TreeData),
      // we must filter by the node's path logic, OR simplify by using the Tree hierarchy.
      // Easiest is to filter allActivities by prevStart/prevEnd and then by the node's labels.

      const prevActs = allActivities.filter((a) => {
        const d = toDay(a['Data de Disparo']);
        if (!d || !isInPeriod(d, prevStart, prevEnd)) return false;

        // Same filtering logic to get activities belonging to this `nodeId` in the previous period
        if (node.type === 'bu' && a.BU !== node.label) return false;
        if (node.type === 'segmento') {
          const parentBu = nodeMap.get(node.parentId!)?.label;
          if (a.BU !== parentBu || a.Segmento !== node.label) return false;
        }
        if (node.type === 'canal') {
          const pSeg = nodeMap.get(node.parentId!);
          const pBu = nodeMap.get(pSeg?.parentId!);
          if (a.BU !== pBu?.label || a.Segmento !== pSeg?.label || a.Canal !== node.label) return false;
        }
        if (node.type === 'disparo') {
          // For leaf node, we compare by Activity name or just id if same? Usually comparing by taxonomy / same template name might make more sense, but let's compare by same BU/Segment/Canal/Template? If we just use ID, it won't exist in prev period.
          // We can skip prevMetrics for individual disparos, or match by taxonomy.
          return false; // Skip for now at disparo level as it's a specific instance
        }
        return true;
      });

      let cartoes = 0, propostas = 0, aprovados = 0, custoTotal = 0, cacSum = 0, cacCount = 0;
      for (const p of prevActs) {
        cartoes += (p['Cartões Gerados'] ?? 0);
        propostas += (p.Propostas ?? 0);
        aprovados += (p.Aprovados ?? 0);
        custoTotal += (p['Custo Total Campanha'] ?? 0);
        if (p.CAC && p.CAC > 0) {
          cacSum += p.CAC;
          cacCount++;
        }
      }

      prevMetrics = {
        baseTotal: prevActs.length, // total activities
        cartoes,
        propostas,
        aprovados,
        custoTotal,
        cac: cacCount > 0 ? cacSum / cacCount : 0,
        taxaConversao: propostas > 0 ? (aprovados / propostas) * 100 : 0
      };
    }

    return {
      node,
      period,
      channelDistribution,
      topOffers,
      topPromocionais,
      topParceiros,
      topSubgrupos,
      topPerfisCredito,
      topEtapasAquisicao,
      topOrdensDisparo,
      funnelSummary,
      baseSummary,
      activities,
      prevMetrics
    };
  }, [nodeId, nodeMap, allActivities, filters]);
}
