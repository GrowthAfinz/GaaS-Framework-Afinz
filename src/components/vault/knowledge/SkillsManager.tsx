import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Plus, X, Trash2 } from 'lucide-react';
import { changeSkillRepository, readSkillZip } from './skillsRepository';

type Target = {id:string;name:string};
export function SkillsManager({ target, onClose, onPublished }: {target:Target|null;onClose:()=>void;onPublished:(name:string,remove:boolean)=>void}) {
  const [token,setToken]=useState(''), [version,setVersion]=useState('1.0.0'), [process,setProcess]=useState('');
  const [file,setFile]=useState<File|null>(null), [confirm,setConfirm]=useState('');
  const [busy,setBusy]=useState(false), [error,setError]=useState(''), [progress,setProgress]=useState('');
  const [commit,setCommit]=useState('');
  const form=useRef<HTMLFormElement>(null);
  useEffect(()=>{
    const previous=document.activeElement as HTMLElement|null;
    const overflow=document.body.style.overflow;document.body.style.overflow='hidden';
    return ()=>{document.body.style.overflow=overflow;previous?.focus();};
  },[]);
  async function submit() {
    setBusy(true);setError('');
    try {
      if (target && confirm !== target.name) throw new Error('Digite o nome exato para confirmar a exclusão.');
      if (!target && !file) throw new Error('Selecione o ZIP da skill.');
      if (file && file.size > 95*1024*1024) throw new Error('Limite de 95 MB para o ZIP.');
      const addition = !target ? readSkillZip(new Uint8Array(await file!.arrayBuffer()),process,version) : null;
      const operation = addition ? {add:addition} : {remove:target!.id};
      const result = await changeSkillRepository(token,operation,setProgress);
      setToken('');setCommit(result.sha);onPublished(target?.name || addition!.name,Boolean(target));
      setProgress('Alteração gravada na main. O GitHub está preparando a publicação do catálogo.');
    } catch(e) {setError(e instanceof Error ? e.message : 'Falha ao alterar o catálogo.');setProgress('');}
    finally {setBusy(false);}
  }
  const field='w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800';
  return createPortal(<div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/30 p-4" role="dialog" aria-modal="true" aria-label={target ? 'Excluir skill' : 'Adicionar nova skill'} onKeyDown={e=>{
    if(e.key==='Escape'&&!busy)onClose();
    if(e.key==='Tab'){
      const elements=Array.from(form.current?.querySelectorAll<HTMLElement>('button:not([disabled]),input:not([disabled]),a[href]')||[]);
      const first=elements[0],last=elements[elements.length-1];
      if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}
      if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}
    }
  }}>
    <form ref={form} className="max-h-[90vh] w-full max-w-xl space-y-4 overflow-auto rounded-2xl bg-white p-6 shadow-xl" onSubmit={e=>{e.preventDefault();void submit();}}>
      <div className="flex justify-between gap-3"><h3 className="text-lg font-semibold text-slate-900">{target ? `Excluir ${target.name}` : 'Adicionar nova skill'}</h3><button type="button" aria-label="Fechar" disabled={busy} onClick={onClose}><X size={20}/></button></div>
      <p className="text-sm leading-6 text-slate-600">{target ? 'A skill sairá do catálogo público após a publicação. O histórico continua disponível no GitHub.' : 'Envie uma skill por ZIP, com SKILL.md e seus arquivos auxiliares. Você autoriza a publicação integral dos arquivos no repositório público.'}</p>
      {!commit && <>
        {!target ? <>
          <label className="block text-sm font-medium">Pacote ZIP<input autoFocus className={`${field} mt-1`} type="file" accept=".zip,application/zip" required onChange={e=>setFile(e.target.files?.[0]||null)}/></label>
          <div className="grid gap-3 sm:grid-cols-2"><label className="text-sm font-medium">Processo<input className={`${field} mt-1`} required value={process} onChange={e=>setProcess(e.target.value)} placeholder="Ex.: Comunicações"/></label><label className="text-sm font-medium">Versão<input className={`${field} mt-1`} required pattern="[0-9]+\.[0-9]+\.[0-9]+" value={version} onChange={e=>setVersion(e.target.value)}/></label></div>
        </> : <label className="block text-sm font-medium">Digite {target.name} para excluir<input autoFocus className={`${field} mt-1`} value={confirm} onChange={e=>setConfirm(e.target.value)} required/></label>}
        <label className="block text-sm font-medium">Credencial do GitHub para publicar<input className={`${field} mt-1`} type="password" autoComplete="off" required value={token} onChange={e=>setToken(e.target.value)} placeholder="Token com escrita neste repositório"/></label>
        <p className="text-xs leading-5 text-slate-500">Usada apenas nesta operação e enviada diretamente à API do GitHub. Não é salva no navegador, no GaaS ou no repositório. Use uma credencial com Contents: read/write somente para GaaS-Framework-Afinz.</p>
      </>}
      {error&&<p role="alert" className="text-sm text-rose-700">{error}</p>}
      {progress&&<p role="status" className="text-sm text-cyan-800">{progress}</p>}
      {commit ? <a className="inline-block text-sm font-semibold text-cyan-800 underline" target="_blank" rel="noopener noreferrer" href={`https://github.com/growthafinz/GaaS-Framework-Afinz/commit/${commit}`}>Ver alteração e acompanhar publicação no GitHub</a> : <button type="submit" disabled={busy} className="inline-flex items-center gap-2 rounded-lg bg-cyan-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{target?<Trash2 size={15}/>:<Plus size={15}/>} {busy?'Processando…':target?'Excluir skill':'Publicar skill'}</button>}
    </form>
  </div>,document.body);
}
