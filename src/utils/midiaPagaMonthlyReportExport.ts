import type { Workbook, Worksheet } from 'exceljs';
import { supabase } from '../services/supabaseClient';
import {
  MONTHS_PT,
  REPORT_COLORS,
  monthStart,
  monthEnd,
  previousMonthStart,
  reportDelta,
  reportPctText,
  dayOfMonthReport,
  weekWindows,
  previousWeekWindows,
  setCellValue,
  styleReportDelta,
  writeSectionTitle,
  writeAquisicaoCrmMonthlySheet,
  type WeekWindow,
} from './crmAquisicaoMonthlyReportExport';
import { fetchSupabaseRows } from './aquisicaoCrmExcelExport';
import { writeMidiaPagaDiarizadoSheet } from './midiaPagaDiarizadoSheet';

export type MidiaFrente = 'Aquisição B2C' | 'Aquisição Plurix' | 'Marca B2C (Copa)' | 'Seguros';

export const FRENTE_ORDER: MidiaFrente[] = ['Aquisição B2C', 'Aquisição Plurix', 'Marca B2C (Copa)', 'Seguros'];

export const HERO_KPI: Record<MidiaFrente, 'CPC' | 'CPM' | 'CPL'> = {
  'Aquisição B2C': 'CPC',
  'Aquisição Plurix': 'CPC',
  'Marca B2C (Copa)': 'CPM',
  'Seguros': 'CPL',
};

// Budget mensal por frente (mesmos valores do Diarizado; ajustar quando houver fonte em goals).
export const FRENTE_BUDGET: Record<MidiaFrente, number> = {
  'Aquisição B2C': 7000,
  'Aquisição Plurix': 3000,
  'Marca B2C (Copa)': 5000,
  'Seguros': 3000,
};

// Rótulo do resultado por objetivo da campanha (para a coluna Tipo do criativo).
const RESULT_LABEL: Record<string, string> = {
  app_installs: 'Instalações',
  awareness: 'Alcance',
  leads: 'Cadastros',
  conversion: 'Conversões',
};
const resultLabel = (objective: string): string => RESULT_LABEL[objective] || 'Resultado';

export type MediaMetrics = {
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  reach: number;
};

export type PaidRow = {
  date: string;
  day: number;
  channel: string;
  campaign: string;
  objective: string;
  adName: string | null;
  adsetName: string | null;
  frente: MidiaFrente;
  metrics: MediaMetrics;
};

type PaidMediaRawRow = Record<string, any>;

// Classificação de frente SÓ pela tag do nome da campanha (nunca por objective).
// Precedência exata: Marca/Copa → Seguros → Plurix → resto (Aquisição B2C).
export function classifyFrente(campaign: unknown): MidiaFrente {
  const c = String(campaign ?? '');
  if (/COPA|RENTABILIZA|LP_Visa|DISPLAY_B2C_VISA|\[Demand\]|\[Youtube\]/i.test(c)) return 'Marca B2C (Copa)';
  if (/\[SEGUROS\]/i.test(c)) return 'Seguros';
  if (/\[PLURIX\]|mais_amigo/i.test(c)) return 'Aquisição Plurix';
  return 'Aquisição B2C';
}

// Dentro de Aquisição B2C, a campanha de Onboarding otimiza para Start Trial (In-app trials started);
// as demais otimizam para Instalação (Mobile app installs). Separa os dois resultados pela tag da campanha.
export const isTrialCampaign = (campaign: string): boolean => /onboarding/i.test(campaign);

export const emptyMediaMetrics = (): MediaMetrics => ({ spend: 0, impressions: 0, clicks: 0, conversions: 0, reach: 0 });

export const addMediaMetrics = (target: MediaMetrics, source: MediaMetrics): MediaMetrics => {
  target.spend += source.spend;
  target.impressions += source.impressions;
  target.clicks += source.clicks;
  target.conversions += source.conversions;
  target.reach += source.reach;
  return target;
};

export const mediaCpc = (m: MediaMetrics): number | null => (m.clicks ? m.spend / m.clicks : null);
export const mediaCpm = (m: MediaMetrics): number | null => (m.impressions ? (m.spend / m.impressions) * 1000 : null);
export const mediaCtr = (m: MediaMetrics): number | null => (m.impressions ? m.clicks / m.impressions : null);
export const mediaCpl = (m: MediaMetrics): number | null => (m.conversions ? m.spend / m.conversions : null);
export const mediaFrequency = (m: MediaMetrics): number | null => (m.reach ? m.impressions / m.reach : null);

export const heroKpiValue = (frente: MidiaFrente, metrics: MediaMetrics): number | null => {
  const kpi = HERO_KPI[frente];
  if (kpi === 'CPC') return mediaCpc(metrics);
  if (kpi === 'CPM') return mediaCpm(metrics);
  return mediaCpl(metrics);
};

const mediaToNumber = (value: any): number => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const mediaIsoDate = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const mediaMonthKey = (date: Date): string => mediaIsoDate(date).slice(0, 7);

const toPaidRow = (row: PaidMediaRawRow): PaidRow => {
  const date = String(row.date ?? '').slice(0, 10);
  return {
    date,
    day: dayOfMonthReport(date),
    channel: String(row.channel ?? 'unknown').toLowerCase(),
    campaign: String(row.campaign ?? ''),
    objective: String(row.objective ?? '').toLowerCase(),
    adName: row.ad_name ? String(row.ad_name) : null,
    adsetName: row.adset_name ? String(row.adset_name) : null,
    frente: classifyFrente(row.campaign),
    metrics: {
      spend: mediaToNumber(row.spend),
      impressions: mediaToNumber(row.impressions),
      clicks: mediaToNumber(row.clicks),
      conversions: mediaToNumber(row.conversions),
      reach: mediaToNumber(row.reach),
    },
  };
};

type CreativeRow = {
  frente: MidiaFrente;
  adset: string;
  ad: string;
  metrics: MediaMetrics;
};

type MidiaAnalysis = {
  currentRows: PaidRow[];
  previousRows: PaidRow[];
  currentTotal: MediaMetrics;
  previousTotal: MediaMetrics;
  byFrenteCurrent: Map<MidiaFrente, MediaMetrics>;
  byFrentePrevious: Map<MidiaFrente, MediaMetrics>;
  platformKeys: string[];
  byPlatformCurrent: Map<string, MediaMetrics>;
  byPlatformPrevious: Map<string, MediaMetrics>;
  currentWindows: WeekWindow[];
  weeklyCurrent: Map<MidiaFrente, MediaMetrics[]>;
  weeklyPrevious: Map<MidiaFrente, MediaMetrics[]>;
  creatives: CreativeRow[];
  adCoverage: number | null;
  currentStart: Date;
  previousStart: Date;
  maxDataDay: number;
};

