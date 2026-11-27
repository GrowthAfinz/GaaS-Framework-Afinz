import { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarClock, ChevronDown, ChevronLeft, ChevronRight, KanbanSquare, Link2, PanelRightOpen, Plus, Send, X } from 'lucide-react';
import {
  FALLBACK_COLOR, WEEKDAYS, addDays, brDate, clusterByProject, dayResults, fmtInt, sortEntries, weekday,
  type B2cDay, type CrmCell, type DailyEntry, type DailyFrente, type DailyPartner, type DailyPerson, type DailyProject, type DailyTag, type StaleInfo,
} from './dailyModel';
import { loadDispatches, type DailyInitiative, type DailyWork, type Dispatch } from './dailyService';
import { Avatar, tint } from './DailyPopovers';
import { StatusPill, boardName, isOverdue } from './DailyKanban';

interface Props {
  day: string; focusProject: string; today: string; entries: DailyEntry[];
  projects: Map<string, DailyProject>; frentes: Map<string, DailyFrente>; partners: Map<string, DailyPartner>; tags: Map<string, DailyTag>;
  people: Map<string, DailyPerson>; works: Map<string, DailyWork>; initiatives: Map<string, DailyInitiative>; stale: Map<string, StaleInfo>;
  b2c: B2cDay | undefined; crm: CrmCell[]; canEdit: boolean;
  onClose: () => void; onDay: (day: string, projectId: string) => void; onFocus: (projectId: string) => void;
  onKanban: (initiativeId: string, workId: string | null) => void; onOpenProject: (projectId: string) => void;
  onLinkWork: (e: DailyEntry, el: HTMLElement) => void; onCreateWork: (e: DailyEntry, el: HTMLElement) => void;
  onOpenTask?: (id: string) => void;
  /** Marca a Sub Tarefa como concluída num clique (lista "Vence hoje"). */
  onCheckWork?: (w: DailyWork) => Promise<unknown>;
  /** Registrar algo no dia (abre o campo de registro, escolhendo o projeto). */
  onAddEntry?: (day: string, el: HTMLElement) => void;
}

