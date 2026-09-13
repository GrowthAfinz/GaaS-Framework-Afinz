-- Report Live v1.0 foundation
-- Source of truth: MASTER_DECK_SPEC.md
-- This migration adds deterministic run manifests, slide eligibility,
-- canonical campaign identity, and the governed action/outcome loop.

alter table public.report_runs
  add column if not exists report_profile text not null default 'monthly_report',
  add column if not exists spec_version text not null default '1.0',
  add column if not exists data_reading_integrated date,
  add column if not exists source_cutoffs jsonb not null default '{}'::jsonb,
  add column if not exists gap_closure_days integer,
  add column if not exists quality_status text,
  add column if not exists run_manifest jsonb not null default '{}'::jsonb,
  add column if not exists slide_counts jsonb not null default '{}'::jsonb,
  add column if not exists publication_valid boolean not null default false;

create table if not exists public.report_live_config (
  key text primary key,
  value jsonb not null,
  description text,
  updated_at timestamptz not null default now()
);

insert into public.report_live_config (key, value, description)
values
  (
    'materiality',
    '{"card_share_full":0.05,"min_segments_for_variety":2,"min_channels_for_variety":2,"strategic_partners":[],"excluded_partners":["N/A","n/a",""]}'::jsonb,
    'Configuração calibrável do router de parceiros. Não confundir threshold com decisão editorial.'
  ),
  (
    'quality',
    '{"max_cutoff_gap_days":2,"minimum_execution_rows":3,"minimum_field_coverage":0.8}'::jsonb,
    'Thresholds versionados usados pelo manifesto e pelos chips de confiança.'
  ),
  (
    'b2c_comparability',
    '{"crm_equivalence_certified":false,"crm_equivalence_note":"Aguardando confirmação operacional de que B2C tipo=CRM é semanticamente equivalente a cartões CRM."}'::jsonb,
    'A comparação é exibida, mas não reconciliada enquanto a equivalência não for certificada.'
  ),
  (
    'media_attribution',
    '{"policy_certified":false,"display_rule":"Exibir janela nativa por evento; não fundir eventos ou janelas por similaridade."}'::jsonb,
    'Política oficial de atribuição ainda depende de decisão operacional.'
  )
on conflict (key) do nothing;

create table if not exists public.report_slide_contracts (
  slide_code text primary key,
  section text not null,
  title text not null,
  audience text not null,
  source_view text,
  required_fields jsonb not null default '[]'::jsonb,
  optional_fields jsonb not null default '[]'::jsonb,
  fallback_view text,
  implementation_readiness text not null,
  conditional boolean not null default false,
  display_order integer not null,
  active boolean not null default true,
  updated_at timestamptz not null default now(),
  constraint report_slide_contracts_readiness_check check (
    implementation_readiness in (
      'pronto_dado',
      'parcial_modelagem',
      'bloqueado_snapshot',
      'bloqueado_fonte',
      'bloqueado_produtor'
    )
  )
);

insert into public.report_slide_contracts
  (slide_code, section, title, audience, source_view, required_fields, optional_fields, fallback_view, implementation_readiness, conditional, display_order)
