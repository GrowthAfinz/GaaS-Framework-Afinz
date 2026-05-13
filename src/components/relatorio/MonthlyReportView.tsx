import React, { useMemo } from 'react';
import { endOfMonth, format, startOfMonth, subMonths } from 'date-fns';
import { CalendarData } from '../../types/framework';
import { usePeriod } from '../../contexts/PeriodContext';
import {
  aggregateMonthlyByDimension,
  aggregateMonthlyTotals,
} from '../../utils/monthlyAggregation';
import { MonthlyResultsTable } from './MonthlyResultsTable';
import { MonthlyStackedBarChart } from './MonthlyStackedBarChart';

interface MonthlyReportViewProps {
  data: CalendarData;
  selectedBU?: string;
}

export const MonthlyReportView: React.FC<MonthlyReportViewProps> = ({ data, selectedBU }) => {
  const { startDate, endDate, setPeriod } = usePeriod();
  const monthlyTotals = useMemo(() => aggregateMonthlyTotals(data), [data]);
  const segmentRows = useMemo(() => aggregateMonthlyByDimension(data, 'segmento'), [data]);
  const channelRows = useMemo(() => aggregateMonthlyByDimension(data, 'canal'), [data]);

  const quickRanges = [3, 6, 12];
  const activeQuickRange = quickRanges.find((months) => {
    const expectedStart = startOfMonth(subMonths(endDate, months - 1));
    const expectedEnd = endOfMonth(endDate);
    return (
      format(startDate, 'yyyy-MM-dd') === format(expectedStart, 'yyyy-MM-dd') &&
      format(endDate, 'yyyy-MM-dd') === format(expectedEnd, 'yyyy-MM-dd')
    );
  });

  const applyQuickRange = (months: number) => {
    const anchor = endDate;
    setPeriod(
      startOfMonth(subMonths(anchor, months - 1)),
      endOfMonth(anchor),
      'custom',
    );
  };

  if (monthlyTotals.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
        Nenhum dado mensal disponível para os filtros atuais.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-end gap-2">
          <span className="text-xs text-slate-400">
            {selectedBU ? `BU ${selectedBU} · ` : ''}{monthlyTotals.length} mês{monthlyTotals.length !== 1 ? 'es' : ''} no recorte
          </span>
          <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Atalho mensal</span>
          <div className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
            {quickRanges.map((months) => (
              <button
                key={months}
                type="button"
                onClick={() => applyQuickRange(months)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                  activeQuickRange === months
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`}
              >
                {months}M
              </button>
            ))}
          </div>
          <span className="text-xs text-slate-400">ou use o período personalizado do topo</span>
      </div>

      <div className="grid grid-cols-1 gap-6 2xl:grid-cols-2">
        <MonthlyStackedBarChart
          title="Evolução mensal por segmento"
          rows={segmentRows}
          dimension="segmento"
        />
        <MonthlyStackedBarChart
          title="Evolução mensal por canal"
          rows={channelRows}
          dimension="canal"
        />
      </div>

      <MonthlyResultsTable rows={monthlyTotals} />
    </div>
  );
};
