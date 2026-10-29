begin;
create schema if not exists growth_loop_private;
revoke all on schema growth_loop_private from public,anon,authenticated;
create table public.growth_loop_sources(
 id text primary key,label text not null,front text not null,cadence text not null check(cadence in ('daily','event')),
 due_hour_local integer not null default 9 check(due_hour_local between 0 and 23),enabled boolean not null default true,
 instructions text not null,policy_version integer not null default 1);
insert into public.growth_loop_sources(id,label,front,cadence,instructions) values
 ('meta','Meta Ads','paid_media','daily','Confira a execução da coleta de hoje e o período coberto.'),
 ('google','Google Ads','paid_media','daily','Confirme se houve campanhas no período e atualize os resultados pela fonte autorizada.'),
 ('crm','Aquisição CRM','crm_acquisition','daily','Confira se os disparos e os resultados do dia fechado foram importados.'),
 ('b2c','Originação B2C','b2c_origin','daily','Atualize a planilha/fonte de produção diária. Total e Serasa não devem ser somados.'),
 ('app','Funil do app','b2c_origin','daily','Confira a importação diária do funil do app e os dias cobertos, sem inferir contratação a partir de evento.'),
 ('serasa','Funil Serasa','b2c_origin','daily','Confira a importação diária do funil Serasa e a cobertura das etapas.'),
 ('renta','Rentabilização','rentabilization','event','Confira no calendário se existem disparos posteriores para importar; ausência de disparo não prova atraso.');
