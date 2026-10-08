-- Agente propõe template ID em proposta sem revisão humana. Sempre cai em 'review' (nunca 'ready'),
-- preserva resolved_context do seed, acrescenta razões/conflitos e nunca toca activities nem catálogo.
create or replace function gaas_sfmc_private.propose_as_agent(p_proposals jsonb, p_agent text, p_rule text)
returns integer language plpgsql security definer set search_path to 'pg_catalog','public' as $function$
declare item jsonb; prop public.communications_reconciliation_proposals; msg public.sfmc_package_messages; n integer := 0;
begin
 if p_agent not in ('claude','codex') then raise exception 'Agente desconhecido'; end if;
 if coalesce(btrim(p_rule),'')='' then raise exception 'Informe a regra usada'; end if;
 if jsonb_typeof(p_proposals) is distinct from 'array' or jsonb_array_length(p_proposals) not between 1 and 3000 then raise exception 'Propostas inválidas'; end if;
 for item in select value from jsonb_array_elements(p_proposals) loop
  select * into prop from public.communications_reconciliation_proposals where id=(item->>'proposal_id')::uuid for update;
  if not found then raise exception 'Proposta não encontrada'; end if;
  select * into msg from public.sfmc_package_messages where id=prop.message_id;
  if prop.reviewed_by is not null or msg.decision<>'pending' or (msg.payload->>'is_optout')::boolean
   or prop.status not in ('ready','review') then raise exception 'Proposta % já revisada ou fora da fila', prop.id; end if;
  if coalesce(item->>'proposed_template_id','') !~ '^[A-Za-z0-9][A-Za-z0-9_-]{2,79}$' then raise exception 'ID inválido: %', item->>'proposed_template_id'; end if;
  if coalesce(jsonb_typeof(item->'reasons'),'array')<>'array' or coalesce(jsonb_typeof(item->'conflicts'),'array')<>'array' then raise exception 'Evidências inválidas'; end if;
  update public.communications_reconciliation_proposals set revision=revision+1,
   proposed_template_id=item->>'proposed_template_id',
   reasons=reasons||coalesce(item->'reasons','[]'::jsonb), conflicts=conflicts||coalesce(item->'conflicts','[]'::jsonb),
   review=review||jsonb_build_object('template_id',item->>'proposed_template_id'),
   status='review', updated_at=now() where id=prop.id;
  insert into public.communications_proposal_events(proposal_id,actor,action,snapshot)
  values(prop.id,null,'agent_proposed',jsonb_build_object('agent',p_agent,'rule',p_rule,'before',jsonb_build_object('proposed_template_id',prop.proposed_template_id,'status',prop.status,'revision',prop.revision),'item',item));
  n := n+1;
 end loop;
 return n;
end $function$;

create or replace function public.propose_templates_as_agent(p_proposals jsonb, p_agent text, p_rule text)
returns integer language sql security invoker set search_path=pg_catalog as $f$ select gaas_sfmc_private.propose_as_agent(p_proposals,p_agent,p_rule) $f$;

revoke all on function gaas_sfmc_private.propose_as_agent(jsonb,text,text), public.propose_templates_as_agent(jsonb,text,text) from public,anon,authenticated;
grant execute on function gaas_sfmc_private.propose_as_agent(jsonb,text,text), public.propose_templates_as_agent(jsonb,text,text) to service_role;
