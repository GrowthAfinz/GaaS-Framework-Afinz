import { supabase, supabaseUrl, supabaseKey } from './supabaseClient';
import { Activity, FrameworkRow } from '../types/framework';
import { DailyAdMetrics, MediaInsight, CampaignMapping } from '../schemas/paid-media';
import { B2CDataRow } from '../types/b2c';
import { parseDate } from '../utils/formatters';
import { format } from 'date-fns';

const PAGE_SIZE = 1000;

const toFiniteNumber = (value: unknown): number => {
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    if (value === null || value === undefined) return 0;

    const cleaned = String(value)
        .replace(/[R$\s%]/g, '')
        .replace(/\.(?=\d{3}(\D|$))/g, '')
        .replace(',', '.');

    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
};

const toNonNegativeInt = (value: unknown): number => {
    const num = toFiniteNumber(value);
    if (num <= 0) return 0;
    return Math.round(num);
};

const previewRows = (rows: any[], limit = 3) => rows.slice(0, limit);

const normalizeText = (value: unknown): string => {
    if (typeof value !== 'string') return value == null ? '' : String(value);
    return value.trim();
};

const normalizeBU = (value: unknown): string => {
    const raw = normalizeText(value);
    const normalized = raw.toUpperCase().replace(/\s+/g, '');
    if (normalized === 'B2C') return 'B2C';
    if (normalized === 'B2B2C') return 'B2B2C';
    if (normalized === 'PLURIX') return 'Plurix';
    return raw;
};

