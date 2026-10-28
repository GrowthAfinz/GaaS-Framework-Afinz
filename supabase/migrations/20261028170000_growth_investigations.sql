-- Agent-operated investigation queue. No model API, no source corrections.
begin;
create table public.growth_investigation_settings (
 id boolean primary key default true check(id), intake_enabled boolean not null default false,
 candidates_enabled boolean not null default false, skill_version text not null,
 skill_hash text not null check(skill_hash ~ '^[a-f0-9]{64}$')
);
create table public.growth_investigations (
 id uuid primary key default gen_random_uuid(), operation_id text not null references public.growth_operations,
 period date not null check(extract(day from period)=1), question_type text not null check(question_type in ('result_change','execution_review')),
 filters jsonb not null default '{}', current_revision integer not null default 0,
 requested_by uuid references auth.users, created_at timestamptz not null default now(),
 unique(operation_id,period,question_type,filters)
);
create table public.growth_investigation_evidence (
 id uuid primary key default gen_random_uuid(), investigation_id uuid not null references public.growth_investigations,
 revision integer not null, content_hash text not null check(content_hash ~ '^[a-f0-9]{64}$'),
 packet jsonb not null, read_at timestamptz not null default statement_timestamp(),
 unique(investigation_id,revision)
);
create table public.growth_investigation_jobs (
 id uuid primary key default gen_random_uuid(), evidence_id uuid not null unique references public.growth_investigation_evidence,
 investigation_id uuid not null references public.growth_investigations,
 state text not null default 'pending' check(state in ('pending','running','completed','blocked','failed','superseded')),
 attempts integer not null default 0, lease_token uuid, lease_until timestamptz,
 agent_metadata jsonb, last_error text, created_at timestamptz not null default now(), finished_at timestamptz
);
create index growth_investigation_jobs_pending on public.growth_investigation_jobs(state,created_at);
create table public.growth_investigation_attempts (
 id uuid primary key default gen_random_uuid(), job_id uuid not null references public.growth_investigation_jobs,
 attempt integer not null, lease_token uuid not null, agent_metadata jsonb not null,
 started_at timestamptz not null default clock_timestamp(), finished_at timestamptz, outcome text,
 unique(job_id,attempt)
);
create table public.growth_investigation_analyses (
 id uuid primary key default gen_random_uuid(), job_id uuid not null unique references public.growth_investigation_jobs,
 evidence_id uuid not null references public.growth_investigation_evidence, investigation_id uuid not null references public.growth_investigations,
 body jsonb not null, agent_metadata jsonb not null, completion_token uuid not null,
 created_at timestamptz not null default now()
);
create table public.growth_investigation_decisions (
 id uuid primary key default gen_random_uuid(), investigation_id uuid not null references public.growth_investigations,
 evidence_id uuid not null references public.growth_investigation_evidence,
 decision text not null check(decision in ('investigate','expected','request_data','no_action','propose_bet')),
 reason text not null check(length(btrim(reason)) between 5 and 4000), actor_id uuid not null references auth.users,
 created_at timestamptz not null default now()
);
alter table public.report_action_candidates alter column run_id drop not null;
alter table public.report_action_candidates add column investigation_id uuid references public.growth_investigations;
alter table public.report_action_candidates add column analysis_id uuid references public.growth_investigation_analyses;
alter table public.report_action_candidates add constraint growth_candidate_origin check(
 (run_id is not null and investigation_id is null and analysis_id is null) or
 (run_id is null and investigation_id is not null and analysis_id is not null));
create unique index growth_candidate_investigation_unique on public.report_action_candidates(investigation_id) where investigation_id is not null;

create function public.growth_investigation_can_access(p_operation text,p_write boolean default false)
returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.growth_operations o
 join public.growth_trigger_runtime_settings s on s.id='pilot'
 join public.growth_trigger_runtime_config c on c.version=s.config_version and o.operation_id=any(c.operation_ids)
 join public.report_live_memberships m on m.user_id=(select auth.uid()) and m.active
 join public.profiles p on p.id=m.user_id
 where o.operation_id=p_operation and o.lifecycle='confirmada'
 and (not p_write or m.role in ('analyst','publisher','admin'))
 and (p.role::text in ('admin','growth_b2c') or (p.role::text='analista_plurix' and o.scope->>'bu'='Plurix')));
