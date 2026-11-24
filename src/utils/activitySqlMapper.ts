import type { Activity, FrameworkRow } from '../types/framework';
import { parseDate } from './formatters';
import { getCustoUnitarioCanal,CUSTO_UNITARIO_OFERTA } from '../constants/frameworkFields';
export const toFiniteNumber = (value: unknown): number => {
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    if (value === null || value === undefined) return 0;

    const cleaned = String(value)
        .replace(/[R$\s%]/g, '')
        .replace(/\.(?=\d{3}(\D|$))/g, '')
        .replace(',', '.');

    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
};

export const normalizeText = (value: unknown): string => {
    if (typeof value !== 'string') return value == null ? '' : String(value);
    return value.trim();
};

export const normalizeFrameworkChannel = (value: unknown): string => {
    const raw = normalizeText(value);
    const normalized = raw.toLowerCase().replace(/[\s_-]+/g, '');
    if (normalized === 'push') return 'Push';
    if (normalized === 'sms') return 'SMS';
    if (normalized === 'whatsapp' || normalized === 'wpp') return 'WhatsApp';
    if (normalized === 'email' || normalized === 'e-mail' || normalized === 'mail') return 'E-mail';
    return raw;
};

export const PT_MONTH_MAP: Record<string, string> = {
    jan: '01', fev: '02', mar: '03', abr: '04', mai: '05', jun: '06',
    jul: '07', ago: '08', set: '09', out: '10', nov: '11', dez: '12',
};

export const normalizeSafra = (value: unknown): string => {
    const raw = normalizeText(value).toLowerCase();
    if (!raw) return '';
    // Expande ano de 2 dígitos para 4 (26 -> 2026).
    const toYear = (y: string): string => (y.length === 2 ? `20${y}` : y);
    // Already YYYY-MM or YYYY/MM
    const isoMatch = raw.match(/^(\d{4})[-/](\d{1,2})$/);
    if (isoMatch) {
        const [, y, m] = isoMatch;
        return `${y}-${m.padStart(2, '0')}`;
    }
    // MM/YYYY or MM-YYYY
    const mmYyyy = raw.match(/^(\d{1,2})[-/](\d{4})$/);
    if (mmYyyy) {
        const [, m, y] = mmYyyy;
        return `${y}-${m.padStart(2, '0')}`;
    }
    // MM/YY or MM-YY  (01/26 -> 2026-01) — só quando o 1º grupo é um mês válido.
    const mmYy = raw.match(/^(\d{1,2})[-/](\d{2})$/);
    if (mmYy) {
        const month = Number(mmYy[1]);
        if (month >= 1 && month <= 12) {
            return `${toYear(mmYy[2])}-${mmYy[1].padStart(2, '0')}`;
        }
    }
    // MMM <sep> YY/YYYY — sep pode ser /, -, ., espaço ou "de"
    // (jan/26, fev/2026, jan-26, "jan de 26", "jan 2026")
    const monthYear = raw.match(/^([a-zçãéíêôõáâ]{3,})\.?\s*(?:de\s+)?[-/ ]?\s*(\d{2,4})$/i);
    if (monthYear) {
        const monthKey = monthYear[1].slice(0, 3);
        const month = PT_MONTH_MAP[monthKey];
        if (month) {
            return `${toYear(monthYear[2])}-${month}`;
        }
    }
    return raw;
};

export const normalizeBU = (value: unknown): string => {
    const raw = normalizeText(value);
    const normalized = raw.toUpperCase().replace(/\s+/g, '');
    if (normalized === 'B2C') return 'B2C';
    if (normalized === 'B2B2C') return 'B2B2C';
    if (normalized === 'PLURIX') return 'Plurix';
    if (normalized === 'SEGUROS' || normalized === 'SEGURO') return 'Seguros';
    return raw;
};

