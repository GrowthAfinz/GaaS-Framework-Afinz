import React, { useMemo } from 'react';
import { Package } from 'lucide-react';
import { useDispatchForm } from '../context/DispatchFormContext';
import { PRODUTOS, ETAPAS_AQUISICAO } from '../../../constants/frameworkFields';
import { SectionCard, Label, Combobox, ComboboxOption } from './shared';

/**
 * Bloco 3: Produto & Oferta
 * Campos: Produto, Perfil Credito, Etapa do Funil, Oferta, Promocional, Oferta2, Promocional2
 * Largura: 200px
 *
 * PILAR: Automatizacao por Historico
 * - TODOS os campos usam Combobox editavel com sugestoes
 * - Usuario pode digitar livremente OU selecionar sugestao
 * - Sugestoes ordenadas por frequencia de uso
 */
export const ProductOfferBlock: React.FC = () => {
    const { formData, handleChange, errors, smartOptions } = useDispatchForm();

    // Converter arrays fixos para formato ComboboxOption
    const produtosOptions = useMemo<ComboboxOption[]>(() => {
        if (smartOptions.produtos.length > 0) {
            return smartOptions.produtos;
        }
        return PRODUTOS.map(p => ({ value: p, count: 0 }));
    }, [smartOptions.produtos]);

    const etapasOptions = useMemo<ComboboxOption[]>(() => {
        if (smartOptions.etapasAquisicao.length > 0) {
            return smartOptions.etapasAquisicao;
        }
        return ETAPAS_AQUISICAO.map(e => ({ value: e, count: 0 }));
    }, [smartOptions.etapasAquisicao]);

    // Adicionar "N/A" como fallback se não houver opções
    const promocionaisOptions = useMemo<ComboboxOption[]>(() => {
        if (smartOptions.promocionais.length > 0) {
            return smartOptions.promocionais;
        }
        return [{ value: 'N/A', count: 0 }];
    }, [smartOptions.promocionais]);

    const ofertas2Options = useMemo<ComboboxOption[]>(() => {
        if (smartOptions.ofertas2.length > 0) {
            return smartOptions.ofertas2;
        }
        return [{ value: 'N/A', count: 0 }];
    }, [smartOptions.ofertas2]);

    const promocionais2Options = useMemo<ComboboxOption[]>(() => {
        if (smartOptions.promocionais2.length > 0) {
            return smartOptions.promocionais2;
        }
        return [{ value: 'N/A', count: 0 }];
    }, [smartOptions.promocionais2]);

    return (
        <div className="w-full h-full">
            <SectionCard title="Produto & Oferta" icon={<Package size={14} />} badge="3">
                <div className="space-y-2">
                    {/* Produto - Combobox */}
                    <div>
                        <Label label="Produto" required tooltip="Tipo do cartão a ser oferecido. Ex: Classic, Gold, Platinum" />
                        <Combobox
                            value={formData.produto}
                            onChange={(val) => handleChange('produto', val)}
                            options={produtosOptions}
                            placeholder="Digite ou selecione..."
                        />
                    </div>

                    {/* Perfil Credito - Combobox */}
                    <div>
                        <Label label="Perfil Credito" tooltip="Classificação de risco do público-alvo. Ex: Whitelist, Alto_Limite, Baixo_Risco" />
                        <Combobox
                            value={formData.perfilCredito}
                            onChange={(val) => handleChange('perfilCredito', val)}
                            options={smartOptions.perfisCredito}
                            placeholder="Digite..."
                        />
                    </div>

                    {/* Etapa do Funil - Combobox */}
                    <div>
                        <Label label="Etapa Funil" tooltip="Posição do lead no funil de conversão. Aquisição (topo) ou Meio_de_Funil (já engajado)" />
                        <Combobox
                            value={formData.etapaAquisicao}
                            onChange={(val) => handleChange('etapaAquisicao', val)}
                            options={etapasOptions}
                            placeholder="Digite ou selecione..."
                        />
                    </div>

                    {/* Divisor - OFERTAS */}
<div className="border-t border-slate-200 pt-2 space-y-2">
                        {/* Oferta Principal - Combobox */}
                        <div>
                            <Label label="Oferta" required tooltip="Estratégia principal de aquisição. Padrão (sem custo), Vibe (R$2), Limite (R$1), Anuidade (R$76,50)" />
                            <Combobox
                                value={formData.oferta}
                                onChange={(val) => handleChange('oferta', val)}
                                options={smartOptions.ofertas}
                                placeholder="Digite ou selecione..."
                                error={errors.oferta}
                            />
                        </div>

                        {/* Promocional - Combobox */}
                        <div>
                            <Label label="Promocional" tooltip="Tática promocional adicional. Ex: Em dobro, Upgrade, Black Friday. Preenchido auto baseado na Oferta." />
                            <Combobox
                                value={formData.promocional}
                                onChange={(val) => handleChange('promocional', val)}
                                options={promocionaisOptions}
                                placeholder="Digite..."
                            />
                        </div>

                        {/* Oferta 2 e Promocional 2 - Combobox */}
                        <div className="grid grid-cols-2 gap-1.5">
                            <div>
                                <Label label="Oferta 2" tooltip="Oferta secundária opcional para A/B test ou combo. Sugerido baseado no histórico." />
                                <Combobox
                                    value={formData.oferta2}
                                    onChange={(val) => handleChange('oferta2', val)}
                                    options={ofertas2Options}
                                    placeholder="Digite..."
                                />
                            </div>
                            <div>
                                <Label label="Promo 2" tooltip="Promocional secundário opcional. Sugerido baseado no histórico de disparos similares." />
                                <Combobox
                                    value={formData.promocional2}
                                    onChange={(val) => handleChange('promocional2', val)}
                                    options={promocionais2Options}
                                    placeholder="Digite..."
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </SectionCard>
        </div>
    );
};

export default ProductOfferBlock;
