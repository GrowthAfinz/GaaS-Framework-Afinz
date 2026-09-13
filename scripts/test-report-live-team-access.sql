-- Read-only assertions for Report Live team access after the migration.
do $$
declare
  pablo_role text;
begin
  if not exists (
    select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public' and c.relname='report_live_memberships' and c.relrowsecurity
  ) then raise exception 'FAIL: memberships RLS is not enabled'; end if;

  if has_table_privilege('anon','public.report_live_memberships','select')
    or has_table_privilege('authenticated','public.report_live_memberships','insert')
    or has_table_privilege('authenticated','public.report_live_memberships','update')
    or has_table_privilege('authenticated','public.report_live_memberships','delete') then
    raise exception 'FAIL: membership grants are too broad';
  end if;

  if not has_table_privilege('authenticated','public.report_live_memberships','select') then
    raise exception 'FAIL: users cannot read their own membership';
  end if;

  if has_table_privilege('authenticated','public.report_live_membership_audit','select')
    or has_table_privilege('anon','public.report_live_membership_audit','select') then
    raise exception 'FAIL: membership audit is exposed';
  end if;

  select role into pablo_role
  from public.report_live_memberships
  where email='pablo.castro@afinz.com.br' and active;
  if pablo_role is distinct from 'admin' then
    raise exception 'FAIL: initial Report Live administrator is missing';
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='report_runs' and column_name='requested_by'
  ) then raise exception 'FAIL: report run requester is not audited'; end if;

  if has_function_privilege(
    'authenticated','public.report_live_set_member(uuid,uuid,text,text,boolean)','execute'
  ) or has_function_privilege(
    'anon','public.report_live_set_member(uuid,uuid,text,text,boolean)','execute'
  ) then raise exception 'FAIL: membership mutation RPC is exposed'; end if;
end $$;
