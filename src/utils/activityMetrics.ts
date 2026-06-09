import { Activity } from '../types/framework';
import { CUSTO_UNITARIO_CANAL, CUSTO_UNITARIO_OFERTA } from '../constants/frameworkFields';

/**
 * Converte qualquer valor (string com "R$", "%", separador BR, número ou null)
 * para um número finito. Retorna 0 quando não houver valor válido.
 */
export const toNum = (value: unknown): number => {
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    if (value === null || value === undefined) return 0;
    const cleaned = String(value)
        .replace(/[R$\s%]/g, '')
        .replace(/\.(?=\d{3}(\D|$))/g, '') // remove separador de milhar "1.234"
        .replace(',', '.');
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
};

/** Normaliza uma taxa para fração 0–1 (aceita 0.05, 5 (=5%) ou "5%"). */
const toRate = (value: unknown): number => {
    const n = toNum(value);
    if (n <= 0) return 0;
    return n > 1 ? n / 100 : n;
};

const safeDiv = (a: number, b: number): number => (b > 0 ? a / b : 0);

export interface DerivedMetrics {
    // Volumes
    baseEnviada: number;
    baseEntregue: number;
    aberturas: number;
    cliques: number;
    propostas: number;
    aprovados: number;
    cartoes: number;
    // Financeiro
    custoUnitarioOferta: number;
    custoUnitarioCanal: number;
    custoTotal: number;
    cac: number;
    // Taxas (frações 0–1)
    taxaEntrega: number;
    taxaAbertura: number;
    taxaClique: number;
    taxaProposta: number;
    taxaAprovacao: number;
    taxaFinalizacao: number;
    taxaConversao: number;
}

/**
 * Calcula as métricas derivadas de um disparo.
 *
 * Conversão, Custo Total e CAC frequentemente vêm nulos do banco — então são
 * COMPUTADOS aqui a partir do volume e dos custos unitários (canal/oferta),
 * usando os valores do banco apenas quando já existirem.
 */
export const deriveActivityMetrics = (activity: Activity): DerivedMetrics => {
    const k = activity.kpis;
    const raw = activity.raw || ({} as Activity['raw']);

    const baseEnviada = toNum(k.baseEnviada ?? raw['Base Total']);
    const baseEntregue = toNum(k.baseEntregue ?? raw['Base Acionável']);
    const aberturas = toNum(k.aberturas ?? raw['Abertura']);
    const cliques = toNum(k.cliques ?? raw['Cliques']);
    const propostas = toNum(k.propostas ?? raw['Propostas']);
    const aprovados = toNum(k.aprovados ?? raw['Aprovados']);
    const cartoes = toNum(k.cartoes ?? k.emissoes ?? raw['Cartões Gerados']);

    // Custos unitários: usa o do banco, senão a tabela padrão por canal/oferta.
    const custoUnitarioCanal =
        toNum(raw['Custo unitário do canal']) ||
        CUSTO_UNITARIO_CANAL[activity.canal as keyof typeof CUSTO_UNITARIO_CANAL] ||
        0;
    const custoUnitarioOferta =
        toNum(raw['Custo Unitário Oferta']) ||
        CUSTO_UNITARIO_OFERTA[(activity.oferta || '') as keyof typeof CUSTO_UNITARIO_OFERTA] ||
        0;

    // Custo Total: banco → senão Volume × (C.U. Oferta + C.U. Canal)
    const custoTotal =
        toNum(k.custoTotal ?? raw['Custo Total Campanha']) ||
        baseEnviada * (custoUnitarioOferta + custoUnitarioCanal);

    // CAC: banco → senão Custo Total ÷ Cartões
    const cac = toNum(k.cac ?? raw['CAC']) || safeDiv(custoTotal, cartoes);

    // Conversão: banco → senão Cartões ÷ Base Enviada
    const taxaConversao = toRate(k.taxaConversao ?? raw['Taxa de Conversão']) || safeDiv(cartoes, baseEnviada);

    return {
        baseEnviada,
        baseEntregue,
        aberturas,
        cliques,
        propostas,
        aprovados,
        cartoes,
        custoUnitarioOferta,
        custoUnitarioCanal,
        custoTotal,
        cac,
        taxaEntrega: toRate(k.taxaEntrega ?? raw['Taxa de Entrega']) || safeDiv(baseEntregue, baseEnviada),
        taxaAbertura: toRate(k.taxaAbertura ?? raw['Taxa de Abertura']) || safeDiv(aberturas, baseEntregue),
        taxaClique: toRate(k.taxaClique ?? raw['Taxa de Clique']) || safeDiv(cliques, aberturas),
        taxaProposta: toRate(raw['Taxa de Proposta']) || safeDiv(propostas, baseEntregue),
        taxaAprovacao: toRate(k.taxaAprovacao ?? raw['Taxa de Aprovação']) || safeDiv(aprovados, propostas),
        taxaFinalizacao: toRate(k.taxaFinalizacao ?? raw['Taxa de Finalização']) || safeDiv(cartoes, aprovados),
        taxaConversao,
    };
};

/** Soma as métricas derivadas de vários disparos (para o resumo do dia). */
export const aggregateMetrics = (activities: Activity[]) => {
    const list = activities.map(deriveActivityMetrics);
    const sum = (pick: (m: DerivedMetrics) => number) => list.reduce((acc, m) => acc + pick(m), 0);

    const baseEnviada = sum((m) => m.baseEnviada);
    const baseEntregue = sum((m) => m.baseEntregue);
    const cartoes = sum((m) => m.cartoes);
    const custoTotal = sum((m) => m.custoTotal);

    return {
        disparos: activities.length,
        baseEnviada,
        baseEntregue,
        aberturas: sum((m) => m.aberturas),
        cliques: sum((m) => m.cliques),
        propostas: sum((m) => m.propostas),
        aprovados: sum((m) => m.aprovados),
        cartoes,
        custoTotal,
        cac: safeDiv(custoTotal, cartoes),
        taxaConversao: safeDiv(cartoes, baseEnviada),
    };
};
