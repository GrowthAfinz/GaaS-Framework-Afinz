import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, CheckCircle2, Clock3, ExternalLink, FileText, FolderOpen, Link2, RefreshCw, Search, ShieldCheck } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { canSyncVault, latestVaultSync, searchVault, syncVault } from './vaultService';
import { filesFromInput, parseVaultFiles, rewriteWikilinksForReader } from './vaultParser';
import { VaultNote, VaultSyncRun } from './vaultTypes';

const OBSIDIAN_VAULT = 'Afinz-CRM-Midia-Vault';
const readableDate = (value?: string | null) => value
  ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
  : 'Ainda não sincronizado';

const obsidianUri = (path: string) => `obsidian://open?vault=${encodeURIComponent(OBSIDIAN_VAULT)}&file=${encodeURIComponent(path.replace(/\.md$/i, ''))}`;

export function VaultWorkspace() {
  const [notes, setNotes] = useState<VaultNote[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [folder, setFolder] = useState<string | null>(null);
  const [syncRun, setSyncRun] = useState<VaultSyncRun | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const folderInput = useRef<HTMLInputElement>(null);

  const load = useCallback(async (nextQuery = query, nextFolder = folder) => {
    setLoading(true);
    setError(null);
    try {
      const [nextNotes, latest] = await Promise.all([searchVault(nextQuery, nextFolder), latestVaultSync()]);
      setNotes(nextNotes);
      setSyncRun(latest);
      setSelectedId((current) => current && nextNotes.some((note) => note.id === current) ? current : nextNotes[0]?.id || null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar o Vault.');
    } finally {
      setLoading(false);
    }
  }, [folder, query]);

  useEffect(() => { void load('', null); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { canSyncVault().then(setIsAdmin).catch(() => setIsAdmin(false)); }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => { void load(query, folder); }, 250);
    return () => window.clearTimeout(timer);
  }, [query, folder]); // eslint-disable-line react-hooks/exhaustive-deps

  const selected = notes.find((note) => note.id === selectedId) || null;
  const folders = useMemo(() => Array.from(new Set(notes.map((note) => note.folder).filter(Boolean))).sort(), [notes]);

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
      await syncVault(parsed, (done, total) => setProgress(`${done} de ${total} notas`));
      setProgress('Sincronização concluída');
      await load(query, folder);
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
    const target = raw.split('#')[0].replace(/\.md$/i, '').toLowerCase();
    const match = notes.find((note) => note.relative_path.replace(/\.md$/i, '').toLowerCase() === target)
      || notes.find((note) => note.relative_path.replace(/^.*\//, '').replace(/\.md$/i, '').toLowerCase() === target.replace(/^.*\//, ''));
    if (match) setSelectedId(match.id);
    else {
      const candidates = await searchVault(raw.split('#')[0].replace(/^.*\//, '').replace(/\.md$/i, ''));
      const resolved = candidates.find((note) => note.relative_path.replace(/\.md$/i, '').toLowerCase() === target)
        || candidates.find((note) => note.relative_path.replace(/^.*\//, '').replace(/\.md$/i, '').toLowerCase() === target.replace(/^.*\//, ''));
      if (resolved) {
        setFolder(null);
        setQuery(resolved.title);
        setNotes(candidates);
        setSelectedId(resolved.id);
      } else window.location.href = obsidianUri(raw.split('#')[0]);
    }
    return true;
  };

  const isStale = !syncRun?.completed_at || Date.now() - new Date(syncRun.completed_at).getTime() > 7 * 24 * 60 * 60 * 1000;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 px-4 py-5 lg:px-6">
      <div className="mx-auto max-w-[1800px] space-y-4">
        <section className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-cyan-50 p-3 text-cyan-700"><BookOpen size={24} /></div>
              <div>
                <div className="flex items-center gap-2"><h1 className="text-xl font-bold text-slate-900">Vault</h1><span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${isStale ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>{isStale ? 'sincronização pendente' : 'fonte viva'}</span></div>
                <p className="mt-1 max-w-3xl text-sm text-slate-500">Biblioteca visual do Obsidian. A edição continua na pasta hospedada; o GaaS mantém uma projeção pesquisável e auditável.</p>
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
          {error && <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        </section>

        <section className="grid min-h-[680px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:grid-cols-[240px_360px_minmax(0,1fr)]">
          <aside className="border-b border-slate-200 bg-slate-50/70 p-4 lg:border-b-0 lg:border-r">
            <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-400"><FolderOpen size={14} /> Estrutura</div>
            <button onClick={() => setFolder(null)} className={`mb-1 w-full rounded-lg px-3 py-2 text-left text-sm ${!folder ? 'bg-cyan-50 font-semibold text-cyan-800' : 'text-slate-600 hover:bg-white'}`}>Todas as notas</button>
            <div className="space-y-1">
              {folders.map((item) => <button key={item} onClick={() => setFolder(item)} className={`w-full truncate rounded-lg px-3 py-2 text-left text-sm ${folder === item ? 'bg-cyan-50 font-semibold text-cyan-800' : 'text-slate-600 hover:bg-white'}`}>{item}</button>)}
            </div>
          </aside>

          <div className="border-b border-slate-200 lg:border-b-0 lg:border-r">
            <div className="border-b border-slate-200 p-3">
              <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 focus-within:border-cyan-400 focus-within:bg-white">
                <Search size={16} className="text-slate-400" />
                <input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full bg-transparent text-sm outline-none" placeholder="Buscar conceitos, tags ou conteúdo…" />
              </label>
              <p className="mt-2 px-1 text-xs text-slate-400">{loading ? 'Buscando…' : `${notes.length} notas encontradas`}</p>
            </div>
            <div className="max-h-[610px] overflow-y-auto p-2">
              {!loading && notes.length === 0 && <div className="m-3 rounded-xl border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500">Nenhuma nota encontrada. {isAdmin ? 'Sincronize a pasta do vault para começar.' : 'A biblioteca ainda não foi publicada.'}</div>}
              {notes.map((note) => <button key={note.id} onClick={() => setSelectedId(note.id)} className={`mb-1 w-full rounded-xl border px-3 py-3 text-left transition ${selectedId === note.id ? 'border-cyan-200 bg-cyan-50' : 'border-transparent hover:border-slate-200 hover:bg-slate-50'}`}>
                <div className="flex items-start gap-2"><FileText size={16} className="mt-0.5 shrink-0 text-slate-400" /><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-800">{note.title}</p><p className="mt-1 truncate text-xs text-slate-400">{note.relative_path}</p></div></div>
                {note.tags?.length > 0 && <div className="mt-2 flex flex-wrap gap-1">{note.tags.slice(0, 3).map((tag) => <span key={tag} className="rounded bg-white px-1.5 py-0.5 text-[10px] text-slate-500">#{tag}</span>)}</div>}
              </button>)}
            </div>
          </div>

          <article className="min-w-0 p-5 lg:p-7">
            {selected ? <>
              <header className="mb-6 border-b border-slate-200 pb-5">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                  <div><h2 className="text-2xl font-bold text-slate-900">{selected.title}</h2><p className="mt-1 text-xs text-slate-400">{selected.relative_path}</p></div>
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
                  code: ({ children }) => <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-800">{children}</code>,
                  a: ({ href, children }) => <a href={href} target={href?.startsWith('vault:') ? undefined : '_blank'} rel="noreferrer" className="font-medium text-cyan-700 underline decoration-cyan-200 underline-offset-2 hover:text-cyan-900" onClick={(event) => { if (href?.startsWith('vault:')) { event.preventDefault(); void openWikilink(href); } }}>{children}</a>,
                }}>{rewriteWikilinksForReader(selected.content_markdown)}</ReactMarkdown>
              </div>
            </> : <div className="flex min-h-[520px] flex-col items-center justify-center text-center text-slate-400"><Link2 size={32} /><p className="mt-3 text-sm">Selecione uma nota para ler.</p></div>}
          </article>
        </section>

        <div className="flex items-center gap-2 px-1 text-xs text-slate-400"><CheckCircle2 size={13} className="text-emerald-500" /> Obsidian é a fonte canônica; exclusões e revisões só entram após uma sincronização concluída.</div>
      </div>
    </div>
  );
}
