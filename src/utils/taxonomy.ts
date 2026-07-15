/**
 * Motor de taxonomia da aba Comunicações (Cadastro e Templates).
 * Portado do design GaaS: decodifica um activity_name cru em dimensões e
 * compõe/valida o template_id canônico. Onde possível, o matcher usa as
 * colunas ESTRUTURADAS de activities (Canal, Parceiro, Segmento) — mais
 * confiáveis que parsear a string.
 */

export type DimId = 'publico' | 'canal' | 'campanha' | 'segmento' | 'cadencia' | 'variante';

export interface TaxoOption {
  id: string;
  label: string;
  tokens: string[];
  color?: string;
}

export interface TaxoDim {
  label: string;
  dim: DimId;
  opts: TaxoOption[];
}

export const TAXO: Record<DimId, TaxoDim> = {
  publico: {
    label: 'Público', dim: 'publico',
    opts: [
      { id: 'b2c', label: 'B2C · Afinz', tokens: ['afz', 'b2c'], color: '#3b82f6' },
      { id: 'bb', label: 'Bem Barato', tokens: ['bb', 'bbt', 'b2b2c', 'bem barato'], color: '#10b981' },
      { id: 'dia', label: 'DIA', tokens: ['dia'], color: '#a855f7' },
      { id: 'plurix', label: 'Plurix', tokens: ['plx', 'plu', 'plurix'], color: '#f59e0b' },
    ],
  },
  canal: {
    label: 'Canal', dim: 'canal',
    opts: [
      { id: 'email', label: 'E-mail', tokens: ['email', 'mail', 'e-mail'] },
      { id: 'wpp', label: 'WhatsApp', tokens: ['wpp', 'whats', 'whatsapp'] },
      { id: 'push', label: 'Push', tokens: ['push'] },
      { id: 'sms', label: 'SMS', tokens: ['sms'] },
    ],
  },
  campanha: {
    label: 'Campanha', dim: 'campanha',
    opts: [
      { id: 'copa', label: 'Copa', tokens: ['copa'] },
      { id: 'cred', label: 'Crédito', tokens: ['cred', 'ecred'] },
      { id: 'reat', label: 'Reativação', tokens: ['reat', 'recencia', 'rec'] },
    ],
  },
  segmento: {
    label: 'Segmento', dim: 'segmento',
    opts: [
      { id: 'bsp', label: 'Base Proprietária', tokens: ['bsp', 'bp', 'baseproprietaria', 'base_proprietaria'] },
      { id: 'crm', label: 'CRM', tokens: ['crm'] },
      { id: 'abn', label: 'Abandonados', tokens: ['abn', 'carrinhoabandonado', 'abandonado'] },
      { id: 'ngd', label: 'Negados', tokens: ['ngd', 'negado'] },
      { id: 'apr', label: 'Aprovados ñ conv.', tokens: ['apr', 'anc', 'aprovado'] },
    ],
  },
  cadencia: {
    label: 'Cadência', dim: 'cadencia',
    opts: [
      { id: 'S1', label: 'Semana 1', tokens: ['s1'] },
      { id: 'S2', label: 'Semana 2', tokens: ['s2'] },
      { id: 'S3', label: 'Semana 3', tokens: ['s3'] },
      { id: 'S4', label: 'Semana 4', tokens: ['s4'] },
      { id: 'D1', label: 'Dia 1', tokens: ['d1'] },
      { id: 'D3', label: 'Dia 3', tokens: ['d3'] },
      { id: 'D7', label: 'Dia 7', tokens: ['d7'] },
    ],
  },
  // Dimensão "variante de criativo": duas peças diferentes disputando o mesmo
  // momento/segmento (ex.: Carrinho Abandonado Copa B2C manda institucional E
  // ecred no mesmo disparo; Vibe/Reativação manda int E ecred; ANC segmenta
  // por faixa de limite maior/menor). Informativa por enquanto — não entra no
  // score do matchTemplate nem no composeId, só ajuda a enxergar a peça certa.
  variante: {
    label: 'Variante', dim: 'variante',
    opts: [
      { id: 'institucional', label: 'Institucional', tokens: ['institucional', 'inst'] },
      { id: 'ecred', label: 'ECRED', tokens: ['ecred'] },
      { id: 'int', label: 'Interno', tokens: ['int'] },
      { id: 'maior', label: 'Maior limite', tokens: ['maior'] },
      { id: 'menor', label: 'Menor limite', tokens: ['menor'] },
    ],
  },
};

export const DIMS: DimId[] = ['publico', 'canal', 'campanha', 'segmento', 'cadencia'];

