-- Shared context exchange. Canonical notes remain writable only by the existing vault sync.
create schema if not exists gaas_knowledge_private;
revoke all on schema gaas_knowledge_private from public, anon, authenticated;

create table public.gaas_knowledge_reviewers (
  user_id uuid primary key references auth.users(id)
);
alter table public.gaas_knowledge_reviewers enable row level security;
revoke all on public.gaas_knowledge_reviewers from public, anon, authenticated;
grant select on public.gaas_knowledge_reviewers to authenticated;
create policy knowledge_reviewer_self on public.gaas_knowledge_reviewers for select to authenticated using (user_id=(select auth.uid()));
-- Resolve the existing governed owner; never infer reviewers from editable JWT metadata.
insert into public.gaas_knowledge_reviewers(user_id)
select user_id from public.report_live_memberships where lower(email)='pablo.castro@afinz.com.br' and active and role='admin';

create function public.gaas_knowledge_can_review() returns boolean language sql stable security invoker set search_path='' as $$
  select exists(select 1 from public.gaas_knowledge_reviewers where user_id=(select auth.uid()));
$$;
revoke all on function public.gaas_knowledge_can_review() from public, anon;
grant execute on function public.gaas_knowledge_can_review() to authenticated;

create table public.gaas_knowledge_packs (
  id uuid primary key,
  title text not null check(length(title) between 1 and 200),
  objective text not null default '' check(length(objective)<=4000),
  storage_path text not null unique,
  manifest jsonb not null check(jsonb_typeof(manifest)='object' and manifest->>'schema'='gaas-knowledge-pack/1' and jsonb_typeof(manifest->'notes')='array' and length(manifest::text)<3000000),
  created_by uuid not null references auth.users(id) default auth.uid(),
  created_at timestamptz not null default now(),
  check(manifest->>'id'=id::text),
  check(storage_path=created_by::text||'/'||id::text||'.zip')
);
alter table public.gaas_knowledge_packs enable row level security;
revoke all on public.gaas_knowledge_packs from public, anon, authenticated;
grant select,insert on public.gaas_knowledge_packs to authenticated;
create policy knowledge_packs_read on public.gaas_knowledge_packs for select to authenticated using ((select auth.uid()) is not null);
create policy knowledge_packs_insert on public.gaas_knowledge_packs for insert to authenticated with check(created_by=(select auth.uid()));
create index knowledge_packs_created on public.gaas_knowledge_packs(created_at desc);

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('gaas-knowledge-packs','gaas-knowledge-packs',false,20971520,array['application/zip']);
create policy knowledge_archive_read on storage.objects for select to authenticated
using(bucket_id='gaas-knowledge-packs' and (select auth.uid()) is not null);
create policy knowledge_archive_upload on storage.objects for insert to authenticated
with check(bucket_id='gaas-knowledge-packs' and split_part(name,'/',1)=(select auth.uid())::text and name ~ '^[a-f0-9-]{36}/[a-f0-9-]{36}\.zip$');
-- Only unregistered uploads can be cleaned up by their creator. Registered versions are immutable.
create policy knowledge_archive_cleanup on storage.objects for delete to authenticated
using(bucket_id='gaas-knowledge-packs' and split_part(name,'/',1)=(select auth.uid())::text
and not exists(select 1 from public.gaas_knowledge_packs where storage_path=name));

create table public.gaas_knowledge_contributions (
  id uuid primary key default gen_random_uuid(),
  pack_id uuid not null references public.gaas_knowledge_packs(id),
  title text not null check(length(trim(title)) between 1 and 200),
  rationale text not null check(length(trim(rationale)) between 1 and 10000),
  changes jsonb not null check(jsonb_typeof(changes)='array' and jsonb_array_length(changes) between 1 and 30 and length(changes::text)<=2000000),
  fingerprint text not null,
  status text not null default 'pending' check(status in ('pending','changes_requested','approved','rejected','incorporated')),
  review_comment text check(length(review_comment)<=10000),
  created_by uuid not null references auth.users(id) default auth.uid(),
  created_at timestamptz not null default now(),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  approved_at timestamptz,
  incorporated_at timestamptz,
  unique(created_by,pack_id,fingerprint)
);
alter table public.gaas_knowledge_contributions enable row level security;
revoke all on public.gaas_knowledge_contributions from public, anon, authenticated;
grant select,insert on public.gaas_knowledge_contributions to authenticated;
grant update(status,review_comment) on public.gaas_knowledge_contributions to authenticated;
create policy knowledge_contributions_read on public.gaas_knowledge_contributions for select to authenticated using ((select auth.uid()) is not null);
create policy knowledge_contributions_submit on public.gaas_knowledge_contributions for insert to authenticated with check(created_by=(select auth.uid()) and status='pending' and reviewed_by is null and approved_at is null and incorporated_at is null);
create policy knowledge_contributions_review on public.gaas_knowledge_contributions for update to authenticated using ((select public.gaas_knowledge_can_review())) with check((select public.gaas_knowledge_can_review()));
create index knowledge_contributions_created on public.gaas_knowledge_contributions(created_at desc);

