import ExcelJS from 'exceljs';
import { describe, expect, it } from 'vitest';
import type { EmailStrategy } from '../domain/management';
import { buildStrategyPlanWorkbook, STRATEGY_PLAN_XLSX_COLUMNS, STRATEGY_XLSX_SCHEMA_VERSION } from './strategyPlanXlsx';

const strategy = (partner: string, sequence: string, version = 1): EmailStrategy => ({
  id: crypto.randomUUID(), campaignGroupId: crypto.randomUUID(), partner, segment: 'CRM', weekKey: 'Semana 1', sequence,
  subject: 'Assunto atual', preheader: 'Pré-cabeçalho atual', roleInRuler: 'Abertura', emailObjective: 'Apresentar o produto',
  keyMessage: 'Mensagem-chave', expectedAction: 'Conhecer', valueProposition: 'Valor para o cliente', primaryBenefit: 'Benefício principal',
  secondaryBenefits: ['Benefício 2', 'Benefício 3'], objectionAddressed: 'Não conheço', proof: 'Evidência aprovada',
  visualHierarchyStrategy: 'Mensagem, benefícios e CTAs', ctaStrategy: 'Dois CTAs para o mesmo destino',
  technicalStatus: 'ready', editorialStatus: 'needs_review', visualStatus: 'ready', certificationStatus: 'test_pending',
  fieldProvenance: {}, version, updatedAt: '2026-09-01T12:00:00.000Z', updatedBy: crypto.randomUUID(),
  updatedByType: 'llm', updateSource: 'llm', changeReason: 'Revisão da régua', llmModel: 'gpt-test', llmRunId: 'run-123',
});

describe('strategyPlanXlsx', () => {
  it('cria uma aba por produto com schema estável e campos de estratégia', () => {
    const workbook = buildStrategyPlanWorkbook(ExcelJS, [strategy('Plurix', 'E-mail 2', 4), strategy('Institucional B2C', 'E-mail 1')]);
    expect(workbook.worksheets.map((sheet) => sheet.name)).toEqual(['Institucional B2C', 'Plurix']);
    const plurix = workbook.getWorksheet('Plurix')!;
    expect(plurix.getRow(1).values).toEqual([undefined, ...STRATEGY_PLAN_XLSX_COLUMNS.map((column) => column.key)]);
    expect(plurix.getCell('G2').value).toBe(4);
    expect(plurix.getCell('H2').value).toBe(STRATEGY_XLSX_SCHEMA_VERSION);
    expect(plurix.getCell('O2').value).toBe('Benefício 2\nBenefício 3');
    expect(plurix.views[0]).toMatchObject({ state: 'frozen', xSplit: 8, ySplit: 1, showGridLines: false });
  });

  it('mantém apenas uma aba quando o escopo contém um produto', () => {
    const workbook = buildStrategyPlanWorkbook(ExcelJS, [strategy('Plurix', 'E-mail 1'), strategy('Plurix', 'E-mail 2')]);
    expect(workbook.worksheets).toHaveLength(1);
    expect(workbook.getWorksheet('Plurix')?.rowCount).toBe(3);
  });
});
