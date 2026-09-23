-- Aprendizado Growth — Release 5
-- Versioned memory from reviewed outcomes plus explicitly curated historical knowledge.

create table public.growth_learnings (
  id uuid primary key default gen_random_uuid(),
  source_kind text not null,
  source_outcome_id uuid references public.report_action_outcomes(id) on delete restrict,
  source_key text not null unique,
  source_title text not null,
  source_ref text not null,
  front text not null,
  classification text not null,
  lifecycle_status text not null default 'active',
  statement text not null,
  scope jsonb not null default '{}'::jsonb,
  applicability jsonb not null default '{}'::jsonb,
  limitations jsonb not null default '{}'::jsonb,
  confidence_status text not null,
  regime text,
  valid_from date not null,
  review_at date not null,
  valid_until date,
  supersedes_learning_id uuid references public.growth_learnings(id) on delete restrict,
  current_revision integer not null default 1,
  created_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint growth_learnings_source_kind_check check (
    source_kind in ('outcome', 'vault_curated')
  ),
  constraint growth_learnings_source_contract_check check (
    (source_kind = 'outcome' and source_outcome_id is not null)
    or (source_kind = 'vault_curated' and source_outcome_id is null)
  ),
  constraint growth_learnings_front_check check (
    front in ('crm_acquisition', 'paid_media', 'b2c_origin', 'report_live')
  ),
  constraint growth_learnings_classification_check check (
    classification in ('confirmed', 'directional', 'contradictory', 'inconclusive', 'invalidated')
  ),
  constraint growth_learnings_lifecycle_check check (
    lifecycle_status in ('active', 'expired', 'superseded', 'contested')
  ),
  constraint growth_learnings_confidence_check check (
    confidence_status in ('confirmed', 'directional', 'suspect', 'blocked')
  ),
  constraint growth_learnings_dates_check check (
    valid_from <= review_at
    and (valid_until is null or valid_from <= valid_until)
  ),
  constraint growth_learnings_revision_check check (current_revision >= 1),
  constraint growth_learnings_text_check check (
    btrim(source_key) <> '' and btrim(source_title) <> '' and btrim(source_ref) <> ''
    and btrim(statement) <> '' and btrim(created_by) <> ''
  ),
  constraint growth_learnings_scope_object_check check (jsonb_typeof(scope) = 'object'),
  constraint growth_learnings_applicability_object_check check (jsonb_typeof(applicability) = 'object'),
  constraint growth_learnings_limitations_object_check check (jsonb_typeof(limitations) = 'object')
);

create unique index growth_learnings_source_outcome_unique_idx
  on public.growth_learnings(source_outcome_id)
  where source_outcome_id is not null;

create index growth_learnings_active_review_idx
  on public.growth_learnings(lifecycle_status, review_at, updated_at desc);

create index growth_learnings_front_classification_idx
  on public.growth_learnings(front, classification, updated_at desc);

create index growth_learnings_supersedes_idx
  on public.growth_learnings(supersedes_learning_id)
  where supersedes_learning_id is not null;

create table public.growth_learning_revisions (
  id uuid primary key default gen_random_uuid(),
  learning_id uuid not null references public.growth_learnings(id) on delete cascade,
  revision integer not null,
  statement text not null,
  scope jsonb not null,
  applicability jsonb not null,
  limitations jsonb not null,
  classification text not null,
  lifecycle_status text not null,
  confidence_status text not null,
  regime text,
  valid_from date not null,
  review_at date not null,
  valid_until date,
  change_reason text not null,
  changed_by text not null,
  created_at timestamptz not null default now(),
  constraint growth_learning_revisions_unique unique (learning_id, revision),
  constraint growth_learning_revisions_revision_check check (revision >= 1),
  constraint growth_learning_revisions_statement_check check (btrim(statement) <> ''),
  constraint growth_learning_revisions_reason_check check (btrim(change_reason) <> ''),
  constraint growth_learning_revisions_actor_check check (btrim(changed_by) <> ''),
  constraint growth_learning_revisions_scope_object_check check (jsonb_typeof(scope) = 'object'),
  constraint growth_learning_revisions_applicability_object_check check (jsonb_typeof(applicability) = 'object'),
  constraint growth_learning_revisions_limitations_object_check check (jsonb_typeof(limitations) = 'object')
);

