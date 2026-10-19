import { supabase } from "./supabaseClient";
export interface SfmcIngestion {
  id: string;
  file_name: string;
  source_scope: string;
  sfmc_bu: "Afinz" | "Plurix" | null;
  uploaded_at: string;
  status: string;
  staged_via: string;
  parser_version: string;
  journeys_count: number;
  messages_count: number;
  pending_contents: number;
  journeys: {
    journey_name: string;
    journey_version: number;
    snapshot_id: string;
  }[];
}
export interface SfmcAlert {
  journey: string;
  activity: string;
  channel: string;
  template_ids: string[];
  last_seen: string;
}
export interface SfmcHistory {
  imports: SfmcIngestion[];
  alerts: SfmcAlert[];
  automatic_links: number;
}
export async function readSfmcHistory(): Promise<SfmcHistory> {
  const { data, error } = await supabase.rpc("read_sfmc_ingestion_history");
  if (error) throw error;
  if (!data) throw Error("Histórico indisponível para esta sessão.");
  return data as SfmcHistory;
}
