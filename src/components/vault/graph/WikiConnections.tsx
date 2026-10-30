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
  PanelRight,
  Search,
  X,
} from "lucide-react";
import type { VaultNoteSummary } from "../vaultTypes";
import { fetchWikiGraphLinks, withTimeout } from "./wikiGraphService";
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
  "rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-600";
const segment = (on: boolean) =>
  `rounded px-2.5 py-1 text-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-600 ${on ? "bg-white font-medium text-cyan-800 shadow-sm" : "text-slate-600 hover:text-slate-900"}`;
const fieldLabel =
  "inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-500";
export function WikiConnections({
  notes,
  currentNote,
  active,
  syncKey,
  onOpen,
  onOpenNote,
  onRefresh,
}: {
  notes: VaultNoteSummary[];
  currentNote: string | null;
  active: boolean;
  syncKey: string;
  onOpen: (id: string) => void;
  onOpenNote: (id: string) => void;
  onRefresh: () => void;
}) {
  const [route, setRoute] = useState(() =>
    readGraphRoute(window.location.search, currentNote),
  );
  const [links, setLinks] = useState<VaultGraphLink[] | null>(null),
    [loading, setLoading] = useState(false),
    [error, setError] = useState(""),
    [refreshVersion, setRefreshVersion] = useState(0);
  const [panelOpen, setPanelOpen] = useState(true);
  const [detailed, setDetailed] = useState(true);
  const [highlight, setHighlight] = useState("");
  const workspace = useRef<HTMLElement>(null);
  const [height, setHeight] = useState(600);
  useEffect(() => {
    if (!active) return;
    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (workspace.current) {
          const element = workspace.current,
            rect = element.getBoundingClientRect();
          // GaaS applies CSS zoom globally. Convert viewport pixels to layout pixels.
          const scale = rect.width / Math.max(1, element.offsetWidth) || 1;
          setHeight(
            Math.max(
              320,
              (window.innerHeight - Math.max(0, rect.top) - 16) / scale,
            ),
          );
        }
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    if (workspace.current) observer.observe(workspace.current);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure);
    };
  }, [active]);
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
    void withTimeout(
      fetchWikiGraphLinks(),
      30000,
      "O carregamento dos vínculos demorou demais.",
    )
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
      // The cancelled request will never clear its own loading flag. If the
      // next run returns early (cached links), the map would stay "loading".
      request.current++;
      setLoading(false);
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
  const topicCounts = useMemo(() => {
    const counts = new Map<string, number>();
    view.nodes.forEach((n) => counts.set(n.topic, (counts.get(n.topic) || 0) + 1));
    return counts;
  }, [view]);
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
  const showAll = () => update({ scope: "all", topic: "", query: "" });
  const filtered = route.scope === "local" || !!route.topic || !!route.query;
  const rootNote = graph.nodes.find((n) => n.id === route.root);
  const refresh = () => {
    loadedSync.current = null;
    setRefreshVersion((v) => v + 1);
    onRefresh();
  };
  return (
    <section
      ref={workspace}
      style={{ height }}
      aria-label="Mapa de conexões da Wiki"
      className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-slate-300 bg-white shadow-sm"
    >
      <div
        role="toolbar"
        aria-label="Navegação do mapa de notas"
        className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-slate-100 px-3 py-2"
      >
        <label className="flex min-w-48 flex-1 items-center gap-2 rounded-md border border-slate-200 px-2 py-1.5 text-slate-400 focus-within:border-cyan-600">
          <Search size={14} aria-hidden="true" />
          <input
            type="search"
            aria-label="Buscar nota no mapa pelo título"
            value={route.query}
            onChange={(e) => update({ query: e.target.value })}
            placeholder="Buscar nota pelo título…"
            className="min-w-0 w-full bg-transparent text-xs text-slate-700 outline-none"
          />
          {route.query && (
            <button
              type="button"
              aria-label="Limpar busca no mapa"
              onClick={() => update({ query: "" })}
            >
              <X size={12} />
            </button>
          )}
        </label>
        <div className={fieldLabel}>
          <span id="wiki-map-scope">Mostrar</span>
          <div
            role="group"
            aria-labelledby="wiki-map-scope"
            className="inline-flex rounded-md border border-slate-200 bg-slate-50 p-0.5"
          >
            <button
              type="button"
              aria-pressed={route.scope === "local"}
              title="Mostra só a nota escolhida e as notas ligadas a ela"
              onClick={() =>
                recenter(route.focus || currentNote || graph.nodes[0]?.id || "")
              }
              className={segment(route.scope === "local")}
            >
              Conexões da nota
            </button>
            <button
              type="button"
              aria-pressed={route.scope === "all"}
              title="Mostra todas as notas da Wiki no mapa"
              onClick={showAll}
              className={segment(route.scope === "all")}
            >
              Todas as notas
            </button>
          </div>
        </div>
        {route.scope === "local" && (
          <div className={fieldLabel}>
            <span id="wiki-map-depth">Alcance</span>
            <div
              role="group"
              aria-labelledby="wiki-map-depth"
              className="inline-flex rounded-md border border-slate-200 bg-slate-50 p-0.5"
            >
              {([1, 2] as const).map((depth) => (
                <button
                  key={depth}
                  type="button"
                  aria-pressed={route.depth === depth}
                  title={
                    depth === 1
                      ? "Só as notas ligadas diretamente"
                      : "Inclui também as conexões das conexões"
                  }
                  onClick={() => update({ depth })}
                  className={segment(route.depth === depth)}
                >
                  {depth} {depth === 1 ? "nível" : "níveis"}
                </button>
              ))}
            </div>
          </div>
        )}
        <label className={fieldLabel}>
          Assunto
          <select
            className={`${control} max-w-48`}
            value={route.topic}
            onChange={(e) => update({ topic: e.target.value })}
          >
            <option value="">Todos</option>
            {Object.keys(TOPIC_COLORS).map((topic) => (
              <option key={topic}>{topic}</option>
            ))}
          </select>
        </label>
        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            aria-pressed={detailed}
            title={
              detailed
                ? "Mostrando o nome de mais notas no mapa"
                : "Mostrando só o nome das notas principais"
            }
            onClick={() => setDetailed((v) => !v)}
            className={`${control} ${detailed ? "border-cyan-200 bg-cyan-50 text-cyan-800" : ""}`}
          >
            Mais nomes no mapa
          </button>
          <button
            type="button"
            aria-label={
              panelOpen ? "Recolher painel de notas" : "Expandir painel de notas"
            }
            aria-expanded={panelOpen}
            aria-controls="wiki-map-panel"
            title="Painel de notas"
            onClick={() => setPanelOpen((v) => !v)}
            className={`${control} inline-flex items-center gap-1.5`}
          >
            <PanelRight size={14} aria-hidden="true" />
            Notas
          </button>
          <button
            type="button"
            aria-label="Atualizar mapa"
            title="Atualizar mapa"
            onClick={refresh}
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-600"
          >
            <RefreshCw size={14} />
          </button>
        </div>
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
        <div className="relative flex min-h-0 flex-1">
          <div className="relative min-h-0 min-w-0 flex-1 bg-slate-50">
            {view.nodes.length ? (
              active && (
                <Suspense
                  fallback={
                    <p className="p-8 text-xs text-slate-700">Abrindo mapa…</p>
                  }
                >
                  <SigmaGraph
                    graph={view}
                    focus={route.focus}
                    detailed={detailed}
                    highlight={highlight}
                    onSelect={(id) => {
                      update({ focus: id });
                      if (id) setPanelOpen(true);
                    }}
                    onOpen={onOpenNote}
                  />
                </Suspense>
              )
            ) : (
              <div className="grid h-full place-items-center text-center text-xs text-slate-700">
                <div>
                  Nenhuma nota neste recorte.
                  <button
                    type="button"
                    className="mt-2 block w-full underline"
                    onClick={showAll}
                  >
                    Ver todas as notas
                  </button>
                </div>
              </div>
            )}
            <div className="pointer-events-none absolute bottom-3 left-3 rounded-md border border-slate-200 bg-white/90 px-2 py-1 text-[10px] text-slate-600 shadow-sm">
              <p aria-live="polite">
                {view.nodes.length} notas · {view.edges.length} vínculos
              </p>
              <p className="mt-0.5 text-slate-500">
                Clique numa nota para abrir · arraste para mover · role para
                ampliar
              </p>
            </div>
          </div>
          {panelOpen && (
            <aside
              id="wiki-map-panel"
              aria-label="Painel de notas do mapa"
              className="absolute inset-y-0 right-0 z-10 flex w-72 max-w-[85%] shrink-0 flex-col border-l border-slate-200 bg-white shadow-lg md:static md:max-w-none md:shadow-none"
            >
              <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-3 py-2">
                <h3 className="text-xs font-medium text-slate-700">
                  Notas e conexões
                </h3>
                <button
                  aria-label="Fechar painel de notas"
                  className="p-1 text-slate-400 hover:text-slate-800"
                  onClick={() => setPanelOpen(false)}
                >
                  <X size={14} />
                </button>
              </div>
              <div className="shrink-0 border-b border-slate-100 bg-slate-50/70 px-3 py-2">
                <p
                  aria-live="polite"
                  className="text-[11px] leading-4 text-slate-600"
                >
                  {route.scope === "local" && rootNote ? (
                    <>
                      Conexões de{" "}
                      <strong className="font-medium text-slate-800">
                        {rootNote.title}
                      </strong>{" "}
                      ({route.depth} {route.depth === 1 ? "nível" : "níveis"})
                    </>
                  ) : (
                    "Todas as notas da Wiki"
                  )}
                  {route.topic && <> · assunto {route.topic}</>}
                  {route.query && <> · busca “{route.query}”</>}
                </p>
                {filtered && (
                  <button
                    type="button"
                    onClick={showAll}
                    className={`${control} mt-2 w-full font-medium text-cyan-800`}
                  >
                    Ver todas as notas ({graph.nodes.length})
                  </button>
                )}
              </div>
              <section
                aria-labelledby="wiki-map-legend"
                className="shrink-0 border-b border-slate-100 px-3 py-2"
              >
                <h4
                  id="wiki-map-legend"
                  className="text-[11px] font-medium uppercase tracking-wide text-slate-500"
                >
                  Cores e leitura do mapa
                </h4>
                <p className="mt-1 text-[10px] leading-4 text-slate-400">
                  Clique numa cor para destacar as notas e conexões dela.
                </p>
                <div className="mt-1.5 space-y-0.5">
                  {Object.entries(TOPIC_COLORS).map(([topic, color]) => {
                    const on = highlight === topic;
                    return (
                      <button
                        key={topic}
                        type="button"
                        aria-pressed={on}
                        onClick={() => {
                          setHighlight(on ? "" : topic);
                          // A selected note would take over the map's highlight.
                          if (!on && route.focus) update({ focus: "" });
                        }}
                        className={`flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-xs leading-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-600 ${on ? "bg-cyan-50 font-medium text-slate-900 ring-1 ring-cyan-200" : highlight ? "text-slate-400 hover:bg-slate-50" : "text-slate-600 hover:bg-slate-50"}`}
                      >
                        <span
                          aria-hidden="true"
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ background: color }}
                        />
                        <span className="min-w-0 flex-1">{topic}</span>
                        <span className="text-[10px] text-slate-400">
                          {topicCounts.get(topic) || 0}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {highlight && (
                  <button
                    type="button"
                    onClick={() => setHighlight("")}
                    className={`${control} mt-1.5 w-full font-medium text-cyan-800`}
                  >
                    Limpar destaque
                  </button>
                )}
                <p className="mt-2 text-[10px] leading-4 text-slate-400">
                  Tamanho por referências recebidas, não confiança. Ao
                  selecionar, as setas mostram a direção dos vínculos.
                </p>
              </section>
              <div className="min-h-0 flex-1 overflow-y-auto p-3">
                {selected && (
                  <section
                    aria-label="Nota selecionada no mapa"
                    className="mb-3 border-b border-slate-100 pb-3"
                  >
                    <h4 className="mb-2 text-[11px] font-medium uppercase tracking-wide text-slate-500">
                      Nota selecionada
                    </h4>
                    <div>
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
                        Citada por {selected.incoming}{" "}
                        {selected.incoming === 1 ? "nota" : "notas"} · cita{" "}
                        {selected.outgoing}
                      </p>
                      {!view.nodes.some((n) => n.id === selected.id) && (
                        <p className="mt-2 text-xs text-amber-700">
                          Fora dos filtros atuais.
                        </p>
                      )}
                      <div className="my-3 flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          className={`${control} inline-flex items-center gap-1 text-cyan-800`}
                          onClick={() => onOpen(selected.id)}
                        >
                          <BookOpen size={12} aria-hidden="true" />
                          Abrir nota
                        </button>
                        <button
                          type="button"
                          title="Centraliza o mapa nesta nota e nas notas ligadas a ela"
                          className={`${control} inline-flex items-center gap-1`}
                          onClick={() => recenter(selected.id)}
                        >
                          <Focus size={12} aria-hidden="true" />
                          Ver conexões
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
                              .sort((a, b) =>
                                a.title.localeCompare(b.title, "pt-BR"),
                              )
                              .map((n) => (
                                <button
                                  key={n.id}
                                  type="button"
                                  onClick={() => update({ focus: n.id })}
                                  className="block w-full rounded px-1 py-1.5 text-left text-[11px] leading-4 text-slate-500 hover:bg-slate-50 hover:text-cyan-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-600"
                                >
                                  {n.title}
                                </button>
                              ))}
                          </div>
                        </details>
                      ))}
                    </div>
                  </section>
                )}
                <h4
                  id="wiki-map-note-list"
                  className="text-[11px] font-medium uppercase tracking-wide text-slate-500"
                >
                  {filtered ? "Notas neste recorte" : "Todas as notas"} (
                  {matchingNotes.length})
                </h4>
                <p className="mt-1 text-[10px] leading-4 text-slate-400">
                  Das mais citadas para as menos. Clique para destacar no mapa.
                </p>
                <ul
                  aria-labelledby="wiki-map-note-list"
                  className="mt-2 space-y-0.5"
                >
                  {matchingNotes.map((n) => (
                    <li key={n.id}>
                      <button
                        type="button"
                        aria-current={route.focus === n.id ? "true" : undefined}
                        aria-label={`${n.title}. Assunto ${n.topic}. Citada por ${n.incoming}, cita ${n.outgoing}.`}
                        onClick={() => update({ focus: n.id })}
                        className={`flex w-full items-start gap-2 rounded-md px-2 py-2 text-left text-xs leading-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-600 ${route.focus === n.id ? "bg-cyan-50 text-slate-900 ring-1 ring-cyan-200" : "text-slate-600 hover:bg-slate-50"}`}
                      >
                        <span
                          aria-hidden="true"
                          className="mt-1 h-2 w-2 shrink-0 rounded-full"
                          style={{ background: TOPIC_COLORS[n.topic] }}
                        />
                        <span className="min-w-0">
                          <span className="block">{n.title}</span>
                          <span className="mt-0.5 block text-[10px] text-slate-500">
                            {n.topic} · citada por {n.incoming} · cita{" "}
                            {n.outgoing}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
          )}
        </div>
      )}
    </section>
  );
}
