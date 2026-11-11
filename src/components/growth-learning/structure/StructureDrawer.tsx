import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, ChevronUp, Plus, SquareKanban, Trash2, TriangleAlert, X } from 'lucide-react';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { ResultRow } from '../results/results.types';
import { loadEvents } from './structureService';
import {
  B2B2C_WITHOUT_CRM, BU_OPTIONS, MED_META, OBS_META, RESULT_FIELDS, RESULT_FIELD_LABEL, STATUS_META, computeSignal, fmtInt, historyOptions, isDrift,
  type CardSignal, type DataScope, type DeclaredStatus, type Measurement, type ResultField, type StructureCard, type StructureEvent, type StructureLane, type StructurePillar,
} from './structureModel';

type LaneOption = StructureLane & { pillar: StructurePillar };
type Tab = 'res' | 'link' | 'jor' | 'evo' | 'log';
const FIELD_LABEL: Record<string, string> = { title: 'nome', audience: 'público', bus: 'BUs', declared_status: 'status', measurement: 'medição', owner: 'responsável', wiki_note: 'nota da Wiki', external_note: 'observação', data_scope: 'vínculo com dados', lane_id: 'coluna', position: 'ordem', archived: 'arquivamento' };

function BusEditor({ value, disabled, onChange }: { value: string[]; disabled?: boolean; onChange: (next: string[]) => void }) {
  return (
    <div className="cs-bus">
      {value.map(b => <span key={b} className="cs-chip">{b}{!disabled && <button aria-label={`Remover ${b}`} onClick={() => onChange(value.filter(x => x !== b))}>×</button>}</span>)}
      {!disabled && (
        <select value="" aria-label="Adicionar BU ou parceiro" onChange={e => { if (e.target.value) onChange([...value, e.target.value]); }}>
          <option value="">+ adicionar</option>
          <optgroup label="BUs">{BU_OPTIONS.filter(b => !value.includes(b)).map(b => <option key={b}>{b}</option>)}</optgroup>
          <optgroup label="Parceiros B2B2C sem CRM">{B2B2C_WITHOUT_CRM.filter(b => !value.includes(b)).map(b => <option key={b}>{b}</option>)}</optgroup>
        </select>
      )}
    </div>
  );
}

type Cond = Partial<Record<ResultField, string>>;
function toConds(scope: DataScope | null): Cond[] {
  if (!scope) return [{}];
  const base = scope.scope || {};
  return scope.any_of && scope.any_of.length ? scope.any_of.map(c => ({ ...base, ...c })) : [{ ...base }];
}
function fromConds(domain: 'crm' | 'renta', conds: Cond[]): DataScope | null {
  const clean = conds.map(c => Object.fromEntries(Object.entries(c).filter(([, v]) => v))).filter(c => Object.keys(c).length);
  if (!clean.length) return null;
  return clean.length === 1 ? { domain, scope: clean[0] as Record<string, string> } : { domain, scope: {}, any_of: clean as Record<string, string>[] };
}

