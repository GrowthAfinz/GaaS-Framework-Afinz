import React, { useMemo, useState } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import { CalendarData } from '../../types/framework';
import { format, startOfWeek, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Tooltip as InfoTooltip } from '../Tooltip';

interface PerformanceEvolutionChartProps {
    data: CalendarData;
    selectedBU?: string;
    selectedCanais?: string[];
    selectedSegmentos?: string[];
    selectedParceiros?: string[];
    onDayClick?: (date: string) => void;
}

type MetricType =
    | 'conversao'
    | 'cac'
    | 'entrega'
    | 'abertura'
    | 'envios'
    | 'entregas'
    | 'disparos'
    | 'propostas'
    | 'aprovados'
    | 'cartoes'
    | 'custoTotal';
type GroupBy = 'daily' | 'weekly';

export const PerformanceEvolutionChart: React.FC<PerformanceEvolutionChartProps> = ({
    data,
    selectedBU,
    selectedCanais = [],
    selectedSegmentos = [],
    selectedParceiros = [],
    onDayClick
}) => {
    const [metric, setMetric] = useState<MetricType>('conversao');
    const [groupBy, setGroupBy] = useState<GroupBy>('daily');

    const handleDotClick = (data: any) => {
        if (onDayClick && groupBy === 'daily') {
            // data.payload contains the full data object from the chart
            const dateStr = data.payload?.date || data.date;
            if (dateStr) {
                onDayClick(dateStr);
            }
        }
    };

    const formatValue = (val: number | string) => {
        const num = Number(val);
        if (isNaN(num)) return val;
        
        if (metric === 'cac' || metric === 'custoTotal') {
            return `R$ ${num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
        if (['conversao', 'entrega', 'abertura'].includes(metric)) {
            return `${num.toFixed(2)}%`;
        }
        if (['envios', 'entregas', 'disparos', 'propostas', 'aprovados', 'cartoes'].includes(metric)) {
            return Math.round(num).toLocaleString('pt-BR');
        }
        return num.toLocaleString('pt-BR');
    };

    const chartData = useMemo(() => {
        const aggregated: { [key: string]: any } = {};
        const dates = Object.keys(data).sort();

        dates.forEach(dateKey => {
            // Filter inline
            const activities = data[dateKey].filter(activity => {
                if (selectedBU && activity.bu !== selectedBU) return false;
                if (selectedCanais.length > 0 && !selectedCanais.includes(activity.canal)) return false;
                if (selectedSegmentos.length > 0 && !selectedSegmentos.includes(activity.segmento)) return false;
                if (selectedParceiros.length > 0 && !selectedParceiros.includes(activity.parceiro)) return false;
                return true;
            });

            if (activities.length === 0) return;

            let key = dateKey;
            let label = format(parseISO(dateKey), 'dd/MM', { locale: ptBR });
            let timestamp = parseISO(dateKey).getTime();

            if (groupBy === 'weekly') {
                const date = parseISO(dateKey);
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
                    baseEnviada: 0,
                    baseEntregue: 0,
                    propostas: 0,
                    aprovados: 0,
                    cartoes: 0,
                    custo: 0,
                    count: 0
                };
            }

            activities.forEach(activity => {
                aggregated[key].baseEnviada += activity.kpis.baseEnviada || 0;
                aggregated[key].baseEntregue += activity.kpis.baseEntregue || 0;
                aggregated[key].propostas += activity.kpis.propostas || 0;
                aggregated[key].aprovados += activity.kpis.aprovados || 0;
                aggregated[key].cartoes += activity.kpis.cartoes || 0;
                aggregated[key].custo += activity.kpis.custoTotal || 0;
                aggregated[key].count += 1;
            });
        });

        const result = Object.values(aggregated).map(item => {
            let value = 0;
            switch (metric) {
                case 'conversao':
                    value = item.baseEnviada > 0 ? (item.cartoes / item.baseEnviada) * 100 : 0;
                    break;
                case 'cac':
                    value = item.cartoes > 0 ? item.custo / item.cartoes : 0;
                    break;
                case 'entrega':
                    value = item.baseEnviada > 0 ? (item.baseEntregue / item.baseEnviada) * 100 : 0;
                    break;
                case 'abertura':
                    value = item.baseEntregue > 0 ? (item.propostas / item.baseEntregue) * 100 : 0;
                    break;
                case 'envios':
                    value = item.baseEnviada;
                    break;
                case 'entregas':
                    value = item.baseEntregue;
                    break;
                case 'disparos':
                    value = item.count;
                    break;
                case 'propostas':
                    value = item.propostas;
                    break;
                case 'aprovados':
                    value = item.aprovados;
                    break;
                case 'cartoes':
                    value = item.cartoes;
                    break;
                case 'custoTotal':
                    value = item.custo;
                    break;
            }
            return {
                ...item,
                value: Number(value.toFixed(2))
            };
        }).sort((a, b) => a.timestamp - b.timestamp);

        return result;
    }, [data, selectedBU, selectedCanais, selectedSegmentos, selectedParceiros, groupBy, metric]);

    const stats = useMemo(() => {
        if (chartData.length === 0) return { avg: 0, max: 0, maxDate: '', min: 0, minDate: '' };
        const values = chartData.map(d => d.value);
        const max = Math.max(...values);
        const min = Math.min(...values);
        const sum = values.reduce((a, b) => a + b, 0);
        const avg = sum / values.length;

        const maxItem = chartData.find(d => d.value === max);
        const minItem = chartData.find(d => d.value === min);

        return {
            avg: avg.toFixed(2),
            max: max.toFixed(2),
            maxDate: maxItem?.label || '',
            min: min.toFixed(2),
            minDate: minItem?.label || ''
        };
    }, [chartData]);

    return (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
                <div>
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        📊 Análise Temporal
                        <InfoTooltip content="Evolução das métricas ao longo do tempo com comparação e agrupamento." />
                    </h2>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex flex-col">
                        <label className="text-[10px] text-slate-500 uppercase font-bold mb-1">Métrica</label>
                        <select
                            value={metric}
                            onChange={(e) => setMetric(e.target.value as MetricType)}
                            className="bg-white border border-slate-300 text-slate-900 text-xs rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                            <optgroup label="Taxas & Eficiência">
                                <option value="conversao">Taxa de Conversão</option>
                                <option value="entrega">Taxa de Entrega</option>
                                <option value="abertura">Taxa de Abertura / Interesse</option>
                            </optgroup>
                            <optgroup label="Volumetria (Quantidades)">
                                <option value="disparos">Quantidade de Disparos (Atividades)</option>
                                <option value="envios">Quantidade de Envios (Base)</option>
                                <option value="entregas">Quantidade de Entregas (Base)</option>
                                <option value="propostas">Quantidade de Propostas</option>
                                <option value="aprovados">Quantidade de Aprovados</option>
                                <option value="cartoes">Quantidade de Cartões</option>
                            </optgroup>
                            <optgroup label="Financeiro">
                                <option value="cac">CAC Médio</option>
                                <option value="custoTotal">Custo Total Campanha</option>
                            </optgroup>
                        </select>
                    </div>

                    <div className="flex flex-col">
                        <label className="text-[10px] text-slate-500 uppercase font-bold mb-1">Agrupamento</label>
                        <div className="flex bg-slate-100 rounded p-0.5 border border-slate-200">
                            <button
                                onClick={() => setGroupBy('daily')}
                                className={`px-2 py-1 text-xs font-medium rounded transition ${groupBy === 'daily' ? 'bg-blue-600 text-white' : 'text-slate-500'
                                    }`}
                            >
                                Diário
                            </button>
                            <button
                                onClick={() => setGroupBy('weekly')}
                                className={`px-2 py-1 text-xs font-medium rounded transition ${groupBy === 'weekly' ? 'bg-blue-600 text-white' : 'text-slate-500'
                                    }`}
                            >
                                Semanal
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                        <XAxis
                            dataKey="label"
                            stroke="#94A3B8"
                            tick={{ fill: '#94A3B8', fontSize: 10 }}
                        />
                        <YAxis stroke="#94A3B8" tick={{ fill: '#94A3B8', fontSize: 10 }} />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#ffffff', borderColor: '#E2E8F0', color: '#1e293b' }}
                            formatter={(value: number) => {
                                let label = '';
                                if (metric === 'cac') label = 'CAC';
                                else if (metric === 'custoTotal') label = 'Custo Total';
                                else if (['conversao', 'entrega', 'abertura'].includes(metric)) label = 'Taxa';
                                else if (metric === 'disparos') label = 'Disparos';
                                else if (metric === 'envios') label = 'Envios';
                                else if (metric === 'entregas') label = 'Entregas';
                                else if (metric === 'propostas') label = 'Propostas';
                                else if (metric === 'aprovados') label = 'Aprovados';
                                else if (metric === 'cartoes') label = 'Cartões';
                                else label = 'Valor';

                                return [formatValue(value), label];
                            }}
                        />
                        <Legend />

                        <Line
                            type="monotone"
                            dataKey="value"
                            name="Atual"
                            stroke="#3b82f6"
                            strokeWidth={3}
                            dot={groupBy === 'daily' ? { r: 5, fill: '#3b82f6', strokeWidth: 0, cursor: 'pointer' } : { r: 4, fill: '#3b82f6', strokeWidth: 0 }}
                            activeDot={{ r: 7 }}
                            onClick={(state: any) => handleDotClick(state)}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-200 flex gap-6 text-sm">
                <div>
                    <span className="text-slate-500 mr-2">Média:</span>
                    <span className="text-slate-900 font-bold">{formatValue(stats.avg)}</span>
                </div>
                <div>
                    <span className="text-slate-500 mr-2">Máx:</span>
                    <span className="text-slate-900 font-bold">{formatValue(stats.max)}</span>
                    <span className="text-xs text-slate-500 ml-1">({stats.maxDate})</span>
                </div>
                <div>
                    <span className="text-slate-500 mr-2">Mín:</span>
                    <span className="text-slate-900 font-bold">{formatValue(stats.min)}</span>
                    <span className="text-xs text-slate-500 ml-1">({stats.minDate})</span>
                </div>
            </div>
        </div>
    );
};
