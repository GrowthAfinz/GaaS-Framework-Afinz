-- Sub Tarefas (plano Tarefas + Sub Tarefas, 17/11/2026).
-- Sub Tarefa é uma linha da mesma tabela com Tarefa pai: guarda chave, histórico, revisão, responsável,
-- prazo e dependências, e pode ser citada pela Daily (work_ids). Na tela é item de checklist do card.
-- Regras: um nível só; herda iniciativa, frente e projetos do pai; marcar Sub Tarefa não pede evidência;
-- Tarefa com Sub Tarefas só conclui com todas fechadas (concluídas ou canceladas) e com o texto de entrega.
-- Transformar Sub Tarefa em Tarefa = limpar parent_task_id (mesmo id, histórico e vínculos).
begin;

alter table public.growth_development_tasks
  add column if not exists parent_task_id uuid references public.growth_development_tasks(id),
  add column if not exists subtask_group text,
  add column if not exists position double precision;
create index if not exists growth_development_tasks_parent on public.growth_development_tasks (parent_task_id) where parent_task_id is not null;

do $$
declare
  d text := pg_get_functiondef('public.growth_save_development_task(uuid,integer,jsonb)'::regprocedure);
  step text;
  targets text[] := array[
    $t$declare n public.growth_development_tasks; previous public.growth_development_tasks; item text; v integer;begin$t$,
    $t$ if exists(select 1 from unnest(n.partner_keys) x where not exists(select 1 from public.daily_partners p where p.key=x)) then raise exception 'invalid_task_partners';end if;$t$,
    $t$ if n.status='concluida' and (n.resolution is null or cardinality(n.acceptance_criteria)=0 or cardinality(n.completed_criteria)<>cardinality(n.acceptance_criteria)) then raise exception 'task_completion_evidence_required';end if;$t$,
    $t$partner_keys=n.partner_keys,revision=n.revision,updated_at=n.updated_at where id=p_id;
 end if;$t$
  ];
  replacements text[] := array[
    $r$declare n public.growth_development_tasks; previous public.growth_development_tasks; par public.growth_development_tasks; item text; v integer;begin$r$,
    $r$ if exists(select 1 from unnest(n.partner_keys) x where not exists(select 1 from public.daily_partners p where p.key=x)) then raise exception 'invalid_task_partners';end if;
 -- Sub Tarefas (20261118 sub_tarefas)
 if p_body?'parent_task_id' then n.parent_task_id:=nullif(p_body->>'parent_task_id','')::uuid;end if;
 if p_body?'subtask_group' then n.subtask_group:=nullif(trim(p_body->>'subtask_group'),'');end if;
 if p_body?'position' then n.position:=nullif(p_body->>'position','')::double precision;end if;
 if n.parent_task_id is not null then
  if n.parent_task_id=n.id then raise exception 'task_parent_invalid';end if;
  select * into par from public.growth_development_tasks where id=n.parent_task_id;
  if not found then raise exception 'task_parent_invalid';end if;
  if par.parent_task_id is not null then raise exception 'task_parent_nested';end if;
  if p_id is not null and exists(select 1 from public.growth_development_tasks c where c.parent_task_id=n.id) then raise exception 'task_has_subtasks';end if;
  n.initiative_id:=par.initiative_id;n.front_key:=par.front_key;n.project_ids:=par.project_ids;n.workspace:=par.workspace;
 else
  n.subtask_group:=null;
 end if;$r$,
    $r$ if n.status='concluida' and n.parent_task_id is null then
  if exists(select 1 from public.growth_development_tasks c where c.parent_task_id=n.id) then
   if exists(select 1 from public.growth_development_tasks c where c.parent_task_id=n.id and c.status not in ('concluida','cancelada')) then raise exception 'task_subtasks_pending';end if;
   if n.resolution is null or cardinality(n.completed_criteria)<>cardinality(n.acceptance_criteria) then raise exception 'task_completion_evidence_required';end if;
  elsif n.resolution is null or cardinality(n.acceptance_criteria)=0 or cardinality(n.completed_criteria)<>cardinality(n.acceptance_criteria) then raise exception 'task_completion_evidence_required';end if;
 end if;$r$,
    $r$partner_keys=n.partner_keys,parent_task_id=n.parent_task_id,subtask_group=n.subtask_group,position=n.position,revision=n.revision,updated_at=n.updated_at where id=p_id;
 end if;
 -- Sub Tarefas acompanham iniciativa, frente e projetos do pai.
 if p_id is not null and n.parent_task_id is null and (n.initiative_id is distinct from previous.initiative_id or n.front_key is distinct from previous.front_key or n.project_ids is distinct from previous.project_ids) then
  update public.growth_development_tasks c set initiative_id=n.initiative_id,front_key=n.front_key,project_ids=n.project_ids,workspace=n.workspace,revision=c.revision+1,updated_at=clock_timestamp() where c.parent_task_id=n.id;
 end if;$r$
  ];
begin
  for i in 1..array_length(targets, 1) loop
    step := targets[i];
    if position(step in d) = 0 then raise exception 'task_save_anchor_not_found: %', left(step, 80); end if;
    d := replace(d, step, replacements[i]);
  end loop;
  execute d;
end $$;

commit;
