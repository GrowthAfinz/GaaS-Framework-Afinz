-- Navigation contains scope metadata only. Full metadata is fetched for one selected snapshot.
-- Preserve the period-evidenced aliases already deployed before this migration.
create table if not exists public.journey_flow_context_aliases (
 snapshot_id uuid not null references public.sfmc_journey_snapshots(id) on delete cascade,
 occurrence_key text not null, target_journey text not null, target_activity text not null,
 channel text not null, start_date date not null, end_date date, evidence text not null,
 primary key(snapshot_id,occurrence_key,target_journey,target_activity,channel,start_date)
);
alter table public.journey_flow_context_aliases enable row level security;
drop policy if exists visible_parent_alias on public.journey_flow_context_aliases;
create policy visible_parent_alias on public.journey_flow_context_aliases for select to authenticated
 using(exists(select 1 from public.sfmc_journey_snapshots s where s.id=snapshot_id));
revoke all on public.journey_flow_context_aliases from public,anon;
grant select on public.journey_flow_context_aliases to authenticated,service_role;

-- Do not re-enter the visual-message view (HTML hashing) for each activity candidate.
-- Separate exact matches and aliases so both branches can use their lookup indexes.
create or replace function public.journey_flow_context_rows(p_snapshot uuid,p_occurrence text)
 returns setof public.activities language sql stable security invoker set search_path=pg_catalog,public as $$
 with target as materialized (
 select s.journey_name,m->>'activity_name' activity_name,m->'content'->>'channel' channel
 from public.sfmc_journey_snapshots s cross join lateral jsonb_array_elements(s.messages) m
 where s.id=p_snapshot and m->>'occurrence_key'=p_occurrence and (select auth.uid()) is not null
 ), ids as (
 select a.id from target t join public.activities a on
 regexp_replace(upper(btrim(a.jornada)),'^JOR_AQUISICAO_','JOR_AQS_')=
 regexp_replace(upper(btrim(t.journey_name)),'^JOR_AQUISICAO_','JOR_AQS_')
 and a."Activity name / Taxonomia"=t.activity_name and a."Canal"=t.channel
 union
 select a.id from target t join public.journey_flow_context_aliases x
 on x.snapshot_id=p_snapshot and x.occurrence_key=p_occurrence and x.channel=t.channel
 join public.activities a on a.jornada=x.target_journey and a."Activity name / Taxonomia"=x.target_activity
 and a."Canal"=x.channel and (a."Data de Disparo" at time zone 'America/Sao_Paulo')::date>=x.start_date
 and (x.end_date is null or (a."Data de Disparo" at time zone 'America/Sao_Paulo')::date<=x.end_date)
 ) select a.* from public.activities a join ids on ids.id=a.id;
$$;
revoke all on function public.journey_flow_context_rows(uuid,text) from public,anon;
grant execute on function public.journey_flow_context_rows(uuid,text) to authenticated,service_role;

