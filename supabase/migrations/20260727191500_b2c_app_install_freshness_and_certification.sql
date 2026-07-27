-- =====================================================================
-- Funil Onboarding - Midia Paga: semantica, frescor e certificacao do legado.
--
-- Tres correcoes:
--  (1) `app_opened` era alimentado por canonical_event='initiated_checkout'.
--      O nome era semanticamente falso. A coluna passa a se chamar
--      `initiated_checkout`. NENHUM evento novo foi inventado: e o mesmo dado,
--      com o nome correto. Abertura de app (fb_mobile_activate_app) ja e
--      exposta separadamente como `app_sessions`.
--  (2) Frescor deixa de ser "a ultima data da view". Entrega (plataforma) e
--      eventos atribuidos (governados) passam a ter datas proprias, comparadas
--      contra o ultimo dia FECHADO em America/Sao_Paulo.
--  (3) Certificacao do legado: comparacao diaria governado x legado com
--      diferenca absoluta, percentual, status e data de atualizacao, mais o
--      contador de dias fechados consecutivos aprovados (gate de 14 dias).
--
-- Ausencia continua sendo ausencia: observation_status not_available produz
-- NULL, nunca zero. `explicit_zero` continua produzindo 0.
-- SubmitApplication / pedido de cartao continua SEM mapeamento e SEM valor.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0) Helper: ultimo dia fechado em America/Sao_Paulo
-- ---------------------------------------------------------------------
create or replace function public.last_closed_day_br()
returns date
language sql
stable
as $$
  select ((now() at time zone 'America/Sao_Paulo')::date - 1);
$$;

comment on function public.last_closed_day_br() is
  'Ultimo dia fechado no fuso America/Sao_Paulo. Referencia unica de frescor esperado.';

grant execute on function public.last_closed_day_br() to anon, authenticated;

-- ---------------------------------------------------------------------
-- 1) View diaria do funil: `app_opened` -> `initiated_checkout`
--    (mesma fonte, nome correto) + instalacao governada exposta ao lado
--    da legada para tornar a fonte auditavel na tela.
-- ---------------------------------------------------------------------
drop view if exists public.v_b2c_app_install_daily;

create view public.v_b2c_app_install_daily
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
    -- somente observacoes reais; not_available continua NULL (nunca vira zero)
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
    max(value) filter (where canonical_event = 'link_click')         as link_clicks,
    max(value) filter (where canonical_event = 'install')            as canonical_installs,
    max(value) filter (where canonical_event = 'app_session')        as app_sessions,
    max(value) filter (where canonical_event = 'initiated_checkout') as initiated_checkout,
    max(value) filter (where canonical_event = 'start_trial')        as start_trials
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
  -- instalacao governada exposta em separado: permite auditar o dual-write
  -- sem trocar a medida apresentada antes da certificacao.
  p.canonical_installs as governed_installs,
  d.legacy_installs,
  p.app_sessions,
  -- ANTES: app_opened (nome falso). AGORA: initiated_checkout (nome real).
  p.initiated_checkout,
  case when d.campaign_phase = 'onboarding' then p.start_trials end as start_trials,
  case when d.campaign_phase = 'onboarding' then d.legacy_start_trials end as legacy_start_trials,
  (d.campaign_phase = 'onboarding') as start_trial_eligible,
  case d.campaign_phase
    when 'app_install' then 'Meta results - install - 1d click + 1d view'
    else 'StartTrial atribuido a Meta - 7d click'
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

comment on view public.v_b2c_app_install_daily is
  'Funil diario da familia B2C App Install. initiated_checkout substitui o antigo app_opened (mesmo dado, nome correto). Ausencia permanece NULL.';

