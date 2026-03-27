import React, { useMemo, useState } from 'react';
import { useFilters } from '../../context/FilterContext';
import {
    Search, TrendingUp, TrendingDown, Award, AlertTriangle,
    DollarSign, Target, MousePointerClick, Zap, Eye, BarChart2
} from 'lucide-react';
import {
    ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
    CartesianGrid, Tooltip, ScatterChart, Scatter, ZAxis
} from 'recharts';
import { format } from 'date-fns';
import type { DailyMetrics } from '../../types';

// ── Formatters ───────────────────────────────────────────────────────────────
const fmtBRL = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 }).format(v);
const fmtNum = (v: number) =>
    new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(v);
const fmtPct = (v: number) => `${v.toFixed(2)}%`;

// ── KPI Card ─────────────────────────────────────────────────────────────────
const KPI: React.FC<{
    label: string;
    value: string;
    change?: number;
    inverse?: boolean;
    icon: React.ReactNode;
}> = ({ label, value, change, inverse, icon }) => {
    const isGood = change !== undefined ? (inverse ? change < 0 : change > 0) : null;
    const changeColor = change === undefined || change === 0 ? 'text-slate-400'
        : isGood ? 'text-emerald-600' : 'text-red-500';
    const ChangeIcon = change !== undefined && change > 0 ? TrendingUp : TrendingDown;

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col gap-2">
            <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
                <span className="text-slate-400">{icon}</span>
            </div>
            <div className="text-2xl font-black text-slate-800">{value}</div>
            {change !== undefined && (
                <div className={`flex items-center gap-1 text-xs font-semibold ${changeColor}`}>
                    <ChangeIcon size={12} />
                    {Math.abs(change).toFixed(1)}% vs período ant.
                </div>
            )}
        </div>
    );
};

