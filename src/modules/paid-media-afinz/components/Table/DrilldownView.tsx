import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { aggregate } from '../../utils/aggregateMetrics';

interface DrilldownViewProps {
    data: any[];
    visibleColumns: Record<string, boolean>;
    fmtBRL: (v: number) => string;
    fmtNum: (v: number) => string;
    totalSpend?: number; // spend total geral, para coluna "% Spend"
}

type AdsetStatus = 'excellent' | 'good' | 'warning' | 'critical';

function getAdsetStatus(cpa: number, avgCpa: number, frequency: number): AdsetStatus {
    if (frequency > 5.0) return 'critical';
    if (cpa === 0) return 'good';
    if (cpa < avgCpa * 0.8) return 'excellent';
    if (cpa > avgCpa * 1.5) return 'critical';
    if (cpa > avgCpa * 1.2 || frequency > 3.5) return 'warning';
    return 'good';
}

const statusLabel: Record<AdsetStatus, string> = {
    excellent: 'Excelente',
    good: 'Bom',
    warning: 'Atenção',
    critical: 'Crítico',
};

const statusClass: Record<AdsetStatus, string> = {
    excellent: 'bg-emerald-100 text-emerald-800',
    good: 'bg-green-100 text-green-800',
    warning: 'bg-amber-100 text-amber-800',
    critical: 'bg-red-100 text-red-800',
};

/** Agrupa linhas por uma chave, agregando as métricas com o helper ponderado. */
function groupBy(rows: any[], keyFn: (r: any) => string) {
    const map = new Map<string, any[]>();
    rows.forEach(d => {
        const key = keyFn(d);
        const arr = map.get(key) || [];
        arr.push(d);
        map.set(key, arr);
    });
    return Array.from(map.entries())
        .map(([name, groupRows]) => ({ name, rows: groupRows, ...aggregate(groupRows) }))
        .sort((a, b) => b.spend - a.spend);
}

const fmtPct = (v: number) => `${v.toFixed(1)}%`;

