import { getLocalViewport, toLocalRect } from '../../context/UIScaleContext';
import { TasksWorkspace } from './development/TasksWorkspace';
import { EstruturaCrm } from './structure/EstruturaCrm';
import { DailyWorkspace } from './daily/DailyWorkspace';
import React, { lazy, Suspense, useEffect, useState } from "react";
import {
  BookMarked,
  CalendarCheck,
  CircleGauge,
  Inbox,
  Library,
  MessageSquareWarning,
  ListChecks,
  Presentation,
  SquareKanban,
  type LucideIcon,
} from "lucide-react";
import { format } from "date-fns";
import { ReportLiveCard } from "../relatorio/ReportLiveCard";
import {
  GROWTH_LEARNING_SECTIONS,
  GrowthLearningSection,
  type GrowthWorkspace,
  workspaceOfSection,
  openGrowthLearningSection,
  readGrowthLearningSection,
} from "./growthLearningNavigation";
import { GrowthFeedView } from "./feed/GrowthFeedView";
import { GrowthBetsView } from "./bets/GrowthBetsView";
import { GrowthOutcomesView } from "./outcomes/GrowthOutcomesView";
import { GrowthMemoryView } from "./memory/GrowthMemoryView";
import { CorrectionsWorkspace } from "./corrections/CorrectionsWorkspace";
import { countOpenFeedback } from "../feedback/feedbackService";
import { onFeedbackChanged, openFeedback } from "../feedback/feedbackBus";
import { readGrowthLearningItem } from "./growthLearningNavigation";
const VaultWorkspace = lazy(() =>
  import("../vault/VaultWorkspace").then((module) => ({
    default: module.VaultWorkspace,
  })),
);

interface GrowthLearningWorkspaceProps {
  periodStart: Date;
  periodEnd: Date;
  /** Operação (Planejamento) mostra Fila, Visão Daily, Estrutura CRM e Tarefas; o Loop mostra o resto. */
  workspace?: GrowthWorkspace;
}

const SECTION_META: Record<
  GrowthLearningSection,
  {
    label: string;
    icon: LucideIcon;
  }
> = {
  investigations: { label: "Tarefas e atividades", icon: ListChecks },
  feed: { label: "Fila", icon: Inbox },
  "report-live": { label: "Report Live", icon: Presentation },
  bets: { label: "Apostas e Registros", icon: ListChecks },
  outcomes: { label: "Outcomes", icon: CircleGauge },
  memory: { label: "Registros", icon: BookMarked },
  vault: { label: "Wiki", icon: Library },
  daily: { label: "Visão Daily", icon: CalendarCheck },
  structure: { label: "Estrutura CRM", icon: SquareKanban },
  corrections: { label: "Correções e melhorias", icon: MessageSquareWarning },
};

// Outcomes e Registros entraram na página única de Apostas e Registros; os links antigos continuam caindo nela.
const SECTIONS = GROWTH_LEARNING_SECTIONS.filter((id) => id !== "outcomes" && id !== "memory").map((id) => ({
  id,
  ...SECTION_META[id],
}));
const WORKSPACE_LABEL: Record<GrowthWorkspace, string> = { operacao: "Áreas da Operação", learning: "Áreas do Loop de Memória" };

/** Apostas, Outcomes e Registros trazem o próprio cabeçalho, no desenho das Estratégias da Wiki. */
const LEDGER_SECTIONS = new Set<GrowthLearningSection>(["bets", "outcomes", "memory"]);

export const GrowthLearningWorkspace: React.FC<
  GrowthLearningWorkspaceProps
