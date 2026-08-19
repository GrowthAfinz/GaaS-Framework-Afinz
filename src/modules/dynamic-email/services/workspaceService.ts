import { supabase } from '../../../services/supabaseClient';
import { BRIEFING_COLUMNS, emptyBriefingRow, type BriefingRow } from '../domain/briefing';
import type { ActivityTaxonomy, EmailAsset, LegalText, SignatureSetting, WorkspaceBriefing } from '../domain/workspace';
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
    acknowledgedMissingActivity: Boolean(record.acknowledged_missing_activity),
    legalOverride: Boolean(record.legal_override),
  });
};

export async function loadBriefings(): Promise<WorkspaceBriefing[]> {
  const { data, error } = await supabase.from('dynamic_email_briefings').select('*').order('updated_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(toBriefing);
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

export async function saveBriefing(row: WorkspaceBriefing, warnings: string[]): Promise<WorkspaceBriefing> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error('Sessão autenticada necessária para salvar.');
  const payload = {
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
    journey_confirmed: Boolean(row.__journeyConfirmed),
    acknowledged_missing_activity: Boolean(row.__meta.acknowledgedMissingActivity),
    legal_override: Boolean(row.__meta.legalOverride),
    updated_by: auth.user.id,
  };
  const { data, error } = await supabase.from('dynamic_email_briefings').upsert(payload).select().single();
  if (error) throw error;
  const snapshot = { ...payload, briefing_data: exportableRow(row) };
  const { error: versionError } = await supabase.from('dynamic_email_briefing_versions').upsert({
    briefing_id: row.__id, version: row.__meta.version, snapshot, warnings, saved_by: auth.user.id,
  }, { onConflict: 'briefing_id,version', ignoreDuplicates: true });
  if (versionError) throw versionError;
  return toBriefing(data);
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
  const { data, error } = await supabase.from('activities')
    .select('"Activity name / Taxonomia","BU","Parceiro","Segmento","Subgrupos","Safra","Produto","Ordem de disparo"')
    .eq('Canal', 'E-mail').order('Data de Disparo', { ascending: false }).limit(3000);
  if (error) throw error;
  const seen = new Set<string>();
  return (data ?? []).flatMap((row: Record<string, any>) => {
    const activityName = String(row['Activity name / Taxonomia'] ?? '');
    if (!activityName || seen.has(activityName)) return [];
    seen.add(activityName);
    const bu = String(row.BU ?? '');
    const rawPartner = String(row.Parceiro ?? '');
    return [{ activityName, bu, partner: bu.toLowerCase() === 'plurix' ? 'Plurix' : rawPartner, segment: row.Segmento ?? '', subgroup: row.Subgrupos ?? '', weekKey: row.Safra ?? '', product: row.Produto ?? '', order: row['Ordem de disparo'] ?? undefined }];
  });
}

export async function recordExport(filename: string, rows: WorkspaceBriefing[], warnings: string[]) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return;
  await supabase.from('dynamic_email_export_runs').insert({
    filename, briefing_versions: rows.map((row) => ({ id: row.__id, version: row.__meta.version })), warnings, exported_by: auth.user.id,
  });
}

export const onlyCsvRows = (rows: WorkspaceBriefing[]): BriefingRow[] => rows.filter((row) => row.__meta.status !== 'archived').map(exportableRow);
