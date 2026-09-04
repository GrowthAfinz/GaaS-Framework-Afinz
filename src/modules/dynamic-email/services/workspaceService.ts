import { supabase } from '../../../services/supabaseClient';
import { BRIEFING_COLUMNS, emptyBriefingRow, type BriefingRow } from '../domain/briefing';
import type { ActivityTaxonomy, EmailAsset, EmailFactorySegment, EmailTemplateSlot, LegalText, RulerStrategy, SignatureSetting, WorkspaceBriefing } from '../domain/workspace';
import { exportableRow, withMeta } from '../domain/workspace';

const toBriefing = (record: Record<string, any>): WorkspaceBriefing => {
  const source = record.briefing_data ?? {};
  const row = emptyBriefingRow(record.id);
  BRIEFING_COLUMNS.forEach((field) => { row[field] = String(source[field] ?? ''); });
  row.__journeyConfirmed = Boolean(record.journey_confirmed);
  return withMeta(row, {
    partner: record.partner ?? '', segment: record.segment ?? '', subgroup: record.subgroup ?? '', weekKey: record.week_key ?? '',
    activityNames: record.activity_names ?? [], campaignGroupId: record.campaign_group_id ?? record.id,
    status: record.status ?? 'draft', version: record.version ?? 1, savedAt: record.updated_at,
    templateSlotId: record.template_slot_id ?? undefined,
    acknowledgedMissingActivity: Boolean(record.acknowledged_missing_activity),
    legalOverride: Boolean(record.legal_override),
  });
};

export async function loadBriefings(): Promise<WorkspaceBriefing[]> {
  const { data, error } = await supabase.from('dynamic_email_briefings').select('*').order('updated_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(toBriefing);
}

const toTemplateSlot = (row: Record<string, any>): EmailTemplateSlot => ({
  id: row.id,
  name: row.name,
  source: row.source,
  isPrincipal: Boolean(row.is_principal),
  version: Number(row.version ?? 1),
  updatedAt: row.updated_at,
});

export async function loadTemplateSlots(): Promise<EmailTemplateSlot[]> {
  const { data, error } = await supabase.from('dynamic_email_template_slots')
    .select('*').eq('status', 'active').order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(toTemplateSlot);
}

export async function migrateLocalTemplateSlots(slots: EmailTemplateSlot[]): Promise<EmailTemplateSlot[]> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error('Sessão autenticada necessária para compartilhar templates.');
  let shared = await loadTemplateSlots();
  if (!shared.length && slots.length) {
    const { error } = await supabase.from('dynamic_email_template_slots').upsert(slots.map((slot) => ({
      id: slot.id,
      name: slot.name,
      source: slot.source,
      is_principal: false,
      version: slot.version,
      status: 'active',
      updated_by: auth.user.id,
    })), { onConflict: 'id', ignoreDuplicates: true });
    if (error) throw error;
    shared = await loadTemplateSlots();
  }
  if (shared.length && !shared.some((slot) => slot.isPrincipal)) {
    const preferred = slots.find((slot) => slot.isPrincipal && shared.some((item) => item.id === slot.id))?.id ?? shared[0].id;
    await setPrincipalTemplateSlot(preferred);
    shared = await loadTemplateSlots();
  }
  return shared;
}

export async function saveTemplateSlot(slot: EmailTemplateSlot): Promise<EmailTemplateSlot> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error('Sessão autenticada necessária para salvar templates.');
  const { data, error } = await supabase.from('dynamic_email_template_slots').upsert({
    id: slot.id,
    name: slot.name.trim(),
    source: slot.source,
    is_principal: slot.isPrincipal,
    status: 'active',
    version: slot.version,
    updated_by: auth.user.id,
    updated_at: new Date().toISOString(),
  }).select().single();
  if (error) throw error;
  return toTemplateSlot(data);
}

