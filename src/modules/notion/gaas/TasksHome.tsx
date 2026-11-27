/**
 * Blocos vivos do Início de Tarefas (desenho de 26/11/2026): abaixo do conteúdo da página (o recado 👋 e o que o
 * time escrever), "O que precisa andar?" com os números da semana e um bloco por página de frente, no formato do
 * "Explorar por assunto" da Wiki. A página continua sendo um organizador de páginas do Notion: isto só lê.
 */
import { useEffect, useMemo, useState } from 'react';
import { ChevronRight, EyeOff, Eye } from 'lucide-react';
import { supabase } from '../../../services/supabaseClient';
import type { WorkItem } from '../../../components/growth-learning/development/workModel';
import type { NotionPage } from '../types/notion';
import type { DailyProjectRef } from './tasksAdapter';

interface Props {
  tasks: WorkItem[];
  projects: DailyProjectRef[];
  /** Páginas de frente (as da seção Frentes e a do SDD), na ordem da barra lateral. */
  pages: NotionPage[];
  creditBasesPage?: NotionPage;
  me: string | null;
  onOpenPage: (id: string) => void;
  onOpenTemplates: () => void;
  /** Cor de cada frente (chave da Visão Daily), para os chips de projeto. */
  frontColors?: Map<string, string>;
}
interface Entry { day: string; project_id: string; work_ids: string[] }

