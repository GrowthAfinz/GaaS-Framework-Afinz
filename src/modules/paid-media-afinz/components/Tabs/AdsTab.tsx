import React, { useMemo, useState } from 'react';
import { useFilters } from '../../context/FilterContext';
import {
    Search, TrendingUp, TrendingDown, Award,
    MoreHorizontal, ThumbsUp, MessageCircle, Share2, Play,
    BarChart2, Info, RefreshCw, Loader2, Image, Film
} from 'lucide-react';
import {
    ResponsiveContainer, ScatterChart, Scatter, ZAxis,
    XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts';
import type { AdCreative } from '../../types';
import { AdDetailModal } from './AdDetailModal';
import { dataService } from '../../../../services/dataService';

// ── Constants ────────────────────────────────────────────────────────────────
const SUPABASE_URL = 'https://mipiwxadnpwtcgfcedym.supabase.co';

// ── Formatters ───────────────────────────────────────────────────────────────
const fmtBRL = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);
const fmtBRLDec = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 }).format(v);
const fmtNum = (v: number) =>
    v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M`
    : v >= 1_000 ? `${(v / 1_000).toFixed(1)}K`
    : String(Math.round(v));
const fmtPct = (v: number) => `${v.toFixed(2)}%`;

// ── Placement Summary (per-format breakdown) ─────────────────────────────────
export interface PlacementSummary {
    adId: string;
    adName: string;
    placementType: 'Feed' | 'Story' | 'Reels' | 'Desconhecido';
    spend: number;
    impressions: number;
    clicks: number;
    conversions: number;
    ctr: number;
    cpa: number;
}

// ── Ad Summary ────────────────────────────────────────────────────────────────
interface AdSummary {
    adId: string;
    adName: string;
    campaign: string;
    adset?: string;
    channel: 'meta' | 'google' | string;
    spend: number;
    impressions: number;
    clicks: number;
    conversions: number;
    ctr: number;
    cpa: number;
    cpm: number;
    reach?: number;
    frequency?: number;
    thumbnail_url?: string;
    mediaType: 'image' | 'video';
    isStory: boolean;
    // Creative enrichment
    body?: string;
    title?: string;
    ctaLabel?: string;
    creative?: AdCreative;
    // Placement breakdown (deduped ads grouped by image_hash)
    placements: PlacementSummary[];
}

// ── CTA Mapping ──────────────────────────────────────────────────────────────
const CTA_MAP: Record<string, string> = {
    LEARN_MORE: 'Saiba mais', SIGN_UP: 'Cadastre-se', APPLY_NOW: 'Candidatar-se',
    SHOP_NOW: 'Comprar agora', DOWNLOAD: 'Baixar', GET_OFFER: 'Obter oferta',
    CONTACT_US: 'Fale conosco', SUBSCRIBE: 'Assinar', ORDER_NOW: 'Pedir agora',
    OPEN_LINK: 'Abrir', WATCH_MORE: 'Assistir', BOOK_TRAVEL: 'Reservar',
};

// ── Compact KPI Bar ───────────────────────────────────────────────────────────
const KPIBar: React.FC<{
    curr: Record<string, number>;
    prev: Record<string, number>;
    showCompare: boolean;
}> = ({ curr, prev, showCompare }) => {
    const delta = (key: string) => {
        if (!showCompare || !prev[key]) return null;
        return ((curr[key] - prev[key]) / prev[key]) * 100;
    };

    const items = [
        { label: 'Invest.', value: fmtBRL(curr.spend), d: delta('spend'), inverse: false },
        { label: 'Conversoes', value: fmtNum(curr.conversions), d: delta('conversions'), inverse: false },
        { label: 'CPA Medio', value: curr.cpa > 0 ? fmtBRLDec(curr.cpa) : '—', d: delta('cpa'), inverse: true },
        { label: 'CTR', value: fmtPct(curr.ctr), d: delta('ctr'), inverse: false },
        { label: 'Anuncios ativos', value: String(curr.activeAds), d: null, inverse: false },
        { label: 'Em alerta', value: String(curr.alertAds), d: null, inverse: true },
    ];

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-6 py-3 flex flex-wrap items-center gap-0">
            {items.map((item, idx) => (
                <React.Fragment key={item.label}>
                    <div className="flex flex-col px-4 py-1 min-w-[100px]">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{item.label}</span>
                        <div className="flex items-baseline gap-1.5 mt-0.5">
                            <span className="text-base font-black text-slate-800">{item.value}</span>
                            {item.d !== null && (
                                <span className={`text-[10px] font-bold flex items-center gap-0.5 ${
                                    item.d === 0 ? 'text-slate-400' :
                                    (item.inverse ? item.d < 0 : item.d > 0) ? 'text-emerald-600' : 'text-red-500'
                                }`}>
                                    {item.d > 0 ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
                                    {Math.abs(item.d).toFixed(1)}%
                                </span>
                            )}
                        </div>
                    </div>
                    {idx < items.length - 1 && <div className="w-px h-8 bg-slate-100 mx-1" />}
                </React.Fragment>
            ))}
        </div>
    );
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const GRADIENTS = [
    'from-blue-400 to-indigo-600', 'from-rose-400 to-pink-600',
    'from-amber-400 to-orange-600', 'from-teal-400 to-cyan-600',
    'from-violet-400 to-purple-600', 'from-emerald-400 to-green-600',
    'from-sky-400 to-blue-600', 'from-fuchsia-400 to-purple-600',
];
const hashStr = (s: string) => s.split('').reduce((a, c) => a + c.charCodeAt(0), 0);

// Status badge
type StatusType = 'VENCEDOR' | 'FADIGA' | 'EXCELENTE' | 'BOM' | 'ATENCAO';
const getStatus = (ctr: number, cpa: number, avgCpa: number, freq?: number): StatusType => {
    if (freq && freq > 3.5) return 'FADIGA';
    if (cpa > 0 && avgCpa > 0 && cpa <= avgCpa * 0.7) return 'VENCEDOR';
    if (ctr >= 1) return 'EXCELENTE';
    if (ctr >= 0.5) return 'BOM';
    return 'ATENCAO';
};
const STATUS_STYLE: Record<StatusType, string> = {
    VENCEDOR: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    FADIGA:   'bg-orange-100 text-orange-700 border-orange-200',
    EXCELENTE:'bg-blue-100 text-blue-700 border-blue-200',
    BOM:      'bg-slate-100 text-slate-600 border-slate-200',
    ATENCAO:  'bg-red-100 text-red-600 border-red-200',
};
const STATUS_LABEL: Record<StatusType, string> = {
    VENCEDOR: 'VENCEDOR', FADIGA: 'FADIGA', EXCELENTE: 'EXCELENTE',
    BOM: 'BOM', ATENCAO: 'ATENCAO',
};

const AVATAR_COLORS = ['bg-blue-500','bg-rose-500','bg-violet-500','bg-amber-500','bg-teal-500','bg-emerald-500'];
const avatarColor = (name: string) => AVATAR_COLORS[hashStr(name) % AVATAR_COLORS.length];

// ── Meta-style Ad Card ────────────────────────────────────────────────────────
const MetaAdCard: React.FC<{
    ad: AdSummary;
    avgCpa: number;
    onClick: () => void;
}> = ({ ad, avgCpa, onClick }) => {
    const status = getStatus(ad.ctr, ad.cpa, avgCpa, ad.frequency);
    const gradient = GRADIENTS[hashStr(ad.adId) % GRADIENTS.length];
    const brandInitial = (ad.campaign || ad.adName).charAt(0).toUpperCase();
    const channelLabel = ad.channel === 'meta' ? 'Meta Ads' : ad.channel === 'google' ? 'Google Ads' : ad.channel;
    const ctrColor = ad.ctr >= 1 ? 'text-emerald-600' : ad.ctr >= 0.5 ? 'text-amber-600' : 'text-red-500';
    const displayBody = ad.body || ad.adName;
    const displayTitle = ad.title || ad.adName;
    const cta = ad.ctaLabel || 'Saiba mais';

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow cursor-pointer"
             onClick={onClick}>

            {/* Meta-style Header */}
            <div className="px-3 pt-3 pb-2 flex items-start justify-between">
                <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-black flex-shrink-0 ${avatarColor(ad.campaign)}`}>
                        {brandInitial}
                    </div>
                    <div className="min-w-0">
                        <p className="text-[12px] font-semibold text-slate-900 leading-tight truncate max-w-[150px]" title={ad.adName}>
                            {ad.adName.length > 24 ? ad.adName.slice(0, 24) + '…' : ad.adName}
                        </p>
                        <span className="text-[11px] text-slate-400">Patrocinado</span>
                    </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_STYLE[status]}`}>
                        {STATUS_LABEL[status]}
                    </span>
                </div>
            </div>

            {/* Ad Copy */}
            {displayBody && (
                <div className="px-3 pb-2">
                    <p className="text-[12px] text-slate-700 leading-snug line-clamp-2">{displayBody}</p>
                </div>
            )}

            {/* Image / Media area */}
            <div className={`relative w-full bg-gradient-to-br ${gradient} flex items-center justify-center`}
                 style={{ aspectRatio: '1 / 1' }}>
                {ad.thumbnail_url ? (
                    <img src={ad.thumbnail_url} alt={ad.adName}
                         className="w-full h-full object-cover" loading="lazy" />
                ) : (
                    <div className="flex flex-col items-center gap-2 opacity-30">
                        <Play size={32} className="text-white" />
                    </div>
                )}
            </div>

            {/* Link preview (Meta's gray CTA section) */}
            <div className="bg-[#F0F2F5] px-3 py-2 flex items-center justify-between gap-2">
                <div className="min-w-0">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider truncate">afinz.com.br</p>
                    <p className="text-[12px] font-semibold text-slate-900 truncate leading-tight">
                        {displayTitle.length > 30 ? displayTitle.slice(0, 30) + '...' : displayTitle}
                    </p>
                </div>
                <span className="flex-shrink-0 px-3 py-1.5 bg-[#E4E6EB] text-slate-700 text-[12px] font-semibold rounded-md">
                    {cta}
                </span>
            </div>

            {/* Engagement bar */}
            <div className="px-3 py-1.5 flex items-center gap-3 border-b border-slate-100">
                <div className="flex items-center gap-1 text-slate-400 text-[11px]">
                    <ThumbsUp size={12} /> <span>{fmtNum(ad.clicks)}</span>
                </div>
                <div className="flex items-center gap-1 text-slate-400 text-[11px]">
                    <MessageCircle size={12} /> <span>{fmtNum(Math.round(ad.impressions * 0.002))}</span>
                </div>
                <div className="ml-auto flex items-center gap-1 text-slate-400 text-[11px]">
                    <Share2 size={12} />
                </div>
            </div>

            {/* Performance Metrics */}
            <div className="px-3 py-2.5 grid grid-cols-3 gap-1.5">
                <div className="text-center">
                    <div className="text-[9px] text-slate-400 uppercase tracking-wider">Impress.</div>
                    <div className="text-[11px] font-bold text-slate-700">{fmtNum(ad.impressions)}</div>
                </div>
                <div className="text-center">
                    <div className="text-[9px] text-slate-400 uppercase tracking-wider">CTR</div>
                    <div className={`text-[11px] font-bold ${ctrColor}`}>{fmtPct(ad.ctr)}</div>
                </div>
                <div className="text-center">
                    <div className="text-[9px] text-slate-400 uppercase tracking-wider">CPA</div>
                    <div className="text-[11px] font-bold text-slate-700">{ad.cpa > 0 ? fmtBRL(ad.cpa) : '—'}</div>
                </div>
                <div className="text-center">
                    <div className="text-[9px] text-slate-400 uppercase tracking-wider">Conv.</div>
                    <div className="text-[11px] font-bold text-slate-700">{fmtNum(ad.conversions)}</div>
                </div>
                <div className="text-center">
                    <div className="text-[9px] text-slate-400 uppercase tracking-wider">Invest.</div>
                    <div className="text-[11px] font-bold text-slate-700">{fmtBRL(ad.spend)}</div>
                </div>
                <div className="text-center">
                    <div className="text-[9px] text-slate-400 uppercase tracking-wider">Freq.</div>
                    <div className={`text-[11px] font-bold ${ad.frequency && ad.frequency > 3.5 ? 'text-orange-500' : 'text-slate-700'}`}>
                        {ad.frequency ? ad.frequency.toFixed(1) : '—'}
                    </div>
                </div>
            </div>
        </div>
    );
};

// ── Story/Vertical format detection ──────────────────────────────────────────
const isStoryFormat = (adName: string, adset?: string): boolean =>
    /story|stories|reels?|9x16|9[_:]16|vertical|story_|_st_/i.test((adName + ' ' + (adset || '')));

// ── Sort / Filter Types ───────────────────────────────────────────────────────
type SortKey = 'cpa' | 'spend' | 'ctr' | 'conversions';
type StatusFilter = 'all' | 'VENCEDOR' | 'EXCELENTE' | 'BOM' | 'ATENCAO' | 'FADIGA';
type MediaFilter = 'all' | 'image' | 'video';

// ── Main Component ────────────────────────────────────────────────────────────
export const AdsTab: React.FC = () => {
    const { filteredData, previousPeriodData, filters, adCreatives, refreshCreatives } = useFilters();
    const showCompare = filters.isCompareEnabled;

    const [search, setSearch] = useState('');
    const [channelFilter, setChannelFilter] = useState<'all' | 'meta' | 'google'>('all');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [mediaFilter, setMediaFilter] = useState<MediaFilter>('all');
    const [sortKey, setSortKey] = useState<SortKey>('conversions');
    const [selectedAd, setSelectedAd] = useState<AdSummary | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showScatterInfo, setShowScatterInfo] = useState(false);

    // Build creative lookup map
    const creativeMap = useMemo(() => {
        const map = new Map<string, AdCreative>();
        adCreatives.forEach(c => map.set(c.ad_id, c));
        return map;
    }, [adCreatives]);

    // ── Aggregate by ad + enrich with creatives ─────────────────────────────
    const allAds = useMemo<AdSummary[]>(() => {
        // ── Pass 1: aggregate daily rows → one entry per ad_id ──────────────
        const raw = new Map<string, AdSummary & { freqCount: number; freqSum: number }>();

        filteredData.forEach(d => {
            const key = d.ad_id || d.ad_name || `${d.campaign}__${d.adset_name}`;
            if (!raw.has(key)) {
                const creative = creativeMap.get(d.ad_id || '');
                const thumbnailPath = creative?.thumbnail_path;
                const thumbnailUrl = thumbnailPath
                    ? thumbnailPath.startsWith('https://')
                        ? thumbnailPath
                        : `${SUPABASE_URL}/storage/v1/object/public/ad-thumbnails/${thumbnailPath}`
                    : undefined;
                const mediaType: 'image' | 'video' = creative?.image_hash ? 'image' : 'video';
                const adNameRaw = d.ad_name || d.ad_id || d.campaign;
                const isStory = isStoryFormat(adNameRaw, d.adset_name);
                raw.set(key, {
                    adId: key, adName: adNameRaw, campaign: d.campaign,
                    adset: d.adset_name, channel: d.channel,
                    spend: 0, impressions: 0, clicks: 0, conversions: 0,
                    ctr: 0, cpa: 0, cpm: 0, reach: 0, frequency: 0,
                    freqCount: 0, freqSum: 0,
                    thumbnail_url: thumbnailUrl, mediaType, isStory,
                    body: creative?.body, title: creative?.title,
                    ctaLabel: creative?.call_to_action_type
                        ? CTA_MAP[creative.call_to_action_type] || 'Saiba mais' : undefined,
                    creative, placements: [],
                });
            }
            const r = raw.get(key)!;
            r.spend += d.spend; r.impressions += d.impressions;
            r.clicks += d.clicks; r.conversions += d.conversions;
            if (d.reach) r.reach = (r.reach || 0) + d.reach;
            if (d.frequency) { r.freqSum += d.frequency; r.freqCount++; }
        });

        const finalized = Array.from(raw.values()).map(r => ({
            ...r,
            ctr: r.impressions > 0 ? (r.clicks / r.impressions) * 100 : 0,
            cpa: r.conversions > 0 ? r.spend / r.conversions : 0,
            cpm: r.impressions > 0 ? (r.spend / r.impressions) * 1000 : 0,
            frequency: r.freqCount > 0 ? r.freqSum / r.freqCount : undefined,
        }));

        // ── Pass 2: deduplicate by image_hash → thumbnail_path → unique ────
        // Priority: image_hash > thumbnail_path > ad_id (each more specific)
        const hashGroups = new Map<string, typeof finalized[0][]>();
        finalized.forEach(ad => {
            const hash = ad.creative?.image_hash;
            const thumb = ad.thumbnail_url;
            const gKey = hash ? `hash:${hash}` : thumb ? `thumb:${thumb}` : `unique:${ad.adId}`;
            if (!hashGroups.has(gKey)) hashGroups.set(gKey, []);
            hashGroups.get(gKey)!.push(ad);
        });

        return Array.from(hashGroups.values()).map(group => {
            // Single ad — no dedup needed
            if (group.length === 1) return { ...group[0], placements: [] };

            // Representative: prefer non-story (better thumbnail)
            const rep = group.find(a => !a.isStory) || group[0];
            const spend = group.reduce((s, a) => s + a.spend, 0);
            const impressions = group.reduce((s, a) => s + a.impressions, 0);
            const clicks = group.reduce((s, a) => s + a.clicks, 0);
            const conversions = group.reduce((s, a) => s + a.conversions, 0);
            const reach = group.reduce((s, a) => s + (a.reach || 0), 0);
            const freqVals = group.filter(a => a.frequency != null).map(a => a.frequency!);
            const frequency = freqVals.length > 0
                ? freqVals.reduce((s, v) => s + v, 0) / freqVals.length : undefined;

            const placements: PlacementSummary[] = group.map(a => {
                const pType: PlacementSummary['placementType'] =
                    /reels?/i.test(a.adName + ' ' + (a.adset || '')) ? 'Reels'
                    : a.isStory ? 'Story' : 'Feed';
                return { adId: a.adId, adName: a.adName, placementType: pType,
                    spend: a.spend, impressions: a.impressions, clicks: a.clicks,
                    conversions: a.conversions, ctr: a.ctr, cpa: a.cpa };
            });

            return {
                ...rep, spend, impressions, clicks, conversions, reach, frequency,
                ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
                cpa: conversions > 0 ? spend / conversions : 0,
                cpm: impressions > 0 ? (spend / impressions) * 1000 : 0,
                isStory: false,
                placements,
            };
        });
    }, [filteredData, creativeMap]);

    const avgCpa = useMemo(() => {
        const withCpa = allAds.filter(a => a.cpa > 0);
        return withCpa.length > 0 ? withCpa.reduce((s, a) => s + a.cpa, 0) / withCpa.length : 0;
    }, [allAds]);

    // ── Totals ──────────────────────────────────────────────────────────────
    const currTotals = useMemo(() => {
        const spend = filteredData.reduce((s, d) => s + d.spend, 0);
        const conversions = filteredData.reduce((s, d) => s + d.conversions, 0);
        const impressions = filteredData.reduce((s, d) => s + d.impressions, 0);
        const clicks = filteredData.reduce((s, d) => s + d.clicks, 0);
        return {
            spend, conversions,
            cpa: conversions > 0 ? spend / conversions : 0,
            ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
            activeAds: allAds.filter(a => a.impressions > 0).length,
            alertAds: allAds.filter(a => (a.frequency && a.frequency > 3.5) || (avgCpa > 0 && a.cpa > avgCpa * 2 && a.cpa > 0)).length,
        };
    }, [filteredData, allAds, avgCpa]);

    const prevTotals = useMemo(() => {
        if (!showCompare) return { spend: 0, conversions: 0, cpa: 0, ctr: 0 };
        const spend = previousPeriodData.reduce((s, d) => s + d.spend, 0);
        const conversions = previousPeriodData.reduce((s, d) => s + d.conversions, 0);
        const impressions = previousPeriodData.reduce((s, d) => s + d.impressions, 0);
        const clicks = previousPeriodData.reduce((s, d) => s + d.clicks, 0);
        return {
            spend, conversions,
            cpa: conversions > 0 ? spend / conversions : 0,
            ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
        };
    }, [previousPeriodData, showCompare]);

    // ── Filtered + sorted ───────────────────────────────────────────────────
    const displayAds = useMemo(() => {
        return allAds
            .filter(a => {
                // Stories (9:16) quebram o layout — ocultos por default
                if (a.isStory) return false;
                if (channelFilter !== 'all' && a.channel !== channelFilter) return false;
                if (mediaFilter !== 'all' && a.mediaType !== mediaFilter) return false;
                if (search) {
                    const q = search.toLowerCase();
                    if (!a.adName.toLowerCase().includes(q) && !a.campaign.toLowerCase().includes(q)
                        && !(a.body || '').toLowerCase().includes(q)) return false;
                }
                if (statusFilter !== 'all') {
                    if (getStatus(a.ctr, a.cpa, avgCpa, a.frequency) !== statusFilter) return false;
                }
                return true;
            })
            .sort((a, b) => {
                if (sortKey === 'cpa') {
                    if (a.cpa === 0) return 1;
                    if (b.cpa === 0) return -1;
                    return a.cpa - b.cpa;
                }
                return b[sortKey] - a[sortKey];
            });
    }, [allAds, channelFilter, search, statusFilter, sortKey, avgCpa]);

    // ── Top 5 ───────────────────────────────────────────────────────────────
    const top5 = useMemo(() =>
        [...allAds].filter(a => a.conversions > 0).sort((a, b) => b.conversions - a.conversions).slice(0, 5),
        [allAds]
    );

    // ── Scatter ─────────────────────────────────────────────────────────────
    const scatterData = useMemo(() =>
        allAds.filter(a => a.ctr > 0 && a.cpa > 0).map(a => ({
            x: +a.ctr.toFixed(3), y: +a.cpa.toFixed(2), z: a.spend, name: a.adName
        })),
        [allAds]
    );

    // ── Refresh creatives handler ───────────────────────────────────────────
    const handleRefreshCreatives = async () => {
        setIsRefreshing(true);
        try {
            await dataService.triggerCollectCreatives();
            await refreshCreatives();
        } catch (err) {
            console.error('Failed to refresh creatives:', err);
        } finally {
            setIsRefreshing(false);
        }
    };

    // ── Daily data for selected ad — includes all grouped placement IDs ────
    const selectedAdDailyData = useMemo(() => {
        if (!selectedAd) return [];
        const ids = new Set([
            selectedAd.adId,
            ...selectedAd.placements.map(p => p.adId),
        ]);
        return filteredData.filter(d =>
            ids.has(d.ad_id || d.ad_name || `${d.campaign}__${d.adset_name}`)
        );
    }, [filteredData, selectedAd]);

    return (
        <div className="space-y-5 animate-fade-in pb-10">

            {/* KPI bar */}
            <KPIBar curr={currTotals} prev={prevTotals} showCompare={showCompare} />

            {/* Filter toolbar */}
            <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[200px]">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" placeholder="Buscar anuncio ou campanha..."
                        value={search} onChange={e => setSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#00C6CC]/30" />
                </div>

                <div className="flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-lg">
                    {(['all', 'meta', 'google'] as const).map(ch => (
                        <button key={ch} onClick={() => setChannelFilter(ch)}
                            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${channelFilter === ch ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}>
                            {ch === 'all' ? 'Todos' : ch === 'meta' ? 'Meta' : 'Google'}
                        </button>
                    ))}
                </div>

                {/* Media type filter */}
                <div className="flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-lg">
                    <button onClick={() => setMediaFilter('all')}
                        className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${mediaFilter === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}>
                        Todos
                    </button>
                    <button onClick={() => setMediaFilter('image')}
                        className={`flex items-center gap-1 px-3 py-1 rounded-md text-xs font-semibold transition-all ${mediaFilter === 'image' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}>
                        <Image size={11} /> Imagem
                    </button>
                    <button onClick={() => setMediaFilter('video')}
                        className={`flex items-center gap-1 px-3 py-1 rounded-md text-xs font-semibold transition-all ${mediaFilter === 'video' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}>
                        <Film size={11} /> Vídeo
                    </button>
                </div>

                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as StatusFilter)}
                    className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none text-slate-700">
                    <option value="all">Todos os status</option>
                    <option value="VENCEDOR">Vencedor</option>
                    <option value="EXCELENTE">Excelente</option>
                    <option value="BOM">Bom</option>
                    <option value="ATENCAO">Atencao</option>
                    <option value="FADIGA">Fadiga</option>
                </select>

                <select value={sortKey} onChange={e => setSortKey(e.target.value as SortKey)}
                    className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none text-slate-700">
                    <option value="conversions">Conversoes</option>
                    <option value="cpa">Menor CPA</option>
                    <option value="spend">Maior Spend</option>
                    <option value="ctr">Maior CTR</option>
                </select>

                {/* Refresh Creatives button */}
                <button onClick={handleRefreshCreatives} disabled={isRefreshing}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-[#00C6CC]/30 text-[#00C6CC] rounded-lg hover:bg-[#00C6CC]/5 transition-colors disabled:opacity-50">
                    {isRefreshing ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                    {isRefreshing ? 'Atualizando...' : 'Atualizar Criativos'}
                </button>

                <span className="text-xs text-slate-400 ml-auto">{displayAds.length} anuncios</span>
            </div>

            {/* Ad Feed Grid */}
            {displayAds.length === 0 ? (
                <div className="text-center py-20 text-slate-400">
                    <BarChart2 size={40} className="mx-auto mb-3 opacity-20" />
                    <p className="text-sm">Nenhum anuncio encontrado.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {displayAds.map(ad => (
                        <MetaAdCard key={ad.adId} ad={ad} avgCpa={avgCpa}
                            onClick={() => setSelectedAd(ad)} />
                    ))}
                </div>
            )}

            {/* ── Top 5 Conversores (LIGHT THEME) ──────────────────────────────── */}
            {top5.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-3 border-b border-slate-100 flex items-center gap-2">
                        <Award size={15} className="text-amber-500" />
                        <h3 className="text-sm font-bold text-slate-800">Top 5 Conversores</h3>
                    </div>
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-slate-400 text-[10px] uppercase tracking-wider bg-slate-50">
                                <th className="px-5 py-2 text-left">Anuncio</th>
                                <th className="px-3 py-2 text-right">CTR</th>
                                <th className="px-3 py-2 text-right">CPA</th>
                                <th className="px-3 py-2 text-right">Conv.</th>
                                <th className="px-3 py-2 text-right">Invest.</th>
                            </tr>
                        </thead>
                        <tbody>
                            {top5.map((ad, idx) => {
                                const ctrBg = ad.ctr >= 1 ? 'bg-emerald-100 text-emerald-700' :
                                    ad.ctr >= 0.5 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600';
                                const cpaBg = avgCpa > 0 && ad.cpa <= avgCpa * 0.8 ? 'bg-emerald-100 text-emerald-700' :
                                    avgCpa > 0 && ad.cpa <= avgCpa * 1.2 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600';
                                return (
                                    <tr key={ad.adId} className="border-t border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer"
                                        onClick={() => setSelectedAd(ad)}>
                                        <td className="px-5 py-2.5">
                                            <div className="flex items-center gap-2.5">
                                                <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black flex-shrink-0
                                                    ${idx === 0 ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
                                                    {idx + 1}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        <span className="text-slate-800 font-medium text-xs truncate max-w-[160px]" title={ad.adName}>
                                                            {ad.adName}
                                                        </span>
                                                        {idx === 0 && (
                                                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 flex-shrink-0">
                                                                VENCEDOR
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-slate-400 text-[10px] truncate max-w-[160px]">{ad.campaign}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-3 py-2.5 text-right">
                                            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${ctrBg}`}>{fmtPct(ad.ctr)}</span>
                                        </td>
                                        <td className="px-3 py-2.5 text-right">
                                            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${cpaBg}`}>{fmtBRL(ad.cpa)}</span>
                                        </td>
                                        <td className="px-3 py-2.5 text-right text-slate-800 font-bold text-xs">{fmtNum(ad.conversions)}</td>
                                        <td className="px-3 py-2.5 text-right text-slate-500 text-xs">{fmtBRL(ad.spend)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ── Scatter CTR x CPA ──────────────────────────────────────────────── */}
            {scatterData.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                    <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="text-sm font-bold text-slate-700">Scatter: CTR x CPA</h3>
                        <div className="relative">
                            <button onClick={() => setShowScatterInfo(!showScatterInfo)}
                                className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                                <Info size={14} />
                            </button>
                            {showScatterInfo && (
                                <div className="absolute left-0 top-8 z-20 bg-white border border-slate-200 rounded-lg p-3 shadow-lg w-72 text-xs text-slate-600 leading-relaxed">
                                    <p className="font-semibold text-slate-700 mb-1">Como ler este grafico:</p>
                                    <ul className="space-y-1 list-disc pl-3">
                                        <li><b>Eixo X (horizontal):</b> CTR — quanto maior, melhor o engajamento</li>
                                        <li><b>Eixo Y (vertical):</b> CPA — quanto menor, mais eficiente</li>
                                        <li><b>Tamanho da bolha:</b> investimento total</li>
                                        <li><b>Canto inferior direito</b> = melhor performance (alto CTR + baixo CPA)</li>
                                    </ul>
                                    <button onClick={() => setShowScatterInfo(false)}
                                        className="mt-2 text-[#00C6CC] font-semibold hover:underline">Entendi</button>
                                </div>
                            )}
                        </div>
                    </div>
                    <p className="text-xs text-slate-400 mb-4">Tamanho = Invest. | Ideal: direita-baixo (alto CTR, baixo CPA)</p>
                    <div className="h-60">
                        <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                                <XAxis dataKey="x" name="CTR (%)" type="number"
                                    tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false}
                                    label={{ value: 'CTR (%)', position: 'insideBottom', offset: -10, fontSize: 10, fill: '#94A3B8' }} />
                                <YAxis dataKey="y" name="CPA (R$)" type="number"
                                    tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false}
                                    tickFormatter={v => `R$${v.toFixed(0)}`} />
                                <ZAxis dataKey="z" range={[30, 300]} name="Invest." />
                                <Tooltip cursor={{ strokeDasharray: '3 3' }}
                                    content={({ active, payload }) => {
                                        if (!active || !payload?.length) return null;
                                        const d = payload[0]?.payload;
                                        return (
                                            <div className="bg-white border border-slate-200 rounded-lg p-2.5 shadow-lg text-xs">
                                                <p className="font-semibold text-slate-700 mb-1 max-w-[200px] truncate">{d.name}</p>
                                                <p className="text-slate-500">CTR: <b className="text-slate-700">{d.x?.toFixed(2)}%</b></p>
                                                <p className="text-slate-500">CPA: <b className="text-slate-700">{fmtBRLDec(d.y)}</b></p>
                                                <p className="text-slate-500">Invest.: <b className="text-slate-700">{fmtBRL(d.z)}</b></p>
                                            </div>
                                        );
                                    }}
                                />
                                <Scatter data={scatterData} fill="#00C6CC" fillOpacity={0.65} />
                            </ScatterChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* ── Ad Detail Modal ─────────────────────────────────────────────── */}
            {selectedAd && (
                <AdDetailModal
                    ad={selectedAd}
                    creative={selectedAd.creative}
                    dailyData={selectedAdDailyData}
                    onClose={() => setSelectedAd(null)}
                />
            )}
        </div>
    );
};
