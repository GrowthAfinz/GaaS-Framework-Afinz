export interface DailyMetrics {
    date: string | Date; // Allow both for compatibility
    channel: 'meta' | 'google' | 'tiktok' | 'unknown'; // Expanded
    campaign: string;
    objective?: 'marca' | 'b2c' | 'brand' | 'conversion' | 'unknown' | 'plurix'; // Expanded compatibility
    spend: number;
    impressions: number;
    clicks: number;
    conversions: number;
    cpm: number;
    cpc: number;
    ctr: number;
    reach?: number;
    frequency?: number;
}

export interface KPIChange {
    value: number;
    percentChange: number;
    trend: 'up' | 'down' | 'neutral';
}

export interface DateRange {
    from: Date;
    to: Date;
}

export type TimeRangeOption = '7d' | '14d' | '30d' | '90d' | 'this-month' | 'last-month' | 'custom';

export interface FilterState {
    dateRange: DateRange;
    timeRangeOption: TimeRangeOption;
    selectedChannels: ('meta' | 'google')[];
    selectedObjectives: ('marca' | 'b2c' | 'plurix')[];
    selectedCampaigns: string[];
    isCompareEnabled: boolean;
}