const sp = (d = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(d);
const ago = (n: number) => sp(new Date(Date.now() - n * 86400000));
const closed = (s: string) => s === 'concluida' || s === 'cancelada';

export function TasksHome({ tasks, projects, pages, creditBasesPage, me, onOpenPage, onOpenTemplates, frontColors }: Props) {
  const key = `gaas.notion.home.hidden.${me || 'anon'}`;
  const [hidden, setHidden] = useState(() => { try { return localStorage.getItem(key) === '1'; } catch { return false; } });
  const [entries, setEntries] = useState<Entry[] | null>(null);
  useEffect(() => {
    if (hidden) return;
    void supabase.from('daily_entries').select('day,project_id,work_ids').is('deleted_at', null).gte('day', ago(31)).lte('day', sp()).limit(3000)
      .then(({ data }) => setEntries((data || []) as Entry[]));
  }, [hidden]);
  const toggle = () => { setHidden(h => { try { localStorage.setItem(key, h ? '0' : '1'); } catch { /* preferência local */ } return !h; }); };

  const today = sp(), weekAgo = ago(7), twoWeeks = ago(14);
  const monthStart = today.slice(0, 8) + '01';
  const projById = useMemo(() => new Map(projects.map(p => [p.id, p])), [projects]);
  const stats = useMemo(() => {
    const subs = tasks.filter(t => t.parent_task_id);
    return {
      loose: (entries || []).filter(e => e.day >= monthStart && !(e.work_ids || []).length).length,
      dueToday: tasks.filter(t => t.due_date === today && !closed(t.status)).length,
      late: tasks.filter(t => t.due_date && t.due_date < today && !closed(t.status)).length,
      blocked: tasks.filter(t => t.status === 'bloqueada').length,
      doneWeek: tasks.filter(t => t.status === 'concluida' && (t.details?.completed_on || '') >= weekAgo).length,
      subsOpen: subs.filter(s => !closed(s.status)).length,
    };
  }, [tasks, entries, today, weekAgo, monthStart]);

  const tile = (page: NotionPage) => {
    const fronts = page.taskFronts || [];
    const inPage = (t: WorkItem) => fronts.includes(String(t.front_key || ''));
    const cards = tasks.filter(t => !t.parent_task_id && inPage(t) && !closed(t.status));
    const subs = tasks.filter(t => t.parent_task_id && inPage(t));
    const done = subs.filter(s => closed(s.status)).length;
    const recent = (entries || []).filter(e => e.day >= twoWeeks && fronts.includes(projById.get(e.project_id)?.frente_key || ''));
    const loose = recent.filter(e => !(e.work_ids || []).length).length;
    const byProject = new Map<string, number>();
    for (const e of recent) byProject.set(e.project_id, (byProject.get(e.project_id) || 0) + 1);
    const top = [...byProject.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
    return (
      <button key={page.id} type="button" onClick={() => onOpenPage(page.id)}
        className="grid gap-2 rounded-[14px] border border-[var(--notion-border)] bg-[var(--notion-card)] p-4 text-left hover:border-cyan-300 hover:bg-cyan-50/30">
        <span className="flex items-center gap-2 text-base font-bold text-[var(--notion-text)]"><span className="text-lg leading-none">{page.icon}</span>{page.title}</span>
        <span className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--notion-text-muted)]">
          <span><b className="mr-1 text-[15px] tabular-nums text-[var(--notion-text)]">{cards.length}</b>{cards.length === 1 ? 'card aberto' : 'cards abertos'}</span>
          {subs.length > 0 && <span><b className="mr-1 text-[15px] tabular-nums text-[var(--notion-text)]">{done}/{subs.length}</b>Sub Tarefas</span>}
          {entries && loose > 0 && <span title="Registros da Visão Daily nos últimos 14 dias, nos projetos desta página, sem vínculo com card"><b className="mr-1 text-[15px] tabular-nums text-amber-700">{loose}</b>registros sem card</span>}
        </span>
        {subs.length > 0 && <span className="h-1.5 overflow-hidden rounded bg-[var(--notion-hover)]"><span className="block h-full bg-green-600" style={{ width: `${(done / subs.length) * 100}%` }} /></span>}
        {top.length > 0 && <span className="flex flex-wrap gap-1">{top.map(([id, n]) => { const c = frontColors?.get(projById.get(id)?.frente_key || '') || '#64748b'; return <span key={id} className="rounded px-1.5 py-0.5 text-[11.5px] font-semibold" style={{ background: `color-mix(in srgb, ${c} 14%, white)`, color: `color-mix(in srgb, ${c} 75%, black)` }}>{projById.get(id)?.name || 'Projeto'} {n}</span>; })}</span>}
        <span className="inline-flex items-center gap-1 text-xs font-bold text-cyan-700">Abrir quadro <ChevronRight size={13} /></span>
      </button>
    );
  };

  if (hidden) return (
    <div className="nt-page-inset px-12"><button type="button" onClick={toggle} className="inline-flex items-center gap-1 text-xs text-[var(--notion-text-muted)] hover:text-[var(--notion-text)]"><Eye size={13} />Mostrar "O que precisa andar?"</button></div>
  );
  const stat = (v: number | null, l: string, s: string, warn = false) => (
    <div className={`rounded-xl border px-3.5 py-3 ${warn && v ? 'border-amber-200 bg-amber-50' : 'border-[var(--notion-border)] bg-[var(--notion-card)]'}`}>
      <div className={`text-2xl font-bold tabular-nums ${warn && v ? 'text-amber-700' : 'text-[var(--notion-text)]'}`}>{v ?? '…'}</div>
      <div className="text-[12.5px] text-[var(--notion-text)]">{l}</div>
      <div className="text-[11.5px] text-[var(--notion-text-muted)]">{s}</div>
    </div>
  );
  return (
    <section className="nt-page-inset px-12 pb-12" aria-label="O que precisa andar?">
      <div className="mb-5 flex flex-wrap gap-1.5 text-xs text-[var(--notion-text-muted)]" aria-label="O que dá para fazer nas páginas">
        {[['/', 'blocos em qualquer página'], ['Bases', 'com visões Quadro, Tabela e Calendário'], ['Propriedades', 'e filtros por página'], ['Modelos', 'de página e de Tarefa'], ['Favoritos', 'ícones e capa'], ['Páginas', 'dentro de páginas']].map(([b2, t2]) =>
          <span key={b2} className="rounded-md bg-[var(--notion-hover)] px-2 py-0.5"><b className="text-[var(--notion-text)]">{b2}</b> {t2}</span>)}
      </div>
      <div className="flex items-baseline gap-3">
        <h2 className="text-xl font-bold text-[var(--notion-text)]">O que precisa andar?</h2>
        <span className="text-xs text-[var(--notion-text-muted)]">Visão Daily e Tarefas juntas</span>
        <button type="button" onClick={toggle} className="ml-auto inline-flex items-center gap-1 text-xs text-[var(--notion-text-muted)] hover:text-[var(--notion-text)]"><EyeOff size={13} />Ocultar</button>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {stat(entries ? stats.loose : null, 'registros da Daily sem card', 'neste mês · vincule ou crie card', true)}
        {stat(stats.dueToday, 'vencem hoje', stats.late ? `${stats.late} ${stats.late === 1 ? 'atrasada' : 'atrasadas'}` : 'nenhuma atrasada', stats.late > 0)}
        {stat(stats.blocked, 'bloqueadas', `${stats.subsOpen} Sub Tarefas abertas`)}
        {stat(stats.doneWeek, 'concluídas na semana', 'desde ' + `${weekAgo.slice(8, 10)}/${weekAgo.slice(5, 7)}`)}
      </div>
      <h3 className="mb-2 mt-6 text-[15px] font-bold text-[var(--notion-text)]">Explorar por página</h3>
      <div className="grid gap-3 md:grid-cols-2">{pages.map(tile)}</div>
      <h3 className="mb-2 mt-6 text-[15px] font-bold text-[var(--notion-text)]">Atalhos</h3>
      <div className="grid gap-2.5 md:grid-cols-3">
        {creditBasesPage && <button type="button" onClick={() => onOpenPage(creditBasesPage.id)} className="rounded-xl border border-[var(--notion-border)] bg-[var(--notion-card)] px-3.5 py-2.5 text-left text-sm hover:border-cyan-300"><b className="block">{creditBasesPage.icon} {creditBasesPage.title}</b><span className="text-xs text-[var(--notion-text-muted)]">pedidos, validade e Kanban</span></button>}
        <button type="button" onClick={onOpenTemplates} className="rounded-xl border border-[var(--notion-border)] bg-[var(--notion-card)] px-3.5 py-2.5 text-left text-sm hover:border-cyan-300"><b className="block">✨ Modelos</b><span className="text-xs text-[var(--notion-text-muted)]">páginas e Tarefas prontas para usar</span></button>
        <a href="?view=learning&section=vault" className="rounded-xl border border-[var(--notion-border)] bg-[var(--notion-card)] px-3.5 py-2.5 text-left text-sm hover:border-cyan-300"><b className="block">📚 Estratégias da Wiki</b><span className="text-xs text-[var(--notion-text-muted)]">notas que ligam a cards</span></a>
      </div>
    </section>
  );
}
