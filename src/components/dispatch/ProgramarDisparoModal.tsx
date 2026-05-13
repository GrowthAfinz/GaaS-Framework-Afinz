import React, { useState, useMemo } from 'react';
import { X, Calendar, CheckCircle2, Trash2, AlertCircle } from 'lucide-react';
import { ActivityFormSchema } from '../../schemas/ActivityFormSchema';
import { activityService } from '../../services/activityService';
import { ActivityRow, ActivityStatus } from '../../types/activity';
import { useAppStore } from '../../store/useAppStore';

// Context e Blocos
import { DispatchFormProvider, useDispatchForm } from './context/DispatchFormContext';
import {
    IdentificationBlock,
    ScheduleBlock,
    ProductOfferBlock,
    InvestmentBlock,
    AIProjectionBlock
} from './blocks';

// NEW: AI Insights
import { useDispatchInsights } from '../../hooks/useDispatchInsights';
import { InsightsSection } from './sections/InsightsSection';
import { DispatchFormData } from '../../services/ml/alternativeGenerator';
import { Alternative } from '../../services/ml/alternativeGenerator';

interface ProgramarDisparoModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (activity: ActivityRow) => void;
    editingActivity?: ActivityRow | null;
    activeSegmento: string;
}

/**
 * Modal Interno - Usa o Context
 */
