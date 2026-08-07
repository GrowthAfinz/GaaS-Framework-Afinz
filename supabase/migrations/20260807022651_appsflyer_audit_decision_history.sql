create table public.appsflyer_audit_decision_history (
  id bigint generated always as identity primary key,
  case_key text not null,
  template_id text not null,
  decision_status text not null,
  rule_code text not null,
  activity_names text[] not null,
  allocation_config jsonb not null,
  notes text,
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  recorded_at timestamptz not null default now()
);

comment on table public.appsflyer_audit_decision_history is
  'Historico append-only das decisoes de reconciliacao AppsFlyer para auditoria e reversao.';

create index appsflyer_audit_decision_history_case_idx
  on public.appsflyer_audit_decision_history (case_key, recorded_at desc);

create or replace function public.record_appsflyer_audit_decision()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  insert into public.appsflyer_audit_decision_history (
    case_key, template_id, decision_status, rule_code, activity_names,
    allocation_config, notes, reviewed_by, reviewed_at
  ) values (
    new.case_key, new.template_id, new.decision_status, new.rule_code, new.activity_names,
    new.allocation_config, new.notes, new.reviewed_by, new.reviewed_at
  );
  return new;
end;
$$;

create trigger trg_record_appsflyer_audit_decision
before insert or update on public.appsflyer_audit_decisions
for each row execute function public.record_appsflyer_audit_decision();

alter table public.appsflyer_audit_decision_history enable row level security;
revoke all on table public.appsflyer_audit_decision_history from anon, authenticated;
grant select on table public.appsflyer_audit_decision_history to authenticated;
grant all on table public.appsflyer_audit_decision_history to service_role;
grant usage, select on sequence public.appsflyer_audit_decision_history_id_seq to service_role;

create policy "appsflyer_audit_decision_history_authenticated_read"
  on public.appsflyer_audit_decision_history
  for select to authenticated
  using (true);
