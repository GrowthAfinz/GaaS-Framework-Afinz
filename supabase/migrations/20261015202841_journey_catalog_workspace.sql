-- Small indexed JSON lookups: disable per-call JIT compilation, not database-wide JIT.
-- Catalog metadata and performance pages are separate read-only contracts.
-- Both preserve parent RLS, exact activity/channel matching and period-evidenced aliases.
create or replace function public.journey_flow_activity_matches(p_snapshot uuid default null)
returns table(snapshot_id uuid,occurrence_key text,activity_key text,activity_id uuid)
language sql stable security invoker set search_path=pg_catalog,public set jit=off as $$
 with messages as materialized (
 select s.id,s.journey_name,m->>'occurrence_key' occurrence_key,m->>'activity_key' activity_key,
 m->>'activity_name' activity_name,m->'content'->>'channel' channel
 from public.sfmc_journey_snapshots s cross join lateral jsonb_array_elements(s.messages) m
 where (select auth.uid()) is not null and (p_snapshot is null or s.id=p_snapshot)
 )
 select v.id,v.occurrence_key,v.activity_key,a.id from messages v join public.activities a on
 regexp_replace(upper(btrim(a.jornada)),'^JOR_AQUISICAO_','JOR_AQS_')=regexp_replace(upper(btrim(v.journey_name)),'^JOR_AQUISICAO_','JOR_AQS_')
 and a."Activity name / Taxonomia"=v.activity_name and a."Canal"=v.channel
 union
 select v.id,v.occurrence_key,v.activity_key,a.id from messages v join public.journey_flow_context_aliases x
 on x.snapshot_id=v.id and x.occurrence_key=v.occurrence_key and x.channel=v.channel
 join public.activities a on a.jornada=x.target_journey and a."Activity name / Taxonomia"=x.target_activity and a."Canal"=x.channel
 and (a."Data de Disparo" at time zone 'America/Sao_Paulo')::date>=x.start_date
 and (x.end_date is null or (a."Data de Disparo" at time zone 'America/Sao_Paulo')::date<=x.end_date);
$$;

create or replace function public.read_journey_flow_catalog(p_start date,p_end date)
returns jsonb language plpgsql stable security invoker set search_path=pg_catalog,public set jit=off as $$
begin
 return (with snapshots as materialized (
 select s.id,s.import_id,s.reference,s.journey_name,s.journey_version,s.created_at,s.messages from public.sfmc_journey_snapshots s where (select auth.uid()) is not null and p_end>=p_start and p_end-p_start<=730
 ), messages as materialized (
 select s.id snapshot_id,s.import_id,m->>'occurrence_key' occurrence_key,m->>'activity_key' activity_key,
 m->>'activity_name' activity_name,m->'content'->>'channel' channel,m->'utm'->>'af_sub3' observed_template_id,
 coalesce((m->>'is_optout')::boolean,false) is_optout
 from snapshots s cross join lateral jsonb_array_elements(s.messages) m
 ), contexts as materialized (
 select x.snapshot_id,x.occurrence_key,a."BU",a."Parceiro",a."Segmento",a."Subgrupos",a."Canal",a."Oferta",a."Promocional",
 max(a."Data de Disparo") last_activity_at,
 count(*) filter(where a."Data de Disparo">=p_start::timestamp at time zone 'America/Sao_Paulo' and a."Data de Disparo"<(p_end+1)::timestamp at time zone 'America/Sao_Paulo') period_records,
 coalesce(bool_or(a.template_id is not null) filter(where a."Data de Disparo">=p_start::timestamp at time zone 'America/Sao_Paulo' and a."Data de Disparo"<(p_end+1)::timestamp at time zone 'America/Sao_Paulo'),false) has_linked,
 coalesce(bool_or(a.template_id is null) filter(where a."Data de Disparo">=p_start::timestamp at time zone 'America/Sao_Paulo' and a."Data de Disparo"<(p_end+1)::timestamp at time zone 'America/Sao_Paulo'),false) has_unlinked
 from public.journey_flow_activity_matches(null) x join public.activities a on a.id=x.activity_id
 group by x.snapshot_id,x.occurrence_key,a."BU",a."Parceiro",a."Segmento",a."Subgrupos",a."Canal",a."Oferta",a."Promocional"
 ), enriched as (
 select v.snapshot_id,to_jsonb(v)-'snapshot_id'-'import_id'||jsonb_build_object('contexts',coalesce(c.items,'[]'::jsonb),
 'catalog',case when t.template_id is null then null else jsonb_build_object('template_id',t.template_id,'channel',t.channel,
 'metadata',jsonb_build_object('resolved_context',t.metadata->'resolved_context','segmento_af_sub1',t.metadata->'segmento_af_sub1')) end,
 'review_context',r.resolved_context) item
 from messages v left join public.communication_templates t on t.template_id=v.observed_template_id
 left join lateral(select jsonb_agg(to_jsonb(c)-'snapshot_id'-'occurrence_key' order by c.last_activity_at desc nulls last) items from contexts c where c.snapshot_id=v.snapshot_id and c.occurrence_key=v.occurrence_key) c on true
 left join lateral(select p.resolved_context from public.communications_reconciliation_proposals p join public.sfmc_package_messages pm on pm.id=p.message_id
 where pm.import_id=v.import_id and pm.payload->>'occurrence_key'=v.occurrence_key and (p.status='applied' or p.reviewed_by is not null)
 order by p.revision desc limit 1) r on true
 )
 select coalesce(jsonb_agg(jsonb_build_object('id',s.id,'import_id',s.import_id,'reference',s.reference,'journey_name',s.journey_name,
 'journey_version',s.journey_version,'created_at',s.created_at,'messages',coalesce(m.items,'[]'::jsonb)) order by s.journey_name,s.created_at desc,s.id),'[]'::jsonb)
 from snapshots s left join lateral(select jsonb_agg(e.item order by e.item->>'occurrence_key') items from enriched e where e.snapshot_id=s.id) m on true);
