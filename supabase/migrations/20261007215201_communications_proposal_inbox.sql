-- Shared proposal inbox. Read scope matches the existing authenticated communications workspace.
-- Analysis actors never impersonate reviewers. Operational writes reuse the validated apply gateway.
create table public.communications_analysis_runs (
 id uuid primary key default gen_random_uuid(), import_id uuid not null references public.sfmc_package_imports,
 producer uuid, source text not null, rule_version text not null, source_refs jsonb not null,
 status text not null check(status in ('complete')), created_at timestamptz not null default now()
);
create table public.communications_reconciliation_proposals (
 id uuid primary key default gen_random_uuid(), message_id uuid not null unique references public.sfmc_package_messages,
 analysis_id uuid not null references public.communications_analysis_runs,
 revision integer not null default 1, observed_template_id text, proposed_template_id text not null default '',
 resolved_context jsonb not null default '{}', reasons jsonb not null default '[]', conflicts jsonb not null default '[]',
 alternatives jsonb not null default '[]', review jsonb not null,
 status text not null check(status in ('ready','review','technical','rejected','applied')),
 reviewed_by uuid, reviewed_at timestamptz, updated_at timestamptz not null default now()
);
create index communications_proposals_status on public.communications_reconciliation_proposals(status, id);
create table public.communications_proposal_events (
 id bigint generated always as identity primary key,
 proposal_id uuid not null references public.communications_reconciliation_proposals,
 actor uuid, action text not null, snapshot jsonb not null, created_at timestamptz not null default now()
);
create index communications_proposal_events_proposal on public.communications_proposal_events(proposal_id, id);
create table public.communications_proposal_batches (
 id uuid primary key, actor uuid not null, selection jsonb not null, preview_token text not null,
 result jsonb not null, created_at timestamptz not null default now()
);
do $do$ declare tbl text; begin
 foreach tbl in array array['communications_analysis_runs','communications_reconciliation_proposals','communications_proposal_events','communications_proposal_batches'] loop
 execute format('alter table public.%I enable row level security',tbl);
 execute format('revoke all on public.%I from public,anon,authenticated',tbl);
 execute format('grant select on public.%I to authenticated',tbl);
 execute format('create policy communications_read on public.%I for select to authenticated using ((select auth.uid()) is not null)',tbl);
 end loop;
end $do$;
create or replace function gaas_sfmc_private.process(p_import_id uuid,p_decisions jsonb,p_apply boolean,
 p_preview_token text default null,p_idempotency_key uuid default null)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $fn$
declare imp public.sfmc_package_imports; m public.sfmc_package_messages; a public.activities;
 t public.communication_templates; slot public.communication_slots; d jsonb; tid text;
 actid uuid; content_id uuid; current_id uuid; chash text; runid uuid; prior public.sfmc_package_application_runs;
 before_json jsonb; after_json jsonb; result jsonb; token_data jsonb := '[]'; token text;
 ids uuid[] := '{}'; message_ids uuid[] := '{}'; new_tids text[] := '{}'; slot_keys text[] := '{}';
 new_content_keys text[] := '{}'; decision_count integer := 0; start_at timestamptz; end_at timestamptz;
 content_payload jsonb;
