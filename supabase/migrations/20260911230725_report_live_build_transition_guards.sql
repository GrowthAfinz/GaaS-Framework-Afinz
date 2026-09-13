-- A lease authorizes one known transition, not an arbitrary terminal state.
create or replace function public.report_live_finish_build_step(
  p_run_id uuid, p_token uuid, p_next text, p_checkpoint jsonb default null
) returns boolean language plpgsql security definer set search_path = '' as $$
declare j public.report_build_jobs; r public.report_runs; candidate jsonb;
begin
  select * into j from public.report_build_jobs where run_id=p_run_id for update;
  if not found or j.lease_token is distinct from p_token or p_token is null
     or j.lease_until is null or j.lease_until <= clock_timestamp() then
    raise exception 'Lease inválido ou vencido';
  end if;
  if p_next is null or not (
    (j.phase='refresh' and p_next='capture') or
    (j.phase='capture' and p_next='calculate') or
    (j.phase='calculate' and p_next='persist') or
    (j.phase='persist' and p_next in ('certify','done')) or
    (j.phase='certify' and p_next='done')
  ) then raise exception 'Transição de build inválida: % -> %',j.phase,p_next; end if;

  if j.phase='capture' and not exists (
    select 1 from public.report_frozen_inputs where run_id=p_run_id
  ) then raise exception 'Snapshot obrigatório antes do cálculo'; end if;

  if j.phase='calculate' then
    candidate := p_checkpoint->'artifact';
    if candidate is null or candidate->>'run_id' is distinct from p_run_id::text
       or nullif(candidate->>'content_hash','') is null
       or jsonb_typeof(candidate->'tabs') is distinct from 'object' then
      raise exception 'Checkpoint de cálculo inválido';
    end if;
  elsif p_checkpoint is not null then
    raise exception 'Checkpoint só pode ser gravado na etapa de cálculo';
  end if;

  select * into strict r from public.report_runs where id=p_run_id;
  if j.phase='persist' and p_next='done' and
     (r.status is distinct from 'superseded' or r.superseded_by is null) then
    raise exception 'Conclusão antecipada exige duplicata identificada';
  end if;
  if j.phase='persist' and p_next='certify' and nullif(r.artifact_path,'') is null then
    raise exception 'Artefato persistido obrigatório antes de certificar';
  end if;
  if j.phase='certify' and (r.certification_status not in ('certified','rejected')
     or r.certification_status is null) then
    raise exception 'Certificação concluída obrigatória';
  end if;

  update public.report_build_jobs set phase=p_next,checkpoint=coalesce(p_checkpoint,checkpoint),
    lease_token=null,lease_until=null,attempts=0,last_error=null,updated_at=clock_timestamp()
  where run_id=p_run_id;
  update public.report_runs set updated_at=clock_timestamp(),
    active_run=case when p_next='done' then false else active_run end where id=p_run_id;
  return true;
end $$;

revoke all on function public.report_live_finish_build_step(uuid,uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.report_live_finish_build_step(uuid,uuid,text,jsonb) to service_role;
