-- Package Manager ingestion: additive, scoped, reviewed writes only.
create schema if not exists gaas_sfmc_private;
revoke all on schema gaas_sfmc_private from public, anon;
grant usage on schema gaas_sfmc_private to authenticated;

create table if not exists public.sfmc_package_imports (
 id uuid primary key default gen_random_uuid(),
 package_sha256 text not null check(package_sha256 ~ '^[a-f0-9]{64}$'),
 source_scope text not null check(length(btrim(source_scope)) between 1 and 200),
 file_name text not null, package_name text not null, package_version integer not null,
 parser_version text not null, journeys_count integer not null, messages_count integer not null,
 uploaded_by uuid not null default auth.uid(), uploaded_at timestamptz not null default now(),
 status text not null default 'in_review' check(status in('in_review','partially_applied','applied')),
 unique(package_sha256, source_scope, uploaded_by)
);
create table if not exists public.sfmc_package_messages (
 id uuid primary key default gen_random_uuid(),
 import_id uuid not null references public.sfmc_package_imports on delete restrict,
 occurrence_key text not null, payload jsonb not null,
 decision text not null default 'pending' check(decision in('pending','rejected','applied')),
 decided_by uuid, decided_at timestamptz,
 unique(import_id, occurrence_key)
);
create index if not exists sfmc_package_messages_import on public.sfmc_package_messages(import_id,decision);
create table if not exists public.communication_template_contents (
 id uuid primary key default gen_random_uuid(),
 template_id text not null references public.communication_templates(template_id) on update cascade on delete restrict,
 content_hash text not null, payload jsonb not null,
 first_seen_at timestamptz not null default now(),
 is_current boolean not null default false,
 unique(template_id,content_hash)
);
create unique index if not exists communication_template_contents_one_current on public.communication_template_contents(template_id) where is_current;
create table if not exists public.communication_template_content_observations (
 message_id uuid primary key references public.sfmc_package_messages on delete restrict,
 content_id uuid not null references public.communication_template_contents on delete restrict,
 observed_at timestamptz not null default now()
);
create index if not exists communication_template_content_observations_content on public.communication_template_content_observations(content_id);
create table if not exists public.sfmc_package_application_runs (
 id uuid primary key default gen_random_uuid(),
 import_id uuid not null references public.sfmc_package_imports on delete restrict,
 idempotency_key uuid not null unique, actor uuid not null,
 decisions jsonb not null, summary jsonb not null, created_at timestamptz not null default now()
);
create table if not exists public.sfmc_package_application_changes (
 id bigint generated always as identity primary key,
 run_id uuid not null references public.sfmc_package_application_runs on delete restrict,
 entity text not null, entity_id text not null,
 before_state jsonb, after_state jsonb not null
);
create index if not exists sfmc_package_application_changes_run on public.sfmc_package_application_changes(run_id);

