import { describe, expect, it } from 'vitest';
import { buildAiContextMarkdown, type AiContextMarkdownInput } from './aiContextMarkdown';
import { BRIEFING_COLUMNS, emptyBriefingRow } from '../domain/briefing';
import { withMeta, type WorkspaceBriefing } from '../domain/workspace';

const GENERATED_AT = '2026-09-04T12:00:00.000Z';

const briefing = (partner: string, sequence: string, patch: Record<string, string> = {}): WorkspaceBriefing => {
  const row = emptyBriefingRow();
  row.__id = `${partner}-${sequence}`;
  Object.assign(row, {
    NM_PRODUTO_INTERNO: partner.toUpperCase(), TP_CAMPANHA: 'CRM', SEQUENCIA: sequence,
    ASSUNTO: `Assunto ${sequence}`, PRE_CABECALHO: `Pré ${sequence}`,
    COPY_1_PRETO: 'Olá, %%=v(@FirstName)=%%', TITULO_CTA_1: 'Pedir meu cartão',
    LINK_CTA_1: 'https://exemplo.onelink.me/abc', NOTA_LEGAL: 'Sujeito à aprovação de crédito.',
    ...patch,
  });
  return withMeta(row, {
    partner, segment: 'CRM', subgroup: partner, weekKey: 'Semana 1',
    activityNames: [], campaignGroupId: `grp-${partner}-${sequence}`,
    status: 'needs_review', version: 1, templateSlotId: 'tpl-1',
  });
};

const base = (patch: Partial<AiContextMarkdownInput> = {}): AiContextMarkdownInput => ({
  generatedAt: GENERATED_AT,
  scope: { kind: 'all' },
  briefings: [briefing('Bem Barato', 'E-mail 1'), briefing('Dia', 'E-mail 1')],
  emailStrategies: [],
  rulers: [],
  segments: [],
  productContexts: [],
  productGuardrails: [],
  assets: [],
  legalTexts: [],
  templates: [{ id: 'tpl-1', name: 'Template teste', source: '%%[ SET @Assunto = Field(@Row, "ASSUNTO") ]%%<html></html>', isPrincipal: true, version: 1, updatedAt: GENERATED_AT }],
  signatureSettings: [],
  reviewRuns: [],
  reviewSuggestions: [],
  ...patch,
});

