import { describe, expect, it } from 'vitest';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { unzipSync, strFromU8 } from 'fflate';
import before from '../fixtures/emailInputV2Before.json';
import { emptyBriefingRow } from '../domain/briefing';
import { withMeta } from '../domain/workspace';
import { PLURIX_V13_TEMPLATE, PLURIX_V13_TEMPLATE_ID } from '../fixtures/plurixV13Template';
import { buildSkillPack, chatGptProjectInstructions, EDITORIAL_FIELDS, markdownBundle, overusedTerms, summarizeRulers, zipSkillPack, type SkillPackContext } from './skillPack';

const SEGMENT = 'V2 TOPO DE FUNIL DINÂMICO';
const context = (): SkillPackContext => ({
  briefings: before.map((b) => withMeta({ ...emptyBriefingRow(), ...b.data }, { partner: 'Plurix', segment: SEGMENT, weekKey: b.weekKey, campaignGroupId: `g-${b.sequence}`, version: 1, status: 'draft', templateSlotId: PLURIX_V13_TEMPLATE_ID })),
  emailStrategies: [], rulers: [], assets: [],
  productContexts: [{ id: 'p', product: '+amigo', partner: 'Plurix', status: 'active', version: 1, differentiators: ['A partir de +5% em produtos selecionados', 'Até 40 dias para pagar', 'É um cartão Visa', 'Programa Você Bem: até 70% em consultas'], toneOfVoice: 'Direto e concreto — sem banco.' }],
  productGuardrails: [],
  templates: [{ id: PLURIX_V13_TEMPLATE_ID, name: 'PLURIX V13', source: PLURIX_V13_TEMPLATE, isPrincipal: false, version: 1, updatedAt: '' } as SkillPackContext['templates'][number]],
});
const key = `Plurix|${SEGMENT}`;

describe('pacote Prompt e IA', () => {
  const pack = buildSkillPack(context(), { rulerKeys: [key], previewNetworks: 'all', includeTemplateSource: false, generatedAt: '2026-10-15T20:00:00.000Z' });

  it('segue o formato de skill: pasta com o nome do SKILL.md', () => {
    const skill = pack.files.find((f) => f.path.endsWith('/SKILL.md'))!;
    expect(pack.skillName).toBe('gaas-emails-plurix');
    expect(pack.files.every((f) => f.path.startsWith('gaas-emails-plurix/'))).toBe(true);
    expect(skill.content).toMatch(/^---\nname: gaas-emails-plurix\ndescription: .{40,1024}\n---/);
    expect(skill.content.split('\n').length).toBeLessThan(500);
    // O upload do claude.ai recusa descrição com qualquer coisa parecida com tag XML.
    expect(skill.content.match(/^description: (.*)$/m)![1]).not.toMatch(/[<>]/);
    expect(pack.files.filter((f) => f.kind === 'md').map((f) => f.content).join('')).not.toContain('—');
    expect(skill.content).toContain('Direto e concreto, sem banco.');
  });

  it('resume a régua com o próximo e-mail e os blocos lidos do HTML', () => {
    const [ruler] = summarizeRulers(context());
    expect(ruler.emails.map((e) => e.sequence)).toEqual(['E-mail 1', 'E-mail 2', 'E-mail 3']);
    expect(ruler.emails[0].blockTypes).toEqual(['lead', 'benefit_grid', 'closing']);
    const regua = pack.files.find((f) => f.path.endsWith('regua-v2-topo-de-funil-dinamico.md'))!.content;
    expect(regua).toContain('E-mail 4, Semana 2');
  });

  it('esqueletos trazem marcadores de cada campo editorial e nenhum AMPscript', () => {
    const skeletons = pack.files.filter((f) => f.kind === 'html');
    expect(skeletons).toHaveLength(4 * 6 * 2);
    const amigao = skeletons.find((f) => f.path.endsWith('e4_amigao_nome.html'))!.content;
    for (const field of ['COPY_1_PRETO', 'COPY_2_PRETO', 'MENSAGEM_LIMITE', 'HEADER_TITULO', 'TITULO_CTA_1'])
      expect(amigao, field).toContain(`@@${field}@@`);
    expect(amigao).not.toMatch(/%%[[=]/);
    expect(amigao).toContain('S2D02');
    expect(amigao).not.toContain('@@BANNER_2_CORPO@@');
    expect(EDITORIAL_FIELDS).not.toContain('LINK_CTA_1');
  });

  it('árvore de temas: lentes, dois pontos de decisão e o que a régua já disse', () => {
    const tree = pack.files.find((f) => f.path.endsWith('references/arvore-de-temas.md'))!.content;
    for (const lens of ['Bolso', 'Rotina', 'Família', 'Orgulho', 'Desconfiança', 'Vizinhança']) expect(tree).toContain(`| ${lens} |`);
    expect(tree).toContain('Ponto de decisão 2');
    expect(tree).toContain('| E-mail 3 |');
    expect(pack.files.find((f) => f.path.endsWith('/SKILL.md'))!.content).toContain('references/arvore-de-temas.md');
  });

  it('anticlichê conta expressão repetida em vários e-mails, sem botão nem vocabulário de benefício', () => {
    const rows = context().briefings.filter((r) => r.NM_PRODUTO_INTERNO === 'AMIGAO');
    const terms = overusedTerms(rows).map((t) => t.term);
    expect(terms.length).toBeGreaterThan(0);
    expect(terms).not.toContain('desconto');
    expect(terms).not.toContain('quero meu');
    expect(terms.every((t) => !t.includes('amigão'))).toBe(true);
  });

  it('gera zip, Markdown único e instruções do ChatGPT dentro do limite', () => {
    const unzipped = unzipSync(zipSkillPack(pack));
    expect(Object.keys(unzipped)).toContain('gaas-emails-plurix/SKILL.md');
    expect(strFromU8(unzipped['gaas-emails-plurix/scripts/content_blocks.py'])).toContain('def benefit_grid');
    expect(markdownBundle(pack)).not.toContain('@@COPY_1_PRETO@@');
    expect(chatGptProjectInstructions(pack).length).toBeLessThan(8000);
    if (process.env.GAAS_PACK_OUT) for (const f of pack.files) { const p = join(process.env.GAAS_PACK_OUT, f.path); mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, f.content); }
  });
});
