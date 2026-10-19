-- Exact activity identity drives content attribution. Existing links are immutable here.
alter table public.sfmc_package_imports add column if not exists sfmc_bu text check(sfmc_bu in ('Afinz','Plurix'));
update public.sfmc_package_imports set sfmc_bu=source_scope where source_scope in ('Afinz','Plurix') and sfmc_bu is null;
create table public.communication_auto_links(
 id bigint generated always as identity primary key,activity_id uuid not null,
 template_id text not null references public.communication_templates(template_id),import_id uuid not null references public.sfmc_package_imports(id),
 source_record jsonb not null,rule_version text not null default 'exact-activity-v1',created_at timestamptz not null default now(),unique(activity_id)
);
alter table public.communication_auto_links enable row level security;
revoke all on public.communication_auto_links from public,anon,authenticated;
grant select on public.communication_auto_links to authenticated;
grant all on public.communication_auto_links to service_role;
grant usage,select on sequence public.communication_auto_links_id_seq to service_role;
create policy communication_auto_links_read on public.communication_auto_links for select to authenticated using((select auth.uid()) is not null);

create or replace function gaas_sfmc_private.activity_candidates(p_journey text,p_activity text,p_channel text)
returns table(template_id text,import_id uuid,approved boolean,conflicted boolean,source_bu text)
language sql stable security definer set search_path=pg_catalog,public as $$
 select coalesce(case when p.status='applied' then p.proposed_template_id end,nullif(m.payload->'utm'->>'af_sub3','')),m.import_id,
 coalesce(t.status not in ('archived','superseded') and (t.status in ('active','paused') or exists(select 1 from public.communication_template_contents c where c.template_id=t.template_id)),false),
 coalesce(p.conflicts<>'[]'::jsonb and p.status<>'applied',false) or (p.proposed_template_id is not null and p.proposed_template_id<>m.payload->'utm'->>'af_sub3' and p.status<>'applied'),
 i.sfmc_bu
 from public.sfmc_package_messages m join public.sfmc_package_imports i on i.id=m.import_id
 left join public.communications_reconciliation_proposals p on p.message_id=m.id
 left join public.communication_templates t on t.template_id=coalesce(case when p.status='applied' then p.proposed_template_id end,nullif(m.payload->'utm'->>'af_sub3',''))
 where m.decision<>'rejected' and coalesce(p.status,'')<>'rejected' and coalesce(m.payload->>'is_optout','false')<>'true'
 and regexp_replace(upper(btrim(m.payload->>'journey_name')),'^JOR_AQUISICAO_','JOR_AQS_')=regexp_replace(upper(btrim(p_journey)),'^JOR_AQUISICAO_','JOR_AQS_')
 and btrim(m.payload->>'activity_name')=btrim(p_activity) and m.payload->'content'->>'channel'=p_channel;
$$;
revoke all on function gaas_sfmc_private.activity_candidates(text,text,text) from public,anon,authenticated;

create or replace function gaas_sfmc_private.automatic_activity_template()
returns trigger language plpgsql security definer set search_path=pg_catalog,public as $$
declare candidate text;origin uuid;ids integer;blocked boolean;known_bu text;source_count integer;
begin
 if new.template_id is not null or nullif(btrim(new.jornada),'') is null or nullif(btrim(new."Activity name / Taxonomia"),'') is null then if new is not distinct from old then return null;end if;return new;end if;
 select count(distinct c.template_id),min(c.template_id),bool_or(c.conflicted or not c.approved or c.template_id is null),count(distinct c.source_bu),min(c.source_bu)
 into ids,candidate,blocked,source_count,known_bu from gaas_sfmc_private.activity_candidates(new.jornada,new."Activity name / Taxonomia",new."Canal") c;
 if ids<>1 or coalesce(blocked,true) or source_count>1 then if new is not distinct from old then return null;end if;return new;end if;
 if known_bu is not null and ((known_bu='Plurix') is distinct from (coalesce(new."BU",'')='Plurix')) then if new is not distinct from old then return null;end if;return new;end if;
 -- A divergent historical attribution is an exception, never an overwrite.
 if exists(select 1 from public.activities a where regexp_replace(upper(btrim(a.jornada)),'^JOR_AQUISICAO_','JOR_AQS_')=regexp_replace(upper(btrim(new.jornada)),'^JOR_AQUISICAO_','JOR_AQS_') and btrim(a."Activity name / Taxonomia")=btrim(new."Activity name / Taxonomia") and a."Canal"=new."Canal" and a."BU" is not distinct from new."BU" and a.template_id is not null and a.template_id<>candidate) then if new is not distinct from old then return null;end if;return new;end if;
 select c.import_id into origin from gaas_sfmc_private.activity_candidates(new.jornada,new."Activity name / Taxonomia",new."Canal") c where c.template_id=candidate order by c.import_id limit 1;
 -- Record source before modification; this also makes automatic decisions reviewable.
 insert into public.communication_auto_links(activity_id,template_id,import_id,source_record) values(new.id,candidate,origin,to_jsonb(new)) on conflict(activity_id) do nothing;
 new.template_id:=candidate;return new;
