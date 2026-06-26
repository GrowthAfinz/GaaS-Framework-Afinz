import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { inferChannelFromActivityName, toCanonicalChannel } from '../utils/inferChannel';
import type { CatalogTemplate } from './useTemplateCatalog';

export interface ActivitySuggestion {
  activityName: string;
  jornada: string;
  segmento: string;
  parceiro: string;
  bu: string;
  canal: string;
  latestDate: string | null;
  executions: number;
  score: number;          // 0-100
  reasons: string[];
  warnings: string[];
  confidence: 'alta' | 'media' | 'baixa';
  alreadyLinked: boolean; // ja vinculado a ESTE template
  linkedToOther: boolean;
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

interface TemplateMatchContext {
  templateId: string;
  channel: string | null;
  partnerKey: PartnerKey | null;
  partnerLabel: string | null;
  campaignTokens: string[];
  week: string | null;
  dispatch: string | null;
  segment: SegmentRule | null;
}

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

function buildContext(template: CatalogTemplate): TemplateMatchContext {
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

function partnerMatches(ctx: TemplateMatchContext, r: Row): boolean | null {
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
      return includesToken(taxonomyText, 'bb') || taxonomyText.includes('bem barato') || parceiro.includes('bem barato') || parceiro === 'bb';
    case 'plurix':
      return parceiro.includes('plurix') || bu.includes('plurix') || text.includes('plurix') || includesToken(text, 'plu');
    case 'b2c': {
      const isOtherPartner = parceiro.includes('dia') || parceiro.includes('bem barato') || parceiro.includes('plurix') || bu.includes('plurix');
      if (isOtherPartner) return false;
      return bu.includes('b2c') || parceiro.includes('proprietaria') || text.includes('b2c');
    }
    default:
      return null;
  }
}

function segmentMatches(ctx: TemplateMatchContext, r: Row): boolean | null {
  if (!ctx.segment) return null;
  const segment = normalize(r.Segmento);
  const text = rowText(r);
  if (!segment) return null;
  if (normalize(ctx.segment.canonical) === segment) return true;
  if (ctx.segment.aliases.some((alias) => segment === normalize(alias) || segment.includes(normalize(alias)))) return true;
  if (ctx.segment.siglas.some((sigla) => includesToken(text, sigla))) return true;
  return false;
}

function campaignMatches(ctx: TemplateMatchContext, r: Row): boolean | null {
  if (ctx.campaignTokens.length === 0) return null;
  const text = rowText(r);
  return ctx.campaignTokens.every((token) => (
    token === 'topo' ? text.includes('topo') && text.includes('funil') : text.includes(token)
  ));
}

function weekMatches(ctx: TemplateMatchContext, r: Row): boolean | null {
  if (!ctx.week) return null;
  return includesToken(rowText(r), ctx.week);
}

function dispatchMatches(ctx: TemplateMatchContext, r: Row): boolean | null {
  if (!ctx.dispatch) return null;
  return includesToken(rowText(r), ctx.dispatch);
}

function channelMatches(ctx: TemplateMatchContext, r: Row): boolean | null {
  if (!ctx.channel) return null;
  const rowChannel = toCanonicalChannel(r.Canal) ?? inferChannelFromActivityName(r['Activity name / Taxonomia']);
  if (!rowChannel) return null;
  return rowChannel === ctx.channel;
}

function isStronglyIncompatible(ctx: TemplateMatchContext, r: Row): boolean {
  if (partnerMatches(ctx, r) === false) return true;
  if (channelMatches(ctx, r) === false) return true;
  if (campaignMatches(ctx, r) === false) return true;
  return false;
}

function scoreRow(ctx: TemplateMatchContext, r: Row): { score: number; reasons: string[]; warnings: string[] } {
  let score = 0;
  const reasons: string[] = [];
  const warnings: string[] = [];

  const add = (points: number, reason: string) => { score += points; reasons.push(reason); };
  const warn = (reason: string) => warnings.push(reason);

  const partner = partnerMatches(ctx, r);
  if (partner === true) add(35, `Parceiro ${ctx.partnerLabel}`);
  else if (partner === null && ctx.partnerLabel) warn(`Parceiro ${ctx.partnerLabel} nao confirmado`);

  const segment = segmentMatches(ctx, r);
  if (segment === true && ctx.segment) add(25, `Segmento ${ctx.segment.canonical}`);
  else if (segment === null && ctx.segment) warn(`Segmento ${ctx.segment.canonical} nao confirmado`);
  else if (segment === false && ctx.segment) warn(`Segmento atual: ${r.Segmento ?? '-'}`);

  const campaign = campaignMatches(ctx, r);
  if (campaign === true && ctx.campaignTokens.length) add(20, ctx.campaignTokens.includes('copa') ? 'Campanha Copa' : 'Campanha compativel');
  else if (campaign === null && ctx.campaignTokens.length) warn('Campanha nao confirmada');

  const week = weekMatches(ctx, r);
  if (week === true && ctx.week) add(12, `Semana ${ctx.week.toUpperCase()}`);
  else if (week === null && ctx.week) warn(`Semana ${ctx.week.toUpperCase()} nao confirmada`);

  const dispatch = dispatchMatches(ctx, r);
  if (dispatch === true && ctx.dispatch) add(8, `Disparo ${ctx.dispatch.toUpperCase()}`);

  const channel = channelMatches(ctx, r);
  if (channel === true && ctx.channel) add(10, `Canal ${ctx.channel}`);
  else if (channel === null && ctx.channel) warn(`Canal ${ctx.channel} nao confirmado`);

  if (!r.template_id) add(5, 'Livre');
  else if (r.template_id === ctx.templateId) add(5, 'Ja vinculado aqui');
  else warn(`Ja vinculado a ${r.template_id}`);

  if (r['Data de Disparo']) add(3, 'Tem execucao recente');

  return { score: Math.min(100, Math.max(0, score)), reasons, warnings };
}

function confidence(score: number): ActivitySuggestion['confidence'] {
  if (score >= 85) return 'alta';
  if (score >= 65) return 'media';
  return 'baixa';
}

/**
 * Sugere activity_names provaveis para um template.
 * Primeiro elimina incompatibilidades fortes por canal/parceiro/segmento/campanha;
 * depois ranqueia por evidencias oficiais de activities e pela taxonomia.
 */
export function useActivitySuggestions(template: CatalogTemplate | null, topN = 12) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const context = useMemo(() => template ? buildContext(template) : null, [template]);
  const channel = context?.channel ?? '';
  const contextKey = context
    ? [context.templateId, context.channel, context.partnerKey, context.campaignTokens.join('|'), context.week, context.dispatch, context.segment?.canonical].join('::')
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
          .limit(1500);
        if (channel) q = q.eq('"Canal"', channel);
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
  }, [template, channel, contextKey]);

  const suggestions = useMemo<ActivitySuggestion[]>(() => {
    if (!template || !context) return [];

    const byName = new Map<string, ActivitySuggestion>();
    for (const r of rows) {
      const name = r['Activity name / Taxonomia'];
      if (!name) continue;
      if (isStronglyIncompatible(context, r)) continue;

      const date = r['Data de Disparo'] ?? null;
      const linkedToThis = r.template_id === templateId;
      const linkedToOther = !!r.template_id && r.template_id !== templateId;
      let s = byName.get(name);
      if (!s) {
        const { score, reasons, warnings } = scoreRow(context, r);
        s = {
          activityName: name,
          jornada: r.jornada ?? '-',
          segmento: r.Segmento ?? '-',
          parceiro: r.Parceiro ?? '-',
          bu: r.BU ?? '-',
          canal: r.Canal ?? '-',
          latestDate: date,
          executions: 1,
          score,
          reasons,
          warnings,
          confidence: confidence(score),
          alreadyLinked: linkedToThis,
          linkedToOther,
        };
        byName.set(name, s);
      } else {
        s.executions += 1;
        if (date && (!s.latestDate || date > s.latestDate)) s.latestDate = date;
        if (linkedToThis) s.alreadyLinked = true;
        if (linkedToOther) s.linkedToOther = true;
      }
    }

    return Array.from(byName.values())
      .filter((s) => s.alreadyLinked || s.score >= 60)
      .sort((a, b) => b.score - a.score || (b.latestDate ?? '').localeCompare(a.latestDate ?? ''))
      .slice(0, topN);
  }, [rows, template, context, templateId, topN]);

  return { suggestions, loading, error };
}
