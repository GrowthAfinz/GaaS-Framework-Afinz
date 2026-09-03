export type ReviewStatus = 'needs_enrichment' | 'draft' | 'needs_review' | 'ready' | 'blocked';
export type TechnicalStatus = 'draft' | 'needs_review' | 'ready' | 'blocked';
export type CertificationStatus = 'not_tested' | 'test_pending' | 'certified' | 'failed';

export interface EmailStrategy {
  id: string;
  campaignGroupId: string;
  partner: string;
  segment: string;
  weekKey?: string;
  sequence?: string;
  functionalName?: string;
  subject?: string;
  preheader?: string;
  roleInRuler?: string;
  emailObjective?: string;
  keyMessage?: string;
  expectedAction?: string;
  valueProposition?: string;
  primaryBenefit?: string;
  secondaryBenefits: string[];
  objectionAddressed?: string;
  proof?: string;
  visualHierarchyStrategy?: string;
  ctaStrategy?: string;
  technicalStatus: TechnicalStatus;
  editorialStatus: ReviewStatus;
  visualStatus: ReviewStatus;
  certificationStatus: CertificationStatus;
  fieldProvenance: Record<string, string>;
  version: number;
  updatedAt?: string;
  updatedBy?: string;
  updatedByType: 'human' | 'llm' | 'system';
  updateSource: 'gaas' | 'llm' | 'api' | 'system';
  changeReason?: string;
  llmModel?: string;
  llmRunId?: string;
}

export interface ProductContext {
  id: string;
  product: string;
  partner?: string;
  valueProposition?: string;
  differentiators: string[];
  eligibleAudience?: string;
  toneOfVoice?: string;
  brandContext?: string;
  status: 'draft' | 'active' | 'archived';
  provenance?: string;
  sourceUrl?: string;
  validFrom?: string;
  validTo?: string;
  version: number;
}

export interface ProductGuardrail {
  id: string;
  productContextId: string;
  guardrailType: 'benefit' | 'claim' | 'eligibility' | 'legal' | 'visual' | 'tone' | 'deeplink' | 'prohibited';
  title: string;
  ruleText: string;
  severity: 'hard_block' | 'requires_review' | 'advisory';
  allowedStatus: 'allowed' | 'conditional' | 'blocked';
  evidence?: string;
  sourceUrl?: string;
  confidence?: number;
  status: 'draft' | 'active' | 'archived';
  // Campos da estrutura de benefício (migration `20260904_dynamic_email_benefit_structure`).
  // Lidos de forma defensiva: quando a coluna ainda não existe no banco, vêm `undefined`.
  category?: string;
  valueExact?: string;
  citationStatus?: 'pode' | 'nao' | 'cuidado' | 'checar';
  sourceType?: 'oficial' | 'terceira' | 'interno';
  validFrom?: string;
  validTo?: string;
  appliesTo?: Record<string, string[]>;
  version: number;
}

export interface ExternalReviewRun {
  id: string;
  scopeType: 'email' | 'week' | 'ruler' | 'adaptation';
  scopeId: string;
  analysisType: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled' | 'conflict';
  executor: string;
  contextSnapshot: Record<string, unknown>;
  briefingVersion?: number;
  safeError?: string;
  createdAt: string;
  completedAt?: string;
}

export interface ExternalSuggestion {
  id: string;
  runId: string;
  entityType: string;
  entityId: string;
  fieldName: string;
  previousValue: unknown;
  suggestedValue: unknown;
  justification: string;
  evidence: unknown[];
  confidence?: number;
  severity: 'hard_block' | 'requires_review' | 'advisory';
  status: 'suggested' | 'accepted' | 'edited' | 'rejected' | 'auto_applied';
}

export const strategyReadiness = (strategy?: EmailStrategy) => {
  if (!strategy) return { label: 'Sem contexto', tone: 'neutral' as const };
  if (strategy.technicalStatus === 'blocked' || strategy.editorialStatus === 'blocked' || strategy.visualStatus === 'blocked') return { label: 'Bloqueado', tone: 'danger' as const };
  if (strategy.technicalStatus === 'ready' && strategy.editorialStatus === 'ready' && strategy.visualStatus === 'ready') return { label: strategy.certificationStatus === 'certified' ? 'Certificado' : 'Pronto para teste', tone: 'success' as const };
  if (strategy.editorialStatus === 'needs_enrichment') return { label: 'Enriquecer estratégia', tone: 'warning' as const };
  return { label: 'Em revisão', tone: 'warning' as const };
};

export const STRATEGY_FIELD_COUNT = 11;

export const countConfiguredStrategyFields = (strategy?: EmailStrategy) => {
  if (!strategy) return 0;
  const textFields = [strategy.roleInRuler, strategy.emailObjective, strategy.keyMessage, strategy.expectedAction, strategy.valueProposition, strategy.primaryBenefit, strategy.objectionAddressed, strategy.proof, strategy.visualHierarchyStrategy, strategy.ctaStrategy];
  return textFields.filter((value) => Boolean(value?.trim())).length + Number(strategy.secondaryBenefits.some((value) => Boolean(value.trim())));
};

