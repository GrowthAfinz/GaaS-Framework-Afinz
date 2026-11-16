-- Visão Daily ligada ao kanban de Tarefas e atividades (16/11/2026).
-- 1. Um registro da Daily pode citar trabalhos (growth_development_tasks) por id.
-- 2. Decisão do Pablo: todo membro aprovado vê e move os cards. Leitura de trabalhos e iniciativas
--    deixa de ser só admin, e salvar trabalho passa a aceitar membro aprovado. Iniciativa continua admin.
-- 3. Iniciativa de Aquisição vira "Aquisição CRM" e recebe os projetos de Aquisição e Meio de funil;
--    nasce "Pool de Ofertas - Parceiros" em Rentabilização, ligada ao projeto Pool Parceiros.
begin;

alter table public.daily_entries add column if not exists work_ids uuid[] not null default '{}';
create index if not exists daily_entries_work_ids on public.daily_entries using gin (work_ids);

/* ---------- leitura para membro aprovado ---------- */
drop policy if exists development_tasks_member_read on public.growth_development_tasks;
create policy development_tasks_member_read on public.growth_development_tasks for select to authenticated
  using ((select gaas_security.is_approved_member()));
drop policy if exists initiatives_member_read on public.growth_work_initiatives;
create policy initiatives_member_read on public.growth_work_initiatives for select to authenticated
  using ((select gaas_security.is_approved_member()));

/* ---------- registro da Daily com trabalhos citados ---------- */
create or replace function public.gaas_daily_save_entry(p_id uuid, p_revision integer, p_body jsonb)
 returns jsonb language plpgsql security definer set search_path to '' as $function$
declare uid uuid := public.gaas_daily_require_member(); n public.daily_entries; previous public.daily_entries;
begin
  if p_body is null or jsonb_typeof(p_body) <> 'object' then raise exception 'daily_invalid_body'; end if;
  if p_id is not null then
    select * into n from public.daily_entries where id = p_id for update;
    if not found or n.deleted_at is not null then raise exception 'daily_not_found'; end if;
    if n.revision is distinct from p_revision then raise exception 'daily_revision_conflict'; end if;
    previous := n;
  else
    n.id := gen_random_uuid(); n.revision := 0; n.tag_keys := '{}'; n.follower_ids := '{}'; n.work_ids := '{}'; n.source := 'app';
    n.responsible_id := uid; n.created_by := uid; n.created_at := now();
  end if;
  if p_body ? 'day' then n.day := (p_body->>'day')::date; end if;
  if p_body ? 'project_id' then n.project_id := (p_body->>'project_id')::uuid; end if;
  if p_body ? 'body' then n.body := trim(p_body->>'body'); end if;
  if p_body ? 'position' then n.position := (p_body->>'position')::double precision;
  elsif p_id is null then n.position := coalesce((select max(position) from public.daily_entries where day = n.day and deleted_at is null), 0) + 1; end if;
  if p_body ? 'tag_keys' then
    if jsonb_typeof(p_body->'tag_keys') <> 'array' then raise exception 'daily_tags_invalid'; end if;
    n.tag_keys := array(select distinct v from jsonb_array_elements_text(p_body->'tag_keys') v order by 1);
  end if;
  if p_body ? 'responsible_id' then n.responsible_id := nullif(p_body->>'responsible_id', '')::uuid; end if;
  if p_body ? 'follower_ids' then
    if jsonb_typeof(p_body->'follower_ids') <> 'array' then raise exception 'daily_followers_invalid'; end if;
    n.follower_ids := array(select distinct v::uuid from jsonb_array_elements_text(p_body->'follower_ids') v order by 1);
  end if;
  if p_body ? 'work_ids' then
    if jsonb_typeof(p_body->'work_ids') <> 'array' then raise exception 'daily_work_invalid'; end if;
    n.work_ids := array(select distinct v::uuid from jsonb_array_elements_text(p_body->'work_ids') v order by 1);
  end if;
  if n.day is null or n.day < date '2020-01-01' or n.day > current_date + 400 then raise exception 'daily_day_invalid'; end if;
  if coalesce(length(n.body), 0) < 1 then raise exception 'daily_body_required'; end if;
  if n.project_id is null or not exists (select 1 from public.daily_projects p where p.id = n.project_id and not p.archived) then
    if p_id is null or previous.project_id is distinct from n.project_id then raise exception 'daily_project_invalid'; end if;
  end if;
  if exists (select 1 from unnest(n.tag_keys) k where not exists (select 1 from public.daily_tags t where t.key = k)) then raise exception 'daily_tags_invalid'; end if;
  if n.responsible_id is not null and not exists (select 1 from auth.users u where u.id = n.responsible_id) then raise exception 'daily_person_invalid'; end if;
  if exists (select 1 from unnest(n.follower_ids) f where not exists (select 1 from auth.users u where u.id = f)) then raise exception 'daily_person_invalid'; end if;
  if (p_id is null or n.work_ids is distinct from previous.work_ids)
     and exists (select 1 from unnest(n.work_ids) w where not exists (select 1 from public.growth_development_tasks t where t.id = w)) then
    raise exception 'daily_work_invalid';
  end if;
  if coalesce((p_body->>'deleted')::boolean, false) then n.deleted_at := clock_timestamp(); end if;
  if p_id is not null and to_jsonb(n) = to_jsonb(previous) then return to_jsonb(n); end if;
  n.revision := n.revision + 1; n.updated_at := clock_timestamp();
  if p_id is null then insert into public.daily_entries select (n).*;
  else update public.daily_entries set day = n.day, project_id = n.project_id, body = n.body, tag_keys = n.tag_keys,
    responsible_id = n.responsible_id, follower_ids = n.follower_ids, work_ids = n.work_ids, position = n.position, deleted_at = n.deleted_at,
    revision = n.revision, updated_at = n.updated_at where id = n.id; end if;
  insert into public.daily_events(entity, entity_id, revision, actor_id, before_data, after_data)
  values ('entry', n.id::text, n.revision, uid, case when p_id is null then null else to_jsonb(previous) end, to_jsonb(n));
  return to_jsonb(n);
