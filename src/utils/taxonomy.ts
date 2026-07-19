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
      { id: 'srsa', label: 'Serasa', tokens: ['srsa', 'serasa'] },
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

// ── Público v2: parceiro-primeiro (dimensão ABERTA), BU como fallback ─────────
// Regra validada 2026-07-19 contra os dados reais (activities: BU e Parceiro 100%
// preenchidos; SIGLA_* vazias). BU é guarda-chuva; Parceiro é o parceiro real.
// `bb` (Bem Barato) NÃO é código especial — é um parceiro entre vários (dia,
// alvorada, hirota, ...). Público do disparo = código do PARCEIRO (quando B2B2C)
// ou código da BU (B2C/Plurix). Substitui resolvePublico/parceiroToPublico no
// caminho de reconciliação (mantidos acima só para legado/translate).

/** Normaliza um nome de parceiro num código curto e estável. Aberto: parceiro novo vira slug. */
export function partnerCode(parceiro: string | null | undefined): string | null {
  const p = normalizeTaxonomyText(parceiro);
  if (!p || p === 'n a' || p === 'na') return null;
  if (p === 'proprietaria' || p.includes('base proprietaria')) return null; // base, não é marca de parceiro
  if (p.includes('bem barato') || p === 'bb' || p === 'bbt') return 'bb';
  if (p === 'dia') return 'dia';
  if (p.includes('alvorada')) return 'alvorada';
  if (p.includes('plurix')) return 'plurix';
  if (p.includes('serasa')) return 'serasa';
  if (p.includes('bom pra credito') || p === 'bpc') return 'bpc';
  if (p.includes('acordo')) return 'acordo';
  return p.split(' ')[0]; // parceiro novo: primeiro token
}

/** Público canônico do disparo a partir das colunas estruturadas BU + Parceiro (fonte de verdade). */
export function publicoFromColumns(bu: string | null | undefined, parceiro: string | null | undefined): string | null {
  const b = normalizeTaxonomyText(bu);
  if (b === 'b2c') return 'b2c';
  if (b === 'plurix') return 'plurix';
  // B2B2C: público = parceiro específico. Sem parceiro nomeável → sentinela 'b2b2c'
  // que não casa com prefixo de template nenhum (veta match → cai como "novo").
  if (b === 'b2b2c') return partnerCode(parceiro) ?? 'b2b2c';
  return null;
}

/** Código de público do template = prefixo do template_id (b2c/bb/dia/plurix/...). Exato. */
export function templatePublicoCode(templateId: string | null | undefined): string | null {
  const first = normalizeTaxonomyText((templateId ?? '').split('_')[0]);
  return first || null;
}

// ── Segmento canônico: MESMO vocabulário nos dois lados (activities.Segmento ==
// communication_templates.metadata.segmento_af_sub1). Igualdade exata, sem adivinhar token.
const SEGMENTO_FULL_KEYS = new Set([
  'abandonados', 'base_proprietaria', 'crm', 'negados', 'leads_parceiros',
  'aprovados_nao_convertidos', 'cartonistas', 'recencia_de_compra', 'instabilidade',
]);
const SEGMENTO_TOKEN_TO_KEY: Record<string, string> = {
  bsp: 'base_proprietaria', bp: 'base_proprietaria', baseproprietaria: 'base_proprietaria',
  crm: 'crm', ngd: 'negados', neg: 'negados',
  anc: 'aprovados_nao_convertidos', apr: 'aprovados_nao_convertidos',
  abn: 'abandonados', car: 'abandonados', abd: 'abandonados',
  lp: 'leads_parceiros', cart: 'cartonistas', rec: 'recencia_de_compra',
};

