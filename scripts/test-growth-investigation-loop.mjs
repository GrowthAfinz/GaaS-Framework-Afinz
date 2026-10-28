import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
const read=p=>readFileSync(p,'utf8');
const migration=suffix=>read('supabase/migrations/'+readdirSync('supabase/migrations').find(f=>f.endsWith(suffix)));
test('real contracts: investigation candidate -> human bet -> reviewed outcome -> memory; legacy origin survives',async()=>{
 const db=new PGlite();try{
 const baseline=read('scripts/test-growth-bets-release-3b.mjs').match(/const fixtureSql = `([\s\S]*?)`;/)[1];
 await db.exec(baseline);
 for(const suffix of ['_growth_feed_release_2.sql','_growth_bets_release_3a.sql','_growth_bets_release_3b.sql','_growth_bet_timeline_sequence.sql'])await db.exec(migration(suffix));
 const outcomeFixture=read('scripts/test-growth-outcomes-release-4.mjs').match(/psql\(\[\], `([\s\S]*?)`\);/)[1];
 await db.exec(outcomeFixture);
 for(const suffix of ['_growth_outcomes_release_4.sql','_growth_memory_release_5.sql','_growth_memory_revision_guard_reset.sql','_growth_learning_reuse_release_6.sql'])await db.exec(migration(suffix));
 await db.exec(`create table auth.users(id uuid primary key);insert into auth.users values('11111111-1111-4111-8111-111111111111');
 create table profiles(id uuid,role text);insert into profiles values('11111111-1111-4111-8111-111111111111','admin');
 create table report_live_memberships(user_id uuid,role text,active boolean);insert into report_live_memberships values('11111111-1111-4111-8111-111111111111','admin',true);
 create table growth_operations(operation_id text primary key,scope jsonb,lifecycle text,registry_revision int);
 insert into growth_operations values('synthetic','{"bu":"Synthetic","segment":"Synthetic","partner":"Synthetic"}','confirmada',1);
 create table growth_trigger_runtime_settings(id text,config_version int);insert into growth_trigger_runtime_settings values('pilot',1);
 create table growth_trigger_runtime_config(version int,operation_ids text[]);insert into growth_trigger_runtime_config values(1,array['synthetic']);
 create table growth_trigger_observation_runs(id uuid,period date,output jsonb,data_read_at timestamptz,completed_at timestamptz default now());
 create table communication_templates(template_id text,title text,version_label text,content_hash text,status text);
 create table activities(id uuid primary key default gen_random_uuid(),"BU" text,"Segmento" text,parceiro_canonico text,"Data de Disparo" timestamptz,status text,
 "Activity name / Taxonomia" text,"Canal" text,jornada text,"Etapa de aquisição" text,"Subgrupos" text,"Safra" text,"Oferta" text,"Oferta 2" text,"Ordem de disparo" int,template_id text,
 "Cartões Gerados" numeric,"Custo Total Campanha" numeric,"Propostas" numeric,"Aprovados" numeric,"Base Acionável" numeric,"Cliques" numeric);
 create function growth_reject_definition_mutation() returns trigger language plpgsql as $$begin raise exception 'immutable';end;$$;`);
 for(const suffix of ['_growth_investigations.sql','_growth_investigation_compatibility.sql','_growth_investigation_reads.sql','_growth_investigation_scope_guards.sql','_growth_investigation_visibility.sql','_growth_investigation_outcome_evaluator.sql','_growth_investigation_admin_grants.sql'])await db.exec(migration(suffix));
 await db.exec(`insert into growth_investigation_settings values(true,true,true,'1.0.0','${'a'.repeat(64)}');select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);`);
 const period=(await db.query("select (date_trunc('month',now() at time zone 'America/Sao_Paulo')-interval '1 month')::date::text p")).rows[0].p;
 await db.exec(`insert into activities("BU","Segmento",parceiro_canonico,"Data de Disparo",status,"Activity name / Taxonomia","Canal",jornada,"Cartões Gerados","Custo Total Campanha","Propostas","Aprovados") values('Synthetic','Synthetic','Synthetic','${period} 12:00:00-03','Realizado','Synthetic','SMS','Synthetic',10,100,20,15)`);
 // Trigger path, including global freshness changes, does not fan out T5 jobs.
 await db.query("insert into growth_trigger_observation_runs(id,period,output) values(gen_random_uuid(),$1,$2)",[period,JSON.stringify({performance:[{operation_id:'synthetic',state:'triggered'}],freshness:[{state:'triggered'}]})]);
 const agent={name:'claude',commit:'b'.repeat(40),skill_version:'1.0.0',skill_hash:'a'.repeat(64)};
 const j=(await db.query('select growth_claim_investigation($1) j',[JSON.stringify(agent)])).rows[0].j;assert.ok(j);
 const b={status:'conclusive',summary:'Investigar mudança de público no recorte.',facts:[{text:'Produção registrada para inspeção.',evidence_ids:[period+':cards']}],hypotheses:[],limitations:['Sem causalidade ou população integral certificada.'],next_checks:['Conferir público antes de repetir.'],candidate:{metric:'cards',title:'Investigar o público da execução',action:'Conferir público e registrar a próxima decisão.',success_criterion:'Registrar a verificação e a decisão do responsável.'}};
 const done=(await db.query('select growth_complete_investigation($1,$2,$3,$4) r',[j.job_id,j.lease_token,j.content_hash,JSON.stringify(b)])).rows[0].r;assert.ok(done.candidate_id);
 const event=(await db.query('select summary_snapshot from growth_feed_events where subject_id=$1',[done.candidate_id])).rows[0].summary_snapshot;
 assert.equal(event.period_start,period);assert.equal(event.baseline_value,10);
 const bet=(await db.query(`select * from growth_accept_signal_as_bet_with_memory($1,'CRM','Verificar melhoria do público','Testar público em nova janela','cards',10,20,'maior_melhor','Ao menos vinte cartões',$2::date,$2::date,'growth_investigation','[]')`,[done.candidate_id,period])).rows[0];
 assert.ok(bet.id);assert.equal(bet.source_action_candidate_id,done.candidate_id);
 const snapshot=(await db.query('select * from growth_evidence_snapshots where id=$1',[bet.evidence_snapshot_id])).rows[0];
 assert.equal(snapshot.source_run_id,null);assert.equal(snapshot.filters.investigation_id,j.investigation_id);
 assert.equal((await db.query('select count(*)::int n from report_runs')).rows[0].n,0);
 await db.query("select growth_append_bet_update($1,'execution','Synthetic completed execution','completed',null)",[bet.id]);
 const out=(await db.query('select growth_evaluate_investigation_bet($1) id',[bet.id])).rows[0];
 assert.equal((await db.query('select observed_value from report_action_outcomes where id=$1',[out.id])).rows[0].observed_value,'10');
 assert.equal((await db.query('select growth_evaluate_investigation_bet($1) id',[bet.id])).rows[0].id,out.id);
 await db.query("select growth_review_outcome($1,'confirm')",[out.id]);
 assert.equal((await db.query('select count(*)::int n from growth_learnings where source_outcome_id=$1',[out.id])).rows[0].n,1);
 // A legacy report candidate still accepts through its original report context.
 const run=(await db.query("insert into report_runs(period_start,period_end,source_hash) values($1,$1,'legacy') returning id",[period])).rows[0].id;
 const legacy=(await db.query("insert into report_action_candidates(run_id,source_view,entity_key,signal_code,domain,bucket,signal,action_text,confidence_status,generated_by) values($1,'VIEW_TEST','legacy','LEGACY','crm','Investigar','Legacy signal','Check legacy evidence','directional','test') returning action_candidate_id",[run])).rows[0].action_candidate_id;
 const oldBet=(await db.query("select (growth_accept_signal_as_bet($1,'CRM','Legacy hypothesis','Legacy action','cards',10,20,'maior_melhor','Legacy criterion',$2,$2,'VIEW_TEST')).id id",[legacy,period])).rows[0].id;
 assert.ok(oldBet);
 }finally{await db.close();}
});
