import React, { useEffect, useMemo, useState } from 'react';
import { Lightbulb, X, RefreshCw } from 'lucide-react';
import { CrmInsight, InsightStatus, fetchActiveInsights, updateInsightStatus } from '../../services/insightService';
import { InsightCard } from './InsightCard';

type TipoFilter = 'todos' | CrmInsight['tipo'];

const FILTER_CHIPS: { id: TipoFilter; label: string }[] = [
    { id: 'todos', label: 'Todos' },
    { id: 'gargalo', label: 'Gargalos' },
    { id: 'oportunidade', label: 'Oportunidades' },
    { id: 'share_portfolio', label: 'Portfólio' },
    { id: 'queda_performance', label: 'Quedas' },
    { id: 'decomposicao_cac', label: 'CAC' },
    { id: 'virada_safra', label: 'Safras' },
    { id: 'risco_concentracao', label: 'Riscos' },
];

export const InsightDeckModal: React.FC = () => {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [insights, setInsights] = useState<CrmInsight[]>([]);
    const [tipoFilter, setTipoFilter] = useState<TipoFilter>('todos');

    const load = async () => {
        setLoading(true);
        setInsights(await fetchActiveInsights());
        setLoading(false);
    };

    useEffect(() => {
        load();
    }, []);

    const handleUpdateStatus = async (id: string, status: InsightStatus) => {
        // otimista: atualiza local primeiro
        setInsights((prev) => {
            if (status === 'resolvido' || status === 'descartado') {
                return prev.filter((i) => i.id !== id);
            }
            return prev.map((i) => (i.id === id ? { ...i, status } : i));
        });
        const ok = await updateInsightStatus(id, status);
        if (!ok) load(); // rollback via refetch
    };

    const visible = useMemo(() => {
        const filtered = tipoFilter === 'todos' ? insights : insights.filter((i) => i.tipo === tipoFilter);
        // fixados primeiro, depois por prioridade desc
        return [...filtered].sort((a, b) => {
            if ((a.status === 'fixado') !== (b.status === 'fixado')) {
                return a.status === 'fixado' ? -1 : 1;
            }
            return Number(b.prioridade) - Number(a.prioridade);
        });
    }, [insights, tipoFilter]);

    const activeCount = insights.length;
    const criticalCount = insights.filter((i) => i.severidade === 'critico').length;

    return (
        <>
            {/* Botão flutuante */}
            <button
                onClick={() => setOpen(true)}
                className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-slate-900 text-white pl-4 pr-5 py-3 rounded-full shadow-lg hover:bg-slate-800 hover:shadow-xl transition-all"
                title="Abrir Insight Deck"
            >
                <span className="relative">
                    <Lightbulb size={18} className={criticalCount > 0 ? 'text-amber-400' : 'text-slate-300'} />
                    {criticalCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    )}
                </span>
                <span className="text-sm font-semibold">Insights</span>
                {activeCount > 0 && (
                    <span className="bg-white/15 text-xs font-bold px-2 py-0.5 rounded-full">{activeCount}</span>
                )}
            </button>

            {/* Drawer modal */}
            {open && (
                <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
                    <div
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        onClick={() => setOpen(false)}
                    />
                    <div className="relative w-full max-w-md h-full bg-slate-50 shadow-2xl flex flex-col animate-[slideIn_0.2s_ease-out]">
                        <div className="bg-white border-b border-slate-200 px-5 py-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Lightbulb size={18} className="text-amber-500" />
                                    <h2 className="text-base font-bold text-slate-900">Insight Deck</h2>
                                    <span className="text-xs text-slate-400 font-medium">{activeCount} ativos</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={load}
                                        title="Recarregar"
                                        className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                                    >
                                        <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                                    </button>
                                    <button
                                        onClick={() => setOpen(false)}
                                        className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-1.5">
                                {FILTER_CHIPS.map((chip) => {
                                    const count = chip.id === 'todos'
                                        ? insights.length
                                        : insights.filter((i) => i.tipo === chip.id).length;
                                    if (chip.id !== 'todos' && count === 0) return null;
                                    return (
                                        <button
                                            key={chip.id}
                                            onClick={() => setTipoFilter(chip.id)}
                                            className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-colors ${tipoFilter === chip.id
                                                ? 'bg-slate-900 text-white border-slate-900'
                                                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
                                                }`}
                                        >
                                            {chip.label} {count > 0 && <span className="opacity-60">{count}</span>}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                            {loading && insights.length === 0 && (
                                <p className="text-sm text-slate-400 text-center py-12">Carregando insights…</p>
                            )}
                            {!loading && visible.length === 0 && (
                                <div className="text-center py-12">
                                    <Lightbulb size={32} className="mx-auto text-slate-300" />
                                    <p className="mt-3 text-sm text-slate-500 font-medium">Nenhum insight ativo</p>
                                    <p className="mt-1 text-xs text-slate-400">
                                        Rode a skill <code className="bg-slate-100 px-1 rounded">gaas-insight-engine</code> para gerar novos insights.
                                    </p>
                                </div>
                            )}
                            {visible.map((insight) => (
                                <InsightCard key={insight.id} insight={insight} onUpdateStatus={handleUpdateStatus} />
                            ))}
                        </div>

                        <div className="bg-white border-t border-slate-200 px-5 py-3">
                            <p className="text-[11px] text-slate-400">
                                Gerado pelo GaaS Insight Engine · narrativa Sinal → Impacto → Causa → Ação · execução manual da skill
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
