-- Synthetic generation publication. All changes roll back and no Google API is called.
begin;
do $$
declare
  r public.report_runs;
  p jsonb;
  j jsonb;
  pub uuid;
  token uuid;
  phase text;
  rejected boolean:=false;
begin
  select * into strict r from public.report_runs
  where certification_status='certified' and artifact_path is not null and active_run=false
  order by created_at desc limit 1;
  p:=public.report_live_enqueue_publication(r.id,'test-generation-'||gen_random_uuid(),'test-sheet',
    r.artifact_path,coalesce(r.blueprint_hash,'test'),coalesce(r.content_hash,'test'),
    'g_test','test_generation','{}','release',null,'transaction test',null);
  pub:=(p->>'id')::uuid;
  if p->>'google_state'<>'staging' or p->>'slide_generation'<>'test_generation' then
    raise exception 'FAIL generation identity';
  end if;
  select to_jsonb(x) into strict j from public.report_publication_jobs x where id=pub;
  if j->>'phase'<>'backup' or j->>'job_kind'<>'publish' then raise exception 'FAIL durable job'; end if;

  foreach phase in array array['backup','sheets','verify_sheets','slides','narrative','verify_slides'] loop
    j:=public.report_live_claim_publication_step(pub);
    token:=(j->>'lease_token')::uuid;
    perform public.report_live_finish_publication_step(pub,token,phase,
      jsonb_build_object('verified',true,'phase',phase,'previous_visible_ids',jsonb_build_array('v4sld_fixture')));
  end loop;
  j:=public.report_live_claim_publication_step(pub);
  if j->>'phase'<>'pdf' then raise exception 'FAIL PDF was not scheduled before activation'; end if;
  token:=(j->>'lease_token')::uuid;
  perform public.report_live_finish_publication_step(pub,token,'pdf','{"verified":true,"page_count":1}');
  j:=public.report_live_claim_publication_step(pub);
  if j->>'phase'<>'activate' then raise exception 'FAIL activation was not scheduled after PDF'; end if;
  token:=(j->>'lease_token')::uuid;
  perform public.report_live_finish_publication_step(pub,token,'activate',
    '{"verified":true,"previous_visible_ids":["v4sld_fixture"]}');
  j:=public.report_live_claim_publication_step(pub);
  if j->>'phase'<>'commit' then raise exception 'FAIL commit was not scheduled after activation'; end if;
  token:=(j->>'lease_token')::uuid;
  if not public.report_live_rewind_publication_activation(pub,token,'synthetic commit failure') then
    raise exception 'FAIL rewind rejected';
  end if;
  select to_jsonb(x) into strict j from public.report_publication_jobs x where id=pub;
  if j->>'phase'<>'activate' or j->'receipts' ? 'activate' or not (j->'receipts' ? 'pdf') then
    raise exception 'FAIL rewind state';
  end if;

  update public.report_publication_jobs set phase='commit',receipts='{}',lease_token=null,lease_until=null where id=pub;
  j:=public.report_live_claim_publication_step(pub);
  begin
    perform public.report_live_finish_publication_step(pub,(j->>'lease_token')::uuid,'commit','{"verified":true}');
  exception when others then
    if sqlerrm not in ('Etapa anterior sem comprovação','Ponteiro de publicação não confirmado') then raise; end if;
    rejected:=true;
  end;
  if not rejected then raise exception 'FAIL commit without evidence'; end if;
end $$;
rollback;
