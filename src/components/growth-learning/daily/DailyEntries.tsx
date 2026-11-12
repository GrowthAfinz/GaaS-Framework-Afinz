import { useEffect, useRef } from 'react';
import type React from 'react';
import {
  ArrowDownUp, CalendarRange, ChevronDown, ChevronRight, ChevronsDownUp, ChevronsUpDown, CornerDownRight, Ellipsis, Eye, History, LayoutList,
  List, NotebookPen, PanelRightOpen, Plus, Sun, Tag as TagIcon, UserPlus, X,
} from 'lucide-react';
import {
  FALLBACK_COLOR, MONTHS, WEEKDAYS, brDate, clusterByProject, fmtInt, weekday,
  type B2cDay, type DailyEntry, type DailyFilters, type DailyFrente, type DailyGroup, type DailyPartner, type DailyPerson,
  type DailyProject, type DailySort, type DailyTag, type DailyView, type EntryGroup, type FilterKey,
} from './dailyModel';
import { Avatar, tint } from './DailyPopovers';

export interface Draft { day: string; projectId: string }
interface Props {
  groups: EntryGroup[]; group: DailyGroup; sort: DailySort; view: DailyView; filters: DailyFilters; shown: number; total: number;
  monthsLoaded: string[]; prevMonth: string | null; isCollapsed: (key: string) => boolean; today: string; canEdit: boolean; draft: Draft | null;
  /** Campanha do board por id (nome atual), para mostrar ao lado do projeto. */
  campaigns?: Map<string, string>;
  projects: Map<string, DailyProject>; frentes: Map<string, DailyFrente>; partners: Map<string, DailyPartner>; tags: Map<string, DailyTag>; people: Map<string, DailyPerson>;
  b2c: Map<string, B2cDay>; filterLabels: { key: FilterKey; label: string; names: Map<string, string> }[]; scrollToDay: string | null; flashKey: number;
  onView: (v: DailyView) => void; onFilterPop: (key: FilterKey, el: HTMLElement) => void; onRemoveFilter: (key: FilterKey, value: string) => void; onClear: () => void;
  onSortPop: (el: HTMLElement) => void; onGroupPop: (el: HTMLElement) => void; onToggle: (key: string) => void; onAll: (collapse: boolean) => void; onMore: () => void;
  onAdd: (day: string, el: HTMLElement, projectId?: string) => void; onDraftSave: (text: string) => void; onDraftCancel: () => void;
  onEditBody: (e: DailyEntry, text: string) => void; onProjectPop: (e: DailyEntry, el: HTMLElement) => void; onTagPop: (e: DailyEntry, el: HTMLElement) => void;
  onRemoveTag: (e: DailyEntry, key: string) => void; onPeoplePop: (e: DailyEntry, el: HTMLElement) => void; onMenu: (e: DailyEntry, el: HTMLElement) => void;
  onContinue: (e: DailyEntry) => void; onOpenProject: (id: string) => void; onHoverProject: (id: string | null) => void;
  dropDay: string | null; onDragEntry: (e: DailyEntry, ev: React.DragEvent) => void; onDragOverDay: (day: string, ev: React.DragEvent) => void;
  onDropDay: (day: string, ev: React.DragEvent) => void; onDragEnd: () => void;
}

const VIEWS: [DailyView, string, React.ReactNode][] = [['today', 'Hoje', <Sun key="s" />], ['week', 'Esta semana', <CalendarRange key="c" />], ['mine', 'Que eu acompanho', <Eye key="e" />], ['all', 'Tudo', <List key="l" />]];
const plural = (n: number, one: string, many: string) => `${fmtInt(n)} ${n === 1 ? one : many}`;
const GROUP_LABEL: Record<DailyGroup, string> = { day: 'dia', project: 'projeto', frente: 'frente' };

function inlineEdit(el: HTMLElement, onSave: (v: string) => void) {
  const old = el.textContent || '';
  const row = el.closest<HTMLElement>('.dv-row');
  if (row) row.draggable = false;
  el.contentEditable = 'true'; el.focus();
  const sel = window.getSelection(); const range = document.createRange(); range.selectNodeContents(el); range.collapse(false); sel?.removeAllRanges(); sel?.addRange(range);
  const done = (ok: boolean) => {
    el.contentEditable = 'false'; el.onblur = null; el.onkeydown = null;
    if (row) row.draggable = true;
    const v = (el.innerText || '').trim();
    if (ok && v && v !== old.trim()) onSave(v); else el.textContent = old;
  };
  el.onkeydown = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); done(true); } if (e.key === 'Escape') { e.preventDefault(); done(false); } };
  el.onblur = () => done(true);
}

