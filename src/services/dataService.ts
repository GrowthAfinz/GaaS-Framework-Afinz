
import { supabase } from './supabaseClient';
import { Activity, FrameworkRow } from '../types/framework';
import { DailyAdMetrics } from '../schemas/paid-media';
import { B2CDataRow } from '../types/b2c';
import { parseDate } from '../utils/formatters';
import { format } from 'date-fns';

// Helper to map SQL row to Activity
export const mapSqlToActivity = (row: any): Activity => {
    // Reconstruct Raw Object (for compatibility)
    // The DB returns keys exactly as defined in the CREATE TABLE (Human Readable)
    const raw: FrameworkRow = {
        id: row.id,
        'Activity name / Taxonomia': row['Activity name / Taxonomia'],
        'Data de Disparo': row['Data de Disparo'],
        'Data Fim': row['Data Fim'],
        'BU': row['BU'],
        'Canal': row['Canal'],
        // Jornada e Siglas que mudam de nome
        'Jornada': row['jornada'],
        'Parceiro': row['Parceiro'],
        'SIGLA': row['SIGLA_Parceiro'],
        'Segmento': row['Segmento'],
        'SIGLA.1': row['SIGLA_Segmento'],
        'Subgrupos': row['Subgrupos'],
        'Etapa de aquisição': row['Etapa de aquisição'],
        'Ordem de disparo': row['Ordem de disparo'],
        'Safra': row['Safra'],
        'Perfil de Crédito': row['Perfil de Crédito'],
        'Produto': row['Produto'],
        'Oferta': row['Oferta'],
        'SIGLA.2': row['SIGLA_Oferta'],
        'Oferta 2': row['Oferta 2'],
        'Promocional': row['Promocional'],
        'Promocional 2': row['Promocional 2'],
        'Disparado?': row['status'] === 'Realizado' ? 'Sim' : 'Não', // Infer or use if column existed
        'Base Total': row['Base Total'],
        'Base Acionável': row['Base Acionável'],
        '% Otimização de base': row['% Otimização de base'],
        'Base Enviada': row['Base Total'], // Fallback or mapping?
        'Custo Unitário Oferta': row['Custo Unitário Oferta'],
        'Custo Total da Oferta': row['Custo Total da Oferta'],
        'Custo unitário do canal': row['Custo unitário do canal'],
        'Custo total canal': row['Custo total canal'],
        'Custo Total Campanha': row['Custo Total Campanha'],
        // Rates
        // Rates
        'Taxa de Entrega': row['Taxa de Entrega'],
        'Taxa de Abertura': row['Taxa de Abertura'],
        'Taxa de Clique': row['Taxa de Clique'],
        'Taxa de Proposta': row['Taxa de Proposta'],
        'Taxa de Aprovação': row['Taxa de Aprovação'],
        'Taxa de Finalização': row['Taxa de Finalização'],
        'Taxa de Conversão': row['Taxa de Conversão'],
        // Volumes e KPIs
        'Cartões Gerados': row['Cartões Gerados'],
        'Aprovados': row['Aprovados'],
        'Propostas': row['Propostas'],
        'CAC': row['CAC'],
    };

    return {
        id: row['Activity name / Taxonomia'] || row.id,
        dataDisparo: parseDate(row['Data de Disparo']) || new Date(row['Data de Disparo']), // Fallback to standard if parse fail
        canal: row['Canal'],
        bu: row['BU'],
        segmento: row['Segmento'],
        parceiro: row['Parceiro'],
        jornada: row['jornada'],
        ordemDisparo: Number(row['Ordem de disparo']) || undefined,
        oferta: row['Oferta'],
        promocional: row['Promocional'],
        safraKey: row['Safra'],
        status: row['status'] as any, // Cast to ActivityStatus
        kpis: {
            baseEnviada: row['Base Total'],
            baseEntregue: row['Base Acionável'],
            taxaEntrega: row['Taxa de Entrega'],
            propostas: row['Propostas'],
            taxaPropostas: row['Taxa de Proposta'],
            aprovados: row['Aprovados'],
            taxaAprovacao: row['Taxa de Aprovação'],
            emissoes: row['Cartões Gerados'],
            taxaFinalizacao: row['Taxa de Finalização'],
            taxaConversao: row['Taxa de Conversão'],
            taxaAbertura: row['Taxa de Abertura'],
            cartoes: row['Cartões Gerados'],
            cac: row['CAC'],
            custoTotal: row['Custo Total Campanha']
        },
        raw
    };
};

