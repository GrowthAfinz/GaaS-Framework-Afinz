import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { CoveredValue, FacetKey } from '../../../utils/contentPerformanceModel';
import { FACET_LABEL } from '../../../utils/contentPerformanceModel';
import { buColor } from './perfModel';

export const PAGE_SIZE = 24;

export function paginate<T>(items: T[], page: number, size = PAGE_SIZE): { rows: T[]; page: number; pages: number } {
  const pages = Math.max(1, Math.ceil(items.length / size));
  const p = Math.min(Math.max(page, 1), pages);
  return { rows: items.slice((p - 1) * size, p * size), page: p, pages };
}

export const Pager: React.FC<{ page: number; pages: number; total: number; unit: string; onPage: (p: number) => void }> = ({ page, pages, total, unit, onPage }) => {
  if (pages <= 1) return <p className="px-1 text-xs text-slate-500">{total} {unit}</p>;
  return (
    <nav aria-label="Paginação" className="flex items-center justify-between gap-3 px-1 text-xs text-slate-600">
      <span>{total} {unit} · página {page} de {pages}</span>
      <span className="inline-flex items-center gap-1">
        <button type="button" onClick={() => onPage(page - 1)} disabled={page <= 1} aria-label="Página anterior" className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40"><ChevronLeft size={14} /></button>
        <button type="button" onClick={() => onPage(page + 1)} disabled={page >= pages} aria-label="Próxima página" className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40"><ChevronRight size={14} /></button>
      </span>
    </nav>
  );
};

export interface TagValue { key: FacetKey; value: string; source?: string }

const TAG_ORDER: FacetKey[] = ['frente', 'parceiro', 'canal', 'segmento', 'subgrupo', 'oferta', 'promocional', 'momento'];

/** Tags de contexto com o rótulo da dimensão e a fonte no título (sem esconder a origem). */
export const TagRow: React.FC<{ tags: TagValue[]; skip?: FacetKey[]; max?: number }> = ({ tags, skip = [], max = 9 }) => {
  const list = tags.filter((t) => !skip.includes(t.key)).sort((a, b) => TAG_ORDER.indexOf(a.key) - TAG_ORDER.indexOf(b.key));
  const shown = list.slice(0, max);
  return (
    <div className="flex flex-wrap gap-1">
      {shown.map((t, i) => t.key === 'frente'
        ? <span key={`${t.key}-${t.value}-${i}`} title={`${FACET_LABEL[t.key]}${t.source ? ' · fonte: ' + t.source : ''}`} className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[10.5px] font-bold text-white" style={{ background: buColor(t.value) }}>{t.value}</span>
        : <span key={`${t.key}-${t.value}-${i}`} title={`${FACET_LABEL[t.key]}${t.source ? ' · fonte: ' + t.source : ''}`} className="inline-flex max-w-[170px] items-center gap-1 truncate rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10.5px] font-semibold text-slate-700"><span className="text-slate-400">{FACET_LABEL[t.key].split(' ')[0]}:</span>{t.value}</span>)}
      {list.length > shown.length && <span className="text-[10.5px] text-slate-500">+{list.length - shown.length}</span>}
    </div>
  );
};

export function tagsFromFacets(f: Record<FacetKey, string[]>, source?: string): TagValue[] {
  return TAG_ORDER.flatMap((key) => f[key].map((value) => ({ key, value, source })));
}

/** Valor somado com cobertura: ausente aparece como "—", parcial mostra k/n preenchidos. */
export const Covered: React.FC<{ v: CoveredValue; strong?: boolean; k?: boolean }> = ({ v, strong, k }) => {
  if (v.value == null) return <span className="text-slate-400" title={`Sem valor registrado em ${v.total} execução(ões)`}>—</span>;
  const n = k && v.value >= 1000 ? `${(v.value / 1000).toLocaleString('pt-BR', { maximumFractionDigits: v.value >= 100000 ? 0 : 1 })}k` : Math.round(v.value).toLocaleString('pt-BR');
  return (
    <span className={strong ? 'font-bold text-slate-900' : 'text-slate-700'}>
      {n}{v.covered < v.total && <small className="ml-1 font-semibold text-amber-700" title={`Preenchido em ${v.covered} de ${v.total} execuções`}>{v.covered}/{v.total}</small>}
    </span>
  );
};

export interface ScopeOption<T extends string> { id: T; label: string; count: number; unit: string; sub: string }

export const ScopeSelector = <T extends string,>({ value, options, onChange }: { value: T; options: ScopeOption<T>[]; onChange: (v: T) => void }) => (
  <div role="tablist" aria-label="Escopo da Performance por conteúdo" className="grid gap-2 md:grid-cols-3">
    {options.map((o) => {
      const active = o.id === value;
      return (
        <button key={o.id} type="button" role="tab" aria-selected={active} onClick={() => onChange(o.id)}
          className={`rounded-2xl border px-4 py-3 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-700 ${active ? 'border-cyan-500 bg-cyan-50 ring-1 ring-cyan-500' : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'}`}>
          <span className="flex items-baseline justify-between gap-2"><span className="text-sm font-bold text-slate-900">{o.label}</span><span className="text-xl font-bold tabular-nums text-slate-900">{o.count.toLocaleString('pt-BR')}</span></span>
          <span className="mt-0.5 block text-[11px] text-slate-600"><b className="text-slate-700">{o.unit}</b> · {o.sub}</span>
        </button>
      );
    })}
  </div>
);
