import React, { useMemo, useState } from 'react';
import { format, subDays } from 'date-fns';
import { CalendarData } from '../../types/framework';
import { usePeriod } from '../../contexts/PeriodContext';
import {
  aggregateDailyByDimension,
  aggregateDailyTotals,
  accumulateDailyDimensionRows,
  accumulateDailyTotals,
} from '../../utils/dailyAggregation';
import { DailyResultsTable } from './DailyResultsTable';
import { DailyStackedBarChart } from './DailyStackedBarChart';

interface DailyReportViewProps {
  data: CalendarData;
  selectedBU?: string;
  rentabilizacao?: boolean;
}

export const DailyReportView: React.FC<DailyReportViewProps> = ({ data, selectedBU, rentabilizacao = false }) => {
  const { startDate, endDate, setPeriod } = usePeriod();
  const [accumulated, setAccumulated] = useState(false);

  const dailyTotalsRaw = useMemo(() => aggregateDailyTotals(data), [data]);
  const segmentRowsRaw = useMemo(() => aggregateDailyByDimension(data, 'segmento'), [data]);
  const channelRowsRaw = useMemo(() => aggregateDailyByDimension(data, 'canal'), [data]);

  const dailyTotals = useMemo(
    () => (accumulated ? accumulateDailyTotals(dailyTotalsRaw) : dailyTotalsRaw),
    [accumulated, dailyTotalsRaw],
  );
  const segmentRows = useMemo(
    () => (accumulated ? accumulateDailyDimensionRows(segmentRowsRaw) : segmentRowsRaw),
    [accumulated, segmentRowsRaw],
  );
  const channelRows = useMemo(
    () => (accumulated ? accumulateDailyDimensionRows(channelRowsRaw) : channelRowsRaw),
    [accumulated, channelRowsRaw],
  );

  const quickRanges = [7, 14, 30];
  const activeQuickRange = quickRanges.find((days) => {
    const expectedStart = subDays(endDate, days - 1);
    return (
      format(startDate, 'yyyy-MM-dd') === format(expectedStart, 'yyyy-MM-dd')
    );
  });

  const applyQuickRange = (days: number) => {
    setPeriod(subDays(endDate, days - 1), endDate, 'custom');
  };

  if (dailyTotalsRaw.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
        Nenhum dado diário disponível para os filtros atuais.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <span className="text-xs text-slate-400">
          {selectedBU ? `BU ${selectedBU} · ` : ''}{dailyTotalsRaw.length} dia{dailyTotalsRaw.length !== 1 ? 's' : ''} no recorte
        </span>

        {/* Toggle Diário ↔ Acumulado */}
        <div className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
          {[
            { key: false, label: 'Diário' },
            { key: true, label: 'Acumulado' },
          ].map((option) => (
            <button
              key={String(option.key)}
              type="button"
              onClick={() => setAccumulated(option.key)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                accumulated === option.key
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Atalho diário</span>
        <div className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
          {quickRanges.map((days) => (
            <button
              key={days}
              type="button"
              onClick={() => applyQuickRange(days)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                activeQuickRange === days
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              {days}D
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-400">ou use o período personalizado do topo</span>
      </div>

      <div className="grid grid-cols-1 gap-6 2xl:grid-cols-2">
        <DailyStackedBarChart
          title={accumulated ? 'Evolução diária acumulada por segmento' : 'Evolução diária por segmento'}
          rows={segmentRows}
          dimension="segmento"
          rentabilizacao={rentabilizacao}
          accumulated={accumulated}
        />
        <DailyStackedBarChart
          title={accumulated ? 'Evolução diária acumulada por canal' : 'Evolução diária por canal'}
          rows={channelRows}
          dimension="canal"
          rentabilizacao={rentabilizacao}
          accumulated={accumulated}
        />
      </div>

      <DailyResultsTable rows={dailyTotals} rentabilizacao={rentabilizacao} accumulated={accumulated} />
    </div>
  );
};
