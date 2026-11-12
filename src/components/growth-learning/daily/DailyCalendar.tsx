import { useMemo } from 'react';
import type React from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  FALLBACK_COLOR, MONTHS, crmForDay, fmtInt, monthGrid, monthKey, packWeek, projectsByDay,
  type B2cDay, type CrmCell, type DailyEntry, type DailyFrente, type DailyPartner, type DailyProject,
} from './dailyModel';
import { tint } from './DailyPopovers';

export type DayMetric = 'b2c' | 'crm';
interface Props {
  y: number; m: number; today: string; selected: string; entries: DailyEntry[];
  projects: Map<string, DailyProject>; frentes: Map<string, DailyFrente>; partners: DailyPartner[]; partnerFilter: string[];
  b2c: Map<string, B2cDay>; crm: Map<string, CrmCell[]>; metric: DayMetric; compact: boolean; hoverProject: string | null;
  onMonth: (delta: number | 'today') => void; onMetric: (m: DayMetric) => void; onSelectDay: (day: string) => void;
  onHoverProject: (id: string | null) => void; onHoverDay: (day: string | null, e?: React.MouseEvent) => void;
  canDrag: boolean; dropDay: string | null; onDragBar: (projectId: string, day: string, e: React.DragEvent) => void;
  onDragOverDay: (day: string, e: React.DragEvent) => void; onDropDay: (day: string, e: React.DragEvent) => void; onDragEnd: () => void;
}