/**
 * Tabela de códigos de segmento (taxonomia SFMC, granularidade fina — 58
 * códigos). Fonte única compartilhada: antes vivia duplicada dentro de
 * IntelligentFrameworkUpdate.tsx (importador inteligente), desalinhada do
 * TAXO.segmento acima (que é deliberadamente mais grosso, só 5 buckets, para
 * a UI de Comunicações). Corrigir um código aqui agora vale para os dois
 * fluxos. Atenção: 'apr' (Aprovados) e 'anc' (Aprovados não convertidos) são
 * códigos DISTINTOS aqui, mas colapsam no mesmo opt 'apr' do TAXO.segmento —
 * divergência de granularidade conhecida, não uma inconsistência a corrigir
 * às cegas.
 */
export const SEGMENT_CODE_TABLE: Record<string, string> = {
  abn: 'Abandono',
  ac: 'Acordo Certo',
  adq: 'Adquirencia',
  alv: 'Alvorada',
  apr: 'Aprovados',
  anc: 'Aprovados nao convertidos',
  atl: 'Ativo com limite',
  atv: 'Ativo Geral',
  bp: 'Base_Proprietaria',
  bsp: 'Base_Proprietaria',
  bb: 'Bem Barato',
  abb: 'Ativo Bem Barato',
  car: 'Carrinho Abandonado',
  blq: 'Cartao Bloqueado',
  cart: 'Cartonista',
  emi: 'Clientes Emissores',
  club: 'Clube',
  cp: 'Credito Pessoal',
  rtv: 'Reativacao',
  cap: 'Desenrola Contemplado aVista aPrazo',
  dne: 'Desenrola Nao Elegiveis',
  dia: 'Dia',
  err: 'Erro',
  frm: 'Farmacia',
  freq: 'Frequentes e recorrentes',
  ina: 'Inadimplente',
  inv: 'Investidores',
  ipr: 'Ip roxo',
  leal: 'Leal',
  ami: 'Mais Amigo',
  nsa: 'Nao se aplica',
  ngd: 'Negados',
  expl: 'Novo explorador e ocasional',
  nov: 'Novos',
  org: 'Organico',
  bpc: 'Parceiro Bom Pra Credito',
  srsa: 'Parceiro Serasa',
  tbm: 'Pos Tombamento',
  pre: 'Pre Analisados',
  chu: 'Pre churn e churn',
  pro: 'Prospect',
  in1: 'Publico 1 - Investidores',
  pf1: 'Publico 1 - PF Atrasado',
  pj1: 'Publico 1 - PJ Negado',
  pf2: 'Publico 2 - PF Em dia - Lim Baixo',
  pj2: 'Publico 2 - PJ Aceito',
  pf3: 'Publico 3 - PF Em dia - Lim Alto',
  quo: 'Quod',
  rec: 'Recencia',
  seg: 'Segurados',
  sem: 'Sem Parar',
  pao: 'Super Pao',
  tst: 'Teste',
  tds: 'Todos',
  upo: 'Upgrade de Oferta',
  nvp: 'Venda Nova Platinum',
  vnd: 'Vendedor',
};

/** Canal canônico (activities.Canal) → id da taxonomia. */
export function canalToId(canal: string | null | undefined): string | null {
  const c = (canal ?? '').toLowerCase();
  if (/e-?mail/.test(c)) return 'email';
  if (c.includes('whats') || c.includes('wpp')) return 'wpp';
  if (c.includes('push')) return 'push';
  if (c.includes('sms')) return 'sms';
  return null;
}

/** Parceiro estruturado (activities.Parceiro) → id de público. */
function normalizeTaxonomyText(value: unknown): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function hasTaxonomyToken(value: unknown, token: string): boolean {
  return ` ${normalizeTaxonomyText(value)} `.includes(` ${normalizeTaxonomyText(token)} `);
}

/** Resolve primeiro identidades especificas; `afz` e marca e tambem aparece em B2B2C. */
export function resolvePublico(raw: string): string | null {
  if (['bbt', 'b2b2c', 'bb', 'bem barato'].some((token) => hasTaxonomyToken(raw, token))) return 'bb';
  if (hasTaxonomyToken(raw, 'dia')) return 'dia';
  if (['plx', 'plu', 'plurix'].some((token) => hasTaxonomyToken(raw, token))) return 'plurix';
  if (['b2c', 'vis'].some((token) => hasTaxonomyToken(raw, token))) return 'b2c';
  if (hasTaxonomyToken(raw, 'afz')) return 'b2c';
  return null;
}

