-- Additive visual projection; original snapshots, approvals and execution links stay intact.
create table public.sfmc_visual_assets(import_id uuid references public.sfmc_package_imports(id),asset_key text,mime text not null check(mime in('image/png','image/jpeg','image/gif','image/webp')),file_base64 text not null check(length(file_base64)<=12000000),primary key(import_id,asset_key));
create table public.sfmc_visual_messages(import_id uuid references public.sfmc_package_imports(id),occurrence_key text,html text not null check(length(html)<=750000),primary key(import_id,occurrence_key));
alter table public.sfmc_visual_assets enable row level security;
alter table public.sfmc_visual_messages enable row level security;
revoke all on public.sfmc_visual_assets,public.sfmc_visual_messages from public,anon,authenticated;
grant select on public.sfmc_visual_assets,public.sfmc_visual_messages to authenticated;
grant all on public.sfmc_visual_assets,public.sfmc_visual_messages to service_role;
create policy visual_asset_read on public.sfmc_visual_assets for select to authenticated using(exists(select 1 from public.sfmc_package_imports i where i.id=import_id));
create policy visual_message_read on public.sfmc_visual_messages for select to authenticated using(exists(select 1 from public.sfmc_package_imports i where i.id=import_id));

create function public.stage_sfmc_visuals(p_import uuid,p_assets jsonb,p_messages jsonb) returns void language plpgsql security definer set search_path=pg_catalog,public as $$
declare a jsonb;m jsonb;
begin
 if (select auth.uid()) is null or not exists(select 1 from public.sfmc_package_imports where id=p_import and uploaded_by=(select auth.uid())) then raise exception 'Importação não autorizada';end if;
 if jsonb_typeof(p_assets)<>'array' or jsonb_typeof(p_messages)<>'array' or jsonb_array_length(p_assets)>1000 or jsonb_array_length(p_messages)>3000 then raise exception 'Recursos inválidos';end if;
 for a in select value from jsonb_array_elements(p_assets) loop
  if a->>'key' !~ '^[a-zA-Z0-9_-]{1,100}$' or a->>'file' !~ '^[A-Za-z0-9+/=\r\n]+$' then raise exception 'Imagem inválida';end if;
  perform decode(a->>'file','base64');
  insert into public.sfmc_visual_assets values(p_import,a->>'key',a->>'mime',a->>'file') on conflict do nothing;
 end loop;
 for m in select value from jsonb_array_elements(p_messages) loop
  if not exists(select 1 from public.sfmc_journey_snapshots s cross join lateral jsonb_array_elements(s.messages) msg where s.import_id=p_import and msg->>'occurrence_key'=m->>'occurrence_key' and msg->'content'->>'channel'='E-mail') then raise exception 'Ocorrência ausente';end if;
  insert into public.sfmc_visual_messages values(p_import,m->>'occurrence_key',m->>'html') on conflict do nothing;
 end loop;
end $$;
revoke all on function public.stage_sfmc_visuals(uuid,jsonb,jsonb) from public,anon;
grant execute on function public.stage_sfmc_visuals(uuid,jsonb,jsonb) to authenticated,service_role;