export function DailyCalendar(p: Props) {
  const weeks = useMemo(() => monthGrid(p.y, p.m), [p.y, p.m]);
  const byDay = useMemo(() => projectsByDay(p.entries), [p.entries]);
  const countByDayProject = useMemo(() => {
    const c = new Map<string, number>();
    for (const e of p.entries) c.set(e.day + '|' + e.project_id, (c.get(e.day + '|' + e.project_id) || 0) + 1);
    return c;
  }, [p.entries]);
  const month = `${p.y}-${String(p.m).padStart(2, '0')}`;
  const useCrm = p.metric === 'crm' || p.partnerFilter.length > 0;
  const monthVals = useMemo(() => [...p.b2c.values()].filter(d => monthKey(d.day) === month && d.emissions != null).map(d => d.emissions as number), [p.b2c, month]);
  const avg = monthVals.length ? monthVals.reduce((a, b) => a + b, 0) / monthVals.length : 0;
  const max = Math.max(1, ...monthVals);
  const maxRows = p.compact ? 3 : 6;
  const color = (projectId: string) => p.frentes.get(p.projects.get(projectId)?.frente_key || '')?.color || FALLBACK_COLOR;
  const total = useMemo(() => p.entries.filter(e => monthKey(e.day) === month).length, [p.entries, month]);

  return (
    <section className={`dv-P${p.compact ? ' dv-compact' : ''}`} style={{ ['--pacc' as string]: '#00C6CC', width: 1060 }} data-nopan data-mini="#00C6CC">
      <div className="dv-Ph">
        <span className="dv-Pic"><CalendarDays /></span>
        <button className="dv-ib" aria-label="Mês anterior" onClick={() => p.onMonth(-1)}><ChevronLeft /></button>
        <h3 style={{ width: 170, textAlign: 'center', textTransform: 'capitalize' }}>{MONTHS[p.m - 1]} {p.y}</h3>
        <button className="dv-ib" aria-label="Próximo mês" onClick={() => p.onMonth(1)}><ChevronRight /></button>
        <button className="cs-btn" style={{ height: 26, fontSize: 11.5 }} onClick={() => p.onMonth('today')}>Hoje</button>
        <span className="dv-n">{total} registros</span>
        <span className="cs-grow" style={{ flex: 1 }} />
        <span style={{ fontSize: 11, color: '#64748b' }}>Número do dia:</span>
        <span className="dv-seg">
          <button className={!useCrm ? 'on' : ''} onClick={() => p.onMetric('b2c')} title="Emissões totais B2C do dia (originação)">Emissões B2C</button>
          <button className={useCrm ? 'on' : ''} onClick={() => p.onMetric('crm')} title="Cartões gerados pelos disparos CRM feitos no dia">Cartões CRM</button>
        </span>
      </div>
      <div className="dv-wd">{['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'].map(d => <span key={d}>{d}</span>)}</div>
      <div className="dv-cal">
        {weeks.map(week => {
          const present = week.map(d => byDay.get(d) || []);
          const rows = packWeek(present);
          const shown = rows.slice(0, maxRows);
          return week.map((day, i) => {
            const inMonth = monthKey(day) === month, ps = present[i], wd = i;
            const b = p.b2c.get(day), cells = p.crm.get(day) || [];
            let res: React.ReactNode = null;
            if (inMonth && !useCrm && b?.emissions != null) {
              const up = b.emissions >= avg;
              res = <span className={`dv-res${up ? ' up' : ''}`} title={`${fmtInt(b.emissions)} emissões B2C · ${fmtInt(b.proposals)} propostas`}><span className="dv-rb"><span style={{ width: `${Math.max(6, (b.emissions / max) * 100)}%` }} /></span>{fmtInt(b.emissions)}</span>;
            } else if (inMonth && useCrm) {
              const c = crmForDay(cells, p.partners, p.partnerFilter);
              if (c != null) res = <span className="dv-res" title="Cartões gerados pelos disparos CRM feitos neste dia">{fmtInt(c)}<small>CRM</small></span>;
            }
            const extra = ps.filter(x => !shown.some(r => r.includes(x))).length;
            return (
              <div key={day} role="button" tabIndex={0} className={`dv-day${wd === 0 || wd === 6 ? ' we' : ''}${!inMonth ? ' out' : ''}${day === p.selected ? ' sel' : ''}${day === p.dropDay ? ' drop' : ''}`}
                onClick={() => p.onSelectDay(day)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); p.onSelectDay(day); } }}
                onMouseMove={e => p.onHoverDay(ps.length ? day : null, e)} onMouseLeave={() => p.onHoverDay(null)}
                onDragOver={e => p.onDragOverDay(day, e)} onDrop={e => p.onDropDay(day, e)}>
                <div className="dv-dhd">
                  <span className={`dv-dn${day === p.today ? ' today' : !inMonth ? ' out' : ''}`}>{Number(day.slice(8))}</span>
                  {day > p.today && ps.length > 0 && <span className="dv-plan">planejado</span>}
                  {res}
                </div>
                {shown.map((row, ri) => {
                  const pid = row.find(x => ps.includes(x));
                  if (!pid) return <div key={ri} className="dv-slot" />;
                  const cl = i > 0 && present[i - 1].includes(pid), cr = i < 6 && present[i + 1].includes(pid);
                  const c = color(pid), n = countByDayProject.get(day + '|' + pid) || 0;
                  const hl = p.hoverProject === pid, dim = Boolean(p.hoverProject) && !hl;
                  return (
                    <div key={ri} className="dv-slot">
                      <span className={`dv-pb${cl ? ' cl' : ''}${cr ? ' cr' : ''}${hl ? ' hl' : ''}${dim ? ' dim' : ''}`} style={{ ...tint(c, 16), borderLeft: cl ? 0 : `3px solid ${c}` }}
                        onMouseEnter={() => p.onHoverProject(pid)} onMouseLeave={() => p.onHoverProject(null)}
                        draggable={p.canDrag} onDragStart={e => { e.stopPropagation(); p.onDragBar(pid, day, e); }} onDragEnd={p.onDragEnd}
                        title={p.canDrag ? 'Arraste para outro dia (Ctrl ao soltar copia)' : undefined}>
                        {!cl && <span>{p.projects.get(pid)?.name}</span>}
                        {!cl && n > 1 && <span style={{ opacity: 0.7, flex: 'none' }}>·{n}</span>}
                      </span>
                    </div>
                  );
                })}
                {extra > 0 && <div className="dv-more">+{extra} projeto{extra > 1 ? 's' : ''}</div>}
              </div>
            );
          });
        })}
      </div>
      <div className="dv-calleg">
        {[...p.frentes.values()].filter(f => !f.archived).map(f => (
          <span key={f.key} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><span className="dv-sw" style={{ ...tint(f.color, 16), borderLeft: `3px solid ${f.color}`, width: 12, height: 12 }} />{f.name}</span>
        ))}
        <span>barra contínua = mesmo projeto em dias seguidos</span>
        {p.canDrag && <span>arraste barras e registros entre dias · Ctrl ao soltar copia</span>}
        {!useCrm && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><span className="dv-rb"><span style={{ width: '70%', background: '#0f766e' }} /></span>dia acima da média do mês</span>}
        <span className="grow">{useCrm ? 'CRM conta pelo dia do disparo, não pelo dia da emissão' : 'passe o mouse no dia para ver os registros'}</span>
      </div>
    </section>
  );
}
