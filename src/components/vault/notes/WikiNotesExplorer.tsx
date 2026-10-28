import {
  Children,
  isValidElement,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  ArrowLeft,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileText,
  Folder,
  FolderOpen,
  LoaderCircle,
  Network,
  Search,
  X,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { VaultBacklink, VaultNote, VaultNoteSummary } from "../vaultTypes";
import { getVaultNote, listVaultBacklinks } from "../vaultService";
import { rewriteWikilinksForReader } from "../vaultParser";
import { vaultUrlTransform } from "../vaultMarkdown";
import { resolveWikiTarget, wikiHeadingId } from "../wikiNavigation";
import { withTimeout } from "../graph/wikiGraphService";
import { ancestorFolders, buildNoteTree, type NoteFolder } from "./noteTree";

const textOf = (children: ReactNode): string =>
  Children.toArray(children)
    .map((child) =>
      typeof child === "string" || typeof child === "number"
        ? String(child)
        : isValidElement<{ children?: ReactNode }>(child)
          ? textOf(child.props.children)
          : "",
    )
    .join("");
const propertyValue = (value: unknown) =>
  Array.isArray(value)
    ? value.map((item) => propertyValue(item)).join(", ")
    : value && typeof value === "object"
      ? JSON.stringify(value)
      : String(value ?? "");

// Plain vault reading, the way Obsidian shows notes: the whole folder tree,
// the note as written, its properties and the notes that mention it.
export function WikiNotesExplorer({
  notes,
  loading,
  noteId,
  fromGraph,
  onOpen,
  onBackToGraph,
  onShowInGraph,
}: {
  notes: VaultNoteSummary[];
  loading: boolean;
  noteId: string | null;
  fromGraph: boolean;
  onOpen: (id: string, fragment?: string) => void;
  onBackToGraph: () => void;
  onShowInGraph: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<Set<string>>(() => new Set());
  const [note, setNote] = useState<VaultNote | null>(null);
  const [backlinks, setBacklinks] = useState<VaultBacklink[]>([]);
  const [reading, setReading] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const cache = useRef(
    new Map<string, { note: VaultNote; backlinks: VaultBacklink[] }>(),
  );
  const page = useRef<HTMLElement>(null);
  const tree = useMemo(() => buildNoteTree(notes, query), [notes, query]);
  const summary = notes.find((n) => n.id === noteId);

  useEffect(() => {
    if (!summary) return;
    setOpen((current) => {
      const next = new Set(current);
      ancestorFolders(summary.relative_path).forEach((path) => next.add(path));
      return next;
    });
  }, [summary]);

  useEffect(() => {
    if (!noteId) {
      setNote(null);
      setBacklinks([]);
      setError("");
      return;
    }
    const cached = cache.current.get(noteId);
    if (cached) {
      setNote(cached.note);
      setBacklinks(cached.backlinks);
      setError("");
      return;
    }
    let active = true;
    setReading(true);
    setError("");
    void withTimeout(
      Promise.all([
        getVaultNote(noteId),
        listVaultBacklinks(noteId).catch(() => [] as VaultBacklink[]),
      ]),
      20000,
      "A nota demorou demais para abrir.",
    )
      .then(([loaded, mentions]) => {
        if (!active) return;
        cache.current.set(noteId, { note: loaded, backlinks: mentions });
        setNote(loaded);
        setBacklinks(mentions);
      })
      .catch(() => {
        if (active) setError("Esta nota não pôde ser aberta.");
      })
      .finally(() => {
        if (active) setReading(false);
      });
    return () => {
      active = false;
    };
  }, [noteId, retry]);

  useEffect(() => {
    if (!note || reading) return;
    const fragment = decodeURIComponent(window.location.hash.slice(1));
    const target = fragment && document.getElementById(wikiHeadingId(fragment));
    if (target) target.scrollIntoView({ block: "start" });
    else page.current?.scrollTo({ top: 0 });
  }, [note, reading]);

  const markdown = useMemo(
    () =>
      rewriteWikilinksForReader(note?.content_markdown || "").replace(
        /^\s*# [^\n]+\r?\n/,
        "",
      ),
    [note],
  );
  const properties = Object.entries(note?.frontmatter || {}).filter(
    ([key]) => key !== "tags",
  );

  const openLink = (target: string) => {
    const [path, ...rest] = target.split("#");
    const fragment = rest.join("#");
    if (!path && note) {
      document.getElementById(wikiHeadingId(fragment))?.scrollIntoView();
      return;
    }
    const matches = resolveWikiTarget(notes, path, note?.relative_path);
    if (matches.length) onOpen(matches[0].id, fragment);
  };
  const toggle = (path: string) =>
    setOpen((current) => {
      const next = new Set(current);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  const heading =
    (Tag: "h2" | "h3" | "h4" | "h5", className: string) =>
    ({ children }: { children?: ReactNode }) => (
      <Tag
        id={wikiHeadingId(textOf(children))}
        className={`scroll-mt-4 ${className}`}
      >
        {children}
      </Tag>
    );

  const renderFolder = (folder: NoteFolder, depth: number): ReactNode => (
    <>
      {folder.folders.map((child) => {
        const expanded = Boolean(query) || open.has(child.path);
        return (
          <div key={child.path}>
            <button
              type="button"
              aria-expanded={expanded}
              onClick={() => toggle(child.path)}
              style={{ paddingLeft: 8 + depth * 14 }}
              className="flex w-full items-center gap-1.5 rounded-md py-1.5 pr-2 text-left text-xs font-medium text-slate-600 hover:bg-slate-100"
            >
              {expanded ? (
                <ChevronDown size={13} className="shrink-0 text-slate-400" />
              ) : (
                <ChevronRight size={13} className="shrink-0 text-slate-400" />
              )}
              {expanded ? (
                <FolderOpen size={14} className="shrink-0 text-slate-400" />
              ) : (
                <Folder size={14} className="shrink-0 text-slate-400" />
              )}
              <span className="min-w-0 flex-1 truncate">{child.name}</span>
              <span className="text-[10px] text-slate-400">{child.count}</span>
            </button>
            {expanded && renderFolder(child, depth + 1)}
          </div>
        );
      })}
      {folder.notes.map((item) => (
        <button
          key={item.id}
          type="button"
          aria-current={item.id === noteId ? "page" : undefined}
          onClick={() => onOpen(item.id)}
          title={item.relative_path}
          style={{ paddingLeft: 8 + depth * 14 + 19 }}
          className={`flex w-full items-start gap-1.5 rounded-md py-1.5 pr-2 text-left text-xs leading-4 ${item.id === noteId ? "bg-cyan-50 font-medium text-cyan-900" : "text-slate-600 hover:bg-slate-100"}`}
        >
          <FileText
            size={13}
            className={`mt-px shrink-0 ${item.id === noteId ? "text-cyan-700" : "text-slate-400"}`}
          />
          <span className="min-w-0">{item.title}</span>
        </button>
      ))}
    </>
  );

  return (
    <div className="grid min-h-[560px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm lg:h-[calc(var(--screen-h)-220px)] lg:grid-cols-[300px_minmax(0,1fr)]">
      <aside
        aria-label="Todas as notas"
        className="flex min-h-0 flex-col border-b border-slate-200 bg-slate-50/70 lg:border-b-0 lg:border-r"
      >
        <div className="border-b border-slate-200 p-3">
          <p className="mb-2 text-xs font-semibold text-slate-700">
            Todas as notas{" "}
            <span className="font-normal text-slate-400">({notes.length})</span>
          </p>
          <label className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-2 py-1.5 focus-within:border-cyan-500">
            <Search size={14} className="shrink-0 text-slate-400" />
            <input
              aria-label="Filtrar notas"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filtrar por nome ou pasta…"
              className="min-w-0 w-full bg-transparent text-xs text-slate-700 outline-none"
            />
            {query && (
              <button aria-label="Limpar filtro" onClick={() => setQuery("")}>
                <X size={12} className="text-slate-400" />
              </button>
            )}
          </label>
        </div>
        <nav className="max-h-80 min-h-0 flex-1 overflow-y-auto p-2 lg:max-h-none">
          {loading ? (
            <p role="status" className="p-3 text-xs text-slate-500">
              Carregando notas…
            </p>
          ) : tree.count ? (
            renderFolder(tree, 0)
          ) : (
            <p className="p-3 text-xs text-slate-500">
              Nenhuma nota encontrada.
            </p>
          )}
        </nav>
      </aside>
      <article
        ref={page}
        aria-busy={reading}
        className="min-h-0 min-w-0 overflow-y-auto"
      >
        <div className="sticky top-0 z-10 flex flex-wrap items-center gap-2 border-b border-slate-100 bg-white/95 px-5 py-2 backdrop-blur">
          {fromGraph && (
            <button
              type="button"
              onClick={onBackToGraph}
              className="inline-flex items-center gap-1.5 rounded-md border border-cyan-200 bg-cyan-50 px-2.5 py-1.5 text-xs font-medium text-cyan-800 hover:bg-cyan-100"
            >
              <ArrowLeft size={13} />
              Voltar ao mapa
            </button>
          )}
          <button
            aria-label="Voltar"
            type="button"
            onClick={() => window.history.back()}
            className="rounded p-1.5 text-slate-500 hover:bg-slate-100"
          >
            <ChevronLeft size={15} />
          </button>
          <button
            aria-label="Avançar"
            type="button"
            onClick={() => window.history.forward()}
            className="rounded p-1.5 text-slate-500 hover:bg-slate-100"
          >
            <ChevronRight size={15} />
          </button>
          {note && (
            <>
              <p className="min-w-0 flex-1 truncate text-xs text-slate-400">
                {note.relative_path.split("/").join(" / ")}
              </p>
              <button
                type="button"
                onClick={() => onShowInGraph(note.id)}
                className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              >
                <Network size={13} />
                Ver no mapa
              </button>
            </>
          )}
        </div>
        <div className="mx-auto max-w-3xl px-6 py-6 lg:px-10">
          {reading ? (
            <div className="flex min-h-[320px] items-center justify-center gap-2 text-sm text-slate-500">
              <LoaderCircle size={18} className="animate-spin" />
              Abrindo nota…
            </div>
          ) : error ? (
            <div role="alert" className="py-16 text-center text-sm">
              <p className="text-red-700">{error}</p>
              <button
                type="button"
                onClick={() => {
                  if (noteId) cache.current.delete(noteId);
                  setRetry((v) => v + 1);
                }}
                className="mt-3 font-medium text-cyan-700 underline"
              >
                Tentar novamente
              </button>
            </div>
          ) : note ? (
            <>
              <h1 className="text-2xl font-semibold leading-tight text-slate-900">
                {note.title}
              </h1>
              {note.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {note.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-cyan-50 px-2 py-0.5 text-[11px] text-cyan-800"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
              {properties.length > 0 && (
                <details className="mt-4 rounded-lg border border-slate-200 text-xs">
                  <summary className="cursor-pointer px-3 py-2 font-medium text-slate-600">
                    Propriedades ({properties.length})
                  </summary>
                  <dl className="grid grid-cols-[minmax(0,10rem)_minmax(0,1fr)] gap-x-3 gap-y-1.5 border-t border-slate-100 px-3 py-2">
                    {properties.map(([key, value]) => (
                      <div key={key} className="contents">
                        <dt className="truncate text-slate-400">{key}</dt>
                        <dd className="break-words text-slate-700">
                          {propertyValue(value)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </details>
              )}
              <div className="mt-6 break-words text-sm leading-7 text-slate-700">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  urlTransform={vaultUrlTransform}
                  components={{
                    h1: heading("h2", "mb-3 mt-8 text-xl font-semibold text-slate-900"),
                    h2: heading("h2", "mb-3 mt-8 border-b border-slate-100 pb-1.5 text-xl font-semibold text-slate-900"),
                    h3: heading("h3", "mb-2 mt-6 text-base font-semibold text-slate-900"),
                    h4: heading("h4", "mb-2 mt-5 font-semibold text-slate-900"),
                    h5: heading("h5", "mt-4 font-semibold text-slate-800"),
                    h6: heading("h5", "mt-4 font-semibold text-slate-800"),
                    p: ({ children }) => <p className="my-3">{children}</p>,
                    ul: ({ children }) => (
                      <ul className="my-3 list-disc space-y-1 pl-6">{children}</ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="my-3 list-decimal space-y-1 pl-6">{children}</ol>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote className="my-4 border-l-4 border-slate-200 pl-4 text-slate-500">
                        {children}
                      </blockquote>
                    ),
                    table: ({ children }) => (
                      <div className="my-5 overflow-x-auto">
                        <table className="w-full border-collapse text-xs">{children}</table>
                      </div>
                    ),
                    th: ({ children }) => (
                      <th className="border border-slate-200 bg-slate-50 px-3 py-2 text-left font-semibold">
                        {children}
                      </th>
                    ),
                    td: ({ children }) => (
                      <td className="border border-slate-200 px-3 py-2 align-top">{children}</td>
                    ),
                    pre: ({ children }) => (
                      <pre className="my-4 overflow-x-auto rounded-lg bg-slate-900 p-4 text-xs leading-6 text-slate-100 [&>code]:bg-transparent [&>code]:p-0 [&>code]:text-inherit">
                        {children}
                      </pre>
                    ),
                    code: ({ children }) => (
                      <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-xs text-slate-700">
                        {children}
                      </code>
                    ),
                    a: ({ href, children }) => {
                      if (!href) return <span>{children}</span>;
                      const internal = href.startsWith("vault:") || href.startsWith("#");
                      const target = href.startsWith("vault:")
                        ? decodeURIComponent(href.slice(6))
                        : href;
                      const missing =
                        href.startsWith("vault:") &&
                        !resolveWikiTarget(notes, target.split("#")[0], note.relative_path).length &&
                        Boolean(target.split("#")[0]);
                      return (
                        <a
                          href={internal ? "#" : href}
                          target={internal ? undefined : "_blank"}
                          rel={internal ? undefined : "noopener noreferrer"}
                          title={missing ? "Nota não encontrada no acervo" : undefined}
                          onClick={(event) => {
                            if (!internal) return;
                            event.preventDefault();
                            openLink(href.startsWith("#") ? href : target);
                          }}
                          className={
                            missing
                              ? "text-slate-400 underline decoration-dotted"
                              : "font-medium text-cyan-700 underline decoration-cyan-300 underline-offset-2 hover:text-cyan-900"
                          }
                        >
                          {children}
                          {!internal && (
                            <ExternalLink size={11} className="ml-1 inline" aria-label="Link externo" />
                          )}
                        </a>
                      );
                    },
                  }}
                >
                  {markdown}
                </ReactMarkdown>
              </div>
              <section
                aria-label="Menções a esta nota"
                className="mt-10 border-t border-slate-200 pt-4"
              >
                <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Mencionada em {backlinks.length}{" "}
                  {backlinks.length === 1 ? "nota" : "notas"}
                </h2>
                {backlinks.length ? (
                  <ul className="space-y-0.5">
                    {backlinks.map((item) => (
                      <li key={`${item.source_note_id}-${item.fragment || ""}`}>
                        <button
                          type="button"
                          onClick={() => onOpen(item.source_note_id)}
                          className="flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left text-xs text-slate-600 hover:bg-slate-50 hover:text-cyan-800"
                        >
                          <FileText size={13} className="mt-px shrink-0 text-slate-400" />
                          <span>
                            {item.source_title}
                            <span className="block text-[10px] text-slate-400">
                              {item.source_path}
                            </span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-400">
                    Nenhuma outra nota aponta para esta.
                  </p>
                )}
              </section>
            </>
          ) : (
            <div className="py-20 text-center">
              <FileText size={28} className="mx-auto text-slate-300" />
              <p className="mt-3 text-sm font-medium text-slate-700">
                Escolha uma nota na árvore
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Todas as {notes.length} notas do acervo, organizadas pelas
                pastas de origem.
              </p>
            </div>
          )}
        </div>
      </article>
    </div>
  );
}
