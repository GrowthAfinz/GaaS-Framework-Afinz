import { useMemo } from 'react';
import { eachDayOfInterval, format, subDays, differenceInDays } from 'date-fns';
import {
  BarChartDataPoint,
  DailyTowerPoint,
  DistributionLevel,
  ExplorerFilters,
  ExplorerMetric,
  TreeNode
} from '../../types/explorer';
import { ActivityRow } from '../../types/activity';

type FocusContext = {
  bu?: string;
  segmento?: string;
  canal?: string;
  disparoId?: string;
};

const BU_COLORS: Record<string, string> = {
  B2C: '#3B82F6',
  B2B2C: '#10B981',
  Plurix: '#A855F7',
};

const CANAL_COLORS: Record<string, string> = {
  Email: '#60A5FA',
  SMS: '#34D399',
  WhatsApp: '#A78BFA',
  Push: '#FBBF24',
};

const PALETTE = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899', '#06B6D4', '#84CC16', '#F97316'];

const ROOT_FOCUS_ID = 'root:all-bus';

const toDay = (v?: string) => (v || '').slice(0, 10);

const isInPeriod = (date: string, start: string, end: string) => date >= start && date <= end;

const getMetricValueFromActivity = (a: ActivityRow, metric: ExplorerMetric): number => {
  switch (metric) {
    case 'volume':
      return a['Base Total'] ?? 0;
    case 'cartoes':
      return (a['Cartões Gerados'] ?? (a as unknown as Record<string, number>)['CartÃµes Gerados']) ?? 0;
    case 'cac':
      return a.CAC ?? 0;
    case 'custo':
      return a['Custo Total Campanha'] ?? 0;
    case 'disparos':
      return 1; // each activity counts as 1 disparo
    default:
      return 0;
  }
};

const getMetricValueFromRows = (rows: ActivityRow[], metric: ExplorerMetric): number => {
  if (metric === 'disparos') return rows.length;
  if (metric === 'cac') {
    const vals = rows.map(r => r.CAC ?? 0).filter(v => v > 0);
    if (vals.length === 0) return 0;
    return vals.reduce((s, v) => s + v, 0) / vals.length;
  }
  return rows.reduce((sum, r) => sum + getMetricValueFromActivity(r, metric), 0);
};

const buildFocusId = (ctx: FocusContext): string => {
  if (ctx.disparoId) return `disparo:${ctx.disparoId}`;
  if (ctx.canal && ctx.segmento && ctx.bu) return `canal:${ctx.bu}|${ctx.segmento}|${ctx.canal}`;
  if (ctx.segmento && ctx.bu) return `segmento:${ctx.bu}|${ctx.segmento}`;
  if (ctx.bu) return `bu:${ctx.bu}`;
  return ROOT_FOCUS_ID;
};

const parseFocusId = (focusId: string | null): FocusContext => {
  if (!focusId || focusId === ROOT_FOCUS_ID) return {};
  const [type, payload = ''] = focusId.split(':');
  if (type === 'bu') return { bu: payload };
  if (type === 'segmento') {
    const [bu, segmento] = payload.split('|');
    return { bu, segmento };
  }
  if (type === 'canal') {
    const [bu, segmento, canal] = payload.split('|');
    return { bu, segmento, canal };
  }
  if (type === 'disparo') return { disparoId: payload };
  return {};
};

export function formatMetricValue(value: number, metric: ExplorerMetric): string {
  switch (metric) {
    case 'volume':
      return value >= 1000 ? `${(value / 1000).toFixed(1)}k` : String(Math.round(value));
    case 'cartoes':
      return value >= 1000 ? `${(value / 1000).toFixed(1)}k` : String(Math.round(value));
    case 'cac':
      return `R$ ${value.toFixed(2)}`;
    case 'custo':
      return value >= 1000 ? `R$ ${(value / 1000).toFixed(1)}k` : `R$ ${value.toFixed(2)}`;
    case 'disparos':
      return value >= 1000 ? `${(value / 1000).toFixed(1)}k` : String(Math.round(value));
    default:
      return String(value);
  }
}

interface UseComparisonDataProps {
  selectedNodeIds: string[];
  nodeMap: Map<string, TreeNode>;
  metric: ExplorerMetric;
  temporalMetric: ExplorerMetric;
  allActivities: ActivityRow[];
  filters: ExplorerFilters;
  comparisonFocusNodeId: string | null;
  compareEnabled?: boolean;
}

interface UseComparisonDataReturn {
  barChartData: BarChartDataPoint[];
  distributionLevel: DistributionLevel;
  drillPath: string[];
  dailySimpleData: DailyTowerPoint[];
  dailyStackedData: DailyTowerPoint[];
  stackedKeys: string[];
  focusNodeIdResolved: string | null;
}

