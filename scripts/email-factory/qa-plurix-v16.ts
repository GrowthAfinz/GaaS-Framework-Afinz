import {readFileSync,writeFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {chromium} from 'playwright';
import {PLURIX_V15_TEMPLATE} from '../../src/modules/dynamic-email/fixtures/plurixV15Template';
import {PLURIX_V16_TEMPLATE} from '../../src/modules/dynamic-email/fixtures/plurixV16Template';
import {renderDynamicEmail} from '../../src/modules/dynamic-email/ampscript/renderer';
import {emptyBriefingRow} from '../../src/modules/dynamic-email/domain/briefing';
const out=resolve(process.argv[2]);
const before=JSON.parse(readFileSync(join(out,'v3-before.json'),'utf8'));
const after=JSON.parse(readFileSync(join(out,'v3-after-preview.json'),'utf8'));
const browser=await chromium.launch();const context=await browser.newContext();const cache=new Map();
await context.route('https://**/*',async route=>{let v=cache.get(route.request().url());if(!v){try{const r=await route.fetch({timeout:20000});v={body:await r.body(),contentType:r.headers()['content-type']};cache.set(route.request().url(),v);}catch{await route.abort();return;}}await route.fulfill({status:200,...v});});
const queue=[...before];const report:any[]=[];
async function worker(){const page=await context.newPage();while(queue.length){const b=queue.shift();const a=after.find((x:any)=>x.id===b.id);for(const width of [720,390,320]){
 const versions:any[]=[];for(const [name,source,data] of [['v15',PLURIX_V15_TEMPLATE,b],['v16',PLURIX_V16_TEMPLATE,a]] as const){
  const row=Object.assign(emptyBriefingRow(data.id),data.briefing_data);const r=renderDynamicEmail(source,row,{CPF:'00000000000',PRI_NOME:'MARIA',LIMITE:'3500',PRODUTO:row.NM_PRODUTO_INTERNO,SEQUENCIA:row.SEQUENCIA,TP_CAMPANHA:'CRM'},{pendingAssets:'hidden'});if(r.diagnostics.length)throw Error(r.diagnostics.join(';'));
  await page.emulateMedia({colorScheme:'light'});await page.setViewportSize({width,height:900});await page.setContent(r.html,{waitUntil:'networkidle'});await page.evaluate(async()=>Promise.all([...document.images].map(im=>im.decode().catch(()=>{}))));
  const metrics=await page.evaluate(()=>{
   const items=[...document.querySelectorAll<HTMLElement>('body,table,td,div,p,h1,h2,h3')].filter(e=>e.getBoundingClientRect().height>0&&!e.classList.contains('brand-text'));
   const transparent=items.filter(e=>getComputedStyle(e).backgroundColor==='rgba(0, 0, 0, 0)').length;
   const geometry=[...document.querySelectorAll('.header-image,h1,h2,.body-copy,.cta-link,.email-shell')].map(e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,text:e.textContent};});
   return {transparent,geometry,text:document.body.innerText,links:[...document.querySelectorAll('a')].map(a=>a.getAttribute('href')),images:[...document.images].map(im=>({src:im.src,nw:im.naturalWidth})),overflow:document.documentElement.scrollWidth>innerWidth};
  });versions.push(metrics);
  if(name==='v16'&&(metrics.transparent||metrics.overflow||metrics.images.some((im:any)=>!im.nw)))throw Error(JSON.stringify({product:row.NM_PRODUTO_INTERNO,sequence:row.SEQUENCIA,width,metrics}));
  if(width===390&&row.NM_PRODUTO_INTERNO==='AMIGAO'){
   const key=row.SEQUENCIA.replace('E-mail ','e');await page.screenshot({path:join(out,key+'-'+name+'.png'),fullPage:true});
   if(name==='v16'){await page.emulateMedia({colorScheme:'dark'});const paper=await page.locator('.v15-copy-main').evaluate(e=>({bg:getComputedStyle(e).backgroundColor,ink:getComputedStyle(e).color}));if(paper.bg!=='rgb(255, 255, 255)'||paper.ink!=='rgb(36, 36, 36)')throw Error(JSON.stringify(paper));}
  }
 }
 const [old,next]=versions;if(JSON.stringify(old.geometry)!==JSON.stringify(next.geometry)||old.text!==next.text||JSON.stringify(old.links)!==JSON.stringify(next.links)||JSON.stringify(old.images)!==JSON.stringify(next.images))throw Error('Composicao divergiu em '+b.id+' largura '+width);
 report.push({id:b.id,product:b.briefing_data.NM_PRODUTO_INTERNO,sequence:b.briefing_data.SEQUENCIA,width,transparentBefore:old.transparent,transparentAfter:next.transparent,geometryEqual:true});
 }}await page.close();}
try{await Promise.all([worker(),worker(),worker()]);}finally{await browser.close();}
writeFileSync(join(out,'qa-v16.json'),JSON.stringify({comparisons:report.length,renders:report.length*2,sfmcCertified:false,report},null,2));console.log(JSON.stringify({comparisons:report.length,renders:report.length*2,passed:true}));
