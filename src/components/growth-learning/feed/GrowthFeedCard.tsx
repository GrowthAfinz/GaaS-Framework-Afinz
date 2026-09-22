import React from 'react';
import { ChevronDown, ChevronUp, ExternalLink, History, ShieldCheck } from 'lucide-react';
import { formatDistanceToNowStrict, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { GrowthFeedEvent, GrowthFeedGroup } from './growthFeed.types';
import { FeedEventIcon, FRONT_LABELS, GROWTH_FEED_CARD_REGISTRY } from './growthFeedRegistry';

interface GrowthFeedCardProps {
  group: GrowthFeedGroup;
  expanded: boolean;
  onToggleGroup: () => void;
  onOpen: (event: GrowthFeedEvent) => void;
  onPrimaryAction: (event: GrowthFeedEvent) => void;
}

function confidenceLabel(value: string | null) {
  return ({ confirmed: 'Confirmada', directional: 'Direcional', suspect: 'Sob suspeita', blocked: 'Bloqueada' } as Record<string, string>)[value || ''] || 'Não classificada';
}

function eventDate(value: string) {
  try {
    return formatDistanceToNowStrict(parseISO(value), { addSuffix: true, locale: ptBR });
  } catch {
    return value;
  }
}

const MiniEvent: React.FC<{ event: GrowthFeedEvent; onOpen: () => void }> = ({ event, onOpen }) => (
  <button type="button" onClick={onOpen} className="flex w-full items-start justify-between gap-4 border-t border-slate-100 px-5 py-3 text-left hover:bg-slate-50">
    <span>
      <span className="block text-sm font-semibold text-slate-800">{event.summary_snapshot.title || 'Atualização sistêmica'}</span>
      <span className="mt-1 block text-xs text-slate-500">{eventDate(event.occurred_at)} · score {Number(event.priority_score).toFixed(0)}</span>
    </span>
    <ExternalLink size={14} className="mt-1 shrink-0 text-slate-400" />
  </button>
);

export const GrowthFeedCard: React.FC<GrowthFeedCardProps> = ({ group, expanded, onToggleGroup, onOpen, onPrimaryAction }) => {
  const event = group.representative;
  const snapshot = event.summary_snapshot;
  const variant = GROWTH_FEED_CARD_REGISTRY[event.event_type];
  const total = group.events.length;
  return (
    <article className={`overflow-hidden rounded-2xl border border-slate-200 border-l-4 bg-white shadow-sm transition hover:shadow-md ${variant.accent}`}>
      <div className="p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${variant.iconBackground}`}><FeedEventIcon eventType={event.event_type} /></span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.1em] ${variant.badge}`}>{variant.label}</span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-600">{FRONT_LABELS[event.front]}</span>
                <span className="inline-flex items-center gap-1 text-xs text-slate-500"><ShieldCheck size={13} /> {confidenceLabel(event.confidence_status)}</span>
              </div>
              <h3 className="mt-3 text-lg font-black leading-snug text-slate-900">{snapshot.title || 'Evento sistêmico'}</h3>
            </div>
          </div>
          <div className="shrink-0 text-left sm:text-right">
            <span className="block text-xs font-semibold text-slate-500">{eventDate(event.occurred_at)}</span>
            <span className="mt-1 block text-[11px] text-slate-400">Prioridade {Number(event.priority_score).toFixed(0)}</span>
          </div>
        </div>

        {snapshot.summary && <p className="mt-4 text-sm leading-6 text-slate-700">{snapshot.summary}</p>}
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {snapshot.impact && (
            <div className="rounded-xl bg-slate-50 px-4 py-3">
              <span className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">Impacto</span>
              <p className="mt-1 text-sm leading-5 text-slate-700">{snapshot.impact}</p>
            </div>
          )}
          <div className="rounded-xl bg-slate-50 px-4 py-3">
            <span className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">Por que está aqui</span>
            <p className="mt-1 text-sm leading-5 text-slate-700">{snapshot.priority_reason || 'Evento material produzido por uma regra governada.'}</p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => onPrimaryAction(event)} className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800">
              {snapshot.primary_action?.label || 'Abrir evidências'}
            </button>
            {snapshot.primary_action?.kind === 'open_report_live' && (
              <button type="button" onClick={() => onOpen(event)} className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">Ver procedência</button>
            )}
          </div>
          {total > 1 && (
            <button type="button" onClick={onToggleGroup} aria-expanded={expanded} className="inline-flex items-center gap-2 rounded-lg px-2 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50">
              <History size={14} /> {total} ocorrências {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          )}
        </div>
      </div>
      {expanded && group.events.slice(1).map((member) => <MiniEvent key={member.id} event={member} onOpen={() => onOpen(member)} />)}
    </article>
  );
};
