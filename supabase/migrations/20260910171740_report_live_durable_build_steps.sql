-- Durable build checkpoints. No writes to business data or Google targets.
create table public.report_build_jobs (
  run_id uuid primary key references public.report_runs(id),
  phase text not null default 'refresh' check (phase in ('refresh','capture','calculate','persist','certify','done','error')),
  options jsonb not null default '{}',
  checkpoint jsonb,
  lease_token uuid,
  lease_until timestamptz,
  attempts integer not null default 0,
  last_error text,
  updated_at timestamptz not null default now()
);
alter table public.report_build_jobs enable row level security;
revoke all on public.report_build_jobs from public, anon, authenticated;
grant all on public.report_build_jobs to service_role;

create table public.report_frozen_inputs (
  run_id uuid primary key references public.report_runs(id),
  captured_at timestamptz not null default now(),
  inputs jsonb not null
);
alter table public.report_frozen_inputs enable row level security;
revoke all on public.report_frozen_inputs from public, anon, authenticated;
grant select, insert on public.report_frozen_inputs to service_role;

create or replace function public.report_live_claim_build(p_run_id uuid default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare j public.report_build_jobs; token uuid := gen_random_uuid();
begin
  select * into j from public.report_build_jobs
  where phase not in ('done','error') and (p_run_id is null or run_id=p_run_id)
    and (lease_until is null or lease_until < now())
  order by updated_at for update skip locked limit 1;
  if not found then return null; end if;
  if j.attempts >= 3 then
    update public.report_build_jobs set phase='error', last_error=coalesce(last_error,'Worker interrompido após três tentativas.'), updated_at=now() where run_id=j.run_id;
    update public.report_runs set status='error', build_status='error', active_run=false,
      error_detail='Build interrompido após três tentativas; checkpoint preservado.', updated_at=now() where id=j.run_id;
    return null;
  end if;
  update public.report_build_jobs set lease_token=token, lease_until=now()+interval '4 minutes',
    attempts=attempts+1, updated_at=now() where run_id=j.run_id returning * into j;
  update public.report_runs set updated_at=now() where id=j.run_id;
  return to_jsonb(j) - 'checkpoint';
end $$;

create or replace function public.report_live_finish_build_step(p_run_id uuid, p_token uuid, p_next text, p_checkpoint jsonb default null)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  update public.report_build_jobs set phase=p_next, checkpoint=coalesce(p_checkpoint,checkpoint),
    lease_token=null, lease_until=null, attempts=0, last_error=null, updated_at=now()
  where run_id=p_run_id and lease_token=p_token and lease_until > now();
  if not found then raise exception 'Lease inválido ou vencido'; end if;
  update public.report_runs set updated_at=now() where id=p_run_id;
  return true;
end $$;

create or replace function public.report_live_capture_inputs(p_run_id uuid)
returns void language plpgsql security definer set search_path = '' set statement_timeout = '120s' as $$
declare r public.report_runs; query_start date;
begin
  select * into strict r from public.report_runs where id=p_run_id;
  if exists(select 1 from public.report_frozen_inputs where run_id=p_run_id) then return; end if;
  query_start := r.period_start - (r.period_end-r.period_start+1);
  -- Every source is read by the same INSERT/SELECT statement snapshot. The
  -- raw tables remain untouched. Ordering includes unique IDs for stable hashes.
  insert into public.report_frozen_inputs(run_id,inputs)
  select p_run_id, jsonb_build_object(
    'runId',r.id,'profile',r.report_profile,'periodStart',r.period_start,'periodEnd',r.period_end,
    'manifest',public.report_live_source_manifest(r.period_start,r.period_end),
    'config',coalesce((select jsonb_object_agg(key,value) from public.report_live_config),'{}'::jsonb),
    'crm',coalesce((select jsonb_agg(to_jsonb(t)-'user_id'-'owner_id'-'created_by' order by t."Data de Disparo",t.id) from public.activities t
      where t."Data de Disparo" >= query_start::timestamp at time zone 'America/Sao_Paulo'
      and t."Data de Disparo" < (r.period_end+1)::timestamp at time zone 'America/Sao_Paulo'),'[]'::jsonb),
    'media',coalesce((select jsonb_agg(to_jsonb(t)-'user_id' order by t.date,t.id) from public.paid_media_metrics t where t.date between query_start and r.period_end),'[]'::jsonb),
    'mediaActions',coalesce((select jsonb_agg(to_jsonb(t) order by t.business_date,to_jsonb(t)::text) from
      (select business_date,data_as_of,collector_run_id,account_id,entity_id,channel,campaign_id,campaign_name,adset_id,ad_id,source,grain_level,grain_role,
        canonical_event,source_event_name,effective_attribution_window,reported_attribution_window,value,observation_status
       from public.mv_paid_media_actions_latest where business_date between query_start and r.period_end and grain_level='ad' and grain_role='fact') t),'[]'::jsonb),
    'eventMap',coalesce((select jsonb_agg(to_jsonb(t) order by t.id) from public.event_map t),'[]'::jsonb),
    'b2c',coalesce((select jsonb_agg(to_jsonb(t)-'user_id' order by t.data,to_jsonb(t)::text) from public.b2c_daily_metrics t where t.data between query_start and r.period_end),'[]'::jsonb),
    'insurance',coalesce((select jsonb_agg(to_jsonb(t)-'user_id'-'owner_id'-'created_by' order by t."Data de Disparo",t.id) from public.rentabilizacao_activities t
      where t."Data de Disparo" >= query_start::timestamp at time zone 'America/Sao_Paulo'
      and t."Data de Disparo" < (r.period_end+1)::timestamp at time zone 'America/Sao_Paulo'),'[]'::jsonb),
    'goals',coalesce((select jsonb_agg(to_jsonb(t)-'user_id' order by to_jsonb(t)::text) from public.goals t),'[]'::jsonb),
    'budgets',coalesce((select jsonb_agg(to_jsonb(t)-'user_id' order by to_jsonb(t)::text) from public.paid_media_budgets t),'[]'::jsonb),
    'targets',coalesce((select jsonb_agg(to_jsonb(t)-'user_id' order by to_jsonb(t)::text) from public.paid_media_targets t),'[]'::jsonb),
    'collectionRuns',coalesce((select jsonb_agg(to_jsonb(t) order by t.started_at,to_jsonb(t)::text) from (select * from public.paid_media_collection_runs order by started_at desc limit 500) t),'[]'::jsonb),
    'collectionLogs',coalesce((select jsonb_agg(to_jsonb(t) order by t.executed_at,to_jsonb(t)::text) from (select * from public.collection_execution_logs order by executed_at desc limit 500) t),'[]'::jsonb),
    'experiments',coalesce((select jsonb_agg(to_jsonb(t)-'user_id'-'owner_id'-'created_by' order by to_jsonb(t)::text) from public.experiments t),'[]'::jsonb),
    'communicationSlots',coalesce((select jsonb_agg(to_jsonb(t)-'user_id'-'created_by' order by to_jsonb(t)::text) from public.communication_slots t),'[]'::jsonb),
    'communicationTemplates',coalesce((select jsonb_agg(to_jsonb(t)-'user_id'-'created_by' order by to_jsonb(t)::text) from public.communication_templates t),'[]'::jsonb),
    'slideContracts',coalesce((select jsonb_agg(to_jsonb(t) order by t.display_order,t.slide_code) from public.report_slide_contracts t),'[]'::jsonb),
    'aliases',coalesce((select jsonb_agg(to_jsonb(t) order by t.id) from public.paid_media_campaign_aliases t),'[]'::jsonb),
    'actionCandidates','[]'::jsonb,
    'actionOutcomes',coalesce((select jsonb_agg(to_jsonb(t)-'user_id'-'created_by' order by to_jsonb(t)::text) from public.report_action_outcomes t),'[]'::jsonb),
    'metricCertifications',coalesce((select jsonb_agg(to_jsonb(t) order by to_jsonb(t)::text) from public.report_metric_certifications t),'[]'::jsonb)
  ) on conflict(run_id) do nothing;
end $$;

-- Separate random secret for internal jobs. Never return its value to clients.
do $$ begin
  if not exists(select 1 from vault.secrets where name='report_live_worker_token') then
    perform vault.create_secret(encode(extensions.gen_random_bytes(32),'hex'),'report_live_worker_token','Report Live internal worker authentication');
  end if;
end $$;

create or replace function public.report_live_verify_worker(p_token text)
returns boolean language sql security definer set search_path = '' as $$
  select length(p_token)=64 and exists(select 1 from vault.decrypted_secrets where name='report_live_worker_token' and decrypted_secret=p_token)
$$;

create or replace function public.report_live_dispatch(p_mode text default 'build', p_period_start date default null, p_period_end date default null, p_timeout_ms integer default 240000)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare token text; request_id bigint;
begin
  if p_mode not in ('build','worker','inspect_contract') then raise exception 'Modo não permitido no dispatcher: %',p_mode; end if;
  select decrypted_secret into strict token from vault.decrypted_secrets where name='report_live_worker_token';
  select net.http_post(url:='https://mipiwxadnpwtcgfcedym.supabase.co/functions/v1/report-sync',
    headers:=jsonb_build_object('Content-Type','application/json','x-report-worker-token',token),
    body:=jsonb_strip_nulls(jsonb_build_object('mode',p_mode,'period_start',p_period_start,'period_end',p_period_end)),
    timeout_milliseconds:=least(greatest(p_timeout_ms,1000),240000)) into request_id;
  return jsonb_build_object('request_id',request_id,'mode',p_mode);
end $$;

revoke all on function public.report_live_claim_build(uuid) from public,anon,authenticated;
revoke all on function public.report_live_finish_build_step(uuid,uuid,text,jsonb) from public,anon,authenticated;
revoke all on function public.report_live_capture_inputs(uuid) from public,anon,authenticated;
revoke all on function public.report_live_verify_worker(text) from public,anon,authenticated;
revoke all on function public.report_live_dispatch(text,date,date,integer) from public,anon,authenticated;
grant execute on function public.report_live_claim_build(uuid),public.report_live_finish_build_step(uuid,uuid,text,jsonb),public.report_live_capture_inputs(uuid),public.report_live_verify_worker(text),public.report_live_dispatch(text,date,date,integer) to service_role;
revoke all on function public.report_live_refresh_media_actions() from public,anon,authenticated;
grant execute on function public.report_live_refresh_media_actions() to service_role;

-- Activation is a separate release step after HTTP worker authentication and
-- checkpoint recovery have passed live validation. No cron starts in this migration.
