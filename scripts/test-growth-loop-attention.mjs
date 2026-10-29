import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync,mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {PGlite} from '@electric-sql/pglite';
import {skillHash,validate,applyApproved} from './growth-loop-agent.mjs';
const actor='11111111-1111-4111-8111-111111111111';
const other='22222222-2222-4222-8222-222222222222';
async function fixture(){
 const db=new PGlite();
 await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;
 create schema auth;create table auth.users(id uuid primary key);insert into auth.users values('${actor}'),('${other}');
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 create function gaas_vault_is_admin() returns boolean language sql stable as $$select auth.uid()='${actor}'::uuid$$;
 create function growth_investigation_agent_required() returns void language plpgsql as $$begin if current_user not in ('postgres','service_role') then raise exception 'agent_required';end if;end$$;
 create function growth_investigation_can_access(text,boolean default false) returns boolean language sql stable as $$select false$$;
 create function growth_reject_definition_mutation() returns trigger language plpgsql as $$begin raise exception 'immutable';end$$;
 create table growth_operations(operation_id text,scope jsonb);
 create table growth_investigations(id uuid,operation_id text,period date,current_revision integer);
 create table growth_investigation_evidence(id uuid,investigation_id uuid,revision integer,packet jsonb,content_hash text);
 create table growth_investigation_jobs(id uuid,evidence_id uuid,state text);
 create table growth_investigation_analyses(job_id uuid,body jsonb);
 create table growth_investigation_decisions(id uuid default gen_random_uuid(),investigation_id uuid,evidence_id uuid,decision text,created_at timestamptz default now());
 create table outcome_fixture(bet_id uuid,front text,outcome_window_end date,metric_name text,due_bucket text,review_status text);
 create view growth_outcomes_due_v as select * from outcome_fixture;
 create table paid_media_metrics(date date,channel text);
 create table paid_media_collection_runs(source text,status text,finished_at timestamptz,until_date date,rows_written int);
 create table activities("Data de Disparo" timestamptz);create table rentabilizacao_activities("Data de Disparo" timestamptz);
 create table b2c_daily_metrics(data date,tipo text);
 create table app_afinz_funnel_daily_raw(business_date date);create table serasa_bi_daily_funnel(data date);
 create table gaas_knowledge_packs(id uuid primary key,created_by uuid);
 create table gaas_knowledge_contributions(id uuid primary key default gen_random_uuid(),title text,status text,created_at timestamptz default now(),created_by uuid default auth.uid(),pack_id uuid,changes jsonb);
 create table gaas_vault_notes(relative_path text,content_hash text,frontmatter jsonb,deleted_at timestamptz);
 create function gaas_knowledge_submit(uuid,text,text,jsonb) returns uuid language plpgsql as $$declare id uuid;begin insert into public.gaas_knowledge_contributions(pack_id,title,status,changes) values($1,$2,'pending',$4) returning gaas_knowledge_contributions.id into id;return id;end$$;
 create schema cron;create function cron.schedule(text,text,text) returns bigint language sql as $$select 1::bigint$$;
 grant usage on schema auth,public to authenticated,service_role,anon;
 grant execute on function auth.uid(),gaas_vault_is_admin() to authenticated,service_role;
 select set_config('request.jwt.claim.sub','${actor}',false);`);
 const file=readdirSync('supabase/migrations').find(f=>f.endsWith('_growth_loop_attention.sql'));
 await db.exec(readFileSync('supabase/migrations/'+file,'utf8'));
 const guards=readdirSync('supabase/migrations').find(f=>f.endsWith('_growth_loop_resolution_guards.sql'));
 await db.exec(readFileSync('supabase/migrations/'+guards,'utf8'));
 const decision=readdirSync('supabase/migrations').find(f=>f.endsWith('_growth_loop_latest_decision.sql'));
 await db.exec(readFileSync('supabase/migrations/'+decision,'utf8'));
 await db.query('update growth_loop_settings set skill_hash=$1',[skillHash()]);
 const agent={name:'codex',skill_version:'1.0.0',skill_hash:skillHash(),commit:'a'.repeat(40)};
 const put=async(evidence={last_business_date:'2026-10-27',expected_cutoff:'2026-10-28'})=>(await db.query("select growth_loop_private.put('source:crm','source','crm','crm_acquisition',current_date,'Atualizar CRM','Conferir a atualização da fonte.','Conferir importação.','needs_data','?view=learning&section=feed',20,$1) id",[JSON.stringify(evidence)])).rows[0].id;
 const list=async(hidden=false)=>(await db.query('select growth_loop_list($1) v',[hidden])).rows[0].v;
 const claim=async()=>(await db.query('select growth_loop_claim($1) v',[JSON.stringify(agent)])).rows[0].v;
 const complete=async(c,body)=>(await db.query('select growth_loop_complete($1,$2,$3,$4) id',[c.analysis_id,c.lease_token,c.content_hash,JSON.stringify(body)])).rows[0].id;
 const body={status:'blocked',summary:'A última data registrada não confirma cobertura integral da fonte.',facts:[{text:'A fonte possui a data informada.',evidence_key:'last_business_date',value:'2026-10-27'}],limitations:['A data máxima não comprova completude.'],next_checks:['Conferir a importação do período.']};
 return {db,put,list,claim,complete,body};
}
test('personal preferences do not resolve work; only material revision reopens dismissal',async()=>{
 const f=await fixture();try{
 const id=await f.put();await f.db.exec('set role authenticated');
 await f.db.query("select growth_loop_prefer($1,'follow')",[id]);assert.equal((await f.list())[0].following,true);
 await f.db.query("select growth_loop_prefer($1,'read')",[id]);assert.equal((await f.list()).length,1);
 await f.db.query("select growth_loop_prefer($1,'dismiss')",[id]);assert.equal((await f.list()).length,0);assert.equal((await f.list(true))[0].state,'needs_data');
 await f.db.exec('reset role');await f.put({last_business_date:'2026-10-27',expected_cutoff:'2026-10-29'});await f.db.exec('set role authenticated');assert.equal((await f.list()).length,0);
 await f.db.exec('reset role');await f.put({last_business_date:'2026-10-28',expected_cutoff:'2026-10-29'});await f.db.exec('set role authenticated');assert.equal((await f.list()).length,1);
 await f.db.query("select growth_loop_prefer($1,'snooze',now()+interval '1 day')",[id]);assert.equal((await f.list()).length,0);
 await f.db.query("select growth_loop_prefer($1,'restore')",[id]);assert.equal((await f.list()).length,1);
 await f.db.query("select set_config('request.jwt.claim.sub',$1,false)",[other]);assert.deepEqual(await f.list(true),[]);
 await assert.rejects(f.db.query("select growth_loop_prefer($1,'dismiss')",[id]),/loop_access_denied/);
 await assert.rejects(f.db.exec('update growth_loop_items set state=\'resolved\''),/permission denied/);
 }finally{await f.db.close();}
});
test('claim excludes another agent, validates references and completion is idempotent',async()=>{
 const f=await fixture();try{
 const id=await f.put();await f.db.query('select growth_loop_request_analysis($1)',[id]);const c=await f.claim();assert.ok(c);assert.equal(await f.claim(),null);
 assert.deepEqual(validate(c,f.body),[]);
 await assert.rejects(f.complete(c,{...f.body,candidate:{}}),/invalid_loop_output/);
 await assert.rejects(f.complete(c,{...f.body,facts:[{text:'Uma referência inválida.',evidence_key:'missing'}]}),/invalid_loop_reference/);
 await assert.rejects(f.complete(c,{...f.body,facts:[{text:'Um valor incompatível.',evidence_key:'last_business_date',value:0}]}),/invalid_loop_value/);
 await assert.rejects(f.db.query('select growth_loop_complete($1,$2,null,$3)',[c.analysis_id,c.lease_token,JSON.stringify(f.body)]),/loop_evidence_superseded/);
 const done=await f.complete(c,f.body);assert.equal(await f.complete(c,f.body),done);
 assert.equal((await f.db.query('select count(*)::int n from growth_loop_analyses')).rows[0].n,1);
 await f.db.exec('set role authenticated');await assert.rejects(f.claim(),/permission denied/);
 }finally{await f.db.close();}
});
test('new evidence supersedes work; lease expiry, bounded failures and rollback gate',async()=>{
 const f=await fixture();try{
 const id=await f.put();await f.db.query('select growth_loop_request_analysis($1)',[id]);let c=await f.claim();await f.put({last_business_date:'2026-10-28'});
 await assert.rejects(f.complete(c,f.body),/invalid_loop_lease|loop_evidence_superseded/);
 await f.db.query('select growth_loop_request_analysis($1)',[id]);c=await f.claim();
 await f.db.exec("update growth_loop_analyses set lease_until=now()-interval '1 minute' where state='running'");await assert.rejects(f.complete(c,f.body),/invalid_loop_lease/);c=await f.claim();assert.ok(c);
 await f.db.query("select growth_loop_fail($1,$2,'technical')",[c.analysis_id,c.lease_token]);c=await f.claim();await f.db.query("select growth_loop_fail($1,$2,'technical')",[c.analysis_id,c.lease_token]);assert.equal(await f.claim(),null);
 await f.db.query('select growth_loop_request_analysis($1)',[id]);c=await f.claim();assert.ok(c);await f.db.exec('update growth_loop_settings set enabled=false');assert.equal(await f.claim(),null);await assert.rejects(f.complete(c,f.body),/loop_disabled/);
 }finally{await f.db.close();}
});
test('reconciliation uses actual source contracts and deduplicates stable evidence',async()=>{
 const f=await fixture();try{
 await f.db.exec('update growth_loop_sources set due_hour_local=0');await f.db.exec('select growth_loop_reconcile()');const first=await f.list();assert.equal(first.length,7);
 await f.db.exec('select growth_loop_reconcile()');assert.deepEqual((await f.list()).map(i=>[i.id,i.revision]),first.map(i=>[i.id,i.revision]));
 const meta=first.find(i=>i.source_id==='meta');await f.db.query('select growth_loop_request_analysis($1)',[meta.id]);
 await f.db.exec("insert into paid_media_metrics values((now() at time zone 'America/Sao_Paulo')::date-1,'meta');insert into paid_media_collection_runs values('meta','complete',now(),(now() at time zone 'America/Sao_Paulo')::date-1,10);select growth_loop_reconcile()");assert.equal((await f.list()).some(i=>i.source_id==='meta'),false);
 assert.equal(await f.claim(),null);
 assert.match(first.find(i=>i.source_id==='renta').summary,/Confira se existem disparos/);
 }finally{await f.db.close();}
});
test('note proposal rejects wrong front, stale hashes and revision; reuses same proposal',async()=>{
 const f=await fixture();try{
 const id=await f.put(),pack=crypto.randomUUID();await f.db.query('insert into gaas_knowledge_packs values($1,$2)',[pack,actor]);await f.db.exec(`insert into gaas_vault_notes values('10-Resultados/CRM.md','base','{"analytics":{"domain":"crm"}}',null),('10-Resultados/Media.md','base','{"analytics":{"domain":"media"}}',null)`);
 const submit=(path,hash='base',revision=1)=>f.db.query('select growth_loop_submit_note($1,$2,$3,$4,$5,$6) id',[id,revision,pack,path,hash,'# Evidência revisável']);
 await assert.rejects(submit('10-Resultados/CRM.md','old'),/knowledge_stale_base/);
 await assert.rejects(submit('10-Resultados/Media.md'),/note_outside_front/);
 await assert.rejects(submit('10-Resultados/CRM.md','base',2),/loop_evidence_superseded/);
 await assert.rejects(submit('10-Resultados/CRM.md','base',null),/loop_evidence_superseded/);
 const a=await submit('10-Resultados/CRM.md');assert.deepEqual(await submit('10-Resultados/CRM.md'),a);
 }finally{await f.db.close();}
});
test('latest human decision controls notification state while preserving decisions',async()=>{
 const f=await fixture();try{
 const investigation=crypto.randomUUID(),evidence=crypto.randomUUID(),job=crypto.randomUUID();
 await f.db.query("insert into growth_investigations values($1,'synthetic','2026-09-01',1)",[investigation]);
 await f.db.query("insert into growth_investigation_evidence values($1,$2,1,$3,'hash')",[evidence,investigation,JSON.stringify({scope:{partner:'Plurix',segment:'Negados'},evidence:[]})]);
 await f.db.query("insert into growth_investigation_jobs values($1,$2,'completed')",[job,evidence]);await f.db.query('insert into growth_investigation_analyses values($1,$2)',[job,JSON.stringify(f.body)]);
 await f.db.query("insert into growth_investigation_decisions(investigation_id,evidence_id,decision,created_at) values($1,$2,'no_action',now()-interval '2 minutes')",[investigation,evidence]);
 await f.db.exec('select growth_loop_reconcile()');assert.equal((await f.list()).some(i=>i.kind==='investigation'),false);
 await f.db.query("insert into growth_investigation_decisions(investigation_id,evidence_id,decision,created_at) values($1,$2,'request_data',now()-interval '1 minute')",[investigation,evidence]);
 await f.db.exec('select growth_loop_reconcile()');assert.equal((await f.list()).find(i=>i.kind==='investigation').state,'needs_data');
 await f.db.query("insert into growth_investigation_decisions(investigation_id,evidence_id,decision) values($1,$2,'investigate')",[investigation,evidence]);
 await f.db.exec('select growth_loop_reconcile()');assert.equal((await f.list()).find(i=>i.kind==='investigation').state,'needs_review');
 assert.equal((await f.db.query('select count(*)::int n from growth_investigation_decisions')).rows[0].n,3);
 }finally{await f.db.close();}
});
test('approved contribution helper validates every base before writing and rejects traversal',()=>{
 const root=mkdtempSync(join(tmpdir(),'growth-loop-'));const hash=s=>createHash('sha256').update(s).digest('hex');
 try{writeFileSync(join(root,'note.md'),'old');const c={status:'approved',approved_at:new Date().toISOString(),changes:[{path:'note.md',base_hash:hash('old'),expected_hash:hash('new'),markdown:'new'}]};
 assert.throws(()=>applyApproved({...c,status:'pending'},root),/approved_backend_record_required/);
 assert.throws(()=>applyApproved({...c,changes:[...c.changes,{...c.changes[0],path:'../escape.md'}]},root),/invalid_path/);assert.equal(readFileSync(join(root,'note.md'),'utf8'),'old');
 assert.equal(applyApproved(c,root)[0].reused,false);assert.equal(applyApproved(c,root)[0].reused,true);
 }finally{rmSync(root,{recursive:true,force:true});}
});
