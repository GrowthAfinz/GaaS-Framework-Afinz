import {
    toFiniteNumber,
    normalizeText,
    mapSqlToActivity,
} from '../utils/activitySqlMapper';
export { mapSqlToActivity } from '../utils/activitySqlMapper';
import { supabase, supabaseUrl, supabaseKey } from './supabaseClient';
import { Activity, FrameworkRow, Goal } from '../types/framework';
import { DailyAdMetrics, MediaInsight, CampaignMapping } from '../schemas/paid-media';
import { B2CDataRow } from '../types/b2c';
import { parseDate } from '../utils/formatters';
import { getCustoUnitarioCanal, CUSTO_UNITARIO_OFERTA } from '../constants/frameworkFields';
import { classifyRentabilizacao } from '../utils/rentabilizacaoClassify';
import { activityMatchesFrente } from '../utils/activityFrente';
import { format } from 'date-fns';

const PAGE_SIZE = 1000;



const toNonNegativeInt = (value: unknown): number => {
    const num = toFiniteNumber(value);
    if (num <= 0) return 0;
    return Math.round(num);
};

// ── Canonicalização de campanha por adset_id ────────────────────────────────
// No Meta um adset pertence a EXATAMENTE uma campanha. Quando a campanha é
// renomeada, o coletor grava linhas sob o nome novo, fragmentando o histórico
// em vários `campaign` na paid_media_metrics (que não tem campaign_id). Aqui
// unificamos, via union-find sobre adset_id compartilhado, todos os nomes da
// mesma campanha sob um nome canônico (= o nome mais recente = nome atual no
// Meta). É provado-correto: adset compartilhado ⇒ mesma campanha.

interface CampaignCanonicalMap {
    fwd: Record<string, string>;      // nome cru → nome canônico
    groups: Record<string, string[]>; // nome canônico → todos os nomes crus
}

let _canonicalCache: CampaignCanonicalMap | null = null;

/** Constrói o mapa canônico a partir de linhas cruas {campaign, adset_id, date}. */
function computeCampaignCanonicalMap(
    rows: Array<{ campaign: string | null; adset_id: string | null; date: string | null }>
): CampaignCanonicalMap {
    const parent: Record<string, string> = {};
    const ensure = (x: string) => { if (!(x in parent)) parent[x] = x; };
    const find = (x: string): string => {
        let r = x;
        while (parent[r] !== r) r = parent[r];
        while (parent[x] !== r) { const n = parent[x]; parent[x] = r; x = n; }
        return r;
    };
    const union = (a: string, b: string) => {
        ensure(a); ensure(b);
        const ra = find(a), rb = find(b);
        if (ra !== rb) parent[ra] = rb;
    };

    const adsetToCampaign: Record<string, string> = {};
    const maxDate: Record<string, string> = {};

    for (const r of rows) {
        const c = r.campaign;
        if (!c) continue;
        ensure(c);
        const d = (r.date || '').substring(0, 10);
        if (d && (!maxDate[c] || d > maxDate[c])) maxDate[c] = d;
        if (r.adset_id) {
            const prev = adsetToCampaign[r.adset_id];
            if (prev && prev !== c) union(prev, c);
            else if (!prev) adsetToCampaign[r.adset_id] = c;
        }
    }

    // Agrupa por componente e escolhe o canônico (nome mais recente; empate → mais curto)
    const comps: Record<string, string[]> = {};
    for (const c of Object.keys(parent)) {
        const root = find(c);
        (comps[root] ||= []).push(c);
    }

    const fwd: Record<string, string> = {};
    const groups: Record<string, string[]> = {};
    for (const members of Object.values(comps)) {
        let canon = members[0];
        for (const m of members) {
            const md = maxDate[m] || '';
            const cd = maxDate[canon] || '';
            if (md > cd || (md === cd && m.length < canon.length)) canon = m;
        }
        groups[canon] = members;
        for (const m of members) fwd[m] = canon;
    }

    return { fwd, groups };
}

const previewRows = (rows: any[], limit = 3) => rows.slice(0, limit);





// Normaliza Safra para formato canônico YYYY-MM.
// Aceita: '2026-01', '2026/01', 'jan/26', 'Jan/2026', '01/2026', etc.



const mapB2CMetricRow = (row: any): B2CDataRow => ({
    id: row.id,
    created_at: row.created_at,
    data: row.data,
    propostas_b2c_total: toNonNegativeInt(row.propostas_total),
    emissoes_b2c_total: toNonNegativeInt(row.emissoes_total),
    percentual_conversao_b2c: toFiniteNumber(row.percentual_conversao),
    observacoes: row.observacoes || undefined,
    tipo: normalizeText(row.tipo || 'total').toLowerCase(),
    percentual_share: toFiniteNumber(row.percentual_share),
    pct_conv_canal: toFiniteNumber(row.pct_conv_canal),
    user_id: row.user_id || undefined
});