$$;
create function public.growth_investigation_agent_required() returns void
language plpgsql security invoker set search_path='' as $$
begin
 if session_user not in ('postgres','supabase_admin') and
 coalesce(current_setting('request.jwt.claim.role',true),nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'role','')<>'service_role'
 then raise exception 'agent_access_required'; end if;
end;$$;

-- One statement snapshot; row identity remains separate from candidate execution identity.
create function public.growth_investigation_packet(p_operation text,p_period date,p_filters jsonb default '{}')
returns jsonb language plpgsql security definer set search_path='' as $$
declare o public.growth_operations; packet jsonb;
begin
 select * into strict o from public.growth_operations where operation_id=p_operation;
 if not exists(select 1 from public.growth_trigger_runtime_settings s join public.growth_trigger_runtime_config c on c.version=s.config_version
 where s.id='pilot' and p_operation=any(c.operation_ids)) then raise exception 'outside_pilot'; end if;
 if p_period is null or extract(day from p_period)<>1 or p_period>date_trunc('month',now() at time zone 'America/Sao_Paulo')::date
 or p_period<(date_trunc('month',now())-interval '24 months')::date then raise exception 'invalid_period'; end if;
 if jsonb_typeof(p_filters)<>'object' or exists(select 1 from jsonb_object_keys(p_filters) k where k not in ('channel','journey','activity_name','execution_at','stage','subgroup','safra'))
 or exists(select 1 from jsonb_each(p_filters) kv where jsonb_typeof(kv.value)<>'string' or length(kv.value::text)>500)
 then raise exception 'invalid_filters'; end if;
 with scoped as (
 select a.*, date_trunc('month',a."Data de Disparo" at time zone 'America/Sao_Paulo')::date as month,
 (select count(*) from public.activities other
 where other."Activity name / Taxonomia" is not distinct from a."Activity name / Taxonomia"
 and other."Data de Disparo"=a."Data de Disparo" and other."BU" is not distinct from a."BU"
 and other."Canal" is not distinct from a."Canal") key_count
 from public.activities a where a."BU"=o.scope->>'bu' and a."Segmento"=o.scope->>'segment' and a.parceiro_canonico=o.scope->>'partner'
 and a."Data de Disparo">=((p_period-interval '6 months')::timestamp at time zone 'America/Sao_Paulo')
 and a."Data de Disparo"<((p_period+interval '1 month')::timestamp at time zone 'America/Sao_Paulo')
 ), selected as (
 select * from scoped a where
 (not p_filters?'channel' or a."Canal"=p_filters->>'channel') and
 (not p_filters?'journey' or a.jornada=p_filters->>'journey') and
 (not p_filters?'activity_name' or a."Activity name / Taxonomia"=p_filters->>'activity_name') and
 (not p_filters?'execution_at' or a."Data de Disparo"=(p_filters->>'execution_at')::timestamptz) and
 (not p_filters?'stage' or a."Etapa de aquisição"=p_filters->>'stage') and
 (not p_filters?'subgroup' or a."Subgrupos"=p_filters->>'subgroup') and
 (not p_filters?'safra' or a."Safra"=p_filters->>'safra')
 ), monthly as (
 select month,count(*) rows,count(*) filter(where key_count>1) ambiguous_rows,
 count(*) filter(where status is null or status not in ('Realizado','Enviado')) unproven_rows,
 count(*) filter(where "Cartões Gerados"<0 or "Custo Total Campanha"<0 or "Propostas"<0 or "Aprovados"<0) invalid_rows,
 count(*) filter(where "Cartões Gerados" is null) missing_cards,count(*) filter(where "Custo Total Campanha" is null) missing_cost,
 count(*) filter(where "Propostas" is null) missing_proposals,count(*) filter(where "Aprovados" is null) missing_approved,
 count(*) filter(where "Base Acionável" is null) missing_actionable,count(*) filter(where "Cliques" is null) missing_clicks,
 sum("Cartões Gerados") cards,sum("Custo Total Campanha") cost,sum("Propostas") proposals,sum("Aprovados") approved,
 sum("Base Acionável") actionable,sum("Cliques") clicks,
 sum("Cartões Gerados") filter(where key_count=1) cards_exclusion_policy,
 count(*) filter(where nullif(btrim(template_id),'') is not null) template_linked
 from selected group by month
 ), metrics as (
 select m.*,x.key,x.value,x.missing,
 ambiguous_rows=0 and unproven_rows=0 and invalid_rows=0 and x.missing=0 as eligible
 from monthly m cross join lateral (values
 ('cards',cards,missing_cards),('cost',cost,missing_cost),('proposals',proposals,missing_proposals),
 ('approved',approved,missing_approved),('actionable_exposures',actionable,missing_actionable),('clicks',clicks,missing_clicks),
 ('cost_per_card',case when cards>0 then cost/cards end,case when cards>0 then greatest(missing_cards,missing_cost) else rows end)
 ) x(key,value,missing)
 ), evidence as (
 select jsonb_build_object('id',month::text||':'||key,'month',month,'metric',key,
 'value',case when eligible then case when key in ('cost','cost_per_card') then round(value,6) else value end end,'recorded_row_sum',case when key<>'cost_per_card' then value end,
 'known_rows',rows-missing,'total_rows',rows,'status',case when ambiguous_rows>0 or unproven_rows>0 or invalid_rows>0 then 'blocked'
 when missing=rows then 'unavailable' when missing>0 then 'partial' else 'observed' end) item from metrics
 ), cuts as (
 select "Canal" channel,jornada journey,count(*) rows,sum("Cartões Gerados") recorded_row_sum,
 count(*) filter(where key_count>1) ambiguous_rows
 from selected where month=p_period group by "Canal",jornada
 ) select jsonb_build_object('schema_version','growth-investigation-v1','operation_id',o.operation_id,'scope',o.scope,
 'registry_revision',o.registry_revision,'filters',p_filters,'period',p_period,'timezone','America/Sao_Paulo',
 'period_state',case when p_period=date_trunc('month',now() at time zone 'America/Sao_Paulo')::date then 'open' else 'closed' end,
 'knowledge_mode','current_reconstruction','source','activities','numeric_policy','BRL and cost/card rounded to six decimals; source fields unchanged','latest_event_at',(select max("Data de Disparo") from selected where month=p_period),
 'original_observation',(select jsonb_build_object('run_id',r.id,'data_read_at',r.data_read_at,'performance',
 (select jsonb_agg(x) from jsonb_array_elements(r.output->'performance') x where x->>'operation_id'=p_operation))
 from public.growth_trigger_observation_runs r where r.period=p_period and exists(select 1 from jsonb_array_elements(r.output->'performance') x where x->>'operation_id'=p_operation) order by r.completed_at,r.id limit 1),
 'monthly',coalesce((select jsonb_agg(to_jsonb(m) order by month) from monthly m),'[]'),
 'evidence',coalesce((select jsonb_agg(item order by item->>'id') from evidence),'[]'),
 'cuts',coalesce((select jsonb_agg(to_jsonb(c) order by channel,journey) from cuts c),'[]'),
 'communications',coalesce((select jsonb_agg(jsonb_build_object('template_id',t.template_id,'title',t.title,
 'version_label',t.version_label,'content_hash',t.content_hash,'status',t.status,'historical_version_verified',false) order by t.template_id)
 from public.communication_templates t where exists(select 1 from selected a where a.month=p_period and a.template_id=t.template_id)),'[]'),
 'memory_context',coalesce((select jsonb_agg(jsonb_build_object('id',l.id,'revision',l.current_revision,'source_kind',l.source_kind,
 'source_ref',l.source_ref,'statement',l.statement,'classification',l.classification,'valid_from',l.valid_from,
 'review_at',l.review_at,'valid_until',l.valid_until,'review_due',l.review_at<=current_date) order by l.id)
 from public.growth_learnings l where l.front='crm_acquisition' and l.lifecycle_status='active' and l.valid_from<=current_date
 and (l.valid_until is null or l.valid_until>=current_date) and l.scope->>'partner'=o.scope->>'partner'
 and (not l.scope?'segment' or l.scope->>'segment'=o.scope->>'segment')
 and (not l.scope?'bu' or l.scope->>'bu'=o.scope->>'bu')),'[]'),
 'source_rows',coalesce((select jsonb_agg(jsonb_build_object('id',id,'month',month,'activity_name',"Activity name / Taxonomia",
 'execution_at',"Data de Disparo",'channel',"Canal",'journey',jornada,'stage',"Etapa de aquisição",'subgroup',"Subgrupos",
 'safra',"Safra",'offer',"Oferta",'offer2',"Oferta 2",'order',"Ordem de disparo",'template_id',template_id,
 'cards',"Cartões Gerados",'cost',"Custo Total Campanha",'proposals',"Propostas",'approved',"Aprovados",'actionable',"Base Acionável",
 'clicks',"Cliques",'status',status,'key_count',key_count) order by id) from selected),'[]'),
 'limitations',jsonb_build_array('População integral da origem não certificada.','Mediana é referência descritiva, não causalidade.',
 'Data de evento não certifica ingestão ou maturação.','Template vinculado não prova versão histórica.','Base acionável representa exposições, não pessoas únicas.')) into packet;
 return packet;
