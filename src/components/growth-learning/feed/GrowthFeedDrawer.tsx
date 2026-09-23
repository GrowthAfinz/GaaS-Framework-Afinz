import React, { useEffect } from 'react';
import { CalendarDays, Database, ExternalLink, Fingerprint, ShieldCheck, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { GrowthFeedEvent } from './growthFeed.types';
import { FeedEventIcon, FRONT_LABELS, GROWTH_FEED_CARD_REGISTRY } from './growthFeedRegistry';
import { GrowthSignalDecision } from '../bets/growthBet.types';

interface GrowthFeedDrawerProps {
  event: GrowthFeedEvent;
  onClose: () => void;
  onPrimaryAction: (event: GrowthFeedEvent) => void;
  decision?: GrowthSignalDecision;
}

function formatDate(value?: string) {
  if (!value) return 'Não informado';
  try { return format(parseISO(value), "dd MMM yyyy, HH:mm", { locale: ptBR }); } catch { return value; }
}

const Fact: React.FC<{ label: string; value?: React.ReactNode }> = ({ label, value }) => value === undefined || value === null || value === '' ? null : (
  <div>
    <dt className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">{label}</dt>
    <dd className="mt-1 break-words text-sm text-slate-700">{value}</dd>
  </div>
);

export const GrowthFeedDrawer: React.FC<GrowthFeedDrawerProps> = ({ event, onClose, onPrimaryAction, decision }) => {
  const snapshot = event.summary_snapshot;
  const variant = GROWTH_FEED_CARD_REGISTRY[event.event_type];
  const evidence = Array.isArray(snapshot.evidence_refs) ? snapshot.evidence_refs : [];

  useEffect(() => {
    const closeOnEscape = (keyboardEvent: KeyboardEvent) => {
      if (keyboardEvent.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex justify-end bg-slate-950/45 backdrop-blur-sm" onClick={onClose}>
      <aside role="dialog" aria-modal="true" aria-label="Procedência do evento" className="flex h-full w-full max-w-2xl flex-col bg-white shadow-2xl" onClick={(clickEvent) => clickEvent.stopPropagation()}>
        <header className="border-b border-slate-200 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${variant.iconBackground}`}><FeedEventIcon eventType={event.event_type} size={20} /></span>
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500">
                  <span>{variant.label}</span><span>·</span><span>{FRONT_LABELS[event.front]}</span>
                </div>
                <h2 className="mt-1 text-xl font-black leading-snug text-slate-900">{snapshot.title || 'Evento sistêmico'}</h2>
              </div>
            </div>
            <button type="button" onClick={onClose} aria-label="Fechar" className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"><X size={20} /></button>
          </div>
        </header>

        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
          <section>
            <h3 className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Leitura operacional</h3>
            <div className="mt-3 space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
              {snapshot.summary && <p>{snapshot.summary}</p>}
              {snapshot.impact && <p><strong>Impacto:</strong> {snapshot.impact}</p>}
              {snapshot.probable_cause && <p><strong>Causa provável:</strong> {snapshot.probable_cause}</p>}
              {snapshot.reading_limit && <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900"><strong>Limite:</strong> {snapshot.reading_limit}</p>}
              {snapshot.action_text && <p><strong>Ação recomendada:</strong> {snapshot.action_text}</p>}
            </div>
          </section>

          <section>
            <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-slate-500"><Database size={15} /> Evidências</h3>
            {evidence.length > 0 ? (
              <div className="mt-3 divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200">
                {evidence.map((ref, index) => (
                  <div key={`${ref.view || 'view'}:${ref.field || index}`} className="grid gap-1 px-4 py-3 sm:grid-cols-[1fr_1fr]">
                    <Fact label="View" value={ref.view || snapshot.source_view} />
                    <Fact label="Campo" value={ref.field || 'Registro completo'} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                Este evento registra um bloqueio ou estado de pipeline; a procedência técnica está identificada abaixo, mas não há referência campo a campo.
              </div>
            )}
          </section>

          <section>
            <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-slate-500"><ShieldCheck size={15} /> Contrato e procedência</h3>
            <dl className="mt-3 grid gap-x-5 gap-y-4 rounded-2xl border border-slate-200 p-4 sm:grid-cols-2">
              <Fact label="Ocorrido em" value={formatDate(event.occurred_at)} />
              <Fact label="Prioridade" value={`${Number(event.priority_score).toFixed(0)} · ${snapshot.priority_reason || 'regra governada'}`} />
              <Fact label="Confiança" value={event.confidence_status || 'não classificada'} />
              <Fact label="Estado" value={event.event_state || 'não classificado'} />
              <Fact label="Fonte" value={snapshot.source_view || event.relevance_dimensions.source_view || event.subject_type} />
              <Fact label="Produtor" value={snapshot.generated_by || 'pipeline Report Live'} />
              <Fact label="Entidade" value={snapshot.entity_key || event.subject_id} />
              <Fact label="Código do sinal" value={snapshot.signal_code} />
              <Fact label="Período de evidência" value={snapshot.period_start && snapshot.period_end ? `${snapshot.period_start} a ${snapshot.period_end}` : undefined} />
              <Fact label="Métrica de sucesso" value={snapshot.success_metric} />
              <Fact label="Decisão do sinal" value={decision ? `${decision.decision_type}${decision.reason ? ` · ${decision.reason}` : ''}` : undefined} />
              <Fact label="Run ID" value={snapshot.run_id || event.relevance_dimensions.run_id} />
              <Fact label="Evento ID" value={event.id} />
            </dl>
          </section>

          <section className="rounded-2xl bg-slate-950 p-4 text-slate-200">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-cyan-300"><Fingerprint size={15} /> Rastreabilidade</div>
            <p className="mt-2 break-all font-mono text-[11px] leading-5 text-slate-400">{event.dedupe_key}</p>
          </section>
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white px-6 py-4">
          <span className="inline-flex items-center gap-2 text-xs text-slate-500"><CalendarDays size={14} /> Snapshot imutável do momento do evento</span>
          <button type="button" onClick={() => decision?.decision_type === 'rejected' ? onClose() : onPrimaryAction(event)} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800">
            {event.event_type === 'recommendation_created'
              ? decision?.decision_type === 'rejected' ? 'Concluir leitura' : decision?.bet_id ? 'Abrir aposta' : 'Assumir aposta'
              : snapshot.primary_action?.label || 'Concluir leitura'}
            {(snapshot.primary_action?.kind === 'open_report_live' || snapshot.primary_action?.kind === 'open_bet' || Boolean(decision?.bet_id)) && <ExternalLink size={14} />}
          </button>
        </footer>
      </aside>
    </div>
  );
};
