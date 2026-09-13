-- Team access for the single live Report Live workspace. Authenticated users
-- remain readers by default; explicit memberships grant generation, publication
-- or administration and can also disable access for one account.

create table if not exists public.report_live_memberships (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null,
  active boolean not null default true,
  granted_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint report_live_memberships_role_check
    check (role in ('viewer','analyst','publisher','admin'))
);

create unique index if not exists report_live_memberships_email_idx
  on public.report_live_memberships(lower(email));

create table if not exists public.report_live_membership_audit (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  email text not null,
  previous_role text,
  new_role text not null,
  previous_active boolean,
  new_active boolean not null,
  created_at timestamptz not null default now()
);

alter table public.report_runs
  add column if not exists requested_by uuid references auth.users(id) on delete set null;

alter table public.report_live_memberships enable row level security;
alter table public.report_live_membership_audit enable row level security;

drop policy if exists report_live_memberships_read_self on public.report_live_memberships;
create policy report_live_memberships_read_self
  on public.report_live_memberships
  for select
  to authenticated
  using (auth.uid() = user_id);

revoke all on table public.report_live_memberships from public, anon, authenticated;
grant select on table public.report_live_memberships to authenticated;
grant all on table public.report_live_memberships to service_role;

revoke all on table public.report_live_membership_audit from public, anon, authenticated;
grant all on table public.report_live_membership_audit to service_role;
grant usage, select on sequence public.report_live_membership_audit_id_seq to service_role;

-- Preserve existing operators during the transition. Pablo becomes the first
-- administrator so that subsequent access can be managed through the product.
insert into public.report_live_memberships(user_id,email,role,active,granted_by)
select
  id,
  lower(email),
  case
    when lower(email) = 'pablo.castro@afinz.com.br' then 'admin'
    when raw_app_meta_data ->> 'report_live_role' = 'admin' then 'admin'
    else 'publisher'
  end,
  true,
  id
from auth.users
where email is not null
  and (
    lower(email) = 'pablo.castro@afinz.com.br'
    or raw_app_meta_data ->> 'report_live_role' in ('operator','admin')
  )
on conflict (user_id) do update
set email = excluded.email,
    role = excluded.role,
    active = true,
    updated_at = now();

create or replace function public.report_live_set_member(
  p_actor_id uuid,
  p_user_id uuid,
  p_email text,
  p_role text,
  p_active boolean
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  previous public.report_live_memberships%rowtype;
begin
  if not exists (
    select 1 from public.report_live_memberships
    where user_id = p_actor_id and role = 'admin' and active
  ) then raise exception 'Administrador ativo obrigatório'; end if;
  if p_role not in ('viewer','analyst','publisher','admin') then
    raise exception 'Papel inválido';
  end if;
  if p_actor_id = p_user_id and (not p_active or p_role <> 'admin') then
    raise exception 'O administrador não pode remover o próprio acesso';
  end if;

  select * into previous
  from public.report_live_memberships
  where user_id = p_user_id
  for update;

  insert into public.report_live_memberships(user_id,email,role,active,granted_by)
  values (p_user_id,lower(p_email),p_role,p_active,p_actor_id)
  on conflict (user_id) do update
  set email=excluded.email,
      role=excluded.role,
      active=excluded.active,
      granted_by=excluded.granted_by,
      updated_at=now();

  insert into public.report_live_membership_audit(
    actor_id,user_id,email,previous_role,new_role,previous_active,new_active
  ) values (
    p_actor_id,p_user_id,lower(p_email),previous.role,p_role,previous.active,p_active
  );

  return jsonb_build_object(
    'user_id',p_user_id,'email',lower(p_email),'role',p_role,'active',p_active
  );
end;
$$;

revoke all on function public.report_live_set_member(uuid,uuid,text,text,boolean)
  from public, anon, authenticated;
grant execute on function public.report_live_set_member(uuid,uuid,text,text,boolean)
  to service_role;

-- Carry the worker credential in a standard bearer header as well as the
-- private custom header. The Edge Function only accepts the bearer after
-- validating its 64-character value against Vault.
create or replace function public.report_live_dispatch_scheduled_worker()
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  token text;
  request_id bigint;
begin
  select decrypted_secret
    into strict token
  from vault.decrypted_secrets
  where name = 'report_live_worker_token';

  select net.http_post(
    url := 'https://mipiwxadnpwtcgfcedym.supabase.co/functions/v1/report-sync',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || token,
      'x-report-worker-token', token
    ),
    body := '{"mode":"worker"}'::jsonb,
    timeout_milliseconds := 240000
  ) into request_id;

  return request_id;
end;
$$;

revoke all on function public.report_live_dispatch_scheduled_worker() from public, anon, authenticated;
grant execute on function public.report_live_dispatch_scheduled_worker() to service_role;

comment on table public.report_live_memberships is
  'Human access to the single Report Live workspace; absent authenticated users are read-only viewers.';
comment on table public.report_live_membership_audit is
  'Append-only audit trail for Report Live membership changes.';
comment on function public.report_live_dispatch_scheduled_worker() is
  'Internal pg_cron dispatcher with redundant transport for one lease-protected Report Live worker step.';
comment on function public.report_live_set_member(uuid,uuid,text,text,boolean) is
  'Atomically changes one Report Live membership and appends its audit event.';
