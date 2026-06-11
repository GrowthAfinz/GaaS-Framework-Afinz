import React, { useMemo, useState, useRef, useEffect } from 'react';
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
import { ChevronDown, Check } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

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
    | 'clique'
    | 'envios'
    | 'entregas'
    | 'disparos'
    | 'propostas'
    | 'aprovados'
    | 'cartoes'
    | 'aberturasQtd'
    | 'cliques'
    | 'custoTotal';

type GroupBy = 'daily' | 'weekly' | 'monthly';

const METRIC_CONFIGS: Record<MetricType, { label: string; color: string; group: string }> = {
    conversao: { label: 'Taxa de Conversão', color: '#3b82f6', group: 'Taxas & Eficiência' }, // Blue
    entrega: { label: 'Taxa de Entrega', color: '#10b981', group: 'Taxas & Eficiência' }, // Emerald
    abertura: { label: 'Taxa de Abertura / Interesse', color: '#f59e0b', group: 'Taxas & Eficiência' }, // Amber
    clique: { label: 'Taxa de Clique', color: '#0ea5e9', group: 'Taxas & Eficiência' }, // Sky
    envios: { label: 'Qtd de Envios (Base)', color: '#ec4899', group: 'Volumetria' }, // Pink
    entregas: { label: 'Qtd de Entregas (Base)', color: '#8b5cf6', group: 'Volumetria' }, // Purple
    disparos: { label: 'Qtd de Disparos (Atividades)', color: '#06b6d4', group: 'Volumetria' }, // Cyan
    aberturasQtd: { label: 'Qtd de Aberturas', color: '#f59e0b', group: 'Volumetria' }, // Amber
    cliques: { label: 'Qtd de Cliques', color: '#0ea5e9', group: 'Volumetria' }, // Sky
    propostas: { label: 'Qtd de Propostas', color: '#a855f7', group: 'Volumetria' }, // Purple-light
    aprovados: { label: 'Qtd de Aprovados', color: '#14b8a6', group: 'Volumetria' }, // Teal
    cartoes: { label: 'Qtd de Cartões', color: '#6366f1', group: 'Volumetria' }, // Indigo
    cac: { label: 'CAC Médio', color: '#ef4444', group: 'Financeiro' }, // Red
    custoTotal: { label: 'Custo Total Campanha', color: '#f43f5e', group: 'Financeiro' } // Rose
};

// Grupos de métricas por frente. Rentabilização foca em engajamento (sem CAC/Cartões).
const getMetricGroups = (rentab: boolean) => rentab
    ? [
        {
            label: 'Taxas & Eficiência',
            metrics: ['entrega', 'abertura', 'clique'] as MetricType[]
        },
        {
            label: 'Volumetria (Quantidades)',
            metrics: ['disparos', 'envios', 'entregas', 'aberturasQtd', 'cliques'] as MetricType[]
        }
    ]
    : [
        {
            label: 'Taxas & Eficiência',
            metrics: ['conversao', 'entrega', 'abertura'] as MetricType[]
        },
        {
            label: 'Volumetria (Quantidades)',
            metrics: ['disparos', 'envios', 'entregas', 'propostas', 'aprovados', 'cartoes'] as MetricType[]
        },
        {
            label: 'Financeiro',
            metrics: ['cac', 'custoTotal'] as MetricType[]
        }
    ];