create index growth_learning_revisions_learning_idx
  on public.growth_learning_revisions(learning_id, revision desc);

create table public.growth_learning_links (
  id uuid primary key default gen_random_uuid(),
  learning_id uuid not null references public.growth_learnings(id) on delete cascade,
  target_type text not null,
  target_id text not null,
  relation_type text not null,
  created_at timestamptz not null default now(),
  constraint growth_learning_links_target_type_check check (
    target_type in ('outcome', 'bet', 'evidence', 'learning', 'report_run', 'vault_note')
  ),
  constraint growth_learning_links_relation_check check (
    relation_type in ('derived_from', 'applies_to', 'contradicts', 'supersedes', 'documents')
  ),
  constraint growth_learning_links_text_check check (
    btrim(target_id) <> '' and btrim(relation_type) <> ''
  ),
  constraint growth_learning_links_unique unique (learning_id, target_type, target_id, relation_type)
);

create index growth_learning_links_target_idx
  on public.growth_learning_links(target_type, target_id);

create table public.growth_curated_proposals (
  id uuid primary key default gen_random_uuid(),
  source_key text not null unique,
  source_ref text not null,
  front text not null,
  bucket text not null,
  title text not null,
  problem text not null,
  evidence text not null,
  action_text text not null,
  metric_name text,
  confidence_status text not null,
  reading_limit text not null,
  lifecycle_status text not null default 'open',
  created_at timestamptz not null default now(),
  constraint growth_curated_proposals_front_check check (
    front in ('crm_acquisition', 'paid_media', 'b2c_origin')
  ),
  constraint growth_curated_proposals_bucket_check check (
    bucket in ('Agir hoje', 'Acompanhar', 'Investigar')
  ),
  constraint growth_curated_proposals_confidence_check check (
    confidence_status in ('confirmed', 'directional', 'suspect', 'blocked')
  ),
  constraint growth_curated_proposals_lifecycle_check check (
    lifecycle_status in ('open', 'validated', 'dismissed', 'converted')
  ),
  constraint growth_curated_proposals_text_check check (
    btrim(source_key) <> '' and btrim(source_ref) <> '' and btrim(title) <> ''
    and btrim(problem) <> '' and btrim(evidence) <> '' and btrim(action_text) <> ''
    and btrim(reading_limit) <> ''
  )
);

alter table public.growth_feed_events
  drop constraint growth_feed_events_type_check;

alter table public.growth_feed_events
  add constraint growth_feed_events_type_check check (
    event_type in (
      'recommendation_created',
      'data_quality_blocked',
      'report_candidate_generated',
      'report_published',
      'report_blocked',
      'bet_created',
      'bet_updated',
      'signal_rejected',
      'execution_recorded',
      'outcome_due',
      'outcome_evaluated',
      'curated_proposal_created',
      'learning_created',
      'learning_revised'
    )
  );

alter table public.growth_feed_events
  drop constraint growth_feed_events_subject_check;

alter table public.growth_feed_events
  add constraint growth_feed_events_subject_check check (
    subject_type in (
      'action_candidate', 'report_run', 'report_publication', 'growth_bet',
      'growth_outcome', 'growth_proposal', 'growth_learning'
    )
  );

alter table public.growth_learnings enable row level security;
alter table public.growth_learning_revisions enable row level security;
alter table public.growth_learning_links enable row level security;
alter table public.growth_curated_proposals enable row level security;

revoke all on table public.growth_learnings from public, anon, authenticated;
revoke all on table public.growth_learning_revisions from public, anon, authenticated;
revoke all on table public.growth_learning_links from public, anon, authenticated;
revoke all on table public.growth_curated_proposals from public, anon, authenticated;

grant select on table public.growth_learnings to authenticated;
grant select on table public.growth_learning_revisions to authenticated;
grant select on table public.growth_learning_links to authenticated;
grant select on table public.growth_curated_proposals to authenticated;

grant select, insert, update, delete on table public.growth_learnings to service_role;
grant select, insert, update, delete on table public.growth_learning_revisions to service_role;
grant select, insert, update, delete on table public.growth_learning_links to service_role;
grant select, insert, update, delete on table public.growth_curated_proposals to service_role;

create policy growth_learnings_authenticated_read
  on public.growth_learnings
  for select
  to authenticated
  using ((select auth.uid()) is not null);

create policy growth_learning_revisions_authenticated_read
  on public.growth_learning_revisions
  for select
  to authenticated
  using ((select auth.uid()) is not null);

