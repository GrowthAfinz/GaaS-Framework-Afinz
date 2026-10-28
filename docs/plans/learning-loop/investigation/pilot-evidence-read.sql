-- Read-only profiling, two approved operations, no source correction or activation.
-- Current-state reconstruction, not an as-known-at-the-time backtest.
-- Preserve row sums as observed storage values until execution grain is resolved.
with scoped as (
 select o.operation_id,a.*,
 date_trunc('month',a."Data de Disparo" at time zone 'America/Sao_Paulo')::date as month
 from public.activities a join public.growth_operations o
 on a."BU"=o.scope->>'bu' and a."Segmento"=o.scope->>'segment'
 and a.parceiro_canonico=o.scope->>'partner'
 where o.operation_id in ('CRM-92fbd40403','CRM-a695575900')
 and a."Data de Disparo">=timestamptz '2026-03-01 00:00:00-03'
 and a."Data de Disparo"<timestamptz '2026-10-01 00:00:00-03'
), monthly as (
 select operation_id,month,count(*) rows,
 sum("Cartões Gerados") cards_row_sum,sum("Custo Total Campanha") cost_row_sum,
 sum("Base Acionável") actionable_row_sum,sum("Propostas") proposals_row_sum,
 sum("Aprovados") approved_row_sum,
 count(*) filter(where "Cartões Gerados" is null) missing_cards,
 count(*) filter(where "Custo Total Campanha" is null) missing_cost,
 count(*) filter(where "Propostas" is null) missing_proposals,
 count(*) filter(where "Aprovados" is null) missing_approved,
 count(*) filter(where "Cliques" is null) missing_clicks,
 count(*) filter(where status is null or status not in ('Realizado','Enviado')) unproven_execution,
 count(*) filter(where nullif(btrim(template_id),'') is not null) template_present,
 count(*) filter(where exists(select 1 from public.communication_templates t where t.template_id=s.template_id)) template_found,
 count(distinct ("Activity name / Taxonomia","Data de Disparo","BU","Canal")) candidate_execution_keys,
 count(distinct jornada) journeys,count(distinct "Canal") channels
 from scoped s group by operation_id,month
), key_groups as (
 select operation_id,month,"Activity name / Taxonomia","Data de Disparo","BU","Canal",count(*) n,
 count(distinct (jornada,"Subgrupos","Etapa de aquisição","Oferta","Oferta 2","Safra","Ordem de disparo","Produto","Perfil de Crédito",template_id)) dimension_variants,
 count(distinct ("Cartões Gerados","Custo Total Campanha","Base Acionável","Propostas","Aprovados","Cliques")) measure_variants
 from scoped group by operation_id,month,"Activity name / Taxonomia","Data de Disparo","BU","Canal"
), grain_profile as (
 select operation_id,month,count(*) candidate_keys,
 count(*) filter(where n>1) repeated_keys,
 coalesce(sum(n) filter(where n>1),0) rows_in_repeated_keys,
 count(*) filter(where n>1 and dimension_variants>1 and measure_variants=1) repeated_measures_distinct_dimensions,
 max(n) max_rows_per_key
 from key_groups group by operation_id,month
), channels as (
 select operation_id,"Canal" channel,count(*) rows,
 sum("Cartões Gerados") cards_row_sum,
 count(*) filter(where "Cartões Gerados"<0 or "Custo Total Campanha"<0 or "Propostas"<0 or "Aprovados"<0) negative_rows,
 count(*) filter(where "Cartões Gerados">"Aprovados" or "Aprovados">"Propostas") funnel_order_violations
 from scoped where month=date '2026-09-01' group by operation_id,"Canal"
)
select jsonb_build_object(
 'schema_version','investigation-profiling/1',
 'read_at',statement_timestamp(),'timezone','America/Sao_Paulo',
 'source','public.activities','period_start','2026-03-01','period_end_exclusive','2026-10-01',
 'monthly',(select jsonb_agg(to_jsonb(m) order by operation_id,month) from monthly m),
 'grain_profile',(select jsonb_agg(to_jsonb(g) order by operation_id,month) from grain_profile g),
 'september_channels',(select jsonb_agg(to_jsonb(c) order by operation_id,channel) from channels c),
 'observation_runs',(select jsonb_agg(jsonb_build_object('id',r.id,'period',r.period,'data_read_at',r.data_read_at,
 'input_hash',r.input_hash,'performance',r.output->'performance'))
 from public.growth_trigger_observation_runs r where r.id in (
 '1e6c2465-970f-4e06-9cf6-b66d84f0202e'::uuid,'451e323a-dccb-473f-9f91-a9ea323fbb6f'::uuid)),
 'operational_state',jsonb_build_object('observation_enabled',
 (select observation_enabled from public.growth_trigger_runtime_settings where id='pilot'),
 'candidates',(select count(*) from public.report_action_candidates),'bets',(select count(*) from public.growth_bets)),
 'limitations',jsonb_build_array('Stored row sums are not certified unique execution totals.',
 'No source population or delivery completeness certification.',
 'Historical values reflect current stored state, not original knowledge time.',
 'Nonempty template_id does not prove historical content-version identity.')
) as evidence_packet;
