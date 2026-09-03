import { supabase } from '../../../services/supabaseClient';
import type { EmailStrategy, ExternalReviewRun, ExternalSuggestion, ProductContext, ProductGuardrail } from '../domain/management';

export type RulerManagementPlan = {
  name: string;
  description?: string;
  businessFront: 'acquisition' | 'monetization';
  rulerFamily: string;
  partner: string;
  adaptationPartners: string[];
  product?: string;
  segment: string;
  objective?: string;
  templateSlotId?: string;
  campaignGroups: Array<{ id: string; partner: string; weekKey: string; sequence: string; functionalName: string; role: string }>;
};

export async function createRulerManagementPlan(plan: RulerManagementPlan): Promise<string> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error('Sessão autenticada necessária para criar a régua.');
  const { data: ruler, error: rulerError } = await supabase.from('dynamic_email_ruler_strategies').insert({
    name: plan.name, description: plan.description || null, business_front: plan.businessFront,
    ruler_family: plan.rulerFamily, partner: plan.partner, product: plan.product || null,
    segment: plan.segment, objective: plan.objective || null, template_slot_id: plan.templateSlotId || null,
    audience: plan.segment, editorial_status: 'draft', created_by: auth.user.id, updated_by: auth.user.id,
  }).select('id').single();
  if (rulerError) throw rulerError;
  const { error: emailError } = await supabase.from('dynamic_email_email_strategies').insert(plan.campaignGroups.map((item) => ({
    ruler_strategy_id: ruler.id, campaign_group_id: item.id, partner: item.partner, segment: plan.segment,
    week_key: item.weekKey, sequence: item.sequence, functional_name: item.functionalName,
    role_in_ruler: item.role || null, email_objective: item.role || null,
    technical_status: 'draft', editorial_status: 'needs_enrichment', visual_status: 'draft', certification_status: 'not_tested',
    field_provenance: { ruler_creator: 'human' }, created_by: auth.user.id, updated_by: auth.user.id,
  })));
  if (emailError) { await supabase.from('dynamic_email_ruler_strategies').delete().eq('id', ruler.id); throw emailError; }
  if (plan.adaptationPartners.length) {
    const { error: adaptationError } = await supabase.from('dynamic_email_ruler_adaptations').insert(plan.adaptationPartners.map((targetPartner) => ({
      source_ruler_strategy_id: ruler.id, target_partner: targetPartner, target_product: targetPartner,
      target_segment: plan.segment, objective: plan.objective || null, status: 'drafting',
      preservation_plan: { strategy: 'shared', template: plan.templateSlotId || null },
      required_changes: { assets: true, links: true, legal: true, identity: true },
      created_by: auth.user.id, updated_by: auth.user.id,
    })));
    if (adaptationError) throw adaptationError;
  }
  return ruler.id;
}

const strategyFromRow = (row: Record<string, any>): EmailStrategy => ({
  id: row.id, campaignGroupId: row.campaign_group_id, partner: row.partner, segment: row.segment,
  weekKey: row.week_key ?? undefined, sequence: row.sequence ?? undefined, subject: row.subject ?? undefined,
  functionalName: row.functional_name ?? undefined,
  preheader: row.preheader ?? undefined, roleInRuler: row.role_in_ruler ?? undefined,
  emailObjective: row.email_objective ?? undefined, keyMessage: row.key_message ?? undefined,
  expectedAction: row.expected_action ?? undefined, valueProposition: row.value_proposition ?? undefined,
  primaryBenefit: row.primary_benefit ?? undefined, secondaryBenefits: Array.isArray(row.secondary_benefits) ? row.secondary_benefits : [],
  objectionAddressed: row.objection_addressed ?? undefined, proof: row.proof ?? undefined,
  visualHierarchyStrategy: row.visual_hierarchy_strategy ?? undefined, ctaStrategy: row.cta_strategy ?? undefined,
  technicalStatus: row.technical_status, editorialStatus: row.editorial_status, visualStatus: row.visual_status,
  certificationStatus: row.certification_status, fieldProvenance: row.field_provenance ?? {}, version: Number(row.version ?? 1),
  updatedAt: row.updated_at ?? undefined, updatedBy: row.updated_by ?? undefined,
  updatedByType: row.updated_by_type ?? 'system', updateSource: row.update_source ?? 'system',
  changeReason: row.change_reason ?? undefined, llmModel: row.llm_model ?? undefined, llmRunId: row.llm_run_id ?? undefined,
});

