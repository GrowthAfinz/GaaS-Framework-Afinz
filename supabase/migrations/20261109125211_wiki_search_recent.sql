-- Wiki search: strategies first, then subjects and notes, newest update first.
-- Also makes the search accent-insensitive and prefix-aware (typing "estrat" finds "Estratégia").
-- The legacy searches keep their signatures and order; they only switch to the same accent-free
-- configuration so the front that is still deployed keeps matching.

create extension if not exists unaccent with schema extensions;

do $$
begin
  if not exists (
    select 1 from pg_ts_config config join pg_namespace ns on ns.oid = config.cfgnamespace
    where ns.nspname = 'public' and config.cfgname = 'gaas_portuguese_unaccent'
  ) then
    create text search configuration public.gaas_portuguese_unaccent (copy = pg_catalog.portuguese);
    alter text search configuration public.gaas_portuguese_unaccent
      alter mapping for hword, hword_part, word with extensions.unaccent, pg_catalog.portuguese_stem;
  end if;
end;
$$;

-- One place builds the search document, used by the trigger and by the backfill below.
create or replace function public.gaas_vault_search_document(
  p_title text,
  p_aliases text[],
  p_tags text[],
  p_content text
)
returns tsvector
language sql
stable
set search_path = ''
as $$
  select
    setweight(to_tsvector('public.gaas_portuguese_unaccent'::regconfig, coalesce(p_title, '')), 'A') ||
    setweight(to_tsvector('public.gaas_portuguese_unaccent'::regconfig, coalesce(array_to_string(p_aliases, ' '), '')), 'A') ||
    setweight(to_tsvector('public.gaas_portuguese_unaccent'::regconfig, coalesce(array_to_string(p_tags, ' '), '')), 'B') ||
    setweight(to_tsvector('public.gaas_portuguese_unaccent'::regconfig, coalesce(p_content, '')), 'C');
$$;

create or replace function public.gaas_vault_notes_search_vector_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.search_vector := public.gaas_vault_search_document(new.title, new.aliases, new.tags, new.content_markdown);
  return new;
end;
$$;

update public.gaas_vault_notes
set search_vector = public.gaas_vault_search_document(title, aliases, tags, content_markdown);

