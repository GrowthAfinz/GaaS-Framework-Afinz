begin;

-- Compiled definitions come from the portfolio skill catalog. No source facts or note text are seeded.
create table growth_data.report_contracts (
  query_contract text not null,
  version text not null,
  domain text not null,
  status text not null check(status in ('ready','planned')),
  definition jsonb not null,
  primary key(query_contract,version)
);
alter table growth_data.report_contracts enable row level security;
revoke all on growth_data.report_contracts from public,anon,authenticated;

-- BEGIN GENERATED REPORT CONTRACTS
-- catalog 0.2.0; contracts sha256 2816b80672c9a27651c16399b7c1c309c3120a4870151e70faa5714a8dbd941d
insert into growth_data.report_contracts(query_contract,version,domain,status,definition) values('insurance.monthly','1','insurance','ready','{"query_contract":"insurance.monthly","version":"1","domain":"insurance","status":"ready","title":"Acompanhamento de Seguros","upstream_dataset_ids":["insurance_dispatch","insurance_contract_event","insurance_lp_event","insurance_outcome","insurance_traffic","insurance_investment","media_aggregate"],"output_consumers":["Seguros: Overview / Diario / Mensal / Evolucao e anomalias","Performance: Resumo Comite","Comite 30/10: slides 8-10"],"definition_owner":"Time GaaS Afinz","refresh_policy":"certified_snapshot_only","editorial_policy":"existing_knowledge_contribution_review","note_dependencies":[{"relative_path":"10-Resultados/Mecanicas/Seguros.md","relationship":"consumes","activation":"on_first_certified_snapshot","editorial_owner":"Time GaaS Afinz"}],"default_note_scope":{"metrics":["contracts_digital","registrations_digital","cost_per_contract"],"periods":["window_total"]}}'::jsonb);
insert into growth_data.report_contracts(query_contract,version,domain,status,definition) values('portfolio.monthly','1','portfolio','planned','{"query_contract":"portfolio.monthly","version":"1","domain":"portfolio","status":"planned","title":"Carteira, uso e retencao","upstream_dataset_ids":["insurance_stock","portfolio_stock","portfolio_retention","portfolio_usage","portfolio_cohort","portfolio_engagement","portfolio_revenue"],"output_consumers":["Radar Portfolio","Comite: carteira / uso / receita"],"definition_owner":"Time GaaS Afinz","refresh_policy":"certified_snapshot_only","editorial_policy":"existing_knowledge_contribution_review","note_dependencies":[{"relative_path":"10-Resultados/Dominios/Dominio-Rentabilizacao.md","relationship":"related_to","activation":"pending_contract_and_scope","editorial_owner":"Time GaaS Afinz"},{"relative_path":"10-Resultados/Mecanicas/Incentivo-ao-Uso.md","relationship":"related_to","activation":"pending_contract_and_scope","editorial_owner":"Time GaaS Afinz"},{"relative_path":"10-Resultados/Mecanicas/Ativacao-e-Boas-Vindas.md","relationship":"related_to","activation":"pending_contract_and_scope","editorial_owner":"Time GaaS Afinz"}]}'::jsonb);
insert into growth_data.report_contracts(query_contract,version,domain,status,definition) values('portfolio.scenarios','1','portfolio','planned','{"query_contract":"portfolio.scenarios","version":"1","domain":"portfolio","status":"planned","title":"Cenarios e orcamento","upstream_dataset_ids":["insurance_budget","portfolio_projection"],"output_consumers":["Performance: cenarios","Radar: projecoes"],"definition_owner":"Time GaaS Afinz","refresh_policy":"certified_snapshot_only","editorial_policy":"existing_knowledge_contribution_review","note_dependencies":[{"relative_path":"10-Resultados/Dominios/Dominio-Rentabilizacao.md","relationship":"related_to","activation":"pending_contract_and_scope","editorial_owner":"Time GaaS Afinz"}]}'::jsonb);
insert into growth_data.report_contracts(query_contract,version,domain,status,definition) values('credit.monthly','1','credit','planned','{"query_contract":"credit.monthly","version":"1","domain":"credit","status":"planned","title":"Credito pessoal","upstream_dataset_ids":["credit_personal"],"output_consumers":["Comite: credito pessoal"],"definition_owner":"Time GaaS Afinz","refresh_policy":"certified_snapshot_only","editorial_policy":"existing_knowledge_contribution_review","note_dependencies":[{"relative_path":"10-Resultados/Mecanicas/Credito-e-Investimento.md","relationship":"related_to","activation":"pending_contract_and_scope","editorial_owner":"Time GaaS Afinz"}]}'::jsonb);
insert into growth_data.report_contracts(query_contract,version,domain,status,definition) values('offers.monthly','1','offers','planned','{"query_contract":"offers.monthly","version":"1","domain":"offers","status":"planned","title":"Pool de ofertas","upstream_dataset_ids":["offers_pool","crm_pressure"],"output_consumers":["Radar: pool / pressao CRM","Comite: ofertas"],"definition_owner":"Time GaaS Afinz","refresh_policy":"certified_snapshot_only","editorial_policy":"existing_knowledge_contribution_review","note_dependencies":[{"relative_path":"10-Resultados/Iniciativas/Iniciativa-Pool-de-Ofertas-Parceiros.md","relationship":"related_to","activation":"pending_contract_and_scope","editorial_owner":"Time GaaS Afinz"},{"relative_path":"10-Resultados/Iniciativas/Iniciativa-Pool-de-Ofertas-Vai-de-Visa.md","relationship":"related_to","activation":"pending_contract_and_scope","editorial_owner":"Time GaaS Afinz"}]}'::jsonb);
insert into growth_data.report_contracts(query_contract,version,domain,status,definition) values('experiments.measurement','1','experiments','planned','{"query_contract":"experiments.measurement","version":"1","domain":"experiments","status":"planned","title":"Mensuracao de experimentos","upstream_dataset_ids":["experiment_measurement"],"output_consumers":["Comite: testes e proximos passos"],"definition_owner":"Time GaaS Afinz","refresh_policy":"certified_snapshot_only","editorial_policy":"existing_knowledge_contribution_review","note_dependencies":[]}'::jsonb);
insert into growth_data.report_contracts(query_contract,version,domain,status,definition) values('editorial.evidence','1','editorial','planned','{"query_contract":"editorial.evidence","version":"1","domain":"editorial","status":"planned","title":"Evidencias editoriais","upstream_dataset_ids":["editorial_evidence"],"output_consumers":["Narrativa do Report Live"],"definition_owner":"Time GaaS Afinz","refresh_policy":"certified_snapshot_only","editorial_policy":"existing_knowledge_contribution_review","note_dependencies":[{"relative_path":"05-Estrategia/Report-Live-Arquitetura-Editorial.md","relationship":"related_to","activation":"pending_contract_and_scope","editorial_owner":"Time GaaS Afinz"},{"relative_path":"08-Engenharia/Report-Live-Versionamento-e-Publicacao.md","relationship":"related_to","activation":"pending_contract_and_scope","editorial_owner":"Time GaaS Afinz"}]}'::jsonb);
-- END GENERATED REPORT CONTRACTS

