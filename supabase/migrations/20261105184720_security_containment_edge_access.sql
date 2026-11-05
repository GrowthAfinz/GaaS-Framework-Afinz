create function public.gaas_access_status() returns boolean language sql stable security invoker set search_path='' as $$ select gaas_security.is_approved_member(); $$;
revoke all on function public.gaas_access_status() from public,anon;
grant execute on function public.gaas_access_status() to authenticated,service_role;
notify pgrst,'reload schema';
