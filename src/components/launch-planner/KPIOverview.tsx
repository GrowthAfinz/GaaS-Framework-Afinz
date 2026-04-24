import React, { useMemo } from 'react';
import { Activity } from '../../types/framework';
import { Info } from 'lucide-react';

import { B2CDataRow } from '../../types/b2c';
import { useAppStore } from '../../store/useAppStore';
import { useBU } from '../../contexts/BUContext';

interface KPIOverviewProps {
    activities: Activity[];
    previousActivities?: Activity[];
    b2cData?: B2CDataRow[];
}

export const KPIOverview: React.FC<KPIOverviewProps> = ({ activities, previousActivities = [], b2cData = [] }) => {
    const { viewSettings } = useAppStore();
    const { selectedBUs } = useBU();
    const perspective = viewSettings.perspective;

    const showB2C = perspective === 'total' || perspective === 'b2c';
    const showCRM = perspective === 'total' || perspective === 'crm';
    const isOnlySeguros = selectedBUs.length === 1 && selectedBUs[0] === 'Seguros';

    const calculateMetrics = (acts: Activity[], b2c: B2CDataRow[] = []) => {
        let baseEnviada = showCRM ? acts.reduce((sum, a) => sum + (a.kpis?.baseEnviada || 0), 0) : 0;
        let baseEntregue = showCRM ? acts.reduce((sum, a) => sum + (a.kpis?.baseEntregue || 0), 0) : 0;
        let propostas = showCRM ? acts.reduce((sum, a) => sum + (a.kpis?.propostas || 0), 0) : 0;
        let aprovados = showCRM ? acts.reduce((sum, a) => sum + (a.kpis?.aprovados || 0), 0) : 0;
        let emissoes = showCRM ? acts.reduce((sum, a) => sum + (a.kpis?.emissoes || 0), 0) : 0;
        let custoTotal = showCRM ? acts.reduce((sum, a) => sum + (a.kpis?.custoTotal || 0), 0) : 0;
        let cartoes = showCRM ? acts.reduce((sum, a) => sum + (a.kpis?.cartoes || 0), 0) : 0;

        const hasGranularFilters = viewSettings.filtrosGlobais.segmentos.length > 0 ||
            viewSettings.filtrosGlobais.parceiros.length > 0 ||
            viewSettings.filtrosGlobais.jornadas.length > 0 ||
            viewSettings.filtrosGlobais.canais.length > 0;

        if (showB2C && b2c.length > 0 && !hasGranularFilters && !isOnlySeguros) {
            const b2cPropostas = b2c.reduce((sum, d) => sum + (Number(d.propostas_b2c_total) || 0), 0);
            const b2cEmissoes = b2c.reduce((sum, d) => sum + (Number(d.emissoes_b2c_total) || 0), 0);

            propostas += b2cPropostas;
            emissoes += b2cEmissoes;
            cartoes += b2cEmissoes;
            aprovados += b2cEmissoes;
        }

        const taxaEntrega = baseEnviada > 0 ? (baseEntregue / baseEnviada) * 100 : 0;
        const taxaPropostas = baseEntregue > 0 ? (propostas / baseEntregue) * 100 : 0;
        const taxaAprovacao = propostas > 0 ? (aprovados / propostas) * 100 : 0;
        const taxaEmissao = propostas > 0 ? (emissoes / propostas) * 100 : 0;
        const cac = cartoes > 0 ? custoTotal / cartoes : 0;
        const convBase = baseEnviada > 0 ? (cartoes / baseEnviada) * 100 : 0;

        return {
            baseEnviada,
            baseEntregue,
            taxaEntrega,
            propostas,
            taxaPropostas,
            aprovados,
            taxaAprovacao,
            emissoes,
            taxaEmissao,
            convBase,
            cac,
            custoTotal
        };
    };

    const currentMetrics = useMemo(() => calculateMetrics(activities, b2cData), [activities, b2cData, perspective, viewSettings.filtrosGlobais, isOnlySeguros]);
    const previousMetrics = useMemo(() => calculateMetrics(previousActivities, []), [previousActivities, perspective, viewSettings.filtrosGlobais, isOnlySeguros]);

    const getVariation = (current: number, previous: number) => {
        if (previous === 0) return 0;
        return ((current - previous) / previous) * 100;
    };

    const variations = {
        baseEnviada: getVariation(currentMetrics.baseEnviada, previousMetrics.baseEnviada),
        baseEntregue: getVariation(currentMetrics.baseEntregue, previousMetrics.baseEntregue),
        taxaEntrega: getVariation(currentMetrics.taxaEntrega, previousMetrics.taxaEntrega),
        propostas: getVariation(currentMetrics.propostas, previousMetrics.propostas),
        taxaPropostas: getVariation(currentMetrics.taxaPropostas, previousMetrics.taxaPropostas),
        aprovados: getVariation(currentMetrics.aprovados, previousMetrics.aprovados),
        taxaAprovacao: getVariation(currentMetrics.taxaAprovacao, previousMetrics.taxaAprovacao),
        emissoes: getVariation(currentMetrics.emissoes, previousMetrics.emissoes),
        taxaEmissao: getVariation(currentMetrics.taxaEmissao, previousMetrics.taxaEmissao),
        convBase: getVariation(currentMetrics.convBase, previousMetrics.convBase),
        cac: getVariation(currentMetrics.cac, previousMetrics.cac),
        custoTotal: getVariation(currentMetrics.custoTotal, previousMetrics.custoTotal)
    };

    const KPICard = ({ label, value, variation, prefix = '', suffix = '', isCurrency = false, highlight = false, decimals = 1 }: any) => (
        <div className={`
            relative rounded-lg p-2 flex flex-col justify-between min-h-[55px] transition-all group
            ${highlight
                ? 'bg-cyan-50 border border-cyan-200'
                : 'bg-white border border-slate-200 hover:border-slate-300'
            }
        `}>
            <div className="flex items-center justify-between mb-0.5">
                <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                    {label}
                    <Info size={12} className="cursor-help text-slate-400 hover:text-cyan-600 transition-colors" strokeWidth={2.5} />
                </div>
                {variation !== undefined && variation !== 0 && (
                    <span className={`text-[9px] font-bold ${variation > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {variation > 0 ? '?' : '?'} {Math.abs(variation).toFixed(1)}%
                    </span>
                )}
            </div>

            <div className="flex flex-col">
                <span className={`text-base font-bold leading-none ${highlight ? 'text-cyan-800' : 'text-slate-800'}`}>
                    {prefix}
                    {isCurrency
                        ? new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)
                        : new Intl.NumberFormat('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value)
                    }
                    {suffix}
                </span>

                {suffix === '%' && (
                    <div className="w-full h-0.5 bg-slate-200 rounded-full overflow-hidden mt-1">
                        <div
                            className={`h-full rounded-full ${highlight ? 'bg-cyan-500' : 'bg-slate-400'}`}
                            style={{ width: `${Math.min(value, 100)}%` }}
                        />
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="grid grid-cols-6 gap-2 mb-2">
            <KPICard label="Base Enviada" value={currentMetrics.baseEnviada} variation={variations.baseEnviada} decimals={0} />
            <KPICard label="Base Entregue" value={currentMetrics.baseEntregue} variation={variations.baseEntregue} decimals={0} />
            <KPICard label="% Entrega" value={currentMetrics.taxaEntrega} suffix="%" variation={variations.taxaEntrega} />
            <KPICard label="Propostas" value={currentMetrics.propostas} variation={variations.propostas} decimals={0} />
            <KPICard label="% Propostas" value={currentMetrics.taxaPropostas} suffix="%" variation={variations.taxaPropostas} />
            <KPICard label="Aprovados" value={currentMetrics.aprovados} variation={variations.aprovados} decimals={0} />

            <KPICard label="% Aprovados" value={currentMetrics.taxaAprovacao} suffix="%" variation={variations.taxaAprovacao} />
            <KPICard label="Emissoes" value={currentMetrics.emissoes} variation={variations.emissoes} decimals={0} />
            <KPICard label="% Finalizacao" value={currentMetrics.taxaEmissao} suffix="%" variation={variations.taxaEmissao} />

            <KPICard
                label="% Conv. Base"
                value={currentMetrics.convBase}
                suffix="%"
                variation={variations.convBase}
                highlight={true}
                decimals={3}
            />

            <KPICard label="CAC" value={currentMetrics.cac} prefix="R$ " isCurrency variation={variations.cac} />
            <KPICard label="Custo Total" value={currentMetrics.custoTotal} prefix="R$ " isCurrency variation={variations.custoTotal} />
        </div>
    );
};
