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
  "Comece aqui": "#0e7490",
  Resultados: "#2563eb",
  "Produtos e propostas de valor": "#7c3aed",
  "Serviços de Growth": "#0f766e",
  "CRM e e-mails dinâmicos": "#b45309",
  "Dados e mensuração": "#be185d",
  "Engenharia e IAs": "#475569",
};
export const nodeRadius = (incoming: number) =>
  Math.min(23, 7 + 3 * Math.sqrt(Math.max(0, incoming)));
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

export interface GraphPosition {
  x: number;
  y: number;
}
/** Deterministic bounded spring layout. No ongoing animation or dependence on frame timing. */
export function layoutWikiGraph(
  graph: WikiGraph,
  root?: string,
): Map<string, GraphPosition> {
  const nodes = [...graph.nodes].sort((a, b) => a.id.localeCompare(b.id)),
    topics = [...new Set(nodes.map((n) => n.topic))].sort();
  const groups = new Map<string, number>(),
    positions: GraphPosition[] = [],
    anchors: GraphPosition[] = [];
  nodes.forEach((n) => {
    const group = topics.indexOf(n.topic),
      index = groups.get(n.topic) || 0;
    groups.set(n.topic, index + 1);
    const angle =
      (group * 2 * Math.PI) / Math.max(1, topics.length) - Math.PI / 2;
    const anchor = {
      x: Math.cos(angle) * (root ? 140 : 285),
      y: Math.sin(angle) * (root ? 100 : 200),
    };
    anchors.push(anchor);
    const r = 24 * Math.sqrt(index + 1),
      a = index * 2.399963;
    positions.push(
      n.id === root
        ? { x: 0, y: 0 }
        : { x: anchor.x + Math.cos(a) * r, y: anchor.y + Math.sin(a) * r },
    );
  });
  const indices = new Map(nodes.map((n, i) => [n.id, i])),
    edges = graph.edges.map((e) => [
      indices.get(e.source)!,
      indices.get(e.target)!,
    ]);
  for (let iteration = 0; iteration < 85; iteration++) {
    const forces = nodes.map((_, i) => ({
      x: (anchors[i].x - positions[i].x) * 0.006,
      y: (anchors[i].y - positions[i].y) * 0.006,
    }));
    for (let i = 0; i < nodes.length; i++)
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = positions[i].x - positions[j].x,
          dy = positions[i].y - positions[j].y,
          d2 = Math.max(4, dx * dx + dy * dy),
          distance = Math.sqrt(d2);
        const force = Math.min(
          12,
          ((nodes[i].radius + nodes[j].radius + 17) * 95) / d2,
        );
        forces[i].x += (dx / distance) * force;
        forces[i].y += (dy / distance) * force;
        forces[j].x -= (dx / distance) * force;
        forces[j].y -= (dy / distance) * force;
      }
    for (const [i, j] of edges) {
      const dx = positions[j].x - positions[i].x,
        dy = positions[j].y - positions[i].y,
        d = Math.max(1, Math.hypot(dx, dy)),
        force = (d - 100) * 0.012;
      forces[i].x += (dx / d) * force;
      forces[i].y += (dy / d) * force;
      forces[j].x -= (dx / d) * force;
      forces[j].y -= (dy / d) * force;
    }
    const cooling = 1 - iteration / 110;
    for (let i = 0; i < nodes.length; i++)
      if (nodes[i].id !== root) {
        positions[i].x += Math.max(-10, Math.min(10, forces[i].x)) * cooling;
        positions[i].y += Math.max(-10, Math.min(10, forces[i].y)) * cooling;
      }
  }
  const width = Math.max(1, ...positions.map((p) => Math.abs(p.x))),
    height = Math.max(1, ...positions.map((p) => Math.abs(p.y)));
  const scale = Math.min(1, 450 / width, 285 / height);
  return new Map(
    nodes.map((n, i) => [
      n.id,
      { x: positions[i].x * scale, y: positions[i].y * scale },
    ]),
  );
}
