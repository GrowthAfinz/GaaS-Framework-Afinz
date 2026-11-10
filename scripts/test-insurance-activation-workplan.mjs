import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fixture} from './development-test-fixture.mjs';
const migration=suffix=>readFileSync('supabase/migrations/'+readdirSync('supabase/migrations').find(f=>f.endsWith(suffix)),'utf8');
test('insurance plan preserves documentary scope, six launch gates and a dependency graph without cycles',async()=>{
 const {db}=await fixture();try{
 await db.exec(migration('_tasks_four_fronts.sql'));
 await db.exec(`insert into growth_work_initiatives(id,title,workspace,source_note,created_by) values('03d2907e-2bb1-4c45-9b26-f3caf11480b4','Seguros','cross_sell','05-Estrategia/Estrategia-de-Segmentacao-de-Seguros.md',auth.uid())`);
 await db.exec(migration('_insurance_activation_workplan.sql'));
 await db.exec(migration('_insurance_independent_fronts.sql'));
 const {rows}=await db.query("select task_key,status,dependencies,details,resolution from growth_development_tasks where initiative_id='03d2907e-2bb1-4c45-9b26-f3caf11480b4'");
 assert.equal(rows.length,63);assert.equal(rows.filter(r=>r.status==='concluida').length,6);
 assert.ok(rows.filter(r=>r.status==='concluida').every(r=>r.details.insurance_group==='built'&&r.resolution.includes('Não certifica')));
 const byKey=new Map(rows.map(r=>[r.task_key,r]));
 const visit=(key,seen=new Set())=>{assert.ok(byKey.has(key),key);assert.ok(!seen.has(key),'cycle '+key);for(const dep of byKey.get(key).dependencies)visit(dep,new Set([...seen,key]));};
 rows.forEach(r=>visit(r.task_key));
 assert.equal(rows.filter(r=>r.task_key.endsWith('-LIBERAR')).length,6);
 assert.ok(!byKey.get('SEG-REGUA-ROTATIVA').dependencies.includes('SEG-DEVICE-IN'));
 assert.ok(byKey.get('SEG-CEL-MEN-PUBLICO').dependencies.includes('SEG-MODELOS'));
 assert.ok(!byKey.get('SEG-RES-MEN-PUBLICO').dependencies.includes('SEG-MODELOS'));
 assert.ok(!byKey.get('SEG-MUL-MEN-PUBLICO').dependencies.includes('SEG-MAPA-MULHER'));
 assert.ok(!byKey.get('SEG-MODELOS').dependencies.includes('SEG-CONFIRMAR-PRODUTOS'));
 await db.exec('create table report_live_memberships(user_id uuid,active boolean,role text)');
 await db.exec(readFileSync('supabase/migrations/20260928235051_gaas_vault_library.sql','utf8'));
 await db.exec('create table gaas_wiki_pilot_documents(note_id uuid)');
 await db.exec(`insert into gaas_vault_notes(id,relative_path,title,content_markdown,content_hash) values('25931632-8994-4550-8333-290419fd9a15','05-Estrategia/Estrategia-de-Segmentacao-de-Seguros.md','Seguros','Fonte anterior preservada','aea9e74c70a1f9d08f4702b3e069315dc61b07d1fbeadc433a189114b79f36c1'),(gen_random_uuid(),'05-Estrategia/Outra.md','Outra','Intocada','outra')`);
 await db.exec(migration('_insurance_strategy_editorial.sql'));
 await db.exec(migration('_insurance_strategy_map_alignment.sql'));
 const note=(await db.query("select content_markdown from gaas_vault_notes where id='25931632-8994-4550-8333-290419fd9a15'")).rows[0];
 // A nota não fica mais no repositório público: o hash prova que a migration grava exatamente a versão aprovada.
 assert.equal(createHash('sha256').update(note.content_markdown,'utf8').digest('hex'),'1aa09a86bb668dafbd8c6bd906d042f16976206c4a354bd4730fc0d191da5f26');
 assert.equal((await db.query('select content_markdown from gaas_vault_note_revisions')).rows[0].content_markdown,'Fonte anterior preservada');
 assert.equal((await db.query("select content_markdown from gaas_vault_notes where title='Outra'")).rows[0].content_markdown,'Intocada');
 assert.equal((await db.query('select count(*)::int n from gaas_vault_notes')).rows[0].n,2);
 }finally{await db.close();}
});
