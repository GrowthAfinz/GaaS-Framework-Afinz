import type { BorderStyle, Cell, CellFormulaValue, Workbook, Worksheet } from 'exceljs';
import { supabase } from '../services/supabaseClient';

type RawActivity = Record<string, any>;
type Metrics = {
  entregues: number;
  emitidos: number;
  aprovados: number;
  propostas: number;
  linhas_origem?: number;
};

type AuditRow = {
  motivo: string;
  bu: string;
  parceiro: string;
  segmento: string;
  etapa: string;
  canal_raw: string;
  canal: string;
} & Metrics & { linhas: number };

type JourneyRow = {
  status_mapeamento: string;
  secao: string;
  bloco: string;
  bu: string;
  parceiro: string;
  segmento: string;
  etapa: string;
  canal: string;
  jornada: string;
  taxonomia: string;
} & Metrics & { linhas: number };

type BuildIndexesResult = {
  idx: Map<string, Metrics>;
  auditRows: AuditRow[];
  journeyRows: JourneyRow[];
  summary: {
    source_rows: number;
    mapped_source_rows: number;
    audit_source_rows: number;
  };
};

const SECTIONS: Array<[string, string[]]> = [
  ['B2C', ['TOPO DE FUNIL B2C', 'REPESCAGEM B2C', 'UPGRADE B2C', 'LEADS PARCEIROS B2C', 'CARRINHO ABANDONADO B2C']],
  ['PLURIX', ['TOPO DE FUNIL PLURIX', 'REPESCAGEM PLURIX', 'UPGRADE PLURIX', 'RECENCIA PLURIX']],
  ['DIA', ['TOPO DE FUNIL DIA', 'REPESCAGEM DIA']],
  ['BEM BARATO', ['TOPO DE FUNIL BB', 'REPESCAGEM BB']],
];

const CHANNEL_ORDER: Record<string, number> = { 'E-MAIL': 0, SMS: 1, WPP: 2 };
const NUMERIC_FIELDS: Array<keyof Metrics> = ['entregues', 'emitidos', 'aprovados', 'propostas'];
const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

const COLORS = {
  headerGray: 'D9D9D9',
  sectionDark: '17365D',
  dataB2c: '1F4E79',
  dataB2cSub: '2F5496',
  topoB2c: '1F6B3A',
  topo: '1F4E79',
  repescagem: '2E7D32',
  upgrade: 'B8860B',
  leads: '00695C',
  recencia: '6A1B9A',
  emailFill: 'DCE6F1',
  emailFont: '1F4E79',
  wppFill: 'E2EFDA',
  wppFont: '375623',
  smsFill: 'FFF2CC',
  smsFont: '7F6000',
  zebra: 'F5F5F5',
  weekend: 'E8E8E8',
  manualB2c: 'EBF3FF',
  total: 'D9EAD3',
  auditHeader: '1F4E79',
  auditSubheader: 'D9EAF7',
};

const get = (row: RawActivity, key: string): any => row[key];
const text = (value: any): string => String(value ?? '');

function isoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseIsoDate(value: string): Date {
  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  return new Date(year, month - 1, day);
}

