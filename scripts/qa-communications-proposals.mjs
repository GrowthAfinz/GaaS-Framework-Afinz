import { chromium } from 'playwright';
import { PGlite } from '@electric-sql/pglite';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import assert from 'node:assert/strict';
const out='artifacts/communications-proposal-qa';mkdirSync(out,{recursive:true});
const source=readFileSync('scripts/test-sfmc-package-sql.mjs','utf8');
const db=new PGlite();await db.exec(source.split('const bootstrap=`')[1].split('`;')[0]);await db.exec(`alter table activities add column "BU" text,add column "Base Total" numeric,add column "Base Acionável" numeric,add column "Oferta" text,add column "Promocional" text,add column "Ordem de disparo" integer;`);
await db.exec(readFileSync('supabase/migrations/20261007203329_sfmc_package_ingestion.sql','utf8'));
await db.exec(readFileSync('supabase/migrations/20261007215201_communications_proposal_inbox.sql','utf8'));await db.exec(readFileSync('supabase/migrations/20261007215620_communications_contextual_id_candidates.sql','utf8'));
await db.exec(readFileSync('supabase/migrations/20261007235452_communication_execution_review.sql','utf8'));
await db.exec(readFileSync('supabase/migrations/20261008135702_scoped_communication_links.sql','utf8'));
await db.query("select set_config('request.jwt.claim.sub',$1,false)",['11111111-1111-4111-8111-111111111111']);
await db.query("insert into communication_templates(template_id,title,channel)values('b2c_carsab_vibe_inst_Dispd1','carrinho_b2c_sabado_sorteio','WhatsApp')");
writeFileSync(out+'/index.html',`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div><script type="module">
import React,{useState,useEffect} from 'react';import {createRoot} from 'react-dom/client';import '/src/App.css';
import {CommunicationProposalInbox} from '/src/components/communications/CommunicationProposalInbox.tsx';
import {PeriodProvider,usePeriod} from '/src/contexts/PeriodContext.tsx';
import {readProposalInbox} from '/src/services/communicationProposalService.ts';
import {stagePackage} from '/src/services/sfmcPackageService.ts';import {parsePackageInWorker} from '/src/modules/sfmc-package/workerClient.ts';
if(!sessionStorage.booted){const blob=await (await fetch('/src/modules/sfmc-package/fixtures/carrinho.zip')).blob();await stagePackage(await parsePackageInWorker(new File([blob],'QA.zip')),'QA isolado');sessionStorage.booted='yes';}
function Harness(){const [rows,setRows]=useState([]),[evidenceRevision,setEvidenceRevision]=useState(0);const {setPeriod}=usePeriod();const refresh=()=>readProposalInbox().then(r=>{setRows(r);setEvidenceRevision(v=>v+1);});useEffect(()=>{refresh();setTimeout(()=>setPeriod(new Date(2026,8,1),new Date(2026,8,30)),100);},[]);return React.createElement('main',{className:'p-5'},React.createElement('button',{onClick:()=>setPeriod(new Date(2026,8,24),new Date(2026,8,24))},'Período global: 24/09'),React.createElement('button',{onClick:()=>setPeriod(new Date(2026,8,1),new Date(2026,8,30))},'Período global: setembro'),React.createElement(CommunicationProposalInbox,{evidenceRevision,rows,loading:false,error:'',onRefresh:refresh,onChanged:refresh}));}
createRoot(document.getElementById('root')).render(React.createElement(PeriodProvider,null,React.createElement(Harness)));</script></body></html>`);
const browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
const signatures={stage_sfmc_package:['p_package','p_scope'],sfmc_package_candidates:['p_import_id'],save_communication_proposal:['p_id','p_revision','p_review','p_resolved','p_note'],review_communication_proposals:['p_selection','p_action','p_token','p_key','p_note'],communication_proposal_reuse:['p_id'],read_execution_duplicates:['p_start','p_end'],review_execution_duplicate:['p_ids','p_keep','p_fingerprint','p_approved','p_note']};
await page.route('https://mipiwxadnpwtcgfcedym.supabase.co/**',async route=>{try{const req=route.request(),url=new URL(req.url());let data;
if(url.pathname.includes('/rpc/')){const name=url.pathname.split('/').pop(),a=req.postDataJSON(),args=signatures[name];if(!args)throw Error('Unexpected RPC '+name);const values=args.map(k=>k==='p_ids'?a[k]:a[k]&&typeof a[k]==='object'?JSON.stringify(a[k]):a[k]??null);data=(await db.query('select public.'+name+'('+values.map((_,i)=>'$'+(i+1)).join(',')+') result',values)).rows[0].result;if(name==='stage_sfmc_package'&&!(await db.query('select 1 from activities limit 1')).rows.length){await db.exec(`insert into activities("Activity name / Taxonomia",jornada,"Canal","Data de Disparo","BU","Parceiro","Segmento","Oferta","Promocional","Base Total","Base Acionável") select payload->>'activity_name',payload->>'journey_name','WhatsApp','2026-09-24T03:00:00Z','B2C','Serasa','Abandonados','Vibe','Padrao',66,57 from sfmc_package_messages where payload->>'activity_name' like '%disp1vibeecred%';insert into activities("Activity name / Taxonomia",jornada,"Canal","Data de Disparo","BU","Parceiro","Segmento","Oferta","Promocional","Base Total","Base Acionável") select "Activity name / Taxonomia",jornada,"Canal",'2026-09-25T03:00:00Z',"BU","Parceiro","Segmento","Oferta","Promocional",14,10 from activities limit 1;insert into activities("Activity name / Taxonomia",jornada,"Canal","Data de Disparo","Base Total") select "Activity name / Taxonomia",'OTHER_JOURNEY','WhatsApp','2026-09-24T03:00:00Z',500 from activities limit 1;`);}}
else {const table=url.pathname.split('/').pop();if(table==='activities'&&url.searchParams.has('Activity name / Taxonomia'))throw Error('PostgREST filter must quote the slash-bearing column');if(!['communications_reconciliation_proposals','sfmc_package_messages','communication_template_contents','communication_templates','activities','communication_slots','communication_execution_reviews','communications_proposal_events','communication_execution_links'].includes(table))throw Error('Unexpected table '+table);data=(await db.query('select to_jsonb(t) value from '+table+' t order by '+(table==='communication_templates'?'template_id':'id'))).rows.map(r=>r.value);}
await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data??null)});
}catch(e){await route.fulfill({status:400,contentType:'application/json',body:JSON.stringify({message:e.message})});}});
await page.route('https://**/*',route=>route.request().url().includes('supabase.co')?route.fallback():route.abort());
try {
 await page.goto('http://127.0.0.1:3017/'+out+'/index.html');
 const list=page.locator('[data-proposal-row]');
 await page.getByText('80',{exact:true}).waitFor({timeout:45000});assert.equal(await list.count(),1);
 // Verify that changing only activity data is reflected by an explicit refresh.
 await db.exec(`update activities set "Base Total"=70 where jornada<>'OTHER_JOURNEY' and "Data de Disparo"='2026-09-24T03:00:00Z'`);
 await page.getByLabel('Atualizar a fila').click();await page.getByText('84',{exact:true}).waitFor();
 await page.getByRole('button',{name:'Período global: 24/09'}).click();await page.getByText('70',{exact:true}).waitFor();
 await page.getByRole('button',{name:'Período global: setembro'}).click();await page.getByText('84',{exact:true}).waitFor();
 // Historical selection must disappear immediately when its scope is hidden.
 await page.getByRole('button',{name:/Mostrar as .* fora do período/}).click();await list.nth(1).waitFor();
 const historic=list.filter({hasNotText:'disp1vibeecred'}).first();await historic.getByRole('checkbox').check();
 await page.getByText('1 selecionada',{exact:true}).waitFor();
 await page.getByRole('button',{name:'Mostrar só o período'}).click();assert.equal(await page.getByText('1 selecionada',{exact:true}).count(),0);
 await page.getByRole('button',{name:/Mostrar as .* fora do período/}).click();
 const search=page.getByPlaceholder('ID, etiqueta, jornada ou Activity Name');await search.fill('disp1vibeecred');assert.equal(await list.count(),1);
 for(const option of ['priority:-1','base:-1','exec:-1','recent:-1','order:1']){await page.getByLabel('Ordenar por',{exact:true}).selectOption(option);assert.equal(await list.count(),1);}
 await list.first().getByRole('button',{name:'Ampliar prévia visual'}).click();await page.getByRole('dialog',{name:'Prévia visual da comunicação'}).waitFor();await page.screenshot({path:out+'/05-preview-expanded.png'});await page.keyboard.press('Escape');
 await list.first().getByRole('button',{name:'Ver detalhes'}).click();await page.screenshot({path:out+'/06-framework-expanded.png'});
 await list.first().getByRole('button',{name:'Revisar',exact:true}).click();await page.getByLabel('Template ID proposto').waitFor();
 await page.getByLabel('Template ID proposto').fill('b2c_car_vibe_srsa_Dispd1');await page.getByLabel('Motivo da revisão').fill('Confirmação individual do ID e do público Serasa da atividade.');
 await page.getByRole('checkbox',{name:'Escolher este texto como versão atual'}).check();
 await page.getByRole('button',{name:'Salvar e marcar pronta',exact:true}).waitFor();await page.waitForFunction(()=>!document.querySelector('button[disabled]')?.textContent?.includes('Salvar e marcar pronta'));
 await page.screenshot({path:out+'/02-review-desktop.png'});await page.getByRole('button',{name:'Salvar e marcar pronta',exact:true}).click();await page.getByRole('dialog').waitFor({state:'hidden'});
 await page.getByLabel('Selecionar grupo pronto').waitFor();await page.getByLabel('Selecionar grupo pronto').selectOption({index:1});
 assert.equal((await db.query('select count(*)::int n from communication_template_contents')).rows[0].n,0);
 await page.getByRole('button',{name:'Aprovar',exact:true}).click();await page.getByText('Aprovado. Ao enviar:',{exact:false}).waitFor();
 assert.equal((await db.query('select count(*)::int n from communication_template_contents')).rows[0].n,0);
 await page.getByRole('button',{name:'Enviar',exact:true}).click();await page.getByText('1 comunicação enviada',{exact:false}).waitFor();
 assert.equal((await db.query('select count(*)::int n from communication_template_contents where is_current')).rows[0].n,1);
 // Incomplete links require a reason and can only be applied individually after human review.
 await search.fill('');await page.getByRole('button',{name:/^Sem ID no link/}).click();assert.equal(await list.count(),6);
 await list.first().getByRole('button',{name:'Revisar',exact:true}).click();await page.getByLabel('Template ID proposto').fill('b2c_car_vibe_srsa_Dispd2');
 await page.getByRole('button',{name:'Salvar e marcar pronta',exact:true}).click();await page.getByText('Informe o motivo da aprovação individual',{exact:false}).waitFor();
 await page.getByLabel('Motivo da revisão').fill('Aprovação individual da comunicação sem ID no link; sem vínculo histórico.');await page.getByRole('button',{name:'Salvar e marcar pronta',exact:true}).click();await page.getByRole('dialog').waitFor({state:'hidden'});
 const single=list.filter({hasText:'b2c_car_vibe_srsa_Dispd2'});await single.getByRole('checkbox').check();await page.getByRole('button',{name:'Aprovar',exact:true}).click();await page.getByText('Aprovado. Ao enviar:',{exact:false}).waitFor();await page.getByRole('button',{name:'Enviar',exact:true}).click();
 await page.getByText('1 comunicação enviada',{exact:false}).waitFor();assert.equal((await db.query('select count(*)::int n from communication_template_contents')).rows[0].n,2);
 await page.getByRole('button',{name:/^Opt-outs/}).click();assert.equal(await list.count(),4);assert.equal(await page.locator('[data-proposal-row] input[type=checkbox]:disabled').count(),4);
 await page.getByRole('button',{name:/^Com ID no link/}).click();await page.screenshot({path:out+'/01-inbox-desktop.png'});await page.setViewportSize({width:390,height:844});await page.screenshot({path:out+'/03-inbox-mobile.png'});
 assert.equal(errors.length,0,errors.join('\n'));
 writeFileSync(out+'/result.json',JSON.stringify({activity_refresh:true,global_period:true,hidden_selection_cleared:true,sorts:true,visual_preview:true,homogeneous_group_choice:true,review_and_apply:true,incomplete_link_individual:true,optouts:true,mobile:true,errors},null,2));console.log('Proposal browser QA passed.');
} catch(e){console.log((await page.locator('body').innerText()).slice(-3500));await page.screenshot({path:out+'/failure.png'});throw e;} finally {await browser.close();await db.close();}