create function growth_data.validate_report_scope(scope jsonb) returns void
language plpgsql immutable security invoker set search_path='' as $$
declare k text; v jsonb;
begin
  if scope is null or jsonb_typeof(scope)<>'object' then raise exception 'INVALID_REPORT_SCOPE'; end if;
  for k,v in select * from jsonb_each(scope) loop
    if k not in ('products','metrics','periods') or jsonb_typeof(v)<>'array' or jsonb_array_length(v) not between 1 and 1000 then raise exception 'INVALID_REPORT_SCOPE'; end if;
    if exists(select 1 from jsonb_array_elements(v) e where jsonb_typeof(e)<>'string' or length(e#>>'{}') not between 1 and 200) then raise exception 'INVALID_REPORT_SCOPE'; end if;
  end loop;
end $$;

create function growth_data.scoped_report_metrics(sid uuid, scope jsonb) returns jsonb
language sql stable security invoker set search_path='' as $$
  select coalesce(jsonb_agg(m order by m->>'product',m->>'period',m->>'code',m->>'source'),'[]')
  from growth_data.snapshots s cross join lateral jsonb_array_elements(coalesce(s.manifest->'metrics','[]')) m
  where s.id=sid
    and (not scope ? 'products' or scope->'products' ? (m->>'product'))
    and (not scope ? 'metrics' or scope->'metrics' ? (m->>'code'))
    and (not scope ? 'periods' or scope->'periods' ? (m->>'period'));
$$;

create function growth_data.read_report_data(sid uuid, scope jsonb default '{}', include_rows boolean default false) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare s growth_data.snapshots; writer boolean; contract growth_data.report_contracts;
begin
  perform growth_data.require_role();
  perform growth_data.validate_report_scope(scope);
  select * into strict s from growth_data.snapshots where id=sid;
  select * into contract from growth_data.report_contracts where domain=s.domain and status='ready' and query_contract=s.domain||'.monthly' and version='1';
  if not found then raise exception 'UNSUPPORTED_REPORT_CONTRACT'; end if;
  select role in ('analyst','publisher','admin') into writer from public.report_live_memberships where user_id=auth.uid() and active;
  if s.status<>'certified' and not coalesce(writer,false) then raise exception 'ACCESS_DENIED'; end if;
  return jsonb_build_object(
    'schema','gaas-report-data/1','query_contract',contract.query_contract,'query_version',contract.version,
    'snapshot',jsonb_build_object('id',s.id,'domain',s.domain,'hash',s.snapshot_hash,'status',s.status,'period_start',s.period_start,'period_end',s.period_end,'semantic_version',s.semantic_version,'certified_at',s.certified_at),
    'scope',scope,'metrics',growth_data.scoped_report_metrics(sid,scope),
    'issues',coalesce(s.manifest->'issues','[]'),'coverage',coalesce(s.manifest->'coverage','{}'),
    'sources',coalesce((select jsonb_agg(jsonb_build_object('name',x->>'name','sha256',x->>'sha256','storage_path',x->>'storage_path')) from jsonb_array_elements(coalesce(s.manifest->'sources','[]')) x),'[]'),
    'rows',case when include_rows and scope='{}'::jsonb then jsonb_build_object('dispatches',coalesce(s.manifest->'dispatches','[]'),'portfolio',coalesce(s.manifest->'portfolio','[]')) else '{"dispatches":[],"portfolio":[]}'::jsonb end);
end $$;

-- The registry controls defaults. A binding is a dependency, not a semantic wikilink.
create function growth_data.report_binding_defaults() returns trigger
language plpgsql security invoker set search_path='' as $$
declare c growth_data.report_contracts;
begin
  if new.target_kind<>'wiki_data_block' then return new; end if;
  select * into c from growth_data.report_contracts where query_contract=new.query_contract and version=new.query_version and status='ready';
  if not found then raise exception 'UNSUPPORTED_REPORT_CONTRACT'; end if;
  if new.filter_contract='{}'::jsonb then new.filter_contract:=coalesce(c.definition->'default_note_scope','{}'); end if;
  perform growth_data.validate_report_scope(new.filter_contract);
  new.target_locator:=jsonb_build_object('label',c.definition->>'title')||new.target_locator;
  return new;
end $$;
create trigger report_binding_defaults before insert on growth_data.content_bindings for each row execute function growth_data.report_binding_defaults();

create function growth_data.register_catalog_note_bindings() returns trigger
language plpgsql security definer set search_path='' as $$
declare dependency record;
begin
  for dependency in select c.query_contract,c.version,c.definition,n.id,n.content_hash
    from growth_data.report_contracts c cross join lateral jsonb_array_elements(c.definition->'note_dependencies') d
    join public.gaas_vault_notes n on n.relative_path=d->>'relative_path' and n.deleted_at is null
    where c.domain=new.domain and c.status='ready' and d->>'relationship'='consumes' loop
    insert into growth_data.content_bindings(binding_key,version,target_kind,template_key,template_version,target_locator,query_contract,query_version,filter_contract,note_id,note_base_hash,missing_policy,status,created_by)
      values(new.domain||'.wiki.'||dependency.id,1,'wiki_data_block','wiki','1',jsonb_build_object('block','report-data','label',dependency.definition->>'title','registry','portfolio-data-catalog/0.2.0'),dependency.query_contract,dependency.version,dependency.definition->'default_note_scope',dependency.id,dependency.content_hash,'show_unavailable','approved',new.created_by)
      on conflict(binding_key,version) do nothing;
  end loop;
  return new;
end $$;
create trigger register_catalog_note_bindings after insert on growth_data.snapshots for each row execute function growth_data.register_catalog_note_bindings();

create function growth_data.report_note_index() returns jsonb
language plpgsql stable security definer set search_path='' as $$
begin
  -- Wiki readers without reporting membership see no reporting dependencies.
  if auth.uid() is null or not exists(select 1 from public.report_live_memberships where user_id=auth.uid() and active and role in ('viewer','analyst','publisher','admin')) then return '[]'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('id',b.id,'note_id',b.note_id,'label',coalesce(b.target_locator->>'label',c.definition->>'title'),'query_contract',b.query_contract,'query_version',b.query_version,'scope',b.filter_contract,'missing_policy',b.missing_policy) order by b.binding_key,b.version)
    from growth_data.content_bindings b join growth_data.report_contracts c on c.query_contract=b.query_contract and c.version=b.query_version
    join public.gaas_vault_notes n on n.id=b.note_id and n.deleted_at is null
    where b.target_kind='wiki_data_block' and b.status='approved' and c.status='ready'
      and not exists(select 1 from growth_data.content_bindings newer where newer.binding_key=b.binding_key and newer.version>b.version and newer.status='approved')),'[]');
