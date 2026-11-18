import { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarClock, ChevronDown, ChevronLeft, ChevronRight, KanbanSquare, Link2, PanelRightOpen, Plus, Send, X } from 'lucide-react';
import {
  FALLBACK_COLOR, WEEKDAYS, brDate, clusterByProject, dayResults, fmtInt, sortEntries, weekday,
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
  onLinkWork: (e: DailyEntry, el: HTMLElement) => void; onCreateWork: (e: DailyEntry) => void;
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
    return list.sort((a, b) => Number(b[0].project_id === p.focusProject) - Number(a[0].project_id === p.focusProject));
  }, [dayEntries, p.focusProject]);
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
            {results.map(r => <span key={r.key} className={r.total ? 'tot' : ''}><b>{fmtInt(r.value)}</b> {r.label}</span>)}
          </div>
          <button className="dv-ib" aria-label="Fechar" onClick={p.onClose}><X /></button>
        </header>
        <div className="dv-dbody">
          <section className="topics">
            <h5>Tópicos do dia</h5>
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
                              <button key={w.id} className="dv-dw" title="Abrir esta Tarefa no kanban" onClick={() => w.initiative_id && p.onKanban(w.initiative_id, w.id)}>
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
                            {pr?.initiative_id && <button className="dv-link" onClick={() => p.onCreateWork(e)}><Plus size={12} />Criar Tarefa</button>}
                          </div>
                        )}
                      </div>
                    );
                  }) : <div className="dv-de prev">{list[0].body}</div>}
                </article>
              );
            })}
            {!clusters.length && <div className="dv-empty">Nenhum registro neste dia.</div>}
          </section>
          <aside className="disp">
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
