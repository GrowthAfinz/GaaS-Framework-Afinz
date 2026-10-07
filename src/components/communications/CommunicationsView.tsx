import React, { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { ClipboardCheck, Inbox, Loader2, UploadCloud, Upload, type LucideIcon } from 'lucide-react';
import { useReconciliation, type OrphanRow } from '../../hooks/useReconciliation';
import { CommunicationProposalInbox } from './CommunicationProposalInbox';
import { readProposalInbox, readProposalEvents, type ProposalRow, type ProposalEvent } from '../../services/communicationProposalService';
import { describeError } from '../../services/communicationService';
import { ReconciliationQueue } from './ReconciliationQueue';
import { ReconciliationAudit } from './ReconciliationAudit';
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
  const { orphans, reconciled, catalog, coverage, loading, error, refetch } = useReconciliation();
  const refreshProposals = useCallback(async () => {
    setProposalLoading(true); setProposalError('');
    try { const [rows, history] = await Promise.all([readProposalInbox(), readProposalEvents()]); setProposals(rows); setEvents(history); }
    catch (e) { setProposalError(describeError(e)); } finally { setProposalLoading(false); }
  }, []);
  useEffect(() => { void refreshProposals(); const changed=()=>{void refreshProposals();}; window.addEventListener('sfmc-package-changed',changed);window.addEventListener('focus',changed);return()=>{window.removeEventListener('sfmc-package-changed',changed);window.removeEventListener('focus',changed);}; }, [refreshProposals]);
  const changed = () => { refetch(); setCatalogRevision(v => v + 1); void refreshProposals(); };
  const tabs: { id: SubTab; label: string; icon: LucideIcon; n?: number }[] = [
    { id: 'fila', label: 'Propostas', icon: Inbox, n: proposals.filter(p=>['ready','review'].includes(p.status)).length },
    { id: 'asset', label: 'Biblioteca', icon: UploadCloud, n: coverage.totalTemplates },
    { id: 'auditoria', label: 'Histórico', icon: ClipboardCheck, n: events.length },
  ];

  return (
    <div className="relative flex h-full flex-col">
      <div className="border-b border-slate-200 bg-white px-6 py-4">
        <h2 className="text-2xl font-bold text-slate-900">Cadastro e templates</h2>
        <p className="mt-1 text-sm text-slate-500">Revise os IDs e comunicações propostos pela análise · aprove, rejeite ou edite</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        {loading && <p role="status" className="mb-3 flex items-center gap-2 text-xs text-slate-500"><Loader2 size={14} className="animate-spin"/>Atualizando o recorte dos disparos…</p>}
        <>
            <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-white px-4 py-3 text-sm">
              <span><strong>{proposals.filter(p=>['ready','review'].includes(p.status)).length}</strong> propostas pendentes</span>
              <span className="text-emerald-800"><strong>{proposals.filter(p=>p.status==='ready').length}</strong> prontas</span>
              <span className="text-amber-800"><strong>{proposals.filter(p=>p.status==='review').length}</strong> para revisar</span>
              <span><strong>{proposals.filter(p=>p.status==='applied').length}</strong> comunicações aprovadas</span>
              <button onClick={() => setPackageOpen(true)} className="ml-auto inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-slate-600 hover:bg-slate-100"><Upload size={14}/>Importar pacote SFMC</button>
            </div>

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
              {tab === 'fila' && <div className="space-y-5"><CommunicationProposalInbox rows={proposals} loading={proposalLoading} error={proposalError} onRefresh={()=>void refreshProposals()} onChanged={changed}/>
                <details className="rounded-xl border bg-white p-4"><summary className="cursor-pointer text-sm font-semibold text-slate-600">Disparos sem template no recorte dos dashboards · {coverage.orfaos}</summary><div className="mt-4"><ReconciliationQueue orphans={orphans} catalog={catalog} channelFilter={queueChannel} onClearChannelFilter={()=>setQueueChannel(null)} onCreate={setCompose} onChanged={changed}/></div></details>
              </div>}
              {tab === 'asset' && <TemplateCatalogView key={catalogRevision} />}
              {tab === 'auditoria' && <div className="space-y-5"><section className="overflow-x-auto rounded-xl border bg-white"><h3 className="p-4 font-semibold">Decisões e análises de comunicação</h3>{proposalError&&<p role="alert" className="p-4 text-red-700">{proposalError}</p>}<table className="w-full text-left text-xs"><thead className="bg-slate-50"><tr><th className="p-3">Data / ação</th><th className="p-3">Comunicação / ID</th><th className="p-3">Decisão e ator</th></tr></thead><tbody>{[...events].reverse().map(e=>{const p=proposals.find(p=>p.id===e.proposal_id);return <tr key={e.id} className="border-t"><td className="p-3">{new Date(e.created_at).toLocaleString('pt-BR')}<p>{({edited:'Revisão salva',rejected:'Rejeitada',applied:'Aplicada',analysis_published:'Análise publicada',analysis_received:'Análise recebida'} as Record<string,string>)[e.action]||e.action}</p></td><td className="max-w-md break-all p-3">{p?.message.payload.activity_name}<p className="font-mono">{p?.proposed_template_id}</p></td><td className="max-w-md p-3"><p>{String(e.snapshot.note||'')}</p><details><summary className="cursor-pointer text-cyan-800">Ver registro da decisão</summary><pre className="whitespace-pre-wrap break-all">{JSON.stringify({actor:e.actor,snapshot:e.snapshot},null,2)}</pre></details></td></tr>;})}</tbody></table>{!events.length&&<p className="p-6 text-sm text-slate-500">Nenhuma decisão aplicada ou revisão salva.</p>}</section><details className="rounded-xl border bg-white p-4"><summary className="cursor-pointer text-sm font-semibold">Vínculos históricos no recorte dos dashboards</summary><div className="mt-4"><ReconciliationAudit rows={reconciled} catalog={catalog} onChanged={changed}/></div></details></div>}
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
