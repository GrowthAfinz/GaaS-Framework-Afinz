export interface DailyMetrics {
    date: string | Date; // Allow both for compatibility
    channel: 'meta' | 'google' | 'tiktok' | 'unknown'; // Expanded
    campaign: string;
    objective?: 'marca' | 'b2c' | 'brand' | 'conversion' | 'unknown' | 'plurix' | 'seguros'; // Expanded compatibility
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
    asset_storage_bucket?: string;
    asset_storage_path?: string;
    asset_public_url?: string;
    asset_source_url?: string;
    asset_width?: number;
    asset_height?: number;
    asset_content_type?: string;
    asset_origin?: 'supabase-storage' | 'meta-cdn' | 'legacy';
    asset_last_synced_at?: string;
    asset_sync_status?: 'hosted' | 'source-only' | 'sync-failed';
    asset_sync_error?: string | null;
    // Image fields (priority: image_url > video_thumbnail_url > thumbnail_path)
    thumbnail_path?: string;        // low-res fallback / legacy field
    image_url?: string;             // HIGH-RES: url_1080 from /adimages (images)
    video_thumbnail_url?: string;   // HIGH-RES: picture from /{video_id}?fields=picture (videos)
    image_hash?: string;
    // Creative intelligence fields (from Meta API v25)
    media_type?: 'image' | 'video'; // reliable: set from video_id / image_hash presence
    video_id?: string;
    aspect_ratio?: number;          // width/height from /adimages: 1.0=square, 0.5625=portrait(9:16)
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
    permalink_url?: string; // Built from effective_object_story_id
}

export type PaidMediaObjective = 'marca' | 'b2c' | 'plurix' | 'seguros';
export const ALL_PAID_MEDIA_OBJECTIVES: PaidMediaObjective[] = ['marca', 'b2c', 'plurix', 'seguros'];

export interface FilterState {
    dateRange: DateRange;
    timeRangeOption: TimeRangeOption;
    selectedChannels: ('meta' | 'google')[];
    selectedObjectives: PaidMediaObjective[];
    selectedCampaigns: string[];
    selectedAdsets: string[];
    selectedAds: string[];
    isCompareEnabled: boolean;
}
