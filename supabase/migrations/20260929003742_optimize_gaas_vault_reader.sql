-- Keep the Vault browser responsive by separating lightweight discovery from
-- the full Markdown document. Both functions remain SECURITY INVOKER so the
-- existing authenticated-only RLS policy on gaas_vault_notes still applies.

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
      else websearch_to_tsquery('portuguese'::regconfig, p_query) end as query
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

create or replace function public.gaas_vault_folder_facets()
returns table (
  folder text,
  note_count integer
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    case when note.folder = '' then '' else split_part(note.folder, '/', 1) end as folder,
    count(*)::integer as note_count
  from public.gaas_vault_notes note
  where note.deleted_at is null
  group by 1
  order by 1;
$$;

revoke all on function public.gaas_search_vault_index(text, text, text, text, integer, integer) from public, anon;
revoke all on function public.gaas_vault_folder_facets() from public, anon;
grant execute on function public.gaas_search_vault_index(text, text, text, text, integer, integer) to authenticated;
grant execute on function public.gaas_vault_folder_facets() to authenticated;

comment on function public.gaas_search_vault_index(text, text, text, text, integer, integer)
  is 'Paginated metadata-only Vault search. Full Markdown is loaded only for the selected note.';
comment on function public.gaas_vault_folder_facets()
  is 'Top-level Vault folder counts for the authenticated library browser.';
