import { supabase } from './supabaseClient';
import type { Activity } from '../types/framework';

type Channel = 'WhatsApp' | 'E-mail' | 'SMS' | 'Push' | 'Indefinido';
type CandidateStatus = 'ready' | 'review' | 'new' | 'duplicate' | 'conflict' | 'error' | 'ignored';
type SourceBlock = 'whatsapp' | 'email' | 'sms' | 'push' | 'performance';

export interface IntelligentUpdateMetricPayload {
    key: string;
    sourceBlock: SourceBlock;
    sourceBlocks?: SourceBlock[];
    journey: string;
    activityName: string;
    date: string;
    channel: Channel;
    sent?: number;
    delivered?: number;
    opens?: number;
    clicks?: number;
    proposals?: number;
    approved?: number;
    finalized?: number;
    assisted?: number;
    independent?: number;
    dispatchSignature?: string;
}

export interface IntelligentUpdateCandidatePayload extends IntelligentUpdateMetricPayload {
    status: CandidateStatus;
    matchCount: number;
    matchedActivity?: Activity;
    fieldToReview: string;
    suggestion: string;
    confidence: number;
    previousDispatches?: number;
    suggestedOrder?: string;
    basis: string;
    excelTsvRow: string;
    accepted?: boolean;
    bu?: string;
    parceiro?: string;
    segmento?: string;
    subgrupo?: string;
    etapaAquisicao?: string;
    perfilCredito?: string;
    produto?: string;
    oferta?: string;
    promocional?: string;
    ordemDisparo?: number;
    conflictJourneys?: string[];
    conflictReason?: string;
}

export interface IntelligentUpdateRunPayload {
    sourceLabel?: string;
    sourceType?: 'paste' | 'csv' | 'xlsx' | 'manual';
    inputLineCount: number;
    blocks: Array<{ key: string; label: string; detected: boolean; rows: number }>;
    metrics: IntelligentUpdateMetricPayload[];
    candidates: IntelligentUpdateCandidatePayload[];
    warnings: string[];
    summary: Record<string, number>;
}

export interface IntelligentUpdateRunResult {
    runId: string;
    metricCount: number;
    candidateCount: number;
    appliedCount: number;
}

const isUuid = (value: unknown): value is string =>
    typeof value === 'string'
    && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

const asDbActivityId = (activity?: Activity): string | null => {
    const rawId = activity?.raw?.id;
    return isUuid(rawId) ? rawId : null;
};

const toTimestamp = (date: string) => `${date}T03:00:00.000Z`;

const numericPatch = (candidate: IntelligentUpdateCandidatePayload) => {
    const patch: Record<string, number | string | null> = {};

    if (candidate.sent !== undefined) patch['Base Total'] = candidate.sent;
    if (candidate.delivered !== undefined) patch['Base Acionável'] = candidate.delivered;
    if (candidate.opens !== undefined) patch['Abertura'] = candidate.opens;
    if (candidate.clicks !== undefined) patch['Cliques'] = candidate.clicks;
    if (candidate.proposals !== undefined) patch['Propostas'] = candidate.proposals;
    if (candidate.approved !== undefined) patch['Aprovados'] = candidate.approved;
    if (candidate.finalized !== undefined) patch['Cartões Gerados'] = candidate.finalized;
    if (candidate.assisted !== undefined) patch['Emissões Assistidas'] = candidate.assisted;
    if (candidate.independent !== undefined) patch['Emissões Independentes'] = candidate.independent;
    if (candidate.bu) patch['BU'] = candidate.bu;
    if (candidate.parceiro) patch['Parceiro'] = candidate.parceiro;
    if (candidate.segmento) patch['Segmento'] = candidate.segmento;
    if (candidate.subgrupo) patch['Subgrupos'] = candidate.subgrupo;
    if (candidate.etapaAquisicao) patch['Etapa de aquisição'] = candidate.etapaAquisicao;
    if (candidate.perfilCredito) patch['Perfil de Crédito'] = candidate.perfilCredito;
    if (candidate.produto) patch['Produto'] = candidate.produto;
    if (candidate.oferta) patch['Oferta'] = candidate.oferta;
    if (candidate.promocional) patch['Promocional'] = candidate.promocional;
    if (candidate.ordemDisparo !== undefined) patch['Ordem de disparo'] = candidate.ordemDisparo;

    return {
        ...patch,
        updated_at: new Date().toISOString(),
    };
};