create or replace function public.read_journey_flow_message(p_snapshot uuid,p_occurrence text) returns jsonb language plpgsql stable security invoker set search_path=pg_catalog,public as $$
declare msg jsonb;imp uuid;h text;a record;
begin
 if (select auth.uid()) is null then return null;end if;
 select m,s.import_id into msg,imp from public.sfmc_journey_snapshots s cross join lateral jsonb_array_elements(s.messages) m where s.id=p_snapshot and m->>'occurrence_key'=p_occurrence;
 if msg is null then return null;end if;
 select html into h from public.sfmc_visual_messages where import_id=imp and occurrence_key=p_occurrence;
 if h is not null then
  for a in select * from public.sfmc_visual_assets where import_id=imp and position('sfmc-asset:'||asset_key||'"' in h)>0 or (import_id=imp and position('sfmc-asset:'||asset_key||chr(39) in h)>0) loop
   h=replace(h,'sfmc-asset:'||a.asset_key||'"','data:'||a.mime||';base64,'||a.file_base64||'"');
   h=replace(h,'sfmc-asset:'||a.asset_key||chr(39),'data:'||a.mime||';base64,'||a.file_base64||chr(39));
  end loop;
  msg=jsonb_set(msg,'{content,email_html}',to_jsonb(h));
  msg=jsonb_set(msg,'{alerts}',coalesce((select jsonb_agg(v) from jsonb_array_elements(msg->'alerts') v where v#>>'{}' not in('Imagem sem URL publicada ou acima do limite de imagem embutida','Prévia HTML excede o limite de conteúdo do pacote','Prévia HTML não disponível no conteúdo exportado')),'[]'::jsonb));
 end if;
 return msg;
end $$;

create function public.read_journey_flow_coverage(p_snapshot uuid,p_occurrence text,p_start date,p_end date) returns jsonb language sql stable security invoker set search_path=pg_catalog,public as $$
with t as(select * from public.journey_flow_messages_v where snapshot_id=p_snapshot and occurrence_key=p_occurrence and (select auth.uid()) is not null),r as(select a.* from public.activities a join t on regexp_replace(upper(btrim(a.jornada)),'^JOR_AQUISICAO_','JOR_AQS_')=regexp_replace(upper(btrim(t.journey_name)),'^JOR_AQUISICAO_','JOR_AQS_') and a."Activity name / Taxonomia"=t.activity_name and a."Canal"=t.channel)
select case when not exists(select 1 from t) then null else jsonb_build_object('first',min("Data de Disparo"),'last',max("Data de Disparo"),'historical_records',count(*),'period_records',count(*) filter(where "Data de Disparo">=p_start::timestamp at time zone 'America/Sao_Paulo' and "Data de Disparo"<(p_end+1)::timestamp at time zone 'America/Sao_Paulo'),'unlinked_records',count(*) filter(where template_id is null and "Data de Disparo">=p_start::timestamp at time zone 'America/Sao_Paulo' and "Data de Disparo"<(p_end+1)::timestamp at time zone 'America/Sao_Paulo')) end from r;
$$;
revoke all on function public.read_journey_flow_coverage(uuid,text,date,date) from public,anon;
grant execute on function public.read_journey_flow_coverage(uuid,text,date,date) to authenticated,service_role;

create or replace view public.journey_flow_messages_v with(security_invoker=true) as
 select s.id snapshot_id,s.import_id,s.journey_name,s.journey_version,s.created_at,
 m->>'occurrence_key' occurrence_key,m->>'activity_key' activity_key,m->>'activity_name' activity_name,
 m->'content'->>'channel' channel,m->>'asset_id' asset_id,m->>'asset_name' asset_name,
 m->'utm'->>'af_sub3' observed_template_id,coalesce((m->>'is_optout')::boolean,false) is_optout,
 encode(extensions.digest((m->'content')::text||coalesce(vm.html,''),'sha256'),'hex') content_fingerprint,
 m->'alerts' alerts,m->'paths' paths,m->'utm' tracking,m->>'link_url' link_url,
 jsonb_build_object('text',left(m->'content'->>'body_text',240),'banner',m->'content'->>'banner_url',
 'subject',m->'content'->>'email_subject','has_html',coalesce(length(vm.html),length(m->'content'->>'email_html'),0)>0) preview_hint
 from public.sfmc_journey_snapshots s cross join lateral jsonb_array_elements(s.messages) m left join public.sfmc_visual_messages vm on vm.import_id=s.import_id and vm.occurrence_key=m->>'occurrence_key';

create or replace function public.read_journey_flow_manifest(p_snapshot uuid)
 returns jsonb language sql stable security invoker set search_path=pg_catalog,public as $$
 select jsonb_build_object('id',s.id,'import_id',s.import_id,'reference',s.reference,'journey_name',s.journey_name,
 'journey_version',s.journey_version,'created_at',s.created_at,'renditions',coalesce((select jsonb_object_agg(m.activity_key,to_jsonb(r))
 from public.journey_preview_renditions r join public.journey_flow_messages_v m on m.snapshot_id=r.snapshot_id
 and m.occurrence_key=r.occurrence_key and m.content_fingerprint=r.content_fingerprint
 where r.snapshot_id=s.id and r.owner_id=(select auth.uid()) and r.status='ready' and r.renderer_version='flow-v2-2'),'{}'::jsonb),'graph',
 jsonb_set(jsonb_set(s.graph,'{entry,de}',coalesce(s.graph#>'{entry,de}','{}'::jsonb)-'fields'),'{nodes}',
 coalesce((select jsonb_agg(jsonb_set(n,'{configuration}',coalesce(n->'configuration','{}'::jsonb)-'requestBody'))
 from jsonb_array_elements(s.graph->'nodes') n),'[]'::jsonb)))
 from public.sfmc_journey_snapshots s where s.id=p_snapshot and (select auth.uid()) is not null;
 $$;
revoke all on function public.read_journey_flow_manifest(uuid) from public,anon;
grant execute on function public.read_journey_flow_manifest(uuid) to authenticated,service_role;
