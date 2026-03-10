import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2 } from 'lucide-react';

import { ActivityRow } from '../../types/activity';
import { activityService } from '../../services/activityService';
import { useAppStore } from '../../store/useAppStore';
import { usePeriod } from '../../contexts/PeriodContext';
import { formatDateKey, parseDate } from '../../utils/formatters';

import { useExplorerStore } from '../../store/explorerStore';
import { useTreeData } from '../../hooks/explorer/useTreeData';
import { useTreeNavigation } from '../../hooks/explorer/useTreeNavigation';
import { explorerFocus, useComparisonData } from '../../hooks/explorer/useComparisonData';
import { useDetailsPaneData } from '../../hooks/explorer/useDetailsPaneData';
import { useExplorerSearch } from '../../hooks/explorer/useExplorerSearch';

import { TreeView } from './tree/TreeView';
import { ComparisonPanel } from './comparison/ComparisonPanel';
import { DetailsPane } from './details/DetailsPane';
import { QuickSearch } from './search/QuickSearch';

interface DisparoExplorerProps {
  onNavigateToFramework?: (filters?: { bu?: string; segmento?: string; jornada?: string }) => void;
}

export const DisparoExplorer: React.FC<DisparoExplorerProps> = ({ onNavigateToFramework }) => {
  const storeActivitiesRaw = useAppStore((state) => state.activities);
  const storeActivities = React.useMemo(() => {
    return storeActivitiesRaw.map((a) => {
      let dateStr = '';
      try {
        if (a.dataDisparo) {
          const dateVal = formatDateKey(a.dataDisparo);
          if (dateVal !== 'UNKNOWN') dateStr = dateVal;
        }

        if (!dateStr && a.raw && a.raw['Data de Disparo']) {
          const rawDate = a.raw['Data de Disparo'];
          const parsed = parseDate(rawDate as string | number);
          if (parsed && !isNaN(parsed.getTime())) {
            dateStr = formatDateKey(parsed);
          } else if (typeof rawDate === 'string') {
            let cleanStr = rawDate.split(' ')[0].replace(/\//g, '-');
            const parts = cleanStr.split('-');
            if (parts.length === 3) {
              if (parts[0].length <= 2 && parts[2].length === 4) {
                dateStr = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
              } else {
                dateStr = cleanStr;
              }
            } else {
              dateStr = cleanStr.substring(0, 10);
            }
          }
        }
      } catch {
        dateStr = '2000-01-01';
      }

      return {
        id: a.id,
        ...a.raw,
        BU: a.bu || a.raw.BU,
        Segmento: a.segmento || a.raw.Segmento,
        jornada: a.jornada || a.raw.jornada || a.raw.Jornada,
        Canal: a.canal || a.raw.Canal,
        'Data de Disparo': dateStr
      } as unknown as ActivityRow;
    });
  }, [storeActivitiesRaw]);

  const [fetchedActivities, setFetchedActivities] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (storeActivities.length > 0) return;
    let cancelled = false;
    setLoading(true);
    activityService.getAllActivities()
      .then((data) => { if (!cancelled) { setFetchedActivities(data); setError(null); } })
      .catch((err) => { if (!cancelled) setError(err.message ?? 'Erro ao carregar atividades'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [storeActivities.length]);

  const activities: ActivityRow[] = storeActivities.length > 0 ? storeActivities : fetchedActivities;

  const { startDate, endDate } = usePeriod();
  const periodInicio = format(startDate, 'yyyy-MM-dd');
  const periodFim = format(endDate, 'yyyy-MM-dd');

  const {
    filters,
    metric,
    temporalMetric,
    searchQuery,
    selectedNodeIds,
    comparisonFocusNodeId,
    detailsPaneNodeId,
    setFilters,
    setMetric,
    setTemporalMetric,
    setSearchQuery,
    setSelectedNodeIds,
    setComparisonFocusNode,
    resetComparisonFocus,
    deselectAll,
    setDetailsPaneNode,
  } = useExplorerStore();

  useEffect(() => {
    setFilters({ periodo: { inicio: periodInicio, fim: periodFim } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodInicio, periodFim]);

  const { rootNodes, nodeMap } = useTreeData({ activities, filters });

  const {
    handleToggle,
    handleSelect,
    handleExpandAll,
    handleCollapseAll,
    handleExpandToNode,
    handleKeyDown,
  } = useTreeNavigation(rootNodes, nodeMap);

  const {
    barChartData,
    distributionLevel,
    drillPath,
    dailySimpleData,
    dailyStackedData,
    stackedKeys
  } = useComparisonData({
    selectedNodeIds,
    nodeMap,
    metric,
    temporalMetric,
    allActivities: activities,
    filters,
    comparisonFocusNodeId,
  });

  const detailsData = useDetailsPaneData(
    detailsPaneNodeId,
    nodeMap,
    activities,
    filters.periodo
  );

  const searchResults = useExplorerSearch(nodeMap, searchQuery);

  const toFocusFromNode = React.useCallback((nodeId: string): string | null => {
    const node = nodeMap.get(nodeId);
    if (!node) return null;
    if (node.type === 'bu') {
      return explorerFocus.build({ bu: node.label });
    }
    if (node.type === 'segmento') {
      const parentBu = node.parentId ? nodeMap.get(node.parentId) : null;
      if (!parentBu) return null;
      return explorerFocus.build({ bu: parentBu.label, segmento: node.label });
    }
    if (node.type === 'canal') {
      const parentSegmento = node.parentId ? nodeMap.get(node.parentId) : null;
      const parentBu = parentSegmento?.parentId ? nodeMap.get(parentSegmento.parentId) : null;
      if (!parentBu || !parentSegmento) return null;
      return explorerFocus.build({ bu: parentBu.label, segmento: parentSegmento.label, canal: node.label });
    }
    return null;
  }, [nodeMap]);

  const allBuNodeIds = rootNodes.map((n) => n.id);
  const allBusSelected = allBuNodeIds.length > 0 && allBuNodeIds.every(id => selectedNodeIds.includes(id));

  const handleResetComparison = React.useCallback(() => {
    if (allBusSelected) {
      setSelectedNodeIds([]);
    } else {
      setSelectedNodeIds(allBuNodeIds);
    }
    resetComparisonFocus();
    setDetailsPaneNode(null);
  }, [allBusSelected, allBuNodeIds, setSelectedNodeIds, resetComparisonFocus, setDetailsPaneNode]);

  const handleViewAll = () => {
    if (!detailsData || !onNavigateToFramework) return;
    const { node } = detailsData;
    const filterMap: Record<string, { bu?: string; segmento?: string; jornada?: string }> = {
      bu: { bu: node.label },
      segmento: { segmento: node.label },
      jornada: { jornada: node.label },
      canal: {},
    };
    onNavigateToFramework(filterMap[node.type] ?? {});
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500 gap-2">
        <Loader2 size={16} className="animate-spin" />
        <span className="text-sm">Carregando atividades...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-red-400">
          <p className="text-sm font-medium">Erro ao carregar dados</p>
          <p className="text-xs text-red-500 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full gap-4 p-4 overflow-hidden">
      <aside className="w-72 shrink-0 flex flex-col gap-3 overflow-hidden">
        <div className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-sm">
          <span className="text-xs font-semibold text-slate-600">
            {format(startDate, 'dd MMM', { locale: ptBR })} - {format(endDate, 'dd MMM yyyy', { locale: ptBR })}
          </span>
          <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{activities.length.toLocaleString('pt-BR')} disparos</span>
        </div>

        <QuickSearch
          query={searchQuery}
          results={searchResults}
          onChange={setSearchQuery}
          onSelect={(nodeId) => {
            handleExpandToNode(nodeId);
            const focusId = toFocusFromNode(nodeId);
            setComparisonFocusNode(focusId);
            setSearchQuery('');
          }}
          onClear={() => setSearchQuery('')}
        />

        <div className="flex-1 overflow-y-auto bg-white rounded-xl border border-slate-200 shadow-sm p-2 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
          <TreeView
            rootNodes={rootNodes}
            onToggle={handleToggle}
            onSelect={(nodeId, multiSelect) => {
              handleSelect(nodeId, multiSelect);
              const focusId = toFocusFromNode(nodeId);
              setComparisonFocusNode(focusId);
              setDetailsPaneNode(nodeId);
            }}
            onKeyDown={handleKeyDown}
            onExpandAll={handleExpandAll}
            onCollapseAll={handleCollapseAll}
            onResetComparison={handleResetComparison}
          />
        </div>

        <div className="text-[11px] font-medium text-slate-500 text-center uppercase tracking-widest mt-1">
          {rootNodes.length} BUs - {rootNodes.reduce((s, n) => s + n.count, 0).toLocaleString('pt-BR')} disparos no periodo
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col gap-4 overflow-hidden bg-slate-50/50 rounded-2xl p-4 border border-slate-200/60 shadow-inner">
        <div className="h-[60%] min-h-[320px] overflow-y-auto bg-white rounded-xl border border-slate-200 shadow-sm p-4 relative">
          <ComparisonPanel
            barChartData={barChartData}
            distributionLevel={distributionLevel}
            drillPath={drillPath}
            dailySimpleData={dailySimpleData}
            dailyStackedData={dailyStackedData}
            stackedKeys={stackedKeys}
            metric={metric}
            temporalMetric={temporalMetric}
            onMetricChange={setMetric}
            onTemporalMetricChange={setTemporalMetric}
            onBarClick={(focusId) => {
              if (!focusId) return;
              setComparisonFocusNode(focusId);
              setDetailsPaneNode(null);
            }}
          />
        </div>

        <div className="h-[40%] min-h-[280px] shrink-0">
          <DetailsPane
            data={detailsData}
            onClose={() => { deselectAll(); setDetailsPaneNode(null); }}
            onViewAll={handleViewAll}
          />
        </div>
      </div>
    </div>
  );
};
