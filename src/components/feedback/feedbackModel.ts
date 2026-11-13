// Correções e melhorias: modelo puro (sem Supabase nem DOM), testado em feedbackModel.test.ts.
import { readTabFromSearch, type TabId } from '../../services/tabNavigation';
import { readGrowthLearningSection } from '../growth-learning/growthLearningNavigation';

export type FeedbackKind = 'knowledge' | 'app_adjustment' | 'question';
export type FeedbackStatus =
  | 'open' | 'in_conversation' | 'deferred' | 'declined' | 'with_ai'
  | 'proposal_ready' | 'ai_disagrees' | 'needs_data' | 'approved' | 'applied';
export type FeedbackTargetType =
  | 'note' | 'initiative' | 'work_item' | 'feed_item' | 'report_live' | 'bet' | 'outcome' | 'memory' | 'element' | 'page';

export interface FeedbackAnchor {
  exact?: string;
  prefix?: string;
  suffix?: string;
  heading?: string;
  note_hash?: string;
  selector?: string;
}

export interface FeedbackProposal {
  summary: string;
  before?: string;
  after?: string;
  sources?: string;
  executor?: string;
}

export interface FeedbackItem {
  id: string;
  revision: number;
  kind: FeedbackKind;
  item_type: string;
  body: string;
  front: string | null;
  subject: string | null;
  surface: string;
  page_label: string;
  location_label: string;
  route: string;
  target_type: FeedbackTargetType | null;
  target_id: string | null;
  anchor: FeedbackAnchor;
  anchor_state: 'none' | 'anchored' | 'orphan';
  context: Record<string, unknown>;
  status: FeedbackStatus;
  priority: number | null;
  decision_note: string | null;
  decided_at: string | null;
  decided_via: 'claude' | 'codex' | 'gaas' | null;
  executor: string | null;
  proposal: FeedbackProposal | null;
  review_note: string | null;
  contribution_id: string | null;
  work_item_id: string | null;
  result_ref: string | null;
  created_by: string;
  created_at: string;
  updated_by: string | null;
  updated_at: string;
}

export interface FeedbackAttachment {
  id: string;
  item_id: string;
  storage_path: string;
  file_name: string;
  mime_type: string;
  bytes: number;
  created_by: string;
  created_at: string;
}

export interface FeedbackEvent {
  id: string;
  item_id: string;
  event: string;
  from_status: string | null;
  to_status: string | null;
  note: string | null;
  actor_id: string | null;
  created_at: string;
}

export interface FeedbackRule {
  id: string;
  rule_text: string;
  applies_to: string;
  source_items: string[];
  status: 'proposed' | 'active' | 'retired';
  approved_at: string | null;
  created_at: string;
}

/** O que o formulário recebe de uma tela que abriu a correção já ancorada. */
export interface FeedbackTarget {
  surface?: string;
  pageLabel?: string;
  locationLabel?: string;
  targetType?: FeedbackTargetType;
  targetId?: string;
  anchor?: FeedbackAnchor;
  front?: string;
  subject?: string;
  kind?: FeedbackKind;
  itemType?: string;
  generated?: boolean;
}

export const KIND_LABELS: Record<FeedbackKind, string> = {
  knowledge: 'Corrigir conhecimento',
  app_adjustment: 'Ajuste no app',
  question: 'Dúvida',
};

export const ITEM_TYPES: Record<FeedbackKind, [string, string][]> = {
  knowledge: [
    ['numero_velho', 'Número velho'], ['fato_errado', 'Fato errado'], ['contradicao', 'Contradição'],
    ['falta_contexto', 'Falta contexto'], ['texto_confuso', 'Texto confuso'], ['link_errado', 'Link ou conexão errada'],
    ['causa_sem_prova', 'Causa sem prova'], ['renomear', 'Renomear'], ['arquivar', 'Arquivar'],
  ],
  app_adjustment: [['bug', 'Bug'], ['layout', 'Layout'], ['renomear', 'Renomear'], ['ideia', 'Ideia']],
  question: [['duvida', 'Dúvida']],
};

const TYPE_LABELS = new Map<string, string>(Object.values(ITEM_TYPES).flat());
export const itemTypeLabel = (type: string) => TYPE_LABELS.get(type) || (type === 'outro' ? 'Outro' : type.replace(/_/g, ' '));

export const STATUS_LABELS: Record<FeedbackStatus, string> = {
  open: 'Aberto',
  in_conversation: 'Na conversa',
  deferred: 'Adiado',
  declined: 'Não vamos fazer',
  with_ai: 'Com a IA',
  proposal_ready: 'Proposta pronta',
  ai_disagrees: 'IA discorda',
  needs_data: 'Precisa de dado',
  approved: 'Aprovado',
  applied: 'Aplicado',
};

export const statusLabel = (item: Pick<FeedbackItem, 'status' | 'priority'>) =>
  item.status === 'in_conversation' && item.priority ? `Na conversa · prioridade ${item.priority}` : STATUS_LABELS[item.status];

