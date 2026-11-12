import React, { useEffect, useCallback, useRef, useState } from 'react';
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
import { AgentBriefModal, GaasSettingsModal } from './gaas/GaasPanels';
import { useAuth } from '../../context/AuthContext';
import { newWork, type WorkItem } from '../../components/growth-learning/development/workModel';
import { taskError } from '../../components/growth-learning/development/developmentService';
import type { DatabaseRow, NotionWorkspace } from './types/notion';
import { createTask, diff, loadNotion, pushChanges, saveLocalPrefs, saveTask, snapshot, type NotionContext, type Snapshot } from './gaas/notionData';
import { GAAS_FRONT_NAME, TASKS_DB, type DailyProjectRef, extraProps, frontOfProject, rowPatch, taskBlocks, taskPage, taskRowId, taskToRow } from './gaas/tasksAdapter';
import './notion.css';
import 'katex/dist/katex.min.css';

/** Módulo estilo Notion (base: notion-clone, MIT) ligado ao Supabase. Ocupa o espaço do contêiner. */
export function NotionModule() {
  const { user } = useAuth();
  const me = user?.id ?? null;
  const [state, setState] = useState<{ workspace: NotionWorkspace; ctx: NotionContext; seeded: boolean } | null>(null);
  const [error, setError] = useState('');
  const load = useCallback(() => {
    setError('');
    loadNotion(me).then(setState).catch(() => setError('Não foi possível carregar Testes e Tarefas. Confira a conexão e tente de novo.'));
  }, [me]);
  useEffect(() => { load(); }, [load]);
  if (error) return <div className="nt-root flex h-full items-center justify-center gap-3 text-sm">{error}<button className="rounded-md border px-3 py-1.5" onClick={load}>Tentar de novo</button></div>;
  if (!state) return <div className="nt-root flex h-full items-center justify-center text-sm text-[var(--notion-text-muted)]">Carregando Testes e Tarefas…</div>;
  return <NotionApp key={me || 'anon'} initial={state.workspace} ctx={state.ctx} seeded={state.seeded} />;
}

function NotionApp({ initial, ctx, seeded }: { initial: NotionWorkspace; ctx: NotionContext; seeded: boolean }) {
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

  // Peak Modal State for clicking any card/row in a database
  const [peekPageId, setPeekPageId] = useState<string | null>(null);
  const [peekDatabaseId, setPeekDatabaseId] = useState<string | null>(null);

  // Notion AI Assistant Modal State
  const [isAiOpen, setIsAiOpen] = useState(false);

  // Keyboard shortcut listener for Ctrl+K (Search) & Ctrl+J (Notion AI)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Atalhos só valem com o foco dentro do módulo (o Ctrl+K global do GaaS continua sendo da Wiki).
      if (!rootRef.current || !rootRef.current.contains(document.activeElement)) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        setIsAiOpen(true);
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
        onToggleFavorite={toggleFavorite}
        onSetActiveUser={setActiveUser}
        onOpenSearch={() => setSearchOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenTemplates={() => setTemplatesOpen(true)}
        onImportMarkdown={importMarkdownPage}
        onOpenTrash={() => setTrashOpen(true)}
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
          onExportJSON={exportJSON}
          onOpenAi={() => setIsAiOpen(true)}
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
            /* Block List Editor */
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
          )}
        </div>
      </main>

      {/* Floating Selection Toolbar */}
      <FormattingBar onApplyFormat={() => {}} />

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
        onUpdateRow={updateRow}
        onAddProperty={addDatabaseProperty}
        onUpdateBlock={updateBlock}
        onDeleteBlock={deleteBlock}
        onDuplicateBlock={duplicateBlock}
        onConvertType={convertBlockType}
        onAddBlock={addBlock}
        onMoveBlock={moveBlock}
      />

      {/* Briefing para os agentes (no lugar da "Notion AI" de texto fixo) */}
      {isAiOpen && (
        <AgentBriefModal page={activePage} workspace={workspace} tasks={ctx.tasks} initiatives={ctx.initiatives} onClose={() => setIsAiOpen(false)} />
      )}

      {/* Estado do salvamento e avisos */}
      <div className="pointer-events-none absolute bottom-3 right-4 z-40 rounded-md bg-[var(--notion-card)] px-2 py-1 text-[11px] text-[var(--notion-text-muted)] shadow-sm">
        {status === 'saving' ? 'Salvando…' : status === 'error' ? 'Não salvo · tentando de novo' : 'Salvo'}
      </div>
      {toast && <div className="absolute bottom-10 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-slate-900 px-4 py-2 text-sm text-white shadow-lg">{toast}</div>}
    </div>
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
