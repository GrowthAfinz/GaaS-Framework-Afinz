import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type React from 'react';
import {
  Archive, ArchiveRestore, ArrowLeft, ArrowRight, ChartLine, Columns3, Copy, DatabaseZap, Ellipsis, GripVertical, Inbox, Link2,
  PanelLeftClose, PanelLeftOpen, Pencil, Pin, Plus, Rows3, Search, SlidersHorizontal, TriangleAlert, Zap, CirclePause,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { getLocalViewport, toLocalPx, toLocalRect } from '../../../context/UIScaleContext';
import { fetchResultsSnapshot } from '../results/resultsService';
import type { ResultRow } from '../results/results.types';
import { loadStructure, saveCard, saveLane, savePillar, type StructureBoard } from './structureService';
import {
  B2B2C_WITHOUT_CRM, BOARD_COL_W, BU_OPTIONS, MED_META, OBS_META, STATUS_META, computeSignal, dropPosition, emptyFilters, fmtInt, fmtMoney, friendlyError, hasFilters, isDrift, kpis, passes, pillarSummary, toggleIsolate, uniqueRows,
  type CardSignal, type DeclaredStatus, type Lens, type Measurement, type Observed, type QuickFilter, type StructureCard, type StructureFilters, type StructureLane, type StructurePillar,
} from './structureModel';
import { StatusDot, StructureCardView } from './StructureCardView';
import { StructureSkeleton } from './StructureSkeleton';
import { BoardColorButton } from './BoardBackground';
import { StructureDrawer } from './StructureDrawer';
import { useBoardViewport } from './useBoardViewport';
import { BoardMiniMap, BoardZoomBar, useBoardChrome } from './BoardNav';
import './structure.css';

const W = BOARD_COL_W;
const PREFS_KEY = 'gaas.estrutura-crm.prefs';
interface Prefs { lens: Lens; dense: boolean; mini: boolean; showMetric: boolean; collapsed: string[]; legend: { docked: boolean; x: number; y: number } }
const DEFAULT_PREFS: Prefs = { lens: 'st', dense: false, mini: true, showMetric: true, collapsed: [], legend: { docked: true, x: 14, y: 14 } };
function readPrefs(): Prefs { try { return { ...DEFAULT_PREFS, ...JSON.parse(localStorage.getItem(PREFS_KEY) || '{}') }; } catch { return DEFAULT_PREFS; } }

type MenuState = { kind: 'card' | 'lane' | 'pillar' | 'filters' | 'alert' | 'more'; id?: string; rect: { left: number; right: number; bottom: number } } | null;
type DrawerState = { mode: 'view'; id: string } | { mode: 'create'; laneId: string | null } | null;
type Toast = { text: string; undo?: () => Promise<void> } | null;

function inlineEdit(el: HTMLElement | null, onSave: (value: string) => void) {
  if (!el) return;
  const old = el.textContent || '';
  el.contentEditable = 'true'; el.classList.add('cs-edit'); el.focus({ preventScroll: true });
  const range = document.createRange(); range.selectNodeContents(el); const sel = window.getSelection(); sel?.removeAllRanges(); sel?.addRange(range);
  const done = (ok: boolean) => {
    el.contentEditable = 'false'; el.classList.remove('cs-edit'); el.onblur = null; el.onkeydown = null;
    const v = (el.textContent || '').trim();
    if (ok && v.length >= 2 && v !== old) onSave(v); else el.textContent = old;
  };
  el.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); done(true); } if (e.key === 'Escape') done(false); };
  el.onblur = () => done(true);
}

