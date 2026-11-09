import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
const admin='11111111-1111-4111-8111-111111111111',other='22222222-2222-4222-8222-222222222222';
const note='33333333-3333-4333-8333-333333333333';
const migration=readFileSync('supabase/migrations/'+readdirSync('supabase/migrations').find(f=>f.endsWith('_wiki_strategy_pilot.sql')),'utf8');
const original='---\ntitle: Fonte original\n---\n# Estratégia\n\n[[Nota|Alias]]\n\n```sql\nSELECT 1;\n```';
const initial={title:'Estratégia Visa',summary:'Resumo',blocks:[{id:'intencao',type:'markdown',title:'Intenção',content:'Conteúdo original'}],taskLayout:{hidden:[],order:[]}};
async function setup(){
 const db=new PGlite();
 await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create schema gaas_security;create function gaas_security.is_approved_member() returns boolean language sql stable as $$select coalesce(current_setting('test.approved',true),'true')='true'$$;grant usage on schema gaas_security to authenticated;grant execute on function gaas_security.is_approved_member() to authenticated;
 create table auth.users(id uuid primary key);insert into auth.users values('${admin}'),('${other}');
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 create function public.gaas_vault_is_admin() returns boolean language sql stable as $$select auth.uid()='${admin}'::uuid$$;
 grant usage on schema public,auth to authenticated,anon;
 grant execute on function auth.uid(),public.gaas_vault_is_admin() to authenticated;
 create table public.gaas_vault_notes(id uuid primary key,relative_path text,content_hash text,content_markdown text,deleted_at timestamptz);
 `);
 await db.query('insert into gaas_vault_notes values($1,$2,$3,$4,null)',[note,'05-Estrategia/Estrategia-Pool-de-Ofertas-Visa.md','base',original]);
 await db.exec(migration);
 await db.exec(readFileSync('supabase/migrations/20261106204000_wiki_strategy_pilot_member_gate.sql','utf8'));
 await db.exec(readFileSync('supabase/migrations/20261107001500_wiki_strategy_notes.sql','utf8'));await db.exec(readFileSync('supabase/migrations/20261109141118_insurance_strategy_task_binding.sql','utf8'));
 await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub','${admin}',false);`);
 const save=async(doc,revision=0,hash='base',request=crypto.randomUUID(),reconcile=false)=>(await db.query('select public.gaas_wiki_pilot_save($1,$2,$3,$4,$5,$6,$7) r',[note,revision,hash,JSON.stringify(doc),request,'Teste',reconcile])).rows[0].r;
 return{db,save};
}
test('pilot saves exact source, revisions and recoverable deletion, without touching the vault',async()=>{
 const {db,save}=await setup();try{
 const first=await save(initial);assert.equal(first.revision,1);
 const rows=(await db.query('select * from gaas_wiki_pilot_revisions order by revision')).rows;
 assert.equal(rows.length,2);assert.equal(rows[0].source_markdown,original);assert.equal(rows[1].actor_id,admin);
 const removed=await save({...initial,blocks:[],taskLayout:{hidden:['VDV-PLAN-1'],order:[]}},1);assert.equal(removed.document.blocks.length,0);
 const restored=await save(first.document,2);assert.equal(restored.revision,3);assert.equal(restored.document.blocks.length,1);
 await db.exec('reset role');assert.equal((await db.query('select content_markdown from gaas_vault_notes')).rows[0].content_markdown,original);
 }finally{await db.close();}
});
test('concurrent writes, retries and changed source require explicit reconciliation',async()=>{
 const{db,save}=await setup();try{
 const id=crypto.randomUUID();await save(initial,0,'base',id);
 await assert.rejects(save({...initial,title:'Outro'},0),/revision_conflict/);
 await save({...initial,title:'Nova versão'},1);
 assert.equal((await save(initial,0,'base',id)).revision,2);
 await assert.rejects(save({...initial,title:'Reuso'},0,'base',id),/request_reused/);
 await db.exec("reset role;update gaas_vault_notes set content_hash='updated',content_markdown='Fonte nova';set role authenticated;");
 await assert.rejects(save(initial,2,'base'),/source_conflict/);
 await assert.rejects(save(initial,2,'updated'),/source_conflict/);
 const reconciled=await save(initial,2,'updated',crypto.randomUUID(),true);assert.equal(reconciled.revision,3);
 const prior=(await db.query('select source_markdown from gaas_wiki_pilot_revisions where revision=2')).rows[0];assert.equal(prior.source_markdown,original);
 }finally{await db.close();}
});
test('anonymous and non-admin writes are denied; append-only history cannot be rewritten',async()=>{
 const{db,save}=await setup();try{
 await save(initial);
 await assert.rejects(db.exec("update gaas_wiki_pilot_revisions set reason='Hacked'"),/permission denied/);
 await db.exec(`select set_config('request.jwt.claim.sub','${other}',false)`);
 await assert.rejects(save(initial,1),/access_denied/);
 assert.equal((await db.query('select * from gaas_wiki_pilot_revisions')).rows.length,0);
 assert.equal((await db.query('select * from gaas_wiki_pilot_documents')).rows.length,1);
 await db.exec("select set_config('test.approved','false',false)");
 assert.equal((await db.query('select * from gaas_wiki_pilot_documents')).rows.length,0);
 await db.exec(`select set_config('request.jwt.claim.sub','${admin}',false)`);
 await assert.rejects(save(initial,1),/access_denied/);
 await db.exec("reset role;set role anon;select set_config('request.jwt.claim.sub','',false)");
 await assert.rejects(save(initial,1),/permission denied/);
 await assert.rejects(db.query('select * from gaas_wiki_pilot_documents'),/permission denied/);
 }finally{await db.close();}
});
test('malformed payloads and duplicate blocks are rejected transactionally',async()=>{
 const{db,save}=await setup();try{
 await assert.rejects(save({...initial,blocks:[initial.blocks[0],initial.blocks[0]]}),/duplicate_block/);
 await assert.rejects(save({...initial,taskLayout:{hidden:'wrong',order:[]}}),/invalid_layout/);
 await assert.rejects(save({...initial,blocks:[{id:'x',type:'script',title:'Unsafe',content:'...'}]}),/invalid_block/);
 assert.equal((await db.query('select * from gaas_wiki_pilot_revisions')).rows.length,0);
 }finally{await db.close();}
});

test('strategy folder is enabled enables insurance binding but denies other folders',async()=>{
 const{db,save}=await setup();try{
 await db.exec("reset role;update gaas_vault_notes set relative_path='05-Estrategia/Estrategia-de-Segmentacao-de-Seguros.md';set role authenticated;");
 assert.equal((await save(initial)).revision,1);
 assert.equal((await save({...initial,blocks:[{id:'insurance',type:'tasks',title:'Seguros',content:''}]},1)).revision,2);
 await db.exec("reset role;update gaas_vault_notes set relative_path='04-Operacao/Outro.md';set role authenticated;");
 await assert.rejects(save(initial,2),/note_not_enabled/);
 }finally{await db.close();}
});