> = ({ periodStart: initialStart, periodEnd: initialEnd, workspace = "learning" }) => {
  const sections = SECTIONS.filter((item) => workspaceOfSection(item.id) === workspace);
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
    readGrowthLearningSection(window.location.search, workspace),
  );
  const [feedCount, setFeedCount] = useState<number | null>(null);
  const [betCount, setBetCount] = useState<number | null>(null);
  const [outcomeCount, setOutcomeCount] = useState<number | null>(null);
  const [memoryCount, setMemoryCount] = useState<number | null>(null);
  const [vaultCount, setVaultCount] = useState<number | null>(null);
  const [correctionsCount, setCorrectionsCount] = useState<number | null>(null);

  useEffect(() => {
    if (workspace !== "learning") return;
    const refresh = () => void countOpenFeedback().then(setCorrectionsCount).catch(() => setCorrectionsCount(null));
    refresh();
    return onFeedbackChanged(refresh);
  }, [workspace]);

  useEffect(() => {
    const syncSection = () =>
      setSection(readGrowthLearningSection(window.location.search, workspace));
    window.addEventListener("popstate", syncSection);
    return () => window.removeEventListener("popstate", syncSection);
  }, [workspace]);

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
    if (id === "corrections") return correctionsCount;
    return null;
  };

  return (
    <div className={section === "investigations" || section === "structure" || section === "daily" || LEDGER_SECTIONS.has(section) ? "min-h-[calc(100vh-5rem)] bg-white pb-0" : "min-h-[calc(100vh-5rem)] bg-slate-50/70 px-3 pb-4 sm:px-5"}>
      <div
        className={"learning-workspace mx-auto "+(section === "structure" || section === "daily" ? "max-w-none space-y-0" : section === "investigations" || LEDGER_SECTIONS.has(section) ? "max-w-[1800px] space-y-0" : "max-w-[1800px] space-y-4")}
      >
        {/* Submenu colado no topo e na barra logo abaixo, separados só por uma linha */}
        <header className="overflow-hidden border-x border-b border-slate-200 bg-white">
          <nav
            className="flex gap-1 overflow-x-auto px-3 sm:px-5"
            aria-label={WORKSPACE_LABEL[workspace]}
          >
            {sections.map(({ id, label, icon: Icon }) => (
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

        {!LEDGER_SECTIONS.has(section) && section !== "vault" && section !== "investigations" && section !== "structure" && section !== "daily" && section !== "corrections" && (
          <div className="!mt-0 flex flex-wrap items-center justify-between gap-3 rounded-b-xl border border-t-0 border-slate-200 bg-white px-4 py-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                {SECTION_META[section].label}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {
                  {
                    feed: "Identifique o que precisa de atenção e consulte a evidência antes de agir.",
                    investigations: "Planeje o desenvolvimento do GaaS e acompanhe investigações, entregas e próximas decisões.",
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
            <div className="flex flex-wrap items-end gap-3">
            <button
              type="button"
              onClick={() => {
                const label = SECTION_META[section].label;
                const item = readGrowthLearningItem(window.location.search);
                const types = { feed: "feed_item", "report-live": "report_live", bets: "bet", outcomes: "outcome", memory: "memory" } as const;
                openFeedback({ surface: section, pageLabel: label, locationLabel: item ? `${label} › item aberto` : label, targetType: item ? types[section as keyof typeof types] : "page", targetId: item || undefined });
              }}
              className="rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs font-semibold text-cyan-800 hover:bg-cyan-100"
            >
              Correção para IA
            </button>
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
          </div>
        )}
        {section === "investigations" ? <NotionPane initialMonth={format(periodEnd,"yyyy-MM")} /> : section === "structure" ? <EstruturaCrm /> : section === "daily" ? <DailyWorkspace /> : section === "feed" ? (
          <GrowthFeedView
            periodStart={periodStart}
            periodEnd={periodEnd}
            onCountChange={setFeedCount}
          />
        ) : LEDGER_SECTIONS.has(section) ? (
          <LedgerPane section={section as "bets" | "outcomes" | "memory"} onCount={setBetCount} legacy={{ setOutcomeCount, setMemoryCount }} />
        ) : section === "vault" ? (
          <div className="!mt-0">
            <Suspense
              fallback={
                <div
                  role="status"
                  className="rounded-b-xl border border-t-0 border-slate-200 bg-white p-6 text-sm text-slate-500"
                >
                  Carregando Wiki…
                </div>
              }
            >
              <VaultWorkspace onCountChange={setVaultCount} />
            </Suspense>
          </div>
        ) : section === "corrections" ? (
          <CorrectionsWorkspace onCountChange={setCorrectionsCount} />
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

/* Tarefas e atividades: módulo estilo Notion, carregado sob demanda e ocupando a altura livre da tela. */
const NotionModule = lazy(() => import("../../modules/notion/NotionModule").then((m) => ({ default: m.NotionModule })));
function NotionPane({ initialMonth }: { initialMonth: string }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(640);
  // Investigações CRM continuam na tela antiga (links com ?item= ou ?task_view=investigations caem nela).
  const legacyUrl = () => { const p = new URLSearchParams(window.location.search); return p.has("item") || p.get("task_view") === "investigations"; };
  const [legacy, setLegacy] = useState(legacyUrl);
  const go = (on: boolean) => {
    const p = new URLSearchParams(window.location.search);
    if (on) p.set("task_view", "investigations"); else { p.delete("task_view"); p.delete("item"); p.delete("task_space"); }
    window.history.pushState(null, "", `${window.location.pathname}?${p.toString()}`);
    setLegacy(on);
  };
  React.useEffect(() => { const f = () => setLegacy(legacyUrl()); window.addEventListener("popstate", f); return () => window.removeEventListener("popstate", f); }, []);
  if (legacy) return (
    <div>
      <button onClick={() => go(false)} className="m-3 rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50">← Voltar para Tarefas e atividades</button>
      <TasksWorkspace initialMonth={initialMonth} />
    </div>
  );
  React.useLayoutEffect(() => {
    const fit = () => { if (ref.current) setHeight(Math.max(480, Math.floor(getLocalViewport().height - toLocalRect(ref.current.getBoundingClientRect()).top - 4))); };
    fit(); window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);
  return (
    <div ref={ref} style={{ height }} className="border border-slate-200 border-t-0 bg-white">
      <Suspense fallback={<div className="flex h-full items-center justify-center text-sm text-slate-500">Carregando Tarefas e atividades…</div>}>
        <NotionModule onOpenInvestigations={() => go(true)} />
      </Suspense>
    </div>
  );
}

/* Apostas e Registros: página única (só leitura) no visual do módulo. ?legacy=1 abre a tela antiga para atualizar. */
const LoopLedger = lazy(() => import("../../modules/notion/gaas/LoopLedger").then((m) => ({ default: m.LoopLedger })));
function LedgerPane({ section, onCount, legacy }: {
  section: "bets" | "outcomes" | "memory"; onCount: (n: number) => void;
  legacy: { setOutcomeCount: (n: number | null) => void; setMemoryCount: (n: number | null) => void };
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(640);
  React.useLayoutEffect(() => {
    const fit = () => { if (ref.current) setHeight(Math.max(480, Math.floor(getLocalViewport().height - toLocalRect(ref.current.getBoundingClientRect()).top - 4))); };
    fit(); window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);
  const isLegacy = new URLSearchParams(window.location.search).get("legacy") === "1";
  const move = (p: URLSearchParams) => { window.history.pushState(null, "", `${window.location.pathname}?${p.toString()}`); window.dispatchEvent(new PopStateEvent("popstate")); };
  const back = () => { const p = new URLSearchParams(window.location.search); p.delete("legacy"); p.delete("item"); p.set("section", "bets"); move(p); };
  const openLegacy = (kind: "bet" | "outcome" | "memory", id: string) => {
    const p = new URLSearchParams(window.location.search);
    p.set("section", kind === "bet" ? "bets" : kind === "outcome" ? "outcomes" : "memory"); p.set("item", id); p.set("legacy", "1"); move(p);
  };
  if (isLegacy) return (
    <div className="space-y-3 pt-3">
      <button onClick={back} className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50">← Voltar para Apostas e Registros</button>
      {section === "bets" ? <GrowthBetsView onCountChange={() => undefined} /> : section === "outcomes" ? <GrowthOutcomesView onCountChange={legacy.setOutcomeCount} /> : <GrowthMemoryView onCountChange={legacy.setMemoryCount} />}
    </div>
  );
  return (
    <div ref={ref} style={{ height }} className="border border-slate-200 border-t-0 bg-white">
      <Suspense fallback={<div className="flex h-full items-center justify-center text-sm text-slate-500">Carregando Apostas e Registros…</div>}>
        <LoopLedger key={section} initialView={section} initialItem={readGrowthLearningItem(window.location.search)} onCount={onCount} onOpenLegacy={openLegacy} />
      </Suspense>
    </div>
  );
}