const aggregateMedia = (rows: PaidRow[]): MediaMetrics =>
  rows.reduce((total, row) => addMediaMetrics(total, row.metrics), emptyMediaMetrics());

const groupMedia = <K,>(rows: PaidRow[], keyFn: (row: PaidRow) => K): Map<K, MediaMetrics> => {
  const grouped = new Map<K, MediaMetrics>();
  rows.forEach((row) => {
    const key = keyFn(row);
    if (!grouped.has(key)) grouped.set(key, emptyMediaMetrics());
    addMediaMetrics(grouped.get(key)!, row.metrics);
  });
  return grouped;
};

const mediaOrEmpty = <K,>(map: Map<K, MediaMetrics>, key: K): MediaMetrics => map.get(key) ?? emptyMediaMetrics();

export function buildMidiaPagaAnalysis(
  rawCurrent: PaidMediaRawRow[],
  rawPrevious: PaidMediaRawRow[],
  currentStart: Date,
  currentEnd: Date,
): MidiaAnalysis {
  const currentRows = rawCurrent.map(toPaidRow);
  const previousRows = rawPrevious.map(toPaidRow);
  const prevStart = previousMonthStart(currentStart);

  const maxDataDay = currentRows.length
    ? Math.max(...currentRows.map((row) => row.day))
    : currentEnd.getDate();
  const currentWindows = weekWindows(currentStart, Math.min(maxDataDay, monthEnd(currentStart).getDate()));
  const prevWindows = previousWeekWindows(prevStart, currentWindows);

  const currentTotal = aggregateMedia(currentRows);
  const previousTotal = aggregateMedia(previousRows);
  const byFrenteCurrent = groupMedia(currentRows, (row) => row.frente);
  const byFrentePrevious = groupMedia(previousRows, (row) => row.frente);
  FRENTE_ORDER.forEach((frente) => {
    if (!byFrenteCurrent.has(frente)) byFrenteCurrent.set(frente, emptyMediaMetrics());
    if (!byFrentePrevious.has(frente)) byFrentePrevious.set(frente, emptyMediaMetrics());
  });
  const byPlatformCurrent = groupMedia(currentRows, (row) => row.channel);
  const byPlatformPrevious = groupMedia(previousRows, (row) => row.channel);
  const platformKeys = Array.from(new Set(['meta', 'google', ...byPlatformCurrent.keys(), ...byPlatformPrevious.keys()]));

  const weeklyCurrent = new Map<MidiaFrente, MediaMetrics[]>();
  const weeklyPrevious = new Map<MidiaFrente, MediaMetrics[]>();
  FRENTE_ORDER.forEach((frente) => {
    weeklyCurrent.set(frente, currentWindows.map(() => emptyMediaMetrics()));
    weeklyPrevious.set(frente, prevWindows.map(() => emptyMediaMetrics()));
  });
  currentRows.forEach((row) => {
    const index = currentWindows.findIndex((window) => row.day >= window.startDay && row.day <= window.endDay);
    if (index >= 0) addMediaMetrics(weeklyCurrent.get(row.frente)![index], row.metrics);
  });
  previousRows.forEach((row) => {
    const index = prevWindows.findIndex((window) => row.day >= window.startDay && row.day <= window.endDay);
    if (index >= 0) addMediaMetrics(weeklyPrevious.get(row.frente)![index], row.metrics);
  });

  const creativeMap = new Map<string, CreativeRow>();
  currentRows
    .filter((row) => row.channel === 'meta' && row.adName)
    .forEach((row) => {
      const adset = row.adsetName ?? '—';
      const key = `${row.frente}||${adset}||${row.adName}`;
      if (!creativeMap.has(key)) {
        creativeMap.set(key, { frente: row.frente, adset, ad: row.adName!, metrics: emptyMediaMetrics() });
      }
      addMediaMetrics(creativeMap.get(key)!.metrics, row.metrics);
    });
  const creatives = Array.from(creativeMap.values()).sort((a, b) =>
    FRENTE_ORDER.indexOf(a.frente) - FRENTE_ORDER.indexOf(b.frente)
    || a.adset.localeCompare(b.adset)
    || b.metrics.spend - a.metrics.spend);

  const metaSpend = mediaOrEmpty(byPlatformCurrent, 'meta').spend;
  const metaSpendWithAd = currentRows
    .filter((row) => row.channel === 'meta' && row.adName)
    .reduce((sum, row) => sum + row.metrics.spend, 0);
  const adCoverage = metaSpend > 0 ? metaSpendWithAd / metaSpend : null;

  // Validação obrigatória: os totais das seções precisam reconciliar com o total do mês.
  const EPS = 0.01;
  const near = (a: number, b: number): boolean => Math.abs(a - b) <= EPS;
  const spendByFrente = FRENTE_ORDER.reduce((sum, frente) => sum + mediaOrEmpty(byFrenteCurrent, frente).spend, 0);
  const spendByPlatform = Array.from(byPlatformCurrent.values()).reduce((sum, metrics) => sum + metrics.spend, 0);
  const spendWeekly = FRENTE_ORDER.reduce((sum, frente) => sum + weeklyCurrent.get(frente)!.reduce((inner, metrics) => inner + metrics.spend, 0), 0);
  const clicksWeekly = FRENTE_ORDER.reduce((sum, frente) => sum + weeklyCurrent.get(frente)!.reduce((inner, metrics) => inner + metrics.clicks, 0), 0);
  if (!near(spendByFrente, currentTotal.spend) || !near(spendByPlatform, currentTotal.spend)
    || !near(spendWeekly, currentTotal.spend) || !near(clicksWeekly, currentTotal.clicks)) {
    throw new Error('Validação falhou: totais de mídia paga não reconciliam.');
  }

  return {
    currentRows,
    previousRows,
    currentTotal,
    previousTotal,
    byFrenteCurrent,
    byFrentePrevious,
    platformKeys,
    byPlatformCurrent,
    byPlatformPrevious,
    currentWindows,
    weeklyCurrent,
    weeklyPrevious,
    creatives,
    adCoverage,
    currentStart,
    previousStart: prevStart,
    maxDataDay,
  };
}

const CURRENCY_FMT = '"R$" #,##0.00';
const INT_FMT = '#,##0';
const PCT_FMT = '0.00%';
const REPORT_WIDTH = 18;

