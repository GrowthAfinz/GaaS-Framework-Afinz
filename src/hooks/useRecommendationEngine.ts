import { useMemo } from 'react';
import { Activity } from '../types/framework';
import { Recommendation, RecommendationCombo, RecommendationMetrics, RecommendationScore, RecommendationInsight } from '../types/recommendations';

export const useRecommendationEngine = (activities: Activity[]) => {
    const recommendations = useMemo(() => {
        // 1. Group by Combo
        const groups = new Map<string, Activity[]>();

        activities.forEach(act => {
            // Normalize keys to avoid duplicates due to casing/spacing
            // Force 'Padrao' for Oferta 2 if empty, as requested
            const bu = act.bu.trim();
            const oferta2Raw = act.raw['Oferta 2'] || 'Padrao';
            const promo2Raw = act.raw['Promocional 2'] || 'N/A';

            const key = `${bu}|${act.canal}|${act.oferta || 'Sem Oferta'}|${act.segmento}|${act.promocional || 'N/A'}|${oferta2Raw}|${promo2Raw}`;

            if (!groups.has(key)) {
                groups.set(key, []);
            }
            groups.get(key)!.push(act);
        });

        const results: Recommendation[] = [];

        groups.forEach((acts, key) => {
            const [bu, canal, oferta, segmento, promocional, oferta2, promocional2] = key.split('|');
            const combo: RecommendationCombo = {
                bu,
                canal,
                oferta,
                segmento,
                promocional: promocional !== 'N/A' ? promocional : undefined,
                oferta2: oferta2, // Always show Oferta 2 (defaults to Padrao)
                promocional2: promocional2 !== 'N/A' ? promocional2 : undefined
            };

            // 2. Calculate Metrics
            let totalCAC = 0;
            let totalConversion = 0;
            let totalCards = 0;
            let validCACCount = 0;
            let validConvCount = 0;

            acts.forEach(a => {
                if (a.kpis.cac !== null && a.kpis.cac > 0) {
                    totalCAC += a.kpis.cac;
                    validCACCount++;
                }
                if (a.kpis.taxaConversao !== null) {
                    totalConversion += a.kpis.taxaConversao;
                    validConvCount++;
                }
                if (a.kpis.cartoes !== null) {
                    totalCards += a.kpis.cartoes;
                }
            });

            const avgCAC = validCACCount > 0 ? totalCAC / validCACCount : 0;
            const avgConversion = validConvCount > 0 ? totalConversion / validConvCount : 0;
            const totalVolume = acts.length;

            // Find most recent execution date
            const lastExecuted = acts.length > 0
                ? new Date(Math.max(...acts.map(a => a.dataDisparo.getTime())))
                : null;

            const metrics: RecommendationMetrics = {
                avgCAC,
                avgConversion,
                totalVolume,
                totalCards,
                successRate: 0, // TODO: Define success threshold
                lastExecuted
            };

            // 3. Calculate Scores

            // CAC Score: Lower is better. 
            // Baseline: R$ 150. If CAC > 150, score drops. If CAC < 50, score is high.
            // Formula: 100 - (CAC / 1.5). Ex: CAC 75 -> 100 - 50 = 50. CAC 0 -> 100 (if valid).
            // If no CAC data, score is 0.
            let cacScore = 0;
            if (validCACCount > 0) {
                cacScore = Math.max(0, Math.min(100, 100 - (avgCAC / 2)));
            }

            // Conversion Score: Higher is better. 
            // Baseline: 1% (0.01). Target: 5% (0.05).
            // Formula: (Conv / 0.05) * 100. Ex: 0.025 -> 50.
            const conversionScore = Math.max(0, Math.min(100, (avgConversion / 0.05) * 100));

            // Volume Score: Confidence based on sample size.
            // 10 campaigns = 100% confidence.
            const volumeScore = Math.min(100, (totalVolume / 10) * 100);

            const finalScore = (cacScore * 0.4) + (conversionScore * 0.4) + (volumeScore * 0.2);

            const score: RecommendationScore = {
                cacScore,
                conversionScore,
                volumeScore,
                finalScore
            };

            // 4. Generate Insights
            const insights: RecommendationInsight[] = [];

            if (validCACCount > 0) {
                if (avgCAC < 60) insights.push({ type: 'positive', text: 'CAC Excelente (< R$ 60)' });
                else if (avgCAC > 150) insights.push({ type: 'negative', text: 'CAC Alto (> R$ 150)' });
            } else {
                insights.push({ type: 'neutral', text: 'Sem dados de CAC' });
            }

            if (avgConversion > 0.03) insights.push({ type: 'positive', text: 'Alta Conversão (> 3%)' });
            else if (avgConversion < 0.005 && validConvCount > 0) insights.push({ type: 'negative', text: 'Baixa Conversão (< 0.5%)' });

            if (totalVolume < 3) insights.push({ type: 'neutral', text: 'Volume baixo (pouca confiança)' });
            if (totalVolume > 10) insights.push({ type: 'positive', text: 'Volume alto (alta confiança)' });

            results.push({
                id: key,
                combo,
                metrics,
                score,
                insights,
                sampleActivities: acts.sort((a, b) => b.dataDisparo.getTime() - a.dataDisparo.getTime()) // removed slice
            });
        });

        // Sort by final score desc
        return results.sort((a, b) => b.score.finalScore - a.score.finalScore);

    }, [activities]);

    return recommendations;
};
