import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {get,set,keys,del} from 'idb-keyval';
import {MessagePreview} from '../components/communications/previews/MessagePreview';
import {cachedSignedUrl} from './templateContentIndex';
import type {MessageMeta} from '../modules/sfmc-package/journeyV2';
import type {ParsedPackage,PackageMessage} from '../modules/sfmc-package/types';
import {imageAssetPath,resolvePreview} from '../utils/communicationVisualResolution';
import {readJourneyMessage,readCurrentContent} from './journeyReadService';
import {supabase} from './supabaseClient';
export interface Rendition {url:string;width:number;height:number;warnings:string[];source:string;at:number}
const jobs=new Map<string,Promise<Rendition>>();let actor='';let active=0;const queue:(()=>void)[]=[];
supabase.auth.onAuthStateChange((_event,s)=>{if(actor!==(s?.user.id||'')){actor=s?.user.id||'';jobs.clear();}});
async function limited<T>(fn:()=>Promise<T>){if(active>=2)await new Promise<void>(resolve=>queue.push(resolve));active++;try{return await fn();}finally{active--;queue.shift()?.();}}
export async function resourceDataUrl(url:string):Promise<string>{
 if(url.startsWith('data:image/'))return url;
 const r=await fetch(url,{signal:AbortSignal.timeout(10000),credentials:'omit'});if(!r.ok)throw Error('Imagem indisponível');const b=await r.blob();if(!b.type.startsWith('image/')||b.size>8_000_000)throw Error('Imagem fora do limite');
 return new Promise<string>((resolve,reject)=>{const f=new FileReader();f.onload=()=>resolve(String(f.result));f.onerror=reject;f.readAsDataURL(b);});
}
async function renditionKey(meta:MessageMeta){const {data}=await supabase.auth.getSession();const owner=data.session?.user.id;if(!owner)throw Error('Sessão necessária para preparar a prévia.');actor=owner;return `journey-rendition:v2:${owner}:${meta.snapshot_id}:${meta.content_fingerprint}`;}
const cacheable=(m:MessageMeta)=>m.channel==='E-mail'?m.preview_hint.has_html:!!m.preview_hint.text;
export async function cachedRendition(meta:MessageMeta):Promise<Rendition|null>{if(!cacheable(meta))return null;const key=await renditionKey(meta);const cached=await get<Rendition>(key).catch(()=>undefined);return cached&&Date.now()-cached.at<3*86400000?cached:null;}
export async function prepareRendition(meta:MessageMeta,provided?:PackageMessage):Promise<Rendition>{
 const key=await renditionKey(meta);
 if(jobs.has(key))return jobs.get(key)!;
 const owner=actor;
 const job=limited(async()=>{const cached=cacheable(meta)?await get<Rendition>(key).catch(()=>undefined):undefined;if(cached&&Date.now()-cached.at<3*86400000)return cached;
 if(cacheable(meta))await renditionState(meta,owner,'rendering').catch(()=>{});
 const message=provided||await readJourneyMessage(meta.snapshot_id,meta.occurrence_key);
 const current=meta.observed_template_id&&!message.content.body_text&&!message.content.email_html?await readCurrentContent(meta.observed_template_id):[];
 const res=resolvePreview({channel:message.content.channel,catalog:meta.catalog?[meta.catalog]:[],contents:new Map(meta.observed_template_id?[[meta.observed_template_id,current]]:[]),templateId:meta.observed_template_id,packContent:message.content});
 const warnings:string[]=[];
 if(res.kind==='catalog_image'&&res.assetPath){const url=await resourceDataUrl(await cachedSignedUrl(res.assetPath));const img=await loadImage(url);const result={url,width:img.naturalWidth,height:img.naturalHeight,warnings,source:res.label,at:Date.now()};return result;}
 let html=res.content?.email_html||'';
 if(res.kind==='catalog_html'&&res.assetPath)html=await fetch(await cachedSignedUrl(res.assetPath)).then(r=>{if(!r.ok)throw Error('HTML indisponível');return r.text();});
 if(!html&&!res.content)throw Error(res.detail);
 const {toPng}=await import('html-to-image');let frame:HTMLIFrameElement|null=null;const host=document.createElement('div');host.style.cssText='position:fixed;left:-10000px;top:0;width:640px;background:white;pointer-events:none;';document.body.appendChild(host);
 try{let node:HTMLElement;
 if(html){const doc=new DOMParser().parseFromString(html,'text/html');doc.querySelectorAll('script,iframe,object,embed,form').forEach(n=>n.remove());doc.querySelectorAll('*').forEach(el=>{for(const a of [...el.attributes])if(/^on/i.test(a.name)||/^\s*(javascript|vbscript):/i.test(a.value))el.removeAttribute(a.name);});frame=document.createElement('iframe');frame.sandbox.add('allow-same-origin');frame.style.cssText='width:640px;height:1000px;border:0';host.appendChild(frame);const ready=new Promise<void>((resolve,reject)=>{const timeout=setTimeout(()=>reject(Error('Tempo limite do render')),10000);frame!.onload=()=>{clearTimeout(timeout);resolve();};});frame.srcdoc='<!doctype html>'+doc.documentElement.outerHTML;await ready;node=frame.contentDocument!.body;
 }else{host.style.width=message.content.channel==='SMS'?'450px':'500px';const visual=document.createElement('div');visual.style.width=host.style.width;visual.innerHTML=renderToStaticMarkup(<MessagePreview content={res.content!}/>);host.appendChild(visual);node=visual;}
 for(const image of [...node.querySelectorAll('img')]){try{const src=image.getAttribute('src');if(src){image.src=await resourceDataUrl(new URL(src,location.href).href);await image.decode().catch(()=>{});}}catch{warnings.push('Uma imagem da origem não pôde ser preparada.');const note=node.ownerDocument.createElement('p');note.textContent='Imagem indisponível na origem';note.style.cssText='padding:12px;font:12px Arial;color:#64748b;background:#f1f5f9';image.replaceWith(note);}}
 const width=html?640:message.content.channel==='SMS'?450:500,height=Math.min(16000,Math.max(node.scrollHeight,100));if(node.scrollHeight>16000)warnings.push('Prévia limitada a 16.000 px de altura.');
 if(frame){
  frame.style.height=height+'px';
  // Rasterize in the parent document: foreign-document body nodes can fail
  // SVG image decoding. Preserve computed email styles without importing
  // its global stylesheet into the application.
  const source=[node,...node.querySelectorAll('*')];
  const copy=document.importNode(node,true);
  const target=[copy,...copy.querySelectorAll('*')];
  source.forEach((el,i)=>{const dest=target[i] as HTMLElement;if(!dest?.style)return;const style=frame!.contentWindow!.getComputedStyle(el);for(const property of Array.from(style))dest.style.setProperty(property,style.getPropertyValue(property));dest.removeAttribute('id');});
  const wrapper=document.createElement('div');wrapper.style.cssText=`width:${width}px;background:white;`;wrapper.appendChild(copy);host.appendChild(wrapper);node=wrapper;
 }
 const url=html
  ? (await (await import('html2canvas')).default(node,{width,height,scale:1,backgroundColor:'#fff',logging:false,imageTimeout:10000})).toDataURL('image/png')
  : await toPng(node,{width,height,pixelRatio:1,skipFonts:true,backgroundColor:'#fff',cacheBust:false});
 const result={url,width,height,warnings:[...new Set(warnings)],source:res.label,at:Date.now()};if(cacheable(meta)){await set(key,result).catch(()=>{});await persistRendition(meta,result,owner).catch(()=>{});}const stored=(await keys().catch(()=>[])).filter(k=>String(k).startsWith(`journey-rendition:v2:${actor}:`));if(stored.length>20)await Promise.all(stored.slice(0,stored.length-20).map(k=>del(k)));if(typeof window!=='undefined')window.dispatchEvent(new CustomEvent('journey-preview-ready',{detail:{fingerprint:meta.content_fingerprint}}));return result;
 }finally{host.remove();}
 });jobs.set(key,job);job.catch(()=>{jobs.delete(key);if(cacheable(meta))void renditionState(meta,owner,'failed').catch(()=>{});});return job;
}
async function renditionState(meta:MessageMeta,owner:string,status:string){const {data}=await supabase.auth.getSession();if(data.session?.user.id!==owner)return;const {error}=await supabase.from('journey_preview_renditions').upsert({owner_id:owner,snapshot_id:meta.snapshot_id,occurrence_key:meta.occurrence_key,content_fingerprint:meta.content_fingerprint,renderer_version:'flow-v2-1',status,updated_at:new Date().toISOString()});if(error)throw error;}
async function persistRendition(meta:MessageMeta,r:Rendition,owner:string){
 const {data}=await supabase.auth.getSession();if(data.session?.user.id!==owner)return;
 const key={owner_id:owner,snapshot_id:meta.snapshot_id,occurrence_key:meta.occurrence_key,content_fingerprint:meta.content_fingerprint,renderer_version:'flow-v2-1'};
 const fullPath=`sfmc-previews/${owner}/${meta.content_fingerprint}/flow-v2-1-full.png`,thumbPath=`sfmc-previews/${owner}/${meta.content_fingerprint}/flow-v2-1-thumb.png`;
 const img=await loadImage(r.url),c=document.createElement('canvas');c.width=128;c.height=168;const ctx=c.getContext('2d')!;ctx.fillStyle='white';ctx.fillRect(0,0,128,168);ctx.drawImage(img,0,0,128,r.height*128/r.width);
 const full=await fetch(r.url).then(x=>x.blob()),thumb=await new Promise<Blob>((resolve,reject)=>c.toBlob(b=>b?resolve(b):reject(Error('Miniatura indisponível')),'image/png'));
 for(const [path,blob] of [[fullPath,full],[thumbPath,thumb]] as [string,Blob][]){const {error}=await supabase.storage.from('crm-communications').upload(path,blob,{contentType:'image/png',upsert:false});if(error&&!/already exists|Duplicate/i.test(error.message))throw error;}
 const {error}=await supabase.from('journey_preview_renditions').upsert({...key,status:'ready',full_path:fullPath,thumbnail_path:thumbPath,width:r.width,height:r.height,warnings:r.warnings,source:r.source,updated_at:new Date().toISOString()});if(error)throw error;
}
export async function warmImportPreviews(importId:string,pkg:ParsedPackage){
 const {readJourneyIndex}=await import('./journeyReadService');const index=await readJourneyIndex();const supplied=new Map(pkg.messages.map(m=>[m.occurrence_key,m]));
 for(const j of index.filter(j=>j.import_id===importId))for(const m of j.messages){if(document.hidden)await new Promise<void>(resolve=>{const visible=()=>{if(!document.hidden){document.removeEventListener('visibilitychange',visible);resolve();}};document.addEventListener('visibilitychange',visible);});await new Promise<void>(resolve=>{if('requestIdleCallback' in window)window.requestIdleCallback(()=>resolve(),{timeout:1500});else setTimeout(resolve,150);});try{await prepareRendition(m,supplied.get(m.occurrence_key));}catch{}}
}
export function loadImage(src:string):Promise<HTMLImageElement>{return new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=()=>reject(Error('Falha na imagem preparada'));i.src=src;});}