export async function loadEmailStrategies(): Promise<EmailStrategy[]> {
  const { data, error } = await supabase.from('dynamic_email_email_strategies').select('*').order('partner').order('segment').order('week_key').order('sequence');
  if (error) throw error;
  return (data ?? []).map(strategyFromRow);
}

export async function saveEmailStrategy(strategy: EmailStrategy): Promise<EmailStrategy> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error('Sessão autenticada necessária para salvar a estratégia.');
  const payload = {
    id: strategy.id, campaign_group_id: strategy.campaignGroupId, partner: strategy.partner, segment: strategy.segment,
    week_key: strategy.weekKey || null, sequence: strategy.sequence || null, functional_name: strategy.functionalName || null, subject: strategy.subject || null, preheader: strategy.preheader || null,
    role_in_ruler: strategy.roleInRuler || null, email_objective: strategy.emailObjective || null, key_message: strategy.keyMessage || null,
    expected_action: strategy.expectedAction || null, value_proposition: strategy.valueProposition || null, primary_benefit: strategy.primaryBenefit || null,
    secondary_benefits: strategy.secondaryBenefits, objection_addressed: strategy.objectionAddressed || null, proof: strategy.proof || null,
    visual_hierarchy_strategy: strategy.visualHierarchyStrategy || null, cta_strategy: strategy.ctaStrategy || null,
    technical_status: strategy.technicalStatus, editorial_status: strategy.editorialStatus, visual_status: strategy.visualStatus,
    certification_status: strategy.certificationStatus, field_provenance: { ...strategy.fieldProvenance, semantic_fields: 'human' },
    updated_by: auth.user.id, updated_by_type: 'human', update_source: 'gaas',
    change_reason: 'Edição humana na Fábrica de E-mails', llm_model: null, llm_run_id: null,
  };
  const { data, error } = await supabase.from('dynamic_email_email_strategies').update(payload).eq('id', strategy.id).eq('version', strategy.version).select().single();
  if (error) throw new Error(error.code === 'PGRST116' ? 'A estratégia mudou em outra sessão. Recarregue antes de salvar.' : error.message);
  return strategyFromRow(data);
}

const contextFromRow = (row: Record<string, any>): ProductContext => ({
  id: row.id, product: row.product, partner: row.partner ?? undefined,
  valueProposition: row.value_proposition ?? undefined, differentiators: row.differentiators ?? [],
  eligibleAudience: row.eligible_audience ?? undefined, toneOfVoice: row.tone_of_voice ?? undefined,
  brandContext: row.brand_context ?? undefined, status: row.status,
  provenance: row.provenance ?? undefined, sourceUrl: row.source_url ?? undefined,
  validFrom: row.valid_from ?? undefined, validTo: row.valid_to ?? undefined, version: row.version,
});

const guardrailFromRow = (row: Record<string, any>): ProductGuardrail => ({
  id: row.id, productContextId: row.product_context_id, guardrailType: row.guardrail_type,
  title: row.title, ruleText: row.rule_text, severity: row.severity, allowedStatus: row.allowed_status,
  evidence: row.evidence ?? undefined, sourceUrl: row.source_url ?? undefined, confidence: row.confidence ?? undefined,
  status: row.status,
  category: row.category ?? undefined, valueExact: row.value_exact ?? undefined,
  citationStatus: row.citation_status ?? undefined, sourceType: row.source_type ?? undefined,
  validFrom: row.valid_from ?? undefined, validTo: row.valid_to ?? undefined,
  appliesTo: row.applies_to && typeof row.applies_to === 'object' && !Array.isArray(row.applies_to) ? row.applies_to : undefined,
  version: row.version,
});

