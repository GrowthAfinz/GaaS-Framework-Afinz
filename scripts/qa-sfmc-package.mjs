import { chromium } from 'playwright';
import { PGlite } from '@electric-sql/pglite';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';
const out=resolve('artifacts/sfmc-package-qa');mkdirSync(out,{recursive:true});
const testSource=readFileSync('scripts/test-sfmc-package-sql.mjs','utf8');
const bootstrap=testSource.split('const bootstrap=`')[1].split('`;')[0];
const db=new PGlite();await db.exec(bootstrap);await db.exec(readFileSync('supabase/migrations/20261007203329_sfmc_package_ingestion.sql','utf8'));
await db.query("select set_config('request.jwt.claim.sub',$1,false)",['11111111-1111-4111-8111-111111111111']);
writeFileSync(out+'/index.html',`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body><div id="root"></div><script type="module">
import React from 'react';import {createRoot} from 'react-dom/client';import '/src/App.css';
import {PackageImportModal} from '/src/components/communications/PackageImportModal.tsx';
createRoot(document.getElementById('root')).render(React.createElement(PackageImportModal,{onClose:()=>{},onChanged:()=>{window.applied=true;}}));
</script></body></html>`);
const browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.route('https://mipiwxadnpwtcgfcedym.supabase.co/**',async route=>{
 const req=route.request(),url=new URL(req.url());try{
  let data;
  if(url.pathname.includes('/rpc/')){
   const name=url.pathname.split('/').pop(),a=req.postDataJSON();
   const args={
    stage_sfmc_package:['p_package','p_scope'],sfmc_package_candidates:['p_import_id'],preview_sfmc_package_apply:['p_import_id','p_decisions'],
    apply_sfmc_package_import:['p_import_id','p_decisions','p_preview_token','p_idempotency_key'],reject_sfmc_package_messages:['p_import_id','p_message_ids'],
    select_communication_template_content:['p_content_id','p_expected_current_id'],
   }[name];if(!args)throw Error('Unknown RPC '+name);
   const values=args.map(k=>typeof a[k]==='object'&&a[k]!==null?JSON.stringify(a[k]):a[k]);
   const r=await db.query('select public.'+name+'('+values.map((_,i)=>'$'+(i+1)).join(',')+') result',values);data=r.rows[0].result;
  }else{
   const table=url.pathname.split('/').pop();if(!['communication_templates','sfmc_package_imports','sfmc_package_messages','communication_template_contents'].includes(table))throw Error('Unknown table '+table);
   const clauses=[],values=[];for(const k of ['import_id','template_id']){const v=url.searchParams.get(k);if(v?.startsWith('eq.')){values.push(v.slice(3));clauses.push(k+'=$'+values.length);}}
   data=(await db.query('select * from public.'+table+(clauses.length?' where '+clauses.join(' and '):'')+' order by '+(table==='communication_templates'?'template_id':'id'),values)).rows;
  }
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data),headers:{'access-control-allow-origin':'*'}});
 }catch(e){await route.fulfill({status:400,contentType:'application/json',body:JSON.stringify({message:e.message})});}
});
await page.route('https://**/*',async route=>{if(route.request().url().includes('supabase.co'))return route.fallback();return route.abort();});
try{
 await page.goto('http://127.0.0.1:3017/artifacts/sfmc-package-qa/index.html');
 await page.getByLabel('BU/conta de origem').fill('BU de teste isolado');
 const file=process.env.SFMC_QA_ZIP||resolve('src/modules/sfmc-package/fixtures/carrinho.zip');
 await page.locator('input[type=file]').setInputFiles(file);
 await page.getByText('18 ocorrências', {exact:false}).waitFor({timeout:45000});
 assert.equal(await page.locator('article').count(),18);
 assert.equal((await db.query('select count(*)::int n from communication_templates')).rows[0].n,0);
 await page.screenshot({path:out+'/review-desktop.png'});
 // Explicitly choose the first non-optout message, a manual ID and its current version.
 const card=page.locator('article').filter({has:page.getByRole('checkbox',{name:/Selecionar afz_car_b2c_aqs_wpp_car_carrinho21d/})}).first();
 const selected=await card.locator('h3').innerText();
 await card.getByRole('checkbox',{name:'Selecionar '+selected,exact:true}).check();
 await card.getByLabel('Template ID de '+selected,{exact:true}).fill('b2c_QaPreview_D1');
 await card.getByText('Escolher este texto como versão atual',{exact:true}).click();
 await page.getByRole('button',{name:'Simular seleção',exact:true}).click();
 await page.getByText('1 mensagens aprovadas',{exact:false}).waitFor();
 await page.screenshot({path:out+'/simulation-desktop.png'});
 await page.getByRole('button',{name:'Aprovar e aplicar seleção',exact:true}).click();
 await page.getByText('1 mensagens aplicadas;', {exact:false}).waitFor();
 const result=(await db.query('select template_id,is_current,payload from communication_template_contents')).rows;
 assert.equal(result.length,1);assert.equal(result[0].is_current,true);assert.equal(result[0].payload.channel,'WhatsApp');
 assert.equal((await db.query('select count(*)::int n from activities')).rows[0].n,0);
 await page.screenshot({path:out+'/applied-desktop.png'});
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:out+'/review-mobile.png'});
 assert.equal(errors.length,0,errors.join('\n'));
 console.log(JSON.stringify({passed:true,messages:18,contentVersions:result.length,activitiesModified:0,pageErrors:errors.length,screenshots:out},null,2));
}finally{await browser.close();await db.close();}

