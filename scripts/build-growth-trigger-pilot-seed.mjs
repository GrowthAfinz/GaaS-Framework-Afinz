import {readFileSync,writeFileSync} from 'node:fs';
const base='docs/plans/learning-loop/release8/';
const payload=JSON.parse(readFileSync(base+'pilot-approved.json','utf8'));
const quote=v=>"'"+JSON.stringify(v).replaceAll("'","''")+"'::jsonb";
const operationKeys=[...Object.keys(payload.operations[0]),'confirmed_at'];
const ruleKeys=Object.keys(payload.rules[0]);
const sql=`-- Approved A0 pilot only. No broad seed, source correction, candidate or bet writes.
begin;
insert into public.growth_operations (${operationKeys.join(',')})
select ${operationKeys.join(',')} from jsonb_populate_recordset(null::public.growth_operations,
  (select jsonb_agg(jsonb_set(x,'{confirmed_at}',to_jsonb(statement_timestamp()))) from jsonb_array_elements(${quote(payload.operations)}) x));
insert into public.growth_trigger_rules (${ruleKeys.join(',')})
select ${ruleKeys.join(',')} from jsonb_populate_recordset(null::public.growth_trigger_rules,${quote(payload.rules)});
insert into public.growth_trigger_runtime_config(version,operation_ids,rule_ids,certified_run_id,responsible_label,approval_ref,approved_by)
values(1,array[${payload.operation_ids.map(x=>"'"+x+"'").join(',')}],array[${payload.rules.map(r=>"'"+r.rule_id+"'").join(',')}],
  '9bb55892-4b17-4f76-825a-0ac97c92b525',${"'"+payload.responsible_label+"'"},${"'"+payload.approval_ref+"'"},'Pablo Prado');
insert into public.growth_trigger_runtime_settings(id,config_version,observation_enabled) values('pilot',1,false);
commit;
`;
if(process.argv.includes('--check')){
  if(readFileSync(base+'pilot-seed.sql','utf8').replaceAll('\r\n','\n')!==sql)throw new Error('Pilot seed drift');
}else writeFileSync(base+'pilot-seed.sql',sql);
console.log('Pilot seed: 2 confirmed operations, 9 observation rules; runtime initially disabled.');