/** Modal claro do dia: tópicos à esquerda (o clicado primeiro e aberto), disparos CRM do dia à direita. */
export function DailyDayModal(p: Props) {
  const [dispatches, setDispatches] = useState<Dispatch[] | null>(null);
  const [dispError, setDispError] = useState(false);
  const [openProjects, setOpenProjects] = useState<Set<string>>(new Set([p.focusProject]));
  const [allDispatches, setAllDispatches] = useState(false);
  const focusRef = useRef<HTMLElement>(null);
  useEffect(() => {
    let alive = true; setDispatches(null); setDispError(false); setAllDispatches(false);
    loadDispatches(p.day).then(d => { if (alive) setDispatches(d); }).catch(() => { if (alive) { setDispatches([]); setDispError(true); } });
    return () => { alive = false; };
  }, [p.day]);
  useEffect(() => { setOpenProjects(new Set([p.focusProject])); }, [p.focusProject, p.day]);
  useEffect(() => { focusRef.current?.scrollIntoView({ block: 'nearest' }); }, [p.focusProject, p.day]);

  const dayEntries = useMemo(() => p.entries.filter(e => e.day === p.day).sort(sortEntries), [p.entries, p.day]);
  const clusters = useMemo(() => {
    const list = clusterByProject(dayEntries);
    // Ordem alfabética de projeto (26/11/2026); o projeto clicado continua aberto.
    return list.sort((a, b) => (p.projects.get(a[0].project_id)?.name || '').localeCompare(p.projects.get(b[0].project_id)?.name || '', 'pt-BR'));
  }, [dayEntries, p.projects]);
  const projectIds = clusters.map(c => c[0].project_id);
  const step = (dir: 1 | -1) => {
    // Navega para o dia anterior/seguinte com registro do mesmo projeto; sem registro, só troca o dia.
    const days = [...new Set(p.entries.filter(e => e.project_id === p.focusProject).map(e => e.day))].sort();
    const next = dir > 0 ? days.find(d => d > p.day) : [...days].reverse().find(d => d < p.day);
    if (next) p.onDay(next, p.focusProject);
  };
  const onClose = useRef(p.onClose); onClose.current = p.onClose;
  const stepRef = useRef(step); stepRef.current = step;
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest?.('input,textarea,[contenteditable="true"],.dv-pop')) return;
      if (e.key === 'Escape') { e.stopPropagation(); onClose.current(); }
      if (e.key === 'ArrowLeft') stepRef.current(-1);
      if (e.key === 'ArrowRight') stepRef.current(1);
    };
    document.addEventListener('keydown', key, true); return () => document.removeEventListener('keydown', key, true);
  }, []);

  const results = dayResults(p.crm, p.b2c);
  const focus = p.projects.get(p.focusProject);
  const focusCrm = new Set((focus?.partner_keys || []).map(k => p.partners.get(k)?.crm_key).filter(Boolean) as string[]);
  const partnerColor = (crm: string) => [...p.partners.values()].find(x => x.crm_key === crm)?.color || '#64748b';
  const sortedDisp = useMemo(() => (dispatches || []).slice().sort((a, b) => Number(focusCrm.has(b.partner)) - Number(focusCrm.has(a.partner))), [dispatches, focusCrm]);
  const shownDisp = allDispatches ? sortedDisp : sortedDisp.slice(0, 12);
  const dispCards = (dispatches || []).reduce((a, d) => a + d.cards, 0);
  const color = (id: string) => p.frentes.get(p.projects.get(id)?.frente_key || '')?.color || FALLBACK_COLOR;
  const isFuture = p.day > p.today;
  /** Cards (Tarefas) de cada projeto, com o progresso do checklist: o tópico do dia mostra onde o trabalho mora. */
  const cardsOf = (pid: string) => [...p.works.values()].filter(w => !w.parent_task_id && (w.project_ids || []).includes(pid) && !['concluida', 'cancelada'].includes(w.status))
    .sort((a, b) => a.title.localeCompare(b.title, 'pt-BR'));
  const progressOf = (id: string) => { const kids = [...p.works.values()].filter(k => k.parent_task_id === id); return { done: kids.filter(k => ['concluida', 'cancelada'].includes(k.status)).length, total: kids.length }; };
  const openWork = (w: DailyWork) => w.due_date && !['concluida', 'cancelada'].includes(w.status);
  const dueToday = [...p.works.values()].filter(w => openWork(w) && w.due_date === p.day).sort((a, b) => a.title.localeCompare(b.title, 'pt-BR'));
  const overdue = p.day === p.today ? [...p.works.values()].filter(w => openWork(w) && (w.due_date as string) < p.today).sort((a, b) => (a.due_date as string).localeCompare(b.due_date as string)) : [];

  return (
    <div className="dv-dm" onPointerDown={e => { if (e.target === e.currentTarget) p.onClose(); }}>
      <div className="dv-dbox" role="dialog" aria-label={`Dia ${brDate(p.day)}`}>
        <header>
          <button className="dv-ib" aria-label="Dia anterior deste projeto" title="Dia anterior deste projeto (←)" onClick={() => step(-1)}><ChevronLeft /></button>
          <div className="dt">
            <b>{WEEKDAYS[weekday(p.day)]}, {brDate(p.day)}</b>
            <span>{p.day === p.today ? 'hoje' : isFuture ? 'planejado' : ''}</span>
          </div>
          <button className="dv-ib" aria-label="Próximo dia deste projeto" title="Próximo dia deste projeto (→)" onClick={() => step(1)}><ChevronRight /></button>
          <div className="sum">
            <span><b>{projectIds.length}</b> {projectIds.length === 1 ? 'projeto' : 'projetos'}</span>
            <span><b>{projectIds.filter(pid => cardsOf(pid).length).length}</b> com card</span>
            <span><b>{dayEntries.filter(e => (e.work_ids || []).length).length}</b> de {dayEntries.length} vinculados</span>
            {results.map(r => <span key={r.key} className={r.total ? 'tot' : ''}><b>{fmtInt(r.value)}</b> {r.label}</span>)}
          </div>
          <button className="dv-ib" aria-label="Fechar" onClick={p.onClose}><X /></button>
        </header>
        <div className="dv-dbody">
          <section className="topics">
            <h5>Tópicos do dia</h5>
            {p.canEdit && p.onAddEntry && <button type="button" className="dv-qadd" onClick={ev => p.onAddEntry?.(p.day, ev.currentTarget)}><Plus size={14} /><span>Registrar algo neste dia…</span></button>}
            {clusters.map(list => {
              const pid = list[0].project_id, pr = p.projects.get(pid), c = color(pid), isOpen = openProjects.has(pid);
              const ini = pr?.initiative_id ? p.initiatives.get(pr.initiative_id) : undefined, st = p.stale.get(pid);
              return (
                <article key={pid} ref={pid === p.focusProject ? focusRef : undefined} className={`dv-dt${pid === p.focusProject ? ' focus' : ''}`} style={{ ['--bc' as string]: c }}>
                  <div className="th" role="button" tabIndex={0} onClick={() => { setOpenProjects(s => { const n = new Set(s); if (n.has(pid)) n.delete(pid); else n.add(pid); return n; }); p.onFocus(pid); }}
                    onKeyDown={e => { if (e.key === 'Enter') (e.currentTarget as HTMLElement).click(); }}>
                    <ChevronDown className={isOpen ? '' : 'closed'} />
                    <span className="dv-pchip" style={tint(c, 14)}><span>{pr?.name || 'Projeto removido'}</span></span>
                    <span className="fr">{p.frentes.get(pr?.frente_key || '')?.name}</span>
                    {st && <span className="dv-stale" title={`${st.active} Tarefa(s) em execução e nenhum registro há ${st.idle} dias úteis (último em ${brDate(st.last)})`}>parado {st.idle}d</span>}
                    <span style={{ flex: 1 }} />
                    {!isOpen && <span className="cnt">{list.length} {list.length === 1 ? 'registro' : 'registros'}</span>}
                    {ini && <button className="cs-btn sm" title={`Abrir o kanban de ${boardName(ini)} (${ini.title})`} onClick={e => { e.stopPropagation(); p.onKanban(ini.id, null); }}><KanbanSquare />Abrir Kanban</button>}
                    <button className="dv-ib sm" title="Abrir projeto" onClick={e => { e.stopPropagation(); p.onOpenProject(pid); }}><PanelRightOpen /></button>
                  </div>
                  {isOpen ? list.map(e => {
                    const resp = e.responsible_id ? p.people.get(e.responsible_id) : undefined;
                    const linked = (e.work_ids || []).map(id => p.works.get(id)).filter(Boolean) as DailyWork[];
                    return (
                      <div key={e.id} className="dv-de">
                        <div className="tx">{e.body}</div>
                        <div className="meta">
                          {resp ? <span className="who"><Avatar person={resp} size={18} />{resp.name}</span> : <span className="who none">sem responsável</span>}
                          {e.follower_ids.filter(id => id !== e.responsible_id).length > 0 && <span>+{e.follower_ids.filter(id => id !== e.responsible_id).length} acompanhando</span>}
                          {e.tag_keys.map(k => { const t = p.tags.get(k); return t ? <span key={k} className="dv-tag" style={tint(t.color, 12)}>#{t.name}</span> : null; })}
                        </div>
                        {linked.length > 0 && (
                          <div className="works">
                            {linked.map(w => (
                              <button key={w.id} className="dv-dw" title="Abrir esta Tarefa" onClick={() => (p.onOpenTask ? p.onOpenTask(w.id) : w.initiative_id && p.onKanban(w.initiative_id, w.id))}>
                                <StatusPill status={w.status} small /><span className="t">{w.title}</span>
                                {w.owner_label && <span className="o">{w.owner_label}</span>}
                                {w.due_date && <span className={`o${isOverdue(w, p.today) ? ' late' : ''}`}><CalendarClock />{brDate(w.due_date)}</span>}
                              </button>
                            ))}
                          </div>
                        )}
                        {p.canEdit && (
                          <div className="acts">
                            <button className="dv-link" onClick={ev => p.onLinkWork(e, ev.currentTarget)}><Link2 size={12} />Vincular a Tarefa…</button>
                            <button className="dv-link" onClick={ev => p.onCreateWork(e, ev.currentTarget)}><Plus size={12} />Criar Tarefa</button>
                          </div>
                        )}
                      </div>
                    );
                  }) : <div className="dv-de prev">{list[0].body}</div>}
                  {isOpen && (() => {
                    const cards = cardsOf(pid);
                    if (!cards.length) return p.canEdit ? <div className="dv-nocard">{(() => { const n = p.entries.filter(x => x.project_id === pid && x.day >= addDays(p.today, -14) && x.day <= p.today).length; return n > 1 ? `${n} registros em 14 dias e nenhum card` : 'Projeto sem card'; })()}<button className="dv-link" onClick={ev => p.onCreateWork(list[0], ev.currentTarget)}><Plus size={12} />Criar card a partir do registro</button></div> : null;
                    return <div className="dv-minis">{cards.slice(0, 4).map(w => { const pr2 = progressOf(w.id); return (
                      <button key={w.id} className="dv-mini" title="Abrir o card" onClick={() => (p.onOpenTask ? p.onOpenTask(w.id) : w.initiative_id && p.onKanban(w.initiative_id, w.id))}>
                        <span className="t">{w.title}</span>
                        {pr2.total > 0 && <><span className="pb"><i style={{ width: `${(pr2.done / pr2.total) * 100}%` }} /></span><span className="c">{pr2.done}/{pr2.total}</span></>}
                        <StatusPill status={w.status} small />
                      </button>); })}{cards.length > 4 && <span className="dv-hint">+{cards.length - 4} cards</span>}</div>;
                  })()}
                </article>
              );
            })}
            {!clusters.length && <div className="dv-empty">Nenhum registro neste dia.</div>}
          </section>
          <aside className="disp">
            {(dueToday.length > 0 || overdue.length > 0) && <div className="dv-due">
              {[['Vence neste dia', dueToday], ['Atrasadas', overdue]].map(([title, list]) => (list as DailyWork[]).length > 0 && <div key={title as string}>
                <h5>{title as string}<span>{(list as DailyWork[]).length}</span></h5>
                <ul>{(list as DailyWork[]).slice(0, 8).map(w => { const parent = w.parent_task_id ? p.works.get(w.parent_task_id) : undefined; return (
                  <li key={w.id}>
                    {parent && p.canEdit && p.onCheckWork ? <input type="checkbox" aria-label={`Concluir ${w.title}`} onChange={() => void p.onCheckWork?.(w)} /> : <StatusPill status={w.status} small />}
                    <button className="t" title="Abrir" onClick={() => p.onOpenTask?.(parent?.id || w.id)}>{w.title}{parent && <small>{parent.title}</small>}</button>
                    <span className={`o${isOverdue(w, p.today) ? ' late' : ''}`}>{w.due_date ? brDate(w.due_date) : ''}</span>
                  </li>); })}</ul>
              </div>)}
            </div>}
            <h5><Send />Disparos CRM do dia{dispatches && dispatches.length > 0 && <span>{dispatches.length} · {fmtInt(dispCards)} cartões</span>}</h5>
            {focusCrm.size > 0 && dispatches && dispatches.some(d => focusCrm.has(d.partner)) && <div className="hint">Os disparos dos parceiros de {focus?.name} vêm primeiro.</div>}
            {dispatches === null ? <div className="dv-empty">Carregando disparos…</div>
              : dispError ? <div className="dv-empty">Não foi possível carregar os disparos.</div>
              : !dispatches.length ? <div className="dv-empty">{isFuture ? 'Dia ainda não chegou.' : 'Nenhum disparo CRM registrado neste dia.'}</div>
              : (
                <>
                  <div className="cols"><span>base</span><span>cartões</span></div>
                  <ul>
                    {shownDisp.map(d => (
                      <li key={d.id} className={focusCrm.has(d.partner) ? 'mine' : ''} title={d.name}>
                        <span className="pa" style={tint(partnerColor(d.partner), 14)}>{d.partner === 'Proprietaria' ? 'B2C' : d.partner}</span>
                        <span className="nm"><b>{d.journey || d.segment || d.name}</b><small>{d.channel}{d.segment && d.journey ? ` · ${d.segment}` : ''}</small></span>
                        <span className="nb" title="Base acionável">{d.base != null ? fmtInt(d.base) : ''}</span>
                        <span className="cd" title="Cartões gerados">{fmtInt(d.cards)}</span>
                      </li>
                    ))}
                  </ul>
                  {sortedDisp.length > 12 && <button className="dv-link" onClick={() => setAllDispatches(a => !a)}>{allDispatches ? 'Mostrar menos' : `Ver todos os ${sortedDisp.length}`}</button>}
                </>
              )}
            <div className="note">Cartões contam pelo dia do disparo; em disparos recentes o número ainda cresce.</div>
          </aside>
        </div>
      </div>
    </div>
  );
}
