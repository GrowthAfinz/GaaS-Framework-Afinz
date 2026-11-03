import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {fixture} from './development-test-fixture.mjs';
const migration=suffix=>readFileSync('supabase/migrations/'+readdirSync('supabase/migrations').find(f=>f.endsWith(suffix)),'utf8');
async function setup(){const f=await fixture();await f.db.exec(migration('_tasks_four_fronts.sql'));await f.db.exec(migration('_work_attention_lifecycle.sql'));await f.db.exec(migration('_initiative_workbench.sql'));const save=async(body,id=null,rev=null)=>(await f.db.query('select growth_save_work_initiative($1,$2,$3) n',[id,rev,JSON.stringify(body)])).rows[0].n;const decide=async(i,title='Configuração da primeira safra',body='Três ofertas por grupo, conforme contexto revisado.',supersedes=null)=>(await f.db.query('select growth_record_initiative_decision($1,$2,$3,$4,$5,$6) n',[i.id,i.revision,title,body,null,supersedes])).rows[0].n;return {...f,project:save,decide};}
test('initiative context is versioned, concurrent writes conflict and unsafe references are rejected',async()=>{
 const {db,project}=await setup();try{
 const p=await project({title:'Iniciativa sintética',workspace:'monetization'});assert.equal(p.phase,'context');
 const updated=await project({phase:'preparation',guiding_question:'Qual comportamento queremos melhorar?',context_links:[{label:'Desenho do teste',url:'05-Estrategia/Teste.md',kind:'note',state:'confirmed'}]},p.id,1);
 assert.equal(updated.phase,'preparation');assert.equal(updated.revision,2);
 await assert.rejects(project({phase:'reading'},p.id,1),/revision_conflict/);
 await assert.rejects(project({context_links:[{label:'Referência',url:'javascript:alert(1)'}]},p.id,2),/invalid_work_link/);
 const old=(await db.query('select after_data from growth_work_initiative_events where initiative_id=$1 and revision=1',[p.id])).rows[0].after_data;assert.equal(old.phase,'context');
 }finally{await db.close();}
});
test('decisions and corrections preserve originals and reject cross-initiative substitution',async()=>{
 const {db,project,decide}=await setup();try{
 const p=await project({title:'Iniciativa do teste',workspace:'monetization'});const first=await decide(p);
 assert.equal(first.initiative.revision,2);assert.ok(first.decision.actor_id);
 await assert.rejects(decide(p),/revision_conflict/);
 const revised=await decide(first.initiative,'Configuração revisada','Novo fundamento, preservando a versão anterior.',first.decision.id);
 assert.equal(revised.decision.supersedes,first.decision.id);
 assert.equal((await db.query('select count(*)::int n from growth_work_initiative_decisions')).rows[0].n,2);
 const other=await project({title:'Outra iniciativa',workspace:'cross_sell'});await assert.rejects(decide(other,'Outra decisão','Fundamento completo.',first.decision.id),/invalid_decision_origin/);
 }finally{await db.close();}
});
test('non-admin and anonymous cannot record decisions or edit their immutable rows',async()=>{
 const {db,project,decide}=await setup();try{
 const p=await project({title:'Iniciativa restrita',workspace:'sdd'});
 await db.exec("select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',false);set role authenticated;");
 await assert.rejects(decide(p),/access_denied/);assert.equal((await db.query('select * from growth_work_initiative_decisions')).rows.length,0);
 await assert.rejects(db.exec("update growth_work_initiative_decisions set title='Mutação direta'"),/permission denied/);
 await db.exec('reset role;set role anon;');await assert.rejects(decide(p),/permission denied/);
 }finally{await db.close();}
});
