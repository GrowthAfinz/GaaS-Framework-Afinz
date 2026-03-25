import { useState, useEffect } from 'react';
import { CampaignMapping } from '../../../schemas/paid-media';
import { dataService } from '../../../services/dataService';

export function useCampaignMappings() {
    const [mappings, setMappings] = useState<CampaignMapping[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchMappings = async () => {
        try {
            setIsLoading(true);
            const data = await dataService.fetchCampaignMappings();
            setMappings(data);
            setError(null);
        } catch (err: any) {
            console.error('Erro ao buscar deduplicações/mapeamentos de campanha:', err);
            setError(err.message || 'Erro desconhecido');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchMappings();
    }, []);

    const updateMapping = async (campaign_name: string, objective: 'marca' | 'b2c' | 'plurix') => {
        try {
            // Optimistic update
            setMappings(prev => {
                const existing = prev.find(m => m.campaign_name === campaign_name);
                if (existing) {
                    return prev.map(m => m.campaign_name === campaign_name ? { ...m, objective } : m);
                } else {
                    return [...prev, { campaign_name, objective, created_at: new Date().toISOString() }];
                }
            });

            await dataService.upsertCampaignMapping({ campaign_name, objective });
            // Re-fetch ensures ID is populated if newly created
            await fetchMappings();
        } catch (err: any) {
            console.error('Erro ao atualizar mapeamento:', err);
            setError(err.message || 'Erro ao atualizar mapeamento');
            // Re-fetch to rollback optimistic update on error
            await fetchMappings();
        }
    };

    return {
        mappings,
        isLoading,
        error,
        updateMapping,
        refetch: fetchMappings
    };
}
