-- Recover a governed candidate when Meta title changed, only if Activity/context
-- fully identify an existing same-channel catalog ID. Remains in human review.
create or replace function gaas_sfmc_private.refine_contextual_candidates(p_import_id uuid)
returns void language plpgsql security definer set search_path=pg_catalog,public as $fn$
declare row_data record; candidate text; campaign text; ordinal text; partner_code text; runid uuid;
begin
 -- Offer/campaign is a batch boundary; 21D Vibe and Copa cannot share one approval lot.
 with facts as (
 select p.id,case when lower(m.payload->>'activity_name') ~ 'copa' then 'copa'
 when lower(m.payload->>'activity_name') ~ 'vibe' then 'vibe'
 when p.proposed_template_id ~ '^b2c_(car21|carsab)_(copa|vibe)_' then split_part(p.proposed_template_id,'_',3) else null end campaign
 from public.communications_reconciliation_proposals p join public.sfmc_package_messages m on m.id=p.message_id
 where m.import_id=p_import_id and m.decision='pending' and p.status<>'technical' and p.reviewed_by is null
 ),changed as (
 update public.communications_reconciliation_proposals p set resolved_context=resolved_context||jsonb_build_object('campaign',f.campaign),revision=revision+1,updated_at=now()
 from facts f where p.id=f.id and f.campaign is not null and p.resolved_context->>'campaign' is distinct from f.campaign
 returning p.id,p.resolved_context,p.revision
 ) insert into public.communications_proposal_events(proposal_id,actor,action,snapshot)
 select id,null,'analysis_published',jsonb_build_object('source','deterministic_governance','reason','Campanha explícita adicionada ao limite do lote','context',resolved_context,'revision',revision) from changed;
 for row_data in select p.*,m.payload from public.communications_reconciliation_proposals p
 join public.sfmc_package_messages m on m.id=p.message_id
 where m.import_id=p_import_id and m.decision='pending' and not (m.payload->>'is_optout')::boolean
 and p.proposed_template_id='' and p.reviewed_by is null and p.resolved_context->>'family' in('car21','carsab')
 order by p.id for update of p loop
 campaign:=case when lower(row_data.payload->>'activity_name') ~ 'copa' then 'copa'
 when lower(row_data.payload->>'activity_name') ~ 'vibe' then 'vibe' else null end;
 ordinal:=substring(lower(row_data.payload->>'activity_name') from 'disp([0-9]+)(?:copa|vibe)');
 partner_code:=case row_data.resolved_context->>'partner' when 'Serasa' then 'srsa' when 'Institucional' then 'inst' else null end;
 if campaign is null or ordinal is null or partner_code is null then continue; end if;
 candidate:='b2c_'||(row_data.resolved_context->>'family')||'_'||campaign||'_'||partner_code||'_Dispd'||ordinal;
 if not exists(select 1 from public.communication_templates where template_id=candidate and channel=row_data.payload->'content'->>'channel') then continue; end if;
 if runid is null then
 insert into public.communications_analysis_runs(import_id,producer,source,rule_version,source_refs,status)
 select id,uploaded_by,'deterministic_governance','governance-v2.2-contextual-catalog',jsonb_build_object('package_sha256',package_sha256,'scope','empty IDs with explicit Activity campaign/ordinal and existing governed catalog candidate'),'complete'
 from public.sfmc_package_imports where id=p_import_id returning id into runid;
 end if;
 update public.communications_reconciliation_proposals set analysis_id=runid,revision=revision+1,
 proposed_template_id=candidate,review=review||jsonb_build_object('template_id',candidate),
 alternatives=jsonb_build_array(candidate),status='review',
 reasons=reasons||jsonb_build_array('Candidato existente no catálogo do mesmo canal, por família/público/campanha e ordinal explícito no Activity Name'),
 conflicts=conflicts||jsonb_build_array('Título Meta divergente; confirmar identidade e texto antes de aprovar'),
 resolved_context=resolved_context||jsonb_build_object('candidate_ordinal',ordinal,'order','Ordinal no Activity Name; ordem cronológica não comprovada'),updated_at=now()
 where id=row_data.id;
 insert into public.communications_proposal_events(proposal_id,actor,action,snapshot)
 values(row_data.id,null,'analysis_published',jsonb_build_object('source','deterministic_governance','analysis_id',runid,'before',to_jsonb(row_data),'candidate',candidate));
 end loop;
end $fn$;
create or replace function gaas_sfmc_private.after_message_insert()
returns trigger language plpgsql security definer set search_path=pg_catalog,public as $fn$
begin perform gaas_sfmc_private.seed_proposals(new.import_id);perform gaas_sfmc_private.refine_contextual_candidates(new.import_id); return new; end $fn$;
revoke all on function gaas_sfmc_private.refine_contextual_candidates(uuid) from public,anon,authenticated;
do $do$ declare imp record; begin for imp in select id from public.sfmc_package_imports loop perform gaas_sfmc_private.refine_contextual_candidates(imp.id); end loop; end $do$;

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
 next_group:=next_import::text||':'||(prop.resolved_context - 'evidence' - 'order' - 'tracking_moment' - 'candidate_ordinal')::text;
 if p_action<>'reject' and group_key is not null and group_key<>next_group then raise exception 'Selecione um grupo de mesmo contexto e origem'; end if;
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

