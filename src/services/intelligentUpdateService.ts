import {
    type CandidateStatus,
    type UpdateDomain,
    type UpdateFlow,
    type IntelligentUpdateMetricPayload,
    type IntelligentUpdateCandidatePayload,
    asDbActivityId,
    numericPatch,
    buildInsertPayload,
    buildRentabilizacaoInsertPayload,
} from '../utils/intelligentUpdatePayload';
export { type IntelligentUpdateMetricPayload, type IntelligentUpdateCandidatePayload, numericPatch, buildInsertPayload } from '../utils/intelligentUpdatePayload';
import { acquisitionJourneyIdentity } from '../utils/intelligentImportRouting';
import { supabase } from './supabaseClient';
import type { Activity } from '../types/framework';
import { classifyRentabilizacao } from '../utils/rentabilizacaoClassify';
import {
    getCustoUnitarioCanal,
    calcularCustoTotalCanal,
    calcularCustoTotalCampanha,
    calcularCACPrevisto,
} from '../constants/frameworkFields';











const journeyFamily = (journey: string) => acquisitionJourneyIdentity(journey)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/\b(JAN|FEV|MAR|ABR|ABRI|MAI|MAIO|JUN|JUL|AGO|SET|OUT|NOV|DEZ)\d{0,4}\b/g, '*')
    .replace(/\bSEMANA\s*\d+(?:\.\d+)?\b/g, 'SEMANA*')
    .replace(/\s+/g, '_');

const persistLearningDecisions = async (
    runId: string,
    candidates: IntelligentUpdateCandidatePayload[]
) => {
    const rows = candidates.flatMap((candidate) => {
        const common = {
            run_id: runId,
            candidate_fingerprint: candidate.dispatchSignature || candidate.key,
            journey_family: journeyFamily(candidate.journey),
        };
        const manualRows = (candidate.manualOverrides ?? []).map((override) => ({
            ...common,
            field: override.field,
            previous_value: override.previousValue == null ? null : String(override.previousValue),
            chosen_value: override.nextValue == null ? null : String(override.nextValue),
            reason: 'Correcao humana no importador inteligente',
            decision_type: 'manual_override',
        }));
        const renameRows = candidate.auditRequired && candidate.accepted ? [{
            ...common,
            field: 'jornada',
            previous_value: candidate.matchedActivity?.jornada ?? null,
            chosen_value: candidate.journey,
            reason: 'Renomeacao de jornada auditada; nome novo do arquivo substitui o historico',
            decision_type: 'journey_rename',
        }] : [];
        return [...manualRows, ...renameRows];
    });
    if (rows.length === 0) return;
    const { error } = await supabase.from('gaas_import_decisions').insert(rows);
    if (error) throw error;
};

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

/**
 * Custo do disparo derivado do canal + base acionável, na tarifa vigente para a data.
 *   Custo total canal    = Base Acionável × Custo unitário do canal (tabela canônica ano-a-ano)
 *   Custo Total Campanha = Custo total canal (+ custo de oferta, hoje 0)
 * Pilar do projeto: o importador não pode gravar disparo sem custo — caso contrário o Report
 * Live lê CAC/custo como `missing` e o scorecard integrado quebra. Retorna {} quando o canal
 * não tem tarifa (ex.: ECRED-API/Indefinido) ou a base ainda não foi observada, para nunca
 * gravar custo zero artificial.
 */


/**
 * CAC derivado do custo total × cartões gerados — CAC = Custo Total Campanha ÷ Cartões.
 * Sem isto o importador gravava custo mas deixava CAC nulo, e o Report Live/scorecard
 * lia CAC ausente mesmo em disparos que converteram. Retorna null quando não há cartões
 * (CAC indefinido) ou custo, para nunca gravar CAC zero/artificial.
 */








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
                throw new Error(`Atualizacao nao confirmada pelo banco: ${row.id}`);
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
    /** Última mudança do run; a diferença para createdAt aproxima a duração da execução. */
    updatedAt: string;
    createdBy: string | null;
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

