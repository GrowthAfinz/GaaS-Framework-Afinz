import type { Cell, Workbook, Worksheet } from 'exceljs';

type RawActivity = Record<string, any>;

type ReportMetrics = {
  disparos: number;
  base: number;
  propostas: number;
  aprovados: number;
  cartoes: number;
  custo: number;
};

type ReportRow = {
  date: string;
  bu: string;
  segmento: string;
  canal: string;
  metrics: ReportMetrics;
};

export type WeekWindow = {
  label: string;
  startDay: number;
  endDay: number;
  days: number;
};

export const MONTHS_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export const REPORT_COLORS = {
  navy: '1F2937',
  slate: '334155',
  card: 'F1F5F9',
  grid: 'CBD5E1',
  lightGrid: 'E2E8F0',
  note: 'FEF3C7',
  noteText: 'D97706',
  green: '059669',
  red: 'DC2626',
  gray: '64748B',
  blue: '2563EB',
  total: 'E2E8F0',
  white: 'FFFFFF',
};

const getReportValue = (row: RawActivity, keys: string[]): any => {
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(row, key)) return row[key];
  }
  return null;
};

const toNumber = (value: any): number => {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const normalized = String(value)
    .replace(/[R$\s]/g, '')
    .replace(/\.(?=\d{3}(?:\D|$))/g, '')
    .replace(',', '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const dateOnlyReport = (value: any): string => String(value ?? '').slice(0, 10);

const reportMonthKey = (date: Date): string => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

export const monthStart = (date: Date): Date => new Date(date.getFullYear(), date.getMonth(), 1);

export const monthEnd = (date: Date): Date => new Date(date.getFullYear(), date.getMonth() + 1, 0);

export const previousMonthStart = (date: Date): Date => new Date(date.getFullYear(), date.getMonth() - 1, 1);

const normalizeReportChannel = (value: any): string => {
  const raw = String(value ?? '').trim();
  const upper = raw.toUpperCase();
  if (upper.includes('WHATS') || upper === 'WPP') return 'WhatsApp';
  if (upper.includes('MAIL')) return 'E-mail';
  if (upper.includes('PUSH')) return 'Push';
  if (upper.includes('SMS')) return 'SMS';
  return raw || 'N/A';
};

const emptyReportMetrics = (): ReportMetrics => ({
  disparos: 0,
  base: 0,
  propostas: 0,
  aprovados: 0,
  cartoes: 0,
  custo: 0,
});

const addReportMetrics = (target: ReportMetrics, source: ReportMetrics): ReportMetrics => {
  target.disparos += source.disparos;
  target.base += source.base;
  target.propostas += source.propostas;
  target.aprovados += source.aprovados;
  target.cartoes += source.cartoes;
  target.custo += source.custo;
  return target;
};

const rowMetrics = (row: RawActivity): ReportMetrics => ({
  disparos: 1,
  base: toNumber(getReportValue(row, ['Base Acionável', 'Base Acionavel'])),
  propostas: toNumber(getReportValue(row, ['Propostas'])),
  aprovados: toNumber(getReportValue(row, ['Aprovados'])),
  cartoes: toNumber(getReportValue(row, ['Cartões Gerados', 'Cartoes Gerados'])),
  custo: toNumber(getReportValue(row, ['Custo Total Campanha'])),
});

const toReportRow = (row: RawActivity): ReportRow => ({
  date: dateOnlyReport(getReportValue(row, ['Data de Disparo'])),
  bu: String(getReportValue(row, ['BU']) ?? 'N/A') || 'N/A',
  segmento: String(getReportValue(row, ['Segmento']) ?? 'N/A') || 'N/A',
  canal: normalizeReportChannel(getReportValue(row, ['Canal'])),
  metrics: rowMetrics(row),
});

const reportCac = (metrics: ReportMetrics): number | null => (metrics.cartoes ? metrics.custo / metrics.cartoes : null);

const reportRate = (num: number, den: number): number | null => (den ? num / den : null);

export const reportDelta = (current: number | null, previous: number | null): number | null => {
  if (current === null || previous === null || !previous) return null;
  return current / previous - 1;
};

export const reportPctText = (value: number | null): string => {
  if (value === null || !Number.isFinite(value)) return '—';
  return `${value >= 0 ? '+' : ''}${Math.round(value * 100)}%`;
};

const reportDeltaColor = (value: number | null, invert = false): string => {
  if (value === null || !Number.isFinite(value) || value === 0) return REPORT_COLORS.gray;
  const isBetter = invert ? value < 0 : value > 0;
  return isBetter ? REPORT_COLORS.green : REPORT_COLORS.red;
};

export const dayOfMonthReport = (dateString: string): number => Number(dateString.slice(8, 10));

export const weekWindows = (date: Date, maxDay: number): WeekWindow[] => {
  const windows: WeekWindow[] = [];
  const monthNumber = date.getMonth() + 1;
  for (let startDay = 1; startDay <= maxDay; startDay += 7) {
    const endDay = Math.min(startDay + 6, maxDay);
    windows.push({
      label: `${String(startDay).padStart(2, '0')}/${String(monthNumber).padStart(2, '0')}`,
      startDay,
      endDay,
      days: endDay - startDay + 1,
    });
  }
  return windows;
};

export const previousWeekWindows = (date: Date, currentWindows: WeekWindow[]): WeekWindow[] => {
  const lastDay = monthEnd(date).getDate();
  return currentWindows.map((window) => {
    const startDay = Math.min(window.startDay, lastDay);
    const endDay = Math.min(startDay + window.days - 1, lastDay);
    return {
      label: `${String(startDay).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`,
      startDay,
      endDay,
      days: endDay - startDay + 1,
    };
  });
};

const aggregateReportRows = (rows: ReportRow[]): ReportMetrics => rows.reduce(
  (total, row) => addReportMetrics(total, row.metrics),
  emptyReportMetrics(),
);

const buildReportGroup = (rows: ReportRow[], keyFn: (row: ReportRow) => string): Map<string, ReportMetrics> => {
  const grouped = new Map<string, ReportMetrics>();
  rows.forEach((row) => {
    const key = keyFn(row);
    if (!grouped.has(key)) grouped.set(key, emptyReportMetrics());
    addReportMetrics(grouped.get(key)!, row.metrics);
  });
  return grouped;
};

const metricOrEmpty = (map: Map<string, ReportMetrics>, key: string): ReportMetrics => map.get(key) ?? emptyReportMetrics();

export function setCellValue(cell: Cell, value: any, options: { bold?: boolean; fontColor?: string; fill?: string; align?: 'left' | 'center' | 'right'; numFmt?: string } = {}): void {
  cell.value = value;
  cell.font = { name: 'Arial', bold: options.bold ?? false, color: { argb: options.fontColor ?? REPORT_COLORS.navy }, size: 10 };
  cell.alignment = { vertical: 'middle', horizontal: options.align ?? 'right', wrapText: false };
  if (options.fill) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: options.fill } };
  if (options.numFmt) cell.numFmt = options.numFmt;
  cell.border = {
    top: { style: 'thin', color: { argb: REPORT_COLORS.lightGrid } },
    bottom: { style: 'thin', color: { argb: REPORT_COLORS.lightGrid } },
    left: { style: 'thin', color: { argb: REPORT_COLORS.lightGrid } },
    right: { style: 'thin', color: { argb: REPORT_COLORS.lightGrid } },
  };
}

