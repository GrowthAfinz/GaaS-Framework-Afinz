-- Phase 1.6: make partial months, thin rate samples and the Serasa regime
-- change explicit in the canonical monthly contract.

create or replace view public.v_aquisicao_mensal_canonico
with (security_invoker = true) as
with params as (
  select
    30::numeric as denominador_minimo_faixa_taxa,
    date '2026-02-01' as corte_regime_serasa
),
base as (
  select
    date_trunc(
      'month',
      a."Data de Disparo" at time zone 'America/Sao_Paulo'
    )::date as mes,
    a.parceiro_canonico as parceiro,
    count(*) as disparos,
    sum(a."Base Acionável") as base_acionavel,
    sum(a."Propostas") as propostas,
    sum(a."Aprovados") as aprovados,
    sum(a."Cartões Gerados") as cartoes,
    sum(a."Custo Total Campanha") as custo,
    max((a."Data de Disparo" at time zone 'America/Sao_Paulo')::date) as ultima_data_observada
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
    ) as funil_nao_padrao_no_mes,
    b.mes < date_trunc(
      'month',
      timezone('America/Sao_Paulo', now())
    )::date as mes_fechado,
    greatest(
      0,
      least(
        (date_trunc('month', b.mes) + interval '1 month - 1 day')::date - b.mes + 1,
        b.ultima_data_observada - b.mes + 1
      )
    )::integer as dias_cobertos,
    p.denominador_minimo_faixa_taxa,
    case
      when b.parceiro = 'Serasa' and b.mes < p.corte_regime_serasa
        then 'serasa_pre_2026_02'
      when b.parceiro = 'Serasa'
        then 'serasa_pos_2026_02'
      else 'regime_unico'
    end as regime_serie,
    case when b.parceiro = 'Serasa' then p.corte_regime_serasa end as corte_regime,
    case
      when b.parceiro = 'Serasa'
        then 'Mudanca de definicao de Aprovados em 2026-02; comparacoes nao atravessam o corte.'
    end as limitacao_medicao
  from base b
  cross join params p
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
    min(c.cac) filter (
      where c.cartoes >= c.denominador_minimo_faixa_taxa
    ) over faixa_historica as cac_min_6m,
    max(c.cac) filter (
      where c.cartoes >= c.denominador_minimo_faixa_taxa
    ) over faixa_historica as cac_max_6m,
    min(c.tx_finalizacao) filter (
      where c.aprovados >= c.denominador_minimo_faixa_taxa
    ) over faixa_historica as tx_final_min_6m,
    max(c.tx_finalizacao) filter (
      where c.aprovados >= c.denominador_minimo_faixa_taxa
    ) over faixa_historica as tx_final_max_6m,
    min(c.tx_aprovacao) filter (
      where c.propostas >= c.denominador_minimo_faixa_taxa
    ) over faixa_historica as tx_aprovacao_min_6m,
    max(c.tx_aprovacao) filter (
      where c.propostas >= c.denominador_minimo_faixa_taxa
    ) over faixa_historica as tx_aprovacao_max_6m,
    min(c.tx_proposta) filter (
      where c.base_acionavel >= c.denominador_minimo_faixa_taxa
    ) over faixa_historica as tx_proposta_min_6m,
    max(c.tx_proposta) filter (
      where c.base_acionavel >= c.denominador_minimo_faixa_taxa
    ) over faixa_historica as tx_proposta_max_6m,
    count(*) over faixa_historica as meses_observados,
    count(c.cac) filter (
      where c.cartoes >= c.denominador_minimo_faixa_taxa
    ) over faixa_historica as cac_meses_validos_6m,
    count(c.tx_finalizacao) filter (
      where c.aprovados >= c.denominador_minimo_faixa_taxa
    ) over faixa_historica as tx_final_meses_validos_6m,
    count(c.tx_aprovacao) filter (
      where c.propostas >= c.denominador_minimo_faixa_taxa
    ) over faixa_historica as tx_aprovacao_meses_validos_6m,
    count(c.tx_proposta) filter (
      where c.base_acionavel >= c.denominador_minimo_faixa_taxa
    ) over faixa_historica as tx_proposta_meses_validos_6m,
    count(*) over janela_semantica as funil_semantica_meses_observados,
    bool_and(c.funil_nao_padrao_no_mes) over janela_semantica as funil_nao_padrao_persistente
  from calc c
  window
    faixa_historica as (
      partition by c.parceiro, c.regime_serie
      order by c.mes
      range between interval '6 months' preceding and interval '1 month' preceding
    ),
    janela_semantica as (
      partition by c.parceiro, c.regime_serie
      order by c.mes
      range between interval '5 months' preceding and current row
    )
)
select
  w.mes,
  w.parceiro,
  w.disparos,
  w.base_acionavel,
  w.propostas,
  w.aprovados,
  w.cartoes,
  w.custo,
  w.cac,
  w.tx_finalizacao,
  w.tx_aprovacao,
  w.tx_proposta,
  w.funil_nao_padrao_no_mes,
  w.disparos_min_6m,
  w.disparos_max_6m,
  w.base_acionavel_min_6m,
  w.base_acionavel_max_6m,
  w.propostas_min_6m,
  w.propostas_max_6m,
  w.aprovados_min_6m,
  w.aprovados_max_6m,
  w.cartoes_min_6m,
  w.cartoes_max_6m,
  w.custo_min_6m,
  w.custo_max_6m,
  w.cac_min_6m,
  w.cac_max_6m,
  w.tx_final_min_6m,
  w.tx_final_max_6m,
  w.tx_aprovacao_min_6m,
  w.tx_aprovacao_max_6m,
  w.tx_proposta_min_6m,
  w.tx_proposta_max_6m,
  w.meses_observados,
  w.funil_semantica_meses_observados,
  w.funil_nao_padrao_persistente,
  case
    when w.funil_semantica_meses_observados >= 4
     and w.funil_nao_padrao_persistente then 'lead_pre_qualificado'
    else 'padrao'
  end as funil_semantica,
  w.ultima_data_observada,
  w.mes_fechado,
  w.dias_cobertos,
  w.denominador_minimo_faixa_taxa,
  w.cac_meses_validos_6m,
  w.tx_final_meses_validos_6m,
  w.tx_aprovacao_meses_validos_6m,
  w.tx_proposta_meses_validos_6m,
  w.regime_serie,
  w.corte_regime,
  w.limitacao_medicao
from windowed w;

comment on view public.v_aquisicao_mensal_canonico is
  'Serie mensal por parceiro canonico. Mes parcial, amostra efetiva das taxas e corte de regime Serasa sao explicitos; faixas nao atravessam regimes.';
