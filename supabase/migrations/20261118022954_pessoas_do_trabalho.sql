-- Pessoas do trabalho: responsável e seguidores podem ser só um nome, sem conta no GaaS
-- (decisão do Pablo em 17/11/2026). Quem tem conta continua sendo identificado pela conta.
-- Quando a pessoa ganha conta, gaas_work_link_person troca o nome pela conta em todo lugar.
begin;

create table public.work_people (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 2 and 80),
  member_id uuid unique references auth.users(id),
  archived boolean not null default false,
  revision integer not null default 1,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index work_people_active_name on public.work_people (lower(trim(name))) where not archived and member_id is null;

alter table public.work_people enable row level security;
revoke all on public.work_people from public, anon, authenticated;
grant select on public.work_people to authenticated;
grant all on public.work_people to service_role;
create policy work_people_read on public.work_people for select to authenticated using ((select gaas_security.is_approved_member()));
create policy gaas_approved_member_gate on public.work_people as restrictive for all to anon, authenticated
  using ((select gaas_security.is_approved_member())) with check ((select gaas_security.is_approved_member()));

/** Nome de exibição de quem tem conta (mesma regra de gaas_daily_people). */
create or replace function public.gaas_member_display_name(p_user uuid) returns text
language sql stable security definer set search_path to '' as $$
  select coalesce(
    nullif(trim(p.full_name), ''),
    nullif(initcap(trim(regexp_replace(regexp_replace(split_part(u.email, '@', 1), '[0-9]+', '', 'g'), '[._-]+', ' ', 'g'))), ''),
    'Membro ' || left(p_user::text, 4))
  from auth.users u left join public.profiles p on p.id = u.id where u.id = p_user;
$$;
revoke all on function public.gaas_member_display_name(uuid) from public, anon, authenticated;

/** Pessoa válida para responsável/seguidor: conta existente ou pessoa só com nome. */
create or replace function public.gaas_person_exists(p_id uuid) returns boolean
language sql stable security definer set search_path to '' as $$
  select exists (select 1 from auth.users u where u.id = p_id)
      or exists (select 1 from public.work_people w where w.id = p_id and w.member_id is null);
$$;
revoke all on function public.gaas_person_exists(uuid) from public, anon;
grant execute on function public.gaas_person_exists(uuid) to authenticated, service_role;

/** Lista única de pessoas: membros aprovados (com conta) e pessoas só com nome. */
create or replace function public.gaas_work_people()
returns table (id uuid, name text, has_account boolean)
language plpgsql stable security definer set search_path to '' as $$
begin
  perform public.gaas_daily_require_member();
  return query
    select m.user_id, public.gaas_member_display_name(m.user_id), true
      from gaas_security.approved_members m where m.enabled
    union all
    select w.id, trim(w.name), false
      from public.work_people w where not w.archived and w.member_id is null
    order by 2;
end $$;
revoke all on function public.gaas_work_people() from public, anon;
grant execute on function public.gaas_work_people() to authenticated, service_role;

-- A Daily e o módulo de Tarefas já leem gaas_daily_people: ela passa a trazer também as pessoas só com nome.
create or replace function public.gaas_daily_people()
returns table (id uuid, name text)
language plpgsql stable security definer set search_path to '' as $$
begin
  return query select p.id, p.name from public.gaas_work_people() p;
end $$;

