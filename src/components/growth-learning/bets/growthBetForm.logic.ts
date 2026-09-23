import { format } from 'date-fns';
import { GrowthFeedEvent } from '../feed/growthFeed.types';
import { GrowthBetSourceContext } from '../growthLearningNavigation';
import { GrowthBetDraft, GrowthBetDirection } from './growthBet.types';

const DIRECTIONS = new Set<GrowthBetDirection>(['maior_melhor', 'menor_melhor', 'atingir_meta']);

export function buildGrowthBetDraft(event: GrowthFeedEvent, today = new Date()): GrowthBetDraft {
  const snapshot = event.summary_snapshot;
  const direction = DIRECTIONS.has(snapshot.expected_direction as GrowthBetDirection)
    ? snapshot.expected_direction as GrowthBetDirection
    : 'atingir_meta';
  const metric = snapshot.success_metric || '';
  const expected = snapshot.expected_value === undefined ? '' : String(snapshot.expected_value);
  const unit = snapshot.expected_unit || '';
  const criterion = metric && expected
    ? `${metric} deve atingir ${expected}${unit ? ` ${unit}` : ''}`
    : '';
  return {
    teamScope: '',
    owner: '',
    hypothesis: snapshot.title || '',
    actionText: snapshot.action_text || snapshot.summary || '',
    metricName: metric,
    baselineValue: '',
    expectedValue: expected,
    expectedDirection: direction,
    expectedUnit: unit,
    successCriterion: criterion,
    executionDueAt: '',
    outcomeWindowStart: format(today, 'yyyy-MM-dd'),
    outcomeWindowEnd: snapshot.outcome_window_end || '',
    verificationView: snapshot.verification_view || snapshot.source_view || '',
    stopCondition: '',
    knownAlternatives: '',
  };
}

export function buildContextualGrowthBetDraft(
  context: GrowthBetSourceContext,
  today = new Date(),
): GrowthBetDraft {
  const teamByFront = {
    crm_acquisition: 'CRM Aquisição',
    paid_media: 'Mídia Paga',
    b2c_origin: 'Originação B2C',
  } as const;
  return {
    teamScope: teamByFront[context.front],
    owner: '',
    hypothesis: '',
    actionText: '',
    metricName: context.metricName || '',
    baselineValue: '',
    expectedValue: '',
    expectedDirection: 'atingir_meta',
    expectedUnit: '',
    successCriterion: '',
    executionDueAt: '',
    outcomeWindowStart: format(today, 'yyyy-MM-dd'),
    outcomeWindowEnd: '',
    verificationView: context.verificationView,
    stopCondition: '',
    knownAlternatives: '',
  };
}

export function validateGrowthBetDraft(draft: GrowthBetDraft): Record<string, string> {
  const errors: Record<string, string> = {};
  const requiredText: Array<[keyof GrowthBetDraft, string]> = [
    ['teamScope', 'Informe o time responsável.'],
    ['hypothesis', 'Descreva a hipótese.'],
    ['actionText', 'Descreva a ação.'],
    ['metricName', 'Informe a métrica.'],
    ['successCriterion', 'Defina o critério de sucesso.'],
    ['outcomeWindowStart', 'Informe o início da janela.'],
    ['outcomeWindowEnd', 'Informe o fim da janela.'],
    ['verificationView', 'Informe a view de verificação.'],
  ];
  requiredText.forEach(([field, message]) => {
    if (!String(draft[field]).trim()) errors[field] = message;
  });
  if (!draft.baselineValue.trim() || !Number.isFinite(Number(draft.baselineValue))) {
    errors.baselineValue = 'Informe um baseline numérico.';
  }
  if (!draft.expectedValue.trim() || !Number.isFinite(Number(draft.expectedValue))) {
    errors.expectedValue = 'Informe uma expectativa numérica.';
  }
  if (draft.outcomeWindowStart && draft.outcomeWindowEnd && draft.outcomeWindowStart > draft.outcomeWindowEnd) {
    errors.outcomeWindowEnd = 'O fim da janela não pode vir antes do início.';
  }
  return errors;
}