begin
 if auth.uid() is null then raise exception 'Sessão autenticada necessária'; end if;
 if p_apply and p_idempotency_key is null then raise exception 'Chave da aplicação necessária'; end if;
 select * into imp from public.sfmc_package_imports where id=p_import_id for update;
 if not found then raise exception 'Importação não encontrada'; end if;
 if p_apply then
  select * into prior from public.sfmc_package_application_runs where idempotency_key=p_idempotency_key;
  if found then
   if prior.import_id<>p_import_id or prior.actor<>auth.uid() or prior.decisions<>p_decisions then raise exception 'Chave da aplicação já usada por outra revisão'; end if;
   return prior.summary;
  end if;
 end if;
 if jsonb_typeof(p_decisions) is distinct from 'array' or jsonb_array_length(p_decisions) not between 1 and 3000 then raise exception 'Selecione mensagens para aplicar'; end if;
 if exists(select 1 from jsonb_array_elements(p_decisions) x where coalesce((x->>'set_current')::boolean,false)
 group by x->>'template_id' having count(*)>1) then raise exception 'Selecione uma única mensagem como versão atual por template'; end if;
 if exists(select 1 from jsonb_array_elements(p_decisions) proposed(value)
 join public.sfmc_package_messages source_message on source_message.id=(proposed.value->>'message_id')::uuid
 group by proposed.value->>'template_id' having count(distinct source_message.payload->'content'->>'channel')>1)
 then raise exception 'Um template não pode receber canais diferentes no mesmo lote'; end if;
 -- Stable locks serialize template-current choices across independent imports.
 perform pg_advisory_xact_lock(hashtextextended(x,0)) from
 (select distinct value->>'template_id' x from jsonb_array_elements(p_decisions) order by 1)keys;
 for d in select value from jsonb_array_elements(p_decisions) order by value->>'message_id' loop
  select * into m from public.sfmc_package_messages where id=(d->>'message_id')::uuid and import_id=p_import_id for update;
  if not found or m.decision<>'pending' or (m.payload->>'is_optout')::boolean then raise exception 'Mensagem indisponível para revisão'; end if;
  if m.id=any(message_ids) then raise exception 'Mensagem repetida no lote'; end if;
  message_ids := array_append(message_ids,m.id);
  tid := d->>'template_id';
  if tid is null or tid !~ '^[A-Za-z0-9][A-Za-z0-9_-]{2,79}$' then raise exception 'Template ID inválido'; end if;
  select * into t from public.communication_templates where template_id=tid for update;
  if found and t.channel<>m.payload->'content'->>'channel' then raise exception 'Canal do template incompatível'; end if;
  if not found and not tid=any(new_tids) then new_tids:=array_append(new_tids,tid); end if;
  if jsonb_typeof(d->'activity_ids') is distinct from 'array' then raise exception 'Seleção de disparos inválida'; end if;
  if jsonb_array_length(d->'activity_ids')>0 then
   if coalesce(btrim(d->>'evidence'),'')='' or coalesce(d->>'start_date','')='' or coalesce(d->>'end_date','')='' then raise exception 'Confirme período e evidência antes de vincular disparos'; end if;
   if (d->>'end_date')::date<(d->>'start_date')::date then raise exception 'Período inválido'; end if;
   start_at := (d->>'start_date')::date::timestamp at time zone 'America/Sao_Paulo';
   end_at := ((d->>'end_date')::date+1)::timestamp at time zone 'America/Sao_Paulo';
   for actid in select value::text::uuid from jsonb_array_elements_text(d->'activity_ids') loop
    if actid=any(ids) then raise exception 'Disparo repetido em duas mensagens do lote'; end if;
    select * into a from public.activities where id=actid for update;
    if not found or btrim(a."Activity name / Taxonomia") is distinct from (m.payload->>'activity_name')
    or replace(upper(btrim(a.jornada)),'JOR_AQUISICAO_','JOR_AQS_') is distinct from replace(upper(btrim(m.payload->>'journey_name')),'JOR_AQUISICAO_','JOR_AQS_')
    or a."Canal" is distinct from (m.payload->'content'->>'channel') or a."Data de Disparo" is null
    or a."Data de Disparo"<start_at or a."Data de Disparo">=end_at then raise exception 'Disparo fora da jornada, canal ou período confirmado'; end if;
    if a.template_id is not null and a.template_id<>tid then raise exception 'Disparo já vinculado a outro template'; end if;
    ids := array_append(ids,actid);
    token_data:=token_data||jsonb_build_array(jsonb_build_object('activity',a.id,'template',a.template_id,'updated',a.updated_at));
   end loop;
  end if;
  select id into current_id from public.communication_template_contents where template_id=tid and is_current for update;
  if coalesce((d->>'set_current')::boolean,false) and current_id is distinct from (d->>'expected_current_id')::uuid then raise exception 'Versão atual mudou; revise novamente'; end if;
  content_payload := m.payload->'content';
  chash:=encode(sha256(convert_to(content_payload::text,'UTF8')),'hex');
  if not exists(select 1 from public.communication_template_contents where template_id=tid and content_hash=chash) and not (tid||':'||chash)=any(new_content_keys) then
   new_content_keys:=array_append(new_content_keys,tid||':'||chash);
  end if;
  select * into slot from public.communication_slots where journey_name=m.payload->>'journey_name'
  and activity_name=m.payload->>'activity_name' and channel=m.payload->'content'->>'channel' for update;
  -- Existing slots and manual moment metadata are never overwritten by ingestion.
  if not found and not concat(m.payload->>'journey_name','|',m.payload->>'activity_name','|',m.payload->'content'->>'channel')=any(slot_keys) then slot_keys:=array_append(slot_keys,concat(m.payload->>'journey_name','|',m.payload->>'activity_name','|',m.payload->'content'->>'channel')); end if;
  token_data:=token_data||jsonb_build_array(jsonb_build_object('message',m.id,'template',tid,'template_updated',t.updated_at,'current',current_id,'slot',slot.id));
  decision_count:=decision_count+1;
 end loop;
 token:=encode(sha256(convert_to(jsonb_build_object('decisions',p_decisions,'state',token_data)::text,'UTF8')),'hex');
 result:=jsonb_build_object('messages',decision_count,'activities',coalesce((select count(*) from public.activities where id=any(ids) and template_id is null),0),
 'new_templates',cardinality(new_tids),'contents',cardinality(new_content_keys),'new_slots',cardinality(slot_keys),'preview_token',token);
 if not p_apply then return result; end if;
 if p_preview_token is distinct from token then raise exception 'Revisão desatualizada; simule novamente'; end if;
 insert into public.sfmc_package_application_runs(import_id,idempotency_key,actor,decisions,summary)
 values(p_import_id,p_idempotency_key,auth.uid(),p_decisions,result) returning id into runid;
 for d in select value from jsonb_array_elements(p_decisions) order by value->>'message_id' loop
  select * into m from public.sfmc_package_messages where id=(d->>'message_id')::uuid;
  tid:=d->>'template_id';
  insert into public.communication_templates(template_id,title,channel,status,source_system,metadata)
  values(tid,coalesce(m.payload->'content'->>'meta_template_name',tid),m.payload->'content'->>'channel','draft','sfmc_package',
  jsonb_build_object('source','sfmc_package','source_scope',imp.source_scope,'resolved_context',
 (select resolved_context from public.communications_reconciliation_proposals where message_id=m.id)))
  on conflict(template_id) do nothing;
  content_payload:=m.payload->'content'; chash:=encode(sha256(convert_to(content_payload::text,'UTF8')),'hex');
  insert into public.communication_template_contents(template_id,content_hash,payload) values(tid,chash,content_payload)
  on conflict(template_id,content_hash) do nothing;
  select id into content_id from public.communication_template_contents where template_id=tid and content_hash=chash;
  insert into public.communication_template_content_observations(message_id,content_id) values(m.id,content_id) on conflict(message_id) do nothing;
  if coalesce((d->>'set_current')::boolean,false) then
   select id into current_id from public.communication_template_contents where template_id=tid and is_current;
   update public.communication_template_contents set is_current=false where template_id=tid and is_current;
   update public.communication_template_contents set is_current=true where id=content_id;
   insert into public.sfmc_package_application_changes(run_id,entity,entity_id,before_state,after_state)
   values(runid,'current_content',tid,jsonb_build_object('id',current_id),jsonb_build_object('id',content_id));
  end if;
  for actid in select value::text::uuid from jsonb_array_elements_text(d->'activity_ids') loop
   select to_jsonb(a0) into before_json from public.activities a0 where id=actid;
   update public.activities set template_id=tid,updated_at=now() where id=actid and template_id is null returning to_jsonb(activities) into after_json;
   if found then insert into public.sfmc_package_application_changes(run_id,entity,entity_id,before_state,after_state) values(runid,'activity',actid::text,before_json,after_json); end if;
  end loop;
  insert into public.communication_slots(journey_name,activity_name,channel,current_template_id,source,coverage_status,metadata)
  select m.payload->>'journey_name',m.payload->>'activity_name',m.payload->'content'->>'channel',tid,'import',
  case when ct.original_path is not null or exists(select 1 from public.communication_template_contents where template_id=tid and is_current and nullif(payload->>'body_text','') is not null) then 'ready' else 'partial' end,
  jsonb_build_object('sfmc_package',jsonb_build_object('message_id',m.id,'journey_version',m.payload->'journey_version','paths',m.payload->'paths','af_sub2',m.payload->'utm'->'af_sub2','configured_use_only',true))
  from public.communication_templates ct where ct.template_id=tid
  on conflict(journey_name,activity_name,channel) do nothing
  returning to_jsonb(communication_slots) into after_json;
  if found then insert into public.sfmc_package_application_changes(run_id,entity,entity_id,before_state,after_state)values(runid,'slot',after_json->>'id',null,after_json); end if;
  update public.sfmc_package_messages set decision='applied',decided_by=auth.uid(),decided_at=now() where id=m.id;
 end loop;
 update public.sfmc_package_imports set status=case when exists(select 1 from public.sfmc_package_messages where import_id=p_import_id and decision='pending' and not(payload->>'is_optout')::boolean) then 'partially_applied' else 'applied' end where id=p_import_id;
 return result||jsonb_build_object('run_id',runid);
