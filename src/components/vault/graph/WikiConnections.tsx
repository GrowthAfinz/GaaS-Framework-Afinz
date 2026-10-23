import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  BookOpen,
  Focus,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import type { VaultNoteSummary } from "../vaultTypes";
import { fetchWikiGraphLinks } from "./wikiGraphService";
import {
  buildWikiGraph,
  graphRouteSearch,
  readGraphRoute,
  TOPIC_COLORS,
  visibleWikiGraph,
  type GraphRoute,
  type VaultGraphLink,
} from "./wikiGraph";
const SigmaGraph = lazy(() => import("./SigmaGraph"));
const control =
  "rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-600 focus-visible:outline-cyan-600";
export function WikiConnections({
  notes,
  currentNote,
  active,
  syncKey,
  onOpen,
  onRefresh,
}: {
  notes: VaultNoteSummary[];
  currentNote: string | null;
  active: boolean;
  syncKey: string;
  onOpen: (id: string) => void;
  onRefresh: () => void;
}) {
  const [route, setRoute] = useState(() =>
    readGraphRoute(window.location.search, currentNote),
  );
  const [links, setLinks] = useState<VaultGraphLink[] | null>(null),
    [loading, setLoading] = useState(false),
    [error, setError] = useState(""),
    [refreshVersion, setRefreshVersion] = useState(0);
  const loadedSync = useRef<string | null>(null),
    request = useRef(0);
  const update = useCallback(
    (patch: Partial<GraphRoute>) =>
      setRoute((previous) => {
        const next = { ...previous, ...patch };
        window.history.replaceState(
          {},
          "",
          window.location.pathname +
            graphRouteSearch(window.location.search, next) +
            window.location.hash,
        );
        return next;
      }),
    [],
  );
  useEffect(() => {
    if (active) setRoute(readGraphRoute(window.location.search, currentNote));
  }, [active, currentNote]);
  useEffect(() => {
    const sync = () =>
      setRoute(readGraphRoute(window.location.search, currentNote));
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, [currentNote]);
  useEffect(() => {
    if (!active || (loadedSync.current === syncKey && links !== null)) return;
    const token = ++request.current;
    setLoading(true);
    setError("");
    void fetchWikiGraphLinks()
      .then((data) => {
        if (token === request.current) {
          setLinks(data);
          loadedSync.current = syncKey;
        }
      })
      .catch((e) => {
        if (token === request.current)
          setError(
            e instanceof Error
              ? e.message
              : "Não foi possível carregar os vínculos.",
          );
      })
      .finally(() => {
        if (token === request.current) setLoading(false);
      });
    return () => {
      request.current++;
    };
  }, [active, syncKey, refreshVersion]);
  const graph = useMemo(
    () => buildWikiGraph(notes, links || []),
    [notes, links],
  );
  // Camera motion and selection never recreate the graph or rerun its layout.
  const view = useMemo(
    () => visibleWikiGraph(graph, route),
    [graph, route.scope, route.root, route.depth, route.topic, route.query],
  );
  const selected = graph.nodes.find((n) => n.id === route.focus);
  const matchingNotes = useMemo(
    () =>
      [...view.nodes].sort(
        (a, b) =>
          b.incoming - a.incoming || a.title.localeCompare(b.title, "pt-BR"),
      ),
    [view],
  );
  const related = useMemo(
    () => ({
      incoming: new Set(
        graph.edges
          .filter((e) => e.target === route.focus)
          .map((e) => e.source),
      ),
      outgoing: new Set(
        graph.edges
          .filter((e) => e.source === route.focus)
          .map((e) => e.target),
      ),
    }),
    [graph, route.focus],
  );
  const recenter = (id: string) =>
    update({
      scope: "local",
      root: id,
      focus: id,
      depth: 1,
      topic: "",
      query: "",
    });
  const refresh = () => {
    loadedSync.current = null;
    setRefreshVersion((v) => v + 1);
    onRefresh();
  };
  return (
    <section
      aria-label="Mapa de conexões da Wiki"
      className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
    >
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-3 py-2">
        <label className="flex min-w-40 flex-1 items-center gap-2 text-slate-400">
          <Search size={14} />
          <input
            aria-label="Buscar nota no mapa"
            value={route.query}
            onChange={(e) => update({ query: e.target.value })}
            placeholder="Encontrar nota…"
            className="min-w-0 w-full bg-transparent text-xs text-slate-700 outline-none"
          />
          {route.query && (
            <button
              aria-label="Limpar busca no mapa"
              onClick={() => update({ query: "" })}
            >
              <X size={12} />
            </button>
          )}
        </label>
        <select
          aria-label="Alcance do mapa"
          className={control}
          value={route.scope}
          onChange={(e) =>
            e.target.value === "local"
              ? recenter(route.focus || currentNote || graph.nodes[0]?.id || "")
              : update({ scope: "all" })
          }
        >
          <option value="local">Nota e conexões</option>
          <option value="all">Acervo completo</option>
        </select>
        {route.scope === "local" && (
          <select
            aria-label="Profundidade das conexões"
            className={control}
            value={route.depth}
            onChange={(e) => update({ depth: Number(e.target.value) as 1 | 2 })}
          >
            <option value={1}>1 nível</option>
            <option value={2}>2 níveis</option>
          </select>
        )}
        <select
          aria-label="Assunto do mapa"
          className={`${control} max-w-48`}
          value={route.topic}
          onChange={(e) => update({ topic: e.target.value })}
        >
          <option value="">Todos os assuntos</option>
          {Object.keys(TOPIC_COLORS).map((topic) => (
            <option key={topic}>{topic}</option>
          ))}
        </select>
        <button
          type="button"
          aria-label="Atualizar mapa"
          title="Atualizar mapa"
          onClick={refresh}
          className="rounded-md p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-700"
        >
          <RefreshCw size={14} />
        </button>
      </div>
      {error ? (
        <div role="alert" className="p-5 text-xs text-rose-700">
          {error}{" "}
          <button className="underline" onClick={refresh}>
            Tentar novamente
          </button>
        </div>
      ) : loading || links === null ? (
        <p role="status" className="p-8 text-center text-xs text-slate-500">
          Carregando conexões…
        </p>
      ) : (
        <>
          <div
            className={`grid min-w-0 ${selected ? "md:grid-cols-[minmax(0,1fr)_236px]" : ""}`}
          >
            <div className="relative min-w-0">
              {view.nodes.length ? (
                active && (
                  <Suspense
                    fallback={
                      <p className="p-8 text-xs text-slate-500">
                        Abrindo mapa…
                      </p>
                    }
                  >
                    <SigmaGraph
                      graph={view}
                      focus={route.focus}
                      onSelect={(id) => update({ focus: id })}
                    />
                  </Suspense>
                )
              ) : (
                <div className="grid h-72 place-items-center text-center text-xs text-slate-500">
                  <div>
                    Nenhuma nota neste recorte.
                    <button
                      className="mt-2 block w-full text-cyan-700"
                      onClick={() =>
                        update({ scope: "all", topic: "", query: "" })
                      }
                    >
                      Mostrar o acervo completo
                    </button>
                  </div>
                </div>
              )}
              <p
                className="pointer-events-none absolute bottom-3 left-3 text-[10px] text-slate-400"
                aria-live="polite"
              >
                {view.nodes.length} notas · {view.edges.length} vínculos
              </p>
            </div>
            {selected && (
              <aside
                aria-label="Nota selecionada no mapa"
                className="border-t border-slate-100 p-3 md:border-l md:border-t-0"
                style={{
                  maxHeight: "clamp(300px, 55vh, 480px)",
                  overflowY: "auto",
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <p
                    className="text-[10px] font-medium"
                    style={{ color: TOPIC_COLORS[selected.topic] }}
                  >
                    {selected.topic}
                  </p>
                  <button
                    aria-label="Fechar detalhes da nota"
                    onClick={() => update({ focus: "" })}
                    className="text-slate-400 hover:text-slate-700"
                  >
                    <X size={14} />
                  </button>
                </div>
                <h3 className="mt-1.5 text-sm font-medium leading-5 text-slate-800">
                  {selected.title}
                </h3>
                <p className="mt-1.5 break-words text-[10px] leading-4 text-slate-400">
                  {selected.path}
                </p>
                <p className="mt-2 text-[11px] text-slate-500">
                  {selected.incoming} referências recebidas ·{" "}
                  {selected.outgoing} enviadas
                </p>
                {!view.nodes.some((n) => n.id === selected.id) && (
                  <p className="mt-2 text-xs text-amber-700">
                    Fora dos filtros atuais.
                  </p>
                )}
                <div className="my-3 flex flex-wrap gap-1.5">
                  <button
                    className={`${control} inline-flex items-center gap-1 text-cyan-800`}
                    onClick={() => onOpen(selected.id)}
                  >
                    <BookOpen size={12} />
                    Abrir nota
                  </button>
                  <button
                    className={`${control} inline-flex items-center gap-1`}
                    onClick={() => recenter(selected.id)}
                  >
                    <Focus size={12} />
                    Conexões
                  </button>
                </div>
                {(
                  [
                    ["Citada por", related.incoming, ArrowDownLeft],
                    ["Esta nota cita", related.outgoing, ArrowUpRight],
                  ] as const
                ).map(([label, ids, Icon]) => (
                  <details
                    key={label}
                    className="border-t border-slate-100 py-2"
                  >
                    <summary className="cursor-pointer text-xs text-slate-600">
                      <Icon size={12} className="mr-1 inline" />
                      {label} ({ids.size})
                    </summary>
                    <div className="mt-1">
                      {graph.nodes
                        .filter((n) => ids.has(n.id))
                        .sort((a, b) => a.title.localeCompare(b.title, "pt-BR"))
                        .map((n) => (
                          <button
                            key={n.id}
                            onClick={() => update({ focus: n.id })}
                            className="block w-full rounded px-1 py-1.5 text-left text-[11px] leading-4 text-slate-500 hover:bg-slate-50 hover:text-cyan-800"
                          >
                            {n.title}
                          </button>
                        ))}
                    </div>
                  </details>
                ))}
              </aside>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-3 py-2 text-[10px] text-slate-400">
            <span>
              Arraste para mover · role para ampliar · tamanho por referências
              recebidas
            </span>
            <details className="relative">
              <summary className="cursor-pointer">Cores por assunto</summary>
              <div
                aria-label="Legenda de assuntos"
                className="absolute bottom-6 right-0 z-10 w-56 space-y-2 rounded-lg border border-slate-200 bg-white p-3 shadow-lg"
              >
                {Object.entries(TOPIC_COLORS).map(([topic, color]) => (
                  <div
                    key={topic}
                    className="flex items-center gap-2 text-xs text-slate-600"
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: color }}
                    />
                    {topic}
                  </div>
                ))}
                <p className="pt-1 text-[10px]">
                  Tamanho indica conectividade, não confiança.
                </p>
              </div>
            </details>
          </div>
          <details className="border-t border-slate-100 px-3 py-2">
            <summary className="cursor-pointer text-xs text-slate-500">
              Lista de notas ({matchingNotes.length})
            </summary>
            <div className="mt-2 grid gap-1 pb-1 sm:grid-cols-2 lg:grid-cols-3">
              {matchingNotes.map((n) => (
                <button
                  key={n.id}
                  onClick={() => update({ focus: n.id })}
                  className="flex items-start gap-2 rounded px-2 py-1.5 text-left text-xs leading-4 text-slate-600 hover:bg-slate-50"
                >
                  <span
                    className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ background: TOPIC_COLORS[n.topic] }}
                  />
                  {n.title}
                </button>
              ))}
            </div>
          </details>
        </>
      )}
    </section>
  );
}
