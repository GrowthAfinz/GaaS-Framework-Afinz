import { describe, expect, it } from "vitest";
import { strFromU8, unzipSync } from "fflate";
import {
  buildKnowledgeArchive,
  compareInventory,
  prepareChanges,
  safeNotePath,
  sha256,
} from "./knowledgePack";
import type { KnowledgeNote, KnowledgeSnapshot } from "./knowledge.types";

const note = async (
  path = "01-Conceitos/Teste.md",
  text = "# Regra\n\nAusência não é zero.",
): Promise<KnowledgeNote> => ({
  id: path,
  relative_path: path,
  title: "Regra",
  folder: "01-Conceitos",
  content_markdown: text,
  content_hash: await sha256(text),
  last_sync_run_id: "sync",
  aliases: [],
  frontmatter: { status: "confirmado" },
  tags: [],
  note_type: null,
  layer: null,
  status: "confirmado",
  source: "operador",
  source_modified_at: "2026-10-22T12:00:00Z",
  indexed_at: "2026-10-22T12:00:00Z",
});
const snapshot = (notes: KnowledgeNote[]): KnowledgeSnapshot => ({
  notes,
  sync: null,
  latest_attempt: null,
  stable: true,
});
describe("complete knowledge pack", () => {
  it("exports more than a REST page without truncation, preserving exact content and hashes", async () => {
    const notes = await Promise.all(
      Array.from({ length: 405 }, (_, i) =>
        note(`01-Conceitos/Nota-${i}.md`, `# Nota ${i}\n\nRegra ${i}.`),
      ),
    );
    const result = await buildKnowledgeArchive(
      snapshot(notes),
      "Entender a operação",
    );
    const files = unzipSync(result.archive);
    expect(
      Object.keys(files).filter((p) => p.startsWith("vault/")),
    ).toHaveLength(405);
    expect(strFromU8(files["vault/01-Conceitos/Nota-404.md"])).toBe(
      notes[404].content_markdown,
    );
    expect(JSON.parse(strFromU8(files["MANIFESTO.json"])).notes).toHaveLength(
      405,
    );
    expect(files["INSTRUCOES-IA.md"]).toBeDefined();
    expect(files["ONTOLOGIA.md"]).toBeDefined();
    expect(result.manifest.local_comparison.compared).toBe(false);
  });
  it("rejects inconsistent hashes, unsafe paths and incomplete synchronization", async () => {
    const n = await note();
    await expect(
      buildKnowledgeArchive(snapshot([{ ...n, content_hash: "wrong" }]), ""),
    ).rejects.toThrow("Hash inconsistente");
    await expect(
      buildKnowledgeArchive({ ...snapshot([n]), stable: false }, ""),
    ).rejects.toThrow("sincronização");
    for (const p of [
      "../a.md",
      "/a.md",
      "x/../../a.md",
      "a\\b.md",
      "a:b.md",
      ".git/a.md",
      "a//b.md",
    ])
      expect(safeNotePath(p)).toBe(false);
  });
  it("lists credential exclusions explicitly and preserves other notes", async () => {
    const notes = [
      await note(),
      await note(
        "08-Engenharia/Segredo.md",
        "# Token\nsk-proj-abcdefghijklmnopqrstuvwxyz123456",
      ),
    ];
    const { manifest, archive } = await buildKnowledgeArchive(
      snapshot(notes),
      "",
    );
    expect(manifest.notes).toHaveLength(1);
    expect(manifest.exclusions.join(" ")).toContain("Segredo.md");
    expect(
      unzipSync(archive)["vault/08-Engenharia/Segredo.md"],
    ).toBeUndefined();
  });
  it("reports local additions, removals and changed contents without mutating the source", async () => {
    const a = await note(),
      b = await note("04-Operacao/Nova.md");
    const local = [{ ...a, content_hash: "changed" }, { ...b }];
    const compared = compareInventory([a], local as never);
    expect(compared.only_local).toEqual(["04-Operacao/Nova.md"]);
    expect(compared.changed).toEqual([a.relative_path]);
    expect(a.content_hash).not.toBe("changed");
  });
  it("checks source revisions, duplicate paths and computes the expected incorporation hash", async () => {
    const n = await note();
    const change = {
      path: n.relative_path,
      base_hash: n.content_hash,
      markdown: "# Atualizada",
    };
    const prepared = await prepareChanges([change], [n]);
    expect(prepared[0].expected_hash).toBe(await sha256(change.markdown));
    await expect(
      prepareChanges([{ ...change, base_hash: "stale" }], [n]),
    ).rejects.toThrow("mudou");
    await expect(prepareChanges([change, change], [n])).rejects.toThrow(
      "repetido",
    );
    await expect(
      prepareChanges([{ ...change, base_hash: undefined }], [n]),
    ).rejects.toThrow("base_hash");
  });
});
