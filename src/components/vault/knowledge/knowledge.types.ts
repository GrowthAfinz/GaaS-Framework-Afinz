import type { VaultNote, VaultSyncRun } from "../vaultTypes";

export interface KnowledgeNote extends VaultNote {
  content_hash: string;
  last_sync_run_id: string;
}
export interface KnowledgeSnapshot {
  notes: KnowledgeNote[];
  sync: VaultSyncRun | null;
  latest_attempt: VaultSyncRun | null;
  stable: boolean;
}
export interface NoteChange {
  path: string;
  base_hash: string | null;
  markdown: string;
  expected_hash: string;
}
export interface KnowledgeManifest {
  schema: "gaas-knowledge-pack/1";
  id: string;
  created_at: string;
  objective: string;
  source: "authenticated-vault-projection";
  sync: VaultSyncRun | null;
  notes: {
    path: string;
    hash: string;
    title: string;
    source_modified_at: string | null;
  }[];
  bytes: number;
  exclusions: string[];
  unresolved_links: string[];
  local_comparison: {
    compared: boolean;
    local_count: number | null;
    only_local: string[];
    only_published: string[];
    changed: string[];
  };
  datasets: {
    domain: string;
    month: string;
    source: string;
    fetched_at: string;
    scope: Record<string, string>;
    summary: unknown;
  }[];
  report_live: Record<string, unknown> | null;
}
export interface KnowledgePack {
  id: string;
  title: string;
  objective: string;
  manifest: KnowledgeManifest;
  created_at: string;
  storage_path: string;
}
export type ContributionStatus =
  | "pending"
  | "changes_requested"
  | "approved"
  | "rejected"
  | "incorporated";
export interface KnowledgeContribution {
  id: string;
  pack_id: string;
  title: string;
  rationale: string;
  changes: NoteChange[];
  status: ContributionStatus;
  review_comment: string | null;
  created_at: string;
  approved_at: string | null;
  incorporated_at: string | null;
  created_by: string;
}
export const CONTRIBUTION_STATUS: Record<ContributionStatus, string> = {
  pending: "Aguardando revisão",
  changes_requested: "Ajustes solicitados",
  approved: "Aprovada · incorporação local pendente",
  rejected: "Rejeitada",
  incorporated: "Incorporada e sincronizada",
};