end $$;

create function growth_data.report_note_blocks(note uuid) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare binding jsonb; result jsonb:='[]'; sid uuid;
begin
  perform growth_data.require_role();
  for binding in select value from jsonb_array_elements(growth_data.report_note_index()) where value->>'note_id'=note::text loop
    select s.id into sid from growth_data.snapshots s join growth_data.snapshot_bindings sb on sb.snapshot_id=s.id
      where sb.binding_id=(binding->>'id')::uuid and s.status='certified'
      order by s.certified_at desc,s.created_at desc,s.id desc limit 1;
    result:=result||jsonb_build_array(jsonb_build_object('binding',binding,'data',case when sid is null then null else growth_data.read_report_data(sid,binding->'scope',false) end));
  end loop;
  return result;
end $$;

alter table public.growth_loop_items drop constraint growth_loop_items_kind_check;
alter table public.growth_loop_items add constraint growth_loop_items_kind_check check(kind in ('source','investigation','outcome','contribution','development_task','data_review'));

create or replace function public.growth_loop_can_access(p_kind text,p_source text) returns boolean
language sql stable security definer set search_path='' as $$
  select auth.uid() is not null and (public.gaas_vault_is_admin() or
    (p_kind='investigation' and exists(select 1 from public.growth_investigations i where i.id::text=p_source and public.growth_investigation_can_access(i.operation_id))) or
    (p_kind='contribution' and exists(select 1 from public.gaas_knowledge_contributions c where c.id::text=p_source and c.created_by=auth.uid())) or
    (p_kind='data_review' and exists(select 1 from public.gaas_vault_notes n where n.id::text=p_source and n.deleted_at is null) and exists(select 1 from public.report_live_memberships where user_id=auth.uid() and active and role in ('analyst','publisher','admin'))));
