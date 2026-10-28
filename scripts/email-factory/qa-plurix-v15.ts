import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {chromium} from 'playwright';
import {PLURIX_V15_TEMPLATE} from '../../src/modules/dynamic-email/fixtures/plurixV15Template';
import {renderDynamicEmail} from '../../src/modules/dynamic-email/ampscript/renderer';
import {emptyBriefingRow,validateRows} from '../../src/modules/dynamic-email/domain/briefing';
import {buildSfmcExport} from '../../src/modules/dynamic-email/domain/sfmcExport';
import {plurixEnvelope} from '../../src/modules/dynamic-email/domain/sfmcEnvelope';
const out=resolve(process.argv[2]);mkdirSync(out,{recursive:true});
const outlookProfile=process.argv.includes('--outlook-profile');
const source=JSON.parse(readFileSync(join(out,'v2-source-snapshot.json'),'utf8'));
const ids=['9a632d10-85e2-4a4e-b9c9-8b56eb0aa569','444740ce-dc51-4156-bdfa-ad0ab09a06b4','40c3316a-f124-4884-979e-9350fdb32987','32e872d2-1566-4c30-952b-4cbf9505270c'];
const rows=source.map((b:any)=>Object.assign(emptyBriefingRow(b.id),b.briefing_data,{HEADER:'https://image.contato.clubemaisamigo.com.br/lib/fe3011747364047e721773/m/1/'+ids[Number(b.briefing_data.SEQUENCIA.slice(-1))-1]+'.png',TP_CAMPANHA:'CRM',DT_INICIO:'2026-10-28T00:00',DT_FIM:'2026-11-30T23:59'}));
for(const row of rows){const errors=(validateRows(rows).get(row.__id) ?? []).filter(i=>i.severity==='error');if(errors.length)throw Error(JSON.stringify(errors));}
writeFileSync(join(out,'PLURIX_V3_CRM_BRIEFING_24_LINHAS.csv'),buildSfmcExport(rows,{campaignType:'CRM',requireDynamicHeader:false}));
const envelope=plurixEnvelope(PLURIX_V15_TEMPLATE)!;
writeFileSync(join(out,'SFMC_ASSUNTO.txt'),envelope.subject);
writeFileSync(join(out,'SFMC_PRE_CABECALHO.txt'),envelope.preheader);
const browser=await chromium.launch({headless:true});const context=await browser.newContext();
const cache=new Map();await context.route('https://**/*',async route=>{let entry=cache.get(route.request().url());if(!entry){try{const r=await route.fetch({timeout:20000});if(!r.ok())throw Error('HTTP '+r.status());entry={body:await r.body(),contentType:r.headers()['content-type']};cache.set(route.request().url(),entry);}catch{await route.abort();return;}}await route.fulfill({status:200,...entry});});
const report:any[]=[];const queue=[...rows];
async function worker(){const page=await context.newPage();while(queue.length){const row=queue.shift();for(const [width,limit] of [[720,'3500'],[390,'3500'],[320,'3500'],[390,'']] as const){
 const result=renderDynamicEmail(PLURIX_V15_TEMPLATE,row,{CPF:'00000000000',PRI_NOME:'MARIA',LIMITE:limit,PRODUTO:row.NM_PRODUTO_INTERNO,SEQUENCIA:row.SEQUENCIA,TP_CAMPANHA:'CRM'},{pendingAssets:'hidden'});
 if(result.diagnostics.length)throw Error(result.diagnostics.join(';'));
 await page.setViewportSize({width,height:900});await page.setContent(result.html,{waitUntil:'networkidle'});
 await page.emulateMedia({colorScheme:outlookProfile?'dark':'light'});
 if(outlookProfile)await page.evaluate(()=>{
  // Deliberately drops CSS functions/fill and recolors inline styles. This is not Outlook.
  for(const el of document.querySelectorAll<HTMLElement>('[style]')){
   const old=el.getAttribute('style')??'';
   el.setAttribute('style',old.replace(/background(?:-image)?:[^;]*linear-gradient[^;]*;/g,'').replace(/-webkit-text-fill-color:[^;]*;/g,''));
   const background=old.match(/background-color:(#[\da-f]+);/i)?.[1];
   const color=old.match(/(?:^|[;\s])color:(#[\da-f]+);/i)?.[1];
   if(background){el.setAttribute('data-ogsb',background);el.style.backgroundColor='#151515';}
   if(color){el.setAttribute('data-ogsc',color);el.style.color='#eeeeee';}
  }
  document.body.setAttribute('data-ogsb','');document.body.setAttribute('data-ogsc','');
 });
 await page.evaluate(async()=>Promise.all([...document.images].map(im=>im.decode().catch(()=>{}))));
 const metrics=await page.evaluate(()=>{const im=document.querySelector<HTMLImageElement>('.header-image')!;const r=im.getBoundingClientRect();const main=document.querySelector('.v15-copy-main');return {paper:getComputedStyle(document.querySelector('.email-shell')!).backgroundColor,ink:main?getComputedStyle(main).color:null,image:{w:r.width,h:r.height,nw:im.naturalWidth,nh:im.naturalHeight},broken:[...document.images].filter(im=>!im.naturalWidth).map(im=>im.src),overflow:document.documentElement.scrollWidth>innerWidth};});
 if(metrics.paper!=='rgb(255, 255, 255)')throw Error('Light surface changed '+JSON.stringify(metrics));
 if(metrics.broken.length||metrics.overflow||Math.abs(metrics.image.w/metrics.image.h-1200/470)>.01)throw Error(JSON.stringify({product:row.NM_PRODUTO_INTERNO,sequence:row.SEQUENCIA,width,metrics}));
 const key=row.NM_PRODUTO_INTERNO.toLowerCase().replaceAll(' ','-')+'-'+row.SEQUENCIA.replace('E-mail ','e');
 if(limit&&width!==320&&(row.NM_PRODUTO_INTERNO==='AMIGAO'||(row.NM_PRODUTO_INTERNO==='AVENIDA'&&row.SEQUENCIA==='E-mail 1'))){writeFileSync(join(out,key+'.html'),result.html);await page.screenshot({path:join(out,key+'-'+width+'.png'),fullPage:true});}
 report.push({product:row.NM_PRODUTO_INTERNO,sequence:row.SEQUENCIA,width,limit,...metrics});
 }}await page.close();}
try{await Promise.all([worker(),worker(),worker()]);}finally{await browser.close();}
writeFileSync(join(out,'qa-v15.json'),JSON.stringify({profile:outlookProfile?'sanitized-dark-approximation':'light',renders:report.length,sfmcCertified:false,report},null,2));console.log(JSON.stringify({renders:report.length,passed:true,briefings:rows.length}));