describe('buildAiContextMarkdown', () => {
  it('documenta as 36 colunas na ordem oficial', () => {
    const { content } = buildAiContextMarkdown(base());
    for (const column of BRIEFING_COLUMNS) {
      expect(content, `coluna ausente: ${column}`).toContain(`\`${column}\``);
    }
    const positions = BRIEFING_COLUMNS.map((column) => content.indexOf(`| \`${column}\` |`));
    expect(positions.every((value) => value > 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
    expect(BRIEFING_COLUMNS).toHaveLength(36);
  });

  it('traz a chave composta e as duas Data Extensions', () => {
    const { content } = buildAiContextMarkdown(base());
    expect(content).toContain('NM_PRODUTO_INTERNO');
    expect(content).toContain('TB_CAMPANHA_AQUISICAO');
    expect(content).toContain('TB_BRIEFING_CAMPANHA_AQUISICAO');
    expect(content).toContain('LookupOrderedRows');
  });

  it('avisa sobre ELSEIF e as demais limitações do renderer local', () => {
    const { content } = buildAiContextMarkdown(base());
    expect(content).toContain('ELSEIF');
    expect(content).toContain('não o interpreta e não o denuncia');
    for (const unsupported of ['FOR', 'WHILE', 'ContentBlockByKey', 'InsertDE', 'UpdateDE']) {
      expect(content).toContain(unsupported);
    }
  });

  it('registra os defeitos recorrentes das réguas de origem', () => {
    const { content } = buildAiContextMarkdown(base());
    expect(content).toContain('%%FIRST_NAME%%');
    expect(content).toContain('%%=v(@FirstName)=%%');
    expect(content).toContain('af_sub2');
  });

  it('documenta os dois modos de navegação e a regra de múltiplos CTAs', () => {
    const { content } = buildAiContextMarkdown(base());
    expect(content).toContain('Por parceiro:');
    expect(content).toContain('Por jornada:');
    expect(content).toContain('Mais de um CTA **não** é problema por si só');
  });

  it('exige Test Send e separa ready de certificado', () => {
    const { content } = buildAiContextMarkdown(base());
    expect(content).toContain('Test Send');
    expect(content).toContain('sfmc_certified');
    expect(content).toContain('sfmc_certification_required: true');
  });

  it('filtra pelo escopo do parceiro', () => {
    const { content, filename } = buildAiContextMarkdown(base({ scope: { kind: 'partner', partner: 'Bem Barato' } }));
    expect(content).toContain('Bem Barato');
    expect(content).not.toContain('| Assunto E-mail 1 |'.replace('Assunto', 'Dia Assunto'));
    expect(content.split('## 19. E-mails do escopo')[1] ?? '').not.toContain('· Dia ·');
    expect(filename).toBe('Contexto_Fabrica_de_Emails_Afinz_bem-barato_2026-09-04.md');
  });

  it('gera nome de arquivo sem sufixo quando o escopo é a fábrica inteira', () => {
    expect(buildAiContextMarkdown(base()).filename).toBe('Contexto_Fabrica_de_Emails_Afinz_2026-09-04.md');
  });

  it('é determinístico para a mesma entrada', () => {
    expect(buildAiContextMarkdown(base()).content).toBe(buildAiContextMarkdown(base()).content);
  });

  it('não vaza CPF, e-mail pessoal, token nem credencial', () => {
    const { content, redactions } = buildAiContextMarkdown(base({
      briefings: [briefing('Bem Barato', 'E-mail 1', {
        COPY_1_PRETO: 'Cliente 529.982.247-25 no e-mail fulano.teste@gmail.com',
        RODAPE: 'Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.abcdefghij.klmnopqrst e SUPABASE_SERVICE_ROLE_KEY=xyz',
      })],
    }));
    expect(content).not.toMatch(/\d{3}\.\d{3}\.\d{3}-\d{2}/);
    expect(content).not.toContain('fulano.teste@gmail.com');
    expect(content).not.toContain('eyJhbGciOiJIUzI1NiJ9');
    expect(content).toContain('[CPF REMOVIDO]');
    expect(content).toContain('[E-MAIL REMOVIDO]');
    expect(redactions).toBeGreaterThanOrEqual(3);
  });

  it('escapa pipe para não quebrar tabela', () => {
    const { content } = buildAiContextMarkdown(base({
      briefings: [briefing('Bem Barato', 'E-mail 1', { ASSUNTO: 'Antes | depois | agora' })],
    }));
    expect(content).toContain('Antes \\| depois \\| agora');
    // o pipe escapado não pode contar como separador de coluna
    const splitUnescaped = (line: string) => line.split(/(?<!\\)\|/).filter((part) => part.trim());
    for (const line of content.split('\n').filter((row) => row.startsWith('| `ASSUNTO`'))) {
      expect(splitUnescaped(line).length).toBe(2);
    }
  });

  it('escolhe fence maior que crases internas do template', () => {
    const { content } = buildAiContextMarkdown(base({
      includeTemplateSource: true,
      templates: [{ id: 'tpl-1', name: 'Com crase', source: 'linha ``` interna', isPrincipal: true, version: 1, updatedAt: GENERATED_AT }],
    }));
    expect(content).toContain('````html');
  });

  it('omite seção sem dado e lista a omissão', () => {
    const { content, omittedSections } = buildAiContextMarkdown(base());
    expect(content).toContain('Seções omitidas neste snapshot');
    expect(omittedSections.some((item) => item.startsWith('22.'))).toBe(true);
    expect(content).not.toContain('## 23. Textos legais governados');
  });

  it('funciona com workspace vazio', () => {
    const { content, bytes } = buildAiContextMarkdown(base({ briefings: [], templates: [] }));
    expect(bytes).toBeGreaterThan(1000);
    expect(content).toContain('| E-mails editoriais | 0 |');
    expect(content).toContain('Seções omitidas neste snapshot');
  });

  it('só inclui o AMPscript quando pedido', () => {
    expect(buildAiContextMarkdown(base()).content).toContain('AMPscript integral não foi incluído');
    const withSource = buildAiContextMarkdown(base({ includeTemplateSource: true }));
    expect(withSource.content).toContain('SET @Assunto = Field(@Row, "ASSUNTO")');
    expect(withSource.includedTemplateSource).toBe(true);
  });

  it('preserva acentuação e estima tokens', () => {
    const { content, estimatedTokens, bytes } = buildAiContextMarkdown(base());
    expect(content).toContain('Pré-cabeçalho');
    expect(content).toContain('não');
    expect(estimatedTokens).toBeGreaterThan(0);
    expect(bytes).toBeGreaterThan(estimatedTokens);
  });

  it('reporta campos do template usados e não usados', () => {
    const { content } = buildAiContextMarkdown(base());
    expect(content).toContain('1 de 36');
    expect(content).toContain('campos não lidos por este template');
  });
});
