import { format } from 'date-fns';
import type { Activity, FrameworkRow } from '../types/framework';
import type { ActivityRow } from '../types/activity';

export interface ActivityCommunicationContext {
  executionId: string;
  activityName: string;
  date: string;
  journey: string;
  channel: string;
  templateId: string | null;
}

const value = (v: unknown): string => typeof v === 'string' ? v : '';

export function rowCommunicationContext(row: FrameworkRow | ActivityRow): ActivityCommunicationContext {
  const r = row as unknown as Record<string, unknown>;
  return {
    executionId: value(r.id),
    activityName: value(r['Activity name / Taxonomia']),
    date: value(r['Data de Disparo']),
    journey: value(r.jornada) || value(r.Jornada),
    channel: value(r.Canal),
    templateId: value(r.template_id) || null,
  };
}

export function activityCommunicationContext(activity: Activity): ActivityCommunicationContext {
  const raw = rowCommunicationContext(activity.raw);
  return {
    executionId: raw.executionId,
    activityName: raw.activityName || activity.id,
    date: activity.dataDisparo && Number.isFinite(activity.dataDisparo.getTime())
      ? format(activity.dataDisparo, 'yyyy-MM-dd') : raw.date,
    journey: activity.jornada || raw.journey,
    channel: activity.canal || raw.channel,
    templateId: activity.templateId ?? raw.templateId,
  };
}

/** Remount previews on execution OR content changes, even when names repeat. */
export function communicationContextKey(context: ActivityCommunicationContext): string {
  return JSON.stringify([context.executionId, context.activityName, context.date, context.journey, context.channel, context.templateId]);
}

// Mapeia Activity → ActivityRow para o detalhe do disparo (função pura).
export const toActivityRow = (a: Activity): ActivityRow => {
  const context = activityCommunicationContext(a);
  return {
  id: context.executionId || a.id,
  template_id: context.templateId,
  prog_gaas: false,
  status: (a.status as ActivityRow['status']) ?? 'Enviado',
  created_at: '',
  updated_at: '',
  BU: a.bu as ActivityRow['BU'],
  jornada: a.jornada ?? '',
  'Activity name / Taxonomia': context.activityName,
  Canal: a.canal,
  'Data de Disparo': context.date,
  'Data Fim': '',
  Segmento: a.segmento ?? '',
  Parceiro: a.parceiro,
  Oferta: a.oferta,
  Promocional: a.promocional,
  Produto: (a.raw as Record<string, unknown>)?.['Produto'] as string | undefined,
  'Oferta 2': (a.raw as Record<string, unknown>)?.['Oferta 2'] as string | undefined,
  'Promocional 2': (a.raw as Record<string, unknown>)?.['Promocional 2'] as string | undefined,
  'Etapa de aquisição': (a.raw as Record<string, unknown>)?.['Etapa de aquisição'] as string | undefined,
  'Perfil de Crédito': (a.raw as Record<string, unknown>)?.['Perfil de Crédito'] as string | undefined,
  'Ordem de disparo': a.ordemDisparo,
  'Horário de Disparo': (a.raw as Record<string, unknown>)?.['Horário de Disparo'] as string | undefined,
  'Base Total': a.kpis.baseEnviada,
  'Base Acionável': a.kpis.baseEntregue,
  'Taxa de Entrega': a.kpis.taxaEntrega,
  'Taxa de Proposta': a.kpis.taxaPropostas,
  'Taxa de Aprovação': a.kpis.taxaAprovacao,
  'Taxa de Finalização': a.kpis.taxaFinalizacao,
  'Taxa de Conversão': a.kpis.taxaConversao,
  'Taxa de Abertura': a.kpis.taxaAbertura,
  Propostas: a.kpis.propostas,
  Aprovados: a.kpis.aprovados,
  'Cartões Gerados': a.kpis.cartoes ?? a.kpis.emissoes,
  CAC: a.kpis.cac,
  'Custo Total Campanha': a.kpis.custoTotal,
  };
};
