import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CircleGauge,
  Filter,
  Loader2,
  RefreshCw,
  Search,
} from "lucide-react";
import {
  closeGrowthLearningItem,
  openGrowthLearningSectionItem,
  readGrowthLearningItem,
} from "../growthLearningNavigation";
import { FRONT_LABELS } from "../feed/growthFeedRegistry";
import {
  filterGrowthOutcomes,
  OUTCOME_BUCKET_LABELS,
  OUTCOME_VERDICT_LABELS,
} from "./growthOutcome.logic";
import {
  fetchGrowthOutcome,
  fetchGrowthOutcomes,
} from "./growthOutcomeService";
import { GrowthOutcome, GrowthOutcomeBucket } from "./growthOutcome.types";
import { GrowthOutcomeDrawer } from "./GrowthOutcomeDrawer";

interface Props {
  onCountChange?: (count: number) => void;
}

const selectClass =
  "rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 shadow-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100";

function formatDate(value: string) {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

export const GrowthOutcomesView: React.FC<Props> = ({ onCountChange }) => {
  const [outcomes, setOutcomes] = useState<GrowthOutcome[]>([]);
  const [selected, setSelected] = useState<GrowthOutcome | null>(null);
  const [bucket, setBucket] = useState<
    GrowthOutcomeBucket | "actionable" | "all"
  >("actionable");
  const [front, setFront] = useState("all");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await fetchGrowthOutcomes();
      setOutcomes(next);
      onCountChange?.(
        next.filter((item) =>
          [
            "due_today",
            "overdue",
            "ready_review",
            "contested",
            "waiting_data",
          ].includes(item.due_bucket),
        ).length,
      );
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Não foi possível carregar outcomes.",
      );
      onCountChange?.(0);
    } finally {
      setLoading(false);
    }
  }, [onCountChange]);

  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    let cancelled = false;
    const sync = async () => {
      const itemId = readGrowthLearningItem(window.location.search);
      if (!itemId) {
        setSelected(null);
        return;
      }
      const local = outcomes.find(
        (item) => item.outcome_id === itemId || item.bet_id === itemId,
      );
      if (local) {
        setSelected(local);
        return;
      }
      try {
        const remote = await fetchGrowthOutcome(itemId);
        if (!cancelled) setSelected(remote);
      } catch {
        if (!cancelled) setSelected(null);
      }
    };
    void sync();
    window.addEventListener("popstate", sync);
    return () => {
      cancelled = true;
      window.removeEventListener("popstate", sync);
    };
  }, [outcomes]);

  const filtered = useMemo(
    () => filterGrowthOutcomes(outcomes, { bucket, front, query }),
    [bucket, front, outcomes, query],
  );
  const open = (outcome: GrowthOutcome) => {
    setSelected(outcome);
    openGrowthLearningSectionItem(
      "outcomes",
      outcome.outcome_id || outcome.bet_id,
    );
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-cyan-700">
            <CircleGauge size={15} /> Agenda de outcomes
          </div>
          <p className="mt-1 text-sm text-slate-600">
            {filtered.length}{" "}
            {filtered.length === 1 ? "verificação" : "verificações"} nesta
            leitura
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex min-w-56 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 shadow-sm">
            <Search size={14} className="text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="h-10 min-w-0 flex-1 text-xs outline-none"
              placeholder="Buscar hipótese, métrica ou time"
            />
          </label>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400">
            <Filter size={13} /> Filtros
          </span>
          <select
            value={front}
            onChange={(event) => setFront(event.target.value)}
            className={selectClass}
          >
            <option value="all">Todas as frentes</option>
            <option value="crm_acquisition">CRM Aquisição</option>
            <option value="paid_media">Mídia Paga</option>
            <option value="b2c_origin">Originação B2C</option>
          </select>
          <select
            value={bucket}
            onChange={(event) => setBucket(event.target.value as typeof bucket)}
            className={selectClass}
          >
            <option value="actionable">Exigem atenção</option>
            <option value="all">Todos os estados</option>
            {Object.entries(OUTCOME_BUCKET_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="grid min-h-[340px] place-items-center rounded-2xl border border-slate-200 bg-white">
          <span className="flex items-center gap-2 text-sm font-semibold text-slate-500">
            <Loader2 size={18} className="animate-spin" /> Lendo agenda…
          </span>
        </div>
      ) : error ? (
        <div className="grid min-h-[340px] place-items-center rounded-2xl border border-rose-200 bg-rose-50 px-6 text-center">
          <div>
            <AlertCircle size={30} className="mx-auto text-rose-600" />
            <h3 className="mt-3 font-black text-rose-900">
              A agenda não pôde ser carregada
            </h3>
            <p className="mt-2 text-sm text-rose-800">{error}</p>
            <button
              type="button"
              onClick={() => void load()}
              className="mx-auto mt-4 inline-flex items-center gap-2 rounded-xl bg-rose-900 px-4 py-2 text-xs font-bold text-white"
            >
              <RefreshCw size={14} /> Tentar novamente
            </button>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="grid min-h-[340px] place-items-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 text-center">
          <div>
            <CircleGauge size={32} className="mx-auto text-slate-300" />
            <h3 className="mt-3 font-black text-slate-800">
              Nenhum outcome nesta leitura
            </h3>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
              A agenda nasce das apostas contratadas. Nenhum resultado é
              simulado para preencher esta área.
            </p>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left">
              <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-[0.1em] text-slate-500">
                <tr>
                  <th className="px-4 py-3">Aposta</th>
                  <th className="px-4 py-3">Frente</th>
                  <th className="px-4 py-3">Métrica</th>
                  <th className="px-4 py-3">Contrato</th>
                  <th className="px-4 py-3">Observado</th>
                  <th className="px-4 py-3">Execução</th>
                  <th className="px-4 py-3">Janela</th>
                  <th className="px-4 py-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((outcome) => (
                  <tr
                    key={outcome.bet_id}
                    onClick={() => open(outcome)}
                    className="cursor-pointer text-sm hover:bg-cyan-50/40"
                  >
                    <td className="max-w-sm px-4 py-4">
                      <div className="font-bold text-slate-900">
                        {outcome.hypothesis}
                      </div>
                      <div className="mt-1 truncate text-xs text-slate-500">
                        {outcome.team_scope}
                        {outcome.owner ? ` · ${outcome.owner}` : ""}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-xs font-semibold text-slate-600">
                      {FRONT_LABELS[outcome.front]}
                    </td>
                    <td className="px-4 py-4 font-semibold text-slate-800">
                      {outcome.metric_name}
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-bold text-slate-800">
                        {outcome.expected_value}
                        {outcome.expected_unit
                          ? ` ${outcome.expected_unit}`
                          : ""}
                      </div>
                      <div className="text-xs text-slate-400">
                        baseline {outcome.baseline_value}
                      </div>
                    </td>
                    <td className="px-4 py-4 font-bold text-slate-800">
                      {outcome.observed_value === null
                        ? "—"
                        : `${outcome.observed_value}${outcome.observed_unit || outcome.expected_unit ? ` ${outcome.observed_unit || outcome.expected_unit}` : ""}`}
                    </td>
                    <td className="px-4 py-4 text-xs font-semibold text-slate-600">
                      {outcome.execution_status.replace(/_/g, " ")}
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-600">
                      {formatDate(outcome.outcome_window_end)}
                    </td>
                    <td className="px-4 py-4">
                      <span className="rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-cyan-800">
                        {OUTCOME_BUCKET_LABELS[outcome.due_bucket]}
                      </span>
                      {outcome.system_verdict && (
                        <div className="mt-2 text-[11px] font-semibold text-slate-500">
                          {OUTCOME_VERDICT_LABELS[outcome.system_verdict]}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selected && (
        <GrowthOutcomeDrawer
          outcome={selected}
          onClose={closeGrowthLearningItem}
          onChanged={() => void load()}
        />
      )}
    </section>
  );
};
