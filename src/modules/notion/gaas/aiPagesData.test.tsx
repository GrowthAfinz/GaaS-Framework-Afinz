import { describe, expect, it, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

vi.mock('../../../services/supabaseClient', () => ({ supabase: {} }));

import {
  agentCounts, cardDraft, filterPages, fromCrm, fromInvestigation, fromMedia, fromProposal, plain, sectionCount, statusOf,
  type CrmInsightRow, type InvestigationRow, type MediaInsightRow, type ProposalRow,
} from './aiPagesData';
import { AiPages } from './AiPages';

// Dados sintéticos: nenhum número ou texto real das tabelas.
const NOW = new Date('2026-11-26T12:00:00Z');
const crm: CrmInsightRow = {
  id: 'c1', titulo: 'Canal X parado no segmento Y', tipo: 'oportunidade', severidade: 'critico', confianca: 'alta',
  periodo_inicio: '2026-05-13', periodo_fim: '2026-06-09', bu: 'B2C', canal: 'E-mail', segmento: 'Segmento Y',
  sinal: 'O segmento Y fez 10 disparos — nenhum de e-mail.', impacto: 'Custo alto.', causa_provavel: 'Régua antiga.',
  evidencia: { cartoes: 1234, canais_zerados: ['E-mail'] }, acao: 'Adicionar onda de e-mail.', criterio_sucesso: 'Conversão +1 ponto em 2 safras.',
  status: 'ativo', fonte: 'skill', gerado_em: '2026-06-11T10:00:00Z',
};
const media: MediaInsightRow = {
  id: 'm1', generated_at: '2026-11-10T10:00:00Z', period_start: '2026-10-10', period_end: '2026-11-03', score: 80, channel: 'meta',
  campaign: 'Campanha Seguro Teste', adset_name: 'Conjunto A', ad_name: 'Criativo 2', tipo: 'risco', contexto: 'Gasto subiu.',
  mudanca: 'Criativo 2 gastou mais com menos cliques. Segunda frase.', causa: 'Fadiga.', acoes: ['Pausar criativo', 'Testar novo'], evidencias: { cpa: 10.5 }, status: 'ativo',
};
const inv: InvestigationRow = {
  id: 'i1', investigation_id: 'g1', evidence_id: 'e1', created_at: '2026-10-20T10:00:00Z', agent_metadata: { name: 'codex' }, reviewed: true, period: '2026-10-28',
  body: { status: 'conclusive', summary: 'Volume caiu por mix de bases. Detalhe.', facts: [{ text: 'Fato A' }], hypotheses: [{ text: 'Hipótese B' }], limitations: ['Limite C'], next_checks: ['Checar D'],
    candidate: { title: 'Rever bases acionadas', action: 'Reabrir base E', metric: 'cartões', success_criterion: 'Voltar ao patamar' } },
};
const prop: ProposalRow = {
  id: 'p1', source_ref: 'AppsFlyer', front: 'crm_acquisition', bucket: 'Investigar', title: 'Provar campo no raw data', problem: 'Campo some.',
  evidence: 'Amostra pequena.', action_text: 'Puxar raw data.', metric_name: null, confidence_status: 'suspect', reading_limit: 'Só um mês.',
  lifecycle_status: 'open', created_at: '2026-09-23T10:00:00Z',
};
const pages = [fromCrm(crm), fromMedia(media), fromInvestigation(inv), fromProposal(prop)];

describe('validade e status', () => {
  it('insight de CRM vence em 30 dias e aparece como vencida', () => {
    const p = fromCrm(crm);
    expect(p.validUntil).toBe('2026-07-11T10:00:00.000Z');
    expect(statusOf(p, NOW)).toBe('vencida');
  });
  it('insight de mídia vale 30 dias e fica Para revisar enquanto ninguém revisou', () => {
    const p = fromMedia(media);
    expect(p.validUntil?.slice(0, 10)).toBe('2026-12-10');
    expect(statusOf(p, NOW)).toBe('revisar');
    expect(statusOf({ ...p, reviewed: true }, NOW)).toBe('valida');
  });
  it('investigação vale 45 dias e decisão humana conta como revisão', () => {
    const p = fromInvestigation(inv);
    expect(p.validUntil?.slice(0, 10)).toBe('2026-12-04');
    expect(statusOf(p, NOW)).toBe('valida');
    expect(p.executor).toBe('codex');
  });
  it('proposta não vence', () => {
    const p = fromProposal(prop);
    expect(p.validUntil).toBeNull();
    expect(statusOf(p, new Date('2030-01-01'))).toBe('revisar');
  });
});

describe('conteúdo', () => {
  it('tira travessão dos textos dos agentes', () => {
    expect(fromCrm(crm).signal).not.toMatch(/[—–]/);
    expect(plain('a — b')).toBe('a, b');
  });
  it('mídia usa a primeira frase como título e vai para Seguros pela campanha', () => {
    const p = fromMedia(media);
    expect(p.title).toBe('Criativo 2 gastou mais com menos cliques');
    expect(p.frontKey).toBe('se');
    expect(p.action).toBe('• Pausar criativo\n• Testar novo');
  });
  it('evidência vira linhas legíveis', () => {
    expect(fromCrm(crm).evidence).toContain('cartoes: 1.234');
    expect(fromCrm(crm).evidence).toContain('canais zerados: E-mail');
  });
});

describe('filtros', () => {
  it('conta por subpágina e esconde nada que venceu', () => {
    expect(sectionCount(pages, 'todas')).toBe(4);
    expect(sectionCount(pages, 'analises')).toBe(0);
    expect(sectionCount(pages, 'planos')).toBe(1);
    expect(filterPages(pages, { section: 'todas', agent: '', kind: '', status: 'vencida' }, NOW).map(p => p.key)).toEqual(['crm:c1']);
  });
  it('chips de agente incluem quem aparece em agent_metadata', () => {
    const counts = Object.fromEntries(agentCounts(pages).map(a => [a.agent, a.count]));
    expect(counts).toMatchObject({ 'gaas-insight-engine': 1, 'gaas-growth-investigation': 1, 'paid-media-campaign-analyst': 1, curadoria: 1, codex: 1 });
    expect(filterPages(pages, { section: 'todas', agent: 'codex', kind: '', status: '' }, NOW)).toHaveLength(1);
  });
});

describe('virar card', () => {
  it('leva título, ação, critério de sucesso e frente', () => {
    const d = cardDraft(fromCrm(crm));
    expect(d.title).toBe('Canal X parado no segmento Y');
    expect(d.description).toContain('Ação: Adicionar onda de e-mail.');
    expect(d.acceptance_criteria).toEqual(['Conversão +1 ponto em 2 safras.']);
    expect(d.front_key).toBe('aq');
    expect(d.priority).toBe('P1');
    expect(d.details).toEqual({ ai_page: 'crm:c1', ai_source: 'crm_insights', ai_source_id: 'c1' });
    expect(d.description).not.toMatch(/[—–]/);
    expect(d.description).toContain('insight de CRM de gaas-insight-engine');
  });
  it('sem critério não inventa critério', () => {
    expect(cardDraft(fromMedia(media)).acceptance_criteria).toEqual([]);
  });
});

describe('tela', () => {
  const base = { failed: [], cards: [], fronts: [], canEdit: true, onOpen: () => undefined, onSection: () => undefined, onRetry: () => undefined,
    onTurnIntoCard: async () => undefined, onOpenTask: () => undefined, now: NOW };
  it('lista com colunas e contagens', () => {
    const html = renderToStaticMarkup(<AiPages {...base} section="todas" pages={pages} openKey={null} />);
    for (const h of ['Página', 'Tipo', 'Frente', 'Agente', 'Fonte e validade', 'Status']) expect(html).toContain(h);
    expect(html).toContain('Canal X parado no segmento Y');
    expect(html).toContain('Vencida');
    expect(html).not.toMatch(/[—–]/);
  });
  it('página aberta mostra o dossiê, o selo de vencida e o botão Virar card', () => {
    const html = renderToStaticMarkup(<AiPages {...base} section="todas" pages={pages} openKey="crm:c1" />);
    for (const t of ['Sinal', 'Impacto', 'Causa provável', 'Ação', 'Critério de sucesso', 'Evidência', 'Virar card', 'Vencida desde 11/07']) expect(html).toContain(t);
  });
  it('com card ligado troca para Abrir card', () => {
    const html = renderToStaticMarkup(<AiPages {...base} cards={[{ id: 't1', title: 'Card X', key: 'crm:c1' }]} section="todas" pages={pages} openKey="crm:c1" />);
    expect(html).toContain('Abrir card');
    expect(html).not.toContain('Virar card');
  });
  it('Análises vazia explica o porquê', () => {
    const html = renderToStaticMarkup(<AiPages {...base} section="analises" pages={pages} openKey={null} />);
    expect(html).toContain('Nenhuma análise salva aqui ainda');
  });
});
