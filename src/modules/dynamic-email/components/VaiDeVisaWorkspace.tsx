import React, { useEffect, useMemo, useState } from "react";
import {
  VDV_BRIEFING_COLUMNS,
  VDV_MOVIMENTO_COLUMNS,
  VDV_SAMPLES,
  exportVdvBriefingCsv,
  exportVdvMovimentoCsv,
  parseVdvBriefingCsv,
  parseVdvMovimentoCsv,
  resolveVdvPreview,
  validateVdv,
  vdvToday,
  vdvValidOffer,
  type VdvBriefingRow,
  type VdvMovimentoRow,
  type VdvSample,
  type VdvPreview,
} from "../domain/vaiDeVisa";
import { loadVdv, saveVdv } from "../services/vaiDeVisaService";
import {
  VDV_V1_TEMPLATE,
  VDV_V2_TEMPLATE,
} from "../fixtures/vaiDeVisaV5Template";
import { renderDynamicEmail } from "../ampscript/renderer";
import { emptyBriefingRow } from "../domain/briefing";
import { SfmcEnvelopeGuide } from "./SfmcEnvelopeGuide";
import { VDV_BRIEFING_CSV, VDV_MOVIMENTO_CSV } from "../fixtures/vdvBF26V1.csv";
export type VdvData = {
  briefing: VdvBriefingRow[];
  movimento: VdvMovimentoRow[];
};
const btn =
  "rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold disabled:opacity-40";
const input =
  "rounded border border-slate-300 bg-white p-2 text-xs text-slate-900";
