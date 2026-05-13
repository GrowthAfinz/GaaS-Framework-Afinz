import { useState, useEffect } from 'react';
import { activityService } from '../services/activityService';
import { ActivityRow } from '../types/activity';

/**
 * Custom hook para gerenciar estado e fetch de atividades (GaaS) por segmento
 */
export const useActivities = (segmento: string) => {
    const [activities, setActivities] = useState<ActivityRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchActivities = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await activityService.getActivitiesBySegment(segmento);
            setActivities(data);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (segmento) {
            fetchActivities();
        }
    }, [segmento]);

    return {
        activities,
        loading,
        error,
        refetch: fetchActivities,
    };
};
