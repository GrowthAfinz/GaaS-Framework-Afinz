import React, { useMemo, useState } from 'react';
import {
    X, ThumbsUp, MessageCircle, Share2, Play,
    TrendingUp, TrendingDown, BarChart2, Layers, Target,
    Eye, MousePointer, DollarSign, Users, Repeat, Activity,
    ChevronDown, LayoutGrid, Smartphone, Film, ExternalLink
} from 'lucide-react';
import {
    ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
    CartesianGrid, Tooltip as RechartsTooltip
} from 'recharts';
import type { AdCreative, AssetInsight, DailyMetrics } from '../../types';
import type { PlacementSummary } from './AdsTab';
import { resolveCreativeAssetUrl } from '../../utils/creativeAssetUrl';

// ── Formatters ──────────────────────────────────────────────────────────────
const fmtBRL = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);
const fmtBRLDec = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 }).format(v);
const fmtNum = (v: number) =>
    v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M`
    : v >= 1_000 ? `${(v / 1_000).toFixed(1)}K`
    : String(Math.round(v));
const fmtPct = (v: number) => `${v.toFixed(2)}%`;

const CTA_MAP: Record<string, string> = {
    LEARN_MORE: 'Saiba mais',
    SIGN_UP: 'Cadastre-se',
    APPLY_NOW: 'Candidatar-se',
    SHOP_NOW: 'Comprar agora',
    DOWNLOAD: 'Baixar',
    GET_OFFER: 'Obter oferta',
    CONTACT_US: 'Fale conosco',
    SUBSCRIBE: 'Assinar',
    BOOK_TRAVEL: 'Reservar',
    WATCH_MORE: 'Assistir',
    ORDER_NOW: 'Pedir agora',
    OPEN_LINK: 'Abrir',
};

const AVATAR_COLORS = ['bg-blue-500','bg-rose-500','bg-violet-500','bg-amber-500','bg-teal-500','bg-emerald-500'];
const hashStr = (s: string) => s.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
const avatarColor = (name: string) => AVATAR_COLORS[hashStr(name) % AVATAR_COLORS.length];

const GRADIENTS = [
    'from-blue-400 to-indigo-600', 'from-rose-400 to-pink-600',
    'from-amber-400 to-orange-600', 'from-teal-400 to-cyan-600',
    'from-violet-400 to-purple-600', 'from-emerald-400 to-green-600',
];

interface AdData {
    adId: string;
    adName: string;
    campaign: string;
    adset?: string;
    channel: string;
    spend: number;
    impressions: number;
    clicks: number;
    conversions: number;
    ctr: number;
    cpa: number;
    cpm: number;
    reach?: number;
    frequency?: number;
    placements: PlacementSummary[];
}

interface Props {
    ad: AdData;
    creative?: AdCreative;
    dailyData: DailyMetrics[];
    onClose: () => void;
}

// ── Placements Breakdown (collapsible) ──────────────────────────────────────
const PLACEMENT_ICON: Record<PlacementSummary['placementType'], React.ReactNode> = {
    Feed: <LayoutGrid size={12} />,
    Story: <Smartphone size={12} />,
    Reels: <Film size={12} />,
    Desconhecido: <BarChart2 size={12} />,
};

const PlacementsBreakdown: React.FC<{ placements: PlacementSummary[] }> = ({ placements }) => {
    const [open, setOpen] = useState(false);
    if (placements.length < 2) return null;

    return (
        <div className="border-t border-slate-100 pt-4">
            <button onClick={() => setOpen(o => !o)}
                className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider hover:text-slate-700 transition-colors w-full">
                <Layers size={13} />
                <span>Resultados por Posicionamento</span>
                <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded-full text-[9px] font-bold">{placements.length}</span>
                <ChevronDown size={12} className={`ml-auto transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div className="mt-3 border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="bg-slate-50 text-slate-500">
                                <th className="px-3 py-2 text-left font-semibold">Posicionamento</th>
                                <th className="px-3 py-2 text-right font-semibold">Impr.</th>
                                <th className="px-3 py-2 text-right font-semibold">CTR</th>
                                <th className="px-3 py-2 text-right font-semibold">Conv.</th>
                                <th className="px-3 py-2 text-right font-semibold">CPA</th>
                                <th className="px-3 py-2 text-right font-semibold">Invest.</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[...placements].sort((a, b) => b.impressions - a.impressions).map((p, i) => (
                                <tr key={i} className="border-t border-slate-100 hover:bg-slate-50">
                                    <td className="px-3 py-2.5">
                                        <div className="flex items-center gap-1.5 text-slate-700">
                                            <span className="text-slate-400">{PLACEMENT_ICON[p.placementType]}</span>
                                            <span className="font-medium">{p.placementType}</span>
                                        </div>
                                    </td>
                                    <td className="px-3 py-2.5 text-right text-slate-600">{fmtNum(p.impressions)}</td>
                                    <td className="px-3 py-2.5 text-right">
                                        <span className={`font-semibold ${p.ctr >= 1 ? 'text-emerald-600' : p.ctr >= 0.5 ? 'text-amber-600' : 'text-red-500'}`}>
                                            {fmtPct(p.ctr)}
                                        </span>
                                    </td>
                                    <td className="px-3 py-2.5 text-right text-slate-600">{fmtNum(p.conversions)}</td>
                                    <td className="px-3 py-2.5 text-right text-slate-600">{p.cpa > 0 ? fmtBRLDec(p.cpa) : '—'}</td>
                                    <td className="px-3 py-2.5 text-right text-slate-600">{fmtBRL(p.spend)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

// ── Asset Insights Table ────────────────────────────────────────────────────
const AssetTable: React.FC<{ title: string; insights: AssetInsight[] }> = ({ title, insights }) => {
    if (!insights || insights.length === 0) return null;
    const sorted = [...insights].sort((a, b) => b.impressions - a.impressions);
    const best = sorted[0];

    return (
        <div>
            <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">{title}</h4>
            <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                    <thead>
                        <tr className="bg-slate-50 text-slate-500">
                            <th className="px-3 py-2 text-left font-semibold">Texto</th>
                            <th className="px-3 py-2 text-right font-semibold">Impr.</th>
                            <th className="px-3 py-2 text-right font-semibold">Cliques</th>
                            <th className="px-3 py-2 text-right font-semibold">CTR</th>
                            <th className="px-3 py-2 text-right font-semibold">Spend</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sorted.map((row, idx) => {
                            const isBest = row === best && sorted.length > 1;
                            return (
                                <tr key={idx} className={`border-t border-slate-100 ${isBest ? 'bg-emerald-50' : 'hover:bg-slate-50'}`}>
                                    <td className="px-3 py-2.5 text-slate-700 max-w-[260px]">
                                        <div className="flex items-center gap-1.5">
                                            {isBest && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 flex-shrink-0">TOP</span>}
                                            <span className="truncate" title={row.text}>{row.text}</span>
                                        </div>
                                    </td>
                                    <td className="px-3 py-2.5 text-right text-slate-600 font-medium">{fmtNum(row.impressions)}</td>
                                    <td className="px-3 py-2.5 text-right text-slate-600 font-medium">{fmtNum(row.clicks)}</td>
                                    <td className="px-3 py-2.5 text-right">
                                        <span className={`font-semibold ${row.ctr >= 1 ? 'text-emerald-600' : row.ctr >= 0.5 ? 'text-amber-600' : 'text-red-500'}`}>
                                            {fmtPct(row.ctr)}
                                        </span>
                                    </td>
                                    <td className="px-3 py-2.5 text-right text-slate-600">{fmtBRL(row.spend)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// ── Main Modal ──────────────────────────────────────────────────────────────
export const AdDetailModal: React.FC<Props> = ({ ad, creative, dailyData, onClose }) => {
    const thumbnailUrl = resolveCreativeAssetUrl(creative);

    const gradient = GRADIENTS[hashStr(ad.adId) % GRADIENTS.length];
    const brandInitial = (ad.campaign || ad.adName).charAt(0).toUpperCase();
    const ctaText = creative?.call_to_action_type
        ? CTA_MAP[creative.call_to_action_type] || 'Saiba mais'
        : 'Saiba mais';

    const bodyText = creative?.body || ad.adName;
    const titleText = creative?.title || ad.adName;
    const channelLabel = ad.channel === 'meta' ? 'Meta Ads' : ad.channel === 'google' ? 'Google Ads' : ad.channel;

    // Daily sparkline data
    const sparkData = useMemo(() => {
        const map = new Map<string, { date: string; spend: number; clicks: number; impressions: number }>();
        dailyData.forEach(d => {
            const key = new Date(d.date).toISOString().split('T')[0];
            if (!map.has(key)) map.set(key, { date: key, spend: 0, clicks: 0, impressions: 0 });
            const r = map.get(key)!;
            r.spend += d.spend;
            r.clicks += d.clicks;
            r.impressions += d.impressions;
        });
        return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
    }, [dailyData]);

    const hasVariations = (creative?.body_asset_insights && creative.body_asset_insights.length > 0)
        || (creative?.title_asset_insights && creative.title_asset_insights.length > 0);

    const metrics = [
        { icon: Eye, label: 'Impressoes', value: fmtNum(ad.impressions), color: 'text-blue-600' },
        { icon: MousePointer, label: 'Cliques', value: fmtNum(ad.clicks), color: 'text-indigo-600' },
        { icon: Activity, label: 'CTR', value: fmtPct(ad.ctr), color: ad.ctr >= 1 ? 'text-emerald-600' : 'text-amber-600' },
        { icon: Target, label: 'Conversoes', value: fmtNum(ad.conversions), color: 'text-violet-600' },
        { icon: DollarSign, label: 'CPA', value: ad.cpa > 0 ? fmtBRLDec(ad.cpa) : '—', color: 'text-rose-600' },
        { icon: DollarSign, label: 'Investimento', value: fmtBRL(ad.spend), color: 'text-slate-700' },
        { icon: Users, label: 'Alcance', value: ad.reach ? fmtNum(ad.reach) : '—', color: 'text-teal-600' },
        { icon: Repeat, label: 'Frequencia', value: ad.frequency ? ad.frequency.toFixed(1) : '—', color: ad.frequency && ad.frequency > 3.5 ? 'text-orange-500' : 'text-slate-600' },
        { icon: BarChart2, label: 'CPM', value: fmtBRLDec(ad.cpm), color: 'text-slate-600' },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4"
                 onClick={e => e.stopPropagation()}>

                {/* ── Header bar ── */}
                <div className="flex items-center justify-between px-6 py-3 border-b border-slate-100">
                    <h2 className="text-sm font-bold text-slate-800">Detalhes do Anuncio</h2>
                    <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={18} />
                    </button>
                </div>

                {/* ── Two-column layout ── */}
                <div className="flex flex-col lg:flex-row">
                    {/* ── LEFT: Facebook-style post ── */}
                    <div className="flex-1 p-6 border-r border-slate-100">
                        {/* Post header */}
                        <div className="flex items-center gap-3 mb-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-black ${avatarColor(ad.campaign)}`}>
                                {brandInitial}
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-slate-900">{ad.campaign}</p>
                                <p className="text-[11px] text-slate-400 truncate max-w-[280px]" title={ad.adName}>{ad.adName}</p>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-xs text-slate-400">Patrocinado</span>
                                    <span className="text-slate-300">·</span>
                                    <span className="text-xs text-slate-400">{channelLabel}</span>
                                    {creative?.effective_status && (
                                        <>
                                            <span className="text-slate-300">·</span>
                                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                                                creative.effective_status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' :
                                                creative.effective_status === 'PAUSED' ? 'bg-amber-100 text-amber-700' :
                                                'bg-slate-100 text-slate-500'
                                            }`}>{creative.effective_status}</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Body copy */}
                        <p className="text-sm text-slate-800 leading-relaxed mb-3 whitespace-pre-line">{bodyText}</p>

                        {/* Image — clicável se permalink disponível */}
                        {creative?.permalink_url ? (
                            <a href={creative.permalink_url} target="_blank" rel="noopener noreferrer"
                               className="block relative group">
                                <div className={`relative w-full rounded-lg overflow-hidden bg-gradient-to-br ${gradient}`}
                                     style={{ aspectRatio: '16 / 9' }}>
                                    {thumbnailUrl ? (
                                        <img src={thumbnailUrl} alt={ad.adName} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full opacity-30">
                                            <Play size={40} className="text-white" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors rounded-lg flex items-center justify-center">
                                        <ExternalLink size={28} className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                                    </div>
                                </div>
                            </a>
                        ) : (
                            <div className={`relative w-full rounded-lg overflow-hidden bg-gradient-to-br ${gradient}`}
                                 style={{ aspectRatio: '16 / 9' }}>
                                {thumbnailUrl ? (
                                    <img src={thumbnailUrl} alt={ad.adName} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full opacity-30">
                                        <Play size={40} className="text-white" />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Link preview */}
                        <div className="bg-[#F0F2F5] rounded-b-lg px-4 py-2.5 flex items-center justify-between -mt-1">
                            <div className="min-w-0">
                                <p className="text-[10px] text-slate-500 uppercase tracking-wider">afinz.com.br</p>
                                <p className="text-sm font-semibold text-slate-900 truncate">{titleText}</p>
                                {creative?.description && (
                                    <p className="text-xs text-slate-500 truncate mt-0.5">{creative.description}</p>
                                )}
                            </div>
                            <button className="flex-shrink-0 px-4 py-2 bg-[#E4E6EB] hover:bg-[#D8DADF] text-slate-700 text-sm font-semibold rounded-md transition-colors">
                                {ctaText}
                            </button>
                        </div>

                        {/* Engagement bar */}
                        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100">
                            <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                                <ThumbsUp size={14} /> <span>{fmtNum(ad.clicks)}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                                <MessageCircle size={14} /> <span>{fmtNum(Math.round(ad.impressions * 0.002))}</span>
                            </div>
                            <div className="ml-auto flex items-center gap-1.5 text-slate-500 text-xs">
                                <Share2 size={14} />
                            </div>
                        </div>
                    </div>

                    {/* ── RIGHT: Metrics panel ── */}
                    <div className="lg:w-[320px] p-6 space-y-5">
                        <div>
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Metricas</h3>
                            <div className="space-y-2">
                                {metrics.map(m => (
                                    <div key={m.label} className="flex items-center justify-between py-1">
                                        <div className="flex items-center gap-2 text-slate-500">
                                            <m.icon size={13} />
                                            <span className="text-xs">{m.label}</span>
                                        </div>
                                        <span className={`text-sm font-bold ${m.color}`}>{m.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Hierarchy */}
                        <div className="border-t border-slate-100 pt-4">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Hierarquia</h3>
                            <div className="space-y-1.5 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Campanha</span>
                                    <span className="text-slate-700 font-medium truncate max-w-[160px]" title={ad.campaign}>{ad.campaign}</span>
                                </div>
                                {(creative?.adset_name || ad.adset) && (
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Grupo</span>
                                        <span className="text-slate-700 font-medium truncate max-w-[160px]" title={creative?.adset_name || ad.adset}>{creative?.adset_name || ad.adset}</span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Canal</span>
                                    <span className="text-slate-700 font-medium">{channelLabel}</span>
                                </div>
                            </div>
                        </div>

                        {/* Placements breakdown */}
                        <PlacementsBreakdown placements={ad.placements || []} />
                    </div>
                </div>

                {/* ── Bottom section: Variations + Sparkline ── */}
                <div className="border-t border-slate-100 px-6 py-5 space-y-5">
                    {/* Asset variations */}
                    {hasVariations && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Layers size={14} className="text-violet-500" />
                                <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Variacoes de Creative (Dynamic)</h3>
                            </div>
                            <AssetTable title="Variacoes de Copy (Body)" insights={creative?.body_asset_insights || []} />
                            <AssetTable title="Variacoes de Titulo" insights={creative?.title_asset_insights || []} />
                        </div>
                    )}

                    {/* Variations list (if no insights but has variations) */}
                    {!hasVariations && creative && (
                        (creative.body_variations && creative.body_variations.length > 1) ||
                        (creative.title_variations && creative.title_variations.length > 1)
                    ) && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Layers size={14} className="text-violet-500" />
                                <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Variacoes de Creative</h3>
                            </div>
                            {creative.body_variations && creative.body_variations.length > 1 && (
                                <div>
                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-1.5">Bodys</h4>
                                    <div className="space-y-1">
                                        {creative.body_variations.map((v, i) => (
                                            <div key={i} className="text-xs text-slate-600 bg-slate-50 rounded-md px-3 py-2">"{v}"</div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {creative.title_variations && creative.title_variations.length > 1 && (
                                <div>
                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-1.5">Titulos</h4>
                                    <div className="space-y-1">
                                        {creative.title_variations.map((v, i) => (
                                            <div key={i} className="text-xs text-slate-600 bg-slate-50 rounded-md px-3 py-2">"{v}"</div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Sparkline */}
                    {sparkData.length > 1 && (
                        <div>
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Performance Diaria</h3>
                            <div className="h-24">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={sparkData} margin={{ top: 5, right: 5, bottom: 0, left: 5 }}>
                                        <defs>
                                            <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#00C6CC" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#00C6CC" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                                        <XAxis dataKey="date" hide />
                                        <YAxis hide />
                                        <RechartsTooltip
                                            contentStyle={{ fontSize: 10, borderRadius: 8, border: '1px solid #E2E8F0' }}
                                            formatter={(value: number, name: string) => [
                                                name === 'spend' ? fmtBRL(value) : fmtNum(value),
                                                name === 'spend' ? 'Invest.' : name === 'clicks' ? 'Cliques' : 'Impress.'
                                            ]}
                                            labelFormatter={(l: string) => new Date(l + 'T12:00:00').toLocaleDateString('pt-BR')}
                                        />
                                        <Area type="monotone" dataKey="spend" stroke="#00C6CC" fill="url(#sparkGrad)" strokeWidth={2} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
