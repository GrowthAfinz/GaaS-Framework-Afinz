import { useEffect, useMemo, useState } from 'react';
import type React from 'react';
import { ArrowLeftRight, ChevronDown, Eye, EyeOff, GripVertical, Inbox, Link2Off, Maximize2, Minimize2, PanelLeftClose, Pencil, Search, SortDesc, SquarePlus, Undo2 } from 'lucide-react';
import { getLocalViewport, toLocalRect } from '../../../context/UIScaleContext';
import { friendlyError } from './structureModel';
import { loadLaneOptions, promoteGroup, renameCampaign, renameGroup, saveJourneyMap, type JourneyMapChange, type LaneOption } from './consumoService';
import { useBoardViewport } from './useBoardViewport';
import { BoardMiniMap, BoardZoomBar, useBoardChrome } from './BoardNav';
import './structure.css';
import { FORA, RAW_COLOR, RAW_LABEL, addDays, ddmm, fmtVol, type ConsumoModel, type Dispatch, type ItemDef, type Period, type RawCh } from './consumoModel';

export interface MapStats { visible: number; inCampaign: number; noCampaign: number; inbox: number; moved: number }
interface JStat { key: string; s: number; last: number; lastAll: number; chs: RawCh[] }
const RAW_ORDER: RawCh[] = ['EMAIL', 'PUSH', 'WPP', 'SMS'];

