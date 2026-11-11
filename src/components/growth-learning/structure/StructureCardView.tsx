import { memo } from 'react';
import type React from 'react';
import { Bell, Clock, Ellipsis, Info, Link2Off, Mail, MessageCircle, MessageSquare, Pencil, Route, Send, Star, TriangleAlert, UserPlus } from 'lucide-react';
import {
  BU_COLORS, MED_META, OBS_META, STATUS_META, cadenceLabel, cardMetrics, cardTrend, fmtShortDate, isDrift,
  type CardSignal, type Lens, type MetricKey, type StructureCard,
} from './structureModel';

export function StatusDot({ lens, card, signal }: { lens: Lens; card: Pick<StructureCard, 'declared_status' | 'measurement'>; signal?: Pick<CardSignal, 'observed'> }) {
  if (lens === 'obs' && signal) return <span className="cs-dot" style={{ background: OBS_META[signal.observed].color, boxShadow: `0 0 0 3px ${OBS_META[signal.observed].color}22` }} />;
  if (lens === 'med') return <span className="cs-dot" style={{ background: MED_META[card.measurement].color, boxShadow: `0 0 0 3px ${MED_META[card.measurement].color}22` }} />;
  if (card.declared_status === 'pon') return <Star size={13} color="#64748b" style={{ flex: 'none', marginTop: 2 }} />;
  const color = STATUS_META[card.declared_status].color;
  return <span className="cs-dot" style={color ? { background: color, boxShadow: `0 0 0 3px ${color}22` } : { border: '2px solid #94a3b8', background: '#fff' }} />;
}

export function cardTint(lens: Lens, card: StructureCard, signal: CardSignal) {
  if (lens === 'obs') return OBS_META[signal.observed].tint;
  if (lens === 'med') return MED_META[card.measurement].tint;
  return STATUS_META[card.declared_status].tint;
}
/** Cor da faixa lateral: a mesma do ponto de status na lente atual. */
export function lensColor(lens: Lens, card: Pick<StructureCard, 'declared_status' | 'measurement'>, signal: Pick<CardSignal, 'observed'>) {
  if (lens === 'obs') return OBS_META[signal.observed].color;
  if (lens === 'med') return MED_META[card.measurement].color;
  return STATUS_META[card.declared_status].color || '#cbd5e1';
}

/** Cada canal tem uma cor só, usada no ícone do topo e na barra de mix. */
export const CHANNEL_META: Record<string, { color: string; Icon: typeof Mail }> = {
  WhatsApp: { color: '#16a34a', Icon: MessageCircle },
  SMS: { color: '#6366f1', Icon: MessageSquare },
  'E-mail': { color: '#0e7490', Icon: Mail },
  Push: { color: '#f59e0b', Icon: Bell },
};
const channelMeta = (channel: string) => CHANNEL_META[channel] || { color: '#64748b', Icon: Send };
const MED_CHIP = { r: 'med', c: 'cont', p: 'plan', n: 'nof' } as const;

function Sparkline({ values, color }: { values: number[]; color: string }) {
  const w = 88, h = 30, max = Math.max(...values), min = Math.min(...values);
  const pts = values.map((y, i) => [(i * w) / (values.length - 1), h - 3 - ((y - min) / (max - min || 1)) * (h - 8)]);
  const line = pts.map(p => p.map(n => n.toFixed(1)).join(',')).join(' ');
  const last = pts[pts.length - 1];
  const id = `cs-sp-${color.slice(1)}`;
  return (
    <svg className="cs-spark" width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={color} stopOpacity=".28" /><stop offset="1" stopColor={color} stopOpacity="0" /></linearGradient></defs>
      <polygon points={`0,${h} ${line} ${w},${h}`} fill={`url(#${id})`} />
      <polyline points={line} fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={last[0] - 1} cy={last[1]} r="2.6" fill="#fff" stroke={color} strokeWidth="1.6" />
    </svg>
  );
}

interface Props {
  card: StructureCard; signal: CardSignal; metricKey: MetricKey; lens: Lens; showMetric: boolean; editable: boolean; today: string;
  dropBefore: boolean; dragging: boolean;
  onOpen: (id: string) => void; onRename: (id: string, el: HTMLElement) => void; onMenu: (id: string, anchor: HTMLElement) => void;
  onDragStart: (e: React.DragEvent, id: string) => void; onDragEnd: () => void; onDragOverCard: (e: React.DragEvent, id: string) => void; onDropCard: (e: React.DragEvent, id: string) => void;
}