end;
$$;

-- A cursor identifies an entire execution group. Never split reviewed duplicate groups across pages.
create or replace function public.read_journey_flow_performance_page(p_snapshot uuid,p_start date,p_end date,p_cursor jsonb default null,p_limit integer default 30)
returns jsonb language plpgsql stable security invoker set search_path=pg_catalog,public set jit=off as $$
begin
 return (with target as materialized(select s.id from public.sfmc_journey_snapshots s where s.id=p_snapshot and (select auth.uid()) is not null
 and p_end>=p_start and p_end-p_start<=730),
 matches as materialized(select x.* from target t cross join lateral public.journey_flow_activity_matches(t.id) x),
 seeds as materialized(select distinct a.* from matches x join public.activities a on a.id=x.activity_id
 where a."Data de Disparo">=p_start::timestamp at time zone 'America/Sao_Paulo' and a."Data de Disparo"<(p_end+1)::timestamp at time zone 'America/Sao_Paulo'),
 keys as materialized(select distinct a."Data de Disparo" at_time,coalesce(a.jornada,'') journey,coalesce(a."Activity name / Taxonomia",'') activity,coalesce(a."Canal",'') channel from seeds a),
 candidates as materialized(select k.* from keys k where p_cursor is null or
 (k.at_time,k.journey,k.activity,k.channel)<((p_cursor->>'at_time')::timestamptz,coalesce(p_cursor->>'journey',''),coalesce(p_cursor->>'activity',''),coalesce(p_cursor->>'channel',''))
 order by at_time desc,journey desc,activity desc,channel desc limit least(greatest(p_limit,1),100)+1),
 page_keys as materialized(select * from candidates order by at_time desc,journey desc,activity desc,channel desc limit least(greatest(p_limit,1),100)),
 closed as materialized(select a.* from public.activities a join page_keys k on a."Data de Disparo"=k.at_time and coalesce(a.jornada,'')=k.journey
 and coalesce(a."Activity name / Taxonomia",'')=k.activity and coalesce(a."Canal",'')=k.channel),
 stats as(select count(*) n from closed)
 select case when not exists(select 1 from target) then null else jsonb_build_object(
 'complete',n<=5000,'rows',case when n<=5000 then coalesce((select jsonb_agg(to_jsonb(a) order by a."Data de Disparo" desc,a.id) from closed a),'[]'::jsonb) else '[]'::jsonb end,
 'reviews',case when n<=5000 then coalesce((select jsonb_agg(to_jsonb(r) order by r.id) from public.communication_execution_reviews r where r.member_ids && coalesce((select array_agg(id) from closed),'{}'::uuid[])),'[]'::jsonb) else '[]'::jsonb end,
 'matches',case when n<=5000 then coalesce((select jsonb_agg(to_jsonb(m)) from (select a.id,array_agg(distinct x.activity_key) activity_keys from closed a join matches x on x.activity_id=a.id group by a.id) m),'[]'::jsonb) else '[]'::jsonb end,
 'has_more',(select count(*) from candidates)>least(greatest(p_limit,1),100),
 'cursor',(select to_jsonb(k) from page_keys k order by at_time,journey,activity,channel limit 1),
 'count',n) end from stats);
end;
$$;
revoke all on function public.journey_flow_activity_matches(uuid),public.read_journey_flow_catalog(date,date),public.read_journey_flow_performance_page(uuid,date,date,jsonb,integer) from public,anon;
grant execute on function public.journey_flow_activity_matches(uuid),public.read_journey_flow_catalog(date,date),public.read_journey_flow_performance_page(uuid,date,date,jsonb,integer) to authenticated,service_role;
