import type { BorderStyle, Cell, Workbook, Worksheet } from 'exceljs';
import { supabase } from '../services/supabaseClient';

// ── Tipos internos ─────────────────────────────────────────────────────────────

type RawRow = Record<string, unknown>;

type RntMetrics = {
  entregues: number;
  abertos: number;
  cliques: number;
  propostas: number;
  aprovados: number;
  contratacoes: number;  // Cartões Gerados → para seguros/ativação = conversões/contratações
};

type CopaMetrics = {
  enviados: number;
  entregues: number;
  abertura: number;
  cliques: number;
};

type RntJourneyRow = {
  produto: string;
  jornada: string;
  activity: string;
  bu: string;
  canal: string;
  linhas: number;
} & RntMetrics;

type AuditRow = {
  motivo: string;
  bu: string;
  jornada: string;
  canal: string;
  linhas: number;
} & RntMetrics;

type CopaAuditRow = {
  destino: string;
  parceiro: string;
  bloco: string;
  jornada: string;
  canal: string;
  linhas: number;
  enviados: number;
  entregues: number;
  abertura: number;
  cliques: number;
};

// ── Mapeamento de produto via journey name ─────────────────────────────────────

// Normalização de período: ABRI26 → ABR26, MAIO26 → MAI26
const PERIODO_NORM: Record<string, string> = {
  ABRI26: 'ABR26', MAIO26: 'MAI26',
  ABRI25: 'ABR25', MAIO25: 'MAI25',
};

// Nomes legíveis de produto derivados do journey name
const PRODUCT_OVERRIDES: Record<string, string> = {
  'SEGURO MULHER': 'Seguro Mulher',
  'SEGURO RESIDENCIA24H': 'Seguro Residência 24h',
  'SEGURO RESIDENCIA': 'Seguro Residência',
  'NA ATIVACAO': 'Ativação CRM',
  'ATIVACAO': 'Ativação',
  'REATIVACAO': 'Reativação',
  'CROSS SELL': 'Cross-sell',
};

/**
 * Extrai informação de produto e período de um journey name no padrão:
 * JOR_RENTABILIZACAO_{BU}_{...PRODUTO...}_{PERÍODO}
 */
function parseJourney(jornada: string): { produto: string; periodo: string } {
  const j = jornada.toUpperCase().trim();

  if (j.includes('CARRINHO') && j.includes('SEGURO')) {
    if (j.includes('RESIDENCIA24H') || j.includes('RESIDENCIA')) return { produto: 'Carrinho Seguro Residência', periodo: '' };
    if (j.includes('MULHER')) return { produto: 'Carrinho Seguro Mulher', periodo: '' };
    return { produto: 'Carrinho Seguro', periodo: '' };
  }

  // Padrão canônico: JOR_RENTABILIZACAO_BU_...produto..._PERÍODO
  const match = j.match(/^JOR_RENTABILIZACAO_[A-Z0-9]+_(.+?)_([A-Z]{2,5}\d{2})$/);
  if (match) {
    const productRaw = match[1];
    const periodRaw = PERIODO_NORM[match[2]] ?? match[2];
    const productKey = productRaw.replace(/_/g, ' ');
    const product = PRODUCT_OVERRIDES[productKey] ?? titleCase(productKey.toLowerCase());
    return { produto: product, periodo: formatPeriodo(periodRaw) };
  }

  // JOR_RENTABILIZACAO sem período: extrair produto direto
  const matchNoPeriod = j.match(/^JOR_RENTABILIZACAO_[A-Z0-9]+_(.+)$/);
  if (matchNoPeriod) {
    const productKey = matchNoPeriod[1].replace(/_/g, ' ');
    const product = PRODUCT_OVERRIDES[productKey] ?? titleCase(productKey.toLowerCase());
    return { produto: product, periodo: '' };
  }

  return { produto: titleCase(j.replace(/^JOR_RENTABILIZACAO_/, '').replace(/_/g, ' ').toLowerCase()), periodo: '' };
}

/** Extrai produto de jornadas JOR_ATIVACAO_* */
function parseAtivacaoJourney(jornada: string): { produto: string; periodo: string } {
  const j = jornada.toUpperCase().trim()
    .replace(/^JOR_ATIVA[ÇC]AO_/, '')  // remover prefixo (com ou sem acento)
    .replace(/_SEEDLIST$/, '')
    .replace(/ \(COPIAR\)$/, '')
    .replace(/_TESTE$/, '');

  const ATIVACAO_NAMES: Record<string, string> = {
    'DESBLOQUEIO_VC':               'Desbloqueio VC',
    'DESBLOQUEIO_PLURIX_MAISAMIGO': 'Desbloqueio Plurix Mais Amigo',
    'WELCOME_AFINZ_VC':             'Welcome Afinz VC',
    'WELCOME_PLURIX_MAISAMIGO':     'Welcome Plurix Mais Amigo',
    'INCENTIVO_AO_USO_AFINZ_VC':    'Incentivo ao Uso Afinz',
    'POS_TOMBAMENTO_DESBLOQUEIO_PLURIX_MAISAMIGO_MAIO': 'Desbloqueio Pós-Tombamento',
  };

  const produto = ATIVACAO_NAMES[j] ?? titleCase(j.replace(/_/g, ' ').toLowerCase());
  return { produto, periodo: '' };
}

function titleCase(str: string): string {
  return str.replace(/\b\w/g, (c) => c.toUpperCase());
}

function parseAtivacaoJourneySafe(jornada: string): { produto: string; periodo: string } {
  const j = normalizeJourneyText(jornada)
    .replace(/^JOR_ATIVACAO_/, '')
    .replace(/_SEEDLIST$/, '')
    .replace(/ \(COPIAR\)$/, '')
    .replace(/_TESTE$/, '');

  const ATIVACAO_NAMES: Record<string, string> = {
    'DESBLOQUEIO_VC': 'Desbloqueio VC',
    'DESBLOQUEIO_PLURIX_MAISAMIGO': 'Desbloqueio Plurix Mais Amigo',
    'WELCOME_AFINZ_VC': 'Welcome Afinz VC',
    'WELCOME_PLURIX_MAISAMIGO': 'Welcome Plurix Mais Amigo',
    'INCENTIVO_AO_USO_AFINZ_VC': 'Incentivo ao Uso Afinz',
    'POS_TOMBAMENTO_DESBLOQUEIO_PLURIX_MAISAMIGO_MAIO': 'Desbloqueio Pos-Tombamento',
  };

  const produto = ATIVACAO_NAMES[j] ?? titleCase(j.replace(/_/g, ' ').toLowerCase());
  return { produto, periodo: '' };
}

function formatPeriodo(raw: string): string {
  const MESES: Record<string, string> = {
    JAN: 'Jan', FEV: 'Fev', MAR: 'Mar', ABR: 'Abr', MAI: 'Mai',
    JUN: 'Jun', JUL: 'Jul', AGO: 'Ago', SET: 'Set', OUT: 'Out', NOV: 'Nov', DEZ: 'Dez',
  };
  const m = raw.match(/^([A-Z]{2,3})(\d{2})$/);
  if (m) return `${MESES[m[1]] ?? m[1]} ${m[2]}`;
  return raw;
}

// ── Helpers numéricos e de data ────────────────────────────────────────────────

function asInt(value: unknown): number {
  if (value === null || value === undefined || value === '') return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : 0;
}

