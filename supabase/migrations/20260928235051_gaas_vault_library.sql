-- GaaS Vault Library
-- The Obsidian folder remains the canonical authoring source. These tables are
-- an authenticated, searchable projection with append-only revision evidence.

create table public.gaas_vault_sync_runs (
  id uuid primary key default gen_random_uuid(),
  vault_key text not null default 'afinz-crm-midia',
  status text not null default 'running' check (status in ('running', 'completed', 'failed')),
  source text not null default 'browser-directory',
  actor_id uuid not null references auth.users(id),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  note_count integer not null default 0 check (note_count >= 0),
  link_count integer not null default 0 check (link_count >= 0),
  changed_count integer not null default 0 check (changed_count >= 0),
  deleted_count integer not null default 0 check (deleted_count >= 0),
  error_message text
);

create table public.gaas_vault_notes (
  id uuid primary key default gen_random_uuid(),
  vault_key text not null default 'afinz-crm-midia',
  relative_path text not null,
  title text not null,
  aliases text[] not null default '{}',
  folder text not null default '',
  content_markdown text not null,
  frontmatter jsonb not null default '{}'::jsonb,
  tags text[] not null default '{}',
  note_type text,
  layer text,
  status text,
  source text,
  content_hash text not null,
  source_modified_at timestamptz,
  indexed_at timestamptz not null default now(),
  deleted_at timestamptz,
  last_sync_run_id uuid references public.gaas_vault_sync_runs(id),
  search_vector tsvector not null default ''::tsvector,
  constraint gaas_vault_notes_path_unique unique (vault_key, relative_path),
  constraint gaas_vault_notes_relative_path_check check (
    relative_path <> '' and relative_path !~ '(^|/)\.\.(/|$)' and relative_path not like '/%'
  )
);

create table public.gaas_vault_note_revisions (
  id bigint generated always as identity primary key,
  note_id uuid not null references public.gaas_vault_notes(id) on delete cascade,
  sync_run_id uuid not null references public.gaas_vault_sync_runs(id),
  content_hash text not null,
  title text not null,
  content_markdown text not null,
  frontmatter jsonb not null,
  recorded_at timestamptz not null default now()
);

create table public.gaas_vault_links (
  id bigint generated always as identity primary key,
  source_note_id uuid not null references public.gaas_vault_notes(id) on delete cascade,
  ordinal integer not null check (ordinal >= 0),
  raw_target text not null,
  target_path text,
  fragment text,
  display_text text,
  target_note_id uuid references public.gaas_vault_notes(id) on delete set null,
  sync_run_id uuid not null references public.gaas_vault_sync_runs(id),
  constraint gaas_vault_links_source_ordinal_unique unique (source_note_id, ordinal)
);

create or replace function public.gaas_vault_notes_search_vector_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.search_vector :=
    setweight(to_tsvector('portuguese'::regconfig, coalesce(new.title, '')), 'A') ||
    setweight(to_tsvector('portuguese'::regconfig, coalesce(array_to_string(new.aliases, ' '), '')), 'A') ||
    setweight(to_tsvector('portuguese'::regconfig, coalesce(array_to_string(new.tags, ' '), '')), 'B') ||
    setweight(to_tsvector('portuguese'::regconfig, coalesce(new.content_markdown, '')), 'C');
  return new;
end;
$$;

create trigger gaas_vault_notes_search_vector_trigger
before insert or update of title, aliases, tags, content_markdown
on public.gaas_vault_notes
for each row execute function public.gaas_vault_notes_search_vector_update();

create index gaas_vault_notes_search_idx on public.gaas_vault_notes using gin (search_vector) where deleted_at is null;
create index gaas_vault_notes_folder_idx on public.gaas_vault_notes (vault_key, folder) where deleted_at is null;
create index gaas_vault_notes_facets_idx on public.gaas_vault_notes (vault_key, layer, note_type, status) where deleted_at is null;
create index gaas_vault_notes_last_sync_idx on public.gaas_vault_notes (last_sync_run_id);
create index gaas_vault_revisions_note_idx on public.gaas_vault_note_revisions (note_id, recorded_at desc);
create index gaas_vault_links_source_idx on public.gaas_vault_links (source_note_id);
create index gaas_vault_links_target_idx on public.gaas_vault_links (target_note_id) where target_note_id is not null;
create index gaas_vault_sync_runs_started_idx on public.gaas_vault_sync_runs (vault_key, started_at desc);

