import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {validateAnalysis,SKILL_PATH,SKILL_VERSION,skillHash} from './growth-investigation-agent.mjs';
const claim={packet:{period:'2026-09-01',period_state:'closed',evidence:[{id:'2026-09-01:cards',value:10,status:'observed'}]}};
const body={status:'conclusive',summary:'Verificar o público antes de decidir.',facts:[{text:'Dez cartões no registro.',evidence_ids:['2026-09-01:cards'],values:[{evidence_id:'2026-09-01:cards',value:10}]}],hypotheses:[],limitations:['Sem atribuição causal.'],next_checks:['Verificar o público.'],candidate:null};
test('agent validates numeric references and abstention',()=>{
 assert.deepEqual(validateAnalysis(claim,body),[]);
 assert.ok(validateAnalysis(claim,{...body,facts:[{...body.facts[0],values:[{evidence_id:'2026-09-01:cards',value:11}]}]}).includes('value_mismatch'));
 assert.ok(validateAnalysis(claim,{...body,facts:[{text:'Referência inválida.',evidence_ids:['missing']}]}).some(x=>x.startsWith('unknown_evidence')));
});
test('agent refuses candidate in open/blocked periods',()=>{
 const candidate={title:'Investigar população observada',metric:'cards',action:'Verificar público da execução.',success_criterion:'Concluir a verificação e registrar resultado.'};
 assert.deepEqual(validateAnalysis(claim,{...body,candidate}),[]);
 assert.ok(validateAnalysis({...claim,packet:{...claim.packet,period_state:'open'}},{...body,candidate}).includes('candidate_not_eligible'));
});
test('canonical skill hash and closed rollout settings are reproducible',()=>{
 const hash=skillHash();
 const seed=readFileSync('supabase/migrations/'+readdirSync('supabase/migrations').find(f=>f.endsWith('_growth_investigation_skill.sql')),'utf8');
 assert.ok(seed.includes(hash));assert.ok(seed.includes(SKILL_VERSION));assert.ok(seed.includes('true,false,false'));
 const s=readFileSync(SKILL_PATH,'utf8');assert.ok(s.includes('growth_complete_investigation'));assert.ok(!s.includes('api.openai.com'));
});
