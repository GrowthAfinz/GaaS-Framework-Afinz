import { supabase } from '../../services/supabaseClient';
import { listInvestigations } from '../growth-learning/investigations/investigationService';
import type { Investigation } from '../growth-learning/investigations/investigation.types';
import type { GrowthBetSourceLink } from '../growth-learning/bets/relatedGrowthBets.logic';
import type { GrowthLearning } from '../growth-learning/memory/growthMemory.types';
import type { ResultRetrospective, ResultsDomain } from '../growth-learning/results/results.types';
import { DOMAIN_FRONT, linkTargetsNote } from './scopedRecords.logic';

// Read-only. Every query goes through the authenticated client, so RLS and investigation access rules apply.
export async function fetchScopedBets(domain: ResultsDomain): Promise<GrowthBetSourceLink[]> {
  const { data, error } = await supabase.from('growth_bet_source_links_v').select('*').eq('front', DOMAIN_FRONT[domain]).order('updated_at', { ascending: false }).limit(500);
  if (error) throw error;
  return (data || []) as GrowthBetSourceLink[];
}

export async function fetchScopedLearnings(domain: ResultsDomain, relativePath: string): Promise<{ learnings: GrowthLearning[]; linked: Set<string> }> {
  const [memory, links] = await Promise.all([
    supabase.from('growth_memory_active_v').select('*').eq('front', DOMAIN_FRONT[domain]).order('updated_at', { ascending: false }).limit(500),
    supabase.from('growth_learning_links').select('learning_id,target_id').eq('target_type', 'vault_note').limit(2000),
  ]);
  if (memory.error) throw memory.error;
  if (links.error) throw links.error;
  const linked = new Set(((links.data || []) as { learning_id: string; target_id: string }[]).filter(link => linkTargetsNote(link.target_id, relativePath)).map(link => link.learning_id));
  const learnings = (memory.data || []) as GrowthLearning[];
  const missing = [...linked].filter(id => !learnings.some(learning => learning.id === id));
  if (missing.length) {
    const extra = await supabase.from('growth_memory_active_v').select('*').in('id', missing);
    if (extra.error) throw extra.error;
    learnings.push(...((extra.data || []) as GrowthLearning[]));
  }
  return { learnings, linked };
}

export async function fetchScopedRetrospectives(domain: ResultsDomain): Promise<ResultRetrospective[]> {
  const { data, error } = await supabase.from('growth_result_retrospectives').select('id,domain,scope,period,revision,observation,interpretation,learning,next_action,evidence,created_at')
    .eq('domain', domain).order('period', { ascending: false }).order('revision', { ascending: false }).limit(500);
  if (error) throw error;
  // Append-only versions: keep the latest revision of each scope and period.
  const latest = new Map<string, ResultRetrospective>();
  for (const row of (data || []) as ResultRetrospective[]) {
    const key = JSON.stringify([row.period, row.scope]);
    if (!latest.has(key) || latest.get(key)!.revision < row.revision) latest.set(key, row);
  }
  return [...latest.values()];
}

export async function fetchScopedInvestigations(domain: ResultsDomain): Promise<Investigation[]> {
  return domain === 'crm' ? listInvestigations() : [];
}
