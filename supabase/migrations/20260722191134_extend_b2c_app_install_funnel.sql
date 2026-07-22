-- Extend the certified B2C App Install family across its two Meta campaigns.
-- The literal action names were observed across the historical backfill. The
-- old campaign reports installs as its result; the onboarding campaign reports
-- StartTrial. These measures stay separate and retain their attribution policy.

update public.event_map
set valid_from = date '2026-04-06',
    notes = notes || '; vigencia retroativa validada no backfill da campanha App Install'
where source = 'meta_attributed'
  and source_event_name in (
    'link_click',
    'mobile_app_install',
    'omni_app_install',
    'app_custom_event.fb_mobile_activate_app',
    'omni_activate_app',
    'app_custom_event.fb_mobile_initiated_checkout',
    'omni_initiated_checkout',
    'initiate_checkout'
  );

insert into public.event_map
 (canonical_event, funnel_stage, stage_order, is_core_funnel, source,
  source_event_name, alias_group, alias_priority, is_primary_measure,
  valid_from, confidence, certified_at, notes)
values
 ('install','install',4,true,'meta_results','actions:mobile_app_install',
  'install',1,true,date '2026-04-06','trusted',now(),
  'Instalacao reportada como resultado da campanha [B2C]App_Install_Afinz; politica 1d_click+1d_view')
on conflict (source, source_event_name, valid_from) do nothing;

-- Reclassify the immutable raw literals already persisted. Values, windows and
-- provenance are untouched; only the canonical label is promoted.
update public.paid_media_actions a
set canonical_event = em.canonical_event
from public.event_map em
where a.source = em.source
  and a.source_event_name = em.source_event_name
  and a.business_date between em.valid_from and coalesce(em.valid_to, date '2999-12-31')
  and a.canonical_event is distinct from em.canonical_event;

create or replace view public.v_b2c_app_install_daily
with (security_invoker = true) as
with delivery as (
  select
    m.date as business_date,
    case
      when m.campaign = '[B2C]App_Install_Afinz' then 'app_install'
      else 'onboarding'
    end as campaign_phase,
    case
      when m.campaign = '[B2C]App_Install_Afinz' then '120210447970060723'
      else '120250049222750723'
    end as campaign_id,
    sum(coalesce(m.spend, 0))::numeric as spend,
    sum(coalesce(m.impressions, 0))::numeric as impressions,
    sum(coalesce(m.clicks, 0))::numeric as clicks_all,
    sum(coalesce(m.installs, 0))::numeric as legacy_installs,
    sum(coalesce(m.start_trials, 0))::numeric as legacy_start_trials
  from public.paid_media_metrics m
  where lower(m.channel) = 'meta'
    and (
      m.campaign = '[B2C]App_Install_Afinz'
      or m.campaign ilike '%[B2C]App_Install_Onboarding_Afinz%'
    )
  group by 1,2,3
), canonical as (
  select
    f.business_date,
    f.campaign_id,
    f.canonical_event,
    sum(f.value) filter (
      where f.observation_status in ('available','explicit_zero')
    )::numeric as value
  from public.v_funnel_ad_latest f
  where f.campaign_id in ('120210447970060723','120250049222750723')
  group by 1,2,3
), pivoted as (
  select
    business_date,
    campaign_id,
    max(value) filter (where canonical_event = 'link_click') as link_clicks,
    max(value) filter (where canonical_event = 'install') as canonical_installs,
    max(value) filter (where canonical_event = 'app_session') as app_sessions,
    max(value) filter (where canonical_event = 'initiated_checkout') as app_opened,
    max(value) filter (where canonical_event = 'start_trial') as start_trials
  from canonical
  group by 1,2
)
select
  d.business_date,
  d.campaign_phase,
  d.campaign_id,
  case d.campaign_phase
    when 'app_install' then '[B2C] App Install Afinz'
    else '[B2C] App Install Onboarding Afinz'
  end as campaign_label,
  d.spend,
  d.impressions,
  d.clicks_all,
  p.link_clicks,
  case
    when d.campaign_phase = 'app_install' then p.canonical_installs
    else d.legacy_installs
  end as installs,
  p.app_sessions,
  p.app_opened,
  case when d.campaign_phase = 'onboarding' then p.start_trials end as start_trials,
  (d.campaign_phase = 'onboarding') as start_trial_eligible,
  case d.campaign_phase
    when 'app_install' then 'Meta results · install · 1d click + 1d view'
    else 'Meta · campanha StartTrial · 7d click'
  end as attribution_label,
  case
    when d.campaign_phase = 'app_install' then 'meta_results'
    else 'paid_media_metrics'
  end as install_source,
  d.spend / nullif(
    case when d.campaign_phase = 'app_install' then p.canonical_installs else d.legacy_installs end,
    0
  ) as cpi,
  case when d.campaign_phase = 'onboarding'
    then d.spend / nullif(p.start_trials, 0)
  end as cost_per_start_trial
from delivery d
left join pivoted p
  on p.business_date = d.business_date and p.campaign_id = d.campaign_id;

grant select on public.v_b2c_app_install_daily to anon, authenticated;