// ── Ad Status Badge ───────────────────────────────────────────────────────────
const statusBadge = (ctr: number, cpa: number, avgCpa: number, freq?: number) => {
    if (freq && freq > 3.5) return { label: 'FADIGA', cls: 'bg-orange-100 text-orange-700 border-orange-200' };
    if (cpa > 0 && avgCpa > 0 && cpa <= avgCpa * 0.7) return { label: 'VENCEDOR', cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
    if (ctr >= 1) return { label: 'EXCELENTE', cls: 'bg-blue-100 text-blue-700 border-blue-200' };
    if (ctr >= 0.5) return { label: 'BOM', cls: 'bg-slate-100 text-slate-600 border-slate-200' };
    return { label: 'ATENÇÃO', cls: 'bg-red-100 text-red-600 border-red-200' };
};

// ── Ad Card ───────────────────────────────────────────────────────────────────
interface AdSummary {
    adId: string;
    adName: string;
    campaign: string;
    adset?: string;
    channel: string;
    spend: number;
    impressions: number;
    clicks: number;
    conversions: number;
    ctr: number;
    cpa: number;
    cpm: number;
    frequency?: number;
}

const AdCard: React.FC<{ ad: AdSummary; avgCpa: number }> = ({ ad, avgCpa }) => {
    const status = statusBadge(ad.ctr, ad.cpa, avgCpa, ad.frequency);
    const ctrColor = ad.ctr >= 1 ? 'text-emerald-600' : ad.ctr >= 0.5 ? 'text-amber-600' : 'text-red-500';

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            {/* Thumbnail placeholder */}
            <div className="h-32 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center relative">
                <BarChart2 size={32} className="text-slate-300" />
                <span className={`absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full border ${status.cls}`}>
                    {status.label}
                </span>
                <span className="absolute bottom-2 left-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/80 text-slate-600 border border-slate-200 uppercase">
                    {ad.channel}
                </span>
            </div>

            <div className="p-3">
                <p className="text-xs font-semibold text-slate-800 truncate" title={ad.adName}>{ad.adName}</p>
                <p className="text-[10px] text-slate-400 truncate mb-3" title={ad.campaign}>{ad.campaign}</p>

                <div className="grid grid-cols-3 gap-1.5 text-center">
                    <div className="bg-slate-50 rounded p-1.5">
                        <div className="text-[10px] text-slate-400">Impress.</div>
                        <div className="text-xs font-bold text-slate-700">{fmtNum(ad.impressions)}</div>
                    </div>
                    <div className="bg-slate-50 rounded p-1.5">
                        <div className="text-[10px] text-slate-400">CTR</div>
                        <div className={`text-xs font-bold ${ctrColor}`}>{fmtPct(ad.ctr)}</div>
                    </div>
                    <div className="bg-slate-50 rounded p-1.5">
                        <div className="text-[10px] text-slate-400">CPA</div>
                        <div className="text-xs font-bold text-slate-700">{ad.cpa > 0 ? fmtBRL(ad.cpa) : '—'}</div>
                    </div>
                    <div className="bg-slate-50 rounded p-1.5">
                        <div className="text-[10px] text-slate-400">Conv.</div>
                        <div className="text-xs font-bold text-slate-700">{fmtNum(ad.conversions)}</div>
                    </div>
                    <div className="bg-slate-50 rounded p-1.5">
                        <div className="text-[10px] text-slate-400">Invest.</div>
                        <div className="text-xs font-bold text-slate-700">{fmtBRL(ad.spend)}</div>
                    </div>
                    <div className="bg-slate-50 rounded p-1.5">
                        <div className="text-[10px] text-slate-400">Freq.</div>
                        <div className={`text-xs font-bold ${ad.frequency && ad.frequency > 3.5 ? 'text-orange-500' : 'text-slate-700'}`}>
                            {ad.frequency ? ad.frequency.toFixed(1) : '—'}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ── Main Component ────────────────────────────────────────────────────────────
type SortKey = 'cpa' | 'spend' | 'ctr' | 'conversions';
type StatusFilter = 'all' | 'vencedor' | 'excelente' | 'bom' | 'atencao' | 'fadiga';

export const AdsTab: React.FC = () => {
    const { filteredData, previousPeriodData } = useFilters();

    const [search, setSearch] = useState('');
    const [channelFilter, setChannelFilter] = useState<'all' | 'meta' | 'google'>('all');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [sortKey, setSortKey] = useState<SortKey>('conversions');

    // Aggregate by ad_id
    const adMap = useMemo(() => {
        const map = new Map<string, AdSummary>();
        filteredData.forEach(d => {
            const key = d.ad_id || d.ad_name || `${d.campaign}__${d.adset_name}`;
            if (!map.has(key)) {
                map.set(key, {
                    adId: key,
                    adName: d.ad_name || d.campaign,
                    campaign: d.campaign,
                    adset: d.adset_name,
                    channel: d.channel,
                    spend: 0, impressions: 0, clicks: 0, conversions: 0,
                    ctr: 0, cpa: 0, cpm: 0, frequency: undefined,
                });
            }
            const r = map.get(key)!;
            r.spend += d.spend;
            r.impressions += d.impressions;
            r.clicks += d.clicks;
            r.conversions += d.conversions;
            if (d.frequency) r.frequency = ((r.frequency || 0) + d.frequency) / 2;
        });

        map.forEach(r => {
            r.ctr = r.impressions > 0 ? (r.clicks / r.impressions) * 100 : 0;
            r.cpa = r.conversions > 0 ? r.spend / r.conversions : 0;
            r.cpm = r.impressions > 0 ? (r.spend / r.impressions) * 1000 : 0;
        });

        return map;
    }, [filteredData]);

    const allAds = useMemo(() => Array.from(adMap.values()), [adMap]);
    const avgCpa = useMemo(() => {
        const withCpa = allAds.filter(a => a.cpa > 0);
        return withCpa.length > 0 ? withCpa.reduce((s, a) => s + a.cpa, 0) / withCpa.length : 0;
    }, [allAds]);

    // Previous period totals for KPI comparison
    const prevTotals = useMemo(() => {
        const spend = previousPeriodData.reduce((s, d) => s + d.spend, 0);
        const conversions = previousPeriodData.reduce((s, d) => s + d.conversions, 0);
        const impressions = previousPeriodData.reduce((s, d) => s + d.impressions, 0);
        const clicks = previousPeriodData.reduce((s, d) => s + d.clicks, 0);
        return {
            spend,
            conversions,
            cpa: conversions > 0 ? spend / conversions : 0,
            ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
        };
    }, [previousPeriodData]);

    const currTotals = useMemo(() => {
        const spend = filteredData.reduce((s, d) => s + d.spend, 0);
        const conversions = filteredData.reduce((s, d) => s + d.conversions, 0);
        const impressions = filteredData.reduce((s, d) => s + d.impressions, 0);
        const clicks = filteredData.reduce((s, d) => s + d.clicks, 0);
        return {
            spend,
            conversions,
            cpa: conversions > 0 ? spend / conversions : 0,
            ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
            activeAds: allAds.filter(a => a.impressions > 0).length,
            alertAds: allAds.filter(a => (a.frequency && a.frequency > 3.5) || (avgCpa > 0 && a.cpa > avgCpa * 2)).length,
        };
    }, [filteredData, allAds, avgCpa]);

    const calcChange = (curr: number, prev: number) => prev > 0 ? ((curr - prev) / prev) * 100 : undefined;

    // Filtered & sorted ads
    const displayAds = useMemo(() => {
        return allAds
            .filter(a => {
                if (channelFilter !== 'all' && a.channel !== channelFilter) return false;
                if (search && !a.adName.toLowerCase().includes(search.toLowerCase()) &&
                    !a.campaign.toLowerCase().includes(search.toLowerCase())) return false;
                if (statusFilter !== 'all') {
                    const s = statusBadge(a.ctr, a.cpa, avgCpa, a.frequency);
                    if (statusFilter === 'vencedor' && s.label !== 'VENCEDOR') return false;
                    if (statusFilter === 'excelente' && s.label !== 'EXCELENTE') return false;
                    if (statusFilter === 'bom' && s.label !== 'BOM') return false;
                    if (statusFilter === 'atencao' && s.label !== 'ATENÇÃO') return false;
                    if (statusFilter === 'fadiga' && s.label !== 'FADIGA') return false;
                }
                return true;
            })
            .sort((a, b) => {
                if (sortKey === 'cpa') return (a.cpa || Infinity) - (b.cpa || Infinity);
                return b[sortKey] - a[sortKey];
            });
    }, [allAds, channelFilter, search, statusFilter, sortKey, avgCpa]);

    // Top 5 by conversions
    const top5 = useMemo(() =>
        [...allAds].filter(a => a.conversions > 0).sort((a, b) => b.conversions - a.conversions).slice(0, 5),
        [allAds]
    );

    // CPA trend over time
    const cpaTrend = useMemo(() => {
        const map = new Map<string, { spend: number; conversions: number }>();
        filteredData.forEach(d => {
            const key = format(new Date(d.date), 'dd/MM');
            if (!map.has(key)) map.set(key, { spend: 0, conversions: 0 });
            const r = map.get(key)!;
            r.spend += d.spend;
            r.conversions += d.conversions;
        });
        return Array.from(map.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, r]) => ({ date, cpa: r.conversions > 0 ? r.spend / r.conversions : 0 }));
    }, [filteredData]);

    // Scatter CTR x CPA
    const scatterData = useMemo(() =>
        allAds.filter(a => a.ctr > 0 && a.cpa > 0).map(a => ({
            x: a.ctr,
            y: a.cpa,
            z: a.spend,
            name: a.adName,
        })),
        [allAds]
    );

    return (
        <div className="space-y-6 animate-fade-in pb-10">

            {/* ── KPI Cards ──────────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <KPI label="Total Spend" value={fmtBRL(currTotals.spend)}
                    change={calcChange(currTotals.spend, prevTotals.spend)}
                    icon={<DollarSign size={16} />} />
                <KPI label="Conversões" value={fmtNum(currTotals.conversions)}
                    change={calcChange(currTotals.conversions, prevTotals.conversions)}
                    icon={<Target size={16} />} />
                <KPI label="CPA Médio" value={currTotals.cpa > 0 ? fmtBRL(currTotals.cpa) : '—'}
                    change={calcChange(currTotals.cpa, prevTotals.cpa)} inverse
                    icon={<Zap size={16} />} />
                <KPI label="CTR Médio" value={fmtPct(currTotals.ctr)}
                    change={calcChange(currTotals.ctr, prevTotals.ctr)}
                    icon={<MousePointerClick size={16} />} />
                <KPI label="Anúncios Ativos" value={String(currTotals.activeAds)}
                    icon={<Eye size={16} />} />
                <KPI label="Em Alerta" value={String(currTotals.alertAds)}
                    icon={<AlertTriangle size={16} />} />
            </div>

            {/* ── CPA Trend Chart ────────────────────────────────────────────── */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                <h3 className="text-sm font-bold text-slate-700 mb-4">Tendência de CPA</h3>
                <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={cpaTrend}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false}
                                tickFormatter={(v) => fmtBRL(v)} />
                            <Tooltip formatter={(v: number) => [fmtBRL(v), 'CPA']}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                            <Area type="monotone" dataKey="cpa" stroke="#00C6CC" fill="#00C6CC" fillOpacity={0.1} strokeWidth={2} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* ── Filters + Sort ─────────────────────────────────────────────── */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[180px]">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar anúncio ou campanha..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C6CC]/30"
                    />
                </div>

                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                    {(['all', 'meta', 'google'] as const).map(ch => (
                        <button key={ch} onClick={() => setChannelFilter(ch)}
                            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${channelFilter === ch ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}>
                            {ch === 'all' ? 'Todos' : ch === 'meta' ? 'Meta' : 'Google'}
                        </button>
                    ))}
                </div>

                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as StatusFilter)}
                    className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none">
                    <option value="all">Todos os Status</option>
                    <option value="vencedor">Vencedor</option>
                    <option value="excelente">Excelente</option>
                    <option value="bom">Bom</option>
                    <option value="atencao">Atenção</option>
                    <option value="fadiga">Fadiga</option>
                </select>

                <select value={sortKey} onChange={e => setSortKey(e.target.value as SortKey)}
                    className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none">
                    <option value="conversions">↓ Conversões</option>
                    <option value="cpa">↑ Menor CPA</option>
                    <option value="spend">↓ Maior Spend</option>
                    <option value="ctr">↓ Maior CTR</option>
                </select>

                <span className="text-xs text-slate-400">{displayAds.length} anúncios</span>
            </div>

            {/* ── Ad Grid ────────────────────────────────────────────────────── */}
            {displayAds.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                    <BarChart2 size={40} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Nenhum anúncio encontrado com os filtros selecionados.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {displayAds.map(ad => (
                        <AdCard key={ad.adId} ad={ad} avgCpa={avgCpa} />
                    ))}
                </div>
            )}

            {/* ── Top 5 Conversores ──────────────────────────────────────────── */}
            {top5.length > 0 && (
                <div className="bg-slate-900 rounded-xl border border-slate-700 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-700 flex items-center gap-2">
                        <Award size={16} className="text-amber-400" />
                        <h3 className="text-sm font-bold text-white">Top 5 Conversores</h3>
                    </div>
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-slate-400 text-xs uppercase tracking-wider">
                                <th className="px-6 py-3 text-left">Anúncio</th>
                                <th className="px-4 py-3 text-right">CTR</th>
                                <th className="px-4 py-3 text-right">CPA</th>
                                <th className="px-4 py-3 text-right">Conv.</th>
                                <th className="px-4 py-3 text-right">Invest.</th>
                            </tr>
                        </thead>
                        <tbody>
                            {top5.map((ad, idx) => {
                                const ctrBg = ad.ctr >= 1 ? 'bg-emerald-500/20 text-emerald-300' :
                                    ad.ctr >= 0.5 ? 'bg-amber-500/20 text-amber-300' : 'bg-red-500/20 text-red-300';
                                const cpaBg = ad.cpa <= avgCpa * 0.8 ? 'bg-emerald-500/20 text-emerald-300' :
                                    ad.cpa <= avgCpa * 1.2 ? 'bg-amber-500/20 text-amber-300' : 'bg-red-500/20 text-red-300';
                                return (
                                    <tr key={ad.adId} className="border-t border-slate-800 hover:bg-slate-800/50 transition-colors">
                                        <td className="px-6 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black
                                                    ${idx === 0 ? 'bg-amber-500 text-white' : 'bg-slate-700 text-slate-300'}`}>
                                                    {idx + 1}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-white font-medium text-xs truncate max-w-[200px]" title={ad.adName}>
                                                            {ad.adName}
                                                        </span>
                                                        {idx === 0 && (
                                                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                                                VENCEDOR
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-slate-500 text-[10px] truncate max-w-[200px]">{ad.campaign}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <span className={`text-xs font-semibold px-2 py-0.5 rounded ${ctrBg}`}>{fmtPct(ad.ctr)}</span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <span className={`text-xs font-semibold px-2 py-0.5 rounded ${cpaBg}`}>{fmtBRL(ad.cpa)}</span>
                                        </td>
                                        <td className="px-4 py-3 text-right text-white font-bold">{fmtNum(ad.conversions)}</td>
                                        <td className="px-4 py-3 text-right text-slate-300 text-xs">{fmtBRL(ad.spend)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ── Scatter CTR × CPA ──────────────────────────────────────────── */}
            {scatterData.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                    <h3 className="text-sm font-bold text-slate-700 mb-1">Scatter: CTR × CPA</h3>
                    <p className="text-xs text-slate-400 mb-4">Tamanho = Spend. Ideal: canto inferior direito (alto CTR, baixo CPA).</p>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart>
                                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                                <XAxis dataKey="x" name="CTR (%)" type="number" tick={{ fontSize: 11, fill: '#94A3B8' }}
                                    axisLine={false} tickLine={false} label={{ value: 'CTR (%)', position: 'insideBottom', offset: -4, fontSize: 11, fill: '#94A3B8' }} />
                                <YAxis dataKey="y" name="CPA (R$)" type="number" tick={{ fontSize: 11, fill: '#94A3B8' }}
                                    axisLine={false} tickLine={false} tickFormatter={(v) => `R$${v.toFixed(0)}`} />
                                <ZAxis dataKey="z" range={[40, 400]} name="Spend" />
                                <Tooltip cursor={{ strokeDasharray: '3 3' }}
                                    content={({ active, payload }) => {
                                        if (!active || !payload?.length) return null;
                                        const d = payload[0]?.payload;
                                        return (
                                            <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-lg text-xs">
                                                <p className="font-semibold text-slate-700 mb-1 max-w-[180px] truncate">{d.name}</p>
                                                <p className="text-slate-500">CTR: <span className="font-bold text-slate-700">{d.x?.toFixed(2)}%</span></p>
                                                <p className="text-slate-500">CPA: <span className="font-bold text-slate-700">{fmtBRL(d.y)}</span></p>
                                                <p className="text-slate-500">Spend: <span className="font-bold text-slate-700">{fmtBRL(d.z)}</span></p>
                                            </div>
                                        );
                                    }}
                                />
                                <Scatter data={scatterData} fill="#00C6CC" fillOpacity={0.7} />
                            </ScatterChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
        </div>
    );
};