end $fn$;


-- Persist deterministic initial proposals at ingestion; full IA analyses can subsequently publish a new revision.
create or replace function gaas_sfmc_private.seed_proposals(p_import_id uuid)
returns void language plpgsql security definer set search_path=pg_catalog,public as $fn$
declare runid uuid; propid uuid; msg public.sfmc_package_messages; observed text; proposed text; matched text;
 family text; partner text; source_text text; branch_text text; conflicts jsonb; reasons jsonb; choices jsonb; count_matches integer;
begin
 if not exists(select 1 from public.sfmc_package_imports where id=p_import_id) then raise exception 'Importação não encontrada'; end if;
 if not exists(select 1 from public.sfmc_package_messages source_message where source_message.import_id=p_import_id
 and not exists(select 1 from public.communications_reconciliation_proposals proposal where proposal.message_id=source_message.id)) then return; end if;
 insert into public.communications_analysis_runs(import_id,producer,source,rule_version,source_refs,status)
 select id,uploaded_by,'deterministic_governance','governance-v2.1',jsonb_build_object('package_sha256',package_sha256,'parser_version',parser_version),'complete'
 from public.sfmc_package_imports where id=p_import_id returning id into runid;
 for msg in select * from public.sfmc_package_messages where import_id=p_import_id order by occurrence_key loop
 if exists(select 1 from public.communications_reconciliation_proposals where message_id=msg.id) then continue; end if;
 observed:=nullif(msg.payload->'utm'->>'af_sub3',''); matched:=null; proposed:=''; conflicts:='[]'; reasons:='[]'; choices:='[]';
 source_text:=lower(msg.payload->>'activity_name');
 select lower(coalesce(string_agg(path->'labels'->>-1,' | '),'')) into branch_text from jsonb_array_elements(msg.payload->'paths') path;
 -- Activity identifies its branch; shared parent split labels may mention multiple partners.
 partner:=case when source_text ~ '(serasa|srasa|srsa|sersa|ecred)' then 'Serasa'
 when source_text ~ 'institucional' then 'Institucional'
 when branch_text ~ '(serasa|ecred)' and branch_text !~ 'institucional' then 'Serasa'
 when branch_text ~ 'institucional' and branch_text !~ '(serasa|ecred)' then 'Institucional' else null end;
 family:=case when source_text ~ '(carrinho21|car21)' then 'car21' when source_text ~ '(sabado|carsab)' then 'carsab'
 when lower(msg.payload->>'journey_name') ~ '(carrinho21|car21)' or (source_text ~ '(^|_)car(_|$)' and lower(msg.payload->>'journey_name') ~ '(^|_)21d(_|$)') then 'car21' else null end;
 select count(*),min(template_id),coalesce(jsonb_agg(template_id order by template_id),'[]') into count_matches,matched,choices
 from public.communication_templates where channel=msg.payload->'content'->>'channel'
 and ((observed is not null and template_id=observed) or (observed is null and title=msg.payload->'content'->>'meta_template_name'));
 if observed is not null then proposed:=observed; reasons:=jsonb_build_array('ID observado em af_sub3');
 elsif count_matches=1 then proposed:=matched; reasons:=jsonb_build_array('Título Meta único no mesmo canal','Sufixo preservado do cadastro candidato; não comprova a ordem de envio');
 else conflicts:=conflicts||jsonb_build_array(case when count_matches>1 then 'Título possui vários candidatos' else 'Identidade sem candidato comprovado' end); end if;
 if family is not null and proposed ~ '^b2c_(car21|carsab)_' then
 if split_part(proposed,'_',2)<>family then
 conflicts:=conflicts||jsonb_build_array('Família da peça configurada diverge do contexto da jornada');
 proposed:=regexp_replace(proposed,'^b2c_(car21|carsab)_','b2c_'||family||'_'); end if;
 if partner='Serasa' and proposed ~ '_inst_' then
 conflicts:=conflicts||jsonb_build_array('Peça institucional configurada no ramo Serasa'); proposed:=replace(proposed,'_inst_','_srsa_');
 elsif partner='Institucional' and proposed ~ '_(srsa|srasa|sersa|serasa)_' then
 conflicts:=conflicts||jsonb_build_array('Peça Serasa configurada no ramo institucional'); proposed:=regexp_replace(proposed,'_(srsa|srasa|sersa|serasa)_','_inst_'); end if;
 end if;
 if family is not null and lower(coalesce(msg.payload->'content'->>'meta_template_name','')) ~ 'sabado' and family='car21'
 and not (conflicts @> '["Família da peça configurada diverge do contexto da jornada"]') then
 conflicts:=conflicts||jsonb_build_array('Conteúdo de sábado configurado no ramo 21D'); end if;
 if observed is not null and observed !~ '^[A-Za-z0-9][A-Za-z0-9_-]{2,79}$' then conflicts:=conflicts||jsonb_build_array('ID observado inválido'); end if;
 if observed is not null and exists(select 1 from public.communication_templates where template_id=observed and channel<>msg.payload->'content'->>'channel') then
 conflicts:=conflicts||jsonb_build_array('Canal incompatível com o ID observado'); end if;
 insert into public.communications_reconciliation_proposals(message_id,analysis_id,observed_template_id,proposed_template_id,resolved_context,reasons,conflicts,alternatives,review,status)
 values(msg.id,runid,observed,proposed,jsonb_build_object('partner',partner,'family',family,'segment',case when family is not null then 'Abandonados' else msg.payload->'utm'->>'af_sub1' end,
 'subgroup',case when family='car21' then '21D' when family='carsab' then 'Sábado' else null end,
 'channel',msg.payload->'content'->>'channel','tracking_moment',msg.payload->'utm'->>'af_sub2','order','Não comprovada; consultar ramo e esperas',
 'evidence',jsonb_build_object('activity_name',msg.payload->>'activity_name','journey_name',msg.payload->>'journey_name')),
 reasons,conflicts,choices,jsonb_build_object('message_id',msg.id,'template_id',proposed,'activity_ids','[]'::jsonb,'start_date',null,'end_date',null,'evidence','','set_current',false,'expected_current_id',null),
 case when (msg.payload->>'is_optout')::boolean then 'technical' when msg.decision='applied' then 'applied' when msg.decision='rejected' then 'rejected'
 when proposed<>'' and jsonb_array_length(conflicts)=0 and observed is not null then 'ready' else 'review' end) returning id into propid;
 insert into public.communications_proposal_events(proposal_id,actor,action,snapshot)
 select propid,producer,'analysis_received',jsonb_build_object('analysis_id',runid,'source',source,'rule_version',rule_version,'source_refs',source_refs,'proposed_template_id',proposed,'conflicts',conflicts) from public.communications_analysis_runs where id=runid;
 end loop;
