create or replace function gaas_sfmc_private.review_proposals(p_selection jsonb,p_action text,p_token text default null,p_key uuid default null,p_note text default '')
returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $fn$
declare prop public.communications_reconciliation_proposals; item jsonb; decisions jsonb:='[]'; revisions jsonb:='[]';
 impid uuid; next_import uuid; result jsonb; token text; group_key text; next_group text; prior_batch public.communications_proposal_batches;
begin
 if auth.uid() is null then raise exception 'Sessão autenticada necessária'; end if;
 if p_action='apply' then
 if p_key is null then raise exception 'Chave da aplicação necessária'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_key::text,1));
 select * into prior_batch from public.communications_proposal_batches where id=p_key;
 if found then
 if prior_batch.actor<>auth.uid() or prior_batch.selection<>p_selection or prior_batch.preview_token is distinct from p_token then raise exception 'Chave já usada por outra seleção'; end if;
 return prior_batch.result; end if;
 end if;
 if coalesce(p_action,'') not in ('preview','apply','reject') or jsonb_typeof(p_selection) is distinct from 'array'
 or jsonb_array_length(p_selection) not between 1 and 3000 then raise exception 'Seleção inválida'; end if;
 if p_action='reject' and length(btrim(p_note))<3 then raise exception 'Informe o motivo da rejeição'; end if;
 if exists(select 1 from jsonb_array_elements(p_selection) x group by x->>'id' having count(*)>1) then raise exception 'Proposta repetida'; end if;
 for item in select value from jsonb_array_elements(p_selection) order by value->>'id' loop
 select * into prop from public.communications_reconciliation_proposals where id=(item->>'id')::uuid for update;
 if not found or prop.revision<>(item->>'revision')::integer then raise exception 'Proposta mudou; atualize a fila'; end if;
 if prop.status not in ('ready','review') or (p_action<>'reject' and prop.status<>'ready') then raise exception 'Resolva as pendências antes de aprovar'; end if;
 select import_id into next_import from public.sfmc_package_messages where id=prop.message_id;
 next_group:=next_import::text||':'||(prop.resolved_context - 'evidence' - 'order' - 'tracking_moment')::text;
 -- Mixed channels and segments are validated per decision; import scope remains atomic.
 if impid is not null and impid<>next_import then raise exception 'Selecione uma análise por lote'; end if;
 impid:=next_import; group_key:=next_group;
 decisions:=decisions||jsonb_build_array(prop.review); revisions:=revisions||jsonb_build_array(jsonb_build_object('id',prop.id,'revision',prop.revision));
 end loop;
 if p_action='reject' then
 for item in select value from jsonb_array_elements(p_selection) loop
 update public.sfmc_package_messages set decision='rejected',decided_by=auth.uid(),decided_at=now()
 where id=(select message_id from public.communications_reconciliation_proposals where id=(item->>'id')::uuid) and decision='pending';
 insert into public.communications_proposal_events(proposal_id,actor,action,snapshot) values((item->>'id')::uuid,auth.uid(),'rejected',jsonb_build_object('note',p_note,'revision',item->'revision'));
 end loop;
 return jsonb_build_object('rejected',jsonb_array_length(p_selection));
 end if;
 result:=gaas_sfmc_private.process(impid,decisions,false);
 token:=encode(sha256(convert_to(jsonb_build_object('state',result->>'preview_token','revisions',revisions)::text,'UTF8')),'hex');
 if p_action='preview' then return result||jsonb_build_object('preview_token',token); end if;
 if token is distinct from p_token then raise exception 'Revisão desatualizada; simule novamente'; end if;
 result:=gaas_sfmc_private.process(impid,decisions,true,result->>'preview_token',p_key);
 insert into public.communications_proposal_batches(id,actor,selection,preview_token,result) values(p_key,auth.uid(),p_selection,p_token,result);
 for item in select value from jsonb_array_elements(p_selection) loop
 insert into public.communications_proposal_events(proposal_id,actor,action,snapshot) values((item->>'id')::uuid,auth.uid(),'applied',jsonb_build_object('result',result,'revision',item->'revision'));
 end loop;
 return result;
end $fn$;
