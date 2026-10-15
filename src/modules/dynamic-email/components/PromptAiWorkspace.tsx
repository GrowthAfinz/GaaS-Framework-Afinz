import React, { useEffect, useMemo, useState } from "react";
import type { AiContextMarkdownInput } from "../export/aiContextMarkdown";
import { prepareEmailInput } from "../domain/emailInput";
import { planEmailInput, type ConflictChoices } from "../domain/emailInputPlan";
import { renderDynamicEmail } from "../ampscript/renderer";
import type { PlannedBriefing } from "../domain/xlsxImport";
import { buildEmailAiPack } from "../export/emailAiPack";

export interface PromptAiWorkspaceProps {
  context: Omit<AiContextMarkdownInput, "scope" | "generatedAt">;
  onSave: (
    text: string,
    file: string,
    sha256: string,
    choices: ConflictChoices,
  ) => Promise<string[]>;
  onOpen: (id: string) => void;
}
const download = (name: string, text: string) => {
  const url = URL.createObjectURL(
    new Blob([text], { type: "text/markdown;charset=utf-8" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
const fieldKey = (item: PlannedBriefing, field: string) =>
  `${item.importKey}.${field}`;
export function PromptAiWorkspace({
  context,
  onSave,
  onOpen,
}: PromptAiWorkspaceProps) {
  const [side, setSide] = useState<"export" | "import">("export");
  const [scope, setScope] = useState<"skill" | "rulers" | "both">("both");
  const [partner, setPartner] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [full, setFull] = useState(false);
  const [text, setText] = useState("");
  const [file, setFile] = useState("JSON colado");
  const [hash, setHash] = useState("");
  const [choices, setChoices] = useState<ConflictChoices>({});
  const [index, setIndex] = useState(0);
  const [mobile, setMobile] = useState(false);
  const [noName, setNoName] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [saved, setSaved] = useState<string[]>([]);
  useEffect(() => {
    let active = true;
    if (text) void crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)).then(digest => {
      if (active) setHash(Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join(''));
    });
    return () => { active = false; };
  }, [text]);
  const rulers = useMemo(
    () =>
      Array.from(
        new Map(
          context.briefings
            .filter((r) => r.__meta.status !== "archived")
            .map((r) => [
              `${r.__meta.partner}|${r.__meta.segment}`,
              { partner: r.__meta.partner, segment: r.__meta.segment },
            ]),
        ).entries(),
      ),
    [context.briefings],
  );
  const pack = useMemo(
    () =>
      buildEmailAiPack(context, {
        scope,
        rulers: selected,
        includeTemplateSource: full,
      }),
    [context, scope, selected, full],
  );
  const result = useMemo(() => {
    if (!text.trim()) return undefined;
    try {
      return prepareEmailInput(JSON.parse(text), {
        briefings: context.briefings,
        products: context.productContexts,
        guardrails: context.productGuardrails,
      });
    } catch {
      return {
        rows: [],
        filled: [],
        problems: [
          {
            severity: "error" as const,
            where: "JSON",
            message: "JSON inválido. Confira vírgulas e aspas.",
          },
        ],
      };
    }
  }, [
    text,
    context.briefings,
    context.productContexts,
    context.productGuardrails,
  ]);
  const plan = useMemo(
    () => (result ? planEmailInput(result, context.briefings, choices) : []),
    [result, context.briefings, choices],
  );
  const blockers = result?.problems.filter((p) => p.severity === "error") ?? [];
  const warnings =
    result?.problems.filter((p) => p.severity === "warning") ?? [];
  const unresolved = plan.flatMap((item) =>
    item.diffs.filter(
      (d) => d.decision === "conflict" && !choices[fieldKey(item, d.column)],
    ),
  );
  const active = plan[Math.min(index, Math.max(plan.length - 1, 0))];
  const template = context.templates.find(
    (t) => t.id === result?.payload?.ruler.templateSlotId,
  );
  const preview =
    active && template
      ? renderDynamicEmail(template.source, active.next, {
          CPF: "00000000000",
          PRI_NOME: noName ? "" : "VANIA",
          LIMITE: "3500",
          PRODUTO: active.next.NM_PRODUTO_INTERNO,
          SEQUENCIA: active.next.SEQUENCIA,
          TP_CAMPANHA: active.next.TP_CAMPANHA,
        })
      : undefined;
  const inputChange = (value: string, name = "JSON colado") => {
    setText(value);
    setFile(name);
    setChoices({});
    setIndex(0);
    setHash("");
    setSaved([]);
    setMessage("");
  };
  const save = async () => {
    setBusy(true);
    setMessage("");
    try {
      const digest = Array.from(
        new Uint8Array(
          await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)),
        ),
      )
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      setHash(digest);
      setSaved(await onSave(text, file, digest, choices));
      setMessage("Rascunhos gravados com histórico.");
    } catch (e) {
      setMessage(
        `Não foi possível concluir: ${e instanceof Error ? e.message : String(e)}`,
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <main className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 text-slate-800 shadow-sm">
      <h2 className="text-lg font-bold">Prompt e IA</h2>
      <p className="mt-1 text-sm text-slate-500">
        Leve o contexto para sua IA e traga o conteúdo para revisar na Fábrica.
      </p>
      <div role="tablist" aria-label="Fluxo de IA" className="my-4 flex gap-2">
        {(
          [
            ["export", "Exportar"],
            ["import", "Importar"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            role="tab"
            aria-selected={side === id}
            className={`rounded-lg px-4 py-2 text-sm font-bold ${side === id ? "bg-cyan-900 text-white" : "bg-slate-100"}`}
            onClick={() => setSide(id)}
          >
            {label}
          </button>
        ))}
      </div>
      {side === "export" ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="space-y-4">
            <label className="block text-sm font-semibold">
              Escopo
              <select
                aria-label="Escopo do pacote"
                className="mt-1 block w-full rounded border p-2"
                value={scope}
                onChange={(e) => setScope(e.target.value as typeof scope)}
              >
                <option value="skill">Skill</option>
                <option value="rulers">Réguas</option>
                <option value="both">Skill e réguas</option>
              </select>
            </label>
            {scope !== "skill" && (
              <>
                <label className="block text-sm font-semibold">
                  Parceiro
                  <select
                    className="mt-1 block w-full rounded border p-2"
                    value={partner}
                    onChange={(e) => setPartner(e.target.value)}
                  >
                    <option value="">Todos</option>
                    {Array.from(new Set(rulers.map(([, r]) => r.partner))).map(
                      (p) => (
                        <option key={p}>{p}</option>
                      ),
                    )}
                  </select>
                </label>
                <fieldset className="space-y-2">
                  <legend className="mb-2 text-sm font-semibold">
                    Réguas por segmento
                  </legend>
                  {rulers
                    .filter(([, r]) => !partner || r.partner === partner)
                    .map(([key, r]) => (
                      <label
                        key={key}
                        className="flex gap-2 rounded border p-3 text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={selected.includes(key)}
                          onChange={(e) =>
                            setSelected((values) =>
                              e.target.checked
                                ? [...values, key]
                                : values.filter((v) => v !== key),
                            )
                          }
                        />
                        {r.partner} · {r.segment}
                      </label>
                    ))}
                  {!rulers.length && <p>Nenhuma régua carregada.</p>}
                </fieldset>
              </>
            )}
            <label className="flex gap-2 text-sm">
              <input
                type="checkbox"
                checked={full}
                onChange={(e) => setFull(e.target.checked)}
              />
              Incluir AMPscript completo
            </label>
            <p className="text-sm text-slate-500">
              {pack.bytes.toLocaleString("pt-BR")} bytes · aproximadamente{" "}
              {pack.estimatedTokens.toLocaleString("pt-BR")} tokens
            </p>
            <button
              disabled={scope !== "skill" && !selected.length}
              onClick={() => download(pack.filename, pack.content)}
              className="rounded-lg bg-cyan-900 px-4 py-2 font-bold text-white disabled:opacity-40"
            >
              Baixar pacote Markdown
            </button>
          </section>
          <section className="min-w-0">
            <h3 className="mb-2 font-semibold">Prévia das instruções</h3>
            <pre className="max-h-[600px] overflow-auto whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-xs">
              {pack.content}
            </pre>
          </section>
        </div>
      ) : (
        <section className="space-y-4">
          <label className="block text-sm font-semibold">
            Arquivo JSON
            <input
              aria-label="Arquivo JSON"
              type="file"
              accept=".json,application/json"
              className="mt-2 block"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f) inputChange(await f.text(), f.name);
              }}
            />
          </label>
          <label className="block text-sm font-semibold">
            Ou cole o JSON
            <textarea
              aria-label="Conteúdo JSON"
              className="mt-2 block min-h-40 w-full rounded-lg border p-3 font-mono text-xs"
              value={text}
              onChange={(e) => inputChange(e.target.value)}
            />
          </label>
          {result && (
            <>
              <div className="grid gap-3 md:grid-cols-2">
                {[
                  ["Bloqueia", blockers],
                  ["Revisar", warnings],
                ].map(([title, items]) => (
                  <section
                    key={String(title)}
                    className={`rounded-xl border p-3 ${title === "Bloqueia" ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50"}`}
                  >
                    <h3 className="font-bold">
                      {String(title)} ({(items as typeof blockers).length})
                    </h3>
                    <ul className="mt-2 max-h-48 overflow-auto text-xs">
                      {(items as typeof blockers).map((p, i) => (
                        <li className="mb-2" key={i}>
                          <b>{p.where}</b>: {p.message}
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
              <details className="rounded border p-3">
                <summary className="cursor-pointer text-sm font-semibold">
                  Preenchido pelo GaaS ({result.filled.length} campos)
                </summary>
                <ul className="max-h-48 overflow-auto text-xs">
                  {result.filled.map((f, i) => (
                    <li key={i}>
                      {f.where} · {f.field} ← {f.source}
                    </li>
                  ))}
                </ul>
              </details>
              <div className="grid gap-4 lg:grid-cols-[minmax(240px,1fr)_minmax(0,2fr)]">
                <div>
                  <h3 className="mb-2 font-bold">E-mail × rede</h3>
                  <div className="grid grid-cols-2 gap-1">
                    {plan.map((item, i) => (
                      <button
                        key={item.importKey}
                        onClick={() => setIndex(i)}
                        className={`rounded border p-2 text-xs ${i === index ? "border-cyan-700 bg-cyan-50" : ""}`}
                      >
                        {item.incoming.sequence}
                        <br />
                        {item.incoming.network}
                      </button>
                    ))}
                  </div>
                </div>
                <section className="min-w-0">
                  <div className="mb-2 flex flex-wrap gap-3 text-sm">
                    <label>
                      <input
                        type="checkbox"
                        checked={mobile}
                        onChange={(e) => setMobile(e.target.checked)}
                      />{" "}
                      Celular 375px
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={noName}
                        onChange={(e) => setNoName(e.target.checked)}
                      />{" "}
                      Amostra sem nome
                    </label>
                  </div>
                  {!template && plan.length > 0 && (
                    <p role="alert">
                      Template do banco não disponível. Atualize os templates
                      para continuar.
                    </p>
                  )}
                  {preview && (
                    <>
                      <div className="overflow-x-auto rounded-xl bg-slate-100 p-3">
                        <iframe
                          title="Prévia do e-mail importado"
                          sandbox=""
                          srcDoc={preview.html}
                          style={{
                            width: mobile ? 375 : 600,
                            height: 700,
                            border: 0,
                            background: "white",
                          }}
                        />
                      </div>
                      {preview.diagnostics.map((d) => (
                        <p key={d} className="text-xs text-red-700">
                          {d}
                        </p>
                      ))}
                    </>
                  )}
                </section>
              </div>
              <h3 className="font-bold">Diferenças por campo</h3>
              <div className="max-h-[500px] overflow-auto">
                {plan.map((item) => (
                  <details
                    key={item.importKey}
                    className="mb-2 rounded border p-3"
                  >
                    <summary className="cursor-pointer text-sm font-semibold">
                      {item.incoming.sequence} · {item.incoming.network} ·{" "}
                      {item.action === "create"
                        ? "Novo rascunho"
                        : `${item.diffs.length} diferenças`}
                    </summary>
                    {item.diffs.map((d) => (
                      <div
                        key={d.column}
                        className="mt-3 rounded bg-slate-50 p-3 text-xs"
                      >
                        <b>{d.column}</b>
                        <div className="my-2 grid gap-2 md:grid-cols-2">
                          <pre className="overflow-auto whitespace-pre-wrap">
                            GaaS: {d.gaas}
                          </pre>
                          <pre className="overflow-auto whitespace-pre-wrap">
                            Arquivo: {d.sheet}
                          </pre>
                        </div>
                        {d.decision === "conflict" ? (
                          <select
                            aria-label={`Decisão ${item.incoming.sequence} ${item.incoming.network} ${d.column}`}
                            value={choices[fieldKey(item, d.column)] ?? ""}
                            onChange={(e) =>
                              setChoices((c) => ({
                                ...c,
                                [fieldKey(item, d.column)]: e.target.value as
                                  | "gaas"
                                  | "file",
                              }))
                            }
                            className="rounded border p-2"
                          >
                            <option value="">Escolha para resolver</option>
                            <option value="gaas">Manter o GaaS</option>
                            <option value="file">Usar o arquivo</option>
                          </select>
                        ) : (
                          <span>
                            {d.decision === "keep-gaas"
                              ? "Manter edição do GaaS"
                              : "Atualizar com arquivo"}
                          </span>
                        )}
                      </div>
                    ))}
                  </details>
                ))}
              </div>
              <p className="text-sm text-slate-500">
                {unresolved.length} conflitos pendentes. Todos os e-mails entram
                como rascunho.
              </p>
              <button
                disabled={
                  busy ||
                  !plan.length ||
                  blockers.length > 0 ||
                  unresolved.length > 0 ||
                  !template ||
                  Boolean(preview?.diagnostics.length)
                }
                onClick={() => void save()}
                className="rounded-lg bg-cyan-900 px-4 py-2 font-bold text-white disabled:opacity-40"
              >
                {busy ? "Gravando…" : "Aprovar e gravar"}
              </button>
            </>
          )}
          {hash && (
            <p className="break-all text-xs text-slate-500">SHA-256: {hash}</p>
          )}
          <p role="status" className="text-sm">
            {message}
          </p>
          {saved.map((id) => (
            <button
              key={id}
              className="mr-3 text-sm text-cyan-800 underline"
              onClick={() => onOpen(id)}
            >
              Abrir e-mail gravado
            </button>
          ))}
        </section>
      )}
    </main>
  );
}
