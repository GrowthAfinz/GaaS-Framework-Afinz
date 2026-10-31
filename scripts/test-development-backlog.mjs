import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
const admin='11111111-1111-4111-8111-111111111111',other='22222222-2222-4222-8222-222222222222';
const migration=readFileSync('supabase/migrations/'+readdirSync('supabase/migrations').find(f=>f.endsWith('_growth_development_backlog.sql')),'utf8');
const attention=readFileSync('supabase/migrations/20261029213441_growth_loop_attention.sql','utf8');
const put=attention.slice(attention.indexOf('create function growth_loop_private.put('),attention.indexOf('create function public.growth_loop_reconcile()'));
async function fixture(){
 const db=new PGlite();
 await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;
 create schema auth;create table auth.users(id uuid primary key);insert into auth.users values('${admin}'),('${other}');
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 create function public.gaas_vault_is_admin() returns boolean language sql stable as $$select auth.uid()='${admin}'::uuid$$;
 grant usage on schema public,auth to authenticated,anon,service_role;grant execute on function auth.uid(),public.gaas_vault_is_admin() to authenticated,service_role;
 create schema growth_loop_private;
 create table public.growth_loop_items(id uuid primary key default gen_random_uuid(),episode_key text unique,kind text constraint growth_loop_items_kind_check check(kind in ('source','investigation','outcome','contribution')),
 source_id text,front text,period date,title text,summary text,next_action text,state text,route text,notice_revision integer default 0,revision integer default 0,content_hash text default '',priority integer,evidence jsonb default '{}',created_at timestamptz default now(),updated_at timestamptz default now());
 create table public.growth_loop_revisions(item_id uuid,revision integer,content_hash text,packet jsonb,created_at timestamptz);
 create table public.growth_loop_analyses(item_id uuid,revision integer,state text);
 `);
 await db.exec(put);await db.exec(migration);
 await db.exec(`select set_config('request.jwt.claim.sub','${admin}',false)`);
 const save=async(body,id=null,revision=null)=>(await db.query('select growth_save_development_task($1,$2,$3) t',[id,revision,JSON.stringify(body)])).rows[0].t;
 return {db,save};
}
test('task creates one attention item, no-op preserves revision, checklist-only edit does not re-notify',async()=>{
 const {db,save}=await fixture();try{
 const t=await save({task_key:'TEST-01',title:'Tarefa sintética',acceptance_criteria:['Entregar contrato']});
 assert.equal(t.revision,1);assert.equal((await db.query('select count(*)::int n from growth_loop_items')).rows[0].n,1);
 assert.equal((await save({},t.id,t.revision)).revision,1);
 const checked=await save({completed_criteria:[0]},t.id,1);assert.equal(checked.revision,2);
 assert.equal((await db.query('select notice_revision from growth_loop_items')).rows[0].notice_revision,1);
 const done=await save({status:'concluida',resolution:'Contrato disponível e revisado.'},t.id,2);
 assert.equal(done.status,'concluida');assert.equal((await db.query('select state from growth_loop_items')).rows[0].state,'resolved');
 assert.equal((await db.query('select count(*)::int n from growth_development_task_events')).rows[0].n,3);
 }finally{await db.close();}
});
test('dependencies, cycles, optimistic concurrency and completion evidence are enforced',async()=>{
 const {db,save}=await fixture();try{
 const a=await save({task_key:'TEST-A',title:'Primeira tarefa',acceptance_criteria:['Contrato pronto']});
 const b=await save({task_key:'TEST-B',title:'Segunda tarefa',dependencies:['TEST-A'],acceptance_criteria:['Entregar teste']});
 await assert.rejects(save({status:'em_execucao'},b.id,1),/dependencies_pending/);
 await assert.rejects(save({dependencies:['TEST-B']},a.id,1),/dependency_cycle/);
 await assert.rejects(save({status:'concluida'},a.id,1),/completion_evidence/);
 await assert.rejects(save({status:'bloqueada'},a.id,1),/block_reason/);
 await save({status:'concluida',completed_criteria:[0],resolution:'Contrato revisado'},a.id,1);
 await assert.rejects(save({title:'Mudança concorrente'},a.id,1),/revision_conflict/);
 assert.equal((await save({status:'em_execucao'},b.id,1)).status,'em_execucao');
 }finally{await db.close();}
});
test('anonymous/non-admin cannot mutate; authenticated cannot write tables or history directly',async()=>{
 const {db,save}=await fixture();try{
 const t=await save({title:'Tarefa administrativa'});
 await db.exec(`select set_config('request.jwt.claim.sub','${other}',false);set role authenticated;`);
 await assert.rejects(save({title:'Tentativa sem acesso'}),/access_denied/);
 assert.equal((await db.query('select * from growth_development_tasks')).rows.length,0);
 await assert.rejects(db.query('delete from growth_development_task_events where task_id=$1',[t.id]),/permission denied/);
 await db.exec(`reset role;select set_config('request.jwt.claim.sub','',false);set role anon;`);
 await assert.rejects(save({title:'Tentativa anônima'}),/permission denied/);
 }finally{await db.close();}
});