create policy growth_learning_links_authenticated_read
  on public.growth_learning_links
  for select
  to authenticated
  using ((select auth.uid()) is not null);

create policy growth_curated_proposals_authenticated_read
  on public.growth_curated_proposals
  for select
  to authenticated
  using ((select auth.uid()) is not null);

create or replace function public.growth_prevent_learning_revision_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'growth learning history is append-only';
end;
$$;

create trigger growth_learning_revisions_append_only
before update or delete on public.growth_learning_revisions
for each row execute function public.growth_prevent_learning_revision_mutation();

create trigger growth_learning_links_append_only
before update or delete on public.growth_learning_links
for each row execute function public.growth_prevent_learning_revision_mutation();

create trigger growth_curated_proposals_immutable
before update or delete on public.growth_curated_proposals
for each row execute function public.growth_prevent_learning_revision_mutation();

create or replace function public.growth_prevent_learning_direct_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if coalesce(current_setting('app.growth_learning_revision', true), '') <> 'allowed' then
    raise exception 'use growth_revise_learning so the prior revision is preserved';
  end if;
  return new;
end;
$$;

create trigger growth_learnings_revision_guard
before update or delete on public.growth_learnings
for each row execute function public.growth_prevent_learning_direct_update();

create or replace function public.growth_materialize_learning(p_outcome_id uuid)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_outcome public.report_action_outcomes%rowtype;
  v_bet public.growth_bets%rowtype;
  v_learning public.growth_learnings%rowtype;
  v_verdict text;
  v_classification text;
  v_statement text;
  v_review_at date;
  v_now timestamptz := now();
