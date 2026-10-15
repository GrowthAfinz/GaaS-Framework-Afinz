import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import fixture from '../fixtures/input_gaas_emails_v2_topo_20261015.json';
import expected from '../fixtures/emailInputV2Expected.json';
import { prepareEmailInput, emailInputSchema, emailInputJsonSchema, inheritEmailCode, type EmailInputContext } from './emailInput';
import { emptyBriefingRow } from './briefing';
import { PLURIX_SIGNATURES, withMeta } from './workspace';
const context = (): EmailInputContext => ({
 briefings: PLURIX_SIGNATURES.map(({key}) => withMeta({...emptyBriefingRow(),SEQUENCIA:'E-mail 2',NM_PRODUTO_INTERNO:key,TP_CAMPANHA:'Topo de Funil',LINK_CTA_1:'https://example.org/S1D02',UTM_CAMPANHA:'PLX_EMAIL2_TEST'}, {partner:'Plurix',segment:fixture.ruler.segment,weekKey:'Semana 1',templateSlotId:'builtin-plurix-v13',status:'draft'})),
 products:[{id:'p',product:'+amigo',partner:'Plurix',status:'active',version:1,differentiators:['5%','70%','40 dias','Visa']}],guardrails:[],
});
describe('gaas-emails-input/1', () => {
 it('valida fixture e exporta JSON Schema', () => { expect(emailInputSchema.safeParse(fixture).success).toBe(true); expect(emailInputJsonSchema().type).toBe('object'); });
 it('reproduz os blocos com os md5 da migration', () => {
  const result=prepareEmailInput(fixture,context());
  for (const [seq,hash] of [['E-mail 3','8'],['E-mail 4','1fad10878e07ad7bd332c281c594da8b']]) {
    const row=result.rows.find(r=>r.sequence===seq)!;
    expect(row.row.COPY_2_PRETO).toBe(expected[seq as keyof typeof expected].COPY_2_PRETO);
    if(hash!=='8') expect(createHash('md5').update(row.row.COPY_2_PRETO).digest('hex')).toBe(hash);
  }
 });
 it('herda link e UTM recursivamente, com rede e semana', () => {
   const result=prepareEmailInput(fixture,context());
   expect(result.rows).toHaveLength(12);
   expect(result.rows.find(r=>r.sequence==='E-mail 4')?.row.LINK_CTA_1).toBe('https://example.org/S2D02');
   expect(result.rows.find(r=>r.sequence==='E-mail 4')?.row.UTM_CAMPANHA).toBe('PLX_EMAIL4_TEST');
   expect(inheritEmailCode('x_EMAIL2_x/S1D02',3,2)).toBe('x_EMAIL3_x/S2D01');
 });
 it('descarta links da IA e avisa', () => {
   const input=structuredClone(fixture); Object.assign(input.emails[0].fields,{LINK_CTA_1:{value:'https://evil.test',origin:'xlsx',source:'chat'}});
   const result=prepareEmailInput(input,context()); expect(result.rows[0].row.LINK_CTA_1).toContain('example.org'); expect(result.problems.some(p=>p.where.endsWith('LINK_CTA_1'))).toBe(true);
 });
 it('substitui o supermercado em todas as redes sem citar marcas em transição', () => {
   const result=prepareEmailInput(fixture,context());
   expect(result.rows.find(r=>r.network==='AMIGAO')?.row.COPY_1_PRETO).toContain('no Amigão');
   expect(result.rows.find(r=>r.network==='COMPRE MAIS')?.row.COPY_1_PRETO).toContain('no seu supermercado');
 });
 it.each(['Compre Mais','Superpão','%%INVESTIDA%%','<img src=x>'])('bloqueia conteúdo %s', value=>{
   const input=structuredClone(fixture); input.emails[0].fields.COPY_1_PRETO.value=value;
   expect(prepareEmailInput(input,context()).problems.some(p=>p.severity==='error')).toBe(true);
 });
 it('bloqueia fatos sem ficha e estado ready',()=>{
   const input=structuredClone(fixture); input.emails[0].factsUsed.push('100%');
   expect(prepareEmailInput(input,context()).problems.some(p=>p.message.includes('100%'))).toBe(true);
   expect(emailInputSchema.safeParse({...fixture,status:'ready'}).success).toBe(false);
 });
});
