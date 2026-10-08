import {useEffect,useState} from 'react';
import type {CommunicationTemplate} from '../../../types/communication';
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