values
  ('C0','core','Capa & contrato do snapshot','todos','VIEW_RUN_MANIFEST','["run_id","period_start","period_end","source_cutoffs"]','["briefing_version"]',null,'parcial_modelagem',false,0),
  ('C1','core','Leitura executiva do período','executivo','VIEW_EXECUTIVE_READING','["run_manifest","core_kpis"]','["narrative_registry"]','VIEW_SCORECARD_INTEGRATED','parcial_modelagem',false,1),
  ('C2','core','Integridade, cobertura e comparabilidade','executivo','VIEW_COVERAGE_COMPARABILITY','["source_cutoffs","field_coverage"]','["b2c_crm_equivalence"]',null,'parcial_modelagem',false,2),
  ('C3','core','Scorecard integrado de aquisição','executivo','VIEW_SCORECARD_INTEGRATED','["crm_cards","crm_cost","media_spend"]','["certified_goals"]',null,'pronto_dado',false,3),
  ('C4','core','Ritmo vs período equivalente e meta','executivo','VIEW_PACING_ISODAYS','["daily_metrics","previous_equivalent_period"]','["certified_goals","certified_budgets"]',null,'parcial_modelagem',false,4),
  ('C5','core','Router de parceiros','executivo_gestor','VIEW_PARTNER_ROUTER','["partner_rollup","materiality_config"]','["strategic_partner_flags"]',null,'parcial_modelagem',false,5),
  ('C6','core','Drivers, dispersão de CAC e oportunidades','executivo_gestor','VIEW_CAC_DRIVERS','["crm_cards","crm_cost","crm_base"]','["cac_max"]',null,'pronto_dado',false,6),
  ('C7','core','Resultado das ações anteriores','executivo','VIEW_ACTION_OUTCOMES','["approved_actions","outcomes"]','[]',null,'bloqueado_produtor',false,7),
  ('C8','core','Fila consolidada de decisão','executivo_gestor','VIEW_ACTION_QUEUE','["action_candidates"]','["approved_actions"]',null,'bloqueado_produtor',false,8),
  ('P1','partner','Resultado & contribuição','gestor','VIEW_PARTNER_RESULT','["partner","crm_cards","crm_cost"]','["safra"]',null,'parcial_modelagem',false,101),
  ('P2','partner','Segmentos','gestor','VIEW_PARTNER_SEGMENTS','["partner","segment","crm_cards","crm_base"]','["crm_cost"]',null,'pronto_dado',false,102),
  ('P3','partner','Canais','gestor','VIEW_PARTNER_CHANNELS','["partner","channel","segment","crm_cards"]','["channel_cost"]','VIEW_PARTNER_CHANNELS_TOTAL_COST','bloqueado_snapshot',false,103),
  ('P4','partner','Funil','gestor_analista','VIEW_PARTNER_FUNNEL','["partner","crm_base","proposals","approved","crm_cards"]','["safra"]',null,'pronto_dado',false,104),
  ('P5','partner','Campanhas, jornadas e disparos','gestor_analista','VIEW_PARTNER_CAMPAIGNS','["partner","activity_name","journey","crm_base","crm_cards"]','["safra","template_id","opens","clicks","delivery_rate"]',null,'bloqueado_snapshot',false,105),
  ('P6','partner','Pressão de contato & qualidade','gestor','VIEW_PARTNER_PRESSURE_PROXY','["partner","segment","dispatch_count","crm_base"]','["anonymous_user_frequency","unsubscribe"]',null,'bloqueado_fonte',true,106),
  ('P7','partner','Ação prioritária do parceiro','gestor','VIEW_ACTION_QUEUE','["partner_action_candidate"]','[]',null,'bloqueado_produtor',false,107),
  ('M1','media','Pacing por objetivo','gestor','VIEW_MEDIA_PACING','["media_spend","objective"]','["certified_budget"]',null,'pronto_dado',false,201),
  ('M2','media','Mix & dependência de plataformas','gestor','VIEW_MEDIA_MIX','["channel","objective","media_spend","impressions","clicks"]','["reach","frequency","named_event"]',null,'bloqueado_snapshot',false,202),
  ('M3','media','Ranking canônico de campanhas','gestor_analista','VIEW_MEDIA_CAMPAIGNS','["canonical_campaign_id","media_spend","named_event"]','["source_aliases"]',null,'parcial_modelagem',false,203),
  ('M4','media','Funil de eventos por campanha','analista','VIEW_MEDIA_FUNNEL','["campaign","impressions","clicks","installs","start_trials"]','["canonical_campaign_id"]',null,'bloqueado_snapshot',false,204),
  ('M5','media','Criativos: fadiga & frequência','gestor','VIEW_MEDIA_CREATIVES','["ad_id","impressions","clicks","frequency"]','["named_event"]',null,'bloqueado_snapshot',true,205),
  ('M6','media','Tracking & qualidade','analista','VIEW_MEDIA_QUALITY','["collection_runs","event_coverage"]','["attribution_window"]',null,'parcial_modelagem',false,206),
  ('M7','media','Ação de mídia','gestor','VIEW_ACTION_QUEUE','["media_action_candidate"]','[]',null,'bloqueado_produtor',false,207),
  ('B1','b2c','Funis em paralelo','gestor','VIEW_B2C_PARALLEL_FUNNELS','["b2c_type","b2c_proposals","b2c_emissions","crm_cards"]','["crm_equivalence_certified"]',null,'parcial_modelagem',false,301),
  ('B2','b2c','Tendência diária & origem','gestor','VIEW_B2C_DAILY','["date","b2c_type","b2c_proposals","b2c_emissions"]','[]',null,'pronto_dado',false,302),
  ('B3','b2c','Cobertura & limites de reconciliação','analista','VIEW_COVERAGE_COMPARABILITY','["source_cutoffs","field_coverage"]','["crm_equivalence_certified"]',null,'parcial_modelagem',false,303),
  ('K-VISA','conditional','Copa / LP / opt-in','gestor','VIEW_VISA_OPTIN','["visa_coverage"]','["optin"]',null,'pronto_dado',true,401),
  ('K-SEG','conditional','Seguros','gestor','VIEW_INSURANCE_SUMMARY','["insurance_source"]','["media_spend","crm_metrics"]',null,'parcial_modelagem',true,402),
  ('K-TPL','conditional','Templates e slots','gestor','VIEW_TEMPLATE_COVERAGE','["activities_template_coverage","slot_mapping_coverage"]','[]',null,'bloqueado_snapshot',false,403),
  ('K-EXP','conditional','Experimentos','analista','VIEW_EXPERIMENTS','["valid_experiment"]','[]',null,'bloqueado_fonte',true,404),
  ('K-QLT','conditional','Incidentes de qualidade','analista','VIEW_QUALITY_INCIDENTS','["collection_incident"]','[]',null,'parcial_modelagem',true,405),
  ('A1','annex','Matriz frente × parceiro × segmento','analista','VIEW_GROWTH_MATRIX','["bu","partner","segment"]','[]',null,'pronto_dado',false,501),
  ('A2','annex','Dicionário de métricas','analista','VIEW_METRIC_DICTIONARY','["metric_definition"]','[]',null,'pronto_dado',false,502),
  ('A3','annex','Regras de agregação','analista','VIEW_AGGREGATION_RULES','["aggregation_rule"]','[]',null,'pronto_dado',false,503),
  ('A4','annex','Matriz de cobertura de campos','analista','VIEW_FIELD_COVERAGE','["field_consumer_or_exclusion"]','[]',null,'pronto_dado',false,504),
  ('A5','annex','Logs de coleta','analista','VIEW_COLLECTION_LOGS','["collection_runs"]','[]',null,'pronto_dado',false,505),
  ('A6','annex','Mapeamentos e aliases','analista','VIEW_CAMPAIGN_ALIASES','["campaign_alias"]','[]',null,'parcial_modelagem',false,506),
  ('A7','annex','Critérios de confiança','analista','VIEW_CONFIDENCE_RULES','["quality_config"]','[]',null,'pronto_dado',false,507)
