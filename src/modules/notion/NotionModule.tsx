import React, { useEffect, useCallback, useMemo, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { useNotion } from './store/useNotionStore';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { PageHeader } from './components/editor/PageHeader';
import { BlockList } from './components/editor/BlockList';
import { DatabaseView } from './components/database/DatabaseView';
import { FormattingBar } from './components/editor/FormattingBar';
import { SearchModal } from './components/layout/SearchModal';
import { TrashModal } from './components/layout/TrashModal';
import { TemplatesModal } from './components/layout/TemplatesModal';
import { RowPeekModal } from './components/database/RowPeekModal';
import { NotionEditContext, type NotionEditApi } from './components/database/editContext';
import { PageComments } from './components/editor/PageComments';
import { supabase } from '../../services/supabaseClient';
import { saveInitiative } from '../../components/growth-learning/development/workService';
import { GaasSettingsModal } from './gaas/GaasPanels';
import { useAuth } from '../../context/AuthContext';
import { newWork, type Initiative, type WorkItem } from '../../components/growth-learning/development/workModel';
import { taskError } from '../../components/growth-learning/development/developmentService';
import type { Block, DatabaseRow, NotionColor, NotionDatabase, NotionPage, NotionWorkspace, SelectOption } from './types/notion';
import { generateId } from './utils/id';
import { createTask, diff, loadNotion, pushChanges, saveLocalPrefs, saveTask, snapshot, type NotionContext, type Snapshot } from './gaas/notionData';
import { GAAS_FRONT, GAAS_FRONT_NAME, SYNCED_PROPS, SYSTEM_PROP_IDS, TASKS_DB, TASKS_PAGE, type BusinessFront, type DailyProjectRef, notionColor, workspaceOfFront, extraProps, frontOfProject, rowPatch, taskBlocks, taskIdOfRow, taskPage, taskRowId, taskToRow } from './gaas/tasksAdapter';
import './notion.css';
import 'katex/dist/katex.min.css';

/** Módulo estilo Notion (base: notion-clone, MIT) ligado ao Supabase. Ocupa o espaço do contêiner. */
export function NotionModule({ onOpenInvestigations }: { onOpenInvestigations?: () => void } = {}) {
  const { user } = useAuth();
  const me = user?.id ?? null;
  const [state, setState] = useState<{ workspace: NotionWorkspace; ctx: NotionContext; seeded: boolean } | null>(null);
  const [error, setError] = useState('');
  const load = useCallback(() => {
    setError('');
    loadNotion(me).then(setState).catch(() => setError('Não foi possível carregar Tarefas e atividades. Confira a conexão e tente de novo.'));
  }, [me]);
  useEffect(() => { load(); }, [load]);
  if (error) return <div className="nt-root flex h-full items-center justify-center gap-3 text-sm">{error}<button className="rounded-md border px-3 py-1.5" onClick={load}>Tentar de novo</button></div>;
  if (!state) return <div className="nt-root flex h-full items-center justify-center text-sm text-[var(--notion-text-muted)]">Carregando Tarefas e atividades…</div>;
  return <NotionApp key={me || 'anon'} initial={state.workspace} ctx={state.ctx} seeded={state.seeded} onOpenInvestigations={onOpenInvestigations} />;
}

function NotionApp({ initial, ctx, seeded, onOpenInvestigations }: { initial: NotionWorkspace; ctx: NotionContext; seeded: boolean; onOpenInvestigations?: () => void }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const {
    workspace,
    patchWorkspace,
    activePage,
    activeUser,
    users,
    theme,
    isSidebarCollapsed,
    isSearchOpen,
    isSettingsOpen,
    isTrashOpen,
    isTemplatesOpen,
    setTheme,
    setActiveUser,
    setSidebarCollapsed,
    setSearchOpen,
    setSettingsOpen,
    setTrashOpen,
    setTemplatesOpen,
    applyTemplate,
    importMarkdownPage,
    setActivePage,
    updatePage,
    createPage,
    archivePage,
    restorePage,
    deletePagePermanently,
    toggleFavorite,
    addBlock,
    updateBlock,
    deleteBlock,
    moveBlock,
    duplicateBlock,
    convertBlockType,
    addRowToDatabase,
    updateDatabaseRow,
    deleteDatabaseRow,
    addDatabaseProperty,
    setDatabaseView,
    addDatabaseView,
    updateDatabaseView,
    exportJSON,
  } = useNotion(initial);

  /* ---------- sincronização com o Supabase ---------- */
  const baselineRef = useRef<Snapshot | null>(null);
  if (!baselineRef.current) {
    const first = snapshot(seeded ? withoutSeed(initial) : initial);
    if (seeded) first.meta = '';
    baselineRef.current = first;
  }
  const baseline = baselineRef as React.MutableRefObject<Snapshot>;
  const latest = useRef(workspace); latest.current = workspace;
  const timer = useRef<number>();
  const inflight = useRef(false);
  const [status, setStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [toast, setToast] = useState('');
  const toastTimer = useRef<number>();
  const showToast = useCallback((text: string) => { setToast(text); window.clearTimeout(toastTimer.current); toastTimer.current = window.setTimeout(() => setToast(''), 5000); }, []);

  const flush = useCallback(async () => {
    if (inflight.current) { window.clearTimeout(timer.current); timer.current = window.setTimeout(() => void flush(), 400); return; }
    const ws = latest.current;
    const changes = diff(baseline.current, ws);
    if (changes.empty) { setStatus('saved'); return; }
    inflight.current = true; setStatus('saving');
    try {
      await pushChanges(changes);
      const reverted: { key: string; row: DatabaseRow }[] = [];
      for (const tc of changes.tasks) {
        const task = ctx.tasks.get(tc.taskId); if (!task) continue;
        if (!ctx.canEditTasks) { showToast('Seu acesso permite ler as tarefas, mas não alterá-las.'); reverted.push({ key: tc.rowKey, row: serverRow(ws, task, ctx.projects) }); continue; }
        try { const saved = await saveTask(task, tc.patch); ctx.tasks.set(saved.id, saved); }
        catch (e) { showToast(taskError(e)); reverted.push({ key: tc.rowKey, row: serverRow(ws, task, ctx.projects) }); }
      }
      const next = snapshot(ws);
      for (const r of reverted) { next.rows.set(r.key, JSON.stringify(r.row)); next.rowObjs.set(r.key, r.row); }
      baseline.current = next;
      if (reverted.length) patchWorkspace(prev => replaceRows(prev, reverted.map(r => r.row)));
      setStatus('saved');
    } catch {
      setStatus('error'); showToast('Não foi possível salvar. As alterações ficam aqui e tentamos de novo.');
      timer.current = window.setTimeout(() => void flush(), 5000);
    } finally { inflight.current = false; }
  }, [ctx, patchWorkspace, showToast]);

  useEffect(() => {
    saveLocalPrefs(ctx.me, workspace);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => void flush(), 700);
  }, [workspace, flush, ctx.me]);
  useEffect(() => {
    const now = () => { if (document.visibilityState === 'hidden') void flush(); };
    const leave = (e: BeforeUnloadEvent) => { if (!diff(baseline.current, latest.current).empty) { void flush(); e.preventDefault(); e.returnValue = ''; } };
    document.addEventListener('visibilitychange', now); window.addEventListener('beforeunload', leave);
    return () => { document.removeEventListener('visibilitychange', now); window.removeEventListener('beforeunload', leave); };
  }, [flush]);

  /* ---------- base Tarefas: criar vira tarefa real, excluir vira "Cancelada" ---------- */
  const addRow = useCallback((databaseId: string, initialProps: Record<string, any> = {}) => {
    if (databaseId !== TASKS_DB) return addRowToDatabase(databaseId, initialProps);
    if (!ctx.canEditTasks) { showToast('Criar tarefas requer acesso de edição.'); return ''; }
    const props = latest.current.databases[TASKS_DB].properties;
    const empty: DatabaseRow = { id: '', pageId: '', properties: {} };
    const front = initialProps.p_frente || frontOfProject(props, ctx.projects, initialProps.p_projeto) || props.find(p => p.id === 'p_frente')?.options?.find(o => o.name !== GAAS_FRONT_NAME)?.name || '';
    const moduleProps: Record<string, unknown> = { p_frente: front, ...(initialProps.p_projeto ? { p_projeto: initialProps.p_projeto } : {}) };
    const fields = rowPatch(empty, { id: '', pageId: '', properties: { ...initialProps, ...moduleProps, prop_title: initialProps.prop_title || 'Nova tarefa' } }, props, latest.current.users);
    const base = newWork(fields.workspace || 'sdd', fields.work_type || 'task');
    setStatus('saving');
    void createTask({ ...fields, title: fields.title || 'Nova tarefa' }, base).then(saved => {
      ctx.tasks.set(saved.id, saved);
      // Linha de base sem frente/projeto guardados: assim a primeira sincronização grava esses dois no módulo.
      const baseRow = taskToRow(saved, props, latest.current.users, {}, ctx.projects);
      const row = taskToRow(saved, props, latest.current.users, moduleProps, ctx.projects);
      const blocks = taskBlocks(saved);
      const page = taskPage(saved, blocks);
      patchWorkspace(prev => {
        const db = prev.databases[TASKS_DB];
        const next = { ...prev, pages: { ...prev.pages, [page.id]: page }, blocks: { ...prev.blocks, ...Object.fromEntries(blocks.map(b => [b.id, b])) }, databases: { ...prev.databases, [TASKS_DB]: { ...db, rows: [...db.rows, row] } } };
        const snap = baseline.current;
        snap.pages.set(page.id, JSON.stringify(page)); blocks.forEach(b => snap.blocks.set(b.id, JSON.stringify(b)));
        snap.rows.set(TASKS_DB + '|' + row.id, JSON.stringify(baseRow)); snap.rowObjs.set(TASKS_DB + '|' + row.id, JSON.parse(JSON.stringify(baseRow)));
        return next;
      });
      setPeekPageId(page.id); setPeekDatabaseId(TASKS_DB); setStatus('saved');
    }).catch(e => { setStatus('error'); showToast(taskError(e)); });
    return taskRowId('pending');
  }, [addRowToDatabase, ctx, patchWorkspace, showToast]);
  const updateRow = useCallback((databaseId: string, rowId: string, propertyId: string, value: any) => {
    updateDatabaseRow(databaseId, rowId, propertyId, value);
    if (databaseId === TASKS_DB && propertyId === 'p_projeto') {
      const front = frontOfProject(latest.current.databases[TASKS_DB].properties, ctx.projects, value);
      if (front) updateDatabaseRow(databaseId, rowId, 'p_frente', front);
    }
  }, [ctx.projects, updateDatabaseRow]);
  const deleteRow = useCallback((databaseId: string, rowId: string) => {
    if (databaseId !== TASKS_DB) return deleteDatabaseRow(databaseId, rowId);
    if (!window.confirm('Cancelar esta tarefa? Ela continua no histórico com o status "Cancelada".')) return;
    const cancel = latest.current.databases[TASKS_DB].properties.find(p => p.id === 'p_status')?.options?.find(o => o.id === 'cancelada')?.name;
    if (cancel) updateDatabaseRow(TASKS_DB, rowId, 'p_status', cancel);
  }, [deleteDatabaseRow, updateDatabaseRow]);

  /* ---------- edição de propriedades, opções e visões (criar opção grava na tela de origem) ---------- */
  const patchDb = useCallback((dbId: string, fn: (db: NotionDatabase) => NotionDatabase) =>
    patchWorkspace(prev => (prev.databases[dbId] ? { ...prev, databases: { ...prev.databases, [dbId]: fn(prev.databases[dbId]) } } : prev)), [patchWorkspace]);
  const pushOption = useCallback((dbId: string, propId: string, option: SelectOption, beforeId?: string) =>
    patchDb(dbId, db => ({ ...db, properties: db.properties.map(p => {
      if (p.id !== propId) return p;
      const opts = p.options || [];
      const at = beforeId ? opts.findIndex(o => o.id === beforeId) : -1;
      return { ...p, options: at < 0 ? [...opts, option] : [...opts.slice(0, at), option, ...opts.slice(at)] };
    }) })), [patchDb]);
  const deleteView = useCallback((dbId: string, viewId: string) =>
    patchDb(dbId, db => {
      const views = db.views.filter(v => v.id !== viewId);
      return views.length ? { ...db, views, currentViewId: db.currentViewId === viewId ? views[0].id : db.currentViewId } : db;
    }), [patchDb]);
  const editApi = useMemo<NotionEditApi>(() => {
    const rowFront = (dbId: string, rowId?: string) => {
      const db = latest.current.databases[dbId];
      const row = rowId ? db?.rows.find(r => r.id === rowId) : undefined;
      return db?.properties.find(p => p.id === 'p_frente')?.options?.find(o => o.name === row?.properties.p_frente)?.id ?? null;
    };
    const fail = (e: unknown, fallback: string): never => {
      const m = e instanceof Error ? e.message : typeof e === 'object' && e && 'message' in e ? String((e as { message: unknown }).message) : '';
      if (/name_taken/.test(m)) throw new Error('Já existe um item com esse nome.');
      if (/name_required/.test(m)) throw new Error('O nome precisa de pelo menos 2 letras.');
      if (/access_denied|permission/.test(m)) throw new Error('Seu acesso não permite criar aqui.');
      throw new Error(fallback);
    };
    return {
      lockOf: (dbId, propId) => (dbId !== TASKS_DB ? null : SYNCED_PROPS.has(propId) ? 'synced' : SYSTEM_PROP_IDS.has(propId) ? 'fixed' : null),
      createOption: async (dbId, propId, name, rowId) => {
        const prop = latest.current.databases[dbId]?.properties.find(p => p.id === propId);
        if (!prop) return null;
        if (dbId === TASKS_DB && propId === 'p_frente') {
          const { data, error } = await supabase.rpc('gaas_daily_save_option', { p_kind: 'frente', p_key: null, p_body: { name, short: name.slice(0, 2).toUpperCase() } });
          if (error) fail(error, 'Não foi possível criar a frente.');
          const f = data as BusinessFront;
          ctx.fronts.push(f);
          pushOption(dbId, propId, { id: f.key, name: f.name, color: notionColor(f.color) }, GAAS_FRONT);
          return f.name;
        }
        if (dbId === TASKS_DB && propId === 'p_projeto') {
          const fk = rowFront(dbId, rowId);
          const frente = fk && fk !== GAAS_FRONT ? fk : ctx.fronts.find(f => f.key === 'op' && !f.archived)?.key || ctx.fronts.find(f => !f.archived)?.key;
          if (!frente) throw new Error('Crie uma frente antes do projeto.');
          const { data, error } = await supabase.rpc('gaas_daily_save_project', { p_id: null, p_revision: null, p_body: { name, frente_key: frente } });
          if (error) fail(error, 'Não foi possível criar o projeto.');
          const p = data as DailyProjectRef;
          ctx.projects.push(p);
          const color = notionColor(ctx.fronts.find(f => f.key === p.frente_key)?.color || '');
          pushOption(dbId, propId, { id: p.id, name: p.name, color });
          return p.name;
        }
        if (dbId === TASKS_DB && propId === 'p_iniciativa') {
          if (!ctx.canEditTasks) throw new Error('Criar iniciativas requer acesso de edição.');
          const fk = rowFront(dbId, rowId);
          try {
            const saved = await saveInitiative({ id: '', title: name, workspace: workspaceOfFront(fk), description: '', source_note: null, revision: 0 } as Initiative);
            ctx.initiatives.push(saved);
            pushOption(dbId, propId, { id: saved.id, name: saved.title, color: 'default' });
            return saved.title;
          } catch (e) { return fail(e, 'Não foi possível criar a iniciativa.'); }
        }
        if (dbId === TASKS_DB && SYSTEM_PROP_IDS.has(propId)) return null;
        const colors: NotionColor[] = ['blue', 'green', 'purple', 'orange', 'pink', 'yellow', 'red', 'brown', 'gray'];
        pushOption(dbId, propId, { id: 'opt_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), name, color: colors[(prop.options || []).length % colors.length] });
        return name;
      },
      removeOption: (dbId, propId, optionId) =>
        patchDb(dbId, db => {
          const name = db.properties.find(p => p.id === propId)?.options?.find(o => o.id === optionId)?.name;
          return {
            ...db,
            properties: db.properties.map(p => (p.id === propId ? { ...p, options: (p.options || []).filter(o => o.id !== optionId) } : p)),
            rows: db.rows.map(r => {
              const v = r.properties[propId];
              if (Array.isArray(v) && v.includes(name)) return { ...r, properties: { ...r.properties, [propId]: v.filter(x => x !== name) } };
              if (v === name) return { ...r, properties: { ...r.properties, [propId]: '' } };
              return r;
            }),
          };
        }),
      renameProperty: (dbId, propId, name) => patchDb(dbId, db => ({ ...db, properties: db.properties.map(p => (p.id === propId ? { ...p, name } : p)) })),
      deleteProperty: (dbId, propId) =>
        patchDb(dbId, db => ({
          ...db,
          properties: db.properties.filter(p => p.id !== propId),
          rows: db.rows.map(r => { const { [propId]: _gone, ...rest } = r.properties; return { ...r, properties: rest }; }),
          views: db.views.map(v => ({
            ...v,
            visiblePropertyIds: v.visiblePropertyIds.filter(id => id !== propId),
            filters: (v.filters || []).filter(f => f.propertyId !== propId),
            sorts: (v.sorts || []).filter(s => s.propertyId !== propId),
            groupByPropertyId: v.groupByPropertyId === propId ? undefined : v.groupByPropertyId,
            datePropertyId: v.datePropertyId === propId ? undefined : v.datePropertyId,
          })),
        })),
    };
  }, [ctx, patchDb, pushOption]);
  const openComments = useCallback(() => {
    const el = rootRef.current?.querySelector('#nt-comments');
    if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); el.querySelector('input')?.focus(); }
    else showToast('Os comentários ficam nas páginas de conteúdo e dentro de cada tarefa.');
  }, [showToast]);

  // Peak Modal State for clicking any card/row in a database
  const [peekPageId, setPeekPageId] = useState<string | null>(null);
  const [peekDatabaseId, setPeekDatabaseId] = useState<string | null>(null);

  // Link da Fila e das notificações (?dev_task=<id>) abre a tarefa por cima da base.
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('dev_task');
    if (!id) return;
    if (ctx.tasks.has(id)) { setActivePage(TASKS_PAGE); setPeekPageId(taskRowId(id)); setPeekDatabaseId(TASKS_DB); }
    else showToast('Tarefa do link não encontrada neste acesso.');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  /* ---------- duplicar página ou tarefa (cópia completa do corpo, com novos ids) ---------- */
  const cloneBlocks = (ws: NotionWorkspace, ids: string[], out: Record<string, Block>): string[] =>
    ids.filter(id => ws.blocks[id]).map(id => {
      const b = ws.blocks[id], nid = generateId('blk');
      out[nid] = { ...JSON.parse(JSON.stringify(b)), id: nid, ...(b.childrenIds ? { childrenIds: cloneBlocks(ws, b.childrenIds, out) } : {}) };
      return nid;
    });
  const duplicateTask = useCallback((taskId: string) => {
    const task = ctx.tasks.get(taskId);
    if (!task) return;
    if (!ctx.canEditTasks) { showToast('Duplicar tarefas requer acesso de edição.'); return; }
    const ws = latest.current, db = ws.databases[TASKS_DB], src = db.rows.find(r => r.id === taskRowId(taskId));
    const srcPage = ws.pages[taskRowId(taskId)];
    setStatus('saving');
    void createTask({ title: `${task.title} (cópia)` }, task).then(saved => {
      ctx.tasks.set(saved.id, saved);
      const props = latest.current.databases[TASKS_DB].properties;
      const extra = src ? extraProps(src) : {};
      const baseRow = taskToRow(saved, props, latest.current.users, {}, ctx.projects);
      const row = taskToRow(saved, props, latest.current.users, extra, ctx.projects);
      const blocks: Record<string, Block> = {};
      const blockIds = cloneBlocks(latest.current, srcPage?.blockIds || [], blocks);
      const page = { ...taskPage(saved, []), icon: srcPage?.icon || taskPage(saved, []).icon, blockIds };
      patchWorkspace(prev => {
        const d = prev.databases[TASKS_DB];
        const at = d.rows.findIndex(r => r.id === src?.id);
        const rows = at < 0 ? [...d.rows, row] : [...d.rows.slice(0, at + 1), row, ...d.rows.slice(at + 1)];
        return { ...prev, pages: { ...prev.pages, [page.id]: page }, blocks: { ...prev.blocks, ...blocks }, databases: { ...prev.databases, [TASKS_DB]: { ...d, rows } } };
      });
      // Só a linha entra na foto de base: página, blocos e frente/projeto da cópia vão para o banco na próxima sincronização.
      baseline.current.rows.set(TASKS_DB + '|' + row.id, JSON.stringify(baseRow));
      baseline.current.rowObjs.set(TASKS_DB + '|' + row.id, JSON.parse(JSON.stringify(baseRow)));
      setPeekPageId(page.id); setPeekDatabaseId(TASKS_DB); setStatus('saved');
      showToast('Tarefa duplicada.');
    }).catch(e => { setStatus('error'); showToast(taskError(e)); });
  }, [ctx, patchWorkspace, showToast, baseline]);
  const duplicatePage = useCallback((pageId: string) => {
    const tid = taskIdOfRow(pageId);
    if (tid) { duplicateTask(tid); return; }
    const ws = latest.current;
    if (ws.pages[pageId]?.databaseId === TASKS_DB) { showToast('A base de tarefas é única. Duplique as tarefas, uma a uma.'); return; }
    const pages: Record<string, NotionPage> = {}, blocks: Record<string, Block> = {}, databases: Record<string, NotionDatabase> = {};
    const now = new Date().toISOString();
    const copy = (id: string, parentId: string | null, top: boolean): string => {
      const p = ws.pages[id], nid = generateId('page');
      let databaseId = p.databaseId;
      if (p.databaseId && ws.databases[p.databaseId]) {
        const src = ws.databases[p.databaseId], ndb = generateId('db');
        const rows = src.rows.map(r => {
          const rp = ws.pages[r.pageId];
          const npid = rp ? generateId('page') : r.pageId;
          if (rp) pages[npid] = { ...rp, id: npid, parentId: nid, blockIds: cloneBlocks(ws, rp.blockIds, blocks), createdAt: now, updatedAt: now, comments: [] };
          return { ...r, id: generateId('row'), pageId: npid };
        });
        databases[ndb] = { ...JSON.parse(JSON.stringify(src)), id: ndb, rows };
        databaseId = ndb;
      }
      pages[nid] = { ...p, id: nid, parentId, title: top ? `${p.title || 'Sem título'} (cópia)` : p.title, blockIds: cloneBlocks(ws, p.blockIds, blocks), databaseId, createdAt: now, updatedAt: now, isFavorite: false, comments: [] };
      Object.values(ws.pages).filter(c => c.parentId === id && !c.isArchived && !taskIdOfRow(c.id)).forEach(c => copy(c.id, nid, false));
      return nid;
    };
    if (!ws.pages[pageId]) return;
    const nid = copy(pageId, ws.pages[pageId].parentId, true);
    patchWorkspace(prev => {
      const i = prev.rootPageIds.indexOf(pageId);
      const rootPageIds = ws.pages[pageId].parentId ? prev.rootPageIds : i < 0 ? [...prev.rootPageIds, nid] : [...prev.rootPageIds.slice(0, i + 1), nid, ...prev.rootPageIds.slice(i + 1)];
      return { ...prev, pages: { ...prev.pages, ...pages }, blocks: { ...prev.blocks, ...blocks }, databases: { ...prev.databases, ...databases }, rootPageIds };
    });
    setActivePage(nid);
    showToast('Página duplicada.');
  }, [duplicateTask, patchWorkspace, setActivePage, showToast]);

  const duplicateRow = useCallback((dbId: string, rowId: string) => {
    if (dbId === TASKS_DB) { const tid = taskIdOfRow(rowId); if (tid) duplicateTask(tid); return; }
    const ws = latest.current, db = ws.databases[dbId], row = db?.rows.find(r => r.id === rowId);
    if (!db || !row) return;
    const blocks: Record<string, Block> = {}, now = new Date().toISOString();
    const rp = ws.pages[row.pageId], npid = generateId('page'), nrid = generateId('row');
    const title = `${String(row.properties.prop_title || rp?.title || 'Sem título')} (cópia)`;
    const page: NotionPage | null = rp ? { ...rp, id: npid, title, blockIds: cloneBlocks(ws, rp.blockIds, blocks), createdAt: now, updatedAt: now, comments: [] } : null;
    const nrow: DatabaseRow = { ...JSON.parse(JSON.stringify(row)), id: nrid, pageId: page ? npid : row.pageId, properties: { ...JSON.parse(JSON.stringify(row.properties)), prop_title: title } };
    patchWorkspace(prev => {
      const d = prev.databases[dbId], at = d.rows.findIndex(r => r.id === rowId);
      return { ...prev, pages: page ? { ...prev.pages, [npid]: page } : prev.pages, blocks: { ...prev.blocks, ...blocks },
        databases: { ...prev.databases, [dbId]: { ...d, rows: [...d.rows.slice(0, at + 1), nrow, ...d.rows.slice(at + 1)] } } };
    });
    showToast('Linha duplicada.');
  }, [duplicateTask, patchWorkspace, showToast]);

  // Keyboard shortcut listener for Ctrl+K (Search) & Ctrl+J (Notion AI)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Atalhos só valem com o foco dentro do módulo (o Ctrl+K global do GaaS continua sendo da Wiki).
      if (!rootRef.current || !rootRef.current.contains(document.activeElement)) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setSearchOpen]);

  // Database renderer helper for embedding database views into any block or page
  const renderDatabase = useCallback(
    (databaseId: string) => {
      const db = workspace.databases[databaseId];
      if (!db) {
        return (
          <div className="p-4 rounded-lg border border-[var(--notion-border)] text-xs text-[var(--notion-text-muted)] bg-[var(--notion-hover)]">
            Base "{databaseId}" não encontrada.
          </div>
        );
      }

      return (
        <DatabaseView
          database={db}
          users={users}
          onUpdateRow={updateRow}
          onAddRow={addRow}
          quickFilter={databaseId === TASKS_DB ? { propertyId: 'p_frente', hiddenByDefault: [GAAS_FRONT_NAME], storageKey: `gaas.notion.chips.${ctx.me || 'anon'}.${databaseId}` } : undefined}
          onDeleteRow={deleteRow}
          onAddProperty={addDatabaseProperty}
          onSetView={setDatabaseView}
          onAddView={addDatabaseView}
          onUpdateView={updateDatabaseView}
          onDeleteView={deleteView}
          onDuplicateRow={duplicateRow}
          onOpenRowPage={(pageId: string) => {
            setPeekPageId(pageId);
            setPeekDatabaseId(databaseId);
          }}
        />
      );
    },
    [
      workspace.databases,
      users,
      updateRow,
      addRow,
      ctx.me,
      deleteRow,
      addDatabaseProperty,
      setDatabaseView,
      addDatabaseView,
      updateDatabaseView,
      deleteView,
      duplicateRow,
    ]
  );

  if (!activePage) {
    return (
      <div className={`nt-root ${theme === 'dark' ? 'dark' : ''} flex h-full w-full items-center justify-center bg-[var(--notion-bg)] text-[var(--notion-text)]`}>
        <div className="text-center space-y-3">
          <div className="text-4xl">📄</div>
          <h2 className="text-lg font-semibold">Nenhuma página aberta</h2>
          <p className="text-xs text-[var(--notion-text-muted)]">
            Escolha uma página na barra lateral ou crie uma nova.
          </p>
          <button
            onClick={() => createPage(null, 'Sem título', '📄')}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm font-medium transition-colors"
          >
            Criar página
          </button>
        </div>
      </div>
    );
  }

  const fontClass =
    activePage.fontFamily === 'serif'
      ? 'font-serif'
      : activePage.fontFamily === 'mono'
      ? 'font-mono'
      : 'font-sans';

  const widthClass = activePage.isFullWidth ? 'max-w-full px-8' : 'max-w-4xl mx-auto';
  const textScaleClass = activePage.isSmallText ? 'text-xs' : 'text-sm';

  return (
    <NotionEditContext.Provider value={editApi}>
    <div ref={rootRef} tabIndex={-1} className={`nt-root ${theme === 'dark' ? 'dark' : ''} relative flex h-full w-full overflow-hidden bg-[var(--notion-bg)] outline-none ${fontClass}`}>
      {/* Sidebar Navigation */}
      <Sidebar
        workspace={workspace}
        activePageId={activePage.id}
        users={users}
        activeUserId={activeUser.id}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!isSidebarCollapsed)}
        onSelectPage={setActivePage}
        onCreatePage={createPage}
        onArchivePage={archivePage}
        onDuplicatePage={duplicatePage}
        onToggleFavorite={toggleFavorite}
        onSetActiveUser={setActiveUser}
        onOpenSearch={() => setSearchOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenTemplates={() => setTemplatesOpen(true)}
        onImportMarkdown={importMarkdownPage}
        onOpenTrash={() => setTrashOpen(true)}
        extraLinks={onOpenInvestigations ? [{ label: 'Investigações CRM', icon: <Search size={14} />, onClick: onOpenInvestigations }] : []}
      />

      {/* Main Page Workspace */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto">
        <Topbar
          page={activePage}
          workspace={workspace}
          onSelectPage={setActivePage}
          onUpdatePage={(partial) => updatePage(activePage.id, partial)}
          onToggleFavorite={() => toggleFavorite(activePage.id)}
          onArchivePage={() => archivePage(activePage.id)}
          onDuplicatePage={() => duplicatePage(activePage.id)}
          onExportJSON={exportJSON}
          onOpenComments={openComments}
        />

        <div className={`flex-1 w-full ${widthClass} ${textScaleClass} transition-all duration-150`}>
          {/* Page Header (Cover, Icon, Title) */}
          <PageHeader
            page={activePage}
            onUpdate={(partial) => updatePage(activePage.id, partial)}
            onEnterTitle={() => {
              if (activePage.blockIds.length > 0) {
                // Focus will transfer naturally
              } else {
                addBlock(activePage.id, 'paragraph');
              }
            }}
          />

          {/* Full Page Database Check (if this page is a dedicated database) */}
          {activePage.databaseId ? (
            <div className="px-12 pb-24">
              {renderDatabase(activePage.databaseId)}
            </div>
          ) : (
            <>
            <div className="px-12 sm:px-24">
              <PageComments id="nt-comments" comments={activePage.comments || []} me={activeUser} onChange={(comments) => updatePage(activePage.id, { comments })} />
            </div>
            {/* Block List Editor */}
            <BlockList
              pageId={activePage.id}
              blockIds={activePage.blockIds}
              blocks={workspace.blocks}
              onUpdateBlock={updateBlock}
              onDeleteBlock={deleteBlock}
              onDuplicateBlock={duplicateBlock}
              onConvertType={convertBlockType}
              onAddBlock={addBlock}
              onMoveBlock={moveBlock}
              renderDatabase={renderDatabase}
            />
            </>
          )}
        </div>
      </main>

      {/* Floating Selection Toolbar */}
      <FormattingBar onUpdateBlock={updateBlock} />

      {/* Modals */}
      <SearchModal
        workspace={workspace}
        isOpen={isSearchOpen}
        onClose={() => setSearchOpen(false)}
        onSelectPage={setActivePage}
      />

      {isSettingsOpen && (
        <GaasSettingsModal theme={theme} users={users} onSetTheme={setTheme} onClose={() => setSettingsOpen(false)} />
      )}

      <TrashModal
        workspace={workspace}
        isOpen={isTrashOpen}
        onClose={() => setTrashOpen(false)}
        onRestorePage={restorePage}
        onDeletePermanently={deletePagePermanently}
      />

      {/* Real Notion Template Gallery Modal */}
      <TemplatesModal
        isOpen={isTemplatesOpen}
        onClose={() => setTemplatesOpen(false)}
        onApplyTemplate={applyTemplate}
      />

      {/* Database Item Peek Modal (Center Peek / Side Peek) */}
      <RowPeekModal
        isOpen={Boolean(peekPageId)}
        pageId={peekPageId}
        databaseId={peekDatabaseId}
        workspace={workspace}
        users={users}
        activeUser={activeUser}
        onClose={() => {
          setPeekPageId(null);
          setPeekDatabaseId(null);
        }}
        onOpenFullPage={(pId) => {
          setPeekPageId(null);
          setPeekDatabaseId(null);
          setActivePage(pId);
        }}
        onUpdatePage={updatePage}
        onDuplicate={(dbId, rowId) => duplicateRow(dbId, rowId)}
        onUpdateRow={updateRow}
        onAddProperty={addDatabaseProperty}
        onUpdateBlock={updateBlock}
        onDeleteBlock={deleteBlock}
        onDuplicateBlock={duplicateBlock}
        onConvertType={convertBlockType}
        onAddBlock={addBlock}
        onMoveBlock={moveBlock}
      />

      {/* Estado do salvamento e avisos */}
      <div className="pointer-events-none absolute bottom-3 right-4 z-40 rounded-md bg-[var(--notion-card)] px-2 py-1 text-[11px] text-[var(--notion-text-muted)] shadow-sm">
        {status === 'saving' ? 'Salvando…' : status === 'error' ? 'Não salvo · tentando de novo' : 'Salvo'}
      </div>
      {toast && <div className="absolute bottom-10 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-slate-900 px-4 py-2 text-sm text-white shadow-lg">{toast}</div>}
    </div>
    </NotionEditContext.Provider>
  );
}