export function parceiroToPublico(parceiro: string | null | undefined, activityName = ''): string | null {
  const contextual = resolvePublico(activityName);
  if (contextual && contextual !== 'b2c') return contextual;
  const p = (parceiro ?? '').toLowerCase();
  if (p.includes('dia')) return 'dia';
  if (p.includes('bem') || p.includes('barato')) return 'bb';
  if (p.includes('plurix')) return 'plurix';
  if (p.includes('proprietaria') || p.includes('serasa') || p === 'n/a' || !p) {
    // Sem parceiro claro → cai no token da taxonomia
    return contextual;
  }
  return contextual;
}

/** Segmento estruturado (activities.Segmento) → id de segmento. */
export function segmentoToId(segmento: string | null | undefined, activityName = ''): string | null {
  const s = (segmento ?? '').toLowerCase();
  if (s.includes('base_proprietaria') || s.includes('proprietaria')) return 'bsp';
  if (s.includes('abandonad')) return 'abn';
  if (s.includes('negado')) return 'ngd';
  if (s.includes('aprovados')) return 'apr';
  if (s.includes('crm')) return 'crm';
  return resolveDim('segmento', activityName);
}

export function resolveDim(dim: DimId, raw: string): string | null {
  if (dim === 'publico') return resolvePublico(raw);
  const t = String(raw || '').toLowerCase();
  for (const o of TAXO[dim].opts) if (o.tokens.some((tok) => t.includes(tok))) return o.id;
  return null;
}

export function optLabel(dim: DimId, id: string | null): string {
  const o = id ? TAXO[dim].opts.find((x) => x.id === id) : null;
  return o ? o.label : '—';
}

export interface ParsedActivity {
  publico: string | null;
  canal: string | null;
  campanha: string | null;
  segmento: string | null;
  cadencia: string | null;
  variante: string | null;
  seq: string | null;
}

export interface ParsedSeq {
  seq: string;
  week: number | null;
  dispatch: number;
  source: 'template' | 'activity' | 'fallback';
}

const normalizeSeqText = (value: string) => value
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[\s.-]+/g, '_');

const toSeq = (week: number | null, dispatch: number) => (
  week ? `S${week}D${String(dispatch).padStart(2, '0')}` : `D${dispatch}`
);

export function parseSeqParts(name: string): ParsedSeq | null {
  const n = normalizeSeqText(name);
  const compact = n.replace(/_/g, '');

  const template = compact.match(/s0?(\d+)d0?(\d+)/);
  if (template) {
    const week = Number(template[1]);
    const dispatch = Number(template[2]);
    if (week && Number.isFinite(dispatch)) return { seq: toSeq(week, dispatch), week, dispatch, source: 'template' };
  }

  const activity =
    compact.match(/disp(?:aro)?0?(\d+)s(?:emana)?0?(\d+)/)
    ?? compact.match(/d(?:isp)?0?(\d+)sem(?:ana)?0?(\d+)/);
  if (activity) {
    const dispatch = Number(activity[1]);
    const week = Number(activity[2]);
    if (week && Number.isFinite(dispatch)) return { seq: toSeq(week, dispatch), week, dispatch, source: 'activity' };
  }

  const explicit = n.match(/(?:^|_)semana_?0?(\d+).*?(?:disp|disparo|d)_?0?(\d+)(?:_|$)/);
  if (explicit) {
    const week = Number(explicit[1]);
    const dispatch = Number(explicit[2]);
    if (week && Number.isFinite(dispatch)) return { seq: toSeq(week, dispatch), week, dispatch, source: 'activity' };
  }

  // Disparo isolado marcado por "disp" + número, tolerando texto colado no meio
  // (ex.: dispcopa21, disp7vibeecred, disp4_maior/menor). Sem semana associada.
  const dispOnly = compact.match(/disp[a-z]*?0?(\d+)/);
  if (dispOnly) {
    const dispatch = Number(dispOnly[1]);
    if (Number.isFinite(dispatch)) return { seq: toSeq(null, dispatch), week: null, dispatch, source: 'fallback' };
  }

  // Disparo isolado marcado por "d" + dígito + sufixo de campanha/variante colado
  // antes de diario/pontual (ex.: d1institucionalcopa_diario, d3ecredcopa_diario,
  // d12refmaio_pontual, d0arefmaio_pontual). Aceita D0 como disparo válido (dia
  // zero/imediato da régua) — variantes de letra (d0a vs d0b) colapsam no mesmo
  // número, perdendo a distinção entre as duas mensagens do mesmo dia.
  const fallback = compact.match(/d0?(\d+)[a-z]*(?:diario|pontual|$)/);
  if (fallback) {
    const dispatch = Number(fallback[1]);
    if (Number.isFinite(dispatch)) return { seq: toSeq(null, dispatch), week: null, dispatch, source: 'fallback' };
  }

  return null;
}

