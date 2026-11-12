-- Módulo estilo Notion (Testes e Tarefas): páginas, blocos, bases, linhas e metadados do espaço do time.
-- O conteúdo segue o formato do notion-clone (MIT) em jsonb. As tarefas continuam em growth_development_tasks;
-- aqui ficam só o corpo das páginas delas e propriedades extras. Leitura para membros aprovados, escrita só
-- pela função nt_sync (membro aprovado), com histórico append-only em nt_events.
begin;

create table public.nt_pages (
  id text primary key check (id ~ '^[A-Za-z0-9_:-]{1,80}$'),
  data jsonb not null check (jsonb_typeof(data) = 'object' and pg_column_size(data) <= 200000),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);
create table public.nt_blocks (
  id text primary key check (id ~ '^[A-Za-z0-9_:-]{1,80}$'),
  page_id text not null check (page_id ~ '^[A-Za-z0-9_:-]{1,80}$'),
  data jsonb not null check (jsonb_typeof(data) = 'object' and pg_column_size(data) <= 200000),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);
create index nt_blocks_page_idx on public.nt_blocks(page_id);
create table public.nt_databases (
  id text primary key check (id ~ '^[A-Za-z0-9_:-]{1,80}$'),
  data jsonb not null check (jsonb_typeof(data) = 'object' and pg_column_size(data) <= 200000),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);
create table public.nt_rows (
  id text primary key check (id ~ '^[A-Za-z0-9_:-]{1,80}$'),
  database_id text not null check (database_id ~ '^[A-Za-z0-9_:-]{1,80}$'),
  data jsonb not null check (jsonb_typeof(data) = 'object' and pg_column_size(data) <= 200000),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);
create index nt_rows_database_idx on public.nt_rows(database_id);
create table public.nt_meta (
  key text primary key check (key ~ '^[a-z0-9_-]{1,40}$'),
  data jsonb not null check (pg_column_size(data) <= 200000),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);
create table public.nt_events (
  id bigint generated always as identity primary key,
  entity text not null check (entity in ('page','block','database','row','meta')),
  entity_id text not null,
  op text not null check (op in ('upsert','delete')),
  actor_id uuid references auth.users(id),
  data jsonb,
  created_at timestamptz not null default now()
);
create index nt_events_entity_idx on public.nt_events(entity, entity_id, id desc);

