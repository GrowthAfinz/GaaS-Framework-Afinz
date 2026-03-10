import React from 'react';
import { BarChartDataPoint, HeatmapCell, ExplorerMetric } from '../../../types/explorer';
import { MetricToggle } from './MetricToggle';
import { SegmentBarChart } from './SegmentBarChart';
import { TimelineHeatmap } from './TimelineHeatmap';

interface ComparisonPanelProps {
  barChartData: BarChartDataPoint[];
  heatmapData: HeatmapCell[];
  weekLabels: string[];
  metric: ExplorerMetric;
  onMetricChange: (metric: ExplorerMetric) => void;
  onBarClick: (nodeId: string) => void;
}

export const ComparisonPanel: React.FC<ComparisonPanelProps> = ({
  barChartData,
  heatmapData,
  weekLabels,
  metric,
  onMetricChange,
  onBarClick,
}) => (
  <div className="flex flex-col gap-4 h-full">
    {/* Header + Toggle */}
    <div className="flex items-center justify-between">
      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">
        Comparação Visual
      </h3>
      <MetricToggle value={metric} onChange={onMetricChange} />
    </div>

    {/* Bar Chart */}
    <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 shadow-sm">
      <p className="text-xs text-slate-500 mb-3 font-semibold uppercase tracking-wider">Distribuição por segmento</p>
      <SegmentBarChart data={barChartData} metric={metric} onBarClick={onBarClick} />
    </div>

    {/* Heatmap */}
    <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 shadow-sm">
      <p className="text-xs text-slate-500 mb-3 font-semibold uppercase tracking-wider">Concentração temporal (semanas)</p>
      <TimelineHeatmap cells={heatmapData} weekLabels={weekLabels} metric={metric} />
    </div>
  </div>
);
