import { useMemo } from 'react';
import { ActivityRow } from '../../types/activity';
import { TreeNode, NodeMetrics, ExplorerFilters, NodeType } from '../../types/explorer';
import { getCustoUnitarioCanal } from '../../constants/frameworkFields';

/** Custo total do disparo — usa o do banco se existir, senão computa por canal/ano. */
function rowCustoTotal(r: ActivityRow): number {
  const stored = Number(r['Custo Total Campanha'] ?? 0);
  if (Number.isFinite(stored) && stored > 0) return stored;
  // Custo incide sobre a base entregue (convenção do histórico); cai para a enviada.
  const baseCusto = (Number(r['Base Acionável'] ?? 0) || 0) || (Number(r['Base Total'] ?? 0) || 0);
  const canalUnit =
    Number(r['Custo unitário do canal'] ?? 0) || getCustoUnitarioCanal(r.Canal ?? '', r['Data de Disparo']);
  const ofertaUnit = Number(r['Custo Unitário Oferta'] ?? 0) || 0;
  return baseCusto * (ofertaUnit + canalUnit);
}

const BU_COLORS: Record<string, string> = {
  B2C: '#3B82F6',
  B2B2C: '#10B981',
  Plurix: '#A855F7',
  Seguros: '#F97316',
};

const CANAL_COLORS: Record<string, string> = {
  Email: '#60A5FA',
  SMS: '#34D399',
  WhatsApp: '#A78BFA',
  Push: '#FBBF24',
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '_')
    .trim();
}

function emptyMetrics(): NodeMetrics {
  return { baseTotal: 0, cartoes: 0, propostas: 0, aprovados: 0, custoTotal: 0, cac: 0, taxaConversao: 0 };
}

function aggregateMetrics(rows: ActivityRow[]): NodeMetrics {
  const total = emptyMetrics();
  let baseEnviada = 0;

  for (const r of rows) {
    const base = Number(r['Base Total'] ?? 0) || 0;
    total.baseTotal += base;
    baseEnviada += base;
    total.cartoes += Number(r['Cartões Gerados'] ?? 0) || 0;
    total.propostas += Number(r['Propostas'] ?? 0) || 0;
    total.aprovados += Number(r['Aprovados'] ?? 0) || 0;
    total.custoTotal += rowCustoTotal(r);
  }

  total.cac = total.cartoes > 0 ? total.custoTotal / total.cartoes : 0;
  // Conversão = Cartões ÷ Base Enviada (em %), consistente em todos os níveis.
  total.taxaConversao = baseEnviada > 0 ? (total.cartoes / baseEnviada) * 100 : 0;

  return total;
}

function isInPeriod(dateStr: string | undefined, inicio: string, fim: string): boolean {
  if (!dateStr) return false;
  const date = dateStr.slice(0, 10); // YYYY-MM-DD
  return date >= inicio && date <= fim;
}

function buildNodeId(parts: string[]): string {
  return parts.map(slugify).join('-');
}

function buildDisparoNodes(rows: ActivityRow[], parentId: string, parentColor: string): TreeNode[] {
  return rows.map((activity): TreeNode => {
    const base = Number(activity['Base Total'] ?? 0) || 0;
    const cartoes = Number(activity['Cartões Gerados'] ?? 0) || 0;
    const custoTotal = rowCustoTotal(activity);
    return {
      id: `disparo-${activity.id}`,
      label: activity['Activity name / Taxonomia'] || activity.id,
      type: 'disparo',
      count: 1,
      parentId,
      metrics: {
        baseTotal: base,
        cartoes,
        propostas: Number(activity['Propostas'] ?? 0) || 0,
        aprovados: Number(activity['Aprovados'] ?? 0) || 0,
        custoTotal,
        cac: cartoes > 0 ? custoTotal / cartoes : 0,
        taxaConversao: base > 0 ? (cartoes / base) * 100 : 0,
      },
      children: [],
      activityIds: [activity.id],
      color: parentColor,
    };
  });
}

