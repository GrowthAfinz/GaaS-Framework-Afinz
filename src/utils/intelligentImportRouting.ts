export interface CanonicalAcquisitionJourney {
    bu?: string;
    parceiro?: string;
    segmento?: string;
    etapaAquisicao?: string;
    subgrupo?: string;
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
    if (joined.includes('_topo_de_funil_')) return 'Aquisicao';
    if (joined.includes('_meio_de_funil_')) return 'Meio_de_Funil';
    if (joined.includes('_fundo_de_funil_')) return 'Fundo_de_Funil';
    return undefined;
};

/** Prefix aliases have one identity for matching; preserve the source spelling in storage. */
export const acquisitionJourneyIdentity = (journey: unknown): string =>
    normalizeJourneyKey(journey).replace(/^jor_aqs_/, 'jor_aquisicao_');

/** Standard operational replies are reused across journeys; that is not a rename. */
export const isStandardOptOutResponse = (activityName: unknown): boolean =>
    /^afz_car_(?:vis|bbt)_aqs_wpp_apr_resposta_optout_pontual$/.test(normalizeJourneyKey(activityName));

export interface CartAudience {
    subgrupo?: string;
    conflict?: string;
}

// Business-owner confirmations on 2026-10-15 override ambiguous activity names.
// Prefix aliases share the same key; do not broaden these rules to other journeys.
const CONFIRMED_CART_AUDIENCES: Record<string, string> = {
    jor_aquisicao_plurix_carrinho_sabado_pad_26: 'Abandonados D-7',
    jor_aquisicao_plurix_na_abd_carrinho21d_set_26: 'Abandonados D-21 A D>7',
    jor_aquisicao_b2c_propri_abd_meio_de_funil_padrao_na_abri26: 'Abandonados D-21 A D>7',
};

/** Audience age is independent of dispatch offsets (d0/d2/d7) and cadence. */
export const inferCartAudience = (journey: unknown, activityName: unknown, historicalSubgroup?: string): CartAudience => {
    const j = normalizeJourneyKey(journey);
    const a = normalizeJourneyKey(activityName);
    const confirmedAudience = CONFIRMED_CART_AUDIENCES[acquisitionJourneyIdentity(j)];
    if (confirmedAudience) return { subgrupo: confirmedAudience };
    const text = `${j} ${a}`;
    const cartJourney = /carrinho|abandonad|(?:^|_)(?:abd|abn)(?:_|$)/.test(j);
    // The first CAR token in afz_car_vis is the card PRODUCT, not the audience.
    const cartActivity = /carrinho|abandonad|(?:^|_)(?:abd|abn)(?:_|$)|_(?:wpp|sms|email|push)_car_/.test(a);
    if (!cartJourney && !cartActivity) return {};
    // A leading digit boundary prevents dispatch 121d from becoming audience 21d.
    const age21 = (s: string) => /(?:^|[^a-z0-9])21(?:dias|d)(?![a-z])|carrinho21d|(?:plurix|sabado)21dias/.test(s);
    const age7 = (s: string) => /(?:^|[^a-z0-9])7(?:dias|d)(?:$|[^a-z0-9])|carrinho7d/.test(s);
    const has21 = age21(text);
    const has7 = age7(text);
    if (has21 && has7) return { conflict: 'Janela do publico conflitante: 7D e 21D' };
    if (has21) return { subgrupo: 'Abandonados D-21 A D>7' };
    if (has7) return { subgrupo: 'Abandonados D-7' };
    if (/sabado|(?:^|_)sab(?:_|$)|fim[_ -]*(?:de[_ -]*)?semana/.test(text)) {
        if (historicalSubgroup === 'Abandonados D-21 A D>7') {
            return { conflict: 'Sabado sem janela explicita diverge do publico historico 21D' };
        }
        return { subgrupo: 'Abandonados D-7' };
    }
    if (/(?:^|_)diario(?:_|$)/.test(text)) {
        return { subgrupo: historicalSubgroup === 'Abandonados D-7' || historicalSubgroup === 'Abandonados D-21 A D>7'
            ? historicalSubgroup : 'Diario' };
    }
    return {};
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
    const audienceTokens = tokens.slice(start + (parceiro !== undefined ? 2 : 1));
    // Legacy PLURIX_21D_ABD and compact B2C_CARRINHO omit the partner slot.
    const segmento = audienceTokens.slice(0, 3)
        .map((token) => CANONICAL_JOURNEY_SEGMENT[token]).find(Boolean)
        ?? (audienceTokens.some((token) => token.startsWith('carrinho')) ? 'Abandonados' : undefined);
    const etapaAquisicao = segmento === 'CRM' ? 'Aquisicao'
        : segmento === 'Abandonados' ? 'Reativacao'
        : segmento === 'Negados' || segmento === 'Aprovados_nao_convertidos' ? 'Meio_de_Funil'
            : canonicalFunnelStage(tokens.slice(start + 1))
                ?? (segmento === 'CRM' || segmento === 'Base_Proprietaria' ? 'Aquisicao' : undefined);

    return {
        bu,
        parceiro,
        segmento,
        etapaAquisicao,
        source: 'jornada canonica',
        evidence: tokens.slice(start, start + 3).join('_'),
    };
};