export function writeReportHeader(ws: Worksheet, row: number, headers: string[]): void {
  headers.forEach((header, index) => {
    const cell = ws.getCell(row, index + 1);
    setCellValue(cell, header, { bold: true, fill: REPORT_COLORS.slate, fontColor: REPORT_COLORS.white, align: 'center' });
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  });
  ws.getRow(row).height = 30;
}

export function styleReportDelta(cell: Cell, value: number | null, invert = false): void {
  cell.font = { name: 'Arial', bold: true, color: { argb: reportDeltaColor(value, invert) }, size: 10 };
  cell.alignment = { vertical: 'middle', horizontal: 'center' };
}

export function writeSectionTitle(ws: Worksheet, row: number, title: string, columns: number): void {
  ws.mergeCells(row, 1, row, columns);
  setCellValue(ws.getCell(row, 1), title, { bold: true, align: 'left' });
  ws.getCell(row, 1).font = { name: 'Arial', bold: true, color: { argb: REPORT_COLORS.navy }, size: 14 };
}

function buildReportAnalysis(rawRows: RawActivity[], currentStart: Date, currentEnd: Date) {
  const currentKey = reportMonthKey(currentStart);
  const prevStart = previousMonthStart(currentStart);
  const previousKey = reportMonthKey(prevStart);
  const rows = rawRows
    .filter((row) => {
      const status = String(getReportValue(row, ['status', 'Status']) ?? '');
      const etapa = String(getReportValue(row, ['Etapa de aquisição']) ?? '');
      const segmento = String(getReportValue(row, ['Segmento']) ?? '');
      return status === 'Realizado'
        && ['Aquisicao', 'Meio_de_Funil'].includes(etapa)
        && segmento !== 'Rentabilizacao';
    })
    .map(toReportRow);
  const currentRows = rows.filter((row) => row.date.startsWith(currentKey));
  const previousRows = rows.filter((row) => row.date.startsWith(previousKey));
  const maxDataDay = currentRows.length
    ? Math.max(...currentRows.map((row) => dayOfMonthReport(row.date)))
    : currentEnd.getDate();
  const currentWindows = weekWindows(currentStart, Math.min(maxDataDay, currentEnd.getDate()));
  const prevWindows = previousWeekWindows(prevStart, currentWindows);

  const currentTotal = aggregateReportRows(currentRows);
  const previousTotal = aggregateReportRows(previousRows);
  const bySegmentCurrent = buildReportGroup(currentRows, (row) => `${row.bu}||${row.segmento}`);
  const bySegmentPrevious = buildReportGroup(previousRows, (row) => `${row.bu}||${row.segmento}`);
  const byChannelCurrent = buildReportGroup(currentRows, (row) => row.canal);
  const byChannelPrevious = buildReportGroup(previousRows, (row) => row.canal);
  const segmentKeys = Array.from(new Set([...bySegmentCurrent.keys(), ...bySegmentPrevious.keys()])).sort();
  const channelKeys = Array.from(new Set([...byChannelCurrent.keys(), ...byChannelPrevious.keys()]))
    .sort((a, b) => metricOrEmpty(byChannelCurrent, b).cartoes - metricOrEmpty(byChannelCurrent, a).cartoes || a.localeCompare(b));

  const weeklyCurrent = new Map<string, ReportMetrics[]>();
  const weeklyPrevious = new Map<string, ReportMetrics[]>();
  segmentKeys.forEach((key) => {
    weeklyCurrent.set(key, currentWindows.map(() => emptyReportMetrics()));
    weeklyPrevious.set(key, prevWindows.map(() => emptyReportMetrics()));
  });

  currentRows.forEach((row) => {
    const key = `${row.bu}||${row.segmento}`;
    const index = currentWindows.findIndex((window) => dayOfMonthReport(row.date) >= window.startDay && dayOfMonthReport(row.date) <= window.endDay);
    if (index >= 0) addReportMetrics(weeklyCurrent.get(key)![index], row.metrics);
  });
  previousRows.forEach((row) => {
    const key = `${row.bu}||${row.segmento}`;
    if (!weeklyPrevious.has(key)) return;
    const index = prevWindows.findIndex((window) => dayOfMonthReport(row.date) >= window.startDay && dayOfMonthReport(row.date) <= window.endDay);
    if (index >= 0) addReportMetrics(weeklyPrevious.get(key)![index], row.metrics);
  });

  const cardsBySegment = segmentKeys.reduce((sum, key) => sum + metricOrEmpty(bySegmentCurrent, key).cartoes, 0);
  const cardsByChannel = channelKeys.reduce((sum, key) => sum + metricOrEmpty(byChannelCurrent, key).cartoes, 0);
  const weeklyCards = segmentKeys.reduce((sum, key) => sum + (weeklyCurrent.get(key) ?? []).reduce((inner, metric) => inner + metric.cartoes, 0), 0);
  const weeklyDispatches = segmentKeys.reduce((sum, key) => sum + (weeklyCurrent.get(key) ?? []).reduce((inner, metric) => inner + metric.disparos, 0), 0);
  if (cardsBySegment !== currentTotal.cartoes || cardsByChannel !== currentTotal.cartoes || weeklyCards !== currentTotal.cartoes || weeklyDispatches !== currentTotal.disparos) {
    throw new Error('Validação falhou: totais de cartões/disparos não reconciliam entre as seções.');
  }

  return {
    currentRows,
    currentTotal,
    previousTotal,
    bySegmentCurrent,
    bySegmentPrevious,
    byChannelCurrent,
    byChannelPrevious,
    segmentKeys,
    channelKeys,
    currentWindows,
    weeklyCurrent,
    weeklyPrevious,
    currentStart,
    previousStart: prevStart,
  };
}

