-- Read-only Flow V2 projections. Snapshot/approval/execution data is untouched.
create index if not exists activities_journey_flow_context_idx on public.activities
 ((regexp_replace(upper(btrim(jornada)), '^JOR_AQUISICAO_', 'JOR_AQS_')), "Activity name / Taxonomia", "Canal", "Data de Disparo");

create or replace view public.journey_flow_messages_v with(security_invoker=true) as
 select s.id snapshot_id,s.import_id,s.journey_name,s.journey_version,s.created_at,
 m->>'occurrence_key' occurrence_key,m->>'activity_key' activity_key,m->>'activity_name' activity_name,
 m->'content'->>'channel' channel,m->>'asset_id' asset_id,m->>'asset_name' asset_name,
 m->'utm'->>'af_sub3' observed_template_id,coalesce((m->>'is_optout')::boolean,false) is_optout,
 encode(extensions.digest((m->'content')::text,'sha256'),'hex') content_fingerprint,
 m->'alerts' alerts,m->'paths' paths,m->'utm' tracking,m->>'link_url' link_url,
 jsonb_build_object('text',left(m->'content'->>'body_text',240),'banner',m->'content'->>'banner_url',
 'subject',m->'content'->>'email_subject','has_html',coalesce(length(m->'content'->>'email_html'),0)>0) preview_hint
 from public.sfmc_journey_snapshots s cross join lateral jsonb_array_elements(s.messages) m;
revoke all on public.journey_flow_messages_v from public,anon;
grant select on public.journey_flow_messages_v to authenticated,service_role;

create or replace function public.read_journey_flow_index()
 returns jsonb language sql stable security invoker set search_path=pg_catalog,public,extensions as $$
 select coalesce(jsonb_agg(item order by item->>'journey_name'),'[]'::jsonb) from (
 select jsonb_build_object('id',s.id,'import_id',s.import_id,'reference',s.reference,'journey_name',s.journey_name,
 'journey_version',s.journey_version,'created_at',s.created_at,'messages',coalesce(mm.items,'[]'::jsonb)) item
 from public.sfmc_journey_snapshots s left join lateral (
 select jsonb_agg(to_jsonb(v)||jsonb_build_object('catalog',case when t.template_id is null then null else
 jsonb_build_object('template_id',t.template_id,'title',t.title,'channel',t.channel,'status',t.status,
 'original_path',t.original_path,'preview_path',t.preview_path,'thumbnail_path',t.thumbnail_path,'mime_type',t.mime_type,
 'metadata',jsonb_build_object('resolved_context',t.metadata->'resolved_context','segmento_af_sub1',t.metadata->'segmento_af_sub1')) end,
 'contexts',coalesce(ctx.items,'[]'::jsonb),'review_context',review.resolved_context)) items
 from public.journey_flow_messages_v v
 left join public.communication_templates t on t.template_id=v.observed_template_id
 left join lateral (
 select jsonb_agg(x.c) items from (select distinct jsonb_build_object('BU',a."BU",'Parceiro',a."Parceiro",'Segmento',a."Segmento",
 'Subgrupos',a."Subgrupos",'Canal',a."Canal",'Oferta',a."Oferta",'Promocional',a."Promocional") c
 from public.activities a where regexp_replace(upper(btrim(a.jornada)),'^JOR_AQUISICAO_','JOR_AQS_')=
 regexp_replace(upper(btrim(v.journey_name)),'^JOR_AQUISICAO_','JOR_AQS_') and a."Activity name / Taxonomia"=v.activity_name
 and a."Canal"=v.channel ) x) ctx on true
 left join lateral (select p.resolved_context from public.communications_reconciliation_proposals p
 join public.sfmc_package_messages pm on pm.id=p.message_id where pm.import_id=v.import_id
 and pm.payload->>'occurrence_key'=v.occurrence_key and (p.status='applied' or p.reviewed_by is not null)
 order by p.revision desc limit 1) review on true
 where v.snapshot_id=s.id) mm on true where (select auth.uid()) is not null) z;
 $$;

