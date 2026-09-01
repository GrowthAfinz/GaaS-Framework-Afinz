-- Estende copa_app_install_attribution_snapshot (ver migration
-- 20260824180000_copa_app_install_attribution_snapshot.sql) com a janela PRÉ-COPA
-- (06/04/2026 a 12/04/2026) da mesma campanha "[B2C]App_Install_Afinz" — os 7 dias
-- imediatamente antes do início da ação Copa (13/04/2026).
--
-- Motivo: o comparativo de mídia paga da Aquisição Copa precisa de um CPI de
-- referência genuíno. `paid_media_metrics.installs` está zerado para todas as
-- outras campanhas de aquisição (nenhuma tinha o pipeline de atribuição
-- instrumentado) — a única fonte real de installs é v_funnel_ad_latest, e ela só
-- tem dados para a própria campanha App Install/Onboarding Afinz. A janela
-- pré-Copa dessa MESMA campanha (antes de virar a campanha da ação) é a
-- referência mais correta disponível: mesmo público/criativo, sem o boost da Copa.
--
-- Backfill (v_funnel_ad_latest, 06/04 a 12/04/2026): 1.053 installs em 7 dias.

insert into copa_app_install_attribution_snapshot (business_date, campaign_id, campaign_phase, canonical_installs, raw_payload)
values
  ('2026-04-06', '120210447970060723', 'app_install_pre_copa', 42,  jsonb_build_object('source', 'v_funnel_ad_latest backfill pre-Copa', 'loaded_on', '2026-09-01')),
  ('2026-04-07', '120210447970060723', 'app_install_pre_copa', 52,  jsonb_build_object('source', 'v_funnel_ad_latest backfill pre-Copa', 'loaded_on', '2026-09-01')),
  ('2026-04-08', '120210447970060723', 'app_install_pre_copa', 205, jsonb_build_object('source', 'v_funnel_ad_latest backfill pre-Copa', 'loaded_on', '2026-09-01')),
  ('2026-04-09', '120210447970060723', 'app_install_pre_copa', 261, jsonb_build_object('source', 'v_funnel_ad_latest backfill pre-Copa', 'loaded_on', '2026-09-01')),
  ('2026-04-10', '120210447970060723', 'app_install_pre_copa', 162, jsonb_build_object('source', 'v_funnel_ad_latest backfill pre-Copa', 'loaded_on', '2026-09-01')),
  ('2026-04-11', '120210447970060723', 'app_install_pre_copa', 100, jsonb_build_object('source', 'v_funnel_ad_latest backfill pre-Copa', 'loaded_on', '2026-09-01')),
  ('2026-04-12', '120210447970060723', 'app_install_pre_copa', 231, jsonb_build_object('source', 'v_funnel_ad_latest backfill pre-Copa', 'loaded_on', '2026-09-01'))
on conflict (business_date, campaign_id) do update set
  campaign_phase = excluded.campaign_phase,
  canonical_installs = excluded.canonical_installs,
  raw_payload = excluded.raw_payload,
  updated_at = now();