function LinkEditor({ card, rows, today, editable, onSave }: { card: StructureCard; rows: ResultRow[]; today: string; editable: boolean; onSave: (scope: DataScope | null) => Promise<void> }) {
  const [domain, setDomain] = useState<'crm' | 'renta'>(card.data_scope?.domain || 'crm');
  const [conds, setConds] = useState<Cond[]>(toConds(card.data_scope));
  const [busy, setBusy] = useState(false);
  useEffect(() => { setDomain(card.data_scope?.domain || 'crm'); setConds(toConds(card.data_scope)); }, [card.id, card.revision, card.data_scope]);
  const draft = fromConds(domain, conds);
  const preview = useMemo(() => computeSignal({ data_scope: draft }, rows, today), [draft, rows, today]);
  const total = preview.journeys.reduce((a, j) => a + j.count, 0);
  const options = useMemo(() => Object.fromEntries(RESULT_FIELDS.map(f => [f, historyOptions(rows, domain, f)])) as Record<ResultField, string[]>, [rows, domain]);
  const setPair = (ci: number, field: ResultField, value: string, oldField?: ResultField) => setConds(cs => cs.map((c, i) => {
    if (i !== ci) return c;
    const next = { ...c }; if (oldField && oldField !== field) delete next[oldField]; next[field] = value; return next;
  }));
  const removePair = (ci: number, field: ResultField) => setConds(cs => cs.map((c, i) => { if (i !== ci) return c; const n = { ...c }; delete n[field]; return n; }));
  return (
    <div>
      <p style={{ fontSize: 13, color: '#475569', marginTop: 0 }}>Escolha, a partir do histórico de disparos, o que pertence a esta campanha. Dentro de uma condição os campos se somam; entre condições, vale qualquer uma.</p>
      <div className="cs-field" style={{ maxWidth: 260, marginBottom: 10 }}>
        <label>Base de disparos</label>
        <select value={domain} disabled={!editable} onChange={e => { setDomain(e.target.value as 'crm' | 'renta'); setConds([{}]); }}>
          <option value="crm">Aquisição (activities)</option><option value="renta">Rentabilização (rentabilizacao_activities)</option>
        </select>
      </div>
      {conds.map((c, ci) => (
        <div key={ci} style={{ border: '1px solid #e2e8f0', padding: 10, marginBottom: 8 }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: '#64748b', marginBottom: 6 }}>{ci === 0 ? 'CONDIÇÃO' : 'OU CONDIÇÃO'} {ci + 1}</div>
          {(Object.keys(c) as ResultField[]).map(field => (
            <div className="cs-cond" key={field}>
              <select value={field} disabled={!editable} onChange={e => setPair(ci, e.target.value as ResultField, '', field)}>
                {RESULT_FIELDS.filter(f => f === field || !(f in c)).map(f => <option key={f} value={f}>{RESULT_FIELD_LABEL[f]}</option>)}
              </select>
              <select value={c[field] || ''} disabled={!editable} style={{ flex: 1, minWidth: 0 }} onChange={e => setPair(ci, field, e.target.value)}>
                <option value="">Escolha do histórico</option>
                {options[field].map(v => <option key={v} value={v}>{v}</option>)}
              </select>
              {editable && <button className="cs-icon" aria-label="Remover campo" onClick={() => removePair(ci, field)}><X /></button>}
            </div>
          ))}
          {editable && (
            <div style={{ display: 'flex', gap: 6 }}>
              {RESULT_FIELDS.some(f => !(f in c)) && <button className="cs-btn" onClick={() => { const f = RESULT_FIELDS.find(x => !(x in c))!; setPair(ci, f, ''); }}><Plus />Campo</button>}
              {conds.length > 1 && <button className="cs-btn" onClick={() => setConds(cs => cs.filter((_, i) => i !== ci))}><Trash2 />Remover condição</button>}
            </div>
          )}
        </div>
      ))}
      {editable && <button className="cs-btn" onClick={() => setConds(cs => [...cs, {}])}><Plus />Condição (ou)</button>}
      <div className="cs-kgrid" style={{ marginTop: 14 }}>
        <div className="cs-k"><div className="l">Disparos que casam</div><div className="v">{draft ? fmtInt(total) : 'n/d'}</div><div className="x">histórico todo</div></div>
        <div className="cs-k"><div className="l">Último disparo</div><div className="v" style={{ fontSize: 16 }}>{preview.lastDate || 'n/d'}</div></div>
        <div className="cs-k"><div className="l">Jornadas</div><div className="v">{preview.journeys.length ? new Set(preview.journeys.map(j => j.journey)).size : 0}</div></div>
      </div>
      {editable && (
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <button className="cs-btn pri" disabled={busy} onClick={async () => { setBusy(true); try { await onSave(draft); } finally { setBusy(false); } }}>Salvar vínculo</button>
          {card.data_scope && <button className="cs-btn" disabled={busy} onClick={async () => { setBusy(true); try { await onSave(null); } finally { setBusy(false); } }}>Remover vínculo</button>}
        </div>
      )}
    </div>
  );
}

