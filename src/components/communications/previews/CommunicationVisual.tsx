import {useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import type {MessageContent} from '../../../modules/sfmc-package/types';
import {MessagePreview} from './MessagePreview';
import type {CommunicationTemplate} from '../../../types/communication';
import {getSignedUrl} from '../../../services/communicationService';
export function CommunicationVisual({content,template}:{content:MessageContent;template?:CommunicationTemplate}) {
 const [open,setOpen]=useState(false),trigger=useRef<HTMLButtonElement>(null),dialog=useRef<HTMLDivElement>(null);
 const [asset,setAsset]=useState<string|null>(null),[failed,setFailed]=useState(false);
 const configured=!!content.body_text&&['WhatsApp','SMS'].includes(content.channel);
 const path=template?.preview_path||template?.thumbnail_path||template?.original_path;
 const image=!!path&&(/\.(png|jpe?g|webp|gif)$/i.test(path)||template?.mime_type?.startsWith('image/'));
 useEffect(()=>{let active=true;setAsset(null);setFailed(false);if(!configured&&path&&image)getSignedUrl(path).then(url=>{if(active)setAsset(url);}).catch(()=>{if(active)setFailed(true);});return()=>{active=false;};},[configured,path,image]);
 const available=configured||!!asset;
 useEffect(()=>{if(open&&!available)setOpen(false);},[available,open]);
 useEffect(()=>{if(!open)return;const previous=document.body.style.overflow;document.body.style.overflow='hidden';dialog.current?.focus();const key=(e:KeyboardEvent)=>{if(e.key==='Escape')setOpen(false);if(e.key==='Tab'){const nodes=dialog.current?.querySelectorAll<HTMLElement>('button');if(!nodes?.length)return;const first=nodes[0],last=nodes[nodes.length-1];if(e.shiftKey&&(document.activeElement===first||document.activeElement===dialog.current)){e.preventDefault();last.focus();}else if(!e.shiftKey&&(document.activeElement===last||document.activeElement===dialog.current)){e.preventDefault();first.focus();}}};document.addEventListener('keydown',key);return()=>{document.body.style.overflow=previous;document.removeEventListener('keydown',key);trigger.current?.focus();};},[open]);
 if(!available)return <span className="w-14 shrink-0 text-[9px] text-slate-400">{!configured&&path&&image&&!failed?'Carregando prévia…':'Sem prévia visual'}</span>;
 return <><button ref={trigger} aria-label="Ampliar prévia visual" onClick={()=>setOpen(true)} className="relative block h-16 w-14 shrink-0 overflow-hidden rounded-lg border bg-white shadow-sm hover:ring-2 hover:ring-cyan-400">{configured?<div className="pointer-events-none w-[300px] origin-top-left scale-[0.18]" aria-hidden="true"><MessagePreview content={content} compact/></div>:<img src={asset!} alt="Prévia do catálogo candidato" referrerPolicy="no-referrer" className="h-full w-full object-cover object-top" onError={()=>{setAsset(null);setFailed(true);}}/>}<span className="absolute bottom-0 inset-x-0 bg-cyan-800 py-1 text-[8px] text-white">Ampliar</span></button>{open&&createPortal(<div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/70 p-4" onClick={()=>setOpen(false)}><div ref={dialog} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Prévia visual da comunicação" onClick={e=>e.stopPropagation()} className="max-h-[90vh] w-full max-w-xl overflow-auto rounded-2xl bg-white p-5"><button onClick={()=>setOpen(false)} className="mb-3 float-right rounded border px-3 py-2">Fechar</button><p className="mb-4 text-sm font-semibold">{configured?'Comunicação configurada no pack SFMC':'Prévia do catálogo candidato · não certifica o conteúdo do pack'}</p>{configured?<MessagePreview content={content}/>:<img src={asset!} alt="Comunicação do catálogo candidato" className="w-full object-contain"/>}</div></div>,document.body)}</>;
}
