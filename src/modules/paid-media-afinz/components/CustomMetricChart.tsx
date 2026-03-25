import React, { useState, useMemo } from 'react';
import { useFilters } from '../context/FilterContext';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, parseISO, isWithinInterval, startOfDay, endOfDay, startOfMonth, startOfWeek } from 'date-fns';
import { Filter } from 'lucide-react';

const METRICS_CONFIG = [
    { key: 'spend', label: 'Investimento', color: '#3b82f6', isCurrency: true, axis: 'left' }, // Blue
    { key: 'conversions', label: 'Conversões', color: '#8b5cf6', isCurrency: false, axis: 'left' }, // Purple
    { key: 'impressions', label: 'Impressões', color: '#06b6d4', isCurrency: false, axis: 'left' }, // Cyan
    { key: 'clicks', label: 'Cliques', color: '#f59e0b', isCurrency: false, axis: 'left' }, // Amber
    { key: 'cpm', label: 'CPM', color: '#ec4899', isCurrency: true, axis: 'right' }, // Pink
    { key: 'cpc', label: 'CPC', color: '#10b981', isCurrency: true, axis: 'right' }, // Emerald
    { key: 'ctr', label: 'CTR', color: '#6366f1', isCurrency: false, suffix: '%', axis: 'right' }, // Indigo
    { key: 'convRate', label: 'Taxa de Conv.', color: '#ef4444', isCurrency: false, suffix: '%', axis: 'right' }, // Red
    { key: 'cta', label: 'Custo por Resultado', color: '#8b5cf6', isCurrency: true, axis: 'right' }, // Violet
];

interface CustomMetricChartProps {
    granularity: 'day' | 'week' | 'month';
    setGranularity: (g: 'day' | 'week' | 'month') => void;
    useCustomDate: boolean;
    setUseCustomDate: (b: boolean) => void;
    customDateRange: { from: string; to: string };
    setCustomDateRange: (range: { from: string; to: string }) => void;
}

interface CustomMetricChartProps {
    granularity: 'day' | 'week' | 'month';
    setGranularity: (g: 'day' | 'week' | 'month') => void;
    useCustomDate: boolean;
    setUseCustomDate: (b: boolean) => void;
    customDateRange: { from: string; to: string };
    setCustomDateRange: (range: { from: string; to: string }) => void;
}

