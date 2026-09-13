create or replace function public.report_live_dispatch_controlled(
  p_mode text,
  p_run_id uuid default null,
  p_publication_id uuid default null,
  p_timeout_ms integer default 240000
)
returns bigint language plpgsql security definer set search_path='' as $$
declare token text; request_id bigint;
begin
  if p_mode not in ('publish','publication_worker','inspect_publication','inspect_recovery','inspect_generation') then
    raise exception 'Modo não permitido no dispatcher controlado: %',p_mode;
  end if;
  if p_mode in ('publish','inspect_publication','inspect_recovery','inspect_generation') and p_run_id is null then
    raise exception 'run_id obrigatório';
  end if;
  if p_mode='publication_worker' and p_publication_id is null then
    raise exception 'publication_id obrigatório';
  end if;
  select decrypted_secret into strict token from vault.decrypted_secrets where name='report_live_worker_token';
  select net.http_post(
    url:='https://mipiwxadnpwtcgfcedym.supabase.co/functions/v1/report-sync-build-candidate',
    headers:=jsonb_build_object('Content-Type','application/json','x-report-worker-token',token),
    body:=jsonb_strip_nulls(jsonb_build_object('mode',p_mode,'run_id',p_run_id,'publication_id',p_publication_id)),
    timeout_milliseconds:=least(greatest(p_timeout_ms,1000),240000)
  ) into request_id;
  return request_id;
end;
$$;
revoke all on function public.report_live_dispatch_controlled(text,uuid,uuid,integer) from public,anon,authenticated;
grant execute on function public.report_live_dispatch_controlled(text,uuid,uuid,integer) to service_role;