function DraftRow({ draft, project, color, onSave, onCancel }: { draft: Draft; project?: DailyProject; color: string; onSave: (t: string) => void; onCancel: () => void }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { ref.current?.focus(); }, [draft]);
  const save = () => { const v = ref.current?.value.trim(); if (v) onSave(v); };
  return (
    <div className="dv-draft">
      <span className="bar" style={{ width: 3, alignSelf: 'stretch', borderRadius: 3, background: color }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6, fontSize: 11.5, color: '#64748b' }}>
          <b style={{ color: '#0e7490' }}>Novo registro · {WEEKDAYS[weekday(draft.day)]}, {brDate(draft.day)}</b>
          <span className="dv-pchip" style={tint(color, 13)}><span>{project?.name}</span></span>
        </div>
        <textarea ref={ref} rows={2} placeholder="O que andou neste projeto? Enter salva, Shift+Enter quebra linha, Esc cancela"
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); save(); } if (e.key === 'Escape') onCancel(); }} />
        <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
          <button className="cs-btn pri" style={{ height: 26, fontSize: 11.5 }} onClick={save}>Salvar</button>
          <button className="cs-btn" style={{ height: 26, fontSize: 11.5 }} onClick={onCancel}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

export function DailyEntries(p: Props) {
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!p.scrollToDay) return;
    const list = listRef.current, el = list?.querySelector<HTMLElement>(`[data-day="${p.scrollToDay}"]`);
    if (!list || !el) return;
    list.scrollTop = el.offsetTop - list.offsetTop - 4;
    el.classList.remove('dv-flash'); void el.offsetWidth; el.classList.add('dv-flash');
  }, [p.scrollToDay, p.flashKey]);

  const projectColor = (id: string) => p.frentes.get(p.projects.get(id)?.frente_key || '')?.color || FALLBACK_COLOR;
  const activeChips = p.filterLabels.flatMap(f => p.filters[f.key].map(v => ({ key: f.key, value: v, text: `${f.label}: ${f.names.get(v) || v}` })));

  const row = (e: DailyEntry, showProject: boolean, showDate: boolean) => {
    const pr = p.projects.get(e.project_id), c = projectColor(e.project_id);
    const resp = e.responsible_id ? p.people.get(e.responsible_id) : undefined;
    const fol = e.follower_ids.filter(id => id !== e.responsible_id).map(id => p.people.get(id)).filter(Boolean) as DailyPerson[];
    return (
      <div key={e.id} className="dv-row" data-entry={e.id} onMouseEnter={() => p.onHoverProject(e.project_id)} onMouseLeave={() => p.onHoverProject(null)}
        draggable={p.canEdit} onDragStart={ev => p.onDragEntry(e, ev)} onDragEnd={p.onDragEnd} title={p.canEdit ? 'Arraste para outro dia (Ctrl ao soltar copia)' : undefined}>
        <span className="bar" style={{ background: c }} />
        {showDate && <span className="date">{brDate(e.day)}</span>}
        <div className="body">
          {showProject && (
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', marginBottom: 3 }}>
              <button className="dv-pchip" style={tint(c, 13)} disabled={!p.canEdit} title={p.canEdit ? 'Trocar projeto' : undefined} onClick={ev => p.onProjectPop(e, ev.currentTarget)}>
                <span>{pr?.name || 'Projeto removido'}</span>{p.canEdit && <ChevronDown />}
              </button>
              {(pr?.partner_keys || []).slice(0, 3).map(k => { const pa = p.partners.get(k); return pa ? <span key={k} className="dv-tag" style={tint(pa.color, 9)}>{pa.name}</span> : null; })}
            </div>
          )}
          <div className="txt" title={p.canEdit ? 'Clique para editar' : undefined}
            onClick={ev => { if (p.canEdit && ev.currentTarget.contentEditable !== 'true') inlineEdit(ev.currentTarget, v => p.onEditBody(e, v)); }}>{e.body}</div>
          {e.tag_keys.length > 0 && (
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
              {e.tag_keys.map(k => { const t = p.tags.get(k); return t ? <button key={k} className="dv-tag" style={tint(t.color, 12)} disabled={!p.canEdit} onClick={() => p.onRemoveTag(e, k)} title="Remover tag">#{t.name}{p.canEdit && <span className="x">×</span>}</button> : null; })}
            </div>
          )}
        </div>
        <div className="side">
          {p.canEdit && (
            <span className="tools">
              <button className="dv-ib sm" title="Adicionar tag" onClick={ev => p.onTagPop(e, ev.currentTarget)}><TagIcon /></button>
              <button className="dv-ib sm" title="Continuar no próximo dia útil" onClick={() => p.onContinue(e)}><CornerDownRight /></button>
              <button className="dv-ib sm" title="Abrir projeto" onClick={() => p.onOpenProject(e.project_id)}><PanelRightOpen /></button>
              <button className="dv-ib sm" title="Mais ações" onClick={ev => p.onMenu(e, ev.currentTarget)}><Ellipsis /></button>
            </span>
          )}
          <button className="dv-avs" title="Responsável e quem acompanha" disabled={!p.canEdit} onClick={ev => p.onPeoplePop(e, ev.currentTarget)}>
            {resp ? <Avatar person={resp} /> : <span className="ph"><UserPlus /></span>}
            {fol.map(f => <Avatar key={f.id} person={f} follower />)}
          </button>
        </div>
      </div>
    );
  };

  const projectSummary = (entries: DailyEntry[]) => clusterByProject(entries).map(list => {
    const pr = p.projects.get(list[0].project_id);
    return <span key={list[0].project_id} className="dv-tag" style={{ ...tint(projectColor(list[0].project_id), 13), fontWeight: 600 }}>{pr?.name}{list.length > 1 ? ` ·${list.length}` : ''}</span>;
  });

  let lastMonth = '';
  return (
    <section className="dv-P" style={{ ['--pacc' as string]: '#7c3aed', width: 640 }} data-nopan data-mini="#7c3aed">
      <div className="dv-Ph">
        <span className="dv-Pic"><NotebookPen /></span>
        <h3>Registros</h3>
        <span className="dv-n">{p.shown} {p.shown === 1 ? 'registro' : 'registros'}</span>
        <span style={{ flex: 1 }} />
        <button className="dv-ib" title="Expandir todos" onClick={() => p.onAll(false)}><ChevronsUpDown /></button>
        <button className="dv-ib" title="Recolher todos" onClick={() => p.onAll(true)}><ChevronsDownUp /></button>
      </div>
      <div className="dv-views">
        {VIEWS.map(([k, label, icon]) => <button key={k} className={`dv-vw${p.view === k ? ' on' : ''}`} onClick={() => p.onView(k)}>{icon}{label}</button>)}
      </div>
      <div className="dv-fbar">
        {p.filterLabels.map(f => (
          <button key={f.key} className={`dv-fp${p.filters[f.key].length ? ' on' : ''}`} onClick={ev => p.onFilterPop(f.key, ev.currentTarget)}>
            {f.label}{p.filters[f.key].length > 0 && <b>{p.filters[f.key].length}</b>}<ChevronDown />
          </button>
        ))}
        <span style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          <button className="dv-fp" onClick={ev => p.onSortPop(ev.currentTarget)}><ArrowDownUp />{p.sort === 'desc' ? 'Mais recentes primeiro' : 'Mais antigos primeiro'}</button>
          <button className="dv-fp" onClick={ev => p.onGroupPop(ev.currentTarget)}><LayoutList />Agrupar: <b>{GROUP_LABEL[p.group]}</b></button>
        </span>
      </div>
      {(activeChips.length > 0 || p.filters.q.trim()) && (
        <div className="dv-active">
          {activeChips.map(c => <span key={c.key + c.value} className="dv-fp on">{c.text}<button className="dv-ib sm" style={{ padding: 0 }} aria-label="Remover filtro" onClick={() => p.onRemoveFilter(c.key, c.value)}><X /></button></span>)}
          {p.filters.q.trim() && <span className="dv-fp on">Busca: "{p.filters.q.trim()}"</span>}
          <button className="dv-link" onClick={p.onClear}>Limpar</button>
          <span className="cnt">{p.shown} de {p.total} registros</span>
        </div>
      )}
      <div ref={listRef} className="dv-list" data-wheel-own>
        {p.draft && <DraftRow draft={p.draft} project={p.projects.get(p.draft.projectId)} color={projectColor(p.draft.projectId)} onSave={p.onDraftSave} onCancel={p.onDraftCancel} />}
        {p.groups.map(g => {
          const collapsed = p.isCollapsed(g.key);
          let monthHeader: React.ReactNode = null;
          if (p.group === 'day') {
            const mk = g.key.slice(0, 7);
            if (mk !== lastMonth) {
              lastMonth = mk;
              const inMonth = p.groups.filter(x => x.key.startsWith(mk)).flatMap(x => x.entries);
              monthHeader = <div className="dv-mh" key={'m' + mk}><b>{MONTHS[Number(mk.slice(5)) - 1]} {mk.slice(0, 4)}</b><span>{plural(inMonth.length, 'registro', 'registros')} · {plural(new Set(inMonth.map(e => e.project_id)).size, 'projeto', 'projetos')}</span></div>;
            }
          }
          let head: React.ReactNode;
          if (p.group === 'day') {
            const b = p.b2c.get(g.key);
            head = (
              <>
                <span className={`t${g.key === p.today ? ' today' : ''}`}>{WEEKDAYS[weekday(g.key)]}, {brDate(g.key)}{g.key === p.today ? ' · hoje' : g.key > p.today ? ' · planejado' : ''}</span>
                {collapsed ? <span className="chips">{projectSummary(g.entries)}</span>
                  : <span className="m">{plural(new Set(g.entries.map(e => e.project_id)).size, 'projeto', 'projetos')}{b?.emissions != null ? ` · ${plural(b.emissions, 'emissão B2C', 'emissões B2C')}` : ''}</span>}
                {p.canEdit && <button className="dv-ib sm add" title="Registrar neste dia" onClick={ev => { ev.stopPropagation(); p.onAdd(g.key, ev.currentTarget); }}><Plus /></button>}
              </>
            );
          } else if (p.group === 'project') {
            const pr = p.projects.get(g.key), days = [...new Set(g.entries.map(e => e.day))].sort();
            head = (
              <>
                <span className="dv-pchip" style={tint(projectColor(g.key), 13)}><span>{pr?.name}</span></span>
                <span className="m">{p.frentes.get(pr?.frente_key || '')?.name}{pr?.structure_card_id && p.campaigns?.get(pr.structure_card_id) ? ` · campanha ${p.campaigns.get(pr.structure_card_id)}` : ''} · {days.length} {days.length === 1 ? 'dia' : 'dias'} · {brDate(days[0])} a {brDate(days[days.length - 1])}</span>
                <button className="dv-ib sm add" title="Abrir projeto" onClick={ev => { ev.stopPropagation(); p.onOpenProject(g.key); }}><PanelRightOpen /></button>
                {p.canEdit && <button className="dv-ib sm" title="Registrar hoje neste projeto" onClick={ev => { ev.stopPropagation(); p.onAdd(p.today, ev.currentTarget, g.key); }}><Plus /></button>}
              </>
            );
          } else {
            const f = p.frentes.get(g.key);
            head = <><span className="t" style={{ color: f?.color }}>{f?.name || 'Sem frente'}</span><span className="m">{plural(new Set(g.entries.map(e => e.project_id)).size, 'projeto', 'projetos')} · {plural(g.entries.length, 'registro', 'registros')}</span></>;
          }
          return (
            <div key={g.key}>
              {monthHeader}
              <div className={`dv-gh${p.group === 'day' && p.dropDay === g.key ? ' drop' : ''}`} data-day={p.group === 'day' ? g.key : undefined} onClick={() => p.onToggle(g.key)}
                onDragOver={p.group === 'day' ? ev => p.onDragOverDay(g.key, ev) : undefined} onDrop={p.group === 'day' ? ev => p.onDropDay(g.key, ev) : undefined}>
                {collapsed ? <ChevronRight /> : <ChevronDown />}{head}
              </div>
              {!collapsed && (p.group === 'day'
                ? clusterByProject(g.entries).flatMap(list => list.map((e, i) => row(e, i === 0, false)))
                : g.entries.map(e => row(e, p.group === 'frente', true)))}
            </div>
          );
        })}
        {!p.groups.length && !p.draft && <div className="dv-foot">{p.total ? 'Nenhum registro com esses filtros.' : 'Nenhum registro neste período. Use "+ Registro de hoje" para começar.'}</div>}
        <div className="dv-foot">
          {p.prevMonth
            ? <button className="cs-btn" style={{ margin: '0 auto' }} onClick={p.onMore}><History size={14} />Ver registros de {MONTHS[Number(p.prevMonth.slice(5)) - 1]}</button>
            : <span>Início do histórico.</span>}
        </div>
      </div>
    </section>
  );
}
