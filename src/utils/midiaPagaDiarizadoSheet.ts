import type { Workbook, Worksheet } from 'exceljs';
import type { MediaMetrics, MidiaFrente, PaidRow } from './midiaPagaMonthlyReportExport';
import { MONTHS_PT, REPORT_COLORS, monthEnd, setCellValue } from './crmAquisicaoMonthlyReportExport';

// Budgets mensais por frente — mesmos valores do report de junho/2026 gerado por script.
// Ajustar manualmente quando o budget mudar (não há fonte em `goals` para mídia paga ainda).
const MONTHLY_BUDGETS: Record<MidiaFrente, number> = {
  'Aquisição B2C': 7000,
  'Marca B2C (Copa)': 5000,
  'Aquisição Plurix': 3000,
  'Seguros': 3000,
};

const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const CURRENCY_FMT = '"R$" #,##0.00';
const INT_FMT = '#,##0';
const PCT_FMT = '0.00%';
const DEC_FMT = '0.00';

type ColumnFmt = 'cur' | 'int' | 'pct' | 'dec' | null;

type DiarizadoObjective = {
  frente: MidiaFrente;
  title: string;
  color: string;
  kpiLabel: 'CPC' | 'CPM' | 'CPL';
  volumeLabel: string;
  startCol: number;
  columns: string[];
  formats: ColumnFmt[];
  fragileConvCol: number | null;
};

const OBJECTIVES: DiarizadoObjective[] = [
  {
    frente: 'Aquisição B2C',
    title: 'Aquisição B2C (app)',
    color: '2563EB',
    kpiLabel: 'CPC',
    volumeLabel: 'Cliques',
    startCol: 3,
    columns: ['Investimento', 'Invest. acum', 'Invest. meta acum', 'Cliques', 'Cliques acum', 'CPC', 'Impressões', 'Impr. acum', 'CTR', 'CPM', 'Conv (frágil)*'],
    formats: ['cur', 'cur', 'cur', 'int', 'int', 'cur', 'int', 'int', 'pct', 'cur', 'int'],
    fragileConvCol: 10,
  },
  {
    frente: 'Marca B2C (Copa)',
    title: 'Marca / Copa',
    color: '7C3AED',
    kpiLabel: 'CPM',
    volumeLabel: 'Impressões',
    startCol: 14,
    columns: ['Investimento', 'Invest. acum', 'Invest. meta acum', 'Impressões', 'Impr. acum', 'CPM', 'Alcance', 'Alcance acum', 'Frequência', 'Cliques', 'CTR'],
    formats: ['cur', 'cur', 'cur', 'int', 'int', 'cur', 'int', 'int', 'dec', 'int', 'pct'],
    fragileConvCol: null,
  },
  {
    frente: 'Aquisição Plurix',
    title: 'Aquisição Plurix',
    color: '059669',
    kpiLabel: 'CPC',
    volumeLabel: 'Cliques',
    startCol: 25,
    columns: ['Investimento', 'Invest. acum', 'Invest. meta acum', 'Cliques', 'Cliques acum', 'CPC', 'Impressões', 'CTR', 'Alcance', 'Alcance acum', 'Conv (frágil)*'],
    formats: ['cur', 'cur', 'cur', 'int', 'int', 'cur', 'int', 'pct', 'int', 'int', 'int'],
    fragileConvCol: 10,
  },
  {
    frente: 'Seguros',
    title: 'Seguros',
    color: 'D97706',
    kpiLabel: 'CPL',
    volumeLabel: 'Leads',
    startCol: 36,
    columns: ['Investimento', 'Invest. acum', 'Invest. meta acum', 'Leads', 'Leads acum', 'CPL', 'Cliques', 'CTR', 'CPM', 'Impressões', 'Conv'],
    formats: ['cur', 'cur', 'cur', 'int', 'int', 'cur', 'int', 'pct', 'cur', 'int', 'int'],
    fragileConvCol: null,
  },
];

const BAND_WIDTH = 11;
const LAST_COL = OBJECTIVES[OBJECTIVES.length - 1].startCol + BAND_WIDTH - 1; // 46 (AT)

const emptyDay = (): MediaMetrics => ({ spend: 0, impressions: 0, clicks: 0, conversions: 0, reach: 0 });

