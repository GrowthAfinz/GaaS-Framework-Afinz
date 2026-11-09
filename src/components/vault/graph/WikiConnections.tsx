import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { ChevronDown, ChevronUp, Expand, Focus, Info, Maximize2, Moon, RefreshCw, SlidersHorizontal, Sun, Type, X } from "lucide-react";
import type { VaultNote, VaultNoteSummary } from "../vaultTypes";
import { getVaultNote } from "../vaultService";
import { initialMapLayers, mapCategoryLayers } from "./wikiMapReading";
import { WikiMapNote } from "./WikiMapNote";
import { WikiModeBar, type WikiBarCommon } from "../WikiModeBar";
import { fetchWikiGraphLinks, withTimeout } from "./wikiGraphService";
import {
  buildMapData,
  buildWikiGraph,
  graphNeighborhood,
  graphRouteSearch,
  LEGACY_GROUP,
  MAP_GROUPS,
  readGraphRoute,
  type GraphRoute,
  type MapNode,
  type VaultGraphLink,
} from "./wikiGraph";
import type { WikiMapController } from "./wikiMap3dEngine";
import "./wikiMap3d.css";

const THEME_KEY = "gaas:wiki-map-theme";
const LAYERS_KEY = "gaas:wiki-map-layers";
const FILTERS_OPEN_KEY = "gaas:wiki-map-filters-open";
const read = <T,>(key: string, fallback: T): T => {
  try {
    const v = localStorage.getItem(key);
    return v == null ? fallback : (JSON.parse(v) as T);
  } catch {
    return fallback;
  }
};
const write = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private window: the choice just isn't remembered */
  }
};
const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLocaleLowerCase("pt-BR");
const fmt = (n: number) => n.toLocaleString("pt-BR");
const kindOf = (n: MapNode) => (n.type === "topic" ? "assunto" : n.shape === "gem" ? "tabela / dimensão" : n.shape === "oct" ? "skill" : "nota");
const dot = (n: Pick<MapNode, "group">) => ({ "--dot": `var(--m-c-${n.group})` }) as CSSProperties;

