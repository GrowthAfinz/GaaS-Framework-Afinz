import { useState } from 'react';
import { ArrowUpRight, Search } from 'lucide-react';
import type { VaultNoteSummary } from '../vaultTypes';
import { formatWikiUpdatedOn, matchesWikiQuery, sortWikiNotesByRecent, wikiNoteUpdatedOn } from '../wikiSearch';
import { isStrategyPilot, STRATEGY_PATH } from './strategyModel';
import './wikiStrategy.css';

const FEATURED=[STRATEGY_PATH,'05-Estrategia/Estrategia-de-Segmentacao-de-Seguros.md'];

/** Featured strategies stay on top; the rest goes from the newest update to the oldest. */
export function orderStrategies(notes:VaultNoteSummary[],query:string):VaultNoteSummary[]{
 const matches=notes.filter(isStrategyPilot).filter(n=>matchesWikiQuery(n,query));
 const featured=FEATURED.map(path=>matches.find(n=>n.relative_path===path)).filter((n):n is VaultNoteSummary=>Boolean(n));
 return [...featured,...sortWikiNotesByRecent(matches.filter(n=>!FEATURED.includes(n.relative_path)))];
}

export function WikiStrategiesIndex({notes,onOpen}:{notes:VaultNoteSummary[];onOpen:(id:string)=>void}) {
 const [query,setQuery]=useState('');
 const strategies=orderStrategies(notes,query);
 return <main className="strategy-index-page"><p className="strategy-eyebrow">WIKI / ASSUNTOS</p><h1>Estratégias</h1><p>Desenhos de estratégia, públicos, regras e decisões. Abra uma nota para navegar pelos tópicos e trabalhar na versão com histórico.</p>
 <label className="strategy-search"><Search size={16}/><input aria-label="Filtrar estratégias" placeholder="Buscar uma estratégia" value={query} onChange={e=>setQuery(e.target.value)}/></label>
 <div className="strategy-index-grid">{strategies.map(note=><button type="button" key={note.id} onClick={()=>onOpen(note.id)}><span>{note.title}<ArrowUpRight size={17}/></span><small>{note.status||'Fonte do vault'} · tópicos e edição com histórico</small><small className="strategy-index-date">{formatWikiUpdatedOn(wikiNoteUpdatedOn(note))}</small></button>)}</div>
 {!strategies.length&&<p>Nenhuma estratégia corresponde à busca.</p>}</main>;
}
