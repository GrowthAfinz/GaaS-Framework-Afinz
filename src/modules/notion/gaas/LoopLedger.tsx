/**
 * Apostas e Registros: uma página só, no visual do módulo, juntando Apostas, Outcomes e Registros.
 * Só leitura por enquanto: a atualização continua no fluxo atual (Loop, Report Live e as telas antigas).
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ExternalLink, X } from 'lucide-react';
import { fetchGrowthBets } from '../../../components/growth-learning/bets/growthBetService';
import { fetchGrowthOutcomes } from '../../../components/growth-learning/outcomes/growthOutcomeService';
import { fetchGrowthMemory } from '../../../components/growth-learning/memory/growthMemoryService';
import type { GrowthBet } from '../../../components/growth-learning/bets/growthBet.types';
import type { GrowthOutcome, GrowthOutcomeVerdict } from '../../../components/growth-learning/outcomes/growthOutcome.types';
import type { GrowthLearning } from '../../../components/growth-learning/memory/growthMemory.types';
import { DatabaseView } from '../components/database/DatabaseView';
import { NotionEditContext, type NotionEditApi } from '../components/database/editContext';
import { CHIP_COLORS } from '../components/database/viewEngine';
import type { DatabaseProperty, DatabaseRow, DatabaseViewConfig, NotionColor, NotionDatabase, SelectOption } from '../types/notion';
import '../notion.css';

export type LedgerKind = 'bet' | 'outcome' | 'memory';
const DB_ID = 'db_apostas_registros';

const opt = (id: string, name: string, color: NotionColor): SelectOption => ({ id, name, color });
const STAGES: SelectOption[] = [
  opt('aprovada', 'Aprovada', 'gray'), opt('execucao', 'Em execução', 'yellow'), opt('janela', 'Aguardando janela', 'purple'),
  opt('verificar', 'A verificar', 'orange'), opt('verificada', 'Verificada', 'green'), opt('encerrada', 'Encerrada', 'blue'),
  opt('cancelada', 'Cancelada', 'brown'), opt('nao_verificavel', 'Não verificável', 'gray'), opt('registro', 'Registro', 'blue'),
];
const FRONTS: Record<string, string> = { crm_acquisition: 'Aquisição CRM', paid_media: 'Mídia paga', b2c_origin: 'Originação B2C', report_live: 'Report Live' };
const VERDICTS: Record<GrowthOutcomeVerdict, [string, NotionColor]> = {
  confirmed: ['Confirmou', 'green'], partially_confirmed: ['Confirmou em parte', 'yellow'], not_confirmed: ['Não confirmou', 'red'],
  invalid_premise: ['Premissa inválida', 'brown'], execution_diverged: ['Execução divergiu', 'orange'], data_blocked: ['Dado bloqueado', 'gray'],
  not_verifiable: ['Não verificável', 'gray'],
};
const CLASSIFICATION: Record<string, [string, NotionColor]> = {
  confirmed: ['Confirmado', 'green'], directional: ['Direcional', 'blue'], contradictory: ['Contraditório', 'red'], inconclusive: ['Inconclusivo', 'gray'], invalidated: ['Invalidado', 'brown'],
};
const LIFECYCLE: Record<string, string> = { active: 'Ativo', expired: 'Vencido', superseded: 'Substituído', contested: 'Contestado' };
const DIRECTION: Record<string, string> = { maior_melhor: 'maior é melhor', menor_melhor: 'menor é melhor', atingir_meta: 'atingir a meta' };
const EXECUTION: Record<string, string> = { not_started: 'Não começou', partial: 'Parcial', completed: 'Concluída', cancelled: 'Cancelada', unknown: 'Sem informação' };

const PROPS: DatabaseProperty[] = [
  { id: 'prop_title', name: 'Nome', type: 'title' },
  { id: 'l_tipo', name: 'Tipo', type: 'select', options: [opt('aposta', 'Aposta', 'purple'), opt('registro', 'Registro', 'blue')] },
  { id: 'l_etapa', name: 'Etapa', type: 'status', options: STAGES },
  { id: 'l_frente', name: 'Frente', type: 'select', options: Object.entries(FRONTS).map(([k, v], i) => opt(k, v, (['blue', 'pink', 'green', 'orange'] as NotionColor[])[i])) },
  { id: 'l_resp', name: 'Responsável', type: 'text' },
  { id: 'l_metrica', name: 'Métrica', type: 'text' },
  { id: 'l_janela', name: 'Fim da janela', type: 'date' },
  { id: 'l_veredito', name: 'Veredito', type: 'select', options: Object.values(VERDICTS).map(([n, c]) => opt(n, n, c)) },
  { id: 'l_classe', name: 'Leitura do registro', type: 'select', options: Object.values(CLASSIFICATION).map(([n, c]) => opt(n, n, c)) },
  { id: 'l_revisar', name: 'Revisar em', type: 'date' },
  { id: 'l_origem', name: 'Origem', type: 'text' },
];
const VIEWS: DatabaseViewConfig[] = [
  { id: 'v_etapa', name: 'Por etapa', type: 'board', groupByPropertyId: 'l_etapa', hideEmptyGroups: true, visiblePropertyIds: ['l_frente', 'l_metrica', 'l_janela', 'l_classe'], sorts: [], filters: [] },
  { id: 'v_verificar', name: 'A verificar', type: 'table', visiblePropertyIds: ['l_frente', 'l_resp', 'l_metrica', 'l_janela', 'l_veredito'], sorts: [{ propertyId: 'l_janela', direction: 'ascending' }], filters: [{ propertyId: 'l_etapa', operator: 'equals', value: 'A verificar' }] },
  { id: 'v_apostas', name: 'Apostas', type: 'table', visiblePropertyIds: ['l_etapa', 'l_frente', 'l_resp', 'l_metrica', 'l_janela', 'l_veredito'], sorts: [], filters: [{ propertyId: 'l_tipo', operator: 'equals', value: 'Aposta' }] },
  { id: 'v_registros', name: 'Registros', type: 'table', visiblePropertyIds: ['l_frente', 'l_classe', 'l_revisar', 'l_origem'], sorts: [], filters: [{ propertyId: 'l_tipo', operator: 'equals', value: 'Registro' }] },
  { id: 'v_calendario', name: 'Calendário', type: 'calendar', datePropertyId: 'l_janela', visiblePropertyIds: [], sorts: [], filters: [] },
];

const fmtNum = (v: number | null | undefined, unit?: string | null) => (v == null ? '' : `${v.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}${unit ? ' ' + unit : ''}`);
const fmtDate = (d?: string | null) => (d ? new Date(d.length === 10 ? d + 'T12:00:00' : d).toLocaleDateString('pt-BR') : '');
const day = (d?: string | null) => (d ? d.slice(0, 10) : '');

function stageOf(b: GrowthBet, o?: GrowthOutcome): string {
  if (b.status === 'cancelled') return 'Cancelada';
  if (b.status === 'not_verifiable') return 'Não verificável';
  if (o?.review_status === 'resolved' || o?.review_status === 'confirmed_by_user') return 'Verificada';
  if (b.status === 'closed') return 'Encerrada';
  if (b.status === 'ready_for_review' || (o && ['due_today', 'overdue', 'ready_review', 'contested'].includes(o.due_bucket))) return 'A verificar';
  if (b.status === 'waiting_window') return 'Aguardando janela';
  if (b.status === 'in_progress') return 'Em execução';
  return 'Aprovada';
}

interface Item { kind: LedgerKind; id: string; bet?: GrowthBet; outcome?: GrowthOutcome; memory?: GrowthLearning }

function buildRows(bets: GrowthBet[], outcomes: GrowthOutcome[], memory: GrowthLearning[]): { rows: DatabaseRow[]; items: Map<string, Item> } {
  const byBet = new Map(outcomes.map(o => [o.bet_id, o]));
  const items = new Map<string, Item>();
  const rows: DatabaseRow[] = [];
  for (const b of bets) {
    const o = byBet.get(b.id);
    const verdict = o?.resolved_verdict || o?.system_verdict;
    const rid = 'bet_' + b.id;
    items.set(rid, { kind: 'bet', id: b.id, bet: b, outcome: o });
    rows.push({ id: rid, pageId: rid, properties: {
      prop_title: b.hypothesis, l_tipo: 'Aposta', l_etapa: stageOf(b, o), l_frente: FRONTS[b.front] || b.front, l_resp: b.owner || '',
      l_metrica: `${b.metric_name}: ${fmtNum(b.baseline_value, b.expected_unit)} → ${fmtNum(b.expected_value, b.expected_unit)}`,
      l_janela: day(b.outcome_window_end), l_veredito: verdict ? VERDICTS[verdict]?.[0] || '' : '', l_classe: '', l_revisar: '',
      l_origem: b.source_view || b.verification_view || '',
    } });
  }
  for (const m of memory) {
    const rid = 'mem_' + m.id;
    items.set(rid, { kind: 'memory', id: m.id, memory: m });
    rows.push({ id: rid, pageId: rid, properties: {
      prop_title: m.statement, l_tipo: 'Registro', l_etapa: 'Registro', l_frente: FRONTS[m.front] || m.front, l_resp: '', l_metrica: '',
      l_janela: '', l_veredito: '', l_classe: CLASSIFICATION[m.classification]?.[0] || m.classification, l_revisar: day(m.review_at),
      l_origem: m.source_title || m.source_ref || '',
    } });
  }
  return { rows, items };
}

const readOnlyEdit: NotionEditApi = {
  lockOf: () => 'fixed', createOption: async () => null, removeOption: () => undefined, renameProperty: () => undefined, deleteProperty: () => undefined,
};
const viewsKey = 'gaas.notion.ledger.views';
const readViews = (): { views: DatabaseViewConfig[]; current: string } | null => { try { const v = localStorage.getItem(viewsKey); return v ? JSON.parse(v) : null; } catch { return null; } };

export function LoopLedger({ initialView, initialItem, onCount, onOpenLegacy }: {
  initialView?: 'bets' | 'outcomes' | 'memory'; initialItem?: string | null;
  onCount?: (n: number) => void; onOpenLegacy?: (kind: LedgerKind, id: string) => void;
}) {
  const [data, setData] = useState<{ rows: DatabaseRow[]; items: Map<string, Item> } | null>(null);
  const [error, setError] = useState('');
  const [peek, setPeek] = useState<string | null>(null);
  const saved = useMemo(readViews, []);
  const [views, setViews] = useState<DatabaseViewConfig[]>(() => {
    // Visões padrão novas entram mesmo para quem já tinha a lista salva.
    const own = saved?.views || [];
    return [...VIEWS.map(v => own.find(o => o.id === v.id) || v), ...own.filter(o => !VIEWS.some(v => v.id === o.id))];
  });
  const [current, setCurrent] = useState(() => (initialView === 'outcomes' ? 'v_verificar' : initialView === 'memory' ? 'v_registros' : saved?.current || 'v_etapa'));
  useEffect(() => { try { localStorage.setItem(viewsKey, JSON.stringify({ views, current })); } catch { /* preferência local */ } }, [views, current]);

  const load = useCallback(() => {
    setError('');
    Promise.all([fetchGrowthBets(), fetchGrowthOutcomes(), fetchGrowthMemory()])
      .then(([b, o, m]) => {
        const built = buildRows(b, o, m);
        setData(built);
        onCount?.(built.rows.length);
        if (initialItem) { const hit = ['bet_' + initialItem, 'mem_' + initialItem].find(k => built.items.has(k)); if (hit) setPeek(hit); }
      })
      .catch(() => setError('Não foi possível carregar Apostas e Registros. Confira a conexão e tente de novo.'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => { load(); }, [load]);

  const database: NotionDatabase | null = data ? {
    id: DB_ID, title: '', description: '',
    properties: PROPS, rows: data.rows, views, currentViewId: views.some(v => v.id === current) ? current : views[0].id,
  } as NotionDatabase : null;

  if (error) return <div className="nt-root flex h-full items-center justify-center gap-3 text-sm">{error}<button className="rounded-md border px-3 py-1.5" onClick={load}>Tentar de novo</button></div>;
  if (!database || !data) return <div className="nt-root flex h-full items-center justify-center text-sm text-[var(--notion-text-muted)]">Carregando Apostas e Registros…</div>;
  const item = peek ? data.items.get(peek) : undefined;

  return (
    <NotionEditContext.Provider value={readOnlyEdit}>
      <div className="nt-root relative h-full w-full overflow-y-auto bg-[var(--notion-bg)] text-[var(--notion-text)]">
        <div className="mx-auto max-w-[1500px] px-6 sm:px-12 pb-16 pt-8">
          <div className="text-4xl">🎯</div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Apostas e Registros</h1>
          <p className="mt-1 text-sm text-[var(--notion-text-muted)]">Hipóteses em teste, resultados a verificar e o que ficou registrado. Clique num item para ver tudo dele. A atualização segue pelo Loop e pelo Report Live.</p>
          <DatabaseView
            database={database}
            readOnly
            onUpdateRow={() => undefined}
            onAddRow={() => undefined}
            onDeleteRow={() => undefined}
            onAddProperty={() => undefined}
            onSetView={(_, id) => setCurrent(id)}
            onAddView={() => undefined}
            onUpdateView={(_, id, partial) => setViews(vs => vs.map(v => (v.id === id ? { ...v, ...partial } : v)))}
            onOpenRowPage={(pageId) => setPeek(pageId)}
          />
        </div>
        {item && <LedgerPeek item={item} onClose={() => setPeek(null)} onOpenLegacy={onOpenLegacy} />}
      </div>
    </NotionEditContext.Provider>
  );
}

/* ---------- detalhe do item (somente leitura) ---------- */
const Chip = ({ text, color }: { text: string; color: NotionColor }) => <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${CHIP_COLORS[color]}`}>{text}</span>;
function Prop({ label, children }: { label: string; children: React.ReactNode }) {
  if (children == null || children === '') return null;
  return <div className="flex gap-4 py-1 text-xs"><div className="w-36 shrink-0 font-medium text-[var(--notion-text-muted)]">{label}</div><div className="min-w-0 flex-1 text-[var(--notion-text)]">{children}</div></div>;
}
function Section({ title, text }: { title: string; text?: string | null }) {
  if (!text || !String(text).trim()) return null;
  return <div className="mt-5"><h3 className="text-sm font-semibold text-[var(--notion-text)]">{title}</h3><p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-[var(--notion-text)]">{text}</p></div>;
}
const jsonText = (o: Record<string, unknown> | null | undefined) =>
  o && Object.keys(o).length ? Object.entries(o).map(([k, v]) => `${k.replace(/_/g, ' ')}: ${typeof v === 'object' ? JSON.stringify(v) : String(v)}`).join('\n') : '';

function LedgerPeek({ item, onClose, onOpenLegacy }: { item: Item; onClose: () => void; onOpenLegacy?: (kind: LedgerKind, id: string) => void }) {
  useEffect(() => { const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); }; window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, [onClose]);
  const b = item.bet, o = item.outcome, m = item.memory;
  const verdict = o?.resolved_verdict || o?.system_verdict;
  const stage = b ? stageOf(b, o) : 'Registro';
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={onClose}>
      <div role="dialog" aria-modal="true" onClick={e => e.stopPropagation()} className="h-full w-full max-w-2xl overflow-y-auto border-l border-[var(--notion-border)] bg-[var(--notion-bg)] px-10 py-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between text-xs text-[var(--notion-text-muted)]">
          {onOpenLegacy ? (
            <button onClick={() => onOpenLegacy(item.kind === 'bet' && stage === 'A verificar' ? 'outcome' : item.kind, item.id)} className="flex items-center gap-1 rounded px-2 py-1 hover:bg-[var(--notion-hover)] hover:text-[var(--notion-text)]">
              <ExternalLink size={13} /> Abrir na tela antiga (para atualizar)
            </button>
          ) : <span />}
          <button onClick={onClose} className="rounded p-1.5 hover:bg-[var(--notion-hover)]" title="Fechar (Esc)"><X size={15} /></button>
        </div>
        <div className="text-3xl">{b ? '🎯' : '📌'}</div>
        <h2 className="mt-2 text-2xl font-bold leading-snug">{b ? b.hypothesis : m?.statement}</h2>
        <div className="mt-4 rounded-lg border border-[var(--notion-border)] bg-[var(--notion-hover)]/40 p-3">
          <Prop label="Tipo">{b ? <Chip text="Aposta" color="purple" /> : <Chip text="Registro" color="blue" />}</Prop>
          <Prop label="Etapa"><Chip text={stage} color={STAGES.find(s => s.name === stage)?.color || 'gray'} /></Prop>
          <Prop label="Frente">{FRONTS[(b?.front || m?.front) as string] || b?.front || m?.front}</Prop>
          {b && <>
            <Prop label="Responsável">{b.owner}</Prop>
            <Prop label="Métrica">{b.metric_name}</Prop>
            <Prop label="Base → meta">{`${fmtNum(b.baseline_value, b.expected_unit)} → ${fmtNum(b.expected_value, b.expected_unit)} (${DIRECTION[b.expected_direction] || b.expected_direction})`}</Prop>
            <Prop label="Janela de leitura">{`${fmtDate(b.outcome_window_start)} a ${fmtDate(b.outcome_window_end)}`}</Prop>
            <Prop label="Executar até">{fmtDate(b.execution_due_at)}</Prop>
            <Prop label="Checklist">{b.checklist_total ? `${b.checklist_completed} de ${b.checklist_total}` : ''}</Prop>
            <Prop label="Execução">{b.last_execution_status ? EXECUTION[b.last_execution_status] : ''}</Prop>
            <Prop label="Onde verificar">{b.verification_view}</Prop>
          </>}
          {o && <>
            <Prop label="Resultado observado">{fmtNum(o.observed_value, o.observed_unit)}</Prop>
            <Prop label="Veredito">{verdict ? <Chip text={VERDICTS[verdict][0]} color={VERDICTS[verdict][1]} /> : 'Ainda sem veredito'}</Prop>
            <Prop label="Avaliado em">{fmtDate(o.evaluated_at)}</Prop>
          </>}
          {m && <>
            <Prop label="Leitura">{CLASSIFICATION[m.classification] ? <Chip text={CLASSIFICATION[m.classification][0]} color={CLASSIFICATION[m.classification][1]} /> : m.classification}</Prop>
            <Prop label="Situação">{LIFECYCLE[m.lifecycle_status] || m.lifecycle_status}</Prop>
            <Prop label="Vale de">{fmtDate(m.valid_from)}{m.valid_until ? ` até ${fmtDate(m.valid_until)}` : ''}</Prop>
            <Prop label="Revisar em">{fmtDate(m.review_at)}</Prop>
            <Prop label="Origem">{m.source_title || m.source_ref}</Prop>
            <Prop label="Reuso">{m.link_count ? `${m.reused_count} de ${m.link_count} aplicações` : ''}</Prop>
          </>}
        </div>
        {b && <>
          <Section title="Ação" text={b.action_text} />
          <Section title="Critério de sucesso" text={b.success_criterion} />
          <Section title="Condição de parada" text={b.stop_condition} />
          <Section title="Sinal que originou" text={b.source_signal} />
          <Section title="Impacto esperado" text={b.source_impact} />
          <Section title="Causa provável" text={b.source_probable_cause} />
          <Section title="Limite da leitura" text={b.source_reading_limit} />
        </>}
        {o && <>
          <Section title="Conclusão" text={o.conclusion} />
          <Section title="Motivo da verificação" text={o.verification_reason} />
          <Section title="Contestação" text={o.contestation_reason} />
        </>}
        {m && <>
          <Section title="Escopo" text={jsonText(m.scope)} />
          <Section title="Quando se aplica" text={jsonText(m.applicability)} />
          <Section title="Limitações" text={jsonText(m.limitations)} />
        </>}
      </div>
    </div>
  );
}
