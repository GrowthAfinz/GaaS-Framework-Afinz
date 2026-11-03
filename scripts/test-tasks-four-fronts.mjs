import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {fixture} from './development-test-fixture.mjs';
const migration=readFileSync('supabase/migrations/'+readdirSync('supabase/migrations').find(f=>f.endsWith('_tasks_four_fronts.sql')),'utf8');
async function setup(){const f=await fixture();await f.db.exec(migration);await f.db.exec(readFileSync('supabase/migrations/'+readdirSync('supabase/migrations').find(f=>f.endsWith('_work_attention_lifecycle.sql')),'utf8'));return f;}
test('preserves old identities, handles four spaces, deduplicates notices and ignores routine edits',async()=>{
 const {db,save}=await setup();try{
 const t=await save({title:'Preparar campanha Visa',workspace:'monetization',work_type:'task',related_workspaces:['cross_sell'],acceptance_criteria:['Evidência de preparo']});
 assert.equal(t.workspace,'monetization');assert.equal((await db.query('select count(*)::int n from growth_loop_items')).rows[0].n,0);
 const ready=await save({status:'pronta',next_action:'Revisar preparação'},t.id,t.revision);
 let notice=(await db.query('select * from growth_loop_items')).rows[0];assert.equal(notice.front,'crm_monetization');
 const checked=await save({completed_criteria:[0]},t.id,ready.revision);
 assert.equal((await db.query('select notice_revision from growth_loop_items')).rows[0].notice_revision,notice.notice_revision);
 await save({status:'concluida',resolution:'Preparação verificada'},t.id,checked.revision);
 assert.equal((await db.query('select count(*)::int n from growth_loop_items')).rows[0].n,1);
 assert.equal((await db.query('select state from growth_loop_items')).rows[0].state,'resolved');
 assert.equal((await db.query('select count(*)::int n from growth_development_task_events')).rows[0].n,4);
 }finally{await db.close();}
});
test('experiment needs versioned design, cannot close without reading, and preserves earlier configuration',async()=>{
 const {db,save}=await setup();try{
 const t=await save({title:'Afinidade versus genérico',workspace:'monetization',work_type:'experiment',details:{phase:'design',configuration_version:'Geral: quatro ofertas'}});
 await assert.rejects(save({details:{phase:'ready'}},t.id,1),/experiment_design_required/);
 const design={hypothesis:'Personalização gera mais uso',population:'Clientes elegíveis',allocation:'CPF sorteado estável',cells:'A, B e controle',configuration_version:'BF: três ofertas',metric:'Compra / CPFs alocados',window:'30 dias após envio',source:'Fonte de compra pendente',decision_rule:'Revisar diferenças e incerteza',phase:'reading'};
 const reading=await save({details:design},t.id,1);
 await assert.rejects(save({status:'concluida'},t.id,reading.revision),/experiment_close_required/);
 await assert.rejects(save({details:{...design,phase:'closed'}},t.id,reading.revision),/experiment_reading_required/);
 const closed=await save({details:{...design,phase:'closed',verdict:'inconclusive',reading:'Sem cobertura suficiente para concluir.'}},t.id,reading.revision);
 assert.equal(closed.details.verdict,'inconclusive');
 const first=(await db.query('select after_data from growth_development_task_events where task_id=$1 and revision=1',[t.id])).rows[0].after_data;
 assert.equal(first.details.configuration_version,'Geral: quatro ofertas');
 }finally{await db.close();}
});
test('initiative concurrency, non-admin access, unsafe links, spec readiness and changed criteria are guarded',async()=>{
 const {db,save}=await setup();try{
 const project=async(body,id=null,rev=null)=>(await db.query('select growth_save_work_initiative($1,$2,$3) n',[id,rev,JSON.stringify(body)])).rows[0].n;
 const p=await project({title:'Pool Vai de Visa',workspace:'monetization'});await project({description:'Contexto revisado'},p.id,1);
 await assert.rejects(project({description:'Sobrescrita antiga'},p.id,1),/revision_conflict/);
 const t=await save({title:'Spec de rastreabilidade',work_type:'spec',initiative_id:p.id,acceptance_criteria:['Contrato anterior']});
 await assert.rejects(save({status:'em_execucao'},t.id,1),/spec_design_required/);
 await assert.rejects(save({links:[{label:'Perigoso',url:'javascript:alert(1)',kind:'evidence',state:'confirmed'}]},t.id,1),/invalid_work_link/);
 const revised=await save({acceptance_criteria:['Contrato revisado'],completed_criteria:[0]},t.id,1);assert.deepEqual(revised.completed_criteria,[]);
 await db.exec("select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',false);set role authenticated;");
 assert.equal((await db.query('select * from growth_work_initiatives')).rows.length,0);
 await assert.rejects(project({title:'Iniciativa indevida',workspace:'sdd'}),/access_denied/);
 await assert.rejects(db.exec("insert into growth_work_initiatives(title,workspace) values('Direto','sdd')"),/permission denied/);
 }finally{await db.close();}
});

test('clearing an attention request resolves it and changing ownership updates its front',async()=>{
 const {db,save}=await setup();try{
 const t=await save({title:'Pedido de revisão editorial',workspace:'sdd',details:{attention:'proposal'}});
 const cleared=await save({workspace:'monetization',details:{attention:'none'}},t.id,1);
 const n=(await db.query('select state,front from growth_loop_items')).rows[0];assert.equal(n.state,'resolved');assert.equal(n.front,'crm_monetization');
 await save({details:{attention:'decision'}},t.id,cleared.revision);
 assert.equal((await db.query('select state from growth_loop_items')).rows[0].state,'needs_review');
 }finally{await db.close();}
});
