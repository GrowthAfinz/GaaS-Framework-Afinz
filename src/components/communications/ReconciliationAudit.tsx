import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  GitBranch,
  HelpCircle,
  Link2Off,
  Loader2,
  RotateCcw,
  Search,
  Sparkles,
  Target,
} from 'lucide-react';
import { ChevronDown } from 'lucide-react';
import type { CatalogEntry, ReconciledRow } from '../../hooks/useReconciliation';
import { describeError, unlinkActivity } from '../../services/communicationService';
import { TemplateSuggestionModal } from './TemplateSuggestionModal';
import { TemplateIdChips } from './TemplateIdChips';

interface Props {
  rows: ReconciledRow[];
  catalog: CatalogEntry[];
  onChanged: () => void;
}

const fmtK = (n: number) => n >= 1000 ? `${(n / 1000).toLocaleString('pt-BR', { maximumFractionDigits: n >= 100000 ? 0 : 1 })}k` : String(Math.round(n));

const HELP_CARDS = [
  {
    icon: HelpCircle,
    title: 'Para que serve',
    body: 'Conferir tudo que já foi ligado entre activity_name e template_id antes de usar a performance como verdade.',
  },
  {
    icon: Target,
    title: 'Quando usar',
    body: 'Quando marketing trouxer dúvida de peça, reuso, semana, jornada ou quando um disparo parecer ligado ao template errado.',
  },
  {
    icon: RotateCcw,
    title: 'O que fazer',
    body: 'Use Trocar para apontar outro template ou Desvincular para devolver o disparo à fila de reconciliação.',
  },
];

export const ReconciliationAudit: React.FC<Props> = ({ rows, catalog, onChanged }) => {
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<ReconciledRow | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  const stats = useMemo(() => {
    const outsideCatalog = rows.filter((r) => !r.template).length;
    const uniqueTemplates = new Set(rows.map((r) => r.templateId)).size;
    const totalExecutions = rows.reduce((sum, r) => sum + r.exec, 0);
    return { outsideCatalog, uniqueTemplates, totalExecutions };
  }, [rows]);

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
    <div className="space-y-3">
      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="flex items-center gap-2 font-bold text-slate-900">
                <CheckCircle2 size={18} className="text-emerald-500" /> Auditoria de vínculos
              </h3>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                {rows.length} vínculos no recorte
              </span>
              <button
                onClick={() => setShowHelp((v) => !v)}
                className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-2.5 py-0.5 text-[11px] font-semibold text-slate-500 hover:bg-slate-50"
              >
                <HelpCircle size={12} /> Como usar
                <ChevronDown size={12} className={`transition-transform ${showHelp ? 'rotate-180' : ''}`} />
              </button>
            </div>
            <p className="mt-1 max-w-3xl text-xs text-slate-500">
              Confira se cada <span className="font-semibold text-slate-700">activity_name</span> aponta para o
              <span className="font-semibold text-slate-700"> template_id</span> certo antes de confiar na performance.
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

        {showHelp && (
          <div className="mt-4 grid gap-2 md:grid-cols-3">
            {HELP_CARDS.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-3">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-700">
                    <span className="rounded-lg bg-cyan-50 p-1.5 text-cyan-700"><Icon size={14} /></span>
                    {item.title}
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-slate-500">{item.body}</p>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-4 grid gap-2 text-xs md:grid-cols-4">
          <div className="rounded-xl border border-slate-100 bg-white px-3 py-2">
            <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-400">Revisados</span>
            <b className="mt-1 block text-lg text-slate-900">{rows.length}</b>
          </div>
          <div className="rounded-xl border border-slate-100 bg-white px-3 py-2">
            <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-400">Templates únicos</span>
            <b className="mt-1 block text-lg text-slate-900">{stats.uniqueTemplates}</b>
          </div>
          <div className="rounded-xl border border-slate-100 bg-white px-3 py-2">
            <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-400">Execuções cobertas</span>
            <b className="mt-1 block text-lg text-slate-900">{stats.totalExecutions}</b>
          </div>
          <div className={`rounded-xl border px-3 py-2 ${stats.outsideCatalog ? 'border-amber-200 bg-amber-50' : 'border-emerald-100 bg-emerald-50'}`}>
            <span className={`block text-[10px] font-bold uppercase tracking-wide ${stats.outsideCatalog ? 'text-amber-600' : 'text-emerald-600'}`}>Atenção</span>
            <b className={`mt-1 block text-lg ${stats.outsideCatalog ? 'text-amber-700' : 'text-emerald-700'}`}>
              {stats.outsideCatalog}
            </b>
            <span className={`text-[11px] ${stats.outsideCatalog ? 'text-amber-700' : 'text-emerald-700'}`}>
              fora do catálogo filtrado
            </span>
          </div>
        </div>
      </section>

      {error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center text-sm text-slate-500">
          Nenhum vínculo reconciliado encontrado neste recorte. Ajuste os filtros globais ou revise a fila de reconciliação.
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
                <div className="hidden w-[300px] shrink-0 md:block">
                  <TemplateIdChips id={row.templateId} showId />
                  {!row.template && <span className="mt-1 inline-block rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-600">fora do recorte filtrado</span>}
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <button
                    onClick={() => setEditing(row)}
                    title="Trocar o template_id vinculado a esta activity_name."
                    className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-200 bg-white px-3 py-2 text-xs font-bold text-cyan-700 hover:bg-cyan-50"
                  >
                    <Sparkles size={13} /> Trocar
                  </button>
                  <button
                    onClick={() => runUnlink(row)}
                    disabled={busy === row.uid}
                    title="Remove o template_id deste activity_name e devolve o disparo para a fila."
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

