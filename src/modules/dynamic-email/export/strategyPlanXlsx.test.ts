import ExcelJS from 'exceljs';
import { describe, expect, it } from 'vitest';
import type { EmailStrategy, ProductContext, ProductGuardrail } from '../domain/management';
import { buildStrategyPlanWorkbook, STRATEGY_PLAN_XLSX_EDITORIAL_COLUMNS, STRATEGY_PLAN_XLSX_METADATA_COLUMNS, STRATEGY_XLSX_SCHEMA_VERSION } from './strategyPlanXlsx';

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

const context: ProductContext = {
  id: crypto.randomUUID(), product: 'Plurix', partner: 'Plurix', valueProposition: 'Compra que rende dentro e fora do mercado',
  differentiators: ['Desconto na rede'], eligibleAudience: 'Clientes da rede', toneOfVoice: 'Direto e próximo',
  brandContext: 'Cartão da rede', status: 'active', version: 1,
};

const guardrail: ProductGuardrail = {
  id: crypto.randomUUID(), productContextId: context.id, guardrailType: 'claim', title: 'Comparação de preço',
  ruleText: 'Validar o preço com a rede.', severity: 'requires_review', allowedStatus: 'conditional', status: 'active', version: 1,
};

describe('strategyPlanXlsx V2', () => {
  it('cria visão macro e plano editorial por produto, mais metadados ocultos', () => {
    const workbook = buildStrategyPlanWorkbook(ExcelJS, {
      strategies: [strategy('Plurix', 'E-mail 2', 4), strategy('Institucional B2C', 'E-mail 1')],
      contexts: [context], guardrails: [guardrail],
    });
    expect(workbook.worksheets.map((sheet) => sheet.name)).toEqual([
      'Institucional B2C · Visão', 'Institucional B2C · E-mails', 'Plurix · Visão', 'Plurix · E-mails', '_Metadados',
    ]);
    expect(workbook.getWorksheet('_Metadados')?.state).toBe('veryHidden');
    expect(workbook.getWorksheet('Plurix · Visão')?.getCell('A13').value).toBe('Inventário de benefícios');
    const overviewValues: unknown[] = [];
    workbook.getWorksheet('Plurix · Visão')?.eachRow((row) => row.eachCell((cell) => overviewValues.push(cell.value)));
    expect(overviewValues).toContain('Desconto na rede');
    expect(overviewValues).toContain('Comparação de preço');
  });

  it('remove IDs da aba editorial e congela somente o cabeçalho', () => {
    const workbook = buildStrategyPlanWorkbook(ExcelJS, { strategies: [strategy('Plurix', 'E-mail 1', 7)] });
    const editorial = workbook.getWorksheet('Plurix · E-mails')!;
    expect(editorial.getRow(1).values).toEqual([undefined, ...STRATEGY_PLAN_XLSX_EDITORIAL_COLUMNS.map((column) => {
      const cell = editorial.getColumn(column.key).header;
      return cell;
    })]);
    expect(editorial.getRow(1).values.join(' ')).not.toContain('_strategy_id');
    expect(editorial.views[0]).toMatchObject({ state: 'frozen', ySplit: 1, showGridLines: false });
    expect(editorial.views[0]).not.toHaveProperty('xSplit');
  });

  it('preserva IDs e versão-base apenas na aba técnica oculta', async () => {
    const workbook = buildStrategyPlanWorkbook(ExcelJS, { strategies: [strategy('Plurix', 'E-mail 1', 7)] });
    const metadata = workbook.getWorksheet('_Metadados')!;
    expect(metadata.getRow(1).values).toEqual([undefined, ...STRATEGY_PLAN_XLSX_METADATA_COLUMNS]);
    expect(metadata.getCell('G2').value).toBe(7);
    expect(metadata.getCell('H2').value).toBe(STRATEGY_XLSX_SCHEMA_VERSION);
    const buffer = await workbook.xlsx.writeBuffer();
    const reloaded = new ExcelJS.Workbook();
    await reloaded.xlsx.load(buffer);
    expect(reloaded.getWorksheet('_Metadados')?.state).toBe('veryHidden');
    expect(reloaded.getWorksheet('Plurix · E-mails')?.views[0]).toMatchObject({ ySplit: 1 });
  });
});