/** Extrai a sequência S?D?? (disparo) do activity_name. */
export function parseSeq(name: string): string | null {
  return parseSeqParts(name)?.seq ?? null;
}

export function isInvertedSeq(a: string | null | undefined, b: string | null | undefined): boolean {
  const pa = a ? parseSeqParts(a) : null;
  const pb = b ? parseSeqParts(b) : null;
  if (!pa || !pb || !pa.week || !pb.week) return false;
  return pa.week === pb.dispatch && pa.dispatch === pb.week;
}

/** Decodifica um disparo usando colunas estruturadas + fallback na string. */
export function parseActivity(name: string, structured?: {
  canal?: string | null;
  parceiro?: string | null;
  segmento?: string | null;
  bu?: string | null;
  jornada?: string | null;
}): ParsedActivity {
  const n = name.toLowerCase();
  const identityContext = [name, structured?.jornada, structured?.bu].filter(Boolean).join(' ');
  const publico = parceiroToPublico(structured?.parceiro, identityContext);
  const journeySegment = segmentoToId(null, structured?.jornada ?? '');
  const segmento = publico === 'bb' && journeySegment === 'crm'
    ? 'crm'
    : segmentoToId(structured?.segmento, `${structured?.jornada ?? ''} ${n}`);
  const seq = parseSeq(name);
  return {
    publico,
    canal: canalToId(structured?.canal) ?? resolveDim('canal', n),
    campanha: resolveDim('campanha', n),
    segmento,
    cadencia: seq && seq.startsWith('D') ? seq : resolveDim('cadencia', n),
    variante: resolveDim('variante', n),
    seq,
  };
}

/** Compõe o template_id canônico a partir das dimensões + sequência. */
export function composeId(dims: Partial<Record<DimId, string | null>>, seq: string | null): string {
  const parts = [dims.publico, dims.canal, dims.campanha, dims.segmento].filter(Boolean);
  if (!parts.length) return '—';
  return parts.join('_') + (seq ? '_' + seq : '');
}

export const TEMPLATE_ID_RE = /^[A-Za-z0-9][A-Za-z0-9_-]{2,79}$/;

// ── Matcher: dimensões parseadas × template do catálogo ──────────────────────
const DIM_WEIGHT: Record<string, number> = { publico: 16, canal: 24, campanha: 12, segmento: 22, seq: 26 };
const DIM_LABEL: Record<string, string> = { publico: 'Público', canal: 'Canal', campanha: 'Campanha', segmento: 'Segmento', seq: 'Disparo' };

export interface MatchReason { dim: string; label: string; val: string; ok: boolean }
export interface TemplateDims { publico: string | null; canal: string | null; campanha: string | null; segmento: string | null; seq: string | null }
export interface MatchResult<T> { tpl: T; score: number; reasons: MatchReason[] }

/**
 * Casa um disparo parseado contra o catálogo. Canal divergente descarta o
 * candidato. Retorna o melhor match (score 0-100) + os porquês.
 */
export function matchTemplate<T extends { dims: TemplateDims }>(parsed: ParsedActivity, templates: T[]): MatchResult<T> | null {
  let best: MatchResult<T> | null = null;
  for (const tpl of templates) {
    const incompatibleIdentity = (['publico', 'canal', 'campanha', 'segmento'] as const)
      .some((dim) => parsed[dim] && tpl.dims[dim] && parsed[dim] !== tpl.dims[dim]);
    if (incompatibleIdentity) continue;
    const reasons: MatchReason[] = [];
    let score = 0;
    let canalOk = false;
    (['publico', 'canal', 'campanha', 'segmento'] as DimId[]).forEach((dim) => {
      const pv = parsed[dim];
      const tv = tpl.dims[dim as keyof TemplateDims];
      if (pv && tv && pv === tv) {
        score += DIM_WEIGHT[dim] || 0;
        reasons.push({ dim, label: DIM_LABEL[dim], val: optLabel(dim, pv), ok: true });
        if (dim === 'canal') canalOk = true;
      } else if (tv) {
        reasons.push({ dim, label: DIM_LABEL[dim], val: optLabel(dim, tv as string), ok: false });
      }
    });
    if (parsed.seq && tpl.dims.seq && parsed.seq === tpl.dims.seq) {
      score += DIM_WEIGHT.seq;
      reasons.push({ dim: 'seq', label: 'Disparo', val: tpl.dims.seq, ok: true });
    } else if (tpl.dims.seq) {
      reasons.push({ dim: 'seq', label: 'Disparo', val: tpl.dims.seq, ok: false });
    }
    if (!canalOk) continue;
    if (!best || score > best.score) best = { tpl, score: Math.min(100, score), reasons };
  }
  return best;
}

