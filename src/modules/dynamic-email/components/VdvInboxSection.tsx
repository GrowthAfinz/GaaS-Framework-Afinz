import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Mail } from 'lucide-react';

/** Entradas de navegação dos dois toques; não são briefings de aquisição. */
export function VdvInboxSection({ onOpen, query = '' }: { onOpen: (touch: 'V1' | 'V2') => void; query?: string }) {
  const [expanded, setExpanded] = useState(true);
  const matches = 'rentabilizacao rentabilização pool vai de visa vdv e-mail 1 persona v1 e-mail 2 cartão cartao v2'
    .includes(query.trim().toLocaleLowerCase('pt-BR'));
  if (!matches) return null;
  return <section aria-label="E-mails Vai de Visa" className="mb-3 rounded-xl border border-cyan-200 bg-cyan-50/40 p-2">
    <button type="button" aria-expanded={expanded} onClick={() => setExpanded(!expanded)} className="flex min-h-9 w-full items-center gap-1.5 rounded-lg px-1 text-left text-xs font-bold text-slate-700 focus-visible:ring-2 focus-visible:ring-cyan-500">
      {expanded ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
      <span className="flex-1">RENTABILIZAÇÃO</span><span className="rounded-full bg-white px-2 py-0.5 text-[10px] text-slate-500">2 toques</span>
    </button>
    {expanded && <div className="ml-3 border-l border-cyan-200 pl-2">
      <p className="px-2 py-2 text-xs font-bold text-cyan-900">Pool Vai de Visa</p>
      {(['V1', 'V2'] as const).map((touch) => <button key={touch} type="button" onClick={() => onOpen(touch)} className="flex min-h-10 w-full items-center gap-2 rounded-lg px-2 text-left text-xs font-semibold text-slate-700 hover:bg-cyan-100 focus-visible:ring-2 focus-visible:ring-cyan-500"><Mail size={14}/>{touch === 'V1' ? 'E-mail 1 · persona (V1)' : 'E-mail 2 · cartão (V2)'}</button>)}
    </div>}
  </section>;
}
