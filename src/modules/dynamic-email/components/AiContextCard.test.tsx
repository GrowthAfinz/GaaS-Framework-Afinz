import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { AiContextCard } from './AiContextCard';
import { emptyBriefingRow } from '../domain/briefing';
import { withMeta, type WorkspaceBriefing } from '../domain/workspace';

const briefing = (partner: string): WorkspaceBriefing => {
  const row = emptyBriefingRow();
  Object.assign(row, { NM_PRODUTO_INTERNO: partner.toUpperCase(), TP_CAMPANHA: 'CRM', SEQUENCIA: 'E-mail 1', ASSUNTO: 'Teste' });
  return withMeta(row, { partner, segment: 'CRM', subgroup: partner, weekKey: 'Semana 1', activityNames: [], campaignGroupId: `grp-${partner}`, status: 'needs_review', version: 1 });
};

const props = {
  briefings: [briefing('Bem Barato'), briefing('Dia')],
  emailStrategies: [], rulers: [], segments: [], productContexts: [], productGuardrails: [],
  assets: [], legalTexts: [], templates: [], signatureSettings: [], reviewRuns: [], reviewSuggestions: [],
};

describe('AiContextCard', () => {
  it('monta com o botão, o seletor de escopo e a opção de template', () => {
    const html = renderToStaticMarkup(<AiContextCard {...props}/>);
    expect(html).toContain('Contexto para trabalhar com IA');
    expect(html).toContain('Baixar contexto para IA (.md)');
    expect(html).toContain('Fábrica inteira');
    expect(html).toContain('Bem Barato');
    expect(html).toContain('Incluir o AMPscript dos templates');
    expect(html).toContain('não contém dados pessoais nem credenciais.'.replace('não', 'Não'));
  });

  it('usa o parceiro em foco como escopo padrão', () => {
    const html = renderToStaticMarkup(<AiContextCard {...props} defaultPartner="Dia"/>);
    expect(html).toMatch(/<option value="Dia" selected=""|<select[^>]*>/);
    expect(html).toContain('tokens');
  });

  it('mostra a estimativa de peso antes do clique', () => {
    expect(renderToStaticMarkup(<AiContextCard {...props}/>)).toMatch(/KB · ~[\d.]+ tokens/);
  });

  it('não quebra com workspace vazio', () => {
    const html = renderToStaticMarkup(<AiContextCard {...props} briefings={[]}/>);
    expect(html).toContain('Baixar contexto para IA (.md)');
  });
});
