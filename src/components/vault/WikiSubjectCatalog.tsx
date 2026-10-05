import { useMemo, useState } from 'react';
import { VaultNoteSummary } from './vaultTypes';

const tagValue=(note:VaultNoteSummary,key:string)=>note.tags.find(tag=>tag.startsWith(key+':'))?.slice(key.length+1)||'';
const normalize=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
export function WikiSubjectCatalog({notes,filters,onOpen}:{notes:VaultNoteSummary[];filters:Record<string,unknown>;onOpen:(id:string)=>void}) {
  const [query,setQuery]=useState('');
  const [domain,setDomain]=useState(''); const [partner,setPartner]=useState(''); const [segment,setSegment]=useState('');
  const candidates=useMemo(()=>notes.filter(note=>note.tags.includes('growth-assunto') && ['dominio','parceiro','segmento'].every(key=>!filters[key]||note.tags.includes(key+':'+filters[key]))),[notes,filters]);
  const rows=candidates.filter(note=>normalize(note.title+' '+note.tags.join(' ')).includes(normalize(query)) && (!domain||note.tags.includes('dominio:'+domain)) && (!partner||note.tags.includes('parceiro:'+partner)) && (!segment||note.tags.includes('segmento:'+segment)));
  const fronts=[...new Set(rows.map(note=>tagValue(note,'dominio')).filter(Boolean))].sort();
  const showMacro=!domain && !filters.dominio;
  const select='max-w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm';
  return <section aria-label="Assuntos de resultados" className="my-6 rounded-lg border border-slate-200 bg-white p-5">
    <h4 className="text-base font-semibold text-slate-900">{showMacro?'Resultados por frente':'Assuntos da frente'}</h4>
    <p className="mt-2 text-sm leading-6 text-slate-600">Escolha uma frente para explorar suas operações, campanhas e populações. As notas conectam contexto, evolução mensal e retrospectivas.</p>
    <div className="mt-4 flex flex-wrap gap-2"><input aria-label="Buscar assunto de resultados" className={select+' min-w-0 flex-1'} placeholder="Carrinho, parceiro, seguro, Copa…" value={query} onChange={e=>setQuery(e.target.value)}/>
      {([{key:'dominio',label:'Frente do assunto',value:domain,set:setDomain},{key:'parceiro',label:'Parceiro do assunto',value:partner,set:setPartner},{key:'segmento',label:'Segmento do assunto',value:segment,set:setSegment}]).filter(field=>!filters[field.key]).map(field=><select key={field.key} aria-label={field.label} className={select} value={field.value} onChange={e=>field.set(e.target.value)}><option value="">{field.label}</option>{[...new Set(candidates.flatMap(note=>note.tags.filter(tag=>tag.startsWith(field.key+':')).map(tag=>tag.slice(field.key.length+1))))].filter(Boolean).sort().map(value=><option key={value}>{value}</option>)}</select>)}
    </div>
    <p className="my-3 text-xs text-slate-500" aria-live="polite">{rows.length} assuntos neste recorte</p>
    {!showMacro && !filters.dominio && <button type="button" onClick={()=>setDomain('')} className="mb-4 text-sm font-medium text-cyan-700 hover:underline">← Todas as frentes</button>}
    <div className="grid gap-3 sm:grid-cols-2">{showMacro?fronts.map(front=><button key={front} type="button" onClick={()=>setDomain(front)} className="group rounded-md border border-slate-200 bg-slate-50/40 p-5 text-left transition-colors hover:border-cyan-400 hover:bg-cyan-50 focus-visible:outline-cyan-600"><span className="block text-base font-semibold text-slate-900">{front}</span><span className="mt-2 block text-sm text-slate-600">{rows.filter(note=>note.tags.includes('dominio:'+front)).length} assuntos</span><span className="mt-5 block text-sm font-medium text-cyan-700">Explorar frente →</span></button>):rows.map(note=><button key={note.id} type="button" onClick={()=>onOpen(note.id)} className="rounded-md border border-slate-200 bg-white p-4 text-left hover:border-cyan-400 hover:bg-cyan-50"><span className="block text-sm font-semibold text-slate-800">{note.title}</span><span className="mt-2 block text-xs text-slate-500">{tagValue(note,'dominio')} · {note.status||'Estado na nota'} · Abrir assunto</span></button>)}</div>
    {!rows.length && <p className="text-sm text-slate-600">Nenhum assunto corresponde aos filtros. Ajuste a busca ou escolha outro recorte.</p>}
  </section>;
}
