import {readFileSync,writeFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {chromium} from 'playwright';
import {PLURIX_V16_R2_TEMPLATE as PLURIX_V16_TEMPLATE,PLURIX_V16_BASE_TEMPLATE} from '../../src/modules/dynamic-email/fixtures/plurixV16Template';
import {renderDynamicEmail} from '../../src/modules/dynamic-email/ampscript/renderer';
import {emptyBriefingRow} from '../../src/modules/dynamic-email/domain/briefing';
const out=resolve(process.argv[2]);const before=JSON.parse(readFileSync(join(out,'v3-before.json'),'utf8'));const after=JSON.parse(readFileSync(join(out,'v3-after-preview.json'),'utf8'));
const browser=await chromium.launch();const context=await browser.newContext({deviceScaleFactor:2,colorScheme:'light'});const cache=new Map();
await context.route('https://**/*',async route=>{let v=cache.get(route.request().url());if(!v){const r=await route.fetch({timeout:30000});if(!r.ok())throw Error('Asset '+r.status());v={body:await r.body(),contentType:r.headers()['content-type']};cache.set(route.request().url(),v);}await route.fulfill({status:200,...v});});
const queue=[...before];const report:any[]=[];
async function worker(){const page=await context.newPage();while(queue.length){const old=queue.shift();const next=after.find((b:any)=>b.id===old.id);for(const width of [1000,390,320]){
 await page.setViewportSize({width,height:900});const versions=[];
 for(const [source,data] of [[PLURIX_V16_BASE_TEMPLATE,old],[PLURIX_V16_TEMPLATE,next]] as const){
  const row=Object.assign(emptyBriefingRow(data.id),data.briefing_data);const r=renderDynamicEmail(source,row,{CPF:'00000000000',PRI_NOME:'PABLO',LIMITE:'3000',PRODUTO:row.NM_PRODUTO_INTERNO,SEQUENCIA:row.SEQUENCIA,TP_CAMPANHA:'CRM'},{pendingAssets:'hidden'});if(r.diagnostics.length)throw Error(r.diagnostics.join(';'));
  await page.setContent(r.html,{waitUntil:'networkidle'});await page.evaluate(async()=>Promise.all([...document.images].map(im=>im.decode().catch(()=>{}))));
  const m=await page.evaluate(()=>({links:[...document.querySelectorAll('a')].map(a=>a.getAttribute('href')).filter(h=>h!=='%%unsub_center_url%%'),images:[...document.images].map(im=>({src:im.src,loaded:!!im.naturalWidth})),overflow:document.documentElement.scrollWidth>innerWidth,text:document.body.innerText,ctas:[...document.querySelectorAll<HTMLAnchorElement>('.cta-link')].map(a=>({text:a.textContent,pad:getComputedStyle(a.parentElement!).padding,bg:getComputedStyle(a.parentElement!).backgroundColor,height:a.getBoundingClientRect().height})),unsub:document.querySelectorAll('a[href="%%unsub_center_url%%"]').length}));
  if(m.images.some(im=>!im.loaded)||m.overflow)throw Error(JSON.stringify({id:data.id,width,m}));
  if(source===PLURIX_V16_TEMPLATE){if(m.unsub!==1||!m.text.includes('supermercado ')||m.ctas.some(c=>c.bg!=='rgb(44, 52, 144)'||c.height<24||c.pad==='0px'))throw Error(JSON.stringify(m));
   if(row.NM_PRODUTO_INTERNO==='AMIGAO'&&(width===1000||width===390)){const key=row.SEQUENCIA.replace('E-mail ','email-');await page.locator('.email-shell').screenshot({path:join(out,key+'-'+(width===1000?'desktop':'mobile')+'.png')});if(width===1000)writeFileSync(join(out,key+'-preview.html'),r.html);}
  }versions.push(m);
 }
 const [a,b]=versions;const acquired=['COMPRE MAIS','SUPERPAO'].includes(old.briefing_data.NM_PRODUTO_INTERNO);
 const nextLinks=acquired?b.links.filter(link=>link!==next.briefing_data.LINK_BANNER_3_CORPO):b.links;
 const nextImages=acquired?b.images.filter(im=>im.src!==next.briefing_data.BANNER_3_CORPO):b.images;
 if(JSON.stringify(a.links)!==JSON.stringify(nextLinks)||JSON.stringify(a.images)!==JSON.stringify(nextImages))throw Error('Unexpected tracking or asset change');
 if(acquired&&(!b.text.includes('supermercado Amigão')||b.text.includes('supermercado Compre Mais')||b.text.includes('supermercado Superpão')))throw Error('Acquired brand mapping failed');
 report.push({id:old.id,product:old.briefing_data.NM_PRODUTO_INTERNO,sequence:old.briefing_data.SEQUENCIA,width,linksPreserved:true,assetsPreserved:!acquired,amigaoSignatureAdded:acquired,ctaCount:b.ctas.length,unsubscribeCount:b.unsub});
}}await page.close();}
try{await Promise.all([worker(),worker(),worker()]);}finally{await browser.close();}
writeFileSync(join(out,'qa-v16-r2.json'),JSON.stringify({comparisons:report.length,renders:report.length*2,report,sfmcCertified:false},null,2));console.log(JSON.stringify({comparisons:report.length,renders:report.length*2,passed:true}));
