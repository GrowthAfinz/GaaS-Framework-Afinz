import { describe, expect, it } from 'vitest';
import { buildEmailAiPack } from './emailAiPack';
import { emailInputSchema, prepareEmailInput } from '../domain/emailInput';
import before from '../fixtures/emailInputV2Before.json';
import { withMeta } from '../domain/workspace';
import { emptyBriefingRow } from '../domain/briefing';
import { PLURIX_V13_TEMPLATE } from '../fixtures/plurixV13Template';
import type { AiContextMarkdownInput } from './aiContextMarkdown';
const context=():Omit<AiContextMarkdownInput,'scope'|'generatedAt'>=>({briefings:before.map(b=>withMeta({...emptyBriefingRow(),...b.data},{partner:'Plurix',segment:'V2 TOPO DE FUNIL DINÂMICO',weekKey:b.weekKey,templateSlotId:'builtin-plurix-v13',status:'draft'})),rulers:[],emailStrategies:[],segments:[],assets:[],legalTexts:[],templates:[{id:'builtin-plurix-v13',name:'V13',source:PLURIX_V13_TEMPLATE,isPrincipal:true,version:1}],signatureSettings:[],productContexts:[{id:'p',product:'+amigo',partner:'Plurix',status:'active',version:1,differentiators:['5%','40 dias','70%','Visa']}],productGuardrails:[],reviewRuns:[],reviewSuggestions:[]});
describe('pacote Prompt e IA',()=>{
 it('inclui schema e exemplo válido e kit estático sem AMPscript',()=>{
  const c=context();const pack=buildEmailAiPack(c,{scope:'both',rulers:['Plurix|V2 TOPO DE FUNIL DINÂMICO'],includeTemplateSource:false});
  const jsonBlocks=[...pack.content.matchAll(/```json\n([\s\S]*?)\n```/g)].map(m=>JSON.parse(m[1]));
  const example=jsonBlocks.find(j=>j.contract==='gaas-emails-input/1');expect(emailInputSchema.safeParse(example).success).toBe(true);
  expect(prepareEmailInput(example,{briefings:c.briefings,products:c.productContexts,guardrails:c.productGuardrails}).problems.filter(p=>p.severity==='error')).toEqual([]);
  const html=pack.content.match(/```html\n([\s\S]*?)\n```/)?.[1];expect(html).toBeTruthy();expect(html).not.toContain('%%[');
  expect(pack.bytes).toBe(new TextEncoder().encode(pack.content).length);expect(pack.estimatedTokens).toBeGreaterThan(0);
 });
 it('separa skill e réguas, e respeita a opção AMPscript',()=>{
  const c=context();const skill=buildEmailAiPack(c,{scope:'skill',rulers:[],includeTemplateSource:false});
  expect(skill.content).toContain('Catálogo de blocos');
  const rulers=buildEmailAiPack(c,{scope:'rulers',rulers:['Plurix|V2 TOPO DE FUNIL DINÂMICO'],includeTemplateSource:false});
  expect(rulers.content).not.toContain('## Papel e fluxo');expect(rulers.content).toContain('V2 TOPO DE FUNIL DINÂMICO');
  const full=buildEmailAiPack(c,{scope:'both',rulers:['Plurix|V2 TOPO DE FUNIL DINÂMICO'],includeTemplateSource:true});expect(full.bytes).toBeGreaterThan(rulers.bytes);
 });
 it('redige dados pessoais vindos de texto livre',()=>{
  const c=context();c.productContexts[0].brandContext='Cliente teste@example.com CPF 123.456.789-00';
  const pack=buildEmailAiPack(c,{scope:'skill',rulers:[],includeTemplateSource:false});expect(pack.content).not.toContain('teste@example.com');expect(pack.content).not.toContain('123.456.789-00');
 });
});
