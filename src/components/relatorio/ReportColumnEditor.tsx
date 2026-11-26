import React, { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Columns3, Info, RotateCcw, Search, X } from 'lucide-react';

/**
 * Editor de colunas descritivo. Diferente do ColumnsCustomizer (liga/desliga),
 * cada campo carrega fonte, grão, definição e disponibilidade, e o editor
 * impede combinações que as fontes não sustentam.
 */
export interface ReportFieldDef {
  key: string;
  label: string;
  kind: 'dimension' | 'metric';
  category: string;
  /** Camada de origem (ex.: sfmc, ga4). `common` combina com qualquer camada. */
  layer: string;
  source: string;
  grain: string;
  definition: string;
  availability: { state: 'available' | 'derived' | 'unavailable'; note?: string };
}

export interface ReportFieldProfile {
  key: string;
  label: string;
  description: string;
  fields: string[];
  disabledReason?: string;
}

/** Motivo pelo qual o campo não pode entrar na seleção atual; null quando pode. */
export function fieldBlockedReason(field: ReportFieldDef, selected: ReportFieldDef[]): string | null {
  if (field.availability.state === 'unavailable') return field.availability.note ?? 'Campo ainda sem fonte integrada.';
  if (field.layer === 'common') return null;
  const other = selected.find((s) => s.key !== field.key && s.layer !== 'common' && s.layer !== field.layer);
  return other ? `Não combina com "${other.label}": as fontes têm grão diferente e não existe chave entre elas.` : null;
}

export function sanitizeSelection(keys: string[], fields: ReportFieldDef[]): string[] {
  const byKey = new Map(fields.map((f) => [f.key, f]));
  const result: ReportFieldDef[] = [];
  for (const key of keys) {
    const field = byKey.get(key);
    if (field && !result.includes(field) && !fieldBlockedReason(field, result)) result.push(field);
  }
  return result.map((f) => f.key);
}

const stateLabel: Record<ReportFieldDef['availability']['state'], string> = {
  available: '',
  derived: 'derivado',
  unavailable: 'sem fonte',
};

