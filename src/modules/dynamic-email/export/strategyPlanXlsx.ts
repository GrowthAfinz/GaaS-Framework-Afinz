import type { Workbook, Worksheet } from 'exceljs';
import type { EmailStrategy, ProductContext, ProductGuardrail } from '../domain/management';

export const STRATEGY_XLSX_SCHEMA_VERSION = 2;

type ExcelRuntime = { Workbook: new () => Workbook };
export type StrategyPlanWorkbookInput = { strategies: EmailStrategy[]; contexts?: ProductContext[]; guardrails?: ProductGuardrail[] };
type EditorialColumn = { key: string; header: string; width: number; kind: 'plan' | 'reference' | 'tracking'; help: string; value: (strategy: EmailStrategy) => string | number };

const editorialStatusLabel = (status: EmailStrategy['editorialStatus']) => ({ needs_enrichment: 'Enriquecer estratégia', draft: 'Rascunho', needs_review: 'Em revisão', ready: 'Pronto', blocked: 'Bloqueado' }[status]);
const updateLabel = (item: EmailStrategy) => {
  const source = item.updatedByType === 'llm' ? `LLM${item.llmModel ? ` · ${item.llmModel}` : ''}` : item.updatedByType === 'human' ? 'Edição humana' : 'Sistema';
  if (!item.updatedAt) return source;
  const date = new Date(item.updatedAt);
  return Number.isNaN(date.valueOf()) ? source : `${date.toLocaleDateString('pt-BR')} · ${source}`;
};

const editorialColumns: EditorialColumn[] = [
  { key: 'semana', header: 'Semana', width: 13, kind: 'tracking', help: 'Momento do envio dentro da régua.', value: (item) => item.weekKey ?? '' },
  { key: 'email', header: 'E-mail', width: 13, kind: 'tracking', help: 'Ordem editorial do contato.', value: (item) => item.sequence ?? '' },
  { key: 'papel', header: 'Papel na régua', width: 28, kind: 'plan', help: 'Função deste contato na progressão da régua.', value: (item) => item.roleInRuler ?? '' },
  { key: 'objetivo', header: 'Objetivo do e-mail', width: 32, kind: 'plan', help: 'Resultado de comunicação esperado neste envio.', value: (item) => item.emailObjective ?? '' },
  { key: 'objecao', header: 'Objeção trabalhada', width: 30, kind: 'plan', help: 'Dúvida ou barreira que o conteúdo precisa reduzir.', value: (item) => item.objectionAddressed ?? '' },
  { key: 'mensagem', header: 'Mensagem-chave', width: 36, kind: 'plan', help: 'Ideia que a pessoa deve lembrar depois da leitura.', value: (item) => item.keyMessage ?? '' },
  { key: 'proposta', header: 'Proposta de valor aplicada', width: 40, kind: 'plan', help: 'Como a proposta do produto ganha relevância neste e-mail.', value: (item) => item.valueProposition ?? '' },
  { key: 'beneficio_principal', header: 'Benefício principal', width: 32, kind: 'plan', help: 'Benefício com maior prioridade editorial e visual.', value: (item) => item.primaryBenefit ?? '' },
  { key: 'beneficios_complementares', header: 'Benefícios complementares', width: 38, kind: 'plan', help: 'Um benefício por linha, reforçando a mensagem principal.', value: (item) => item.secondaryBenefits.join('\n') },
  { key: 'prova', header: 'Prova ou sustentação', width: 34, kind: 'plan', help: 'Evidência, condição ou fato que sustenta a promessa.', value: (item) => item.proof ?? '' },
  { key: 'acao', header: 'Ação esperada', width: 28, kind: 'plan', help: 'Comportamento esperado depois do contato.', value: (item) => item.expectedAction ?? '' },
  { key: 'ctas', header: 'Estratégia de CTAs', width: 36, kind: 'plan', help: 'Quantidade, função, posição e destino dos CTAs.', value: (item) => item.ctaStrategy ?? '' },
  { key: 'hierarquia', header: 'Hierarquia visual', width: 38, kind: 'plan', help: 'Ordem visual recomendada para mensagem, benefícios e CTAs.', value: (item) => item.visualHierarchyStrategy ?? '' },
  { key: 'assunto', header: 'Assunto atual', width: 34, kind: 'reference', help: 'Assunto existente no briefing, exibido como referência.', value: (item) => item.subject ?? '' },
  { key: 'pre_cabecalho', header: 'Pré-cabeçalho atual', width: 36, kind: 'reference', help: 'Pré-cabeçalho existente no briefing, exibido como referência.', value: (item) => item.preheader ?? '' },
  { key: 'status', header: 'Status editorial', width: 19, kind: 'tracking', help: 'Situação atual do plano editorial.', value: (item) => editorialStatusLabel(item.editorialStatus) },
  { key: 'atualizacao', header: 'Última atualização', width: 23, kind: 'tracking', help: 'Data e origem da versão atual.', value: updateLabel },
];

