-- Extend the versioned editor to strategy-folder notes; keep approved-member/admin gates.
begin;
create or replace function public.gaas_wiki_pilot_save(p_note uuid,p_revision integer,p_source_hash text,p_document jsonb,p_request uuid,p_reason text default 'Edição da nota',p_reconcile boolean default false)
returns jsonb language plpgsql security definer set search_path='' as $$
declare n public.gaas_vault_notes; d public.gaas_wiki_pilot_documents; previous public.gaas_wiki_pilot_revisions; b jsonb; nr integer;
begin
 if auth.uid() is null or not gaas_security.is_approved_member() or not public.gaas_vault_is_admin() then raise exception 'wiki_pilot_access_denied' using errcode='42501';end if;
 if p_request is null then raise exception 'wiki_pilot_request_required';end if;
 perform pg_advisory_xact_lock(hashtext('wiki-pilot:'||p_note::text));
 select * into n from public.gaas_vault_notes where id=p_note and deleted_at is null;
 if not found or n.relative_path not like '05-Estrategia/%' then raise exception 'wiki_pilot_note_not_enabled';end if;
 select * into previous from public.gaas_wiki_pilot_revisions where note_id=p_note and request_id=p_request;
 if found then
  if previous.document is distinct from p_document or previous.source_hash is distinct from p_source_hash then raise exception 'wiki_pilot_request_reused';end if;
  -- Return current head, never roll the reader back to the historical retry.
  select * into d from public.gaas_wiki_pilot_documents where note_id=p_note;
  return to_jsonb(d);
 end if;
 select * into d from public.gaas_wiki_pilot_documents where note_id=p_note for update;
 if coalesce(d.revision,0) is distinct from p_revision then raise exception 'wiki_pilot_revision_conflict';end if;
 if n.content_hash is distinct from p_source_hash or (d.note_id is not null and d.source_hash is distinct from p_source_hash and not p_reconcile) then raise exception 'wiki_pilot_source_conflict';end if;
 if p_document is null or jsonb_typeof(p_document)<>'object' or length(p_document::text)>500000 or
  jsonb_typeof(p_document->'title') is distinct from 'string' or length(trim(p_document->>'title')) not between 3 and 240 or
  jsonb_typeof(p_document->'summary') is distinct from 'string' or
  jsonb_typeof(p_document->'blocks') is distinct from 'array' then raise exception 'wiki_pilot_invalid_document';end if;
 if jsonb_array_length(p_document->'blocks')>100 then raise exception 'wiki_pilot_too_many_blocks';end if;
 if exists(select 1 from jsonb_array_elements(p_document->'blocks') x where jsonb_typeof(x)<>'object' or jsonb_typeof(x->'id') is distinct from 'string' or coalesce(x->>'id','')!~'^[a-zA-Z0-9_-]{1,100}$' or coalesce(x->>'type','') not in ('markdown','tasks') or jsonb_typeof(x->'title') is distinct from 'string' or jsonb_typeof(x->'content') is distinct from 'string') then raise exception 'wiki_pilot_invalid_block';end if;
 if (select count(*) from jsonb_array_elements(p_document->'blocks'))<>(select count(distinct x->>'id') from jsonb_array_elements(p_document->'blocks') x) then raise exception 'wiki_pilot_duplicate_block';end if;
 if n.relative_path<>'05-Estrategia/Estrategia-Pool-de-Ofertas-Visa.md' and exists(select 1 from jsonb_array_elements(p_document->'blocks') x where x->>'type'='tasks') then raise exception 'wiki_pilot_task_binding_not_enabled';end if;
 if (select count(*) from jsonb_array_elements(p_document->'blocks') x where x->>'type'='tasks')>1 then raise exception 'wiki_pilot_duplicate_tasks';end if;
 b:=p_document->'taskLayout';
 if jsonb_typeof(b) is distinct from 'object' or jsonb_typeof(b->'hidden') is distinct from 'array' or jsonb_typeof(b->'order') is distinct from 'array' then raise exception 'wiki_pilot_invalid_layout';end if;
 if exists(select 1 from jsonb_array_elements((b->'hidden')||(b->'order')) x where jsonb_typeof(x)<>'string' or length(x#>>'{}')>100) or jsonb_array_length(b->'hidden')>300 or jsonb_array_length(b->'order')>300 then raise exception 'wiki_pilot_invalid_layout';end if;
 if d.document is not distinct from p_document and d.source_hash=p_source_hash then return to_jsonb(d);end if;
 nr:=coalesce(d.revision,0)+1;
 -- Preserve exact source as revision zero before the first operational change.
 if d.note_id is null then
  insert into public.gaas_wiki_pilot_revisions(note_id,revision,source_hash,source_markdown,document,actor_id,reason,request_id)
  values(p_note,0,n.content_hash,n.content_markdown,'{}',auth.uid(),'Fonte original preservada',gen_random_uuid());
 end if;
 insert into public.gaas_wiki_pilot_documents(note_id,revision,source_hash,source_markdown,document,updated_by)
 values(p_note,nr,p_source_hash,n.content_markdown,p_document,auth.uid())
 on conflict(note_id) do update set revision=excluded.revision,source_hash=excluded.source_hash,source_markdown=excluded.source_markdown,document=excluded.document,updated_by=excluded.updated_by,updated_at=clock_timestamp() returning * into d;
 insert into public.gaas_wiki_pilot_revisions(note_id,revision,source_hash,source_markdown,document,actor_id,reason,request_id)
 values(p_note,nr,p_source_hash,n.content_markdown,p_document,auth.uid(),left(coalesce(nullif(trim(p_reason),''),'Edição da nota'),300),p_request);
 return to_jsonb(d);
end$$;
commit;