export const ReportColumnEditor: React.FC<{
  fields: ReportFieldDef[];
  profiles: ReportFieldProfile[];
  value: string[];
  defaults: string[];
  onChange: (next: string[]) => void;
  layerLabels: Record<string, string>;
  title?: string;
}> = ({ fields, profiles, value, defaults, onChange, layerLabels, title = 'Personalizar colunas' }) => {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<string[]>(value);
  const [query, setQuery] = useState('');
  const byKey = useMemo(() => new Map(fields.map((f) => [f.key, f])), [fields]);

  useEffect(() => { if (open) { setDraft(value); setQuery(''); } }, [open, value]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const selected = draft.map((k) => byKey.get(k)).filter((f): f is ReportFieldDef => Boolean(f));
  const q = query.trim().toLowerCase();
  const visible = fields.filter((f) => !q || [f.label, f.category, f.source, layerLabels[f.layer] ?? f.layer, f.definition].some((t) => t.toLowerCase().includes(q)));
  const categories = [...new Set(visible.map((f) => f.category))];

  const toggle = (field: ReportFieldDef) => {
    if (draft.includes(field.key)) setDraft(draft.filter((k) => k !== field.key));
    else if (!fieldBlockedReason(field, selected)) setDraft([...draft, field.key]);
  };
  const move = (index: number, delta: number) => {
    const next = [...draft];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setDraft(next);
  };
  const activeProfile = profiles.find((p) => p.fields.join() === draft.join());

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-800"
      >
        <Columns3 size={13} /> Colunas
        <span className="rounded-full bg-cyan-50 px-1.5 py-0.5 text-[10px] font-bold text-cyan-700">{value.length}</span>
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/30" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
          <div className="flex h-full w-full max-w-4xl flex-col bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">{title}</h2>
                <p className="text-xs text-slate-500">As dimensões escolhidas definem o nível de detalhe da tabela. Cada campo mostra de onde vem e o que mede.</p>
              </div>
              <button type="button" aria-label="Fechar" onClick={() => setOpen(false)} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X size={16} /></button>
            </div>
            <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
              <div className="flex min-h-0 flex-col border-r border-slate-100">
                <div className="space-y-3 px-6 pt-4">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Visões prontas</p>
                  <div className="flex flex-wrap gap-2">
                    {profiles.map((p) => (
                      <button
                        key={p.key}
                        type="button"
                        disabled={Boolean(p.disabledReason)}
                        title={p.disabledReason ?? p.description}
                        onClick={() => setDraft(sanitizeSelection(p.fields, fields))}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:border-dashed disabled:text-slate-300 ${activeProfile?.key === p.key ? 'border-cyan-600 bg-cyan-50 text-cyan-800' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                  <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs focus-within:border-cyan-500">
                    <Search size={13} className="text-slate-400" />
                    <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar campo, categoria ou fonte" className="w-full bg-transparent outline-none" aria-label="Buscar campo" />
                  </label>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
                  {categories.map((cat) => (
                    <div key={cat} className="mb-3">
                      <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">{cat}</p>
                      {visible.filter((f) => f.category === cat).map((f) => {
                        const checked = draft.includes(f.key);
                        const blocked = checked ? null : fieldBlockedReason(f, selected);
                        return (
                          <button
                            key={f.key}
                            type="button"
                            onClick={() => toggle(f)}
                            aria-pressed={checked}
                            aria-disabled={Boolean(blocked)}
                            title={blocked ?? f.definition}
                            className={`flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors ${blocked ? 'cursor-not-allowed text-slate-300' : 'hover:bg-slate-50'} ${checked ? 'text-slate-900' : 'text-slate-600'}`}
                          >
                            <span className={`mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border ${checked ? 'border-cyan-600 bg-cyan-600 text-white' : 'border-slate-300 bg-white'}`}>{checked && <span className="text-[9px] leading-none">✓</span>}</span>
                            <span className="min-w-0 flex-1">
                              <span className="font-semibold">{f.label}</span>
                              {stateLabel[f.availability.state] && <span className={`ml-2 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${f.availability.state === 'derived' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-400'}`}>{stateLabel[f.availability.state]}</span>}
                              <span className="block text-[11px] text-slate-400">{f.kind === 'metric' ? 'Métrica' : 'Dimensão'} · {layerLabels[f.layer] ?? f.layer} · {f.grain}</span>
                              {blocked && <span className="block text-[11px] text-slate-400">{blocked}</span>}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ))}
                  {!visible.length && <p className="px-2 py-6 text-center text-xs text-slate-400">Nenhum campo encontrado.</p>}
                </div>
              </div>
              <div className="flex min-h-0 flex-col bg-slate-50/60">
                <p className="px-6 pt-4 text-[11px] font-bold uppercase tracking-widest text-slate-400">Colunas selecionadas ({selected.length})</p>
                <ol className="min-h-0 flex-1 space-y-1.5 overflow-y-auto px-6 py-3">
                  {selected.map((f, i) => (
                    <li key={f.key} className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-800">{f.label}</span>
                        <span className="text-[10px] text-slate-400">{f.kind === 'metric' ? 'métrica' : 'dimensão'}</span>
                        <button type="button" aria-label={`Subir ${f.label}`} disabled={i === 0} onClick={() => move(i, -1)} className="rounded p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-30"><ArrowUp size={12} /></button>
                        <button type="button" aria-label={`Descer ${f.label}`} disabled={i === selected.length - 1} onClick={() => move(i, 1)} className="rounded p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-30"><ArrowDown size={12} /></button>
                        <button type="button" aria-label={`Remover ${f.label}`} onClick={() => setDraft(draft.filter((k) => k !== f.key))} className="rounded p-0.5 text-slate-400 hover:text-red-600"><X size={12} /></button>
                      </div>
                      <p className="mt-1 flex gap-1 text-[11px] leading-snug text-slate-500"><Info size={11} className="mt-0.5 shrink-0" />{f.definition}</p>
                    </li>
                  ))}
                  {!selected.length && <li className="py-6 text-center text-xs text-slate-400">Escolha ao menos uma dimensão e uma métrica.</li>}
                </ol>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-slate-200 px-6 py-3">
              <button type="button" onClick={() => setDraft(defaults)} className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-cyan-700"><RotateCcw size={12} /> Restaurar padrão</button>
              <div className="flex gap-2">
                <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">Cancelar</button>
                <button
                  type="button"
                  disabled={!selected.some((f) => f.kind === 'metric') || !selected.some((f) => f.kind === 'dimension')}
                  onClick={() => { onChange(draft); setOpen(false); }}
                  className="rounded-lg bg-cyan-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Aplicar colunas
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
