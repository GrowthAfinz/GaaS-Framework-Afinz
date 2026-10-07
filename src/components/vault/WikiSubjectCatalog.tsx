import { VaultNoteSummary } from './vaultTypes';
import { catalogLabel,catalogSelection,subjectGroup,subjectRoute,subjectSegment,tagValue,type CatalogRoute } from './wikiCatalogNavigation';
const normalize=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
export function WikiSubjectCatalog({notes,filters,route,onRouteChange,onOpen}:{notes:VaultNoteSummary[];filters:Record<string,unknown>;route:CatalogRoute;onRouteChange:(route:CatalogRoute,replace?:boolean)=>void;onOpen:(id:string,route:CatalogRoute)=>void}){
 const selection=catalogSelection(notes,filters,route);const active=selection.route;
 const matches=(note:VaultNoteSummary)=>normalize(note.title+' '+note.tags.join(' ')).includes(normalize(active.query));
 const candidates=selection.candidates.filter(matches),frontRows=selection.frontRows.filter(matches);
 const groupRows=frontRows.filter(note=>!active.group||subjectGroup(note).key===active.group);
 const rows=selection.selected.filter(matches);
 const fronts=[...new Set(candidates.map(note=>tagValue(note,'dominio')).filter(Boolean))].sort();
 const groups=[...new Map(frontRows.map(note=>{const group=subjectGroup(note);return [group.key,group] as const;})).values()].sort((a,b)=>a.label.localeCompare(b.label,'pt-BR'));
 const segments=[...new Set(groupRows.map(subjectSegment))].sort((a,b)=>catalogLabel(a).localeCompare(catalogLabel(b),'pt-BR'));
 const level=!active.front?'front':!active.group?'group':!active.segment?'segment':'notes';
 const select='max-w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm';
 const card='rounded-md border border-slate-200 bg-slate-50/40 p-5 text-left transition-colors hover:border-cyan-400 hover:bg-cyan-50 focus-visible:outline-cyan-600';
 const go=(patch:Partial<CatalogRoute>)=>onRouteChange({...active,...patch});
 return <section aria-label="Assuntos de resultados" className="my-6 rounded-lg border border-slate-200 bg-white p-5">
 <h4 className="text-base font-semibold text-slate-900">{{front:'Resultados por frente',group:'Parceiros e públicos da frente',segment:'Segmentos deste parceiro ou público',notes:'Assuntos deste segmento'}[level]}</h4>
 <p className="mt-2 text-sm leading-6 text-slate-600">Escolha a frente, o parceiro ou público e depois o segmento. Cada assunto conecta contexto, evolução mensal e retrospectivas.</p>
 <div className="mt-4 flex flex-wrap gap-2"><input aria-label="Buscar assunto de resultados" className={select+' min-w-0 flex-1'} placeholder="Buscar parceiro, segmento ou assunto…" value={active.query} onChange={e=>onRouteChange({...active,query:e.target.value},true)}/>
 {!filters.dominio&&<select aria-label="Frente do assunto" className={select} value={active.front} onChange={e=>go({front:e.target.value,group:'',segment:''})}><option value="">Todas as frentes</option>{[...new Set(selection.candidates.map(n=>tagValue(n,'dominio')).filter(Boolean))].sort().map(value=><option key={value}>{value}</option>)}</select>}
 {active.front&&!filters.parceiro&&<select aria-label="Parceiro ou público do assunto" className={select} value={active.group} onChange={e=>go({group:e.target.value,segment:''})}><option value="">Escolher parceiro ou público</option>{groups.map(group=><option key={group.key} value={group.key}>{group.label}</option>)}</select>}
 {active.front&&active.group&&!filters.segmento&&<select aria-label="Segmento do assunto" className={select} value={active.segment} onChange={e=>go({segment:e.target.value})}><option value="">Escolher segmento</option>{segments.map(value=><option key={value} value={value}>{catalogLabel(value)}</option>)}</select>}
 </div>
 <p className="my-3 text-xs text-slate-500" aria-live="polite">{rows.length} assuntos neste recorte</p>
 <div className="mb-4 flex flex-wrap gap-4 text-sm font-medium text-cyan-700">{active.front&&!filters.dominio&&<button onClick={()=>go({front:'',group:'',segment:''})}>← Todas as frentes</button>}{active.group&&!filters.parceiro&&<button onClick={()=>go({group:'',segment:''})}>← Todos os parceiros e públicos</button>}{active.segment&&!filters.segmento&&<button onClick={()=>go({segment:''})}>← Todos os segmentos</button>}</div>
 <div className="grid gap-3 sm:grid-cols-2">
 {level==='front'&&fronts.map(front=><button key={front} type="button" className={card} onClick={()=>go({front,group:'',segment:''})}><span className="block text-base font-semibold text-slate-900">{front}</span><span className="mt-2 block text-sm text-slate-600">{candidates.filter(n=>tagValue(n,'dominio')===front).length} assuntos</span><span className="mt-5 block text-sm font-medium text-cyan-700">Explorar frente →</span></button>)}
 {level==='group'&&groups.map(group=><button key={group.key} type="button" className={card} onClick={()=>go({group:group.key,segment:''})}><span className="block text-base font-semibold text-slate-900">{group.label}</span><span className="mt-1 block text-xs text-slate-500">{group.kind}</span><span className="mt-2 block text-sm text-slate-600">{frontRows.filter(n=>subjectGroup(n).key===group.key).length} assuntos · {[...new Set(frontRows.filter(n=>subjectGroup(n).key===group.key).map(subjectSegment))].length} grupos de assuntos</span><span className="mt-5 block text-sm font-medium text-cyan-700">Explorar segmentos →</span></button>)}
 {level==='segment'&&segments.map(segment=><button key={segment} type="button" className={card} onClick={()=>go({segment})}><span className="block text-base font-semibold text-slate-900">{catalogLabel(segment)}</span><span className="mt-2 block text-sm text-slate-600">{groupRows.filter(n=>subjectSegment(n)===segment).length} assuntos</span><span className="mt-5 block text-sm font-medium text-cyan-700">Abrir assuntos →</span></button>)}
 {level==='notes'&&rows.map(note=><button key={note.id} type="button" onClick={()=>onOpen(note.id,{...subjectRoute(note),query:active.query})} className={card}><span className="block text-sm font-semibold text-slate-800">{note.title}</span><span className="mt-2 block text-xs text-slate-500">{note.status||'Estado na nota'} · Abrir assunto</span></button>)}
 </div>
 {!rows.length&&<p className="text-sm text-slate-600">Nenhum assunto corresponde a este recorte. Ajuste a busca ou volte um nível.</p>}
 </section>;
}
