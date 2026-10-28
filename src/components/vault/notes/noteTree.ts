import type { VaultNoteSummary } from "../vaultTypes";

export interface NoteFolder {
  path: string;
  name: string;
  folders: NoteFolder[];
  notes: VaultNoteSummary[];
  count: number;
}

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLocaleLowerCase("pt-BR");

// Folder tree in the shape of the vault on disk, as Obsidian's file explorer
// shows it. A query keeps only matching notes and the folders that hold them.
export function buildNoteTree(
  notes: VaultNoteSummary[],
  query = "",
): NoteFolder {
  const root: NoteFolder = {
    path: "",
    name: "",
    folders: [],
    notes: [],
    count: 0,
  };
  const index = new Map<string, NoteFolder>([["", root]]);
  const needle = normalize(query.trim());
  for (const note of notes) {
    if (needle && !normalize(note.title + " " + note.relative_path).includes(needle))
      continue;
    const parts = note.relative_path.split("/").slice(0, -1);
    let parent = root;
    parent.count++;
    parts.forEach((name, depth) => {
      const path = parts.slice(0, depth + 1).join("/");
      let folder = index.get(path);
      if (!folder) {
        folder = { path, name, folders: [], notes: [], count: 0 };
        index.set(path, folder);
        parent.folders.push(folder);
      }
      folder.count++;
      parent = folder;
    });
    parent.notes.push(note);
  }
  const sort = (folder: NoteFolder) => {
    folder.folders.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
    folder.notes.sort((a, b) => a.title.localeCompare(b.title, "pt-BR"));
    folder.folders.forEach(sort);
  };
  sort(root);
  return root;
}

export function ancestorFolders(relativePath: string) {
  const parts = relativePath.split("/").slice(0, -1);
  return parts.map((_, depth) => parts.slice(0, depth + 1).join("/"));
}
