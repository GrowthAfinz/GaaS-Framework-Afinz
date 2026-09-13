-- Publish a complete Google generation before moving the live pointer. The
-- physical Sheet namespace and Slide generation are immutable release data.
alter table public.report_publications
  add column if not exists sheet_namespace text,
  add column if not exists slide_generation text,
  add column if not exists google_state text not null default 'staging',
  add column if not exists activated_at timestamptz,
  add column if not exists generation_manifest jsonb not null default '{}'::jsonb;

alter table public.report_publications
  drop constraint if exists report_publications_google_state_check;
alter table public.report_publications
  add constraint report_publications_google_state_check
  check (google_state in ('staging','active','retired','failed'));

alter table public.report_publication_jobs
  add column if not exists job_kind text not null default 'publish';
alter table public.report_publication_jobs
  drop constraint if exists report_publication_jobs_job_kind_check;
alter table public.report_publication_jobs
  add constraint report_publication_jobs_job_kind_check
  check (job_kind in ('publish','rollback'));
alter table public.report_publication_jobs
  drop constraint if exists report_publication_jobs_phase_check;
alter table public.report_publication_jobs
  add constraint report_publication_jobs_phase_check check(phase in
    ('backup','sheets','verify_sheets','slides','narrative','verify_slides','activate','pdf','commit','done'));