create table public.gaas_knowledge_contribution_events (
  id uuid primary key default gen_random_uuid(),
  contribution_id uuid not null references public.gaas_knowledge_contributions(id),
  status text not null,
  comment text,
  actor_id uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);
alter table public.gaas_knowledge_contribution_events enable row level security;
revoke all on public.gaas_knowledge_contribution_events from public, anon, authenticated;
grant select on public.gaas_knowledge_contribution_events to authenticated;
create policy knowledge_events_read on public.gaas_knowledge_contribution_events for select to authenticated using ((select auth.uid()) is not null);
create index knowledge_events_parent on public.gaas_knowledge_contribution_events(contribution_id,created_at);

create function gaas_knowledge_private.validate_contribution() returns trigger language plpgsql security invoker set search_path='' as $$
declare c jsonb; pack jsonb; current_hash text; approved_sync uuid;
begin
  if auth.uid() is null then raise exception 'knowledge_auth_required'; end if;
  if tg_op='INSERT' then
    if new.created_by<>auth.uid() or new.status<>'pending' or new.reviewed_by is not null or new.reviewed_at is not null or new.approved_at is not null or new.incorporated_at is not null or new.review_comment is not null then raise exception 'knowledge_initial_state_invalid'; end if;
    select manifest into pack from public.gaas_knowledge_packs where id=new.pack_id;
    if pack is null then raise exception 'knowledge_pack_not_found'; end if;
    if (select count(distinct value->>'path') from jsonb_array_elements(new.changes))<>jsonb_array_length(new.changes) then raise exception 'knowledge_duplicate_path'; end if;
    for c in select value from jsonb_array_elements(new.changes) loop
      if c->>'path' is null or length(c->>'path')>500 or c->>'path' !~ '\.md$' or c->>'path' ~ '(^/|\\|:|(^|/)\.|//|[[:cntrl:]])' or c->>'path' like '99-Templates/%' then raise exception 'knowledge_invalid_path'; end if;
      if jsonb_typeof(c->'markdown') is distinct from 'string' or length(trim(c->>'markdown'))=0 or length(c->>'markdown')>300000 or not(c ? 'base_hash') then raise exception 'knowledge_invalid_markdown'; end if;
      if c->>'expected_hash' is distinct from encode(sha256(convert_to(c->>'markdown','UTF8')),'hex') then raise exception 'knowledge_invalid_expected_hash'; end if;
      if c->>'base_hash' is not null and not exists(select 1 from jsonb_array_elements(pack->'notes') n where n->>'path'=c->>'path' and n->>'hash'=c->>'base_hash') then raise exception 'knowledge_source_not_in_pack'; end if;
      if c->>'base_hash' is null and exists(select 1 from jsonb_array_elements(pack->'notes') n where n->>'path'=c->>'path') then raise exception 'knowledge_existing_note_requires_base'; end if;
      select content_hash into current_hash from public.gaas_vault_notes where vault_key='afinz-crm-midia' and relative_path=c->>'path' and deleted_at is null;
      if current_hash is distinct from c->>'base_hash' then raise exception 'knowledge_source_changed: %',c->>'path'; end if;
    end loop;
    new.fingerprint=encode(sha256(convert_to(new.changes::text,'UTF8')),'hex');
    new.created_at=now();
  else
    if not public.gaas_knowledge_can_review() then raise exception 'knowledge_reviewer_required'; end if;
    if (to_jsonb(new)-array['status','review_comment']) is distinct from (to_jsonb(old)-array['status','review_comment']) then raise exception 'knowledge_proposal_immutable'; end if;
    if old.status in ('incorporated','rejected') then raise exception 'knowledge_review_closed'; end if;
    if new.status not in ('approved','changes_requested','rejected','incorporated') or (new.status='incorporated' and old.status<>'approved') or (old.status='approved' and new.status not in ('incorporated','rejected')) then raise exception 'knowledge_invalid_transition'; end if;
    if new.status in ('changes_requested','rejected') and coalesce(length(trim(new.review_comment)),0)=0 then raise exception 'knowledge_review_comment_required'; end if;
    if new.status in ('approved','incorporated') then
      if exists(select 1 from public.gaas_vault_sync_runs where vault_key='afinz-crm-midia' and status='running') then raise exception 'knowledge_sync_running'; end if;
      for c in select value from jsonb_array_elements(new.changes) loop
        select content_hash,last_sync_run_id into current_hash,approved_sync from public.gaas_vault_notes where vault_key='afinz-crm-midia' and relative_path=c->>'path' and deleted_at is null;
        if new.status='approved' and current_hash is distinct from c->>'base_hash' then raise exception 'knowledge_source_changed: %',c->>'path'; end if;
        if new.status='incorporated' and (current_hash is distinct from c->>'expected_hash' or not exists(select 1 from public.gaas_vault_sync_runs where id=approved_sync and status='completed' and completed_at>=old.approved_at)) then raise exception 'knowledge_not_yet_incorporated: %',c->>'path'; end if;
      end loop;
    end if;
    new.reviewed_by=auth.uid();new.reviewed_at=now();
    if new.status='approved' then new.approved_at=now(); end if;
    if new.status='incorporated' then new.incorporated_at=now(); end if;
  end if;
  return new;
