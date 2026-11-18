import { useMemo } from 'react';
import type React from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  FALLBACK_COLOR, MONTHS, RESULT_LINES, addDays, dayResultsAll, fmtInt, monthGrid, monthKey, packWeek, projectsByDay, resultValue, weekday, weekdayCompare,
  type B2cDay, type CrmCell, type DailyEntry, type DailyFrente, type DailyPartner, type DailyProject, type ResultValue,
} from './dailyModel';
import { tint } from './DailyPopovers';

/** Tópicos = o que andou em cada projeto; Resultados = emissões do dia agrupadas (decisão de 16/11/2026). */
export type CalendarMode = 'topics' | 'results';
export interface DayPin { day: string; projectId: string }
interface Props {
  y: number; m: number; today: string; selected: string; entries: DailyEntry[];
  projects: Map<string, DailyProject>; frentes: Map<string, DailyFrente>; partners: DailyPartner[]; partnerFilter: string[];
  b2c: Map<string, B2cDay>; crm: Map<string, CrmCell[]>; mode: CalendarMode; compact: boolean; hoverProject: string | null; pin: DayPin | null;
  onMonth: (delta: number | 'today') => void; onMode: (m: CalendarMode) => void; onSelectDay: (day: string) => void; onTopic: (day: string, projectId: string) => void;
  onHoverProject: (id: string | null) => void; onHoverDay: (day: string | null, e?: React.MouseEvent) => void;
  canDrag: boolean; dropDay: string | null; onDragBar: (projectId: string, day: string, e: React.DragEvent) => void;
  onDragOverDay: (day: string, e: React.DragEvent) => void; onDropDay: (day: string, e: React.DragEvent) => void; onDragEnd: () => void;
}

/** Rótulo curto dentro da célula: o grupo "CRM" já aparece no cabeçalho da pilha. */
const shortLabel = (r: ResultValue) => (r.total ? 'Total B2C' : r.label.replace(/^CRM /, ''));
const pct = (d: number) => `${d > 0 ? '+' : ''}${Math.round(d * 100)}%`;
/** Só marca a variação quando ela é grande o bastante para merecer atenção na daily. */
const DELTA_MIN = 0.15;
/** Média abaixo disso vira porcentagem sem sentido (1 contra 0,2 = +400%): não marca. */
const AVG_MIN = 5;
/** Cartões CRM contam pelo dia do disparo e ainda crescem por uns dias: não comparar a última semana. */
const CRM_MATURING_DAYS = 7;
const WEEKDAY_PLURAL = ['domingos', 'segundas', 'terças', 'quartas', 'quintas', 'sextas', 'sábados'];

