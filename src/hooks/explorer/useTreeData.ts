import { useMemo } from 'react';
import { ActivityRow } from '../../types/activity';
import { TreeNode, NodeMetrics, ExplorerFilters, NodeType } from '../../types/explorer';

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
  let cacSum = 0, cacCount = 0, convSum = 0, convCount = 0;

  for (const r of rows) {
    total.baseTotal += r['Base Total'] ?? 0;
    total.cartoes += r['Cartões Gerados'] ?? 0;
    total.propostas += r['Propostas'] ?? 0;
    total.aprovados += r['Aprovados'] ?? 0;
    total.custoTotal += r['Custo Total Campanha'] ?? 0;

    if (r['CAC'] != null && r['CAC'] > 0) {
      cacSum += r['CAC'];
      cacCount++;
    }
    if (r['Taxa de Conversão'] != null && r['Taxa de Conversão'] > 0) {
      convSum += r['Taxa de Conversão'];
      convCount++;
    }
  }

  total.cac = cacCount > 0 ? cacSum / cacCount : 0;
  total.taxaConversao = convCount > 0 ? convSum / convCount : 0;

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

function buildChildren(
  activities: ActivityRow[],
  levels: NodeType[],
  levelIndex: number,
  parentId: string,
  parentColor: string,
  getKey: (a: ActivityRow, level: NodeType) => string
): TreeNode[] {
  if (levelIndex >= levels.length) return [];

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