const formatMetricValue = (val: number | string, metricType: MetricType) => {
    const num = Number(val);
    if (isNaN(num)) return val;
    
    if (metricType === 'cac' || metricType === 'custoTotal') {
        return `R$ ${num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    if (['conversao', 'entrega', 'abertura', 'clique'].includes(metricType)) {
        return `${num.toFixed(2)}%`;
    }
    return Math.round(num).toLocaleString('pt-BR');
};

export const PerformanceEvolutionChart: React.FC<PerformanceEvolutionChartProps> = ({
    data,
    selectedBU,
    selectedCanais = [],
    selectedSegmentos = [],
    selectedParceiros = [],
    onDayClick
}) => {
    const frente = useAppStore((s) => s.viewSettings.frente);
    const rentab = frente === 'rentabilizacao';
    const metricGroups = useMemo(() => getMetricGroups(rentab), [rentab]);
    const [selectedMetrics, setSelectedMetrics] = useState<MetricType[]>([rentab ? 'abertura' : 'conversao']);
    const [groupBy, setGroupBy] = useState<GroupBy>('daily');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Ao trocar de frente, garante que só métricas válidas fiquem selecionadas.
    useEffect(() => {
        const valid = new Set(metricGroups.flatMap(g => g.metrics));
        setSelectedMetrics(prev => {
            const filtered = prev.filter(m => valid.has(m));
            return filtered.length > 0 ? filtered : [rentab ? 'abertura' : 'conversao'];
        });
    }, [metricGroups, rentab]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleMetric = (m: MetricType) => {
        setSelectedMetrics(prev => {
            if (prev.includes(m)) {
                if (prev.length === 1) return prev; // Keep at least one selected
                return prev.filter(x => x !== m);
            } else {
                if (prev.length >= 3) return prev; // Limit to 3 metrics
                return [...prev, m];
            }
        });
    };

    const handleDotClick = (data: any) => {
        if (onDayClick && groupBy === 'daily') {
            const dateStr = data.payload?.date || data.date;
            if (dateStr) {
                onDayClick(dateStr);
            }
        }
    };

    const chartData = useMemo(() => {
        const aggregated: { [key: string]: any } = {};
        const dates = Object.keys(data).sort();

        dates.forEach(dateKey => {
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
            } else if (groupBy === 'monthly') {
                const date = parseISO(dateKey);
                key = format(date, 'yyyy-MM');
                label = format(date, 'MMM/yy', { locale: ptBR });
                timestamp = new Date(date.getFullYear(), date.getMonth(), 1).getTime();
            }

            if (!aggregated[key]) {
                aggregated[key] = {
                    date: key,
                    label,
                    timestamp,
                    baseEnviada: 0,
                    baseEntregue: 0,
                    aberturas: 0,
                    cliques: 0,
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
                aggregated[key].aberturas += activity.kpis.aberturas || 0;
                aggregated[key].cliques += activity.kpis.cliques || 0;
                aggregated[key].propostas += activity.kpis.propostas || 0;
                aggregated[key].aprovados += activity.kpis.aprovados || 0;
                aggregated[key].cartoes += activity.kpis.cartoes || 0;
                aggregated[key].custo += activity.kpis.custoTotal || 0;
                aggregated[key].count += 1;
            });
        });

        const result = Object.values(aggregated).map(item => {
            const dataPoint: any = { ...item };
            selectedMetrics.forEach(m => {
                let value = 0;
                switch (m) {
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
                        // Aquisição usa Propostas como proxy; Rentabilização usa aberturas reais.
                        value = item.baseEntregue > 0 ? ((rentab ? item.aberturas : item.propostas) / item.baseEntregue) * 100 : 0;
                        break;
                    case 'clique':
                        value = item.aberturas > 0 ? (item.cliques / item.aberturas) * 100 : 0;
                        break;
                    case 'envios':
                        value = item.baseEnviada;
                        break;
                    case 'entregas':
                        value = item.baseEntregue;
                        break;
                    case 'aberturasQtd':
                        value = item.aberturas;
                        break;
                    case 'cliques':
                        value = item.cliques;
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
                dataPoint[m] = Number(value.toFixed(2));
            });
            return dataPoint;
        }).sort((a, b) => a.timestamp - b.timestamp);

        return result;
    }, [data, selectedBU, selectedCanais, selectedSegmentos, selectedParceiros, groupBy, selectedMetrics, rentab]);

    const stats = useMemo(() => {
        if (chartData.length === 0) return [];
        return selectedMetrics.map(m => {
            const values = chartData.map(d => Number(d[m] || 0));
            const max = Math.max(...values);
            const min = Math.min(...values);
            const sum = values.reduce((a, b) => a + b, 0);
            const avg = sum / values.length;

            const maxItem = chartData.find(d => Number(d[m] || 0) === max);
            const minItem = chartData.find(d => Number(d[m] || 0) === min);

            return {
                metric: m,
                label: METRIC_CONFIGS[m].label,
                color: METRIC_CONFIGS[m].color,
                avg,
                max,
                maxDate: maxItem?.label || '',
                min,
                minDate: minItem?.label || ''
            };
        });
    }, [chartData, selectedMetrics]);

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-[0_12px_32px_rgba(15,23,42,0.08)]">
                    <p className="text-slate-800 font-bold mb-2">{label}</p>
                    {payload.map((entry: any) => {
                        const m = entry.dataKey as MetricType;
                        return (
                            <div key={entry.name} className="flex items-center gap-2 text-sm mb-1 last:mb-0">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                                <span className="text-slate-500">{METRIC_CONFIGS[m]?.label || entry.name}:</span>
                                <span className="text-slate-800 font-mono font-bold">
                                    {formatMetricValue(entry.value, m)}
                                </span>
                            </div>
                        );
                    })}
                    {groupBy === 'daily' && (
                        <p className="text-xs text-slate-400 mt-2 italic">Clique para ver detalhes</p>
                    )}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
                <div>
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        Análise de Evolução
                        <InfoTooltip content="Evolução das métricas ao longo do tempo com comparação e agrupamento." />
                    </h2>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex flex-col relative" ref={dropdownRef}>
                        <label className="text-[10px] text-slate-500 uppercase font-bold mb-1">Métricas (Máx. 3)</label>
                        <button
                            type="button"
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="bg-white border border-slate-300 text-slate-700 text-xs rounded-lg px-3 py-1.5 hover:bg-slate-50 font-medium flex items-center justify-between gap-1.5 shadow-sm min-w-[200px] text-left focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                            <span className="truncate text-slate-700 font-medium">
                                {selectedMetrics.length === 1 
                                    ? METRIC_CONFIGS[selectedMetrics[0]].label 
                                    : `${selectedMetrics.length} métricas selecionadas`}
                            </span>
                            <ChevronDown className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                        </button>

                        {isDropdownOpen && (
                            <div className="absolute right-0 top-full mt-1.5 w-64 bg-white border border-slate-200 rounded-xl shadow-[0_12px_32px_rgba(15,23,42,0.12)] z-30 p-2 max-h-[320px] overflow-y-auto">
                                {metricGroups.map(group => (
                                    <div key={group.label} className="mb-2 last:mb-0">
                                        <div className="px-2 py-1 text-[9px] text-slate-400 uppercase font-bold tracking-wider">
                                            {group.label}
                                        </div>
                                        <div className="space-y-0.5 mt-0.5">
                                            {group.metrics.map(metricKey => {
                                                const isSelected = selectedMetrics.includes(metricKey);
                                                const isMaxReached = selectedMetrics.length >= 3;
                                                const isDisabled = !isSelected && isMaxReached;
                                                const config = METRIC_CONFIGS[metricKey];

                                                return (
                                                    <button
                                                        key={metricKey}
                                                        type="button"
                                                        disabled={isDisabled}
                                                        onClick={() => toggleMetric(metricKey)}
                                                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                                                            isSelected 
                                                                ? 'bg-slate-50 font-semibold text-slate-900' 
                                                                : isDisabled 
                                                                    ? 'opacity-40 cursor-not-allowed text-slate-400' 
                                                                    : 'hover:bg-slate-50 text-slate-700'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-2 truncate">
                                                            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: config.color }} />
                                                            <span className="truncate">{config.label}</span>
                                                        </div>
                                                        {isSelected && (
                                                            <Check className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col">
                        <label className="text-[10px] text-slate-500 uppercase font-bold mb-1">Agrupamento</label>
                        <div className="flex bg-slate-100 rounded-lg p-1 border border-slate-200">
                            <button
                                onClick={() => setGroupBy('daily')}
                                className={`px-2.5 py-1 text-xs font-medium rounded transition ${groupBy === 'daily' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                                    }`}
                            >
                                Diário
                            </button>
                            <button
                                onClick={() => setGroupBy('weekly')}
                                className={`px-2.5 py-1 text-xs font-medium rounded transition ${groupBy === 'weekly' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                                    }`}
                            >
                                Semanal
                            </button>
                            <button
                                onClick={() => setGroupBy('monthly')}
                                className={`px-2.5 py-1 text-xs font-medium rounded transition ${groupBy === 'monthly' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                                    }`}
                            >
                                Mensal
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
                        <YAxis 
                            stroke="#94A3B8" 
                            tick={{ fill: '#94A3B8', fontSize: 10 }}
                            tickFormatter={(value) => value.toLocaleString('pt-BR')}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ paddingTop: '10px' }} />

                        {selectedMetrics.map((m) => (
                            <Line
                                key={m}
                                type="monotone"
                                dataKey={m}
                                name={METRIC_CONFIGS[m].label}
                                stroke={METRIC_CONFIGS[m].color}
                                strokeWidth={2.5}
                                dot={groupBy === 'daily' ? { r: 4, fill: METRIC_CONFIGS[m].color, strokeWidth: 0, cursor: 'pointer' } : { r: 3, fill: METRIC_CONFIGS[m].color, strokeWidth: 0 }}
                                activeDot={{ r: 6 }}
                                onClick={(state: any) => handleDotClick(state)}
                            />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200 flex flex-col gap-3">
                {stats.map(stat => (
                    <div key={stat.metric} className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs sm:text-sm">
                        <div className="flex items-center gap-2 min-w-[180px]">
                            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: stat.color }} />
                            <span className="font-semibold text-slate-700">{stat.label}:</span>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1">
                            <div>
                                <span className="text-slate-500 mr-1.5">Média:</span>
                                <span className="text-slate-900 font-bold">{formatMetricValue(stat.avg, stat.metric)}</span>
                            </div>
                            <div>
                                <span className="text-slate-500 mr-1.5">Máx:</span>
                                <span className="text-slate-900 font-bold">{formatMetricValue(stat.max, stat.metric)}</span>
                                <span className="text-[11px] text-slate-400 ml-1">({stat.maxDate})</span>
                            </div>
                            <div>
                                <span className="text-slate-500 mr-1.5">Mín:</span>
                                <span className="text-slate-900 font-bold">{formatMetricValue(stat.min, stat.metric)}</span>
                                <span className="text-[11px] text-slate-400 ml-1">({stat.minDate})</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
