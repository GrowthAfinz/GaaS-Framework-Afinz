-- Fixture changes are rolled back. No Google or business table writes.
begin;
do $$
declare pub uuid:=gen_random_uuid(); fixture uuid:=gen_random_uuid(); r public.report_runs; j jsonb; deck text;
begin
  select * into strict r from public.report_runs where status='certified' and artifact_path is not null order by created_at desc limit 1;
  insert into public.report_runs(id,report_type,report_profile,period_start,period_end,status,active_run,updated_at)
  values(fixture,r.report_type,r.report_profile,r.period_start,r.period_end,'publishing',true,now()-interval '2 hours');
  r.id:=fixture;
  deck:='test-'||pub;
  insert into public.report_publications(id,run_id,deck_id,sheet_id,kind,status,artifact_path,blueprint_hash,content_hash)
  values(pub,r.id,deck,'test-only','release','publishing',r.artifact_path,'test','test');
  insert into public.report_publication_jobs(id,run_id,deck_id) values(pub,r.id,deck);
  j:=public.report_live_claim_publication_step(pub);
  if (j->>'lease_until')::timestamptz < clock_timestamp()+interval '7 minutes' then raise exception 'FAIL short worker lease'; end if;
  if not public.report_live_assert_publication_owner(pub,(j->>'lease_token')::uuid) then raise exception 'FAIL valid owner rejected'; end if;
  if public.report_live_assert_publication_owner(pub,gen_random_uuid()) then raise exception 'FAIL foreign owner accepted'; end if;
  update public.report_publication_jobs set paused=true where id=pub;
  if public.report_live_assert_publication_owner(pub,(j->>'lease_token')::uuid) then raise exception 'FAIL paused owner accepted'; end if;
  if (select updated_at from public.report_runs where id=r.id)>now()-interval '1 hour' then raise exception 'FAIL fixture heartbeat was overwritten'; end if;
  insert into public.report_publication_locks(lock_key,run_id,owner_token,acquired_at,expires_at)
  values('report-live:'||deck,r.id,gen_random_uuid(),now()-interval '2 hours',now()-interval '1 hour');
  perform public.report_live_mark_stale_runs(5);
  if (select status from public.report_runs where id=r.id)<>'publishing' then raise exception 'FAIL watchdog terminated reserved job'; end if;
  if not exists(select 1 from public.report_publication_locks where lock_key='report-live:'||deck) then raise exception 'FAIL watchdog removed reserved lock'; end if;
  if (select status from public.report_publications where id=pub)<>'publishing' then raise exception 'FAIL watchdog failed reserved publication'; end if;
  update public.report_publication_jobs set phase='done' where id=pub;
  perform public.report_live_mark_stale_runs(5);
  if (select status from public.report_runs where id=r.id)<>'stale' then raise exception 'FAIL legacy watchdog no longer works'; end if;
  if exists(select 1 from public.report_publication_locks where lock_key='report-live:'||deck) then raise exception 'FAIL finished reservation was retained'; end if;
  if has_function_privilege('anon','public.report_live_assert_publication_owner(uuid,uuid)','execute')
    or has_function_privilege('authenticated','public.report_live_assert_publication_owner(uuid,uuid)','execute') then raise exception 'FAIL owner check exposed'; end if;
end $$;
rollback;