create or replace function public.gaas_search_vault(
  p_query text default '',
  p_folder text default null,
  p_layer text default null,
  p_note_type text default null,
  p_limit integer default 100
)
returns table (
  id uuid, relative_path text, title text, folder text, tags text[], note_type text,
  layer text, status text, source text, content_markdown text, frontmatter jsonb,
  source_modified_at timestamptz, indexed_at timestamptz, rank real
)
language sql
stable
set search_path = ''
as $$
  with input as (
    select case when btrim(coalesce(p_query, '')) = '' then null
      else websearch_to_tsquery('public.gaas_portuguese_unaccent'::regconfig, p_query) end as query
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

-- The legacy reader search must read the vectors with the same configuration, otherwise
-- accented queries stop matching while the old front is still deployed.
create or replace function public.gaas_search_vault_index(
  p_query text default '',
  p_folder text default null,
  p_layer text default null,
  p_note_type text default null,
  p_limit integer default 60,
  p_offset integer default 0
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
  source_modified_at timestamptz,
  indexed_at timestamptz,
  rank real,
  total_count integer
)
language sql
stable
security invoker
set search_path = ''
as $$
  with input as (
    select case when btrim(coalesce(p_query, '')) = '' then null
      else websearch_to_tsquery('public.gaas_portuguese_unaccent'::regconfig, p_query) end as query
  ), filtered as materialized (
    select note.id, note.relative_path, note.title, note.folder, note.tags,
      note.note_type, note.layer, note.status, note.source,
      note.source_modified_at, note.indexed_at,
      case when input.query is null then 0::real else ts_rank(note.search_vector, input.query) end as rank
    from public.gaas_vault_notes note
    cross join input
    where note.deleted_at is null
      and (input.query is null or note.search_vector @@ input.query)
      and (p_folder is null or note.folder = p_folder or note.folder like p_folder || '/%')
      and (p_layer is null or note.layer = p_layer)
      and (p_note_type is null or note.note_type = p_note_type)
  )
  select filtered.id, filtered.relative_path, filtered.title, filtered.folder,
    filtered.tags, filtered.note_type, filtered.layer, filtered.status,
    filtered.source, filtered.source_modified_at, filtered.indexed_at,
    filtered.rank, count(*) over ()::integer as total_count
  from filtered
  order by filtered.rank desc, filtered.title asc
  limit least(greatest(coalesce(p_limit, 60), 1), 100)
  offset greatest(coalesce(p_offset, 0), 0);
$$;

-- "Last update" of a note: the curated frontmatter date (atualizado), falling back to the file date.
-- Frontmatter arrives as "2026-11-05" or "2026-11-05T00:00:00.000Z"; anything unparseable falls back.
create or replace function public.gaas_vault_note_updated_on(p_frontmatter jsonb, p_fallback timestamptz)
returns date
language plpgsql
stable
set search_path = ''
as $$
declare
  raw text := btrim(coalesce(p_frontmatter ->> 'atualizado', p_frontmatter ->> 'updated', ''), ' ''"');
begin
  if raw ~ '^\d{4}-\d{2}-\d{2}' then
    return left(raw, 10)::date;
  end if;
  return p_fallback::date;
exception when others then
  return p_fallback::date;
end;
$$;

-- Typed words become prefix terms joined by AND, accent-insensitive: "pool vi" -> pool:* & vi:*.
create or replace function public.gaas_wiki_search_query(p_query text)
returns tsquery
language sql
stable
set search_path = ''
as $$
  select case when count(term) = 0 then null
    else to_tsquery('public.gaas_portuguese_unaccent'::regconfig, string_agg(quote_literal(term) || ':*', ' & ' order by position))
  end
  from regexp_split_to_table(lower(extensions.unaccent(coalesce(p_query, ''))), '[^[:alnum:]]+') with ordinality as words(term, position)
  where term <> '';
$$;

create or replace function public.gaas_search_wiki(
  p_query text default '',
  p_folder text default null,
  p_limit integer default 60,
  p_offset integer default 0,
  p_sort text default 'recent'
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
  source_modified_at timestamptz,
  indexed_at timestamptz,
  updated_on date,
  kind text,
  rank real,
  total_count integer
)
language sql
stable
security invoker
set search_path = ''
as $$
  with input as (
    select public.gaas_wiki_search_query(p_query) as query
  ), filtered as materialized (
    select note.id, note.relative_path, note.title, note.folder, note.tags,
      note.note_type, note.layer, note.status, note.source,
      note.source_modified_at, note.indexed_at,
      public.gaas_vault_note_updated_on(note.frontmatter, note.source_modified_at) as updated_on,
      case when note.relative_path like '05-Estrategia/%' then 'estrategia' else 'nota' end as kind,
      case when input.query is null then 0::real else ts_rank(note.search_vector, input.query) end as rank
    from public.gaas_vault_notes note
    cross join input
    where note.deleted_at is null
      and (btrim(coalesce(p_query, '')) = '' or (input.query is not null and note.search_vector @@ input.query))
      and (p_folder is null or note.folder = p_folder or note.folder like p_folder || '/%')
  )
  select filtered.id, filtered.relative_path, filtered.title, filtered.folder,
    filtered.tags, filtered.note_type, filtered.layer, filtered.status,
    filtered.source, filtered.source_modified_at, filtered.indexed_at,
    filtered.updated_on, filtered.kind,
    filtered.rank, count(*) over ()::integer as total_count
  from filtered
  order by
    case when p_sort = 'relevance' then 0 when filtered.kind = 'estrategia' then 0 else 1 end,
    case when p_sort = 'relevance' then null else filtered.updated_on end desc nulls last,
    filtered.rank desc,
    filtered.title asc
  limit least(greatest(coalesce(p_limit, 60), 1), 100)
  offset greatest(coalesce(p_offset, 0), 0);
$$;

revoke all on function public.gaas_search_wiki(text, text, integer, integer, text) from public, anon;
grant execute on function public.gaas_search_wiki(text, text, integer, integer, text) to authenticated;
revoke all on function public.gaas_wiki_search_query(text) from public, anon;
grant execute on function public.gaas_wiki_search_query(text) to authenticated;
revoke all on function public.gaas_vault_note_updated_on(jsonb, timestamptz) from public, anon;
grant execute on function public.gaas_vault_note_updated_on(jsonb, timestamptz) to authenticated;
revoke all on function public.gaas_vault_search_document(text, text[], text[], text) from public, anon;
grant execute on function public.gaas_vault_search_document(text, text[], text[], text) to authenticated;

comment on function public.gaas_search_wiki(text, text, integer, integer, text)
  is 'Wiki search for the header and the Wiki bar: strategies first, then subjects and notes, newest frontmatter "atualizado" first. Accent-insensitive prefix match. p_sort = relevance keeps the old ranking.';
