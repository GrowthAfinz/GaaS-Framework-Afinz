begin;
create function public.growth_investigation_operations() returns jsonb
language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_agg(jsonb_build_object('operation_id',o.operation_id,'scope',o.scope) order by o.operation_id),'[]')
 from public.growth_operations o where public.growth_investigation_can_access(o.operation_id);
$$;
create function public.growth_list_investigations() returns jsonb
language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_agg(x.item order by x.created_at desc),'[]') from (
 select i.created_at,to_jsonb(i)||jsonb_build_object('evidence_id',e.id,'content_hash',e.content_hash,'read_at',e.read_at,'packet',e.packet,
 'state',j.state,'attempts',j.attempts,'last_error',j.last_error,
 'stale',e.content_hash is distinct from encode(sha256(convert_to(public.growth_investigation_packet(i.operation_id,i.period,i.filters)::text,'UTF8')),'hex'),
 'analysis',case when a.id is null then null else to_jsonb(a)-'completion_token' end,
 'analysis_is_current',a.evidence_id=e.id,'candidate_id',c.action_candidate_id,
 'candidate_event_id',(select f.id from public.growth_feed_events f where f.subject_type='action_candidate' and f.subject_id=c.action_candidate_id order by f.occurred_at desc limit 1),
 'candidate_is_current',c.analysis_id=a.id and a.evidence_id=e.id,
 'decisions',coalesce((select jsonb_agg(to_jsonb(d) order by d.created_at desc) from public.growth_investigation_decisions d where d.investigation_id=i.id),'[]')) item
 from public.growth_investigations i
 join public.growth_investigation_evidence e on e.investigation_id=i.id and e.revision=i.current_revision
 join public.growth_investigation_jobs j on j.evidence_id=e.id
 left join lateral(select * from public.growth_investigation_analyses a where a.investigation_id=i.id order by a.created_at desc limit 1) a on true
 left join public.report_action_candidates c on c.investigation_id=i.id
 where public.growth_investigation_can_access(i.operation_id) order by i.created_at desc limit 100
 ) x;
$$;
revoke all on function public.growth_investigation_operations(),public.growth_list_investigations() from public,anon;
grant execute on function public.growth_investigation_operations(),public.growth_list_investigations() to authenticated,service_role;

-- RLS must not infer hidden candidates as legacy candidates.
create function public.growth_investigation_snapshot_access(p_snapshot uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select coalesce((select case when s.filters->>'investigation_id' is null then true else
 exists(select 1 from public.growth_investigations i where i.id::text=s.filters->>'investigation_id' and public.growth_investigation_can_access(i.operation_id)) end
 from public.growth_evidence_snapshots s where s.id=p_snapshot),false);
$$;
revoke all on function public.growth_investigation_snapshot_access(uuid) from public,anon;
grant execute on function public.growth_investigation_snapshot_access(uuid) to authenticated,service_role;
create policy investigation_bet_scope on public.growth_bets as restrictive for select to authenticated
using(source_action_candidate_id is null or public.growth_investigation_candidate_access(source_action_candidate_id));
create policy investigation_snapshot_scope on public.growth_evidence_snapshots as restrictive for select to authenticated
using(public.growth_investigation_snapshot_access(id));
commit;
