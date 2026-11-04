import type { ReactNode } from "react";

export const REPORT_VIEWS = [
  { key: "performance", label: "Overview" },
  { key: "daily", label: "Diário" },
  { key: "monthly", label: "Mensal" },
  { key: "journey", label: "Evolução e anomalias" },
  { key: "xlsx", label: "Relatórios" },
] as const;
export type ReportView = (typeof REPORT_VIEWS)[number]["key"];

export function ReportChartPanel({ children }: { children: ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      {children}
    </section>
  );
}

export function ReportDeliveryLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(420px,0.85fr)] lg:items-start">
      {children}
    </div>
  );
}

export function ReportDailyModeControl({
  accumulated,
  onChange,
}: {
  accumulated: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
      {[
        { value: false, label: "Diário" },
        { value: true, label: "Acumulado" },
      ].map((option) => (
        <button
          key={option.label}
          type="button"
          aria-pressed={accumulated === option.value}
          onClick={() => onChange(option.value)}
          className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${accumulated === option.value ? "bg-cyan-600 text-white shadow-sm" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"}`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function ReportMonthRangeControl({
  active,
  onChange,
  caption,
}: {
  active?: number;
  onChange: (months: number) => void;
  caption?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <span className="text-xs text-slate-400">{caption}</span>
      <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
        Atalho mensal
      </span>
      <div className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
        {[3, 6, 12].map((months) => (
          <button
            key={months}
            type="button"
            onClick={() => onChange(months)}
            aria-pressed={active === months}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${active === months ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"}`}
          >
            {months}M
          </button>
        ))}
      </div>
    </div>
  );
}

/** One visual contract for every reporting domain. Data and actions stay in adapters. */
export function ReportWorkspaceHeader({
  title,
  view,
  onViewChange,
  description,
  actions,
  summaryStrip,
}: {
  title: string;
  view: ReportView;
  onViewChange: (view: ReportView) => void;
  description?: ReactNode;
  actions?: ReactNode;
  summaryStrip?: ReactNode;
}) {
  return (
    <div
      className="overflow-hidden rounded-2xl shadow-md"
      data-report-component="workspace-header"
    >
      <div
        style={{
          background: "linear-gradient(135deg, #00C6CC 0%, #00A8B0 100%)",
        }}
        className="px-8 py-6"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="mb-1 flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-white">
                {title}
              </h1>
              <nav
                aria-label={`Visões de ${title}`}
                className="flex max-w-full flex-wrap rounded-xl border border-white/30 bg-white/15 p-1"
              >
                {REPORT_VIEWS.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    aria-current={view === option.key ? "page" : undefined}
                    onClick={() => onViewChange(option.key)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${view === option.key ? "bg-white text-slate-900 shadow-sm" : "text-white/80 hover:bg-white/15 hover:text-white"}`}
                  >
                    {option.label}
                  </button>
                ))}
              </nav>
            </div>
            {description && (
              <div className="text-sm text-cyan-100">{description}</div>
            )}
          </div>
          {actions}
        </div>
      </div>
      {summaryStrip}
    </div>
  );
}

export function ReportKpiStrip({
  items,
}: {
  items: { label: string; value: ReactNode }[];
}) {
  return (
    <div
      data-report-component="kpi-strip"
      className="grid grid-cols-2 divide-x divide-slate-200 border-x border-b border-slate-200 bg-white md:grid-cols-4"
    >
      {items.map((kpi) => (
        <div key={kpi.label} className="px-6 py-3 text-center">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {kpi.label}
          </p>
          <div className="mt-0.5 text-xl font-bold tabular-nums text-slate-800">
            {kpi.value}
          </div>
        </div>
      ))}
    </div>
  );
}