export const STATUS_TONE: Record<FeedbackStatus, string> = {
  open: 'bg-amber-50 text-amber-800',
  in_conversation: 'bg-cyan-50 text-cyan-800',
  deferred: 'bg-slate-100 text-slate-600',
  declined: 'bg-slate-100 text-slate-600',
  with_ai: 'bg-blue-50 text-blue-800',
  proposal_ready: 'bg-emerald-50 text-emerald-800',
  ai_disagrees: 'bg-orange-50 text-orange-800',
  needs_data: 'bg-orange-50 text-orange-800',
  approved: 'bg-emerald-50 text-emerald-800',
  applied: 'bg-slate-100 text-slate-600',
};

export const OPEN_STATUSES: FeedbackStatus[] = ['open', 'in_conversation', 'with_ai', 'proposal_ready', 'ai_disagrees', 'needs_data', 'approved'];
export const REVIEW_STATUSES: FeedbackStatus[] = ['proposal_ready', 'ai_disagrees', 'needs_data'];
export const isOpen = (status: FeedbackStatus) => OPEN_STATUSES.includes(status);

/** Frentes de negócio do formulário. Ajuste do app sem frente fica sem tag de frente (a tag de página já diz onde é). */
export const FRONTS = ['Aquisição CRM', 'Rentabilização CRM', 'Cross-sell CRM', 'Mídia Paga', 'Originação B2C', 'Spec Driven Development'];

export const LEARNING_SECTION_LABELS: Record<string, string> = {
  feed: 'Fila',
  daily: 'Visão Daily',
  structure: 'Estrutura CRM',
  vault: 'Wiki',
  corrections: 'Correções e melhorias',
  investigations: 'Tarefas e atividades',
  'report-live': 'Report Live',
  bets: 'Apostas',
  outcomes: 'Outcomes',
  memory: 'Registros',
};

export const TAB_LABELS: Record<TabId, string> = {
  launch: 'Launch Planner',
  resultados: 'Resultados',
  jornada: 'Jornada & Disparos',
  framework: 'Framework',
  diario: 'Diário de Bordo',
  orientador: 'Orientador',
  configuracoes: 'Configurações',
  'originacao-b2c': 'Originação B2C',
  'funil-aquisicao': 'Funil de Aquisição',
  'midia-paga': 'Mídia Paga',
  explorador: 'Jornada e Aquisição',
  relatorio: 'Relatórios | Aquisição',
  'relatorio-seguros': 'Relatórios | Seguros',
  'aprendizado-growth': 'Loop de Memória',
  operacao: 'Operação',
  comunicacoes: 'Comunicações',
  'comunicacoes-cadastro': 'Cadastro e Templates',
  'comunicacoes-performance': 'Performance do Conteúdo',
  'comunicacoes-fluxo': 'Fluxo de Jornada',
  'comunicacoes-appsflyer-auditoria': 'Auditoria AppsFlyer',
  'comunicacoes-email-dinamico': 'Fábrica de E-mails',
};

/**
 * Tag de página (decisão do Pablo, 03/11/2026): nota ou item de leitura vira "Wiki";
 * qualquer outra aba usa o nome da página. Nunca é digitada: sai da rota.
 */
export function resolvePage(search: string): { surface: string; pageLabel: string } {
  const params = new URLSearchParams(search);
  const tab = readTabFromSearch(search);
  if (tab === 'aprendizado-growth' || tab === 'operacao') {
    const section = readGrowthLearningSection(search, tab === 'operacao' ? 'operacao' : 'learning');
    return { surface: section, pageLabel: LEARNING_SECTION_LABELS[section] || TAB_LABELS[tab] || 'Loop de Memória' };
  }
  return { surface: tab, pageLabel: TAB_LABELS[tab] || 'GaaS' };
}

/** Notas geradas por script: corrigir a página não adianta, a correção vai para o gerador. */
export const isGeneratedNote = (path: string | null | undefined) => Boolean(path && /(^|\/)Assunto-[^/]+\.md$/.test(path));

const clip = (text: string, max: number) => text.length > max ? text.slice(0, max) : text;

/** Âncora por citação (W3C TextQuoteSelector): trecho exato com um pedaço antes e depois. */
export function buildQuoteAnchor(fullText: string, exact: string, heading?: string): FeedbackAnchor {
  const quote = clip(exact.replace(/\s+/g, ' ').trim(), 600);
  if (!quote) return {};
  const normalized = fullText.replace(/\s+/g, ' ');
  const at = normalized.indexOf(quote);
  const anchor: FeedbackAnchor = { exact: quote };
  if (at >= 0) {
    anchor.prefix = normalized.slice(Math.max(0, at - 40), at);
    anchor.suffix = normalized.slice(at + quote.length, at + quote.length + 40);
  }
  if (heading) anchor.heading = clip(heading, 200);
  return anchor;
}

/** Âncora continua válida se o trecho exato ainda existe no texto atual da nota. */
export function anchorStillMatches(anchor: FeedbackAnchor, currentText: string): boolean {
  if (!anchor.exact) return true;
  return currentText.replace(/\s+/g, ' ').includes(anchor.exact);
}

