import React, { useEffect, useState } from 'react';
import { Brain, CircleGauge, Inbox, ListChecks, Presentation, Sparkles, type LucideIcon } from 'lucide-react';
import { ReportLiveCard } from '../relatorio/ReportLiveCard';
import { GrowthLearningSection, openGrowthLearningSection, readGrowthLearningSection } from './growthLearningNavigation';
import { GrowthFeedView } from './feed/GrowthFeedView';
import { GrowthBetsView } from './bets/GrowthBetsView';
import { GrowthOutcomesView } from './outcomes/GrowthOutcomesView';
import { GrowthMemoryView } from './memory/GrowthMemoryView';

interface GrowthLearningWorkspaceProps {
  periodStart: Date;
  periodEnd: Date;
}

const SECTIONS: Array<{
  id: GrowthLearningSection;
  label: string;
  icon: LucideIcon;
}> = [
  { id: 'feed', label: 'Fila', icon: Inbox },
  { id: 'bets', label: 'Apostas', icon: ListChecks },
  { id: 'outcomes', label: 'Outcomes', icon: CircleGauge },
  { id: 'memory', label: 'Memória', icon: Brain },
  { id: 'report-live', label: 'Report Live', icon: Presentation },
];

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

  return (
    <div className="min-h-[calc(100vh-5rem)] px-4 py-5 sm:px-6">
      <div className="mx-auto max-w-[1500px] space-y-5">
        <header className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 text-white shadow-lg">
          <div className="flex flex-col gap-6 px-6 py-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">
                <Sparkles size={14} /> Loop de aprendizado Growth
              </div>
              <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Aprendizado Growth</h1>
              <p className="mt-2 text-sm leading-6 text-slate-300">O espaço operacional para transformar sinais em apostas, verificar outcomes e preservar memória. O Report Live continua sendo a visualização editorial do ciclo.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-slate-300 backdrop-blur">
              <span className="block font-bold text-white">Release 7A · contexto analítico</span>
              Leituras de relatórios e funis podem virar apostas com origem, memória e verificação preservadas.
            </div>
          </div>
          <nav className="flex gap-1 overflow-x-auto border-t border-white/10 px-4 pt-2 sm:px-6" aria-label="Áreas de Aprendizado Growth">
            {SECTIONS.map(({ id, label, icon: Icon }) => (
              <button key={id} type="button" onClick={() => selectSection(id)} aria-current={section === id ? 'page' : undefined} className={`inline-flex shrink-0 items-center gap-2 rounded-t-xl border-b-2 px-4 py-3 text-sm font-bold transition-colors ${section === id ? 'border-cyan-400 bg-white/10 text-white' : 'border-transparent text-slate-400 hover:bg-white/5 hover:text-white'}`}>
                <Icon size={15} /> {label}
                {id === 'feed' && feedCount > 0 && <span className="rounded-full bg-cyan-400/20 px-2 py-0.5 text-[10px] text-cyan-100">{feedCount}</span>}
                {id === 'bets' && betCount > 0 && <span className="rounded-full bg-cyan-400/20 px-2 py-0.5 text-[10px] text-cyan-100">{betCount}</span>}
                {id === 'outcomes' && outcomeCount > 0 && <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] text-amber-100">{outcomeCount}</span>}
                {id === 'memory' && memoryCount > 0 && <span className="rounded-full bg-violet-400/20 px-2 py-0.5 text-[10px] text-violet-100">{memoryCount}</span>}
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
            <div className="flex flex-col gap-2 px-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-700">Operação editorial</p>
                <h2 className="mt-1 text-xl font-bold text-slate-900">Report Live</h2>
                <p className="mt-1 text-sm text-slate-500">Gerar, certificar, publicar e consultar o estado operacional no mesmo lugar.</p>
              </div>
              <p className="text-xs text-slate-400">A navegação não inicia builds nem publicações.</p>
            </div>
            <ReportLiveCard periodStart={periodStart} periodEnd={periodEnd} variant="operations" />
          </section>
        ) : null}
      </div>
    </div>
  );
};
