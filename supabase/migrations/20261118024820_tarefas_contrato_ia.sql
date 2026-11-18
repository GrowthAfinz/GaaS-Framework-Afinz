-- Contrato para IA (plano Tarefas + Sub Tarefas, 17/11/2026): quase nada é criado à mão, então
-- modelos e criação ficam num caminho único, claro e versionado.
-- * growth_task_templates: modelos de Tarefa editáveis na tela e legíveis pela IA.
-- * growth_save_task_tree: cria a Tarefa com todas as Sub Tarefas numa transação (de um modelo ou de JSON),
--   ou acrescenta Sub Tarefas a uma Tarefa existente. Usa growth_save_development_task para cada linha,
--   então valem as mesmas regras, revisões e histórico.
begin;

create table public.growth_task_templates (
  id uuid primary key default gen_random_uuid(),
  key text not null unique check (key ~ '^[a-z0-9][a-z0-9_-]{1,60}$'),
  title text not null check (length(trim(title)) between 2 and 120),
  description text not null default '',
  body jsonb not null default '{}' check (jsonb_typeof(body) = 'object'),
  archived boolean not null default false,
  revision integer not null default 1,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.growth_task_templates enable row level security;
revoke all on public.growth_task_templates from public, anon, authenticated;
grant select on public.growth_task_templates to authenticated;
grant all on public.growth_task_templates to service_role;
create policy growth_task_templates_read on public.growth_task_templates for select to authenticated using ((select gaas_security.is_approved_member()));
create policy gaas_approved_member_gate on public.growth_task_templates as restrictive for all to anon, authenticated
  using ((select gaas_security.is_approved_member())) with check ((select gaas_security.is_approved_member()));

/**
 * Salva um modelo. body: { task: {campos da Tarefa}, subtasks: [{title, subtask_group?, owner_label?, due_in_days?}] }.
 * Modelo nunca guarda conclusão: status, entrega, critérios marcados e datas de conclusão são descartados.
 */
create or replace function public.growth_save_task_template(p_id uuid, p_revision integer, p_body jsonb)
returns jsonb language plpgsql security definer set search_path to '' as $$
declare n public.growth_task_templates; t jsonb;
begin
  if auth.uid() is null or not (public.gaas_vault_is_admin() or gaas_security.is_approved_member()) then raise exception 'development_access_denied'; end if;
  if p_body is null or jsonb_typeof(p_body) <> 'object' then raise exception 'template_invalid'; end if;
  if p_id is not null then
    select * into n from public.growth_task_templates where id = p_id for update;
    if not found then raise exception 'template_not_found'; end if;
    if n.revision is distinct from p_revision then raise exception 'template_revision_conflict'; end if;
  else
    n.id := gen_random_uuid(); n.revision := 0; n.archived := false; n.created_by := auth.uid(); n.created_at := now(); n.body := '{}'; n.description := '';
  end if;
  if p_body ? 'key' then n.key := lower(trim(p_body->>'key')); end if;
  if p_body ? 'title' then n.title := trim(p_body->>'title'); end if;
  if p_body ? 'description' then n.description := coalesce(p_body->>'description', ''); end if;
  if p_body ? 'archived' then n.archived := (p_body->>'archived')::boolean; end if;
  if p_body ? 'body' then
    if jsonb_typeof(p_body->'body') <> 'object' then raise exception 'template_invalid'; end if;
    t := coalesce(p_body->'body'->'task', '{}'::jsonb) - array['status','resolution','completed_criteria','id','revision','task_key','parent_task_id','blocked_reason'];
    if t ? 'details' and jsonb_typeof(t->'details') = 'object' then t := jsonb_set(t, '{details}', (t->'details') - 'completed_on'); end if;
    if (p_body->'body') ? 'subtasks' and jsonb_typeof(p_body->'body'->'subtasks') <> 'array' then raise exception 'template_invalid'; end if;
    n.body := jsonb_build_object('task', t, 'subtasks', coalesce(p_body->'body'->'subtasks', '[]'::jsonb), 'groups', coalesce(p_body->'body'->'groups', '[]'::jsonb));
  end if;
  if n.key is null or n.title is null then raise exception 'template_invalid'; end if;
  n.revision := n.revision + 1; n.updated_at := clock_timestamp();
  if p_id is null then insert into public.growth_task_templates select (n).*;
  else update public.growth_task_templates set key = n.key, title = n.title, description = n.description, body = n.body, archived = n.archived, revision = n.revision, updated_at = n.updated_at where id = n.id; end if;
  return to_jsonb(n);
end $$;
revoke all on function public.growth_save_task_template(uuid, integer, jsonb) from public, anon;
grant execute on function public.growth_save_task_template(uuid, integer, jsonb) to authenticated, service_role;

/**
 * Cria a árvore inteira numa transação.
 * p_body: { template_key?: text, task?: {campos}, subtasks?: [{title, subtask_group?, owner_label?, due_date?, due_in_days?, ...}],
 *           parent_id?: uuid (acrescenta Sub Tarefas a uma Tarefa existente, sem criar outra) }
 * Campos de task sobrescrevem os do modelo; subtasks informadas substituem as do modelo.
 * Retorna { task, subtasks: [...] }. Falha em qualquer linha desfaz tudo.
 */
create or replace function public.growth_save_task_tree(p_body jsonb)
returns jsonb language plpgsql security definer set search_path to '' as $$
declare tpl public.growth_task_templates; base jsonb := '{}'; subs jsonb := '[]'; parent jsonb; item jsonb; created jsonb := '[]'; pos integer := 0; row jsonb;
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
    select coalesce(max(position), 0)::integer into pos from public.growth_development_tasks where parent_task_id = (parent->>'id')::uuid;
  else
    if p_body ? 'task' and jsonb_typeof(p_body->'task') <> 'object' then raise exception 'task_tree_invalid'; end if;
    parent := public.growth_save_development_task(null, null, base || coalesce(p_body->'task', '{}'::jsonb) || jsonb_build_object('parent_task_id', null));
  end if;
  for item in select * from jsonb_array_elements(subs) loop
    if jsonb_typeof(item) <> 'object' or length(trim(coalesce(item->>'title', ''))) = 0 then raise exception 'task_tree_invalid'; end if;
    pos := pos + 1;
    if item ? 'due_in_days' and not item ? 'due_date' then
      item := item || jsonb_build_object('due_date', ((now() at time zone 'America/Sao_Paulo')::date + (item->>'due_in_days')::integer)::text);
    end if;
    row := public.growth_save_development_task(null, null,
      (item - 'due_in_days') || jsonb_build_object('parent_task_id', parent->>'id', 'position', coalesce((item->>'position')::double precision, pos),
        'task_key', coalesce(nullif(item->>'task_key', ''), (parent->>'task_key') || '-' || lpad(pos::text, 2, '0'))));
    created := created || jsonb_build_array(row);
  end loop;
  return jsonb_build_object('task', parent, 'subtasks', created);
end $$;
revoke all on function public.growth_save_task_tree(jsonb) from public, anon;
grant execute on function public.growth_save_task_tree(jsonb) to authenticated, service_role;

commit;
