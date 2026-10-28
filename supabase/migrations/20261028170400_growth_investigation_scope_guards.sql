begin;
-- Definer RPCs in older releases must not bypass new investigation scope guards.
create function public.growth_guard_investigation_bet() returns trigger
language plpgsql security definer set search_path='' as $$
declare op text;
begin
 select i.operation_id into op from public.report_action_candidates c
 join public.growth_investigations i on i.id=c.investigation_id where c.action_candidate_id=new.source_action_candidate_id;
 if op is not null and auth.uid() is not null and not public.growth_investigation_can_access(op,true) then raise exception 'investigation_access_denied'; end if;
 return new;
end;$$;
create trigger growth_bet_investigation_guard before insert or update on public.growth_bets
for each row execute function public.growth_guard_investigation_bet();
create function public.growth_guard_investigation_signal_decision() returns trigger
language plpgsql security definer set search_path='' as $$
declare op text;
begin
 select i.operation_id into op from public.report_action_candidates c
 join public.growth_investigations i on i.id=c.investigation_id where c.action_candidate_id=new.action_candidate_id;
 if op is not null and (auth.uid() is null or not public.growth_investigation_can_access(op,true)) then raise exception 'investigation_access_denied'; end if;
 if new.bet_id is not null and exists(select 1 from public.growth_bets b join public.report_action_candidates c on c.action_candidate_id=b.source_action_candidate_id
 where b.id=new.bet_id and c.investigation_id is not null and not public.growth_investigation_candidate_access(c.action_candidate_id)) then raise exception 'investigation_access_denied'; end if;
 return new;
end;$$;
create trigger growth_signal_investigation_guard before insert on public.growth_signal_decisions
for each row execute function public.growth_guard_investigation_signal_decision();
create policy investigation_outcome_scope on public.report_action_outcomes as restrictive for select to authenticated
using(bet_id is null or exists(select 1 from public.growth_bets b where b.id=bet_id));
create policy investigation_learning_scope on public.growth_learnings as restrictive for select to authenticated
using(source_outcome_id is null or exists(select 1 from public.report_action_outcomes o where o.id=source_outcome_id));
revoke all on function public.growth_guard_investigation_bet(),public.growth_guard_investigation_signal_decision() from public,anon,authenticated;
commit;
