import React, { useMemo, useState } from 'react';
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

// ── Pivot Table ─────────────────────────────────────────────────────────────
interface MonthRow {
    key: string;         // "2025-01"
    label: string;       // "jan/25"
    spend: number;
    impressions: number;
    clicks: number;
    conversions: number;
    ctr: number;
    cpa: number;
    cpm: number;
}

const fmtBRL = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 }).format(v);

const fmtNum = (v: number) =>
    new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(v);

const fmtPct = (v: number) => `${v.toFixed(2)}%`;

const Delta: React.FC<{ curr: number; prev: number; inverse?: boolean }> = ({ curr, prev, inverse }) => {
    if (!prev) return null;
    const pct = ((curr - prev) / prev) * 100;
    const isGood = inverse ? pct < 0 : pct > 0;
    const color = pct === 0 ? 'text-slate-400' : isGood ? 'text-emerald-600' : 'text-red-500';
    const Icon = pct > 0 ? TrendingUp : TrendingDown;
    return (
        <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold ml-1 ${color}`}>
            <Icon size={10} />
            {Math.abs(pct).toFixed(1)}%
        </span>
    );
};

const MonthlyPivotTable: React.FC<{ rawData: DailyMetrics[]; channelFilter: 'all' | 'meta' | 'google' }> = ({ rawData, channelFilter }) => {
    const rows = useMemo<MonthRow[]>(() => {
        const map = new Map<string, { spend: number; impressions: number; clicks: number; conversions: number }>();

        rawData.forEach(d => {
            if (channelFilter !== 'all' && d.channel !== channelFilter) return;
            const key = format(new Date(d.date), 'yyyy-MM');
            if (!map.has(key)) map.set(key, { spend: 0, impressions: 0, clicks: 0, conversions: 0 });
            const r = map.get(key)!;
            r.spend += d.spend;
            r.impressions += d.impressions;
            r.clicks += d.clicks;
            r.conversions += d.conversions;
        });

        return Array.from(map.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, agg]) => ({
                key,
                label: format(parseISO(`${key}-01`), 'MMM/yy', { locale: ptBR }),
                spend: agg.spend,
                impressions: agg.impressions,
                clicks: agg.clicks,
                conversions: agg.conversions,
                ctr: agg.impressions > 0 ? (agg.clicks / agg.impressions) * 100 : 0,
                cpa: agg.conversions > 0 ? agg.spend / agg.conversions : 0,
                cpm: agg.impressions > 0 ? (agg.spend / agg.impressions) * 1000 : 0,
            }));
    }, [rawData, channelFilter]);

    const total = useMemo<MonthRow>(() => {
        const t = rows.reduce((acc, r) => ({
            spend: acc.spend + r.spend,
            impressions: acc.impressions + r.impressions,
            clicks: acc.clicks + r.clicks,
            conversions: acc.conversions + r.conversions,
        }), { spend: 0, impressions: 0, clicks: 0, conversions: 0 });
        return {
            key: 'total', label: 'TOTAL',
            ...t,
            ctr: t.impressions > 0 ? (t.clicks / t.impressions) * 100 : 0,
            cpa: t.conversions > 0 ? t.spend / t.conversions : 0,
            cpm: t.impressions > 0 ? (t.spend / t.impressions) * 1000 : 0,
        };
    }, [rows]);

    if (rows.length === 0) {
        return <p className="text-slate-400 text-sm text-center py-8">Nenhum dado disponível para o filtro selecionado.</p>;
    }

    const cols = [
        { label: 'Mês', key: 'label', fmt: (v: any) => v, align: 'left' as const },
        { label: 'Invest.', key: 'spend', fmt: fmtBRL, align: 'right' as const },
        { label: 'Impress.', key: 'impressions', fmt: fmtNum, align: 'right' as const },
        { label: 'Cliques', key: 'clicks', fmt: fmtNum, align: 'right' as const },
        { label: 'Conv.', key: 'conversions', fmt: fmtNum, align: 'right' as const },
        { label: 'CTR', key: 'ctr', fmt: fmtPct, align: 'right' as const, inverse: false },
        { label: 'CPA', key: 'cpa', fmt: fmtBRL, align: 'right' as const, inverse: true },
        { label: 'CPM', key: 'cpm', fmt: fmtBRL, align: 'right' as const, inverse: true },
    ] as const;

    return (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-sm border-collapse">
                <thead>
                    <tr className="bg-slate-800 text-white">
                        {cols.map(c => (
                            <th key={c.key} className={`px-4 py-3 font-semibold text-xs uppercase tracking-wider ${c.align === 'right' ? 'text-right' : 'text-left'}`}>
                                {c.label}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, idx) => {
                        const prev = idx > 0 ? rows[idx - 1] : null;
                        return (
                            <tr key={row.key} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-blue-50/40 transition-colors border-b border-slate-100`}>
                                <td className="px-4 py-2.5 font-semibold text-slate-700 capitalize">{row.label}</td>
                                <td className="px-4 py-2.5 text-right font-mono text-slate-700">
                                    {fmtBRL(row.spend)}
                                    {prev && <Delta curr={row.spend} prev={prev.spend} />}
                                </td>
                                <td className="px-4 py-2.5 text-right font-mono text-slate-600">
                                    {fmtNum(row.impressions)}
                                    {prev && <Delta curr={row.impressions} prev={prev.impressions} />}
                                </td>
                                <td className="px-4 py-2.5 text-right font-mono text-slate-600">
                                    {fmtNum(row.clicks)}
                                    {prev && <Delta curr={row.clicks} prev={prev.clicks} />}
                                </td>
                                <td className="px-4 py-2.5 text-right font-mono text-slate-600">
                                    {fmtNum(row.conversions)}
                                    {prev && <Delta curr={row.conversions} prev={prev.conversions} />}
                                </td>
                                <td className="px-4 py-2.5 text-right">
                                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                                        row.ctr >= 1 ? 'bg-emerald-100 text-emerald-700' :
                                        row.ctr >= 0.5 ? 'bg-amber-100 text-amber-700' :
                                        'bg-red-100 text-red-600'
                                    }`}>
                                        {fmtPct(row.ctr)}
                                    </span>
                                    {prev && <Delta curr={row.ctr} prev={prev.ctr} />}
                                </td>
                                <td className="px-4 py-2.5 text-right font-mono">
                                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                                        row.cpa === 0 ? 'text-slate-400' :
                                        row.cpa <= total.cpa * 0.8 ? 'bg-emerald-100 text-emerald-700' :
                                        row.cpa <= total.cpa * 1.2 ? 'bg-amber-100 text-amber-700' :
                                        'bg-red-100 text-red-600'
                                    }`}>
                                        {row.cpa > 0 ? fmtBRL(row.cpa) : '—'}
                                    </span>
                                    {prev && prev.cpa > 0 && row.cpa > 0 && <Delta curr={row.cpa} prev={prev.cpa} inverse />}
                                </td>
                                <td className="px-4 py-2.5 text-right font-mono text-slate-600">
                                    {fmtBRL(row.cpm)}
                                    {prev && prev.cpm > 0 && <Delta curr={row.cpm} prev={prev.cpm} inverse />}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
                <tfoot>
                    <tr className="bg-slate-900 text-white font-bold">
                        <td className="px-4 py-3 text-xs uppercase tracking-wider">Total Geral</td>
                        <td className="px-4 py-3 text-right font-mono text-emerald-300">{fmtBRL(total.spend)}</td>
                        <td className="px-4 py-3 text-right font-mono">{fmtNum(total.impressions)}</td>
                        <td className="px-4 py-3 text-right font-mono">{fmtNum(total.clicks)}</td>
                        <td className="px-4 py-3 text-right font-mono">{fmtNum(total.conversions)}</td>
                        <td className="px-4 py-3 text-right font-mono">{fmtPct(total.ctr)}</td>
                        <td className="px-4 py-3 text-right font-mono text-amber-300">{total.cpa > 0 ? fmtBRL(total.cpa) : '—'}</td>
                        <td className="px-4 py-3 text-right font-mono">{fmtBRL(total.cpm)}</td>
                    </tr>
                </tfoot>
            </table>
        </div>
    );
};


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
    const [pivotChannel, setPivotChannel] = useState<'all' | 'meta' | 'google'>('all');

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





            {/* ── Tabela Pivot Mensal ─────────────────────────────────────────── */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-md font-bold text-slate-800">Resumo por Mês</h3>
                        <p className="text-xs text-slate-400 mt-0.5">Todos os dados históricos, agrupados mensalmente</p>
                    </div>
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                        {(['all', 'meta', 'google'] as const).map(ch => (
                            <button
                                key={ch}
                                onClick={() => setPivotChannel(ch)}
                                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                                    pivotChannel === ch
                                        ? 'bg-white text-slate-800 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                {ch === 'all' ? 'Todos' : ch === 'meta' ? 'Meta Ads' : 'Google Ads'}
                            </button>
                        ))}
                    </div>
                </div>
                <MonthlyPivotTable rawData={rawData} channelFilter={pivotChannel} />
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