$$;

-- No LLM call and no editorial write: a certified version produces a deterministic review receipt.
create function growth_data.sync_report_note_impacts(sid uuid) returns integer
language plpgsql security definer set search_path='' as $$
declare s growth_data.snapshots; b record; n record; previous_id uuid; current_metrics jsonb; previous_metrics jsonb; current_signature text; previous_signature text; blocks jsonb; item uuid; count_items integer:=0;
begin
  select * into strict s from growth_data.snapshots where id=sid and status='certified';
  perform pg_advisory_xact_lock(hashtextextended('report-note-impact:'||s.domain,0));
  if not exists(select 1 from growth_data.report_contracts where domain=s.domain and status='ready') then return 0; end if;
  for n in select distinct note.id,note.relative_path,note.title,note.content_hash from growth_data.snapshot_bindings sb
    join growth_data.content_bindings cb on cb.id=sb.binding_id and cb.target_kind='wiki_data_block' and cb.status='approved'
    join public.gaas_vault_notes note on note.id=cb.note_id and note.deleted_at is null where sb.snapshot_id=sid loop
    blocks:='[]';
    for b in select cb.* from growth_data.snapshot_bindings sb join growth_data.content_bindings cb on cb.id=sb.binding_id
      join growth_data.report_contracts c on c.query_contract=cb.query_contract and c.version=cb.query_version and c.status='ready'
      where sb.snapshot_id=sid and cb.note_id=n.id and cb.target_kind='wiki_data_block' and cb.status='approved' order by cb.binding_key,cb.version loop
      current_metrics:=growth_data.scoped_report_metrics(sid,b.filter_contract);
      select old.id into previous_id from growth_data.snapshots old join growth_data.snapshot_bindings old_binding on old_binding.snapshot_id=old.id and old_binding.binding_id=b.id
        where old.id<>sid and old.status='certified' and old.domain=s.domain and (old.certified_at,old.created_at,old.id)<(s.certified_at,s.created_at,s.id)
        order by old.certified_at desc,old.created_at desc,old.id desc limit 1;
      previous_metrics:=case when previous_id is null then null else growth_data.scoped_report_metrics(previous_id,b.filter_contract) end;
      current_signature:=encode(sha256(convert_to(jsonb_build_array(current_metrics,s.period_start,s.period_end,s.semantic_version,s.manifest->'issues')::text,'UTF8')),'hex');
      select encode(sha256(convert_to(jsonb_build_array(previous_metrics,old.period_start,old.period_end,old.semantic_version,old.manifest->'issues')::text,'UTF8')),'hex') into previous_signature from growth_data.snapshots old where old.id=previous_id;
      insert into growth_data.note_impacts(snapshot_id,binding_id,note_id,base_content_hash,change_kind,evidence,status,created_by)
        values(sid,b.id,n.id,n.content_hash,'data_block',jsonb_build_object('snapshot_hash',s.snapshot_hash),'identified',s.created_by) on conflict do nothing;
      update growth_data.note_impacts set evidence=evidence||jsonb_build_object('data_signature',current_signature,'previous_signature',previous_signature,'previous_snapshot_id',previous_id),
        status=case when current_signature is not distinct from previous_signature then 'not_applicable' when base_content_hash<>n.content_hash then 'conflict' else 'ready' end
        where snapshot_id=sid and binding_id=b.id and note_id=n.id and change_kind='data_block' and status in ('identified','ready','conflict','not_applicable');
      if current_signature is distinct from previous_signature then
        blocks:=blocks||jsonb_build_array(jsonb_build_object('binding_id',b.id,'scope',b.filter_contract,'metrics',current_metrics,'previous_metrics',previous_metrics,'data_signature',current_signature));
      end if;
    end loop;
    if jsonb_array_length(blocks)>0 and exists(select 1 from public.growth_loop_settings where enabled) then
      item:=growth_loop_private.put('report-note:'||n.id||':'||s.period_start||':'||s.period_end,'data_review',n.id::text,s.domain,s.period_end,
        'Revisar acompanhamento de '||n.title,
        'Os dados de '||to_char(s.period_start,'DD/MM/YYYY')||' a '||to_char(s.period_end,'DD/MM/YYYY')||' mudaram. Confira se as conclusões da nota precisam acompanhar esta versão.',
        'Conferir os dados e preparar uma proposta apenas se o texto precisar mudar.','needs_review','?view=learning&section=vault&wiki_note='||n.id,30,
        jsonb_build_object('note_id',n.id,'note_path',n.relative_path,'base_content_hash',n.content_hash,'snapshot_id',sid,'snapshot_hash',s.snapshot_hash,'blocks',blocks,'issues',coalesce(s.manifest->'issues','[]')));
      count_items:=count_items+1;
    end if;
  end loop;
  return count_items;