const fmtBRLText = (value: number | null): string =>
  value === null ? '—' : `R$ ${value.toFixed(2).replace('.', ',')}`;

// Cores de cabeçalho por grupo temático (organização visual das seções).
const HEADER_FILL = {
  realizado: '0F766E', // teal — metas / pacing
  resultados: '1E3A8A', // navy — resultado principal
  semanal: '6D28D9', // violet — visões temporais
  plataforma: '0E7490', // cyan — canais
  google: 'B45309', // amber — Google
  criativo: 'BE185D', // pink — criativo
  eficiencia: '4338CA', // indigo — eficiência
};

function writeColoredHeader(ws: Worksheet, row: number, headers: string[], fill: string): void {
  headers.forEach((header, index) => {
    const cell = ws.getCell(row, index + 1);
    setCellValue(cell, header, { bold: true, fill, fontColor: REPORT_COLORS.white, align: 'center' });
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  });
  ws.getRow(row).height = 30;
}

function writeColoredTitle(ws: Worksheet, row: number, title: string, columns: number, color: string): void {
  ws.mergeCells(row, 1, row, columns);
  setCellValue(ws.getCell(row, 1), title, { bold: true, align: 'left' });
  ws.getCell(row, 1).font = { name: 'Arial', bold: true, color: { argb: color }, size: 14 };
}

type MetricSpec = { label: string; get: (m: MediaMetrics) => number | null; fmt: 'currency' | 'int' | 'pct'; invert: boolean };
const numFmtOf = (fmt: MetricSpec['fmt']): string => (fmt === 'currency' ? CURRENCY_FMT : fmt === 'int' ? INT_FMT : PCT_FMT);

// Cada métrica vira 3 colunas: valor do mês atual, valor do mês anterior (nomeados) e Δ MoM.
function writeComparativeRow(
  ws: Worksheet,
  row: number,
  name: string,
  current: MediaMetrics,
  previous: MediaMetrics,
  specs: MetricSpec[],
  isTotal: boolean,
  trailing: (string | number | null)[] = [],
): void {
  setCellValue(ws.getCell(row, 1), name, { bold: isTotal, fill: isTotal ? REPORT_COLORS.total : undefined, align: 'left' });
  specs.forEach((spec, index) => {
    const curCol = 2 + index * 3;
    const cur = spec.get(current);
    const prev = spec.get(previous);
    const delta = reportDelta(cur, prev);
    setCellValue(ws.getCell(row, curCol), cur ?? 0, { bold: isTotal, fill: isTotal ? REPORT_COLORS.total : undefined, align: 'right', numFmt: numFmtOf(spec.fmt) });
    setCellValue(ws.getCell(row, curCol + 1), prev ?? 0, { fill: isTotal ? REPORT_COLORS.total : REPORT_COLORS.card, align: 'right', numFmt: numFmtOf(spec.fmt) });
    setCellValue(ws.getCell(row, curCol + 2), reportPctText(delta), { bold: isTotal, fill: isTotal ? REPORT_COLORS.total : undefined, align: 'center' });
    styleReportDelta(ws.getCell(row, curCol + 2), delta, spec.invert);
  });
  const tailStart = 2 + specs.length * 3;
  trailing.forEach((value, index) => {
    setCellValue(ws.getCell(row, tailStart + index), value, { bold: isTotal, fill: isTotal ? REPORT_COLORS.total : undefined, align: 'left' });
  });
}

function comparativeHeaders(specs: MetricSpec[], curLabel: string, prevLabel: string): string[] {
  return specs.flatMap((spec) => [`${spec.label} ${curLabel}`, `${spec.label} ${prevLabel}`, 'Δ']);
}

const FRENTE_SPECS: MetricSpec[] = [
  { label: 'Investimento', get: (m) => m.spend, fmt: 'currency', invert: false },
  { label: 'Impressões', get: (m) => m.impressions, fmt: 'int', invert: false },
  { label: 'Alcance', get: (m) => m.reach || null, fmt: 'int', invert: false },
  { label: 'Cliques', get: (m) => m.clicks, fmt: 'int', invert: false },
  { label: 'CTR', get: (m) => mediaCtr(m), fmt: 'pct', invert: false },
  { label: 'CPC (R$)', get: (m) => mediaCpc(m), fmt: 'currency', invert: true },
  { label: 'CPM (R$)', get: (m) => mediaCpm(m), fmt: 'currency', invert: true },
];

const PLATFORM_SPECS: MetricSpec[] = [
  { label: 'Investimento', get: (m) => m.spend, fmt: 'currency', invert: false },
  { label: 'Cliques', get: (m) => m.clicks, fmt: 'int', invert: false },
  { label: 'CPC (R$)', get: (m) => mediaCpc(m), fmt: 'currency', invert: true },
  { label: 'Impressões', get: (m) => m.impressions, fmt: 'int', invert: false },
  { label: 'CTR', get: (m) => mediaCtr(m), fmt: 'pct', invert: false },
];

function writeMediaCards(ws: Worksheet, analysis: MidiaAnalysis): void {
  const cur = analysis.currentTotal;
  const prev = analysis.previousTotal;
  const labels = ['INVESTIMENTO', 'IMPRESSÕES', 'CLIQUES', 'CPC MÉDIO', 'ALCANCE', 'CTR MÉDIO'];
  const values = [cur.spend, cur.impressions, cur.clicks, mediaCpc(cur) ?? 0, cur.reach, mediaCtr(cur) ?? 0];
  const deltas = [
    reportDelta(cur.spend, prev.spend),
    reportDelta(cur.impressions, prev.impressions),
    reportDelta(cur.clicks, prev.clicks),
    reportDelta(mediaCpc(cur), mediaCpc(prev)),
    reportDelta(cur.reach || null, prev.reach || null),
    reportDelta(mediaCtr(cur), mediaCtr(prev)),
  ];
  const inverts = [false, false, false, true, false, false];
  labels.forEach((label, colIndex) => {
    const labelCell = ws.getCell(4, colIndex + 1);
    setCellValue(labelCell, label, { bold: true, fill: REPORT_COLORS.card, align: 'center' });
    const valueCell = ws.getCell(5, colIndex + 1);
    setCellValue(valueCell, values[colIndex], { bold: true, fill: REPORT_COLORS.card, align: 'center' });
    valueCell.font = { name: 'Arial', bold: true, color: { argb: colIndex === 3 ? REPORT_COLORS.blue : REPORT_COLORS.navy }, size: 14 };
    if ([0, 3].includes(colIndex)) valueCell.numFmt = CURRENCY_FMT;
    if ([1, 2, 4].includes(colIndex)) valueCell.numFmt = INT_FMT;
    if (colIndex === 5) valueCell.numFmt = PCT_FMT;
    const deltaCell = ws.getCell(6, colIndex + 1);
    setCellValue(deltaCell, `MoM ${reportPctText(deltas[colIndex])}`, { bold: true, fill: REPORT_COLORS.card, align: 'center' });
    styleReportDelta(deltaCell, deltas[colIndex], inverts[colIndex]);
  });
}

