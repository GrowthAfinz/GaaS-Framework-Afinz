-- Transactional dirty-period queue. Private functions have no public API grants.
begin;
create function growth_private.growth_queue_observation(p_period date,p_reason text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not exists(select 1 from public.growth_trigger_runtime_settings where id='pilot' and observation_enabled) then return; end if;
  if p_period<>date_trunc('month',p_period)::date or p_period>date_trunc('month',now() at time zone 'America/Sao_Paulo')::date
    or p_period<(date_trunc('month',now() at time zone 'America/Sao_Paulo')-interval '24 months')::date then return; end if;
  insert into public.growth_trigger_observation_jobs(period,reason,next_attempt_at)
    values(p_period,p_reason,now()+interval '30 seconds')
    on conflict(period) do update set revision=growth_trigger_observation_jobs.revision+1,reason=excluded.reason,
      state=case when growth_trigger_observation_jobs.lease_until>now() then 'running' else 'pending' end,
      attempts=case when growth_trigger_observation_jobs.lease_until>now() then growth_trigger_observation_jobs.attempts else 0 end,
      next_attempt_at=least(growth_trigger_observation_jobs.next_attempt_at,excluded.next_attempt_at),changed_at=now(),last_enqueued_txid=txid_current()
      where growth_trigger_observation_jobs.last_enqueued_txid<>txid_current();
end;
$$;

create function growth_private.growth_activity_observation_dirty()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_dates date[]; v_period date; v_changed date;
begin
  if not exists(select 1 from public.growth_trigger_runtime_settings where id='pilot' and observation_enabled) then return null; end if;
  if tg_op='INSERT' then
    select array_agg(distinct date_trunc('month',a."Data de Disparo" at time zone 'America/Sao_Paulo')::date) into v_dates
      from growth_new_rows a where exists(select 1 from public.growth_operations o
        join public.growth_trigger_runtime_config c on o.operation_id=any(c.operation_ids)
        join public.growth_trigger_runtime_settings s on s.config_version=c.version and s.id='pilot'
        where a."BU"=o.scope->>'bu' and a."Segmento"=o.scope->>'segment' and a.parceiro_canonico=o.scope->>'partner');
  elsif tg_op='DELETE' then
    select array_agg(distinct date_trunc('month',a."Data de Disparo" at time zone 'America/Sao_Paulo')::date) into v_dates
      from growth_old_rows a where exists(select 1 from public.growth_operations o
        join public.growth_trigger_runtime_config c on o.operation_id=any(c.operation_ids)
        join public.growth_trigger_runtime_settings s on s.config_version=c.version and s.id='pilot'
        where a."BU"=o.scope->>'bu' and a."Segmento"=o.scope->>'segment' and a.parceiro_canonico=o.scope->>'partner');
  else
    with changed as (select * from growth_new_rows union all select * from growth_old_rows)
    select array_agg(distinct date_trunc('month',a."Data de Disparo" at time zone 'America/Sao_Paulo')::date) into v_dates
      from changed a where exists(select 1 from public.growth_operations o
        join public.growth_trigger_runtime_config c on o.operation_id=any(c.operation_ids)
        join public.growth_trigger_runtime_settings s on s.config_version=c.version and s.id='pilot'
        where a."BU"=o.scope->>'bu' and a."Segmento"=o.scope->>'segment' and a.parceiro_canonico=o.scope->>'partner');
  end if;
  foreach v_changed in array coalesce(v_dates,array[]::date[]) loop
    if v_changed is null then continue; end if;
    for v_period in select generate_series(v_changed::timestamp,v_changed+interval '6 months',interval '1 month')::date loop
      perform growth_private.growth_queue_observation(v_period,'activities_committed');
    end loop;
  end loop;
  return null;
end;
$$;

create trigger growth_observation_activity_insert after insert on public.activities
referencing new table as growth_new_rows for each statement execute function growth_private.growth_activity_observation_dirty();
create trigger growth_observation_activity_update after update on public.activities
referencing old table as growth_old_rows new table as growth_new_rows for each statement execute function growth_private.growth_activity_observation_dirty();
create trigger growth_observation_activity_delete after delete on public.activities
referencing old table as growth_old_rows for each statement execute function growth_private.growth_activity_observation_dirty();

create function growth_private.growth_dispatch_observation()
returns bigint language plpgsql security definer set search_path = '' as $$
declare v_token text; v_request bigint; v_period date;
  v_today date := (now() at time zone 'America/Sao_Paulo')::date;
begin
  if not exists(select 1 from public.growth_trigger_runtime_settings where id='pilot' and observation_enabled) then return null; end if;
  -- Independent of arrivals: freshness is evaluated even when ingestion stops.
  foreach v_period in array array[(date_trunc('month',v_today)-interval '1 month')::date,date_trunc('month',v_today)::date] loop
    if not exists(select 1 from public.growth_trigger_observation_runs where period=v_period and evaluation_as_of=v_today)
      and not exists(select 1 from public.growth_trigger_observation_jobs where period=v_period and (changed_at at time zone 'America/Sao_Paulo')::date=v_today) then
      perform growth_private.growth_queue_observation(v_period,'daily_freshness');
    end if;
  end loop;
  if not exists(select 1 from public.growth_trigger_observation_jobs where revision>processed_revision and attempts<3
    and next_attempt_at<=now() and (lease_until is null or lease_until<now())) then return null; end if;
  select decrypted_secret into strict v_token from vault.decrypted_secrets where name='report_live_worker_token';
  select net.http_post(url:='https://mipiwxadnpwtcgfcedym.supabase.co/functions/v1/growth-trigger-observer',
    headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||v_token,'x-report-worker-token',v_token),
    body:='{"mode":"worker"}'::jsonb,timeout_milliseconds:=240000) into v_request;
  return v_request;
end;
$$;

revoke all on function growth_private.growth_queue_observation(date,text),growth_private.growth_activity_observation_dirty(),growth_private.growth_dispatch_observation()
from public,anon,authenticated;
-- Scheduler is installed disabled and enabled only after the observer smoke test.
do $$ declare v_job bigint;
begin
  select cron.schedule('growth-trigger-observation','*/5 * * * *','select growth_private.growth_dispatch_observation()') into v_job;
  perform cron.alter_job(v_job,active:=false);
end $$;
commit;
