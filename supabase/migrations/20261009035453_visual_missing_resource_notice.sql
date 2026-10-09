create or replace function public.read_journey_flow_message(p_snapshot uuid,p_occurrence text) returns jsonb language plpgsql stable security invoker set search_path=pg_catalog,public as $$
declare msg jsonb;imp uuid;h text;a record;
begin
 if (select auth.uid()) is null then return null;end if;
 select m,s.import_id into msg,imp from public.sfmc_journey_snapshots s cross join lateral jsonb_array_elements(s.messages) m where s.id=p_snapshot and m->>'occurrence_key'=p_occurrence;
 if msg is null then return null;end if;
 select html into h from public.sfmc_visual_messages where import_id=imp and occurrence_key=p_occurrence;
 if h is not null then
  for a in select * from public.sfmc_visual_assets where import_id=imp and position('sfmc-asset:'||asset_key||'"' in h)>0 or (import_id=imp and position('sfmc-asset:'||asset_key||chr(39) in h)>0) loop
   h=replace(h,'sfmc-asset:'||a.asset_key||'"','data:'||a.mime||';base64,'||a.file_base64||'"');
   h=replace(h,'sfmc-asset:'||a.asset_key||chr(39),'data:'||a.mime||';base64,'||a.file_base64||chr(39));
  end loop;
  msg=jsonb_set(msg,'{content,email_html}',to_jsonb(h));
  msg=jsonb_set(msg,'{alerts}',coalesce((select jsonb_agg(v) from jsonb_array_elements(msg->'alerts') v where v#>>'{}' not in('Imagem sem URL publicada ou acima do limite de imagem embutida','Prévia HTML excede o limite de conteúdo do pacote','Prévia HTML não disponível no conteúdo exportado')),'[]'::jsonb));
  if h ~ $rx$<img[[:space:]][^>]*src=["'][[:space:]]*["']$rx$ or position('sfmc-asset:' in h)>0 then
   msg=jsonb_set(msg,'{alerts}',coalesce(msg->'alerts','[]'::jsonb)||jsonb_build_array('Imagem ausente no pack ou sem referência utilizável; prévia incompleta'));
  end if;
 end if;
 return msg;
end $$;
