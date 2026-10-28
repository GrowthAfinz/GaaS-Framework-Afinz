import { useEffect, useRef, useState } from "react";
import Graph from "graphology";
import Sigma from "sigma";
import {
  EdgeArrowProgram,
  type NodeLabelDrawingFunction,
} from "sigma/rendering";
import { Maximize2, ZoomIn, ZoomOut } from "lucide-react";
import { TOPIC_COLORS, type WikiGraph } from "./wikiGraph";

const drawReadableLabel: NodeLabelDrawingFunction = (
  context,
  data,
  settings,
) => {
  if (!data.label) return;
  const label =
    data.label.length > 76 ? data.label.slice(0, 74) + "…" : data.label;
  const x = data.x + data.size + 5,
    y = data.y;
  context.save();
  context.font = `${settings.labelWeight} ${settings.labelSize}px ${settings.labelFont}`;
  context.textBaseline = "middle";
  context.lineJoin = "round";
  context.strokeStyle = BACKGROUND;
  context.lineWidth = 4;
  context.strokeText(label, x, y);
  context.fillStyle = "#1e293b";
  context.fillText(label, x, y);
  context.restore();
};
// Hovered node: ring in its own color plus the label on a white pill, so it
// stays legible over dense areas of the map.
const drawHover: NodeLabelDrawingFunction = (context, data, settings) => {
  context.save();
  context.beginPath();
  context.arc(data.x, data.y, data.size + 4, 0, Math.PI * 2);
  context.fillStyle = "#ffffff";
  context.fill();
  context.lineWidth = 2;
  context.strokeStyle = data.color;
  context.stroke();
  context.beginPath();
  context.arc(data.x, data.y, data.size, 0, Math.PI * 2);
  context.fillStyle = data.color;
  context.fill();
  if (data.label) {
    const label =
      data.label.length > 90 ? data.label.slice(0, 88) + "…" : data.label;
    context.font = `600 ${settings.labelSize}px ${settings.labelFont}`;
    const width = context.measureText(label).width,
      x = data.x + data.size + 8,
      h = settings.labelSize + 10;
    context.shadowColor = "rgba(15,23,42,0.18)";
    context.shadowBlur = 8;
    context.fillStyle = "#ffffff";
    context.beginPath();
    context.roundRect(x - 6, data.y - h / 2, width + 12, h, 6);
    context.fill();
    context.shadowBlur = 0;
    context.fillStyle = "#0f172a";
    context.textBaseline = "middle";
    context.fillText(label, x, data.y);
  }
  context.restore();
};
const BACKGROUND = "#f8fafc",
  DIMMED = "#e2e8f0",
  EDGE = "rgba(100,116,139,0.3)";
