import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  closeGrowthLearningItem,
  openGrowthLearningSectionItem,
  readGrowthLearningItem,
} from "../growthLearningNavigation";
import { FRONT_LABELS } from "../feed/growthFeedRegistry";
import {
  filterGrowthOutcomes,
  isActionableOutcome,
  OUTCOME_BUCKET_LABELS,
  OUTCOME_VERDICT_LABELS,
} from "./growthOutcome.logic";
import {
  fetchGrowthOutcome,
  fetchGrowthOutcomes,
} from "./growthOutcomeService";
import { GrowthOutcome, GrowthOutcomeBucket } from "./growthOutcome.types";
import { GrowthOutcomeDrawer } from "./GrowthOutcomeDrawer";
import { openFeedback } from "../../feedback/feedbackBus";
import { LedgerChip, LedgerEntry, LedgerLoading, LedgerState, LoopLedger, type LedgerTone } from "../ledger/LoopLedger";
import { ledgerDate, plural, withUnit } from "../ledger/ledgerFormat";

interface Props {
  onCountChange?: (count: number) => void;
}

const EXECUTION_LABELS: Record<string, string> = { not_started: "Não iniciada", partial: "Parcial", completed: "Concluída", cancelled: "Cancelada", unknown: "Sem registro" };

const formatDate = ledgerDate;

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
  const byBucket = useMemo(() => {
    const counts = {} as Record<GrowthOutcomeBucket, number>;
    for (const key of Object.keys(OUTCOME_BUCKET_LABELS) as GrowthOutcomeBucket[]) counts[key] = 0;
    for (const item of outcomes) counts[item.due_bucket] = (counts[item.due_bucket] || 0) + 1;
    return counts;
  }, [outcomes]);
  const actionable = outcomes.filter(isActionableOutcome).length;
  const open = (outcome: GrowthOutcome) => {
    setSelected(outcome);
    openGrowthLearningSectionItem("outcomes", outcome.outcome_id || outcome.bet_id);
  };

  const title = loading
    ? "Outcomes"
    : actionable === 0
      ? "Nenhum resultado pede verificação"
      : `${plural(actionable, "resultado pede", "resultados pedem")} verificação`;
  const parts = [
    byBucket.overdue ? (byBucket.overdue === 1 ? "um está atrasado" : `${byBucket.overdue} estão atrasados`) : "",
    byBucket.due_today ? `${byBucket.due_today} vence${byBucket.due_today === 1 ? "" : "m"} hoje` : "",
    byBucket.ready_review ? `${byBucket.ready_review} já ${byBucket.ready_review === 1 ? "pode" : "podem"} ser revisado${byBucket.ready_review === 1 ? "" : "s"}` : "",
  ].filter(Boolean);
  const summaryText = loading || error
    ? undefined
    : outcomes.length === 0
      ? "A agenda nasce das apostas contratadas. Nenhum resultado é simulado para preencher esta área."
      : parts.length
        ? `${actionable === 1 && parts.length === 1 ? `Ele ${parts[0].replace(/^(um|\d+) /, "")}` : `Desses, ${parts.join(", ")}`}. Abra o resultado para comparar o observado com o contrato e registrar a conclusão.`
        : "Os resultados em aberto ainda estão dentro da janela ou aguardando dados.";

  const bucketTone = (key: GrowthOutcomeBucket): LedgerTone =>
    key === "overdue" || key === "contested" ? "alert" : key === "due_today" || key === "waiting_data" ? "warn" : key === "ready_review" || key === "reviewed" ? "ok" : "neutral";

  return (
    <>
      <LoopLedger
        section="Outcomes"
        title={title}
        meta={!loading && !error && <>
          {byBucket.overdue > 0 && <LedgerChip tone="alert">{plural(byBucket.overdue, "atrasado", "atrasados")}</LedgerChip>}
          {byBucket.due_today > 0 && <LedgerChip tone="warn">{byBucket.due_today} para hoje</LedgerChip>}
          {byBucket.ready_review > 0 && <LedgerChip tone="ok">{byBucket.ready_review} prontos para revisão</LedgerChip>}
          {byBucket.contested > 0 && <LedgerChip tone="alert">{plural(byBucket.contested, "contestado", "contestados")}</LedgerChip>}
          <span>Todos os períodos</span>
        </>}
        summary={summaryText}
        search={{ value: query, onChange: setQuery, placeholder: "Buscar hipótese, métrica ou time", ariaLabel: "Buscar hipótese, métrica ou time" }}
        segment={{ value: front, onChange: setFront, ariaLabel: "Frente", options: [{ value: "all", label: "Todas" }, { value: "crm_acquisition", label: "CRM Aquisição" }, { value: "paid_media", label: "Mídia Paga" }, { value: "b2c_origin", label: "Originação B2C" }] }}
        index={[
          { label: "Agenda de verificação", value: bucket, onSelect: (id) => setBucket(id as typeof bucket), items: [
            { id: "actionable", label: "Exigem atenção", count: actionable },
            ...(["overdue", "due_today", "ready_review", "waiting_data", "contested"] as GrowthOutcomeBucket[]).map((key) => ({ id: key, label: OUTCOME_BUCKET_LABELS[key], count: byBucket[key] || 0, tone: bucketTone(key) })),
          ] },
          { label: "Histórico", value: bucket, onSelect: (id) => setBucket(id as typeof bucket), items: [
            ...(["scheduled", "reviewed", "not_verifiable"] as GrowthOutcomeBucket[]).map((key) => ({ id: key, label: OUTCOME_BUCKET_LABELS[key], count: byBucket[key] || 0 })),
            { id: "all", label: "Todos", count: outcomes.length },
          ] },
        ]}
        indexNote="Cada resultado vem de uma aposta. O que for confirmado pode virar registro reutilizável."
        onFeedback={() => { const item = readGrowthLearningItem(window.location.search); openFeedback({ surface: "outcomes", pageLabel: "Outcomes", locationLabel: item ? "Outcomes › item aberto" : "Outcomes", targetType: item ? "outcome" : "page", targetId: item || undefined }); }}
        footer={!loading && !error ? `${filtered.length} de ${plural(outcomes.length, "verificação", "verificações")} nesta leitura.` : undefined}
      >
        {loading ? <LedgerLoading label="Lendo agenda" /> : error ? (
          <LedgerState tone="alert" title="A agenda não pôde ser carregada" action={{ label: "Tentar novamente", onClick: () => void load() }}>{error}</LedgerState>
        ) : filtered.length === 0 ? (
          <LedgerState title="Nenhum resultado nesta leitura">Troque o item do índice ou a frente. A agenda nasce das apostas contratadas.</LedgerState>
        ) : (
          <ul className="ledger-list">
            {filtered.map((outcome) => {
              const unit = outcome.observed_unit || outcome.expected_unit;
              const late = outcome.due_bucket === "overdue";
              return (
                <LedgerEntry
                  key={outcome.bet_id}
                  selected={selected?.bet_id === outcome.bet_id}
                  onOpen={() => open(outcome)}
                  kicker={<><LedgerChip tone={bucketTone(outcome.due_bucket)}>{OUTCOME_BUCKET_LABELS[outcome.due_bucket]}</LedgerChip><span>{FRONT_LABELS[outcome.front]}</span>{outcome.system_verdict && <span>{OUTCOME_VERDICT_LABELS[outcome.system_verdict]}</span>}</>}
                  title={outcome.hypothesis}
                  text={outcome.conclusion || undefined}
                  facts={[
                    { label: "Métrica", value: outcome.metric_name },
                    { label: "Contrato", value: withUnit(outcome.expected_value, outcome.expected_unit), hint: `hoje ${withUnit(outcome.baseline_value, outcome.expected_unit)}` },
                    { label: "Observado", value: outcome.observed_value === null ? "Ainda sem leitura" : withUnit(outcome.observed_value, unit), tone: outcome.observed_value === null && late ? "warn" : undefined },
                    { label: "Janela", value: `${formatDate(outcome.outcome_window_start)} a ${formatDate(outcome.outcome_window_end)}`, hint: late ? "vencida" : undefined, tone: late ? "alert" : undefined },
                    { label: "Execução", value: EXECUTION_LABELS[outcome.execution_status] || outcome.execution_status },
                    { label: "Responsável", value: outcome.owner || "Sem responsável", hint: outcome.team_scope, tone: outcome.owner ? undefined : "warn" },
                  ]}
                />
              );
            })}
          </ul>
        )}
      </LoopLedger>

      {selected && (
        <GrowthOutcomeDrawer
          outcome={selected}
          onClose={closeGrowthLearningItem}
          onChanged={() => void load()}
        />
      )}
    </>
  );
};
