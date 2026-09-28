export interface CanonicalAcquisitionJourney {
    bu?: string;
    parceiro?: string;
    segmento?: string;
    etapaAquisicao?: string;
    source?: string;
    evidence?: string;
}

const normalizeJourneyKey = (value: unknown) =>
    String(value ?? '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ');

const taxonomyTokens = (value: unknown) =>
    normalizeJourneyKey(value)
        .split(/[_\s-]+/)
        .filter(Boolean);

const CANONICAL_JOURNEY_BU: Record<string, string> = {
    b2c: 'B2C',
    b2b2c: 'B2B2C',
    plurix: 'Plurix',
    seguros: 'Seguros',
};

const CANONICAL_JOURNEY_PARTNER: Record<string, string> = {
    bb: 'Bem Barato',
    bbt: 'Bem Barato',
    dia: 'Dia',
    serasa: 'Serasa',
    srs: 'Serasa',
    srsa: 'Serasa',
    ecred: 'Serasa',
    bpc: 'BpC',
    bp: 'Proprietaria',
    bsp: 'Proprietaria',
    propri: 'Proprietaria',
    na: 'N/A',
};

const CANONICAL_JOURNEY_SEGMENT: Record<string, string> = {
    crm: 'CRM',
    ngd: 'Negados',
    negados: 'Negados',
    anc: 'Aprovados_nao_convertidos',
    carrinho: 'Abandonados',
    abandonados: 'Abandonados',
    abd: 'Abandonados',
    bp: 'Base_Proprietaria',
    bsp: 'Base_Proprietaria',
    lp: 'Leads_Parceiros',
    leads: 'Leads_Parceiros',
    recencia: 'Recencia_de_Compra',
    cartonistas: 'Cartonistas',
    cart: 'Cartonistas',
};

const canonicalFunnelStage = (tokens: string[]): string | undefined => {
    const joined = `_${tokens.join('_')}_`;
    if (joined.includes('_topo_de_funil_')) return 'Topo_de_Funil';
    if (joined.includes('_meio_de_funil_')) return 'Meio_de_Funil';
    if (joined.includes('_fundo_de_funil_')) return 'Fundo_de_Funil';
    return undefined;
};

/**
 * Roteamento oficial do importador Total CRM.
 * `JOR_AQS_CP` e seus descendentes permanecem fora de Aquisição por regra de negócio.
 */
export const hasAquisicaoJourneyPrefix = (journey: unknown): boolean => {
    const key = normalizeJourneyKey(journey);
    const isLegacyAcquisition = key.startsWith('jor_aquisicao')
        || key.startsWith('disp_aquisicao')
        || key.startsWith('disparo_aquisicao');
    const isAqsFamily = key.startsWith('jor_aqs_');
    const isAqsCpException = key === 'jor_aqs_cp' || key.startsWith('jor_aqs_cp_');

    return isLegacyAcquisition || (isAqsFamily && !isAqsCpException);
};

/**
 * Interpreta tanto a forma longa `JOR_AQUISICAO_*` quanto o alias `JOR_AQS_*`.
 */
export const parseCanonicalAcquisitionJourney = (journey: unknown): CanonicalAcquisitionJourney => {
    const tokens = taxonomyTokens(journey);
    const acquisitionAt = tokens.findIndex((token) => token === 'aquisicao' || token === 'aqs');
    const start = acquisitionAt >= 0 ? acquisitionAt + 1 : tokens[0] === 'jor' ? 1 : 0;
    const bu = CANONICAL_JOURNEY_BU[tokens[start]];
    if (!bu) return {};

    const parceiro = CANONICAL_JOURNEY_PARTNER[tokens[start + 1]];
    const segmento = CANONICAL_JOURNEY_SEGMENT[tokens[start + 2]]
        ?? (tokens.slice(start + 2).includes('carrinho') ? 'Abandonados' : undefined);

    return {
        bu,
        parceiro,
        segmento,
        etapaAquisicao: canonicalFunnelStage(tokens.slice(start + 3)),
        source: 'jornada canonica',
        evidence: tokens.slice(start, start + 3).join('_'),
    };
};