end $function$;

/* ---------- salvar trabalho: admin ou membro aprovado ----------
   Corpo idêntico ao vigente em produção (16/11/2026, com completion_date_v1); só a primeira checagem mudou. */
create or replace function public.growth_save_development_task(p_id uuid, p_revision integer, p_body jsonb)
 returns jsonb language plpgsql security definer set search_path to '' as $function$
declare n public.growth_development_tasks; previous public.growth_development_tasks; item text; v integer;begin
 if auth.uid() is null or not (public.gaas_vault_is_admin() or gaas_security.is_approved_member()) then raise exception 'development_access_denied';end if;
 if p_body is null or jsonb_typeof(p_body)<>'object' then raise exception 'invalid_task';end if;
 perform pg_advisory_xact_lock(hashtext('growth-development-dependencies'));
 if p_id is not null then
 select * into strict n from public.growth_development_tasks where id=p_id for update;
 if p_revision is distinct from n.revision then raise exception 'task_revision_conflict';end if;
 previous:=n;
 else
 n.id:=gen_random_uuid(); n.task_key:=coalesce(nullif(trim(p_body->>'task_key'),''),'DEV-'||substr(n.id::text,1,8));
 n.status:='backlog';n.priority:='P2';n.area:='Loop de Memória';n.description:='';
 n.dependencies:='{}';n.acceptance_criteria:='{}';n.completed_criteria:='{}';
 n.workspace:='sdd';n.work_type:='task';n.related_workspaces:='{}';n.details:='{}';n.links:='[]';n.next_action:='';
 n.created_by:=auth.uid();n.created_at:=now();n.revision:=0;
 end if;
 n.title:=coalesce(p_body->>'title',n.title);n.description:=coalesce(p_body->>'description',n.description);
 n.area:=coalesce(p_body->>'area',n.area);n.priority:=coalesce(p_body->>'priority',n.priority);
 n.status:=coalesce(p_body->>'status',n.status);
 if p_body?'owner_label' then n.owner_label:=nullif(trim(p_body->>'owner_label'),'');end if;
 if p_body?'due_date' then n.due_date:=nullif(p_body->>'due_date','')::date;end if;
 if p_body?'blocked_reason' then n.blocked_reason:=nullif(trim(p_body->>'blocked_reason'),'');end if;
 if p_body?'resolution' then n.resolution:=nullif(trim(p_body->>'resolution'),'');end if;
 if p_body?'source_note' then n.source_note:=nullif(trim(p_body->>'source_note'),'');end if;
 if p_body?'dependencies' then select coalesce(array_agg(distinct x),'{}') into n.dependencies from jsonb_array_elements_text(p_body->'dependencies') x;end if;
 if p_body?'acceptance_criteria' then
 select coalesce(array_agg(x),'{}') into n.acceptance_criteria from jsonb_array_elements_text(p_body->'acceptance_criteria') x;
 if p_id is not null and n.acceptance_criteria is distinct from previous.acceptance_criteria then n.completed_criteria:='{}';end if;
 end if;
 if p_body?'completed_criteria' and not (p_id is not null and n.acceptance_criteria is distinct from previous.acceptance_criteria) then select coalesce(array_agg(distinct x::integer),'{}') into n.completed_criteria from jsonb_array_elements_text(p_body->'completed_criteria') x;end if;

 n.workspace:=coalesce(p_body->>'workspace',n.workspace);
 n.work_type:=coalesce(p_body->>'work_type',n.work_type);
 n.next_action:=coalesce(p_body->>'next_action',n.next_action);
 if p_body?'initiative_id' then n.initiative_id:=nullif(p_body->>'initiative_id','')::uuid;end if;
 if p_body?'related_workspaces' then select coalesce(array_agg(distinct x),'{}') into n.related_workspaces from jsonb_array_elements_text(p_body->'related_workspaces') x;end if;
 if p_body?'details' then n.details:=p_body->'details';end if;
 if p_body?'links' then n.links:=p_body->'links';end if;
 if jsonb_typeof(n.details)<>'object' or jsonb_typeof(n.links)<>'array' then raise exception 'invalid_work_details';end if;
 if exists(select 1 from jsonb_each(n.details) d where jsonb_typeof(d.value)<>'string') then raise exception 'invalid_work_details';end if;
 if exists(select 1 from jsonb_array_elements(n.links) l where jsonb_typeof(l)<>'object' or coalesce(l->>'kind','') not in ('note','execution','evidence','proposal','work') or coalesce(l->>'state','') not in ('suggested','confirmed') or coalesce(l->>'label','')='' or coalesce(l->>'url','')!~ '^(https://|\?view=learning&|[0-9]{2}-[^:]+/)' or coalesce(l->>'url','')~ '[[:cntrl:]]') then raise exception 'invalid_work_link';end if;
 if exists(select 1 from unnest(n.related_workspaces) w where w not in ('sdd','acquisition','monetization','cross_sell')) then raise exception 'invalid_workspace';end if;
 if n.work_type='experiment' then
  if coalesce(n.details->>'phase','design') not in ('design','ready','running','reading','closed','cancelled') or coalesce(n.details->>'verdict','pending') not in ('pending','supported','not_supported','inconclusive') then raise exception 'invalid_experiment_phase';end if;
  if coalesce(n.details->>'phase','design') in ('ready','running','reading','closed') and exists(select 1 from unnest(array['hypothesis','population','allocation','cells','metric','window','source','decision_rule','configuration_version']) k where length(trim(coalesce(n.details->>k,'')))<3) then raise exception 'experiment_design_required';end if;
  if n.details->>'phase'='closed' and (length(trim(coalesce(n.details->>'reading','')))<5 or coalesce(n.details->>'verdict','pending')='pending') then raise exception 'experiment_reading_required';end if;
 end if;

 if n.work_type='spec' and n.status in ('em_execucao','concluida') and exists(select 1 from unnest(array['expected','scenarios','verification']) k where length(trim(coalesce(n.details->>k,'')))<5) then raise exception 'spec_design_required';end if;
 if n.work_type='experiment' and n.status='concluida' and coalesce(n.details->>'phase','design') not in ('closed','cancelled') then raise exception 'experiment_close_required';end if;
 if n.title is null or length(trim(n.title))<5 then raise exception 'task_title_required';end if;
 if exists(select 1 from unnest(n.acceptance_criteria) c where length(trim(c))=0) then raise exception 'empty_acceptance_criterion';end if;
 if n.status='bloqueada' and n.blocked_reason is null then raise exception 'task_block_reason_required';end if;
 foreach v in array n.completed_criteria loop
 if v<0 or v>=cardinality(n.acceptance_criteria) then raise exception 'invalid_acceptance_index';end if;
 end loop;
 -- Serialize dependency edits, so concurrent changes cannot create a cycle.
 perform pg_advisory_xact_lock(hashtext('growth-development-dependencies'));
 foreach item in array n.dependencies loop
 if item=n.task_key or not exists(select 1 from public.growth_development_tasks where task_key=item) then raise exception 'invalid_task_dependency';end if;
 if exists(with recursive chain(k) as (select item union select unnest(t.dependencies) from public.growth_development_tasks t join chain c on t.task_key=c.k)
 select 1 from chain where k=n.task_key) then raise exception 'task_dependency_cycle';end if;
 end loop;
 if n.status in ('em_execucao','concluida') and exists(select 1 from public.growth_development_tasks where task_key=any(n.dependencies) and status<>'concluida') then raise exception 'task_dependencies_pending';end if;
 if n.status='concluida' and (n.resolution is null or cardinality(n.acceptance_criteria)=0 or cardinality(n.completed_criteria)<>cardinality(n.acceptance_criteria)) then raise exception 'task_completion_evidence_required';end if;

 -- completion_date_v1: business date is distinct from last edit and audit timestamp.
 if n.status='concluida' then
   if nullif(n.details->>'completed_on','') is null then
     if nullif(previous.details->>'completed_on','') is not null then
       n.details:=n.details||jsonb_build_object('completed_on',previous.details->>'completed_on');
     elsif p_id is null or previous.status is distinct from 'concluida' then
       n.details:=n.details||jsonb_build_object('completed_on',(now() at time zone 'America/Sao_Paulo')::date::text);
     end if;
   end if;
   if nullif(n.details->>'completed_on','') is not null then
     if (n.details->>'completed_on')!~ '^\d{4}-\d{2}-\d{2}$' then raise exception 'task_completion_date_invalid';end if;
     if (n.details->>'completed_on')::date > (now() at time zone 'America/Sao_Paulo')::date
       or (n.details->>'completed_on')::date < date '1900-01-01' then raise exception 'task_completion_date_invalid';end if;
   end if;
 else
   n.details:=n.details-'completed_on';
 end if;
 if p_id is not null and to_jsonb(n)=to_jsonb(previous) then return to_jsonb(n);end if;
 n.revision:=n.revision+1;n.updated_at:=clock_timestamp();
 if p_id is null then insert into public.growth_development_tasks select (n).*;
 else update public.growth_development_tasks set title=n.title,description=n.description,area=n.area,priority=n.priority,status=n.status,
 owner_label=n.owner_label,due_date=n.due_date,dependencies=n.dependencies,acceptance_criteria=n.acceptance_criteria,completed_criteria=n.completed_criteria,
 blocked_reason=n.blocked_reason,resolution=n.resolution,source_note=n.source_note,workspace=n.workspace,work_type=n.work_type,initiative_id=n.initiative_id,related_workspaces=n.related_workspaces,details=n.details,links=n.links,next_action=n.next_action,revision=n.revision,updated_at=n.updated_at where id=p_id;
 end if;
 return to_jsonb(n);
