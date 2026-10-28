import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';

const migration=suffix=>readFileSync('supabase/migrations/'+readdirSync('supabase/migrations').find(f=>f.endsWith(suffix)),'utf8');
const actor='11111111-1111-4111-8111-111111111111';
test('observation runtime: RLS, atomic persistence, transactional queue, lease and dirty-history contract',async()=>{
  const db=new PGlite();
  try{
    await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;
      create schema auth;create table auth.users(id uuid primary key);insert into auth.users values('${actor}');
      create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
      create table public.report_live_memberships(user_id uuid primary key,role text,active boolean);
      insert into public.report_live_memberships values('${actor}','admin',true);
      create table public.report_runs(id uuid primary key,period_start date,period_end date,artifact_path text,content_hash text,certification_status text);
      insert into public.report_runs values('22222222-2222-4222-8222-222222222222','2026-08-01','2026-08-31','synthetic','synthetic','certified');
      create table public.activities(id integer generated always as identity,"BU" text,"Segmento" text,parceiro_canonico text,"Data de Disparo" timestamptz,status text,"Cartões Gerados" numeric,"Custo Total Campanha" numeric);
      create table public.paid_media_metrics(channel text,date date);
      create table public.b2c_daily_metrics(data date);
      create table public.app_afinz_funnel_daily_raw(business_date date);
      create table public.serasa_bi_daily_funnel(data date);
      create schema cron;create table cron.synthetic_jobs(id bigint,active boolean);
      create function cron.schedule(text,text,text) returns bigint language sql as $$insert into cron.synthetic_jobs values(1,true) returning id$$;
      create function cron.alter_job(job_id bigint,active boolean) returns void language sql as $$update cron.synthetic_jobs set active=$2 where id=$1$$;
      create schema vault;create view vault.decrypted_secrets as select 'synthetic'::text name,'synthetic'::text decrypted_secret;
      create schema net;create function net.http_post(url text,headers jsonb,body jsonb,timeout_milliseconds integer) returns bigint language sql as $$select 1::bigint$$;
      grant usage on schema auth to authenticated,service_role;grant execute on function auth.uid() to authenticated,service_role;
      grant select on all tables in schema public to authenticated,service_role;grant all on public.activities to service_role;grant usage on sequence public.activities_id_seq to service_role;`);
    await db.exec(migration('_growth_trigger_observation_release_8.sql'));
    await db.exec(migration('_growth_trigger_observation_runtime.sql'));
    await db.exec(migration('_growth_trigger_observation_dispatch.sql'));
    assert.equal((await db.query('select active from cron.synthetic_jobs')).rows[0].active,false);
    await db.exec(`insert into public.growth_operations(operation_id,front,domain,scope,display_name,lifecycle,vault_note_path,valid_from,confirmed_by,confirmed_at,provenance)
      values('CRM-synthetic','crm_aquisicao','CRM','{"bu":"Synthetic","segment":"Synthetic","partner":"Synthetic"}','Synthetic','confirmada','synthetic.md','2020-01-01','Synthetic',now(),'{}');
      insert into public.growth_trigger_rules(rule_id,front,family,metric,params,enabled,version,valid_from,backtest_ref,created_by)
      values('synthetic-rule','crm_aquisicao','T1','cards','{}',true,1,'2020-01-01','synthetic','synthetic'),
      ('synthetic-t2','crm_aquisicao','T2','cac','{}',true,1,'2020-01-01','synthetic','synthetic');
      insert into public.growth_trigger_runtime_config(version,operation_ids,rule_ids,certified_run_id,responsible_label,approval_ref,approved_by)
      values(1,array['CRM-synthetic'],array['synthetic-rule','synthetic-t2'],'22222222-2222-4222-8222-222222222222','Synthetic','synthetic','Synthetic');
      insert into public.growth_trigger_runtime_settings values('pilot',1,true,now());`);
    const period=(await db.query("select (date_trunc('month',now() at time zone 'America/Sao_Paulo')-interval '1 month')::date::text as p")).rows[0].p;
    await db.exec(`begin;insert into public.activities("BU","Segmento",parceiro_canonico,"Data de Disparo",status,"Cartões Gerados","Custo Total Campanha")
      values('Synthetic','Synthetic','Synthetic','${period} 12:00:00-03','Realizado',100,1000);`);
    assert.ok((await db.query('select count(*)::integer n from public.growth_trigger_observation_jobs')).rows[0].n>0);
    await db.exec('rollback;');assert.equal((await db.query('select count(*)::integer n from public.growth_trigger_observation_jobs')).rows[0].n,0);
    await db.exec(`insert into public.activities("BU","Segmento",parceiro_canonico,"Data de Disparo",status,"Cartões Gerados","Custo Total Campanha")
      values('Synthetic','Synthetic','Synthetic','${period} 12:00:00-03','Realizado',100,1000),
      ('Synthetic','Synthetic','Synthetic','${period} 12:00:00-03','Realizado',null,100),
      ('Unrelated','Unrelated','Unrelated','${period} 12:00:00-03','Realizado',999,999);`);
    await db.exec('set role service_role;');
    const input=(await db.query('select public.growth_trigger_observation_inputs($1)::jsonb as data',[period])).rows[0].data;
    assert.equal(input.monthly.length,1);assert.equal(input.monthly[0].cards,'100');assert.equal(input.monthly[0].missing_cards,1);
    assert.equal(input.operations.length,1);
    const output={mode:'observacao',engine_version:'synthetic',performance:[
      {operation_id:'CRM-synthetic',family:'T1',period:period.slice(0,7),rule_id:'synthetic-rule',feed_eligible:false},
      {operation_id:'CRM-synthetic',family:'T2',period:period.slice(0,7),rule_id:'synthetic-t2',feed_eligible:false}],freshness:[]};
    const args=['a'.repeat(64),'b'.repeat(64),JSON.stringify(input),JSON.stringify(output),actor];
    const saved=(await db.query('select public.growth_trigger_complete_observation($1,$2,$3::jsonb,$4::jsonb,$5) id',args)).rows[0].id;
    const repeated=(await db.query('select public.growth_trigger_complete_observation($1,$2,$3::jsonb,$4::jsonb,$5) id',args)).rows[0].id;
    assert.equal(saved,repeated);
    await assert.rejects(db.query('select public.growth_trigger_complete_observation($1,$2,$3::jsonb,$4::jsonb,$5)',[args[0],'c'.repeat(64),...args.slice(2)]),/Non-deterministic/);
    await assert.rejects(db.query('select public.growth_trigger_complete_observation($1,$2,$3::jsonb,$4::jsonb,$5)',[args[0],args[1],args[2],JSON.stringify({...output,performance:[{feed_eligible:true},{}]}),actor]),/Invalid observation/);
    await assert.rejects(db.query('select public.growth_trigger_complete_observation($1,$2,$3::jsonb,$4::jsonb,$5)',[args[0],args[1],args[2],'{}',actor]),/Invalid observation/);
    await db.exec("update public.growth_trigger_observation_jobs set next_attempt_at=now()-interval '1 minute'");
    const claimed=(await db.query('select public.growth_trigger_claim_observation_job() job')).rows[0].job;
    assert.ok(claimed.lease_token);assert.equal(claimed.period,period);
    assert.equal((await db.query('select public.growth_trigger_finish_observation_job($1,$2,$3) ok',[period,'00000000-0000-4000-8000-000000000000',saved])).rows[0].ok,false);
    await db.exec('reset role;');
    await db.exec("update public.activities set \"Cartões Gerados\"=101 where \"BU\"='Synthetic'");
    await db.exec('set role service_role;');
    assert.equal((await db.query('select public.growth_trigger_finish_observation_job($1,$2,$3) ok',[period,claimed.lease_token,saved])).rows[0].ok,true);
    const dirty=(await db.query('select * from public.growth_trigger_observation_jobs where period=$1',[period])).rows[0];
    assert.equal(dirty.state,'pending');assert.ok(Number(dirty.revision)>Number(dirty.processed_revision));
    assert.equal((await db.query('select public.growth_trigger_reconcile_manual_job($1,$2,$3) ok',[period,saved,input.data_read_at])).rows[0].ok,false);
    assert.equal((await db.query('select public.growth_trigger_reconcile_manual_job($1,$2,statement_timestamp()) ok',[period,saved])).rows[0].ok,true);
    assert.equal((await db.query('select state from public.growth_trigger_observation_jobs where period=$1',[period])).rows[0].state,'completed');
    await db.exec('reset role;');
    const prior=(await db.query('select sum(revision)::integer n from public.growth_trigger_observation_jobs')).rows[0].n;
    await db.exec(`insert into public.activities("BU","Segmento",parceiro_canonico,"Data de Disparo",status,"Cartões Gerados","Custo Total Campanha") values('Unrelated','Unrelated','Unrelated','${period} 12:00:00-03','Realizado',1,1)`);
    assert.equal((await db.query('select sum(revision)::integer n from public.growth_trigger_observation_jobs')).rows[0].n,prior);
    const old=(await db.query(`select ('${period}'::date-interval '6 months')::date::text p`)).rows[0].p;
    await db.exec(`insert into public.activities("BU","Segmento",parceiro_canonico,"Data de Disparo",status,"Cartões Gerados","Custo Total Campanha") values('Synthetic','Synthetic','Synthetic','${old} 12:00:00-03','Realizado',1,1)`);
    assert.equal((await db.query('select count(*)::integer n from public.growth_trigger_observation_jobs where period between $1::date and $2::date',[old,period])).rows[0].n,7);
    await db.exec(`set role authenticated;select set_config('request.jwt.claim.sub','${actor}',false);`);
    assert.equal((await db.query('select count(*)::integer n from public.growth_trigger_observation_runs')).rows[0].n,1);
    await assert.rejects(db.query('select public.growth_trigger_observation_inputs($1)',[period]),/permission denied/);
    await assert.rejects(db.exec("update public.growth_trigger_runtime_settings set observation_enabled=false"),/permission denied/);
    await db.exec("select set_config('request.jwt.claim.sub','33333333-3333-4333-8333-333333333333',false)");
    assert.equal((await db.query('select count(*)::integer n from public.growth_trigger_observation_runs')).rows[0].n,0);
    await db.exec('reset role;set role anon;');
    await assert.rejects(db.exec('select * from public.growth_trigger_observation_runs'),/permission denied/);
    await db.exec('reset role;');
    await assert.rejects(db.exec('update public.growth_trigger_observation_runs set output=\'{}\''),/immutable/);
  }finally{await db.close();}
});
