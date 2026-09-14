-- Read-only acceptance test for the Phase 1 data foundation.
-- Run only after the tracked migration is applied. The transaction is rolled back.
begin;

do $$
declare
  actual jsonb;
  expected jsonb;
  actual_number numeric;
begin
  select jsonb_object_agg(
      reason,
      jsonb_build_object('linhas', linhas, 'cartoes', cartoes)
      order by reason
    )
    into actual
  from (
    select
      parceiro_canonico_motivo as reason,
      count(*) as linhas,
      coalesce(sum("Cartões Gerados"), 0) as cartoes
    from public.activities
    where "Data de Disparo" >= date '2026-03-01'
      and "Data de Disparo" < date '2026-09-01'
    group by parceiro_canonico_motivo
  ) distribution;
  expected := '{
    "EXPLICIT_PARTNER":{"linhas":2424,"cartoes":9982},
    "BU_PLURIX_SELF_ATTRIBUTION":{"linhas":1439,"cartoes":4876},
    "B2C_CAMPAIGN_TWIN_MATCH":{"linhas":225,"cartoes":998},
    "B2C_INSTITUTIONAL_OWN_BASE":{"linhas":242,"cartoes":58},
    "UNRESOLVED":{"linhas":1,"cartoes":0}
  }'::jsonb;
  if actual <> expected then
    raise exception 'Partner reason distribution failed: expected %, got %', expected, actual;
  end if;

  select jsonb_object_agg(parceiro, cartoes order by parceiro)
    into actual
  from public.v_aquisicao_mensal_canonico
  where mes = date '2026-08-01'
    and parceiro in ('Serasa', 'Proprietaria', 'Plurix', 'Bem Barato', 'Dia');
  expected := '{"Bem Barato":158,"Dia":93,"Plurix":698,"Proprietaria":912,"Serasa":988}'::jsonb;
  if actual <> expected then
    raise exception 'August partner reconciliation failed: expected %, got %', expected, actual;
  end if;

  select sum(cartoes) into actual_number
  from public.v_aquisicao_mensal_canonico
  where mes = date '2026-08-01';
  if actual_number <> 2849 then
    raise exception 'August cards reconciliation failed: expected 2849, got %', actual_number;
  end if;

  select sum(custo) into actual_number
  from public.v_aquisicao_mensal_canonico
  where mes = date '2026-08-01';
  if abs(actual_number - 45391.037184) > 0.000001 then
    raise exception 'August cost reconciliation failed: expected 45391.037184, got %', actual_number;
  end if;

  select sum(custo) / nullif(sum(cartoes), 0) into actual_number
  from public.v_aquisicao_mensal_canonico
  where mes = date '2026-08-01';
  if abs(actual_number - (45391.037184 / 2849)) > 0.000001 then
    raise exception 'August CAC reconciliation failed: got %', actual_number;
  end if;

  select jsonb_object_agg(parceiro, cartoes order by parceiro)
    into actual
  from public.v_aquisicao_mensal_canonico
  where mes = date '2026-07-01'
    and parceiro in ('Serasa', 'Proprietaria', 'Plurix', 'Bem Barato', 'Dia');
  expected := '{"Bem Barato":217,"Dia":36,"Plurix":625,"Proprietaria":473,"Serasa":939}'::jsonb;
  if actual <> expected then
    raise exception 'July partner reconciliation failed: expected %, got %', expected, actual;
  end if;

  if exists (
    select 1
    from (
      select parceiro, count(*) as points
      from public.v_aquisicao_mensal_canonico
      where mes between date '2026-03-01' and date '2026-08-01'
        and parceiro in ('Serasa', 'Proprietaria', 'Plurix', 'Bem Barato', 'Dia')
      group by parceiro
    ) monthly
    where points <> 6
  ) then
    raise exception 'Monthly series does not contain six points for every canonical partner';
  end if;

  select count(distinct "Canal") into actual_number
  from public.activities
  where "Data de Disparo" >= date '2026-08-01'
    and "Data de Disparo" < date '2026-09-01'
    and parceiro_canonico = 'Proprietaria';
  if actual_number <> 4 then
    raise exception 'Proprietaria channel grain failed: expected 4 channels, got %', actual_number;
  end if;

  if not exists (
    select 1 from public.v_aquisicao_mensal_canonico
    where mes = date '2026-08-01'
      and parceiro = 'Serasa'
      and funil_semantica = 'lead_pre_qualificado'
  ) then
    raise exception 'Serasa funnel semantics were not classified as lead_pre_qualificado';
  end if;

  if exists (
    select 1 from public.v_aquisicao_mensal_canonico
    where mes = date '2026-08-01'
      and parceiro in ('Proprietaria', 'Plurix', 'Bem Barato', 'Dia')
      and funil_semantica <> 'padrao'
  ) then
    raise exception 'A non-Serasa partner was classified with non-standard funnel semantics';
  end if;

  if exists (
    select 1
    from (values
      ('mes'), ('parceiro'),
      ('disparos'), ('base_acionavel'), ('propostas'), ('aprovados'), ('cartoes'), ('custo'),
      ('cac'), ('tx_finalizacao'), ('tx_aprovacao'), ('tx_proposta'),
      ('disparos_min_6m'), ('disparos_max_6m'),
      ('base_acionavel_min_6m'), ('base_acionavel_max_6m'),
      ('propostas_min_6m'), ('propostas_max_6m'),
      ('aprovados_min_6m'), ('aprovados_max_6m'),
      ('cartoes_min_6m'), ('cartoes_max_6m'),
      ('custo_min_6m'), ('custo_max_6m'),
      ('cac_min_6m'), ('cac_max_6m'),
      ('tx_final_min_6m'), ('tx_final_max_6m'),
      ('tx_aprovacao_min_6m'), ('tx_aprovacao_max_6m'),
      ('tx_proposta_min_6m'), ('tx_proposta_max_6m'),
      ('meses_observados'), ('funil_semantica'),
      ('ultima_data_observada'), ('mes_fechado'), ('dias_cobertos'),
      ('denominador_minimo_faixa_taxa'),
      ('cac_meses_validos_6m'), ('tx_final_meses_validos_6m'),
      ('tx_aprovacao_meses_validos_6m'), ('tx_proposta_meses_validos_6m'),
      ('regime_serie'), ('corte_regime'), ('limitacao_medicao')
    ) required(column_name)
    where not exists (
      select 1
      from information_schema.columns actual_column
      where actual_column.table_schema = 'public'
        and actual_column.table_name = 'v_aquisicao_mensal_canonico'
        and actual_column.column_name = required.column_name
    )
  ) then
    raise exception 'Canonical monthly view is missing a Phase 2 contract field';
  end if;

  if exists (
    select 1
    from public.v_aquisicao_mensal_canonico
    where mes_fechado <> (
      mes < date_trunc('month', timezone('America/Sao_Paulo', now()))::date
    )
  ) then
    raise exception 'mes_fechado does not match the Sao Paulo calendar boundary';
  end if;

  if exists (
    select 1
    from public.v_aquisicao_mensal_canonico v
    join (
      select
        date_trunc('month', "Data de Disparo" at time zone 'America/Sao_Paulo')::date as mes,
        parceiro_canonico as parceiro,
        max(("Data de Disparo" at time zone 'America/Sao_Paulo')::date) as ultima_data
      from public.activities
      where "Data de Disparo" is not null
      group by 1, 2
    ) source_cutoff using (mes, parceiro)
    where v.dias_cobertos <> source_cutoff.ultima_data - v.mes + 1
  ) then
    raise exception 'dias_cobertos does not represent the last observed business date';
  end if;

  if not exists (
    select 1
    from public.v_aquisicao_mensal_canonico
    where mes = date '2026-08-01'
      and parceiro = 'Bem Barato'
      and meses_observados = 6
      and tx_final_meses_validos_6m = 5
      and denominador_minimo_faixa_taxa = 30
      and tx_final_max_6m < 0.70
  ) then
    raise exception 'Thin Bem Barato month still contaminates the finalization band';
  end if;

  if not exists (
    select 1
    from public.v_aquisicao_mensal_canonico
    where mes = date '2026-08-01'
      and parceiro = 'Serasa'
      and regime_serie = 'serasa_pos_2026_02'
      and corte_regime = date '2026-02-01'
      and limitacao_medicao is not null
      and meses_observados = 6
      and tx_final_meses_validos_6m = 6
      and tx_final_min_6m between 0.02 and 0.03
      and tx_final_max_6m between 0.05 and 0.06
  ) then
    raise exception 'Serasa finalization band crosses the February 2026 regime boundary';
  end if;
end $$;

rollback;