export const dataService = {
    async fetchActivities(): Promise<Activity[]> {
        // Order by date desc
        // Use quotes to support columns with spaces
        const { data, error } = await supabase
            .from('activities')
            .select('*')
            //.eq('filename', 'migration_v3_full') // Optional: constrain to latest? Or just take all?
            // User might want to append new data later.
            .order('"Data de Disparo"', { ascending: false });

        if (error) throw error;
        return (data || []).map(mapSqlToActivity);
    },

    async fetchB2CMetrics(): Promise<B2CDataRow[]> {
        const { data, error } = await supabase
            .from('b2c_daily_metrics')
            .select('*')
            .order('data', { ascending: false });

        if (error) throw error;

        return (data || []).map((row: any) => ({
            data: row.data, // YYYY-MM-DD
            propostas_b2c_total: row.propostas_total,
            emissoes_b2c_total: row.emissoes_total,
            percentual_conversao_b2c: row.percentual_conversao,
            observacoes: row.observacoes
        }));
    },

    async fetchPaidMedia(): Promise<DailyAdMetrics[]> {
        const { data, error } = await supabase
            .from('paid_media_metrics')
            .select('*')
            .order('date', { ascending: false });

        if (error) throw error;

        return (data || []).map((row: any) => ({
            date: new Date(row.date),
            channel: row.channel,
            campaign: row.campaign,
            objective: row.objective,
            spend: row.spend,
            impressions: row.impressions,
            clicks: row.clicks,
            conversions: row.conversions,
            ctr: row.ctr,
            cpc: row.cpc,
            cpm: row.cpm,
            cpa: row.cpa
        }));
    },

    async fetchGoals() {
        const { data, error } = await supabase
            .from('goals')
            .select('*');

        if (error) throw error;
        return data || [];
    },

    async upsertGoal(goal: any) {
        const { error } = await supabase
            .from('goals')
            .upsert(goal, { onConflict: 'mes' });

        if (error) throw error;
    },

    async upsertB2CMetrics(metrics: B2CDataRow[]) {
        const sqlBatch = metrics.map(m => ({
            data: m.data,
            propostas_total: m.propostas_b2c_total || 0,
            emissoes_total: m.emissoes_b2c_total || 0,
            percentual_conversao: m.percentual_conversao_b2c || 0,
            observacoes: m.observacoes || null
        }));

        const { error } = await supabase
            .from('b2c_daily_metrics')
            .upsert(sqlBatch, { onConflict: 'data' });

        if (error) throw error;
    },

    async upsertPaidMedia(metrics: DailyAdMetrics[]) {
        const sqlBatch = metrics
            .filter(m => m.date && m.campaign) // skip rows without date or campaign
            .map(m => {
                let dateStr: string;
                try {
                    // m.date is an ISO string from fileParser, parse it back to Date for format()
                    const d = new Date(m.date as unknown as string);
                    if (isNaN(d.getTime())) return null;
                    dateStr = format(d, 'yyyy-MM-dd');
                } catch {
                    return null;
                }
                return {
                    date: dateStr,
                    channel: m.channel,
                    campaign: m.campaign,
                    objective: m.objective,
                    spend: m.spend ?? 0,
                    impressions: m.impressions ?? 0,
                    clicks: m.clicks ?? 0,
                    conversions: m.conversions ?? 0,
                    ctr: m.ctr ?? 0,
                    cpc: m.cpc ?? 0,
                    cpm: m.cpm ?? 0,
                    cpa: m.cpa ?? 0,
                };
            })
            .filter(Boolean); // remove nulls from failed date parses

        if (sqlBatch.length === 0) {
            console.warn('⚠️ upsertPaidMedia: nenhuma linha válida para inserir.');
            return;
        }

        console.log(`✅ Inserindo ${sqlBatch.length} linhas em paid_media_metrics...`);
        const { error } = await supabase
            .from('paid_media_metrics')
            .upsert(sqlBatch, { onConflict: 'date, channel, campaign' });

        if (error) throw error;
    },

    async fetchPaidMediaBudgets(): Promise<any[]> {
        const { data, error } = await supabase.from('paid_media_budgets').select('*');
        if (error) throw error;
        return data || [];
    },

    async upsertPaidMediaBudget(budget: any) {
        const { error } = await supabase.from('paid_media_budgets').upsert(budget, { onConflict: 'month, channel, objective' });
        if (error) throw error;
    },

    async deletePaidMediaBudget(id: string) {
        const { error } = await supabase.from('paid_media_budgets').delete().eq('id', id);
        if (error) throw error;
    },

    async fetchPaidMediaTargets(): Promise<any[]> {
        const { data, error } = await supabase.from('paid_media_targets').select('*');
        if (error) throw error;
        return data || [];
    },

    async upsertPaidMediaTarget(target: any) {
        const { error } = await supabase.from('paid_media_targets').upsert(target, { onConflict: 'month, metric, channel, objective' });
        if (error) throw error;
    },

    async deletePaidMediaTarget(id: string) {
        const { error } = await supabase.from('paid_media_targets').delete().eq('id', id);
        if (error) throw error;
    }
};