begin
  select outcome.* into v_outcome
  from public.report_action_outcomes outcome
  where outcome.id = p_outcome_id;

  if not found then
    raise exception 'outcome not found: %', p_outcome_id;
  end if;
  if v_outcome.review_status not in ('confirmed_by_user', 'resolved') then
    return null;
  end if;
  if v_outcome.bet_id is null then
    return null;
  end if;

  select bet.* into strict v_bet
  from public.growth_bets bet
  where bet.id = v_outcome.bet_id;

  v_verdict := coalesce(v_outcome.resolved_verdict, v_outcome.system_verdict);
  v_classification := case v_verdict
    when 'confirmed' then 'confirmed'
    when 'partially_confirmed' then 'directional'
    when 'not_confirmed' then 'contradictory'
    when 'invalid_premise' then 'invalidated'
    else 'inconclusive'
  end;
  v_review_at := coalesce(v_outcome.reviewed_at::date, current_date) + case v_classification
    when 'confirmed' then 90
    when 'directional' then 60
    when 'contradictory' then 90
    else 30
  end;
  v_statement := case v_classification
    when 'confirmed' then format(
      'No escopo %s, a hipótese "%s" foi confirmada para %s na janela %s a %s.',
      v_bet.team_scope, v_bet.hypothesis, v_bet.metric_name,
      v_outcome.window_start, v_outcome.window_end
    )
    when 'directional' then format(
      'No escopo %s, a hipótese "%s" recebeu evidência parcial para %s; reutilizar apenas como direção.',
      v_bet.team_scope, v_bet.hypothesis, v_bet.metric_name
    )
    when 'contradictory' then format(
      'No escopo %s, a hipótese "%s" não atingiu o critério contratado para %s.',
      v_bet.team_scope, v_bet.hypothesis, v_bet.metric_name
    )
    when 'invalidated' then format(
      'A hipótese "%s" não é reutilizável no regime observado; a premissa ou a comparabilidade foi invalidada.',
      v_bet.hypothesis
    )
    else format(
      'A hipótese "%s" permaneceu inconclusiva porque execução, dado ou comparabilidade não permitiram verificação.',
      v_bet.hypothesis
    )
  end;

  insert into public.growth_learnings (
    source_kind, source_outcome_id, source_key, source_title, source_ref, front,
    classification, lifecycle_status, statement, scope, applicability, limitations,
    confidence_status, regime, valid_from, review_at, created_by, created_at, updated_at
  ) values (
    'outcome', v_outcome.id, 'outcome:' || v_outcome.id::text,
    v_bet.hypothesis, 'report_action_outcomes:' || v_outcome.id::text, v_bet.front,
    v_classification, 'active', v_statement,
    jsonb_strip_nulls(jsonb_build_object(
      'team_scope', v_bet.team_scope,
      'owner', v_bet.owner,
      'metric_name', v_bet.metric_name,
      'source_action_candidate_id', v_bet.source_action_candidate_id,
      'bet_id', v_bet.id
    )),
    jsonb_strip_nulls(jsonb_build_object(
      'action_text', v_bet.action_text,
      'success_criterion', v_bet.success_criterion,
      'outcome_window_start', v_outcome.window_start,
      'outcome_window_end', v_outcome.window_end,
      'verification_view', v_outcome.verification_view
    )),
    jsonb_strip_nulls(jsonb_build_object(
      'execution_status', v_outcome.execution_status,
      'verification_reason', v_outcome.verification_reason,
      'contestation_reason', v_outcome.contestation_reason,
      'conclusion', v_outcome.conclusion
    )),
    case when v_classification in ('confirmed', 'contradictory') then 'confirmed' else 'directional' end,
    null,
    coalesce(v_outcome.reviewed_at::date, current_date),
    v_review_at,
    'outcome_materializer',
    v_now,
    v_now
  ) on conflict (source_outcome_id) where source_outcome_id is not null do nothing
  returning * into v_learning;

  if v_learning.id is null then
    select learning.* into v_learning
    from public.growth_learnings learning
    where learning.source_outcome_id = v_outcome.id;
    return v_learning.id;
  end if;

  insert into public.growth_learning_revisions (
    learning_id, revision, statement, scope, applicability, limitations,
    classification, lifecycle_status, confidence_status, regime,
    valid_from, review_at, valid_until, change_reason, changed_by, created_at
  ) values (
    v_learning.id, 1, v_learning.statement, v_learning.scope, v_learning.applicability,
    v_learning.limitations, v_learning.classification, v_learning.lifecycle_status,
    v_learning.confidence_status, v_learning.regime, v_learning.valid_from,
    v_learning.review_at, v_learning.valid_until,
    'Materialização automática após outcome resolvido.',
    'outcome_materializer', v_now
  );

  insert into public.growth_learning_links (
    learning_id, target_type, target_id, relation_type, created_at
  ) values
    (v_learning.id, 'outcome', v_outcome.id::text, 'derived_from', v_now),
    (v_learning.id, 'bet', v_bet.id::text, 'derived_from', v_now);

  insert into public.growth_feed_events (
    event_type, subject_type, subject_id, front, occurred_at, priority_score,
    relevance_dimensions, summary_snapshot, route, dedupe_key
  ) values (
    'learning_created', 'growth_learning', v_learning.id, v_learning.front, v_now, 58,
    jsonb_build_object(
      'group_key', 'learning:' || v_learning.id::text,
      'event_state', v_learning.lifecycle_status,
      'confidence_status', v_learning.confidence_status,
      'source_kind', v_learning.source_kind,
      'classification', v_learning.classification
    ),
    jsonb_build_object(
      'title', 'Aprendizado materializado do outcome',
      'summary', v_learning.statement,
      'source_kind', v_learning.source_kind,
      'classification', v_learning.classification,
      'source_ref', v_learning.source_ref,
      'primary_action', jsonb_build_object('kind', 'open_learning', 'label', 'Abrir memória')
    ),
    '?view=learning&section=memory&item=' || v_learning.id::text,
    'growth_learning:' || v_learning.id::text || ':created'
  ) on conflict (dedupe_key) do nothing;

  return v_learning.id;
end;
$$;

create or replace function public.growth_materialize_learning_trigger()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.review_status in ('confirmed_by_user', 'resolved')
    and (
      tg_op = 'INSERT'
      or old.review_status is distinct from new.review_status
      or old.resolved_verdict is distinct from new.resolved_verdict
    )
  then
    perform public.growth_materialize_learning(new.id);
  end if;
  return new;
end;
$$;

create trigger report_action_outcomes_materialize_learning
after insert or update on public.report_action_outcomes
for each row execute function public.growth_materialize_learning_trigger();

create or replace function public.growth_revise_learning(
  p_learning_id uuid,
  p_statement text,
  p_scope jsonb,
  p_applicability jsonb,
  p_limitations jsonb,
  p_classification text,
  p_lifecycle_status text,
  p_confidence_status text,
  p_valid_from date,
  p_review_at date,
  p_change_reason text,
  p_changed_by text,
  p_regime text default null,
  p_valid_until date default null
)
returns public.growth_learnings
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_learning public.growth_learnings%rowtype;
  v_revision integer;
  v_now timestamptz := now();
