-- Pertencimento da Tarefa numa fonte só (plano Tarefas + Sub Tarefas, 17/11/2026):
-- * front_key: frente da Tarefa (chave de daily_frentes, ou 'gaas' para o SDD). Sem valor, vem da iniciativa
--   e, sem iniciativa, da coluna antiga workspace. workspace passa a acompanhar a frente.
-- * project_ids: a Tarefa pode estar em mais de um projeto da Visão Daily.
-- * partner_keys: BU/parceiro da Tarefa (chaves de daily_partners), opcional.
-- * details passa a ser mesclado (chave com valor nulo remove), para uma tela não apagar o que outra gravou.
begin;

alter table public.growth_development_tasks
  add column if not exists front_key text,
  add column if not exists project_ids uuid[] not null default '{}',
  add column if not exists partner_keys text[] not null default '{}';

/** Frente padrão a partir da coluna antiga (workspace). */
create or replace function public.growth_front_of_workspace(p_workspace text) returns text
language sql immutable set search_path to '' as $$
  select case p_workspace when 'acquisition' then 'aq' when 'monetization' then 're' when 'cross_sell' then 'se' when 'sdd' then 'gaas' else 'aq' end;
$$;
/** Coluna antiga (workspace) que acompanha a frente. */
create or replace function public.growth_workspace_of_front(p_front text) returns text
language sql immutable set search_path to '' as $$
  select case p_front when 're' then 'monetization' when 'se' then 'cross_sell' when 'gaas' then 'sdd' else 'acquisition' end;
$$;

do $$
declare
  d text := pg_get_functiondef('public.growth_save_development_task(uuid,integer,jsonb)'::regprocedure);
  hits integer := 0;
  step text;
  targets text[] := array[
    $t$n.details:='{}';n.links:='[]';n.next_action:='';$t$,
    $t$if p_body?'details' then n.details:=p_body->'details';end if;$t$,
    $t$if p_body?'links' then n.links:=p_body->'links';end if;$t$,
    $t$next_action=n.next_action,revision=n.revision$t$,
    $t$ if p_id is not null and to_jsonb(n)=to_jsonb(previous) then return to_jsonb(n);end if;$t$
  ];
  replacements text[] := array[
    $r$n.details:='{}';n.links:='[]';n.next_action:='';n.project_ids:='{}';n.partner_keys:='{}';$r$,
    $r$if p_body?'details' then
  if jsonb_typeof(p_body->'details')<>'object' then raise exception 'invalid_task_details';end if;
  n.details:=jsonb_strip_nulls(coalesce(n.details,'{}'::jsonb)||(p_body->'details'));
 end if;$r$,
    $r$if p_body?'links' then n.links:=p_body->'links';end if;
 -- pertencimento: frente, projetos e BU/parceiro (20261118 tarefas_pertencimento)
 if p_body?'front_key' then
  n.front_key:=nullif(trim(p_body->>'front_key'),'');
  if n.front_key is not null then n.workspace:=public.growth_workspace_of_front(n.front_key);end if;
 end if;
 if p_body?'project_ids' then
  if jsonb_typeof(p_body->'project_ids')<>'array' then raise exception 'invalid_task_projects';end if;
  select coalesce(array_agg(distinct x::uuid),'{}') into n.project_ids from jsonb_array_elements_text(p_body->'project_ids') x;
 end if;
 if p_body?'partner_keys' then
  if jsonb_typeof(p_body->'partner_keys')<>'array' then raise exception 'invalid_task_partners';end if;
  select coalesce(array_agg(distinct x order by x),'{}') into n.partner_keys from jsonb_array_elements_text(p_body->'partner_keys') x;
 end if;
 if n.front_key is not null and n.front_key<>'gaas' and not exists(select 1 from public.daily_frentes f where f.key=n.front_key) then raise exception 'invalid_task_front';end if;
 if exists(select 1 from unnest(n.project_ids) x where not exists(select 1 from public.daily_projects p where p.id=x)) then raise exception 'invalid_task_projects';end if;
 if exists(select 1 from unnest(n.partner_keys) x where not exists(select 1 from public.daily_partners p where p.key=x)) then raise exception 'invalid_task_partners';end if;$r$,
    $r$next_action=n.next_action,front_key=n.front_key,project_ids=n.project_ids,partner_keys=n.partner_keys,revision=n.revision$r$,
    $r$ if n.front_key is null then
  n.front_key:=public.growth_front_of_workspace(coalesce((select i.workspace from public.growth_work_initiatives i where i.id=n.initiative_id),n.workspace));
 end if;
 if p_id is not null and to_jsonb(n)=to_jsonb(previous) then return to_jsonb(n);end if;$r$
  ];
begin
  for i in 1..array_length(targets, 1) loop
    step := targets[i];
    if position(step in d) = 0 then raise exception 'task_save_anchor_not_found: %', step; end if;
    d := replace(d, step, replacements[i]);
    hits := hits + 1;
  end loop;
  execute d;
end $$;

commit;
