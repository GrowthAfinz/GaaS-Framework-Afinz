import {createPortal} from 'react-dom';
import React,{useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {GitBranch,RefreshCw,Image,FileText,LockKeyhole,SlidersHorizontal,List,Network,PanelRight,ArrowLeft,Loader2} from 'lucide-react';
import {format} from 'date-fns';
import {usePeriod} from '../../../contexts/PeriodContext';
import {useBU} from '../../../contexts/BUContext';
import {useAuth} from '../../../context/AuthContext';
import {useAppStore} from '../../../store/useAppStore';
import {FullscreenButton} from '../../ui/FullscreenButton';
import {readJourneyCatalog,readJourneyDetail,readJourneyManifest,resetJourneyCache} from '../../../services/journeyReadService';
import type {JourneyDirectoryItem,JourneyIndexItem,JourneyManifest,JourneyReuse} from '../../../modules/sfmc-package/journeyV2';
import {contextLabel,messageFacets,messageContextKeys,relatedPath,parseJourneyContext,canonicalAudience,ALL_AUDIENCES,PENDING_FRONT} from '../../../modules/sfmc-package/journeyV2';
import {versionsForJourney} from '../../../modules/sfmc-package/journeyNavigation';
import {layoutJourney} from '../../../modules/sfmc-package/journeyFlow';
import {buildCatalog,scopeMessages,facetCounts,catalogMessageMatches,latestActivityPins,dateLabel,EMPTY_CATALOG_FILTERS,type CatalogFilters,type CatalogRow,type CountOption} from '../../../modules/sfmc-package/journeyCatalog';
import type {FacetKey} from '../../../utils/contentPerformanceModel';
import {JourneyViewport,type ViewportHandle} from './JourneyViewport';
import {CommunicationInspector} from './CommunicationInspector';
import {JourneyCatalogTables} from './JourneyCatalogTables';
import {JourneyCountSelect} from './JourneyCountSelect';
import {JourneyPerformancePanel} from './JourneyPerformancePanel';
import {useJourneyWorkspaceSize} from './useJourneyWorkspaceSize';
const FACET_NAMES:Record<string,string>={canal:'Canal',subgrupo:'Subgrupo',oferta:'Oferta',promocional:'Promocional',momento:'Momento'};
const SHARED_KEYS:Record<string,string>={canal:'canais',subgrupo:'subgrupos'};
const LABEL='mb-0.5 text-[9.5px] font-semibold uppercase tracking-[0.08em] text-slate-400';
const FIELD='h-[34px] w-full rounded-lg border border-slate-200 bg-white text-xs shadow-sm';
const LOCKED='flex h-[34px] items-center rounded-lg border border-slate-200 bg-slate-100 px-2.5 text-xs text-slate-500';
export function JourneyFlowView(){
 const {user}=useAuth(),period=usePeriod(),{selectedBUs}=useBU(),global=useAppStore(s=>s.viewSettings.filtrosGlobais),setGlobalFilters=useAppStore(s=>s.setGlobalFilters);
 const start=format(period.startDate,'yyyy-MM-dd'),end=format(period.endDate,'yyyy-MM-dd');
 const [catalog,setCatalog]=useState<{identity:string;rows:JourneyDirectoryItem[]}>({identity:'',rows:[]}),[entry,setEntry]=useState<JourneyIndexItem|null>(null),[manifest,setManifest]=useState<JourneyManifest|null>(null);
 const [filters,setFilters]=useState<CatalogFilters>(EMPTY_CATALOG_FILTERS),[id,setId]=useState(''),[view,setView]=useState<'catalog'|'flow'>('catalog');
 const [directoryLoading,setDirectoryLoading]=useState(true),[loading,setLoading]=useState(false),[error,setError]=useState(''),[revision,setRevision]=useState(0);
 const catalogIdentity=JSON.stringify([start,end,user?.id,revision]);
 const index=catalog.identity===catalogIdentity?catalog.rows:[];
 const [selected,setSelected]=useState<string|null>(null),[compact,setCompact]=useState(false),[expanded,setExpanded]=useState(false),[nativeFull,setNativeFull]=useState(false),[secondaryOpen,setSecondaryOpen]=useState(true);
 const [performance,setPerformance]=useState(false),[performanceExpanded,setPerformanceExpanded]=useState(false),[performanceKey,setPerformanceKey]=useState('');
 const [exporting,setExporting]=useState(''),[exportScope,setExportScope]=useState<'all'|'path'|'fiches'>('all');
 const root=useRef<HTMLElement>(null),header=useRef<HTMLElement>(null),viewport=useRef<ViewportHandle>(null),catalogHost=useRef<HTMLDivElement>(null),catalogScroll=useRef(0),trigger=useRef<HTMLElement|null>(null),exportAbort=useRef<AbortController|null>(null),reuseRequest=useRef(0),pendingReuse=useRef<string|null>(null);
 const fullTarget=useCallback(()=>root.current,[]),isFull=expanded||nativeFull,flow=view==='flow';
 const size=useJourneyWorkspaceSize(root,header,flow,isFull);
 const scope=useMemo(()=>({bus:selectedBUs as string[],global:global as Record<string,any>}),[JSON.stringify(selectedBUs),JSON.stringify(global)]);
 const {front,audience}=parseJourneyContext(filters.context),pending=front===PENDING_FRONT,bu=front===ALL_AUDIENCES?'':front;
 const rows=useMemo(()=>buildCatalog(index,filters,scope),[index,filters,scope]);
 const baseFilters=useMemo(()=>({...EMPTY_CATALOG_FILTERS,context:pending?filters.context:bu?JSON.stringify([bu,ALL_AUDIENCES]):''}),[bu,pending]);
 const baseScope=useMemo(()=>({...scope,global:{}}),[scope.bus]);
 const baseRows=useMemo(()=>buildCatalog(index,baseFilters,baseScope),[index,baseFilters,baseScope]);
 const groups=useMemo(()=>[...new Set(baseRows.flatMap(r=>r.groups))].sort((a,b)=>a.localeCompare(b,'pt-BR')),[baseRows]);
 const pendingCount=useMemo(()=>buildCatalog(index,{...EMPTY_CATALOG_FILTERS,context:JSON.stringify([PENDING_FRONT,ALL_AUDIENCES])},scope).length,[index,scope]);
 const choice=index.find(j=>j.id===id),journeyName=choice?.journey_name||entry?.journey_name||'',selectedRow=rows.find(r=>r.name===journeyName);
 const versions=useMemo(()=>versionsForJourney(index,journeyName),[index,journeyName]);
 const counts=(key:FacetKey)=>facetCounts(index,key,filters,scope);
 const matches=useMemo(()=>new Set(entry?.messages.filter(m=>{const source=choice?.messages.find(c=>c.occurrence_key===m.occurrence_key||c.activity_key===m.activity_key)||m;return catalogMessageMatches({...source,journey_name:journeyName},journeyName,filters,scope);}).map(m=>m.activity_key)||[]),[entry,choice,journeyName,filters,scope]);
 const pins=useMemo(()=>latestActivityPins(choice,entry?.messages||[],filters,scope),[choice,entry,filters,scope]);
 const layout=useMemo(()=>{try{return manifest?{value:layoutJourney(manifest.graph,compact),error:''}:{value:null,error:''};}catch(e){return {value:null,error:(e as Error).message};}},[manifest,compact]);
 const focus=selected||performanceKey;
 const path=useMemo(()=>{const keys=new Set<string>();if(layout.value)for(const key of focus?[focus]:matches.size<(entry?.messages.length||0)?[...matches]:[])for(const related of relatedPath(layout.value,key))keys.add(related);return keys;},[layout,focus,matches,entry]);
 useEffect(()=>{reuseRequest.current++;setCatalog({identity:'',rows:[]});setEntry(null);setManifest(null);setId('');setView('catalog');setSelected(null);setPerformance(false);},[user?.id]);
 useEffect(()=>{let alive=true;setDirectoryLoading(true);setError('');readJourneyCatalog(start,end).then(data=>{if(alive)setCatalog({identity:catalogIdentity,rows:data});}).catch(e=>{if(alive)setError('Não foi possível carregar o catálogo. '+e.message);}).finally(()=>{if(alive)setDirectoryLoading(false);});return()=>{alive=false;};},[start,end,revision,user?.id]);
 useEffect(()=>{let alive=true;setEntry(null);setManifest(null);setSelected(null);setPerformanceKey('');setPerformanceExpanded(false);if(!id){setLoading(false);return;}setLoading(true);setError('');Promise.all([readJourneyDetail(id),readJourneyManifest(id)]).then(([e,m])=>{if(alive){setEntry(e);setManifest(m);if(pendingReuse.current){setSelected(pendingReuse.current);pendingReuse.current=null;}}}).catch(e=>{if(alive)setError('Não foi possível abrir a jornada. '+e.message);}).finally(()=>{if(alive)setLoading(false);});return()=>{alive=false;};},[id,revision]);
 useEffect(()=>{const changed=()=>{resetJourneyCache();setRevision(v=>v+1);};window.addEventListener('sfmc-package-changed',changed);window.addEventListener('communication-links-changed',changed);return()=>{window.removeEventListener('sfmc-package-changed',changed);window.removeEventListener('communication-links-changed',changed);};},[]);
 useEffect(()=>{const change=()=>setNativeFull(document.fullscreenElement===root.current);document.addEventListener('fullscreenchange',change);return()=>document.removeEventListener('fullscreenchange',change);},[]);
 useEffect(()=>()=>{reuseRequest.current++;exportAbort.current?.abort();},[]);
 // Shared controls reflect the same global filter state; multiple global choices stay intact.
 useEffect(()=>{const g=global as Record<string,any>;setFilters(f=>{const p=parseJourneyContext(f.context),partner=g.parceiros?.length===1?canonicalAudience(g.parceiros[0]):ALL_AUDIENCES;
 return {...f,context:p.front==='Plurix'?JSON.stringify(['Plurix','N/A']):p.front===PENDING_FRONT?f.context:JSON.stringify([p.front||ALL_AUDIENCES,partner]),segment:g.segmentos?.length===1?g.segmentos[0]:'',facets:{...f.facets,canal:g.canais?.length===1?g.canais[0]:'all',subgrupo:g.subgrupos?.length===1?g.subgrupos[0]:'all'}};});},[JSON.stringify([global.parceiros,global.segmentos,global.canais,global.subgrupos])]);
 useEffect(()=>{if(bu&&!pending&&!selectedBUs.includes(bu as any)){setFilters(f=>({...f,context:''}));setView('catalog');}if(entry&&!entry.messages.some(m=>{const f=messageFacets(m);return !f.frente.length||f.frente.some(v=>selectedBUs.includes(v as any));})){setId('');setView('catalog');setPerformance(false);}},[JSON.stringify(selectedBUs),entry]);
 const update=(patch:Partial<CatalogFilters>)=>setFilters(f=>({...f,...patch}));
 const selectBU=(value:string)=>{reuseRequest.current++;setView('catalog');setSecondaryOpen(true);update({context:value?JSON.stringify([value,value==='Plurix'?'N/A':ALL_AUDIENCES]):'',segment:''});setGlobalFilters({parceiros:[],segmentos:[]});};
 const selectAudience=(value:string)=>{update({context:JSON.stringify([bu||ALL_AUDIENCES,value||ALL_AUDIENCES]),segment:''});setGlobalFilters({parceiros:value?[value]:[],segmentos:[]});};
 const selectSegment=(value:string)=>{update({segment:value});setGlobalFilters({segmentos:value?[value]:[]});};
 const selectFacet=(key:FacetKey,value:string)=>{setFilters(f=>({...f,facets:{...f.facets,[key]:value||'all'}}));if(SHARED_KEYS[key])setGlobalFilters({[SHARED_KEYS[key]]:value?[value]:[]});};
 const clearFilters=()=>{setFilters(EMPTY_CATALOG_FILTERS);setGlobalFilters({canais:[],parceiros:[],segmentos:[],subgrupos:[],jornadas:[]});};
 const openJourney=(row:CatalogRow,versionId=row.latest.id)=>{reuseRequest.current++;catalogScroll.current=window.scrollY;setId(versionId);setView('flow');setSecondaryOpen(false);setError('');if(versionId===id&&!entry){resetJourneyCache();setRevision(v=>v+1);}requestAnimationFrame(()=>root.current?.scrollIntoView({block:'start'}));};
 const backToCatalog=()=>{setView('catalog');setSecondaryOpen(true);setPerformanceExpanded(false);setSelected(null);requestAnimationFrame(()=>window.scrollTo({top:catalogScroll.current}));};
 const close=useCallback(()=>{setSelected(null);requestAnimationFrame(()=>trigger.current?.focus());},[]);
 const inspect=(key:string)=>{trigger.current=document.activeElement as HTMLElement;setSelected(key);};
 const nodeOpen=(key:string)=>{if(performance){setPerformanceKey(key);viewport.current?.focus(key);}else inspect(key);};
 const onReuse=async(r:JourneyReuse)=>{const token=++reuseRequest.current;try{const e=await readJourneyDetail(r.snapshot_id);if(token!==reuseRequest.current)return;const m=e.messages.find(m=>m.activity_key===r.activity_key);if(!m)return;setFilters({...EMPTY_CATALOG_FILTERS,context:messageContextKeys(m)[0]});setGlobalFilters({canais:[],parceiros:[],segmentos:[],subgrupos:[],jornadas:[]});setView('flow');setSecondaryOpen(false);if(e.id===id)setSelected(r.activity_key);else{pendingReuse.current=r.activity_key;setId(e.id);}}catch(e){if(token===reuseRequest.current)setError((e as Error).message);}};
 const exportJourney=async(kind:'png'|'pdf')=>{if(!entry||!manifest||!layout.value)return;exportAbort.current=new AbortController();setExporting('Preparando recursos…');try{const module=await import('./journeyExport');await module.exportJourney({entry,manifest,layout:layout.value,compact,scope:exportScope,highlight:path,period:{start,end},context:filters.context,segment:filters.segment,kind,onProgress:setExporting,signal:exportAbort.current.signal});}catch(e){setError((e as Error).name==='AbortError'?'Exportação cancelada.':(e as Error).message);}finally{setExporting('');}};
 const journeyOptions:CountOption[]=rows.map(r=>({value:r.name,label:`${r.name} · ${dateLabel(r.lastActivity)}`,count:1}));
 const allCounts=rows.length,filterCount=Object.values(filters.facets).filter(v=>v&&v!=='all').length+(filters.status!=='all'?1:0)+(filters.onlyActive?1:0);
 const reader=selected&&entry&&manifest&&entry.messages.find(m=>m.activity_key===selected)?<CommunicationInspector entry={entry} manifest={manifest} meta={entry.messages.find(m=>m.activity_key===selected)!} node={layout.value?.nodes.find(n=>n.key===selected)} context={filters.context} segment={filters.segment} onClose={close} onSelect={inspect} onReuse={onReuse}/>:null;
 const workspace=<section ref={root} data-journey-flow className={`relative flex shrink-0 flex-col bg-slate-50 ${expanded?'fixed inset-0 z-[95]':''} ${isFull?'overflow-auto':'overflow-visible'}`} style={{height:flow?size.height:isFull?'var(--screen-h,100vh)':'auto',minHeight:flow?size.height:500}}>
 <header ref={header} className="relative z-40 shrink-0 border-b border-slate-200 bg-white px-4 pb-2.5 pt-2">
 <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1.5"><h2 className="flex items-center gap-2 text-[15px] font-bold tracking-tight text-slate-800"><GitBranch size={17} className="text-cyan-700"/>Fluxo de Jornada</h2>
 <div className="flex rounded-lg bg-slate-100 p-0.5"><button onClick={backToCatalog} aria-pressed={!flow} className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs ${!flow?'bg-white font-semibold text-cyan-800 shadow-sm':'text-slate-500'}`}><List size={13}/>Catálogo <span className="tabular-nums">{rows.length}</span></button><button disabled={!id} onClick={()=>{setView('flow');setSecondaryOpen(false);}} aria-pressed={flow} className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs disabled:opacity-40 ${flow?'bg-white font-semibold text-cyan-800 shadow-sm':'text-slate-500'}`}><Network size={13}/>Fluxo</button></div>
 <span className="hidden text-[11px] text-slate-400 lg:inline">Resultados de {format(period.startDate,'dd/MM/yyyy')} a {format(period.endDate,'dd/MM/yyyy')} · última atividade no histórico</span>
 <div className="ml-auto flex items-center gap-1"><button onClick={()=>{setView('catalog');setSecondaryOpen(true);update({context:pending?'':JSON.stringify([PENDING_FRONT,ALL_AUDIENCES])});}} className={`mr-2 text-[11px] underline decoration-slate-300 underline-offset-2 ${pending?'font-semibold text-amber-800':'text-slate-500 hover:text-slate-700'}`}>{pending?'Voltar às BUs':`Classificação pendente (${pendingCount} ${pendingCount===1?'jornada':'jornadas'})`}</button>
 <button onClick={()=>setSecondaryOpen(v=>!v)} aria-expanded={secondaryOpen} className={`flex h-7 items-center gap-1.5 rounded-md border px-2 text-[11px] transition ${secondaryOpen?'border-cyan-200 bg-cyan-50/60 text-cyan-800':'border-slate-200 text-slate-600 hover:bg-slate-50'}`}><SlidersHorizontal size={12}/>Filtros secundários {filterCount>0&&<span className="rounded bg-cyan-100 px-1.5 text-cyan-800">{filterCount}</span>}</button><button onClick={clearFilters} className="h-7 rounded-md px-2 text-[11px] text-cyan-700 hover:bg-cyan-50">Limpar</button>
 <span aria-hidden className="mx-1 h-4 w-px bg-slate-200"/><button onClick={()=>{resetJourneyCache();setRevision(v=>v+1);}} aria-label="Atualizar jornadas" className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"><RefreshCw size={15} className={directoryLoading?'animate-spin':''}/></button>{expanded?<button onClick={()=>setExpanded(false)} className="text-xs text-slate-600">Sair do modo expandido</button>:<FullscreenButton target={fullTarget} size={15} className="p-1.5" onFailure={()=>setExpanded(true)}/>}</div>
 </div>
 <div className="grid grid-cols-1 items-end gap-2 sm:grid-cols-2 xl:grid-cols-[110px_160px_minmax(150px,1fr)_minmax(150px,1fr)_minmax(240px,2fr)_140px]">
 <div><p className={LABEL}>Frente</p><div aria-label="Frente" aria-disabled="true" className={`${LOCKED} gap-2`}><LockKeyhole size={12}/>Aquisição</div></div>
 <JourneyCountSelect label="BU" value={pending?'':bu} onChange={selectBU} options={selectedBUs.map(v=>({value:v,label:v,count:counts('frente').find(o=>o.value===v)?.count||0}))} total={allCounts} allLabel="Todas as BUs" disabled={directoryLoading}/>
 {bu==='Plurix'||pending?<div><p className={LABEL}>Parceiro / público</p><div aria-label="Parceiro / público" aria-disabled="true" className={LOCKED}>{pending?'A revisar':'N/A'}</div></div>:<JourneyCountSelect label={bu==='B2C'?'Público / origem':'Parceiro / público'} value={audience===ALL_AUDIENCES?'':audience} onChange={selectAudience} options={counts('parceiro')} total={allCounts} allLabel={global.parceiros?.length>1?'Públicos selecionados':bu==='B2C'?'Todos os públicos':'Todos os parceiros'} disabled={directoryLoading}/>}
 <JourneyCountSelect label="Segmento" value={filters.segment} onChange={selectSegment} options={counts('segmento')} total={allCounts} allLabel={global.segmentos?.length>1?'Segmentos selecionados':'Todos os segmentos'} disabled={directoryLoading}/>
 <JourneyCountSelect label="Jornada" value={journeyName} onChange={name=>{if(!name){backToCatalog();setId('');return;}const r=rows.find(r=>r.name===name);if(r)openJourney(r);}} options={journeyOptions} total={allCounts} allLabel="Buscar no catálogo" disabled={directoryLoading} wide/>
 <label className="min-w-0"><p className={LABEL}>Versão do pack</p><select aria-label="Versão do pack" value={id} disabled={!journeyName} onChange={e=>{setId(e.target.value);setView('flow');}} className={`${FIELD} px-2 text-slate-700 disabled:bg-slate-100`}><option value="" disabled>Automática</option>{versions.map(j=><option key={j.id} value={j.id}>v{j.journey_version} · {new Date(j.created_at).toLocaleDateString('pt-BR')}</option>)}</select></label>
 </div>
 {secondaryOpen&&<div className="mt-2 grid grid-cols-2 items-end gap-2 border-t border-dashed border-slate-200 pt-2 md:grid-cols-4 xl:grid-cols-7">
 <label className="col-span-2 min-w-0 md:col-span-1"><p className={LABEL}>Busca</p><input aria-label="Buscar jornada ou comunicação" value={filters.search} onChange={e=>update({search:e.target.value})} placeholder="Jornada, Activity Name ou ID" className={`${FIELD} px-2.5 outline-cyan-600`}/></label>
 {(['canal','subgrupo','oferta','promocional','momento'] as FacetKey[]).map(k=><JourneyCountSelect key={k} label={FACET_NAMES[k]} value={filters.facets[k]==='all'?'':filters.facets[k]||''} onChange={v=>selectFacet(k,v)} options={counts(k)} total={allCounts} allLabel={global[SHARED_KEYS[k] as keyof typeof global]?.length>1?'Vários selecionados':'Todos'} disabled={directoryLoading}/>)}
 <label><p className={LABEL}>Vínculo no período</p><select aria-label="Situação do vínculo" value={filters.status} onChange={e=>update({status:e.target.value})} className={`${FIELD} px-2`}><option value="all">Todos</option><option value="no_id">Sem ID no link</option><option value="linked">Com execução vinculada</option><option value="unlinked">Execução sem template</option></select></label>
 </div>}
 {(secondaryOpen||filters.context)&&<div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10.5px]">
 {secondaryOpen&&<label className="flex items-center gap-1.5 text-slate-600"><input type="checkbox" className="h-3 w-3 accent-cyan-700" checked={filters.onlyActive} onChange={e=>update({onlyActive:e.target.checked})}/>Somente jornadas com atividade no período selecionado</label>}
 {filters.context&&<p className="ml-auto min-w-0 break-words text-slate-400" aria-label="Caminho da jornada">Aquisição → {contextLabel(filters.context)}{filters.segment&&` → ${filters.segment}`}{journeyName&&` → ${journeyName}`}</p>}
 </div>}
 </header>
 {error&&<p role="alert" className="shrink-0 bg-rose-50 px-4 py-2 text-xs text-rose-700">{error}<button onClick={()=>{resetJourneyCache();setRevision(v=>v+1);}} className="ml-3 underline">Tentar novamente</button></p>}
 <div ref={catalogHost} className={flow?'hidden':'block'}>{directoryLoading&&!index.length?<p role="status" className="p-10 text-center text-sm text-slate-500">Carregando catálogo…</p>:<JourneyCatalogTables groups={groups} rows={rows} total={baseRows.length} onOpen={r=>openJourney(r)}/>}</div>
 {id&&<div className={`${flow?'flex':'hidden'} min-h-0 flex-1 flex-col`}>
 <div className="flex shrink-0 flex-wrap items-center gap-2 border-b bg-teal-950 px-4 py-2 text-[11px] text-white"><button onClick={backToCatalog} className="mr-2 flex items-center gap-1"><ArrowLeft size={13}/>Catálogo</button><span>{manifest?`${manifest.graph.nodes.length} atividades · ${entry?.messages.length||0} comunicações · ${matches.size} no filtro`:'Abrindo jornada…'}</span>{choice&&<span>Pack v{choice.journey_version}</span>}<span className="ml-auto">{selectedRow?`Última atividade: ${dateLabel(selectedRow.lastActivity)}`:'Jornada fora do recorte atual'}</span><label className="flex items-center gap-1"><input type="checkbox" checked={compact} onChange={e=>setCompact(e.target.checked)}/>Só fluxo</label>
 <select aria-label="Escopo da exportação" value={exportScope} onChange={e=>setExportScope(e.target.value as typeof exportScope)} className="rounded border border-white/20 bg-teal-900 px-2 py-1"><option value="all">Fluxo completo</option><option value="path">Destaque</option><option value="fiches">Fluxo + fichas</option></select><button onClick={()=>void exportJourney('png')} disabled={!!exporting||!layout.value} className="flex items-center gap-1 rounded border border-white/20 px-2 py-1 disabled:opacity-40"><Image size={12}/>PNG</button><button onClick={()=>void exportJourney('pdf')} disabled={!!exporting||!layout.value} className="flex items-center gap-1 rounded border border-white/20 px-2 py-1 disabled:opacity-40"><FileText size={12}/>PDF</button>
 </div>
 {exporting&&<p role="status" className="shrink-0 px-4 py-2 text-xs text-cyan-800">{exporting}<button onClick={()=>exportAbort.current?.abort()} className="ml-3 underline">Cancelar</button></p>}
 <div className="relative flex flex-1 shrink-0 overflow-hidden bg-white" style={{minHeight:size.canvasMin}} data-journey-workspace-canvas>
 {loading?<p role="status" className="m-auto flex items-center gap-2 text-sm text-slate-500"><Loader2 size={17} className="animate-spin"/>Carregando a jornada selecionada…</p>:manifest&&entry&&layout.value?<JourneyViewport ref={viewport} manifest={manifest} layout={layout.value} messages={entry.messages} compact={compact} focus={path} matches={matches.size<entry.messages.length?matches:null} latestPins={pins} onOpen={nodeOpen}/>:<p className="m-auto p-8 text-sm text-slate-500">{layout.error||'A jornada não pôde ser exibida. Use Tentar novamente.'}</p>}
 {entry&&manifest&&<><button onClick={()=>{setPerformance(v=>!v);setPerformanceExpanded(false);}} aria-expanded={performance} className="absolute bottom-3 right-3 z-40 flex items-center gap-2 rounded-xl border border-cyan-200 bg-white px-4 py-2.5 text-xs font-semibold text-cyan-800 shadow-lg"><PanelRight size={15}/>{performance?'Ocultar performance':'Performance'}</button><JourneyPerformancePanel portalTarget={root.current} entry={entry} start={start} end={end} filters={filters} scope={scope} visible={performance} expanded={performanceExpanded} onExpanded={setPerformanceExpanded} onClose={()=>{setPerformance(false);setPerformanceExpanded(false);}} activityKey={performanceKey} onActivityKey={setPerformanceKey} onLocate={key=>viewport.current?.focus(key)} onInspect={inspect}/></>}
 {reader}
 </div>
 <footer className="shrink-0 border-t bg-white px-4 py-2 text-[10px] text-slate-400">Fluxo completo; público selecionado em destaque. O pin indica o último disparo registrado, não a posição dos contatos nem a versão enviada.{performance?' Clique num nó para filtrar a performance.':''}</footer>
 </div>}
 </section>;
 return expanded?createPortal(workspace,document.body):workspace;
}
