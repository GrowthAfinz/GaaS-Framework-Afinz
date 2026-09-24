import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, ArrowRight, CalendarClock, Loader2, RefreshCw, Target } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAppStore } from '../../../store/useAppStore';
import { GrowthBetSourceContext, openGrowthLearningSectionItem } from '../growthLearningNavigation';
import { fetchRelatedGrowthBets } from './growthBetService';
import { GrowthBetStatus } from './growthBet.types';
import {
  classifyGrowthBetRelation,
  GrowthBetSourceLink,
  nextGrowthBetVerification,
} from './relatedGrowthBets.logic';

interface RelatedGrowthBetsProps {
  context: GrowthBetSourceContext;
}

const STATUS_LABELS: Record<GrowthBetStatus, string> = {
  approved: 'Aprovada', in_progress: 'Em execução', waiting_window: 'Aguardando janela',
  ready_for_review: 'Pronta para revisão', closed: 'Encerrada', cancelled: 'Cancelada', not_verifiable: 'Não verificável',
};

const ACTIVE_STATUSES = new Set<GrowthBetStatus>(['approved', 'in_progress', 'waiting_window', 'ready_for_review']);

function formatDate(value: string): string {
  try { return format(parseISO(value), 'dd MMM', { locale: ptBR }); } catch { return value; }
}

function verificationLabel(link: GrowthBetSourceLink): string {
  const next = nextGrowthBetVerification(link.status, link.outcome_window_start, link.outcome_window_end);
  if (next.kind === 'now') return 'Revisar agora';
  if (next.kind === 'closed') return 'Ciclo encerrado';
  if (next.kind === 'starts') return `Janela inicia ${formatDate(next.date!)}`;
  if (next.kind === 'due') return `Verificar até ${formatDate(next.date!)}`;
  return `Revisão vencida em ${formatDate(next.date!)}`;
}

export const RelatedGrowthBets: React.FC<RelatedGrowthBetsProps> = ({ context }) => {
  const [links, setLinks] = useState<GrowthBetSourceLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const setTab = useAppStore((state) => state.setTab);
  const contextKey = JSON.stringify(context);

  const load = async () => {
    setLoading(true);
    setError(null);
    try { setLinks(await fetchRelatedGrowthBets(context)); }
    catch (loadError) { setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar as apostas relacionadas.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, [contextKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const related = useMemo(() => links
    .map((link) => ({ link, relation: classifyGrowthBetRelation(link, context) }))
    .filter((item): item is { link: GrowthBetSourceLink; relation: 'exact_context' | 'same_source' } => item.relation !== null)
    .sort((left, right) => Number(ACTIVE_STATUSES.has(right.link.status)) - Number(ACTIVE_STATUSES.has(left.link.status)))
    .slice(0, 4), [context, links]);

  const openBet = (betId: string) => {
    openGrowthLearningSectionItem('bets', betId);
    setTab('aprendizado-growth');
  };

  return (
    <section aria-label="Apostas relacionadas" className="border-b border-slate-200 bg-white px-6 py-3">
      <div className="mx-auto flex max-w-[1780px] flex-col gap-3 xl:flex-row xl:items-center">
        <div className="flex min-w-52 items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-cyan-50 text-cyan-700"><Target size={16} /></span>
          <div><h2 className="text-xs font-black uppercase tracking-[0.12em] text-slate-700">Apostas desta origem</h2><p className="text-[11px] text-slate-400">Estado e próxima verificação</p></div>
        </div>

        {loading ? <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500"><Loader2 size={14} className="animate-spin" /> Lendo vínculos…</span>
          : error ? <div className="flex items-center gap-2 text-xs text-rose-700"><AlertCircle size={14} /><span>Falha ao ler vínculos.</span><button type="button" onClick={() => void load()} className="inline-flex items-center gap-1 font-bold underline"><RefreshCw size={12} /> Tentar novamente</button></div>
            : related.length === 0 ? <p className="text-xs text-slate-500">Nenhuma aposta ligada a esta leitura ainda.</p>
              : <div className="grid min-w-0 flex-1 gap-2 md:grid-cols-2 xl:grid-cols-4">{related.map(({ link, relation }) => (
                <button key={link.bet_id} type="button" onClick={() => openBet(link.bet_id)} className="group min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-left transition hover:border-cyan-300 hover:bg-cyan-50">
                  <div className="flex items-center justify-between gap-2"><span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.08em] ${ACTIVE_STATUSES.has(link.status) ? 'bg-cyan-100 text-cyan-800' : 'bg-slate-200 text-slate-600'}`}>{STATUS_LABELS[link.status]}</span><span className="text-[9px] font-bold text-slate-400">{relation === 'exact_context' ? 'mesma leitura' : 'mesma origem'}</span></div>
                  <p className="mt-1.5 truncate text-xs font-bold text-slate-800">{link.hypothesis}</p>
                  <div className="mt-1 flex items-center justify-between gap-2 text-[10px] text-slate-500"><span className="truncate">{link.metric_name} · {link.expected_value}{link.expected_unit ? ` ${link.expected_unit}` : ''}</span><ArrowRight size={12} className="shrink-0 transition group-hover:translate-x-0.5" /></div>
                  <p className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-cyan-800"><CalendarClock size={11} /> {verificationLabel(link)}</p>
                </button>
              ))}</div>}
      </div>
    </section>
  );
};
