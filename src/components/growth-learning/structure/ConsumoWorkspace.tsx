import { useCallback, useEffect, useMemo, useState } from 'react';
import type React from 'react';
import {
  ArrowDownRight, Bell, CalendarDays, ChartColumn, ChartLine, Check, ChevronDown, ChevronRight, Info, Link2Off, Mail, Maximize2, MessageCircle, MessageSquare,
  Minimize2, PanelLeftClose, PanelLeftOpen, Receipt, Route, SlidersHorizontal, Table, TrendingUp, TriangleAlert, X,
} from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { loadStructure, type StructureBoard } from './structureService';
import { friendlyError } from './structureModel';
import { loadConsumo, saveGoal, type ConsumoData } from './consumoService';
import {
  CHS, CH_COLOR, CH_LABEL, CH_OF, FORA, NO_FRONT, RAW_COLOR, RAW_LABEL, TONE_COLOR, addAgg, addDays, aggregate, buildModel, ddmm, emptyAgg, fmtPct, fmtVol,
  goalPlan, itemAgg, metrics, monthLabel, monthlyProjection, periodFractions, planFor, presets, status, sum,
  type Agg, type Ch, type ConsumoModel, type Dispatch, type ItemDef, type Metrics, type Period, type PillarDef, type RawCh, type Tone,
} from './consumoModel';
import { JourneyMap, type MapStats } from './JourneyMap';
import { useBoardViewport } from './useBoardViewport';
import { BoardMiniMap, BoardZoomBar, useBoardChrome } from './BoardNav';
import { CumulativeLines, KpiStrip, MonthColumns, PanelHead, ProjCell, SaldoCell } from './ConsumoPanels';
import './structure.css';
import './consumo.css';

const RAW_ICON: Record<RawCh, typeof Mail> = { EMAIL: Mail, PUSH: Bell, WPP: MessageCircle, SMS: MessageSquare };
const TONE_ICON: Partial<Record<Tone, typeof Check>> = { ok: Check, bad: TriangleAlert, warn: TrendingUp, info: ArrowDownRight };
const WEEK = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
type Focus = { pillar: string; front: string | null } | null;

function Stamp({ tone, text }: { tone: Tone; text: string }) {
  const Icon = TONE_ICON[tone];
  return <span className={`cz-st ${tone}`}>{Icon && <Icon />}{text}</span>;
}
function UsoCell({ x, empty }: { x: Metrics; empty?: string }) {
  if (x.uso == null) return <span className="cz-muted">{empty || ''}</span>;
  const [tone] = status(x);
  return <span className="cz-uso"><span className="tr"><span style={{ width: `${Math.min(100, (x.uso / 1.5) * 100)}%`, background: TONE_COLOR[tone] }} /><i /></span><b>{fmtPct(x.uso)}</b></span>;
}
function Spark({ values, color }: { values: number[]; color: string }) {
  const w = 56, h = 20, mx = Math.max(...values), mn = Math.min(...values);
  const pts = values.map((y, i) => [(i * w) / Math.max(1, values.length - 1), h - 3 - ((y - mn) / (mx - mn || 1)) * (h - 7)]);
  const line = pts.map(p => p.map(n => n.toFixed(1)).join(',')).join(' ');
  const l = pts[pts.length - 1]; const id = `cz-sp-${color.slice(1)}`;
  return (
    <svg className="cz-sp" width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={color} stopOpacity=".28" /><stop offset="1" stopColor={color} stopOpacity="0" /></linearGradient></defs>
      <polygon points={`0,${h} ${line} ${w},${h}`} fill={`url(#${id})`} />
      <polyline points={line} fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={l[0] - 1.5} cy={l[1]} r="2.4" fill="#fff" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}
function Timeline({ list, from, to }: { list: Dispatch[]; from: number; to: number }) {
  const W = 220, H = 16, span = Math.max(1, to - from);
  const per = new Map<number, { v: number; ch: RawCh }>();
  for (const d of list) { const p = per.get(d.day); per.set(d.day, { v: (p?.v || 0) + d.sent, ch: p?.ch || d.ch }); }
  const mx = Math.max(1, ...[...per.values()].map(p => p.v));
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
      <line x1="0" y1={H - 0.5} x2={W} y2={H - 0.5} stroke="#e7e2d6" />
      {[...per.entries()].map(([day, p]) => { const x = ((day - from) / span) * (W - 3) + 1.5; const hh = Math.max(3, Math.sqrt(p.v / mx) * (H - 2)); return <rect key={day} x={x - 1} y={H - hh} width="2" height={hh} fill={RAW_COLOR[p.ch]} />; })}
    </svg>
  );
}

