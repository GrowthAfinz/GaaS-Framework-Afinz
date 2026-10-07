import { useEffect, useState } from 'react';
import type { TemplateContent } from '../../modules/sfmc-package/types';
import { notifyPackageChanged, readContents } from '../../services/sfmcPackageService';
import { supabase } from '../../services/supabaseClient';
import { describeError } from '../../services/communicationService';
import { MessagePreview } from './previews/MessagePreview';
import { TemplateIdChips } from './TemplateIdChips';
export function PackageContentLibrary({ templateIds }: { templateIds: string[] }) {
  const [versions,setVersions]=useState<TemplateContent[]>([]),[selected,setSelected]=useState<TemplateContent|null>(null);
  const [error,setError]=useState(''),[busy,setBusy]=useState(false),[query,setQuery]=useState('');
  useEffect(()=>{
    let active=true;
    const load=()=>readContents().then(rows=>{if(active){setVersions(rows);setSelected(prev=>prev?rows.find(r=>r.id===prev.id)||null:null);setError('');}}).catch(e=>{if(active)setError(describeError(e));});
    load();window.addEventListener('sfmc-package-changed',load);
    return()=>{active=false;window.removeEventListener('sfmc-package-changed',load);};
  },[]);
  const visibleVersions=versions.filter(v=>templateIds.includes(v.template_id));
  const ids=[...new Set(visibleVersions.map(v=>v.template_id))].filter(id=>id.toLowerCase().includes(query.toLowerCase()));
  return <section className="space-y-3 rounded-xl border border-cyan-100 bg-white p-4">
    <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold text-slate-800">Conteúdos importados do SFMC</h3><span className="text-xs text-slate-500">{new Set(visibleVersions.map(v=>v.template_id)).size} templates no recorte · {visibleVersions.length} versões</span></div>
    <p className="text-xs text-slate-500">O texto importado permite prévia sem print. A versão atual é escolhida explicitamente; o arquivo cadastrado permanece disponível.</p>
    {error&&<p role="alert" className="text-sm text-red-700">{error}</p>}
    {!visibleVersions.length&&!error&&<p className="rounded bg-slate-50 p-3 text-sm text-slate-500">Nenhum texto aprovado neste recorte. Consulte as comunicações recebidas na aba Propostas.</p>}
    {visibleVersions.length>0&&<><input aria-label="Buscar conteúdo importado" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar template ID" className="w-full rounded-lg border px-3 py-2 text-sm"/>
    <div className="space-y-1">{ids.map(id=>{
      const rows=versions.filter(v=>v.template_id===id),current=rows.find(v=>v.is_current),first=current||rows[0];
      return <button key={id} onClick={()=>setSelected(first)} className="flex w-full flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-left hover:border-cyan-400"><TemplateIdChips id={id} showId/><p className="text-xs text-slate-500">{rows.length} versão(ões) · {current?'Atual selecionada':'Escolha da atual pendente'}</p><p className="line-clamp-1 max-w-lg text-xs text-slate-600">{first.payload.body_text||'Sem texto extraído'}</p></button>;
    })}</div></>}
    {selected&&<div className="space-y-3 rounded-xl border border-cyan-200 bg-cyan-50/20 p-4">
      <div className="flex justify-between gap-3"><TemplateIdChips id={selected.template_id} showId/><button onClick={()=>setSelected(null)} className="text-sm text-cyan-800 underline">Fechar detalhe</button></div>
      <label className="block text-sm">Versão observada<select value={selected.id} onChange={e=>setSelected(versions.find(v=>v.id===e.target.value)||null)} className="ml-2 rounded border bg-white px-2 py-1">{versions.filter(v=>v.template_id===selected.template_id).map(v=><option key={v.id} value={v.id}>{v.content_hash.slice(0,10)} · {new Date(v.first_seen_at).toLocaleString('pt-BR')} {v.is_current?'· atual':''}</option>)}</select></label>
      <div className="grid gap-4 md:grid-cols-2"><MessagePreview key={selected.id} content={selected.payload}/><div className="space-y-3"><h4 className="font-semibold">Parâmetros do conteúdo</h4>{selected.payload.body_params.map((p,i)=><p key={i} className="break-all font-mono text-xs">{'$'+ '{'+(i+1)+'}'} → {p}</p>)}<p className="text-xs text-slate-500">Observado no GaaS em {new Date(selected.first_seen_at).toLocaleString('pt-BR')}. Esta data não comprova a vigência de um envio histórico.</p>
      {!selected.is_current&&<button disabled={busy} className="rounded-lg bg-cyan-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50" onClick={async()=>{
        setBusy(true);setError('');
        const current=versions.find(v=>v.template_id===selected.template_id&&v.is_current);
        try{const {error:e}=await supabase.rpc('select_communication_template_content',{p_content_id:selected.id,p_expected_current_id:current?.id||null});if(e)throw e;notifyPackageChanged();}
        catch(e){setError(describeError(e));}finally{setBusy(false);}
      }}>Escolher esta versão como atual</button>}</div></div>
    </div>}
  </section>;
}