end $$;
revoke all on function gaas_knowledge_private.validate_contribution() from public,anon,authenticated;
create trigger knowledge_validate before insert or update on public.gaas_knowledge_contributions for each row execute function gaas_knowledge_private.validate_contribution();

-- Internal audit writer is not an exposed RPC and cannot be called directly by clients.
create function gaas_knowledge_private.audit_contribution() returns trigger language plpgsql security definer set search_path='' as $$
begin
  insert into public.gaas_knowledge_contribution_events(contribution_id,status,comment,actor_id)
  values(new.id,new.status,new.review_comment,auth.uid());
  return new;
end $$;
revoke all on function gaas_knowledge_private.audit_contribution() from public,anon,authenticated;
create trigger knowledge_audit after insert or update on public.gaas_knowledge_contributions for each row execute function gaas_knowledge_private.audit_contribution();

create function public.gaas_knowledge_submit(p_pack_id uuid,p_title text,p_rationale text,p_changes jsonb) returns uuid language plpgsql security invoker set search_path='' as $$
declare result uuid;
begin
  insert into public.gaas_knowledge_contributions(pack_id,title,rationale,changes,fingerprint)
  values(p_pack_id,p_title,p_rationale,p_changes,'computed_by_trigger') returning id into result;
  return result;
exception when unique_violation then raise exception 'knowledge_duplicate_contribution';
end $$;
revoke all on function public.gaas_knowledge_submit(uuid,text,text,jsonb) from public,anon;
grant execute on function public.gaas_knowledge_submit(uuid,text,text,jsonb) to authenticated;

create function public.gaas_knowledge_review(p_id uuid,p_status text,p_comment text default '') returns uuid language plpgsql security invoker set search_path='' as $$
declare result uuid;
begin
  if not public.gaas_knowledge_can_review() then raise exception 'knowledge_reviewer_required'; end if;
  update public.gaas_knowledge_contributions set status=p_status,review_comment=nullif(trim(p_comment),'') where id=p_id returning id into result;
  if result is null then raise exception 'knowledge_contribution_not_found'; end if;
  return result;
end $$;
revoke all on function public.gaas_knowledge_review(uuid,text,text) from public,anon;
grant execute on function public.gaas_knowledge_review(uuid,text,text) to authenticated;

-- One statement snapshot avoids row caps and mixing note revisions across paginated calls.
create function public.gaas_knowledge_snapshot() returns jsonb language sql stable security invoker set search_path='' as $$
  select jsonb_build_object(
    'stable',not exists(select 1 from public.gaas_vault_sync_runs where vault_key='afinz-crm-midia' and status='running') and not exists(select 1 from public.gaas_vault_notes n left join public.gaas_vault_sync_runs s on s.id=n.last_sync_run_id where n.vault_key='afinz-crm-midia' and n.deleted_at is null and s.status is distinct from 'completed'),
    'notes',coalesce((select jsonb_agg(to_jsonb(n)-'search_vector' order by relative_path) from public.gaas_vault_notes n where vault_key='afinz-crm-midia' and deleted_at is null),'[]'::jsonb),
    'sync',(select to_jsonb(s) from public.gaas_vault_sync_runs s where vault_key='afinz-crm-midia' and status='completed' order by completed_at desc limit 1),
    'latest_attempt',(select to_jsonb(s) from public.gaas_vault_sync_runs s where vault_key='afinz-crm-midia' order by started_at desc limit 1)
  );
$$;
revoke all on function public.gaas_knowledge_snapshot() from public,anon;
grant execute on function public.gaas_knowledge_snapshot() to authenticated;
