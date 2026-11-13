export const GROWTH_LEARNING_SECTIONS = ['feed', 'vault', 'daily', 'structure', 'corrections', 'investigations', 'report-live', 'bets', 'outcomes', 'memory'] as const;

export type GrowthLearningSection = typeof GROWTH_LEARNING_SECTIONS[number];

export const GROWTH_CONTEXT_SURFACES = [
  'reports_overview',
  'reports_daily',
  'reports_monthly',
  'acquisition_funnel',
  'results_dossier',
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

/** Seções que moraram no Loop e foram para Planejamento > Operação (13/11/2026), na ordem das abas. */
export const OPERATION_SECTIONS = ['feed', 'daily', 'structure', 'investigations'] as const satisfies readonly GrowthLearningSection[];
export type GrowthWorkspace = 'operacao' | 'learning';

const SECTION_SET = new Set<string>(GROWTH_LEARNING_SECTIONS);
const OPERATION_SET = new Set<string>(OPERATION_SECTIONS);

export function workspaceOfSection(section: GrowthLearningSection): GrowthWorkspace {
  return OPERATION_SET.has(section) ? 'operacao' : 'learning';
}

/** Valor de ?view= de uma seção: as da Operação têm aba própria, o resto continua no Loop. */
function viewSlugOf(section: GrowthLearningSection): string {
  return workspaceOfSection(section) === 'operacao' ? 'operacao' : 'learning';
}

function normalizeSection(raw: string | null): GrowthLearningSection | null {
  const section = raw === 'records' ? 'memory' : raw === 'results' ? 'vault' : raw;
  return section && SECTION_SET.has(section) ? section as GrowthLearningSection : null;
}

/** Aba dona da URL quando ela traz uma seção do Loop ou da Operação; null se não traz nenhuma. */
export function workspaceOfSearch(search: string): GrowthWorkspace | null {
  const section = normalizeSection(new URLSearchParams(search).get('section'));
  return section ? workspaceOfSection(section) : null;
}
const CONTEXT_SURFACE_SET = new Set<string>(GROWTH_CONTEXT_SURFACES);
const CONTEXT_FRONT_SET = new Set<string>(['crm_acquisition', 'paid_media', 'b2c_origin']);
const CONTEXT_ACTION = 'contextual-bet';
const CONTEXT_PARAM = 'growth_context';

function clearContextParams(params: URLSearchParams): void {
  params.delete('create');
  params.delete(CONTEXT_PARAM);
  params.delete('dev_task');
  params.delete('task_view');
  params.delete('task_space');
  for (const key of [...params.keys()]) if (key.startsWith('work_')) params.delete(key);
}

export function isGrowthLearningView(search: string): boolean {
  const view = new URLSearchParams(search).get('view');
  return view === 'learning' || view === 'operacao';
}

/**
 * Seção ativa. Com `workspace`, só aceita seções daquela aba; sem seção válida cai na
 * Visão Daily (Operação) ou na Wiki (Loop).
 */
export function readGrowthLearningSection(search: string, workspace?: GrowthWorkspace): GrowthLearningSection {
  const params = new URLSearchParams(search);
  const section = normalizeSection(params.get('section'));
  const ws = workspace ?? (section ? workspaceOfSection(section) : params.get('view') === 'learning' ? 'learning' : 'operacao');
  if (section && workspaceOfSection(section) === ws) return section;
  return ws === 'operacao' ? 'daily' : 'vault';
}

export function buildResultsWikiSearch(currentSearch: string): string {
  const params = new URLSearchParams(currentSearch);
  for (const key of [...params.keys()]) if (key.startsWith('result_') || ['item','create','growth_context','wiki_q','wiki_folder','wiki_browse'].includes(key)) params.delete(key);
  params.set('view','learning');
  params.set('section','vault');
  params.set('wiki_topic','results');
  return '?'+params.toString();
}

export function buildGrowthLearningSearch(
  section: GrowthLearningSection,
  currentSearch: string,
): string {
  const params = new URLSearchParams(currentSearch);
  params.set('view', viewSlugOf(section));
  if(section !== 'vault'){params.delete('wiki_ai');params.delete('ai_objective');}
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
  const view = params.get('view');
  return view === 'learning' || view === 'operacao' || Boolean(section && SECTION_SET.has(section));
}

function updateBrowserSearch(search: string): void {
  if (typeof window === 'undefined') return;
  const nextUrl = `${window.location.pathname}${search}${window.location.hash}`;
  window.history.pushState({}, '', nextUrl);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export function readGrowthLearningItem(search: string): string | null {
  const params = new URLSearchParams(search);
  return params.get('item') || (params.get('section') === 'vault' ? params.get('wiki_note') : null);
}

export function buildGrowthLearningItemSearch(itemId: string | null, currentSearch: string): string {
  const params = new URLSearchParams(currentSearch);
  params.set('view', viewSlugOf('feed'));
  params.delete('wiki_ai');params.delete('ai_objective');
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
  params.set('view', viewSlugOf(section));
  if(section !== 'vault'){params.delete('wiki_ai');params.delete('ai_objective');}
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
  params.delete('wiki_ai');params.delete('ai_objective');
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
  params.delete('wiki_ai');params.delete('ai_objective');
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

/** Opens the existing Wiki collaboration surface; stable section IDs preserve old links. */
export function openGrowthAiContext(objective: string) {
  const params=new URLSearchParams(window.location.search);
  params.set('view','learning');params.set('section','vault');params.set('wiki_ai','1');params.set('ai_objective',objective.slice(0,4000));params.delete('item');
  window.history.pushState({},'',window.location.pathname+'?'+params);window.dispatchEvent(new PopStateEvent('popstate'));
}
