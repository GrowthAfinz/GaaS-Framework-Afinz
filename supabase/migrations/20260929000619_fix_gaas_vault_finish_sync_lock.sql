create or replace function public.gaas_vault_finish_sync(p_sync_run_id uuid)
returns public.gaas_vault_sync_runs
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_vault_key text;
  v_result public.gaas_vault_sync_runs;
  v_deleted integer;
  v_links integer;
begin
  if not public.gaas_vault_is_admin() then
    raise exception 'vault_sync_admin_required' using errcode = '42501';
  end if;

  select run.vault_key into v_vault_key
  from public.gaas_vault_sync_runs run
  where run.id = p_sync_run_id and run.actor_id = (select auth.uid()) and run.status = 'running';
  if v_vault_key is null then
    raise exception 'vault_sync_run_invalid' using errcode = '22023';
  end if;

  update public.gaas_vault_notes note
  set deleted_at = now()
  where note.vault_key = v_vault_key and note.deleted_at is null and note.last_sync_run_id is distinct from p_sync_run_id;
  get diagnostics v_deleted = row_count;

  update public.gaas_vault_links link
  set target_note_id = target.id
  from public.gaas_vault_notes source, public.gaas_vault_notes target
  where link.source_note_id = source.id
    and source.vault_key = v_vault_key
    and target.vault_key = v_vault_key
    and target.deleted_at is null
    and (
      target.relative_path = link.target_path
      or target.relative_path = link.target_path || '.md'
      or lower(regexp_replace(target.relative_path, '^.*/|\.md$', '', 'g')) = lower(regexp_replace(coalesce(link.target_path, link.raw_target), '^.*/|\.md$', '', 'g'))
    );

  select count(*) into v_links
  from public.gaas_vault_links link
  join public.gaas_vault_notes note on note.id = link.source_note_id
  where note.vault_key = v_vault_key and note.deleted_at is null;

  update public.gaas_vault_sync_runs
  set status = 'completed', completed_at = now(), deleted_count = v_deleted, link_count = v_links
  where id = p_sync_run_id
  returning * into v_result;
  return v_result;
end;
$$;

revoke all on function public.gaas_vault_finish_sync(uuid) from public, anon;
grant execute on function public.gaas_vault_finish_sync(uuid) to authenticated;
