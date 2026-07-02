import type { BorderStyle, Cell, CellFormulaValue, Workbook, Worksheet } from 'exceljs';
import { supabase } from '../services/supabaseClient';
import { buildAquisicaoCrmMonthlyReportWorkbook } from './crmAquisicaoMonthlyReportExport';

type RawActivity = Record<string, any>;
type Metrics = {
  entregues: number;
  emitidos: number;
  aprovados: number;
  propostas: number;
  linhas_origem?: number;
};

type AuditRow = {
  motivo: string;
  bu: string;
  parceiro: string;
  segmento: string;
  etapa: string;
  canal_raw: string;
  canal: string;
} & Metrics & { linhas: number };

type JourneyRow = {
  status_mapeamento: string;
  secao: string;
  bloco: string;
  bu: string;
  parceiro: string;
  segmento: string;
  etapa: string;
  canal: string;
  jornada: string;
  taxonomia: string;
} & Metrics & { linhas: number };

type BuildIndexesResult = {
  idx: Map<string, Metrics>;
  auditRows: AuditRow[];
  journeyRows: JourneyRow[];
  summary: {
    source_rows: number;
    mapped_source_rows: number;
    audit_source_rows: number;
  };
};

type B2cDailyMetric = {
  data?: string | null;
  tipo?: string | null;
  propostas_total?: number | string | null;
  emissoes_total?: number | string | null;
};

type B2cRealized = {
  propostas_total: number;
  emissoes_total: number;
  propostas_serasa: number;
  emissoes_serasa: number;
};

type CampaignWeek = {
  weekStart: string;
  metrics: Metrics;
  linhas: number;
};

type CampaignOverviewRow = {
  status: 'Escalar' | 'Corrigir' | 'Monitorar' | 'Investigar';
  score: number;
  confidence: number;
  deltaEntreguesPct: number | null;
  deltaEmitidosPct: number | null;
  deltaEfPct: number | null;
  baselineWeeks: number;
  secao: string;
  bloco: string;
  bu: string;
  parceiro: string;
  segmento: string;
  etapa: string;
  canal: string;
  jornada: string;
  taxonomia: string;
  current: Metrics & { linhas: number };
  baseline: Metrics & { linhas: number };
};

type DimensionOverviewRow = {
  dimensao: string;
  valor: string;
  status: CampaignOverviewRow['status'];
  scoreMedio: number;
  campanhas: number;
  entregues: number;
  emitidos: number;
  propostas: number;
  deltaEntreguesPct: number | null;
  deltaEmitidosPct: number | null;
};

const SECTIONS: Array<[string, string[]]> = [
  ['B2C', ['TOPO DE FUNIL B2C', 'REPESCAGEM B2C', 'UPGRADE B2C', 'LEADS PARCEIROS B2C', 'CARRINHO ABANDONADO B2C']],
  ['PLURIX', ['TOPO DE FUNIL PLURIX', 'REPESCAGEM PLURIX', 'UPGRADE PLURIX', 'RECENCIA PLURIX', 'CARRINHO ABANDONADO PLURIX']],
  ['DIA', ['TOPO DE FUNIL DIA', 'REPESCAGEM DIA']],
  ['BEM BARATO', ['TOPO DE FUNIL BB', 'REPESCAGEM BB']],
];

const CHANNEL_ORDER: Record<string, number> = { 'E-MAIL': 0, SMS: 1, WPP: 2 };
const NUMERIC_FIELDS: Array<keyof Metrics> = ['entregues', 'emitidos', 'aprovados', 'propostas'];
const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

const COLORS = {
  headerGray: 'D9D9D9',
  sectionDark: '17365D',
  dataB2c: '1F4E79',
  dataB2cSub: '2F5496',
  topoB2c: '1F6B3A',
  topo: '1F4E79',
  repescagem: '2E7D32',
  upgrade: 'B8860B',
  leads: '00695C',
  recencia: '6A1B9A',
  emailFill: 'DCE6F1',
  emailFont: '1F4E79',
  wppFill: 'E2EFDA',
  wppFont: '375623',
  smsFill: 'FFF2CC',
  smsFont: '7F6000',
  zebra: 'F5F5F5',
  weekend: 'E8E8E8',
  manualB2c: 'EBF3FF',
  manualB2cRepeat: 'B4C7E7',
  currentPeriod: 'E2F0F9',
  total: 'D9EAD3',
  auditHeader: '1F4E79',
  auditSubheader: 'D9EAF7',
};

const get = (row: RawActivity, key: string): any => row[key];
const text = (value: any): string => String(value ?? '');

function isoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseIsoDate(value: string): Date {
  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  return new Date(year, month - 1, day);
}

