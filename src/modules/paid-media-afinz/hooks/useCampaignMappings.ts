import { useState, useEffect } from 'react';
import { CampaignMapping } from '../../../schemas/paid-media';
import { dataService } from '../../../services/dataService';

export function useCampaignMappings() {
    const [mappings, setMappings] = useState<CampaignMapping[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchMappings = async (silent = false) => {
        try {
            if (!silent) setIsLoading(true);
            const data = await dataService.fetchCampaignMappings();
            setMappings(data);
            setError(null);
        } catch (err: any) {
            console.error('Erro ao buscar deduplicações/mapeamentos de campanha:', err);
            setError(err.message || 'Erro desconhecido');
        } finally {
            if (!silent) setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchMappings();
    }, []);

    const updateMapping = async (campaign_name: string, objective: 'marca' | 'b2c' | 'plurix' | 'seguros') => {
        // Optimistic update — apply immediately so UI is responsive
        setMappings(prev => {
            const existing = prev.find(m => m.campaign_name === campaign_name);
            if (existing) {
                return prev.map(m => m.campaign_name === campaign_name ? { ...m, objective } : m);
            } else {
                return [...prev, { campaign_name, objective, created_at: new Date().toISOString() }];
            }
        });
        setError(null);

        try {
            await dataService.upsertCampaignMapping({ campaign_name, objective });
            // Silent re-fetch to populate server-generated ID without showing a loading spinner
            await fetchMappings(true);
        } catch (err: any) {
            console.error('Erro ao atualizar mapeamento:', err);
            setError(err.message || 'Erro ao salvar mapeamento. Verifique a conexão e tente novamente.');
            // Silent rollback — revert optimistic update without hiding the table
            await fetchMappings(true);
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
