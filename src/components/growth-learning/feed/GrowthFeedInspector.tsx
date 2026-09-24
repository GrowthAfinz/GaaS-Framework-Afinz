import React from 'react';
import { Activity, Database, ExternalLink, Search, ShieldCheck } from 'lucide-react';
import { formatDistanceToNowStrict, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { GrowthSignalDecision } from '../bets/growthBet.types';
import { GrowthFeedEvent } from './growthFeed.types';
import { FRONT_LABELS, GROWTH_FEED_CARD_REGISTRY } from './growthFeedRegistry';

interface GrowthFeedInspectorProps {
  event: GrowthFeedEvent | null;
  decision?: GrowthSignalDecision;
  occurrences?: number;
  onPrimaryAction: (event: GrowthFeedEvent) => void;
  onOpenProvenance: (event: GrowthFeedEvent) => void;
}

function relativeDate(value: string) {
  try { return formatDistanceToNowStrict(parseISO(value), { addSuffix: true, locale: ptBR }); }
  catch { return value; }
}

function confidenceLabel(value: string | null) {
  return ({ confirmed: 'Confirmada', directional: 'Direcional', suspect: 'Sob suspeita', blocked: 'Bloqueada' } as Record<string, string>)[value || ''] || 'Não classificada';
}

export const GrowthFeedInspector: React.FC<GrowthFeedInspectorProps> = ({ event, decision, occurrences = 1, onPrimaryAction, onOpenProvenance }) => {
  if (!event) {
    return (
      <aside className="grid min-h-[420px] place-items-center border border-dashed border-slate-300 bg-white px-8 text-center lg:sticky lg:top-4">
        <div><Search size={24} className="mx-auto text-slate-300" /><h3 className="mt-3 text-sm font-black text-slate-800">Selecione um sinal</h3><p className="mt-1 text-xs leading-5 text-slate-500">O contexto, a evidência e a ação aparecem aqui sem tirar você da fila.</p></div>
      </aside>
    );
  }

  const snapshot = event.summary_snapshot;
  const variant = GROWTH_FEED_CARD_REGISTRY[event.event_type];
  const evidence = Array.isArray(snapshot.evidence_refs) ? snapshot.evidence_refs : [];
  const actionLabel = event.event_type === 'recommendation_created'
    ? decision?.decision_type === 'rejected' ? 'Ver decisão registrada' : decision?.bet_id ? 'Abrir aposta' : 'Assumir aposta'
    : snapshot.primary_action?.label || 'Abrir evidências';

  const chain = [
    { label: 'Sinal', value: snapshot.summary || snapshot.title },
    { label: 'Impacto', value: snapshot.impact || 'Impacto ainda não classificado.' },
    { label: 'Causa provável', value: snapshot.probable_cause || snapshot.priority_reason || 'Exige investigação antes de concluir.' },
    { label: 'Evidência', value: evidence.length > 0 ? `${evidence.length} ${evidence.length === 1 ? 'referência governada' : 'referências governadas'}` : snapshot.source_view || 'Procedência técnica disponível.' },
    { label: 'Ação', value: snapshot.action_text || actionLabel },
    { label: 'Confiança', value: confidenceLabel(event.confidence_status) },
  ];

  return (
    <aside className="overflow-hidden border border-slate-200 bg-white shadow-sm lg:sticky lg:top-4 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
      <div className="border-b border-slate-200 px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.08em] ${variant.badge}`}>{variant.label}</span>
            <span className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">{FRONT_LABELS[event.front]}</span>
          </div>
          <span className="text-[11px] font-semibold text-slate-400">{relativeDate(event.occurred_at)}</span>
        </div>
        <div className="mt-3 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-black leading-snug text-slate-950">{snapshot.title || 'Evento sistêmico'}</h2>
            <p className="mt-1 text-sm leading-5 text-slate-500">{snapshot.priority_reason || 'Evento material produzido por uma regra governada.'}</p>
          </div>
          <div className="shrink-0 rounded-xl bg-rose-50 px-3 py-2 text-center text-rose-700"><span className="block text-[9px] font-black uppercase">Prioridade</span><strong className="text-lg">{Number(event.priority_score).toFixed(0)}</strong></div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={() => onPrimaryAction(event)} className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800">{actionLabel}<ExternalLink size={13} /></button>
          <button type="button" onClick={() => onOpenProvenance(event)} className="rounded-lg border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50">Ver procedência</button>
        </div>
      </div>

      <div className="px-5 py-4">
        <div className="grid gap-0">
          {chain.map((item, index) => (
            <div key={item.label} className="grid grid-cols-[28px_108px_minmax(0,1fr)] gap-2 border-b border-slate-100 py-3 last:border-0">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-cyan-700 text-[10px] font-black text-white">{index + 1}</span>
              <strong className="pt-0.5 text-xs text-slate-700">{item.label}</strong>
              <p className="text-xs leading-5 text-slate-600">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {snapshot.reading_limit && <div className="mx-5 mb-4 border-l-2 border-amber-400 bg-amber-50 px-3 py-2.5 text-xs leading-5 text-amber-900"><strong>Limite da leitura:</strong> {snapshot.reading_limit}</div>}

      <div className="grid grid-cols-3 border-t border-slate-200 bg-slate-50">
        <div className="px-4 py-3"><span className="flex items-center gap-1 text-[9px] font-black uppercase text-slate-400"><ShieldCheck size={11} /> Confiança</span><strong className="mt-1 block text-xs text-slate-700">{confidenceLabel(event.confidence_status)}</strong></div>
        <div className="border-x border-slate-200 px-4 py-3"><span className="flex items-center gap-1 text-[9px] font-black uppercase text-slate-400"><Database size={11} /> Fonte</span><strong className="mt-1 block truncate text-xs text-slate-700">{snapshot.source_view || event.subject_type}</strong></div>
        <div className="px-4 py-3"><span className="flex items-center gap-1 text-[9px] font-black uppercase text-slate-400"><Activity size={11} /> Ocorrências</span><strong className="mt-1 block text-xs text-slate-700">{occurrences}</strong></div>
      </div>
    </aside>
  );
};
