begin;
alter table public.growth_work_initiatives
 add column phase text not null default 'context' check(phase in ('context','preparation','execution','reading','learning')),
 add column guiding_question text not null default '',
 add column context_links jsonb not null default '[]' check(jsonb_typeof(context_links)='array');
create or replace function public.growth_save_work_initiative(p_id uuid,p_revision integer,p_body jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare n public.growth_work_initiatives; previous public.growth_work_initiatives;begin
 if auth.uid() is null or not public.gaas_vault_is_admin() then raise exception 'development_access_denied';end if;
 if p_id is not null then select * into strict n from public.growth_work_initiatives where id=p_id for update;
 if n.revision is distinct from p_revision then raise exception 'task_revision_conflict';end if;previous:=n;
 else n.id:=gen_random_uuid();n.created_by:=auth.uid();n.created_at:=now();n.revision:=0;n.phase:='context';n.guiding_question:='';n.context_links:='[]';end if;
 n.title:=coalesce(p_body->>'title',n.title);n.workspace:=coalesce(p_body->>'workspace',n.workspace);n.description:=coalesce(p_body->>'description',n.description,'');
 if p_body?'source_note' then n.source_note:=nullif(trim(p_body->>'source_note'),'');end if;
 n.phase:=coalesce(p_body->>'phase',n.phase);n.guiding_question:=coalesce(p_body->>'guiding_question',n.guiding_question);
 if p_body?'context_links' then n.context_links:=p_body->'context_links';end if;
 if jsonb_typeof(n.context_links)<>'array' or exists(select 1 from jsonb_array_elements(n.context_links) l where jsonb_typeof(l)<>'object' or coalesce(l->>'label','')='' or coalesce(l->>'url','')!~ '^(https://|\?view=learning&|[0-9]{2}-[^:]+/)' or coalesce(l->>'url','')~ '[[:cntrl:]]') then raise exception 'invalid_work_link';end if;
 if p_id is not null and to_jsonb(n)=to_jsonb(previous) then return to_jsonb(n);end if;
 n.revision:=n.revision+1;n.updated_at:=clock_timestamp();
 if p_id is null then insert into public.growth_work_initiatives select(n).*;
 else update public.growth_work_initiatives set title=n.title,workspace=n.workspace,description=n.description,source_note=n.source_note,phase=n.phase,guiding_question=n.guiding_question,context_links=n.context_links,revision=n.revision,updated_at=n.updated_at where id=n.id;end if;
 insert into public.growth_work_initiative_events(initiative_id,revision,actor_id,before_data,after_data) values(n.id,n.revision,auth.uid(),case when p_id is null then null else to_jsonb(previous) end,to_jsonb(n));
 return to_jsonb(n);end$$;
revoke all on function public.growth_save_work_initiative(uuid,integer,jsonb) from public,anon;
grant execute on function public.growth_save_work_initiative(uuid,integer,jsonb) to authenticated,service_role;

create table public.growth_work_initiative_decisions (
 id uuid primary key default gen_random_uuid(), initiative_id uuid not null references public.growth_work_initiatives(id),
 title text not null check(length(trim(title)) between 5 and 180), body text not null check(length(trim(body))>=10),
 source_note text, supersedes uuid unique references public.growth_work_initiative_decisions(id),
 actor_id uuid not null references auth.users(id), created_at timestamptz not null default now()
);
create index initiative_decisions_by_initiative on public.growth_work_initiative_decisions(initiative_id,created_at desc);
alter table public.growth_work_initiative_decisions enable row level security;
revoke all on public.growth_work_initiative_decisions from public,anon,authenticated;
grant select on public.growth_work_initiative_decisions to authenticated;
grant all on public.growth_work_initiative_decisions to service_role;
create policy initiative_decisions_admin_read on public.growth_work_initiative_decisions for select to authenticated using((select auth.uid()) is not null and public.gaas_vault_is_admin());
create function public.growth_record_initiative_decision(p_initiative uuid,p_revision integer,p_title text,p_body text,p_source_note text default null,p_supersedes uuid default null) returns jsonb language plpgsql security definer set search_path='' as $$
declare n public.growth_work_initiatives; previous public.growth_work_initiatives; d public.growth_work_initiative_decisions;begin
 if auth.uid() is null or not public.gaas_vault_is_admin() then raise exception 'development_access_denied';end if;
 select * into strict n from public.growth_work_initiatives where id=p_initiative for update;
 if n.revision is distinct from p_revision then raise exception 'task_revision_conflict';end if;
 if p_supersedes is not null and not exists(select 1 from public.growth_work_initiative_decisions where id=p_supersedes and initiative_id=p_initiative) then raise exception 'invalid_decision_origin';end if;
 previous:=n;
 insert into public.growth_work_initiative_decisions(initiative_id,title,body,source_note,supersedes,actor_id)
 values(n.id,trim(p_title),trim(p_body),nullif(trim(p_source_note),''),p_supersedes,auth.uid()) returning * into d;
 update public.growth_work_initiatives set revision=revision+1,updated_at=clock_timestamp() where id=n.id returning * into n;
 insert into public.growth_work_initiative_events(initiative_id,revision,actor_id,before_data,after_data) values(n.id,n.revision,auth.uid(),to_jsonb(previous),to_jsonb(n));
 return jsonb_build_object('initiative',to_jsonb(n),'decision',to_jsonb(d));
end$$;
revoke all on function public.growth_record_initiative_decision(uuid,integer,text,text,text,uuid) from public,anon;
grant execute on function public.growth_record_initiative_decision(uuid,integer,text,text,text,uuid) to authenticated,service_role;
commit;
