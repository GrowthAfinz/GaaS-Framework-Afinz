import { GrowthInvestigations } from './investigations/GrowthInvestigations';
import React, { lazy, Suspense, useEffect, useState } from "react";
import {
  BookMarked,
  CircleGauge,
  Inbox,
  Library,
  ListChecks,
  Presentation,
  type LucideIcon,
} from "lucide-react";
import { format } from "date-fns";
import { ReportLiveCard } from "../relatorio/ReportLiveCard";
import {
  GROWTH_LEARNING_SECTIONS,
  GrowthLearningSection,
  openGrowthLearningSection,
  readGrowthLearningSection,
} from "./growthLearningNavigation";
import { GrowthFeedView } from "./feed/GrowthFeedView";
import { GrowthBetsView } from "./bets/GrowthBetsView";
import { GrowthOutcomesView } from "./outcomes/GrowthOutcomesView";
import { GrowthMemoryView } from "./memory/GrowthMemoryView";
const VaultWorkspace = lazy(() =>
  import("../vault/VaultWorkspace").then((module) => ({
    default: module.VaultWorkspace,
  })),
);

interface GrowthLearningWorkspaceProps {
  periodStart: Date;
  periodEnd: Date;
}

const SECTION_META: Record<
  GrowthLearningSection,
  {
    label: string;
    icon: LucideIcon;
  }
> = {
  investigations: { label: "Testes e Tarefas", icon: ListChecks },
  feed: { label: "Fila", icon: Inbox },
  "report-live": { label: "Report Live", icon: Presentation },
  bets: { label: "Apostas", icon: ListChecks },
  outcomes: { label: "Outcomes", icon: CircleGauge },
  memory: { label: "Registros", icon: BookMarked },
  vault: { label: "Wiki", icon: Library },
};

const SECTIONS = GROWTH_LEARNING_SECTIONS.map((id) => ({
  id,
  ...SECTION_META[id],
}));

export const GrowthLearningWorkspace: React.FC<
  GrowthLearningWorkspaceProps
