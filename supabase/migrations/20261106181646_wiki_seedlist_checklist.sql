begin;
-- Extend the existing guarded write path; keep RLS, criteria, dependencies,
-- optimistic revisions and the existing before/after event trigger unchanged.
do $migration$
declare definition text; marker text := 'if p_id is not null and to_jsonb(n)=to_jsonb(previous) then return to_jsonb(n);end if;';
begin
 definition := pg_get_functiondef('public.growth_save_development_task(uuid,integer,jsonb)'::regprocedure);
 if strpos(definition,'-- completion_date_v1')=0 then
  if strpos(definition,marker)=0 then raise exception 'task_writer_contract_changed';end if;
  definition := replace(definition,marker,$completion$
 -- completion_date_v1: business date is distinct from last edit and audit timestamp.
 if n.status='concluida' then
   if nullif(n.details->>'completed_on','') is null then
     if nullif(previous.details->>'completed_on','') is not null then
       n.details:=n.details||jsonb_build_object('completed_on',previous.details->>'completed_on');
     elsif p_id is null or previous.status is distinct from 'concluida' then
       n.details:=n.details||jsonb_build_object('completed_on',(now() at time zone 'America/Sao_Paulo')::date::text);
     end if;
   end if;
   if nullif(n.details->>'completed_on','') is not null then
     if (n.details->>'completed_on')!~ '^\d{4}-\d{2}-\d{2}$' then raise exception 'task_completion_date_invalid';end if;
     if (n.details->>'completed_on')::date > (now() at time zone 'America/Sao_Paulo')::date
       or (n.details->>'completed_on')::date < date '1900-01-01' then raise exception 'task_completion_date_invalid';end if;
   end if;
 else
   n.details:=n.details-'completed_on';
 end if;
 $completion$||marker);
  execute definition;
 end if;
end $migration$;

-- Add only missing milestones to the existing initiative; never reconcile
-- human-edited tasks by overwriting their state or evidence.
do $seed$
declare project_id uuid; owner_id uuid; matches integer;
begin
 select count(*) into matches from public.growth_work_initiatives
 where source_note='10-Resultados/Iniciativas/Iniciativa-Pool-de-Ofertas-Vai-de-Visa.md' and workspace='monetization';
 if matches<>1 then raise exception 'visa_initiative_not_unique';end if;
 select id,created_by into project_id,owner_id from public.growth_work_initiatives
 where source_note='10-Resultados/Iniciativas/Iniciativa-Pool-de-Ofertas-Vai-de-Visa.md' and workspace='monetization';
 insert into public.growth_development_tasks(task_key,title,description,area,priority,status,acceptance_criteria,completed_criteria,resolution,source_note,created_by,revision,workspace,work_type,initiative_id,details,links,dependencies)
 select v.key,v.title,v.description,'Pool de Ofertas Visa',v.priority,v.status,v.criteria,
 case when v.status='concluida' then array[0] else '{}'::integer[] end,v.evidence,
 '05-Estrategia/Estrategia-Pool-de-Ofertas-Visa.md',owner_id,1,'monetization','task',project_id,
 case when v.done is not null then jsonb_build_object('completed_on',v.done,'provenance','Marco documental; não certifica homologação SFMC') else '{}'::jsonb end,
 jsonb_build_array(jsonb_build_object('label',v.reference_label,'url',v.reference,'kind','evidence','state','confirmed')),v.dependencies
 from (values
 ('VDV-BUILD-1','Catálogo e dois e-mails disponíveis na Fábrica','Entrega no GaaS: catálogo, vitrine, editor e previews V1/V2. Não equivale a Test Send.','P1','concluida',array['Conteúdo e editor publicados no GaaS'],'Entrega registrada na main e na migração visa_communication_plan de 06/11/2026.','2026-11-06','Entrega da Fábrica','https://github.com/GrowthAfinz/GaaS-Framework-Afinz/pull/77','{}'::text[]),
 ('VDV-BUILD-2','PREPARAÇÃO executada na versão de 03/11','Somente passos 02, 03, 04 e 06 documentados. Import 01 e SQLs alterados continuam pendentes.','P1','concluida',array['Execução da versão de referência documentada'],'Runbook registra a execução em 03/11/2026 e 130.175 CPFs aptos. Não inclui as mudanças propostas.','2026-11-03','Runbook da automação','04-Operacao/Automacao-VDV-Pool-de-Ofertas.md','{}'::text[]),
 ('VDV-BUILD-3','Estratégia e ficha técnica publicadas na Wiki','Fluxos, nove DEs e nove atividades documentados; estado dos SQLs separado.','P2','concluida',array['Nota publicada com referências conferidas'],'PR 82 e sincronização 7d7f0c24-e164-4d11-b786-1f99d6a966f2; 40 links resolvidos, sem exclusões.','2026-11-06','Publicação da estratégia','https://github.com/GrowthAfinz/GaaS-Framework-Afinz/pull/82','{}'::text[]),
 ('VDV-SEED-1','Conferir ambiente e cargas mínimas no SFMC','Registrar BU/MID, DEs de teste, chave de contato, versão e carga mínima. Não exige ativar rotação perene.','P0','backlog',array['BU/MID e DEs de teste identificadas','Contrato de 41 colunas do catálogo e 6 da vitrine conferido','Carga de teste e chave de contato verificadas'],null,null,'Ficha técnica','05-Estrategia/Estrategia-Pool-de-Ofertas-Visa.md','{}'::text[]),
 ('VDV-SEED-2','Preparar seedlist e matriz de cenários','Contatos autorizados de teste; quatro grupos e dois toques, parceiros com/sem arte, nome vazio, oferta inválida/reserva e exclusão do controle.','P0','backlog',array['Destinatários da seedlist conferidos','MODA, SAUDE_BELEZA, FAMILIA_PRESENTES e GENERICO nos dois toques','Parceiro com/sem hero e fallback de nome','Oferta inválida e reserva verificáveis','Controle excluído do público de envio'],null,null,'Regras do template','04-Operacao/Emails-Dinamicos-Vai-de-Visa.md','{}'::text[]),
 ('VDV-SEED-3','Executar Test Send V1 e V2 na seedlist','Registrar configuração, versão, data, destinatários de teste e evidência do envio.','P1','backlog',array['V1 e V2 enviados apenas à seedlist conferida','Evidências de execução registradas'],null,null,'Plano de comunicação','04-Operacao/Plano-de-Comunicacao-Pool-Vai-de-Visa.md',array['VDV-PLAN-1','VDV-PLAN-2','VDV-PLAN-4','VDV-SEED-1','VDV-SEED-2']),
 ('VDV-SEED-4','Resolver falhas e validar o piloto na seedlist','Registrar falhas encontradas, correções, reteste quando necessário e aprovação do piloto de 3 cards.','P1','backlog',array['Falhas resolvidas ou limitações explicitamente aceitas','Reteste e aprovação registrados'],null,null,'Estratégia do piloto','05-Estrategia/Estrategia-Pool-de-Ofertas-Visa.md',array['VDV-SEED-3','VDV-PLAN-3'])
 ) as v(key,title,description,priority,status,criteria,evidence,done,reference_label,reference,dependencies)
 on conflict(task_key) do nothing;
end $seed$;
commit;