-- ---------------------------------------------------------------------
-- 2) Frescor por etapa: entrega (plataforma) x eventos atribuidos (governado)
--
--    status:
--      atualizado        -> observado ate o ultimo dia fechado esperado
--      desatualizado     -> a etapa existe, mas parou antes do dia esperado
--      sem_observacao    -> nunca houve observacao no periodo governado
--      nao_instrumentado -> etapa conhecida, sem fonte na Meta (bloqueada)
-- ---------------------------------------------------------------------
create or replace view public.v_b2c_app_install_freshness
with (security_invoker = true) as
with expected as (
  select public.last_closed_day_br() as expected_through
), delivery as (
  select max(m.date) as observed_through
  from public.paid_media_metrics m
  where lower(m.channel) = 'meta'
    and (
      m.campaign = '[B2C]App_Install_Afinz'
      or m.campaign ilike '%[B2C]App_Install_Onboarding_Afinz%'
    )
), governed as (
  select
    f.canonical_event,
    max(f.business_date) filter (
      where f.observation_status in ('available','explicit_zero')
    ) as observed_through
  from public.v_funnel_ad_latest f
  where f.campaign_id in (select campaign_id from public.meta_governed_campaigns)
  group by 1
), stages as (
  select 1 as stage_order, 'impressions'        as stage_key, 'Impressoes'          as stage_label,
         'plataforma'  as source_layer, 'entrega'              as classification,
         (select observed_through from delivery) as observed_through, false as blocked
  union all
  select 2, 'link_clicks', 'Cliques no link', 'governado', 'entrega',
         (select observed_through from governed where canonical_event='link_click'), false
  union all
  select 3, 'installs', 'Instalacoes', 'legado', 'core',
         (select observed_through from delivery), false
  union all
  select 4, 'app_sessions', 'Sessoes no app', 'governado', 'apoio',
         (select observed_through from governed where canonical_event='app_session'), false
  union all
  select 5, 'initiated_checkout', 'Inicio de checkout', 'governado', 'apoio',
         (select observed_through from governed where canonical_event='initiated_checkout'), false
  union all
  select 6, 'start_trials', 'StartTrial', 'governado', 'core',
         (select observed_through from governed where canonical_event='start_trial'), false
  union all
  select 7, 'card_order', 'Pedido de cartao', 'nao_instrumentado', 'bloqueado',
         null::date, true
)
select
  s.stage_order,
  s.stage_key,
  s.stage_label,
  s.source_layer,
  s.classification,
  s.observed_through,
  e.expected_through,
  case
    when s.blocked                              then 'nao_instrumentado'
    when s.observed_through is null             then 'sem_observacao'
    when s.observed_through >= e.expected_through then 'atualizado'
    else 'desatualizado'
  end as status,
  case
    when s.blocked or s.observed_through is null then null
    else (e.expected_through - s.observed_through)
  end as days_behind
from stages s cross join expected e
order by s.stage_order;

grant select on public.v_b2c_app_install_freshness to anon, authenticated;

comment on view public.v_b2c_app_install_freshness is
  'Frescor por etapa do funil B2C App Install. Separa entrega (plataforma) de eventos atribuidos (governados) contra o ultimo dia fechado em America/Sao_Paulo.';

-- ---------------------------------------------------------------------
-- 3) Certificacao diaria governado x legado (StartTrial e Instalacao)
--
--    is_approved usa coalesce(...,0) porque o gate compara TOTAIS do dia.
--    O campo `status` preserva a distincao semantica (sem_observacao != zero)
--    para leitura humana. A tela nunca deve usar is_approved para preencher
--    valor: ele serve apenas ao gate de corte do legado.
-- ---------------------------------------------------------------------
create or replace view public.v_meta_legacy_certification
with (security_invoker = true) as
with dias as (
  select generate_series(
           public.last_closed_day_br() - 59,
           public.last_closed_day_br(),
           interval '1 day'
         )::date as business_date
), gov as (
  select f.business_date, f.canonical_event,
         sum(f.value) filter (where f.observation_status in ('available','explicit_zero')) as governed_value,
         max(f.business_date) as governed_seen
  from public.v_funnel_ad_latest f
  where f.campaign_id = '120250049222750723'
    and f.canonical_event in ('start_trial','install')
  group by 1,2
), leg as (
  select m.date as business_date,
         sum(coalesce(m.start_trials,0))::numeric as legacy_start_trial,
         sum(coalesce(m.installs,0))::numeric     as legacy_install,
         max(m.created_at)                        as legacy_updated_at
  from public.paid_media_metrics m
  where lower(m.channel) = 'meta'
    and m.campaign ilike '%[B2C]App_Install_Onboarding_Afinz%'
  group by 1
), metrics as (
  select d.business_date, 'start_trial'::text as metric,
         (select governed_value from gov g where g.business_date = d.business_date and g.canonical_event='start_trial') as governed_value,
         l.legacy_start_trial as legacy_value, l.legacy_updated_at
  from dias d left join leg l on l.business_date = d.business_date
  union all
  select d.business_date, 'install'::text,
         (select governed_value from gov g where g.business_date = d.business_date and g.canonical_event='install'),
         l.legacy_install, l.legacy_updated_at
  from dias d left join leg l on l.business_date = d.business_date
)
select
  m.business_date,
  m.metric,
  m.governed_value,
  m.legacy_value,
  abs(coalesce(m.governed_value,0) - coalesce(m.legacy_value,0)) as diff_abs,
  case
    when coalesce(m.legacy_value,0) = 0 then null
    else round(
      (coalesce(m.governed_value,0) - coalesce(m.legacy_value,0)) / m.legacy_value * 100, 2)
  end as diff_pct,
  case
    when m.governed_value is null and coalesce(m.legacy_value,0) = 0 then 'sem_evento'
    when m.governed_value is null                                    then 'sem_observacao_governada'
    when m.legacy_value  is null                                     then 'sem_legado'
    when m.governed_value = m.legacy_value                           then 'conciliado'
    else 'divergente'
  end as reconciliation_status,
  (coalesce(m.governed_value,0) = coalesce(m.legacy_value,0)) as is_approved,
  m.legacy_updated_at
