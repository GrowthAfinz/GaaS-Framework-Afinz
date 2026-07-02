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
  writeReportHeader,
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
  const headers = ['Frente', 'Investimento', 'Δ', 'Impressões', 'Δ', 'Alcance', 'Δ', 'Cliques', 'Δ', 'CTR', 'Δ', 'CPC (R$)', 'Δ', 'CPM (R$)', 'Δ', 'KPI-herói'];
  writeSectionTitle(ws, startRow, 'POR FRENTE — todas as métricas com Δ MoM', headers.length);
  writeReportHeader(ws, startRow + 1, headers);
  const keys: (MidiaFrente | 'TOTAL')[] = [...FRENTE_ORDER, 'TOTAL'];
  keys.forEach((key, index) => {
    const excelRow = startRow + 2 + index;
    const current = key === 'TOTAL' ? analysis.currentTotal : mediaOrEmpty(analysis.byFrenteCurrent, key);
    const previous = key === 'TOTAL' ? analysis.previousTotal : mediaOrEmpty(analysis.byFrentePrevious, key);
    const deltas: [number, number | null, boolean][] = [
      [3, reportDelta(current.spend, previous.spend), false],
      [5, reportDelta(current.impressions, previous.impressions), false],
      [7, reportDelta(current.reach || null, previous.reach || null), false],
      [9, reportDelta(current.clicks, previous.clicks), false],
      [11, reportDelta(mediaCtr(current), mediaCtr(previous)), false],
      [13, reportDelta(mediaCpc(current), mediaCpc(previous)), true],
      [15, reportDelta(mediaCpm(current), mediaCpm(previous)), true],
    ];
    const hero = key === 'TOTAL'
      ? '—'
      : `${HERO_KPI[key]} · ${fmtBRLText(heroKpiValue(key, current))}`;
    const values = [
      key, current.spend, reportPctText(deltas[0][1]),
      current.impressions, reportPctText(deltas[1][1]),
      current.reach, reportPctText(deltas[2][1]),
      current.clicks, reportPctText(deltas[3][1]),
      mediaCtr(current) ?? 0, reportPctText(deltas[4][1]),
      mediaCpc(current), reportPctText(deltas[5][1]),
      mediaCpm(current), reportPctText(deltas[6][1]),
      hero,
    ];
    values.forEach((value, colIndex) => {
      const cell = ws.getCell(excelRow, colIndex + 1);
      setCellValue(cell, value, {
        bold: key === 'TOTAL',
        fill: key === 'TOTAL' ? REPORT_COLORS.total : undefined,
        align: colIndex === 0 ? 'left' : colIndex === 15 ? 'center' : 'right',
      });
      if ([3, 5, 7].includes(colIndex)) cell.numFmt = INT_FMT;
      if ([1, 11, 13].includes(colIndex)) cell.numFmt = CURRENCY_FMT;
      if (colIndex === 9) cell.numFmt = PCT_FMT;
    });
    deltas.forEach(([column, delta, invert]) => styleReportDelta(ws.getCell(excelRow, column), delta, invert));
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
  const headers = ['Frente', ...analysis.currentWindows.flatMap((window) => [window.label, `MoM ${window.label}`]), 'Total', 'Variação total MoM'];
  writeSectionTitle(ws, startRow, title, headers.length);
  writeReportHeader(ws, startRow + 1, headers);
  const keys: (MidiaFrente | 'TOTAL')[] = [...FRENTE_ORDER, 'TOTAL'];
  keys.forEach((key, index) => {
    const excelRow = startRow + 2 + index;
    const weekValue = (source: Map<MidiaFrente, MediaMetrics[]>, weekIndex: number): number => (
      key === 'TOTAL'
        ? FRENTE_ORDER.reduce((sum, frente) => sum + source.get(frente)![weekIndex][metric], 0)
        : source.get(key)![weekIndex][metric]
    );
    const weekly = analysis.currentWindows.flatMap((_, weekIndex) => {
      const current = weekValue(analysis.weeklyCurrent, weekIndex);
      const previous = weekValue(analysis.weeklyPrevious, weekIndex);
      return [current, reportPctText(reportDelta(current, previous))];
    });
    const currentTotal = key === 'TOTAL' ? analysis.currentTotal[metric] : mediaOrEmpty(analysis.byFrenteCurrent, key)[metric];
    const previousTotal = key === 'TOTAL' ? analysis.previousTotal[metric] : mediaOrEmpty(analysis.byFrentePrevious, key)[metric];
    const values = [key, ...weekly, currentTotal, reportPctText(reportDelta(currentTotal, previousTotal))];
    values.forEach((value, colIndex) => {
      const cell = ws.getCell(excelRow, colIndex + 1);
      setCellValue(cell, value, {
        bold: key === 'TOTAL',
        fill: key === 'TOTAL' ? REPORT_COLORS.total : undefined,
        align: colIndex === 0 ? 'left' : 'right',
      });
      if (colIndex >= 1 && colIndex % 2 === 1) cell.numFmt = metric === 'spend' ? CURRENCY_FMT : INT_FMT;
    });
    analysis.currentWindows.forEach((_, weekIndex) => {
      const current = weekValue(analysis.weeklyCurrent, weekIndex);
      const previous = weekValue(analysis.weeklyPrevious, weekIndex);
      styleReportDelta(ws.getCell(excelRow, 3 + weekIndex * 2), reportDelta(current, previous));
    });
    styleReportDelta(ws.getCell(excelRow, headers.length), reportDelta(currentTotal, previousTotal));
  });
  return startRow + keys.length + 3;
}

const PLATFORM_LABELS: Record<string, string> = { meta: 'Meta', google: 'Google' };

function writePlatformTable(ws: Worksheet, startRow: number, analysis: MidiaAnalysis): number {
  const headers = ['Plataforma', 'Investimento', 'Δ', 'Cliques', 'Δ', 'CPC (R$)', 'Δ', 'Impressões', 'Δ', 'CTR', 'Share invest.'];
  writeSectionTitle(ws, startRow, 'POR PLATAFORMA — Meta vs Google com MoM', headers.length);
  writeReportHeader(ws, startRow + 1, headers);
  const keys = [...analysis.platformKeys, 'TOTAL'];
  keys.forEach((key, index) => {
    const excelRow = startRow + 2 + index;
    const current = key === 'TOTAL' ? analysis.currentTotal : mediaOrEmpty(analysis.byPlatformCurrent, key);
    const previous = key === 'TOTAL' ? analysis.previousTotal : mediaOrEmpty(analysis.byPlatformPrevious, key);
    const share = analysis.currentTotal.spend ? current.spend / analysis.currentTotal.spend : 0;
    const deltas: [number, number | null, boolean][] = [
      [3, reportDelta(current.spend, previous.spend), false],
      [5, reportDelta(current.clicks, previous.clicks), false],
      [7, reportDelta(mediaCpc(current), mediaCpc(previous)), true],
      [9, reportDelta(current.impressions, previous.impressions), false],
    ];
    const values = [
      key === 'TOTAL' ? 'TOTAL' : (PLATFORM_LABELS[key] ?? key),
      current.spend, reportPctText(deltas[0][1]),
      current.clicks, reportPctText(deltas[1][1]),
      mediaCpc(current), reportPctText(deltas[2][1]),
      current.impressions, reportPctText(deltas[3][1]),
      mediaCtr(current) ?? 0,
      share,
    ];
    values.forEach((value, colIndex) => {
      const cell = ws.getCell(excelRow, colIndex + 1);
      setCellValue(cell, value, {
        bold: key === 'TOTAL',
        fill: key === 'TOTAL' ? REPORT_COLORS.total : undefined,
        align: colIndex === 0 ? 'left' : 'right',
      });
      if ([1, 5].includes(colIndex)) cell.numFmt = CURRENCY_FMT;
      if ([3, 7].includes(colIndex)) cell.numFmt = INT_FMT;
      if ([9, 10].includes(colIndex)) cell.numFmt = PCT_FMT;
    });
    deltas.forEach(([column, delta, invert]) => styleReportDelta(ws.getCell(excelRow, column), delta, invert));
  });
  return startRow + keys.length + 3;
}

function writeCreativeTable(ws: Worksheet, startRow: number, analysis: MidiaAnalysis): number {
  const headers = ['Frente', 'Conjunto (adset)', 'Criativo', 'Investimento', 'Impressões', 'Alcance', 'Freq.', 'Cliques', 'CTR', 'CPC (R$)'];
  writeSectionTitle(ws, startRow, 'PERFORMANCE POR CRIATIVO — Meta, mês corrente (sem MoM)', headers.length);
  writeReportHeader(ws, startRow + 1, headers);
  let excelRow = startRow + 2;
  if (!analysis.creatives.length) {
    ws.mergeCells(excelRow, 1, excelRow, headers.length);
    setCellValue(ws.getCell(excelRow, 1), 'Sem dados em nível de anúncio para o mês — verificar ingestão de ads do Meta no Supabase.', { fill: REPORT_COLORS.note, fontColor: REPORT_COLORS.noteText, align: 'left' });
    excelRow += 1;
  }
  analysis.creatives.forEach((creative) => {
    const m = creative.metrics;
    const values = [
      creative.frente, creative.adset, creative.ad,
      m.spend, m.impressions, m.reach,
      mediaFrequency(m) ?? '—', m.clicks, mediaCtr(m) ?? 0, mediaCpc(m),
    ];
    values.forEach((value, colIndex) => {
      const cell = ws.getCell(excelRow, colIndex + 1);
      setCellValue(cell, value, { align: colIndex <= 2 ? 'left' : 'right' });
      if ([3, 9].includes(colIndex)) cell.numFmt = CURRENCY_FMT;
      if ([4, 5, 7].includes(colIndex)) cell.numFmt = INT_FMT;
      if (colIndex === 6 && typeof value === 'number') cell.numFmt = '0.00';
      if (colIndex === 8) cell.numFmt = PCT_FMT;
    });
    excelRow += 1;
  });
  const coverage = analysis.adCoverage;
  const coverageText = coverage === null
    ? 'Cobertura nível anúncio: sem investimento Meta no mês.'
    : `Cobertura nível anúncio: ${(coverage * 100).toFixed(1)}% do investimento Meta do mês está detalhado por criativo no Supabase.${coverage < 0.95 ? ' ⚠ Abaixo de 95% — checar ingestão de ads.' : ''}`;
  ws.mergeCells(excelRow, 1, excelRow, headers.length);
  setCellValue(ws.getCell(excelRow, 1), coverageText, {
    fill: coverage !== null && coverage < 0.95 ? REPORT_COLORS.note : REPORT_COLORS.card,
    fontColor: coverage !== null && coverage < 0.95 ? REPORT_COLORS.noteText : REPORT_COLORS.gray,
    align: 'left',
  });
  return excelRow + 3;
}

function writeHeroWeeklyTable(ws: Worksheet, startRow: number, analysis: MidiaAnalysis): number {
  const headers = ['Frente (KPI-herói)', ...analysis.currentWindows.flatMap((window) => [window.label, `MoM ${window.label}`]), 'Mês', 'Δ mês MoM'];
  writeSectionTitle(ws, startRow, 'EFICIÊNCIA SEMANAL — KPI-HERÓI por frente (CPC/CPM/CPL, MoM verde = caiu)', headers.length);
  writeReportHeader(ws, startRow + 1, headers);
  FRENTE_ORDER.forEach((frente, index) => {
    const excelRow = startRow + 2 + index;
    const weekly = analysis.currentWindows.flatMap((_, weekIndex) => {
      const current = heroKpiValue(frente, analysis.weeklyCurrent.get(frente)![weekIndex]);
      const previous = heroKpiValue(frente, analysis.weeklyPrevious.get(frente)![weekIndex]);
      return [current ?? '—', reportPctText(reportDelta(current, previous))];
    });
    const monthCurrent = heroKpiValue(frente, mediaOrEmpty(analysis.byFrenteCurrent, frente));
    const monthPrevious = heroKpiValue(frente, mediaOrEmpty(analysis.byFrentePrevious, frente));
    const values = [`${frente} · ${HERO_KPI[frente]}`, ...weekly, monthCurrent ?? '—', reportPctText(reportDelta(monthCurrent, monthPrevious))];
    values.forEach((value, colIndex) => {
      const cell = ws.getCell(excelRow, colIndex + 1);
      setCellValue(cell, value, { align: colIndex === 0 ? 'left' : 'right' });
      if (colIndex >= 1 && colIndex % 2 === 1 && typeof value === 'number') cell.numFmt = CURRENCY_FMT;
    });
    analysis.currentWindows.forEach((_, weekIndex) => {
      const current = heroKpiValue(frente, analysis.weeklyCurrent.get(frente)![weekIndex]);
      const previous = heroKpiValue(frente, analysis.weeklyPrevious.get(frente)![weekIndex]);
      styleReportDelta(ws.getCell(excelRow, 3 + weekIndex * 2), reportDelta(current, previous), true);
    });
    styleReportDelta(ws.getCell(excelRow, headers.length), reportDelta(monthCurrent, monthPrevious), true);
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
  writeSectionTitle(ws, startRow, 'LEITURA DO MÊS — destaques automáticos', REPORT_WIDTH);
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

export function writeMidiaPagaSheet(workbook: Workbook, analysis: MidiaAnalysis): void {
  const ws = workbook.addWorksheet('Mídia Paga', {
    views: [{ state: 'frozen', xSplit: 2, ySplit: 2, topLeftCell: 'C3', activeCell: 'C3', showGridLines: false }],
  });
  const currentLabel = MONTHS_PT[analysis.currentStart.getMonth()];
  const previousLabel = MONTHS_PT[analysis.previousStart.getMonth()];
  ws.mergeCells(1, 1, 1, REPORT_WIDTH);
  setCellValue(ws.getCell(1, 1), `MÍDIA PAGA — ${currentLabel}/${analysis.currentStart.getFullYear()}  ·  todas as métricas vs ${previousLabel} (MoM)`, { bold: true, align: 'left' });
  ws.getCell(1, 1).font = { name: 'Arial', bold: true, color: { argb: REPORT_COLORS.navy }, size: 18 };
  ws.mergeCells(2, 1, 2, REPORT_WIDTH);
  setCellValue(ws.getCell(2, 1), 'Frentes classificadas pela tag do nome da campanha · Fonte: Supabase (paid_media_metrics) — Meta em nível de anúncio + Google agregado.', { align: 'left' });
  ws.getCell(2, 1).font = { name: 'Arial', color: { argb: REPORT_COLORS.gray }, size: 9 };

  writeMediaCards(ws, analysis);
  ws.mergeCells(8, 1, 9, REPORT_WIDTH);
  setCellValue(ws.getCell(8, 1), '⚠ Conversão de plataforma é evento (clique/lead/install), NÃO cartão emitido. Tracking de instalação B2C quebrou em abr/2026 e Plurix (+Amigo) zerou em jun — ler aquisição por CLIQUE/CPC até normalizar. Google entra só no total (sem criativo). MoM verde = melhora.', { fill: REPORT_COLORS.note, fontColor: REPORT_COLORS.noteText, align: 'left' });

  let row = 11;
  row = writeFrenteTable(ws, row, analysis);
  row = writeWeeklyPacingTable(ws, row, analysis, 'spend', 'PACING SEMANAL — INVESTIMENTO por frente com MoM por semana');
  row = writeWeeklyPacingTable(ws, row, analysis, 'clicks', 'PACING SEMANAL — CLIQUES por frente com MoM por semana');
  row = writePlatformTable(ws, row, analysis);
  row = writeCreativeTable(ws, row, analysis);
  row = writeHeroWeeklyTable(ws, row, analysis);
  row = writeHighlightsSection(ws, row, analysis);

  ws.mergeCells(row + 1, 1, row + 1, REPORT_WIDTH);
  setCellValue(ws.getCell(row + 1, 1), 'Rodapé: alcance = soma de reach diário (superestima usuários únicos entre dias). Google não reporta alcance nem criativo nesta base. Conversões de plataforma seguem não confiáveis (tracking) — usar CPL apenas em Seguros. Criativo não tem MoM nesta versão. Comparativo semanal usa dias proporcionais do mês anterior.', { fill: REPORT_COLORS.card, align: 'left' });
  ws.getCell(row + 1, 1).font = { name: 'Arial', italic: true, color: { argb: REPORT_COLORS.gray }, size: 8 };

  ws.getColumn(1).width = 24;
  for (let column = 2; column <= REPORT_WIDTH; column += 1) {
    ws.getColumn(column).width = column === 16 ? 16 : column % 2 === 0 ? 13 : 11;
  }
  ws.eachRow((excelRow) => { excelRow.height = Math.max(excelRow.height ?? 20, 20); });
}

async function fetchPaidMediaRows(start: Date, end: Date): Promise<PaidMediaRawRow[]> {
  const rows: PaidMediaRawRow[] = [];
  const pageSize = 1000;
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabase
      .from('paid_media_metrics')
      .select('date, channel, campaign, spend, impressions, clicks, conversions, reach, frequency, ad_name, adset_name')
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
