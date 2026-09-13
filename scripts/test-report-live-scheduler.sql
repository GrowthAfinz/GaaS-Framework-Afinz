-- Read-only assertion for the production worker schedule.
do $$
begin
  if has_function_privilege('anon','public.report_live_dispatch_scheduled_worker()','execute')
    or has_function_privilege('authenticated','public.report_live_dispatch_scheduled_worker()','execute') then
    raise exception 'FAIL: scheduled worker dispatcher is exposed';
  end if;

  if not exists (
    select 1 from cron.job
    where jobname='report-live-worker'
      and active
      and schedule='* * * * *'
      and command='select public.report_live_dispatch_scheduled_worker();'
  ) then
    raise exception 'FAIL: Report Live worker cron is not active';
  end if;

  if position('Authorization' in pg_get_functiondef(
    'public.report_live_dispatch_scheduled_worker()'::regprocedure
  )) = 0 or position('x-report-worker-token' in pg_get_functiondef(
    'public.report_live_dispatch_scheduled_worker()'::regprocedure
  )) = 0 then
    raise exception 'FAIL: worker dispatcher must send both internal authentication headers';
  end if;
end $$;
