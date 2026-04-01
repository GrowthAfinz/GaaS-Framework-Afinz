/**
 * Activity Types - Sistema Unificado de Atividades (GaaS + Histórico)
 */

export type ActivityStatus = 'Rascunho' | 'Scheduled' | 'Enviado' | 'Realizado';

export interface ActivityRow {
    // Identificadores
    id: string; // UUID

    // Controle Interno GaaS
    prog_gaas: boolean;
    status: ActivityStatus;
    created_at: string;
    updated_at: string;

    // Campos Core (Dimensões Principais)
    BU: 'B2C' | 'B2B2C' | 'Plurix' | 'Bem Barato' | string;
    jornada: string;
    'Activity name / Taxonomia': string;
    Canal?: string;
    'Data de Disparo': string; // YYYY-MM-DD
    'Data Fim': string; // YYYY-MM-DD
    Safra?: string;

    // Segmentação & Parceiros
    Parceiro?: string;
    SIGLA_Parceiro?: string;
    Segmento: string;
    SIGLA_Segmento?: string;
    Subgrupos?: string;
    'Etapa de aquisição'?: string;
    'Perfil de Crédito'?: string | null;

    // Ofertas
    Produto?: string;
    Oferta?: string | null;
    Promocional?: string | null;
    SIGLA_Oferta?: string;
    'Oferta 2'?: string | null;
    'Promocional 2'?: string | null;
    'Ordem de disparo'?: number;

    // Métricas de Base
    'Base Total'?: number;
    'Base Acionável'?: number;
    Abertura?: number;
    Cliques?: number;
    '% Otimização de base'?: number;

    // Métricas Financeiras
    'Custo Unitário Oferta'?: number;
    'Custo Total da Oferta'?: number;
    'Custo unitário do canal'?: number;
    'Custo total canal'?: number;
    'Custo Total Campanha'?: number;
    CAC?: number;

    // Métricas de Funil (Taxas)
    'Taxa de Entrega'?: number;
    'Taxa de Abertura'?: number;
    'Taxa de Clique'?: number;
    'Taxa de Proposta'?: number;
    'Taxa de Aprovação'?: number;
    'Taxa de Finalização'?: number;
    'Taxa de Conversão'?: number;

    // Volumes (Resultados)
    'Cartões Gerados'?: number;
    Aprovados?: number;
    Propostas?: number;
    'Emissões Independentes'?: number;
    'Emissões Assistidas'?: number;

    // Horário de Disparo
    'Horário de Disparo'?: string; // HH:MM formato
}

// Input do Formulário (Programação)
export type ActivityFormInput = {
    bu: 'B2C' | 'B2B2C' | 'Plurix' | 'Bem Barato';
    jornada: string;
    activityName: string;
    dataInicio: string;
    dataFim: string;
    horarioDisparo: string;

    // Opcionais de Segmentação
    segmento?: string; // Pode vir do contexto ou selecionado
    perfilCredito?: string;

    // Opcionais de Oferta
    oferta?: string;
    promocional?: string;
    oferta2?: string;
    promocional2?: string;

    // Novos campos solicitados
    parceiro?: string;
    subgrupo?: string;
    etapaAquisicao?: string;
    produto?: string;
    baseVolume?: string;

    // Status (controle)
    status: ActivityStatus;
};
