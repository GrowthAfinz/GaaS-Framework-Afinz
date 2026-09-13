-- Read-only production assertion for the three core datasets consumed by GaaS.
do $$
declare table_name text;
begin
  foreach table_name in array array['activities','paid_media_metrics','b2c_daily_metrics'] loop
    if not (select c.relrowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace
      where n.nspname='public' and c.relname=table_name) then
      raise exception 'FAIL: RLS disabled on %',table_name;
    end if;
    if has_table_privilege('anon',format('public.%I',table_name),'select')
      or has_table_privilege('anon',format('public.%I',table_name),'insert')
      or has_table_privilege('anon',format('public.%I',table_name),'update')
      or has_table_privilege('anon',format('public.%I',table_name),'delete') then
      raise exception 'FAIL: anon retains CRUD on %',table_name;
    end if;
    if not has_table_privilege('authenticated',format('public.%I',table_name),'select') then
      raise exception 'FAIL: authenticated read missing on %',table_name;
    end if;
  end loop;
end $$;
