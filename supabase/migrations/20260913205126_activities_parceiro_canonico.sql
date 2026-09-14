-- Fase 1 da evolucao editorial do Report Live.
-- Replica fielmente resolvePartner() sem alterar os campos brutos de activities.

alter table public.activities
  add column parceiro_canonico text generated always as (
    case
      when coalesce(btrim("Parceiro"), '') <> ''
       and upper(btrim("Parceiro")) <> 'N/A' then btrim("Parceiro")
      when btrim(coalesce("BU", '')) = 'Plurix'
       and (
         coalesce("Activity name / Taxonomia", '') ~* '(^|_)(plu|plx|plurix)'
         or coalesce(jornada, '') ~* 'plurix'
       ) then 'Plurix'
      when btrim(coalesce("BU", '')) = 'B2C' then 'Proprietaria'
      else 'N/A'
    end
  ) stored,
  add column parceiro_canonico_motivo text generated always as (
    case
      when coalesce(btrim("Parceiro"), '') <> ''
       and upper(btrim("Parceiro")) <> 'N/A' then 'EXPLICIT_PARTNER'
      when btrim(coalesce("BU", '')) = 'Plurix'
       and (
         coalesce("Activity name / Taxonomia", '') ~* '(^|_)(plu|plx|plurix)'
         or coalesce(jornada, '') ~* 'plurix'
       ) then 'BU_PLURIX_SELF_ATTRIBUTION'
      when btrim(coalesce("BU", '')) = 'B2C'
       and coalesce("Activity name / Taxonomia", '') ~* 'institucional|inst(?![a-z])'
        then 'B2C_INSTITUTIONAL_OWN_BASE'
      when btrim(coalesce("BU", '')) = 'B2C' then 'B2C_CAMPAIGN_TWIN_MATCH'
      else 'UNRESOLVED'
    end
  ) stored,
  add column parceiro_canonico_confianca text generated always as (
    case
      when coalesce(btrim("Parceiro"), '') <> ''
       and upper(btrim("Parceiro")) <> 'N/A' then 'alta'
      when btrim(coalesce("BU", '')) = 'Plurix'
       and (
         coalesce("Activity name / Taxonomia", '') ~* '(^|_)(plu|plx|plurix)'
         or coalesce(jornada, '') ~* 'plurix'
       ) then 'alta'
      when btrim(coalesce("BU", '')) = 'B2C' then 'alta'
      else 'baixa'
    end
  ) stored;

create index if not exists idx_activities_parceiro_canonico
  on public.activities (parceiro_canonico, "Data de Disparo");

comment on column public.activities.parceiro_canonico is
  'Parceiro derivado pela regra canonica do Report Live; o valor bruto permanece em Parceiro.';
comment on column public.activities.parceiro_canonico_motivo is
  'Procedencia da resolucao canonica, equivalente a PartnerResolution.reason.';
comment on column public.activities.parceiro_canonico_confianca is
  'Confianca da resolucao canonica, equivalente a PartnerResolution.confidence.';

create or replace view public.v_aquisicao_mensal_canonico
with (security_invoker = true) as
with base as (
  select
    date_trunc('month', a."Data de Disparo")::date as mes,
    a.parceiro_canonico as parceiro,
    count(*) as disparos,
    sum(a."Base Acionável") as base_acionavel,
    sum(a."Propostas") as propostas,
    sum(a."Aprovados") as aprovados,
    sum(a."Cartões Gerados") as cartoes,
    sum(a."Custo Total Campanha") as custo
  from public.activities a
  where a."Data de Disparo" is not null
  group by 1, 2
),
calc as (
  select
    b.*,
    case when b.cartoes > 0 then b.custo / b.cartoes end as cac,
    case when b.aprovados > 0 then b.cartoes::numeric / b.aprovados end as tx_finalizacao,
    case when b.propostas > 0 then b.aprovados::numeric / b.propostas end as tx_aprovacao,
    case when b.base_acionavel > 0 then b.propostas::numeric / b.base_acionavel end as tx_proposta,
    (
      b.propostas > b.base_acionavel
      or (b.propostas > 0 and b.aprovados::numeric / b.propostas > 0.95)
    ) as funil_nao_padrao_no_mes
  from base b
),
windowed as (
  select
    c.*,
    min(c.disparos) over faixa_historica as disparos_min_6m,
    max(c.disparos) over faixa_historica as disparos_max_6m,
    min(c.base_acionavel) over faixa_historica as base_acionavel_min_6m,
    max(c.base_acionavel) over faixa_historica as base_acionavel_max_6m,
    min(c.propostas) over faixa_historica as propostas_min_6m,
    max(c.propostas) over faixa_historica as propostas_max_6m,
    min(c.aprovados) over faixa_historica as aprovados_min_6m,
    max(c.aprovados) over faixa_historica as aprovados_max_6m,
    min(c.cartoes) over faixa_historica as cartoes_min_6m,
    max(c.cartoes) over faixa_historica as cartoes_max_6m,
    min(c.custo) over faixa_historica as custo_min_6m,
    max(c.custo) over faixa_historica as custo_max_6m,
    min(c.cac) over faixa_historica as cac_min_6m,
    max(c.cac) over faixa_historica as cac_max_6m,
    min(c.tx_finalizacao) over faixa_historica as tx_finalizacao_min_6m,
    max(c.tx_finalizacao) over faixa_historica as tx_finalizacao_max_6m,
    min(c.tx_aprovacao) over faixa_historica as tx_aprovacao_min_6m,
    max(c.tx_aprovacao) over faixa_historica as tx_aprovacao_max_6m,
    min(c.tx_proposta) over faixa_historica as tx_proposta_min_6m,
    max(c.tx_proposta) over faixa_historica as tx_proposta_max_6m,
    count(*) over faixa_historica as meses_observados,
    count(*) over janela_semantica as funil_semantica_meses_observados,
    bool_and(c.funil_nao_padrao_no_mes) over janela_semantica as funil_nao_padrao_persistente
  from calc c
  window
    faixa_historica as (
      partition by c.parceiro
      order by c.mes
      range between interval '6 months' preceding and interval '1 month' preceding
    ),
    janela_semantica as (
      partition by c.parceiro
      order by c.mes
      range between interval '5 months' preceding and current row
    )
)
select
  w.*,
  case
    when w.funil_semantica_meses_observados >= 4
     and w.funil_nao_padrao_persistente then 'lead_pre_qualificado'
    else 'padrao'
  end as funil_semantica
from windowed w;

comment on view public.v_aquisicao_mensal_canonico is
  'Serie mensal de aquisicao por parceiro canonico, com faixa dos seis meses anteriores e semantica persistente de funil.';
