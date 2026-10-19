import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  readSfmcHistory,
  type SfmcHistory,
} from "../../services/sfmcIngestionService";
import { useAppStore } from "../../store/useAppStore";
const date = (s: string) =>
  new Date(s).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
export function SfmcIngestionHistory({
  alertsOnly = false,
}: {
  alertsOnly?: boolean;
}) {
  const [data, setData] = useState<SfmcHistory | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const signature = useRef<string | null>(null),
    requesting = useRef(false),
    lastRead = useRef(0);
  const load = useCallback(async () => {
    if (requesting.current) return;
    requesting.current = true;
    lastRead.current = Date.now();
    setBusy(true);
    setError("");
    try {
      const next = await readSfmcHistory();
      const key = JSON.stringify([
        next.imports.map((i) => [i.id, i.status, i.pending_contents]),
        next.alerts,
        next.automatic_links,
      ]);
      const changed = signature.current !== null && signature.current !== key;
      signature.current = key;
      setData(next);
      if (changed) window.dispatchEvent(new Event("sfmc-package-changed"));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      requesting.current = false;
      setBusy(false);
    }
  }, []);
  useEffect(() => {
    void load();
    const change = () => void load();
    window.addEventListener("sfmc-package-changed", change);
    const focus = () => {
      if (
        document.visibilityState === "visible" &&
        Date.now() - lastRead.current > 15000
      )
        void load();
    };
    const timer = window.setInterval(focus, 60000);
    window.addEventListener("focus", focus);
    return () => {
      window.removeEventListener("sfmc-package-changed", change);
      window.removeEventListener("focus", focus);
      window.clearInterval(timer);
    };
  }, [load]);
  if (alertsOnly) {
    if (!data?.alerts.length) return null;
    return (
      <div
        role="status"
        className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900"
      >
        <strong>
          {data.alerts.length} atividades com templates divergentes
        </strong>
        <p className="mt-1 text-xs">
          Uma mesma jornada + Activity Name + canal possui IDs diferentes. Os
          vínculos existentes foram preservados; novas atribuições automáticas
          ficam suspensas.
        </p>
        <button
          className="mt-2 text-xs font-semibold underline"
          onClick={() => {
            sessionStorage.setItem("gaas-settings-tab", "sfmc");
            useAppStore.getState().setTab("configuracoes");
          }}
        >
          Ver notificações e histórico dos packs
        </button>
      </div>
    );
  }
  return (
    <section className="space-y-4 rounded-2xl border bg-white p-5">
      <header className="flex items-center gap-3">
        <div className="flex-1">
          <h3 className="text-lg font-bold">
            Packs SFMC · histórico de ingestão
          </h3>
          <p className="text-xs text-slate-500">
            Estrutura recebida, revisão de conteúdos e resultados são estados
            independentes. Datas em São Paulo.
          </p>
        </div>
        <button
          disabled={busy}
          onClick={() => void load()}
          className="rounded border px-3 py-2 text-xs"
        >
          {busy ? "Atualizando…" : "Atualizar"}
        </button>
      </header>
      {error && (
        <p role="alert" className="text-sm text-rose-700">
          {error}
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        {(["Afinz", "Plurix"] as const).map((bu) => {
          const latest = data?.imports.find((i) => i.sfmc_bu === bu);
          return (
            <div key={bu} className="rounded-xl border bg-slate-50 p-4">
              <strong>BU SFMC {bu}</strong>
              <p className="mt-1 text-sm">
                {latest
                  ? date(latest.uploaded_at)
                  : "Sem ingestão com BU de origem identificada"}
              </p>
              <p className="text-xs text-slate-500">{latest?.file_name}</p>
            </div>
          );
        })}
      </div>
      {!!data?.imports.some((i) => !i.sfmc_bu) && (
        <p className="rounded bg-slate-50 p-3 text-xs text-slate-600">
          Importações antigas conservam a origem declarada. B2C/B2B2C são
          classificações de negócio e não comprovam a conta SFMC Afinz ou
          Plurix.
        </p>
      )}
      <p className="text-xs text-slate-600">
        {data?.automatic_links ?? 0} vínculos automáticos auditados. Templates
        novos continuam exigindo aprovação.
      </p>
      {!!data?.alerts.length && (
        <div className="space-y-2">
          <h4 className="font-semibold text-amber-900">
            Notificações · mudança de template na mesma atividade
          </h4>
          {data.alerts.map((a) => (
            <div
              key={a.journey + a.activity + a.channel}
              className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs"
            >
              <strong className="break-all">{a.activity}</strong>
              <p className="mt-1 break-all">
                {a.journey} · {a.channel}
              </p>
              <p className="mt-1 break-all">
                IDs observados: {a.template_ids.join(" / ")}
              </p>
              <p className="mt-1">
                Última observação: {date(a.last_seen)}. Resolver o uso e a
                vigência no cadastro; o sistema não substitui o histórico.
              </p>
            </div>
          ))}
        </div>
      )}
      <div className="overflow-auto">
        <table className="w-full text-xs">
          <thead>
            <tr>
              {[
                "Recebido em",
                "BU de origem / arquivo",
                "Ingestão",
                "Revisão de conteúdo",
                "Jornadas",
              ].map((k) => (
                <th className="p-3 text-left" key={k}>
                  {k}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data?.imports.map((i) => (
              <tr className="border-t" key={i.id}>
                <td className="whitespace-nowrap p-3">{date(i.uploaded_at)}</td>
                <td className="max-w-72 break-all p-3">
                  <strong>
                    {i.sfmc_bu || "Origem legada: " + i.source_scope}
                  </strong>
                  <p>{i.file_name}</p>
                  <p className="mt-1 text-slate-400">
                    {i.staged_via} · parser {i.parser_version}
                  </p>
                </td>
                <td className="p-3">
                  Recebida · {i.messages_count} mensagens
                  <p className="text-slate-400">
                    {i.journeys.length} snapshots
                  </p>
                </td>
                <td className="p-3">
                  {i.pending_contents} conteúdos pendentes
                  <p className="text-slate-400">{i.status}</p>
                </td>
                <td className="min-w-64 p-3">
                  <details>
                    <summary className="cursor-pointer text-cyan-800">
                      {i.journeys.length} jornadas · ver versões
                    </summary>
                    {i.journeys.map((j) => (
                      <p key={j.snapshot_id} className="mt-2 break-all">
                        {j.journey_name} · v{j.journey_version}
                      </p>
                    ))}
                  </details>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
