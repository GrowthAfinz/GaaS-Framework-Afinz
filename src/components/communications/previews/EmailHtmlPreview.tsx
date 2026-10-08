import {useEffect,useState} from 'react';
import type {CommunicationTemplate,EmailTemplateMetadata} from '../../../types/communication';
import {ExternalLink,Printer} from 'lucide-react';
import {getSignedUrl} from '../../../services/communicationService';

// HTML do e-mail vem do catálogo (email.html no storage). O pacote do SFMC não traz a URL pública
// das imagens, então a prévia fiel é a do template; ela não certifica o que foi enviado.
const cache=new Map<string,Promise<string>>();
export const isHtmlTemplate=(t?:CommunicationTemplate|null)=>!!t?.original_path&&(t.mime_type==='text/html'||/\.html?$/i.test(t.original_path));
const loadHtml=(path:string)=>{
 if(!cache.has(path))cache.set(path,getSignedUrl(path).then(u=>fetch(u)).then(r=>{if(!r.ok)throw Error(String(r.status));return r.text();}).catch(e=>{cache.delete(path);throw e;}));
 return cache.get(path)!;
};
const reset='<style>html,body{margin:0!important;background:#fff;}</style>';
const withReset=(html:string)=>/<head[^>]*>/i.test(html)?html.replace(/<head([^>]*)>/i,`<head$1>${reset}`):reset+html;

export function useTemplateHtml(template?:CommunicationTemplate|null) {
 const [html,setHtml]=useState<string|null>(null),[failed,setFailed]=useState(false);
 const path=isHtmlTemplate(template)?template!.original_path!:null;
 useEffect(()=>{let active=true;setHtml(null);setFailed(false);if(path)loadHtml(path).then(h=>{if(active)setHtml(withReset(h));}).catch(()=>{if(active)setFailed(true);});return()=>{active=false;};},[path]);
 return {html,failed,loading:!!path&&!html&&!failed};
}

/** Miniatura: e-mail de 600px reduzido para caber no quadro da fila. */
export function EmailThumb({html}:{html:string}) {
 return <div className="pointer-events-none h-full w-full overflow-hidden" aria-hidden="true">
  <iframe title="Miniatura do e-mail" sandbox="" srcDoc={html} tabIndex={-1} className="origin-top-left border-0 bg-white" style={{width:600,height:700,transform:'scale(0.0934)'}}/>
 </div>;
}

/** Prévia em tamanho real, rolável, sem scripts nem navegação (sandbox vazio). */
export function EmailFrame({html,title,height='calc(var(--screen-h) * 0.62)'}:{html:string;title:string;height?:string}) {
 return <iframe title={title} sandbox="" srcDoc={html} className="w-full rounded-lg border bg-white" style={{height}}/>;
}

// Cópia sem scripts, eventos inline nem javascript: para abrir fora do iframe (nova aba / impressão).
function sanitized(html:string,title:string):string {
 const doc=new DOMParser().parseFromString(html,'text/html');
 doc.querySelectorAll('script,iframe,object,embed,form').forEach(n=>n.remove());
 doc.querySelectorAll('*').forEach(el=>{for(const a of [...el.attributes]){if(/^on/i.test(a.name)||/^\s*javascript:/i.test(a.value))el.removeAttribute(a.name);}});
 if(!doc.title)doc.title=title;
 return '<!DOCTYPE html>'+doc.documentElement.outerHTML;
}
function openCopy(html:string,title:string,print:boolean) {
 const url=URL.createObjectURL(new Blob([sanitized(html,title)],{type:'text/html'}));
 const win=window.open(url,'_blank');
 if(win&&print)win.addEventListener('load',()=>{const imgs=[...win.document.images];Promise.race([Promise.all(imgs.map(i=>i.complete?null:new Promise(r=>{i.onload=i.onerror=r;}))),new Promise(r=>setTimeout(r,4000))]).then(()=>win.print());});
 setTimeout(()=>URL.revokeObjectURL(url),60_000);
}

/** Painel do e-mail: assunto, pré-cabeçalho, ações e a prévia. */
export function EmailPreviewPanel({html,template,height}:{html:string;template:CommunicationTemplate;height?:string}) {
 const meta=(template.metadata||{}) as EmailTemplateMetadata;
 const title=`E-mail ${template.template_id}`;
 const btn='inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-700';
 return <div className="space-y-3">
  <dl className="grid gap-2 rounded-lg border bg-slate-50 p-3 text-sm">
   <div className="grid grid-cols-[110px_1fr] gap-2"><dt className="font-semibold text-slate-600">Assunto</dt><dd className="text-slate-900">{meta.subject||<span className="text-slate-500">Não cadastrado no catálogo</span>}</dd></div>
   <div className="grid grid-cols-[110px_1fr] gap-2"><dt className="font-semibold text-slate-600">Pré-cabeçalho</dt><dd className="text-slate-900">{meta.preheader||<span className="text-slate-500">Não cadastrado no catálogo</span>}</dd></div>
  </dl>
  <div className="flex flex-wrap gap-2">
   <button type="button" className={btn} onClick={()=>openCopy(html,title,false)}><ExternalLink size={16} aria-hidden="true"/>Abrir em nova aba</button>
   <button type="button" className={btn} onClick={()=>openCopy(html,title,true)}><Printer size={16} aria-hidden="true"/>Salvar em PDF</button>
  </div>
  <EmailFrame html={html} title={title} height={height}/>
 </div>;
}
