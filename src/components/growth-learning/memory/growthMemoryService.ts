import { supabase } from '../../../services/supabaseClient';
import { GrowthLearning, GrowthLearningRevision } from './growthMemory.types';

export async function fetchGrowthMemory(): Promise<GrowthLearning[]> {
  const { data, error } = await supabase
    .from('growth_memory_active_v')
    .select('*')
    .order('review_at', { ascending: true })
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data || []) as GrowthLearning[];
}

export async function fetchGrowthLearning(id: string): Promise<GrowthLearning | null> {
  const { data, error } = await supabase
    .from('growth_memory_active_v')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data as GrowthLearning | null;
}

export async function fetchGrowthLearningRevisions(learningId: string): Promise<GrowthLearningRevision[]> {
  const { data, error } = await supabase
    .from('growth_learning_revisions')
    .select('*')
    .eq('learning_id', learningId)
    .order('revision', { ascending: false });
  if (error) throw error;
  return (data || []) as GrowthLearningRevision[];
}
