import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  BookOpen,
  Focus,
  Maximize2,
  RefreshCw,
  Search,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import type { VaultNoteSummary } from "../vaultTypes";
import { fetchWikiGraphLinks } from "./wikiGraphService";
import {
  buildWikiGraph,
  graphRouteSearch,
  layoutWikiGraph,
  readGraphRoute,
  TOPIC_COLORS,
  visibleWikiGraph,
  type GraphRoute,
  type VaultGraphLink,
} from "./wikiGraph";

const control =
  "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus-visible:outline-cyan-600";
const errorText = (error: unknown) =>
  error instanceof Error
    ? error.message
    : "Não foi possível carregar os vínculos. Tente novamente.";
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
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [links, setLinks] = useState<VaultGraphLink[] | null>(null),
    [loading, setLoading] = useState(false),
    [error, setError] = useState("");
  const [camera, setCamera] = useState({ x: 0, y: 0, z: 1 }),
    [hover, setHover] = useState("");
  const loadedSync = useRef<string | null>(null),
    request = useRef(0),
    svg = useRef<SVGSVGElement>(null);
  const drag = useRef<{
    x: number;
    y: number;
    startX: number;
    startY: number;
  } | null>(null);
  const nodeRefs = useRef(new Map<string, SVGGElement>());
  const marker = useId().replace(/:/g, "");
  const update = useCallback((patch: Partial<GraphRoute>) => {
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
    });
    if (
      "root" in patch ||
      "scope" in patch ||
      "depth" in patch ||
      "topic" in patch ||
      "query" in patch
    )
      setCamera({ x: 0, y: 0, z: 1 });
  }, []);
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
        if (token === request.current) setError(errorText(e));
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
  const view = useMemo(() => visibleWikiGraph(graph, route), [graph, route]);
  // Selection does not recompute geometry, preserving the user's point of reference.
  const positions = useMemo(
    () =>
      layoutWikiGraph(view, route.scope === "local" ? route.root : undefined),
    [
      view.nodes.map((n) => n.id).join("|"),
      view.edges.map((e) => e.source + e.target).join("|"),
      route.scope,
      route.root,
    ],
  );
  const nodeMap = useMemo(
    () => new Map(graph.nodes.map((n) => [n.id, n])),
    [graph],
  );
  const selected = graph.nodes.find((n) => n.id === route.focus);
  const related = useMemo(() => {
    const incoming = graph.edges
        .filter((e) => e.target === route.focus)
        .map((e) => e.source),
      outgoing = graph.edges
        .filter((e) => e.source === route.focus)
        .map((e) => e.target);
    return { incoming: new Set(incoming), outgoing: new Set(outgoing) };
  }, [graph, route.focus]);
  const matchingNotes = useMemo(
    () =>
      [...view.nodes].sort(
        (a, b) =>
          b.incoming - a.incoming || a.title.localeCompare(b.title, "pt-BR"),
      ),
    [view.nodes],
  );
  const labelIds = new Set(
    (route.scope === "local" && view.nodes.length <= 30
      ? view.nodes
      : matchingNotes.slice(0, 9)
    ).map((n) => n.id),
  );
  const focusExists = view.nodes.some((n) => n.id === route.focus);
  const select = (id: string) => update({ focus: id });
  const recenter = (id: string) =>
    update({
      scope: "local",
      root: id,
      focus: id,
      depth: 1,
      topic: "",
      query: "",
    });
  const point = (clientX: number, clientY: number) => {
    const matrix = svg.current?.getScreenCTM();
    return matrix
      ? new DOMPoint(clientX, clientY).matrixTransform(matrix.inverse())
      : { x: clientX, y: clientY };
  };
  const zoom = (factor: number) =>
    setCamera((c) => ({ ...c, z: Math.max(0.4, Math.min(4, c.z * factor)) }));
  useEffect(() => {
    const element = svg.current;
    if (!element || !active) return;
    const wheel = (event: WheelEvent) => {
      if (!event.ctrlKey) return;
      event.preventDefault();
      zoom(event.deltaY < 0 ? 1.12 : 1 / 1.12);
    };
    element.addEventListener("wheel", wheel, { passive: false });
    return () => element.removeEventListener("wheel", wheel);
  }, [active, loading, links]);
  const moveFocus = (id: string, key: string) => {
    const origin = positions.get(id);
    if (!origin) return;
    const direction =
      key === "ArrowRight"
        ? [1, 0]
        : key === "ArrowLeft"
          ? [-1, 0]
          : key === "ArrowDown"
            ? [0, 1]
            : [0, -1];
    const target = view.nodes
      .filter((n) => n.id !== id)
      .map((n) => ({ n, p: positions.get(n.id)! }))
      .filter(
        ({ p }) =>
          (p.x - origin.x) * direction[0] + (p.y - origin.y) * direction[1] > 1,
      )
      .sort(
        (a, b) =>
          Math.hypot(a.p.x - origin.x, a.p.y - origin.y) -
          Math.hypot(b.p.x - origin.x, b.p.y - origin.y),
      )[0];
    if (target) {
      select(target.n.id);
      nodeRefs.current.get(target.n.id)?.focus();
    }
  };
  return (
    <section aria-label="Mapa de conexões da Wiki" className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <div>
          <h3 className="text-lg font-medium text-slate-900">
            Mapa de conexões
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Explore os vínculos reais entre as notas. Selecione um ponto para
            conhecer suas relações.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            loadedSync.current = null;
            setRefreshVersion(value => value + 1);
            onRefresh();
          }}
          className={`${control} inline-flex items-center gap-2`}
        >
          <RefreshCw size={15} />
          Atualizar mapa
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3">
        <label className="flex min-w-48 flex-1 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
          <Search size={16} className="text-slate-500" />
          <input
            aria-label="Buscar nota no mapa"
            value={route.query}
            onChange={(e) => update({ query: e.target.value })}
            placeholder="Buscar nota no mapa…"
            className="min-w-0 w-full text-sm outline-none"
          />
        </label>
        <select
          aria-label="Alcance do mapa"
          className={control}
          value={route.scope}
          onChange={(e) => {
            const scope = e.target.value as GraphRoute["scope"];
            if (scope === "local")
              recenter(route.focus || currentNote || graph.nodes[0]?.id || "");
            else update({ scope });
          }}
        >
          <option value="local">Conexões da nota</option>
          <option value="all">Acervo completo</option>
        </select>
        {route.scope === "local" && (
          <select
            aria-label="Profundidade das conexões"
            className={control}
            value={route.depth}
            onChange={(e) => update({ depth: Number(e.target.value) as 1 | 2 })}
          >
            <option value={1}>Conexões diretas</option>
            <option value={2}>Até dois níveis</option>
          </select>
        )}
        <select
          aria-label="Assunto do mapa"
          className={`${control} max-w-full`}
          value={route.topic}
          onChange={(e) => update({ topic: e.target.value })}
        >
          <option value="">Todos os assuntos</option>
          {Object.keys(TOPIC_COLORS).map((topic) => (
            <option key={topic}>{topic}</option>
          ))}
        </select>
        {currentNote && (
          <button
            type="button"
            onClick={() => recenter(currentNote)}
            className={control}
          >
            Conexões da nota aberta
          </button>
        )}
      </div>
      {error ? (
        <div
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800"
        >
          {error}{" "}
          <button
            type="button"
            onClick={() => {
              loadedSync.current = null;
            setRefreshVersion(value => value + 1);
              onRefresh();
            }}
            className="underline"
          >
            Tentar novamente
          </button>
        </div>
      ) : loading || links === null ? (
        <p
          role="status"
          className="rounded-xl border border-slate-200 bg-white p-10 text-sm text-slate-500"
        >
          Carregando apenas o índice de vínculos…
        </p>
      ) : (
        <>
          <div className="grid items-start gap-3 xl:grid-cols-[minmax(0,1fr)_300px]">
            <div className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 p-3">
                <p aria-live="polite" className="text-xs text-slate-500">
                  {view.nodes.length} de {graph.nodes.length} notas ·{" "}
                  {view.edges.length} vínculos únicos no mapa
                </p>
                <div className="flex gap-1">
                  <button
                    type="button"
                    aria-label="Diminuir zoom"
                    onClick={() => zoom(1 / 1.25)}
                    className="rounded p-2 text-slate-600 hover:bg-slate-100"
                  >
                    <ZoomOut size={17} />
                  </button>
                  <button
                    type="button"
                    aria-label="Aumentar zoom"
                    onClick={() => zoom(1.25)}
                    className="rounded p-2 text-slate-600 hover:bg-slate-100"
                  >
                    <ZoomIn size={17} />
                  </button>
                  <button
                    type="button"
                    aria-label="Enquadrar mapa"
                    onClick={() => setCamera({ x: 0, y: 0, z: 1 })}
                    className="rounded p-2 text-slate-600 hover:bg-slate-100"
                  >
                    <Maximize2 size={17} />
                  </button>
                </div>
              </div>
              {!view.nodes.length ? (
                <div className="grid min-h-96 place-items-center p-8 text-center text-sm text-slate-500">
                  <div>
                    Nenhuma nota corresponde a este recorte.
                    <button
                      type="button"
                      onClick={() =>
                        update({ scope: "all", topic: "", query: "" })
                      }
                      className="mt-3 block w-full font-medium text-cyan-800"
                    >
                      Mostrar o acervo completo
                    </button>
                  </div>
                </div>
              ) : (
                <svg
                  ref={svg}
                  role="group"
                  aria-label="Grafo navegável de notas. Use Tab para entrar, setas para selecionar e Enter para ver os detalhes."
                  viewBox="-600 -360 1200 720"
                  className="block h-[430px] w-full cursor-grab bg-slate-50/50 sm:h-[560px]"
                  style={{ touchAction: "none" }}
                  onPointerDown={(e) => {
                    if ((e.target as Element).closest("[data-note-id]")) return;
                    const p = point(e.clientX, e.clientY);
                    drag.current = {
                      x: p.x,
                      y: p.y,
                      startX: camera.x,
                      startY: camera.y,
                    };
                    e.currentTarget.setPointerCapture(e.pointerId);
                  }}
                  onPointerMove={(e) => {
                    if (!drag.current) return;
                    const p = point(e.clientX, e.clientY),
                      d = drag.current;
                    setCamera((c) => ({
                      ...c,
                      x: d.startX + p.x - d.x,
                      y: d.startY + p.y - d.y,
                    }));
                  }}
                  onPointerUp={(e) => {
                    drag.current = null;
                    if (e.currentTarget.hasPointerCapture(e.pointerId))
                      e.currentTarget.releasePointerCapture(e.pointerId);
                  }}
                  onPointerCancel={() => {
                    drag.current = null;
                  }}
                >
                  <defs>
                    <marker
                      id={marker + "-in"}
                      markerWidth="7"
                      markerHeight="7"
                      refX="7"
                      refY="3.5"
                      orient="auto"
                    >
                      <path d="M0,0 L7,3.5 L0,7" fill="#7c3aed" />
                    </marker>
                    <marker
                      id={marker + "-out"}
                      markerWidth="7"
                      markerHeight="7"
                      refX="7"
                      refY="3.5"
                      orient="auto"
                    >
                      <path d="M0,0 L7,3.5 L0,7" fill="#0e7490" />
                    </marker>
                  </defs>
                  <g
                    transform={`translate(${camera.x} ${camera.y}) scale(${camera.z})`}
                  >
                    {view.edges.map((edge) => {
                      const a = positions.get(edge.source)!,
                        b = positions.get(edge.target)!,
                        out = edge.source === route.focus,
                        incoming = edge.target === route.focus,
                        highlight = out || incoming;
                      const target = nodeMap.get(edge.target)!,
                        distance = Math.max(
                          1,
                          Math.hypot(b.x - a.x, b.y - a.y),
                        ),
                        trim = target.radius + 4;
                      return (
                        <line
                          key={edge.source + ":" + edge.target}
                          x1={a.x}
                          y1={a.y}
                          x2={b.x - ((b.x - a.x) / distance) * trim}
                          y2={b.y - ((b.y - a.y) / distance) * trim}
                          stroke={
                            out ? "#0e7490" : incoming ? "#7c3aed" : "#94a3b8"
                          }
                          strokeWidth={highlight ? 1.5 : 0.7}
                          opacity={highlight ? 0.85 : focusExists ? 0.12 : 0.24}
                          markerEnd={
                            out
                              ? `url(#${marker}-out)`
                              : incoming
                                ? `url(#${marker}-in)`
                                : undefined
                          }
                          pointerEvents="none"
                        />
                      );
                    })}
                    {view.nodes.map((node, index) => {
                      const p = positions.get(node.id)!,
                        focused = node.id === route.focus,
                        neighbor =
                          related.incoming.has(node.id) ||
                          related.outgoing.has(node.id),
                        label =
                          focused || node.id === hover || labelIds.has(node.id);
                      return (
                        <g
                          key={node.id}
                          data-note-id={node.id}
                          ref={(el) => {
                            if (el) nodeRefs.current.set(node.id, el);
                            else nodeRefs.current.delete(node.id);
                          }}
                          role="button"
                          tabIndex={
                            focused || (!focusExists && index === 0) ? 0 : -1
                          }
                          aria-label={`${node.title}. Citada por ${node.incoming} notas; cita ${node.outgoing} notas.`}
                          transform={`translate(${p.x} ${p.y})`}
                          className="cursor-pointer outline-none focus-visible:[&>circle]:stroke-cyan-700 focus-visible:[&>circle]:stroke-[3px]"
                          onClick={() => select(node.id)}
                          onFocus={() => setHover(node.id)}
                          onMouseEnter={() => setHover(node.id)}
                          onMouseLeave={() => setHover("")}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              select(node.id);
                            } else if (e.key.startsWith("Arrow")) {
                              e.preventDefault();
                              moveFocus(node.id, e.key);
                            }
                          }}
                        >
                          <title>
                            {node.title} · {node.incoming} notas citam esta
                            página
                          </title>
                          <circle r={node.radius + 5} fill="transparent" />
                          <circle
                            r={node.radius}
                            fill={TOPIC_COLORS[node.topic] || "#64748b"}
                            opacity={
                              focused || neighbor || !focusExists ? 0.95 : 0.5
                            }
                            stroke={focused ? "#0f172a" : "white"}
                            strokeWidth={focused ? 2.5 : 1.5}
                          />
                          {label && (
                            <text
                              y={node.radius + 16}
                              textAnchor="middle"
                              fontSize={focused ? 14 : 12}
                              fontWeight={focused ? 600 : 400}
                              fill="#334155"
                              stroke="white"
                              strokeWidth={3}
                              paintOrder="stroke"
                              pointerEvents="none"
                            >
                              {node.title.length > 43
                                ? node.title.slice(0, 41) + "…"
                                : node.title}
                            </text>
                          )}
                        </g>
                      );
                    })}
                  </g>
                </svg>
              )}
              <p className="border-t border-slate-100 p-3 text-xs leading-5 text-slate-500">
                Arraste o fundo para mover. Use os botões ou Ctrl + rolagem para
                ampliar. O tamanho representa quantas notas distintas citam a
                página; não indica confiança ou vigência.
              </p>
            </div>
            <aside
              className="rounded-xl border border-slate-200 bg-white p-4"
              aria-label="Nota selecionada no mapa"
            >
              {selected ? (
                <>
                  <p className="text-xs font-medium text-cyan-800">
                    {selected.topic}
                  </p>
                  <h4 className="mt-2 text-lg font-medium leading-snug text-slate-900">
                    {selected.title}
                  </h4>
                  <p className="mt-2 break-all text-xs text-slate-500">
                    {selected.path}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    Citada por {selected.incoming} notas distintas · cita{" "}
                    {selected.outgoing} notas.
                  </p>
                  {!focusExists && (
                    <p className="mt-2 text-xs text-amber-800">
                      Esta nota está fora dos filtros atuais.
                    </p>
                  )}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => onOpen(selected.id)}
                      className={`${control} inline-flex items-center gap-2 border-cyan-200 bg-cyan-50 text-cyan-900`}
                    >
                      <BookOpen size={15} />
                      Abrir nota
                    </button>
                    <button
                      type="button"
                      onClick={() => recenter(selected.id)}
                      className={`${control} inline-flex items-center gap-2`}
                    >
                      <Focus size={15} />
                      Explorar conexões
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
                      className="mt-4 border-t border-slate-100 pt-3"
                    >
                      <summary className="cursor-pointer text-sm font-medium text-slate-700">
                        <Icon size={14} className="mr-1 inline" />
                        {label} ({ids.size})
                      </summary>
                      <div className="mt-2 space-y-1">
                        {graph.nodes
                          .filter((n) => ids.has(n.id))
                          .sort((a, b) =>
                            a.title.localeCompare(b.title, "pt-BR"),
                          )
                          .map((n) => (
                            <button
                              key={n.id}
                              type="button"
                              onClick={() => {
                                select(n.id);
                              }}
                              className="block w-full rounded-lg px-2 py-2 text-left text-xs text-cyan-800 hover:bg-cyan-50"
                            >
                              {n.title}
                            </button>
                          ))}
                      </div>
                    </details>
                  ))}
                </>
              ) : (
                <p className="text-sm leading-6 text-slate-500">
                  Selecione uma nota no mapa ou na lista para ver as referências
                  e abrir a leitura.
                </p>
              )}
            </aside>
          </div>
          <div
            className="flex flex-wrap gap-x-4 gap-y-2 rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-600"
            aria-label="Legenda de assuntos"
          >
            {Object.entries(TOPIC_COLORS).map(([topic, color]) => (
              <span key={topic} className="inline-flex items-center gap-1.5">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: color }}
                />
                {topic}
              </span>
            ))}
            <span>Entradas: violeta · saídas: azul ao selecionar</span>
          </div>
          <details className="rounded-xl border border-slate-200 bg-white p-4">
            <summary className="cursor-pointer text-sm font-medium text-slate-700">
              Navegar pela lista de notas do mapa ({matchingNotes.length})
            </summary>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {matchingNotes.map((n) => (
                <button
                  type="button"
                  key={n.id}
                  onClick={() => select(n.id)}
                  className="rounded-lg border border-slate-200 p-3 text-left text-sm text-slate-700 hover:bg-cyan-50"
                >
                  <span className="block font-medium">{n.title}</span>
                  <span className="mt-1 block text-xs text-slate-500">
                    {n.topic} · {n.incoming} citações distintas
                  </span>
                </button>
              ))}
            </div>
          </details>
        </>
      )}
    </section>
  );
}