const metadataColumns = [
  '_strategy_id', '_campaign_group_id', '_product', '_segment', '_week', '_sequence', '_base_version', '_schema_version',
  'papel_na_regua', 'objetivo_email', 'objecao_trabalhada', 'mensagem_chave', 'proposta_de_valor', 'beneficio_principal',
  'beneficios_complementares', 'prova_sustentacao', 'acao_esperada', 'estrategia_ctas', 'hierarquia_visual', 'assunto_atual',
  'pre_cabecalho_atual', 'status_editorial', 'status_visual', 'status_tecnico', 'status_certificacao', 'updated_at', 'updated_by',
  'updated_by_type', 'update_source', 'change_reason', 'llm_model', 'llm_run_id',
] as const;

const colors = { navy: '152238', teal: '07595B', cyan: '00C6CC', paleCyan: 'E8FBFC', paleBlue: 'EEF2FF', paleSlate: 'F1F5F9', slate: '475569', lightBorder: 'D8E2EA', white: 'FFFFFF', amber: 'FFF7E6', red: 'FDECEC' };
const naturalSort = (a: string, b: string) => a.localeCompare(b, 'pt-BR', { numeric: true, sensitivity: 'base' });
const orderedStrategies = (items: EmailStrategy[]) => [...items].sort((a, b) => naturalSort(a.weekKey ?? '', b.weekKey ?? '') || naturalSort(a.sequence ?? '', b.sequence ?? ''));
const distinct = (values: Array<string | undefined>) => [...new Set(values.map((value) => value?.trim()).filter(Boolean) as string[])];
const lines = (values: Array<string | undefined>) => distinct(values).join('\n');
const guardrailSeverityLabel = (severity: ProductGuardrail['severity']) => ({ hard_block: 'Obrigatório', requires_review: 'Exige validação', advisory: 'Orientação' }[severity]);
const guardrailTypeLabel = (type: ProductGuardrail['guardrailType']) => ({ benefit: 'Benefício', claim: 'Claim', eligibility: 'Elegibilidade', legal: 'Legal', visual: 'Visual', tone: 'Tom de voz', deeplink: 'Link', prohibited: 'Proibição' }[type]);

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

