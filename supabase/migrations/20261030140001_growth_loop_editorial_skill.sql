begin;
-- Editorial revision only. Existing evidence, analyses and leases are preserved.
do $$begin
 if not exists(select 1 from public.growth_loop_settings where skill_version='1.0.0' and skill_hash='2727586ed3a08a25d8a73b166beaf7fb2b8bdda3227b7761b1493985c48c90f3') then raise exception 'unexpected_loop_skill_version';end if;
 update public.growth_loop_settings set skill_version='1.0.1',skill_hash='6eacaaf2fda3126fad8b8b11ec318ab849633c836fced4f7a2f314c20c9ff534' where id;
end$$;
commit;
