import {build} from 'esbuild';
import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {mkdtempSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import assert from 'node:assert/strict';
const temp=mkdtempSync(join(tmpdir(),'journey-progressive-'));
const mocks={
 'PeriodContext':`export const usePeriod=()=>({startDate:new Date('2026-10-01'),endDate:new Date('2026-10-31')});`,
 'BUContext':`export const useBU=()=>({selectedBUs:['B2C']});`,
 'AuthContext':`export const useAuth=()=>({user:{id:'fixture'}});`,
 'useAppStore':`export const useAppStore=fn=>fn({viewSettings:{filtrosGlobais:{}}});`,
 'CommunicationInspector':`export const CommunicationInspector=()=>null;export const filterJourneyRecords=rows=>rows;`,
 'journeyReadService':`
 const calls=window.calls=[];let fail=false;window.failDetail=()=>{fail=true;};
 const scope={channel:'SMS',observed_template_id:'b2c_car_sms',catalog:null,review_context:null,contexts:[{BU:'B2C',Parceiro:'Serasa',Segmento:'Abandonados'}]};
 const base={import_id:'i',reference:'j',journey_name:'JOR_AQS_TEST',created_at:'2026-10-15T12:00:00Z'};
 export const readJourneyDirectory=async()=>{calls.push('directory');return [1,2].map(n=>({...base,id:'v'+n,journey_version:n,messages:[scope]}));};
 export const readJourneyDetail=async(id)=>{calls.push('detail:'+id);if(fail){fail=false;throw Error('fixture timeout');}await new Promise(r=>setTimeout(r,150));return {...base,id,journey_version:1,messages:[{...scope,activity_key:'a',activity_name:'Fixture SMS',occurrence_key:'a',preview_hint:{},is_optout:false,alerts:[],paths:[]}]};};
 export const readJourneyManifest=async(id)=>{calls.push('manifest:'+id);return {...base,id,graph:{entry:{},nodes:[{key:'a',type:'SMSSYNC',name:'Fixture SMS',configuration:{},outcomes:[]}]}};};
 export const readJourneyMessage=async()=>{calls.push('message');throw Error('Unexpected message request');};
 export const readCurrentContent=async()=>{calls.push('content');return [];};
 export const resetJourneyCache=()=>{};
 export const readJourneyResults=async()=>{calls.push('results');return {complete:true,rows:[],reviews:[]};};`
};
let browser,server;
try{
 console.log('Bundling UI fixture');
 await build({stdin:{contents:`import React from 'react';import{createRoot}from'react-dom/client';import{JourneyFlowView}from'./src/components/communications/journeys/JourneyFlowView';createRoot(document.getElementById('root')).render(<JourneyFlowView/>);`,resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:true,outfile:join(temp,'app.js'),format:'iife',jsx:'automatic',plugins:[{name:'fixtures',setup(b){b.onResolve({filter:/PeriodContext$|BUContext$|AuthContext$|useAppStore$|journeyReadService$|CommunicationInspector$/},a=>({path:a.path.split('/').pop(),namespace:'fixture'}));b.onLoad({filter:/.*/,namespace:'fixture'},a=>({contents:mocks[a.path],loader:'js'}));}}]});
 server=createServer((req,res)=>{res.setHeader('Content-Type',req.url==='/app.js'?'text/javascript; charset=utf-8':'text/html; charset=utf-8');res.end(req.url==='/app.js'?readFileSync(join(temp,'app.js')):'<div id="root"></div><script src="/app.js"></script>');});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 console.log('Launching browser');
 browser=await chromium.launch({headless:true});
 const page=await browser.newPage({viewport:{width:1440,height:900}});const errors=[];page.on('pageerror',e=>{errors.push(e.message);console.error('Fixture page error:',e.message);});
 page.setDefaultTimeout(10000);console.log('Opening fixture');
 await page.goto('http://127.0.0.1:'+server.address().port);
 const context=page.getByLabel('Parceiro / B2C',{exact:true}),segment=page.getByLabel('Segmento',{exact:true}),journey=page.getByLabel('Jornada',{exact:true}),version=page.getByLabel('Versão do pack',{exact:true}),open=page.getByRole('button',{name:'Abrir jornada',exact:true});
 console.log('Waiting for navigation options');
 await context.locator('option').nth(1).waitFor({state:'attached'});
 assert.deepEqual(await page.evaluate(()=>window.calls),['directory']);
 await context.selectOption({label:'B2C · Serasa'});await segment.selectOption({label:'Abandonados'});await journey.selectOption({label:'JOR_AQS_TEST'});
 assert.equal(await open.isDisabled(),true);
 await version.selectOption('v2');
 assert.deepEqual(await page.evaluate(()=>window.calls),['directory']);
 console.log('Opening selected version');
 await open.click();await page.locator('[data-journey-viewport]').waitFor();
 assert.deepEqual(await page.evaluate(()=>window.calls),['directory','detail:v2','manifest:v2']);
 await version.selectOption('v1');await page.waitForFunction(()=>!document.querySelector('[data-journey-viewport]'));
 await page.evaluate(()=>window.failDetail());await open.click();await page.getByRole('alert').waitFor();
 await page.getByRole('button',{name:'Tentar novamente',exact:true}).click();await page.locator('[data-journey-viewport]').waitFor();
 assert.equal((await page.evaluate(()=>window.calls)).includes('results'),false);
 // Changing selection during an in-flight load cannot paint the old graph.
 await version.selectOption('v2');await open.click();await context.selectOption('');
 await page.waitForTimeout(250);assert.equal(await page.locator('[data-journey-viewport]').count(),0);
 assert.deepEqual(errors,[]);
 console.log('Progressive UI: no detail before explicit open; version required; only chosen snapshot; retry; selection race; no automatic results.');
}finally{console.log('Closing fixture');await browser?.close();console.log('Browser closed');server?.closeAllConnections();await new Promise(r=>server?server.close(r):r());console.log('Server closed');rmSync(temp,{recursive:true,force:true});console.log('UI fixture closed');}
