import type { Workbook, Worksheet } from 'exceljs';
import { fetchSupabaseRows } from './aquisicaoCrmExcelExport';

type RawActivity = Record<string, any>;

type PartnerMetrics = {
  segmento: string;
  disparos: number;
  cpfsUnicos: number;
  baseEnviada: number;
  baseEntregue: number;
  propostas: number;
  aprovados: number;
  emissoes: number;
  custoTotal: number;
};

export type HighFrequencyPartner = 'Dia' | 'Bem Barato';
const SEGMENT_ORDER = ['CRM', 'Negados', 'Aprovados_nao_convertidos', 'Recencia_de_Compra'];

const numberValue = (value: unknown): number => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const dateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const addDays = (date: Date, days: number): Date => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const isIncludedRow = (row: RawActivity, partner: string): boolean => {
  const status = String(row.status ?? row.Status ?? '');
  const stage = String(row['Etapa de aquisição'] ?? row['Etapa de aquisicao'] ?? '');
  return row.BU === 'B2B2C'
    && row.Parceiro === partner
    && status === 'Realizado'
    && ['Aquisicao', 'Meio_de_Funil', 'Reativacao'].includes(stage)
    && row.Segmento !== 'Rentabilizacao';
};

export function aggregateHighFrequencyPartner(rows: RawActivity[], partner: string): PartnerMetrics[] {
  const grouped = new Map<string, PartnerMetrics>();
  rows.filter((row) => isIncludedRow(row, partner)).forEach((row) => {
    const segmento = String(row.Segmento ?? '').trim() || 'Sem segmento';
    if (!grouped.has(segmento)) {
      grouped.set(segmento, {
        segmento,
        disparos: 0,
        cpfsUnicos: 0,
        baseEnviada: 0,
        baseEntregue: 0,
        propostas: 0,
        aprovados: 0,
        emissoes: 0,
        custoTotal: 0,
      });
    }
    const metric = grouped.get(segmento)!;
    const baseTotal = numberValue(row['Base Total']);
    metric.disparos += 1;
    metric.cpfsUnicos = Math.max(metric.cpfsUnicos, baseTotal);
    metric.baseEnviada += baseTotal;
    metric.baseEntregue += numberValue(row['Base Acionável'] ?? row['Base Acionavel']);
    metric.propostas += numberValue(row.Propostas);
    metric.aprovados += numberValue(row.Aprovados);
    metric.emissoes += numberValue(row['Cartões Gerados'] ?? row['Cartoes Gerados']);
    metric.custoTotal += numberValue(row['Custo Total Campanha']);
  });

  return Array.from(grouped.values()).sort((a, b) => {
    const aOrder = SEGMENT_ORDER.indexOf(a.segmento);
    const bOrder = SEGMENT_ORDER.indexOf(b.segmento);
    if (aOrder !== bOrder) return (aOrder < 0 ? 999 : aOrder) - (bOrder < 0 ? 999 : bOrder);
    return a.segmento.localeCompare(b.segmento);
  });
}

const setSheetLayout = (sheet: Worksheet, partner: string, start: Date, end: Date): void => {
  sheet.views = [{ state: 'frozen', ySplit: 3, activeCell: 'A4', showGridLines: false }];
  sheet.mergeCells('A1:O1');
  sheet.getCell('A1').value = `PARCEIROS ALTA FREQUÊNCIA — B2B2C | ${partner}`;
  sheet.getCell('A1').font = { name: 'Arial', size: 15, bold: true, color: { argb: 'FFFFFFFF' } };
  sheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: partner === 'Dia' ? 'FF1D4ED8' : 'FF0891B2' } };
  sheet.getCell('A1').alignment = { vertical: 'middle', horizontal: 'left' };
  sheet.getRow(1).height = 30;
  sheet.mergeCells('A2:O2');
  sheet.getCell('A2').value = `Período: ${start.toLocaleDateString('pt-BR')} – ${end.toLocaleDateString('pt-BR')}`;
  sheet.getCell('A2').font = { name: 'Arial', size: 10, color: { argb: 'FF475569' } };
  sheet.getCell('A2').alignment = { vertical: 'middle', horizontal: 'left' };

  const widths = [28, 16, 18, 16, 16, 12, 14, 12, 14, 12, 12, 14, 16, 16, 16];
  widths.forEach((width, index) => { sheet.getColumn(index + 1).width = width; });
};

