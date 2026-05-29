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
type CopaPartner = typeof COPA_PARTNERS[number];
type CopaBlock = typeof COPA_BLOCKS[number];
type CopaChannel = typeof COPA_CHANNELS[number];

const COPA_FIXED_COLS = 7;
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
};

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
  if (!jornada.includes('COPA') || jornada.includes('CARTONISTAS')) return null;

  let partner: CopaPartner = 'B2C + B2B2C';
  if (jornada.includes('PLURIX')) partner = 'Plurix';
  else if (jornada.includes('_BB_')) partner = 'BB';

  let block: CopaBlock | null = null;
  if (jornada.includes('NOVOS')) block = 'Novos';
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
  const j = jornada.toUpperCase().trim();

  if (j.startsWith('JOR_RENTABILIZACAO')) return parseJourney(jornada);

  if (j.startsWith('JOR_ATIVACAO_') || j.startsWith('JOR_ATIVAÇÃO_'))
    return parseAtivacaoJourney(jornada);

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

      const jornada = String(row['jornada'] ?? '');
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
      const jornada = String(row['jornada'] ?? '');
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

// ── Escrita de seção no worksheet ─────────────────────────────────────────────

function writeCopaSheet(wb: Workbook, rows: RawRow[], dates: Date[], start: Date, end: Date): void {
  const idx = buildCopaIndex(rows, start, end);
  const totalBlocks = COPA_PARTNERS.length * COPA_BLOCKS.length;
  const maxCol = COPA_FIXED_COLS + totalBlocks * COPA_BLOCK_WIDTH;
  const ws = wb.addWorksheet('Rentabilização Copa', {
    views: [{ state: 'frozen', ySplit: 4, topLeftCell: 'A5', activeCell: 'A5', showGridLines: false }],
  });

  ws.mergeCells('A1:B1');
  ws.mergeCells('C1:D1');
  ws.mergeCells('E1:F1');
  for (let col = 1; col <= maxCol; col++) {
    const fillColor = col <= 2 ? COLORS.copaAtivacao : col <= 4 ? '2E75B6' : col <= 6 ? '1D7B2B' : col === 7 ? '7F6000' : COLORS.copaHeader;
    setCell(ws.getCell(1, col), '', { bold: col <= 7, fillColor, fontColor: col <= 7 ? 'FFFFFF' : '000000', size: 11 });
  }

  for (let col = 1; col <= COPA_FIXED_COLS; col++) {
    setCell(ws.getCell(2, col), '', { fillColor: COLORS.copaHeader });
    setCell(ws.getCell(3, col), '', { fillColor: COLORS.copaHeader });
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

  ['Data', 'Dia', 'Trafego LP', 'Optins LP', 'Invt. Midia (R$)', 'Cliques Midia', 'CPC (R$)'].forEach((label, idxLabel) => {
    setCell(ws.getCell(4, idxLabel + 1), label, {
      bold: true,
      fillColor: idxLabel < 2 ? COLORS.copaHeader : COLORS.copaMedia,
      fontColor: 'FFFFFF',
      size: 8,
    });
  });

  [1, 2, 3, 4].forEach((row) => border(ws, row, maxCol, row <= 2 ? 'medium' : 'thin'));
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
    ws.getRow(row).height = 15;
    for (let col = 1; col <= maxCol; col++) setCell(ws.getCell(row, col), '', { fillColor: 'FFFFFF', size: 9 });

    setCell(ws.getCell(row, 1), day.toLocaleDateString('pt-BR'), { fillColor: 'FFFFFF', size: 9 });
    setCell(ws.getCell(row, 2), DAY_NAMES[day.getDay()], { fillColor: 'FFFFFF', size: 9 });

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
    border(ws, row, maxCol);
  });

  const totalRow = 5 + dates.length;
  ws.getRow(totalRow).height = 15;
  for (let col = 1; col <= maxCol; col++) setCell(ws.getCell(totalRow, col), '', { bold: true, fillColor: COLORS.copaTotal, size: 9 });
  setCell(ws.getCell(totalRow, 1), 'total', { bold: true, fillColor: COLORS.copaTotal, size: 9 });

  let startCol = COPA_FIXED_COLS + 1;
  for (const partner of COPA_PARTNERS) {
    for (const block of COPA_BLOCKS) {
      for (const channel of COPA_CHANNELS) {
        const layout = COPA_CHANNEL_LAYOUT[channel];
        const total = totals.get([partner, block, channel].join(SEP));
        if (hasCopaData(total)) {
          const { fill, font } = copaChannelStyle(channel);
          setCell(ws.getCell(totalRow, startCol + layout.labelRel), layout.label, { bold: true, fillColor: fill, fontColor: font, size: 8 });

          const writeTotalFormula = (rel: number | undefined) => {
            if (rel === undefined) return;
            const letter = colLetter(startCol + rel);
            const c = ws.getCell(totalRow, startCol + rel);
            setCell(c, { formula: `SUM(${letter}5:${letter}${totalRow - 1})` }, { bold: true, fillColor: fill, fontColor: font, size: 9 });
            c.numFmt = '#,##0';
          };
          writeTotalFormula(layout.metricRels.entregues);
          writeTotalFormula(layout.metricRels.abertura);
          writeTotalFormula(layout.metricRels.cliques);

          if (channel === 'E-MAIL') {
            [
              [layout.metricRels.bounce, safeRate(Math.max(0, total!.enviados - total!.entregues), total!.enviados)],
              [layout.metricRels.txAbertura, safeRate(total!.abertura, total!.entregues)],
              [layout.metricRels.txClique, safeRate(total!.cliques, total!.entregues)],
            ].forEach(([rel, value]) => {
              if (rel === undefined) return;
              const c = ws.getCell(totalRow, startCol + Number(rel));
              setCell(c, value, { bold: true, fillColor: fill, fontColor: font, size: 9 });
              if (value !== '') c.numFmt = '0.0%';
            });
          }
        }
      }
      startCol += COPA_BLOCK_WIDTH;
    }
  }
  border(ws, totalRow, maxCol, 'medium');

  [11, 5, 11, 9, 12, 13, 9].forEach((width, idxWidth) => { ws.getColumn(idxWidth + 1).width = width; });
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

