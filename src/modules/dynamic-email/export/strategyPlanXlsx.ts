import type { Workbook } from 'exceljs';
import type { EmailStrategy } from '../domain/management';

export const STRATEGY_XLSX_SCHEMA_VERSION = 1;

type ExcelRuntime = { Workbook: new () => Workbook };
type ColumnGroup = 'technical' | 'strategy' | 'execution' | 'audit';

type ExportColumn = {
  key: string;
  header: string;
  width: number;
  group: ColumnGroup;
  value: (strategy: EmailStrategy) => string | number;
};

const columns: ExportColumn[] = [
  { key: '_strategy_id', header: '_strategy_id', width: 38, group: 'technical', value: (item) => item.id },
  { key: '_campaign_group_id', header: '_campaign_group_id', width: 38, group: 'technical', value: (item) => item.campaignGroupId },
  { key: '_product', header: '_product', width: 22, group: 'technical', value: (item) => item.partner },
  { key: '_segment', header: '_segment', width: 24, group: 'technical', value: (item) => item.segment },
  { key: '_week', header: '_week', width: 14, group: 'technical', value: (item) => item.weekKey ?? '' },
  { key: '_sequence', header: '_sequence', width: 14, group: 'technical', value: (item) => item.sequence ?? '' },
  { key: '_base_version', header: '_base_version', width: 14, group: 'technical', value: (item) => item.version },
  { key: '_schema_version', header: '_schema_version', width: 15, group: 'technical', value: () => STRATEGY_XLSX_SCHEMA_VERSION },
  { key: 'papel_na_regua', header: 'papel_na_regua', width: 28, group: 'strategy', value: (item) => item.roleInRuler ?? '' },
  { key: 'objetivo_email', header: 'objetivo_email', width: 34, group: 'strategy', value: (item) => item.emailObjective ?? '' },
  { key: 'objecao_trabalhada', header: 'objecao_trabalhada', width: 32, group: 'strategy', value: (item) => item.objectionAddressed ?? '' },
  { key: 'mensagem_chave', header: 'mensagem_chave', width: 38, group: 'strategy', value: (item) => item.keyMessage ?? '' },
  { key: 'proposta_de_valor', header: 'proposta_de_valor', width: 42, group: 'strategy', value: (item) => item.valueProposition ?? '' },
  { key: 'beneficio_principal', header: 'beneficio_principal', width: 34, group: 'strategy', value: (item) => item.primaryBenefit ?? '' },
  { key: 'beneficios_complementares', header: 'beneficios_complementares', width: 42, group: 'strategy', value: (item) => item.secondaryBenefits.join('\n') },
  { key: 'prova_sustentacao', header: 'prova_sustentacao', width: 36, group: 'strategy', value: (item) => item.proof ?? '' },
  { key: 'acao_esperada', header: 'acao_esperada', width: 30, group: 'strategy', value: (item) => item.expectedAction ?? '' },
  { key: 'estrategia_ctas', header: 'estrategia_ctas', width: 38, group: 'strategy', value: (item) => item.ctaStrategy ?? '' },
  { key: 'hierarquia_visual', header: 'hierarquia_visual', width: 42, group: 'strategy', value: (item) => item.visualHierarchyStrategy ?? '' },
  { key: 'assunto_atual', header: 'assunto_atual', width: 38, group: 'execution', value: (item) => item.subject ?? '' },
  { key: 'pre_cabecalho_atual', header: 'pre_cabecalho_atual', width: 38, group: 'execution', value: (item) => item.preheader ?? '' },
  { key: 'status_editorial', header: 'status_editorial', width: 20, group: 'execution', value: (item) => item.editorialStatus },
  { key: 'status_visual', header: 'status_visual', width: 18, group: 'execution', value: (item) => item.visualStatus },
  { key: 'status_tecnico', header: 'status_tecnico', width: 18, group: 'execution', value: (item) => item.technicalStatus },
  { key: 'status_certificacao', header: 'status_certificacao', width: 20, group: 'execution', value: (item) => item.certificationStatus },
  { key: 'updated_at', header: 'updated_at', width: 23, group: 'audit', value: (item) => item.updatedAt ?? '' },
  { key: 'updated_by', header: 'updated_by', width: 38, group: 'audit', value: (item) => item.updatedBy ?? '' },
  { key: 'updated_by_type', header: 'updated_by_type', width: 18, group: 'audit', value: (item) => item.updatedByType },
  { key: 'update_source', header: 'update_source', width: 18, group: 'audit', value: (item) => item.updateSource },
  { key: 'change_reason', header: 'change_reason', width: 34, group: 'audit', value: (item) => item.changeReason ?? '' },
  { key: 'llm_model', header: 'llm_model', width: 24, group: 'audit', value: (item) => item.llmModel ?? '' },
  { key: 'llm_run_id', header: 'llm_run_id', width: 32, group: 'audit', value: (item) => item.llmRunId ?? '' },
];