create or replace function public.journey_flow_entries(p_snapshot uuid,p_navigation boolean)
 returns jsonb language sql stable security invoker set search_path=pg_catalog,public,extensions as $$
 with targets as materialized (
 select s.id,s.import_id,s.reference,s.journey_name,s.journey_version,s.created_at,s.messages
 from public.sfmc_journey_snapshots s where (select auth.uid()) is not null
 and (p_snapshot is null or s.id=p_snapshot)
 ), scope_messages as materialized (
 select s.id snapshot_id,s.import_id,s.journey_name,m->>'occurrence_key' occurrence_key,
 m->>'activity_name' activity_name,m->'content'->>'channel' channel,m->'utm'->>'af_sub3' template_id
 from targets s cross join lateral jsonb_array_elements(s.messages) m
 ), scope_rows as materialized (
 select v.snapshot_id,v.occurrence_key,a."BU",a."Parceiro",a."Segmento",a."Subgrupos",a."Canal",a."Oferta",a."Promocional"
 from scope_messages v join public.activities a on
 regexp_replace(upper(btrim(a.jornada)),'^JOR_AQUISICAO_','JOR_AQS_')=
 regexp_replace(upper(btrim(v.journey_name)),'^JOR_AQUISICAO_','JOR_AQS_')
 and a."Activity name / Taxonomia"=v.activity_name and a."Canal"=v.channel
 union
 select v.snapshot_id,v.occurrence_key,a."BU",a."Parceiro",a."Segmento",a."Subgrupos",a."Canal",a."Oferta",a."Promocional"
 from scope_messages v join public.journey_flow_context_aliases x
 on x.snapshot_id=v.snapshot_id and x.occurrence_key=v.occurrence_key and x.channel=v.channel
 join public.activities a on a.jornada=x.target_journey and a."Activity name / Taxonomia"=x.target_activity
 and a."Canal"=x.channel and (a."Data de Disparo" at time zone 'America/Sao_Paulo')::date>=x.start_date
 and (x.end_date is null or (a."Data de Disparo" at time zone 'America/Sao_Paulo')::date<=x.end_date)
 ), messages as materialized (
 -- Only three navigation attributes: no visual view, HTML, fingerprints, previews or graph.
 select v.snapshot_id,v.import_id,v.occurrence_key,
 jsonb_build_object('channel',v.channel,'observed_template_id',v.template_id) meta
 from scope_messages v where p_navigation
 union all
 select v.snapshot_id,v.import_id,v.occurrence_key,to_jsonb(v) meta
 from public.journey_flow_messages_v v where not p_navigation and v.snapshot_id=p_snapshot
 ), enriched as (
 select v.snapshot_id,v.meta||jsonb_build_object(
 'catalog',case when t.template_id is null then null when p_navigation then
 jsonb_build_object('template_id',t.template_id,'channel',t.channel,'metadata',jsonb_build_object(
 'resolved_context',t.metadata->'resolved_context','segmento_af_sub1',t.metadata->'segmento_af_sub1')) else
 jsonb_build_object('template_id',t.template_id,'title',t.title,'channel',t.channel,'status',t.status,
 'original_path',t.original_path,'preview_path',t.preview_path,'thumbnail_path',t.thumbnail_path,'mime_type',t.mime_type,
 'metadata',jsonb_build_object('resolved_context',t.metadata->'resolved_context','segmento_af_sub1',t.metadata->'segmento_af_sub1')) end,
 'contexts',coalesce(ctx.items,'[]'::jsonb),'review_context',review.resolved_context) item
 from messages v left join public.communication_templates t on t.template_id=v.meta->>'observed_template_id'
 left join lateral (select jsonb_agg(x.c) items from (
 select distinct case when p_navigation then jsonb_build_object('BU',a."BU",'Parceiro',a."Parceiro",'Segmento',a."Segmento")
 else jsonb_build_object('BU',a."BU",'Parceiro',a."Parceiro",'Segmento',a."Segmento",'Subgrupos',a."Subgrupos",
 'Canal',a."Canal",'Oferta',a."Oferta",'Promocional',a."Promocional") end c
 from scope_rows a where a.snapshot_id=v.snapshot_id and a.occurrence_key=v.occurrence_key) x) ctx on true
 left join lateral (select p.resolved_context from public.communications_reconciliation_proposals p
 join public.sfmc_package_messages pm on pm.id=p.message_id where pm.import_id=v.import_id
 and pm.payload->>'occurrence_key'=v.occurrence_key and (p.status='applied' or p.reviewed_by is not null)
 order by p.revision desc limit 1) review on true
 )
 select coalesce(jsonb_agg(jsonb_build_object('id',s.id,'import_id',s.import_id,'reference',s.reference,
 'journey_name',s.journey_name,'journey_version',s.journey_version,'created_at',s.created_at,
 'messages',coalesce(m.items,'[]'::jsonb)) order by s.journey_name,s.created_at desc,s.id),'[]'::jsonb)
 from targets s left join lateral(select jsonb_agg(e.item) items from enriched e where e.snapshot_id=s.id) m on true;
$$;
create or replace function public.read_journey_flow_directory()
 returns jsonb language sql stable security invoker set search_path=pg_catalog,public as $$
 select public.journey_flow_entries(null,true);
$$;
create or replace function public.read_journey_flow_detail(p_snapshot uuid)
 returns jsonb language sql stable security invoker set search_path=pg_catalog,public as $$
 select case when p_snapshot is null then null else public.journey_flow_entries(p_snapshot,false)->0 end;
$$;
revoke all on function public.journey_flow_entries(uuid,boolean),public.read_journey_flow_directory(),public.read_journey_flow_detail(uuid) from public,anon;
grant execute on function public.journey_flow_entries(uuid,boolean),public.read_journey_flow_directory(),public.read_journey_flow_detail(uuid) to authenticated,service_role;
