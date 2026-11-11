import { memo } from 'react';
import type React from 'react';
import { ChartLine, Clock, ClockAlert, DatabaseZap, Ellipsis, Info, Mail, Pencil, Route, Star, TriangleAlert, UserPlus } from 'lucide-react';
import { BU_COLORS, MED_META, METRIC_LABEL, OBS_META, STATUS_META, fmtInt, isDrift, type CardSignal, type Lens, type MetricKey, type StructureCard } from './structureModel';

export function StatusDot({ lens, card, signal }: { lens: Lens; card: Pick<StructureCard, 'declared_status' | 'measurement'>; signal?: Pick<CardSignal, 'observed'> }) {
  if (lens === 'obs' && signal) return <span className="cs-dot" style={{ background: OBS_META[signal.observed].color }} />;
  if (lens === 'med') return <span className="cs-dot" style={{ background: MED_META[card.measurement].color }} />;
  if (card.declared_status === 'pon') return <Star size={14} color="#777" style={{ flex: 'none', marginTop: 1 }} />;
  const color = STATUS_META[card.declared_status].color;
  return <span className="cs-dot" style={color ? { background: color } : { border: '1.6px solid #777' }} />;
}

export function cardTint(lens: Lens, card: StructureCard, signal: CardSignal) {
  if (lens === 'obs') return OBS_META[signal.observed].tint;
  if (lens === 'med') return MED_META[card.measurement].tint;
  return STATUS_META[card.declared_status].tint;
}

const MED_ICON = { r: ChartLine, c: Mail, p: Clock, n: DatabaseZap } as const;

interface Props {
  card: StructureCard; signal: CardSignal; metricKey: MetricKey; lens: Lens; showMetric: boolean; editable: boolean;
  dropBefore: boolean; dragging: boolean;
  onOpen: (id: string) => void; onRename: (id: string, el: HTMLElement) => void; onMenu: (id: string, anchor: HTMLElement) => void;
  onDragStart: (e: React.DragEvent, id: string) => void; onDragEnd: () => void; onDragOverCard: (e: React.DragEvent, id: string) => void; onDropCard: (e: React.DragEvent, id: string) => void;
}

function StructureCardViewBase(p: Props) {
  const { card, signal } = p;
  const drift = isDrift(card, signal);
  const isCrm = signal.domain === 'crm' || p.metricKey === 'aq';
  const value = isCrm ? signal.primary90 : signal.base90;
  const MedIcon = MED_ICON[card.measurement];
  const due = signal.observed === 'on' || signal.observed === 'slow'
    ? <span className={`cs-due ${signal.observed === 'on' ? 'ok' : 'late'}`} title={`Último disparo em ${signal.lastDate}`}><Clock />{signal.observed === 'on' ? `há ${signal.daysSince}d` : `parada ${signal.daysSince}d`}</span>
    : <span className="cs-due none" title={OBS_META[signal.observed].hint}><ClockAlert />{signal.observed === 'none' ? 'sem disparo' : 'sem vínculo'}</span>;
  const initials = card.owner.split(/\s+/).filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div
      className={`cs-card${card.declared_status === 'pon' ? ' dashed' : ''}${p.dropBefore ? ' drop-before' : ''}${p.dragging ? ' dragging' : ''}`}
      style={{ background: cardTint(p.lens, card, signal) }}
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
      {card.bus.length > 0 && <div className="cs-lbls">{card.bus.map(b => <span key={b} style={{ background: BU_COLORS[b] || '#64748B' }}>{b}</span>)}</div>}
      <div className="cs-t"><StatusDot lens={p.lens} card={card} signal={signal} /><span className="cs-tt">{card.title}</span></div>
      {card.audience && <div className="cs-p">{card.audience}</div>}
      {p.showMetric && (value != null && signal.observed !== 'unlinked'
        ? <div className="cs-mt"><b>{fmtInt(value)}</b><span>{isCrm ? METRIC_LABEL.aq : METRIC_LABEL[p.metricKey]}</span></div>
        : <div className="cs-mt na"><span>{signal.observed === 'unlinked' ? 'Sem vínculo com disparos' : 'Sem disparo nos últimos 90 dias'}</span></div>)}
      {card.external_note && <div className="cs-ext"><Info />{card.external_note}</div>}
      <div className="cs-foot">
        {due}
        <span className="cs-mi" title={MED_META[card.measurement].label} style={{ color: MED_META[card.measurement].color, background: MED_META[card.measurement].tint }}><MedIcon />{p.lens === 'med' ? '' : MED_META[card.measurement].short}</span>
        {drift && <span title="Declarada ativa, mas sem disparo recente" style={{ color: '#b45309', display: 'inline-flex' }}><TriangleAlert size={14} /></span>}
        {signal.journeys.length > 0 && <span className="cs-ic" title="Jornadas ligadas"><Route />{signal.journeys.length}</span>}
        {initials ? <span className="cs-av" title={card.owner}>{initials}</span> : <span className="cs-av empty" title="Sem responsável"><UserPlus size={12} /></span>}
      </div>
    </div>
  );
}
export const StructureCardView = memo(StructureCardViewBase);
