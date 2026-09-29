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

export interface VaultNote extends Omit<VaultNoteInput, 'aliases' | 'links' | 'content_hash'> {
  id: string;
  indexed_at: string;
  rank: number;
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