do $do$
declare t text;
begin
 foreach t in array array['sfmc_package_imports','sfmc_package_messages','communication_template_contents','communication_template_content_observations','sfmc_package_application_runs','sfmc_package_application_changes'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke all on public.%I from anon, authenticated',t);
  execute format('grant select on public.%I to authenticated',t);
  execute format('drop policy if exists sfmc_authenticated_read on public.%I',t);
  execute format('create policy sfmc_authenticated_read on public.%I for select to authenticated using ((select auth.uid()) is not null)',t);
 end loop;
end $do$;

create or replace function gaas_sfmc_private.stage(p_package jsonb,p_scope text)
returns uuid language plpgsql security definer set search_path=pg_catalog,public as $fn$
declare result uuid; item jsonb; messages jsonb := p_package->'messages'; inserted integer;
begin
 if auth.uid() is null then raise exception 'Sessão autenticada necessária'; end if;
 if btrim(coalesce(p_scope,''))='' or length(p_scope)>200 then raise exception 'Informe a BU/conta de origem'; end if;
 if jsonb_typeof(messages) is distinct from 'array' or jsonb_array_length(messages) not between 1 and 3000
 or octet_length(p_package::text)>20000000 then raise exception 'Pacote vazio ou acima do limite'; end if;
 insert into public.sfmc_package_imports(package_sha256,source_scope,file_name,package_name,package_version,parser_version,journeys_count,messages_count)
 values(p_package->>'package_sha256',btrim(p_scope),p_package->>'file_name',p_package->>'package_name',
 (p_package->>'package_version')::integer,p_package->>'parser_version',(p_package->>'journeys_count')::integer,jsonb_array_length(messages))
 on conflict(package_sha256,source_scope,uploaded_by) do nothing returning id into result;
 if result is null then
  select id into result from public.sfmc_package_imports where package_sha256=p_package->>'package_sha256' and source_scope=btrim(p_scope) and uploaded_by=auth.uid();
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
 get diagnostics inserted=row_count;
 return result;
end $fn$;

create or replace function gaas_sfmc_private.candidates(p_import_id uuid)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $fn$
declare result jsonb;
begin
 if auth.uid() is null then raise exception 'Sessão autenticada necessária'; end if;
 if not exists(select 1 from public.sfmc_package_imports where id=p_import_id) then raise exception 'Importação não encontrada'; end if;
 select coalesce(jsonb_agg(x),'[]'::jsonb) into result from(
 select distinct a.id, btrim(a."Activity name / Taxonomia") activity_name, a.jornada journey_name,a."Canal" channel,
 a."Data de Disparo" dispatch_date,a.template_id,
 exists(select 1 from public.sfmc_package_messages m where m.import_id=p_import_id
 and m.payload->>'activity_name'=btrim(a."Activity name / Taxonomia")
 and replace(upper(btrim(m.payload->>'journey_name')),'JOR_AQUISICAO_','JOR_AQS_')=replace(upper(btrim(a.jornada)),'JOR_AQUISICAO_','JOR_AQS_')
 and m.payload->'content'->>'channel'=a."Canal") exact_journey
 from public.activities a where exists(select 1 from public.sfmc_package_messages m where m.import_id=p_import_id and m.payload->>'activity_name'=btrim(a."Activity name / Taxonomia") and not (m.payload->>'is_optout')::boolean)
 order by a.id
 )x;
 return result;
end $fn$;

-- A private SECURITY DEFINER gateway is intentional: authenticated has SELECT only
-- on staging/content/audit tables. Every write validates the reviewed payload and actor.
-- Public wrappers are SECURITY INVOKER. No service credentials are sent to clients.
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
 if not found or imp.uploaded_by<>auth.uid() then raise exception 'Revise uma importação criada pela sua sessão'; end if;
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
  jsonb_build_object('source','sfmc_package','source_scope',imp.source_scope))
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

create or replace function gaas_sfmc_private.reject(p_import_id uuid,p_message_ids uuid[])
returns void language plpgsql security definer set search_path=pg_catalog,public as $fn$
begin
 if auth.uid() is null or not exists(select 1 from public.sfmc_package_imports where id=p_import_id and uploaded_by=auth.uid()) then raise exception 'Importação da sua sessão necessária'; end if;
 update public.sfmc_package_messages set decision='rejected',decided_by=auth.uid(),decided_at=now()
 where import_id=p_import_id and id=any(p_message_ids) and decision='pending';
end $fn$;

