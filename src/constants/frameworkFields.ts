/**
 * Constantes do FRAMEWORK - Campos fixos e helpers
 */

// ========================================
// OPÇÕES FIXAS DO FRAMEWORK
// ========================================

export const CANAIS = ['E-mail', 'Push', 'SMS', 'WhatsApp'] as const;
export type Canal = typeof CANAIS[number];

export const PRODUTOS = ['Classic'] as const;
export type Produto = typeof PRODUTOS[number];

export const ETAPAS_AQUISICAO = ['Aquisição', 'Meio_de_Funil'] as const;
export type EtapaAquisicao = typeof ETAPAS_AQUISICAO[number];



// ========================================
// CUSTOS PADRÃO POR CANAL (baseado no FRAMEWORK)
// ========================================

export const CUSTO_UNITARIO_CANAL: Record<Canal, number> = {
    'E-mail': 0.001,
    'Push': 0.001,
    'SMS': 0.064,
    'WhatsApp': 0.420,
};

// ========================================
// CUSTOS PADRÃO POR OFERTA (baseado no FRAMEWORK)
// ========================================

export const CUSTO_UNITARIO_OFERTA: Record<string, number> = {
    'Padrão': 0.00,
    'Limite': 0.00,
    'Vibe': 0.00,
    'Anuidade': 0.00, // TODO: Ajustar com custo real do Test_Drive_3_meses
    'Bonificação': 0.00,
};

// ========================================
// MAPAS HIERÁRQUICOS INTELIGENTES
// ========================================

/**
 * Mapa: BU -> Possíveis Segmentos
 */
export const BU_SEGMENTO_MAP: Record<string, string[]> = {
    'B2C': ['Leads_Parceiros', 'Base_Proprietaria', 'Bases_Bureaus', 'Cartonistas', 'CRM'],
    'B2B2C': ['Cartonistas', 'CRM', 'Funcionários'],
    'Plurix': ['Cartonistas', 'CRM', 'Funcionários'],
    'Bem Barato': ['C_Level', 'Negados', 'Pre_Churn'],
};

/**
 * Mapa: Segmento -> Sugestão de Parceiro/Subgrupo
 * Se o array tiver sufixo (Parceiro) ou (Subgrupo), o UI saberá onde preencher
 */
export const SEGMENTO_CONTEXT_MAP: Record<string, { parceiros?: string[], subgrupos?: string[] }> = {
    'Cartonistas': { parceiros: ['Serasa', 'Bom_Pra_Credito', 'Proprietaria'] },
    'Leads_Parceiros': { parceiros: ['Serasa', 'Acordo Certo'] },
    'CRM': { subgrupos: ['Ativo', 'Inativo', 'Leais', 'Frequentes', 'Novos', 'Administrativos'] },
    'Funcionários': { subgrupos: ['Novos', 'Aprovados_nao_convertidos'] },
    'C_Level': { subgrupos: ['Negados', 'Instabilidade'] },
};

/**
 * Mapa: Oferta (Estratégia) -> Detalhes / Promocional (Tática)
 */
export const OFERTA_DETALHE_MAP: Record<string, string[]> = {
    'Padrão': ['Em dobro', 'Upgrade', 'Uber', 'Black Friday'],
    'Vibe': [],
    'Limite': [],
    'Anuidade': ['Grátis 1 ano', 'Gratis_para_sempre', 'Test_Drive_6_meses', 'Test_Drive_3_meses'],
    'Bonificação': [],
};

// ========================================
// HELPERS
// ========================================

/**
 * Gera Safra automaticamente a partir de uma data
 * @param date Data no formato YYYY-MM-DD
 * @returns Safra no formato "mmm/aa" (ex: "jan/26")
 */
export const generateSafra = (date: string): string => {
    if (!date) return '';

    const d = new Date(date + 'T00:00:00'); // Fix timezone
    const monthNames = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun',
        'jul', 'ago', 'set', 'out', 'nov', 'dez'];
    const month = monthNames[d.getMonth()];
    const year = d.getFullYear().toString().slice(2);

    return `${month}/${year}`;
};

/**
 * Calcula a ordem de disparo automaticamente
 * Baseado na quantidade de disparos já existentes na mesma jornada no mesmo dia
 * @param jornada Nome da jornada
 * @param dataDisparo Data do disparo (YYYY-MM-DD)
 * @param activities Lista de atividades históricas
 * @returns Número da ordem (1, 2, 3...)
 */
export const calculateOrdemDisparo = (
    jornada: string,
    dataDisparo: string,
    activities: any[]
): number => {
    if (!jornada || !dataDisparo) return 1;

    // Contar quantas atividades da mesma jornada existem na mesma data
    const sameJourneyAndDate = activities.filter(
        a => a.jornada === jornada && a['Data de Disparo'] === dataDisparo
    );

    return sameJourneyAndDate.length + 1;
};

/**
 * Sugere Activity Name baseado nos campos preenchidos
 * Padrão: BU_SEGMENTO_JORNADA_ORDEM_SAFRA
 * Ex: B2C_AQUISICAO_BSC_CARRINHO_1_JAN26
 */
export const suggestActivityName = (
    bu: string,
    segmento: string,
    jornada: string,
    ordemDisparo: number,
    safra: string
): string => {
    if (!bu || !segmento || !jornada || !ordemDisparo || !safra) return '';

    const buClean = bu.toUpperCase();
    const segmentoClean = segmento.replace(/\s/g, '_').toUpperCase();
    const jornadaClean = jornada.replace(/\s/g, '_').toUpperCase().substring(0, 20);
    const safraClean = safra.replace('/', '').toUpperCase();

    return `${buClean}_${segmentoClean}_${jornadaClean}_${ordemDisparo}_${safraClean}`;
};

/**
 * Calcula custo total de oferta
 */
export const calcularCustoTotalOferta = (
    custoUnitario: number,
    baseTotal: number
): number => {
    return custoUnitario * baseTotal;
};

/**
 * Calcula custo total de canal
 */
export const calcularCustoTotalCanal = (
    custoUnitario: number,
    baseTotal: number
): number => {
    return custoUnitario * baseTotal;
};

/**
 * Calcula custo total da campanha
 */
export const calcularCustoTotalCampanha = (
    custoOferta: number,
    custoCanal: number
): number => {
    return custoOferta + custoCanal;
};

/**
 * Calcula CAC previsto
 * CAC = Custo Total ÷ Cartões Esperados
 */
export const calcularCACPrevisto = (
    custoTotal: number,
    cartoesEsperados: number
): number => {
    if (cartoesEsperados === 0) return 0;
    return custoTotal / cartoesEsperados;
};
