import React, { useState } from 'react';
import { Inbox, UploadCloud, Plus, Loader2, type LucideIcon } from 'lucide-react';
import { useReconciliation, type OrphanRow } from '../../hooks/useReconciliation';
import { CoverageHeader } from './CoverageHeader';
import { ReconciliationQueue } from './ReconciliationQueue';
import { TemplateCatalogView } from './TemplateCatalogView';
import { TemplateComposerDrawer } from './TemplateComposerDrawer';
import { PerformanceView } from './performance/PerformanceView';

interface CommunicationsViewProps {
  mode: 'cadastro' | 'performance';
}

type SubTab = 'fila' | 'asset';

export const CommunicationsView: React.FC<CommunicationsViewProps> = ({ mode }) => {
  if (mode === 'performance') {
    return <PerformanceView />;
  }
  return <CadastroTemplates />;
};

const CadastroTemplates: React.FC = () => {
  const [tab, setTab] = useState<SubTab>('fila');
  const [compose, setCompose] = useState<OrphanRow | null | undefined>(undefined); // undefined=fechado, null=novo, orphan=seed
  const { orphans, coverage, loading, error, refetch } = useReconciliation();

  const tabs: { id: SubTab; label: string; icon: LucideIcon; n?: number }[] = [
    { id: 'fila', label: 'Fila de reconciliação', icon: Inbox, n: coverage.orfaos },
    { id: 'asset', label: 'Aguardando asset', icon: UploadCloud, n: coverage.semAsset },
  ];

  return (
    <div className="relative flex h-full flex-col">
      <div className="border-b border-slate-200 bg-white px-6 py-4">
        <h2 className="text-2xl font-bold text-slate-900">Cadastro e templates</h2>
        <p className="mt-0.5 text-sm text-slate-500">Costure os disparos do CRM aos templates curados · governança de assets e cobertura de réguas</p>
      </div>

      {/* pb-28 garante que o conteúdo não fique atrás do FAB */}
      <div className="flex-1 overflow-y-auto p-6 pb-28">
        {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-400"><Loader2 size={18} className="animate-spin" /> Carregando cobertura…</div>
        ) : (
          <>
            <CoverageHeader c={coverage} />

            <div className="mt-5 flex items-center gap-2">
              {tabs.map((t) => {
                const Icon = t.icon;
                const active = tab === t.id;
                return (
                  <button key={t.id} onClick={() => setTab(t.id)}
                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${active ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}>
                    <Icon size={15} /> {t.label}
                    {t.n != null && <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${active ? 'bg-white/25' : 'bg-slate-100 text-slate-500'}`}>{t.n}</span>}
                  </button>
                );
              })}
            </div>

            <div className="mt-5">
              {tab === 'fila' && (
                <ReconciliationQueue orphans={orphans} onCreate={(seed) => setCompose(seed)} onChanged={refetch} />
              )}
              {tab === 'asset' && <TemplateCatalogView />}
            </div>
          </>
        )}
      </div>

      <button onClick={() => setCompose(null)}
        className="absolute bottom-6 right-6 z-10 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white shadow-lg hover:bg-slate-800">
        <Plus size={16} /> Novo template
      </button>

      {compose !== undefined && (
        <TemplateComposerDrawer seed={compose} onClose={() => setCompose(undefined)} onSaved={() => { setCompose(undefined); refetch(); }} />
      )}
    </div>
  );
};