create or replace function public.read_journey_flow_manifest(p_snapshot uuid)
 returns jsonb language sql stable security invoker set search_path=pg_catalog,public as $$
 select jsonb_build_object('id',s.id,'import_id',s.import_id,'reference',s.reference,'journey_name',s.journey_name,
 'journey_version',s.journey_version,'created_at',s.created_at,'graph',
 jsonb_set(jsonb_set(s.graph,'{entry,de}',coalesce(s.graph#>'{entry,de}','{}'::jsonb)-'fields'),'{nodes}',
 coalesce((select jsonb_agg(jsonb_set(n,'{configuration}',coalesce(n->'configuration','{}'::jsonb)-'requestBody'))
 from jsonb_array_elements(s.graph->'nodes') n),'[]'::jsonb)))
 from public.sfmc_journey_snapshots s where s.id=p_snapshot and (select auth.uid()) is not null;
 $$;

create or replace function public.read_journey_flow_message(p_snapshot uuid,p_occurrence text)
 returns jsonb language sql stable security invoker set search_path=pg_catalog,public as $$
 select m from public.sfmc_journey_snapshots s cross join lateral jsonb_array_elements(s.messages) m
 where s.id=p_snapshot and m->>'occurrence_key'=p_occurrence and (select auth.uid()) is not null;
 $$;

create or replace function public.read_journey_flow_results(p_snapshot uuid,p_occurrence text,p_start date,p_end date,p_templates boolean default false)
 returns jsonb language sql stable security invoker set search_path=pg_catalog,public as $$
 with target as (select v.* from public.journey_flow_messages_v v where v.snapshot_id=p_snapshot and (p_occurrence='' or v.occurrence_key=p_occurrence)
 and (select auth.uid()) is not null and p_end>=p_start and p_end-p_start<=730),
 period_rows as (select a.* from public.activities a where a."Data de Disparo">=p_start::timestamp at time zone 'America/Sao_Paulo'
 and a."Data de Disparo"<(p_end+1)::timestamp at time zone 'America/Sao_Paulo'),
 exact_rows as (select distinct a.* from period_rows a join target t on
 regexp_replace(upper(btrim(a.jornada)),'^JOR_AQUISICAO_','JOR_AQS_')=regexp_replace(upper(btrim(t.journey_name)),'^JOR_AQUISICAO_','JOR_AQS_')
 and a."Activity name / Taxonomia"=t.activity_name and a."Canal"=t.channel),
 seeds as (select a.* from period_rows a where exists(select 1 from target t where a."Canal"=t.channel) and
 (case when p_templates then a.template_id in(select template_id from exact_rows where template_id is not null)
 else a.id in(select id from exact_rows) end)),
 closed_groups as (select a.* from period_rows a where exists(select 1 from seeds b where a.jornada is not distinct from b.jornada
 and a."Activity name / Taxonomia" is not distinct from b."Activity name / Taxonomia" and a."Canal" is not distinct from b."Canal"
 and a."Data de Disparo" is not distinct from b."Data de Disparo")),
 reviews as (select r.* from public.communication_execution_reviews r where r.member_ids && coalesce((select array_agg(id) from closed_groups),'{}'::uuid[])),
 stats as (select count(*) n from closed_groups)
 select case when not exists(select 1 from target) then null else jsonb_build_object('complete',n<=5000,
 'rows',case when n<=5000 then coalesce((select jsonb_agg(to_jsonb(a) order by a.id) from closed_groups a),'[]'::jsonb) else '[]'::jsonb end,
 'reviews',case when n<=5000 then coalesce((select jsonb_agg(to_jsonb(r) order by r.id) from reviews r),'[]'::jsonb) else '[]'::jsonb end,
 'exact_ids',coalesce((select jsonb_agg(id) from exact_rows),'[]'::jsonb),'count',n) end from stats;
 $$;

create or replace function public.read_journey_flow_reuse(p_snapshot uuid,p_occurrence text)
 returns jsonb language sql stable security invoker set search_path=pg_catalog,public as $$
 with target as(select v.*,i.source_scope from public.journey_flow_messages_v v join public.sfmc_package_imports i on i.id=v.import_id
 where v.snapshot_id=p_snapshot and v.occurrence_key=p_occurrence and (select auth.uid()) is not null)
 select coalesce(jsonb_agg(item),'[]'::jsonb) from (select jsonb_build_object('snapshot_id',v.snapshot_id,'occurrence_key',v.occurrence_key,
 'activity_key',v.activity_key,'journey_name',v.journey_name,'journey_version',v.journey_version,'activity_name',v.activity_name,
 'channel',v.channel,'asset_name',v.asset_name,'observed_template_id',v.observed_template_id,
 'evidence',case when v.content_fingerprint=t.content_fingerprint then 'exact_content' when v.observed_template_id=t.observed_template_id then 'template_id' else 'shared_asset' end) item
 from public.journey_flow_messages_v v join public.sfmc_package_imports i on i.id=v.import_id cross join target t
 where (v.snapshot_id<>t.snapshot_id or v.occurrence_key<>t.occurrence_key) and v.channel=t.channel and
 (v.content_fingerprint=t.content_fingerprint or (v.observed_template_id is not null and v.observed_template_id=t.observed_template_id)
 or (v.asset_id is not null and v.asset_id=t.asset_id and i.source_scope=t.source_scope)) order by v.created_at desc limit 200) x;
 $$;

revoke all on function public.read_journey_flow_index(),public.read_journey_flow_manifest(uuid),public.read_journey_flow_message(uuid,text),
 public.read_journey_flow_results(uuid,text,date,date,boolean),public.read_journey_flow_reuse(uuid,text) from public,anon;
grant execute on function public.read_journey_flow_index(),public.read_journey_flow_manifest(uuid),public.read_journey_flow_message(uuid,text),
 public.read_journey_flow_results(uuid,text,date,date,boolean),public.read_journey_flow_reuse(uuid,text) to authenticated,service_role;
