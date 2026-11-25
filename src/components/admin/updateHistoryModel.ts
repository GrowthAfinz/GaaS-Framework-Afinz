/**
 * Regras puras do Histórico de atualizações: frescor de cada base, cargas por dia,
 * rótulo de situação, duração e mudanças campo a campo. Sem React e sem rede.
 */
import type { UpdateRunCandidateRow } from '../../services/intelligentUpdateService';

export type Tone = 'ok' | 'warn' | 'bad' | 'neutral';

export const STALE_AFTER_DAYS = 2;

const pad = (value: number) => String(value).padStart(2, '0');
export const localDayKey = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const shortDate = (date: Date) => `${pad(date.getDate())}/${pad(date.getMonth() + 1)}`;

const BASES = [
    { key: 'aquisicao', label: 'Aquisição', table: 'activities', domains: ['aquisicao', 'total_crm'] },
    { key: 'rentabilizacao', label: 'Rentabilização', table: 'rentabilizacao_activities', domains: ['rentabilizacao', 'total_crm'] },
] as const;

export type DayKind = 'ok' | 'warn' | 'bad' | 'none';
export interface DayCell { date: string; kind: DayKind; label: string }

export interface BaseFreshness {
    key: string;
    label: string;
    table: string;
    days: DayCell[];
    loads: number;
    freshLabel: string;
    tone: Tone;
    /** Linhas na tabela, quando a contagem veio do banco. */
    count: number | null;
}

/** Situação de cada base em cada um dos últimos `days` dias (mais antigo primeiro). */
export function buildDailyActivity(
    runs: Array<{ createdAt: string; domain: string; status: string }>,
    days: number,
    now = new Date(),
): Record<string, DayCell[]> {
    const result: Record<string, DayCell[]> = {};
    for (const base of BASES) {
        const byDay = new Map<string, Set<string>>();
        runs
            .filter((run) => (base.domains as readonly string[]).includes(run.domain))
            .forEach((run) => {
                const date = new Date(run.createdAt);
                if (!Number.isFinite(date.getTime())) return;
                const key = localDayKey(date);
                const set = byDay.get(key) ?? new Set<string>();
                set.add(run.status);
                byDay.set(key, set);
            });
        const cells: DayCell[] = [];
        for (let offset = days - 1; offset >= 0; offset -= 1) {
            const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset);
            const key = localDayKey(day);
            const statuses = byDay.get(key);
            const kind: DayKind = !statuses ? 'none'
                : statuses.has('applied') ? 'ok'
                    : statuses.has('failed') ? 'bad'
                        : 'warn';
            const label = kind === 'none' ? 'sem carga' : kind === 'ok' ? 'gravou' : kind === 'bad' ? 'falhou' : 'em revisão';
            cells.push({ date: key, kind, label });
        }
        result[base.key] = cells;
    }
    return result;
}

export function freshnessLabel(lastIso: string | undefined, now = new Date()): { label: string; tone: Tone; days: number | null } {
    if (!lastIso) return { label: 'sem carga registrada', tone: 'bad', days: null };
    const last = new Date(lastIso);
    if (!Number.isFinite(last.getTime())) return { label: 'sem dado', tone: 'neutral', days: null };
    const startOf = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    const days = Math.round((startOf(now) - startOf(last)) / 86400000);
    const time = `${pad(last.getHours())}:${pad(last.getMinutes())}`;
    const label = days <= 0 ? `hoje · ${time}` : days === 1 ? `ontem · ${time}` : `há ${days} dias · ${shortDate(last)}`;
    return { label, tone: days > STALE_AFTER_DAYS ? 'warn' : 'ok', days };
}

export type BaseChanges = Partial<Record<'aquisicao' | 'rentabilizacao', { count: number | null; lastChange: string | null }>>;

export function buildBaseFreshness(
    latestApplied: Array<{ createdAt: string; domain: string }>,
    daily: Record<string, DayCell[]>,
    now = new Date(),
    baseChanges: BaseChanges = {},
): BaseFreshness[] {
    return BASES.map((base) => {
        const last = latestApplied.find((run) => (base.domains as readonly string[]).includes(run.domain));
        // Vale o mais recente entre a execução que o usuário enxerga e a mudança na própria
        // tabela: carga feita por script não aparece na lista, mas mexe na base.
        const change = baseChanges[base.key]?.lastChange ?? undefined;
        const lastIso = [last?.createdAt, change].filter((value): value is string => Boolean(value))
            .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];
        const fresh = freshnessLabel(lastIso, now);
        const days = daily[base.key] ?? [];
        return {
            key: base.key,
            label: base.label,
            table: base.table,
            days,
            loads: days.filter((day) => day.kind !== 'none').length,
            freshLabel: fresh.label,
            tone: fresh.tone,
            count: baseChanges[base.key]?.count ?? null,
        };
    });
}

export function runStatusMeta(status: string): { label: string; tone: Tone } {
    if (status === 'applied') return { label: 'Concluída', tone: 'ok' };
    if (status === 'failed') return { label: 'Falhou', tone: 'bad' };
    if (status === 'reviewing') return { label: 'Não gravada', tone: 'warn' };
    return { label: status || 'sem dado', tone: 'neutral' };
}

export function durationLabel(startIso: string, endIso: string): string {
    const start = new Date(startIso).getTime();
    const end = new Date(endIso).getTime();
    if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return 'sem dado';
    const seconds = Math.round((end - start) / 1000);
    if (seconds < 60) return `${seconds} s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min ${seconds % 60} s`;
    return `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
}

export const DIFF_METRIC_KEYS = [
    'Base Total',
    'Base Acionável',
    'Abertura',
    'Cliques',
    'Propostas',
    'Aprovados',
    'Cartões Gerados',
    'Emissões Assistidas',
    'Emissões Independentes',
] as const;

const formatValue = (value: unknown) => {
    if (value === null || value === undefined || value === '') return 'sem dado';
    const num = Number(value);
    return Number.isFinite(num) ? num.toLocaleString('pt-BR') : String(value);
};

const formatRowDate = (date: string) => {
    const [year, month, day] = String(date || '').split('-');
    return year && month && day ? `${day}/${month}` : '';
};

export interface FieldChange {
    key: string;
    activityName: string;
    journey: string;
    date: string;
    field: string;
    before: string;
    after: string;
    isNew: boolean;
}

/** Uma linha por campo que mudou; disparo novo vira uma linha só. */
export function buildFieldChanges(applied: UpdateRunCandidateRow[]): FieldChange[] {
    const rows: FieldChange[] = [];
    applied.forEach((row) => {
        const base = { activityName: row.activityName, journey: row.journey, date: formatRowDate(row.date) };
        if (row.operationType === 'insert' || row.operationType === 'upsert') {
            rows.push({ ...base, key: `${row.id}:novo`, field: 'Linha nova', before: 'sem dado', after: 'criada', isNew: true });
            return;
        }
        const before = row.beforePayload ?? {};
        const after = row.afterPayload ?? {};
        DIFF_METRIC_KEYS.forEach((field) => {
            if (!Object.prototype.hasOwnProperty.call(after, field)) return;
            const previous = formatValue(before[field]);
            const next = formatValue(after[field]);
            if (previous === next) return;
            rows.push({ ...base, key: `${row.id}:${field}`, field, before: previous, after: next, isNew: false });
        });
    });
    return rows;
}