export const mapRunRow = (row: any): UpdateRunHistoryItem => {
    const summary = (row?.summary ?? {}) as Record<string, any>;
    const candidates = numberFromSummary(summary, 'candidates', 'selected');
    const applied = numberFromSummary(summary, 'applied', 'accepted');
    return {
        id: row?.id,
        createdAt: row?.created_at ?? '',
        updatedAt: row?.updated_at ?? row?.created_at ?? '',
        createdBy: row?.created_by ?? null,
        sourceLabel: row?.source_label ?? 'Dinamica BI',
        domain: row?.domain ?? summary?.domain ?? 'aquisicao',
        status: row?.status ?? 'reviewing',
        pastedRowCount: row?.pasted_row_count > 0 ? row.pasted_row_count : numberFromSummary(summary, 'physicalRows', 'sourceRows'),
        summary,
        metrics: numberFromSummary(summary, 'metrics'),
        applied,
        blocked: Math.max(0, candidates - applied),
    };
};

export const mapCandidateRow = (row: any): UpdateRunCandidateRow => {
    const proposed = (row?.proposed_activity_update ?? {}) as Record<string, any>;
    const saved = row?.after_payload ?? row?.before_payload ?? {};
    return {
        id: row?.id,
        operationType: row?.operation_type ?? 'pending',
        status: row?.status ?? 'pending',
        domain: row?.domain ?? proposed?.domain ?? '',
        targetTable: row?.target_table ?? proposed?.target_table ?? '',
        targetRecordId: row?.target_record_id ?? proposed?.target_record_id ?? null,
        journey: proposed?.journey ?? proposed?.jornada ?? saved.jornada ?? '',
        activityName: proposed?.activity_name ?? proposed?.['Activity name / Taxonomia'] ?? saved['Activity name / Taxonomia'] ?? '',
        channel: proposed?.channel ?? proposed?.Canal ?? saved.Canal ?? '',
        date: proposed?.metric_date ?? String(proposed?.['Data de Disparo'] ?? saved['Data de Disparo'] ?? '').slice(0, 10),
        fieldToReview: row?.field_to_review ?? '',
        suggestion: row?.suggestion ?? '',
        basis: row?.dispatch_order_basis ?? '',
        conflictReason: proposed?.conflict_reason ?? null,
        beforePayload: row?.before_payload ?? null,
        afterPayload: row?.after_payload ?? null,
    };
};

