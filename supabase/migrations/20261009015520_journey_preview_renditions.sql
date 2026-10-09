-- Private, per-user derived preview cache. Does not approve or alter communication content.
create table public.journey_preview_renditions (
 owner_id uuid not null default auth.uid(),snapshot_id uuid not null references public.sfmc_journey_snapshots(id) on delete cascade,
 occurrence_key text not null,content_fingerprint text not null check(content_fingerprint ~ '^[a-f0-9]{64}$'),
 renderer_version text not null,status text not null check(status in('queued','rendering','ready','failed','missing')),
 full_path text,thumbnail_path text,width integer,height integer,warnings jsonb not null default '[]',source text,
 updated_at timestamptz not null default now(),
 primary key(owner_id,snapshot_id,occurrence_key,content_fingerprint,renderer_version),
 check(full_path is null or starts_with(full_path,'sfmc-previews/'||owner_id::text||'/')),
 check(thumbnail_path is null or starts_with(thumbnail_path,'sfmc-previews/'||owner_id::text||'/')),
 check(width is null or width between 1 and 12000),check(height is null or height between 1 and 16000)
);
alter table public.journey_preview_renditions enable row level security;
revoke all on public.journey_preview_renditions from public,anon;
grant select,insert,update on public.journey_preview_renditions to authenticated;
grant all on public.journey_preview_renditions to service_role;
create policy own_preview_read on public.journey_preview_renditions for select to authenticated using(owner_id=(select auth.uid()) and exists(select 1 from public.sfmc_journey_snapshots s where s.id=snapshot_id));
create policy own_preview_insert on public.journey_preview_renditions for insert to authenticated with check(owner_id=(select auth.uid()) and exists(select 1 from public.journey_flow_messages_v m where m.snapshot_id=journey_preview_renditions.snapshot_id and m.occurrence_key=journey_preview_renditions.occurrence_key and m.content_fingerprint=journey_preview_renditions.content_fingerprint));
create policy own_preview_update on public.journey_preview_renditions for update to authenticated using(owner_id=(select auth.uid())) with check(owner_id=(select auth.uid()) and exists(select 1 from public.journey_flow_messages_v m where m.snapshot_id=journey_preview_renditions.snapshot_id and m.occurrence_key=journey_preview_renditions.occurrence_key and m.content_fingerprint=journey_preview_renditions.content_fingerprint));

create or replace function public.read_journey_flow_manifest(p_snapshot uuid)
 returns jsonb language sql stable security invoker set search_path=pg_catalog,public as $$
 select jsonb_build_object('id',s.id,'import_id',s.import_id,'reference',s.reference,'journey_name',s.journey_name,
 'journey_version',s.journey_version,'created_at',s.created_at,'renditions',coalesce((select jsonb_object_agg(m.activity_key,to_jsonb(r))
 from public.journey_preview_renditions r join public.journey_flow_messages_v m on m.snapshot_id=r.snapshot_id
 and m.occurrence_key=r.occurrence_key and m.content_fingerprint=r.content_fingerprint
 where r.snapshot_id=s.id and r.owner_id=(select auth.uid()) and r.status='ready' and r.renderer_version='flow-v2-1'),'{}'::jsonb),'graph',
 jsonb_set(jsonb_set(s.graph,'{entry,de}',coalesce(s.graph#>'{entry,de}','{}'::jsonb)-'fields'),'{nodes}',
 coalesce((select jsonb_agg(jsonb_set(n,'{configuration}',coalesce(n->'configuration','{}'::jsonb)-'requestBody'))
 from jsonb_array_elements(s.graph->'nodes') n),'[]'::jsonb)))
 from public.sfmc_journey_snapshots s where s.id=p_snapshot and (select auth.uid()) is not null;
 $$;
revoke all on function public.read_journey_flow_manifest(uuid) from public,anon;
grant execute on function public.read_journey_flow_manifest(uuid) to authenticated,service_role;