function writeFrenteTable(ws: Worksheet, startRow: number, analysis: MidiaAnalysis): number {
  const curLabel = MONTHS_PT[analysis.currentStart.getMonth()];
  const prevLabel = MONTHS_PT[analysis.previousStart.getMonth()];
  const headers = ['Frente', ...comparativeHeaders(FRENTE_SPECS, curLabel, prevLabel), 'KPI-herói'];
  writeColoredTitle(ws, startRow, 'Resultados por Objetivo', headers.length, HEADER_FILL.resultados);
  writeColoredHeader(ws, startRow + 1, headers, HEADER_FILL.resultados);
  const keys: (MidiaFrente | 'TOTAL')[] = [...FRENTE_ORDER, 'TOTAL'];
  keys.forEach((key, index) => {
    const excelRow = startRow + 2 + index;
    const current = key === 'TOTAL' ? analysis.currentTotal : mediaOrEmpty(analysis.byFrenteCurrent, key);
    const previous = key === 'TOTAL' ? analysis.previousTotal : mediaOrEmpty(analysis.byFrentePrevious, key);
    const hero = key === 'TOTAL' ? '—' : `${HERO_KPI[key]} · ${fmtBRLText(heroKpiValue(key, current))}`;
    writeComparativeRow(ws, excelRow, key, current, previous, FRENTE_SPECS, key === 'TOTAL', [hero]);
  });
  return startRow + keys.length + 3;
}

function writeWeeklyPacingTable(
  ws: Worksheet,
  startRow: number,
  analysis: MidiaAnalysis,
  metric: 'spend' | 'clicks',
  title: string,
): number {
  const prevWindows = previousWeekWindows(analysis.previousStart, analysis.currentWindows);
  const numFmt = metric === 'spend' ? CURRENCY_FMT : INT_FMT;
  const headers = ['Frente', ...analysis.currentWindows.flatMap((window, i) => [window.label, prevWindows[i]?.label ?? '—', 'Δ']), 'Total', 'Total ant.', 'Δ'];
  writeColoredTitle(ws, startRow, title, headers.length, HEADER_FILL.semanal);
  writeColoredHeader(ws, startRow + 1, headers, HEADER_FILL.semanal);
  const keys: (MidiaFrente | 'TOTAL')[] = [...FRENTE_ORDER, 'TOTAL'];
  keys.forEach((key, index) => {
    const excelRow = startRow + 2 + index;
    const isTotal = key === 'TOTAL';
    const weekValue = (source: Map<MidiaFrente, MediaMetrics[]>, weekIndex: number): number => (
      isTotal
        ? FRENTE_ORDER.reduce((sum, frente) => sum + source.get(frente)![weekIndex][metric], 0)
        : source.get(key)![weekIndex][metric]
    );
    setCellValue(ws.getCell(excelRow, 1), key, { bold: isTotal, fill: isTotal ? REPORT_COLORS.total : undefined, align: 'left' });
    analysis.currentWindows.forEach((_, weekIndex) => {
      const cur = weekValue(analysis.weeklyCurrent, weekIndex);
      const prev = weekValue(analysis.weeklyPrevious, weekIndex);
      const delta = reportDelta(cur, prev);
      const base = 2 + weekIndex * 3;
      setCellValue(ws.getCell(excelRow, base), cur, { bold: isTotal, fill: isTotal ? REPORT_COLORS.total : undefined, align: 'right', numFmt });
      setCellValue(ws.getCell(excelRow, base + 1), prev, { fill: isTotal ? REPORT_COLORS.total : REPORT_COLORS.card, align: 'right', numFmt });
      setCellValue(ws.getCell(excelRow, base + 2), reportPctText(delta), { bold: isTotal, fill: isTotal ? REPORT_COLORS.total : undefined, align: 'center' });
      styleReportDelta(ws.getCell(excelRow, base + 2), delta);
    });
    const curTotal = isTotal ? analysis.currentTotal[metric] : mediaOrEmpty(analysis.byFrenteCurrent, key)[metric];
    const prevTotal = isTotal ? analysis.previousTotal[metric] : mediaOrEmpty(analysis.byFrentePrevious, key)[metric];
    const totalCol = 2 + analysis.currentWindows.length * 3;
    setCellValue(ws.getCell(excelRow, totalCol), curTotal, { bold: isTotal, fill: isTotal ? REPORT_COLORS.total : undefined, align: 'right', numFmt });
    setCellValue(ws.getCell(excelRow, totalCol + 1), prevTotal, { fill: isTotal ? REPORT_COLORS.total : REPORT_COLORS.card, align: 'right', numFmt });
    setCellValue(ws.getCell(excelRow, totalCol + 2), reportPctText(reportDelta(curTotal, prevTotal)), { bold: isTotal, fill: isTotal ? REPORT_COLORS.total : undefined, align: 'center' });
    styleReportDelta(ws.getCell(excelRow, totalCol + 2), reportDelta(curTotal, prevTotal));
  });
  return startRow + keys.length + 3;
}

const PLATFORM_LABELS: Record<string, string> = { meta: 'Meta', google: 'Google' };

function writePlatformTable(ws: Worksheet, startRow: number, analysis: MidiaAnalysis): number {
  const curLabel = MONTHS_PT[analysis.currentStart.getMonth()];
  const prevLabel = MONTHS_PT[analysis.previousStart.getMonth()];
  const headers = ['Plataforma', ...comparativeHeaders(PLATFORM_SPECS, curLabel, prevLabel), 'Share invest.'];
  writeColoredTitle(ws, startRow, 'INVESTIMENTO / PLATAFORMA', headers.length, HEADER_FILL.plataforma);
  writeColoredHeader(ws, startRow + 1, headers, HEADER_FILL.plataforma);
  const shareCol = 2 + PLATFORM_SPECS.length * 3;
  const keys = [...analysis.platformKeys, 'TOTAL'];
  keys.forEach((key, index) => {
    const excelRow = startRow + 2 + index;
    const current = key === 'TOTAL' ? analysis.currentTotal : mediaOrEmpty(analysis.byPlatformCurrent, key);
    const previous = key === 'TOTAL' ? analysis.previousTotal : mediaOrEmpty(analysis.byPlatformPrevious, key);
    const share = analysis.currentTotal.spend ? current.spend / analysis.currentTotal.spend : 0;
    const name = key === 'TOTAL' ? 'TOTAL' : (PLATFORM_LABELS[key] ?? key);
    writeComparativeRow(ws, excelRow, name, current, previous, PLATFORM_SPECS, key === 'TOTAL');
    setCellValue(ws.getCell(excelRow, shareCol), share, {
      bold: key === 'TOTAL', fill: key === 'TOTAL' ? REPORT_COLORS.total : undefined, align: 'right', numFmt: PCT_FMT,
    });
  });
  return startRow + keys.length + 3;
}

