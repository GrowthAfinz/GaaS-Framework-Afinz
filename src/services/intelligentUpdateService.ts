import { supabase } from './supabaseClient';
import type { Activity } from '../types/framework';

type Channel = 'WhatsApp' | 'E-mail' | 'SMS' | 'Push' | 'Indefinido';
type CandidateStatus = 'ready' | 'review' | 'new' | 'duplicate' | 'error';
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
}

export interface IntelligentUpdateCandidatePayload extends IntelligentUpdateMetricPayload {
    status: CandidateStatus;
    matchCount: number;
    matchedActivity?: Activity;
    fieldToReview: string;
    suggestion: string;
    confidence: number;
    previousDispatches: number;
    suggestedOrder: string;
    basis: string;
    excelTsvRow: string;
}

export interface IntelligentUpdateRunPayload {
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

    const suggestedOrderNumber = Number(candidate.suggestedOrder.match(/\d+/)?.[0]);
    if (Number.isFinite(suggestedOrderNumber)) {
        patch['Ordem de disparo'] = suggestedOrderNumber;
    }

    return {
        ...patch,
        updated_at: new Date().toISOString(),
    };
};

const applyReadyActivityUpdates = async (candidates: IntelligentUpdateCandidatePayload[]) => {
    const readyCandidates = candidates.filter((candidate) =>
        candidate.status === 'ready' && asDbActivityId(candidate.matchedActivity)
    );

    for (const candidate of readyCandidates) {
        const activityId = asDbActivityId(candidate.matchedActivity);
        if (!activityId) continue;

        const { error } = await supabase
            .from('activities')
            .update(numericPatch(candidate))
            .eq('id', activityId);

        if (error) throw error;
    }

    return readyCandidates.length;
};

export const intelligentUpdateService = {
    async saveRun(payload: IntelligentUpdateRunPayload): Promise<IntelligentUpdateRunResult> {
        const { data: run, error: runError } = await supabase
            .from('gaas_update_runs')
            .insert({
                source_type: 'paste',
                source_label: 'Dinamica BI colada',
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

        const appliedCount = await applyReadyActivityUpdates(payload.candidates);
        const now = new Date().toISOString();

        const candidateRows = payload.candidates.map((candidate) => {
            const activityId = asDbActivityId(candidate.matchedActivity);
            const wasApplied = candidate.status === 'ready' && Boolean(activityId);

            return {
                run_id: run.id,
                metric_id: metricIdByKey.get(candidate.key) ?? null,
                activity_id: activityId,
                status: wasApplied ? 'applied' : candidate.status,
                match_count: candidate.matchCount,
                field_to_review: candidate.fieldToReview,
                suggestion: candidate.suggestion,
                confidence: candidate.confidence,
                previous_dispatches_count: candidate.previousDispatches,
                suggested_dispatch_order: candidate.suggestedOrder,
                dispatch_order_basis: candidate.basis,
                excel_tsv_row: candidate.excelTsvRow,
                proposed_activity_update: {
                    ...numericPatch(candidate),
                    activity_name: candidate.activityName,
                    channel: candidate.channel,
                    metric_date: candidate.date,
                    applied_automatically: wasApplied,
                },
                applied_at: wasApplied ? now : null,
            };
        });

        const { error: candidatesError } = candidateRows.length > 0
            ? await supabase.from('gaas_update_candidates').insert(candidateRows)
            : { error: null };

        if (candidatesError) throw candidatesError;

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