end $$;

create function growth_data.report_certified_impacts() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  if new.status='certified' and old.status is distinct from 'certified' then perform growth_data.sync_report_note_impacts(new.id); end if;
  return new;
end $$;
create trigger report_certified_impacts after update of status on growth_data.snapshots for each row execute function growth_data.report_certified_impacts();

-- Preserve the established contribution transaction and its guards.
create or replace function public.growth_loop_submit_note(p_item uuid,p_revision integer,p_pack uuid,p_path text,p_base_hash text,p_markdown text) returns uuid language plpgsql security definer set search_path='' as $$
declare i public.growth_loop_items;n public.gaas_vault_notes;c uuid;h text;domain text;k text;expected_scope jsonb;begin
 select * into strict i from public.growth_loop_items where id=p_item for update;
 if not public.growth_loop_can_access(i.kind,i.source_id) then raise exception 'loop_access_denied';end if;
 if i.kind='investigation' and not exists(select 1 from public.growth_investigations x where x.id::text=i.source_id and public.growth_investigation_can_access(x.operation_id,true)) then raise exception 'loop_write_access_denied';end if;
 if i.revision is distinct from p_revision then raise exception 'loop_evidence_superseded';end if;
 select * into strict n from public.gaas_vault_notes where relative_path=p_path and deleted_at is null;
 if n.content_hash is distinct from p_base_hash then raise exception 'knowledge_stale_base';end if;
 if i.kind='data_review' then
 perform growth_data.require_role(true,false);
 if n.id::text is distinct from i.evidence->>'note_id' then raise exception 'note_outside_scope'; end if;
 if n.content_hash is distinct from i.evidence->>'base_content_hash' then raise exception 'knowledge_stale_base'; end if;
 if not exists(select 1 from growth_data.snapshots s join growth_data.note_impacts ni on ni.snapshot_id=s.id and ni.note_id=n.id where s.id::text=i.evidence->>'snapshot_id' and s.snapshot_hash=i.evidence->>'snapshot_hash' and s.status='certified') then raise exception 'loop_evidence_superseded'; end if;
 else
 domain:=case i.front when 'crm_acquisition' then 'crm' when 'paid_media' then 'media' when 'b2c_origin' then 'b2c' when 'rentabilization' then 'renta' else '' end;
 if coalesce(n.frontmatter->'analytics'->>'domain','')<>domain then raise exception 'note_outside_front';end if;
 end if;
 if i.kind='investigation' then select o.scope into expected_scope from public.growth_investigations x join public.growth_operations o on o.operation_id=x.operation_id where x.id::text=i.source_id;
 foreach k in array array['bu','segment','partner','channel'] loop
 if nullif(n.frontmatter->'analytics'->'scope'->>k,'') is not null and n.frontmatter->'analytics'->'scope'->>k is distinct from expected_scope->>k then raise exception 'note_outside_scope';end if;end loop;end if;
 if not exists(select 1 from public.gaas_knowledge_packs where id=p_pack and created_by=auth.uid()) then raise exception 'knowledge_pack_not_owned';end if;
 h:=encode(sha256(convert_to(p_markdown,'UTF8')),'hex');
 select contribution_id into c from public.growth_loop_note_links where item_id=i.id and revision=i.revision and path=p_path and expected_hash=h;
 if c is not null then return c;end if;
 c:=public.gaas_knowledge_submit(p_pack,'Resultado: '||left(i.title,140),'Proposta vinculada ao bloco '||i.id||', revisão '||i.revision||'. Exige revisão editorial e aplicação na fonte.',
 jsonb_build_array(jsonb_build_object('path',p_path,'base_hash',p_base_hash,'markdown',p_markdown,'expected_hash',h)));
 insert into public.growth_loop_note_links values(i.id,i.revision,p_path,h,c);
 if i.kind='data_review' then update growth_data.note_impacts set contribution_id=c,status='proposed' where snapshot_id::text=i.evidence->>'snapshot_id' and note_id=n.id and status in ('ready','conflict','proposed'); end if;
 return c;
