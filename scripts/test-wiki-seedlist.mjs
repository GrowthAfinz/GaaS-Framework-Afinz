import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {fixture} from './development-test-fixture.mjs';
const migration=suffix=>readFileSync('supabase/migrations/'+readdirSync('supabase/migrations').find(f=>f.endsWith(suffix)),'utf8');
async function setup(){
 const f=await fixture();await f.db.exec(migration('_tasks_four_fronts.sql'));await f.db.exec(migration('_work_attention_lifecycle.sql'));
 await f.db.exec(`insert into growth_work_initiatives(title,workspace,source_note,created_by) values('Visa sintético','monetization','10-Resultados/Iniciativas/Iniciativa-Pool-de-Ofertas-Vai-de-Visa.md',auth.uid());`);
 await f.db.exec(migration('_wiki_seedlist_checklist.sql'));return f;
}
test('completion gets a business date, edits preserve it, reopening keeps the old date in audit',async()=>{
 const {db,save}=await setup();try{
 const task=await save({title:'Atividade de teste',acceptance_criteria:['Critério'],completed_criteria:[0]});
 await assert.rejects(save({status:'concluida'},task.id,task.revision),/completion_evidence/);
 const done=await save({status:'concluida',resolution:'Evidência do teste'},task.id,task.revision);
 assert.equal((await save({details:done.details},done.id,done.revision)).revision,done.revision);
 const today=(await db.query("select (now() at time zone 'America/Sao_Paulo')::date::text as business_date")).rows[0].business_date;
 assert.equal(done.details.completed_on,today);
 const edited=await save({description:'Descrição revista'},done.id,done.revision);assert.equal(edited.details.completed_on,today);
 const dated=await save({details:{...edited.details,completed_on:'2026-11-03'}},edited.id,edited.revision);assert.equal(dated.details.completed_on,'2026-11-03');
 await assert.rejects(save({details:{...dated.details,completed_on:'2099-01-01'}},dated.id,dated.revision),/completion_date/);
 await assert.rejects(save({description:'Revisão concorrente'},dated.id,1),/revision_conflict/);
 const reopened=await save({status:'planejando'},dated.id,dated.revision);assert.equal(reopened.details.completed_on,undefined);
 const old=(await db.query('select after_data from growth_development_task_events where task_id=$1 and revision=$2',[dated.id,dated.revision])).rows[0].after_data;
 assert.equal(old.details.completed_on,'2026-11-03');assert.equal(old.status,'concluida');
 const legacy=(await db.query("insert into growth_development_tasks(task_key,title,status,created_by,acceptance_criteria,completed_criteria,resolution) values('LEGACY-DONE','Conclusão histórica sem data','concluida',auth.uid(),array['Aceite'],array[0],'Evidência antiga sem data de conclusão') returning *")).rows[0];
 assert.equal((await save({description:'Edição posterior'},legacy.id,legacy.revision)).details.completed_on,undefined);
 }finally{await db.close();}
});
test('seed is additive and idempotent; dependencies, non-admin and anonymous guards survive',async()=>{
 const {db,save}=await setup();try{
 assert.equal((await db.query("select count(*)::int n from growth_development_tasks where status='concluida'")).rows[0].n,3);
 const row=(await db.query("select * from growth_development_tasks where task_key='VDV-SEED-1'")).rows[0];
 const edited=await save({description:'Texto humano preservado'},row.id,row.revision);
 await db.exec(migration('_wiki_seedlist_checklist.sql'));
 assert.equal((await db.query('select description from growth_development_tasks where id=$1',[row.id])).rows[0].description,edited.description);
 assert.equal((await db.query('select count(*)::int n from growth_development_tasks')).rows[0].n,7);
 const ready=await save({title:'Dependência sintética',task_key:'DEP-TEST',acceptance_criteria:['Aceite']});
 const dependent=await save({title:'Teste dependente',dependencies:[ready.task_key],acceptance_criteria:['Aceite'],completed_criteria:[0]});
 await assert.rejects(save({status:'concluida',resolution:'Teste'},dependent.id,dependent.revision),/dependencies_pending/);
 await db.exec("select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',false);set role authenticated;");
 await assert.rejects(save({description:'Sem acesso'},row.id,edited.revision),/access_denied/);
 await assert.rejects(db.exec("update growth_development_tasks set status='concluida'"),/permission denied/);
 await db.exec("reset role;select set_config('request.jwt.claim.sub','',false);set role anon;");
 await assert.rejects(save({title:'Não autorizado'}),/permission denied|access_denied/);
 }finally{await db.close();}
});
