begin;
-- Scope grants are administrative records, never derived at request time from an editable profile.
create table public.growth_investigation_access (
 user_id uuid not null references auth.users, operation_id text not null references public.growth_operations,
 can_write boolean not null default false, granted_at timestamptz not null default now(),
 primary key(user_id,operation_id)
);
alter table public.growth_investigation_access enable row level security;
revoke all on public.growth_investigation_access from public,anon,authenticated;
grant select on public.growth_investigation_access to service_role;
insert into public.growth_investigation_access(user_id,operation_id,can_write)
select m.user_id,o.operation_id,m.role in ('admin','publisher','analyst')
from public.report_live_memberships m join public.profiles p on p.id=m.user_id
cross join public.growth_operations o join public.growth_trigger_runtime_settings s on s.id='pilot'
join public.growth_trigger_runtime_config c on c.version=s.config_version and o.operation_id=any(c.operation_ids)
where m.active and (p.role::text in ('admin','growth_b2c') or (p.role::text='analista_plurix' and o.scope->>'bu'='Plurix'));
create or replace function public.growth_investigation_can_access(p_operation text,p_write boolean default false)
returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.growth_investigation_access g
 join public.report_live_memberships m on m.user_id=g.user_id and m.active
 join public.growth_operations o on o.operation_id=g.operation_id and o.lifecycle='confirmada'
 join public.growth_trigger_runtime_settings s on s.id='pilot'
 join public.growth_trigger_runtime_config c on c.version=s.config_version and o.operation_id=any(c.operation_ids)
 where g.user_id=(select auth.uid()) and g.operation_id=p_operation
 and (not p_write or (g.can_write and m.role in ('admin','publisher','analyst'))));
$$;
-- Legacy table has RLS with no permissive app-read policy. Expose only the new scoped origin.
grant select on public.report_action_candidates to authenticated;
create policy investigation_candidate_read on public.report_action_candidates for select to authenticated
using(investigation_id is not null and public.growth_investigation_candidate_access(action_candidate_id));
create function public.growth_investigation_event_access(p_type text,p_id uuid) returns boolean
language plpgsql stable security definer set search_path='' as $$
declare candidate uuid;
begin
 if p_type='action_candidate' then return public.growth_investigation_candidate_access(p_id);
 elsif p_type='growth_bet' then select source_action_candidate_id into candidate from public.growth_bets where id=p_id;
 elsif p_type='growth_outcome' then select b.source_action_candidate_id into candidate from public.report_action_outcomes o join public.growth_bets b on b.id=o.bet_id where o.id=p_id;
 elsif p_type='growth_learning' then select b.source_action_candidate_id into candidate from public.growth_learnings l
 join public.report_action_outcomes o on o.id=l.source_outcome_id join public.growth_bets b on b.id=o.bet_id where l.id=p_id;
 else return true;end if;
 return candidate is null or public.growth_investigation_candidate_access(candidate);
end;$$;
revoke all on function public.growth_investigation_event_access(text,uuid) from public,anon;
grant execute on function public.growth_investigation_event_access(text,uuid) to authenticated,service_role;
drop policy investigation_feed_scope on public.growth_feed_events;
create policy investigation_feed_scope on public.growth_feed_events as restrictive for select to authenticated
using(public.growth_investigation_event_access(subject_type,subject_id));
commit;
