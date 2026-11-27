/**
 * Páginas IA: base só leitura com as saídas dos agentes, no visual do módulo (como Apostas e Registros).
 * Tabela e Galeria, filtros por agente, tipo e status, e a página aberta no formato do dossiê.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ChevronRight, LayoutGrid, ListPlus, Search, Table2 } from 'lucide-react';
import { CHIP_COLORS } from '../components/database/viewEngine';
import type { NotionColor } from '../types/notion';
import {
  AI_SECTIONS, KIND_ICON, KIND_LABEL, STATUS_LABEL, agentCounts, filterPages, fmtDay, frontName, statusOf,
  type AiCardLink, type AiKind, type AiPage, type AiSection, type AiStatus,
} from './aiPagesData';

const KIND_COLOR: Record<AiKind, NotionColor> = { insight_crm: 'yellow', insight_midia: 'pink', investigacao: 'purple', proposta: 'green' };
const STATUS_CLASS: Record<AiStatus, string> = {
  revisar: 'border border-[var(--notion-border)] text-[var(--notion-text)]',
  valida: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
  vencida: 'bg-amber-50 text-amber-800 border border-amber-300',
};
const PAGE_STEP = 150;

export interface AiPagesProps {
  section: AiSection;
  pages: AiPage[] | null;
  failed: string[];
  cards: AiCardLink[];
  fronts: { key: string; name: string }[];
  canEdit: boolean;
  openKey: string | null;
  onOpen: (key: string | null) => void;
  onSection: (s: AiSection) => void;
  onRetry: () => void;
  /** Cria (ou acha) o card da página e abre a janela dele. */
  onTurnIntoCard: (page: AiPage) => Promise<void>;
  onOpenTask: (taskId: string) => void;
  now?: Date;
}