function parseRowDate(value: any): Date {
  if (!value) throw new Error('missing Data de Disparo');
  return parseIsoDate(String(value).split('T')[0].slice(0, 10));
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfWeek(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  const diff = (next.getDay() + 6) % 7;
  next.setDate(next.getDate() - diff);
  return next;
}

function pctDelta(current: number, baseline: number): number | null {
  if (!baseline) return current ? null : 0;
  return (current - baseline) / baseline;
}

function safeRate(numerator: number, denominator: number): number {
  if (!denominator) return 0;
  return numerator / denominator;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function emptyMetrics(): Metrics & { linhas: number } {
  return { entregues: 0, emitidos: 0, aprovados: 0, propostas: 0, linhas: 0 };
}

function addMetrics(target: Metrics & { linhas: number }, source: Metrics, linhas = 0): void {
  NUMERIC_FIELDS.forEach((field) => { target[field] += source[field]; });
  target.linhas += linhas;
}

function allDates(start: Date, end: Date): Date[] {
  const dates: Date[] = [];
  for (let date = new Date(start); date <= end; date = addDays(date, 1)) {
    dates.push(new Date(date));
  }
  return dates;
}

function averageMetrics(total: Metrics & { linhas: number }, divisor: number): Metrics & { linhas: number } {
  if (!divisor) return emptyMetrics();
  return {
    entregues: total.entregues / divisor,
    emitidos: total.emitidos / divisor,
    aprovados: total.aprovados / divisor,
    propostas: total.propostas / divisor,
    linhas: total.linhas / divisor,
  };
}

function metricHealthScore(current: number, baseline: number): number {
  if (!baseline) return current > 0 ? 75 : 35;
  return clamp((current / baseline) * 100, 0, 140);
}

function formatPercentValue(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return 'N/A';
  return `${Math.round(value * 100)}%`;
}

function formatRatioValue(value: number): string {
  if (!Number.isFinite(value)) return '0.00%';
  return `${(value * 100).toFixed(2)}%`;
}

function asInt(value: any): number {
  if (value === null || value === undefined || value === '') return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : 0;
}

function normalizeChannel(value: any): string {
  const raw = String(value ?? '').toUpperCase();
  if (raw.includes('MAIL')) return 'E-MAIL';
  if (raw.includes('WHATSAPP') || raw === 'WPP') return 'WPP';
  if (raw.includes('SMS')) return 'SMS';
  return raw.trim() || 'N/A';
}

function classify(row: RawActivity): [string, string] | null {
  const bu = get(row, 'BU');
  const parceiro = get(row, 'Parceiro');
  const segmento = get(row, 'Segmento');
  const etapa = get(row, 'Etapa de aquisição') ?? get(row, 'Etapa de aquisiÃ§Ã£o');

  if (segmento === 'Leads_Parceiros') return ['B2C', 'LEADS PARCEIROS B2C'];
  if (bu === 'B2C' && parceiro === 'Serasa' && segmento === 'Base_Proprietaria' && etapa === 'Meio_de_Funil') return ['B2C', 'LEADS PARCEIROS B2C'];
  if (bu === 'B2C' && parceiro === 'Proprietaria' && segmento === 'Base_Proprietaria' && etapa === 'Aquisicao') return ['B2C', 'TOPO DE FUNIL B2C'];
  if (bu === 'B2C' && parceiro === 'Proprietaria' && segmento === 'Negados' && etapa === 'Meio_de_Funil') return ['B2C', 'REPESCAGEM B2C'];
  if (bu === 'B2C' && parceiro === 'Proprietaria' && segmento === 'Aprovados_nao_convertidos' && etapa === 'Meio_de_Funil') return ['B2C', 'UPGRADE B2C'];
  if (bu === 'B2C' && ['N/A', 'Serasa'].includes(parceiro) && segmento === 'Abandonados') return ['B2C', 'CARRINHO ABANDONADO B2C'];

  if (bu === 'Plurix' && parceiro === 'N/A' && segmento === 'CRM' && etapa === 'Aquisicao') return ['PLURIX', 'TOPO DE FUNIL PLURIX'];
  if (bu === 'Plurix' && parceiro === 'N/A' && segmento === 'Negados' && etapa === 'Meio_de_Funil') return ['PLURIX', 'REPESCAGEM PLURIX'];
  if (bu === 'Plurix' && parceiro === 'N/A' && segmento === 'Aprovados_nao_convertidos' && etapa === 'Meio_de_Funil') return ['PLURIX', 'UPGRADE PLURIX'];
  if (bu === 'Plurix' && parceiro === 'N/A' && segmento === 'Abandonados') return ['PLURIX', 'CARRINHO ABANDONADO PLURIX'];
  if (bu === 'Plurix' && parceiro === 'N/A' && segmento === 'Recencia de Compra') return ['PLURIX', 'RECENCIA PLURIX'];

  if (bu === 'B2B2C' && parceiro === 'Dia' && etapa === 'Aquisicao') return ['DIA', 'TOPO DE FUNIL DIA'];
  if (bu === 'B2B2C' && parceiro === 'Dia' && etapa === 'Meio_de_Funil') return ['DIA', 'REPESCAGEM DIA'];

  if (bu === 'B2B2C' && parceiro === 'Bem Barato' && ['CRM', 'Recencia de Compra'].includes(segmento) && etapa === 'Aquisicao') return ['BEM BARATO', 'TOPO DE FUNIL BB'];
  if (bu === 'B2B2C' && parceiro === 'Bem Barato' && ['Negados', 'Aprovados_nao_convertidos'].includes(segmento) && etapa === 'Meio_de_Funil') return ['BEM BARATO', 'REPESCAGEM BB'];

  return null;
}

function auditReason(row: RawActivity): string {
  if (get(row, 'BU') === 'Seguros') return 'Fora do escopo: Seguros/Rentabilizacao';
  if (get(row, 'Segmento') === 'Abandonados') return 'Sem bloco definido: Abandonados';
  return 'Sem regra de mapeamento';
}

function idxKey(date: string, secao: string, bloco: string, canal: string): string {
  return [date, secao, bloco, canal].join('\u001F');
}

function buildIndexes(rows: RawActivity[], start: Date, end: Date): BuildIndexesResult {
  const idx = new Map<string, Metrics>();
  const audit = new Map<string, AuditRow>();
  const journeyMap = new Map<string, JourneyRow>();
  const summary = { source_rows: 0, mapped_source_rows: 0, audit_source_rows: 0 };

  for (const row of rows) {
    const rowDate = parseRowDate(get(row, 'Data de Disparo'));
    if (rowDate < start || rowDate > end) continue;
    summary.source_rows += 1;

    const canal = normalizeChannel(get(row, 'Canal'));
    const metrics: Metrics = {
      entregues: asInt(get(row, 'Base Acionável') ?? get(row, 'Base AcionÃ¡vel')),
      emitidos: asInt(get(row, 'Cartões Gerados') ?? get(row, 'CartÃµes Gerados')),
      aprovados: asInt(get(row, 'Aprovados')),
      propostas: asInt(get(row, 'Propostas')),
    };
    const mapped = classify(row);
    const destino = mapped ? 'MAPEADO' : auditReason(row);
    const secao = mapped?.[0] ?? '';
    const bloco = mapped?.[1] ?? '';
    const etapa = text(get(row, 'Etapa de aquisição') ?? get(row, 'Etapa de aquisiÃ§Ã£o'));
    const journeyKey = [
      destino,
      secao,
      bloco,
      text(get(row, 'BU')),
      text(get(row, 'Parceiro')),
      text(get(row, 'Segmento')),
      etapa,
      canal,
      text(get(row, 'jornada') ?? get(row, 'Jornada')),
      text(get(row, 'Activity name / Taxonomia')),
    ].join('\u001F');

    if (!journeyMap.has(journeyKey)) {
      journeyMap.set(journeyKey, {
        status_mapeamento: destino,
        secao,
        bloco,
        bu: text(get(row, 'BU')),
        parceiro: text(get(row, 'Parceiro')),
        segmento: text(get(row, 'Segmento')),
        etapa,
        canal,
        jornada: text(get(row, 'jornada') ?? get(row, 'Jornada')),
        taxonomia: text(get(row, 'Activity name / Taxonomia')),
        linhas: 0,
        entregues: 0,
        emitidos: 0,
        aprovados: 0,
        propostas: 0,
      });
    }
    const journey = journeyMap.get(journeyKey)!;
    journey.linhas += 1;
    NUMERIC_FIELDS.forEach((field) => { journey[field] += metrics[field]; });

    if (mapped) {
      const key = idxKey(isoDate(rowDate), secao, bloco, canal);
      const current = idx.get(key) ?? { entregues: 0, emitidos: 0, aprovados: 0, propostas: 0, linhas_origem: 0 };
      NUMERIC_FIELDS.forEach((field) => { current[field] += metrics[field]; });
      current.linhas_origem = (current.linhas_origem ?? 0) + 1;
      idx.set(key, current);
      summary.mapped_source_rows += 1;
    } else {
      const auditKey = [
        auditReason(row),
        text(get(row, 'BU')),
        text(get(row, 'Parceiro')),
        text(get(row, 'Segmento')),
        etapa,
        text(get(row, 'Canal')),
        canal,
      ].join('\u001F');
      if (!audit.has(auditKey)) {
        audit.set(auditKey, {
          motivo: auditReason(row),
          bu: text(get(row, 'BU')),
          parceiro: text(get(row, 'Parceiro')),
          segmento: text(get(row, 'Segmento')),
          etapa,
          canal_raw: text(get(row, 'Canal')),
          canal,
          linhas: 0,
          entregues: 0,
          emitidos: 0,
          aprovados: 0,
          propostas: 0,
        });
      }
      const auditRow = audit.get(auditKey)!;
      auditRow.linhas += 1;
      NUMERIC_FIELDS.forEach((field) => { auditRow[field] += metrics[field]; });
      summary.audit_source_rows += 1;
    }
  }

  return {
    idx,
    auditRows: [...audit.values()].sort((a, b) => [a.motivo, a.bu, a.parceiro, a.segmento, a.etapa, a.canal].join('|').localeCompare([b.motivo, b.bu, b.parceiro, b.segmento, b.etapa, b.canal].join('|'))),
    journeyRows: [...journeyMap.values()].sort((a, b) => [a.status_mapeamento, a.secao, a.bloco, a.bu, a.parceiro, a.segmento, a.etapa, a.canal, a.jornada, a.taxonomia].join('|').localeCompare([b.status_mapeamento, b.secao, b.bloco, b.bu, b.parceiro, b.segmento, b.etapa, b.canal, b.jornada, b.taxonomia].join('|'))),
    summary,
  };
}

function buildB2cRealizedIndex(rows: B2cDailyMetric[], start: Date, end: Date): Map<string, B2cRealized> {
  const realized = new Map<string, B2cRealized>();
  const ensure = (ds: string): B2cRealized => {
    const current = realized.get(ds) ?? {
      propostas_total: 0,
      emissoes_total: 0,
      propostas_serasa: 0,
      emissoes_serasa: 0,
    };
    realized.set(ds, current);
    return current;
  };

  rows.forEach((row) => {
    if (!row.data) return;
    const rowDate = parseIsoDate(String(row.data).slice(0, 10));
    if (rowDate < start || rowDate > end) return;

    const ds = isoDate(rowDate);
    const tipo = String(row.tipo ?? '').trim().toLowerCase();
    const current = ensure(ds);
    if (tipo === 'total') {
      current.propostas_total += asInt(row.propostas_total);
      current.emissoes_total += asInt(row.emissoes_total);
    } else if (tipo.includes('serasa')) {
      current.propostas_serasa += asInt(row.propostas_total);
      current.emissoes_serasa += asInt(row.emissoes_total);
    }
  });

  return realized;
}

function buildCampaignOverviewRows(rows: RawActivity[], focusWeekStart: Date): CampaignOverviewRow[] {
  const focusWeek = isoDate(focusWeekStart);
  const baselineWeekStarts = Array.from({ length: 4 }, (_value, index) => isoDate(addDays(focusWeekStart, -7 * (index + 1))));
  const acceptedWeeks = new Set([focusWeek, ...baselineWeekStarts]);
  const campaignWeeks = new Map<string, {
    secao: string;
    bloco: string;
    bu: string;
    parceiro: string;
    segmento: string;
    etapa: string;
    canal: string;
    jornada: string;
    taxonomia: string;
    weeks: Map<string, CampaignWeek>;
  }>();

  rows.forEach((row) => {
    const mapped = classify(row);
    if (!mapped) return;

    const rowDate = parseRowDate(get(row, 'Data de Disparo'));
    const week = isoDate(startOfWeek(rowDate));
    if (!acceptedWeeks.has(week)) return;

    const canal = normalizeChannel(get(row, 'Canal'));
    const metrics: Metrics = {
      entregues: asInt(get(row, 'Base AcionÃ¡vel') ?? get(row, 'Base AcionÃƒÂ¡vel')),
      emitidos: asInt(get(row, 'CartÃµes Gerados') ?? get(row, 'CartÃƒÂµes Gerados')),
      aprovados: asInt(get(row, 'Aprovados')),
      propostas: asInt(get(row, 'Propostas')),
    };
    const etapa = text(get(row, 'Etapa de aquisiÃ§Ã£o') ?? get(row, 'Etapa de aquisiÃƒÂ§ÃƒÂ£o')) || 'N/A';
    const descriptor = {
      secao: mapped[0],
      bloco: mapped[1],
      bu: text(get(row, 'BU')) || 'N/A',
      parceiro: text(get(row, 'Parceiro')) || 'N/A',
      segmento: text(get(row, 'Segmento')) || 'N/A',
      etapa,
      canal,
      jornada: text(get(row, 'jornada') ?? get(row, 'Jornada')) || 'N/A',
      taxonomia: text(get(row, 'Activity name / Taxonomia')) || 'N/A',
    };
    const key = [
      descriptor.secao,
      descriptor.bloco,
      descriptor.bu,
      descriptor.parceiro,
      descriptor.segmento,
      descriptor.etapa,
      descriptor.canal,
      descriptor.jornada,
      descriptor.taxonomia,
    ].join('\u001F');

    if (!campaignWeeks.has(key)) {
      campaignWeeks.set(key, { ...descriptor, weeks: new Map() });
    }
    const campaign = campaignWeeks.get(key)!;
    const currentWeek = campaign.weeks.get(week) ?? { weekStart: week, metrics: { entregues: 0, emitidos: 0, aprovados: 0, propostas: 0 }, linhas: 0 };
    NUMERIC_FIELDS.forEach((field) => { currentWeek.metrics[field] += metrics[field]; });
    currentWeek.linhas += 1;
    campaign.weeks.set(week, currentWeek);
  });

  const rowsOut: CampaignOverviewRow[] = [];
  campaignWeeks.forEach((campaign) => {
    const currentWeek = campaign.weeks.get(focusWeek);
    const current = emptyMetrics();
    if (currentWeek) addMetrics(current, currentWeek.metrics, currentWeek.linhas);

    const baselineTotal = emptyMetrics();
    let baselineWeeks = 0;
    baselineWeekStarts.forEach((week) => {
      const item = campaign.weeks.get(week);
      if (!item) return;
      baselineWeeks += 1;
      addMetrics(baselineTotal, item.metrics, item.linhas);
    });
    if (!current.linhas && !baselineWeeks) return;

    const baseline = averageMetrics(baselineTotal, baselineWeeks);
    const currentConversion = safeRate(current.emitidos || current.propostas, current.entregues);
    const baselineConversion = safeRate(baseline.emitidos || baseline.propostas, baseline.entregues);
    const deltaEntreguesPct = pctDelta(current.entregues, baseline.entregues);
    const deltaEmitidosPct = pctDelta(current.emitidos, baseline.emitidos);
    const deltaEfPct = pctDelta(currentConversion, baselineConversion);

    const entregaScore = metricHealthScore(current.entregues, baseline.entregues);
    const resultadoScore = current.emitidos
      ? metricHealthScore(current.emitidos, baseline.emitidos)
      : metricHealthScore(current.propostas, baseline.propostas);
    const eficienciaScore = baselineConversion ? clamp((currentConversion / baselineConversion) * 100, 0, 140) : currentConversion > 0 ? 75 : 35;
    const confidence = clamp(
      55 + (baselineWeeks * 8) + (current.linhas > 0 ? 10 : 0) + (current.entregues > 0 ? 7 : -15),
      20,
      98,
    );
    const score = Math.round((entregaScore * 0.35) + (resultadoScore * 0.35) + (eficienciaScore * 0.20) + (confidence * 0.10));

    let status: CampaignOverviewRow['status'] = 'Monitorar';
    if (!current.linhas || (current.entregues === 0 && baseline.entregues > 0)) {
      status = 'Investigar';
    } else if (baselineWeeks < 2) {
      status = 'Monitorar';
    } else if (score >= 85 && current.entregues >= baseline.entregues * 0.9 && currentConversion >= baselineConversion) {
      status = 'Escalar';
    } else if (
      current.entregues >= baseline.entregues * 0.85
      && (currentConversion < baselineConversion * 0.85 || current.emitidos < baseline.emitidos * 0.75)
    ) {
      status = 'Corrigir';
    } else if (score < 55 || confidence < 65) {
      status = 'Investigar';
    }

    rowsOut.push({
      status,
      score,
      confidence: Math.round(confidence),
      deltaEntreguesPct,
      deltaEmitidosPct,
      deltaEfPct,
      baselineWeeks,
      secao: campaign.secao,
      bloco: campaign.bloco,
      bu: campaign.bu,
      parceiro: campaign.parceiro,
      segmento: campaign.segmento,
      etapa: campaign.etapa,
      canal: campaign.canal,
      jornada: campaign.jornada,
      taxonomia: campaign.taxonomia,
      current,
      baseline,
    });
  });

  const statusOrder: Record<CampaignOverviewRow['status'], number> = { Escalar: 0, Corrigir: 1, Investigar: 2, Monitorar: 3 };
  return rowsOut.sort((a, b) => statusOrder[a.status] - statusOrder[b.status] || b.score - a.score || b.current.entregues - a.current.entregues);
}

function aggregateDimensionRows(rows: CampaignOverviewRow[]): DimensionOverviewRow[] {
  const dimensions: Array<[string, (row: CampaignOverviewRow) => string]> = [
    ['BU', (row) => row.bu],
    ['Bloco', (row) => row.bloco],
    ['Canal', (row) => row.canal],
    ['Segmento', (row) => row.segmento],
  ];
  const out: DimensionOverviewRow[] = [];

  dimensions.forEach(([dimensao, getter]) => {
    const map = new Map<string, CampaignOverviewRow[]>();
    rows.forEach((row) => {
      const value = getter(row) || 'N/A';
      map.set(value, [...(map.get(value) ?? []), row]);
    });
    map.forEach((items, valor) => {
      const current = emptyMetrics();
      const baseline = emptyMetrics();
      items.forEach((item) => {
        addMetrics(current, item.current, item.current.linhas);
        addMetrics(baseline, item.baseline, item.baseline.linhas);
      });
      const worstStatus = items.some((item) => item.status === 'Investigar') ? 'Investigar'
        : items.some((item) => item.status === 'Corrigir') ? 'Corrigir'
          : items.some((item) => item.status === 'Escalar') ? 'Escalar'
            : 'Monitorar';
      out.push({
        dimensao,
        valor,
        status: worstStatus,
        scoreMedio: Math.round(items.reduce((sum, item) => sum + item.score, 0) / items.length),
        campanhas: items.length,
        entregues: current.entregues,
        emitidos: current.emitidos,
        propostas: current.propostas,
        deltaEntreguesPct: pctDelta(current.entregues, baseline.entregues),
        deltaEmitidosPct: pctDelta(current.emitidos, baseline.emitidos),
      });
    });
  });

  return out.sort((a, b) => a.dimensao.localeCompare(b.dimensao) || b.entregues - a.entregues);
}

function buildWeeklyTrendRows(rows: RawActivity[], focusWeekStart: Date): Array<{ semana: string; label: string } & Metrics & { campanhas: number }> {
  const weekStarts = Array.from({ length: 5 }, (_value, index) => addDays(focusWeekStart, -7 * (4 - index)));
  const acceptedWeeks = new Set(weekStarts.map(isoDate));
  const trend = new Map<string, Metrics & { campanhas: Set<string> }>();

  weekStarts.forEach((week) => {
    trend.set(isoDate(week), { entregues: 0, emitidos: 0, aprovados: 0, propostas: 0, campanhas: new Set() });
  });

  rows.forEach((row) => {
    const mapped = classify(row);
    if (!mapped) return;
    const rowDate = parseRowDate(get(row, 'Data de Disparo'));
    const week = isoDate(startOfWeek(rowDate));
    if (!acceptedWeeks.has(week)) return;

    const metrics: Metrics = {
      entregues: asInt(get(row, 'Base AcionÃ¡vel') ?? get(row, 'Base AcionÃƒÂ¡vel')),
      emitidos: asInt(get(row, 'CartÃµes Gerados') ?? get(row, 'CartÃƒÂµes Gerados')),
      aprovados: asInt(get(row, 'Aprovados')),
      propostas: asInt(get(row, 'Propostas')),
    };
    const current = trend.get(week)!;
    NUMERIC_FIELDS.forEach((field) => { current[field] += metrics[field]; });
    current.campanhas.add([
      text(get(row, 'jornada') ?? get(row, 'Jornada')),
      normalizeChannel(get(row, 'Canal')),
      text(get(row, 'Activity name / Taxonomia')),
    ].join('\u001F'));
  });

  return weekStarts.map((week) => {
    const ds = isoDate(week);
    const values = trend.get(ds)!;
    return {
      semana: ds,
      label: `${week.toLocaleDateString('pt-BR')} - ${addDays(week, 6).toLocaleDateString('pt-BR')}`,
      entregues: values.entregues,
      emitidos: values.emitidos,
      aprovados: values.aprovados,
      propostas: values.propostas,
      campanhas: values.campanhas.size,
    };
  });
}

function findFocusWeekStart(rows: RawActivity[], start: Date, end: Date): Date {
  let latestMappedDate: Date | null = null;
  rows.forEach((row) => {
    if (!classify(row)) return;
    const rowDate = parseRowDate(get(row, 'Data de Disparo'));
    if (rowDate < start || rowDate > end) return;
    if (!latestMappedDate || rowDate > latestMappedDate) latestMappedDate = rowDate;
  });
  return startOfWeek(latestMappedDate ?? end);
}

function getBaselineQueryStart(start: Date): Date {
  return addDays(startOfWeek(start), -28);
}

function statusColor(status: CampaignOverviewRow['status']): string {
  if (status === 'Escalar') return 'D9EAD3';
  if (status === 'Corrigir') return 'FCE4D6';
  if (status === 'Investigar') return 'FFF2CC';
  return 'D9EAF7';
}

function writeTableHeader(ws: Worksheet, row: number, labels: string[], fillColor = COLORS.auditHeader): void {
  labels.forEach((label, offset) => {
    setCell(ws.getCell(row, offset + 1), label, { bold: true, fontColor: 'FFFFFF', fillColor, align: offset === 0 ? 'left' : 'center' });
  });
}

function blockColor(section: string, block: string): string {
  if (block.startsWith('TOPO')) return section === 'B2C' ? COLORS.topoB2c : COLORS.topo;
  if (block.startsWith('REPESCAGEM')) return COLORS.repescagem;
  if (block.startsWith('UPGRADE')) return COLORS.upgrade;
  if (block.startsWith('LEADS')) return COLORS.leads;
  if (block.startsWith('CARRINHO')) return COLORS.leads;
  if (block.startsWith('RECENCIA')) return COLORS.recencia;
  return COLORS.sectionDark;
}

function channelStyle(canal: string): [string, string] {
  if (canal === 'E-MAIL') return [COLORS.emailFill, COLORS.emailFont];
  if (canal === 'WPP') return [COLORS.wppFill, COLORS.wppFont];
  if (canal === 'SMS') return [COLORS.smsFill, COLORS.smsFont];
  return ['FFFFFF', '000000'];
}

function setCell(
  cell: Cell,
  value?: string | number | CellFormulaValue,
  options: { bold?: boolean; italic?: boolean; fontColor?: string; fillColor?: string; align?: 'left' | 'center' | 'right' } = {},
): void {
  if (value !== undefined) cell.value = value;
  cell.font = { name: 'Calibri', size: 10, bold: options.bold, italic: options.italic, color: { argb: `FF${options.fontColor ?? '000000'}` } };
  if (options.fillColor) {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${options.fillColor}` } };
  }
  cell.alignment = { horizontal: options.align ?? 'center', vertical: 'middle', wrapText: true };
}

function applyBorder(ws: Worksheet, row: number, maxCol: number, topStyle: BorderStyle = 'thin', verticalBoundaries: number[] = []): void {
  for (let col = 1; col <= maxCol; col += 1) {
    ws.getCell(row, col).border = {
      top: { style: topStyle, color: { argb: 'FFBFBFBF' } },
      bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
      left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
      right: { style: verticalBoundaries.includes(col) ? 'medium' : 'thin', color: { argb: verticalBoundaries.includes(col) ? 'FF000000' : 'FFE0E0E0' } },
    };
  }
}

function applyB2cRepeatFill(ws: Worksheet, row: number): void {
  for (let col = 3; col <= 6; col += 1) {
    const cell = ws.getCell(row, col);
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${COLORS.manualB2cRepeat}` } };
    cell.border = {
      top: { style: undefined },
      bottom: { style: undefined },
      left: { style: undefined },
      right: col === 6 ? { style: 'medium', color: { argb: 'FF000000' } } : { style: undefined },
    };
  }
}

