import { summarizeCrmCompatible } from "../../growth-learning/results/crmAnalysis";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  Download,
  FileJson,
  Library,
  RefreshCw,
  Send,
  Users,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { filesFromInput, parseVaultFiles } from "../vaultParser";
import type { VaultNoteInput } from "../vaultTypes";
import { fetchResultsSnapshot } from "../../growth-learning/results/resultsService";
import {
  cleanScope,
  duplicateIds,
  matchesScope,
  summarize,
} from "../../growth-learning/results/results.logic";
import type { ResultsDomain } from "../../growth-learning/results/results.types";
import {
  buildChangesArchive,
  buildKnowledgeArchive,
  compareInventory,
  downloadBytes,
  prepareChanges,
} from "./knowledgePack";
import {
  activeKnowledgeReport,
  canReviewKnowledge,
  downloadKnowledgePack,
  getKnowledgePack,
  contributionHistory,
  fetchKnowledgeSnapshot,
  listContributions,
  listKnowledgePacks,
  registerKnowledgePack,
  reviewContribution,
  submitContribution,
} from "./knowledgeService";
import {
  CONTRIBUTION_STATUS,
  type KnowledgeContribution,
  type KnowledgeManifest,
  type KnowledgePack,
  type KnowledgeSnapshot,
} from "./knowledge.types";

const input =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-cyan-600";
const button =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-cyan-600 disabled:opacity-50";
const date = (value: string | null | undefined) =>
  value ? new Date(value).toLocaleString("pt-BR") : "Não informado";
const failure = (e: unknown) =>
  e instanceof Error
    ? e.message
    : typeof e === "object" && e && "message" in e
      ? String(e.message)
      : "Não foi possível concluir. Tente novamente.";