const buildInsertPayload = (candidate: IntelligentUpdateCandidatePayload) => ({
    prog_gaas: false,
    status: 'Realizado',
    BU: candidate.bu || 'B2C',
    jornada: candidate.journey,
    'Activity name / Taxonomia': candidate.activityName,
    'Canal': candidate.channel,
    'Data de Disparo': toTimestamp(candidate.date),
    'Data Fim': toTimestamp(candidate.date),
    'Safra': candidate.date ? `${candidate.date.slice(5, 7)}/${candidate.date.slice(2, 4)}` : null,
    'Parceiro': candidate.parceiro || null,
    'Segmento': candidate.segmento || 'CRM',
    'Subgrupos': candidate.subgrupo || null,
    'Etapa de aquisição': candidate.etapaAquisicao || null,
    'Perfil de Crédito': candidate.perfilCredito || null,
    'Produto': candidate.produto || 'Cartao',
    'Oferta': candidate.oferta || null,
    'Promocional': candidate.promocional || null,
    'Oferta 2': 'Padrao',
    'Promocional 2': 'N/A',
    'Ordem de disparo': candidate.ordemDisparo ?? null,
    'Base Total': candidate.sent ?? null,
    'Base Acionável': candidate.delivered ?? null,
    'Abertura': candidate.opens ?? null,
    'Cliques': candidate.clicks ?? null,
    'Cartões Gerados': candidate.finalized ?? null,
    'Aprovados': candidate.approved ?? null,
    'Propostas': candidate.proposals ?? null,
    'Emissões Independentes': candidate.independent ?? null,
    'Emissões Assistidas': candidate.assisted ?? null,
    updated_at: new Date().toISOString(),
});

const applyConfirmedActivityChanges = async (candidates: IntelligentUpdateCandidatePayload[]) => {
    const confirmedCandidates = candidates.filter((candidate) =>
        candidate.accepted
        && !['duplicate', 'error', 'ignored'].includes(candidate.status)
    );
    const appliedByKey = new Map<string, string>();

    for (const candidate of confirmedCandidates) {
        const activityId = asDbActivityId(candidate.matchedActivity);
        if (activityId) {
            const { error } = await supabase
                .from('activities')
                .update(numericPatch(candidate))
                .eq('id', activityId);

            if (error) throw error;
            appliedByKey.set(candidate.key, activityId);
        } else {
            const { data, error } = await supabase
                .from('activities')
                .insert(buildInsertPayload(candidate))
                .select('id')
                .single();

            if (error) throw error;
            if (data?.id) appliedByKey.set(candidate.key, data.id);
        }
    }

    return appliedByKey;
};

const candidateStatusForDb = (status: CandidateStatus) =>
    status === 'conflict' ? 'review' : status;