export const mapSqlToActivity = (row: any): Activity => {
    const bu = normalizeBU(row['BU']);
    const canal = normalizeFrameworkChannel(row['Canal']);
    const segmento = normalizeText(row['Segmento']);
    const parceiro = normalizeText(row['Parceiro']);
    const jornada = normalizeText(row['jornada']);
    const oferta = normalizeText(row['Oferta']);
    const promocional = normalizeText(row['Promocional']);

    // Reconstruct Raw Object (for compatibility)
    // The DB returns keys exactly as defined in the CREATE TABLE (Human Readable).
    // IMPORTANT: ...row is spread FIRST so that all explicit field mappings below
    // take precedence. This prevents SQL system/renamed columns (e.g. lowercase
    // 'jornada', 'prog_gaas', 'created_at') from overwriting the human-readable keys.
    const raw: FrameworkRow = {
        ...row, // Base: all DB columns (includes any newly added dynamic columns)
        // Explicit overrides — corrects renamed/reformatted DB columns:
        id: row.id,
        'Activity name / Taxonomia': row['Activity name / Taxonomia'],
        'Data de Disparo': row['Data de Disparo'],
        'Data Fim': row['Data Fim'],
        'BU': bu,
        'Canal': canal,
        'Jornada': jornada,   // DB stores as lowercase 'jornada'
        'Parceiro': parceiro,
        'SIGLA': row['SIGLA_Parceiro'],   // DB stores as SIGLA_Parceiro
        'Segmento': segmento,
        'SIGLA.1': row['SIGLA_Segmento'], // DB stores as SIGLA_Segmento
        'Subgrupos': row['Subgrupos'],
        'Etapa de aquisição': row['Etapa de aquisição'],
        'Ordem de disparo': row['Ordem de disparo'],
        'Safra': row['Safra'],
        'Perfil de Crédito': row['Perfil de Crédito'],
        'Produto': row['Produto'],
        'Oferta': oferta,
        'SIGLA.2': row['SIGLA_Oferta'],   // DB stores as SIGLA_Oferta
        'Oferta 2': row['Oferta 2'],
        'Promocional': promocional,
        'Promocional 2': row['Promocional 2'],
        'Disparado?': row['status'] === 'Realizado' ? 'Sim' : 'Não',
        'Base Total': row['Base Total'],
        'Base Acionável': row['Base Acionável'],
        '% Otimização de base': row['% Otimização de base'],
        'Base Enviada': row['Base Total'],
        'Custo Unitário Oferta': row['Custo Unitário Oferta'],
        'Custo Total da Oferta': row['Custo Total da Oferta'],
        'Custo unitário do canal': row['Custo unitário do canal'],
        'Custo total canal': row['Custo total canal'],
        'Custo Total Campanha': row['Custo Total Campanha'],
        'Taxa de Entrega': row['Taxa de Entrega'],
        'Taxa de Abertura': row['Taxa de Abertura'],
        'Taxa de Clique': row['Taxa de Clique'],
        'Taxa de Proposta': row['Taxa de Proposta'],
        'Taxa de Aprovação': row['Taxa de Aprovação'],
        'Taxa de Finalização': row['Taxa de Finalização'],
        'Taxa de Conversão': row['Taxa de Conversão'],
        'Cartões Gerados': row['Cartões Gerados'],
        'Aprovados': row['Aprovados'],
        'Propostas': row['Propostas'],
        'CAC': row['CAC'],
        'Emissões Independentes': row['Emissões Independentes'],
        'Emissões Assistidas': row['Emissões Assistidas'],
    };

    const dataDisparo = parseDate(row['Data de Disparo']) || new Date(row['Data de Disparo']);

    // Métricas financeiras frequentemente vêm nulas do banco — computamos aqui
    // (fonte única) usando o custo de canal vigente por ano + custo de oferta.
    const baseTotal = toFiniteNumber(row['Base Total']);
    const baseAcionavel = toFiniteNumber(row['Base Acionável']);
    const cartoes = toFiniteNumber(row['Cartões Gerados']);
    const custoUnitarioCanal =
        toFiniteNumber(row['Custo unitário do canal']) || getCustoUnitarioCanal(canal, dataDisparo);
    const custoUnitarioOferta =
        toFiniteNumber(row['Custo Unitário Oferta']) ||
        CUSTO_UNITARIO_OFERTA[(oferta || '') as keyof typeof CUSTO_UNITARIO_OFERTA] ||
        0;
    // Custo incide sobre a base entregue (convenção do histórico); cai para a enviada.
    const baseCusto = baseAcionavel || baseTotal;
    const custoTotalComputado =
        toFiniteNumber(row['Custo Total Campanha']) || baseCusto * (custoUnitarioOferta + custoUnitarioCanal);
    const cacComputado =
        toFiniteNumber(row['CAC']) || (cartoes > 0 ? custoTotalComputado / cartoes : 0);

    return {
        id: row['Activity name / Taxonomia'] || row.id,
        dataDisparo,
        canal,
        bu,
        segmento,
        parceiro,
        jornada,
        subgrupo: normalizeText(row['Subgrupos']) || 'N/A / Padrão',
        ordemDisparo: Number(row['Ordem de disparo']) || undefined,
        oferta,
        promocional,
        safraKey: normalizeSafra(row['Safra']),
        status: row['status'] as any, // Cast to ActivityStatus
        kpis: {
            baseEnviada: row['Base Total'],
            baseEntregue: row['Base Acionável'],
            aberturas: row['Abertura'] ?? row['Aberturas'] ?? null,
            cliques: row['Cliques'] ?? null,
            taxaEntrega: row['Taxa de Entrega'],
            propostas: row['Propostas'],
            taxaPropostas: row['Taxa de Proposta'],
            aprovados: row['Aprovados'],
            taxaAprovacao: row['Taxa de Aprovação'],
            emissoes: row['Cartões Gerados'],
            taxaFinalizacao: row['Taxa de Finalização'],
            taxaConversao: row['Taxa de Conversão'],
            taxaAbertura: row['Taxa de Abertura'],
            cartoes: row['Cartões Gerados'],
            emissoesIndependentes: row['Emissões Independentes'],
            emissoesAssistidas: row['Emissões Assistidas'],
            cac: cacComputado || null,
            custoTotal: custoTotalComputado || null
        },
        raw
    };
};
