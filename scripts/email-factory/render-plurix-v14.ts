// Base: artifacts/dynamic-email-dark-mode/render_dark.ts. Apenas assinante fictício.
// Inversões são aproximações, nunca certificação dos clientes reais.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { chromium } from 'playwright';
import { PLURIX_V13_TEMPLATE } from '../../src/modules/dynamic-email/fixtures/plurixV13Template';
import { PLURIX_V14_TEMPLATE } from '../../src/modules/dynamic-email/fixtures/plurixV14Template';
import { emptyBriefingRow } from '../../src/modules/dynamic-email/domain/briefing';
import { renderDynamicEmail } from '../../src/modules/dynamic-email/ampscript/renderer';

const [dataFile, output] = process.argv.slice(2);
const out = resolve(output);
mkdirSync(out,{recursive:true});
const { briefings } = JSON.parse(readFileSync(dataFile,'utf8'));
if (briefings.length !== 24) throw new Error('Esperadas 24 combinações reais');
const modes = ['claro','apple-escuro','parcial','total','sem-style','parcial-sem-style','total-sem-style'];
const baselineVersion=process.argv.includes('--previous-v14')?'v14-r1':'v13';
const baselineSource=baselineVersion==='v14-r1'
  ? readFileSync('supabase/migrations/20261027161205_dynamic_email_plurix_v14_dark_mode.sql','utf8').split('$v14$')[1]
  : PLURIX_V13_TEMPLATE;
const browser = await chromium.launch({headless:true});
const assetCache = new Map<string, {body:Buffer;contentType:string}>();
const context = await browser.newContext({deviceScaleFactor:1,ignoreHTTPSErrors:true});
await context.route('https://**/*', async route => {
  const url=route.request().url();
  let cached=assetCache.get(url);
  if (!cached) {
    try { const r=await route.fetch({timeout:30000}); cached={body:await r.body(),contentType:r.headers()['content-type'] || 'application/octet-stream'}; assetCache.set(url,cached); }
    catch { await route.abort(); return; }
  }
  await route.fulfill({status:200,...cached});
});

// A regra HSL é a mesma do script original. background-image e imagens são preservados.
function invert(mode:string) {
  const parse=(c:string)=>{const m=c.match(/rgba?\(([^)]+)\)/); return m ? m[1].split(',').map(Number) : null;};
  const map=(c:number[],foreground:boolean)=>{
    const [r,g,b]=c.map(v=>v/255); const max=Math.max(r,g,b),min=Math.min(r,g,b), l=(max+min)/2,d=max-min;
    let h=0,s=0;if(d){s=l>0.5?d/(2-max-min):d/(max+min);h=(max===r?(g-b)/d+(g<b?6:0):max===g?(b-r)/d+2:(r-g)/d+4)/6;}
    const next=mode==='total'?0.11+(1-l)*0.8:foreground?(l<0.5?0.92-l*0.5:l):(l>0.55?0.11+(1-l)*0.45:l);
    const q=next<0.5?next*(1+s):next+s-next*s,p=2*next-q;
    const hue=(t:number)=>{if(t<0)t++;if(t>1)t--;return t<1/6?p+(q-p)*6*t:t<.5?q:t<2/3?p+(q-p)*(2/3-t)*6:p;};
    return `rgb(${(s?[hue(h+1/3),hue(h),hue(h-1/3)]:[next,next,next]).map(v=>Math.round(v*255)).join(',')})`;
  };
  const jobs=[...document.querySelectorAll<HTMLElement>('*')].map(el=>{const cs=getComputedStyle(el);return {el,bg:parse(cs.backgroundColor),fg:parse(cs.color)};});
  for(const {el,bg,fg} of jobs){if(bg&&(bg[3]??1)>0)el.style.setProperty('background-color',map(bg,false),'important');if(fg)el.style.setProperty('color',map(fg,true),'important');}
}

