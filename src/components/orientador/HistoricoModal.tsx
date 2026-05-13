import React, { useState, useMemo } from 'react';
import { Recommendation } from '../../types/recommendations';
import { X, Calendar, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip as RechartsTooltip, CartesianGrid, XAxis, YAxis } from 'recharts';

interface HistoricoModalProps {
    recommendation: Recommendation;
    onClose: () => void;
}

const ITEMS_PER_PAGE = 5;

export const HistoricoModal: React.FC<HistoricoModalProps> = ({ recommendation, onClose }) => {
    const { combo, sampleActivities, metrics } = recommendation;
    const [currentPage, setCurrentPage] = useState(1);

    // Sort activities by date desc
    const sortedActivities = useMemo(() => {
        return [...sampleActivities].sort((a, b) => b.dataDisparo.getTime() - a.dataDisparo.getTime());
    }, [sampleActivities]);

    // Pagination Logic
    const totalPages = Math.ceil(sortedActivities.length / ITEMS_PER_PAGE);
    const currentActivities = sortedActivities.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    // Chart Data (Chronological order)
    const chartData = useMemo(() => {
        return [...sampleActivities]
            .sort((a, b) => a.dataDisparo.getTime() - b.dataDisparo.getTime())
            .map(act => ({
                date: act.dataDisparo.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
                cartoes: act.kpis.cartoes || 0,
                cac: act.kpis.cac || 0,
                conversao: (act.kpis.taxaConversao || 0) * 100
            }));
    }, [sampleActivities]);

    const handleExportCSV = () => {
        const headers = ['Data', 'Activity Name', 'BU', 'Cartões', 'Conversão (%)', 'CAC (R$)', 'Custo Total (R$)'];
        const rows = sortedActivities.map(act => [
            act.dataDisparo.toLocaleDateString('pt-BR'),
            `"${act.id}"`,
            act.bu,
            act.kpis.cartoes || 0,
            ((act.kpis.taxaConversao || 0) * 100).toFixed(2).replace('.', ','),
            (act.kpis.cac || 0).toFixed(2).replace('.', ','),
            (act.kpis.custoTotal || 0).toFixed(2).replace('.', ',')
        ]);

        const csvContent = [
            headers.join(';'),
            ...rows.map(row => row.join(';'))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `historico_${combo.canal}_${combo.segmento}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white border border-slate-200 rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-200 shrink-0">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            📜 Histórico de Execuções
                        </h2>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-1 flex-wrap">
                            <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{combo.canal}</span>
                            <span>+</span>
                            <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{combo.segmento}</span>
                            <span>+</span>
                            <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-medium border border-slate-200">{combo.oferta}</span>
                            {combo.promocional && (
                                <>
                                    <span>+</span>
                                    <span className="bg-pink-50 text-pink-700 px-2 py-0.5 rounded border border-pink-200 font-medium">
                                        {combo.promocional}
                                    </span>
                                </>
                            )}

                            <span>+</span>
                            <span className="bg-cyan-50 text-cyan-700 px-2 py-0.5 rounded border border-cyan-200 font-medium">
                                {combo.oferta2}
                            </span>

                            {combo.promocional2 && (
                                <>
                                    <span>+</span>
                                    <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded border border-indigo-200 font-medium">
                                        {combo.promocional2}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleExportCSV}
                            className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition"
                        >
                            <Download size={14} /> Exportar CSV
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-100 rounded-lg transition text-slate-500 hover:text-slate-900"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-6">

                    {/* Summary Stats */}
                    <div className="grid grid-cols-4 gap-4">
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                            <div className="text-xs text-slate-500 mb-1">Total Execuções</div>
                            <div className="text-xl font-bold text-slate-900">{metrics.totalVolume}</div>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                            <div className="text-xs text-slate-500 mb-1">CAC Médio</div>
                            <div className="text-xl font-bold text-slate-900">R$ {metrics.avgCAC.toFixed(2)}</div>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                            <div className="text-xs text-slate-500 mb-1">Conversão Média</div>
                            <div className="text-xl font-bold text-slate-900">{(metrics.avgConversion * 100).toFixed(1)}%</div>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                            <div className="text-xs text-slate-500 mb-1">Total Cartões</div>
                            <div className="text-xl font-bold text-slate-900">{metrics.totalCards}</div>
                        </div>
                    </div>

                    {/* Trend Chart */}
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <h3 className="text-xs font-bold text-slate-500 mb-4 uppercase tracking-wider">Tendência de Cartões (Últimas Execuções)</h3>
                        <div className="h-32 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorCartoes" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                                    <XAxis
                                        dataKey="date"
                                        stroke="#64748b"
                                        tick={{ fill: '#64748b', fontSize: 10 }}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        stroke="#64748b"
                                        tick={{ fill: '#64748b', fontSize: 10 }}
                                        tickLine={false}
                                        axisLine={false}
                                        width={30}
                                    />
                                    <RechartsTooltip
                                        contentStyle={{ backgroundColor: '#ffffff', borderColor: '#E2E8F0', fontSize: '12px' }}
                                        itemStyle={{ color: '#1e293b' }}
                                    />
                                    <Area type="monotone" dataKey="cartoes" stroke="#3b82f6" fillOpacity={1} fill="url(#colorCartoes)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Execution List */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-bold text-slate-700">Lista de Execuções</h3>
                            <span className="text-xs text-slate-500">
                                Página {currentPage} de {totalPages}
                            </span>
                        </div>

                        <div className="space-y-3">
                            {currentActivities.map((activity) => {
                                const getChannelColor = (canal: string) => {
                                    const c = canal.toLowerCase();
                                    if (c.includes('email') || c.includes('e-mail')) return 'bg-blue-50 text-blue-700 border-blue-200';
                                    if (c.includes('sms')) return 'bg-amber-50 text-amber-700 border-amber-200';
                                    if (c.includes('push')) return 'bg-purple-50 text-purple-700 border-purple-200';
                                    if (c.includes('whats')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
                                    return 'bg-slate-100 text-slate-700 border-slate-300';
                                };

                                return (
                                    <div key={activity.id} className="bg-white border border-slate-200 rounded-lg p-3 hover:border-slate-300 transition">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getChannelColor(activity.canal)}`}>
                                                        {activity.canal}
                                                    </span>
                                                    <span className="text-xs text-slate-400">•</span>
                                                    <span className="text-xs font-medium text-slate-700">{activity.bu}</span>
                                                    {activity.segmento && (
                                                        <>
                                                            <span className="text-xs text-slate-400">•</span>
                                                            <span className="text-xs font-medium text-slate-700">{activity.segmento}</span>
                                                        </>
                                                    )}
                                                    {activity.jornada && (
                                                        <>
                                                            <span className="text-xs text-slate-400">•</span>
                                                            <span className="text-xs font-medium text-purple-600">{activity.jornada}</span>
                                                        </>
                                                    )}
                                                    <span className="text-xs text-slate-500 ml-auto flex items-center gap-1">
                                                        <Calendar size={10} />
                                                        {activity.dataDisparo.toLocaleDateString('pt-BR')}
                                                    </span>
                                                </div>
                                                <h3 className="text-sm font-bold text-slate-900 line-clamp-1" title={activity.id}>
                                                    {activity.id}
                                                </h3>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-4 gap-2 mt-2">
                                            <div className="bg-slate-50 p-2 rounded border border-slate-100">
                                                <div className="text-[10px] text-slate-500 mb-0.5">Enviado</div>
                                                <div className="text-xs font-semibold text-slate-900">{activity.kpis.baseEnviada || 0}</div>
                                            </div>
                                            <div className="bg-slate-50 p-2 rounded border border-slate-100">
                                                <div className="text-[10px] text-slate-500 mb-0.5">Entregue</div>
                                                <div className="text-xs font-semibold text-slate-900">{activity.kpis.baseEntregue || 0}</div>
                                            </div>
                                            <div className="bg-slate-50 p-2 rounded border border-slate-100">
                                                <div className="text-[10px] text-slate-500 mb-0.5">Cartões</div>
                                                <div className="text-xs font-semibold text-blue-600">{activity.kpis.cartoes || 0}</div>
                                            </div>
                                            <div className="bg-slate-50 p-2 rounded border border-slate-100">
                                                <div className="text-[10px] text-slate-500 mb-0.5">Conversão</div>
                                                <div className="text-xs font-semibold text-emerald-600">
                                                    {activity.kpis.taxaConversao ? (activity.kpis.taxaConversao * 100).toFixed(2) : 0}%
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="flex justify-center items-center gap-4 mt-4">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="p-1 rounded hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed text-slate-500"
                                >
                                    <ChevronLeft size={20} />
                                </button>
                                <span className="text-xs text-slate-500">
                                    {currentPage} / {totalPages}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="p-1 rounded hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed text-slate-500"
                                >
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-800 flex justify-end shrink-0">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium transition"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
};
