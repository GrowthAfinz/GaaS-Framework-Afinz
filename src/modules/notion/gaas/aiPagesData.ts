/**
 * Páginas IA: as respostas dos agentes (insights, investigações, propostas) num lugar só, como páginas.
 * Só leitura. Junta tabelas que já existem e calcula a validade pelo tipo; página vencida aparece como vencida.
 */
import { supabase } from '../../../services/supabaseClient';

export type AiKind = 'insight_crm' | 'insight_midia' | 'investigacao' | 'proposta';
/** Subpáginas da barra lateral. Análises ainda não têm tabela: ficam vazias até a próxima etapa. */
export type AiSection = 'todas' | 'analises' | 'investigacoes' | 'insights_crm' | 'insights_midia' | 'planos';
export type AiStatus = 'revisar' | 'valida' | 'vencida';

export const AI_SECTIONS: { id: AiSection; icon: string; title: string; kinds: AiKind[] }[] = [
  { id: 'todas', icon: '🤖', title: 'Páginas IA', kinds: ['insight_crm', 'insight_midia', 'investigacao', 'proposta'] },
  { id: 'analises', icon: '📊', title: 'Análises', kinds: [] },
  { id: 'investigacoes', icon: '🔎', title: 'Investigações', kinds: ['investigacao'] },
  { id: 'insights_crm', icon: '💡', title: 'Insights CRM', kinds: ['insight_crm'] },
  { id: 'insights_midia', icon: '📣', title: 'Insights de mídia', kinds: ['insight_midia'] },
  { id: 'planos', icon: '🧭', title: 'Planos e pautas', kinds: ['proposta'] },
];

export const KIND_LABEL: Record<AiKind, string> = { insight_crm: 'Insight CRM', insight_midia: 'Insight de mídia', investigacao: 'Investigação', proposta: 'Proposta' };
export const KIND_ICON: Record<AiKind, string> = { insight_crm: '💡', insight_midia: '📣', investigacao: '🔎', proposta: '🧭' };
const KIND_PHRASE: Record<AiKind, string> = { insight_crm: 'insight de CRM', insight_midia: 'insight de mídia', investigacao: 'investigação', proposta: 'proposta' };
export const STATUS_LABEL: Record<AiStatus, string> = { revisar: 'Para revisar', valida: 'Válida', vencida: 'Vencida' };
/** Dias de validade por tipo. Proposta não vence. */
export const VALIDITY_DAYS: Record<AiKind, number | null> = { insight_crm: 30, insight_midia: 30, investigacao: 45, proposta: null };
export const DEFAULT_AGENT: Record<AiKind, string> = {
  insight_crm: 'gaas-insight-engine', insight_midia: 'paid-media-campaign-analyst', investigacao: 'gaas-growth-investigation', proposta: 'curadoria',
};
const FRONT_NAMES: Record<string, string> = { aq: 'Aquisição', re: 'Rentabilização', se: 'Seguros', op: 'Operação', gaas: 'GaaS (SDD)' };

export interface AiSectionText { title: string; text: string }
export interface AiPage {
  key: string;
  kind: AiKind;
  sourceTable: string;
  sourceId: string;
  title: string;
  frontKey: string;
  agent: string;
  /** Quem executou o agente, quando o registro diz (agent_metadata.name). */
  executor: string | null;
  source: string;
  period: string;
  createdAt: string;
  validUntil: string | null;
  reviewed: boolean;
  severity: string | null;
  confidence: string | null;
  links: string[];
  signal: string; impact: string; cause: string; action: string; success: string; evidence: string;
  extra: AiSectionText[];
}
export interface AiCardLink { id: string; title: string; key: string }