do $$
declare t text;
begin
  foreach t in array array['nt_pages','nt_blocks','nt_databases','nt_rows','nt_meta','nt_events'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from public, anon, authenticated', t);
    execute format('grant select on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('create policy %I on public.%I for select to authenticated using ((select gaas_security.is_approved_member()))', t || '_read', t);
    execute format('create policy gaas_approved_member_gate on public.%I as restrictive for all to anon, authenticated using ((select gaas_security.is_approved_member())) with check ((select gaas_security.is_approved_member()))', t);
  end loop;
end $$;

-- Aplica um lote de alterações do espaço: {pages|blocks|databases|rows|meta: [...]} em upserts e listas de ids em deletes.
create function public.nt_sync(p_upserts jsonb, p_deletes jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); x jsonb; k text; n integer := 0;
begin
  if uid is null or not gaas_security.is_approved_member() then raise exception 'nt_access_denied' using errcode = '42501'; end if;
  p_upserts := coalesce(p_upserts, '{}'::jsonb); p_deletes := coalesce(p_deletes, '{}'::jsonb);
  if jsonb_typeof(p_upserts) <> 'object' or jsonb_typeof(p_deletes) <> 'object' then raise exception 'nt_invalid_batch'; end if;
  if (select coalesce(sum(jsonb_array_length(v)), 0) from jsonb_each(p_upserts) e(k2, v) where jsonb_typeof(v) = 'array')
   + (select coalesce(sum(jsonb_array_length(v)), 0) from jsonb_each(p_deletes) e(k2, v) where jsonb_typeof(v) = 'array') > 800 then
    raise exception 'nt_batch_too_large';
  end if;
  for x in select * from jsonb_array_elements(coalesce(p_upserts->'pages', '[]')) loop
    insert into public.nt_pages(id, data, updated_by) values (x->>'id', x->'data', uid)
    on conflict (id) do update set data = excluded.data, updated_at = clock_timestamp(), updated_by = uid;
    insert into public.nt_events(entity, entity_id, op, actor_id, data) values ('page', x->>'id', 'upsert', uid, x->'data'); n := n + 1;
  end loop;
  for x in select * from jsonb_array_elements(coalesce(p_upserts->'blocks', '[]')) loop
    insert into public.nt_blocks(id, page_id, data, updated_by) values (x->>'id', x->>'page_id', x->'data', uid)
    on conflict (id) do update set page_id = excluded.page_id, data = excluded.data, updated_at = clock_timestamp(), updated_by = uid;
    insert into public.nt_events(entity, entity_id, op, actor_id, data) values ('block', x->>'id', 'upsert', uid, x->'data'); n := n + 1;
  end loop;
  for x in select * from jsonb_array_elements(coalesce(p_upserts->'databases', '[]')) loop
    insert into public.nt_databases(id, data, updated_by) values (x->>'id', x->'data', uid)
    on conflict (id) do update set data = excluded.data, updated_at = clock_timestamp(), updated_by = uid;
    insert into public.nt_events(entity, entity_id, op, actor_id, data) values ('database', x->>'id', 'upsert', uid, x->'data'); n := n + 1;
  end loop;
  for x in select * from jsonb_array_elements(coalesce(p_upserts->'rows', '[]')) loop
    insert into public.nt_rows(id, database_id, data, updated_by) values (x->>'id', x->>'database_id', x->'data', uid)
    on conflict (id) do update set database_id = excluded.database_id, data = excluded.data, updated_at = clock_timestamp(), updated_by = uid;
    insert into public.nt_events(entity, entity_id, op, actor_id, data) values ('row', x->>'id', 'upsert', uid, x->'data'); n := n + 1;
  end loop;
  for x in select * from jsonb_array_elements(coalesce(p_upserts->'meta', '[]')) loop
    insert into public.nt_meta(key, data, updated_by) values (x->>'key', x->'data', uid)
    on conflict (key) do update set data = excluded.data, updated_at = clock_timestamp(), updated_by = uid;
    insert into public.nt_events(entity, entity_id, op, actor_id, data) values ('meta', x->>'key', 'upsert', uid, x->'data'); n := n + 1;
  end loop;
  for k in select jsonb_array_elements_text(coalesce(p_deletes->'pages', '[]')) loop
    insert into public.nt_events(entity, entity_id, op, actor_id, data) select 'page', k, 'delete', uid, data from public.nt_pages where id = k;
    delete from public.nt_pages where id = k; n := n + 1;
  end loop;
  for k in select jsonb_array_elements_text(coalesce(p_deletes->'blocks', '[]')) loop
    insert into public.nt_events(entity, entity_id, op, actor_id, data) select 'block', k, 'delete', uid, data from public.nt_blocks where id = k;
    delete from public.nt_blocks where id = k; n := n + 1;
  end loop;
  for k in select jsonb_array_elements_text(coalesce(p_deletes->'databases', '[]')) loop
    insert into public.nt_events(entity, entity_id, op, actor_id, data) select 'database', k, 'delete', uid, data from public.nt_databases where id = k;
    delete from public.nt_databases where id = k; n := n + 1;
  end loop;
  for k in select jsonb_array_elements_text(coalesce(p_deletes->'rows', '[]')) loop
    insert into public.nt_events(entity, entity_id, op, actor_id, data) select 'row', k, 'delete', uid, data from public.nt_rows where id = k;
    delete from public.nt_rows where id = k; n := n + 1;
  end loop;
  return jsonb_build_object('applied', n, 'at', clock_timestamp());
end $$;

revoke all on function public.nt_sync(jsonb, jsonb) from public, anon;
grant execute on function public.nt_sync(jsonb, jsonb) to authenticated, service_role;

-- Pessoas: profiles.full_name está vazio para o time; o nome de exibição passa a vir da parte do e-mail antes do "@"
-- (nome.sobrenome vira "Nome Sobrenome"). O e-mail continua sem sair do banco. Vale também para a Visão Daily.
create or replace function public.gaas_daily_people() returns table (id uuid, name text)
language plpgsql stable security definer set search_path = '' as $$
begin
  perform public.gaas_daily_require_member();
  return query
    select m.user_id, coalesce(
      nullif(trim(p.full_name), ''),
      nullif(initcap(trim(regexp_replace(regexp_replace(split_part(u.email, '@', 1), '[0-9]+', '', 'g'), '[._-]+', ' ', 'g'))), ''),
      'Membro ' || left(m.user_id::text, 4))
    from gaas_security.approved_members m
    left join public.profiles p on p.id = m.user_id
    left join auth.users u on u.id = m.user_id
    where m.enabled order by 2;
end $$;
revoke all on function public.gaas_daily_people() from public, anon;
grant execute on function public.gaas_daily_people() to authenticated, service_role;

commit;