function download(name: string, text: string) {
  const url = URL.createObjectURL(
    new Blob([text], { type: "text/plain;charset=utf-8" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function VdvSampleControls({
  sample,
  onChange,
  today,
  onDateChange,
  preview,
}: {
  sample: VdvSample;
  onChange: (s: VdvSample) => void;
  today: string;
  onDateChange: (s: string) => void;
  preview: VdvPreview;
}) {
  return (
    <div className="space-y-2 border-b border-slate-200 bg-cyan-50 p-3 text-xs">
      <label>
        Amostra VDV{" "}
        <select
          aria-label="Amostra VDV"
          className={input}
          defaultValue=""
          onChange={(e) => {
            const s = VDV_SAMPLES[Number(e.target.value)];
            onChange({ ...s.sample });
            onDateChange(s.today ?? vdvToday());
          }}
        >
          <option value="" disabled>
            Selecionar cenário fictício
          </option>
          {VDV_SAMPLES.map((s, i) => (
            <option key={s.label} value={i}>
              {s.label}
            </option>
          ))}
        </select>
      </label>
      <div className="grid grid-cols-2 gap-2">
        {Object.entries(sample).map(([f, v]) => (
          <label key={f}>
            {f}
            <input
              aria-label={f}
              className={input + " w-full"}
              value={v}
              onChange={(e) => onChange({ ...sample, [f]: e.target.value })}
            />
          </label>
        ))}
        <label>
          Data simulada
          <input
            aria-label="Data simulada VDV"
            type="date"
            className={input + " w-full"}
            value={today}
            onChange={(e) => onDateChange(e.target.value)}
          />
        </label>
      </div>
      <p>
        <b>Assunto:</b> {preview.vars.Assunto}
      </p>
      <p>
        <b>Pré-cabeçalho:</b> {preview.vars.PreHeader}
      </p>
      <p>
        Hero: {preview.heroUsed} · Célula: {preview.cellUsed}
      </p>
      <p>
        Cards:{" "}
        {preview.cards
          .map((c) => `${c.marca} (posição ${c.position})`)
          .join(" → ")}
      </p>
      {preview.diagnostics.map((d) => (
        <p role="alert" key={d} className="text-red-700">
          {d}
        </p>
      ))}
    </div>
  );
}
export function VaiDeVisaWorkspace({
  data,
  onChange,
  today,
  onDateChange,
  onDirtyChange,
  initialTouch = "V1",
  onBack,
}: {
  data: VdvData;
  onChange: (d: VdvData) => void;
  today: string;
  onDateChange: (s: string) => void;
  onDirtyChange?: (dirty: boolean) => void;
  initialTouch?: "V1" | "V2";
  onBack?: () => void;
}) {
  const [draft, setDraft] = useState(data);
  const [version, setVersion] = useState("BF26_V1");
  const [newVersion, setNewVersion] = useState("");
  const [sample, setSample] = useState({ ...VDV_SAMPLES[0].sample });
  const [touch, setTouch] = useState<"V1" | "V2">(initialTouch);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [filter, setFilter] = useState({ group: "", brand: "", active: "" });
  const [drag, setDrag] = useState<number | null>(null);
  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);
  useEffect(() => {
    if (!dirty) setDraft(data);
  }, [data, dirty]);
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);
  const issues = useMemo(
    () => validateVdv({ ...draft, today }),
    [draft, today],
  );
  const errors = issues.filter((i) => i.severity === "error");
  const edit = (
    table: keyof VdvData,
    index: number,
    field: string,
    value: string,
  ) => {
    setDraft((d) => ({
      ...d,
      [table]: d[table].map((r, i) =>
        i === index ? { ...r, [field]: value, __source: "gaas" } : r,
      ),
    }));
    setDirty(true);
  };
  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };
  const reload = () =>
    run(async () => {
      if (dirty && !window.confirm("Descartar alterações locais e recarregar?"))
        return;
      const [briefing, movimento] = await Promise.all([
        loadVdv("briefing"),
        loadVdv("movimento"),
      ]);
      const next = { briefing, movimento };
      setDirty(false);
      setDraft(next);
      onChange(next);
      setMessage("Dados recarregados.");
    });
  const save = () =>
    run(async () => {
      if (errors.length) throw new Error("Corrija os erros antes de salvar.");
      // Cada DE é um lote atômico; o estado de cada lote salvo é atualizado mesmo se o seguinte falhar.
      let next = { ...draft };
      for (const table of ["briefing", "movimento"] as const) {
        const pending = next[table].filter(
          (r) =>
            !r.__version ||
            r.__source === "gaas-dirty" ||
            JSON.stringify(r) !==
              JSON.stringify(
                data[table].find((old) => key(table, old) === key(table, r)),
              ),
        );
        if (!pending.length) continue;
        const saved = [];
        for (const source of ["import", "gaas"] as const) {
          const batch = pending.filter(
            (r) => (r.__source === "import" ? "import" : "gaas") === source,
          );
          if (batch.length)
            saved.push(...(await saveVdv(table, batch, source)));
        }
        next = {
          ...next,
          [table]: next[table].map(
            (r) => saved.find((s) => key(table, s) === key(table, r)) ?? r,
          ),
        };
        setDraft(next);
        onChange(next);
      }
      setDirty(false);
      setMessage(
        "Conteúdo salvo no GaaS. Exporte os CSVs para atualizar as DEs.",
      );
    });
  const key = (t: keyof VdvData, r: Record<string, string>) =>
    t === "briefing"
      ? r.ID
      : [r.VERSAO, r.GRUPO, r.CELULA, r.POSICAO].join("|");
  const importFile = (table: keyof VdvData, file: File) =>
    run(async () => {
      const parsed =
        table === "briefing"
          ? parseVdvBriefingCsv(await file.text())
          : parseVdvMovimentoCsv(await file.text());
      const incoming = parsed.map((r) => ({
        ...r,
        __version:
          draft[table].find((old) => key(table, old) === key(table, r))
            ?.__version ?? "",
        __source: "import",
      }));
      const next = {
        ...draft,
        [table]: [
          ...draft[table].filter(
            (r) => !incoming.some((n) => key(table, n) === key(table, r)),
          ),
          ...incoming,
        ],
      };
      setDraft(next);
      setDirty(true);
      setMessage(
        `${incoming.length} linhas importadas para revisão. Clique Salvar para persistir.`,
      );
    });
  const duplicate = () => {
    const target = newVersion.trim().toUpperCase();
    if (
      !/^[A-Z0-9_]{1,40}$/.test(target) ||
      draft.briefing.some((r) => r.VERSAO === target)
    ) {
      setMessage("Informe uma versão nova com letras, números e underscore.");
      return;
    }
    const copied = draft.briefing
      .filter((r) => r.VERSAO === version && r.TIPO !== "OFERTA")
      .map((r) => ({
        ...r,
        ID: `${r.TIPO}_${target}${
          r.TIPO === "HERO"
            ? "_" +
              r.HERO.normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/[^A-Z0-9]/gi, "_")
            : ""
        }`,
        VERSAO: target,
        __version: "",
        __source: "gaas",
      }));
    setDraft((d) => ({
      briefing: [...d.briefing, ...copied],
      movimento: [
        ...d.movimento,
        ...d.movimento
          .filter((r) => r.VERSAO === version)
          .map((r) => ({
            ...r,
            VERSAO: target,
            __version: "",
            __source: "gaas",
          })),
      ],
    }));
    setVersion(target);
    setDirty(true);
  };
  const source = touch === "V1" ? VDV_V1_TEMPLATE : VDV_V2_TEMPLATE;
  const preview = resolveVdvPreview({
    ...draft,
    sample: { ...sample, ID_VERSAO_OFERTAS: version },
    versaoEmail: touch,
    today,
  });
  const rendered = preview.skipped
    ? null
    : renderDynamicEmail(
        source,
        emptyBriefingRow(),
        {
          CPF: "00000000000",
          PRI_NOME: sample.FIRST_NAME,
          LIMITE: "",
          PRODUTO: "",
          SEQUENCIA: "",
          TP_CAMPANHA: "",
        },
        { vars: preview.vars },
      );
  const fields = (
    r: Record<string, string>,
    i: number,
    table: keyof VdvData,
    cols: string[],
  ) =>
    cols.map((f) => (
      <label key={f} className="block text-[10px] text-slate-600">
        {f}
        {["ASSUNTO", "PREHEADER", "ASSUNTO_V2", "PREHEADER_V2"].includes(f) &&
          ` · ${r[f].length} caracteres`}
        <input
          aria-label={`${r.ID ?? r.OFERTA_ID} ${f}`}
          className={input + " w-full"}
          value={r[f]}
          disabled={
            f === "ID" ||
            (table === "movimento" &&
              ["VERSAO", "GRUPO", "CELULA", "POSICAO"].includes(f))
          }
          onChange={(e) => edit(table, i, f, e.target.value)}
        />
      </label>
    ));
  const groups = [
    ...new Set(
      draft.movimento
        .filter((r) => r.VERSAO === version)
        .map((r) => r.GRUPO + "|" + r.CELULA),
    ),
  ];
  return (
    <div className="space-y-4 p-5 text-slate-900">
      {onBack && <button type="button" className={btn} onClick={onBack}>← Voltar aos e-mails</button>}
      <h2 className="text-lg font-bold">Pool Vai de Visa · {touch}</h2>
      <p className="text-sm">
        Até 3 ofertas válidas. No desktop, primeira centralizada quando ímpar;
        no mobile, cards em coluna.
      </p>
      <div className="flex flex-wrap gap-2">
        <button className={btn} disabled={busy} onClick={reload}>
          Recarregar
        </button>
        <button
          className={btn}
          onClick={() => {
            if (dirty && !window.confirm("Substituir rascunho pelos exemplos?"))
              return;
            setDraft({
              briefing: parseVdvBriefingCsv(VDV_BRIEFING_CSV),
              movimento: parseVdvMovimentoCsv(VDV_MOVIMENTO_CSV),
            });
            setDirty(true);
            setMessage("Exemplos locais carregados. Nada foi salvo no banco.");
          }}
        >
          Carregar exemplos BF26
        </button>
        <button
          className={btn}
          disabled={busy || !dirty || !!errors.length}
          onClick={save}
        >
          Salvar {dirty ? "alterações" : ""}
        </button>
        {(["briefing", "movimento"] as const).map((table) => (
          <label key={table} className={btn}>
            Importar CSV {table}
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void importFile(table, f);
                e.target.value = "";
              }}
            />
          </label>
        ))}
        <button
          className={btn}
          disabled={!!errors.length}
          onClick={() =>
            download(
              `BRIEFING_OFERTAS_VISA_${today.replace(/-/g, "")}.csv`,
              exportVdvBriefingCsv(draft.briefing),
            )
          }
        >
          Exportar catálogo
        </button>
        <button
          className={btn}
          disabled={!!errors.length}
          onClick={() =>
            download(
              `MOVIMENTO_OFERTAS_VISA_${version}_${today.replace(/-/g, "")}.csv`,
              exportVdvMovimentoCsv(
                draft.movimento.filter((r) => r.VERSAO === version),
              ),
            )
          }
        >
          Exportar movimento
        </button>
      </div>
      <p role="status" className="text-sm text-cyan-800">
        {message}
      </p>
      <details open={!!errors.length}>
        <summary>
          {errors.length} erros · {issues.length - errors.length} avisos
        </summary>
        <div className="max-h-48 overflow-auto text-xs">
          {issues.map((x, i) => (
            <p
              key={i}
              className={
                x.severity === "error" ? "text-red-700" : "text-amber-800"
              }
            >
              {x.table} linha {x.row} · {x.field}: {x.message}
            </p>
          ))}
        </div>
      </details>
      <section className="rounded-xl border bg-white p-4">
        <h3 className="font-bold">Catálogo de ofertas</h3>
        <button
          className={btn}
          onClick={() => {
            const id = window.prompt(
              "ID da nova oferta (A-Z, 0-9 e underscore):",
            );
            if (!id) return;
            if (draft.briefing.some((r) => r.ID === id)) {
              setMessage("ID já existe.");
              return;
            }
            setDraft((d) => ({
              ...d,
              briefing: [
                ...d.briefing,
                {
                  ...Object.fromEntries(
                    VDV_BRIEFING_COLUMNS.map((c) => [c, ""]),
                  ),
                  ID: id,
                  TIPO: "OFERTA",
                  ATIVA: "False",
                  RESGATE: "LINK",
                  __source: "gaas",
                },
              ],
            }));
            setDirty(true);
          }}
        >
          Nova oferta
        </button>
        <div className="my-3 flex gap-2">
          {(["group", "brand", "active"] as const).map((f) => (
            <label key={f}>
              {f === "group"
                ? "Grupo"
                : f === "brand"
                  ? "Marca"
                  : "Ativa (True/False)"}
              <input
                className={input + " block"}
                value={filter[f]}
                onChange={(e) => setFilter({ ...filter, [f]: e.target.value })}
              />
            </label>
          ))}
        </div>
        <div className="max-h-[500px] overflow-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th>Marca / imagens</th>
                <th>Vigência</th>
                <th>Editar oferta</th>
              </tr>
            </thead>
            <tbody>
              {draft.briefing.map((r, i) =>
                r.TIPO === "OFERTA" &&
                r.GRUPO.toLowerCase().includes(filter.group.toLowerCase()) &&
                r.MARCA.toLowerCase().includes(filter.brand.toLowerCase()) &&
                r.ATIVA.toLowerCase().includes(filter.active.toLowerCase()) ? (
                  <tr key={r.ID} className="border-t align-top">
                    <td className="p-2">
                      <b>{r.MARCA}</b>
                      <div className="flex gap-2">
                        {["LOGO", "FOTO"].map((f) =>
                          r[f] ? (
                            <img
                              key={f}
                              src={r[f]}
                              alt={r.MARCA + " " + f}
                              className="h-12 w-16 object-contain"
                            />
                          ) : (
                            <span key={f}>Falta {f.toLowerCase()}</span>
                          ),
                        )}
                      </div>
                    </td>
                    <td>
                      {!r.ATIVA.match(/^true$/i)
                        ? "Inativa"
                        : r.FIM && r.FIM < today
                          ? "Vencida"
                          : r.INICIO && r.INICIO > today
                            ? "Futura"
                            : r.FIM
                              ? `Vigente · vence em ${Math.ceil((Date.parse(r.FIM) - Date.parse(today)) / 86400000)} dias`
                              : "Vigente"}
                    </td>
                    <td>
                      <details>
                        <summary className="cursor-pointer">
                          {r.ID} · editar
                        </summary>
                        <div className="grid grid-cols-2 gap-2 p-2">
                          {fields(
                            r,
                            i,
                            "briefing",
                            VDV_BRIEFING_COLUMNS.filter(
                              (c) =>
                                ![
                                  "VERSAO",
                                  "HERO",
                                  "HERO_IMG",
                                  "HERO_ALT",
                                  "HERO_LINK",
                                  "NOME_CARTAO",
                                  "TEMA",
                                  "ASSUNTO",
                                  "PREHEADER",
                                  "ASSUNTO_V2",
                                  "PREHEADER_V2",
                                  "SAUDACAO",
                                  "SAUDACAO_SEM_NOME",
                                  "INTRO",
                                  "CARTAO_PADRAO",
                                  "CTA",
                                  "TITULO_CONDICOES",
                                  "RODAPE_CONDICOES",
                                  "COR_FUNDO",
                                  "COR_TEXTO",
                                  "COR_TITULO",
                                  "COR_TEMA",
                                ].includes(c),
                            ),
                          )}
                        </div>
                      </details>
                    </td>
                  </tr>
                ) : null,
              )}
            </tbody>
          </table>
        </div>
      </section>
      <section className="space-y-3 rounded-xl border bg-white p-4">
        <div className="flex flex-wrap gap-2">
          <label>
            Versão{" "}
            <select
              className={input}
              value={version}
              onChange={(e) => setVersion(e.target.value)}
            >
              {[
                ...new Set(
                  draft.briefing.filter((r) => r.VERSAO).map((r) => r.VERSAO),
                ),
              ].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
          <input
            aria-label="Nova versão"
            placeholder="NATAL26_V1"
            className={input}
            value={newVersion}
            onChange={(e) => setNewVersion(e.target.value)}
          />
          <button className={btn} onClick={duplicate}>
            Duplicar versão
          </button>
        </div>
        <h3 className="font-bold">Tema e heros</h3>
        <div className="grid gap-3 lg:grid-cols-3">
          {draft.briefing.map((r, i) =>
            r.VERSAO === version && ["TEMA", "HERO"].includes(r.TIPO) ? (
              <details key={r.ID} className="rounded border p-3">
                <summary>
                  {r.TIPO} · {r.HERO || r.TEMA}
                  {r.HERO_IMG && (
                    <img
                      src={r.HERO_IMG}
                      alt={r.HERO_ALT}
                      className="my-2 max-h-32"
                    />
                  )}
                </summary>
                <div className="grid gap-2">
                  {fields(
                    r,
                    i,
                    "briefing",
                    r.TIPO === "HERO"
                      ? [
                          "HERO",
                          "ATIVA",
                          "HERO_IMG",
                          "HERO_ALT",
                          "HERO_LINK",
                          "NOME_CARTAO",
                        ]
                      : VDV_BRIEFING_COLUMNS.slice(25).concat(
                          "ATIVA",
                          "INICIO",
                          "FIM",
                        ),
                  )}
                </div>
              </details>
            ) : null,
          )}
        </div>
        <h3 className="font-bold">Vitrines · arraste para reordenar</h3>
        <button
          className={btn}
          onClick={() => {
            const group = window
              .prompt("Grupo da vitrine:")
              ?.trim()
              .toUpperCase();
            if (!group) return;
            const cell = window
              .prompt("Célula da vitrine:", "TODAS")
              ?.trim()
              .toUpperCase();
            if (!cell) return;
            const existing = draft.movimento.filter(
              (r) =>
                r.VERSAO === version && r.GRUPO === group && r.CELULA === cell,
            );
            const position = [1, 2, 3, 4, 5, 6].find(
              (p) => !existing.some((r) => +r.POSICAO === p),
            );
            if (!position) {
              setMessage("Vitrine já contém 6 posições.");
              return;
            }
            setDraft((d) => ({
              ...d,
              movimento: [
                ...d.movimento,
                {
                  VERSAO: version,
                  GRUPO: group,
                  CELULA: cell,
                  POSICAO: String(position),
                  OFERTA_ID: "",
                  ATIVA: "True",
                  __source: "gaas",
                },
              ],
            }));
            setDirty(true);
          }}
        >
          Adicionar posição
        </button>
        <div className="flex gap-3 overflow-x-auto">
          {groups.map((g) => {
            const rows = draft.movimento
              .map((r, i) => ({ r, i }))
              .filter(
                ({ r }) =>
                  r.VERSAO === version && r.GRUPO + "|" + r.CELULA === g,
              )
              .sort((a, b) => +a.r.POSICAO - +b.r.POSICAO);
            const valid = rows.filter(
              ({ r }) =>
                r.ATIVA === "True" &&
                draft.briefing.some(
                  (b) => b.ID === r.OFERTA_ID && vdvValidOffer(b, today),
                ),
            ).length;
            return (
              <div key={g} className="min-w-64 rounded-lg border p-3">
                <b className="text-xs">
                  {g} · {Math.min(3, valid)}/3 válidas
                </b>
                {rows.map(({ r, i }) => (
                  <div
                    draggable
                    onDragStart={() => setDrag(i)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => {
                      if (
                        drag === null ||
                        drag === i ||
                        !rows.some((x) => x.i === drag)
                      )
                        return;
                      const ordered = rows
                        .map((x) => x.i)
                        .filter((x) => x !== drag);
                      ordered.splice(ordered.indexOf(i), 0, drag);
                      setDraft((d) => ({
                        ...d,
                        movimento: d.movimento.map((m, idx) =>
                          ordered.includes(idx)
                            ? {
                                ...m,
                                OFERTA_ID:
                                  d.movimento[
                                    ordered[rows.findIndex((x) => x.i === idx)]
                                  ].OFERTA_ID,
                                ATIVA:
                                  d.movimento[
                                    ordered[rows.findIndex((x) => x.i === idx)]
                                  ].ATIVA,
                                __source: "gaas",
                              }
                            : m,
                        ),
                      }));
                      setDirty(true);
                      setDrag(null);
                    }}
                    key={r.POSICAO}
                    className="my-2 rounded border bg-slate-50 p-2"
                  >
                    <span className="text-xs">
                      Posição {r.POSICAO}
                      {+r.POSICAO > 3 ? " · reserva" : ""}
                    </span>
                    {fields(r, i, "movimento", ["OFERTA_ID", "ATIVA"])}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </section>
      <section className="rounded-xl border bg-white">
        <div className="flex gap-2 p-3">
          <button className={btn} onClick={() => setTouch("V1")}>
            E-mail 1 · persona
          </button>
          <button className={btn} onClick={() => setTouch("V2")}>
            E-mail 2 · cartão
          </button>
          <button
            className={btn}
            onClick={() => download(`VDV_Email_${touch}.html`, source)}
          >
            Exportar HTML {touch}
          </button>
        </div>
        <VdvSampleControls
          sample={{ ...sample, ID_VERSAO_OFERTAS: version }}
          onChange={(s) => {
            setSample(s);
            setVersion(s.ID_VERSAO_OFERTAS);
          }}
          today={today}
          onDateChange={onDateChange}
          preview={preview}
        />
        <SfmcEnvelopeGuide source={source} />
        {rendered &&
          (rendered.diagnostics.length ? (
            <p role="alert">{rendered.diagnostics.join("; ")}</p>
          ) : (
            <iframe
              title="Prévia Vai de Visa"
              sandbox=""
              srcDoc={rendered.html}
              className="h-[900px] w-full border-0"
            />
          ))}
      </section>
    </div>
  );
}
