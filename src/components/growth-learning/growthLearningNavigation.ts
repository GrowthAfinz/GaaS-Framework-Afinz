export const GROWTH_LEARNING_SECTIONS = ['feed', 'report-live', 'bets', 'outcomes', 'memory'] as const;

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

export function parseGrowthBetSourceContext(value: unknown): GrowthBetSourceContext | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
  const candidate: Partial<GrowthBetSourceContext> = {
    front: raw.front as GrowthContextFront | undefined,
    sourceSurface: (raw.sourceSurface ?? raw.source_surface) as GrowthContextSurface | undefined,
    sourceRoute: (raw.sourceRoute ?? raw.source_route) as string | undefined,
    periodStart: (raw.periodStart ?? raw.period_start) as string | undefined,
    periodEnd: (raw.periodEnd ?? raw.period_end) as string | undefined,
    filters: raw.filters as Record<string, unknown> | undefined,
    entityKey: (raw.entityKey ?? raw.entity_key) as string | undefined,
    metricName: (raw.metricName ?? raw.metric_name) as string | undefined,
    visualRef: (raw.visualRef ?? raw.visual_ref) as string | undefined,
    title: raw.title as string | undefined,
    verificationView: (raw.verificationView ?? raw.verification_view) as string | undefined,
  };
  const filtersAreObject = Boolean(candidate.filters)
    && typeof candidate.filters === 'object'
    && !Array.isArray(candidate.filters);
  if (!candidate.front || !CONTEXT_FRONT_SET.has(candidate.front)
    || !candidate.sourceSurface || !CONTEXT_SURFACE_SET.has(candidate.sourceSurface)
    || typeof candidate.sourceRoute !== 'string' || !candidate.sourceRoute.trim()
    || !isIsoDate(candidate.periodStart) || !isIsoDate(candidate.periodEnd)
    || candidate.periodStart > candidate.periodEnd
    || !filtersAreObject
    || typeof candidate.title !== 'string' || !candidate.title.trim()
    || typeof candidate.verificationView !== 'string' || !candidate.verificationView.trim()) {
    return null;
  }
  return candidate as GrowthBetSourceContext;
}

export function readGrowthBetSourceContextFromBeliefSnapshot(
  beliefSnapshot: Record<string, unknown>,
): GrowthBetSourceContext | null {
  return parseGrowthBetSourceContext(beliefSnapshot.source_context);
}

export function readGrowthBetSourceContext(search: string): GrowthBetSourceContext | null {
  const params = new URLSearchParams(search);
  if (params.get('create') !== CONTEXT_ACTION) return null;
  const serialized = params.get(CONTEXT_PARAM);
  if (!serialized) return null;
  try {
    return parseGrowthBetSourceContext(JSON.parse(serialized));
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