end$$;

-- Existing contribution review remains the authority. Only a verified incorporation resolves the impact.
create function growth_data.report_contribution_reviewed() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  if new.status='incorporated' and old.status is distinct from new.status then
    update growth_data.note_impacts set status='applied' where contribution_id=new.id and status='proposed';
    update public.growth_loop_items i set state='resolved',updated_at=clock_timestamp()
      where i.kind='data_review'
        and exists(select 1 from public.growth_loop_note_links l where l.item_id=i.id and l.revision=i.revision and l.contribution_id=new.id)
        and exists(select 1 from growth_data.note_impacts ni where ni.snapshot_id::text=i.evidence->>'snapshot_id' and ni.note_id::text=i.evidence->>'note_id' and ni.contribution_id=new.id and ni.status='applied')
        and not exists(select 1 from growth_data.note_impacts ni where ni.snapshot_id::text=i.evidence->>'snapshot_id' and ni.note_id::text=i.evidence->>'note_id' and ni.status in ('ready','conflict','proposed'));
  end if;
  return new;
end $$;
create trigger report_contribution_reviewed after update of status on public.gaas_knowledge_contributions for each row execute function growth_data.report_contribution_reviewed();

create function growth_data.review_report_note_unchanged(item_id uuid,expected_revision integer,reason text) returns void
language plpgsql security definer set search_path='' as $$
declare i public.growth_loop_items; note_hash text;
begin
  perform growth_data.require_role(true,false);
  select * into strict i from public.growth_loop_items where id=item_id and kind='data_review' for update;
  if not public.growth_loop_can_access(i.kind,i.source_id) then raise exception 'loop_access_denied'; end if;
  if i.revision is distinct from expected_revision or i.state='resolved' then raise exception 'loop_evidence_superseded'; end if;
  if length(trim(coalesce(reason,''))) not between 20 and 2000 then raise exception 'REVIEW_REASON_REQUIRED'; end if;
  select content_hash into note_hash from public.gaas_vault_notes where id::text=i.evidence->>'note_id' and deleted_at is null;
  if note_hash is distinct from i.evidence->>'base_content_hash' then raise exception 'knowledge_stale_base'; end if;
  if exists(select 1 from public.growth_loop_note_links l join public.gaas_knowledge_contributions c on c.id=l.contribution_id where l.item_id=i.id and l.revision=i.revision and c.status in ('pending','changes_requested','approved')) then raise exception 'PENDING_EDITORIAL_CONTRIBUTION'; end if;
  update growth_data.note_impacts set status='not_applicable',evidence=evidence||jsonb_build_object('editorial_review',jsonb_build_object('decision','text_unchanged','reason',reason,'reviewed_by',auth.uid(),'reviewed_at',clock_timestamp()))
    where snapshot_id::text=i.evidence->>'snapshot_id' and note_id::text=i.evidence->>'note_id' and status in ('ready','conflict');
  perform growth_loop_private.put(i.episode_key,i.kind,i.source_id,i.front,i.period,i.title,'Os dados foram conferidos e o texto existente continua adequado.','Reabrir apenas se houver outra mudança relevante.','resolved',i.route,i.priority,
    i.evidence||jsonb_build_object('editorial_review',jsonb_build_object('decision','text_unchanged','reason',reason,'reviewed_by',auth.uid(),'reviewed_at',clock_timestamp())));