function normalizeFieldName(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function normalizeJourneyText(value: unknown): string {
  return String(value ?? '')
    .replace(/ATIVA�+O/gi, 'ATIVACAO')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim();
}

function rowValue(row: RawRow, ...parts: string[]): unknown {
  const wanted = parts.map(normalizeFieldName);
  const key = Object.keys(row).find((candidate) => {
    const normalized = normalizeFieldName(candidate);
    return wanted.every((part) => normalized.includes(part));
  });
  return key ? row[key] : undefined;
}

function isoDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function parseIsoDate(value: string): Date {
  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  return new Date(year, month - 1, day);
}

function parseRowDate(value: unknown): Date {
  if (!value) throw new Error('missing Data de Disparo');
  return parseIsoDate(String(value).split('T')[0]);
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function allDates(start: Date, end: Date): Date[] {
  const dates: Date[] = [];
  for (let d = new Date(start); d <= end; d = addDays(d, 1)) dates.push(new Date(d));
  return dates;
}

const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
const METRIC_FIELDS: Array<keyof RntMetrics> = ['entregues', 'abertos', 'cliques', 'propostas', 'aprovados', 'contratacoes'];

const COPA_PARTNERS = ['B2C + B2B2C', 'Plurix', 'BB'] as const;
const COPA_BLOCKS = ['Ativacao', 'Reativacao', 'Novos'] as const;
const COPA_CHANNELS = ['WPP', 'E-MAIL', 'SMS', 'PUSH'] as const;
const COPA_ACTION_START = new Date(2026, 3, 13);
type CopaPartner = typeof COPA_PARTNERS[number];
type CopaBlock = typeof COPA_BLOCKS[number];
type CopaChannel = typeof COPA_CHANNELS[number];

// ── Colunas fixas (LP Looker + BI Visa + Mídia Paga) ──────────────────────────
// Universos integrados (ver vault: Export-XLSX-Renta-Copa):
//   LP (GA4/Looker)  → copa_lp_daily (origem='__total__'): tráfego e etapa opt-in (proxy)
//   BI Visa (oficial) → copa_visa_daily: clientes (opt-ins) e cartões por dia
//   Mídia Paga       → paid_media_metrics × mappings (objective='rentabilizacao')
type CopaMediaAgg = { spend: number; clicks: number; impressions: number };
type CopaMediaChannel = 'total' | 'google' | 'meta';
type CopaFixedDay = {
  trafegoLp: number | null;
  optinsGa4: number | null;
  optinsVisa: number | null;
  cartoesVisa: number | null;
  media: Record<CopaMediaChannel, CopaMediaAgg>;
};
type CopaFixedIndex = Map<string, CopaFixedDay>;

type CopaWindow = { start: number; end: number; days: number };
type CopaChartImages = Record<'funnel' | 'spend' | 'traffic' | 'efficiency' | 'deliveries' | 'openings', string>;
type CopaCrmSummary = {
  partner: CopaPartner;
  block: CopaBlock;
  entregues: number;
  aberturas: number;
  taxaAbertura: number;
};

const MEDIA_SUB_HEADERS = ['Invt. (R$)', 'Cliques', 'CPC (R$)', 'Impressoes', 'CTR', 'CPM (R$)'];
const COPA_FIXED_HEADERS = [
  'Data', 'Dia',
  'Trafego LP', 'Optins LP (GA4)',
  'Optins Visa', 'Cartoes Visa',
  'Invt. Midia (R$)', 'Cliques Midia', 'CPC (R$)', 'Impressoes', 'CTR', 'CPM (R$)', 'Custo/Opt-in (R$)',
  ...MEDIA_SUB_HEADERS,
  ...MEDIA_SUB_HEADERS,
];

// Grupos visuais do cabeçalho fixo (colunas 1-based, inclusivas)
const COPA_FIXED_GROUPS: Array<{ from: number; to: number; label: string; fill: string }> = [
  { from: 3, to: 4,   label: 'LP Visa (GA4)',      fill: '2E75B6' },
  { from: 5, to: 6,   label: 'BI Visa (oficial)',  fill: '1F3864' },
  { from: 7, to: 13,  label: 'Midia Paga — Total', fill: '4472C4' },
  { from: 14, to: 19, label: 'Midia — Google',     fill: '1D7B2B' },
  { from: 20, to: 25, label: 'Midia — Meta',       fill: '7030A0' },
];

const COPA_FIXED_COLS = 25;
const COPA_BLOCK_WIDTH = 14;
const COPA_HEADER = [
  'wpp', 'entregas', 'cliques',
  'e-mail', 'entregas', 'abertura', 'cliques', 'bounce', 'tx abertura', 'tx clique',
  'sms', 'entregas',
  'push', 'entregas',
];

const COPA_CHANNEL_LAYOUT: Record<
  CopaChannel,
  { labelRel: number; label: string; metricRels: Partial<Record<keyof CopaMetrics | 'bounce' | 'txAbertura' | 'txClique', number>> }
> = {
  WPP: { labelRel: 0, label: 'wpp', metricRels: { entregues: 1, cliques: 2 } },
  'E-MAIL': {
    labelRel: 3,
    label: 'e-mail',
    metricRels: { entregues: 4, abertura: 5, cliques: 6, bounce: 7, txAbertura: 8, txClique: 9 },
  },
  SMS: { labelRel: 10, label: 'sms', metricRels: { entregues: 11 } },
  PUSH: { labelRel: 12, label: 'push', metricRels: { entregues: 13 } },
};

// ── Cores ─────────────────────────────────────────────────────────────────────

const COLORS = {
  headerMain:    '1E293B',   // slate-800
  headerAlt:     '334155',   // slate-700
  seguroMulher:  '9D174D',   // rose-800
  seguroRes:     '1E40AF',   // blue-800
  ativacao:      '065F46',   // emerald-800
  outro:         '374151',   // gray-700
  emailFill:     'DBEAFE',
  wppFill:       'D1FAE5',
  smsFill:       'FEF3C7',
  pushFill:      'FFEDD5',
  total:         'F0FDF4',
  zebra:         'F8FAFC',
  audit:         '1D4ED8',
  auditSub:      'DBEAFE',
  copaHeader:    '1F3864',
  copaMedia:     '4472C4',
  copaAtivacao:  '1F4E79',
  copaReativacao:'833C00',
  copaNovos:     '1E5631',
  copaWppFill:   'E2EFDA',
  copaWppFont:   '375623',
  copaEmailFill: 'DCE6F1',
  copaEmailFont: '1F4E79',
  copaSmsFill:   'FFF2CC',
  copaSmsFont:   '7F6000',
  copaPushFill:  'FCE4D6',
  copaPushFont:  '843C0C',
  copaTotal:     'D9EAD3',
  copaCurrent:   'DDEBF7',
  copaPrevious:  'E7E6E6',
  copaVariation: 'FFF2CC',
  peakGood:      'C6E0B4',
  peakWarn:      'FFD966',
  peakBad:       'F4B084',
};

function closedEnd(requestedEnd: Date): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = addDays(today, -1);
  return requestedEnd < yesterday ? requestedEnd : yesterday;
}

function comparisonWindows(dates: Date[]): { current: CopaWindow; previous: CopaWindow } {
  const currentDays = Math.min(7, Math.max(0, Math.floor(dates.length / 2)) || dates.length);
  const currentStart = Math.max(0, dates.length - currentDays);
  const previousEnd = currentStart - 1;
  const previousStart = Math.max(0, previousEnd - currentDays + 1);
  return {
    current: { start: currentStart, end: dates.length - 1, days: currentDays },
    previous: { start: previousStart, end: previousEnd, days: Math.max(0, previousEnd - previousStart + 1) },
  };
}

function sumRangeFormula(col: number, fromRow: number, toRow: number): string {
  const letter = colLetter(col);
  return fromRow <= toRow ? `SUM(${letter}${fromRow}:${letter}${toRow})` : '0';
}

function ratioFormula(numeratorCol: number, denominatorCol: number, row: number, multiplier = 1): string {
  const numerator = `${colLetter(numeratorCol)}${row}`;
  const denominator = `${colLetter(denominatorCol)}${row}`;
  return `IFERROR(${numerator}/${denominator}${multiplier === 1 ? '' : `*${multiplier}`},\"\")`;
}

/** Determina em qual aba o registro vai */
function getTab(row: RawRow): 'seguros' | 'rentabilizacao' {
  const jornada = String(row['jornada'] ?? '').toUpperCase();
  const bu = String(row['BU'] ?? '').toUpperCase();
  if (bu === 'SEGUROS' || jornada.includes('SEGURO')) return 'seguros';
  return 'rentabilizacao';
}

function productHeaderColor(produto: string, tab: 'seguros' | 'rentabilizacao'): string {
  const p = produto.toLowerCase();
  if (tab === 'seguros') {
    if (p.includes('mulher')) return COLORS.seguroMulher;
    if (p.includes('resid'))  return COLORS.seguroRes;
    return COLORS.seguroMulher;
  }
  // Rentabilização
  if (p.includes('cartonist'))    return '7C3AED'; // violet-700
  if (p.includes('ativa'))        return COLORS.ativacao;
  if (p.includes('leal') || p.includes('amigo')) return '0369A1'; // sky-700
  return COLORS.outro;
}

function canalFill(canal: string): string {
  const c = canal.toUpperCase();
  if (c.includes('MAIL')) return COLORS.emailFill;
  if (c.includes('WPP') || c.includes('WHATSAPP')) return COLORS.wppFill;
  if (c.includes('SMS')) return COLORS.smsFill;
  if (c.includes('PUSH')) return COLORS.pushFill;
  return 'FFFFFF';
}

function copaChannelStyle(channel: CopaChannel): { fill: string; font: string } {
  if (channel === 'WPP') return { fill: COLORS.copaWppFill, font: COLORS.copaWppFont };
  if (channel === 'E-MAIL') return { fill: COLORS.copaEmailFill, font: COLORS.copaEmailFont };
  if (channel === 'SMS') return { fill: COLORS.copaSmsFill, font: COLORS.copaSmsFont };
  return { fill: COLORS.copaPushFill, font: COLORS.copaPushFont };
}

function copaBlockColor(block: CopaBlock): string {
  if (block === 'Ativacao') return COLORS.copaAtivacao;
  if (block === 'Reativacao') return COLORS.copaReativacao;
  return COLORS.copaNovos;
}

function emptyCopaMetrics(): CopaMetrics {
  return { enviados: 0, entregues: 0, abertura: 0, cliques: 0 };
}

function copaKey(dateStr: string, partner: CopaPartner, block: CopaBlock, channel: CopaChannel): string {
  return [dateStr, partner, block, channel].join(SEP);
}

function classifyCopa(row: RawRow): { partner: CopaPartner; block: CopaBlock } | null {
  const jornada = String(row['jornada'] ?? '').toUpperCase();
  if (!jornada.includes('COPA')) return null;

  let partner: CopaPartner = 'B2C + B2B2C';
  if (jornada.includes('PLURIX')) partner = 'Plurix';
  else if (jornada.includes('_BB_')) partner = 'BB';

  let block: CopaBlock | null = null;
  if (jornada.includes('CARTONISTAS')) block = 'Ativacao';
  else if (jornada.includes('NOVOS')) block = 'Novos';
  else if (jornada.includes('REATIVACAO')) block = 'Reativacao';
  else if (jornada.includes('ATIVACAO') || jornada.includes('VISA')) block = 'Ativacao';

  return block ? { partner, block } : null;
}

function buildCopaIndex(rows: RawRow[], start: Date, end: Date): Map<string, CopaMetrics> {
  const idx = new Map<string, CopaMetrics>();
  for (const row of rows) {
    let rowDate: Date;
    try { rowDate = parseRowDate(row['Data de Disparo']); } catch { continue; }
    if (rowDate < start || rowDate > end) continue;

    const classified = classifyCopa(row);
    if (!classified) continue;

    const channel = normalizeCanal(row['Canal']) as CopaChannel;
    if (!COPA_CHANNELS.includes(channel)) continue;

    const key = copaKey(isoDate(rowDate), classified.partner, classified.block, channel);
    const current = idx.get(key) ?? emptyCopaMetrics();
    current.enviados += asInt(row['Base Total']);
    current.entregues += asInt(row['Base Acionável']);
    current.abertura += asInt(row['Abertura']);
    current.cliques += asInt(row['Cliques']);
    idx.set(key, current);
  }
  return idx;
}

function hasCopaData(metrics?: CopaMetrics): boolean {
  return Boolean(metrics && (metrics.enviados > 0 || metrics.entregues > 0 || metrics.abertura > 0 || metrics.cliques > 0));
}

function safeRate(numerator: number, denominator: number): number | '' {
  return denominator > 0 ? numerator / denominator : '';
}

// ── Helpers Excel ─────────────────────────────────────────────────────────────

function classifyCopaAudit(row: RawRow): { destino: string; parceiro: string; bloco: string } | null {
  const jornada = String(row['jornada'] ?? '').toUpperCase();
  if (!jornada.includes('COPA')) return null;

  let parceiro = 'B2C + B2B2C';
  if (jornada.includes('PLURIX')) parceiro = 'Plurix';
  else if (jornada.includes('_BB_')) parceiro = 'BB';

  const classified = classifyCopa(row);
  if (classified) {
    return { destino: 'Rentabilizacao Copa', parceiro: classified.partner, bloco: classified.block };
  }

  return { destino: 'Fora do mapa Copa', parceiro, bloco: 'Sem bloco definido' };
}

function buildCopaAuditRows(rows: RawRow[], start: Date, end: Date): CopaAuditRow[] {
  const map = new Map<string, CopaAuditRow>();

  for (const row of rows) {
    let rowDate: Date;
    try { rowDate = parseRowDate(row['Data de Disparo']); } catch { continue; }
    if (rowDate < start || rowDate > end) continue;

    const classified = classifyCopaAudit(row);
    if (!classified) continue;

    const jornada = String(row['jornada'] ?? '');
    const canal = normalizeCanal(row['Canal']);
    const key = [classified.destino, classified.parceiro, classified.bloco, jornada, canal].join(SEP);
    const current = map.get(key) ?? {
      ...classified,
      jornada,
      canal,
      linhas: 0,
      enviados: 0,
      entregues: 0,
      abertura: 0,
      cliques: 0,
    };

    current.linhas++;
    current.enviados += asInt(rowValue(row, 'base', 'total'));
    current.entregues += asInt(rowValue(row, 'base', 'acion'));
    current.abertura += asInt(row['Abertura']);
    current.cliques += asInt(row['Cliques']);
    map.set(key, current);
  }

  return [...map.values()].sort((a, b) =>
    `${a.destino}|${a.parceiro}|${a.bloco}|${a.jornada}|${a.canal}`.localeCompare(
      `${b.destino}|${b.parceiro}|${b.bloco}|${b.jornada}|${b.canal}`,
    )
  );
}

function setCell(
  cell: Cell,
  value?: string | number | object,
  options: { bold?: boolean; fontColor?: string; fillColor?: string; align?: 'left' | 'center' | 'right'; italic?: boolean; size?: number } = {},
): void {
  if (value !== undefined) cell.value = value as Cell['value'];
  cell.font = {
    name: 'Calibri', size: options.size ?? 10,
    bold: options.bold, italic: options.italic,
    color: { argb: `FF${options.fontColor ?? '000000'}` },
  };
  if (options.fillColor) {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${options.fillColor}` } };
  }
  cell.alignment = { horizontal: options.align ?? 'center', vertical: 'middle', wrapText: true };
}

function border(ws: Worksheet, row: number, maxCol: number, topStyle: BorderStyle = 'thin'): void {
  for (let c = 1; c <= maxCol; c++) {
    ws.getCell(row, c).border = {
      top:    { style: topStyle, color: { argb: 'FFCBD5E1' } },
      bottom: { style: 'thin',   color: { argb: 'FFE2E8F0' } },
      left:   { style: 'thin',   color: { argb: 'FFE2E8F0' } },
      right:  { style: 'thin',   color: { argb: 'FFE2E8F0' } },
    };
  }
}

function copaBlockEndCols(maxCol: number): Set<number> {
  const cols = new Set<number>();
  for (let col = COPA_FIXED_COLS + COPA_BLOCK_WIDTH; col <= maxCol; col += COPA_BLOCK_WIDTH) cols.add(col);
  return cols;
}

function copaBorder(ws: Worksheet, row: number, maxCol: number, topStyle?: BorderStyle): void {
  const blockEnds = copaBlockEndCols(maxCol);
  for (let col = 1; col <= maxCol; col++) {
    const isFixed = col <= COPA_FIXED_COLS;
    const isBoundary = blockEnds.has(col);
    ws.getCell(row, col).border = {
      top: isFixed || topStyle ? { style: topStyle ?? 'thin', color: { argb: isFixed ? 'FFBFBFBF' : 'FF000000' } } : undefined,
      bottom: isFixed ? { style: 'thin', color: { argb: 'FFBFBFBF' } } : undefined,
      left: isFixed ? { style: 'thin', color: { argb: 'FFBFBFBF' } } : undefined,
      right: isBoundary
        ? { style: 'medium', color: { argb: 'FF000000' } }
        : isFixed
          ? { style: 'thin', color: { argb: 'FFBFBFBF' } }
          : undefined,
    };
  }
}

function colLetter(col: number): string {
  let n = col; let s = '';
  while (n > 0) { const mod = (n - 1) % 26; s = String.fromCharCode(65 + mod) + s; n = Math.floor((n - mod) / 26); }
  return s;
}

// ── Chave de índice ────────────────────────────────────────────────────────────

const SEP = '';

function idxKey(dateStr: string, produto: string, canal: string): string {
  return [dateStr, produto, canal].join(SEP);
}

// ── Classificação ─────────────────────────────────────────────────────────────

/** Retorna null para linhas que devem ir para Auditoria */
function classify(row: RawRow): { produto: string; periodo: string } | null {
  const jornada = String(row['jornada'] ?? '');
  const j = normalizeJourneyText(jornada);

  if (j.startsWith('JOR_RENTABILIZACAO')) return parseJourney(jornada);

  if (j.startsWith('JOR_ATIVACAO_') || j.startsWith('JOR_ATIVAÇÃO_'))
    return parseAtivacaoJourneySafe(jornada);

  if (j.startsWith('JOR_INCENTIVO_AO_USO_'))
    return { produto: 'Incentivo ao Uso', periodo: '' };

  if (j.startsWith('JOR_POS_TOMBAMENTO_DESBLOQUEIO_'))
    return { produto: 'Desbloqueio Pós-Tombamento', periodo: '' };

  if (j.startsWith('JOR_CARTAO_VC_WELCOME') || j.startsWith('JOR_CARTAO_VC_WELCOME'))
    return { produto: 'Welcome VC', periodo: '' };

  return null;  // vai para Auditoria
}

// ── Indexação das linhas ───────────────────────────────────────────────────────

type TabIndex = {
  idx: Map<string, RntMetrics>;
  produtoOrder: string[];
  journeyRows: RntJourneyRow[];
};

type IndexResult = {
  seguros: TabIndex;
  rentabilizacao: TabIndex;
  auditRows: AuditRow[];
  summary: { source: number; mapped: number; audit: number };
};

function buildTabIndex(): TabIndex {
  return { idx: new Map(), produtoOrder: [], journeyRows: [] };
}

function buildIndexes(rows: RawRow[], start: Date, end: Date): IndexResult {
  const tabs = { seguros: buildTabIndex(), rentabilizacao: buildTabIndex() };
  const produtoSeen: Record<string, Map<string, number>> = { seguros: new Map(), rentabilizacao: new Map() };
  const auditMap = new Map<string, AuditRow>();
  const journeyMap: Record<string, Map<string, RntJourneyRow>> = { seguros: new Map(), rentabilizacao: new Map() };
  const summary = { source: 0, mapped: 0, audit: 0 };

  for (const row of rows) {
    let rowDate: Date;
    try { rowDate = parseRowDate(row['Data de Disparo']); } catch { continue; }
    if (rowDate < start || rowDate > end) continue;

    const jornada = String(row['jornada'] ?? '');
    const jornadaUpper = jornada.toUpperCase();
    if (jornadaUpper.includes('COPA')) continue;
    summary.source++;

    const canal = normalizeCanal(row['Canal']);
    const metrics: RntMetrics = {
      entregues:    asInt(row['Base Acionável']),
      abertos:      asInt(row['Abertura']),
      cliques:      asInt(row['Cliques']),
      propostas:    asInt(row['Propostas']),
      aprovados:    asInt(row['Aprovados']),
      contratacoes: asInt(row['Cartões Gerados']),
    };

    const classified = classify(row);
    if (classified) {
      const { produto } = classified;
      const tab = getTab(row);
      const ds = isoDate(rowDate);
      const key = idxKey(ds, produto, canal);
      const cur = tabs[tab].idx.get(key) ?? { entregues: 0, abertos: 0, cliques: 0, propostas: 0, aprovados: 0, contratacoes: 0 };
      METRIC_FIELDS.forEach((f) => { cur[f] += metrics[f]; });
      tabs[tab].idx.set(key, cur);

      if (!produtoSeen[tab].has(produto)) produtoSeen[tab].set(produto, rowDate.getTime());

      const activity = String(row['Activity name / Taxonomia'] ?? '');
      const bu = String(row['BU'] ?? '');
      const jKey = [produto, jornada, activity, bu, canal].join(SEP);
      if (!journeyMap[tab].has(jKey)) {
        journeyMap[tab].set(jKey, { produto, jornada, activity, bu, canal, linhas: 0, entregues: 0, abertos: 0, cliques: 0, propostas: 0, aprovados: 0, contratacoes: 0 });
      }
      const jr = journeyMap[tab].get(jKey)!;
      jr.linhas++;
      METRIC_FIELDS.forEach((f) => { jr[f] += metrics[f]; });
      summary.mapped++;
    } else {
      const bu = String(row['BU'] ?? '');
      const motivo = `Fora do padrão JOR_RENTABILIZACAO: ${jornada || 'sem jornada'}`;
      const aKey = [motivo, bu, canal].join(SEP);
      if (!auditMap.has(aKey)) {
        auditMap.set(aKey, { motivo, bu, jornada, canal, linhas: 0, entregues: 0, abertos: 0, cliques: 0, propostas: 0, aprovados: 0, contratacoes: 0 });
      }
      const ar = auditMap.get(aKey)!;
      ar.linhas++;
      METRIC_FIELDS.forEach((f) => { ar[f] += metrics[f]; });
      summary.audit++;
    }
  }

  // Montar produtoOrder ordenado por data do primeiro disparo para cada tab
  (['seguros', 'rentabilizacao'] as const).forEach((tab) => {
    tabs[tab].produtoOrder = [...produtoSeen[tab].entries()].sort((a, b) => a[1] - b[1]).map(([p]) => p);
    tabs[tab].journeyRows = [...journeyMap[tab].values()].sort((a, b) =>
      `${a.produto}|${a.jornada}|${a.canal}`.localeCompare(`${b.produto}|${b.jornada}|${b.canal}`)
    );
  });

  return {
    seguros: tabs.seguros,
    rentabilizacao: tabs.rentabilizacao,
    auditRows: [...auditMap.values()].sort((a, b) => a.motivo.localeCompare(b.motivo)),
    summary,
  };
}

function normalizeCanal(value: unknown): string {
  const raw = String(value ?? '').toUpperCase();
  if (raw.includes('MAIL')) return 'E-MAIL';
  if (raw.includes('WHATSAPP') || raw === 'WPP') return 'WPP';
  if (raw.includes('SMS')) return 'SMS';
  if (raw.includes('PUSH')) return 'PUSH';
  return raw.trim() || 'N/A';
}

function aggregateCopaCrm(
  idx: Map<string, CopaMetrics>,
  dates: Date[],
  window?: CopaWindow,
): Map<string, CopaMetrics> {
  const result = new Map<string, CopaMetrics>();
  const selected = window ? dates.slice(window.start, window.end + 1) : dates;
  for (const day of selected) {
    const ds = isoDate(day);
    for (const partner of COPA_PARTNERS) {
      for (const block of COPA_BLOCKS) {
        for (const channel of COPA_CHANNELS) {
          const source = idx.get(copaKey(ds, partner, block, channel));
          if (!source) continue;
          const key = [partner, block, channel].join(SEP);
          const target = result.get(key) ?? emptyCopaMetrics();
          target.enviados += source.enviados;
          target.entregues += source.entregues;
          target.abertura += source.abertura;
          target.cliques += source.cliques;
          result.set(key, target);
        }
      }
    }
  }
  return result;
}

function copaCrmChartSummary(idx: Map<string, CopaMetrics>, dates: Date[]): CopaCrmSummary[] {
  const totals = aggregateCopaCrm(idx, dates);
  const rows: CopaCrmSummary[] = [];
  for (const partner of COPA_PARTNERS) {
    for (const block of COPA_BLOCKS) {
      let entregues = 0;
      let aberturas = 0;
      for (const channel of COPA_CHANNELS) {
        const metric = totals.get([partner, block, channel].join(SEP));
        entregues += metric?.entregues ?? 0;
        if (channel === 'E-MAIL') aberturas += metric?.abertura ?? 0;
      }
      rows.push({ partner, block, entregues, aberturas, taxaAbertura: entregues > 0 ? aberturas / entregues : 0 });
    }
  }
  return rows;
}

function applyTopThreeHighlights(ws: Worksheet, dates: Date[], maxCol: number): void {
  const dataStart = 5;
  const positiveCols = [3, 4, 5, 6, 8, 10, 11, 15, 17, 18, 21, 23, 24];
  const costCols = [9, 12, 13, 16, 19, 22, 25];
  const crmRateRels = [8, 9];
  const columns = new Set<number>([...positiveCols, ...costCols]);
  for (let start = COPA_FIXED_COLS + 1; start <= maxCol; start += COPA_BLOCK_WIDTH) {
    [1, 2, 4, 5, 6, 8, 9, 11, 13].forEach((rel) => columns.add(start + rel));
  }

  for (const col of columns) {
    const ranked = dates
      .map((_, i) => ({ row: dataStart + i, value: Number(ws.getCell(dataStart + i, col).value) }))
      .filter((item) => Number.isFinite(item.value) && item.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 3);
    ranked.forEach((item, rank) => {
      const rel = col > COPA_FIXED_COLS ? (col - COPA_FIXED_COLS - 1) % COPA_BLOCK_WIDTH : -1;
      const isCost = costCols.includes(col);
      const isPositiveRate = crmRateRels.includes(rel) || positiveCols.includes(col);
      const fill = rank === 2 ? COLORS.peakWarn : isCost && !isPositiveRate ? COLORS.peakBad : COLORS.peakGood;
      ws.getCell(item.row, col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${fill}` } };
      ws.getCell(item.row, col).font = { ...ws.getCell(item.row, col).font, bold: true };
    });
  }
}