const Kind = ({ kind }: { kind: AiKind }) => <span className={`whitespace-nowrap rounded px-1.5 py-0.5 text-xs font-medium ${CHIP_COLORS[KIND_COLOR[kind]]}`}>{KIND_LABEL[kind]}</span>;
const Status = ({ status, since }: { status: AiStatus; since?: string | null }) => (
  <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_CLASS[status]}`}>
    {status === 'vencida' && <AlertTriangle size={11} aria-hidden="true" />}
    {status === 'vencida' && since ? `Vencida desde ${fmtDay(since).slice(0, 5)}` : STATUS_LABEL[status]}
  </span>
);
function Chip({ on, children, onClick, title }: { on: boolean; children: React.ReactNode; onClick: () => void; title?: string }) {
  return (
    <button type="button" aria-pressed={on} title={title} onClick={onClick}
      className={`whitespace-nowrap rounded-md border px-2 py-0.5 text-xs transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-600 ${on ? 'border-cyan-300 bg-cyan-50 font-semibold text-cyan-800' : 'border-[var(--notion-border)] text-[var(--notion-text-muted)] hover:bg-[var(--notion-hover)] hover:text-[var(--notion-text)]'}`}>
      {children}
    </button>
  );
}
const Soon = ({ children }: { children: React.ReactNode }) => (
  <button type="button" disabled title="Em breve" className="cursor-not-allowed rounded-md border border-[var(--notion-border)] px-2.5 py-1 text-xs text-[var(--notion-text-muted)] opacity-70">{children}</button>
);
const sourceLine = (p: AiPage) => [p.source, p.period].filter(Boolean).join(' · ');

export function AiPages(props: AiPagesProps) {
  const { section, pages, failed, onRetry, openKey } = props;
  const now = props.now || new Date();
  const [view, setView] = useState<'tabela' | 'galeria'>(() => { try { return localStorage.getItem('gaas.notion.ai.view') === 'galeria' ? 'galeria' : 'tabela'; } catch { return 'tabela'; } });
  useEffect(() => { try { localStorage.setItem('gaas.notion.ai.view', view); } catch { /* preferência local */ } }, [view]);
  const [agent, setAgent] = useState('');
  const [kind, setKind] = useState<AiKind | ''>('');
  const [status, setStatus] = useState<AiStatus | ''>('');
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(PAGE_STEP);
  // Trocar de subpágina limpa agente e tipo (senão um filtro de outra subpágina esconde tudo).
  useEffect(() => { setKind(''); setAgent(''); setLimit(PAGE_STEP); }, [section]);

  const meta = AI_SECTIONS.find(s => s.id === section) || AI_SECTIONS[0];
  const inSection = useMemo(() => (pages ? filterPages(pages, { section, agent: '', kind: '', status: '' }, now) : []), [pages, section]); // eslint-disable-line react-hooks/exhaustive-deps
  const shown = useMemo(() => filterPages(inSection, { section, agent, kind, status, query }, now), [inSection, section, agent, kind, status, query]); // eslint-disable-line react-hooks/exhaustive-deps
  const agents = useMemo(() => agentCounts(inSection).filter(a => a.count > 0 || a.agent === agent), [inSection, agent]);
  const statusCount = (s: AiStatus) => inSection.filter(p => statusOf(p, now) === s).length;
  const cardOf = useMemo(() => new Map(props.cards.map(c => [c.key, c])), [props.cards]);
  const open = openKey && pages ? pages.find(p => p.key === openKey) : undefined;

  if (open) return <AiPageView page={open} card={cardOf.get(open.key)} {...props} now={now} />;

  return (
    <div className="nt-root h-full w-full overflow-y-auto bg-[var(--notion-bg)] text-[var(--notion-text)]">
      <div className="mx-auto max-w-[1500px] px-6 pb-16 pt-8 sm:px-12">
        <div className="text-4xl" aria-hidden="true">{meta.icon}</div>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">{meta.title}</h1>
        {section === 'todas'
          ? <p className="mt-1 text-sm text-[var(--notion-text-muted)]">Respostas dos agentes em formato de página: quem fez, com que fonte e até quando vale.</p>
          : <button type="button" onClick={() => props.onSection('todas')} className="mt-1 text-sm text-cyan-700 hover:underline">Ver todas as Páginas IA</button>}

        {failed.length > 0 && (
          <div role="alert" className="mt-4 flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            <AlertTriangle size={14} aria-hidden="true" />Não deu para ler: {failed.join(', ')}.
            <button type="button" onClick={onRetry} className="ml-auto rounded border border-amber-400 bg-white px-2 py-0.5 text-xs font-semibold">Tentar de novo</button>
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-md bg-[var(--notion-hover)] p-0.5" role="group" aria-label="Visão">
            {([['tabela', 'Tabela', Table2], ['galeria', 'Galeria', LayoutGrid]] as const).map(([id, name, Icon]) => (
              <button key={id} type="button" aria-pressed={view === id} onClick={() => setView(id)}
                className={`inline-flex items-center gap-1 rounded px-2.5 py-1 text-xs ${view === id ? 'bg-[var(--notion-bg)] font-semibold shadow-sm' : 'text-[var(--notion-text-muted)]'}`}>
                <Icon size={13} aria-hidden="true" />{name}
              </button>
            ))}
          </div>
          <Chip on={!status} onClick={() => setStatus('')}>Todas <span className="tabular-nums">{inSection.length}</span></Chip>
          {(['revisar', 'valida', 'vencida'] as AiStatus[]).map(s => (
            <Chip key={s} on={status === s} onClick={() => setStatus(status === s ? '' : s)}>{STATUS_LABEL[s]} <span className="tabular-nums">{statusCount(s)}</span></Chip>
          ))}
          <label className="ml-auto flex items-center gap-1.5 rounded-md border border-[var(--notion-border)] px-2 py-1 text-xs">
            <Search size={13} aria-hidden="true" className="text-[var(--notion-text-muted)]" />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar pelo título" aria-label="Buscar pelo título" className="w-44 bg-transparent outline-none" />
          </label>
          <Soon>+ Pedir página a um agente</Soon>
        </div>

        {agents.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5" aria-label="Filtrar por agente">
            <span className="mr-1 text-xs text-[var(--notion-text-muted)]">Agente</span>
            <Chip on={!agent} onClick={() => setAgent('')}>Todos</Chip>
            {agents.map(a => (
              <Chip key={a.agent} on={agent === a.agent} onClick={() => setAgent(agent === a.agent ? '' : a.agent)}>
                <span className="font-mono">{a.agent}</span> <span className="tabular-nums">{a.count}</span>
              </Chip>
            ))}
          </div>
        )}
        {section === 'todas' && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5" aria-label="Filtrar por tipo">
            <span className="mr-1 text-xs text-[var(--notion-text-muted)]">Tipo</span>
            <Chip on={!kind} onClick={() => setKind('')}>Todos</Chip>
            {(Object.keys(KIND_LABEL) as AiKind[]).map(k => {
              const n = inSection.filter(p => p.kind === k).length;
              return n ? <Chip key={k} on={kind === k} onClick={() => setKind(kind === k ? '' : k)}>{KIND_LABEL[k]} <span className="tabular-nums">{n}</span></Chip> : null;
            })}
          </div>
        )}

        <div className="mt-4">
          {!pages ? <Skeleton /> : !shown.length ? (
            <div className="rounded-lg border border-dashed border-[var(--notion-border)] px-6 py-10 text-center text-sm text-[var(--notion-text-muted)]">
              {section === 'analises' ? 'Nenhuma análise salva aqui ainda. As análises feitas em conversa entram nesta subpágina numa próxima etapa.'
                : inSection.length ? 'Nenhuma página com esses filtros.' : 'Nenhuma página deste tipo ainda.'}
            </div>
          ) : view === 'tabela' ? (
            <Table rows={shown.slice(0, limit)} fronts={props.fronts} cardOf={cardOf} now={now} onOpen={props.onOpen} />
          ) : (
            <Gallery rows={shown.slice(0, limit)} fronts={props.fronts} cardOf={cardOf} now={now} onOpen={props.onOpen} />
          )}
          {shown.length > limit && (
            <button type="button" onClick={() => setLimit(l => l + PAGE_STEP)} className="mt-3 rounded-md border border-[var(--notion-border)] px-3 py-1.5 text-xs hover:bg-[var(--notion-hover)]">
              Mostrar mais {Math.min(PAGE_STEP, shown.length - limit)} de {shown.length - limit}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const COLS = 'grid grid-cols-[minmax(0,2.6fr)_minmax(0,0.9fr)_minmax(0,0.8fr)_minmax(0,1.3fr)_minmax(0,1.2fr)_minmax(0,0.9fr)] gap-3 items-center';
interface ListProps { rows: AiPage[]; fronts: { key: string; name: string }[]; cardOf: Map<string, AiCardLink>; now: Date; onOpen: (key: string) => void }
function Table({ rows, fronts, cardOf, now, onOpen }: ListProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-[var(--notion-border)]" role="table" aria-label="Páginas IA">
      <div className="min-w-[960px]">
        <div role="row" className={`${COLS} border-b border-[var(--notion-border)] bg-[var(--notion-hover)]/50 px-3 py-2 text-xs font-semibold text-[var(--notion-text-muted)]`}>
          {['Página', 'Tipo', 'Frente', 'Agente', 'Fonte e validade', 'Status'].map(h => <span key={h} role="columnheader">{h}</span>)}
        </div>
        {rows.map(p => {
          const st = statusOf(p, now);
          return (
            <button key={p.key} type="button" role="row" onClick={() => onOpen(p.key)}
              className={`${COLS} w-full border-b border-[var(--notion-border)] px-3 py-2 text-left text-xs last:border-b-0 hover:bg-[var(--notion-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cyan-600`}>
              <span role="cell" className="flex min-w-0 items-center gap-2 text-sm font-medium">
                <span aria-hidden="true">{KIND_ICON[p.kind]}</span><span className="truncate">{p.title}</span>
                {cardOf.has(p.key) && <span className="shrink-0 rounded bg-cyan-50 px-1.5 text-[11px] font-semibold text-cyan-800">card</span>}
              </span>
              <span role="cell"><Kind kind={p.kind} /></span>
              <span role="cell" className="truncate">{frontName(p.frontKey, fronts)}</span>
              <span role="cell" className="truncate font-mono text-[11px]" title={p.executor ? `executado por ${p.executor}` : undefined}>{p.agent}</span>
              <span role="cell" className="min-w-0 text-[var(--notion-text-muted)]">
                <span className="block truncate text-[var(--notion-text)]">{sourceLine(p) || 'sem fonte'}</span>
                <span className="block tabular-nums">{p.validUntil ? `vale até ${fmtDay(p.validUntil)}` : 'sem validade'}</span>
              </span>
              <span role="cell"><Status status={st} /></span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
function Gallery({ rows, fronts, cardOf, now, onOpen }: ListProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
      {rows.map(p => (
        <button key={p.key} type="button" onClick={() => onOpen(p.key)}
          className="flex flex-col gap-2 rounded-lg border border-[var(--notion-border)] bg-[var(--notion-card)] p-3.5 text-left hover:border-cyan-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-600">
          <span className="flex items-center gap-2"><Kind kind={p.kind} /><span className="ml-auto"><Status status={statusOf(p, now)} /></span></span>
          <span className="line-clamp-3 text-sm font-semibold leading-snug">{p.title}</span>
          {p.signal && p.signal !== p.title && <span className="line-clamp-2 text-xs text-[var(--notion-text-muted)]">{p.signal}</span>}
          <span className="mt-auto flex flex-wrap items-center gap-x-2 gap-y-0.5 border-t border-[var(--notion-border)] pt-2 text-[11px] text-[var(--notion-text-muted)]">
            <span className="font-mono">{p.agent}</span><span>{frontName(p.frontKey, fronts)}</span>
            <span className="tabular-nums">{fmtDay(p.createdAt)}</span>
            {cardOf.has(p.key) && <span className="rounded bg-cyan-50 px-1.5 font-semibold text-cyan-800">card</span>}
          </span>
        </button>
      ))}
    </div>
  );
}
const Skeleton = () => (
  <div className="space-y-2" aria-label="Carregando Páginas IA">
    {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-10 animate-pulse rounded bg-[var(--notion-hover)]" />)}
  </div>
);

/* ---------- página aberta ---------- */
function Prop({ label, children }: { label: string; children: React.ReactNode }) {
  if (children == null || children === '' || children === false) return null;
  return <><span className="text-[var(--notion-text-muted)]">{label}</span><span className="min-w-0">{children}</span></>;
}
function Block({ title, text, mono }: { title: string; text: string; mono?: boolean }) {
  if (!text) return null;
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--notion-text-muted)]">{title}</h3>
      <p className={`mt-1 whitespace-pre-wrap leading-relaxed ${mono ? 'font-mono text-xs text-[var(--notion-text-muted)]' : 'text-sm'}`}>{text}</p>
    </div>
  );
}

function AiPageView({ page: p, card, fronts, canEdit, onOpen, onTurnIntoCard, onOpenTask, onSection, now }: AiPagesProps & { page: AiPage; card?: AiCardLink; now: Date }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const st = statusOf(p, now);
  const sectionOf = AI_SECTIONS.find(s => s.id !== 'todas' && s.kinds.includes(p.kind));
  useEffect(() => { const k = (e: KeyboardEvent) => { if (e.key === 'Escape' && !document.querySelector('[role="dialog"]')) onOpen(null); }; window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, [onOpen]);
  const turn = async () => {
    setBusy(true); setError('');
    try { await onTurnIntoCard(p); } catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível criar o card.'); } finally { setBusy(false); }
  };
  return (
    <div className="nt-root h-full w-full overflow-y-auto bg-[var(--notion-bg)] text-[var(--notion-text)]">
      <article className="mx-auto max-w-[860px] px-6 pb-16 pt-6 sm:px-10">
        <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--notion-text-muted)]">
          <nav aria-label="Caminho" className="flex min-w-0 items-center gap-1">
            <button type="button" onClick={() => { onSection('todas'); onOpen(null); }} className="rounded px-1 hover:bg-[var(--notion-hover)] hover:text-[var(--notion-text)]">🤖 Páginas IA</button>
            {sectionOf && <><ChevronRight size={12} aria-hidden="true" /><button type="button" onClick={() => { onSection(sectionOf.id); onOpen(null); }} className="rounded px-1 hover:bg-[var(--notion-hover)] hover:text-[var(--notion-text)]">{sectionOf.icon} {sectionOf.title}</button></>}
          </nav>
          <span className="flex-1" />
          <Soon>Pedir nova versão</Soon>
          <Soon>Mandar para a Wiki</Soon>
          {card ? (
            <button type="button" onClick={() => onOpenTask(card.id)} className="inline-flex items-center gap-1 rounded-md border border-cyan-300 bg-cyan-50 px-2.5 py-1 text-xs font-semibold text-cyan-800 hover:bg-cyan-100">
              <ListPlus size={13} aria-hidden="true" />Abrir card
            </button>
          ) : (
            <button type="button" disabled={busy || !canEdit} onClick={() => void turn()} title={canEdit ? 'Cria a Tarefa com a ação e o critério de sucesso' : 'Criar cards requer acesso de edição'}
              className="inline-flex items-center gap-1 rounded-md bg-cyan-700 px-2.5 py-1 text-xs font-semibold text-white hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-60">
              <ListPlus size={13} aria-hidden="true" />{busy ? 'Criando card…' : 'Virar card'}
            </button>
          )}
        </div>
        {error && <p role="alert" className="mt-2 text-right text-xs text-red-700">{error}</p>}

        <div className="mt-6 text-4xl" aria-hidden="true">{KIND_ICON[p.kind]}</div>
        <h1 className="mt-2 text-[28px] font-bold leading-tight tracking-tight">{p.title}</h1>

        <div className="mt-4 grid grid-cols-[120px_minmax(0,1fr)] gap-x-3 gap-y-1.5 border-b border-[var(--notion-border)] pb-4 text-sm">
          <Prop label="Tipo"><Kind kind={p.kind} /></Prop>
          <Prop label="Agente"><span className="font-mono text-xs">{p.agent}</span>{p.executor && <span className="text-[var(--notion-text-muted)]"> · executado por {p.executor}</span>}<span className="text-[var(--notion-text-muted)]"> · gerado em {fmtDay(p.createdAt)}</span></Prop>
          <Prop label="Frente">{frontName(p.frontKey, fronts)}</Prop>
          <Prop label="Fonte">{sourceLine(p)}</Prop>
          <Prop label="Validade">
            <span className="inline-flex flex-wrap items-center gap-2">
              <Status status={st} since={p.validUntil} />
              {st !== 'vencida' && <span className="tabular-nums text-[var(--notion-text-muted)]">{p.validUntil ? `vale até ${fmtDay(p.validUntil)}` : 'sem validade'}</span>}
            </span>
          </Prop>
          <Prop label="Severidade">{[p.severity, p.confidence && `confiança ${p.confidence}`].filter(Boolean).join(' · ')}</Prop>
          <Prop label="Ligações">
            {(card || p.links.length) ? (
              <span className="flex flex-wrap gap-1">
                {card && <button type="button" onClick={() => onOpenTask(card.id)} className="rounded bg-cyan-50 px-1.5 py-0.5 text-xs font-semibold text-cyan-800 hover:underline">Card: {card.title}</button>}
                {p.links.map(l => <span key={l} className="rounded bg-[var(--notion-hover)] px-1.5 py-0.5 text-xs">{l}</span>)}
              </span>
            ) : <span className="text-[var(--notion-text-muted)]">nenhuma</span>}
          </Prop>
        </div>

        {st === 'vencida' && (
          <div className="mt-4 flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            <AlertTriangle size={14} aria-hidden="true" />Os números são de {fmtDay(p.createdAt)}. Leia como histórico até o agente rodar de novo.
          </div>
        )}

        <div className="mt-5 grid grid-cols-1 gap-x-8 gap-y-5 md:grid-cols-2">
          <Block title="Sinal" text={p.signal} />
          <Block title="Impacto" text={p.impact} />
          <Block title="Causa provável" text={p.cause} />
          <Block title="Ação" text={p.action} />
          <Block title="Critério de sucesso" text={p.success} />
          <Block title="Evidência" text={p.evidence} mono />
          {p.extra.map(s => <Block key={s.title} title={s.title} text={s.text} />)}
        </div>
        <p className="mt-8 border-t border-dashed border-[var(--notion-border)] pt-3 text-xs text-[var(--notion-text-muted)]">
          Página só leitura, vinda de {p.sourceTable}. Para mudar o conteúdo, rode o agente de novo.
        </p>
      </article>
    </div>
  );
}
