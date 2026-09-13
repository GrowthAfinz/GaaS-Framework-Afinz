-- Integration test; all simulated job/run changes roll back, including on error.
begin;
do $$
declare rid uuid; token uuid := gen_random_uuid(); rejected boolean; claimed jsonb;
begin
  select j.run_id into strict rid from public.report_build_jobs j
  join public.report_runs r on r.id=j.run_id
  where j.phase='done' and r.status='certified' and r.active_run=false
    and r.publication_status='pending'
  order by j.updated_at desc limit 1 for update of j;

  update public.report_build_jobs set phase='refresh',lease_token=token,
    lease_until=clock_timestamp()+interval '4 minutes',attempts=1 where run_id=rid;
  rejected:=false;
  begin
    perform public.report_live_finish_build_step(rid,token,'done');
  exception when others then
    if sqlerrm not like 'Transição de build inválida:%' then raise; end if;
    rejected:=true;
  end;
  if not rejected then raise exception 'FAIL: refresh jumped to done'; end if;

  rejected:=false;
  begin
    perform public.report_live_finish_build_step(rid,gen_random_uuid(),'capture');
  exception when others then
    if sqlerrm <> 'Lease inválido ou vencido' then raise; end if;
    rejected:=true;
  end;
  if not rejected then raise exception 'FAIL: wrong owner accepted'; end if;

  update public.report_build_jobs set lease_until=clock_timestamp()-interval '1 second' where run_id=rid;
  rejected:=false;
  begin
    perform public.report_live_finish_build_step(rid,token,'capture');
  exception when others then
    if sqlerrm <> 'Lease inválido ou vencido' then raise; end if;
    rejected:=true;
  end;
  if not rejected then raise exception 'FAIL: expired lease accepted'; end if;

  claimed:=public.report_live_claim_build(rid);
  if claimed->>'phase' <> 'refresh' or claimed->>'lease_token'=token::text then
    raise exception 'FAIL: interrupted phase was not reclaimed';
  end if;
  if public.report_live_claim_build(rid) is not null then
    raise exception 'FAIL: concurrent worker acquired an active lease';
  end if;
  token:=(claimed->>'lease_token')::uuid;
  perform public.report_live_finish_build_step(rid,token,'capture');
  if not exists(select 1 from public.report_build_jobs where run_id=rid
    and phase='capture' and lease_token is null and attempts=0) then
    raise exception 'FAIL: valid transition did not release lease';
  end if;

  update public.report_build_jobs set phase='calculate',lease_token=token,
    lease_until=clock_timestamp()+interval '4 minutes' where run_id=rid;
  rejected:=false;
  begin
    perform public.report_live_finish_build_step(rid,token,'persist','{"artifact":{}}'::jsonb);
  exception when others then
    if sqlerrm <> 'Checkpoint de cálculo inválido' then raise; end if;
    rejected:=true;
  end;
  if not rejected then raise exception 'FAIL: invalid checkpoint accepted'; end if;

  update public.report_build_jobs set attempts=3,lease_until=clock_timestamp()-interval '1 second' where run_id=rid;
  if public.report_live_claim_build(rid) is not null then
    raise exception 'FAIL: fourth retry allowed';
  end if;
  if not exists(select 1 from public.report_build_jobs where run_id=rid and phase='error') then
    raise exception 'FAIL: exhausted job not marked error';
  end if;
end $$;
rollback;
