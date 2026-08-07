create table public.appsflyer_audit_decisions (
  case_key text primary key,
  template_id text not null,
  activity_names text[] not null default '{}',
  decision_status text not null default 'pending',
  rule_code text not null default 'none',
  allocation_config jsonb not null default '{}'::jsonb,
  notes text,
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint appsflyer_audit_decisions_status_check
    check (decision_status in ('pending', 'approved', 'shared', 'rejected', 'conflict')),
  constraint appsflyer_audit_decisions_rule_check
    check (rule_code in ('none', 'exact_unique', 'd2_d4_cutover', 'manual_split')),
  constraint appsflyer_audit_decisions_activity_names_check
    check (cardinality(activity_names) > 0)
);

comment on table public.appsflyer_audit_decisions is
  'Decisoes humanas auditaveis para reconciliacao Activity Name x template_id x AppsFlyer. Metricas de origem permanecem nas tabelas AppsFlyer.';
comment on column public.appsflyer_audit_decisions.case_key is
  'Chave deterministica composta no cliente a partir de template_id e Activity Names ordenados.';
comment on column public.appsflyer_audit_decisions.allocation_config is
  'Parametros versionaveis da regra aprovada; nunca substitui o total observado no AppsFlyer.';

create index appsflyer_audit_decisions_template_idx
  on public.appsflyer_audit_decisions (template_id);
create index appsflyer_audit_decisions_pending_idx
  on public.appsflyer_audit_decisions (updated_at desc)
  where decision_status in ('pending', 'conflict', 'shared');

alter table public.appsflyer_audit_decisions enable row level security;

revoke all on table public.appsflyer_audit_decisions from anon, authenticated;
grant select, insert, update on table public.appsflyer_audit_decisions to authenticated;
grant all on table public.appsflyer_audit_decisions to service_role;

create policy "appsflyer_audit_decisions_authenticated_read"
  on public.appsflyer_audit_decisions
  for select to authenticated
  using (true);

create policy "appsflyer_audit_decisions_authenticated_insert"
  on public.appsflyer_audit_decisions
  for insert to authenticated
  with check ((select auth.uid()) is not null and reviewed_by = (select auth.uid()));

create policy "appsflyer_audit_decisions_authenticated_update"
  on public.appsflyer_audit_decisions
  for update to authenticated
  using ((select auth.uid()) is not null)
  with check (reviewed_by = (select auth.uid()));
