import type { Activity } from '../types/framework';
import { classifyRentabilizacao } from './rentabilizacaoClassify';
import {getCustoUnitarioCanal,calcularCustoTotalCanal,calcularCustoTotalCampanha,calcularCACPrevisto} from '../constants/frameworkFields';
export type Channel = 'WhatsApp' | 'E-mail' | 'SMS' | 'Push' | 'ECRED-API' | 'Indefinido';

export type CandidateStatus = 'ready' | 'review' | 'new' | 'duplicate' | 'conflict' | 'error' | 'ignored';

export type SourceBlock = 'whatsapp' | 'email' | 'sms' | 'push' | 'performance';

export type UpdateDomain = 'aquisicao' | 'rentabilizacao';

export type UpdateFlow = 'total_crm' | UpdateDomain;

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
    canonicalDimensionRefresh?: boolean;
    canonicalDimensionFields?: string[];
    auditRequired?: boolean;
    manualOverrides?: Array<{
        field: string;
        previousValue?: string | number;
        nextValue?: string | number;
        mode: 'single' | 'bulk';
        changedAt: string;
    }>;
}

export const isUuid = (value: unknown): value is string =>
    typeof value === 'string'
    && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

export const asDbActivityId = (activity?: Activity): string | null => {
    const rawId = activity?.raw?.id;
    return isUuid(rawId) ? rawId : null;
};

export const toTimestamp = (date: string) => `${date}T03:00:00.000Z`;

export const textOrFallback = (value: unknown, fallback = 'N/A') => {
    const text = value === undefined || value === null ? '' : String(value).trim();
    return text || fallback;
};

export const custoPatch = (
    channel: string | undefined,
    baseAcionavel: number | null | undefined,
    date: string | undefined,
): Record<string, number> => {
    if (!channel || baseAcionavel == null || !Number.isFinite(baseAcionavel)) return {};
    const custoUnitCanal = getCustoUnitarioCanal(channel, date);
    if (!custoUnitCanal) return {};
    const custoTotalCanal = calcularCustoTotalCanal(custoUnitCanal, baseAcionavel);
    return {
        'Custo unitário do canal': custoUnitCanal,
        'Custo total canal': custoTotalCanal,
        'Custo Total Campanha': calcularCustoTotalCampanha(0, custoTotalCanal),
    };
};

export const cacFromCusto = (
    custoTotalCampanha: number | null | undefined,
    cartoes: number | null | undefined,
): number | null => {
    if (custoTotalCampanha == null || !Number.isFinite(custoTotalCampanha)) return null;
    if (cartoes == null || !Number.isFinite(cartoes) || cartoes <= 0) return null;
    return calcularCACPrevisto(custoTotalCampanha, cartoes);
};

export const numericPatch = (candidate: IntelligentUpdateCandidatePayload): Record<string, number | string | null> => {
    const patch: Record<string, number | string | null> = {};
    const manuallyChanged = new Set((candidate.manualOverrides ?? []).map((override) => override.field));
    const includeDimension = (field: string) => !candidate.metricRefresh
        || Boolean(candidate.canonicalDimensionRefresh && candidate.canonicalDimensionFields?.includes(field))
        || manuallyChanged.has(field);

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
    if (candidate.journey && (!candidate.metricRefresh || candidate.canonicalDimensionRefresh)) patch['jornada'] = candidate.journey;

    // O RPC calcula custos e CAC com a linha completa, incluindo tarifa e incentivo
    // históricos. Um patch parcial do arquivo não pode zerar esses componentes.
    return { ...patch, updated_at: new Date().toISOString() };
};

export const buildInsertPayload = (candidate: IntelligentUpdateCandidatePayload) => {
  // Custo determinístico por canal × base acionável e CAC derivado dele — calculados
  // uma vez para gravar ambos coerentes no insert (sem isto o CAC nascia nulo).
  const custo = custoPatch(candidate.channel, candidate.delivered ?? null, candidate.date);
  return {
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
    'Cartões Gerados': candidate.finalized ?? null,
    'Aprovados': candidate.approved ?? null,
    'Propostas': candidate.proposals ?? null,
    'Emissões Independentes': candidate.independent ?? null,
    'Emissões Assistidas': candidate.assisted ?? null,
    ...custo,
    'CAC': cacFromCusto(custo['Custo Total Campanha'], candidate.finalized ?? 0),
    updated_at: new Date().toISOString(),
  };
};

export const buildRentabilizacaoInsertPayload = (candidate: IntelligentUpdateCandidatePayload) => {
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
