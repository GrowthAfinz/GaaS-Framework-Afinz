export const GROWTH_LEARNING_SECTIONS = ['feed', 'bets', 'outcomes', 'memory', 'report-live'] as const;

export type GrowthLearningSection = typeof GROWTH_LEARNING_SECTIONS[number];

export const GROWTH_CONTEXT_SURFACES = [
  'reports_overview',
  'reports_daily',
  'reports_monthly',
  'acquisition_funnel',
] as const;

export type GrowthContextSurface = typeof GROWTH_CONTEXT_SURFACES[number];
export type GrowthContextFront = 'crm_acquisition' | 'paid_media' | 'b2c_origin';

export interface GrowthBetSourceContext {
  front: GrowthContextFront;
  sourceSurface: GrowthContextSurface;
  sourceRoute: string;
  periodStart: string;
  periodEnd: string;
  filters: Record<string, unknown>;
  entityKey?: string;
  metricName?: string;
  visualRef?: string;
  title: string;
  verificationView: string;
}

const SECTION_SET = new Set<string>(GROWTH_LEARNING_SECTIONS);
const CONTEXT_SURFACE_SET = new Set<string>(GROWTH_CONTEXT_SURFACES);
const CONTEXT_FRONT_SET = new Set<string>(['crm_acquisition', 'paid_media', 'b2c_origin']);
const CONTEXT_ACTION = 'contextual-bet';
const CONTEXT_PARAM = 'growth_context';

function clearContextParams(params: URLSearchParams): void {
  params.delete('create');
  params.delete(CONTEXT_PARAM);
}

export function isGrowthLearningView(search: string): boolean {
  return new URLSearchParams(search).get('view') === 'learning';
}

export function readGrowthLearningSection(search: string): GrowthLearningSection {
  const section = new URLSearchParams(search).get('section');
  return section && SECTION_SET.has(section) ? section as GrowthLearningSection : 'feed';
}

export function buildGrowthLearningSearch(
  section: GrowthLearningSection,
  currentSearch: string,
): string {
  const params = new URLSearchParams(currentSearch);
  params.set('view', 'learning');
  params.set('section', section);
  params.delete('item');
  clearContextParams(params);
  const serialized = params.toString();
  return serialized ? `?${serialized}` : '';
}

export function buildReportsOutputSearch(currentSearch: string): string {
  const params = new URLSearchParams(currentSearch);
  params.delete('view');
  params.delete('section');
  params.delete('item');
  clearContextParams(params);
  const serialized = params.toString();
  return serialized ? `?${serialized}` : '';
}

export function hasGrowthLearningRouteContext(search: string): boolean {
  const params = new URLSearchParams(search);
  const section = params.get('section');
  return params.get('view') === 'learning' || Boolean(section && SECTION_SET.has(section));
}

