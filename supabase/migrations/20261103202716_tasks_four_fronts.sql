begin;
create table public.growth_work_initiatives (
 id uuid primary key default gen_random_uuid(), title text not null check(length(trim(title)) between 5 and 180),
 workspace text not null check(workspace in ('sdd','acquisition','monetization','cross_sell')),
 description text not null default '', source_note text, revision integer not null default 1,
 created_by uuid not null references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.growth_work_initiative_events (
 id uuid primary key default gen_random_uuid(), initiative_id uuid not null references public.growth_work_initiatives(id),
 revision integer not null, actor_id uuid references auth.users(id), before_data jsonb, after_data jsonb not null, created_at timestamptz not null default now(), unique(initiative_id,revision)
);
alter table public.growth_work_initiatives enable row level security;
alter table public.growth_work_initiative_events enable row level security;
revoke all on public.growth_work_initiatives,public.growth_work_initiative_events from public,anon,authenticated;
grant select on public.growth_work_initiatives,public.growth_work_initiative_events to authenticated;
grant all on public.growth_work_initiatives,public.growth_work_initiative_events to service_role;
create policy initiatives_admin_read on public.growth_work_initiatives for select to authenticated using ((select auth.uid()) is not null and public.gaas_vault_is_admin());
create policy initiative_events_admin_read on public.growth_work_initiative_events for select to authenticated using ((select auth.uid()) is not null and public.gaas_vault_is_admin());
create function public.growth_save_work_initiative(p_id uuid,p_revision integer,p_body jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare n public.growth_work_initiatives; previous public.growth_work_initiatives;begin
 if auth.uid() is null or not public.gaas_vault_is_admin() then raise exception 'development_access_denied';end if;
 if p_id is not null then select * into strict n from public.growth_work_initiatives where id=p_id for update;
 if n.revision is distinct from p_revision then raise exception 'task_revision_conflict';end if;previous:=n;
 else n.id:=gen_random_uuid();n.created_by:=auth.uid();n.created_at:=now();n.revision:=0;end if;
 n.title:=coalesce(p_body->>'title',n.title);n.workspace:=coalesce(p_body->>'workspace',n.workspace);n.description:=coalesce(p_body->>'description',n.description,'');
 if p_body?'source_note' then n.source_note:=nullif(trim(p_body->>'source_note'),'');end if;
 if p_id is not null and to_jsonb(n)=to_jsonb(previous) then return to_jsonb(n);end if;
 n.revision:=n.revision+1;n.updated_at:=clock_timestamp();
 if p_id is null then insert into public.growth_work_initiatives select(n).*;
 else update public.growth_work_initiatives set title=n.title,workspace=n.workspace,description=n.description,source_note=n.source_note,revision=n.revision,updated_at=n.updated_at where id=n.id;end if;
 insert into public.growth_work_initiative_events(initiative_id,revision,actor_id,before_data,after_data) values(n.id,n.revision,auth.uid(),case when p_id is null then null else to_jsonb(previous) end,to_jsonb(n));
 return to_jsonb(n);end$$;
revoke all on function public.growth_save_work_initiative(uuid,integer,jsonb) from public,anon;
grant execute on function public.growth_save_work_initiative(uuid,integer,jsonb) to authenticated,service_role;
alter table public.growth_development_tasks
 add column workspace text not null default 'sdd' check(workspace in ('sdd','acquisition','monetization','cross_sell')),
 add column work_type text not null default 'task' check(work_type in ('task','investigation','experiment','spec')),
 add column initiative_id uuid references public.growth_work_initiatives(id),
 add column related_workspaces text[] not null default '{}',
 add column next_action text not null default '',
 add column details jsonb not null default '{}' check(jsonb_typeof(details)='object'),
 add column links jsonb not null default '[]' check(jsonb_typeof(links)='array');
create index growth_work_by_workspace on public.growth_development_tasks(workspace,status);
create index growth_work_by_initiative on public.growth_development_tasks(initiative_id);
create or replace function public.growth_save_development_task(p_id uuid,p_revision integer,p_body jsonb)
 returns jsonb language plpgsql security definer set search_path='' as $$
declare n public.growth_development_tasks; previous public.growth_development_tasks; item text; v integer;begin
 if auth.uid() is null or not public.gaas_vault_is_admin() then raise exception 'development_access_denied';end if;
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
 if p_id is not null and to_jsonb(n)=to_jsonb(previous) then return to_jsonb(n);end if;
 n.revision:=n.revision+1;n.updated_at:=clock_timestamp();
 if p_id is null then insert into public.growth_development_tasks select (n).*;
 else update public.growth_development_tasks set title=n.title,description=n.description,area=n.area,priority=n.priority,status=n.status,
 owner_label=n.owner_label,due_date=n.due_date,dependencies=n.dependencies,acceptance_criteria=n.acceptance_criteria,completed_criteria=n.completed_criteria,
 blocked_reason=n.blocked_reason,resolution=n.resolution,source_note=n.source_note,workspace=n.workspace,work_type=n.work_type,initiative_id=n.initiative_id,related_workspaces=n.related_workspaces,details=n.details,links=n.links,next_action=n.next_action,revision=n.revision,updated_at=n.updated_at where id=p_id;
 end if;
 return to_jsonb(n);
end$$;
revoke all on function public.growth_save_development_task(uuid,integer,jsonb) from public,anon;
grant execute on function public.growth_save_development_task(uuid,integer,jsonb) to authenticated,service_role;


create or replace function public.growth_development_task_event() returns trigger language plpgsql security definer set search_path='' as $$
declare st text; actionable boolean;begin
 insert into public.growth_development_task_events(task_id,revision,actor_id,kind,before_data,after_data)
 values(new.id,new.revision,auth.uid(),case when TG_OP='INSERT' then 'created' else 'updated' end,case when TG_OP='INSERT' then null else to_jsonb(old) end,to_jsonb(new));
 actionable:=new.status in ('bloqueada','pronta','concluida','cancelada') or coalesce(new.details->>'attention','none') in ('decision','proposal','reading');
 -- Capture and routine/checklist changes remain in history without creating notifications.
 if TG_OP='INSERT' and not actionable then return new;end if;
 if TG_OP='UPDATE' and not actionable and not exists(select 1 from public.growth_loop_items where episode_key='development:'||new.id) then return new;end if;
 st:=case when new.status in ('concluida','cancelada') then 'resolved' when new.status='bloqueada' then 'needs_data'
 when new.details->>'attention'='reading' then 'analysis_ready' when new.status='em_execucao' then 'running' else 'needs_review' end;
 perform growth_loop_private.put('development:'||new.id,'development_task',new.id::text,
 case new.workspace when 'sdd' then 'gaas_development' when 'acquisition' then 'crm_acquisition' when 'monetization' then 'crm_monetization' else 'crm_cross_sell' end,
 (new.created_at at time zone 'America/Sao_Paulo')::date,new.title,
 new.priority||' · '||new.area||'. '||coalesce(nullif(new.blocked_reason,''),nullif(new.next_action,''),'Confira o próximo avanço.'),
 coalesce(nullif(new.next_action,''),'Abra o trabalho e confira evidências e dependências.'),st,
 '?view=learning&section=investigations&dev_task='||new.id,
 case new.priority when 'P0' then 8 when 'P1' then 18 when 'P2' then 28 else 38 end,
 jsonb_build_object('task_key',new.task_key,'workspace',new.workspace,'work_type',new.work_type,'area',new.area,'priority',new.priority,'status',new.status,'owner',new.owner_label,'due_date',new.due_date,'dependencies',new.dependencies,'source_note',new.source_note,'blocked_reason',new.blocked_reason,'attention',new.details->>'attention'));
 return new;
end$$;
comment on table public.growth_development_tasks is 'Trabalhos administrativos versionados: SDD, aquisição, rentabilização e cross-sell; preserva identidades e histórico anteriores.';
commit;