end;$$;

create function public.growth_investigation_refresh(p_id uuid) returns uuid
language plpgsql security definer set search_path='' as $$
declare i public.growth_investigations; p jsonb; h text; e uuid; last_hash text;
begin
 select * into strict i from public.growth_investigations where id=p_id for update;
 p:=public.growth_investigation_packet(i.operation_id,i.period,i.filters);
 h:=encode(sha256(convert_to(p::text,'UTF8')),'hex');
 select id,content_hash into e,last_hash from public.growth_investigation_evidence where investigation_id=i.id and revision=i.current_revision;
 if h=last_hash then return e; end if;
 insert into public.growth_investigation_evidence(investigation_id,revision,content_hash,packet)
 values(i.id,i.current_revision+1,h,p) returning id into e;
 update public.growth_investigations set current_revision=current_revision+1 where id=i.id;
 update public.growth_investigation_jobs set state='superseded',lease_token=null,lease_until=null where investigation_id=i.id and state in ('pending','running','failed');
 insert into public.growth_investigation_jobs(evidence_id,investigation_id) values(e,i.id);
 return e;
end;$$;

create function public.growth_request_investigation(p_operation text,p_period date,p_question text default 'result_change',p_filters jsonb default '{}')
returns uuid language plpgsql security definer set search_path='' as $$
declare i uuid;
begin
 if not public.growth_investigation_can_access(p_operation,true) then raise exception 'investigation_access_denied'; end if;
 if not exists(select 1 from public.growth_investigation_settings where intake_enabled) then raise exception 'intake_paused'; end if;
 insert into public.growth_investigations(operation_id,period,question_type,filters,requested_by)
 values(p_operation,p_period,p_question,p_filters,auth.uid()) on conflict(operation_id,period,question_type,filters) do update set operation_id=excluded.operation_id returning id into i;
 perform public.growth_investigation_refresh(i); return i;