export function StructureWorkspace({ modeSwitch }: { modeSwitch?: React.ReactNode } = {}) {
  const { user } = useAuth();
  const [board, setBoard] = useState<StructureBoard | null>(null);
  const [loadError, setLoadError] = useState('');
  const [rows, setRows] = useState<ResultRow[]>([]);
  const [rowsState, setRowsState] = useState<'loading' | 'ok' | 'error'>('loading');
  const [prefs, setPrefs] = useState<Prefs>(readPrefs);
  const [filters, setFilters] = useState<StructureFilters>(emptyFilters);
  const [showFora, setShowFora] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [drawer, setDrawer] = useState<DrawerState>(null);
  const [menu, setMenu] = useState<MenuState>(null);
  const [toast, setToast] = useState<Toast>(null);
  const [addingLane, setAddingLane] = useState<string | null>(null);
  const [drag, setDrag] = useState<{ id: string; overCard: string | null; overLane: string | null } | null>(null);
  const vp = useBoardViewport('gaas.estrutura-crm.view', Boolean(board));
  const toastTimer = useRef<number>();
  const today = useMemo(() => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date()), []);

  useEffect(() => { try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); } catch { /* preferência local */ } }, [prefs]);
  const reload = useCallback(async () => {
    try { setBoard(await loadStructure()); setLoadError(''); }
    catch { setLoadError('Não foi possível carregar a Estrutura CRM. Confira a conexão e tente de novo.'); }
  }, []);
  useEffect(() => { void reload(); }, [reload]);
  useEffect(() => {
    if (!user) return;
    let alive = true;
    Promise.all([fetchResultsSnapshot('crm', user.id), fetchResultsSnapshot('renta', user.id)])
      .then(([a, b]) => { if (alive) { setRows(uniqueRows([...a.rows, ...b.rows])); setRowsState('ok'); } })
      .catch(() => { if (alive) setRowsState('error'); });
    return () => { alive = false; };
  }, [user]);

  const showToast = useCallback((text: string, undo?: () => Promise<void>) => {
    setToast({ text, undo }); window.clearTimeout(toastTimer.current); toastTimer.current = window.setTimeout(() => setToast(null), 5000);
  }, []);
  const fail = useCallback((e: unknown) => {
    showToast(friendlyError(e));
    if (String((e as { message?: string })?.message || e).includes('revision_conflict')) void reload();
  }, [reload, showToast]);

  const editable = Boolean(board?.isAdmin);
  const pillars = useMemo(() => (board?.pillars || []).slice().sort((a, b) => a.position - b.position), [board]);
  const lanesByPillar = useMemo(() => {
    const m = new Map<string, StructureLane[]>();
    for (const l of (board?.lanes || []).slice().sort((a, b) => a.position - b.position)) m.set(l.pillar_id, [...(m.get(l.pillar_id) || []), l]);
    return m;
  }, [board]);
  const laneOptions = useMemo(() => pillars.flatMap(p => (lanesByPillar.get(p.id) || []).map(l => ({ ...l, pillar: p }))), [pillars, lanesByPillar]);
  const cards = useMemo(() => (board?.cards || []).filter(c => !c.archived && laneOptions.some(l => l.id === c.lane_id)).sort((a, b) => a.position - b.position), [board, laneOptions]);
  const archived = useMemo(() => (board?.cards || []).filter(c => c.archived), [board]);
  const signals = useMemo(() => new Map<string, CardSignal>(cards.map(c => [c.id, computeSignal(c, rows, today)])), [cards, rows, today]);
  const sig = useCallback((id: string) => signals.get(id) || computeSignal({ data_scope: null }, [], today), [signals, today]);
  const visible = useMemo(() => cards.filter(c => passes(c, sig(c.id), filters)), [cards, sig, filters]);
  const visibleIds = useMemo(() => new Set(visible.map(c => c.id)), [visible]);
  const k = useMemo(() => kpis(cards, signals), [cards, signals]);
  const dataUntil = useMemo(() => { const d = rows.reduce((m, r) => (r.date > m && r.date <= today ? r.date : m), ''); return d ? d.split('-').reverse().join('/') : 'n/d'; }, [rows, today]);
  const collapsed = useMemo(() => new Set(prefs.collapsed), [prefs.collapsed]);

  /* ---------- mutações ---------- */
  const replaceCard = (saved: StructureCard) => setBoard(b => b && { ...b, cards: b.cards.some(c => c.id === saved.id) ? b.cards.map(c => (c.id === saved.id ? saved : c)) : [...b.cards, saved] });
  const mutateCard = useCallback(async (card: StructureCard, body: Record<string, unknown>, label: string) => {
    const raw = card as unknown as Record<string, unknown>;
    const before = Object.fromEntries(Object.keys(body).map(key => [key, raw[key]]));
    const saved = await saveCard(card.id, card.revision, body);
    replaceCard(saved);
    showToast(label, async () => { try { replaceCard(await saveCard(saved.id, saved.revision, before)); setToast(null); } catch (e) { fail(e); } });
  }, [fail, showToast]);
  const moveCard = useCallback(async (id: string, laneId: string, beforeId: string | null) => {
    const card = cards.find(c => c.id === id); if (!card || id === beforeId) return;
    const position = dropPosition(cards.filter(c => c.lane_id === laneId), id, beforeId);
    if (card.lane_id === laneId && card.position === position) return;
    setBoard(b => b && { ...b, cards: b.cards.map(c => (c.id === id ? { ...c, lane_id: laneId, position } : c)) });
    try { await mutateCard(card, { lane_id: laneId, position }, card.lane_id === laneId ? 'Ordem alterada' : `Movida para ${laneOptions.find(l => l.id === laneId)?.title}`); }
    catch (e) { fail(e); void reload(); }
  }, [cards, fail, laneOptions, mutateCard, reload]);
  const createCard = useCallback(async (body: Record<string, unknown>, open = true) => {
    const saved = await saveCard(null, null, body);
    replaceCard(saved); showToast('Campanha criada');
    if (open) setDrawer({ mode: 'view', id: saved.id });
    window.setTimeout(() => vp.reveal(document.querySelector(`[data-card="${saved.id}"]`)), 60);
  }, [showToast, vp]);
  const lanePatch = useCallback(async (lane: StructureLane, body: Record<string, unknown>, label: string) => {
    try { const saved = await saveLane(lane.id, lane.revision, body); setBoard(b => b && { ...b, lanes: saved.archived ? b.lanes.filter(l => l.id !== saved.id) : b.lanes.map(l => (l.id === saved.id ? saved : l)) }); showToast(label); }
    catch (e) { fail(e); }
  }, [fail, showToast]);
  const pillarPatch = useCallback(async (pillar: StructurePillar, body: Record<string, unknown>, label: string) => {
    try { const saved = await savePillar(pillar.id, pillar.revision, body); setBoard(b => b && { ...b, pillars: saved.archived ? b.pillars.filter(p => p.id !== saved.id) : b.pillars.map(p => (p.id === saved.id ? saved : p)) }); showToast(label); }
    catch (e) { fail(e); }
  }, [fail, showToast]);
  const reorder = useCallback(async <T extends { id: string; revision: number; position: number }>(list: T[], id: string, dir: -1 | 1, save: (item: T, position: number) => Promise<unknown>) => {
    const i = list.findIndex(x => x.id === id), j = i + dir;
    if (i < 0 || j < 0 || j >= list.length) return;
    const next = list.slice(); [next[i], next[j]] = [next[j], next[i]];
    try { for (const [idx, item] of next.entries()) if (item.position !== idx + 1) await save(item, idx + 1); await reload(); showToast('Ordem alterada'); }
    catch (e) { fail(e); }
  }, [fail, reload, showToast]);

  /* ---------- layout do quadro ---------- */
  const template: string[] = [];
  const placed: { pillar: StructurePillar; col: number; span: number; lanes: { lane: StructureLane; col: number; span: number }[] }[] = [];
  let col = 1;
  for (const p of pillars) {
    const ls = lanesByPillar.get(p.id) || [];
    if (collapsed.has(p.id)) { template.push('46px'); placed.push({ pillar: p, col, span: 1, lanes: [] }); col += 1; continue; }
    const start = col; const lanes = [];
    for (const l of ls) { const span = l.wide ? 2 : 1; for (let s = 0; s < span; s++) template.push(`${W}px`); lanes.push({ lane: l, col, span }); col += span; }
    if (!ls.length) { template.push(`${W}px`); col += 1; }
    placed.push({ pillar: p, col: start, span: Math.max(1, col - start), lanes });
  }

  /* ---------- altura do canvas, enquadramento inicial e minimapa (comum com o Mapeamento) ---------- */
  const mini = useBoardChrome(vp, { ready: Boolean(board), mini: prefs.mini, deps: [hasFilters(filters)] });

  /* ---------- teclado ---------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const a = document.activeElement as HTMLElement | null;
      if (a && (/INPUT|TEXTAREA|SELECT/.test(a.tagName) || a.isContentEditable)) return;
      if (e.key === 'Escape') { setMenu(null); setDrawer(null); }
      else if (e.key === '/') { e.preventDefault(); document.getElementById('cs-q')?.focus({ preventScroll: true }); }
      else if ((e.key === 'n' || e.key === 'N') && editable) { e.preventDefault(); setDrawer({ mode: 'create', laneId: null }); }
      else if (e.ctrlKey || e.metaKey) return;
      else if (e.key === '+' || e.key === '=') vp.zoomAt(1.15);
      else if (e.key === '-') vp.zoomAt(1 / 1.15);
      else if (e.key === '0') vp.fit();
      else if (e.key === 'c' || e.key === 'C') setPrefs(p => ({ ...p, dense: !p.dense }));
      else if (e.key === 'm' || e.key === 'M') setPrefs(p => ({ ...p, mini: !p.mini }));
    };
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  }, [editable, vp]);
  useEffect(() => { if (!menu) return; const close = () => setMenu(null); window.addEventListener('pointerdown', close); return () => window.removeEventListener('pointerdown', close); }, [menu]);

  /* ---------- caixa Status / Filtros arrastável ---------- */
  const legDrag = useRef<{ sx: number; sy: number; ox: number; oy: number; moved: boolean; x?: number; y?: number } | null>(null);
  const [legLive, setLegLive] = useState<{ x: number; y: number } | null>(null);
  const legPos = prefs.legend.docked ? { x: 14, y: 14 } : (legLive || prefs.legend);

  const openMenu = (kind: NonNullable<MenuState>['kind'], anchor: HTMLElement, id?: string) => { const r = toLocalRect(anchor.getBoundingClientRect()); setMenu({ kind, id, rect: { left: r.left, right: r.right, bottom: r.bottom } }); };
  const setFilter = (patch: Partial<StructureFilters>) => setFilters(f => ({ ...f, ...patch }));
  const statKpi = (key: 'on' | 'r' | 'drift' | 'n' | 'parada' | 'unlinked') => {
    const isOn = key === 'on' ? filters.obs.has('on') && filters.obs.size === 1 : key === 'r' || key === 'n' ? filters.med.has(key) && filters.med.size === 1 : filters.quick === key;
    const base = { ...emptyFilters(), q: filters.q, bu: filters.bu };
    if (isOn) return setFilters(base);
    if (key === 'on') setFilters({ ...base, obs: new Set<Observed>(['on']) });
    else if (key === 'r' || key === 'n') setFilters({ ...base, med: new Set<Measurement>([key]) });
    else setFilters({ ...base, quick: key as QuickFilter });
  };
  const legendDims: Record<Lens, { title: string; entries: [string, { label: string; hint: string }][]; set: Set<string>; key: 'st' | 'obs' | 'med' }> = {
    st: { title: 'Status', entries: Object.entries(STATUS_META), set: filters.st as Set<string>, key: 'st' },
    obs: { title: 'Atividade', entries: Object.entries(OBS_META), set: filters.obs as Set<string>, key: 'obs' },
    med: { title: 'Medição', entries: Object.entries(MED_META), set: filters.med as Set<string>, key: 'med' },
  };
  const dim = legendDims[prefs.lens];
  const lensValue = (c: StructureCard) => (prefs.lens === 'st' ? c.declared_status : prefs.lens === 'med' ? c.measurement : sig(c.id).observed) as string;
  const lensSwatch = (value: string) => (prefs.lens === 'st' ? STATUS_META[value as DeclaredStatus].color : prefs.lens === 'med' ? MED_META[value as Measurement].color : OBS_META[value as Observed].color) || '#cbd5e1';
  const countBy = (value: string) => cards.filter(c => (prefs.lens === 'st' ? c.declared_status : prefs.lens === 'med' ? c.measurement : sig(c.id).observed) === value).length;
  const lensDot = (value: string) => {
    const fake = { declared_status: (prefs.lens === 'st' ? value : 'bkl') as DeclaredStatus, measurement: (prefs.lens === 'med' ? value : 'n') as Measurement };
    return <StatusDot lens={prefs.lens} card={fake} signal={{ observed: (prefs.lens === 'obs' ? value : 'none') as Observed }} />;
  };

  const chips: [string, () => void][] = [];
  filters.st.forEach(v => chips.push([`Status: ${STATUS_META[v].label}`, () => setFilter({ st: new Set([...filters.st].filter(x => x !== v)) })]));
  filters.obs.forEach(v => chips.push([`Atividade: ${OBS_META[v].label}`, () => setFilter({ obs: new Set([...filters.obs].filter(x => x !== v)) })]));
  filters.med.forEach(v => chips.push([`Medição: ${MED_META[v].label}`, () => setFilter({ med: new Set([...filters.med].filter(x => x !== v)) })]));
  if (filters.bu) chips.push([`BU: ${filters.bu}`, () => setFilter({ bu: '' })]);
  if (filters.q) chips.push([`Busca: "${filters.q}"`, () => setFilter({ q: '' })]);
  if (filters.quick) chips.push([{ drift: 'Só divergências', parada: 'Paradas há mais de 30 dias', unlinked: 'Sem vínculo de dados' }[filters.quick], () => setFilter({ quick: null })]);

  const driftByPillar = placed.map(p => ({ p: p.pillar, n: cards.filter(c => (lanesByPillar.get(p.pillar.id) || []).some(l => l.id === c.lane_id) && isDrift(c, sig(c.id))).length })).sort((a, b) => b.n - a.n);
  const openCard = useCallback((id: string) => setDrawer({ mode: 'view', id }), []);
  const drawerCard = drawer?.mode === 'view' ? cards.find(c => c.id === drawer.id) || null : null;
  const drawerIdx = drawerCard ? visible.findIndex(c => c.id === drawerCard.id) : -1;

  /* ---------- arrastar card ---------- */
  const onDragStart = useCallback((e: React.DragEvent, id: string) => { e.dataTransfer.setData('text/plain', id); e.dataTransfer.effectAllowed = 'move'; setDrag({ id, overCard: null, overLane: null }); }, []);
  const onDragEnd = useCallback(() => setDrag(null), []);
  const onDragOverCard = useCallback((e: React.DragEvent, id: string) => { if (!editable) return; e.preventDefault(); setDrag(d => (d && d.overCard !== id ? { ...d, overCard: id } : d)); }, [editable]);
  const onDropCard = useCallback((e: React.DragEvent, id: string) => {
    e.preventDefault(); e.stopPropagation();
    const moving = e.dataTransfer.getData('text/plain'); const target = cards.find(c => c.id === id);
    setDrag(null); if (moving && target) void moveCard(moving, target.lane_id, id);
  }, [cards, moveCard]);
  const onRename = useCallback((id: string, el: HTMLElement) => { const c = cards.find(x => x.id === id); if (c) inlineEdit(el, v => { mutateCard(c, { title: v }, 'Campanha renomeada').catch(fail); }); }, [cards, fail, mutateCard]);
  const onCardMenu = useCallback((id: string, anchor: HTMLElement) => openMenu('card', anchor, id), []);

  if (loadError) return <div className="cs-root" style={{ padding: 24 }}><p className="cs-err">{loadError}</p><button className="cs-btn" onClick={() => void reload()}>Tentar de novo</button></div>;
  if (!board) return <StructureSkeleton modeSwitch={modeSwitch} />;
  /** Números que dependem dos disparos: piscam enquanto carregam e viram n/d se a leitura falhar. */
  const rowDep = (n: React.ReactNode) => (rowsState === 'ok' ? n : rowsState === 'loading' ? <span className="cs-sk" aria-label="carregando" /> : 'n/d');

  const menuCard = menu?.kind === 'card' ? cards.find(c => c.id === menu.id) : undefined;
  const menuLane = menu?.kind === 'lane' ? board.lanes.find(l => l.id === menu.id) : undefined;
  const menuPillar = menu?.kind === 'pillar' ? pillars.find(p => p.id === menu.id) : undefined;
  const fora = B2B2C_WITHOUT_CRM.filter(b => !cards.some(c => c.bus.includes(b)));

  return (
    <div className={`cs-root${prefs.dense ? ' cs-dense' : ''}`}>
      <div className="cs-bar">
        {modeSwitch ? <span title={`${cards.length} campanhas · dados até ${dataUntil}`}>{modeSwitch}</span> : <h2 title={`${cards.length} campanhas · dados até ${dataUntil}`}>Estrutura CRM</h2>}
        <span className="cs-sep" />
        <button className={`cs-stat${filters.obs.has('on') ? ' on' : ''}`} title="Disparo nos últimos 30 dias" onClick={() => statKpi('on')}><Zap /><b>{rowDep(k.active)}</b><span className="lb">ativas</span></button>
        <button className={`cs-stat${filters.med.has('r') ? ' on' : ''}`} title="Têm fonte de resultado" onClick={() => statKpi('r')}><ChartLine /><b>{k.measured}</b><span className="lb">medem resultado</span></button>
        <button className={`cs-stat${filters.quick === 'drift' ? ' on' : ''}`} title="Declaradas ativas sem disparo recente" onClick={() => statKpi('drift')}><TriangleAlert /><b>{rowDep(k.drift)}</b><span className="lb">divergem</span></button>
        <button className={`cs-stat${filters.med.has('n') ? ' on' : ''}`} title="Nenhuma fonte mapeada" onClick={() => statKpi('n')}><DatabaseZap /><b>{k.noSource}</b><span className="lb">sem fonte</span></button>
        <button className={`cs-stat${filters.quick === 'parada' ? ' on' : ''}`} title="Sem disparo há mais de 30 dias" onClick={() => statKpi('parada')}><CirclePause /><b>{rowDep(k.stopped)}</b><span className="lb">paradas</span></button>
        <button className={`cs-stat${filters.quick === 'unlinked' ? ' on' : ''}`} title="Ainda não ligadas aos disparos" onClick={() => statKpi('unlinked')}><Link2 /><b>{k.unlinked}</b><span className="lb">sem vínculo</span></button>
        {rowsState === 'ok' && k.drift > 0 && <button className="cs-alert" onPointerDown={e => e.stopPropagation()} onClick={e => openMenu('alert', e.currentTarget)}><TriangleAlert size={13} />{k.drift}</button>}
        {rowsState === 'loading' && <span className="cs-readonly">Lendo disparos…</span>}
        {rowsState === 'error' && <span className="cs-readonly" style={{ color: '#b91c1c' }}>Disparos indisponíveis</span>}
        <span className="cs-grow" />
        {!editable && <span className="cs-readonly">Somente leitura</span>}
        <label className="cs-search"><Search size={14} /><input id="cs-q" type="search" placeholder="Buscar  /" value={filters.q} onChange={e => setFilter({ q: e.target.value })} /></label>
        <span className="cs-seg">{(['st', 'obs', 'med'] as Lens[]).map(l => <button key={l} className={prefs.lens === l ? 'on' : ''} onClick={() => setPrefs(p => ({ ...p, lens: l }))}>{{ st: 'Declarado', obs: 'Observado', med: 'Medição' }[l]}</button>)}</span>
        <select className="cs-sel" value={filters.bu} aria-label="Filtrar por BU" onChange={e => setFilter({ bu: e.target.value })}><option value="">Todas as BUs</option>{[...BU_OPTIONS, ...B2B2C_WITHOUT_CRM].map(b => <option key={b}>{b}</option>)}</select>
        <button className="cs-btn" onPointerDown={e => e.stopPropagation()} onClick={e => openMenu('filters', e.currentTarget)}><SlidersHorizontal />Filtros{(showFora || showArchived || !prefs.showMetric) && <span className="cs-count">{[showFora, showArchived, !prefs.showMetric].filter(Boolean).length}</span>}</button>
        <BoardColorButton />
        <button className="cs-icon" aria-label="Mais opções" onPointerDown={e => e.stopPropagation()} onClick={e => openMenu('more', e.currentTarget)}><Ellipsis /></button>
        {editable && <button className="cs-btn pri" onClick={() => setDrawer({ mode: 'create', laneId: null })}><Plus />Campanha</button>}
      </div>
      {chips.length > 0 && (
        <div className="cs-chips">
          <span>Mostrando {visible.length} de {cards.length}</span>
          {chips.map(([label, remove]) => <span key={label} className="cs-chip">{label}<button aria-label="Remover filtro" onClick={remove}>×</button></span>)}
          <button className="cs-icon" style={{ fontSize: 12, color: '#0e7490' }} onClick={() => setFilters(emptyFilters())}>Limpar filtros</button>
        </div>
      )}

      <div ref={vp.canvasRef} className={`cs-canvas${vp.panning ? ' panning' : ''}`} style={vp.gridStyle} {...vp.handlers}>
        <div ref={vp.stageRef} className={`cs-stage${prefs.legend.docked ? ' legdock' : ''}`} style={{ transform: `translate(${Math.round(vp.view.x)}px,${Math.round(vp.view.y)}px) scale(${vp.view.z})` }}>
          <div className={`cs-legend${legLive ? ' dragging' : ''}`} data-nopan style={{ left: legPos.x, top: legPos.y }}>
            <h5
              title="Arraste para mover"
              onPointerDown={e => { if ((e.target as Element).closest('button')) return; e.stopPropagation(); const el = e.currentTarget.parentElement!; legDrag.current = { sx: e.clientX, sy: e.clientY, ox: el.offsetLeft, oy: el.offsetTop, moved: false }; try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* ponteiro sem captura */ } }}
              onPointerMove={e => { const d = legDrag.current; if (!d) return; const dx = toLocalPx(e.clientX - d.sx) / vp.view.z, dy = toLocalPx(e.clientY - d.sy) / vp.view.z; if (!d.moved && Math.hypot(dx, dy) < 4) return; d.moved = true; d.x = d.ox + dx; d.y = d.oy + dy; setLegLive({ x: d.x, y: d.y }); }}
              onPointerUp={() => { const d = legDrag.current; legDrag.current = null; if (d?.moved) { const pos = { x: d.x ?? d.ox, y: d.y ?? d.oy }; setPrefs(p => ({ ...p, legend: { docked: false, ...pos } })); } setLegLive(null); }}
            >
              <span><GripVertical />{dim.title} / Filtros</span>
              <span style={{ gap: 6 }}>
                {dim.set.size > 0 && <button onClick={() => setFilter({ [dim.key]: new Set() } as Partial<StructureFilters>)}>Mostrar todos</button>}
                {!prefs.legend.docked && <button title="Fixar à esquerda da primeira coluna" onClick={() => setPrefs(p => ({ ...p, legend: { ...p.legend, docked: true } }))}><Pin size={14} /></button>}
              </span>
            </h5>
            <div className="cs-hint">Clique isola · Shift+clique soma</div>
            {dim.entries.map(([value, meta]) => (
              <button key={value} className={`cs-lg${dim.set.has(value) ? ' on' : dim.set.size ? ' off' : ''}`} title={meta.hint}
                onClick={e => setFilters(f => ({ ...f, quick: null, [dim.key]: toggleIsolate(f[dim.key] as Set<string>, value, e.shiftKey || e.ctrlKey || e.metaKey) }))}>
                {lensDot(value)}<span><b>{meta.label}</b><span className="s">{meta.hint}</span></span><span className="c">{countBy(value)}</span>
              </button>
            ))}
            {prefs.lens === 'st' && <button className={`cs-lg${filters.quick === 'drift' ? ' on' : ''}`} onClick={() => setFilter({ quick: filters.quick === 'drift' ? null : 'drift' })}><TriangleAlert size={15} color="#b45309" /><span><b>Divergência</b><span className="s">Declarado não bate com os dados</span></span><span className="c">{rowDep(k.drift)}</span></button>}
          </div>

          <div className="cs-board" style={{ gridTemplateColumns: template.join(' ') }}>
            {placed.map(({ pillar, col: c0, span }) => {
              const pl = lanesByPillar.get(pillar.id) || [];
              const pillarCards = cards.filter(c => pl.some(l => l.id === c.lane_id));
              const total = pillarCards.length, shown = visible.filter(c => pl.some(l => l.id === c.lane_id)).length;
              const sum = pillarSummary(pillarCards, signals);
              if (collapsed.has(pillar.id)) return (
                <div key={pillar.id} className="cs-H collapsed" data-nopan data-mini={pillar.accent} style={{ gridColumn: `${c0} / span 1`, gridRow: '1 / span 3', ['--acc' as string]: pillar.accent }} title={`Expandir ${pillar.title}`}
                  onClick={() => setPrefs(p => ({ ...p, collapsed: p.collapsed.filter(x => x !== pillar.id) }))}>
                  <PanelLeftOpen size={15} /><span>{pillar.title}</span><span className="cs-n">· {shown === total ? total : `${shown} de ${total}`}</span>
                </div>
              );
              return (
                <div key={pillar.id} className="cs-H" data-mini={pillar.accent} style={{ gridColumn: `${c0} / span ${span}`, gridRow: 1, ['--acc' as string]: pillar.accent }}>
                  <div className="cs-Hr">
                    <button className="cs-icon cs-Hic" title="Recolher pilar" onClick={() => setPrefs(p => ({ ...p, collapsed: [...p.collapsed, pillar.id] }))}><PanelLeftClose /></button>
                    <span className="cs-Ht" data-nopan onDoubleClick={e => { if (editable) inlineEdit(e.currentTarget, v => void pillarPatch(pillar, { title: v }, 'Pilar renomeado')); }}>{pillar.title}</span>
                    <span className="cs-n">{shown === total ? total : `${shown} de ${total}`}</span>
                    {editable && <button className="cs-icon" style={{ marginLeft: 'auto' }} aria-label="Ações do pilar" onPointerDown={e => e.stopPropagation()} onClick={e => openMenu('pillar', e.currentTarget, pillar.id)}><Ellipsis /></button>}
                  </div>
                  <div className="cs-Hs">
                    {total} {total === 1 ? 'campanha' : 'campanhas'}
                    {rowsState !== 'ok' ? <> · {rowDep(null)}</> : (<>
                      {' · '}<b>{sum.active} {sum.active === 1 ? 'ativa' : 'ativas'}</b>
                      {sum.cards != null ? <> · <b>{fmtInt(sum.cards)}</b> cartões 90d{sum.cac != null && <> · CAC <b>{fmtMoney(sum.cac)}</b></>}</> : sum.base > 0 ? <> · <b>{fmtInt(sum.base)}</b> base 90d</> : null}
                      {sum.stopped > 0 && <> · {sum.stopped} {sum.stopped === 1 ? 'parada' : 'paradas'}</>}
                    </>)}
                  </div>
                  <div className="cs-Hbar" title={`Composição por ${dim.title.toLowerCase()}`}>
                    {dim.entries.map(([value, meta]) => { const n = pillarCards.filter(c => lensValue(c) === value).length; return n ? <i key={value} title={`${meta.label}: ${n}`} style={{ flex: n, background: lensSwatch(value) }} /> : null; })}
                  </div>
                </div>
              );
            })}
            {placed.flatMap(p => p.lanes).map(({ lane, col: c0, span }) => {
              const all = cards.filter(c => c.lane_id === lane.id); const vis = all.filter(c => visibleIds.has(c.id));
              return (
                <div key={'h' + lane.id} className="cs-S" style={{ gridColumn: `${c0} / span ${span}`, gridRow: 2 }}>
                  <div className="cs-Si">
                    <span data-nopan onDoubleClick={e => { if (editable) inlineEdit(e.currentTarget, v => void lanePatch(lane, { title: v }, 'Coluna renomeada')); }}>{lane.title}</span>
                    <span className="cs-pill">{vis.length === all.length ? all.length : `${vis.length} de ${all.length}`}</span>
                    {editable && <button className="cs-icon" aria-label="Ações da coluna" onPointerDown={e => e.stopPropagation()} onClick={e => openMenu('lane', e.currentTarget, lane.id)}><Ellipsis /></button>}
                  </div>
                </div>
              );
            })}
            {placed.flatMap(p => p.lanes).map(({ lane, col: c0, span }) => {
              const all = cards.filter(c => c.lane_id === lane.id); const vis = all.filter(c => visibleIds.has(c.id));
              return (
                <div key={'l' + lane.id} data-mini="" className={`cs-lane${lane.wide ? ' wide' : ''}${drag?.overLane === lane.id ? ' over' : ''}`} style={{ gridColumn: `${c0} / span ${span}`, gridRow: 3 }}
                  onDragOver={e => { if (!editable || !drag) return; e.preventDefault(); if (drag.overLane !== lane.id) setDrag({ ...drag, overLane: lane.id }); }}
                  onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDrag(d => (d ? { ...d, overLane: null, overCard: null } : d)); }}
                  onDrop={e => { e.preventDefault(); const id = e.dataTransfer.getData('text/plain'); setDrag(null); if (id) void moveCard(id, lane.id, null); }}>
                  {vis.map(c => (
                    <StructureCardView key={c.id} card={c} signal={sig(c.id)} metricKey={lane.metric_key} lens={prefs.lens} showMetric={prefs.showMetric} editable={editable} today={today} dataState={rowsState}
                      dropBefore={drag?.overCard === c.id && drag.id !== c.id} dragging={drag?.id === c.id}
                      onOpen={openCard} onRename={onRename} onMenu={onCardMenu} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragOverCard={onDragOverCard} onDropCard={onDropCard} />
                  ))}
                  {!vis.length && <div className="cs-empty">{all.length ? 'Nenhuma campanha neste filtro' : 'Coluna vazia. Arraste um card ou crie um.'}</div>}
                  {editable && (addingLane === lane.id ? (
                    <div className="cs-add" data-nopan>
                      <textarea autoFocus placeholder="Nome da campanha" onKeyDown={async e => {
                        if (e.key === 'Escape') setAddingLane(null);
                        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); const ta = e.currentTarget; const v = ta.value.trim(); if (v.length < 2) return; try { await createCard({ lane_id: lane.id, title: v }, false); ta.value = ''; } catch (err) { fail(err); } }
                      }} />
                      <div style={{ display: 'flex', gap: 6, marginTop: 5 }}><span style={{ fontSize: 11.5, color: '#64748b' }}>Enter cria · Esc fecha</span><button className="cs-icon" style={{ marginLeft: 'auto' }} onClick={() => setAddingLane(null)}>Fechar</button></div>
                    </div>
                  ) : <div className="cs-add"><button onClick={() => setAddingLane(lane.id)}><Plus size={14} />Adicionar campanha</button></div>)}
                </div>
              );
            })}
            {showFora && <div className="cs-fora" style={{ gridRow: 4 }}><b>Carteira B2B2C sem CRM</b>{fora.length ? fora.map(f => <span key={f}>{f}</span>) : 'todos os parceiros já têm alguma campanha'}</div>}
            {showArchived && (
              <div className="cs-fora" style={{ gridRow: 5 }} data-nopan>
                <b>Arquivadas · {archived.length}</b>
                {archived.length ? archived.map(c => <span key={c.id}>{c.title}{editable && <button className="cs-icon" title="Restaurar" onClick={() => mutateCard(c, { archived: false }, 'Campanha restaurada').catch(fail)}><ArchiveRestore size={13} /></button>}</span>) : 'Nada arquivado.'}
              </div>
            )}
          </div>
        </div>

        <BoardZoomBar vp={vp} showMini={prefs.mini} onToggleMini={() => setPrefs(p => ({ ...p, mini: !p.mini }))}>
          <button className={`cs-zb${prefs.dense ? ' on' : ''}`} title="Modo compacto ( C )" onClick={() => setPrefs(p => ({ ...p, dense: !p.dense }))}><Rows3 />Compacto</button>
        </BoardZoomBar>
        {prefs.mini && <BoardMiniMap vp={vp} mini={mini} />}
      </div>

      {menu && (
        <div className="cs-menu" style={{ left: Math.max(8, Math.min(menu.rect.right - 240, getLocalViewport().width - 250)), top: menu.rect.bottom + 4 }} onPointerDown={e => e.stopPropagation()}>
          {menu.kind === 'card' && menuCard && (<>
            <div className="sec">STATUS</div>
            {(Object.keys(STATUS_META) as DeclaredStatus[]).map(st => <button key={st} className={menuCard.declared_status === st ? 'cur' : ''} onClick={() => { setMenu(null); mutateCard(menuCard, { declared_status: st }, `Status: ${STATUS_META[st].label}`).catch(fail); }}><StatusDot lens="st" card={{ declared_status: st, measurement: 'n' }} />{STATUS_META[st].label}</button>)}
            <hr /><div className="sec">MOVER PARA</div>
            {laneOptions.map(l => <button key={l.id} className={menuCard.lane_id === l.id ? 'cur' : ''} onClick={() => { setMenu(null); void moveCard(menuCard.id, l.id, null); }}><ArrowRight />{l.pillar.title} › {l.title}</button>)}
            <hr />
            <button onClick={() => { setMenu(null); openCard(menuCard.id); }}><Pencil />Abrir e editar</button>
            <button onClick={() => { setMenu(null); createCard({ lane_id: menuCard.lane_id, title: `${menuCard.title} (cópia)`, audience: menuCard.audience, bus: menuCard.bus, declared_status: menuCard.declared_status, measurement: menuCard.measurement, owner: menuCard.owner, wiki_note: menuCard.wiki_note, data_scope: menuCard.data_scope }, false).catch(fail); }}><Copy />Duplicar</button>
            <button style={{ color: '#b91c1c' }} onClick={() => { setMenu(null); mutateCard(menuCard, { archived: true }, 'Campanha arquivada').catch(fail); }}><Archive />Arquivar</button>
          </>)}
          {menu.kind === 'lane' && menuLane && (() => { const pl = lanesByPillar.get(menuLane.pillar_id) || []; return (<>
            <button onClick={() => { setMenu(null); setAddingLane(menuLane.id); }}><Plus />Adicionar campanha</button>
            <button onClick={() => { setMenu(null); void lanePatch(menuLane, { wide: !menuLane.wide }, 'Largura da coluna alterada'); }}><Columns3 />{menuLane.wide ? 'Coluna estreita' : 'Coluna larga (2 cards por linha)'}</button>
            <button onClick={() => { setMenu(null); void reorder(pl, menuLane.id, -1, (l, position) => saveLane(l.id, l.revision, { position })); }}><ArrowLeft />Mover para a esquerda</button>
            <button onClick={() => { setMenu(null); void reorder(pl, menuLane.id, 1, (l, position) => saveLane(l.id, l.revision, { position })); }}><ArrowRight />Mover para a direita</button>
            <hr /><button style={{ color: '#b91c1c' }} onClick={() => { setMenu(null); void lanePatch(menuLane, { archived: true }, 'Coluna arquivada'); }}><Archive />Arquivar coluna vazia</button>
          </>); })()}
          {menu.kind === 'pillar' && menuPillar && (<>
            <button onClick={async () => { setMenu(null); try { const last = (lanesByPillar.get(menuPillar.id) || []).slice(-1)[0]; await saveLane(null, null, { pillar_id: menuPillar.id, title: 'Nova coluna', metric_key: last?.metric_key || 're' }); await reload(); showToast('Coluna criada. Dê dois cliques no nome para renomear.'); } catch (e) { fail(e); } }}><Plus />Adicionar coluna</button>
            <button onClick={() => { setMenu(null); void reorder(pillars, menuPillar.id, -1, (p, position) => savePillar(p.id, p.revision, { position })); }}><ArrowLeft />Mover para a esquerda</button>
            <button onClick={() => { setMenu(null); void reorder(pillars, menuPillar.id, 1, (p, position) => savePillar(p.id, p.revision, { position })); }}><ArrowRight />Mover para a direita</button>
            <button onClick={async () => { setMenu(null); try { const p = await savePillar(null, null, { title: 'Novo pilar' }); await saveLane(null, null, { pillar_id: p.id, title: 'Nova coluna' }); await reload(); showToast('Pilar criado no fim do quadro.'); } catch (e) { fail(e); } }}><Columns3 />Novo pilar</button>
            <hr /><button style={{ color: '#b91c1c' }} onClick={() => { setMenu(null); void pillarPatch(menuPillar, { archived: true }, 'Pilar arquivado'); }}><Archive />Arquivar pilar vazio</button>
          </>)}
          {menu.kind === 'filters' && (<>
            <div className="sec">CARDS</div>
            <label className="row2">Número em destaque<input type="checkbox" checked={prefs.showMetric} onChange={e => setPrefs(p => ({ ...p, showMetric: e.target.checked }))} /></label>
            <label className="row2">Modo compacto<input type="checkbox" checked={prefs.dense} onChange={e => setPrefs(p => ({ ...p, dense: e.target.checked }))} /></label>
            <div className="sec">MOSTRAR</div>
            <label className="row2">Carteira B2B2C sem CRM<input type="checkbox" checked={showFora} onChange={e => setShowFora(e.target.checked)} /></label>
            <label className="row2">Arquivadas ({archived.length})<input type="checkbox" checked={showArchived} onChange={e => setShowArchived(e.target.checked)} /></label>
            <label className="row2">Minimapa<input type="checkbox" checked={prefs.mini} onChange={e => setPrefs(p => ({ ...p, mini: e.target.checked }))} /></label>
            <div className="sec">JANELA</div><div className="row2" style={{ color: '#64748b' }}>Números dos últimos 90 dias · dados até {dataUntil}</div>
          </>)}
          {menu.kind === 'alert' && (
            <div style={{ padding: '6px 8px', maxWidth: 340, fontSize: 13, lineHeight: 1.45 }}>
              <b>{k.drift} campanhas declaradas ativas não aparecem nos disparos recentes.</b>{driftByPillar[0]?.n ? ` A maior concentração está em ${driftByPillar[0].p.title} (${driftByPillar[0].n}).` : ''} Confira se a campanha parou ou se falta ligar o dado.
              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}><button className="cs-btn" style={{ width: 'auto' }} onClick={() => { setMenu(null); setFilters({ ...emptyFilters(), quick: 'drift' }); }}><Inbox />Ver as {k.drift}</button></div>
            </div>
          )}
          {menu.kind === 'more' && (<>
            <button onClick={() => { setMenu(null); void reload(); }}>Recarregar quadro</button>
            <button onClick={() => { setMenu(null); vp.fit(); }}>Ajustar à tela</button>
            <button onClick={() => { setMenu(null); setPrefs(p => ({ ...p, legend: { ...p.legend, docked: true }, collapsed: [] })); }}>Restaurar disposição</button>
          </>)}
        </div>
      )}

      {drawer && (
        <StructureDrawer
          mode={drawer.mode} card={drawerCard} signal={drawerCard ? sig(drawerCard.id) : null} lanes={laneOptions} createLaneId={drawer.mode === 'create' ? drawer.laneId : null}
          rows={rows} today={today} dataUntil={dataUntil} editable={editable} onClose={() => setDrawer(null)}
          onPrev={drawerIdx > 0 ? () => setDrawer({ mode: 'view', id: visible[drawerIdx - 1].id }) : undefined}
          onNext={drawerIdx >= 0 && drawerIdx < visible.length - 1 ? () => setDrawer({ mode: 'view', id: visible[drawerIdx + 1].id }) : undefined}
          onSave={(card, body, label) => mutateCard(card, body, label).catch(e => { fail(e); throw new Error(friendlyError(e)); })}
          onCreate={body => createCard(body).catch(e => { throw new Error(friendlyError(e)); })}
        />
      )}
      {toast && <div className="cs-toast"><span>{toast.text}</span>{toast.undo && <button onClick={() => { const u = toast.undo; setToast(null); void u?.(); }}>Desfazer</button>}</div>}
      {hasFilters(filters) && visible.length === 0 && <div className="cs-toast" style={{ bottom: 70 }}>Nenhuma campanha com estes filtros.</div>}
    </div>
  );
}
