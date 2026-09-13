-- Process at most one durable Report Live step per invocation. Repeated or
-- overlapping scheduler calls are safe because build and publication claims
-- use leases and idempotent receipts.

create or replace function public.report_live_dispatch_scheduled_worker()
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  token text;
  request_id bigint;
begin
  select decrypted_secret
    into strict token
  from vault.decrypted_secrets
  where name = 'report_live_worker_token';

  select net.http_post(
    url := 'https://mipiwxadnpwtcgfcedym.supabase.co/functions/v1/report-sync',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-report-worker-token', token
    ),
    body := '{"mode":"worker"}'::jsonb,
    timeout_milliseconds := 240000
  ) into request_id;

  return request_id;
end;
$$;

revoke all on function public.report_live_dispatch_scheduled_worker() from public, anon, authenticated;
grant execute on function public.report_live_dispatch_scheduled_worker() to service_role;

do $$
declare
  existing_job bigint;
begin
  select jobid into existing_job from cron.job where jobname = 'report-live-worker';
  if existing_job is not null then
    perform cron.unschedule(existing_job);
  end if;

  perform cron.schedule(
    'report-live-worker',
    '* * * * *',
    'select public.report_live_dispatch_scheduled_worker();'
  );
end;
$$;

comment on function public.report_live_dispatch_scheduled_worker() is
  'Internal pg_cron dispatcher for one lease-protected Report Live worker step.';
