-- Synthetic publication only; every row change rolls back.
begin;
do $$
declare pub uuid:=gen_random_uuid(); r public.report_runs; j jsonb; rejected boolean;
begin
  select * into strict r from public.report_runs where status='certified' and artifact_path is not null order by created_at desc limit 1;
  insert into public.report_publications(id,run_id,deck_id,sheet_id,kind,status,artifact_path,blueprint_hash,content_hash)
  values(pub,r.id,'test-'||pub,'test-only','release','publishing',r.artifact_path,'test','test');
  insert into public.report_publication_jobs(id,run_id,deck_id) values(pub,r.id,'test-'||pub);
  j:=public.report_live_claim_publication_step(pub);
  if j is null or j->>'phase'<>'backup' then raise exception 'FAIL initial claim'; end if;
  if public.report_live_claim_publication_step(pub) is not null then raise exception 'FAIL duplicate claim'; end if;
  rejected:=false;
  begin
    perform public.report_live_finish_publication_step(pub,(j->>'lease_token')::uuid,'commit','{"verified":true}');
  exception when others then
    if sqlerrm<>'Etapa de publicação divergente' then raise; end if; rejected:=true;
  end;
  if not rejected then raise exception 'FAIL skipped phases'; end if;
  rejected:=false;
  begin
    perform public.report_live_finish_publication_step(pub,(j->>'lease_token')::uuid,'backup','{"verified":false}');
  exception when others then
    if sqlerrm<>'Etapa sem comprovação' then raise; end if; rejected:=true;
  end;
  if not rejected then raise exception 'FAIL unverified receipt'; end if;
  perform public.report_live_finish_publication_step(pub,(j->>'lease_token')::uuid,'backup','{"verified":true,"path":"test"}');
  j:=public.report_live_claim_publication_step(pub);
  if j->>'phase'<>'sheets' or j->'receipts'->'backup'->>'path'<>'test' then raise exception 'FAIL checkpoint not persisted'; end if;
  update public.report_publication_jobs set phase='commit',receipts='{}' where id=pub;
  rejected:=false;
  begin
    perform public.report_live_finish_publication_step(pub,(j->>'lease_token')::uuid,'commit','{"verified":true}');
  exception when others then
    if sqlerrm<>'Etapa anterior sem comprovação' then raise; end if; rejected:=true;
  end;
  if not rejected then raise exception 'FAIL missing prerequisites'; end if;
end $$;
rollback;
