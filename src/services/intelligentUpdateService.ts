import { supabase } from './supabaseClient';
import type { Activity } from '../types/framework';
import { classifyRentabilizacao } from '../utils/rentabilizacaoClassify';

type Channel = 'WhatsApp' | 'E-mail' | 'SMS' | 'Push' | 'ECRED-API' | 'Indefinido';
type CandidateStatus = 'ready' | 'review' | 'new' | 'duplicate' | 'conflict' | 'error' | 'ignored';
type SourceBlock = 'whatsapp' | 'email' | 'sms' | 'push' | 'performance';
type UpdateDomain = 'aquisicao' | 'rentabilizacao';
type UpdateFlow = 'total_crm' | UpdateDomain;

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
    domain: UpdateFlow;
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
const BLOCKED_UPLOAD_STATUSES: CandidateStatus[] = ['duplicate', 'error', 'ignored', 'conflict'];

const canApplyCandidate = (candidate: Pick<IntelligentUpdateCandidatePayload, 'accepted' | 'status'>) =>
    candidate.accepted && !BLOCKED_UPLOAD_STATUSES.includes(candidate.status);

const applyConfirmedActivityChanges = async (
    candidates: IntelligentUpdateCandidatePayload[],
    domain: UpdateFlow
) => {
    const confirmedCandidates = candidates.filter(canApplyCandidate);
    if (domain === 'total_crm') {
        const appliedByKey = new Map<string, AppliedTarget>();
        for (const targetDomain of ['aquisicao', 'rentabilizacao'] as const) {
            const domainCandidates = confirmedCandidates.filter((candidate) => candidate.domain === targetDomain);
            if (domainCandidates.length === 0) continue;
            const domainApplied = await applyConfirmedActivityChanges(domainCandidates, targetDomain);
            domainApplied.forEach((target, key) => appliedByKey.set(key, target));
        }
        return appliedByKey;
    }
    const appliedByKey = new Map<string, AppliedTarget>();
    const targetTable = targetTableForDomain(domain);
    const now = new Date().toISOString();
    const insertRows: Array<Record<string, any> & { __candidateKey: string }> = [];
    const updateRows: Array<Record<string, any> & { id: string; __candidateKey: string }> = [];

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
            updateRows.push({
                id: activityId,
                ...numericPatch(candidate),
                __candidateKey: candidate.key,
            });
        } else {
            insertRows.push({
                ...buildInsertPayload(candidate),
                __candidateKey: candidate.key,
                updated_at: now,
            });
        }
    }

    for (const chunk of chunkArray(updateRows, 100)) {
        const rows = chunk.map(({ __candidateKey, ...row }) => row);
        const keyById = new Map(chunk.map((row) => [row.id, row.__candidateKey]));

        const { data, error } = await supabase.rpc('bulk_update_activities_from_json', {
            p_updates: rows,
        });

        if (error) throw error;

        (data || []).forEach((row: any) => {
            const id = row?.id;
            const key = id ? keyById.get(id) : null;
            if (id && key) {
                appliedByKey.set(key, { id, table: targetTable });
            }
        });

        chunk.forEach((row) => {
            if (!appliedByKey.has(row.__candidateKey)) {
                appliedByKey.set(row.__candidateKey, { id: row.id, table: targetTable });
            }
        });

        if (updateRows.length > 100) {
            await new Promise((resolve) => setTimeout(resolve, 50));
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

// ── Historico de atualizacoes (leitura) ──
export interface UpdateRunHistoryItem {
    id: string;
    createdAt: string;
    sourceLabel: string;
    domain: string;
    status: string;
    pastedRowCount: number;
    summary: Record<string, any>;
    metrics: number;
    applied: number;
    blocked: number;
}

export interface UpdateRunCandidateRow {
    id: string;
    operationType: string;
    status: string;
    domain: string;
    targetTable: string;
    targetRecordId: string | null;
    journey: string;
    activityName: string;
    channel: string;
    date: string;
    fieldToReview: string;
    suggestion: string;
    basis: string;
    conflictReason: string | null;
    beforePayload: any;
    afterPayload: any;
}

export interface UpdateRunHistoryDetail {
    run: UpdateRunHistoryItem;
    applied: UpdateRunCandidateRow[];
    blocked: UpdateRunCandidateRow[];
    appliedTotal: number;
    blockedTotal: number;
    appliedCapped: boolean;
    blockedCapped: boolean;
}

const numberFromSummary = (summary: Record<string, any> | null | undefined, ...keys: string[]) => {
    for (const key of keys) {
        const value = summary?.[key];
        if (typeof value === 'number' && Number.isFinite(value)) return value;
        if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) return Number(value);
    }
    return 0;
};

const mapRunRow = (row: any): UpdateRunHistoryItem => {
    const summary = (row?.summary ?? {}) as Record<string, any>;
    const candidates = numberFromSummary(summary, 'candidates');
    const applied = numberFromSummary(summary, 'applied', 'accepted');
    return {
        id: row?.id,
        createdAt: row?.created_at ?? '',
        sourceLabel: row?.source_label ?? 'Dinamica BI',
        domain: row?.domain ?? summary?.domain ?? 'aquisicao',
        status: row?.status ?? 'reviewing',
        pastedRowCount: row?.pasted_row_count ?? 0,
        summary,
        metrics: numberFromSummary(summary, 'metrics'),
        applied,
        blocked: Math.max(0, candidates - applied),
    };
};

const mapCandidateRow = (row: any): UpdateRunCandidateRow => {
    const proposed = (row?.proposed_activity_update ?? {}) as Record<string, any>;
    return {
        id: row?.id,
        operationType: row?.operation_type ?? 'pending',
        status: row?.status ?? 'pending',
        domain: row?.domain ?? proposed?.domain ?? '',
        targetTable: row?.target_table ?? proposed?.target_table ?? '',
        targetRecordId: row?.target_record_id ?? proposed?.target_record_id ?? null,
        journey: proposed?.journey ?? '',
        activityName: proposed?.activity_name ?? '',
        channel: proposed?.channel ?? '',
        date: proposed?.metric_date ?? '',
        fieldToReview: row?.field_to_review ?? '',
        suggestion: row?.suggestion ?? '',
        basis: row?.dispatch_order_basis ?? '',
        conflictReason: proposed?.conflict_reason ?? null,
        beforePayload: row?.before_payload ?? null,
        afterPayload: row?.after_payload ?? null,
    };
};

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

    // Lista os ultimos runs de atualizacao (gaas_update_runs). Numeros agregados
    // vem do summary do proprio run (1 query, sem varrer candidates).
    async fetchUpdateRunHistory(limit = 20): Promise<UpdateRunHistoryItem[]> {
        const { data, error } = await supabase
            .from('gaas_update_runs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);
        if (error) throw error;
        return (data ?? []).map(mapRunRow);
    },

    // Detalhe de um run: candidatos aplicados (insert/upsert/update_metrics) na integra
    // ate um teto, e uma amostra dos bloqueados com o total real. Le proposed_activity_update
    // para jornada/activity/canal/data sem join na tabela de metricas.
    async fetchUpdateRunDetail(
        runId: string,
        options?: { appliedCap?: number; blockedCap?: number }
    ): Promise<UpdateRunHistoryDetail> {
        const appliedCap = options?.appliedCap ?? 500;
        const blockedCap = options?.blockedCap ?? 200;
        const candidateColumns =
            'id, operation_type, status, domain, target_table, target_record_id, field_to_review, suggestion, dispatch_order_basis, before_payload, after_payload, proposed_activity_update';

        const runResult = await supabase
            .from('gaas_update_runs')
            .select('*')
            .eq('id', runId)
            .single();
        if (runResult.error) throw runResult.error;

        const appliedResult = await supabase
            .from('gaas_update_candidates')
            .select(candidateColumns)
            .eq('run_id', runId)
            .eq('status', 'applied')
            .order('operation_type', { ascending: true })
            .limit(appliedCap + 1);
        if (appliedResult.error) throw appliedResult.error;

        const blockedResult = await supabase
            .from('gaas_update_candidates')
            .select(candidateColumns)
            .eq('run_id', runId)
            .neq('status', 'applied')
            .limit(blockedCap + 1);
        if (blockedResult.error) throw blockedResult.error;

        const blockedCountResult = await supabase
            .from('gaas_update_candidates')
            .select('id', { count: 'exact', head: true })
            .eq('run_id', runId)
            .neq('status', 'applied');
        const appliedCountResult = await supabase
            .from('gaas_update_candidates')
            .select('id', { count: 'exact', head: true })
            .eq('run_id', runId)
            .eq('status', 'applied');

        const appliedRows = (appliedResult.data ?? []).map(mapCandidateRow);
        const blockedRows = (blockedResult.data ?? []).map(mapCandidateRow);

        return {
            run: mapRunRow(runResult.data),
            applied: appliedRows.slice(0, appliedCap),
            blocked: blockedRows.slice(0, blockedCap),
            appliedTotal: appliedCountResult.count ?? appliedRows.length,
            blockedTotal: blockedCountResult.count ?? blockedRows.length,
            appliedCapped: appliedRows.length > appliedCap,
            blockedCapped: blockedRows.length > blockedCap,
        };
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
        // PILAR (2026-07-08): o Atualizador Inteligente parou de auditar metrica-a-metrica
        // e candidato-a-candidato em gaas_dinamica_bi_metrics/gaas_update_candidates. As duas
        // tabelas nao tinham nenhum leitor no app (so escrita) e somaram ~1,28 GB de um limite
        // de 0,5 GB no Supabase Free. O historico de runs (gaas_update_runs.summary, abaixo)
        // continua guardando as contagens agregadas por upload.
        const appliedByKey = await applyConfirmedActivityChanges(payload.candidates, payload.domain);
        const now = new Date().toISOString();

        const appliedCount = appliedByKey.size;
        const finalStatus = appliedCount > 0 ? 'applied' : 'reviewing';
        const { error: updateRunError } = await supabase
            .from('gaas_update_runs')
            .update({
                status: finalStatus,
                summary: {
                    ...payload.summary,
                    domain: payload.domain,
                    targetTable: payload.domain === 'total_crm' ? 'roteamento automatico' : targetTableForDomain(payload.domain),
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
                        targetTable: payload.domain === 'total_crm' ? 'roteamento automatico' : targetTableForDomain(payload.domain),
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