const applyBaseSheetStyle = (sheet: Worksheet) => { sheet.properties.defaultRowHeight = 22; sheet.views = [{ showGridLines: false }]; };
const styleSectionTitle = (sheet: Worksheet, rowNumber: number, title: string, endColumn = 6) => {
  sheet.mergeCells(rowNumber, 1, rowNumber, endColumn);
  const cell = sheet.getCell(rowNumber, 1);
  cell.value = title;
  cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: `FF${colors.white}` } };
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${colors.teal}` } };
  cell.alignment = { vertical: 'middle', horizontal: 'left' };
  sheet.getRow(rowNumber).height = 27;
};
const writeContextRow = (sheet: Worksheet, rowNumber: number, label: string, value: string) => {
  const labelCell = sheet.getCell(rowNumber, 1);
  labelCell.value = label;
  labelCell.font = { name: 'Arial', size: 10, bold: true, color: { argb: `FF${colors.slate}` } };
  labelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${colors.paleSlate}` } };
  sheet.mergeCells(rowNumber, 2, rowNumber, 6);
  const valueCell = sheet.getCell(rowNumber, 2);
  valueCell.value = value || 'Não informado';
  valueCell.font = { name: 'Arial', size: 10, color: { argb: `FF${colors.navy}` } };
  valueCell.alignment = { vertical: 'top', horizontal: 'left', wrapText: true };
  sheet.getRow(rowNumber).height = Math.max(26, Math.min(70, 18 + (valueCell.value?.toString().split('\n').length ?? 1) * 13));
  for (let column = 1; column <= 6; column += 1) sheet.getCell(rowNumber, column).border = { bottom: { style: 'thin', color: { argb: `FF${colors.lightBorder}` } } };
};

type BenefitInventoryItem = { benefit: string; type: string; emails: Set<string>; messages: Set<string>; proofs: Set<string>; objections: Set<string> };
const buildBenefitInventory = (strategies: EmailStrategy[], contexts: ProductContext[]) => {
  const inventory = new Map<string, BenefitInventoryItem>();
  const add = (benefit: string, type: string, strategy?: EmailStrategy) => {
    const clean = benefit.trim();
    if (!clean) return;
    const key = clean.toLocaleLowerCase('pt-BR');
    const current = inventory.get(key) ?? { benefit: clean, type, emails: new Set(), messages: new Set(), proofs: new Set(), objections: new Set() };
    if (type === 'Principal') current.type = type;
    if (strategy) {
      current.emails.add([strategy.weekKey, strategy.sequence].filter(Boolean).join(' · '));
      if (strategy.keyMessage) current.messages.add(strategy.keyMessage);
      if (strategy.proof) current.proofs.add(strategy.proof);
      if (strategy.objectionAddressed) current.objections.add(strategy.objectionAddressed);
    }
    inventory.set(key, current);
  };
  strategies.forEach((strategy) => {
    if (strategy.primaryBenefit) add(strategy.primaryBenefit, 'Principal', strategy);
    strategy.secondaryBenefits.forEach((benefit) => add(benefit, 'Complementar', strategy));
  });
  contexts.flatMap((context) => context.differentiators).forEach((benefit) => add(benefit, 'Diferencial do produto'));
  const priority = { Principal: 1, Complementar: 2, 'Diferencial do produto': 3 } as Record<string, number>;
  return [...inventory.values()].sort((a, b) => (priority[a.type] ?? 9) - (priority[b.type] ?? 9) || naturalSort(a.benefit, b.benefit));
};