export const CustomMetricChart: React.FC<CustomMetricChartProps> = ({
    granularity,
    setGranularity,
    useCustomDate,
    setUseCustomDate,
    customDateRange,
    setCustomDateRange
}) => {
    const { rawData, filters } = useFilters();

    // Local State
    const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['spend', 'conversions']);

    // 1. Filter Data
    const chartData = useMemo(() => {
        if (!rawData || rawData.length === 0) return [];

        let filtered = rawData.filter(d => {
            // Apply Global Campaign/Channel Filters
            // (Replicating logic from FilterContext roughly, or we assume rawData needs filtering)
            const dateObj = new Date(d.date);

            // Channels
            if (filters.selectedChannels.length > 0 && !filters.selectedChannels.includes(d.channel as any)) return false;

            // Objectives
            if (filters.selectedObjectives.length > 0 && !filters.selectedObjectives.includes(d.objective as any)) return false;

            // Campaigns
            if (filters.selectedCampaigns.length > 0 && !filters.selectedCampaigns.includes(d.campaign)) return false;

            // Adsets
            if (filters.selectedAdsets.length > 0 && (!d.adset_name || !filters.selectedAdsets.includes(d.adset_name))) return false;

            // Ads
            if (filters.selectedAds.length > 0 && (!d.ad_name || !filters.selectedAds.includes(d.ad_name))) return false;

            // Date Range (Local or Global)
            const range = useCustomDate ? {
                start: startOfDay(parseISO(customDateRange.from)),
                end: endOfDay(parseISO(customDateRange.to))
            } : {
                start: startOfDay(filters.dateRange.from),
                end: endOfDay(filters.dateRange.to)
            };

            return isWithinInterval(dateObj, range);
        });

        // Aggregate by Granularity (Day/Week/Month)
        const aggMap = new Map<string, any>();

        filtered.forEach(d => {
            const dateObj = new Date(d.date);
            let timeKey = '';
            let label = '';
            let sortTime = 0;

            if (granularity === 'day') {
                timeKey = format(dateObj, 'yyyy-MM-dd');
                label = format(dateObj, 'dd/MM');
                sortTime = dateObj.getTime();
            } else if (granularity === 'week') {
                const start = startOfWeek(dateObj, { weekStartsOn: 1 }); // Monday
                timeKey = format(start, 'yyyy-MM-dd');
                label = `Semana ${format(start, 'dd/MM')}`;
                sortTime = start.getTime();
            } else if (granularity === 'month') {
                const start = startOfMonth(dateObj);
                timeKey = format(start, 'yyyy-MM');
                label = format(start, 'MMM/yy');
                sortTime = start.getTime();
            }

            if (!aggMap.has(timeKey)) {
                aggMap.set(timeKey, {
                    timeKey,
                    label,
                    sortTime,
                    spend: 0,
                    impressions: 0,
                    clicks: 0,
                    conversions: 0
                });
            }
            const item = aggMap.get(timeKey);
            item.spend += d.spend;
            item.impressions += d.impressions;
            item.clicks += d.clicks;
            item.conversions += d.conversions;
        });

        // Calculate Derived Metrics
        const result = Array.from(aggMap.values()).map(item => {
            return {
                ...item,
                day: item.label, // Use label for XAxis
                cpm: item.impressions ? (item.spend / item.impressions) * 1000 : 0,
                cpc: item.clicks ? (item.spend / item.clicks) : 0,
                ctr: item.impressions ? (item.clicks / item.impressions) * 100 : 0,
                convRate: item.clicks ? (item.conversions / item.clicks) * 100 : 0,
                cta: item.conversions ? (item.spend / item.conversions) : 0,
            };
        }).sort((a, b) => a.sortTime - b.sortTime);

        return result;

    }, [rawData, filters, useCustomDate, customDateRange, granularity]);

    const handleMetricToggle = (key: string) => {
        if (selectedMetrics.includes(key)) {
            setSelectedMetrics(prev => prev.filter(k => k !== key));
        } else {
            if (selectedMetrics.length < 4) {
                setSelectedMetrics(prev => [...prev, key]);
            }
        }
    };

    const hasRightAxisMetrics = selectedMetrics.some(m => METRICS_CONFIG.find(c => c.key === m)?.axis === 'right');
    const hasLeftAxisMetrics = selectedMetrics.some(m => METRICS_CONFIG.find(c => c.key === m)?.axis === 'left');

    return (
        <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm mt-8 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Filter size={18} className="text-blue-500" />
                        Análise Personalizada
                    </h3>
                    <p className="text-sm text-slate-500">Compare até 4 métricas diferentes no mesmo período</p>
                </div>

                <div className="flex flex-wrap items-center gap-3 bg-slate-50 p-2 rounded-lg border border-slate-100">
                    {/* Date Toggle */}
                    <label className="flex items-center gap-2 text-xs font-medium text-slate-500 cursor-pointer mr-2 hover:text-slate-900 transition">
                        <input
                            type="checkbox"
                            checked={useCustomDate}
                            onChange={(e) => setUseCustomDate(e.target.checked)}
                            className="rounded text-blue-500 focus:ring-blue-500/20 bg-white border-slate-300"
                        />
                        Período Personalizado
                    </label>

                    {useCustomDate && (
                        <div className="flex items-center gap-2">
                            <input
                                type="date"
                                value={customDateRange.from}
                                onChange={(e) => setCustomDateRange({ ...customDateRange, from: e.target.value })}
                                className="text-xs bg-white border-slate-300 text-slate-700 rounded px-2 py-1 focus:ring-blue-500/20 focus:border-blue-500"
                            />
                            <span className="text-slate-400">-</span>
                            <input
                                type="date"
                                value={customDateRange.to}
                                onChange={(e) => setCustomDateRange({ ...customDateRange, to: e.target.value })}
                                className="text-xs bg-white border-slate-300 text-slate-700 rounded px-2 py-1 focus:ring-blue-500/20 focus:border-blue-500"
                            />
                        </div>
                    )}
                </div>

                {/* Granularity Toggle */}
                <div className="flex bg-slate-50 p-1 rounded-lg border border-slate-100">
                    {(['day', 'week', 'month'] as const).map(g => (
                        <button
                            key={g}
                            onClick={() => setGranularity(g)}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${granularity === g ? 'bg-white text-slate-700 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
                        >
                            {g === 'day' ? 'Dia' : g === 'week' ? 'Semana' : 'Mês'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Metrics Selector */}
            <div className="flex flex-wrap gap-2 mb-6">
                {METRICS_CONFIG.map(metric => (
                    <button
                        key={metric.key}
                        onClick={() => handleMetricToggle(metric.key)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${selectedMetrics.includes(metric.key)
                            ? 'bg-blue-50 border-blue-200 text-blue-600'
                            : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700'
                            }`}
                        style={{
                            borderColor: selectedMetrics.includes(metric.key) ? metric.color : undefined,
                            color: selectedMetrics.includes(metric.key) ? metric.color : undefined,
                            backgroundColor: selectedMetrics.includes(metric.key) ? `${metric.color}10` : undefined
                        }}
                    >
                        {metric.label}
                    </button>
                ))}
            </div>

            {/* Chart */}
            <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis
                            dataKey="day"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748B', fontSize: 11 }}
                            dy={10}
                        />
                        <YAxis
                            yAxisId="left"
                            orientation="left"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748B', fontSize: 11 }}
                            tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}
                            hide={!hasLeftAxisMetrics}
                        />
                        <YAxis
                            yAxisId="right"
                            orientation="right"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748B', fontSize: 11 }}
                            hide={!hasRightAxisMetrics}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#ffffff', borderColor: '#E2E8F0', color: '#1E293B', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            labelStyle={{ color: '#64748B', marginBottom: '0.5rem', fontWeight: 'bold' }}
                            formatter={(value: any, name: any) => {
                                const metric = METRICS_CONFIG.find(m => m.label === name);
                                if (!metric) return value;

                                if (metric.isCurrency) return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
                                if (metric.suffix) return `${value.toFixed(2)}${metric.suffix}`;
                                return new Intl.NumberFormat('pt-BR').format(value);
                            }}
                        />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />

                        {selectedMetrics.map(key => {
                            const metric = METRICS_CONFIG.find(m => m.key === key);
                            if (!metric) return null;
                            return (
                                <Line
                                    key={key}
                                    yAxisId={metric.axis}
                                    type="monotone"
                                    dataKey={key}
                                    name={metric.label}
                                    stroke={metric.color}
                                    strokeWidth={3}
                                    dot={false}
                                    activeDot={{ r: 6, strokeWidth: 0 }}
                                />
                            );
                        })}
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