function colLetter(col: number): string {
  let n = col;
  let s = '';
  while (n > 0) {
    const mod = (n - 1) % 26;
    s = String.fromCharCode(65 + mod) + s;
    n = Math.floor((n - mod) / 26);
  }
  return s;
}

function writeSection(
  ws: Worksheet,
  startRow: number,
  section: string,
  blocks: string[],
  idx: Map<string, Metrics>,
  dates: Date[],
  b2cRealizedIdx: Map<string, B2cRealized>,
): number {
  setCell(ws.getCell(startRow, 1), 'Data', { bold: true, fillColor: COLORS.headerGray });
  setCell(ws.getCell(startRow, 2), 'Dia', { bold: true, fillColor: COLORS.headerGray });
  setCell(ws.getCell(startRow + 1, 1), '', { fillColor: COLORS.headerGray });
  setCell(ws.getCell(startRow + 1, 2), '', { fillColor: COLORS.headerGray });

  let col = 3;
  const numericCols: number[] = [];
  const verticalBoundaries = [2];
  const mergedHeaderStarts: number[] = [];

  if (section === 'B2C') {
    ws.mergeCells(startRow, col, startRow, col + 3);
    setCell(ws.getCell(startRow, col), 'DADOS REALIZADOS B2C', { bold: true, fontColor: 'FFFFFF', fillColor: COLORS.dataB2c });
    mergedHeaderStarts.push(col);
    ['Propostas', 'Cartões Emitidos', 'Propostas Serasa', 'Cartões Serasa'].forEach((label, offset) => {
      setCell(ws.getCell(startRow + 1, col + offset), label, { bold: true, fontColor: 'FFFFFF', fillColor: COLORS.dataB2cSub });
    });
    verticalBoundaries.push(col + 3);
    col += 4;
  }

  const blockPositions = new Map<string, number>();
  blocks.forEach((block) => {
    blockPositions.set(block, col);
    ws.mergeCells(startRow, col, startRow, col + 4);
    mergedHeaderStarts.push(col);
    const color = blockColor(section, block);
    setCell(ws.getCell(startRow, col), block, { bold: true, fontColor: 'FFFFFF', fillColor: color });
    ['Canal', 'Entregues', 'Emitidos', 'Aprovados', 'Proposta'].forEach((label, offset) => {
      setCell(ws.getCell(startRow + 1, col + offset), label, { bold: true, fontColor: 'FFFFFF', fillColor: color });
    });
    numericCols.push(col + 1, col + 2, col + 3, col + 4);
    verticalBoundaries.push(col + 4);
    col += 5;
  });

  const maxCol = col - 1;
  applyBorder(ws, startRow, maxCol, 'medium', verticalBoundaries);
  applyBorder(ws, startRow + 1, maxCol, 'thin', verticalBoundaries);
  mergedHeaderStarts.forEach((headerCol) => {
    ws.getCell(startRow, headerCol).border = {
      ...ws.getCell(startRow, headerCol).border,
      right: { style: 'medium', color: { argb: 'FF000000' } },
    };
  });

  const dataStart = startRow + 2;
  let rowNum = dataStart;

  dates.forEach((day, i) => {
    const ds = isoDate(day);
    const canais = new Set<string>();
    blocks.forEach((block) => {
      idx.forEach((_value, key) => {
        const [rd, secao, rb, canal] = key.split('\u001F');
        if (rd === ds && secao === section && rb === block) canais.add(canal);
      });
    });
    const rowsToWrite = [...canais].sort((a, b) => (CHANNEL_ORDER[a] ?? 99) - (CHANNEL_ORDER[b] ?? 99) || a.localeCompare(b));
    if (rowsToWrite.length === 0) rowsToWrite.push('');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isCurrentOrFutureMonthDay = day >= today && day.getMonth() === today.getMonth() && day.getFullYear() === today.getFullYear();
    const zebra = isCurrentOrFutureMonthDay ? COLORS.currentPeriod : i % 2 ? COLORS.zebra : 'FFFFFF';

    rowsToWrite.forEach((canal, channelIndex) => {
      for (let c = 1; c <= maxCol; c += 1) setCell(ws.getCell(rowNum, c), '', { fillColor: zebra });

      const dateFill = day.getDay() === 0 || day.getDay() === 6 ? COLORS.weekend : zebra;
      setCell(ws.getCell(rowNum, 1), day.toLocaleDateString('pt-BR'), { italic: day.getDay() === 0 || day.getDay() === 6, fillColor: dateFill });
      setCell(ws.getCell(rowNum, 2), DAY_NAMES[day.getDay()], { italic: day.getDay() === 0 || day.getDay() === 6, fillColor: dateFill });

      if (section === 'B2C') {
        for (let c = 3; c <= 6; c += 1) {
          setCell(ws.getCell(rowNum, c), '', { fillColor: channelIndex === 0 ? COLORS.manualB2c : COLORS.manualB2cRepeat });
        }
        if (channelIndex === 0) {
          const realized = b2cRealizedIdx.get(ds);
          if (realized) {
            [
              realized.propostas_total,
              realized.emissoes_total,
              realized.propostas_serasa,
              realized.emissoes_serasa,
            ].forEach((value, offset) => {
              if (value) setCell(ws.getCell(rowNum, 3 + offset), value, { fillColor: COLORS.manualB2c });
            });
          }
        }
      }

      if (canal) {
        blocks.forEach((block) => {
          const values = idx.get(idxKey(ds, section, block, canal));
          if (!values || !NUMERIC_FIELDS.some((field) => values[field] > 0)) return;
          const startCol = blockPositions.get(block)!;
          const [fillColor, fontColor] = channelStyle(canal);
          setCell(ws.getCell(rowNum, startCol), canal, { bold: true, fontColor, fillColor });
          NUMERIC_FIELDS.forEach((field, offset) => {
            setCell(ws.getCell(rowNum, startCol + offset + 1), values[field], { fontColor, fillColor });
          });
        });
      }

      applyBorder(ws, rowNum, maxCol, channelIndex === 0 ? 'medium' : 'thin', verticalBoundaries);
      if (section === 'B2C' && channelIndex > 0) applyB2cRepeatFill(ws, rowNum);
      rowNum += 1;
    });
  });

  const totalRow = rowNum;
  for (let c = 1; c <= maxCol; c += 1) setCell(ws.getCell(totalRow, c), '', { bold: true, fillColor: COLORS.total });
  setCell(ws.getCell(totalRow, 1), 'total', { bold: true, fillColor: COLORS.total });
  numericCols.forEach((numCol) => {
    const letter = colLetter(numCol);
    setCell(ws.getCell(totalRow, numCol), { formula: `SUM(${letter}${dataStart}:${letter}${totalRow - 1})` }, { bold: true, fillColor: COLORS.total });
  });
  applyBorder(ws, totalRow, maxCol, 'medium', verticalBoundaries);
  return totalRow + 3;
}

