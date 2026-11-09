export interface VaultLinkInput {
  ordinal: number;
  raw_target: string;
  target_path: string | null;
  fragment: string | null;
  display_text: string | null;
}

export interface VaultNoteInput {
  relative_path: string;
  title: string;
  aliases: string[];
  folder: string;
  content_markdown: string;
  frontmatter: Record<string, unknown>;
  tags: string[];
  note_type: string | null;
  layer: string | null;
  status: string | null;
  source: string | null;
  content_hash: string;
  source_modified_at: string;
  links: VaultLinkInput[];
}

export interface VaultNoteSummary {
  id: string;
  relative_path: string;
  title: string;
  folder: string;
  tags: string[];
  note_type: string | null;
  layer: string | null;
  status: string | null;
  source: string | null;
  source_modified_at: string | null;
  indexed_at: string;
  /** Last update (YYYY-MM-DD) from the note's "atualizado", filled by gaas_search_wiki. */
  updated_on?: string | null;
  /** "estrategia" for 05-Estrategia, "nota" for subjects and notes; filled by gaas_search_wiki. */
  kind?: 'estrategia' | 'nota' | null;
  rank: number;
  total_count: number;
}

export interface VaultNote extends Omit<VaultNoteSummary, 'rank' | 'total_count'> {
  content_hash?: string;
  aliases: string[];
  content_markdown: string;
  frontmatter: Record<string, unknown>;
}

export interface VaultFolderFacet {
  folder: string;
  note_count: number;
}

export interface VaultBacklink {
  note_id: string;
  source_note_id: string;
  source_title: string;
  source_path: string;
  fragment: string | null;
  display_text: string | null;
}

export interface VaultSearchResult {
  items: VaultNoteSummary[];
  total: number;
}

export interface VaultSyncRun {
  id: string;
  status: 'running' | 'completed' | 'failed';
  source: string;
  started_at: string;
  completed_at: string | null;
  note_count: number;
  link_count: number;
  changed_count: number;
  deleted_count: number;
}