function writeCards(ws: Worksheet, analysis: ReturnType<typeof buildReportAnalysis>): void {
  const rows = [
    ['DISPAROS', 'CARTÕES', 'CUSTO (R$)', 'CAC (R$)', 'PROPOSTAS*', 'APROVADOS*'],
    [
      analysis.currentTotal.disparos,
      analysis.currentTotal.cartoes,
      analysis.currentTotal.custo,
      reportCac(analysis.currentTotal) ?? 0,
      analysis.currentTotal.propostas,
      analysis.currentTotal.aprovados,
    ],
    [
      reportPctText(reportDelta(analysis.currentTotal.disparos, analysis.previousTotal.disparos)),
      reportPctText(reportDelta(analysis.currentTotal.cartoes, analysis.previousTotal.cartoes)),
      reportPctText(reportDelta(analysis.currentTotal.custo, analysis.previousTotal.custo)),
      reportPctText(reportDelta(reportCac(analysis.currentTotal), reportCac(analysis.previousTotal))),
      reportPctText(reportDelta(analysis.currentTotal.propostas, analysis.previousTotal.propostas)),
      reportPctText(reportDelta(analysis.currentTotal.aprovados, analysis.previousTotal.aprovados)),
    ],
  ];
  rows.forEach((line, rowIndex) => {
    line.forEach((value, colIndex) => {
      const cell = ws.getCell(4 + rowIndex, colIndex + 1);
      setCellValue(cell, rowIndex === 2 ? `MoM ${value}` : value, { bold: true, fill: REPORT_COLORS.card, align: 'center' });
      if (rowIndex === 1) {
        cell.font = { name: 'Arial', bold: true, color: { argb: colIndex === 1 ? REPORT_COLORS.green : colIndex === 3 ? REPORT_COLORS.blue : REPORT_COLORS.navy }, size: 14 };
        if ([2, 3].includes(colIndex)) cell.numFmt = '"R$" #,##0.00';
      }
      if (rowIndex === 2) {
        const deltas = [
          reportDelta(analysis.currentTotal.disparos, analysis.previousTotal.disparos),
          reportDelta(analysis.currentTotal.cartoes, analysis.previousTotal.cartoes),
          reportDelta(analysis.currentTotal.custo, analysis.previousTotal.custo),
          reportDelta(reportCac(analysis.currentTotal), reportCac(analysis.previousTotal)),
          reportDelta(analysis.currentTotal.propostas, analysis.previousTotal.propostas),
          reportDelta(analysis.currentTotal.aprovados, analysis.previousTotal.aprovados),
        ];
        styleReportDelta(cell, deltas[colIndex], [2, 3].includes(colIndex));
      }
    });
  });
}

