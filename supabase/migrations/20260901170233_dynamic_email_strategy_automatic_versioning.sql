-- Mantém a edição ágil (inclusive por LLM) sem perder comparação ou rollback.
-- Toda atualização da estratégia incrementa a versão e registra o novo estado.

alter table public.dynamic_email_email_strategies
  add column if not exists updated_by_type text not null default 'system'
    check (updated_by_type in ('human','llm','system')),
  add column if not exists update_source text not null default 'system'
    check (update_source in ('gaas','llm','api','system')),
  add column if not exists change_reason text,
  add column if not exists llm_model text,
  add column if not exists llm_run_id text;

alter table public.dynamic_email_management_versions
  add column if not exists saved_by_type text not null default 'system'
    check (saved_by_type in ('human','llm','system')),
  add column if not exists update_source text not null default 'system'
    check (update_source in ('gaas','llm','api','system')),
  add column if not exists llm_model text,
  add column if not exists llm_run_id text;

create or replace function public.prepare_dynamic_email_strategy_version()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  new.version := old.version + 1;
  new.updated_at := now();
  return new;
end;
$$;

create or replace function public.record_dynamic_email_strategy_version()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  insert into public.dynamic_email_management_versions (
    entity_type,
    entity_id,
    version,
    snapshot,
    change_reason,
    saved_by,
    saved_by_type,
    update_source,
    llm_model,
    llm_run_id
  ) values (
    'email_strategy',
    new.id,
    new.version,
    to_jsonb(new),
    new.change_reason,
    new.updated_by,
    new.updated_by_type,
    new.update_source,
    new.llm_model,
    new.llm_run_id
  )
  on conflict (entity_type, entity_id, version) do update set
    snapshot = excluded.snapshot,
    change_reason = excluded.change_reason,
    saved_by = excluded.saved_by,
    saved_by_type = excluded.saved_by_type,
    update_source = excluded.update_source,
    llm_model = excluded.llm_model,
    llm_run_id = excluded.llm_run_id;
  return new;
end;
$$;

drop trigger if exists dynamic_email_strategy_prepare_version
  on public.dynamic_email_email_strategies;
create trigger dynamic_email_strategy_prepare_version
before update on public.dynamic_email_email_strategies
for each row
execute function public.prepare_dynamic_email_strategy_version();

drop trigger if exists dynamic_email_strategy_record_version
  on public.dynamic_email_email_strategies;
create trigger dynamic_email_strategy_record_version
after insert or update on public.dynamic_email_email_strategies
for each row
execute function public.record_dynamic_email_strategy_version();

-- Garante que o estado atual também seja comparável antes da próxima alteração.
insert into public.dynamic_email_management_versions (
  entity_type,
  entity_id,
  version,
  snapshot,
  change_reason,
  saved_by,
  saved_by_type,
  update_source,
  llm_model,
  llm_run_id
)
select
  'email_strategy',
  strategy.id,
  strategy.version,
  to_jsonb(strategy),
  coalesce(strategy.change_reason, 'Snapshot inicial do versionamento automático'),
  strategy.updated_by,
  strategy.updated_by_type,
  strategy.update_source,
  strategy.llm_model,
  strategy.llm_run_id
from public.dynamic_email_email_strategies strategy
on conflict (entity_type, entity_id, version) do nothing;

comment on column public.dynamic_email_email_strategies.updated_by_type is
  'Tipo do último operador: human, llm ou system.';
comment on column public.dynamic_email_email_strategies.update_source is
  'Canal da última atualização: gaas, llm, api ou system.';
comment on function public.record_dynamic_email_strategy_version() is
  'Registra automaticamente cada estado novo da estratégia, independentemente do cliente que realizou o update.';