end$function$;

/* ---------- iniciativas dos quatro boards ---------- */
do $$
declare acq public.growth_work_initiatives; pool uuid; owner uuid; prev jsonb;
begin
  -- Aquisição: reaproveita a iniciativa existente (id e histórico preservados).
  select * into acq from public.growth_work_initiatives where workspace = 'acquisition' and title = 'Evolução das jornadas de aquisição' for update;
  if found then
    prev := to_jsonb(acq);
    update public.growth_work_initiatives
       set title = 'Aquisição CRM', aliases = array(select distinct a from unnest(aliases || array['Evolução das jornadas de aquisição']) a),
           revision = revision + 1, updated_at = clock_timestamp()
     where id = acq.id returning * into acq;
    insert into public.growth_work_initiative_events(initiative_id, revision, actor_id, before_data, after_data)
    values (acq.id, acq.revision, null, prev, to_jsonb(acq));
  else
    select * into acq from public.growth_work_initiatives where workspace = 'acquisition' and title = 'Aquisição CRM';
  end if;

  -- Pool de Ofertas - Parceiros: criada uma vez, com o mesmo dono das demais.
  select id into pool from public.growth_work_initiatives where title = 'Pool de Ofertas - Parceiros';
  select created_by into owner from public.growth_work_initiatives order by created_at limit 1;
  if pool is null and owner is not null then
    insert into public.growth_work_initiatives(title, workspace, description, source_note, revision, created_by, aliases)
    values ('Pool de Ofertas - Parceiros', 'monetization',
            'Ofertas de parceiros comerciais da própria Afinz para quem já tem o cartão B2C, por e-mail, SMS e WhatsApp, para estimular o uso.',
            '10-Resultados/Iniciativas/Iniciativa-Pool-de-Ofertas-Parceiros.md', 1, owner, array['Pool Parceiros'])
    returning id into pool;
    insert into public.growth_work_initiative_events(initiative_id, revision, actor_id, before_data, after_data)
    select id, revision, null, null, to_jsonb(i) from public.growth_work_initiatives i where id = pool;
  end if;

  -- Projetos da Daily: Aquisição e Meio de funil sem iniciativa vão para Aquisição CRM; Pool Parceiros para a nova.
  with moved as (
    update public.daily_projects p
       set initiative_id = case when p.frente_key in ('aq', 'me') then acq.id else pool end,
           revision = p.revision + 1, updated_at = clock_timestamp()
     where p.initiative_id is null and p.merged_into is null and not p.archived
       and ((p.frente_key in ('aq', 'me') and acq.id is not null)
            or (pool is not null and p.name ilike 'Pool Parceiros%'))
    returning p.*
  )
  insert into public.daily_events(entity, entity_id, revision, actor_id, before_data, after_data)
  select 'project', m.id::text, m.revision, null, to_jsonb(m) || jsonb_build_object('initiative_id', null, 'revision', m.revision - 1), to_jsonb(m) from moved m;
end $$;

commit;