function writeAuditSheet(wb: Workbook, auditRows: AuditRow[], segurosJourneys: RntJourneyRow[], rntJourneys: RntJourneyRow[], summary: IndexResult['summary']): void {
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

function buildWorkbook(ExcelJSRuntime: { Workbook: new () => Workbook }, rows: RawRow[], start: Date, end: Date): Workbook {
  const { seguros, rentabilizacao, auditRows, summary } = buildIndexes(rows, start, end);
  const dates = allDates(start, end);
  const wb = new ExcelJSRuntime.Workbook();
  wb.creator = 'GaaS AFINZ — Rentabilização';
  wb.created = new Date();

  writeCopaSheet(wb, rows, dates, start, end);

  // Aba 1: Seguros (cross-sell BU Seguros)
  buildTabSheet(wb, 'Seguros', seguros, dates, 'seguros');

  // Aba 2: Rentabilização (Cartonistas, Ativação CRM, Copa _rnt_, etc.)
  buildTabSheet(wb, 'Rentabilização', rentabilizacao, dates, 'rentabilizacao');

  // Aba 3: Auditoria
  writeAuditSheet(wb, auditRows, seguros.journeyRows, rentabilizacao.journeyRows, summary);

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
  const rawRows = await fetchRntRows(start, end);
  const ExcelJSModule = await import('exceljs');
  const workbook = buildWorkbook(ExcelJSModule.default, rawRows, start, end);
  const buffer = await workbook.xlsx.writeBuffer();
  const filename = `rentabilizacao_crm_${isoDate(start).replace(/-/g, '')}_${isoDate(end).replace(/-/g, '')}.xlsx`;
  downloadBuffer(buffer, filename);
  return { rows: rawRows.length, filename };
}

export function getCurrentMonthRange(): { start: Date; end: Date } {
  const now = new Date();
  return {
    start: new Date(now.getFullYear(), now.getMonth(), 1),
    end:   new Date(now.getFullYear(), now.getMonth() + 1, 0),
  };
}
