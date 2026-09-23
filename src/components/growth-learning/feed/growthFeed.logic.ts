import {
  GROWTH_FEED_CONFIDENCES,
  GROWTH_FEED_FRONTS,
  GROWTH_FEED_SORTS,
  GROWTH_FEED_STATES,
  GrowthFeedConfidenceFilter,
  GrowthFeedEvent,
  GrowthFeedFilters,
  GrowthFeedFrontFilter,
  GrowthFeedGroup,
  GrowthFeedSort,
  GrowthFeedStateFilter,
} from './growthFeed.types';

function isOneOf<T extends readonly string[]>(value: string | null, values: T): value is T[number] {
  return Boolean(value && values.includes(value));
}

export function readGrowthFeedFilters(search: string): GrowthFeedFilters {
  const params = new URLSearchParams(search);
  const front = params.get('front');
  const confidence = params.get('confidence');
  const state = params.get('state');
  const sort = params.get('sort');
  return {
    front: isOneOf(front, GROWTH_FEED_FRONTS) ? front as GrowthFeedFrontFilter : 'all',
    confidence: isOneOf(confidence, GROWTH_FEED_CONFIDENCES) ? confidence as GrowthFeedConfidenceFilter : 'all',
    state: isOneOf(state, GROWTH_FEED_STATES) ? state as GrowthFeedStateFilter : 'all',
    sort: isOneOf(sort, GROWTH_FEED_SORTS) ? sort as GrowthFeedSort : 'priority',
  };
}

export function buildGrowthFeedFilterSearch(filters: GrowthFeedFilters, currentSearch: string): string {
  const params = new URLSearchParams(currentSearch);
  const setOrDelete = (key: string, value: string, fallback: string) => {
    if (value === fallback) params.delete(key);
    else params.set(key, value);
  };
  setOrDelete('front', filters.front, 'all');
  setOrDelete('confidence', filters.confidence, 'all');
  setOrDelete('state', filters.state, 'all');
  setOrDelete('sort', filters.sort, 'priority');
  const serialized = params.toString();
  return serialized ? `?${serialized}` : '';
}

function normalizedState(event: GrowthFeedEvent): string {
  const state = event.event_state || event.summary_snapshot.event_state || 'open';
  return [
    'candidate', 'backlog', 'new', 'pending',
    'approved', 'in_progress', 'waiting_window', 'ready_for_review',
    'system_evaluated', 'contested',
    'needs_validation', 'needs_revalidation',
  ].includes(state) ? 'open' : state;
}

function relevanceScore(event: GrowthFeedEvent, filters: GrowthFeedFilters, now: Date): number {
  const ageDays = Math.max(0, (now.getTime() - new Date(event.occurred_at).getTime()) / 86_400_000);
  const frontMatch = filters.front !== 'all' && event.front === filters.front ? 12 : 0;
  const confidenceMatch = filters.confidence !== 'all' && event.confidence_status === filters.confidence ? 8 : 0;
  const stateMatch = filters.state !== 'all' && normalizedState(event) === filters.state ? 8 : 0;
  const openBonus = ['open', 'candidate', 'pending', 'blocked', 'certified'].includes(normalizedState(event)) ? 6 : 0;
  return Number(event.priority_score) + frontMatch + confidenceMatch + stateMatch + openBonus - Math.min(ageDays, 30);
}

export function filterAndGroupGrowthFeed(
  events: GrowthFeedEvent[],
  filters: GrowthFeedFilters,
  now = new Date(),
): GrowthFeedGroup[] {
  const filtered = events.filter((event) => {
    if (filters.front !== 'all' && event.front !== filters.front) return false;
    if (filters.confidence !== 'all' && event.confidence_status !== filters.confidence) return false;
    if (filters.state !== 'all' && normalizedState(event) !== filters.state) return false;
    return true;
  });

  const byGroup = new Map<string, GrowthFeedEvent[]>();
  filtered.forEach((event) => {
    const groupKey = event.group_key || event.relevance_dimensions.group_key || `${event.subject_type}:${event.subject_id}`;
    const members = byGroup.get(groupKey) || [];
    members.push(event);
    byGroup.set(groupKey, members);
  });

  const groups = Array.from(byGroup.entries()).map(([groupKey, members]) => {
    const eventsByDate = [...members].sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime());
    return { groupKey, representative: eventsByDate[0], events: eventsByDate };
  });

  return groups.sort((a, b) => {
    if (filters.sort === 'recent') {
      return new Date(b.representative.occurred_at).getTime() - new Date(a.representative.occurred_at).getTime();
    }
    if (filters.sort === 'relevance') {
      return relevanceScore(b.representative, filters, now) - relevanceScore(a.representative, filters, now);
    }
    return Number(b.representative.priority_score) - Number(a.representative.priority_score)
      || new Date(b.representative.occurred_at).getTime() - new Date(a.representative.occurred_at).getTime();
  });
}
