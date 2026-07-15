import type { PaidMediaObjectiveEntry } from '../types';

/**
 * Linhas cruas de métrica de mídia — o mínimo necessário para reagregar.
 * Aceita qualquer objeto que traga esses campos (campanha, adset, ad ou frente).
 */
export interface AggregatableRow {
    spend: number;
    impressions: number;
    clicks: number;
    conversions: number;
    reach?: number;
}

export interface AggregatedMetrics {
    spend: number;
    impressions: number;
    clicks: number;
    conversions: number;
    reach: number;
    ctr: number;
    cpc: number;
    cpm: number;
    cpa: number;
    frequency: number;
}

/**
 * Agrega volume somando e RECALCULA as taxas a partir das somas.
 * Nunca faz média de médias — CTR/CPC/CPM/CPA/Freq. saem ponderados.
 *
 * ⚠️ reach/frequency são aproximações superiores: a soma de reach ignora a
 * sobreposição de audiência entre anúncios/campanhas. Ver tooltip nas linhas
 * de subtotal/total.
 */
export function aggregate(rows: AggregatableRow[]): AggregatedMetrics {
    const s = rows.reduce(
        (a, r) => ({
            spend: a.spend + (Number(r.spend) || 0),
            impressions: a.impressions + (Number(r.impressions) || 0),
            clicks: a.clicks + (Number(r.clicks) || 0),
            conversions: a.conversions + (Number(r.conversions) || 0),
            reach: a.reach + (Number(r.reach) || 0),
        }),
        { spend: 0, impressions: 0, clicks: 0, conversions: 0, reach: 0 }
    );

    return {
        ...s,
        ctr: s.impressions ? (s.clicks / s.impressions) * 100 : 0, // Σcliques / Σimpr
        cpc: s.clicks ? s.spend / s.clicks : 0,                      // Σspend / Σcliques
        cpm: s.impressions ? (s.spend / s.impressions) * 1000 : 0,
        cpa: s.conversions ? s.spend / s.conversions : 0,           // Σspend / Σconv
        frequency: s.reach ? s.impressions / s.reach : 0,
    };
}

// ── Resolução de Frente de Objetivo ─────────────────────────────────────────

export interface FrenteInfo {
    key: string;
    label: string;
    color: string; // color key do registro (violet/blue/purple/orange/green/...)
}

export const UNMAPPED_FRENTE_KEY = '__unmapped__';

/**
 * Resolve a Frente de Objetivo de uma linha.
 *
 * IMPORTANTE: no fluxo em memória deste módulo, `objective` JÁ chega resolvido
 * para a frente (dataService.fetchPaidMedia aplica o mapping campanha→frente e
 * normaliza brand→marca, conversion→b2c, etc). Portanto aqui basta casar a
 * chave contra o registro `objectives`; não é preciso reconsultar o mapping.
 * Chave ausente ou não encontrada → bucket "Não mapeado".
 */
export function resolveFrente(
    objectiveKey: string | undefined | null,
    objectives: PaidMediaObjectiveEntry[]
): FrenteInfo {
    if (objectiveKey) {
        const hit = objectives.find(o => o.key === objectiveKey);
        if (hit) return { key: hit.key, label: hit.label, color: hit.color };
        // 'b2c' foi consolidado em 'aquisicao' no registro (2026-07-14), mas o
        // fetch ainda pode emitir 'b2c' via conversion→b2c. Redireciona.
        if (objectiveKey === 'b2c') {
            const aqs = objectives.find(o => o.key === 'aquisicao');
            if (aqs) return { key: aqs.key, label: aqs.label, color: aqs.color };
        }
    }
    return { key: UNMAPPED_FRENTE_KEY, label: 'Não mapeado', color: 'slate' };
}

// ── Cores da linha de Frente (classes estáticas — Tailwind-safe) ─────────────

interface FrenteColorClasses {
    rowBg: string;      // fundo da linha-cabeçalho da frente
    leftBorder: string; // borda esquerda de destaque
    chip: string;       // chip com o label da frente
    dot: string;        // bolinha de cor
}

const FRENTE_COLORS: Record<string, FrenteColorClasses> = {
    violet:  { rowBg: 'bg-violet-50/60',  leftBorder: 'border-l-violet-400',  chip: 'bg-violet-100 text-violet-700',  dot: 'bg-violet-400' },
    blue:    { rowBg: 'bg-blue-50/60',    leftBorder: 'border-l-blue-400',    chip: 'bg-blue-100 text-blue-700',      dot: 'bg-blue-400' },
    purple:  { rowBg: 'bg-purple-50/60',  leftBorder: 'border-l-purple-400',  chip: 'bg-purple-100 text-purple-700',  dot: 'bg-purple-400' },
    orange:  { rowBg: 'bg-orange-50/60',  leftBorder: 'border-l-orange-400',  chip: 'bg-orange-100 text-orange-700',  dot: 'bg-orange-400' },
    green:   { rowBg: 'bg-emerald-50/60', leftBorder: 'border-l-emerald-400', chip: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-400' },
    emerald: { rowBg: 'bg-emerald-50/60', leftBorder: 'border-l-emerald-400', chip: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-400' },
    rose:    { rowBg: 'bg-rose-50/60',    leftBorder: 'border-l-rose-400',    chip: 'bg-rose-100 text-rose-700',      dot: 'bg-rose-400' },
    amber:   { rowBg: 'bg-amber-50/60',   leftBorder: 'border-l-amber-400',   chip: 'bg-amber-100 text-amber-700',    dot: 'bg-amber-400' },
    teal:    { rowBg: 'bg-teal-50/60',    leftBorder: 'border-l-teal-400',    chip: 'bg-teal-100 text-teal-700',      dot: 'bg-teal-400' },
    indigo:  { rowBg: 'bg-indigo-50/60',  leftBorder: 'border-l-indigo-400',  chip: 'bg-indigo-100 text-indigo-700',  dot: 'bg-indigo-400' },
    slate:   { rowBg: 'bg-slate-100/70',  leftBorder: 'border-l-slate-400',   chip: 'bg-slate-200 text-slate-600',    dot: 'bg-slate-400' },
};

export function getFrenteColorClasses(colorKey: string): FrenteColorClasses {
    return FRENTE_COLORS[colorKey] ?? FRENTE_COLORS.slate;
}
