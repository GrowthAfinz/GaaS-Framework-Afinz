import React from 'react';
import { calculateProjection } from '../utils/projectionEngine';
import type { ProjectionResult } from '../utils/projectionEngine';
import type { DailyMetrics } from '../types';
import { TrendingUp, TrendingDown, Minus, CheckCircle, AlertTriangle, AlertOctagon, Activity } from 'lucide-react';
import { useTargets } from '../hooks/useTargets';

interface ProjectionBoxProps {
    data: DailyMetrics[];
}

interface ProjectionItemProps {
    result: ProjectionResult;
    label: string;
    isCurrency?: boolean;
    targetValue?: number;
    inverse?: boolean; // True if lower is better (e.g. CPA)
}

const ProjectionItem: React.FC<ProjectionItemProps> = ({ result, label, isCurrency, targetValue, inverse = false }) => {
    const format = (v: number) => isCurrency
        ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 }).format(v)
        : new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(v);

    // Trend Logic
    let Icon = Minus;
    let trendColor = 'text-slate-500';
    let term = 'Estável';

    if (result.trend === 'up') {
        Icon = TrendingUp;
        trendColor = inverse ? 'text-red-500' : 'text-green-500'; // CPA Up = Bad
        term = 'Ritmo Acelerado';
    }
    if (result.trend === 'down') {
        Icon = TrendingDown;
        trendColor = inverse ? 'text-green-500' : 'text-red-500'; // CPA Down = Good
        term = 'Ritmo em Queda';
    }

    // Goal Status Logic
    let statusNode = null;
    let statusColor = 'text-slate-400';

    // Calculate Pct
    const progress = targetValue ? (result.projected / targetValue) * 100 : 0;

    if (targetValue && targetValue > 0) {
        let statusLabel = '';
        let StatusIcon = CheckCircle;

        if (inverse) {
            // Lower is better (CPA)
            if (result.projected <= targetValue) {
                statusColor = 'text-green-600 bg-green-50 border-green-200';
                StatusIcon = CheckCircle;
                statusLabel = 'Dentro da Meta';
            } else {
                statusColor = 'text-red-600 bg-red-50 border-red-200';
                StatusIcon = AlertTriangle;
                statusLabel = 'Acima da Meta';
            }
        } else {
            // Higher is better (Conversions) OR Spend adherence
            if (label === 'Investimento') {
                // For Spend, we want to be close to 100% but not over.
                if (result.projected > targetValue * 1.1) {
                    statusColor = 'text-red-600 bg-red-50 border-red-200';
                    StatusIcon = AlertTriangle;
                    statusLabel = 'Estouro Previsto';
                } else if (result.projected < targetValue * 0.9) {
                    statusColor = 'text-yellow-600 bg-yellow-50 border-yellow-200';
                    StatusIcon = AlertTriangle;
                    statusLabel = 'Subutilizado';
                } else {
                    statusColor = 'text-green-600 bg-green-50 border-green-200';
                    StatusIcon = CheckCircle;
                    statusLabel = 'No Caminho Ideal';
                }
            } else {
                // Conversions
                if (result.projected >= targetValue) {
                    statusColor = 'text-green-600 bg-green-50 border-green-200';
                    StatusIcon = CheckCircle;
                    statusLabel = 'Meta Alcançável';
                } else {
                    statusColor = 'text-red-600 bg-red-50 border-red-200';
                    StatusIcon = AlertOctagon;
                    statusLabel = 'Risco de Falha';
                }
            }
        }

        statusNode = (
            <div className={`flex items-center gap-1.5 text-xs font-bold mt-3 px-2 py-1.5 rounded-md border ${statusColor}`}>
                <StatusIcon size={14} />
                <span>{statusLabel}</span>
                <span className="opacity-60 font-normal ml-auto text-xs">{progress.toFixed(0)}%</span>
            </div>
        );
    } else {
        // No target set
        statusNode = (
            <div className={`flex items-center gap-1.5 text-xs font-medium mt-3 px-2 py-1.5 rounded-md border border-slate-100 bg-slate-50 text-slate-400`}>
                <Activity size={14} />
                <span>Sem meta definida</span>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl p-5 border border-slate-100 flex flex-col shadow-sm hover:shadow-md transition-shadow">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">{label}</span>
            <div className="flex flex-col">
                <div className="text-3xl font-extrabold text-slate-800 tracking-tight" title="Valor Realizado (Atual)">
                    {format(result.current)}
                </div>
                <div className="flex items-center gap-1.5 mt-1 text-sm font-medium text-slate-500">
                    <span className="opacity-70">Projeção:</span>
                    <span className="text-slate-700 font-bold">{format(result.projected)}</span>
                </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-50">
                <div className="flex items-center justify-between text-xs">
                    <div className={`flex items-center gap-1 ${trendColor} font-bold`}>
                        <Icon className="w-4 h-4" />
                        <span>{term}</span>
                    </div>
                    <span className="text-slate-400 font-medium">{result.confidence}% confiança</span>
                </div>
                {statusNode}
            </div>
        </div>
    );
};

export const ProjectionBox: React.FC<ProjectionBoxProps> = ({ data }) => {
    const now = new Date();
    const { targets } = useTargets();

    // Helper to find target
    const getTarget = (metric: string) => targets.find(t => t.metric === metric)?.value;

    // Calculate Projections
    // Engine now uses Smart Pace (Avg of last 7 Days)
    const spendProj = calculateProjection(data, 'spend', now);
    const convProj = calculateProjection(data, 'conversions', now);

    // CPA Projection derived
    // CPA = Spend / Conversions
    const currentCPA = convProj.current > 0 ? spendProj.current / convProj.current : 0;
    const projectedCPA = convProj.projected > 0 ? spendProj.projected / convProj.projected : 0;

    // CPA Trend logic (Compare Project CPA vs Current CPA to see if getting efficient)
    const trendCPA = projectedCPA < currentCPA ? 'down' : projectedCPA > currentCPA ? 'up' : 'stable';
    const confCPA = Math.round((spendProj.confidence + convProj.confidence) / 2);

    const cpaResult: ProjectionResult = {
        metric: 'cpa',
        current: currentCPA,
        projected: projectedCPA,
        trend: trendCPA,
        confidence: confCPA,
        remainingDays: spendProj.remainingDays,
        pace: 0 // Not needed for display
    };

    const daysPassed = now.getDate();
    const daysTotal = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysRemaining = daysTotal - daysPassed;

    return (
        <div className="bg-gradient-to-br from-slate-50 to-white rounded-xl border border-slate-200/60 p-1 mb-8">
            <div className="px-5 py-3 flex justify-between items-center">
                <h3 className="text-base font-bold text-slate-700 flex items-center gap-2">
                    Projeção para o final do mês
                </h3>
                <div className="text-xs font-semibold text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-100 shadow-sm">
                    {daysRemaining} dias restantes
                </div>
            </div>

            <div className="p-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                <ProjectionItem
                    result={spendProj}
                    label="Investimento"
                    isCurrency
                    targetValue={getTarget('investimento')}
                />
                <ProjectionItem
                    result={convProj}
                    label="Conversões"
                    targetValue={getTarget('conversoes')}
                />
                <ProjectionItem
                    result={cpaResult}
                    label="CPA Médio"
                    isCurrency
                    targetValue={getTarget('cpa')}
                    inverse // Lower is better
                />
            </div>

            <div className="px-6 py-2 text-[10px] text-center text-slate-400 font-medium">
                *Projeção baseada na média móvel dos últimos 7 dias.
            </div>
        </div>
    );
};
