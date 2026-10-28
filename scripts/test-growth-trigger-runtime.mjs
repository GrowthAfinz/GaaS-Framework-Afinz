import test from 'node:test';
import assert from 'node:assert/strict';
import {buildObservation,observationInputHash,parseObservationRequest} from '../supabase/functions/_shared/growth-trigger-runtime.ts';
import {sha256} from '../supabase/functions/report-sync/report-live-versioning.ts';
import {createObservationHandler} from '../supabase/functions/growth-trigger-observer/index.ts';
import {operation,volumeRule,cacRule,aggregate} from './fixtures/growth-trigger-contract.ts';

function fixture(){
  const rules=[{...volumeRule,valid_from:'2026-01-01'}, {...cacRule,metric:'cac_brl_per_card'},
    {...volumeRule,rule_id:'fresh',family:'T5',metric:'synthetic',params:{tolerance_days:7}},
    {...volumeRule,rule_id:'revision',family:'T6',metric:'cards',params:{absolute_threshold:'20',relative_threshold:'0.02'}}];
  return {period:'2026-09',evaluation_as_of:'2026-10-28',data_read_at:'2026-10-28T03:00:00Z',
    config:{version:1,operation_ids:[operation.operation_id],rule_ids:rules.map(r=>r.rule_id),responsible_label:'Synthetic'},
    operations:[{...operation,lifecycle:'confirmada'}],rules,
    monthly:[...['03','04','05','06','07','08'].map(m=>aggregate('2026-'+m+'-01','100')),aggregate('2026-09-01','200')],
    freshness:[{source:'synthetic',latest:'2026-10-01'}],
    certified:{run_id:'synthetic',content_hash:'',artifact_path:'synthetic.json',certification_status:'certified',period:'2026-08',partners_current:[{partner:'Synthetic',cards:'98',missing_cards:0,unproven_execution:0}]}};
}
async function artifact(){
  const a={run_id:'synthetic',slides:[],slide_blueprints:[],sources:{},source_snapshots:{},source_hash:await sha256([]),
    tabs:{VIEW_RUN_MANIFEST:[['run_id','synthetic']],VP_SYNTHETIC_RESULT:[['partner','metric','current','state'],['Synthetic','cards',100,'valor_observado']]},
    narratives:{},action_candidates:[]};
  a.tabs_hash=await sha256({...a.tabs,VIEW_RUN_MANIFEST:[]});a.blueprint_hash=await sha256([]);a.narrative_hash=await sha256({});
  a.content_hash=await sha256({tabs_hash:a.tabs_hash,blueprint_hash:a.blueprint_hash,narrative_hash:a.narrative_hash,action_candidates:[]});return a;
}
test('observation fingerprint ignores read time, but preserves source, rule and evaluation day revisions',async()=>{
  const a=fixture(),b=structuredClone(a);b.data_read_at='2026-10-28T05:00:00Z';assert.equal(await observationInputHash(a),await observationInputHash(b));
  b.monthly[0].cards='99';assert.notEqual(await observationInputHash(a),await observationInputHash(b));
  const c=structuredClone(a);c.evaluation_as_of='2026-10-29';assert.notEqual(await observationInputHash(a),await observationInputHash(c));
});
test('observer keeps independent performance and freshness when snapshot is unavailable',async()=>{
  const out=await buildObservation(fixture(),null);
  assert.equal(out.performance[0].state,'triggered');assert.equal(out.freshness[0].state,'triggered');
  assert.equal(out.revision_status,'snapshot_unverifiable');assert.equal(out.revisions.length,0);
  assert.ok(out.performance.every(p=>p.feed_eligible===false));
});
test('T6 uses verified partner grain and rejects tampered baseline without fabricating deltas',async()=>{
  const input=fixture(),a=await artifact();input.certified.content_hash=a.content_hash;
  const out=await buildObservation(input,a);assert.equal(out.revision_status,'verified_partner_grain');assert.equal(out.revisions[0].delta,-2);
  a.tabs.VP_SYNTHETIC_RESULT[1][2]=0;
  const changed=await buildObservation(input,a);assert.equal(changed.revision_status,'snapshot_unverifiable');assert.equal(changed.revisions.length,0);
});
test('a candidate outside approved configuration cannot enter runtime',async()=>{
  const input=fixture();input.operations[0].lifecycle='candidata';await assert.rejects(buildObservation(input,null),/configuration/);
});
test('active rule cannot turn this observer into a feed producer',async()=>{
  const input=fixture();input.rules[0].mode='ativo';await assert.rejects(buildObservation(input,null),/configuration/);
});
test('request rejects unknown commands, array bodies and invalid months',()=>{
  for(const body of [{mode:'publish'},[],{mode:'run',period:'2026-13'},{mode:'worker',period:'2026-09'}])assert.throws(()=>parseObservationRequest(body));
});
const request=(body,token='')=>new Request('https://synthetic.test',{method:'POST',headers:token?{authorization:'Bearer '+token}:{},body:JSON.stringify(body)});
test('missing JWT and invalid worker token cannot reach source aggregates',async()=>{
  let sourceCalls=0;const client={rpc:async()=>({data:false,error:null}),auth:{getUser:async()=>({error:true,data:{user:null}})},from:()=>{sourceCalls++;throw new Error('must not read');}};
  const handle=createObservationHandler(client,'synthetic-service');
  assert.equal((await handle(request({mode:'run'}))).status,401);
  assert.equal((await handle(request({mode:'worker'},'a'.repeat(64)))).status,401);
  assert.equal(sourceCalls,0);
});
test('inactive membership or viewer cannot run observations; analysts cannot run worker',async()=>{
  for(const member of [{active:false,role:'admin'},{active:true,role:'viewer'},{active:true,role:'analyst'}]){
    const client={auth:{getUser:async()=>({data:{user:{id:'synthetic'}},error:null})},from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:member,error:null})})})})};
    const handle=createObservationHandler(client,'synthetic-service');
    const mode=member.role==='analyst'?'worker':'run';assert.equal((await handle(request({mode},'synthetic-jwt'))).status,403);
  }
});
test('verified scheduled worker can report idle without mutation',async()=>{
  const calls=[];const client={rpc:async(name)=>{calls.push(name);return {data:name==='report_live_verify_worker'?true:null,error:null};}};
  const handle=createObservationHandler(client,'synthetic-service');
  const r=await handle(request({mode:'worker'},'a'.repeat(64)));assert.equal(r.status,200);assert.equal((await r.json()).idle,true);
  assert.deepEqual(calls,['report_live_verify_worker','growth_trigger_claim_observation_job']);
});