end $fn$;
create or replace function gaas_sfmc_private.after_message_insert()
returns trigger language plpgsql security definer set search_path=pg_catalog,public as $fn$
begin perform gaas_sfmc_private.seed_proposals(new.import_id); return new; end $fn$;
-- Deferred: every occurrence from the package is available before seeding.
create constraint trigger sfmc_seed_proposals after insert on public.sfmc_package_messages
 deferrable initially deferred for each row execute function gaas_sfmc_private.after_message_insert();

create or replace function gaas_sfmc_private.save_proposal(p_id uuid,p_revision integer,p_review jsonb,p_resolved boolean,p_note text)
returns void language plpgsql security definer set search_path=pg_catalog,public as $fn$
declare prop public.communications_reconciliation_proposals; msg public.sfmc_package_messages;
begin
 if auth.uid() is null then raise exception 'Sessão autenticada necessária'; end if;
 select * into prop from public.communications_reconciliation_proposals where id=p_id for update;
 if not found or prop.revision<>p_revision then raise exception 'Proposta mudou; atualize a fila'; end if;
 select * into msg from public.sfmc_package_messages where id=prop.message_id for update;
 if msg.decision<>'pending' or prop.status='technical' then raise exception 'Proposta indisponível'; end if;
 if p_review->>'message_id' is distinct from prop.message_id::text or coalesce(p_review->>'template_id','') !~ '^[A-Za-z0-9][A-Za-z0-9_-]{2,79}$'
 or jsonb_typeof(p_review->'activity_ids') is distinct from 'array' or jsonb_typeof(p_review->'set_current') is distinct from 'boolean'
 or octet_length(p_review::text)>100000 then raise exception 'Revisão inválida'; end if;
 if p_resolved and length(btrim(coalesce(p_note,'')))<3 then raise exception 'Registre o motivo da revisão'; end if;
 if exists(select 1 from public.communication_templates where template_id=p_review->>'template_id' and channel<>msg.payload->'content'->>'channel') then raise exception 'Canal incompatível'; end if;
 update public.communications_reconciliation_proposals set proposed_template_id=p_review->>'template_id',review=p_review,
 revision=revision+1,status=case when p_resolved then 'ready' else 'review' end, reviewed_by=auth.uid(),reviewed_at=now(),updated_at=now() where id=p_id;
 insert into public.communications_proposal_events(proposal_id,actor,action,snapshot)
 values(p_id,auth.uid(),'edited',jsonb_build_object('before',to_jsonb(prop),'review',p_review,'resolved',p_resolved,'note',p_note));
