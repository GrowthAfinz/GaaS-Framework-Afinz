import { supabase } from "../../../services/supabaseClient";
import type {
  KnowledgeContribution,
  KnowledgeManifest,
  KnowledgePack,
  KnowledgeSnapshot,
  NoteChange,
} from "./knowledge.types";

export async function activeKnowledgeReport(): Promise<Record<
  string,
  unknown
> | null> {
  const { data, error } = await supabase
    .from("report_runs")
    .select(
      "id,period_start,period_end,published_at,publication_version,report_profile,sheet_url,slides_url",
    )
    .eq("report_type", "midia_paga_crm_mensal")
    .eq("status", "done")
    .eq("publication_valid", true)
    .eq("publication_status", "published")
    .order("published_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchKnowledgeSnapshot(): Promise<KnowledgeSnapshot> {
  const { data, error } = await supabase.rpc("gaas_knowledge_snapshot");
  if (error) throw error;
  if (!data || !Array.isArray(data.notes))
    throw new Error("O acervo não retornou um snapshot válido.");
  return data as KnowledgeSnapshot;
}
export async function listKnowledgePacks(): Promise<KnowledgePack[]> {
  const { data, error } = await supabase
    .from("gaas_knowledge_packs")
    .select("id,title,objective,manifest,created_at,storage_path")
    .order("created_at", { ascending: false })
    .limit(30);
  if (error) throw error;
  return data || [];
}
export async function getKnowledgePack(id: string): Promise<KnowledgePack> {
  const { data, error } = await supabase
    .from("gaas_knowledge_packs")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}
export async function downloadKnowledgePack(
  pack: KnowledgePack,
): Promise<Uint8Array> {
  const { data, error } = await supabase.storage
    .from("gaas-knowledge-packs")
    .download(pack.storage_path);
  if (error) throw error;
  return new Uint8Array(await data.arrayBuffer());
}
export async function registerKnowledgePack(
  manifest: KnowledgeManifest,
  archive: Uint8Array,
) {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user)
    throw new Error("Entre na sua conta para registrar o pacote.");
  const path = `${data.user.id}/${manifest.id}.zip`;
  const uploaded = await supabase.storage
    .from("gaas-knowledge-packs")
    .upload(path, archive, { contentType: "application/zip", upsert: false });
  if (uploaded.error) throw uploaded.error;
  const result = await supabase.from("gaas_knowledge_packs").insert({
    id: manifest.id,
    title: manifest.objective.slice(0, 120) || "Contexto completo de Growth",
    objective: manifest.objective,
    manifest,
    storage_path: path,
    created_by: data.user.id,
  });
  if (result.error) {
    await supabase.storage.from("gaas-knowledge-packs").remove([path]);
    throw result.error;
  }
}
export async function listContributions(): Promise<KnowledgeContribution[]> {
  const { data, error } = await supabase
    .from("gaas_knowledge_contributions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return data || [];
}
export async function canReviewKnowledge(): Promise<boolean> {
  const { data, error } = await supabase.rpc("gaas_knowledge_can_review");
  if (error) throw error;
  return Boolean(data);
}
export async function submitContribution(
  packId: string,
  title: string,
  rationale: string,
  changes: NoteChange[],
) {
  const { data, error } = await supabase.rpc("gaas_knowledge_submit", {
    p_pack_id: packId,
    p_title: title,
    p_rationale: rationale,
    p_changes: changes,
  });
  if (error) throw error;
  return data as string;
}
export async function reviewContribution(
  id: string,
  status: string,
  comment: string,
) {
  const { data, error } = await supabase.rpc("gaas_knowledge_review", {
    p_id: id,
    p_status: status,
    p_comment: comment,
  });
  if (error) throw error;
  return data;
}
export async function contributionHistory(id: string) {
  const { data, error } = await supabase
    .from("gaas_knowledge_contribution_events")
    .select("status,comment,created_at")
    .eq("contribution_id", id)
    .order("created_at");
  if (error) throw error;
  return data || [];
}
