-- Estende copa_app_install_attribution_snapshot com canonical_start_trials e
-- popula a fase Onboarding/StartTrial da ação Copa (campaign_id 120250049222750723,
-- "[B2C]App_Install_Onboarding_Afinz"), que faltava por completo.
--
-- Motivo do gap: paid_media_metrics.installs/start_trials estão zerados para esta
-- campanha (mesmo gap de instrumentação documentado para a fase App Install) — o
-- dado real só existe em v_funnel_ad_latest (pipeline de atribuição). Diferente do
-- que ocorreu com a campanha App Install, aqui a query por campaign_name não
-- estourou o statement_timeout (campaign_id é seletivo o bastante nesta tabela para
-- este caso) — mesmo assim optamos por manter o mesmo padrão de snapshot
-- pré-computado, para não expor o export do relatório a uma query ao vivo na
-- tabela de atribuição.
--
-- Backfill (v_funnel_ad_latest, 13/04/2026 a 15/08/2026): 55 dias com dado,
-- 239 installs, 163 start_trials.

alter table copa_app_install_attribution_snapshot
  add column if not exists canonical_start_trials integer;

comment on column copa_app_install_attribution_snapshot.canonical_start_trials is
  'Installs/start_trials canônicos (via v_funnel_ad_latest) — usado pela fase onboarding (start_trial); app_install usa apenas canonical_installs.';

insert into copa_app_install_attribution_snapshot (business_date, campaign_id, campaign_phase, canonical_installs, canonical_start_trials, raw_payload)
select
  f.business_date,
  f.campaign_id,
  'onboarding' as campaign_phase,
  sum(f.value) filter (where f.canonical_event = 'install' and f.observation_status in ('available', 'explicit_zero')) as canonical_installs,
  sum(f.value) filter (where f.canonical_event = 'start_trial' and f.observation_status in ('available', 'explicit_zero')) as canonical_start_trials,
  jsonb_build_object('source', 'v_funnel_ad_latest backfill onboarding', 'loaded_on', '2026-09-01')
from v_funnel_ad_latest f
where f.campaign_name = '[B2C]App_Install_Onboarding_Afinz'
  and f.business_date between '2026-04-13' and '2026-08-15'
group by f.business_date, f.campaign_id
on conflict (business_date, campaign_id) do update set
  campaign_phase = excluded.campaign_phase,
  canonical_installs = excluded.canonical_installs,
  canonical_start_trials = excluded.canonical_start_trials,
  raw_payload = excluded.raw_payload,
  updated_at = now();