function updateBrowserSearch(search: string): void {
  if (typeof window === 'undefined') return;
  const nextUrl = `${window.location.pathname}${search}${window.location.hash}`;
  window.history.pushState({}, '', nextUrl);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export function readGrowthLearningItem(search: string): string | null {
  return new URLSearchParams(search).get('item');
}

export function buildGrowthLearningItemSearch(itemId: string | null, currentSearch: string): string {
  const params = new URLSearchParams(currentSearch);
  params.set('view', 'learning');
  params.set('section', 'feed');
  if (itemId) params.set('item', itemId);
  else params.delete('item');
  clearContextParams(params);
  const serialized = params.toString();
  return serialized ? `?${serialized}` : '';
}

export function buildGrowthLearningSectionItemSearch(
  section: GrowthLearningSection,
  itemId: string | null,
  currentSearch: string,
): string {
  const params = new URLSearchParams(currentSearch);
  params.set('view', 'learning');
  params.set('section', section);
  if (itemId) params.set('item', itemId);
  else params.delete('item');
  clearContextParams(params);
  const serialized = params.toString();
  return serialized ? `?${serialized}` : '';
}

export function openGrowthLearningItem(itemId: string): void {
  if (typeof window === 'undefined') return;
  const search = buildGrowthLearningItemSearch(itemId, window.location.search);
  const nextUrl = `${window.location.pathname}${search}${window.location.hash}`;
  window.history.pushState({ growthLearningItem: true }, '', nextUrl);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export function openGrowthLearningSectionItem(section: GrowthLearningSection, itemId: string): void {
  if (typeof window === 'undefined') return;
  const search = buildGrowthLearningSectionItemSearch(section, itemId, window.location.search);
  const nextUrl = `${window.location.pathname}${search}${window.location.hash}`;
  window.history.pushState({ growthLearningItem: true }, '', nextUrl);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export function closeGrowthLearningItem(): void {
  if (typeof window === 'undefined') return;
  if (window.history.state?.growthLearningItem) {
    window.history.back();
    return;
  }
  const search = buildGrowthLearningSectionItemSearch(
    readGrowthLearningSection(window.location.search),
    null,
    window.location.search,
  );
  const nextUrl = `${window.location.pathname}${search}${window.location.hash}`;
  window.history.replaceState({}, '', nextUrl);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export function openGrowthLearningSection(section: GrowthLearningSection): void {
  if (typeof window === 'undefined') return;
  updateBrowserSearch(buildGrowthLearningSearch(section, window.location.search));
}

function isIsoDate(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function readGrowthBetSourceContext(search: string): GrowthBetSourceContext | null {
  const params = new URLSearchParams(search);
  if (params.get('create') !== CONTEXT_ACTION) return null;
  const serialized = params.get(CONTEXT_PARAM);
  if (!serialized) return null;
  try {
    const value = JSON.parse(serialized) as Partial<GrowthBetSourceContext>;
    const filtersAreObject = Boolean(value.filters)
      && typeof value.filters === 'object'
      && !Array.isArray(value.filters);
    if (!value.front || !CONTEXT_FRONT_SET.has(value.front)
      || !value.sourceSurface || !CONTEXT_SURFACE_SET.has(value.sourceSurface)
      || typeof value.sourceRoute !== 'string' || !value.sourceRoute.trim()
      || !isIsoDate(value.periodStart) || !isIsoDate(value.periodEnd)
      || value.periodStart > value.periodEnd
      || !filtersAreObject
      || typeof value.title !== 'string' || !value.title.trim()
      || typeof value.verificationView !== 'string' || !value.verificationView.trim()) {
      return null;
    }
    return value as GrowthBetSourceContext;
  } catch {
    return null;
  }
}

export function buildGrowthBetSourceContextSearch(
  context: GrowthBetSourceContext,
  currentSearch: string,
): string {
  const params = new URLSearchParams(currentSearch);
  params.set('view', 'learning');
  params.set('section', 'bets');
  params.delete('item');
  params.set('create', CONTEXT_ACTION);
  params.set(CONTEXT_PARAM, JSON.stringify(context));
  return `?${params.toString()}`;
}

export function buildCloseGrowthBetSourceContextSearch(currentSearch: string): string {
  const params = new URLSearchParams(currentSearch);
  clearContextParams(params);
  return params.toString() ? `?${params.toString()}` : '';
}

export function openGrowthBetSourceContext(context: GrowthBetSourceContext): void {
  if (typeof window === 'undefined') return;
  const search = buildGrowthBetSourceContextSearch(context, window.location.search);
  const nextUrl = `${window.location.pathname}${search}${window.location.hash}`;
  window.history.pushState({ growthBetSourceContext: true }, '', nextUrl);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export function closeGrowthBetSourceContext(): void {
  if (typeof window === 'undefined') return;
  if (window.history.state?.growthBetSourceContext) {
    window.history.back();
    return;
  }
  const search = buildCloseGrowthBetSourceContextSearch(window.location.search);
  const nextUrl = `${window.location.pathname}${search}${window.location.hash}`;
  window.history.replaceState({}, '', nextUrl);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export function completeGrowthBetSourceContext(betId: string): void {
  if (typeof window === 'undefined') return;
  const params = new URLSearchParams(window.location.search);
  clearContextParams(params);
  params.set('view', 'learning');
  params.set('section', 'bets');
  params.set('item', betId);
  const nextUrl = `${window.location.pathname}?${params.toString()}${window.location.hash}`;
  window.history.replaceState({ growthLearningItem: true }, '', nextUrl);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export function openReportsOutput(): void {
  if (typeof window === 'undefined') return;
  if (!hasGrowthLearningRouteContext(window.location.search)) return;
  updateBrowserSearch(buildReportsOutputSearch(window.location.search));
}
