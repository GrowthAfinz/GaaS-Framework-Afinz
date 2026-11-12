import { useEffect, useState } from 'react';
import { CalendarRange, FileText, FolderKanban, Layers, ListChecks, Plus, SquareKanban, Users, X } from 'lucide-react';
import {
  FALLBACK_COLOR, WEEKDAYS, brDate, weekday,
  type DailyEntry, type DailyFrente, type DailyPartner, type DailyPerson, type DailyProject,
} from './dailyModel';
import { Avatar, tint } from './DailyPopovers';
import { loadBoardCampaigns, loadInitiatives, loadProjectEntries, type BoardCampaign } from './dailyService';

interface Props {
  project: DailyProject; frentes: DailyFrente[]; partners: DailyPartner[]; people: Map<string, DailyPerson>; canEdit: boolean; refreshKey: number;
  onSave: (body: Record<string, unknown>) => Promise<void>; onClose: () => void; onAddToday: () => void; onOpenWiki: (note: string) => void;
}

/** Página do projeto: propriedades editáveis e a linha do tempo com todos os registros. */
export function DailyProjectDrawer({ project, frentes, partners, people, canEdit, refreshKey, onSave, onClose, onAddToday, onOpenWiki }: Props) {
  const [entries, setEntries] = useState<DailyEntry[] | null>(null);
  const [initiatives, setInitiatives] = useState<{ id: string; title: string }[]>([]);
  const [campaigns, setCampaigns] = useState<BoardCampaign[]>([]);
  const [name, setName] = useState(project.name);
  const [note, setNote] = useState(project.wiki_note);
  useEffect(() => { setName(project.name); setNote(project.wiki_note); }, [project]);
  useEffect(() => { let alive = true; setEntries(null); void loadProjectEntries(project.id).then(r => { if (alive) setEntries(r); }).catch(() => { if (alive) setEntries([]); }); return () => { alive = false; }; }, [project.id, refreshKey]);
  useEffect(() => { void loadInitiatives().then(setInitiatives); void loadBoardCampaigns().then(setCampaigns); }, []);
  useEffect(() => { const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); }; document.addEventListener('keydown', k); return () => document.removeEventListener('keydown', k); }, [onClose]);

  const frente = frentes.find(f => f.key === project.frente_key), color = frente?.color || FALLBACK_COLOR;
  const days = [...new Set((entries || []).map(e => e.day))].sort();
  const persons = [...new Set((entries || []).flatMap(e => [e.responsible_id, ...e.follower_ids]).filter(Boolean) as string[])].map(id => people.get(id)).filter(Boolean) as DailyPerson[];

  return (
    <div className="dv-drawer" onPointerDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <aside role="dialog" aria-modal="true" aria-label={project.name}>
        <div className="top"><FolderKanban size={14} />Projetos / Visão Daily<span style={{ flex: 1 }} /><button className="dv-ib" aria-label="Fechar" onClick={onClose}><X /></button></div>
        <div className="in">
          <div style={{ height: 6, width: 64, borderRadius: 4, background: color, marginBottom: 14 }} />
          <h2 contentEditable={canEdit} suppressContentEditableWarning
            onBlur={e => { const v = (e.currentTarget.textContent || '').trim(); if (v.length >= 2 && v !== project.name) void onSave({ name: v }); else e.currentTarget.textContent = name; }}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur(); } }}>{name}</h2>
          {project.archived && <p style={{ fontSize: 12, color: '#b45309', marginTop: 6 }}>Projeto arquivado{project.merged_into ? ' (juntado em outro projeto)' : ''}.</p>}
          <div className="dv-props">
            <span className="k"><Layers />Frente</span>
            <select value={project.frente_key} disabled={!canEdit} onChange={e => void onSave({ frente_key: e.target.value })}>
              {frentes.filter(f => !f.archived || f.key === project.frente_key).map(f => <option key={f.key} value={f.key}>{f.name}</option>)}
            </select>
            <span className="k" style={{ alignSelf: 'start', paddingTop: 4 }}><Users />Parceiros</span>
            <span style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {partners.filter(p => !p.archived || project.partner_keys.includes(p.key)).map(p => {
                const on = project.partner_keys.includes(p.key);
                return <button key={p.key} className="dv-tag" disabled={!canEdit} style={on ? { ...tint(p.color, 14), fontWeight: 600 } : { background: '#fff', color: '#94a3b8', border: '1px dashed #cbd5e1' }}
                  onClick={() => void onSave({ partner_keys: on ? project.partner_keys.filter(k => k !== p.key) : [...project.partner_keys, p.key] })}>{p.name}</button>;
              })}
            </span>
            <span className="k"><FileText />Nota do tema</span>
            <span style={{ display: 'flex', gap: 6 }}>
              <input value={note} disabled={!canEdit} placeholder="Caminho da nota, ex.: 05-Estrategia/Estrategia-Pool-de-Ofertas-Visa.md" onChange={e => setNote(e.target.value)} onBlur={() => { if (note.trim() !== project.wiki_note) void onSave({ wiki_note: note.trim() }); }} />
              {project.wiki_note && <button className="cs-btn" onClick={() => onOpenWiki(project.wiki_note)}>Abrir</button>}
            </span>
            <span className="k"><SquareKanban />Campanha do board</span>
            <select value={project.structure_card_id || ''} disabled={!canEdit} onChange={e => void onSave({ structure_card_id: e.target.value })}>
              <option value="">Sem campanha na Estrutura CRM</option>
              {project.structure_card_id && !campaigns.some(c => c.id === project.structure_card_id) && <option value={project.structure_card_id}>Campanha arquivada</option>}
              {[...new Set(campaigns.map(c => c.path))].map(path => (
                <optgroup key={path} label={path}>{campaigns.filter(c => c.path === path).map(c => <option key={c.id} value={c.id}>{c.title}</option>)}</optgroup>
              ))}
            </select>
            <span className="k"><ListChecks />Iniciativa</span>
            <select value={project.initiative_id || ''} disabled={!canEdit} onChange={e => void onSave({ initiative_id: e.target.value })}>
              <option value="">Sem iniciativa em Tarefas e atividades</option>
              {initiatives.map(i => <option key={i.id} value={i.id}>{i.title}</option>)}
            </select>
            <span className="k"><CalendarRange />Dias com registro</span>
            <span>{entries === null ? 'Carregando…' : days.length ? `${days.length} ${days.length === 1 ? 'dia' : 'dias'} · de ${brDate(days[0])} a ${brDate(days[days.length - 1])}` : 'Nenhum registro ainda'}</span>
            <span className="k"><Users />Pessoas</span>
            <span style={{ display: 'flex' }}>{persons.length ? persons.map(p => <Avatar key={p.id} person={p} />) : <span style={{ color: '#94a3b8' }}>ninguém marcado ainda</span>}</span>
          </div>
          <div className="dv-tl" style={{ ['--tlc' as string]: `color-mix(in srgb, ${color} 30%, white)`, ['--tlc2' as string]: color }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <b style={{ fontSize: 15 }}>Evolução</b>
              {canEdit && !project.archived && <button className="cs-btn" style={{ marginLeft: 'auto', height: 28 }} onClick={onAddToday}><Plus size={14} />Registrar hoje</button>}
            </div>
            {entries === null ? <p style={{ fontSize: 13, color: '#94a3b8' }}>Carregando registros…</p> : (
              <ol>{entries.map(e => <li key={e.id}><div className="d">{WEEKDAYS[weekday(e.day)]}, {brDate(e.day)}/{e.day.slice(0, 4)}</div><div className="t">{e.body}</div></li>)}</ol>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
