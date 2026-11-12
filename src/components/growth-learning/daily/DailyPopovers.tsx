import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type React from 'react';
import { Check, FolderPlus, Plus, Search, Settings2 } from 'lucide-react';
import { getLocalViewport, toLocalRect } from '../../../context/UIScaleContext';
import { FALLBACK_COLOR, initials, personColor, type DailyFrente, type DailyPerson, type DailyProject, type DailyTag } from './dailyModel';

export interface Anchor { left: number; right: number; top: number; bottom: number }
export const anchorOf = (el: Element): Anchor => toLocalRect(el.getBoundingClientRect());
export const tint = (color: string, pct: number): React.CSSProperties => ({ background: `color-mix(in srgb, ${color} ${pct}%, white)`, color: `color-mix(in srgb, ${color} 78%, black)` });
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Caixa flutuante ancorada num elemento; fecha com Esc ou clique fora. Fica fora do palco transformado. */
export function Popover({ anchor, width = 280, onClose, children }: { anchor: Anchor; width?: number; onClose: () => void; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number }>({ left: anchor.left, top: anchor.bottom + 6 });
  const close = useRef(onClose); close.current = onClose;
  useLayoutEffect(() => {
    const el = ref.current; if (!el) return;
    const vw = getLocalViewport(), h = el.offsetHeight;
    const left = Math.max(8, Math.min(vw.width - width - 8, anchor.left));
    const top = anchor.bottom + h + 8 > vw.height ? Math.max(8, anchor.top - h - 6) : anchor.bottom + 6;
    setPos({ left, top });
  }, [anchor, width, children]);
  useEffect(() => {
    const down = (e: PointerEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) close.current(); };
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); close.current(); } };
    const t = window.setTimeout(() => document.addEventListener('pointerdown', down), 0);
    document.addEventListener('keydown', key, true);
    return () => { window.clearTimeout(t); document.removeEventListener('pointerdown', down); document.removeEventListener('keydown', key, true); };
  }, []);
  return <div ref={ref} className="dv-pop" style={{ left: pos.left, top: pos.top, width }} onPointerDown={e => e.stopPropagation()}>{children}</div>;
}

function SearchBox({ value, onChange, placeholder, onEnter }: { value: string; onChange: (v: string) => void; placeholder: string; onEnter?: () => void }) {
  return (
    <div style={{ padding: 10, borderBottom: '1px solid #f1f5f9', position: 'relative' }}>
      <Search size={13} style={{ position: 'absolute', left: 19, top: 20, color: '#94a3b8' }} />
      <input autoFocus type="search" value={value} placeholder={placeholder} style={{ paddingLeft: 26 }} onChange={e => onChange(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && onEnter) { e.preventDefault(); onEnter(); } }} />
    </div>
  );
}

export function ProjectPicker({ projects, frentes, recent, current, onPick, onCreate, onConfig }: {
  projects: DailyProject[]; frentes: Map<string, DailyFrente>; recent: string[]; current?: string;
  onPick: (id: string) => void; onCreate?: (name: string) => void; onConfig?: () => void;
}) {
  const [q, setQ] = useState('');
  const active = projects.filter(p => !p.archived);
  const match = (p: DailyProject) => !q.trim() || norm(p.name).includes(norm(q.trim()));
  const rec = recent.map(id => active.find(p => p.id === id)).filter((p): p is DailyProject => Boolean(p) && match(p as DailyProject)).slice(0, 6);
  const rest = active.filter(p => !rec.includes(p) && match(p));
  const exact = active.some(p => norm(p.name) === norm(q.trim()));
  const item = (p: DailyProject) => {
    const f = frentes.get(p.frente_key);
    return (
      <button key={p.id} className="dv-pi" onClick={() => onPick(p.id)}>
        <span className="dv-sw" style={{ background: f?.color || FALLBACK_COLOR }} />
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
        {current === p.id ? <Check style={{ marginLeft: 'auto', color: '#0e7490' }} /> : <span className="r">{f?.name}</span>}
      </button>
    );
  };
  const first = rec[0] || rest[0];
  return (
    <>
      <SearchBox value={q} onChange={setQ} placeholder="Buscar ou criar projeto" onEnter={() => { if (q.trim() && !exact && onCreate) onCreate(q.trim()); else if (first) onPick(first.id); }} />
      <div className="lst">
        {rec.length > 0 && <><div className="lbl">Continuar dos últimos dias</div>{rec.map(item)}<div className="lbl">Todos os projetos</div></>}
        {rest.map(item)}
        {!rec.length && !rest.length && !q.trim() && <div className="dv-empty">Nenhum projeto ainda. Digite um nome para criar o primeiro.</div>}
        {q.trim() && !exact && onCreate && <button className="dv-pi acc" onClick={() => onCreate(q.trim())}><FolderPlus />Criar projeto "{q.trim()}"</button>}
      </div>
      {onConfig && <div className="ft" style={{ padding: 0 }}><button className="dv-pi acc" onClick={onConfig}><Settings2 />Editar projetos</button></div>}
    </>
  );
}

