import React from 'react';
import { useMediaCorrelation } from '../../hooks/useMediaCorrelation';
import { MediaKPIGrid } from './MediaKPIGrid';
import { EfficiencyHeatmap } from './EfficiencyHeatmap';
import { BarChart2, Info } from 'lucide-react';

export const MediaCorrelationCharts: React.FC = () => {
    const { data, stats } = useMediaCorrelation();

    if (data.length === 0) {
        return (
            <div className="flex flex-col gap-6 mt-12 mb-12 animate-fade-in-up">
                <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent w-full mb-4"></div>
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <BarChart2 className="text-purple-500" />
                            Análise de Influência de Mídia
                        </h3>
                    </div>
                </div>
                <div className="bg-slate-50 border border-slate-200 border-dashed rounded-xl p-8 text-center h-40 flex flex-col items-center justify-center">
                    <Info size={32} className="text-slate-400 mb-3" />
                    <p className="text-slate-500 font-medium">Nenhum dado encontrado.</p>
                    <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                        Verifique se escolheu um período com dados de "Mídia Paga" e "B2C".
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 mt-12 mb-12 animate-fade-in-up">
            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent w-full mb-4"></div>

            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <BarChart2 className="text-purple-500" />
                        Media Analytics
                    </h3>
                    <p className="text-slate-500 text-sm mt-1">
                        Acompanhamento de ROI (CPA Efetivo) e eficiência de canais (Meta vs Google) com correção temporal (Lag).
                    </p>
                </div>
            </div>

            {/* 1. KPIs Grid (Cards) */}
            <MediaKPIGrid stats={stats} data={data} />

            {/* 2. Heatmap Table */}
            <EfficiencyHeatmap />
        </div>
    );
};
