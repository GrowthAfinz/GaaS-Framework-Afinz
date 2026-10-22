import { supabase } from './supabaseClient';
import { readContents } from './sfmcPackageService';
import type { CommunicationTemplate } from '../types/communication';
import { indexContents } from './templateContentIndex';
import { resolvePreview } from '../utils/communicationVisualResolution';

/** Read only the explicitly selected template. Existing RLS/auth still apply. */
export async function readActivityPreview(templateId: string, channel: string) {
  const [catalog, contents] = await Promise.all([
    supabase.from('communication_templates').select('*').eq('template_id', templateId).maybeSingle(),
    readContents(templateId),
  ]);
  if (catalog.error) throw catalog.error;
  return resolvePreview({
    channel,
    templateId,
    catalog: catalog.data ? [catalog.data as CommunicationTemplate] : [],
    contents: indexContents(contents),
  });
}
