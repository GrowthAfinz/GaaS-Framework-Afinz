import type { VaultNoteSummary } from "../vaultTypes";
import { WIKI_TOPICS, wikiTopicForNote } from "../wikiNavigation";

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
// The map groups notes by subject. Legacy notes get a layer of their own,
// hidden until the reader turns it on. Colors live in wikiMap3d.css.
export const LEGACY_GROUP = "Legado";
export const MAP_GROUPS: { topic: string; key: string; code: string; description: string }[] = [
  ...WIKI_TOPICS.map((topic, index) => ({
    topic: topic.title,
    key: ["start", "res", "prod", "serv", "crm", "dados", "eng", "strat"][index],
    code: "A" + index,
    description: topic.description,
  })),
  {
    topic: LEGACY_GROUP,
    key: "leg",
    code: "LG",
    description: "Notas antigas mantidas para consulta.",
  },
];
export const mapGroupOf = (node: Pick<GraphNode, "path" | "topic">) =>
  node.path.startsWith("98-Legado/") ? LEGACY_GROUP : node.topic;

export type MapShape = "sphere" | "gem" | "oct";
export interface MapNode {
  id: string;
  type: "topic" | "note";
  group: string;
  topic: string;
  label: string;
  path: string;
  incoming: number;
  outgoing: number;
  val: number;
  shape: MapShape;
  featured: boolean;
  code: string;
  description: string;
  count: number;
}
export interface MapLink {
  source: string;
  target: string;
  kind: "contains" | "link";
}
export interface MapData {
  nodes: MapNode[];
  links: MapLink[];
}
const shapeOf = (path: string): MapShape =>
  /^0[23]-/.test(path)
    ? "gem"
    : path.startsWith("09-Inteligencia-IA/Skills/")
      ? "oct"
      : "sphere";
// Sizes follow Second Brain OS: every note is about the same size, the most
// cited notes of each subject become "sections" and the subjects are hubs.
export function buildMapData(graph: WikiGraph): MapData {
  const byGroup = new Map<string, MapNode[]>();
  const nodes: MapNode[] = [];
  for (const n of graph.nodes) {
    const topic = mapGroupOf(n);
    const group = MAP_GROUPS.find((g) => g.topic === topic) || MAP_GROUPS[3];
    const legacy = group.topic === LEGACY_GROUP;
    const node: MapNode = {
      id: n.id,
      type: "note",
      group: group.key,
      topic: group.topic,
      label: n.title,
      path: n.path,
      incoming: n.incoming,
      outgoing: n.outgoing,
      val: legacy
        ? 0.7 + Math.min(n.incoming, 20) * 0.02
        : 1.8 + Math.min(1.7, Math.log1p(n.incoming) * 0.42),
      shape: shapeOf(n.path),
      featured: false,
      code: "",
      description: "",
      count: 0,
    };
    nodes.push(node);
    byGroup.set(group.key, [...(byGroup.get(group.key) || []), node]);
  }
  const links: MapLink[] = [];
  for (const group of MAP_GROUPS) {
    const members = byGroup.get(group.key) || [];
    if (!members.length) continue;
    const id = "topic:" + group.key;
    nodes.push({
      id,
      type: "topic",
      group: group.key,
      topic: group.topic,
      label: group.topic,
      path: "",
      incoming: 0,
      outgoing: 0,
      val: group.topic === LEGACY_GROUP ? 6 : 14,
      shape: "sphere",
      featured: false,
      code: group.code,
      description: group.description,
      count: members.length,
    });
    if (group.topic !== LEGACY_GROUP)
      members
        .filter((m) => m.incoming >= 6)
        .sort((a, b) => b.incoming - a.incoming || a.label.localeCompare(b.label))
        .slice(0, 3)
        .forEach((m) => {
          m.featured = true;
          m.val = 6.3 + Math.min(2.75, Math.log1p(m.incoming) * 0.5);
        });
    for (const m of members) links.push({ source: id, target: m.id, kind: "contains" });
  }
  for (const e of graph.edges) links.push({ source: e.source, target: e.target, kind: "link" });
  return { nodes, links };
}
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
  // The 3D map opens on the whole Wiki with the current note selected; the
  // note's own neighbourhood is an explicit choice ("Conexões" on the note).
  return {
    scope: p.get("wiki_graph_scope") === "local" && root ? "local" : "all",
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
