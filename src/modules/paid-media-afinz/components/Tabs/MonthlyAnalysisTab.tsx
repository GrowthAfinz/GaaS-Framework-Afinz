import React, { useMemo, useState } from 'react';
import { useFilters } from '../../context/FilterContext';
import { ProjectionBox } from '../ProjectionBox';
import { ResponsiveContainer, ComposedChart, Line, Area, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { format, eachDayOfInterval, startOfMonth, endOfMonth, isSameDay, getDate, getDaysInMonth, parseISO, startOfDay, endOfDay, startOfWeek } from 'date-fns';

import { Target as TargetIcon } from 'lucide-react';
import { CreateTargetModal } from '../Modals/CreateTargetModal';
import { useTargets } from '../../hooks/useTargets';
import { calculateProjection } from '../../utils/projectionEngine';
import type { DailyMetrics } from '../../types';
import { CustomMetricChart } from '../CustomMetricChart';


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
    const [useCustomDate, setUseCustomDate] = useState(true);
    const [customDateRange, setCustomDateRange] = useState({
        from: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
        to: format(new Date(), 'yyyy-MM-dd')
    });
    const [granularity, setGranularity] = useState<'day' | 'week' | 'month'>('day');

    const chartData = useMemo(() => {
        // Determine effective range
        const rangeStart = useCustomDate ? parseISO(customDateRange.from) : filters.dateRange.from;
        const rangeEnd = useCustomDate ? parseISO(customDateRange.to) : filters.dateRange.to;

        // Filter RAW data based on this range (and other filters)
        // We use rawData to ensure we have all granular points before aggregating
        if (!rawData) return [];

        const relevantData = rawData.filter(d => {
            // Basic Global Filters (Channel/Objective/Campaign) should be respected
            // Replicating FilterContext logic briefly or relying on 'filteredData' if it matches range?
            // 'filteredData' in context assumes global range. 
            // If useCustomDate is TRUE, we must filter rawData manually.
            // If useCustomDate is FALSE, 'filteredData' is already filtered by date, BUT 'filteredData' might be pre-aggregated? 
            // No, filteredData is usually raw rows filtered.

            // Simplest: Filter rawData by everything

            const dDate = new Date(d.date);
            if (dDate < startOfDay(rangeStart) || dDate > endOfDay(rangeEnd)) return false;

            if (filters.selectedChannels.length && !filters.selectedChannels.includes(d.channel as any)) return false;
            if (filters.selectedObjectives.length && !filters.selectedObjectives.includes(d.objective as any)) return false;
            if (filters.selectedCampaigns.length && !filters.selectedCampaigns.includes(d.campaign)) return false;
            if (filters.selectedAdsets.length && (!d.adset_name || !filters.selectedAdsets.includes(d.adset_name))) return false;
            if (filters.selectedAds.length && (!d.ad_name || !filters.selectedAds.includes(d.ad_name))) return false;

            return true;
        });

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

    }, [rawData, filters, useCustomDate, customDateRange, granularity]);



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





            {isTargetModalOpen && (
                <CreateTargetModal
                    onSave={add}
                    onClose={() => setIsTargetModalOpen(false)}
                />
            )}
        </div>
    );
};