end $fn$;

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

create or replace function gaas_sfmc_private.sync_proposal_decision()
returns trigger language plpgsql security definer set search_path=pg_catalog,public as $fn$
begin
 if new.decision<>old.decision then
 update public.communications_reconciliation_proposals set status=new.decision,revision=revision+1,
 reviewed_by=new.decided_by,reviewed_at=new.decided_at,updated_at=now() where message_id=new.id;
 end if; return new;
end $fn$;
create trigger sfmc_sync_proposal after update of decision on public.sfmc_package_messages
 for each row execute function gaas_sfmc_private.sync_proposal_decision();

-- IA/agent entry point: validated structured proposals, never arbitrary activities updates.
create or replace function gaas_sfmc_private.publish_analysis(p_import_id uuid,p_analysis jsonb)
returns uuid language plpgsql security definer set search_path=pg_catalog,public as $fn$
declare runid uuid; item jsonb; msg public.sfmc_package_messages; prop public.communications_reconciliation_proposals;
begin
 if auth.uid() is null then raise exception 'Sessão autenticada necessária'; end if;
 perform 1 from public.sfmc_package_imports where id=p_import_id for update;
 if not found then raise exception 'Importação não encontrada'; end if;
 if jsonb_typeof(p_analysis->'proposals') is distinct from 'array' or jsonb_array_length(p_analysis->'proposals') not between 1 and 3000
 or octet_length(p_analysis::text)>20000000 or coalesce(p_analysis->>'rule_version','')='' or jsonb_typeof(p_analysis->'source_refs') is distinct from 'object'
 then raise exception 'Análise inválida'; end if;
 if exists(select 1 from jsonb_array_elements(p_analysis->'proposals') x group by x->>'message_id' having count(*)>1) then raise exception 'Mensagem repetida'; end if;
 insert into public.communications_analysis_runs(import_id,producer,source,rule_version,source_refs,status)
 values(p_import_id,auth.uid(),'agent_analysis',p_analysis->>'rule_version',(p_analysis->'source_refs')||jsonb_build_object('analyzed_messages',jsonb_array_length(p_analysis->'proposals')),'complete') returning id into runid;
 for item in select value from jsonb_array_elements(p_analysis->'proposals') loop
 select * into msg from public.sfmc_package_messages where import_id=p_import_id and id=(item->>'message_id')::uuid for update;
 if not found or msg.decision<>'pending' or (msg.payload->>'is_optout')::boolean then raise exception 'Mensagem indisponível'; end if;
 select * into prop from public.communications_reconciliation_proposals where message_id=msg.id for update;
 if not found or prop.reviewed_by is not null then raise exception 'Revisão humana existente; publique em nova origem sem sobrescrever'; end if;
 if coalesce(item->>'proposed_template_id','') !~ '^[A-Za-z0-9][A-Za-z0-9_-]{2,79}$'
 or jsonb_typeof(item->'resolved_context') is distinct from 'object' or jsonb_typeof(item->'reasons') is distinct from 'array'
 or jsonb_typeof(item->'conflicts') is distinct from 'array' or jsonb_typeof(item->'alternatives') is distinct from 'array'
 then raise exception 'Proposta inválida'; end if;
 if item->'resolved_context'->>'channel' is distinct from msg.payload->'content'->>'channel'
 or exists(select 1 from jsonb_array_elements(item->'reasons') entry where jsonb_typeof(entry)<>'string')
 or exists(select 1 from jsonb_array_elements(item->'conflicts') entry where jsonb_typeof(entry)<>'string')
 or exists(select 1 from jsonb_array_elements(item->'alternatives') entry where jsonb_typeof(entry)<>'string')
 then raise exception 'Dimensões ou evidências inválidas'; end if;
 update public.communications_reconciliation_proposals set analysis_id=runid,revision=revision+1,proposed_template_id=item->>'proposed_template_id',
 resolved_context=item->'resolved_context',reasons=item->'reasons',conflicts=item->'conflicts',alternatives=item->'alternatives',
 review=review||jsonb_build_object('template_id',item->>'proposed_template_id'),
 status='review',updated_at=now() where id=prop.id;
 -- Agent proposals require human review; no automatic current version or historical links.
 insert into public.communications_proposal_events(proposal_id,actor,action,snapshot) values(prop.id,auth.uid(),'analysis_published',jsonb_build_object('before',to_jsonb(prop),'proposal',item,'analysis_id',runid));
 end loop; return runid;
