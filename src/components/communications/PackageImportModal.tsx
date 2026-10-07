import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Upload, Loader2 } from 'lucide-react';
import { describeError } from '../../services/communicationService';
import { stagePackage, notifyPackageChanged } from '../../services/sfmcPackageService';
import { parsePackageInWorker } from '../../modules/sfmc-package/workerClient';
export function PackageImportModal({onClose,onChanged}:{onClose:()=>void;onChanged:()=>void}) {
 const [scope,setScope]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const root=useRef<HTMLDivElement>(null),abort=useRef<AbortController>();
 useEffect(()=>{const previous=document.activeElement as HTMLElement|null,overflow=document.body.style.overflow;document.body.style.overflow='hidden';root.current?.querySelector<HTMLButtonElement>('button')?.focus();
 const keyboard=(e:KeyboardEvent)=>{if(e.key==='Escape'&&!busy)onClose();if(e.key==='Tab'){const nodes=Array.from(root.current?.querySelectorAll<HTMLElement>('button:not([disabled]),input:not([disabled])')||[]);const first=nodes[0],last=nodes[nodes.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}};
 document.addEventListener('keydown',keyboard);return()=>{document.body.style.overflow=overflow;document.removeEventListener('keydown',keyboard);previous?.focus();};},[onClose,busy]);
 useEffect(()=>()=>abort.current?.abort(),[]);
 return createPortal(<div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 p-4"><div ref={root} role="dialog" aria-modal="true" aria-labelledby="import-title" className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
 <header className="flex items-center justify-between"><h2 id="import-title" className="text-lg font-semibold">Importar pacote SFMC</h2><button aria-label="Fechar importação" disabled={busy} onClick={onClose} className="rounded border p-2"><X size={18}/></button></header>
 <p className="my-4 text-sm text-slate-600">Receber estrutura e comunicações para análise. A revisão e aprovação ficam na fila de propostas.</p>
 <label className="block text-sm">BU/conta de origem<input className="mt-1 w-full rounded-lg border px-3 py-2" maxLength={200} value={scope} disabled={busy} onChange={e=>setScope(e.target.value)} placeholder="Ex.: B2C · conta SFMC"/></label>
 {error&&<p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
 <label className={'mt-4 inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm '+(busy||!scope.trim()?'opacity-50':'cursor-pointer text-cyan-800')}><Upload size={16}/>Selecionar ZIP<input aria-label="Selecionar ZIP" type="file" accept=".zip" className="sr-only" disabled={busy||!scope.trim()} onChange={async e=>{const file=e.target.files?.[0];e.target.value='';if(!file)return;setBusy(true);setError('');try{abort.current=new AbortController();const pkg=await parsePackageInWorker(file,abort.current.signal);await stagePackage(pkg,scope);notifyPackageChanged();onChanged();onClose();}catch(err){setError(describeError(err));}finally{setBusy(false);}}}/></label>
 {busy&&<p role="status" className="mt-3 flex items-center gap-2 text-sm"><Loader2 size={16} className="animate-spin"/>Extraindo mensagens e preparando propostas…</p>}
 </div></div>,document.body);
}
