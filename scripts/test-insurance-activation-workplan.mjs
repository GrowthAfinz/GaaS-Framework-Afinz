import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
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
 // As migrations editoriais da nota de Seguros (insurance_strategy_editorial e map_alignment) foram
 // esvaziadas em 2026-11-10: o texto da nota não fica no repositório público. Já aplicadas em produção.
 }finally{await db.close();}
});
