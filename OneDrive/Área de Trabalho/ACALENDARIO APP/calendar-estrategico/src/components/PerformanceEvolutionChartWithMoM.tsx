import React, { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Bar
} from 'recharts';
import { CalendarData, PeriodComparison } from '../types/framework';
import { format, startOfWeek, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PeriodSelector } from './PeriodSelector';
import { useMoMComparison } from '../hooks/useMoMComparison';
import { formatPercentChange, getPercentChangeColor } from '../utils/momCalculations';

interface PerformanceEvolutionChartWithMoMProps {
  data: CalendarData;
  selectedBU?: string;
  selectedCanais?: string[];
  selectedSegmentos?: string[];
  selectedParceiros?: string[];
  onDayClick?: (date: string) => void;
}

type MetricType = 'conversao' | 'cac' | 'entrega' | 'abertura';
type GroupBy = 'daily' | 'weekly';

export const PerformanceEvolutionChartWithMoM: React.FC<PerformanceEvolutionChartWithMoMProps> = ({
  data,
  selectedBU,
  selectedCanais = [],
  selectedSegmentos = [],
  selectedParceiros = [],
  onDayClick
}) => {
  const [metric, setMetric] = useState<MetricType>('conversao');
  const [groupBy, setGroupBy] = useState<GroupBy>('daily');
  const [periodComparison, setPeriodComparison] = useState<PeriodComparison>({
    current: {
      startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      endDate: new Date()
    },
    isMoMEnabled: false
  });

  // Use the MoM comparison hook
  const comparisonData = useMoMComparison({
    data,
    periodComparison,
    filters: {
      bu: selectedBU,
      canais: selectedCanais,
      segmentos: selectedSegmentos,
      parceiros: selectedParceiros
    }
  });

  // Process data for chart display
  const chartData = useMemo(() => {
    if (comparisonData.length === 0) return [];

    const aggregated: Record<string, any> = {};

    comparisonData.forEach(item => {
      let key = item.date;
      let label = item.label;
      let timestamp = item.timestamp;

      if (groupBy === 'weekly') {
        const date = parseISO(item.date);
        const weekStart = startOfWeek(date, { weekStartsOn: 0 });
        key = format(weekStart, 'yyyy-MM-dd');
        label = `Sem ${format(weekStart, 'dd/MM')}`;
        timestamp = weekStart.getTime();
      }

      if (!aggregated[key]) {
        aggregated[key] = {
          date: key,
          label,
          timestamp,
          currentValue: 0,
          previousValue: 0,
          count: 0,
          metrics: {
            baseEnviada: 0,
            baseEntregue: 0,
            propostas: 0,
            cartoes: 0,
            custo: 0,
            previousBaseEnviada: 0,
            previousBaseEntregue: 0,
            previousPropostas: 0,
            previousCartoes: 0,
            previousCusto: 0
          }
        };
      }

      // Calculate metric value
      let currentValue = 0;
      let previousValue = 0;

      switch (metric) {
        case 'conversao':
          currentValue = item.baseEnviada > 0 ? (item.cartoes / item.baseEnviada) * 100 : 0;
          previousValue = item.previousData?.baseEnviada ? (item.previousData.cartoes / item.previousData.baseEnviada) * 100 : 0;
          break;
        case 'cac':
          currentValue = item.cartoes > 0 ? item.custo / item.cartoes : 0;
          previousValue = item.previousData?.cartoes ? item.previousData.custo / item.previousData.cartoes : 0;
          break;
        case 'entrega':
          currentValue = item.baseEnviada > 0 ? (item.baseEntregue / item.baseEnviada) * 100 : 0;
          previousValue = item.previousData?.baseEnviada ? (item.previousData.baseEntregue / item.previousData.baseEnviada) * 100 : 0;
          break;
        case 'abertura':
          currentValue = item.baseEntregue > 0 ? (item.propostas / item.baseEntregue) * 100 : 0;
          previousValue = item.previousData?.baseEntregue ? (item.previousData.propostas / item.previousData.baseEntregue) * 100 : 0;
          break;
      }

      aggregated[key].currentValue += currentValue;
      if (periodComparison.isMoMEnabled) {
        aggregated[key].previousValue += previousValue;
      }
      aggregated[key].count += 1;

      // Store raw metrics for tooltips
      aggregated[key].metrics.baseEnviada += item.baseEnviada;
      aggregated[key].metrics.baseEntregue += item.baseEntregue;
      aggregated[key].metrics.propostas += item.propostas;
      aggregated[key].metrics.cartoes += item.cartoes;
      aggregated[key].metrics.custo += item.custo;

      if (item.previousData) {
        aggregated[key].metrics.previousBaseEnviada += item.previousData.baseEnviada;
        aggregated[key].metrics.previousBaseEntregue += item.previousData.baseEntregue;
        aggregated[key].metrics.previousPropostas += item.previousData.propostas;
        aggregated[key].metrics.previousCartoes += item.previousData.cartoes;
        aggregated[key].metrics.previousCusto += item.previousData.custo;
      }
    });

    return Object.values(aggregated)
      .map(item => ({
        ...item,
        currentValue: Number((item.currentValue / item.count).toFixed(2)),
        previousValue: Number((item.previousValue / item.count).toFixed(2))
      }))
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [comparisonData, groupBy, metric, periodComparison.isMoMEnabled]);

  // Calculate stats
  const stats = useMemo(() => {
    if (chartData.length === 0) return { avg: 0, max: 0, maxDate: '', min: 0, minDate: '', momChange: 0 };
    const values = chartData.map(d => d.currentValue);
    const max = Math.max(...values);
    const min = Math.min(...values);
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;

    const maxItem = chartData.find(d => d.currentValue === max);
    const minItem = chartData.find(d => d.currentValue === min);

    // Calculate overall MoM change
    const totalCurrent = chartData.reduce((sum, d) => sum + d.currentValue, 0);
    const totalPrevious = chartData.reduce((sum, d) => sum + d.previousValue, 0);
    const momChange = totalPrevious !== 0 ? ((totalCurrent - totalPrevious) / totalPrevious) * 100 : 0;

    return {
      avg: avg.toFixed(2),
      max: max.toFixed(2),
      maxDate: maxItem?.label || '',
      min: min.toFixed(2),
      minDate: minItem?.label || '',
      momChange: momChange.toFixed(2)
    };
  }, [chartData]);

  const handleDotClick = (data: any) => {
    if (onDayClick && groupBy === 'daily') {
      const dateStr = data.payload?.date || data.date;
      if (dateStr) {
        onDayClick(dateStr);
      }
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;

    const data = payload[0].payload;
    const unit = metric === 'cac' ? '' : '%';

    return (
      <div className="bg-slate-900 border border-slate-700 p-4 rounded shadow-lg">
        <p className="text-slate-200 font-bold mb-2">{data.label}</p>

        <div className="space-y-1 mb-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-slate-400 text-xs">Atual:</span>
            <span className="text-slate-200 font-mono font-bold">
              {data.currentValue.toFixed(2)}{unit}
            </span>
          </div>

          {periodComparison.isMoMEnabled && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-slate-600" />
              <span className="text-slate-400 text-xs">Anterior:</span>
              <span className="text-slate-200 font-mono font-bold">
                {data.previousValue.toFixed(2)}{unit}
              </span>
            </div>
          )}
        </div>

        {periodComparison.isMoMEnabled && (
          <div className="border-t border-slate-700 pt-2 mt-2">
            <p className="text-xs text-slate-400">Comparativo MoM:</p>
            <p className={`text-sm font-bold ${getPercentChangeColor(data.currentValue - data.previousValue)}`}>
              {formatPercentChange(data.currentValue - data.previousValue)}
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-6">
      {/* Header with Period Selector */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            📊 Análise Temporal {periodComparison.isMoMEnabled && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">MoM</span>}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <PeriodSelector
            onPeriodChange={setPeriodComparison}
            initialDate={new Date()}
          />

          <div className="flex flex-col">
            <label className="text-[10px] text-slate-500 uppercase font-bold mb-1">Métrica</label>
            <select
              value={metric}
              onChange={(e) => setMetric(e.target.value as MetricType)}
              className="bg-white border border-slate-300 text-slate-900 text-xs rounded px-2 py-1.5"
            >
              <option value="conversao">Taxa de Conversão</option>
              <option value="cac">CAC</option>
              <option value="entrega">Taxa de Entrega</option>
              <option value="abertura">Taxa de Abertura</option>
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-[10px] text-slate-500 uppercase font-bold mb-1">Agrupamento</label>
            <div className="flex bg-slate-100 rounded p-0.5 border border-slate-200">
              <button
                onClick={() => setGroupBy('daily')}
                className={`px-2 py-1 text-xs font-medium rounded transition ${
                  groupBy === 'daily' ? 'bg-blue-600 text-white' : 'text-slate-500'
                }`}
              >
                Diário
              </button>
              <button
                onClick={() => setGroupBy('weekly')}
                className={`px-2 py-1 text-xs font-medium rounded transition ${
                  groupBy === 'weekly' ? 'bg-blue-600 text-white' : 'text-slate-500'
                }`}
              >
                Semanal
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[300px] w-full mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
            <XAxis
              dataKey="label"
              stroke="#94A3B8"
              tick={{ fill: '#94A3B8', fontSize: 10 }}
            />
            <YAxis stroke="#94A3B8" tick={{ fill: '#94A3B8', fontSize: 10 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />

            <Line
              type="monotone"
              dataKey="currentValue"
              name="Período Atual"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={groupBy === 'daily' ? { r: 5, fill: '#3b82f6', cursor: 'pointer' } : { r: 4 }}
              activeDot={{ r: 7 }}
              onClick={handleDotClick}
            />

            {periodComparison.isMoMEnabled && (
              <Line
                type="monotone"
                dataKey="previousValue"
                name="Período Anterior"
                stroke="#94a3b8"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ r: 3, fill: '#94a3b8' }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Stats */}
      <div className="pt-4 border-t border-slate-200">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
          <div>
            <span className="text-slate-500 block text-xs font-medium mb-1">Média</span>
            <span className="text-slate-900 font-bold">{stats.avg}{metric === 'cac' ? '' : '%'}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-xs font-medium mb-1">Máx</span>
            <span className="text-slate-900 font-bold">{stats.max}{metric === 'cac' ? '' : '%'}</span>
            <span className="text-xs text-slate-500">({stats.maxDate})</span>
          </div>
          <div>
            <span className="text-slate-500 block text-xs font-medium mb-1">Mín</span>
            <span className="text-slate-900 font-bold">{stats.min}{metric === 'cac' ? '' : '%'}</span>
            <span className="text-xs text-slate-500">({stats.minDate})</span>
          </div>
          {periodComparison.isMoMEnabled && (
            <div className="col-span-2 md:col-span-2 p-3 bg-blue-50 border border-blue-200 rounded">
              <span className="text-slate-600 block text-xs font-medium mb-1">Variação MoM</span>
              <span className={`font-bold text-sm ${getPercentChangeColor(parseFloat(stats.momChange))}`}>
                {formatPercentChange(parseFloat(stats.momChange))}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
