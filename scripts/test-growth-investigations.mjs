import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
const actor='11111111-1111-4111-8111-111111111111';
const sql=suffix=>readFileSync('supabase/migrations/'+readdirSync('supabase/migrations').find(f=>f.endsWith(suffix)),'utf8');
const migration=sql('_growth_investigations.sql');
async function fixture(){
 const db=new PGlite();
 await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;
 create schema auth;create table auth.users(id uuid primary key);insert into auth.users values('${actor}');
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 create table public.profiles(id uuid primary key,role text);insert into profiles values('${actor}','admin');
 create table public.report_live_memberships(user_id uuid,role text,active boolean);insert into report_live_memberships values('${actor}','admin',true);
 create table public.growth_operations(operation_id text primary key,scope jsonb,lifecycle text,registry_revision integer);
 insert into growth_operations values('synthetic','{"bu":"Synthetic","segment":"Synthetic","partner":"Synthetic"}','confirmada',1);
 create table growth_trigger_runtime_settings(id text,config_version int);insert into growth_trigger_runtime_settings values('pilot',1);
 create table growth_trigger_runtime_config(version int,operation_ids text[]);insert into growth_trigger_runtime_config values(1,array['synthetic']);
 create table growth_trigger_observation_runs(id uuid,period date,output jsonb,data_read_at timestamptz,completed_at timestamptz default now());
 create table activities(id uuid primary key default gen_random_uuid(),"BU" text,"Segmento" text,parceiro_canonico text,"Data de Disparo" timestamptz,
 status text,"Activity name / Taxonomia" text,"Canal" text,jornada text,"Etapa de aquisição" text,"Subgrupos" text,"Safra" text,"Oferta" text,"Oferta 2" text,"Ordem de disparo" int,template_id text,
 "Cartões Gerados" numeric,"Custo Total Campanha" numeric,"Propostas" numeric,"Aprovados" numeric,"Base Acionável" numeric,"Cliques" numeric);
 create table communication_templates(template_id text,title text,version_label text,content_hash text,status text);
 create table growth_learnings(id uuid,current_revision int,source_kind text,source_ref text,statement text,classification text,valid_from date,review_at date,valid_until date,front text,lifecycle_status text,scope jsonb);
 create table report_action_candidates(action_candidate_id uuid primary key default gen_random_uuid(),run_id uuid not null,source_view text,entity_key text,signal_code text,domain text,partner text,bucket text,
 signal text,impact text,probable_cause text,evidence_refs jsonb,reading_limit text,action_text text,success_metric text,confidence_status text,generated_by text,verification_view text,review_status text default 'pending');
 create table growth_feed_events(id uuid,subject_type text,subject_id uuid,summary_snapshot jsonb,occurred_at timestamptz);
 create table growth_evidence_snapshots(id uuid,filters jsonb);create table growth_bets(id uuid,source_action_candidate_id uuid);
 create function growth_reject_definition_mutation() returns trigger language plpgsql as $$begin raise exception 'immutable';end;$$;
 grant usage on schema auth,public to authenticated,service_role,anon;
 grant execute on function auth.uid() to authenticated,service_role;
 grant select on profiles,growth_operations,report_live_memberships to authenticated,service_role;`);
 await db.exec(migration);
 await db.exec(sql('_growth_investigation_reads.sql'));
 await db.exec(sql('_growth_investigation_visibility.sql'));
 await db.exec(`insert into growth_investigation_settings values(true,true,true,'1.0.0','${'a'.repeat(64)}');
 select set_config('request.jwt.claim.sub','${actor}',false);`);
 const period=(await db.query("select (date_trunc('month',now() at time zone 'America/Sao_Paulo')-interval '1 month')::date::text p")).rows[0].p;
 await db.exec(`insert into activities("BU","Segmento",parceiro_canonico,"Data de Disparo",status,"Activity name / Taxonomia","Canal",jornada,"Cartões Gerados","Custo Total Campanha","Propostas","Aprovados","Base Acionável")
 values('Synthetic','Synthetic','Synthetic','${period} 12:00:00-03','Realizado','SYNTHETIC','SMS','Synthetic',10,100,20,15,1000)`);
 const agent={name:'codex',commit:'b'.repeat(40),skill_version:'1.0.0',skill_hash:'a'.repeat(64)};
 const request=async(filters={})=>(await db.query("select growth_request_investigation('synthetic',$1,'result_change',$2) id",[period,JSON.stringify(filters)])).rows[0].id;
 const claim=async()=>(await db.query('select growth_claim_investigation($1) j',[JSON.stringify(agent)])).rows[0].j;
 const complete=async(j,body)=>(await db.query('select growth_complete_investigation($1,$2,$3,$4) r',[j.job_id,j.lease_token,j.content_hash,JSON.stringify(body)])).rows[0].r;
 const body={status:'conclusive',summary:'Verificar comportamento da produção registrada.',facts:[{text:'Cartões registrados disponíveis.',evidence_ids:[period+':cards'],values:[{evidence_id:period+':cards',value:10}]}],hypotheses:[],limitations:['População integral não certificada.'],next_checks:['Verificar público e maturação.'],candidate:{metric:'cards',title:'Investigar produção registrada',action:'Conferir mudança de público no próximo ciclo.',success_criterion:'Concluir a verificação do público e registrar a decisão.'}};
 return {db,period,agent,request,claim,complete,body};
}
test('manual request dedupes, claim excludes second agent, completion is atomic/idempotent',async()=>{
 const f=await fixture();try{
 const id=await f.request();assert.equal(await f.request(),id);
 const j=await f.claim();assert.ok(j.lease_token);assert.equal(await f.claim(),null);
 const r=await f.complete(j,f.body);assert.ok(r.analysis_id);assert.ok(r.candidate_id);
 assert.equal((await f.complete(j,f.body)).reused,true);
 assert.equal((await f.db.query('select count(*)::int n from report_action_candidates')).rows[0].n,1);
 await assert.rejects(f.complete(j,{...f.body,summary:'Uma conclusão diferente da anterior.'}),/completion_conflict/);
 }finally{await f.db.close();}
});
test('new data supersedes a lease; old analysis cannot publish',async()=>{
 const f=await fixture();try{
 await f.request();const j=await f.claim();await f.db.exec('update activities set "Cartões Gerados"=11');
 assert.equal((await f.complete(j,f.body)).state,'superseded');
 const next=await f.claim();assert.equal(next.revision,2);assert.notEqual(next.content_hash,j.content_hash);
 assert.equal((await f.db.query('select count(*)::int n from growth_investigation_analyses')).rows[0].n,0);
 }finally{await f.db.close();}
});
test('ambiguous grain, missing clicks, open month and unknown evidence block candidate publication',async()=>{
 const f=await fixture();try{
 await f.db.exec(`insert into activities select gen_random_uuid(),"BU","Segmento",parceiro_canonico,"Data de Disparo",status,"Activity name / Taxonomia","Canal",jornada,"Etapa de aquisição",'Other',"Safra","Oferta","Oferta 2","Ordem de disparo",template_id,"Cartões Gerados","Custo Total Campanha","Propostas","Aprovados","Base Acionável","Cliques" from activities`);
 await f.request();const j=await f.claim();assert.equal(j.packet.evidence.find(e=>e.id===f.period+':cards').status,'blocked');
 await assert.rejects(f.complete(j,{...f.body,facts:[{text:'Uma afirmação sem referência válida.',evidence_ids:['unknown']}]}),/unknown_evidence/);
 await assert.rejects(f.complete(j,f.body),/value_mismatch|candidate_not_eligible/);
 const blocked={...f.body,status:'blocked',candidate:null,facts:[{text:'Grão ambíguo; verificar linhas na origem.',evidence_ids:[f.period+':cards']}]};
 assert.ok((await f.complete(j,blocked)).analysis_id);
 assert.equal((await f.db.query('select count(*)::int n from report_action_candidates')).rows[0].n,0);
 }finally{await f.db.close();}
});
test('RLS, write RPCs, expired leases and bounded retry preserve history',async()=>{
 const f=await fixture();try{
 const id=await f.request();let j=await f.claim();
 await f.db.exec("set role authenticated");
 await assert.rejects(f.db.query('select growth_claim_investigation($1)',[JSON.stringify(f.agent)]),/permission denied/);
 await assert.rejects(f.db.query('update growth_investigation_evidence set packet=\'{}\''),/permission denied/);
 await f.db.exec('reset role');
 for(let n=0;n<3;n++){
 if(n>0)j=await f.claim();assert.ok(j);
 assert.equal((await f.db.query('select growth_fail_investigation($1,$2,$3) ok',[j.job_id,j.lease_token,'synthetic_failure'])).rows[0].ok,true);
 }
 assert.equal(await f.claim(),null);
 await f.db.query('select growth_retry_investigation($1)',[id]);j=await f.claim();assert.ok(j);
 await f.db.exec("update growth_investigation_jobs set lease_until=now()-interval '1 minute'");
 await assert.rejects(f.complete(j,f.body),/lease_lost/);
 assert.ok(await f.claim());
 }finally{await f.db.close();}
});


test('open months, missing costs, scopes and lease exhaustion remain explicit',async()=>{
 const f=await fixture();try{
 const current=(await f.db.query("select date_trunc('month',now() at time zone 'America/Sao_Paulo')::date::text p")).rows[0].p;
 await f.db.exec(`update activities set "Data de Disparo"='${current} 12:00:00-03'`);
 await f.db.query("select growth_request_investigation('synthetic',$1)",[current]);const open=await f.claim();
 const openBody={...f.body,facts:[{text:'Mês aberto; leitura não concluída.',evidence_ids:[current+':cards']}]};
 await assert.rejects(f.complete(open,openBody),/candidate_not_eligible/);
 await f.db.exec("update activities set \"Custo Total Campanha\"=null");
 const p=(await f.db.query("select growth_investigation_packet('synthetic',$1) p",[current])).rows[0].p;
 assert.equal(p.evidence.find(x=>x.id===current+':cost_per_card').value,null);
 assert.equal(p.evidence.find(x=>x.id===current+':cards').value,10);
 await f.db.exec("delete from growth_investigation_access;update profiles set role='admin';set role authenticated");
 assert.deepEqual((await f.db.query('select growth_list_investigations() result')).rows[0].result,[]);
 await assert.rejects(f.db.query("select growth_request_investigation('synthetic',$1)",[current]),/investigation_access_denied/);
 await f.db.exec('reset role;set role anon');
 await assert.rejects(f.db.query('select growth_list_investigations()'),/permission denied/);
 await f.db.exec('reset role');
 }finally{await f.db.close();}
});