function StructureCardViewBase(p: Props) {
  const { card, signal } = p;
  const drift = isDrift(card, signal);
  const w = signal.window;
  const metrics = cardMetrics(signal, p.metricKey);
  const channels = w?.channels.filter(c => c.channel !== 'Sem canal') || [];

  const due = signal.observed === 'on' || signal.observed === 'slow'
    ? <span className={`cs-chip ${signal.observed === 'on' ? 'ok' : 'stale'}`} title={`Último disparo em ${fmtShortDate(signal.lastDate)}`}><Clock />{signal.observed === 'on' ? `há ${signal.daysSince}d` : `parada ${signal.daysSince}d`}</span>
    : <span className="cs-chip none" title={OBS_META[signal.observed].hint}><Link2Off />{signal.observed === 'none' ? 'sem disparo' : 'sem vínculo'}</span>;
  const initials = card.owner.split(/\s+/).filter(Boolean).map(x => x[0]).join('').slice(0, 2).toUpperCase();

  let insight: React.ReactNode;
  if (card.external_note) insight = <div className="cs-note warn"><Info />{card.external_note}</div>;
  else if (w?.kind === '90d') {
    const trend = cardTrend(signal, p.today);
    if (trend.series.length >= 3) {
      const down = trend.delta != null && trend.delta < 0;
      insight = (<>
        <Sparkline values={trend.series} color={down ? '#dc2626' : '#16a34a'} />
        <div className="cs-dl">
          {trend.delta == null ? <span>Sem base nos 90d anteriores</span>
            : <span><b className={down ? 'down' : 'up'}>{(trend.delta > 0 ? '+' : '−') + Math.abs(Math.round(trend.delta * 100))}%</b> vs 90d ant.</span>}
          <br />{cadenceLabel(signal.activeDays90)}
        </div>
      </>);
    } else insight = <div className="cs-note idle"><Clock />Último envio {fmtShortDate(signal.lastDate)} · {w.dispatches} {w.dispatches === 1 ? 'disparo' : 'disparos'} em 90d</div>;
  } else if (w?.kind === 'cycle') insight = <div className="cs-note idle"><Clock />Sem disparo nos últimos 90 dias</div>;
  else if (signal.observed === 'none') insight = <div className="cs-note idle"><Link2Off />O vínculo não casa com nenhum disparo</div>;
  else insight = <div className="cs-note plan"><Link2Off />Ligar aos disparos para medir</div>;

  return (
    <div
      className={`cs-card${card.declared_status === 'pon' ? ' dashed' : ''}${p.dropBefore ? ' drop-before' : ''}${p.dragging ? ' dragging' : ''}`}
      style={{ ['--t' as string]: cardTint(p.lens, card, signal), ['--s' as string]: lensColor(p.lens, card, signal) }}
      data-nopan data-card={card.id} draggable={p.editable} tabIndex={0} role="button" aria-label={`Abrir ${card.title}`}
      onClick={e => { if (!(e.target as Element).closest('.cs-tools')) p.onOpen(card.id); }}
      onKeyDown={e => { if (e.key === 'Enter') p.onOpen(card.id); }}
      onDragStart={e => p.onDragStart(e, card.id)} onDragEnd={p.onDragEnd}
      onDragOver={e => p.onDragOverCard(e, card.id)} onDrop={e => p.onDropCard(e, card.id)}
    >
      {p.editable && (
        <div className="cs-tools">
          <button className="cs-icon" aria-label="Renomear" onClick={e => { e.stopPropagation(); const el = (e.currentTarget.closest('.cs-card') as HTMLElement).querySelector('.cs-tt') as HTMLElement; p.onRename(card.id, el); }}><Pencil /></button>
          <button className="cs-icon" aria-label="Ações da campanha" onClick={e => { e.stopPropagation(); p.onMenu(card.id, e.currentTarget); }}><Ellipsis /></button>
        </div>
      )}
      <div className="cs-top">
        {card.bus.map(b => <span key={b} className="cs-bu" style={{ background: BU_COLORS[b] || '#64748B' }}>{b}</span>)}
        {channels.length > 0 && (
          <span className="cs-chn">
            {channels.map(c => { const m = channelMeta(c.channel); return <span key={c.channel} style={{ ['--cc' as string]: m.color }} title={`${c.channel} · ${Math.round(c.share * 100)}% da base`}><m.Icon /></span>; })}
          </span>
        )}
      </div>
      <div className="cs-body">
        <div className="cs-t"><StatusDot lens={p.lens} card={card} signal={signal} /><span className="cs-tt">{card.title}</span></div>
        {card.audience && <p className="cs-p">{card.audience}</p>}
      </div>
      {p.showMetric && (
        <div className="cs-met">
          {w?.kind === '90d' ? <div className="cs-win on">Últimos 90 dias</div>
            : w ? <div className="cs-win cyc">Último ciclo<em>90d até {fmtShortDate(w.until)}</em></div>
              : <div className="cs-win">A medir</div>}
          <div className="cs-g">{metrics.map(m => <div key={m.label}><small>{m.label}</small><b className={m.tone || ''}>{m.value}</b></div>)}</div>
          <div className="cs-mx">
            {channels.length ? (<>
              <div className="cs-mbar">{channels.map(c => <i key={c.channel} style={{ flex: c.share, background: channelMeta(c.channel).color }} />)}</div>
              <div className="cs-mlg">{channels.map(c => <span key={c.channel}><i style={{ background: channelMeta(c.channel).color }} />{c.channel} <b>{c.share < 0.01 ? '<1' : Math.round(c.share * 100)}%</b></span>)}</div>
            </>) : (<>
              <div className="cs-mbar empty" />
              <div className="cs-mlg"><span>Mix de canais aparece ao ligar os disparos</span></div>
            </>)}
          </div>
        </div>
      )}
      <div className="cs-ins">{insight}</div>
      <div className="cs-foot">
        {due}
        <span className={`cs-chip ${MED_CHIP[card.measurement]}`} title={MED_META[card.measurement].label}>{MED_META[card.measurement].short}</span>
        {drift && <span className="cs-drift" title="Declarada ativa, mas sem disparo recente"><TriangleAlert /></span>}
        {signal.journeys.length > 0 && <span className="cs-ic" title="Jornadas ligadas"><Route />{signal.journeys.length}</span>}
        {initials ? <span className="cs-av" title={card.owner}>{initials}</span> : <span className="cs-av empty" title="Sem responsável"><UserPlus /></span>}
      </div>
    </div>
  );
}
export const StructureCardView = memo(StructureCardViewBase);
