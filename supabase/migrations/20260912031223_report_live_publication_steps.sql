-- Publication progress survives worker termination. A paused job retains its
-- exclusive deck reservation until recovery, rather than admitting a new writer.
create table public.report_publication_jobs (
  id uuid primary key references public.report_publications(id),
  run_id uuid not null references public.report_runs(id),
  deck_id text not null,
  phase text not null default 'backup' check(phase in
    ('backup','sheets','verify_sheets','slides','narrative','verify_slides','pdf','commit','done')),
  receipts jsonb not null default '{}',
  lease_token uuid,
  lease_until timestamptz,
  attempts integer not null default 0,
  paused boolean not null default false,
  last_error text,
  updated_at timestamptz not null default now()
);
create unique index report_publication_jobs_one_deck on public.report_publication_jobs(deck_id) where phase<>'done';
alter table public.report_publication_jobs enable row level security;
revoke all on public.report_publication_jobs from public,anon,authenticated;
grant select,insert,update on public.report_publication_jobs to service_role;

create function public.report_live_claim_publication_step(p_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
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
  update public.report_publication_jobs set lease_token=token,lease_until=clock_timestamp()+interval '4 minutes',
    attempts=attempts+1,updated_at=clock_timestamp() where id=p_id returning * into j;
  return to_jsonb(j);
end $$;

create function public.report_live_finish_publication_step(p_id uuid,p_token uuid,p_phase text,p_receipt jsonb)
returns boolean language plpgsql security definer set search_path='' as $$
declare j public.report_publication_jobs; phases text[]:=array['backup','sheets','verify_sheets','slides','narrative','verify_slides','pdf','commit','done']; pos integer;
begin
  select * into j from public.report_publication_jobs where id=p_id for update;
  if not found or j.paused or p_token is null or j.lease_token is distinct from p_token
    or j.lease_until is null or j.lease_until<=clock_timestamp() then raise exception 'Lease de publicação inválido'; end if;
  pos:=array_position(phases,j.phase);
  if j.phase is distinct from p_phase or j.phase='done' or pos is null then raise exception 'Etapa de publicação divergente'; end if;
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

revoke all on function public.report_live_claim_publication_step(uuid) from public,anon,authenticated;
revoke all on function public.report_live_finish_publication_step(uuid,uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.report_live_claim_publication_step(uuid) to service_role;
grant execute on function public.report_live_finish_publication_step(uuid,uuid,text,jsonb) to service_role;
