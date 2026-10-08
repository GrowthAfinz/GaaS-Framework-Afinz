-- Agente (Claude/Codex) carrega pacote SFMC na fila em nome de um usuário real, sem impersonar sessão.
-- Só service_role executa. Aprovação continua humana: o agente nunca muda status, ID proposto ou activities.
alter table public.sfmc_package_imports add column if not exists staged_via text not null default 'ui';
alter table public.sfmc_package_imports drop constraint if exists sfmc_package_imports_staged_via_check;
alter table public.sfmc_package_imports add constraint sfmc_package_imports_staged_via_check
 check (staged_via in ('ui','agent:claude','agent:codex'));

-- Núcleo único da validação; stage (UI) e stage_as_agent só mudam quem assina.
create or replace function gaas_sfmc_private.stage_core(p_package jsonb, p_scope text, p_actor uuid, p_via text)
returns uuid language plpgsql security definer set search_path to 'pg_catalog','public' as $function$
declare result uuid; item jsonb; messages jsonb := p_package->'messages';
begin
 if p_actor is null then raise exception 'Sessão autenticada necessária'; end if;
 if btrim(coalesce(p_scope,''))='' or length(p_scope)>200 then raise exception 'Informe a BU/conta de origem'; end if;
 if jsonb_typeof(messages) is distinct from 'array' or jsonb_array_length(messages) not between 1 and 3000
 or octet_length(p_package::text)>20000000 then raise exception 'Pacote vazio ou acima do limite'; end if;
 insert into public.sfmc_package_imports(package_sha256,source_scope,file_name,package_name,package_version,parser_version,journeys_count,messages_count,uploaded_by,staged_via)
 values(p_package->>'package_sha256',btrim(p_scope),p_package->>'file_name',p_package->>'package_name',
 (p_package->>'package_version')::integer,p_package->>'parser_version',(p_package->>'journeys_count')::integer,jsonb_array_length(messages),p_actor,p_via)
 on conflict(package_sha256,source_scope,uploaded_by) do nothing returning id into result;
 if result is null then
  select id into result from public.sfmc_package_imports where package_sha256=p_package->>'package_sha256' and source_scope=btrim(p_scope) and uploaded_by=p_actor;
  return result;
 end if;
 for item in select value from jsonb_array_elements(messages) loop
  if coalesce(item->>'occurrence_key','')='' or coalesce(item->>'activity_key','')='' or coalesce(item->>'journey_name','')=''
  or coalesce(item->'content'->>'channel','') not in('WhatsApp','SMS','E-mail','Push')
  or jsonb_typeof(item->'content'->'body_params') is distinct from 'array' or jsonb_typeof(item->'content'->'buttons') is distinct from 'array'
  or jsonb_typeof(item->'is_optout') is distinct from 'boolean' then raise exception 'Mensagem sem estrutura válida'; end if;
  if exists(select 1 from unnest(array['body_text','footer','banner_url','sms_from','meta_template_name']) field
    where coalesce(jsonb_typeof(item->'content'->field),'null') not in ('string','null'))
  or jsonb_typeof(item->'alerts') is distinct from 'array'
  or exists(select 1 from jsonb_array_elements(item->'alerts') value where jsonb_typeof(value)<>'string')
  or jsonb_typeof(item->'paths') is distinct from 'array'
  or exists(select 1 from jsonb_array_elements(item->'paths') path
    where jsonb_typeof(path->'labels') is distinct from 'array' or jsonb_typeof(path->'waits') is distinct from 'array')
  or exists(select 1 from jsonb_array_elements(item->'content'->'body_params') x where jsonb_typeof(x) <> 'string')
  or exists(select 1 from jsonb_array_elements(item->'content'->'buttons') x where jsonb_typeof(x->'title') is distinct from 'string' or coalesce(x->>'type','') not in('url','reply'))
  then raise exception 'Conteúdo sem estrutura válida'; end if;
  insert into public.sfmc_package_messages(import_id,occurrence_key,payload) values(result,item->>'occurrence_key',item);
 end loop;
 return result;
end $function$;

create or replace function gaas_sfmc_private.stage(p_package jsonb, p_scope text)
returns uuid language plpgsql security definer set search_path to 'pg_catalog','public' as $function$
begin return gaas_sfmc_private.stage_core(p_package,p_scope,auth.uid(),'ui'); end $function$;

create or replace function gaas_sfmc_private.stage_as_agent(p_package jsonb, p_scope text, p_on_behalf uuid, p_agent text)
returns uuid language plpgsql security definer set search_path to 'pg_catalog','public' as $function$
begin
 if p_agent not in ('claude','codex') then raise exception 'Agente desconhecido'; end if;
 if not exists(select 1 from auth.users where id=p_on_behalf) then raise exception 'Usuário responsável não encontrado'; end if;
 return gaas_sfmc_private.stage_core(p_package,p_scope,p_on_behalf,'agent:'||p_agent);
end $function$;

