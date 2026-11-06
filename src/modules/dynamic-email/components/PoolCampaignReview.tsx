import React, { useEffect, useRef, useState } from "react";
import type { WorkspaceBriefing, EmailTemplateSlot } from "../domain/workspace";
import type { VdvData } from "./VaiDeVisaWorkspace";
import type { VdvSample } from "../domain/vaiDeVisa";
import { resolveVdvPreview } from "../domain/vaiDeVisa";
import { poolGroups, poolGroupLabel } from "../domain/poolCreation";
import { materializeVdvTemplate, VDV_SLOT } from "../domain/factoryEmail";
import { renderDynamicEmail } from "../ampscript/renderer";

function Thumbnail({
  html,
  width,
  title,
}: {
  html: string;
  width: number;
  title: string;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.4);
  useEffect(() => {
    const element = container.current;
    if (!element) return;
    const measure = () => setScale(Math.min(1, element.clientWidth / width));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [width]);
  return (
    <div ref={container} className="h-72 overflow-auto bg-slate-100">
      <div style={{ height: 1300 * scale }}>
        <iframe
          title={title}
          sandbox=""
          loading="lazy"
          srcDoc={html}
          style={{
            width,
            height: 1300,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
          className="border-0 bg-white"
        />
      </div>
    </div>
  );
}

export function PoolCampaignReview({
  rows,
  data,
  sample,
  today,
  templates,
  onOpen,
  onClose,
}: {
  rows: WorkspaceBriefing[];
  data: VdvData;
  sample: VdvSample;
  today: string;
  templates: EmailTemplateSlot[];
  onOpen: (id: string, sample: VdvSample) => void;
  onClose: () => void;
}) {
  const [genericComparison, setGenericComparison] = useState(false);
  const [width, setWidth] = useState(680);
  const version = rows[0]?.__editor?.contentVersion ?? "";
  const groups = poolGroups(data.movimento, version);
  const touches = [...rows].sort((a, b) =>
    a.__editor!.touch.localeCompare(b.__editor!.touch),
  );
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-3">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold text-slate-900">
            {rows[0]?.__editor?.campaignName} · grupos e toques
          </h2>
          <p className="text-[10px] text-slate-500">
            Mesma identidade e data: {today}. Controles sem envio não geram
            peças.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border px-2 py-1.5 text-xs font-bold text-slate-600"
        >
          Voltar ao editor
        </button>
      </header>
      <div className="my-3 flex flex-wrap items-center gap-2">
        <label className="text-[11px] text-slate-600">
          <input
            className="mr-1"
            type="checkbox"
            checked={genericComparison}
            onChange={(e) => setGenericComparison(e.target.checked)}
          />
          Comparar tratamento genérico nos grupos
        </label>
        <select
          aria-label="Formato das prévias da campanha"
          value={width}
          onChange={(e) => setWidth(+e.target.value)}
          className="rounded-lg border px-2 py-1 text-xs"
        >
          <option value={680}>Desktop</option>
          <option value={375}>Mobile</option>
        </select>
      </div>
      {groups.map((group) => (
        <section
          key={group}
          className="mb-3 rounded-xl border border-slate-200 p-2"
        >
          <h3 className="mb-2 text-xs font-bold text-slate-800">
            {poolGroupLabel(group)} ·{" "}
            {group === "GENERICO"
              ? "GEN-A"
              : genericComparison
                ? "SEG-B · vitrine genérica"
                : "SEG-A · personalizado"}
          </h3>
          <div className="grid gap-2 md:grid-cols-2">
            {touches.map((row) => {
              const s = {
                ...sample,
                CD_GRUPO: group,
                DS_CELULA_TESTE:
                  group === "GENERICO"
                    ? "GEN-A"
                    : genericComparison
                      ? "SEG-B"
                      : "SEG-A",
                ID_VERSAO_OFERTAS: version,
              };
              const p = resolveVdvPreview({
                ...data,
                sample: s,
                today,
                versaoEmail: row.__editor!.touch,
              });
              const slot = templates.find(
                (t) => t.id === (row.__meta.templateSlotId ?? VDV_SLOT),
              );
              const html = slot
                ? renderDynamicEmail(
                    materializeVdvTemplate(slot.source, row.__editor!.touch),
                    row,
                    {
                      CPF: "00000000000",
                      PRI_NOME: s.FIRST_NAME,
                      LIMITE: "",
                      PRODUTO: "AFINZ_VISA",
                      SEQUENCIA: row.SEQUENCIA,
                      TP_CAMPANHA: row.TP_CAMPANHA,
                    },
                    { vars: p.vars },
                  ).html
                : "";
              return (
                <article
                  key={row.__id}
                  className="min-w-0 overflow-hidden rounded-lg border border-slate-200"
                >
                  <header className="bg-slate-50 p-2">
                    <b className="text-xs">{row.SEQUENCIA}</b>
                    <p className="mt-1 text-[10px] text-slate-500">
                      {p.heroUsed} ·{" "}
                      {p.cards.map((c) => c.marca).join(" · ") ||
                        "sem ofertas válidas"}
                    </p>
                    <button
                      type="button"
                      onClick={() => onOpen(row.__id, s)}
                      className="mt-1 text-[11px] font-bold text-cyan-800"
                    >
                      Abrir no editor
                    </button>
                  </header>
                  {p.skipped ? (
                    <p className="p-3 text-xs text-amber-800">
                      {p.diagnostics.join(" · ")}
                    </p>
                  ) : !slot ? (
                    <p className="p-3 text-xs text-amber-800">
                      Template vinculado não encontrado.
                    </p>
                  ) : (
                    <Thumbnail
                      html={html}
                      width={width}
                      title={`${poolGroupLabel(group)} · ${row.SEQUENCIA}`}
                    />
                  )}
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </section>
  );
}
