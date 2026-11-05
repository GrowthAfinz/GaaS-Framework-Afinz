import { describe, expect, it } from "vitest";
import type { VaultNoteSummary } from "../vaultTypes";
import {
  buildMapData,
  buildWikiGraph,
  graphNeighborhood,
  graphRouteSearch,
  readGraphRoute,
  visibleWikiGraph,
} from "./wikiGraph";
const note = (
  id: string,
  title = id,
  folder = "08-Engenharia",
): VaultNoteSummary => ({
  id,
  title,
  folder,
  relative_path: folder + "/" + id + ".md",
  tags: [],
  note_type: null,
  layer: null,
  status: null,
  source: null,
  source_modified_at: null,
  indexed_at: "2026-10-23",
  rank: 0,
  total_count: 5,
});
const notes = [
  note("a", "Contexto"),
  note("b", "Métricas", "02-Entidades-Dados"),
  note("c", "Produto"),
  note("d", "Histórico"),
  note("e", "Isolada"),
];
const links = [
  { source_note_id: "a", target_note_id: "b" },
  { source_note_id: "a", target_note_id: "b" },
  { source_note_id: "b", target_note_id: "c" },
  { source_note_id: "d", target_note_id: "a" },
  { source_note_id: "a", target_note_id: "a" },
  { source_note_id: "gone", target_note_id: "a" },
  { source_note_id: "a", target_note_id: "gone" },
  { source_note_id: "a", target_note_id: null },
];
describe("Wiki graph semantics", () => {
  it("deduplicates references and excludes unresolved, deleted and self links", () => {
    const graph = buildWikiGraph(notes, links);
    expect(graph.edges).toHaveLength(3);
    expect(graph.nodes.find((n) => n.id === "b")).toMatchObject({
      incoming: 1,
      outgoing: 1,
    });
    expect(graph.nodes.find((n) => n.id === "a")).toMatchObject({
      incoming: 1,
      outgoing: 1,
    });
    expect(graph.nodes.find((n) => n.id === "e")).toMatchObject({
      incoming: 0,
      outgoing: 0,
    });
  });
  it("traverses incoming and outgoing references without pretending indirect links are direct", () => {
    const graph = buildWikiGraph(notes, links);
    expect([...graphNeighborhood(graph, "a", 1)].sort()).toEqual([
      "a",
      "b",
      "d",
    ]);
    expect([...graphNeighborhood(graph, "a", 2)].sort()).toEqual([
      "a",
      "b",
      "c",
      "d",
    ]);
    expect(graphNeighborhood(graph, "missing", 2).size).toBe(0);
  });
  it("filters the visible subgraph without changing global incoming counts", () => {
    const graph = buildWikiGraph(notes, links),
      route = {
        ...readGraphRoute("", "a"),
        scope: "all" as const,
        query: "metricas",
      };
    const result = visibleWikiGraph(graph, route);
    expect(result.nodes.map((n) => n.id)).toEqual(["b"]);
    expect(result.edges).toEqual([]);
    expect(result.nodes[0].incoming).toBe(1);
    expect(
      visibleWikiGraph(graph, {
        ...route,
        query: "",
        topic: "Dados e mensuração",
      }).nodes.map((n) => n.id),
    ).toEqual(["b"]);
  });
  it("opens the whole map on the current note and preserves the reader route when sharing graph filters", () => {
    const route = readGraphRoute("?item=a", "a");
    expect(route).toMatchObject({
      scope: "all",
      root: "a",
      focus: "a",
      depth: 1,
    });
    expect(readGraphRoute("", null).scope).toBe("all");
    expect(readGraphRoute("?wiki_graph_scope=local&wiki_graph_root=a", null).scope).toBe("local");
    const search = graphRouteSearch(
      "?view=learning&section=vault&item=a&result_month=2026-09",
      { ...route, scope: "local", depth: 2, query: "risco", topic: "Resultados" },
    );
    expect(new URLSearchParams(search).get("item")).toBe("a");
    expect(new URLSearchParams(search).get("result_month")).toBe("2026-09");
    expect(readGraphRoute(search, "a")).toMatchObject({
      depth: 2,
      query: "risco",
      topic: "Resultados",
    });
  });
  it("groups the map by subject with hubs, featured notes and a legacy layer", () => {
    const many = [
      ...Array.from({ length: 8 }, (_, i) => note("s" + i, "Fonte " + i)),
      note("hub", "Contrato central"),
      note("tab", "Tabela", "02-Entidades-Dados"),
      { ...note("skill", "Skill", "09-Inteligencia-IA/Skills"), relative_path: "09-Inteligencia-IA/Skills/skill.md" },
      { ...note("old", "Antiga", "98-Legado/08-Engenharia"), relative_path: "98-Legado/08-Engenharia/old.md" },
    ];
    const data = buildMapData(
      buildWikiGraph(
        many,
        many.slice(0, 8).map((n) => ({ source_note_id: n.id, target_note_id: "hub" })),
      ),
    );
    const byId = new Map(data.nodes.map((n) => [n.id, n]));
    expect(byId.get("hub")).toMatchObject({ topic: "Engenharia e IAs", featured: true });
    expect(byId.get("hub")!.val).toBeGreaterThan(byId.get("s0")!.val);
    expect(byId.get("tab")).toMatchObject({ topic: "Dados e mensuração", shape: "gem" });
    expect(byId.get("skill")).toMatchObject({ topic: "Engenharia e IAs", shape: "oct" });
    expect(byId.get("old")).toMatchObject({ topic: "Legado", group: "leg", featured: false });
    expect(byId.get("topic:eng")).toMatchObject({ type: "topic", count: 10 });
    expect(data.nodes.some((n) => n.id === "root")).toBe(false);
    expect(data.links.filter((l) => l.kind === "link")).toHaveLength(8);
    expect(data.links.filter((l) => l.kind === "contains")).toHaveLength(many.length);
  });
});
