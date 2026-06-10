/**
 * Classificador determinístico de jornadas de Rentabilização → Segmento + Subgrupo.
 *
 * Fonte única de verdade reutilizada por:
 *  - dataService.fetchRentabilizacaoActivities (garante display correto no app)
 *  - IntelligentFrameworkUpdate (grava certo no insert)
 *  - UPDATE SQL do passado (CASE espelha estas regras)
 *
 * Taxonomia validada contra 100% das jornadas existentes (0 não-classificado):
 *  Segmentos: Seguro, Welcome, Desbloqueio, Incentivo ao Uso, Ativação, Reativação, Novos, Cartonistas
 *  Subgrupos: Copa, Afinz VC, Plurix Mais Amigo, Pós-Tombamento, Seguro Mulher,
 *             Seguro Residência 24h, Carrinho Seguro Mulher
 */

export interface RentabilizacaoClass {
    segmento: string;
    subgrupo: string;
}

/** Normaliza removendo acentos e caixa para casar keywords (ex.: ATIVAÇÃO → ATIVACAO). */
const COMBINING_MARKS = new RegExp('[\\u0300-\\u036f]', 'g');
const normalize = (jornada: string): string =>
    (jornada || '')
        .normalize('NFD')
        .replace(COMBINING_MARKS, '')
        .toUpperCase();

export const classifyRentabilizacao = (jornada: string): RentabilizacaoClass => {
    const u = normalize(jornada);

    // 1) Carrinho de Seguros: segmento operacional Abandonado.
    if (u.includes('SEGURO') && u.includes('CARRINHO')) {
        if (u.includes('RESIDENCIA')) {
            return { segmento: 'Abandonado', subgrupo: 'Seguro Carrinho Residencial' };
        }
        if (u.includes('MULHER')) {
            return { segmento: 'Abandonado', subgrupo: 'Carrinho Seguro Mulher' };
        }
        return { segmento: 'Abandonado', subgrupo: 'Carrinho Seguro' };
    }

    // 2) Demais jornadas de Seguros.
    if (u.includes('SEGURO')) {
        let subgrupo = 'Seguro';
        if (u.includes('RESIDENCIA')) subgrupo = 'Seguro Residência 24h';
        else if (u.includes('MULHER')) subgrupo = 'Seguro Mulher';
        return { segmento: 'Seguro', subgrupo };
    }

    // 3) Copa — dilui no estágio; subgrupo sempre "Copa"
    if (u.includes('COPA')) {
        let segmento = 'Ativação';
        if (u.includes('CARTONISTAS')) segmento = 'Cartonistas';
        else if (u.includes('NOVOS')) segmento = 'Novos';
        else if (u.includes('REATIVACAO')) segmento = 'Reativação';
        else segmento = 'Ativação'; // ATIVACAO / VISA / default
        return { segmento, subgrupo: 'Copa' };
    }

    // Subgrupo por variante de marca (always-on)
    const variantSubgrupo = (): string => {
        if (u.includes('POS_TOMBAMENTO')) return 'Pós-Tombamento';
        if (u.includes('PLURIX')) return 'Plurix Mais Amigo';
        if (u.includes('AFINZ') || u.includes('_VC')) return 'Afinz VC';
        return '';
    };

    // 3) Always-on por ação do ciclo de vida
    if (u.includes('WELCOME')) return { segmento: 'Welcome', subgrupo: variantSubgrupo() };
    if (u.includes('DESBLOQUEIO')) return { segmento: 'Desbloqueio', subgrupo: variantSubgrupo() };
    if (u.includes('INCENTIVO')) return { segmento: 'Incentivo ao Uso', subgrupo: variantSubgrupo() };

    // 4) Fallback por bloco (sem Copa)
    if (u.includes('CARTONISTAS')) return { segmento: 'Cartonistas', subgrupo: variantSubgrupo() };
    if (u.includes('REATIVACAO')) return { segmento: 'Reativação', subgrupo: variantSubgrupo() };
    if (u.includes('NOVOS')) return { segmento: 'Novos', subgrupo: variantSubgrupo() };
    if (u.includes('ATIVACAO')) return { segmento: 'Ativação', subgrupo: variantSubgrupo() };

    return { segmento: 'Rentabilização', subgrupo: variantSubgrupo() };
};