-- Cruzamento pacote x activities x catálogo, por proposta. Leitura pura.
create or replace function gaas_sfmc_private.agent_cross(p_import_id uuid)
returns jsonb language sql stable security definer set search_path to 'pg_catalog','public' as $function$
 with props as (
  select pr.id proposal_id, pr.status, pr.proposed_template_id, pr.observed_template_id, m.payload p
  from public.communications_reconciliation_proposals pr join public.sfmc_package_messages m on m.id=pr.message_id
  where m.import_id=p_import_id and not (m.payload->>'is_optout')::boolean
 ), acts as (
  select a.*, btrim(a."Activity name / Taxonomia") act,
   regexp_replace(upper(btrim(coalesce(a.jornada,''))),'^JOR_AQUISICAO_','JOR_AQS_') jor
  from public.activities a
  where btrim(a."Activity name / Taxonomia") in (select btrim(p->>'activity_name') from props)
 )
 select coalesce(jsonb_agg(jsonb_build_object(
  'proposal_id',x.proposal_id,'status',x.status,'proposed',x.proposed_template_id,'observed',x.observed_template_id,
  'activity',x.p->>'activity_name','journey',x.p->>'journey_name','version',x.p->'journey_version','channel',x.p->'content'->>'channel',
  'meta_template',x.p->'content'->>'meta_template_name','utm',x.p->'utm','alerts',x.p->'alerts',
  'catalog',(select jsonb_build_object('status',t.status,'has_asset',t.original_path is not null,'title',t.title) from public.communication_templates t where t.template_id=x.proposed_template_id),
  'exec_same_journey',(select count(*) from acts where acts.act=btrim(x.p->>'activity_name') and acts.jor=regexp_replace(upper(btrim(x.p->>'journey_name')),'^JOR_AQUISICAO_','JOR_AQS_')),
  'exec_any_journey',(select count(*) from acts where acts.act=btrim(x.p->>'activity_name')),
  'other_journeys',(select jsonb_agg(distinct acts.jornada) from acts where acts.act=btrim(x.p->>'activity_name') and acts.jor<>regexp_replace(upper(btrim(x.p->>'journey_name')),'^JOR_AQUISICAO_','JOR_AQS_')),
  'dates',(select jsonb_build_array(min(acts."Data de Disparo")::date,max(acts."Data de Disparo")::date) from acts where acts.act=btrim(x.p->>'activity_name')),
  'linked_templates',(select jsonb_agg(distinct acts.template_id) from acts where acts.act=btrim(x.p->>'activity_name') and acts.template_id is not null),
  'columns',(select jsonb_agg(distinct jsonb_build_object('bu',acts."BU",'parceiro',acts.parceiro_canonico,'segmento',acts."Segmento",'subgrupo',acts."Subgrupos",'oferta',acts."Oferta",'promocional',acts."Promocional",'canal',acts."Canal")) from acts where acts.act=btrim(x.p->>'activity_name'))
 ) order by x.p->>'journey_name', x.p->>'activity_name'),'[]'::jsonb) from props x
$function$;

-- Notas do agente: só evento de auditoria, não altera a proposta.
create or replace function gaas_sfmc_private.annotate_as_agent(p_notes jsonb, p_agent text)
returns integer language plpgsql security definer set search_path to 'pg_catalog','public' as $function$
declare item jsonb; n integer := 0;
begin
 if p_agent not in ('claude','codex') then raise exception 'Agente desconhecido'; end if;
 if jsonb_typeof(p_notes) is distinct from 'array' or jsonb_array_length(p_notes) not between 1 and 3000 then raise exception 'Notas inválidas'; end if;
 for item in select value from jsonb_array_elements(p_notes) loop
  if not exists(select 1 from public.communications_reconciliation_proposals where id=(item->>'proposal_id')::uuid) then raise exception 'Proposta não encontrada'; end if;
  if jsonb_typeof(item->'notes') is distinct from 'array' or jsonb_array_length(item->'notes')=0
  or exists(select 1 from jsonb_array_elements(item->'notes') x where coalesce(x->>'kind','') not in ('erro','hipotese','pergunta','info') or length(btrim(coalesce(x->>'text','')))<3)
  then raise exception 'Nota sem estrutura válida'; end if;
  insert into public.communications_proposal_events(proposal_id,actor,action,snapshot)
  values((item->>'proposal_id')::uuid,null,'agent_note',jsonb_build_object('agent',p_agent,'notes',item->'notes'));
  n := n+1;
 end loop;
 return n;
end $function$;

create or replace function public.stage_sfmc_package_as_agent(p_package jsonb, p_scope text, p_on_behalf uuid, p_agent text)
returns uuid language sql security invoker set search_path=pg_catalog as $f$ select gaas_sfmc_private.stage_as_agent(p_package,p_scope,p_on_behalf,p_agent) $f$;
create or replace function public.sfmc_agent_cross(p_import_id uuid)
returns jsonb language sql security invoker set search_path=pg_catalog as $f$ select gaas_sfmc_private.agent_cross(p_import_id) $f$;
create or replace function public.annotate_proposals_as_agent(p_notes jsonb, p_agent text)
returns integer language sql security invoker set search_path=pg_catalog as $f$ select gaas_sfmc_private.annotate_as_agent(p_notes,p_agent) $f$;

revoke all on function gaas_sfmc_private.stage_core(jsonb,text,uuid,text) from public,anon,authenticated;
revoke all on function gaas_sfmc_private.stage_as_agent(jsonb,text,uuid,text),gaas_sfmc_private.agent_cross(uuid),gaas_sfmc_private.annotate_as_agent(jsonb,text),
 public.stage_sfmc_package_as_agent(jsonb,text,uuid,text),public.sfmc_agent_cross(uuid),public.annotate_proposals_as_agent(jsonb,text) from public,anon,authenticated;
grant execute on function gaas_sfmc_private.stage_core(jsonb,text,uuid,text),gaas_sfmc_private.stage_as_agent(jsonb,text,uuid,text),gaas_sfmc_private.agent_cross(uuid),gaas_sfmc_private.annotate_as_agent(jsonb,text),
 public.stage_sfmc_package_as_agent(jsonb,text,uuid,text),public.sfmc_agent_cross(uuid),public.annotate_proposals_as_agent(jsonb,text) to service_role;
grant usage on schema gaas_sfmc_private to service_role;
