create function public.gaas_verify_meta_dispatch(p_token text) returns boolean
language sql stable security definer set search_path='' as $$
 select length(p_token)=64 and exists(
 select 1 from vault.decrypted_secrets
 where name='collect_meta_events_auth_key' and decrypted_secret=p_token);
$$;
revoke all on function public.gaas_verify_meta_dispatch(text) from public,anon,authenticated;
grant execute on function public.gaas_verify_meta_dispatch(text) to service_role;
-- Replace the old public anon JWT without exporting the new credential.
do $$ declare v_id uuid; begin
 select id into strict v_id from vault.secrets where name='collect_meta_events_auth_key';
 perform vault.update_secret(v_id,encode(extensions.gen_random_bytes(32),'hex'));
end $$;
notify pgrst,'reload schema';
