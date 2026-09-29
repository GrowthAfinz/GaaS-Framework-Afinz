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
  rank: number;
  total_count: number;
}

export interface VaultNote extends Omit<VaultNoteSummary, 'rank' | 'total_count'> {
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
