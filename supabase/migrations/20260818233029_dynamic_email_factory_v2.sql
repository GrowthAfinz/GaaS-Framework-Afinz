-- Fábrica de E-mails V2: metadados e auditoria. Imagens permanecem no Salesforce.
create table if not exists public.dynamic_email_briefings (
  id uuid primary key default gen_random_uuid(),
  briefing_data jsonb not null default '{}'::jsonb,
  partner text,
  segment text,
  subgroup text,
  week_key text,
  activity_names text[] not null default '{}',
  campaign_group_id uuid,
  status text not null default 'draft' check (status in ('draft','needs_review','ready','exported','test_pending','certified','archived')),
  version integer not null default 1 check (version > 0),
  journey_confirmed boolean not null default false,
  acknowledged_missing_activity boolean not null default false,
  legal_override boolean not null default false,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  updated_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists dynamic_email_briefings_tree_idx
  on public.dynamic_email_briefings (partner, segment, subgroup, week_key);
create index if not exists dynamic_email_briefings_group_idx
  on public.dynamic_email_briefings (campaign_group_id);

create table if not exists public.dynamic_email_briefing_versions (
  id bigint generated always as identity primary key,
  briefing_id uuid not null references public.dynamic_email_briefings(id) on delete cascade,
  version integer not null,
  snapshot jsonb not null,
  change_summary text,
  warnings jsonb not null default '[]'::jsonb,
  saved_by uuid references auth.users(id) on delete set null default auth.uid(),
  saved_at timestamptz not null default now(),
  unique (briefing_id, version)
);

create table if not exists public.dynamic_email_assets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  external_url text not null check (external_url ~ '^https://'),
  click_url text,
  slot text not null check (slot in ('header','banner_1','banner_2','banner_3','signature','generic')),
  bu text,
  partner text,
  segment text,
  subgroup text,
  product text,
  alt_text text,
  width integer,
  height integer,
  tags text[] not null default '{}',
  status text not null default 'ready' check (status in ('draft','ready','archived')),
  version integer not null default 1 check (version > 0),
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  updated_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (external_url)
);

create index if not exists dynamic_email_assets_context_idx
  on public.dynamic_email_assets (slot, bu, partner, subgroup, status);

create table if not exists public.dynamic_email_legal_texts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  legal_text text not null,
  color text not null default '#777777',
  font_size text not null default '11',
  bu text,
  partner text,
  campaign_type text,
  status text not null default 'draft' check (status in ('draft','approved','archived')),
  version integer not null default 1 check (version > 0),
  notes text,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  updated_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.dynamic_email_export_runs (
  id uuid primary key default gen_random_uuid(),
  filename text not null,
  briefing_versions jsonb not null,
  warnings jsonb not null default '[]'::jsonb,
  file_hash text,
  exported_by uuid references auth.users(id) on delete set null default auth.uid(),
  exported_at timestamptz not null default now()
);

grant select, insert, update, delete on public.dynamic_email_briefings to authenticated;
grant select, insert on public.dynamic_email_briefing_versions to authenticated;
grant usage, select on sequence public.dynamic_email_briefing_versions_id_seq to authenticated;
grant select, insert, update, delete on public.dynamic_email_assets to authenticated;
grant select, insert, update, delete on public.dynamic_email_legal_texts to authenticated;
grant select, insert on public.dynamic_email_export_runs to authenticated;

alter table public.dynamic_email_briefings enable row level security;
alter table public.dynamic_email_briefing_versions enable row level security;
alter table public.dynamic_email_assets enable row level security;
alter table public.dynamic_email_legal_texts enable row level security;
alter table public.dynamic_email_export_runs enable row level security;

create policy "authenticated read email briefings" on public.dynamic_email_briefings
  for select to authenticated using ((select auth.uid()) is not null);
create policy "authenticated create email briefings" on public.dynamic_email_briefings
  for insert to authenticated with check ((select auth.uid()) is not null and created_by = (select auth.uid()));
create policy "authenticated update email briefings" on public.dynamic_email_briefings
  for update to authenticated using ((select auth.uid()) is not null)
  with check ((select auth.uid()) is not null and updated_by = (select auth.uid()));
create policy "authenticated archive email briefings" on public.dynamic_email_briefings
  for delete to authenticated using ((select auth.uid()) is not null);

create policy "authenticated read email versions" on public.dynamic_email_briefing_versions
  for select to authenticated using ((select auth.uid()) is not null);
create policy "authenticated append email versions" on public.dynamic_email_briefing_versions
  for insert to authenticated with check ((select auth.uid()) is not null and saved_by = (select auth.uid()));

create policy "authenticated read email assets" on public.dynamic_email_assets
  for select to authenticated using ((select auth.uid()) is not null);
create policy "authenticated create email assets" on public.dynamic_email_assets
  for insert to authenticated with check ((select auth.uid()) is not null and created_by = (select auth.uid()));
create policy "authenticated update email assets" on public.dynamic_email_assets
  for update to authenticated using ((select auth.uid()) is not null)
  with check ((select auth.uid()) is not null and updated_by = (select auth.uid()));
create policy "authenticated delete email assets" on public.dynamic_email_assets
  for delete to authenticated using ((select auth.uid()) is not null);

create policy "authenticated read legal texts" on public.dynamic_email_legal_texts
  for select to authenticated using ((select auth.uid()) is not null);
create policy "authenticated create legal texts" on public.dynamic_email_legal_texts
  for insert to authenticated with check ((select auth.uid()) is not null and created_by = (select auth.uid()));
create policy "authenticated update legal texts" on public.dynamic_email_legal_texts
  for update to authenticated using ((select auth.uid()) is not null)
  with check ((select auth.uid()) is not null and updated_by = (select auth.uid()));
create policy "authenticated delete legal texts" on public.dynamic_email_legal_texts
  for delete to authenticated using ((select auth.uid()) is not null);

create policy "authenticated read export runs" on public.dynamic_email_export_runs
  for select to authenticated using ((select auth.uid()) is not null);
create policy "authenticated create export runs" on public.dynamic_email_export_runs
  for insert to authenticated with check ((select auth.uid()) is not null and exported_by = (select auth.uid()));

comment on table public.dynamic_email_assets is
  'Referências leves de imagens hospedadas no Salesforce Content Builder; nenhum binário é armazenado no Supabase.';
