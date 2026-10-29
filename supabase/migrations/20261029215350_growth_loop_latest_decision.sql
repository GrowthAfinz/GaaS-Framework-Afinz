begin;
-- Reflect the latest human decision without erasing earlier decisions.
create or replace function public.growth_loop_reconcile() returns integer language plpgsql security definer set search_path='' as $$
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
 for packet in select to_jsonb(x) from public.growth_loop_items x where episode_key='source:'||r.id and state<>'resolved' loop
 perform growth_loop_private.put(packet->>'episode_key','source',r.id,r.front,(packet->>'period')::date,packet->>'title','A atualização esperada foi identificada na fonte.',r.instructions,'resolved',packet->>'route',20,jsonb_build_object('source',r.id,'last_business_date',last_day,'expected_cutoff',cut,'cadence',r.cadence,'policy_version',r.policy_version,'confirmation','update_observed'));
 end loop;
 update public.growth_loop_analyses a set state='superseded' from public.growth_loop_items x where x.id=a.item_id and x.episode_key='source:'||r.id and x.state='resolved' and a.state in ('pending','running');
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
 (select d.decision from public.growth_investigation_decisions d where d.investigation_id=x.id and d.evidence_id=e.id order by d.created_at desc,d.id desc limit 1) as latest_decision
 from public.growth_investigations x join public.growth_investigation_evidence e on e.investigation_id=x.id and e.revision=x.current_revision
 join public.growth_investigation_jobs j on j.evidence_id=e.id left join public.growth_investigation_analyses a on a.job_id=j.id loop
 st:=case when r.latest_decision in ('expected','no_action','propose_bet') then 'resolved' when r.latest_decision='request_data' then 'needs_data' when r.latest_decision='investigate' then 'needs_review' when r.job_state='blocked' then 'needs_data' when r.job_state='failed' then 'failed' when r.job_state='running' then 'running' when r.body is not null then 'analysis_ready' else 'awaiting_analysis' end;
 i:=growth_loop_private.put('investigation:'||r.id,'investigation',r.id::text,'crm_acquisition',r.period,
 coalesce(r.packet->'scope'->>'partner','CRM')||' / '||coalesce(r.packet->'scope'->>'segment','operação')||case when st='needs_data' then ' — precisamos conferir os números' when st='analysis_ready' then ' — análise pronta para decidir' else ' — acompanhar análise' end,
 case when r.latest_decision='request_data' then 'Foi registrada uma pendência de dados. Confira o pedido e registre a resposta na tarefa.' when r.latest_decision='investigate' then 'Você pediu para investigar mais. Revise as verificações pendentes e registre a próxima evidência na tarefa.' when st='needs_data' then 'Precisamos confirmar se esses números podem ser somados antes de concluir o resultado.' when st='analysis_ready' then 'A análise está pronta. Confira os resultados e registre o próximo passo.' when st='failed' then 'Não foi possível terminar a análise. Confira a falha antes de tentar novamente.' else 'Este trabalho aguarda o processamento pelo agente conectado.' end,
 case when r.latest_decision='investigate' then 'Abrir a tarefa, revisar a pergunta e preparar a próxima verificação.' when st='needs_data' then 'Registrar o esclarecimento necessário e revalidar as evidências depois da resposta.' when st='analysis_ready' then 'Abrir a análise e registrar uma decisão.' else 'Peça ao Codex ou Claude para rodar a fila com a skill compartilhada.' end,
 st,'?view=learning&section=investigations&item='||r.id,case when st in ('needs_data','failed') then 10 when st='analysis_ready' then 40 else 60 end,
 jsonb_build_object('operation_id',r.operation_id,'evidence_hash',r.evidence_hash,'analysis',r.body,'evidence',r.packet->'evidence')||case when r.latest_decision is null then '{}'::jsonb else jsonb_build_object('human_decision',r.latest_decision) end);n:=n+1;
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
create or replace function public.growth_loop_submit_note(p_item uuid,p_revision integer,p_pack uuid,p_path text,p_base_hash text,p_markdown text) returns uuid language plpgsql security definer set search_path='' as $$
declare i public.growth_loop_items;n public.gaas_vault_notes;c uuid;h text;domain text;k text;expected_scope jsonb;begin
 select * into strict i from public.growth_loop_items where id=p_item for update;
 if not public.growth_loop_can_access(i.kind,i.source_id) then raise exception 'loop_access_denied';end if;
 if i.kind='investigation' and not exists(select 1 from public.growth_investigations x where x.id::text=i.source_id and public.growth_investigation_can_access(x.operation_id,true)) then raise exception 'loop_write_access_denied';end if;
 if i.revision is distinct from p_revision then raise exception 'loop_evidence_superseded';end if;
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
commit;
