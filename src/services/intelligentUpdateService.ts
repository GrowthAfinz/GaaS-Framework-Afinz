import { supabase } from './supabaseClient';
import type { Activity } from '../types/framework';
import { classifyRentabilizacao } from '../utils/rentabilizacaoClassify';

type Channel = 'WhatsApp' | 'E-mail' | 'SMS' | 'Push' | 'ECRED-API' | 'Indefinido';
type CandidateStatus = 'ready' | 'review' | 'new' | 'duplicate' | 'conflict' | 'error' | 'ignored';
type SourceBlock = 'whatsapp' | 'email' | 'sms' | 'push' | 'performance';
type UpdateDomain = 'aquisicao' | 'rentabilizacao';

export interface IntelligentUpdateMetricPayload {
    domain?: UpdateDomain;
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
    metricRefresh?: boolean;
    manualOverrides?: Array<{
        field: string;
        previousValue?: string | number;
        nextValue?: string | number;
        mode: 'single' | 'bulk';
        changedAt: string;
    }>;
}

export interface IntelligentUpdateRunPayload {
    domain: UpdateDomain;
    sourceLabel?: string;
    sourceType?: 'paste' | 'csv' | 'xlsx' | 'manual';
    inputLineCount: number;
    blocks: Array<{ key: string; label: string; detected: boolean; rows: number }>;
    metrics: IntelligentUpdateMetricPayload[];
    candidates: IntelligentUpdateCandidatePayload[];
    warnings: string[];
    summary: Record<string, number | string>;
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

const textOrFallback = (value: unknown, fallback = 'N/A') => {
    const text = value === undefined || value === null ? '' : String(value).trim();
    return text || fallback;
};

const chunkArray = <T,>(items: T[], size: number) => {
    const chunks: T[][] = [];
    for (let i = 0; i < items.length; i += size) {
        chunks.push(items.slice(i, i + size));
    }
    return chunks;
};

const targetTableForDomain = (domain: UpdateDomain) =>
    domain === 'rentabilizacao' ? 'rentabilizacao_activities' : 'activities';

const optionalAuditColumnError = (error: any) => {
    const message = `${error?.message ?? ''} ${error?.details ?? ''} ${error?.hint ?? ''}`;
    return /domain|target_table|target_record_id/i.test(message)
        && /column|schema cache|could not find|does not exist/i.test(message);
};

const stripOptionalAuditColumns = <T extends Record<string, any>>(row: T) => {
    const { domain, target_table, target_record_id, ...rest } = row;
    return rest;
};

const insertWithOptionalAuditColumns = async <T extends Record<string, any>>(
    tableName: string,
    rows: T[],
    selectColumns?: string
) => {
    let query = supabase.from(tableName).insert(rows);
    if (selectColumns) query = query.select(selectColumns);
    const result = await query;
    if (!result.error || !optionalAuditColumnError(result.error)) return result;

    let fallbackQuery = supabase.from(tableName).insert(rows.map(stripOptionalAuditColumns));
    if (selectColumns) fallbackQuery = fallbackQuery.select(selectColumns);
    return fallbackQuery;
};

const numericPatch = (candidate: IntelligentUpdateCandidatePayload) => {
    const patch: Record<string, number | string | null> = {};
    const manuallyChanged = new Set((candidate.manualOverrides ?? []).map((override) => override.field));
    const includeDimension = (field: string) => !candidate.metricRefresh || manuallyChanged.has(field);

    if (candidate.sent !== undefined) patch['Base Total'] = candidate.sent;
    if (candidate.delivered !== undefined) patch['Base Acionável'] = candidate.delivered;
    if (candidate.opens !== undefined) patch['Abertura'] = candidate.opens;
    if (candidate.clicks !== undefined) patch['Cliques'] = candidate.clicks;
    if (candidate.proposals !== undefined) patch['Propostas'] = candidate.proposals;
    if (candidate.approved !== undefined) patch['Aprovados'] = candidate.approved;
    if (candidate.finalized !== undefined) patch['Cartões Gerados'] = candidate.finalized;
    if (candidate.assisted !== undefined) patch['Emissões Assistidas'] = candidate.assisted;
    if (candidate.independent !== undefined) patch['Emissões Independentes'] = candidate.independent;
    if (candidate.bu && includeDimension('bu')) patch['BU'] = candidate.bu;
    if (candidate.parceiro && includeDimension('parceiro')) patch['Parceiro'] = candidate.parceiro;
    if (candidate.segmento && includeDimension('segmento')) patch['Segmento'] = candidate.segmento;
    if (candidate.subgrupo && includeDimension('subgrupo')) patch['Subgrupos'] = candidate.subgrupo;
    if (candidate.etapaAquisicao && includeDimension('etapaAquisicao')) patch['Etapa de aquisição'] = candidate.etapaAquisicao;
    if (candidate.perfilCredito && includeDimension('perfilCredito')) patch['Perfil de Crédito'] = candidate.perfilCredito;
    if (candidate.produto && includeDimension('produto')) patch['Produto'] = candidate.produto;
    if (candidate.oferta && includeDimension('oferta')) patch['Oferta'] = candidate.oferta;
    if (candidate.promocional && includeDimension('promocional')) patch['Promocional'] = candidate.promocional;
    if (candidate.ordemDisparo !== undefined && includeDimension('ordemDisparo')) patch['Ordem de disparo'] = candidate.ordemDisparo;
    // Renomeia a jornada canonica quando o disparo ja existe na base sob nome antigo
    // (BI renomeou no SFMC). Aplicado apenas em candidatos aceitos pelo humano.
    if (candidate.journey && !candidate.metricRefresh) patch['jornada'] = candidate.journey;

    return {
        ...patch,
        updated_at: new Date().toISOString(),
    };
};

const buildInsertPayload = (candidate: IntelligentUpdateCandidatePayload) => ({
    prog_gaas: false,
    status: 'Realizado',
    BU: textOrFallback(candidate.bu, 'B2C'),
    jornada: candidate.journey,
    'Activity name / Taxonomia': candidate.activityName,
    'Canal': candidate.channel,
    'Data de Disparo': toTimestamp(candidate.date),
    'Data Fim': toTimestamp(candidate.date),
    'Safra': candidate.date ? `${candidate.date.slice(5, 7)}/${candidate.date.slice(2, 4)}` : null,
    'Parceiro': textOrFallback(candidate.parceiro),
    'Segmento': textOrFallback(candidate.segmento, 'CRM'),
    'Subgrupos': textOrFallback(candidate.subgrupo),
    'Etapa de aquisição': textOrFallback(candidate.etapaAquisicao),
    'Perfil de Crédito': textOrFallback(candidate.perfilCredito),
    'Produto': textOrFallback(candidate.produto, 'Cartao'),
    'Oferta': textOrFallback(candidate.oferta, 'Padrao'),
    'Promocional': textOrFallback(candidate.promocional),
    'Oferta 2': 'Padrao',
    'Promocional 2': 'N/A',
    'Ordem de disparo': candidate.ordemDisparo ?? null,
    'Base Total': candidate.sent ?? null,
    'Base Acionável': candidate.delivered ?? null,
    'Abertura': candidate.opens ?? null,
    'Cliques': candidate.clicks ?? null,
    'Cartões Gerados': candidate.finalized ?? 0,
    'Aprovados': candidate.approved ?? 0,
    'Propostas': candidate.proposals ?? 0,
    'Emissões Independentes': candidate.independent ?? 0,
    'Emissões Assistidas': candidate.assisted ?? 0,
    updated_at: new Date().toISOString(),
});

const buildRentabilizacaoInsertPayload = (candidate: IntelligentUpdateCandidatePayload) => {
  // Segmento/Subgrupo determinísticos a partir da jornada (taxonomia de Rentabilização).
  const { segmento: segmentoClassificado, subgrupo: subgrupoClassificado } =
    classifyRentabilizacao(`${candidate.journey} ${candidate.activityName}`);
  return {
    prog_gaas: false,
    status: 'Enviado',
    BU: textOrFallback(candidate.bu, 'Cartoes'),
    jornada: candidate.journey,
    'Activity name / Taxonomia': candidate.activityName,
    'Canal': candidate.channel,
    'Data de Disparo': toTimestamp(candidate.date),
    'Parceiro': textOrFallback(candidate.parceiro),
    'Segmento': segmentoClassificado || textOrFallback(candidate.segmento, 'Rentabilizacao'),
    'Subgrupos': subgrupoClassificado || textOrFallback(candidate.subgrupo),
    'Etapa de aquisição': textOrFallback(candidate.etapaAquisicao, 'Rentabilizacao'),
    'Perfil de Crédito': textOrFallback(candidate.perfilCredito),
    'Produto': textOrFallback(candidate.produto, 'Cartao'),
    'Oferta': textOrFallback(candidate.oferta, 'Padrao'),
    'Promocional': textOrFallback(candidate.promocional),
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
  };
};

type AppliedTarget = { id: string; table: string };

const applyConfirmedActivityChanges = async (
    candidates: IntelligentUpdateCandidatePayload[],
    domain: UpdateDomain
) => {
    const confirmedCandidates = candidates.filter((candidate) =>
        candidate.accepted
        && !['duplicate', 'error', 'ignored'].includes(candidate.status)
    );
    const appliedByKey = new Map<string, AppliedTarget>();
    const targetTable = targetTableForDomain(domain);
    const now = new Date().toISOString();
    const insertRows: Array<Record<string, any> & { __candidateKey: string }> = [];

    if (domain === 'rentabilizacao') {
        const rows = confirmedCandidates.map((candidate) => ({
            ...buildRentabilizacaoInsertPayload(candidate),
            __candidateKey: candidate.key,
            updated_at: now,
        }));

        for (const chunk of chunkArray(rows, 100)) {
            const candidateKeys = chunk.map((row) => row.__candidateKey);
            const upsertRows = chunk.map(({ __candidateKey, ...row }) => row);

            const { data, error } = await supabase
                .from('rentabilizacao_activities')
                .upsert(upsertRows, { onConflict: '"Activity name / Taxonomia","Canal","Data de Disparo"' })
                .select('id');

            if (error) throw error;

            (data || []).forEach((row: any, index: number) => {
                if (candidateKeys[index]) {
                    appliedByKey.set(candidateKeys[index], { id: row?.id ?? '', table: targetTable });
                }
            });

            candidateKeys.forEach((key) => {
                if (!appliedByKey.has(key)) appliedByKey.set(key, { id: '', table: targetTable });
            });

            if (rows.length > 100) {
                await new Promise((resolve) => setTimeout(resolve, 50));
            }
        }

        return appliedByKey;
    }

    for (const candidate of confirmedCandidates) {
        const activityId = asDbActivityId(candidate.matchedActivity);
        const requiresExistingTarget = candidate.metricRefresh
            || candidate.conflictReason === 'existing_dispatch'
            || candidate.conflictReason === 'renamed_journey_existing_dispatch';

        if (requiresExistingTarget && !activityId) {
            throw new Error(
                `Atualizacao bloqueada para ${candidate.activityName}: o disparo existe na base, mas o id do registro nao foi resolvido.`
            );
        }

        if (activityId) {
            const { error } = await supabase
                .from('activities')
                .update(numericPatch(candidate))
                .eq('id', activityId);

            if (error) throw error;
            appliedByKey.set(candidate.key, { id: activityId, table: targetTable });
        } else {
            insertRows.push({
                ...buildInsertPayload(candidate),
                __candidateKey: candidate.key,
                updated_at: now,
            });
        }
    }

    for (const chunk of chunkArray(insertRows, 100)) {
        const candidateKeys = chunk.map((row) => row.__candidateKey);
        const rows = chunk.map(({ __candidateKey, ...row }) => row);

        const { data, error } = await supabase
            .from('activities')
            .insert(rows)
            .select('id');

        if (error) throw error;

        (data || []).forEach((row: any, index: number) => {
            if (row?.id && candidateKeys[index]) {
                appliedByKey.set(candidateKeys[index], { id: row.id, table: targetTable });
            }
        });

        candidateKeys.forEach((key) => {
            if (!appliedByKey.has(key)) {
                appliedByKey.set(key, { id: '', table: targetTable });
            }
        });

        if (insertRows.length > 100) {
            await new Promise((resolve) => setTimeout(resolve, 50));
        }
    }

    return appliedByKey;
};

const candidateStatusForDb = (status: CandidateStatus) =>
    status === 'conflict' ? 'review' : status;

export const intelligentUpdateService = {
    // Busca os disparos ja gravados na tabela do dominio (activity name, canal, data)
    // para deduplicar contra a base e nao reinserir o que ja existe.
    async fetchExistingDispatches(
        domain: UpdateDomain
    ): Promise<Array<{ activityName: string; channel: string; date: string }>> {
        const table = targetTableForDomain(domain);
        const pageSize = 1000;
        const rows: Array<{ activityName: string; channel: string; date: string }> = [];
        for (let offset = 0; ; offset += pageSize) {
            const { data, error } = await supabase
                .from(table)
                .select('"Activity name / Taxonomia", "Canal", "Data de Disparo"')
                .range(offset, offset + pageSize - 1);
            if (error) throw error;
            const batch = data ?? [];
            batch.forEach((row: any) => rows.push({
                activityName: row['Activity name / Taxonomia'] ?? '',
                channel: row['Canal'] ?? '',
                date: row['Data de Disparo'] ?? '',
            }));
            if (batch.length < pageSize) break;
        }
        return rows;
    },

    // Historico completo da tabela do dominio (todas as colunas) para inteligencia
    // de sugestoes por jornada/segmento. Usado na Rentabilizacao para herdar a
    // classificacao ja existente ao subir novos disparos.
    async fetchDomainHistory(domain: UpdateDomain): Promise<Array<Record<string, any>>> {
        const table = targetTableForDomain(domain);
        const pageSize = 1000;
        const rows: Array<Record<string, any>> = [];
        for (let offset = 0; ; offset += pageSize) {
            const { data, error } = await supabase
                .from(table)
                .select('*')
                .range(offset, offset + pageSize - 1);
            if (error) throw error;
            const batch = data ?? [];
            rows.push(...batch);
            if (batch.length < pageSize) break;
        }
        return rows;
    },

    async saveRun(payload: IntelligentUpdateRunPayload): Promise<IntelligentUpdateRunResult> {
        const runInsertPayload = {
            domain: payload.domain,
            source_type: payload.sourceType ?? 'csv',
            source_label: payload.sourceLabel ?? 'Dinamica BI',
            status: 'reviewing',
            pasted_row_count: payload.inputLineCount,
            detected_blocks: payload.blocks,
            summary: payload.summary,
            warnings: payload.warnings,
        };

        let runResult = await supabase
            .from('gaas_update_runs')
            .insert(runInsertPayload)
            .select('id')
            .single();

        if (runResult.error && optionalAuditColumnError(runResult.error)) {
            const { domain, ...fallbackRunPayload } = runInsertPayload;
            runResult = await supabase
                .from('gaas_update_runs')
                .insert(fallbackRunPayload)
                .select('id')
                .single();
        }

        const { data: run, error: runError } = runResult;

        if (runError) throw runError;
        if (!run?.id) throw new Error('Execucao criada sem identificador.');

        try {
        const metricRows = payload.metrics.map((metric) => ({
            domain: metric.domain ?? payload.domain,
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
                domain: metric.domain ?? payload.domain,
                source_blocks: metric.sourceBlocks ?? [metric.sourceBlock],
                dispatch_signature: metric.dispatchSignature ?? null,
            },
        }));

        const insertedMetrics: Array<{ id: string; natural_key: string }> = [];
        for (const chunk of chunkArray(metricRows, 500)) {
            const { data, error } = await insertWithOptionalAuditColumns('gaas_dinamica_bi_metrics', chunk, 'id,natural_key');

            if (error) throw error;
            insertedMetrics.push(...(data || []));
        }

        const metricIdByKey = new Map(insertedMetrics.map((metric: any) => [metric.natural_key, metric.id]));

        const appliedByKey = await applyConfirmedActivityChanges(payload.candidates, payload.domain);
        const now = new Date().toISOString();

        const candidateRows = payload.candidates.map((candidate) => {
            const existingActivityId = payload.domain === 'aquisicao' ? asDbActivityId(candidate.matchedActivity) : null;
            const appliedTarget = appliedByKey.get(candidate.key);
            const targetRecordId = appliedTarget?.id ?? existingActivityId ?? null;
            const wasApplied = Boolean(appliedTarget);

            return {
                domain: candidate.domain ?? payload.domain,
                target_table: appliedTarget?.table ?? targetTableForDomain(payload.domain),
                target_record_id: targetRecordId,
                run_id: run.id,
                metric_id: metricIdByKey.get(candidate.key) ?? null,
                activity_id: payload.domain === 'aquisicao' ? targetRecordId : null,
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
                    domain: candidate.domain ?? payload.domain,
                    target_table: appliedTarget?.table ?? targetTableForDomain(payload.domain),
                    target_record_id: targetRecordId,
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
                    manual_overrides: candidate.manualOverrides ?? [],
                },
                applied_at: wasApplied ? now : null,
            };
        });

        for (const chunk of chunkArray(candidateRows, 500)) {
            const { error } = await insertWithOptionalAuditColumns('gaas_update_candidates', chunk);
            if (error) throw error;
        }

        const appliedCount = appliedByKey.size;
        const finalStatus = appliedCount > 0 ? 'applied' : 'reviewing';
        const { error: updateRunError } = await supabase
            .from('gaas_update_runs')
            .update({
                status: finalStatus,
                summary: {
                    ...payload.summary,
                    domain: payload.domain,
                    targetTable: targetTableForDomain(payload.domain),
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
        } catch (error: any) {
            const now = new Date().toISOString();
            await supabase
                .from('gaas_update_runs')
                .update({
                    status: 'failed',
                    error_message: error?.message || 'Falha ao aplicar atualizacao inteligente.',
                    summary: {
                        ...payload.summary,
                        domain: payload.domain,
                        targetTable: targetTableForDomain(payload.domain),
                        metrics: payload.metrics.length,
                        candidates: payload.candidates.length,
                    },
                    updated_at: now,
                })
                .eq('id', run.id);
            throw error;
        }
    },
};
