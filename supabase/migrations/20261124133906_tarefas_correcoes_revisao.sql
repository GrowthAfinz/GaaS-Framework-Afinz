-- Correções da revisão das entregas Tarefas + Sub Tarefas (PRs 135 a 141), 24/11/2026.
-- 1. Pai concluído ou cancelado não recebe Sub Tarefa aberta (nova, reaberta ou movida para baixo dele).
-- 2. growth_save_task_tree não cria pai já concluído antes das filhas; a conclusão vem no fim, com a regra valendo.
-- 3. Chave da nova Sub Tarefa sai do maior sufixo já usado (inclusive de ex-filhas), não de max(position).
-- 4. project_ids mantém a ordem informada (o primeiro projeto decide campanha e frente) e troca projeto juntado pelo destino.
-- 5. Trocar só o workspace recalcula a frente, e as Sub Tarefas acompanham.
-- 6. Juntar projetos da Daily também leva as Tarefas para o projeto destino.
-- 7. Pessoas só com nome: lista com revisão (renomear depois de recarregar funcionava só na mesma sessão),
--    arquivadas visíveis para exibição, renomear leva as Tarefas junto, ligar à conta grava o histórico da Daily,
--    recusa pessoa arquivada e junta quando a conta já está ligada a outra pessoa.
begin;

-- growth_save_development_task ------------------------------------------------------------------
do $$
declare
  d text := pg_get_functiondef('public.growth_save_development_task(uuid,integer,jsonb)'::regprocedure);
  step text;
  targets text[] := array[
    $t$select coalesce(array_agg(distinct x::uuid),'{}') into n.project_ids from jsonb_array_elements_text(p_body->'project_ids') x;$t$,
    $t$ n.workspace:=coalesce(p_body->>'workspace',n.workspace);$t$,
    $t$  if par.parent_task_id is not null then raise exception 'task_parent_nested';end if;$t$,
    $t$(n.initiative_id is distinct from previous.initiative_id or n.front_key is distinct from previous.front_key or n.project_ids is distinct from previous.project_ids)$t$
  ];
  replacements text[] := array[
    $r$select coalesce(array_agg(s.y order by s.o),'{}') into n.project_ids from (
   select coalesce((select p.merged_into from public.daily_projects p where p.id=x::uuid),x::uuid) y, min(o) o
   from jsonb_array_elements_text(p_body->'project_ids') with ordinality j(x,o) group by 1) s;$r$,
    $r$ n.workspace:=coalesce(p_body->>'workspace',n.workspace);
 if p_body?'workspace' and not p_body?'front_key' and n.workspace is distinct from previous.workspace then n.front_key:=public.growth_front_of_workspace(n.workspace);end if;$r$,
    $r$  if par.parent_task_id is not null then raise exception 'task_parent_nested';end if;
  -- Pai fechado não ganha filha aberta (correções 20261124). Filha que já estava aberta segue editável.
  if par.status in ('concluida','cancelada') and n.status not in ('concluida','cancelada')
     and (p_id is null or previous.parent_task_id is distinct from n.parent_task_id or previous.status in ('concluida','cancelada')) then
   raise exception 'task_parent_closed';
  end if;$r$,
    $r$(n.initiative_id is distinct from previous.initiative_id or n.front_key is distinct from previous.front_key or n.project_ids is distinct from previous.project_ids or n.workspace is distinct from previous.workspace)$r$
  ];
begin
  for i in 1..array_length(targets, 1) loop
    step := targets[i];
    if position(step in d) = 0 then raise exception 'task_save_anchor_not_found: %', left(step, 80); end if;
    d := replace(d, step, replacements[i]);
  end loop;
  execute d;
end $$;

-- growth_save_task_tree -----------------------------------------------------------------------------
create or replace function public.growth_save_task_tree(p_body jsonb)
returns jsonb language plpgsql security definer set search_path to '' as $$
declare tpl public.growth_task_templates; base jsonb := '{}'; subs jsonb := '[]'; parent jsonb; req jsonb; item jsonb;
  created jsonb := '[]'; pos double precision := 0; k integer := 0; pk text; key text; row jsonb;
