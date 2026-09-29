import { ChangeEvent, useCallback, useEffect, useRef, useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileText,
  FolderOpen,
  Link2,
  LoaderCircle,
  RefreshCw,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  canSyncVault,
  getVaultNote,
  latestVaultSync,
  listVaultBacklinks,
  listVaultFolders,
  searchVault,
  syncVault,
} from './vaultService';
import { filesFromInput, parseVaultFiles, rewriteWikilinksForReader } from './vaultParser';
import { VaultBacklink, VaultFolderFacet, VaultNote, VaultNoteSummary, VaultSyncRun } from './vaultTypes';
import { openGrowthLearningSectionItem, readGrowthLearningItem } from '../growth-learning/growthLearningNavigation';

const OBSIDIAN_VAULT = 'Afinz-CRM-Midia-Vault';
const PAGE_SIZE = 60;

const readableDate = (value?: string | null) => value
  ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
  : 'Ainda não sincronizado';

const obsidianUri = (path: string) => `obsidian://open?vault=${encodeURIComponent(OBSIDIAN_VAULT)}&file=${encodeURIComponent(path.replace(/\.md$/i, ''))}`;
const normalizedPath = (path: string) => path.replace(/\.md$/i, '').toLocaleLowerCase('pt-BR');

interface VaultWorkspaceProps {
  onCountChange?: (count: number) => void;
}

