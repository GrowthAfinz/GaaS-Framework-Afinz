import { GrowthLearning, GrowthMemoryFilters } from './growthMemory.types';

export const MEMORY_SOURCE_LABELS = {
  outcome: 'Validado pelo loop',
  vault_curated: 'Curado do vault',
} as const;

export const MEMORY_CLASSIFICATION_LABELS = {
  confirmed: 'Confirmado',
  directional: 'Direcional',
  contradictory: 'Contraditório',
  inconclusive: 'Inconclusivo',
  invalidated: 'Invalidado',
} as const;

export const MEMORY_FRONT_LABELS = {
  crm_acquisition: 'CRM Aquisição',
  paid_media: 'Mídia Paga',
  b2c_origin: 'Originação B2C',
  report_live: 'Report Live',
} as const;

function searchableText(learning: GrowthLearning) {
  return [
    learning.source_title,
    learning.statement,
    learning.source_ref,
    learning.regime,
    JSON.stringify(learning.scope),
    JSON.stringify(learning.applicability),
  ].join(' ').toLocaleLowerCase('pt-BR');
}

export function filterGrowthMemory(learnings: GrowthLearning[], filters: GrowthMemoryFilters) {
  const query = filters.search.trim().toLocaleLowerCase('pt-BR');
  return learnings
    .filter((learning) => filters.source === 'all' || learning.source_kind === filters.source)
    .filter((learning) => filters.front === 'all' || learning.front === filters.front)
    .filter((learning) => filters.classification === 'all' || learning.classification === filters.classification)
    .filter((learning) => !query || searchableText(learning).includes(query))
    .sort((a, b) => {
      if (a.review_due !== b.review_due) return a.review_due ? -1 : 1;
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });
}

export function summarizeGrowthMemory(learnings: GrowthLearning[]) {
  return {
    total: learnings.length,
    validated: learnings.filter((learning) => learning.source_kind === 'outcome').length,
    curated: learnings.filter((learning) => learning.source_kind === 'vault_curated').length,
    reviewDue: learnings.filter((learning) => learning.review_due).length,
  };
}