on conflict (slide_code) do update set
  section = excluded.section,
  title = excluded.title,
  audience = excluded.audience,
  source_view = excluded.source_view,
  required_fields = excluded.required_fields,
  optional_fields = excluded.optional_fields,
  fallback_view = excluded.fallback_view,
  implementation_readiness = excluded.implementation_readiness,
  conditional = excluded.conditional,
  display_order = excluded.display_order,
  active = excluded.active,
  updated_at = now();

create table if not exists public.report_slide_runs (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.report_runs(id) on delete cascade,
  slide_instance_id text not null,
  slide_code text not null references public.report_slide_contracts(slide_code),
  partner text,
  source_view text,
  implementation_readiness text not null,
  run_eligibility text not null,
  confidence_status text not null,
  confidence_label text not null,
  data_coverage numeric,
  cutoff_maturity numeric,
  execution_volume numeric,
  missing_required_fields jsonb not null default '[]'::jsonb,
  fallback_applied text,
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (run_id, slide_instance_id),
  constraint report_slide_runs_eligibility_check check (
    run_eligibility in ('render','render_com_limites','omitir_bloqueado')
  ),
  constraint report_slide_runs_confidence_check check (
    confidence_status in ('confirmed','directional','suspect','blocked')
  )
);

create table if not exists public.canonical_paid_media_campaigns (
  canonical_campaign_id text primary key,
  display_name text not null,
  platform text not null,
  canonical_objective text,
  optimization_event text,
  cpa_event text,
  certification_status text not null default 'source_id_only',
  certified_by uuid,
  certified_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint canonical_paid_media_campaigns_status_check check (
    certification_status in ('source_id_only','pending_review','certified','rejected')
  )
);