> = ({ periodStart: initialStart, periodEnd: initialEnd }) => {
  const readPeriod = (key: string, fallback: Date) => {
    const value = new URLSearchParams(window.location.search).get(key);
    return value &&
      /^\d{4}-\d{2}-\d{2}$/.test(value) &&
      Number.isFinite(new Date(value + "T12:00:00").getTime())
      ? new Date(value + "T12:00:00")
      : fallback;
  };
  const [periodStart, setPeriodStart] = useState(() =>
    readPeriod("learning_start", initialStart),
  );
  const [periodEnd, setPeriodEnd] = useState(() =>
    readPeriod("learning_end", initialEnd),
  );
  const setPeriod = (edge: string, value: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return;
    const date = new Date(value + "T12:00:00");
    if (!Number.isFinite(date.getTime())) return;
    const start =
      edge === "start" ? date : date < periodStart ? date : periodStart;
    const end = edge === "end" ? date : date > periodEnd ? date : periodEnd;
    setPeriodStart(start);
    setPeriodEnd(end);
    const params = new URLSearchParams(window.location.search);
    params.set("learning_start", format(start, "yyyy-MM-dd"));
    params.set("learning_end", format(end, "yyyy-MM-dd"));
    window.history.replaceState(
      {},
      "",
      window.location.pathname + "?" + params + window.location.hash,
    );
  };
  const [section, setSection] = useState<GrowthLearningSection>(() =>
    readGrowthLearningSection(window.location.search),
  );
  const [feedCount, setFeedCount] = useState<number | null>(null);
  const [betCount, setBetCount] = useState<number | null>(null);
  const [outcomeCount, setOutcomeCount] = useState<number | null>(null);
  const [memoryCount, setMemoryCount] = useState<number | null>(null);
  const [vaultCount, setVaultCount] = useState<number | null>(null);

  useEffect(() => {
    const syncSection = () =>
      setSection(readGrowthLearningSection(window.location.search));
    window.addEventListener("popstate", syncSection);
    return () => window.removeEventListener("popstate", syncSection);
  }, []);

  const selectSection = (next: GrowthLearningSection) => {
    setSection(next);
    openGrowthLearningSection(next);
  };

  const sectionCount = (id: GrowthLearningSection) => {
    if (id === "feed") return feedCount;
    if (id === "bets") return betCount;
    if (id === "outcomes") return outcomeCount;
    if (id === "memory") return memoryCount;
    if (id === "vault") return vaultCount;
    return null;
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-slate-50/70 px-3 py-4 sm:px-5">
      <div
        className="learning-workspace mx-auto max-w-[1680px] space-y-4"
        style={{ fontFamily: "Segoe UI, Arial, sans-serif" }}
      >
        <header className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <nav
            className="flex gap-1 overflow-x-auto px-3 pt-1 sm:px-5"
            aria-label="Áreas de Aquisição e Loop de Memória"
          >
            {SECTIONS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => selectSection(id)}
                aria-current={section === id ? "page" : undefined}
                className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition-colors ${section === id ? "border-cyan-500 text-slate-950" : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-900"}`}
              >
                <Icon size={15} /> {label}
                {sectionCount(id) !== null && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] ${section === id ? "bg-cyan-100 text-cyan-800" : "bg-slate-100 text-slate-600"}`}
                  >
                    {sectionCount(id)}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </header>

        {section !== "vault" && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                {SECTION_META[section].label}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {
                  {
                    feed: "Identifique o que precisa de atenção e consulte a evidência antes de agir.",
                    investigations: "Investigue mudanças, revise as evidências e registre a próxima decisão.",
                    bets: "Acompanhe hipóteses, responsáveis, execução e próximos compromissos.",
                    outcomes:
                      "Verifique resultados, registre limitações e decida o que pode ser reutilizado.",
                    memory:
                      "Consulte registros curados do vault e aprendizados validados por resultado.",
                    "report-live":
                      "Consulte a publicação vigente e acompanhe a próxima atualização.",
                  }[section]
                }
              </p>
            </div>
            {section === "feed" || section === "report-live" ? (
              <label className="text-xs text-slate-600">
                Período {section === "feed" ? "dos eventos" : "solicitado"}
                <span className="mt-1 flex items-center gap-2">
                  <input
                    aria-label="Início do período"
                    type="date"
                    value={format(periodStart, "yyyy-MM-dd")}
                    onChange={(event) => setPeriod("start", event.target.value)}
                    className="rounded-lg border border-slate-200 p-2"
                  />
                  <span>até</span>
                  <input
                    aria-label="Fim do período"
                    type="date"
                    value={format(periodEnd, "yyyy-MM-dd")}
                    onChange={(event) => setPeriod("end", event.target.value)}
                    className="rounded-lg border border-slate-200 p-2"
                  />
                </span>
              </label>
            ) : (
              <span className="text-xs text-slate-500">
                {section === "memory"
                  ? "Acervo vigente · sem recorte por mês"
                  : "Todos os períodos · filtros próprios abaixo"}
              </span>
            )}
          </div>
        )}
        {section === "investigations" ? <GrowthInvestigations initialMonth={format(periodEnd,"yyyy-MM")}/> : section === "feed" ? (
          <GrowthFeedView
            periodStart={periodStart}
            periodEnd={periodEnd}
            onCountChange={setFeedCount}
          />
        ) : section === "bets" ? (
          <GrowthBetsView onCountChange={setBetCount} />
        ) : section === "outcomes" ? (
          <GrowthOutcomesView onCountChange={setOutcomeCount} />
        ) : section === "memory" ? (
          <GrowthMemoryView onCountChange={setMemoryCount} />
        ) : section === "vault" ? (
          <Suspense
            fallback={
              <div
                role="status"
                className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500"
              >
                Carregando Wiki…
              </div>
            }
          >
            <VaultWorkspace onCountChange={setVaultCount} />
          </Suspense>
        ) : section === "report-live" ? (
          <section className="space-y-4">
            <ReportLiveCard
              periodStart={periodStart}
              periodEnd={periodEnd}
              variant="operations"
            />
          </section>
        ) : null}
      </div>
    </div>
  );
};
