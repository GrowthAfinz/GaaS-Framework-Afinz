/**
 * Gerador determinístico de exports sintéticos da Dinâmica BI e do histórico.
 *
 * O repositório é público: nada aqui vem de dado real. Os nomes seguem só o FORMATO
 * da taxonomia (prefixos de jornada, tokens de activity name) para exercitar as mesmas
 * regras do importador: blocos lado a lado, carrinho, `_car_` como produto, opt-out,
 * ECRED-API, JOR_AQS_CP fora de Aquisição, linhas duplicadas, datas e números sujos.
 *
 * Mesma seed, mesma saída. Usado pelo teste golden e pelo baseline de performance.
 */
import type { Activity } from '../../types/framework';

export interface SyntheticOptions {
    /** Linhas de dados da matriz (o bloco mais longo). */
    rows: number;
    /** Registros de histórico de Aquisição (`activities`). */
    acquisitionHistory: number;
    /** Registros de histórico de Rentabilização (`rentabilizacao_activities`). */
    rentHistory: number;
    seed?: number;
}

export interface SyntheticDataset {
    matrix: string[][];
    activities: Activity[];
    rentHistoryRows: Array<Record<string, any>>;
    /** Quantos registros cada bloco recebeu (para conferir a fixture). */
    blockRows: Record<'whatsapp' | 'email' | 'sms' | 'push' | 'performance', number>;
}

const mulberry32 = (seed: number) => () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

type Rng = () => number;
const pick = <T,>(rng: Rng, items: readonly T[]): T => items[Math.floor(rng() * items.length) % items.length];
const intBetween = (rng: Rng, min: number, max: number) => min + Math.floor(rng() * (max - min + 1));

const MONTHS = [
    { tag: 'AGO26', month: 8 },
    { tag: 'SET26', month: 9 },
    { tag: 'OUT26', month: 10 },
    { tag: 'NOV26', month: 11 },
] as const;

type ChannelCode = 'wpp' | 'email' | 'sms' | 'push';
const CHANNEL_PERF_LABEL: Record<ChannelCode, string> = { wpp: 'WHATSAPP', email: 'EMAIL', sms: 'SMS', push: 'PUSH' };
const CHANNEL_HISTORY_LABEL: Record<ChannelCode, string> = { wpp: 'WhatsApp', email: 'E-mail', sms: 'SMS', push: 'Push' };

interface JourneyTemplate {
    journey: (monthTag: string) => string;
    names: (channel: ChannelCode, order: number) => string;
    bu: 'B2C' | 'B2B2C' | 'Plurix';
    parceiro: string;
    segmento: string;
    subgrupo: string;
    etapa: string;
    rent: boolean;
    /** Jornada nova: nunca aparece no histórico (exercita "Sem histórico" e "Revisar"). */
    neverInHistory?: boolean;
}