const safeDiv = (num: number, den: number): number | null => (den ? num / den : null);
const dayCpc = (m: MediaMetrics): number | null => safeDiv(m.spend, m.clicks);
const dayCpm = (m: MediaMetrics): number | null => (m.impressions ? (m.spend / m.impressions) * 1000 : null);
const dayCtr = (m: MediaMetrics): number | null => safeDiv(m.clicks, m.impressions);
const dayCpl = (m: MediaMetrics): number | null => safeDiv(m.spend, m.conversions);
const dayFreq = (m: MediaMetrics): number | null => safeDiv(m.impressions, m.reach);

const numFmtFor = (fmt: ColumnFmt): string | undefined => {
  if (fmt === 'cur') return CURRENCY_FMT;
  if (fmt === 'int') return INT_FMT;
  if (fmt === 'pct') return PCT_FMT;
  if (fmt === 'dec') return DEC_FMT;
  return undefined;
};

type Accumulators = { spend: number; volume: number; impressions: number; reach: number; clicks: number };

function dailyValues(objective: DiarizadoObjective, m: MediaMetrics, acc: Accumulators, metaAcum: number): (number | string | null)[] {
  if (objective.frente === 'Aquisição B2C') {
    return [m.spend, acc.spend, metaAcum, m.clicks, acc.volume, dayCpc(m), m.impressions, acc.impressions, dayCtr(m) ?? 0, dayCpm(m), m.conversions];
  }
  if (objective.frente === 'Marca B2C (Copa)') {
    return [m.spend, acc.spend, metaAcum, m.impressions, acc.volume, dayCpm(m), m.reach, acc.reach, dayFreq(m), m.clicks, dayCtr(m) ?? 0];
  }
  if (objective.frente === 'Aquisição Plurix') {
    return [m.spend, acc.spend, metaAcum, m.clicks, acc.volume, dayCpc(m), m.impressions, dayCtr(m) ?? 0, m.reach, acc.reach, m.conversions];
  }
  return [m.spend, acc.spend, metaAcum, m.conversions, acc.volume, dayCpl(m), m.clicks, dayCtr(m) ?? 0, dayCpm(m), m.impressions, m.conversions];
}

function totalValues(objective: DiarizadoObjective, total: MediaMetrics, metaLast: number): (number | string | null)[] {
  if (objective.frente === 'Aquisição B2C') {
    return [total.spend, total.spend, metaLast, total.clicks, total.clicks, dayCpc(total), total.impressions, total.impressions, dayCtr(total) ?? 0, dayCpm(total), total.conversions];
  }
  if (objective.frente === 'Marca B2C (Copa)') {
    return [total.spend, total.spend, metaLast, total.impressions, total.impressions, dayCpm(total), total.reach, total.reach, dayFreq(total), total.clicks, dayCtr(total) ?? 0];
  }
  if (objective.frente === 'Aquisição Plurix') {
    return [total.spend, total.spend, metaLast, total.clicks, total.clicks, dayCpc(total), total.impressions, dayCtr(total) ?? 0, total.reach, total.reach, total.conversions];
  }
  return [total.spend, total.spend, metaLast, total.conversions, total.conversions, dayCpl(total), total.clicks, dayCtr(total) ?? 0, dayCpm(total), total.impressions, total.conversions];
}

const objectiveVolume = (objective: DiarizadoObjective, m: MediaMetrics): number => {
  if (objective.frente === 'Marca B2C (Copa)') return m.impressions;
  if (objective.frente === 'Seguros') return m.conversions;
  return m.clicks;
};

const objectiveEfficiency = (objective: DiarizadoObjective, m: MediaMetrics): number | null => {
  if (objective.kpiLabel === 'CPM') return dayCpm(m);
  if (objective.kpiLabel === 'CPL') return dayCpl(m);
  return dayCpc(m);
};

