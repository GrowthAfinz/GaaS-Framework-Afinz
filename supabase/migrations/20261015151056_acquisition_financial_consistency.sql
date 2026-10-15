-- Preserve recorded tariffs/incentives; derive CAC using merged stored and incoming metrics.
create or replace function public.bulk_update_activities_from_json(p_updates jsonb)
returns table(id uuid)
language plpgsql
security invoker
set search_path = public
as $$
declare expected integer; actual integer;
begin
  select count(*), count(distinct item->>'id') into expected, actual
  from jsonb_array_elements(coalesce(p_updates, '[]'::jsonb)) item;
  if expected <> actual then raise exception 'Missing or duplicate activity IDs'; end if;
  return query
  with updates as (
    select
      (item->>'id')::uuid as update_id,
      item - 'id' as patch
    from jsonb_array_elements(coalesce(p_updates, '[]'::jsonb)) as item
    where item ? 'id'
  ), drivers as (
    select u.*, a."Base Acionável" old_base, a."Custo Total Campanha" old_total,
      a."Custo unitário do canal" old_rate, a."Custo total canal" old_channel,
      a."Custo Unitário Oferta" offer_unit, a."Custo Total da Oferta" offer_total,
      case when patch ? 'Base Acionável' then nullif(patch->>'Base Acionável','')::numeric else a."Base Acionável" end new_base,
      case when patch ? 'Cartões Gerados' then nullif(patch->>'Cartões Gerados','')::numeric else a."Cartões Gerados" end cards,
      coalesce(case when a."Custo unitário do canal" > 0 then a."Custo unitário do canal" end,
        case when extract(year from a."Data de Disparo") between 2025 and 2026 then
          case lower(trim(a."Canal"))
            when 'whatsapp' then case when extract(year from a."Data de Disparo") = 2025 then .420 else .3812 end
            when 'sms' then case when extract(year from a."Data de Disparo") = 2025 then .064 else .0748 end
            when 'e-mail' then case when extract(year from a."Data de Disparo") = 2025 then .000865 else .001024 end
            when 'push' then case when extract(year from a."Data de Disparo") = 2025 then .000865 else .001024 end
          end end) rate
    from updates u join public.activities a on a.id = u.update_id
    for update of a
  ), channel_costs as (
    select d.*, case when new_base is distinct from old_base or (old_channel = 0 and new_base > 0 and rate > 0) then new_base * rate
      else coalesce(old_channel, new_base * rate) end channel_cost,
      case when offer_total >= 0 then offer_total
        when old_total >= coalesce(old_channel,old_base*old_rate)
          then old_total-coalesce(old_channel,old_base*old_rate)
        when coalesce(offer_unit,0) = 0 then 0 end incentive
    from drivers d
  ), financials as (
    select c.*, case
      when new_base is distinct from old_base then channel_cost + incentive
      when old_total is null or (old_total = 0 and new_base > 0 and rate > 0 and coalesce(offer_unit,0)=0)
        then channel_cost + incentive
      else old_total end campaign_cost
    from channel_costs c
  )
  update public.activities as a
  set
    "Base Total" = case when u.patch ? 'Base Total' then nullif(u.patch->>'Base Total', '')::numeric else a."Base Total" end,
    "Base Acionável" = case when u.patch ? 'Base Acionável' then nullif(u.patch->>'Base Acionável', '')::numeric else a."Base Acionável" end,
    "Abertura" = case when u.patch ? 'Abertura' then nullif(u.patch->>'Abertura', '')::integer else a."Abertura" end,
    "Cliques" = case when u.patch ? 'Cliques' then nullif(u.patch->>'Cliques', '')::integer else a."Cliques" end,
    "Propostas" = case when u.patch ? 'Propostas' then nullif(u.patch->>'Propostas', '')::numeric else a."Propostas" end,
    "Aprovados" = case when u.patch ? 'Aprovados' then nullif(u.patch->>'Aprovados', '')::numeric else a."Aprovados" end,
    "Cartões Gerados" = case when u.patch ? 'Cartões Gerados' then nullif(u.patch->>'Cartões Gerados', '')::numeric else a."Cartões Gerados" end,
    "Emissões Assistidas" = case when u.patch ? 'Emissões Assistidas' then nullif(u.patch->>'Emissões Assistidas', '')::numeric else a."Emissões Assistidas" end,
    "Emissões Independentes" = case when u.patch ? 'Emissões Independentes' then nullif(u.patch->>'Emissões Independentes', '')::numeric else a."Emissões Independentes" end,
    "BU" = case when u.patch ? 'BU' then coalesce(nullif(u.patch->>'BU', ''), a."BU") else a."BU" end,
    "Parceiro" = case when u.patch ? 'Parceiro' then nullif(u.patch->>'Parceiro', '') else a."Parceiro" end,
    "Segmento" = case when u.patch ? 'Segmento' then nullif(u.patch->>'Segmento', '') else a."Segmento" end,
    "Subgrupos" = case when u.patch ? 'Subgrupos' then nullif(u.patch->>'Subgrupos', '') else a."Subgrupos" end,
    "Etapa de aquisição" = case when u.patch ? 'Etapa de aquisição' then nullif(u.patch->>'Etapa de aquisição', '') else a."Etapa de aquisição" end,
    "Perfil de Crédito" = case when u.patch ? 'Perfil de Crédito' then nullif(u.patch->>'Perfil de Crédito', '') else a."Perfil de Crédito" end,
    "Produto" = case when u.patch ? 'Produto' then nullif(u.patch->>'Produto', '') else a."Produto" end,
    "Oferta" = case when u.patch ? 'Oferta' then nullif(u.patch->>'Oferta', '') else a."Oferta" end,
    "Promocional" = case when u.patch ? 'Promocional' then nullif(u.patch->>'Promocional', '') else a."Promocional" end,
    "Ordem de disparo" = case when u.patch ? 'Ordem de disparo' then nullif(u.patch->>'Ordem de disparo', '')::integer else a."Ordem de disparo" end,
    jornada = case when u.patch ? 'jornada' then nullif(u.patch->>'jornada', '') else a.jornada end,
    "Custo unitário do canal" = u.rate,
    "Custo total canal" = u.channel_cost,
    "Custo Total Campanha" = u.campaign_cost,
    "CAC" = case when u.cards > 0 and u.campaign_cost >= 0 then u.campaign_cost / u.cards end,
    updated_at = coalesce(nullif(u.patch->>'updated_at', '')::timestamptz, now())
  from financials as u
  where a.id = u.update_id
  returning a.id;
  get diagnostics actual = row_count;
  if actual <> expected then raise exception 'Expected % updates, got % (missing ID or RLS)', expected, actual; end if;
end;
$$;

grant execute on function public.bulk_update_activities_from_json(jsonb) to anon, authenticated;

-- Exact numeric division for all writers, including new imported activities.
create or replace function public.activities_derive_cac()
returns trigger language plpgsql security invoker set search_path = public as $$
begin
  new."CAC" := case when new."Cartões Gerados" > 0 and new."Custo Total Campanha" >= 0
    then new."Custo Total Campanha" / new."Cartões Gerados" end;
  return new;
end;
$$;
revoke all on function public.activities_derive_cac() from public;
create trigger activities_derive_cac
before insert or update of "Cartões Gerados", "Custo Total Campanha", "CAC" on public.activities
for each row execute function public.activities_derive_cac();
