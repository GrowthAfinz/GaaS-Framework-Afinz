import React from 'react';
import { MetricsSummary } from '../../types/b2c';
import { FileText, TrendingUp, BarChart2, CheckCircle2, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { Tooltip } from '../Tooltip';

interface OriginacaoKPIsComparisonProps {
    summary: MetricsSummary;
    previousSummary: MetricsSummary | null;
}

const KPICard = ({ label, value, subtitle, icon, colorClass, variation, reverseColor = false, tooltip }: {
    label: string,
    value: string,
    subtitle: string,
    icon: React.ReactNode,
    colorClass: string,
    variation?: { value: number, isPositive: boolean } | null,
    reverseColor?: boolean,
    tooltip?: string
}) => {
    // Determine variation color
    let variationColor = 'text-slate-500';
    let ArrowIcon = Minus;

    if (variation) {
        if (variation.value > 0) {
            ArrowIcon = ArrowUp;
            variationColor = reverseColor ? 'text-red-400' : 'text-emerald-400';
        } else if (variation.value < 0) {
            ArrowIcon = ArrowDown;
            variationColor = reverseColor ? 'text-emerald-400' : 'text-red-400';
        }
    }

    return (
        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">{label}</p>
                    {tooltip && (
                        <Tooltip content={tooltip} side="top" />
                    )}
                </div>
                <div className={`${colorClass} opacity-80`}>
                    {icon}
                </div>
            </div>

            <div className="flex items-end gap-2">
                <h3 className="text-xl font-bold text-white leading-none">
                    {value}
                </h3>
                {variation && (
                    <div className={`flex items-center text-[10px] font-bold mb-0.5 ${variationColor} bg-slate-900/50 px-1 py-0.5 rounded`}>
                        <ArrowIcon size={10} className="mr-0.5" />
                        {Math.abs(variation.value).toFixed(1)}%
                    </div>
                )}
            </div>

            <p className="text-[10px] text-slate-500 mt-2 lowercase">{subtitle}</p>
        </div>
    );
};

export const OriginacaoKPIsComparison: React.FC<OriginacaoKPIsComparisonProps> = ({ summary, previousSummary }) => {

    const calculateVariation = (current: number, previous: number) => {
        if (!previous || previous === 0) return null;
        const diff = current - previous;
        return {
            value: (diff / previous) * 100,
            isPositive: diff > 0
        };
    };

    // Calculate Variations
    const varPropostasB2C = previousSummary ? calculateVariation(summary.propostas_b2c_total, previousSummary.propostas_b2c_total) : null;
    const varEmissoesB2C = previousSummary ? calculateVariation(summary.emissoes_b2c_total, previousSummary.emissoes_b2c_total) : null;
    const varConvB2C = previousSummary ? calculateVariation(summary.taxa_conversao_b2c_media, previousSummary.taxa_conversao_b2c_media) : null;

    const varPropostasCRM = previousSummary ? calculateVariation(summary.propostas_crm_total, previousSummary.propostas_crm_total) : null;
    const varEmissoesCRM = previousSummary ? calculateVariation(summary.emissoes_crm_total, previousSummary.emissoes_crm_total) : null;
    const varConvCRM = previousSummary ? calculateVariation(summary.taxa_conversao_crm_media, previousSummary.taxa_conversao_crm_media) : null;


    return (
        <div className="space-y-4 mb-8">
            {/* ROW 1: B2C */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <KPICard
                    label="Propostas B2C"
                    value={summary.propostas_b2c_total.toLocaleString('pt-BR')}
                    subtitle="Input total"
                    icon={<FileText size={18} />}
                    colorClass="text-blue-400"
                    variation={varPropostasB2C}
                    tooltip="Total de propostas B2C submetidas no período"
                />
                <KPICard
                    label="Cartões B2C"
                    value={summary.emissoes_b2c_total.toLocaleString('pt-BR')}
                    subtitle="Gerados"
                    icon={<BarChart2 size={18} />}
                    colorClass="text-blue-400"
                    variation={varEmissoesB2C}
                    tooltip="Total de cartões B2C gerados no período"
                />
                <KPICard
                    label="Conv % B2C"
                    value={`${summary.taxa_conversao_b2c_media.toFixed(2).replace('.', ',')}%`}
                    subtitle="Cartões / Propostas"
                    icon={<TrendingUp size={18} />}
                    colorClass="text-blue-400"
                    variation={varConvB2C}
                    tooltip="Taxa de conversão: (Cartões Gerados / Propostas Totais)"
                />
            </div>

            {/* ROW 2: CRM */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <KPICard
                    label="Propostas CRM"
                    value={summary.propostas_crm_total.toLocaleString('pt-BR')}
                    subtitle="Via CRM"
                    icon={<FileText size={18} />}
                    colorClass="text-emerald-400"
                    variation={varPropostasCRM}
                    tooltip="Propostas identificadas com origem CRM"
                />
                <KPICard
                    label="Cartões CRM"
                    value={summary.emissoes_crm_total.toLocaleString('pt-BR')}
                    subtitle="Gerados"
                    icon={<CheckCircle2 size={18} />}
                    colorClass="text-emerald-400"
                    variation={varEmissoesCRM}
                    tooltip="Cartões gerados e atribuídos ao CRM"
                />
                <KPICard
                    label="Conv % CRM"
                    value={`${summary.taxa_conversao_crm_media.toFixed(2).replace('.', ',')}%`}
                    subtitle="Conversão CRM"
                    icon={<TrendingUp size={18} />}
                    colorClass="text-emerald-400"
                    variation={varConvCRM}
                    tooltip="Taxa de conversão: (Cartões Gerados / Base Entregue)"
                />
            </div>
        </div>
    );
};
