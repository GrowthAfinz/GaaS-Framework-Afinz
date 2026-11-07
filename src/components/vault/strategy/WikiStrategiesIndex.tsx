import { useState } from 'react';
import { ArrowUpRight, Search } from 'lucide-react';
import type { VaultNoteSummary } from '../vaultTypes';
import { isStrategyPilot, STRATEGY_PATH } from './strategyModel';
import './wikiStrategy.css';

export function WikiStrategiesIndex({notes,onOpen}:{notes:VaultNoteSummary[];onOpen:(id:string)=>void}) {
 const [query,setQuery]=useState('');
 const featured=[STRATEGY_PATH,'05-Estrategia/Estrategia-de-Segmentacao-de-Seguros.md'];
 const strategies=notes.filter(isStrategyPilot).filter(n=>(n.title+' '+n.relative_path).toLocaleLowerCase().includes(query.toLocaleLowerCase())).sort((a,b)=>{
  const rank=(path:string)=>featured.includes(path)?featured.indexOf(path):2;
  return rank(a.relative_path)-rank(b.relative_path)||a.title.localeCompare(b.title,'pt-BR');
 });
 return <main className="strategy-index-page"><p className="strategy-eyebrow">WIKI / ASSUNTOS</p><h1>Estratégias</h1><p>Desenhos de estratégia, públicos, regras e decisões. Abra uma nota para navegar pelos tópicos e trabalhar na versão com histórico.</p>
 <label className="strategy-search"><Search size={16}/><input aria-label="Filtrar estratégias" placeholder="Buscar uma estratégia" value={query} onChange={e=>setQuery(e.target.value)}/></label>
 <div className="strategy-index-grid">{strategies.map(note=><button type="button" key={note.id} onClick={()=>onOpen(note.id)}><span>{note.title}<ArrowUpRight size={17}/></span><small>{note.status||'Fonte do vault'} · tópicos e edição com histórico</small></button>)}</div>
 {!strategies.length&&<p>Nenhuma estratégia corresponde à busca.</p>}</main>;
}