// Conexões: the whole Wiki as a 3D map, full width under the Aprendizado e Memória tabs.
// The Wiki bar floats on top; the overview and the selected note sit on the right.
export function WikiConnections({
  bar,
  notes,
  currentNote,
  active,
  syncKey,
  onOpenNote,
}: {
  bar: WikiBarCommon;
  notes: VaultNoteSummary[];
  currentNote: string | null;
  active: boolean;
  syncKey: string;
  onOpen: (id: string) => void;
  onOpenNote: (id: string) => void;
}) {
  const [route, setRoute] = useState<GraphRoute>(() => readGraphRoute(window.location.search, currentNote));
  const [links, setLinks] = useState<VaultGraphLink[] | null>(null);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const [ready, setReady] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">(() => (read<string>(THEME_KEY, "light") === "dark" ? "dark" : "light"));
  const [layers, setLayers] = useState<Record<string, boolean>>(() => {
    const topic = readGraphRoute(window.location.search, currentNote).topic;
    const saved = read<Record<string, boolean>>(LAYERS_KEY, {});
    return initialMapLayers(topic, saved);
  });
  const [detailed, setDetailed] = useState(true);
  // the map starts still: names stay put and are easier to read; the dock button turns the spin on
  const [spin, setSpin] = useState(false);
  // the overview panel starts closed so the map sits in the middle of the screen
  const [about, setAbout] = useState(false);
  // the subject filter can shrink to a single line; the choice is remembered on this browser
  const [filtersOpen, setFiltersOpen] = useState(() => read<boolean>(FILTERS_OPEN_KEY, true) !== false);
  const [contents, setContents] = useState(false);
  const [query, setQuery] = useState("");
  const [hitAt, setHitAt] = useState(0);
  const [searching, setSearching] = useState(false);
  const [opening, setOpening] = useState<{id:string; markdown:string; error:boolean} | null>(null);
  const [openingRetry, setOpeningRetry] = useState(0);
  const noteCache = useRef(new Map<string, VaultNote>());
  const wrap = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const labelBox = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const engine = useRef<WikiMapController | null>(null);
  const [frame, setFrame] = useState<{ height: number; left: number; width: number } | null>(null);

  // ---------------------------------------------------------------- full-bleed size
  // GaaS applies CSS zoom to the page: measure in viewport pixels and convert.
  useLayoutEffect(() => {
    const measure = () => {
      const el = wrap.current, parent = el?.parentElement;
      if (!el || !parent) return;
      const prect = parent.getBoundingClientRect();
      const scale = prect.width / Math.max(1, parent.offsetWidth) || 1;
      const top = el.getBoundingClientRect().top;
      setFrame({
        left: -prect.left / scale,
        width: document.documentElement.clientWidth / scale,
        height: Math.max(480, (window.innerHeight - Math.max(0, top)) / scale),
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    if (wrap.current?.parentElement) observer.observe(wrap.current.parentElement);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  // ---------------------------------------------------------------- route in the URL
  const update = useCallback((patch: Partial<GraphRoute>) => {
    setRoute((previous) => {
      const next = { ...previous, ...patch };
      window.history.replaceState(window.history.state, "", window.location.pathname + graphRouteSearch(window.location.search, next) + window.location.hash);
      return next;
    });
  }, []);
  useEffect(() => {
    const sync = () => setRoute(readGraphRoute(window.location.search, currentNote));
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, [currentNote]);

  // ---------------------------------------------------------------- data
  useEffect(() => {
    if (!active) return;
    let live = true;
    setError("");
    void withTimeout(fetchWikiGraphLinks(), 30000, "O carregamento dos vínculos demorou demais.")
      .then((data) => live && setLinks(data))
      .catch((e) => live && setError(e instanceof Error ? e.message : "Não foi possível carregar os vínculos."));
    return () => {
      live = false;
    };
  }, [active, syncKey, reload]);
  const graph = useMemo(() => buildWikiGraph(notes, links || []), [notes, links]);
  const data = useMemo(() => (links ? buildMapData(graph) : null), [graph, links]);
  const byId = useMemo(() => new Map((data?.nodes || []).map((n) => [n.id, n])), [data]);
  const refs = useMemo(() => {
    const incoming = new Map<string, string[]>(), outgoing = new Map<string, string[]>();
    for (const e of graph.edges) {
      incoming.set(e.target, [...(incoming.get(e.target) || []), e.source]);
      outgoing.set(e.source, [...(outgoing.get(e.source) || []), e.target]);
    }
    return { incoming, outgoing };
  }, [graph]);
  const local = useMemo(
    () => (route.scope === "local" ? graphNeighborhood(graph, route.root, route.depth) : null),
    [graph, route.scope, route.root, route.depth],
  );
  const isVisible = useCallback(
    (n: MapNode) => Boolean(layers[n.group]) && (!local || (n.type === "note" && local.has(n.id))),
    [layers, local],
  );
  const selected = route.focus ? byId.get(route.focus) || null : null;
  const selectedNote = selected?.type === "note" ? selected.id : null;
  useEffect(() => { noteCache.current.clear(); }, [syncKey]);
  useEffect(() => {
    if (!active || !selectedNote) { setOpening(null); return; }
    let live = true;
    setOpening(null);
    const cached = noteCache.current.get(selectedNote);
    void withTimeout(cached ? Promise.resolve(cached) : getVaultNote(selectedNote), 15000, "Prévia indisponível")
      .then(note => { if (live) { noteCache.current.set(note.id, note); setOpening({id:note.id,markdown:note.content_markdown||"",error:false}); } })
      .catch(() => { if (live) setOpening({id:selectedNote,markdown:"",error:true}); });
    return () => { live = false; };
  }, [active, selectedNote, syncKey, openingRetry]);
  useLayoutEffect(() => {
    const toolbar = wrap.current?.querySelector<HTMLElement>(".wiki-bar");
    if (!toolbar) return;
    const measure = () => wrap.current?.style.setProperty("--wm-top", `${toolbar.offsetTop + toolbar.offsetHeight + 12}px`);
    measure(); const observer = new ResizeObserver(measure); observer.observe(toolbar);
    return () => observer.disconnect();
  }, []);

  // ---------------------------------------------------------------- engine
  useEffect(() => {
    if (!data || !wrap.current || !stage.current || !labelBox.current || !ring.current) return;
    let cancelled = false;
    setReady(false);
    void import("./wikiMap3dEngine").then(({ createWikiMap }) => {
      if (cancelled || !wrap.current || !stage.current || !labelBox.current || !ring.current) return;
      engine.current = createWikiMap(wrap.current, stage.current, labelBox.current, ring.current, data, {
        onPick: (id) => pick(id),
        onOpen: (id) => onOpenNote(id),
        onReady: () => setReady(true),
      });
      engine.current.setVisible(isVisible);
      engine.current.setDetailed(detailed);
      engine.current.setSpin(spin);
      engine.current.select(route.focus || null);
    });
    return () => {
      cancelled = true;
      engine.current?.dispose();
      engine.current = null;
    };
    // the engine is rebuilt only when the data changes; everything else is pushed below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);
  useEffect(() => engine.current?.setVisible(isVisible), [isVisible]);
  useEffect(() => engine.current?.select(route.focus || null), [route.focus]);
  useEffect(() => engine.current?.setDetailed(detailed), [detailed]);
  useEffect(() => engine.current?.setSpin(spin), [spin]);
  useEffect(() => {
    write(THEME_KEY, theme);
    engine.current?.recolor();
  }, [theme]);
  useEffect(() => write(LAYERS_KEY, layers), [layers]);
  useEffect(() => write(FILTERS_OPEN_KEY, filtersOpen), [filtersOpen]);
  // a new note starts at its top, not where the previous one was scrolled
  useEffect(() => { const el = wrap.current?.querySelector(".wm-info"); if (el) el.scrollTop = 0; }, [route.focus]);
  useEffect(() => {
    const el = selected ? wrap.current?.querySelector<HTMLElement>(".wm-info") : about ? wrap.current?.querySelector<HTMLElement>(".wm-hero") : null;
    engine.current?.setPanel(el?.offsetWidth || 0);
  }, [selected, about, ready, frame]);

  // ---------------------------------------------------------------- actions
  const pick = (id: string | null) => {
    setContents(false);
    if (!id) return update({ focus: "" });
    const node = byId.get(id);
    if (node?.type === "topic") {
      setLayers(mapCategoryLayers(node.group));
      return update({ focus:id, scope:"all", root:"", topic:node.topic });
    }
    update({ focus: id });
  };
  const ensureVisible = (n: MapNode) => {
    if (!layers[n.group]) { setLayers(mapCategoryLayers(n.group)); update({scope:"all", topic:n.topic}); }
    if (local && !local.has(n.id)) update({ scope: "all" });
  };
  const select = (n: MapNode) => {
    ensureVisible(n);
    pick(n.id);
  };
  const showConnections = (id: string) => update({ scope: "local", root: id, focus: id, depth: route.depth });

  // ---------------------------------------------------------------- search
  const hits = useMemo(() => {
    const s = norm(query.trim());
    if (!s || !data) return [];
    return data.nodes
      .filter((n) => norm(n.label + " " + n.path).includes(s))
      .sort((a, b) => Number(norm(b.label).startsWith(s)) - Number(norm(a.label).startsWith(s)) || b.val - a.val)
      .slice(0, 9);
  }, [query, data]);
  const pickHit = (n: MapNode | undefined) => {
    if (!n) return;
    setQuery("");
    searchInput.current?.blur();
    select(n);
  };
  const onSearchKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" && hits.length) { setHitAt((i) => (i + 1) % hits.length); e.preventDefault(); }
    else if (e.key === "ArrowUp" && hits.length) { setHitAt((i) => (i - 1 + hits.length) % hits.length); e.preventDefault(); }
    else if (e.key === "Enter") pickHit(hits[hitAt]);
    else if (e.key === "Escape") { setQuery(""); searchInput.current?.blur(); }
  };
  useEffect(() => setHitAt(0), [query]);
  useEffect(() => {
    const keys = (e: globalThis.KeyboardEvent) => {
      const typing = document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement;
      if (((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") || (e.key === "/" && !typing)) {
        e.preventDefault();
        searchInput.current?.focus();
      } else if (e.key === "Escape" && !typing) {
        if (contents) setContents(false);
        else if (route.focus) update({ focus: "" });
        else setAbout(false);
      }
    };
    window.addEventListener("keydown", keys);
    return () => window.removeEventListener("keydown", keys);
  }, [contents, route.focus, update]);

  // ---------------------------------------------------------------- views
  const groups = MAP_GROUPS.map((g) => ({ ...g, node: byId.get("topic:" + g.key) })).filter((g) => g.node);
  const membersOf = (key: string) =>
    (data?.nodes || []).filter((n) => n.type === "note" && n.group === key).sort((a, b) => b.incoming - a.incoming || a.label.localeCompare(b.label, "pt-BR"));
  const li = (id: string, meta?: string) => {
    const n = byId.get(id);
    if (!n) return null;
    return (
      <button key={id} type="button" className="wm-li" style={dot(n)} onClick={() => select(n)} onMouseEnter={() => engine.current?.preview(id)} onMouseLeave={() => engine.current?.preview(null)}>
        <span className="wm-dot" />
        {n.label}
        {meta && <span className="m">{meta}</span>}
      </button>
    );
  };
  const list = (ids: string[], max = 14) => {
    const sorted = ids.map((id) => byId.get(id)).filter((n): n is MapNode => Boolean(n)).sort((a, b) => b.incoming - a.incoming);
    return (
      <>
        {sorted.slice(0, max).map((n) => li(n.id, String(n.incoming)))}
        {sorted.length > max && <p className="wm-more">+ {sorted.length - max} notas</p>}
      </>
    );
  };
  const noteCount = (data?.nodes || []).filter((n) => n.type === "note").length;
  const shownNotes = (data?.nodes || []).filter((n) => n.type === "note" && isVisible(n)).length;
  const rootNote = local ? byId.get(route.root) : null;
  const chooseCategory = (key: string | null) => {
    setLayers(mapCategoryLayers(key));
    update({scope:"all",root:"",topic:MAP_GROUPS.find(g=>g.key===key)?.topic||"",focus:key && selected?.group!==key ? "" : route.focus});
  };
  const categoryNames:Record<string,string>={start:"Comece aqui",res:"Resultados",prod:"Produtos",serv:"Serviços",crm:"CRM",dados:"Dados",eng:"Engenharia",strat:"Estratégias",leg:"Legado"};

  return (
    <section
      ref={wrap}
      aria-label="Mapa de conexões da Wiki"
      data-theme={theme}
      className={`wiki-map3d ${selected ? "is-focus" : ""} ${contents ? "is-contents" : ""} ${about ? "is-about" : ""}`}
      // full width and down to the window's bottom edge (the page's bottom padding is absorbed)
      style={frame ? { height: frame.height, width: frame.width, marginLeft: frame.left, marginBottom: -16 } : { height: 600 }}
    >
      <div ref={stage} className="wm-stage" aria-hidden="true" />
      <div ref={labelBox} className="wm-labels" aria-hidden="true" />
      <div ref={ring} className="wm-ring" aria-hidden="true">
        <i />
      </div>
      <div className="wm-veil" aria-hidden="true" />

      <div className={`wm-glass wm-layers ${filtersOpen ? "" : "is-min"}`} role="group" aria-label="Filtrar mapa por assunto">
        <button type="button" className="wm-layers__head" aria-expanded={filtersOpen} aria-controls="wiki-map-filters" title={filtersOpen ? "Minimizar filtros" : "Mostrar filtros"} onClick={() => setFiltersOpen((v) => !v)}>
          <SlidersHorizontal size={13} aria-hidden="true" />
          <span>Filtros</span>
          {!filtersOpen && (() => {
            const only = groups.filter((g) => layers[g.key]);
            const g = only.length === 1 ? only[0] : null;
            return <span className="wm-layers__now" style={g ? dot(g.node!) : undefined}>{g && <span className="wm-dot" />}{g ? categoryNames[g.key] || g.topic : "Todos"}</span>;
          })()}
          {filtersOpen ? <ChevronUp size={14} aria-hidden="true" /> : <ChevronDown size={14} aria-hidden="true" />}
        </button>
        {filtersOpen && <div id="wiki-map-filters" className="wm-layers__grid">
        <button type="button" className="wm-lyr wm-lyr--all" aria-pressed={MAP_GROUPS.every(g=>layers[g.key])} onClick={()=>chooseCategory(null)}>Todos<span className="n">{fmt(noteCount)}</span></button>
        {groups.map(g=><button key={g.key} type="button" className="wm-lyr" style={dot(g.node!)} aria-label={`Filtrar assunto: ${g.topic}`} title={g.topic} aria-pressed={Boolean(layers[g.key]) && MAP_GROUPS.every(other=>other.key===g.key || !layers[other.key])} onClick={()=>chooseCategory(g.key)}><span className="wm-dot"/><span className="t">{categoryNames[g.key]||g.topic}</span><span className="n">{g.node!.count}</span></button>)}
        </div>}
      </div>

      <WikiModeBar
        {...bar}
        floating
        nav={{ label: "Assuntos", open: contents, onToggle: () => setContents((v) => !v), controls: "wiki-map-contents" }}
        search={{
          value: query,
          placeholder: "Buscar nota, tabela ou skill no mapa…",
          ariaLabel: "Buscar nota no mapa",
          inputRef: searchInput,
          onChange: setQuery,
          onKeyDown: onSearchKey,
          onFocus: () => setSearching(true),
          onBlur: () => window.setTimeout(() => setSearching(false), 120),
          results:
            searching && query.trim() ? (
              <div className="wm-hits" role="listbox">
                {hits.length ? (
                  hits.map((n, i) => (
                    <button
                      key={n.id}
                      type="button"
                      role="option"
                      aria-selected={i === hitAt}
                      className={`wm-hit ${i === hitAt ? "is-on" : ""}`}
                      style={dot(n)}
                      onMouseDown={(e) => { e.preventDefault(); pickHit(n); }}
                      onMouseEnter={() => engine.current?.preview(n.id)}
                      onMouseLeave={() => engine.current?.preview(null)}
                    >
                      <span className="wm-dot" />
                      <span>
                        <b>{n.label}</b>
                        <i>{kindOf(n)}{n.type === "note" ? " · " + n.topic : ""}</i>
                      </span>
                    </button>
                  ))
                ) : (
                  <p className="wm-none">Nenhuma nota com esse nome.</p>
                )}
              </div>
            ) : null,
        }}
        extra={
          <button
            type="button"
            className="wm-theme"
            aria-pressed={theme === "dark"}
            title={theme === "dark" ? "Mapa claro" : "Mapa escuro"}
            aria-label={theme === "dark" ? "Mudar o mapa para o tema claro" : "Mudar o mapa para o tema escuro"}
            onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        }
      />

      <section id="wiki-map-about" className="wm-hero" aria-label="Visão geral do mapa">
        <button type="button" className="wm-x" aria-label="Fechar a visão geral do mapa" onClick={() => setAbout(false)}>
          <X size={16} />
        </button>
        <p className="wm-kick">Mapa de conexões</p>
        <h2>Wiki de Growth</h2>
        <p className="wm-lede">
          Cada nota da Wiki é uma bolha e cada linha é um link real entre duas notas. Clique num assunto ou numa bolha pra ver o que ela cita e quem cita ela.
        </p>
        <div className="wm-paths">
          {groups
            .filter((g) => g.topic !== LEGACY_GROUP)
            .map((g) => (
              <button key={g.key} type="button" className="wm-path" style={dot(g.node!)} onClick={() => select(g.node!)} onMouseEnter={() => engine.current?.preview(g.node!.id)} onMouseLeave={() => engine.current?.preview(null)}>
                <span className="pk">{g.code}</span>
                <b>{g.topic}</b>
                <span className="pn">{g.node!.count} notas</span>
                <p>{g.description}</p>
              </button>
            ))}
        </div>
        <div className="wm-stats">
          {[
            [noteCount, "notas"],
            [graph.edges.length, "links entre notas"],
            [groups.filter((g) => g.topic !== LEGACY_GROUP).length, "assuntos"],
          ].map(([value, label]) => (
            <div key={label as string} className="wm-stat">
              <b>{fmt(value as number)}</b>
              <span>{label}</span>
            </div>
          ))}
        </div>
        <p className="wm-hint">
          <span>arraste</span> gira <span>role</span> zoom <span>clique</span> seleciona <span>clique duplo</span> abre
        </p>
      </section>

      <aside className="wm-info" aria-live="polite" aria-label="Nota selecionada">
        {selected && (
          <>
            <button type="button" className="wm-x" aria-label="Fechar e voltar ao mapa inteiro" onClick={() => pick(null)}>
              <X size={16} />
            </button>
            <div className="wm-ik" style={dot(selected)}>
              <span className="wm-dot" />
              {kindOf(selected)}
              {selected.type === "note" && <i>· {selected.topic}</i>}
            </div>
            <h3>{selected.label}</h3>
            {selected.type === "topic" ? (
              <>
                <p className="wm-desc">{selected.description}</p>
                <div className="wm-meta">
                  <span><b>{selected.count}</b> notas</span>
                </div>
                <div className="wm-grp">
                  <h4>Notas do assunto <span>{selected.count}</span></h4>
                  {list(membersOf(selected.group).map((n) => n.id), 30)}
                </div>
              </>
            ) : (
              <>
                <div className="wm-meta">
                  <span><b>{selected.incoming}</b> citada por</span>
                  <span><b>{selected.outgoing}</b> cita</span>
                  <span className="p">{selected.path}</span>
                </div>
                <div className="wm-acts">
                  <button type="button" className="wm-btn" onClick={() => showConnections(selected.id)} title="Mostra só esta nota e as notas ligadas a ela">
                    <Focus size={14} />
                    Conexões
                  </button>
                  <button type="button" className="wm-btn" onClick={() => select(byId.get("topic:" + selected.group)!)}>Ver assunto</button>
                  <button type="button" className="wm-btn is-primary" title="Abre a nota na página inteira, com propriedades e menções" onClick={() => onOpenNote(selected.id)}>
                    <Expand size={14} />
                    Abrir em tela cheia
                  </button>
                </div>
                <section className="wm-opening" aria-label="Conteúdo da nota">
                  {!opening || opening.id!==selected.id ? <p role="status">Carregando a nota…</p> : opening.error ? <><p role="status">Não foi possível carregar a nota aqui. Você pode abrir em tela cheia.</p><button type="button" className="wm-btn" onClick={()=>setOpeningRetry(value=>value+1)}>Tentar novamente</button></> : <WikiMapNote markdown={opening.markdown} path={selected.path} notes={notes} onPickNote={(id) => { const n = byId.get(id); if (n) select(n); }} />}
                </section>
                <div className="wm-grp">
                  <h4>Citada por <span>{refs.incoming.get(selected.id)?.length || 0}</span></h4>
                  {list(refs.incoming.get(selected.id) || [])}
                </div>
                <div className="wm-grp">
                  <h4>Esta nota cita <span>{refs.outgoing.get(selected.id)?.length || 0}</span></h4>
                  {list(refs.outgoing.get(selected.id) || [])}
                </div>
              </>
            )}
          </>
        )}
      </aside>

      <aside id="wiki-map-contents" className="wm-contents" aria-label="Assuntos">
        {contents &&
          groups.map((g) => {
            const members = membersOf(g.key);
            return (
              <div key={g.key} className="wm-cg" style={dot(g.node!)}>
                <h5>
                  <span className="wm-dot" />
                  {g.topic}
                  <span className="n">{members.length}</span>
                </h5>
                <ol>
                  {members.slice(0, 40).map((n) => (
                    <li key={n.id}>
                      <button type="button" className={n.id === route.focus ? "is-cur" : ""} onClick={() => select(n)} onMouseEnter={() => engine.current?.preview(n.id)} onMouseLeave={() => engine.current?.preview(null)}>
                        {n.label}
                      </button>
                    </li>
                  ))}
                  {members.length > 40 && (
                    <li>
                      <button type="button" onClick={() => select(g.node!)}>+ {members.length - 40} notas no assunto</button>
                    </li>
                  )}
                </ol>
              </div>
            );
          })}
      </aside>

      <div className="wm-dock">
        <div className="wm-dock__left">
          {rootNote && (
            <div className="wm-glass wm-scope" role="group" aria-label="Conexões da nota">
              <span>Conexões de <b>{rootNote.label}</b></span>
              {([1, 2] as const).map((depth) => (
                <button key={depth} type="button" aria-pressed={route.depth === depth} onClick={() => update({ depth })}>
                  {depth} {depth === 1 ? "nível" : "níveis"}
                </button>
              ))}
              <button type="button" onClick={() => update({ scope: "all" })}>Ver todas as notas</button>
            </div>
          )}
        </div>
        <div className="wm-ctl">
          <button type="button" className="wm-glass" aria-pressed={about} aria-controls="wiki-map-about" title={about ? "Fechar a visão geral" : "Sobre o mapa"} aria-label={about ? "Fechar a visão geral do mapa" : "Abrir a visão geral do mapa"} onClick={() => { if (selected) pick(null); setAbout((v) => !v || Boolean(selected)); }}>
            <Info size={16} />
          </button>
          <button type="button" className="wm-glass" aria-pressed={detailed} title={detailed ? "Mostrando o nome de mais notas" : "Mostrando só os nomes principais"} aria-label="Mostrar mais nomes de notas" onClick={() => setDetailed((v) => !v)}>
            <Type size={16} />
          </button>
          <button type="button" className="wm-glass" aria-pressed={spin} title={spin ? "Pausar o giro" : "Retomar o giro"} aria-label={spin ? "Pausar o giro" : "Retomar o giro"} onClick={() => setSpin((v) => !v)}>
            <RefreshCw size={16} />
          </button>
          <button type="button" className="wm-glass" title="Enquadrar o mapa inteiro" aria-label="Enquadrar o mapa inteiro" onClick={() => engine.current?.frameAll()}>
            <Maximize2 size={16} />
          </button>
        </div>
      </div>

      <div className={`wm-boot ${ready ? "is-done" : ""}`} role="status">
        {error ? (
          <div>
            <b>Não foi possível abrir o mapa.</b>
            <p style={{ color: "var(--m-soft)", fontSize: 13, margin: "6px 0 12px" }}>{error}</p>
            <button type="button" className="wm-btn" onClick={() => setReload((v) => v + 1)}>Tentar novamente</button>
          </div>
        ) : (
          <div>
            <b>
              Wiki de <span>Growth</span>
            </b>
            <i>{data ? `desenhando ${fmt(shownNotes)} notas…` : "carregando as conexões…"}</i>
          </div>
        )}
      </div>
    </section>
  );
}
