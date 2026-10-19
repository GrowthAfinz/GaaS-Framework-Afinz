import React, { useEffect, useMemo, useState } from "react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { FrameworkActivity } from "../../../utils/communicationOrchestrator";
import { sumCovered } from "../../../utils/contentPerformanceModel";
import { saoPauloDay } from "../../../utils/saoPauloPeriod";
import { deliveryCoverage } from "../../../utils/journeyDelivery";
import {
  completeValue,
  observedRatio,
  recordedCac,
  uniqueExecutions,
} from "../../../utils/activityPerformance";
import { openActivityRegistration } from "../../../services/communicationNavigation";
import { Covered } from "../performance/contentUi";
const integer = (n: number | null) =>
  n === null ? "—" : n.toLocaleString("pt-BR", { maximumFractionDigits: 0 });
const pct = (n: number | null) =>
  n === null
    ? "—"
    : (n * 100).toLocaleString("pt-BR", { maximumFractionDigits: 3 }) + "%";
const brl = (n: number | null) =>
  n === null
    ? "—"
    : n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const VOLUMES = [
  "Base Total",
  "Base Acionável",
  "Abertura",
  "Cliques",
  "Propostas",
  "Aprovados",
  "Cartões Gerados",
  "Custo Total Campanha",
];
const RATES: Record<string, [string, string]> = {
  "Abertura / base total": ["Abertura", "Base Total"],
  "CTR / base total": ["Cliques", "Base Total"],
  "Cartões / base acionável": ["Cartões Gerados", "Base Acionável"],
  "Cartões / base total": ["Cartões Gerados", "Base Total"],
};
/** Shared results for activity, journey and content. Missing values never become zero. */
export function ExecutionResults({
  rows: input,
  showRecords = true,
}: {
  rows: FrameworkActivity[];
  showRecords?: boolean;
}) {
  const rows = useMemo(() => uniqueExecutions(input), [input]);
  const [metric, setMetric] = useState("Cartões Gerados"),
    [rate, setRate] = useState("Cartões / base acionável"),
    [day, setDay] = useState<string | null>(null);
  useEffect(() => setDay(null), [rows]);
  const pending = rows.filter((r) => !r.template_id).length;
  const timeline = useMemo(() => {
    const groups = new Map<string, FrameworkActivity[]>();
    for (const r of rows) {
      if (!r["Data de Disparo"]) continue;
      const d = saoPauloDay(r["Data de Disparo"]);
      groups.set(d, [...(groups.get(d) || []), r]);
    }
    return [...groups]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, rs]) => ({
        date,
        volume: completeValue(rs, metric),
        rate:
          rate === "Entrega ponderada"
            ? deliveryCoverage(rs).value
            : observedRatio(rs, ...RATES[rate]),
        coverage: sumCovered(rs, metric).covered + "/" + rs.length,
      }));
  }, [rows, metric, rate]);
  const shown = day
    ? rows.filter(
        (r) =>
          r["Data de Disparo"] && saoPauloDay(r["Data de Disparo"]) === day,
      )
    : rows;
  if (!rows.length)
    return (
      <p className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        Sem execução registrada neste período.
      </p>
    );
  const base = completeValue(rows, "Base Total");
  return (
    <section aria-label="Resultados das ativações" className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <strong>{rows.length} execuções</strong>
        <span className="text-slate-500">
          · {rows.length - pending} com template · {pending} sem template
        </span>
        {pending > 0 && (
          <button
            onClick={() =>
              openActivityRegistration(rows.filter((r) => !r.template_id))
            }
            className="font-semibold text-cyan-800 underline"
          >
            Vincular no Cadastro de templates
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-3 xl:grid-cols-4">
        {VOLUMES.map((key) => (
          <div
            key={key}
            className="rounded-lg border border-slate-100 bg-slate-50 p-3"
          >
            <p className="mb-1 text-slate-500">
              {key === "Base Total"
                ? "Base total"
                : key === "Custo Total Campanha"
                  ? "Custo registrado"
                  : key}
            </p>
            {key === "Custo Total Campanha" ? (
              <>
                <strong>{brl(completeValue(rows, key))}</strong>
                <p className="text-[10px] text-slate-500">
                  {sumCovered(rows, key).covered}/{rows.length} registros
                </p>
              </>
            ) : (
              <Covered v={sumCovered(rows, key)} strong />
            )}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2 rounded-xl border p-3 text-xs sm:grid-cols-3">
        {[
          [
            "Abertura / base total",
            pct(observedRatio(rows, "Abertura", "Base Total")),
          ],
          [
            "CTR / base total",
            pct(observedRatio(rows, "Cliques", "Base Total")),
          ],
          [
            "Cartões / base acionável",
            pct(observedRatio(rows, "Cartões Gerados", "Base Acionável")),
          ],
          ["Entrega ponderada", pct(deliveryCoverage(rows).value)],
          ["CAC registrado", brl(recordedCac(rows))],
        ].map(([label, value]) => (
          <div key={label}>
            <p className="text-slate-500">{label}</p>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      <div>
        <h4 className="text-sm font-semibold">Funil das execuções</h4>
        <div className="mt-2 space-y-2">
          {[
            "Base Total",
            "Base Acionável",
            "Abertura",
            "Cliques",
            "Propostas",
            "Aprovados",
            "Cartões Gerados",
          ].map((key) => {
            const n = completeValue(rows, key);
            return (
              <div
                key={key}
                className="grid grid-cols-[110px_1fr_90px] items-center gap-2 text-xs"
              >
                <span className="text-slate-500">{key}</span>
                <div className="h-2 overflow-hidden rounded bg-slate-100">
                  {n !== null && base !== null && base > 0 && (
                    <div
                      className="h-full rounded bg-cyan-600"
                      style={{
                        width:
                          Math.min(100, Math.max(0, (n / base) * 100)) + "%",
                      }}
                    />
                  )}
                </div>
                <span className="text-right tabular-nums">{integer(n)}</span>
              </div>
            );
          })}
        </div>
        <p className="mt-2 text-[10px] text-slate-500">
          Contagens registradas por etapa; não representam pessoas únicas nem
          passagem comprovada pelos ramos.
        </p>
      </div>
      <div>
        <h4 className="text-sm font-semibold">Evolução no período</h4>
        <div className="my-2 flex flex-wrap gap-2">
          <label className="text-xs text-slate-500">
            Volume{" "}
            <select
              aria-label="Métrica de volume"
              value={metric}
              onChange={(e) => setMetric(e.target.value)}
              className="rounded border p-1 text-slate-800"
            >
              {VOLUMES.map((k) => (
                <option key={k}>{k}</option>
              ))}
            </select>
          </label>
          <label className="text-xs text-slate-500">
            Taxa{" "}
            <select
              aria-label="Métrica de taxa"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              className="rounded border p-1 text-slate-800"
            >
              {[...Object.keys(RATES), "Entrega ponderada"].map((k) => (
                <option key={k}>{k}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="h-56 min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={timeline}
              margin={{ left: 0, right: 12 }}
              onClick={(s) => {
                const label = s?.activeLabel;
                if (timeline.some((t) => t.date === label))
                  setDay(String(label));
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={(v) =>
                  String(v).slice(8, 10) + "/" + String(v).slice(5, 7)
                }
                tick={{ fontSize: 10 }}
              />
              <YAxis yAxisId="volume" width={55} tick={{ fontSize: 10 }} />
              <YAxis
                yAxisId="rate"
                orientation="right"
                width={55}
                tickFormatter={(v) => pct(Number(v))}
                tick={{ fontSize: 10 }}
              />
              <Tooltip
                formatter={(v: number, name: string) => [
                  name === rate
                    ? pct(v)
                    : metric === "Custo Total Campanha"
                      ? brl(v)
                      : integer(v),
                  name,
                ]}
              />
              <Bar
                isAnimationActive={false}
                yAxisId="volume"
                dataKey="volume"
                name={metric}
                fill="#0891b2"
                radius={[3, 3, 0, 0]}
                maxBarSize={48}
              />
              <Line
                isAnimationActive={false}
                yAxisId="rate"
                dataKey="rate"
                name={rate}
                stroke="#7c3aed"
                strokeWidth={2.5}
                connectNulls={false}
                dot={{ r: 3 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <p className="text-[11px] text-slate-500">
          Barras: volume · linha: taxa. Taxas exigem cobertura completa. Lacunas
          não viram zero. Clique num dia para detalhar.
        </p>
      </div>
      {showRecords && (
        <>
          {day && (
            <button
              className="text-xs text-cyan-800"
              onClick={() => setDay(null)}
            >
              Mostrar todas as execuções do período
            </button>
          )}
          <div className="max-h-72 overflow-auto rounded-lg border">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-slate-50">
                <tr>
                  {[
                    "Data / atividade",
                    "Base",
                    "Aberturas",
                    "Cliques",
                    "Propostas",
                    "Aprovados",
                    "Cartões",
                    "Template",
                  ].map((s) => (
                    <th key={s} className="p-2 text-left">
                      {s}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {shown.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="min-w-40 max-w-64 p-2">
                      <span>
                        {r["Data de Disparo"]
                          ? saoPauloDay(r["Data de Disparo"])
                          : "Sem data"}
                      </span>
                      <p className="break-all text-[10px] text-slate-500">
                        {r["Activity name / Taxonomia"]}
                      </p>
                      <p className="break-all text-[10px] text-slate-400">
                        {r.jornada}
                      </p>
                    </td>
                    {[
                      "Base Total",
                      "Abertura",
                      "Cliques",
                      "Propostas",
                      "Aprovados",
                      "Cartões Gerados",
                    ].map((k) => (
                      <td key={k} className="p-2">
                        <Covered v={sumCovered([r], k)} />
                      </td>
                    ))}
                    <td className="max-w-48 break-all p-2">
                      {r.template_id || (
                        <button
                          className="text-cyan-800 underline"
                          onClick={() => openActivityRegistration([r])}
                        >
                          Sem template vinculado · vincular
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