end $fn$;
create or replace function public.save_communication_proposal(p_id uuid,p_revision integer,p_review jsonb,p_resolved boolean,p_note text)
returns void language sql security invoker set search_path=pg_catalog as $fn$ select gaas_sfmc_private.save_proposal(p_id,p_revision,p_review,p_resolved,p_note) $fn$;
create or replace function public.review_communication_proposals(p_selection jsonb,p_action text,p_token text default null,p_key uuid default null,p_note text default '')
returns jsonb language sql security invoker set search_path=pg_catalog as $fn$ select gaas_sfmc_private.review_proposals(p_selection,p_action,p_token,p_key,p_note) $fn$;
create or replace function public.publish_communications_analysis(p_import_id uuid,p_analysis jsonb)
returns uuid language sql security invoker set search_path=pg_catalog as $fn$ select gaas_sfmc_private.publish_analysis(p_import_id,p_analysis) $fn$;
revoke all on function gaas_sfmc_private.seed_proposals(uuid),gaas_sfmc_private.after_message_insert(),gaas_sfmc_private.sync_proposal_decision() from public,anon,authenticated;
revoke all on function gaas_sfmc_private.save_proposal(uuid,integer,jsonb,boolean,text),gaas_sfmc_private.review_proposals(jsonb,text,text,uuid,text),gaas_sfmc_private.publish_analysis(uuid,jsonb),
 public.save_communication_proposal(uuid,integer,jsonb,boolean,text),public.review_communication_proposals(jsonb,text,text,uuid,text),public.publish_communications_analysis(uuid,jsonb) from public,anon;
