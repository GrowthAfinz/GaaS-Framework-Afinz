import { B2CDataRow } from '../types/b2c';
import { DailyDimensionRow, formatDayLabel } from './dailyAggregation';
import { emptyVolumes, metricsFromVolumes } from './monthlyAggregation';
import { formatDateKey } from './formatters';

/**
 * Serasa API é um canal de originação B2C integrado (planilha → skill
 * b2c-originacao-updater → tabela b2c_daily_metrics, tipo='serasa_api') —
 * não é um disparo CRM. Por isso só existem 3 números reais por dia
 * (propostas, emissões, % conversão); todo o resto do funil (base enviada,
 * aberturas, custo, CAC...) fica 0 porque de fato não existe nesse canal.
 */
export const SERASA_SEGMENT_LABEL = 'Serasa API';
export const SERASA_SERIES_COLOR = '#2563EB';

function normalizeB2CType(value?: string): string {
  return String(value || 'total')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function isSerasaRow(row: B2CDataRow): boolean {
  return normalizeB2CType(row.tipo).includes('serasa');
}

/**
 * Agrega as linhas de b2c_daily_metrics do canal Serasa API no mesmo formato
 * de DailyDimensionRow usado pelo CRM (dimension='segmento'), para poder ser
 * concatenado direto em segmentRowsRaw nos gráficos "Segmentos por dia".
 *
 * % Conv da Base aqui vem direto de percentual_conversao_b2c (metodologia
 * própria do B2C) — NÃO é recalculada como emissões/baseEnviada, porque
 * baseEnviada não existe para esse canal.
 */
export function aggregateDailySerasaRows(b2cData: B2CDataRow[]): DailyDimensionRow[] {
  const byDay = new Map<string, { propostas: number; emissoes: number; conversao: number }>();

  b2cData.filter(isSerasaRow).forEach((row) => {
    const dayKey = formatDateKey(row.data);
    if (dayKey === 'UNKNOWN') return;
    const current = byDay.get(dayKey) ?? { propostas: 0, emissoes: 0, conversao: 0 };
    current.propostas += Number(row.propostas_b2c_total) || 0;
    current.emissoes += Number(row.emissoes_b2c_total) || 0;
    current.conversao = Number(row.percentual_conversao_b2c) || current.conversao;
    byDay.set(dayKey, current);
  });

  return Array.from(byDay.entries()).map(([dayKey, agg]) => {
    const volumes = emptyVolumes();
    volumes.propostas = agg.propostas;
    volumes.emissoes = agg.emissoes;
    const metrics = metricsFromVolumes(volumes);
    metrics.taxaConversaoBase = agg.conversao;
    return {
      dayKey,
      dayLabel: formatDayLabel(dayKey),
      activitiesCount: agg.propostas > 0 || agg.emissoes > 0 ? 1 : 0,
      dimension: 'segmento',
      label: SERASA_SEGMENT_LABEL,
      ...metrics,
      cacSum: 0,
      cacCount: 0,
    };
  });
}