create table if not exists public.paid_media_campaign_aliases (
  id uuid primary key default gen_random_uuid(),
  canonical_campaign_id text not null references public.canonical_paid_media_campaigns(canonical_campaign_id) on delete cascade,
  platform text not null,
  source_campaign_id text,
  source_campaign_name text not null,
  alias_normalized text generated always as (
    lower(regexp_replace(trim(source_campaign_name), '\s+', ' ', 'g'))
  ) stored,
  source_system text not null default 'paid_media_actions',
  certification_status text not null default 'source_exact',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint paid_media_campaign_aliases_status_check check (
    certification_status in ('source_exact','pending_review','certified','rejected')
  ),
  unique (platform, source_campaign_id, source_campaign_name)
);

create index if not exists paid_media_campaign_aliases_normalized_idx
  on public.paid_media_campaign_aliases(platform, alias_normalized);

create table if not exists public.report_action_candidates (
  action_candidate_id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.report_runs(id) on delete cascade,
  source_view text not null,
  entity_key text not null,
  signal_code text not null,
  domain text not null,
  partner text,
  bucket text not null,
  signal text not null,
  impact text,
  probable_cause text,
  evidence_refs jsonb not null default '[]'::jsonb,
  reading_limit text,
  action_text text,
  owner text,
  due_date date,
  success_metric text,
  confidence_status text not null,
  generated_by text not null,
  review_status text not null default 'pending',
  status text not null default 'candidate',
  posterior_result text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (run_id, entity_key, signal_code),
  constraint report_action_candidates_bucket_check check (
    bucket in ('Agir hoje','Acompanhar','Investigar')
  ),
  constraint report_action_candidates_confidence_check check (
    confidence_status in ('confirmed','directional','suspect','blocked')
  ),
  constraint report_action_candidates_review_check check (
    review_status in ('pending','approved','rejected','needs_changes')
  )
);

create table if not exists public.report_action_outcomes (
  id uuid primary key default gen_random_uuid(),
  action_candidate_id uuid not null references public.report_action_candidates(action_candidate_id) on delete cascade,
  metric_name text not null,
  baseline_value numeric,
  expected_value numeric,
  observed_value numeric,
  unit text,
  window_start date not null,
  window_end date not null,
  evaluated_at timestamptz,
  outcome_status text not null default 'window_open',
  conclusion text,
  reviewed_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint report_action_outcomes_status_check check (
    outcome_status in ('window_open','positive','neutral','negative','inconclusive')
  )
);

create table if not exists public.report_metric_certifications (
  id uuid primary key default gen_random_uuid(),
  metric_domain text not null,
  metric_key text not null,
  period_key text not null,
  source_table text not null,
  source_record_id text,
  target_value numeric,
  unit text,
  certification_status text not null default 'pending',
  version integer not null default 1,
  certified_by uuid,
  certified_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (metric_domain, metric_key, period_key, version),
  constraint report_metric_certifications_status_check check (
    certification_status in ('pending','certified','rejected','expired')
  )
);

-- Source IDs are safe provisional identities. This deliberately does not merge
-- campaigns by textual similarity. Human certification can later promote them.
insert into public.canonical_paid_media_campaigns (
  canonical_campaign_id,
  display_name,
  platform,
  canonical_objective,
  certification_status,
  metadata
)
select distinct on (lower(channel), campaign_id)
  lower(channel) || ':' || campaign_id,
  coalesce(nullif(btrim(campaign_name), ''), campaign_id),
  lower(channel),
  null,
  'source_id_only',
  jsonb_build_object('seed_source', 'paid_media_actions')
