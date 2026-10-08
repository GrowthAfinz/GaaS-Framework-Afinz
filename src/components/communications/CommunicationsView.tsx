import React, { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { ClipboardCheck, Inbox, LayoutTemplate, Loader2, Upload, type LucideIcon } from 'lucide-react';
import { useReconciliation, type OrphanRow } from '../../hooks/useReconciliation';
import { CommunicationProposalInbox, type InboxSummary } from './CommunicationProposalInbox';
import { CommunicationsAuditView } from './CommunicationsAuditView';
import { readProposalInbox, readProposalEvents, type ProposalRow, type ProposalEvent } from '../../services/communicationProposalService';
import { describeError } from '../../services/communicationService';
import { ReconciliationQueue } from './ReconciliationQueue';
import { TemplateCatalogView } from './TemplateCatalogView';
import { TemplateComposerDrawer } from './TemplateComposerDrawer';
import { PerformanceView } from './performance/PerformanceView';
import { AppsFlyerAuditView } from './appsflyer-audit/AppsFlyerAuditView';

const PackageImportModal = lazy(() => import('./PackageImportModal').then(m => ({ default: m.PackageImportModal })));

interface CommunicationsViewProps {
  mode: 'cadastro' | 'performance' | 'appsflyer-audit';
}

type SubTab = 'fila' | 'asset' | 'auditoria';

export const CommunicationsView: React.FC<CommunicationsViewProps> = ({ mode }) => {
  if (mode === 'performance') {
    return <PerformanceView />;
  }
  if (mode === 'appsflyer-audit') {
    return <AppsFlyerAuditView />;
  }
  return <CadastroTemplates />;
};

const CadastroTemplates: React.FC = () => {
  const [packageOpen, setPackageOpen] = useState(false);
  const [catalogRevision, setCatalogRevision] = useState(0);
  const [tab, setTab] = useState<SubTab>('fila');
  const [compose, setCompose] = useState<OrphanRow | null | undefined>(undefined); // undefined=fechado, null=novo, orphan=seed
  const [queueChannel, setQueueChannel] = useState<string | null>(null); // filtro de canal vindo do header de cobertura
  const [proposals, setProposals] = useState<ProposalRow[]>([]), [events, setEvents] = useState<ProposalEvent[]>([]);
  const [proposalLoading, setProposalLoading] = useState(true), [proposalError, setProposalError] = useState('');
  const [evidenceRevision, setEvidenceRevision] = useState(0);
  const [summary, setSummary] = useState<InboxSummary | null>(null);
  const { orphans, reconciled, catalog, coverage, loading, error, refetch } = useReconciliation();
  const lastRefresh = useRef(0);
  // silent: atualiza em segundo plano, sem trocar a fila por "carregando" nem recriar a lista quando nada mudou.
  const refreshProposals = useCallback(async (silent = false) => {
    lastRefresh.current = Date.now();
    if (!silent) setProposalLoading(true);
    setProposalError('');
    try {
      const [rows, history] = await Promise.all([readProposalInbox(), readProposalEvents()]);
      const sig = (list: ProposalRow[]) => list.map(p => p.id + ':' + p.revision + ':' + p.status).join('|');
      setProposals(prev => (sig(prev) === sig(rows) ? prev : rows));
      if (!silent) setEvidenceRevision(v => v + 1);
      setEvents(prev => (prev.length === history.length && prev[prev.length - 1]?.id === history[history.length - 1]?.id ? prev : history));
    }
    catch (e) { if (!silent) setProposalError(describeError(e)); } finally { if (!silent) setProposalLoading(false); }
  }, []);
  useEffect(() => {
    void refreshProposals();
    const changed = () => { void refreshProposals(); };
    // Voltar para a aba (ou sair do iframe da prévia) não pode recarregar a tela: só atualiza em silêncio, no máximo 1x/min.
    const focused = () => { if (document.visibilityState === 'visible' && Date.now() - lastRefresh.current > 60_000) void refreshProposals(true); };
    window.addEventListener('sfmc-package-changed', changed); window.addEventListener('focus', focused);
    return () => { window.removeEventListener('sfmc-package-changed', changed); window.removeEventListener('focus', focused); };
  }, [refreshProposals]);
  const changed = () => { refetch(); setCatalogRevision(v => v + 1); void refreshProposals(); };
  const tabs: { id: SubTab; label: string; icon: LucideIcon; n?: number }[] = [
    { id: 'fila', label: 'Fila de reconciliação', icon: Inbox, n: summary?.pending },
    { id: 'asset', label: 'Templates', icon: LayoutTemplate, n: coverage.totalTemplates },
    { id: 'auditoria', label: 'Auditoria', icon: ClipboardCheck, n: events.length },
  ];

  return (
    <div className="relative flex h-full flex-col">
      <div className="border-b border-slate-200 bg-white px-6 py-4">
        <h2 className="text-2xl font-bold text-slate-900">Cadastro e templates</h2>
        <p className="mt-1 text-sm text-slate-600">Ligue cada disparo do CRM ao template certo: revise as propostas da análise, aprove e envie.</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {error && <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}

        {loading && <p role="status" className="mb-3 flex items-center gap-2 text-sm text-slate-600"><Loader2 size={14} className="animate-spin" aria-hidden="true"/>Atualizando os disparos do período…</p>}
        <>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl bg-gradient-to-r from-teal-950 to-cyan-800 px-5 py-4 text-sm text-white" aria-label="Resumo da fila no período">
              <span className="text-xs font-semibold uppercase tracking-wide text-white/80">No período</span>
              <span><strong className="text-lg">{summary?.pending ?? '…'}</strong> a revisar</span>
              <span><strong className="text-lg">{summary?.ready ?? '…'}</strong> prontas</span>
              <span><strong className="text-lg">{summary?.review ?? '…'}</strong> com pendências</span>
              <span><strong className="text-lg">{summary?.applied ?? '…'}</strong> enviadas</span>
              <button onClick={() => setPackageOpen(true)} className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-white/30 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10"><Upload size={15} aria-hidden="true"/>Importar pacote SFMC</button>
            </div>

            <div role="tablist" aria-label="Seções de cadastro e templates" className="mt-5 flex flex-wrap items-center gap-2">
              {tabs.map((t) => {
                const Icon = t.icon;
                const active = tab === t.id;
                return (
                  <button
                    key={t.id}
                    role="tab"
                    aria-selected={active}
                    onClick={() => setTab(t.id)}
                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-700 ${active ? 'bg-cyan-700 text-white shadow-sm' : 'text-slate-700 hover:bg-slate-100'}`}
                  >
                    <Icon size={15} aria-hidden="true" /> {t.label}
                    {t.n != null && <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${active ? 'bg-white/25' : 'bg-slate-100 text-slate-700'}`}>{t.n}</span>}
                  </button>
                );
              })}
            </div>

            <div className="mt-5" role="tabpanel">
              {tab === 'fila' && <ReconciliationQueue refreshing={loading||!!error} packCount={summary ? proposals.length - summary.hidden : 0} packInbox={<CommunicationProposalInbox evidenceRevision={evidenceRevision} catalog={catalog} rows={proposals} loading={proposalLoading} error={proposalError} onRefresh={changed} onChanged={changed} onSummary={setSummary}/>} orphans={orphans} catalog={catalog} channelFilter={queueChannel} onClearChannelFilter={()=>setQueueChannel(null)} onCreate={setCompose} onChanged={changed}/>}
              {tab === 'asset' && <TemplateCatalogView key={catalogRevision} />}
              {tab === 'auditoria' && <CommunicationsAuditView events={events} proposals={proposals} error={proposalError} reconciled={reconciled} catalog={catalog} onChanged={changed} />}
            </div>
        </>
      </div>

      {packageOpen && <Suspense fallback={<p role="status" className="p-4 text-sm">Carregando importação...</p>}><PackageImportModal onClose={() => setPackageOpen(false)} onChanged={changed} /></Suspense>}

      {compose !== undefined && (
        <TemplateComposerDrawer seed={compose} onClose={() => setCompose(undefined)} onSaved={() => { setCompose(undefined); refetch(); }} />
      )}

    </div>
  );
};