export async function loadProductGovernance(): Promise<{ contexts: ProductContext[]; guardrails: ProductGuardrail[] }> {
  const [contextsResult, guardrailsResult] = await Promise.all([
    supabase.from('dynamic_email_product_contexts').select('*').neq('status', 'archived').order('product'),
    supabase.from('dynamic_email_product_guardrails').select('*').neq('status', 'archived').order('severity').order('title'),
  ]);
  if (contextsResult.error) throw contextsResult.error;
  if (guardrailsResult.error) throw guardrailsResult.error;
  return {
    contexts: (contextsResult.data ?? []).map(contextFromRow),
    guardrails: (guardrailsResult.data ?? []).map(guardrailFromRow),
  };
}

export async function saveProductContext(context: ProductContext): Promise<ProductContext> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error('Sessão autenticada necessária para salvar a ficha do produto.');
  const payload = {
    value_proposition: context.valueProposition?.trim() || null,
    differentiators: context.differentiators.map((item) => item.trim()).filter(Boolean),
    eligible_audience: context.eligibleAudience?.trim() || null,
    tone_of_voice: context.toneOfVoice?.trim() || null,
    brand_context: context.brandContext?.trim() || null,
    provenance: context.provenance?.trim() || null,
    source_url: context.sourceUrl?.trim() || null,
    updated_by: auth.user.id,
  };
  const { data, error } = await supabase.from('dynamic_email_product_contexts')
    .update(payload).eq('id', context.id).eq('version', context.version).select().single();
  if (error) throw new Error(error.code === 'PGRST116' ? 'A ficha mudou em outra sessão. Recarregue antes de salvar.' : error.message);
  return contextFromRow(data);
}

export async function loadExternalReviews(): Promise<{ runs: ExternalReviewRun[]; suggestions: ExternalSuggestion[] }> {
  const [runsResult, suggestionsResult] = await Promise.all([
    supabase.from('dynamic_email_ai_analysis_runs').select('*').order('created_at', { ascending: false }).limit(100),
    supabase.from('dynamic_email_ai_suggestions').select('*').order('created_at', { ascending: false }).limit(500),
  ]);
  if (runsResult.error) throw runsResult.error;
  if (suggestionsResult.error) throw suggestionsResult.error;
  return {
    runs: (runsResult.data ?? []).map((row: Record<string, any>) => ({ id: row.id, scopeType: row.scope_type, scopeId: row.scope_id, analysisType: row.analysis_type, status: row.status, executor: row.executor, contextSnapshot: row.context_snapshot ?? {}, briefingVersion: row.briefing_version ?? undefined, safeError: row.safe_error ?? undefined, createdAt: row.created_at, completedAt: row.completed_at ?? undefined })),
    suggestions: (suggestionsResult.data ?? []).map((row: Record<string, any>) => ({ id: row.id, runId: row.run_id, entityType: row.entity_type, entityId: row.entity_id, fieldName: row.field_name, previousValue: row.previous_value, suggestedValue: row.suggested_value, justification: row.justification, evidence: row.evidence ?? [], confidence: row.confidence ?? undefined, severity: row.severity, status: row.status })),
  };
}

export async function decideExternalSuggestion(id: string, status: 'accepted' | 'rejected'): Promise<void> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error('Sessão autenticada necessária para registrar a decisão.');
  const { error } = await supabase.from('dynamic_email_ai_suggestions').update({ status, reviewed_by: auth.user.id, reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', id).eq('status', 'suggested');
  if (error) throw error;
}
