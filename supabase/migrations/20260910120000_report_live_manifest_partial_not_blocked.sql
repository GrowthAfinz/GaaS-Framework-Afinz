-- O manifesto descreve a limitacao; nao veta a publicacao.
--
-- Ate 10/09/2026 a ausencia de qualquer uma das tres fontes (CRM, midia, B2C)
-- zerava integrated_cutoff e o quality_status virava 'blocked'. Em
-- report-live-versioning.ts o gate manifest.publication_gate traduz 'blocked'
-- em "publicacao proibida" com severidade blocking. Resultado pratico: com B2C
-- ausente em agosto/2026, o relatorio inteiro ficava impublicavel, mesmo com
-- CRM completo (809 disparos, 31 dias, zero nulos) e Meta completo (31 dias).
--
-- Isso contraria a regra de produto: uma frente indisponivel nao deve bloquear
-- frentes independentes. Corrupcao de artefato e falha de autorizacao seguem
-- bloqueantes.
--
-- integrated_cutoff continua null quando falta fonte — correto e honesto: nao
-- existe leitura integrada sem as tres. O que muda e a consequencia.
--
--   blocked -> so quando nao ha CRM (esqueleto do deck; sem ele so ha status).
--   suspect -> ha conteudo, mas falta fonte: frentes independentes renderizam e
--              a leitura integrada fica indisponivel.
--
-- Verificado apos aplicar: agosto/2026 sai de 'blocked' para 'suspect' com
-- missing_sources ["b2c"]; junho/2026 permanece 'confirmed' (sem regressao).
--
-- O corpo completo da funcao esta versionado aqui; foi aplicado via
-- apply_migration em 10/09/2026 com o mesmo conteudo.

create or replace function public.report_live_source_manifest(p_period_start date, p_period_end date)
 returns jsonb
 language sql
 stable security definer
 set search_path to 'public'
as $function$
with cutoffs as (
  select
    (select max(("Data de Disparo" at time zone 'America/Sao_Paulo')::date)
       from activities
      where ("Data de Disparo" at time zone 'America/Sao_Paulo')::date between p_period_start and p_period_end) as crm_cutoff,
    (select max(date) from paid_media_metrics
      where date between p_period_start and p_period_end) as media_cutoff,
    (select max(data) from b2c_daily_metrics
      where data between p_period_start and p_period_end) as b2c_cutoff,
    (select max(("Data de Disparo" at time zone 'America/Sao_Paulo')::date)
       from rentabilizacao_activities
      where ("Data de Disparo" at time zone 'America/Sao_Paulo')::date between p_period_start and p_period_end) as insurance_cutoff
),
integrated as (
  select
    case when crm_cutoff is null or media_cutoff is null or b2c_cutoff is null then null
         else least(crm_cutoff, media_cutoff, b2c_cutoff) end as integrated_cutoff,
    case when crm_cutoff is null or media_cutoff is null or b2c_cutoff is null then null
         else greatest(crm_cutoff, media_cutoff, b2c_cutoff)
            - least(crm_cutoff, media_cutoff, b2c_cutoff) end as gap_days,
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
  select count(*) as media_rows,
         count(*) filter (where frequency is not null) as frequency_rows,
         count(*) filter (where ad_id is not null and btrim(ad_id) <> '') as creative_rows
  from paid_media_metrics where date between p_period_start and p_period_end
),
event_coverage as (
  select count(*) as event_rows,
         count(*) filter (where canonical_event is not null and btrim(canonical_event) <> '') as named_event_rows,
         count(*) filter (where effective_attribution_window is not null and btrim(effective_attribution_window) <> '') as attribution_rows
  from paid_media_actions where business_date between p_period_start and p_period_end
),
mapping_coverage as (
  select (select count(*) from communication_slots) as slot_rows,
         (select count(*) from communication_slots where current_template_id is not null and btrim(current_template_id) <> '') as mapped_slot_rows,
         (select count(*) from communication_templates) as template_rows
),
quality_cfg as (
  select coalesce((value ->> 'max_cutoff_gap_days')::integer, 2) as max_gap
  from report_live_config where key = 'quality'
),
comparability_cfg as (
  select coalesce((value ->> 'crm_equivalence_certified')::boolean, false) as crm_equivalence_certified
  from report_live_config where key = 'b2c_comparability'
)
select jsonb_build_object(
  'period_start', p_period_start,
  'period_end', p_period_end,
  'source_cutoffs', jsonb_build_object(
    'crm', i.crm_cutoff, 'media', i.media_cutoff,
    'b2c', i.b2c_cutoff, 'insurance', i.insurance_cutoff),
  'data_reading_integrated', i.integrated_cutoff,
  'gap_closure_days', i.gap_days,
  'integrated_reading_available', (i.integrated_cutoff is not null),
  'missing_sources', coalesce(
    (select jsonb_agg(fonte order by fonte)
       from (select 'crm' as fonte where i.crm_cutoff is null
             union all select 'media' where i.media_cutoff is null
             union all select 'b2c' where i.b2c_cutoff is null) faltantes),
    '[]'::jsonb),
  'quality_status', case
    when i.crm_cutoff is null then 'blocked'
    when i.integrated_cutoff is null then 'suspect'
    when i.gap_days > q.max_gap then 'suspect'
    when i.integrated_cutoff < p_period_end then 'directional'
    else 'confirmed' end,
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
    'communication_templates', mc.template_rows),
  'comparability', jsonb_build_object(
    'b2c_crm_equivalence_certified', cc.crm_equivalence_certified,
    'crm_vs_b2c_rule', case when cc.crm_equivalence_certified
      then 'comparable_not_additive' else 'directional_not_reconciled' end,
    'serasa_rule', 'separate_origin_never_add')
)
from integrated i
cross join coverage c cross join media_coverage m cross join event_coverage e
cross join mapping_coverage mc cross join quality_cfg q cross join comparability_cfg cc;
$function$;
