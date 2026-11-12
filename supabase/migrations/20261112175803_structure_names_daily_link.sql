-- Nomes das campanhas e grupos do Mapeamento (Consumo SFMC) e ligação dos projetos da Visão Daily com as
-- campanhas do board. Tudo liga por id: renomear de um lado não solta nada do outro.
begin;

-- Projeto da Daily aponta para uma campanha do board (vários projetos podem apontar para a mesma).
alter table public.daily_projects add column structure_card_id uuid references public.crm_structure_cards(id);
create index daily_projects_structure_card_idx on public.daily_projects(structure_card_id) where structure_card_id is not null;

create or replace function public.gaas_daily_save_project(p_id uuid, p_revision integer, p_body jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare uid uuid := public.gaas_daily_require_member(); n public.daily_projects; previous public.daily_projects;
begin
  if p_body is null or jsonb_typeof(p_body) <> 'object' then raise exception 'daily_invalid_body'; end if;
  if p_id is not null then
    select * into n from public.daily_projects where id = p_id for update;
    if not found then raise exception 'daily_not_found'; end if;
    if n.revision is distinct from p_revision then raise exception 'daily_revision_conflict'; end if;
    previous := n;
  else
    n.id := gen_random_uuid(); n.revision := 0; n.partner_keys := '{}'; n.wiki_note := ''; n.archived := false;
    n.created_by := uid; n.created_at := now();
  end if;
  if p_body ? 'name' then n.name := trim(p_body->>'name'); end if;
  if p_body ? 'frente_key' then n.frente_key := p_body->>'frente_key'; end if;
  if p_body ? 'wiki_note' then n.wiki_note := coalesce(trim(p_body->>'wiki_note'), ''); end if;
  if p_body ? 'initiative_id' then n.initiative_id := nullif(p_body->>'initiative_id', '')::uuid; end if;
  if p_body ? 'structure_card_id' then n.structure_card_id := nullif(p_body->>'structure_card_id', '')::uuid; end if;
  if p_body ? 'archived' then n.archived := (p_body->>'archived')::boolean; end if;
  if p_body ? 'partner_keys' then
    if jsonb_typeof(p_body->'partner_keys') <> 'array' then raise exception 'daily_partners_invalid'; end if;
    n.partner_keys := array(select distinct v from jsonb_array_elements_text(p_body->'partner_keys') v order by 1);
  end if;
  if coalesce(length(n.name), 0) < 2 then raise exception 'daily_name_required'; end if;
  if n.frente_key is null or not exists (select 1 from public.daily_frentes f where f.key = n.frente_key) then raise exception 'daily_frente_invalid'; end if;
  if exists (select 1 from unnest(n.partner_keys) k where not exists (select 1 from public.daily_partners p where p.key = k)) then raise exception 'daily_partners_invalid'; end if;
  if n.structure_card_id is distinct from previous.structure_card_id and n.structure_card_id is not null
     and not exists (select 1 from public.crm_structure_cards c where c.id = n.structure_card_id and not c.archived) then
    raise exception 'daily_card_invalid';
  end if;
  if not n.archived and exists (select 1 from public.daily_projects p where lower(p.name) = lower(n.name) and not p.archived and p.id <> n.id) then
    raise exception 'daily_project_name_taken';
  end if;
  if p_id is not null and to_jsonb(n) = to_jsonb(previous) then return to_jsonb(n); end if;
  n.revision := n.revision + 1; n.updated_at := clock_timestamp();
  if p_id is null then insert into public.daily_projects select (n).*;
  else update public.daily_projects set name = n.name, frente_key = n.frente_key, partner_keys = n.partner_keys, wiki_note = n.wiki_note,
    initiative_id = n.initiative_id, structure_card_id = n.structure_card_id, archived = n.archived, revision = n.revision, updated_at = n.updated_at where id = n.id; end if;
  insert into public.daily_events(entity, entity_id, revision, actor_id, before_data, after_data)
  values ('project', n.id::text, n.revision, uid, case when p_id is null then null else to_jsonb(previous) end, to_jsonb(n));
  return to_jsonb(n);
end $$;

-- Renomeia um grupo do Mapeamento (texto repetido nas regras e no mapa manual) de uma vez. Só admin.
create function public.sfmc_rename_group(p_from text, p_to text) returns integer
language plpgsql security definer set search_path = public as $$
declare n integer := 0; k integer;
begin
  if not public.gaas_vault_is_admin() then raise exception 'crm_structure_access_denied'; end if;
  if coalesce(btrim(p_from), '') = '' or length(btrim(coalesce(p_to, ''))) not between 2 and 80 then raise exception 'sfmc_group_name_invalid'; end if;
  update public.sfmc_consumo_rules set group_label = btrim(p_to) where group_label = p_from; get diagnostics k = row_count; n := n + k;
  update public.sfmc_journey_map set group_label = btrim(p_to), updated_at = now(), updated_by = auth.uid() where group_label = p_from; get diagnostics k = row_count; n := n + k;
  if n = 0 then raise exception 'sfmc_group_not_found'; end if;
  return n;
end $$;

-- Transforma um grupo em campanha do board: regras e vínculos manuais do grupo passam a apontar para o card. Só admin.
create function public.sfmc_promote_group(p_label text, p_card_id uuid) returns integer
language plpgsql security definer set search_path = public as $$
declare n integer := 0; k integer;
begin
  if not public.gaas_vault_is_admin() then raise exception 'crm_structure_access_denied'; end if;
  if not exists (select 1 from public.crm_structure_cards c where c.id = p_card_id and not c.archived) then raise exception 'sfmc_goal_card_invalid'; end if;
  update public.sfmc_consumo_rules set card_id = p_card_id, group_label = null where group_label = p_label; get diagnostics k = row_count; n := n + k;
  update public.sfmc_journey_map set card_id = p_card_id, group_label = null, updated_at = now(), updated_by = auth.uid() where group_label = p_label; get diagnostics k = row_count; n := n + k;
  if n = 0 then raise exception 'sfmc_group_not_found'; end if;
  return n;
end $$;

revoke all on function public.sfmc_rename_group(text, text) from public, anon;
revoke all on function public.sfmc_promote_group(text, uuid) from public, anon;
grant execute on function public.sfmc_rename_group(text, text) to authenticated, service_role;
grant execute on function public.sfmc_promote_group(text, uuid) to authenticated, service_role;

commit;