const groupColors: Record<ColumnGroup, string> = {
  technical: '334155',
  strategy: '07595B',
  execution: '2C3490',
  audit: '6B7280',
};

const naturalSort = (a: string, b: string) => a.localeCompare(b, 'pt-BR', { numeric: true, sensitivity: 'base' });
const orderedStrategies = (items: EmailStrategy[]) => [...items].sort((a, b) => naturalSort(a.partner, b.partner) || naturalSort(a.segment, b.segment) || naturalSort(a.weekKey ?? '', b.weekKey ?? '') || naturalSort(a.sequence ?? '', b.sequence ?? ''));

const safeSheetName = (value: string, used: Set<string>) => {
  const base = (value || 'Sem produto').replace(/[\\/*?:[\]]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 31) || 'Sem produto';
  let candidate = base;
  let suffix = 2;
  while (used.has(candidate.toLocaleLowerCase('pt-BR'))) {
    const label = ` ${suffix++}`;
    candidate = `${base.slice(0, 31 - label.length)}${label}`;
  }
  used.add(candidate.toLocaleLowerCase('pt-BR'));
  return candidate;
};

export function buildStrategyPlanWorkbook(ExcelJSRuntime: ExcelRuntime, strategies: EmailStrategy[]): Workbook {
  if (!strategies.length) throw new Error('Não há estratégias para exportar.');
  const workbook = new ExcelJSRuntime.Workbook();
  workbook.creator = 'Afinz Growth as a Service';
  workbook.company = 'Afinz';
  workbook.subject = `Plano de Comunicação · schema v${STRATEGY_XLSX_SCHEMA_VERSION}`;
  workbook.created = new Date();
  workbook.modified = new Date();
  const usedNames = new Set<string>();
  const products = [...new Set(strategies.map((item) => item.partner))].sort(naturalSort);

  products.forEach((product) => {
    const sheet = workbook.addWorksheet(safeSheetName(product, usedNames), {
      views: [{ state: 'frozen', xSplit: 8, ySplit: 1, showGridLines: false }],
      properties: { defaultRowHeight: 30 },
    });
    sheet.columns = columns.map((column) => ({ key: column.key, header: column.header, width: column.width }));
    orderedStrategies(strategies.filter((item) => item.partner === product)).forEach((strategy) => {
      const row = sheet.addRow(Object.fromEntries(columns.map((column) => [column.key, column.value(strategy)])));
      row.alignment = { vertical: 'top', horizontal: 'left', wrapText: true };
      row.height = 54;
    });

    const header = sheet.getRow(1);
    header.height = 34;
    header.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    header.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
    columns.forEach((column, index) => {
      const cell = header.getCell(index + 1);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${groupColors[column.group]}` } };
      cell.border = { bottom: { style: 'medium', color: { argb: 'FF00C6CC' } } };
      cell.note = column.group === 'technical'
        ? 'Campo técnico estável. Preserve este valor ao enviar o arquivo para uma LLM.'
        : column.group === 'strategy'
          ? 'Campo do plano estratégico que pode ser redigido ou reescrito pela LLM.'
          : column.group === 'execution'
            ? 'Referência do briefing executado. Não é alterada por este exportador.'
            : 'Metadado de rastreabilidade preenchido pelo Supabase.';
    });

    sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: Math.max(1, sheet.rowCount), column: columns.length } };
    sheet.getColumn('_base_version').numFmt = '0';
    sheet.getColumn('_schema_version').numFmt = '0';
    sheet.getColumn('updated_at').numFmt = 'yyyy-mm-dd hh:mm:ss';
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      row.font = { name: 'Arial', size: 10, color: { argb: 'FF1E293B' } };
      row.eachCell((cell, columnNumber) => {
        const group = columns[columnNumber - 1]?.group;
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: group === 'technical' ? 'FFF1F5F9' : group === 'strategy' ? 'FFF0FDFF' : group === 'execution' ? 'FFF5F3FF' : 'FFF8FAFC' } };
        cell.border = { bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } } };
      });
    });
  });

  return workbook;
}

const slug = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'produtos';
const isoDay = () => new Date().toISOString().slice(0, 10);

export async function exportStrategyPlanXlsx(strategies: EmailStrategy[], scopeLabel: string): Promise<string> {
  const ExcelJSModule = await import('exceljs');
  const workbook = buildStrategyPlanWorkbook(ExcelJSModule.default, strategies);
  const buffer = await workbook.xlsx.writeBuffer();
  const filename = `plano-comunicacao-${slug(scopeLabel)}-${isoDay()}.xlsx`;
  const url = URL.createObjectURL(new Blob([new Uint8Array(buffer as ArrayBuffer)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  return filename;
}

export const STRATEGY_PLAN_XLSX_COLUMNS = columns.map(({ key, group }) => ({ key, group }));
