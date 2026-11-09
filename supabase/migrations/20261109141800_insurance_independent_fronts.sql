begin;
-- Product-specific acceptance belongs to each front. Umbrella tasks retain
-- their history but cannot force Mulher/Residencial to await Celular coverage.
do $release$
declare t public.growth_development_tasks;
begin
 for t in select * from public.growth_development_tasks where initiative_id='03d2907e-2bb1-4c45-9b26-f3caf11480b4' and (task_key like 'SEG-%-PUBLICO' or task_key='SEG-MODELOS') for update loop
  if t.status<>'backlog' or cardinality(t.completed_criteria)>0 then raise exception 'insurance_front_changed: %',t.task_key;end if;
  update public.growth_development_tasks set
   dependencies=array_remove(array_remove(dependencies,'SEG-CONFIRMAR-PRODUTOS'),'SEG-MAPA-MULHER'),
   acceptance_criteria=acceptance_criteria||array['Critérios comerciais e cobertura atual de posse deste produto confirmados separadamente das outras frentes'],
   details=details||jsonb_build_object('independent_fronts_previous_dependencies',to_jsonb(t.dependencies)::text,'independent_fronts_reason','Aceite por produto; tarefas consolidadas não bloqueiam outra frente'),
   revision=revision+1,updated_at=clock_timestamp()
   where id=t.id;
 end loop;
end $release$;
commit;
