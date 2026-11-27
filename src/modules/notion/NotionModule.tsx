import React, { useEffect, useCallback, useMemo, useRef, useState } from 'react';
import { downloadPageMarkdown, taskPageScope } from './utils/markdownExporter';
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
import { TaskModal } from '../../components/growth-learning/development/TaskModal';
import { loadSubtasks, patchTask } from '../../components/growth-learning/development/taskModalService';
import { TaskCardFooter, type DailyPulse } from './gaas/TaskCardFooter';
import { TasksHome } from './gaas/TasksHome';
import { WorkStrip } from './gaas/WorkStrip';
import { AiPages } from './gaas/AiPages';
import { AI_SECTIONS, cardDraft, loadAiCards, loadAiPages, sectionCount, type AiCardLink, type AiPage, type AiSection } from './gaas/aiPagesData';
import { NotionEditContext, type NotionEditApi } from './components/database/editContext';
import { CREDIT_BASES_TITLE, configureCreditBases, creditStageTeam, isCreditBases } from './gaas/creditBases';
import { supabase } from '../../services/supabaseClient';
import { saveInitiative } from '../../components/growth-learning/development/workService';
import { GaasSettingsModal } from './gaas/GaasPanels';
import { useAuth } from '../../context/AuthContext';
import { newWork, subtaskProgress, type Initiative, type WorkItem } from '../../components/growth-learning/development/workModel';
import { taskError } from '../../components/growth-learning/development/developmentService';
import type { Block, DatabaseRow, NotionColor, NotionDatabase, NotionPage, NotionUser, NotionWorkspace, SelectOption } from './types/notion';
import { generateId } from './utils/id';
import { createTask, diff, loadNotion, pushChanges, saveLocalPrefs, saveTask, snapshot, type NotionContext, type Snapshot } from './gaas/notionData';
import { readTone, saveTone, type NotionTone } from './gaas/tones';
import { SDD_PAGE, GAAS_FRONT, GAAS_FRONT_NAME, SYNCED_PROPS, SYSTEM_PROP_IDS, TASKS_DB, TASKS_PAGE, type BusinessFront, type DailyProjectRef, type PartnerRef, hexOfNotion, notionColor, workspaceOfFront, extraProps, frontOfProject, rowPatch, taskBlocks, taskIdOfRow, taskPage, taskRowId, taskToRow } from './gaas/tasksAdapter';
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
    loadNotion(me).then(setState).catch(() => setError('Não foi possível carregar Tarefas e atividades. Confira a conexão e tente de novo.'));
  }, [me]);
  useEffect(() => { load(); }, [load]);
  if (error) return <div className="nt-root flex h-full items-center justify-center gap-3 text-sm">{error}<button className="rounded-md border px-3 py-1.5" onClick={load}>Tentar de novo</button></div>;
  if (!state) return <div className="nt-root flex h-full items-center justify-center text-sm text-[var(--notion-text-muted)]">Carregando Tarefas e atividades…</div>;
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
        if (!ctx.canEditTasks) { showToast('Seu acesso permite ler as tarefas, mas não alterá-las.'); reverted.push({ key: tc.rowKey, row: serverRow(ws, task, ctx.projects, ctx.initiatives, [...ctx.tasks.values()]) }); continue; }
        try {
          const saved = await saveTask(task, tc.patch); ctx.tasks.set(saved.id, saved);
          // O servidor leva frente, projetos e iniciativa para as Sub Tarefas (revisão nova): relê as filhas.
          const cascade = ['initiative_id', 'front_key', 'project_ids', 'workspace'].some(k => k in tc.patch) && [...ctx.tasks.values()].some(t => t.parent_task_id === saved.id);
          if (cascade) for (const k of await loadSubtasks(saved.id).catch(() => [])) ctx.tasks.set(k.id, k);
        }
        catch (e) { showToast(taskError(e)); reverted.push({ key: tc.rowKey, row: serverRow(ws, task, ctx.projects, ctx.initiatives, [...ctx.tasks.values()]) }); }
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
    if (databaseId !== TASKS_DB) {
      if (!isCreditBases(databaseId)) return addRowToDatabase(databaseId, initialProps);
      const db = latest.current.databases[databaseId];
      if (!db) return '';
      const defaultStage = db.properties.find(p => p.id === 'prop_status')?.options?.[0]?.name;
      const stage = initialProps.prop_status ?? defaultStage;
      const team = creditStageTeam(db, stage);
      const pageId = generateId('page_row');
      const rowId = addRowToDatabase(databaseId, {
        prop_title: 'Novo pedido',
        ...(stage ? { prop_status: stage } : {}),
        ...(team ? { prop_team: team } : {}),
        ...initialProps,
      }, pageId);
      setPeekDatabaseId(databaseId);
      setPeekPageId(pageId);
      return rowId;
    }
    if (!ctx.canEditTasks) { showToast('Criar tarefas requer acesso de edição.'); return ''; }
    const props = latest.current.databases[TASKS_DB].properties;
    const empty: DatabaseRow = { id: '', pageId: '', properties: {} };
    const front = initialProps.p_frente || frontOfProject(props, ctx.projects, initialProps.p_projeto) || props.find(p => p.id === 'p_frente')?.options?.find(o => o.name !== GAAS_FRONT_NAME)?.name || '';
    const moduleProps: Record<string, unknown> = { p_frente: front, ...(initialProps.p_projeto ? { p_projeto: initialProps.p_projeto } : {}) };
    const fields = rowPatch(empty, { id: '', pageId: '', properties: { ...initialProps, ...moduleProps, prop_title: initialProps.prop_title || 'Nova tarefa' } }, props, latest.current.users);
    const base = newWork(fields.workspace || (fields.front_key === GAAS_FRONT || !fields.front_key ? 'sdd' : workspaceOfFront(fields.front_key)), fields.work_type || 'task');
    setStatus('saving');
    void createTask({ ...fields, title: fields.title || 'Nova tarefa' }, base).then(saved => {
      ctx.tasks.set(saved.id, saved);
      // Frente, projetos e BU/parceiro já foram gravados na própria Tarefa.
      const baseRow = taskToRow(saved, props, latest.current.users, {}, ctx.projects, ctx.initiatives);
      const row = baseRow;
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
    // Sub Tarefa no Calendário: não é linha da base; o prazo vai direto para a Tarefa.
    if (databaseId === TASKS_DB && propertyId === 'p_prazo' && !latest.current.databases[TASKS_DB]?.rows.some(r => r.id === rowId)) {
      const sub = ctx.tasks.get(taskIdOfRow(rowId) || '');
      if (sub) void patchTask(sub, { due_date: value || '' }).then(saved => { ctx.tasks.set(saved.id, saved); patchWorkspace(prev => ({ ...prev })); showToast('Prazo da Sub Tarefa atualizado.'); }).catch(e => showToast(taskError(e)));
      return;
    }
    if (databaseId === TASKS_DB && propertyId === 'p_campanha') { showToast('A campanha vem do projeto: troque o projeto ou ligue a campanha ao projeto na Visão Daily.'); return; }
    updateDatabaseRow(databaseId, rowId, propertyId, value);
    if (isCreditBases(databaseId) && propertyId === 'prop_status') {
      const db = latest.current.databases[databaseId];
      const row = db?.rows.find(item => item.id === rowId);
      if (row && row.properties.prop_status !== value) {
        const previousTeam = creditStageTeam(db, row.properties.prop_status);
        const team = creditStageTeam(db, value);
        const currentTeam = row.properties.prop_team;
        if (team && (!currentTeam || currentTeam === previousTeam)) {
          updateDatabaseRow(databaseId, rowId, 'prop_team', team);
        }
      }
    }
    if (databaseId === TASKS_DB && propertyId === 'p_projeto') {
      const front = frontOfProject(latest.current.databases[TASKS_DB].properties, ctx.projects, value);
      if (front) updateDatabaseRow(databaseId, rowId, 'p_frente', front);
      // A campanha acompanha o projeto (vem da ligação feita na Visão Daily).
      const props = latest.current.databases[TASKS_DB].properties;
      const optName = (pid: string, id?: string | null) => (id ? props.find(p => p.id === pid)?.options?.find(o => o.id === id)?.name || '' : '');
      const first = Array.isArray(value) ? value[0] : value;
      const proj = ctx.projects.find(p => optName('p_projeto', p.id) === first);
      updateDatabaseRow(databaseId, rowId, 'p_campanha', optName('p_campanha', proj?.structure_card_id));
    }
  }, [ctx.projects, updateDatabaseRow, showToast]);
  const deleteRow = useCallback((databaseId: string, rowId: string) => {
    if (databaseId !== TASKS_DB) {
      if (!isCreditBases(databaseId) || window.confirm('Excluir este pedido de Bases de Crédito?')) {
        deleteDatabaseRow(databaseId, rowId);
      }
      return;
    }
    if (!window.confirm('Cancelar esta tarefa? Ela continua no histórico com o status "Cancelada".')) return;
    const cancel = latest.current.databases[TASKS_DB].properties.find(p => p.id === 'p_status')?.options?.find(o => o.id === 'cancelada')?.name;
    if (cancel) updateDatabaseRow(TASKS_DB, rowId, 'p_status', cancel);
  }, [deleteDatabaseRow, updateDatabaseRow]);

  /** Várias linhas de uma vez (seleção na tabela): uma confirmação só. Tarefa é cancelada, nunca apagada. */
  const deleteRows = useCallback((databaseId: string, rowIds: string[]) => {
    if (!rowIds.length) return;
    const n = rowIds.length;
    if (databaseId === TASKS_DB) {
      if (!window.confirm(`Cancelar ${n} ${n === 1 ? 'tarefa' : 'tarefas'}? Elas continuam no histórico com o status "Cancelada".`)) return;
      const cancel = latest.current.databases[TASKS_DB].properties.find(p => p.id === 'p_status')?.options?.find(o => o.id === 'cancelada')?.name;
      if (cancel) rowIds.forEach(id => updateDatabaseRow(TASKS_DB, id, 'p_status', cancel));
      return;
    }
    if (!window.confirm(`Excluir ${n} ${n === 1 ? 'linha' : 'linhas'}? Não dá para desfazer.`)) return;
    rowIds.forEach(id => deleteDatabaseRow(databaseId, id));
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
      if (/project_name_taken/.test(m)) throw new Error('Já existe um projeto com esse nome.');
      if (/revision_conflict/.test(m)) throw new Error('Alguém mudou isso agora há pouco. Recarregue e tente de novo.');
      throw new Error(fallback);
    };
    /* Opções que vêm de outra tela: a mudança grava lá e aparece na Visão Daily, no quadro e nas Bases. */
    type Kind = 'frente' | 'partner' | 'project' | 'initiative';
    const kindOf = (dbId: string, propId: string): Kind | null => {
      if (isCreditBases(dbId)) return propId === 'prop_partner' && ctx.partners.length ? 'partner' : null;
      if (dbId !== TASKS_DB) return null;
      return propId === 'p_frente' ? 'frente' : propId === 'p_parceiro' ? 'partner' : propId === 'p_projeto' ? 'project' : propId === 'p_iniciativa' ? 'initiative' : null;
    };
    const optionOf = (dbId: string, propId: string, optionId: string) =>
      latest.current.databases[dbId]?.properties.find(p => p.id === propId)?.options?.find(o => o.id === optionId);
    /** Tipo da opção só quando ela existe na origem (opção antiga das Bases fica local). */
    const linkedKind = (dbId: string, propId: string, optionId: string): Kind | null => {
      const kind = kindOf(dbId, propId);
      if (kind === 'frente') return ctx.fronts.some(f => f.key === optionId) ? kind : null;
      if (kind === 'partner') return ctx.partners.some(f => f.key === optionId) ? kind : null;
      if (kind === 'project') return ctx.projects.some(f => f.id === optionId) ? kind : null;
      if (kind === 'initiative') return ctx.initiatives.some(f => f.id === optionId) ? kind : null;
      return null;
    };
    /** Toda propriedade que mostra a mesma lista: o parceiro aparece nas Tarefas e em cada Bases de Crédito. */
    const targetsOf = (dbId: string, propId: string): [string, string][] => {
      if (kindOf(dbId, propId) !== 'partner') return [[dbId, propId]];
      const all: [string, string][] = [[TASKS_DB, 'p_parceiro'], ...Object.keys(latest.current.databases).filter(isCreditBases).map(id => [id, 'prop_partner'] as [string, string])];
      return all.filter(([d]) => latest.current.databases[d]);
    };
    const hasValue = (v: unknown, name: string) => (Array.isArray(v) ? v.includes(name) : v === name);
    const usesOf = (dbId: string, propId: string, name: string) =>
      targetsOf(dbId, propId).reduce((n, [d, p]) => n + (latest.current.databases[d]?.rows || []).filter(r => hasValue(r.properties[p], name)).length, 0);
    const renamed = (v: unknown, from: string, to: string): unknown =>
      (v === from ? to : Array.isArray(v) && v.includes(from) ? v.map(x => (x === from ? to : x)) : v);
    const renameIn = (db: NotionDatabase, propId: string, from: string, to: string): NotionDatabase => (from === to ? db : {
      ...db,
      rows: db.rows.map(r => { const v = r.properties[propId], n = renamed(v, from, to); return n === v ? r : { ...r, properties: { ...r.properties, [propId]: n } }; }),
      views: db.views.map(view => ({ ...view, filters: (view.filters || []).map(f => (f.propertyId === propId && f.value === from ? { ...f, value: to } : f)) })),
    });
    /** Nas Tarefas o nome novo entra também na foto salva: a tarefa guarda a chave, que não mudou, então nada vai para o banco. */
    const rebaseRename = (propId: string, from: string, to: string) => {
      if (from === to) return;
      for (const [key, row] of baseline.current.rowObjs) {
        if (!key.startsWith(TASKS_DB + '|')) continue;
        const v = row.properties[propId], n = renamed(v, from, to);
        if (n === v) continue;
        const next = { ...row, properties: { ...row.properties, [propId]: n } };
        baseline.current.rowObjs.set(key, next); baseline.current.rows.set(key, JSON.stringify(next));
      }
    };
    const readProjectRevision = async (id: string): Promise<number> => {
      const { data, error } = await supabase.from('daily_projects').select('revision').eq('id', id).single();
      if (error || !data) return fail(error, 'Não foi possível ler o projeto.');
      return (data as { revision: number }).revision;
    };
    return {
      lockOf: (dbId, propId) => (isCreditBases(dbId) ? (kindOf(dbId, propId) ? 'synced' : null) : dbId !== TASKS_DB ? null : SYNCED_PROPS.has(propId) ? 'synced' : SYSTEM_PROP_IDS.has(propId) ? 'fixed' : null),
      optionCaps: (dbId, propId, optionId) => {
        const option = optionOf(dbId, propId, optionId);
        const uses = option ? usesOf(dbId, propId, option.name) : 0;
        if (dbId === TASKS_DB && SYSTEM_PROP_IDS.has(propId)) return { rename: false, color: false, reorder: false, remove: null, uses, removeBlock: 'Lista fixa do GaaS.' };
        if (optionId === GAAS_FRONT && kindOf(dbId, propId) === 'frente') return { rename: false, color: false, reorder: false, remove: null, uses, removeBlock: 'A frente GaaS é do sistema.' };
        const kind = linkedKind(dbId, propId, optionId);
        if (!kind) return { rename: true, color: true, reorder: true, remove: 'excluir', uses };
        const inUse = uses ? `Em uso em ${uses} ${uses === 1 ? 'item' : 'itens'}: troque antes de arquivar.` : undefined;
        if (kind === 'frente') return { rename: true, color: true, reorder: true, remove: inUse ? null : 'arquivar', uses, removeBlock: inUse, syncNote: 'Muda também na Visão Daily e no quadro.' };
        if (kind === 'partner') return { rename: true, color: true, reorder: true, remove: inUse ? null : 'arquivar', uses, removeBlock: inUse, syncNote: 'Muda também na Visão Daily, no quadro e nas Bases de Crédito.' };
        if (kind === 'project') return { rename: true, color: false, reorder: false, remove: inUse ? null : 'arquivar', uses, removeBlock: inUse, syncNote: 'Muda também na Visão Daily. A cor vem da frente.' };
        return { rename: ctx.canEditTasks, color: false, reorder: false, remove: null, uses, removeBlock: 'Arquive a iniciativa na aba Iniciativas.', syncNote: 'Muda também na aba Iniciativas.' };
      },
      createOption: async (dbId, propId, name, rowId) => {
        const prop = latest.current.databases[dbId]?.properties.find(p => p.id === propId);
        if (!prop) return null;
        name = name.trim();
        if (!name || prop.options?.some(option => option.name.toLowerCase() === name.toLowerCase())) {
          throw new Error('Informe um nome novo para a opção.');
        }
        if (dbId === TASKS_DB && propId === 'p_frente') {
          const { data, error } = await supabase.rpc('gaas_daily_save_option', { p_kind: 'frente', p_key: null, p_body: { name, short: name.slice(0, 2).toUpperCase() } });
          if (error) fail(error, 'Não foi possível criar a frente.');
          const f = data as BusinessFront;
          ctx.fronts.push(f);
          pushOption(dbId, propId, { id: f.key, name: f.name, color: notionColor(f.color) }, GAAS_FRONT);
          return f.name;
        }
        if (kindOf(dbId, propId) === 'partner') {
          const { data, error } = await supabase.rpc('gaas_daily_save_option', { p_kind: 'partner', p_key: null, p_body: { name } });
          if (error) fail(error, 'Não foi possível criar o BU/parceiro.');
          const partner = data as PartnerRef;
          ctx.partners.push(partner);
          for (const [d, p] of targetsOf(dbId, propId)) pushOption(d, p, { id: partner.key, name: partner.name, color: notionColor(partner.color) });
          return partner.name;
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
      editOption: async (dbId, propId, optionId, changes) => {
        if (dbId === TASKS_DB && SYSTEM_PROP_IDS.has(propId)) return;
        const options = latest.current.databases[dbId]?.properties.find(p => p.id === propId)?.options || [];
        const index = options.findIndex(o => o.id === optionId);
        if (index < 0) return;
        const option = options[index];
        const name = (changes.name ?? option.name).trim().replace(/\s+/g, ' ');
        if (!name) throw new Error('O nome não pode ficar vazio.');
        if (options.some(o => o.id !== optionId && o.name.toLowerCase() === name.toLowerCase())) throw new Error('Já existe uma opção com esse nome.');
        const color = changes.color ?? option.color;
        const target = Math.max(0, Math.min(options.length - 1, changes.index ?? index + (changes.offset ?? 0)));
        const order = options.filter(o => o.id !== optionId);
        order.splice(target, 0, { ...option, name, color });
        const kind = linkedKind(dbId, propId, optionId);
        if (kind === 'frente' || kind === 'partner') {
          const table: { key: string; name: string; color: string }[] = kind === 'frente' ? ctx.fronts : ctx.partners;
          const src = table.find(x => x.key === optionId)!;
          const body: Record<string, unknown> = {};
          if (name !== option.name) body.name = name;
          if (color !== option.color) body.color = hexOfNotion(color);
          if (Object.keys(body).length) {
            const { error } = await supabase.rpc('gaas_daily_save_option', { p_kind: kind, p_key: src.key, p_body: body });
            if (error) return fail(error, 'Não foi possível salvar a mudança.');
            src.name = name; if (typeof body.color === 'string') src.color = body.color;
          }
          if (target !== index) {
            const keys = order.map(o => o.id).filter(id => table.some(x => x.key === id));
            const results = await Promise.all(keys.map((key, i) => supabase.rpc('gaas_daily_save_option', { p_kind: kind, p_key: key, p_body: { position: i + 1 } })));
            const bad = results.find(r => r.error);
            if (bad?.error) return fail(bad.error, 'Não foi possível salvar a nova ordem.');
          }
        } else if (kind === 'project' && name !== option.name) {
          const revision = await readProjectRevision(optionId);
          const { error } = await supabase.rpc('gaas_daily_save_project', { p_id: optionId, p_revision: revision, p_body: { name } });
          if (error) return fail(error, 'Não foi possível renomear o projeto.');
          const project = ctx.projects.find(x => x.id === optionId); if (project) project.name = name;
        } else if (kind === 'initiative' && name !== option.name) {
          if (!ctx.canEditTasks) throw new Error('Renomear iniciativas requer acesso de edição.');
          const initiative = ctx.initiatives.find(x => x.id === optionId)!;
          try { Object.assign(initiative, await saveInitiative({ ...initiative, title: name })); } catch (e) { return fail(e, 'Não foi possível renomear a iniciativa.'); }
        }
        // Projeto pega a cor da frente: trocar a cor da frente repinta os projetos dela.
        const recolor = kind === 'frente' && color !== option.color ? new Set(ctx.projects.filter(p => p.frente_key === optionId).map(p => p.id)) : null;
        for (const [d, p] of targetsOf(dbId, propId)) {
          patchDb(d, db => {
            const own = d === dbId && p === propId;
            const properties = db.properties.map(x => {
              if (x.id === p) return { ...x, options: own ? order : (x.options || []).map(o => (o.id === optionId ? { ...o, name, color } : o)) };
              if (recolor && x.id === 'p_projeto') return { ...x, options: (x.options || []).map(o => (recolor.has(o.id) ? { ...o, color } : o)) };
              return x;
            });
            return renameIn({ ...db, properties }, p, option.name, name);
          });
          if (d === TASKS_DB) rebaseRename(p, option.name, name);
        }
      },
      removeOption: async (dbId, propId, optionId) => {
        const option = optionOf(dbId, propId, optionId);
        if (!option) return;
        const kind = linkedKind(dbId, propId, optionId);
        if (!kind) {
          patchDb(dbId, db => ({
            ...db,
            properties: db.properties.map(p => (p.id === propId ? { ...p, options: (p.options || []).filter(o => o.id !== optionId) } : p)),
            views: db.views.map(view => ({ ...view, filters: (view.filters || []).filter(f => f.propertyId !== propId || f.value !== option.name) })),
            rows: db.rows.map(r => {
              const v = r.properties[propId];
              if (Array.isArray(v) && v.includes(option.name)) return { ...r, properties: { ...r.properties, [propId]: v.filter(x => x !== option.name) } };
              if (v === option.name) return { ...r, properties: { ...r.properties, [propId]: '' } };
              return r;
            }),
          }));
          return;
        }
        if (kind === 'initiative' || optionId === GAAS_FRONT) throw new Error(kind === 'initiative' ? 'Arquive a iniciativa na aba Iniciativas.' : 'A frente GaaS é do sistema.');
        const uses = usesOf(dbId, propId, option.name);
        if (uses) throw new Error(`Em uso em ${uses} ${uses === 1 ? 'item' : 'itens'}: troque antes de arquivar.`);
        if (kind === 'project') {
          const revision = await readProjectRevision(optionId);
          const { error } = await supabase.rpc('gaas_daily_save_project', { p_id: optionId, p_revision: revision, p_body: { archived: true } });
          if (error) return fail(error, 'Não foi possível arquivar o projeto.');
          const project = ctx.projects.find(x => x.id === optionId); if (project) project.archived = true;
        } else {
          const { error } = await supabase.rpc('gaas_daily_save_option', { p_kind: kind, p_key: optionId, p_body: { archived: true } });
          if (error) return fail(error, 'Não foi possível arquivar.');
          const src = (kind === 'frente' ? ctx.fronts : ctx.partners).find(x => x.key === optionId); if (src) src.archived = true;
        }
        for (const [d, p] of targetsOf(dbId, propId)) {
          patchDb(d, db => ({ ...db, properties: db.properties.map(x => (x.id === p ? { ...x, options: (x.options || []).filter(o => o.id !== optionId) } : x)) }));
        }
      },
      createPerson: async name => {
        const { data, error } = await supabase.rpc('gaas_work_save_person', { p_id: null, p_revision: null, p_body: { name } });
        if (error) fail(error, /person_name_taken/.test(error.message) ? 'Já existe alguém com esse nome na lista.' : 'Não foi possível adicionar a pessoa.');
        const saved = data as { id: string; name: string };
        const user: NotionUser = { id: saved.id, name: saved.name, email: '', role: 'Member', color: 'gray', guest: true };
        patchWorkspace(prev => ({ ...prev, users: [...prev.users, user] }));
        latest.current = { ...latest.current, users: [...latest.current.users, user] };
        return user;
      },
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
  useEffect(() => {
    if (activePage) patchWorkspace(prev => configureCreditBases(prev, activePage.id, ctx.partners.map(p => ({ ...p, color: notionColor(p.color) }))));
  }, [activePage, patchWorkspace]);

  // Peak Modal State for clicking any card/row in a database
  const [peekPageId, setPeekPageId] = useState<string | null>(null);
  const [peekDatabaseId, setPeekDatabaseId] = useState<string | null>(null);

  /* ---------- janela da Tarefa (a mesma de Daily e Wiki) ---------- */
  const taskModalId = peekDatabaseId === TASKS_DB && peekPageId ? taskIdOfRow(peekPageId) : null;
  /** A janela salvou: atualiza as Tarefas conhecidas e as linhas afetadas, sem disparar novo salvamento. */
  const applyTaskChanges = useCallback((changed: WorkItem[]) => {
    // Pai antigo também é recalculado (Sub Tarefa que virou Tarefa ou mudou de pai).
    const oldParents = changed.map(t => ctx.tasks.get(t.id)?.parent_task_id).filter((x): x is string => Boolean(x));
    for (const t of changed) ctx.tasks.set(t.id, t);
    const all = [...ctx.tasks.values()];
    const tops = new Set([...changed.map(t => t.parent_task_id || t.id), ...oldParents]);
    patchWorkspace(prev => {
      const db = prev.databases[TASKS_DB]; if (!db) return prev;
      let rows = db.rows; const pages = { ...prev.pages };
      for (const id of tops) {
        const task = ctx.tasks.get(id); if (!task || task.parent_task_id) { rows = rows.filter(r => r.id !== taskRowId(id)); continue; }
        const current = rows.find(r => r.id === taskRowId(id));
        const row = taskToRow(task, db.properties, prev.users, current ? extraProps(current) : {}, ctx.projects, ctx.initiatives, subtaskProgress(id, all));
        rows = current ? rows.map(r => (r.id === row.id ? row : r)) : [...rows, row];
        if (!pages[row.pageId]) pages[row.pageId] = taskPage(task, taskBlocks(task));
        baseline.current.rows.set(TASKS_DB + '|' + row.id, JSON.stringify(row));
        baseline.current.rowObjs.set(TASKS_DB + '|' + row.id, JSON.parse(JSON.stringify(row)));
      }
      return { ...prev, pages, databases: { ...prev.databases, [TASKS_DB]: { ...db, rows } } };
    });
  }, [ctx, patchWorkspace]);
  // Página de Tarefa aberta inteira (link antigo, busca): abre a janela por cima da página da frente.
  useEffect(() => {
    const id = activePage?.id ? taskIdOfRow(activePage.id) : null;
    if (!id) return;
    const top = ctx.tasks.get(id)?.parent_task_id || id;
    setActivePage(pageOfTask(top)); setPeekPageId(taskRowId(id)); setPeekDatabaseId(TASKS_DB);
  }, [activePage?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---------- Páginas IA: saídas dos agentes, lidas das tabelas que já existem ---------- */
  const [aiSection, setAiSection] = useState<AiSection | null>(null);
  const [aiOpen, setAiOpen] = useState<string | null>(null);
  const [aiData, setAiData] = useState<{ pages: AiPage[] | null; failed: string[] }>({ pages: null, failed: [] });
  const [aiCards, setAiCards] = useState<AiCardLink[]>([]);
  const loadAi = useCallback(() => {
    setAiData(prev => ({ pages: prev.pages, failed: [] }));
    void loadAiPages().then(setAiData).catch(() => setAiData({ pages: [], failed: ['Páginas IA'] }));
    void loadAiCards().then(setAiCards).catch(() => undefined);
  }, []);
  useEffect(() => {
    loadAi();
    // Link direto (?ai_page=<chave>) abre a página.
    const key = new URLSearchParams(window.location.search).get('ai_page');
    if (key) { setAiSection('todas'); setAiOpen(key); }
  }, [loadAi]);
  // Outra página aberta (busca, link de Tarefa) sai das Páginas IA. Na montagem não mexe, para o link direto valer.
  const aiPageSeen = useRef(activePage?.id);
  useEffect(() => { if (aiPageSeen.current === activePage?.id) return; aiPageSeen.current = activePage?.id; setAiSection(null); setAiOpen(null); }, [activePage?.id]);
  const selectPage = useCallback((pageId: string) => { setAiSection(null); setAiOpen(null); setActivePage(pageId); }, [setActivePage]);
  const aiSidebar = useMemo(() => ({
    title: 'Páginas IA',
    items: AI_SECTIONS.map(s => ({ id: s.id, icon: s.icon, title: s.title, indent: s.id !== 'todas', count: aiData.pages ? sectionCount(aiData.pages, s.id) : undefined })),
    activeId: aiSection,
    onSelect: (id: string) => { setAiSection(id as AiSection); setAiOpen(null); },
  }), [aiData.pages, aiSection]);
  const openTaskWindow = useCallback((taskId: string) => { setPeekPageId(taskRowId(taskId)); setPeekDatabaseId(TASKS_DB); }, []);
  /** "Virar card": cria a Tarefa com a ação e o critério de sucesso (ou abre a que já existe) e mostra a janela dela. */
  const turnIntoCard = useCallback(async (page: AiPage) => {
    if (!ctx.canEditTasks) throw new Error('Criar cards requer acesso de edição.');
    const existing = await supabase.from('growth_development_tasks').select('id,title').contains('details', { ai_page: page.key }).limit(1);
    const found = existing.data?.[0] as { id: string; title: string } | undefined;
    if (found) {
      setAiCards(prev => (prev.some(c => c.key === page.key) ? prev : [...prev, { id: found.id, title: found.title, key: page.key }]));
      openTaskWindow(found.id); return;
    }
    const draft = cardDraft(page);
    const base = newWork(workspaceOfFront(draft.front_key), 'task');
    try {
      const saved = await createTask({ ...draft, details: { ...(base.details || {}), ...draft.details } } as Partial<WorkItem>, base);
      applyTaskChanges([saved]);
      setAiCards(prev => [...prev, { id: saved.id, title: saved.title, key: page.key }]);
      showToast('Card criado. Ele já está no quadro da frente.');
      openTaskWindow(saved.id);
    } catch (e) { throw new Error(taskError(e)); }
  }, [ctx.canEditTasks, applyTaskChanges, openTaskWindow, showToast]);

  /* ---------- páginas por frente (fixas na lateral) e tom do fundo ---------- */
  const fixedPageIds = useMemo(() => new Set([TASKS_PAGE, ...ctx.taskPages.map(d => d.id)]), [ctx.taskPages]);
  const sidebarSections = useMemo(() => [
    { title: 'Frentes', defaultExpanded: true, placement: 'top' as const, pageIds: [TASKS_PAGE, ...ctx.taskPages.filter(d => d.section === 'frentes').map(d => d.id)] },
    { title: 'Desenvolvimento', placement: 'bottom' as const, pageIds: ctx.taskPages.filter(d => d.section === 'dev').map(d => d.id) },
  ], [ctx.taskPages]);
  const archiveGuarded = useCallback((pageId: string) => {
    if (fixedPageIds.has(pageId)) { showToast('Esta página é fixa: ela vem das frentes da Visão Daily.'); return; }
    archivePage(pageId);
  }, [archivePage, fixedPageIds, showToast]);
  const [tone, setToneState] = useState<NotionTone>(() => readTone(ctx.me));
  const setTone = useCallback((t: NotionTone) => { setToneState(t); saveTone(ctx.me, t); }, [ctx.me]);
  // Visão escolhida em cada página da base Tarefas: de cada pessoa, para uma página não trocar a visão da outra.
  const viewsKey = `gaas.notion.pageviews.${ctx.me || 'anon'}`;
  const [viewByPage, setViewByPage] = useState<Record<string, string>>(() => { try { return JSON.parse(localStorage.getItem(viewsKey) || '{}'); } catch { return {}; } });
  useEffect(() => { try { localStorage.setItem(viewsKey, JSON.stringify(viewByPage)); } catch { /* preferência local */ } }, [viewByPage, viewsKey]);
  /** Página onde a tarefa aparece: a da frente dela; sem página própria, a Geral. */
  const pageOfTask = useCallback((taskId: string) => {
    const db = latest.current.databases[TASKS_DB];
    const name = db?.rows.find(r => r.id === taskRowId(taskId))?.properties.p_frente;
    const key = db?.properties.find(p => p.id === 'p_frente')?.options?.find(o => o.name === name)?.id;
    if (key === GAAS_FRONT) return SDD_PAGE;
    return ctx.taskPages.find(d => key && d.fronts.includes(key))?.id || TASKS_PAGE;
  }, [ctx.taskPages]);

  // Link direto (?task=<id>, e o antigo ?dev_task=<id> da Fila) abre a Tarefa por cima da página da frente dela.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('task') || params.get('dev_task');
    if (!id) return;
    const known = ctx.tasks.get(id);
    if (known) { const top = known.parent_task_id || id; setActivePage(pageOfTask(top)); setPeekPageId(taskRowId(id)); setPeekDatabaseId(TASKS_DB); }
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
    // A cópia leva a estrutura (texto, critérios, dependências), nunca a conclusão nem a chave da original.
    const { completed_on: _done, ...details } = task.details || {};
    const fresh = { title: `${task.title} (cópia)`, task_key: '', status: 'backlog' as const, completed_criteria: [], resolution: null, blocked_reason: null, details };
    void createTask(fresh, task).then(saved => {
      ctx.tasks.set(saved.id, saved);
      const props = latest.current.databases[TASKS_DB].properties;
      const extra = src ? extraProps(src) : {};
      const baseRow = taskToRow(saved, props, latest.current.users, {}, ctx.projects, ctx.initiatives);
      const row = taskToRow(saved, props, latest.current.users, extra, ctx.projects, ctx.initiatives);
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
        const src = ws.databases[p.databaseId], ndb = generateId(isCreditBases(p.databaseId) ? 'db_credit_bases' : 'db');
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

  /** Cards abertos de cada página de frente, ao lado do nome na barra lateral. */
  const sidebarBadges = useMemo(() => {
    const open = [...ctx.tasks.values()].filter(t => !t.parent_task_id && t.status !== 'concluida' && t.status !== 'cancelada');
    const out: Record<string, number> = {};
    for (const pg of Object.values(workspace.pages)) if (pg.databaseId === TASKS_DB && (pg.taskFronts || []).length) out[pg.id] = open.filter(t => (pg.taskFronts || []).includes(String(t.front_key || ''))).length;
    // Tarefas | Geral: todas as frentes de negócio (sem o SDD). Bases de Crédito: pedidos na base.
    if (workspace.pages[TASKS_PAGE]) out[TASKS_PAGE] = open.filter(t => t.front_key !== GAAS_FRONT).length;
    for (const pg of Object.values(workspace.pages)) if (pg.title === CREDIT_BASES_TITLE && pg.databaseId && workspace.databases[pg.databaseId]) out[pg.id] = workspace.databases[pg.databaseId].rows.length;
    return out;
  }, [ctx.tasks, workspace.pages, workspace.databases]); // eslint-disable-line react-hooks/exhaustive-deps
  /** Registros da Visão Daily ligados a cada card (o do card e os das Sub Tarefas), para o selo "Daily" do Quadro. */
  const [dailyPulse, setDailyPulse] = useState<Map<string, DailyPulse>>(new Map());
  useEffect(() => {
    const start = new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10);
    void supabase.from('daily_entries').select('day,work_ids').is('deleted_at', null).not('work_ids', 'eq', '{}').gte('day', start).limit(3000)
      .then(({ data }) => {
        const recentFrom = new Date(Date.now() - 14 * 86400000).toISOString().slice(0, 10);
        const m = new Map<string, DailyPulse>();
        for (const e of (data || []) as { day: string; work_ids: string[] }[]) for (const id of e.work_ids || []) {
          const top = ctx.tasks.get(id)?.parent_task_id || id;
          const cur = m.get(top) || { recent: 0, last: '' };
          m.set(top, { recent: cur.recent + (e.day >= recentFrom ? 1 : 0), last: e.day > cur.last ? e.day : cur.last });
        }
        setDailyPulse(m);
      });
  }, [ctx.tasks.size]); // eslint-disable-line react-hooks/exhaustive-deps
  const taskCardFooter = useCallback((row: DatabaseRow) => {
    const id = taskIdOfRow(row.id); const task = id ? ctx.tasks.get(id) : undefined;
    if (!task) return null;
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());
    return <TaskCardFooter task={task} progress={subtaskProgress(task.id, [...ctx.tasks.values()])} daily={dailyPulse.get(task.id)} today={today} />;
  }, [ctx.tasks, dailyPulse]);

  /** Sub Tarefas com prazo aparecem no Calendário (só lá): abrem a janela da Tarefa e arrastar muda o prazo. */
  const subtaskCalendarRows = useCallback((fronts: string[]): DatabaseRow[] => {
    const props = workspace.databases[TASKS_DB]?.properties || [];
    const statusName = (k: string) => props.find(p => p.id === 'p_status')?.options?.find(o => o.id === k)?.name || '';
    const frontName = (k: string | null | undefined) => props.find(p => p.id === 'p_frente')?.options?.find(o => o.id === k)?.name || '';
    return [...ctx.tasks.values()]
      .filter(t => t.parent_task_id && t.due_date && !['concluida', 'cancelada'].includes(t.status) && (!fronts.length ? t.front_key !== GAAS_FRONT : fronts.includes(String(t.front_key || ''))))
      .map(t => ({ id: taskRowId(t.id), pageId: taskRowId(t.id), properties: {
        prop_title: `↳ ${t.title}`, p_prazo: t.due_date, p_status: statusName(t.status), p_frente: frontName(t.front_key),
      } }));
  }, [ctx.tasks, workspace.databases]);

  // Database renderer helper for embedding database views into any block or page
  const renderDatabase = useCallback(
    (databaseId: string, pageId?: string) => {
      const raw = workspace.databases[databaseId];
      if (raw && databaseId === TASKS_DB) {
        // Página por frente: só as tarefas das frentes dela. Geral (ou base embutida): todas as frentes de negócio, sem o SDD.
        const page = pageId ? workspace.pages[pageId] : undefined;
        const { scope, rows } = taskPageScope(raw, page);
        const single = scope.length <= 1;
        const kept = single ? raw.views.filter(v => v.groupByPropertyId !== 'p_frente') : raw.views;
        const views = kept.length ? kept : raw.views;
        const viewKey = pageId || 'embutida';
        const pick = viewByPage[viewKey];
        const currentViewId = views.some(v => v.id === pick) ? pick : views.some(v => v.id === raw.currentViewId) ? raw.currentViewId : views[0].id;
        const db = { ...raw, rows, views, currentViewId };
        return (
          <>
          <WorkStrip key={viewKey} tasks={[...ctx.tasks.values()]} myName={users.find(u => u.id === ctx.me)?.name || null}
            fronts={page?.taskFronts || []} onOpenTask={id => { setPeekPageId(taskRowId(id)); setPeekDatabaseId(TASKS_DB); }} />
          <DatabaseView
            key={viewKey}
            database={db}
            layoutKey={`gaas.notion.columns.${ctx.me || 'anon'}.${viewKey}`}
            users={users}
            onUpdateRow={updateRow}
            onAddRow={(id, props = {}) => addRow(id, props.p_frente || !scope.length ? props : { ...props, p_frente: scope[0] })}
            quickFilter={single && page?.taskFronts?.length
              ? { propertyId: 'p_projeto', hiddenByDefault: [], scope: ctx.projects.filter(pr => !pr.archived && (page.taskFronts || []).includes(pr.frente_key)).map(pr => pr.name), storageKey: `gaas.notion.chips.proj.${ctx.me || 'anon'}.${pageId}` }
              : { propertyId: 'p_frente', hiddenByDefault: [], scope, storageKey: `gaas.notion.chips.${ctx.me || 'anon'}.${!pageId || pageId === TASKS_PAGE ? databaseId : pageId}` }}
            calendarExtraRows={subtaskCalendarRows(page?.taskFronts || [])}
            cardFooter={taskCardFooter}
            cardHides={['p_subtarefas', 'p_prazo', ...(single ? ['p_frente'] : [])]}
            onDeleteRow={deleteRow}
            onDeleteRows={deleteRows}
            onAddProperty={addDatabaseProperty}
            onSetView={(_db, viewId) => setViewByPage(prev => ({ ...prev, [viewKey]: viewId }))}
            onAddView={(id, name, type) => { addDatabaseView(id, name, type); setViewByPage(prev => { const { [viewKey]: _old, ...rest } = prev; return rest; }); }}
            onUpdateView={updateDatabaseView}
            onDeleteView={deleteView}
            onDuplicateRow={duplicateRow}
            onOpenRowPage={(rowPageId: string) => {
              setPeekPageId(rowPageId);
              setPeekDatabaseId(databaseId);
            }}
          />
          </>
        );
      }
      if (!raw) {
        return (
          <div className="p-4 rounded-lg border border-[var(--notion-border)] text-xs text-[var(--notion-text-muted)] bg-[var(--notion-hover)]">
            Base "{databaseId}" não encontrada.
          </div>
        );
      }

      const creditBases = isCreditBases(databaseId);
      const selectedView = viewByPage[databaseId];
      const db = creditBases && raw.views.some(view => view.id === selectedView)
        ? { ...raw, currentViewId: selectedView }
        : raw;

      return (
        <DatabaseView
          database={db}
          layoutKey={creditBases ? `gaas.notion.columns.${ctx.me || 'anon'}.${databaseId}` : undefined}
          creditBases={creditBases}
          users={users}
          onUpdateRow={updateRow}
          onAddRow={addRow}
          onDeleteRow={deleteRow}
            onDeleteRows={deleteRows}
          onAddProperty={addDatabaseProperty}
          onSetView={creditBases ? (id, viewId) => setViewByPage(prev => ({ ...prev, [id]: viewId })) : setDatabaseView}
          onAddView={creditBases ? (id, name, type) => {
            addDatabaseView(id, name, type);
            setViewByPage(prev => {
              const next = { ...prev };
              delete next[id];
              return next;
            });
          } : addDatabaseView}
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
      workspace.pages,
      viewByPage,
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
            onClick={() => createPage()}
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
      : 'nt-wiki-font';

  const hasBoard = Boolean(activePage.databaseId || activePage.blockIds.some(id => workspace.blocks[id]?.type === 'database_view'));
  const widthClass = activePage.isFullWidth || hasBoard ? '' : 'max-w-4xl mx-auto';
  const textScaleClass = activePage.isSmallText ? 'text-xs' : 'text-sm';

  return (
    <NotionEditContext.Provider value={editApi}>
    <div ref={rootRef} tabIndex={-1} data-tone={tone} style={tone.startsWith('#') ? { '--notion-custom-bg': tone } as React.CSSProperties : undefined} className={`nt-root nt-tasks ${theme === 'dark' ? 'dark' : ''} relative flex h-full w-full overflow-hidden bg-[var(--notion-bg)] outline-none ${fontClass}`}>
      {/* Sidebar Navigation */}
      <Sidebar
        workspace={workspace}
        pageBadges={sidebarBadges}
        activePageId={aiSection ? '' : activePage.id}
        users={users}
        activeUserId={activeUser.id}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!isSidebarCollapsed)}
        onSelectPage={selectPage}
        onCreatePage={createPage}
        onArchivePage={archiveGuarded}
        onDuplicatePage={duplicatePage}
        sections={sidebarSections}
        virtualSection={aiSidebar}
        onToggleFavorite={toggleFavorite}
        onSetActiveUser={setActiveUser}
        onOpenSearch={() => setSearchOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenTemplates={() => setTemplatesOpen(true)}
        onImportMarkdown={importMarkdownPage}
        onOpenTrash={() => setTrashOpen(true)}
      />

      {/* Main Page Workspace */}
      {aiSection ? (
        <main className="flex-1 min-w-0 h-full">
          <AiPages section={aiSection} pages={aiData.pages} failed={aiData.failed} cards={aiCards} fronts={ctx.fronts}
            canEdit={ctx.canEditTasks} openKey={aiOpen} onOpen={setAiOpen} onSection={setAiSection} onRetry={loadAi}
            onTurnIntoCard={turnIntoCard} onOpenTask={openTaskWindow} />
        </main>
      ) : (
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto">
        <Topbar
          page={activePage}
          onUpdatePage={(partial) => updatePage(activePage.id, partial)}
          onToggleFavorite={() => toggleFavorite(activePage.id)}
          onArchivePage={() => archiveGuarded(activePage.id)}
          tone={tone}
          onSetTone={theme === 'dark' ? undefined : setTone}
          onDuplicatePage={() => duplicatePage(activePage.id)}
          onExportJSON={exportJSON}
          onExportMarkdown={() => downloadPageMarkdown(activePage, workspace, users)}
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
          {activePage.databaseId && (
            <div className="nt-page-inset pb-12">
              {renderDatabase(activePage.databaseId, activePage.id)}
            </div>
          )}
          {(!activePage.databaseId || activePage.blockIds.length > 0) && (
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
              compactEnd={activePage.id === 'page_inicio'}
            />
          )}
          {activePage.id === 'page_inicio' && (
            <TasksHome tasks={[...ctx.tasks.values()]} projects={ctx.projects} me={ctx.me} frontColors={new Map(ctx.fronts.map(f => [f.key, f.color]))}
              pages={Object.values(workspace.pages).filter(pg => pg.databaseId === TASKS_DB && (pg.taskFronts || []).length && !pg.isArchived)
                .sort((x, y) => Number((x.taskFronts || []).includes(GAAS_FRONT)) - Number((y.taskFronts || []).includes(GAAS_FRONT)))}
              creditBasesPage={Object.values(workspace.pages).find(pg => pg.title === CREDIT_BASES_TITLE && !pg.isArchived)}
              onOpenPage={setActivePage} onOpenTemplates={() => setTemplatesOpen(true)} />
          )}
        </div>
      </main>
      )}

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
      {taskModalId && (
        <TaskModal
          taskId={taskModalId}
          onClose={() => { setPeekPageId(null); setPeekDatabaseId(null); }}
          onChanged={applyTaskChanges}
        />
      )}
      <RowPeekModal
        isOpen={Boolean(peekPageId) && !taskModalId}
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
function serverRow(ws: NotionWorkspace, task: WorkItem, projects: DailyProjectRef[], initiatives: Initiative[] = [], all: WorkItem[] = []): DatabaseRow {
  const db = ws.databases[TASKS_DB];
  const current = db.rows.find(r => r.id === taskRowId(task.id));
  return taskToRow(task, db.properties, ws.users, current ? extraProps(current) : {}, projects, initiatives, subtaskProgress(task.id, all));
}
function replaceRows(ws: NotionWorkspace, rows: DatabaseRow[]): NotionWorkspace {
  const db = ws.databases[TASKS_DB];
  const byId = new Map(rows.map(r => [r.id, r]));
  return { ...ws, databases: { ...ws.databases, [TASKS_DB]: { ...db, rows: db.rows.map(r => byId.get(r.id) || r) } } };
}
