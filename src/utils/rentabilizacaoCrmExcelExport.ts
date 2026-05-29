import type { BorderStyle, Cell, Workbook, Worksheet } from 'exceljs';
import { supabase } from '../services/supabaseClient';

// ── Tipos internos ─────────────────────────────────────────────────────────────

type RawRow = Record<string, unknown>;

type RntMetrics = {
  entregues: number;
  abertos: number;
  cliques: number;
  propostas: number;
  aprovados: number;
  contratacoes: number;  // Cartões Gerados → para seguros/ativação = conversões/contratações
};

type RntJourneyRow = {
  produto: string;
  jornada: string;
  activity: string;
  bu: string;
  canal: string;
  linhas: number;
} & RntMetrics;

type AuditRow = {
  motivo: string;
  bu: string;
  jornada: string;
  canal: string;
  linhas: number;
} & RntMetrics;

// ── Mapeamento de produto via journey name ─────────────────────────────────────

// Normalização de período: ABRI26 → ABR26, MAIO26 → MAI26
const PERIODO_NORM: Record<string, string> = {
  ABRI26: 'ABR26', MAIO26: 'MAI26',
  ABRI25: 'ABR25', MAIO25: 'MAI25',
};

// Nomes legíveis de produto derivados do journey name
const PRODUCT_OVERRIDES: Record<string, string> = {
  'SEGURO MULHER': 'Seguro Mulher',
  'SEGURO RESIDENCIA24H': 'Seguro Residência 24h',
  'SEGURO RESIDENCIA': 'Seguro Residência',
  'NA ATIVACAO': 'Ativação CRM',
  'ATIVACAO': 'Ativação',
  'REATIVACAO': 'Reativação',
  'CROSS SELL': 'Cross-sell',
};

/**
 * Extrai informação de produto e período de um journey name no padrão:
 * JOR_RENTABILIZACAO_{BU}_{...PRODUTO...}_{PERÍODO}
 */
function parseJourney(jornada: string): { produto: string; periodo: string } {
  const j = jornada.toUpperCase().trim();

  // Padrão canônico: JOR_RENTABILIZACAO_BU_...produto..._PERÍODO
  // Período: 3-5 letras + 2 dígitos (ex: MAR26, ABR26, MAIO26, ABRI26)
  const match = j.match(/^JOR_RENTABILIZACAO_[A-Z0-9]+_(.+?)_([A-Z]{2,5}\d{2})$/);
  if (match) {
    const productRaw = match[1];
    const periodRaw = PERIODO_NORM[match[2]] ?? match[2];
    const productKey = productRaw.replace(/_/g, ' ');
    const product = PRODUCT_OVERRIDES[productKey] ?? titleCase(productKey.toLowerCase());
    return { produto: product, periodo: formatPeriodo(periodRaw) };
  }

  // Fallback: usar o journey name limpo
  return { produto: titleCase(j.replace(/^JOR_RENTABILIZACAO_/, '').replace(/_/g, ' ').toLowerCase()), periodo: '' };
}