function writeAuditSheet(wb: Workbook, auditRows: AuditRow[], journeyRows: JourneyRow[], summary: BuildIndexesResult['summary']): void {
  const ws = wb.addWorksheet('Auditoria', {
    views: [{ state: 'frozen', ySplit: 8, showGridLines: false }],
  });

  setCell(ws.getCell('A1'), 'Auditoria de mapeamento', { bold: true, fontColor: 'FFFFFF', fillColor: COLORS.auditHeader, align: 'left' });
  ws.mergeCells('A1:K1');

  [
    ['Linhas fonte no período', summary.source_rows],
    ['Linhas mapeadas no relatório', summary.mapped_source_rows],
    ['Linhas fora do relatório', summary.audit_source_rows],
  ].forEach(([label, value], index) => {
    const row = index + 3;
    setCell(ws.getCell(row, 1), String(label), { bold: true, fillColor: COLORS.auditSubheader, align: 'left' });
    setCell(ws.getCell(row, 2), Number(value), { fillColor: COLORS.auditSubheader });
  });

  const reasonTotals = new Map<string, Metrics & { linhas: number }>();
  auditRows.forEach((row) => {
    const current = reasonTotals.get(row.motivo) ?? { linhas: 0, entregues: 0, emitidos: 0, aprovados: 0, propostas: 0 };
    current.linhas += row.linhas;
    NUMERIC_FIELDS.forEach((field) => { current[field] += row[field]; });
    reasonTotals.set(row.motivo, current);
  });

  ['Motivo', 'Linhas', 'Entregues', 'Emitidos', 'Aprovados', 'Propostas'].forEach((label, offset) => {
    setCell(ws.getCell(3, 4 + offset), label, { bold: true, fontColor: 'FFFFFF', fillColor: COLORS.auditHeader });
  });
  let reasonRow = 4;
  [...reasonTotals.entries()].sort(([a], [b]) => a.localeCompare(b)).forEach(([reason, totals]) => {
    setCell(ws.getCell(reasonRow, 4), reason, { align: 'left' });
    ['linhas', ...NUMERIC_FIELDS].forEach((field, offset) => {
      setCell(ws.getCell(reasonRow, 5 + offset), totals[field as keyof typeof totals] as number);
    });
    reasonRow += 1;
  });

  const mappedTotals = new Map<string, Metrics & { linhas: number; secao: string; bloco: string }>();
  journeyRows.filter((row) => row.status_mapeamento === 'MAPEADO').forEach((row) => {
    const key = `${row.secao}\u001F${row.bloco}`;
    const current = mappedTotals.get(key) ?? { secao: row.secao, bloco: row.bloco, linhas: 0, entregues: 0, emitidos: 0, aprovados: 0, propostas: 0 };
    current.linhas += row.linhas;
    NUMERIC_FIELDS.forEach((field) => { current[field] += row[field]; });
    mappedTotals.set(key, current);
  });

  const mappedStart = Math.max(reasonRow + 2, 8);
  setCell(ws.getCell(mappedStart, 1), 'Resumo dos blocos mapeados', { bold: true, fontColor: 'FFFFFF', fillColor: COLORS.auditHeader, align: 'left' });
  ws.mergeCells(mappedStart, 1, mappedStart, 7);
  ['Seção', 'Bloco', 'Linhas', 'Entregues', 'Emitidos', 'Aprovados', 'Propostas'].forEach((label, offset) => {
    setCell(ws.getCell(mappedStart + 1, offset + 1), label, { bold: true, fontColor: 'FFFFFF', fillColor: COLORS.auditHeader });
  });

  let mappedRow = mappedStart + 2;
  [...mappedTotals.values()].sort((a, b) => `${a.secao}|${a.bloco}`.localeCompare(`${b.secao}|${b.bloco}`)).forEach((totals) => {
    setCell(ws.getCell(mappedRow, 1), totals.secao, { align: 'left' });
    setCell(ws.getCell(mappedRow, 2), totals.bloco, { align: 'left' });
    ['linhas', ...NUMERIC_FIELDS].forEach((field, offset) => {
      setCell(ws.getCell(mappedRow, 3 + offset), totals[field as keyof typeof totals] as number);
    });
    mappedRow += 1;
  });

  const detailStart = mappedRow + 2;
  ['Motivo', 'BU', 'Parceiro', 'Segmento', 'Etapa', 'Canal original', 'Canal', 'Linhas', 'Entregues', 'Emitidos', 'Aprovados', 'Propostas'].forEach((label, offset) => {
    setCell(ws.getCell(detailStart, offset + 1), label, { bold: true, fontColor: 'FFFFFF', fillColor: COLORS.auditHeader });
  });
  auditRows.forEach((row, index) => {
    const values = [row.motivo, row.bu, row.parceiro, row.segmento, row.etapa, row.canal_raw, row.canal, row.linhas, row.entregues, row.emitidos, row.aprovados, row.propostas];
    values.forEach((value, offset) => setCell(ws.getCell(detailStart + 1 + index, offset + 1), value, { align: offset <= 5 ? 'left' : 'center' }));
  });

  const journeyStart = detailStart + auditRows.length + 4;
  setCell(ws.getCell(journeyStart, 1), 'Mapa de jornadas e taxonomias por destino', { bold: true, fontColor: 'FFFFFF', fillColor: COLORS.auditHeader, align: 'left' });
  ws.mergeCells(journeyStart, 1, journeyStart, 15);
  ['Status/Motivo', 'Seção', 'Bloco', 'BU', 'Parceiro', 'Segmento', 'Etapa', 'Canal', 'Jornada', 'Activity name / Taxonomia', 'Linhas', 'Entregues', 'Emitidos', 'Aprovados', 'Propostas'].forEach((label, offset) => {
    setCell(ws.getCell(journeyStart + 1, offset + 1), label, { bold: true, fontColor: 'FFFFFF', fillColor: COLORS.auditHeader });
  });
  journeyRows.forEach((row, index) => {
    const values = [row.status_mapeamento, row.secao, row.bloco, row.bu, row.parceiro, row.segmento, row.etapa, row.canal, row.jornada, row.taxonomia, row.linhas, row.entregues, row.emitidos, row.aprovados, row.propostas];
    values.forEach((value, offset) => setCell(ws.getCell(journeyStart + 2 + index, offset + 1), value, { align: offset <= 9 ? 'left' : 'center' }));
  });

  [48, 12, 18, 14, 18, 28, 22, 12, 42, 58, 10, 14, 12, 12, 12].forEach((width, index) => {
    ws.getColumn(index + 1).width = width;
  });
}

