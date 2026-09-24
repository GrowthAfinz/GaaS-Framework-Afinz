-- Aprendizado Growth — Release 7B
-- Read-only reverse links from contextual bets to their immutable analytic source.

create index if not exists growth_bets_context_source_idx
  on public.growth_bets (
    front,
    ((belief_snapshot #>> '{source_context,source_route}')),
    ((belief_snapshot #>> '{source_context,entity_key}')),
    updated_at desc
  )
  where belief_snapshot ? 'source_context';

create view public.growth_bet_source_links_v
with (security_invoker = true)
as
select
  bet.id as bet_id,
  bet.front,
  bet.status,
  bet.hypothesis,
  bet.action_text,
  bet.metric_name,
  bet.expected_value,
  bet.expected_unit,
  bet.expected_direction,
  bet.outcome_window_start,
  bet.outcome_window_end,
  bet.verification_view,
  bet.team_scope,
  bet.owner,
  bet.belief_snapshot #>> '{source_context,source_surface}' as source_surface,
  bet.belief_snapshot #>> '{source_context,source_route}' as source_route,
  nullif(bet.belief_snapshot #>> '{source_context,period_start}', '')::date as source_period_start,
  nullif(bet.belief_snapshot #>> '{source_context,period_end}', '')::date as source_period_end,
  coalesce(bet.belief_snapshot #> '{source_context,filters}', '{}'::jsonb) as source_filters,
  bet.belief_snapshot #>> '{source_context,entity_key}' as entity_key,
  bet.belief_snapshot #>> '{source_context,visual_ref}' as visual_ref,
  bet.belief_snapshot #>> '{source_context,title}' as source_title,
  bet.created_at,
  bet.updated_at
from public.growth_bets bet
where bet.belief_snapshot ? 'source_context';

revoke all on table public.growth_bet_source_links_v from public, anon, authenticated;
grant select on table public.growth_bet_source_links_v to authenticated, service_role;

comment on view public.growth_bet_source_links_v is
  'Release 7B read-only projection linking contextual bets to the immutable Release 7A analytic source.';

comment on index public.growth_bets_context_source_idx is
  'Release 7B lookup path for contextual bets by front, route and entity.';
