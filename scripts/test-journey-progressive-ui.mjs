import {build} from 'esbuild';
import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {mkdtempSync,readFileSync,rmSync,existsSync,mkdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';
const temp=mkdtempSync(join(tmpdir(),'journey-workspace-'));
const mocks={
 sfmcIngestionService:`export const readSfmcHistory=async()=>({imports:[],alerts:[],automatic_links:0});`,
 PeriodContext:`import React from 'react';export const usePeriod=()=>{const[period,set]=React.useState({startDate:new Date(2026,9,1),endDate:new Date(2026,9,31)});window.fixturePeriod=(s,e)=>set({startDate:new Date(s+'T12:00:00'),endDate:new Date(e+'T12:00:00')});return period;};`,
 BUContext:`import React from 'react';export const useBU=()=>{const[selectedBUs,set]=React.useState(['B2C','B2B2C','Plurix']);window.fixtureBUs=set;return {selectedBUs};};`,
 AuthContext:`export const useAuth=()=>({user:{id:'fixture'}});`,
 useAppStore:`import React from 'react';const listeners=new Set();let state={viewSettings:{filtrosGlobais:{canais:[],parceiros:[],segmentos:[],subgrupos:[],jornadas:[]}},setGlobalFilters:patch=>{state={...state,viewSettings:{filtrosGlobais:{...state.viewSettings.filtrosGlobais,...patch}}};listeners.forEach(f=>f());}};window.fixtureGlobal=state.setGlobalFilters;export const useAppStore=fn=>React.useSyncExternalStore(cb=>{listeners.add(cb);return()=>listeners.delete(cb);},()=>fn(state));`,
 CommunicationInspector:`import React from 'react';export const CommunicationInspector=({meta,onClose})=>React.createElement('div',{role:'dialog','aria-label':'Leitor da comunicação'},meta.activity_name,React.createElement('button',{onClick:onClose},'Fechar comunicação'));`,
 journeyRenditions:`export const cachedRendition=async()=>null;export const prepareRendition=async()=>{throw Error('Unexpected rendition request');};export const resourceDataUrl=async()=>{throw Error('Unexpected image request');};export const loadImage=async()=>{};`,
 journeyReadService:`
 const calls=window.calls=[];let fail=false;let failCatalog=false;window.failCatalog=()=>{failCatalog=true;};window.failDetail=()=>{fail=true;};
 const ctx=extra=>({BU:'B2C',Parceiro:'Proprietaria',Segmento:'Abandonados',Canal:'SMS',Subgrupos:'21D',Oferta:'Vibe',Promocional:'Padrão',last_activity_at:'2026-10-14T03:00:00Z',period_records:2,has_linked:true,has_unlinked:false,...extra});
 const msg=(key,extra={})=>({channel:'SMS',observed_template_id:'b2c_car21_DispD1',catalog:null,review_context:null,activity_key:key,activity_name:'act_'+key,occurrence_key:key,is_optout:false,contexts:[ctx({})],...extra});
 const base={import_id:'i',reference:'j',created_at:'2026-10-15T12:00:00Z'};
 const shared=[msg('a'),msg('b',{channel:'WhatsApp',observed_template_id:'b2c_car_sms_srsa_DispD2',contexts:[ctx({Parceiro:'Serasa',Canal:'WhatsApp',Subgrupos:'Sábado',Oferta:'Copa',last_activity_at:'2026-10-12T03:00:00Z',period_records:1,has_linked:false,has_unlinked:true})]})];
 const fixtures=[...[1,2].map(n=>({...base,id:'v'+n,journey_name:'JOR_AQS_B2C_PROPRI_ABD_SHARED',journey_version:n,messages:shared})),
 {...base,id:'old',journey_version:1,journey_name:'JOR_AQS_B2C_ABD_OLD',messages:[msg('a',{observed_template_id:null,contexts:[ctx({Parceiro:'Serasa',last_activity_at:'2026-10-05T03:00:00Z',period_records:0,has_linked:false,has_unlinked:false})]})]},
 {...base,id:'plx',journey_version:1,journey_name:'JOR_AQS_PLX_NA_ABD_TEST',messages:[msg('a',{contexts:[ctx({BU:'Plurix',Parceiro:'Amigão',last_activity_at:'2026-10-10T03:00:00Z'})]})]},
 {...base,id:'bb',journey_version:1,journey_name:'JOR_AQS_B2B2C_BB_CRM_TEST',messages:[msg('a',{contexts:[ctx({BU:'B2B2C',Parceiro:'Bem_Barato',Segmento:'CRM',last_activity_at:'2026-10-11T03:00:00Z'})]})]},
 {...base,id:'pending',journey_version:1,journey_name:'PACK_PENDENTE',messages:[msg('a',{channel:'Push',contexts:[],observed_template_id:null})]}];
 export const readJourneyCatalog=async(start,end)=>{calls.push('catalog:'+start+':'+end);await new Promise(r=>setTimeout(r,40));if(failCatalog){failCatalog=false;throw Error('catalog timeout');}return fixtures;};
 export const readJourneyDetail=async(id)=>{calls.push('detail:'+id);if(fail){fail=false;throw Error('fixture timeout');}await new Promise(r=>setTimeout(r,100));const e=fixtures.find(x=>x.id===id);return {...e,messages:e.messages.map(m=>({...m,journey_name:e.journey_name,preview_hint:{},alerts:[],paths:[]}))};};
 export const readJourneyManifest=async(id)=>{calls.push('manifest:'+id);const e=fixtures.find(x=>x.id===id);return {...e,graph:{entry:{},nodes:e.messages.map(m=>({key:m.activity_key,type:m.channel==='WhatsApp'?'WHATSAPPACTIVITY':'SMSSYNC',name:m.activity_name,configuration:{},outcomes:[]}))}};};
 export const readJourneyPerformancePage=async(id,start,end,cursor)=>{calls.push('performance:'+id+':'+(cursor?'next':'first'));await new Promise(r=>setTimeout(r,30));return {complete:true,rows:[{id:cursor?'r2':'r1',jornada:'JOR_AQS_B2C_PROPRI_ABD_SHARED','Activity name / Taxonomia':cursor?'act_b':'act_a','Data de Disparo':cursor?'2026-10-12T03:00:00Z':'2026-10-14T03:00:00Z',BU:'B2C',Parceiro:cursor?'Serasa':'Proprietaria',Segmento:'Abandonados',Subgrupos:cursor?'Sábado':'21D',Canal:cursor?'WhatsApp':'SMS',Oferta:cursor?'Copa':'Vibe',Promocional:'Padrão',template_id:cursor?null:'T','Base Total':1000,Cliques:20,Propostas:10,Aprovados:8,'Cartões Gerados':2,'Custo Total Campanha':null}],reviews:[],matches:[{id:cursor?'r2':'r1',activity_keys:[cursor?'b':'a']}],has_more:!cursor,cursor:cursor?null:{at_time:'2026-10-14T03:00:00Z',journey:'j',activity:'a',channel:'SMS'},count:1};};
 export const readJourneyMessage=async()=>{calls.push('message');throw Error('Unexpected message request');};
 export const readCurrentContent=async()=>{calls.push('content');return [];};
 export const resetJourneyCache=()=>{};`
};
let browser,server;
const stylesheet=readFileSync('dist/assets/'+(await import('node:fs')).readdirSync('dist/assets').find(n=>n.endsWith('.css')));
const shot=async(page,name)=>{if(!process.env.JOURNEY_QA_DIR)return;mkdirSync(process.env.JOURNEY_QA_DIR,{recursive:true});await page.screenshot({path:join(process.env.JOURNEY_QA_DIR,name+'.png'),fullPage:true});};
try{
 await build({stdin:{contents:`import React from 'react';import{createRoot}from'react-dom/client';import{JourneyFlowView}from'./src/components/communications/journeys/JourneyFlowView';createRoot(document.getElementById('root')).render(<><header style={{height:100,background:'#effcfb',padding:24}}>Afinz | Growth as a Service</header><JourneyFlowView/></>);`,resolveDir:process.cwd(),loader:'tsx'},bundle:true,outfile:join(temp,'app.js'),format:'iife',jsx:'automatic',plugins:[{name:'fixtures',setup(b){b.onResolve({filter:/PeriodContext$|BUContext$|AuthContext$|useAppStore$|journeyReadService$|CommunicationInspector$|journeyRenditions$|sfmcIngestionService$/},a=>({path:a.path.split('/').pop(),namespace:'fixture'}));b.onLoad({filter:/.*/,namespace:'fixture'},a=>({contents:mocks[a.path],loader:'js',resolveDir:process.cwd()}));}}]});
 server=createServer((req,res)=>{if(req.url==='/style.css'){res.setHeader('Content-Type','text/css');res.end(stylesheet);return;}res.setHeader('Content-Type',req.url==='/app.js'?'text/javascript; charset=utf-8':'text/html; charset=utf-8');res.end(req.url==='/app.js'?readFileSync(join(temp,'app.js')):'<link rel="stylesheet" href="/style.css"><style>:root{--ui-scale:.8}</style><div id="root"></div><script src="/app.js"></script>');});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));browser=await chromium.launch({headless:true});
 const page=await browser.newPage({viewport:{width:1440,height:1000},timezoneId:'America/Sao_Paulo'});page.setDefaultTimeout(15000);const errors=[];page.on('pageerror',e=>{errors.push(e.message);console.error(e.message);});
 console.log('Opening workspace fixture');await page.goto('http://127.0.0.1:'+server.address().port);
 const catalog=page.getByRole('region',{name:'Catálogo de jornadas'});
 await page.getByRole('heading',{name:/Jornadas extraídas dos packs/}).waitFor();
 assert.deepEqual(await page.evaluate(()=>window.calls),['catalog:2026-10-01:2026-10-31']);
 assert.equal(await page.getByLabel('Frente',{exact:true}).textContent(),'Aquisição');assert.equal(await page.getByLabel('Frente',{exact:true}).getAttribute('aria-disabled'),'true');
 assert.ok((await page.getByRole('heading',{name:/Jornadas extraídas dos packs/}).textContent()).includes('5 de 5'));
 assert.ok((await page.getByRole('region',{name:'Catálogo de jornadas'}).textContent()).includes('14/10/2026'));
 assert.equal(await page.getByText('Selecione o que deseja ver e clique em Abrir jornada').count(),0);
 console.log('Catalog visible');await shot(page,'01-catalog');
 const choose=async(label,value)=>{await page.getByRole('button',{name:label,exact:true}).click();const list=page.getByRole('listbox',{name:label,exact:true});await list.getByRole('option').filter({hasText:value}).first().click();};
 const tableGroups=await page.locator('[data-catalog-group]').count();
 console.log('Checking secondary facets');await choose('Canal','SMS');assert.equal(await page.locator('[data-catalog-group]').count(),tableGroups);
 assert.equal((await page.evaluate(()=>window.calls)).length,1);
 await page.getByRole('button',{name:'Subgrupo',exact:true}).click();assert.equal(await page.getByRole('listbox',{name:'Subgrupo',exact:true}).getByRole('option').filter({hasText:'Sábado'}).count(),0);await page.keyboard.press('Escape');await page.evaluate(()=>window.fixtureGlobal({subgrupos:['Sábado']}));await page.waitForFunction(()=>document.querySelector('[aria-label="Subgrupo"]').textContent.includes('Sábado'));assert.ok((await page.getByRole('heading',{name:/Jornadas extraídas dos packs/}).textContent()).includes('0 de 5'));
 await page.getByRole('button',{name:'Limpar',exact:true}).click();
 await choose('BU','Plurix');assert.equal(await page.getByLabel('Parceiro / público',{exact:true}).textContent(),'N/A');assert.equal(await page.locator('button[aria-label="Parceiro / público"]').count(),0);
 await shot(page,'02-plurix');await page.getByRole('button',{name:'Limpar',exact:true}).click();
 await page.getByRole('button',{name:'Abrir jornada JOR_AQS_B2C_PROPRI_ABD_SHARED',exact:true}).first().click();
 console.log('Opening flow');await page.locator('[data-journey-viewport]').waitFor();assert.equal(await page.getByLabel('Versão do pack',{exact:true}).inputValue(),'v2');
 assert.deepEqual((await page.evaluate(()=>window.calls)).filter(c=>c.startsWith('detail:')),['detail:v2']);
 assert.equal((await page.evaluate(()=>window.calls)).some(c=>c.startsWith('performance:')),false);
 const canvas=await page.locator('[data-journey-viewport]').boundingBox();assert.ok(canvas.height>=430,'canvas physical height '+canvas.height);
 assert.equal(await page.locator('[data-latest-activity]').count(),1);
 await shot(page,'03-flow-normal');
 await page.getByRole('button',{name:'Tela cheia',exact:true}).click();await page.waitForFunction(()=>!!document.fullscreenElement);
 await page.getByRole('button',{name:'Performance',exact:true}).click();
 const panel=page.getByRole('region',{name:'Performance da jornada'});await shot(page,'04-performance-drawer');await panel.getByText('14/10/2026',{exact:false}).waitFor();
 await panel.getByText('12/10/2026',{exact:false}).waitFor();assert.equal(await panel.getByRole('button',{name:'Carregar próximos disparos'}).count(),0);
 const transformBefore=await page.locator('[data-journey-viewport] .will-change-transform').getAttribute('style');
 await panel.getByRole('button',{name:'Expandir performance'}).click();await panel.getByRole('button',{name:'Voltar à jornada',exact:true}).waitFor();
 const region=await panel.boundingBox(),root=await page.locator('[data-journey-flow]').boundingBox();assert.ok(region.height>=root.height-5);
 await shot(page,'04-performance-expanded');
 await panel.getByRole('button',{name:'Voltar à jornada',exact:true}).click();assert.equal(await page.locator('[data-journey-viewport] .will-change-transform').getAttribute('style'),transformBefore);
 await panel.getByRole('button',{name:'Localizar no fluxo'}).first().click();await panel.getByRole('button',{name:'Mostrar toda a jornada'}).waitFor();
 await panel.getByRole('button',{name:'Ocultar performance',exact:true}).click();
 await page.getByRole('button',{name:'Sair da tela cheia',exact:true}).click();await page.waitForFunction(()=>!document.fullscreenElement);
 await page.getByRole('button',{name:'Catálogo',exact:true}).click();
 await page.getByRole('button',{name:/Classificação pendente/}).click();await page.getByRole('button',{name:'Abrir jornada PACK_PENDENTE',exact:true}).waitFor();
 await page.getByRole('button',{name:'Limpar',exact:true}).click();
 await page.evaluate(()=>window.fixtureBUs(['B2C']));await page.getByRole('button',{name:'BU',exact:true}).click();assert.equal(await page.getByRole('option').filter({hasText:'Plurix'}).count(),0);await page.keyboard.press('Escape');
 await page.evaluate(()=>{window.failCatalog();window.fixturePeriod('2026-09-01','2026-09-30');});await page.getByRole('alert').filter({hasText:'catalog timeout'}).waitFor();assert.equal(await page.getByRole('button',{name:'Abrir jornada JOR_AQS_B2C_PROPRI_ABD_SHARED',exact:true}).count(),0);await page.getByRole('button',{name:'Tentar novamente',exact:true}).click();await page.getByRole('button',{name:'Abrir jornada JOR_AQS_B2C_PROPRI_ABD_SHARED',exact:true}).first().waitFor();await page.waitForFunction(()=>window.calls.includes('catalog:2026-09-01:2026-09-30'));
 await page.setViewportSize({width:390,height:844});await shot(page,'05-mobile-catalog');assert.ok(await page.evaluate(()=>document.querySelector('[data-journey-flow]').getBoundingClientRect().right<=innerWidth+1));
 assert.deepEqual(errors,[]);console.log('Workspace UI: immediate catalog, unique journey counts, tuple filters, stable groups, shared global state, Plurix N/A, auto version, zoom-aware canvas, fullscreen, lazy/paged performance, expanded return, pin, pending access and mobile passed.');
}finally{await browser?.close();server?.closeAllConnections();await new Promise(r=>server?server.close(r):r());rmSync(temp,{recursive:true,force:true});}
