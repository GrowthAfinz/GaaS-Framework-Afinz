-- Evolui o cadastro existente sem quebrar os targets legados.
-- O frontend continua aceitando month/metric/value/channel/objective e passa a
-- usar os campos abaixo quando presentes.
alter table public.paid_media_targets
  add column if not exists level text not null default 'objective',
  add column if not exists entity_key text,
  add column if not exists direction text not null default 'max',
  add column if not exists warning_tolerance_pct numeric not null default 10,
  add column if not exists source text not null default 'manual',
  add column if not exists updated_at timestamptz not null default now();

update public.paid_media_targets
set entity_key = coalesce(entity_key, objective, '__global__'),
    level = case
      when coalesce(objective, '') <> '' then 'objective'
      else 'global'
    end
where entity_key is null;

alter table public.paid_media_targets
  alter column entity_key set default '__global__';

alter table public.paid_media_targets
  drop constraint if exists paid_media_targets_level_check,
  add constraint paid_media_targets_level_check
    check (level in ('global', 'objective', 'campaign')),
  drop constraint if exists paid_media_targets_direction_check,
  add constraint paid_media_targets_direction_check
    check (direction in ('min', 'max', 'range')),
  drop constraint if exists paid_media_targets_source_check,
  add constraint paid_media_targets_source_check
    check (source in ('manual', 'historical_baseline')),
  drop constraint if exists paid_media_targets_tolerance_check,
  add constraint paid_media_targets_tolerance_check
    check (warning_tolerance_pct >= 0 and warning_tolerance_pct <= 100);

create index if not exists paid_media_targets_scope_idx
  on public.paid_media_targets (month, level, entity_key, metric, channel);

alter table public.paid_media_targets enable row level security;

drop policy if exists "paid_media_targets_read" on public.paid_media_targets;
create policy "paid_media_targets_read"
  on public.paid_media_targets
  for select
  to anon, authenticated
  using (true);

drop policy if exists "paid_media_targets_authenticated_write" on public.paid_media_targets;
create policy "paid_media_targets_authenticated_write"
  on public.paid_media_targets
  for all
  to authenticated
  using (true)
  with check (true);

grant select on table public.paid_media_targets to anon;
grant select, insert, update, delete on table public.paid_media_targets to authenticated;
grant all on table public.paid_media_targets to service_role;

comment on column public.paid_media_targets.level is
  'Escopo da meta: global, objective ou campaign.';
comment on column public.paid_media_targets.direction is
  'Semantica: min = maior e melhor; max = menor e melhor; range = aderencia ao valor.';
