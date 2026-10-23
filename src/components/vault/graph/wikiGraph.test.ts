import { describe, expect, it } from "vitest";
import type { VaultNoteSummary } from "../vaultTypes";
import {
  buildWikiGraph,
  graphNeighborhood,
  graphRouteSearch,
  nodeRadius,
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
  it("opens around the current note and preserves the reader route when sharing graph filters", () => {
    const route = readGraphRoute("?item=a", "a");
    expect(route).toMatchObject({
      scope: "local",
      root: "a",
      focus: "a",
      depth: 1,
    });
    expect(readGraphRoute("", null).scope).toBe("all");
    const search = graphRouteSearch(
      "?view=learning&section=vault&item=a&result_month=2026-09",
      { ...route, depth: 2, query: "risco", topic: "Resultados" },
    );
    expect(new URLSearchParams(search).get("item")).toBe("a");
    expect(new URLSearchParams(search).get("result_month")).toBe("2026-09");
    expect(readGraphRoute(search, "a")).toMatchObject({
      depth: 2,
      query: "risco",
      topic: "Resultados",
    });
  });
  it("scales by distinct citations with bounded sizes", () => {
    expect(nodeRadius(0)).toBe(3);
    expect(nodeRadius(1)).toBeGreaterThan(nodeRadius(0));
    expect(nodeRadius(10000)).toBe(10);
  });
});
