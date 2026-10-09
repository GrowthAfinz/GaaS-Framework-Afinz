create or replace function public.read_journey_flow_results(p_snapshot uuid,p_occurrence text,p_start date,p_end date,p_templates boolean default false)
 returns jsonb language sql stable security invoker set search_path=pg_catalog,public as $$
 with target as (select v.* from public.journey_flow_messages_v v where v.snapshot_id=p_snapshot and (p_occurrence='' or v.occurrence_key=p_occurrence)
 and (select auth.uid()) is not null and p_end>=p_start and p_end-p_start<=730),
 historical_rows as(select distinct a.* from public.activities a join target t on
 regexp_replace(upper(btrim(a.jornada)),'^JOR_AQUISICAO_','JOR_AQS_')=regexp_replace(upper(btrim(t.journey_name)),'^JOR_AQUISICAO_','JOR_AQS_') and a."Activity name / Taxonomia"=t.activity_name and a."Canal"=t.channel),
 period_rows as (select a.* from public.activities a where a."Data de Disparo">=p_start::timestamp at time zone 'America/Sao_Paulo'
 and a."Data de Disparo"<(p_end+1)::timestamp at time zone 'America/Sao_Paulo'),
 exact_rows as (select distinct a.* from period_rows a join target t on
 regexp_replace(upper(btrim(a.jornada)),'^JOR_AQUISICAO_','JOR_AQS_')=regexp_replace(upper(btrim(t.journey_name)),'^JOR_AQUISICAO_','JOR_AQS_')
 and a."Activity name / Taxonomia"=t.activity_name and a."Canal"=t.channel),
 seeds as (select a.* from period_rows a where exists(select 1 from target t where a."Canal"=t.channel) and
 (case when p_templates then a.template_id in(select template_id from historical_rows where template_id is not null)
 else a.id in(select id from exact_rows) end)),
 closed_groups as (select a.* from period_rows a where exists(select 1 from seeds b where a.jornada is not distinct from b.jornada
 and a."Activity name / Taxonomia" is not distinct from b."Activity name / Taxonomia" and a."Canal" is not distinct from b."Canal"
 and a."Data de Disparo" is not distinct from b."Data de Disparo")),
 reviews as (select r.* from public.communication_execution_reviews r where r.member_ids && coalesce((select array_agg(id) from closed_groups),'{}'::uuid[])),
 stats as (select count(*) n from closed_groups)
 select case when not exists(select 1 from target) then null else jsonb_build_object('complete',n<=5000,
 'rows',case when n<=5000 then coalesce((select jsonb_agg(to_jsonb(a) order by a.id) from closed_groups a),'[]'::jsonb) else '[]'::jsonb end,
 'reviews',case when n<=5000 then coalesce((select jsonb_agg(to_jsonb(r) order by r.id) from reviews r),'[]'::jsonb) else '[]'::jsonb end,
 'linked_template_ids',coalesce((select jsonb_agg(distinct template_id) from historical_rows where template_id is not null),'[]'::jsonb),
 'exact_ids',coalesce((select jsonb_agg(id) from exact_rows),'[]'::jsonb),'count',n) end from stats;
 $$;