function writeOverviewCampanhasSheet(
  wb: Workbook,
  rawRows: RawActivity[],
  auditRows: AuditRow[],
  summary: BuildIndexesResult['summary'],
  start: Date,
  end: Date,
): void {
  const focusWeekStart = findFocusWeekStart(rawRows, start, end);
  const focusWeekEnd = addDays(focusWeekStart, 6);
  const overviewRows = buildCampaignOverviewRows(rawRows, focusWeekStart);
  const dimensionRows = aggregateDimensionRows(overviewRows);
  const trendRows = buildWeeklyTrendRows(rawRows, focusWeekStart);
  const current = emptyMetrics();
  const baseline = emptyMetrics();
  overviewRows.forEach((row) => {
    addMetrics(current, row.current, row.current.linhas);
    addMetrics(baseline, row.baseline, row.baseline.linhas);
  });

  const rowsWithCurrent = overviewRows.filter((row) => row.current.linhas > 0);
  const averageScore = rowsWithCurrent.length
    ? Math.round(rowsWithCurrent.reduce((sum, row) => sum + row.score, 0) / rowsWithCurrent.length)
    : 0;
  const averageConfidence = rowsWithCurrent.length
    ? Math.round(rowsWithCurrent.reduce((sum, row) => sum + row.confidence, 0) / rowsWithCurrent.length)
    : 0;
  const statusCounts = overviewRows.reduce<Record<CampaignOverviewRow['status'], number>>((acc, row) => {
    if (row.current.linhas > 0 || row.status !== 'Monitorar') acc[row.status] += 1;
    return acc;
  }, { Escalar: 0, Corrigir: 0, Monitorar: 0, Investigar: 0 });

  const ws = wb.addWorksheet('Overview Campanhas', {
    views: [{ state: 'frozen', ySplit: 16, showGridLines: false }],
  });

  setCell(ws.getCell('A1'), 'Overview Campanhas', { bold: true, fontColor: 'FFFFFF', fillColor: COLORS.auditHeader, align: 'left' });
  ws.mergeCells('A1:L1');
  setCell(
    ws.getCell('A2'),
    `Periodo exportado: ${start.toLocaleDateString('pt-BR')} - ${end.toLocaleDateString('pt-BR')} | Semana foco: ${focusWeekStart.toLocaleDateString('pt-BR')} - ${focusWeekEnd.toLocaleDateString('pt-BR')} | Baseline: media das 4 semanas anteriores`,
    { align: 'left' },
  );
  ws.mergeCells('A2:L2');

  setCell(ws.getCell('A4'), 'Resumo Executivo', { bold: true, fontColor: 'FFFFFF', fillColor: COLORS.sectionDark, align: 'left' });
  ws.mergeCells('A4:E4');
  writeTableHeader(ws, 5, ['Metrica', 'Semana foco', 'Media 4 semanas', 'Delta', 'Leitura']);
  const executiveRows: Array<[string, string | number, string | number, string, string]> = [
    ['Entregues', current.entregues, Math.round(baseline.entregues), formatPercentValue(pctDelta(current.entregues, baseline.entregues)), 'Input principal de escala'],
    ['Emitidos', current.emitidos, Math.round(baseline.emitidos), formatPercentValue(pctDelta(current.emitidos, baseline.emitidos)), 'Resultado final'],
    ['Propostas', current.propostas, Math.round(baseline.propostas), formatPercentValue(pctDelta(current.propostas, baseline.propostas)), 'Sinal de funil'],
    ['Eficiencia', formatRatioValue(safeRate(current.emitidos || current.propostas, current.entregues)), formatRatioValue(safeRate(baseline.emitidos || baseline.propostas, baseline.entregues)), formatPercentValue(pctDelta(safeRate(current.emitidos || current.propostas, current.entregues), safeRate(baseline.emitidos || baseline.propostas, baseline.entregues))), 'Resultado por entrega'],
    ['Score Growth medio', averageScore, '100 = baseline saudavel', averageScore >= 85 ? 'forte' : averageScore >= 65 ? 'neutro' : 'fraco', 'Score ponderado'],
    ['Confianca media', `${averageConfidence}%`, 'historico + cobertura', averageConfidence >= 80 ? 'alta' : averageConfidence >= 65 ? 'media' : 'baixa', 'Qualidade do sinal'],
    ['Fila de acao', statusCounts.Escalar + statusCounts.Corrigir + statusCounts.Investigar, `${overviewRows.length} campanhas`, `${statusCounts.Escalar} escalar | ${statusCounts.Corrigir} corrigir | ${statusCounts.Investigar} investigar`, 'Prioridade da semana'],
  ];
  executiveRows.forEach((values, index) => {
    const row = 6 + index;
    values.forEach((value, offset) => setCell(ws.getCell(row, offset + 1), value, { align: offset === 0 || offset === 4 ? 'left' : 'center', fillColor: index % 2 ? COLORS.zebra : 'FFFFFF' }));
    applyBorder(ws, row, 5);
  });

  setCell(ws.getCell('G4'), 'Saude dos Dados', { bold: true, fontColor: 'FFFFFF', fillColor: COLORS.sectionDark, align: 'left' });
  ws.mergeCells('G4:L4');
  [
    ['Linhas fonte', summary.source_rows],
    ['Mapeadas', summary.mapped_source_rows],
    ['Fora do relatorio', summary.audit_source_rows],
    ['Cobertura', formatPercentValue(summary.source_rows ? summary.mapped_source_rows / summary.source_rows : 0)],
    ['Campanhas foco', rowsWithCurrent.length],
  ].forEach(([label, value], index) => {
    const row = 5 + index;
    setCell(ws.getCell(row, 7), String(label), { bold: true, fillColor: COLORS.auditSubheader, align: 'left' });
    setCell(ws.getCell(row, 8), value as string | number, { fillColor: COLORS.auditSubheader });
  });

  let rowCursor = 15;
  setCell(ws.getCell(rowCursor, 1), 'Tendencia Semanal', { bold: true, fontColor: 'FFFFFF', fillColor: COLORS.sectionDark, align: 'left' });
  ws.mergeCells(rowCursor, 1, rowCursor, 8);
  rowCursor += 1;
  writeTableHeader(ws, rowCursor, ['Semana', 'Campanhas', 'Entregues', 'Emitidos', 'Aprovados', 'Propostas', 'Tx resultado/entrega', 'Leitura']);
  trendRows.forEach((row, index) => {
    const excelRow = rowCursor + 1 + index;
    const delta = index === 0 ? null : pctDelta(row.entregues, trendRows[index - 1].entregues);
    [row.label, row.campanhas, row.entregues, row.emitidos, row.aprovados, row.propostas, formatRatioValue(safeRate(row.emitidos || row.propostas, row.entregues)), index === trendRows.length - 1 ? 'semana foco' : formatPercentValue(delta)].forEach((value, offset) => {
      setCell(ws.getCell(excelRow, offset + 1), value, { align: offset === 0 ? 'left' : 'center', fillColor: index % 2 ? COLORS.zebra : 'FFFFFF' });
    });
    applyBorder(ws, excelRow, 8);
  });

  rowCursor += trendRows.length + 3;
  setCell(ws.getCell(rowCursor, 1), 'Drivers de Crescimento', { bold: true, fontColor: 'FFFFFF', fillColor: COLORS.sectionDark, align: 'left' });
  ws.mergeCells(rowCursor, 1, rowCursor, 10);
  rowCursor += 1;
  writeTableHeader(ws, rowCursor, ['Dimensao', 'Valor', 'Status', 'Score medio', 'Campanhas', 'Entregues', 'Delta entregues', 'Emitidos', 'Delta emitidos', 'Propostas']);
  dimensionRows.slice(0, 36).forEach((row, index) => {
    const excelRow = rowCursor + 1 + index;
    [row.dimensao, row.valor, row.status, row.scoreMedio, row.campanhas, row.entregues, formatPercentValue(row.deltaEntreguesPct), row.emitidos, formatPercentValue(row.deltaEmitidosPct), row.propostas].forEach((value, offset) => {
      setCell(ws.getCell(excelRow, offset + 1), value, { align: offset < 3 ? 'left' : 'center', fillColor: offset === 2 ? statusColor(row.status) : index % 2 ? COLORS.zebra : 'FFFFFF' });
    });
    applyBorder(ws, excelRow, 10);
  });

  rowCursor += Math.min(dimensionRows.length, 36) + 3;
  setCell(ws.getCell(rowCursor, 1), 'Fila de Acoes', { bold: true, fontColor: 'FFFFFF', fillColor: COLORS.sectionDark, align: 'left' });
  ws.mergeCells(rowCursor, 1, rowCursor, 16);
  rowCursor += 1;
  const actionHeaderRow = rowCursor;
  writeTableHeader(ws, actionHeaderRow, ['Status', 'Score', 'Confianca', 'BU', 'Bloco', 'Canal', 'Segmento', 'Jornada', 'Taxonomia', 'Entregues', 'Emitidos', 'Propostas', 'Delta entrega', 'Delta resultado', 'Baseline sem.', 'Proxima acao']);
  overviewRows.forEach((row, index) => {
    const excelRow = actionHeaderRow + 1 + index;
    const action = row.status === 'Escalar' ? 'Aumentar prioridade mantendo eficiencia'
      : row.status === 'Corrigir' ? 'Revisar oferta, segmentacao ou criativo'
        : row.status === 'Investigar' ? 'Checar mapeamento, base ou anomalia'
          : 'Acompanhar ate ganhar historico';
    [
      row.status,
      row.score,
      `${row.confidence}%`,
      row.bu,
      row.bloco,
      row.canal,
      row.segmento,
      row.jornada,
      row.taxonomia,
      row.current.linhas ? row.current.entregues : 'N/A',
      row.current.linhas ? row.current.emitidos : 'N/A',
      row.current.linhas ? row.current.propostas : 'N/A',
      formatPercentValue(row.deltaEntreguesPct),
      formatPercentValue(row.deltaEmitidosPct),
      row.baselineWeeks,
      action,
    ].forEach((value, offset) => {
      setCell(ws.getCell(excelRow, offset + 1), value, { align: [7, 8, 15].includes(offset) ? 'left' : 'center', fillColor: offset === 0 ? statusColor(row.status) : index % 2 ? COLORS.zebra : 'FFFFFF' });
    });
    applyBorder(ws, excelRow, 16);
  });
  if (overviewRows.length > 0) {
    ws.autoFilter = {
      from: { row: actionHeaderRow, column: 1 },
      to: { row: actionHeaderRow + overviewRows.length, column: 16 },
    };
  }

  rowCursor = actionHeaderRow + overviewRows.length + 3;
  setCell(ws.getCell(rowCursor, 1), 'Riscos de Dados', { bold: true, fontColor: 'FFFFFF', fillColor: COLORS.sectionDark, align: 'left' });
  ws.mergeCells(rowCursor, 1, rowCursor, 7);
  rowCursor += 1;
  writeTableHeader(ws, rowCursor, ['Motivo', 'BU', 'Parceiro', 'Segmento', 'Canal', 'Linhas', 'Entregues']);
  auditRows.slice(0, 40).forEach((row, index) => {
    const excelRow = rowCursor + 1 + index;
    [row.motivo, row.bu || 'N/A', row.parceiro || 'N/A', row.segmento || 'N/A', row.canal || 'N/A', row.linhas, row.entregues].forEach((value, offset) => {
      setCell(ws.getCell(excelRow, offset + 1), value, { align: offset <= 4 ? 'left' : 'center', fillColor: index % 2 ? COLORS.zebra : 'FFFFFF' });
    });
    applyBorder(ws, excelRow, 7);
  });

  [22, 12, 12, 14, 28, 12, 22, 44, 52, 14, 12, 12, 14, 14, 12, 34].forEach((width, index) => {
    ws.getColumn(index + 1).width = width;
  });
  ws.eachRow((row) => {
    row.height = 22;
  });
}