type CreativeGroup = {
  adset: string;
  frente: MidiaFrente;
  objective: string;
  total: MediaMetrics;
  ads: { ad: string; metrics: MediaMetrics }[];
};

const buildCreativeGroups = (analysis: MidiaAnalysis): CreativeGroup[] => {
  const map = new Map<string, CreativeGroup>();
  analysis.currentRows
    .filter((row) => row.channel === 'meta' && row.adName)
    .forEach((row) => {
      const adset = row.adsetName ?? '—';
      if (!map.has(adset)) {
        map.set(adset, { adset, frente: row.frente, objective: row.objective, total: emptyMediaMetrics(), ads: [] });
      }
      const group = map.get(adset)!;
      addMediaMetrics(group.total, row.metrics);
      let ad = group.ads.find((item) => item.ad === row.adName);
      if (!ad) { ad = { ad: row.adName!, metrics: emptyMediaMetrics() }; group.ads.push(ad); }
      addMediaMetrics(ad.metrics, row.metrics);
    });
  const groups = Array.from(map.values());
  groups.forEach((group) => group.ads.sort((a, b) => b.metrics.spend - a.metrics.spend));
  return groups.sort((a, b) =>
    FRENTE_ORDER.indexOf(a.frente) - FRENTE_ORDER.indexOf(b.frente) || b.total.spend - a.total.spend);
};

function writeCreativeTable(ws: Worksheet, startRow: number, analysis: MidiaAnalysis): number {
  const headers = ['Grupo de Anúncio / Criativo', 'Investimento', 'Impressões', 'Alcance', 'Frequência', 'Cliques', 'CTR', 'CPC (R$)', 'CPM (R$)', 'Resultado', 'Tipo', 'Custo/resultado'];
  writeColoredTitle(ws, startRow, 'PERFORMANCE POR CRIATIVO - GRUPO DE ANÚNCIO', headers.length, HEADER_FILL.criativo);
  writeColoredHeader(ws, startRow + 1, headers, HEADER_FILL.criativo);
  const groups = buildCreativeGroups(analysis);
  let excelRow = startRow + 2;
  if (!groups.length) {
    ws.mergeCells(excelRow, 1, excelRow, headers.length);
    setCellValue(ws.getCell(excelRow, 1), 'Sem dados em nível de anúncio para o mês — verificar ingestão de ads do Meta no Supabase.', { fill: REPORT_COLORS.note, fontColor: REPORT_COLORS.noteText, align: 'left' });
    return excelRow + 3;
  }

  const writeMetricRow = (row: number, label: string, m: MediaMetrics, objective: string, isGroup: boolean): void => {
    const custoResult = m.conversions ? m.spend / m.conversions : null;
    const values = [
      label, m.spend, m.impressions, m.reach, mediaFrequency(m) ?? '—', m.clicks,
      mediaCtr(m) ?? 0, mediaCpc(m), mediaCpm(m),
      m.conversions || (isGroup ? m.conversions : 0), resultLabel(objective), custoResult,
    ];
    values.forEach((value, colIndex) => {
      const cell = ws.getCell(row, colIndex + 1);
      setCellValue(cell, value, {
        bold: isGroup,
        fill: isGroup ? REPORT_COLORS.card : undefined,
        align: colIndex === 0 ? 'left' : colIndex === 10 ? 'center' : 'right',
      });
      if ([1, 7, 8, 11].includes(colIndex)) cell.numFmt = CURRENCY_FMT;
      if ([2, 3, 5, 9].includes(colIndex)) cell.numFmt = INT_FMT;
      if (colIndex === 4 && typeof value === 'number') cell.numFmt = '0.00';
      if (colIndex === 6) cell.numFmt = PCT_FMT;
    });
  };

  groups.forEach((group) => {
    writeMetricRow(excelRow, `▸ ${group.adset}  ·  ${group.frente}`, group.total, group.objective, true);
    excelRow += 1;
    group.ads.forEach((ad) => {
      writeMetricRow(excelRow, `    ${ad.ad}`, ad.metrics, group.objective, false);
      excelRow += 1;
    });
  });

  const coverage = analysis.adCoverage;
  if (coverage !== null && coverage < 0.95) {
    ws.mergeCells(excelRow, 1, excelRow, headers.length);
    setCellValue(ws.getCell(excelRow, 1), `⚠ Cobertura nível anúncio ${(coverage * 100).toFixed(1)}% — checar ingestão de ads no Supabase.`, {
      fill: REPORT_COLORS.note, fontColor: REPORT_COLORS.noteText, align: 'left',
    });
    return excelRow + 3;
  }
  return excelRow + 2;
}

function writeBudgetPacing(ws: Worksheet, startRow: number, analysis: MidiaAnalysis): number {
  const headers = ['Frente', 'Realizado', 'Meta', '% meta', 'Projeção fim mês', 'Status'];
  writeColoredTitle(ws, startRow, 'Realizado vs Meta', headers.length, HEADER_FILL.realizado);
  writeColoredHeader(ws, startRow + 1, headers, HEADER_FILL.realizado);
  const daysInMonth = monthEnd(analysis.currentStart).getDate();
  const closedDays = Math.max(1, Math.min(analysis.maxDataDay, daysInMonth));
  const keys: (MidiaFrente | 'TOTAL')[] = [...FRENTE_ORDER, 'TOTAL'];
  const totalBudget = FRENTE_ORDER.reduce((sum, frente) => sum + FRENTE_BUDGET[frente], 0);
  keys.forEach((key, index) => {
    const excelRow = startRow + 2 + index;
    const realized = key === 'TOTAL' ? analysis.currentTotal.spend : mediaOrEmpty(analysis.byFrenteCurrent, key).spend;
    const budget = key === 'TOTAL' ? totalBudget : FRENTE_BUDGET[key];
    const pct = budget ? realized / budget : 0;
    const projection = (realized / closedDays) * daysInMonth;
    const projPct = budget ? projection / budget : 0;
    const status = projPct > 1.1 ? '🔴 acima' : projPct < 0.85 ? '🟡 abaixo' : '🟢 no ritmo';
    const values = [key === 'TOTAL' ? 'TOTAL' : key, realized, budget, pct, projection, status];
    values.forEach((value, colIndex) => {
      const cell = ws.getCell(excelRow, colIndex + 1);
      setCellValue(cell, value, {
        bold: key === 'TOTAL',
        fill: key === 'TOTAL' ? REPORT_COLORS.total : undefined,
        align: colIndex === 0 ? 'left' : colIndex === 5 ? 'center' : 'right',
      });
      if ([1, 2, 4].includes(colIndex)) cell.numFmt = CURRENCY_FMT;
      if (colIndex === 3) cell.numFmt = PCT_FMT;
    });
  });
  return startRow + keys.length + 3;
}