/* ---------- formatos ---------- */
const DAY = 86400000;
const dt = (s: string | null | undefined) => (s ? new Date(s.length === 10 ? s + 'T12:00:00' : s) : null);
export const fmtDay = (s: string | null | undefined) => { const d = dt(s); return d && !isNaN(d.getTime()) ? d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'America/Sao_Paulo' }) : ''; };
const shortDay = (s: string | null | undefined) => fmtDay(s).slice(0, 5);
const str = (v: unknown) => (typeof v === 'string' ? v.trim() : v == null ? '' : String(v));
/** Texto sem travessão (regra da casa), com espaços normalizados. */
export const plain = (v: unknown) => str(v).replace(/\s*[—–]\s*/g, ', ').replace(/[ \t]+/g, ' ').trim();
const firstSentence = (s: string, max = 140) => {
  const t = plain(s); if (!t) return '';
  const cut = t.split(/(?<=[.!?])\s/)[0] || t;
  return cut.length > max ? cut.slice(0, max - 1).trimEnd() + '…' : cut.replace(/[.]$/, '');
};
const lines = (v: unknown): string => Array.isArray(v)
  ? v.map(x => (x && typeof x === 'object' ? plain((x as { text?: unknown }).text ?? JSON.stringify(x)) : plain(x))).filter(Boolean).map(x => `• ${x}`).join('\n')
  : plain(v);
const label = (k: string) => k.replace(/_/g, ' ');
/** jsonb de evidência em linhas "chave: valor", objetos aninhados em uma linha. */
export function evidenceText(o: unknown): string {
  if (!o || typeof o !== 'object') return plain(o);
  if (Array.isArray(o)) return lines(o);
  return Object.entries(o as Record<string, unknown>).filter(([, v]) => v != null && v !== '')
    .map(([k, v]) => `${label(k)}: ${Array.isArray(v) && v.every(x => typeof x !== 'object') ? v.map(plain).join(', ') : typeof v === 'object' ? JSON.stringify(v) : typeof v === 'number' ? v.toLocaleString('pt-BR', { maximumFractionDigits: 2 }) : plain(v)}`).join('\n');
}
const addDays = (iso: string, days: number) => new Date(new Date(iso).getTime() + days * DAY).toISOString();
export const validUntilOf = (kind: AiKind, createdAt: string): string | null => {
  const d = VALIDITY_DAYS[kind]; return d == null || !createdAt ? null : addDays(createdAt, d);
};
/** Vencida passa na frente de tudo; senão, revisada vira Válida e o resto fica Para revisar. */
export function statusOf(p: Pick<AiPage, 'validUntil' | 'reviewed'>, now = new Date()): AiStatus {
  if (p.validUntil && new Date(p.validUntil).getTime() < now.getTime()) return 'vencida';
  return p.reviewed ? 'valida' : 'revisar';
}
export const frontName = (key: string, fronts: { key: string; name: string }[] = []) => fronts.find(f => f.key === key)?.name || FRONT_NAMES[key] || key;

/* ---------- linhas de cada tabela para página ---------- */
export interface CrmInsightRow { id: string; titulo: string; tipo: string; severidade: string; confianca: string; periodo_inicio: string | null; periodo_fim: string | null; bu: string | null; canal: string | null; segmento: string | null; sinal: string; impacto: string; causa_provavel: string; evidencia: unknown; acao: string; criterio_sucesso: string | null; status: string; fonte: string; gerado_em: string }
export interface MediaInsightRow { id: string; generated_at: string; period_start: string | null; period_end: string | null; score: number | null; channel: string | null; campaign: string | null; adset_name: string | null; ad_name: string | null; tipo: string | null; contexto: string | null; mudanca: string | null; causa: string | null; acoes: unknown; evidencias: unknown; status: string | null }
export interface InvestigationRow { id: string; investigation_id: string | null; evidence_id?: string | null; body: Record<string, unknown> | null; agent_metadata: Record<string, unknown> | null; created_at: string; reviewed?: boolean; period?: string | null }
export interface ProposalRow { id: string; source_ref: string; front: string; bucket: string; title: string; problem: string; evidence: string; action_text: string; metric_name: string | null; confidence_status: string; reading_limit: string; lifecycle_status: string; created_at: string }

