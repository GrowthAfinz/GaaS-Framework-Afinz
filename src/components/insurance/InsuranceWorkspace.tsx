import React, { useEffect, useState } from "react";
import { InsuranceReportViews } from "./InsuranceReportViews";
import {
  ReportWorkspaceHeader,
  ReportKpiStrip,
  ReportDeliveryLayout,
  type ReportView,
} from "../relatorio/ReportWorkspace";
import {
  insuranceScorecard,
  formatInsuranceNumber,
  formatInsuranceMoney,
} from "./insuranceReportModel";
import {
  InsurancePacket,
  InsuranceMetric,
  comparePackets,
} from "./insuranceCore";
import { parseInsuranceFiles } from "./insuranceParser";
import { createReviewPackage, inspectReferencePptx } from "./insuranceOffice";
import {
  archiveInsurancePackage,
  bindInsuranceNote,
  insuranceNoteChoices,
  insuranceArtifactUrl,
  certifyInsuranceSnapshot,
  insuranceRole,
  listInsuranceSnapshots,
  prepareInsuranceNote,
  readInsuranceSnapshot,
  readInsuranceReportSnapshot,
  rejectInsuranceSnapshot,
  restoreInsuranceSources,
  saveInsuranceSnapshot,
  submitInsuranceNote,
  SnapshotRow,
} from "./insuranceService";

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
const formatMetric = (m: InsuranceMetric) =>
  m.value === null
    ? "—"
    : m.unit === "ratio"
      ? (m.value * 100).toLocaleString("pt-BR", { maximumFractionDigits: 2 }) +
        "%"
      : m.unit === "BRL"
        ? m.value.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })
        : m.value.toLocaleString("pt-BR");

