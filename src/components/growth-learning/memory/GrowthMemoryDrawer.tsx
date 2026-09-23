import React, { useEffect, useState } from 'react';
import { BookMarked, CalendarClock, Database, GitBranch, ShieldCheck, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { GrowthLearning, GrowthLearningRevision } from './growthMemory.types';
import { fetchGrowthLearningRevisions } from './growthMemoryService';
import { MEMORY_CLASSIFICATION_LABELS, MEMORY_FRONT_LABELS, MEMORY_SOURCE_LABELS } from './growthMemory.logic';

interface GrowthMemoryDrawerProps {
  learning: GrowthLearning;
  onClose: () => void;
}

function formatDate(value?: string | null) {
  if (!value) return 'Não informado';
  try { return format(parseISO(value), 'dd MMM yyyy', { locale: ptBR }); } catch { return value; }
}

function entries(value: Record<string, unknown>) {
  return Object.entries(value || {}).filter(([, item]) => item !== null && item !== undefined && item !== '');
}

function renderValue(value: unknown): string {
  if (Array.isArray(value)) return value.map(renderValue).join(' · ');
  if (typeof value === 'object' && value !== null) return JSON.stringify(value);
  return String(value);
}

const Facts: React.FC<{ title: string; value: Record<string, unknown> }> = ({ title, value }) => {
  const items = entries(value);
  if (items.length === 0) return null;
  return (
    <section>
      <h3 className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">{title}</h3>
      <dl className="mt-3 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
        {items.map(([key, item]) => (
          <div key={key}>
            <dt className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">{key.split('_').join(' ')}</dt>
            <dd className="mt-1 break-words text-sm leading-5 text-slate-700">{renderValue(item)}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
};

export const GrowthMemoryDrawer: React.FC<GrowthMemoryDrawerProps> = ({ learning, onClose }) => {
  const [revisions, setRevisions] = useState<GrowthLearningRevision[]>([]);

  useEffect(() => {
    let cancelled = false;
    const closeOnEscape = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    setRevisions([]);
    window.addEventListener('keydown', closeOnEscape);
    void fetchGrowthLearningRevisions(learning.id)
      .then((items) => { if (!cancelled) setRevisions(items); })
      .catch((error) => console.error('Growth learning revisions could not be loaded', error));
    return () => {
      cancelled = true;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [learning.id, onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex justify-end bg-slate-950/45 backdrop-blur-sm" onClick={onClose}>
      <aside role="dialog" aria-modal="true" aria-label="Detalhe do aprendizado" className="flex h-full w-full max-w-3xl flex-col bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <header className="border-b border-slate-200 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-violet-100 text-violet-700"><BookMarked size={20} /></span>
              <div>
                <div className="flex flex-wrap gap-2 text-xs font-bold text-slate-500">
                  <span>{MEMORY_SOURCE_LABELS[learning.source_kind]}</span><span>·</span><span>{MEMORY_FRONT_LABELS[learning.front]}</span>
                </div>
                <h2 className="mt-1 text-xl font-black leading-snug text-slate-900">{learning.source_title}</h2>
              </div>
            </div>
            <button type="button" onClick={onClose} aria-label="Fechar" className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"><X size={20} /></button>
          </div>
        </header>

        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
          <section className="rounded-2xl border border-violet-200 bg-violet-50 p-5">
            <p className="text-sm leading-7 text-violet-950">{learning.statement}</p>
          </section>

          <section>
            <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-slate-500"><ShieldCheck size={15} /> Vigência e confiança</h3>
            <dl className="mt-3 grid gap-4 rounded-2xl border border-slate-200 p-4 sm:grid-cols-2">
              <div><dt className="text-[10px] font-black uppercase text-slate-400">Classificação</dt><dd className="mt-1 text-sm font-bold text-slate-800">{MEMORY_CLASSIFICATION_LABELS[learning.classification]}</dd></div>
              <div><dt className="text-[10px] font-black uppercase text-slate-400">Confiança</dt><dd className="mt-1 text-sm text-slate-700">{learning.confidence_status}</dd></div>
              <div><dt className="text-[10px] font-black uppercase text-slate-400">Válido desde</dt><dd className="mt-1 text-sm text-slate-700">{formatDate(learning.valid_from)}</dd></div>
              <div><dt className="text-[10px] font-black uppercase text-slate-400">Revisar em</dt><dd className={`mt-1 text-sm font-bold ${learning.review_due ? 'text-amber-700' : 'text-slate-700'}`}>{formatDate(learning.review_at)}{learning.review_due ? ' · revisão vencida' : ''}</dd></div>
              <div><dt className="text-[10px] font-black uppercase text-slate-400">Regime</dt><dd className="mt-1 text-sm text-slate-700">{learning.regime || 'Não especificado'}</dd></div>
              <div><dt className="text-[10px] font-black uppercase text-slate-400">Revisão atual</dt><dd className="mt-1 text-sm text-slate-700">v{learning.current_revision}</dd></div>
            </dl>
          </section>

          <Facts title="Escopo" value={learning.scope} />
          <Facts title="Quando aplicar" value={learning.applicability} />
          <Facts title="Limitações" value={learning.limitations} />

          <section>
            <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-slate-500"><Database size={15} /> Procedência</h3>
            <div className="mt-3 rounded-2xl border border-slate-200 p-4">
              <p className="text-sm font-bold text-slate-800">{learning.source_title}</p>
              <p className="mt-2 break-all font-mono text-[11px] leading-5 text-slate-500">{learning.source_ref}</p>
              <p className="mt-2 text-xs text-slate-500">Origem: {MEMORY_SOURCE_LABELS[learning.source_kind]} · Chave: {learning.source_key}</p>
            </div>
          </section>

          <section>
            <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-slate-500"><GitBranch size={15} /> Histórico de revisões</h3>
            <div className="mt-3 space-y-3">
              {revisions.map((revision) => (
                <article key={revision.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-black text-slate-800">Revisão {revision.revision}</span>
                    <span className="text-[11px] text-slate-400">{formatDate(revision.created_at)}</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{revision.change_reason}</p>
                  <p className="mt-2 text-[11px] text-slate-400">{revision.changed_by}</p>
                </article>
              ))}
            </div>
          </section>
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-slate-200 px-6 py-4 text-xs text-slate-500">
          <span className="inline-flex items-center gap-2"><CalendarClock size={14} /> Alterações são versionadas fora do editor do GaaS.</span>
          <button type="button" onClick={onClose} className="rounded-xl bg-slate-900 px-4 py-2.5 font-bold text-white">Concluir leitura</button>
        </footer>
      </aside>
    </div>
  );
};