create or replace function public.stage_sfmc_package(p_package jsonb,p_scope text)
returns uuid language sql security invoker set search_path=pg_catalog as $fn$ select gaas_sfmc_private.stage(p_package,p_scope) $fn$;
create or replace function public.sfmc_package_candidates(p_import_id uuid)
returns jsonb language sql security invoker set search_path=pg_catalog as $fn$ select gaas_sfmc_private.candidates(p_import_id) $fn$;
create or replace function public.preview_sfmc_package_apply(p_import_id uuid,p_decisions jsonb)
returns jsonb language sql security invoker set search_path=pg_catalog as $fn$ select gaas_sfmc_private.process(p_import_id,p_decisions,false) $fn$;
create or replace function public.apply_sfmc_package_import(p_import_id uuid,p_decisions jsonb,p_preview_token text,p_idempotency_key uuid)
returns jsonb language sql security invoker set search_path=pg_catalog as $fn$ select gaas_sfmc_private.process(p_import_id,p_decisions,true,p_preview_token,p_idempotency_key) $fn$;
create or replace function public.reject_sfmc_package_messages(p_import_id uuid,p_message_ids uuid[])
returns void language sql security invoker set search_path=pg_catalog as $fn$ select gaas_sfmc_private.reject(p_import_id,p_message_ids) $fn$;

revoke all on all functions in schema gaas_sfmc_private from public,anon;
grant execute on all functions in schema gaas_sfmc_private to authenticated;
revoke all on function public.stage_sfmc_package(jsonb,text), public.sfmc_package_candidates(uuid),
 public.preview_sfmc_package_apply(uuid,jsonb),public.apply_sfmc_package_import(uuid,jsonb,text,uuid),
 public.reject_sfmc_package_messages(uuid,uuid[]) from public,anon;
grant execute on function public.stage_sfmc_package(jsonb,text), public.sfmc_package_candidates(uuid),
 public.preview_sfmc_package_apply(uuid,jsonb),public.apply_sfmc_package_import(uuid,jsonb,text,uuid),
 public.reject_sfmc_package_messages(uuid,uuid[]) to authenticated;

create or replace function gaas_sfmc_private.choose_current(p_content_id uuid,p_expected_current_id uuid)
returns void language plpgsql security definer set search_path=pg_catalog,public as $fn$
declare c public.communication_template_contents; prior uuid; source_import uuid; runid uuid;
begin
 if auth.uid() is null then raise exception 'Sessão autenticada necessária'; end if;
 select * into c from public.communication_template_contents where id=p_content_id;
 if not found then raise exception 'Conteúdo não encontrado'; end if;
 perform pg_advisory_xact_lock(hashtextextended(c.template_id,0));
 select id into prior from public.communication_template_contents where template_id=c.template_id and is_current for update;
 if prior is distinct from p_expected_current_id then raise exception 'Versão atual mudou; atualize a biblioteca'; end if;
 select m.import_id into source_import from public.communication_template_content_observations o
 join public.sfmc_package_messages m on m.id=o.message_id where o.content_id=c.id order by o.observed_at limit 1;
 if source_import is null then raise exception 'Conteúdo sem observação de origem'; end if;
 insert into public.sfmc_package_application_runs(import_id,idempotency_key,actor,decisions,summary)
 values(source_import,gen_random_uuid(),auth.uid(),jsonb_build_object('action','choose_current','content_id',c.id),jsonb_build_object('current_content',c.id)) returning id into runid;
 update public.communication_template_contents set is_current=false where template_id=c.template_id and is_current;
 update public.communication_template_contents set is_current=true where id=c.id;
 insert into public.sfmc_package_application_changes(run_id,entity,entity_id,before_state,after_state)
 values(runid,'current_content',c.template_id,jsonb_build_object('id',prior),jsonb_build_object('id',c.id));
end $fn$;
create or replace function public.select_communication_template_content(p_content_id uuid,p_expected_current_id uuid)
returns void language sql security invoker set search_path=pg_catalog as $fn$ select gaas_sfmc_private.choose_current(p_content_id,p_expected_current_id) $fn$;
revoke all on function gaas_sfmc_private.choose_current(uuid,uuid),public.select_communication_template_content(uuid,uuid) from public,anon;
grant execute on function gaas_sfmc_private.choose_current(uuid,uuid),public.select_communication_template_content(uuid,uuid) to authenticated;

