-- Visão Daily: registros diários do time por projeto, com frentes, parceiros e tags configuráveis.
-- Leitura para membros aprovados; escrita somente por RPC (membro aprovado), com revisão otimista
-- e histórico append-only. Estrutura apenas: frentes, parceiros, projetos e registros entram por carga própria.
begin;

create table public.daily_frentes (
  key text primary key check (key ~ '^[a-z0-9_-]{1,40}$'),
  name text not null check (length(trim(name)) between 1 and 60),
  short text not null default '' check (length(short) <= 4),
  color text not null default '#64748b' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  position integer not null default 0,
  archived boolean not null default false,
  revision integer not null default 1,
  updated_at timestamptz not null default now()
);

create table public.daily_partners (
  key text primary key check (key ~ '^[a-z0-9_-]{1,40}$'),
  name text not null check (length(trim(name)) between 1 and 60),
  color text not null default '#64748b' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  crm_key text,
  position integer not null default 0,
  archived boolean not null default false,
  revision integer not null default 1,
  updated_at timestamptz not null default now()
);

create table public.daily_tags (
  key text primary key check (key ~ '^[a-z0-9_-]{1,40}$'),
  name text not null check (length(trim(name)) between 1 and 60),
  color text not null default '#0f766e' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  position integer not null default 0,
  archived boolean not null default false,
  revision integer not null default 1,
  updated_at timestamptz not null default now()
);

create table public.daily_projects (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 2 and 120),
  frente_key text not null references public.daily_frentes(key),
  partner_keys text[] not null default '{}',
  wiki_note text not null default '',
  initiative_id uuid,
  merged_into uuid references public.daily_projects(id),
  archived boolean not null default false,
  revision integer not null default 1,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index daily_projects_name_active_idx on public.daily_projects (lower(name)) where not archived;