function writeSegmentTable(ws: Worksheet, startRow: number, analysis: ReturnType<typeof buildReportAnalysis>): number {
  const headers = ['BU', 'Segmento', 'Disparos', 'Variação MoM', 'Base acionável', 'Variação MoM', 'Propostas*', 'Variação MoM', 'Aprovados*', 'Variação MoM', 'Cartões', 'Variação MoM', 'Custo (R$)', 'Variação MoM', 'CAC (R$)', 'Variação MoM', 'Taxa cartão/base', 'Taxa aprov./propostas*'];
  writeSectionTitle(ws, startRow, 'POR BU × SEGMENTO — todas as métricas com Δ MoM', headers.length);
  writeReportHeader(ws, startRow + 1, headers);
  const rows = [...analysis.segmentKeys, 'TOTAL'];
  rows.forEach((key, index) => {
    const excelRow = startRow + 2 + index;
    const current = key === 'TOTAL' ? analysis.currentTotal : metricOrEmpty(analysis.bySegmentCurrent, key);
    const previous = key === 'TOTAL' ? analysis.previousTotal : metricOrEmpty(analysis.bySegmentPrevious, key);
    const [bu, segmento] = key === 'TOTAL' ? ['TOTAL', ''] : key.split('||');
    const values = [
      bu, segmento,
      current.disparos, reportPctText(reportDelta(current.disparos, previous.disparos)),
      current.base, reportPctText(reportDelta(current.base, previous.base)),
      current.propostas, reportPctText(reportDelta(current.propostas, previous.propostas)),
      current.aprovados, reportPctText(reportDelta(current.aprovados, previous.aprovados)),
      current.cartoes, reportPctText(reportDelta(current.cartoes, previous.cartoes)),
      current.custo, reportPctText(reportDelta(current.custo, previous.custo)),
      reportCac(current) ?? null, reportPctText(reportDelta(reportCac(current), reportCac(previous))),
      reportRate(current.cartoes, current.base) ?? 0,
      reportRate(current.aprovados, current.propostas) ?? 0,
    ];
    values.forEach((value, colIndex) => {
      const cell = ws.getCell(excelRow, colIndex + 1);
      setCellValue(cell, value, { bold: key === 'TOTAL', fill: key === 'TOTAL' ? REPORT_COLORS.total : undefined, align: colIndex <= 1 ? 'left' : 'right' });
      if ([2, 4, 6, 8, 10].includes(colIndex)) cell.numFmt = '#,##0';
      if ([12, 14].includes(colIndex)) cell.numFmt = '"R$" #,##0.00';
      if ([16, 17].includes(colIndex)) cell.numFmt = '0.00%';
    });
    [
      [4, reportDelta(current.disparos, previous.disparos), false],
      [6, reportDelta(current.base, previous.base), false],
      [8, reportDelta(current.propostas, previous.propostas), false],
      [10, reportDelta(current.aprovados, previous.aprovados), false],
      [12, reportDelta(current.cartoes, previous.cartoes), false],
      [14, reportDelta(current.custo, previous.custo), true],
      [16, reportDelta(reportCac(current), reportCac(previous)), true],
    ].forEach(([column, delta, invert]) => styleReportDelta(ws.getCell(excelRow, column as number), delta as number | null, invert as boolean));
  });
  return startRow + rows.length + 3;
}

