import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Upload, Loader2 } from 'lucide-react';
import { listTemplates, describeError } from '../../services/communicationService';
import { applyPackage, listPackageImports, notifyPackageChanged, previewApply, readCandidates, readContents, readPackage, rejectMessages, stagePackage } from '../../services/sfmcPackageService';
import { parsePackageInWorker } from '../../modules/sfmc-package/workerClient';
import { reconcileMessage } from '../../modules/sfmc-package/reconcile';
import { normalizeJourney } from '../../modules/sfmc-package/parsePackage';
import { isValidTemplateId } from '../../utils/templateId';
import type { ApplyPreview, CandidateActivity, PackageImport, ReviewDecision, StoredMessage, TemplateContent } from '../../modules/sfmc-package/types';
import type { CommunicationTemplate } from '../../types/communication';
import { MessagePreview } from './previews/MessagePreview';
import { TemplateIdChips } from './TemplateIdChips';
const control = 'rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm';
const action = 'rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40';
const day = (value: string) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year:'numeric', month:'2-digit', day:'2-digit' }).format(new Date(value));
type Edit = { selected: boolean; templateId: string; activityIds: string[]; setCurrent: boolean };
export function PackageImportModal({ onClose, onChanged }: { onClose: () => void; onChanged: () => void }) {
  const [imports, setImports] = useState<PackageImport[]>([]), [catalog, setCatalog] = useState<CommunicationTemplate[]>([]);
  const [importId, setImportId] = useState(''), [messages, setMessages] = useState<StoredMessage[]>([]);
  const [candidates, setCandidates] = useState<CandidateActivity[]>([]), [contents, setContents] = useState<TemplateContent[]>([]);
  const [edits, setEdits] = useState<Record<string, Edit>>({});
  const [scope, setScope] = useState(''), [start, setStart] = useState(''), [end, setEnd] = useState(''), [evidence, setEvidence] = useState('');
  const [confirmed, setConfirmed] = useState(false), [channel, setChannel] = useState(''), [query, setQuery] = useState('');
  const [busy, setBusy] = useState(''), [error, setError] = useState(''), [success, setSuccess] = useState('');
  const [simulation, setSimulation] = useState<(ApplyPreview & { preview_token: string }) | null>(null);
  const [review, setReview] = useState<ReviewDecision[]>([]), [key, setKey] = useState('');
  const abort = useRef<AbortController>(), root = useRef<HTMLDivElement>(null), close = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null, overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden'; close.current?.focus();
    const keyboard = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { abort.current?.abort(); onClose(); }
      if (e.key === 'Tab') {
        const nodes = Array.from(root.current?.querySelectorAll<HTMLElement>('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled])') || []);
        const first=nodes[0], last=nodes[nodes.length-1];
        if (e.shiftKey && document.activeElement===first) { e.preventDefault(); last?.focus(); }
        if (!e.shiftKey && document.activeElement===last) { e.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener('keydown', keyboard);
    return () => { abort.current?.abort(); document.body.style.overflow=overflow; document.removeEventListener('keydown',keyboard); previous?.focus(); };
  }, [onClose]);
  useEffect(() => { Promise.all([listPackageImports(), listTemplates()]).then(([i,c]) => { setImports(i); setCatalog(c); }).catch(e => setError(describeError(e))); }, []);
  const run = async (label: string, fn: () => Promise<void>) => {
    setBusy(label); setError(''); setSuccess('');
    try { await fn(); } catch (e) { setError(describeError(e)); } finally { setBusy(''); }
  };
  const open = async (id: string) => {
    const [rows, acts, versions] = await Promise.all([readPackage(id), readCandidates(id), readContents()]);
    setImportId(id); setMessages(rows); setCandidates(acts); setContents(versions); setSimulation(null);
    setEdits(Object.fromEntries(rows.map(row => [row.id, { selected: false, templateId: reconcileMessage(row.payload,catalog).templateId, activityIds: [], setCurrent: false }])));
  };
  const update = (id: string, values: Partial<Edit>) => {
    setSimulation(null);
    setEdits(prev => {
      const next = { ...prev, [id]: { ...prev[id], ...values } };
      if (values.setCurrent) for (const [other, edit] of Object.entries(next)) if (other!==id && edit.templateId===next[id].templateId) next[other]={...edit,setCurrent:false};
      return next;
    });
  };
  const exactFor = (row: StoredMessage) => candidates.filter(a => a.activity_name===row.payload.activity_name && a.channel===row.payload.content.channel && normalizeJourney(a.journey_name)===normalizeJourney(row.payload.journey_name));
  const eligibleActs = (row: StoredMessage) => confirmed && start && end && evidence.trim() ? exactFor(row).filter(a => day(a.dispatch_date)>=start && day(a.dispatch_date)<=end && (!a.template_id || a.template_id===edits[row.id]?.templateId)) : [];
  const changedPeriod = () => { setSimulation(null); setConfirmed(false); setEdits(prev=>Object.fromEntries(Object.entries(prev).map(([id,e])=>[id,{...e,activityIds:[]}]))); };
  const decisions = (): ReviewDecision[] => messages.filter(r => edits[r.id]?.selected && r.decision==='pending').map(row => {
    const edit = edits[row.id];
    if (!isValidTemplateId(edit.templateId)) throw new Error('Escolha um template ID válido para ' + row.payload.activity_name);
    const template = catalog.find(t => t.template_id===edit.templateId);
    if (template && template.channel!==row.payload.content.channel) throw new Error('Canal incompatível com o template selecionado.');
    if (edit.activityIds.length && (!confirmed || !start || !end || !evidence.trim())) throw new Error('Confirme o período e a evidência antes de vincular disparos.');
    return { message_id:row.id, template_id:edit.templateId, activity_ids:edit.activityIds, start_date:start||null, end_date:end||null, evidence:evidence.trim(), set_current:edit.setCurrent, expected_current_id:contents.find(c=>c.template_id===edit.templateId && c.is_current)?.id||null };
  });
  const visible = messages.filter(r => (!channel || r.payload.content.channel===channel) && (!query || (r.payload.activity_name+' '+r.payload.journey_name).toLowerCase().includes(query.toLowerCase())));
  return createPortal(<div className="fixed inset-0 z-[100] flex justify-center bg-slate-950/40 p-3 sm:p-6"><div ref={root} role="dialog" aria-modal="true" aria-labelledby="sfmc-title" className="flex h-full w-full max-w-7xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
    <header className="flex items-center justify-between border-b px-6 py-4"><div><h2 id="sfmc-title" className="text-xl font-semibold">Importar pacote SFMC</h2><p className="text-xs text-slate-500">Importar estrutura e texto → revisar → simular → aplicar</p></div><button ref={close} onClick={onClose} aria-label="Fechar importação" className="rounded border p-2"><X size={20}/></button></header>
    <div className="flex-1 space-y-4 overflow-y-auto p-5">
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {success && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{success}</p>}
      <div className="flex flex-wrap items-end gap-3 rounded-xl border bg-slate-50 p-4">
        <label className="flex flex-col gap-1 text-xs font-medium">BU/conta de origem<input className={control} value={scope} maxLength={200} onChange={e=>setScope(e.target.value)} placeholder="Ex.: BU Plurix · conta SFMC"/></label>
        <label className={action + ' inline-flex cursor-pointer items-center gap-2'}><Upload size={16}/>Selecionar ZIP<input type="file" accept=".zip" className="sr-only" disabled={!!busy || !scope.trim()} onChange={e => {
          const file=e.target.files?.[0]; e.target.value=''; if(!file)return;
          void run('Lendo e importando estrutura...', async()=>{
            abort.current=new AbortController(); const pkg=await parsePackageInWorker(file,abort.current.signal);
            if(abort.current.signal.aborted)return;
            const id=await stagePackage(pkg,scope);
            setImports(await listPackageImports()); await open(id);
            setSuccess(pkg.journeys_count+' jornadas · '+pkg.messages.length+' mensagens. Apenas a área de revisão foi gravada.');
          });
        }}/></label>
        <label className="flex min-w-56 flex-col gap-1 text-xs font-medium">Retomar importação<select className={control} value={importId} disabled={!!busy} onChange={e=>{ const id=e.target.value;if(id)void run('Carregando revisão...',()=>open(id)); }}><option value="">Últimas 50 importações</option>{imports.map(i=><option key={i.id} value={i.id}>{i.file_name} · {i.status}</option>)}</select></label>
        {busy && <span role="status" className="flex items-center gap-2 text-sm text-slate-500"><Loader2 size={16} className="animate-spin"/>{busy}</span>}
      </div>
      {importId && <>
        <p className="text-sm text-slate-600">{messages.length} ocorrências · {messages.filter(r=>r.payload.is_optout).length} opt-outs excluídos · {messages.filter(r=>r.decision==='applied').length} aplicadas. A versão exportada não comprova o conteúdo enviado no passado.</p>
        <section className="space-y-3 rounded-xl border p-4"><h3 className="font-semibold">Vínculo de disparos históricos (opcional)</h3><p className="text-xs text-slate-500">Você pode importar somente o conteúdo. Para vincular disparos, confirme a janela e selecione os registros da mesma jornada e canal.</p>
          <div className="flex flex-wrap gap-3"><label className="text-xs">Início<input aria-label="Início do período comprovado" type="date" className={control+' ml-2'} value={start} onChange={e=>{setStart(e.target.value);changedPeriod();}}/></label><label className="text-xs">Fim<input aria-label="Fim do período comprovado" type="date" className={control+' ml-2'} value={end} onChange={e=>{setEnd(e.target.value);changedPeriod();}}/></label><input aria-label="Evidência do período" className={control+' min-w-64 flex-1'} value={evidence} placeholder="Evidência ou confirmação operacional do período" onChange={e=>{setEvidence(e.target.value);changedPeriod();}}/></div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={confirmed} disabled={!start || !end || end<start || !evidence.trim()} onChange={e=>{setConfirmed(e.target.checked);setSimulation(null);if(!e.target.checked)changedPeriod();}}/>Confirmo que esta janela corresponde à versão revisada</label>
        </section>
        <div className="flex flex-wrap gap-2"><input aria-label="Buscar mensagem" className={control+' flex-1'} value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar jornada ou Activity Name"/><select aria-label="Filtrar canal" className={control} value={channel} onChange={e=>setChannel(e.target.value)}><option value="">Todos os canais</option>{['WhatsApp','SMS','E-mail','Push'].map(c=><option key={c}>{c}</option>)}</select>
          <button disabled={!!busy} className={control} onClick={()=>{setSimulation(null);setEdits(prev=>{const next={...prev};for(const row of visible){const match=reconcileMessage(row.payload,catalog);if(row.decision==='pending' && match.eligible && (match.status!=='Título único' || confirmed))next[row.id]={...next[row.id],selected:true};}return next;});}}>Selecionar vínculos exatos e títulos elegíveis</button>
        </div>
        <div className="space-y-3">{visible.map(row => {
          const p=row.payload, edit=edits[row.id], match=reconcileMessage(p,catalog), pending=row.decision==='pending'&&!p.is_optout;
          const exact=exactFor(row), acts=eligibleActs(row);
          const current=contents.find(c=>c.template_id===edit?.templateId&&c.is_current);
          const other=candidates.filter(a=>a.activity_name===p.activity_name&&!exact.some(x=>x.id===a.id));
          const versions=contents.filter(c=>c.template_id===edit?.templateId);
          return <article key={row.id} className={'rounded-xl border p-4 '+(edit?.selected?'border-cyan-300 bg-cyan-50/20':'border-slate-200')}>
            <div className="flex items-start gap-3"><input aria-label={'Selecionar '+p.activity_name} type="checkbox" disabled={!pending||!!busy} checked={!!edit?.selected} onChange={e=>update(row.id,{selected:e.target.checked})}/><div className="min-w-0 flex-1"><h3 className="break-all text-sm font-semibold">{p.activity_name || 'Atividade sem nome'}</h3><p className="break-all text-xs text-slate-500">{p.journey_name} · versão {p.journey_version} · {p.content.channel}</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs">{p.is_optout?'Opt-out':row.decision==='pending'?match.status:row.decision==='applied'?'Aplicada':'Rejeitada'}</span></div>
            <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]"><div className="space-y-3">
              <label className="block text-xs font-medium">Template ID<input list="sfmc-catalog" aria-label={'Template ID de '+p.activity_name} className={control+' mt-1 w-full font-mono'} value={edit?.templateId||''} disabled={!pending||!!busy} onChange={e=>update(row.id,{templateId:e.target.value.trim(),activityIds:[],setCurrent:false})}/></label>
              {edit?.templateId&&<TemplateIdChips id={edit.templateId} showId/>}
              <p className="text-xs text-slate-500">{p.content.meta_template_name || p.asset_name || 'Nome de template não disponível'} · {exact.length} registros na mesma jornada/canal · {other.length} em outros contextos (fora da seleção)</p>
              {p.paths.map((path,i)=><p key={i} className="text-xs text-slate-600">{path.labels.join(' → ') || 'Caminho principal'}{path.waits.length?' · Esperas: '+path.waits.join(' + '):''}</p>)}
              {p.alerts.map((a,i)=><p key={i} className="rounded bg-amber-50 px-2 py-1 text-xs text-amber-800">{a}</p>)}
              {p.link_url&&<details className="text-xs"><summary className="cursor-pointer text-cyan-800">Link e atribuição da ocorrência</summary><p className="mt-2 break-all">{p.link_url}</p><pre className="overflow-auto whitespace-pre-wrap">{JSON.stringify(p.utm,null,2)}</pre></details>}
              {pending&&<><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={edit?.setCurrent||false} disabled={!!busy||!edit?.templateId} onChange={e=>update(row.id,{setCurrent:e.target.checked})}/>Escolher este texto como versão atual</label>
              <p className="text-xs text-slate-500">{versions.length} versão(ões) já importadas. {current?'Existe versão atual selecionada; esta ação a substituirá.':'Sem versão atual selecionada.'}</p>
              {current&&<details className="text-xs"><summary className="cursor-pointer text-cyan-800">Comparar texto atual</summary><MessagePreview content={current.payload}/></details>}
              {acts.length>0&&<div className="rounded-lg border bg-white p-3"><p className="mb-2 text-xs font-semibold">Disparos elegíveis no período confirmado</p>{acts.map(a=><label key={a.id} className="flex items-center gap-2 py-1 text-xs"><input type="checkbox" disabled={!!busy} checked={edit?.activityIds.includes(a.id)||false} onChange={e=>update(row.id,{activityIds:e.target.checked?[...edit.activityIds,a.id]:edit.activityIds.filter(id=>id!==a.id)})}/>{day(a.dispatch_date)} · {a.template_id?'Já vinculado ao mesmo template':'Sem template'} · <span className="font-mono">{a.id.slice(0,8)}</span></label>)}</div>}
              {exact.some(a=>a.template_id&&a.template_id!==edit?.templateId)&&<p className="text-xs text-amber-800">Há registros vinculados a outro template. Eles não podem ser sobrescritos.</p>}
              <button className="text-xs text-slate-500 underline" disabled={!!busy} onClick={()=>void run('Rejeitando mensagem...',async()=>{await rejectMessages(importId,[row.id]);await open(importId);})}>Rejeitar esta mensagem</button></>}
            </div><MessagePreview content={p.content} compact/></div>
          </article>;
        })}</div>
        <datalist id="sfmc-catalog">{catalog.map(t=><option key={t.template_id} value={t.template_id}>{t.title} · {t.channel}</option>)}</datalist>
      </>}
    </div>
    <footer className="space-y-3 border-t bg-white px-5 py-4">
      {simulation&&<div role="status" className="rounded-lg bg-cyan-50 p-3 text-sm text-cyan-900">{simulation.messages} mensagens aprovadas · {simulation.activities} disparos ganham template · {simulation.new_templates} rascunhos · {simulation.contents} versões novas · {simulation.new_slots} slots novos</div>}
      <div className="flex justify-end gap-3"><button className={control} disabled={!!busy||!importId} onClick={()=>void run('Simulando aplicação...',async()=>{const d=decisions();const s=await previewApply(importId,d);setReview(d);setKey(crypto.randomUUID());setSimulation(s);})}>Simular seleção</button>
      <button className={action} disabled={!!busy||!simulation} onClick={()=>void run('Aplicando revisão...',async()=>{if(!simulation)return;const result=await applyPackage(importId,review,simulation.preview_token,key);setCatalog(await listTemplates());await open(importId);setImports(await listPackageImports());setSuccess(result.messages+' mensagens aplicadas; '+result.activities+' disparos vinculados.');notifyPackageChanged();onChanged();})}>Aprovar e aplicar seleção</button></div>
    </footer>
  </div></div>,document.body);
}

