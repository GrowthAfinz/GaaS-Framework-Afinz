-- Release 8 / slice 1: prepared only, no producer, scheduler or existing-table changes.
begin;

create table public.growth_operations (
  operation_id text primary key check (btrim(operation_id) <> ''),
  front text not null check (front in ('crm_aquisicao','midia_aquisicao','originacao_b2c','cross_sell_seguros','fora_de_escopo')),
  domain text not null check (domain in ('CRM','MID','B2C','FUN','RENT')),
  scope jsonb not null check (jsonb_typeof(scope) = 'object'),
  display_name text not null check (btrim(display_name) <> ''),
  lifecycle text not null default 'candidata' check (lifecycle in ('candidata','confirmada','aposentada')),
  aliases jsonb not null default '[]'::jsonb check (jsonb_typeof(aliases) = 'array'),
  vault_note_path text not null check (btrim(vault_note_path) <> ''),
  confirmed_by text,
  confirmed_at timestamptz,
  valid_from date not null,
  valid_to date,
  regime_start date,
  scope_schema_version integer not null default 1 check (scope_schema_version = 1),
  registry_revision integer not null default 1 check (registry_revision >= 1),
  provenance jsonb not null check (jsonb_typeof(provenance) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(domain, scope),
  check (valid_to is null or valid_to > valid_from),
  check (lifecycle <> 'confirmada' or (nullif(btrim(confirmed_by),'') is not null and confirmed_at is not null)),
  check (
    (domain = 'CRM' and scope ?& array['bu','segment','partner'] and
      nullif(scope->>'bu','') is not null and nullif(scope->>'segment','') is not null and nullif(scope->>'partner','') is not null)
    or (domain = 'MID' and nullif(scope->>'canonical_campaign_id','') is not null)
    or (domain = 'B2C' and scope->>'population' in ('total','crm','serasa_api'))
    or (domain = 'FUN' and nullif(scope->>'funnel','') is not null and nullif(scope->>'population','') is not null)
    or (domain = 'RENT' and nullif(scope->>'bu','') is not null and nullif(scope->>'family','') is not null)
  )
);

-- Every registry state is retained. Evaluations refer to registry revision/hash.
create table public.growth_operation_versions (
  operation_id text not null references public.growth_operations(operation_id) on delete restrict,
  registry_revision integer not null,
  definition jsonb not null,
  recorded_at timestamptz not null default now(),
  primary key(operation_id, registry_revision)
);

create table public.growth_trigger_rules (
  rule_id text primary key check (btrim(rule_id) <> ''),
  front text not null,
  family text not null check (family in ('T1','T2','T3','T4','T5','T6','T7')),
  metric text not null check (btrim(metric) <> ''),
  params jsonb not null check (jsonb_typeof(params) = 'object'),
  enabled boolean not null default false,
  mode text not null default 'observacao' check (mode in ('observacao','ativo')),
  version integer not null check (version >= 1),
  valid_from date not null,
  valid_to date,
  backtest_ref text not null check (btrim(backtest_ref) <> ''),
  created_by text not null check (btrim(created_by) <> ''),
  created_at timestamptz not null default now(),
  unique(front, family, metric, version),
  check (valid_to is null or valid_to > valid_from)
);

create function public.growth_capture_operation_revision()
returns trigger language plpgsql security invoker set search_path = pg_catalog, public as $$
begin
  if tg_op = 'UPDATE' then
    if new.operation_id <> old.operation_id then raise exception 'operation_id is immutable'; end if;
    new.registry_revision := old.registry_revision + 1;
    new.created_at := old.created_at;
    new.updated_at := now();
  else
    new.registry_revision := 1;
  end if;
  return new;
end;
$$;

create function public.growth_store_operation_revision()
returns trigger language plpgsql security invoker set search_path = pg_catalog, public as $$
begin
  insert into public.growth_operation_versions(operation_id, registry_revision, definition)
  values(new.operation_id, new.registry_revision, to_jsonb(new));
  return new;
end;
$$;

create function public.growth_reject_definition_mutation()
returns trigger language plpgsql security invoker set search_path = pg_catalog, public as $$
begin
  raise exception 'Versioned definition is immutable; create a reviewed new version';
end;
$$;

create trigger growth_operations_revision_before before insert or update on public.growth_operations
for each row execute function public.growth_capture_operation_revision();
create trigger growth_operations_revision_after after insert or update on public.growth_operations
for each row execute function public.growth_store_operation_revision();
create trigger growth_operation_versions_immutable before update or delete on public.growth_operation_versions
for each row execute function public.growth_reject_definition_mutation();
create trigger growth_trigger_rules_immutable before update or delete on public.growth_trigger_rules
for each row execute function public.growth_reject_definition_mutation();

alter table public.growth_operations enable row level security;
alter table public.growth_operation_versions enable row level security;
alter table public.growth_trigger_rules enable row level security;
revoke all on public.growth_operations, public.growth_operation_versions, public.growth_trigger_rules from public, anon, authenticated;
grant select, insert, update on public.growth_operations to service_role;
grant select, insert on public.growth_operation_versions to service_role;
grant select, insert on public.growth_trigger_rules to service_role;
revoke all on function public.growth_capture_operation_revision(), public.growth_store_operation_revision(), public.growth_reject_definition_mutation() from public, anon, authenticated;
grant execute on function public.growth_capture_operation_revision(), public.growth_store_operation_revision(), public.growth_reject_definition_mutation() to service_role;

comment on table public.growth_operations is 'Release 8 observation registry. Candidate is not business confirmation.';
comment on table public.growth_trigger_rules is 'Immutable rule versions; slice 1 seeds observation only. No execution/feed producer.';
commit;
