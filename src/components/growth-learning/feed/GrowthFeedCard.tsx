import React from 'react';
import { ChevronDown, ChevronUp, ExternalLink, History, ShieldCheck } from 'lucide-react';
import { formatDistanceToNowStrict, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { GrowthFeedEvent, GrowthFeedGroup } from './growthFeed.types';
import { GrowthSignalDecision } from '../bets/growthBet.types';
import { FeedEventIcon, FRONT_LABELS, GROWTH_FEED_CARD_REGISTRY } from './growthFeedRegistry';

interface GrowthFeedCardProps {
  group: GrowthFeedGroup;
  expanded: boolean;
  selected?: boolean;
  onSelect?: () => void;
  onToggleGroup: () => void;
  onOpen: (event: GrowthFeedEvent) => void;
  onPrimaryAction: (event: GrowthFeedEvent) => void;
  decision?: GrowthSignalDecision;
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

export const GrowthFeedCard: React.FC<GrowthFeedCardProps> = ({ group, expanded, selected = false, onSelect, onToggleGroup, onOpen, onPrimaryAction, decision }) => {
  const event = group.representative;
  const snapshot = event.summary_snapshot;
  const variant = GROWTH_FEED_CARD_REGISTRY[event.event_type];
  const total = group.events.length;
  const actionLabel = event.event_type === 'recommendation_created'
    ? decision?.decision_type === 'rejected'
      ? 'Ver decisão registrada'
      : decision?.bet_id
        ? 'Abrir aposta'
        : 'Assumir aposta'
    : snapshot.primary_action?.label || 'Abrir evidências';
  return (
    <article className={`overflow-hidden border-b border-slate-100 border-l-4 bg-white transition ${variant.accent} ${selected ? 'bg-cyan-50/70 ring-1 ring-inset ring-cyan-200' : 'hover:bg-slate-50/80'}`}>
      <button type="button" onClick={onSelect} className="grid w-full gap-3 px-4 py-4 text-left md:grid-cols-[minmax(0,1.7fr)_minmax(150px,.9fr)_110px_92px] md:items-center">
        <div className="flex min-w-0 items-start gap-3">
          <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${variant.iconBackground}`}><FeedEventIcon eventType={event.event_type} size={17} /></span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className={`rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.08em] ${variant.badge}`}>{variant.label}</span>
              <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">{FRONT_LABELS[event.front]}</span>
            </div>
            <h3 className="mt-1.5 text-sm font-black leading-snug text-slate-900">{snapshot.title || 'Evento sistêmico'}</h3>
            {snapshot.summary && <p className="mt-1 line-clamp-1 text-xs text-slate-500">{snapshot.summary}</p>}
          </div>
        </div>
        <div className="min-w-0">
          <span className="text-[9px] font-black uppercase tracking-[0.1em] text-slate-400">Impacto</span>
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600">{snapshot.impact || snapshot.priority_reason || 'Evento material para revisão.'}</p>
        </div>
        <div>
          <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-[0.1em] text-slate-400"><ShieldCheck size={11} /> Confiança</span>
          <strong className="mt-1 block text-xs text-slate-700">{confidenceLabel(event.confidence_status)}</strong>
        </div>
        <div className="md:text-right">
          <strong className="block text-xs text-slate-700">{eventDate(event.occurred_at)}</strong>
          <span className="mt-1 block text-[10px] font-bold text-slate-400">Prioridade {Number(event.priority_score).toFixed(0)}</span>
        </div>
      </button>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-4 py-2.5">
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => onPrimaryAction(event)} className="rounded-lg bg-slate-950 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-slate-800">{actionLabel}</button>
          <button type="button" onClick={() => onOpen(event)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-slate-50">Ver procedência</button>
        </div>
        {total > 1 && (
          <button type="button" onClick={onToggleGroup} aria-expanded={expanded} className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] font-bold text-slate-500 hover:bg-slate-50">
            <History size={13} /> {total} ocorrências {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        )}
      </div>
      {expanded && group.events.slice(1).map((member) => <MiniEvent key={member.id} event={member} onOpen={() => onOpen(member)} />)}
    </article>
  );
};