// Helper to map SQL row to Activity
export const mapSqlToActivity = (row: any): Activity => {
    const bu = normalizeBU(row['BU']);
    const canal = normalizeText(row['Canal']);
    const segmento = normalizeText(row['Segmento']);
    const parceiro = normalizeText(row['Parceiro']);
    const jornada = normalizeText(row['jornada']);
    const oferta = normalizeText(row['Oferta']);
    const promocional = normalizeText(row['Promocional']);

    // Reconstruct Raw Object (for compatibility)
    // The DB returns keys exactly as defined in the CREATE TABLE (Human Readable)
    const raw: FrameworkRow = {
        id: row.id,
        'Activity name / Taxonomia': row['Activity name / Taxonomia'],
        'Data de Disparo': row['Data de Disparo'],
        'Data Fim': row['Data Fim'],
        'BU': bu,
        'Canal': canal,
        // Jornada e Siglas que mudam de nome
        'Jornada': jornada,
        'Parceiro': parceiro,
        'SIGLA': row['SIGLA_Parceiro'],
        'Segmento': segmento,
        'SIGLA.1': row['SIGLA_Segmento'],
        'Subgrupos': row['Subgrupos'],
        'Etapa de aquisição': row['Etapa de aquisição'],
        'Ordem de disparo': row['Ordem de disparo'],
        'Safra': row['Safra'],
        'Perfil de Crédito': row['Perfil de Crédito'],
        'Produto': row['Produto'],
        'Oferta': oferta,
        'SIGLA.2': row['SIGLA_Oferta'],
        'Oferta 2': row['Oferta 2'],
        'Promocional': promocional,
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
        canal,
        bu,
        segmento,
        parceiro,
        jornada,
        ordemDisparo: Number(row['Ordem de disparo']) || undefined,
        oferta,
        promocional,
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
        // Fetch all rows in pages because Supabase/PostgREST can truncate default responses.
        const allRows: any[] = [];
        let from = 0;

        while (true) {
            const to = from + PAGE_SIZE - 1;
            const { data, error } = await supabase
                .from('activities')
                .select('*')
                .order('Data de Disparo', { ascending: false })
                .range(from, to);

            if (error) throw error;

            const page = data || [];
            if (page.length === 0) break;

            allRows.push(...page);

            if (page.length < PAGE_SIZE) break;
            from += PAGE_SIZE;
        }

        return allRows.map(mapSqlToActivity);
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
        const [{ data, error }, mappings] = await Promise.all([
            supabase
                .from('paid_media_metrics')
                .select('*')
                .order('date', { ascending: false }),
            dataService.fetchCampaignMappings()
        ]);

        if (error) throw error;

        const mappingDict = mappings.reduce((acc, m) => {
            acc[m.campaign_name] = m.objective;
            return acc;
        }, {} as Record<string, string>);

        // Group by date + channel + campaign + objective
        const grouped = (data || []).reduce((acc: any, row: any) => {
            const dateStr = row.date.substring(0, 10);
            const key = `${dateStr}_${row.channel}_${row.campaign}_${row.objective || ''}`;
            
            if (!acc[key]) {
                acc[key] = {
                    date: new Date(row.date + 'T12:00:00Z'),
                    channel: row.channel,
                    campaign: row.campaign,
                    objective: row.objective,
                    spend: 0,
                    impressions: 0,
                    clicks: 0,
                    conversions: 0,
                    reach: 0
                };
            }
            
            acc[key].spend += Number(row.spend) || 0;
            acc[key].impressions += Number(row.impressions) || 0;
            acc[key].clicks += Number(row.clicks) || 0;
            acc[key].conversions += Number(row.conversions) || 0;
            acc[key].reach += Number(row.reach) || 0;
            
            return acc;
        }, {} as Record<string, any>);

        // Calculate derived metrics
        return Object.values(grouped).map((group: any) => {
            const spend = group.spend;
            const impressions = group.impressions;
            const clicks = group.clicks;
            const conversions = group.conversions;
            const reach = group.reach;

            let mappedObjective = mappingDict[group.campaign] || group.objective;
            if (mappedObjective === 'conversion') mappedObjective = 'b2c';
            if (mappedObjective === 'brand') mappedObjective = 'marca';

            return {
                date: group.date,
                channel: group.channel,
                campaign: group.campaign,
                objective: mappedObjective,
                spend,
                impressions,
                clicks,
                conversions,
                reach: reach > 0 ? reach : undefined,
                frequency: reach > 0 && impressions > 0 ? impressions / reach : undefined,
                ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
                cpc: clicks > 0 ? spend / clicks : 0,
                cpm: impressions > 0 ? (spend / impressions) * 1000 : 0,
                cpa: conversions > 0 ? spend / conversions : 0,
            };
        });
    },

    async fetchPaidMediaByAd(): Promise<DailyAdMetrics[]> {
        // Paginate to bypass Supabase's 1000-row default limit
        const PAGE_SIZE = 1000;
        let allRows: any[] = [];
        let page = 0;
        while (true) {
            const { data: pageData, error: pageError } = await supabase
                .from('paid_media_metrics')
                .select('*')
                .order('date', { ascending: false })
                .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
            if (pageError) throw pageError;
            if (!pageData || pageData.length === 0) break;
            allRows = allRows.concat(pageData);
            if (pageData.length < PAGE_SIZE) break;
            page++;
        }

        const mappings = await dataService.fetchCampaignMappings();
        const mappingDict = mappings.reduce((acc, m) => {
            acc[m.campaign_name] = m.objective;
            return acc;
        }, {} as Record<string, string>);

        return allRows.map((row: any) => {
            let mappedObjective = mappingDict[row.campaign] || row.objective;
            if (mappedObjective === 'conversion') mappedObjective = 'b2c';
            if (mappedObjective === 'brand') mappedObjective = 'marca';
            
            return {
                date: new Date(row.date + 'T12:00:00Z'),
                channel: row.channel,
                campaign: row.campaign,
                objective: mappedObjective,
                ad_id: row.ad_id,
                ad_name: row.ad_name,
                adset_id: row.adset_id,
                adset_name: row.adset_name,
                spend: Number(row.spend) || 0,
                impressions: Number(row.impressions) || 0,
                clicks: Number(row.clicks) || 0,
                conversions: Number(row.conversions) || 0,
                reach: Number(row.reach) || undefined,
                frequency: Number(row.frequency) || undefined,
                ctr: Number(row.ctr) || 0,
                cpc: Number(row.cpc) || 0,
                cpm: Number(row.cpm) || 0,
                cpa: Number(row.cpa) || 0
            };
        });
    },

    async fetchPaidMediaByAdset(): Promise<DailyAdMetrics[]> {
        const [{ data, error }, mappings] = await Promise.all([
            supabase
                .from('paid_media_metrics')
                .select('*')
                .order('date', { ascending: false }),
            dataService.fetchCampaignMappings()
        ]);

        if (error) throw error;

        const mappingDict = mappings.reduce((acc, m) => {
            acc[m.campaign_name] = m.objective;
            return acc;
        }, {} as Record<string, string>);

        // Group by date + channel + campaign + adset_name
        const grouped = (data || []).reduce((acc: any, row: any) => {
            const dateStr = row.date.substring(0, 10);
            const key = `${dateStr}_${row.channel}_${row.campaign}_${row.adset_name || ''}`;
            
            if (!acc[key]) {
                acc[key] = {
                    date: new Date(row.date + 'T12:00:00Z'),
                    channel: row.channel,
                    campaign: row.campaign,
                    objective: row.objective,
                    adset_name: row.adset_name,
                    adset_id: row.adset_id,
                    spend: 0,
                    impressions: 0,
                    clicks: 0,
                    conversions: 0,
                    reach: 0
                };
            }
            
            acc[key].spend += Number(row.spend) || 0;
            acc[key].impressions += Number(row.impressions) || 0;
            acc[key].clicks += Number(row.clicks) || 0;
            acc[key].conversions += Number(row.conversions) || 0;
            acc[key].reach += Number(row.reach) || 0;
            
            return acc;
        }, {} as Record<string, any>);

        // Calculate derived metrics
        return Object.values(grouped).map((group: any) => {
            const spend = group.spend;
            const impressions = group.impressions;
            const clicks = group.clicks;
            const conversions = group.conversions;
            const reach = group.reach;

            let mappedObjective = mappingDict[group.campaign] || group.objective;
            if (mappedObjective === 'conversion') mappedObjective = 'b2c';
            if (mappedObjective === 'brand') mappedObjective = 'marca';

            return {
                date: group.date,
                channel: group.channel,
                campaign: group.campaign,
                objective: mappedObjective,
                adset_name: group.adset_name,
                adset_id: group.adset_id,
                spend,
                impressions,
                clicks,
                conversions,
                reach: reach > 0 ? reach : undefined,
                frequency: reach > 0 && impressions > 0 ? impressions / reach : undefined,
                ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
                cpc: clicks > 0 ? spend / clicks : 0,
                cpm: impressions > 0 ? (spend / impressions) * 1000 : 0,
                cpa: conversions > 0 ? spend / conversions : 0,
            };
        });
    },

    /** Lightweight fetch: only campaign / adset_name / ad_name for filter dropdowns.
     *  Accepts optional date range (YYYY-MM-DD) to scope results to the current period. */
    async fetchAdHierarchy(fromDate?: string, toDate?: string): Promise<Array<{ campaign: string; adset_name: string | null; ad_name: string | null }>> {
        let query = supabase
            .from('paid_media_metrics')
            .select('campaign, adset_name, ad_name')
            .not('adset_name', 'is', null);
        if (fromDate) query = query.gte('date', fromDate);
        if (toDate) query = query.lte('date', toDate);
        const { data, error } = await query;
        if (error) {
            console.error('fetchAdHierarchy error:', error);
            return [];
        }
        return (data || []) as Array<{ campaign: string; adset_name: string | null; ad_name: string | null }>;
    },

    async fetchDrilldownData(campaign: string, fromDateStr: string, toDateStr: string): Promise<any[]> {
        // As datas devem chegar no formato YYYY-MM-DD
        const [{ data, error }, mappings] = await Promise.all([
            supabase
                .from('paid_media_metrics')
                .select('*')
                .eq('campaign', campaign)
                .gte('date', fromDateStr)
                .lte('date', toDateStr)
                .order('date', { ascending: false }),
            dataService.fetchCampaignMappings()
        ]);

        if (error) throw error;

        const mappingDict = mappings.reduce((acc, m) => {
            acc[m.campaign_name] = m.objective;
            return acc;
        }, {} as Record<string, string>);

        return (data || []).map((row: any) => {
            let mappedObjective = mappingDict[row.campaign] || row.objective;
            if (mappedObjective === 'conversion') mappedObjective = 'b2c';
            if (mappedObjective === 'brand') mappedObjective = 'marca';
            
            return {
                date: new Date(row.date + 'T12:00:00Z'),
                channel: row.channel,
                campaign: row.campaign,
                objective: mappedObjective,
                adset_id: row.adset_id,
                adset_name: row.adset_name,
                ad_id: row.ad_id,
                ad_name: row.ad_name,
                spend: Number(row.spend) || 0,
                impressions: Number(row.impressions) || 0,
                clicks: Number(row.clicks) || 0,
                conversions: Number(row.conversions) || 0,
                reach: Number(row.reach) || 0,
            };
        });
    },

    async fetchInsights(filters?: {
        channel?: string;
        status?: string;
        minScore?: number;
        limit?: number;
    }): Promise<MediaInsight[]> {
        let query = supabase
            .from('paid_media_insights')
            .select('*')
            .order('score', { ascending: false })
            .order('generated_at', { ascending: false });

        if (filters?.channel) query = query.eq('channel', filters.channel);
        if (filters?.status) {
            if (filters.status === 'active') {
                query = query.in('status', ['active', 'ativo']);
            } else {
                query = query.eq('status', filters.status);
            }
        }
        if (filters?.minScore) query = query.gte('score', filters.minScore);
        if (filters?.limit) query = query.limit(filters.limit);

        const { data, error } = await query;
        if (error) throw error;
        return data ?? [];
    },

    async dismissInsight(id: string): Promise<void> {
        const { error } = await supabase
            .from('paid_media_insights')
            .update({ status: 'dismissed' })
            .eq('id', id);
        if (error) throw error;
    },

    async markInsightDone(id: string): Promise<void> {
        const { error } = await supabase
            .from('paid_media_insights')
            .update({ status: 'done' })
            .eq('id', id);
        if (error) throw error;
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
        // ROBUST SYNC: Delete then Insert (same pattern as Framework)
        // This avoids dependence on UNIQUE constraints that might be missing
        const { error: deleteError } = await supabase
            .from('b2c_daily_metrics')
            .delete()
            .gte('data', '2000-01-01'); // effectively wipes history

        if (deleteError) throw deleteError;
        if (metrics.length === 0) return;

        const sqlBatch = metrics.map(m => ({
            data: m.data,
            propostas_total: toNonNegativeInt(m.propostas_b2c_total),
            emissoes_total: toNonNegativeInt(m.emissoes_b2c_total),
            percentual_conversao: Math.round(toFiniteNumber(m.percentual_conversao_b2c)),
            observacoes: m.observacoes || null
        }));

        const { error: insertError } = await supabase
            .from('b2c_daily_metrics')
            .insert(sqlBatch);

        if (insertError) {
            console.error('❌ B2C Sync Error:', insertError);
            console.error('B2C payload preview:', previewRows(sqlBatch));
            throw new Error(`ENGINEERING_FIX_V3: ${insertError.message}`);
        }
    },

    async upsertPaidMedia(metrics: DailyAdMetrics[]) {
        // ROBUST SYNC: Delete then Insert
        const { error: deleteError } = await supabase
            .from('paid_media_metrics')
            .delete()
            .gte('date', '2000-01-01');

        if (deleteError) throw deleteError;

        const sqlBatch = metrics
            .filter(m => m.date && m.campaign) // skip rows without date or campaign
            .map(m => {
                let dateStr: string;
                try {
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
                    spend: toFiniteNumber(m.spend),
                    impressions: toNonNegativeInt(m.impressions),
                    clicks: toNonNegativeInt(m.clicks),
                    conversions: toNonNegativeInt(m.conversions),
                    ctr: toFiniteNumber(m.ctr),
                    cpc: toFiniteNumber(m.cpc),
                    cpm: toFiniteNumber(m.cpm),
                    cpa: toFiniteNumber(m.cpa),
                };
            })
            .filter(Boolean);

        if (sqlBatch.length === 0) return;

        const invalidIntRow = (sqlBatch as any[]).find((row) =>
            !Number.isInteger(row.impressions) ||
            !Number.isInteger(row.clicks) ||
            !Number.isInteger(row.conversions)
        );
        if (invalidIntRow) {
            console.error('Invalid integer payload before insert:', invalidIntRow);
            throw new Error(
                `ENGINEERING_FIX_V3_PRECHECK: integer fields invalid. ` +
                JSON.stringify({
                    impressions: invalidIntRow.impressions,
                    clicks: invalidIntRow.clicks,
                    conversions: invalidIntRow.conversions
                })
            );
        }

        console.log(`✅ Inserindo ${sqlBatch.length} linhas em paid_media_metrics...`);
        console.log('Paid payload preview:', previewRows(sqlBatch as any[]));
        const { error: insertError } = await supabase
            .from('paid_media_metrics')
            .insert(sqlBatch);

        if (insertError) {
            console.error('❌ Paid Media Sync Error:', insertError);
            throw new Error(`ENGINEERING_FIX_V3: ${insertError.message}`);
        }
    },

    async fetchPaidMediaBudgets(): Promise<any[]> {
        const { data, error } = await supabase.from('paid_media_budgets').select('*');
        if (error) throw error;
        return data || [];
    },

    async upsertPaidMediaBudget(budget: any) {
        // Upsert budget using id as the conflict column
        const { error } = await supabase.from('paid_media_budgets').upsert(budget, { onConflict: 'id' });
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
        // Upsert target using id as the conflict column
        const { error } = await supabase.from('paid_media_targets').upsert(target, { onConflict: 'id' });
        if (error) throw error;
    },

    async deletePaidMediaTarget(id: string) {
        const { error } = await supabase.from('paid_media_targets').delete().eq('id', id);
        if (error) throw error;
    },

    async fetchCampaignMappings(): Promise<CampaignMapping[]> {
        const { data, error } = await supabase.from('paid_media_campaign_mappings').select('*');
        if (error) throw error;
        return data || [];
    },

    async upsertCampaignMapping(mapping: Partial<CampaignMapping>) {
        const { error } = await supabase
            .from('paid_media_campaign_mappings')
            .upsert(mapping, { onConflict: 'campaign_name' });
        if (error) throw error;
    },

    async fetchAdCreatives(): Promise<any[]> {
        const { data, error } = await supabase
            .from('ad_creatives')
            .select('*');
        if (error) throw error;
        return data || [];
    },

    async triggerCollectCreatives(): Promise<any> {
        const resp = await fetch(
            `${supabaseUrl}/functions/v1/collect-meta-creatives`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${supabaseKey}`,
                },
                body: JSON.stringify({}),
            }
        );
        if (!resp.ok) throw new Error(`Edge function error: ${resp.status}`);
        return resp.json();
    }
};
