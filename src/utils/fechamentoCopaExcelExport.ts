import type { Workbook, Worksheet } from 'exceljs';
import { fetchSupabaseRows } from './aquisicaoCrmExcelExport';
import { supabase } from '../services/supabaseClient';
import {
  allDates,
  isoDate,
  addDays,
  colLetter,
  normalizeCanal,
  asInt,
  formatShortDate,
  startOfMondayWeek,
  closedEnd,
  setCell,
  DAY_NAMES,
  COPA_ACTION_START,
  COPA_CHANNELS,
  writeCopaSheet,
  writeCopaBigNumbersSheet,
  fetchRntRows,
  fetchCopaFixedDaily,
  fetchCopaEventNotes,
  buildCopaIndex,
  copaCrmChartSummary,
  createCopaChartImages,
} from './rentabilizacaoCrmExcelExport';
import type { CopaChannel, CopaEventNote } from './rentabilizacaoCrmExcelExport';

// ─────────────────────────────────────────────────────────────────────────────
// FECHAMENTO COPA · AQUISIÇÃO E RENTABILIZAÇÃO
//
// Workbook único com 4 abas:
//   1. Rentabilização Copa          (reuso de writeCopaSheet)
//   2. Big Numbers Renta. Copa      (reuso de writeCopaBigNumbersSheet)
//   3. Aquisição Copa               (novo — funil de aquisição por BU × Segmento)
//   4. Big Numbers Aquisição Copa   (novo — síntese modelo Big Numbers)
//
// Fontes de aquisição:
//   CRM        → `activities`, jornada contém COPA + etapa de aquisição.
//   Mídia paga → `v_b2c_app_install_daily`, com App Install e StartTrial separados.
// Sem colunas de LP/Visa na aba de aquisição (decisão do usuário).
// ─────────────────────────────────────────────────────────────────────────────

type RawRow = Record<string, unknown>;

type AqPaidPhase = 'app_install' | 'onboarding';

export type AqPaidDay = {
  businessDate: string;
  phase: AqPaidPhase;
  campaignLabel: string;
  spend: number;
  impressions: number;
  linkClicks: number | null;
  installs: number | null;
  startTrials: number | null;
  attributionLabel: string;
  installSource: string;
};

type AqMetrics = {
  disparos: number;    // nº de linhas de disparo (1 por linha)
  enviados: number;    // Base Total
  entregues: number;   // Base Acionável
  abertura: number;    // Abertura (WPP = leitura, E-mail = abertura)
  cliques: number;     // Cliques
  propostas: number;   // Propostas
  aprovados: number;   // Aprovados
  cartoes: number;     // Cartões Gerados
  custo: number;       // Custo Total Campanha
};

const AQ_METRIC_FIELDS: Array<keyof AqMetrics> = [
  'disparos', 'enviados', 'entregues', 'abertura', 'cliques', 'propostas', 'aprovados', 'cartoes', 'custo',
];

type AqBlock = {
  bu: string;
  segmento: string;
  total: AqMetrics;
  byDayChannel: Map<string, Map<CopaChannel, AqMetrics>>;
};

const SEP = '';

// Paleta alinhada às demais abas Copa (mesmos tons do writeCopaBigNumbersSheet).
const COLORS = {
  header: '1F3864',
  subHeader: 'DCE6F1',
  crm: '15803D',
  crmHeaderFill: 'D9EAD3',
  crmHeaderFont: '1E5631',
  total: 'D9EAD3',
  note: 'FFF2CC',
  noteFont: '7F6000',
  cover: 'F8FAFC',
  coverFont: '334155',
  zebra: 'F8FAFC',
  weekend: 'E2E8F0',
  mediaApp: '7C3AED',
  mediaAppLight: 'EDE9FE',
  mediaOnboarding: '0F766E',
  mediaOnboardingLight: 'CCFBF1',
};

const BU_COLORS: Record<string, string> = {
  B2C: '2563EB',
  B2B2C: '059669',
  PLURIX: '7C3AED',
};

function buColor(bu: string): string {
  return BU_COLORS[bu.toUpperCase()] ?? '374151';
}

// ── Helpers de leitura tolerante ────────────────────────────────────────────────

function get(row: RawRow, ...keys: string[]): unknown {
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(row, key)) return row[key];
  }
  return undefined;
}

