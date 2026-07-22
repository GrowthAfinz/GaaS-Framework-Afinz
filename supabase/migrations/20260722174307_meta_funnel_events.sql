-- =====================================================================
-- Meta paid-media funnel: governed runs, canonical event aliases and mature snapshots.
-- This migration is intentionally additive and does not modify paid_media_metrics.
-- Runs remain auditable, aliases cannot double count, event-map validity cannot
-- overlap and only completed runs are exposed to the analytical views.
-- =====================================================================

create extension if not exists btree_gist with schema extensions;
-- gen_random_uuid(): extenso pgcrypto (j disponvel no Supabase).

-- ---------------------------------------------------------------------
-- 0) CONTROLE DE EXECUES  paid_media_collection_runs
-- ---------------------------------------------------------------------
create table public.paid_media_collection_runs (
  id             uuid primary key default gen_random_uuid(),
  source         text not null,                 -- meta | appsflyer
  mode           text,                          -- daily | backfill
  status         text not null default 'pending',
  campaign_id    text,
  since_date     date,
  until_date     date,
  data_as_of     date,
  started_at     timestamptz not null default now(),
  finished_at    timestamptz,
  rows_received  integer not null default 0,
  rows_written   integer not null default 0,
  rows_rejected  integer not null default 0,
  pages_received integer not null default 0,
  error_summary  text,
  metadata       jsonb,                          -- reconciliao, avisos; SEM token/secret
  constraint runs_status_chk check (status in ('pending','complete','failed')),
  constraint runs_source_chk check (source in ('meta','appsflyer'))
);
create index if not exists ix_runs_status on public.paid_media_collection_runs (status, data_as_of);
-- Regra de negcio (aplicada nas views): s linhas de run 'complete' entram no BI.
-- Run comea 'pending'; vira 'complete' s aps TODAS as pginas/gros/normalizaes/
-- escritas e reconciliao no-crtica; vira 'failed' em qualquer falha no recuperada.
-- Retentativa: cria NOVO run (idempotente pela chave natural do fato); o run 'failed'
-- fica para auditoria mas nunca aparece nas views (ver join nas views).


-- ---------------------------------------------------------------------
-- 1) event_map  dicionrio certificado (schema v2: alias group + vigncia)
-- ---------------------------------------------------------------------
create table public.event_map (
  id                bigserial primary key,
  canonical_event   text not null,
  funnel_stage      text not null,
  stage_order       integer not null,
  is_core_funnel    boolean not null default false,
  source            text not null,                 -- meta_attributed | meta_results | appsflyer
  source_event_name text not null,                 -- action_type literal OU indicator literal
  alias_group       text not null,                 -- eventos que medem a MESMA coisa
  alias_priority    integer not null default 1,    -- 1 = principal
  is_primary_measure boolean not null default false, -- medida escolhida p/ volume produtivo
  valid_from        date not null default date '1900-01-01',
  valid_to          date,
  confidence        text not null default 'directional',
  certified_at      timestamptz,
  notes             text,
  constraint event_map_source_chk check (source in ('meta_attributed','meta_results','appsflyer')),
  constraint event_map_conf_chk   check (confidence in ('trusted','directional','suspect','blocked')),
  constraint event_map_uq unique (source, source_event_name, valid_from),
  -- exatamente UMA medida principal por (source, alias_group, valid_from):
  -- garantido por ndice parcial abaixo (no em constraint por limitao de expresso).
  -- vigncia SEM sobreposio por (source, source_event_name):
  constraint event_map_no_overlap exclude using gist (
    source with =,
    source_event_name with =,
    daterange(valid_from, coalesce(valid_to, date 'infinity'), '[]') with &&
  )
);
-- Only one primary measurement may be active for an alias group at a time.
alter table public.event_map
  add constraint event_map_primary_no_overlap exclude using gist (
    source with =,
    alias_group with =,
    daterange(valid_from, coalesce(valid_to, date 'infinity'), '[]') with &&
  ) where (is_primary_measure);

-- Seed: SOMENTE aliases certificados. SubmitApplication NO entra.
insert into public.event_map
 (canonical_event, funnel_stage, stage_order, is_core_funnel, source, source_event_name,
  alias_group, alias_priority, is_primary_measure, valid_from, confidence, certified_at, notes)