begin
  if nullif(btrim(p_statement), '') is null
    or nullif(btrim(p_change_reason), '') is null
    or nullif(btrim(p_changed_by), '') is null
  then
    raise exception 'statement, change reason and changed by are required';
  end if;
  if jsonb_typeof(p_scope) <> 'object'
    or jsonb_typeof(p_applicability) <> 'object'
    or jsonb_typeof(p_limitations) <> 'object'
  then
    raise exception 'scope, applicability and limitations must be JSON objects';
  end if;

  select learning.* into v_learning
  from public.growth_learnings learning
  where learning.id = p_learning_id
  for update;
  if not found then
    raise exception 'learning not found: %', p_learning_id;
  end if;

  v_revision := v_learning.current_revision + 1;
  perform set_config('app.growth_learning_revision', 'allowed', true);

  update public.growth_learnings
  set statement = btrim(p_statement),
      scope = p_scope,
      applicability = p_applicability,
      limitations = p_limitations,
      classification = p_classification,
      lifecycle_status = p_lifecycle_status,
      confidence_status = p_confidence_status,
      regime = nullif(btrim(p_regime), ''),
      valid_from = p_valid_from,
      review_at = p_review_at,
      valid_until = p_valid_until,
      current_revision = v_revision,
      updated_at = v_now
  where id = p_learning_id
  returning * into v_learning;

  insert into public.growth_learning_revisions (
    learning_id, revision, statement, scope, applicability, limitations,
    classification, lifecycle_status, confidence_status, regime,
    valid_from, review_at, valid_until, change_reason, changed_by, created_at
  ) values (
    v_learning.id, v_revision, v_learning.statement, v_learning.scope,
    v_learning.applicability, v_learning.limitations, v_learning.classification,
    v_learning.lifecycle_status, v_learning.confidence_status, v_learning.regime,
    v_learning.valid_from, v_learning.review_at, v_learning.valid_until,
    btrim(p_change_reason), btrim(p_changed_by), v_now
  );

  insert into public.growth_feed_events (
    event_type, subject_type, subject_id, front, occurred_at, priority_score,
    relevance_dimensions, summary_snapshot, route, dedupe_key
  ) values (
    'learning_revised', 'growth_learning', v_learning.id, v_learning.front, v_now, 48,
    jsonb_build_object(
      'group_key', 'learning:' || v_learning.id::text,
      'event_state', v_learning.lifecycle_status,
      'confidence_status', v_learning.confidence_status,
      'source_kind', v_learning.source_kind,
      'classification', v_learning.classification,
      'revision', v_revision
    ),
    jsonb_build_object(
      'title', 'Memória revisada',
      'summary', v_learning.statement,
      'source_kind', v_learning.source_kind,
      'classification', v_learning.classification,
      'change_reason', btrim(p_change_reason),
      'source_ref', v_learning.source_ref,
      'primary_action', jsonb_build_object('kind', 'open_learning', 'label', 'Abrir memória')
    ),
    '?view=learning&section=memory&item=' || v_learning.id::text,
    'growth_learning:' || v_learning.id::text || ':revision:' || v_revision::text
  );

  return v_learning;
end;
$$;

create view public.growth_memory_active_v
with (security_invoker = true)
as
select
  learning.*,
  learning.source_kind = 'outcome' as validated_by_loop,
  learning.review_at <= current_date as review_due,
  coalesce(revisions.revision_count, 0)::integer as revision_count,
  revisions.last_revision_at,
  coalesce(links.link_count, 0)::integer as link_count
from public.growth_learnings learning
left join lateral (
  select count(*) as revision_count, max(revision.created_at) as last_revision_at
  from public.growth_learning_revisions revision
  where revision.learning_id = learning.id
) revisions on true
left join lateral (
  select count(*) as link_count
  from public.growth_learning_links link
  where link.learning_id = learning.id
) links on true
where learning.lifecycle_status in ('active', 'contested');

revoke all on table public.growth_memory_active_v from public, anon, authenticated;
grant select on table public.growth_memory_active_v to authenticated, service_role;

