-- Phase 2a: freeze the canonical monthly view in the same transaction as all
-- other Report Live inputs. The view is read-only; activities is not mutated.

create or replace function public.report_live_capture_inputs(p_run_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
set statement_timeout = '120s'
as $$
declare
  r public.report_runs;
  query_start date;
  monthly_query_start date;
begin
  select * into strict r from public.report_runs where id = p_run_id;
  if exists(select 1 from public.report_frozen_inputs where run_id = p_run_id) then
    return;
  end if;

  query_start := least(
    r.period_start - (r.period_end - r.period_start + 1),
    (r.period_start - interval '1 month')::date
  );
  monthly_query_start := (date_trunc('month', r.period_end)::date - interval '6 months')::date;

  -- Every source is read by this single INSERT/SELECT statement snapshot.
  -- Ordering includes stable business keys for reproducible source hashes.
  insert into public.report_frozen_inputs(run_id, inputs)
  select p_run_id, jsonb_build_object(
    'runId', r.id,
    'profile', r.report_profile,
    'periodStart', r.period_start,
    'periodEnd', r.period_end,
    'manifest', public.report_live_source_manifest(r.period_start, r.period_end),
    'config', coalesce((select jsonb_object_agg(key, value) from public.report_live_config), '{}'::jsonb),
    'crm', coalesce((
      select jsonb_agg(to_jsonb(t) - 'user_id' - 'owner_id' - 'created_by' order by t."Data de Disparo", t.id)
      from public.activities t
      where t."Data de Disparo" >= query_start::timestamp at time zone 'America/Sao_Paulo'
        and t."Data de Disparo" < (r.period_end + 1)::timestamp at time zone 'America/Sao_Paulo'
    ), '[]'::jsonb),
    'media', coalesce((
      select jsonb_agg(to_jsonb(t) - 'user_id' order by t.date, t.id)
      from public.paid_media_metrics t
      where t.date between query_start and r.period_end
    ), '[]'::jsonb),
    'mediaActions', coalesce((
      select jsonb_agg(to_jsonb(t) order by t.business_date, to_jsonb(t)::text)
      from (
        select business_date, data_as_of, collector_run_id, account_id, entity_id, channel,
          campaign_id, campaign_name, adset_id, ad_id, source, grain_level, grain_role,
          canonical_event, source_event_name, effective_attribution_window,
          reported_attribution_window, value, observation_status
        from public.mv_paid_media_actions_latest
        where business_date between query_start and r.period_end
          and grain_level = 'ad'
          and grain_role = 'fact'
      ) t
    ), '[]'::jsonb),
    'eventMap', coalesce((select jsonb_agg(to_jsonb(t) order by t.id) from public.event_map t), '[]'::jsonb),
    'monthlyAcquisition', coalesce((
      select jsonb_agg(to_jsonb(t) order by t.parceiro, t.mes)
      from public.v_aquisicao_mensal_canonico t
      where t.mes between monthly_query_start and r.period_end
    ), '[]'::jsonb),
    'b2c', coalesce((
      select jsonb_agg(to_jsonb(t) - 'user_id' order by t.data, to_jsonb(t)::text)
      from public.b2c_daily_metrics t
      where t.data between query_start and r.period_end
    ), '[]'::jsonb),
    'insurance', coalesce((
      select jsonb_agg(to_jsonb(t) - 'user_id' - 'owner_id' - 'created_by' order by t."Data de Disparo", t.id)
      from public.rentabilizacao_activities t
      where t."Data de Disparo" >= query_start::timestamp at time zone 'America/Sao_Paulo'
        and t."Data de Disparo" < (r.period_end + 1)::timestamp at time zone 'America/Sao_Paulo'
    ), '[]'::jsonb),
    'goals', coalesce((select jsonb_agg(to_jsonb(t) - 'user_id' order by to_jsonb(t)::text) from public.goals t), '[]'::jsonb),
    'budgets', coalesce((select jsonb_agg(to_jsonb(t) - 'user_id' order by to_jsonb(t)::text) from public.paid_media_budgets t), '[]'::jsonb),
    'targets', coalesce((select jsonb_agg(to_jsonb(t) - 'user_id' order by to_jsonb(t)::text) from public.paid_media_targets t), '[]'::jsonb),
    'collectionRuns', coalesce((
      select jsonb_agg(to_jsonb(t) order by t.started_at, to_jsonb(t)::text)
      from (select * from public.paid_media_collection_runs order by started_at desc limit 500) t
    ), '[]'::jsonb),
    'collectionLogs', coalesce((
      select jsonb_agg(to_jsonb(t) order by t.executed_at, to_jsonb(t)::text)
      from (select * from public.collection_execution_logs order by executed_at desc limit 500) t
    ), '[]'::jsonb),
    'experiments', coalesce((select jsonb_agg(to_jsonb(t) - 'user_id' - 'owner_id' - 'created_by' order by to_jsonb(t)::text) from public.experiments t), '[]'::jsonb),
    'communicationSlots', coalesce((select jsonb_agg(to_jsonb(t) - 'user_id' - 'created_by' order by to_jsonb(t)::text) from public.communication_slots t), '[]'::jsonb),
    'communicationTemplates', coalesce((select jsonb_agg(to_jsonb(t) - 'user_id' - 'created_by' order by to_jsonb(t)::text) from public.communication_templates t), '[]'::jsonb),
    'slideContracts', coalesce((select jsonb_agg(to_jsonb(t) order by t.display_order, t.slide_code) from public.report_slide_contracts t), '[]'::jsonb),
    'aliases', coalesce((select jsonb_agg(to_jsonb(t) order by t.id) from public.paid_media_campaign_aliases t), '[]'::jsonb),
    'actionCandidates', '[]'::jsonb,
    'actionOutcomes', coalesce((select jsonb_agg(to_jsonb(t) - 'user_id' - 'created_by' order by to_jsonb(t)::text) from public.report_action_outcomes t), '[]'::jsonb),
    'metricCertifications', coalesce((select jsonb_agg(to_jsonb(t) order by to_jsonb(t)::text) from public.report_metric_certifications t), '[]'::jsonb)
  )
  on conflict(run_id) do nothing;
end
$$;

revoke all on function public.report_live_capture_inputs(uuid) from public, anon, authenticated;
grant execute on function public.report_live_capture_inputs(uuid) to service_role;

comment on function public.report_live_capture_inputs(uuid) is
  'Captura imutavel e atomica das fontes do Report Live, incluindo a view mensal canonica consumida pela camada editorial 2a.';
