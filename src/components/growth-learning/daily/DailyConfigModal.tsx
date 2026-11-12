import { useEffect, useState } from 'react';
import type React from 'react';
import { Archive, ArchiveRestore, Plus, X } from 'lucide-react';
import { FALLBACK_COLOR, type DailyFrente, type DailyPartner, type DailyProject, type DailyTag } from './dailyModel';

export type ConfigTab = 'project' | 'frente' | 'partner' | 'tag';
const CRM_PARTNERS = ['Proprietaria', 'Serasa', 'Plurix', 'Bem Barato', 'Dia', 'Super Nosso'];
interface Props {
  tab: ConfigTab; projects: DailyProject[]; frentes: DailyFrente[]; partners: DailyPartner[]; tags: DailyTag[]; canEdit: boolean;
  onTab: (t: ConfigTab) => void; onClose: () => void;
  onSaveProject: (p: DailyProject | null, body: Record<string, unknown>) => Promise<void>;
  onMerge: (from: DailyProject, into: DailyProject) => Promise<void>;
  onSaveOption: (kind: 'frente' | 'partner' | 'tag', key: string | null, body: Record<string, unknown>) => Promise<void>;
}
const TABS: [ConfigTab, string][] = [['project', 'Projetos'], ['frente', 'Frentes'], ['partner', 'Parceiros'], ['tag', 'Tags']];

/** Nome salvo ao sair do campo; Enter confirma e Esc desfaz. */
function NameInput({ value, disabled, onSave, autoFocus }: { value: string; disabled: boolean; onSave: (v: string) => void; autoFocus?: boolean }) {
  const [v, setV] = useState(value);
  useEffect(() => setV(value), [value]);
  return <input type="text" className="grow" value={v} disabled={disabled} autoFocus={autoFocus} onChange={e => setV(e.target.value)}
    onBlur={() => { if (v.trim() && v.trim() !== value) onSave(v.trim()); else setV(value); }}
    onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); if (e.key === 'Escape') { setV(value); e.currentTarget.blur(); } }} />;
}