function titleCase(str: string): string {
  return str.replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatPeriodo(raw: string): string {
  const MESES: Record<string, string> = {
    JAN: 'Jan', FEV: 'Fev', MAR: 'Mar', ABR: 'Abr', MAI: 'Mai',
    JUN: 'Jun', JUL: 'Jul', AGO: 'Ago', SET: 'Set', OUT: 'Out', NOV: 'Nov', DEZ: 'Dez',
  };
  const m = raw.match(/^([A-Z]{2,3})(\d{2})$/);
  if (m) return `${MESES[m[1]] ?? m[1]} ${m[2]}`;
  return raw;
}

// ── Helpers numéricos e de data ────────────────────────────────────────────────

function asInt(value: unknown): number {
  if (value === null || value === undefined || value === '') return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : 0;
}

function isoDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function parseIsoDate(value: string): Date {
  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  return new Date(year, month - 1, day);
}

function parseRowDate(value: unknown): Date {
  if (!value) throw new Error('missing Data de Disparo');
  return parseIsoDate(String(value).split('T')[0]);
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function allDates(start: Date, end: Date): Date[] {
  const dates: Date[] = [];
  for (let d = new Date(start); d <= end; d = addDays(d, 1)) dates.push(new Date(d));
  return dates;
}

const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
const METRIC_FIELDS: Array<keyof RntMetrics> = ['entregues', 'abertos', 'cliques', 'propostas', 'aprovados', 'contratacoes'];

// ── Cores ─────────────────────────────────────────────────────────────────────

const COLORS = {
  headerMain:    '1E293B',   // slate-800
  headerAlt:     '334155',   // slate-700
  seguroMulher:  '9D174D',   // rose-800
  seguroRes:     '1E40AF',   // blue-800
  ativacao:      '065F46',   // emerald-800
  outro:         '374151',   // gray-700
  emailFill:     'DBEAFE',
  wppFill:       'D1FAE5',
  smsFill:       'FEF3C7',
  pushFill:      'FFEDD5',
  total:         'F0FDF4',
  zebra:         'F8FAFC',
  audit:         '1D4ED8',
  auditSub:      'DBEAFE',
};

function productHeaderColor(produto: string): string {
  const p = produto.toLowerCase();
  if (p.includes('mulher')) return COLORS.seguroMulher;
  if (p.includes('resid')) return COLORS.seguroRes;
  if (p.includes('ativa')) return COLORS.ativacao;
  return COLORS.outro;
}

function canalFill(canal: string): string {
  const c = canal.toUpperCase();
  if (c.includes('MAIL')) return COLORS.emailFill;
  if (c.includes('WPP') || c.includes('WHATSAPP')) return COLORS.wppFill;
  if (c.includes('SMS')) return COLORS.smsFill;
  if (c.includes('PUSH')) return COLORS.pushFill;
  return 'FFFFFF';
}

// ── Helpers Excel ─────────────────────────────────────────────────────────────

function setCell(
  cell: Cell,
  value?: string | number | object,
  options: { bold?: boolean; fontColor?: string; fillColor?: string; align?: 'left' | 'center' | 'right'; italic?: boolean; size?: number } = {},
): void {
  if (value !== undefined) cell.value = value as Cell['value'];
  cell.font = {
    name: 'Calibri', size: options.size ?? 10,
    bold: options.bold, italic: options.italic,
    color: { argb: `FF${options.fontColor ?? '000000'}` },
  };
  if (options.fillColor) {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${options.fillColor}` } };
  }
  cell.alignment = { horizontal: options.align ?? 'center', vertical: 'middle', wrapText: true };
}

function border(ws: Worksheet, row: number, maxCol: number, topStyle: BorderStyle = 'thin'): void {
  for (let c = 1; c <= maxCol; c++) {
    ws.getCell(row, c).border = {
      top:    { style: topStyle, color: { argb: 'FFCBD5E1' } },
      bottom: { style: 'thin',   color: { argb: 'FFE2E8F0' } },
      left:   { style: 'thin',   color: { argb: 'FFE2E8F0' } },
      right:  { style: 'thin',   color: { argb: 'FFE2E8F0' } },
    };
  }
}

function colLetter(col: number): string {
  let n = col; let s = '';
  while (n > 0) { const mod = (n - 1) % 26; s = String.fromCharCode(65 + mod) + s; n = Math.floor((n - mod) / 26); }
  return s;
}

// ── Chave de índice ────────────────────────────────────────────────────────────

const SEP = '';

function idxKey(dateStr: string, produto: string, canal: string): string {
  return [dateStr, produto, canal].join(SEP);
}

// ── Classificação ─────────────────────────────────────────────────────────────

/** Retorna null para linhas que devem ir para Auditoria */
function classify(row: RawRow): { produto: string; periodo: string } | null {
  const jornada = String(row['jornada'] ?? '');
  if (!jornada.toUpperCase().startsWith('JOR_RENTABILIZACAO')) {
    return null;  // vai para Auditoria
  }
  return parseJourney(jornada);
}

// ── Indexação das linhas ───────────────────────────────────────────────────────

type IndexResult = {
  idx: Map<string, RntMetrics>;
  produtoOrder: string[];
  auditRows: AuditRow[];
  journeyRows: RntJourneyRow[];
  summary: { source: number; mapped: number; audit: number };
};

function buildIndexes(rows: RawRow[], start: Date, end: Date): IndexResult {
  const idx = new Map<string, RntMetrics>();
  const produtoSeen = new Map<string, number>(); // produto → first date seen (for ordering)
  const auditMap = new Map<string, AuditRow>();
  const journeyMap = new Map<string, RntJourneyRow>();
  const summary = { source: 0, mapped: 0, audit: 0 };

  for (const row of rows) {
    let rowDate: Date;
    try { rowDate = parseRowDate(row['Data de Disparo']); } catch { continue; }
    if (rowDate < start || rowDate > end) continue;
    summary.source++;

    const canal = normalizeCanal(row['Canal']);
    const metrics: RntMetrics = {
      entregues:     asInt(row['Base Acionável']),
      abertos:       asInt(row['Abertura']),
      cliques:       asInt(row['Cliques']),
      propostas:     asInt(row['Propostas']),
      aprovados:     asInt(row['Aprovados']),
      contratacoes:  asInt(row['Cartões Gerados']),
    };

    const classified = classify(row);
    if (classified) {
      const { produto } = classified;
      const ds = isoDate(rowDate);
      const key = idxKey(ds, produto, canal);
      const cur = idx.get(key) ?? { entregues: 0, abertos: 0, cliques: 0, propostas: 0, aprovados: 0, contratacoes: 0 };
      METRIC_FIELDS.forEach((f) => { cur[f] += metrics[f]; });
      idx.set(key, cur);

      if (!produtoSeen.has(produto)) produtoSeen.set(produto, rowDate.getTime());

      // Journey map
      const jornada = String(row['jornada'] ?? '');
      const activity = String(row['Activity name / Taxonomia'] ?? '');
      const bu = String(row['BU'] ?? '');
      const jKey = [produto, jornada, activity, bu, canal].join(SEP);
      if (!journeyMap.has(jKey)) {
        journeyMap.set(jKey, { produto, jornada, activity, bu, canal, linhas: 0, entregues: 0, abertos: 0, cliques: 0, propostas: 0, aprovados: 0, contratacoes: 0 });
      }
      const jr = journeyMap.get(jKey)!;
      jr.linhas++;
      METRIC_FIELDS.forEach((f) => { jr[f] += metrics[f]; });
      summary.mapped++;
    } else {
      const jornada = String(row['jornada'] ?? '');
      const bu = String(row['BU'] ?? '');
      const motivo = `Fora do padrão JOR_RENTABILIZACAO: ${jornada || 'sem jornada'}`;
      const aKey = [motivo, bu, canal].join(SEP);
      if (!auditMap.has(aKey)) {
        auditMap.set(aKey, { motivo, bu, jornada, canal, linhas: 0, entregues: 0, abertos: 0, cliques: 0, propostas: 0, aprovados: 0, contratacoes: 0 });
      }
      const ar = auditMap.get(aKey)!;
      ar.linhas++;
      METRIC_FIELDS.forEach((f) => { ar[f] += metrics[f]; });
      summary.audit++;
    }
  }

  // Ordenar produtos por data do primeiro disparo
  const produtoOrder = [...produtoSeen.entries()].sort((a, b) => a[1] - b[1]).map(([p]) => p);

  return {
    idx,
    produtoOrder,
    auditRows: [...auditMap.values()].sort((a, b) => a.motivo.localeCompare(b.motivo)),
    journeyRows: [...journeyMap.values()].sort((a, b) =>
      `${a.produto}|${a.jornada}|${a.canal}`.localeCompare(`${b.produto}|${b.jornada}|${b.canal}`)
    ),
    summary,
  };
}

function normalizeCanal(value: unknown): string {
  const raw = String(value ?? '').toUpperCase();
  if (raw.includes('MAIL')) return 'E-MAIL';
  if (raw.includes('WHATSAPP') || raw === 'WPP') return 'WPP';
  if (raw.includes('SMS')) return 'SMS';
  if (raw.includes('PUSH')) return 'PUSH';
  return raw.trim() || 'N/A';
}

// ── Escrita de seção no worksheet ─────────────────────────────────────────────

function writeSection(
  ws: Worksheet,
  startRow: number,
  produto: string,
  idx: Map<string, RntMetrics>,
  dates: Date[],
): number {
  const color = productHeaderColor(produto);
  const numMetricCols = 6;  // Entregues | Abertos | Cliques | Propostas | Aprovados | Contratações
  const numTaxCols = 3;     // Tx Entrega | Tx Abertura | Tx Conv
  const maxCol = 2 + numMetricCols + numTaxCols; // Data | Dia | 6 métricas | 3 taxas = 11

  // Header linha 1: título do produto (merge)
  ws.mergeCells(startRow, 1, startRow, maxCol);
  setCell(ws.getCell(startRow, 1), produto.toUpperCase(), { bold: true, fontColor: 'FFFFFF', fillColor: color, align: 'left', size: 11 });
  border(ws, startRow, maxCol, 'medium');

  // Header linha 2: nomes das colunas
  const headers = ['Data', 'Dia', 'Entregues', 'Abertos', 'Cliques', 'Propostas', 'Aprovados', 'Contratações', 'Tx Entrega', 'Tx Abertura', 'Tx Conv'];
  headers.forEach((h, i) => {
    setCell(ws.getCell(startRow + 1, i + 1), h, { bold: true, fontColor: 'FFFFFF', fillColor: color });
  });
  border(ws, startRow + 1, maxCol, 'medium');

  const dataStart = startRow + 2;
  let rowNum = dataStart;
  const today = new Date(); today.setHours(0, 0, 0, 0);

  for (const day of dates) {
    const ds = isoDate(day);
    // Coletar canais únicos para este produto nesta data
    const canais = new Set<string>();
    idx.forEach((_, key) => {
      const [kDate, kProd] = key.split(SEP);
      if (kDate === ds && kProd === produto) canais.add(key.split(SEP)[2]);
    });

    const rowsToWrite = canais.size > 0 ? [...canais].sort() : [''];
    const isWeekend = day.getDay() === 0 || day.getDay() === 6;
    const zebra = rowNum % 2 === 0 ? COLORS.zebra : 'FFFFFF';

    for (const canal of rowsToWrite) {
      const fill = canal ? canalFill(canal) : zebra;
      const metrics = canal ? idx.get(idxKey(ds, produto, canal)) : undefined;

      // Limpeza de linha
      for (let c = 1; c <= maxCol; c++) setCell(ws.getCell(rowNum, c), '', { fillColor: isWeekend ? 'F1F5F9' : zebra });

      // Data e dia
      setCell(ws.getCell(rowNum, 1), day.toLocaleDateString('pt-BR'), { italic: isWeekend, fillColor: isWeekend ? 'E2E8F0' : zebra, align: 'center' });
      setCell(ws.getCell(rowNum, 2), DAY_NAMES[day.getDay()], { italic: isWeekend, fillColor: isWeekend ? 'E2E8F0' : zebra, align: 'center' });

      if (metrics && canal) {
        const r = rowNum;
        // Canal já está no preenchimento — mostrar no título da data
        setCell(ws.getCell(rowNum, 1), `${day.toLocaleDateString('pt-BR')} · ${canal}`, { italic: isWeekend, fillColor: fill, align: 'left' });
        setCell(ws.getCell(rowNum, 2), DAY_NAMES[day.getDay()], { italic: isWeekend, fillColor: fill });
        setCell(ws.getCell(rowNum, 3), metrics.entregues || '', { fillColor: fill, align: 'right' });
        setCell(ws.getCell(rowNum, 4), metrics.abertos   || '', { fillColor: fill, align: 'right' });
        setCell(ws.getCell(rowNum, 5), metrics.cliques   || '', { fillColor: fill, align: 'right' });
        setCell(ws.getCell(rowNum, 6), metrics.propostas || '', { fillColor: fill, align: 'right' });
        setCell(ws.getCell(rowNum, 7), metrics.aprovados || '', { fillColor: fill, align: 'right' });
        setCell(ws.getCell(rowNum, 8), metrics.contratacoes || '', { fillColor: fill, align: 'right' });

        // Fórmulas de taxa
        const C = colLetter(3); const D = colLetter(4); const I = colLetter(9);
        const H = colLetter(8);
        ws.getCell(r, 9).value  = { formula: `=IF(AND(${C}${r}>0),${D}${r}/${C}${r},"")` };
        ws.getCell(r, 10).value = { formula: `=IF(AND(${D}${r}>0,E${r}>0),E${r}/${D}${r},"")` };
        ws.getCell(r, 11).value = { formula: `=IF(AND(${C}${r}>0,${H}${r}>0),${H}${r}/${C}${r},"")` };
        [9, 10, 11].forEach((c) => {
          ws.getCell(r, c).numFmt = '0.0%';
          ws.getCell(r, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${fill}` } };
        });
        [3, 4, 5, 6, 7, 8].forEach((c) => { ws.getCell(r, c).numFmt = '#,##0'; });
      }

      border(ws, rowNum, maxCol);
      rowNum++;
    }
  }

  // Linha de totais
  const totalRow = rowNum;
  for (let c = 1; c <= maxCol; c++) setCell(ws.getCell(totalRow, c), '', { bold: true, fillColor: COLORS.total });
  setCell(ws.getCell(totalRow, 1), 'TOTAL', { bold: true, fillColor: COLORS.total, align: 'left' });
  [3, 4, 5, 6, 7, 8].forEach((c) => {
    const letter = colLetter(c);
    ws.getCell(totalRow, c).value = { formula: `=SUM(${letter}${dataStart}:${letter}${totalRow - 1})` };
    ws.getCell(totalRow, c).numFmt = '#,##0';
    ws.getCell(totalRow, c).font = { bold: true, name: 'Calibri', size: 10 };
    ws.getCell(totalRow, c).alignment = { horizontal: 'right', vertical: 'middle' };
    ws.getCell(totalRow, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${COLORS.total}` } };
  });
  border(ws, totalRow, maxCol, 'medium');

  return totalRow + 3; // 2 linhas de gap entre seções
}

// ── Aba Auditoria ─────────────────────────────────────────────────────────────

function writeAuditSheet(wb: Workbook, auditRows: AuditRow[], journeyRows: RntJourneyRow[], summary: IndexResult['summary']): void {
  const ws = wb.addWorksheet('Auditoria', { views: [{ state: 'frozen', ySplit: 8, showGridLines: false }] });

  setCell(ws.getCell('A1'), 'Auditoria — Rentabilização CRM', { bold: true, fontColor: 'FFFFFF', fillColor: COLORS.audit, align: 'left', size: 12 });
  ws.mergeCells('A1:K1');

  // Contadores globais
  [
    ['Linhas fonte no período', summary.source],
    ['Linhas mapeadas (JOR_RENTABILIZACAO_*)', summary.mapped],
    ['Linhas fora do mapeamento', summary.audit],
  ].forEach(([label, value], i) => {
    const row = i + 3;
    setCell(ws.getCell(row, 1), String(label), { bold: true, fillColor: COLORS.auditSub, align: 'left' });
    setCell(ws.getCell(row, 2), Number(value), { fillColor: COLORS.auditSub });
  });

  // Resumo por produto
  const prodSummary = new Map<string, RntMetrics & { linhas: number }>();
  journeyRows.forEach((jr) => {
    const cur = prodSummary.get(jr.produto) ?? { linhas: 0, entregues: 0, abertos: 0, cliques: 0, propostas: 0, aprovados: 0, contratacoes: 0 };
    cur.linhas += jr.linhas;
    METRIC_FIELDS.forEach((f) => { cur[f] += jr[f]; });
    prodSummary.set(jr.produto, cur);
  });

  const prodStart = 7;
  setCell(ws.getCell(prodStart, 1), 'Resumo por produto', { bold: true, fontColor: 'FFFFFF', fillColor: COLORS.audit, align: 'left' });
  ws.mergeCells(prodStart, 1, prodStart, 9);
  ['Produto', 'Linhas', 'Entregues', 'Abertos', 'Cliques', 'Propostas', 'Aprovados', 'Contratações'].forEach((h, i) => {
    setCell(ws.getCell(prodStart + 1, i + 1), h, { bold: true, fontColor: 'FFFFFF', fillColor: COLORS.audit });
  });
  let pr = prodStart + 2;
  [...prodSummary.entries()].sort(([a], [b]) => a.localeCompare(b)).forEach(([prod, totals]) => {
    setCell(ws.getCell(pr, 1), prod, { align: 'left' });
    ['linhas', ...METRIC_FIELDS].forEach((f, i) => {
      setCell(ws.getCell(pr, 2 + i), totals[f as keyof typeof totals] as number);
    });
    pr++;
  });

  // Linhas fora do mapeamento
  if (auditRows.length > 0) {
    const auditStart = pr + 2;
    setCell(ws.getCell(auditStart, 1), 'Linhas fora do padrão JOR_RENTABILIZACAO_*', { bold: true, fontColor: 'FFFFFF', fillColor: COLORS.audit, align: 'left' });
    ws.mergeCells(auditStart, 1, auditStart, 9);
    ['Motivo', 'BU', 'Jornada', 'Canal', 'Linhas', 'Entregues', 'Abertos', 'Propostas', 'Contratações'].forEach((h, i) => {
      setCell(ws.getCell(auditStart + 1, i + 1), h, { bold: true, fontColor: 'FFFFFF', fillColor: COLORS.audit });
    });
    auditRows.forEach((ar, idx) => {
      const row = auditStart + 2 + idx;
      [ar.motivo, ar.bu, ar.jornada, ar.canal, ar.linhas, ar.entregues, ar.abertos, ar.propostas, ar.contratacoes]
        .forEach((v, i) => setCell(ws.getCell(row, i + 1), v, { align: i < 4 ? 'left' : 'center' }));
    });
  }

  // Mapa de jornadas
  const jornStart = pr + 4 + (auditRows.length > 0 ? auditRows.length + 4 : 0);
  setCell(ws.getCell(jornStart, 1), 'Mapa de jornadas e atividades', { bold: true, fontColor: 'FFFFFF', fillColor: COLORS.audit, align: 'left' });
  ws.mergeCells(jornStart, 1, jornStart, 11);
  ['Produto', 'Jornada', 'Activity name / Taxonomia', 'BU', 'Canal', 'Linhas', 'Entregues', 'Abertos', 'Cliques', 'Aprovados', 'Contratações'].forEach((h, i) => {
    setCell(ws.getCell(jornStart + 1, i + 1), h, { bold: true, fontColor: 'FFFFFF', fillColor: COLORS.audit });
  });
  journeyRows.forEach((jr, i) => {
    const row = jornStart + 2 + i;
    [jr.produto, jr.jornada, jr.activity, jr.bu, jr.canal, jr.linhas, jr.entregues, jr.abertos, jr.cliques, jr.aprovados, jr.contratacoes]
      .forEach((v, c) => setCell(ws.getCell(row, c + 1), v, { align: c < 5 ? 'left' : 'center' }));
  });

  [30, 50, 60, 14, 12, 10, 12, 10, 10, 12, 14].forEach((w, i) => { ws.getColumn(i + 1).width = w; });
}

// ── Workbook principal ────────────────────────────────────────────────────────

function buildWorkbook(ExcelJSRuntime: { Workbook: new () => Workbook }, rows: RawRow[], start: Date, end: Date): Workbook {
  const { idx, produtoOrder, auditRows, journeyRows, summary } = buildIndexes(rows, start, end);
  const dates = allDates(start, end);
  const wb = new ExcelJSRuntime.Workbook();
  wb.creator = 'GaaS AFINZ — Rentabilização';
  wb.created = new Date();

  const ws = wb.addWorksheet('Rentabilização CRM', {
    views: [{ state: 'frozen', xSplit: 2, ySplit: 2, topLeftCell: 'C3', activeCell: 'C3', showGridLines: false }],
  });

  let nextRow = 1;
  for (const produto of produtoOrder) {
    nextRow = writeSection(ws, nextRow, produto, idx, dates);
  }

  // Larguras de colunas
  ws.getColumn(1).width = 22;  // Data · Canal
  ws.getColumn(2).width = 6;   // Dia
  ws.getColumn(3).width = 12;  // Entregues
  ws.getColumn(4).width = 10;  // Abertos
  ws.getColumn(5).width = 10;  // Cliques
  ws.getColumn(6).width = 12;  // Propostas
  ws.getColumn(7).width = 12;  // Aprovados
  ws.getColumn(8).width = 14;  // Contratações
  ws.getColumn(9).width = 11;  // Tx Entrega
  ws.getColumn(10).width = 12; // Tx Abertura
  ws.getColumn(11).width = 10; // Tx Conv

  writeAuditSheet(wb, auditRows, journeyRows, summary);
  return wb;
}

// ── Fetch Supabase ────────────────────────────────────────────────────────────

async function fetchRntRows(start: Date, end: Date): Promise<RawRow[]> {
  const rows: RawRow[] = [];
  const pageSize = 1000;
  const exclusiveEnd = addDays(end, 1);

  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabase
      .from('rentabilizacao_activities')
      .select('*')
      .gte('Data de Disparo', isoDate(start))
      .lt('Data de Disparo', isoDate(exclusiveEnd))
      .order('Data de Disparo', { ascending: true })
      .order('jornada', { ascending: true })
      .range(offset, offset + pageSize - 1);

    if (error) throw error;
    rows.push(...((data ?? []) as RawRow[]));
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

// ── Export público ────────────────────────────────────────────────────────────

export async function exportRentabilizacaoCrmXlsx(
  start: Date,
  end: Date,
): Promise<{ rows: number; filename: string }> {
  const rawRows = await fetchRntRows(start, end);
  const ExcelJSModule = await import('exceljs');
  const workbook = buildWorkbook(ExcelJSModule.default, rawRows, start, end);
  const buffer = await workbook.xlsx.writeBuffer();
  const filename = `rentabilizacao_crm_${isoDate(start).replace(/-/g, '')}_${isoDate(end).replace(/-/g, '')}.xlsx`;
  downloadBuffer(buffer, filename);
  return { rows: rawRows.length, filename };
}

export function getCurrentMonthRange(): { start: Date; end: Date } {
  const now = new Date();
  return {
    start: new Date(now.getFullYear(), now.getMonth(), 1),
    end:   new Date(now.getFullYear(), now.getMonth() + 1, 0),
  };
}
