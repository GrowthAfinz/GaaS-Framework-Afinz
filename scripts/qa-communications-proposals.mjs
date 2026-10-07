import { chromium } from 'playwright';
import { PGlite } from '@electric-sql/pglite';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import assert from 'node:assert/strict';
const out='artifacts/communications-proposal-qa';mkdirSync(out,{recursive:true});
const source=readFileSync('scripts/test-sfmc-package-sql.mjs','utf8');
const db=new PGlite();await db.exec(source.split('const bootstrap=`')[1].split('`;')[0]);
await db.exec(readFileSync('supabase/migrations/20261007203329_sfmc_package_ingestion.sql','utf8'));
await db.exec(readFileSync('supabase/migrations/20261007215201_communications_proposal_inbox.sql','utf8'));await db.exec(readFileSync('supabase/migrations/20261007215620_communications_contextual_id_candidates.sql','utf8'));
await db.query("select set_config('request.jwt.claim.sub',$1,false)",['11111111-1111-4111-8111-111111111111']);
await db.query("insert into communication_templates(template_id,title,channel)values('b2c_carsab_vibe_inst_Dispd1','carrinho_b2c_sabado_sorteio','WhatsApp')");
writeFileSync(out+'/index.html',`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div><script type="module">
import React,{useState,useEffect} from 'react';import {createRoot} from 'react-dom/client';import '/src/App.css';
import {CommunicationProposalInbox} from '/src/components/communications/CommunicationProposalInbox.tsx';
import {readProposalInbox} from '/src/services/communicationProposalService.ts';
import {stagePackage} from '/src/services/sfmcPackageService.ts';import {parsePackageInWorker} from '/src/modules/sfmc-package/workerClient.ts';
if(!sessionStorage.booted){const blob=await (await fetch('/src/modules/sfmc-package/fixtures/carrinho.zip')).blob();await stagePackage(await parsePackageInWorker(new File([blob],'QA.zip')),'QA isolado');sessionStorage.booted='yes';}
function Harness(){const [rows,setRows]=useState([]);const refresh=()=>readProposalInbox().then(setRows);useEffect(()=>{refresh();},[]);return React.createElement('main',{className:'p-5'},React.createElement(CommunicationProposalInbox,{rows,loading:false,error:'',onRefresh:refresh,onChanged:refresh}));}
createRoot(document.getElementById('root')).render(React.createElement(Harness));</script></body></html>`);
const browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
const signatures={stage_sfmc_package:['p_package','p_scope'],sfmc_package_candidates:['p_import_id'],save_communication_proposal:['p_id','p_revision','p_review','p_resolved','p_note'],review_communication_proposals:['p_selection','p_action','p_token','p_key','p_note'],communication_proposal_reuse:['p_id']};
await page.route('https://mipiwxadnpwtcgfcedym.supabase.co/**',async route=>{try{const req=route.request(),url=new URL(req.url());let data;
if(url.pathname.includes('/rpc/')){const name=url.pathname.split('/').pop(),a=req.postDataJSON(),args=signatures[name];if(!args)throw Error('Unexpected RPC '+name);const values=args.map(k=>a[k]&&typeof a[k]==='object'?JSON.stringify(a[k]):a[k]??null);data=(await db.query('select public.'+name+'('+values.map((_,i)=>'$'+(i+1)).join(',')+') result',values)).rows[0].result;}
else {const table=url.pathname.split('/').pop();if(!['communications_reconciliation_proposals','sfmc_package_messages','communication_template_contents','communication_templates'].includes(table))throw Error('Unexpected table '+table);data=(await db.query('select * from '+table+' order by '+(table==='communication_templates'?'template_id':'id'))).rows;}
await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data??null)});
}catch(e){await route.fulfill({status:400,contentType:'application/json',body:JSON.stringify({message:e.message})});}});
await page.route('https://**/*',route=>route.request().url().includes('supabase.co')?route.fallback():route.abort());
try {
 await page.goto('http://127.0.0.1:3017/'+out+'/index.html');await page.getByText('14 comunicações neste filtro',{exact:false}).waitFor({timeout:45000});assert.equal(await page.locator('tbody tr').count(),14);
 await page.screenshot({path:out+'/01-inbox-desktop.png'});
 await page.getByLabel('Buscar propostas').fill('carrinho21dserasa');const row=page.locator('tbody tr').first();await row.getByRole('button',{name:'Revisar'}).click();
 await page.getByLabel('Template ID proposto').waitFor();assert.match(await page.getByLabel('Template ID proposto').inputValue(),/^b2c_car21_vibe_srsa_/);
 await page.getByLabel('Template ID proposto').fill('b2c_car21_vibe_srsa_Dispd2');await page.getByLabel('Motivo da revisão').fill('Revisão explícita do ramo Serasa 21D; manter conteúdo observado para histórico.');
 await page.getByRole('checkbox',{name:/Revisei o ID/}).check();await page.getByRole('checkbox',{name:'Escolher este texto como versão atual'}).check();
 await page.screenshot({path:out+'/02-review-desktop.png'});
 await page.getByRole('button',{name:'Salvar revisão'}).click();await page.getByRole('dialog').waitFor({state:'hidden'});
 await page.reload();await page.getByText('14 comunicações neste filtro',{exact:false}).waitFor();await page.getByLabel('Buscar propostas').fill('carrinho21dserasa');
 await page.getByText('1 comunicações neste filtro',{exact:false}).waitFor();assert.equal(await page.locator('tbody tr').count(),1);assert.match(await page.locator('tbody tr').first().innerText(),/b2c_car21_vibe_srsa_Dispd2/);await page.locator('tbody tr').first().getByRole('checkbox').check();
 assert.equal((await db.query('select count(*)::int n from communication_template_contents')).rows[0].n,0);
 await page.getByRole('button',{name:'Simular aprovação'}).click();await page.getByText('Simulação: 1 comunicações',{exact:false}).waitFor();
 assert.equal((await db.query('select count(*)::int n from communication_template_contents')).rows[0].n,0);
 await page.getByRole('button',{name:'Aprovar seleção'}).click();await page.getByText('1 comunicações aprovadas',{exact:false}).waitFor();
 assert.equal((await db.query('select count(*)::int n from communication_template_contents where is_current')).rows[0].n,1);
 await page.getByLabel('Buscar propostas').fill('');await page.locator('tbody tr').first().getByRole('checkbox').check();await page.getByRole('button',{name:'Rejeitar seleção'}).click();await page.getByLabel('Motivo da rejeição').fill('Revisar oferta desta comunicação');await page.getByRole('button',{name:'Confirmar rejeição'}).click();await page.getByText('Seleção rejeitada;',{exact:false}).waitFor();
 assert.equal((await db.query("select count(*)::int n from communications_reconciliation_proposals where status='rejected'")).rows[0].n,1);
 await page.getByLabel('Estado da proposta').selectOption('technical');assert.equal(await page.locator('tbody tr').count(),4);assert.equal(await page.locator('tbody input[type=checkbox]:disabled').count(),4);
 await page.getByLabel('Estado da proposta').selectOption('pending');await page.setViewportSize({width:390,height:844});await page.screenshot({path:out+'/03-inbox-mobile.png'});await page.locator('tbody tr').first().getByRole('button',{name:'Revisar'}).click();await page.getByRole('dialog').waitFor();await page.screenshot({path:out+'/04-review-mobile.png'});
 await page.keyboard.press('Escape');await page.getByRole('dialog').waitFor({state:'hidden'});assert.equal(errors.length,0,errors.join('\n'));
 writeFileSync(out+'/result.json',JSON.stringify({campaign_messages:14,optouts:4,persisted_edit:true,content_only_apply:true,rejection_audited:true,preview_before_apply:true,errors},null,2));console.log('Proposal browser QA passed: persistence, editable IDs, review, simulation, apply, rejection, optouts and mobile.');
} finally {await browser.close();await db.close();}
