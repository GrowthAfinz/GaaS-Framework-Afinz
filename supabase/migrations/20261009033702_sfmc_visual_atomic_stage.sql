-- Both UI and agent paths share the validated actor from the existing stage core.
alter function gaas_sfmc_private.stage_core(jsonb,text,uuid,text) rename to stage_graphs_v2;
create function gaas_sfmc_private.stage_core(p_package jsonb,p_scope text,p_actor uuid,p_via text) returns uuid language plpgsql security definer set search_path=pg_catalog,public as $$
declare result uuid;v jsonb;a jsonb;m jsonb;
begin
 result=gaas_sfmc_private.stage_graphs_v2(p_package-'visuals',p_scope,p_actor,p_via);
 v=p_package->'visuals';
 if v is not null then
  if p_actor is null or not exists(select 1 from public.sfmc_package_imports where id=result and uploaded_by=p_actor) then raise exception 'Recursos de importação não autorizados';end if;
  if jsonb_typeof(v->'assets') is distinct from 'array' or jsonb_typeof(v->'messages') is distinct from 'array' or jsonb_array_length(v->'assets')>1000 or jsonb_array_length(v->'messages')>3000 or length(v::text)>60000000 then raise exception 'Recursos fora do limite';end if;
  for a in select value from jsonb_array_elements(v->'assets') loop
   if coalesce(a->>'key','') !~ '^[a-zA-Z0-9_-]{1,100}$' or coalesce(a->>'file','') !~ '^[A-Za-z0-9+/=\r\n]+$' then raise exception 'Imagem inválida';end if;
   perform decode(a->>'file','base64');
   insert into public.sfmc_visual_assets values(result,a->>'key',a->>'mime',a->>'file') on conflict do nothing;
  end loop;
  for m in select value from jsonb_array_elements(v->'messages') loop
   if not exists(select 1 from public.sfmc_journey_snapshots s cross join lateral jsonb_array_elements(s.messages) msg where s.import_id=result and msg->>'occurrence_key'=m->>'occurrence_key' and msg->'content'->>'channel'='E-mail') then raise exception 'Ocorrência ausente';end if;
   insert into public.sfmc_visual_messages values(result,m->>'occurrence_key',m->>'html') on conflict do nothing;
  end loop;
 end if;
 return result;
end $$;
revoke all on function gaas_sfmc_private.stage_core(jsonb,text,uuid,text),gaas_sfmc_private.stage_graphs_v2(jsonb,text,uuid,text) from public,anon,authenticated;
grant execute on function gaas_sfmc_private.stage_core(jsonb,text,uuid,text),gaas_sfmc_private.stage_graphs_v2(jsonb,text,uuid,text) to service_role;
