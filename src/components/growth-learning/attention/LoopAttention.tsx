import {ReactNode,useCallback,useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {Bell,CheckCircle2,ChevronRight,Clock3,RefreshCw,Star,X} from 'lucide-react';
import {useAuth} from '../../../context/AuthContext';
import {useAppStore} from '../../../store/useAppStore';
import {fetchKnowledgeSnapshot} from '../../vault/knowledge/knowledgeService';
import type {KnowledgeNote} from '../../vault/knowledge/knowledge.types';
import {attentionBody,defaultNoteAppend,listAttention,LoopItem,LOOP_COMMAND,preferAttention,proposeResultNote,requestSourceAnalysis} from './attentionService';
import './notifications.css';
const LABELS:Record<string,string>={needs_data:'Precisa de conferência',failed:'Erro de processamento',analysis_ready:'Análise disponível',running:'Em análise',awaiting_analysis:'Aguardando análise',needs_review:'Aguardando revisão',pending:'Aguardando análise',completed:'Concluída',blocked:'Pendência de dados'};
const FRONTS:Record<string,string>={crm_acquisition:'CRM',paid_media:'Mídia paga',b2c_origin:'B2C',rentabilization:'Rentabilização',knowledge:'Wiki'};
const control='rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 hover:border-cyan-500 disabled:opacity-50';
export function LoopAttention({placement='feed',goalNotice,onCountChange}:{placement?:'feed'|'planner';goalNotice?:(onVisibilityChange:(visible:boolean)=>void)=>ReactNode;onCountChange?:(count:number)=>void}){
 const {user}=useAuth();const setView=useAppStore(s=>s.setTab);const [items,setItems]=useState<LoopItem[]>([]),[error,setError]=useState(''),[loading,setLoading]=useState(true),[selected,setSelected]=useState<LoopItem|null>(null),[busy,setBusy]=useState(false),[showHidden,setShowHidden]=useState(false),[notice,setNotice]=useState('');
 const [notes,setNotes]=useState<KnowledgeNote[]>([]),[notePath,setNotePath]=useState(''),[markdown,setMarkdown]=useState(''),[baseHash,setBaseHash]=useState(''),[editing,setEditing]=useState(false),[snoozeDate,setSnoozeDate]=useState('');
 const [goalVisible,setGoalVisible]=useState(false);
 const handledLink=useRef('');
 useEffect(()=>{if(placement!=='feed')return;const sync=()=>{const id=new URLSearchParams(location.search).get('attention');if(id&&handledLink.current!==id){const item=items.find(i=>i.id===id);if(item){setSelected(item);handledLink.current=id;}else if(!showHidden)setShowHidden(true);}};sync();window.addEventListener('popstate',sync);return()=>window.removeEventListener('popstate',sync);},[items,placement,showHidden]);
 const load=useCallback(async()=>{try{const next=await listAttention(showHidden);setItems(next);setSelected(current=>current?next.find(n=>n.id===current.id)||null:null);setError('');}catch(e){setError(e instanceof Error?e.message:'Não foi possível ler os avisos. Tente atualizar.');}finally{setLoading(false);}},[showHidden]);
 useEffect(()=>{setItems([]);setSelected(null);if(!user){setLoading(false);return;}void load();const timer=window.setInterval(()=>void load(),30000);const focus=()=>void load();window.addEventListener('focus',focus);return()=>{clearInterval(timer);window.removeEventListener('focus',focus);};},[load,user?.id]);
 useEffect(()=>{setEditing(false);setNotes([]);setNotePath('');setMarkdown('');setNotice('');},[selected?.id]);
 useEffect(()=>{if(!selected)return;const previous=document.activeElement as HTMLElement|null;const listener=(e:KeyboardEvent)=>{if(e.key==='Escape')setSelected(null);if(e.key==='Tab'){const nodes=Array.from(document.querySelectorAll<HTMLElement>('[data-loop-drawer] button:not([disabled]),[data-loop-drawer] select,[data-loop-drawer] input,[data-loop-drawer] textarea,[data-loop-drawer] summary')).filter(n=>n.getClientRects().length>0);const first=nodes[0],last=nodes[nodes.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}};window.addEventListener('keydown',listener);return()=>{window.removeEventListener('keydown',listener);previous?.focus();};},[selected?.id]);
 const run=async(fn:()=>Promise<unknown>)=>{setBusy(true);try{await fn();await load();setError('');}catch(e){setError(e instanceof Error?e.message:'Não foi possível concluir.');}finally{setBusy(false);}};
 const prefer=(i:LoopItem,action:string,until?:string)=>void run(()=>preferAttention(i.id,action,until));
 const open=(i:LoopItem)=>{setSelected(i);void preferAttention(i.id,'read').catch(()=>{});};
 const go=(route:string)=>{const url=new URL(route,location.href);if(url.origin!==location.origin||url.searchParams.get('view')!=='learning')return;window.history.pushState({},'',location.pathname+url.search);setView('aprendizado-growth');window.dispatchEvent(new PopStateEvent('popstate'));setSelected(null);};
 const startNote=async(i:LoopItem)=>{setEditing(true);const snapshot=await fetchKnowledgeSnapshot();const domain=({crm_acquisition:'crm',paid_media:'media',b2c_origin:'b2c',rentabilization:'renta'} as Record<string,string>)[i.front];setNotes(snapshot.notes.filter(n=>(n.frontmatter.analytics as {domain?:string}|undefined)?.domain===domain));};
 const pickNote=(path:string)=>{const note=notes.find(n=>n.relative_path===path);setNotePath(path);setBaseHash(note?.content_hash||'');setMarkdown(note&&selected?note.content_markdown+defaultNoteAppend(selected):'');};
 const selectedBody=selected?attentionBody(selected):null;
 const visible=items.filter(i=>!i.hidden);const count=visible.length;
 useEffect(()=>{if(!loading&&!error)onCountChange?.(count);},[count,error,loading,onCountChange]);
 return <section aria-label={placement==='planner'?'Notificações da Fila':'Blocos de acompanhamento'} className="notification-center">
 <header className="flex flex-wrap items-center justify-between gap-3">
   <div className="flex items-center gap-2.5"><span className="rounded-lg bg-cyan-50 p-2 text-cyan-800"><Bell size={18}/></span><h3 className="text-base font-semibold text-slate-900">{placement==='planner'?'Notificações':'Acompanhamento da operação'}</h3><span aria-label="Quantidade de notificações" className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-slate-700">{loading?'…':count+(goalNotice&&goalVisible?1:0)}</span></div>
   <button type="button" className={control+' inline-flex items-center gap-2'} aria-label="Atualizar notificações" onClick={()=>void load()}><RefreshCw size={13}/>Atualizar</button>
 </header>
 <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-xs text-slate-500">
   <p>Todos os períodos · avisos por contexto</p>
   <label className="flex cursor-pointer items-center gap-2 text-slate-600"><input type="checkbox" className="accent-cyan-700" checked={showHidden} onChange={e=>setShowHidden(e.target.checked)}/>Incluir adiados e fechados por mim</label>
 </div>
 {error&&<p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}<button type="button" className={control+' ml-2'} onClick={()=>void load()}>Tentar novamente</button></p>}
 {!loading&&!items.length&&!error&&!(goalNotice&&goalVisible)&&<p className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600"><CheckCircle2 size={18} className="text-cyan-700"/>Nenhuma notificação disponível no seu acesso.</p>}
 <div className="notification-grid" aria-busy={loading}>
 {goalNotice?.(setGoalVisible)}
 {loading&&items.length===0&&<p role="status" className="notification-card animate-pulse text-sm text-slate-500">Carregando notificações…</p>}
 {items.map(i=><article key={i.id} className={'notification-card '+(['needs_data','failed','blocked'].includes(i.state)?'notification-card--warning ':'')+(i.hidden?'opacity-70':'')}>
   <div className="flex items-start justify-between gap-3">
     <div className="flex min-w-0 flex-wrap items-center gap-2 text-xs text-slate-500"><span className="font-semibold text-slate-700">{FRONTS[i.front]||i.front}</span><span>{i.period.slice(0,7)}</span><span className={'notification-state '+(['needs_data','failed','blocked'].includes(i.state)?'notification-state--warning':'')}>{LABELS[i.state]||i.state}</span>{i.following&&<span className="inline-flex items-center gap-1"><Star size={11}/>Acompanhando</span>}{i.hidden&&<span>Oculto no Planner</span>}</div>
     <button type="button" disabled={busy} aria-label={'Fechar aviso: '+i.title} title="Fechar até uma mudança relevante" className="notification-dismiss" onClick={()=>prefer(i,'dismiss')}><X size={16}/></button>
   </div>
   <h4 className="notification-title">{i.title}</h4>
   <p className="notification-summary">{i.summary}</p>
   <footer className="notification-actions">
     <button type="button" onClick={()=>open(i)} className="notification-primary">Ver resumo <ChevronRight size={14}/></button>
     <button type="button" disabled={busy} className="notification-secondary" onClick={()=>prefer(i,'snooze',new Date(Date.now()+86400000).toISOString())}><Clock3 size={13}/>Mostrar amanhã</button>
     <details className="notification-options"><summary>Mais opções</summary><div className="mt-2 flex flex-wrap gap-2"><button type="button" disabled={busy} className={control} onClick={()=>prefer(i,i.following?'unfollow':'follow')}>{i.following?'Deixar de acompanhar':'Acompanhar'}</button><button type="button" className={control} onClick={()=>{setSelected(i);setSnoozeDate('');}}>Escolher outro dia</button>{i.hidden&&<button type="button" disabled={busy} className={control} onClick={()=>prefer(i,'restore')}>Restaurar aviso</button>}</div></details>
   </footer>
 </article>)}
 </div>
 <p className="text-[11px] text-slate-500">Atualização automática a cada 30 s · fontes reavaliadas a cada 5 min. Fechar ou adiar oculta o aviso apenas para você.</p>
 {selected&&createPortal(<div className="fixed inset-0 z-[90] flex justify-end bg-slate-950/30" onClick={()=>setSelected(null)}><aside data-loop-drawer role="dialog" aria-modal="true" aria-label={'Resumo: '+selected.title} className="h-full w-full max-w-2xl overflow-y-auto bg-white p-5 shadow-xl" onClick={e=>e.stopPropagation()}>
 <div className="flex items-start justify-between gap-4"><h2 className="text-lg font-semibold">{selected.title}</h2><button type="button" autoFocus className={control} aria-label="Fechar resumo" onClick={()=>setSelected(null)}><X size={16}/></button></div>
 <p className="mt-2 text-xs text-slate-500">{FRONTS[selected.front]} · {selected.period} · revisão {selected.revision}</p>
 <h3 className="mt-5 font-semibold">O que aconteceu</h3><p className="mt-2 text-sm leading-6">{selected.summary}</p>
 <h3 className="mt-5 font-semibold">O que fazer agora</h3><p className="mt-2 text-sm leading-6">{selected.next_action}</p>
 {(selected.analysis||selectedBody)&&<section className="mt-5 border-t pt-4"><h3 className="font-semibold">Análise do agente</h3><p className="mt-2 text-xs">{LABELS[selected.analysis?.state||selected.state]||'Análise'}{selected.analysis?.last_error&&' · '+selected.analysis.last_error}</p>{selectedBody&&<><p className="mt-2 text-sm">{selectedBody.summary}</p><ul className="mt-2 list-disc space-y-1 pl-5 text-sm">{selectedBody.facts.map((f,n)=><li key={n}>{f.text}</li>)}</ul><h4 className="mt-3 text-sm font-semibold">O que ainda não sabemos</h4><ul className="list-disc pl-5 text-sm">{selectedBody.limitations.map((f,n)=><li key={n}>{f}</li>)}</ul><h4 className="mt-3 text-sm font-semibold">Próximas verificações</h4><ul className="list-disc pl-5 text-sm">{selectedBody.next_checks.map((f,n)=><li key={n}>{f}</li>)}</ul></>}</section>}
 <details className="mt-5 text-xs"><summary className="cursor-pointer font-semibold">Evidências e procedência</summary><pre className="mt-2 max-h-80 overflow-auto whitespace-pre-wrap break-all bg-slate-50 p-3">{JSON.stringify(selected.evidence,null,2)}</pre></details>
 <div className="mt-5 flex flex-wrap gap-2"><button type="button" className={control} onClick={()=>go(placement==='planner'?'?view=learning&section=feed&attention='+selected.id:selected.route)}>{placement==='planner'?'Abrir item na Fila':selected.kind==='source'?'Ver todos os blocos':'Abrir contexto completo'}</button>{selected.kind==='source'&&<button type="button" disabled={busy||['pending','running','completed','blocked'].includes(selected.analysis?.state||'')} className={control} onClick={()=>void run(async()=>{await requestSourceAnalysis(selected.id);setNotice('Trabalho preparado. Peça ao agente para processar a fila.');})}>{selected.analysis?.state==='failed'?'Tentar análise novamente':'Solicitar análise do contexto'}</button>}{selected.kind!=='contribution'&&<button type="button" className={control} onClick={()=>void run(()=>startNote(selected))}>Preparar atualização da nota</button>}</div>
 <p className="mt-3 text-xs text-slate-500">Ler, acompanhar, fechar ou adiar não resolve o trabalho. A análise só começa com seu comando ao agente.</p>
 <label className="mt-4 block text-sm">Mostrar novamente em<input type="date" className={control+' ml-2'} value={snoozeDate} min={new Date(Date.now()+86400000).toISOString().slice(0,10)} onChange={e=>setSnoozeDate(e.target.value)}/></label><button type="button" disabled={!snoozeDate||busy} className={control+' mt-2'} onClick={()=>prefer(selected,'snooze',new Date(snoozeDate+'T09:00:00-03:00').toISOString())}>Adiar até esse dia</button>
 <details className="mt-5 text-xs"><summary className="cursor-pointer font-semibold">Comando para Codex ou Claude</summary><p className="mt-2 whitespace-pre-wrap">{LOOP_COMMAND}</p><button type="button" className={control+' mt-2'} onClick={()=>void navigator.clipboard.writeText(LOOP_COMMAND).then(()=>setNotice('Comando copiado.')).catch(()=>setNotice('Selecione e copie o comando acima.'))}>Copiar comando</button></details>
 {editing&&<section className="mt-5 space-y-3 border-t pt-4"><h3 className="font-semibold">Proposta de atualização da Wiki</h3><p className="text-xs">Escolha a nota e revise o texto completo. A proposta será enviada para revisão; a fonte não será sobrescrita.</p><select aria-label="Nota de resultado" className={control+' w-full'} value={notePath} onChange={e=>pickNote(e.target.value)}><option value="">Selecione a nota da mesma frente</option>{notes.map(n=><option key={n.id} value={n.relative_path}>{n.title} · {n.relative_path}</option>)}</select><textarea aria-label="Texto proposto da nota" className="min-h-72 w-full rounded border p-3 font-mono text-xs" value={markdown} onChange={e=>setMarkdown(e.target.value)}/><button type="button" disabled={busy||!notePath||!markdown} className={control} onClick={()=>void run(async()=>{const id=await proposeResultNote(selected,notePath,baseHash,markdown);setNotice('Contribuição '+id.slice(0,8)+' enviada para revisão.');setEditing(false);})}>Enviar proposta para revisão</button></section>}
 {notice&&<p role="status" className="mt-4 rounded bg-cyan-50 p-3 text-sm text-cyan-900">{notice}</p>}{error&&<p role="alert" className="mt-4 text-sm text-rose-700">{error}</p>}
 </aside></div>,document.body)}
 </section>;
}
