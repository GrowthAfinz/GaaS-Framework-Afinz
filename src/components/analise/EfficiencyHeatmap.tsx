import React, { useMemo } from 'react';
import { useMediaCorrelation } from '../../hooks/useMediaCorrelation';
import { Info, HelpCircle } from 'lucide-react';

export const EfficiencyHeatmap = () => {
    const { data } = useMediaCorrelation();

    const heatmapData = useMemo(() => {
        return data.map(d => {
            const cpmMeta = d.impressionsMeta > 0 ? (d.spendMeta / d.impressionsMeta) * 1000 : 0;
            const cpmGoogle = d.impressionsGoogle > 0 ? (d.spendGoogle / d.impressionsGoogle) * 1000 : 0;
            const convRate = d.proposals > 0 ? (d.cards / d.proposals) * 100 : 0;

            return {
                date: d.displayDate,
                fullDate: d.date,
                meta: { cpm: cpmMeta, spend: d.spendMeta, imp: d.impressionsMeta },
                google: { cpm: cpmGoogle, spend: d.spendGoogle, imp: d.impressionsGoogle },
                cpa: d.cpa || 0
            };
        }).reverse();
    }, [data]);

    const formatCurrency = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const getCpmColor = (val: number) => {
        if (val === 0) return 'text-slate-500';
        if (val < 8) return 'text-emerald-600 font-bold';
        if (val < 15) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getCpaColor = (val: number) => {
        if (val === 0) return 'text-slate-500';
        if (val < 200) return 'text-emerald-600 font-bold';
        if (val < 350) return 'text-yellow-600';
        return 'text-red-600';
    };

    const CellWithTooltip = ({ children, tooltip }: { children: React.ReactNode, tooltip: string }) => (
        <div className="group relative cursor-help w-full h-full flex items-center justify-center">
            {children}
            <div className="absolute bottom-full mb-2 hidden group-hover:block bg-white border border-slate-200 text-xs text-slate-900 p-2 rounded w-48 shadow-xl z-50 pointer-events-none whitespace-normal text-center">
                {tooltip}
            </div>
        </div>
    );

    const EmptyCell = () => (
        <CellWithTooltip tooltip="Sem gastos registrados neste canal/dia.">
            <span className="text-slate-400">-</span>
        </CellWithTooltip>
    );

    return (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden animate-fade-in-up delay-100">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <h4 className="font-bold text-slate-900 flex items-center gap-2">
                    Mapa de Eficiência Diária
                    <div className="group relative">
                        <HelpCircle size={14} className="text-slate-500 cursor-help" />
                        <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block bg-white border border-slate-200 text-xs text-slate-700 p-2 rounded w-64 shadow-xl z-50">
                            Acompanhe o CPM (Custo por Mil Impressões) de cada canal e o impacto no CPA Final.
                            <br /><br />
                            <span className="text-emerald-600">Verde</span>: Eficiente<br />
                            <span className="text-red-600">Vermelho</span>: Caro
                        </div>
                    </div>
                </h4>
                <div className="text-xs text-slate-500 font-mono">
                    Heatmap de Performance
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-center">
                    <thead className="text-xs font-semibold text-slate-500 bg-slate-50 uppercase tracking-wider">
                        <tr>
                            <th className="py-3 px-4 text-left">DATA</th>
                            <th className="py-3 px-4">
                                META ADS
                                <span className="block text-[9px] text-slate-400 lowercase font-normal">(cpm médio)</span>
                            </th>
                            <th className="py-3 px-4">
                                GOOGLE ADS
                                <span className="block text-[9px] text-slate-400 lowercase font-normal">(cpm médio)</span>
                            </th>
                            <th className="py-3 px-4">
                                CPA EFETIVO
                                <span className="block text-[9px] text-slate-400 lowercase font-normal">(spend total / cards)</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {heatmapData.map((row, idx) => (
                            <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                <td className="py-3 px-4 text-left font-mono text-slate-700 border-r border-slate-200">
                                    {row.date}
                                </td>

                                {/* META */}
                                <td className="py-3 px-4 border-r border-slate-200">
                                    {row.meta.spend > 0 ? (
                                        <CellWithTooltip tooltip={`Spend: ${formatCurrency(row.meta.spend)} | Imp: ${row.meta.imp}`}>
                                            <div className="flex flex-col items-center">
                                                <span className={`${getCpmColor(row.meta.cpm)}`}>
                                                    {formatCurrency(row.meta.cpm)}
                                                </span>
                                            </div>
                                        </CellWithTooltip>
                                    ) : <EmptyCell />}
                                </td>

                                {/* GOOGLE */}
                                <td className="py-3 px-4 border-r border-slate-200">
                                    {row.google.spend > 0 ? (
                                        <CellWithTooltip tooltip={`Spend: ${formatCurrency(row.google.spend)} | Imp: ${row.google.imp}`}>
                                            <div className="flex flex-col items-center">
                                                <span className={`${getCpmColor(row.google.cpm)}`}>
                                                    {formatCurrency(row.google.cpm)}
                                                </span>
                                            </div>
                                        </CellWithTooltip>
                                    ) : <EmptyCell />}
                                </td>

                                {/* CPA */}
                                <td className="py-3 px-4">
                                    {row.cpa > 0 ? (
                                        <CellWithTooltip tooltip="Custo de aquisição final considerando o lag.">
                                            <span className={`${getCpaColor(row.cpa)}`}>
                                                {formatCurrency(row.cpa)}
                                            </span>
                                        </CellWithTooltip>
                                    ) : (
                                        <CellWithTooltip tooltip="Sem cartões emitidos nesta data (considerando lag).">
                                            <span className="text-slate-400">-</span>
                                        </CellWithTooltip>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="bg-slate-50 p-2 text-center text-xs text-slate-500 border-t border-slate-200">
                Data do Spend. Os resultados de CPA já consideram o deslocamento de dias (Lag).
            </div>
        </div>
    );
};