/** Espaço sem as páginas iniciais, para que elas sejam gravadas na primeira sincronização. */
function withoutSeed(ws: NotionWorkspace): NotionWorkspace {
  const pages = { ...ws.pages }; delete pages.page_inicio; delete pages.page_tarefas;
  const blocks = Object.fromEntries(Object.entries(ws.blocks).filter(([id]) => !id.startsWith('blk_inicio_')));
  const { [TASKS_DB]: tasksDb, ...others } = ws.databases;
  const dbs = tasksDb ? { ...others, [TASKS_DB]: { ...tasksDb, title: '' } } : others;
  return { ...ws, pages, blocks, databases: dbs, rootPageIds: [] };
}
function serverRow(ws: NotionWorkspace, task: WorkItem, projects: DailyProjectRef[]): DatabaseRow {
  const db = ws.databases[TASKS_DB];
  const current = db.rows.find(r => r.id === taskRowId(task.id));
  return taskToRow(task, db.properties, ws.users, current ? extraProps(current) : {}, projects);
}
function replaceRows(ws: NotionWorkspace, rows: DatabaseRow[]): NotionWorkspace {
  const db = ws.databases[TASKS_DB];
  const byId = new Map(rows.map(r => [r.id, r]));
  return { ...ws, databases: { ...ws.databases, [TASKS_DB]: { ...db, rows: db.rows.map(r => byId.get(r.id) || r) } } };
}