function ActivityLog({ cardId, revision }: { cardId: string; revision: number }) {
  const [events, setEvents] = useState<StructureEvent[] | null>(null);
  const [error, setError] = useState('');
  useEffect(() => { let alive = true; setEvents(null); loadEvents(cardId).then(e => { if (alive) setEvents(e); }).catch(() => { if (alive) setError('Não foi possível carregar o histórico.'); }); return () => { alive = false; }; }, [cardId, revision]);
  if (error) return <p className="cs-err">{error}</p>;
  if (!events) return <p style={{ color: '#94a3b8', fontSize: 13 }}>Carregando histórico…</p>;
  return (
    <div>
      {events.map(ev => {
        const changed = ev.before_data ? Object.keys(FIELD_LABEL).filter(k => JSON.stringify(ev.before_data?.[k]) !== JSON.stringify(ev.after_data[k])) : [];
        const text = !ev.before_data ? (ev.revision === 1 && !ev.after_data.created_by ? 'Importada do portfólio de campanhas' : 'Campanha criada')
          : changed.includes('archived') ? (ev.after_data.archived ? 'Arquivada' : 'Restaurada')
          : changed.includes('declared_status') ? `Status: ${STATUS_META[ev.before_data.declared_status as DeclaredStatus]?.label} → ${STATUS_META[ev.after_data.declared_status as DeclaredStatus]?.label}`
          : `Alterou ${changed.filter(k => k !== 'position' || !changed.includes('lane_id')).map(k => FIELD_LABEL[k]).join(', ') || 'a campanha'}`;
        return <div className="cs-log" key={ev.id}><time>{new Date(ev.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })} · revisão {ev.revision}</time>{text}</div>;
      })}
    </div>
  );
}

export interface DrawerProps {
  mode: 'view' | 'create'; card: StructureCard | null; signal: CardSignal | null; lanes: LaneOption[]; createLaneId: string | null;
  rows: ResultRow[]; today: string; dataUntil: string; editable: boolean;
  onClose: () => void; onPrev?: () => void; onNext?: () => void;
  onSave: (card: StructureCard, body: Record<string, unknown>, label: string) => Promise<void>;
  onCreate: (body: Record<string, unknown>) => Promise<void>;
}