function writeGoogleTable(ws: Worksheet, startRow: number, analysis: MidiaAnalysis): number {
  const googleRows = analysis.currentRows.filter((row) => row.channel === 'google');
  if (!googleRows.length) return startRow;
  const headers = ['Campanha (Google)', 'Frente', 'Investimento', 'Impressões', 'Cliques', 'CPC (R$)', 'CPM (R$)', 'CTR'];
  writeColoredTitle(ws, startRow, 'GOOGLE ADS', headers.length, HEADER_FILL.google);
  writeColoredHeader(ws, startRow + 1, headers, HEADER_FILL.google);
  const byCampaign = new Map<string, { frente: MidiaFrente; metrics: MediaMetrics }>();
  googleRows.forEach((row) => {
    if (!byCampaign.has(row.campaign)) byCampaign.set(row.campaign, { frente: row.frente, metrics: emptyMediaMetrics() });
    addMediaMetrics(byCampaign.get(row.campaign)!.metrics, row.metrics);
  });
  const ordered = Array.from(byCampaign.entries()).sort((a, b) => b[1].metrics.spend - a[1].metrics.spend);
  ordered.forEach(([campaign, item], index) => {
    const m = item.metrics;
    const values = [campaign, item.frente, m.spend, m.impressions, m.clicks, mediaCpc(m), mediaCpm(m), mediaCtr(m) ?? 0];
    values.forEach((value, colIndex) => {
      const cell = ws.getCell(startRow + 2 + index, colIndex + 1);
      setCellValue(cell, value, { align: colIndex <= 1 ? 'left' : 'right' });
      if ([2, 5, 6].includes(colIndex)) cell.numFmt = CURRENCY_FMT;
      if ([3, 4].includes(colIndex)) cell.numFmt = INT_FMT;
      if (colIndex === 7) cell.numFmt = PCT_FMT;
    });
  });
  return startRow + ordered.length + 3;
}

function writeHeroWeeklyTable(ws: Worksheet, startRow: number, analysis: MidiaAnalysis): number {
  const prevWindows = previousWeekWindows(analysis.previousStart, analysis.currentWindows);
  const headers = ['Frente (KPI-herói)', ...analysis.currentWindows.flatMap((window, i) => [window.label, prevWindows[i]?.label ?? '—', 'Δ']), 'Mês', 'Mês ant.', 'Δ'];
  writeColoredTitle(ws, startRow, 'EFICIÊNCIA SEMANAL', headers.length, HEADER_FILL.eficiencia);
  writeColoredHeader(ws, startRow + 1, headers, HEADER_FILL.eficiencia);
  FRENTE_ORDER.forEach((frente, index) => {
    const excelRow = startRow + 2 + index;
    setCellValue(ws.getCell(excelRow, 1), `${frente} · ${HERO_KPI[frente]}`, { align: 'left' });
    analysis.currentWindows.forEach((_, weekIndex) => {
      const cur = heroKpiValue(frente, analysis.weeklyCurrent.get(frente)![weekIndex]);
      const prev = heroKpiValue(frente, analysis.weeklyPrevious.get(frente)![weekIndex]);
      const delta = reportDelta(cur, prev);
      const base = 2 + weekIndex * 3;
      setCellValue(ws.getCell(excelRow, base), cur ?? '—', { align: 'right', numFmt: typeof cur === 'number' ? CURRENCY_FMT : undefined });
      setCellValue(ws.getCell(excelRow, base + 1), prev ?? '—', { fill: REPORT_COLORS.card, align: 'right', numFmt: typeof prev === 'number' ? CURRENCY_FMT : undefined });
      setCellValue(ws.getCell(excelRow, base + 2), reportPctText(delta), { align: 'center' });
      styleReportDelta(ws.getCell(excelRow, base + 2), delta, true);
    });
    const monthCur = heroKpiValue(frente, mediaOrEmpty(analysis.byFrenteCurrent, frente));
    const monthPrev = heroKpiValue(frente, mediaOrEmpty(analysis.byFrentePrevious, frente));
    const base = 2 + analysis.currentWindows.length * 3;
    setCellValue(ws.getCell(excelRow, base), monthCur ?? '—', { align: 'right', numFmt: typeof monthCur === 'number' ? CURRENCY_FMT : undefined });
    setCellValue(ws.getCell(excelRow, base + 1), monthPrev ?? '—', { fill: REPORT_COLORS.card, align: 'right', numFmt: typeof monthPrev === 'number' ? CURRENCY_FMT : undefined });
    setCellValue(ws.getCell(excelRow, base + 2), reportPctText(reportDelta(monthCur, monthPrev)), { align: 'center' });
    styleReportDelta(ws.getCell(excelRow, base + 2), reportDelta(monthCur, monthPrev), true);
  });
  return startRow + FRENTE_ORDER.length + 3;
}