const SEVERITY: Record<string, string> = { critico: 'Crítico', alto: 'Alto', medio: 'Médio', baixo: 'Baixo' };
const CONFIDENCE: Record<string, string> = { alta: 'alta', media: 'média', baixa: 'baixa', confirmed: 'confirmada', directional: 'direcional', suspect: 'suspeita', blocked: 'bloqueada' };
const CRM_TYPE: Record<string, string> = { gargalo: 'gargalo', decomposicao_cac: 'decomposição de CAC', share_portfolio: 'peso no portfólio', risco_concentracao: 'risco de concentração', oportunidade: 'oportunidade', queda_performance: 'queda de performance', virada_safra: 'virada de safra' };
const MEDIA_TYPE: Record<string, string> = { tendencia: 'tendência', risco: 'risco', anomalia: 'anomalia', oportunidade: 'oportunidade' };
const PROPOSAL_FRONT: Record<string, string> = { crm_acquisition: 'aq', paid_media: 'aq', b2c_origin: 'aq' };

export function fromCrm(r: CrmInsightRow): AiPage {
  return {
    key: 'crm:' + r.id, kind: 'insight_crm', sourceTable: 'crm_insights', sourceId: r.id,
    title: plain(r.titulo) || 'Insight sem título', frontKey: 'aq', agent: DEFAULT_AGENT.insight_crm, executor: null,
    source: 'activities', period: r.periodo_inicio || r.periodo_fim ? `${shortDay(r.periodo_inicio)} a ${shortDay(r.periodo_fim)}` : '',
    createdAt: r.gerado_em, validUntil: validUntilOf('insight_crm', r.gerado_em), reviewed: ['fixado', 'resolvido'].includes(r.status),
    severity: [SEVERITY[r.severidade] || r.severidade, CRM_TYPE[r.tipo] || r.tipo].filter(Boolean).join(' · ') || null,
    confidence: CONFIDENCE[r.confianca] || r.confianca || null,
    links: [r.bu, r.segmento, r.canal].map(plain).filter(Boolean),
    signal: plain(r.sinal), impact: plain(r.impacto), cause: plain(r.causa_provavel), action: plain(r.acao), success: plain(r.criterio_sucesso), evidence: evidenceText(r.evidencia),
    extra: [],
  };
}
export function fromMedia(r: MediaInsightRow): AiPage {
  const channel = r.channel === 'meta' ? 'Meta' : r.channel === 'google' ? 'Google' : plain(r.channel) || 'Mídia paga';
  const actions = Array.isArray(r.acoes) ? lines(r.acoes) : plain(r.acoes);
  return {
    key: 'midia:' + r.id, kind: 'insight_midia', sourceTable: 'paid_media_insights', sourceId: r.id,
    title: firstSentence(r.mudanca || '') || plain(r.ad_name) || plain(r.campaign) || 'Insight de mídia', frontKey: /seguro/i.test(r.campaign || '') ? 'se' : 'aq',
    agent: DEFAULT_AGENT.insight_midia, executor: null, source: channel, period: r.period_start || r.period_end ? `${shortDay(r.period_start)} a ${shortDay(r.period_end)}` : '',
    createdAt: r.generated_at, validUntil: validUntilOf('insight_midia', r.generated_at), reviewed: ['resolvido', 'done', 'dismissed'].includes(r.status || ''),
    severity: [MEDIA_TYPE[r.tipo || ''] || plain(r.tipo), r.score != null ? `nota ${r.score}` : ''].filter(Boolean).join(' · ') || null, confidence: null,
    links: [r.campaign, r.adset_name, r.ad_name].map(plain).filter(Boolean),
    signal: plain(r.mudanca), impact: plain(r.contexto), cause: plain(r.causa), action: actions, success: '', evidence: evidenceText(r.evidencias),
    extra: [],
  };
}
export function fromInvestigation(r: InvestigationRow): AiPage {
  const b = r.body || {};
  const cand = (b.candidate && typeof b.candidate === 'object' ? b.candidate : {}) as Record<string, unknown>;
  const summary = plain(b.summary);
  const status = str(b.status);
  return {
    key: 'inv:' + r.id, kind: 'investigacao', sourceTable: 'growth_investigation_analyses', sourceId: r.id,
    title: plain(cand.title) || firstSentence(summary) || 'Investigação', frontKey: 'aq', agent: DEFAULT_AGENT.investigacao,
    executor: plain(r.agent_metadata?.name) || null, source: 'activities', period: r.period ? `até ${shortDay(r.period)}` : '',
    createdAt: r.created_at, validUntil: validUntilOf('investigacao', r.created_at), reviewed: Boolean(r.reviewed),
    severity: status === 'conclusive' ? 'Conclusiva' : status === 'blocked' ? 'Bloqueada por dado' : status ? plain(status) : null, confidence: null,
    links: [],
    signal: summary, impact: cand.metric ? `Métrica: ${plain(cand.metric)}` : '', cause: lines(b.hypotheses), action: plain(cand.action) || lines(b.next_checks),
    success: plain(cand.success_criterion), evidence: lines(b.facts),
    extra: [
      { title: 'Limitações', text: lines(b.limitations) },
      ...(cand.action ? [{ title: 'Próximas checagens', text: lines(b.next_checks) }] : []),
    ].filter(s => s.text),
  };
}
export function fromProposal(r: ProposalRow): AiPage {
  return {
    key: 'prop:' + r.id, kind: 'proposta', sourceTable: 'growth_curated_proposals', sourceId: r.id,
    title: plain(r.title) || 'Proposta', frontKey: PROPOSAL_FRONT[r.front] || 'aq', agent: DEFAULT_AGENT.proposta, executor: null,
    source: plain(r.source_ref), period: '', createdAt: r.created_at, validUntil: null, reviewed: ['validated', 'converted'].includes(r.lifecycle_status),
    severity: plain(r.bucket) || null, confidence: CONFIDENCE[r.confidence_status] || r.confidence_status || null,
    links: [],
    signal: plain(r.problem), impact: '', cause: '', action: plain(r.action_text), success: r.metric_name ? `Métrica: ${plain(r.metric_name)}` : '', evidence: plain(r.evidence),
    extra: [{ title: 'Limite da leitura', text: plain(r.reading_limit) }].filter(s => s.text),
  };
}

