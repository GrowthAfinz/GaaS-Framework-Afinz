import React from 'react';
import { AlertTriangle, CheckCircle2, CircleGauge, FileCheck2, GitBranch, PlayCircle, ShieldAlert, Sparkles, Target, Timer, XCircle, type LucideIcon } from 'lucide-react';
import { GrowthFeedEventType } from './growthFeed.types';

export interface GrowthFeedCardVariant {
  label: string;
  icon: LucideIcon;
  accent: string;
  badge: string;
  iconBackground: string;
}

export const GROWTH_FEED_CARD_REGISTRY: Record<GrowthFeedEventType, GrowthFeedCardVariant> = {
  recommendation_created: {
    label: 'Recomendação',
    icon: Sparkles,
    accent: 'border-l-cyan-500',
    badge: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    iconBackground: 'bg-cyan-100 text-cyan-700',
  },
  data_quality_blocked: {
    label: 'Qualidade bloqueada',
    icon: ShieldAlert,
    accent: 'border-l-amber-500',
    badge: 'bg-amber-50 text-amber-800 border-amber-200',
    iconBackground: 'bg-amber-100 text-amber-800',
  },
  report_candidate_generated: {
    label: 'Candidata certificada',
    icon: FileCheck2,
    accent: 'border-l-violet-500',
    badge: 'bg-violet-50 text-violet-700 border-violet-200',
    iconBackground: 'bg-violet-100 text-violet-700',
  },
  report_published: {
    label: 'Report publicado',
    icon: CheckCircle2,
    accent: 'border-l-emerald-500',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    iconBackground: 'bg-emerald-100 text-emerald-700',
  },
  report_blocked: {
    label: 'Report bloqueado',
    icon: AlertTriangle,
    accent: 'border-l-rose-500',
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
    iconBackground: 'bg-rose-100 text-rose-700',
  },
  bet_created: {
    label: 'Aposta assumida',
    icon: Target,
    accent: 'border-l-emerald-500',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    iconBackground: 'bg-emerald-100 text-emerald-700',
  },
  bet_updated: {
    label: 'Aposta atualizada',
    icon: GitBranch,
    accent: 'border-l-blue-500',
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
    iconBackground: 'bg-blue-100 text-blue-700',
  },
  signal_rejected: {
    label: 'Sinal rejeitado',
    icon: XCircle,
    accent: 'border-l-slate-500',
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
    iconBackground: 'bg-slate-200 text-slate-700',
  },
  execution_recorded: {
    label: 'Execução registrada',
    icon: PlayCircle,
    accent: 'border-l-blue-500',
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
    iconBackground: 'bg-blue-100 text-blue-700',
  },
  outcome_due: {
    label: 'Outcome vencido',
    icon: Timer,
    accent: 'border-l-amber-500',
    badge: 'bg-amber-50 text-amber-800 border-amber-200',
    iconBackground: 'bg-amber-100 text-amber-800',
  },
  outcome_evaluated: {
    label: 'Outcome avaliado',
    icon: CircleGauge,
    accent: 'border-l-violet-500',
    badge: 'bg-violet-50 text-violet-700 border-violet-200',
    iconBackground: 'bg-violet-100 text-violet-700',
  },
};

export const FRONT_LABELS = {
  crm_acquisition: 'CRM Aquisição',
  paid_media: 'Mídia Paga',
  b2c_origin: 'Originação B2C',
  report_live: 'Report Live',
} as const;

export function FeedEventIcon({ eventType, size = 18 }: { eventType: GrowthFeedEventType; size?: number }) {
  const Icon = GROWTH_FEED_CARD_REGISTRY[eventType].icon;
  return <Icon size={size} />;
}
