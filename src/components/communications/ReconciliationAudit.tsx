import React, { useMemo, useState } from 'react';
import { CheckCircle2, GitBranch, Link2Off, Loader2, Search, Sparkles } from 'lucide-react';
import type { CatalogEntry, ReconciledRow } from '../../hooks/useReconciliation';
import { describeError, unlinkActivity } from '../../services/communicationService';
import { TemplateSuggestionModal } from './TemplateSuggestionModal';

interface Props {
  rows: ReconciledRow[];
  catalog: CatalogEntry[];
  onChanged: () => void;
}

const fmtK = (n: number) => n >= 1000 ? `${(n / 1000).toLocaleString('pt-BR', { maximumFractionDigits: n >= 100000 ? 0 : 1 })}k` : String(Math.round(n));

export const ReconciliationAudit: React.FC<Props> = ({ rows, catalog, onChanged }) => {
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<ReconciledRow | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...rows]
      .filter((r) => !q
        || r.name.toLowerCase().includes(q)
        || r.templateId.toLowerCase().includes(q)
        || r.jornada.toLowerCase().includes(q)
        || r.canalLabel.toLowerCase().includes(q))
      .sort((a, b) => (b.latestDate ?? '').localeCompare(a.latestDate ?? '') || a.templateId.localeCompare(b.templateId));
  }, [query, rows]);

  const runUnlink = async (row: ReconciledRow) => {
    setBusy(row.uid);
    setError(null);
    try {
      await unlinkActivity(row.name);
      onChanged();
    } catch (err) {
      setError(describeError(err));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      <div className="mb-3 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="flex items-center gap-2 font-bold text-slate-900">
              <CheckCircle2 size={18} className="text-emerald-500" /> Auditoria de vínculos
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Tudo que já está reconciliado no recorte atual. Use para corrigir template_id errado, reabrir fila ou trocar vínculo.
            </p>
          </div>
          <div className="flex min-w-[320px] items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <Search size={15} className="text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar activity, template ou jornada..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
          </div>
        </div>
      </div>

      {error && <p className="mb-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center text-sm text-slate-500">
          Nenhum vínculo reconciliado encontrado neste recorte.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((row) => (
            <div key={row.uid} className="rounded-xl border border-slate-200 bg-white px-4 py-3 hover:border-cyan-200">
              <div className="flex items-center gap-3">
                <span className="shrink-0 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700">reconciliado</span>
                <span className="shrink-0 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-500">{row.canalLabel}</span>
                <div className="min-w-0 flex-1">
                  <code className="block truncate font-mono text-xs font-semibold text-slate-800">{row.name}</code>
                  <div className="mt-0.5 flex items-center gap-1 truncate text-[10.5px] text-slate-400"><GitBranch size={11} /> {row.jornada}</div>
                </div>
                <div className="hidden shrink-0 gap-3.5 text-[11px] tabular-nums text-slate-500 sm:flex">
                  <span><b className="text-slate-800">{fmtK(row.base)}</b> base</span>
                  <span><b className="text-slate-800">{row.exec}</b> exec</span>
                  <span className="text-slate-400">{row.latestDate?.slice(0, 10)}</span>
                </div>
                <div className="hidden w-[250px] shrink-0 md:block">
                  <code className={`truncate rounded-md px-2 py-1 text-[11px] font-bold ${row.template ? 'bg-cyan-50 text-cyan-700' : 'bg-amber-50 text-amber-700'}`}>
                    {row.templateId}
                  </code>
                  {!row.template && <span className="ml-2 text-[10px] font-bold text-amber-600">fora do catálogo filtrado</span>}
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <button
                    onClick={() => setEditing(row)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-200 bg-white px-3 py-2 text-xs font-bold text-cyan-700 hover:bg-cyan-50"
                  >
                    <Sparkles size={13} /> Trocar
                  </button>
                  <button
                    onClick={() => runUnlink(row)}
                    disabled={busy === row.uid}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-60"
                  >
                    {busy === row.uid ? <Loader2 size={13} className="animate-spin" /> : <Link2Off size={13} />} Desvincular
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <TemplateSuggestionModal
          row={editing}
          catalog={catalog}
          currentTemplateId={editing.templateId}
          onClose={() => setEditing(null)}
          onChanged={onChanged}
        />
      )}
    </div>
  );
};

