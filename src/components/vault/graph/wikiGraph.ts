import type { VaultNoteSummary } from "../vaultTypes";
import { wikiTopicForNote } from "../wikiNavigation";

export interface VaultGraphLink {
  source_note_id: string;
  target_note_id: string | null;
}
export interface GraphNode {
  id: string;
  title: string;
  path: string;
  topic: string;
  incoming: number;
  outgoing: number;
  radius: number;
}
export interface GraphEdge {
  source: string;
  target: string;
}
export interface WikiGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}
export interface GraphRoute {
  scope: "local" | "all";
  root: string;
  focus: string;
  depth: 1 | 2;
  topic: string;
  query: string;
}
export const TOPIC_COLORS: Record<string, string> = {
  "Comece aqui": "#159c9a",
  Resultados: "#5b7cdd",
  "Produtos e propostas de valor": "#a477d1",
  "Serviços de Growth": "#40a985",
  "CRM e e-mails dinâmicos": "#d89755",
  "Dados e mensuração": "#d4759a",
  "Engenharia e IAs": "#7084ad",
};
export const nodeRadius = (incoming: number) =>
  Math.min(10, 3 + 0.65 * Math.sqrt(Math.max(0, incoming)));
export function buildWikiGraph(
  notes: VaultNoteSummary[],
  links: VaultGraphLink[],
): WikiGraph {
  const ids = new Set(notes.map((n) => n.id)),
    seen = new Set<string>(),
    edges: GraphEdge[] = [];
  const incoming = new Map<string, number>(),
    outgoing = new Map<string, number>();
  for (const l of links) {
    const target = l.target_note_id;
    if (
      !target ||
      !ids.has(l.source_note_id) ||
      !ids.has(target) ||
      target === l.source_note_id
    )
      continue;
    const key = JSON.stringify([l.source_note_id, target]);
    if (seen.has(key)) continue;
    seen.add(key);
    edges.push({ source: l.source_note_id, target });
    incoming.set(target, (incoming.get(target) || 0) + 1);
    outgoing.set(l.source_note_id, (outgoing.get(l.source_note_id) || 0) + 1);
  }
  return {
    nodes: notes.map((n) => ({
      id: n.id,
      title: n.title,
      path: n.relative_path,
      topic: wikiTopicForNote(n) || "Serviços de Growth",
      incoming: incoming.get(n.id) || 0,
      outgoing: outgoing.get(n.id) || 0,
      radius: nodeRadius(incoming.get(n.id) || 0),
    })),
    edges,
  };
}
export function graphNeighborhood(
  graph: WikiGraph,
  root: string,
  depth: number,
) {
  const found = new Set<string>();
  if (!graph.nodes.some((n) => n.id === root)) return found;
  found.add(root);
  let frontier = new Set([root]);
  for (let d = 0; d < depth; d++) {
    const next = new Set<string>();
    for (const e of graph.edges) {
      if (frontier.has(e.source) && !found.has(e.target)) next.add(e.target);
      if (frontier.has(e.target) && !found.has(e.source)) next.add(e.source);
    }
    for (const id of next) found.add(id);
    frontier = next;
  }
  return found;
}
const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");
export function visibleWikiGraph(
  graph: WikiGraph,
  route: GraphRoute,
): WikiGraph {
  const eligible =
    route.scope === "local"
      ? graphNeighborhood(graph, route.root, route.depth)
      : new Set(graph.nodes.map((n) => n.id));
  const query = normalize(route.query.trim());
  const nodes = graph.nodes.filter(
    (n) =>
      eligible.has(n.id) &&
      (!route.topic || n.topic === route.topic) &&
      (!query || normalize(n.title + " " + n.path).includes(query)),
  );
  const ids = new Set(nodes.map((n) => n.id));
  return {
    nodes,
    edges: graph.edges.filter((e) => ids.has(e.source) && ids.has(e.target)),
  };
}
export function readGraphRoute(
  search: string,
  currentNote: string | null,
): GraphRoute {
  const p = new URLSearchParams(search),
    root = p.get("wiki_graph_root") || currentNote || "";
  return {
    scope: p.get("wiki_graph_scope") === "all" || !root ? "all" : "local",
    root,
    focus: p.get("wiki_graph_node") || root,
    depth: p.get("wiki_graph_depth") === "2" ? 2 : 1,
    topic: p.get("wiki_graph_topic") || "",
    query: p.get("wiki_graph_q") || "",
  };
}
export function graphRouteSearch(search: string, route: GraphRoute) {
  const p = new URLSearchParams(search);
  p.set("view", "learning");
  p.set("section", "vault");
  p.set("wiki_view", "connections");
  const fields = {
    wiki_graph_scope: route.scope,
    wiki_graph_root: route.root,
    wiki_graph_node: route.focus,
    wiki_graph_depth: String(route.depth),
    wiki_graph_topic: route.topic,
    wiki_graph_q: route.query,
  };
  for (const [key, value] of Object.entries(fields)) {
    if (value) p.set(key, value);
    else p.delete(key);
  }
  return "?" + p;
}