from public.paid_media_actions
where campaign_id is not null
  and btrim(campaign_id) <> ''
order by lower(channel), campaign_id, collected_at desc
on conflict (canonical_campaign_id) do nothing;

insert into public.paid_media_campaign_aliases (
  canonical_campaign_id,
  platform,
  source_campaign_id,
  source_campaign_name,
  source_system,
  certification_status
)
select distinct
  lower(channel) || ':' || campaign_id,
  lower(channel),
  campaign_id,
  campaign_name,
  'paid_media_actions',
  'source_exact'
from public.paid_media_actions
where campaign_id is not null
  and btrim(campaign_id) <> ''
  and campaign_name is not null
  and btrim(campaign_name) <> ''
on conflict (platform, source_campaign_id, source_campaign_name) do nothing;

-- Existing targets remain pending until the operation certifies owner, period
-- and version. Pending rows are visible in A4, but never drawn as official goals.
insert into public.report_metric_certifications (
  metric_domain,
  metric_key,
  period_key,
  source_table,
  source_record_id,
  target_value,
  unit,
  certification_status,
  notes
)
select
  'crm_goal',
  concat_ws('|', coalesce(nullif(btrim(bu), ''), 'total'), coalesce(nullif(btrim(segmento), ''), 'all')),
  coalesce(
    case
      when ano is not null and mes ~ '^[0-9]{1,2}$'
        then ano::text || '-' || lpad(mes, 2, '0')
      when ano is not null and mes ~ '^[0-9]{4}-[0-9]{2}$'
        then mes
      when ano is not null and lower(coalesce(mes, '')) in (
        'janeiro','fevereiro','marco','março','abril','maio','junho',
        'julho','agosto','setembro','outubro','novembro','dezembro'
      )
        then ano::text || '-' || case lower(mes)
          when 'janeiro' then '01'
          when 'fevereiro' then '02'
          when 'marco' then '03'
          when 'março' then '03'
          when 'abril' then '04'
          when 'maio' then '05'
          when 'junho' then '06'
          when 'julho' then '07'
          when 'agosto' then '08'
          when 'setembro' then '09'
          when 'outubro' then '10'
          when 'novembro' then '11'
          when 'dezembro' then '12'
        end
      else null
    end,
    ano::text
  ),
  'goals',
  id::text,
  cartoes_meta,
  'cards',
  'pending',
  'Importado da fonte existente; requer certificação operacional antes de uso no deck.'
from public.goals
where cartoes_meta is not null
  and ano is not null
on conflict (metric_domain, metric_key, period_key, version) do nothing;

insert into public.report_metric_certifications (
  metric_domain,
  metric_key,
  period_key,
  source_table,
  source_record_id,
  target_value,
  unit,
  certification_status,
  notes
)
select
  'media_budget',
  concat_ws('|', coalesce(nullif(btrim(channel), ''), 'all'), objective),
  month,
  'paid_media_budgets',
  id::text,
  budget,
  'BRL',
  'pending',
  'Importado da fonte existente; requer certificação operacional antes de pacing oficial.'
from public.paid_media_budgets
where budget is not null
on conflict (metric_domain, metric_key, period_key, version) do nothing;

insert into public.report_metric_certifications (
  metric_domain,
  metric_key,
  period_key,
  source_table,
  source_record_id,
  target_value,
  unit,
  certification_status,
  notes
)
select
  'media_target',
  coalesce(
    nullif(btrim(entity_key), ''),
    concat_ws('|', coalesce(nullif(btrim(channel), ''), 'all'), coalesce(nullif(btrim(objective), ''), 'all'), metric)
  ),
  month,
  'paid_media_targets',
  id::text,
  target_value,
  metric,
  'pending',
  'Importado da fonte existente; requer certificação operacional antes de uso no deck.'
from public.paid_media_targets
where target_value is not null
on conflict (metric_domain, metric_key, period_key, version) do nothing;