const DOMAIN_HISTORY_TTL_MS = 10 * 60 * 1000;
const DOMAIN_HISTORY_CONCURRENCY = 6;
const domainHistoryCache = new Map<UpdateDomain, { rows: Array<Record<string, any>>; at: number }>();

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
    // Páginas em paralelo (ordem estável por id) e cache na sessão: o mesmo histórico era
    // baixado inteiro, em ~40 chamadas seguidas, a cada arquivo. O cache cai depois de gravar.
    async fetchDomainHistory(domain: UpdateDomain): Promise<Array<Record<string, any>>> {
        const cached = domainHistoryCache.get(domain);
        if (cached && Date.now() - cached.at < DOMAIN_HISTORY_TTL_MS) return cached.rows;
        const table = targetTableForDomain(domain);
        const pageSize = 1000;
        const { count, error: countError } = await supabase.from(table).select('id', { count: 'exact', head: true });
        if (countError) throw countError;
        const pages = Math.max(1, Math.ceil((count ?? 0) / pageSize) + 1);
        const fetchPage = async (page: number) => {
            const { data, error } = await supabase
                .from(table)
                .select('*')
                .order('id', { ascending: true })
                .range(page * pageSize, page * pageSize + pageSize - 1);
            if (error) throw error;
            return data ?? [];
        };
        const results: Array<Array<Record<string, any>>> = new Array(pages);
        let cursor = 0;
        const runner = async () => {
            while (cursor < pages) {
                const page = cursor++;
                results[page] = await fetchPage(page);
            }
        };
        await Promise.all(Array.from({ length: Math.min(DOMAIN_HISTORY_CONCURRENCY, pages) }, runner));
        const rows = results.flat();
        domainHistoryCache.set(domain, { rows, at: Date.now() });
        return rows;
    },

    invalidateDomainHistory(domain?: UpdateDomain) {
        if (domain) domainHistoryCache.delete(domain);
        else domainHistoryCache.clear();
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

    // Página do histórico com total, filtrada no servidor (a tela não baixa tudo).
    async fetchUpdateRunPage(options: {
        page: number;
        pageSize: number;
        domain?: string;
        status?: string;
        sinceIso?: string;
    }): Promise<{ items: UpdateRunHistoryItem[]; total: number }> {
        const from = options.page * options.pageSize;
        let query = supabase
            .from('gaas_update_runs')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(from, from + options.pageSize - 1);
        if (options.domain) query = query.eq('domain', options.domain);
        if (options.status) query = query.eq('status', options.status);
        if (options.sinceIso) query = query.gte('created_at', options.sinceIso);
        const { data, error, count } = await query;
        if (error) throw error;
        return { items: (data ?? []).map(mapRunRow), total: count ?? 0 };
    },

    // Linha do tempo leve para o quadro de status das bases (só as colunas necessárias).
    async fetchUpdateRunActivity(sinceIso: string): Promise<Array<{ id: string; createdAt: string; domain: string; status: string }>> {
        const { data, error } = await supabase
            .from('gaas_update_runs')
            .select('id, created_at, domain, status')
            .gte('created_at', sinceIso)
            .order('created_at', { ascending: false })
            .limit(1000);
        if (error) throw error;
        return (data ?? []).map((row: any) => ({ id: row.id, createdAt: row.created_at, domain: row.domain ?? '', status: row.status ?? '' }));
    },

    // Última gravação concluída de cada frente, para o selo de frescor.
    async fetchLatestAppliedRuns(): Promise<Array<{ createdAt: string; domain: string }>> {
        const { data, error } = await supabase
            .from('gaas_update_runs')
            .select('created_at, domain')
            .eq('status', 'applied')
            .order('created_at', { ascending: false })
            .limit(200);
        if (error) throw error;
        return (data ?? []).map((row: any) => ({ createdAt: row.created_at, domain: row.domain ?? '' }));
    },

    // Execuções gravadas com o mesmo arquivo (mesmo SHA-256). O app grava em summary.sourceHash;
    // cargas por script usam sourceHash, sha256 ou source_sha256 (esta em maiúsculas).
    async findAppliedRunsBySource(hash: string): Promise<Array<{ id: string; createdAt: string; createdBy: string | null; applied: number; domain: string }>> {
        const lower = hash.toLowerCase();
        const upper = hash.toUpperCase();
        const { data, error } = await supabase
            .from('gaas_update_runs')
            .select('id, created_at, created_by, domain, summary->applied')
            .eq('status', 'applied')
            .or(`summary->>sourceHash.eq.${lower},summary->>sha256.eq.${lower},summary->>source_sha256.eq.${upper},summary->>source_sha256.eq.${lower}`)
            .order('created_at', { ascending: false })
            .limit(5);
        if (error) throw error;
        return (data ?? []).map((row: any) => ({
            id: row.id,
            createdAt: row.created_at,
            createdBy: row.created_by ?? null,
            applied: Number(row.applied ?? 0) || 0,
            domain: row.domain ?? '',
        }));
    },

    // Tamanho real e última mudança de cada base, lidos nas próprias tabelas. A lista de
    // execuções só mostra as do usuário (RLS) e carga feita por script não tem autor, então
    // ela sozinha não diz quando a base mudou de verdade.
    async fetchBaseStats(): Promise<Record<UpdateDomain, { count: number | null; lastChange: string | null }>> {
        const read = async (table: 'activities' | 'rentabilizacao_activities') => {
            const [count, last] = await Promise.all([
                supabase.from(table).select('id', { count: 'exact', head: true }),
                supabase.from(table).select('updated_at').order('updated_at', { ascending: false, nullsFirst: false }).limit(1),
            ]);
            return {
                count: count.error ? null : count.count ?? null,
                lastChange: last.error ? null : ((last.data?.[0] as any)?.updated_at ?? null),
            };
        };
        const [aquisicao, rentabilizacao] = await Promise.all([read('activities'), read('rentabilizacao_activities')]);
        return { aquisicao, rentabilizacao };
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
        // A base vai mudar: o próximo arquivo precisa conferir contra o histórico novo.
        domainHistoryCache.clear();
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

        await persistLearningDecisions(run.id, payload.candidates);

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
