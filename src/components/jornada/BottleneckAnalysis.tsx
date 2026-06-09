import React, { useMemo } from 'react';
import { AlertCircle, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { CalendarData } from '../../types/framework';
import { Tooltip } from '../Tooltip';
import { useBottleneckTrend } from '../../hooks/useBottleneckTrend';
import { useAppStore } from '../../store/useAppStore';
import { getBottleneckStages, FunnelMetricsExt } from '../../constants/funnelConfig';

interface BottleneckAnalysisProps {
    data: CalendarData;
    previousData?: CalendarData; // New prop for trend analysis
    selectedBU?: string;
    selectedCanais?: string[];
    selectedSegmentos?: string[];
    selectedParceiros?: string[];
}

interface StageData {
    name: string;
    value: number;
    prevValue: number;
    conversionRate: number;
    drop: number;
    isBottleneck: boolean;
    severity: 'critical' | 'warning' | 'ok';
    causes: string[];
    action: string;
    trend?: {
        value: number | null;
        direction: 'up' | 'down' | 'stable' | 'none';
    };
}

export const BottleneckAnalysis: React.FC<BottleneckAnalysisProps> = ({
    data,
    previousData,
    selectedBU,
    selectedCanais = [],
    selectedSegmentos = [],
    selectedParceiros = []
}) => {
    const { calcularTendencia } = useBottleneckTrend();
    const frente = useAppStore((s) => s.viewSettings.frente);

    const calculateMetrics = (dataset: CalendarData): FunnelMetricsExt => {
        const m: FunnelMetricsExt = {
            baseEnviada: 0,
            baseEntregue: 0,
            aberturas: 0,
            cliques: 0,
            propostas: 0,
            aprovados: 0,
            emissoes: 0,
        };

        Object.values(dataset).forEach((activities) => {
            activities.forEach((activity) => {
                if (selectedBU && activity.bu !== selectedBU) return;
                if (selectedCanais.length > 0 && !selectedCanais.includes(activity.canal)) return;
                if (selectedSegmentos.length > 0 && !selectedSegmentos.includes(activity.segmento)) return;
                if (selectedParceiros.length > 0 && !selectedParceiros.includes(activity.parceiro)) return;

                m.baseEnviada += activity.kpis.baseEnviada || 0;
                m.baseEntregue += activity.kpis.baseEntregue || 0;
                m.aberturas += activity.kpis.aberturas || 0;
                m.cliques += activity.kpis.cliques || 0;
                m.propostas += activity.kpis.propostas || 0;
                m.aprovados += activity.kpis.aprovados || 0;
                m.emissoes += activity.kpis.emissoes || 0;
            });
        });

        return m;
    };

    const analysis = useMemo(() => {
        const currentMetrics = calculateMetrics(data);
        const previousMetrics = previousData ? calculateMetrics(previousData) : null;

        const trends = calcularTendencia(currentMetrics, previousMetrics);
        const stagesDef = getBottleneckStages(frente);

        const result: StageData[] = stagesDef.map((stage) => {
            const prev = currentMetrics[stage.fromKey];
            const current = currentMetrics[stage.toKey];

            const conversionRate = prev > 0 ? (current / prev) * 100 : 0;
            const drop = prev - current;

            let severity: 'critical' | 'warning' | 'ok' = 'ok';
            if (conversionRate < 10) severity = 'critical';
            else if (conversionRate < 50) severity = 'warning';

            const trendData = trends.find(t => t.etapa === stage.name);

            return {
                name: stage.name,
                value: current,
                prevValue: prev,
                conversionRate,
                drop,
                isBottleneck: severity !== 'ok',
                severity,
                causes: stage.causes,
                action: stage.action,
                trend: trendData ? { value: trendData.tendencia, direction: trendData.direcao } : undefined
            };
        });

        return result;
    }, [data, previousData, frente, selectedBU, selectedCanais, selectedSegmentos, selectedParceiros]);

    // Find the biggest bottleneck
    const biggestBottleneck = useMemo(() => {
        const bottlenecks = analysis.filter(s => s.isBottleneck);
        if (bottlenecks.length === 0) return null;
        return bottlenecks.reduce((prev, curr) => prev.conversionRate < curr.conversionRate ? prev : curr);
    }, [analysis]);

    const renderTrend =(trend?: { value: number | null, direction: 'up' | 'down' | 'stable' | 'none' }) => {
        if (!trend || trend.value === null || trend.direction === 'none') return <span className="text-slate-500">-</span>;

        const { value, direction } = trend;
        if (direction === 'stable') return <span className="text-slate-500 flex items-center"><Minus size={14} className="mr-1" /> {Math.abs(value).toFixed(1)}%</span>;

        const isPositive = direction === 'up';
        const color = isPositive ? 'text-emerald-600' : 'text-red-600';
        const Icon = isPositive ? TrendingUp : TrendingDown;

        return (
            <span className={`${color} flex items-center`}>
                <Icon size={14} className="mr-1" />
                {Math.abs(value).toFixed(1)}%
            </span>
        );
    };

    return (
        <div className="bg-white border border-slate-200 rounded-lg p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <AlertCircle size={20} className="text-amber-600" />
                Análise de Gargalos
                <Tooltip content="Identifica a etapa do funil onde você mais perde volume. O maior gargalo é destacado com causas prováveis e ação. Cores: Verde (>50%), Amarelo (10-50%), Vermelho (<10%)." />
            </h2>

            {biggestBottleneck ? (
                <div className="mb-8 bg-white border border-red-200 rounded-lg overflow-hidden">
                    <div className="bg-red-50 px-4 py-2 border-b border-red-200 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-red-700 font-bold text-sm uppercase tracking-wider">Maior Gargalo Detectado</span>
                    </div>

                    <div className="p-6">
                        <div className="mb-6">
                            <h3 className="text-xl font-bold text-slate-900 mb-1">{biggestBottleneck.name}</h3>
                            <div className="flex items-center gap-6 text-sm">
                                <div className="flex flex-col">
                                    <span className="text-slate-500 text-xs">Taxa de Conversão</span>
                                    <span className="text-2xl font-bold text-red-600">{biggestBottleneck.conversionRate.toFixed(1)}%</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-slate-500 text-xs">Volume Perdido</span>
                                    <span className="text-2xl font-bold text-slate-900">{biggestBottleneck.drop.toLocaleString('pt-BR')}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-slate-500 text-xs">Tendência</span>
                                    <span className="text-lg font-bold text-slate-500 flex items-center">
                                        {renderTrend(biggestBottleneck.trend)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-slate-50 rounded p-4 border border-slate-200">
                                <h4 className="font-bold text-amber-600 text-sm mb-3 flex items-center gap-2">
                                    💡 Possíveis Causas
                                </h4>
                                <ul className="space-y-1">
                                    {biggestBottleneck.causes.map((cause, idx) => (
                                        <li key={idx} className="text-slate-700 text-sm flex items-start gap-2">
                                            <span className="text-slate-400 mt-1">•</span>
                                            {cause}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="bg-blue-50 rounded p-4 border border-blue-200">
                                <h4 className="font-bold text-blue-600 text-sm mb-3 flex items-center gap-2">
                                    🎯 Ação Sugerida
                                </h4>
                                <p className="text-slate-700 text-sm">
                                    {biggestBottleneck.action}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="mb-8 p-6 bg-emerald-50 border border-emerald-200 rounded-lg text-center">
                    <p className="text-emerald-600 font-medium">Nenhum gargalo crítico identificado. O funil está saudável!</p>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {analysis.map((stage, idx) => (
                    <div
                        key={idx}
                        className={`p-4 rounded-lg border-l-4 transition ${stage.severity === 'critical' ? 'border-red-500 bg-red-50' :
                            stage.severity === 'warning' ? 'border-yellow-500 bg-yellow-50' :
                                'border-green-500 bg-green-50'
                            }`}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-medium text-slate-500">{stage.name}</span>
                        </div>
                        <div className="text-xl font-bold text-slate-900 mb-1">
                            {stage.conversionRate.toFixed(1)}%
                        </div>
                        <div className="flex justify-between items-center">
                            <div className="text-xs text-red-600 flex items-center gap-1">
                                <TrendingDown size={12} />
                                -{stage.drop.toLocaleString('pt-BR')}
                            </div>
                            <div className="text-xs">
                                {renderTrend(stage.trend)}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
