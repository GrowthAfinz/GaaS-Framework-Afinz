-- Correções e melhorias: troca Humano -> IA (spec: vault 08-Engenharia/Spec-Correcoes-e-Melhorias-GaaS.md).
-- Comentários são do time inteiro: qualquer usuário autenticado cria, edita e exclui qualquer item.
-- Exclusão não deixa registro (itens, votos, anexos e histórico somem juntos).
-- Decisão, reserva, conclusão e revisão ficam com o administrador (a skill correcoes-e-melhorias-gaas age em nome dele).
begin;

create table public.gaas_feedback_items (
 id uuid primary key default gen_random_uuid(),
 revision integer not null default 1,
 kind text not null default 'knowledge' check(kind in ('knowledge','app_adjustment','question')),
 item_type text not null default 'outro' check(item_type ~ '^[a-z_]{2,40}$'),
 body text not null check(length(trim(body)) between 3 and 8000),
 front text check(front is null or length(front) between 1 and 60),
 subject text check(subject is null or length(subject) between 1 and 120),
 surface text not null default 'outra' check(surface ~ '^[a-z0-9_-]{2,60}$'),
 page_label text not null check(length(trim(page_label)) between 1 and 80),
 location_label text not null default '' check(length(location_label)<=400),
 route text not null default '' check(length(route)<=2000),
 target_type text check(target_type is null or target_type in ('note','initiative','work_item','feed_item','report_live','bet','outcome','memory','element','page')),
 target_id text check(target_id is null or length(target_id) between 1 and 400),
 anchor jsonb not null default '{}' check(jsonb_typeof(anchor)='object' and length(anchor::text)<=8000),
 anchor_state text not null default 'none' check(anchor_state in ('none','anchored','orphan')),
 context jsonb not null default '{}' check(jsonb_typeof(context)='object' and length(context::text)<=8000),
 status text not null default 'open' check(status in ('open','in_conversation','deferred','declined','with_ai','proposal_ready','ai_disagrees','needs_data','approved','applied')),
 priority integer check(priority is null or priority between 1 and 999),
 decision_note text check(decision_note is null or length(decision_note)<=4000),
 decided_at timestamptz,
 decided_via text check(decided_via is null or decided_via in ('claude','codex','gaas')),
 lease_token uuid,
 lease_expires_at timestamptz,
 executor text check(executor is null or length(executor)<=80),
 proposal jsonb check(proposal is null or (jsonb_typeof(proposal)='object' and length(proposal::text)<=200000)),
 review_note text check(review_note is null or length(review_note)<=4000),
 contribution_id uuid references public.gaas_knowledge_contributions(id) on delete set null,
 work_item_id uuid references public.growth_development_tasks(id) on delete set null,
 result_ref text check(result_ref is null or (length(result_ref)<=500 and result_ref ~ '^https://[^[:space:]]+$')),
 duplicate_of uuid references public.gaas_feedback_items(id) on delete set null,
 created_by uuid not null references auth.users(id),
 created_at timestamptz not null default now(),
 updated_by uuid references auth.users(id),
 updated_at timestamptz not null default now()
);
create index gaas_feedback_items_status on public.gaas_feedback_items(status,created_at desc);
create index gaas_feedback_items_target on public.gaas_feedback_items(target_type,target_id);

create table public.gaas_feedback_votes (
 item_id uuid not null references public.gaas_feedback_items(id) on delete cascade,
 user_id uuid not null references auth.users(id),
 created_at timestamptz not null default now(),
 primary key(item_id,user_id)
);