export async function deleteTemplateSlot(id: string): Promise<void> {
  const { error } = await supabase.from('dynamic_email_template_slots').delete().eq('id', id);
  if (error) throw error;
}

export async function setPrincipalTemplateSlot(id: string): Promise<EmailTemplateSlot[]> {
  const { error } = await supabase.rpc('set_dynamic_email_principal', { slot_id: id });
  if (error) throw error;
  return loadTemplateSlots();
}

export async function loadSignatureSettings(): Promise<SignatureSetting[]> {
  const { data, error } = await supabase.from('dynamic_email_signature_settings').select('*').order('signature_label');
  if (error) throw error;
  return (data ?? []).map((row) => ({ partner: row.partner, signatureKey: row.signature_key, signatureLabel: row.signature_label, status: row.status, effectiveFrom: row.effective_from ?? undefined }));
}

export async function saveSignatureSetting(setting: SignatureSetting): Promise<SignatureSetting> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error('Sessão autenticada necessária para gerenciar assinaturas.');
  const { data, error } = await supabase.from('dynamic_email_signature_settings').upsert({
    partner: setting.partner, signature_key: setting.signatureKey, signature_label: setting.signatureLabel,
    status: setting.status, effective_from: setting.effectiveFrom || null, updated_by: auth.user.id, updated_at: new Date().toISOString(),
  }).select().single();
  if (error) throw error;
  return { partner: data.partner, signatureKey: data.signature_key, signatureLabel: data.signature_label, status: data.status, effectiveFrom: data.effective_from ?? undefined };
}

export async function saveBriefings(entries: Array<{ row: WorkspaceBriefing; warnings: string[] }>): Promise<WorkspaceBriefing[]> {
  if (!entries.length) return [];
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error('Sessão autenticada necessária para salvar.');
  const payloads = entries.map(({ row }) => ({
    id: row.__id,
    briefing_data: exportableRow(row),
    partner: row.__meta.partner || null,
    segment: row.__meta.segment || null,
    subgroup: row.__meta.subgroup || null,
    week_key: row.__meta.weekKey || null,
    activity_names: row.__meta.activityNames,
    campaign_group_id: row.__meta.campaignGroupId,
    status: row.__meta.status,
    version: row.__meta.version,
    template_slot_id: row.__meta.templateSlotId || null,
    journey_confirmed: Boolean(row.__journeyConfirmed),
    acknowledged_missing_activity: Boolean(row.__meta.acknowledgedMissingActivity),
    legal_override: Boolean(row.__meta.legalOverride),
    updated_by: auth.user.id,
    updated_at: new Date().toISOString(),
  }));
  const { data, error } = await supabase.from('dynamic_email_briefings').upsert(payloads).select();
  if (error) throw error;
  const payloadById = new Map(payloads.map((payload) => [payload.id, payload]));
  const { error: versionError } = await supabase.from('dynamic_email_briefing_versions').upsert(entries.map(({ row, warnings }) => ({
    briefing_id: row.__id,
    version: row.__meta.version,
    snapshot: payloadById.get(row.__id),
    warnings,
    saved_by: auth.user.id,
  })), { onConflict: 'briefing_id,version', ignoreDuplicates: true });
  if (versionError) throw versionError;
  return (data ?? []).map(toBriefing);
}

export async function saveBriefing(row: WorkspaceBriefing, warnings: string[]): Promise<WorkspaceBriefing> {
  const [saved] = await saveBriefings([{ row, warnings }]);
  if (!saved) throw new Error('O Supabase não devolveu o briefing salvo.');
  return saved;
}

const toAsset = (row: Record<string, any>): EmailAsset => ({
  id: row.id, name: row.name, externalUrl: row.external_url, clickUrl: row.click_url ?? undefined, slot: row.slot,
  bu: row.bu ?? undefined, partner: row.partner ?? undefined, segment: row.segment ?? undefined,
  subgroup: row.subgroup ?? undefined, product: row.product ?? undefined, altText: row.alt_text ?? undefined,
  width: row.width ?? undefined, height: row.height ?? undefined, tags: row.tags ?? [], status: row.status, version: row.version,
});