export function ConsumoWorkspace({ modeSwitch }: { modeSwitch: React.ReactNode }) {
  const [board, setBoard] = useState<StructureBoard | null>(null);
  const [data, setData] = useState<ConsumoData | null>(null);
  const [error, setError] = useState('');
  const [ch, setCh] = useState<Ch | 'ALL'>('ALL');
  const [fronts, setFronts] = useState<Set<string>>(new Set());
  const [period, setPeriod] = useState<Period | null>(null);
  const [closed, setClosed] = useState<Set<string> | null>(null);
  const [closedFr, setClosedFr] = useState<Set<string> | null>(null);
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());
  const [openJ, setOpenJ] = useState<Set<string>>(new Set());
  const [showZero, setShowZero] = useState(false);
  const [focus, setFocus] = useState<Focus>(null);
  const [pop, setPop] = useState<'fr' | 'pe' | null>(null);
  const [drawer, setDrawer] = useState<string | null>(null);
  const [sub, setSub] = useState<'consumo' | 'mapa'>(() => { try { return localStorage.getItem('gaas.consumo-sfmc.sub') === 'mapa' ? 'mapa' : 'consumo'; } catch { return 'consumo'; } });
  const [mapStats, setMapStats] = useState<MapStats | null>(null);
  const onStats = useCallback((st: MapStats) => setMapStats(prev => (prev && JSON.stringify(prev) === JSON.stringify(st) ? prev : st)), []);
  useEffect(() => { try { localStorage.setItem('gaas.consumo-sfmc.sub', sub); } catch { /* preferência local */ } }, [sub]);
  const reloadData = useCallback(async () => { setData(await loadConsumo()); }, []);
  /* Visão geral no mesmo canvas do board: arrasta, Ctrl + zoom, minimapa. */
  const boardReady = Boolean(board && data) && sub === 'consumo';
  const vp = useBoardViewport('gaas.consumo-sfmc.view', boardReady);
  const [showMini, setShowMini] = useState(() => { try { return localStorage.getItem('gaas.consumo-sfmc.mini') !== '0'; } catch { return true; } });
  useEffect(() => { try { localStorage.setItem('gaas.consumo-sfmc.mini', showMini ? '1' : '0'); } catch { /* preferência local */ } }, [showMini]);
  const mini = useBoardChrome(vp, { ready: boardReady, mini: showMini, minZoom: 0.55 });
  useEffect(() => {
    if (!boardReady) return;
    const onKey = (e: KeyboardEvent) => {
      const a = document.activeElement as HTMLElement | null;
      if (e.ctrlKey || e.metaKey || (a && (/INPUT|TEXTAREA|SELECT/.test(a.tagName) || a.isContentEditable))) return;
      if (e.key === '+' || e.key === '=') vp.zoomAt(1.15); else if (e.key === '-') vp.zoomAt(1 / 1.15); else if (e.key === '0') vp.fit(); else if (e.key === 'm' || e.key === 'M') setShowMini(v => !v);
    };
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  }, [boardReady, vp]);

  const reload = useCallback(async () => {
    try { const [b, d] = await Promise.all([loadStructure(), loadConsumo()]); setBoard(b); setData(d); setError(''); }
    catch (e) { setError(friendlyError(e)); }
  }, []);
  useEffect(() => { void reload(); }, [reload]);
  useEffect(() => {
    if (!pop) return;
    const close = (e: PointerEvent) => { if (!(e.target as Element).closest('.cz-filt')) setPop(null); };
    window.addEventListener('pointerdown', close); return () => window.removeEventListener('pointerdown', close);
  }, [pop]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setPop(null); setDrawer(null); } };
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  }, []);

  const model = useMemo<ConsumoModel | null>(() => (board && data ? buildModel(board, data.rules, data.pillarFronts, data.plan, data.payload, data.journeyMap) : null), [board, data]);
  const allPresets = useMemo(() => (model ? presets(model) : []), [model]);
  const per: Period = period || (allPresets[0] ? { key: allPresets[0].key, from: allPresets[0].from, to: allPresets[0].to } : { key: 'contrato', from: 0, to: 0 });
  const aggs = useMemo(() => (model ? aggregate(model, per) : new Map<string, Agg>()), [model, per.from, per.to]); // eslint-disable-line react-hooks/exhaustive-deps
  const pf = useMemo(() => (model ? periodFractions(model, per.from, per.to) : []), [model, per.from, per.to]);
  const allFrontKeys = useMemo(() => (model ? model.pillars.filter(p => p.fronts.length > 1).flatMap(p => [...p.fronts, NO_FRONT].map(f => p.key + '|' + f)) : []), [model]);
  const isClosed = (k: string) => (closed ? closed.has(k) : true);
  const isClosedFr = (k: string) => (closedFr ? closedFr.has(k) : true);
  const chs: Ch[] = ch === 'ALL' ? CHS : [ch];
  const frOn = (f: string | null) => !fronts.size || fronts.has(f ?? NO_FRONT);
  const goals = data?.goals || [];
  const editable = Boolean(board?.isAdmin);

  if (error) return <div className="cz-root"><div className="cz-bar">{modeSwitch}</div><div className="cz-state"><p className="cz-err">{error}</p><button className="cz-btn" onClick={() => void reload()}>Tentar de novo</button></div></div>;
  if (!model || !data) return <div className="cz-root"><div className="cz-bar">{modeSwitch}</div><div className="cz-state">Carregando o consumo do SFMC…</div></div>;

  const isoOf = (day: number) => addDays(model.start, day);
  const perLabel = allPresets.find(p => p.key === per.key)?.label || `${ddmm(isoOf(per.from))} a ${ddmm(isoOf(per.to))}`;
  const itemFront = (p: PillarDef, it: ItemDef) => (it.front && p.fronts.includes(it.front) ? it.front : NO_FRONT);
  const itemVisible = (it: ItemDef) => frOn(it.front);
  const scope = (f: Focus) => model.pillars.filter(p => !f || p.key === f.pillar).map(p => ({
    p, fronts: (f?.front ? (f.front === NO_FRONT ? [] : [f.front]) : p.fronts).filter(frOn),
    items: p.items.filter(it => itemVisible(it) && (!f?.front || itemFront(p, it) === f.front)),
  }));
  const scopeData = (f: Focus, c: Ch[]) => {
    let plan = Array<number>(12).fill(0), a = emptyAgg();
    for (const s of scope(f)) { plan = plan.map((x, i) => x + planFor(model, s.fronts, c)[i]); for (const it of s.items) a = addAgg(a, itemAgg(aggs, it.key, c)); }
    return { plan, a };
  };

  /* ---------- canais ---------- */
  const chanRows = CHS.map(c => {
    const d = scopeData(focus, [c]); const x = metrics(d.plan, d.a, pf, model.rem);
    const expToday = sum(d.plan.map((v, i) => v * (periodFractions(model, 0, model.last)[i] || 0)));
    return { c, x, sofar: d.a.all, expToday };
  });

  /* ---------- gráficos: mês a mês e acumulado ---------- */
  const sd = scopeData(focus, chs);
  const lastIso = isoOf(model.last);
  const real = sd.a.m.map((v, i) => (model.months[i] <= lastIso ? v : null));
  const proj = monthlyProjection(model, sd.a.r30);
  const base = ch === 'ALL' ? '#1e293b' : CH_COLOR[ch];
  const labels = model.months.map(monthLabel);
  const nowIdx = model.months.reduce((k, m, i) => (m <= lastIso ? i : k), 0);
  const fullFrac = periodFractions(model, 0, model.last);
  const nowFrac = Math.max(0.05, Math.min(1, fullFrac[nowIdx] || 1));
  const sx = metrics(sd.plan, sd.a, pf, model.rem);
  let best = -1, bestR = 0;
  for (let i = 0; i < nowIdx; i++) { const r = sd.plan[i] ? (real[i] || 0) / sd.plan[i] : 0; if (r > bestR) { bestR = r; best = i; } }
  const futPlan = sd.plan.slice(nowIdx + 1), avgFut = futPlan.length ? sum(futPlan) / futPlan.length : 0;
  let worst = -1, wv = 0;
  sd.a.m.forEach((r, i) => { const p = sd.plan[i] * fullFrac[i]; if (fullFrac[i] > 0 && r - p > wv) { wv = r - p; worst = i; } });
  const projTot = sd.a.all + (sd.a.r30 / 30) * model.rem, planTot = sum(sd.plan);
  let breach = '';
  if (planTot > 0 && projTot > planTot) { let acc = sd.a.all; for (let i = 0; i < 12; i++) { acc += proj[i] || 0; if (proj[i] != null && acc > planTot) { breach = monthLabel(model.months[i]); break; } } }
  const insights: React.ReactNode[] = [];
  if (worst >= 0) insights.push(<span key="w">Maior desvio: <b>{monthLabel(model.months[worst])}</b>, {fmtVol(wv)} acima</span>);
  if (planTot === 0 && sd.a.all > 0) insights.push(<span key="s"><b className="cz-neg">Sem contrato</b> para este recorte</span>);
  else if (breach) insights.push(<span key="b">Estoura o contrato em <b className="cz-neg">{breach}</b></span>);
  else if (planTot > 0) insights.push(<span key="o">Sobra <b className="cz-pos">{fmtVol(planTot - projTot)}</b> em jul/27</span>);
  const focusLabel = focus ? (focus.front ? `${model.pillars.find(p => p.key === focus.pillar)?.title} · ${focus.front === NO_FRONT ? 'Sem frente' : focus.front}` : model.pillars.find(p => p.key === focus.pillar)?.title)
    : fronts.size ? (fronts.size === 1 ? [...fronts][0] : `${fronts.size} frentes`) : 'Todas as frentes';

  /* ---------- tabela ---------- */
  const rowsOut: React.ReactNode[] = [];
  let TP = Array<number>(12).fill(0), TA = emptyAgg(), nItems = 0;
  const isF = (p: string, f: string | null) => Boolean(focus && focus.pillar === p && focus.front === f);
  const focusBtn = (p: string, f: string | null) => (
    <button className={`cz-focus${isF(p, f) ? ' on' : ''}`} title="Ver no gráfico" onClick={e => { e.stopPropagation(); setFocus(isF(p, f) ? null : { pillar: p, front: f }); }}><ChartLine /></button>
  );
  const toggle = (set: Set<string> | null, all: string[], k: string, setter: (s: Set<string>) => void) => { const s = new Set(set ?? all); if (s.has(k)) s.delete(k); else s.add(k); setter(s); };
  const pillarKeys = model.pillars.map(p => p.key);

  for (const p of model.pillars) {
    const items = p.items.filter(itemVisible);
    const pfr = p.fronts.filter(frOn);
    if (!items.length && !pfr.length) continue;
    const plan = planFor(model, pfr, chs);
    let A = emptyAgg(); const iv = items.map(it => { const a = itemAgg(aggs, it.key, chs); A = addAgg(A, a); return { it, a }; });
    TP = TP.map((x, i) => x + plan[i]); TA = addAgg(TA, A);
    const x = metrics(plan, A, pf, model.rem); const pc = isClosed(p.key);
    const realItems = items.filter(i => !i.isGroup).length; nItems += items.length;
    const mixV = CHS.map(c => sum(items.map(it => itemAgg(aggs, it.key, [c]).real))); const mixT = sum(mixV);
    rowsOut.push(
      <div key={'p' + p.key} className={`cz-row pil${pc ? ' closed' : ''}${isF(p.key, null) ? ' sel' : ''}`} style={{ ['--acc' as string]: p.accent }} onClick={() => toggle(closed, pillarKeys, p.key, setClosed)}>
        <div className="cz-nm"><span className="cz-pic">{pc ? <PanelLeftOpen /> : <PanelLeftClose />}</span>{p.title}
          <span className="cz-pn" title={p.key === FORA ? `${items.length} grupos` : `${realItems} campanhas`}>{p.key === FORA ? items.length : realItems}</span>
          <span className="cz-pmix" title={mixT ? CHS.map((c, i) => `${CH_LABEL[c]} ${fmtPct(mixV[i] / mixT)}`).join(' · ') : 'Sem envio no período'}>{mixV.map((v, i) => (v ? <i key={i} style={{ flex: v, background: CH_COLOR[CHS[i]] }} /> : null))}</span>
          {focusBtn(p.key, null)}</div>
        <div>{fmtVol(x.tot)}</div><div><ProjCell x={x} /></div><div className="mu">{fmtVol(x.exp)}</div><div>{fmtVol(x.real)}</div><div><UsoCell x={x} empty="sem contrato" /></div><div><SaldoCell v={x.saldo} /></div><div className="st"><Stamp tone={status(x)[0]} text={status(x)[1]} /></div>
      </div>,
    );
    if (pc) continue;
    const pr = A.real || 1;
    iv.sort((a, b) => b.a.real - a.a.real || b.a.all - a.a.all);
    const groups: (string | null)[] = p.fronts.length > 1 ? [...pfr, ...(iv.some(v => itemFront(p, v.it) === NO_FRONT) && frOn(NO_FRONT) ? [NO_FRONT] : [])] : [null];
    for (const g of groups) {
      const gi = g ? iv.filter(v => itemFront(p, v.it) === g) : iv; const fk = p.key + '|' + g; const fc = g != null && isClosedFr(fk);
      if (g != null) {
        let ga = emptyAgg(); gi.forEach(v => { ga = addAgg(ga, v.a); });
        const w = metrics(g === NO_FRONT ? Array<number>(12).fill(0) : planFor(model, [g], chs), ga, pf, model.rem);
        rowsOut.push(
          <div key={'f' + fk} className={`cz-row fr${fc ? ' closed' : ''}${isF(p.key, g) ? ' sel' : ''}`} onClick={() => toggle(closedFr, allFrontKeys, fk, setClosedFr)}>
            <div className="cz-nm"><span className="cz-fbox"><ChevronDown className="cz-chev" />{g === NO_FRONT ? 'Sem frente no contrato' : g}<span className="cz-cpill">{gi.length}</span></span>{focusBtn(p.key, g)}</div>
            <div>{fmtVol(w.tot)}</div><div><ProjCell x={w} /></div><div className="mu">{fmtVol(w.exp)}</div><div>{fmtVol(w.real)}</div><div><UsoCell x={w} empty="sem contrato" /></div><div><SaldoCell v={w.saldo} /></div><div className="st"><Stamp tone={status(w)[0]} text={status(w)[1]} /></div>
          </div>,
        );
      }
      if (fc) continue;
      const zero = gi.filter(v => !v.a.real && !v.a.r30 && !goalPlan(goals, v.it.cardId, chs));
      for (const v of gi) {
        if (!showZero && zero.includes(v)) continue;
        const { it, a } = v; const gp = goalPlan(goals, it.cardId, chs); const y = metrics(gp, a, pf, model.rem);
        const isZero = !a.real && !a.r30; const share = a.real / pr; const open = openItems.has(it.key);
        const hasDisp = (model.byItem.get(it.key) || []).length > 0;
        const st2: [Tone, string] = gp ? status(y) : isZero ? ['mute', a.all ? 'Sem envio no período' : 'Sem envio'] : ['mute', `${fmtPct(share)} do pilar`];
        const rawIn = new Set<RawCh>(); for (const d of model.byItem.get(it.key) || []) if (d.day >= per.from && d.day <= per.to && chs.includes(CH_OF[d.ch])) rawIn.add(d.ch);
        rowsOut.push(
          <div key={'i' + it.key} className={`cz-row card${isZero ? ' dim' : ''}${it.isGroup ? ' gap' : ''}${g != null ? ' deep' : ''}${open ? ' open' : ''}`} style={{ ['--acc' as string]: p.accent }}
            onClick={() => { if (!hasDisp) return; const s = new Set(openItems); if (s.has(it.key)) s.delete(it.key); else s.add(it.key); setOpenItems(s); }}>
            <div className="cz-nm"><ChevronRight className="cz-tg" style={{ visibility: hasDisp ? 'visible' : 'hidden' }} />
              {it.isGroup ? <Link2Off className="cz-gapic" /> : <span className="cz-sdot" style={{ background: TONE_COLOR[st2[0]], boxShadow: `0 0 0 3px ${TONE_COLOR[st2[0]]}22` }} />}
              <span className="cz-cn" title={it.label}>{it.label}</span>
              {!it.isGroup && <button className="cz-ed" title="Meta e vínculo" onClick={e => { e.stopPropagation(); setDrawer(it.key); }}><SlidersHorizontal /></button>}
              {rawIn.size > 0 && <span className="cz-chn">{[...rawIn].sort().map(r => { const I = RAW_ICON[r]; return <span key={r} style={{ ['--cc' as string]: RAW_COLOR[r] }} title={RAW_LABEL[r]}><I /></span>; })}</span>}
              {a.all > 0 && <Spark values={a.m.slice(0, Math.max(2, model.months.filter(m => m <= isoOf(model.last)).length))} color={p.accent} />}
            </div>
            <div>{gp ? fmtVol(y.tot) : !it.isGroup && p.key !== FORA ? <button className="cz-setmeta" onClick={e => { e.stopPropagation(); setDrawer(it.key); }}>+ meta</button> : null}</div>
            <div>{a.all ? (gp ? <ProjCell x={y} /> : <span title={`Ritmo dos últimos 30 dias: ${fmtVol(y.r30)}`}>{fmtVol(y.proj)}</span>) : null}</div>
            <div className="mu">{gp ? fmtVol(y.exp) : null}</div>
            <div>{isZero ? <span className="cz-muted">0</span> : fmtVol(y.real)}{!isZero && <div className="cz-share" title={`${fmtPct(share)} do pilar no período`}><span style={{ width: `${Math.min(100, share * 100)}%` }} /></div>}</div>
            <div>{gp ? <UsoCell x={y} /> : null}</div><div>{gp ? <SaldoCell v={y.saldo} /> : null}</div>
            <div className="st"><Stamp tone={st2[0]} text={st2[1]} /></div>
          </div>,
        );
        if (open) rowsOut.push(<JourneyPanel key={'j' + it.key} model={model} item={it} chs={chs} period={per} perLabel={perLabel} deep={g != null} accent={p.accent} openJ={openJ} setOpenJ={setOpenJ} />);
      }
      if (zero.length && !showZero) rowsOut.push(<div key={'z' + fk} className={`cz-row more${g != null ? ' deep' : ''}`} onClick={() => setShowZero(true)}><div className="cz-nm">{zero.length} {zero.length === 1 ? 'campanha' : 'campanhas'} sem envio no período</div></div>);
    }
  }
  const TOT = metrics(TP, TA, pf, model.rem);
  const allOpen = Boolean(closed && !closed.size && closedFr && !closedFr.size);
  const allClosed = !closed || closed.size === pillarKeys.length;

  /* ---------- filtros ---------- */
  const frontPop = (
    <div className="cz-pop">
      <div className="ph"><span className="cz-lbl">Frentes do contrato</span><button onClick={() => setFronts(new Set())}>Todas</button></div>
      <div className="pg">
        {model.pillars.map(p => {
          const fs = [...p.fronts, ...(p.items.some(it => itemFront(p, it) === NO_FRONT) ? [NO_FRONT] : [])];
          return (
            <div key={p.key}>
              <div className="gh"><span className="cz-dot" style={{ background: p.accent }} /><span className="cz-lbl" style={{ color: '#475569' }}>{p.title}</span></div>
              {fs.map(f => {
                const total = sum(p.items.filter(it => itemFront(p, it) === f || (f !== NO_FRONT && it.front === f)).map(it => itemAgg(aggs, it.key, CHS).all));
                return (
                  <label key={f} className="cz-ck"><input type="checkbox" checked={fronts.has(f)} onChange={e => { const s = new Set(fronts); if (e.target.checked) s.add(f); else s.delete(f); setFronts(s); setFocus(null); }} />
                    {f === NO_FRONT ? 'Sem frente no contrato' : f}<small>{fmtVol(total)} env.</small></label>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
  return (
    <div className="cz-root">
      <div className="cz-bar">
        {modeSwitch}
        <div className="cz-sub" role="tablist" aria-label="Visão do consumo">
          <button role="tab" aria-selected={sub === 'consumo'} className={sub === 'consumo' ? 'on' : ''} onClick={() => setSub('consumo')}><ChartColumn />Consumo</button>
          <button role="tab" aria-selected={sub === 'mapa'} className={sub === 'mapa' ? 'on' : ''} onClick={() => setSub('mapa')}><Route />Mapeamento</button>
        </div>
        <span className="cz-vsep" />
        <div className="cz-filt">
          <button className={`cz-fbtn${fronts.size ? ' act' : ''}${pop === 'fr' ? ' open' : ''}`} onClick={() => setPop(pop === 'fr' ? null : 'fr')}><Receipt />Frente <b>{!fronts.size ? 'todas' : fronts.size === 1 ? ([...fronts][0] === NO_FRONT ? 'sem frente' : [...fronts][0]) : `${fronts.size} selecionadas`}</b><ChevronDown /></button>
          {pop === 'fr' && frontPop}
        </div>
        <div className="cz-filt">
          <button className={`cz-fbtn${per.key !== 'contrato' ? ' act' : ''}${pop === 'pe' ? ' open' : ''}`} onClick={() => setPop(pop === 'pe' ? null : 'pe')}><CalendarDays />Período <b>{perLabel}</b><ChevronDown /></button>
          {pop === 'pe' && <PeriodPop model={model} per={per} presetsList={allPresets} onPick={p => { setPeriod(p); setPop(null); }} />}
        </div>
        {sub === 'mapa' ? (
          <div className="cz-ledger cz-num">
            <div className="k"><small>Jornadas no período</small><b>{mapStats?.visible ?? ''}</b></div>
            <div className="k"><small>Em campanhas</small><b>{mapStats?.inCampaign ?? ''}</b></div>
            <div className="k warn"><small>Sem campanha</small><b>{mapStats?.noCampaign ?? ''}</b></div>
            <div className="k warn"><small>A classificar</small><b>{mapStats?.inbox ?? ''}</b></div>
            <div className="k mv"><small>Movidas</small><b>{mapStats?.moved ?? 0}</b></div>
          </div>
        ) : null}
        <span className="cz-grow" />
        <span className="cz-src" title={data.payload.loaded_at ? `Carga em ${new Date(data.payload.loaded_at).toLocaleString('pt-BR')}` : ''}><i />Dinâmica BI até {ddmm(isoOf(model.last))} · contrato {monthLabel(model.months[0])} a {monthLabel(model.months[11])}</span>
      </div>

      {sub === 'mapa' ? <JourneyMap model={model} period={per} perLabel={perLabel} frOn={frOn} editable={editable} onSaved={reloadData} onStats={onStats} /> : (
      <div ref={vp.canvasRef} className={`cs-canvas czb-canvas${vp.panning ? ' panning' : ''}`} style={vp.gridStyle} {...vp.handlers}>
        <div ref={vp.stageRef} className="cs-stage" style={{ transform: `translate(${Math.round(vp.view.x)}px,${Math.round(vp.view.y)}px) scale(${vp.view.z})` }}>
          <div className="czb-grid">
            <section className="czb-panel span3" data-nopan data-mini="" style={{ ['--acc' as string]: '#0e7490' }}>
              <PanelHead acc="#0e7490" icon={<Receipt />} title={`Contrato SFMC até ${monthLabel(model.months[11])}`} sub={`${focusLabel} · ${ch === 'ALL' ? 'todos os canais' : CH_LABEL[ch]} · mesma leitura da tabela`} />
              <KpiStrip x={TOT} endLabel={monthLabel(model.months[11])} expLabel={per.key === 'contrato' ? 'Esperado hoje' : 'Esperado no período'} lastLabel={ddmm(lastIso)} stamp={<Stamp tone={status(TOT)[0]} text={status(TOT)[1]} />} />
            </section>

            <section className="czb-panel" data-nopan data-mini="" style={{ ['--acc' as string]: '#0e7490' }}>
              <PanelHead acc="#0e7490" icon={<SlidersHorizontal />} title="Por canal" sub="clique para filtrar o board" />
              <div className="czb-pb">
                <div className="czb-ct czb-chead"><span>Canal</span><span>Contrato 12M</span><span>Projeção {monthLabel(model.months[11])}</span><span>{per.key === 'contrato' ? 'Esperado hoje' : 'Esperado'}</span><span>Consumido</span><span>Uso</span><span>Saldo</span><span>Situação</span></div>
                {chanRows.map(({ c, x }) => (
                  <button key={c} className={`czb-ct czb-crow${ch === c ? ' on' : ''}`} onClick={() => setCh(ch === c ? 'ALL' : c)}>
                    <span className="nm"><span className="cz-dot" style={{ background: CH_COLOR[c] }} />{CH_LABEL[c]}{c === 'WPP' && <em>Mkt+Utility</em>}</span>
                    <span>{x.tot ? fmtVol(x.tot) : <span className="cz-muted">sem</span>}</span><span><ProjCell x={x} /></span><span className="mu">{fmtVol(x.exp)}</span><span>{fmtVol(x.real)}</span>
                    <span><UsoCell x={x} empty="sem contrato" /></span><span><SaldoCell v={x.saldo} /></span><span><Stamp tone={x.tot ? status(x)[0] : 'mute'} text={x.tot ? status(x)[1] : 'Sem contrato'} /></span>
                  </button>
                ))}
                <div className="czb-lg"><span><i style={{ background: '#94a3b8' }} />projeção ÷ contrato</span><span><i style={{ background: TONE_COLOR.ok }} />uso no ritmo</span><span><i style={{ background: TONE_COLOR.info }} />abaixo do esperado</span><span><i style={{ background: TONE_COLOR.bad }} />acima</span><span><i style={{ width: 2, background: '#0f172a' }} />100% do esperado</span></div>
                <div className="czb-note">{chanRows.filter(r => r.x.uso != null).map((r, k, arr) => <span key={r.c}><b>{CH_LABEL[r.c]}</b> {fmtPct(r.x.uso as number)} do esperado{k < arr.length - 1 ? ' · ' : '. '}</span>)}
                  {(() => { const sob = chanRows.filter(r => r.x.saldo != null && r.x.saldo >= 0), est = chanRows.filter(r => r.x.saldo != null && r.x.saldo < 0);
                    return <>{sob.length > 0 && <>Fecham {monthLabel(model.months[11])} com sobra: {sob.map(r => `${CH_LABEL[r.c]} (${fmtVol(r.x.saldo)})`).join(', ')}. </>}{est.length > 0 && <span className="cz-neg">Estouram: {est.map(r => `${CH_LABEL[r.c]} (${fmtVol(-(r.x.saldo as number))})`).join(', ')}.</span>}</>; })()}</div>
              </div>
            </section>

            <section className="czb-panel" data-nopan data-mini="" style={{ ['--acc' as string]: '#334155' }}>
              <PanelHead acc="#334155" icon={<ChartColumn />} title="Mês a mês: contrato x enviado" sub={<span className="cz-fx">{focusLabel} · {ch === 'ALL' ? 'todos os canais' : CH_LABEL[ch]}{focus && <button title="Voltar" onClick={() => setFocus(null)}><X /></button>}</span>} />
              <div className="czb-pb">
                <div className="czb-lg top"><span><i style={{ background: '#dbe3ec' }} />Contrato do mês</span><span><i style={{ background: base }} />Enviado</span><span><i className="hatch" />Projeção no ritmo de 30d ({fmtVol(sd.a.r30)}/mês)</span></div>
                <MonthColumns labels={labels} plan={sd.plan} real={real} proj={proj} nowIdx={nowIdx} nowFrac={nowFrac} color={base} width={560} />
                <div className="czb-note">{best >= 0 ? <>Maior mês fechado: <b>{labels[best]}</b> com <b>{fmtVol(real[best])}</b> de {fmtVol(sd.plan[best])} ({fmtPct(bestR)} do contrato do mês). </> : null}
                  No ritmo dos últimos 30 dias, cada mês daqui pra frente fica em torno de <b>{fmtVol(sd.a.r30)}</b>{avgFut > 0 && <>, {fmtPct(sd.a.r30 / avgFut)} do contrato médio dos próximos meses</>}.</div>
              </div>
            </section>

            <section className="czb-panel" data-nopan data-mini="" style={{ ['--acc' as string]: planTot > 0 && projTot > planTot ? '#b91c1c' : '#15803d' }}>
              <PanelHead acc={planTot > 0 && projTot > planTot ? '#b91c1c' : '#15803d'} icon={<TrendingUp />} title={`Acumulado até ${monthLabel(model.months[11])}`} sub={<span className="cz-ins cz-num">{insights}</span>} />
              <div className="czb-pb">
                <div className="czb-lg top"><span><i style={{ background: '#94a3b8', height: 3 }} />Contrato acumulado</span><span><i style={{ background: '#1e293b', height: 3 }} />Consumido</span><span><i className="dash" />Projeção</span></div>
                <CumulativeLines labels={labels} plan={sd.plan} real={real} proj={proj} nowIdx={nowIdx} nowFrac={nowFrac} width={400} />
                <div className="czb-note">{per.key === 'contrato' ? 'Hoje' : perLabel}: <b>{fmtVol(sx.real)}</b> consumidos de <b>{fmtVol(sx.exp)}</b> esperados. No ritmo atual, o contrato fecha com <b>{fmtVol(projTot)}</b> usados{planTot > 0 && <> e <b className={projTot > planTot ? 'cz-neg' : 'cz-pos'}>{projTot > planTot ? `faltando ${fmtVol(projTot - planTot)}` : `${fmtVol(planTot - projTot)} sobrando`}</b></>}.</div>
              </div>
            </section>

            <section className="czb-panel span3 cz-tbl" data-nopan data-mini="" style={{ ['--acc' as string]: '#0e7490' }}>
              <PanelHead acc="#0e7490" icon={<Table />} title="Por pilar e campanha" sub={`${nItems} campanhas e grupos · envios · ${perLabel}`} right={<>
                <div className="cz-seg">
                  <button className={ch === 'ALL' ? 'on' : ''} onClick={() => setCh('ALL')}>Todos os canais</button>
                  {CHS.map(c => <button key={c} className={ch === c ? 'on' : ''} onClick={() => setCh(c)}><span className="cz-dot" style={{ background: CH_COLOR[c] }} />{CH_LABEL[c]}</button>)}
                </div>
                <button className={`cz-sw${showZero ? ' on' : ''}`} onClick={() => setShowZero(!showZero)}><i />Sem envio</button>
                <span className="cz-btngrp">
                  <button className={`cz-btn${allOpen ? ' on' : ''}`} title="Abrir todos os pilares e frentes" onClick={() => { setClosed(new Set()); setClosedFr(new Set()); }}><Maximize2 />Expandir tudo</button>
                  <button className={`cz-btn${allClosed ? ' on' : ''}`} title="Recolher tudo" onClick={() => { setClosed(new Set(pillarKeys)); setClosedFr(new Set(allFrontKeys)); setOpenItems(new Set()); setOpenJ(new Set()); }}><Minimize2 />Recolher tudo</button>
                </span>
              </>} />
              <div className="cz-thead">
                <div>Pilar · frente · campanha</div>
                <div title="Envios previstos no contrato inteiro">Contrato 12M</div>
                <div title="Tudo que saiu desde o início do contrato + ritmo dos últimos 30 dias até o fim. A barra mostra quanto do contrato isso usa">Projeção {monthLabel(model.months[11])}</div>
                <div title="Parte do contrato prevista até hoje (ou no período escolhido), pela curva mensal do contrato">{per.key === 'contrato' ? 'Esperado hoje' : 'Esperado'}</div>
                <div title="Envio real no período, sem repetir activity">Consumido</div>
                <div title="Consumido ÷ esperado. O traço marca 100%">Uso</div>
                <div title="Contrato 12M menos a projeção. ▼ = vai faltar">Saldo</div>
                <div style={{ textAlign: 'left', paddingLeft: 14 }}>Situação</div>
              </div>
              {rowsOut}
              <div className="cz-row tot">
                <div className="cz-nm">Total{ch !== 'ALL' && ` · ${CH_LABEL[ch]}`}</div>
                <div>{fmtVol(TOT.tot)}</div><div><ProjCell x={TOT} /></div><div className="mu">{fmtVol(TOT.exp)}</div><div>{fmtVol(TOT.real)}</div><div><UsoCell x={TOT} /></div><div><SaldoCell v={TOT.saldo} /></div><div className="st"><Stamp tone={status(TOT)[0]} text={status(TOT)[1]} /></div>
              </div>
              <div className="czb-foot">
                <span>Ordem de leitura: quanto foi contratado → quanto vai usar até {monthLabel(model.months[11])} → quanto já deveria ter usado → quanto usou → se está no ritmo → quanto sobra.</span>
                <details className="cz-how"><summary><Info size={13} />Como ler esta visão</summary>
                  <div>Tudo em envios, contados uma vez por activity, dia e canal; quando a mesma activity aparece em mais de uma jornada, o envio fica na jornada com mais volume. O período muda Esperado, Consumido e Uso; Projeção e Saldo olham o contrato inteiro (ritmo dos últimos 30 dias ao passar o mouse na projeção). O contrato é por frente e canal, e cada pilar soma as frentes ligadas a ele. Campanha só tem meta própria quando alguém define. Linhas em laranja são envios que ainda não têm card no board. O vínculo envio → campanha segue as regras por nome de jornada. O relatório não separa WhatsApp Utility de Mkt.</div>
                </details>
              </div>
            </section>
          </div>
        </div>
        <BoardZoomBar vp={vp} showMini={showMini} onToggleMini={() => setShowMini(v => !v)} />
        {showMini && <BoardMiniMap vp={vp} mini={mini} />}
      </div>)}
      {drawer && <GoalDrawer key={drawer} model={model} itemKey={drawer} goals={goals} editable={editable} onClose={() => setDrawer(null)}
        onSaved={g => setData(d => d && { ...d, goals: g })} rules={data.rules} />}
    </div>
  );
}

function PeriodPop({ model, per, presetsList, onPick }: { model: ConsumoModel; per: Period; presetsList: ReturnType<typeof presets>; onPick: (p: Period) => void }) {
  const isoOf = (d: number) => addDays(model.start, d);
  const [a, setA] = useState(isoOf(per.from)); const [b, setB] = useState(isoOf(per.to));
  const off = (iso: string) => Math.round((Date.parse(iso) - Date.parse(model.start)) / 86400000);
  return (
    <div className="cz-pop" style={{ minWidth: 330 }}>
      <div className="ph"><span className="cz-lbl">Período</span><span className="cz-hint" style={{ marginLeft: 'auto' }}>dados de {ddmm(model.start)} a {ddmm(isoOf(model.last))}</span></div>
      <div className="cz-pre">{presetsList.map(p => <button key={p.key} className={per.key === p.key ? 'on' : ''} onClick={() => onPick({ key: p.key, from: p.from, to: p.to })}>{p.label}</button>)}</div>
      <div className="cz-cust">
        <input type="date" value={a} min={model.start} max={isoOf(model.last)} onChange={e => setA(e.target.value)} /><span className="cz-hint">a</span>
        <input type="date" value={b} min={model.start} max={isoOf(model.last)} onChange={e => setB(e.target.value)} />
        <button className="cz-btn" style={{ marginLeft: 'auto', borderRadius: 6 }} onClick={() => {
          const x = off(a), y = off(b); if (Number.isNaN(x) || Number.isNaN(y)) return;
          onPick({ key: 'custom', from: Math.max(0, Math.min(x, y)), to: Math.min(model.last, Math.max(x, y)) });
        }}>Aplicar</button>
      </div>
    </div>
  );
}

function JourneyPanel({ model, item, chs, period, perLabel, deep, accent, openJ, setOpenJ }: {
  model: ConsumoModel; item: ItemDef; chs: Ch[]; period: Period; perLabel: string; deep: boolean; accent: string; openJ: Set<string>; setOpenJ: (s: Set<string>) => void;
}) {
  const all = (model.byItem.get(item.key) || []).filter(d => chs.includes(CH_OF[d.ch]));
  const inP = all.filter(d => d.day >= period.from && d.day <= period.to);
  const groups = new Map<number, Dispatch[]>(); for (const d of inP) { const l = groups.get(d.j); if (l) l.push(d); else groups.set(d.j, [d]); }
  const outside = new Set(all.map(d => d.j)); groups.forEach((_, k) => outside.delete(k));
  const js = [...groups.entries()].map(([j, list]) => ({ j, list, sent: sum(list.map(d => d.sent)), dl: sum(list.map(d => d.dl || 0)), days: [...new Set(list.map(d => d.day))].sort((a, b) => a - b), chs: [...new Set(list.map(d => d.ch))].sort() })).sort((a, b) => b.sent - a.sent);
  const iso = (d: number) => addDays(model.start, d);
  return (
    <div className={`cz-jp${deep ? ' deep' : ''}`} style={{ ['--acc' as string]: accent }}>
      <div className="jh"><Route /><b style={{ color: '#475569' }}>{js.length} {js.length === 1 ? 'jornada' : 'jornadas'} no SFMC</b> com envio em {perLabel}{outside.size > 0 && ` · mais ${outside.size} fora do período`}<span style={{ marginLeft: 'auto' }}>linha do tempo: {ddmm(iso(period.from))} a {ddmm(iso(period.to))}</span></div>
      {!js.length ? <div className="cz-hint" style={{ padding: '6px 0' }}>Nenhum disparo desta campanha no período escolhido.</div> : (
        <div className="cz-jtab">
          <div className="cz-jhd"><span /><span>Jornada</span><span>Canais</span><span>Disparos</span><span>Primeiro e último</span><span>Enviados</span><span>Entrega</span><span>Datas dos disparos</span></div>
          {js.map(j => {
            const k = item.key + '|' + j.j; const open = openJ.has(k); const name = model.journeys[j.j] || '(sem jornada)';
            return (
              <div key={k}>
                <button className={`cz-jr${open ? ' open' : ''}`} onClick={() => { const s = new Set(openJ); if (s.has(k)) s.delete(k); else s.add(k); setOpenJ(s); }}>
                  <ChevronRight className="tg2" /><span className="jn" title={name}>{name}</span>
                  <span className="chs">{j.chs.map(c => <span key={c} className="cz-dot" style={{ background: RAW_COLOR[c] }} title={RAW_LABEL[c]} />)}{j.chs.map(c => RAW_LABEL[c]).join(', ')}</span>
                  <span>{j.days.length}</span><span>{ddmm(iso(j.days[0]))}{j.days.length > 1 && ` a ${ddmm(iso(j.days[j.days.length - 1]))}`}</span>
                  <span><b style={{ fontWeight: 650 }}>{fmtVol(j.sent)}</b></span><span>{j.dl ? fmtPct(j.dl / j.sent) : <span className="cz-muted">sem</span>}</span>
                  <span style={{ textAlign: 'left' }}><Timeline list={j.list} from={period.from} to={period.to} /></span>
                </button>
                {open && (
                  <div className="cz-dl"><table><thead><tr><th>Data</th><th>Canal</th><th>Activity</th><th>Enviados</th><th>Entregues</th><th>Entrega</th></tr></thead><tbody>
                    {[...j.list].sort((a, b) => b.day - a.day || a.ch.localeCompare(b.ch)).map((d, i) => (
                      <tr key={i}><td>{ddmm(iso(d.day))}<span className="wd">{WEEK[new Date(Date.parse(iso(d.day))).getUTCDay()]}</span></td>
                        <td><span className="cz-dot" style={{ background: RAW_COLOR[d.ch], marginRight: 5 }} />{RAW_LABEL[d.ch]}</td>
                        <td className="act">{model.activities[d.a]}</td><td>{d.sent.toLocaleString('pt-BR')}</td>
                        <td>{d.dl ? d.dl.toLocaleString('pt-BR') : <span className="cz-muted">sem</span>}</td><td>{d.dl ? fmtPct(d.dl / d.sent) : ''}</td></tr>
                    ))}
                  </tbody></table></div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function GoalDrawer({ model, itemKey, goals, editable, onClose, onSaved, rules }: {
  model: ConsumoModel; itemKey: string; goals: ConsumoData['goals']; editable: boolean; onClose: () => void; onSaved: (g: ConsumoData['goals']) => void; rules: ConsumoData['rules'];
}) {
  const it = model.items.get(itemKey)!;
  const pillar = model.pillars.find(p => p.items.some(i => i.key === itemKey));
  const [vals, setVals] = useState<Record<Ch, string>>(() => Object.fromEntries(CHS.map(c => [c, String(goals.find(g => g.card_id === it.cardId && g.channel === c)?.monthly_volume || '')])) as Record<Ch, string>);
  const [err, setErr] = useState(''); const [saving, setSaving] = useState(false);
  const list = model.byItem.get(itemKey) || [];
  const lastIdx = model.months.filter(m => m <= addDays(model.start, model.last)).length;
  const monthly = model.months.slice(0, Math.max(1, lastIdx)).map((m, i) => {
    const row: Record<string, number | string> = { m: monthLabel(m) };
    for (const r of ['EMAIL', 'PUSH', 'WPP', 'SMS'] as RawCh[]) row[r] = 0;
    for (const d of list) if (d.day >= Math.round((Date.parse(m) - Date.parse(model.start)) / 86400000) && (i + 1 >= model.months.length || d.day < Math.round((Date.parse(model.months[i + 1]) - Date.parse(model.start)) / 86400000))) row[d.ch] = Number(row[d.ch]) + d.sent;
    return row;
  });
  const a = CHS.reduce((acc, c) => addAgg(acc, (() => { const x = emptyAgg(); for (const d of list) if (CH_OF[d.ch] === c) { x.all += d.sent; if (d.day > model.last - 30) x.r30 += d.sent; } return x; })()), emptyAgg());
  const proj = a.all + (a.r30 / 30) * model.rem;
  const linked = rules.filter(r => r.card_id === it.cardId).sort((x, y) => x.priority - y.priority);
  const save = async () => {
    if (!it.cardId) return;
    setSaving(true); setErr('');
    try {
      const next = goals.filter(g => g.card_id !== it.cardId);
      for (const c of CHS) {
        const v = Number(vals[c].replace(/\D/g, '')) || 0;
        await saveGoal(it.cardId, c, v || null);
        if (v) next.push({ card_id: it.cardId, channel: c, monthly_volume: v });
      }
      onSaved(next); onClose();
    } catch (e) { setErr(friendlyError(e)); } finally { setSaving(false); }
  };
  return (
    <aside className="cz-drawer" style={{ ['--acc' as string]: pillar?.accent }} role="dialog" aria-label={it.label}>
      <header><div><div className="cz-lbl">{pillar?.title} · frente {it.front || 'sem frente'}</div><h3>{it.label}</h3></div><button className="cz-x" aria-label="Fechar" onClick={onClose}><X size={18} /></button></header>
      <div className="body">
        <div className="cz-kg cz-num"><div><span className="cz-lbl">Desde {monthLabel(model.months[0])}</span><b>{fmtVol(a.all)}</b></div><div><span className="cz-lbl">Ritmo 30d</span><b>{fmtVol(a.r30)}</b></div><div><span className="cz-lbl">Projeção</span><b>{fmtVol(proj)}</b></div><div><span className="cz-lbl">Jornadas</span><b>{new Set(list.map(d => d.j)).size}</b></div></div>
        <div className="cz-dcv">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthly} margin={{ top: 6, right: 4, bottom: 0, left: 0 }}>
              <CartesianGrid vertical={false} stroke="#f3efe7" />
              <XAxis dataKey="m" tick={{ fontSize: 10, fill: '#8a94a6' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#8a94a6' }} axisLine={false} tickLine={false} width={46} tickFormatter={v => fmtVol(Number(v))} tickCount={3} />
              <Tooltip contentStyle={{ background: '#0f172a', border: 'none', borderRadius: 8, color: '#fff', fontSize: 12 }} itemStyle={{ color: '#fff' }} labelStyle={{ color: '#fff' }} formatter={(v: unknown, n: unknown) => [Number(v).toLocaleString('pt-BR'), RAW_LABEL[n as RawCh] || String(n)]} />
              {(['EMAIL', 'PUSH', 'WPP', 'SMS'] as RawCh[]).map(r => <Bar key={r} dataKey={r} stackId="s" fill={RAW_COLOR[r]} maxBarSize={28} isAnimationActive={false} />)}
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="cz-sec"><span className="cz-lbl">Meta de volume</span></div>
        {CHS.map(c => (
          <div key={c} className="cz-field"><label><span className="cz-dot" style={{ background: CH_COLOR[c] }} />{CH_LABEL[c]}</label>
            <div className="cz-inp"><input inputMode="numeric" value={vals[c]} disabled={!editable || saving} placeholder="sem meta própria" onChange={e => setVals(v => ({ ...v, [c]: e.target.value }))} /><span>envios/mês</span></div></div>
        ))}
        <div className="cz-hint">Sem meta própria, a campanha entra no saldo do pilar. Com meta, ela ganha uso, saldo e situação próprios.</div>
        {editable ? <div style={{ display: 'flex', gap: 8, marginTop: 10 }}><button className="cz-btn on" style={{ borderRadius: 6 }} disabled={saving} onClick={() => void save()}>{saving ? 'Salvando…' : 'Salvar meta'}</button><button className="cz-btn" style={{ borderRadius: 6 }} onClick={onClose}>Cancelar</button></div>
          : <div className="cz-hint" style={{ marginTop: 8 }}>Somente leitura.</div>}
        <div className="cz-err">{err}</div>
        <div className="cz-sec"><span className="cz-lbl">Vínculo com os envios</span></div>
        {linked.length ? <ul className="cz-rules">{linked.map(r => <li key={r.id}><code>{r.pattern}</code><span className="cz-hint">no nome da jornada · frente {r.front || 'sem frente'}</span></li>)}</ul>
          : <div className="cz-hint">Nenhuma regra liga jornadas a esta campanha ainda.</div>}
      </div>
    </aside>
  );
}
