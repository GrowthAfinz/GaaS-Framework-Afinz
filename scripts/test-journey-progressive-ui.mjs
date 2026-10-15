import {build} from 'esbuild';
import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {mkdtempSync,readFileSync,rmSync,existsSync,mkdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import assert from 'node:assert/strict';
const temp=mkdtempSync(join(tmpdir(),'journey-progressive-'));
const mocks={
 'PeriodContext':`export const usePeriod=()=>({startDate:new Date('2026-10-01'),endDate:new Date('2026-10-31')});`,
 'BUContext':`import React from 'react';export const useBU=()=>{const[selectedBUs,set]=React.useState(['B2C','B2B2C','Plurix']);window.setFixtureBUs=set;return {selectedBUs};};`,
 'AuthContext':`export const useAuth=()=>({user:{id:'fixture'}});`,
 'useAppStore':`export const useAppStore=fn=>fn({viewSettings:{filtrosGlobais:{}}});`,
 'CommunicationInspector':`export const CommunicationInspector=()=>null;export const filterJourneyRecords=rows=>rows;`,
 'journeyReadService':`
 const calls=window.calls=[];let fail=false;window.failDetail=()=>{fail=true;};

 const scope={channel:'SMS',observed_template_id:'b2c_car_sms',catalog:null,review_context:null,contexts:[{BU:'B2C',Parceiro:'Serasa',Segmento:'Abandonados'}]};
 const own={...scope,contexts:[{BU:'B2C',Parceiro:'Proprietaria',Segmento:'Abandonados'}]};
 const base={import_id:'i',reference:'j',journey_name:'JOR_AQS_TEST',created_at:'2026-10-15T12:00:00Z'};
 const fixtures=[...[1,2].map(n=>({...base,id:'v'+n,journey_version:n,messages:[scope,own]})),
 {...base,id:'plx',journey_name:'JOR_AQS_PLX_NA_ABD_TEST',messages:[{...scope,contexts:[{BU:'Plurix',Parceiro:'Amigão',Segmento:'Abandonados'}]}]},
 {...base,id:'bb',journey_name:'JOR_AQS_B2B2C_BB_ABD_TEST',messages:[{...scope,contexts:[{BU:'B2B2C',Parceiro:'Bem_Barato',Segmento:'Abandonados'}]}]},
 {...base,id:'pending',journey_name:'PACK_PENDENTE',messages:[{...scope,contexts:[],observed_template_id:null}]}];
 export const readJourneyDirectory=async()=>{calls.push('directory');return fixtures;};
 export const readJourneyDetail=async(id)=>{calls.push('detail:'+id);if(fail){fail=false;throw Error('fixture timeout');}await new Promise(r=>setTimeout(r,150));const e=fixtures.find(x=>x.id===id);return {...e,messages:e.messages.map((m,i)=>({...m,journey_name:e.journey_name,activity_key:i?'b':'a',activity_name:i?'Fixture Institucional':'Fixture Serasa',occurrence_key:i?'b':'a',preview_hint:{},is_optout:false,alerts:[],paths:[]}))};};
 export const readJourneyManifest=async(id)=>{calls.push('manifest:'+id);const e=fixtures.find(x=>x.id===id);return {...e,graph:{entry:{},nodes:e.messages.map((m,i)=>({key:i?'b':'a',type:'SMSSYNC',name:i?'Institucional':'Serasa',configuration:{},outcomes:[]}))}};};
 export const readJourneyMessage=async()=>{calls.push('message');throw Error('Unexpected message request');};
 export const readCurrentContent=async()=>{calls.push('content');return [];};
 export const resetJourneyCache=()=>{};
 export const readJourneyResults=async()=>{calls.push('results');return {complete:true,rows:[],reviews:[]};};`
};
let browser,server;
const stylesheet=existsSync('tmp/journey-classification.css')?readFileSync('tmp/journey-classification.css'):'';
const screenshot=async(page,name)=>{if(!process.env.JOURNEY_QA_DIR)return;mkdirSync(process.env.JOURNEY_QA_DIR,{recursive:true});await page.screenshot({path:join(process.env.JOURNEY_QA_DIR,name+'.png'),fullPage:true});};
try{
 console.log('Bundling UI fixture');
 await build({stdin:{contents:`import React from 'react';import{createRoot}from'react-dom/client';import{JourneyFlowView}from'./src/components/communications/journeys/JourneyFlowView';createRoot(document.getElementById('root')).render(<JourneyFlowView/>);`,resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:true,outfile:join(temp,'app.js'),format:'iife',jsx:'automatic',plugins:[{name:'fixtures',setup(b){b.onResolve({filter:/PeriodContext$|BUContext$|AuthContext$|useAppStore$|journeyReadService$|CommunicationInspector$/},a=>({path:a.path.split('/').pop(),namespace:'fixture'}));b.onLoad({filter:/.*/,namespace:'fixture'},a=>({contents:mocks[a.path],loader:'js',resolveDir:process.cwd()}));}}]});
 server=createServer((req,res)=>{if(req.url==='/style.css'){res.setHeader('Content-Type','text/css');res.end(stylesheet);return;}res.setHeader('Content-Type',req.url==='/app.js'?'text/javascript; charset=utf-8':'text/html; charset=utf-8');res.end(req.url==='/app.js'?readFileSync(join(temp,'app.js')):'<link rel="stylesheet" href="/style.css"><div id="root"></div><script src="/app.js"></script>');});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 console.log('Launching browser');
 browser=await chromium.launch({headless:true});
 const page=await browser.newPage({viewport:{width:1440,height:900}});const errors=[];page.on('pageerror',e=>{errors.push(e.message);console.error('Fixture page error:',e.message);});
 page.setDefaultTimeout(10000);console.log('Opening fixture');
 await page.goto('http://127.0.0.1:'+server.address().port);

 const front=page.getByLabel('Frente',{exact:true}),context=page.getByLabel('Parceiro / público',{exact:true}),segment=page.getByLabel('Segmento',{exact:true}),journey=page.getByLabel('Jornada',{exact:true}),version=page.getByLabel('Versão do pack',{exact:true}),open=page.getByRole('button',{name:'Abrir jornada',exact:true});
 await front.locator('option').nth(1).waitFor({state:'attached'});
 assert.deepEqual(await page.evaluate(()=>window.calls),['directory']);
 await front.selectOption('B2C');
 assert.deepEqual(await context.locator('option').allTextContents(),['Todos os públicos','Institucional','Serasa']);
 await context.selectOption({label:'Serasa'});await segment.selectOption({label:'Abandonados'});await journey.selectOption({label:'JOR_AQS_TEST'});
 assert.equal(await open.isDisabled(),true);await version.selectOption('v2');
 assert.deepEqual(await page.evaluate(()=>window.calls),['directory']);
 await open.click();await page.locator('[data-journey-viewport]').waitFor();
 assert.deepEqual(await page.evaluate(()=>window.calls),['directory','detail:v2','manifest:v2']);
 assert.equal(await page.locator('[data-communication]').count(),2);
 assert.equal(await page.locator('[data-communication="a"]').getAttribute('data-scope-match'),'true');
 assert.equal(await page.locator('[data-communication="b"]').getAttribute('data-scope-match'),'false');
 assert.ok((await page.getByLabel('Caminho da jornada').textContent()).includes('B2C · Serasa'));
 await screenshot(page,'b2c-serasa');
 await context.selectOption({label:'Institucional'});assert.equal(await page.locator('[data-journey-viewport]').count(),0);
 await segment.selectOption({label:'Abandonados'});await journey.selectOption({label:'JOR_AQS_TEST'});await version.selectOption('v1');
 await page.evaluate(()=>window.failDetail());await open.click();await page.getByRole('alert').waitFor();
 await page.getByRole('button',{name:'Tentar novamente',exact:true}).click();await page.locator('[data-journey-viewport]').waitFor();
 assert.equal(await page.locator('[data-communication="b"]').getAttribute('data-scope-match'),'true');
 assert.equal(await page.locator('[data-communication="a"]').getAttribute('data-scope-match'),'false');
 assert.equal((await page.evaluate(()=>window.calls)).includes('results'),false);
 // Changing selection during an in-flight load cannot paint the old graph.
 await version.selectOption('v2');await open.click();await front.selectOption('Plurix');
 await page.waitForTimeout(250);assert.equal(await page.locator('[data-journey-viewport]').count(),0);
 assert.equal(await context.getAttribute('aria-disabled'),'true');assert.equal(await context.textContent(),'N/A');
 assert.equal(await page.locator('select[aria-label="Parceiro / público"]').count(),0);
 assert.equal(await segment.isEnabled(),true);
 await screenshot(page,'plurix-na');
 await segment.selectOption({label:'Abandonados'});await journey.selectOption({label:'JOR_AQS_PLX_NA_ABD_TEST'});await version.selectOption('plx');await open.click();await page.locator('[data-journey-viewport]').waitFor();
 await front.selectOption('B2B2C');assert.deepEqual(await context.locator('option').allTextContents(),['Todos os parceiros','Bem Barato']);
 await page.getByRole('button',{name:/Classificação pendente/}).click();
 await segment.selectOption({label:'Segmento não identificado'});await journey.selectOption({label:'PACK_PENDENTE'});await version.selectOption('pending');await open.click();await page.locator('[data-journey-viewport]').waitFor();
 await screenshot(page,'pending');
 await page.getByRole('button',{name:'Voltar às frentes'}).click();await front.selectOption('Plurix');
 await page.evaluate(()=>window.setFixtureBUs(['B2C']));
 await page.waitForFunction(()=>document.querySelector('select[aria-label="Frente"]').value==='');
 assert.deepEqual(await front.locator('option').allTextContents(),['Escolha a frente','B2C']);
 await page.setViewportSize({width:390,height:844});await front.selectOption('B2C');await screenshot(page,'mobile-b2c');
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 assert.deepEqual(errors,[]);
 console.log('Journey UI: progressive reads, institution alias, shared graph highlights, Plurix N/A without click, pending access, BU reset, retry and mobile passed.');
}finally{console.log('Closing fixture');await browser?.close();console.log('Browser closed');server?.closeAllConnections();await new Promise(r=>server?server.close(r):r());console.log('Server closed');rmSync(temp,{recursive:true,force:true});console.log('UI fixture closed');}
