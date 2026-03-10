import React from 'react';
import { DollarSign } from 'lucide-react';
import { useDispatchForm } from '../context/DispatchFormContext';
import { SectionCard, Label, Input } from './shared';

/**
 * Bloco 4: Investimento
 * Campos: Volume, C.U. Oferta, C.U. Canal, Total Campanha
 * Largura: 200px
 *
 * SIMPLIFICADO: Removidos Total Oferta e Total Canal (eram redundantes)
 * Total Campanha agora e discreto (sem verde chamativo)
 */
export const InvestmentBlock: React.FC = () => {
    const { formData, handleChange, projections } = useDispatchForm();

    // Formatar moeda
    const formatCurrency = (value: string | number): string => {
        const num = Number(value) || 0;
        return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    return (
        <div className="w-full h-full">
            <SectionCard
                title="Investimento"
                icon={<DollarSign size={14} />}
                badge="4"
            >
                <div className="space-y-2.5">
                    {/* Volume da Base */}
                    <div>
                        <Label label="Volume Base" required tooltip="Quantidade total de contatos que receberão o disparo" />
                        <Input
                            type="number"
                            value={formData.baseVolume}
                            onChange={(e) => handleChange('baseVolume', e.target.value)}
                            placeholder="Ex: 50000"
                            className="text-base font-semibold text-slate-900"
                        />
                    </div>

                    {/* Custos Unitarios */}
                    <div className="grid grid-cols-2 gap-1.5">
                        <div>
                            <Label label="C.U. Oferta" tooltip="Custo Unitário por contato da Oferta selecionada. Ex: Vibe=R$2,00, Limite=R$1,00, Padrão=R$0,00, Anuidade=R$76,50. Preenchido auto baseado na Oferta." />
                            <Input
                                type="number"
                                step="0.01"
                                value={formData.custoUnitarioOferta}
                                onChange={(e) => handleChange('custoUnitarioOferta', e.target.value)}
                                className="bg-slate-50 text-[10px]"
                                placeholder="0.00"
                            />
                        </div>
                        <div>
                            <Label label="C.U. Canal" tooltip="Custo Unitário por disparo do Canal. E-mail/Push=R$0,001, SMS=R$0,064, WhatsApp=R$0,420. Preenchido automaticamente." />
                            <Input
                                type="number"
                                step="0.001"
                                value={formData.custoUnitarioCanal}
                                onChange={(e) => handleChange('custoUnitarioCanal', e.target.value)}
                                className="bg-slate-50 text-[10px] text-slate-500"
                                placeholder="auto"
                                readOnly
                            />
                        </div>
                    </div>

                    {/* Custo Total Campanha - DISCRETO (sem verde) */}
                    <div className="mt-auto pt-3 space-y-2">
                        <div className="p-3 bg-white border border-slate-200 rounded-lg text-center relative group">
                            <div className="flex items-center justify-center gap-1 mb-0.5">
                                <span className="text-[8px] uppercase text-slate-500 font-bold">
                                    Total Campanha
                                </span>
                                <span title="Fórmula: Volume × (C.U. Oferta + C.U. Canal). Representa o investimento total do disparo." className="text-slate-400 hover:text-slate-600 cursor-help transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                                </span>
                            </div>
                            <span className="text-base font-bold text-slate-900 block">
                                R$ {formatCurrency(formData.custoTotalCampanha)}
                            </span>
                            {/* Breakdown em hover */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 border border-slate-200 rounded text-[9px] text-slate-100 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                                {formData.baseVolume} × ({formData.custoUnitarioOferta || 0} + {formData.custoUnitarioCanal || 0})
                            </div>
                        </div>

                        {/* CAC Projetado - IA */}
                        <div className="p-3 bg-indigo-50 border border-indigo-500/20 rounded-lg text-center">
                            <div className="flex items-center justify-center gap-1 mb-0.5">
                                <span className="text-[8px] uppercase text-indigo-600 font-bold">
                                    CAC Projetado (IA)
                                </span>
                            </div>
                            <span className="text-base font-bold text-indigo-700 block">
                                R$ {formatCurrency(projections['cac']?.projectedValue || 0)}
                            </span>
                            <span className="text-[8px] text-indigo-500">
                                Confiança: {Math.round(projections['cac']?.confidence || 0)}%
                            </span>
                        </div>
                    </div>
                </div>
            </SectionCard>
        </div>
    );
};

export default InvestmentBlock;
