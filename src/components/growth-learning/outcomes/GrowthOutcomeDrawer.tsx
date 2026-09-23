import React, { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Database,
  Gauge,
  Loader2,
  ShieldAlert,
  X,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  OUTCOME_BUCKET_LABELS,
  OUTCOME_VERDICT_LABELS,
} from "./growthOutcome.logic";
import { GrowthOutcome } from "./growthOutcome.types";
import { reviewGrowthOutcome } from "./growthOutcomeService";

interface Props {
  outcome: GrowthOutcome;
  onClose: () => void;
  onChanged: () => void;
}

const EXECUTION_LABELS = {
  not_started: "Não iniciada",
  partial: "Parcial",
  completed: "Concluída",
  cancelled: "Cancelada",
  unknown: "Desconhecida",
} as const;

function formatDate(value?: string | null, withTime = false) {
  if (!value) return "Não informado";
  try {
    return format(
      parseISO(value),
      withTime ? "dd MMM yyyy, HH:mm" : "dd/MM/yyyy",
      { locale: ptBR },
    );
  } catch {
    return value;
  }
}

const Fact: React.FC<{ label: string; value?: React.ReactNode }> = ({
  label,
  value,
}) => (
  <div>
    <dt className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
      {label}
    </dt>
    <dd className="mt-1 break-words text-sm text-slate-700">
      {value === undefined || value === null || value === ""
        ? "Não informado"
        : value}
    </dd>
  </div>
);