alter table public.gaas_vault_sync_runs enable row level security;
alter table public.gaas_vault_notes enable row level security;
alter table public.gaas_vault_note_revisions enable row level security;
alter table public.gaas_vault_links enable row level security;

create policy "Authenticated users can read vault sync status"
  on public.gaas_vault_sync_runs for select to authenticated
  using ((select auth.uid()) is not null);
create policy "Authenticated users can read vault notes"
  on public.gaas_vault_notes for select to authenticated
  using ((select auth.uid()) is not null);
create policy "Authenticated users can read vault revisions"
  on public.gaas_vault_note_revisions for select to authenticated
  using ((select auth.uid()) is not null);
create policy "Authenticated users can read vault links"
  on public.gaas_vault_links for select to authenticated
  using ((select auth.uid()) is not null);

revoke all on public.gaas_vault_sync_runs from anon, authenticated;
revoke all on public.gaas_vault_notes from anon, authenticated;
revoke all on public.gaas_vault_note_revisions from anon, authenticated;
revoke all on public.gaas_vault_links from anon, authenticated;
grant select on public.gaas_vault_sync_runs to authenticated;
grant select on public.gaas_vault_notes to authenticated;
grant select on public.gaas_vault_note_revisions to authenticated;
grant select on public.gaas_vault_links to authenticated;

create or replace function public.gaas_vault_is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.report_live_memberships membership
    where membership.user_id = (select auth.uid())
      and membership.active = true
      and membership.role = 'admin'
  );
$$;