revoke execute on function public.growth_prevent_learning_revision_mutation() from public, anon, authenticated;
revoke execute on function public.growth_prevent_learning_direct_update() from public, anon, authenticated;
revoke execute on function public.growth_materialize_learning(uuid) from public, anon, authenticated;
revoke execute on function public.growth_materialize_learning_trigger() from public, anon, authenticated;
revoke execute on function public.growth_revise_learning(uuid,text,jsonb,jsonb,jsonb,text,text,text,date,date,text,text,text,date)
  from public, anon, authenticated;

grant execute on function public.growth_prevent_learning_revision_mutation() to service_role;
grant execute on function public.growth_prevent_learning_direct_update() to service_role;
grant execute on function public.growth_materialize_learning(uuid) to service_role;
grant execute on function public.growth_materialize_learning_trigger() to service_role;
grant execute on function public.growth_revise_learning(uuid,text,jsonb,jsonb,jsonb,text,text,text,date,date,text,text,text,date)
  to service_role;

insert into public.growth_learnings (
  source_kind, source_key, source_title, source_ref, front, classification,
  lifecycle_status, statement, scope, applicability, limitations,
  confidence_status, regime, valid_from, review_at, created_by
) values
  (
    'vault_curated',
    'vault:dimensao-canonica-parceiro:licao-metodo',
    'Reconciliação numérica não valida uma regra',
    'Afinz-CRM-Midia-Vault/02-Entidades-Dados/Dimensao-Canonica-de-Parceiro.md#licao-de-metodo',
    'crm_acquisition', 'confirmed', 'active',
    'Reconciliação numérica valida o resultado observado, não a regra que produzirá dados futuros; ao materializar lógica, a fonte deve ser o código e a equivalência precisa ser automatizada.',
    '{"domain":"crm","entity":"partner_dimension","rule":"canonical_partner"}'::jsonb,
    '{"use_when":["materializing_business_rules","translating_typescript_to_sql"],"required_evidence":["source_code","equivalence_test"]}'::jsonb,
    '{"does_not_mean":"A amostra histórica prova todos os ramos possíveis."}'::jsonb,
    'confirmed', 'canonical_partner_v2', date '2026-09-13', date '2027-03-12',
    'vault_curator:v1'
  ),
  (
    'vault_curated',
    'vault:b2c-measurement-break:2026-06-23',
    'Não atravessar mudança de objetivo na série de Aquisição B2C',
    'Afinz-CRM-Midia-Vault/02-Entidades-Dados/Quebra-de-Medicao-Aquisicao-B2C-Jun26.md',
    'paid_media', 'confirmed', 'active',
    'Em 23/06/2026, conversions deixou de representar instalação e passou a representar início de proposta em Aquisição B2C; comparações que atravessam o corte precisam separar os regimes.',
    '{"domain":"paid_media","platform":"Meta","campaign_family":"B2C acquisition"}'::jsonb,
    '{"valid_before":"conversions = installation","valid_after":"conversions = start_trial","cutover":"2026-06-23"}'::jsonb,
    '{"prohibition":"Não comparar custo por instalação de maio com julho como se o objetivo fosse constante."}'::jsonb,
    'confirmed', 'measurement_cutover_2026-06-23', date '2026-06-23', date '2026-12-22',
    'vault_curator:v1'
  ),
  (
    'vault_curated',
    'vault:plurix-install-measurement:missing-instrumentation',
    'Ausência de instrumentação não é desempenho zero',
    'Afinz-CRM-Midia-Vault/02-Entidades-Dados/Quebra-de-Medicao-Aquisicao-B2C-Jun26.md#o-mesmo-problema-em-plurix',
    'paid_media', 'confirmed', 'active',
    'Campanha de instalação do +amigo sem SDK, MMP ou evento de app não produz evidência de instalação; zero ou missing nesse contexto não pode ser interpretado como performance.',
    '{"domain":"paid_media","partner":"Plurix","app":"+amigo","metric":"installs"}'::jsonb,
    '{"required_before_analysis":["app_registered_in_mmp","sdk_or_app_event_connected","named_conversion_event"]}'::jsonb,
    '{"reading_limit":"O aprendizado governa medição; não conclui se a campanha teria boa ou má performance após instrumentação."}'::jsonb,
    'confirmed', 'no_app_measurement', date '2026-08-21', date '2026-12-22',
    'vault_curator:v1'
  ),
  (
    'vault_curated',
    'vault:sfmc-preview:test-send-certification',
    'Preview local não certifica renderização no SFMC',
    'Afinz-CRM-Midia-Vault/04-Operacao/Emails-Dinamicos-SFMC.md#como-testar-uma-campanha-nova',
    'crm_acquisition', 'confirmed', 'active',
    'A prévia local acelera edição e detecta falhas suportadas, mas a certificação final de personalização, lookup, tracking e cliente de e-mail continua sendo o Test Send do SFMC.',
    '{"domain":"crm","channel":"email","system":"SFMC"}'::jsonb,
    '{"use_when":["dynamic_email_release","ampscript_change","new_campaign"]}'::jsonb,
    '{"preview_limit":"AMPscript-lite e navegador não reproduzem todo o ambiente do SFMC nem todos os clientes de e-mail."}'::jsonb,
    'confirmed', 'dynamic_email_release', date '2026-08-10', date '2026-12-22',
    'vault_curator:v1'
  ),
  (
    'vault_curated',
    'vault:sfmc-csv:comma-us-date-contract',
    'O contrato observado de importação vence a convenção presumida',
    'Afinz-CRM-Midia-Vault/04-Operacao/Emails-Dinamicos-SFMC.md#padrao-de-exportacao-csv-para-o-sfmc',
    'crm_acquisition', 'confirmed', 'active',
    'O CSV aceito pela Data Extension usa vírgula, UTF-8 sem BOM, CRLF e datas MM/DD/YYYY HH:mm:ss; ponto e vírgula ou data localizada não devem ser presumidos sem round-trip.',
    '{"domain":"crm","channel":"email","artifact":"SFMC Data Extension CSV"}'::jsonb,
    '{"required_checks":["36 columns","comma delimiter","CRLF","UTF-8 without BOM","US import dates","round-trip"]}'::jsonb,
    '{"source_limit":"O formato do download localizado não prova o formato de reimportação."}'::jsonb,
    'confirmed', 'sfmc_import_contract_2026-09-03', date '2026-09-03', date '2027-03-02',
    'vault_curator:v1'
  )