function parseRowDate(value: any): Date {
  if (!value) throw new Error('missing Data de Disparo');
  return parseIsoDate(String(value).split('T')[0].slice(0, 10));
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function allDates(start: Date, end: Date): Date[] {
  const dates: Date[] = [];
  for (let date = new Date(start); date <= end; date = addDays(date, 1)) {
    dates.push(new Date(date));
  }
  return dates;
}

function asInt(value: any): number {
  if (value === null || value === undefined || value === '') return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : 0;
}

function normalizeChannel(value: any): string {
  const raw = String(value ?? '').toUpperCase();
  if (raw.includes('MAIL')) return 'E-MAIL';
  if (raw.includes('WHATSAPP') || raw === 'WPP') return 'WPP';
  if (raw.includes('SMS')) return 'SMS';
  return raw.trim() || 'N/A';
}

function classify(row: RawActivity): [string, string] | null {
  const bu = get(row, 'BU');
  const parceiro = get(row, 'Parceiro');
  const segmento = get(row, 'Segmento');
  const etapa = get(row, 'Etapa de aquisição') ?? get(row, 'Etapa de aquisiÃ§Ã£o');

  if (segmento === 'Leads_Parceiros') return ['B2C', 'LEADS PARCEIROS B2C'];
  if (bu === 'B2C' && parceiro === 'Serasa' && segmento === 'Base_Proprietaria' && etapa === 'Meio_de_Funil') return ['B2C', 'LEADS PARCEIROS B2C'];
  if (bu === 'B2C' && parceiro === 'Proprietaria' && segmento === 'Base_Proprietaria' && etapa === 'Aquisicao') return ['B2C', 'TOPO DE FUNIL B2C'];
  if (bu === 'B2C' && parceiro === 'Proprietaria' && segmento === 'Negados' && etapa === 'Meio_de_Funil') return ['B2C', 'REPESCAGEM B2C'];
  if (bu === 'B2C' && parceiro === 'Proprietaria' && segmento === 'Aprovados_nao_convertidos' && etapa === 'Meio_de_Funil') return ['B2C', 'UPGRADE B2C'];
  if (bu === 'B2C' && ['N/A', 'Serasa'].includes(parceiro) && segmento === 'Abandonados') return ['B2C', 'CARRINHO ABANDONADO B2C'];

  if (bu === 'Plurix' && parceiro === 'N/A' && segmento === 'CRM' && etapa === 'Aquisicao') return ['PLURIX', 'TOPO DE FUNIL PLURIX'];
  if (bu === 'Plurix' && parceiro === 'N/A' && segmento === 'Negados' && etapa === 'Meio_de_Funil') return ['PLURIX', 'REPESCAGEM PLURIX'];
  if (bu === 'Plurix' && parceiro === 'N/A' && segmento === 'Aprovados_nao_convertidos' && etapa === 'Meio_de_Funil') return ['PLURIX', 'UPGRADE PLURIX'];
  if (bu === 'Plurix' && parceiro === 'N/A' && segmento === 'Abandonados') return ['PLURIX', 'UPGRADE PLURIX'];
  if (bu === 'Plurix' && parceiro === 'N/A' && segmento === 'Recencia de Compra') return ['PLURIX', 'RECENCIA PLURIX'];

  if (bu === 'B2B2C' && parceiro === 'Dia' && etapa === 'Aquisicao') return ['DIA', 'TOPO DE FUNIL DIA'];
  if (bu === 'B2B2C' && parceiro === 'Dia' && etapa === 'Meio_de_Funil') return ['DIA', 'REPESCAGEM DIA'];

  if (bu === 'B2B2C' && parceiro === 'Bem Barato' && ['CRM', 'Recencia de Compra'].includes(segmento) && etapa === 'Aquisicao') return ['BEM BARATO', 'TOPO DE FUNIL BB'];
  if (bu === 'B2B2C' && parceiro === 'Bem Barato' && ['Negados', 'Aprovados_nao_convertidos'].includes(segmento) && etapa === 'Meio_de_Funil') return ['BEM BARATO', 'REPESCAGEM BB'];

  return null;
}

function auditReason(row: RawActivity): string {
  if (get(row, 'BU') === 'Seguros') return 'Fora do escopo: Seguros/Rentabilizacao';
  if (get(row, 'Segmento') === 'Abandonados') return 'Sem bloco definido: Abandonados';
  return 'Sem regra de mapeamento';
}

function idxKey(date: string, secao: string, bloco: string, canal: string): string {
  return [date, secao, bloco, canal].join('\u001F');
}

function buildIndexes(rows: RawActivity[], start: Date, end: Date): BuildIndexesResult {
  const idx = new Map<string, Metrics>();
  const audit = new Map<string, AuditRow>();
  const journeyMap = new Map<string, JourneyRow>();
  const summary = { source_rows: 0, mapped_source_rows: 0, audit_source_rows: 0 };

  for (const row of rows) {
    const rowDate = parseRowDate(get(row, 'Data de Disparo'));
    if (rowDate < start || rowDate > end) continue;
    summary.source_rows += 1;

    const canal = normalizeChannel(get(row, 'Canal'));
    const metrics: Metrics = {
      entregues: asInt(get(row, 'Base Acionável') ?? get(row, 'Base AcionÃ¡vel')),
      emitidos: asInt(get(row, 'Cartões Gerados') ?? get(row, 'CartÃµes Gerados')),
      aprovados: asInt(get(row, 'Aprovados')),
      propostas: asInt(get(row, 'Propostas')),
    };
    const mapped = classify(row);
    const destino = mapped ? 'MAPEADO' : auditReason(row);
    const secao = mapped?.[0] ?? '';
    const bloco = mapped?.[1] ?? '';
    const etapa = text(get(row, 'Etapa de aquisição') ?? get(row, 'Etapa de aquisiÃ§Ã£o'));
    const journeyKey = [
      destino,
      secao,
      bloco,
      text(get(row, 'BU')),
      text(get(row, 'Parceiro')),
      text(get(row, 'Segmento')),
      etapa,
      canal,
      text(get(row, 'jornada') ?? get(row, 'Jornada')),
      text(get(row, 'Activity name / Taxonomia')),
    ].join('\u001F');

    if (!journeyMap.has(journeyKey)) {
      journeyMap.set(journeyKey, {
        status_mapeamento: destino,
        secao,
        bloco,
        bu: text(get(row, 'BU')),
        parceiro: text(get(row, 'Parceiro')),
        segmento: text(get(row, 'Segmento')),
        etapa,
        canal,
        jornada: text(get(row, 'jornada') ?? get(row, 'Jornada')),
        taxonomia: text(get(row, 'Activity name / Taxonomia')),
        linhas: 0,
        entregues: 0,
        emitidos: 0,
        aprovados: 0,
        propostas: 0,
      });
    }
    const journey = journeyMap.get(journeyKey)!;
    journey.linhas += 1;
    NUMERIC_FIELDS.forEach((field) => { journey[field] += metrics[field]; });

    if (mapped) {
      const key = idxKey(isoDate(rowDate), secao, bloco, canal);
      const current = idx.get(key) ?? { entregues: 0, emitidos: 0, aprovados: 0, propostas: 0, linhas_origem: 0 };
      NUMERIC_FIELDS.forEach((field) => { current[field] += metrics[field]; });
      current.linhas_origem = (current.linhas_origem ?? 0) + 1;
      idx.set(key, current);
      summary.mapped_source_rows += 1;
    } else {
      const auditKey = [
        auditReason(row),
        text(get(row, 'BU')),
        text(get(row, 'Parceiro')),
        text(get(row, 'Segmento')),
        etapa,
        text(get(row, 'Canal')),
        canal,
      ].join('\u001F');
      if (!audit.has(auditKey)) {
        audit.set(auditKey, {
          motivo: auditReason(row),
          bu: text(get(row, 'BU')),
          parceiro: text(get(row, 'Parceiro')),
          segmento: text(get(row, 'Segmento')),
          etapa,
          canal_raw: text(get(row, 'Canal')),
          canal,
          linhas: 0,
          entregues: 0,
          emitidos: 0,
          aprovados: 0,
          propostas: 0,
        });
      }
      const auditRow = audit.get(auditKey)!;
      auditRow.linhas += 1;
      NUMERIC_FIELDS.forEach((field) => { auditRow[field] += metrics[field]; });
      summary.audit_source_rows += 1;
    }
  }

  return {
    idx,
    auditRows: [...audit.values()].sort((a, b) => [a.motivo, a.bu, a.parceiro, a.segmento, a.etapa, a.canal].join('|').localeCompare([b.motivo, b.bu, b.parceiro, b.segmento, b.etapa, b.canal].join('|'))),
    journeyRows: [...journeyMap.values()].sort((a, b) => [a.status_mapeamento, a.secao, a.bloco, a.bu, a.parceiro, a.segmento, a.etapa, a.canal, a.jornada, a.taxonomia].join('|').localeCompare([b.status_mapeamento, b.secao, b.bloco, b.bu, b.parceiro, b.segmento, b.etapa, b.canal, b.jornada, b.taxonomia].join('|'))),
    summary,
  };
}

function blockColor(section: string, block: string): string {
  if (block.startsWith('TOPO')) return section === 'B2C' ? COLORS.topoB2c : COLORS.topo;
  if (block.startsWith('REPESCAGEM')) return COLORS.repescagem;
  if (block.startsWith('UPGRADE')) return COLORS.upgrade;
  if (block.startsWith('LEADS')) return COLORS.leads;
  if (block.startsWith('RECENCIA')) return COLORS.recencia;
  return COLORS.sectionDark;
}

function channelStyle(canal: string): [string, string] {
  if (canal === 'E-MAIL') return [COLORS.emailFill, COLORS.emailFont];
  if (canal === 'WPP') return [COLORS.wppFill, COLORS.wppFont];
  if (canal === 'SMS') return [COLORS.smsFill, COLORS.smsFont];
  return ['FFFFFF', '000000'];
}

function setCell(
  cell: Cell,
  value?: string | number | CellFormulaValue,
  options: { bold?: boolean; italic?: boolean; fontColor?: string; fillColor?: string; align?: 'left' | 'center' | 'right' } = {},
): void {
  if (value !== undefined) cell.value = value;
  cell.font = { name: 'Calibri', size: 10, bold: options.bold, italic: options.italic, color: { argb: `FF${options.fontColor ?? '000000'}` } };
  if (options.fillColor) {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${options.fillColor}` } };
  }
  cell.alignment = { horizontal: options.align ?? 'center', vertical: 'middle', wrapText: true };
}

function applyBorder(ws: Worksheet, row: number, maxCol: number, topStyle: BorderStyle = 'thin', verticalBoundaries: number[] = []): void {
  for (let col = 1; col <= maxCol; col += 1) {
    ws.getCell(row, col).border = {
      top: { style: topStyle, color: { argb: 'FFBFBFBF' } },
      bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
      left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
      right: { style: verticalBoundaries.includes(col) ? 'medium' : 'thin', color: { argb: verticalBoundaries.includes(col) ? 'FF000000' : 'FFE0E0E0' } },
    };
  }
}

function colLetter(col: number): string {
  let n = col;
  let s = '';
  while (n > 0) {
    const mod = (n - 1) % 26;
    s = String.fromCharCode(65 + mod) + s;
    n = Math.floor((n - mod) / 26);
  }
  return s;
}

function writeSection(ws: Worksheet, startRow: number, section: string, blocks: string[], idx: Map<string, Metrics>, dates: Date[]): number {
  setCell(ws.getCell(startRow, 1), 'Data', { bold: true, fillColor: COLORS.headerGray });
  setCell(ws.getCell(startRow, 2), 'Dia', { bold: true, fillColor: COLORS.headerGray });
  setCell(ws.getCell(startRow + 1, 1), '', { fillColor: COLORS.headerGray });
  setCell(ws.getCell(startRow + 1, 2), '', { fillColor: COLORS.headerGray });

  let col = 3;
  const numericCols: number[] = [];
  const verticalBoundaries = [2];
  const mergedHeaderStarts: number[] = [];

  if (section === 'B2C') {
    ws.mergeCells(startRow, col, startRow, col + 3);
    setCell(ws.getCell(startRow, col), 'DADOS REALIZADOS B2C', { bold: true, fontColor: 'FFFFFF', fillColor: COLORS.dataB2c });
    mergedHeaderStarts.push(col);
    ['Propostas', 'Cartões Emitidos', 'Propostas Serasa', 'Cartões Serasa'].forEach((label, offset) => {
      setCell(ws.getCell(startRow + 1, col + offset), label, { bold: true, fontColor: 'FFFFFF', fillColor: COLORS.dataB2cSub });
    });
    verticalBoundaries.push(col + 3);
    col += 4;
  }

  const blockPositions = new Map<string, number>();
  blocks.forEach((block) => {
    blockPositions.set(block, col);
    ws.mergeCells(startRow, col, startRow, col + 4);
    mergedHeaderStarts.push(col);
    const color = blockColor(section, block);
    setCell(ws.getCell(startRow, col), block, { bold: true, fontColor: 'FFFFFF', fillColor: color });
    ['Canal', 'Entregues', 'Emitidos', 'Aprovados', 'Proposta'].forEach((label, offset) => {
      setCell(ws.getCell(startRow + 1, col + offset), label, { bold: true, fontColor: 'FFFFFF', fillColor: color });
    });
    numericCols.push(col + 1, col + 2, col + 3, col + 4);
    verticalBoundaries.push(col + 4);
    col += 5;
  });

  const maxCol = col - 1;
  applyBorder(ws, startRow, maxCol, 'medium', verticalBoundaries);
  applyBorder(ws, startRow + 1, maxCol, 'thin', verticalBoundaries);
  mergedHeaderStarts.forEach((headerCol) => {
    ws.getCell(startRow, headerCol).border = {
      ...ws.getCell(startRow, headerCol).border,
      right: { style: 'medium', color: { argb: 'FF000000' } },
    };
  });

  const dataStart = startRow + 2;
  let rowNum = dataStart;

  dates.forEach((day, i) => {
    const ds = isoDate(day);
    const canais = new Set<string>();
    blocks.forEach((block) => {
      idx.forEach((_value, key) => {
        const [rd, secao, rb, canal] = key.split('\u001F');
        if (rd === ds && secao === section && rb === block) canais.add(canal);
      });
    });
    const rowsToWrite = [...canais].sort((a, b) => (CHANNEL_ORDER[a] ?? 99) - (CHANNEL_ORDER[b] ?? 99) || a.localeCompare(b));
    if (rowsToWrite.length === 0) rowsToWrite.push('');
    const zebra = i % 2 ? COLORS.zebra : 'FFFFFF';

    rowsToWrite.forEach((canal, channelIndex) => {
      for (let c = 1; c <= maxCol; c += 1) setCell(ws.getCell(rowNum, c), '', { fillColor: zebra });

      const dateFill = day.getDay() === 0 || day.getDay() === 6 ? COLORS.weekend : zebra;
      setCell(ws.getCell(rowNum, 1), day.toLocaleDateString('pt-BR'), { italic: day.getDay() === 0 || day.getDay() === 6, fillColor: dateFill });
      setCell(ws.getCell(rowNum, 2), DAY_NAMES[day.getDay()], { italic: day.getDay() === 0 || day.getDay() === 6, fillColor: dateFill });

      if (section === 'B2C') {
        for (let c = 3; c <= 6; c += 1) setCell(ws.getCell(rowNum, c), '', { fillColor: COLORS.manualB2c });
      }

      if (canal) {
        blocks.forEach((block) => {
          const values = idx.get(idxKey(ds, section, block, canal));
          if (!values || !NUMERIC_FIELDS.some((field) => values[field] > 0)) return;
          const startCol = blockPositions.get(block)!;
          const [fillColor, fontColor] = channelStyle(canal);
          setCell(ws.getCell(rowNum, startCol), canal, { bold: true, fontColor, fillColor });
          NUMERIC_FIELDS.forEach((field, offset) => {
            setCell(ws.getCell(rowNum, startCol + offset + 1), values[field], { fontColor, fillColor });
          });
        });
      }

      applyBorder(ws, rowNum, maxCol, channelIndex === 0 ? 'medium' : 'thin', verticalBoundaries);
      rowNum += 1;
    });
  });

  const totalRow = rowNum;
  for (let c = 1; c <= maxCol; c += 1) setCell(ws.getCell(totalRow, c), '', { bold: true, fillColor: COLORS.total });
  setCell(ws.getCell(totalRow, 1), 'total', { bold: true, fillColor: COLORS.total });
  numericCols.forEach((numCol) => {
    const letter = colLetter(numCol);
    setCell(ws.getCell(totalRow, numCol), { formula: `SUM(${letter}${dataStart}:${letter}${totalRow - 1})` }, { bold: true, fillColor: COLORS.total });
  });
  applyBorder(ws, totalRow, maxCol, 'medium', verticalBoundaries);
  return totalRow + 3;
}

function writeAuditSheet(wb: Workbook, auditRows: AuditRow[], journeyRows: JourneyRow[], summary: BuildIndexesResult['summary']): void {
  const ws = wb.addWorksheet('Auditoria', {
    views: [{ state: 'frozen', ySplit: 8, showGridLines: false }],
  });

  setCell(ws.getCell('A1'), 'Auditoria de mapeamento', { bold: true, fontColor: 'FFFFFF', fillColor: COLORS.auditHeader, align: 'left' });
  ws.mergeCells('A1:K1');

  [
    ['Linhas fonte no período', summary.source_rows],
    ['Linhas mapeadas no relatório', summary.mapped_source_rows],
    ['Linhas fora do relatório', summary.audit_source_rows],
  ].forEach(([label, value], index) => {
    const row = index + 3;
    setCell(ws.getCell(row, 1), String(label), { bold: true, fillColor: COLORS.auditSubheader, align: 'left' });
    setCell(ws.getCell(row, 2), Number(value), { fillColor: COLORS.auditSubheader });
  });

  const reasonTotals = new Map<string, Metrics & { linhas: number }>();
  auditRows.forEach((row) => {
    const current = reasonTotals.get(row.motivo) ?? { linhas: 0, entregues: 0, emitidos: 0, aprovados: 0, propostas: 0 };
    current.linhas += row.linhas;
    NUMERIC_FIELDS.forEach((field) => { current[field] += row[field]; });
    reasonTotals.set(row.motivo, current);
  });

  ['Motivo', 'Linhas', 'Entregues', 'Emitidos', 'Aprovados', 'Propostas'].forEach((label, offset) => {
    setCell(ws.getCell(3, 4 + offset), label, { bold: true, fontColor: 'FFFFFF', fillColor: COLORS.auditHeader });
  });
  let reasonRow = 4;
  [...reasonTotals.entries()].sort(([a], [b]) => a.localeCompare(b)).forEach(([reason, totals]) => {
    setCell(ws.getCell(reasonRow, 4), reason, { align: 'left' });
    ['linhas', ...NUMERIC_FIELDS].forEach((field, offset) => {
      setCell(ws.getCell(reasonRow, 5 + offset), totals[field as keyof typeof totals] as number);
    });
    reasonRow += 1;
  });

  const mappedTotals = new Map<string, Metrics & { linhas: number; secao: string; bloco: string }>();
  journeyRows.filter((row) => row.status_mapeamento === 'MAPEADO').forEach((row) => {
    const key = `${row.secao}\u001F${row.bloco}`;
    const current = mappedTotals.get(key) ?? { secao: row.secao, bloco: row.bloco, linhas: 0, entregues: 0, emitidos: 0, aprovados: 0, propostas: 0 };
    current.linhas += row.linhas;
    NUMERIC_FIELDS.forEach((field) => { current[field] += row[field]; });
    mappedTotals.set(key, current);
  });

  const mappedStart = Math.max(reasonRow + 2, 8);
  setCell(ws.getCell(mappedStart, 1), 'Resumo dos blocos mapeados', { bold: true, fontColor: 'FFFFFF', fillColor: COLORS.auditHeader, align: 'left' });
  ws.mergeCells(mappedStart, 1, mappedStart, 7);
  ['Seção', 'Bloco', 'Linhas', 'Entregues', 'Emitidos', 'Aprovados', 'Propostas'].forEach((label, offset) => {
    setCell(ws.getCell(mappedStart + 1, offset + 1), label, { bold: true, fontColor: 'FFFFFF', fillColor: COLORS.auditHeader });
  });

  let mappedRow = mappedStart + 2;
  [...mappedTotals.values()].sort((a, b) => `${a.secao}|${a.bloco}`.localeCompare(`${b.secao}|${b.bloco}`)).forEach((totals) => {
    setCell(ws.getCell(mappedRow, 1), totals.secao, { align: 'left' });
    setCell(ws.getCell(mappedRow, 2), totals.bloco, { align: 'left' });
    ['linhas', ...NUMERIC_FIELDS].forEach((field, offset) => {
      setCell(ws.getCell(mappedRow, 3 + offset), totals[field as keyof typeof totals] as number);
    });
    mappedRow += 1;
  });

  const detailStart = mappedRow + 2;
  ['Motivo', 'BU', 'Parceiro', 'Segmento', 'Etapa', 'Canal original', 'Canal', 'Linhas', 'Entregues', 'Emitidos', 'Aprovados', 'Propostas'].forEach((label, offset) => {
    setCell(ws.getCell(detailStart, offset + 1), label, { bold: true, fontColor: 'FFFFFF', fillColor: COLORS.auditHeader });
  });
  auditRows.forEach((row, index) => {
    const values = [row.motivo, row.bu, row.parceiro, row.segmento, row.etapa, row.canal_raw, row.canal, row.linhas, row.entregues, row.emitidos, row.aprovados, row.propostas];
    values.forEach((value, offset) => setCell(ws.getCell(detailStart + 1 + index, offset + 1), value, { align: offset <= 5 ? 'left' : 'center' }));
  });

  const journeyStart = detailStart + auditRows.length + 4;
  setCell(ws.getCell(journeyStart, 1), 'Mapa de jornadas e taxonomias por destino', { bold: true, fontColor: 'FFFFFF', fillColor: COLORS.auditHeader, align: 'left' });
  ws.mergeCells(journeyStart, 1, journeyStart, 15);
  ['Status/Motivo', 'Seção', 'Bloco', 'BU', 'Parceiro', 'Segmento', 'Etapa', 'Canal', 'Jornada', 'Activity name / Taxonomia', 'Linhas', 'Entregues', 'Emitidos', 'Aprovados', 'Propostas'].forEach((label, offset) => {
    setCell(ws.getCell(journeyStart + 1, offset + 1), label, { bold: true, fontColor: 'FFFFFF', fillColor: COLORS.auditHeader });
  });
  journeyRows.forEach((row, index) => {
    const values = [row.status_mapeamento, row.secao, row.bloco, row.bu, row.parceiro, row.segmento, row.etapa, row.canal, row.jornada, row.taxonomia, row.linhas, row.entregues, row.emitidos, row.aprovados, row.propostas];
    values.forEach((value, offset) => setCell(ws.getCell(journeyStart + 2 + index, offset + 1), value, { align: offset <= 9 ? 'left' : 'center' }));
  });

  [48, 12, 18, 14, 18, 28, 22, 12, 42, 58, 10, 14, 12, 12, 12].forEach((width, index) => {
    ws.getColumn(index + 1).width = width;
  });
}

function buildWorkbook(ExcelJSRuntime: { Workbook: new () => Workbook }, rawRows: RawActivity[], start: Date, end: Date): Workbook {
  const { idx, auditRows, journeyRows, summary } = buildIndexes(rawRows, start, end);
  const dates = allDates(start, end);
  const wb = new ExcelJSRuntime.Workbook();
  wb.creator = 'GaaS AFINZ';
  wb.created = new Date();

  const ws = wb.addWorksheet('Aquisição CRM', {
    views: [{ state: 'frozen', xSplit: 2, ySplit: 2, topLeftCell: 'C3', activeCell: 'C3', showGridLines: false }],
  });
  let nextRow = 1;
  SECTIONS.forEach(([section, blocks]) => {
    nextRow = writeSection(ws, nextRow, section, blocks, idx, dates);
  });
  ws.getColumn(1).width = 12;
  ws.getColumn(2).width = 6;
  for (let c = 3; c <= ws.columnCount; c += 1) {
    const header = text(ws.getCell(2, c).value);
    ws.getColumn(c).width = header === 'Canal' ? 10 : ['Cartões Emitidos', 'Propostas Serasa', 'Cartões Serasa'].includes(header) ? 16 : 12;
  }

  writeAuditSheet(wb, auditRows, journeyRows, summary);
  return wb;
}

async function fetchSupabaseRows(start: Date, end: Date): Promise<RawActivity[]> {
  const rows: RawActivity[] = [];
  const pageSize = 1000;
  const exclusiveEnd = addDays(end, 1);

  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .gte('Data de Disparo', isoDate(start))
      .lt('Data de Disparo', isoDate(exclusiveEnd))
      .order('Data de Disparo', { ascending: true })
      .order('BU', { ascending: true })
      .order('Parceiro', { ascending: true })
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

export async function exportAquisicaoCrmXlsx(start: Date, end: Date): Promise<{ rows: number; filename: string }> {
  const rawRows = await fetchSupabaseRows(start, end);
  const ExcelJSModule = await import('exceljs');
  const workbook = buildWorkbook(ExcelJSModule.default, rawRows, start, end);
  const buffer = await workbook.xlsx.writeBuffer();
  const filename = `aquisicao_crm_${isoDate(start).replace(/-/g, '')}_${isoDate(end).replace(/-/g, '')}.xlsx`;
  downloadBuffer(buffer, filename);
  return { rows: rawRows.length, filename };
}

export function getCurrentMonthRange(): { start: Date; end: Date } {
  const now = new Date();
  return {
    start: new Date(now.getFullYear(), now.getMonth(), 1),
    end: new Date(now.getFullYear(), now.getMonth() + 1, 0),
  };
}