values
 -- TOPO/MEIO  actions[] (source='meta_attributed'), certificado 19-21/07 (001)
 ('link_click','link_click',2,false,'meta_attributed','link_click',
   'link_click',1,true , date '2026-07-19','trusted', now(), 'clique no link'),
 ('install','install',4,true ,'meta_attributed','mobile_app_install',
   'install',1,true , date '2026-07-19','trusted', now(), 'install (medida principal)'),
 ('install','install',4,true ,'meta_attributed','omni_app_install',
   'install',2,false, date '2026-07-19','trusted', now(), 'alias de install (auditoria)'),
 ('app_session','app_session',5,false,'meta_attributed','app_custom_event.fb_mobile_activate_app',
   'app_session',1,true , date '2026-07-19','trusted', now(), 'sessao (principal)'),
 ('app_session','app_session',5,false,'meta_attributed','omni_activate_app',
   'app_session',2,false, date '2026-07-19','trusted', now(), 'alias de sessao (auditoria)'),
 ('initiated_checkout','initiated_checkout',6,false,'meta_attributed','app_custom_event.fb_mobile_initiated_checkout',
   'initiated_checkout',1,true , date '2026-07-19','trusted', now(), 'checkout (principal)'),
 ('initiated_checkout','initiated_checkout',6,false,'meta_attributed','omni_initiated_checkout',
   'initiated_checkout',2,false, date '2026-07-19','trusted', now(), 'alias checkout (auditoria)'),
 ('initiated_checkout','initiated_checkout',6,false,'meta_attributed','initiate_checkout',
   'initiated_checkout',3,false, date '2026-07-19','trusted', now(), 'alias checkout (auditoria)'),
 -- STARTTRIAL  results (source='meta_results'), certificado 22/06-21/07 = 115 (003)
 ('start_trial','start_trial',7,true ,'meta_results','conversions:start_trial_mobile_app',
   'start_trial',1,true , date '2026-06-22','trusted', now(), 'StartTrial ATRIBUIDO 7d click; campo results; NAO e total do app')
on conflict (source, source_event_name, valid_from) do nothing;
-- SubmitApplication (Card order completed): NAO existe em fonte Meta. NAO semear.


-- ---------------------------------------------------------------------
-- 2) paid_media_actions  fato long-format
-- ---------------------------------------------------------------------
create table public.paid_media_actions (
  id                            bigserial primary key,

  collector_run_id              uuid not null references public.paid_media_collection_runs(id),
  business_date                 date not null,
  data_as_of                    date not null,
  collected_at                  timestamptz not null default now(),

  channel                       text not null default 'meta',
  account_id                    text not null,
  grain_level                   text not null,        -- campaign | adset | ad
  grain_role                    text not null,        -- fact | reconciliation
  entity_id                     text not null,

  campaign_id                   text, campaign_name text,
  adset_id                      text, adset_name   text,
  ad_id                         text, ad_name       text,

  source                        text not null,        -- meta_attributed | meta_results | appsflyer
  metric_kind                   text not null,        -- action | result
  source_event_name             text not null,        -- action_type OU indicator literal
  raw_indicator                 text,                 -- results: indicator bruto (provenincia)
  canonical_event               text,                 -- resolvido via event_map (null se desconhecido)

  reported_attribution_window   text not null,        -- rtulo do payload ('default','7d_click',...)
  effective_attribution_window  text,                 -- poltica resolvida ('7d_click','mixed',null)
  attribution_policy_key        text not null default 'unknown', -- chave NO NULA p/ idempotncia
  attribution_resolution_source text,                 -- ex 'adset.attribution_spec' | 'campaign.adsets(mixed)'
  attribution_spec_snapshot     jsonb,

  value                         numeric,              -- NULO quando no h leitura
  entity_spend                  numeric,              -- repeated control value; never aggregate across events
  cost_per_result               numeric,              -- s metric_kind='result'
  observation_status            text not null,        -- available|explicit_zero|not_available|unsupported

  constraint pma_grain_chk  check (grain_level in ('campaign','adset','ad')),
  constraint pma_role_chk   check (grain_role in ('fact','reconciliation')),
  constraint pma_grain_role_chk check (
    (grain_level='ad' and grain_role='fact') or
    (grain_level in ('adset','campaign') and grain_role='reconciliation')
  ),
  constraint pma_source_chk check (source in ('meta_attributed','meta_results','appsflyer')),
  constraint pma_kind_chk   check (metric_kind in ('action','result')),
  constraint pma_obs_chk    check (observation_status in ('available','explicit_zero','not_available','unsupported')),
  constraint pma_grain_entity_chk check (
    (grain_level='campaign' and entity_id = campaign_id) or
    (grain_level='adset'    and entity_id = adset_id)    or
    (grain_level='ad'       and entity_id = ad_id)
  ),
  constraint pma_value_status_chk check (
    (observation_status='available'     and value is not null) or
    (observation_status='explicit_zero' and value = 0)         or
    (observation_status in ('not_available','unsupported') and value is null)
  ),
  constraint pma_cpr_chk check (cost_per_result is null or metric_kind='result'),
  constraint pma_spend_chk check (entity_spend is null or entity_spend >= 0),

  -- IDEMPOTNCIA: s colunas simples e NO nulas (inclui source e attribution_policy_key).
  constraint pma_idem_uq unique (
    collector_run_id, channel, account_id, source, grain_level, entity_id,
    source_event_name, reported_attribution_window, attribution_policy_key,
    business_date, data_as_of
  )
);