export function KnowledgeWorkspace({
  onBack,
  initialObjective = "",
}: {
  onBack: () => void;
  initialObjective?: string;
}) {
  const { user } = useAuth();
  const [mode, setMode] = useState<"export" | "packs" | "contributions">(
    "export",
  );
  const [snapshot, setSnapshot] = useState<KnowledgeSnapshot | null>(null);
  const [packs, setPacks] = useState<KnowledgePack[]>([]);
  const [contributions, setContributions] = useState<KnowledgeContribution[]>(
    [],
  );
  const [reviewer, setReviewer] = useState(false);
  const [objective, setObjective] = useState(initialObjective);
  const [local, setLocal] = useState<VaultNoteInput[]>();
  const [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const [domain, setDomain] = useState<ResultsDomain | "none">("none");
  const [month, setMonth] = useState(
    new Date()
      .toLocaleDateString("en-CA", {
        timeZone: "America/Sao_Paulo",
        year: "numeric",
        month: "2-digit",
      })
      .slice(0, 7),
  );
  const [includeReport, setIncludeReport] = useState(false);
  const [scopeFields, setScopeFields] = useState<Record<string, string>>({});
  const [raw, setRaw] = useState(""),
    [packId, setPackId] = useState(""),
    [title, setTitle] = useState(""),
    [rationale, setRationale] = useState("");
  const [selected, setSelected] = useState<KnowledgeContribution | null>(null),
    [comment, setComment] = useState("");
  const [history, setHistory] = useState<
    { status: string; comment: string | null; created_at: string }[]
  >([]);
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [s, p, c, r] = await Promise.all([
        fetchKnowledgeSnapshot(),
        listKnowledgePacks(),
        listContributions(),
        canReviewKnowledge(),
      ]);
      setSnapshot(s);
      setPacks(p);
      setContributions(c);
      setReviewer(r);
    } catch (e) {
      setError(failure(e));
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    let active = true;
    setHistory([]);
    setComment("");
    if (selected)
      void contributionHistory(selected.id)
        .then((h) => {
          if (active) setHistory(h);
        })
        .catch((e) => {
          if (active) setError(failure(e));
        });
    return () => {
      active = false;
    };
  }, [selected]);
  async function perform(action: () => Promise<void>) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await action();
    } catch (e) {
      setError(failure(e));
    } finally {
      setBusy(false);
    }
  }
  async function exportPack() {
    if (!user) throw new Error("Entre na sua conta para exportar.");
    const current = await fetchKnowledgeSnapshot();
    setSnapshot(current);
    const datasets: KnowledgeManifest["datasets"] = [];
    if (domain !== "none") {
      if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))
        throw new Error("Escolha o mês dos resultados.");
      const entered = Object.fromEntries(
        Object.entries(scopeFields).filter(([, value]) => value),
      );
      if (!entered || Array.isArray(entered) || typeof entered !== "object")
        throw new Error("Os filtros devem ser um objeto JSON.");
      const scope = cleanScope(domain, entered);
      for (const [key, value] of Object.entries(entered))
        if (
          typeof value !== "string" ||
          String(scope[key as keyof typeof scope] ?? "") !== value
        )
          throw new Error(
            `Filtro não suportado: ${key}. Confira os campos indicados.`,
          );
      if (
        domain === "b2c" &&
        !["total", "serasa_api", "crm"].includes(scope.type)
      )
        throw new Error(
          "Selecione a origem B2C. As contribuições não podem ser somadas ao total.",
        );
      const data = await fetchResultsSnapshot(domain, user.id, true);
      const rows = data.rows.filter(
        (r) => r.date.startsWith(month) && matchesScope(r, scope),
      );
      const summary = {
        ...(domain === "crm"
          ? summarizeCrmCompatible(rows, duplicateIds(rows))
          : summarize(rows, duplicateIds(rows))),
        labels:
          domain === "crm"
            ? {
                primary: "Cartões registrados",
                secondary: "Propostas",
                spend: "Custo registrado",
                ratio: "Cartões / propostas (%)",
              }
            : domain === "renta"
              ? {
                  primary: "Cliques registrados",
                  secondary: "Base acionável",
                  spend: "Custo registrado",
                  ratio: "Cliques / base (%)",
                }
              : domain === "media"
                ? {
                    primary: "Cliques",
                    secondary: "Impressões",
                    spend: "Investimento",
                    ratio: "CTR (%)",
                  }
                : {
                    primary: "Emissões",
                    secondary: "Propostas",
                    spend: "Não aplicável",
                    ratio: "Emissões / propostas (%)",
                  },
        limits: [
          "Ausência de observação não é zero.",
          "Valores representam apenas registros conhecidos; confira usable e contagens known.",
          "Agregação reutiliza o contrato da Wiki; misturas de granularidade de mídia ficam indisponíveis.",
          "Conversões de mídia são eventos de plataforma, não cartões.",
          "Total B2C e contribuições por origem devem ser selecionados separadamente.",
        ],
      };

      datasets.push({
        domain,
        month,
        source: data.source,
        fetched_at: data.fetchedAt,
        scope: scope as Record<string, string>,
        summary,
      });
    }
    const result = await buildKnowledgeArchive(
      current,
      objective.trim(),
      local,
      datasets,
      includeReport ? await activeKnowledgeReport() : null,
    );
    await registerKnowledgePack(result.manifest, result.archive);
    downloadBytes(
      result.archive,
      `gaas-contexto-${result.manifest.created_at.slice(0, 10)}-${result.manifest.id.slice(0, 8)}.zip`,
    );
    setNotice(
      `Pacote registrado e download iniciado: ${result.manifest.notes.length} notas. Guarde o identificador ${result.manifest.id} para enviar contribuições.`,
    );
    setPacks(await listKnowledgePacks());
    setPackId(result.manifest.id);
  }
  const comparison = snapshot ? compareInventory(snapshot.notes, local) : null;
  const selectedPack = packs.find((p) => p.id === packId);
  async function submit() {
    if (!title.trim() || !rationale.trim())
      throw new Error("Informe título e justificativa com fontes.");
    const parsed = JSON.parse(raw);
    if (raw.length > 2000000)
      throw new Error("Limite de 2 MB por contribuição.");
    if (parsed.schema !== "gaas-knowledge-contribution/1")
      throw new Error("Use o modelo gaas-knowledge-contribution/1 do pacote.");
    const targetPack = parsed.pack_id || packId;
    if (!targetPack) throw new Error("Informe o identificador do pacote.");
    const pack =
      packs.find((p) => p.id === targetPack) ||
      (await getKnowledgePack(targetPack));
    if (!pack)
      throw new Error(
        "Selecione um pacote da lista ou informe seu UUID. O servidor validará as fontes.",
      );
    const source = await fetchKnowledgeSnapshot();
    const changes = await prepareChanges(parsed.changes, source.notes);
    const id = await submitContribution(
      targetPack,
      title.trim(),
      rationale.trim(),
      changes,
    );
    setContributions(await listContributions());
    setRaw("");
    setNotice(`Contribuição ${id.slice(0, 8)} enviada para revisão de Pablo.`);
  }
  async function review(status: string) {
    if (!selected) return;
    await reviewContribution(selected.id, status, comment);
    const items = await listContributions();
    setContributions(items);
    setSelected(items.find((c) => c.id === selected.id) || null);
    setSnapshot(await fetchKnowledgeSnapshot());
    setNotice(
      status === "incorporated"
        ? "Incorporação confirmada por hashes e sincronização concluída."
        : "Revisão registrada. Aprovação não altera o vault.",
    );
  }
  return (
    <section aria-label="Inteligência compartilhada" className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-3">
          <button type="button" className={button} onClick={onBack}>
            <ArrowLeft size={16} />
            Wiki
          </button>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Trabalhar com IA
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Leve o contexto do time à sua IA e devolva contribuições com
              evidência.
            </p>
          </div>
        </div>
        <Users size={22} className="text-cyan-700" />
      </header>
      <nav aria-label="Colaboração com IA" className="flex flex-wrap gap-2">
        {(
          [
            ["export", "Preparar contexto"],
            ["packs", "Pacotes de contexto"],
            ["contributions", "Contribuições"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            aria-current={mode === id ? "page" : undefined}
            onClick={() => {
              setMode(id);
              setSelected(null);
            }}
            className={`${button} ${mode === id ? "border-cyan-300 bg-cyan-50 text-cyan-900" : ""}`}
          >
            {label}
          </button>
        ))}
      </nav>
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
        >
          {error}{" "}
          <button
            type="button"
            onClick={() => void load()}
            className="underline"
          >
            Recarregar
          </button>
        </div>
      )}
      {notice && (
        <p
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900"
        >
          {notice}
        </p>
      )}
      {loading ? (
        <p
          role="status"
          className="rounded-xl border border-slate-200 bg-white p-6 text-slate-600"
        >
          Carregando acervo e colaboração…
        </p>
      ) : snapshot && mode === "export" ? (
        <>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(260px,1fr)]">
            <div className="space-y-5 rounded-xl border border-slate-200 bg-white p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700">
                  Conhecimento completo da operação
                </p>
                <h3 className="mt-2 text-xl font-semibold text-slate-900">
                  Um contexto comum para todo o time
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Regras de negócio, produtos, públicos, métricas, fontes,
                  operação, resultados documentados, arquitetura e instruções.
                  Todas as notas publicadas elegíveis são incluídas por padrão.
                </p>
              </div>
              <label className="block text-sm font-medium text-slate-700">
                O que você quer fazer com a IA?
                <textarea
                  value={objective}
                  maxLength={4000}
                  onChange={(e) => setObjective(e.target.value)}
                  placeholder="Ex.: entender a operação, planejar uma régua, preparar uma apresentação ou investigar resultados."
                  rows={3}
                  className={`${input} mt-2`}
                />
              </label>
              <details className="rounded-lg border border-slate-200 p-3">
                <summary className="cursor-pointer text-sm font-semibold text-slate-700">
                  Comparar com o vault do computador
                </summary>
                <p className="my-2 text-xs leading-5 text-slate-500">
                  Leitura local para comparar caminhos e hashes. Esta seleção
                  não sincroniza nem envia as notas locais.
                </p>
                <input
                  aria-label="Comparar pasta do vault local"
                  type="file"
                  multiple
                  {...({ webkitdirectory: "", directory: "" } as Record<
                    string,
                    string
                  >)}
                  onChange={(e) => {
                    const files = e.target.files;
                    if (files)
                      void perform(async () =>
                        setLocal(
                          await parseVaultFiles(await filesFromInput(files)),
                        ),
                      );
                  }}
                  className="max-w-full text-xs"
                />
                {comparison?.compared && (
                  <div className="mt-3 text-xs text-slate-600">
                    <p>
                      {comparison.local_count} locais ·{" "}
                      {comparison.only_local.length} apenas locais ·{" "}
                      {comparison.only_published.length} apenas publicadas ·{" "}
                      {comparison.changed.length} conteúdos diferentes
                    </p>
                    <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap">
                      {JSON.stringify(comparison, null, 2)}
                    </pre>
                  </div>
                )}
              </details>
              <details className="rounded-lg border border-slate-200 p-3">
                <summary className="cursor-pointer text-sm font-semibold text-slate-700">
                  Acrescentar resultados agregados
                </summary>
                <p className="my-2 text-xs leading-5 text-slate-500">
                  Selecione antes de consultar. Notas que descrevem tabelas não
                  são dados vivos. O pacote documental independe desta opção.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="text-xs">
                    Frente
                    <select
                      className={`${input} mt-1`}
                      value={domain}
                      onChange={(e) => {
                        setDomain(e.target.value as typeof domain);
                        setScopeFields({});
                      }}
                    >
                      <option value="none">Somente acervo documental</option>
                      <option value="crm">CRM Aquisição</option>
                      <option value="renta">Rentabilização e seguros</option>
                      <option value="media">Mídia paga</option>
                      <option value="b2c">Originação B2C</option>
                    </select>
                  </label>
                  <label className="text-xs">
                    Mês
                    <input
                      type="month"
                      value={month}
                      onChange={(e) => setMonth(e.target.value)}
                      className={`${input} mt-1`}
                    />
                  </label>
                </div>
                {domain !== "none" && (
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {(domain === "b2c"
                      ? [["type", "Origem B2C"]]
                      : domain === "media"
                        ? [
                            ["channel", "Plataforma"],
                            ["campaign", "Campanha"],
                            ["objective", "Objetivo"],
                            ["grain", "Granularidade"],
                          ]
                        : [
                            ["bu", "BU"],
                            ["segment", "Segmento"],
                            ["partner", "Parceiro"],
                            ["channel", "Canal"],
                            ["journey", "Jornada"],
                            ["safra", "Safra"],
                          ]
                    ).map(([key, label]) => (
                      <label key={key} className="text-xs">
                        {label}
                        {key === "type" ? (
                          <select
                            value={scopeFields.type || ""}
                            onChange={(e) =>
                              setScopeFields((v) => ({
                                ...v,
                                type: e.target.value,
                              }))
                            }
                            className={`${input} mt-1`}
                          >
                            <option value="">Selecione uma origem</option>
                            <option value="total">Total B2C</option>
                            <option value="serasa_api">Serasa API</option>
                            <option value="crm">CRM registrado</option>
                          </select>
                        ) : (
                          <input
                            value={scopeFields[key] || ""}
                            onChange={(e) =>
                              setScopeFields((v) => ({
                                ...v,
                                [key]: e.target.value,
                              }))
                            }
                            placeholder="Todos · ou informe o valor exato"
                            className={`${input} mt-1`}
                          />
                        )}
                      </label>
                    ))}
                  </div>
                )}
              </details>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={includeReport}
                  onChange={(e) => setIncludeReport(e.target.checked)}
                />
                Incluir referência à publicação vigente do Report Live
              </label>
              <p className="text-xs leading-5 text-slate-500">
                Inclui versão, período e links. A referência não copia o PDF ou
                os Slides.
              </p>
              <button
                type="button"
                disabled={busy || !snapshot.notes.length || !snapshot.stable}
                className={`${button} border-cyan-700 bg-cyan-700 text-white hover:bg-cyan-800`}
                onClick={() => void perform(exportPack)}
              >
                <Download size={16} />
                {busy ? "Preparando pacote…" : "Baixar pacote completo"}
              </button>
            </div>
            <aside className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
              <Library size={24} className="text-cyan-700" />
              <h3 className="font-semibold text-slate-900">
                O que acompanha o ZIP
              </h3>
              <ul className="space-y-3 text-sm text-slate-600">
                {[
                  "Vault em Markdown com pastas e metadados",
                  "Guia de entrada e índice por assunto",
                  "Ontologia unificada e divisões por assunto",
                  "Mapa de localização no GaaS",
                  "Instruções de evidência e limites para a IA",
                  "Manifesto de hashes, datas e exclusões",
                  "Modelo de contribuição para devolver ao time",
                ].map((t) => (
                  <li key={t}>• {t}</li>
                ))}
              </ul>
              <div className="border-t border-slate-200 pt-4 text-xs leading-6 text-slate-500">
                <p>{snapshot.notes.length} notas publicadas</p>
                <p>
                  Último sync concluído: {date(snapshot.sync?.completed_at)}
                </p>
                {snapshot.latest_attempt?.status !== "completed" && (
                  <p className="text-amber-800">
                    Existe sincronização{" "}
                    {snapshot.latest_attempt?.status === "running"
                      ? "em andamento"
                      : "com falha"}
                    . Exportação exige acervo estável.
                  </p>
                )}
                <p>
                  {comparison?.compared
                    ? "Comparação local incluída no manifesto."
                    : "Acervo local ainda não comparado; arquivos locais não sincronizados não entram no pacote."}
                </p>
                <p>
                  Você escolhe a IA e envia os arquivos. Anexos binários não
                  estão publicados no leitor.
                </p>
              </div>
            </aside>
          </div>
        </>
      ) : null}
      {!loading && mode === "packs" && (
        <div className="space-y-3">
          {!packs.length ? (
            <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
              Nenhum pacote registrado. Prepare o primeiro contexto para
              começar.
            </p>
          ) : (
            packs.map((p) => (
              <article
                key={p.id}
                className="rounded-xl border border-slate-200 bg-white p-4"
              >
                <h3 className="font-semibold text-slate-900">{p.title}</h3>
                <p className="mt-1 text-xs text-slate-500">
                  {date(p.created_at)} · {p.manifest.notes.length} notas ·{" "}
                  {Math.round(p.manifest.bytes / 1024)} KB de notas
                </p>
                <p className="mt-2 break-all font-mono text-xs text-slate-500">
                  {p.id}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    className={button}
                    onClick={() =>
                      void perform(async () =>
                        downloadBytes(
                          await downloadKnowledgePack(p),
                          `gaas-contexto-${p.id}.zip`,
                        ),
                      )
                    }
                  >
                    <Download size={14} />
                    Baixar esta versão
                  </button>
                  <button
                    type="button"
                    className={button}
                    onClick={() =>
                      downloadBytes(
                        new TextEncoder().encode(
                          JSON.stringify(p.manifest, null, 2),
                        ),
                        `manifesto-${p.id}.json`,
                        "application/json",
                      )
                    }
                  >
                    <FileJson size={14} />
                    Baixar manifesto
                  </button>
                  <button
                    type="button"
                    className={button}
                    onClick={() => {
                      setPackId(p.id);
                      setMode("contributions");
                    }}
                  >
                    Enviar contribuição deste pacote
                  </button>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Versão preservada em armazenamento privado para a equipe. Uma
                  nova exportação usa o acervo atual e cria outra versão.
                </p>
              </article>
            ))
          )}
        </div>
      )}
      {!loading && mode === "contributions" && (
        <div className="grid items-start gap-4 xl:grid-cols-2">
          <div className="space-y-4">
            <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="text-lg font-semibold text-slate-900">
                Enviar contribuição
              </h3>
              <p className="text-sm leading-6 text-slate-500">
                A resposta da IA entra em revisão. Apenas Pablo incorpora
                alterações no vault local e atualiza o GaaS.
              </p>
              <label className="block text-xs">
                Pacote de origem
                <select
                  className={`${input} mt-1`}
                  value={packId}
                  onChange={(e) => setPackId(e.target.value)}
                >
                  <option value="">Selecione</option>
                  {packs.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} · {p.id.slice(0, 8)}
                    </option>
                  ))}
                </select>
              </label>
              {selectedPack && (
                <p className="text-xs text-slate-500">
                  {selectedPack.manifest.notes.length} notas ·{" "}
                  {date(selectedPack.created_at)}
                </p>
              )}
              <label className="block text-xs">
                Título
                <input
                  className={`${input} mt-1`}
                  value={title}
                  maxLength={200}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </label>
              <label className="block text-xs">
                Justificativa, fontes e limitações
                <textarea
                  className={`${input} mt-1`}
                  rows={3}
                  value={rationale}
                  maxLength={10000}
                  onChange={(e) => setRationale(e.target.value)}
                />
              </label>
              <label className="block text-xs">
                Resposta no modelo JSON
                <textarea
                  className={`${input} mt-1 font-mono text-xs`}
                  rows={7}
                  value={raw}
                  onChange={(e) => {
                    const text = e.target.value;
                    setRaw(text);
                    try {
                      const v = JSON.parse(text);
                      if (v.title) setTitle(String(v.title));
                      if (v.rationale) setRationale(String(v.rationale));
                      if (v.pack_id) setPackId(String(v.pack_id));
                    } catch {
                      /* text may be incomplete while typing */
                    }
                  }}
                  placeholder="Cole o MODELO-CONTRIBUICAO.json preenchido pela IA"
                />
              </label>
              <label className="block text-xs">
                Ou carregar arquivo JSON
                <input
                  type="file"
                  accept=".json,application/json"
                  className="mt-1 block max-w-full text-xs"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file)
                      void perform(async () => {
                        if (file.size > 2000000)
                          throw new Error("Limite de 2 MB por contribuição.");
                        const text = await file.text();
                        const v = JSON.parse(text);
                        setRaw(text);
                        setTitle(v.title || "");
                        setRationale(v.rationale || "");
                        setPackId(v.pack_id || "");
                      });
                  }}
                />
              </label>
              <button
                type="button"
                className={button}
                disabled={busy || !raw.trim()}
                onClick={() => void perform(submit)}
              >
                <Send size={15} />
                Enviar para revisão
              </button>
            </section>
            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-700">
                Fila do time
              </h3>
              {!contributions.length && (
                <p className="text-sm text-slate-500">
                  Nenhuma contribuição enviada.
                </p>
              )}
              {contributions.map((c) => (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => setSelected(c)}
                  className="block w-full rounded-xl border border-slate-200 bg-white p-4 text-left hover:border-cyan-300"
                >
                  <strong className="block text-sm text-slate-800">
                    {c.title}
                  </strong>
                  <span className="mt-1 block text-xs text-slate-500">
                    {CONTRIBUTION_STATUS[c.status]} · {date(c.created_at)}
                  </span>
                </button>
              ))}
            </section>
          </div>
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            {!selected ? (
              <p className="text-sm leading-6 text-slate-500">
                Selecione uma contribuição para comparar as notas e acompanhar a
                revisão.
              </p>
            ) : (
              <>
                <h3 className="font-semibold text-slate-900">
                  {selected.title}
                </h3>
                <p className="mt-2 text-sm text-slate-600 whitespace-pre-wrap">
                  {selected.rationale}
                </p>
                <p className="my-3 text-xs font-semibold text-cyan-800">
                  {CONTRIBUTION_STATUS[selected.status]}
                </p>
                {selected.changes.map((c) => (
                  <details
                    key={c.path}
                    className="mb-3 rounded-lg border border-slate-200 p-3"
                  >
                    <summary className="cursor-pointer break-all text-sm font-semibold text-slate-700">
                      {c.path}
                    </summary>
                    <div className="mt-3 grid gap-3 lg:grid-cols-2">
                      <div>
                        <p className="text-xs font-semibold">
                          Publicado atualmente
                        </p>
                        <pre className="mt-2 max-h-80 overflow-auto whitespace-pre-wrap break-words text-xs text-slate-600">
                          {snapshot?.notes.find(
                            (n) => n.relative_path === c.path,
                          )?.content_markdown || "Nota nova"}
                        </pre>
                      </div>
                      <div>
                        <p className="text-xs font-semibold">Proposta da IA</p>
                        <pre className="mt-2 max-h-80 overflow-auto whitespace-pre-wrap break-words text-xs text-slate-600">
                          {c.markdown}
                        </pre>
                      </div>
                    </div>
                  </details>
                ))}
                {selected.review_comment && (
                  <p className="my-3 text-sm text-slate-600">
                    Revisão: {selected.review_comment}
                  </p>
                )}
                {reviewer &&
                  selected.status !== "incorporated" &&
                  selected.status !== "rejected" && (
                    <div className="space-y-3 border-t border-slate-200 pt-3">
                      <label className="block text-xs">
                        Comentário de revisão
                        <textarea
                          className={`${input} mt-1`}
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          rows={2}
                        />
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {selected.status !== "approved" ? (
                          <>
                            <button
                              type="button"
                              disabled={busy}
                              className={button}
                              onClick={() =>
                                void perform(() => review("approved"))
                              }
                            >
                              Aprovar para incorporar localmente
                            </button>
                            <button
                              type="button"
                              disabled={busy}
                              className={button}
                              onClick={() =>
                                void perform(() => review("changes_requested"))
                              }
                            >
                              Solicitar ajustes
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              className={button}
                              onClick={() =>
                                downloadBytes(
                                  buildChangesArchive(
                                    selected.changes,
                                    selected.id,
                                  ),
                                  `alteracoes-vault-${selected.id}.zip`,
                                )
                              }
                            >
                              <Download size={14} />
                              Baixar alterações para minha LLM
                            </button>
                            <button
                              type="button"
                              disabled={busy}
                              className={button}
                              onClick={() =>
                                void perform(() => review("incorporated"))
                              }
                            >
                              <RefreshCw size={14} />
                              Verificar incorporação
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          disabled={busy}
                          className={button}
                          onClick={() => void perform(() => review("rejected"))}
                        >
                          Rejeitar
                        </button>
                      </div>
                      <p className="text-xs leading-5 text-slate-500">
                        Aprovar preserva o vault atual. A incorporação exige
                        edição no computador, recompilação e sincronização
                        concluída com os hashes propostos.
                      </p>
                    </div>
                  )}
                <div className="mt-5 border-t border-slate-200 pt-3">
                  <h4 className="text-xs font-semibold text-slate-600">
                    Histórico de revisão
                  </h4>
                  {history.map((h, i) => (
                    <p key={i} className="mt-2 text-xs text-slate-500">
                      {date(h.created_at)} ·{" "}
                      {CONTRIBUTION_STATUS[
                        h.status as keyof typeof CONTRIBUTION_STATUS
                      ] || h.status}
                      {h.comment ? " · " + h.comment : ""}
                    </p>
                  ))}
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </section>
  );
}