function addDashboardDataSheet(
  wb: Workbook,
  dates: Date[],
  fixedIdx: CopaFixedIndex,
  crmSummary: CopaCrmSummary[],
): void {
  const ws = wb.addWorksheet('_Copa Dashboard Data');
  ws.state = 'veryHidden';
  ['Data', 'Acessos LP', 'Etapa GA4', 'Opt-ins Visa', 'Spend Google', 'Spend Meta', 'Cliques Google', 'Cliques Meta', 'CPC Total', 'Custo/Opt-in Visa']
    .forEach((value, col) => setCell(ws.getCell(1, col + 1), value, { bold: true }));
  dates.forEach((date, index) => {
    const row = index + 2;
    const fixed = fixedIdx.get(isoDate(date)) ?? emptyFixedDay();
    const totalSpend = fixed.media.total.spend;
    const totalClicks = fixed.media.total.clicks;
    [
      isoDate(date), fixed.trafegoLp ?? '', fixed.optinsGa4 ?? '', fixed.optinsVisa ?? '',
      fixed.media.google.spend, fixed.media.meta.spend, fixed.media.google.clicks, fixed.media.meta.clicks,
      totalClicks > 0 ? totalSpend / totalClicks : '', fixed.optinsVisa ? totalSpend / fixed.optinsVisa : '',
    ].forEach((value, col) => setCell(ws.getCell(row, col + 1), value as string | number));
  });
  const start = dates.length + 4;
  ['Parceiro', 'Segmento', 'Entregas', 'Aberturas E-mail', 'Taxa abertura'].forEach((value, col) => setCell(ws.getCell(start, col + 1), value, { bold: true }));
  crmSummary.forEach((item, index) => {
    [item.partner, item.block, item.entregues, item.aberturas, item.taxaAbertura]
      .forEach((value, col) => setCell(ws.getCell(start + 1 + index, col + 1), value));
  });
}