create index if not exists ix_pma_temporal on public.paid_media_actions (business_date);
create index if not exists ix_pma_campaign on public.paid_media_actions (campaign_id, business_date);
create index if not exists ix_pma_event    on public.paid_media_actions (source, source_event_name);
create index if not exists ix_pma_run      on public.paid_media_actions (collector_run_id);
create index if not exists ix_pma_canonical on public.paid_media_actions (canonical_event) where canonical_event is not null;
create index if not exists ix_pma_latest on public.paid_media_actions (
  channel, account_id, source, grain_level, entity_id,
  source_event_name, reported_attribution_window, attribution_policy_key,
  business_date, data_as_of desc
);


-- ---------------------------------------------------------------------
-- 3) VIEW "latest"  ltima maturao; SOMENTE runs 'complete'; colunas explcitas.
--    Identidade inclui attribution_policy_key (distingue polticas efetivas).
-- ---------------------------------------------------------------------
create or replace view public.v_paid_media_actions_latest
with (security_invoker = true) as
select distinct on (
  a.channel, a.account_id, a.source, a.grain_level, a.entity_id,
  a.source_event_name, a.reported_attribution_window, a.attribution_policy_key, a.business_date
)
  a.business_date, a.data_as_of, a.collected_at, a.channel, a.account_id,
  a.grain_level, a.grain_role, a.entity_id,
  a.campaign_id, a.campaign_name, a.adset_id, a.adset_name, a.ad_id, a.ad_name,
  a.source, a.metric_kind, a.source_event_name, a.raw_indicator, a.canonical_event,
  a.reported_attribution_window, a.effective_attribution_window, a.attribution_policy_key,
  a.value, a.entity_spend, a.cost_per_result, a.observation_status, a.collector_run_id
from public.paid_media_actions a
join public.paid_media_collection_runs r
  on r.id = a.collector_run_id and r.status = 'complete'
order by
  a.channel, a.account_id, a.source, a.grain_level, a.entity_id,
  a.source_event_name, a.reported_attribution_window, a.attribution_policy_key, a.business_date,
  a.data_as_of desc, a.collected_at desc;


-- ---------------------------------------------------------------------
-- 4) VIEW de funil PRODUTIVA  gro ANNCIO, MEDIDA PRINCIPAL, runs completas.
--    Uma poltica por source. NUNCA soma gros, aliases nem janelas incompatveis.
-- ---------------------------------------------------------------------
create or replace view public.v_funnel_ad_latest
with (security_invoker = true) as
select
  l.business_date, l.account_id,
  l.campaign_id, l.campaign_name, l.ad_id, l.ad_name,
  em.funnel_stage, em.stage_order, em.canonical_event, em.alias_group,
  l.source, l.reported_attribution_window, l.effective_attribution_window, l.attribution_policy_key,
  l.value, l.cost_per_result, l.observation_status, em.confidence
from public.v_paid_media_actions_latest l
join public.event_map em
  on em.source = l.source
 and em.source_event_name = l.source_event_name
 and l.business_date between em.valid_from and coalesce(em.valid_to, date '2999-12-31')
where l.grain_level = 'ad'                     -- fato produtivo
  and em.is_primary_measure = true             -- evita dupla contagem de alias
  and (
        (l.source = 'meta_attributed' and l.reported_attribution_window = '7d_click') or
        (l.source = 'meta_results'    and l.reported_attribution_window = 'default')
      );