function cockpitReading(objective: DiarizadoObjective, dailySeries: MediaMetrics[], projection: number, budget: number, total: MediaMetrics): string {
  if (projection > budget * 1.1) return '🔴 Projeção estoura o budget do mês.';
  if (objective.frente === 'Marca B2C (Copa)') {
    const freq = dayFreq(total);
    if (freq !== null && freq > 3) return '⚠ Frequência alta — saturação de audiência.';
    return 'Sem alerta crítico no D-1.';
  }
  if (objective.frente === 'Seguros') {
    const lastFour = dailySeries.slice(-4);
    if (lastFour.length === 4 && lastFour.every((day) => day.conversions === 0)) return '⚠ Lead intermitente — revisar evento de conversão.';
    return 'Sem alerta crítico no D-1.';
  }
  const lastThree = dailySeries.slice(-3).map((day) => dayCpc(day));
  if (lastThree.length === 3 && lastThree.every((value) => value !== null)
    && (lastThree[0] as number) < (lastThree[1] as number) && (lastThree[1] as number) < (lastThree[2] as number)) {
    return '⚠ CPC em alta há 3 dias — fadiga de criativo?';
  }
  return 'Sem alerta crítico no D-1.';
}

export function writeMidiaPagaDiarizadoSheet(workbook: Workbook, currentRows: PaidRow[], currentStart: Date, maxDataDay: number): void {
  const daysInMonth = monthEnd(currentStart).getDate();
  const closedDays = Math.max(1, Math.min(maxDataDay, daysInMonth));
  const firstDataRow = 15;
  const totalRow = firstDataRow + closedDays;

  const ws = workbook.addWorksheet('Diarizado', {
    views: [{ state: 'frozen', xSplit: 0, ySplit: 14, topLeftCell: 'A15', activeCell: 'A15', showGridLines: false }],
  });

  // Agregação dia × frente
  const byDayFrente = new Map<string, MediaMetrics>();
  currentRows.forEach((row) => {
    const key = `${row.day}|${row.frente}`;
    if (!byDayFrente.has(key)) byDayFrente.set(key, emptyDay());
    const item = byDayFrente.get(key)!;
    item.spend += row.metrics.spend;
    item.impressions += row.metrics.impressions;
    item.clicks += row.metrics.clicks;
    item.conversions += row.metrics.conversions;
    item.reach += row.metrics.reach;
  });
  const seriesFor = (frente: MidiaFrente): MediaMetrics[] => {
    const series: MediaMetrics[] = [];
    for (let day = 1; day <= closedDays; day += 1) {
      series.push(byDayFrente.get(`${day}|${frente}`) ?? emptyDay());
    }
    return series;
  };
  const totalsFor = (series: MediaMetrics[]): MediaMetrics => series.reduce((total, day) => ({
    spend: total.spend + day.spend,
    impressions: total.impressions + day.impressions,
    clicks: total.clicks + day.clicks,
    conversions: total.conversions + day.conversions,
    reach: total.reach + day.reach,
  }), emptyDay());

  // Título
  ws.mergeCells(1, 1, 1, LAST_COL);
  setCellValue(ws.getCell(1, 1), `DIARIZADO — Pacing de Mídia Paga Afinz | ${MONTHS_PT[currentStart.getMonth()]}/${currentStart.getFullYear()}`, { bold: true, fill: REPORT_COLORS.slate, fontColor: REPORT_COLORS.white, align: 'center' });
  ws.getCell(1, 1).font = { name: 'Arial', bold: true, color: { argb: REPORT_COLORS.white }, size: 16 };
  ws.mergeCells(2, 1, 2, LAST_COL);
  setCellValue(ws.getCell(2, 1), 'Pacing por investimento confiável + leitura especializada por objetivo. Conversões aparecem como contexto frágil quando o tracking não sustenta decisão. Sem gráficos nesta versão (export via browser).', { fill: REPORT_COLORS.lightGrid, align: 'center' });
  ws.getCell(2, 1).font = { name: 'Arial', italic: true, color: { argb: REPORT_COLORS.navy }, size: 9 };

  // Cockpit
  ws.mergeCells(4, 1, 10, 2);
  setCellValue(ws.getCell(4, 1), 'COCKPIT', { bold: true, fill: REPORT_COLORS.slate, fontColor: REPORT_COLORS.white, align: 'center' });

  OBJECTIVES.forEach((objective) => {
    const series = seriesFor(objective.frente);
    const total = totalsFor(series);
    const budget = MONTHLY_BUDGETS[objective.frente];
    const startCol = objective.startCol;
    const endCol = startCol + BAND_WIDTH - 1;

    ws.mergeCells(5, startCol, 5, endCol);
    setCellValue(ws.getCell(5, startCol), objective.title, { bold: true, fill: objective.color, fontColor: REPORT_COLORS.white, align: 'center' });

    ['Indicador', 'Acumulado', 'Meta', 'Gap R$', 'Gap %', 'Projeção fim mês', 'Status'].forEach((header, offset) => {
      const cell = ws.getCell(6, startCol + offset);
      setCellValue(cell, header, { bold: true, fill: REPORT_COLORS.slate, fontColor: REPORT_COLORS.white, align: 'center' });
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    });

    const invAcum = total.spend;
    const invMeta = (budget / daysInMonth) * closedDays;
    const invGap = invAcum - invMeta;
    const invGapPct = invMeta ? invGap / invMeta : null;
    const invProjection = closedDays ? (invAcum / closedDays) * daysInMonth : 0;
    const invStatus = invGapPct === null ? '—' : invGapPct > 0.1 ? '🔴 Acima' : invGapPct < -0.1 ? '🟡 Abaixo' : '🟢 No ritmo';
    const investRow: (number | string | null)[] = ['Investimento (R$)', invAcum, invMeta, invGap, invGapPct, invProjection, invStatus];
    investRow.forEach((value, offset) => {
      const cell = ws.getCell(7, startCol + offset);
      setCellValue(cell, value, { align: offset === 0 ? 'left' : offset === 6 ? 'center' : 'right' });
      if ([1, 2, 3, 5].includes(offset)) cell.numFmt = CURRENCY_FMT;
      if (offset === 4) cell.numFmt = PCT_FMT;
    });

    const volumeAcum = objectiveVolume(objective, total);
    const volumeProjection = closedDays ? (volumeAcum / closedDays) * daysInMonth : 0;
    const volumeRow: (number | string | null)[] = [`Volume do KPI (${objective.volumeLabel})`, volumeAcum, 'sem meta', '', '', volumeProjection, 'contexto'];
    volumeRow.forEach((value, offset) => {
      const cell = ws.getCell(8, startCol + offset);
      setCellValue(cell, value, { align: offset === 0 ? 'left' : offset === 6 ? 'center' : 'right' });
      if ([1, 5].includes(offset)) cell.numFmt = INT_FMT;
    });

    const efficiency = objectiveEfficiency(objective, total);
    const efficiencyRow: (number | string | null)[] = [`Eficiência (${objective.kpiLabel})`, efficiency ?? '—', 'sem meta', '', '', '', 'contexto'];
    efficiencyRow.forEach((value, offset) => {
      const cell = ws.getCell(9, startCol + offset);
      setCellValue(cell, value, { align: offset === 0 ? 'left' : offset === 6 ? 'center' : 'right' });
      if (offset === 1 && typeof value === 'number') cell.numFmt = CURRENCY_FMT;
    });

    ws.mergeCells(10, startCol, 10, endCol);
    const reading = cockpitReading(objective, series, invProjection, budget, total);
    setCellValue(ws.getCell(10, startCol), reading, {
      fill: reading.startsWith('Sem alerta') ? REPORT_COLORS.card : REPORT_COLORS.note,
      fontColor: reading.startsWith('Sem alerta') ? REPORT_COLORS.gray : REPORT_COLORS.noteText,
      align: 'left',
    });
  });

  // Tabela diária
  ws.mergeCells(12, 1, 12, LAST_COL);
  setCellValue(ws.getCell(12, 1), 'TABELA DIÁRIA ESPECIALIZADA POR OBJETIVO', { bold: true, fill: REPORT_COLORS.slate, fontColor: REPORT_COLORS.white, align: 'center' });

  setCellValue(ws.getCell(14, 1), 'Data', { bold: true, fill: REPORT_COLORS.slate, fontColor: REPORT_COLORS.white, align: 'center' });
  setCellValue(ws.getCell(14, 2), 'Dia', { bold: true, fill: REPORT_COLORS.slate, fontColor: REPORT_COLORS.white, align: 'center' });

  OBJECTIVES.forEach((objective) => {
    const startCol = objective.startCol;
    ws.mergeCells(13, startCol, 13, startCol + BAND_WIDTH - 1);
    setCellValue(ws.getCell(13, startCol), objective.title, { bold: true, fill: objective.color, fontColor: REPORT_COLORS.white, align: 'center' });
    objective.columns.forEach((column, offset) => {
      const cell = ws.getCell(14, startCol + offset);
      setCellValue(cell, column, { bold: true, fill: REPORT_COLORS.slate, fontColor: REPORT_COLORS.white, align: 'center' });
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    });
  });
  ws.getRow(14).height = 40;

  const accumulators = new Map<MidiaFrente, Accumulators>();
  OBJECTIVES.forEach((objective) => accumulators.set(objective.frente, { spend: 0, volume: 0, impressions: 0, reach: 0, clicks: 0 }));

  for (let day = 1; day <= closedDays; day += 1) {
    const excelRow = firstDataRow + day - 1;
    const date = new Date(currentStart.getFullYear(), currentStart.getMonth(), day);
    setCellValue(ws.getCell(excelRow, 1), `${String(day).padStart(2, '0')}/${String(currentStart.getMonth() + 1).padStart(2, '0')}`, { align: 'center' });
    setCellValue(ws.getCell(excelRow, 2), DAY_LABELS[date.getDay()], { align: 'center' });

    OBJECTIVES.forEach((objective) => {
      const metrics = byDayFrente.get(`${day}|${objective.frente}`) ?? emptyDay();
      const acc = accumulators.get(objective.frente)!;
      acc.spend += metrics.spend;
      acc.volume += objectiveVolume(objective, metrics);
      acc.impressions += metrics.impressions;
      acc.reach += metrics.reach;
      acc.clicks += metrics.clicks;
      const budget = MONTHLY_BUDGETS[objective.frente];
      const metaAcum = (budget / daysInMonth) * day;
      const values = dailyValues(objective, metrics, acc, metaAcum);
      values.forEach((value, offset) => {
        const cell = ws.getCell(excelRow, objective.startCol + offset);
        const isFragile = objective.fragileConvCol === offset;
        setCellValue(cell, value, {
          align: 'right',
          fill: isFragile ? REPORT_COLORS.note : undefined,
          fontColor: isFragile ? REPORT_COLORS.noteText : undefined,
          bold: isFragile,
        });
        const fmt = numFmtFor(objective.formats[offset]);
        if (fmt && typeof value === 'number') cell.numFmt = fmt;
      });
    });
  }

  // Linha TOTAL D-1
  setCellValue(ws.getCell(totalRow, 1), 'TOTAL D-1', { bold: true, fill: REPORT_COLORS.total, align: 'left' });
  setCellValue(ws.getCell(totalRow, 2), '', { bold: true, fill: REPORT_COLORS.total });
  OBJECTIVES.forEach((objective) => {
    const total = totalsFor(seriesFor(objective.frente));
    const budget = MONTHLY_BUDGETS[objective.frente];
    const metaLast = (budget / daysInMonth) * closedDays;
    const values = totalValues(objective, total, metaLast);
    values.forEach((value, offset) => {
      const cell = ws.getCell(totalRow, objective.startCol + offset);
      setCellValue(cell, value, { bold: true, fill: REPORT_COLORS.total, align: 'right' });
      const fmt = numFmtFor(objective.formats[offset]);
      if (fmt && typeof value === 'number') cell.numFmt = fmt;
    });
  });

  // Rodapé
  ws.mergeCells(totalRow + 2, 1, totalRow + 2, LAST_COL);
  const budgetsText = OBJECTIVES.map((objective) => `${objective.title} R$ ${MONTHLY_BUDGETS[objective.frente].toLocaleString('pt-BR')}`).join(' · ');
  setCellValue(ws.getCell(totalRow + 2, 1), `Fonte: Supabase paid_media_metrics, leitura D-1 de ${MONTHS_PT[currentStart.getMonth()]}/${currentStart.getFullYear()} (dias 1–${closedDays}). Budgets mensais: ${budgetsText}. Meta acumulada = budget linear ÷ dias do mês.`, { fill: REPORT_COLORS.note, fontColor: REPORT_COLORS.noteText, align: 'left' });
  ws.getCell(totalRow + 2, 1).font = { name: 'Arial', italic: true, color: { argb: REPORT_COLORS.noteText }, size: 8 };

  ws.getColumn(1).width = 11;
  ws.getColumn(2).width = 6;
  for (let column = 3; column <= LAST_COL; column += 1) {
    ws.getColumn(column).width = 12;
  }
  ws.eachRow((excelRow) => { excelRow.height = Math.max(excelRow.height ?? 18, 18); });
}
