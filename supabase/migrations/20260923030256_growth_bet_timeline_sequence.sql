-- Aprendizado Growth — deterministic ordering for the append-only bet timeline.
-- created_at is transaction-stable and cannot order multiple updates written in one transaction.

alter table public.growth_bet_updates
  add column timeline_sequence bigint generated always as identity;

create unique index growth_bet_updates_timeline_sequence_idx
  on public.growth_bet_updates (timeline_sequence);

create or replace view public.growth_bets_operational_v
with (security_invoker = true)
as
select
  bet.*,
  bet.belief_snapshot #>> '{source_candidate,signal}' as source_signal,
  bet.belief_snapshot #>> '{source_candidate,impact}' as source_impact,
  bet.belief_snapshot #>> '{source_candidate,probable_cause}' as source_probable_cause,
  bet.belief_snapshot #>> '{source_candidate,confidence_status}' as source_confidence_status,
  bet.belief_snapshot #>> '{source_candidate,reading_limit}' as source_reading_limit,
  bet.belief_snapshot #>> '{source_candidate,source_view}' as source_view,
  bet.belief_snapshot #>> '{source_candidate,entity_key}' as entity_key,
  bet.belief_snapshot #>> '{source_candidate,signal_code}' as signal_code,
  evidence.source_run_id,
  evidence.artifact_path,
  evidence.source_hash,
  evidence.period_start as evidence_period_start,
  evidence.period_end as evidence_period_end,
  evidence.quality_state,
  evidence.regime,
  coalesce(checklist.total_count, 0)::integer as checklist_total,
  coalesce(checklist.completed_count, 0)::integer as checklist_completed,
  timeline.last_update_at,
  timeline.last_execution_status,
  coalesce(timeline.update_count, 0)::integer as update_count,
  coalesce(merged.merged_signal_count, 0)::integer as merged_signal_count
from public.growth_bets bet
join public.growth_evidence_snapshots evidence
  on evidence.id = bet.evidence_snapshot_id
left join lateral (
  select
    count(*) as total_count,
    count(*) filter (where item.status = 'completed') as completed_count
  from public.growth_bet_checklist_items item
  where item.bet_id = bet.id
) checklist on true
left join lateral (
  select
    max(update_row.created_at) as last_update_at,
    (array_agg(update_row.execution_status order by update_row.timeline_sequence desc)
      filter (where update_row.execution_status is not null))[1] as last_execution_status,
    count(*) as update_count
  from public.growth_bet_updates update_row
  where update_row.bet_id = bet.id
) timeline on true
left join lateral (
  select count(*) as merged_signal_count
  from public.growth_signal_decisions decision
  where decision.bet_id = bet.id and decision.decision_type = 'merged'
) merged on true;

comment on column public.growth_bet_updates.timeline_sequence is
  'Monotonic ordering for append-only updates; created_at is not sufficient inside one transaction.';
