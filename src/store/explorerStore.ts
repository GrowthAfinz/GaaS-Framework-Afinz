import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TreeNode, ExplorerFilters, ExplorerMetric, SearchResult } from '../types/explorer';
import { format, startOfMonth, endOfMonth } from 'date-fns';

const now = new Date();

const defaultFilters: ExplorerFilters = {
  periodo: {
    inicio: format(startOfMonth(now), 'yyyy-MM-dd'),
    fim: format(endOfMonth(now), 'yyyy-MM-dd'),
  },
  bus: [],
  segmentos: [],
  jornadas: [],
  canais: [],
  status: [],
};

interface ExplorerStore {
  // UI State
  expandedNodeIds: string[];
  selectedNodeIds: string[];
  comparisonFocusNodeId: string | null;
  detailsPaneNodeId: string | null;
  metric: ExplorerMetric;
  temporalMetric: ExplorerMetric;

  // Filters
  filters: ExplorerFilters;

  // Search
  searchQuery: string;

  // Actions
  toggleNode: (nodeId: string) => void;
  expandAll: (allNodeIds: string[]) => void;
  collapseAll: () => void;
  expandToNode: (nodeId: string, nodeMap: Map<string, TreeNode>) => void;

  selectNode: (nodeId: string, multiSelect: boolean) => void;
  setSelectedNodeIds: (nodeIds: string[]) => void;
  deselectAll: () => void;
  setComparisonFocusNode: (nodeId: string | null) => void;
  resetComparisonFocus: () => void;

  setDetailsPaneNode: (nodeId: string | null) => void;
  setMetric: (metric: ExplorerMetric) => void;
  setTemporalMetric: (metric: ExplorerMetric) => void;
  setFilters: (filters: Partial<ExplorerFilters>) => void;
  setSearchQuery: (query: string) => void;
}

export const useExplorerStore = create<ExplorerStore>()(
  persist(
    (set) => ({
      expandedNodeIds: [],
      selectedNodeIds: [],
      comparisonFocusNodeId: null,
      detailsPaneNodeId: null,
      metric: 'cartoes',
      temporalMetric: 'disparos',
      filters: defaultFilters,
      searchQuery: '',

      toggleNode: (nodeId) =>
        set((state) => {
          const isExpanded = state.expandedNodeIds.includes(nodeId);
          return {
            expandedNodeIds: isExpanded
              ? state.expandedNodeIds.filter((id) => id !== nodeId)
              : [...state.expandedNodeIds, nodeId],
          };
        }),

      expandAll: (allNodeIds) =>
        set({ expandedNodeIds: allNodeIds }),

      collapseAll: () =>
        set({ expandedNodeIds: [] }),

      expandToNode: (nodeId, nodeMap) =>
        set((state) => {
          const toExpand: string[] = [];
          const collectParents = (id: string) => {
            const node = nodeMap.get(id);
            if (!node || !node.parentId) return;
            toExpand.push(node.parentId);
            collectParents(node.parentId);
          };
          collectParents(nodeId);
          const newExpanded = Array.from(new Set([...state.expandedNodeIds, ...toExpand]));
          return { expandedNodeIds: newExpanded };
        }),

      selectNode: (nodeId, multiSelect) =>
        set((state) => {
          if (multiSelect) {
            const isSelected = state.selectedNodeIds.includes(nodeId);
            return {
              selectedNodeIds: isSelected
                ? state.selectedNodeIds.filter((id) => id !== nodeId)
                : [...state.selectedNodeIds, nodeId],
              detailsPaneNodeId: nodeId,
            };
          }
          return {
            selectedNodeIds: [nodeId],
            detailsPaneNodeId: nodeId,
          };
        }),

      setSelectedNodeIds: (nodeIds) =>
        set({ selectedNodeIds: nodeIds }),

      deselectAll: () =>
        set({ selectedNodeIds: [], detailsPaneNodeId: null, comparisonFocusNodeId: null }),

      setComparisonFocusNode: (nodeId) =>
        set({ comparisonFocusNodeId: nodeId }),

      resetComparisonFocus: () =>
        set({ comparisonFocusNodeId: null }),

      setDetailsPaneNode: (nodeId) =>
        set({ detailsPaneNodeId: nodeId }),

      setMetric: (metric) =>
        set({ metric }),

      setTemporalMetric: (metric) =>
        set({ temporalMetric: metric }),

      setFilters: (partial) =>
        set((state) => ({
          filters: { ...state.filters, ...partial },
        })),

      setSearchQuery: (query) =>
        set({ searchQuery: query }),
    }),
    {
      name: 'gaas-explorer-state',
      partialize: (state) => ({
        expandedNodeIds: state.expandedNodeIds,
        comparisonFocusNodeId: state.comparisonFocusNodeId,
        metric: state.metric,
        temporalMetric: state.temporalMetric,
        filters: state.filters,
      }),
    }
  )
);