/* ---------- filtros ---------- */
export interface AiFilter { section: AiSection; agent: string; kind: AiKind | ''; status: AiStatus | ''; query?: string }
export const matchesAgent = (p: AiPage, agent: string) => !agent || p.agent === agent || p.executor === agent;
export function filterPages(pages: AiPage[], f: AiFilter, now = new Date()): AiPage[] {
  const kinds = AI_SECTIONS.find(s => s.id === f.section)?.kinds || [];
  const q = (f.query || '').trim().toLowerCase();
  return pages.filter(p => kinds.includes(p.kind) && matchesAgent(p, f.agent) && (!f.kind || p.kind === f.kind)
    && (!f.status || statusOf(p, now) === f.status) && (!q || p.title.toLowerCase().includes(q)));
}
/** Chips de agente: os padrões, mais os executores que aparecem em agent_metadata. */
export function agentCounts(pages: AiPage[]): { agent: string; count: number }[] {
  const names = [...new Set([...Object.values(DEFAULT_AGENT), ...pages.map(p => p.executor).filter((x): x is string => Boolean(x))])];
  return names.map(agent => ({ agent, count: pages.filter(p => matchesAgent(p, agent)).length }));
}
export const sectionCount = (pages: AiPage[], s: AiSection) => { const k = AI_SECTIONS.find(x => x.id === s)?.kinds || []; return pages.filter(p => k.includes(p.kind)).length; };
/** Ordem: mais novas primeiro (vencidas ficam onde caírem, nunca somem). */
export const sortPages = (pages: AiPage[]) => [...pages].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

