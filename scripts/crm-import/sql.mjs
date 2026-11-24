import { jsonSql, literal, uuid } from './common.mjs';
import { validatePlan } from './plan.mjs';
import { schemaExpression, rpcExpression, triggerExpression, mappingExpression } from './snapshot.mjs';
const q=literal;
export function stageRows(plan) {
  validatePlan(plan);
  return plan.changes.map(c=>({id:uuid(plan.runId+c.key),run_id:plan.runId,status:'ready',domain:c.domain,target_table:c.table,target_record_id:c.targetId,operation_type:c.operation,idempotency_key:uuid(plan.sourceHash+c.key),confidence:c.confidence,proposed_activity_update:{...c.payload,id:c.targetId},validation_after_save:{expected_hash:c.expectedHash,plan_id:plan.planId},review_notes:c.governance.join('; ')}));
}
export function stageSql(plan,summary) {
  const rows=stageRows(plan);
  const queries=[`insert into public.gaas_update_runs(id,source_type,source_label,status,domain,summary,warnings) values(${q(plan.runId)},'csv',${q(plan.sourceName)},'reviewing','total_crm',${jsonSql(summary)},${jsonSql(summary.warnings??[])}) on conflict(id) do nothing`];
  // Byte limit, rather than row count: opt-out taxonomies and multibyte journey names vary greatly.
  let batch=[];
  const flush=()=>{if(!batch.length)return;queries.push(`insert into public.gaas_update_candidates(id,run_id,status,domain,target_table,target_record_id,operation_type,idempotency_key,confidence,proposed_activity_update,validation_after_save,review_notes) select id,run_id,status,domain,target_table,target_record_id,operation_type,idempotency_key,confidence,proposed_activity_update,validation_after_save,review_notes from jsonb_populate_recordset(null::public.gaas_update_candidates,${jsonSql(batch)}) on conflict(id) do nothing`);batch=[];};
  for(const row of rows){if(batch.length&&Buffer.byteLength(JSON.stringify([...batch,row]),'utf8')>350000)flush();batch.push(row);}flush();
  return queries;
}
export const stageHashSql=runId=>`select md5(coalesce(string_agg(to_jsonb(c)::text,',' order by id),'')) as hash,count(*) as count from public.gaas_update_candidates c where run_id=${q(runId)}::uuid`;
export function verificationSql(runId) {
  return `with candidates as (select * from public.gaas_update_candidates where run_id=${q(runId)}::uuid and status='applied'), live as (
    select c.*,to_jsonb(t) live,to_jsonb(jsonb_populate_record(null::public.activities,c.proposed_activity_update)) typed from candidates c left join public.activities t on t.id=c.target_record_id::uuid where c.target_table='activities'
    union all select c.*,to_jsonb(t) live,to_jsonb(jsonb_populate_record(null::public.rentabilizacao_activities,c.proposed_activity_update)) typed from candidates c left join public.rentabilizacao_activities t on t.id=c.target_record_id::uuid where c.target_table='rentabilizacao_activities'
  ) select (select status from public.gaas_update_runs where id=${q(runId)}::uuid) status,(select (summary->>'applied')::integer from public.gaas_update_runs where id=${q(runId)}::uuid) expected_applied,count(*) applied,count(*) filter(where live is null) missing_targets,count(*) filter(where live is distinct from after_payload) audit_drift,
  (select count(*) from live l cross join lateral jsonb_object_keys(l.proposed_activity_update) f where f not in ('updated_at','CAC','Custo Total Campanha','Custo total canal','Custo unitário do canal') and l.live->f is distinct from l.typed->f) mismatched_fields from live`;
}
export function applySql(plan,stageHash) {
  validatePlan(plan);
  const run=q(plan.runId)+'::uuid', count=plan.changes.length;
  return `begin;
set local statement_timeout='120s';set local lock_timeout='10s';
lock table public.activities,public.rentabilizacao_activities in share row exclusive mode;
lock table public.crm_structure_cards in share mode;
do $crm_csv$
declare c record;current_row jsonb;saved_row jsonb;payload jsonb;columns_sql text;exists_dispatch boolean;processed integer:=0;actual_hash text;
begin
  perform pg_advisory_xact_lock(hashtext(${q(plan.runId)}));
  if (select summary->>'planId' from public.gaas_update_runs where id=${run}) is distinct from ${q(plan.planId)} then raise exception 'Plan identity mismatch'; end if;
  if (select status from public.gaas_update_runs where id=${run})='applied' then
    for c in select * from public.gaas_update_candidates where run_id=${run} and status='applied' loop
      if c.target_table not in ('activities','rentabilizacao_activities') then raise exception 'Invalid replay table'; end if;
      execute format('select to_jsonb(t) from public.%I t where id=$1::uuid',c.target_table) into current_row using c.target_record_id;
      if current_row is distinct from c.after_payload then raise exception 'Applied target changed; regenerate plan: %',c.target_record_id; end if;
      processed:=processed+1;
    end loop;
    if processed<>${count} then raise exception 'Incomplete applied receipt'; end if;
    return;
  end if;
  if ${schemaExpression}<>${q(plan.contract.schemaHash)} or ${rpcExpression}<>${q(plan.contract.rpcHash)} or ${triggerExpression}<>${q(plan.contract.triggerHash)} or ${mappingExpression}<>${q(plan.contract.mappingHash)} then raise exception 'Database contract changed; regenerate plan'; end if;
  select md5(coalesce(string_agg(to_jsonb(t)::text,',' order by id),'')) into actual_hash from public.gaas_update_candidates t where run_id=${run};
  if actual_hash is distinct from ${q(stageHash)} or (select count(*) from public.gaas_update_candidates where run_id=${run})<>${count} then raise exception 'Staging integrity mismatch'; end if;
  for c in select * from public.gaas_update_candidates where run_id=${run} order by id loop
    if c.target_table not in ('activities','rentabilizacao_activities') or c.status<>'ready' or c.validation_after_save->>'plan_id'<>${q(plan.planId)} then raise exception 'Invalid staged candidate'; end if;
    payload=c.proposed_activity_update||jsonb_build_object('updated_at',now());
    execute format('select to_jsonb(t) from public.%I t where id=$1::uuid',c.target_table) into current_row using c.target_record_id;
    if c.operation_type='update' then
      if current_row is null or md5(current_row::text) is distinct from c.validation_after_save->>'expected_hash' then raise exception 'Concurrent change: %',c.target_record_id; end if;
      if c.target_table='activities' then perform public.bulk_update_activities_from_json(jsonb_build_array(payload));
      else
        select string_agg(format('%I',key),',' order by key) into columns_sql from jsonb_each(payload) where key<>'id';
        execute format('update public.%I set (%s)=(select %s from jsonb_populate_record(null::public.%I,$1)) where id=$2::uuid',c.target_table,columns_sql,columns_sql,c.target_table) using payload,c.target_record_id;
      end if;
    elsif c.operation_type='insert' then
      if current_row is not null or c.validation_after_save->>'expected_hash' is not null then raise exception 'Insert target already exists'; end if;
      execute format('select exists(select 1 from public.%I where lower(trim("Activity name / Taxonomia"))=lower(trim($1)) and "Canal"=$2 and "Data de Disparo"=$3::timestamptz %s)',c.target_table,case when c.target_table='activities' then 'and regexp_replace(upper(trim(jornada)),''^JOR_AQUISICAO_'',''JOR_AQS_'')=regexp_replace(upper(trim($4)),''^JOR_AQUISICAO_'',''JOR_AQS_'')' else '' end) into exists_dispatch using payload->>'Activity name / Taxonomia',payload->>'Canal',payload->>'Data de Disparo',payload->>'jornada';
      if exists_dispatch then raise exception 'Dispatch already exists'; end if;
      select string_agg(format('%I',key),',' order by key) into columns_sql from jsonb_each(payload);
      execute format('insert into public.%I (%s) select %s from jsonb_populate_record(null::public.%I,$1)',c.target_table,columns_sql,columns_sql,c.target_table) using payload;
    else raise exception 'Unsupported operation'; end if;
    execute format('select to_jsonb(t) from public.%I t where id=$1::uuid',c.target_table) into saved_row using c.target_record_id;
    if saved_row is null then raise exception 'Missing saved target'; end if;
    update public.gaas_update_candidates set status='applied',before_payload=current_row,after_payload=saved_row,applied_at=now(),reviewed_at=now(),activity_id=case when c.target_table='activities' then c.target_record_id::uuid end,validation_after_save=jsonb_build_object('saved',true,'plan_id',${q(plan.planId)}) where id=c.id;
    processed:=processed+1;
  end loop;
  if processed<>${count} then raise exception 'Applied count mismatch'; end if;
  update public.gaas_update_runs set status='applied',updated_at=now(),summary=summary||jsonb_build_object('applied',processed,'appliedAt',now()) where id=${run};
end $crm_csv$;
commit;
${verificationSql(plan.runId)};`;
}
