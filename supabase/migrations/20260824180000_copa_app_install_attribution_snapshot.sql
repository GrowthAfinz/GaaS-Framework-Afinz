-- Snapshot pré-computado de installs canônicos (atribuição via paid_media_actions /
-- v_funnel_ad_latest) para a campanha Meta "App Install" (fase inicial da campanha
-- Copa de aquisição B2C, campaign_id 120210447970060723).
--
-- A view v_b2c_app_install_daily (e as views por baixo dela, v_paid_media_actions_latest
-- e v_funnel_ad_latest) faz DISTINCT ON sobre paid_media_actions sem nenhum filtro
-- seletivo disponível — channel/account_id/campaign_id têm o MESMO valor em 100% das
-- ~348k linhas da tabela (ela foi construída só para rastrear estas 2 campanhas), então
-- nenhum índice ajuda: EXPLAIN ANALYZE confirmou ~8-13s mesmo com filtros extras ou um
-- índice hipotético dedicado (testado via hypopg). Isso estourava o statement_timeout do
-- client e derrubava o export "Fechamento Copa" inteiro.
--
-- Fix: mover o cálculo caro para um backfill manual (aceitável rodar direto no banco,
-- sem o timeout do client) e deixar o export ler este snapshot — instantâneo.

create table if not exists copa_app_install_attribution_snapshot (
  business_date date not null,
  campaign_id text not null,
  campaign_phase text not null,
  canonical_installs integer,
  raw_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (business_date, campaign_id)
);

comment on table copa_app_install_attribution_snapshot is
  'Snapshot pré-computado de installs canônicos (atribuição via paid_media_actions/v_funnel_ad_latest) para a fase App Install (campaign_id 120210447970060723) — a query ao vivo estoura statement_timeout (tabela de 348k linhas sem filtro seletivo disponível). Popular via backfill manual/agendado; export lê daqui em vez de recalcular.';

-- Backfill inicial (13/04/2026 a 15/08/2026) — resultado real: 90 dias, 1.148 installs.
insert into copa_app_install_attribution_snapshot (business_date, campaign_id, campaign_phase, canonical_installs, raw_payload)
select
  f.business_date,
  f.campaign_id,
  'app_install' as campaign_phase,
  sum(f.value) filter (where f.canonical_event = 'install' and f.observation_status in ('available', 'explicit_zero')) as canonical_installs,
  jsonb_build_object('source', 'v_funnel_ad_latest backfill', 'loaded_on', '2026-08-24')
from v_funnel_ad_latest f
where f.campaign_id = '120210447970060723'
  and f.business_date between '2026-04-13' and '2026-08-15'
group by f.business_date, f.campaign_id
on conflict (business_date, campaign_id) do update set
  canonical_installs = excluded.canonical_installs,
  raw_payload = excluded.raw_payload,
  updated_at = now();