function chartCanvas(title: string): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } | null {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 1240;
  canvas.height = 640;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 30px Calibri, Arial';
  ctx.fillText(title, 45, 50);
  return { canvas, ctx };
}

function drawLegend(ctx: CanvasRenderingContext2D, series: Array<{ label: string; color: string }>): void {
  let x = 45;
  ctx.font = '20px Calibri, Arial';
  series.forEach((item) => {
    ctx.fillStyle = item.color;
    ctx.fillRect(x, 72, 22, 10);
    ctx.fillStyle = '#334155';
    ctx.fillText(item.label, x + 30, 84);
    x += 190;
  });
}

function drawLineChart(
  title: string,
  labels: string[],
  series: Array<{ label: string; color: string; values: number[] }>,
): string {
  const target = chartCanvas(title);
  if (!target) return '';
  const { canvas, ctx } = target;
  drawLegend(ctx, series);
  const plot = { x: 70, y: 115, w: 1120, h: 450 };
  const max = Math.max(1, ...series.flatMap((item) => item.values));
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 5; i++) {
    const y = plot.y + (plot.h * i) / 5;
    ctx.beginPath(); ctx.moveTo(plot.x, y); ctx.lineTo(plot.x + plot.w, y); ctx.stroke();
  }
  series.forEach((item) => {
    ctx.strokeStyle = item.color;
    ctx.lineWidth = 4;
    ctx.beginPath();
    item.values.forEach((value, index) => {
      const x = plot.x + (plot.w * index) / Math.max(1, labels.length - 1);
      const y = plot.y + plot.h - (value / max) * plot.h;
      if (index === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();
  });
  ctx.fillStyle = '#64748B';
  ctx.font = '16px Calibri, Arial';
  labels.forEach((label, index) => {
    if (labels.length > 16 && index % Math.ceil(labels.length / 12) !== 0) return;
    const x = plot.x + (plot.w * index) / Math.max(1, labels.length - 1);
    ctx.fillText(label, x - 14, plot.y + plot.h + 30);
  });
  return canvas.toDataURL('image/png');
}

function drawBarChart(
  title: string,
  labels: string[],
  series: Array<{ label: string; color: string; values: number[] }>,
  stacked = false,
): string {
  const target = chartCanvas(title);
  if (!target) return '';
  const { canvas, ctx } = target;
  drawLegend(ctx, series);
  const plot = { x: 70, y: 115, w: 1120, h: 450 };
  const totals = labels.map((_, index) => stacked
    ? series.reduce((sum, item) => sum + (item.values[index] ?? 0), 0)
    : Math.max(...series.map((item) => item.values[index] ?? 0)));
  const max = Math.max(1, ...totals);
  const groupWidth = plot.w / Math.max(1, labels.length);
  labels.forEach((label, index) => {
    let stackHeight = 0;
    series.forEach((item, seriesIndex) => {
      const value = item.values[index] ?? 0;
      const height = (value / max) * plot.h;
      const width = stacked ? groupWidth * 0.64 : (groupWidth * 0.72) / series.length;
      const x = plot.x + index * groupWidth + groupWidth * 0.14 + (stacked ? 0 : seriesIndex * width);
      const y = plot.y + plot.h - height - stackHeight;
      ctx.fillStyle = item.color;
      ctx.fillRect(x, y, width, height);
      if (stacked) stackHeight += height;
    });
    if (labels.length <= 14 || index % Math.ceil(labels.length / 12) === 0) {
      ctx.fillStyle = '#64748B';
      ctx.font = '14px Calibri, Arial';
      ctx.save();
      ctx.translate(plot.x + index * groupWidth + groupWidth * 0.4, plot.y + plot.h + 20);
      ctx.rotate(-0.55);
      ctx.fillText(label, 0, 0);
      ctx.restore();
    }
  });
  return canvas.toDataURL('image/png');
}

function createCopaChartImages(
  dates: Date[],
  fixedIdx: CopaFixedIndex,
  crmSummary: CopaCrmSummary[],
): CopaChartImages | undefined {
  if (typeof document === 'undefined') return undefined;
  const labels = dates.map((date) => `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`);
  const fixed = dates.map((date) => fixedIdx.get(isoDate(date)) ?? emptyFixedDay());
  const crmLabels = crmSummary.map((item) => `${item.partner} | ${item.block}`);
  return {
    funnel: drawLineChart('Funil LP: comportamento x oficial', labels, [
      { label: 'Acessos LP', color: '#F97316', values: fixed.map((item) => item.trafegoLp ?? 0) },
      { label: 'Etapa GA4', color: '#22C55E', values: fixed.map((item) => item.optinsGa4 ?? 0) },
      { label: 'Opt-ins Visa', color: '#1D4ED8', values: fixed.map((item) => item.optinsVisa ?? 0) },
    ]),
    spend: drawBarChart('Investimento de midia paga', labels, [
      { label: 'Google', color: '#15803D', values: fixed.map((item) => item.media.google.spend) },
      { label: 'Meta', color: '#7E22CE', values: fixed.map((item) => item.media.meta.spend) },
    ], true),
    traffic: drawLineChart('Cliques pagos por canal', labels, [
      { label: 'Google', color: '#15803D', values: fixed.map((item) => item.media.google.clicks) },
      { label: 'Meta', color: '#7E22CE', values: fixed.map((item) => item.media.meta.clicks) },
    ]),
    efficiency: drawLineChart('Eficiencia de midia', labels, [
      { label: 'CPC total', color: '#0EA5E9', values: fixed.map((item) => item.media.total.clicks > 0 ? item.media.total.spend / item.media.total.clicks : 0) },
      { label: 'Custo/Opt-in Visa', color: '#DC2626', values: fixed.map((item) => item.optinsVisa ? item.media.total.spend / item.optinsVisa : 0) },
    ]),
    deliveries: drawBarChart('Entregas CRM por parceiro e segmento', crmLabels, [
      { label: 'Entregas', color: '#15803D', values: crmSummary.map((item) => item.entregues) },
    ]),
    openings: drawBarChart('Aberturas de e-mail por parceiro e segmento', crmLabels, [
      { label: 'Aberturas', color: '#2563EB', values: crmSummary.map((item) => item.aberturas) },
      { label: 'Taxa x100', color: '#F59E0B', values: crmSummary.map((item) => item.taxaAbertura * 100) },
    ]),
  };
}

// ── Escrita de seção no worksheet ─────────────────────────────────────────────

function writeCopaSheet(
  wb: Workbook,
  rows: RawRow[],
  dates: Date[],
  start: Date,
  end: Date,
  fixedIdx: CopaFixedIndex,
  chartImages?: CopaChartImages,
): void {
  const idx = buildCopaIndex(rows, start, end);
  const totalBlocks = COPA_PARTNERS.length * COPA_BLOCKS.length;
  const maxCol = COPA_FIXED_COLS + totalBlocks * COPA_BLOCK_WIDTH;
  const ws = wb.addWorksheet('Rentabilização Copa', {
    views: [{ state: 'frozen', ySplit: 4, topLeftCell: 'A5', activeCell: 'A5', showGridLines: false }],
  });

  // Linha 1: totais do período (fórmulas sobre as linhas de dados)
  const lastDataRow = 4 + dates.length;
  ws.mergeCells('A1:B1');
  setCell(ws.getCell(1, 1), 'TOTAL PERÍODO', { bold: true, fillColor: COLORS.copaAtivacao, fontColor: 'FFFFFF', size: 11 });
  const FIXED_SUM_COLS = [3, 4, 5, 6, 7, 8, 10, 14, 15, 17, 20, 21, 23];
  for (let col = 3; col <= maxCol; col++) {
    const group = COPA_FIXED_GROUPS.find((g) => col >= g.from && col <= g.to);
    setCell(ws.getCell(1, col), '', { bold: true, fillColor: group?.fill ?? COLORS.copaHeader, fontColor: 'FFFFFF', size: 10 });
    if (FIXED_SUM_COLS.includes(col) && dates.length > 0) {
      const letter = colLetter(col);
      const c = ws.getCell(1, col);
      c.value = { formula: `SUM(${letter}5:${letter}${lastDataRow})` };
      c.numFmt = col === 7 || col === 14 || col === 20 ? '#,##0.00' : '#,##0';
    }
  }

  // Linhas 2-3 (colunas fixas): grupos de universo
  for (let col = 1; col <= COPA_FIXED_COLS; col++) {
    setCell(ws.getCell(2, col), '', { fillColor: COLORS.copaHeader });
    setCell(ws.getCell(3, col), '', { fillColor: COLORS.copaHeader });
  }
  for (const g of COPA_FIXED_GROUPS) {
    ws.mergeCells(2, g.from, 3, g.to);
    setCell(ws.getCell(2, g.from), g.label, { bold: true, fillColor: g.fill, fontColor: 'FFFFFF', size: 9 });
  }

  let blockStart = COPA_FIXED_COLS + 1;
  for (const partner of COPA_PARTNERS) {
    for (const block of COPA_BLOCKS) {
      const color = copaBlockColor(block);
      ws.mergeCells(2, blockStart, 2, blockStart + COPA_BLOCK_WIDTH - 1);
      setCell(ws.getCell(2, blockStart), `${block} (${partner})`, { bold: true, fillColor: color, fontColor: 'FFFFFF', size: 10 });

      for (const channel of COPA_CHANNELS) {
        const layout = COPA_CHANNEL_LAYOUT[channel];
        const { fill, font } = copaChannelStyle(channel);
        const metricRels = Object.values(layout.metricRels).filter((rel): rel is number => typeof rel === 'number');
        const channelStart = blockStart + layout.labelRel;
        const channelEnd = blockStart + Math.max(layout.labelRel, ...metricRels);
        ws.mergeCells(3, channelStart, 3, channelEnd);
        setCell(ws.getCell(3, channelStart), layout.label, { bold: true, fillColor: fill, fontColor: font, size: 9 });
        for (let col = channelStart + 1; col <= channelEnd; col++) setCell(ws.getCell(3, col), '', { fillColor: fill, fontColor: font });
      }

      COPA_HEADER.forEach((label, rel) => {
        const channel = rel < 3 ? 'WPP' : rel < 10 ? 'E-MAIL' : rel < 12 ? 'SMS' : 'PUSH';
        const { fill, font } = copaChannelStyle(channel);
        setCell(ws.getCell(4, blockStart + rel), label, { bold: true, fillColor: fill, fontColor: font, size: 8 });
      });
      blockStart += COPA_BLOCK_WIDTH;
    }
  }

  COPA_FIXED_HEADERS.forEach((label, idxLabel) => {
    const col = idxLabel + 1;
    const group = COPA_FIXED_GROUPS.find((g) => col >= g.from && col <= g.to);
    setCell(ws.getCell(4, col), label, {
      bold: true,
      fillColor: group?.fill ?? COLORS.copaHeader,
      fontColor: 'FFFFFF',
      size: 8,
    });
  });

  [1, 2, 3, 4].forEach((row) => copaBorder(ws, row, maxCol, row <= 2 ? 'medium' : 'thin'));
  ws.getRow(1).height = 20;
  ws.getRow(2).height = 16;
  ws.getRow(3).height = 14;
  ws.getRow(4).height = 14;

  const totals = new Map<string, CopaMetrics>();
  const getTotal = (partner: CopaPartner, block: CopaBlock, channel: CopaChannel): CopaMetrics => {
    const key = [partner, block, channel].join(SEP);
    const current = totals.get(key) ?? emptyCopaMetrics();
    totals.set(key, current);
    return current;
  };

  dates.forEach((day, dayIndex) => {
    const row = 5 + dayIndex;
    const ds = isoDate(day);
    const isWeekend = day.getDay() === 0 || day.getDay() === 6;
    const baseFill = isWeekend ? 'E2E8F0' : dayIndex % 2 === 0 ? 'FFFFFF' : 'F2F2F2';
    ws.getRow(row).height = 15;
    for (let col = 1; col <= maxCol; col++) setCell(ws.getCell(row, col), '', { fillColor: baseFill, size: 9 });

    setCell(ws.getCell(row, 1), day.toLocaleDateString('pt-BR'), { fillColor: baseFill, size: 9 });
    setCell(ws.getCell(row, 2), DAY_NAMES[day.getDay()], { fillColor: baseFill, size: 9 });

    // Colunas fixas: LP (GA4) + BI Visa + Mídia Paga
    const fixed = fixedIdx.get(ds);
    if (fixed) {
      const num = (col: number, value: number | null | undefined, fmt: string = '#,##0') => {
        if (!value) return;
        const c = ws.getCell(row, col);
        setCell(c, value, { fillColor: baseFill, size: 9, align: 'right' });
        c.numFmt = fmt;
      };
      num(3, fixed.trafegoLp);
      num(4, fixed.optinsGa4);
      num(5, fixed.optinsVisa);
      num(6, fixed.cartoesVisa);
      const mediaCols: Array<[CopaMediaChannel, number]> = [['total', 7], ['google', 14], ['meta', 20]];
      for (const [ch, base] of mediaCols) {
        const m = fixed.media[ch];
        if (!m || (m.spend === 0 && m.clicks === 0 && m.impressions === 0)) continue;
        num(base, m.spend, '#,##0.00');
        num(base + 1, m.clicks);
        num(base + 2, m.clicks > 0 ? m.spend / m.clicks : 0, '#,##0.00');
        num(base + 3, m.impressions);
        num(base + 4, m.impressions > 0 ? m.clicks / m.impressions : 0, '0.00%');
        num(base + 5, m.impressions > 0 ? (m.spend / m.impressions) * 1000 : 0, '#,##0.00');
      }
      // Custo por Opt-in = spend / Optins Visa (nunca chamar de CAC — regra Copa-2026)
      if (fixed.optinsVisa && fixed.media.total.spend > 0) {
        num(13, fixed.media.total.spend / fixed.optinsVisa, '#,##0.00');
      }
    }

    let startCol = COPA_FIXED_COLS + 1;
    for (const partner of COPA_PARTNERS) {
      for (const block of COPA_BLOCKS) {
        for (const channel of COPA_CHANNELS) {
          const layout = COPA_CHANNEL_LAYOUT[channel];
          const metrics = idx.get(copaKey(ds, partner, block, channel));
          if (hasCopaData(metrics)) {
            const { fill, font } = copaChannelStyle(channel);
            setCell(ws.getCell(row, startCol + layout.labelRel), layout.label, { bold: true, fillColor: fill, fontColor: font, size: 8 });

            const total = getTotal(partner, block, channel);
            total.enviados += metrics!.enviados;
            total.entregues += metrics!.entregues;
            total.abertura += metrics!.abertura;
            total.cliques += metrics!.cliques;

            const writeNumber = (rel: number | undefined, value: number | '') => {
              if (rel === undefined) return;
              const c = ws.getCell(row, startCol + rel);
              setCell(c, value || '', { fillColor: fill, fontColor: font, size: 9 });
              if (value !== '') c.numFmt = '#,##0';
            };
            writeNumber(layout.metricRels.entregues, metrics!.entregues);
            writeNumber(layout.metricRels.abertura, metrics!.abertura);
            writeNumber(layout.metricRels.cliques, metrics!.cliques);

            if (channel === 'E-MAIL') {
              [
                [layout.metricRels.bounce, safeRate(Math.max(0, metrics!.enviados - metrics!.entregues), metrics!.enviados)],
                [layout.metricRels.txAbertura, safeRate(metrics!.abertura, metrics!.entregues)],
                [layout.metricRels.txClique, safeRate(metrics!.cliques, metrics!.entregues)],
              ].forEach(([rel, value]) => {
                if (rel === undefined) return;
                const c = ws.getCell(row, startCol + Number(rel));
                setCell(c, value, { fillColor: fill, fontColor: font, size: 9 });
                if (value !== '') c.numFmt = '0.0%';
              });
            }
          }
        }
        startCol += COPA_BLOCK_WIDTH;
      }
    }
    copaBorder(ws, row, maxCol);
  });

  const totalRow = 5 + dates.length;
  const { current, previous } = comparisonWindows(dates);
  const summaryRows = [totalRow, totalRow + 1, totalRow + 2, totalRow + 3];
  const summaryLabels = [
    'Total do periodo',
    `Ultimos ${current.days} dias fechados`,
    `${previous.days} dias anteriores`,
    'Variacao %',
  ];
  const summaryFills = [COLORS.copaTotal, COLORS.copaCurrent, COLORS.copaPrevious, COLORS.copaVariation];
  const dataRanges = [
    { from: 5, to: totalRow - 1 },
    { from: 5 + current.start, to: 5 + current.end },
    { from: 5 + previous.start, to: 5 + previous.end },
  ];
  const sumCols = [3, 4, 5, 6, 7, 8, 10, 14, 15, 17, 20, 21, 23];
  const derivedCols: Array<[number, number, number, number?]> = [
    [9, 7, 8], [11, 8, 10], [12, 7, 10, 1000], [13, 7, 5],
    [16, 14, 15], [18, 15, 17], [19, 14, 17, 1000],
    [22, 20, 21], [24, 21, 23], [25, 20, 23, 1000],
  ];

  summaryRows.forEach((row, index) => {
    ws.getRow(row).height = 17;
    for (let col = 1; col <= maxCol; col++) setCell(ws.getCell(row, col), '', { bold: true, fillColor: summaryFills[index], size: 9 });
    setCell(ws.getCell(row, 1), summaryLabels[index], { bold: true, fillColor: summaryFills[index], align: 'left', size: 9 });
  });

  dataRanges.forEach((range, index) => {
    const row = summaryRows[index];
    sumCols.forEach((col) => {
      const cell = ws.getCell(row, col);
      cell.value = { formula: sumRangeFormula(col, range.from, range.to) };
      cell.numFmt = [7, 14, 20].includes(col) ? 'R$ #,##0.00' : '#,##0';
    });
    derivedCols.forEach(([col, numerator, denominator, multiplier]) => {
      const cell = ws.getCell(row, col);
      cell.value = { formula: ratioFormula(numerator, denominator, row, multiplier) };
      cell.numFmt = [11, 18, 24].includes(col) ? '0.00%' : 'R$ #,##0.00';
    });
  });
  for (let col = 3; col <= maxCol; col++) {
    const currentCell = `${colLetter(col)}${summaryRows[1]}`;
    const previousCell = `${colLetter(col)}${summaryRows[2]}`;
    ws.getCell(summaryRows[3], col).value = { formula: `IFERROR(${currentCell}/${previousCell}-1,\"\")` };
    ws.getCell(summaryRows[3], col).numFmt = '0.0%';
  }

  const crmWindows = [
    aggregateCopaCrm(idx, dates),
    aggregateCopaCrm(idx, dates, current),
    aggregateCopaCrm(idx, dates, previous),
  ];
  let startCol = COPA_FIXED_COLS + 1;
  for (const partner of COPA_PARTNERS) {
    for (const block of COPA_BLOCKS) {
      for (const channel of COPA_CHANNELS) {
        const layout = COPA_CHANNEL_LAYOUT[channel];
        const { fill, font } = copaChannelStyle(channel);
        crmWindows.forEach((windowTotals, index) => {
          const row = summaryRows[index];
          const metric = windowTotals.get([partner, block, channel].join(SEP));
          if (!metric) return;
          setCell(ws.getCell(row, startCol + layout.labelRel), layout.label, { bold: true, fillColor: fill, fontColor: font, size: 8 });
          const values: Array<[number | undefined, number | '' , boolean?]> = [
            [layout.metricRels.entregues, metric.entregues],
            [layout.metricRels.abertura, metric.abertura],
            [layout.metricRels.cliques, metric.cliques],
            [layout.metricRels.bounce, safeRate(Math.max(0, metric.enviados - metric.entregues), metric.enviados), true],
            [layout.metricRels.txAbertura, safeRate(metric.abertura, metric.entregues), true],
            [layout.metricRels.txClique, safeRate(metric.cliques, metric.entregues), true],
          ];
          values.forEach(([rel, value, rate]) => {
            if (rel === undefined || value === '') return;
            setCell(ws.getCell(row, startCol + rel), value, { bold: true, fillColor: fill, fontColor: font, size: 9 });
            ws.getCell(row, startCol + rel).numFmt = rate ? '0.0%' : '#,##0';
          });
        });
      }
      startCol += COPA_BLOCK_WIDTH;
    }
  }

  summaryRows.forEach((row) => copaBorder(ws, row, maxCol, 'medium'));
  applyTopThreeHighlights(ws, dates, maxCol);

  const legendRow = totalRow + 5;
  setCell(ws.getCell(legendRow, 1), 'LEGENDA', { bold: true, fillColor: COLORS.copaHeader, fontColor: 'FFFFFF', align: 'left' });
  [[3, 'Top 1-2 volume/taxa', COLORS.peakGood], [7, 'Top 3 / atencao', COLORS.peakWarn], [11, 'Top 1-2 custo', COLORS.peakBad], [15, 'Cinza = fim de semana', 'E2E8F0']]
    .forEach(([col, label, fill]) => {
      ws.mergeCells(legendRow, Number(col), legendRow, Number(col) + 2);
      setCell(ws.getCell(legendRow, Number(col)), String(label), { bold: true, fillColor: String(fill), size: 9 });
    });

  const cardRow = legendRow + 3;
  const crmDeliveryCols: number[] = [];
  for (let start = COPA_FIXED_COLS + 1; start <= maxCol; start += COPA_BLOCK_WIDTH) {
    [1, 4, 11, 13].forEach((rel) => crmDeliveryCols.push(start + rel));
  }
  const crmDeliveriesFormula = (row: number) => `SUM(${crmDeliveryCols.map((col) => `${colLetter(col)}${row}`).join(',')})`;
  const emailOpenRateFormula = (row: number) => `IFERROR(SUM(AE${row},AS${row},BG${row},BU${row},CI${row},CW${row},DK${row},DY${row},EM${row})/SUM(AD${row},AR${row},BF${row},BT${row},CH${row},CV${row},DJ${row},DX${row},EL${row}),\"\")`;
  const cards: Array<{ label: string; formula: string; currentFormula: string; previousFormula: string; format: string; fill: string; coverage: string; coverageCol: string }> = [
    { label: 'ACESSOS LP', formula: `C${totalRow}`, currentFormula: `C${totalRow + 1}`, previousFormula: `C${totalRow + 2}`, format: '#,##0', fill: '2E75B6', coverage: 'GA4 / Looker', coverageCol: 'C' },
    { label: 'OPT-INS VISA', formula: `E${totalRow}`, currentFormula: `E${totalRow + 1}`, previousFormula: `E${totalRow + 2}`, format: '#,##0', fill: '1F3864', coverage: 'BI Visa oficial', coverageCol: 'E' },
    { label: 'TX LP -> OPT-IN', formula: `IFERROR(E${totalRow}/C${totalRow},\"\")`, currentFormula: `IFERROR(E${totalRow + 1}/C${totalRow + 1},\"\")`, previousFormula: `IFERROR(E${totalRow + 2}/C${totalRow + 2},\"\")`, format: '0.0%', fill: '0F766E', coverage: 'Visa / acessos LP', coverageCol: 'E' },
    { label: 'CARTOES VISA', formula: `F${totalRow}`, currentFormula: `F${totalRow + 1}`, previousFormula: `F${totalRow + 2}`, format: '#,##0', fill: '334155', coverage: 'BI Visa oficial', coverageCol: 'F' },
    { label: 'INVESTIMENTO', formula: `G${totalRow}`, currentFormula: `G${totalRow + 1}`, previousFormula: `G${totalRow + 2}`, format: 'R$ #,##0.00', fill: '4472C4', coverage: 'Google + Meta', coverageCol: 'G' },
    { label: 'CUSTO / OPT-IN', formula: `M${totalRow}`, currentFormula: `M${totalRow + 1}`, previousFormula: `M${totalRow + 2}`, format: 'R$ #,##0.00', fill: '7C3AED', coverage: 'Nunca CAC', coverageCol: 'M' },
    { label: 'ENTREGAS CRM', formula: crmDeliveriesFormula(totalRow), currentFormula: crmDeliveriesFormula(totalRow + 1), previousFormula: crmDeliveriesFormula(totalRow + 2), format: '#,##0', fill: '15803D', coverage: 'Canais CRM', coverageCol: 'AA' },
    { label: 'TX ABERTURA EMAIL', formula: emailOpenRateFormula(totalRow), currentFormula: emailOpenRateFormula(totalRow + 1), previousFormula: emailOpenRateFormula(totalRow + 2), format: '0.0%', fill: '0369A1', coverage: 'E-mail CRM', coverageCol: 'AE' },
  ];
  cards.forEach((card, index) => {
    const col = 1 + index * 4;
    ws.mergeCells(cardRow, col, cardRow, col + 2);
    ws.mergeCells(cardRow + 1, col, cardRow + 2, col + 2);
    ws.mergeCells(cardRow + 3, col, cardRow + 3, col + 2);
    ws.mergeCells(cardRow + 4, col, cardRow + 4, col + 2);
    setCell(ws.getCell(cardRow, col), card.label, { bold: true, fillColor: card.fill, fontColor: 'FFFFFF', size: 9 });
    setCell(ws.getCell(cardRow + 1, col), { formula: card.formula }, { bold: true, fillColor: card.fill, fontColor: 'FFFFFF', size: 16 });
    ws.getCell(cardRow + 1, col).numFmt = card.format;
    setCell(ws.getCell(cardRow + 3, col), { formula: `\"7d: \"&TEXT(${card.currentFormula},\"${card.format.replace('R$ ', '')}\")&\" | vs ant.: \"&TEXT(IFERROR(${card.currentFormula}/${card.previousFormula}-1,0),\"0.0%\")` }, { bold: true, fillColor: 'F8FAFC', size: 8 });
    setCell(ws.getCell(cardRow + 4, col), { formula: `\"${card.coverage} | cobertura: \"&COUNT(${card.coverageCol}5:${card.coverageCol}${totalRow - 1})&\"/${dates.length} dias\"` }, { fillColor: 'F8FAFC', size: 8 });
  });

  if (chartImages) {
    const chartRow = cardRow + 6;
    const placements: Array<[keyof CopaChartImages, number, number]> = [
      ['funnel', 1, chartRow], ['spend', 14, chartRow], ['traffic', 27, chartRow],
      ['efficiency', 1, chartRow + 20], ['deliveries', 14, chartRow + 20], ['openings', 27, chartRow + 20],
    ];
    placements.forEach(([key, col, row]) => {
      const imageId = wb.addImage({ base64: chartImages[key], extension: 'png' });
      ws.addImage(imageId, { tl: { col: col - 1, row: row - 1 }, ext: { width: 620, height: 320 } });
    });
  }

  [11, 5, 10, 12, 10, 11, 12, 11, 9, 11, 8, 9, 13, 10, 9, 8, 10, 8, 9, 10, 9, 8, 10, 8, 9].forEach((width, idxWidth) => { ws.getColumn(idxWidth + 1).width = width; });
  for (let col = COPA_FIXED_COLS + 1; col <= maxCol; col++) {
    const rel = (col - COPA_FIXED_COLS - 1) % COPA_BLOCK_WIDTH;
    ws.getColumn(col).width = [0, 3, 10, 12].includes(rel) ? 10 : rel >= 7 && rel <= 9 ? 11 : 13;
  }
}

function writeSection(
  ws: Worksheet,
  startRow: number,
  produto: string,
  idx: Map<string, RntMetrics>,
  dates: Date[],
  tab: 'seguros' | 'rentabilizacao' = 'rentabilizacao',
): number {
  const color = productHeaderColor(produto, tab);
  const numMetricCols = 6;  // Entregues | Abertos | Cliques | Propostas | Aprovados | Contratações
  const numTaxCols = 3;     // Tx Entrega | Tx Abertura | Tx Conv
  const maxCol = 2 + numMetricCols + numTaxCols; // Data | Dia | 6 métricas | 3 taxas = 11

  // Header linha 1: título do produto (merge)
  ws.mergeCells(startRow, 1, startRow, maxCol);
  setCell(ws.getCell(startRow, 1), produto.toUpperCase(), { bold: true, fontColor: 'FFFFFF', fillColor: color, align: 'left', size: 11 });
  border(ws, startRow, maxCol, 'medium');

  // Header linha 2: nomes das colunas
  const headers = ['Data', 'Dia', 'Entregues', 'Abertos', 'Cliques', 'Propostas', 'Aprovados', 'Contratações', 'Tx Entrega', 'Tx Abertura', 'Tx Conv'];
  headers.forEach((h, i) => {
    setCell(ws.getCell(startRow + 1, i + 1), h, { bold: true, fontColor: 'FFFFFF', fillColor: color });
  });
  border(ws, startRow + 1, maxCol, 'medium');

  const dataStart = startRow + 2;
  let rowNum = dataStart;
  const today = new Date(); today.setHours(0, 0, 0, 0);

  for (const day of dates) {
    const ds = isoDate(day);
    // Coletar canais únicos para este produto nesta data
    const canais = new Set<string>();
    idx.forEach((_, key) => {
      const [kDate, kProd] = key.split(SEP);
      if (kDate === ds && kProd === produto) canais.add(key.split(SEP)[2]);
    });

    const rowsToWrite = canais.size > 0 ? [...canais].sort() : [''];
    const isWeekend = day.getDay() === 0 || day.getDay() === 6;
    const zebra = rowNum % 2 === 0 ? COLORS.zebra : 'FFFFFF';

    for (const canal of rowsToWrite) {
      const fill = canal ? canalFill(canal) : zebra;
      const metrics = canal ? idx.get(idxKey(ds, produto, canal)) : undefined;

      // Limpeza de linha
      for (let c = 1; c <= maxCol; c++) setCell(ws.getCell(rowNum, c), '', { fillColor: isWeekend ? 'F1F5F9' : zebra });

      // Data e dia
      setCell(ws.getCell(rowNum, 1), day.toLocaleDateString('pt-BR'), { italic: isWeekend, fillColor: isWeekend ? 'E2E8F0' : zebra, align: 'center' });
      setCell(ws.getCell(rowNum, 2), DAY_NAMES[day.getDay()], { italic: isWeekend, fillColor: isWeekend ? 'E2E8F0' : zebra, align: 'center' });

      if (metrics && canal) {
        const r = rowNum;
        // Canal já está no preenchimento — mostrar no título da data
        setCell(ws.getCell(rowNum, 1), `${day.toLocaleDateString('pt-BR')} · ${canal}`, { italic: isWeekend, fillColor: fill, align: 'left' });
        setCell(ws.getCell(rowNum, 2), DAY_NAMES[day.getDay()], { italic: isWeekend, fillColor: fill });
        setCell(ws.getCell(rowNum, 3), metrics.entregues || '', { fillColor: fill, align: 'right' });
        setCell(ws.getCell(rowNum, 4), metrics.abertos   || '', { fillColor: fill, align: 'right' });
        setCell(ws.getCell(rowNum, 5), metrics.cliques   || '', { fillColor: fill, align: 'right' });
        setCell(ws.getCell(rowNum, 6), metrics.propostas || '', { fillColor: fill, align: 'right' });
        setCell(ws.getCell(rowNum, 7), metrics.aprovados || '', { fillColor: fill, align: 'right' });
        setCell(ws.getCell(rowNum, 8), metrics.contratacoes || '', { fillColor: fill, align: 'right' });

        // Fórmulas de taxa
        const C = colLetter(3); const D = colLetter(4); const I = colLetter(9);
        const H = colLetter(8);
        ws.getCell(r, 9).value  = { formula: `=IF(AND(${C}${r}>0),${D}${r}/${C}${r},"")` };
        ws.getCell(r, 10).value = { formula: `=IF(AND(${D}${r}>0,E${r}>0),E${r}/${D}${r},"")` };
        ws.getCell(r, 11).value = { formula: `=IF(AND(${C}${r}>0,${H}${r}>0),${H}${r}/${C}${r},"")` };
        [9, 10, 11].forEach((c) => {
          ws.getCell(r, c).numFmt = '0.0%';
          ws.getCell(r, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${fill}` } };
        });
        [3, 4, 5, 6, 7, 8].forEach((c) => { ws.getCell(r, c).numFmt = '#,##0'; });
      }

      border(ws, rowNum, maxCol);
      rowNum++;
    }
  }

  // Linha de totais
  const totalRow = rowNum;
  for (let c = 1; c <= maxCol; c++) setCell(ws.getCell(totalRow, c), '', { bold: true, fillColor: COLORS.total });
  setCell(ws.getCell(totalRow, 1), 'TOTAL', { bold: true, fillColor: COLORS.total, align: 'left' });
  [3, 4, 5, 6, 7, 8].forEach((c) => {
    const letter = colLetter(c);
    ws.getCell(totalRow, c).value = { formula: `=SUM(${letter}${dataStart}:${letter}${totalRow - 1})` };
    ws.getCell(totalRow, c).numFmt = '#,##0';
    ws.getCell(totalRow, c).font = { bold: true, name: 'Calibri', size: 10 };
    ws.getCell(totalRow, c).alignment = { horizontal: 'right', vertical: 'middle' };
    ws.getCell(totalRow, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${COLORS.total}` } };
  });
  border(ws, totalRow, maxCol, 'medium');

  return totalRow + 3; // 2 linhas de gap entre seções
}

// ── Criação de sheet diarizado ────────────────────────────────────────────────

function buildTabSheet(
  wb: Workbook,
  sheetName: string,
  tabData: TabIndex,
  dates: Date[],
  tab: 'seguros' | 'rentabilizacao',
): void {
  const ws = wb.addWorksheet(sheetName, {
    views: [{ state: 'frozen', xSplit: 2, ySplit: 2, topLeftCell: 'C3', activeCell: 'C3', showGridLines: false }],
  });
  let nextRow = 1;
  for (const produto of tabData.produtoOrder) {
    nextRow = writeSection(ws, nextRow, produto, tabData.idx, dates, tab);
  }
  ws.getColumn(1).width = 22;
  ws.getColumn(2).width = 6;
  ws.getColumn(3).width = 12;
  ws.getColumn(4).width = 10;
  ws.getColumn(5).width = 10;
  ws.getColumn(6).width = 12;
  ws.getColumn(7).width = 12;
  ws.getColumn(8).width = 14;
  ws.getColumn(9).width = 11;
  ws.getColumn(10).width = 12;
  ws.getColumn(11).width = 10;
}

// ── Aba Auditoria ─────────────────────────────────────────────────────────────

function writeAuditSheet(
  wb: Workbook,
  auditRows: AuditRow[],
  segurosJourneys: RntJourneyRow[],
  rntJourneys: RntJourneyRow[],
  copaJourneys: CopaAuditRow[],
  summary: IndexResult['summary'],
): void {
  const ws = wb.addWorksheet('Auditoria', { views: [{ state: 'frozen', ySplit: 4, showGridLines: false }] });

  setCell(ws.getCell('A1'), 'Auditoria — Rentabilização CRM', { bold: true, fontColor: 'FFFFFF', fillColor: COLORS.audit, align: 'left', size: 12 });
  ws.mergeCells('A1:K1');

  // Contadores globais
  [
    ['Linhas fonte no período', summary.source],
    ['Linhas mapeadas', summary.mapped],
    ['Linhas fora do mapeamento', summary.audit],
  ].forEach(([label, value], i) => {
    const row = i + 3;
    setCell(ws.getCell(row, 1), String(label), { bold: true, fillColor: COLORS.auditSub, align: 'left' });
    setCell(ws.getCell(row, 2), Number(value), { fillColor: COLORS.auditSub });
  });

  let cursor = 7;

  if (copaJourneys.length > 0) {
    setCell(ws.getCell(cursor, 1), 'Mapa de campanhas Copa', { bold: true, fontColor: 'FFFFFF', fillColor: COLORS.audit, align: 'left' });
    ws.mergeCells(cursor, 1, cursor, 10);
    cursor++;
    [
      'Regra: Ativacao, Reativacao, Novos e Cartonistas com COPA entram apenas na aba Rentabilizacao Copa.',
      'Regra: Cartonistas com COPA e tratado como bloco Ativacao por correcao de UTM/jornada.',
      'Use Destino + Bloco/Produto para conferir onde cada journey foi atribuida.',
    ].forEach((text) => {
      setCell(ws.getCell(cursor, 1), text, { italic: true, fillColor: COLORS.auditSub, align: 'left' });
      ws.mergeCells(cursor, 1, cursor, 10);
      cursor++;
    });

    ['Destino', 'Parceiro', 'Bloco/Produto', 'Jornada', 'Canal', 'Linhas', 'Base enviada', 'Entregues', 'Abertura', 'Cliques'].forEach((h, i) => {
      setCell(ws.getCell(cursor, i + 1), h, { bold: true, fontColor: 'FFFFFF', fillColor: COLORS.audit });
    });
    cursor++;
    copaJourneys.forEach((jr) => {
      [jr.destino, jr.parceiro, jr.bloco, jr.jornada, jr.canal, jr.linhas, jr.enviados, jr.entregues, jr.abertura, jr.cliques]
        .forEach((v, c) => setCell(ws.getCell(cursor, c + 1), v, { align: c < 5 ? 'left' : 'center' }));
      cursor++;
    });
    cursor += 3;
  }

  // Escreve seção de resumo por produto para cada grupo
  const writeJourneyBlock = (label: string, journeyRows: RntJourneyRow[]) => {
    if (journeyRows.length === 0) return;

    const prodSummary = new Map<string, RntMetrics & { linhas: number }>();
    journeyRows.forEach((jr) => {
      const cur = prodSummary.get(jr.produto) ?? { linhas: 0, entregues: 0, abertos: 0, cliques: 0, propostas: 0, aprovados: 0, contratacoes: 0 };
      cur.linhas += jr.linhas;
      METRIC_FIELDS.forEach((f) => { cur[f] += jr[f]; });
      prodSummary.set(jr.produto, cur);
    });

    setCell(ws.getCell(cursor, 1), `Resumo — ${label}`, { bold: true, fontColor: 'FFFFFF', fillColor: COLORS.audit, align: 'left' });
    ws.mergeCells(cursor, 1, cursor, 9);
    ['Produto', 'Linhas', 'Entregues', 'Abertos', 'Cliques', 'Propostas', 'Aprovados', 'Contratações'].forEach((h, i) => {
      setCell(ws.getCell(cursor + 1, i + 1), h, { bold: true, fontColor: 'FFFFFF', fillColor: COLORS.audit });
    });
    cursor += 2;
    [...prodSummary.entries()].sort(([a], [b]) => a.localeCompare(b)).forEach(([prod, totals]) => {
      setCell(ws.getCell(cursor, 1), prod, { align: 'left' });
      ['linhas', ...METRIC_FIELDS].forEach((f, i) => {
        setCell(ws.getCell(cursor, 2 + i), totals[f as keyof typeof totals] as number);
      });
      cursor++;
    });
    cursor += 2;

    // Mapa de jornadas deste grupo
    setCell(ws.getCell(cursor, 1), `Mapa de jornadas — ${label}`, { bold: true, fontColor: 'FFFFFF', fillColor: COLORS.audit, align: 'left' });
    ws.mergeCells(cursor, 1, cursor, 11);
    ['Produto', 'Jornada', 'Activity name / Taxonomia', 'BU', 'Canal', 'Linhas', 'Entregues', 'Abertos', 'Cliques', 'Aprovados', 'Contratações'].forEach((h, i) => {
      setCell(ws.getCell(cursor + 1, i + 1), h, { bold: true, fontColor: 'FFFFFF', fillColor: COLORS.audit });
    });
    cursor += 2;
    journeyRows.forEach((jr) => {
      [jr.produto, jr.jornada, jr.activity, jr.bu, jr.canal, jr.linhas, jr.entregues, jr.abertos, jr.cliques, jr.aprovados, jr.contratacoes]
        .forEach((v, c) => setCell(ws.getCell(cursor, c + 1), v, { align: c < 5 ? 'left' : 'center' }));
      cursor++;
    });
    cursor += 3;
  };

  writeJourneyBlock('Seguros', segurosJourneys);
  writeJourneyBlock('Rentabilização', rntJourneys);

  // Linhas fora do mapeamento
  if (auditRows.length > 0) {
    setCell(ws.getCell(cursor, 1), 'Linhas fora do padrão JOR_RENTABILIZACAO_*', { bold: true, fontColor: 'FFFFFF', fillColor: COLORS.audit, align: 'left' });
    ws.mergeCells(cursor, 1, cursor, 9);
    ['Motivo', 'BU', 'Jornada', 'Canal', 'Linhas', 'Entregues', 'Abertos', 'Propostas', 'Contratações'].forEach((h, i) => {
      setCell(ws.getCell(cursor + 1, i + 1), h, { bold: true, fontColor: 'FFFFFF', fillColor: COLORS.audit });
    });
    cursor += 2;
    auditRows.forEach((ar) => {
      [ar.motivo, ar.bu, ar.jornada, ar.canal, ar.linhas, ar.entregues, ar.abertos, ar.propostas, ar.contratacoes]
        .forEach((v, i) => setCell(ws.getCell(cursor, i + 1), v, { align: i < 4 ? 'left' : 'center' }));
      cursor++;
    });
  }

  [30, 50, 60, 14, 12, 10, 12, 10, 10, 12, 14].forEach((w, i) => { ws.getColumn(i + 1).width = w; });
}

// ── Workbook principal ────────────────────────────────────────────────────────

function buildWorkbook(
  ExcelJSRuntime: { Workbook: new () => Workbook },
  rows: RawRow[],
  start: Date,
  end: Date,
  fixedIdx: CopaFixedIndex,
  chartImages?: CopaChartImages,
): Workbook {
  const { seguros, rentabilizacao, auditRows, summary } = buildIndexes(rows, start, end);
  const copaStart = start < COPA_ACTION_START ? COPA_ACTION_START : start;
  const copaDates = copaStart <= end ? allDates(copaStart, end) : [];
  const copaAuditRows = copaStart <= end ? buildCopaAuditRows(rows, copaStart, end) : [];
  const dates = allDates(start, end);
  const wb = new ExcelJSRuntime.Workbook();
  wb.creator = 'GaaS AFINZ — Rentabilização';
  wb.created = new Date();

  const copaIdx = buildCopaIndex(rows, copaStart, end);
  const crmSummary = copaCrmChartSummary(copaIdx, copaDates);
  writeCopaSheet(wb, rows, copaDates, copaStart, end, fixedIdx, chartImages);
  addDashboardDataSheet(wb, copaDates, fixedIdx, crmSummary);

  // Aba 1: Seguros (cross-sell BU Seguros)
  buildTabSheet(wb, 'Seguros', seguros, dates, 'seguros');

  // Aba 2: Rentabilização (Cartonistas, Ativação CRM, Copa _rnt_, etc.)
  buildTabSheet(wb, 'Rentabilização', rentabilizacao, dates, 'rentabilizacao');

  // Aba 3: Auditoria
  writeAuditSheet(wb, auditRows, seguros.journeyRows, rentabilizacao.journeyRows, copaAuditRows, summary);

  return wb;
}

// ── Fetch Supabase ────────────────────────────────────────────────────────────

async function fetchRntRows(start: Date, end: Date): Promise<RawRow[]> {
  const rows: RawRow[] = [];
  const pageSize = 1000;
  const exclusiveEnd = addDays(end, 1);

  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabase
      .from('rentabilizacao_activities')
      .select('*')
      .gte('Data de Disparo', isoDate(start))
      .lt('Data de Disparo', isoDate(exclusiveEnd))
      .order('Data de Disparo', { ascending: true })
      .order('jornada', { ascending: true })
      .range(offset, offset + pageSize - 1);

    if (error) throw error;
    rows.push(...((data ?? []) as RawRow[]));
    if (!data || data.length < pageSize) break;
  }
  return rows;
}

function emptyMediaAgg(): CopaMediaAgg {
  return { spend: 0, clicks: 0, impressions: 0 };
}

function emptyFixedDay(): CopaFixedDay {
  return {
    trafegoLp: null,
    optinsGa4: null,
    optinsVisa: null,
    cartoesVisa: null,
    media: { total: emptyMediaAgg(), google: emptyMediaAgg(), meta: emptyMediaAgg() },
  };
}

/**
 * Busca e indexa por data os 3 universos das colunas fixas da aba Copa:
 * LP (copa_lp_daily), BI Visa (copa_visa_daily) e Mídia Paga (paid_media_metrics
 * filtrada pelas campanhas com objective='rentabilizacao').
 * Falha de uma fonte não derruba o export — a coluna fica vazia (console.warn).
 */
async function fetchCopaFixedDaily(start: Date, end: Date): Promise<CopaFixedIndex> {
  const idx: CopaFixedIndex = new Map();
  const day = (ds: string): CopaFixedDay => {
    const cur = idx.get(ds) ?? emptyFixedDay();
    idx.set(ds, cur);
    return cur;
  };
  const startIso = isoDate(start);
  const endExclusiveIso = isoDate(addDays(end, 1));

  // 1. LP Visa (GA4/Looker) — linha __total__ tem tráfego diário + funil
  try {
    const { data, error } = await supabase
      .from('copa_lp_daily')
      .select('data, usuarios, etapa_optin')
      .eq('origem', '__total__')
      .gte('data', startIso)
      .lt('data', endExclusiveIso);
    if (error) throw error;
    for (const row of data ?? []) {
      const d = day(String(row.data).slice(0, 10));
      d.trafegoLp = asInt(row.usuarios);
      d.optinsGa4 = asInt(row.etapa_optin);
    }
  } catch (err) {
    console.warn('[renta-copa] copa_lp_daily indisponível:', err);
  }

  // 2. BI Visa (oficial) — clientes/cartões por dia (delta do acumulado)
  try {
    const { data, error } = await supabase
      .from('copa_visa_daily')
      .select('data, clientes_dia, cartoes_dia')
      .gte('data', startIso)
      .lt('data', endExclusiveIso);
    if (error) throw error;
    for (const row of data ?? []) {
      const d = day(String(row.data).slice(0, 10));
      if (row.clientes_dia !== null && row.clientes_dia !== undefined) d.optinsVisa = asInt(row.clientes_dia);
      if (row.cartoes_dia !== null && row.cartoes_dia !== undefined) d.cartoesVisa = asInt(row.cartoes_dia);
    }
  } catch (err) {
    console.warn('[renta-copa] copa_visa_daily indisponível:', err);
  }

  // 3. Mídia Paga — campanhas mapeadas como rentabilizacao (Copa LP Visa)
  try {
    const { data: maps, error: mapErr } = await supabase
      .from('paid_media_campaign_mappings')
      .select('campaign_name')
      .eq('objective', 'rentabilizacao');
    if (mapErr) throw mapErr;
    const campaigns = (maps ?? []).map((m) => String(m.campaign_name));
    if (campaigns.length > 0) {
      const pageSize = 1000;
      for (let offset = 0; ; offset += pageSize) {
        const { data, error } = await supabase
          .from('paid_media_metrics')
          .select('date, channel, spend, clicks, impressions')
          .in('campaign', campaigns)
          .gte('date', startIso)
          .lt('date', endExclusiveIso)
          .range(offset, offset + pageSize - 1);
        if (error) throw error;
        for (const row of data ?? []) {
          const d = day(String(row.date).slice(0, 10));
          const channel = String(row.channel ?? '').toLowerCase() === 'google' ? 'google' : 'meta';
          for (const target of ['total', channel] as CopaMediaChannel[]) {
            const agg = d.media[target];
            agg.spend += Number(row.spend) || 0;
            agg.clicks += asInt(row.clicks);
            agg.impressions += asInt(row.impressions);
          }
        }
        if (!data || data.length < pageSize) break;
      }
    }
  } catch (err) {
    console.warn('[renta-copa] paid_media_metrics indisponível:', err);
  }

  return idx;
}

function downloadBuffer(buffer: BlobPart, filename: string): void {
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

// ── Export público ────────────────────────────────────────────────────────────

export async function exportRentabilizacaoCrmXlsx(
  start: Date,
  end: Date,
): Promise<{ rows: number; filename: string }> {
  const effectiveEnd = closedEnd(end);
  if (effectiveEnd < start) throw new Error('O periodo selecionado ainda nao possui dias fechados.');
  const copaFixedStart = start < COPA_ACTION_START ? COPA_ACTION_START : start;
  const [rawRows, fixedIdx, ExcelJSModule] = await Promise.all([
    fetchRntRows(start, effectiveEnd),
    fetchCopaFixedDaily(copaFixedStart, effectiveEnd),
    import('exceljs'),
  ]);
  const copaDates = copaFixedStart <= effectiveEnd ? allDates(copaFixedStart, effectiveEnd) : [];
  const crmSummary = copaCrmChartSummary(buildCopaIndex(rawRows, copaFixedStart, effectiveEnd), copaDates);
  const chartImages = createCopaChartImages(copaDates, fixedIdx, crmSummary);
  const workbook = buildWorkbook(ExcelJSModule.default, rawRows, start, effectiveEnd, fixedIdx, chartImages);
  const buffer = await workbook.xlsx.writeBuffer();
  const filename = `rentabilizacao_crm_${isoDate(start).replace(/-/g, '')}_${isoDate(effectiveEnd).replace(/-/g, '')}.xlsx`;
  downloadBuffer(buffer, filename);
  return { rows: rawRows.length, filename };
}

// v2 (2026-06-11): colunas fixas integradas — LP Looker + BI Visa + Mídia Paga (vault: Export-XLSX-Renta-Copa)
export function getCurrentMonthRange(): { start: Date; end: Date } {
  const now = new Date();
  return {
    start: new Date(now.getFullYear(), now.getMonth(), 1),
    end:   new Date(now.getFullYear(), now.getMonth() + 1, 0),
  };
}