on conflict (source_key) do nothing;

insert into public.growth_learning_revisions (
  learning_id, revision, statement, scope, applicability, limitations,
  classification, lifecycle_status, confidence_status, regime,
  valid_from, review_at, valid_until, change_reason, changed_by, created_at
)
select
  learning.id, 1, learning.statement, learning.scope, learning.applicability,
  learning.limitations, learning.classification, learning.lifecycle_status,
  learning.confidence_status, learning.regime, learning.valid_from,
  learning.review_at, learning.valid_until,
  'Importação histórica curada e rastreada a partir do vault.',
  'vault_curator:v1', learning.created_at
from public.growth_learnings learning
where learning.source_kind = 'vault_curated'
on conflict (learning_id, revision) do nothing;

insert into public.growth_learning_links (
  learning_id, target_type, target_id, relation_type, created_at
)
select learning.id, 'vault_note', learning.source_ref, 'derived_from', learning.created_at
from public.growth_learnings learning
where learning.source_kind = 'vault_curated'
on conflict (learning_id, target_type, target_id, relation_type) do nothing;

insert into public.growth_curated_proposals (
  source_key, source_ref, front, bucket, title, problem, evidence,
  action_text, metric_name, confidence_status, reading_limit
) values
  (
    'vault:appsflyer-af-sub3:raw-coverage-proof',
    'Afinz-CRM-Midia-Vault/04-Operacao/AppsFlyer-Tracking-CRM.md#validacao-de-cobertura-2026-07-28',
    'crm_acquisition', 'Investigar',
    'Provar af_sub3 no raw data do AppsFlyer',
    'Performance por template depende de af_sub3, mas a API agregada expõe somente af_sub1.',
    'Links governados carregam af_sub3; ainda falta uma amostra de Pull API ou Data Locker provando cobertura no raw.',
    'Extrair uma amostra raw, medir cobertura de af_sub3 por canal e interromper a ingestão se o campo vier vazio.',
    'af_sub3_raw_coverage', 'blocked',
    'Não criar aposta de performance por template antes da prova de cobertura e da definição de uma fonte verificável.'
  ),
  (
    'vault:meta-supabase:revalidate-daily-completeness',
    'Afinz-CRM-Midia-Vault/02-Entidades-Dados/Falha-Sincronizacao-Meta-Supabase-4Dias-Ago26.md',
    'paid_media', 'Investigar',
    'Revalidar completude diária Meta → Supabase',
    'Quatro dias históricos tiveram somente parte das campanhas, subestimando o investimento do trimestre.',
    'A comparação Meta × paid_media_metrics encontrou 28/06, 24/07, 25/07 e 26/07 incompletos e efeito distribuído entre frentes.',
    'Comparar campanhas esperadas versus coletadas em dias fechados recentes e reprocessar apenas os dias ainda incompletos.',
    'daily_campaign_coverage', 'suspect',
    'O achado é histórico; precisa ser revalidado nos dados atuais antes de virar correção ativa ou aposta.'
  )
