begin;
create or replace function public.growth_development_task_event() returns trigger language plpgsql security definer set search_path='' as $$
declare st text; actionable boolean;begin
 insert into public.growth_development_task_events(task_id,revision,actor_id,kind,before_data,after_data)
 values(new.id,new.revision,auth.uid(),case when TG_OP='INSERT' then 'created' else 'updated' end,case when TG_OP='INSERT' then null else to_jsonb(old) end,to_jsonb(new));
 actionable:=new.status in ('bloqueada','pronta','concluida','cancelada') or coalesce(new.details->>'attention','none') in ('decision','proposal','reading');
 -- Capture and routine/checklist changes remain in history without creating notifications.
 if TG_OP='INSERT' and not actionable then return new;end if;
 if TG_OP='UPDATE' and not actionable and not exists(select 1 from public.growth_loop_items where episode_key='development:'||new.id) then return new;end if;
 st:=case when not actionable and new.status<>'em_execucao' then 'resolved' when new.status in ('concluida','cancelada') then 'resolved' when new.status='bloqueada' then 'needs_data'
 when new.details->>'attention'='reading' then 'analysis_ready' when new.status='em_execucao' then 'running' else 'needs_review' end;
 update public.growth_loop_items set front=case new.workspace when 'sdd' then 'gaas_development' when 'acquisition' then 'crm_acquisition' when 'monetization' then 'crm_monetization' else 'crm_cross_sell' end where episode_key='development:'||new.id;
 perform growth_loop_private.put('development:'||new.id,'development_task',new.id::text,
 case new.workspace when 'sdd' then 'gaas_development' when 'acquisition' then 'crm_acquisition' when 'monetization' then 'crm_monetization' else 'crm_cross_sell' end,
 (new.created_at at time zone 'America/Sao_Paulo')::date,new.title,
 new.priority||' · '||new.area||'. '||case when new.status='bloqueada' then coalesce(new.blocked_reason,'Revisar impedimento.') else coalesce(nullif(new.next_action,''),'Confira o próximo avanço.') end,
 coalesce(nullif(new.next_action,''),'Abra o trabalho e confira evidências e dependências.'),st,
 '?view=learning&section=investigations&dev_task='||new.id,
 case new.priority when 'P0' then 8 when 'P1' then 18 when 'P2' then 28 else 38 end,
 jsonb_build_object('task_key',new.task_key,'workspace',new.workspace,'work_type',new.work_type,'area',new.area,'priority',new.priority,'status',new.status,'owner',new.owner_label,'due_date',new.due_date,'dependencies',new.dependencies,'source_note',new.source_note,'blocked_reason',new.blocked_reason,'attention',new.details->>'attention'));
 return new;
end$$;
commit;
