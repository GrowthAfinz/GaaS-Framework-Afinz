import React, { useMemo, useState } from 'react';
import { PieChart, Pie, BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { CalendarData, Activity } from '../types/framework';
import { Filter, PieChartIcon, BarChart3 } from 'lucide-react';

interface DistributionAnalysisProps {
  data: CalendarData;
}

type MetricType = 'cartoes' | 'custo' | 'envios' | 'aprovacoes' | 'cac';
type GroupByType = 'canal' | 'bu' | 'parceiro' | 'oferta' | 'segmento';
type ChartType = 'pie' | 'bar';
type SortType = 'desc' | 'asc' | 'alpha';

const COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899', '#6366F1', '#14B8A6'];

export const DistributionAnalysis: React.FC<DistributionAnalysisProps> = ({ data }) => {
  const [metric, setMetric] = useState<MetricType>('cartoes');
  const [groupBy, setGroupBy] = useState<GroupByType>('canal');
  const [chartType, setChartType] = useState<ChartType>('pie');
  const [sortType, setSortType] = useState<SortType>('desc');

  const chartData = useMemo(() => {
    const groups: Record<string, { name: string; value: number; cost: number; cards: number }> = {};

    Object.values(data).flat().forEach((activity: Activity) => {
      let key = '';
      switch (groupBy) {
        case 'canal':
          key = activity.canal;
          break;
        case 'bu':
          key = activity.bu;
          break;
        case 'parceiro':
          key = activity.parceiro;
          break;
        case 'oferta':
          key = activity.oferta || 'Padrao';
          break;
        case 'segmento':
          key = activity.segmento;
          break;
        default:
          key = 'Outros';
      }

      if (!key) key = 'Outros';

      if (!groups[key]) {
        groups[key] = { name: key, value: 0, cost: 0, cards: 0 };
      }

      const kpis = activity.kpis;
      groups[key].cost += kpis.custoTotal || 0;
      groups[key].cards += kpis.cartoes || 0;

      switch (metric) {
        case 'cartoes':
          groups[key].value += kpis.cartoes || 0;
          break;
        case 'custo':
          groups[key].value += kpis.custoTotal || 0;
          break;
        case 'envios':
          groups[key].value += kpis.baseEnviada || 0;
          break;
        case 'aprovacoes':
          groups[key].value += kpis.aprovados || 0;
          break;
        case 'cac':
          break;
        default:
          break;
      }
    });

    let result = Object.values(groups);

    if (metric === 'cac') {
      result = result.map((g) => ({
        ...g,
        value: g.cards > 0 ? parseFloat((g.cost / g.cards).toFixed(2)) : 0,
      }));
    }

    switch (sortType) {
      case 'desc':
        result.sort((a, b) => b.value - a.value);
        break;
      case 'asc':
        result.sort((a, b) => a.value - b.value);
        break;
      case 'alpha':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        break;
    }

    return result;
  }, [data, metric, groupBy, sortType]);

  const formatValue = (value: number) => {
    if (metric === 'custo') return `R$ ${(value / 1000).toFixed(1)}k`;
    if (metric === 'cac') return `R$ ${value.toFixed(2)}`;
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  const total = useMemo(() => {
    if (metric === 'cac') {
      const totalCost = chartData.reduce((acc, curr) => acc + curr.cost, 0);
      const totalCards = chartData.reduce((acc, curr) => acc + curr.cards, 0);
      return totalCards > 0 ? totalCost / totalCards : 0;
    }
    return chartData.reduce((acc, curr) => acc + curr.value, 0);
  }, [chartData, metric]);

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-8">

      <div className="flex flex-col gap-6 mb-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
            <Filter size={24} className="text-blue-400" />
            Análise de Distribuição
          </h2>

          <div className="flex gap-2 bg-slate-900 rounded-lg p-1.5 border border-slate-700">
            <button
              onClick={() => setChartType('pie')}
              className={`flex items-center gap-2 px-4 py-2 rounded text-base font-medium transition ${chartType === 'pie' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'
                }`}
            >
              <PieChartIcon size={18} />
              Pizza
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={`flex items-center gap-2 px-4 py-2 rounded text-base font-medium transition ${chartType === 'bar' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'
                }`}
            >
              <BarChart3 size={18} />
              Barras
            </button>
          </div>
        </div>

        <div className="flex gap-3 items-center">
          <select
            value={metric}
            onChange={(e) => setMetric(e.target.value as MetricType)}
            className="bg-slate-900 border border-slate-700 text-slate-200 text-base rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[180px]"
          >
            <option value="cartoes">Cartões Gerados</option>
            <option value="custo">Custo Total</option>
            <option value="envios">Base Enviada</option>
            <option value="aprovacoes">Aprovações</option>
            <option value="cac">CAC Médio</option>
          </select>

          <span className="text-slate-400 text-base font-medium">por</span>

          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as GroupByType)}
            className="bg-slate-900 border border-slate-700 text-slate-200 text-base rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[150px]"
          >
            <option value="canal">Canal</option>
            <option value="bu">BU</option>
            <option value="parceiro">Parceiro</option>
            <option value="oferta">Oferta</option>
            <option value="segmento">Segmento</option>
          </select>

          <span className="text-slate-600 text-base">•</span>

          <select
            value={sortType}
            onChange={(e) => setSortType(e.target.value as SortType)}
            className="bg-slate-900 border border-slate-700 text-slate-200 text-base rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[170px]"
          >
            <option value="desc">Maior → Menor</option>
            <option value="asc">Menor → Maior</option>
            <option value="alpha">Alfabética</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-10 items-start">
        <div className="col-span-2 h-[500px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'pie' ? (
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={160}
                  paddingAngle={2}
                  stroke="#0f172a"
                  strokeWidth={2}
                  labelLine={false}
                  label={({ percent = 0, name }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                >
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            ) : (
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
              >
                <XAxis
                  type="number"
                  stroke="#94a3b8"
                  tick={{ fill: '#94a3b8', fontSize: 14 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="#94a3b8"
                  tick={{ fill: '#94a3b8', fontSize: 14 }}
                  tickLine={false}
                  axisLine={false}
                  width={90}
                />
                <Tooltip
                  formatter={(value: number) => formatValue(value)}
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderColor: '#334155',
                    color: '#f1f5f9',
                    fontSize: '14px',
                    padding: '12px',
                    borderRadius: '8px',
                  }}
                  itemStyle={{ color: '#f1f5f9' }}
                />
                <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={40}>
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>

        <div className="space-y-5">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-6 border border-slate-700 text-center shadow-lg">
            <p className="text-base text-slate-400 mb-3 font-medium">
              {metric === 'cac' ? 'CAC Médio Global' : 'Total Geral'}
            </p>
            <p className="text-5xl font-bold text-white mb-2">{formatValue(total)}</p>
          </div>

          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-3 custom-scrollbar">
            {chartData.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-base p-3 hover:bg-slate-700/40 rounded-lg transition bg-slate-900/30 border border-slate-700/50"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full shadow-md"
                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                  />
                  <span className="text-slate-200 font-medium">{item.name}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="font-bold text-slate-100 text-lg">{formatValue(item.value)}</span>
                  {metric !== 'cac' && total > 0 && (
                    <span className="text-sm text-slate-400 font-medium">
                      {((item.value / total) * 100).toFixed(1)}%
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