const weeklyMetricValue = (metrics: ReportMetrics, metric: 'cartoes' | 'disparos'): number => metric === 'cartoes' ? metrics.cartoes : metrics.disparos;

function writeWeeklyTable(ws: Worksheet, startRow: number, analysis: ReturnType<typeof buildReportAnalysis>, metric: 'cartoes' | 'disparos', title: string): number {
  const headers = ['BU', 'Segmento', ...analysis.currentWindows.flatMap((window) => [window.label, `MoM ${window.label}`]), 'Total', 'Variação total MoM'];
  writeSectionTitle(ws, startRow, title, headers.length);
  writeReportHeader(ws, startRow + 1, headers);
  const rows = [...analysis.segmentKeys, 'TOTAL'];
  rows.forEach((key, index) => {
    const excelRow = startRow + 2 + index;
    const [bu, segmento] = key === 'TOTAL' ? ['TOTAL', ''] : key.split('||');
    const weekly = analysis.currentWindows.flatMap((_, weekIndex) => {
      const current = key === 'TOTAL'
        ? analysis.segmentKeys.reduce((sum, segmentKey) => sum + weeklyMetricValue(analysis.weeklyCurrent.get(segmentKey)![weekIndex], metric), 0)
        : weeklyMetricValue(analysis.weeklyCurrent.get(key)![weekIndex], metric);
      const previous = key === 'TOTAL'
        ? analysis.segmentKeys.reduce((sum, segmentKey) => sum + weeklyMetricValue(analysis.weeklyPrevious.get(segmentKey)![weekIndex], metric), 0)
        : weeklyMetricValue(analysis.weeklyPrevious.get(key)![weekIndex], metric);
      return [current, reportPctText(reportDelta(current, previous))];
    });
    const currentTotal = key === 'TOTAL' ? weeklyMetricValue(analysis.currentTotal, metric) : weeklyMetricValue(metricOrEmpty(analysis.bySegmentCurrent, key), metric);
    const previousTotal = key === 'TOTAL' ? weeklyMetricValue(analysis.previousTotal, metric) : weeklyMetricValue(metricOrEmpty(analysis.bySegmentPrevious, key), metric);
    const values = [bu, segmento, ...weekly, currentTotal, reportPctText(reportDelta(currentTotal, previousTotal))];
    values.forEach((value, colIndex) => {
      const cell = ws.getCell(excelRow, colIndex + 1);
      setCellValue(cell, value, { bold: key === 'TOTAL', fill: key === 'TOTAL' ? REPORT_COLORS.total : undefined, align: colIndex <= 1 ? 'left' : 'right' });
      if (colIndex >= 2 && colIndex % 2 === 0) cell.numFmt = '#,##0';
    });
    analysis.currentWindows.forEach((_, weekIndex) => {
      const current = key === 'TOTAL'
        ? analysis.segmentKeys.reduce((sum, segmentKey) => sum + weeklyMetricValue(analysis.weeklyCurrent.get(segmentKey)![weekIndex], metric), 0)
        : weeklyMetricValue(analysis.weeklyCurrent.get(key)![weekIndex], metric);
      const previous = key === 'TOTAL'
        ? analysis.segmentKeys.reduce((sum, segmentKey) => sum + weeklyMetricValue(analysis.weeklyPrevious.get(segmentKey)![weekIndex], metric), 0)
        : weeklyMetricValue(analysis.weeklyPrevious.get(key)![weekIndex], metric);
      styleReportDelta(ws.getCell(excelRow, 4 + weekIndex * 2), reportDelta(current, previous));
    });
    styleReportDelta(ws.getCell(excelRow, headers.length), reportDelta(currentTotal, previousTotal));
  });
  return startRow + rows.length + 3;
}