const scoreB2CDataset = (rows: B2CDataRow[]) =>
    rows.reduce((score, row) => {
        const hasBreakdown = Boolean(row.tipo && row.tipo !== 'total');
        const hasChannelMetrics = (row.percentual_share || 0) > 0 || (row.pct_conv_canal || 0) > 0;
        return score + (hasBreakdown ? 5 : 0) + (hasChannelMetrics ? 2 : 0);
    }, 0);



// Helper to map SQL row to Activity


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

        // Seguros pertence à frente de Rentabilização — não deve aparecer na Aquisição.
        // (As campanhas de Seguros vivem em rentabilizacao_activities; sem perda.)
        return allRows
            .map(mapSqlToActivity)
            .filter((a) => a.bu !== 'Seguros' && activityMatchesFrente(a, 'aquisicao'));
    },

    /** Frente de Rentabilização: lê a tabela `rentabilizacao_activities`.
     *  Mesma estrutura de `fetchActivities` — reusa `mapSqlToActivity` (os KPIs de
     *  engajamento: baseEnviada/baseEntregue/aberturas/cliques já são mapeados). */
    async fetchRentabilizacaoActivities(): Promise<Activity[]> {
        const allRows: any[] = [];
        let from = 0;

        while (true) {
            const to = from + PAGE_SIZE - 1;
            const { data, error } = await supabase
                .from('rentabilizacao_activities')
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

        // Classificação determinística Segmento/Subgrupo a partir da jornada
        // (garante exibição correta independentemente do estado do banco).
        return allRows
            .map((row) => {
                const activity = mapSqlToActivity(row);
                const { segmento, subgrupo } = classifyRentabilizacao(activity.jornada);
                return { ...activity, segmento, subgrupo };
            })
            .filter((activity) => activityMatchesFrente(activity, 'rentabilizacao'));
    },

    async fetchB2CMetrics(): Promise<B2CDataRow[]> {
        const { data: typedData, error: typedError } = await supabase
            .from('b2c_daily')
            .select('*')
            .order('data', { ascending: false });

        const { data, error } = await supabase
            .from('b2c_daily_metrics')
            .select('*')
            .order('data', { ascending: false });

        if (error) throw error;

        const typedRows = !typedError && typedData ? typedData.map(mapB2CMetricRow) : [];
        const legacyRows = (data || []).map(mapB2CMetricRow);

        if (typedRows.length === 0) return legacyRows;
        if (legacyRows.length === 0) return typedRows;

        return scoreB2CDataset(legacyRows) > scoreB2CDataset(typedRows)
            ? legacyRows
            : typedRows;
    },

    /** Mapa de canonicalização de campanha (raw→canônico) por adset_id compartilhado.
     *  Cache de sessão; pode ser semeado por fetchPaidMediaByAd p/ evitar 2º scan. */
    async getCampaignCanonicalMap(force = false): Promise<CampaignCanonicalMap> {
        if (_canonicalCache && !force) return _canonicalCache;
        let rows: Array<{ campaign: string | null; adset_id: string | null; date: string | null }> = [];
        let page = 0;
        while (true) {
            const { data, error } = await supabase
                .from('paid_media_metrics')
                .select('campaign, adset_id, date')
                .order('date', { ascending: false })
                .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
            if (error) throw error;
            if (!data || data.length === 0) break;
            rows = rows.concat(data as any);
            if (data.length < PAGE_SIZE) break;
            page++;
        }
        _canonicalCache = computeCampaignCanonicalMap(rows);
        return _canonicalCache;
    },

    async fetchPaidMedia(): Promise<DailyAdMetrics[]> {
        const [{ data, error }, mappings, canon] = await Promise.all([
            supabase
                .from('paid_media_metrics')
                .select('*')
                .order('date', { ascending: false }),
            dataService.fetchCampaignMappings(),
            dataService.getCampaignCanonicalMap()
        ]);

        if (error) throw error;

        const mappingDict = mappings.reduce((acc, m) => {
            acc[m.campaign_name] = m.objective;
            return acc;
        }, {} as Record<string, string>);
        // propaga objetivo mapeado do nome cru para o canônico
        for (const [raw, obj] of Object.entries(mappingDict)) {
            const c = canon.fwd[raw];
            if (c && !(c in mappingDict)) mappingDict[c] = obj;
        }

        // Group by date + channel + campaign(canônico) + objective
        const grouped = (data || []).reduce((acc: any, row: any) => {
            const dateStr = row.date.substring(0, 10);
            const canonCampaign = canon.fwd[row.campaign] || row.campaign;
            const key = `${dateStr}_${row.channel}_${canonCampaign}_${row.objective || ''}`;

            if (!acc[key]) {
                acc[key] = {
                    date: new Date(row.date + 'T12:00:00Z'),
                    channel: row.channel,
                    campaign: canonCampaign,
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
            if (mappedObjective === 'seguros' || mappedObjective === 'seguro' || mappedObjective === 'Seguros') mappedObjective = 'seguros';
            if (mappedObjective === 'unknown') mappedObjective = undefined;

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

        // Semeia o cache canônico a partir das linhas já puxadas (evita 2º scan)
        const canon = computeCampaignCanonicalMap(allRows);
        _canonicalCache = canon;
        for (const [raw, obj] of Object.entries(mappingDict)) {
            const c = canon.fwd[raw];
            if (c && !(c in mappingDict)) mappingDict[c] = obj;
        }

        return allRows.map((row: any) => {
            const canonCampaign = canon.fwd[row.campaign] || row.campaign;
            let mappedObjective = mappingDict[row.campaign] || mappingDict[canonCampaign] || row.objective;
            if (mappedObjective === 'conversion') mappedObjective = 'b2c';
            if (mappedObjective === 'brand') mappedObjective = 'marca';
            if (mappedObjective === 'seguros' || mappedObjective === 'seguro' || mappedObjective === 'Seguros') mappedObjective = 'seguros';

            return {
                date: new Date(row.date + 'T12:00:00Z'),
                channel: row.channel,
                campaign: canonCampaign,
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
            if (mappedObjective === 'seguros' || mappedObjective === 'seguro' || mappedObjective === 'Seguros') mappedObjective = 'seguros';

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
        const [{ data, error }, canon] = await Promise.all([
            query,
            dataService.getCampaignCanonicalMap()
        ]);
        if (error) {
            console.error('fetchAdHierarchy error:', error);
            return [];
        }
        return (data || []).map((r: any) => ({
            campaign: canon.fwd[r.campaign] || r.campaign,
            adset_name: r.adset_name,
            ad_name: r.ad_name,
        })) as Array<{ campaign: string; adset_name: string | null; ad_name: string | null }>;
    },

    async fetchDrilldownData(campaign: string, fromDateStr: string, toDateStr: string): Promise<any[]> {
        // `campaign` chega como nome CANÔNICO — expande p/ todos os nomes crus da
        // mesma campanha (renames no Meta) para não perder linhas do histórico.
        const canon = await dataService.getCampaignCanonicalMap();
        const campaignNames = canon.groups[campaign] || [campaign];

        // As datas devem chegar no formato YYYY-MM-DD
        const [{ data, error }, mappings] = await Promise.all([
            supabase
                .from('paid_media_metrics')
                .select('*')
                .in('campaign', campaignNames)
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
            if (mappedObjective === 'seguros' || mappedObjective === 'seguro' || mappedObjective === 'Seguros') mappedObjective = 'seguros';
            
            return {
                date: new Date(row.date + 'T12:00:00Z'),
                channel: row.channel,
                campaign: canon.fwd[row.campaign] || row.campaign,
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

    /** Grava metas herdadas sem sobrescrever um mês que alguém já cadastrou. */
    async insertInheritedGoals(goals: Goal[]) {
        if (goals.length === 0) return;
        const { error } = await supabase
            .from('goals')
            .upsert(goals, { onConflict: 'mes', ignoreDuplicates: true });

        if (error) throw error;
    },

    async upsertB2CMetrics(metrics: B2CDataRow[]) {
        const sqlBatchV4 = metrics.map(m => ({
            data: m.data,
            propostas_total: toNonNegativeInt(m.propostas_b2c_total),
            emissoes_total: toNonNegativeInt(m.emissoes_b2c_total),
            percentual_conversao: toFiniteNumber(m.percentual_conversao_b2c),
            observacoes: m.observacoes || null,
            tipo: normalizeText(m.tipo || 'total').toLowerCase(),
            percentual_share: toFiniteNumber(m.percentual_share),
            pct_conv_canal: toFiniteNumber(m.pct_conv_canal)
        }));

        const syncErrorsV4: string[] = [];

        for (const tableName of ['b2c_daily', 'b2c_daily_metrics']) {
            const { error: deleteError } = await supabase
                .from(tableName)
                .delete()
                .gte('data', '2000-01-01');

            if (deleteError) {
                syncErrorsV4.push(`${tableName}: ${deleteError.message}`);
                continue;
            }

            if (sqlBatchV4.length === 0) continue;

            const { error: insertError } = await supabase
                .from(tableName)
                .insert(sqlBatchV4);

            if (insertError) {
                syncErrorsV4.push(`${tableName}: ${insertError.message}`);
            }
        }

        if (syncErrorsV4.length === 2) {
            console.error('❌ B2C Sync Error:', syncErrorsV4);
            console.error('B2C payload preview:', previewRows(sqlBatchV4));
            throw new Error(`ENGINEERING_FIX_V4: ${syncErrorsV4.join(' | ')}`);
        }

        return;

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
        return (data || []).map((target: any) => ({
            ...target,
            value: Number(target.target_value ?? target.value) || 0,
        }));
    },

    async upsertPaidMediaTarget(target: any) {
        // Upsert target using id as the conflict column
        const { value, ...rest } = target;
        const level = rest.level || (rest.objective ? 'objective' : 'global');
        const entityKey = rest.entity_key || rest.objective || '__global__';
        const direction = rest.direction || (
            rest.metric === 'ctr' || ['impressions', 'clicks', 'conversions'].includes(rest.metric)
                ? 'min'
                : rest.metric === 'spend' ? 'range' : 'max'
        );
        const payload = {
            ...rest,
            level,
            entity_key: entityKey,
            direction,
            warning_tolerance_pct: rest.warning_tolerance_pct ?? 10,
            source: rest.source || 'manual',
            target_value: value ?? target.target_value,
        };
        const { error } = await supabase.from('paid_media_targets').upsert(payload, { onConflict: 'id' });
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

    async deleteCampaignMapping(campaignName: string) {
        const { error } = await supabase
            .from('paid_media_campaign_mappings')
            .delete()
            .eq('campaign_name', campaignName);
        if (error) throw error;
    },

    /** Retorna nomes únicos de campanhas que existem em paid_media_metrics */
    async fetchDistinctCampaigns(): Promise<string[]> {
        const { data, error } = await supabase
            .from('paid_media_metrics')
            .select('campaign')
            .not('campaign', 'is', null)
            .order('campaign');
        if (error) throw error;
        const unique = [...new Set((data || []).map((d: any) => d.campaign).filter(Boolean))] as string[];
        return unique.sort();
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
    },

    // ─── Campaign Budget Management ───────────────────────────────────────

    async fetchCampaignBudgets(): Promise<any[]> {
        const { data, error } = await supabase.from('campaign_budgets').select('*');
        if (error) throw error;
        return data || [];
    },

    async fetchCampaignBudgetsByObjective(objectiveBudgetId: string): Promise<any[]> {
        const { data, error } = await supabase
            .from('campaign_budgets')
            .select('*')
            .eq('objective_budget_id', objectiveBudgetId);
        if (error) throw error;
        return data || [];
    },

    async fetchCampaignBudgetsByMonth(month: string): Promise<any[]> {
        const { data, error } = await supabase
            .from('campaign_budgets')
            .select('*')
            .eq('month', month);
        if (error) throw error;
        return data || [];
    },

    async upsertCampaignBudget(budget: any) {
        // Upsert campaign budget using id as the conflict column
        const { error } = await supabase.from('campaign_budgets').upsert(budget, { onConflict: 'id' });
        if (error) throw error;
    },

    async deleteCampaignBudget(id: string) {
        const { error } = await supabase.from('campaign_budgets').delete().eq('id', id);
        if (error) throw error;
    },

    async updateCampaignBudgetAllocations(updates: Array<{ id: string; allocated_budget: number }>) {
        // Batch update allocated budgets for multiple campaigns
        for (const update of updates) {
            const { error } = await supabase
                .from('campaign_budgets')
                .update({ allocated_budget: update.allocated_budget })
                .eq('id', update.id);
            if (error) throw error;
        }
    },

    // ─── Paid Media Objectives ─────────────────────────────────────────────

    async fetchObjectives(): Promise<Array<{ key: string; label: string; color: string; sort_order: number }>> {
        const { data, error } = await supabase
            .from('paid_media_objectives')
            .select('key, label, color, sort_order')
            .order('sort_order', { ascending: true });
        if (error) throw error;
        return data || [];
    },

    async upsertObjective(obj: { key: string; label: string; color: string; sort_order?: number }): Promise<void> {
        const { error } = await supabase
            .from('paid_media_objectives')
            .upsert({ ...obj, updated_at: new Date().toISOString() }, { onConflict: 'key' });
        if (error) throw error;
    },

    async deleteObjective(key: string): Promise<void> {
        const { error } = await supabase
            .from('paid_media_objectives')
            .delete()
            .eq('key', key);
        if (error) throw error;
    },
};