export function InsuranceWorkspace({
  initialPacket,
}: {
  initialPacket?: InsurancePacket;
}) {
  const [packet, setPacket] = useState<InsurancePacket | null>(
      initialPacket || null,
    ),
    [files, setFiles] = useState<File[]>([]),
    [pptx, setPptx] = useState<File | null>(null);
  const [editorialTargets, setEditorialTargets] = useState<
      { key: string; slide: number; text: string }[]
    >([]),
    [editorialTarget, setEditorialTarget] = useState("");
  const [snapshots, setSnapshots] = useState<SnapshotRow[]>([]),
    [selected, setSelected] = useState<SnapshotRow | null>(null);
  const [role, setRole] = useState("none"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const [noteChoices, setNoteChoices] = useState<
      { id: string; title: string; relative_path: string }[]
    >([]),
    [noteChoice, setNoteChoice] = useState("");
  const [baseline, setBaseline] = useState<InsurancePacket | null>(null),
    [rejection, setRejection] = useState("");
  const [product, setProduct] = useState("all"),
    [period, setPeriod] = useState("window_total"),
    [resolution, setResolution] = useState<Record<string, string>>({});
  const [tab, setTab] = useState<
    "sources" | "exports" | "scenarios" | "changes" | "portfolio"
  >("exports");
  const run = async (work: () => Promise<void>) => {
    setBusy(true);
    setError("");
    try {
      await work();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };
  useEffect(() => {
    let active = true;
    if (initialPacket) return;
    insuranceRole()
      .then(async (r) => {
        if (!active) return;
        setRole(r);
        if (r !== "none") {
          const rows = await listInsuranceSnapshots();
          if (active) setSnapshots(rows);
          const latest = rows.find((s) => s.status === "certified") || rows[0];
          if (active && latest) {
            const saved = await readInsuranceReportSnapshot(latest.id);
            if (active) {
              setSelected(saved);
              setPacket(saved.manifest!);
            }
          }
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [initialPacket]);
  const writer = ["analyst", "publisher", "admin"].includes(role),
    publisher = ["publisher", "admin"].includes(role);
  useEffect(() => {
    let active = true;
    if (!publisher) return;
    insuranceNoteChoices()
      .then((rows) => {
        if (active) setNoteChoices(rows);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [publisher]);
  const [reportMode, setReportMode] = useState<ReportView>("performance");
  const [hydratingReport, setHydratingReport] = useState(false);
  useEffect(() => {
    let active = true;
    if (reportMode !== 'xlsx' || !packet?.projection_only || !selected) { setHydratingReport(false); return; }
    setHydratingReport(true);
    readInsuranceSnapshot(selected.id).then(full => {
      if (active) { setSelected(full); setPacket(full.manifest!); }
    }).catch(e => { if (active) setError(e.message); }).finally(() => { if (active) setHydratingReport(false); });
    return () => { active = false; };
  }, [reportMode, packet?.projection_only, selected?.id]);

  const score = packet
    ? insuranceScorecard(packet.metrics, product, period)
    : null;
  return (
    <section className="space-y-8" aria-label="Relatórios de Seguros">
      {hydratingReport && <p role="status" className="text-sm text-slate-500">Carregando os arquivos e as evidências desta versão…</p>}
      <ReportWorkspaceHeader
        title="Relatórios | Seguros"
        view={reportMode}
        onViewChange={setReportMode}
        description={
          <>
            {packet
              ? `${packet.coverage.dispatches} registros de comunicação · ${packet.periodStart} – ${packet.periodEnd}`
              : "Selecione uma versão ou prepare uma nova carga em Relatórios"}{" "}
            · {product === "all" ? "Mulher e Residencial" : product} ·
            Confirmação após formulário da LP
          </>
        }
        actions={
          <button
            type="button"
            onClick={() => {
              setReportMode("xlsx");
              setTab("sources");
            }}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-white/30 bg-white px-4 py-2.5 text-xs font-black text-cyan-800 shadow-sm transition hover:bg-cyan-50"
          >
            Fontes e revisão
          </button>
        }
        summaryStrip={
          reportMode === "performance" ? (
            <ReportKpiStrip
              items={[
                {
                  label: "Cadastros na LP",
                  value: formatInsuranceNumber(score?.registrations ?? null),
                },
                {
                  label: "Contratações",
                  value: formatInsuranceNumber(score?.contracts ?? null),
                },
                {
                  label: "Investimento digital",
                  value: formatInsuranceMoney(score?.spend ?? null),
                },
                {
                  label: "Custo/Contratação",
                  value: formatInsuranceMoney(score?.costPerContract ?? null),
                },
              ]}
            />
          ) : null
        }
      />
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          {error}
        </div>
      )}
      {notice && (
        <p role="status" className="text-sm text-cyan-800">
          {notice}
        </p>
      )}
      <div className="flex flex-wrap items-end gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <label className="text-sm">
          Versão salva
          <select
            aria-label="Versão salva"
            className="ml-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm"
            disabled={busy}
            value={selected?.id || ""}
            onChange={(e) => {
              const id = e.target.value;
              if (!id) return;
              void run(async () => {
                const s = await readInsuranceReportSnapshot(id);
                setSelected(s);
                setPacket(s.manifest!);
                setFiles([]);
                setResolution({});
                setPeriod("window_total");
                setProduct("all");
              });
            }}
          >
            <option value="">Selecione uma versão</option>
            {snapshots.map((s) => (
              <option key={s.id} value={s.id}>
                {s.period_start} — {s.period_end} ·{" "}
                {s.status === "certified"
                  ? "Certificada"
                  : s.status === "rejected"
                    ? "Rejeitada"
                    : "Em revisão"}{" "}
                · {new Date(s.created_at).toLocaleString("pt-BR")}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Produto
          <select
            aria-label="Produto"
            className="ml-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm"
            value={product}
            onChange={(e) => setProduct(e.target.value)}
          >
            <option value="all">Mulher e Residencial</option>
            <option value="mulher">Mulher</option>
            <option value="residencial">Residencial</option>
          </select>
        </label>
        <label className="text-sm">
          Período
          <select
            aria-label="Período dos seguros"
            className="ml-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            <option value="window_total">Janela completa</option>
            {[
              ...new Set(
                packet?.metrics
                  .filter((m) => m.period !== "window_total")
                  .map((m) => m.period),
              ),
            ]
              .sort()
              .map((p) => (
                <option key={p}>{p}</option>
              ))}
          </select>
        </label>
      </div>
      {packet && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600">
          <strong
            className={
              selected?.status === "certified"
                ? "text-emerald-700"
                : "text-amber-700"
            }
          >
            {selected?.status === "certified"
              ? "Versão certificada"
              : "Dados em revisão"}
          </strong>
          {packet.issues
            .filter((i) => /parcial/i.test(i.message))
            .map((i) => (
              <span key={i.code}>{i.message}</span>
            ))}
          <button
            type="button"
            className="ml-auto font-semibold text-cyan-700"
            onClick={() => {
              setReportMode("xlsx");
              setTab("sources");
            }}
          >
            Ver fontes e limites
          </button>
        </div>
      )}
      {reportMode === "xlsx" && (
        <nav
          aria-label="Opções dos relatórios de Seguros"
          className="flex flex-wrap gap-2 border-b pb-3"
        >
          {(
            [
              ["exports", "Arquivos e comitê"],
              ["sources", "Fontes e revisão"],
              ["portfolio", "Carteira"],
              ["scenarios", "Cenários"],
              ["changes", "Versões"],
            ] as const
          ).map(([key, label]) => (
            <button
              type="button"
              key={key}
              aria-pressed={tab === key}
              onClick={() => setTab(key)}
              className={`rounded-lg px-3 py-2 text-xs font-semibold ${tab === key ? "bg-slate-900 text-white" : "bg-white text-slate-600 hover:bg-slate-100"}`}
            >
              {label}
            </button>
          ))}
        </nav>
      )}
      {!packet && (
        <p className="py-6 text-sm text-slate-600">
          Nenhum conjunto selecionado. Abra uma versão salva ou prepare uma nova
          carga na aba Relatórios.
          <button
            type="button"
            className="ml-3 font-semibold text-cyan-700 underline"
            onClick={() => setReportMode("xlsx")}
          >
            Abrir relatórios e fontes
          </button>
        </p>
      )}
      {packet && reportMode !== "xlsx" && (
        <InsuranceReportViews
          mode={reportMode}
          packet={packet}
          product={product}
          period={period}
        />
      )}
      {packet && !packet.projection_only && reportMode === "xlsx" && tab === "scenarios" && (
        <section className="space-y-3">
          <h2 className="font-semibold">Premissas e cenário da referência</h2>
          <p className="text-sm text-slate-600">
            Simulação histórica do XLSX. Não representa receita realizada ou
            efeito causal comprovado. Novas premissas exigem outra versão e
            revisão.
          </p>
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="p-2 text-left">Premissa / resultado</th>
                <th className="p-2 text-right">Mulher</th>
                <th className="p-2 text-right">Residencial</th>
              </tr>
            </thead>
            <tbody>
              {[
                139, 140, 141, 144, 145, 149, 159, 160, 161, 162, 163, 167, 169,
                170, 174,
              ].map((row) => {
                const cells = packet.sources.find(
                  (s) => s.sheets["Resumo Comitê"],
                )!.sheets["Resumo Comitê"];
                return (
                  <tr key={row} className="border-b">
                    <td className="p-2">
                      {String(cells["B" + row]?.value || "")}
                    </td>
                    {["D", "E"].map((c) => (
                      <td key={c} className="p-2 text-right">
                        {typeof cells[c + row]?.value === "number"
                          ? (cells[c + row].value as number).toLocaleString(
                              "pt-BR",
                              { maximumFractionDigits: 2 },
                            )
                          : "—"}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="text-xs text-slate-500">
            Preserva os valores armazenados na referência. A projeção financeira
            usa safras e mensalidades, sem cancelamento; não equivale
            automaticamente a caixa em 12 meses.
          </p>
        </section>
      )}
      {packet && !packet.projection_only && reportMode === "xlsx" && tab === "changes" && (
        <section className="space-y-4">
          <h2 className="font-semibold">Diferenças entre versões</h2>
          <label className="block text-sm">
            Comparar com
            <select
              className="ml-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm"
              onChange={(e) => {
                const id = e.target.value;
                if (!id) {
                  setBaseline(null);
                  return;
                }
                void run(async () =>
                  setBaseline((await readInsuranceSnapshot(id)).manifest!),
                );
              }}
            >
              <option value="">Selecione a versão anterior</option>
              {snapshots
                .filter((s) => s.id !== selected?.id)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.period_start} — {s.period_end} · {s.created_at}
                  </option>
                ))}
            </select>
          </label>
          <p className="text-sm text-slate-600">
            Mudanças de valor ou disponibilidade. A comparação não transforma
            uma janela parcial em mês fechado.
          </p>
          {baseline ? (
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="p-2 text-left">
                    Produto / período / indicador
                  </th>
                  <th className="p-2 text-right">Antes</th>
                  <th className="p-2 text-right">Agora</th>
                </tr>
              </thead>
              <tbody>
                {comparePackets(baseline, packet).map((c) => (
                  <tr className="border-b" key={c.key}>
                    <td className="p-2">{c.key.replace(/\|/g, " · ")}</td>
                    <td className="p-2 text-right">
                      {c.before ? formatMetric(c.before) : "Ausente"}
                    </td>
                    <td className="p-2 text-right">
                      {c.after ? formatMetric(c.after) : "Ausente"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-slate-500">
              Selecione uma versão para identificar alterações.
            </p>
          )}
        </section>
      )}
      {packet && !packet.projection_only && reportMode === "xlsx" && tab === "portfolio" && (
        <section className="space-y-3">
          <h2 className="font-semibold">Contexto do portfólio de seguros</h2>
          <p className="text-sm text-slate-600">
            Totais da companhia, com a janela própria da fonte. Incluem outros
            produtos e canais; não devem ser somados ao recorte digital de
            Mulher e Residencial.
          </p>
          {packet.portfolio?.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="p-2 text-left">Competência</th>
                    <th className="p-2 text-left">Indicador</th>
                    <th className="p-2 text-right">Valor</th>
                    <th className="p-2 text-left">Origem</th>
                  </tr>
                </thead>
                <tbody>
                  {packet.portfolio.map((m) => (
                    <tr key={m.code + m.period} className="border-b">
                      <td className="p-2">{m.period}</td>
                      <td className="p-2">{m.label}</td>
                      <td className="p-2 text-right">
                        {m.value === null
                          ? "—"
                          : m.value.toLocaleString("pt-BR", {
                              maximumFractionDigits: m.unit === "ratio" ? 4 : 0,
                            })}
                        {m.unit === "ratio" ? " seguros/conta" : ""}
                      </td>
                      <td className="p-2 text-xs text-slate-500">{m.source}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              Inclua o Radar de Portfólio para carregar este contexto. O
              restante do acompanhamento permanece disponível.
            </p>
          )}
        </section>
      )}
      {packet && !packet.projection_only && reportMode === "xlsx" && tab === "sources" && (
        <div className="space-y-5">
          <h2 className="font-semibold">Validações da carga</h2>
          {publisher && (
            <div className="space-y-2 border-b pb-4">
              <label className="block text-sm">
                Nota que receberá o acompanhamento
                <select
                  className="ml-2 max-w-full rounded border p-2"
                  value={noteChoice}
                  onChange={(e) => setNoteChoice(e.target.value)}
                >
                  <option value="">Selecione uma nota existente</option>
                  {noteChoices.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.title}
                    </option>
                  ))}
                </select>
              </label>
              <button
                disabled={busy || !noteChoice}
                className="rounded border px-3 py-2 text-sm disabled:opacity-40"
                onClick={() =>
                  void run(async () => {
                    await bindInsuranceNote(noteChoice);
                    setNotice(
                      "Nota vinculada. O bloco de resultados acompanhará o próximo snapshot certificado, preservando as versões anteriores.",
                    );
                  })
                }
              >
                Vincular nota ao acompanhamento
              </button>
            </div>
          )}
          {packet.issues.map((i, index) => (
            <div key={i.code + index} className="border-b pb-4 text-sm">
              <p className="font-medium">
                {i.severity === "blocking"
                  ? "Revisão necessária"
                  : "Limite de leitura"}{" "}
                · {i.source}
              </p>
              <p className="mt-1 text-slate-600">{i.message}</p>
              {publisher &&
                i.severity === "blocking" &&
                i.code !== "FORMULA_CACHE_MISSING" && (
                  <label className="mt-2 block">
                    Decisão e evidência da revisão
                    <textarea
                      className="mt-1 w-full rounded border p-2"
                      value={resolution[i.code] || ""}
                      onChange={(e) =>
                        setResolution({
                          ...resolution,
                          [i.code]: e.target.value,
                        })
                      }
                    />
                  </label>
                )}
            </div>
          ))}
          {publisher && selected?.status === "built" && (
            <div className="space-y-3">
              <label className="block text-sm">
                Motivo para rejeitar a carga, se necessário
                <textarea
                  className="mt-1 w-full rounded border p-2"
                  value={rejection}
                  onChange={(e) => setRejection(e.target.value)}
                />
              </label>
              <button
                disabled={busy || rejection.trim().length < 20}
                className="rounded border px-4 py-2 text-sm disabled:opacity-40"
                onClick={() =>
                  void run(async () => {
                    await rejectInsuranceSnapshot(selected, rejection);
                    setSelected(await readInsuranceSnapshot(selected.id));
                    setSnapshots(await listInsuranceSnapshots());
                    setNotice("Carga rejeitada com histórico preservado.");
                  })
                }
              >
                Rejeitar carga
              </button>
              <button
                disabled={busy}
                className="rounded bg-cyan-700 px-4 py-2 text-sm text-white"
                onClick={() =>
                  void run(async () => {
                    await certifyInsuranceSnapshot(selected, resolution);
                    const s = await readInsuranceSnapshot(selected.id);
                    setSelected(s);
                    setSnapshots(await listInsuranceSnapshots());
                    setNotice(
                      "Snapshot certificado. As limitações registradas continuam visíveis.",
                    );
                  })
                }
              >
                Certificar com as decisões registradas
              </button>
            </div>
          )}
          <details>
            <summary className="cursor-pointer text-sm">
              Arquivos e rastreabilidade
            </summary>
            <ul className="mt-2 space-y-2 text-xs">
              {packet.sources.map((s) => (
                <li key={s.sha256}>
                  {s.name} · SHA-256 {s.sha256}
                </li>
              ))}
            </ul>
          </details>
        </div>
      )}
      {writer && reportMode === "xlsx" && (
        <details
          open={!packet}
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <summary className="cursor-pointer font-semibold">
            Preparar nova carga
          </summary>
          <div className="mt-4 space-y-3 text-sm">
            <p>
              Selecione Performance Geral Seguros e, opcionalmente, Radar. A
              leitura inicial ocorre neste navegador; salvar é uma ação
              separada.
            </p>
            <input
              aria-label="Arquivos de entrada de Seguros"
              className="block max-w-full text-xs text-slate-500 file:mr-4 file:rounded-lg file:border-0 file:bg-cyan-50 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-cyan-700"
              type="file"
              multiple
              accept=".xlsx"
              onChange={(e) => setFiles(Array.from(e.target.files || []))}
            />
            <div className="flex gap-3">
              <button
                disabled={busy || !files.length}
                className="rounded border px-4 py-2 disabled:opacity-40"
                onClick={() =>
                  void run(async () => {
                    setPacket(await parseInsuranceFiles(files));
                    setSelected(null);
                    setResolution({});
                    setNotice("Carga preparada para revisão, sem publicar.");
                  })
                }
              >
                Simular ingestão
              </button>
              <button
                disabled={busy || !packet || !!selected}
                className="rounded bg-cyan-700 px-4 py-2 text-white disabled:opacity-40"
                onClick={() =>
                  void run(async () => {
                    const result = await saveInsuranceSnapshot(packet!, files);
                    const s = await readInsuranceSnapshot(result.id);
                    setSelected(s);
                    setPacket(s.manifest!);
                    setSnapshots(await listInsuranceSnapshots());
                    setNotice(
                      result.reused
                        ? "A carga já existia; nenhuma duplicação."
                        : "Snapshot salvo para revisão.",
                    );
                  })
                }
              >
                Salvar para revisão
              </button>
            </div>
          </div>
        </details>
      )}
      {packet && !packet.projection_only && reportMode === "xlsx" && tab === "exports" && (
        <ReportDeliveryLayout>
          <div className="order-1 min-w-0 space-y-4 rounded-2xl border border-slate-200 bg-white p-5 text-sm shadow-sm">
            <h2 className="font-semibold">Arquivos no modelo de referência</h2>
            <p>
              Os originais salvos são recuperados do armazenamento privado e
              conferidos por hash. Para versões locais, selecione os XLSX de
              entrada. O pacote é uma prévia para revisão; títulos, cenários e
              conclusões do comitê precisam de conferência editorial.
            </p>
            <input
              aria-label="Originais para exportação"
              className="block max-w-full text-xs text-slate-500 file:mr-4 file:rounded-lg file:border-0 file:bg-cyan-50 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-cyan-700"
              type="file"
              accept=".xlsx"
              multiple
              onChange={(e) => setFiles(Array.from(e.target.files || []))}
            />
            <label className="block">
              PPTX do comitê de 30/10
              <input
                aria-label="Template PPTX do comitê"
                className="block max-w-full text-xs text-slate-500 file:mr-4 file:rounded-lg file:border-0 file:bg-cyan-50 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-cyan-700"
                type="file"
                accept=".pptx"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setPptx(file);
                  if (file)
                    void run(async () => {
                      const targets = await inspectReferencePptx(
                        await file.arrayBuffer(),
                      );
                      setEditorialTargets(targets);
                      setEditorialTarget(targets[0]?.key || "");
                    });
                }}
              />
            </label>
            {writer && editorialTargets.length > 0 && (
              <div className="space-y-2 border-y py-4">
                <h3 className="font-semibold">Revisão dos textos do comitê</h3>
                <label className="block">
                  Trecho
                  <select
                    className="ml-2 max-w-full rounded border p-2"
                    value={editorialTarget}
                    onChange={(e) => setEditorialTarget(e.target.value)}
                  >
                    {editorialTargets.map((t) => (
                      <option key={t.key} value={t.key}>
                        Slide {t.slide} · {t.text.slice(0, 75)}
                      </option>
                    ))}
                  </select>
                </label>
                <textarea
                  aria-label="Texto revisado do comitê"
                  className="min-h-28 w-full rounded border p-3"
                  value={
                    packet.editorial[editorialTarget] ??
                    editorialTargets.find((t) => t.key === editorialTarget)
                      ?.text ??
                    ""
                  }
                  onChange={(e) => {
                    setPacket({
                      ...packet,
                      editorial: {
                        ...packet.editorial,
                        [editorialTarget]: e.target.value,
                      },
                    });
                    setSelected(null);
                  }}
                />
                <p className="text-xs text-slate-500">
                  Uma mudança de texto prepara uma nova versão. Revise fontes,
                  afirmações e espaço no slide antes de publicar.
                </p>
              </div>
            )}
            <button
              disabled={
                busy ||
                (files.length !== packet.sources.length &&
                  !packet.sources.every((s) => s.storage_path))
              }
              className="rounded bg-cyan-700 px-4 py-2 text-white disabled:opacity-40"
              onClick={() =>
                void run(async () => {
                  download(
                    await createReviewPackage(
                      packet,
                      files.length
                        ? files
                        : await restoreInsuranceSources(packet),
                      pptx || undefined,
                      {
                        snapshot_id: selected?.id,
                        snapshot_hash: selected?.snapshot_hash,
                      },
                    ),
                    "Seguros_pacote_para_revisao.zip",
                  );
                  setNotice(
                    "Pacote de revisão gerado. Nenhuma publicação externa foi feita.",
                  );
                })
              }
            >
              Gerar pacote XLSX/PPTX para revisão
            </button>
            {writer && selected && (
              <button
                disabled={
                  busy ||
                  (files.length !== packet.sources.length &&
                    !packet.sources.every((s) => s.storage_path))
                }
                className="ml-3 rounded border px-4 py-2 disabled:opacity-40"
                onClick={() =>
                  void run(async () => {
                    await archiveInsurancePackage(
                      selected,
                      await createReviewPackage(
                        packet,
                        files.length
                          ? files
                          : await restoreInsuranceSources(packet),
                        pptx || undefined,
                        {
                          snapshot_id: selected?.id,
                          snapshot_hash: selected?.snapshot_hash,
                        },
                      ),
                    );
                    setSelected(await readInsuranceSnapshot(selected.id));
                    setNotice(
                      "Arquivos privados registrados no histórico, com QA pendente.",
                    );
                  })
                }
              >
                Guardar arquivos no histórico
              </button>
            )}
            {selected?.artifacts?.map((a) => (
              <button
                key={a.id}
                className="ml-3 rounded border px-3 py-2"
                onClick={() =>
                  void run(async () => {
                    const url = await insuranceArtifactUrl(a.storage_path);
                    window.open(url, "_blank", "noopener,noreferrer");
                  })
                }
              >
                Baixar {a.artifact_kind.toUpperCase()} · {a.qa_status}
              </button>
            ))}
            <button
              disabled={busy}
              className="ml-3 rounded border px-4 py-2"
              onClick={() =>
                void run(async () =>
                  download(
                    new Blob(
                      [
                        JSON.stringify(
                          await prepareInsuranceNote(packet, selected?.id),
                          null,
                          2,
                        ),
                      ],
                      { type: "application/json" },
                    ),
                    "Seguros_proposta_nota.json",
                  ),
                )
              }
            >
              Baixar rascunho de nota
            </button>
            {writer && selected?.status === "certified" && (
              <button
                disabled={busy}
                className="ml-3 rounded border px-4 py-2"
                onClick={() =>
                  void run(async () => {
                    const result = await submitInsuranceNote(selected);
                    setNotice(
                      `Proposta ${result.contributionId} enviada para revisão na Wiki. Nenhuma nota foi aprovada ou alterada.`,
                    );
                  })
                }
              >
                Enviar proposta para revisão na Wiki
              </button>
            )}
          </div>
          <aside className="order-2 space-y-4 rounded-2xl border border-slate-200 bg-white p-5 text-sm shadow-sm lg:sticky lg:top-6">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
              Report Live · Seguros
            </p>
            <h2 className="text-base font-bold text-slate-900">
              Pacote do comitê
            </h2>
            <p className="text-slate-600">
              XLSX e PPTX preservam o modelo de referência. A geração entrega
              uma prévia para revisão; não publica no documento vivo.
            </p>
            <p className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
              {selected?.status === "certified"
                ? "Fonte certificada. O arquivo gerado ainda requer conferência visual e editorial."
                : "Fonte em revisão. Certifique os dados antes de promover o resultado."}
            </p>
            <button
              type="button"
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-cyan-800"
              onClick={() => setTab("sources")}
            >
              Abrir fontes e revisão
            </button>
          </aside>
        </ReportDeliveryLayout>
      )}
      {busy && (
        <p role="status" className="text-sm text-cyan-700">
          Processando…
        </p>
      )}
    </section>
  );
}
