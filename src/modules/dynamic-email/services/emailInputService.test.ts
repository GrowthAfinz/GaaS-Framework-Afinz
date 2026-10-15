import { beforeEach, afterAll, describe, expect, it, vi } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import type { WorkspaceBriefing } from '../domain/workspace';
import type { ProductContext } from '../domain/management';
import before from '../fixtures/emailInputV2Before.json';
import fixture from '../fixtures/input_gaas_emails_v2_topo_20261015.json';
import { emptyBriefingRow } from '../domain/briefing';
import { withMeta } from '../domain/workspace';
import { prepareEmailInput } from '../domain/emailInput';
import { planEmailInput, type ConflictChoices } from '../domain/emailInputPlan';
const state=vi.hoisted(()=>({load:async()=>[] as WorkspaceBriefing[],save:async(_entries:unknown)=>[] as WorkspaceBriefing[],authenticated:true}));
vi.mock('../../../services/supabaseClient',()=>({supabase:{auth:{getUser:async()=>({data:{user:state.authenticated?{id:'test-user'}:null},error:null})}}}));
vi.mock('./workspaceService',()=>({loadBriefings:()=>state.load(),loadTemplateSlots:async()=>[{id:'builtin-plurix-v13',source:'test'}],saveBriefings:(entries:unknown)=>state.save(entries)}));
vi.mock('./managementService',()=>({loadProductGovernance:async()=>({contexts:[{id:'p',product:'+amigo',partner:'Plurix',status:'active',version:1,differentiators:['5%','70%','40 dias','Visa']}],guardrails:[]}),loadEmailStrategies:async()=>[],saveEmailStrategy:vi.fn(async(s:unknown)=>s)}));
import { saveEmailInputDrafts } from './emailInputService';
const db=new PGlite();
const products:ProductContext[]=[{id:'p',product:'+amigo',partner:'Plurix',status:'active',version:1,differentiators:['5%','70%','40 dias','Visa']}];
const validInput=()=>{const input=structuredClone(fixture);input.emails[1].fields.HEADER_TITULO.value='Vantagens com o cartão +amigo';return input;};
const choicesFor=(input:unknown,rows:WorkspaceBriefing[])=>{const result=prepareEmailInput(input,{briefings:rows,products,guardrails:[]});const choices:ConflictChoices={};for(const p of planEmailInput(result,rows))for(const d of p.diffs)choices[`${p.importKey}.${d.column}`]='file';return choices;};
beforeEach(async()=>{
 state.authenticated=true;
 await db.exec('drop table if exists versions; drop table if exists briefings; create table briefings(id text primary key,status text,version int,payload jsonb); create table versions(briefing_id text,version int,snapshot jsonb,summary text,primary key(briefing_id,version));');
 for(const b of before){const row=withMeta({...emptyBriefingRow(),...b.data},{partner:'Plurix',segment:fixture.ruler.segment,weekKey:b.weekKey,campaignGroupId:`group-${b.sequence}`,version:1,status:'draft',templateSlotId:'builtin-plurix-v13'});await db.query('insert into briefings values ($1,$2,$3,$4)',[row.__id,'draft',1,JSON.stringify(row)]);}
 state.load=async()=>(await db.query<{payload:WorkspaceBriefing}>('select payload from briefings')).rows.map(r=>r.payload);
 state.save=async(entries)=>{
  const items=entries as Array<{row:WorkspaceBriefing;changeSummary:string}>;
  await db.transaction(async tx=>{for(const {row,changeSummary} of items){await tx.query('insert into briefings values ($1,$2,$3,$4) on conflict(id) do update set status=excluded.status,version=excluded.version,payload=excluded.payload',[row.__id,row.__meta.status,row.__meta.version,JSON.stringify(row)]);await tx.query('insert into versions values ($1,$2,$3,$4)',[row.__id,row.__meta.version,JSON.stringify(row),changeSummary]);}});
  return items.map(e=>e.row);
 };
});
afterAll(()=>db.close());
describe('gravação autenticada de importação em Postgres local',()=>{
 it('grava draft, proveniência e versões; repetir arquivo não duplica nada',async()=>{
  const input=validInput();const reviewed=await state.load();const choices=choicesFor(input,reviewed);
  await saveEmailInputDrafts(JSON.stringify(input),'input.json','a'.repeat(64),choices,reviewed);
  const after=await state.load();expect(after).toHaveLength(24);
  expect(after.filter(r=>r.__meta.importSource)).toHaveLength(12);
  for(const row of after.filter(r=>r.__meta.importSource)){expect(row.__meta.status).toBe('draft');expect(row.__meta.importSource?.approvedBy).toBe('test-user');expect(row.__meta.importSource?.sha256).toBe('a'.repeat(64));}
  expect((await db.query<{count:number}>('select count(*)::int as count from versions')).rows[0].count).toBe(12);
  await saveEmailInputDrafts(JSON.stringify(input),'input.json','a'.repeat(64),{},after);
  expect((await state.load())).toHaveLength(24);expect((await db.query<{count:number}>('select count(*)::int as count from versions')).rows[0].count).toBe(12);
 });
 it('recusa sessão ausente, estado alterado e fixture histórica bloqueada antes de gravar',async()=>{
  const reviewed=await state.load();const input=validInput();const choices=choicesFor(input,reviewed);
  state.authenticated=false;await expect(saveEmailInputDrafts(JSON.stringify(input),'x','a'.repeat(64),choices,reviewed)).rejects.toThrow('Sessão');state.authenticated=true;
  await expect(saveEmailInputDrafts(JSON.stringify(input),'x','a'.repeat(64),choices,[])).rejects.toThrow('mudou');
  await expect(saveEmailInputDrafts(JSON.stringify(fixture),'x','a'.repeat(64),choices,reviewed)).rejects.toThrow('bloqueios');
  expect((await db.query<{count:number}>('select count(*)::int as count from versions')).rows[0].count).toBe(0);
 });
});
