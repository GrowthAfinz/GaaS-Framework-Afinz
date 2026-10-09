import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {JourneyScene} from './JourneyScene';
import type {JourneyIndexItem,JourneyManifest} from '../../../modules/sfmc-package/journeyV2';
import {contextLabel} from '../../../modules/sfmc-package/journeyV2';
import type {FlowLayout} from '../../../modules/sfmc-package/journeyFlow';
import {prepareRendition,loadImage,type Rendition} from '../../../services/journeyRenditions';
interface ExportOptions {entry:JourneyIndexItem;manifest:JourneyManifest;layout:FlowLayout;compact:boolean;scope:'all'|'path'|'fiches';highlight:Set<string>;period:{start:string;end:string};context:string;segment:string;kind:'png'|'pdf';onProgress:(s:string)=>void;signal?:AbortSignal}
const escape=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]!));
export function rasterScale(w:number,h:number){if(w<=0||h<=0)throw Error('Dimensões inválidas');return Math.min(3,Math.sqrt(24_000_000/(w*h)),12000/w,12000/h);}
async function svgCanvas(svg:string,width:number,height:number){const url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml;charset=utf-8'}));try{const image=await loadImage(url),scale=rasterScale(width,height);if(scale<.7)throw Error('Jornada grande demais para PNG legível. Salve em PDF ou destaque um caminho.');const c=document.createElement('canvas');c.width=Math.ceil(width*scale);c.height=Math.ceil(height*scale);const ctx=c.getContext('2d');if(!ctx)throw Error('Canvas indisponível');ctx.fillStyle='white';ctx.fillRect(0,0,c.width,c.height);ctx.drawImage(image,0,0,c.width,c.height);return c;}finally{URL.revokeObjectURL(url);}}
function download(blob:Blob,name:string){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);}
export async function exportJourney(o:ExportOptions){
 if(o.scope==='path'&&!o.highlight.size)throw Error('Escolha uma mensagem ou filtro para destacar o caminho.');
 const renditions=new Map<string,Rendition>(),images=new Map<string,string>(),warnings:string[]=[];
 const selected=(o.scope==='path'?o.entry.messages.filter(m=>o.highlight.has(m.activity_key)):o.entry.messages).slice().sort((a,b)=>(o.layout.nodes.find(n=>n.key===a.activity_key)?.number||0)-(o.layout.nodes.find(n=>n.key===b.activity_key)?.number||0));
 for(let i=0;i<selected.length;i++){o.signal?.throwIfAborted();const m=selected[i];o.onProgress(`Preparando comunicação ${i+1}/${selected.length}…`);try{const r=await prepareRendition(m);renditions.set(m.activity_key,r);images.set(m.activity_key,r.url);warnings.push(...r.warnings);}catch(e){warnings.push(`Prévia indisponível: ${m.activity_name} — ${(e as Error).message}`);}}
 o.onProgress('Gerando arquivo…');
 const highlight=o.scope==='path'?o.highlight:new Set<string>();
 let scene=renderToStaticMarkup(<JourneyScene manifest={o.manifest} layout={o.layout} messages={o.entry.messages} compact={o.compact} focus={highlight} matches={o.scope==='path'?new Set(selected.map(m=>m.activity_key)):null} bounds={{left:-Infinity,top:-Infinity,right:Infinity,bottom:Infinity}} onOpen={()=>{}} images={images}/>);
 const prefix=`${o.entry.journey_name} · v${o.entry.journey_version}`,detail=`${o.context?contextLabel(o.context):'Todos os contextos'} · ${o.segment} · resultados ${o.period.start} a ${o.period.end}`;
 const footer=`Fonte: pack ${o.entry.import_id.slice(0,8)}. Configuração exportada não certifica versão enviada. ${warnings.length} aviso(s) de prévia.`;
 const w=o.layout.width,h=o.layout.height+115;
 scene=scene.replace(/^<svg[^>]*>/,`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" font-family="Arial,sans-serif"><rect width="${w}" height="${h}" fill="white"/><text x="24" y="30" font-size="19" font-weight="bold">${escape(prefix)}</text><text x="24" y="52" font-size="12">${escape(detail)}</text><g transform="translate(0,68)">`).replace(/<\/svg>$/,`</g><text x="24" y="${h-15}" font-size="11" fill="#64748b">${escape(footer)}</text></svg>`);
 const filename=o.entry.journey_name.replace(/[^\w-]/g,'_')+`_v${o.entry.journey_version}_${o.scope}`;
 if(o.kind==='png'){
  let svg=scene,height=h;
  if(o.scope==='fiches'){const columns=Math.max(1,Math.floor(w/700)),items=selected.map(m=>({m,r:renditions.get(m.activity_key)}));let y=h+24;const parts:string[]=[];for(let i=0;i<items.length;i+=columns){const group=items.slice(i,i+columns),rowH=Math.max(...group.map(({r})=>r?r.height*(640/r.width)+105:180));group.forEach(({m,r},col)=>{const x=24+col*700;const n=o.layout.nodes.find(n=>n.key===m.activity_key)?.number;parts.push(`<g transform="translate(${x},${y})"><text y="18" font-size="14" font-weight="bold">${escape(`${n} · ${m.channel}`)}</text><text y="38" font-size="10">${escape(m.activity_name)}</text><text y="56" font-size="10">${escape(m.observed_template_id||'Sem ID observado')}</text>${r?`<image href="${r.url}" x="0" y="70" width="640" height="${r.height*640/r.width}"/>`:'<text y="100" font-size="12">Prévia indisponível</text>'}</g>`);});y+=rowH+24;}height=y+30;svg=scene.replace(`height="${h}" viewBox="0 0 ${w} ${h}"`,`height="${height}" viewBox="0 0 ${w} ${height}"`).replace(/<\/svg>$/,parts.join('')+'</svg>');}
  const canvas=await svgCanvas(svg,w,height);const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('Falha ao gerar PNG')),'image/png'));o.signal?.throwIfAborted();download(blob,filename+'.png');return;
 }
 const [{jsPDF}]=await Promise.all([import('jspdf'),import('svg2pdf.js')]);const pdf=new jsPDF({orientation:'landscape',unit:'pt',format:'a3'}),pw=pdf.internal.pageSize.getWidth(),ph=pdf.internal.pageSize.getHeight(),scale=Math.min((pw-40)/w,(ph-40)/h);
 const host=document.createElement('div');host.style.cssText='position:fixed;left:-10000px;top:0';host.innerHTML=scene;document.body.appendChild(host);try{await pdf.svg(host.querySelector('svg')!,{x:20,y:20,width:w*scale,height:h*scale});}finally{host.remove();}
 if(o.scope==='fiches')for(const m of selected){const r=renditions.get(m.activity_key);pdf.addPage('a4','portrait');const pageW=pdf.internal.pageSize.getWidth(),pageH=pdf.internal.pageSize.getHeight(),number=o.layout.nodes.find(n=>n.key===m.activity_key)?.number;
  pdf.setFontSize(14);pdf.text(`${number} - ${m.channel}`,24,30);pdf.setFontSize(9);pdf.text(pdf.splitTextToSize(m.activity_name,pageW-48),24,48);pdf.text(m.observed_template_id||'Sem ID observado',24,72);pdf.text('Previa do pack/catalogo; nao certifica envio historico.',24,90);
  if(!r){pdf.text('Previa indisponivel.',24,120);continue;}const img=await loadImage(r.url),drawWidth=pageW-48,ratio=drawWidth/r.width,slicePixels=Math.floor((pageH-145)/ratio);let offset=0;
  while(offset<r.height){const sh=Math.min(slicePixels,r.height-offset),c=document.createElement('canvas');c.width=r.width;c.height=sh;const ctx=c.getContext('2d')!;ctx.fillStyle='white';ctx.fillRect(0,0,c.width,c.height);ctx.drawImage(img,0,offset,r.width,sh,0,0,r.width,sh);pdf.addImage(c.toDataURL('image/png'),'PNG',24,offset?55:110,drawWidth,sh*ratio);offset+=sh;if(offset<r.height){pdf.addPage('a4','portrait');pdf.setFontSize(11);pdf.text(`${number} - ${m.channel} (continuacao)`,24,30);}}
 }
 if(warnings.length){pdf.addPage('a4','portrait');pdf.setFontSize(13);pdf.text('Avisos da exportacao',24,30);pdf.setFontSize(9);let y=50;for(const warning of [...new Set(warnings)]){const lines=pdf.splitTextToSize(warning,540);if(y+lines.length*12>780){pdf.addPage('a4','portrait');y=30;}pdf.text(lines,24,y);y+=lines.length*12+8;}}
 o.signal?.throwIfAborted();pdf.save(filename+'.pdf');
}
