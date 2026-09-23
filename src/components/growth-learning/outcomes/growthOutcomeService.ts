import { supabase } from "../../../services/supabaseClient";
import { GrowthOutcome } from "./growthOutcome.types";

function oneRow<T>(data: T | T[] | null): T {
  const row = Array.isArray(data) ? data[0] : data;
  if (!row)
    throw new Error("O comando terminou sem retornar o outcome esperado.");
  return row;
}

export async function fetchGrowthOutcomes(): Promise<GrowthOutcome[]> {
  const { data, error } = await supabase
    .from("growth_outcomes_due_v")
    .select("*")
    .order("attention_rank", { ascending: false })
    .order("outcome_window_end", { ascending: true });
  if (error) throw error;
  return (data || []) as GrowthOutcome[];
}

export async function fetchGrowthOutcome(
  id: string,
): Promise<GrowthOutcome | null> {
  const byOutcome = await supabase
    .from("growth_outcomes_due_v")
    .select("*")
    .eq("outcome_id", id)
    .maybeSingle();
  if (byOutcome.error) throw byOutcome.error;
  if (byOutcome.data) return byOutcome.data as GrowthOutcome;
  const byBet = await supabase
    .from("growth_outcomes_due_v")
    .select("*")
    .eq("bet_id", id)
    .maybeSingle();
  if (byBet.error) throw byBet.error;
  return byBet.data as GrowthOutcome | null;
}

export async function reviewGrowthOutcome(input: {
  outcomeId: string;
  action: "confirm" | "contest";
  reason?: string;
}): Promise<unknown> {
  const { data, error } = await supabase.rpc("growth_review_outcome", {
    p_outcome_id: input.outcomeId,
    p_action: input.action,
    p_reason: input.reason?.trim() || null,
    p_resolved_verdict: null,
  });
  if (error) throw error;
  return oneRow(data);
}
