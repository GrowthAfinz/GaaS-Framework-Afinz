import React from 'react';
import {
  BarChartDataPoint,
  DailyTowerPoint,
  DistributionLevel,
  ExplorerMetric,
  TemporalViewMode
} from '../../../types/explorer';
import { MetricToggle } from './MetricToggle';
import { SegmentBarChart } from './SegmentBarChart';
import { DailyTowerChart } from './DailyTowerChart';
import { useAppStore } from '../../../store/useAppStore';

const TEMPORAL_METRIC_OPTIONS: { value: ExplorerMetric; label: string }[] = [
  { value: 'disparos', label: 'Qtd Disparos' },
  { value: 'cartoes', label: 'Cartões' },
  { value: 'volume', label: 'Volume' },
  { value: 'custo', label: 'Custo' },
  { value: 'cac', label: 'CAC' },
];

interface ComparisonPanelProps {
  barChartData: BarChartDataPoint[];
  distributionLevel: DistributionLevel;
  drillPath: string[];
  dailySimpleData: DailyTowerPoint[];
  dailyStackedData: DailyTowerPoint[];
  stackedKeys: string[];
  metric: ExplorerMetric;
  temporalMetric: ExplorerMetric;
  onMetricChange: (metric: ExplorerMetric) => void;
  onTemporalMetricChange: (metric: ExplorerMetric) => void;
  onBarClick: (focusId: string | null) => void;
  onDayClick?: (date: string) => void;
}

export const ComparisonPanel: React.FC<ComparisonPanelProps> = ({
  barChartData,
  distributionLevel,
  drillPath,
  dailySimpleData,
  dailyStackedData,
  stackedKeys,
  metric,
  temporalMetric,
  onMetricChange,
  onTemporalMetricChange,
  onBarClick,
  onDayClick,
}) => {
  const rentab = useAppStore((state) => state.viewSettings.frente === 'rentabilizacao');
  const [temporalMode, setTemporalMode] = React.useState<TemporalViewMode>('simple');
  const temporalOptions = rentab
    ? [
        { value: 'disparos' as ExplorerMetric, label: 'Qtd Disparos' },
        { value: 'aberturas' as ExplorerMetric, label: 'Aberturas' },
        { value: 'cliques' as ExplorerMetric, label: 'Cliques' },
        { value: 'taxaClique' as ExplorerMetric, label: '% Clique' },
        { value: 'custo' as ExplorerMetric, label: 'Custo Total' },
      ]
    : TEMPORAL_METRIC_OPTIONS;

  const distributionLabel = distributionLevel === 'bu'
    ? 'Distribuidor por BU'
    : distributionLevel === 'segmento'
      ? 'Distribuidor por Segmento'
      : distributionLevel === 'jornada'
        ? 'Distribuidor por Jornada'
        : distributionLevel === 'canal'
          ? 'Distribuidor por Canal'
          : 'Detalhamento por Disparo';

  return (
    <div className="flex flex-col gap-5 h-full">
      <div className="flex items-center justify-between pb-1">
        <h3 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest pl-1">
          Comparação Visual
        </h3>
        <MetricToggle value={metric} onChange={onMetricChange} />
      </div>

      {drillPath.length > 0 && (
        <div className="flex items-center gap-2 text-[11px] text-slate-500 bg-[#f0fdfa]/60 border border-[#00c6cc]/15 rounded-xl px-3.5 py-2 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)] transition-all">
          <span className="text-[#007c80] font-bold">Foco:</span>
          {drillPath.map((p, i) => (
            <React.Fragment key={p}>
              {i > 0 && <span className="text-[#00c6cc]/40">›</span>}
              <span className="font-semibold text-slate-700">{p}</span>
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Bar Chart Container */}
      <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.015)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.025)] transition-all duration-300">
        <p className="text-[10px] font-bold text-slate-400 mb-4 uppercase tracking-widest">{distributionLabel}</p>
        <SegmentBarChart data={barChartData} metric={metric} onBarClick={onBarClick} />
      </div>

      {/* Daily Chart Container */}
      <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.015)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.025)] transition-all duration-300">
        <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest shrink-0">
            Concentração Temporal Diária
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            {/* Temporal metric selector */}
            <div className="flex items-center gap-0.5 bg-slate-100/80 border border-slate-200/50 rounded-lg p-0.5">
              {temporalOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => onTemporalMetricChange(opt.value)}
                  className={[
                    'px-2.5 py-1 text-[10px] font-bold rounded-md transition-all duration-150',
                    temporalMetric === opt.value
                      ? 'bg-[#00c6cc] text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50',
                  ].join(' ')}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {/* Simple / Stacked toggle */}
            <div className="flex items-center gap-0.5 bg-slate-100/80 border border-slate-200/50 rounded-lg p-0.5">
              <button
                onClick={() => setTemporalMode('simple')}
                className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all duration-150 ${temporalMode === 'simple' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-850 hover:bg-slate-250/50'}`}
              >
                Simples
              </button>
              <button
                onClick={() => setTemporalMode('stacked')}
                className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all duration-150 ${temporalMode === 'stacked' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-850 hover:bg-slate-250/50'}`}
              >
                Empilhado
              </button>
            </div>
          </div>
        </div>
        <DailyTowerChart
          mode={temporalMode}
          metric={temporalMetric}
          simpleData={dailySimpleData}
          stackedData={dailyStackedData}
          stackedKeys={stackedKeys}
          onBarClick={onDayClick}
        />
      </div>
    </div>
  );
};
