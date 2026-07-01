import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { inferChannelFromActivityName, toCanonicalChannel } from '../utils/inferChannel';
import type { CatalogTemplate } from './useTemplateCatalog';

export type ActivitySuggestionConfidence = 'alta' | 'media' | 'baixa';
export type ActivitySuggestionCategory = 'alta_confianca' | 'revisar' | 'conflito' | 'ja_vinculado';

export interface ActivitySuggestionSignal {
  label: string;
  detail?: string;
  weight?: number;
}

export interface ActivitySuggestion {
  activityName: string;
  jornada: string;
  segmento: string;
  parceiro: string;
  bu: string;
  canal: string;
  latestDate: string | null;
  executions: number;
  score: number;
  reasons: string[];
  warnings: string[];
  evidence: ActivitySuggestionSignal[];
  conflicts: ActivitySuggestionSignal[];
  scoreBreakdown: ActivitySuggestionSignal[];
  confidence: ActivitySuggestionConfidence;
  category: ActivitySuggestionCategory;
  alreadyLinked: boolean;
  linkedToOther: boolean;
  linkedTemplateId: string | null;
  plannedMatch: boolean;
  contentMatch: boolean;
}

interface Row {
  'Activity name / Taxonomia': string | null;
  jornada: string | null;
  Canal: string | null;
  BU: string | null;
  Parceiro: string | null;
  Segmento: string | null;
  'Etapa de aquisição': string | null;
  Oferta: string | null;
  Promocional: string | null;
  'Data de Disparo': string | null;
  template_id: string | null;
}

type PartnerKey = 'dia' | 'bb' | 'plurix' | 'b2c';

interface SegmentRule {
  canonical: string;
  aliases: string[];
  siglas: string[];
}

export interface TemplateSuggestionContext {
  templateId: string;
  channel: string | null;
  partnerKey: PartnerKey | null;
  partnerLabel: string | null;
  campaignTokens: string[];
  week: string | null;
  dispatch: string | null;
  segment: SegmentRule | null;
  plannedActivityNames: string[];
  contentTokens: string[];
}

export interface ActivitySuggestionDiagnostics {
  fetchedRows: number;
  uniqueActivityNames: number;
  suggestedCount: number;
  byCategory: Record<ActivitySuggestionCategory, number>;
  rejected: {
    missingName: number;
    hardIncompatible: number;
    lowScore: number;
  };
  hardRejectReasons: {
    channel: number;
    partner: number;
    campaign: number;
  };
  planned: {
    total: number;
    found: number;
    missing: string[];
  };
}

export interface ActivitySuggestionBuckets {
  altaConfianca: ActivitySuggestion[];
  revisar: ActivitySuggestion[];
  conflitos: ActivitySuggestion[];
  jaVinculados: ActivitySuggestion[];
}

interface UseActivitySuggestionsOptions {
  topN?: number;
  contentText?: string;
}

const EMPTY_DIAGNOSTICS: ActivitySuggestionDiagnostics = {
  fetchedRows: 0,
  uniqueActivityNames: 0,
  suggestedCount: 0,
  byCategory: {
    alta_confianca: 0,
    revisar: 0,
    conflito: 0,
    ja_vinculado: 0,
  },
  rejected: {
    missingName: 0,
    hardIncompatible: 0,
    lowScore: 0,
  },
  hardRejectReasons: {
    channel: 0,
    partner: 0,
    campaign: 0,
  },
  planned: {
    total: 0,
    found: 0,
    missing: [],
  },
};

