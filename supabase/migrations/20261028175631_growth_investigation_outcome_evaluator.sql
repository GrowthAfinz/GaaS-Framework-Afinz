begin;
create function public.growth_evaluate_investigation_bet(p_bet uuid) returns uuid
language plpgsql security definer set search_path='' as $$
declare b public.growth_bets; i public.growth_investigations; old public.report_action_outcomes;
 scope jsonb; filters jsonb; n bigint; bad bigint; missing bigint; observed numeric; metric text;
 source jsonb; h text; snapshot uuid; result uuid; verdict text; reason text;
begin
 select * into strict b from public.growth_bets where id=p_bet for update;
 select g.* into strict i from public.growth_investigations g join public.report_action_candidates c on c.investigation_id=g.id
 where c.action_candidate_id=b.source_action_candidate_id;
 if auth.uid() is null then perform public.growth_investigation_agent_required();
 elsif not public.growth_investigation_can_access(i.operation_id,true) then raise exception 'investigation_access_denied'; end if;
 if b.outcome_window_end>=(now() at time zone 'America/Sao_Paulo')::date then raise exception 'outcome_window_open'; end if;
 select * into old from public.report_action_outcomes where action_candidate_id=b.source_action_candidate_id for update;
 if old.review_status in ('confirmed_by_user','resolved','contested') then return old.id; end if;
 select o.scope into strict scope from public.growth_operations o where o.operation_id=i.operation_id;
 filters:=i.filters;metric:=b.metric_name;
 if metric not in ('cards','cost_per_card','proposals','approved') then raise exception 'unsupported_investigation_metric'; end if;
 with s as (
 select a.*,(select count(*) from public.activities other where other."Activity name / Taxonomia" is not distinct from a."Activity name / Taxonomia"
 and other."Data de Disparo"=a."Data de Disparo" and other."BU" is not distinct from a."BU" and other."Canal" is not distinct from a."Canal") key_count
 from public.activities a where a."BU"=scope->>'bu' and a."Segmento"=scope->>'segment' and a.parceiro_canonico=scope->>'partner'
 and a."Data de Disparo">=(b.outcome_window_start::timestamp at time zone 'America/Sao_Paulo')
 and a."Data de Disparo"<((b.outcome_window_end+1)::timestamp at time zone 'America/Sao_Paulo')
 and (not filters?'channel' or a."Canal"=filters->>'channel')
 and (not filters?'journey' or a.jornada=filters->>'journey')
 and (not filters?'activity_name' or a."Activity name / Taxonomia"=filters->>'activity_name')
 and (not filters?'execution_at' or a."Data de Disparo"=(filters->>'execution_at')::timestamptz)
 and (not filters?'stage' or a."Etapa de aquisição"=filters->>'stage')
 and (not filters?'subgroup' or a."Subgrupos"=filters->>'subgroup')
 and (not filters?'safra' or a."Safra"=filters->>'safra')
 ), m as (
 select s.*,case metric when 'cards' then "Cartões Gerados" when 'proposals' then "Propostas" when 'approved' then "Aprovados" else "Custo Total Campanha" end measurement from s
 ) select count(*),count(*) filter(where key_count>1 or status is null or status not in ('Realizado','Enviado') or measurement<0),
 count(*) filter(where measurement is null or (metric='cost_per_card' and ("Cartões Gerados" is null or "Cartões Gerados"<0))),
 case when metric='cost_per_card' then round(sum(measurement)/nullif(sum("Cartões Gerados"),0),6) else sum(measurement) end,
 coalesce(jsonb_agg(jsonb_build_object('id',id,'key_count',key_count,'value',measurement,'cards',"Cartões Gerados",'status',status) order by id),'[]')
 into n,bad,missing,observed,source from m;
 if n=0 or bad>0 or missing>0 then observed:=null;end if;
 reason:=case when n=0 then 'source_window_empty' when bad>0 then 'grain_or_execution_blocked' when missing>0 then 'missing_measurements' when observed is null then 'invalid_denominator' else 'observed_rows_population_not_certified' end;
 h:=encode(sha256(convert_to(jsonb_build_object('rows',source,'scope',scope,'filters',filters,'metric',metric,'start',b.outcome_window_start,'end',b.outcome_window_end)::text,'UTF8')),'hex');
 if old.id is not null and exists(select 1 from public.growth_evidence_snapshots s where s.id=old.evidence_snapshot_id and s.source_hash=h) then return old.id; end if;
 insert into public.growth_evidence_snapshots(source_hash,period_start,period_end,filters,metrics,quality_state,regime)
 values(h,b.outcome_window_start,b.outcome_window_end,filters||scope||jsonb_build_object('investigation_id',i.id,'operation_id',i.operation_id),
 jsonb_build_object('metric',metric,'observed',observed,'rows',source),jsonb_build_object('rows',n,'blocked_rows',bad,'missing',missing,'population_certified',false),
 jsonb_build_object('method','growth_investigation_outcome_v1')) returning id into snapshot;
 verdict:=case when observed is null then 'inconclusive' when (b.expected_direction='menor_melhor' and observed<=b.expected_value)
 or (b.expected_direction<>'menor_melhor' and observed>=b.expected_value) then 'confirmado' else 'nao_confirmado' end;
 insert into public.report_action_outcomes(action_candidate_id,bet_id,metric_name,baseline_value,expected_value,observed_value,unit,
 window_start,window_end,evaluated_at,outcome_status,conclusion,verification_view,verification_reason,evidence_snapshot_id)
 values(b.source_action_candidate_id,b.id,metric,b.baseline_value,b.expected_value,observed,b.expected_unit,b.outcome_window_start,b.outcome_window_end,
 clock_timestamp(),verdict,'Verificação descritiva das linhas disponíveis; não comprova efeito causal nem população integral.',
 'growth_investigation_outcome_v1',reason,snapshot)
 on conflict(action_candidate_id) do update set observed_value=excluded.observed_value,evaluated_at=excluded.evaluated_at,outcome_status=excluded.outcome_status,
 verification_reason=excluded.verification_reason,conclusion=excluded.conclusion,evidence_snapshot_id=excluded.evidence_snapshot_id
 returning id into result;
 return result;