if(process.argv.includes('--probe-only')){
  const page=await context.newPage();await page.setViewportSize({width:600,height:260});
  const html=`<style>u + .body .s{background:#000;mix-blend-mode:screen}u + .body .d{background:#000;mix-blend-mode:difference}</style><u></u><div class="body"><div style="background:#4A5BA6;background-image:linear-gradient(#4A5BA6,#4A5BA6);padding:12px">${['#ffffff','#E7A921','#EADFCE'].map(c=>`<p style="font:bold 28px Arial;color:${c}"><span class="s"><span class="d">${c} TESTE DE COR</span></span></p>`).join('')}</div></div>`;
  const evidence:any={};
  for(const mode of ['claro','total']){
    await page.setContent(html);if(mode==='total')await page.evaluate(invert,mode);
    evidence[mode]=await page.evaluate(()=>[...document.querySelectorAll('p')].map(el=>{const r=el.getBoundingClientRect();return {text:el.textContent,x:r.x,y:r.y,w:r.width,h:r.height};}));
    await page.screenshot({path:join(out,`blend-probe-${mode}.png`),fullPage:true});
    await page.addStyleTag({content:'*{-webkit-text-fill-color:transparent!important}'});
    await page.screenshot({path:join(out,`blend-probe-${mode}-background.png`),fullPage:true});
  }
  writeFileSync(join(out,'blend-probe.json'),JSON.stringify(evidence,null,2));await browser.close();process.exit(0);
}