export function StructureDrawer(p: DrawerProps) {
  const [tab, setTab] = useState<Tab>('res');
  const [title, setTitle] = useState('');
  const [err, setErr] = useState('');
  const [draft, setDraft] = useState({ lane_id: '', declared_status: 'bkl' as DeclaredStatus, measurement: 'n' as Measurement, audience: '', bus: [] as string[], owner: '', wiki_note: '' });
  useEffect(() => { setTitle(p.card?.title || ''); setErr(''); }, [p.card?.id, p.card?.title]);
  useEffect(() => { if (p.mode === 'create') { setTitle(''); setTab('res'); setDraft(d => ({ ...d, lane_id: p.createLaneId || p.lanes[0]?.id || '', audience: '', bus: [], owner: '', wiki_note: '' })); } }, [p.mode, p.createLaneId, p.lanes]);
  useEffect(() => { const k = (e: KeyboardEvent) => { if (e.key === 'Escape') p.onClose(); }; window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, [p]);

  if (p.mode === 'create') {
    const create = async () => {
      if (title.trim().length < 2) { setErr('Dê um nome para a campanha.'); return; }
      try { await p.onCreate({ ...draft, title: title.trim() }); } catch (e) { setErr(e instanceof Error ? e.message : 'Não foi possível criar.'); }
    };
    return (
      <aside className="cs-drawer" aria-label="Nova campanha">
        <div className="cs-dh">
          <div className="cs-crumb"><SquareKanban />Estrutura CRM<ChevronRight />Nova campanha<span style={{ marginLeft: 'auto' }}><button className="cs-icon" aria-label="Fechar" onClick={p.onClose}><X /></button></span></div>
          <input className="cs-dtitle" autoFocus placeholder="Nome da campanha" value={title} onChange={e => { setTitle(e.target.value); setErr(''); }} onKeyDown={e => { if (e.key === 'Enter') create(); }} />
          <div className="cs-err">{err}</div>
        </div>
        <div className="cs-db">
          <div className="cs-fields">
            <div className="cs-field"><label>Coluna</label><select value={draft.lane_id} onChange={e => setDraft({ ...draft, lane_id: e.target.value })}>{p.lanes.map(l => <option key={l.id} value={l.id}>{l.pillar.title} › {l.title}</option>)}</select></div>
            <div className="cs-field"><label>Status declarado</label><select value={draft.declared_status} onChange={e => setDraft({ ...draft, declared_status: e.target.value as DeclaredStatus })}>{Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></div>
            <div className="cs-field full"><label>Público</label><input value={draft.audience} placeholder="Quem recebe esta campanha" onChange={e => setDraft({ ...draft, audience: e.target.value })} /></div>
            <div className="cs-field full"><label>BUs e parceiros</label><BusEditor value={draft.bus} onChange={bus => setDraft({ ...draft, bus })} /></div>
            <div className="cs-field"><label>Responsável</label><input value={draft.owner} placeholder="Time ou pessoa" onChange={e => setDraft({ ...draft, owner: e.target.value })} /></div>
            <div className="cs-field"><label>Medição</label><select value={draft.measurement} onChange={e => setDraft({ ...draft, measurement: e.target.value as Measurement })}>{Object.entries(MED_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></div>
            <div className="cs-field full"><label>Nota canônica na Wiki (opcional)</label><input value={draft.wiki_note} placeholder="10-Resultados/…" onChange={e => setDraft({ ...draft, wiki_note: e.target.value })} /></div>
          </div>
          <p style={{ fontSize: 12.5, color: '#64748b' }}>Depois de criar, ligue a campanha aos disparos na aba Vínculo com dados.</p>
          <div style={{ display: 'flex', gap: 8 }}><button className="cs-btn pri" onClick={create}><Plus />Criar campanha</button><button className="cs-btn" onClick={p.onClose}>Cancelar</button></div>
        </div>
      </aside>
    );
  }

  const card = p.card, signal = p.signal;
  if (!card || !signal) return null;
  const lane = p.lanes.find(l => l.id === card.lane_id);
  const drift = isDrift(card, signal);
  const save = (body: Record<string, unknown>, label: string) => p.onSave(card, body, label).catch(e => setErr(e instanceof Error ? e.message : String(e)));
  const isCrm = signal.domain !== 'renta';
  return (
    <aside className="cs-drawer" aria-label={`Campanha ${card.title}`}>
      <div className="cs-dh">
        <div className="cs-crumb"><SquareKanban />Estrutura CRM<ChevronRight />{lane?.pillar.title}<ChevronRight />{lane?.title}
          <span style={{ marginLeft: 'auto', display: 'flex', gap: 2 }}>
            {p.onPrev && <button className="cs-icon" aria-label="Campanha anterior" onClick={p.onPrev}><ChevronUp /></button>}
            {p.onNext && <button className="cs-icon" aria-label="Próxima campanha" onClick={p.onNext}><ChevronDown /></button>}
            <button className="cs-icon" aria-label="Fechar" onClick={p.onClose}><X /></button>
          </span>
        </div>
        <input className="cs-dtitle" value={title} readOnly={!p.editable} onChange={e => setTitle(e.target.value)}
          onBlur={() => { const v = title.trim(); if (v.length >= 2 && v !== card.title) save({ title: v }, 'Campanha renomeada'); else setTitle(card.title); }}
          onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }} />
        <div className="cs-err">{err}</div>
        <div className="cs-dtabs">{([['res', 'Resumo'], ['link', 'Vínculo com dados'], ['jor', 'Jornadas'], ['evo', 'Evolução'], ['log', 'Atividade']] as [Tab, string][]).map(([t, n]) => <button key={t} className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>{n}</button>)}</div>
      </div>
      <div className="cs-db">
        {tab === 'res' && (
          <>
            {drift && <div className="cs-warn"><TriangleAlert />Declarada como {STATUS_META[card.declared_status].label.toLowerCase()}, mas {signal.observed === 'none' ? 'nenhum disparo casa com o vínculo de dados' : `sem disparo há ${signal.daysSince} dias`}.</div>}
            <div className="cs-fields">
              <div className="cs-field"><label>Status declarado</label><select value={card.declared_status} disabled={!p.editable} onChange={e => save({ declared_status: e.target.value }, `Status: ${STATUS_META[e.target.value as DeclaredStatus].label}`)}>{Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></div>
              <div className="cs-field"><label>Coluna</label><select value={card.lane_id} disabled={!p.editable} onChange={e => save({ lane_id: e.target.value }, 'Campanha movida')}>{p.lanes.map(l => <option key={l.id} value={l.id}>{l.pillar.title} › {l.title}</option>)}</select></div>
              <div className="cs-field full"><label>Público</label><input key={card.revision + 'a'} defaultValue={card.audience} readOnly={!p.editable} onBlur={e => { if (e.target.value.trim() !== card.audience) save({ audience: e.target.value }, 'Público alterado'); }} /></div>
              <div className="cs-field full"><label>BUs e parceiros</label><BusEditor value={card.bus} disabled={!p.editable} onChange={bus => save({ bus }, 'BUs alteradas')} /></div>
              <div className="cs-field"><label>Responsável</label><input key={card.revision + 'o'} defaultValue={card.owner} readOnly={!p.editable} placeholder="Time ou pessoa" onBlur={e => { if (e.target.value.trim() !== card.owner) save({ owner: e.target.value }, 'Responsável alterado'); }} /></div>
              <div className="cs-field"><label>Medição</label><select value={card.measurement} disabled={!p.editable} onChange={e => save({ measurement: e.target.value }, 'Medição alterada')}>{Object.entries(MED_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></div>
              <div className="cs-field full"><label>Nota canônica na Wiki</label><input key={card.revision + 'w'} defaultValue={card.wiki_note} readOnly={!p.editable} placeholder="10-Resultados/…" onBlur={e => { if (e.target.value.trim() !== card.wiki_note) save({ wiki_note: e.target.value }, 'Nota da Wiki alterada'); }} /></div>
              <div className="cs-field full"><label>Observação (dado externo, ressalva)</label><input key={card.revision + 'e'} defaultValue={card.external_note} readOnly={!p.editable} onBlur={e => { if (e.target.value.trim() !== card.external_note) save({ external_note: e.target.value }, 'Observação alterada'); }} /></div>
            </div>
            <div className="cs-kgrid">
              <div className="cs-k"><div className="l">Atividade observada</div><div className="v" style={{ fontSize: 15, color: OBS_META[signal.observed].color }}>{OBS_META[signal.observed].label}</div><div className="x">{OBS_META[signal.observed].hint}</div></div>
              <div className="cs-k"><div className="l">Último disparo</div><div className="v" style={{ fontSize: 16 }}>{signal.lastDate || 'n/d'}</div><div className="x">dados até {p.dataUntil}</div></div>
              <div className="cs-k"><div className="l">Disparos em 90 dias</div><div className="v">{signal.observed === 'unlinked' ? 'n/d' : fmtInt(signal.dispatches90)}</div></div>
              <div className="cs-k"><div className="l">{isCrm ? 'Cartões em 90 dias' : 'Cliques em 90 dias'}</div><div className="v">{fmtInt(signal.primary90)}</div><div className="x">{isCrm ? 'activities' : 'rentabilizacao_activities'}</div></div>
              <div className="cs-k"><div className="l">Base acionável em 90 dias</div><div className="v">{fmtInt(signal.base90)}</div></div>
            </div>
            {p.editable && (
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button className="cs-btn" onClick={() => save({ archived: true }, 'Campanha arquivada').then(p.onClose)}>Arquivar campanha</button>
              </div>
            )}
          </>
        )}
        {tab === 'link' && <LinkEditor card={card} rows={p.rows} today={p.today} editable={p.editable} onSave={scope => save({ data_scope: scope }, scope ? 'Vínculo com dados salvo' : 'Vínculo removido')} />}
        {tab === 'jor' && (signal.journeys.length
          ? <table className="cs-table"><thead><tr><th>Jornada</th><th>Canal</th><th>Disparos</th><th>Base acionável</th><th>Último</th></tr></thead>
              <tbody>{signal.journeys.map(j => <tr key={j.journey + j.channel}><td style={{ fontFamily: 'Consolas,monospace', fontSize: 11.5 }}>{j.journey}</td><td>{j.channel}</td><td>{fmtInt(j.count)}</td><td>{fmtInt(j.base)}</td><td>{j.last}</td></tr>)}</tbody></table>
          : <p style={{ color: '#64748b', fontSize: 13 }}>{signal.observed === 'unlinked' ? 'Ligue a campanha aos disparos na aba Vínculo com dados.' : 'Nenhuma jornada casa com o vínculo.'}</p>)}
        {tab === 'evo' && (signal.monthly.length
          ? <div style={{ height: 320 }}><ResponsiveContainer width="100%" height="100%">
              <LineChart data={signal.monthly} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="l" tick={{ fontSize: 11 }} /><YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip /><Legend wrapperStyle={{ fontSize: 12 }} />
                <Line yAxisId="l" type="monotone" dataKey="dispatches" name="Disparos" stroke="#0e7490" strokeWidth={2} dot={false} />
                <Line yAxisId="r" type="monotone" dataKey={isCrm ? 'primary' : 'base'} name={isCrm ? 'Cartões' : 'Base acionável'} stroke="#a855f7" strokeWidth={2} dot={false} />
              </LineChart></ResponsiveContainer><p style={{ fontSize: 12, color: '#94a3b8' }}>Últimos 12 meses com disparo · dados até {p.dataUntil}</p></div>
          : <p style={{ color: '#64748b', fontSize: 13 }}>Sem série: a campanha ainda não tem disparos ligados.</p>)}
        {tab === 'log' && <ActivityLog cardId={card.id} revision={card.revision} />}
      </div>
    </aside>
  );
}
