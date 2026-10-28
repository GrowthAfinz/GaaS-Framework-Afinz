-- A1/A2: observation only. Never emits candidates/feed/bets or updates source metrics.
begin;
create schema if not exists growth_private;
revoke all on schema growth_private from public, anon, authenticated;

create table public.growth_trigger_runtime_config (
  version integer primary key check(version > 0),
  operation_ids text[] not null check(cardinality(operation_ids) > 0),
  rule_ids text[] not null check(cardinality(rule_ids) > 0),
  certified_run_id uuid not null references public.report_runs(id),
  responsible_label text not null,
  approval_ref text not null,
  approved_by text not null,
  recorded_at timestamptz not null default now()
);
create trigger growth_trigger_runtime_config_immutable before update or delete on public.growth_trigger_runtime_config
for each row execute function public.growth_reject_definition_mutation();

create table public.growth_trigger_runtime_settings (
  id text primary key check(id='pilot'),
  config_version integer not null references public.growth_trigger_runtime_config(version),
  observation_enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

create table public.growth_trigger_observation_runs (
  id uuid primary key default gen_random_uuid(),
  input_hash text not null unique check(input_hash ~ '^[0-9a-f]{64}$'),
  output_hash text not null check(output_hash ~ '^[0-9a-f]{64}$'),
  period date not null check(extract(day from period)=1),
  evaluation_as_of date not null,
  config_version integer not null references public.growth_trigger_runtime_config(version),
  engine_version text not null,
  data_read_at timestamptz not null,
  input_snapshot jsonb not null,
  output jsonb not null,
  mode text not null default 'observacao' check(mode='observacao'),
  requested_by uuid references auth.users(id),
  completed_at timestamptz not null default now(),
  check(jsonb_typeof(output->'performance')='array'),
  check(jsonb_typeof(output->'freshness')='array')
);
create index growth_trigger_observation_period_idx on public.growth_trigger_observation_runs(period, completed_at desc);
create trigger growth_trigger_observation_runs_immutable before update or delete on public.growth_trigger_observation_runs
for each row execute function public.growth_reject_definition_mutation();

create table public.growth_trigger_observation_jobs (
  period date primary key check(extract(day from period)=1),
  revision bigint not null default 1,
  last_enqueued_txid bigint not null default txid_current(),
  processed_revision bigint not null default 0,
  reason text not null,
  state text not null default 'pending' check(state in ('pending','running','completed','failed')),
  attempts integer not null default 0,
  lease_token uuid,
  lease_until timestamptz,
  claimed_revision bigint,
  last_run_id uuid references public.growth_trigger_observation_runs(id),
  last_error text,
  next_attempt_at timestamptz not null default now(),
  changed_at timestamptz not null default now(),
  finished_at timestamptz
);

create table public.growth_trigger_observation_attempts (
  id uuid primary key default gen_random_uuid(),
  period date not null,
  requested_by uuid references auth.users(id),
  state text not null default 'running' check(state in ('running','completed','failed')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  run_id uuid references public.growth_trigger_observation_runs(id),
  error_code text
);

alter table public.growth_trigger_runtime_config enable row level security;
alter table public.growth_trigger_runtime_settings enable row level security;
alter table public.growth_trigger_observation_runs enable row level security;
alter table public.growth_trigger_observation_jobs enable row level security;
alter table public.growth_trigger_observation_attempts enable row level security;

create policy growth_trigger_config_member_read on public.growth_trigger_runtime_config for select to authenticated
using(exists(select 1 from public.report_live_memberships m where m.user_id=(select auth.uid()) and m.active));
create policy growth_trigger_settings_member_read on public.growth_trigger_runtime_settings for select to authenticated
using(exists(select 1 from public.report_live_memberships m where m.user_id=(select auth.uid()) and m.active));
create policy growth_trigger_runs_member_read on public.growth_trigger_observation_runs for select to authenticated
using(exists(select 1 from public.report_live_memberships m where m.user_id=(select auth.uid()) and m.active));
create policy growth_trigger_jobs_member_read on public.growth_trigger_observation_jobs for select to authenticated
using(exists(select 1 from public.report_live_memberships m where m.user_id=(select auth.uid()) and m.active));

revoke all on public.growth_trigger_runtime_config, public.growth_trigger_runtime_settings,
public.growth_trigger_observation_runs, public.growth_trigger_observation_jobs, public.growth_trigger_observation_attempts from public, anon, authenticated;
grant select on public.growth_trigger_runtime_config, public.growth_trigger_runtime_settings,
public.growth_trigger_observation_runs, public.growth_trigger_observation_jobs to authenticated;
grant select,insert on public.growth_trigger_runtime_config,public.growth_trigger_observation_runs to service_role;
grant select,insert,update on public.growth_trigger_runtime_settings,public.growth_trigger_observation_jobs,public.growth_trigger_observation_attempts to service_role;

create function public.growth_trigger_observation_inputs(p_period date)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  v_config public.growth_trigger_runtime_config;
  v_asof date := (statement_timestamp() at time zone 'America/Sao_Paulo')::date;
  v_cert public.report_runs;
  v_operations jsonb; v_rules jsonb; v_monthly jsonb; v_freshness jsonb; v_partners jsonb;
begin
  if p_period is null or extract(day from p_period)<>1 or p_period>date_trunc('month',v_asof)::date
    or p_period < (date_trunc('month',v_asof)-interval '24 months')::date then
    raise exception 'Invalid observation period';
  end if;
  select c.* into strict v_config from public.growth_trigger_runtime_settings s
    join public.growth_trigger_runtime_config c on c.version=s.config_version
    where s.id='pilot' and s.observation_enabled;
  select coalesce(jsonb_agg(to_jsonb(o) order by o.operation_id),'[]') into v_operations
    from public.growth_operations o where o.operation_id=any(v_config.operation_ids)
    and o.front='crm_aquisicao' and o.domain='CRM' and o.lifecycle='confirmada';
  if jsonb_array_length(v_operations)<>cardinality(v_config.operation_ids) then raise exception 'Pilot operations not confirmed'; end if;
  select coalesce(jsonb_agg(to_jsonb(r) order by r.rule_id),'[]') into v_rules
    from public.growth_trigger_rules r where r.rule_id=any(v_config.rule_ids)
    and r.enabled and r.mode='observacao' and r.valid_from<=v_asof and (r.valid_to is null or r.valid_to>v_asof);
  if jsonb_array_length(v_rules)<>cardinality(v_config.rule_ids) then raise exception 'Pilot rules unavailable'; end if;
  select * into strict v_cert from public.report_runs where id=v_config.certified_run_id;
  with scoped as (
    select a.*,date_trunc('month',a."Data de Disparo" at time zone 'America/Sao_Paulo')::date as month
    from public.activities a
    where a."Data de Disparo">=((p_period-interval '6 months')::timestamp at time zone 'America/Sao_Paulo')
      and a."Data de Disparo"<((p_period+interval '1 month')::timestamp at time zone 'America/Sao_Paulo')
      and exists(select 1 from public.growth_operations o where o.operation_id=any(v_config.operation_ids)
        and a."BU"=o.scope->>'bu' and a."Segmento"=o.scope->>'segment' and a.parceiro_canonico=o.scope->>'partner')
  ), monthly as (
    select month::text,"BU" as bu,"Segmento" as segment,parceiro_canonico as partner,
      count(*)::integer as dispatches,sum("Cartões Gerados")::text as cards,sum("Custo Total Campanha")::text as cost,
      count(*) filter(where "Cartões Gerados" is null)::integer as missing_cards,
      count(*) filter(where "Custo Total Campanha" is null)::integer as missing_cost,
      count(*) filter(where status not in ('Realizado','Enviado') or status is null)::integer as unproven_execution
    from scoped group by month,"BU","Segmento",parceiro_canonico
  ) select coalesce(jsonb_agg(to_jsonb(x) order by month,bu,segment,partner),'[]') into v_monthly from monthly x;
  with freshness as (
    select 'activities'::text as source,max(("Data de Disparo" at time zone 'America/Sao_Paulo')::date)::text as latest
      from public.activities where status in ('Realizado','Enviado') and "Data de Disparo"<=statement_timestamp()
    union all select 'paid_media_metrics:meta',max(date)::text from public.paid_media_metrics where lower(channel)='meta'
    union all select 'paid_media_metrics:google',max(date)::text from public.paid_media_metrics where lower(channel)='google'
    union all select 'b2c_daily_metrics',max(data)::text from public.b2c_daily_metrics
    union all select 'app_afinz_funnel_daily_raw',max(business_date)::text from public.app_afinz_funnel_daily_raw
    union all select 'serasa_bi_daily_funnel',max(data)::text from public.serasa_bi_daily_funnel
  ) select jsonb_agg(to_jsonb(x) order by source) into v_freshness from freshness x;
  with partner as (
    select parceiro_canonico as partner,sum("Cartões Gerados")::text as cards,
      count(*) filter(where "Cartões Gerados" is null)::integer as missing_cards,
      count(*) filter(where status not in ('Realizado','Enviado') or status is null)::integer as unproven_execution
    from public.activities a
    where "Data de Disparo">=(v_cert.period_start::timestamp at time zone 'America/Sao_Paulo')
      and "Data de Disparo"<((v_cert.period_end+1)::timestamp at time zone 'America/Sao_Paulo')
      and exists(select 1 from public.growth_operations o where o.operation_id=any(v_config.operation_ids) and a.parceiro_canonico=o.scope->>'partner')
    group by parceiro_canonico
  ) select coalesce(jsonb_agg(to_jsonb(x) order by partner),'[]') into v_partners from partner x;
  return jsonb_build_object('period',to_char(p_period,'YYYY-MM'),'evaluation_as_of',v_asof,'data_read_at',statement_timestamp(),
    'config',to_jsonb(v_config),'operations',v_operations,'rules',v_rules,'monthly',v_monthly,'freshness',v_freshness,
    'certified',jsonb_build_object('run_id',v_cert.id,'artifact_path',v_cert.artifact_path,'content_hash',v_cert.content_hash,
      'certification_status',v_cert.certification_status,'period',to_char(v_cert.period_start,'YYYY-MM'),'partners_current',v_partners));
end;
$$;

create function public.growth_trigger_complete_observation(p_input_hash text,p_output_hash text,p_input jsonb,p_output jsonb,p_requested_by uuid default null)
returns uuid language plpgsql security invoker set search_path = '' as $$
declare v_id uuid; v_existing_hash text;
begin
  if coalesce(jsonb_typeof(p_output->'performance'),'')<>'array' or coalesce(jsonb_typeof(p_output->'freshness'),'')<>'array'
    or p_output->>'mode' is distinct from 'observacao' or jsonb_array_length(p_output->'performance')<>jsonb_array_length(p_input->'operations')*2
    or exists(select 1 from jsonb_array_elements(p_output->'performance') x where coalesce((x->>'feed_eligible')::boolean,true)) then
    raise exception 'Invalid observation output';
  end if;
  if not exists(select 1 from public.growth_trigger_runtime_config c where c.version=(p_input->'config'->>'version')::integer
    and to_jsonb(c)=p_input->'config') then raise exception 'Configuration identity mismatch'; end if;
  if exists(select 1 from jsonb_array_elements(p_output->'performance') x where
    not coalesce(p_input->'config'->'operation_ids' ? (x->>'operation_id'),false)
    or not coalesce(p_input->'config'->'rule_ids' ? (x->>'rule_id'),false)
    or coalesce(x->>'family','') not in ('T1','T2') or x->>'period' is distinct from p_input->>'period')
    or (select count(distinct (x->>'operation_id',x->>'family')) from jsonb_array_elements(p_output->'performance') x)
      <>jsonb_array_length(p_output->'performance') then raise exception 'Output scope mismatch'; end if;
  insert into public.growth_trigger_observation_runs(input_hash,output_hash,period,evaluation_as_of,config_version,
    engine_version,data_read_at,input_snapshot,output,requested_by)
    values(p_input_hash,p_output_hash,(p_input->>'period'||'-01')::date,(p_input->>'evaluation_as_of')::date,
      (p_input->'config'->>'version')::integer,p_output->>'engine_version',(p_input->>'data_read_at')::timestamptz,p_input,p_output,p_requested_by)
    on conflict(input_hash) do nothing returning id into v_id;
  if v_id is null then
    select id,output_hash into v_id,v_existing_hash from public.growth_trigger_observation_runs where input_hash=p_input_hash;
    if v_existing_hash<>p_output_hash then raise exception 'Non-deterministic observation output'; end if;
  end if;
  return v_id;
end;
$$;

create function public.growth_trigger_reconcile_manual_job(p_period date,p_run_id uuid,p_read_at timestamptz)
returns boolean language plpgsql security invoker set search_path = '' as $$
begin
  if not exists(select 1 from public.growth_trigger_observation_runs where id=p_run_id and period=p_period) then raise exception 'Run/period mismatch'; end if;
  update public.growth_trigger_observation_jobs set processed_revision=revision,state='completed',attempts=0,
    last_run_id=p_run_id,last_error=null,finished_at=now()
    where period=p_period and changed_at<=p_read_at and (lease_until is null or lease_until<now());
  return found;
end;
$$;

create function public.growth_trigger_claim_observation_job()
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare v_job public.growth_trigger_observation_jobs;
begin
  if not exists(select 1 from public.growth_trigger_runtime_settings where id='pilot' and observation_enabled) then return null; end if;
  select * into v_job from public.growth_trigger_observation_jobs
    where revision>processed_revision and next_attempt_at<=now() and attempts<3
      and (lease_until is null or lease_until<now()) order by changed_at,period for update skip locked limit 1;
  if not found then return null; end if;
  update public.growth_trigger_observation_jobs set state='running',attempts=attempts+1,lease_token=gen_random_uuid(),
    lease_until=now()+interval '5 minutes',claimed_revision=revision where period=v_job.period returning * into v_job;
  return to_jsonb(v_job);
end;
$$;

create function public.growth_trigger_finish_observation_job(p_period date,p_token uuid,p_run_id uuid,p_error text default null)
returns boolean language plpgsql security invoker set search_path = '' as $$
declare v_job public.growth_trigger_observation_jobs;
begin
  select * into v_job from public.growth_trigger_observation_jobs where period=p_period and lease_token=p_token and lease_until>now() for update;
  if not found then return false; end if;
  if p_error is null and not exists(select 1 from public.growth_trigger_observation_runs where id=p_run_id and period=p_period) then raise exception 'Run/period mismatch'; end if;
  update public.growth_trigger_observation_jobs set
    processed_revision=case when p_error is null then v_job.claimed_revision else processed_revision end,
    state=case when p_error is not null then 'failed' when revision>v_job.claimed_revision then 'pending' else 'completed' end,
    last_run_id=coalesce(p_run_id,last_run_id),last_error=p_error,lease_token=null,lease_until=null,
    attempts=case when p_error is null then 0 else attempts end,
    next_attempt_at=case when p_error is null then now() else now()+interval '5 minutes' end,finished_at=now()
    where period=p_period;
  return true;
end;
$$;

revoke all on function public.growth_trigger_observation_inputs(date),public.growth_trigger_complete_observation(text,text,jsonb,jsonb,uuid),
public.growth_trigger_claim_observation_job(),public.growth_trigger_finish_observation_job(date,uuid,uuid,text),
public.growth_trigger_reconcile_manual_job(date,uuid,timestamptz) from public,anon,authenticated;
grant execute on function public.growth_trigger_observation_inputs(date),public.growth_trigger_complete_observation(text,text,jsonb,jsonb,uuid),
public.growth_trigger_claim_observation_job(),public.growth_trigger_finish_observation_job(date,uuid,uuid,text),
public.growth_trigger_reconcile_manual_job(date,uuid,timestamptz) to service_role;
commit;