function buildHighlights(analysis: MidiaAnalysis): string[] {
  const bullets: string[] = [];
  const prevLabel = MONTHS_PT[analysis.previousStart.getMonth()];

  const heroDeltas = FRENTE_ORDER
    .map((frente) => {
      const current = heroKpiValue(frente, mediaOrEmpty(analysis.byFrenteCurrent, frente));
      const previous = heroKpiValue(frente, mediaOrEmpty(analysis.byFrentePrevious, frente));
      return { frente, current, previous, delta: reportDelta(current, previous) };
    })
    .filter((item): item is typeof item & { delta: number; current: number } => item.delta !== null && item.current !== null);
  if (heroDeltas.length) {
    const best = heroDeltas.reduce((a, b) => (b.delta < a.delta ? b : a));
    if (best.delta < 0) {
      bullets.push(`Melhor eficiência: ${best.frente} — ${HERO_KPI[best.frente]} caiu ${reportPctText(best.delta).replace('-', '')} vs ${prevLabel} (${fmtBRLText(best.previous)} → ${fmtBRLText(best.current)}).`);
    }
    const worst = heroDeltas.reduce((a, b) => (b.delta > a.delta ? b : a));
    if (worst.delta > 0 && worst.frente !== best.frente) {
      bullets.push(`⚠ Atenção: ${worst.frente} — ${HERO_KPI[worst.frente]} subiu ${reportPctText(worst.delta)} vs ${prevLabel} (${fmtBRLText(worst.previous)} → ${fmtBRLText(worst.current)}).`);
    }
  }

  const spendMovers = FRENTE_ORDER
    .map((frente) => ({
      frente,
      current: mediaOrEmpty(analysis.byFrenteCurrent, frente).spend,
      previous: mediaOrEmpty(analysis.byFrentePrevious, frente).spend,
      delta: reportDelta(mediaOrEmpty(analysis.byFrenteCurrent, frente).spend, mediaOrEmpty(analysis.byFrentePrevious, frente).spend),
    }))
    .filter((item): item is typeof item & { delta: number } => item.delta !== null);
  if (spendMovers.length) {
    const mover = spendMovers.reduce((a, b) => (Math.abs(b.delta) > Math.abs(a.delta) ? b : a));
    bullets.push(`Maior movimento de verba: ${mover.frente} ${reportPctText(mover.delta)} vs ${prevLabel} (${fmtBRLText(mover.previous)} → ${fmtBRLText(mover.current)}).`);
  }

  const marcaFreq = mediaFrequency(mediaOrEmpty(analysis.byFrenteCurrent, 'Marca B2C (Copa)'));
  if (marcaFreq !== null) {
    bullets.push(marcaFreq > 3
      ? `⚠ Frequência da Marca em ${marcaFreq.toFixed(1)} — acima de 3, risco de saturação de audiência.`
      : `Frequência da Marca em ${marcaFreq.toFixed(1)} — abaixo do limite de saturação (3,0).`);
  }

  const cplSeguros = mediaCpl(mediaOrEmpty(analysis.byFrenteCurrent, 'Seguros'));
  const cplSegurosPrev = mediaCpl(mediaOrEmpty(analysis.byFrentePrevious, 'Seguros'));
  if (cplSeguros !== null) {
    bullets.push(`CPL Seguros: ${fmtBRLText(cplSeguros)} (MoM ${reportPctText(reportDelta(cplSeguros, cplSegurosPrev))}).`);
  }

  if (analysis.adCoverage !== null && analysis.adCoverage < 0.95) {
    bullets.push(`⚠ Cobertura nível anúncio de apenas ${(analysis.adCoverage * 100).toFixed(1)}% do investimento Meta — checar ingestão de ads no Supabase.`);
  }

  return bullets;
}

function writeHighlightsSection(ws: Worksheet, startRow: number, analysis: MidiaAnalysis): number {
  const bullets = buildHighlights(analysis);
  if (!bullets.length) return startRow;
  writeSectionTitle(ws, startRow, 'LEITURA DO MÊS', REPORT_WIDTH);
  bullets.forEach((bullet, index) => {
    const excelRow = startRow + 1 + index;
    ws.mergeCells(excelRow, 1, excelRow, REPORT_WIDTH);
    const isWarning = bullet.startsWith('⚠');
    setCellValue(ws.getCell(excelRow, 1), `• ${bullet}`, {
      fill: REPORT_COLORS.card,
      fontColor: isWarning ? REPORT_COLORS.red : REPORT_COLORS.navy,
      align: 'left',
    });
  });
  return startRow + bullets.length + 3;
}

type B2CWeek = { metrics: MediaMetrics; installs: number; trials: number };

const emptyB2CWeek = (): B2CWeek => ({ metrics: emptyMediaMetrics(), installs: 0, trials: 0 });

const bucketB2C = (rows: PaidRow[], windows: WeekWindow[]): B2CWeek[] => {
  const weeks = windows.map(() => emptyB2CWeek());
  rows.filter((row) => row.frente === 'Aquisição B2C').forEach((row) => {
    const index = windows.findIndex((window) => row.day >= window.startDay && row.day <= window.endDay);
    if (index < 0) return;
    addMediaMetrics(weeks[index].metrics, row.metrics);
    if (isTrialCampaign(row.campaign)) weeks[index].trials += row.metrics.conversions;
    else weeks[index].installs += row.metrics.conversions;
  });
  return weeks;
};

const sumB2C = (weeks: B2CWeek[]): B2CWeek => weeks.reduce((total, week) => {
  addMediaMetrics(total.metrics, week.metrics);
  total.installs += week.installs;
  total.trials += week.trials;
  return total;
}, emptyB2CWeek());

// Métricas do funil B2C (app): investimento, mídia, Instalações + CPI e Start Trial + Custo/Trial.
const b2cCells = (week: B2CWeek): (number | null)[] => {
  const m = week.metrics;
  return [
    m.spend, m.impressions, mediaCpm(m), m.clicks, mediaCpc(m), mediaCtr(m) ?? 0,
    week.installs, week.installs ? m.spend / week.installs : null,
    week.trials, week.trials ? m.spend / week.trials : null,
  ];
};
const B2C_NUMFMT: (string | undefined)[] = [CURRENCY_FMT, INT_FMT, CURRENCY_FMT, INT_FMT, CURRENCY_FMT, PCT_FMT, INT_FMT, CURRENCY_FMT, INT_FMT, CURRENCY_FMT];
// Colunas de resultado (custo cai = melhora): CPM, CPC, CPI, Custo/Trial.
const B2C_INVERT = [false, false, true, false, true, false, false, true, false, true];

