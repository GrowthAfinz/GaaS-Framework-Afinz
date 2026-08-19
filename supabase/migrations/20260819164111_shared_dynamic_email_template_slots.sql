create table if not exists public.dynamic_email_template_slots (
  id text primary key,
  name text not null,
  source text not null,
  is_principal boolean not null default false,
  status text not null default 'active' check (status in ('active', 'archived')),
  version integer not null default 1 check (version > 0),
  created_by uuid default auth.uid(),
  updated_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists dynamic_email_template_slots_one_principal
  on public.dynamic_email_template_slots (is_principal)
  where is_principal and status = 'active';

alter table public.dynamic_email_template_slots enable row level security;

grant select, insert, update, delete on public.dynamic_email_template_slots to authenticated;

create policy "Authenticated users read shared email templates"
  on public.dynamic_email_template_slots for select to authenticated
  using ((select auth.uid()) is not null);

create policy "Authenticated users create shared email templates"
  on public.dynamic_email_template_slots for insert to authenticated
  with check ((select auth.uid()) is not null);

create policy "Authenticated users update shared email templates"
  on public.dynamic_email_template_slots for update to authenticated
  using ((select auth.uid()) is not null)
  with check ((select auth.uid()) is not null);

create policy "Authenticated users delete shared email templates"
  on public.dynamic_email_template_slots for delete to authenticated
  using ((select auth.uid()) is not null);

create or replace function public.set_dynamic_email_principal(slot_id text)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.dynamic_email_template_slots
    where id = slot_id and status = 'active'
  ) then
    raise exception 'Template slot not found';
  end if;

  update public.dynamic_email_template_slots
  set is_principal = false, updated_at = now(), updated_by = auth.uid()
  where is_principal;

  update public.dynamic_email_template_slots
  set is_principal = true, updated_at = now(), updated_by = auth.uid()
  where id = slot_id and status = 'active';
end;
$$;

revoke all on function public.set_dynamic_email_principal(text) from public, anon;
grant execute on function public.set_dynamic_email_principal(text) to authenticated;