const ModalContent: React.FC<{
    onClose: () => void;
    onSuccess: (activity: ActivityRow) => void;
}> = ({ onClose, onSuccess }) => {
    const {
        formData,
        errors,
        setErrors,
        loading,
        setLoading,
        editingActivity,
        setFormData
    } = useDispatchForm();

    const removeActivity = useAppStore((state) => state.removeActivity);
    const activities = useAppStore((state) => state.activities);

    // NEW: Convert formData to DispatchFormData for AI insights
    const dispatchFormData = useMemo<DispatchFormData | null>(() => {
        if (!formData.bu || !formData.canal) return null;
        return {
            bu: formData.bu,
            canal: formData.canal,
            segmento: formData.segmento || '',
            jornada: formData.jornada || '',
            perfilCredito: formData.perfilCredito || '',
            oferta: formData.oferta || '',
            dataDisparo: formData.dataInicio || new Date().toISOString().split('T')[0],
            horarioDisparo: formData.horarioDisparo || '10:00',
            baseTotal: parseInt(String(formData.baseVolume || 1000), 10),
        };
    }, [formData]);

    // NEW: AI Insights hook
    const insightResult = useDispatchInsights(dispatchFormData, activities as unknown as ActivityRow[]);

    // NEW: Handle alternative selection
    const handleSelectAlternative = (alternative: Alternative) => {
        setFormData((prev) => ({
            ...prev,
            ...alternative.appliedChanges,
        } as any));
        console.log(`✅ Sugestão aplicada: ${alternative.title}`);
    };

    const handleSubmit = async (status: ActivityStatus) => {
        try {
            setLoading(true);
            setErrors({});

            // Montar dados para validacao
            const dataToSubmit = {
                bu: formData.bu,
                jornada: formData.jornada,
                activityName: formData.activityName,
                dataInicio: formData.dataInicio,
                dataFim: formData.dataFim,
                horarioDisparo: formData.horarioDisparo,
                canal: formData.canal,
                safra: formData.safra,
                ordemDisparo: formData.ordemDisparo,
                perfilCredito: formData.perfilCredito,
                oferta: formData.oferta,
                promocional: formData.promocional,
                oferta2: formData.oferta2,
                promocional2: formData.promocional2,
                parceiro: formData.parceiro,
                subgrupo: formData.subgrupo,
                etapaAquisicao: formData.etapaAquisicao,
                produto: formData.produto,
                baseVolume: formData.baseVolume,
                custoUnitarioOferta: formData.custoUnitarioOferta,
                custoTotalOferta: formData.custoTotalOferta,
                custoUnitarioCanal: formData.custoUnitarioCanal,
                custoTotalCanal: formData.custoTotalCanal,
                custoTotalCampanha: formData.custoTotalCampanha,
                status
            };

            const parseResult = ActivityFormSchema.safeParse(dataToSubmit);

            if (!parseResult.success) {
                const newErrors: Record<string, string> = {};
                parseResult.error.issues.forEach(err => {
                    const field = err.path[0] as string;
                    newErrors[field] = err.message;
                });
                setErrors(newErrors);
                setErrors(prev => ({ ...prev, form: 'Verifique os campos obrigatorios em vermelho.' }));
                return;
            }

            let savedActivity: ActivityRow;
            if (editingActivity) {
                savedActivity = await activityService.updateActivity(
                    editingActivity.id,
                    {
                        BU: parseResult.data.bu,
                        jornada: parseResult.data.jornada,
                        'Activity name / Taxonomia': parseResult.data.activityName,
                        'Data de Disparo': parseResult.data.dataInicio,
                        'Data Fim': parseResult.data.dataFim,
                        'Horário de Disparo': parseResult.data.horarioDisparo,
                        Segmento: formData.segmento,
                        Canal: parseResult.data.canal,
                        'Perfil de Crédito': parseResult.data.perfilCredito || null,
                        Oferta: parseResult.data.oferta || null,
                        Promocional: parseResult.data.promocional || null,
                        'Oferta 2': parseResult.data.oferta2 || null,
                        'Promocional 2': parseResult.data.promocional2 || null,
                        Parceiro: parseResult.data.parceiro || null,
                        Subgrupos: parseResult.data.subgrupo || null,
                        'Etapa de aquisição': parseResult.data.etapaAquisicao || null,
                        Produto: parseResult.data.produto || null,
                        'Base Total': Number(formData.baseVolume) || null,
                        status: parseResult.data.status,
                    }
                );
            } else {
                savedActivity = await activityService.saveActivity(parseResult.data, formData.segmento);
            }

            onSuccess(savedActivity);
            onClose();
        } catch (error: any) {
            console.error('Erro ao salvar atividade:', error);
            setErrors({ form: `Erro ao salvar: ${error?.message || 'Erro desconhecido'}` });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!editingActivity || !window.confirm('Tem certeza que deseja apagar esta atividade?')) return;
        try {
            setLoading(true);
            await activityService.deleteActivity(editingActivity.id);
            removeActivity(editingActivity.id);
            onClose();
        } catch (error) {
            console.error('Erro ao apagar:', error);
            setErrors({ form: 'Erro ao apagar atividade da base.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative w-[95vw] max-w-[1820px] h-[85vh] max-h-[920px] flex flex-col bg-white rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-200 ring-1 ring-slate-200">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-slate-200 shrink-0">
                <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${editingActivity ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                        {editingActivity ? <CheckCircle2 size={18} /> : <Calendar size={18} />}
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                            {editingActivity ? 'Editar Disparo' : 'Novo Disparo'}
                        </h2>
                        <p className="text-[10px] text-slate-500">
                            {editingActivity ? 'Edite os parametros da atividade' : 'Layout compacto - Desktop 1920x1080'}
                        </p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors"
                >
                    <X size={18} />
                </button>
            </div>

            {/* Body - 5 Blocos Horizontais + AI Insights */}
            <div className="flex-1 overflow-x-auto overflow-y-auto p-4">

                {errors.form && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-500/30 rounded-lg text-red-600 text-xs flex items-center gap-2">
                        <AlertCircle size={16} />
                        {errors.form}
                    </div>
                )}

                {/* Container dos 5 Blocos - Grid Responsivo (Full Width) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-4">
                    <IdentificationBlock />
                    <ScheduleBlock />
                    <ProductOfferBlock />
                    <InvestmentBlock />
                    <AIProjectionBlock />
                </div>

                {/* NEW: AI Insights Section */}
                {dispatchFormData && (
                    <InsightsSection
                        insightResult={insightResult}
                        onSelectAlternative={handleSelectAlternative}
                        className="w-full"
                    />
                )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 bg-white border-t border-slate-200 flex justify-between items-center shrink-0 shadow-lg z-10">
                <div>
                    {editingActivity && (
                        <button
                            onClick={handleDelete}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
                        >
                            <Trash2 size={14} />
                            <span>Excluir</span>
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-slate-500 hover:text-slate-900 font-medium text-xs transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={() => handleSubmit('Rascunho')}
                        disabled={loading}
                        className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg font-medium text-xs transition-all shadow-sm disabled:opacity-50"
                    >
                        {loading ? '...' : 'Salvar Rascunho'}
                    </button>
                    <button
                        onClick={() => handleSubmit('Scheduled')}
                        disabled={loading}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-xs shadow-lg shadow-blue-500/20 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none flex items-center gap-1.5"
                    >
                        <CheckCircle2 size={14} />
                        {loading ? 'Processando...' : 'Agendar Disparo'}
                    </button>
                </div>
            </div>

        </div>
    );
};

/**
 * Modal Principal com Provider
 * Layout: 5 Blocos Horizontais Compactos
 * Dimensoes: 95vw x 85vh (Desktop 1920x1080)
 */
export const ProgramarDisparoModal: React.FC<ProgramarDisparoModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    editingActivity,
    activeSegmento,
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity duration-300"
                onClick={onClose}
            />

            {/* Modal com Provider */}
            <DispatchFormProvider
                editingActivity={editingActivity}
                activeSegmento={activeSegmento}
            >
                <ModalContent onClose={onClose} onSuccess={onSuccess} />
            </DispatchFormProvider>
        </div>
    );
};

export default ProgramarDisparoModal;