function writeB2CFunnelTable(ws: Worksheet, startRow: number, analysis: MidiaAnalysis): number {
  const headers = ['Semana', 'Investimento', 'Impressões', 'CPM (R$)', 'Cliques', 'CPC (R$)', 'CTR', 'Instalações', 'CPI (R$)', 'Start Trial', 'Custo/Trial'];
  writeColoredTitle(ws, startRow, 'AQUISIÇÃO B2C — INSTALAÇÕES & START TRIAL (semanal)', headers.length, HEADER_FILL.resultados);
  writeColoredHeader(ws, startRow + 1, headers, HEADER_FILL.resultados);
  const prevWindows = previousWeekWindows(analysis.previousStart, analysis.currentWindows);
  const weeksCur = bucketB2C(analysis.currentRows, analysis.currentWindows);
  const weeksPrev = bucketB2C(analysis.previousRows, prevWindows);
  const curLabel = MONTHS_PT[analysis.currentStart.getMonth()];
  const prevLabel = MONTHS_PT[analysis.previousStart.getMonth()];

  const writeRow = (row: number, label: string, cells: (number | null)[], opts: { bold?: boolean; fill?: string } = {}): void => {
    setCellValue(ws.getCell(row, 1), label, { bold: opts.bold, fill: opts.fill, align: 'left' });
    cells.forEach((value, i) => {
      const cell = ws.getCell(row, i + 2);
      setCellValue(cell, value ?? '—', { bold: opts.bold, fill: opts.fill, align: 'right' });
      if (typeof value === 'number' && B2C_NUMFMT[i]) cell.numFmt = B2C_NUMFMT[i]!;
    });
  };

  let r = startRow + 2;
  analysis.currentWindows.forEach((window, i) => {
    writeRow(r, `Sem ${i + 1} (${window.label})`, b2cCells(weeksCur[i]));
    r += 1;
  });
  const totalCur = sumB2C(weeksCur);
  const totalPrev = sumB2C(weeksPrev);
  const cellsCur = b2cCells(totalCur);
  const cellsPrev = b2cCells(totalPrev);
  writeRow(r, `TOTAL ${curLabel}`, cellsCur, { bold: true, fill: REPORT_COLORS.total });
  r += 1;
  writeRow(r, `TOTAL ${prevLabel}`, cellsPrev, { fill: REPORT_COLORS.card });
  r += 1;
  setCellValue(ws.getCell(r, 1), 'Δ MoM', { bold: true, align: 'left' });
  cellsCur.forEach((cur, i) => {
    const delta = reportDelta(cur, cellsPrev[i]);
    setCellValue(ws.getCell(r, i + 2), reportPctText(delta), { bold: true, align: 'center' });
    styleReportDelta(ws.getCell(r, i + 2), delta, B2C_INVERT[i]);
  });
  return r + 3;
}

export function writeMidiaPagaSheet(workbook: Workbook, analysis: MidiaAnalysis): void {
  const ws = workbook.addWorksheet('Mídia Paga', {
    views: [{ state: 'frozen', xSplit: 2, ySplit: 2, topLeftCell: 'C3', activeCell: 'C3', showGridLines: false }],
  });
  const currentLabel = MONTHS_PT[analysis.currentStart.getMonth()];
  const previousLabel = MONTHS_PT[analysis.previousStart.getMonth()];
  ws.mergeCells(1, 1, 1, 12);
  setCellValue(ws.getCell(1, 1), `MÍDIA PAGA — ${currentLabel}/${analysis.currentStart.getFullYear()}  ·  ${currentLabel} vs ${previousLabel}`, { bold: true, align: 'left' });
  ws.getCell(1, 1).font = { name: 'Arial', bold: true, color: { argb: REPORT_COLORS.navy }, size: 18 };

  writeMediaCards(ws, analysis);

  let row = 8;
  row = writeBudgetPacing(ws, row, analysis);
  row = writeFrenteTable(ws, row, analysis);
  row = writeB2CFunnelTable(ws, row, analysis);
  row = writeWeeklyPacingTable(ws, row, analysis, 'spend', 'SEMANAL — INVESTIMENTO');
  row = writeWeeklyPacingTable(ws, row, analysis, 'clicks', 'SEMANAL — CLIQUES');
  row = writePlatformTable(ws, row, analysis);
  row = writeGoogleTable(ws, row, analysis);
  row = writeCreativeTable(ws, row, analysis);
  row = writeHeroWeeklyTable(ws, row, analysis);
  writeHighlightsSection(ws, row, analysis);

  ws.getColumn(1).width = 32;
  const maxColumn = Math.max(REPORT_WIDTH, ws.columnCount);
  for (let column = 2; column <= maxColumn; column += 1) {
    ws.getColumn(column).width = 13;
  }
  ws.eachRow((excelRow) => { excelRow.height = Math.max(excelRow.height ?? 20, 20); });
}

async function fetchPaidMediaRows(start: Date, end: Date): Promise<PaidMediaRawRow[]> {
  const rows: PaidMediaRawRow[] = [];
  const pageSize = 1000;
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabase
      .from('paid_media_metrics')
      .select('date, channel, campaign, objective, spend, impressions, clicks, conversions, reach, frequency, ad_name, adset_name')
      .gte('date', mediaIsoDate(start))
      .lte('date', mediaIsoDate(end))
      .order('date', { ascending: true })
      .range(offset, offset + pageSize - 1);
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < pageSize) break;
  }
  return rows;
}

function downloadBuffer(buffer: BlobPart, filename: string): void {
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export async function exportMidiaPagaMonthlyXlsx(start: Date, end: Date): Promise<{ rows: number; filename: string }> {
  const currentStart = monthStart(start);
  const prevStart = previousMonthStart(currentStart);
  const currentEnd = end >= currentStart ? end : monthEnd(currentStart);
  const [paidRaw, activityRows] = await Promise.all([
    fetchPaidMediaRows(prevStart, currentEnd),
    fetchSupabaseRows(prevStart, currentEnd),
  ]);
  const currentKey = mediaMonthKey(currentStart);
  const previousKey = mediaMonthKey(prevStart);
  const currentRaw = paidRaw.filter((row) => String(row.date ?? '').startsWith(currentKey));
  const previousRaw = paidRaw.filter((row) => String(row.date ?? '').startsWith(previousKey));

  const analysis = buildMidiaPagaAnalysis(currentRaw, previousRaw, currentStart, currentEnd);

  const ExcelJSModule = await import('exceljs');
  const workbook = new ExcelJSModule.default.Workbook();
  workbook.creator = 'GaaS AFINZ';
  workbook.created = new Date();
  writeMidiaPagaSheet(workbook, analysis);
  writeAquisicaoCrmMonthlySheet(workbook, activityRows, currentStart, currentEnd);
  writeMidiaPagaDiarizadoSheet(workbook, analysis.currentRows, currentStart, analysis.maxDataDay);

  const buffer = await workbook.xlsx.writeBuffer();
  const filename = `Report_${MONTHS_PT[currentStart.getMonth()]}_MidiaPaga.xlsx`;
  downloadBuffer(buffer, filename);
  return { rows: currentRaw.length, filename };
}
