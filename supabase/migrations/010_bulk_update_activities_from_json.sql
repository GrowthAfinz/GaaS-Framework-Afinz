create or replace function public.bulk_update_activities_from_json(p_updates jsonb)
returns table(id uuid)
language plpgsql
security invoker
set search_path = public
as $$
begin
  return query
  with updates as (
    select
      (item->>'id')::uuid as update_id,
      item - 'id' as patch
    from jsonb_array_elements(coalesce(p_updates, '[]'::jsonb)) as item
    where item ? 'id'
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
    updated_at = coalesce(nullif(u.patch->>'updated_at', '')::timestamptz, now())
  from updates as u
  where a.id = u.update_id
  returning a.id;
end;
$$;

grant execute on function public.bulk_update_activities_from_json(jsonb) to anon, authenticated;
