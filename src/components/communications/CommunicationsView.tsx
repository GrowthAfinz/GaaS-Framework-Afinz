import React, { useMemo, useState } from 'react';
import { ArrowRight, ClipboardCheck, Inbox, Loader2, Radio, UploadCloud, X, type LucideIcon } from 'lucide-react';
import { useReconciliation, type CatalogEntry, type OrphanRow } from '../../hooks/useReconciliation';
import { useAppStore } from '../../store/useAppStore';
import { CoverageHeader } from './CoverageHeader';
import { ReconciliationQueue } from './ReconciliationQueue';
import { ReconciliationAudit } from './ReconciliationAudit';
import { TemplateCatalogView } from './TemplateCatalogView';
import { TemplateComposerDrawer } from './TemplateComposerDrawer';
import { TemplateIdChips } from './TemplateIdChips';
import { PerformanceView } from './performance/PerformanceView';

interface CommunicationsViewProps {
  mode: 'cadastro' | 'performance';
}

type SubTab = 'fila' | 'asset' | 'auditoria';

export const CommunicationsView: React.FC<CommunicationsViewProps> = ({ mode }) => {
  if (mode === 'performance') {
    return <PerformanceView />;
  }
  return <CadastroTemplates />;
};

const CadastroTemplates: React.FC = () => {
  const [tab, setTab] = useState<SubTab>('fila');
  const [compose, setCompose] = useState<OrphanRow | null | undefined>(undefined); // undefined=fechado, null=novo, orphan=seed
  const [queueChannel, setQueueChannel] = useState<string | null>(null); // filtro de canal vindo do header de cobertura
  const [showAtivos, setShowAtivos] = useState(false); // modal "Templates no ar"
  const { orphans, reconciled, catalog, coverage, loading, error, refetch } = useReconciliation();
  const setStoreTab = useAppStore((s) => s.setTab);
  const setPerfDeepLink = useAppStore((s) => s.setPerfDeepLink);

  const ativos = useMemo(() => catalog.filter((c) => c.hasAsset && c.inCurrentFilter), [catalog]);

  const abrirPerformance = (templateId: string) => {
    setPerfDeepLink({ view: 'table', query: templateId });
    setStoreTab('comunicacoes-performance');
  };

  const tabs: { id: SubTab; label: string; icon: LucideIcon; n?: number }[] = [
    { id: 'fila', label: 'Fila de reconciliação', icon: Inbox, n: coverage.orfaos },
    { id: 'asset', label: 'Templates sem peça', icon: UploadCloud, n: coverage.semAsset },
    { id: 'auditoria', label: 'Auditoria', icon: ClipboardCheck, n: reconciled.length },
  ];

  return (
    <div className="relative flex h-full flex-col">
      <div className="border-b border-slate-200 bg-white px-6 py-4">
        <h2 className="text-2xl font-bold text-slate-900">Cadastro e templates</h2>
        <p className="mt-0.5 text-sm text-slate-500">Costure os disparos do CRM aos templates curados · governança de peças e cobertura de réguas</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-400"><Loader2 size={18} className="animate-spin" /> Carregando cobertura…</div>
        ) : (
          <>
            <CoverageHeader
              c={coverage}
              onOrfaosClick={() => { setQueueChannel(null); setTab('fila'); }}
              onSemPecaClick={() => setTab('asset')}
              onChannelClick={(label) => { setQueueChannel(label); setTab('fila'); }}
              onAtivosClick={() => setShowAtivos(true)}
            />

            <div className="mt-5 flex items-center gap-2">
              {tabs.map((t) => {
                const Icon = t.icon;
                const active = tab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${active ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
                  >
                    <Icon size={15} /> {t.label}
                    {t.n != null && <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${active ? 'bg-white/25' : 'bg-slate-100 text-slate-500'}`}>{t.n}</span>}
                  </button>
                );
              })}
            </div>

            <div className="mt-5">
              {tab === 'fila' && (
                <ReconciliationQueue
                  orphans={orphans}
                  catalog={catalog}
                  channelFilter={queueChannel}
                  onClearChannelFilter={() => setQueueChannel(null)}
                  onCreate={(seed) => setCompose(seed)}
                  onChanged={refetch}
                />
              )}
              {tab === 'asset' && <TemplateCatalogView />}
              {tab === 'auditoria' && <ReconciliationAudit rows={reconciled} catalog={catalog} onChanged={refetch} />}
            </div>
          </>
        )}
      </div>

      {compose !== undefined && (
        <TemplateComposerDrawer seed={compose} onClose={() => setCompose(undefined)} onSaved={() => { setCompose(undefined); refetch(); }} />
      )}

      {showAtivos && (
        <ActiveTemplatesModal
          templates={ativos}
          total={coverage.totalTemplates}
          onClose={() => setShowAtivos(false)}
          onVerPerformance={(id) => { setShowAtivos(false); abrirPerformance(id); }}
        />
      )}
    </div>
  );
};

const CHANNEL_DOT: Record<string, string> = {
  'E-mail': '#0ea5e9', Email: '#0ea5e9', SMS: '#f59e0b', WhatsApp: '#22c55e', Push: '#a855f7',
};

interface ActiveTemplatesModalProps {
  templates: CatalogEntry[];
  total: number;
  onClose: () => void;
  onVerPerformance: (templateId: string) => void;
}

/** Modal com os templates "no ar" (com peça, dentro do recorte). Clicar em "Ver performance" faz deep-link para a tabela de Performance filtrada pelo template. */
const ActiveTemplatesModal: React.FC<ActiveTemplatesModalProps> = ({ templates, total, onClose, onVerPerformance }) => {
  const [q, setQ] = useState('');
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return templates;
    return templates.filter((t) => t.id.toLowerCase().includes(s) || (t.channel ?? '').toLowerCase().includes(s));
  }, [templates, q]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 bg-gradient-to-br from-[#063b3d] via-[#0a5f63] to-[#00838a] px-6 py-5 text-white">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-white/15">
              <Radio size={20} />
            </div>
            <div>
              <div className="text-lg font-bold leading-tight">Templates no ar</div>
              <div className="text-xs text-white/75">{templates.length} peças vinculadas e dentro do recorte · de {total} cadastradas</div>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-white/80 transition-colors hover:bg-white/15 hover:text-white" title="Fechar">
            <X size={18} />
          </button>
        </div>

        <div className="border-b border-slate-100 px-6 py-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filtrar por template ID ou canal…"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none focus:border-cyan-400 focus:bg-white"
          />
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-2">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400">Nenhum template encontrado.</div>
          ) : (
            <ul className="flex flex-col gap-1">
              {filtered.map((t) => (
                <li key={t.id}>
                  <button
                    onClick={() => onVerPerformance(t.id)}
                    className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-cyan-50"
                    title={`Ver performance de ${t.id}`}
                  >
                    <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ background: CHANNEL_DOT[t.channel] ?? '#94a3b8' }} />
                    <span className="min-w-0 flex-1">
                      <TemplateIdChips id={t.id} showId />
                      <span className="mt-0.5 block text-[11px] text-slate-400">
                        {t.channel} · {t.vinc} {t.vinc === 1 ? 'disparo vinculado' : 'disparos vinculados'}
                      </span>
                    </span>
                    <span className="flex flex-shrink-0 items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition-colors group-hover:bg-cyan-600 group-hover:text-white">
                      Ver performance <ArrowRight size={13} />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};