export const DrilldownView: React.FC<DrilldownViewProps> = ({ data, visibleColumns, fmtBRL, fmtNum, totalSpend = 0 }) => {
    const [expandedAdsets, setExpandedAdsets] = useState<Set<string>>(new Set());

    // Agrupar por Adset (Grupo) — agregação ponderada via helper compartilhado
    const adsets = useMemo(
        () => groupBy(data, d => d.adset_name || d.adset_id || 'Sem grupo'),
        [data]
    );

    // CPA médio entre grupos para comparação relativa
    const avgCpa = useMemo(() => {
        const withCpa = adsets.filter(a => a.cpa > 0);
        if (withCpa.length === 0) return 0;
        return withCpa.reduce((sum, a) => sum + a.cpa, 0) / withCpa.length;
    }, [adsets]);

    const toggleAdset = (adsetName: string) => {
        const newSet = new Set(expandedAdsets);
        if (newSet.has(adsetName)) newSet.delete(adsetName);
        else newSet.add(adsetName);
        setExpandedAdsets(newSet);
    };

    if (data.length === 0) {
        return <div className="p-4 text-center text-slate-500 text-sm">Nenhum dado detalhado encontrado.</div>;
    }

    return (
        <div className="bg-slate-50/50 p-2 border-l-4 border-l-[#00C6CC]/30 w-full overflow-hidden">
            <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <tbody className="divide-y divide-slate-100">
                        {adsets.map((adset) => {
                            const status = getAdsetStatus(adset.cpa, avgCpa, adset.frequency);
                            const cpaColor = avgCpa > 0 && adset.cpa > 0
                                ? adset.cpa < avgCpa * 0.9 ? 'text-emerald-600 font-bold'
                                    : adset.cpa > avgCpa * 1.2 ? 'text-red-600 font-bold'
                                        : 'text-[#00C6CC] font-bold'
                                : 'text-[#00C6CC] font-bold';
                            const adsetShare = totalSpend ? (adset.spend / totalSpend) * 100 : 0;

                            return (
                                <React.Fragment key={adset.name}>
                                    {/* ADSET ROW (Grupo — subtotal ponderado do conjunto) */}
                                    <tr className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-3 font-medium text-slate-700 w-1/4">
                                            <div className="flex items-center gap-2 pl-4 border-l-2 border-slate-300">
                                                <button
                                                    onClick={() => toggleAdset(adset.name)}
                                                    className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-[#00C6CC] transition-colors"
                                                >
                                                    {expandedAdsets.has(adset.name) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                                </button>
                                                <span className="text-slate-500 text-xs px-2 py-0.5 bg-slate-100 rounded-md uppercase font-semibold">Conjunto</span>
                                                <span className="truncate max-w-[200px]" title={adset.name}>{adset.name}</span>
                                            </div>
                                        </td>

                                        {visibleColumns.status && (
                                            <td className="px-4 py-3 text-center">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusClass[status]}`}>
                                                    {statusLabel[status]}
                                                </span>
                                            </td>
                                        )}
                                        {visibleColumns.trend && <td className="px-4 py-3 text-center text-slate-300">—</td>}
                                        {visibleColumns.spend && <td className="px-6 py-3 text-right font-semibold text-slate-700">{fmtBRL(adset.spend)}</td>}
                                        {visibleColumns.share && <td className="px-6 py-3 text-right text-slate-500">{fmtPct(adsetShare)}</td>}
                                        {visibleColumns.reach && <td className="px-6 py-3 text-right text-slate-500">{fmtNum(adset.reach)}</td>}
                                        {visibleColumns.impressions && <td className="px-6 py-3 text-right text-slate-500">{fmtNum(adset.impressions)}</td>}
                                        {visibleColumns.frequency && (
                                            <td className={`px-6 py-3 text-right ${adset.frequency > 3.5 ? 'text-red-500 font-medium' : 'text-slate-500'}`}>
                                                {adset.frequency > 0 ? adset.frequency.toFixed(1) : '-'}
                                            </td>
                                        )}
                                        {visibleColumns.clicks && <td className="px-6 py-3 text-right text-slate-500">{fmtNum(adset.clicks)}</td>}
                                        {visibleColumns.conversions && <td className="px-6 py-3 text-right font-bold text-slate-700">{fmtNum(adset.conversions)}</td>}
                                        {visibleColumns.ctr && <td className="px-6 py-3 text-right text-slate-500">{adset.ctr.toFixed(2)}%</td>}
                                        {visibleColumns.cpm && <td className="px-6 py-3 text-right text-slate-500">{fmtBRL(adset.cpm)}</td>}
                                        {visibleColumns.cpc && <td className="px-6 py-3 text-right text-slate-500">{fmtBRL(adset.cpc)}</td>}
                                        {visibleColumns.cpa && <td className={`px-6 py-3 text-right ${cpaColor}`}>{fmtBRL(adset.cpa)}</td>}
                                    </tr>

                                    {/* AD ROWS (se expandido) */}
                                    {expandedAdsets.has(adset.name) && (
                                        <tr>
                                            <td colSpan={20} className="bg-slate-50/80 p-0">
                                                <div className="pl-12 py-2">
                                                    <AdList ads={adset.rows} adsetAvgCpa={adset.cpa} visibleColumns={visibleColumns} fmtBRL={fmtBRL} fmtNum={fmtNum} totalSpend={totalSpend} />
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const AdList: React.FC<{
    ads: any[];
    adsetAvgCpa: number;
    visibleColumns: Record<string, boolean>;
    fmtBRL: (v: number) => string;
    fmtNum: (v: number) => string;
    totalSpend?: number;
}> = ({ ads, adsetAvgCpa, visibleColumns, fmtBRL, fmtNum, totalSpend = 0 }) => {
    // Agrupar por Ad (Anúncio) — agregação ponderada via helper compartilhado
    const agAds = useMemo(
        () => groupBy(ads, d => d.ad_name || d.ad_id || 'Sem anúncio'),
        [ads]
    );

    return (
        <table className="w-full text-sm text-left border-l-2 border-indigo-200 ml-4">
            <tbody className="divide-y divide-slate-100/50">
                {agAds.map((ad, idx) => {
                    const adCpaColor = adsetAvgCpa > 0 && ad.cpa > 0
                        ? ad.cpa < adsetAvgCpa * 0.9 ? 'text-emerald-600 font-medium'
                            : ad.cpa > adsetAvgCpa * 1.2 ? 'text-red-500 font-medium'
                                : 'text-indigo-600 font-medium'
                        : 'text-indigo-600 font-medium';
                    const adShare = totalSpend ? (ad.spend / totalSpend) * 100 : 0;

                    return (
                        <tr key={idx} className="hover:bg-white transition-colors">
                            <td className="px-6 py-2 w-1/4">
                                <div className="flex items-center gap-2 pl-2">
                                    <span className="text-indigo-400 text-xs px-2 py-0.5 bg-indigo-50 border border-indigo-100 rounded-md font-semibold text-[10px] uppercase">Anúncio</span>
                                    <span className="truncate max-w-[200px] text-slate-600 text-[13px]" title={ad.name}>{ad.name}</span>
                                </div>
                            </td>

                            {visibleColumns.status && <td className="px-4 py-2 text-center text-slate-300">—</td>}
                            {visibleColumns.trend && <td className="px-4 py-2 text-center text-slate-300">—</td>}
                            {visibleColumns.spend && <td className="px-6 py-2 text-right text-slate-500 text-[13px]">{fmtBRL(ad.spend)}</td>}
                            {visibleColumns.share && <td className="px-6 py-2 text-right text-slate-400 text-[13px]">{fmtPct(adShare)}</td>}
                            {visibleColumns.reach && <td className="px-6 py-2 text-right text-slate-400 text-[13px]">{fmtNum(ad.reach)}</td>}
                            {visibleColumns.impressions && <td className="px-6 py-2 text-right text-slate-400 text-[13px]">{fmtNum(ad.impressions)}</td>}
                            {visibleColumns.frequency && (
                                <td className={`px-6 py-2 text-right text-[13px] ${ad.frequency > 3.5 ? 'text-red-400' : 'text-slate-400'}`}>
                                    {ad.frequency > 0 ? ad.frequency.toFixed(1) : '-'}
                                </td>
                            )}
                            {visibleColumns.clicks && <td className="px-6 py-2 text-right text-slate-400 text-[13px]">{fmtNum(ad.clicks)}</td>}
                            {visibleColumns.conversions && <td className="px-6 py-2 text-right text-slate-600 font-medium text-[13px]">{fmtNum(ad.conversions)}</td>}
                            {visibleColumns.ctr && <td className="px-6 py-2 text-right text-slate-400 text-[13px]">{ad.ctr.toFixed(2)}%</td>}
                            {visibleColumns.cpm && <td className="px-6 py-2 text-right text-slate-400 text-[13px]">{fmtBRL(ad.cpm)}</td>}
                            {visibleColumns.cpc && <td className="px-6 py-2 text-right text-slate-400 text-[13px]">{fmtBRL(ad.cpc)}</td>}
                            {visibleColumns.cpa && <td className={`px-6 py-2 text-right text-[13px] ${adCpaColor}`}>{fmtBRL(ad.cpa)}</td>}
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
};