export interface TemplateIdPart { key: DimId | 'seq'; label: string; value: string }

/** Expande a sequência: 'S2D02' → 'Semana 2 · Disparo 2' · 'D3' → 'Dia 3'. */
export function formatSeq(seq: string | null | undefined): string {
  if (!seq) return '';
  const sd = seq.match(/^S(\d+)D0*(\d+)$/i);
  if (sd) return `Semana ${sd[1]} · Disparo ${sd[2]}`;
  const d = seq.match(/^D0*(\d+)$/i);
  if (d) return `Dia ${d[1]}`;
  return seq;
}

/**
 * Traduz um template_id nas suas dimensões legíveis (Público/BU · Canal ·
 * Campanha · Segmento · Momento). Base para exibir a "tradução" no lugar do id cru.
 */
export function translateTemplateId(id: string): TemplateIdPart[] {
  const parts: TemplateIdPart[] = [];
  const pub = resolveDim('publico', id);
  if (pub) parts.push({ key: 'publico', label: 'Público', value: optLabel('publico', pub) });
  const can = resolveDim('canal', id);
  if (can) parts.push({ key: 'canal', label: 'Canal', value: optLabel('canal', can) });
  const camp = resolveDim('campanha', id);
  if (camp) parts.push({ key: 'campanha', label: 'Campanha', value: optLabel('campanha', camp) });
  const seg = resolveDim('segmento', id);
  if (seg) parts.push({ key: 'segmento', label: 'Segmento', value: optLabel('segmento', seg) });
  const seq = parseSeq(id);
  if (seq) parts.push({ key: 'seq', label: 'Momento', value: formatSeq(seq) });
  return parts;
}

export type Confidence = 'forte' | 'provavel' | 'fraca' | 'novo';
export function confidenceOf(match: { score: number } | null): Confidence {
  if (!match) return 'novo';
  return match.score >= 85 ? 'forte' : match.score >= 60 ? 'provavel' : 'fraca';
}

const normalizeJourneyKey = (value: unknown) => String(value ?? '')
  .normalize('NFD')
  .replace(/[̀-ͯ]/g, '')
  .trim()
  .toLowerCase()
  .replace(/\s+/g, ' ');

export const PLURIX_CART_INDEPENDENT_JOURNEY = 'JOR_AQUISICAO_PLURIX_CARRINHO_ABANDONADO_INDEPENDENTE';
export const PLURIX_CART_ASSISTED_JOURNEY = 'JOR_AQUISICAO_PLURIX_CARRINHO_ABANDONADO_ASSISTIDO';

/**
 * Canonicaliza a jornada de Carrinho Abandonado Plurix em assistido vs
 * independente. Portado do importador inteligente (IntelligentFrameworkUpdate.tsx)
 * pra virar fonte única — antes só o importador sabia resolver essa duplicidade
 * de jornada, e a Reconciliation Queue de Comunicações via as duas jornadas
 * como entidades separadas sem relação entre si.
 */
export function canonicalPlurixCartJourney(journey: unknown, activityName: unknown): string {
  const journeyKey = normalizeJourneyKey(journey);
  const isPlurixCartJourney = journeyKey.includes('aquisicao_plurix_carrinho_abandonado');
  if (!isPlurixCartJourney || journeyKey.includes('teste')) return String(journey ?? '').trim();

  const activityKey = normalizeJourneyKey(activityName);
  const isAssistedOrLojista = activityKey.includes('carrinhoabandonadoassistido')
    || journeyKey.includes('assistido')
    || journeyKey.includes('lojista');

  return isAssistedOrLojista
    ? PLURIX_CART_ASSISTED_JOURNEY
    : PLURIX_CART_INDEPENDENT_JOURNEY;
}

export function cleanJourneyName(name: string): string {
  if (!name) return name;
  let clean = name;
  // Remove prefix JOR_AQUISICAO_ or JOR_
  clean = clean.replace(/^JOR_AQUISICAO_/, '');
  clean = clean.replace(/^JOR_/, '');
  // Remove starting underscore
  clean = clean.replace(/^_/, '');
  // Replace underscores with spaces
  clean = clean.replace(/_/g, ' ');
  // Normalize spaces
  clean = clean.trim().replace(/\s+/g, ' ');
  
  return clean.toUpperCase();
}