export const GrowthOutcomeDrawer: React.FC<Props> = ({
  outcome,
  onClose,
  onChanged,
}) => {
  const [contest, setContest] = useState(false);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving) onClose();
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [onClose, saving]);

  const review = async (action: "confirm" | "contest") => {
    if (!outcome.outcome_id || (action === "contest" && !reason.trim())) return;
    setSaving(true);
    setError(null);
    try {
      await reviewGrowthOutcome({
        outcomeId: outcome.outcome_id,
        action,
        reason,
      });
      onChanged();
      onClose();
    } catch (reviewError) {
      setError(
        reviewError instanceof Error
          ? reviewError.message
          : "Não foi possível revisar o outcome.",
      );
    } finally {
      setSaving(false);
    }
  };

  const reviewable =
    outcome.outcome_id && outcome.review_status === "system_evaluated";
  const observed =
    outcome.observed_value === null
      ? "—"
      : `${outcome.observed_value}${outcome.observed_unit || outcome.expected_unit ? ` ${outcome.observed_unit || outcome.expected_unit}` : ""}`;

  return (
    <div
      className="fixed inset-0 z-[100] flex justify-end bg-slate-950/45 backdrop-blur-sm"
      onClick={onClose}
    >
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Detalhes do outcome"
        className="flex h-full w-full max-w-3xl flex-col bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="border-b border-slate-200 px-5 py-5 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-cyan-100 text-cyan-700">
                <Gauge size={20} />
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-white">
                    {OUTCOME_BUCKET_LABELS[outcome.due_bucket]}
                  </span>
                  <span className="text-xs font-bold text-slate-500">
                    {outcome.team_scope}
                    {outcome.owner ? ` · ${outcome.owner}` : ""}
                  </span>
                </div>
                <h2 className="mt-2 text-xl font-black leading-snug text-slate-900">
                  {outcome.hypothesis}
                </h2>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar"
              className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"
            >
              <X size={20} />
            </button>
          </div>
        </header>

        <div className="flex-1 space-y-7 overflow-y-auto px-5 py-6 sm:px-6">
          <section>
            <h3 className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
              Contrato × observado
            </h3>
            <div className="mt-3 grid gap-3 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                  Contrato
                </p>
                <dl className="mt-3 grid gap-4 sm:grid-cols-2">
                  <Fact
                    label="Baseline"
                    value={`${outcome.baseline_value}${outcome.expected_unit ? ` ${outcome.expected_unit}` : ""}`}
                  />
                  <Fact
                    label="Expectativa"
                    value={`${outcome.expected_value}${outcome.expected_unit ? ` ${outcome.expected_unit}` : ""}`}
                  />
                  <Fact
                    label="Direção"
                    value={outcome.expected_direction.replace(/_/g, " ")}
                  />
                  <Fact
                    label="Janela"
                    value={`${formatDate(outcome.outcome_window_start)} a ${formatDate(outcome.outcome_window_end)}`}
                  />
                </dl>
              </div>
              <div className="rounded-2xl border border-cyan-200 bg-cyan-50/50 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-cyan-700">
                  Observado
                </p>
                <dl className="mt-3 grid gap-4 sm:grid-cols-2">
                  <Fact label="Valor" value={observed} />
                  <Fact
                    label="Execução"
                    value={EXECUTION_LABELS[outcome.execution_status]}
                  />
                  <Fact
                    label="Veredito do sistema"
                    value={
                      outcome.system_verdict
                        ? OUTCOME_VERDICT_LABELS[outcome.system_verdict]
                        : "Ainda não calculado"
                    }
                  />
                  <Fact
                    label="Avaliado em"
                    value={formatDate(outcome.evaluated_at, true)}
                  />
                </dl>
              </div>
            </div>
            <div className="mt-3 rounded-2xl border border-slate-200 p-4 text-sm leading-6 text-slate-700">
              <strong>Critério:</strong> {outcome.success_criterion}
              <br />
              <strong>Ação executada:</strong> {outcome.action_text}
            </div>
          </section>

          <section>
            <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
              <Database size={15} /> Evidência e limite
            </h3>
            <dl className="mt-3 grid gap-4 rounded-2xl border border-slate-200 p-4 sm:grid-cols-2">
              <Fact label="Métrica" value={outcome.metric_name} />
              <Fact
                label="View"
                value={
                  <code className="text-xs">{outcome.verification_view}</code>
                }
              />
              <Fact
                label="Razão de verificação"
                value={outcome.verification_reason}
              />
              <Fact
                label="Snapshot"
                value={
                  <span className="break-all font-mono text-[11px]">
                    {outcome.outcome_evidence_snapshot_id ||
                      outcome.belief_evidence_snapshot_id}
                  </span>
                }
              />
            </dl>
            {outcome.conclusion && (
              <p className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                {outcome.conclusion}
              </p>
            )}
            {!outcome.outcome_id && (
              <div className="mt-3 flex gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                <ShieldAlert size={18} className="mt-0.5 shrink-0" />
                <span>
                  A janela está na agenda, mas ainda não existe medição
                  calculada pelo próximo build com dados compatíveis. Isso não é
                  falha nem zero.
                </span>
              </div>
            )}
            {outcome.system_verdict === "not_verifiable" && (
              <div className="mt-3 flex gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                <ShieldAlert size={18} className="mt-0.5 shrink-0" />
                <span>
                  A execução não foi concluída; a hipótese não foi classificada
                  como fracasso.
                </span>
              </div>
            )}
          </section>

          {outcome.contestation_reason && (
            <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <h3 className="text-xs font-black uppercase tracking-[0.14em] text-amber-800">
                Contestação
              </h3>
              <p className="mt-2 text-sm leading-6 text-amber-900">
                {outcome.contestation_reason}
              </p>
            </section>
          )}

          {reviewable && (
            <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                Revisão humana
              </h3>
              {contest && (
                <textarea
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  rows={3}
                  className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-cyan-500"
                  placeholder="Por que o veredito precisa ser contestado?"
                />
              )}
              <div className="mt-3 flex flex-wrap justify-end gap-2">
                {contest ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setContest(false);
                        setReason("");
                      }}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      disabled={saving || !reason.trim()}
                      onClick={() => void review("contest")}
                      className="inline-flex items-center gap-2 rounded-xl bg-amber-700 px-4 py-2 text-xs font-bold text-white disabled:opacity-40"
                    >
                      {saving && <Loader2 size={14} className="animate-spin" />}{" "}
                      Registrar contestação
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setContest(true)}
                      className="rounded-xl border border-amber-300 bg-white px-4 py-2 text-xs font-bold text-amber-800"
                    >
                      Contestar
                    </button>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => void review("confirm")}
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white disabled:opacity-40"
                    >
                      {saving ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <CheckCircle2 size={14} />
                      )}{" "}
                      Confirmar veredito
                    </button>
                  </>
                )}
              </div>
            </section>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
              <AlertCircle size={18} className="mt-0.5 shrink-0" /> {error}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
};
