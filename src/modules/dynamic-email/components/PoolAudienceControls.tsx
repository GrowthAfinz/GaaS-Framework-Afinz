import React from "react";
import { poolGroups, poolGroupLabel } from "../domain/poolCreation";
import type { VdvMovimentoRow, VdvSample } from "../domain/vaiDeVisa";

const control =
  "h-8 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-800 outline-none focus-visible:ring-2 focus-visible:ring-cyan-400";
export function PoolAudienceControls({
  movimento,
  version,
  sample,
  onChange,
  today,
  onDate,
}: {
  movimento: VdvMovimentoRow[];
  version: string;
  sample: VdvSample;
  onChange: (sample: VdvSample) => void;
  today: string;
  onDate: (date: string) => void;
}) {
  const groups = poolGroups(movimento, version);
  const generic = sample.CD_GRUPO === "GENERICO";
  const comparison = sample.DS_CELULA_TESTE === "SEG-B";
  return (
    <section
      aria-label="Público da prévia Visa"
      className="rounded-xl border border-cyan-200 bg-cyan-50/50 p-3"
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-xs font-bold text-cyan-950">Visualizar para</h3>
        <span className="text-[10px] text-slate-500">
          Simulação de conteúdo
        </span>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        <label className="text-[10px] font-semibold text-slate-500">
          Grupo de compradores
          <select
            aria-label="Grupo de compradores"
            className={control}
            value={sample.CD_GRUPO}
            onChange={(e) =>
              onChange({
                ...sample,
                CD_GRUPO: e.target.value,
                DS_CELULA_TESTE:
                  e.target.value === "GENERICO" ? "GEN-A" : "SEG-A",
              })
            }
          >
            {!groups.includes(sample.CD_GRUPO) && (
              <option value={sample.CD_GRUPO}>
                {poolGroupLabel(sample.CD_GRUPO)} · sem vitrine
              </option>
            )}
            {groups.map((g) => (
              <option key={g} value={g}>
                {poolGroupLabel(g)}
              </option>
            ))}
          </select>
        </label>
        <label className="text-[10px] font-semibold text-slate-500">
          Conteúdo
          <select
            aria-label="Tratamento da prévia"
            className={control}
            value={sample.DS_CELULA_TESTE}
            onChange={(e) =>
              onChange({ ...sample, DS_CELULA_TESTE: e.target.value })
            }
          >
            {generic ? (
              <option value="GEN-A">Genérico</option>
            ) : (
              <>
                <option value="SEG-A">Personalizado</option>
                <option value="SEG-B">Genérico de comparação</option>
              </>
            )}
          </select>
        </label>
        <label className="text-[10px] font-semibold text-slate-500">
          Data simulada
          <input
            aria-label="Data da prévia Visa"
            type="date"
            className={control}
            value={today}
            onChange={(e) => onDate(e.target.value)}
          />
        </label>
      </div>
      <p className="mt-2 text-[10px] leading-4 text-slate-500">
        Comprador: <b>{poolGroupLabel(sample.CD_GRUPO)}</b> · vitrine:{" "}
        <b>
          {generic || comparison ? "Genérica" : poolGroupLabel(sample.CD_GRUPO)}
        </b>{" "}
        · {sample.DS_CELULA_TESTE}. Controles SEG-C e GEN-C ficam sem envio no
        SFMC.
      </p>
      {!groups.includes(
        generic || comparison ? "GENERICO" : sample.CD_GRUPO,
      ) && (
        <p role="status" className="mt-1 text-[10px] text-amber-800">
          Não há vitrine configurada para este cenário na campanha.
        </p>
      )}
    </section>
  );
}
