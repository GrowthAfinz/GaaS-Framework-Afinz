import React from 'react';
import { TrendingUp, Sparkles } from 'lucide-react';
import { useDispatchForm } from '../context/DispatchFormContext';
import { MetricCard } from './shared';

/**
 * Bloco 5: Painel de Projecao IA
 * Exibe 9 metricas projetadas:
 * 1. Volume
 * 2. Taxa Conversao
 * 3. Base Acionavel
 * 4. CAC
 * 5. Taxa Entrega
 * 6. Taxa Abertura
 * 7. Propostas
 * 8. Aprovados
 * 9. Cartoes Gerados
 *
 * Largura: 280px
 */
export const AIProjectionBlock: React.FC = () => {
    const { projections, formData, projectionReadiness } = useDispatchForm();

    /**
     * Gera mensagem de feedback baseada em readiness e campos faltantes
     * Mostra quais campos críticos estão faltando ou qual o nível de confiança
     */
    const getReadinessMessage = () => {
        // Identificar campos críticos faltantes
        const missing: string[] = [];
        if (!formData.bu) missing.push('BU');
        if (!formData.segmento) missing.push('Campanha');
        if (!formData.canal) missing.push('Canal');
        if (!formData.baseVolume || Number(formData.baseVolume) === 0) missing.push('Volume');

        // Se faltam campos críticos, mostrar mensagem em vermelho/amarelo
        if (missing.length > 0) {
            return {
                text: `Preencha ${missing.join(', ')} para gerar projeções`,
                color: 'text-amber-600',
                bgColor: 'bg-amber-50',
                borderColor: 'border-amber-500/20',
                isWarning: true
            };
        }

        // Campos críticos OK - mostrar status baseado em readiness
        switch (projectionReadiness) {
            case 'partial':
                return {
                    text: 'Projeções básicas. Adicione Oferta e Jornada para melhorar',
                    color: 'text-blue-600',
                    bgColor: 'bg-blue-50',
                    borderColor: 'border-blue-500/20',
                    isWarning: false
                };
            case 'good':
                return {
                    text: 'Projeções com boa confiança',
                    color: 'text-emerald-600',
                    bgColor: 'bg-emerald-50',
                    borderColor: 'border-emerald-500/20',
                    isWarning: false
                };
            case 'excellent':
                return {
                    text: 'Projeções de alta precisão',
                    color: 'text-emerald-600',
                    bgColor: 'bg-emerald-50',
                    borderColor: 'border-emerald-500/20',
                    isWarning: false
                };
            default:
                return null;
        }
    };

    const readinessMessage = getReadinessMessage();

    // Extrair projeções tipadas
    const volumeProj = projections['volume'] as any;
    const taxaConvProj = projections['taxaConversao'] as any;
    const baseAcionProj = projections['baseAcionavel'] as any;
    const cacProj = projections['cac'] as any;
    const propostasProj = projections['propostas'] as any;
    const aprovadosProj = projections['aprovados'] as any;
    const cartoesProj = projections['cartoesGerados'] as any;
    const taxaEntProj = projections['taxaEntrega'] as any;
    const taxaAbertProj = projections['taxaAbertura'] as any;

    // Calculo de metricas derivadas
    const volumeValue = volumeProj?.projectedValue || Number(formData.baseVolume) || 0;
    const taxaConv = taxaConvProj?.projectedValue || 0;
    const baseAcionavel = baseAcionProj?.projectedValue || (volumeValue * 0.78);

    // Calculos de funil
    const propostas = propostasProj?.projectedValue || (volumeValue * (taxaConv / 100));
    const aprovados = aprovadosProj?.projectedValue || (propostas * 0.65);
    const cartoes = cartoesProj?.projectedValue || (aprovados * 0.85);

    // CAC
    const custoTotal = Number(formData.custoTotalCampanha) || 0;
    const cacCalculado = cartoes > 0 ? custoTotal / cartoes : 0;
    const cacValue = cacProj?.projectedValue || cacCalculado;

    // Sample size - usar explanation.sampleSize se existir
    const sampleSize = taxaConvProj?.explanation?.sampleSize || 0;

    return (
        <div className="w-full h-full">
            <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-500/20 shadow-sm flex flex-col h-full hover:border-indigo-500/40 transition-colors">
                {/* Header */}
                <div className="flex items-center justify-between pb-2 border-b border-indigo-500/20 mb-3">
                    <h3 className="text-[10px] font-bold text-indigo-600 flex items-center gap-1.5 uppercase tracking-wide">
                        <TrendingUp size={14} />
                        Projecao IA
                        <Sparkles size={10} className="text-indigo-400/50" />
                    </h3>
                    <span className="px-1 py-0.5 bg-indigo-100 rounded text-[8px] text-indigo-600 font-bold">
                        5
                    </span>
                </div>

                {/* Grid de Metricas - 3x3 */}
                <div className="grid grid-cols-3 gap-1.5 flex-1">
                    {/* Linha 1: Volume, Taxa Conv, Base Acionavel */}
                    <MetricCard
                        label="Volume"
                        value={volumeValue > 0 ? volumeValue : undefined}
                        isInt
                        confidence={volumeProj?.confidence}
                        compact
                    />
                    <MetricCard
                        label="Tx Conv"
                        value={taxaConv > 0 ? taxaConv : undefined}
                        suffix="%"
                        confidence={taxaConvProj?.confidence}
                        compact
                    />
                    <MetricCard
                        label="Bs Acion."
                        value={baseAcionavel > 0 ? baseAcionavel : undefined}
                        isInt
                        confidence={baseAcionProj?.confidence}
                        compact
                    />

                    {/* Linha 2: CAC, Taxa Entrega, Taxa Abertura */}
                    <MetricCard
                        label="CAC"
                        value={cacValue > 0 ? cacValue : undefined}
                        prefix="R$"
                        confidence={cacProj?.confidence}
                        compact
                    />
                    <MetricCard
                        label="Tx Entreg"
                        value={taxaEntProj?.projectedValue}
                        suffix="%"
                        confidence={taxaEntProj?.confidence}
                        compact
                    />
                    <MetricCard
                        label="Tx Abert"
                        value={taxaAbertProj?.projectedValue}
                        suffix="%"
                        confidence={taxaAbertProj?.confidence}
                        compact
                    />

                    {/* Linha 3: Propostas, Aprovados, Cartoes */}
                    <MetricCard
                        label="Propostas"
                        value={propostas > 0 ? propostas : undefined}
                        isInt
                        confidence={propostasProj?.confidence}
                        compact
                    />
                    <MetricCard
                        label="Aprovados"
                        value={aprovados > 0 ? aprovados : undefined}
                        isInt
                        confidence={aprovadosProj?.confidence}
                        compact
                    />
                    <MetricCard
                        label="Cartoes"
                        value={cartoes > 0 ? cartoes : undefined}
                        isInt
                        confidence={cartoesProj?.confidence}
                        compact
                    />
                </div>

                {/* Footer - Sample Size ou Mensagem de Validação */}
                <div className="mt-3 text-[8px] text-center border-t border-indigo-500/10 pt-2">
                    {/* Se há erro de validação, mostrar em destaque */}
                    {readinessMessage?.isWarning ? (
                        <div className={`px-2 py-1 rounded ${readinessMessage.bgColor} border ${readinessMessage.borderColor}`}>
                            <span className={`${readinessMessage.color} font-bold`}>
                                ⚠️ {readinessMessage.text}
                            </span>
                        </div>
                    ) : (
                        <>
                            {/* Normal: mostrar sample size + readiness message */}
                            <div>
                                {sampleSize > 0 ? (
                                    <span className="text-indigo-500">
                                        Baseado em <span className="font-bold text-indigo-600">{sampleSize}</span> disparos similares
                                    </span>
                                ) : (
                                    <span className="text-indigo-500">Processando projeções...</span>
                                )}
                            </div>

                            {/* Mostrar status de readiness se houver */}
                            {readinessMessage && (
                                <div className={`mt-1.5 px-2 py-0.5 rounded ${readinessMessage.bgColor} border ${readinessMessage.borderColor}`}>
                                    <span className={`${readinessMessage.color} text-[7px] font-medium`}>
                                        📊 {readinessMessage.text}
                                    </span>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AIProjectionBlock;
