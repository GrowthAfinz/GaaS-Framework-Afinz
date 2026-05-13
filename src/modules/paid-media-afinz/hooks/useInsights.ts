import { useState, useEffect } from 'react';
import { dataService } from '../../../services/dataService';
import type { MediaInsight } from '../../../schemas/paid-media';

export function useInsights(channel?: string) {
  const [insights, setInsights] = useState<MediaInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadInsights();
  }, [channel]);

  async function loadInsights() {
    try {
      setLoading(true);
      const data = await dataService.fetchInsights({
        channel,
        status: 'active',
        minScore: 6,
        limit: 10,
      });
      setInsights(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function dismiss(id: string) {
    await dataService.dismissInsight(id);
    setInsights(prev => prev.filter(i => i.id !== id));
  }

  async function markDone(id: string) {
    await dataService.markInsightDone(id);
    setInsights(prev => prev.filter(i => i.id !== id));
  }

  return { insights, loading, error, dismiss, markDone, reload: loadInsights };
}