create table public.gaas_feedback_attachments (
 id uuid primary key default gen_random_uuid(),
 item_id uuid not null references public.gaas_feedback_items(id) on delete cascade,
 storage_path text not null unique check(storage_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(png|jpg|jpeg|webp|pdf|csv|xlsx)$'),
 file_name text not null check(length(trim(file_name)) between 1 and 200),
 mime_type text not null check(length(mime_type) between 3 and 120),
 bytes integer not null check(bytes between 1 and 10485760),
 created_by uuid not null references auth.users(id),
 created_at timestamptz not null default now()
);
create index gaas_feedback_attachments_item on public.gaas_feedback_attachments(item_id);

create table public.gaas_feedback_events (
 id uuid primary key default gen_random_uuid(),
 item_id uuid not null references public.gaas_feedback_items(id) on delete cascade,
 event text not null check(event ~ '^[a-z_]{2,40}$'),
 from_status text,
 to_status text,
 note text check(note is null or length(note)<=4000),
 actor_id uuid references auth.users(id),
 created_at timestamptz not null default now()
);
create index gaas_feedback_events_item on public.gaas_feedback_events(item_id,created_at);

create table public.gaas_feedback_rules (
 id uuid primary key default gen_random_uuid(),
 rule_text text not null check(length(trim(rule_text)) between 5 and 1000),
 applies_to text not null default '' check(length(applies_to)<=300),
 source_items uuid[] not null default '{}',
 status text not null default 'proposed' check(status in ('proposed','active','retired')),
 proposed_by uuid references auth.users(id),
 approved_by uuid references auth.users(id),
 approved_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

create table public.gaas_vault_note_reviews (
 id uuid primary key default gen_random_uuid(),
 relative_path text not null check(length(relative_path) between 4 and 500),
 content_hash text not null check(length(content_hash) between 8 and 128),
 verdict text not null check(verdict in ('ok','needs_fix','archive','skip')),
 reviewer_id uuid not null references auth.users(id),
 reviewed_at timestamptz not null default now()
);
create index gaas_vault_note_reviews_path on public.gaas_vault_note_reviews(relative_path,reviewed_at desc);

create table public.growth_work_workspaces (
 key text primary key check(key in ('sdd','acquisition','monetization','cross_sell')),
 label text not null check(length(trim(label)) between 2 and 60),
 aliases text[] not null default '{}',
 sort_order integer not null default 0,
 updated_by uuid references auth.users(id),
 updated_at timestamptz not null default now()
);
insert into public.growth_work_workspaces(key,label,sort_order) values
 ('sdd','Spec Driven Development',1),('acquisition','Aquisição CRM',2),('monetization','Rentabilização CRM',3),('cross_sell','Cross-sell CRM',4);

alter table public.growth_work_initiatives
 add column phase_labels jsonb not null default '{}' check(jsonb_typeof(phase_labels)='object'),
 add column aliases text[] not null default '{}';

-- Leitura para qualquer usuário autenticado; escrita só pelas funções abaixo.
do $grants$
declare t text;
begin
 foreach t in array array['gaas_feedback_items','gaas_feedback_votes','gaas_feedback_attachments','gaas_feedback_events','gaas_feedback_rules','gaas_vault_note_reviews','growth_work_workspaces'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke all on public.%I from public,anon,authenticated',t);
  execute format('grant select on public.%I to authenticated',t);
  execute format('grant all on public.%I to service_role',t);
  execute format('create policy %I on public.%I for select to authenticated using ((select auth.uid()) is not null)',t||'_read',t);
 end loop;
end$grants$;

create function public.gaas_feedback_log(p_item uuid,p_event text,p_from text,p_to text,p_note text default null) returns void
language sql security definer set search_path='' as $$
 insert into public.gaas_feedback_events(item_id,event,from_status,to_status,note,actor_id) values(p_item,p_event,p_from,p_to,p_note,auth.uid());
$$;
revoke all on function public.gaas_feedback_log(uuid,text,text,text,text) from public,anon,authenticated;

create function public.gaas_feedback_require_user() returns uuid language plpgsql stable security definer set search_path='' as $$
begin if auth.uid() is null then raise exception 'feedback_auth_required' using errcode='42501';end if;return auth.uid();end$$;
create function public.gaas_feedback_require_admin() returns uuid language plpgsql stable security definer set search_path='' as $$
begin if auth.uid() is null or not public.gaas_vault_is_admin() then raise exception 'feedback_admin_required' using errcode='42501';end if;return auth.uid();end$$;
revoke all on function public.gaas_feedback_require_user() from public,anon;
revoke all on function public.gaas_feedback_require_admin() from public,anon;

create function public.gaas_feedback_create(p_body jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=public.gaas_feedback_require_user(); r public.gaas_feedback_items; a jsonb:=coalesce(p_body->'anchor','{}'::jsonb);
begin
 if jsonb_typeof(p_body)<>'object' then raise exception 'feedback_invalid_body';end if;
 insert into public.gaas_feedback_items(kind,item_type,body,front,subject,surface,page_label,location_label,route,target_type,target_id,anchor,anchor_state,context,created_by,updated_by)
 values(coalesce(p_body->>'kind','knowledge'),coalesce(nullif(p_body->>'item_type',''),'outro'),trim(p_body->>'body'),nullif(trim(p_body->>'front'),''),nullif(trim(p_body->>'subject'),''),
  coalesce(nullif(p_body->>'surface',''),'outra'),coalesce(nullif(trim(p_body->>'page_label'),''),'GaaS'),coalesce(p_body->>'location_label',''),coalesce(p_body->>'route',''),
  nullif(p_body->>'target_type',''),nullif(p_body->>'target_id',''),a,case when coalesce(a->>'exact','')<>'' then 'anchored' else 'none' end,coalesce(p_body->'context','{}'::jsonb),uid,uid)
 returning * into r;
 perform public.gaas_feedback_log(r.id,'created',null,r.status);
 return to_jsonb(r);
end$$;

create function public.gaas_feedback_edit(p_id uuid,p_revision integer,p_patch jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=public.gaas_feedback_require_user(); r public.gaas_feedback_items; prev text;
begin
 select * into r from public.gaas_feedback_items where id=p_id for update;
 if not found then raise exception 'feedback_item_missing';end if;
 if r.revision is distinct from p_revision then raise exception 'feedback_revision_conflict';end if;
 prev:=r.status;
 if p_patch?'body' then r.body:=trim(p_patch->>'body');end if;
 if p_patch?'item_type' then r.item_type:=p_patch->>'item_type';end if;
 if p_patch?'kind' then r.kind:=p_patch->>'kind';end if;
 if p_patch?'front' then r.front:=nullif(trim(p_patch->>'front'),'');end if;
 if p_patch?'subject' then r.subject:=nullif(trim(p_patch->>'subject'),'');end if;
 -- O pedido mudou: o que já estava combinado ou em execução volta para a conversa.
 if r.status in ('with_ai','proposal_ready','ai_disagrees','needs_data','approved') or (r.status='in_conversation' and r.priority is not null) then
  r.status:='in_conversation';r.priority:=null;r.lease_token:=null;r.lease_expires_at:=null;
 end if;
 update public.gaas_feedback_items set body=r.body,item_type=r.item_type,kind=r.kind,front=r.front,subject=r.subject,status=r.status,priority=r.priority,
  lease_token=r.lease_token,lease_expires_at=r.lease_expires_at,revision=r.revision+1,updated_by=uid,updated_at=now() where id=p_id returning * into r;
 perform public.gaas_feedback_log(r.id,'edited',prev,r.status);
 return to_jsonb(r);
end$$;

-- Exclusão completa, sem registro. Devolve os caminhos dos anexos para o cliente remover do Storage.
create function public.gaas_feedback_delete(p_id uuid) returns text[] language plpgsql security definer set search_path='' as $$
declare paths text[];
begin
 perform public.gaas_feedback_require_user();
 select coalesce(array_agg(storage_path),'{}') into paths from public.gaas_feedback_attachments where item_id=p_id;
 delete from public.gaas_feedback_items where id=p_id;
 if not found then raise exception 'feedback_item_missing';end if;
 return paths;
end$$;

create function public.gaas_feedback_toggle_vote(p_id uuid) returns integer language plpgsql security definer set search_path='' as $$
declare uid uuid:=public.gaas_feedback_require_user(); n integer;
begin
 if not exists(select 1 from public.gaas_feedback_items where id=p_id) then raise exception 'feedback_item_missing';end if;
 delete from public.gaas_feedback_votes where item_id=p_id and user_id=uid;
 if not found then insert into public.gaas_feedback_votes(item_id,user_id) values(p_id,uid);end if;
 select count(*) into n from public.gaas_feedback_votes where item_id=p_id;
 return n;
end$$;

create function public.gaas_feedback_add_attachment(p_item uuid,p_path text,p_name text,p_mime text,p_bytes integer) returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=public.gaas_feedback_require_user(); a public.gaas_feedback_attachments;
begin
 if not exists(select 1 from public.gaas_feedback_items where id=p_item) then raise exception 'feedback_item_missing';end if;
 if split_part(p_path,'/',1)<>p_item::text then raise exception 'feedback_attachment_path';end if;
 if (select count(*) from public.gaas_feedback_attachments where item_id=p_item)>=10 then raise exception 'feedback_attachment_limit';end if;
 insert into public.gaas_feedback_attachments(item_id,storage_path,file_name,mime_type,bytes,created_by) values(p_item,p_path,trim(p_name),p_mime,p_bytes,uid) returning * into a;
 update public.gaas_feedback_items set updated_by=uid,updated_at=now() where id=p_item;
 return to_jsonb(a);
end$$;

create function public.gaas_feedback_remove_attachment(p_id uuid) returns text language plpgsql security definer set search_path='' as $$
declare path text;
begin
 perform public.gaas_feedback_require_user();
 delete from public.gaas_feedback_attachments where id=p_id returning storage_path into path;
 if path is null then raise exception 'feedback_attachment_missing';end if;
 return path;
end$$;

-- Decisão do Pablo na conversa com a IA (ou na própria aba).
create function public.gaas_feedback_record_decision(p_id uuid,p_status text,p_priority integer,p_note text,p_via text default 'gaas') returns jsonb language plpgsql security definer set search_path='' as $$
declare r public.gaas_feedback_items; prev text;
begin
 perform public.gaas_feedback_require_admin();
 if p_status not in ('open','in_conversation','deferred','declined') then raise exception 'feedback_invalid_status';end if;
 if p_status='declined' and coalesce(trim(p_note),'')='' then raise exception 'feedback_reason_required';end if;
 select * into r from public.gaas_feedback_items where id=p_id for update;
 if not found then raise exception 'feedback_item_missing';end if;
 if r.status in ('with_ai','approved','applied') then raise exception 'feedback_invalid_transition';end if;
 prev:=r.status;
 update public.gaas_feedback_items set status=p_status,priority=case when p_status='in_conversation' then p_priority else null end,decision_note=nullif(trim(p_note),''),
  decided_at=now(),decided_via=p_via,updated_by=auth.uid(),updated_at=now(),revision=revision+1 where id=p_id returning * into r;
 perform public.gaas_feedback_log(r.id,'decided',prev,r.status,r.decision_note);
 return to_jsonb(r);
end$$;

create function public.gaas_feedback_claim(p_id uuid,p_executor text) returns jsonb language plpgsql security definer set search_path='' as $$
declare r public.gaas_feedback_items;
begin
 perform public.gaas_feedback_require_admin();
 select * into r from public.gaas_feedback_items where id=p_id for update;
 if not found then raise exception 'feedback_item_missing';end if;
 if not (r.status='in_conversation' and r.priority is not null or r.status='with_ai' and r.lease_expires_at<now()) then raise exception 'feedback_not_claimable';end if;
 update public.gaas_feedback_items set status='with_ai',lease_token=gen_random_uuid(),lease_expires_at=now()+interval '30 minutes',executor=left(p_executor,80),updated_at=now() where id=p_id returning * into r;
 perform public.gaas_feedback_log(r.id,'claimed','in_conversation','with_ai',r.executor);
 return to_jsonb(r);
end$$;

create function public.gaas_feedback_renew(p_id uuid,p_token uuid) returns timestamptz language plpgsql security definer set search_path='' as $$
declare until timestamptz;
begin
 perform public.gaas_feedback_require_admin();
 update public.gaas_feedback_items set lease_expires_at=now()+interval '30 minutes' where id=p_id and status='with_ai' and lease_token=p_token and lease_expires_at>now() returning lease_expires_at into until;
 if until is null then raise exception 'feedback_lease_invalid';end if;
 return until;
end$$;

create function public.gaas_feedback_complete(p_id uuid,p_token uuid,p_status text,p_proposal jsonb,p_result_ref text default null,p_contribution uuid default null,p_work_item uuid default null) returns jsonb language plpgsql security definer set search_path='' as $$
declare r public.gaas_feedback_items;
begin
 perform public.gaas_feedback_require_admin();
 if p_status not in ('proposal_ready','ai_disagrees','needs_data') then raise exception 'feedback_invalid_status';end if;
 select * into r from public.gaas_feedback_items where id=p_id for update;
 if not found then raise exception 'feedback_item_missing';end if;
 if r.status<>'with_ai' or r.lease_token is distinct from p_token or r.lease_expires_at<now() then raise exception 'feedback_lease_invalid';end if;
 if p_proposal is null or jsonb_typeof(p_proposal)<>'object' or coalesce(p_proposal->>'summary','')='' then raise exception 'feedback_proposal_summary_required';end if;
 update public.gaas_feedback_items set status=p_status,proposal=p_proposal,result_ref=coalesce(p_result_ref,result_ref),contribution_id=coalesce(p_contribution,contribution_id),
  work_item_id=coalesce(p_work_item,work_item_id),lease_token=null,lease_expires_at=null,updated_at=now(),revision=revision+1 where id=p_id returning * into r;
 perform public.gaas_feedback_log(r.id,'completed','with_ai',r.status,p_proposal->>'summary');
 return to_jsonb(r);
end$$;

create function public.gaas_feedback_fail(p_id uuid,p_token uuid,p_reason text) returns jsonb language plpgsql security definer set search_path='' as $$
declare r public.gaas_feedback_items;
begin
 perform public.gaas_feedback_require_admin();
 update public.gaas_feedback_items set status='in_conversation',lease_token=null,lease_expires_at=null,updated_at=now(),revision=revision+1
  where id=p_id and status='with_ai' and lease_token=p_token returning * into r;
 if r.id is null then raise exception 'feedback_lease_invalid';end if;
 perform public.gaas_feedback_log(r.id,'failed','with_ai','in_conversation',left(p_reason,4000));
 return to_jsonb(r);
end$$;

create function public.gaas_feedback_review(p_id uuid,p_decision text,p_note text default null) returns jsonb language plpgsql security definer set search_path='' as $$
declare r public.gaas_feedback_items; prev text; next text;
begin
 perform public.gaas_feedback_require_admin();
 select * into r from public.gaas_feedback_items where id=p_id for update;
 if not found then raise exception 'feedback_item_missing';end if;
 if r.status not in ('proposal_ready','ai_disagrees','needs_data') then raise exception 'feedback_invalid_transition';end if;
 next:=case p_decision when 'approve' then 'approved' when 'request_changes' then 'in_conversation' when 'reject' then 'declined' end;
 if next is null then raise exception 'feedback_invalid_status';end if;
 if p_decision in ('request_changes','reject') and coalesce(trim(p_note),'')='' then raise exception 'feedback_reason_required';end if;
 prev:=r.status;
 update public.gaas_feedback_items set status=next,review_note=nullif(trim(p_note),''),decision_note=case when next='declined' then nullif(trim(p_note),'') else decision_note end,
  updated_by=auth.uid(),updated_at=now(),revision=revision+1 where id=p_id returning * into r;
 perform public.gaas_feedback_log(r.id,'reviewed',prev,next,p_note);
 return to_jsonb(r);
end$$;

create function public.gaas_feedback_mark_applied(p_id uuid,p_result_ref text default null) returns jsonb language plpgsql security definer set search_path='' as $$
declare r public.gaas_feedback_items;
begin
 perform public.gaas_feedback_require_admin();
 update public.gaas_feedback_items set status='applied',result_ref=coalesce(p_result_ref,result_ref),updated_by=auth.uid(),updated_at=now(),revision=revision+1
  where id=p_id and status='approved' returning * into r;
 if r.id is null then raise exception 'feedback_invalid_transition';end if;
 perform public.gaas_feedback_log(r.id,'applied','approved','applied',p_result_ref);
 return to_jsonb(r);
end$$;

create function public.gaas_feedback_set_anchor_state(p_id uuid,p_state text) returns void language plpgsql security definer set search_path='' as $$
begin
 perform public.gaas_feedback_require_admin();
 if p_state not in ('anchored','orphan') then raise exception 'feedback_invalid_status';end if;
 update public.gaas_feedback_items set anchor_state=p_state,updated_at=now() where id=p_id and anchor_state<>'none';
end$$;

create function public.gaas_feedback_propose_rule(p_text text,p_applies_to text,p_items uuid[]) returns jsonb language plpgsql security definer set search_path='' as $$
declare x public.gaas_feedback_rules;
begin
 perform public.gaas_feedback_require_admin();
 insert into public.gaas_feedback_rules(rule_text,applies_to,source_items,proposed_by) values(trim(p_text),coalesce(trim(p_applies_to),''),coalesce(p_items,'{}'),auth.uid()) returning * into x;
 return to_jsonb(x);
end$$;

create function public.gaas_feedback_set_rule_status(p_id uuid,p_status text) returns jsonb language plpgsql security definer set search_path='' as $$
declare x public.gaas_feedback_rules;
begin
 perform public.gaas_feedback_require_admin();
 if p_status not in ('proposed','active','retired') then raise exception 'feedback_invalid_status';end if;
 update public.gaas_feedback_rules set status=p_status,approved_by=case when p_status='active' then auth.uid() else approved_by end,
  approved_at=case when p_status='active' then now() else approved_at end,updated_at=now() where id=p_id returning * into x;
 if x.id is null then raise exception 'feedback_rule_missing';end if;
 return to_jsonb(x);
end$$;

-- Revisão humana de nota: o hash vem do banco, nunca do cliente.
create function public.gaas_vault_record_note_review(p_path text,p_verdict text) returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=public.gaas_feedback_require_user(); h text; x public.gaas_vault_note_reviews;
begin
 select content_hash into h from public.gaas_vault_notes where relative_path=p_path and deleted_at is null order by indexed_at desc nulls last limit 1;
 if h is null then raise exception 'vault_note_missing';end if;
 insert into public.gaas_vault_note_reviews(relative_path,content_hash,verdict,reviewer_id) values(p_path,h,p_verdict,uid) returning * into x;
 return to_jsonb(x);
end$$;

create function public.growth_rename_workspace(p_key text,p_label text) returns jsonb language plpgsql security definer set search_path='' as $$
declare w public.growth_work_workspaces;
begin
 if auth.uid() is null or not public.gaas_vault_is_admin() then raise exception 'development_access_denied';end if;
 select * into w from public.growth_work_workspaces where key=p_key for update;
 if not found then raise exception 'invalid_workspace';end if;
 if trim(p_label)=w.label then return to_jsonb(w);end if;
 update public.growth_work_workspaces set aliases=case when w.label=any(w.aliases) then w.aliases else array_append(w.aliases,w.label) end,
  label=trim(p_label),updated_by=auth.uid(),updated_at=now() where key=p_key returning * into w;
 return to_jsonb(w);
end$$;

-- Iniciativa: acrescenta rótulos de etapa e apelidos (o título anterior vira apelido ao renomear).
create or replace function public.growth_save_work_initiative(p_id uuid,p_revision integer,p_body jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare n public.growth_work_initiatives; previous public.growth_work_initiatives;begin
 if auth.uid() is null or not public.gaas_vault_is_admin() then raise exception 'development_access_denied';end if;
 if p_id is not null then select * into strict n from public.growth_work_initiatives where id=p_id for update;
 if n.revision is distinct from p_revision then raise exception 'task_revision_conflict';end if;previous:=n;
 else n.id:=gen_random_uuid();n.created_by:=auth.uid();n.created_at:=now();n.revision:=0;n.phase:='context';n.guiding_question:='';n.context_links:='[]';n.phase_labels:='{}';n.aliases:='{}';end if;
 n.title:=coalesce(p_body->>'title',n.title);n.workspace:=coalesce(p_body->>'workspace',n.workspace);n.description:=coalesce(p_body->>'description',n.description,'');
 if p_body?'source_note' then n.source_note:=nullif(trim(p_body->>'source_note'),'');end if;
 n.phase:=coalesce(p_body->>'phase',n.phase);n.guiding_question:=coalesce(p_body->>'guiding_question',n.guiding_question);
 if p_body?'context_links' then n.context_links:=p_body->'context_links';end if;
 if p_body?'phase_labels' then n.phase_labels:=p_body->'phase_labels';end if;
 if jsonb_typeof(n.phase_labels)<>'object' or exists(select 1 from jsonb_each(n.phase_labels) e where e.key not in ('context','preparation','execution','reading','learning') or jsonb_typeof(e.value)<>'string' or length(trim(e.value#>>'{}')) not between 2 and 40) then raise exception 'invalid_phase_labels';end if;
 if p_id is not null and previous.title is distinct from n.title and not (previous.title=any(n.aliases)) then n.aliases:=array_append(n.aliases,previous.title);end if;
 if jsonb_typeof(n.context_links)<>'array' or exists(select 1 from jsonb_array_elements(n.context_links) l where jsonb_typeof(l)<>'object' or coalesce(l->>'label','')='' or coalesce(l->>'url','')!~ '^(https://|\?view=learning&|[0-9]{2}-[^:]+/)' or coalesce(l->>'url','')~ '[[:cntrl:]]') then raise exception 'invalid_work_link';end if;
 if p_id is not null and to_jsonb(n)=to_jsonb(previous) then return to_jsonb(n);end if;
 n.revision:=n.revision+1;n.updated_at:=clock_timestamp();
 if p_id is null then insert into public.growth_work_initiatives select(n).*;
 else update public.growth_work_initiatives set title=n.title,workspace=n.workspace,description=n.description,source_note=n.source_note,phase=n.phase,guiding_question=n.guiding_question,context_links=n.context_links,phase_labels=n.phase_labels,aliases=n.aliases,revision=n.revision,updated_at=n.updated_at where id=n.id;end if;
 insert into public.growth_work_initiative_events(initiative_id,revision,actor_id,before_data,after_data) values(n.id,n.revision,auth.uid(),case when p_id is null then null else to_jsonb(previous) end,to_jsonb(n));
 return to_jsonb(n);end$$;

do $fns$
declare f text;
begin
 foreach f in array array[
  'gaas_feedback_create(jsonb)','gaas_feedback_edit(uuid,integer,jsonb)','gaas_feedback_delete(uuid)','gaas_feedback_toggle_vote(uuid)',
  'gaas_feedback_add_attachment(uuid,text,text,text,integer)','gaas_feedback_remove_attachment(uuid)',
  'gaas_feedback_record_decision(uuid,text,integer,text,text)','gaas_feedback_claim(uuid,text)','gaas_feedback_renew(uuid,uuid)',
  'gaas_feedback_complete(uuid,uuid,text,jsonb,text,uuid,uuid)','gaas_feedback_fail(uuid,uuid,text)','gaas_feedback_review(uuid,text,text)',
  'gaas_feedback_mark_applied(uuid,text)','gaas_feedback_set_anchor_state(uuid,text)','gaas_feedback_propose_rule(text,text,uuid[])',
  'gaas_feedback_set_rule_status(uuid,text)','gaas_vault_record_note_review(text,text)','growth_rename_workspace(text,text)',
  'growth_save_work_initiative(uuid,integer,jsonb)'] loop
  execute format('revoke all on function public.%s from public,anon',f);
  execute format('grant execute on function public.%s to authenticated,service_role',f);
 end loop;
end$fns$;

-- Anexos: bucket privado. Qualquer usuário autenticado lê, envia e remove (decisão: time inteiro gerencia).
do $bucket$
begin
 insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 values('gaas-feedback','gaas-feedback',false,10485760,array['image/png','image/jpeg','image/webp','application/pdf','text/csv','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'])
 on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
 execute $p$create policy gaas_feedback_objects_read on storage.objects for select to authenticated using (bucket_id='gaas-feedback' and (select auth.uid()) is not null)$p$;
 execute $p$create policy gaas_feedback_objects_insert on storage.objects for insert to authenticated with check (bucket_id='gaas-feedback' and (select auth.uid()) is not null and name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(png|jpg|jpeg|webp|pdf|csv|xlsx)$')$p$;
 execute $p$create policy gaas_feedback_objects_delete on storage.objects for delete to authenticated using (bucket_id='gaas-feedback' and (select auth.uid()) is not null)$p$;
exception when undefined_table or invalid_schema_name then
 raise notice 'storage.buckets not available in this environment, skipping bucket bootstrap';
end$bucket$;

commit;
