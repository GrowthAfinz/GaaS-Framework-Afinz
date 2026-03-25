import React, { useMemo, useState, useEffect } from 'react';
import type { DailyMetrics } from '../types';
import { ArrowUpDown, Search, Filter, TrendingUp, TrendingDown, Minus, ChevronRight, ChevronDown, Loader2 } from 'lucide-react';
import { CampaignSidePanel } from './CampaignSidePanel';
import { DrilldownView } from './Table/DrilldownView';
import { dataService } from '../../../services/dataService';
import { useFilters } from '../context/FilterContext';
import { format } from 'date-fns';

interface CampaignPerformanceTableProps {
    data: any[]; // use any to bypass type errors for now since reach might not be in DailyMetrics
}

type SortField = 'campaign' | 'spend' | 'impressions' | 'clicks' | 'conversions' | 'cpm' | 'ctr' | 'cpc' | 'cpa' | 'reach' | 'frequency';
type SortOrder = 'asc' | 'desc';

export const CampaignPerformanceTable: React.FC<CampaignPerformanceTableProps> = ({ data }) => {
    const { filters } = useFilters();
    
    const [sortField, setSortField] = useState<SortField>('spend');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
    const [search, setSearch] = useState('');
    const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);

    // Drilldown State
    const [expandedCampaigns, setExpandedCampaigns] = useState<Set<string>>(new Set());
    const [drilldownCache, setDrilldownCache] = useState<Record<string, any[]>>({});
    const [isLoadingDrilldown, setIsLoadingDrilldown] = useState<Record<string, boolean>>({});

    // Invalidate cache when date range changes
    useEffect(() => {
        setDrilldownCache({});
        setExpandedCampaigns(new Set());
    }, [filters.dateRange.from, filters.dateRange.to]);

    const toggleCampaignParams = async (campaign: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevents row click (Side Panel)
        
        const newExpanded = new Set(expandedCampaigns);
        if (newExpanded.has(campaign)) {
             newExpanded.delete(campaign);
             setExpandedCampaigns(newExpanded);
        } else {
             newExpanded.add(campaign);
             setExpandedCampaigns(newExpanded);
             // Lazy Fetch if not cached
             if (!drilldownCache[campaign]) {
                  try {
                      setIsLoadingDrilldown(prev => ({...prev, [campaign]: true}));
                      const fromStr = format(filters.dateRange.from, 'yyyy-MM-dd');
                      const toStr = format(filters.dateRange.to, 'yyyy-MM-dd');
                      const rawData = await dataService.fetchDrilldownData(campaign, fromStr, toStr);
                      setDrilldownCache(prev => ({...prev, [campaign]: rawData}));
                  } catch (err) {
                      console.error('Falha ao puxar detalhamento:', err);
                  } finally {
                      setIsLoadingDrilldown(prev => ({...prev, [campaign]: false}));
                  }
             }
        }
    };

    // Aggregate by Campaign
    const campaignStats = useMemo(() => {
        const map = new Map<string, {
            campaign: string;
            channel: string;
            objective: string;
            spend: number;
            impressions: number;
            clicks: number;
            conversions: number;
            reach: number;
            dataPoints: any[];
        }>();

        data.forEach(d => {
            const curr = map.get(d.campaign) || {
                campaign: d.campaign,
                channel: d.channel,
                objective: d.objective,
                spend: 0,
                impressions: 0,
                clicks: 0,
                conversions: 0,
                reach: 0,
                dataPoints: []
            };
            curr.spend += Number(d.spend) || 0;
            curr.impressions += Number(d.impressions) || 0;
            curr.clicks += Number(d.clicks) || 0;
            curr.conversions += Number(d.conversions) || 0;
            curr.reach += Number(d.reach) || 0;
            curr.dataPoints.push(d);
            map.set(d.campaign, curr);
        });

        const stats = Array.from(map.values()).map(c => {
            const frequency = c.reach > 0 ? c.impressions / c.reach : 0;
            return {
                ...c,
                frequency,
                cpm: c.impressions ? (c.spend / c.impressions) * 1000 : 0,
                ctr: c.impressions ? (c.clicks / c.impressions) * 100 : 0,
                cpc: c.clicks ? (c.spend / c.clicks) : 0,
                cpa: c.conversions ? (c.spend / c.conversions) : 0,
            };
        });

        // Calculate Average CPA for benchmark
        const totalSpend = stats.reduce((a, b) => a + b.spend, 0);
        const totalConv = stats.reduce((a, b) => a + b.conversions, 0);
        const avgCpa = totalConv ? totalSpend / totalConv : 0;

        return stats.map(c => {
            // 1. Status Logic (CPA based)
            let status: 'excellent' | 'good' | 'warning' | 'critical' = 'good';
            if (c.cpa === 0 && c.spend > 100) status = 'critical'; // burning money
            else if (c.cpa > 0) {
                if (c.cpa < avgCpa * 0.8) status = 'excellent';
                else if (c.cpa > avgCpa * 1.5) status = 'critical';
                else if (c.cpa > avgCpa * 1.2) status = 'warning';
            }

            // Apply Frequency overrides
            if (c.frequency > 5.0) status = 'critical';
            else if (c.frequency > 3.5 && status !== 'critical') status = 'warning';

            // 2. Action Logic
            let action: 'scale' | 'maintain' | 'optimize' | 'pause' = 'maintain';
            if (status === 'excellent') action = 'scale';
            if (status === 'warning') action = 'optimize';
            if (status === 'critical') action = 'pause';

            // 3. Trend Logic (Compare first 3 days vs last 3 days of selected period)
            const sortedPoints = c.dataPoints.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            let trend: 'up' | 'down' | 'flat' = 'flat';
            if (sortedPoints.length >= 2) {
                const split = Math.ceil(sortedPoints.length / 3);
                const first = sortedPoints.slice(0, split);
                const last = sortedPoints.slice(-split);
                const fS = first.reduce((a, b) => a + b.spend, 0); const fC = first.reduce((a, b) => a + b.conversions, 0) || 1;
                const lS = last.reduce((a, b) => a + b.spend, 0); const lC = last.reduce((a, b) => a + b.conversions, 0) || 1;
                const firstCpa = fS / fC;
                const lastCpa = lS / lC;

                // If CPA increased by >5%, Trend UP (Red/Bad). If decreased by >5%, Trend DOWN (Green/Good).
                if (lastCpa > firstCpa * 1.05) trend = 'up';
                else if (lastCpa < firstCpa * 0.95) trend = 'down';
            }

            return { ...c, status, action, trend };
        });
    }, [data]);

    // Filter & Sort
    const processedData = useMemo(() => {
        let result = campaignStats;

        if (search) {
            const q = search.toLowerCase();
            result = result.filter(c => c.campaign.toLowerCase().includes(q));
        }

        result.sort((a, b) => {
            const valA = a[sortField];
            const valB = b[sortField];

            if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
            if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });

        return result;
    }, [campaignStats, search, sortField, sortOrder]);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('desc'); // default desc for metrics
        }
    };

    const fmtBRL = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
    const fmtNum = (v: number) => new Intl.NumberFormat('pt-BR').format(v);

    const defaultColumns: Record<string, boolean> = {
        spend: true,
        impressions: true,
        reach: false,
        frequency: true,
        clicks: true,
        conversions: true,
        ctr: true,
        cpm: true,
        cpc: true,
        cpa: true,
        status: true,
        trend: true
    };
    const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() => {
        try {
            const saved = localStorage.getItem('media_visible_cols');
            if (saved) return { ...defaultColumns, ...JSON.parse(saved) };
        } catch { /* ignore parse errors */ }
        return defaultColumns;
    });
    const [isColumnsMenuOpen, setIsColumnsMenuOpen] = useState(false);

    const toggleColumn = (col: string) => {
        setVisibleColumns(prev => {
            const next = { ...prev, [col]: !prev[col] };
            try { localStorage.setItem('media_visible_cols', JSON.stringify(next)); } catch { /* ignore */ }
            return next;
        });
    };

    return (
        <>
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Buscar campanha..."
                                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="text-sm text-slate-500 whitespace-nowrap">
                            {processedData.length} campanhas
                        </div>
                    </div>

                    {/* Column Toggle */}
                    <div className="relative">
                        <button
                            onClick={() => setIsColumnsMenuOpen(!isColumnsMenuOpen)}
                            className="flex items-center gap-2 px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 transition-colors"
                        >
                            <Filter size={16} />
                            Colunas
                        </button>

                        {isColumnsMenuOpen && (
                            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 p-2 z-10 animate-fade-in-down max-h-72 overflow-y-auto">
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">Métricas</div>
                                {Object.keys(visibleColumns).map(col => (
                                    <label key={col} className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 rounded cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={visibleColumns[col]}
                                            onChange={() => toggleColumn(col)}
                                            className="rounded text-primary focus:ring-primary/30"
                                        />
                                        <span className="text-sm text-slate-700 capitalize">
                                            {col === 'spend' ? 'Investimento' :
                                                col === 'impressions' ? 'Impressões' :
                                                    col === 'reach' ? 'Alcance' :
                                                        col === 'frequency' ? 'Frequência' :
                                                            col === 'clicks' ? 'Cliques' :
                                                                col === 'conversions' ? 'Conversões' :
                                                                    col === 'cpa' ? 'CPA' :
                                                                        col === 'status' ? 'Status' :
                                                                            col === 'action' ? 'Recomendação' :
                                                                                col === 'trend' ? 'Tend. CPA' :
                                                                                    col.toUpperCase()}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-semibold">
                            <tr>
                                <th className="px-6 py-3 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('campaign')}>
                                    <div className="flex items-center gap-1">Campanha <ArrowUpDown size={12} /></div>
                                </th>
                                {visibleColumns.status && <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer group">Status</th>}

                                {visibleColumns.trend && <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer group">Tend. CPA</th>}
                                {visibleColumns.spend && (
                                    <th className="px-6 py-3 text-right cursor-pointer hover:bg-slate-100" onClick={() => handleSort('spend')}>
                                        <div className="flex items-center justify-end gap-1">Invest. <ArrowUpDown size={12} /></div>
                                    </th>
                                )}
                                {visibleColumns.reach && (
                                    <th className="px-6 py-3 text-right cursor-pointer hover:bg-slate-100" onClick={() => handleSort('reach')}>
                                        <div className="flex items-center justify-end gap-1">Alcance <ArrowUpDown size={12} /></div>
                                    </th>
                                )}
                                {visibleColumns.impressions && (
                                    <th className="px-6 py-3 text-right cursor-pointer hover:bg-slate-100" onClick={() => handleSort('impressions')}>
                                        <div className="flex items-center justify-end gap-1">Impr. <ArrowUpDown size={12} /></div>
                                    </th>
                                )}
                                {visibleColumns.frequency && (
                                    <th className="px-6 py-3 text-right cursor-pointer hover:bg-slate-100" onClick={() => handleSort('frequency')}>
                                        <div className="flex items-center justify-end gap-1">Freq. <ArrowUpDown size={12} /></div>
                                    </th>
                                )}
                                {visibleColumns.clicks && (
                                    <th className="px-6 py-3 text-right cursor-pointer hover:bg-slate-100" onClick={() => handleSort('clicks')}>
                                        <div className="flex items-center justify-end gap-1">Cliques <ArrowUpDown size={12} /></div>
                                    </th>
                                )}
                                {visibleColumns.conversions && (
                                    <th className="px-6 py-3 text-right cursor-pointer hover:bg-slate-100" onClick={() => handleSort('conversions')}>
                                        <div className="flex items-center justify-end gap-1">Conv. <ArrowUpDown size={12} /></div>
                                    </th>
                                )}
                                {visibleColumns.ctr && (
                                    <th className="px-6 py-3 text-right cursor-pointer hover:bg-slate-100" onClick={() => handleSort('ctr')}>
                                        <div className="flex items-center justify-end gap-1">CTR <ArrowUpDown size={12} /></div>
                                    </th>
                                )}
                                {visibleColumns.cpm && (
                                    <th className="px-6 py-3 text-right cursor-pointer hover:bg-slate-100" onClick={() => handleSort('cpm')}>
                                        <div className="flex items-center justify-end gap-1">CPM <ArrowUpDown size={12} /></div>
                                    </th>
                                )}
                                {visibleColumns.cpc && (
                                    <th className="px-6 py-3 text-right cursor-pointer hover:bg-slate-100" onClick={() => handleSort('cpc')}>
                                        <div className="flex items-center justify-end gap-1">CPC <ArrowUpDown size={12} /></div>
                                    </th>
                                )}
                                {visibleColumns.cpa && (
                                    <th className="px-6 py-3 text-right cursor-pointer hover:bg-slate-100" onClick={() => handleSort('cpa')}>
                                        <div className="flex items-center justify-end gap-1">CPA <ArrowUpDown size={12} /></div>
                                    </th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {processedData.map((row) => (
                                <React.Fragment key={row.campaign}>
                                <tr
                                    className="hover:bg-slate-50 transition-colors cursor-pointer group"
                                    onClick={() => setSelectedCampaign(row.campaign)}
                                >
                                    <td className="px-6 py-3 font-medium text-slate-700">
                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={(e) => toggleCampaignParams(row.campaign, e)} 
                                                className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-primary transition-colors cursor-pointer"
                                                title="Mostrar Conjuntos de Anúncios"
                                            >
                                                {expandedCampaigns.has(row.campaign) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                            </button>
                                            <span className={`w-2 h-2 rounded-full ${row.channel === 'meta' ? 'bg-[#1877F2]' : 'bg-[#4285F4]'}`}></span>
                                            {row.campaign}
                                        </div>
                                    </td>

                                    {/* Status Column */}
                                    {visibleColumns.status && (
                                        <td className="px-4 py-3 whitespace-nowrap text-center">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                                                ${row.status === 'excellent' ? 'bg-emerald-100 text-emerald-800' :
                                                    row.status === 'good' ? 'bg-green-100 text-green-800' :
                                                        row.status === 'warning' ? 'bg-amber-100 text-amber-800' :
                                                            'bg-red-100 text-red-800'}`}>
                                                {row.status === 'excellent' ? 'Excelente' :
                                                    row.status === 'good' ? 'Bom' :
                                                        row.status === 'warning' ? 'Atenção' : 'Crítico'}
                                            </span>
                                        </td>
                                    )}

                                    {/* Trend Column */}
                                    {visibleColumns.trend && (
                                        <td className="px-4 py-3 whitespace-nowrap text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                {row.trend === 'up' && <TrendingUp size={14} className="text-red-500" />}
                                                {row.trend === 'down' && <TrendingDown size={14} className="text-emerald-500" />}
                                                {row.trend === 'flat' && <Minus size={14} className="text-slate-400" />}
                                            </div>
                                        </td>
                                    )}

                                    {visibleColumns.spend && <td className="px-6 py-3 text-right font-semibold text-slate-700">{fmtBRL(row.spend)}</td>}
                                    {visibleColumns.reach && (
                                        <td className="px-6 py-3 text-right text-slate-600 group relative">
                                            <span className="cursor-help">{fmtNum(row.reach)}</span>
                                            <div className="hidden group-hover:block absolute bottom-full mb-2 right-0 bg-slate-800 text-white text-xs p-2 rounded w-48 shadow-lg z-50">
                                                Soma do alcance por anúncio. Pode haver sobreposição entre anúncios.
                                            </div>
                                        </td>
                                    )}
                                    {visibleColumns.impressions && <td className="px-6 py-3 text-right text-slate-600">{fmtNum(row.impressions)}</td>}
                                    {visibleColumns.frequency && (
                                        <td 
                                            className={`px-6 py-3 text-right font-medium ${row.frequency > 3.5 ? 'text-red-500' : 'text-slate-600'} group relative`}
                                        >
                                            <span className="cursor-help">{row.frequency > 0 ? row.frequency.toFixed(1) : '-'}</span>
                                            {row.frequency > 3.5 && (
                                                <div className="hidden group-hover:block absolute bottom-full mb-2 right-0 bg-slate-800 text-white text-xs p-2 rounded w-48 shadow-lg z-50 whitespace-normal text-right">
                                                    Frequência alta pode indicar fadiga criativa.
                                                </div>
                                            )}
                                        </td>
                                    )}
                                    {visibleColumns.clicks && <td className="px-6 py-3 text-right text-slate-600">{fmtNum(row.clicks)}</td>}
                                    {visibleColumns.conversions && <td className="px-6 py-3 text-right font-semibold text-slate-700">{fmtNum(row.conversions)}</td>}
                                    {visibleColumns.ctr && <td className="px-6 py-3 text-right text-slate-600">{row.ctr.toFixed(2)}%</td>}
                                    {visibleColumns.cpm && <td className="px-6 py-3 text-right text-slate-600">{fmtBRL(row.cpm)}</td>}
                                    {visibleColumns.cpc && <td className="px-6 py-3 text-right text-slate-600">{fmtBRL(row.cpc)}</td>}
                                    {visibleColumns.cpa && <td className="px-6 py-3 text-right font-medium text-slate-700">{fmtBRL(row.cpa)}</td>}
                                </tr>
                                
                                {expandedCampaigns.has(row.campaign) && (
                                    <tr className="bg-slate-50/30">
                                        <td colSpan={15} className="p-0">
                                            {isLoadingDrilldown[row.campaign] ? (
                                                <div className="p-8 text-center text-slate-500 flex flex-col items-center justify-center gap-3 bg-slate-50 border-y border-slate-100">
                                                    <Loader2 className="animate-spin text-primary" size={24} />
                                                    <span className="text-sm font-medium">Buscando criativos no Supabase...</span>
                                                </div>
                                            ) : (
                                                <DrilldownView 
                                                    data={drilldownCache[row.campaign] || []} 
                                                    visibleColumns={visibleColumns} 
                                                    fmtBRL={fmtBRL} 
                                                    fmtNum={fmtNum} 
                                                />
                                            )}
                                        </td>
                                    </tr>
                                )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>

                {processedData.length === 0 && (
                    <div className="p-8 text-center text-slate-400">
                        Nenhuma campanha encontrada.
                    </div>
                )}
            </div>

            {selectedCampaign && (
                <CampaignSidePanel
                    campaign={selectedCampaign}
                    data={data}
                    onClose={() => setSelectedCampaign(null)}
                />
            )}
        </>
    );
};