end;$$;
create function public.growth_evaluate_due_investigation_bets() returns integer
language plpgsql security definer set search_path='' as $$
declare r record;n integer:=0;
begin
 perform public.growth_investigation_agent_required();
 if not exists(select 1 from public.growth_investigation_settings where intake_enabled) then return 0;end if;
 for r in select b.id from public.growth_bets b join public.report_action_candidates c on c.action_candidate_id=b.source_action_candidate_id
 where c.investigation_id is not null and b.outcome_window_end<(now() at time zone 'America/Sao_Paulo')::date
 and b.status not in ('closed','cancelled') order by b.outcome_window_end limit 50 loop
 perform public.growth_evaluate_investigation_bet(r.id);n:=n+1;
 end loop;return n;
end;$$;
-- Existing observer schedule supplies the deterministic daily check; no LLM scheduler.
create or replace function public.growth_investigation_from_observation() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 perform public.growth_enqueue_observation_investigations(new.id);
 perform public.growth_evaluate_due_investigation_bets();
 return new;
end;$$;
revoke all on function public.growth_evaluate_investigation_bet(uuid),public.growth_evaluate_due_investigation_bets() from public,anon,authenticated;
grant execute on function public.growth_evaluate_investigation_bet(uuid) to authenticated,service_role;
grant execute on function public.growth_evaluate_due_investigation_bets() to service_role;
create or replace function public.growth_guard_investigation_bet() returns trigger
language plpgsql security definer set search_path='' as $$
declare op text; metric text;
begin
 select i.operation_id,c.success_metric into op,metric from public.report_action_candidates c
 join public.growth_investigations i on i.id=c.investigation_id where c.action_candidate_id=new.source_action_candidate_id;
 if op is not null then
  if new.metric_name is distinct from metric then raise exception 'investigation_metric_must_match_candidate'; end if;
  if auth.uid() is not null and not public.growth_investigation_can_access(op,true) then raise exception 'investigation_access_denied'; end if;
 end if;
 return new;
end;$$;
create function public.growth_guard_investigation_learning() returns trigger
language plpgsql security definer set search_path='' as $$
declare candidate uuid;
begin
 select b.source_action_candidate_id into candidate from public.report_action_outcomes o join public.growth_bets b on b.id=o.bet_id
 where o.id=new.source_outcome_id;
 if candidate is not null and auth.uid() is not null and not public.growth_investigation_candidate_access(candidate) then raise exception 'investigation_access_denied'; end if;
 return new;
end;$$;
create trigger growth_learning_investigation_guard before insert or update on public.growth_learnings
for each row execute function public.growth_guard_investigation_learning();
revoke all on function public.growth_guard_investigation_learning() from public,anon,authenticated;
commit;
