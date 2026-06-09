import type { Frente } from '../types/framework';
import type { DerivedMetrics } from '../utils/activityMetrics';

/**
 * Configuração de funil por Frente.
 *
 * - **Aquisição**: funil completo até emissão de cartão (Envio → Entrega → Abertura →
 *   Proposta → Aprovação → Emissão), com CAC/Cartões.
 * - **Rentabilização**: funil de **engajamento** (Envio → Entrega → Abertura → Clique).
 *   Em rentabilização os campos Cartões/Propostas/Aprovados/CAC vêm nulos do banco,
 *   então não são exibidos.
 */

export const isRentabilizacao = (frente: Frente): boolean => frente === 'rentabilizacao';

// ── Métricas agregadas do funil (BottleneckAnalysis) ──────────────────────
export interface FunnelMetricsExt {
    baseEnviada: number;
    baseEntregue: number;
    aberturas: number;
    cliques: number;
    propostas: number;
    aprovados: number;
    emissoes: number;
}

export interface BottleneckStageDef {
    name: string;
    fromKey: keyof FunnelMetricsExt;
    toKey: keyof FunnelMetricsExt;
    causes: string[];
    action: string;
}

const STAGES_AQUISICAO: BottleneckStageDef[] = [
    {
        name: 'Envio → Entrega',
        fromKey: 'baseEnviada',
        toKey: 'baseEntregue',
        causes: ['Base desatualizada', 'Blacklist', 'Reputação do IP'],
        action: 'Higienizar base, verificar reputação',
    },
    {
        name: 'Entrega → Abertura',
        fromKey: 'baseEntregue',
        toKey: 'propostas', // Propostas como proxy de Abertura/Interesse (convenção do histórico)
        causes: ['Assunto fraco', 'Horário ruim', 'Remetente desconhecido'],
        action: 'Teste A/B assunto e horário',
    },
    {
        name: 'Abertura → Proposta',
        fromKey: 'propostas',
        toKey: 'aprovados',
        causes: ['Jornada confusa', 'CTA fraco', 'Instabilidade'],
        action: 'Verificar logs, revisar fluxo no app',
    },
    {
        name: 'Proposta → Emissão',
        fromKey: 'aprovados',
        toKey: 'emissoes',
        causes: ['Critério restritivo', 'Documentação complexa'],
        action: 'Revisar política com crédito',
    },
];

const STAGES_RENTABILIZACAO: BottleneckStageDef[] = [
    {
        name: 'Envio → Entrega',
        fromKey: 'baseEnviada',
        toKey: 'baseEntregue',
        causes: ['Base desatualizada', 'Blacklist', 'Reputação do IP'],
        action: 'Higienizar base, verificar reputação',
    },
    {
        name: 'Entrega → Abertura',
        fromKey: 'baseEntregue',
        toKey: 'aberturas',
        causes: ['Assunto fraco', 'Horário ruim', 'Remetente desconhecido'],
        action: 'Teste A/B de assunto e horário',
    },
    {
        name: 'Abertura → Clique',
        fromKey: 'aberturas',
        toKey: 'cliques',
        causes: ['CTA fraco', 'Conteúdo pouco relevante', 'Oferta sem apelo'],
        action: 'Reforçar CTA e personalizar a oferta de uso/ativação',
    },
];

export const getBottleneckStages = (frente: Frente): BottleneckStageDef[] =>
    isRentabilizacao(frente) ? STAGES_RENTABILIZACAO : STAGES_AQUISICAO;

// ── Passos do funil por disparo (DailyDetailsModal) ───────────────────────
export interface DailyFunnelStep {
    label: string;
    valueKey: keyof DerivedMetrics;
    rateKey?: keyof DerivedMetrics;
    accent?: string;
}

const DAILY_STEPS_AQUISICAO: DailyFunnelStep[] = [
    { label: 'Enviado', valueKey: 'baseEnviada' },
    { label: 'Entregue', valueKey: 'baseEntregue', rateKey: 'taxaEntrega' },
    { label: 'Aberturas', valueKey: 'aberturas', rateKey: 'taxaAbertura' },
    { label: 'Cliques', valueKey: 'cliques', rateKey: 'taxaClique' },
    { label: 'Propostas', valueKey: 'propostas', rateKey: 'taxaProposta' },
    { label: 'Aprovados', valueKey: 'aprovados', rateKey: 'taxaAprovacao' },
    { label: 'Cartões', valueKey: 'cartoes', rateKey: 'taxaFinalizacao', accent: 'text-cyan-700' },
];

const DAILY_STEPS_RENTABILIZACAO: DailyFunnelStep[] = [
    { label: 'Enviado', valueKey: 'baseEnviada' },
    { label: 'Entregue', valueKey: 'baseEntregue', rateKey: 'taxaEntrega' },
    { label: 'Aberturas', valueKey: 'aberturas', rateKey: 'taxaAbertura' },
    { label: 'Cliques', valueKey: 'cliques', rateKey: 'taxaClique', accent: 'text-cyan-700' },
];

export const getDailyFunnelSteps = (frente: Frente): DailyFunnelStep[] =>
    isRentabilizacao(frente) ? DAILY_STEPS_RENTABILIZACAO : DAILY_STEPS_AQUISICAO;
