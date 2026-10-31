begin;

create table public.growth_development_tasks (
 id uuid primary key default gen_random_uuid(),
 task_key text not null unique default ('DEV-'||substr(gen_random_uuid()::text,1,8)),
 title text not null check(length(trim(title)) between 5 and 180),
 description text not null default '', area text not null default 'Loop de Memória',
 priority text not null default 'P2' check(priority in ('P0','P1','P2','P3')),
 status text not null default 'backlog' check(status in ('backlog','planejando','pronta','em_execucao','bloqueada','concluida','cancelada')),
 owner_label text, due_date date, dependencies text[] not null default '{}',
 acceptance_criteria text[] not null default '{}', completed_criteria integer[] not null default '{}',
 blocked_reason text, resolution text, source_note text,
 revision integer not null default 1, created_by uuid not null references auth.users(id),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index growth_development_tasks_status_priority on public.growth_development_tasks(status,priority);
create table public.growth_development_task_events (
 id uuid primary key default gen_random_uuid(), task_id uuid not null references public.growth_development_tasks(id),
 revision integer not null, actor_id uuid references auth.users(id), kind text not null,
 before_data jsonb, after_data jsonb not null, created_at timestamptz not null default now(),
 unique(task_id,revision)
);
alter table public.growth_development_tasks enable row level security;
alter table public.growth_development_task_events enable row level security;
revoke all on public.growth_development_tasks,public.growth_development_task_events from public,anon,authenticated;
grant select on public.growth_development_tasks,public.growth_development_task_events to authenticated;
grant all on public.growth_development_tasks,public.growth_development_task_events to service_role;
create policy development_tasks_admin_read on public.growth_development_tasks for select to authenticated
 using((select auth.uid()) is not null and public.gaas_vault_is_admin());
create policy development_events_admin_read on public.growth_development_task_events for select to authenticated
 using((select auth.uid()) is not null and public.gaas_vault_is_admin());

alter table public.growth_loop_items drop constraint growth_loop_items_kind_check;
alter table public.growth_loop_items add constraint growth_loop_items_kind_check
 check(kind in ('source','investigation','outcome','contribution','development_task'));

-- One existing attention item per task; preferences/snoozes remain personal.
create function public.growth_development_task_event() returns trigger
 language plpgsql security definer set search_path='' as $$
declare st text;begin
 insert into public.growth_development_task_events(task_id,revision,actor_id,kind,before_data,after_data)
 values(new.id,new.revision,auth.uid(),case when TG_OP='INSERT' then 'created' else 'updated' end,
 case when TG_OP='INSERT' then null else to_jsonb(old) end,to_jsonb(new));
 st:=case new.status when 'bloqueada' then 'needs_data' when 'em_execucao' then 'running'
 when 'concluida' then 'resolved' when 'cancelada' then 'resolved' else 'needs_review' end;
 perform growth_loop_private.put('development:'||new.id,'development_task',new.id::text,'gaas_development',
 (new.created_at at time zone 'America/Sao_Paulo')::date,new.title,
 new.priority||' · '||new.area||'. '||case when new.status='bloqueada' then coalesce(new.blocked_reason,'Revisar dependência.')
 else 'Próxima etapa: '||replace(new.status,'_',' ')||'.' end,
 'Abra a tarefa, confira as dependências e registre o próximo avanço.',st,
 '?view=learning&section=investigations&dev_task='||new.id,
 case new.priority when 'P0' then 8 when 'P1' then 18 when 'P2' then 28 else 38 end,
 jsonb_build_object('task_key',new.task_key,'area',new.area,'priority',new.priority,'status',new.status,
 'owner',new.owner_label,'due_date',new.due_date,'dependencies',new.dependencies,'source_note',new.source_note,
 'blocked_reason',new.blocked_reason));
 return new;
end$$;
revoke all on function public.growth_development_task_event() from public,anon,authenticated;
create trigger growth_development_task_history after insert or update on public.growth_development_tasks
 for each row execute function public.growth_development_task_event();

create function public.growth_save_development_task(p_id uuid,p_revision integer,p_body jsonb)
 returns jsonb language plpgsql security definer set search_path='' as $$
declare n public.growth_development_tasks; previous public.growth_development_tasks; item text; v integer;begin
 if auth.uid() is null or not public.gaas_vault_is_admin() then raise exception 'development_access_denied';end if;
 if p_body is null or jsonb_typeof(p_body)<>'object' then raise exception 'invalid_task';end if;
 if p_id is not null then
 select * into strict n from public.growth_development_tasks where id=p_id for update;
 if p_revision is distinct from n.revision then raise exception 'task_revision_conflict';end if;
 previous:=n;
 else
 n.id:=gen_random_uuid(); n.task_key:=coalesce(nullif(trim(p_body->>'task_key'),''),'DEV-'||substr(n.id::text,1,8));
 n.status:='backlog';n.priority:='P2';n.area:='Loop de Memória';n.description:='';
 n.dependencies:='{}';n.acceptance_criteria:='{}';n.completed_criteria:='{}';
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
 if p_body?'completed_criteria' then select coalesce(array_agg(distinct x::integer),'{}') into n.completed_criteria from jsonb_array_elements_text(p_body->'completed_criteria') x;end if;
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
 blocked_reason=n.blocked_reason,resolution=n.resolution,source_note=n.source_note,revision=n.revision,updated_at=n.updated_at where id=p_id;
 end if;
 return to_jsonb(n);
end$$;
revoke all on function public.growth_save_development_task(uuid,integer,jsonb) from public,anon;
grant execute on function public.growth_save_development_task(uuid,integer,jsonb) to authenticated,service_role;

comment on table public.growth_development_tasks is 'Backlog administrativo de desenvolvimento GaaS, separado de investigações CRM e testes A/B.';
commit;
