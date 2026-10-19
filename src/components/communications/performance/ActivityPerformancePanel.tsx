import React, { useEffect, useMemo, useState } from "react";
import type { FrameworkActivity } from "../../../utils/communicationOrchestrator";
import type { CommunicationTemplate } from "../../../types/communication";
import type { TemplateContentIndex } from "../../../services/templateContentIndex";
import {
  groupActivityPerformance,
  completeValue,
  recordedCac,
} from "../../../utils/activityPerformance";
import { openActivityRegistration } from "../../../services/communicationNavigation";
import { ExecutionResults } from "../journeys/ExecutionResults";
import { resolvePreview } from "../../../utils/communicationVisualResolution";
import { ChannelThumb } from "./ChannelPreview";
import { Pager, paginate, TagRow, tagsFromFacets } from "./contentUi";
const n = (v: number | null) =>
  v === null ? "—" : v.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
export function ActivityPerformancePanel({
  rows,
  view,
  catalog,
  contents,
  onOpenTemplate,
}: {
  rows: FrameworkActivity[];
  view: "overview" | "gallery" | "table";
  catalog: CommunicationTemplate[];
  contents: TemplateContentIndex | null;
  onOpenTemplate?: (id: string) => void;
}) {
  const groups = useMemo(() => groupActivityPerformance(rows), [rows]);
  const [selected, setSelected] = useState<string | null>(null),
    [page, setPage] = useState(1),
    [order, setOrder] = useState("Cartões Gerados");
  useEffect(() => {
    setPage(1);
  }, [rows]);
  useEffect(() => {
    if (!selected) return;
    const close = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelected(null);
    };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [selected]);
  const ordered = useMemo(
    () =>
      [...groups].sort(
        (a, b) =>
          (completeValue(b.records, order) ?? -1) -
            (completeValue(a.records, order) ?? -1) ||
          a.name.localeCompare(b.name),
      ),
    [groups, order],
  );
  const paged = paginate(ordered, page),
    active = groups.find((g) => g.id === selected);
  const templateIds = new Set(rows.map((r) => r.template_id).filter(Boolean));
  const linked = rows.filter((r) => r.template_id).length;
  const status = (g: (typeof groups)[number]) => (
    <div className="space-y-1 text-xs">
      {g.templates.map((id) => (
        <button
          key={id}
          className="block break-all text-left text-cyan-800"
          onClick={() => {
            setSelected(null);
            onOpenTemplate?.(id);
          }}
        >
          {id}
        </button>
      ))}
      {g.pending > 0 && (
        <>
          <p className="font-semibold text-amber-800">
            {g.templates.length ? "Vínculo parcial" : "Sem template vinculado"}{" "}
            · {g.pending} execuções
          </p>
          <button
            className="text-left font-semibold text-cyan-800 underline"
            onClick={() => openActivityRegistration(g.records)}
          >
            Vincular no Cadastro de templates
          </button>
        </>
      )}
    </div>
  );
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-cyan-100 bg-cyan-50 p-4 text-sm">
        <strong>
          {groups.length} atividades · {rows.length} execuções
        </strong>
        <p className="mt-1 text-xs text-slate-600">
          {templateIds.size} templates identificados · {linked}/{rows.length}{" "}
          execuções com vínculo (
          {rows.length ? Math.round((linked / rows.length) * 100) : 0}%). Cada
          execução entra uma vez, independentemente do cadastro.
        </p>
      </div>
      {view === "overview" ? (
        <ExecutionResults rows={rows} />
      ) : (
        <>
          <label className="block text-xs text-slate-600">
            Ordenar atividades por{" "}
            <select
              className="rounded border bg-white p-2"
              value={order}
              onChange={(e) => {
                setOrder(e.target.value);
                setPage(1);
              }}
            >
              {[
                "Cartões Gerados",
                "Base Total",
                "Cliques",
                "Propostas",
                "Custo Total Campanha",
              ].map((k) => (
                <option key={k}>{k}</option>
              ))}
            </select>
          </label>
          {view === "gallery" ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {paged.rows.map((g) => (
                <article
                  key={g.id}
                  className="space-y-3 rounded-2xl border bg-white p-4"
                >
                  <div className="flex gap-3">
                    {g.templates[0] && (
                      <ChannelThumb
                        res={resolvePreview({
                          channel: g.records[0].Canal,
                          catalog,
                          contents,
                          templateId: g.templates[0],
                        })}
                        w={56}
                        h={70}
                        title={g.templates[0]}
                      />
                    )}
                    <div className="min-w-0">
                      <button
                        onClick={() => setSelected(g.id)}
                        className="break-all text-left text-xs font-bold text-slate-800"
                      >
                        {g.name}
                      </button>
                      <p className="mt-1 break-all text-[10px] text-slate-500">
                        {g.journey}
                      </p>
                    </div>
                  </div>
                  <TagRow tags={tagsFromFacets(g.facets)} />
                  {status(g)}
                  <div className="grid grid-cols-3 gap-2 rounded-lg bg-slate-50 p-3 text-xs">
                    {["Base Total", "Cliques", "Cartões Gerados"].map((k) => (
                      <div key={k}>
                        <p className="text-[10px] text-slate-500">{k}</p>
                        <strong>{n(completeValue(g.records, k))}</strong>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span>
                      {g.records.length} execuções · CAC R${" "}
                      {n(recordedCac(g.records))}
                    </span>
                    <button
                      className="font-semibold text-cyan-800"
                      onClick={() => setSelected(g.id)}
                    >
                      Ver resultados →
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="overflow-auto rounded-xl border bg-white">
              <table className="w-full text-xs">
                <thead className="bg-slate-50">
                  <tr>
                    {[
                      "Atividade / jornada",
                      "Template",
                      "Execuções",
                      "Base",
                      "Aberturas",
                      "Cliques",
                      "Propostas",
                      "Aprovados",
                      "Cartões",
                      "Custo registrado",
                      "CAC registrado",
                    ].map((k) => (
                      <th key={k} className="whitespace-nowrap p-3 text-left">
                        {k}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paged.rows.map((g) => (
                    <tr key={g.id} className="border-t">
                      <td className="min-w-64 max-w-80 break-all p-3">
                        <button
                          className="text-left font-semibold text-cyan-800"
                          onClick={() => setSelected(g.id)}
                        >
                          {g.name}
                        </button>
                        <p className="mt-1 text-[10px] text-slate-500">
                          {g.journey}
                        </p>
                      </td>
                      <td className="min-w-48 max-w-64 p-3">{status(g)}</td>
                      <td className="p-3">{g.records.length}</td>
                      {[
                        "Base Total",
                        "Abertura",
                        "Cliques",
                        "Propostas",
                        "Aprovados",
                        "Cartões Gerados",
                        "Custo Total Campanha",
                      ].map((k) => (
                        <td key={k} className="whitespace-nowrap p-3">
                          {n(completeValue(g.records, k))}
                        </td>
                      ))}
                      <td className="p-3">{n(recordedCac(g.records))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {!groups.length && (
            <p className="rounded-xl border bg-white p-8 text-center text-sm text-slate-500">
              Sem atividades com registros neste recorte.
            </p>
          )}
          <Pager
            {...paged}
            total={groups.length}
            unit="atividades"
            onPage={setPage}
          />
        </>
      )}
      {active && (
        <div
          className="fixed inset-0 z-[130] grid place-items-center bg-slate-950/50 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Performance da atividade"
            className="max-h-[90vh] w-full max-w-5xl overflow-auto rounded-2xl bg-white p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="mb-4 flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <h3 className="break-all text-sm font-bold">{active.name}</h3>
                <p className="mt-1 break-all text-xs text-slate-500">
                  {active.journey}
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="rounded border px-3 py-1"
                aria-label="Fechar resultados"
              >
                Fechar
              </button>
            </header>
            {status(active)}
            <div className="mt-4">
              <ExecutionResults rows={active.records} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