/* ---------- virar card ---------- */
export interface CardDraft { title: string; description: string; acceptance_criteria: string[]; front_key: string; priority: 'P1' | 'P2'; details: Record<string, string> }
export function cardDraft(p: AiPage): CardDraft {
  let title = p.title.replace(/\s+/g, ' ').trim();
  if (title.length > 180) title = title.slice(0, 177).trimEnd() + '…';
  if (title.length < 5) title = `${KIND_LABEL[p.kind]}: ${title}`;
  const origin = `Origem: Páginas IA, ${KIND_PHRASE[p.kind]} de ${p.agent}${p.executor ? ` (via ${p.executor})` : ''} em ${fmtDay(p.createdAt)}. Fonte: ${[p.source, p.period].filter(Boolean).join(', ') || 'não informada'}.`;
  const description = [p.action && `Ação: ${p.action}`, p.signal && `Sinal: ${p.signal}`, origin].filter(Boolean).join('\n\n');
  return {
    title, description, acceptance_criteria: p.success ? [p.success] : [], front_key: p.frontKey,
    priority: /cr[ií]tico|alto/i.test(p.severity || '') ? 'P1' : 'P2',
    details: { ai_page: p.key, ai_source: p.sourceTable, ai_source_id: p.sourceId },
  };
}

/* ---------- leitura no Supabase ---------- */
export async function loadAiPages(): Promise<{ pages: AiPage[]; failed: string[] }> {
  const failed: string[] = [];
  const read = async <T,>(name: string, q: PromiseLike<{ data: unknown; error: unknown }>): Promise<T[]> => {
    try { const { data, error } = await q; if (error) throw error; return (data || []) as T[]; } catch { failed.push(name); return []; }
  };
  const [crm, media, inv, props, invs, decisions] = await Promise.all([
    read<CrmInsightRow>('Insights CRM', supabase.from('crm_insights').select('id,titulo,tipo,severidade,confianca,periodo_inicio,periodo_fim,bu,canal,segmento,sinal,impacto,causa_provavel,evidencia,acao,criterio_sucesso,status,fonte,gerado_em').neq('status', 'descartado').order('gerado_em', { ascending: false }).limit(500)),
    read<MediaInsightRow>('Insights de mídia', supabase.from('paid_media_insights').select('id,generated_at,period_start,period_end,score,channel,campaign,adset_name,ad_name,tipo,contexto,mudanca,causa,acoes,evidencias,status').order('generated_at', { ascending: false }).limit(1000)),
    read<InvestigationRow>('Investigações', supabase.from('growth_investigation_analyses').select('id,investigation_id,evidence_id,body,agent_metadata,created_at').order('created_at', { ascending: false }).limit(300)),
    read<ProposalRow>('Propostas', supabase.from('growth_curated_proposals').select('id,source_ref,front,bucket,title,problem,evidence,action_text,metric_name,confidence_status,reading_limit,lifecycle_status,created_at').neq('lifecycle_status', 'dismissed').order('created_at', { ascending: false }).limit(300)),
    read<{ id: string; period: string | null }>('Investigações', supabase.from('growth_investigations').select('id,period').limit(500)),
    read<{ evidence_id: string | null }>('Investigações', supabase.from('growth_investigation_decisions').select('evidence_id').limit(1000)),
  ]);
  const periodOf = new Map(invs.map(i => [i.id, i.period]));
  // Decisão humana sobre a mesma evidência conta como revisão.
  const decided = new Set(decisions.map(d => d.evidence_id).filter(Boolean));
  const pages = [
    ...crm.map(fromCrm), ...media.map(fromMedia),
    ...inv.map(r => fromInvestigation({ ...r, reviewed: Boolean(r.evidence_id && decided.has(r.evidence_id)), period: r.investigation_id ? periodOf.get(r.investigation_id) ?? null : null })),
    ...props.map(fromProposal),
  ];
  return { pages: sortPages(pages), failed: [...new Set(failed)] };
}
/** Cards já criados a partir de uma página (details.ai_page). */
export async function loadAiCards(): Promise<AiCardLink[]> {
  const { data, error } = await supabase.from('growth_development_tasks').select('id,title,details').not('details->>ai_page', 'is', null).limit(1000);
  if (error) return [];
  return ((data || []) as { id: string; title: string; details: Record<string, unknown> | null }[])
    .map(t => ({ id: t.id, title: t.title, key: str(t.details?.ai_page) })).filter(t => t.key);
}
