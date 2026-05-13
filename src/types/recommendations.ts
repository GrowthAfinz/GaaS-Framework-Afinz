import { Activity } from './framework';

export interface RecommendationCombo {
    canal: string;
    oferta: string;
    segmento: string;
    promocional?: string;
    oferta2?: string;
    promocional2?: string;
    bu: string;
}

export interface RecommendationMetrics {
    avgCAC: number;
    avgConversion: number;
    totalVolume: number;
    totalCards: number;
    successRate: number; // e.g. % of campaigns that met a certain threshold
    lastExecuted: Date | null;
}

export interface RecommendationScore {
    cacScore: number;       // 0-100
    conversionScore: number; // 0-100
    volumeScore: number;    // 0-100
    finalScore: number;     // 0-100
}

export interface RecommendationInsight {
    type: 'positive' | 'negative' | 'neutral';
    text: string;
}

export interface Recommendation {
    id: string; // unique ID for the recommendation (hash of combo)
    combo: RecommendationCombo;
    metrics: RecommendationMetrics;
    score: RecommendationScore;
    insights: RecommendationInsight[];
    sampleActivities: Activity[]; // Top 3-5 activities that contributed to this score
}
