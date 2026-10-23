import Graph from "graphology";
import forceAtlas2 from "graphology-layout-forceatlas2";
import type { WikiGraph } from "./wikiGraph";
export function computeWikiLayout(data: WikiGraph) {
  const graph = new Graph();
  const topics = [...new Set(data.nodes.map((n) => n.topic))].sort();
  data.nodes.forEach((n, i) => {
    const group = topics.indexOf(n.topic),
      angle = i * 2.399963;
    const anchor = (group * Math.PI * 2) / Math.max(1, topics.length);
    const r = 2 * Math.sqrt(i + 1);
    graph.addNode(n.id, {
      x: Math.cos(anchor) * 25 + Math.cos(angle) * r,
      y: Math.sin(anchor) * 25 + Math.sin(angle) * r,
      size: 1,
    });
  });
  data.edges.forEach((e) => {
    if (!graph.hasEdge(e.source, e.target))
      graph.addDirectedEdge(e.source, e.target);
  });
  if (graph.order > 1)
    forceAtlas2.assign(graph, {
      iterations: 220,
      settings: {
        ...forceAtlas2.inferSettings(graph),
        barnesHutOptimize: true,
        gravity: 0.8,
        scalingRatio: 10,
        slowDown: 4,
      },
    });

  return graph
    .nodes()
    .map((id) => ({
      id,
      x: graph.getNodeAttribute(id, "x") as number,
      y: graph.getNodeAttribute(id, "y") as number,
    }));
}
