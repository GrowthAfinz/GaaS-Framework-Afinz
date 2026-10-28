import { describe, expect, it } from "vitest";
import type { VaultNoteSummary } from "../vaultTypes";
import { ancestorFolders, buildNoteTree } from "./noteTree";

const note = (relative_path: string, title: string) =>
  ({ id: relative_path, relative_path, title }) as VaultNoteSummary;

describe("Wiki notes tree", () => {
  const notes = [
    note("01-Servicos/CRM/Jornada.md", "Jornada"),
    note("01-Servicos/Aquisicao.md", "Aquisição"),
    note("Leia-me.md", "Leia-me"),
  ];
  it("nests folders like the vault on disk, sorted by name", () => {
    const tree = buildNoteTree(notes);
    expect(tree.count).toBe(3);
    expect(tree.notes.map((n) => n.title)).toEqual(["Leia-me"]);
    const servicos = tree.folders[0];
    expect(servicos.path).toBe("01-Servicos");
    expect(servicos.count).toBe(2);
    expect(servicos.folders[0].path).toBe("01-Servicos/CRM");
    expect(servicos.notes.map((n) => n.title)).toEqual(["Aquisição"]);
  });
  it("filters by title or path ignoring accents and keeps parent folders", () => {
    const tree = buildNoteTree(notes, "aquisicao");
    expect(tree.count).toBe(1);
    expect(tree.folders[0].notes.map((n) => n.title)).toEqual(["Aquisição"]);
    expect(tree.folders[0].folders).toEqual([]);
  });
  it("lists the folders to expand for a note", () => {
    expect(ancestorFolders("01-Servicos/CRM/Jornada.md")).toEqual([
      "01-Servicos",
      "01-Servicos/CRM",
    ]);
  });
});
