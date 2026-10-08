-- Read-only journey snapshots. Existing staged messages/approvals/executions are untouched.
create table public.sfmc_journey_snapshots (
 id uuid primary key default gen_random_uuid(), import_id uuid not null references public.sfmc_package_imports(id) on delete restrict,
 reference text not null,journey_name text not null,journey_version integer not null,
 graph jsonb not null check(jsonb_typeof(graph)='object'),messages jsonb not null check(jsonb_typeof(messages)='array'),
 created_at timestamptz not null default now(),unique(import_id,reference,journey_version)
);
alter table public.sfmc_journey_snapshots enable row level security;
revoke all on public.sfmc_journey_snapshots from public,anon,authenticated;
grant select on public.sfmc_journey_snapshots to authenticated;
grant all on public.sfmc_journey_snapshots to service_role;
create policy sfmc_snapshot_read on public.sfmc_journey_snapshots for select to authenticated
 using (exists(select 1 from public.sfmc_package_imports i where i.id=import_id));
-- Atomic extension of both UI and agent staging. Legacy packages remain accepted.
alter function gaas_sfmc_private.stage_core(jsonb,text,uuid,text) rename to stage_messages_v1;
create function gaas_sfmc_private.stage_core(p_package jsonb,p_scope text,p_actor uuid,p_via text)
returns uuid language plpgsql security definer set search_path=pg_catalog,public as $$
declare result uuid;g jsonb;m jsonb;
begin
 if p_package ? 'graphs' then
  if jsonb_typeof(p_package->'graphs') is distinct from 'array' or jsonb_array_length(p_package->'graphs')>500 then raise exception 'Grafos inválidos';end if;
  for g in select value from jsonb_array_elements(p_package->'graphs') loop
   if coalesce(g->>'reference','')='' or coalesce(g->>'name','')='' or jsonb_typeof(g->'nodes') is distinct from 'array' or jsonb_array_length(g->'nodes')>2000 then raise exception 'Grafo sem estrutura válida';end if;
  end loop;
 end if;
 result:=gaas_sfmc_private.stage_messages_v1(p_package,p_scope,p_actor,p_via);
 for g in select value from jsonb_array_elements(coalesce(p_package->'graphs','[]'::jsonb)) loop
  select coalesce(jsonb_agg(value),'[]'::jsonb) into m from jsonb_array_elements(p_package->'messages')
   where starts_with(value->>'occurrence_key',(g->>'reference')||':'||(g->>'version')||':')
    and (value->>'journey_version')::integer=(g->>'version')::integer;
  insert into public.sfmc_journey_snapshots(import_id,reference,journey_name,journey_version,graph,messages)
   values(result,g->>'reference',g->>'name',(g->>'version')::integer,g,m) on conflict do nothing;
 end loop;
 return result;
end $$;
revoke all on function gaas_sfmc_private.stage_core(jsonb,text,uuid,text),gaas_sfmc_private.stage_messages_v1(jsonb,text,uuid,text) from public,anon,authenticated;
grant execute on function gaas_sfmc_private.stage_core(jsonb,text,uuid,text),gaas_sfmc_private.stage_messages_v1(jsonb,text,uuid,text) to service_role;
