import React from 'react';
import { Calendar } from 'lucide-react';
import { useDispatchForm } from '../context/DispatchFormContext';
import { SectionCard, Label, Input, ReadonlyField } from './shared';
// Label já importado para uso no campo Ordem editável

/**
 * Bloco 2: Cronograma
 * Campos: Data Inicio, Data Fim, Horario, Safra, Ordem
 * Largura: 180px
 */
export const ScheduleBlock: React.FC = () => {
    const { formData, handleChange, errors } = useDispatchForm();

    return (
        <div className="w-full h-full">
            <SectionCard title="Cronograma" icon={<Calendar size={14} />} badge="2">
                <div className="space-y-2.5">
                    {/* Data Inicio */}
                    <div>
                        <Label label="Data Inicio" required tooltip="Data de início do disparo. Formato YYYY-MM-DD" />
                        <Input
                            type="date"
                            value={formData.dataInicio}
                            onChange={(e) => handleChange('dataInicio', e.target.value)}
                            error={errors.dataInicio}
                        />
                    </div>

                    {/* Data Fim */}
                    <div>
                        <Label label="Data Fim" required tooltip="Data de término do disparo. Auto-preenchido como Data Início + 2 dias." />
                        <Input
                            type="date"
                            value={formData.dataFim}
                            onChange={(e) => handleChange('dataFim', e.target.value)}
                            error={errors.dataFim}
                        />
                    </div>

                    {/* Horario */}
                    <div>
                        <Label label="Horario" tooltip="Horário previsto para o disparo. Padrão: 10:00" />
                        <Input
                            type="time"
                            value={formData.horarioDisparo}
                            onChange={(e) => handleChange('horarioDisparo', e.target.value)}
                        />
                    </div>

                    {/* Divisor */}
                    <div className="border-t border-slate-200 pt-2">
                        {/* Safra (readonly) e Ordem (EDITAVEL) */}
                        <div className="grid grid-cols-2 gap-1.5">
                            <ReadonlyField
                                label="Safra"
                                value={formData.safra}
                            />
                            <div>
                                <Label label="Ordem" tooltip="Número sequencial do disparo na mesma jornada/data. Auto-calculado mas EDITÁVEL. Ex: 1, 2, 3 ou 'Pontual'" />
                                <Input
                                    value={formData.ordemDisparo}
                                    onChange={(e) => handleChange('ordemDisparo', e.target.value)}
                                    placeholder="ex: 1 ou Pontual"
                                    className="text-center font-bold text-blue-600"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </SectionCard>
        </div>
    );
};

export default ScheduleBlock;