create or replace function public.report_live_source_manifest(
  p_period_start date,
  p_period_end date
)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
with cutoffs as (
  select
    (
      select max(("Data de Disparo" at time zone 'America/Sao_Paulo')::date)
      from activities
      where ("Data de Disparo" at time zone 'America/Sao_Paulo')::date between p_period_start and p_period_end
    ) as crm_cutoff,
    (
      select max(date)
      from paid_media_metrics
      where date between p_period_start and p_period_end
    ) as media_cutoff,
    (
      select max(data)
      from b2c_daily_metrics
      where data between p_period_start and p_period_end
    ) as b2c_cutoff,
    (
      select max(("Data de Disparo" at time zone 'America/Sao_Paulo')::date)
      from rentabilizacao_activities
      where ("Data de Disparo" at time zone 'America/Sao_Paulo')::date between p_period_start and p_period_end
    ) as insurance_cutoff
),
integrated as (
  select
    case
      when crm_cutoff is null or media_cutoff is null or b2c_cutoff is null then null
      else least(crm_cutoff, media_cutoff, b2c_cutoff)
    end as integrated_cutoff,
    case
      when crm_cutoff is null or media_cutoff is null or b2c_cutoff is null then null
      else greatest(crm_cutoff, media_cutoff, b2c_cutoff)
        - least(crm_cutoff, media_cutoff, b2c_cutoff)
    end as gap_days,
    *
  from cutoffs
),
coverage as (
  select
    count(*) filter (where ("Data de Disparo" at time zone 'America/Sao_Paulo')::date between p_period_start and p_period_end) as crm_rows,
    count(*) filter (where ("Data de Disparo" at time zone 'America/Sao_Paulo')::date between p_period_start and p_period_end and template_id is not null and btrim(template_id) <> '') as crm_template_rows,
    count(*) filter (where ("Data de Disparo" at time zone 'America/Sao_Paulo')::date between p_period_start and p_period_end and "Abertura" is not null) as crm_open_rows,
    count(*) filter (where ("Data de Disparo" at time zone 'America/Sao_Paulo')::date between p_period_start and p_period_end and "Cliques" is not null) as crm_click_rows
  from activities
),
media_coverage as (
  select
    count(*) as media_rows,
    count(*) filter (where frequency is not null) as frequency_rows,
    count(*) filter (where ad_id is not null and btrim(ad_id) <> '') as creative_rows
  from paid_media_metrics
  where date between p_period_start and p_period_end
),
event_coverage as (
  select
    count(*) as event_rows,
    count(*) filter (where canonical_event is not null and btrim(canonical_event) <> '') as named_event_rows,
    count(*) filter (where effective_attribution_window is not null and btrim(effective_attribution_window) <> '') as attribution_rows
  from paid_media_actions
  where business_date between p_period_start and p_period_end
),
mapping_coverage as (
  select
    (select count(*) from communication_slots) as slot_rows,
    (select count(*) from communication_slots where current_template_id is not null and btrim(current_template_id) <> '') as mapped_slot_rows,
    (select count(*) from communication_templates) as template_rows
),
quality_cfg as (
  select coalesce((value ->> 'max_cutoff_gap_days')::integer, 2) as max_gap
  from report_live_config
  where key = 'quality'
),
comparability_cfg as (
  select coalesce((value ->> 'crm_equivalence_certified')::boolean, false) as crm_equivalence_certified
  from report_live_config
  where key = 'b2c_comparability'
)
select jsonb_build_object(
  'period_start', p_period_start,
  'period_end', p_period_end,
  'source_cutoffs', jsonb_build_object(
    'crm', i.crm_cutoff,
    'media', i.media_cutoff,
    'b2c', i.b2c_cutoff,
    'insurance', i.insurance_cutoff
  ),
  'data_reading_integrated', i.integrated_cutoff,
  'gap_closure_days', i.gap_days,
  'quality_status', case
    when i.integrated_cutoff is null then 'blocked'
    when i.gap_days > q.max_gap then 'suspect'
    when i.integrated_cutoff < p_period_end then 'directional'
    else 'confirmed'
  end,
  'field_coverage', jsonb_build_object(
    'crm_rows', c.crm_rows,
    'crm_template', case when c.crm_rows = 0 then null else round(c.crm_template_rows::numeric / c.crm_rows, 4) end,
    'crm_open', case when c.crm_rows = 0 then null else round(c.crm_open_rows::numeric / c.crm_rows, 4) end,
    'crm_click', case when c.crm_rows = 0 then null else round(c.crm_click_rows::numeric / c.crm_rows, 4) end,
    'media_rows', m.media_rows,
    'media_frequency', case when m.media_rows = 0 then null else round(m.frequency_rows::numeric / m.media_rows, 4) end,
    'media_creative_id', case when m.media_rows = 0 then null else round(m.creative_rows::numeric / m.media_rows, 4) end,
    'media_event_rows', e.event_rows,
    'media_named_event', case when e.event_rows = 0 then null else round(e.named_event_rows::numeric / e.event_rows, 4) end,
    'media_attribution_window', case when e.event_rows = 0 then null else round(e.attribution_rows::numeric / e.event_rows, 4) end,
    'communication_slots', mc.slot_rows,
    'communication_slots_mapped', mc.mapped_slot_rows,
    'communication_slot_coverage', case when mc.slot_rows = 0 then null else round(mc.mapped_slot_rows::numeric / mc.slot_rows, 4) end,
    'communication_templates', mc.template_rows
  ),
  'comparability', jsonb_build_object(
    'b2c_crm_equivalence_certified', cc.crm_equivalence_certified,
    'crm_vs_b2c_rule', case
      when cc.crm_equivalence_certified then 'comparable_not_additive'
      else 'directional_not_reconciled'
    end,
    'serasa_rule', 'separate_origin_never_add'
  )
)
from integrated i
cross join coverage c
cross join media_coverage m
cross join event_coverage e
cross join mapping_coverage mc
cross join quality_cfg q
cross join comparability_cfg cc;
$$;

