-- Mapeamento manual de jornadas do SFMC: o nome exato da jornada (ou da activity, quando não há
-- jornada) vai para uma campanha do board, para o balde "sem campanha" de uma frente ou para
-- "a classificar". Passa na frente das regras por padrão em sfmc_consumo_rules.

create table public.sfmc_journey_map (
  journey text primary key check (length(journey) between 1 and 300),
  card_id uuid references public.crm_structure_cards(id),
  front text check (front is null or length(btrim(front)) between 2 and 80),
  group_label text check (group_label is null or length(btrim(group_label)) between 2 and 80),
  updated_at timestamptz not null default now(),
  updated_by uuid,
  check (card_id is not null or group_label is not null)
);

alter table public.sfmc_journey_map enable row level security;
revoke all on public.sfmc_journey_map from public, anon, authenticated;
grant select on public.sfmc_journey_map to authenticated;
grant all on public.sfmc_journey_map to service_role;
create policy sfmc_journey_map_read on public.sfmc_journey_map for select to authenticated using ((select auth.uid()) is not null);

-- Salva várias jornadas de uma vez. Cada item: {journey, card_id?, front?, group_label?, clear?}.
-- clear = true apaga o vínculo manual e a jornada volta a seguir as regras. Só admin.
create function public.sfmc_save_journey_map(p_items jsonb)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  it jsonb;
  n integer := 0;
  v_card uuid;
begin
  if not public.gaas_vault_is_admin() then raise exception 'crm_structure_access_denied'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) > 500 then raise exception 'sfmc_journey_map_invalid'; end if;
  for it in select * from jsonb_array_elements(p_items) loop
    if coalesce(btrim(it->>'journey'), '') = '' then raise exception 'sfmc_journey_map_invalid'; end if;
    if coalesce((it->>'clear')::boolean, false) then
      delete from public.sfmc_journey_map where journey = it->>'journey';
    else
      v_card := nullif(it->>'card_id', '')::uuid;
      if v_card is not null and not exists (select 1 from public.crm_structure_cards c where c.id = v_card and not c.archived) then
        raise exception 'sfmc_goal_card_invalid';
      end if;
      insert into public.sfmc_journey_map (journey, card_id, front, group_label, updated_at, updated_by)
      values (it->>'journey', v_card, nullif(btrim(it->>'front'), ''), nullif(btrim(it->>'group_label'), ''), now(), auth.uid())
      on conflict (journey) do update set card_id = excluded.card_id, front = excluded.front, group_label = excluded.group_label,
        updated_at = now(), updated_by = auth.uid();
    end if;
    n := n + 1;
  end loop;
  return n;
end;
$$;
revoke all on function public.sfmc_save_journey_map(jsonb) from public, anon;
grant execute on function public.sfmc_save_journey_map(jsonb) to authenticated, service_role;