const writePartnerSheet = (sheet: Worksheet, partner: string, rows: PartnerMetrics[], start: Date, end: Date): void => {
  setSheetLayout(sheet, partner, start, end);
  const headers = ['Segmento', 'Qtd. de Disparos', 'CPFs Únicos', 'Base Enviada', 'Base Entregue', '% Entrega', 'Propostas', '% Proposta', 'Aprovados', '% Aprovação', 'Emissões', '% Finalização', 'Custo/Cartão', 'Custo Total', '% Conv. da Base'];
  const header = sheet.getRow(3);
  header.values = headers;
  header.height = 34;
  header.eachCell((cell) => {
    cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = { bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } } };
  });

  if (rows.length === 0) {
    sheet.mergeCells('A4:O4');
    sheet.getCell('A4').value = 'Sem dados para este parceiro no período selecionado.';
    sheet.getCell('A4').font = { name: 'Arial', size: 10, color: { argb: 'FF64748B' } };
    sheet.getCell('A4').alignment = { vertical: 'middle', horizontal: 'center' };
    sheet.getCell('A4').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
    sheet.getRow(4).height = 28;
    return;
  }

  rows.forEach((metric, index) => {
    const rowNumber = index + 4;
    const row = sheet.getRow(rowNumber);
    row.values = [
      metric.segmento,
      metric.disparos,
      metric.cpfsUnicos,
      metric.baseEnviada,
      metric.baseEntregue,
      { formula: `IFERROR(E${rowNumber}/D${rowNumber},0)` },
      metric.propostas,
      { formula: `IFERROR(G${rowNumber}/E${rowNumber},0)` },
      metric.aprovados,
      { formula: `IFERROR(I${rowNumber}/G${rowNumber},0)` },
      metric.emissoes,
      { formula: `IFERROR(K${rowNumber}/E${rowNumber},0)` },
      { formula: `IFERROR(N${rowNumber}/K${rowNumber},0)` },
      metric.custoTotal,
      { formula: `IFERROR(K${rowNumber}/D${rowNumber},0)` },
    ];
    row.height = 23;
    row.eachCell((cell, colNumber) => {
      cell.font = { name: 'Arial', size: 10, color: { argb: 'FF1E293B' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: index % 2 === 0 ? 'FFFFFFFF' : 'FFF8FAFC' } };
      cell.alignment = { vertical: 'middle', horizontal: colNumber === 1 ? 'left' : 'right' };
      cell.border = { bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } } };
    });
  });

  const totalRowNumber = rows.length + 4;
  const firstDataRow = 4;
  const total = sheet.getRow(totalRowNumber);
  total.values = [
    'Total Geral',
    { formula: `SUM(B${firstDataRow}:B${totalRowNumber - 1})` },
    { formula: `MAX(C${firstDataRow}:C${totalRowNumber - 1})` },
    { formula: `SUM(D${firstDataRow}:D${totalRowNumber - 1})` },
    { formula: `SUM(E${firstDataRow}:E${totalRowNumber - 1})` },
    { formula: `IFERROR(E${totalRowNumber}/D${totalRowNumber},0)` },
    { formula: `SUM(G${firstDataRow}:G${totalRowNumber - 1})` },
    { formula: `IFERROR(G${totalRowNumber}/E${totalRowNumber},0)` },
    { formula: `SUM(I${firstDataRow}:I${totalRowNumber - 1})` },
    { formula: `IFERROR(I${totalRowNumber}/G${totalRowNumber},0)` },
    { formula: `SUM(K${firstDataRow}:K${totalRowNumber - 1})` },
    { formula: `IFERROR(K${totalRowNumber}/E${totalRowNumber},0)` },
    { formula: `IFERROR(N${totalRowNumber}/K${totalRowNumber},0)` },
    { formula: `SUM(N${firstDataRow}:N${totalRowNumber - 1})` },
    { formula: `IFERROR(K${totalRowNumber}/D${totalRowNumber},0)` },
  ];
  total.height = 25;
  total.eachCell((cell, colNumber) => {
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF0F172A' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
    cell.alignment = { vertical: 'middle', horizontal: colNumber === 1 ? 'left' : 'right' };
    cell.border = { top: { style: 'thin', color: { argb: 'FF94A3B8' } }, bottom: { style: 'thin', color: { argb: 'FF94A3B8' } } };
  });

  for (let row = 4; row <= totalRowNumber; row += 1) {
    ['B', 'C', 'D', 'E', 'G', 'I', 'K'].forEach((col) => { sheet.getCell(`${col}${row}`).numFmt = '#,##0'; });
    ['F', 'H', 'J', 'L', 'O'].forEach((col) => { sheet.getCell(`${col}${row}`).numFmt = '0.00%'; });
    ['M', 'N'].forEach((col) => { sheet.getCell(`${col}${row}`).numFmt = '"R$" #,##0.00'; });
  }
  sheet.autoFilter = { from: 'A3', to: `O${totalRowNumber - 1}` };
};

export function buildHighFrequencyPartnerWorkbook(
  ExcelJSRuntime: { Workbook: new () => Workbook },
  rawRows: RawActivity[],
  start: Date,
  end: Date,
  partner: HighFrequencyPartner,
): Workbook {
  const workbook = new ExcelJSRuntime.Workbook();
  workbook.creator = 'GaaS AFINZ';
  workbook.created = new Date();
  workbook.calcProperties.fullCalcOnLoad = true;
  const sheet = workbook.addWorksheet(partner);
  writePartnerSheet(sheet, partner, aggregateHighFrequencyPartner(rawRows, partner), start, end);
  return workbook;
}

export async function exportHighFrequencyPartnerXlsx(
  start: Date,
  end: Date,
  partner: HighFrequencyPartner,
): Promise<{ rows: number; filename: string }> {
  const rawRows = await fetchSupabaseRows(start, end);
  const ExcelJSModule = await import('exceljs');
  const workbook = buildHighFrequencyPartnerWorkbook(ExcelJSModule.default, rawRows, start, end, partner);
  const buffer = await workbook.xlsx.writeBuffer();
  const partnerSlug = partner === 'Dia' ? 'dia' : 'bem_barato';
  const filename = `parceiros_alta_frequencia_${partnerSlug}_${dateKey(start).replace(/-/g, '')}_${dateKey(end).replace(/-/g, '')}.xlsx`;
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
  const exclusiveEnd = dateKey(addDays(end, 1));
  return {
    rows: rawRows.filter((row) => row.Parceiro === partner && String(row['Data de Disparo']).slice(0, 10) < exclusiveEnd).length,
    filename,
  };
}