begin
  if auth.uid() is null or not (public.gaas_vault_is_admin() or gaas_security.is_approved_member()) then raise exception 'development_access_denied'; end if;
  if p_body is null or jsonb_typeof(p_body) <> 'object' then raise exception 'task_tree_invalid'; end if;
  if nullif(p_body->>'template_key', '') is not null then
    select * into tpl from public.growth_task_templates where key = p_body->>'template_key' and not archived;
    if not found then raise exception 'template_not_found'; end if;
    base := coalesce(tpl.body->'task', '{}'); subs := coalesce(tpl.body->'subtasks', '[]');
  end if;
  if p_body ? 'subtasks' then
    if jsonb_typeof(p_body->'subtasks') <> 'array' then raise exception 'task_tree_invalid'; end if;
    subs := p_body->'subtasks';
  end if;
  if nullif(p_body->>'parent_id', '') is not null then
    select to_jsonb(t) into parent from public.growth_development_tasks t where t.id = (p_body->>'parent_id')::uuid;
    if parent is null then raise exception 'task_parent_invalid'; end if;
  else
    if p_body ? 'task' and jsonb_typeof(p_body->'task') <> 'object' then raise exception 'task_tree_invalid'; end if;
    req := base || coalesce(p_body->'task', '{}'::jsonb) || jsonb_build_object('parent_task_id', null);
    -- O pai nasce aberto; se o pedido veio concluído, a conclusão é aplicada depois das filhas.
    parent := public.growth_save_development_task(null, null, req - 'status' - 'resolution' - 'completed_criteria');
  end if;
  pk := parent->>'task_key';
  select coalesce(max(position), 0) into pos from public.growth_development_tasks where parent_task_id = (parent->>'id')::uuid;
  select coalesce(max(substring(t.task_key from length(pk) + 2)::integer), 0) into k
    from public.growth_development_tasks t
   where left(t.task_key, length(pk) + 1) = pk || '-' and substring(t.task_key from length(pk) + 2) ~ '^[0-9]{1,6}$';
  for item in select * from jsonb_array_elements(subs) loop
    if jsonb_typeof(item) <> 'object' or length(trim(coalesce(item->>'title', ''))) = 0 then raise exception 'task_tree_invalid'; end if;
    pos := pos + 1;
    if item ? 'due_in_days' and not item ? 'due_date' then
      item := item || jsonb_build_object('due_date', ((now() at time zone 'America/Sao_Paulo')::date + (item->>'due_in_days')::integer)::text);
    end if;
    key := nullif(item->>'task_key', '');
    if key is null then
      loop
        k := k + 1;
        key := pk || '-' || lpad(k::text, 2, '0');
        exit when not exists (select 1 from public.growth_development_tasks t where t.task_key = key);
      end loop;
    end if;
    row := public.growth_save_development_task(null, null,
      (item - 'due_in_days') || jsonb_build_object('parent_task_id', parent->>'id', 'position', coalesce((item->>'position')::double precision, pos), 'task_key', key));
    created := created || jsonb_build_array(row);
  end loop;
  if req is not null and (req ? 'status' or req ? 'resolution' or req ? 'completed_criteria') then
    parent := public.growth_save_development_task((parent->>'id')::uuid, (parent->>'revision')::integer,
      jsonb_strip_nulls(jsonb_build_object('status', req->'status', 'resolution', req->'resolution', 'completed_criteria', req->'completed_criteria')));
  end if;
  return jsonb_build_object('task', parent, 'subtasks', created);
end $$;
revoke all on function public.growth_save_task_tree(jsonb) from public, anon;
grant execute on function public.growth_save_task_tree(jsonb) to authenticated, service_role;

-- gaas_daily_merge_projects: Tarefas vão junto -------------------------------------------------------
do $$
declare
  d text := pg_get_functiondef('public.gaas_daily_merge_projects(uuid,uuid)'::regprocedure);
  step text := $t$  update public.daily_projects set archived = true, merged_into = p_into$t$;
begin
  if position(step in d) = 0 then raise exception 'merge_anchor_not_found'; end if;
  d := replace(d, step, $r$  -- Tarefas e Sub Tarefas que citavam o projeto de origem passam a citar o destino (correções 20261124).
  update public.growth_development_tasks t
     set project_ids = array(select y from (select y, min(o) o from unnest(array_replace(t.project_ids, p_from, p_into)) with ordinality u(y, o) group by y) s order by o),
         revision = t.revision + 1, updated_at = clock_timestamp()
   where p_from = any(t.project_ids);
$r$ || step);
  execute d;
end $$;

-- Pessoas ------------------------------------------------------------------------------------------
drop function if exists public.gaas_work_people();
create function public.gaas_work_people(p_include_archived boolean default false)
returns table (id uuid, name text, has_account boolean, revision integer, archived boolean)
language plpgsql stable security definer set search_path to '' as $$
begin
  perform public.gaas_daily_require_member();
  return query
    select m.user_id, public.gaas_member_display_name(m.user_id), true, null::integer, false
      from gaas_security.approved_members m where m.enabled
    union all
    select w.id, trim(w.name), false, w.revision, w.archived
      from public.work_people w where w.member_id is null and (p_include_archived or not w.archived)
    order by 2;
