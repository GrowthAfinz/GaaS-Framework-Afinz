import { supabase } from './supabaseClient';

export interface CrmInsight {
    id: string;
    insight_key: string;
    tipo: 'gargalo' | 'decomposicao_cac' | 'share_portfolio' | 'risco_concentracao' | 'oportunidade' | 'queda_performance' | 'virada_safra';
    severidade: 'critico' | 'alto' | 'medio' | 'baixo';
    confianca: 'alta' | 'media' | 'baixa';
    periodo_inicio: string | null;
    periodo_fim: string | null;
    bu: string | null;
    canal: string | null;
    segmento: string | null;
    etapa: string | null;
    safra: string | null;
    titulo: string;
    sinal: string;
    impacto: string;
    causa_provavel: string;
    evidencia: Record<string, unknown>;
    acao: string;
    criterio_sucesso: string | null;
    prioridade: number;
    status: 'ativo' | 'fixado' | 'resolvido' | 'descartado';
    fonte: string;
    gerado_em: string;
    atualizado_em: string;
}

export type InsightStatus = CrmInsight['status'];

export async function fetchActiveInsights(): Promise<CrmInsight[]> {
    const { data, error } = await supabase
        .from('crm_insights')
        .select('*')
        .in('status', ['ativo', 'fixado'])
        .order('prioridade', { ascending: false });

    if (error) {
        console.error('Erro ao buscar crm_insights:', error.message);
        return [];
    }
    return (data ?? []) as CrmInsight[];
}

export async function updateInsightStatus(id: string, status: InsightStatus): Promise<boolean> {
    const { error } = await supabase
        .from('crm_insights')
        .update({ status, atualizado_em: new Date().toISOString() })
        .eq('id', id);

    if (error) {
        console.error('Erro ao atualizar status do insight:', error.message);
        return false;
    }
    return true;
}
