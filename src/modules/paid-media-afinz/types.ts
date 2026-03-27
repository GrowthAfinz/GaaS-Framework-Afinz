export interface DailyMetrics {
    date: string | Date; // Allow both for compatibility
    channel: 'meta' | 'google' | 'tiktok' | 'unknown'; // Expanded
    campaign: string;
    objective?: 'marca' | 'b2c' | 'brand' | 'conversion' | 'unknown' | 'plurix'; // Expanded compatibility
    adset_name?: string;
    adset_id?: string;
    ad_name?: string;
    ad_id?: string;
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

// ── Ad Creative (from Meta API + Supabase) ─────────────────────────────────
export interface AssetInsight {
    text: string;
    asset_id: string;
    impressions: number;
    clicks: number;
    spend: number;
    reach: number;
    conversions: number;
    ctr: number;
    cpa: number;
}

export interface AdCreative {
    ad_id: string;
    ad_name?: string;
    campaign?: string;
    adset_name?: string;
    // Image fields
    thumbnail_path?: string;   // low-res fallback / video thumbnail
    image_url?: string;        // high-res original image URL
    image_hash?: string;
    // Creative intelligence fields (v2)
    media_type?: 'image' | 'video';
    video_id?: string;
    aspect_ratio?: number;     // width/height: 1.0=square, 0.5625=portrait(9:16)
    // Copy
    body?: string;
    title?: string;
    description?: string;
    call_to_action_type?: string;
    effective_status?: string;
    body_variations?: string[];
    title_variations?: string[];
    description_variations?: string[];
    body_asset_insights?: AssetInsight[];
    title_asset_insights?: AssetInsight[];
}

export interface FilterState {
    dateRange: DateRange;
    timeRangeOption: TimeRangeOption;
    selectedChannels: ('meta' | 'google')[];
    selectedObjectives: ('marca' | 'b2c' | 'plurix')[];
    selectedCampaigns: string[];
    selectedAdsets: string[];
    selectedAds: string[];
    isCompareEnabled: boolean;
}