/** Mapa de jornadas: cada jornada do SFMC no pilar, frente e campanha onde ela conta. Arrastar ou "Mover para" muda o vínculo. */
export function JourneyMap({ model, period, perLabel, frOn, editable, onSaved, onNamesChanged, onStats }: {
  model: ConsumoModel; period: Period; perLabel: string; frOn: (f: string | null) => boolean; editable: boolean;
  onSaved: () => Promise<void>; onStats: (s: MapStats) => void;
  /** Recarrega board e envios (nome de campanha e campanha nova vêm do board). */
  onNamesChanged?: () => Promise<void>;
}) {
  const [q, setQ] = useState('');
  const [onlyGap, setOnlyGap] = useState(false);
  const [showIn, setShowIn] = useState(false);
  const [moves, setMoves] = useState<Map<string, string>>(new Map());
  const [closed, setClosed] = useState<Set<string>>(new Set());
  const [more, setMore] = useState<Set<string>>(new Set());
  const [over, setOver] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [pop, setPop] = useState<{ jk: string; left: number; top: number } | null>(null);
  const [popQ, setPopQ] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [renaming, setRenaming] = useState<string | null>(null);
  const [nameErr, setNameErr] = useState<{ key: string; msg: string } | null>(null);
  const [promo, setPromo] = useState<{ key: string; left: number; top: number; title: string; lane: string } | null>(null);
  const [lanes, setLanes] = useState<LaneOption[]>([]);
  const [busy, setBusy] = useState(false);
  const vp = useBoardViewport('gaas.consumo-sfmc.map.view');
  const [showMini, setShowMini] = useState(() => { try { return localStorage.getItem('gaas.consumo-sfmc.map.mini') !== '0'; } catch { return true; } });
  useEffect(() => { try { localStorage.setItem('gaas.consumo-sfmc.map.mini', showMini ? '1' : '0'); } catch { /* preferência local */ } }, [showMini]);
  const mini = useBoardChrome(vp, { ready: true, mini: showMini, minZoom: 0.6 });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const a = document.activeElement as HTMLElement | null;
      if (a && (/INPUT|TEXTAREA|SELECT/.test(a.tagName) || a.isContentEditable)) return;
      if (e.ctrlKey || e.metaKey) return;
      if (e.key === '+' || e.key === '=') vp.zoomAt(1.15);
      else if (e.key === '-') vp.zoomAt(1 / 1.15);
      else if (e.key === '0') vp.fit();
      else if (e.key === 'm' || e.key === 'M') setShowMini(v => !v);
    };
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  }, [vp]);

  const inboxKey = model.groupForFront(null);
  const byJ = useMemo(() => {
    const m = new Map<string, Dispatch[]>();
    for (const d of model.dispatches) { const l = m.get(d.jk); if (l) l.push(d); else m.set(d.jk, [d]); }
    return m;
  }, [model]);
  const stats = useMemo(() => {
    const out = new Map<string, JStat>();
    for (const [jk, list] of byJ) {
      let s = 0, last = -1, lastAll = -1; const chs = new Set<RawCh>();
      for (const d of list) { if (d.day > lastAll) lastAll = d.day; if (d.day >= period.from && d.day <= period.to) { s += d.sent; chs.add(d.ch); if (d.day > last) last = d.day; } }
      out.set(jk, { key: jk, s, last, lastAll, chs: RAW_ORDER.filter(c => chs.has(c)) });
    }
    return out;
  }, [byJ, period.from, period.to]);

  const cur = (jk: string) => moves.get(jk) ?? model.journeyInfo.get(jk)!.item;
  const ql = q.trim().toLowerCase();
  const byItem = new Map<string, JStat[]>();
  let visible = 0, gap = 0, inbox = 0;
  for (const [jk, info] of model.journeyInfo) {
    const st = stats.get(jk); if (!st) continue;
    if (!showIn && st.s === 0) continue;
    if (ql && !info.label.toLowerCase().includes(ql)) continue;
    const it = model.items.get(cur(jk)); if (!it) continue;
    if (it.key !== inboxKey && !frOn(it.front)) continue;
    const isGap = it.isGroup && it.key !== inboxKey;
    if (onlyGap && !it.isGroup) continue;
    visible++; if (isGap) gap++; if (it.key === inboxKey) inbox++;
    const l = byItem.get(it.key); if (l) l.push(st); else byItem.set(it.key, [st]);
  }
  for (const l of byItem.values()) l.sort((a, b) => b.last - a.last || b.lastAll - a.lastAll || b.s - a.s);
  useEffect(() => { onStats({ visible, inCampaign: visible - gap - inbox, noCampaign: gap, inbox, moved: moves.size }); }, [visible, gap, inbox, moves.size, onStats]);
  useEffect(() => {
    if (!pop) return;
    const close = (e: PointerEvent) => { if (!(e.target as Element).closest('.cz-mpop')) setPop(null); };
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') setPop(null); };
    window.addEventListener('pointerdown', close); window.addEventListener('keydown', key);
    return () => { window.removeEventListener('pointerdown', close); window.removeEventListener('keydown', key); };
  }, [pop]);

  const move = (jk: string, to: string) => {
    const info = model.journeyInfo.get(jk); if (!info) return;
    setMoves(m => { const n = new Map(m); if (to === info.item) n.delete(jk); else n.set(jk, to); return n; });
  };
  const save = async () => {
    setSaving(true); setErr('');
    try {
      const changes: JourneyMapChange[] = [...moves.entries()].map(([jk, to]) => {
        const info = model.journeyInfo.get(jk)!; const it = model.items.get(to)!;
        if (to === info.ruleItem) return { journey: jk, clear: true };
        return it.isGroup ? { journey: jk, card_id: null, front: it.front, group_label: it.label } : { journey: jk, card_id: it.cardId, front: it.front, group_label: null };
      });
      await saveJourneyMap(changes);
      await onSaved();
      setMoves(new Map());
    } catch (e) { setErr(friendlyError(e)); } finally { setSaving(false); }
  };

  /** Itens que aceitam nome: campanhas do board e grupos com regra (o balde "a classificar" e os automáticos ficam de fora). */
  const nameable = (it: ItemDef) => editable && it.key !== inboxKey && !['Sem regra', 'Campanha arquivada'].includes(it.label);
  const commitName = async (it: ItemDef, value: string) => {
    const v = value.trim(); setRenaming(null);
    if (v.length < 2 || v === it.label) return;
    setBusy(true); setNameErr(null);
    try { if (it.isGroup) await renameGroup(it.label, v); else await renameCampaign(it.cardId!, v); await (onNamesChanged || onSaved)(); }
    catch (e) { setNameErr({ key: it.key, msg: friendlyError(e) }); } finally { setBusy(false); }
  };
  const openPromo = async (it: ItemDef, el: HTMLElement) => {
    const r = toLocalRect(el.getBoundingClientRect()); const v = getLocalViewport();
    let ls = lanes;
    if (!ls.length) { try { ls = await loadLaneOptions(); setLanes(ls); } catch (e) { setNameErr({ key: it.key, msg: friendlyError(e) }); return; } }
    const first = ls.find(l => l.pillarId === it.pillarKey) || ls[0];
    setPromo({ key: it.key, left: Math.min(v.width - 340, r.left), top: Math.min(v.height - 420, r.bottom + 6), title: itemName(it), lane: first?.id || '' });
  };
  const doPromote = async () => {
    if (!promo) return; const it = model.items.get(promo.key); if (!it || !promo.lane || promo.title.trim().length < 2) return;
    setBusy(true); setNameErr(null);
    try { await promoteGroup(it.label, promo.lane, promo.title.trim()); setPromo(null); await (onNamesChanged || onSaved)(); }
    catch (e) { setNameErr({ key: it.key, msg: friendlyError(e) }); } finally { setBusy(false); }
  };
  useEffect(() => {
    if (!promo) return;
    const close = (e: PointerEvent) => { if (!(e.target as Element).closest('.cz-mpop')) setPromo(null); };
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') setPromo(null); };
    window.addEventListener('pointerdown', close); window.addEventListener('keydown', key);
    return () => { window.removeEventListener('pointerdown', close); window.removeEventListener('keydown', key); };
  }, [promo]);

  const iso = (d: number) => addDays(model.start, d);
  const itemName = (it: ItemDef) => (it.key === inboxKey ? 'Sem destino' : it.isGroup ? it.label.replace(/^Sem campanha · .*/, 'Sem campanha') : it.label);
  const pillarOf = (key: string) => model.pillars.find(p => p.key === key);
  const where = (key: string) => { const it = model.items.get(key); if (!it) return ''; if (key === inboxKey) return 'A classificar'; return `${pillarOf(it.pillarKey)?.title || 'Fora do board'} › ${it.front || 'sem frente'} › ${itemName(it)}`; };

  const chip = (st: JStat) => {
    const info = model.journeyInfo.get(st.key)!; const moved = moves.has(st.key);
    const badge = moved ? ['mv', 'movida'] : info.manual ? ['man', 'manual'] : ['rule', 'regra'];
    return (
      <div key={st.key} className={`cz-jc${moved ? ' moved' : ''}${dragging === st.key ? ' drag' : ''}`} draggable={editable} data-nopan
        title={`${info.label}\n${info.manual ? 'Vínculo manual' : `Regra: ${info.pattern || 'nenhuma'}`}\nÚltimo envio: ${st.lastAll >= 0 ? ddmm(iso(st.lastAll)) : 'n/d'}`}
        onDragStart={e => { e.dataTransfer.setData('text/plain', st.key); e.dataTransfer.effectAllowed = 'move'; setDragging(st.key); }}
        onDragEnd={() => { setDragging(null); setOver(null); }}>
        <GripVertical className="gr" /><span className="nm">{info.label}</span>
        {editable && <button className="act" title="Mover para…" onClick={e => { const r = toLocalRect(e.currentTarget.getBoundingClientRect()); const vp = getLocalViewport(); setPopQ(''); setPop({ jk: st.key, left: Math.min(vp.width - 350, r.left), top: Math.min(vp.height - 430, r.bottom + 6) }); }}><ArrowLeftRight /></button>}
        <span className="mt">
          <span className="chs">{st.chs.map(c => <span key={c} className="cz-dot" style={{ background: RAW_COLOR[c] }} title={RAW_LABEL[c]} />)}</span>
          {st.last >= 0 ? <span className={st.last >= model.last - 6 ? 'rec' : ''}>{ddmm(iso(st.last))}</span> : <span>sem envio</span>}
          <b>{fmtVol(st.s)}</b>{info.activities > 1 && <span>{info.activities} activities</span>}
          <span className={`badge ${badge[0]}`}>{badge[1]}</span>
        </span>
      </div>
    );
  };
  const box = (it: ItemDef, list: JStat[], accent: string, bucket: boolean) => {
    const mk = 'c' + it.key; const lim = more.has(mk) ? 9999 : 5; const tot = list.reduce((a, x) => a + x.s, 0);
    return (
      <div key={it.key} className={`cz-mc${bucket ? ' bucket' : ''}${over === it.key ? ' over' : ''}`} style={{ ['--acc' as string]: accent }} data-nopan
        onDragOver={e => { if (!editable) return; e.preventDefault(); if (over !== it.key) setOver(it.key); }}
        onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setOver(o => (o === it.key ? null : o)); }}
        onDrop={e => { e.preventDefault(); setOver(null); const jk = e.dataTransfer.getData('text/plain'); if (jk) move(jk, it.key); }}>
        <div className="ch">{bucket && <Link2Off className="bk" />}
          {renaming === it.key
            ? <input className="t cz-rn" autoFocus defaultValue={it.label} maxLength={80} onBlur={e => void commitName(it, e.currentTarget.value)}
                onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); if (e.key === 'Escape') setRenaming(null); }} />
            : <span className="t" title={itemName(it)} onDoubleClick={() => { if (nameable(it)) setRenaming(it.key); }}>{itemName(it)}</span>}
          {nameable(it) && renaming !== it.key && <span className="cz-nact">
            <button title={it.isGroup ? 'Renomear grupo (todas as regras dele)' : 'Renomear campanha'} disabled={busy} onClick={() => setRenaming(it.key)}><Pencil /></button>
            {it.isGroup && <button title="Virar campanha do board" disabled={busy} onClick={e => void openPromo(it, e.currentTarget)}><SquarePlus /></button>}
          </span>}
          <span className="n">{list.length} · {fmtVol(tot)}</span></div>
        {nameErr?.key === it.key && <div className="cz-nerr">{nameErr.msg}</div>}
        {list.length > 0 && <div className="cl">
          {list.slice(0, lim).map(chip)}
          {list.length > 5 && <button className="more" onClick={() => setMore(s => { const n = new Set(s); if (n.has(mk)) n.delete(mk); else n.add(mk); return n; })}>{lim > 5 ? 'mostrar menos' : `+ ${list.length - 5} jornadas`}</button>}
        </div>}
        {dragging && <div className="dz">Soltar aqui</div>}
      </div>
    );
  };

  const cols: React.ReactNode[] = [];
  const inboxIt = model.items.get(inboxKey)!;
  cols.push(
    <div key="inbox" className="cz-mcol inbox" style={{ ['--acc' as string]: '#d97706' }}>
      <div className="cz-mH" data-mini="#d97706"><div className="r"><span className="ic"><Inbox /></span><span className="t">A classificar</span><span className="cz-pn">{(byItem.get(inboxKey) || []).length}</span></div>
        <div className="s">Jornadas sem frente nem campanha. Arraste para o lugar certo.</div></div>
      <div className="cz-mfr inbox" data-mini=""><div className="fb">{box(inboxIt, byItem.get(inboxKey) || [], '#d97706', true)}</div></div>
    </div>,
  );
  const pillarDefs = [...model.pillars]; if (!pillarDefs.some(p => p.key === FORA)) pillarDefs.push({ key: FORA, title: 'Fora do board', accent: '#64748B', fronts: [], items: [] });
  for (const p of pillarDefs) {
    const its = [...model.items.values()].filter(it => it.pillarKey === p.key && it.key !== inboxKey && (!it.isGroup || byItem.has(it.key) || (it.front != null && p.fronts.includes(it.front))));
    const fronts: (string | null)[] = p.fronts.filter(frOn);
    if (its.some(it => !it.front || !p.fronts.includes(it.front))) fronts.push(null);
    if (!fronts.length) continue;
    const listOf = (it: ItemDef) => byItem.get(it.key) || [];
    const all = its.flatMap(listOf); const tot = all.reduce((a, x) => a + x.s, 0);
    const mix = RAW_ORDER.map(c => all.reduce((a, x) => a + (byJ.get(x.key) || []).filter(d => d.ch === c && d.day >= period.from && d.day <= period.to).reduce((s, d) => s + d.sent, 0), 0));
    cols.push(
      <div key={p.key} className="cz-mcol" style={{ ['--acc' as string]: p.accent }}>
        <div className="cz-mH" data-mini={p.accent}><div className="r"><span className="ic"><PanelLeftClose /></span><span className="t">{p.title}</span><span className="cz-pn">{all.length}</span></div>
          <div className="s"><b>{all.length}</b> jornadas · <b>{fmtVol(tot)}</b> envios no período · {fronts.filter(Boolean).length} {fronts.filter(Boolean).length === 1 ? 'frente' : 'frentes'}</div>
          <div className="bar">{mix.map((v, i) => (v ? <i key={i} style={{ flex: v, background: RAW_COLOR[RAW_ORDER[i]] }} /> : null))}</div></div>
        {fronts.map(f => {
          const fk = p.key + '|' + f; const fIts = its.filter(it => (f ? it.front === f : !it.front || !p.fronts.includes(it.front)));
          const cards = fIts.filter(it => !it.isGroup).map(it => ({ it, l: listOf(it) })).sort((a, b) => (b.l[0]?.last ?? -2) - (a.l[0]?.last ?? -2));
          const buckets = fIts.filter(it => it.isGroup);
          const fl = fIts.flatMap(listOf); const ft = fl.reduce((a, x) => a + x.s, 0);
          const withJ = cards.filter(c => c.l.length), noJ = cards.filter(c => !c.l.length); const ek = 'e' + fk; const showEmpty = more.has(ek);
          return (
            <div key={fk} className={`cz-mfr${closed.has(fk) ? ' closed' : ''}`} data-mini="">
              <button className="fh" data-nopan onClick={() => setClosed(s => { const n = new Set(s); if (n.has(fk)) n.delete(fk); else n.add(fk); return n; })}>
                <ChevronDown className="cv" />{f || 'Sem frente no contrato'}<span className="cz-cpill">{fl.length}</span><span className="meta">{fmtVol(ft)} env.</span></button>
              {!closed.has(fk) && <div className="fb">
                {withJ.map(c => box(c.it, c.l, p.accent, false))}
                {noJ.length > 0 && showEmpty && noJ.map(c => box(c.it, c.l, p.accent, false))}
                {noJ.length > 0 && <button className="emptyrow" onDragOver={e => { e.preventDefault(); if (!showEmpty) setMore(s => new Set(s).add(ek)); }} onClick={() => setMore(s => { const n = new Set(s); if (n.has(ek)) n.delete(ek); else n.add(ek); return n; })}>
                  {showEmpty ? <EyeOff /> : <Eye />}{showEmpty ? 'Esconder' : ''} {noJ.length} {noJ.length === 1 ? 'campanha' : 'campanhas'} sem jornada no período{!showEmpty && editable && <span>soltar aqui abre</span>}</button>}
                {buckets.map(it => box(it, listOf(it), p.accent, true))}
              </div>}
            </div>
          );
        })}
      </div>,
    );
  }

  const popInfo = pop ? model.journeyInfo.get(pop.jk) : null;
  const popOptions = () => {
    if (!pop || !popInfo) return null;
    const c = cur(pop.jk); const pq = popQ.trim().toLowerCase(); const out: React.ReactNode[] = [];
    out.push(<div key="gi" className="gh"><span className="cz-dot" style={{ background: '#d97706' }} /><span className="cz-lbl">A classificar</span></div>);
    out.push(<button key="inbox" className={`op bk${c === inboxKey ? ' cur' : ''}`} onClick={() => { move(pop.jk, inboxKey); setPop(null); }}>Sem destino</button>);
    for (const p of pillarDefs) {
      const its = [...model.items.values()].filter(it => it.pillarKey === p.key && it.key !== inboxKey && (!pq || `${it.label} ${it.front || ''}`.toLowerCase().includes(pq)))
        .sort((a, b) => Number(a.isGroup) - Number(b.isGroup) || (a.front || '').localeCompare(b.front || ''));
      if (!its.length) continue;
      out.push(<div key={'g' + p.key} className="gh"><span className="cz-dot" style={{ background: p.accent }} /><span className="cz-lbl">{p.title}</span></div>);
      for (const it of its) out.push(<button key={it.key} className={`op${it.isGroup ? ' bk' : ''}${c === it.key ? ' cur' : ''}`} onClick={() => { move(pop.jk, it.key); setPop(null); }}>{itemName(it)}<small>{it.front || 'sem frente'}</small></button>);
    }
    return out;
  };

  return (
    <>
      <div className="cz-mbar cz-mtool">
        <h3>Mapa de jornadas</h3><span className="cz-cnt">{visible} jornadas {showIn ? 'no mapa' : 'com envio'} · {perLabel}</span>
        <span className="sort"><SortDesc />mais recentes em cima</span>
        <span className="cz-grow" />
        {!editable && <span className="cz-hint">Somente leitura</span>}
        <label className="cz-search"><Search /><input placeholder="Buscar jornada" value={q} onChange={e => setQ(e.target.value)} /></label>
        <button className={`cz-sw${onlyGap ? ' on' : ''}`} onClick={() => setOnlyGap(!onlyGap)}><i />Só sem campanha</button>
        <button className={`cz-sw${showIn ? ' on' : ''}`} onClick={() => setShowIn(!showIn)}><i />Sem envio no período</button>
        <span className="cz-btngrp">
          <button className="cz-btn" onClick={() => setClosed(new Set())}><Maximize2 />Expandir tudo</button>
          <button className="cz-btn" onClick={() => setClosed(new Set(pillarDefs.flatMap(p => [...p.fronts, null].map(f => p.key + '|' + f))))}><Minimize2 />Recolher tudo</button>
        </span>
      </div>
      <div ref={vp.canvasRef} className={`cs-canvas cz-mcanvas${vp.panning ? ' panning' : ''}`} style={vp.gridStyle} {...vp.handlers}>
        <div ref={vp.stageRef} className="cs-stage" style={{ transform: `translate(${Math.round(vp.view.x)}px,${Math.round(vp.view.y)}px) scale(${vp.view.z})` }}>
          <div className="cz-map">{cols}</div>
        </div>
        <BoardZoomBar vp={vp} showMini={showMini} onToggleMini={() => setShowMini(v => !v)} />
        {showMini && <BoardMiniMap vp={vp} mini={mini} />}
      {moves.size > 0 && (
        <div className="cz-savebar" data-nopan>
          <span><b>{moves.size}</b> {moves.size === 1 ? 'jornada movida' : 'jornadas movidas'} sem salvar</span>
          <button onClick={() => setMoves(new Map())} disabled={saving}><Undo2 size={13} />Desfazer tudo</button>
          <button className="pri" onClick={() => void save()} disabled={saving}>{saving ? 'Salvando…' : 'Salvar mapeamento'}</button>
          {err && <span className="err">{err}</span>}
        </div>
      )}
      </div>
      {promo && (
        <div className="cz-mpop" style={{ left: promo.left, top: promo.top }}>
          <div className="hd"><div className="cz-lbl">Virar campanha do board</div>
            <div className="rl">As regras e jornadas deste grupo passam a contar na campanha nova.</div></div>
          <div className="cz-pform">
            <label>Nome<input autoFocus value={promo.title} maxLength={80} onChange={e => setPromo({ ...promo, title: e.target.value })} /></label>
            <label>Coluna<select value={promo.lane} onChange={e => setPromo({ ...promo, lane: e.target.value })}>
              {[...new Set(lanes.map(l => l.pillarId))].map(pid => (
                <optgroup key={pid} label={lanes.find(l => l.pillarId === pid)!.pillarTitle}>{lanes.filter(l => l.pillarId === pid).map(l => <option key={l.id} value={l.id}>{l.title}</option>)}</optgroup>
              ))}
            </select></label>
            <button className="cz-btn pri" disabled={busy || promo.title.trim().length < 2 || !promo.lane} onClick={() => void doPromote()}>{busy ? 'Criando…' : 'Criar campanha'}</button>
          </div>
        </div>
      )}
      {pop && popInfo && (
        <div className="cz-mpop" style={{ left: pop.left, top: pop.top }}>
          <div className="hd"><div className="cz-lbl">Mover jornada</div><div className="nm">{popInfo.label}</div>
            <div className="rl">Hoje em: {where(cur(pop.jk))}{popInfo.manual ? ' · vínculo manual' : popInfo.pattern ? ` · regra ${popInfo.pattern}` : ''}</div>
            {popInfo.manual && cur(pop.jk) !== popInfo.ruleItem && <button className="back" onClick={() => { move(pop.jk, popInfo.ruleItem); setPop(null); }}>Voltar para a regra ({where(popInfo.ruleItem)})</button>}
          </div>
          <label className="cz-search sr"><Search /><input autoFocus placeholder="Buscar campanha ou frente" value={popQ} onChange={e => setPopQ(e.target.value)} /></label>
          <div className="ls">{popOptions()}</div>
        </div>
      )}
    </>
  );
}

