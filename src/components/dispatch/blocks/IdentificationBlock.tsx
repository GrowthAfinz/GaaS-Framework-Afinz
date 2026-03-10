import React, { useMemo } from 'react';
import { Tag } from 'lucide-react';
import { useDispatchForm } from '../context/DispatchFormContext';
import { CANAIS } from '../../../constants/frameworkFields';
import { SectionCard, Label, Input, Select, Combobox, ComboboxOption } from './shared';

/**
 * Bloco 1: Identificacao
 * Campos: BU, Campanha, ActivityName, Jornada, Canal, Parceiro, Subgrupo
 * Largura: 220px
 *
 * PILAR: Automatizacao por Historico
 * - TODOS os campos usam Combobox editavel com sugestoes do historico
 * - Usuario pode digitar livremente OU selecionar sugestao
 * - Sugestoes ordenadas por frequencia de uso
 */
export const IdentificationBlock: React.FC = () => {
    const { formData, handleChange, errors, smartOptions } = useDispatchForm();

    // Converter canais fixos para formato ComboboxOption
    const canaisOptions = useMemo<ComboboxOption[]>(() => {
        // Priorizar historico se disponivel
        if (smartOptions.canais.length > 0) {
            return smartOptions.canais;
        }
        // Fallback para canais fixos
        return CANAIS.map(c => ({ value: c, count: 0 }));
    }, [smartOptions.canais]);

    return (
        <div className="w-full h-full">
            <SectionCard title="Identificacao" icon={<Tag size={14} />} badge="1">
                <div className="space-y-2.5">
                    {/* BU (fixo) e Campanha (historico) */}
                    <div className="grid grid-cols-2 gap-1.5">
                        {/* BU - SELECT fixo (apenas 3 opcoes) */}
                        <div>
                            <Label label="BU" required tooltip="Business Unit - Unidade de negócio responsável. B2C, B2B2C, Plurix ou Bem Barato" />
                            <Select
                                value={formData.bu}
                                onChange={(e) => handleChange('bu', e.target.value)}
                                error={errors.bu}
                            >
                                <option value="">...</option>
                                <option value="B2C">B2C</option>
                                <option value="B2B2C">B2B2C</option>
                                <option value="Plurix">Plurix</option>
                                <option value="Bem Barato">Bem Barato</option>
                            </Select>
                        </div>

                        {/* CAMPANHA - Combobox com historico */}
                        <div>
                            <Label label="CAMPANHA" required tooltip="Segmento/Campanha de marketing. Ex: Leads_Parceiros, CRM, Cartonistas. Sugere baseado no histórico." />
                            <Combobox
                                value={formData.segmento}
                                onChange={(val) => handleChange('segmento', val)}
                                options={smartOptions.segmentos}
                                placeholder="Digite..."
                                error={errors.segmento}
                            />
                        </div>
                    </div>

                    {/* Activity Name (editavel, com auto-sugestao) */}
                    <div>
                        <Label label="ActivityName" required tooltip="Identificador único do disparo no Salesforce. Auto-gerado: BU_CAMPANHA_JORNADA_ORDEM_SAFRA. Editável." />
                        <Input
                            value={formData.activityName}
                            onChange={(e) => handleChange('activityName', e.target.value)}
                            placeholder="auto: BU_CAMP_JORNADA_ORD_SAFRA"
                            className="font-mono text-[9px] bg-slate-50 border-slate-200 text-slate-700"
                            error={errors.activityName}
                        />
                    </div>

                    {/* Jornada - Combobox com historico */}
                    <div>
                        <Label label="Jornada" required tooltip="Fluxo de comunicação do cliente. Ex: DISPARO_AQUISICAO, RETENÇÃO, UPSELL. Sugere do histórico." />
                        <Combobox
                            value={formData.jornada}
                            onChange={(val) => handleChange('jornada', val)}
                            options={smartOptions.jornadas}
                            placeholder="Digite ou selecione..."
                            error={errors.jornada}
                        />
                    </div>

                    {/* Canal - Combobox com historico + fallback */}
                    <div>
                        <Label label="Canal" required tooltip="Meio de comunicação. E-mail (R$0,001), Push (R$0,001), SMS (R$0,064), WhatsApp (R$0,420)" />
                        <Combobox
                            value={formData.canal}
                            onChange={(val) => handleChange('canal', val)}
                            options={canaisOptions}
                            placeholder="Digite ou selecione..."
                            error={errors.canal}
                        />
                    </div>

                    {/* Divisor visual */}
                    <div className="border-t border-slate-200 pt-2">
                        {/* Parceiro e Subgrupo - Combobox com historico */}
                        <div className="grid grid-cols-2 gap-1.5">
                            <div>
                                <Label label="Parceiro" tooltip="Origem/Parceiro da base de leads. Ex: Serasa, Acordo Certo, Bom_Pra_Credito" />
                                <Combobox
                                    value={formData.parceiro}
                                    onChange={(val) => handleChange('parceiro', val)}
                                    options={smartOptions.parceiros}
                                    placeholder="Digite..."
                                />
                            </div>
                            <div>
                                <Label label="Subgrupo" tooltip="Segmentação adicional dentro da campanha. Ex: Ativo, Inativo, Novos, Leais" />
                                <Combobox
                                    value={formData.subgrupo}
                                    onChange={(val) => handleChange('subgrupo', val)}
                                    options={smartOptions.subgrupos}
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

export default IdentificationBlock;