const styleTableHeader = (row: ReturnType<Worksheet['getRow']>) => {
  row.height = 32;
  row.font = { name: 'Arial', size: 10, bold: true, color: { argb: `FF${colors.white}` } };
  row.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
  row.eachCell((cell) => { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${colors.slate}` } }; });
};

const addOverviewSheet = (workbook: Workbook, name: string, product: string, strategies: EmailStrategy[], contexts: ProductContext[], guardrails: ProductGuardrail[]) => {
  const sheet = workbook.addWorksheet(name);
  applyBaseSheetStyle(sheet);
  sheet.columns = [{ width: 23 }, { width: 33 }, { width: 34 }, { width: 34 }, { width: 34 }, { width: 40 }];
  sheet.mergeCells('A1:F1');
  sheet.getCell('A1').value = `Plano de Comunicação · ${product}`;
  sheet.getCell('A1').font = { name: 'Arial', size: 18, bold: true, color: { argb: `FF${colors.white}` } };
  sheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${colors.navy}` } };
  sheet.getCell('A1').alignment = { vertical: 'middle', horizontal: 'left' };
  sheet.getRow(1).height = 42;
  sheet.mergeCells('A2:F2');
  sheet.getCell('A2').value = `${strategies.length} e-mails · visão macro para planejamento, conteúdo e copywriting`;
  sheet.getCell('A2').font = { name: 'Arial', size: 10, color: { argb: `FF${colors.slate}` } };
  sheet.getRow(2).height = 25;

  styleSectionTitle(sheet, 4, 'Contexto do produto');
  writeContextRow(sheet, 5, 'Produto / parceiro', product);
  writeContextRow(sheet, 6, 'Régua / segmento', lines(strategies.map((item) => item.segment)));
  writeContextRow(sheet, 7, 'Proposta de valor central', lines(contexts.map((item) => item.valueProposition)) || lines(strategies.map((item) => item.valueProposition)));
  writeContextRow(sheet, 8, 'Público prioritário', lines(contexts.map((item) => item.eligibleAudience)));
  writeContextRow(sheet, 9, 'Tom de voz', lines(contexts.map((item) => item.toneOfVoice)));
  writeContextRow(sheet, 10, 'Contexto de marca', lines(contexts.map((item) => item.brandContext)));
  writeContextRow(sheet, 11, 'Evolução narrativa', orderedStrategies(strategies).map((item) => `${item.weekKey ?? ''} · ${item.sequence ?? ''}: ${item.roleInRuler || 'Papel ainda não definido'}`).join('\n'));

  const benefits = buildBenefitInventory(strategies, contexts);
  const benefitStart = 13;
  styleSectionTitle(sheet, benefitStart, 'Inventário de benefícios');
  const benefitHeader = sheet.getRow(benefitStart + 1);
  ['Prioridade', 'Benefício', 'E-mails que utilizam', 'Mensagem associada', 'Prova / sustentação', 'Objeção que responde'].forEach((label, index) => { benefitHeader.getCell(index + 1).value = label; });
  styleTableHeader(benefitHeader);
  benefits.forEach((benefit, index) => {
    const row = sheet.getRow(benefitStart + 2 + index);
    row.values = [benefit.type, benefit.benefit, [...benefit.emails].join('\n') || null, [...benefit.messages].join('\n') || null, [...benefit.proofs].join('\n') || null, [...benefit.objections].join('\n') || null];
    row.height = 58;
    row.font = { name: 'Arial', size: 10, color: { argb: `FF${colors.navy}` } };
    row.alignment = { vertical: 'top', horizontal: 'left', wrapText: true };
    row.eachCell((cell) => { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${index % 2 ? 'FFFFFF' : colors.paleCyan}` } }; cell.border = { bottom: { style: 'thin', color: { argb: `FF${colors.lightBorder}` } } }; });
  });
  if (!benefits.length) { sheet.mergeCells(benefitStart + 2, 1, benefitStart + 2, 6); sheet.getCell(benefitStart + 2, 1).value = 'Nenhum benefício estruturado no plano até o momento.'; }

  const guardrailStart = benefitStart + Math.max(benefits.length, 1) + 4;
  styleSectionTitle(sheet, guardrailStart, 'Diretrizes e guardrails do produto');
  const guardrailHeader = sheet.getRow(guardrailStart + 1);
  ['Impacto', 'Tipo', 'Diretriz', 'Regra prática', 'Evidência', 'Fonte'].forEach((label, index) => { guardrailHeader.getCell(index + 1).value = label; });
  styleTableHeader(guardrailHeader);
  guardrails.forEach((guardrail, index) => {
    const row = sheet.getRow(guardrailStart + 2 + index);
    row.values = [guardrailSeverityLabel(guardrail.severity), guardrailTypeLabel(guardrail.guardrailType), guardrail.title, guardrail.ruleText, guardrail.evidence ?? null, guardrail.sourceUrl ?? null];
    row.height = 58;
    row.font = { name: 'Arial', size: 10, color: { argb: `FF${colors.navy}` } };
    row.alignment = { vertical: 'top', horizontal: 'left', wrapText: true };
    const fill = guardrail.severity === 'hard_block' ? colors.red : guardrail.severity === 'requires_review' ? colors.amber : colors.paleSlate;
    row.eachCell((cell) => { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${fill}` } }; cell.border = { bottom: { style: 'thin', color: { argb: `FF${colors.lightBorder}` } } }; });
  });
  if (!guardrails.length) { sheet.mergeCells(guardrailStart + 2, 1, guardrailStart + 2, 6); sheet.getCell(guardrailStart + 2, 1).value = 'Nenhuma diretriz específica vinculada a este produto.'; }
  sheet.autoFilter = { from: { row: benefitStart + 1, column: 1 }, to: { row: benefitStart + Math.max(benefits.length, 1) + 1, column: 6 } };
};

