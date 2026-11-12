import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type React from 'react';
import {
  ArrowDownUp, CalendarArrowUp, CalendarDays, CornerDownRight, CreditCard, Database, FolderInput, FolderKanban, Layers, Pencil, Plus,
  Presentation, Rows3, Search, Send, Settings2, Trash2,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { toLocalPx } from '../../../context/UIScaleContext';
import { BoardMiniMap, BoardZoomBar, useBoardChrome } from '../structure/BoardNav';
import { useBoardViewport } from '../structure/useBoardViewport';
import '../structure/structure.css';
import './daily.css';
import {
  FALLBACK_COLOR, WEEKDAYS, addDays, brDate, crmForDay, emptyDailyFilters, entryVisible, fmtInt, friendlyDailyError, groupEntries, monthEnd,
  monthKey, monthStart, nextWorkday, previousMonthKey, projectMonthStats, recentProjects, saoPauloToday, toggleIsolate, weekRange, weekday,
  type B2cDay, type CrmCell, type DailyEntry, type DailyFilters, type DailyFrente, type DailyGroup, type DailyPartner, type DailyProject,
  type DailySort, type DailyTag, type DailyView, type FilterKey,
} from './dailyModel';
import {
  loadB2c, loadCrm, loadDailyConfig, loadEarliestDay, loadEntries, loadFreshness, mergeProjects, saveEntry, saveOption, saveProject,
  type DailyLoad,
} from './dailyService';
import { DailyCalendar, type DayMetric } from './DailyCalendar';
import { DailyEntries, type Draft } from './DailyEntries';
import { DailyProjectDrawer } from './DailyProjectDrawer';
import { DailyConfigModal, type ConfigTab } from './DailyConfigModal';
import { DayPicker, MenuList, MultiFilter, PeoplePicker, Popover, ProjectPicker, TagPicker, anchorOf, type Anchor, type FilterOption } from './DailyPopovers';

interface Prefs { metric: DayMetric; compact: boolean; mini: boolean; group: DailyGroup; sort: DailySort; view: DailyView }
const PREFS_KEY = 'gaas.visao-daily.prefs';
const DEFAULT_PREFS: Prefs = { metric: 'b2c', compact: false, mini: true, group: 'day', sort: 'desc', view: 'all' };
const readPrefs = (): Prefs => { try { return { ...DEFAULT_PREFS, ...JSON.parse(localStorage.getItem(PREFS_KEY) || '{}') }; } catch { return DEFAULT_PREFS; } };

type Pop =
  | { kind: 'filter'; key: FilterKey; anchor: Anchor } | { kind: 'sort'; anchor: Anchor } | { kind: 'group'; anchor: Anchor }
  | { kind: 'project' | 'tag' | 'people' | 'menu' | 'move'; entryId: string; anchor: Anchor } | { kind: 'add'; day: string; anchor: Anchor };
type Toast = { text: string; undo?: () => Promise<void> } | null;
const FILTER_LABELS: [FilterKey, string][] = [['frentes', 'Frente'], ['projects', 'Projeto'], ['partners', 'Parceiro'], ['people', 'Pessoa'], ['tags', 'Tag']];

export function DailyWorkspace() {
  const { user } = useAuth();
  const me = user?.id ?? null;
  const today = useMemo(saoPauloToday, []);
  const [cfg, setCfg] = useState<DailyLoad | null>(null);
  const [loadError, setLoadError] = useState('');
  const [ym, setYm] = useState({ y: Number(today.slice(0, 4)), m: Number(today.slice(5, 7)) });
  const [selected, setSelected] = useState(today);
  const [byMonth, setByMonth] = useState<Record<string, DailyEntry[]>>({});
  const [b2c, setB2c] = useState<Map<string, B2cDay>>(new Map());
  const [crm, setCrm] = useState<Map<string, CrmCell[]>>(new Map());
  const loaded = useRef(new Set<string>());
  const [listMonths, setListMonths] = useState<string[]>([monthKey(today)]);
  const [earliest, setEarliest] = useState<string | null>(null);
  const [fresh, setFresh] = useState<{ b2c: string | null; crm: string | null }>({ b2c: null, crm: null });
  const [prefs, setPrefs] = useState<Prefs>(readPrefs);
  const [filters, setFilters] = useState<DailyFilters>(emptyDailyFilters);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [allCollapsed, setAllCollapsed] = useState(false);
  const [hoverProject, setHoverProject] = useState<string | null>(null);
  const [tip, setTip] = useState<{ day: string; x: number; y: number } | null>(null);
  const [pop, setPop] = useState<Pop | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [drawer, setDrawer] = useState<string | null>(null);
  const [drawerKey, setDrawerKey] = useState(0);
  const [config, setConfig] = useState<ConfigTab | null>(null);
  const [toast, setToast] = useState<Toast>(null);
  const [scrollTo, setScrollTo] = useState<{ day: string; key: number } | null>(null);
  const [present, setPresent] = useState(false);
  const [calHeight, setCalHeight] = useState(760);
  const rootRef = useRef<HTMLDivElement>(null);
  const calRef = useRef<HTMLDivElement>(null);
  const toastTimer = useRef<number>();
  const vp = useBoardViewport('gaas.visao-daily.view', Boolean(cfg));
  const mini = useBoardChrome(vp, { ready: Boolean(cfg), mini: prefs.mini && !present, deps: [prefs.compact, present] });

  useEffect(() => { try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); } catch { /* preferência local */ } }, [prefs]);
  const showToast = useCallback((text: string, undo?: () => Promise<void>) => {
    setToast({ text, undo }); window.clearTimeout(toastTimer.current); toastTimer.current = window.setTimeout(() => setToast(null), 5000);
  }, []);

  /* ---------- carga ---------- */
  const reloadConfig = useCallback(async () => {
    try { setCfg(await loadDailyConfig()); setLoadError(''); }
    catch { setLoadError('Não foi possível carregar a Visão Daily. Confira a conexão e tente de novo.'); }
  }, []);
  const ensureMonth = useCallback(async (mk: string, force = false) => {
    if (!force && loaded.current.has(mk)) return;
    loaded.current.add(mk);
    const [y, m] = mk.split('-').map(Number), start = monthStart(y, m), end = monthEnd(y, m);
    try {
      const [entries, b, c] = await Promise.all([loadEntries(start, end), loadB2c(start, end).catch(() => []), loadCrm(start, end).catch(() => [])]);
      setByMonth(prev => ({ ...prev, [mk]: entries }));
      setB2c(prev => { const n = new Map(prev); b.forEach(d => n.set(d.day, d)); return n; });
      setCrm(prev => { const n = new Map(prev); for (const k of [...n.keys()]) if (monthKey(k) === mk) n.delete(k); c.forEach(cell => n.set(cell.day, [...(n.get(cell.day) || []), cell])); return n; });
    } catch { loaded.current.delete(mk); showToast('Não foi possível carregar os registros desse mês.'); }
  }, [showToast]);
  useEffect(() => {
    void reloadConfig();
    void loadEarliestDay().then(setEarliest);
    void loadFreshness().then(setFresh).catch(() => undefined);
  }, [reloadConfig]);
  const calMonth = `${ym.y}-${String(ym.m).padStart(2, '0')}`;
  useEffect(() => { void ensureMonth(calMonth); }, [calMonth, ensureMonth]);
  useEffect(() => { listMonths.forEach(mk => void ensureMonth(mk)); }, [listMonths, ensureMonth]);
  const reloadEntries = useCallback(async () => {
    const months = [...loaded.current]; loaded.current.clear();
    await Promise.all(months.map(mk => ensureMonth(mk, true)));
    setDrawerKey(k => k + 1);
  }, [ensureMonth]);
  const fail = useCallback((e: unknown) => {
    showToast(friendlyDailyError(e));
    const msg = String((e as { message?: string })?.message || e);
    if (msg.includes('revision_conflict')) { void reloadConfig(); void reloadEntries(); }
  }, [reloadConfig, reloadEntries, showToast]);

  /* ---------- derivados ---------- */
  const projects = useMemo(() => new Map((cfg?.projects || []).map(p => [p.id, p])), [cfg]);
  const frentes = useMemo(() => new Map((cfg?.frentes || []).map(f => [f.key, f])), [cfg]);
  const partners = useMemo(() => new Map((cfg?.partners || []).map(p => [p.key, p])), [cfg]);
  const tags = useMemo(() => new Map((cfg?.tags || []).map(t => [t.key, t])), [cfg]);
  const people = useMemo(() => new Map((cfg?.people || []).map(p => [p.id, p])), [cfg]);
  const canEdit = Boolean(cfg?.canEdit);
  const all = useMemo(() => Object.values(byMonth).flat(), [byMonth]);
  const ctx = useMemo(() => ({ projects, filters, view: prefs.view, today, me }), [projects, filters, prefs.view, today, me]);
  const calendarEntries = useMemo(() => all.filter(e => entryVisible(e, ctx, true)), [all, ctx]);
  const inList = useMemo(() => all.filter(e => listMonths.includes(monthKey(e.day))), [all, listMonths]);
  const listEntries = useMemo(() => inList.filter(e => entryVisible(e, ctx)), [inList, ctx]);
  const frenteOrder = useMemo(() => (cfg?.frentes || []).map(f => f.key), [cfg]);
  const groups = useMemo(() => groupEntries(listEntries, prefs.group, prefs.sort, projects, frenteOrder), [listEntries, prefs.group, prefs.sort, projects, frenteOrder]);
  const prevMonth = useMemo(() => { const p = previousMonthKey(listMonths[listMonths.length - 1]); return earliest && p >= monthKey(earliest) ? p : null; }, [listMonths, earliest]);
  const projectColor = useCallback((id: string) => frentes.get(projects.get(id)?.frente_key || '')?.color || FALLBACK_COLOR, [frentes, projects]);
  const monthStats = useMemo(() => projectMonthStats(all, calMonth), [all, calMonth]);
  const monthB2c = useMemo(() => [...b2c.values()].filter(d => monthKey(d.day) === calMonth).reduce((a, d) => a + (d.emissions || 0), 0), [b2c, calMonth]);
  const monthCrm = useMemo(() => [...crm.entries()].filter(([d]) => monthKey(d) === calMonth).reduce((a, [, cells]) => a + (crmForDay(cells, cfg?.partners || [], filters.partners) || 0), 0), [crm, calMonth, cfg, filters.partners]);
  const monthFrentes = useMemo(() => new Set(monthStats.map(s => projects.get(s.projectId)?.frente_key).filter(Boolean)).size, [monthStats, projects]);

  useLayoutEffect(() => {
    const el = calRef.current; if (!el) return;
    const ro = new ResizeObserver(() => setCalHeight(el.offsetHeight)); ro.observe(el); return () => ro.disconnect();
  }, [cfg]);

  /* ---------- navegação ---------- */
  const goToDay = useCallback((day: string) => {
    setSelected(day);
    setPrefs(p => {
      const [ws, we] = weekRange(today);
      const keep = p.view === 'all' || p.view === 'mine' || (p.view === 'today' && day === today) || (p.view === 'week' && day >= ws && day <= we);
      return { ...p, group: 'day', view: keep ? p.view : 'all' };
    });
    const mk = monthKey(day);
    setListMonths(prev => {
      if (prev.includes(mk)) return prev;
      const out = [...prev];
      if (mk > out[0]) { let k = out[0]; while (k < mk) { k = nextMonthKey(k); out.unshift(k); } }
      else { let k = out[out.length - 1]; while (k > mk) { k = previousMonthKey(k); out.push(k); } }
      return out;
    });
    setCollapsed(c => ({ ...c, [day]: false }));
    setScrollTo({ day, key: Date.now() });
  }, [today]);
  const moveMonth = (delta: number | 'today') => {
    if (delta === 'today') { setYm({ y: Number(today.slice(0, 4)), m: Number(today.slice(5, 7)) }); goToDay(today); return; }
    setYm(({ y, m }) => { const t = m + delta; return { y: y + Math.floor((t - 1) / 12), m: ((t - 1) % 12 + 12) % 12 + 1 }; });
  };

  /* ---------- mutações ---------- */
  const putEntry = useCallback((saved: DailyEntry) => setByMonth(prev => {
    const next: Record<string, DailyEntry[]> = {};
    for (const [k, list] of Object.entries(prev)) next[k] = list.filter(e => e.id !== saved.id);
    if (!saved.deleted_at) { const mk = monthKey(saved.day); next[mk] = [...(next[mk] || []), saved]; }
    return next;
  }), []);
  const patchEntry = useCallback(async (e: DailyEntry, body: Record<string, unknown>, label: string) => {
    const raw = e as unknown as Record<string, unknown>;
    const before = Object.fromEntries(Object.keys(body).map(k => [k, raw[k]]));
    try {
      const saved = await saveEntry(e.id, e.revision, body);
      putEntry(saved); setDrawerKey(k => k + 1);
      showToast(label, async () => { try { putEntry(await saveEntry(saved.id, saved.revision, before)); setToast(null); setDrawerKey(k => k + 1); } catch (err) { fail(err); } });
    } catch (err) { fail(err); }
  }, [fail, putEntry, showToast]);
  const deleteEntry = useCallback(async (e: DailyEntry) => {
    try {
      putEntry(await saveEntry(e.id, e.revision, { deleted: true }));
      showToast('Registro excluído', async () => {
        try { putEntry(await saveEntry(null, null, { day: e.day, project_id: e.project_id, body: e.body, tag_keys: e.tag_keys, responsible_id: e.responsible_id, follower_ids: e.follower_ids, position: e.position })); setToast(null); }
        catch (err) { fail(err); }
      });
    } catch (err) { fail(err); }
  }, [fail, putEntry, showToast]);
  const createEntry = useCallback(async (d: Draft, text: string) => {
    try {
      const saved = await saveEntry(null, null, { day: d.day, project_id: d.projectId, body: text, responsible_id: me, follower_ids: [] });
      putEntry(saved); setDraft(null); goToDay(saved.day); setDrawerKey(k => k + 1); showToast('Registro salvo');
    } catch (err) { fail(err); }
  }, [fail, goToDay, me, putEntry, showToast]);
  const putProject = (saved: DailyProject) => setCfg(c => c && { ...c, projects: c.projects.some(p => p.id === saved.id) ? c.projects.map(p => (p.id === saved.id ? saved : p)) : [...c.projects, saved] });
  const createProject = useCallback(async (name: string): Promise<string | null> => {
    const frente = cfg?.frentes.find(f => !f.archived);
    if (!frente) { showToast('Crie uma frente antes do primeiro projeto.'); setConfig('frente'); return null; }
    try { const saved = await saveProject(null, null, { name, frente_key: frente.key }); putProject(saved); showToast(`Projeto criado em ${frente.name}. Troque a frente na página do projeto.`); return saved.id; }
    catch (err) { fail(err); return null; }
  }, [cfg, fail, showToast]);
  const saveProjectProps = useCallback(async (p: DailyProject | null, body: Record<string, unknown>) => {
    try { putProject(await saveProject(p?.id ?? null, p?.revision ?? null, body)); }
    catch (err) { fail(err); }
  }, [fail]);
  const merge = useCallback(async (from: DailyProject, into: DailyProject) => {
    try { const r = await mergeProjects(from.id, into.id); await reloadConfig(); await reloadEntries(); showToast(`${r.moved} registros passaram para ${into.name}`); }
    catch (err) { fail(err); }
  }, [fail, reloadConfig, reloadEntries, showToast]);
  const saveOpt = useCallback(async (kind: 'frente' | 'partner' | 'tag', key: string | null, body: Record<string, unknown>): Promise<string | null> => {
    try {
      const saved = await saveOption<DailyFrente | DailyPartner | DailyTag>(kind, key, body);
      const field = kind === 'frente' ? 'frentes' : kind === 'partner' ? 'partners' : 'tags';
      setCfg(c => {
        if (!c) return c;
        const list = c[field] as (DailyFrente | DailyPartner | DailyTag)[];
        const next = list.some(x => x.key === saved.key) ? list.map(x => (x.key === saved.key ? saved : x)) : [...list, saved];
        return { ...c, [field]: next };
      });
      return saved.key;
    } catch (err) { fail(err); return null; }
  }, [fail]);

  /* ---------- popovers ---------- */
  const entryOf = (id: string) => all.find(e => e.id === id);
  const openAdd = (day: string, el: HTMLElement, projectId?: string) => {
    if (!canEdit) return;
    if (projectId) { setDraft({ day, projectId }); return; }
    setPop({ kind: 'add', day, anchor: anchorOf(el) });
  };
  const filterOptions = (key: FilterKey): FilterOption[] => {
    if (key === 'frentes') return (cfg?.frentes || []).filter(f => !f.archived).map(f => ({ key: f.key, label: f.name, color: f.color }));
    if (key === 'projects') return (cfg?.projects || []).filter(p => !p.archived).map(p => ({ key: p.id, label: p.name, color: projectColor(p.id) }));
    if (key === 'partners') return (cfg?.partners || []).filter(p => !p.archived).map(p => ({ key: p.key, label: p.name, color: p.color }));
    if (key === 'people') return (cfg?.people || []).map(p => ({ key: p.id, label: p.name + (p.id === me ? ' (você)' : ''), color: '#0e7490' }));
    return (cfg?.tags || []).filter(t => !t.archived).map(t => ({ key: t.key, label: '#' + t.name, color: t.color }));
  };
  const filterLabels = useMemo(() => FILTER_LABELS.map(([key, label]) => ({
    key, label, names: new Map<string, string>(key === 'frentes' ? [...frentes.values()].map(f => [f.key, f.name]) : key === 'projects' ? [...projects.values()].map(p => [p.id, p.name])
      : key === 'partners' ? [...partners.values()].map(p => [p.key, p.name]) : key === 'people' ? [...people.values()].map(p => [p.id, p.name]) : [...tags.values()].map(t => [t.key, '#' + t.name])),
  })), [frentes, projects, partners, people, tags]);

  const renderPop = () => {
    if (!pop || !cfg) return null;
    const close = () => setPop(null);
    if (pop.kind === 'filter') {
      return <Popover anchor={pop.anchor} onClose={close}><MultiFilter label={FILTER_LABELS.find(f => f[0] === pop.key)![1]} options={filterOptions(pop.key)} selected={filters[pop.key]}
        onToggle={k => setFilters(f => ({ ...f, [pop.key]: f[pop.key].includes(k) ? f[pop.key].filter(x => x !== k) : [...f[pop.key], k] }))} onClear={() => setFilters(f => ({ ...f, [pop.key]: [] }))} /></Popover>;
    }
    if (pop.kind === 'sort') return <Popover anchor={pop.anchor} width={230} onClose={close}><MenuList items={([['desc', 'Mais recentes primeiro'], ['asc', 'Mais antigos primeiro']] as [DailySort, string][]).map(([k, l]) => ({ icon: <ArrowDownUp />, label: l, current: prefs.sort === k, onClick: () => { setPrefs(p => ({ ...p, sort: k })); close(); } }))} /></Popover>;
    if (pop.kind === 'group') {
      return <Popover anchor={pop.anchor} width={260} onClose={close}><MenuList title="Agrupar registros" items={([['day', 'Dia', 'Como a daily acontece', <CalendarDays key="d" />], ['project', 'Projeto', 'A evolução de cada projeto no tempo', <FolderKanban key="p" />], ['frente', 'Frente', 'Tudo de uma frente junto', <Layers key="f" />]] as [DailyGroup, string, string, React.ReactNode][])
        .map(([k, l, h, i]) => ({ icon: i, label: l, hint: h, current: prefs.group === k, onClick: () => { setPrefs(p => ({ ...p, group: k })); setCollapsed({}); close(); } }))} /></Popover>;
    }
    if (pop.kind === 'add') {
      return <Popover anchor={pop.anchor} width={300} onClose={close}><ProjectPicker projects={cfg.projects} frentes={frentes} recent={recentProjects(all, pop.day)}
        onPick={id => { setDraft({ day: pop.day, projectId: id }); close(); }}
        onCreate={async name => { const id = await createProject(name); if (id) setDraft({ day: pop.day, projectId: id }); close(); }}
        onConfig={() => { close(); setConfig('project'); }} /></Popover>;
    }
    const e = entryOf(pop.entryId); if (!e) return null;
    if (pop.kind === 'project') {
      return <Popover anchor={pop.anchor} width={300} onClose={close}><ProjectPicker projects={cfg.projects} frentes={frentes} recent={recentProjects(all, e.day)} current={e.project_id}
        onPick={id => { close(); if (id !== e.project_id) void patchEntry(e, { project_id: id }, `Movido para ${projects.get(id)?.name}`); }}
        onCreate={async name => { close(); const id = await createProject(name); if (id) void patchEntry(e, { project_id: id }, `Movido para ${name}`); }}
        onConfig={() => { close(); setConfig('project'); }} /></Popover>;
    }
    if (pop.kind === 'tag') {
      return <Popover anchor={pop.anchor} width={260} onClose={close}><TagPicker tags={cfg.tags} selected={e.tag_keys}
        onToggle={k => void patchEntry(e, { tag_keys: e.tag_keys.includes(k) ? e.tag_keys.filter(x => x !== k) : [...e.tag_keys, k] }, 'Tags atualizadas')}
        onCreate={async name => { const k = await saveOpt('tag', null, { name }); if (k) void patchEntry(e, { tag_keys: [...e.tag_keys, k] }, `Tag #${name} criada`); }}
        onConfig={() => { close(); setConfig('tag'); }} /></Popover>;
    }
    if (pop.kind === 'people') {
      return <Popover anchor={pop.anchor} width={330} onClose={close}><PeoplePicker people={cfg.people} me={me} responsible={e.responsible_id} followers={e.follower_ids} subject={e.body}
        onChange={(r, f) => void patchEntry(e, { responsible_id: r, follower_ids: f }, 'Pessoas atualizadas')} /></Popover>;
    }
    if (pop.kind === 'move') {
      return <Popover anchor={pop.anchor} width={260} onClose={close}><DayPicker value={e.day} title="Mover para o dia" shortcuts={[['Hoje', today], ['Próximo dia útil', nextWorkday(e.day)], ['+1 semana', addDays(e.day, 7)]]}
        onPick={day => { close(); if (day !== e.day) { void patchEntry(e, { day }, `Movido para ${brDate(day)}`); goToDay(day); } }} /></Popover>;
    }
    return (
      <Popover anchor={pop.anchor} width={250} onClose={close}>
        <MenuList items={[
          { icon: <Pencil />, label: 'Editar texto', onClick: () => { close(); window.setTimeout(() => (document.querySelector(`[data-entry="${e.id}"] .txt`) as HTMLElement | null)?.click(), 0); } },
          { icon: <FolderInput />, label: 'Mover para outro projeto', onClick: () => setPop({ kind: 'project', entryId: e.id, anchor: pop.anchor }) },
          { icon: <CalendarArrowUp />, label: 'Mudar o dia', onClick: () => setPop({ kind: 'move', entryId: e.id, anchor: pop.anchor }) },
          { icon: <CornerDownRight />, label: 'Continuar no próximo dia útil', onClick: () => { close(); setDraft({ day: nextWorkday(e.day), projectId: e.project_id }); } },
          { icon: <FolderKanban />, label: 'Abrir projeto', onClick: () => { close(); setDrawer(e.project_id); } },
          { icon: <Trash2 />, label: 'Excluir registro', danger: true, onClick: () => { close(); void deleteEntry(e); } },
        ]} />
      </Popover>
    );
  };

  /* ---------- apresentação ---------- */
  useEffect(() => {
    const onFs = () => { if (!document.fullscreenElement) setPresent(false); };
    document.addEventListener('fullscreenchange', onFs); return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);
  const togglePresent = () => {
    const next = !present; setPresent(next);
    if (next && rootRef.current?.requestFullscreen) void rootRef.current.requestFullscreen().catch(() => undefined);
    if (!next && document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
    window.setTimeout(() => vp.fit(), 120);
  };

  if (loadError) return <div className="cs-root" style={{ padding: 24, fontSize: 14 }}>{loadError} <button className="cs-btn" onClick={() => void reloadConfig()}>Tentar de novo</button></div>;

  const tipEntries = tip ? calendarEntries.filter(e => e.day === tip.day) : [];
  const tipByProject = tipEntries.reduce<Map<string, DailyEntry[]>>((m, e) => m.set(e.project_id, [...(m.get(e.project_id) || []), e]), new Map());
  const freshLabel = `B2C ${fresh.b2c ? brDate(fresh.b2c) : 'n/d'} · CRM ${fresh.crm ? brDate(fresh.crm) : 'n/d'}`;

  return (
    <div ref={rootRef} className={`cs-root${present ? ' dv-present' : ''}`} style={present ? { height: '100vh', display: 'flex', flexDirection: 'column' } : undefined}>
      <div className="cs-bar">
        <h2>Visão Daily</h2>
        <span className="cs-sep" />
        <span className="cs-stat" title="Emissões totais B2C no mês do calendário (originação)"><CreditCard /><b>{fmtInt(monthB2c)}</b><span className="lb">emissões B2C</span></span>
        <span className="cs-stat" title="Cartões gerados pelos disparos CRM no mês do calendário"><Send /><b>{fmtInt(monthCrm)}</b><span className="lb">CRM</span></span>
        <span className="cs-stat"><FolderKanban /><b>{monthStats.length}</b><span className="lb">projetos no mês</span></span>
        <span className="cs-stat"><Layers /><b>{monthFrentes}</b><span className="lb">frentes</span></span>
        <span className="cs-stat dv-hide-present" title="Última data com dado em cada fonte"><Database />{freshLabel}</span>
        <span className="cs-grow" />
        {cfg && !canEdit && <span className="cs-readonly">Somente leitura</span>}
        <label className="cs-search dv-hide-present"><Search size={14} /><input type="search" placeholder="Buscar projeto ou registro" value={filters.q} onChange={e => setFilters(f => ({ ...f, q: e.target.value }))} /></label>
        <button className="cs-btn" onClick={togglePresent}><Presentation />{present ? 'Sair da apresentação' : 'Apresentar'}</button>
        {canEdit && <button className="cs-btn pri dv-hide-present" onClick={e => openAdd(today, e.currentTarget)}><Plus />Registro de hoje</button>}
      </div>

      <div ref={vp.canvasRef} className={`cs-canvas${vp.panning ? ' panning' : ''}`} style={{ backgroundColor: '#f4f1ea', ...vp.gridStyle, ...(present ? { flex: 1 } : {}) }} {...vp.handlers}>
        <div ref={vp.stageRef} className="cs-stage dv-stage" style={{ transform: `translate(${Math.round(vp.view.x)}px,${Math.round(vp.view.y)}px) scale(${vp.view.z})` }}>
          <section className="dv-P dv-leg" style={{ ['--pacc' as string]: '#64748b' }} data-nopan data-mini="#94a3b8">
            <h5><FolderKanban />Projetos do mês
              <button className="dv-ib sm" style={{ marginLeft: 'auto' }} title="Configurar projetos, frentes, parceiros e tags" onClick={() => setConfig('project')}><Settings2 /></button>
            </h5>
            <div className="dv-hint">Clique isola · Shift+clique soma · número = dias com registro</div>
            {!cfg ? <div className="dv-empty">Carregando…</div> : !cfg.frentes.length ? (
              <div className="dv-empty">Ainda não há frentes. <button className="dv-link" onClick={() => setConfig('frente')}>Configurar frentes</button></div>
            ) : monthStats.length ? monthStats.map(s => {
              const pr = projects.get(s.projectId); if (!pr) return null;
              const on = filters.projects.includes(s.projectId), off = filters.projects.length > 0 && !on;
              return (
                <button key={s.projectId} className={`dv-lg${on ? ' on' : off ? ' off' : ''}`} onMouseEnter={() => setHoverProject(s.projectId)} onMouseLeave={() => setHoverProject(null)}
                  onClick={e => setFilters(f => ({ ...f, projects: toggleIsolate(f.projects, s.projectId, e.shiftKey || e.ctrlKey || e.metaKey) }))}>
                  <span className="dv-sw" style={{ background: projectColor(s.projectId) }} />
                  <span style={{ minWidth: 0 }}><b>{pr.name}</b><span className="s">último registro {brDate(s.last)}</span></span>
                  <span className="c">{s.days}d</span>
                </button>
              );
            }) : <div className="dv-empty">Nenhum registro neste mês.</div>}
            {cfg && cfg.frentes.length > 0 && <div className="dv-sec">Frentes</div>}
            {cfg?.frentes.filter(f => !f.archived).map(f => {
              const n = new Set(monthStats.filter(s => projects.get(s.projectId)?.frente_key === f.key).map(s => s.projectId)).size;
              const on = filters.frentes.includes(f.key), off = filters.frentes.length > 0 && !on;
              return (
                <button key={f.key} className={`dv-lg${on ? ' on' : off ? ' off' : ''}`} onClick={e => setFilters(x => ({ ...x, frentes: toggleIsolate(x.frentes, f.key, e.shiftKey || e.ctrlKey || e.metaKey) }))}>
                  <span className="dv-sw" style={{ background: f.color, borderRadius: 999 }} /><b>{f.name}</b><span className="c">{n} proj.</span>
                </button>
              );
            })}
          </section>

          <div ref={calRef}>
            <DailyCalendar y={ym.y} m={ym.m} today={today} selected={selected} entries={calendarEntries} projects={projects} frentes={frentes}
              partners={cfg?.partners || []} partnerFilter={filters.partners} b2c={b2c} crm={crm} metric={prefs.metric} compact={prefs.compact} hoverProject={hoverProject}
              onMonth={moveMonth} onMetric={metric => { setPrefs(p => ({ ...p, metric })); if (metric === 'b2c') setFilters(f => ({ ...f, partners: [] })); }}
              onSelectDay={goToDay} onHoverProject={setHoverProject}
              onHoverDay={(day, e) => setTip(day && e ? { day, x: toLocalPx(e.clientX), y: toLocalPx(e.clientY) } : null)} />
          </div>

          <div style={{ height: calHeight, display: 'flex' }}>
            <DailyEntries groups={groups} group={prefs.group} sort={prefs.sort} view={prefs.view} filters={filters} shown={listEntries.length} total={inList.length}
              monthsLoaded={listMonths} prevMonth={prevMonth} isCollapsed={k => (collapsed[k] !== undefined ? collapsed[k] : allCollapsed)} today={today} canEdit={canEdit} draft={draft}
              projects={projects} frentes={frentes} partners={partners} tags={tags} people={people} b2c={b2c} filterLabels={filterLabels}
              scrollToDay={scrollTo?.day || null} flashKey={scrollTo?.key || 0}
              onView={view => setPrefs(p => ({ ...p, view }))} onFilterPop={(key, el) => setPop({ kind: 'filter', key, anchor: anchorOf(el) })}
              onRemoveFilter={(key, v) => setFilters(f => ({ ...f, [key]: f[key].filter(x => x !== v) }))} onClear={() => setFilters(emptyDailyFilters())}
              onSortPop={el => setPop({ kind: 'sort', anchor: anchorOf(el) })} onGroupPop={el => setPop({ kind: 'group', anchor: anchorOf(el) })}
              onToggle={k => setCollapsed(c => ({ ...c, [k]: !(c[k] !== undefined ? c[k] : allCollapsed) }))}
              onAll={c => { setAllCollapsed(c); setCollapsed({}); }} onMore={() => prevMonth && setListMonths(m => [...m, prevMonth])}
              onAdd={openAdd} onDraftSave={text => draft && void createEntry(draft, text)} onDraftCancel={() => setDraft(null)}
              onEditBody={(e, text) => void patchEntry(e, { body: text }, 'Registro atualizado')}
              onProjectPop={(e, el) => setPop({ kind: 'project', entryId: e.id, anchor: anchorOf(el) })}
              onTagPop={(e, el) => setPop({ kind: 'tag', entryId: e.id, anchor: anchorOf(el) })}
              onRemoveTag={(e, k) => void patchEntry(e, { tag_keys: e.tag_keys.filter(x => x !== k) }, 'Tag removida')}
              onPeoplePop={(e, el) => setPop({ kind: 'people', entryId: e.id, anchor: anchorOf(el) })}
              onMenu={(e, el) => setPop({ kind: 'menu', entryId: e.id, anchor: anchorOf(el) })}
              onContinue={e => setDraft({ day: nextWorkday(e.day), projectId: e.project_id })}
              onOpenProject={setDrawer} onHoverProject={setHoverProject} />
          </div>
        </div>
        <BoardZoomBar vp={vp} showMini={prefs.mini} onToggleMini={() => setPrefs(p => ({ ...p, mini: !p.mini }))}>
          <button className={`cs-zb${prefs.compact ? ' on' : ''}`} title="Células mais baixas" onClick={() => setPrefs(p => ({ ...p, compact: !p.compact }))}><Rows3 />Compacto</button>
        </BoardZoomBar>
        {prefs.mini && !present && <BoardMiniMap vp={vp} mini={mini} />}
      </div>

      {tip && tipByProject.size > 0 && (
        <div className="dv-tip" style={{ left: tip.x + 14, top: tip.y + 14 }}>
          <div className="h">{WEEKDAYS[weekday(tip.day)]}, {brDate(tip.day)} · {tipByProject.size} {tipByProject.size === 1 ? 'projeto' : 'projetos'}</div>
          {[...tipByProject.entries()].map(([pid, list]) => (
            <div key={pid}>
              <div className="p"><span className="dv-sw" style={{ background: projectColor(pid) }} />{projects.get(pid)?.name}</div>
              {list.map(e => <div key={e.id} className="e">{e.body}</div>)}
            </div>
          ))}
        </div>
      )}
      {renderPop()}
      {drawer && projects.get(drawer) && cfg && (
        <DailyProjectDrawer project={projects.get(drawer)!} frentes={cfg.frentes} partners={cfg.partners} people={people} canEdit={canEdit} refreshKey={drawerKey}
          onSave={body => saveProjectProps(projects.get(drawer)!, body)} onClose={() => setDrawer(null)}
          onAddToday={() => { setDraft({ day: today, projectId: drawer }); setDrawer(null); }}
          onOpenWiki={note => window.open(`${window.location.pathname}?view=learning&section=vault&wiki_path=${encodeURIComponent(note)}`, '_blank', 'noopener')} />
      )}
      {config && cfg && (
        <DailyConfigModal tab={config} projects={cfg.projects} frentes={cfg.frentes} partners={cfg.partners} tags={cfg.tags} canEdit={canEdit}
          onTab={setConfig} onClose={() => setConfig(null)} onSaveProject={saveProjectProps} onMerge={merge}
          onSaveOption={async (kind, key, body) => { await saveOpt(kind, key, body); }} />
      )}
      {toast && <div className="cs-toast">{toast.text}{toast.undo && <button onClick={() => void toast.undo?.()}>Desfazer</button>}</div>}
    </div>
  );
}

function nextMonthKey(key: string): string { const [y, m] = key.split('-').map(Number); return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`; }
