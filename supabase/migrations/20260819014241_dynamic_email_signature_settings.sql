create table if not exists public.dynamic_email_signature_settings (
  partner text not null,
  signature_key text not null,
  signature_label text not null,
  status text not null default 'active' check (status in ('active', 'inactive')),
  effective_from date,
  updated_by uuid references auth.users(id) on delete set null default auth.uid(),
  updated_at timestamptz not null default now(),
  primary key (partner, signature_key)
);

insert into public.dynamic_email_signature_settings (partner, signature_key, signature_label, status)
values
  ('Plurix', 'AMIGAO', 'Amigão', 'active'),
  ('Plurix', 'BOA', 'Boa', 'active'),
  ('Plurix', 'AVENIDA', 'Avenida', 'active'),
  ('Plurix', 'COMPRE MAIS', 'Compre Mais', 'active'),
  ('Plurix', 'PARANA', 'Paraná', 'active'),
  ('Plurix', 'SUPERPAO', 'Superpão', 'active')
on conflict (partner, signature_key) do nothing;

grant select, insert, update on public.dynamic_email_signature_settings to authenticated;
alter table public.dynamic_email_signature_settings enable row level security;

create policy "authenticated read email signature settings"
  on public.dynamic_email_signature_settings for select to authenticated
  using ((select auth.uid()) is not null);

create policy "authenticated create email signature settings"
  on public.dynamic_email_signature_settings for insert to authenticated
  with check ((select auth.uid()) is not null and updated_by = (select auth.uid()));

create policy "authenticated update email signature settings"
  on public.dynamic_email_signature_settings for update to authenticated
  using ((select auth.uid()) is not null)
  with check ((select auth.uid()) is not null and updated_by = (select auth.uid()));

comment on table public.dynamic_email_signature_settings is
  'Governança das assinaturas disponíveis para novos e-mails; desativação preserva briefing e versões históricas.';