end $$;
revoke all on function gaas_sfmc_private.automatic_activity_template() from public,anon,authenticated;
-- AFTER is required for the FK audit row when a new execution is inserted.
create or replace function gaas_sfmc_private.auto_link_inserted_activity()
returns trigger language plpgsql security definer set search_path=pg_catalog,public as $$
begin
 if new.template_id is null then update public.activities set template_id=template_id where id=new.id;end if;return new;
end $$;
revoke all on function gaas_sfmc_private.auto_link_inserted_activity() from public,anon,authenticated;
create trigger activities_auto_content_update before update on public.activities for each row when(new.template_id is null) execute function gaas_sfmc_private.automatic_activity_template();
create trigger activities_auto_content_insert after insert on public.activities for each row when(new.template_id is null) execute function gaas_sfmc_private.auto_link_inserted_activity();

create or replace function gaas_sfmc_private.refresh_activity_content_links()
returns trigger language plpgsql security definer set search_path=pg_catalog,public as $$
begin
 if tg_table_name='sfmc_package_messages' then
 update public.activities a set template_id=a.template_id where a.template_id is null and btrim(a."Activity name / Taxonomia")=btrim(new.payload->>'activity_name') and a."Canal"=new.payload->'content'->>'channel' and regexp_replace(upper(btrim(a.jornada)),'^JOR_AQUISICAO_','JOR_AQS_')=regexp_replace(upper(btrim(new.payload->>'journey_name')),'^JOR_AQUISICAO_','JOR_AQS_');
 else
 update public.activities a set template_id=a.template_id where a.template_id is null and exists(select 1 from public.sfmc_package_messages m where m.payload->'utm'->>'af_sub3'=new.template_id and btrim(a."Activity name / Taxonomia")=btrim(m.payload->>'activity_name') and a."Canal"=m.payload->'content'->>'channel' and regexp_replace(upper(btrim(a.jornada)),'^JOR_AQUISICAO_','JOR_AQS_')=regexp_replace(upper(btrim(m.payload->>'journey_name')),'^JOR_AQUISICAO_','JOR_AQS_'));
 end if;return new;
end $$;
revoke all on function gaas_sfmc_private.refresh_activity_content_links() from public,anon,authenticated;
-- Do not attach a per-row ingest trigger: stage_core inserts messages in a loop. Resolve at stage completion below.
create trigger approved_content_auto_links after insert on public.communication_template_contents for each row execute function gaas_sfmc_private.refresh_activity_content_links();
create trigger approved_catalog_auto_links after update of status on public.communication_templates for each row when(new.status in ('active','paused')) execute function gaas_sfmc_private.refresh_activity_content_links();

create or replace function public.reconcile_exact_activity_content()
returns integer language plpgsql security invoker set search_path=pg_catalog,public as $$
begin
 if (select auth.uid()) is null then raise exception 'Sessão necessária';end if;
 return gaas_sfmc_private.reconcile_exact_activity_content();
