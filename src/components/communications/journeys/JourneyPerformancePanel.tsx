import {ExecutionResults} from './ExecutionResults';
import {createPortal} from 'react-dom';
import React,{useEffect,useMemo,useRef,useState} from 'react';
import {X,Maximize2,ArrowLeft,LocateFixed,Loader2,RefreshCw} from 'lucide-react';
import type {JourneyIndexItem} from '../../../modules/sfmc-package/journeyV2';
import type {CatalogFilters,CatalogScope} from '../../../modules/sfmc-package/journeyCatalog';
import {catalogMessageMatches,recordInCatalogScope} from '../../../modules/sfmc-package/journeyCatalog';
import {resetJourneyCache,readJourneyPerformancePage,type JourneyPerformancePage} from '../../../services/journeyReadService';
import {projectExecutions} from '../../../utils/executionProjection';
import {saoPauloDay} from '../../../utils/saoPauloPeriod';
import {sumCovered} from '../../../utils/contentPerformanceModel';
const cell=(row:any,key:string)=>{if(key==='CAC observado'){const cost=sumCovered([row],'Custo Total Campanha').value,cards=sumCovered([row],'Cartões Gerados').value;return cost!==null&&cards!==null&&cards>0?(cost/cards).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2}):'—';}const v=sumCovered([row],key).value;return v===null?'—':v.toLocaleString('pt-BR',{maximumFractionDigits:2});};
export function JourneyPerformancePanel({entry,start,end,filters,scope,visible,expanded,onExpanded,onClose,activityKey,onActivityKey,onLocate,onInspect,portalTarget}:{entry:JourneyIndexItem;start:string;end:string;filters:CatalogFilters;scope:CatalogScope;visible:boolean;expanded:boolean;onExpanded:(v:boolean)=>void;onClose:()=>void;activityKey:string;onActivityKey:(key:string)=>void;onLocate:(key:string)=>void;onInspect:(key:string)=>void;portalTarget?:HTMLElement|null}){
 const [pages,setPages]=useState<JourneyPerformancePage[]>([]),[loading,setLoading]=useState(false),[error,setError]=useState(''),[revision,setRevision]=useState(0);const request=useRef(0),busy=useRef(false);
 const identity=JSON.stringify([entry.id,start,end,revision]);const loadedIdentity=useRef('');
 useEffect(()=>{request.current++;setPages([]);setError('');busy.current=false;loadedIdentity.current='';},[identity]);
 const load=async(cursor:Record<string,string>|null,append:boolean)=>{if(busy.current)return;busy.current=true;const token=++request.current;setLoading(true);setError('');try{
  const collected:JourneyPerformancePage[]=[];let next=cursor;const seen=new Set<string>();
  do{const page=await readJourneyPerformancePage(entry.id,start,end,next);if(!page.complete)throw Error('Um grupo de execuções excedeu o limite de consulta. Reduza o período.');if(token!==request.current)return;collected.push(page);if(!page.has_more)break;if(!page.cursor||seen.has(JSON.stringify(page.cursor)))throw Error('Paginação sem avanço; resultados não totalizados.');seen.add(JSON.stringify(page.cursor));next=page.cursor;}while(true);
  if(token===request.current){setPages(p=>append?[...p,...collected]:collected);loadedIdentity.current=identity;}
 }catch(e){if(token===request.current){setPages([]);setError((e as Error).message);loadedIdentity.current=identity;};}finally{if(token===request.current){setLoading(false);busy.current=false;}}};
 useEffect(()=>{if(visible&&loadedIdentity.current!==identity)void load(null,false);},[visible,identity]);
 useEffect(()=>()=>{request.current++;},[]);
 const activePages=loadedIdentity.current===identity?pages:[];
 const state=useMemo(()=>{
  const raw=[...new Map(activePages.flatMap(p=>p.rows).map(r=>[r.id,r])).values()],reviews=activePages.flatMap(p=>p.reviews),mapping=new Map(activePages.flatMap(p=>p.matches).map(m=>[m.id,m.activity_keys]));
  const rows=projectExecutions(raw,reviews).filter(r=>{const keys=mapping.get(r.id)||[];if(activityKey&&!keys.includes(activityKey))return false;
   return keys.some(key=>{const m=entry.messages.find(m=>m.activity_key===key);return m&&!m.is_optout&&catalogMessageMatches(m,entry.journey_name,{...filters,status:filters.status==='no_id'?'no_id':'all',onlyActive:false},scope)&&recordInCatalogScope(r,m,filters,scope)&&(filters.status!=='linked'||!!r.template_id)&&(filters.status!=='unlinked'||!r.template_id);});});
  return {rows,mapping};
 },[pages,identity,entry,activityKey,JSON.stringify(filters),JSON.stringify(scope)]);
 if(!visible)return null;
 const last=activePages[activePages.length-1],target=entry.messages.find(m=>m.activity_key===activityKey);
 const columns=expanded?['Base Total','Abertura','Cliques','Propostas','Aprovados','Cartões Gerados','Custo Total Campanha','CAC observado']:['Base Total','Cliques','Cartões Gerados'];
 const labels:Record<string,string>={'Base Total':'Base','Abertura':'Aberturas','Cliques':'Cliques','Propostas':'Propostas','Aprovados':'Aprovados','Cartões Gerados':'Cartões','Custo Total Campanha':'Custo registrado','CAC observado':'CAC observado'};
 const panel=<aside role="region" aria-label="Performance da jornada" data-performance-panel className={`absolute flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl ${expanded?'inset-0 z-[65]' :'z-30 bottom-14 right-3 top-3 w-[min(500px,calc(100%-24px))]'}`} onKeyDown={e=>{if(e.key==='Escape'){e.stopPropagation();expanded?onExpanded(false):onClose();}}}>
 <header className="shrink-0 border-b p-4"><div className="flex items-center gap-2"><h3 className="min-w-0 flex-1 text-sm font-bold text-slate-800">Performance da jornada</h3><button onClick={()=>{resetJourneyCache();setRevision(v=>v+1);}} aria-label="Atualizar performance" className="rounded p-1.5 hover:bg-slate-100"><RefreshCw size={15}/></button><button onClick={()=>onExpanded(!expanded)} aria-label={expanded?'Voltar para jornada':'Expandir performance'} className="rounded p-1.5 hover:bg-slate-100">{expanded?<ArrowLeft size={17}/>:<Maximize2 size={17}/>}</button><button onClick={onClose} aria-label="Ocultar performance" className="rounded p-1.5 hover:bg-slate-100"><X size={17}/></button></div>
 <p className="mt-2 break-all text-[11px] text-slate-500">{entry.journey_name} · pack v{entry.journey_version}</p><p className="mt-1 text-[11px] text-slate-500">{start.split('-').reverse().join('/')} – {end.split('-').reverse().join('/')} · {state.rows.length} {state.rows.length===1?'registro exibido':'registros exibidos'} no período completo</p>
 {expanded&&<button aria-label="Voltar à jornada" onClick={()=>onExpanded(false)} className="mt-2 text-xs font-semibold text-cyan-700">← Voltar à jornada</button>}
 {target&&<div className="mt-2 rounded-lg bg-cyan-50 p-2 text-xs"><p className="break-all text-cyan-900">{target.activity_name}</p><button onClick={()=>onActivityKey('')} className="mt-1 text-cyan-700 underline">Mostrar toda a jornada</button><button onClick={()=>onInspect(target.activity_key)} className="ml-3 text-cyan-700 underline">Abrir comunicação</button></div>}
 </header>
 <div className="min-h-0 flex-1 overflow-auto">{!loading&&!error&&<div className="p-4"><ExecutionResults rows={state.rows} showRecords={false}/></div>}<table className="w-full text-xs"><thead className="sticky top-0 z-10 bg-slate-50"><tr><th className="min-w-[175px] p-3 text-left font-medium text-slate-500">Data / Activity Name</th>{expanded&&<th className="p-3 text-left font-medium text-slate-500">Canal</th>}{columns.map(k=><th key={k} className="whitespace-nowrap p-3 text-right font-medium text-slate-500">{labels[k]}</th>)}</tr></thead><tbody>{state.rows.map(r=>{const keys=state.mapping.get(r.id)||[],unique=keys.length===1;return <tr key={r.id} className="border-t border-slate-100 hover:bg-cyan-50/40"><td className="max-w-72 p-3"><p className="tabular-nums text-slate-700">{r['Data de Disparo']?saoPauloDay(r['Data de Disparo']).split('-').reverse().join('/'):'Sem data'}{!expanded&&<span className="ml-2 text-[10px] text-slate-400">{r.Canal}</span>}</p><p className="mt-1 break-all text-[10px] text-slate-500">{r['Activity name / Taxonomia']}</p><button disabled={!unique} onClick={()=>{onLocate(keys[0]);onActivityKey(keys[0]);}} className="mt-1 inline-flex items-center gap-1 text-[10px] text-cyan-700 disabled:text-slate-400"><LocateFixed size={11}/>{unique?'Localizar no fluxo':keys.length?'Correspondência ambígua':'Sem correspondência no pack'}</button></td>{expanded&&<td className="p-3 text-slate-500">{r.Canal}</td>}{columns.map(k=><td key={k} className="whitespace-nowrap p-3 text-right tabular-nums text-slate-700">{cell(r,k)}</td>)}</tr>;})}</tbody></table>
 {!loading&&!error&&!state.rows.length&&<p className="p-8 text-center text-xs text-slate-500">Sem execuções correspondentes neste recorte no período completo.{last?.has_more?' Consulte as próximas páginas.':''}</p>}
 {error&&<p role="alert" className="p-4 text-xs text-rose-700">{error}<button onClick={()=>void load(last?.cursor||null,!!pages.length)} className="ml-2 underline">Tentar novamente</button></p>}
 </div>
 <footer className="shrink-0 border-t bg-slate-50 p-3 text-[10px] text-slate-500"><p>Dados ausentes aparecem como —. Custo e CAC usam valores registrados. Correspondência por atividade/canal não comprova a versão enviada.</p>{loading?<p role="status" className="mt-2 flex items-center gap-2 text-xs"><Loader2 size={14} className="animate-spin"/>Consultando resultados…</p>:last?.has_more&&<button onClick={()=>void load(last.cursor,true)} className="mt-2 rounded-lg border bg-white px-3 py-2 text-xs font-semibold text-cyan-800">Carregar próximos disparos</button>}</footer>
 </aside>;
 return expanded&&portalTarget?createPortal(panel,portalTarget):panel;
}