const SEGMENT_BY_SIGLA: Record<string, SegmentRule> = {
  bsp: { canonical: 'Base_Proprietaria', aliases: ['base proprietaria', 'base_proprietaria'], siglas: ['bsp'] },
  ngd: { canonical: 'Negados', aliases: ['negados'], siglas: ['ngd'] },
  crm: { canonical: 'CRM', aliases: ['crm'], siglas: ['crm'] },
  apr: { canonical: 'Aprovados_nao_convertidos', aliases: ['aprovados nao convertidos', 'aprovados_nao_convertidos'], siglas: ['apr', 'anc'] },
  anc: { canonical: 'Aprovados_nao_convertidos', aliases: ['aprovados nao convertidos', 'aprovados_nao_convertidos'], siglas: ['apr', 'anc'] },
};

const SEGMENT_BY_METADATA: Record<string, SegmentRule> = {
  base_proprietaria: SEGMENT_BY_SIGLA.bsp,
  negados: SEGMENT_BY_SIGLA.ngd,
  crm: SEGMENT_BY_SIGLA.crm,
  aprovados_nao_convertidos: SEGMENT_BY_SIGLA.apr,
};

const CONTENT_KEYWORDS = [
  'copa',
  'visa',
  'sorteio',
  'sorteios',
  'premio',
  'premios',
  '50mil',
  '50',
  '300',
  'cartao',
  'credito',
  'limite',
  'aprovado',
  'proposta',
];

function normalize(value: unknown): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokensFrom(value: unknown): string[] {
  return normalize(value).split(/[^a-z0-9]+/).filter(Boolean);
}

function includesToken(text: string, token: string): boolean {
  return new RegExp(`(^|[^a-z0-9])${token}([^a-z0-9]|$)`, 'i').test(text);
}

function compact(value: unknown): string {
  return normalize(value).replace(/\s+/g, '');
}