end;$$;

create function public.growth_investigation_from_observation() returns trigger
language plpgsql security definer set search_path='' as $$
declare r record; i uuid; op text;
begin
 if not exists(select 1 from public.growth_investigation_settings where intake_enabled) then return new; end if;
 -- T5 is global source health, never fan-out into per-operation analysis jobs.
 for op in select distinct item->>'operation_id' from jsonb_array_elements(new.output->'performance') item where item->>'state'='triggered'
 loop
  insert into public.growth_investigations(operation_id,period,question_type) values(op,new.period,'result_change')
  on conflict(operation_id,period,question_type,filters) do nothing;
 end loop;
 for r in select id from public.growth_investigations where period=new.period loop perform public.growth_investigation_refresh(r.id); end loop;
 return new;
end;$$;
create trigger growth_observation_investigation after insert on public.growth_trigger_observation_runs
for each row execute function public.growth_investigation_from_observation();

create function public.growth_claim_investigation(p_agent jsonb,p_job uuid default null) returns jsonb
language plpgsql security definer set search_path='' as $$
declare j public.growth_investigation_jobs; e public.growth_investigation_evidence; s public.growth_investigation_settings; token uuid;
begin
 perform public.growth_investigation_agent_required();
 select * into strict s from public.growth_investigation_settings where intake_enabled;
 if jsonb_typeof(p_agent)<>'object' or coalesce(p_agent->>'name','') not in ('codex','claude') or
 coalesce(p_agent->>'commit','') !~ '^[a-f0-9]{40}$' or p_agent->>'skill_version' is distinct from s.skill_version
 or p_agent->>'skill_hash' is distinct from s.skill_hash then raise exception 'invalid_agent_contract'; end if;
 update public.growth_investigation_jobs set state='failed',last_error='lease_expired_after_three_attempts' where state='running' and attempts>=3 and lease_until<clock_timestamp();
 select * into j from public.growth_investigation_jobs where (p_job is null or id=p_job)
 and (state='pending' or (state='running' and lease_until<clock_timestamp())) and attempts<3 order by created_at,id for update skip locked limit 1;
 if not found then return null; end if;

 update public.growth_investigation_attempts set finished_at=clock_timestamp(),outcome='expired'
 where job_id=j.id and finished_at is null;
 token:=gen_random_uuid();
 update public.growth_investigation_jobs set state='running',attempts=attempts+1,lease_token=token,
 lease_until=clock_timestamp()+interval '30 minutes',agent_metadata=p_agent,last_error=null where id=j.id returning * into j;
 insert into public.growth_investigation_attempts(job_id,attempt,lease_token,agent_metadata) values(j.id,(select coalesce(max(attempt),0)+1 from public.growth_investigation_attempts where job_id=j.id),token,p_agent);
 select * into strict e from public.growth_investigation_evidence where id=j.evidence_id;
 return jsonb_build_object('job_id',j.id,'investigation_id',j.investigation_id,'lease_token',token,'lease_until',j.lease_until,
 'evidence_id',e.id,'content_hash',e.content_hash,'revision',e.revision,'read_at',e.read_at,'packet',e.packet,
 'question_type',(select question_type from public.growth_investigations where id=j.investigation_id));