function buildChildren(
  activities: ActivityRow[],
  levels: NodeType[],
  levelIndex: number,
  parentId: string,
  parentColor: string,
  getKey: (a: ActivityRow, level: NodeType) => string
): TreeNode[] {
  // Leaf level: create individual disparo nodes
  if (levelIndex >= levels.length) return buildDisparoNodes(activities, parentId, parentColor);

  const level = levels[levelIndex];
  const groups = new Map<string, ActivityRow[]>();

  for (const a of activities) {
    const key = getKey(a, level) || '(sem valor)';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(a);
  }

  return Array.from(groups.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, rows]) => {
      const nodeId = buildNodeId([parentId, label]);
      const color = level === 'canal' ? (CANAL_COLORS[label] ?? parentColor) : parentColor;
      const children = buildChildren(rows, levels, levelIndex + 1, nodeId, color, getKey);

      return {
        id: nodeId,
        label,
        type: level,
        count: rows.length,
        parentId,
        metrics: aggregateMetrics(rows),
        children,
        activityIds: rows.map((r) => r.id),
        color,
      };
    });
}

function getLevelKey(a: ActivityRow, level: NodeType): string {
  switch (level) {
    case 'bu': return a.BU ?? '';
    case 'segmento': return a.Segmento ?? '';
    case 'jornada': return a.jornada ?? '';
    case 'canal': return a.Canal ?? '';
    default: return '';
  }
}

interface UseTreeDataProps {
  activities: ActivityRow[];
  filters: ExplorerFilters;
}

interface UseTreeDataReturn {
  rootNodes: TreeNode[];
  nodeMap: Map<string, TreeNode>;
  allNodeIds: string[];
}

function flattenNodes(nodes: TreeNode[], map: Map<string, TreeNode>): void {
  for (const node of nodes) {
    map.set(node.id, node);
    if (node.children.length > 0) {
      flattenNodes(node.children, map);
    }
  }
}

export function useTreeData({ activities, filters }: UseTreeDataProps): UseTreeDataReturn {
  return useMemo(() => {
    const { inicio, fim } = filters.periodo;

    // 1. Filter activities
    const filtered = activities.filter((a) => {
      if (!isInPeriod(a['Data de Disparo'], inicio, fim)) return false;
      if (filters.bus.length > 0 && !filters.bus.includes(a.BU)) return false;
      if (filters.segmentos.length > 0 && !filters.segmentos.includes(a.Segmento)) return false;
      if (filters.jornadas.length > 0 && !filters.jornadas.includes(a.jornada)) return false;
      if (filters.canais.length > 0 && a.Canal && !filters.canais.includes(a.Canal)) return false;
      if (filters.status.length > 0 && a.status && !filters.status.includes(a.status)) return false;
      return true;
    });

    // 2. Group by BU (root level)
    const buGroups = new Map<string, ActivityRow[]>();
    for (const a of filtered) {
      const bu = a.BU || '(sem BU)';
      if (!buGroups.has(bu)) buGroups.set(bu, []);
      buGroups.get(bu)!.push(a);
    }

    const levels: NodeType[] = ['segmento', 'canal'];

    const rootNodes: TreeNode[] = Array.from(buGroups.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([bu, rows]) => {
        const color = BU_COLORS[bu] ?? '#94A3B8';
        const buId = slugify(bu);
        const children = buildChildren(rows, levels, 0, buId, color, getLevelKey);

        return {
          id: slugify(bu),
          label: bu,
          type: 'bu' as NodeType,
          count: rows.length,
          parentId: null,
          metrics: aggregateMetrics(rows),
          children,
          activityIds: rows.map((r) => r.id),
          color,
        };
      });

    // 3. Build flat map for O(1) lookups
    const nodeMap = new Map<string, TreeNode>();
    flattenNodes(rootNodes, nodeMap);

    const allNodeIds = Array.from(nodeMap.keys());

    return { rootNodes, nodeMap, allNodeIds };
  }, [activities, filters]);
}