grant execute on function gaas_sfmc_private.save_proposal(uuid,integer,jsonb,boolean,text),gaas_sfmc_private.review_proposals(jsonb,text,text,uuid,text),gaas_sfmc_private.publish_analysis(uuid,jsonb),
 public.save_communication_proposal(uuid,integer,jsonb,boolean,text),public.review_communication_proposals(jsonb,text,text,uuid,text),public.publish_communications_analysis(uuid,jsonb) to authenticated;
-- Existing pack becomes visible without approving or changing operational identities/content.
do $do$ declare imp record; begin for imp in select id from public.sfmc_package_imports loop perform gaas_sfmc_private.seed_proposals(imp.id); end loop; end $do$;

create or replace function gaas_sfmc_private.reject(p_import_id uuid,p_message_ids uuid[])
returns void language plpgsql security definer set search_path=pg_catalog,public as $fn$
begin
 if auth.uid() is null or not exists(select 1 from public.sfmc_package_imports where id=p_import_id) then raise exception 'Importação autenticada necessária'; end if;
 update public.sfmc_package_messages set decision='rejected',decided_by=auth.uid(),decided_at=now()
 where import_id=p_import_id and id=any(p_message_ids) and decision='pending';
end $fn$;
-- Exact normalized body reuse across the complete approved content/activities universe.
-- A template link is contextual evidence, not certification that this body was historically sent.
create or replace function gaas_sfmc_private.proposal_reuse(p_id uuid)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $fn$
declare body text; context jsonb; result jsonb;
begin
 if auth.uid() is null then raise exception 'Sessão autenticada necessária'; end if;
 select m.payload->'content'->>'body_text',p.resolved_context into body,context
 from public.communications_reconciliation_proposals p join public.sfmc_package_messages m on m.id=p.message_id where p.id=p_id;
 if not found then raise exception 'Proposta não encontrada'; end if;
 select jsonb_build_object('coverage',jsonb_build_object('approved_versions',(select count(*) from public.communication_template_contents),
 'linked_activities',(select count(*) from public.activities where template_id is not null)),
 'matches',coalesce(jsonb_agg(x),'[]'::jsonb)) into result from (
 select c.template_id,c.id content_id,c.is_current,count(a.id) linked_activities,
 min(a."Data de Disparo") first_dispatch,max(a."Data de Disparo") last_dispatch,
 count(a.id) filter(where lower(coalesce(a."Parceiro",''))=lower(coalesce(context->>'partner',''))
 and lower(coalesce(a."Segmento",''))=lower(coalesce(context->>'segment',''))
 and coalesce(context->>'partner','')<>'' and coalesce(context->>'segment','')<>'') same_context_activities
 from public.communication_template_contents c left join public.activities a on a.template_id=c.template_id
 where nullif(btrim(body),'') is not null
 and btrim(regexp_replace(replace(coalesce(c.payload->>'body_text',''),E'\\n',' '),'[[:space:]]+',' ','g'))
 = btrim(regexp_replace(replace(body,E'\\n',' '),'[[:space:]]+',' ','g'))
 group by c.template_id,c.id,c.is_current order by c.template_id,c.id
 )x;
 return result;
end $fn$;
create or replace function public.communication_proposal_reuse(p_id uuid)
returns jsonb language sql security invoker set search_path=pg_catalog as $fn$ select gaas_sfmc_private.proposal_reuse(p_id) $fn$;
revoke all on function gaas_sfmc_private.proposal_reuse(uuid),public.communication_proposal_reuse(uuid) from public,anon;
grant execute on function gaas_sfmc_private.proposal_reuse(uuid),public.communication_proposal_reuse(uuid) to authenticated;
