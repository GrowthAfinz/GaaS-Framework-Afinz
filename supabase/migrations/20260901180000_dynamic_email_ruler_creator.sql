-- Fábrica de E-mails: criação governada de réguas para Aquisição e Rentabilização.
-- As tabelas operacionais activities/rentabilizacao_activities permanecem somente leitura.

create table if not exists public.dynamic_email_segments (
  id uuid primary key default gen_random_uuid(),
  technical_name text not null,
  display_name text not null,
  business_front text not null check (business_front in ('acquisition','monetization')),
  source_table text check (source_table in ('activities','rentabilizacao_activities')),
  source_value text,
  partner text,
  bu text,
  lifecycle_family text,
  audience_description text,
  origin text not null default 'planned' check (origin in ('operational','planned')),
  governance_status text not null default 'draft' check (governance_status in ('existing','draft','approved','observed','archived')),
  created_by uuid references auth.users(id) default auth.uid(),
  updated_by uuid references auth.users(id) default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists dynamic_email_segments_identity_idx
  on public.dynamic_email_segments (business_front, lower(technical_name), lower(coalesce(partner, '')))
  where governance_status <> 'archived';

alter table public.dynamic_email_ruler_strategies
  add column if not exists name text,
  add column if not exists description text,
  add column if not exists business_front text,
  add column if not exists ruler_family text,
  add column if not exists template_slot_id text references public.dynamic_email_template_slots(id) on delete set null,
  add column if not exists source_ruler_id uuid references public.dynamic_email_ruler_strategies(id) on delete set null;

alter table public.dynamic_email_email_strategies
  add column if not exists functional_name text;

alter table public.dynamic_email_ruler_strategies drop constraint if exists dynamic_email_ruler_strategies_business_front_check;
alter table public.dynamic_email_ruler_strategies add constraint dynamic_email_ruler_strategies_business_front_check
  check (business_front is null or business_front in ('acquisition','monetization'));
alter table public.dynamic_email_ruler_strategies drop constraint if exists dynamic_email_ruler_strategies_partner_segment_product_version_key;
create unique index if not exists dynamic_email_ruler_named_version_idx
  on public.dynamic_email_ruler_strategies (partner, segment, coalesce(product, ''), coalesce(name, ''), version);

create table if not exists public.dynamic_email_ruler_segments (
  ruler_strategy_id uuid not null references public.dynamic_email_ruler_strategies(id) on delete cascade,
  segment_id uuid not null references public.dynamic_email_segments(id) on delete restrict,
  is_primary boolean not null default true,
  created_by uuid references auth.users(id) default auth.uid(),
  created_at timestamptz not null default now(),
  primary key (ruler_strategy_id, segment_id)
);

grant select, insert, update on public.dynamic_email_segments to authenticated;
grant select, insert, update, delete on public.dynamic_email_ruler_segments to authenticated;

alter table public.dynamic_email_segments enable row level security;
alter table public.dynamic_email_ruler_segments enable row level security;

create policy "authenticated read email segments" on public.dynamic_email_segments for select to authenticated using ((select auth.uid()) is not null);
create policy "authenticated create email segments" on public.dynamic_email_segments for insert to authenticated with check ((select auth.uid()) is not null and created_by = (select auth.uid()));
create policy "authenticated update email segments" on public.dynamic_email_segments for update to authenticated using ((select auth.uid()) is not null) with check ((select auth.uid()) is not null and updated_by = (select auth.uid()));
create policy "authenticated read ruler segments" on public.dynamic_email_ruler_segments for select to authenticated using ((select auth.uid()) is not null);
create policy "authenticated create ruler segments" on public.dynamic_email_ruler_segments for insert to authenticated with check ((select auth.uid()) is not null and created_by = (select auth.uid()));
create policy "authenticated update ruler segments" on public.dynamic_email_ruler_segments for update to authenticated using ((select auth.uid()) is not null);
create policy "authenticated delete ruler segments" on public.dynamic_email_ruler_segments for delete to authenticated using ((select auth.uid()) is not null);

comment on table public.dynamic_email_segments is 'Catálogo governado da Fábrica; rascunhos não escrevem nas tabelas operacionais.';
comment on column public.dynamic_email_segments.source_table is 'Fonte observada: activities para Aquisição ou rentabilizacao_activities para Rentabilização.';
