import { z } from 'zod';

export const AdChannelSchema = z.enum(['meta', 'google', 'tiktok', 'unknown']);

export const DailyAdMetricsSchema = z.object({
    date: z.date(), // Date object (parsed from Excel serial or string)
    channel: AdChannelSchema,
    campaign: z.string(),
    objective: z.enum(['brand', 'conversion', 'unknown']).optional(),

    // Novos campos de granularidade (Opcionais)
    ad_id: z.string().optional(),
    ad_name: z.string().optional(),
    adset_id: z.string().optional(),
    adset_name: z.string().optional(),

    // Core Metrics
    spend: z.number().min(0).default(0),
    impressions: z.number().int().min(0).default(0),
    clicks: z.number().int().min(0).default(0),
    conversions: z.number().int().min(0).default(0),

    // Novas métricas de audiência
    reach: z.number().int().min(0).optional(),
    frequency: z.number().min(0).optional(),

    // Calculated (Optional in raw data, computed later)
    ctr: z.number().optional(),
    cpc: z.number().optional(),
    cpm: z.number().optional(),
    cpa: z.number().optional(),
});

export type DailyAdMetrics = z.infer<typeof DailyAdMetricsSchema>;

export const BudgetSchema = z.object({
    id: z.string(),
    channel: AdChannelSchema,
    value: z.number().min(0),
    month: z.string(), // YYYY-MM
});

export type Budget = z.infer<typeof BudgetSchema>;

export const CampaignMappingSchema = z.object({
    id: z.string().optional(),
    campaign_name: z.string(),
    objective: z.enum(['marca', 'b2c', 'plurix']),
    created_at: z.string().optional(),
    updated_at: z.string().optional(),
});

export type CampaignMapping = z.infer<typeof CampaignMappingSchema>;

export interface MediaInsight {
    id: string;
    generated_at: string;
    period_start: string;
    period_end: string;
    score: number;           // 1-10
    channel: string | null;
    campaign: string | null;
    adset_name: string | null;
    ad_name: string | null;
    tipo: 'alerta' | 'oportunidade' | 'anomalia' | 'tendencia';
    contexto: string;
    mudanca: string;
    causa: string;
    acoes: string[];
    evidencias: Record<string, number | string>;
    status: 'active' | 'ativo' | 'dismissed' | 'done';
    created_at: string;
}