export function DailyCalendar(p: Props) {
  const weeks = useMemo(() => monthGrid(p.y, p.m), [p.y, p.m]);
  const byDay = useMemo(() => projectsByDay(p.entries), [p.entries]);
  const countByDayProject = useMemo(() => {
    const c = new Map<string, number>();
    for (const e of p.entries) c.set(e.day + '|' + e.project_id, (c.get(e.day + '|' + e.project_id) || 0) + 1);
    return c;
  }, [p.entries]);
  /** BU/parceiro escolhido nos registros do dia (ex.: "Topo de Funil Aquisição · Plurix"). */
  const partnersByDayProject = useMemo(() => {
    const names = new Map(p.partners.map(x => [x.key, x.name]));
    const m = new Map<string, string[]>();
    for (const e of p.entries) for (const k of e.partner_keys || []) {
      const key = e.day + '|' + e.project_id, list = m.get(key) || [], n = names.get(k);
      if (n && !list.includes(n)) m.set(key, [...list, n]);
    }
    return m;
  }, [p.entries, p.partners]);
  const month = `${p.y}-${String(p.m).padStart(2, '0')}`;
  const results = p.mode === 'results';
  const only = useMemo(() => {
    if (!p.partnerFilter.length) return null;
    return new Set(p.partners.filter(x => p.partnerFilter.includes(x.key) && x.crm_key).map(x => x.crm_key as string));
  }, [p.partners, p.partnerFilter]);
  const monthVals = useMemo(() => [...p.b2c.values()].filter(d => monthKey(d.day) === month && d.emissions != null).map(d => d.emissions as number), [p.b2c, month]);
  const max = Math.max(1, ...monthVals);
  const maxRows = p.compact ? 3 : 6;
  const color = (projectId: string) => p.frentes.get(p.projects.get(projectId)?.frente_key || '')?.color || FALLBACK_COLOR;
  const total = useMemo(() => p.entries.filter(e => monthKey(e.day) === month).length, [p.entries, month]);
  // Parceiros que emitem cartão e não têm linha fixa (ex.: Super Nosso) entram zerados também.
  const extraKeys = useMemo(() => {
    const fixed = new Set(RESULT_LINES.flatMap(l => l.crm));
    const keys = new Set(p.partners.filter(x => !x.archived && x.crm_key && !fixed.has(x.crm_key)).map(x => x.crm_key as string));
    for (const [d, cells] of p.crm) if (monthKey(d) === month) for (const cell of cells) if (cell.cards > 0 && !fixed.has(cell.partner) && cell.partner !== 'N/A') keys.add(cell.partner);
    return [...keys];
  }, [p.partners, p.crm, month]);
  const resultsOf = (day: string) => dayResultsAll(p.crm.get(day) || [], p.b2c.get(day), extraKeys, only);
  const monthTotals = useMemo(() => {
    if (!results) return [];
    const sum = new Map<string, { label: string; value: number; total?: boolean }>();
    for (const week of weeks) for (const day of week) {
      if (monthKey(day) !== month || day > p.today) continue;
      for (const r of dayResultsAll(p.crm.get(day) || [], p.b2c.get(day), extraKeys, only)) {
        const s = sum.get(r.key) || { label: r.label, value: 0, total: r.total };
        s.value += r.value; sum.set(r.key, s);
      }
    }
    const order = [...RESULT_LINES.map(l => l.key)];
    return [...sum.entries()].sort((a, b) => (a[1].total ? 1 : 0) - (b[1].total ? 1 : 0) || (order.indexOf(a[0]) + 1 || 99) - (order.indexOf(b[0]) + 1 || 99));
  }, [results, weeks, month, p.crm, p.b2c, only, p.today, extraKeys]);

  const renderResults = (day: string) => {
    if (day > p.today) return null;
    const rows = resultsOf(day);
    const crmRows = rows.filter(r => !r.total), totalRow = rows.find(r => r.total);
    const line = (r: ResultValue & { missing?: boolean }) => {
      const cmp = weekdayCompare(day, r.value, d => resultValue(r.key, p.crm.get(d), p.b2c.get(d)));
      const partial = day === p.today, maturing = !r.total && day > addDays(p.today, -CRM_MATURING_DAYS);
      const big = !r.missing && !partial && !maturing && cmp.avg >= AVG_MIN && cmp.delta != null && Math.abs(cmp.delta) >= DELTA_MIN;
      const unit = r.total ? (r.value === 1 ? ' emissão' : ' emissões') : (r.value === 1 ? ' cartão' : ' cartões');
      const tip = `${r.label}: ${fmtInt(r.value)}${unit}`
        + (cmp.weeks ? `\nMédia das últimas ${cmp.weeks} ${WEEKDAY_PLURAL[weekday(day)]}: ${fmtInt(cmp.avg)}${cmp.delta != null ? ` (${pct(cmp.delta)})` : ''}` : '\nSem semanas anteriores para comparar')
        + (r.missing ? '\nSem dado registrado na fonte para este dia' : partial ? '\nDia em andamento: número parcial' : maturing ? '\nDisparo recente: os cartões ainda estão entrando' : '');
      return (
        <div key={r.key} className={`dv-rs${r.total ? ' tot' : ''}${r.value === 0 ? ' zero' : ''}${r.missing ? ' nodata' : ''}`} title={tip}>
          <span className="l">{shortLabel(r)}</span>
          {r.total && <span className="dv-rb"><span style={{ width: `${Math.max(6, (r.value / max) * 100)}%` }} /></span>}
          <span className="v">{r.missing ? '0' : fmtInt(r.value)}</span>
          <span className={`d${big ? (cmp.delta! > 0 ? ' up' : ' down') : ''}`}>{big ? `${cmp.delta! > 0 ? '▲' : '▼'}${Math.abs(cmp.delta!) > 3 ? '>300' : Math.round(Math.abs(cmp.delta!) * 100)}%` : partial && r.total ? 'parcial' : ''}</span>
        </div>
      );
    };
    return (
      <div className="dv-rstack">
        {crmRows.length > 0 && <div className="dv-rs-h">CRM</div>}
        {crmRows.map(line)}
        {totalRow && line(totalRow)}
      </div>
    );
  };

  return (
    <section className={`dv-P${p.compact ? ' dv-compact' : ''}${results ? ' dv-mode-results' : ''}${p.pin ? ' dv-pinning' : ''}`} style={{ ['--pacc' as string]: '#00C6CC', width: 1060 }} data-nopan data-mini="#00C6CC">
      <div className="dv-Ph">
        <span className="dv-Pic"><CalendarDays /></span>
        <button className="dv-ib" aria-label="Mês anterior" onClick={() => p.onMonth(-1)}><ChevronLeft /></button>
        <h3 style={{ width: 170, textAlign: 'center', textTransform: 'capitalize' }}>{MONTHS[p.m - 1]} {p.y}</h3>
        <button className="dv-ib" aria-label="Próximo mês" onClick={() => p.onMonth(1)}><ChevronRight /></button>
        <button className="cs-btn" style={{ height: 26, fontSize: 11.5 }} onClick={() => p.onMonth('today')}>Hoje</button>
        <span className="dv-n">{total} registros</span>
        <span className="cs-grow" style={{ flex: 1 }} />
        <span style={{ fontSize: 11, color: '#64748b' }}>Visualização:</span>
        <span className="dv-seg">
          <button className={!results ? 'on' : ''} onClick={() => p.onMode('topics')} title="O que andou em cada projeto, dia a dia">Tópicos</button>
          <button className={results ? 'on' : ''} onClick={() => p.onMode('results')} title="Cartões CRM por parceiro e emissões totais B2C, dia a dia">Resultados</button>
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
            const extra = ps.filter(x => !shown.some(r => r.includes(x))).length;
            const pinnedDay = p.pin?.day === day;
            return (
              <div key={day} role="button" tabIndex={0} className={`dv-day${wd === 0 || wd === 6 ? ' we' : ''}${!inMonth ? ' out' : ''}${day === p.selected ? ' sel' : ''}${day === p.dropDay ? ' drop' : ''}${pinnedDay ? ' pinday' : ''}`}
                onClick={() => p.onSelectDay(day)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); p.onSelectDay(day); } }}
                onMouseMove={e => p.onHoverDay(!results && ps.length ? day : null, e)} onMouseLeave={() => p.onHoverDay(null)}
                onDragOver={e => p.onDragOverDay(day, e)} onDrop={e => p.onDropDay(day, e)}>
                <div className="dv-dhd">
                  <span className={`dv-dn${day === p.today ? ' today' : !inMonth ? ' out' : ''}`}>{Number(day.slice(8))}</span>
                  {!results && day > p.today && ps.length > 0 && <span className="dv-plan">planejado</span>}
                </div>
                {results ? (inMonth ? renderResults(day) : null) : (
                  <>
                    {shown.map((row, ri) => {
                      const pid = row.find(x => ps.includes(x));
                      if (!pid) return <div key={ri} className="dv-slot" />;
                      const cl = i > 0 && present[i - 1].includes(pid), cr = i < 6 && present[i + 1].includes(pid);
                      const c = color(pid), n = countByDayProject.get(day + '|' + pid) || 0;
                      const parts = partnersByDayProject.get(day + '|' + pid) || [];
                      const pinned = pinnedDay && p.pin?.projectId === pid;
                      const hl = !p.pin && p.hoverProject === pid, dim = p.pin ? !pinned : Boolean(p.hoverProject) && !hl;
                      return (
                        <div key={ri} className={`dv-slot${cl ? ' cl' : ''}${cr ? ' cr' : ''}`} style={{ ['--bc' as string]: c }}>
                          <button type="button" className={`dv-pb${hl ? ' hl' : ''}${pinned ? ' pin' : ''}${dim ? ' dim' : ''}`} style={{ ...tint(c, 16), borderLeft: `3px solid ${c}` }}
                            onMouseEnter={() => p.onHoverProject(pid)} onMouseLeave={() => p.onHoverProject(null)}
                            onClick={e => { e.stopPropagation(); p.onTopic(day, pid); }}
                            draggable={p.canDrag} onDragStart={e => { e.stopPropagation(); p.onDragBar(pid, day, e); }} onDragEnd={p.onDragEnd}
                            title={`${p.projects.get(pid)?.name || ''}${parts.length ? ` · ${parts.join(', ')}` : ''}: clique para ver o dia${p.canDrag ? ' · arraste para outro dia (Ctrl ao soltar copia)' : ''}`}>
                            <span>{p.projects.get(pid)?.name}{parts.length ? ` · ${parts.join(', ')}` : ''}</span>
                            {n > 1 && <span style={{ opacity: 0.7, flex: 'none' }}>·{n}</span>}
                          </button>
                        </div>
                      );
                    })}
                    {extra > 0 && <div className="dv-more">+{extra} projeto{extra > 1 ? 's' : ''}</div>}
                  </>
                )}
              </div>
            );
          });
        })}
      </div>
      <div className="dv-calleg">
        {results ? (
          <>
            {monthTotals.map(([key, s]) => <span key={key} className={`dv-mt${s.total ? ' tot' : ''}`}><b>{fmtInt(s.value)}</b>{s.label}</span>)}
            {!monthTotals.length && <span>Sem resultado registrado neste mês.</span>}
            <span><span className="dv-up">▲</span>/<span className="dv-down">▼</span> variação de 15% ou mais contra a média do mesmo dia da semana nas 4 semanas anteriores (CRM só depois de 7 dias)</span>
            <span className="grow">CRM conta pelo dia do disparo; Total B2C pelo dia da emissão e já inclui o CRM B2C, por isso no dia a dia os dois não batem</span>
          </>
        ) : (
          <>
            {[...p.frentes.values()].filter(f => !f.archived).map(f => (
              <span key={f.key} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><span className="dv-sw" style={{ ...tint(f.color, 16), borderLeft: `3px solid ${f.color}`, width: 12, height: 12 }} />{f.name}</span>
            ))}
            <span>traço entre dias = mesmo projeto em dias seguidos</span>
            {p.canDrag && <span>arraste barras e registros entre dias · Ctrl ao soltar copia</span>}
            <span className="grow">clique num tópico para abrir o dia</span>
          </>
        )}
      </div>
    </section>
  );
}