/** Chave canônica de segmento (aceita nome completo da coluna/metadata OU token curto do id). */
export function segmentoKey(value: string | null | undefined): string | null {
  const n = normalizeTaxonomyText(value);
  if (!n) return null;
  const slug = n.replace(/ /g, '_');
  if (SEGMENTO_FULL_KEYS.has(slug)) return slug;
  if (SEGMENTO_TOKEN_TO_KEY[slug]) return SEGMENTO_TOKEN_TO_KEY[slug];
  if (slug.includes('proprietaria')) return 'base_proprietaria';
  if (slug.includes('abandonad')) return 'abandonados';
  if (slug.includes('negado')) return 'negados';
  if (slug.startsWith('aprovados')) return 'aprovados_nao_convertidos';
  return slug;
}

/** Extrai a chave de segmento de um template_id cru (varre os tokens; usado só p/ display). */
export function segmentoKeyFromTemplateId(id: string): string | null {
  for (const tok of (id ?? '').split('_')) {
    const k = segmentoKey(tok);
    if (k && SEGMENTO_FULL_KEYS.has(k)) return k;
  }
  return null;
}

const PUBLICO_LABELS: Record<string, string> = {
  b2c: 'B2C · Afinz', bb: 'Bem Barato', dia: 'DIA', plurix: 'Plurix',
  alvorada: 'Alvorada', serasa: 'Serasa', bpc: 'Bom Pra Crédito', acordo: 'Acordo Certo',
  b2b2c: 'B2B2C (sem parceiro)',
};
const SEGMENTO_LABELS: Record<string, string> = {
  abandonados: 'Abandonados', base_proprietaria: 'Base Proprietária', crm: 'CRM',
  negados: 'Negados', leads_parceiros: 'Leads Parceiros', aprovados_nao_convertidos: 'Aprovados ñ conv.',
  cartonistas: 'Cartonistas', recencia_de_compra: 'Recência de Compra', instabilidade: 'Instabilidade',
};
/** Label amigável para público (dimensão aberta) — conhecido ou capitalizado. */
export function publicoLabel(code: string | null | undefined): string {
  if (!code) return '—';
  return PUBLICO_LABELS[code] ?? (code.charAt(0).toUpperCase() + code.slice(1));
}
/** Label amigável para segmento canônico. */
export function segmentoLabelCanon(key: string | null | undefined): string {
  if (!key) return '—';
  return SEGMENTO_LABELS[key] ?? key;
}

export function resolveDim(dim: DimId, raw: string): string | null {
  if (dim === 'publico') return resolvePublico(raw);
  const t = String(raw || '').toLowerCase();
  for (const o of TAXO[dim].opts) if (o.tokens.some((tok) => t.includes(tok))) return o.id;
  return null;
}

