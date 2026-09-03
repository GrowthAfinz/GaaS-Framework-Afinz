-- A mesma régua pode ser navegada por parceiro ou por jornada.
-- Família/tipo descrevem a orquestração; segmento continua descrevendo audiência.

alter table public.dynamic_email_ruler_strategies
  add column if not exists journey_family text,
  add column if not exists journey_type text;

update public.dynamic_email_ruler_strategies
set
  journey_family = coalesce(journey_family, case
    when lower(coalesce(ruler_family, '') || ' ' || coalesce(name, '')) like '%ciclo%vida%'
      or lower(coalesce(ruler_family, '') || ' ' || coalesce(name, '')) like '%welcome%'
      or lower(coalesce(ruler_family, '') || ' ' || coalesce(name, '')) like '%desbloq%'
      or lower(coalesce(ruler_family, '') || ' ' || coalesce(name, '')) like '%ativa%'
      then 'Ciclo de Vida'
    when business_front = 'acquisition' or (lower(coalesce(partner, '')) = 'plurix' and lower(coalesce(segment, '')) = 'crm') then 'Aquisição'
    when business_front = 'monetization' then 'Rentabilização'
    else 'Outras jornadas'
  end),
  journey_type = coalesce(journey_type, case
    when lower(coalesce(name, '') || ' ' || coalesce(ruler_family, '')) like '%welcome%' then 'Welcome'
    when lower(coalesce(name, '') || ' ' || coalesce(ruler_family, '')) like '%desbloq%' then 'Desbloqueio'
    when lower(coalesce(name, '') || ' ' || coalesce(ruler_family, '')) like '%ativa%' then 'Ativação'
    when lower(coalesce(name, '') || ' ' || coalesce(ruler_family, '') || ' ' || coalesce(segment, '')) like '%topo%funil%' then 'Topo de Funil'
    when business_front = 'acquisition' or (lower(coalesce(partner, '')) = 'plurix' and lower(coalesce(segment, '')) = 'crm') then 'Topo de Funil'
    else coalesce(nullif(name, ''), nullif(ruler_family, ''), 'Outras jornadas')
  end)
where journey_family is null or journey_type is null;

alter table public.dynamic_email_ruler_strategies
  alter column journey_family set default 'Aquisição',
  alter column journey_type set default 'Topo de Funil';

create index if not exists dynamic_email_ruler_journey_navigation_idx
  on public.dynamic_email_ruler_strategies (journey_family, journey_type, partner, segment);

comment on column public.dynamic_email_ruler_strategies.journey_family is
  'Família editorial da jornada, como Aquisição ou Ciclo de Vida. Não representa audiência.';
comment on column public.dynamic_email_ruler_strategies.journey_type is
  'Tipo extensível dentro da família, como Topo de Funil, Welcome, Desbloqueio ou Ativação.';
