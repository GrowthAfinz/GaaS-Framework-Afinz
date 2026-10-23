import { describe, it, expect } from "vitest";
import { computeWikiLayout } from "./wikiLayout";
import type { WikiGraph } from "./wikiGraph";
describe("Wiki layout worker input", () => {
  it("handles an empty graph and a single isolated note", () => {
    expect(computeWikiLayout({ nodes: [], edges: [] })).toEqual([]);
    const node = {
      id: "a",
      title: "A",
      path: "a.md",
      topic: "Resultados",
      incoming: 0,
      outgoing: 0,
      radius: 7,
    };
    const positions = computeWikiLayout({ nodes: [node], edges: [] });
    expect(positions).toHaveLength(1);
    expect(
      Number.isFinite(positions[0].x) && Number.isFinite(positions[0].y),
    ).toBe(true);
  });
  it("produces stable finite distinct positions with reciprocal links and isolated notes", () => {
    const graph: WikiGraph = {
      nodes: Array.from({ length: 30 }, (_, i) => ({
        id: String(i),
        title: String(i),
        path: i + ".md",
        topic: i % 2 ? "Resultados" : "Comece aqui",
        incoming: 2,
        outgoing: 2,
        radius: 8,
      })),
      edges: [
        { source: "0", target: "1" },
        { source: "1", target: "0" },
        { source: "1", target: "2" },
      ],
    };
    const a = computeWikiLayout(graph);
    expect(a).toEqual(computeWikiLayout(graph));
    expect(a).toHaveLength(30);
    expect(a.every((p) => Number.isFinite(p.x) && Number.isFinite(p.y))).toBe(
      true,
    );
    expect(new Set(a.map((p) => p.x + ":" + p.y)).size).toBe(30);
  });
});