export async function loadAssets(): Promise<EmailAsset[]> {
  const { data, error } = await supabase.from('dynamic_email_assets').select('*').neq('status', 'archived').order('updated_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(toAsset);
}

export async function saveAsset(asset: EmailAsset): Promise<EmailAsset> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error('Sessão autenticada necessária para salvar.');
  const { data, error } = await supabase.from('dynamic_email_assets').upsert({
    id: asset.id, name: asset.name, external_url: asset.externalUrl, click_url: asset.clickUrl || null, slot: asset.slot,
    bu: asset.bu || null, partner: asset.partner || null, segment: asset.segment || null, subgroup: asset.subgroup || null,
    product: asset.product || null, alt_text: asset.altText || null, width: asset.width || null, height: asset.height || null,
    tags: asset.tags, status: asset.status, version: asset.version, updated_by: auth.user.id,
  }).select().single();
  if (error) throw error;
  return toAsset(data);
}

const toLegal = (row: Record<string, any>): LegalText => ({
  id: row.id, name: row.name, legalText: row.legal_text, color: row.color, fontSize: row.font_size,
  bu: row.bu ?? undefined, partner: row.partner ?? undefined, campaignType: row.campaign_type ?? undefined,
  status: row.status, version: row.version, notes: row.notes ?? undefined,
});

export async function loadLegalTexts(): Promise<LegalText[]> {
  const { data, error } = await supabase.from('dynamic_email_legal_texts').select('*').neq('status', 'archived').order('updated_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(toLegal);
}

export async function saveLegalText(item: LegalText): Promise<LegalText> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error('Sessão autenticada necessária para salvar.');
  const { data, error } = await supabase.from('dynamic_email_legal_texts').upsert({
    id: item.id, name: item.name, legal_text: item.legalText, color: item.color, font_size: item.fontSize,
    bu: item.bu || null, partner: item.partner || null, campaign_type: item.campaignType || null,
    status: item.status, version: item.version, notes: item.notes || null, updated_by: auth.user.id,
  }).select().single();
  if (error) throw error;
  return toLegal(data);
}

export async function loadActivityTaxonomy(): Promise<ActivityTaxonomy[]> {
  const columns = '"Activity name / Taxonomia","BU","Parceiro","Segmento","Subgrupos","Safra","Produto","Ordem de disparo"';
  const [acquisition, monetization] = await Promise.all([
    supabase.from('activities').select(columns).eq('Canal', 'E-mail').order('Data de Disparo', { ascending: false }).limit(3000),
    supabase.from('rentabilizacao_activities').select(columns).eq('Canal', 'E-mail').order('Data de Disparo', { ascending: false }).limit(3000),
  ]);
  if (acquisition.error) throw acquisition.error;
  if (monetization.error) throw monetization.error;
  const seen = new Set<string>();
  const mapRows = (data: Record<string, any>[], businessFront: ActivityTaxonomy['businessFront'], sourceTable: ActivityTaxonomy['sourceTable']) => data.flatMap((row: Record<string, any>) => {
    const activityName = String(row['Activity name / Taxonomia'] ?? '');
    const uniqueKey = `${sourceTable}:${activityName}`;
    if (!activityName || seen.has(uniqueKey)) return [];
    seen.add(uniqueKey);
    const bu = String(row.BU ?? '');
    const rawPartner = String(row.Parceiro ?? '');
    return [{ activityName, bu, partner: bu.toLowerCase() === 'plurix' ? 'Plurix' : rawPartner, segment: row.Segmento ?? '', subgroup: row.Subgrupos ?? '', weekKey: row.Safra ?? '', product: row.Produto ?? '', order: row['Ordem de disparo'] ?? undefined, businessFront, sourceTable }];
  });
  return [
    ...mapRows(acquisition.data ?? [], 'acquisition', 'activities'),
    ...mapRows(monetization.data ?? [], 'monetization', 'rentabilizacao_activities'),
  ];
}

