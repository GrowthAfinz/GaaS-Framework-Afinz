import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { usePeriod } from '../../contexts/PeriodContext';
import { PeriodSelector } from '../period-selector/PeriodSelector';
import type { ProposalEvent, ProposalRow } from '../../services/communicationProposalService';
import type { CatalogEntry, ReconciledRow } from '../../hooks/useReconciliation';
import { dispatchDay } from '../../utils/communicationOrchestrator';
import { ExecutionDuplicateReview } from './ExecutionDuplicateReview';
import { ReconciliationAudit } from './ReconciliationAudit';
import { HowItWorks, Segmented, controlClass } from './ui/commsUi';

type ActionFilter = 'all' | 'applied' | 'rejected' | 'edited' | 'analysis';
const ACTION: Record<string, { label: string; tone: string; group: ActionFilter }> = {
  execution_linked: { label: 'Execuções vinculadas', tone: 'bg-cyan-50 text-cyan-900 ring-cyan-200', group: 'applied' },
  applied: { label: 'Enviada', tone: 'bg-cyan-50 text-cyan-900 ring-cyan-200', group: 'applied' },
  rejected: { label: 'Rejeitada', tone: 'bg-red-50 text-red-800 ring-red-200', group: 'rejected' },
  edited: { label: 'Revisão salva', tone: 'bg-slate-100 text-slate-800 ring-slate-200', group: 'edited' },
  analysis_published: { label: 'Análise publicada', tone: 'bg-emerald-50 text-emerald-900 ring-emerald-200', group: 'analysis' },
  analysis_received: { label: 'Análise recebida', tone: 'bg-emerald-50 text-emerald-900 ring-emerald-200', group: 'analysis' },
};
const actionOf = (a: string) => ACTION[a] ?? { label: a, tone: 'bg-slate-100 text-slate-800 ring-slate-200', group: 'all' as ActionFilter };