create or replace function public.gaas_vault_begin_sync(
  p_vault_key text default 'afinz-crm-midia',
  p_source text default 'browser-directory'
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_run_id uuid;
begin
  if not public.gaas_vault_is_admin() then
    raise exception 'vault_sync_admin_required' using errcode = '42501';
  end if;

  insert into public.gaas_vault_sync_runs (vault_key, source, actor_id)
  values (coalesce(nullif(p_vault_key, ''), 'afinz-crm-midia'), coalesce(nullif(p_source, ''), 'browser-directory'), (select auth.uid()))
  returning id into v_run_id;
  return v_run_id;
end;
$$;

create or replace function public.gaas_vault_upsert_batch(
  p_sync_run_id uuid,
  p_notes jsonb
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_vault_key text;
  v_changed integer := 0;
begin
  if not public.gaas_vault_is_admin() then
    raise exception 'vault_sync_admin_required' using errcode = '42501';
  end if;

  select vault_key into v_vault_key
  from public.gaas_vault_sync_runs
  where id = p_sync_run_id and actor_id = (select auth.uid()) and status = 'running';
  if v_vault_key is null then
    raise exception 'vault_sync_run_invalid' using errcode = '22023';
  end if;

  select count(*) into v_changed
  from jsonb_to_recordset(coalesce(p_notes, '[]'::jsonb)) as incoming(relative_path text, content_hash text)
  left join public.gaas_vault_notes existing
    on existing.vault_key = v_vault_key and existing.relative_path = incoming.relative_path
  where existing.id is null or existing.content_hash is distinct from incoming.content_hash or existing.deleted_at is not null;

  insert into public.gaas_vault_note_revisions (note_id, sync_run_id, content_hash, title, content_markdown, frontmatter)
  select existing.id, p_sync_run_id, existing.content_hash, existing.title, existing.content_markdown, existing.frontmatter
  from jsonb_to_recordset(coalesce(p_notes, '[]'::jsonb)) as incoming(
    relative_path text, title text, aliases text[], folder text, content_markdown text,
    frontmatter jsonb, tags text[], note_type text, layer text, status text, source text,
    content_hash text, source_modified_at timestamptz, links jsonb
  )
  join public.gaas_vault_notes existing
    on existing.vault_key = v_vault_key and existing.relative_path = incoming.relative_path
  where existing.content_hash is distinct from incoming.content_hash;

  with incoming as (
    select * from jsonb_to_recordset(coalesce(p_notes, '[]'::jsonb)) as note(
      relative_path text, title text, aliases text[], folder text, content_markdown text,
      frontmatter jsonb, tags text[], note_type text, layer text, status text, source text,
      content_hash text, source_modified_at timestamptz, links jsonb
    )
  )
    insert into public.gaas_vault_notes (
      vault_key, relative_path, title, aliases, folder, content_markdown, frontmatter, tags,
      note_type, layer, status, source, content_hash, source_modified_at, indexed_at,
      deleted_at, last_sync_run_id
    )
    select v_vault_key, relative_path, title, coalesce(aliases, '{}'), coalesce(folder, ''),
      content_markdown, coalesce(frontmatter, '{}'::jsonb), coalesce(tags, '{}'), note_type,
      layer, status, source, content_hash, source_modified_at, now(), null, p_sync_run_id
    from incoming
    on conflict (vault_key, relative_path) do update set
      title = excluded.title,
      aliases = excluded.aliases,
      folder = excluded.folder,
      content_markdown = excluded.content_markdown,
      frontmatter = excluded.frontmatter,
      tags = excluded.tags,
      note_type = excluded.note_type,
      layer = excluded.layer,
      status = excluded.status,
      source = excluded.source,
      content_hash = excluded.content_hash,
      source_modified_at = excluded.source_modified_at,
      indexed_at = case when public.gaas_vault_notes.content_hash is distinct from excluded.content_hash then now() else public.gaas_vault_notes.indexed_at end,
      deleted_at = null,
      last_sync_run_id = p_sync_run_id;

  delete from public.gaas_vault_links link
  using public.gaas_vault_notes note
  where link.source_note_id = note.id
    and note.vault_key = v_vault_key
    and note.relative_path in (
      select item->>'relative_path' from jsonb_array_elements(coalesce(p_notes, '[]'::jsonb)) item
    );

  insert into public.gaas_vault_links (
    source_note_id, ordinal, raw_target, target_path, fragment, display_text, sync_run_id
  )
  select note.id, link.ordinal, link.raw_target, link.target_path, link.fragment, link.display_text, p_sync_run_id
  from jsonb_to_recordset(coalesce(p_notes, '[]'::jsonb)) as incoming(relative_path text, links jsonb)
  join public.gaas_vault_notes note on note.vault_key = v_vault_key and note.relative_path = incoming.relative_path
  cross join lateral jsonb_to_recordset(coalesce(incoming.links, '[]'::jsonb)) as link(
    ordinal integer, raw_target text, target_path text, fragment text, display_text text
  );

  update public.gaas_vault_sync_runs
  set note_count = note_count + jsonb_array_length(coalesce(p_notes, '[]'::jsonb)),
      changed_count = changed_count + v_changed
  where id = p_sync_run_id;
  return v_changed;
end;
$$;

create or replace function public.gaas_vault_finish_sync(p_sync_run_id uuid)
returns public.gaas_vault_sync_runs
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_vault_key text;
  v_result public.gaas_vault_sync_runs;
  v_deleted integer;
  v_links integer;
begin
  if not public.gaas_vault_is_admin() then
    raise exception 'vault_sync_admin_required' using errcode = '42501';
  end if;

  select run.vault_key into v_vault_key
  from public.gaas_vault_sync_runs run
  where run.id = p_sync_run_id and run.status = 'running';
  if v_vault_key is null then
    raise exception 'vault_sync_run_invalid' using errcode = '22023';
  end if;

  update public.gaas_vault_notes note
  set deleted_at = now()
  where note.vault_key = v_vault_key and note.deleted_at is null and note.last_sync_run_id is distinct from p_sync_run_id;
  get diagnostics v_deleted = row_count;

  update public.gaas_vault_links link
  set target_note_id = target.id
  from public.gaas_vault_notes source, public.gaas_vault_notes target
  where link.source_note_id = source.id
    and source.vault_key = v_vault_key
    and target.vault_key = v_vault_key
    and target.deleted_at is null
    and (
      target.relative_path = link.target_path
      or target.relative_path = link.target_path || '.md'
      or lower(regexp_replace(target.relative_path, '^.*/|\.md$', '', 'g')) = lower(regexp_replace(coalesce(link.target_path, link.raw_target), '^.*/|\.md$', '', 'g'))
    );

  select count(*) into v_links
  from public.gaas_vault_links link
  join public.gaas_vault_notes note on note.id = link.source_note_id
  where note.vault_key = v_vault_key and note.deleted_at is null;

  update public.gaas_vault_sync_runs
  set status = 'completed', completed_at = now(), deleted_count = v_deleted, link_count = v_links
  where id = p_sync_run_id
  returning * into v_result;
  return v_result;
end;
$$;

create or replace function public.gaas_vault_fail_sync(p_sync_run_id uuid, p_error_message text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.gaas_vault_is_admin() then
    raise exception 'vault_sync_admin_required' using errcode = '42501';
  end if;

  update public.gaas_vault_sync_runs
  set status = 'failed', completed_at = now(), error_message = left(coalesce(p_error_message, 'unknown_error'), 1000)
  where id = p_sync_run_id and actor_id = (select auth.uid()) and status = 'running';
end;
$$;

create or replace function public.gaas_search_vault(
  p_query text default '',
  p_folder text default null,
  p_layer text default null,
  p_note_type text default null,
  p_limit integer default 100
)
returns table (
  id uuid,
  relative_path text,
  title text,
  folder text,
  tags text[],
  note_type text,
  layer text,
  status text,
  source text,
  content_markdown text,
  frontmatter jsonb,
  source_modified_at timestamptz,
  indexed_at timestamptz,
  rank real
)
language sql
stable
security invoker
set search_path = ''
as $$
  with input as (
    select case when btrim(coalesce(p_query, '')) = '' then null
      else websearch_to_tsquery('portuguese'::regconfig, p_query) end as query
  )
  select note.id, note.relative_path, note.title, note.folder, note.tags, note.note_type,
    note.layer, note.status, note.source, note.content_markdown, note.frontmatter,
    note.source_modified_at, note.indexed_at,
    case when input.query is null then 0::real else ts_rank(note.search_vector, input.query) end as rank
  from public.gaas_vault_notes note
  cross join input
  where note.deleted_at is null
    and (input.query is null or note.search_vector @@ input.query)
    and (p_folder is null or note.folder = p_folder or note.folder like p_folder || '/%')
    and (p_layer is null or note.layer = p_layer)
    and (p_note_type is null or note.note_type = p_note_type)
  order by rank desc, note.title asc
  limit least(greatest(coalesce(p_limit, 100), 1), 500);
$$;

create or replace view public.gaas_vault_backlinks_v
with (security_invoker = true)
as
select target.id as note_id, source.id as source_note_id, source.title as source_title,
  source.relative_path as source_path, link.fragment, link.display_text
from public.gaas_vault_links link
join public.gaas_vault_notes source on source.id = link.source_note_id and source.deleted_at is null
join public.gaas_vault_notes target on target.id = link.target_note_id and target.deleted_at is null;

revoke all on function public.gaas_vault_is_admin() from public, anon;
revoke all on function public.gaas_vault_notes_search_vector_update() from public, anon, authenticated;
revoke all on function public.gaas_vault_begin_sync(text, text) from public, anon;
revoke all on function public.gaas_vault_upsert_batch(uuid, jsonb) from public, anon;
revoke all on function public.gaas_vault_finish_sync(uuid) from public, anon;
revoke all on function public.gaas_vault_fail_sync(uuid, text) from public, anon;
revoke all on function public.gaas_search_vault(text, text, text, text, integer) from public, anon;
grant execute on function public.gaas_vault_is_admin() to authenticated;
grant execute on function public.gaas_vault_begin_sync(text, text) to authenticated;
grant execute on function public.gaas_vault_upsert_batch(uuid, jsonb) to authenticated;
grant execute on function public.gaas_vault_finish_sync(uuid) to authenticated;
grant execute on function public.gaas_vault_fail_sync(uuid, text) to authenticated;
grant execute on function public.gaas_search_vault(text, text, text, text, integer) to authenticated;
revoke all on public.gaas_vault_backlinks_v from anon, authenticated;
grant select on public.gaas_vault_backlinks_v to authenticated;

comment on table public.gaas_vault_notes is 'Read-only projection of the canonical Obsidian vault for authenticated GaaS users.';
comment on function public.gaas_vault_upsert_batch(uuid, jsonb) is 'Admin-only idempotent batch ingestion. The sync is only finalized by gaas_vault_finish_sync.';
