import { mkdirSync,readFileSync,writeFileSync } from 'node:fs';
import { resolve,join } from 'node:path';
import { chromium } from 'playwright';
import { PLURIX_V14_TEMPLATE } from '../../src/modules/dynamic-email/fixtures/plurixV14Template';
import { renderDynamicEmail } from '../../src/modules/dynamic-email/ampscript/renderer';
import { emptyBriefingRow } from '../../src/modules/dynamic-email/domain/briefing';

const out=resolve(process.argv[2]);mkdirSync(out,{recursive:true});
const data=JSON.parse(readFileSync('scripts/plurix-v14-qa-data.json','utf8')).briefings;
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({deviceScaleFactor:1});
const cache=new Map();await context.route('https://**/*',async route=>{
  const url=route.request().url();let value=cache.get(url);
  if(!value){try{const r=await route.fetch({timeout:20000});value={body:await r.body(),contentType:r.headers()['content-type']};cache.set(url,value);}catch{await route.abort();return;}}
  await route.fulfill({status:200,...value});
});
const queue=[...data];const results:any[]=[];
if(process.argv.includes('--desktop-only')){
  const previous=readFileSync('supabase/migrations/20261027184742_dynamic_email_plurix_v14_light_only.sql','utf8').split('$v14$')[1];
  const page=await context.newPage();await page.setViewportSize({width:720,height:1000});const checks:any[]=[];
  for(const b of data){
    const row=Object.assign(emptyBriefingRow(b.id),b.briefing_data);const versions:any[]=[];
    for(const source of [previous,PLURIX_V14_TEMPLATE]){
      const rendered=renderDynamicEmail(source,row,{CPF:'00000000000',PRI_NOME:'MARIA',LIMITE:'3500',PRODUTO:row.NM_PRODUTO_INTERNO,SEQUENCIA:row.SEQUENCIA,TP_CAMPANHA:row.TP_CAMPANHA},{pendingAssets:'hidden'});
      await page.setContent(rendered.html,{waitUntil:'networkidle'});await page.evaluate(async()=>{await Promise.all([...document.images].map(im=>im.decode().catch(()=>{})));});
      versions.push(await page.evaluate(()=>Object.fromEntries(['.brand-pad','.brand-logo','.hdr-copy','.hdr-title','.hdr-sub','.hdr-logos','.hdr-brand','.hdr-partner','.hdr-card','.hdr-card img'].map(selector=>{
        const el=document.querySelector(selector);if(!el)return [selector,null];const r=el.getBoundingClientRect();const cs=getComputedStyle(el);return [selector,{x:r.x,y:r.y,w:r.width,h:r.height,fill:cs.webkitTextFillColor}];
      }))));
    }
    const issues:string[]=[];for(const selector of Object.keys(versions[0])){
      const a=versions[0][selector],b=versions[1][selector];if(!a||!b){if(a!==b)issues.push(selector+' ausente');continue;}
      for(const dim of ['x','y','w','h'])if(Math.abs(a[dim]-b[dim])>1)issues.push(selector+'.'+dim);
      if(a.fill!==b.fill)issues.push(selector+' cor');
    }
    checks.push({product:row.NM_PRODUTO_INTERNO,sequence:row.SEQUENCIA,issues,previous:versions[0],current:versions[1]});
  }
  writeFileSync(join(out,'desktop-parity.json'),JSON.stringify(checks,null,2));await browser.close();
  const failed=checks.filter(c=>c.issues.length);console.log(JSON.stringify({checks:checks.length,failed:failed.map(c=>({product:c.product,sequence:c.sequence,issues:c.issues}))}));process.exit(failed.length?1:0);
}
async function worker(){const page=await context.newPage();while(queue.length){
  const b=queue.shift();const row=Object.assign(emptyBriefingRow(b.id),b.briefing_data);
  const result=renderDynamicEmail(PLURIX_V14_TEMPLATE,row,{CPF:'00000000000',PRI_NOME:'MARIA',LIMITE:'3500',PRODUTO:row.NM_PRODUTO_INTERNO,SEQUENCIA:row.SEQUENCIA,TP_CAMPANHA:row.TP_CAMPANHA},{pendingAssets:'hidden'});
  if(result.diagnostics.length)throw new Error(result.diagnostics.join(';'));
  const name=row.NM_PRODUTO_INTERNO.toLowerCase().replaceAll(' ','-')+'-'+row.SEQUENCIA.replace('E-mail ','e');
  writeFileSync(join(out,name+'.html'),result.html);
  let desktop:any;
  for(const width of [720,390,320])for(const mode of ['claro','escuro','sem-style','escuro-sem-style']){
    await page.setViewportSize({width,height:1000});await page.emulateMedia({colorScheme:mode.includes('escuro')?'dark':'light'});
    await page.setContent(mode.includes('sem-style')?result.html.replace(/<style>[\s\S]*?<\/style>/g,''):result.html,{waitUntil:'networkidle'});
    await page.evaluate(async()=>{await Promise.all([...document.images].map(im=>im.decode().catch(()=>{})));});
    // Cenário conservador: força a inversão de color/background-color, preservando imagens e fills.
    if(mode.includes('escuro'))await page.evaluate(()=>{
      const jobs=[...document.querySelectorAll<HTMLElement>('*')].map(el=>{const cs=getComputedStyle(el);return {el,bg:cs.backgroundColor,fg:cs.color};});
      const inverse=(color:string)=>color.replace(/rgba?\(([^)]+)\)/,(_,channels)=>`rgba(${channels.split(',').slice(0,3).map((v:string)=>255-Number(v)).join(',')},${channels.split(',')[3]??1})`);
      for(const j of jobs){j.el.style.setProperty('background-color',inverse(j.bg),'important');j.el.style.setProperty('color',inverse(j.fg),'important');}
    });
    const metrics=await page.evaluate(()=>{
      const box=(selector:string)=>{const el=document.querySelector<HTMLElement>(selector)!;const r=el.getBoundingClientRect();const cs=getComputedStyle(el);return {x:r.x,y:r.y,w:r.width,h:r.height,font:parseFloat(cs.fontSize),display:cs.display,fill:cs.webkitTextFillColor,bg:cs.backgroundImage};};
      const lines=(selector:string)=>{const el=document.querySelector(selector)!;const text=el.firstChild!;const list:string[]=[];let lastY=-1;for(let i=0;i<(text.textContent?.length??0);i++){const range=document.createRange();range.setStart(text,i);range.setEnd(text,i+1);const r=range.getBoundingClientRect();if(Math.abs(r.y-lastY)>2){list.push('');lastY=r.y;}list[list.length-1]+=text.textContent![i];}return list.map(s=>s.trim()).filter(Boolean);};
      return {shell:box('.email-shell'),copy:box('.hdr-copy'),card:box('.hdr-card'),title:box('.hdr-title'),sub:box('.hdr-sub'),brand:box('.brand-logo'),titleLines:lines('.hdr-title'),subLines:lines('.hdr-sub'),broken:[...document.images].filter(im=>!im.naturalWidth).map(im=>im.src),overflow:document.documentElement.scrollWidth>innerWidth};
    });
    if(width===720&&mode==='claro')desktop=metrics;
    const scale=metrics.shell.w/desktop.shell.w;
    const issues:string[]=[];
    if(metrics.copy.display!=='table-cell'||metrics.card.display!=='table-cell'||Math.abs(metrics.copy.y-metrics.card.y)>1)issues.push('colunas empilhadas');
    if(JSON.stringify(metrics.titleLines)!==JSON.stringify(desktop.titleLines))issues.push('quebras do título diferentes');
    if(JSON.stringify(metrics.subLines)!==JSON.stringify(desktop.subLines))issues.push('quebras do subtítulo diferentes');
    if(metrics.title.fill!==desktop.title.fill||metrics.sub.fill!==desktop.sub.fill)issues.push('cor do texto alterada');
    for(const key of ['title','sub','brand','copy','card'])for(const dim of ['w','h']){
      if(Math.abs(metrics[key][dim]-desktop[key][dim]*scale)>1.5)issues.push(`${key}.${dim} fora de proporção`);
    }
    if(metrics.overflow||metrics.broken.length)issues.push('overflow ou imagem quebrada');
    const prefix=`${name}-${width}-${mode}`;
    const shellTop=metrics.shell.y;const headerBottom=metrics.copy.y+metrics.copy.h;
    await page.screenshot({path:join(out,prefix+'-header.png'),clip:{x:metrics.shell.x,y:shellTop,width:metrics.shell.w,height:headerBottom-shellTop}});
    if(name==='amigao-e1'||name==='amigao-e2')await page.screenshot({path:join(out,prefix+'.png'),fullPage:true});
    results.push({name,width,mode,scale,issues,metrics});
  }
  console.log(`${results.length}/288 ${name}`);
}await page.close();}
try{await Promise.all([worker(),worker(),worker()]);}finally{await browser.close();}
writeFileSync(join(out,'header-geometry.json'),JSON.stringify(results,null,2));
const failures=results.filter(r=>r.issues.length);console.log(JSON.stringify({renders:results.length,failures:failures.map(r=>({name:r.name,width:r.width,mode:r.mode,issues:r.issues}))}));
if(failures.length)process.exitCode=1;
