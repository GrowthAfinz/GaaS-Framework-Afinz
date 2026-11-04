import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {fixture} from './development-test-fixture.mjs';
const migration=suffix=>readFileSync('supabase/migrations/'+readdirSync('supabase/migrations').find(f=>f.endsWith(suffix)),'utf8');
const admin='11111111-1111-4111-8111-111111111111',other='22222222-2222-4222-8222-222222222222';
async function setup(){
 const f=await fixture();const {db}=f;
 await db.exec(migration('_tasks_four_fronts.sql'));await db.exec(migration('_work_attention_lifecycle.sql'));await db.exec(migration('_initiative_workbench.sql'));
 await db.exec(`create table public.gaas_knowledge_contributions(id uuid primary key default gen_random_uuid());
 create table public.gaas_vault_notes(id uuid primary key default gen_random_uuid(),relative_path text,content_hash text,deleted_at timestamptz,indexed_at timestamptz default now());
 insert into public.gaas_vault_notes(relative_path,content_hash) values('01-Conceitos/CAC.md','abcdef0123456789');`);
 await db.exec(migration('_corrections_and_improvements.sql'));
 const as=async who=>{await db.exec('reset role');await db.exec(`select set_config('request.jwt.claim.sub','${who}',false)`);await db.exec('set role authenticated');};
 const one=async(sql,params=[])=>(await db.query(sql,params)).rows[0];
 const create=async(body={})=>(await one('select gaas_feedback_create($1) r',[JSON.stringify({body:'A dispersão de CAC diverge entre notas.',page_label:'Wiki',surface:'wiki',target_type:'note',target_id:'01-Conceitos/CAC.md',anchor:{exact:'dispersão de ~3,2x',prefix:'canal: há ',suffix:' entre'},...body})])).r;
 return {...f,as,one,create};
}
test('any team member creates, edits and deletes any comment, and deletion leaves no trace',async()=>{
 const {db,as,one,create}=await setup();try{
  await as(other);const item=await create();
  assert.equal(item.status,'open');assert.equal(item.anchor_state,'anchored');assert.equal(item.created_by,other);
  await as(admin);const edited=(await one('select gaas_feedback_edit($1,$2,$3) r',[item.id,1,JSON.stringify({body:'Texto revisado por outra pessoa.',front:'Aquisição CRM'})])).r;
  assert.equal(edited.revision,2);assert.equal(edited.updated_by,admin);
  await assert.rejects(one('select gaas_feedback_edit($1,$2,$3) r',[item.id,1,'{}']),/revision_conflict/);
  await as(other);assert.equal((await one('select gaas_feedback_toggle_vote($1) n',[item.id])).n,1);
  const att=(await one('select gaas_feedback_add_attachment($1,$2,$3,$4,$5) r',[item.id,`${item.id}/33333333-3333-4333-8333-333333333333.png`,'print.png','image/png',2048])).r;assert.ok(att.id);
  await assert.rejects(one('select gaas_feedback_add_attachment($1,$2,$3,$4,$5) r',[item.id,'44444444-4444-4444-8444-444444444444/33333333-3333-4333-8333-333333333334.png','x.png','image/png',10]),/attachment_path/);
  await as(admin);const paths=(await one('select gaas_feedback_delete($1) p',[item.id])).p;
  assert.deepEqual(paths,[`${item.id}/33333333-3333-4333-8333-333333333333.png`]);
  await db.exec('reset role');
  for(const t of ['gaas_feedback_items','gaas_feedback_votes','gaas_feedback_attachments','gaas_feedback_events'])assert.equal((await one(`select count(*)::int n from ${t}`)).n,0,t);
 }finally{await db.close();}
});
test('direct writes are blocked and anonymous users cannot create',async()=>{
 const {db,as,create}=await setup();try{
  await as(other);await create();
  await assert.rejects(db.exec("update gaas_feedback_items set status='applied'"),/permission denied/);
  await assert.rejects(db.exec("insert into gaas_feedback_votes values(gen_random_uuid(),'"+other+"')"),/permission denied/);
  await db.exec('reset role;set role anon;');await assert.rejects(create(),/permission denied/);
 }finally{await db.close();}
});
test('only the admin decides, claims and completes; edits send agreed work back to the conversation',async()=>{
 const {db,as,one,create}=await setup();try{
  await as(other);const item=await create();
  await assert.rejects(one('select gaas_feedback_record_decision($1,$2,$3,$4,$5) r',[item.id,'in_conversation',1,'Prioridade 1','claude']),/admin_required/);
  await as(admin);
  await assert.rejects(one('select gaas_feedback_record_decision($1,$2,$3,$4,$5) r',[item.id,'declined',null,'','claude']),/reason_required/);
  const decided=(await one('select gaas_feedback_record_decision($1,$2,$3,$4,$5) r',[item.id,'in_conversation',1,'Conferir no Supabase e corrigir.','claude'])).r;
  assert.equal(decided.priority,1);
  const claimed=(await one('select gaas_feedback_claim($1,$2) r',[item.id,'claude-code'])).r;assert.equal(claimed.status,'with_ai');
  await assert.rejects(one('select gaas_feedback_claim($1,$2) r',[item.id,'codex']),/not_claimable/);
  await assert.rejects(one('select gaas_feedback_complete($1,$2,$3,$4) r',[item.id,'55555555-5555-4555-8555-555555555555','proposal_ready','{"summary":"x"}']),/lease_invalid/);
  await as(other);const edited=(await one('select gaas_feedback_edit($1,$2,$3) r',[item.id,claimed.revision,JSON.stringify({body:'O pedido mudou depois da prioridade.'})])).r;
  assert.equal(edited.status,'in_conversation');assert.equal(edited.priority,null);assert.equal(edited.lease_token,null);
  await as(admin);await assert.rejects(one('select gaas_feedback_complete($1,$2,$3,$4) r',[item.id,claimed.lease_token,'proposal_ready','{"summary":"x"}']),/lease_invalid/);
  await one('select gaas_feedback_record_decision($1,$2,$3,$4,$5) r',[item.id,'in_conversation',2,'Retomar com o texto novo.','claude']);
  const again=(await one('select gaas_feedback_claim($1,$2) r',[item.id,'claude-code'])).r;
  await assert.rejects(one('select gaas_feedback_complete($1,$2,$3,$4) r',[item.id,again.lease_token,'proposal_ready','{}']),/summary_required/);
  const done=(await one('select gaas_feedback_complete($1,$2,$3,$4,$5) r',[item.id,again.lease_token,'proposal_ready',JSON.stringify({summary:'Exemplo acrescentado.',before:'a',after:'b'}),'https://github.com/x/y/pull/1'])).r;
  assert.equal(done.status,'proposal_ready');
  await assert.rejects(one('select gaas_feedback_review($1,$2,$3) r',[item.id,'reject','']),/reason_required/);
  assert.equal((await one('select gaas_feedback_review($1,$2,$3) r',[item.id,'approve',null])).r.status,'approved');
  assert.equal((await one('select gaas_feedback_mark_applied($1,$2) r',[item.id,null])).r.status,'applied');
  await db.exec('reset role');
  const events=(await db.query('select event from gaas_feedback_events where item_id=$1 order by created_at',[item.id])).rows.map(r=>r.event);
  assert.deepEqual(events,['created','decided','claimed','edited','decided','claimed','completed','reviewed','applied']);
 }finally{await db.close();}
});
test('deleting an item the AI is working on makes completion fail',async()=>{
 const {db,as,one,create}=await setup();try{
  await as(admin);const item=await create();
  await one('select gaas_feedback_record_decision($1,$2,$3,$4,$5) r',[item.id,'in_conversation',1,'Fazer agora.','codex']);
  const c=(await one('select gaas_feedback_claim($1,$2) r',[item.id,'codex'])).r;
  await as(other);await one('select gaas_feedback_delete($1) p',[item.id]);
  await as(admin);await assert.rejects(one('select gaas_feedback_complete($1,$2,$3,$4) r',[item.id,c.lease_token,'proposal_ready','{"summary":"x"}']),/item_missing/);
 }finally{await db.close();}
});
test('note reviews take the hash from the database, rules need the admin',async()=>{
 const {db,as,one}=await setup();try{
  await as(other);const r=(await one('select gaas_vault_record_note_review($1,$2) r',['01-Conceitos/CAC.md','ok'])).r;
  assert.equal(r.content_hash,'abcdef0123456789');
  await assert.rejects(one('select gaas_vault_record_note_review($1,$2) r',['nao/existe.md','ok']),/note_missing/);
  await assert.rejects(one('select gaas_feedback_propose_rule($1,$2,$3) r',['Nenhum texto usa travessão.','vault_lint','{}']),/admin_required/);
  await as(admin);const rule=(await one('select gaas_feedback_propose_rule($1,$2,$3) r',['Nenhum texto usa travessão.','vault_lint','{}'])).r;
  assert.equal((await one('select gaas_feedback_set_rule_status($1,$2) r',[rule.id,'active'])).r.status,'active');
 }finally{await db.close();}
});
test('renaming keeps the old name as alias for workspaces and initiatives',async()=>{
 const {db,as,one}=await setup();try{
  await as(admin);
  const w=(await one('select growth_rename_workspace($1,$2) r',['cross_sell','Cross-sell e Seguros'])).r;
  assert.equal(w.label,'Cross-sell e Seguros');assert.deepEqual(w.aliases,['Cross-sell CRM']);
  const p=(await one('select growth_save_work_initiative($1,$2,$3) n',[null,null,JSON.stringify({title:'Cross-sell de seguros',workspace:'cross_sell'})])).n;
  const renamed=(await one('select growth_save_work_initiative($1,$2,$3) n',[p.id,p.revision,JSON.stringify({title:'Cross-sell de seguros e assistências',phase_labels:{reading:'Medição'}})])).n;
  assert.deepEqual(renamed.aliases,['Cross-sell de seguros']);assert.equal(renamed.phase_labels.reading,'Medição');
  await assert.rejects(one('select growth_save_work_initiative($1,$2,$3) n',[p.id,renamed.revision,JSON.stringify({phase_labels:{invalida:'X'}})]),/invalid_phase_labels/);
  await as(other);await assert.rejects(one('select growth_rename_workspace($1,$2) r',['sdd','Outro nome']),/access_denied/);
 }finally{await db.close();}
});