export const intelligentUpdateService = {
    async saveRun(payload: IntelligentUpdateRunPayload): Promise<IntelligentUpdateRunResult> {
        const { data: run, error: runError } = await supabase
            .from('gaas_update_runs')
            .insert({
                source_type: payload.sourceType ?? 'csv',
                source_label: payload.sourceLabel ?? 'Dinamica BI',
                status: 'reviewing',
                pasted_row_count: payload.inputLineCount,
                detected_blocks: payload.blocks,
                summary: payload.summary,
                warnings: payload.warnings,
            })
            .select('id')
            .single();

        if (runError) throw runError;
        if (!run?.id) throw new Error('Execucao criada sem identificador.');

        const metricRows = payload.metrics.map((metric) => ({
            run_id: run.id,
            source_block: metric.sourceBlock,
            channel: metric.channel,
            journey: metric.journey || null,
            activity_name: metric.activityName,
            metric_date: metric.date,
            sent: metric.sent ?? null,
            delivered: metric.delivered ?? null,
            opens: metric.opens ?? null,
            clicks: metric.clicks ?? null,
            proposals: metric.proposals ?? null,
            approved: metric.approved ?? null,
            finalized: metric.finalized ?? null,
            assisted: metric.assisted ?? null,
            independent: metric.independent ?? null,
            natural_key: metric.key,
            raw_payload: {
                source_blocks: metric.sourceBlocks ?? [metric.sourceBlock],
                dispatch_signature: metric.dispatchSignature ?? null,
            },
        }));

        const { data: insertedMetrics, error: metricsError } = metricRows.length > 0
            ? await supabase
                .from('gaas_dinamica_bi_metrics')
                .insert(metricRows)
                .select('id,natural_key')
            : { data: [], error: null };

        if (metricsError) throw metricsError;

        const metricIdByKey = new Map(
            (insertedMetrics || []).map((metric: any) => [metric.natural_key, metric.id])
        );

        const appliedByKey = await applyConfirmedActivityChanges(payload.candidates);
        const now = new Date().toISOString();

        const candidateRows = payload.candidates.map((candidate) => {
            const existingActivityId = asDbActivityId(candidate.matchedActivity);
            const appliedActivityId = appliedByKey.get(candidate.key) ?? existingActivityId;
            const wasApplied = Boolean(appliedByKey.get(candidate.key));

            return {
                run_id: run.id,
                metric_id: metricIdByKey.get(candidate.key) ?? null,
                activity_id: appliedActivityId ?? null,
                status: wasApplied ? 'applied' : candidateStatusForDb(candidate.status),
                match_count: candidate.matchCount,
                field_to_review: candidate.fieldToReview,
                suggestion: candidate.suggestion,
                confidence: candidate.confidence,
                previous_dispatches_count: candidate.previousDispatches ?? 0,
                suggested_dispatch_order: candidate.suggestedOrder ?? null,
                dispatch_order_basis: candidate.basis,
                excel_tsv_row: candidate.excelTsvRow,
                proposed_activity_update: {
                    ...numericPatch(candidate),
                    activity_name: candidate.activityName,
                    journey: candidate.journey,
                    channel: candidate.channel,
                    metric_date: candidate.date,
                    accepted: Boolean(candidate.accepted),
                    applied_automatically: wasApplied,
                    status_original: candidate.status,
                    conflict_reason: candidate.conflictReason ?? null,
                    conflict_journeys: candidate.conflictJourneys ?? [],
                    dispatch_signature: candidate.dispatchSignature ?? null,
                },
                applied_at: wasApplied ? now : null,
            };
        });

        const { error: candidatesError } = candidateRows.length > 0
            ? await supabase.from('gaas_update_candidates').insert(candidateRows)
            : { error: null };

        if (candidatesError) throw candidatesError;

        const appliedCount = appliedByKey.size;
        const finalStatus = appliedCount > 0 ? 'applied' : 'reviewing';
        const { error: updateRunError } = await supabase
            .from('gaas_update_runs')
            .update({
                status: finalStatus,
                summary: {
                    ...payload.summary,
                    metrics: payload.metrics.length,
                    candidates: payload.candidates.length,
                    applied: appliedCount,
                },
                updated_at: now,
            })
            .eq('id', run.id);

        if (updateRunError) throw updateRunError;

        return {
            runId: run.id,
            metricCount: payload.metrics.length,
            candidateCount: payload.candidates.length,
            appliedCount,
        };
    },
};