const ACQUISITION_JOURNEYS: JourneyTemplate[] = [
    {
        journey: (m) => `JOR_AQS_B2C_NA_ANC_MEIO_DE_FUNIL_PAD_VIBE_${m}`,
        names: (c, o) => `afz_aqs_vis_reg_cart_${c}_ordem${o}_padrao`,
        bu: 'B2C', parceiro: 'N/A', segmento: 'Meio de Funil', subgrupo: 'Padrao', etapa: 'Meio_de_Funil', rent: false,
    },
    {
        journey: (m) => `JOR_AQUISICAO_B2C_RFV_CHURN_${m}`,
        names: (c, o) => `afz_aqs_car_reg_${c}_rfvchurn${o}_diario`,
        bu: 'B2C', parceiro: 'N/A', segmento: 'Churn', subgrupo: 'RFV', etapa: 'Aquisicao', rent: false,
    },
    {
        journey: () => 'JOR_AQS_B2C_CARRINHO_REATIVACAO_VIBE_PAD_26',
        names: (c, o) => `afz_car_vis_aqs_${c}_car_d${o}ecredvibe_diario`,
        bu: 'B2C', parceiro: 'N/A', segmento: 'Abandonados', subgrupo: 'Diario', etapa: 'Reativacao', rent: false,
    },
    {
        journey: (m) => `JOR_AQS_PLX_CARRINHO_REATIVACAO_PAD_${m}`,
        names: (c, o) => `plu_car_plx_aqs_${c}_car_carrinho${o * 7}dplurix_diario`,
        bu: 'Plurix', parceiro: 'Plurix', segmento: 'Abandonados', subgrupo: 'Diario', etapa: 'Reativacao', rent: false,
    },
    {
        journey: (m) => `JOR_AQS_PLX_TOPO_CLUBE_${m}`,
        names: (c, o) => `plu_aqs_plx_reg_${c}_topoclube${o}_padrao`,
        bu: 'Plurix', parceiro: 'Plurix', segmento: 'Topo de Funil', subgrupo: 'Clube', etapa: 'Aquisicao', rent: false,
    },
    {
        journey: (m) => `JOR_AQS_B2B2C_BBT_TOPO_PAD_${m}`,
        names: (c, o) => `bbt_aqs_bmv_reg_${c}_topo${o}_padrao`,
        bu: 'B2B2C', parceiro: 'Bem Barato', segmento: 'Topo de Funil', subgrupo: 'Padrao', etapa: 'Aquisicao', rent: false,
    },
    {
        journey: (m) => `DISP_AQUISICAO_B2C_LEADS_${m}`,
        names: (c, o) => `afz_aqs_vis_reg_${c}_leads${o}_vibe`,
        bu: 'B2C', parceiro: 'N/A', segmento: 'Leads', subgrupo: 'Vibe', etapa: 'Aquisicao', rent: false,
    },
    {
        journey: (m) => `JOR_AQS_B2C_NA_ANC_MEIO_DE_FUNIL_PAD_VIBE_${m}`,
        names: () => 'afz_car_vis_aqs_wpp_apr_resposta_optout_pontual',
        bu: 'B2C', parceiro: 'N/A', segmento: 'Meio de Funil', subgrupo: 'Opt-out', etapa: 'Meio_de_Funil', rent: false,
    },
    {
        journey: (m) => `JOR_AQS_B2C_NOVA_JORNADA_TESTE_${m}`,
        names: (c, o) => `afz_aqs_vis_nov_${c}_novidade${o}_padrao`,
        bu: 'B2C', parceiro: 'N/A', segmento: 'Novidade', subgrupo: 'Teste', etapa: 'Aquisicao', rent: false,
        neverInHistory: true,
    },
];

const RENT_JOURNEYS: JourneyTemplate[] = [
    {
        journey: (m) => `JOR_INCENTIVO_AO_USO_PLURIX_${m}`,
        names: (c, o) => `plu_ren_plx_uso_${c}_incentivo${o}_padrao`,
        bu: 'Plurix', parceiro: 'Plurix', segmento: 'Incentivo ao Uso', subgrupo: 'Plurix Mais Amigo', etapa: '', rent: true,
    },
    {
        journey: (m) => `JOR_SEGURO_CARRINHO_RESIDENCIA_${m}`,
        names: (c, o) => `afz_seg_res_car_${c}_carrinho${o}_diario`,
        bu: 'B2C', parceiro: 'N/A', segmento: 'Abandonado', subgrupo: 'Seguro Carrinho Residencial', etapa: '', rent: true,
    },
    {
        journey: (m) => `JOR_ATIVACAO_AFINZ_VC_${m}`,
        names: (c, o) => `afz_ren_vis_atv_${c}_ativacao${o}_padrao`,
        bu: 'B2C', parceiro: 'N/A', segmento: 'Ativacao', subgrupo: 'Afinz VC', etapa: '', rent: true,
    },
    {
        // JOR_AQS_CP fica fora de Aquisição por regra de negócio.
        journey: (m) => `JOR_AQS_CP_UPGRADE_${m}`,
        names: (c, o) => `afz_cp_vis_upg_${c}_upgrade${o}_padrao`,
        bu: 'B2C', parceiro: 'N/A', segmento: 'Upgrade', subgrupo: 'CP', etapa: '', rent: true,
    },
];