export function useComparisonData({
  selectedNodeIds,
  nodeMap,
  metric,
  temporalMetric,
  allActivities,
  filters,
  comparisonFocusNodeId,
  compareEnabled = false,
}: UseComparisonDataProps): UseComparisonDataReturn {
  return useMemo(() => {
    const periodStart = filters.periodo.inicio;
    const periodEnd = filters.periodo.fim;

    const baseActivities = allActivities.filter((a) => {
      const d = toDay(a['Data de Disparo']);
      if (!d || !isInPeriod(d, periodStart, periodEnd)) return false;
      if (filters.bus.length > 0 && !filters.bus.includes(a.BU)) return false;
      if (filters.segmentos.length > 0 && !filters.segmentos.includes(a.Segmento)) return false;
      if (filters.jornadas.length > 0 && !filters.jornadas.includes(a.jornada)) return false;
      if (filters.canais.length > 0 && a.Canal && !filters.canais.includes(a.Canal)) return false;
      if (filters.status.length > 0 && a.status && !filters.status.includes(a.status)) return false;
      return true;
    });

    let focusId = comparisonFocusNodeId;
    if (!focusId && selectedNodeIds.length === 1) {
      const selected = nodeMap.get(selectedNodeIds[0]);
      if (selected) {
        if (selected.type === 'bu') focusId = buildFocusId({ bu: selected.label });
        if (selected.type === 'segmento') {
          const parent = selected.parentId ? nodeMap.get(selected.parentId) : null;
          focusId = buildFocusId({ bu: parent?.label, segmento: selected.label });
        }
        if (selected.type === 'canal') {
          const parentSegmento = selected.parentId ? nodeMap.get(selected.parentId) : null;
          const parentBu = parentSegmento?.parentId ? nodeMap.get(parentSegmento.parentId) : null;
          focusId = buildFocusId({ bu: parentBu?.label, segmento: parentSegmento?.label, canal: selected.label });
        }
      }
    }

    const focus = parseFocusId(focusId);

    const scopeActivities = baseActivities.filter((a) => {
      if (focus.disparoId) return a.id === focus.disparoId;
      if (focus.bu && a.BU !== focus.bu) return false;
      if (focus.segmento && a.Segmento !== focus.segmento) return false;
      if (focus.canal && a.Canal !== focus.canal) return false;
      return true;
    });

    let distributionLevel: DistributionLevel = 'bu';
    if (focus.bu && !focus.segmento) distributionLevel = 'segmento';
    if (focus.bu && focus.segmento && !focus.canal) distributionLevel = 'canal';
    if (focus.bu && focus.segmento && focus.canal) distributionLevel = 'disparo';

    const drillPath = [focus.bu, focus.segmento, focus.canal].filter(Boolean) as string[];

    const groups = new Map<string, ActivityRow[]>();
    scopeActivities.forEach((a) => {
      let key = '';
      if (distributionLevel === 'bu') key = a.BU || '(sem BU)';
      if (distributionLevel === 'segmento') key = a.Segmento || '(sem segmento)';
      if (distributionLevel === 'canal') key = a.Canal || '(sem canal)';
      if (distributionLevel === 'disparo') key = a['Activity name / Taxonomia'] || a.id;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(a);
    });

    // Previous period data calculation
    const prevGroups = new Map<string, ActivityRow[]>();
    if (compareEnabled) {
      const sDate = new Date(`${periodStart}T00:00:00`);
      const eDate = new Date(`${periodEnd}T00:00:00`);
      const diff = differenceInDays(eDate, sDate) + 1;
      const prevEnd = format(subDays(sDate, 1), 'yyyy-MM-dd');
      const prevStart = format(subDays(sDate, diff), 'yyyy-MM-dd');

      const prevActivities = allActivities.filter((a) => {
        const d = toDay(a['Data de Disparo']);
        if (!d || !isInPeriod(d, prevStart, prevEnd)) return false;
        if (filters.bus.length > 0 && !filters.bus.includes(a.BU)) return false;
        if (filters.segmentos.length > 0 && !filters.segmentos.includes(a.Segmento)) return false;
        if (filters.jornadas.length > 0 && !filters.jornadas.includes(a.jornada)) return false;
        if (filters.canais.length > 0 && a.Canal && !filters.canais.includes(a.Canal)) return false;
        if (filters.status.length > 0 && a.status && !filters.status.includes(a.status)) return false;
        if (focus.disparoId && a.id !== focus.disparoId) return false;
        if (focus.bu && a.BU !== focus.bu) return false;
        if (focus.segmento && a.Segmento !== focus.segmento) return false;
        if (focus.canal && a.Canal !== focus.canal) return false;
        return true;
      });

      prevActivities.forEach((a) => {
        let key = '';
        if (distributionLevel === 'bu') key = a.BU || '(sem BU)';
        if (distributionLevel === 'segmento') key = a.Segmento || '(sem segmento)';
        if (distributionLevel === 'canal') key = a.Canal || '(sem canal)';
        if (distributionLevel === 'disparo') key = a['Activity name / Taxonomia'] || a.id;
        if (!prevGroups.has(key)) prevGroups.set(key, []);
        prevGroups.get(key)!.push(a);
      });
    }

    // Bar chart uses main `metric`
    const barChartData: BarChartDataPoint[] = Array.from(groups.entries()).map(([label, rows], idx) => {
      const value = getMetricValueFromRows(rows, metric);
      let prevValue: number | undefined = undefined;
      if (compareEnabled && prevGroups.has(label)) {
        prevValue = getMetricValueFromRows(prevGroups.get(label)!, metric);
      } else if (compareEnabled) {
        prevValue = 0; // If it existed in period but not in prev, it's 0.
      }

      let nextFocusId: string | null = null;
      let color = '#3B82F6';

      if (distributionLevel === 'bu') {
        nextFocusId = buildFocusId({ bu: label });
        color = BU_COLORS[label] ?? PALETTE[idx % PALETTE.length];
      } else if (distributionLevel === 'segmento') {
        nextFocusId = buildFocusId({ bu: focus.bu, segmento: label });
        color = PALETTE[idx % PALETTE.length];
      } else if (distributionLevel === 'canal') {
        nextFocusId = buildFocusId({ bu: focus.bu, segmento: focus.segmento, canal: label });
        color = CANAL_COLORS[label] ?? PALETTE[idx % PALETTE.length];
      } else {
        const first = rows[0];
        nextFocusId = first ? buildFocusId({ disparoId: first.id }) : null;
        color = '#64748B';
      }

      return {
        id: `${distributionLevel}-${idx}`,
        label,
        value,
        prevValue,
        color,
        count: rows.length,
        nodeType: distributionLevel === 'disparo' ? 'canal' : distributionLevel,
        nextFocusId,
      };
    }).sort((a, b) => b.value - a.value);

    // Daily chart uses `temporalMetric` (independent from bar chart metric)
    const days = eachDayOfInterval({
      start: new Date(`${periodStart}T00:00:00`),
      end: new Date(`${periodEnd}T00:00:00`)
    });

    const dayMap = new Map<string, DailyTowerPoint>();
    days.forEach((d) => {
      const key = format(d, 'yyyy-MM-dd');
      dayMap.set(key, { date: key, label: format(d, 'dd/MM'), total: 0 });
    });

    const stackDimension = distributionLevel === 'bu'
      ? 'BU'
      : distributionLevel === 'segmento'
        ? 'Segmento'
        : distributionLevel === 'canal'
          ? 'Canal'
          : 'Activity name / Taxonomia';

    const stackTotals = new Map<string, number>();
    scopeActivities.forEach((a) => {
      const d = toDay(a['Data de Disparo']);
      const point = dayMap.get(d);
      if (!point) return;
      const v = getMetricValueFromActivity(a, temporalMetric);
      point.total = (point.total as number) + v;
      const rawKey = (a as unknown as Record<string, unknown>)[stackDimension] || a.id;
      const stackKey = String(rawKey);
      point[stackKey] = Number(point[stackKey] ?? 0) + v;
      stackTotals.set(stackKey, (stackTotals.get(stackKey) ?? 0) + v);
    });

    const stackedKeys = Array.from(stackTotals.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([k]) => k);

    const dailyStackedData = Array.from(dayMap.values()).map((point) => {
      const p: DailyTowerPoint = { date: point.date, label: point.label, total: point.total as number };
      stackedKeys.forEach((k) => {
        p[k] = Number(point[k] ?? 0);
      });
      return p;
    });

    const dailySimpleData = Array.from(dayMap.values()).map((point) => ({
      date: point.date,
      label: point.label,
      total: point.total as number
    }));

    return {
      barChartData,
      distributionLevel,
      drillPath,
      dailySimpleData,
      dailyStackedData,
      stackedKeys,
      focusNodeIdResolved: focusId ?? null
    };
  }, [allActivities, filters, selectedNodeIds, nodeMap, metric, temporalMetric, comparisonFocusNodeId]);
}

export const explorerFocus = {
  root: ROOT_FOCUS_ID,
  build: buildFocusId
};
