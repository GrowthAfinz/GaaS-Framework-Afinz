import test from 'node:test';
import assert from 'node:assert/strict';
import {advancePublication, PUBLICATION_PHASES, compareSheetValues, quoteSheetTitle, publicationSlides} from '../supabase/functions/report-sync/report-live-publication.ts';

test('narratives and chart refreshes cannot cross into another generation or a legacy slide', () => {
 const current={objectId:'rlv2s_current_hash_a'};
 const deck=[{objectId:'legacy_intro'},{objectId:'rlv2s_previous_hash_a'},current];
 assert.deepEqual(publicationSlides(deck,'current_hash'),[current]);
 assert.throws(()=>publicationSlides(deck,'unknown_hash'),/não encontrada/);
 assert.throws(()=>publicationSlides(deck,''),/inválida/);
});

test('Google trimming is harmless, but zero, false, numeric text and residual rows differ',()=>{
 assert.equal(compareSheetValues([['x',null,''],[null]], [['x']]).verified,true);
 for(const actual of [0,false,'0','=A1']) assert.equal(compareSheetValues([[null]],[[actual]]).verified,false);
 assert.equal(compareSheetValues([[10]],[['10']]).verified,false);
 assert.equal(compareSheetValues([[10]],[[10],[999]]).mismatchCount,1);
 assert.equal(quoteSheetTitle("Fonte d'agosto"),"'Fonte d''agosto'");
});

test('a partial Sheet write cannot advance to slides',async()=>{
 const job={id:'job',phase:'verify_sheets',receipts:{backup:{verified:true},sheets:{verified:true}}};
 let checkpointed=false;
 await assert.rejects(advancePublication(job,{
  assertOwnership:async()=>{},effect:async()=>compareSheetValues([[123]],[[12]]),
  checkpoint:async()=>{checkpointed=true;},
 }),/não verificada/);
 assert.equal(checkpointed,false);
});

test('commit requires every previous receipt including PDF',async()=>{
 let effectCalled=false;
 await assert.rejects(advancePublication({id:'job',phase:'commit',receipts:{}},{
  assertOwnership:async()=>{},effect:async()=>{effectCalled=true;return {verified:true};},checkpoint:async()=>{},
 }),/anterior não confirmada/);
 assert.equal(effectCalled,false);
});

test('PDF is certified before the live generation is activated',()=>{
 assert.ok(PUBLICATION_PHASES.indexOf('pdf') < PUBLICATION_PHASES.indexOf('activate'));
 assert.equal(PUBLICATION_PHASES[PUBLICATION_PHASES.indexOf('activate')+1],'commit');
});

test('lease lost during an external effect cannot advance the durable checkpoint',async()=>{
 let checks=0, checkpointed=false;
 await assert.rejects(advancePublication({id:'job',phase:'backup',receipts:{}},{
  assertOwnership:async()=>{if(++checks===2)throw new Error('lease lost');},
  effect:async()=>({verified:true}),checkpoint:async()=>{checkpointed=true;},
 }),/lease lost/);
 assert.equal(checkpointed,false);
});

test('interruption after an effect replays the same operation before advancing',async()=>{
 const job={id:'job',phase:'backup',receipts:{}};
 const external=new Map();let failCheckpoint=true;
 const ports={assertOwnership:async()=>{},effect:async(phase,j)=>{
  const key=`${j.id}:${phase}`;if(!external.has(key))external.set(key,{verified:true,path:key});
  return external.get(key);
 },checkpoint:async(j,next,receipt)=>{
  if(failCheckpoint)throw new Error('interrupted');
  j.receipts[j.phase]=receipt;j.phase=next;
 }};
 await assert.rejects(advancePublication(job,ports),/interrupted/);
 assert.equal(job.phase,'backup');failCheckpoint=false;
 assert.deepEqual(await advancePublication(job,ports), {completed_phase:'backup',next_phase:'sheets'});
 assert.equal(job.phase,'sheets');assert.equal(external.size,1);
});

test('successful publication advances one stage per call and terminal calls do nothing',async()=>{
 const job={id:'job',phase:'backup',receipts:{}};const calls=[];
 const ports={assertOwnership:async()=>{},effect:async phase=>{calls.push(phase);return {verified:true};},
 checkpoint:async(j,next,r)=>{j.receipts[j.phase]=r;j.phase=next;}};
 for(let i=0;i<PUBLICATION_PHASES.length-1;i++)await advancePublication(job,ports);
 assert.equal(job.phase,'done');assert.deepEqual(calls,PUBLICATION_PHASES.slice(0,-1));
 assert.deepEqual(await advancePublication(job,ports),{idle:true});
});