/** Cria, renomeia ou arquiva uma pessoa só com nome. */
create or replace function public.gaas_work_save_person(p_id uuid, p_revision integer, p_body jsonb)
returns jsonb language plpgsql security definer set search_path to '' as $$
declare uid uuid := public.gaas_daily_require_member(); n public.work_people;
begin
  if p_body is null or jsonb_typeof(p_body) <> 'object' then raise exception 'person_invalid_body'; end if;
  if p_id is not null then
    select * into n from public.work_people where id = p_id for update;
    if not found then raise exception 'person_not_found'; end if;
    if n.revision is distinct from p_revision then raise exception 'person_revision_conflict'; end if;
    if n.member_id is not null then raise exception 'person_has_account'; end if;
  else
    n.id := gen_random_uuid(); n.revision := 0; n.archived := false; n.created_by := uid; n.created_at := now();
  end if;
  if p_body ? 'name' then n.name := regexp_replace(trim(p_body->>'name'), '\s+', ' ', 'g'); end if;
  if p_body ? 'archived' then n.archived := (p_body->>'archived')::boolean; end if;
  if coalesce(length(n.name), 0) < 2 or length(n.name) > 80 then raise exception 'person_name_required'; end if;
  if not n.archived and (
       exists (select 1 from public.work_people w where w.id <> n.id and not w.archived and w.member_id is null and lower(trim(w.name)) = lower(n.name))
    or exists (select 1 from gaas_security.approved_members m where m.enabled and lower(public.gaas_member_display_name(m.user_id)) = lower(n.name))) then
    raise exception 'person_name_taken';
  end if;
  n.revision := n.revision + 1; n.updated_at := clock_timestamp();
  if p_id is null then insert into public.work_people select (n).*;
  else update public.work_people set name = n.name, archived = n.archived, revision = n.revision, updated_at = n.updated_at where id = n.id; end if;
  return jsonb_build_object('id', n.id, 'name', n.name, 'has_account', false, 'archived', n.archived, 'revision', n.revision);
end $$;
revoke all on function public.gaas_work_save_person(uuid, integer, jsonb) from public, anon;
grant execute on function public.gaas_work_save_person(uuid, integer, jsonb) to authenticated, service_role;

/**
 * Liga a pessoa só com nome a uma conta: registros da Daily passam a apontar para a conta e as
 * Tarefas passam a mostrar o nome da conta. A pessoa fica guardada como ligada (não é apagada).
 */
create or replace function public.gaas_work_link_person(p_person uuid, p_member uuid)
returns jsonb language plpgsql security definer set search_path to '' as $$
declare uid uuid := public.gaas_daily_require_member(); w public.work_people; member_name text; moved integer; renamed integer;
begin
  select * into w from public.work_people where id = p_person for update;
  if not found or w.member_id is not null then raise exception 'person_not_found'; end if;
  if not exists (select 1 from gaas_security.approved_members m where m.user_id = p_member and m.enabled) then raise exception 'person_member_invalid'; end if;
  member_name := public.gaas_member_display_name(p_member);
  update public.daily_entries e
     set responsible_id = case when e.responsible_id = p_person then p_member else e.responsible_id end,
         follower_ids = array(select distinct case when f = p_person then p_member else f end from unnest(e.follower_ids) f order by 1),
         revision = e.revision + 1, updated_at = clock_timestamp()
   where e.responsible_id = p_person or p_person = any(e.follower_ids);
  get diagnostics moved = row_count;
  update public.growth_development_tasks t
     set owner_label = member_name, revision = t.revision + 1, updated_at = clock_timestamp()
   where lower(trim(t.owner_label)) = lower(trim(w.name));
  get diagnostics renamed = row_count;
  update public.work_people set member_id = p_member, revision = revision + 1, updated_at = clock_timestamp() where id = p_person;
  return jsonb_build_object('person', p_person, 'member', p_member, 'daily_entries', moved, 'tasks', renamed);
end $$;
revoke all on function public.gaas_work_link_person(uuid, uuid) from public, anon;
grant execute on function public.gaas_work_link_person(uuid, uuid) to authenticated, service_role;

-- Daily: responsável e seguidores aceitam pessoa só com nome.
alter table public.daily_entries drop constraint if exists daily_entries_responsible_id_fkey;
do $$
declare
  d text := pg_get_functiondef('public.gaas_daily_save_entry(uuid,integer,jsonb)'::regprocedure);
begin
  d := replace(d, 'not exists (select 1 from auth.users u where u.id = n.responsible_id)', 'not public.gaas_person_exists(n.responsible_id)');
  d := replace(d, 'not exists (select 1 from auth.users u where u.id = f)', 'not public.gaas_person_exists(f)');
  if position('gaas_person_exists(n.responsible_id)' in d) = 0 or position('gaas_person_exists(f)' in d) = 0 then
    raise exception 'daily_save_entry_person_check_not_found';
  end if;
  execute d;
end $$;

commit;