function buildWorkbook(
  ExcelJSRuntime: { Workbook: new () => Workbook },
  rawRows: RawActivity[],
  b2cDailyRows: B2cDailyMetric[],
  start: Date,
  end: Date,
): Workbook {
  const { idx, auditRows, journeyRows, summary } = buildIndexes(rawRows, start, end);
  const b2cRealizedIdx = buildB2cRealizedIndex(b2cDailyRows, start, end);
  const dates = allDates(start, end);
  const wb = new ExcelJSRuntime.Workbook();
  wb.creator = 'GaaS AFINZ';
  wb.created = new Date();

  const ws = wb.addWorksheet('Aquisição CRM', {
    views: [{ state: 'frozen', xSplit: 2, ySplit: 2, topLeftCell: 'C3', activeCell: 'C3', showGridLines: false }],
  });
  let nextRow = 1;
  SECTIONS.forEach(([section, blocks]) => {
    nextRow = writeSection(ws, nextRow, section, blocks, idx, dates, b2cRealizedIdx);
  });
  ws.getColumn(1).width = 12;
  ws.getColumn(2).width = 6;
  for (let c = 3; c <= ws.columnCount; c += 1) {
    const header = text(ws.getCell(2, c).value);
    ws.getColumn(c).width = header === 'Canal' ? 10 : ['Cartões Emitidos', 'Propostas Serasa', 'Cartões Serasa'].includes(header) ? 16 : 12;
  }

  writeAuditSheet(wb, auditRows, journeyRows, summary);
  writeOverviewCampanhasSheet(wb, rawRows, auditRows, summary, start, end);
  return wb;
}