-- ---------------------------------------------------------------------
-- 5) VIEW de reconciliao (nome ASCII)  ad vs adset vs campanha.
--    S medida principal + runs completas. No redistribui; s expe diferenas.
-- ---------------------------------------------------------------------
create or replace view public.v_paid_media_actions_reconciliation
with (security_invoker = true) as
with base as (
  select l.business_date, l.account_id, l.campaign_id, l.source, l.source_event_name,
         l.reported_attribution_window, l.attribution_policy_key, l.grain_level, l.value
  from public.v_paid_media_actions_latest l
  join public.event_map em
    on em.source = l.source and em.source_event_name = l.source_event_name
   and em.is_primary_measure = true
  where l.value is not null
),
ad_sum as (
  select business_date, account_id, campaign_id, source, source_event_name,
         reported_attribution_window, attribution_policy_key, sum(value) as ad_sum
  from base where grain_level='ad' group by 1,2,3,4,5,6,7
),
adset_v as (
  select business_date, account_id, campaign_id, source, source_event_name,
         reported_attribution_window, attribution_policy_key, sum(value) as adset_val
  from base where grain_level='adset' group by 1,2,3,4,5,6,7
),
camp_v as (
  select business_date, account_id, campaign_id, source, source_event_name,
         reported_attribution_window, attribution_policy_key, sum(value) as campaign_val
  from base where grain_level='campaign' group by 1,2,3,4,5,6,7
)
select
  coalesce(a.business_date, s.business_date, c.business_date)              as business_date,
  coalesce(a.campaign_id, s.campaign_id, c.campaign_id)                   as campaign_id,
  coalesce(a.source, s.source, c.source)                                 as source,
  coalesce(a.source_event_name, s.source_event_name, c.source_event_name) as source_event_name,
  coalesce(a.attribution_policy_key, s.attribution_policy_key, c.attribution_policy_key) as attribution_policy_key,
  a.ad_sum, s.adset_val, c.campaign_val,
  (coalesce(a.ad_sum,0)    - coalesce(c.campaign_val,0)) as diff_ad_vs_campaign,
  (coalesce(s.adset_val,0) - coalesce(c.campaign_val,0)) as diff_adset_vs_campaign
from ad_sum a
full join adset_v s using (business_date, account_id, campaign_id, source, source_event_name, reported_attribution_window, attribution_policy_key)
full join camp_v  c using (business_date, account_id, campaign_id, source, source_event_name, reported_attribution_window, attribution_policy_key);


-- ---------------------------------------------------------------------
-- 6) RLS: read access for the dashboard, writes restricted to service_role.
-- ---------------------------------------------------------------------
alter table public.paid_media_actions          enable row level security;
alter table public.event_map                   enable row level security;
alter table public.paid_media_collection_runs  enable row level security;

-- revoga escrita de anon/authenticated (service_role no  afetado por grants de tabela do PostgREST)
revoke insert, update, delete on public.paid_media_actions          from anon, authenticated;
revoke insert, update, delete on public.event_map                   from anon, authenticated;
revoke insert, update, delete on public.paid_media_collection_runs  from anon, authenticated;

grant select on public.paid_media_actions to anon, authenticated;
grant select on public.event_map          to anon, authenticated;
grant select on public.paid_media_collection_runs to anon, authenticated;
grant select on public.v_paid_media_actions_latest,
                public.v_funnel_ad_latest,
                public.v_paid_media_actions_reconciliation to anon, authenticated;
grant all on public.paid_media_actions, public.event_map, public.paid_media_collection_runs to service_role;
grant usage, select on all sequences in schema public to service_role;

-- policies s de LEITURA (sem policy de escrita p/ service_role  ele bypassa RLS)
create policy pma_read on public.paid_media_actions for select to anon, authenticated
using (
  exists (
    select 1
    from public.paid_media_collection_runs r
    where r.id = collector_run_id and r.status = 'complete'
  )
);
create policy emap_read on public.event_map                  for select to anon, authenticated using (true);
create policy runs_read on public.paid_media_collection_runs for select to anon, authenticated using (status = 'complete');

-- Nenhum token/secret/payload sensvel deve ser gravado nestas tabelas.
-- =====================================================================