function writeChannelTable(ws: Worksheet, startRow: number, analysis: ReturnType<typeof buildReportAnalysis>): number {
  const headers = ['Canal', 'Disparos', 'Cartões', 'Custo (R$)', 'CAC (R$)', 'Variação cartões MoM', 'Variação CAC MoM', 'Relevância'];
  writeSectionTitle(ws, startRow, 'POR CANAL (com MoM e relevância)', headers.length);
  writeReportHeader(ws, startRow + 1, headers);
  analysis.channelKeys.forEach((channel, index) => {
    const current = metricOrEmpty(analysis.byChannelCurrent, channel);
    const previous = metricOrEmpty(analysis.byChannelPrevious, channel);
    const share = reportRate(current.cartoes, analysis.currentTotal.cartoes) ?? 0;
    const relevance = share > 0.15 ? `${Math.round(share * 100)}% · alto`
      : share >= 0.03 ? `${Math.round(share * 100)}% · médio`
      : `${Math.round(share * 100)}% · baixo (irrelevante)`;
    const values = [channel, current.disparos, current.cartoes, current.custo, reportCac(current) ?? null, reportPctText(reportDelta(current.cartoes, previous.cartoes)), reportPctText(reportDelta(reportCac(current), reportCac(previous))), relevance];
    values.forEach((value, colIndex) => {
      const cell = ws.getCell(startRow + 2 + index, colIndex + 1);
      setCellValue(cell, value, { align: colIndex === 0 ? 'left' : 'right' });
      if ([1, 2].includes(colIndex)) cell.numFmt = '#,##0';
      if ([3, 4].includes(colIndex)) cell.numFmt = '"R$" #,##0.00';
    });
    styleReportDelta(ws.getCell(startRow + 2 + index, 6), reportDelta(current.cartoes, previous.cartoes));
    styleReportDelta(ws.getCell(startRow + 2 + index, 7), reportDelta(reportCac(current), reportCac(previous)), true);
    ws.getCell(startRow + 2 + index, 8).font = { name: 'Arial', bold: true, color: { argb: share > 0.15 ? REPORT_COLORS.green : share >= 0.03 ? REPORT_COLORS.blue : REPORT_COLORS.red }, size: 10 };
  });
  return startRow + analysis.channelKeys.length + 3;
}

