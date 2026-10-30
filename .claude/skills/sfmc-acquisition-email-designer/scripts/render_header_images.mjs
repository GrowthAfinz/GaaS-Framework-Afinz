import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';

const args=Object.fromEntries(process.argv.slice(2).reduce((pairs,value,i,all)=>i%2===0?[...pairs,[value.replace(/^--/,''),all[i+1]]]:pairs,[]));
for(const name of ['runtime','template','manifest','out','index'])if(args[name]===undefined)throw Error('Missing --'+name);
const {chromium}=createRequire(join(resolve(args.runtime),'package.json'))('playwright');
const rows=JSON.parse(readFileSync(args.manifest,'utf8'));
const row=rows[Number(args.index)];if(!row?.title||!row?.subtitle||!row?.card)throw Error('Incomplete header');
const out=resolve(args.out);mkdirSync(out,{recursive:true});
const source=readFileSync(args.template,'utf8');
const slug=(row.product+'-'+row.sequence).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-');
const browser=await chromium.launch({headless:true});
try{
 const context=await browser.newContext({viewport:{width:1000,height:700},deviceScaleFactor:2,javaScriptEnabled:false});
 await context.route('**/*',async route=>{
  const url=new URL(route.request().url());
  if(url.protocol==='https:'&&['image.relacionamento.afinz.com.br','stoplxmkt.blob.core.windows.net'].includes(url.hostname)&&route.request().resourceType()==='image')await route.continue();else await route.abort();
 });
 const page=await context.newPage();await page.setContent(source,{waitUntil:'networkidle'});
 await page.evaluate(row=>{
  const must=(selector)=>{const nodes=document.querySelectorAll(selector);if(nodes.length!==1)throw Error('Anchor '+selector+' found '+nodes.length);return nodes[0];};
  must('.content_padding').style.padding='0';must('.container').style.width='600px';
  const header=document.querySelector('table.stylingblock-content-wrapper');if(!header)throw Error('Header absent');header.id='raster-header';
  const bold=header.querySelector('span[style*="font-size:28px"] b');if(!bold)throw Error('Title anchor absent');bold.textContent=row.title;
  if(row.layout){
   if(row.layout.titleLineHeight)bold.closest('div').style.lineHeight=row.layout.titleLineHeight+'px';
   if(row.layout.copyPaddingTop)bold.closest('td').style.paddingTop=row.layout.copyPaddingTop+'px';
  }
  const sub=header.querySelector('span[style*="font-size:18px"] span[style*="font-family"]');if(!sub)throw Error('Subtitle anchor absent');sub.textContent=row.subtitle;
  const card=header.querySelector('img[data-assetid="182879"]');if(!card)throw Error('Card anchor absent');card.src=row.card;
  const partner=header.querySelector('img[data-assetid="182885"]');if(!partner)throw Error('Partner anchor absent');if(row.logo){partner.src=row.logo;}else{partner.remove();}
 },row);
 await page.evaluate(async()=>{await Promise.all([...document.images].map(im=>im.decode()));await document.fonts.ready;});
 const info=await page.evaluate(()=>{
  const root=document.querySelector('#raster-header'),r=root.getBoundingClientRect();
  const images=[...root.querySelectorAll('img')].map(im=>({url:im.src,naturalWidth:im.naturalWidth,naturalHeight:im.naturalHeight,width:im.width,height:im.height}));
  const clipped=[...root.querySelectorAll('img,span')].filter(e=>{const b=e.getBoundingClientRect();return b.x<r.x-1||b.right>r.right+1||b.bottom>r.bottom+1;}).length;
  return {width:r.width,height:r.height,text:root.innerText,images,clipped};
 });
 if(info.width!==600||info.clipped||info.images.some(im=>!im.naturalWidth))throw Error('Invalid geometry '+JSON.stringify(info));
 await page.locator('#raster-header').screenshot({path:join(out,slug+'@2x.png'),omitBackground:false});
 const resolved=await page.content();writeFileSync(join(out,slug+'.html'),resolved);
 const png=readFileSync(join(out,slug+'@2x.png'));
 const metadata={...row,...info,alt:row.title+' '+row.subtitle,status:'needs_review',pngWidth:png.readUInt32BE(16),pngHeight:png.readUInt32BE(20),sha256:createHash('sha256').update(png).digest('hex'),sourceSha256:createHash('sha256').update(source).digest('hex')};
 writeFileSync(join(out,slug+'.json'),JSON.stringify(metadata,null,2));
 // The mobile preview scales the finished image, not the text/image HTML columns.
 await page.setViewportSize({width:390,height:500});
 await page.setContent('<html><body style="margin:0;padding:10px;background:#f2f4f7"><img alt="" width="600" style="display:block;width:100%;max-width:600px;height:auto" src="data:image/png;base64,'+png.toString('base64')+'"></body></html>');
 await page.evaluate(async()=>document.images[0].decode());
 await page.locator('img').screenshot({path:join(out,slug+'-mobile.png')});
 console.log(JSON.stringify(metadata));
}finally{await browser.close();}