function uniqueValues(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function normalizeActivityName(value: string): string {
  return normalize(value).replace(/\s+/g, '_');
}

function extractContentTokens(contentText: string | undefined): string[] {
  const normalized = normalize(contentText);
  if (!normalized) return [];
  return CONTENT_KEYWORDS.filter((token) => normalized.includes(token));
}

function inferPartnerKey(template: CatalogTemplate): PartnerKey | null {
  const combined = ` ${normalize(template.template_id)} ${normalize(template.app)} ${normalize(template.title)} `;
  if (combined.includes(' plurix ') || combined.includes(' plu ')) return 'plurix';
  if (combined.includes(' bem barato ') || combined.includes(' bb ')) return 'bb';
  if (combined.includes(' dia ')) return 'dia';
  if (combined.includes(' b2c ')) return 'b2c';
  return null;
}

function partnerLabel(partnerKey: PartnerKey | null): string | null {
  switch (partnerKey) {
    case 'dia': return 'Dia';
    case 'bb': return 'Bem Barato';
    case 'plurix': return 'Plurix';
    case 'b2c': return 'B2C/Proprietaria';
    default: return null;
  }
}

function inferSegment(template: CatalogTemplate): SegmentRule | null {
  const metadataKey = normalize(template.segmento_af_sub1).replace(/\s+/g, '_');
  if (metadataKey && SEGMENT_BY_METADATA[metadataKey]) return SEGMENT_BY_METADATA[metadataKey];

  const idTokens = tokensFrom(template.template_id);
  const found = idTokens.find((token) => SEGMENT_BY_SIGLA[token]);
  return found ? SEGMENT_BY_SIGLA[found] : null;
}

function inferCampaignTokens(template: CatalogTemplate): string[] {
  const source = `${template.campanha} ${template.template_id} ${template.title}`;
  const normalized = normalize(source);
  const tokens = new Set<string>();
  if (normalized.includes('copa')) tokens.add('copa');
  if (normalized.includes('topo de funil')) tokens.add('topo');
  if (normalized.includes('aquisicao')) tokens.add('aquisicao');
  return Array.from(tokens);
}

function inferWeek(template: CatalogTemplate): string | null {
  const explicit = normalize(template.semana).replace(/\s+/g, '');
  if (/^s\d+$/i.test(explicit)) return explicit;
  const match = template.template_id.match(/(?:^|[_-])(s\d+)(?:[_-]|d\d+|$)/i);
  return match ? match[1].toLowerCase() : null;
}

function inferDispatch(template: CatalogTemplate): string | null {
  const match = template.template_id.match(/(?:^|[_-])s\d+(d\d+)(?:[_-]|$)/i)
    ?? template.template_id.match(/(?:^|[_-])(d\d+)(?:[_-]|$)/i);
  return match ? match[1].toLowerCase() : null;
}

function buildContext(template: CatalogTemplate, contentText?: string): TemplateSuggestionContext {
  const partnerKey = inferPartnerKey(template);
  return {
    templateId: template.template_id,
    channel: toCanonicalChannel(template.channel) ?? inferChannelFromActivityName(template.template_id),
    partnerKey,
    partnerLabel: partnerLabel(partnerKey),
    campaignTokens: inferCampaignTokens(template),
    week: inferWeek(template),
    dispatch: inferDispatch(template),
    segment: inferSegment(template),
    plannedActivityNames: uniqueValues(template.activityNamesPlanejados.map(normalizeActivityName)),
    contentTokens: extractContentTokens(contentText),
  };
}

function rowText(r: Row): string {
  return normalize([
    r['Activity name / Taxonomia'],
    r.jornada,
    r.Canal,
    r.BU,
    r.Parceiro,
    r.Segmento,
    r['Etapa de aquisição'],
    r.Oferta,
    r.Promocional,
  ].filter(Boolean).join(' '));
}

function rowTaxonomyText(r: Row): string {
  return normalize([
    r['Activity name / Taxonomia'],
    r.jornada,
  ].filter(Boolean).join(' '));
}

function partnerMatches(ctx: TemplateSuggestionContext, r: Row): boolean | null {
  if (!ctx.partnerKey) return null;
  const text = rowText(r);
  const taxonomyText = rowTaxonomyText(r);
  const parceiro = normalize(r.Parceiro);
  const bu = normalize(r.BU);

  switch (ctx.partnerKey) {
    case 'dia':
      if (includesToken(taxonomyText, 'bb') || taxonomyText.includes('bem barato') || taxonomyText.includes('plurix')) return false;
      return includesToken(taxonomyText, 'dia') || parceiro.includes('dia');
    case 'bb':
      if (includesToken(taxonomyText, 'dia') || taxonomyText.includes('plurix')) return false;
      return includesToken(taxonomyText, 'bb') || includesToken(taxonomyText, 'bbt') || taxonomyText.includes('bem barato') || parceiro.includes('bem barato') || parceiro === 'bb';
    case 'plurix':
      return parceiro.includes('plurix') || bu.includes('plurix') || text.includes('plurix') || includesToken(text, 'plu');
    case 'b2c': {
      const hasOtherPartnerInTaxonomy = includesToken(taxonomyText, 'dia')
        || includesToken(taxonomyText, 'bb')
        || includesToken(taxonomyText, 'bbt')
        || taxonomyText.includes('bem barato')
        || taxonomyText.includes('plurix');
      const isOtherPartner = hasOtherPartnerInTaxonomy
        || parceiro.includes('dia')
        || parceiro.includes('bem barato')
        || parceiro.includes('plurix')
        || bu.includes('plurix');
      if (isOtherPartner) return false;
      return bu.includes('b2c') || parceiro.includes('proprietaria') || text.includes('b2c');
    }
    default:
      return null;
  }
}

function segmentMatches(ctx: TemplateSuggestionContext, r: Row): boolean | null {
  if (!ctx.segment) return null;
  const segment = normalize(r.Segmento);
  if (!segment) return null;
  if (normalize(ctx.segment.canonical) === segment) return true;
  if (ctx.segment.aliases.some((alias) => segment === normalize(alias) || segment.includes(normalize(alias)))) return true;

  // A sigla no activity_name ajuda quando a coluna oficial está vaga, mas não deve
  // sobrescrever uma coluna oficial diferente (ex.: jornada contém CRM, Segmento = Base_Proprietaria).
  return false;
}

function segmentTokenMatches(ctx: TemplateSuggestionContext, r: Row): boolean {
  if (!ctx.segment) return false;
  const text = rowText(r);
  return ctx.segment.siglas.some((sigla) => includesToken(text, sigla));
}

function campaignMatches(ctx: TemplateSuggestionContext, r: Row): boolean | null {
  if (ctx.campaignTokens.length === 0) return null;
  const text = rowText(r);
  return ctx.campaignTokens.every((token) => (
    token === 'topo' ? text.includes('topo') && text.includes('funil') : text.includes(token)
  ));
}

function contentMatches(ctx: TemplateSuggestionContext, r: Row): boolean {
  if (ctx.contentTokens.length === 0) return false;
  const text = rowText(r);
  return ctx.contentTokens.some((token) => text.includes(token));
}

function weekMatches(ctx: TemplateSuggestionContext, r: Row): boolean | null {
  if (!ctx.week) return null;
  const expected = Number(ctx.week.replace(/\D/g, ''));
  if (!expected) return includesToken(rowText(r), ctx.week);
  const text = compact(rowText(r));
  const match = text.match(/disp\d+s0?(\d+)/i) ?? text.match(/s0?(\d+)d\d+/i) ?? text.match(/s0?(\d+)/i);
  if (match) return Number(match[1]) === expected;
  return includesToken(rowText(r), ctx.week);
}

function dispatchMatches(ctx: TemplateSuggestionContext, r: Row): boolean | null {
  if (!ctx.dispatch) return null;
  const expected = Number(ctx.dispatch.replace(/\D/g, ''));
  if (!expected) return includesToken(rowText(r), ctx.dispatch);
  const text = compact(rowText(r));
  const match = text.match(/disp0?(\d+)s\d+/i) ?? text.match(/d0?(\d+)/i);
  if (match) return Number(match[1]) === expected;
  return includesToken(rowText(r), ctx.dispatch);
}

function channelMatches(ctx: TemplateSuggestionContext, r: Row): boolean | null {
  if (!ctx.channel) return null;
  const rowChannel = toCanonicalChannel(r.Canal) ?? inferChannelFromActivityName(r['Activity name / Taxonomia']);
  if (!rowChannel) return null;
  return rowChannel === ctx.channel;
}

function hardRejectReason(ctx: TemplateSuggestionContext, r: Row): 'channel' | 'partner' | 'campaign' | null {
  if (channelMatches(ctx, r) === false) return 'channel';
  return null;
}

function pushSignal(list: ActivitySuggestionSignal[], label: string, detail?: string, weight?: number) {
  list.push({ label, detail, weight });
}

function scoreRow(ctx: TemplateSuggestionContext, r: Row, templateId: string): {
  score: number;
  reasons: string[];
  warnings: string[];
  evidence: ActivitySuggestionSignal[];
  conflicts: ActivitySuggestionSignal[];
  scoreBreakdown: ActivitySuggestionSignal[];
  plannedMatch: boolean;
  contentMatch: boolean;
} {
  let score = 0;
  const reasons: string[] = [];
  const warnings: string[] = [];
  const evidence: ActivitySuggestionSignal[] = [];
  const conflicts: ActivitySuggestionSignal[] = [];
  const scoreBreakdown: ActivitySuggestionSignal[] = [];

  const name = r['Activity name / Taxonomia'] ?? '';
  const plannedMatch = ctx.plannedActivityNames.includes(normalizeActivityName(name));
  if (plannedMatch) {
    score += 50;
    reasons.push('Planejado na governanca');
    pushSignal(evidence, 'Planejado na governanca', 'activity_name veio do mapeamento do template', 50);
    pushSignal(scoreBreakdown, 'Planejado', '+50', 50);
  }

  const channel = channelMatches(ctx, r);
  if (channel === true && ctx.channel) {
    score += 15;
    reasons.push(`Canal ${ctx.channel}`);
    pushSignal(evidence, `Canal ${ctx.channel}`, undefined, 15);
    pushSignal(scoreBreakdown, 'Canal', '+15', 15);
  } else if (channel === null && ctx.channel) {
    warnings.push(`Canal ${ctx.channel} nao confirmado`);
    pushSignal(conflicts, 'Canal nao confirmado', `esperado: ${ctx.channel}`);
  }

  const partner = partnerMatches(ctx, r);
  if (partner === true && ctx.partnerLabel) {
    score += 25;
    reasons.push(`Parceiro ${ctx.partnerLabel}`);
    pushSignal(evidence, `Parceiro ${ctx.partnerLabel}`, undefined, 25);
    pushSignal(scoreBreakdown, 'Parceiro', '+25', 25);
  } else if (partner === false && ctx.partnerLabel) {
    warnings.push(`Parceiro divergente: ${r.Parceiro ?? '-'}`);
    pushSignal(conflicts, 'Parceiro diverge', `esperado: ${ctx.partnerLabel}; atual: ${r.Parceiro ?? '-'}`, -25);
    score -= 25;
  } else if (partner === null && ctx.partnerLabel) {
    warnings.push(`Parceiro ${ctx.partnerLabel} nao confirmado`);
    pushSignal(conflicts, 'Parceiro nao confirmado', `esperado: ${ctx.partnerLabel}`);
  }

  const segment = segmentMatches(ctx, r);
  if (segment === true && ctx.segment) {
    score += 25;
    reasons.push(`Segmento ${ctx.segment.canonical}`);
    pushSignal(evidence, `Segmento ${ctx.segment.canonical}`, undefined, 25);
    pushSignal(scoreBreakdown, 'Segmento oficial', '+25', 25);
  } else if (segment === false && ctx.segment) {
    warnings.push(`Segmento atual: ${r.Segmento ?? '-'}`);
    pushSignal(conflicts, 'Segmento oficial diverge', `esperado: ${ctx.segment.canonical}; atual: ${r.Segmento ?? '-'}`, -20);
    score -= 20;
  } else if (segment === null && ctx.segment) {
    warnings.push(`Segmento ${ctx.segment.canonical} nao confirmado`);
  }

  if (segment !== true && segmentTokenMatches(ctx, r) && ctx.segment) {
    score += 6;
    warnings.push(`Sigla ${ctx.segment.siglas.join('/')} apareceu na taxonomia`);
    pushSignal(evidence, 'Sigla de segmento na taxonomia', ctx.segment.siglas.join('/'), 6);
    pushSignal(scoreBreakdown, 'Sigla de segmento', '+6', 6);
  }

  const campaign = campaignMatches(ctx, r);
  if (campaign === true && ctx.campaignTokens.length) {
    score += 18;
    reasons.push(ctx.campaignTokens.includes('copa') ? 'Campanha Copa' : 'Campanha compativel');
    pushSignal(evidence, 'Campanha compativel', ctx.campaignTokens.join(', '), 18);
    pushSignal(scoreBreakdown, 'Campanha', '+18', 18);
  } else if (campaign === false && ctx.campaignTokens.length) {
    warnings.push(`Campanha nao bate todos os tokens: ${ctx.campaignTokens.join(', ')}`);
    pushSignal(conflicts, 'Campanha parcial/divergente', `esperado: ${ctx.campaignTokens.join(', ')}`, -10);
    score -= 10;
  } else if (campaign === null && ctx.campaignTokens.length) {
    warnings.push('Campanha nao confirmada');
  }

  if (partner === true && segment === true && ctx.partnerLabel && ctx.segment) {
    score += 10;
    reasons.push('Familia operacional compativel');
    pushSignal(evidence, 'Familia operacional', `${ctx.partnerLabel} + ${ctx.segment.canonical}`, 10);
    pushSignal(scoreBreakdown, 'Familia', '+10', 10);
  }

  const week = weekMatches(ctx, r);
  if (week === true && ctx.week) {
    score += 12;
    reasons.push(`Semana ${ctx.week.toUpperCase()}`);
    pushSignal(evidence, `Semana ${ctx.week.toUpperCase()}`, undefined, 12);
    pushSignal(scoreBreakdown, 'Semana', '+12', 12);
  } else if (week === false && ctx.week) {
    warnings.push(`Semana ${ctx.week.toUpperCase()} nao encontrada`);
    pushSignal(conflicts, 'Semana nao bate', `esperado: ${ctx.week.toUpperCase()}`);
  }

  const dispatch = dispatchMatches(ctx, r);
  if (dispatch === true && ctx.dispatch) {
    score += 10;
    reasons.push(`Disparo ${ctx.dispatch.toUpperCase()}`);
    pushSignal(evidence, `Disparo ${ctx.dispatch.toUpperCase()}`, undefined, 10);
    pushSignal(scoreBreakdown, 'Disparo', '+10', 10);
  } else if (dispatch === false && ctx.dispatch) {
    warnings.push(`Disparo ${ctx.dispatch.toUpperCase()} nao encontrado`);
    pushSignal(conflicts, 'Disparo nao bate', `esperado: ${ctx.dispatch.toUpperCase()}`);
  }

  const hasContentMatch = contentMatches(ctx, r);
  if (hasContentMatch) {
    score += 8;
    reasons.push('Conteudo compativel');
    pushSignal(evidence, 'Conteudo compativel', ctx.contentTokens.join(', '), 8);
    pushSignal(scoreBreakdown, 'Conteudo', '+8', 8);
  }

  if (!r.template_id) {
    score += 5;
    reasons.push('Livre');
    pushSignal(evidence, 'Livre', 'sem template_id vinculado hoje', 5);
    pushSignal(scoreBreakdown, 'Livre', '+5', 5);
  } else if (r.template_id === templateId) {
    score += 5;
    reasons.push('Ja vinculado aqui');
    pushSignal(evidence, 'Ja vinculado aqui', undefined, 5);
    pushSignal(scoreBreakdown, 'Vinculo atual', '+5', 5);
  } else {
    warnings.push(`Ja vinculado a ${r.template_id}`);
    pushSignal(conflicts, 'Ja vinculado a outro template', r.template_id, -30);
  }

  if (r['Data de Disparo']) {
    score += 3;
    reasons.push('Tem execucao recente');
    pushSignal(scoreBreakdown, 'Recencia', '+3', 3);
  }

  return {
    score: Math.min(100, Math.max(0, score)),
    reasons,
    warnings,
    evidence,
    conflicts,
    scoreBreakdown,
    plannedMatch,
    contentMatch: hasContentMatch,
  };
}

function confidence(score: number): ActivitySuggestionConfidence {
  if (score >= 85) return 'alta';
  if (score >= 65) return 'media';
  return 'baixa';
}

function categoryForSuggestion(s: Pick<ActivitySuggestion, 'alreadyLinked' | 'linkedToOther' | 'score' | 'conflicts'>): ActivitySuggestionCategory {
  if (s.alreadyLinked) return 'ja_vinculado';
  if (s.linkedToOther || s.conflicts.some((c) => c.label === 'Ja vinculado a outro template')) return 'conflito';
  if (s.score >= 85) return 'alta_confianca';
  return 'revisar';
}

function emptyBuckets(): ActivitySuggestionBuckets {
  return {
    altaConfianca: [],
    revisar: [],
    conflitos: [],
    jaVinculados: [],
  };
}

function bucketize(suggestions: ActivitySuggestion[]): ActivitySuggestionBuckets {
  const buckets = emptyBuckets();
  for (const s of suggestions) {
    if (s.category === 'alta_confianca') buckets.altaConfianca.push(s);
    else if (s.category === 'revisar') buckets.revisar.push(s);
    else if (s.category === 'conflito') buckets.conflitos.push(s);
    else buckets.jaVinculados.push(s);
  }
  return buckets;
}

function buildDiagnostics(
  ctx: TemplateSuggestionContext,
  rows: Row[],
  suggestions: ActivitySuggestion[],
  rejected: ActivitySuggestionDiagnostics['rejected'],
  hardRejectReasons: ActivitySuggestionDiagnostics['hardRejectReasons']
): ActivitySuggestionDiagnostics {
  const foundPlanned = new Set(
    rows
      .map((row) => row['Activity name / Taxonomia'])
      .filter((name): name is string => !!name)
      .map(normalizeActivityName)
      .filter((name) => ctx.plannedActivityNames.includes(name))
  );
  const byCategory = suggestions.reduce<ActivitySuggestionDiagnostics['byCategory']>((acc, s) => {
    acc[s.category] += 1;
    return acc;
  }, { alta_confianca: 0, revisar: 0, conflito: 0, ja_vinculado: 0 });

  return {
    fetchedRows: rows.length,
    uniqueActivityNames: new Set(rows.map((r) => r['Activity name / Taxonomia']).filter(Boolean)).size,
    suggestedCount: suggestions.length,
    byCategory,
    rejected,
    hardRejectReasons,
    planned: {
      total: ctx.plannedActivityNames.length,
      found: foundPlanned.size,
      missing: ctx.plannedActivityNames.filter((name) => !foundPlanned.has(name)),
    },
  };
}

function parseOptions(optionsOrTopN?: number | UseActivitySuggestionsOptions): Required<UseActivitySuggestionsOptions> {
  if (typeof optionsOrTopN === 'number') return { topN: optionsOrTopN, contentText: '' };
  return {
    topN: optionsOrTopN?.topN ?? 12,
    contentText: optionsOrTopN?.contentText ?? '',
  };
}

/**
 * Sugere activity_names provaveis para um template e explica o funil da decisao.
 * O hook nunca auto-vincula: ele so prioriza candidatos e mostra evidencias/conflitos
 * para o operador confirmar.
 */
export function useActivitySuggestions(template: CatalogTemplate | null, optionsOrTopN?: number | UseActivitySuggestionsOptions) {
  const options = parseOptions(optionsOrTopN);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const context = useMemo(() => template ? buildContext(template, options.contentText) : null, [template, options.contentText]);
  const contextKey = context
    ? [
      context.templateId,
      context.channel,
      context.partnerKey,
      context.campaignTokens.join('|'),
      context.week,
      context.dispatch,
      context.segment?.canonical,
      context.plannedActivityNames.join('|'),
      context.contentTokens.join('|'),
    ].join('::')
    : '';
  const templateId = template?.template_id ?? '';

  useEffect(() => {
    if (!template) { setRows([]); return; }
    let active = true;
    setLoading(true);
    (async () => {
      try {
        let q = supabase
          .from('activities')
          .select('"Activity name / Taxonomia", jornada, "Canal", "BU", "Parceiro", "Segmento", "Etapa de aquisição", "Oferta", "Promocional", "Data de Disparo", template_id')
          .not('"Activity name / Taxonomia"', 'is', null)
          .order('"Data de Disparo"', { ascending: false })
          .limit(2500);
        const { data, error: e } = await q;
        if (e) throw e;
        if (active) { setRows((data ?? []) as Row[]); setError(null); }
      } catch (err) {
        if (active) { setError(err instanceof Error ? err.message : 'Falha ao buscar sugestoes.'); setRows([]); }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [template, contextKey]);

  const computed = useMemo(() => {
    if (!template || !context) {
      return {
        suggestions: [] as ActivitySuggestion[],
        diagnostics: EMPTY_DIAGNOSTICS,
        buckets: emptyBuckets(),
      };
    }

    const rejected = { missingName: 0, hardIncompatible: 0, lowScore: 0 };
    const hardRejectReasons = { channel: 0, partner: 0, campaign: 0 };
    const byName = new Map<string, ActivitySuggestion>();

    for (const r of rows) {
      const name = r['Activity name / Taxonomia'];
      if (!name) {
        rejected.missingName += 1;
        continue;
      }

      const hardReason = hardRejectReason(context, r);
      if (hardReason) {
        rejected.hardIncompatible += 1;
        hardRejectReasons[hardReason] += 1;
        continue;
      }

      const date = r['Data de Disparo'] ?? null;
      const linkedToThis = r.template_id === templateId;
      const linkedToOther = !!r.template_id && r.template_id !== templateId;
      const scored = scoreRow(context, r, templateId);
      const shouldKeep = linkedToThis || linkedToOther || scored.plannedMatch || scored.score >= 55;
      if (!shouldKeep) {
        rejected.lowScore += 1;
        continue;
      }

      let s = byName.get(name);
      if (!s) {
        s = {
          activityName: name,
          jornada: r.jornada ?? '-',
          segmento: r.Segmento ?? '-',
          parceiro: r.Parceiro ?? '-',
          bu: r.BU ?? '-',
          canal: r.Canal ?? '-',
          latestDate: date,
          executions: 1,
          score: scored.score,
          reasons: scored.reasons,
          warnings: scored.warnings,
          evidence: scored.evidence,
          conflicts: scored.conflicts,
          scoreBreakdown: scored.scoreBreakdown,
          confidence: confidence(scored.score),
          category: 'revisar',
          alreadyLinked: linkedToThis,
          linkedToOther,
          linkedTemplateId: linkedToOther ? r.template_id : null,
          plannedMatch: scored.plannedMatch,
          contentMatch: scored.contentMatch,
        };
        s.category = categoryForSuggestion(s);
        byName.set(name, s);
      } else {
        s.executions += 1;
        if (date && (!s.latestDate || date > s.latestDate)) s.latestDate = date;
        if (linkedToThis) {
          s.alreadyLinked = true;
          s.category = 'ja_vinculado';
        }
        if (linkedToOther) {
          s.linkedToOther = true;
          s.linkedTemplateId = r.template_id;
          s.category = 'conflito';
        }
        if (scored.score > s.score) {
          s.score = scored.score;
          s.reasons = scored.reasons;
          s.warnings = scored.warnings;
          s.evidence = scored.evidence;
          s.conflicts = scored.conflicts;
          s.scoreBreakdown = scored.scoreBreakdown;
          s.confidence = confidence(scored.score);
          s.plannedMatch = s.plannedMatch || scored.plannedMatch;
          s.contentMatch = s.contentMatch || scored.contentMatch;
          s.category = categoryForSuggestion(s);
        }
      }
    }

    const suggestions = Array.from(byName.values())
      .sort((a, b) => {
        const categoryRank: Record<ActivitySuggestionCategory, number> = {
          alta_confianca: 0,
          revisar: 1,
          conflito: 2,
          ja_vinculado: 3,
        };
        return categoryRank[a.category] - categoryRank[b.category]
          || b.score - a.score
          || (b.latestDate ?? '').localeCompare(a.latestDate ?? '');
      })
      .slice(0, options.topN);

    return {
      suggestions,
      diagnostics: buildDiagnostics(context, rows, suggestions, rejected, hardRejectReasons),
      buckets: bucketize(suggestions),
    };
  }, [rows, template, context, templateId, options.topN]);

  return {
    suggestions: computed.suggestions,
    buckets: computed.buckets,
    diagnostics: computed.diagnostics,
    context,
    loading,
    error,
  };
}