on conflict (source_key) do nothing;

insert into public.growth_feed_events (
  event_type, subject_type, subject_id, front, occurred_at, priority_score,
  relevance_dimensions, summary_snapshot, route, dedupe_key
)
select
  'curated_proposal_created', 'growth_proposal', proposal.id, proposal.front,
  proposal.created_at,
  case proposal.confidence_status when 'blocked' then 78 when 'suspect' then 68 else 55 end,
  jsonb_build_object(
    'group_key', 'proposal:' || proposal.source_key,
    'event_state', case when proposal.confidence_status = 'blocked' then 'blocked' else 'needs_revalidation' end,
    'confidence_status', proposal.confidence_status,
    'bucket', proposal.bucket,
    'source_ref', proposal.source_ref
  ),
  jsonb_build_object(
    'title', proposal.title,
    'summary', proposal.problem,
    'impact', proposal.evidence,
    'action_text', proposal.action_text,
    'reading_limit', proposal.reading_limit,
    'metric_name', proposal.metric_name,
    'source_view', 'VAULT_CURATED',
    'source_ref', proposal.source_ref,
    'generated_by', 'vault_curator:v1',
    'bucket', proposal.bucket,
    'confidence_status', proposal.confidence_status,
    'primary_action', jsonb_build_object('kind', 'open_evidence', 'label', 'Revisar proposta')
  ),
  '?view=learning&section=feed&item=' || proposal.id::text,
  'growth_proposal:' || proposal.source_key || ':created'
from public.growth_curated_proposals proposal
on conflict (dedupe_key) do nothing;

insert into public.growth_feed_events (
  event_type, subject_type, subject_id, front, occurred_at, priority_score,
  relevance_dimensions, summary_snapshot, route, dedupe_key
)
select
  'learning_created', 'growth_learning', learning.id, learning.front,
  learning.created_at, 42,
  jsonb_build_object(
    'group_key', 'learning:' || learning.id::text,
    'event_state', learning.lifecycle_status,
    'confidence_status', learning.confidence_status,
    'source_kind', learning.source_kind,
    'classification', learning.classification
  ),
  jsonb_build_object(
    'title', 'Conhecimento histórico curado',
    'summary', learning.statement,
    'source_kind', learning.source_kind,
    'classification', learning.classification,
    'source_ref', learning.source_ref,
    'primary_action', jsonb_build_object('kind', 'open_learning', 'label', 'Abrir memória')
  ),
  '?view=learning&section=memory&item=' || learning.id::text,
  'growth_learning:' || learning.id::text || ':created'
from public.growth_learnings learning
where learning.source_kind = 'vault_curated'
on conflict (dedupe_key) do nothing;

select public.growth_materialize_learning(outcome.id)
from public.report_action_outcomes outcome
where outcome.review_status in ('confirmed_by_user', 'resolved')
  and outcome.bet_id is not null;

comment on table public.growth_learnings is
  'Versioned Growth memory. Outcome-derived learning and curated historical knowledge remain distinguishable by source_kind.';

comment on table public.growth_curated_proposals is
  'Read-only historical proposals curated from the vault. They remain investigations until a governed metric contract exists.';

comment on view public.growth_memory_active_v is
  'Authenticated memory projection with explicit origin, validity, review status and revision counts.';

comment on function public.growth_materialize_learning(uuid) is
  'Idempotently materializes a reviewed Growth outcome as versioned memory and emits learning_created.';

comment on function public.growth_revise_learning(uuid,text,jsonb,jsonb,jsonb,text,text,text,date,date,text,text,text,date) is
  'Service-only governed revision command; updates current memory while preserving an append-only revision.';