export interface FeedbackFilters {
  q: string;
  page: string;
  front: string;
  subject: string;
  state: 'open' | 'conversation' | 'ai' | 'closed' | 'all';
  onlyApp: boolean;
  targetId?: string;
}

export const EMPTY_FILTERS: FeedbackFilters = { q: '', page: '', front: '', subject: '', state: 'open', onlyApp: false };

export function matchesFilters(item: FeedbackItem, f: FeedbackFilters): boolean {
  if (f.targetId && item.target_id !== f.targetId) return false;
  if (f.page && item.page_label !== f.page) return false;
  if (f.front && item.front !== f.front) return false;
  if (f.subject && item.subject !== f.subject) return false;
  if (f.onlyApp && item.kind !== 'app_adjustment') return false;
  const stateOk = f.state === 'all'
    || f.state === 'open' && isOpen(item.status)
    || f.state === 'conversation' && item.status === 'in_conversation'
    || f.state === 'ai' && ['with_ai', ...REVIEW_STATUSES].includes(item.status)
    || f.state === 'closed' && ['declined', 'applied', 'deferred'].includes(item.status);
  if (!stateOk) return false;
  if (f.q) {
    const hay = `${item.body} ${item.location_label} ${item.page_label} ${item.front || ''} ${item.subject || ''} ${item.decision_note || ''}`.toLocaleLowerCase('pt-BR');
    if (!hay.includes(f.q.toLocaleLowerCase('pt-BR'))) return false;
  }
  return true;
}

/** Prioridade combinada primeiro; depois os mais recentes. */
export function sortItems(items: FeedbackItem[]): FeedbackItem[] {
  return [...items].sort((a, b) =>
    (a.priority ?? 1e6) - (b.priority ?? 1e6) || b.created_at.localeCompare(a.created_at));
}

export interface ReviewNote {
  id: string;
  relative_path: string;
  title: string;
  status: string | null;
  content_hash: string;
  updated: string | null;
}
export interface ReviewRecord { relative_path: string; content_hash: string; verdict: 'ok' | 'needs_fix' | 'archive' | 'skip'; reviewed_at: string }

/** Data editorial da nota (`atualizado` no frontmatter), em AAAA-MM-DD, ou null. */
export function editorialDate(frontmatter: Record<string, unknown> | null | undefined): string | null {
  const value = frontmatter?.atualizado;
  const text = value instanceof Date ? value.toISOString() : typeof value === 'string' ? value : '';
  const match = text.replace(/['"]/g, '').match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : null;
}

export const daysSince = (date: string | null, today: Date) =>
  date ? Math.floor((today.getTime() - new Date(date + 'T12:00:00').getTime()) / 86400000) : null;

/** Revisada por pessoa = último veredito "ok" com o mesmo hash da versão atual. */
export function humanReviewOf(note: Pick<ReviewNote, 'relative_path' | 'content_hash'>, reviews: ReviewRecord[]): ReviewRecord | null {
  return reviews
    .filter(r => r.relative_path === note.relative_path && r.verdict === 'ok' && r.content_hash === note.content_hash)
    .sort((a, b) => b.reviewed_at.localeCompare(a.reviewed_at))[0] || null;
}

const isReviewable = (path: string) => !isGeneratedNote(path) && !path.startsWith('98-Legado/') && !path.startsWith('99-Templates/');

/**
 * Fila do "Revisar próxima": notas editoriais sem revisão humana da versão atual e sem veredito recente
 * para esta versão; as mais antigas primeiro.
 */
export function reviewQueue(notes: ReviewNote[], reviews: ReviewRecord[]): ReviewNote[] {
  const touched = new Set(reviews.map(r => r.relative_path + '|' + r.content_hash));
  return notes
    .filter(n => isReviewable(n.relative_path) && !touched.has(n.relative_path + '|' + n.content_hash))
    .sort((a, b) => (a.updated || '0000').localeCompare(b.updated || '0000') || a.relative_path.localeCompare(b.relative_path));
}

export interface HealthSummary { total: number; reviewed: number; stale: number; generated: number; withOpenItems: number }

export function healthSummary(notes: ReviewNote[], reviews: ReviewRecord[], items: FeedbackItem[], today: Date): HealthSummary {
  const openTargets = new Set(items.filter(i => i.target_type === 'note' && isOpen(i.status)).map(i => i.target_id));
  return {
    total: notes.length,
    reviewed: notes.filter(n => humanReviewOf(n, reviews)).length,
    stale: notes.filter(n => isReviewable(n.relative_path) && (daysSince(n.updated, today) ?? 0) > 120).length,
    generated: notes.filter(n => isGeneratedNote(n.relative_path)).length,
    withOpenItems: notes.filter(n => openTargets.has(n.relative_path)).length,
  };
}

/** Texto copiável para rodar a skill no Claude Code ou no Codex. A plataforma não inicia LLM sozinha. */
export const AI_COMMAND = 'Use a skill correcoes-e-melhorias-gaas do repositório: leia a aba Correções e melhorias, me apresente cada item aberto em tópicos (o quê, onde, quem pediu, ajuste ou coisa nova, evidência e proposta) e espere eu definir a ordem antes de executar.';