const addEditorialSheet = (workbook: Workbook, name: string, strategies: EmailStrategy[]) => {
  const sheet = workbook.addWorksheet(name, { views: [{ state: 'frozen', ySplit: 1, showGridLines: false }] });
  sheet.properties.defaultRowHeight = 30;
  sheet.columns = editorialColumns.map((column) => ({ key: column.key, header: column.header, width: column.width }));
  orderedStrategies(strategies).forEach((strategy) => {
    const row = sheet.addRow(Object.fromEntries(editorialColumns.map((column) => [column.key, column.value(strategy)])));
    row.height = 68;
    row.font = { name: 'Arial', size: 10, color: { argb: `FF${colors.navy}` } };
    row.alignment = { vertical: 'top', horizontal: 'left', wrapText: true };
  });
  const header = sheet.getRow(1);
  header.height = 38;
  header.font = { name: 'Arial', size: 10, bold: true, color: { argb: `FF${colors.white}` } };
  header.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
  editorialColumns.forEach((column, index) => {
    const cell = header.getCell(index + 1);
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${column.kind === 'plan' ? colors.teal : column.kind === 'reference' ? '5361A8' : colors.slate}` } };
    cell.border = { bottom: { style: 'medium', color: { argb: `FF${colors.cyan}` } } };
    cell.note = column.help;
  });
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    row.eachCell((cell, columnNumber) => {
      const kind = editorialColumns[columnNumber - 1]?.kind;
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${kind === 'plan' ? colors.paleCyan : kind === 'reference' ? colors.paleBlue : colors.paleSlate}` } };
      cell.border = { bottom: { style: 'thin', color: { argb: `FF${colors.lightBorder}` } } };
    });
  });
  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: Math.max(1, sheet.rowCount), column: editorialColumns.length } };
};

const metadataValue = (strategy: EmailStrategy, key: typeof metadataColumns[number]): string | number => ({
  _strategy_id: strategy.id, _campaign_group_id: strategy.campaignGroupId, _product: strategy.partner, _segment: strategy.segment,
  _week: strategy.weekKey ?? '', _sequence: strategy.sequence ?? '', _base_version: strategy.version, _schema_version: STRATEGY_XLSX_SCHEMA_VERSION,
  papel_na_regua: strategy.roleInRuler ?? '', objetivo_email: strategy.emailObjective ?? '', objecao_trabalhada: strategy.objectionAddressed ?? '', mensagem_chave: strategy.keyMessage ?? '',
  proposta_de_valor: strategy.valueProposition ?? '', beneficio_principal: strategy.primaryBenefit ?? '', beneficios_complementares: strategy.secondaryBenefits.join('\n'),
  prova_sustentacao: strategy.proof ?? '', acao_esperada: strategy.expectedAction ?? '', estrategia_ctas: strategy.ctaStrategy ?? '', hierarquia_visual: strategy.visualHierarchyStrategy ?? '',
  assunto_atual: strategy.subject ?? '', pre_cabecalho_atual: strategy.preheader ?? '', status_editorial: strategy.editorialStatus, status_visual: strategy.visualStatus,
  status_tecnico: strategy.technicalStatus, status_certificacao: strategy.certificationStatus, updated_at: strategy.updatedAt ?? '', updated_by: strategy.updatedBy ?? '',
  updated_by_type: strategy.updatedByType, update_source: strategy.updateSource, change_reason: strategy.changeReason ?? '', llm_model: strategy.llmModel ?? '', llm_run_id: strategy.llmRunId ?? '',
}[key]);