create table public.daily_entries (
  id uuid primary key default gen_random_uuid(),
  day date not null,
  project_id uuid not null references public.daily_projects(id),
  body text not null check (length(trim(body)) between 1 and 2000),
  tag_keys text[] not null default '{}',
  responsible_id uuid references auth.users(id),
  follower_ids uuid[] not null default '{}',
  position double precision not null default 0,
  source text not null default 'app' check (source in ('app','planilha')),
  deleted_at timestamptz,
  revision integer not null default 1,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index daily_entries_day_idx on public.daily_entries (day) where deleted_at is null;
create index daily_entries_project_idx on public.daily_entries (project_id, day) where deleted_at is null;

create table public.daily_events (
  id bigint generated always as identity primary key,
  entity text not null check (entity in ('entry','project','frente','partner','tag')),
  entity_id text not null,
  revision integer not null,
  actor_id uuid references auth.users(id),
  before_data jsonb,
  after_data jsonb not null,
  created_at timestamptz not null default now()
);
create index daily_events_entity_idx on public.daily_events (entity, entity_id, revision desc);

do $$
declare t text;
begin
  foreach t in array array['daily_frentes','daily_partners','daily_tags','daily_projects','daily_entries','daily_events'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from public, anon, authenticated', t);
    execute format('grant select on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('create policy %I on public.%I for select to authenticated using ((select gaas_security.is_approved_member()))', t || '_read', t);
    execute format('create policy gaas_approved_member_gate on public.%I as restrictive for all to anon, authenticated using ((select gaas_security.is_approved_member())) with check ((select gaas_security.is_approved_member()))', t);
  end loop;
end $$;

create function public.gaas_daily_require_member() returns uuid
language plpgsql stable security definer set search_path = '' as $$
begin
  if auth.uid() is null or not gaas_security.is_approved_member() then
    raise exception 'daily_access_denied' using errcode = '42501';
  end if;
  return auth.uid();
end $$;

create function public.gaas_daily_save_entry(p_id uuid, p_revision integer, p_body jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare uid uuid := public.gaas_daily_require_member(); n public.daily_entries; previous public.daily_entries;
begin
  if p_body is null or jsonb_typeof(p_body) <> 'object' then raise exception 'daily_invalid_body'; end if;
  if p_id is not null then
    select * into n from public.daily_entries where id = p_id for update;
    if not found or n.deleted_at is not null then raise exception 'daily_not_found'; end if;
    if n.revision is distinct from p_revision then raise exception 'daily_revision_conflict'; end if;
    previous := n;
  else
    n.id := gen_random_uuid(); n.revision := 0; n.tag_keys := '{}'; n.follower_ids := '{}'; n.source := 'app';
    n.responsible_id := uid; n.created_by := uid; n.created_at := now();
  end if;
  if p_body ? 'day' then n.day := (p_body->>'day')::date; end if;
  if p_body ? 'project_id' then n.project_id := (p_body->>'project_id')::uuid; end if;
  if p_body ? 'body' then n.body := trim(p_body->>'body'); end if;
  if p_body ? 'position' then n.position := (p_body->>'position')::double precision;
  elsif p_id is null then n.position := coalesce((select max(position) from public.daily_entries where day = n.day and deleted_at is null), 0) + 1; end if;
  if p_body ? 'tag_keys' then
    if jsonb_typeof(p_body->'tag_keys') <> 'array' then raise exception 'daily_tags_invalid'; end if;
    n.tag_keys := array(select distinct v from jsonb_array_elements_text(p_body->'tag_keys') v order by 1);
  end if;
  if p_body ? 'responsible_id' then n.responsible_id := nullif(p_body->>'responsible_id', '')::uuid; end if;
  if p_body ? 'follower_ids' then
    if jsonb_typeof(p_body->'follower_ids') <> 'array' then raise exception 'daily_followers_invalid'; end if;
    n.follower_ids := array(select distinct v::uuid from jsonb_array_elements_text(p_body->'follower_ids') v order by 1);
  end if;
  if n.day is null or n.day < date '2020-01-01' or n.day > current_date + 400 then raise exception 'daily_day_invalid'; end if;
  if coalesce(length(n.body), 0) < 1 then raise exception 'daily_body_required'; end if;
  if n.project_id is null or not exists (select 1 from public.daily_projects p where p.id = n.project_id and not p.archived) then
    if p_id is null or previous.project_id is distinct from n.project_id then raise exception 'daily_project_invalid'; end if;
  end if;
  if exists (select 1 from unnest(n.tag_keys) k where not exists (select 1 from public.daily_tags t where t.key = k)) then raise exception 'daily_tags_invalid'; end if;
  if n.responsible_id is not null and not exists (select 1 from auth.users u where u.id = n.responsible_id) then raise exception 'daily_person_invalid'; end if;
  if exists (select 1 from unnest(n.follower_ids) f where not exists (select 1 from auth.users u where u.id = f)) then raise exception 'daily_person_invalid'; end if;
  if coalesce((p_body->>'deleted')::boolean, false) then n.deleted_at := clock_timestamp(); end if;
  if p_id is not null and to_jsonb(n) = to_jsonb(previous) then return to_jsonb(n); end if;
  n.revision := n.revision + 1; n.updated_at := clock_timestamp();
  if p_id is null then insert into public.daily_entries select (n).*;
  else update public.daily_entries set day = n.day, project_id = n.project_id, body = n.body, tag_keys = n.tag_keys,
    responsible_id = n.responsible_id, follower_ids = n.follower_ids, position = n.position, deleted_at = n.deleted_at,
    revision = n.revision, updated_at = n.updated_at where id = n.id; end if;
  insert into public.daily_events(entity, entity_id, revision, actor_id, before_data, after_data)
  values ('entry', n.id::text, n.revision, uid, case when p_id is null then null else to_jsonb(previous) end, to_jsonb(n));
  return to_jsonb(n);
end $$;

create function public.gaas_daily_save_project(p_id uuid, p_revision integer, p_body jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare uid uuid := public.gaas_daily_require_member(); n public.daily_projects; previous public.daily_projects;
begin
  if p_body is null or jsonb_typeof(p_body) <> 'object' then raise exception 'daily_invalid_body'; end if;
  if p_id is not null then
    select * into n from public.daily_projects where id = p_id for update;
    if not found then raise exception 'daily_not_found'; end if;
    if n.revision is distinct from p_revision then raise exception 'daily_revision_conflict'; end if;
    previous := n;
  else
    n.id := gen_random_uuid(); n.revision := 0; n.partner_keys := '{}'; n.wiki_note := ''; n.archived := false;
    n.created_by := uid; n.created_at := now();
  end if;
  if p_body ? 'name' then n.name := trim(p_body->>'name'); end if;
  if p_body ? 'frente_key' then n.frente_key := p_body->>'frente_key'; end if;
  if p_body ? 'wiki_note' then n.wiki_note := coalesce(trim(p_body->>'wiki_note'), ''); end if;
  if p_body ? 'initiative_id' then n.initiative_id := nullif(p_body->>'initiative_id', '')::uuid; end if;
  if p_body ? 'archived' then n.archived := (p_body->>'archived')::boolean; end if;
  if p_body ? 'partner_keys' then
    if jsonb_typeof(p_body->'partner_keys') <> 'array' then raise exception 'daily_partners_invalid'; end if;
    n.partner_keys := array(select distinct v from jsonb_array_elements_text(p_body->'partner_keys') v order by 1);
  end if;
  if coalesce(length(n.name), 0) < 2 then raise exception 'daily_name_required'; end if;
  if n.frente_key is null or not exists (select 1 from public.daily_frentes f where f.key = n.frente_key) then raise exception 'daily_frente_invalid'; end if;
  if exists (select 1 from unnest(n.partner_keys) k where not exists (select 1 from public.daily_partners p where p.key = k)) then raise exception 'daily_partners_invalid'; end if;
  if not n.archived and exists (select 1 from public.daily_projects p where lower(p.name) = lower(n.name) and not p.archived and p.id <> n.id) then
    raise exception 'daily_project_name_taken';
  end if;
  if p_id is not null and to_jsonb(n) = to_jsonb(previous) then return to_jsonb(n); end if;
  n.revision := n.revision + 1; n.updated_at := clock_timestamp();
  if p_id is null then insert into public.daily_projects select (n).*;
  else update public.daily_projects set name = n.name, frente_key = n.frente_key, partner_keys = n.partner_keys, wiki_note = n.wiki_note,
    initiative_id = n.initiative_id, archived = n.archived, revision = n.revision, updated_at = n.updated_at where id = n.id; end if;
  insert into public.daily_events(entity, entity_id, revision, actor_id, before_data, after_data)
  values ('project', n.id::text, n.revision, uid, case when p_id is null then null else to_jsonb(previous) end, to_jsonb(n));
  return to_jsonb(n);
end $$;

-- Junta um projeto em outro: os registros mudam de projeto (com histórico) e o projeto de origem fica arquivado.
create function public.gaas_daily_merge_projects(p_from uuid, p_into uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare uid uuid := public.gaas_daily_require_member(); src public.daily_projects; dst public.daily_projects; e public.daily_entries; moved integer := 0;
begin
  if p_from is null or p_into is null or p_from = p_into then raise exception 'daily_merge_invalid'; end if;
  select * into src from public.daily_projects where id = p_from for update;
  select * into dst from public.daily_projects where id = p_into for update;
  if src.id is null or dst.id is null or dst.archived then raise exception 'daily_merge_invalid'; end if;
  for e in select * from public.daily_entries where project_id = p_from and deleted_at is null for update loop
    update public.daily_entries set project_id = p_into, revision = e.revision + 1, updated_at = clock_timestamp() where id = e.id;
    insert into public.daily_events(entity, entity_id, revision, actor_id, before_data, after_data)
    values ('entry', e.id::text, e.revision + 1, uid, to_jsonb(e), to_jsonb(e) || jsonb_build_object('project_id', p_into, 'revision', e.revision + 1));
    moved := moved + 1;
  end loop;
  update public.daily_projects set archived = true, merged_into = p_into, revision = src.revision + 1, updated_at = clock_timestamp() where id = p_from;
  insert into public.daily_events(entity, entity_id, revision, actor_id, before_data, after_data)
  values ('project', p_from::text, src.revision + 1, uid, to_jsonb(src), to_jsonb(src) || jsonb_build_object('archived', true, 'merged_into', p_into, 'revision', src.revision + 1));
  return jsonb_build_object('moved', moved, 'into', p_into);
end $$;

-- Frentes, parceiros e tags: criação, edição e arquivamento. Arquivar esconde dos menus sem apagar o histórico.
create function public.gaas_daily_save_option(p_kind text, p_key text, p_body jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare uid uuid := public.gaas_daily_require_member(); tbl text; k text := p_key; before jsonb; after jsonb; rev integer;
begin
  if p_body is null or jsonb_typeof(p_body) <> 'object' then raise exception 'daily_invalid_body'; end if;
  tbl := case p_kind when 'frente' then 'daily_frentes' when 'partner' then 'daily_partners' when 'tag' then 'daily_tags' end;
  if tbl is null then raise exception 'daily_kind_invalid'; end if;
  if k is null or k = '' then
    if coalesce(length(trim(p_body->>'name')), 0) < 1 then raise exception 'daily_name_required'; end if;
    k := left(regexp_replace(lower(translate(trim(p_body->>'name'), 'áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ', 'aaaaaeeeeiiiiooooouuuucaaaaaeeeeiiiiooooouuuuc')), '[^a-z0-9]+', '-', 'g'), 30);
    k := trim(both '-' from k);
    if k = '' then k := 'item'; end if;
    while exists (select 1 from public.daily_frentes where key = k and tbl = 'daily_frentes')
       or exists (select 1 from public.daily_partners where key = k and tbl = 'daily_partners')
       or exists (select 1 from public.daily_tags where key = k and tbl = 'daily_tags') loop
      k := left(k, 30) || '-' || substr(md5(random()::text), 1, 4);
    end loop;
  end if;
  execute format('select to_jsonb(t) from public.%I t where key = $1', tbl) into before using k;
  if before is null then
    if p_kind = 'frente' then insert into public.daily_frentes(key, name, short, color, position) values (k, trim(p_body->>'name'), coalesce(p_body->>'short', ''), coalesce(p_body->>'color', '#64748b'), coalesce((p_body->>'position')::integer, (select coalesce(max(position), 0) + 1 from public.daily_frentes)));
    elsif p_kind = 'partner' then insert into public.daily_partners(key, name, color, crm_key, position) values (k, trim(p_body->>'name'), coalesce(p_body->>'color', '#64748b'), nullif(p_body->>'crm_key', ''), coalesce((p_body->>'position')::integer, (select coalesce(max(position), 0) + 1 from public.daily_partners)));
    else insert into public.daily_tags(key, name, color, position) values (k, trim(p_body->>'name'), coalesce(p_body->>'color', '#0f766e'), coalesce((p_body->>'position')::integer, (select coalesce(max(position), 0) + 1 from public.daily_tags)));
    end if;
  else
    rev := (before->>'revision')::integer;
    if p_body ? 'revision' and (p_body->>'revision')::integer is distinct from rev then raise exception 'daily_revision_conflict'; end if;
    execute format('update public.%I set name = coalesce(trim($2->>''name''), name), color = coalesce($2->>''color'', color), position = coalesce(($2->>''position'')::integer, position), archived = coalesce(($2->>''archived'')::boolean, archived), revision = revision + 1, updated_at = clock_timestamp() where key = $1', tbl) using k, p_body;
    if p_kind = 'frente' and p_body ? 'short' then update public.daily_frentes set short = coalesce(p_body->>'short', '') where key = k; end if;
    if p_kind = 'partner' and p_body ? 'crm_key' then update public.daily_partners set crm_key = nullif(p_body->>'crm_key', '') where key = k; end if;
  end if;
  execute format('select to_jsonb(t) from public.%I t where key = $1', tbl) into after using k;
  insert into public.daily_events(entity, entity_id, revision, actor_id, before_data, after_data)
  values (p_kind, k, (after->>'revision')::integer, uid, before, after);
  return after;
end $$;

-- Pessoas que podem ser responsáveis ou acompanhar: membros aprovados, só id e nome (sem e-mail).
create function public.gaas_daily_people() returns table (id uuid, name text)
language plpgsql stable security definer set search_path = '' as $$
begin
  perform public.gaas_daily_require_member();
  return query
    select m.user_id, coalesce(nullif(trim(p.full_name), ''), 'Membro ' || left(m.user_id::text, 4))
    from gaas_security.approved_members m left join public.profiles p on p.id = m.user_id
    where m.enabled order by 2;
end $$;

-- Cartões e propostas dos disparos CRM por dia (fuso de São Paulo) e parceiro canônico.
create function public.gaas_daily_crm_cards(p_start date, p_end date) returns table (day date, partner text, cards numeric, proposals numeric)
language sql stable set search_path = '' as $$
  select d, coalesce(a.parceiro_canonico, 'N/A'), coalesce(sum(a."Cartões Gerados"), 0), coalesce(sum(a."Propostas"), 0)
  from public.activities a
  cross join lateral (select (a."Data de Disparo" at time zone 'America/Sao_Paulo')::date as d) x
  where a."Data de Disparo" >= (p_start::timestamp at time zone 'America/Sao_Paulo')
    and a."Data de Disparo" < ((p_end + 1)::timestamp at time zone 'America/Sao_Paulo')
  group by d, coalesce(a.parceiro_canonico, 'N/A')
$$;

revoke all on function public.gaas_daily_require_member() from public, anon;
revoke all on function public.gaas_daily_save_entry(uuid, integer, jsonb) from public, anon;
revoke all on function public.gaas_daily_save_project(uuid, integer, jsonb) from public, anon;
revoke all on function public.gaas_daily_merge_projects(uuid, uuid) from public, anon;
revoke all on function public.gaas_daily_save_option(text, text, jsonb) from public, anon;
revoke all on function public.gaas_daily_people() from public, anon;
revoke all on function public.gaas_daily_crm_cards(date, date) from public, anon;
grant execute on function public.gaas_daily_require_member() to authenticated, service_role;
grant execute on function public.gaas_daily_save_entry(uuid, integer, jsonb) to authenticated, service_role;
grant execute on function public.gaas_daily_save_project(uuid, integer, jsonb) to authenticated, service_role;
grant execute on function public.gaas_daily_merge_projects(uuid, uuid) to authenticated, service_role;
grant execute on function public.gaas_daily_save_option(text, text, jsonb) to authenticated, service_role;
grant execute on function public.gaas_daily_people() to authenticated, service_role;
grant execute on function public.gaas_daily_crm_cards(date, date) to authenticated, service_role;

commit;