export function DailyConfigModal(p: Props) {
  const [showArchived, setShowArchived] = useState(false);
  const [fresh, setFresh] = useState<string | null>(null);
  useEffect(() => { const k = (e: KeyboardEvent) => { if (e.key === 'Escape') p.onClose(); }; document.addEventListener('keydown', k); return () => document.removeEventListener('keydown', k); }, [p]);
  const frenteColor = (key: string) => p.frentes.find(f => f.key === key)?.color || FALLBACK_COLOR;
  const archiveBtn = (archived: boolean, onToggle: () => void) => (
    <button className="dv-ib" disabled={!p.canEdit} title={archived ? 'Reativar' : 'Arquivar (some dos menus, o histórico continua)'} onClick={onToggle}>{archived ? <ArchiveRestore /> : <Archive />}</button>
  );

  let rows: React.ReactElement[] = [];
  if (p.tab === 'project') {
    const active = p.projects.filter(x => !x.archived);
    rows = p.projects.filter(x => showArchived || !x.archived).sort((a, b) => Number(a.archived) - Number(b.archived) || a.name.localeCompare(b.name)).map(x => (
      <div key={x.id} className={`dv-crow${x.archived ? ' arch' : ''}`}>
        <span style={{ width: 10, height: 30, borderRadius: 4, background: frenteColor(x.frente_key), flex: 'none' }} />
        <NameInput value={x.name} disabled={!p.canEdit} autoFocus={fresh === x.id} onSave={v => void p.onSaveProject(x, { name: v })} />
        <select value={x.frente_key} disabled={!p.canEdit} style={{ width: 150 }} onChange={e => void p.onSaveProject(x, { frente_key: e.target.value })}>
          {p.frentes.filter(f => !f.archived || f.key === x.frente_key).map(f => <option key={f.key} value={f.key}>{f.name}</option>)}
        </select>
        {!x.archived && (
          <select value="" disabled={!p.canEdit} style={{ width: 130, color: '#64748b' }} onChange={e => {
            const into = active.find(o => o.id === e.target.value);
            if (into && window.confirm(`Juntar "${x.name}" em "${into.name}"? Os registros passam para "${into.name}" e "${x.name}" fica arquivado.`)) void p.onMerge(x, into);
            e.target.value = '';
          }}>
            <option value="">Juntar com…</option>
            {active.filter(o => o.id !== x.id).map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        )}
        {archiveBtn(x.archived, () => void p.onSaveProject(x, { archived: !x.archived }))}
      </div>
    ));
  } else {
    const kind = p.tab;
    const list: (DailyFrente | DailyPartner | DailyTag)[] = kind === 'frente' ? p.frentes : kind === 'partner' ? p.partners : p.tags;
    rows = list.filter(x => showArchived || !x.archived).map(x => (
      <div key={x.key} className={`dv-crow${x.archived ? ' arch' : ''}`}>
        <input type="color" value={x.color} disabled={!p.canEdit} onChange={e => void p.onSaveOption(kind, x.key, { color: e.target.value })} />
        <NameInput value={x.name} disabled={!p.canEdit} autoFocus={fresh === x.key} onSave={v => void p.onSaveOption(kind, x.key, { name: v })} />
        {kind === 'frente' && <input type="text" title="Sigla curta" maxLength={4} style={{ width: 64, textAlign: 'center' }} defaultValue={(x as DailyFrente).short} disabled={!p.canEdit}
          onBlur={e => { if (e.target.value !== (x as DailyFrente).short) void p.onSaveOption('frente', x.key, { short: e.target.value }); }} />}
        {kind === 'partner' && (
          <select value={(x as DailyPartner).crm_key || ''} disabled={!p.canEdit} style={{ width: 170 }} title="Parceiro correspondente nos disparos CRM" onChange={e => void p.onSaveOption('partner', x.key, { crm_key: e.target.value })}>
            <option value="">Sem dado CRM</option>
            {CRM_PARTNERS.map(c => <option key={c} value={c}>CRM: {c}</option>)}
          </select>
        )}
        {archiveBtn(x.archived, () => void p.onSaveOption(kind, x.key, { archived: !x.archived }))}
      </div>
    ));
  }

  const add = async () => {
    if (p.tab === 'project') {
      const frente = p.frentes.find(f => !f.archived);
      if (!frente) { window.alert('Crie uma frente antes do primeiro projeto.'); p.onTab('frente'); return; }
      let n = 1; while (p.projects.some(x => !x.archived && x.name === `Novo projeto ${n}`)) n++;
      await p.onSaveProject(null, { name: `Novo projeto ${n}`, frente_key: frente.key });
    } else {
      const base = { frente: 'Nova frente', partner: 'Novo parceiro', tag: 'Nova tag' }[p.tab];
      await p.onSaveOption(p.tab, null, { name: base });
    }
    setFresh('__last__');
  };
  useEffect(() => {
    if (fresh !== '__last__') return;
    const list = p.tab === 'project' ? p.projects.filter(x => x.name.startsWith('Novo projeto')).map(x => x.id) : (p.tab === 'frente' ? p.frentes : p.tab === 'partner' ? p.partners : p.tags).filter(x => /^Nov[oa] /.test(x.name)).map(x => x.key);
    if (list.length) setFresh(list[list.length - 1]);
  }, [fresh, p.tab, p.projects, p.frentes, p.partners, p.tags]);

  return (
    <div className="dv-modal" onPointerDown={e => { if (e.target === e.currentTarget) p.onClose(); }}>
      <div role="dialog" aria-modal="true" aria-label="Configurar Visão Daily">
        <div className="mh">
          <div><b>Configurar Visão Daily</b><p>Vale para todo o time. Renomear não quebra o histórico dos registros.</p></div>
          <button className="dv-ib" style={{ marginLeft: 'auto' }} aria-label="Fechar" onClick={p.onClose}><X /></button>
        </div>
        <div className="tabs">
          {TABS.map(([k, label]) => <button key={k} className={p.tab === k ? 'on' : ''} onClick={() => p.onTab(k)}>{label}</button>)}
          <label style={{ marginLeft: 'auto', fontSize: 12, color: '#64748b', display: 'flex', gap: 6, alignItems: 'center' }}><input type="checkbox" checked={showArchived} onChange={e => setShowArchived(e.target.checked)} />Mostrar arquivados</label>
        </div>
        <div className="rows">
          {rows.length ? rows : <div className="dv-empty">Nada cadastrado ainda.</div>}
          {p.canEdit && <button className="dv-add" onClick={() => void add()}><Plus />Adicionar</button>}
        </div>
        <div className="mf">Projeto herda a cor da frente. "Juntar com" move os registros para outro projeto e arquiva o de origem. Parceiro com dado CRM entra no número de cartões do calendário.</div>
      </div>
    </div>
  );
}