end;$$;

create function public.growth_renew_investigation(p_job uuid,p_token uuid) returns boolean
language plpgsql security definer set search_path='' as $$
begin
 perform public.growth_investigation_agent_required();
 update public.growth_investigation_jobs set lease_until=clock_timestamp()+interval '30 minutes'
 where id=p_job and state='running' and lease_token=p_token and lease_until>clock_timestamp(); return found;
end;$$;
create function public.growth_fail_investigation(p_job uuid,p_token uuid,p_error text) returns boolean
language plpgsql security definer set search_path='' as $$
begin
 perform public.growth_investigation_agent_required();
 update public.growth_investigation_jobs set state=case when attempts>=3 then 'failed' else 'pending' end,
 last_error=left(p_error,300),lease_token=null,lease_until=null
 where id=p_job and state='running' and lease_token=p_token and lease_until>clock_timestamp();
 if not found then return false; end if;
 update public.growth_investigation_attempts set outcome='failed',finished_at=clock_timestamp() where job_id=p_job and lease_token=p_token;return true;
end;$$;

create function public.growth_complete_investigation(p_job uuid,p_token uuid,p_hash text,p_body jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare j public.growth_investigation_jobs; e public.growth_investigation_evidence; i public.growth_investigations;
 a uuid; c uuid; claim jsonb; ref jsonb; ev jsonb; proposal jsonb; metric text; value numeric; current_metric jsonb;
begin
 perform public.growth_investigation_agent_required();
 select * into strict j from public.growth_investigation_jobs where id=p_job;
 perform 1 from public.growth_investigations where id=j.investigation_id for update;
 select * into strict j from public.growth_investigation_jobs where id=p_job for update;
 select id into a from public.growth_investigation_analyses where job_id=p_job and completion_token=p_token;
 if a is not null then
  if (select body from public.growth_investigation_analyses where id=a) is distinct from p_body then raise exception 'completion_conflict'; end if;
  return jsonb_build_object('analysis_id',a,'candidate_id',(select action_candidate_id from public.report_action_candidates where analysis_id=a),'reused',true);
 end if;
 if j.state<>'running' or j.lease_token is distinct from p_token or j.lease_until<=clock_timestamp() then raise exception 'lease_lost'; end if;
 select * into strict i from public.growth_investigations where id=j.investigation_id;
 perform public.growth_investigation_refresh(i.id);
 select * into strict e from public.growth_investigation_evidence where id=j.evidence_id;
 if e.content_hash is distinct from p_hash or e.revision<>(select current_revision from public.growth_investigations where id=i.id) then
  return jsonb_build_object('state','superseded','reason','Evidence changed; claim current revision');
 end if;
 if jsonb_typeof(p_body)<>'object' or coalesce(p_body->>'status','') not in ('conclusive','inconclusive','blocked')
 or jsonb_typeof(p_body->'facts') is distinct from 'array' or jsonb_array_length(p_body->'facts')=0
 or jsonb_typeof(p_body->'hypotheses') is distinct from 'array'
 or jsonb_typeof(p_body->'limitations') is distinct from 'array' or jsonb_array_length(p_body->'limitations')=0
 or jsonb_typeof(p_body->'next_checks') is distinct from 'array' or jsonb_array_length(p_body->'next_checks')=0
 or length(coalesce(p_body->>'summary','')) not between 10 and 4000 then raise exception 'invalid_analysis'; end if;
 if exists(select 1 from jsonb_array_elements((p_body->'limitations')||(p_body->'next_checks')) x where jsonb_typeof(x)<>'string' or length(btrim(x#>>'{}'))<5) then raise exception 'invalid_analysis_text'; end if;
 if length(p_body::text)>60000 then raise exception 'analysis_too_large'; end if;
 for claim in select v from jsonb_array_elements((p_body->'facts')||(p_body->'hypotheses')) v loop
  if length(coalesce(claim->>'text','')) not between 5 and 3000 or jsonb_typeof(claim->'evidence_ids') is distinct from 'array'
  or jsonb_array_length(claim->'evidence_ids')=0 then raise exception 'claim_requires_evidence'; end if;
  for ref in select v from jsonb_array_elements(claim->'evidence_ids') v loop
   if not exists(select 1 from jsonb_array_elements(e.packet->'evidence') x where x->>'id'=ref#>>'{}') then raise exception 'unknown_evidence'; end if;
  end loop;
  if claim?'values' then
   if jsonb_typeof(claim->'values')<>'array' then raise exception 'invalid_values'; end if;
   for ref in select v from jsonb_array_elements(claim->'values') v loop
    select x into ev from jsonb_array_elements(e.packet->'evidence') x where x->>'id'=ref->>'evidence_id';
    if ev is null or ev->'value' is distinct from ref->'value' or not (claim->'evidence_ids')? (ref->>'evidence_id') then raise exception 'value_mismatch'; end if;
   end loop;
  end if;
 end loop;
 proposal:=p_body->'candidate';
 if proposal is not null and proposal<>'null'::jsonb then
  metric:=proposal->>'metric';
  select x into current_metric from jsonb_array_elements(e.packet->'evidence') x where x->>'id'=i.period::text||':'||metric;
  if p_body->>'status'<>'conclusive' or e.packet->>'period_state'<>'closed' or current_metric is null
  or current_metric->>'status'<>'observed' or current_metric->'value'='null'::jsonb
  or metric not in ('cards','cost_per_card','proposals','approved')
  or length(coalesce(proposal->>'action','')) not between 10 and 3000
  or length(coalesce(proposal->>'success_criterion','')) not between 10 and 3000
  or length(coalesce(proposal->>'title','')) not between 10 and 300
  then raise exception 'candidate_not_eligible'; end if;
  if metric='cost_per_card' and ((select (x->>'value')::numeric from jsonb_array_elements(e.packet->'evidence') x where x->>'id'=i.period::text||':cards')<20 or (select count(*) from jsonb_array_elements(e.packet->'evidence') x
    where x->>'metric'='cards' and (x->>'month')::date<i.period and x->>'status'='observed' and (x->>'value')::numeric>=20)<4)
  then raise exception 'insufficient_cac_reference'; end if;
 end if;
 insert into public.growth_investigation_analyses(job_id,evidence_id,investigation_id,body,agent_metadata,completion_token)
 values(j.id,e.id,i.id,p_body,j.agent_metadata,p_token) returning id into a;
 if proposal is not null and proposal<>'null'::jsonb and exists(select 1 from public.growth_investigation_settings where candidates_enabled) then
  c:=public.growth_publish_investigation_analysis(a);
 end if;
 update public.growth_investigation_jobs set state=case when p_body->>'status'='blocked' then 'blocked' else 'completed' end,
 finished_at=clock_timestamp(),lease_until=null where id=j.id;
 update public.growth_investigation_attempts set outcome='completed',finished_at=clock_timestamp() where job_id=j.id and lease_token=p_token;
 return jsonb_build_object('analysis_id',a,'candidate_id',c,'reused',false);
end;$$;

create function public.growth_publish_investigation_analysis(p_analysis uuid) returns uuid
language plpgsql security definer set search_path='' as $$
declare a public.growth_investigation_analyses; e public.growth_investigation_evidence; i public.growth_investigations;
 proposal jsonb; metric text; c uuid; p_body jsonb; j public.growth_investigation_jobs;
begin
 perform public.growth_investigation_agent_required();
 if not exists(select 1 from public.growth_investigation_settings where intake_enabled and candidates_enabled) then raise exception 'publication_paused'; end if;
 select * into strict a from public.growth_investigation_analyses where id=p_analysis;
 select * into strict i from public.growth_investigations where id=a.investigation_id for update;
 select * into strict e from public.growth_investigation_evidence where id=a.evidence_id;
 if e.revision<>i.current_revision or e.content_hash<>encode(sha256(convert_to(public.growth_investigation_packet(i.operation_id,i.period,i.filters)::text,'UTF8')),'hex') then raise exception 'investigation_evidence_stale'; end if;
 p_body:=a.body;proposal:=p_body->'candidate';metric:=proposal->>'metric';
 if proposal is null or proposal='null'::jsonb then return null; end if;
 select * into strict j from public.growth_investigation_jobs where id=a.job_id;
  insert into public.report_action_candidates(run_id,investigation_id,analysis_id,source_view,entity_key,signal_code,domain,partner,bucket,
  signal,impact,probable_cause,evidence_refs,reading_limit,action_text,success_metric,confidence_status,generated_by,verification_view)
  values(null,i.id,a.id,'growth_investigation',i.operation_id,'investigation:'||i.id,'CRM',e.packet->'scope'->>'partner','Investigar',
  proposal->>'title',p_body->>'summary','Hipóteses e alternativas disponíveis na investigação.',
  jsonb_build_array(jsonb_build_object('investigation_id',i.id,'evidence_id',e.id,'analysis_id',a,'hash',e.content_hash)),
  array_to_string(array(select jsonb_array_elements_text(p_body->'limitations')),' '),proposal->>'action',metric,'directional',
  j.agent_metadata->>'name','?view=learning&section=investigations&item='||i.id)
  on conflict(investigation_id) where investigation_id is not null do nothing returning action_candidate_id into c;
 return coalesce(c,(select action_candidate_id from public.report_action_candidates where investigation_id=i.id));
end;$$;

create function public.growth_decide_investigation(p_id uuid,p_revision integer,p_decision text,p_reason text) returns uuid
language plpgsql security definer set search_path='' as $$
declare i public.growth_investigations; e uuid; d uuid;
begin
 select * into strict i from public.growth_investigations where id=p_id for update;
 if not public.growth_investigation_can_access(i.operation_id,true) then raise exception 'investigation_access_denied'; end if;
 e:=public.growth_investigation_refresh(i.id);
 if p_revision<>(select revision from public.growth_investigation_evidence where id=e) then raise exception 'evidence_changed'; end if;
 if p_decision='propose_bet' and not exists(select 1 from public.report_action_candidates c join public.growth_investigation_analyses a on a.id=c.analysis_id
 where c.investigation_id=i.id and a.evidence_id=e and c.review_status<>'rejected') then raise exception 'eligible_candidate_required'; end if;
 insert into public.growth_investigation_decisions(investigation_id,evidence_id,decision,reason,actor_id)
 values(i.id,e,p_decision,p_reason,auth.uid()) returning id into d;return d;
end;$$;
create function public.growth_retry_investigation(p_id uuid) returns void
language plpgsql security definer set search_path='' as $$
declare i public.growth_investigations;
begin
 select * into strict i from public.growth_investigations where id=p_id for update;
 if not public.growth_investigation_can_access(i.operation_id,true) then raise exception 'investigation_access_denied'; end if;
 perform public.growth_investigation_refresh(i.id);
 update public.growth_investigation_jobs set state='pending',attempts=0,last_error=null where investigation_id=i.id and state='failed'
 and evidence_id in(select id from public.growth_investigation_evidence where investigation_id=i.id and revision=i.current_revision);
end;$$;

-- Tables are read-only to app sessions, with operation-level RLS. All writes use RPCs.
do $$declare t text;begin
 foreach t in array array['growth_investigations','growth_investigation_evidence','growth_investigation_jobs','growth_investigation_attempts','growth_investigation_analyses','growth_investigation_decisions','growth_investigation_settings'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from public,anon,authenticated',t);
 execute format('grant select on public.%I to authenticated,service_role',t);
 end loop;
end;$$;
create policy investigation_read on public.growth_investigations for select to authenticated using(public.growth_investigation_can_access(operation_id));
create policy investigation_settings_read on public.growth_investigation_settings for select to authenticated using(exists(select 1 from public.report_live_memberships where user_id=(select auth.uid()) and active));
do $$declare t text;begin
 foreach t in array array['growth_investigation_evidence','growth_investigation_jobs','growth_investigation_analyses','growth_investigation_decisions'] loop
 execute format('create policy investigation_child_read on public.%I for select to authenticated using(exists(select 1 from public.growth_investigations i where i.id=investigation_id))',t);
 end loop;
end;$$;
create policy investigation_attempt_read on public.growth_investigation_attempts for select to authenticated using(exists(select 1 from public.growth_investigation_jobs j where j.id=job_id));
create policy investigation_candidate_scope on public.report_action_candidates as restrictive for select to authenticated
using(investigation_id is null or exists(select 1 from public.growth_investigations i where i.id=investigation_id));
create function public.growth_investigation_candidate_access(p_candidate uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select coalesce((select c.investigation_id is null or public.growth_investigation_can_access(i.operation_id)
 from public.report_action_candidates c left join public.growth_investigations i on i.id=c.investigation_id
 where c.action_candidate_id=p_candidate),true);
$$;
create policy investigation_feed_scope on public.growth_feed_events as restrictive for select to authenticated
using(subject_type<>'action_candidate' or public.growth_investigation_candidate_access(subject_id));
-- Scope helper for feed is added in compatibility migration to avoid hidden-row inference.
do $$declare t text;begin
 foreach t in array array['growth_investigation_evidence','growth_investigation_analyses','growth_investigation_decisions'] loop
 execute format('create trigger investigation_immutable before update or delete on public.%I for each row execute function public.growth_reject_definition_mutation()',t);
 end loop;
end;$$;
do $$declare r record;begin
 for r in select oid::regprocedure name,proname from pg_proc where pronamespace='public'::regnamespace and
 (proname like 'growth_%investigation%' or proname='growth_investigation_can_access') loop
 execute format('revoke all on function %s from public,anon,authenticated',r.name);
 execute format('grant execute on function %s to service_role',r.name);
 if r.proname in ('growth_investigation_can_access','growth_investigation_candidate_access','growth_request_investigation','growth_decide_investigation','growth_retry_investigation') then
 execute format('grant execute on function %s to authenticated',r.name);end if;
 end loop;
end;$$;
commit;