end $$;

-- Private definer code is reachable only through scoped invoker RPCs. No raw table grants.
revoke all on function growth_data.validate_report_scope(jsonb),growth_data.scoped_report_metrics(uuid,jsonb),growth_data.read_report_data(uuid,jsonb,boolean),growth_data.report_binding_defaults(),growth_data.register_catalog_note_bindings(),growth_data.report_note_index(),growth_data.report_note_blocks(uuid),growth_data.sync_report_note_impacts(uuid),growth_data.report_certified_impacts(),growth_data.report_contribution_reviewed() from public,anon,authenticated;
revoke all on function growth_data.review_report_note_unchanged(uuid,integer,text) from public,anon,authenticated;
grant execute on function growth_data.review_report_note_unchanged(uuid,integer,text) to authenticated;
grant execute on function growth_data.read_report_data(uuid,jsonb,boolean),growth_data.report_note_index(),growth_data.report_note_blocks(uuid) to authenticated;
create function public.report_data_read(p_snapshot_id uuid,p_scope jsonb default '{}',p_include_rows boolean default false) returns jsonb language sql stable security invoker set search_path='' as $$select growth_data.read_report_data(p_snapshot_id,p_scope,p_include_rows)$$;
create function public.report_data_note_index() returns jsonb language sql stable security invoker set search_path='' as $$select growth_data.report_note_index()$$;
create function public.report_data_note_blocks(p_note_id uuid) returns jsonb language sql stable security invoker set search_path='' as $$select growth_data.report_note_blocks(p_note_id)$$;
create function public.report_data_review_unchanged(p_item uuid,p_revision integer,p_reason text) returns void language sql security invoker set search_path='' as $$select growth_data.review_report_note_unchanged(p_item,p_revision,p_reason)$$;
revoke all on function public.report_data_review_unchanged(uuid,integer,text) from public,anon;
grant execute on function public.report_data_review_unchanged(uuid,integer,text) to authenticated;
revoke all on function public.report_data_read(uuid,jsonb,boolean),public.report_data_note_index(),public.report_data_note_blocks(uuid) from public,anon;
grant execute on function public.report_data_read(uuid,jsonb,boolean),public.report_data_note_index(),public.report_data_note_blocks(uuid) to authenticated;

commit;