create or replace function public.report_live_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists report_live_config_updated_at on public.report_live_config;
create trigger report_live_config_updated_at
before update on public.report_live_config
for each row execute function public.report_live_set_updated_at();

drop trigger if exists canonical_paid_media_campaigns_updated_at on public.canonical_paid_media_campaigns;
create trigger canonical_paid_media_campaigns_updated_at
before update on public.canonical_paid_media_campaigns
for each row execute function public.report_live_set_updated_at();

drop trigger if exists paid_media_campaign_aliases_updated_at on public.paid_media_campaign_aliases;
create trigger paid_media_campaign_aliases_updated_at
before update on public.paid_media_campaign_aliases
for each row execute function public.report_live_set_updated_at();

drop trigger if exists report_action_candidates_updated_at on public.report_action_candidates;
create trigger report_action_candidates_updated_at
before update on public.report_action_candidates
for each row execute function public.report_live_set_updated_at();

drop trigger if exists report_action_outcomes_updated_at on public.report_action_outcomes;
create trigger report_action_outcomes_updated_at
before update on public.report_action_outcomes
for each row execute function public.report_live_set_updated_at();

drop trigger if exists report_metric_certifications_updated_at on public.report_metric_certifications;
create trigger report_metric_certifications_updated_at
before update on public.report_metric_certifications
for each row execute function public.report_live_set_updated_at();

alter table public.report_live_config enable row level security;
alter table public.report_slide_contracts enable row level security;
alter table public.report_slide_runs enable row level security;
alter table public.canonical_paid_media_campaigns enable row level security;
alter table public.paid_media_campaign_aliases enable row level security;
alter table public.report_action_candidates enable row level security;
alter table public.report_action_outcomes enable row level security;
alter table public.report_metric_certifications enable row level security;

revoke all on function public.report_live_source_manifest(date, date) from public, anon;
grant execute on function public.report_live_source_manifest(date, date) to authenticated, service_role;

comment on function public.report_live_source_manifest(date, date) is
  'Deterministic Report Live run manifest: native cutoffs, integrated cutoff, coverage and comparability. Never converts missing to zero.';
