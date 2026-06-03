import React, { useMemo, useState, useEffect } from 'react';
import { useFilters } from '../../context/FilterContext';
import { ProjectionBox } from '../ProjectionBox';
import { ResponsiveContainer, ComposedChart, Line, Area, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { format, parseISO, startOfDay, endOfDay, startOfWeek, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Target as TargetIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { CreateTargetModal } from '../Modals/CreateTargetModal';
import { useTargets } from '../../hooks/useTargets';
import { calculateProjection } from '../../utils/projectionEngine';
import type { DailyMetrics } from '../../types';
import { CustomMetricChart } from '../CustomMetricChart';
import { ImprovedMonthlyPivotTable } from './ImprovedMonthlyPivotTable';



// Chart Component
const MetricsChart: React.FC<{
    data: any[],
    dataKey: string,
    color: string,
    title: string,
    isCurrency?: boolean,
    granularity: 'day' | 'week' | 'month'
}> = ({ data, dataKey, color, title, isCurrency, granularity }) => {
    const isBar = granularity !== 'day';

    return (
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
            <h4 className="text-md font-bold text-slate-700 mb-4">{title}</h4>
            <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis
                            dataKey="day"
                            tick={{ fontSize: 12, fill: '#64748B' }}
                            axisLine={false}
                            tickLine={false}
                            interval="preserveStartEnd"
                        />
                        <YAxis
                            tick={{ fontSize: 12, fill: '#64748B' }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(val) =>
                                isCurrency
                                    ? new Intl.NumberFormat('pt-BR', { notation: 'compact', style: 'currency', currency: 'BRL' }).format(val)
                                    : new Intl.NumberFormat('pt-BR', { notation: 'compact' }).format(val)
                            }
                        />
                        <Tooltip
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            cursor={{ fill: '#F1F5F9' }}
                            formatter={(val: any) =>
                                isCurrency
                                    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
                                    : new Intl.NumberFormat('pt-BR').format(val)
                            }
                        />

                        {isBar ? (
                            <Bar
                                dataKey={dataKey}
                                fill={color}
                                name="Atual"
                                radius={[4, 4, 0, 0]}
                                maxBarSize={60}
                            />
                        ) : (
                            <Area
                                type="monotone"
                                dataKey={dataKey}
                                stroke={color}
                                fill={color}
                                fillOpacity={0.1}
                                name="Atual"
                                strokeWidth={2}
                            />
                        )}

                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export const MonthlyAnalysisTab: React.FC = () => {
    const { filteredData, filters, rawData } = useFilters();
    const { add } = useTargets();
    const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);

    // Shared State for Synchronization
    // Default to global period filter; user can override with "Período Personalizado"
    const [useCustomDate, setUseCustomDate] = useState(false);
    const [customDateRange, setCustomDateRange] = useState({
        from: format(filters.dateRange.from, 'yyyy-MM-dd'),
        to: format(filters.dateRange.to, 'yyyy-MM-dd')
    });

    // Keep custom range in sync when global period changes (only when not in custom mode)
    useEffect(() => {
        if (!useCustomDate) {
            setCustomDateRange({
                from: format(filters.dateRange.from, 'yyyy-MM-dd'),
                to: format(filters.dateRange.to, 'yyyy-MM-dd')
            });
        }
    }, [filters.dateRange.from.getTime(), filters.dateRange.to.getTime(), useCustomDate]);
    const [granularity, setGranularity] = useState<'day' | 'week' | 'month'>('day');

    const chartData = useMemo(() => {
        if (!rawData) return [];

        // When not using a custom date range, reuse filteredData from context — it already
        // respects period + channel + objective + campaign filters, so totals match the Overview.
        // When using a custom date, apply only the date override on top of rawData while keeping
        // all other global filters (channel, objective, campaign, adset, ad) from context.
        let relevantData: typeof filteredData;
        if (!useCustomDate) {
            relevantData = filteredData;
        } else {
            const rangeStart = parseISO(customDateRange.from);
            const rangeEnd = parseISO(customDateRange.to);
            relevantData = rawData.filter(d => {
                const dDate = new Date(d.date);
                if (dDate < startOfDay(rangeStart) || dDate > endOfDay(rangeEnd)) return false;
                if (filters.selectedChannels.length && !filters.selectedChannels.includes(d.channel as any)) return false;
                if (d.objective && filters.selectedObjectives.length && !filters.selectedObjectives.includes(d.objective as any)) return false;
                if (filters.selectedCampaigns.length && !filters.selectedCampaigns.includes(d.campaign)) return false;
                if (filters.selectedAdsets.length && (!d.adset_name || !filters.selectedAdsets.includes(d.adset_name))) return false;
                if (filters.selectedAds.length && (!d.ad_name || !filters.selectedAds.includes(d.ad_name))) return false;
                return true;
            });
        }

        // Aggregate by Granularity
        const aggMap = new Map<string, any>();

        relevantData.forEach(d => {
            const dateObj = new Date(d.date);
            let timeKey = '';
            let displayDate = new Date();
            let label = '';

            if (granularity === 'day') {
                timeKey = format(dateObj, 'yyyy-MM-dd');
                displayDate = dateObj;
                label = format(dateObj, 'dd/MM');
            } else if (granularity === 'week') {
                const start = startOfWeek(dateObj, { weekStartsOn: 1 });
                timeKey = format(start, 'yyyy-MM-dd');
                displayDate = start;
                label = `Semana ${format(start, 'dd/MM')}`;
            } else if (granularity === 'month') {
                const start = startOfMonth(dateObj);
                timeKey = format(start, 'yyyy-MM');
                displayDate = start;
                label = format(start, 'MMM/yy');
            }

            if (!aggMap.has(timeKey)) {
                aggMap.set(timeKey, {
                    day: label,
                    date: displayDate,
                    spend: 0,
                    impressions: 0,
                    conversions: 0,
                });
            }
            const item = aggMap.get(timeKey);
            item.spend += d.spend;
            item.impressions += d.impressions;
            item.conversions += d.conversions;
        });

        // Convert key map to array and compute CPM
        const result = Array.from(aggMap.values()).map(item => ({
            ...item,
            cpm: item.impressions ? (item.spend / item.impressions) * 1000 : 0
        })).sort((a, b) => a.date.getTime() - b.date.getTime());

        return result;

    }, [rawData, filteredData, filters, useCustomDate, customDateRange, granularity]);



    return (
        <div className="space-y-6 animate-fade-in relative">
            <div className="flex justify-between items-end gap-4">
                <div className="flex-1">
                    <ProjectionBox data={filteredData} />
                </div>
                <button
                    onClick={() => setIsTargetModalOpen(true)}
                    className="mb-8 flex items-center gap-2 text-primary font-bold hover:underline bg-white px-4 py-3 rounded-lg border border-slate-100 shadow-sm transition-transform active:scale-95 whitespace-nowrap"
                >
                    <TargetIcon size={18} />
                    Definir Metas
                </button>
            </div>



            {/* Nova Seção: Gráfico Personalizado */}
            <CustomMetricChart
                granularity={granularity}
                setGranularity={setGranularity}
                useCustomDate={useCustomDate}
                setUseCustomDate={setUseCustomDate}
                customDateRange={customDateRange}
                setCustomDateRange={setCustomDateRange}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Investimento */}
                <MetricsChart
                    data={chartData}
                    dataKey="spend"
                    color="#84cc16"
                    title={`Investimento ${granularity === 'day' ? 'Diário' : granularity === 'week' ? 'Semanal' : 'Mensal'}`}
                    isCurrency
                    granularity={granularity}
                />

                {/* Impressões */}
                <MetricsChart
                    data={chartData}
                    dataKey="impressions"
                    color="#0ea5e9"
                    title={`Impressões ${granularity === 'day' ? 'Diárias' : granularity === 'week' ? 'Semanais' : 'Mensais'}`}
                    granularity={granularity}
                />

                {/* CPM */}
                <MetricsChart
                    data={chartData}
                    dataKey="cpm"
                    color="#f97316"
                    title={`CPM ${granularity === 'day' ? 'Diário' : granularity === 'week' ? 'Semanal' : 'Mensal'}`}
                    isCurrency
                    granularity={granularity}
                />

                {/* Conversões */}
                <MetricsChart
                    data={chartData}
                    dataKey="conversions"
                    color="#8b5cf6"
                    title={`Conversões ${granularity === 'day' ? 'Diárias' : granularity === 'week' ? 'Semanais' : 'Mensais'}`}
                    granularity={granularity}
                />
            </div>





            {/* ── Tabela Pivot Mensal com Agrupamento ─────────────────────────────────────────── */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
                <div className="mb-4">
                    <h3 className="text-md font-bold text-slate-800">Resumo por Mês (Agrupado por Objetivo)</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Dados históricos mensais respeitando todos os filtros globais. Clique nas colunas para ordenar.</p>
                </div>
                <ImprovedMonthlyPivotTable rawData={rawData} filters={filters} />
            </div>

            {isTargetModalOpen && (
                <CreateTargetModal
                    onSave={add}
                    onClose={() => setIsTargetModalOpen(false)}
                />
            )}
        </div>
    );
};
