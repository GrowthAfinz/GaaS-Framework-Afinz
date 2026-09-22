import { addDays, format } from 'date-fns';
import { supabase } from '../../../services/supabaseClient';
import { GrowthFeedEvent } from './growthFeed.types';

const FEED_COLUMNS = '*';

export async function fetchGrowthFeed(periodStart: Date, periodEnd: Date): Promise<GrowthFeedEvent[]> {
  const start = `${format(periodStart, 'yyyy-MM-dd')}T00:00:00`;
  const endExclusive = `${format(addDays(periodEnd, 1), 'yyyy-MM-dd')}T00:00:00`;
  const { data, error } = await supabase
    .from('growth_feed_v')
    .select(FEED_COLUMNS)
    .gte('occurred_at', start)
    .lt('occurred_at', endExclusive)
    .order('occurred_at', { ascending: false })
    .limit(500);
  if (error) throw error;
  return (data || []) as GrowthFeedEvent[];
}

export async function fetchGrowthFeedItem(id: string): Promise<GrowthFeedEvent | null> {
  const { data, error } = await supabase
    .from('growth_feed_v')
    .select(FEED_COLUMNS)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data as GrowthFeedEvent | null;
}