export function writeAquisicaoCrmMonthlySheet(workbook: Workbook, rawRows: RawActivity[], start: Date, end: Date): void {
  const currentStart = monthStart(start);
  const currentEnd = end;
  const analysis = buildReportAnalysis(rawRows, currentStart, currentEnd);
  const ws = workbook.addWorksheet('CRM Aquisição', {
    views: [{ state: 'frozen', xSplit: 2, ySplit: 2, topLeftCell: 'C3', activeCell: 'C3', showGridLines: false }],
  });
  ws.mergeCells(1, 1, 1, 18);
  const previousLabel = MONTHS_PT[analysis.previousStart.getMonth()];
  setCellValue(ws.getCell(1, 1), `CRM AQUISIÇÃO — ${MONTHS_PT[currentStart.getMonth()]}/${currentStart.getFullYear()}  ·  todas as métricas vs ${previousLabel} (MoM)`, { bold: true, align: 'left' });
  ws.getCell(1, 1).font = { name: 'Arial', bold: true, color: { argb: REPORT_COLORS.navy }, size: 18 };
  ws.mergeCells(2, 1, 2, 18);
  setCellValue(ws.getCell(2, 1), `Disparos Salesforce por BU × Segmento · CAC = custo de disparo ÷ cartões · Fonte: Supabase (activities).`, { align: 'left' });
  ws.getCell(2, 1).font = { name: 'Arial', color: { argb: REPORT_COLORS.gray }, size: 9 };

  writeCards(ws, analysis);
  ws.mergeCells(8, 1, 9, 18);
  setCellValue(ws.getCell(8, 1), '⚠ *Propostas/Aprovados inflados desde fev/2026 (contam eventos, não pessoas — ler por CARTÃO). CAC não inclui incentivo de oferta. MoM verde = melhora. Comparativo semanal usa dias proporcionais do mês anterior.', { fill: REPORT_COLORS.note, fontColor: REPORT_COLORS.noteText, align: 'left' });

  let row = 11;
  row = writeSegmentTable(ws, row, analysis);
  row = writeWeeklyTable(ws, row, analysis, 'cartoes', 'RESULTADO SEMANAL — CARTÕES por BU × Segmento com MoM por semana');
  row = writeWeeklyTable(ws, row, analysis, 'disparos', 'CADÊNCIA SEMANAL — DISPAROS por BU × Segmento com MoM por semana');
  row = writeChannelTable(ws, row, analysis);
  ws.mergeCells(row + 1, 1, row + 1, 18);
  setCellValue(ws.getCell(row + 1, 1), 'Rodapé: Propostas* e Aprovados* contam eventos desde fev/2026; não usar taxa de finalização aprovados→cartões como KPI. O exportador browser não cria gráfico nativo; use a tabela BU × Segmento como fonte do gráfico no workbook completo.', { fill: REPORT_COLORS.card, align: 'left' });
  ws.getCell(row + 1, 1).font = { name: 'Arial', italic: true, color: { argb: REPORT_COLORS.gray }, size: 8 };

  const widths = [12, 28, 12, 16, 16, 16, 14, 16, 14, 16, 12, 16, 14, 16, 14, 16, 16, 18];
  widths.forEach((width, index) => { ws.getColumn(index + 1).width = width; });
  ws.eachRow((excelRow) => { excelRow.height = Math.max(excelRow.height ?? 20, 20); });
}

export function buildAquisicaoCrmMonthlyReportWorkbook(ExcelJSRuntime: { Workbook: new () => Workbook }, rawRows: RawActivity[], start: Date, end: Date): Workbook {
  const workbook = new ExcelJSRuntime.Workbook();
  workbook.creator = 'GaaS AFINZ';
  workbook.created = new Date();
  writeAquisicaoCrmMonthlySheet(workbook, rawRows, start, end);
  return workbook;
}