create or replace function public.report_live_enqueue_publication(
  p_run_id uuid,
  p_deck_id text,
  p_sheet_id text,
  p_artifact_path text,
  p_blueprint_hash text,
  p_content_hash text,
  p_sheet_namespace text,
  p_slide_generation text,
  p_diff_summary jsonb default '{}'::jsonb,
  p_kind text default 'release',
  p_rollback_of_publication_id uuid default null,
  p_reason text default null,
  p_published_by uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  run_row public.report_runs;
  prior public.report_publications;
  publication_row public.report_publications;
begin
  if p_kind not in ('release','rollback') then raise exception 'Tipo de publicação inválido'; end if;
  if coalesce(p_deck_id,'')='' or coalesce(p_sheet_id,'')='' or coalesce(p_sheet_namespace,'')='' or coalesce(p_slide_generation,'')='' then
    raise exception 'Identidade de geração incompleta';
  end if;

  select * into run_row from public.report_runs where id=p_run_id for update;
  if not found or run_row.certification_status is distinct from 'certified' then
    raise exception 'Run não certificado';
  end if;
  if run_row.artifact_path is distinct from p_artifact_path then
    raise exception 'Artefato divergente do run';
  end if;

  select * into publication_row from public.report_publications
  where run_id=p_run_id and deck_id=p_deck_id and status='publishing'
  order by publication_version desc limit 1;
  if found then return to_jsonb(publication_row); end if;

  select * into prior from public.report_publications
  where deck_id=p_deck_id and status='published'
  order by publication_version desc limit 1;

  insert into public.report_publications(
    run_id,deck_id,sheet_id,kind,status,previous_publication_id,
    rollback_of_publication_id,artifact_path,blueprint_hash,content_hash,
    diff_summary,reason,published_by,sheet_namespace,slide_generation,
    google_state,generation_manifest
  ) values (
    p_run_id,p_deck_id,p_sheet_id,p_kind,'publishing',prior.id,
    p_rollback_of_publication_id,p_artifact_path,p_blueprint_hash,p_content_hash,
    coalesce(p_diff_summary,'{}'::jsonb),p_reason,p_published_by,p_sheet_namespace,
    p_slide_generation,'staging','{}'::jsonb
  ) returning * into publication_row;

  insert into public.report_publication_jobs(id,run_id,deck_id,job_kind)
  values(publication_row.id,p_run_id,p_deck_id,case when p_kind='rollback' then 'rollback' else 'publish' end);

  update public.report_runs set status='publishing',active_run=true,
    publication_status='publishing',publication_valid=false,updated_at=clock_timestamp()
  where id=p_run_id;
  return to_jsonb(publication_row);
end;
$$;

create or replace function public.report_live_finish_publication_step(
  p_id uuid,p_token uuid,p_phase text,p_receipt jsonb
)
returns boolean language plpgsql security definer set search_path='' as $$
declare
  j public.report_publication_jobs;
  phases text[]:=array['backup','sheets','verify_sheets','slides','narrative','verify_slides','activate','pdf','commit','done'];
  pos integer;
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
    receipts=(receipts-'activate'-'pdf'-'commit'),lease_token=null,lease_until=null,
    attempts=0,last_error=left(p_error,900),updated_at=clock_timestamp()
  where id=p_id;
  update public.report_publications set google_state='staging',activated_at=null
  where id=p_id and status='publishing';
  return true;
end;
$$;

-- Re-declare commit with an idempotent success path. A lost HTTP response after
-- commit can safely replay the phase and then persist its checkpoint.
create or replace function public.report_live_commit_publication(
  p_publication_id uuid,
  p_run_id uuid,
  p_kind text,
  p_pdf_path text,
  p_slide_count integer,
  p_pdf_page_count integer,
  p_deck_structure_hash text,
  p_rows_inserted integer,
  p_sheet_url text,
  p_slides_url text
)
returns boolean language plpgsql security definer set search_path='' as $$
declare
  publication_row public.report_publications%rowtype;
  previous_run_id uuid;
begin
  select * into publication_row from public.report_publications
  where id=p_publication_id and run_id=p_run_id for update;
  if not found then raise exception 'Publicação inexistente'; end if;
  if publication_row.status='published' and exists(
    select 1 from public.report_live_pointer where id='live' and current_publication_id=p_publication_id
  ) then return true; end if;
  if publication_row.status<>'publishing' then raise exception 'Publicação não está em andamento'; end if;
  if p_kind not in ('release','rollback') or publication_row.kind<>p_kind then raise exception 'Tipo de publicação divergente'; end if;
  if p_pdf_page_count is distinct from p_slide_count then raise exception 'Páginas do PDF divergem dos slides'; end if;
  if publication_row.google_state<>'active' or publication_row.activated_at is null then
    raise exception 'Geração Google não ativada';
  end if;

  if publication_row.previous_publication_id is not null then
    select run_id into previous_run_id from public.report_publications where id=publication_row.previous_publication_id;
    update public.report_publications set
      status=case when p_kind='rollback' then 'rolled_back' else 'superseded' end,
      google_state='retired'
    where id=publication_row.previous_publication_id and status='published';
    update public.report_runs set superseded_by=p_run_id where id=previous_run_id and id<>p_run_id;
  end if;

  update public.report_publications set status='published',pdf_path=p_pdf_path,
    slide_count=p_slide_count,pdf_page_count=p_pdf_page_count,
    deck_structure_hash=p_deck_structure_hash,qa_status='passed',completed_at=clock_timestamp()
  where id=p_publication_id;

  insert into public.report_live_pointer(id,current_run_id,current_publication_id,deck_id,sheet_id,content_hash,publication_version,updated_at)
  values('live',p_run_id,p_publication_id,publication_row.deck_id,publication_row.sheet_id,
    coalesce(publication_row.content_hash,publication_row.blueprint_hash),publication_row.publication_version,clock_timestamp())
  on conflict(id) do update set current_run_id=excluded.current_run_id,
    current_publication_id=excluded.current_publication_id,deck_id=excluded.deck_id,
    sheet_id=excluded.sheet_id,content_hash=excluded.content_hash,
    publication_version=excluded.publication_version,updated_at=excluded.updated_at;

  update public.report_runs set status='done',active_run=false,
    publication_version=publication_row.publication_version,publication_status='published',
    published_at=clock_timestamp(),sheet_url=p_sheet_url,slides_url=p_slides_url,
    rows_inserted=p_rows_inserted,llm_provider='manual_or_numeric_only',
    publication_valid=true,error_detail=null,updated_at=clock_timestamp()
  where id=p_run_id;
  return true;
end;
$$;

revoke all on function public.report_live_enqueue_publication(uuid,text,text,text,text,text,text,text,jsonb,text,uuid,text,uuid) from public,anon,authenticated;
revoke all on function public.report_live_finish_publication_step(uuid,uuid,text,jsonb) from public,anon,authenticated;
revoke all on function public.report_live_rewind_publication_activation(uuid,uuid,text) from public,anon,authenticated;
revoke all on function public.report_live_commit_publication(uuid,uuid,text,text,integer,integer,text,integer,text,text) from public,anon,authenticated;
grant execute on function public.report_live_enqueue_publication(uuid,text,text,text,text,text,text,text,jsonb,text,uuid,text,uuid) to service_role;
grant execute on function public.report_live_finish_publication_step(uuid,uuid,text,jsonb) to service_role;
grant execute on function public.report_live_rewind_publication_activation(uuid,uuid,text) to service_role;
grant execute on function public.report_live_commit_publication(uuid,uuid,text,text,integer,integer,text,integer,text,text) to service_role;

comment on column public.report_publications.generation_manifest is
  'Logical-to-physical Sheets mapping and staged Slides ids for this immutable Google generation.';

create or replace function public.report_live_finish_build_step(
  p_run_id uuid, p_token uuid, p_next text, p_checkpoint jsonb default null
) returns boolean language plpgsql security definer set search_path = '' as $$
declare j public.report_build_jobs; r public.report_runs; candidate jsonb;
begin
  select * into j from public.report_build_jobs where run_id=p_run_id for update;
  if not found or j.lease_token is distinct from p_token or p_token is null
     or j.lease_until is null or j.lease_until<=clock_timestamp() then raise exception 'Lease inválido ou vencido'; end if;
  if p_next is null or not (
    (j.phase='refresh' and p_next='capture') or (j.phase='capture' and p_next='calculate') or
    (j.phase='calculate' and p_next='persist') or (j.phase='persist' and p_next in ('certify','done')) or
    (j.phase='certify' and p_next='done')
  ) then raise exception 'Transição de build inválida: % -> %',j.phase,p_next; end if;
  if j.phase='capture' and not exists(select 1 from public.report_frozen_inputs where run_id=p_run_id)
    then raise exception 'Snapshot obrigatório antes do cálculo'; end if;
  if j.phase='calculate' then
    candidate:=p_checkpoint->'artifact';
    if candidate is null or candidate->>'run_id' is distinct from p_run_id::text
       or nullif(candidate->>'content_hash','') is null or jsonb_typeof(candidate->'tabs') is distinct from 'object'
      then raise exception 'Checkpoint de cálculo inválido'; end if;
  elsif p_checkpoint is not null then raise exception 'Checkpoint só pode ser gravado na etapa de cálculo'; end if;
  select * into strict r from public.report_runs where id=p_run_id;
  if j.phase='persist' and p_next='done' and (r.status is distinct from 'superseded' or r.superseded_by is null)
    then raise exception 'Conclusão antecipada exige duplicata identificada'; end if;
  if j.phase='persist' and p_next='certify' and nullif(r.artifact_path,'') is null
    then raise exception 'Artefato persistido obrigatório antes de certificar'; end if;
  if j.phase='certify' and (r.certification_status not in ('certified','rejected') or r.certification_status is null)
    then raise exception 'Certificação concluída obrigatória'; end if;
  update public.report_build_jobs set phase=p_next,checkpoint=coalesce(p_checkpoint,checkpoint),
    lease_token=null,lease_until=null,attempts=0,last_error=null,updated_at=clock_timestamp()
  where run_id=p_run_id;
  update public.report_runs set updated_at=clock_timestamp(),
    active_run=case when p_next='done' and not exists(
      select 1 from public.report_publication_jobs where run_id=p_run_id and phase<>'done'
    ) then false else active_run end
  where id=p_run_id;
  return true;
end $$;

revoke all on function public.report_live_finish_build_step(uuid,uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.report_live_finish_build_step(uuid,uuid,text,jsonb) to service_role;
