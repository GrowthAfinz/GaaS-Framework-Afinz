import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, ChevronLeft, ChevronRight, Copy, ExternalLink, FileText, FolderOpen, Home, Link2, LoaderCircle, Menu, RefreshCw, Search, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { canSyncVault, getVaultNote, latestVaultSync, listVaultBacklinks, listVaultFolders, searchVault, syncVault } from './vaultService';
import { filesFromInput, parseVaultFiles, rewriteWikilinksForReader } from './vaultParser';
import { VaultBacklink, VaultFolderFacet, VaultNote, VaultNoteSummary, VaultSyncRun } from './vaultTypes';
import { vaultUrlTransform } from './vaultMarkdown';
import { prepareWikiMarkdown, resolveWikiTarget, WIKI_TOPICS, wikiHeadingId } from './wikiNavigation';
import { buildGrowthLearningSectionItemSearch, readGrowthLearningItem } from '../growth-learning/growthLearningNavigation';

const PAGE_SIZE = 60;
const dateLabel = (value?: string | null) => value ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : 'Não informada';
const readQuery = () => new URLSearchParams(window.location.search).get('wiki_q') || '';
const readFolder = () => new URLSearchParams(window.location.search).get('wiki_folder');

export function VaultWorkspace({ onCountChange }: { onCountChange?: (count: number) => void }) {
  const [summaries, setSummaries] = useState<VaultNoteSummary[]>([]);
  const [catalog, setCatalog] = useState<VaultNoteSummary[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(() => readGrowthLearningItem(window.location.search));
  const [selected, setSelected] = useState<VaultNote | null>(null);
  const [backlinks, setBacklinks] = useState<VaultBacklink[]>([]);
  const [folders, setFolders] = useState<VaultFolderFacet[]>([]);
  const [query, setQuery] = useState(readQuery);
  const [folder, setFolder] = useState<string | null>(readFolder);
  const [browse, setBrowse] = useState(() => Boolean(readQuery() || readFolder() || new URLSearchParams(window.location.search).get('wiki_browse')));
  const [sidebar, setSidebar] = useState(() => window.innerWidth >= 1024);
  const [syncRun, setSyncRun] = useState<VaultSyncRun | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [readerLoading, setReaderLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [readerError, setReaderError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [choices, setChoices] = useState<VaultNoteSummary[]>([]);
  const [retry, setRetry] = useState(0);
  const [routeVersion, setRouteVersion] = useState(0);
  const folderInput = useRef<HTMLInputElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const reader = useRef<HTMLElement>(null);
  const indexRequest = useRef(0);
  const noteCache = useRef(new Map<string, VaultNote>());
  const backlinkCache = useRef(new Map<string, VaultBacklink[]>());
  const positions = useRef(new Map<string, number>());
  const readerPage = useRef<string | null>(null);
  const selectedRef = useRef<string | null>(selectedId);
  const prepared = useMemo(() => prepareWikiMarkdown(rewriteWikilinksForReader(selected?.content_markdown || '')), [selected]);
  const allCount = folders.reduce((sum, item) => sum + item.note_count, 0);

  useEffect(() => { onCountChange?.(allCount); }, [allCount, onCountChange]);
  useEffect(() => { selectedRef.current = selectedId; }, [selectedId]);

  const navigate = useCallback((id: string | null, fragment = '') => {
    if (readerPage.current) positions.current.set(readerPage.current, window.scrollY);
    const search = buildGrowthLearningSectionItemSearch('vault', id, window.location.search);
    window.history.pushState({}, '', `${window.location.pathname}${search}${fragment ? `#${encodeURIComponent(fragment)}` : ''}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
    setNotice(null); setChoices([]);
    if (!id) window.scrollTo({ top: 0 });
    if (window.innerWidth < 1024) setSidebar(false);
  }, []);

  const loadIndex = useCallback(async (nextQuery: string, nextFolder: string | null, offset = 0, append = false) => {
    const requestId = ++indexRequest.current;
    setListLoading(true); setError(null);
    try {
      const result = await searchVault(nextQuery, nextFolder, offset, PAGE_SIZE);
      if (requestId !== indexRequest.current) return;
      setSummaries(current => append ? [...current, ...result.items] : result.items); setTotal(result.total);
    } catch (failure) {
      if (requestId !== indexRequest.current) return;
      setError(failure instanceof Error ? failure.message : 'Não foi possível buscar as notas.');
    } finally { if (requestId === indexRequest.current) setListLoading(false); }
  }, []);

  const loadContext = useCallback(async () => {
    const results = await Promise.allSettled([listVaultFolders(), latestVaultSync(), canSyncVault()]);
    if (results[0].status === 'fulfilled') setFolders(results[0].value);
    if (results[1].status === 'fulfilled') setSyncRun(results[1].value);
    if (results[2].status === 'fulfilled') setIsAdmin(results[2].value);
    setCatalogLoading(true);
    try {
      const notes: VaultNoteSummary[] = [];
      let count = Infinity;
      while (notes.length < count) {
        const page = await searchVault('', null, notes.length, 100);
        count = page.total;
        notes.push(...page.items);
        if (!page.items.length) break;
      }
      setCatalog(notes);
    } catch { setError('Não foi possível carregar o índice de navegação. Tente novamente.'); }
    finally { setCatalogLoading(false); }
  }, []);
  useEffect(() => { void loadContext(); }, [loadContext]);

  useEffect(() => {
    const syncUrl = () => {
      if (readerPage.current) positions.current.set(readerPage.current, window.scrollY);
      setRouteVersion(value => value + 1);
      setSelectedId(readGrowthLearningItem(window.location.search));
      setQuery(readQuery()); setFolder(readFolder());
      setBrowse(Boolean(readQuery() || readFolder() || new URLSearchParams(window.location.search).get('wiki_browse')));
    };
    window.addEventListener('popstate', syncUrl);
    const keyboard = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault(); setSidebar(true); window.requestAnimationFrame(() => searchInput.current?.focus());
      }
    };
    window.addEventListener('keydown', keyboard);
    return () => { window.removeEventListener('popstate', syncUrl); window.removeEventListener('keydown', keyboard); };
  }, []);

  useEffect(() => {
    if (!browse) return;
    const timer = window.setTimeout(() => { void loadIndex(query, folder); }, 250);
    return () => window.clearTimeout(timer);
  }, [browse, query, folder, loadIndex]);

  const filter = (nextQuery: string, nextFolder: string | null, showResults = true) => {
    setQuery(nextQuery); setFolder(nextFolder); setBrowse(showResults); setSidebar(true);
    const params = new URLSearchParams(window.location.search);
    if (nextQuery) params.set('wiki_q', nextQuery); else params.delete('wiki_q');
    if (nextFolder) params.set('wiki_folder', nextFolder); else params.delete('wiki_folder');
    if (showResults) params.set('wiki_browse', '1'); else params.delete('wiki_browse');
    window.history.replaceState(window.history.state, '', `${window.location.pathname}?${params}${window.location.hash}`);
  };

  useEffect(() => {
    if (!selectedId) { setSelected(null); setBacklinks([]); setReaderError(null); setReaderLoading(false); readerPage.current = null; return; }
    let active = true;
    setReaderLoading(true); setReaderError(null);
    const cached = noteCache.current.get(selectedId);
    const cachedBacklinks = backlinkCache.current.get(selectedId);
    Promise.allSettled([cached ? Promise.resolve(cached) : getVaultNote(selectedId), cachedBacklinks ? Promise.resolve(cachedBacklinks) : listVaultBacklinks(selectedId)])
      .then(results => {
        if (!active) return;
        if (results[0].status === 'rejected') {
          setSelected(null); setBacklinks([]); setReaderError('Esta nota não está disponível. Volte ao início ou tente novamente.'); return;
        }
        const note = results[0].value;
        noteCache.current.set(selectedId, note); setSelected(note);
        if (results[1].status === 'fulfilled') { backlinkCache.current.set(selectedId, results[1].value); setBacklinks(results[1].value); }
        else { setBacklinks([]); setNotice('A nota abriu, mas as referências relacionadas não puderam ser carregadas.'); }
      }).finally(() => { if (active) setReaderLoading(false); });
    return () => { active = false; };
  }, [selectedId, retry]);

  useEffect(() => {
    if (!selected || readerLoading) return;
    const frame = window.requestAnimationFrame(() => {
      const fragment = decodeURIComponent(window.location.hash.slice(1));
      if (fragment) {
        const element = document.getElementById(fragment) || document.getElementById(wikiHeadingId(fragment));
        if (element) element.scrollIntoView({ block: 'start' });
        else setNotice(`A seção “${fragment}” não foi encontrada nesta nota.`);
      } else if (readerPage.current !== selected.id) window.scrollTo({ top: positions.current.get(selected.id) ?? (reader.current ? reader.current.getBoundingClientRect().top + window.scrollY - 90 : 0) });
      readerPage.current = selected.id;
    });
    return () => window.cancelAnimationFrame(frame);
  }, [selected, readerLoading, selectedId, routeVersion]);

  const openTarget = (target: string) => {
    const [path, ...fragments] = target.split('#');
    const fragment = fragments.join('#');
    if (!path && selectedRef.current) { navigate(selectedRef.current, fragment); return; }
    if (catalogLoading) { setNotice('O índice está carregando. Tente abrir o link em alguns instantes.'); return; }
    const matches = resolveWikiTarget(catalog, path, selected?.relative_path);
    if (matches.length === 1) navigate(matches[0].id, fragment);
    else if (matches.length > 1) { setNotice(`Há mais de uma nota chamada “${path}”. Escolha abaixo.`); setChoices(matches); }
    else { setNotice(`A nota “${path}” não foi encontrada na Wiki. Ela pode não ter sido sincronizada.`); setChoices([]); }
  };

  const handleFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.length) return;
    setSyncing(true); setError(null);
    try {
      setProgress('Lendo pasta…');
      const parsed = await parseVaultFiles(await filesFromInput(event.target.files));
      if (!parsed.length) throw new Error('Nenhuma nota Markdown válida foi encontrada.');
      await syncVault(parsed, (done, count) => setProgress(`${done} de ${count} notas`));
      noteCache.current.clear(); backlinkCache.current.clear(); setRetry(value => value + 1);
      await loadContext(); if (browse) await loadIndex(query, folder);
      setNotice('Sincronização concluída.');
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'A sincronização falhou.'); }
    finally { setSyncing(false); event.target.value = ''; }
  };

  const copyLink = async () => {
    try { await navigator.clipboard.writeText(window.location.href); setNotice('Link da nota copiado. O acesso continua restrito à equipe.'); }
    catch { setNotice('Não foi possível copiar. Você pode copiar o endereço na barra do navegador.'); }
  };
  const headingProps = (line?: number) => ({ id: prepared.headings.find(item => item.line === line)?.id, className: 'scroll-mt-24' });
  const linkMeta = (href?: string) => {
    if (href?.startsWith('vault:')) return { internal: true, target: decodeURIComponent(href.slice(6)) };
    if (href?.startsWith('#')) return { internal: true, target: href };
    if (href && !/^[a-z][a-z\d+.-]*:/i.test(href)) return { internal: true, target: decodeURIComponent(href) };
    return { internal: false, target: href || '' };
  };

  return <section aria-label="Wiki de Growth" className="space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="flex items-center gap-3"><button type="button" aria-label={sidebar ? 'Recolher navegação' : 'Mostrar navegação'} aria-expanded={sidebar} onClick={() => setSidebar(value => !value)} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"><Menu size={19} /></button><BookOpen size={21} className="text-cyan-700" /><div><h2 className="text-lg font-black text-slate-900">Wiki de Growth</h2><p className="text-xs text-slate-500">Serviços, produtos e contexto da operação</p></div></div>
      <div className="flex items-center gap-3 text-xs text-slate-500"><span>Índice atualizado: {dateLabel(syncRun?.completed_at)}</span>{isAdmin && <details className="relative"><summary className="cursor-pointer rounded-lg border border-slate-200 px-3 py-2 font-semibold text-slate-600">Administrar</summary><div className="absolute right-0 z-20 mt-2 w-60 rounded-xl border border-slate-200 bg-white p-3 shadow-lg"><p className="mb-3 text-xs leading-5">Atualize a projeção a partir da pasta de origem.</p><input ref={folderInput} className="hidden" type="file" multiple {...({ webkitdirectory: '', directory: '' } as Record<string, string>)} onChange={handleFiles} /><button type="button" disabled={syncing} onClick={() => folderInput.current?.click()} className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white disabled:opacity-60"><RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />{syncing ? progress : 'Sincronizar pasta'}</button></div></details>}</div>
    </div>
    {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error} <button type="button" onClick={() => { void loadContext(); if (browse) void loadIndex(query, folder); }} className="font-bold underline">Tentar novamente</button></div>}
    {notice && <div role="status" className="flex items-start justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"><div>{notice}{choices.map(note => <button key={note.id} type="button" onClick={() => navigate(note.id)} className="mt-2 block text-left font-semibold underline">{note.title} · {note.relative_path}</button>)}</div><button aria-label="Fechar aviso" type="button" onClick={() => { setNotice(null); setChoices([]); }}><X size={16} /></button></div>}
    <div className={`grid min-h-[560px] rounded-2xl border border-slate-200 bg-white shadow-sm ${sidebar ? 'lg:grid-cols-[300px_minmax(0,1fr)]' : ''}`}>
      {sidebar && <aside className="rounded-t-2xl border-b border-slate-200 bg-slate-50/60 p-4 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:self-start lg:overflow-y-auto lg:rounded-l-2xl lg:rounded-tr-none lg:border-b-0 lg:border-r" aria-label="Explorar a Wiki">
        <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 focus-within:border-cyan-500"><Search size={16} className="shrink-0 text-slate-500" /><span className="sr-only">Buscar na Wiki</span><input ref={searchInput} value={query} onChange={event => filter(event.target.value, folder)} className="min-w-0 w-full bg-transparent text-sm outline-none" placeholder="Buscar na Wiki…" />{query && <button type="button" aria-label="Limpar busca" onClick={() => filter('', folder)}><X size={14} /></button>}</label>
        <p className="mt-2 text-xs text-slate-500">Busca por conteúdo e tags · Ctrl / ⌘ K</p>
        <div className="my-4 flex gap-2"><button type="button" onClick={() => { filter('', null, false); navigate(null); }} className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700"><Home size={14} />Início</button><button type="button" onClick={() => filter('', null)} className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700">Todas ({allCount})</button></div>
        {browse ? <div aria-busy={listLoading}>
          <div className="mb-3 flex items-center justify-between gap-2"><p className="text-xs text-slate-500" aria-live="polite">{listLoading ? 'Buscando…' : `${total} notas encontradas`}</p><button type="button" onClick={() => filter('', null, false)} className="text-xs font-bold text-cyan-700">Assuntos</button></div>
          {folder && <p className="mb-2 break-words text-xs text-slate-500">Pasta: {folder}</p>}
          <div className="max-h-[65vh] space-y-1 overflow-y-auto">
            {summaries.map(note => <button key={note.id} type="button" aria-current={selectedId === note.id ? 'page' : undefined} onClick={() => navigate(note.id)} className={`w-full rounded-xl border px-3 py-3 text-left ${selectedId === note.id ? 'border-cyan-200 bg-cyan-50' : 'border-transparent hover:border-slate-200 hover:bg-white'}`}><div className="flex items-start gap-2"><FileText size={15} className="mt-1 shrink-0 text-slate-500" /><span className="text-sm font-semibold leading-5 text-slate-800">{note.title}</span></div><p className="mt-1 text-xs text-slate-500">{note.folder || 'Geral'}</p></button>)}
            {!listLoading && !total && <p className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-600">Nenhuma nota encontrada. Ajuste a busca ou remova o filtro.</p>}
            {summaries.length < total && <button disabled={listLoading} type="button" onClick={() => void loadIndex(query, folder, summaries.length, true)} className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs font-bold text-slate-700 disabled:opacity-60">{listLoading ? 'Carregando…' : 'Carregar mais'}</button>}
          </div>
        </div> : <><p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Explorar por assunto</p><nav className="space-y-1">{WIKI_TOPICS.map(topic => <button type="button" key={topic.title} onClick={() => openTarget(topic.target)} className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-white hover:text-cyan-800">{topic.title}</button>)}</nav><details className="mt-5 border-t border-slate-200 pt-3"><summary className="cursor-pointer text-xs font-semibold text-slate-500">Pastas técnicas</summary><div className="mt-2 space-y-1">{folders.map(item => <button type="button" key={item.folder} onClick={() => filter('', item.folder || null)} className="flex w-full items-center justify-between gap-2 rounded-lg p-2 text-left text-xs text-slate-600 hover:bg-white"><span className="flex items-center gap-2"><FolderOpen size={13} />{item.folder || 'Raiz'}</span><span>{item.note_count}</span></button>)}</div></details></>}
      </aside>}
      <article ref={reader} className="min-w-0 p-5 lg:p-8" aria-busy={readerLoading}>
        {readerLoading ? <div className="flex min-h-[360px] items-center justify-center gap-2 text-sm text-slate-500"><LoaderCircle size={20} className="animate-spin" />Abrindo nota…</div> : readerError ? <div role="alert" className="py-16 text-center"><p className="text-sm text-red-700">{readerError}</p><button type="button" onClick={() => { if (selectedId) noteCache.current.delete(selectedId); setRetry(value => value + 1); }} className="mt-4 text-sm font-bold text-cyan-700 underline">Tentar novamente</button></div> : selected ? <>
          <header className="mb-5 border-b border-slate-200 pb-4"><div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs"><div className="flex items-center gap-2 text-slate-500"><button type="button" onClick={() => navigate(null)} className="font-semibold text-cyan-700">Wiki</button><ChevronRight size={12} /><span>{selected.folder.replace(/^\d+-/, '').replace(/-/g, ' ') || 'Geral'}</span></div><div className="flex items-center gap-1"><button aria-label="Voltar" type="button" onClick={() => window.history.back()} className="rounded p-2 text-slate-600 hover:bg-slate-100"><ChevronLeft size={16} /></button><button aria-label="Avançar" type="button" onClick={() => window.history.forward()} className="rounded p-2 text-slate-600 hover:bg-slate-100"><ChevronRight size={16} /></button><button type="button" onClick={() => void copyLink()} className="flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1.5 font-semibold text-slate-600"><Copy size={13} />Copiar link</button></div></div><h3 className="text-2xl font-bold tracking-tight text-slate-900">{selected.title}</h3><div className="mt-3 flex flex-wrap gap-2 text-xs">{selected.status && <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-600">Estado documental: {selected.status}</span>}<span className="py-1 text-slate-500">Fonte atualizada: {dateLabel(selected.source_modified_at)}</span></div><details className="mt-2 text-xs text-slate-500"><summary className="cursor-pointer">Detalhes da fonte</summary><p className="mt-2 break-all">{selected.relative_path}</p><p className="mt-1">Indexada: {dateLabel(selected.indexed_at)} · {selected.source || 'Acervo interno'}</p>{selected.tags?.length > 0 && <p className="mt-1">{selected.tags.map(tag => `#${tag}`).join(' · ')}</p>}</details></header>
          {prepared.headings.some(item => item.depth <= 3) && <details className="mb-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"><summary className="cursor-pointer text-sm font-bold text-slate-700">Nesta página</summary><nav aria-label="Seções da nota" className="mt-3 grid gap-2 sm:grid-cols-2">{prepared.headings.filter(item => item.depth <= 3).map(item => <a key={item.id} href={`#${item.id}`} onClick={event => { event.preventDefault(); navigate(selected.id, item.id); }} className="text-xs text-cyan-700 hover:underline">{item.title}</a>)}</nav></details>}
          <div className="max-w-none break-words text-sm leading-7 text-slate-700"><ReactMarkdown remarkPlugins={[remarkGfm]} urlTransform={vaultUrlTransform} components={{
            h1: ({ node, children }) => <h4 {...headingProps(node?.position?.start.line)} className="mb-3 mt-8 scroll-mt-24 text-2xl font-bold text-slate-900">{children}</h4>,
            h2: ({ node, children }) => <h4 {...headingProps(node?.position?.start.line)} className="mb-3 mt-8 scroll-mt-24 border-b border-slate-100 pb-2 text-xl font-bold text-slate-900">{children}</h4>,
            h3: ({ node, children }) => <h5 {...headingProps(node?.position?.start.line)} className="mb-2 mt-6 scroll-mt-24 text-base font-bold text-slate-900">{children}</h5>,
            h4: ({ node, children }) => <h6 {...headingProps(node?.position?.start.line)} className="mt-5 scroll-mt-24 font-bold text-slate-900">{children}</h6>,
            h5: ({ node, children }) => <h6 {...headingProps(node?.position?.start.line)}>{children}</h6>,
            h6: ({ node, children }) => <h6 {...headingProps(node?.position?.start.line)}>{children}</h6>,
            p: ({ children }) => <p className="my-3">{children}</p>,
            ul: ({ children }) => <ul className="my-3 list-disc space-y-1 pl-6">{children}</ul>,
            ol: ({ children }) => <ol className="my-3 list-decimal space-y-1 pl-6">{children}</ol>,
            blockquote: ({ children }) => <blockquote className="my-4 border-l-4 border-cyan-300 bg-cyan-50/50 px-4 py-2 text-slate-600">{children}</blockquote>,
            table: ({ children }) => <div className="my-5 overflow-x-auto"><table className="w-full border-collapse text-xs">{children}</table></div>,
            th: ({ children }) => <th className="border border-slate-200 bg-slate-50 px-3 py-2 text-left font-semibold">{children}</th>,
            td: ({ children }) => <td className="border border-slate-200 px-3 py-2 align-top">{children}</td>,
            pre: ({ children }) => <pre className="my-4 overflow-x-auto rounded-xl bg-slate-950 p-4 text-xs leading-6 text-slate-100">{children}</pre>,
            code: ({ children }) => <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-xs">{children}</code>,
            a: ({ href, children }) => {
              if (!href) return <span>{children}</span>;
              const meta = linkMeta(href);
              const matches = meta.internal ? resolveWikiTarget(catalog, meta.target.split('#')[0], selected.relative_path) : [];
              const label = typeof children === 'string' && children === meta.target && matches.length === 1 ? matches[0].title : children;
              const realHref = matches.length === 1 ? `${window.location.pathname}${buildGrowthLearningSectionItemSearch('vault', matches[0].id, window.location.search)}${meta.target.includes('#') ? `#${encodeURIComponent(meta.target.split('#').slice(1).join('#'))}` : ''}` : meta.internal ? (meta.target.startsWith('#') ? meta.target : '#') : href;
              return <a href={realHref} target={meta.internal ? undefined : '_blank'} rel={meta.internal ? undefined : 'noopener noreferrer'} className="font-medium text-cyan-700 underline decoration-cyan-300 underline-offset-2 hover:text-cyan-900" onClick={event => { if (meta.internal) { event.preventDefault(); openTarget(meta.target); } }}>{label}{!meta.internal && <ExternalLink size={11} className="ml-1 inline" aria-label="Link externo" />}</a>;
            },
          }}>{prepared.content}</ReactMarkdown></div>
          {backlinks.length > 0 && <aside className="mt-10 border-t border-slate-200 pt-5" aria-label="Notas relacionadas"><h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-700"><Link2 size={15} />Citada por {backlinks.length} notas</h4><div className="grid gap-2 sm:grid-cols-2">{backlinks.map(item => <button type="button" key={`${item.source_note_id}-${item.fragment || ''}`} onClick={() => navigate(item.source_note_id)} className="rounded-xl border border-slate-200 px-3 py-3 text-left text-sm font-semibold text-slate-700 hover:border-cyan-300 hover:bg-cyan-50">{item.source_title}</button>)}</div></aside>}
        </> : <><p className="text-xs font-bold uppercase tracking-wider text-cyan-700">Conhecimento interno</p><h3 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">O que você quer entender ou fazer?</h3><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">Encontre o contexto, os serviços e as regras da operação. Comece por um assunto ou busque uma dúvida na Wiki.</p><div className="mt-7 grid gap-3 sm:grid-cols-2">{WIKI_TOPICS.map(topic => <button type="button" disabled={catalogLoading} key={topic.title} onClick={() => openTarget(topic.target)} className="rounded-xl border border-slate-200 p-5 text-left hover:border-cyan-300 hover:bg-cyan-50 disabled:opacity-60"><span className="text-base font-bold text-slate-800">{topic.title}</span><p className="mt-2 text-sm leading-6 text-slate-500">{topic.description}</p><span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-cyan-700">Explorar <ChevronRight size={13} /></span></button>)}</div>{catalogLoading && <p role="status" className="mt-4 text-xs text-slate-500">Carregando índice de navegação…</p>}<p className="mt-7 text-xs leading-5 text-slate-500">A Wiki reúne fontes e contexto. Em Memória, você encontra os aprendizados validados da operação.</p></>}
      </article>
    </div>
  </section>;
}
