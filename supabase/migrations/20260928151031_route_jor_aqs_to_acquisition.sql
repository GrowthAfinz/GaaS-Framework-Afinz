-- Corrige o legado criado pelo roteamento binario do Importador Inteligente:
-- JOR_AQS_* (exceto a familia JOR_AQS_CP) pertence a Aquisição.
--
-- A migracao preserva ids, metricas, custos e datas. Apenas a tabela/frente e
-- as dimensoes inequivocas contidas na taxonomia da jornada sao corrigidas.

do $$
begin
  if exists (
    select 1
    from public.rentabilizacao_activities r
    join public.activities a
      on a.id = r.id
      or (
        lower(coalesce(a."Activity name / Taxonomia", '')) = lower(coalesce(r."Activity name / Taxonomia", ''))
        and lower(coalesce(a."Canal", '')) = lower(coalesce(r."Canal", ''))
        and a."Data de Disparo"::date = r."Data de Disparo"::date
      )
    where upper(coalesce(r.jornada, '')) like 'JOR\_AQS\_%' escape '\'
      and upper(coalesce(r.jornada, '')) <> 'JOR_AQS_CP'
      and upper(coalesce(r.jornada, '')) not like 'JOR\_AQS\_CP\_%' escape '\'
  ) then
    raise exception 'JOR_AQS migration aborted: matching acquisition record already exists';
  end if;
end
$$;

insert into public.activities (
  id,
  prog_gaas,
  status,
  created_at,
  updated_at,
  "BU",
  jornada,
  "Activity name / Taxonomia",
  "Canal",
  "Data de Disparo",
  "Data Fim",
  "Safra",
  "Parceiro",
  "SIGLA_Parceiro",
  "Segmento",
  "SIGLA_Segmento",
  "Subgrupos",
  "Etapa de aquisição",
  "Perfil de Crédito",
  "Produto",
  "Oferta",
  "Promocional",
  "SIGLA_Oferta",
  "Oferta 2",
  "Promocional 2",
  "Ordem de disparo",
  "Base Total",
  "Base Acionável",
  "% Otimização de base",
  "Custo Unitário Oferta",
  "Custo Total da Oferta",
  "Custo unitário do canal",
  "Custo total canal",
  "Custo Total Campanha",
  "CAC",
  "Taxa de Entrega",
  "Taxa de Abertura",
  "Taxa de Clique",
  "Taxa de Proposta",
  "Taxa de Aprovação",
  "Taxa de Finalização",
  "Taxa de Conversão",
  "Cartões Gerados",
  "Aprovados",
  "Propostas",
  "Emissões Independentes",
  "Emissões Assistidas",
  "Horário de Disparo",
  "Abertura",
  "Cliques"
)
select
  r.id,
  r.prog_gaas,
  r.status,
  r.created_at,
  now(),
  case upper(split_part(r.jornada, '_', 3))
    when 'B2C' then 'B2C'
    when 'B2B2C' then 'B2B2C'
    when 'PLURIX' then 'Plurix'
    when 'SEGUROS' then 'Seguros'
    else r."BU"
  end,
  r.jornada,
  r."Activity name / Taxonomia",
  r."Canal",
  r."Data de Disparo",
  r."Data Fim",
  r."Safra",
  case upper(split_part(r.jornada, '_', 4))
    when 'BB' then 'Bem Barato'
    when 'BBT' then 'Bem Barato'
    when 'DIA' then 'Dia'
    when 'SERASA' then 'Serasa'
    when 'SRS' then 'Serasa'
    when 'SRSA' then 'Serasa'
    when 'ECRED' then 'Serasa'
    when 'BPC' then 'BpC'
    when 'BP' then 'Proprietaria'
    when 'BSP' then 'Proprietaria'
    when 'PROPRI' then 'Proprietaria'
    when 'NA' then 'N/A'
    else r."Parceiro"
  end,
  r."SIGLA_Parceiro",
  case upper(split_part(r.jornada, '_', 5))
    when 'NGD' then 'Negados'
    when 'NEGADOS' then 'Negados'
    when 'ANC' then 'Aprovados_nao_convertidos'
    when 'ABD' then 'Abandonados'
    when 'ABANDONADOS' then 'Abandonados'
    when 'CARRINHO' then 'Abandonados'
    when 'BP' then 'Base_Proprietaria'
    when 'BSP' then 'Base_Proprietaria'
    when 'LP' then 'Leads_Parceiros'
    when 'LEADS' then 'Leads_Parceiros'
    when 'CRM' then 'CRM'
    when 'RECENCIA' then 'Recencia_de_Compra'
    when 'CARTONISTAS' then 'Cartonistas'
    when 'CART' then 'Cartonistas'
    else r."Segmento"
  end,
  r."SIGLA_Segmento",
  r."Subgrupos",
  case
    when upper(split_part(r.jornada, '_', 5)) in ('ABD', 'ABANDONADOS', 'CARRINHO') then 'Reativacao'
    when upper(r.jornada) like '%\_TOPO\_DE\_FUNIL\_%' escape '\' then 'Topo_de_Funil'
    when upper(r.jornada) like '%\_MEIO\_DE\_FUNIL\_%' escape '\' then 'Meio_de_Funil'
    when upper(r.jornada) like '%\_FUNDO\_DE\_FUNIL\_%' escape '\' then 'Fundo_de_Funil'
    else r."Etapa de aquisição"
  end,
  r."Perfil de Crédito",
  r."Produto",
  r."Oferta",
  r."Promocional",
  r."SIGLA_Oferta",
  r."Oferta 2",
  r."Promocional 2",
  r."Ordem de disparo",
  r."Base Total",
  r."Base Acionável",
  r."% Otimização de base",
  r."Custo Unitário Oferta",
  r."Custo Total da Oferta",
  r."Custo unitário do canal",
  r."Custo total canal",
  r."Custo Total Campanha",
  r."CAC",
  r."Taxa de Entrega",
  r."Taxa de Abertura",
  r."Taxa de Clique",
  r."Taxa de Proposta",
  r."Taxa de Aprovação",
  r."Taxa de Finalização",
  r."Taxa de Conversão",
  r."Cartões Gerados",
  r."Aprovados",
  r."Propostas",
  r."Emissões Independentes",
  r."Emissões Assistidas",
  r."Horário de Disparo",
  r."Abertura",
  r."Cliques"
from public.rentabilizacao_activities r
where upper(coalesce(r.jornada, '')) like 'JOR\_AQS\_%' escape '\'
  and upper(coalesce(r.jornada, '')) <> 'JOR_AQS_CP'
  and upper(coalesce(r.jornada, '')) not like 'JOR\_AQS\_CP\_%' escape '\';

delete from public.rentabilizacao_activities r
where upper(coalesce(r.jornada, '')) like 'JOR\_AQS\_%' escape '\'
  and upper(coalesce(r.jornada, '')) <> 'JOR_AQS_CP'
  and upper(coalesce(r.jornada, '')) not like 'JOR\_AQS\_CP\_%' escape '\'
  and exists (select 1 from public.activities a where a.id = r.id);

do $$
begin
  if exists (
    select 1
    from public.rentabilizacao_activities r
    where upper(coalesce(r.jornada, '')) like 'JOR\_AQS\_%' escape '\'
      and upper(coalesce(r.jornada, '')) <> 'JOR_AQS_CP'
      and upper(coalesce(r.jornada, '')) not like 'JOR\_AQS\_CP\_%' escape '\'
  ) then
    raise exception 'JOR_AQS migration incomplete: acquisition rows remain in rentabilizacao_activities';
  end if;
end
$$;