/** Auditoria: decisões da fila, higiene de execuções repetidas e vínculos históricos, no período do calendário. */
export function CommunicationsAuditView({ events, proposals, error, reconciled, catalog, onChanged }: {
  events: ProposalEvent[]; proposals: ProposalRow[]; error: string; reconciled: ReconciledRow[]; catalog: CatalogEntry[]; onChanged: () => void;
}) {
  const { startDate, endDate } = usePeriod();
  const start = dispatchDay(startDate.toISOString()), end = dispatchDay(endDate.toISOString());
  const [filter, setFilter] = useState<ActionFilter>('all');
  const [query, setQuery] = useState('');
  const byId = useMemo(() => new Map(proposals.map((p) => [p.id, p])), [proposals]);
  const inPeriod = useMemo(() => events.filter((e) => { const d = dispatchDay(e.created_at); return d >= start && d <= end; }), [events, start, end]);
  const visible = useMemo(() => [...inPeriod].reverse().filter((e) => {
    if (filter !== 'all' && actionOf(e.action).group !== filter) return false;
    if (!query) return true;
    const p = byId.get(e.proposal_id);
    return [p?.message.payload.activity_name, p?.proposed_template_id, e.snapshot.activity_name,e.snapshot.template_id, e.actor, String(e.snapshot.note ?? '')].join(' ').toLowerCase().includes(query.toLowerCase());
  }), [inPeriod, filter, query, byId]);
  const count = (g: ActionFilter) => g === 'all' ? inPeriod.length : inPeriod.filter((e) => actionOf(e.action).group === g).length;

  return (
    <div className="space-y-4">
      <HowItWorks steps={[
        { title: 'Decisões', text: 'Toda revisão, aprovação, envio e rejeição da fila fica registrada com data, autor e motivo.' },
        { title: 'Execuções repetidas', text: 'Disparos registrados duas vezes no mesmo dia podem ser consolidados, com justificativa. Os originais são preservados.' },
        { title: 'Vínculos históricos', text: 'Confira os disparos já ligados a um template antes de usar a performance como verdade.' },
      ]} />
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-3">
        <div className="flex flex-col gap-1 text-xs font-semibold text-slate-600">Período<PeriodSelector compact /></div>
        <label className="flex min-w-56 flex-1 flex-col gap-1 text-xs font-semibold text-slate-600">Buscar
          <span className="relative"><Search size={14} aria-hidden="true" className="absolute left-3 top-3 text-slate-500" />
            <input className={controlClass + ' w-full pl-9'} placeholder="Activity Name, template ID, autor ou motivo" value={query} onChange={(e) => setQuery(e.target.value)} /></span>
        </label>
      </div>
      <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4" aria-labelledby="audit-decisions">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 id="audit-decisions" className="text-base font-semibold text-slate-900">Decisões da fila</h3>
          <Segmented<ActionFilter> label="Tipo de decisão" value={filter} onChange={setFilter} options={[
            { id: 'all', label: 'Todas', count: count('all') }, { id: 'applied', label: 'Enviadas', count: count('applied') },
            { id: 'rejected', label: 'Rejeitadas', count: count('rejected') }, { id: 'edited', label: 'Revisões', count: count('edited') },
            { id: 'analysis', label: 'Análises', count: count('analysis') },
          ]} />
        </div>
        {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
        <p className="text-sm text-slate-600">{visible.length} {visible.length === 1 ? 'registro' : 'registros'} no período. {events.length - inPeriod.length > 0 ? `${events.length - inPeriod.length} fora do período.` : ''}</p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600"><tr><th className="p-3">Data</th><th className="p-3">Decisão</th><th className="p-3">Comunicação e template</th><th className="p-3">Autor e motivo</th></tr></thead>
            <tbody>
              {visible.map((e) => {
                const p = byId.get(e.proposal_id); const a = actionOf(e.action);
                return (
                  <tr key={e.id} className="border-t border-slate-200 align-top">
                    <td className="whitespace-nowrap p-3 text-slate-700">{new Date(e.created_at).toLocaleString('pt-BR')}</td>
                    <td className="p-3"><span className={`inline-block rounded-md px-2 py-1 text-xs font-bold ring-1 ${a.tone}`}>{a.label}</span></td>
                    <td className="max-w-md p-3"><p className="break-all text-slate-800">{p?.message.payload.activity_name || String(e.snapshot.activity_name||'Comunicação indisponível')}</p><p className="break-all font-mono text-xs text-slate-700">{p?.proposed_template_id || String(e.snapshot.template_id||'Sem template ID')}</p></td>
                    <td className="max-w-md p-3"><p className="text-slate-800">{e.actor || 'Autor não registrado'}</p>{e.snapshot.note ? <p className="text-slate-700">{String(e.snapshot.note)}</p> : null}
                      <details className="mt-1"><summary className="cursor-pointer text-sm font-semibold text-cyan-800">Ver registro completo</summary><pre className="mt-1 whitespace-pre-wrap break-all text-xs text-slate-700">{JSON.stringify({ actor: e.actor, snapshot: e.snapshot }, null, 2)}</pre></details></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!visible.length && <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">Nenhuma decisão neste período e filtro. Mude o período no calendário para ver registros anteriores.</p>}
      </section>
      <section className="space-y-2" aria-label="Execuções repetidas">
        <h3 className="text-base font-semibold text-slate-900">Execuções repetidas</h3>
        <ExecutionDuplicateReview start={start} end={end} onChanged={onChanged} sourceRevision={proposals} />
      </section>
      <details className="rounded-xl border border-slate-200 bg-white p-4">
        <summary className="cursor-pointer text-base font-semibold text-slate-900">Vínculos históricos no período ({reconciled.length})</summary>
        <div className="mt-4"><ReconciliationAudit rows={reconciled} catalog={catalog} onChanged={onChanged} /></div>
      </details>
    </div>
  );
}