export function optLabel(dim: DimId, id: string | null): string {
  if (!id) return '—';
  // publico e segmento agora usam códigos/chaves abertos (fora do TAXO): rotula por mapa próprio.
  if (dim === 'publico') return publicoLabel(id);
  if (dim === 'segmento') return segmentoLabelCanon(id);
  const o = TAXO[dim].opts.find((x) => x.id === id);
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
  // Público via CROSSWALK das colunas estruturadas (BU+Parceiro) — fonte de verdade,
  // 100% preenchida. Fallback na string só se as colunas faltarem (raro).
  const publico = publicoFromColumns(structured?.bu, structured?.parceiro)
    ?? resolvePublico([name, structured?.jornada].filter(Boolean).join(' '));
  // Segmento por chave canônica da coluna Segmento (== metadata.segmento_af_sub1 no template).
  const segmento = segmentoKey(structured?.segmento)
    ?? segmentoKey(resolveDim('segmento', `${structured?.jornada ?? ''} ${n}`));
  const seq = parseSeq(name);
  // Serasa é audiência de B2C → também vira variante 'srsa' (discrimina peça do parceiro).
  const variante = resolveDim('variante', n)
    ?? (partnerCode(structured?.parceiro) === 'serasa' ? 'srsa' : null);
  return {
    publico,
    canal: canalToId(structured?.canal) ?? resolveDim('canal', n),
    campanha: resolveDim('campanha', `${structured?.jornada ?? ''} ${n}`),
    segmento,
    cadencia: seq && seq.startsWith('D') ? seq : resolveDim('cadencia', n),
    variante,
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
const DIM_WEIGHT: Record<string, number> = { publico: 16, canal: 24, campanha: 12, segmento: 22, seq: 26, variante: 10 };
const DIM_LABEL: Record<string, string> = { publico: 'Público', canal: 'Canal', campanha: 'Campanha', segmento: 'Segmento', seq: 'Disparo', variante: 'Variante' };

export interface MatchReason { dim: string; label: string; val: string; ok: boolean }
export interface TemplateDims { publico: string | null; canal: string | null; campanha: string | null; segmento: string | null; seq: string | null; variante?: string | null }
export interface MatchResult<T> { tpl: T; score: number; reasons: MatchReason[] }

/**
 * Casa um disparo parseado contra o catálogo.
 *
 * VETO DURO: Canal e Público (parceiro/BU vindos das colunas estruturadas) são
 * identidade — divergência descarta o candidato de vez (nunca vira match forte com
 * o parceiro errado). Segmento/campanha/seq/variante pontuam; a Variante desempata
 * peças que dividem o mesmo momento/segmento (carrinho: institucional vs srsa/ecred).
 * Retorna o melhor match (score 0-100) + os porquês. A confiança é derivada por
 * âncoras em `confidenceOf`, não pelo score cru.
 */
export function matchTemplate<T extends { dims: TemplateDims }>(parsed: ParsedActivity, templates: T[]): MatchResult<T> | null {
  let best: MatchResult<T> | null = null;
  for (const tpl of templates) {
    // Identidade dura: público (parceiro/BU) e canal divergentes eliminam o candidato.
    if (parsed.publico && tpl.dims.publico && parsed.publico !== tpl.dims.publico) continue;
    if (parsed.canal && tpl.dims.canal && parsed.canal !== tpl.dims.canal) continue;
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
    // Variante: só desempata (nunca veta — nem todo template declara variante).
    if (parsed.variante && tpl.dims.variante && parsed.variante === tpl.dims.variante) {
      score += DIM_WEIGHT.variante;
      reasons.push({ dim: 'variante', label: 'Variante', val: optLabel('variante', parsed.variante), ok: true });
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
  const pub = templatePublicoCode(id); // prefixo exato (aberto): b2c/bb/dia/plurix/alvorada/...
  if (pub) parts.push({ key: 'publico', label: 'Público', value: publicoLabel(pub) });
  const can = resolveDim('canal', id);
  if (can) parts.push({ key: 'canal', label: 'Canal', value: optLabel('canal', can) });
  const camp = resolveDim('campanha', id);
  if (camp) parts.push({ key: 'campanha', label: 'Campanha', value: optLabel('campanha', camp) });
  const seg = segmentoKeyFromTemplateId(id);
  if (seg) parts.push({ key: 'segmento', label: 'Segmento', value: segmentoLabelCanon(seg) });
  const seq = parseSeq(id);
  if (seq) parts.push({ key: 'seq', label: 'Momento', value: formatSeq(seq) });
  return parts;
}

export type Confidence = 'forte' | 'provavel' | 'fraca' | 'novo';
/**
 * Confiança por ÂNCORAS (não pelo score cru): "forte" exige as 4 âncoras —
 * Canal + Público(parceiro/BU) + Segmento + Disparo(seq). Isso impede que um
 * disparo case como forte sem o parceiro certo. Reduz a chance de vínculo em
 * massa errado na fila. Segmento é obrigatório para "provável".
 */
export function confidenceOf(match: { reasons?: MatchReason[]; score: number } | null): Confidence {
  if (!match) return 'novo';
  const ok = new Set((match.reasons ?? []).filter((r) => r.ok).map((r) => r.dim));
  const canal = ok.has('canal');
  const publico = ok.has('publico');
  const segmento = ok.has('segmento');
  const seq = ok.has('seq');
  if (canal && publico && segmento && seq) return 'forte';
  if (canal && segmento && (publico || seq)) return 'provavel';
  if (canal && (segmento || seq || publico)) return 'fraca';
  return 'novo';
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