end $$;
create or replace function gaas_sfmc_private.reconcile_exact_activity_content()
returns integer language plpgsql security definer set search_path=pg_catalog,public as $$
declare n integer;
begin
 if (select auth.uid()) is null then raise exception 'Sessão necessária';end if;
 update public.activities set template_id=template_id where template_id is null;get diagnostics n=row_count;return n;
end $$;
revoke all on function public.reconcile_exact_activity_content(),gaas_sfmc_private.reconcile_exact_activity_content() from public,anon;
grant execute on function public.reconcile_exact_activity_content(),gaas_sfmc_private.reconcile_exact_activity_content() to authenticated,service_role;

-- Extend both ingestion entry points atomically (UI and agent).
alter function gaas_sfmc_private.stage_core(jsonb,text,uuid,text) rename to stage_before_exact_content;
create function gaas_sfmc_private.stage_core(p_package jsonb,p_scope text,p_actor uuid,p_via text)
returns uuid language plpgsql security definer set search_path=pg_catalog,public as $$
declare result uuid;
begin
 result:=gaas_sfmc_private.stage_before_exact_content(p_package,p_scope,p_actor,p_via);
 update public.sfmc_package_imports set sfmc_bu=p_scope where id=result and p_scope in ('Afinz','Plurix');
 update public.activities set template_id=template_id where template_id is null;
 return result;
end $$;
revoke all on function gaas_sfmc_private.stage_core(jsonb,text,uuid,text),gaas_sfmc_private.stage_before_exact_content(jsonb,text,uuid,text) from public,anon,authenticated;
grant execute on function gaas_sfmc_private.stage_core(jsonb,text,uuid,text) to service_role;

create or replace function public.read_sfmc_ingestion_history()
returns jsonb language sql stable security invoker set search_path=pg_catalog,public as $$
 select case when (select auth.uid()) is null then null else jsonb_build_object(
 'imports',coalesce((select jsonb_agg(x order by x.uploaded_at desc) from (select i.id,i.file_name,i.source_scope,i.sfmc_bu,i.uploaded_at,i.status,i.staged_via,i.parser_version,i.journeys_count,i.messages_count,
 (select count(*) from public.sfmc_package_messages m where m.import_id=i.id and m.decision='pending') pending_contents,
 (select coalesce(jsonb_agg(jsonb_build_object('journey_name',s.journey_name,'journey_version',s.journey_version,'snapshot_id',s.id)),'[]'::jsonb) from public.sfmc_journey_snapshots s where s.import_id=i.id) journeys
 from public.sfmc_package_imports i) x),'[]'::jsonb),
 'alerts',coalesce((select jsonb_agg(x) from (
 with observed as(select regexp_replace(upper(btrim(m.payload->>'journey_name')),'^JOR_AQUISICAO_','JOR_AQS_') journey,btrim(m.payload->>'activity_name') activity,m.payload->'content'->>'channel' channel,nullif(m.payload->'utm'->>'af_sub3','') template_id,i.uploaded_at
 from public.sfmc_package_messages m join public.sfmc_package_imports i on i.id=m.import_id where m.decision<>'rejected' and coalesce(m.payload->>'is_optout','false')<>'true'),
 all_ids as(select journey,activity,channel,template_id,uploaded_at from observed union all select regexp_replace(upper(btrim(a.jornada)),'^JOR_AQUISICAO_','JOR_AQS_'),btrim(a."Activity name / Taxonomia"),a."Canal",a.template_id,a.updated_at from public.activities a where a.template_id is not null)
 select journey,activity,channel,array_agg(distinct template_id order by template_id) template_ids,max(uploaded_at) last_seen from all_ids where template_id is not null group by journey,activity,channel having count(distinct template_id)>1
 ) x),'[]'::jsonb),
 'automatic_links',(select count(*) from public.communication_auto_links)) end;
$$;
revoke all on function public.read_sfmc_ingestion_history() from public,anon;
grant execute on function public.read_sfmc_ingestion_history() to authenticated,service_role;

-- Initial reconciliation under the approved exact-identity policy; never changes non-null IDs.
update public.activities set template_id=template_id where template_id is null;
