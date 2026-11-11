-- Estrutura CRM: mapa editável do portfólio de campanhas CRM (pilar > coluna > campanha).
-- Leitura para qualquer usuário autenticado; escrita somente por RPC, por administradores,
-- com revisão otimista e histórico append-only. Status observado é calculado no app.
begin;

create table public.crm_structure_pillars (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(trim(title)) between 2 and 80),
  accent text not null default '#00C6CC' check (accent ~ '^#[0-9A-Fa-f]{6}$'),
  position integer not null default 0,
  archived boolean not null default false,
  revision integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.crm_structure_lanes (
  id uuid primary key default gen_random_uuid(),
  pillar_id uuid not null references public.crm_structure_pillars(id),
  title text not null check (length(trim(title)) between 2 and 120),
  metric_key text not null default 're' check (metric_key in ('aq','de','re','cs','en')),
  wide boolean not null default false,
  position integer not null default 0,
  archived boolean not null default false,
  revision integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.crm_structure_cards (
  id uuid primary key default gen_random_uuid(),
  lane_id uuid not null references public.crm_structure_lanes(id),
  position double precision not null default 0,
  title text not null check (length(trim(title)) between 2 and 180),
  audience text not null default '',
  bus text[] not null default '{}',
  declared_status text not null default 'bkl' check (declared_status in ('rec','con','mat','est','int','bkl','pon')),
  measurement text not null default 'n' check (measurement in ('r','c','p','n')),
  owner text not null default '',
  wiki_note text not null default '',
  external_note text not null default '',
  data_scope jsonb check (data_scope is null or (jsonb_typeof(data_scope) = 'object' and data_scope->>'domain' in ('crm','renta'))),
  archived boolean not null default false,
  revision integer not null default 1,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.crm_structure_events (
  id bigint generated always as identity primary key,
  entity text not null check (entity in ('pillar','lane','card')),
  entity_id uuid not null,
  revision integer not null,
  actor_id uuid references auth.users(id),
  before_data jsonb,
  after_data jsonb not null,
  created_at timestamptz not null default now(),
  unique (entity, entity_id, revision)
);

create index crm_structure_lanes_pillar_idx on public.crm_structure_lanes(pillar_id);
create index crm_structure_cards_lane_idx on public.crm_structure_cards(lane_id);
create index crm_structure_events_entity_idx on public.crm_structure_events(entity_id, revision desc);

alter table public.crm_structure_pillars enable row level security;
alter table public.crm_structure_lanes enable row level security;
alter table public.crm_structure_cards enable row level security;
alter table public.crm_structure_events enable row level security;
revoke all on public.crm_structure_pillars, public.crm_structure_lanes, public.crm_structure_cards, public.crm_structure_events from public, anon, authenticated;
grant select on public.crm_structure_pillars, public.crm_structure_lanes, public.crm_structure_cards, public.crm_structure_events to authenticated;
grant all on public.crm_structure_pillars, public.crm_structure_lanes, public.crm_structure_cards, public.crm_structure_events to service_role;
create policy crm_structure_pillars_read on public.crm_structure_pillars for select to authenticated using ((select auth.uid()) is not null);
create policy crm_structure_lanes_read on public.crm_structure_lanes for select to authenticated using ((select auth.uid()) is not null);
create policy crm_structure_cards_read on public.crm_structure_cards for select to authenticated using ((select auth.uid()) is not null);
create policy crm_structure_events_read on public.crm_structure_events for select to authenticated using ((select auth.uid()) is not null);

create function public.crm_structure_save_pillar(p_id uuid, p_revision integer, p_body jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare n public.crm_structure_pillars; previous public.crm_structure_pillars;
begin
  if auth.uid() is null or not public.gaas_vault_is_admin() then raise exception 'crm_structure_access_denied'; end if;
  if p_id is not null then
    select * into n from public.crm_structure_pillars where id = p_id for update;
    if not found then raise exception 'crm_structure_not_found'; end if;
    if n.revision is distinct from p_revision then raise exception 'crm_structure_revision_conflict'; end if;
    previous := n;
  else
    n.id := gen_random_uuid(); n.revision := 0; n.archived := false; n.accent := '#00C6CC'; n.created_at := now();
    n.position := coalesce((select max(position) from public.crm_structure_pillars), 0) + 1;
  end if;
  if p_body ? 'title' then n.title := trim(p_body->>'title'); end if;
  if p_body ? 'accent' then n.accent := p_body->>'accent'; end if;
  if p_body ? 'position' then n.position := (p_body->>'position')::integer; end if;
  if p_body ? 'archived' then n.archived := (p_body->>'archived')::boolean; end if;
  if coalesce(length(trim(n.title)), 0) < 2 then raise exception 'crm_structure_title_required'; end if;
  if n.archived and exists (select 1 from public.crm_structure_lanes l where l.pillar_id = n.id and not l.archived) then
    raise exception 'crm_structure_pillar_not_empty';
  end if;
  if p_id is not null and to_jsonb(n) = to_jsonb(previous) then return to_jsonb(n); end if;
  n.revision := n.revision + 1; n.updated_at := clock_timestamp();
  if p_id is null then insert into public.crm_structure_pillars select (n).*;
  else update public.crm_structure_pillars set title = n.title, accent = n.accent, position = n.position, archived = n.archived,
    revision = n.revision, updated_at = n.updated_at where id = n.id; end if;
  insert into public.crm_structure_events(entity, entity_id, revision, actor_id, before_data, after_data)
  values ('pillar', n.id, n.revision, auth.uid(), case when p_id is null then null else to_jsonb(previous) end, to_jsonb(n));
  return to_jsonb(n);
end $$;

create function public.crm_structure_save_lane(p_id uuid, p_revision integer, p_body jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare n public.crm_structure_lanes; previous public.crm_structure_lanes;
begin
  if auth.uid() is null or not public.gaas_vault_is_admin() then raise exception 'crm_structure_access_denied'; end if;
  if p_id is not null then
    select * into n from public.crm_structure_lanes where id = p_id for update;
    if not found then raise exception 'crm_structure_not_found'; end if;
    if n.revision is distinct from p_revision then raise exception 'crm_structure_revision_conflict'; end if;
    previous := n;
  else
    n.id := gen_random_uuid(); n.revision := 0; n.archived := false; n.wide := false; n.metric_key := 're'; n.created_at := now();
  end if;
  if p_body ? 'pillar_id' then n.pillar_id := (p_body->>'pillar_id')::uuid; end if;
  if p_body ? 'title' then n.title := trim(p_body->>'title'); end if;
  if p_body ? 'metric_key' then n.metric_key := p_body->>'metric_key'; end if;
  if p_body ? 'wide' then n.wide := (p_body->>'wide')::boolean; end if;
  if p_body ? 'archived' then n.archived := (p_body->>'archived')::boolean; end if;
  if n.pillar_id is null or not exists (select 1 from public.crm_structure_pillars p where p.id = n.pillar_id and not p.archived) then
    raise exception 'crm_structure_pillar_invalid';
  end if;
  if p_body ? 'position' then n.position := (p_body->>'position')::integer;
  elsif p_id is null then n.position := coalesce((select max(position) from public.crm_structure_lanes where pillar_id = n.pillar_id), 0) + 1; end if;
  if coalesce(length(trim(n.title)), 0) < 2 then raise exception 'crm_structure_title_required'; end if;
  if n.archived and exists (select 1 from public.crm_structure_cards c where c.lane_id = n.id and not c.archived) then
    raise exception 'crm_structure_lane_not_empty';
  end if;
  if p_id is not null and to_jsonb(n) = to_jsonb(previous) then return to_jsonb(n); end if;
  n.revision := n.revision + 1; n.updated_at := clock_timestamp();
  if p_id is null then insert into public.crm_structure_lanes select (n).*;
  else update public.crm_structure_lanes set pillar_id = n.pillar_id, title = n.title, metric_key = n.metric_key, wide = n.wide,
    position = n.position, archived = n.archived, revision = n.revision, updated_at = n.updated_at where id = n.id; end if;
  insert into public.crm_structure_events(entity, entity_id, revision, actor_id, before_data, after_data)
  values ('lane', n.id, n.revision, auth.uid(), case when p_id is null then null else to_jsonb(previous) end, to_jsonb(n));
  return to_jsonb(n);
end $$;

create function public.crm_structure_save_card(p_id uuid, p_revision integer, p_body jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare n public.crm_structure_cards; previous public.crm_structure_cards;
begin
  if auth.uid() is null or not public.gaas_vault_is_admin() then raise exception 'crm_structure_access_denied'; end if;
  if p_id is not null then
    select * into n from public.crm_structure_cards where id = p_id for update;
    if not found then raise exception 'crm_structure_not_found'; end if;
    if n.revision is distinct from p_revision then raise exception 'crm_structure_revision_conflict'; end if;
    previous := n;
  else
    n.id := gen_random_uuid(); n.revision := 0; n.archived := false; n.audience := ''; n.bus := '{}';
    n.declared_status := 'bkl'; n.measurement := 'n'; n.owner := ''; n.wiki_note := ''; n.external_note := '';
    n.created_by := auth.uid(); n.created_at := now();
  end if;
  if p_body ? 'lane_id' then n.lane_id := (p_body->>'lane_id')::uuid; end if;
  if p_body ? 'title' then n.title := trim(p_body->>'title'); end if;
  if p_body ? 'audience' then n.audience := coalesce(trim(p_body->>'audience'), ''); end if;
  if p_body ? 'owner' then n.owner := coalesce(trim(p_body->>'owner'), ''); end if;
  if p_body ? 'wiki_note' then n.wiki_note := coalesce(trim(p_body->>'wiki_note'), ''); end if;
  if p_body ? 'external_note' then n.external_note := coalesce(trim(p_body->>'external_note'), ''); end if;
  if p_body ? 'bus' then
    if jsonb_typeof(p_body->'bus') <> 'array' then raise exception 'crm_structure_bus_invalid'; end if;
    n.bus := array(select distinct trim(v) from jsonb_array_elements_text(p_body->'bus') v where trim(v) <> '' order by 1);
  end if;
  if p_body ? 'declared_status' then n.declared_status := p_body->>'declared_status'; end if;
  if p_body ? 'measurement' then n.measurement := p_body->>'measurement'; end if;
  if p_body ? 'archived' then n.archived := (p_body->>'archived')::boolean; end if;
  if p_body ? 'data_scope' then
    n.data_scope := case when jsonb_typeof(p_body->'data_scope') = 'null' then null else p_body->'data_scope' end;
  end if;
  if n.lane_id is null or not exists (select 1 from public.crm_structure_lanes l where l.id = n.lane_id and not l.archived) then
    raise exception 'crm_structure_lane_invalid';
  end if;
  if p_body ? 'position' then n.position := (p_body->>'position')::double precision;
  elsif p_id is null or (previous.lane_id is distinct from n.lane_id) then
    n.position := coalesce((select max(position) from public.crm_structure_cards where lane_id = n.lane_id and id <> n.id), 0) + 1;
  end if;
  if coalesce(length(trim(n.title)), 0) < 2 then raise exception 'crm_structure_title_required'; end if;
  if p_id is not null and to_jsonb(n) = to_jsonb(previous) then return to_jsonb(n); end if;
  n.revision := n.revision + 1; n.updated_at := clock_timestamp();
  if p_id is null then insert into public.crm_structure_cards select (n).*;
  else update public.crm_structure_cards set lane_id = n.lane_id, position = n.position, title = n.title, audience = n.audience,
    bus = n.bus, declared_status = n.declared_status, measurement = n.measurement, owner = n.owner, wiki_note = n.wiki_note,
    external_note = n.external_note, data_scope = n.data_scope, archived = n.archived, revision = n.revision,
    updated_at = n.updated_at where id = n.id; end if;
  insert into public.crm_structure_events(entity, entity_id, revision, actor_id, before_data, after_data)
  values ('card', n.id, n.revision, auth.uid(), case when p_id is null then null else to_jsonb(previous) end, to_jsonb(n));
  return to_jsonb(n);
end $$;

revoke all on function public.crm_structure_save_pillar(uuid, integer, jsonb) from public, anon;
revoke all on function public.crm_structure_save_lane(uuid, integer, jsonb) from public, anon;
revoke all on function public.crm_structure_save_card(uuid, integer, jsonb) from public, anon;
grant execute on function public.crm_structure_save_pillar(uuid, integer, jsonb) to authenticated, service_role;
grant execute on function public.crm_structure_save_lane(uuid, integer, jsonb) to authenticated, service_role;
grant execute on function public.crm_structure_save_card(uuid, integer, jsonb) to authenticated, service_role;

-- A carga inicial do portfólio (dado da operação) é aplicada direto no Supabase, fora do repositório público.

commit;