function toNum(value: unknown): number {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const normalized = String(value)
    .replace(/[R$\s]/g, '')
    .replace(/\.(?=\d{3}(?:\D|$))/g, '')
    .replace(',', '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseRowDate(value: unknown): Date | null {
  const raw = String(value ?? '').slice(0, 10);
  const [y, m, d] = raw.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function emptyAqMetrics(): AqMetrics {
  return { disparos: 0, enviados: 0, entregues: 0, abertura: 0, cliques: 0, propostas: 0, aprovados: 0, cartoes: 0, custo: 0 };
}

function addAq(target: AqMetrics, source: AqMetrics): void {
  for (const field of AQ_METRIC_FIELDS) target[field] += source[field];
}

function rowMetrics(row: RawRow): AqMetrics {
  return {
    disparos: 1,
    enviados: asInt(get(row, 'Base Total', 'Base total')),
    entregues: asInt(get(row, 'Base Acionável', 'Base Acionavel')),
    abertura: asInt(get(row, 'Abertura')),
    cliques: asInt(get(row, 'Cliques')),
    propostas: asInt(get(row, 'Propostas')),
    aprovados: asInt(get(row, 'Aprovados')),
    cartoes: asInt(get(row, 'Cartões Gerados', 'Cartoes Gerados')),
    custo: toNum(get(row, 'Custo Total Campanha')),
  };
}

/** Copa + etapa de aquisição realizada (mesma regra do relatório mensal de aquisição). */
export function isCopaAquisicao(row: RawRow): boolean {
  const jornada = String(get(row, 'jornada', 'Jornada') ?? '').toUpperCase();
  if (!jornada.includes('COPA')) return false;
  const status = String(get(row, 'status', 'Status') ?? '');
  const etapa = String(get(row, 'Etapa de aquisição', 'Etapa de aquisiçao') ?? '');
  const segmento = String(get(row, 'Segmento') ?? '');
  // 'Reativacao' = etapa do CARRINHO ABANDONADO (reativação de aquisição) — entra no funil.
  return status === 'Realizado'
    && ['Aquisicao', 'Meio_de_Funil', 'Reativacao'].includes(etapa)
    && segmento !== 'Rentabilizacao';
}

// ── Indexação ───────────────────────────────────────────────────────────────────

type AqIndex = {
  blocks: AqBlock[];                                    // ordenados por cartões desc
  byChannel: Record<CopaChannel, AqMetrics>;            // total do período por canal
  total: AqMetrics;                                     // total geral
  weekly: Array<{ start: Date; end: Date; days: number } & { metrics: AqMetrics }>;
  coverageDays: number;                                 // dias com qualquer disparo
};

export function buildAqIndex(rows: RawRow[], dates: Date[], start: Date, end: Date): AqIndex {
  const blockMap = new Map<string, AqBlock>();
  const byChannel: Record<CopaChannel, AqMetrics> = {
    WPP: emptyAqMetrics(), 'E-MAIL': emptyAqMetrics(), SMS: emptyAqMetrics(), PUSH: emptyAqMetrics(),
  };
  const total = emptyAqMetrics();
  const daysWithData = new Set<string>();

  for (const row of rows) {
    if (!isCopaAquisicao(row)) continue;
    const rowDate = parseRowDate(get(row, 'Data de Disparo'));
    if (!rowDate || rowDate < start || rowDate > end) continue;

    const canal = normalizeCanal(get(row, 'Canal')) as CopaChannel;
    if (!COPA_CHANNELS.includes(canal)) continue;

    const bu = String(get(row, 'BU') ?? 'N/A') || 'N/A';
    const segmento = String(get(row, 'Segmento') ?? 'N/A') || 'N/A';
    const ds = isoDate(rowDate);
    const metrics = rowMetrics(row);

    const blockKey = [bu, segmento].join(SEP);
    let block = blockMap.get(blockKey);
    if (!block) {
      block = { bu, segmento, total: emptyAqMetrics(), byDayChannel: new Map() };
      blockMap.set(blockKey, block);
    }
    addAq(block.total, metrics);

    let dayMap = block.byDayChannel.get(ds);
    if (!dayMap) { dayMap = new Map(); block.byDayChannel.set(ds, dayMap); }
    const cur = dayMap.get(canal) ?? emptyAqMetrics();
    addAq(cur, metrics);
    dayMap.set(canal, cur);

    addAq(byChannel[canal], metrics);
    addAq(total, metrics);
    daysWithData.add(ds);
  }

  const blocks = [...blockMap.values()].sort((a, b) => b.total.cartoes - a.total.cartoes);

  // Resumo semanal (segunda a domingo), clampado ao período.
  const weekly: AqIndex['weekly'] = [];
  if (dates.length > 0) {
    let cursor = startOfMondayWeek(dates[0]);
    const last = dates[dates.length - 1];
    while (cursor <= last) {
      const weekEndRaw = addDays(cursor, 6);
      const wStart = cursor < start ? start : cursor;
      const wEnd = weekEndRaw > end ? end : weekEndRaw;
      const metrics = emptyAqMetrics();
      let days = 0;
      for (let d = new Date(wStart); d <= wEnd; d = addDays(d, 1)) {
        if (daysWithData.has(isoDate(d))) days++;
      }
      // Somar métricas da semana a partir dos blocos.
      for (const block of blocks) {
        for (let d = new Date(wStart); d <= wEnd; d = addDays(d, 1)) {
          const dayMap = block.byDayChannel.get(isoDate(d));
          if (!dayMap) continue;
          for (const m of dayMap.values()) addAq(metrics, m);
        }
      }
      weekly.push({ start: new Date(wStart), end: new Date(wEnd), days, metrics });
      cursor = addDays(cursor, 7);
    }
  }

  return { blocks, byChannel, total, weekly, coverageDays: daysWithData.size };
}

function nullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Fonte governada do funil de mídia paga B2C.
 *
 * A view preserva a semântica de resultado:
 * - app_install: instalação atribuída à Meta;
 * - onboarding: instalação legada/direcional + StartTrial atribuído à Meta.
 *
 * Conversões genéricas de outras campanhas não entram como instalação.
 */
export async function fetchAqPaidDaily(start: Date, end: Date): Promise<AqPaidDay[]> {
  const rows: AqPaidDay[] = [];
  const startIso = isoDate(start);
  const endExclusiveIso = isoDate(addDays(end, 1));
  const pageSize = 1000;

  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabase
      .from('v_b2c_app_install_daily')
      .select('business_date, campaign_phase, campaign_label, spend, impressions, link_clicks, installs, start_trials, attribution_label, install_source')
      .gte('business_date', startIso)
      .lt('business_date', endExclusiveIso)
      .order('business_date', { ascending: true })
      .order('campaign_phase', { ascending: true })
      .range(offset, offset + pageSize - 1);
    if (error) throw error;

    for (const row of data ?? []) {
      const phase = String(row.campaign_phase ?? '');
      if (phase !== 'app_install' && phase !== 'onboarding') continue;
      rows.push({
        businessDate: String(row.business_date).slice(0, 10),
        phase,
        campaignLabel: String(row.campaign_label ?? ''),
        spend: nullableNumber(row.spend) ?? 0,
        impressions: nullableNumber(row.impressions) ?? 0,
        linkClicks: nullableNumber(row.link_clicks),
        installs: nullableNumber(row.installs),
        startTrials: nullableNumber(row.start_trials),
        attributionLabel: String(row.attribution_label ?? ''),
        installSource: String(row.install_source ?? ''),
      });
    }

    if (!data || data.length < pageSize) break;
  }

  return rows;
}

// ── Aba diarizada "Aquisição Copa" (layout seccionado por BU × Segmento) ─────────

const AQ_SECTION_HEADERS = [
  'Data', 'Dia', 'Canal', 'Enviados', 'Entregues', 'Aberturas', 'Cliques',
  'Propostas', 'Aprovados', 'Cartões', 'Tx entrega', 'Tx abertura', 'Tx clique', 'CAC',
];
const AQ_MAX_COL = AQ_SECTION_HEADERS.length; // 14

function writeAqRates(ws: Worksheet, row: number, fill: string): void {
  // Tx entrega = Entregues/Enviados (E/D) · Tx abertura = Aberturas/Entregues (F/E)
  // Tx clique = Cliques/Entregues (G/E) · CAC = CAC não; custo não está por linha → CAC no TOTAL
  const D = colLetter(4), E = colLetter(5), F = colLetter(6), G = colLetter(7);
  ws.getCell(row, 11).value = { formula: `IFERROR(${E}${row}/${D}${row},"")` };
  ws.getCell(row, 12).value = { formula: `IFERROR(${F}${row}/${E}${row},"")` };
  ws.getCell(row, 13).value = { formula: `IFERROR(${G}${row}/${E}${row},"")` };
  [11, 12, 13].forEach((c) => {
    ws.getCell(row, c).numFmt = '0.0%';
    ws.getCell(row, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${fill}` } };
  });
}

function writeAqSection(ws: Worksheet, startRow: number, block: AqBlock, dates: Date[]): number {
  const color = buColor(block.bu);
  const title = `${block.bu.toUpperCase()} · ${block.segmento}`;

  ws.mergeCells(startRow, 1, startRow, AQ_MAX_COL);
  setCell(ws.getCell(startRow, 1), title, { bold: true, fontColor: 'FFFFFF', fillColor: color, align: 'left', size: 11 });

  AQ_SECTION_HEADERS.forEach((h, i) => {
    setCell(ws.getCell(startRow + 1, i + 1), h, { bold: true, fontColor: 'FFFFFF', fillColor: color, size: 9 });
  });

  const dataStart = startRow + 2;
  let rowNum = dataStart;

  for (const day of dates) {
    const ds = isoDate(day);
    const dayMap = block.byDayChannel.get(ds);
    if (!dayMap || dayMap.size === 0) continue;
    const isWeekend = day.getDay() === 0 || day.getDay() === 6;

    for (const canal of COPA_CHANNELS) {
      const m = dayMap.get(canal);
      if (!m) continue;
      const fill = isWeekend ? COLORS.weekend : (rowNum % 2 === 0 ? COLORS.zebra : 'FFFFFF');
      const cac = m.cartoes > 0 ? m.custo / m.cartoes : '';
      const values: Array<string | number> = [
        day.toLocaleDateString('pt-BR'), DAY_NAMES[day.getDay()], canal,
        m.enviados || '', m.entregues || '', m.abertura || '', m.cliques || '',
        m.propostas || '', m.aprovados || '', m.cartoes || '', '', '', '', cac,
      ];
      values.forEach((v, i) => setCell(ws.getCell(rowNum, i + 1), v, {
        fillColor: fill, align: i <= 2 ? 'left' : 'right', size: 9,
      }));
      [4, 5, 6, 7, 8, 9, 10].forEach((c) => { ws.getCell(rowNum, c).numFmt = '#,##0'; });
      ws.getCell(rowNum, 14).numFmt = '"R$" #,##0.00';
      writeAqRates(ws, rowNum, fill);
      rowNum++;
    }
  }

  // Linha TOTAL do bloco.
  const totalRow = rowNum;
  for (let c = 1; c <= AQ_MAX_COL; c++) setCell(ws.getCell(totalRow, c), '', { bold: true, fillColor: COLORS.total });
  setCell(ws.getCell(totalRow, 1), 'TOTAL', { bold: true, fillColor: COLORS.total, align: 'left' });
  setCell(ws.getCell(totalRow, 3), block.bu, { bold: true, fillColor: COLORS.total, align: 'left', size: 8 });
  const sumCol = (col: number) => {
    if (totalRow - 1 < dataStart) return;
    const letter = colLetter(col);
    ws.getCell(totalRow, col).value = { formula: `SUM(${letter}${dataStart}:${letter}${totalRow - 1})` };
    ws.getCell(totalRow, col).numFmt = '#,##0';
  };
  [4, 5, 6, 7, 8, 9, 10].forEach(sumCol);
  writeAqRates(ws, totalRow, COLORS.total);
  // CAC do bloco = custo total / cartões total (valor calculado, custo não está por coluna).
  const cacTotal = block.total.cartoes > 0 ? block.total.custo / block.total.cartoes : '';
  setCell(ws.getCell(totalRow, 14), cacTotal, { bold: true, fillColor: COLORS.total, align: 'right' });
  ws.getCell(totalRow, 14).numFmt = '"R$" #,##0.00';

  return totalRow + 2; // gap entre seções
}

type PaidTableConfig = {
  phase: AqPaidPhase;
  title: string;
  color: string;
  lightColor: string;
  headers: string[];
};

const AQ_MEDIA_START_COL = 16; // P; O fica como gutter entre CRM e mídia.

const PAID_TABLES: PaidTableConfig[] = [
  {
    phase: 'app_install',
    title: 'MÍDIA PAGA · APP INSTALL · DIÁRIO',
    color: COLORS.mediaApp,
    lightColor: COLORS.mediaAppLight,
    headers: ['Data', 'Dia', 'Investimento', 'Impressões', 'Cliques link', 'CTR', 'Installs', 'Clique → install', 'CPI'],
  },
  {
    phase: 'onboarding',
    title: 'MÍDIA PAGA · ONBOARDING / STARTTRIAL · DIÁRIO',
    color: COLORS.mediaOnboarding,
    lightColor: COLORS.mediaOnboardingLight,
    headers: ['Data', 'Dia', 'Investimento', 'Impressões', 'Cliques link', 'CTR', 'Installs', 'StartTrial', 'Install → trial', 'CPI', 'Custo/StartTrial'],
  },
];

function paidRowDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function paidTotal(rows: AqPaidDay[], field: 'spend' | 'impressions' | 'linkClicks' | 'installs' | 'startTrials'): number {
  return rows.reduce((sum, row) => sum + (row[field] ?? 0), 0);
}

function formulaWithResult(formula: string, result: number | ''): { formula: string; result: number | '' } {
  return { formula, result };
}

type PaidPhaseLayout = {
  startRow: number;
  dataStartRow: number;
  dataEndRow: number;
  totalRow: number;
  rowCount: number;
};

function paidPhaseLayouts(sourceRows: AqPaidDay[]): Record<AqPaidPhase, PaidPhaseLayout> {
  const layouts = {} as Record<AqPaidPhase, PaidPhaseLayout>;
  let startRow = 1;

  PAID_TABLES.forEach((config) => {
    const rowCount = sourceRows.filter((row) => row.phase === config.phase).length;
    const dataStartRow = startRow + 3;
    const totalRow = dataStartRow + rowCount;
    layouts[config.phase] = {
      startRow,
      dataStartRow,
      dataEndRow: totalRow - 1,
      totalRow,
      rowCount,
    };
    startRow = totalRow + 4;
  });

  return layouts;
}

function paidCoverageText(rows: AqPaidDay[]): string {
  if (rows.length === 0) return 'sem entrega observada';
  const dates = rows.map((row) => row.businessDate).sort();
  return `${formatShortDate(paidRowDate(dates[0]))} a ${formatShortDate(paidRowDate(dates[dates.length - 1]))} · ${rows.length} dias`;
}

type PaidBigNumberCard = {
  label: string;
  formula: string;
  result: number | '';
  format: string;
  note: string;
};

function writePaidBigNumberSection(
  ws: Worksheet,
  startRow: number,
  config: PaidTableConfig,
  coverage: string,
  cards: PaidBigNumberCard[],
): number {
  const maxCol = 14;
  ws.mergeCells(startRow, 1, startRow, maxCol);
  setCell(ws.getCell(startRow, 1), config.title.replace(' · DIÁRIO', ''), {
    bold: true, fillColor: config.color, fontColor: 'FFFFFF', align: 'left', size: 11,
  });

  ws.mergeCells(startRow + 1, 1, startRow + 1, maxCol);
  setCell(ws.getCell(startRow + 1, 1), `COBERTURA · ${coverage} · fonte: v_b2c_app_install_daily`, {
    fillColor: config.lightColor, fontColor: '334155', align: 'left', size: 8,
  });

  cards.forEach((card, index) => {
    const row = startRow + 2 + Math.floor(index / 4) * 6;
    const col = 1 + (index % 4) * 3;
    ws.mergeCells(row, col, row, col + 2);
    ws.mergeCells(row + 1, col, row + 3, col + 2);
    ws.mergeCells(row + 4, col, row + 4, col + 2);
    setCell(ws.getCell(row, col), card.label, {
      bold: true, fillColor: config.color, fontColor: 'FFFFFF', size: 9,
    });
    setCell(ws.getCell(row + 1, col), formulaWithResult(card.formula, card.result), {
      bold: true, fillColor: config.color, fontColor: 'FFFFFF', size: 18,
    });
    ws.getCell(row + 1, col).numFmt = card.format;
    setCell(ws.getCell(row + 4, col), card.note, {
      fillColor: config.lightColor, fontColor: '475569', size: 8,
    });
  });

  return startRow + 14;
}

function writePaidBigNumbersDashboard(
  ws: Worksheet,
  startRow: number,
  paidRows: AqPaidDay[],
  layouts: Record<AqPaidPhase, PaidPhaseLayout>,
): number {
  let nextRow = startRow;

  PAID_TABLES.forEach((config) => {
    const rows = paidRows.filter((row) => row.phase === config.phase);
    if (rows.length === 0) return;

    const layout = layouts[config.phase];
    const totalRef = (column: string) => `'Aquisição Copa'!${column}${layout.totalRow}`;
    const spend = paidTotal(rows, 'spend');
    const impressions = paidTotal(rows, 'impressions');
    const linkClicks = paidTotal(rows, 'linkClicks');
    const installs = paidTotal(rows, 'installs');
    const startTrials = paidTotal(rows, 'startTrials');

    const cards: PaidBigNumberCard[] = config.phase === 'app_install'
      ? [
          { label: 'INVESTIMENTO', formula: totalRef('R'), result: spend, format: '"R$" #,##0.00', note: 'Gasto da fase' },
          { label: 'IMPRESSÕES', formula: totalRef('S'), result: impressions, format: '#,##0', note: 'Entrega de mídia' },
          { label: 'CLIQUES LINK', formula: totalRef('T'), result: linkClicks, format: '#,##0', note: 'Cliques para destino' },
          { label: 'CTR', formula: totalRef('U'), result: impressions > 0 ? linkClicks / impressions : '', format: '0.00%', note: 'Cliques / impressões' },
          { label: 'INSTALLS', formula: totalRef('V'), result: installs, format: '#,##0', note: 'Resultado App Install' },
          { label: 'CLIQUE → INSTALL', formula: totalRef('W'), result: linkClicks > 0 ? installs / linkClicks : '', format: '0.0%', note: 'Installs / cliques link' },
          { label: 'CPI', formula: totalRef('X'), result: installs > 0 ? spend / installs : '', format: '"R$" #,##0.00', note: 'Investimento / installs' },
          {
            label: 'DIAS COM ENTREGA',
            formula: `COUNT('Aquisição Copa'!R${layout.dataStartRow}:R${layout.dataEndRow})`,
            result: layout.rowCount,
            format: '#,##0',
            note: 'Dias observados na fase',
          },
        ]
      : [
          { label: 'INVESTIMENTO', formula: totalRef('R'), result: spend, format: '"R$" #,##0.00', note: 'Gasto da fase' },
          { label: 'IMPRESSÕES', formula: totalRef('S'), result: impressions, format: '#,##0', note: 'Entrega de mídia' },
          { label: 'CLIQUES LINK', formula: totalRef('T'), result: linkClicks, format: '#,##0', note: 'Cliques para destino' },
          { label: 'CTR', formula: totalRef('U'), result: impressions > 0 ? linkClicks / impressions : '', format: '0.00%', note: 'Cliques / impressões' },
          { label: 'INSTALLS', formula: totalRef('V'), result: installs, format: '#,##0', note: 'Installs direcionais' },
          { label: 'STARTTRIALS', formula: totalRef('W'), result: startTrials, format: '#,##0', note: 'Resultado StartTrial' },
          { label: 'INSTALL → TRIAL', formula: totalRef('X'), result: installs > 0 ? startTrials / installs : '', format: '0.0%', note: 'StartTrials / installs' },
          { label: 'CUSTO/STARTTRIAL', formula: totalRef('Z'), result: startTrials > 0 ? spend / startTrials : '', format: '"R$" #,##0.00', note: 'Investimento / StartTrial' },
        ];

    nextRow = writePaidBigNumberSection(ws, nextRow, config, paidCoverageText(rows), cards);
  });

  ws.mergeCells(nextRow, 1, nextRow, 14);
  setCell(ws.getCell(nextRow, 1), 'Mídia paga: CPI e Custo/StartTrial são métricas de resultado de plataforma e não representam CAC/cartão. StartTrial usa atribuição Meta 7d click; installs de onboarding são direcionais.', {
    italic: true, fillColor: COLORS.note, fontColor: COLORS.noteFont, align: 'left', size: 8,
  });
  ws.getRow(nextRow).height = 28;
  return nextRow + 2;
}

function writePaidMediaTable(
  ws: Worksheet,
  startRow: number,
  config: PaidTableConfig,
  sourceRows: AqPaidDay[],
): number {
  const rows = sourceRows.filter((row) => row.phase === config.phase);
  const startCol = AQ_MEDIA_START_COL;
  const endCol = startCol + config.headers.length - 1;
  const paidCols = {
    spend: colLetter(startCol + 2),
    impressions: colLetter(startCol + 3),
    linkClicks: colLetter(startCol + 4),
    installs: colLetter(startCol + 6),
    startTrials: colLetter(startCol + 7),
  };

  ws.mergeCells(startRow, startCol, startRow, endCol);
  setCell(ws.getCell(startRow, startCol), config.title, {
    bold: true, fillColor: config.color, fontColor: 'FFFFFF', align: 'left', size: 11,
  });
  ws.getRow(startRow).height = 20;

  ws.mergeCells(startRow + 1, startCol, startRow + 1, endCol);
  const coverage = rows.length > 0
    ? `${formatShortDate(paidRowDate(rows[0].businessDate))} a ${formatShortDate(paidRowDate(rows[rows.length - 1].businessDate))} · ${rows.length} dias com entrega`
    : 'Sem entrega observada no período fechado';
  const sourceNote = config.phase === 'app_install'
    ? `${coverage} · Meta results: install · 1d click + 1d view`
    : `${coverage} · StartTrial atribuído à Meta: 7d click · installs direcionais`;
  setCell(ws.getCell(startRow + 1, startCol), sourceNote, {
    italic: true, fillColor: config.lightColor, fontColor: '334155', align: 'left', size: 8,
  });
  ws.getRow(startRow + 1).height = 24;

  const headerRow = startRow + 2;
  config.headers.forEach((header, index) => {
    setCell(ws.getCell(headerRow, startCol + index), header, {
      bold: true, fillColor: config.color, fontColor: 'FFFFFF', size: 8,
    });
  });

  const dataStartRow = headerRow + 1;
  rows.forEach((paid, index) => {
    const row = dataStartRow + index;
    const date = paidRowDate(paid.businessDate);
    const fill = date.getDay() === 0 || date.getDay() === 6
      ? COLORS.weekend
      : index % 2 === 0 ? 'FFFFFF' : COLORS.zebra;
    const values: Array<Date | string | number | object | undefined> = config.phase === 'app_install'
      ? [
          date,
          DAY_NAMES[date.getDay()],
          paid.spend,
          paid.impressions,
          paid.linkClicks ?? undefined,
          paid.linkClicks === null
            ? undefined
            : formulaWithResult(`IFERROR(${paidCols.linkClicks}${row}/${paidCols.impressions}${row},"")`, paid.impressions > 0 ? paid.linkClicks / paid.impressions : ''),
          paid.installs ?? undefined,
          paid.installs === null || paid.linkClicks === null
            ? undefined
            : formulaWithResult(`IFERROR(${paidCols.installs}${row}/${paidCols.linkClicks}${row},"")`, paid.linkClicks > 0 ? paid.installs / paid.linkClicks : ''),
          paid.installs === null
            ? undefined
            : formulaWithResult(`IFERROR(${paidCols.spend}${row}/${paidCols.installs}${row},"")`, paid.installs > 0 ? paid.spend / paid.installs : ''),
        ]
      : [
          date,
          DAY_NAMES[date.getDay()],
          paid.spend,
          paid.impressions,
          paid.linkClicks ?? undefined,
          paid.linkClicks === null
            ? undefined
            : formulaWithResult(`IFERROR(${paidCols.linkClicks}${row}/${paidCols.impressions}${row},"")`, paid.impressions > 0 ? paid.linkClicks / paid.impressions : ''),
          paid.installs ?? undefined,
          paid.startTrials ?? undefined,
          paid.startTrials === null || paid.installs === null
            ? undefined
            : formulaWithResult(`IFERROR(${paidCols.startTrials}${row}/${paidCols.installs}${row},"")`, paid.installs > 0 ? paid.startTrials / paid.installs : ''),
          paid.installs === null
            ? undefined
            : formulaWithResult(`IFERROR(${paidCols.spend}${row}/${paidCols.installs}${row},"")`, paid.installs > 0 ? paid.spend / paid.installs : ''),
          paid.startTrials === null
            ? undefined
            : formulaWithResult(`IFERROR(${paidCols.spend}${row}/${paidCols.startTrials}${row},"")`, paid.startTrials > 0 ? paid.spend / paid.startTrials : ''),
        ];

    values.forEach((value, index2) => {
      setCell(ws.getCell(row, startCol + index2), value, {
        fillColor: fill, align: index2 <= 1 ? 'left' : 'right', size: 9,
      });
    });
    ws.getCell(row, startCol).numFmt = 'dd/mm/yyyy';
    ws.getCell(row, startCol + 2).numFmt = '"R$" #,##0.00';
    [startCol + 3, startCol + 4, startCol + 6].forEach((col) => { ws.getCell(row, col).numFmt = '#,##0'; });
    ws.getCell(row, startCol + 5).numFmt = '0.0%';
    if (config.phase === 'app_install') {
      ws.getCell(row, startCol + 7).numFmt = '0.0%';
      ws.getCell(row, startCol + 8).numFmt = '"R$" #,##0.00';
    } else {
      ws.getCell(row, startCol + 7).numFmt = '#,##0';
      ws.getCell(row, startCol + 8).numFmt = '0.0%';
      [startCol + 9, startCol + 10].forEach((col) => { ws.getCell(row, col).numFmt = '"R$" #,##0.00'; });
    }
  });

  const totalRow = dataStartRow + rows.length;
  for (let col = startCol; col <= endCol; col++) {
    setCell(ws.getCell(totalRow, col), '', { bold: true, fillColor: config.lightColor, size: 9 });
  }
  setCell(ws.getCell(totalRow, startCol), 'TOTAL', {
    bold: true, fillColor: config.lightColor, align: 'left', size: 9,
  });
  setCell(ws.getCell(totalRow, startCol + 1), '—', {
    bold: true, fillColor: config.lightColor, align: 'center', size: 9,
  });

  if (rows.length > 0) {
    const dataEndRow = totalRow - 1;
    const spend = paidTotal(rows, 'spend');
    const impressions = paidTotal(rows, 'impressions');
    const clicks = paidTotal(rows, 'linkClicks');
    const installs = paidTotal(rows, 'installs');
    const startTrials = paidTotal(rows, 'startTrials');

    const totals: Array<[number, string, number | '']> = [
      [startCol + 2, `SUM(${paidCols.spend}${dataStartRow}:${paidCols.spend}${dataEndRow})`, spend],
      [startCol + 3, `SUM(${paidCols.impressions}${dataStartRow}:${paidCols.impressions}${dataEndRow})`, impressions],
      [startCol + 4, `SUM(${paidCols.linkClicks}${dataStartRow}:${paidCols.linkClicks}${dataEndRow})`, clicks],
      [startCol + 5, `IFERROR(${paidCols.linkClicks}${totalRow}/${paidCols.impressions}${totalRow},"")`, impressions > 0 ? clicks / impressions : ''],
      [startCol + 6, `SUM(${paidCols.installs}${dataStartRow}:${paidCols.installs}${dataEndRow})`, installs],
    ];
    if (config.phase === 'app_install') {
      totals.push(
        [startCol + 7, `IFERROR(${paidCols.installs}${totalRow}/${paidCols.linkClicks}${totalRow},"")`, clicks > 0 ? installs / clicks : ''],
        [startCol + 8, `IFERROR(${paidCols.spend}${totalRow}/${paidCols.installs}${totalRow},"")`, installs > 0 ? spend / installs : ''],
      );
    } else {
      totals.push(
        [startCol + 7, `SUM(${paidCols.startTrials}${dataStartRow}:${paidCols.startTrials}${dataEndRow})`, startTrials],
        [startCol + 8, `IFERROR(${paidCols.startTrials}${totalRow}/${paidCols.installs}${totalRow},"")`, installs > 0 ? startTrials / installs : ''],
        [startCol + 9, `IFERROR(${paidCols.spend}${totalRow}/${paidCols.installs}${totalRow},"")`, installs > 0 ? spend / installs : ''],
        [startCol + 10, `IFERROR(${paidCols.spend}${totalRow}/${paidCols.startTrials}${totalRow},"")`, startTrials > 0 ? spend / startTrials : ''],
      );
    }
    totals.forEach(([col, formula, result]) => {
      ws.getCell(totalRow, col).value = formulaWithResult(formula, result);
    });
    ws.getCell(totalRow, startCol + 2).numFmt = '"R$" #,##0.00';
    [startCol + 3, startCol + 4, startCol + 6].forEach((col) => { ws.getCell(totalRow, col).numFmt = '#,##0'; });
    ws.getCell(totalRow, startCol + 5).numFmt = '0.0%';
    if (config.phase === 'app_install') {
      ws.getCell(totalRow, startCol + 7).numFmt = '0.0%';
      ws.getCell(totalRow, startCol + 8).numFmt = '"R$" #,##0.00';
    } else {
      ws.getCell(totalRow, startCol + 7).numFmt = '#,##0';
      ws.getCell(totalRow, startCol + 8).numFmt = '0.0%';
      [startCol + 9, startCol + 10].forEach((col) => { ws.getCell(totalRow, col).numFmt = '"R$" #,##0.00'; });
    }
  }

  const noteRow = totalRow + 1;
  ws.mergeCells(noteRow, startCol, noteRow, endCol);
  const semanticNote = config.phase === 'app_install'
    ? 'CPI = investimento / installs. Resultado de plataforma; não é CAC.'
    : 'Custo/StartTrial = investimento / StartTrial. Installs e taxa diária são direcionais; a taxa pode superar 100% por diferença de janela de atribuição. Ausência fica em branco.';
  setCell(ws.getCell(noteRow, startCol), semanticNote, {
    italic: true, fillColor: COLORS.note, fontColor: COLORS.noteFont, align: 'left', size: 8,
  });
  ws.getRow(noteRow).height = 26;

  return noteRow + 3;
}

function writeAquisicaoCopaSheet(wb: Workbook, index: AqIndex, dates: Date[], paidRows: AqPaidDay[]): void {
  const ws = wb.addWorksheet('Aquisição Copa', {
    views: [{ state: 'frozen', xSplit: 3, ySplit: 0, topLeftCell: 'D1', showGridLines: false }],
  });

  if (index.blocks.length === 0 && paidRows.length === 0) {
    ws.mergeCells(1, 1, 3, AQ_MAX_COL);
    setCell(ws.getCell(1, 1), 'Sem disparos de aquisição Copa no período fechado.', {
      bold: true, fillColor: 'FEE2E2', fontColor: '991B1B', size: 12,
    });
    return;
  }

  if (index.blocks.length === 0) {
    ws.mergeCells(1, 1, 3, AQ_MAX_COL);
    setCell(ws.getCell(1, 1), 'Sem disparos CRM de aquisição Copa no período fechado.', {
      bold: true, fillColor: COLORS.cover, fontColor: COLORS.coverFont, size: 11,
    });
  } else {
    let nextRow = 1;
    for (const block of index.blocks) {
      nextRow = writeAqSection(ws, nextRow, block, dates);
    }
  }

  [16, 6, 9, 12, 12, 11, 10, 11, 11, 11, 11, 12, 11, 12].forEach((w, i) => { ws.getColumn(i + 1).width = w; });
  ws.getColumn(15).width = 3;
  [13, 6, 14, 13, 13, 9, 11, 12, 12, 12, 15].forEach((width, index2) => {
    ws.getColumn(AQ_MEDIA_START_COL + index2).width = width;
  });

  const layouts = paidPhaseLayouts(paidRows);
  PAID_TABLES.forEach((config) => {
    writePaidMediaTable(ws, layouts[config.phase].startRow, config, paidRows);
  });
}

// ── Aba "Big Numbers Aquisição Copa" ────────────────────────────────────────────

function writeAquisicaoCopaBigNumbersSheet(wb: Workbook, index: AqIndex, dates: Date[], paidRows: AqPaidDay[]): void {
  const maxCol = 14;
  const ws = wb.addWorksheet('Big Numbers Aquisição Copa', {
    views: [{ state: 'frozen', ySplit: 4, topLeftCell: 'A5', showGridLines: false }],
  });
  ws.pageSetup.orientation = 'landscape';
  ws.pageSetup.fitToPage = true;
  ws.pageSetup.fitToWidth = 1;
  ws.pageSetup.fitToHeight = 0;
  for (let col = 1; col <= maxCol; col++) ws.getColumn(col).width = col === 1 ? 16 : 12;

  ws.mergeCells(1, 1, 1, maxCol);
  setCell(ws.getCell(1, 1), 'BIG NUMBERS AQUISIÇÃO COPA', {
    bold: true, fillColor: COLORS.header, fontColor: 'FFFFFF', align: 'left', size: 18,
  });
  ws.getRow(1).height = 30;

  ws.mergeCells(2, 1, 2, maxCol);
  const periodText = dates.length > 0
    ? `${formatShortDate(dates[0])} a ${formatShortDate(dates[dates.length - 1])} · somente dias fechados`
    : 'Período sem dias fechados';
  setCell(ws.getCell(2, 1), periodText, { bold: true, fillColor: COLORS.subHeader, fontColor: COLORS.header, align: 'left', size: 11 });
  ws.getRow(2).height = 21;

  const paidLayouts = paidPhaseLayouts(paidRows);
  const appPaidRows = paidRows.filter((row) => row.phase === 'app_install');
  const onboardingPaidRows = paidRows.filter((row) => row.phase === 'onboarding');
  const hasCrm = index.total.enviados > 0;
  const hasPaid = paidRows.length > 0;

  ws.mergeCells(3, 1, 3, maxCol);
  setCell(ws.getCell(3, 1), `COBERTURA · CRM: ${index.coverageDays}/${dates.length} dias · App Install: ${paidCoverageText(appPaidRows)} · Onboarding: ${paidCoverageText(onboardingPaidRows)} · fontes: activities + v_b2c_app_install_daily`, {
    fillColor: COLORS.cover, fontColor: COLORS.coverFont, align: 'left', size: 9,
  });
  ws.getRow(3).height = 26;

  ws.mergeCells(4, 1, 4, maxCol);
  setCell(ws.getCell(4, 1), 'Leitura: volumes são somas do período e taxas são recalculadas pelos agregados. CRM: CAC = custo / cartões. Mídia: CPI = investimento / installs e Custo/StartTrial = investimento / StartTrial; métricas de plataforma não são CAC.', {
    italic: true, fillColor: COLORS.note, fontColor: COLORS.noteFont, align: 'left', size: 9,
  });
  ws.getRow(4).height = 34;

  if (dates.length === 0 || (!hasCrm && !hasPaid)) {
    ws.mergeCells(6, 1, 8, maxCol);
    setCell(ws.getCell(6, 1), 'Sem dados de aquisição Copa no período fechado.', {
      bold: true, fillColor: 'FEE2E2', fontColor: '991B1B', size: 12,
    });
    return;
  }

  if (!hasCrm) {
    const nextRow = writePaidBigNumbersDashboard(ws, 6, paidRows, paidLayouts);
    ws.mergeCells(nextRow, 1, nextRow, maxCol);
    setCell(ws.getCell(nextRow, 1), 'CRM aquisição Copa sem dados no período fechado; Big Numbers exibidos apenas para mídia paga.', {
      bold: true, fillColor: COLORS.cover, fontColor: COLORS.coverFont, align: 'left', size: 9,
    });
    return;
  }

  // Layout de linhas (espelha a aba Big Numbers de Renta).
  const efficiencyHeaderRow = hasPaid
    ? writePaidBigNumbersDashboard(ws, 24, paidRows, paidLayouts)
    : 24;
  const crmTableHeaderRow = efficiencyHeaderRow + 6;
  const crmDataStartRow = crmTableHeaderRow + 1;
  const weeklyHeaderRow = crmTableHeaderRow + 10;
  const weeklyStartRow = weeklyHeaderRow + 1;
  const weeklyEndRow = weeklyStartRow + index.weekly.length - 1;
  const wr = (col: string) => `${col}${weeklyStartRow}:${col}${weeklyEndRow}`;

  // ── Cards (somam a tabela semanal) ──
  type Card = { label: string; formula: string; format: string; fill: string; note: string };
  const cards: Card[] = [
    { label: 'DISPAROS', formula: `SUM(${wr('B')})`, format: '#,##0', fill: '475569', note: 'Linhas de disparo realizadas' },
    { label: 'ENVIADOS', formula: `SUM(${wr('C')})`, format: '#,##0', fill: '334155', note: 'Base Total' },
    { label: 'ENTREGUES', formula: `SUM(${wr('D')})`, format: '#,##0', fill: '15803D', note: 'Base Acionável' },
    { label: 'PROPOSTAS', formula: `SUM(${wr('G')})`, format: '#,##0', fill: '0369A1', note: 'Propostas no período' },
    { label: 'APROVADOS', formula: `SUM(${wr('H')})`, format: '#,##0', fill: '2563EB', note: 'Aprovados no período' },
    { label: 'CARTÕES', formula: `SUM(${wr('I')})`, format: '#,##0', fill: '7C3AED', note: 'Cartões Gerados' },
    { label: 'CUSTO', formula: `SUM(${wr('J')})`, format: '"R$" #,##0.00', fill: '4472C4', note: 'Custo Total Campanha' },
    { label: 'CAC', formula: `IFERROR(SUM(${wr('J')})/SUM(${wr('I')}),"")`, format: '"R$" #,##0.00', fill: 'DC2626', note: 'Custo / Cartões' },
    { label: 'ABERTURAS', formula: `SUM(${wr('E')})`, format: '#,##0', fill: '0F766E', note: 'WhatsApp + e-mail' },
    { label: 'CLIQUES', formula: `SUM(${wr('F')})`, format: '#,##0', fill: 'C2410C', note: 'Cliques (essencialmente e-mail)' },
  ];
  cards.forEach((card, i) => {
    const row = 6 + Math.floor(i / 4) * 6;
    const col = 1 + (i % 4) * 3;
    ws.mergeCells(row, col, row, col + 2);
    ws.mergeCells(row + 1, col, row + 3, col + 2);
    ws.mergeCells(row + 4, col, row + 4, col + 2);
    setCell(ws.getCell(row, col), card.label, { bold: true, fillColor: card.fill, fontColor: 'FFFFFF', size: 9 });
    setCell(ws.getCell(row + 1, col), { formula: card.formula }, { bold: true, fillColor: card.fill, fontColor: 'FFFFFF', size: 18 });
    ws.getCell(row + 1, col).numFmt = card.format;
    setCell(ws.getCell(row + 4, col), card.note, { fillColor: COLORS.cover, fontColor: '475569', size: 8 });
  });

  // ── Eficiência do período ──
  ws.mergeCells(efficiencyHeaderRow, 1, efficiencyHeaderRow, maxCol);
  setCell(ws.getCell(efficiencyHeaderRow, 1), 'EFICIÊNCIA DO PERÍODO · CRM AQUISIÇÃO', { bold: true, fillColor: COLORS.header, fontColor: 'FFFFFF', align: 'left', size: 11 });
  const efficiency: Array<{ label: string; formula: string; format: string; fill: string }> = [
    { label: 'TX ENTREGA', formula: `IFERROR(SUM(${wr('D')})/SUM(${wr('C')}),"")`, format: '0.0%', fill: '15803D' },
    { label: 'TX ABERTURA', formula: `IFERROR(SUM(${wr('E')})/SUM(${wr('D')}),"")`, format: '0.0%', fill: '0F766E' },
    { label: 'TX CLIQUE', formula: `IFERROR(SUM(${wr('F')})/SUM(${wr('D')}),"")`, format: '0.0%', fill: 'C2410C' },
    { label: 'TX PROPOSTA', formula: `IFERROR(SUM(${wr('G')})/SUM(${wr('D')}),"")`, format: '0.0%', fill: '0369A1' },
    { label: 'TX APROVAÇÃO', formula: `IFERROR(SUM(${wr('H')})/SUM(${wr('G')}),"")`, format: '0.0%', fill: '2563EB' },
    { label: 'TX CARTÃO', formula: `IFERROR(SUM(${wr('I')})/SUM(${wr('D')}),"")`, format: '0.0%', fill: '7C3AED' },
    { label: 'CAC', formula: `IFERROR(SUM(${wr('J')})/SUM(${wr('I')}),"")`, format: '"R$" #,##0.00', fill: 'DC2626' },
  ];
  efficiency.forEach((metric, i) => {
    const col = 1 + i * 2;
    ws.mergeCells(efficiencyHeaderRow + 1, col, efficiencyHeaderRow + 1, col + 1);
    ws.mergeCells(efficiencyHeaderRow + 2, col, efficiencyHeaderRow + 4, col + 1);
    setCell(ws.getCell(efficiencyHeaderRow + 1, col), metric.label, { bold: true, fillColor: metric.fill, fontColor: 'FFFFFF', size: 8 });
    setCell(ws.getCell(efficiencyHeaderRow + 2, col), { formula: metric.formula }, { bold: true, fillColor: COLORS.cover, fontColor: '0F172A', size: 13 });
    ws.getCell(efficiencyHeaderRow + 2, col).numFmt = metric.format;
  });

  // ── Totais por canal (CRM) ──
  ws.mergeCells(crmTableHeaderRow - 1, 1, crmTableHeaderRow - 1, maxCol);
  setCell(ws.getCell(crmTableHeaderRow - 1, 1), 'TOTAIS POR CANAL · CRM AQUISIÇÃO', {
    bold: true, fillColor: COLORS.header, fontColor: 'FFFFFF', align: 'left', size: 11,
  });
  const crmHeaders = ['Canal', 'Enviados', 'Entregues', 'Tx entrega', 'Aberturas', 'Tx abertura', 'Cliques', 'Tx clique', 'Propostas', 'Aprovados', 'Cartões', 'CAC'];
  crmHeaders.forEach((h, i) => setCell(ws.getCell(crmTableHeaderRow, i + 1), h, {
    bold: true, fillColor: COLORS.crmHeaderFill, fontColor: COLORS.crmHeaderFont, size: 8,
  }));

  const channelRows: Array<CopaChannel | 'TOTAL'> = [...COPA_CHANNELS, 'TOTAL'];
  channelRows.forEach((channel, index2) => {
    const row = crmDataStartRow + index2;
    const m = channel === 'TOTAL' ? index.total : index.byChannel[channel];
    const isTotal = channel === 'TOTAL';
    const showOpen = m.abertura > 0;
    const showClick = m.cliques > 0;
    const fill = isTotal ? COLORS.total : index2 % 2 === 0 ? 'FFFFFF' : COLORS.zebra;
    const values: Array<string | number | object | undefined> = [
      channel,
      m.enviados,
      m.entregues,
      { formula: `IFERROR(C${row}/B${row},"")` },
      showOpen ? m.abertura : undefined,
      showOpen ? { formula: `IFERROR(E${row}/C${row},"")` } : undefined,
      showClick ? m.cliques : undefined,
      showClick ? { formula: `IFERROR(G${row}/C${row},"")` } : undefined,
      m.propostas,
      m.aprovados,
      m.cartoes,
      m.cartoes > 0 ? m.custo / m.cartoes : undefined, // CAC = Custo Total Campanha / Cartões
    ];
    values.forEach((v, i) => setCell(ws.getCell(row, i + 1), v, {
      bold: isTotal, fillColor: fill, align: i === 0 ? 'left' : 'right', size: 9,
    }));
    [2, 3, 9, 10, 11].forEach((c) => { ws.getCell(row, c).numFmt = '#,##0'; });
    ws.getCell(row, 4).numFmt = '0.0%';
    ws.getCell(row, 12).numFmt = '"R$" #,##0.00';
    if (showOpen) { ws.getCell(row, 5).numFmt = '#,##0'; ws.getCell(row, 6).numFmt = '0.0%'; }
    if (showClick) { ws.getCell(row, 7).numFmt = '#,##0'; ws.getCell(row, 8).numFmt = '0.0%'; }
  });

  // ── Evolução semanal ──
  ws.mergeCells(weeklyHeaderRow - 1, 1, weeklyHeaderRow - 1, maxCol);
  setCell(ws.getCell(weeklyHeaderRow - 1, 1), 'EVOLUÇÃO SEMANAL · CRM AQUISIÇÃO (seg a dom)', {
    bold: true, fillColor: COLORS.header, fontColor: 'FFFFFF', align: 'left', size: 11,
  });
  const weeklyHeaders = ['Semana', 'Disparos', 'Enviados', 'Entregues', 'Aberturas', 'Cliques', 'Propostas', 'Aprovados', 'Cartões', 'Custo', 'Tx entrega', 'Tx cartão', 'CAC', 'Dias'];
  weeklyHeaders.forEach((h, i) => setCell(ws.getCell(weeklyHeaderRow, i + 1), h, {
    bold: true, fillColor: COLORS.subHeader, fontColor: COLORS.header, size: 8,
  }));
  index.weekly.forEach((week, i) => {
    const row = weeklyStartRow + i;
    const fill = i % 2 === 0 ? 'FFFFFF' : COLORS.zebra;
    const m = week.metrics;
    // "Disparos" da semana não é rastreado separadamente aqui; usamos enviados como proxy de volume no card DISPAROS.
    const values: Array<string | number | object> = [
      `${formatShortDate(week.start)} a ${formatShortDate(week.end)}`,
      m.disparos,
      m.enviados, m.entregues, m.abertura, m.cliques, m.propostas, m.aprovados, m.cartoes, m.custo,
      { formula: `IFERROR(D${row}/C${row},"")` },
      { formula: `IFERROR(I${row}/D${row},"")` },
      { formula: `IFERROR(J${row}/I${row},"")` },
      week.days,
    ];
    values.forEach((v, idx) => setCell(ws.getCell(row, idx + 1), v, {
      fillColor: fill, align: idx === 0 ? 'left' : 'right', size: 9,
    }));
    [2, 3, 4, 5, 6, 7, 8, 9, 14].forEach((c) => { ws.getCell(row, c).numFmt = '#,##0'; });
    ws.getCell(row, 10).numFmt = '"R$" #,##0.00';
    [11, 12].forEach((c) => { ws.getCell(row, c).numFmt = '0.0%'; });
    ws.getCell(row, 13).numFmt = '"R$" #,##0.00';
  });

  const noteRow = weeklyEndRow + 2;
  ws.mergeCells(noteRow, 1, noteRow, maxCol);
  setCell(ws.getCell(noteRow, 1), 'Fonte: activities (jornada COPA + etapa Aquisição/Meio de Funil, status Realizado). CAC = Custo Total Campanha / Cartões Gerados, por canal e no total.', {
    italic: true, fillColor: COLORS.note, fontColor: COLORS.noteFont, align: 'left', size: 9,
  });
  ws.getRow(noteRow).height = 30;
}

// ── Workbook + export público ────────────────────────────────────────────────────

function downloadBuffer(buffer: BlobPart, filename: string): void {
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Monta o workbook FECHAMENTO COPA (4 abas) a partir de dados já buscados.
 * Separado do fetch/download para permitir validação headless (Node) e reuso.
 * `createChartImages` fica opcional porque depende de `document` (só no browser).
 */
export function buildFechamentoCopaWorkbook(
  ExcelJSRuntime: { Workbook: new () => Workbook },
  params: {
    rntRows: RawRow[];
    aqRows: RawRow[];
    aqPaidRows?: AqPaidDay[];
    fixedIdx: Parameters<typeof writeCopaSheet>[5];
    start: Date;
    end: Date;
    createChartImages?: boolean;
    eventNotes?: CopaEventNote[];
  },
): Workbook {
  const { rntRows, aqRows, aqPaidRows = [], fixedIdx, start, end, eventNotes } = params;
  const copaStart = COPA_ACTION_START;
  const copaActionDates = copaStart <= end ? allDates(copaStart, end) : [];
  const copaDetailStart = start < COPA_ACTION_START ? COPA_ACTION_START : start;
  const copaDetailDates = copaDetailStart <= end ? allDates(copaDetailStart, end) : [];

  const copaActionIdx = buildCopaIndex(rntRows, copaStart, end);
  const crmSummary = copaCrmChartSummary(copaActionIdx, copaActionDates);
  const chartImages = params.createChartImages
    ? createCopaChartImages(copaActionDates, fixedIdx, crmSummary)
    : undefined;
  const aqIndex = buildAqIndex(aqRows, copaActionDates, copaStart, end);

  const wb = new ExcelJSRuntime.Workbook();
  wb.creator = 'GaaS AFINZ — Fechamento Copa';
  wb.created = new Date();
  wb.calcProperties.fullCalcOnLoad = true;

  // Ordem: 1) Rentabilização Copa 2) Big Numbers Renta 3) Aquisição Copa 4) Big Numbers Aquisição
  writeCopaSheet(wb, rntRows, copaDetailDates, copaDetailStart, end, fixedIdx, chartImages);
  writeCopaBigNumbersSheet(wb, copaActionDates, fixedIdx, copaActionIdx, chartImages, eventNotes);
  writeAquisicaoCopaSheet(wb, aqIndex, copaActionDates, aqPaidRows);
  writeAquisicaoCopaBigNumbersSheet(wb, aqIndex, copaActionDates, aqPaidRows);

  return wb;
}

export async function exportFechamentoCopaXlsx(
  start: Date,
  end: Date,
): Promise<{ rows: number; filename: string }> {
  const effectiveEnd = closedEnd(end);
  if (effectiveEnd < start) throw new Error('O periodo selecionado ainda nao possui dias fechados.');

  // A ação Copa tem janela fixa a partir de 13/04; as abas cobrem [COPA_ACTION_START, fim fechado].
  const copaStart = COPA_ACTION_START;
  if (copaStart > effectiveEnd) throw new Error('A acao Copa ainda nao possui dias fechados.');

  const [rntRows, fixedIdx, aqRows, aqPaidRows, eventNotes, ExcelJSModule] = await Promise.all([
    fetchRntRows(copaStart, effectiveEnd),
    fetchCopaFixedDaily(copaStart, effectiveEnd),
    fetchSupabaseRows(copaStart, effectiveEnd),
    fetchAqPaidDaily(copaStart, effectiveEnd),
    fetchCopaEventNotes(copaStart, effectiveEnd),
    import('exceljs'),
  ]);

  const wb = buildFechamentoCopaWorkbook(ExcelJSModule.default, {
    rntRows,
    aqRows: aqRows as RawRow[],
    aqPaidRows,
    fixedIdx,
    start,
    end: effectiveEnd,
    createChartImages: true,
    eventNotes,
  });

  const buffer = await wb.xlsx.writeBuffer();
  const filename = `fechamento_copa_${isoDate(copaStart).replace(/-/g, '')}_${isoDate(effectiveEnd).replace(/-/g, '')}.xlsx`;
  downloadBuffer(buffer, filename);
  return { rows: rntRows.length + (aqRows as RawRow[]).length + aqPaidRows.length, filename };
}
