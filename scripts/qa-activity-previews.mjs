import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
await mkdir('tmp/activity-preview-qa',{recursive:true});
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1366,height:1000}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
let contentReads=0,fail=false,htmlVersion=1,imageFails=false;
await page.route('https://mipiwxadnpwtcgfcedym.supabase.co/**',async route=>{
 const url=new URL(route.request().url());
 let body=[];
 if(url.pathname.endsWith('/communication_templates')){contentReads++;const id=url.searchParams.get('template_id')?.replace('eq.','');body=id==='EMAIL'?{template_id:id,channel:'E-mail',original_path:'qa/email.html',mime_type:'text/html',content_hash:'v'+htmlVersion}:id==='IMAGE'?{template_id:id,channel:'WhatsApp',original_path:'qa/image.png',mime_type:'image/png',content_hash:imageFails?'image2':'image1'}:null;}
 if(url.pathname.endsWith('/communication_template_contents')){
  contentReads++;if(fail)return route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({message:'temporary error'})});
  const id=url.searchParams.get('template_id')?.replace('eq.','');
  body=['MISSING','EMAIL','IMAGE'].includes(id)?[]:[{id:'content-'+id,template_id:id,is_current:true,first_seen_at:'2026-10-01',content_hash:id,payload:{schema_version:1,channel:'SMS',body_text:id==='SMS_A'?'Mensagem A — primeiro disparo':'Mensagem B — segundo disparo',body_params:[],buttons:[],footer:null,banner_url:null,sms_from:'Afinz',meta_template_name:null}}];
 }
 if(url.pathname.includes('/object/sign/')&&route.request().method()==='POST')body={signedURL:'/object/sign/crm-communications/'+(url.pathname.endsWith('email.html')?'qa/email.html':'qa/image.png')+'?token=fixture'};
 if(url.pathname.includes('/object/sign/')&&route.request().method()==='GET')return route.fulfill({status:imageFails?404:200,contentType:url.pathname.endsWith('email.html')?'text/html':'image/svg+xml',body:imageFails?'missing':url.pathname.endsWith('email.html')?`<html><body><h1>E-mail versão ${htmlVersion}</h1><p>Prévia de validação</p></body></html>`:'<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600"><rect width="400" height="600" fill="#00c6cc"/><text x="20" y="60">Arte de validação</text></svg>'});
 return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(body)});
});
try{
 await page.goto((process.env.QA_BASE_URL||'http://127.0.0.1:4317')+'/scripts/fixtures/activity-preview-qa.html',{waitUntil:'networkidle'});
 const toggle=()=>page.getByRole('button',{name:/Comunicação vinculada/});
 assert.equal(contentReads,0,'collapsed previews must not fetch');
 await toggle().click();
 await page.getByText('Mensagem A — primeiro disparo',{exact:true}).waitFor();
 await page.getByRole('button',{name:'Ampliar prévia',exact:true}).click();
 await page.getByRole('dialog').waitFor();await page.keyboard.press('Escape');
 assert.equal(await page.getByRole('dialog').count(),0);
 assert.equal(await toggle().getAttribute('aria-expanded'),'true');
 await page.screenshot({path:'tmp/activity-preview-qa/preview-desktop.png',fullPage:true});
 // Changing the execution must immediately remove previous content, then load only on demand.
 await page.evaluate(()=>window.selectFixture(1));
 await page.getByText('SMS_B',{exact:true}).waitFor();
 assert.equal(await toggle().getAttribute('aria-expanded'),'false');
 assert.equal(await page.getByText('Mensagem A — primeiro disparo',{exact:true}).count(),0);
 await toggle().click();await page.getByText('Mensagem B — segundo disparo',{exact:true}).waitFor();
 await page.evaluate(()=>window.selectFixture(2));
 await page.getByText('Sem template vinculado a este disparo.').waitFor();
 const before=contentReads;await toggle().click();assert.equal(contentReads,before);
 const filters=await page.evaluate(()=>JSON.stringify(window.previewStore.getState().viewSettings.filtrosGlobais));
 await page.getByRole('button',{name:'Abrir cadastro e templates'}).click();
 assert.equal(await page.evaluate(()=>window.previewStore.getState().communicationLinkTarget.ids[0]),'00000000-0000-4000-8000-000000000007');
 assert.equal(await page.evaluate(()=>JSON.stringify(window.previewStore.getState().viewSettings.filtrosGlobais)),filters);
 await page.evaluate(()=>window.selectFixture(3));await toggle().click();
 await page.getByText('Revise o conteúdo em Comunicações → Cadastro e templates.').waitFor();
 // Recover an access failure without reassigning or hiding the link.
 await page.evaluate(()=>window.selectFixture(0));fail=true;await toggle().click();
 await page.getByRole('alert').waitFor();fail=false;await page.getByRole('button',{name:'Tentar novamente'}).click();
 await page.getByText('Mensagem A — primeiro disparo',{exact:true}).waitFor();
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'tmp/activity-preview-qa/preview-mobile.png',fullPage:true});
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no horizontal page overflow');
 // Same HTML storage path, new content hash: never retain the old HTML.
 await page.evaluate(()=>window.selectFixture(4));await toggle().click();
 await page.locator('iframe').contentFrame().getByText('E-mail versão 1').waitFor();
 htmlVersion=2;await page.getByRole('button',{name:'Atualizar prévia'}).click();
 await page.locator('iframe').contentFrame().getByText('E-mail versão 2').waitFor();
 await page.getByRole('button',{name:'Ampliar prévia',exact:true}).click();await page.getByRole('dialog').waitFor();await page.keyboard.press('Escape');
 await page.evaluate(()=>window.selectFixture(5));await toggle().click();
 await page.getByRole('img',{name:'Peça IMAGE'}).waitFor();
 await page.getByRole('button',{name:'Ampliar prévia',exact:true}).click();await page.keyboard.press('Escape');
 imageFails=true;await page.getByRole('button',{name:'Atualizar prévia'}).click();
 await page.getByText('Falha ao acessar o arquivo da prévia.').waitFor();
 assert.equal(await page.getByRole('button',{name:'Ampliar prévia',exact:true}).count(),0);
 imageFails=false;await page.evaluate(()=>window.selectFixture(0));
 await page.setViewportSize({width:1366,height:1000});
 await page.getByRole('button',{name:'daily',exact:true}).click();await toggle().nth(1).click();
 await page.getByText('Mensagem B — segundo disparo',{exact:true}).waitFor();
 await page.screenshot({path:'tmp/activity-preview-qa/daily-desktop.png',fullPage:true});
 await page.getByRole('button',{name:'Fechar',exact:true}).click().catch(async()=>{await page.reload();});
 await page.getByRole('button',{name:'framework',exact:true}).click();await toggle().click();
 await page.getByText('Mensagem A — primeiro disparo',{exact:true}).waitFor();
 await page.screenshot({path:'tmp/activity-preview-qa/framework-desktop.png',fullPage:true});
 await page.getByRole('button',{name:'explorer',exact:true}).click();await toggle().click();
 await page.getByText('Mensagem A — primeiro disparo',{exact:true}).waitFor();
 await page.screenshot({path:'tmp/activity-preview-qa/explorer-desktop.png',fullPage:true});
 await page.getByRole('button',{name:'Voltar',exact:true}).click();
 await page.evaluate(()=>window.previewStore.getState().setReportDeepLink({mode:'daily'}));
 await page.getByRole('button',{name:'report',exact:true}).click();
 await page.getByText('Detalhamento por disparo',{exact:true}).waitFor();
 const reportRow=page.locator('tr').filter({hasText:'06/10'}).filter({hasText:'afz_car_vis_aqs_sms_bsp_mesmo_nome'});
 await reportRow.click();await page.getByText('Detalhe do Disparo',{exact:true}).waitFor();
 await page.getByText('SMS_B',{exact:true}).waitFor();await toggle().click();
 await page.getByText('Mensagem B — segundo disparo',{exact:true}).waitFor();
 assert.equal(await page.getByText('Mensagem A — primeiro disparo',{exact:true}).count(),0);
 await page.screenshot({path:'tmp/activity-preview-qa/report-desktop.png',fullPage:true});
 await page.getByRole('button',{name:'Voltar',exact:true}).click();
 await page.getByRole('button',{name:'Tela cheia',exact:true}).click();
 const overlay=page.locator('div.fixed.inset-0').filter({has:page.getByText('Detalhamento por disparo — tela cheia',{exact:true})});
 await overlay.locator('tr').filter({hasText:'06/10'}).filter({hasText:'afz_car_vis_aqs_sms_bsp_mesmo_nome'}).click();
 assert.equal(await page.getByText('Detalhamento por disparo — tela cheia',{exact:true}).count(),0);
 await page.getByText('SMS_B',{exact:true}).waitFor();
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({passed:true,contentReads,checks:['lazy load','zoom and Escape','execution change','unlinked','catalog shortcut preserves filters','missing content','error and retry','mobile','HTML version update','image zoom and error','daily','framework','explorer','report exact execution','report fullscreen selection'],errors}));
} catch(e){await page.screenshot({path:'tmp/activity-preview-qa/failure.png',fullPage:true});console.log(JSON.stringify({errors,body:(await page.locator('body').innerText()).slice(-6000)}));throw e;} finally{await browser.close();}
