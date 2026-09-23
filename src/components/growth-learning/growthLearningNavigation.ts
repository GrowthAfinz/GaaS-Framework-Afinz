export const GROWTH_LEARNING_SECTIONS = ['feed', 'bets', 'outcomes', 'memory', 'report-live'] as const;

export type GrowthLearningSection = typeof GROWTH_LEARNING_SECTIONS[number];

const SECTION_SET = new Set<string>(GROWTH_LEARNING_SECTIONS);

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
  const serialized = params.toString();
  return serialized ? `?${serialized}` : '';
}

export function buildReportsOutputSearch(currentSearch: string): string {
  const params = new URLSearchParams(currentSearch);
  params.delete('view');
  params.delete('section');
  params.delete('item');
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

export function openReportsOutput(): void {
  if (typeof window === 'undefined') return;
  if (!hasGrowthLearningRouteContext(window.location.search)) return;
  updateBrowserSearch(buildReportsOutputSearch(window.location.search));
}
