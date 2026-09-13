-- Eight-minute leases exceed the paid Edge worker wall limit (400 seconds).
-- The legacy watchdog must not terminate jobs owned by the durable executor.

CREATE OR REPLACE FUNCTION public.report_live_claim_build(p_run_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
  update public.report_build_jobs set lease_token=token, lease_until=now()+interval '8 minutes',
    attempts=attempts+1, updated_at=now() where run_id=j.run_id returning * into j;
  update public.report_runs set updated_at=now() where id=j.run_id;
  return to_jsonb(j) - 'checkpoint';
end $function$;

CREATE OR REPLACE FUNCTION public.report_live_claim_publication_step(p_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare j public.report_publication_jobs; token uuid:=gen_random_uuid();
begin
  select * into j from public.report_publication_jobs where id=p_id and phase<>'done'
    and not paused and (lease_until is null or lease_until<clock_timestamp()) for update skip locked;
  if not found then return null; end if;
  if j.attempts>=3 then
    update public.report_publication_jobs set paused=true,
      last_error=coalesce(last_error,'Tentativas esgotadas; recuperação necessária.'),updated_at=clock_timestamp() where id=p_id;
    update public.report_runs set publication_valid=false,active_run=false,error_detail='Publicação pausada; recuperação necessária.',updated_at=clock_timestamp() where id=j.run_id;
    return null;
  end if;
  update public.report_publication_jobs set lease_token=token,lease_until=clock_timestamp()+interval '8 minutes',
    attempts=attempts+1,updated_at=clock_timestamp() where id=p_id returning * into j;
  return to_jsonb(j);
end $function$;

CREATE OR REPLACE FUNCTION public.report_live_mark_stale_runs(p_timeout_minutes integer DEFAULT 15)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  stale_count integer := 0;
begin
  if p_timeout_minutes < 5 or p_timeout_minutes > 120 then
    raise exception 'watchdog timeout must be between 5 and 120 minutes';
  end if;

  with stale as (
    update public.report_runs r
    set status = 'stale',
        active_run = false,
        stale_at = now(),
        publication_valid = false,
        build_status = case when build_status in ('pending','building') then 'stale' else build_status end,
        certification_status = case when certification_status = 'pending' then 'stale' else certification_status end,
        publication_status = case when publication_status in ('pending','publishing') then 'failed' else publication_status end,
        error_detail = 'Watchdog encerrou execução sem heartbeat dentro do limite.'
    where active_run = true
      and updated_at < now() - make_interval(mins => p_timeout_minutes)
      and not exists (select 1 from public.report_build_jobs b where b.run_id=r.id and b.phase not in ('done','error'))
      and not exists (select 1 from public.report_publication_jobs j where j.run_id=r.id and j.phase<>'done')
    returning id
  )
  select count(*) into stale_count from stale;

  update public.report_publications p
  set status = 'failed',
      qa_status = 'failed',
      reason = coalesce(p.reason, 'Watchdog encerrou publicação stale.'),
      completed_at = now()
  where p.status = 'publishing'
    and not exists (select 1 from public.report_publication_jobs j where j.id=p.id and j.phase<>'done')
    and exists (
      select 1
      from public.report_runs r
      where r.id = p.run_id
        and r.status = 'stale'
    );

  delete from public.report_publication_locks l
  where expires_at <= now()
    and not exists (select 1 from public.report_publication_jobs j where l.lock_key='report-live:'||j.deck_id and j.phase<>'done');

  return stale_count;
end;
$function$;

create or replace function public.report_live_assert_publication_owner(p_id uuid,p_token uuid)
returns boolean language sql security definer set search_path='' as $$
  select exists(select 1 from public.report_publication_jobs where id=p_id
    and phase<>'done' and not paused and lease_token=p_token and lease_until>clock_timestamp())
$$;
revoke all on function public.report_live_assert_publication_owner(uuid,uuid) from public,anon,authenticated;
grant execute on function public.report_live_assert_publication_owner(uuid,uuid) to service_role;