export function TagPicker({ tags, selected, onToggle, onCreate, onConfig }: { tags: DailyTag[]; selected: string[]; onToggle: (key: string) => void; onCreate: (name: string) => void; onConfig?: () => void }) {
  const [q, setQ] = useState('');
  const list = tags.filter(t => (!t.archived || selected.includes(t.key)) && (!q.trim() || norm(t.name).includes(norm(q.trim()))));
  const exact = tags.some(t => norm(t.name) === norm(q.trim()));
  return (
    <>
      <SearchBox value={q} onChange={setQ} placeholder="Buscar ou criar tag" onEnter={() => { if (q.trim() && !exact) { onCreate(q.trim()); setQ(''); } }} />
      <div className="lst">
        {list.map(t => (
          <button key={t.key} className="dv-pi" onClick={() => onToggle(t.key)}>
            <span className={`dv-cb${selected.includes(t.key) ? ' on' : ''}`}>{selected.includes(t.key) && <Check />}</span>
            <span className="dv-tag" style={tint(t.color, 12)}>#{t.name}</span>
          </button>
        ))}
        {!list.length && !q.trim() && <div className="dv-empty">Nenhuma tag ainda.</div>}
        {q.trim() && !exact && <button className="dv-pi acc" onClick={() => { onCreate(q.trim()); setQ(''); }}><Plus />Criar tag "{q.trim()}"</button>}
      </div>
      {onConfig && <div className="ft" style={{ padding: 0 }}><button className="dv-pi acc" onClick={onConfig}><Settings2 />Editar tags</button></div>}
    </>
  );
}

export function Avatar({ person, follower, size }: { person: DailyPerson | undefined; follower?: boolean; size?: number }) {
  if (!person) return null;
  const s = size ? { width: size, height: size, fontSize: size * 0.38, border: 'none' } : {};
  return <span className={`dv-av${follower ? ' f' : ''}`} style={{ background: personColor(person.id), ...s }} title={`${person.name}${follower ? ' · acompanhando' : ' · responsável'}`}>{initials(person.name)}</span>;
}

export function PeoplePicker({ people, me, responsible, followers, subject, onChange }: {
  people: DailyPerson[]; me: string | null; responsible: string | null; followers: string[]; subject: string;
  onChange: (responsible: string | null, followers: string[]) => void;
}) {
  const [q, setQ] = useState('');
  const list = people.filter(p => !q.trim() || norm(p.name).includes(norm(q.trim())));
  return (
    <>
      <div className="hd"><b>Pessoas no registro</b><div className="s">{subject}</div></div>
      <SearchBox value={q} onChange={setQ} placeholder="Buscar pessoa" />
      <div className="lst">
        {list.map(p => {
          const own = responsible === p.id, fol = own || followers.includes(p.id);
          return (
            <div key={p.id} className="dv-person">
              <Avatar person={p} size={28} />
              <span className="n">{p.name}{p.id === me ? ' (você)' : ''}</span>
              <button className={`dv-tg${own ? ' own' : ''}`} title="Definir como responsável" onClick={() => onChange(own ? null : p.id, own ? followers : followers.filter(x => x !== p.id))}>{own ? 'Responsável' : 'Resp.'}</button>
              <button className={`dv-tg${fol ? ' on' : ''}`} disabled={own} onClick={() => onChange(responsible, followers.includes(p.id) ? followers.filter(x => x !== p.id) : [...followers, p.id])}>{fol ? '✓ Acompanhando' : 'Acompanhar'}</button>
            </div>
          );
        })}
        {!list.length && <div className="dv-empty">Ninguém encontrado.</div>}
      </div>
      <div className="ft">Quem acompanha aparece no filtro "Que eu acompanho".</div>
    </>
  );
}

export interface FilterOption { key: string; label: string; color: string }
export function MultiFilter({ options, selected, label, onToggle, onClear }: { options: FilterOption[]; selected: string[]; label: string; onToggle: (key: string) => void; onClear: () => void }) {
  const [q, setQ] = useState('');
  const list = useMemo(() => options.filter(o => !q.trim() || norm(o.label).includes(norm(q.trim()))), [options, q]);
  return (
    <>
      <SearchBox value={q} onChange={setQ} placeholder={`Filtrar ${label.toLowerCase()}`} />
      <div className="lst">
        {list.map(o => (
          <button key={o.key} className="dv-pi" onClick={() => onToggle(o.key)}>
            <span className={`dv-cb${selected.includes(o.key) ? ' on' : ''}`}>{selected.includes(o.key) && <Check />}</span>
            <span className="dv-sw" style={{ background: o.color, borderRadius: 999 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.label}</span>
          </button>
        ))}
        {!list.length && <div className="dv-empty">Nada encontrado.</div>}
      </div>
      {selected.length > 0 && <div className="ft" style={{ padding: 0 }}><button className="dv-pi acc" onClick={onClear}>Limpar {label.toLowerCase()}</button></div>}
    </>
  );
}

export interface MenuItem { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean; current?: boolean; hint?: string }
export function MenuList({ items, title }: { items: MenuItem[]; title?: string }) {
  return (
    <div className="lst">
      {title && <div className="lbl">{title}</div>}
      {items.map(i => (
        <button key={i.label} className={`dv-pi${i.danger ? ' danger' : ''}`} onClick={i.onClick}>
          {i.icon}
          <span>{i.label}{i.hint && <span style={{ display: 'block', fontSize: 11, color: '#64748b' }}>{i.hint}</span>}</span>
          {i.current && <Check style={{ marginLeft: 'auto', color: '#0e7490' }} />}
        </button>
      ))}
    </div>
  );
}

export function DayPicker({ value, title, shortcuts, onPick }: { value: string; title: string; shortcuts: [string, string][]; onPick: (day: string) => void }) {
  return (
    <div style={{ padding: 12 }}>
      <div className="lbl" style={{ padding: '0 0 6px' }}>{title}</div>
      <input type="date" defaultValue={value} onChange={e => { if (/^\d{4}-\d{2}-\d{2}$/.test(e.target.value)) onPick(e.target.value); }} />
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
        {shortcuts.map(([label, day]) => <button key={label} className="cs-btn" style={{ height: 26, fontSize: 11.5 }} onClick={() => onPick(day)}>{label}</button>)}
      </div>
    </div>
  );
}
