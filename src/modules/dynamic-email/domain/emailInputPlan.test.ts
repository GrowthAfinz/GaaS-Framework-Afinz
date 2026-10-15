import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import before from '../fixtures/emailInputV2Before.json';
import fixture from '../fixtures/input_gaas_emails_v2_topo_20261015.json';
import expected from '../fixtures/emailInputV2Expected.json';
import { prepareEmailInput, type EmailInputContext } from './emailInput';
import { planEmailInput, emailInputSource, type ConflictChoices } from './emailInputPlan';
import { emptyBriefingRow } from './briefing';
import { withMeta } from './workspace';
const rows=()=>before.map((b,i)=>withMeta({...emptyBriefingRow(),...b.data},{partner:'Plurix',segment:fixture.ruler.segment,weekKey:b.weekKey,campaignGroupId:`group-${b.sequence}`,version:1,status:'draft',templateSlotId:'builtin-plurix-v13'}));
const context=(briefings=rows()):EmailInputContext=>({briefings,products:[{id:'p',product:'+amigo',partner:'Plurix',status:'active',version:1,differentiators:['5%','70%','40 dias','Visa']}],guardrails:[]});
describe('ida e volta V2',()=>{
 it('reproduz todos os campos comuns dos E-mails 3 e 4 da migration',()=>{
  const result=prepareEmailInput(fixture,context());
  for(const seq of ['E-mail 3','E-mail 4'] as const) for(const row of result.rows.filter(r=>r.sequence===seq)) for(const [field,value] of Object.entries(expected[seq])) expect(row.row[field as keyof typeof row.row],`${seq}.${row.network}.${field}`).toBe(value);
 });
 it('confere todos os md5 de E-mails 3 e 4 no bloco de verificação da migration',()=>{
  const sql=readFileSync(new URL('../../../../supabase/migrations/20261016010000_dynamic_email_v2_emails_3_4.sql',import.meta.url),'utf8');
  const result=prepareEmailInput(fixture,context());
  const pattern=/briefing_data->>'SEQUENCIA' = \$gaas\$(E-mail [34])\$gaas\$(?: and briefing_data->>'NM_PRODUTO_INTERNO' = \$gaas\$(.*?)\$gaas\$)? and md5\(coalesce\(briefing_data->>\$gaas\$(.*?)\$gaas\$, ''\)\) <> '([0-9a-f]+)'/g;
  const checks=[...sql.matchAll(pattern)];expect(checks.length).toBe(16);
  for(const [,sequence,network,field,hash] of checks) for(const {row} of result.rows.filter(r=>r.sequence===sequence&&(!network||r.network===network))) expect(createHash('md5').update(row[field as keyof typeof row] as string).digest('hex'),`${sequence}.${network}.${field}`).toBe(hash);
 });
 it('mantém o bloqueio editorial histórico do header e4 explícito',()=>{
  const result=prepareEmailInput(fixture,context());
  expect(result.problems.filter(p=>p.severity==='error').every(p=>p.where.endsWith('HEADER_TITULO'))).toBe(true);
  expect(result.problems.filter(p=>p.severity==='error')).toHaveLength(6);
 });
 it('não duplica nem muda versão na reimportação; preserva edição feita no GaaS',()=>{
  const initial=rows(); const prepared=prepareEmailInput(fixture,context(initial));
  const first=planEmailInput(prepared,initial);const choices:ConflictChoices={};for(const p of first)for(const d of p.diffs)choices[`${p.importKey}.${d.column}`]='file';
  const applied=planEmailInput(prepared,initial,choices).map(p=>withMeta(p.next,{partner:'Plurix',segment:fixture.ruler.segment,templateSlotId:'builtin-plurix-v13',status:'draft',version:2,importSource:emailInputSource(prepared.payload!,p,'input.json','a'.repeat(64),'tester','2026-10-15T12:00:00Z')}));
  const rest=initial.filter(r=>!applied.some(a=>a.__id===r.__id));const after=[...rest,...applied];
  expect(planEmailInput(prepareEmailInput(fixture,context(after)),after).every(p=>p.action==='unchanged')).toBe(true);
  const edited=after.map(r=>r.__id===applied[0].__id?{...r,ASSUNTO:'Edição da pessoa no GaaS'}:r);
  const repeated=planEmailInput(prepareEmailInput(fixture,context(edited)),edited);
  expect(repeated.find(p=>p.existingId===applied[0].__id)?.next.ASSUNTO).toBe('Edição da pessoa no GaaS');
 });
});