interface Dispatch {
    template: JourneyTemplate;
    journey: string;
    activityName: string;
    channel: ChannelCode;
    day: number;
    month: number;
    sent: number;
}

const pad = (value: number) => String(value).padStart(2, '0');
const brDate = (day: number, month: number) => `${pad(day)}/${pad(month)}/2026`;
const isoDate = (day: number, month: number) => `2026-${pad(month)}-${pad(day)}`;

/** Números como o BI exporta: às vezes com ponto de milhar, às vezes vazio. */
const fmtNumber = (rng: Rng, value: number) => {
    const roll = rng();
    if (roll < 0.03) return '';
    if (value >= 1000 && roll < 0.5) return value.toLocaleString('pt-BR');
    return String(value);
};

const makeDispatch = (rng: Rng, channel: ChannelCode, rentShare: number): Dispatch => {
    const template = rng() < rentShare ? pick(rng, RENT_JOURNEYS) : pick(rng, ACQUISITION_JOURNEYS);
    const monthInfo = pick(rng, MONTHS);
    const order = intBetween(rng, 1, 6);
    const name = template.names(channel, order);
    return {
        template,
        journey: template.journey(monthInfo.tag),
        activityName: template.names === ACQUISITION_JOURNEYS[7].names ? name.replace('_wpp_', `_${channel}_`) : name,
        channel,
        day: intBetween(rng, 1, 28),
        month: monthInfo.month,
        sent: intBetween(rng, 40, 60000),
    };
};

const dateCell = (rng: Rng, dispatch: Dispatch) => {
    const roll = rng();
    if (roll < 0.01) return 'n/d';
    if (roll < 0.12) return isoDate(dispatch.day, dispatch.month);
    return brDate(dispatch.day, dispatch.month);
};

const BLOCK_WIDTH = { whatsapp: 6, email: 7, sms: 5, push: 5, performance: 9 } as const;