end $$;
revoke all on function public.gaas_work_people(boolean) from public, anon;
grant execute on function public.gaas_work_people(boolean) to authenticated, service_role;

create or replace function public.gaas_daily_people()
returns table (id uuid, name text)
language plpgsql stable security definer set search_path to '' as $$
begin
  return query select p.id, p.name from public.gaas_work_people(false) p;
end $$;

do $$
declare
  d text := pg_get_functiondef('public.gaas_work_save_person(uuid,integer,jsonb)'::regprocedure);
  step text := $t$  n.revision := n.revision + 1; n.updated_at := clock_timestamp();$t$;
begin
  if position(step in d) = 0 then raise exception 'save_person_anchor_not_found'; end if;
  d := replace(d, 'declare uid uuid := public.gaas_daily_require_member(); n public.work_people;',
                  'declare uid uuid := public.gaas_daily_require_member(); n public.work_people; old_name text;');
  d := replace(d, $t$    if n.member_id is not null then raise exception 'person_has_account'; end if;$t$,
                  $t$    if n.member_id is not null then raise exception 'person_has_account'; end if;
    old_name := n.name;$t$);
  d := replace(d, step, step || $r$
  -- Renomear leva as Tarefas junto (nas Tarefas a pessoa é texto em owner_label).
  if old_name is not null and lower(trim(old_name)) <> lower(n.name) then
    update public.growth_development_tasks t set owner_label = n.name, revision = t.revision + 1, updated_at = clock_timestamp()
     where lower(trim(t.owner_label)) = lower(trim(old_name));
  end if;$r$);
  if position('old_name := n.name' in d) = 0 then raise exception 'save_person_anchor_not_found'; end if;
  execute d;
end $$;

create or replace function public.gaas_work_link_person(p_person uuid, p_member uuid)
returns jsonb language plpgsql security definer set search_path to '' as $$
declare uid uuid := public.gaas_daily_require_member(); w public.work_people; e public.daily_entries; nxt public.daily_entries;
  member_name text; moved integer := 0; renamed integer; already boolean;
begin
  select * into w from public.work_people where id = p_person for update;
  if not found or w.member_id is not null then raise exception 'person_not_found'; end if;
  if w.archived then raise exception 'person_archived'; end if;
  if not exists (select 1 from gaas_security.approved_members m where m.user_id = p_member and m.enabled) then raise exception 'person_member_invalid'; end if;
  member_name := public.gaas_member_display_name(p_member);
  for e in select * from public.daily_entries x where x.responsible_id = p_person or p_person = any(x.follower_ids) for update loop
    nxt := e;
    nxt.responsible_id := case when e.responsible_id = p_person then p_member else e.responsible_id end;
    nxt.follower_ids := array(select distinct case when f = p_person then p_member else f end from unnest(e.follower_ids) f order by 1);
    nxt.revision := e.revision + 1; nxt.updated_at := clock_timestamp();
    update public.daily_entries set responsible_id = nxt.responsible_id, follower_ids = nxt.follower_ids, revision = nxt.revision, updated_at = nxt.updated_at where id = e.id;
    insert into public.daily_events(entity, entity_id, revision, actor_id, before_data, after_data)
    values ('entry', e.id::text, nxt.revision, uid, to_jsonb(e), to_jsonb(nxt));
    moved := moved + 1;
  end loop;
  update public.growth_development_tasks t
     set owner_label = member_name, revision = t.revision + 1, updated_at = clock_timestamp()
   where lower(trim(t.owner_label)) = lower(trim(w.name));
  get diagnostics renamed = row_count;
  -- A conta já está ligada a outra pessoa: esta fica arquivada (os registros já foram para a conta).
  already := exists (select 1 from public.work_people x where x.member_id = p_member);
  if already then
    update public.work_people set archived = true, revision = revision + 1, updated_at = clock_timestamp() where id = p_person;
  else
    update public.work_people set member_id = p_member, revision = revision + 1, updated_at = clock_timestamp() where id = p_person;
  end if;
  return jsonb_build_object('person', p_person, 'member', p_member, 'daily_entries', moved, 'tasks', renamed, 'merged', already);
end $$;
revoke all on function public.gaas_work_link_person(uuid, uuid) from public, anon;
grant execute on function public.gaas_work_link_person(uuid, uuid) to authenticated, service_role;

commit;
