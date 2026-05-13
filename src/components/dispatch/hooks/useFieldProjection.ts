import { useState, useCallback, useEffect, useRef } from 'react';
import { getAIOrchestrator } from '../../../services/ml';
import type {
    FieldProjection,
    ProjectableMetric,
    FormDataInput,
    AllProjectionsResult
} from '../../../services/ml/types';
import { ActivityRow } from '../../../types/activity';

interface UseFieldProjectionOptions {
    activities: ActivityRow[];
    formData: FormDataInput;
    enabled?: boolean;
}

interface UseFieldProjectionReturn {
    // Estado
    isLoading: boolean;
    isReady: boolean;
    error: string | null;

    // Projecao individual
    activeProjection: FieldProjection | null;
    activeField: ProjectableMetric | null;
    anchorRect: DOMRect | null;

    // Todas as projecoes
    allProjections: AllProjectionsResult | null;

    // Acoes
    openProjection: (field: ProjectableMetric, anchorElement: HTMLElement) => void;
    closeProjection: () => void;
    refreshProjections: () => void;

    // Dataset stats
    datasetStats: {
        totalActivities: number;
        dateRange: { from: Date; to: Date } | null;
    };
}

/**
 * Hook para gerenciar projecoes de campos
 *
 * Uso:
 *   const { openProjection, activeProjection, closeProjection } = useFieldProjection({
 *     activities,
 *     formData,
 *   });
 *
 *   // No onClick do campo:
 *   openProjection('taxaConversao', inputRef.current);
 */
export function useFieldProjection({
    activities,
    formData,
    enabled = true
}: UseFieldProjectionOptions): UseFieldProjectionReturn {
    const [isLoading, setIsLoading] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [activeProjection, setActiveProjection] = useState<FieldProjection | null>(null);
    const [activeField, setActiveField] = useState<ProjectableMetric | null>(null);
    const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);

    const [allProjections, setAllProjections] = useState<AllProjectionsResult | null>(null);
    const [datasetStats, setDatasetStats] = useState<{
        totalActivities: number;
        dateRange: { from: Date; to: Date } | null;
    }>({ totalActivities: 0, dateRange: null });

    const orchestratorRef = useRef(getAIOrchestrator());
    const lastFormDataRef = useRef<string>('');

    // Inicializar orquestrador quando activities mudam
    useEffect(() => {
        if (!enabled || activities.length === 0) {
            setIsReady(false);
            return;
        }

        try {
            orchestratorRef.current.initialize(activities);
            setIsReady(orchestratorRef.current.isReady());

            const stats = orchestratorRef.current.getDatasetStats();
            setDatasetStats({
                totalActivities: stats.totalActivities,
                dateRange: stats.totalActivities > 0 ? stats.dateRange : null
            });

            setError(null);
        } catch (err) {
            console.error('[useFieldProjection] Erro ao inicializar:', err);
            setError('Erro ao inicializar motor de IA');
            setIsReady(false);
        }
    }, [activities, enabled]);

    // Recalcular projecoes quando formData muda
    useEffect(() => {
        if (!isReady || !enabled) return;

        const formDataStr = JSON.stringify(formData);
        if (formDataStr === lastFormDataRef.current) return;
        lastFormDataRef.current = formDataStr;

        // Debounce
        const timer = setTimeout(() => {
            try {
                const result = orchestratorRef.current.projectAllFields(formData);
                setAllProjections(result);
            } catch (err) {
                console.error('[useFieldProjection] Erro ao calcular projecoes:', err);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [formData, isReady, enabled]);

    // Abrir projecao para um campo especifico
    const openProjection = useCallback((
        field: ProjectableMetric,
        anchorElement: HTMLElement
    ) => {
        if (!isReady) {
            setError('Motor de IA nao esta pronto');
            return;
        }

        setIsLoading(true);
        setActiveField(field);
        setAnchorRect(anchorElement.getBoundingClientRect());

        try {
            const projection = orchestratorRef.current.projectField(field, formData);
            setActiveProjection(projection);
            setError(null);
        } catch (err) {
            console.error('[useFieldProjection] Erro ao projetar campo:', err);
            setError('Erro ao calcular projecao');
            setActiveProjection(null);
        } finally {
            setIsLoading(false);
        }
    }, [isReady, formData]);

    // Fechar projecao
    const closeProjection = useCallback(() => {
        setActiveProjection(null);
        setActiveField(null);
        setAnchorRect(null);
    }, []);

    // Forcar recalculo de projecoes
    const refreshProjections = useCallback(() => {
        if (!isReady) return;

        try {
            const result = orchestratorRef.current.projectAllFields(formData);
            setAllProjections(result);
        } catch (err) {
            console.error('[useFieldProjection] Erro ao recalcular:', err);
        }
    }, [isReady, formData]);

    return {
        isLoading,
        isReady,
        error,
        activeProjection,
        activeField,
        anchorRect,
        allProjections,
        openProjection,
        closeProjection,
        refreshProjections,
        datasetStats
    };
}

export default useFieldProjection;
