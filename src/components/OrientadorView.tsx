import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useRecommendationEngine } from '../hooks/useRecommendationEngine';
import { useBU } from '../contexts/BUContext';
import { RecommendationCard } from './orientador/RecommendationCard';
import { HistoricoModal } from './orientador/HistoricoModal';
import { Recommendation } from '../types/recommendations';
import { Lightbulb, Filter, ArrowUpDown, Info } from 'lucide-react';
import { Tooltip } from './Tooltip';

import { usePeriod } from '../contexts/PeriodContext';
import { isWithinInterval } from 'date-fns';

type SortOption = 'score' | 'cac' | 'conversion' | 'volume' | 'recency';

export const OrientadorView: React.FC = () => {
    const { activities, viewSettings } = useAppStore();
    const { selectedBUs } = useBU();
    const { startDate, endDate } = usePeriod();

    // Filter activities by Date Range FIRST as requested
    const dateFilteredActivities = useMemo(() => {
        return activities.filter(act => {
            return isWithinInterval(act.dataDisparo, { start: startDate, end: endDate });
        });
    }, [activities, startDate, endDate]);

    const recommendations = useRecommendationEngine(dateFilteredActivities);
    const [selectedRec, setSelectedRec] = useState<Recommendation | null>(null);
    const [sortBy, setSortBy] = useState<SortOption>('score');

    // Calculate filtered activities count for the header (using the date-filtered set)
    const filteredActivitiesCount = useMemo(() => {
        const filters = viewSettings.filtrosGlobais;
        return dateFilteredActivities.filter(act => {
            // Use BU Context
            const matchesBU = selectedBUs.length === 0 || selectedBUs.includes(act.bu as any);

            const matchesCanal = filters.canais.length === 0 || filters.canais.includes(act.canal);
            const matchesSegmento = filters.segmentos.length === 0 || filters.segmentos.includes(act.segmento);
            const matchesJornada = filters.jornadas.length === 0 || filters.jornadas.includes(act.jornada);
            const matchesParceiro = filters.parceiros.length === 0 || filters.parceiros.includes(act.parceiro);
            return matchesBU && matchesCanal && matchesSegmento && matchesJornada && matchesParceiro;
        }).length;
    }, [dateFilteredActivities, viewSettings.filtrosGlobais, selectedBUs]);

    // Apply global filters and sorting
    const filteredRecommendations = useMemo(() => {
        const filters = viewSettings.filtrosGlobais;

        // 1. Filter
        const filtered = recommendations.filter(rec => {
            // BU Filter
            // Use the strict BU from the combo grouping to avoid leaks, checking against Context
            const matchesBU = selectedBUs.length === 0 || selectedBUs.includes(rec.combo.bu as any); // Cast as any if BU type mismatch, or strict check

            const matchesCanal = filters.canais.length === 0 || filters.canais.includes(rec.combo.canal);
            const matchesSegmento = filters.segmentos.length === 0 || filters.segmentos.includes(rec.combo.segmento);
            const matchesJornada = filters.jornadas.length === 0 || rec.sampleActivities.some(a => filters.jornadas.includes(a.jornada));
            const matchesParceiro = filters.parceiros.length === 0 || rec.sampleActivities.some(a => filters.parceiros.includes(a.parceiro));

            return matchesBU && matchesCanal && matchesSegmento && matchesJornada && matchesParceiro;
        });

        // 2. Sort
        return filtered.sort((a, b) => {
            switch (sortBy) {
                case 'score':
                    return b.score.finalScore - a.score.finalScore;
                case 'cac':
                    // Lower CAC is better, so ascending order. Handle 0/null as high value (bad)
                    const cacA = a.metrics.avgCAC > 0 ? a.metrics.avgCAC : 999999;
                    const cacB = b.metrics.avgCAC > 0 ? b.metrics.avgCAC : 999999;
                    return cacA - cacB;
                case 'conversion':
                    return b.metrics.avgConversion - a.metrics.avgConversion;
                case 'volume':
                    return b.metrics.totalVolume - a.metrics.totalVolume;
                case 'recency':
                    // More recent (larger timestamp) first
                    const dateA = a.metrics.lastExecuted?.getTime() || 0;
                    const dateB = b.metrics.lastExecuted?.getTime() || 0;
                    return dateB - dateA;
                default:
                    return 0;
            }
        });
    }, [recommendations, viewSettings.filtrosGlobais, sortBy, selectedBUs]);

    return (
        <div className="flex flex-col h-full bg-slate-50 p-6 overflow-hidden">
            <div className="flex items-center justify-between mb-6 shrink-0">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Lightbulb className="text-amber-400" />
                        Orientador Estratégico
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">
                        Recomendações baseadas no histórico de {filteredActivitiesCount} campanhas.
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    {/* Sorting Controls */}
                    <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-slate-200">
                        <span className="text-xs text-slate-500 px-2 flex items-center gap-1">
                            <ArrowUpDown size={12} /> Ordenar:
                        </span>
                        {([
                            {
                                id: 'score',
                                label: 'Score',
                                tooltip: (
                                    <div className="w-48">
                                        <p className="text-[10px] font-bold mb-2 border-b border-slate-600 pb-1">Cálculo do Score</p>
                                        <div className="space-y-1 text-[10px]">
                                            <div className="flex justify-between"><span>💰 CAC</span><span>40%</span></div>
                                            <div className="flex justify-between"><span>📈 Conversão</span><span>40%</span></div>
                                            <div className="flex justify-between"><span>📊 Volume</span><span>20%</span></div>
                                        </div>
                                        <p className="text-[9px] text-slate-400 mt-2 italic">Score 100 = melhor combinação do período (normalizado)</p>
                                    </div>
                                )
                            },
                            {
                                id: 'cac',
                                label: 'Menor CAC',
                                tooltip: (
                                    <div className="w-52">
                                        <p className="text-[10px] font-bold mb-1">Ordenar por Menor CAC</p>
                                        <p className="text-[10px] text-slate-400">Prioriza campanhas com menor custo por cartão emitido. Campanhas sem dados de CAC aparecem por último.</p>
                                    </div>
                                )
                            },
                            {
                                id: 'conversion',
                                label: 'Maior Conv.',
                                tooltip: (
                                    <div className="w-52">
                                        <p className="text-[10px] font-bold mb-1">Ordenar por Maior Conversão</p>
                                        <p className="text-[10px] text-slate-400">Ordena pelo maior % médio de conversão (cartões / propostas). Mais disparos no período = maior confiabilidade do número.</p>
                                    </div>
                                )
                            },
                            {
                                id: 'volume',
                                label: 'Volume',
                                tooltip: (
                                    <div className="w-52">
                                        <p className="text-[10px] font-bold mb-1">Ordenar por Volume</p>
                                        <p className="text-[10px] text-slate-400">Prioriza as campanhas com maior base enviada no período. Útil para focar nos canais e segmentos de maior escala.</p>
                                    </div>
                                )
                            },
                            {
                                id: 'recency',
                                label: 'Recente',
                                tooltip: (
                                    <div className="w-52">
                                        <p className="text-[10px] font-bold mb-1">Ordenar por Mais Recente</p>
                                        <p className="text-[10px] text-slate-400">Traz primeiro as campanhas disparadas mais recentemente. Ideal para retomar jornadas ativas com histórico fresco.</p>
                                    </div>
                                )
                            }
                        ] as const).map(opt => (
                            <button
                                key={opt.id}
                                onClick={() => setSortBy(opt.id as SortOption)}
                                className={`px-3 py-1 text-xs font-medium rounded transition flex items-center gap-1 ${sortBy === opt.id
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                                    }`}
                            >
                                {opt.label}
                                <Tooltip content={opt.tooltip} side="bottom">
                                    <Info size={12} className={sortBy === opt.id ? 'text-blue-200' : 'text-slate-400 hover:text-slate-600'} />
                                </Tooltip>
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500 bg-white px-3 py-1.5 rounded border border-slate-200">
                        <Filter size={12} />
                        Filtros Globais Ativos
                    </div>
                </div>
            </div>

            {filteredRecommendations.length === 0 ? (
                <div className="flex flex-col items-center justify-center flex-1 text-slate-500">
                    <Lightbulb size={48} className="mb-4 opacity-20" />
                    <p>Nenhuma recomendação encontrada com os filtros atuais.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto pb-4">
                    {filteredRecommendations.map(rec => (
                        <RecommendationCard
                            key={rec.id}
                            recommendation={rec}
                            onClick={() => setSelectedRec(rec)}
                        />
                    ))}
                </div>
            )}

            {selectedRec && (
                <HistoricoModal
                    recommendation={selectedRec}
                    onClose={() => setSelectedRec(null)}
                />
            )}
        </div>
    );
};
