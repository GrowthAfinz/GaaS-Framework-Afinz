import { useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { usePeriod } from '../contexts/PeriodContext';
import { format, startOfDay, isWithinInterval, addDays, differenceInDays } from 'date-fns';

export interface CorrelationDataPoint {
    date: string;
    displayDate: string;
    spendMeta: number;
    spendGoogle: number;
    spendTotal: number;

    // Channel Split
    impressionsMeta: number;
    clicksMeta: number;
    conversionsMeta: number; // Pixel

    impressionsGoogle: number;
    clicksGoogle: number;
    conversionsGoogle: number; // Pixel

    // Aggregated
    impressions: number;
    clicks: number;
    conversions: number;

    cards: number;      // B2C Cards
    proposals: number;
    conversionRate: number;

    // Derived
    cumulativeSpend: number;
    cumulativeCards: number;
    cpa?: number;

    laggedCards?: number;
}

export interface CorrelationStats {
    rSquared: number;
    correlation: number;
    slope: number;
    intercept: number;
    formula: string;

    influenceMin: number;
    influenceMax: number;
    estimatedCardsMin: number;
    estimatedCardsMax: number;
    effectiveCacMin: number;
    effectiveCacMax: number;

    interpretation: string;
    quality: 'Alta' | 'Moderada' | 'Baixa';
    color: string;

    bestLag: number;

    totalSpend: number;
    totalCards: number;
    totalProposals: number;
    totalImpressions: number;
    totalClicks: number;
    effectiveCpa: number;
    avgCpm: number;
    avgCtr: number;
    conversionRateB2C: number;

    // Channel Efficiency (Pixel)
    cpaMetaPixel: number;
    cpaGooglePixel: number;
}

export const useMediaCorrelation = () => {
    const { paidMediaData, b2cData } = useAppStore();
    const { startDate, endDate } = usePeriod();

    const rawData = useMemo(() => {
        // Map Structure
        const spendMap = new Map<string, {
            meta: number, google: number, total: number,
            impMeta: number, clickMeta: number, convMeta: number,
            impGoogle: number, clickGoogle: number, convGoogle: number,
            impTotal: number, clickTotal: number, convTotal: number
        }>();

        const resMap = new Map<string, { cards: number, proposals: number }>();

        // Process Spend
        paidMediaData.forEach(row => {
            if (!row.date) return;
            const d = startOfDay(new Date(row.date));
            const dStr = format(d, 'yyyy-MM-dd');

            if (!spendMap.has(dStr)) spendMap.set(dStr, {
                meta: 0, google: 0, total: 0,
                impMeta: 0, clickMeta: 0, convMeta: 0,
                impGoogle: 0, clickGoogle: 0, convGoogle: 0,
                impTotal: 0, clickTotal: 0, convTotal: 0
            });

            const item = spendMap.get(dStr)!;
            const val = Number(row.spend) || 0;
            const impr = Number(row.impressions) || 0;
            const clk = Number(row.clicks) || 0;
            const cnv = Number(row.conversions) || 0; // Pixel conversion

            const ch = (row.channel || '').toLowerCase();

            if (ch.includes('google')) {
                item.google += val;
                item.impGoogle += impr;
                item.clickGoogle += clk;
                item.convGoogle += cnv;
            } else if (ch.includes('meta') || ch.includes('facebook') || ch.includes('instagram')) {
                item.meta += val;
                item.impMeta += impr;
                item.clickMeta += clk;
                item.convMeta += cnv;
            }
            item.total += val;
            item.impTotal += impr;
            item.clickTotal += clk;
            item.convTotal += cnv;
        });

        // Process B2C Results
        b2cData.forEach(row => {
            if (!row.data) return;

            let dStr = row.data;

            // Normalize DD/MM/YYYY
            if (dStr.includes('/')) {
                const parts = dStr.split('/');
                if (parts.length === 3) {
                    dStr = `${parts[2]}-${parts[1]}-${parts[0]}`;
                }
            }

            if (!resMap.has(dStr)) resMap.set(dStr, { cards: 0, proposals: 0 });
            const item = resMap.get(dStr)!;
            item.cards += Number(row.emissoes_b2c_total) || 0;
            item.proposals += Number(row.propostas_b2c_total) || 0;
        });

        return { spendMap, resMap };
    }, [paidMediaData, b2cData]);

    const bestLag = useMemo(() => {
        const days = differenceInDays(endDate, startDate) + 1;
        if (days < 5) return 0;
        let maxR2 = -1;
        let bestL = 4;
        for (let lag = 0; lag <= 7; lag++) {
            const pairs: [number, number][] = [];
            for (let i = 0; i < days; i++) {
                const dateSpend = addDays(startDate, i);
                const dateCards = addDays(dateSpend, lag);
                const keySpend = format(dateSpend, 'yyyy-MM-dd');
                const keyCards = format(dateCards, 'yyyy-MM-dd');
                const s = rawData.spendMap.get(keySpend)?.total || 0;
                const c = rawData.resMap.get(keyCards)?.cards || 0;
                if (s > 0) pairs.push([s, c]);
            }
            const r2 = calculateRSquared(pairs);
            if (r2 > maxR2) { maxR2 = r2; bestL = lag; }
        }
        return bestL;
    }, [rawData, startDate, endDate]);

    const { data, stats } = useMemo(() => {
        const result: CorrelationDataPoint[] = [];
        let cumulativeSpend = 0;
        let cumulativeCards = 0;

        let totalSpend = 0;
        let totalSpendMeta = 0;
        let totalSpendGoogle = 0;

        let totalCards = 0;
        let totalProposals = 0;
        let totalImpressions = 0;
        let totalClicks = 0;

        let totalConvMeta = 0;
        let totalConvGoogle = 0;

        const dayCount = differenceInDays(endDate, startDate) + 1;

        for (let i = 0; i < dayCount; i++) {
            const currentDate = addDays(startDate, i);
            const dateKey = format(currentDate, 'yyyy-MM-dd');

            const sData = rawData.spendMap.get(dateKey) || {
                meta: 0, google: 0, total: 0,
                impMeta: 0, clickMeta: 0, convMeta: 0,
                impGoogle: 0, clickGoogle: 0, convGoogle: 0,
                impTotal: 0, clickTotal: 0, convTotal: 0
            };
            const cData = rawData.resMap.get(dateKey) || { cards: 0, proposals: 0 };

            cumulativeSpend += sData.total;
            cumulativeCards += cData.cards;

            totalSpend += sData.total;
            totalSpendMeta += sData.meta;
            totalSpendGoogle += sData.google;

            totalCards += cData.cards;
            totalProposals += cData.proposals;
            totalImpressions += sData.impTotal;
            totalClicks += sData.clickTotal;

            totalConvMeta += sData.convMeta;
            totalConvGoogle += sData.convGoogle;

            const cpa = cData.cards > 0 ? sData.total / cData.cards : 0;
            const conv = cData.proposals > 0 ? cData.cards / cData.proposals : 0;

            const lagDate = addDays(currentDate, bestLag);
            const lagKey = format(lagDate, 'yyyy-MM-dd');
            const laggedCardsVal = rawData.resMap.get(lagKey)?.cards || 0;

            result.push({
                date: dateKey,
                displayDate: format(currentDate, 'dd/MM'),
                spendMeta: sData.meta,
                spendGoogle: sData.google,
                spendTotal: sData.total,

                impressionsMeta: sData.impMeta,
                clicksMeta: sData.clickMeta,
                conversionsMeta: sData.convMeta,

                impressionsGoogle: sData.impGoogle,
                clicksGoogle: sData.clickGoogle,
                conversionsGoogle: sData.convGoogle,

                impressions: sData.impTotal,
                clicks: sData.clickTotal,
                conversions: sData.convTotal,

                cards: cData.cards,
                proposals: cData.proposals,
                conversionRate: conv,
                cumulativeSpend,
                cumulativeCards,
                cpa,
                laggedCards: laggedCardsVal
            });
        }

        const scatterPoints: [number, number][] = result
            .filter(d => d.spendTotal > 0)
            .map(d => [d.spendTotal, d.laggedCards || 0]);

        const rStats = calculateRegression(scatterPoints);
        const rSquared = rStats.rSquared;

        // KPIS
        const effectiveCpa = totalCards > 0 ? totalSpend / totalCards : 0;
        const avgCpm = totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0;
        const avgCtr = totalImpressions > 0 ? totalClicks / totalImpressions : 0;
        const conversionRateB2C = totalProposals > 0 ? totalCards / totalProposals : 0;

        // Channel CPA (Pixel)
        const cpaMetaPixel = totalConvMeta > 0 ? totalSpendMeta / totalConvMeta : 0;
        const cpaGooglePixel = totalConvGoogle > 0 ? totalSpendGoogle / totalConvGoogle : 0;

        const quality = rSquared >= 0.6 ? 'Alta' : rSquared >= 0.3 ? 'Moderada' : 'Baixa';
        const color = quality === 'Alta' ? '#10B981' : quality === 'Moderada' ? '#F59E0B' : '#EF4444';

        const interpretation = rSquared > 0.4
            ? `Com Lag de ${bestLag} dias, o Spend explica ${Math.round(rSquared * 100)}% da variação de cartões.`
            : `Fraca correlação mesmo com Lag de ${bestLag} dias.`;

        const statsObj: CorrelationStats = {
            ...rStats,
            bestLag,
            influenceMin: Math.max(0.05, rSquared * 0.9),
            influenceMax: Math.min(0.95, rSquared * 1.1),
            estimatedCardsMin: totalCards * Math.max(0.05, rSquared * 0.9),
            estimatedCardsMax: totalCards * Math.min(0.95, rSquared * 1.1),
            effectiveCacMin: effectiveCpa,
            effectiveCacMax: effectiveCpa,

            totalSpend,
            totalCards,
            totalProposals,
            totalImpressions,
            totalClicks,
            effectiveCpa,
            avgCpm,
            avgCtr,
            conversionRateB2C,

            cpaMetaPixel,
            cpaGooglePixel,

            quality,
            color,
            interpretation
        };

        return { data: result, stats: statsObj };

    }, [rawData, startDate, endDate, bestLag]);

    console.log('MediaCorrelation Debug (vChannelPixel):', {
        cpaMeta: stats?.cpaMetaPixel,
        cpaGoogle: stats?.cpaGooglePixel
    });

    return {
        data,
        stats,
        rawCounts: { paid: paidMediaData.length, b2c: b2cData.length }
    };
};

// Utils (Keep them)
function calculateRSquared(points: [number, number][]): number {
    const n = points.length;
    if (n < 2) return 0;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0, sumYY = 0;
    points.forEach(([x, y]) => {
        sumX += x; sumY += y; sumXY += x * y; sumXX += x * x; sumYY += y * y;
    });
    const num = (n * sumXY - sumX * sumY);
    const den = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));
    if (den === 0) return 0;
    return Math.pow(num / den, 2);
}

function calculateRegression(points: [number, number][]) {
    const n = points.length;
    if (n < 2) return { rSquared: 0, correlation: 0, slope: 0, intercept: 0, formula: 'N/A' };

    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0, sumYY = 0;
    points.forEach(([x, y]) => {
        sumX += x; sumY += y; sumXY += x * y; sumXX += x * x; sumYY += y * y;
    });

    const num = (n * sumXY - sumX * sumY);
    const den = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));
    const r = den === 0 ? 0 : num / den;

    const slopeDen = (n * sumXX - sumX * sumX);
    const slope = slopeDen === 0 ? 0 : num / slopeDen;
    const intercept = (sumY - slope * sumX) / n;

    const formula = `Y = ${slope.toFixed(4)}x ${intercept >= 0 ? '+' : '-'} ${Math.abs(intercept).toFixed(2)}`;

    return { rSquared: r * r, correlation: r, slope, intercept, formula };
}