export function VaultWorkspace({ onCountChange }: VaultWorkspaceProps) {
  const [summaries, setSummaries] = useState<VaultNoteSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(() => readGrowthLearningItem(window.location.search));
  const [selected, setSelected] = useState<VaultNote | null>(null);
  const [backlinks, setBacklinks] = useState<VaultBacklink[]>([]);
  const [folders, setFolders] = useState<VaultFolderFacet[]>([]);
  const [query, setQuery] = useState('');
  const [folder, setFolder] = useState<string | null>(null);
  const [syncRun, setSyncRun] = useState<VaultSyncRun | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [readerLoading, setReaderLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [readerError, setReaderError] = useState<string | null>(null);
  const folderInput = useRef<HTMLInputElement>(null);
  const selectedIdRef = useRef(selectedId);
  const indexRequest = useRef(0);

  useEffect(() => { selectedIdRef.current = selectedId; }, [selectedId]);
  useEffect(() => { onCountChange?.(total); }, [onCountChange, total]);

  const selectNote = useCallback((noteId: string) => {
    setSelectedId(noteId);
    openGrowthLearningSectionItem('vault', noteId);
  }, []);

  const loadIndex = useCallback(async (
    nextQuery: string,
    nextFolder: string | null,
    offset = 0,
    append = false,
  ) => {
    const requestId = ++indexRequest.current;
    setListLoading(true);
    setError(null);
    try {
      const result = await searchVault(nextQuery, nextFolder, offset, PAGE_SIZE);
      if (requestId !== indexRequest.current) return;
      setSummaries((current) => append ? [...current, ...result.items] : result.items);
      setTotal(result.total);
      if (!selectedIdRef.current && result.items[0]) setSelectedId(result.items[0].id);
    } catch (loadError) {
      if (requestId !== indexRequest.current) return;
      setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar a biblioteca.');
      if (!append) {
        setSummaries([]);
        setTotal(0);
      }
    } finally {
      if (requestId === indexRequest.current) setListLoading(false);
    }
  }, []);

  const loadLibraryContext = useCallback(async () => {
    const [folderResult, latestResult, adminResult] = await Promise.allSettled([
      listVaultFolders(),
      latestVaultSync(),
      canSyncVault(),
    ]);
    if (folderResult.status === 'fulfilled') setFolders(folderResult.value);
    if (latestResult.status === 'fulfilled') setSyncRun(latestResult.value);
    if (adminResult.status === 'fulfilled') setIsAdmin(adminResult.value);
  }, []);

  useEffect(() => { void loadLibraryContext(); }, [loadLibraryContext]);
  useEffect(() => {
    const timer = window.setTimeout(() => { void loadIndex(query, folder); }, 250);
    return () => window.clearTimeout(timer);
  }, [folder, loadIndex, query]);

  useEffect(() => {
    const syncFromUrl = () => setSelectedId(readGrowthLearningItem(window.location.search));
    window.addEventListener('popstate', syncFromUrl);
    return () => window.removeEventListener('popstate', syncFromUrl);
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setSelected(null);
      setBacklinks([]);
      return;
    }
    let active = true;
    setReaderLoading(true);
    setReaderError(null);
    Promise.all([getVaultNote(selectedId), listVaultBacklinks(selectedId)])
      .then(([note, nextBacklinks]) => {
        if (!active) return;
        setSelected(note);
        setBacklinks(nextBacklinks);
      })
      .catch((loadError) => {
        if (!active) return;
        setSelected(null);
        setBacklinks([]);
        setReaderError(loadError instanceof Error ? loadError.message : 'Não foi possível abrir esta nota.');
      })
      .finally(() => { if (active) setReaderLoading(false); });
    return () => { active = false; };
  }, [selectedId]);

  const handleFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.length) return;
    setSyncing(true);
    setError(null);
    try {
      setProgress('Lendo a pasta…');
      const sourceFiles = await filesFromInput(event.target.files);
      const parsed = await parseVaultFiles(sourceFiles);
      if (!parsed.length) throw new Error('Nenhuma nota Markdown válida foi encontrada nessa pasta.');
      setProgress(`0 de ${parsed.length} notas`);
      await syncVault(parsed, (done, count) => setProgress(`${done} de ${count} notas`));
      setProgress('Sincronização concluída');
      await Promise.all([loadIndex(query, folder), loadLibraryContext()]);
    } catch (syncError) {
      setError(syncError instanceof Error ? syncError.message : 'A sincronização falhou.');
    } finally {
      setSyncing(false);
      event.target.value = '';
    }
  };

  const openWikilink = async (href?: string) => {
    if (!href?.startsWith('vault:')) return false;
    const raw = decodeURIComponent(href.slice(6));
    const rawPath = raw.split('#')[0];
    const target = normalizedPath(rawPath);
    const filename = target.replace(/^.*\//, '');
    const localMatch = summaries.find((note) => normalizedPath(note.relative_path) === target)
      || summaries.find((note) => normalizedPath(note.relative_path).replace(/^.*\//, '') === filename);
    if (localMatch) {
      selectNote(localMatch.id);
      return true;
    }
    try {
      const result = await searchVault(rawPath.replace(/^.*\//, '').replace(/\.md$/i, ''), null, 0, 20);
      const resolved = result.items.find((note) => normalizedPath(note.relative_path) === target)
        || result.items.find((note) => normalizedPath(note.relative_path).replace(/^.*\//, '') === filename);
      if (resolved) selectNote(resolved.id);
      else window.location.href = obsidianUri(rawPath);
    } catch {
      window.location.href = obsidianUri(rawPath);
    }
    return true;
  };

  const retryReader = () => {
    if (!selectedId) return;
    const noteId = selectedId;
    setSelectedId(null);
    window.setTimeout(() => setSelectedId(noteId), 0);
  };
  const isStale = !syncRun?.completed_at || Date.now() - new Date(syncRun.completed_at).getTime() > 7 * 24 * 60 * 60 * 1000;
  const allFolderCount = folders.reduce((sum, item) => sum + item.note_count, 0);
  const hasMore = summaries.length < total;

  return (
    <section className="space-y-4" aria-label="Biblioteca canônica do Vault">
      <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-violet-50 p-3 text-violet-700"><BookOpen size={22} /></div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-black text-slate-900">Biblioteca Vault</h2>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${isStale ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>{isStale ? 'sincronização pendente' : 'fonte viva'}</span>
              </div>
              <p className="mt-1 max-w-3xl text-sm text-slate-500">Consulte o conhecimento canônico do Obsidian sem misturá-lo com a memória operacional validada pelo loop.</p>
              <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold">
                <span className="rounded-lg bg-violet-50 px-2.5 py-1.5 text-violet-700">Vault · fonte e contexto</span>
                <span className="rounded-lg bg-cyan-50 px-2.5 py-1.5 text-cyan-700">Memória · aprendizado validado e reutilizável</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-500">
              <Clock3 size={14} /><span>Último sync: <strong className="text-slate-700">{readableDate(syncRun?.completed_at)}</strong></span>
            </div>
            {isAdmin && <>
              <input ref={folderInput} className="hidden" type="file" multiple {...({ webkitdirectory: '', directory: '' } as Record<string, string>)} onChange={handleFiles} />
              <button type="button" disabled={syncing} onClick={() => folderInput.current?.click()} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60">
                <RefreshCw size={15} className={syncing ? 'animate-spin' : ''} />{syncing ? progress : 'Sincronizar pasta'}
              </button>
            </>}
          </div>
        </div>
        {error && <div role="alert" className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"><span>{error}</span><button type="button" onClick={() => void loadIndex(query, folder)} className="shrink-0 font-bold underline">Tentar novamente</button></div>}
      </div>

      <div className="grid min-h-[660px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm xl:grid-cols-[220px_340px_minmax(0,1fr)]">
        <aside className="border-b border-slate-200 bg-slate-50/70 p-4 xl:border-b-0 xl:border-r" aria-label="Pastas do Vault">
          <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-slate-400"><FolderOpen size={14} /> Estrutura</div>
          <button type="button" onClick={() => setFolder(null)} className={`mb-1 flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm ${!folder ? 'bg-cyan-50 font-semibold text-cyan-800' : 'text-slate-600 hover:bg-white'}`}><span>Todas as notas</span><span className="text-xs tabular-nums">{allFolderCount || total}</span></button>
          <div className="grid gap-1 sm:grid-cols-2 xl:grid-cols-1">
            {folders.map((item) => <button type="button" key={item.folder || '__root__'} onClick={() => setFolder(item.folder)} className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm ${folder === item.folder ? 'bg-cyan-50 font-semibold text-cyan-800' : 'text-slate-600 hover:bg-white'}`}><span className="truncate">{item.folder || 'Raiz'}</span><span className="text-xs tabular-nums text-slate-400">{item.note_count}</span></button>)}
          </div>
        </aside>

        <div className="border-b border-slate-200 xl:border-b-0 xl:border-r" aria-busy={listLoading}>
          <div className="border-b border-slate-200 p-3">
            <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 focus-within:border-cyan-400 focus-within:bg-white">
              <Search size={16} className="text-slate-400" />
              <span className="sr-only">Buscar no Vault</span>
              <input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full bg-transparent text-sm outline-none" placeholder="Buscar conceitos, tags ou conteúdo…" />
              {query && <button type="button" aria-label="Limpar busca" onClick={() => setQuery('')} className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"><X size={14} /></button>}
            </label>
            <p className="mt-2 px-1 text-xs text-slate-400" aria-live="polite">{listLoading && summaries.length === 0 ? 'Buscando…' : `${total} ${total === 1 ? 'nota encontrada' : 'notas encontradas'}`}</p>
          </div>
          <div className="max-h-[680px] overflow-y-auto p-2">
            {listLoading && summaries.length === 0 && <div className="space-y-2 p-1" aria-label="Carregando notas">{Array.from({ length: 7 }).map((_, index) => <div key={index} className="h-[68px] animate-pulse rounded-xl bg-slate-100" />)}</div>}
            {!listLoading && summaries.length === 0 && <div className="m-3 rounded-xl border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500">Nenhuma nota neste recorte. Ajuste a busca ou escolha outra pasta.</div>}
            {summaries.map((note) => <button type="button" key={note.id} onClick={() => selectNote(note.id)} aria-current={selectedId === note.id ? 'true' : undefined} className={`mb-1 w-full rounded-xl border px-3 py-3 text-left transition ${selectedId === note.id ? 'border-cyan-200 bg-cyan-50' : 'border-transparent hover:border-slate-200 hover:bg-slate-50'}`}>
              <div className="flex items-start gap-2"><FileText size={16} className="mt-0.5 shrink-0 text-slate-400" /><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-800">{note.title}</p><p className="mt-1 truncate text-xs text-slate-400">{note.relative_path}</p></div></div>
              {note.tags?.length > 0 && <div className="mt-2 flex flex-wrap gap-1">{note.tags.slice(0, 3).map((tag) => <span key={tag} className="rounded bg-white px-1.5 py-0.5 text-[10px] text-slate-500">#{tag}</span>)}</div>}
            </button>)}
            {hasMore && <button type="button" disabled={listLoading} onClick={() => void loadIndex(query, folder, summaries.length, true)} className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-bold text-slate-600 hover:border-cyan-300 hover:text-cyan-700 disabled:opacity-60">{listLoading && <LoaderCircle size={14} className="animate-spin" />}Carregar mais</button>}
          </div>
        </div>

        <article className="min-w-0 p-5 lg:p-7" aria-busy={readerLoading}>
          {readerLoading ? <div className="space-y-4" aria-label="Carregando nota"><div className="h-9 w-2/3 animate-pulse rounded bg-slate-100" /><div className="h-4 w-1/2 animate-pulse rounded bg-slate-100" /><div className="mt-8 space-y-3">{Array.from({ length: 8 }).map((_, index) => <div key={index} className={`h-4 animate-pulse rounded bg-slate-100 ${index % 3 === 0 ? 'w-4/5' : 'w-full'}`} />)}</div></div> : readerError ? <div role="alert" className="flex min-h-[480px] flex-col items-center justify-center text-center"><Link2 size={32} className="text-red-300" /><p className="mt-3 text-sm font-semibold text-red-700">{readerError}</p><button type="button" onClick={retryReader} className="mt-3 text-xs font-bold text-cyan-700 underline">Tentar abrir novamente</button></div> : selected ? <>
            <header className="mb-6 border-b border-slate-200 pb-5">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                <div><h3 className="text-2xl font-bold text-slate-900">{selected.title}</h3><p className="mt-1 text-xs text-slate-400">{selected.relative_path}</p></div>
                <a href={obsidianUri(selected.relative_path)} className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:border-cyan-300 hover:text-cyan-700"><ExternalLink size={14} /> Abrir no Obsidian</a>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                {selected.layer && <span className="rounded-full bg-violet-50 px-2.5 py-1 text-violet-700">{selected.layer}</span>}
                {selected.note_type && <span className="rounded-full bg-blue-50 px-2.5 py-1 text-blue-700">{selected.note_type}</span>}
                {selected.status && <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">{selected.status}</span>}
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-slate-500"><ShieldCheck size={12} /> indexada {readableDate(selected.indexed_at)}</span>
              </div>
            </header>
            <div className="max-w-none text-sm leading-7 text-slate-700">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                h1: ({ children }) => <h1 className="mb-4 mt-8 text-2xl font-bold text-slate-900 first:mt-0">{children}</h1>,
                h2: ({ children }) => <h2 className="mb-3 mt-8 border-b border-slate-100 pb-2 text-xl font-bold text-slate-900">{children}</h2>,
                h3: ({ children }) => <h3 className="mb-2 mt-6 text-base font-bold text-slate-900">{children}</h3>,
                p: ({ children }) => <p className="my-3">{children}</p>,
                ul: ({ children }) => <ul className="my-3 list-disc space-y-1 pl-6">{children}</ul>,
                ol: ({ children }) => <ol className="my-3 list-decimal space-y-1 pl-6">{children}</ol>,
                blockquote: ({ children }) => <blockquote className="my-4 border-l-4 border-cyan-300 bg-cyan-50/50 px-4 py-2 text-slate-600">{children}</blockquote>,
                table: ({ children }) => <div className="my-5 overflow-x-auto"><table className="w-full border-collapse text-xs">{children}</table></div>,
                th: ({ children }) => <th className="border border-slate-200 bg-slate-50 px-3 py-2 text-left font-semibold">{children}</th>,
                td: ({ children }) => <td className="border border-slate-200 px-3 py-2 align-top">{children}</td>,
                pre: ({ children }) => <pre className="my-4 overflow-x-auto rounded-xl bg-slate-950 p-4 text-xs leading-6 text-slate-100">{children}</pre>,
                code: ({ children }) => <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-800">{children}</code>,
                a: ({ href, children }) => <a href={href} target={href?.startsWith('vault:') ? undefined : '_blank'} rel="noreferrer" className="font-medium text-cyan-700 underline decoration-cyan-200 underline-offset-2 hover:text-cyan-900" onClick={(event) => { if (href?.startsWith('vault:')) { event.preventDefault(); void openWikilink(href); } }}>{children}</a>,
              }}>{rewriteWikilinksForReader(selected.content_markdown)}</ReactMarkdown>
            </div>
            {backlinks.length > 0 && <aside className="mt-10 border-t border-slate-200 pt-5" aria-label="Notas que apontam para esta nota"><div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-slate-400"><Link2 size={14} /> Citada por {backlinks.length} {backlinks.length === 1 ? 'nota' : 'notas'}</div><div className="grid gap-2 sm:grid-cols-2">{backlinks.map((backlink) => <button type="button" key={`${backlink.source_note_id}-${backlink.fragment || ''}`} onClick={() => selectNote(backlink.source_note_id)} className="rounded-xl border border-slate-200 px-3 py-2.5 text-left hover:border-cyan-300 hover:bg-cyan-50"><span className="block truncate text-sm font-semibold text-slate-700">{backlink.source_title}</span><span className="mt-1 block truncate text-xs text-slate-400">{backlink.source_path}</span></button>)}</div></aside>}
          </> : <div className="flex min-h-[520px] flex-col items-center justify-center text-center text-slate-400"><Link2 size={32} /><p className="mt-3 text-sm">Selecione uma nota para ler.</p></div>}
        </article>
      </div>

      <div className="flex items-center gap-2 px-1 text-xs text-slate-400"><CheckCircle2 size={13} className="text-emerald-500" /> O Obsidian continua sendo a fonte canônica; a biblioteca é uma projeção pesquisável e auditável.</div>
    </section>
  );
}