const addMetadataSheet = (workbook: Workbook, strategies: EmailStrategy[], usedNames: Set<string>) => {
  const sheet = workbook.addWorksheet(safeSheetName('_Metadados', usedNames), { views: [{ showGridLines: false }] });
  sheet.state = 'veryHidden';
  sheet.columns = metadataColumns.map((key) => ({ key, header: key, width: key.startsWith('_') ? 30 : 24 }));
  [...strategies].sort((a, b) => naturalSort(a.partner, b.partner) || naturalSort(a.weekKey ?? '', b.weekKey ?? '') || naturalSort(a.sequence ?? '', b.sequence ?? '')).forEach((strategy) => sheet.addRow(Object.fromEntries(metadataColumns.map((key) => [key, metadataValue(strategy, key)]))));
  const header = sheet.getRow(1);
  header.font = { name: 'Arial', size: 10, bold: true, color: { argb: `FF${colors.white}` } };
  header.eachCell((cell) => { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${colors.slate}` } }; });
};

export function buildStrategyPlanWorkbook(ExcelJSRuntime: ExcelRuntime, input: StrategyPlanWorkbookInput): Workbook {
  const { strategies, contexts = [], guardrails = [] } = input;
  if (!strategies.length) throw new Error('Não há estratégias para exportar.');
  const workbook = new ExcelJSRuntime.Workbook();
  workbook.creator = 'Afinz Growth as a Service';
  workbook.company = 'Afinz';
  workbook.subject = `Plano de Comunicação editorial · schema v${STRATEGY_XLSX_SCHEMA_VERSION}`;
  workbook.created = new Date();
  workbook.modified = new Date();
  const usedNames = new Set<string>();
  const products = [...new Set(strategies.map((item) => item.partner))].sort(naturalSort);
  products.forEach((product) => {
    const productStrategies = strategies.filter((item) => item.partner === product);
    const productContexts = contexts.filter((context) => context.partner === product || context.product === product);
    const contextIds = new Set(productContexts.map((context) => context.id));
    const productGuardrails = guardrails.filter((guardrail) => contextIds.has(guardrail.productContextId));
    addOverviewSheet(workbook, safeSheetName(`${product} · Visão`, usedNames), product, productStrategies, productContexts, productGuardrails);
    addEditorialSheet(workbook, safeSheetName(`${product} · E-mails`, usedNames), productStrategies);
  });
  addMetadataSheet(workbook, strategies, usedNames);
  return workbook;
}

const slug = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'produtos';
const isoDay = () => new Date().toISOString().slice(0, 10);
export async function exportStrategyPlanXlsx(input: StrategyPlanWorkbookInput, scopeLabel: string): Promise<string> {
  const ExcelJSModule = await import('exceljs');
  const workbook = buildStrategyPlanWorkbook(ExcelJSModule.default, input);
  const buffer = await workbook.xlsx.writeBuffer();
  const filename = `plano-comunicacao-v2-${slug(scopeLabel)}-${isoDay()}.xlsx`;
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

export const STRATEGY_PLAN_XLSX_EDITORIAL_COLUMNS = editorialColumns.map(({ key, kind }) => ({ key, kind }));
export const STRATEGY_PLAN_XLSX_METADATA_COLUMNS = [...metadataColumns];
