-- Certify an isolated PDF before changing visibility in the live deck.
-- A Drive export includes skipped slides, so activation cannot select the
-- pages of the QA artifact.

create or replace function public.report_live_finish_publication_step(
  p_id uuid, p_token uuid, p_phase text, p_receipt jsonb
) returns boolean language plpgsql security definer set search_path='' as $$
declare
  j public.report_publication_jobs;
  phases text[] := array['backup','sheets','verify_sheets','slides','narrative','verify_slides','pdf','activate','commit','done'];
  pos integer;
begin
  select * into j from public.report_publication_jobs where id=p_id for update;
  if not found or j.lease_token is distinct from p_token or p_token is null
     or j.lease_until is null or j.lease_until<=clock_timestamp() then
    raise exception 'Lease de publicação inválido ou vencido';
  end if;
  if j.phase is distinct from p_phase then raise exception 'Etapa de publicação divergente'; end if;
  pos:=array_position(phases,j.phase);
  if pos is null or pos>=array_length(phases,1) then raise exception 'Etapa de publicação inválida'; end if;
  if p_receipt->'verified' is distinct from 'true'::jsonb then raise exception 'Etapa sem comprovação'; end if;
  if exists(select 1 from unnest(phases[1:pos-1]) prior where j.receipts->prior->'verified' is distinct from 'true'::jsonb)
    then raise exception 'Etapa anterior sem comprovação'; end if;
  if j.phase='commit' and not exists(select 1 from public.report_live_pointer where id='live' and current_publication_id=j.id)
    then raise exception 'Ponteiro de publicação não confirmado'; end if;
  update public.report_publication_jobs set phase=phases[pos+1],
    receipts=receipts||jsonb_build_object(j.phase,p_receipt),lease_token=null,lease_until=null,
    attempts=0,last_error=null,updated_at=clock_timestamp() where id=p_id;
  return true;
end $$;

create or replace function public.report_live_rewind_publication_activation(
  p_id uuid,p_token uuid,p_error text
)
returns boolean language plpgsql security definer set search_path='' as $$
declare j public.report_publication_jobs;
begin
  select * into j from public.report_publication_jobs where id=p_id for update;
  if not found or j.lease_token is distinct from p_token then
    raise exception 'Lease de publicação inválido';
  end if;
  if exists(select 1 from public.report_live_pointer where id='live' and current_publication_id=p_id) then
    return false;
  end if;
  update public.report_publication_jobs set phase='activate',
    receipts=(receipts-'activate'-'commit'),lease_token=null,lease_until=null,
    attempts=0,last_error=left(p_error,900),updated_at=clock_timestamp()
  where id=p_id;
  update public.report_publications set google_state='staging',activated_at=null
  where id=p_id and status='publishing';
  return true;
end;
$$;

-- The August publication failed its old live-deck PDF export before an
-- activation receipt was recorded. Resume it at isolated PDF QA.
update public.report_publication_jobs
set phase='pdf', lease_token=null, lease_until=null, attempts=0, paused=false,
    updated_at=clock_timestamp()
where phase='activate'
  and receipts->'activate' is null
  and receipts->'pdf' is null;

revoke all on function public.report_live_finish_publication_step(uuid,uuid,text,jsonb) from public,anon,authenticated;
revoke all on function public.report_live_rewind_publication_activation(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.report_live_finish_publication_step(uuid,uuid,text,jsonb) to service_role;
grant execute on function public.report_live_rewind_publication_activation(uuid,uuid,text) to service_role;
