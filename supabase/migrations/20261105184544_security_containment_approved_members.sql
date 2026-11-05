-- Emergency containment: explicit approved identities, independent of profile roles.
create schema if not exists gaas_security;
revoke all on schema gaas_security from public;
grant usage on schema gaas_security to anon, authenticated, service_role;
create table gaas_security.approved_members (
 user_id uuid primary key references auth.users(id) on delete cascade,
 approved_at timestamptz not null default now(),
 enabled boolean not null default true
);
alter table gaas_security.approved_members enable row level security;
revoke all on gaas_security.approved_members from public, anon, authenticated;
grant all on gaas_security.approved_members to service_role;
-- Initial incident roster only. New invitations require an explicit approval entry.
-- The reviewed roster is represented by hashes to avoid publishing employee emails.
insert into gaas_security.approved_members(user_id)
select id from auth.users where encode(sha256(convert_to(lower(email),'UTF8')),'hex') in (
'366614cf9dc162335cf17555989504795d242cdaf09c8120a1c0105f668e627a',
'd5308d96efd6a5c4c6d7db84a08a89311337f93c36e1abd002b9d28253853319',
'6393cade15865d99be23a5d2af490e2e71237c6e75f85e7d731224eba07adfbb',
'0ab26f578b87e28de5473e7a9aac3351b0f614fe7038de6c23220e62989e9484',
'39580b4fce9ff665920e84a5a861bf922a008a9a62f2488879094a37d33b5f2d',
'78f039896ffed0654728f0e8c02dae6e1ba059471d323869574fdb902d8d761f',
'531f973a9a2494ced45dadd6a527099623cb8c3ac01b2f3f4977105233c6899f',
'219281ebfbb7247ea9b5b82b655941dda08d397a7ba3f5d9f35d24aa77aceefa',
'336d3caa1eff1ae8ec55e25e607b2c49ce17195d8551bb3600814ae38d84dc90'
);
create function gaas_security.is_approved_member() returns boolean
language sql stable security definer set search_path = '' as $$
 select exists (
 select 1 from gaas_security.approved_members m
 join auth.users u on u.id=m.user_id
 where m.user_id=(select auth.uid()) and m.enabled
 and (u.banned_until is null or u.banned_until <= now())
 );
$$;
revoke all on function gaas_security.is_approved_member() from public;
grant execute on function gaas_security.is_approved_member() to anon,authenticated,service_role;
create function gaas_security.check_api_request() returns void
language plpgsql security definer set search_path = '' as $$
begin
 if coalesce(auth.jwt()->>'role','') = 'service_role' then return; end if;
 if not gaas_security.is_approved_member() then
   raise insufficient_privilege using message='Access restricted to approved GaaS members';
 end if;
end;
$$;
revoke all on function gaas_security.check_api_request() from public;
grant execute on function gaas_security.check_api_request() to anon,authenticated,service_role;
alter role authenticator set pgrst.db_pre_request = 'gaas_security.check_api_request';
-- Defense in depth for Storage / Realtime and direct table access.
do $$
declare t record;
begin
 for t in select c.relname,c.relrowsecurity from pg_class c
 join pg_namespace n on n.oid=c.relnamespace
 where n.nspname='public' and c.relkind in ('r','p')
 loop
   execute format('alter table public.%I enable row level security',t.relname);
   if not t.relrowsecurity then
     execute format('create policy gaas_existing_member_access on public.%I as permissive for all to authenticated using ((select gaas_security.is_approved_member())) with check ((select gaas_security.is_approved_member()))',t.relname);
   end if;
   execute format('create policy gaas_approved_member_gate on public.%I as restrictive for all to anon, authenticated using ((select gaas_security.is_approved_member())) with check ((select gaas_security.is_approved_member()))',t.relname);
 end loop;
end $$;
create policy gaas_approved_member_gate on storage.objects as restrictive
 for all to anon,authenticated
 using ((select gaas_security.is_approved_member()))
 with check ((select gaas_security.is_approved_member()));
-- Anonymous callers must not reach tables/views, sequences or RPCs.
revoke all on all tables in schema public from anon, public;
revoke all on all sequences in schema public from anon, public;
-- Preserve grants for legitimate users while removing inherited PUBLIC execution.
do $$
declare f record;
begin
 for f in select p.oid,p.oid::regprocedure as sig,
 has_function_privilege('authenticated',p.oid,'EXECUTE') as auth_exec,
 has_function_privilege('service_role',p.oid,'EXECUTE') as service_exec
 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 where n.nspname='public' and p.prokind='f'
 loop
   if f.auth_exec then execute format('grant execute on function %s to authenticated',f.sig); end if;
   if f.service_exec then execute format('grant execute on function %s to service_role',f.sig); end if;
   execute format('revoke execute on function %s from public, anon',f.sig);
 end loop;
end $$;
-- The app uses REST; close the alternate GraphQL entry point during containment.
revoke usage on schema graphql_public from public,anon,authenticated;
revoke execute on all functions in schema graphql_public from public,anon,authenticated;
-- A self-service profile update must never alter authorization fields.
create function gaas_security.protect_profile_authorization() returns trigger
language plpgsql set search_path = '' as $$
begin
 if current_user in ('anon','authenticated') and
   (new.role is distinct from old.role or new.id is distinct from old.id or new.email is distinct from old.email)
 then raise insufficient_privilege using message='Profile authorization fields require administrator provisioning';
 end if;
 return new;
end;
$$;
revoke all on function gaas_security.protect_profile_authorization() from public;
create trigger gaas_protect_profile_authorization before update on public.profiles
 for each row execute function gaas_security.protect_profile_authorization();
-- Future objects must not silently reopen anonymous access.
alter default privileges for role postgres in schema public revoke all on tables from anon,public;
alter default privileges for role postgres in schema public revoke all on sequences from anon,public;
alter default privileges for role postgres revoke execute on functions from public;
alter default privileges for role postgres in schema public revoke execute on functions from anon;
notify pgrst, 'reload config';
notify pgrst, 'reload schema';