export const generateSyntheticDataset = ({
    rows,
    acquisitionHistory,
    rentHistory,
    seed = 20261124,
}: SyntheticOptions): SyntheticDataset => {
    const rng = mulberry32(seed);
    const share = { whatsapp: 1, email: 0.6, sms: 0.35, push: 0.1, performance: 0.55 };
    const counts = {
        whatsapp: Math.round(rows * share.whatsapp),
        email: Math.round(rows * share.email),
        sms: Math.round(rows * share.sms),
        push: Math.round(rows * share.push),
        performance: Math.round(rows * share.performance),
    };

    const blockDispatches = {
        whatsapp: [] as Dispatch[],
        email: [] as Dispatch[],
        sms: [] as Dispatch[],
        push: [] as Dispatch[],
    };
    const channelOf = { whatsapp: 'wpp', email: 'email', sms: 'sms', push: 'push' } as const;
    (Object.keys(blockDispatches) as Array<keyof typeof blockDispatches>).forEach((block) => {
        for (let i = 0; i < counts[block]; i += 1) {
            // ~3% duplicadas de propósito (mesma linha duas vezes).
            const previous = blockDispatches[block][i - 1];
            blockDispatches[block].push(previous && rng() < 0.03
                ? previous
                : makeDispatch(rng, channelOf[block], 0.3));
        }
    });

    const allDispatches = [
        ...blockDispatches.whatsapp,
        ...blockDispatches.email,
        ...blockDispatches.sms,
        ...blockDispatches.push,
    ];
    const acquisitionDispatches = allDispatches.filter((dispatch) => !dispatch.template.rent);

    const width = BLOCK_WIDTH.whatsapp + BLOCK_WIDTH.email + BLOCK_WIDTH.sms + BLOCK_WIDTH.push + BLOCK_WIDTH.performance;
    const offsets = {
        whatsapp: 0,
        email: BLOCK_WIDTH.whatsapp,
        sms: BLOCK_WIDTH.whatsapp + BLOCK_WIDTH.email,
        push: BLOCK_WIDTH.whatsapp + BLOCK_WIDTH.email + BLOCK_WIDTH.sms,
        performance: BLOCK_WIDTH.whatsapp + BLOCK_WIDTH.email + BLOCK_WIDTH.sms + BLOCK_WIDTH.push,
    };

    const header = new Array<string>(width).fill('');
    header.splice(offsets.whatsapp, BLOCK_WIDTH.whatsapp, 'journeyname (whatsapp)', 'activity_name', 'Date', 'sent', 'delivered', 'read');
    header.splice(offsets.email, BLOCK_WIDTH.email, 'journeyname (e-mail)', 'activity_name', 'Date', 'sent', 'delivered', 'opens', 'clicks');
    header.splice(offsets.sms, BLOCK_WIDTH.sms, 'journeyname (sms)', 'activity_name', 'Date', 'sent', 'delivered');
    header.splice(offsets.push, BLOCK_WIDTH.push, 'journeyname (push)', 'activity_name', 'Date', 'sent', 'delivered');
    header.splice(offsets.performance, BLOCK_WIDTH.performance, 'journey (resultados de performance)', 'activity_name', 'data_inicio', 'Canal', 'propostas', 'aprovados', 'finalizados', 'assistida', 'independente');

    const totalRows = Math.max(...Object.values(counts));
    const matrix: string[][] = [header];
    for (let i = 0; i < totalRows; i += 1) matrix.push(new Array<string>(width).fill(''));

    const writeDispatchBlock = (block: keyof typeof blockDispatches) => {
        blockDispatches[block].forEach((dispatch, index) => {
            const row = matrix[index + 1];
            const start = offsets[block];
            const delivered = Math.round(dispatch.sent * (0.82 + rng() * 0.17));
            const cells = [
                dispatch.journey,
                rng() < 0.005 ? '' : dispatch.activityName,
                dateCell(rng, dispatch),
                fmtNumber(rng, dispatch.sent),
                fmtNumber(rng, delivered),
            ];
            if (block === 'whatsapp') cells.push(fmtNumber(rng, Math.round(delivered * rng() * 0.7)));
            if (block === 'email') {
                const opens = Math.round(delivered * rng() * 0.3);
                cells.push(fmtNumber(rng, opens), fmtNumber(rng, Math.round(opens * rng() * 0.2)));
            }
            cells.forEach((cell, offset) => { row[start + offset] = cell; });
        });
    };
    writeDispatchBlock('whatsapp');
    writeDispatchBlock('email');
    writeDispatchBlock('sms');
    writeDispatchBlock('push');

    for (let i = 0; i < counts.performance; i += 1) {
        const row = matrix[i + 1];
        const start = offsets.performance;
        const roll = rng();
        // Maioria casa com um disparo de Aquisição; parte é órfã, ECRED-API ou canal desconhecido.
        const base = acquisitionDispatches.length > 0 && roll < 0.82
            ? pick(rng, acquisitionDispatches)
            : makeDispatch(rng, pick(rng, ['wpp', 'email', 'sms'] as const), 0);
        const channelLabel = roll > 0.97 ? 'OUTRO' : roll > 0.93 ? 'ECRED-API' : CHANNEL_PERF_LABEL[base.channel];
        const proposals = intBetween(rng, 0, Math.max(1, Math.round(base.sent * 0.02)));
        const approved = Math.round(proposals * rng() * 0.8);
        const finalized = Math.round(approved * rng());
        const assisted = channelLabel === 'ECRED-API' ? 0 : Math.round(finalized * rng());
        const cells = [
            base.journey,
            base.activityName,
            brDate(base.day, base.month),
            channelLabel,
            String(proposals),
            String(approved),
            String(finalized),
            String(assisted),
            String(channelLabel === 'ECRED-API' ? 0 : finalized - assisted),
        ];
        cells.forEach((cell, offset) => { row[start + offset] = cell; });
    }

    // Uma linha totalmente vazia no meio, como acontece em colagem do Excel.
    if (matrix.length > 10) matrix.splice(Math.floor(matrix.length / 2), 0, new Array<string>(width).fill(''));

    // Histórico de Aquisição: parte casa com o arquivo (vira atualização), parte é mais antiga.
    const activities: Activity[] = [];
    for (let i = 0; i < acquisitionHistory; i += 1) {
        const fromFile = acquisitionDispatches.length > 0 && rng() < 0.45;
        const dispatch = fromFile
            ? pick(rng, acquisitionDispatches)
            : makeDispatch(rng, pick(rng, ['wpp', 'email', 'sms', 'push'] as const), 0);
        const t = dispatch.template;
        if (t.neverInHistory) continue;
        const parceiro = rng() < 0.08 ? 'N/A' : t.parceiro;
        activities.push({
            id: `${dispatch.activityName}#${i}`,
            dataDisparo: new Date(Date.UTC(2026, dispatch.month - 1 - (fromFile ? 0 : intBetween(rng, 0, 3)), dispatch.day, 15)),
            canal: CHANNEL_HISTORY_LABEL[dispatch.channel],
            bu: t.bu,
            segmento: t.segmento,
            parceiro,
            jornada: dispatch.journey,
            subgrupo: t.subgrupo,
            etapaAquisicao: t.etapa,
            produto: rng() < 0.5 ? 'Cartao' : 'Cartao Visa',
            oferta: pick(rng, ['Anuidade Zero', 'Cashback', 'Sem oferta']),
            promocional: pick(rng, ['Padrao', 'Copa', 'Black Friday', '']),
            perfilCredito: pick(rng, ['Aprovado', 'Pre-aprovado', '', '']),
            kpis: {
                baseEnviada: dispatch.sent,
                baseEntregue: Math.round(dispatch.sent * 0.9),
                propostas: intBetween(rng, 0, 40),
                aprovados: intBetween(rng, 0, 20),
                cartoes: intBetween(rng, 0, 10),
            } as Activity['kpis'],
            raw: {
                id: `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`,
                'Activity name / Taxonomia': dispatch.activityName,
                Segmento: t.segmento,
                Subgrupos: t.subgrupo,
                'Etapa de aquisição': t.etapa,
                Parceiro: parceiro,
                BU: t.bu,
            },
        } as unknown as Activity);
    }

    const rentDispatches = allDispatches.filter((dispatch) => dispatch.template.rent);
    const rentHistoryRows: Array<Record<string, any>> = [];
    for (let i = 0; i < rentHistory; i += 1) {
        const fromFile = rentDispatches.length > 0 && rng() < 0.45;
        const dispatch = fromFile
            ? pick(rng, rentDispatches)
            : makeDispatch(rng, pick(rng, ['wpp', 'email', 'sms', 'push'] as const), 1);
        const t = dispatch.template;
        rentHistoryRows.push({
            id: `10000000-0000-4000-8000-${String(i).padStart(12, '0')}`,
            jornada: dispatch.journey,
            'Activity name / Taxonomia': dispatch.activityName,
            Canal: CHANNEL_HISTORY_LABEL[dispatch.channel],
            'Data de Disparo': isoDate(dispatch.day, dispatch.month),
            BU: t.bu,
            Parceiro: t.parceiro,
            Segmento: t.segmento,
            Subgrupos: t.subgrupo,
            'Base Total': dispatch.sent,
            'Base Acionável': Math.round(dispatch.sent * 0.9),
        });
    }

    return {
        matrix,
        activities,
        rentHistoryRows,
        blockRows: counts,
    };
};

/** Mesma matriz em CSV com `;`, para medir a etapa de leitura do arquivo. */
export const matrixToCsv = (matrix: string[][]) =>
    matrix.map((row) => row.map((cell) => (/[;"\n]/.test(cell) ? `"${cell.replace(/"/g, '""')}"` : cell)).join(';')).join('\n');