create table public.growth_loop_items(
 id uuid primary key default gen_random_uuid(),episode_key text not null unique,kind text not null check(kind in ('source','investigation','outcome','contribution')),
 source_id text not null,front text not null,period date not null,title text not null,summary text not null,next_action text not null,
 state text not null check(state in ('needs_data','failed','analysis_ready','running','awaiting_analysis','needs_review','resolved')),
 route text not null,notice_revision integer not null default 0,revision integer not null default 0,content_hash text not null default '',priority integer not null,
 evidence jsonb not null default '{}',created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create index growth_loop_items_open on public.growth_loop_items(state,priority,updated_at);
create table public.growth_loop_revisions(
 item_id uuid not null references public.growth_loop_items,revision integer not null,content_hash text not null,packet jsonb not null,
 created_at timestamptz not null default now(),primary key(item_id,revision));
create table public.growth_loop_preferences(
 item_id uuid not null references public.growth_loop_items,user_id uuid not null references auth.users,
 following boolean not null default false,hidden_revision integer,snoozed_until timestamptz,read_revision integer,
 updated_at timestamptz not null default now(),primary key(item_id,user_id));
create table public.growth_loop_analyses(
 id uuid primary key default gen_random_uuid(),item_id uuid not null references public.growth_loop_items,revision integer not null,
 lease_token uuid,lease_until timestamptz,attempts integer not null default 0,state text not null default 'pending' check(state in ('pending','running','completed','blocked','failed','superseded')),
 agent jsonb,body jsonb,last_error text,completed_at timestamptz,unique(item_id,revision));
create table public.growth_loop_analysis_attempts(
 id uuid primary key default gen_random_uuid(),analysis_id uuid not null references public.growth_loop_analyses,attempt integer not null,
 token uuid not null,agent jsonb not null,started_at timestamptz not null default now(),finished_at timestamptz,outcome text,unique(analysis_id,attempt));
create table public.growth_loop_settings(id boolean primary key default true check(id),enabled boolean not null default true,skill_version text not null,skill_hash text not null);
insert into public.growth_loop_settings values(true,true,'1.0.0','2727586ed3a08a25d8a73b166beaf7fb2b8bdda3227b7761b1493985c48c90f3');
create function public.growth_loop_can_access(p_kind text,p_source text) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and (public.gaas_vault_is_admin() or
 (p_kind='investigation' and exists(select 1 from public.growth_investigations i where i.id::text=p_source and public.growth_investigation_can_access(i.operation_id))) or
 (p_kind='contribution' and exists(select 1 from public.gaas_knowledge_contributions c where c.id::text=p_source and c.created_by=auth.uid())));
$$;
-- No frontend writes to shared state. Access is deliberately scoped; global source and outcome triage is administrative.
do $$declare t text;begin foreach t in array array['growth_loop_sources','growth_loop_items','growth_loop_revisions','growth_loop_preferences','growth_loop_analyses','growth_loop_analysis_attempts','growth_loop_settings'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from public,anon,authenticated',t);
 execute format('grant all on public.%I to service_role',t);
 end loop;end$$;
grant select on public.growth_loop_items,public.growth_loop_revisions,public.growth_loop_preferences,public.growth_loop_analyses,public.growth_loop_sources to authenticated;
create policy loop_items_read on public.growth_loop_items for select to authenticated using(public.growth_loop_can_access(kind,source_id));
create policy loop_revisions_read on public.growth_loop_revisions for select to authenticated using(exists(select 1 from public.growth_loop_items i where i.id=item_id));
create policy loop_preferences_read on public.growth_loop_preferences for select to authenticated using(user_id=auth.uid() and exists(select 1 from public.growth_loop_items i where i.id=item_id));
create policy loop_analyses_read on public.growth_loop_analyses for select to authenticated using(exists(select 1 from public.growth_loop_items i where i.id=item_id));
create policy loop_sources_read on public.growth_loop_sources for select to authenticated using(public.gaas_vault_is_admin());
create function growth_loop_private.put(p_key text,p_kind text,p_source text,p_front text,p_period date,p_title text,p_summary text,p_next text,p_state text,p_route text,p_priority integer,p_evidence jsonb)
returns uuid language plpgsql security definer set search_path='' as $$
declare v public.growth_loop_items;h text;begin
 h:=encode(sha256(convert_to(jsonb_build_array(p_title,p_summary,p_next,p_state,p_evidence-'expected_cutoff')::text,'UTF8')),'hex');
 insert into public.growth_loop_items(episode_key,kind,source_id,front,period,title,summary,next_action,state,route,priority)
 values(p_key,p_kind,p_source,p_front,p_period,p_title,p_summary,p_next,p_state,p_route,p_priority) on conflict(episode_key) do nothing;
 select * into strict v from public.growth_loop_items where episode_key=p_key for update;
 if v.content_hash<>h or v.state<>p_state then
 update public.growth_loop_items set title=p_title,summary=p_summary,next_action=p_next,state=p_state,route=p_route,priority=p_priority,
 period=p_period,evidence=p_evidence,notice_revision=notice_revision+1,revision=revision+1,content_hash=h,updated_at=clock_timestamp() where id=v.id returning * into v;
 insert into public.growth_loop_revisions values(v.id,v.revision,h,jsonb_build_object('kind',p_kind,'source_id',p_source,'scope',p_front,'period',p_period,'title',p_title,'summary',p_summary,'state',p_state,'evidence',p_evidence),now());
 update public.growth_loop_analyses set state='superseded' where item_id=v.id and revision<>v.revision and state in ('pending','running');
 end if;return v.id;
end$$;
create function public.growth_loop_reconcile() returns integer language plpgsql security definer set search_path='' as $$
declare today date:=(now() at time zone 'America/Sao_Paulo')::date;cut date;last_day date;ok boolean;r record;st text;i uuid;n integer:=0;packet jsonb;begin
 perform public.growth_investigation_agent_required();
 if not exists(select 1 from public.growth_loop_settings where enabled) then return 0;end if;
 perform pg_advisory_xact_lock(hashtext('growth-loop-reconcile'));
 cut:=today-1;
 for r in select * from public.growth_loop_sources where enabled loop
 last_day:=null;ok:=false;
 if r.id='meta' then
 select max(date) into last_day from public.paid_media_metrics where channel='meta';
 select exists(select 1 from public.paid_media_collection_runs where source='meta' and status='complete' and finished_at>=(today::timestamp at time zone 'America/Sao_Paulo') and until_date>=cut and rows_written>0) into ok;
 elsif r.id='google' then select max(date) into last_day from public.paid_media_metrics where channel='google';ok:=last_day>=cut;
 elsif r.id='crm' then select max(("Data de Disparo" at time zone 'America/Sao_Paulo')::date) into last_day from public.activities;ok:=last_day>=cut;
 elsif r.id='b2c' then select max(data) into last_day from public.b2c_daily_metrics where tipo='total';ok:=last_day>=cut;
 elsif r.id='app' then select max(business_date) into last_day from public.app_afinz_funnel_daily_raw;ok:=last_day>=cut;
 elsif r.id='serasa' then select max(data) into last_day from public.serasa_bi_daily_funnel;ok:=last_day>=cut;
 elsif r.id='renta' then select max((coalesce(to_jsonb(a)->>'Data de Disparo',to_jsonb(a)->>'"Data de Disparo"')::timestamptz at time zone 'America/Sao_Paulo')::date) into last_day from public.rentabilizacao_activities a;ok:=last_day>=cut;
 end if;
 if not coalesce(ok,false) and r.cadence='daily' and extract(hour from now() at time zone 'America/Sao_Paulo')<r.due_hour_local then continue;end if;
 -- Event sources request a calendar check, never claim daily production is missing.
 if coalesce(ok,false) then
 update public.growth_loop_items set state='resolved',updated_at=now() where episode_key='source:'||r.id and state<>'resolved';
 else
 packet:=jsonb_build_object('source',r.id,'last_business_date',last_day,'expected_cutoff',cut,'cadence',r.cadence,'policy_version',r.policy_version,'confirmation','coverage_check_required');
 if r.id='meta' then packet:=packet||jsonb_build_object('collection_day',today);end if;
 i:=growth_loop_private.put('source:'||r.id,'source',r.id,r.front,date_trunc('month',today)::date,
 case when r.id='meta' then 'Meta Ads — atualização de hoje pendente' when r.cadence='event' then 'Conferir os dados de '||r.label else 'Atualizar os dados de '||r.label end,
 'Dados disponíveis até '||coalesce(to_char(last_day,'DD/MM/YYYY'),'data desconhecida')||'. '||case when r.cadence='event' then 'Confira se existem disparos posteriores.' else 'Confira a atualização esperada para o período.' end,
 r.instructions,'needs_data','?view=learning&section=feed',20,packet);n:=n+1;
 end if;
 end loop;
 -- Use server records, not the app RPC (which correctly depends on a user session).
 for r in select x.*,j.state as job_state,e.packet,e.content_hash as evidence_hash,a.body,
 exists(select 1 from public.growth_investigation_decisions d where d.investigation_id=x.id and d.evidence_id=e.id and d.decision in ('expected','no_action','propose_bet')) as decided
 from public.growth_investigations x join public.growth_investigation_evidence e on e.investigation_id=x.id and e.revision=x.current_revision
 join public.growth_investigation_jobs j on j.evidence_id=e.id left join public.growth_investigation_analyses a on a.job_id=j.id loop
 st:=case when r.decided then 'resolved' when r.job_state='blocked' then 'needs_data' when r.job_state='failed' then 'failed' when r.job_state='running' then 'running' when r.body is not null then 'analysis_ready' else 'awaiting_analysis' end;
 i:=growth_loop_private.put('investigation:'||r.id,'investigation',r.id::text,'crm_acquisition',r.period,
 coalesce(r.packet->'scope'->>'partner','CRM')||' / '||coalesce(r.packet->'scope'->>'segment','operação')||case when st='needs_data' then ' — precisamos conferir os números' when st='analysis_ready' then ' — análise pronta para decidir' else ' — acompanhar análise' end,
 case when st='needs_data' then 'Precisamos confirmar se esses números podem ser somados antes de concluir o resultado.' when st='analysis_ready' then 'A análise está pronta. Confira os resultados e registre o próximo passo.' when st='failed' then 'Não foi possível terminar a análise. Confira a falha antes de tentar novamente.' else 'Este trabalho aguarda o processamento pelo agente conectado.' end,
 case when st='needs_data' then 'Registrar o esclarecimento necessário e revalidar as evidências depois da resposta.' when st='analysis_ready' then 'Abrir a análise e registrar uma decisão.' else 'Peça ao Codex ou Claude para rodar a fila com a skill compartilhada.' end,
 st,'?view=learning&section=investigations&item='||r.id,case when st in ('needs_data','failed') then 10 when st='analysis_ready' then 40 else 60 end,
 jsonb_build_object('operation_id',r.operation_id,'evidence_hash',r.evidence_hash,'analysis',r.body,'evidence',r.packet->'evidence'));n:=n+1;
 end loop;
 for r in select * from public.growth_outcomes_due_v where due_bucket in ('overdue','due_today','ready_review','waiting_data','contested') loop
 i:=growth_loop_private.put('outcome:'||r.bet_id,'outcome',r.bet_id::text,r.front,r.outcome_window_end,
 'Resultado de aposta aguardando revisão','A janela terminou em '||to_char(r.outcome_window_end,'DD/MM/YYYY')||'. Confira a execução e o resultado registrado.',
 'Abrir Outcomes e registrar a revisão.','needs_review','?view=learning&section=outcomes&item='||r.bet_id,5,
 jsonb_build_object('bet_id',r.bet_id,'metric',r.metric_name,'window_end',r.outcome_window_end,'due_bucket',r.due_bucket,'review_status',r.review_status));n:=n+1;
 end loop;
 update public.growth_loop_items x set state='resolved',updated_at=now() where kind='outcome' and state<>'resolved' and not exists(select 1 from public.growth_outcomes_due_v v where v.bet_id::text=x.source_id and v.due_bucket in ('overdue','due_today','ready_review','waiting_data','contested'));
 for r in select * from public.gaas_knowledge_contributions where status in ('pending','changes_requested','approved') loop
 i:=growth_loop_private.put('contribution:'||r.id,'contribution',r.id::text,'knowledge',r.created_at::date,
 'Wiki — '||r.title,case when r.status='approved' then 'Proposta aprovada. Falta aplicar na fonte e comprovar a sincronização.' else 'Há uma proposta de alteração das notas para revisar.' end,
 case when r.status='approved' then 'Aplicar a contribuição aprovada com a skill, preservando os hashes-base.' else 'Abrir Trabalhar com IA e revisar a contribuição.' end,
 'needs_review','?view=learning&section=vault&wiki_ai=1',30,jsonb_build_object('contribution_id',r.id,'status',r.status,'pack_id',r.pack_id));n:=n+1;
 end loop;
 update public.growth_loop_items x set state='resolved',updated_at=now() where kind='contribution' and state<>'resolved' and not exists(select 1 from public.gaas_knowledge_contributions c where c.id::text=x.source_id and c.status in ('pending','changes_requested','approved'));
 return n;
end$$;
create function public.growth_loop_list(p_include_hidden boolean default false) returns jsonb language sql stable security invoker set search_path='' as $$
 select coalesce(jsonb_agg(v order by (v->>'priority')::integer,v->>'updated_at'),'[]') from (
 select to_jsonb(i)||jsonb_build_object('following',coalesce(p.following,false),'read',p.read_revision=i.notice_revision,
 'hidden',coalesce(p.hidden_revision=i.notice_revision,false) or coalesce(p.snoozed_until>now(),false),'snoozed_until',p.snoozed_until,
 'analysis',(select jsonb_build_object('id',a.id,'state',a.state,'body',a.body,'last_error',a.last_error) from public.growth_loop_analyses a where a.item_id=i.id and a.revision=i.revision)) as v
 from public.growth_loop_items i left join public.growth_loop_preferences p on p.item_id=i.id and p.user_id=auth.uid()
 where i.state<>'resolved' and (p_include_hidden or (p.hidden_revision is distinct from i.notice_revision and coalesce(p.snoozed_until<=now(),true)))) s;
$$;
create function public.growth_loop_prefer(p_item uuid,p_action text,p_until timestamptz default null) returns void language plpgsql security definer set search_path='' as $$
declare i public.growth_loop_items;begin
 select * into strict i from public.growth_loop_items where id=p_item;
 if not public.growth_loop_can_access(i.kind,i.source_id) then raise exception 'loop_access_denied';end if;
 if p_action not in ('follow','unfollow','dismiss','snooze','read','restore') or (p_action='snooze' and (p_until is null or p_until<=now() or p_until>now()+interval '90 days')) then raise exception 'invalid_preference';end if;
 insert into public.growth_loop_preferences(item_id,user_id) values(i.id,auth.uid()) on conflict do nothing;
 update public.growth_loop_preferences set
 following=case when p_action='follow' then true when p_action='unfollow' then false else following end,
 hidden_revision=case when p_action='dismiss' then i.notice_revision when p_action='restore' then null else hidden_revision end,
 snoozed_until=case when p_action='snooze' then p_until when p_action='restore' then null else snoozed_until end,
 read_revision=case when p_action='read' then i.notice_revision else read_revision end,updated_at=now()
 where item_id=i.id and user_id=auth.uid();
end$$;
create function public.growth_loop_request_analysis(p_item uuid) returns uuid language plpgsql security definer set search_path='' as $$
declare i public.growth_loop_items;a uuid;begin
 select * into strict i from public.growth_loop_items where id=p_item for update;
 if not public.growth_loop_can_access(i.kind,i.source_id) or not public.gaas_vault_is_admin() then raise exception 'loop_access_denied';end if;
 if not exists(select 1 from public.growth_loop_settings where enabled) then raise exception 'loop_disabled';end if;
 if i.kind<>'source' or i.state='resolved' then raise exception 'use_existing_domain_workflow';end if;
 insert into public.growth_loop_analyses(item_id,revision) values(i.id,i.revision) on conflict(item_id,revision) do nothing;
 update public.growth_loop_analyses set state='pending',attempts=0,last_error=null where item_id=i.id and revision=i.revision and state='failed';
 select id into a from public.growth_loop_analyses where item_id=i.id and revision=i.revision;return a;
end$$;
create function public.growth_loop_claim(p_agent jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare a public.growth_loop_analyses;i public.growth_loop_items;t uuid:=gen_random_uuid();begin
 perform public.growth_investigation_agent_required();
 if not exists(select 1 from public.growth_loop_settings where enabled) then return null;end if;
 if not exists(select 1 from public.growth_loop_settings where enabled and skill_hash=p_agent->>'skill_hash' and skill_version=p_agent->>'skill_version') or coalesce(p_agent->>'name','') not in ('codex','claude') or coalesce(p_agent->>'commit','')!~'^[a-f0-9]{40}$' then raise exception 'invalid_loop_agent';end if;
 update public.growth_loop_analyses set state='failed',last_error='lease_expired_after_three_attempts' where state='running' and lease_until<now() and attempts>=3;
 select x.* into a from public.growth_loop_analyses x join public.growth_loop_items z on z.id=x.item_id and z.revision=x.revision where x.attempts<3 and (x.state='pending' or (x.state='running' and x.lease_until<now())) order by z.priority,x.id for update of x skip locked limit 1;
 if not found then return null;end if;
 update public.growth_loop_analysis_attempts set finished_at=now(),outcome='expired' where analysis_id=a.id and finished_at is null;
 update public.growth_loop_analyses set state='running',attempts=attempts+1,lease_token=t,lease_until=now()+interval '30 minutes',agent=p_agent where id=a.id returning * into a;
 insert into public.growth_loop_analysis_attempts(analysis_id,attempt,token,agent) select a.id,coalesce(max(attempt),0)+1,t,p_agent from public.growth_loop_analysis_attempts where analysis_id=a.id;
 select * into i from public.growth_loop_items where id=a.item_id;
 return jsonb_build_object('analysis_id',a.id,'lease_token',t,'revision',a.revision,'content_hash',i.content_hash,'packet',(select packet from public.growth_loop_revisions where item_id=i.id and revision=a.revision));
end$$;
create function public.growth_loop_renew(p_analysis uuid,p_token uuid) returns boolean language plpgsql security definer set search_path='' as $$begin
 perform public.growth_investigation_agent_required();
 update public.growth_loop_analyses set lease_until=now()+interval '30 minutes' where id=p_analysis and state='running' and lease_token=p_token and lease_until>now();return found;end$$;
create function public.growth_loop_complete(p_analysis uuid,p_token uuid,p_hash text,p_body jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare a public.growth_loop_analyses;i public.growth_loop_items;f jsonb;begin
 perform public.growth_investigation_agent_required();
 if not exists(select 1 from public.growth_loop_settings where enabled) then raise exception 'loop_disabled';end if;
 select * into strict a from public.growth_loop_analyses where id=p_analysis for update;
 select * into strict i from public.growth_loop_items where id=a.item_id for update;
 if a.state in ('completed','blocked') and a.lease_token=p_token and a.body=p_body then return a.id;end if;
 if a.state<>'running' or a.lease_token is distinct from p_token or a.lease_until<=now() then raise exception 'invalid_loop_lease';end if;
 if i.revision<>a.revision or i.content_hash<>p_hash or i.state='resolved' then raise exception 'loop_evidence_superseded';end if;
 if jsonb_typeof(p_body)<>'object' or coalesce(p_body->>'status','') not in ('blocked','inconclusive','conclusive') or length(coalesce(p_body->>'summary','')) not between 20 and 4000 or jsonb_typeof(p_body->'facts') is distinct from 'array' or jsonb_array_length(p_body->'facts')<1 or jsonb_typeof(p_body->'limitations') is distinct from 'array' or jsonb_typeof(p_body->'next_checks') is distinct from 'array' or length(p_body::text)>40000 or p_body ? 'candidate' then raise exception 'invalid_loop_output';end if;
 if jsonb_array_length(p_body->'limitations')<1 or jsonb_array_length(p_body->'next_checks')<1 or exists(select 1 from jsonb_array_elements((p_body->'limitations')||(p_body->'next_checks')) x where jsonb_typeof(x) <> 'string' or length(trim(x #>> '{}'))<5) then raise exception 'invalid_loop_output';end if;
 for f in select value from jsonb_array_elements(p_body->'facts') loop
 if length(coalesce(f->>'text',''))<5 or not (i.evidence ? coalesce(f->>'evidence_key','')) then raise exception 'invalid_loop_reference';end if;
 if f ? 'value' and (i.evidence->(f->>'evidence_key')) is distinct from f->'value' then raise exception 'invalid_loop_value';end if;
 end loop;
 update public.growth_loop_analyses set state=case when p_body->>'status'='blocked' then 'blocked' else 'completed' end,body=p_body,completed_at=now() where id=a.id;
 update public.growth_loop_items set notice_revision=notice_revision+1,updated_at=now() where id=i.id;
 update public.growth_loop_analysis_attempts set finished_at=now(),outcome=p_body->>'status' where analysis_id=a.id and token=p_token;
 return a.id;
end$$;
create function public.growth_loop_fail(p_analysis uuid,p_token uuid,p_code text) returns boolean language plpgsql security definer set search_path='' as $$begin
 perform public.growth_investigation_agent_required();
 update public.growth_loop_analyses set state=case when attempts>=3 then 'failed' else 'pending' end,last_error=left(p_code,100),lease_until=null where id=p_analysis and lease_token=p_token and state='running' and lease_until>now();
 if not found then return false;end if;
 update public.growth_loop_analysis_attempts set finished_at=now(),outcome='failed' where analysis_id=p_analysis and token=p_token;return true;end$$;
create table public.growth_loop_note_links(
 item_id uuid not null references public.growth_loop_items,revision integer not null,path text not null,expected_hash text not null,
 contribution_id uuid not null references public.gaas_knowledge_contributions,primary key(item_id,revision,path,expected_hash));
alter table public.growth_loop_note_links enable row level security;
revoke all on public.growth_loop_note_links from public,anon,authenticated;
grant select on public.growth_loop_note_links to authenticated;
create policy loop_note_links_read on public.growth_loop_note_links for select to authenticated using(exists(select 1 from public.growth_loop_items i where i.id=item_id));
create function public.growth_loop_submit_note(p_item uuid,p_revision integer,p_pack uuid,p_path text,p_base_hash text,p_markdown text) returns uuid language plpgsql security definer set search_path='' as $$
declare i public.growth_loop_items;n public.gaas_vault_notes;c uuid;h text;domain text;k text;expected_scope jsonb;begin
 select * into strict i from public.growth_loop_items where id=p_item for update;
 if not public.growth_loop_can_access(i.kind,i.source_id) then raise exception 'loop_access_denied';end if;
 if i.revision<>p_revision then raise exception 'loop_evidence_superseded';end if;
 select * into strict n from public.gaas_vault_notes where relative_path=p_path and deleted_at is null;
 if n.content_hash is distinct from p_base_hash then raise exception 'knowledge_stale_base';end if;
 domain:=case i.front when 'crm_acquisition' then 'crm' when 'paid_media' then 'media' when 'b2c_origin' then 'b2c' when 'rentabilization' then 'renta' else '' end;
 if coalesce(n.frontmatter->'analytics'->>'domain','')<>domain then raise exception 'note_outside_front';end if;
 if i.kind='investigation' then select o.scope into expected_scope from public.growth_investigations x join public.growth_operations o on o.operation_id=x.operation_id where x.id::text=i.source_id;
 foreach k in array array['bu','segment','partner','channel'] loop
 if nullif(n.frontmatter->'analytics'->'scope'->>k,'') is not null and n.frontmatter->'analytics'->'scope'->>k is distinct from expected_scope->>k then raise exception 'note_outside_scope';end if;end loop;end if;
 if not exists(select 1 from public.gaas_knowledge_packs where id=p_pack and created_by=auth.uid()) then raise exception 'knowledge_pack_not_owned';end if;
 h:=encode(sha256(convert_to(p_markdown,'UTF8')),'hex');
 select contribution_id into c from public.growth_loop_note_links where item_id=i.id and revision=i.revision and path=p_path and expected_hash=h;
 if c is not null then return c;end if;
 c:=public.gaas_knowledge_submit(p_pack,'Resultado: '||left(i.title,140),'Proposta vinculada ao bloco '||i.id||', revisão '||i.revision||'. Exige revisão editorial e aplicação na fonte.',
 jsonb_build_array(jsonb_build_object('path',p_path,'base_hash',p_base_hash,'markdown',p_markdown,'expected_hash',h)));
 insert into public.growth_loop_note_links values(i.id,i.revision,p_path,h,c);return c;
end$$;
revoke all on function public.growth_loop_submit_note(uuid,integer,uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.growth_loop_submit_note(uuid,integer,uuid,text,text,text) to authenticated;
-- Freeze audit records; only shared item projection and user preferences are mutable.
create trigger loop_revision_immutable before update or delete on public.growth_loop_revisions for each row execute function public.growth_reject_definition_mutation();
revoke all on function public.growth_loop_can_access(text,text),public.growth_loop_list(boolean),public.growth_loop_prefer(uuid,text,timestamptz),public.growth_loop_request_analysis(uuid),public.growth_loop_claim(jsonb),public.growth_loop_renew(uuid,uuid),public.growth_loop_complete(uuid,uuid,text,jsonb),public.growth_loop_fail(uuid,uuid,text),public.growth_loop_reconcile() from public,anon,authenticated;
grant execute on function public.growth_loop_can_access(text,text),public.growth_loop_list(boolean),public.growth_loop_prefer(uuid,text,timestamptz),public.growth_loop_request_analysis(uuid) to authenticated;
grant execute on function public.growth_loop_claim(jsonb),public.growth_loop_renew(uuid,uuid),public.growth_loop_complete(uuid,uuid,text,jsonb),public.growth_loop_fail(uuid,uuid,text),public.growth_loop_reconcile() to service_role;
-- New helpers in the private schema must never inherit PUBLIC execute.
revoke all on function growth_loop_private.put(text,text,text,text,date,text,text,text,text,text,integer,jsonb) from public,anon,authenticated;
select cron.schedule('growth-loop-attention','*/5 * * * *','select public.growth_loop_reconcile()');
commit;