type Position = { id: string; x: number; y: number };
const cache = new Map<string, Position[]>();
export default function SigmaGraph({
  graph,
  focus,
  onSelect,
  onOpen,
  detailed,
}: {
  graph: WikiGraph;
  focus: string;
  detailed: boolean;
  onSelect: (id: string) => void;
  onOpen: (id: string) => void;
}) {
  const container = useRef<HTMLDivElement>(null),
    renderer = useRef<Sigma | null>(null);
  const detail = useRef(detailed);
  detail.current = detailed;
  const select = useRef(onSelect),
    open = useRef(onOpen),
    focused = useRef(focus),
    hovered = useRef("");
  select.current = onSelect;
  open.current = onOpen;
  focused.current = focus;
  const [busy, setBusy] = useState(true),
    [error, setError] = useState("");
  useEffect(() => {
    if (!container.current || !graph.nodes.length) return;
    let disposed = false,
      worker: Worker | undefined;
    const key = JSON.stringify([
      graph.nodes.map((n) => [n.id, n.topic, n.incoming]),
      graph.edges,
    ]);
    setBusy(true);
    setError("");
    const mount = (positions: Position[]) => {
      if (disposed) return;
      try {
        const model = new Graph();
        const coords = new Map(positions.map((p) => [p.id, p]));
        graph.nodes.forEach((n) => {
          const p = coords.get(n.id)!;
          model.addNode(n.id, {
            x: p.x,
            y: p.y,
            label: n.title,
            size: n.radius,
            color: TOPIC_COLORS[n.topic] || "#7084ad",
          });
        });
        graph.edges.forEach((e) =>
          model.addDirectedEdge(e.source, e.target, {
            size: 0.5,
            color: EDGE,
          }),
        );
        // Hover previews a neighborhood; the selected note stays highlighted
        // when the pointer leaves the map.
        const active = () => {
          const id = hovered.current || focused.current;
          return id && model.hasNode(id) ? id : "";
        };
        const instance = new Sigma(model, container.current!, {
          stagePadding: 24,
          allowInvalidContainer: true,
          labelFont: "Segoe UI, Arial, sans-serif",
          labelSize: 12,
          labelWeight: "400",
          labelColor: { color: "#172334" },
          labelDensity: detail.current
            ? graph.nodes.length <= 35
              ? 1
              : 0.55
            : 0.2,
          labelGridCellSize: graph.nodes.length <= 35 ? 80 : 100,
          labelRenderedSizeThreshold: detail.current
            ? graph.nodes.length <= 35
              ? 0
              : 4
            : 8,
          defaultDrawNodeLabel: drawReadableLabel,
          edgeProgramClasses: { arrow: EdgeArrowProgram },
          defaultDrawNodeHover: drawHover,
          hideLabelsOnMove: true,
          enableCameraRotation: false,
          minCameraRatio: 0.04,
          maxCameraRatio: 3,
          zIndex: true,
          nodeReducer: (id, data) => {
            const f = active();
            if (!f) return data;
            const nearby = id === f || model.areNeighbors(id, f);
            return {
              ...data,
              color: nearby ? data.color : DIMMED,
              label: nearby ? data.label : "",
              zIndex: id === f ? 2 : nearby ? 1 : 0,
              highlighted: id === f,
              forceLabel: id === f || (nearby && model.degree(f) <= 24),
            };
          },
          edgeReducer: (id, data) => {
            const f = active();
            if (!f) return data;
            const out = model.source(id) === f,
              incoming = model.target(id) === f;
            if (!out && !incoming) return { ...data, hidden: true };
            return {
              ...data,
              color: out ? "rgba(8,145,178,0.75)" : "rgba(71,85,105,0.6)",
              type: "arrow",
              size: 1.4,
            };
          },
        });
        const cursor = (value: string) => {
          if (container.current) container.current.style.cursor = value;
        };
        instance.on("enterNode", ({ node }) => {
          hovered.current = node;
          cursor("pointer");
          instance.refresh({ skipIndexation: true });
        });
        instance.on("leaveNode", () => {
          hovered.current = "";
          cursor("");
          instance.refresh({ skipIndexation: true });
        });
        instance.on("clickNode", ({ node }) => open.current(node));
        instance.on("clickStage", () => select.current(""));
        renderer.current = instance;
        setBusy(false);
      } catch {
        setError(
          "A visualização requer WebGL. Você pode navegar pelo painel de notas à direita.",
        );
        setBusy(false);
      }
    };
    const saved = cache.get(key);
    if (saved) mount(saved);
    else {
      worker = new Worker(new URL("./wikiLayout.worker.ts", import.meta.url), {
        type: "module",
      });
      worker.onmessage = ({ data }) => {
        worker?.terminate();
        if (disposed) return;
        if (data.error) {
          setError(data.error);
          setBusy(false);
          return;
        }
        if (cache.size >= 8) cache.delete(cache.keys().next().value!);
        cache.set(key, data.positions);
        mount(data.positions);
      };
      worker.onerror = () => {
        if (!disposed) {
          setError("Não foi possível organizar o mapa. Tente atualizar.");
          setBusy(false);
        }
        worker?.terminate();
      };
      worker.postMessage(graph);
    }
    return () => {
      disposed = true;
      worker?.terminate();
      renderer.current?.kill();
      renderer.current = null;
    };
  }, [graph]);
  useEffect(() => {
    renderer.current?.scheduleRefresh();
  }, [focus]);
  // The panel and page layout change the map's size without a window resize.
  useEffect(() => {
    if (!container.current) return;
    const observer = new ResizeObserver(() => {
      renderer.current?.resize();
      renderer.current?.refresh();
    });
    observer.observe(container.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const instance = renderer.current;
    if (!instance) return;
    instance.setSetting("labelDensity", detailed ? 0.65 : 0.2);
    instance.setSetting(
      "labelRenderedSizeThreshold",
      detailed ? (graph.nodes.length <= 35 ? 0 : 4) : 8,
    );
  }, [detailed, graph]);
  const button =
    "rounded-md p-1.5 text-slate-500 hover:bg-white hover:text-slate-900 focus-visible:outline-cyan-600";
  return (
    <div
      className="relative h-full min-h-0 min-w-0"
      style={{
        background: BACKGROUND,
        backgroundImage:
          "radial-gradient(circle, rgba(148,163,184,0.28) 1px, transparent 1px)",
        backgroundSize: "22px 22px",
      }}
    >
      <div
        ref={container}
        className="absolute inset-0"
        role="img"
        aria-label="Mapa interativo de conexões. Clique numa nota para abri-la, arraste para mover e use a rolagem para ampliar. Alternativa acessível na lista de notas."
      />
      {(busy || error) && (
        <div
          className="pointer-events-none absolute inset-0 grid place-items-center bg-white/80 p-6 text-center text-xs text-slate-500"
          role={error ? "alert" : "status"}
        >
          {error || "Organizando conexões…"}
        </div>
      )}
      <div className="absolute bottom-2 right-2 flex rounded-lg border border-slate-200/70 bg-white/90 p-0.5 shadow-sm">
        <button
          className={button}
          title="Diminuir zoom"
          aria-label="Diminuir zoom"
          onClick={() =>
            renderer.current?.getCamera().animatedUnzoom({ duration: 180 })
          }
        >
          <ZoomOut size={15} />
        </button>
        <button
          className={button}
          title="Aumentar zoom"
          aria-label="Aumentar zoom"
          onClick={() =>
            renderer.current?.getCamera().animatedZoom({ duration: 180 })
          }
        >
          <ZoomIn size={15} />
        </button>
        <button
          className={button}
          title="Enquadrar mapa"
          aria-label="Enquadrar mapa"
          onClick={() =>
            renderer.current?.getCamera().animatedReset({ duration: 180 })
          }
        >
          <Maximize2 size={15} />
        </button>
      </div>
    </div>
  );
}