export async function fetchSupabaseRows(start: Date, end: Date): Promise<RawActivity[]> {
  const rows: RawActivity[] = [];
  const pageSize = 1000;
  const exclusiveEnd = addDays(end, 1);

  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .gte('Data de Disparo', isoDate(start))
      .lt('Data de Disparo', isoDate(exclusiveEnd))
      .order('Data de Disparo', { ascending: true })
      .order('BU', { ascending: true })
      .order('Parceiro', { ascending: true })
      .range(offset, offset + pageSize - 1);

    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < pageSize) break;
  }

  return rows;
}

async function fetchB2cDailyMetrics(start: Date, end: Date): Promise<B2cDailyMetric[]> {
  const rows: B2cDailyMetric[] = [];
  const pageSize = 1000;

  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabase
      .from('b2c_daily_metrics')
      .select('*')
      .gte('data', isoDate(start))
      .lte('data', isoDate(end))
      .order('data', { ascending: true })
      .order('tipo', { ascending: true })
      .range(offset, offset + pageSize - 1);

    if (error) throw error;
    rows.push(...((data ?? []) as B2cDailyMetric[]));
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

export async function exportAquisicaoCrmXlsx(start: Date, end: Date): Promise<{ rows: number; filename: string }> {
  const rawRows = await fetchSupabaseRows(start, end);
  const b2cDailyRows = await fetchB2cDailyMetrics(start, end);
  const ExcelJSModule = await import('exceljs');
  const workbook = buildWorkbook(ExcelJSModule.default, rawRows, b2cDailyRows, start, end);
  const buffer = await workbook.xlsx.writeBuffer();
  const filename = `aquisicao_crm_${isoDate(start).replace(/-/g, '')}_${isoDate(end).replace(/-/g, '')}.xlsx`;
  downloadBuffer(buffer, filename);
  return { rows: rawRows.length, filename };
}

export async function exportAquisicaoCrmMonthlyXlsx(start: Date, end: Date): Promise<{ rows: number; filename: string }> {
  const monthStart = new Date(start.getFullYear(), start.getMonth(), 1);
  const monthEnd = new Date(start.getFullYear(), start.getMonth() + 1, 0);
  const effectiveEnd = end > monthEnd ? monthEnd : end;
  const previousStart = new Date(start.getFullYear(), start.getMonth() - 1, 1);
  const rawRows = await fetchSupabaseRows(previousStart, effectiveEnd);
  const ExcelJSModule = await import('exceljs');
  const workbook = buildAquisicaoCrmMonthlyReportWorkbook(ExcelJSModule.default, rawRows, monthStart, effectiveEnd);
  const buffer = await workbook.xlsx.writeBuffer();
  const monthLabel = monthStart.toLocaleDateString('pt-BR', { month: 'long' }).replace(/^\w/, (char) => char.toUpperCase());
  const filename = `Report_${monthLabel}_CRM.xlsx`;
  downloadBuffer(buffer, filename);
  const rowsInPeriod = rawRows.filter((row) => {
    const rowDate = parseRowDate(get(row, 'Data de Disparo'));
    return rowDate >= monthStart && rowDate <= effectiveEnd;
  }).length;
  return { rows: rowsInPeriod, filename };
}

export function getCurrentMonthRange(): { start: Date; end: Date } {
  const now = new Date();
  return {
    start: new Date(now.getFullYear(), now.getMonth(), 1),
    end: new Date(now.getFullYear(), now.getMonth() + 1, 0),
  };
}
