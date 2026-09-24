import React, { useEffect, useState } from 'react';
import { Activity, Brain, CalendarDays, CircleGauge, Inbox, ListChecks, Presentation, Sparkles, type LucideIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ReportLiveCard } from '../relatorio/ReportLiveCard';
import { GROWTH_LEARNING_SECTIONS, GrowthLearningSection, openGrowthLearningSection, readGrowthLearningSection } from './growthLearningNavigation';
import { GrowthFeedView } from './feed/GrowthFeedView';
import { GrowthBetsView } from './bets/GrowthBetsView';
import { GrowthOutcomesView } from './outcomes/GrowthOutcomesView';
import { GrowthMemoryView } from './memory/GrowthMemoryView';

interface GrowthLearningWorkspaceProps {
  periodStart: Date;
  periodEnd: Date;
}

const SECTION_META: Record<GrowthLearningSection, {
  label: string;
  icon: LucideIcon;
}> = {
  feed: { label: 'Fila', icon: Inbox },
  'report-live': { label: 'Report Live', icon: Presentation },
  bets: { label: 'Apostas', icon: ListChecks },
  outcomes: { label: 'Outcomes', icon: CircleGauge },
  memory: { label: 'Memória', icon: Brain },
};

const SECTIONS = GROWTH_LEARNING_SECTIONS.map((id) => ({ id, ...SECTION_META[id] }));

export const GrowthLearningWorkspace: React.FC<GrowthLearningWorkspaceProps> = ({ periodStart, periodEnd }) => {
  const [section, setSection] = useState<GrowthLearningSection>(() => readGrowthLearningSection(window.location.search));
  const [feedCount, setFeedCount] = useState(0);
  const [betCount, setBetCount] = useState(0);
  const [outcomeCount, setOutcomeCount] = useState(0);
  const [memoryCount, setMemoryCount] = useState(0);

  useEffect(() => {
    const syncSection = () => setSection(readGrowthLearningSection(window.location.search));
    window.addEventListener('popstate', syncSection);
    return () => window.removeEventListener('popstate', syncSection);
  }, []);

  const selectSection = (next: GrowthLearningSection) => {
    setSection(next);
    openGrowthLearningSection(next);
  };

  const sectionCount = (id: GrowthLearningSection) => {
    if (id === 'feed') return feedCount;
    if (id === 'bets') return betCount;
    if (id === 'outcomes') return outcomeCount;
    if (id === 'memory') return memoryCount;
    return 0;
  };

  const periodLabel = `${format(periodStart, 'dd MMM', { locale: ptBR })} — ${format(periodEnd, 'dd MMM yyyy', { locale: ptBR })}`;

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-slate-50/70 px-3 py-4 sm:px-5">
      <div className="mx-auto max-w-[1680px] space-y-4">
        <header className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-4 px-5 py-4 lg:grid-cols-[minmax(0,1fr)_auto_auto_auto] lg:items-center lg:px-6">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.16em] text-cyan-700">
                <Sparkles size={14} /> Loop de aprendizado Growth
              </div>
              <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950">Aprendizado Growth</h1>
              <p className="mt-1 max-w-2xl text-sm text-slate-500">Decida o que agir, acompanhe compromissos e feche o ciclo com evidência.</p>
            </div>
            <div className="flex items-center gap-3 border-slate-200 lg:border-l lg:pl-5">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-cyan-50 text-cyan-700"><CalendarDays size={17} /></span>
              <div><span className="block text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">Período ativo</span><strong className="text-sm text-slate-800">{periodLabel}</strong></div>
            </div>
            <div className="flex items-center gap-3 border-slate-200 lg:border-l lg:pl-5">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100 text-slate-600"><Inbox size={17} /></span>
              <div><span className="block text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">Fila sistêmica</span><strong className="text-sm text-slate-800">{feedCount} sinais no recorte</strong></div>
            </div>
            <div className="flex items-center gap-3 border-slate-200 lg:border-l lg:pl-5">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><Activity size={17} /></span>
              <div><span className="block text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">Ciclo operacional</span><strong className="text-sm text-slate-800">{betCount} apostas · {outcomeCount} revisões</strong></div>
            </div>
          </div>
          <nav className="flex gap-1 overflow-x-auto border-t border-slate-200 px-3 pt-1 sm:px-5" aria-label="Áreas de Aprendizado Growth">
            {SECTIONS.map(({ id, label, icon: Icon }) => (
              <button key={id} type="button" onClick={() => selectSection(id)} aria-current={section === id ? 'page' : undefined} className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition-colors ${section === id ? 'border-cyan-500 text-slate-950' : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-900'}`}>
                <Icon size={15} /> {label}
                {sectionCount(id) > 0 && <span className={`rounded-full px-2 py-0.5 text-[10px] ${section === id ? 'bg-cyan-100 text-cyan-800' : 'bg-slate-100 text-slate-600'}`}>{sectionCount(id)}</span>}
              </button>
            ))}
          </nav>
        </header>

        {section === 'feed' ? (
          <GrowthFeedView periodStart={periodStart} periodEnd={periodEnd} onCountChange={setFeedCount} />
        ) : section === 'bets' ? (
          <GrowthBetsView onCountChange={setBetCount} />
        ) : section === 'outcomes' ? (
          <GrowthOutcomesView onCountChange={setOutcomeCount} />
        ) : section === 'memory' ? (
          <GrowthMemoryView onCountChange={setMemoryCount} />
        ) : section === 'report-live' ? (
          <section className="space-y-4">
            <div className="flex flex-col gap-3 border-b border-slate-200 px-1 pb-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-cyan-700">Publicação assíncrona</p>
                <h2 className="mt-1 text-xl font-bold text-slate-900">Report Live</h2>
                <p className="mt-1 text-sm text-slate-500">Acompanhe a versão oficial, a próxima atualização e qualquer bloqueio sem perder a publicação vigente.</p>
              </div>
              <div className="rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs font-semibold text-cyan-900">Atualização programada · segunda, quarta e sexta</div>
            </div>
            <ReportLiveCard periodStart={periodStart} periodEnd={periodEnd} variant="operations" />
          </section>
        ) : null}
      </div>
    </div>
  );
};