const segmentFromRow = (row: Record<string, any>): EmailFactorySegment => ({
  id: row.id, technicalName: row.technical_name, displayName: row.display_name,
  businessFront: row.business_front, sourceTable: row.source_table ?? undefined,
  sourceValue: row.source_value ?? undefined, partner: row.partner ?? undefined, bu: row.bu ?? undefined,
  lifecycleFamily: row.lifecycle_family ?? undefined, audienceDescription: row.audience_description ?? undefined,
  origin: row.origin, governanceStatus: row.governance_status,
});

const rulerFromRow = (row: Record<string, any>): RulerStrategy => ({
  id: row.id, name: row.name ?? undefined, description: row.description ?? undefined,
  partner: row.partner ?? '', product: row.product ?? undefined, segment: row.segment ?? '',
  businessFront: row.business_front ?? undefined, rulerFamily: row.ruler_family ?? undefined,
  journeyFamily: row.journey_family ?? undefined, journeyType: row.journey_type ?? undefined,
  objective: row.objective ?? undefined, audience: row.audience ?? undefined,
  journeyStage: row.journey_stage ?? undefined, narrativeTransformation: row.narrative_transformation ?? undefined,
  objections: row.objections ?? [], commercialIntensity: row.commercial_intensity ?? undefined,
  successCriteria: row.success_criteria ?? undefined, editorialStatus: row.editorial_status ?? 'needs_enrichment',
  templateSlotId: row.template_slot_id ?? undefined, version: row.version ?? 1,
});

export async function loadRulerStrategies(): Promise<RulerStrategy[]> {
  const { data, error } = await supabase.from('dynamic_email_ruler_strategies').select('*').order('partner').order('segment');
  if (error) throw error;
  return (data ?? []).map(rulerFromRow);
}

export async function loadEmailFactorySegments(): Promise<EmailFactorySegment[]> {
  const { data, error } = await supabase.from('dynamic_email_segments').select('*').neq('governance_status', 'archived').order('display_name');
  if (error) throw error;
  return (data ?? []).map(segmentFromRow);
}

export async function saveDraftEmailFactorySegment(input: Omit<EmailFactorySegment, 'id' | 'origin' | 'governanceStatus'>): Promise<EmailFactorySegment> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error('Sessão autenticada necessária para propor um segmento.');
  const { data: existing, error: findError } = await supabase.from('dynamic_email_segments').select('*')
    .eq('business_front', input.businessFront).ilike('technical_name', input.technicalName)
    .eq('partner', input.partner || '').neq('governance_status', 'archived').maybeSingle();
  if (findError) throw findError;
  if (existing) return segmentFromRow(existing);
  const { data, error } = await supabase.from('dynamic_email_segments').insert({
    technical_name: input.technicalName, display_name: input.displayName, business_front: input.businessFront,
    source_table: input.sourceTable || null, source_value: input.sourceValue || null, partner: input.partner || null,
    bu: input.bu || null, lifecycle_family: input.lifecycleFamily || null,
    audience_description: input.audienceDescription || null, origin: 'planned', governance_status: 'draft',
    created_by: auth.user.id, updated_by: auth.user.id,
  }).select().single();
  if (error) throw error;
  return segmentFromRow(data);
}

export async function recordExport(filename: string, rows: WorkspaceBriefing[], warnings: string[]) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return;
  await supabase.from('dynamic_email_export_runs').insert({
    filename, briefing_versions: rows.map((row) => ({ id: row.__id, version: row.__meta.version })), warnings, exported_by: auth.user.id,
  });
}

export const onlyCsvRows = (rows: WorkspaceBriefing[]): BriefingRow[] => rows.filter((row) => row.__meta.status !== 'archived').map(exportableRow);