const jobs=briefings.flatMap((b:any)=>[720,390,320].map(width=>({b,width})));
const manifest:any[]=[];
async function worker(){
  const page=await context.newPage();
  while(jobs.length){
    const {b,width}=jobs.shift()!;
    const product=b.briefing_data.NM_PRODUTO_INTERNO.toLowerCase().replaceAll(' ','-');
    const seq=b.briefing_data.SEQUENCIA.replace('E-mail ','e');
    const key=`${product}-${seq}-${width}`;
    const records:any[]=[];
    for(const [version,source] of [[baselineVersion,baselineSource],['v14',PLURIX_V14_TEMPLATE]]){
      const row=Object.assign(emptyBriefingRow(b.id),b.briefing_data);
      const rendered=renderDynamicEmail(source,row,{CPF:'00000000000',PRI_NOME:'MARIA',LIMITE:'3500',PRODUTO:row.NM_PRODUTO_INTERNO,SEQUENCIA:row.SEQUENCIA,TP_CAMPANHA:row.TP_CAMPANHA},{pendingAssets:'hidden'});
      if(rendered.diagnostics.length)throw new Error(rendered.diagnostics.join(';'));
      writeFileSync(join(out,`${product}-${seq}-${version}.html`),rendered.html);
      for(const mode of modes){
        const prefix=`${key}-${version}-${mode}`;
        const signature=createHash('sha256').update(rendered.html+mode+width+'sim-v2-light').digest('hex');
        if(existsSync(join(out,`${prefix}-nodes.json`))){
          const prior=JSON.parse(readFileSync(join(out,`${prefix}-nodes.json`),'utf8'));
          if(prior.signature===signature){records.push({version,mode,prefix,...prior,texts:undefined});continue;}
        }
        await page.setViewportSize({width,height:1000});
        await page.emulateMedia({colorScheme:mode==='claro'?'light':'dark'});
        const html=mode.includes('sem-style')?rendered.html.replace(/<style>[\s\S]*?<\/style>/gi,''):rendered.html;
        await page.setContent(html,{waitUntil:'networkidle'});
        await page.evaluate(async()=>{await Promise.all([...document.images].map(im=>im.decode().catch(()=>{})));await document.fonts.ready;});
        // Gmail transforma body em um contêiner precedido por u. Reproduzir essa estrutura.
        if(mode.startsWith('total'))await page.evaluate(()=>{const wrapper=document.createElement('div');wrapper.className='body';wrapper.append(...document.body.childNodes);document.body.append(document.createElement('u'),wrapper);});
        const surfacesBefore=await page.evaluate(()=>[...document.querySelectorAll<HTMLElement>('*')].map(el=>{const cs=getComputedStyle(el);return {bg:cs.backgroundColor,image:cs.backgroundImage};}));
        if(mode.startsWith('parcial')||mode.startsWith('total'))await page.evaluate(invert,mode.startsWith('total')?'total':'parcial');
        const changedSurfaces=await page.evaluate((before)=>[...document.querySelectorAll<HTMLElement>('*')].flatMap((el,index)=>{
          const cs=getComputedStyle(el);const old=before[index];
          if(!old || old.bg==='rgba(0, 0, 0, 0)' || old.image!=='none' || cs.backgroundColor===old.bg)return [];
          const r=el.getBoundingClientRect();return r.width&&r.height?[{element:el.tagName,class:el.className,before:old.bg,after:cs.backgroundColor}]:[];
        }),surfacesBefore);
        const measurements=await page.evaluate(()=>{
          const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);const texts:any[]=[];let node;
          while(node=walker.nextNode()){
            if(!node.textContent?.trim())continue;
            const el=node.parentElement!;if(el.closest('style,script,head'))continue;
            const cs=getComputedStyle(el);if(cs.visibility==='hidden'||cs.display==='none'||Number(cs.opacity)===0)continue;
            const range=document.createRange();range.selectNodeContents(node);
            const rects=[...range.getClientRects()].filter(r=>r.width>0&&r.height>0).map(r=>({x:r.x,y:r.y,w:r.width,h:r.height}));
            if(!rects.length||el.closest('[style*="display:none"]'))continue;
            const size=parseFloat(cs.fontSize);const weight=parseInt(cs.fontWeight)||400;
            texts.push({text:node.textContent!.trim(),rects,threshold:size>=24||(size>=18.66&&weight>=700)?3:4.5,brand:!!el.closest('.brand-text,.brand-top,.brand-header,.brand-odd,.brand-even')});
          }
          return {texts,brokenImages:[...document.images].filter(im=>!im.naturalWidth).map(im=>im.src),overflow:document.documentElement.scrollWidth>innerWidth,scrollWidth:document.documentElement.scrollWidth};
        });
        await page.screenshot({path:join(out,`${prefix}.png`),fullPage:true});
        await page.addStyleTag({content:'*{-webkit-text-fill-color:transparent!important;text-shadow:none!important}'});
        await page.screenshot({path:join(out,`${prefix}-background.png`),fullPage:true});
        writeFileSync(join(out,`${prefix}-nodes.json`),JSON.stringify({signature,changedSurfaces,...measurements}));
        records.push({version,mode,prefix,...measurements,texts:undefined});
      }
    }
    const cols=(version:string)=>records.filter(r=>r.version===version).map(r=>`<figure><figcaption>${version.toUpperCase()} · ${r.mode}</figcaption><img src="${r.prefix}.png"></figure>`).join('');
    const panel=`<!doctype html><meta charset="utf-8"><style>body{font:14px Arial;background:#e9ecf1;margin:20px}.grid{display:grid;grid-template-columns:repeat(${modes.length},${width}px);gap:12px;align-items:start}figure{margin:0}img{width:${width}px}figcaption{padding:8px}</style><h1>${product} · ${seq} · ${width}px</h1><div class="grid">${cols(baselineVersion)}${cols('v14')}</div>`;
    writeFileSync(join(out,`${key}-painel.html`),panel);
    // O checker Python compõe o PNG dos dez screenshots sem uma página gigante em memória.
    manifest.push({key,briefingId:b.id,records});
    console.log(`${manifest.length}/72 ${key}`);
  }
  await page.close();
}
try{await Promise.all([worker(),worker(),worker()]);}finally{await browser.close();}
writeFileSync(join(out,'manifest.json'),JSON.stringify({simulation:'HSL aproximado, não representa algoritmo proprietário. Contraste medido em pixels finais com e sem tinta para incluir blend e gradientes.',manifest},null,2));