from metrics m
order by m.business_date desc, m.metric;

grant select on public.v_meta_legacy_certification to anon, authenticated;

comment on view public.v_meta_legacy_certification is
  'Comparacao diaria governado x legado por metrica: diferenca absoluta, percentual, status de reconciliacao e data de atualizacao do legado.';

-- ---------------------------------------------------------------------
-- 4) Gate de corte do legado: 14 dias fechados consecutivos aprovados
-- ---------------------------------------------------------------------
-- O gate tem DUAS condicoes, porque reconciliacao aprovada nao prova operacao:
--   (a) 14 dias fechados consecutivos com governado == legado;
--   (b) 14 dias fechados cobertos por execucao DIARIA automatica (mode='daily'
--       e status='complete'). Backfill manual reconcilia, mas nao demonstra que
--       a coleta se sustenta sozinha. Sem (b) o legado NAO pode ser cortado.
create or replace view public.v_meta_legacy_cutover_readiness
with (security_invoker = true) as
with ordered as (
  select metric, business_date, is_approved,
         row_number() over (partition by metric order by business_date desc) as rn
  from public.v_meta_legacy_certification
  where business_date <= public.last_closed_day_br()
), first_break as (
  select metric, min(rn) as break_rn
  from ordered where not is_approved
  group by metric
), daily_coverage as (
  -- Conta DIAS DE EXECUCAO, nao dias cobertos: um unico run 'daily' cobre 28 dias
  -- retroativos, o que provaria nada sobre a sustentacao da automacao.
  select count(distinct (r.started_at at time zone 'America/Sao_Paulo')::date) as covered_days
  from public.paid_media_collection_runs r
  where r.source = 'meta'
    and r.mode = 'daily'
    and r.status = 'complete'
    and (r.started_at at time zone 'America/Sao_Paulo')::date
        > public.last_closed_day_br() - 14
), streak as (
  select o.metric, coalesce(fb.break_rn - 1, max(o.rn)) as approved_days
  from ordered o
  left join first_break fb on fb.metric = o.metric
  group by o.metric, fb.break_rn
)
select
  s.metric,
  s.approved_days                        as consecutive_approved_closed_days,
  dc.covered_days                        as daily_run_covered_closed_days,
  14                                     as required_closed_days,
  (s.approved_days >= 14)                as reconciliation_gate_met,
  (dc.covered_days >= 14)                as daily_operation_gate_met,
  (s.approved_days >= 14 and dc.covered_days >= 14) as ready_to_cut_legacy,
  public.last_closed_day_br()            as evaluated_through
from streak s cross join daily_coverage dc;

grant select on public.v_meta_legacy_cutover_readiness to anon, authenticated;

comment on view public.v_meta_legacy_cutover_readiness is
  'Gate de transicao: exige 14 dias fechados consecutivos aprovados antes de remover a medida legada.';
