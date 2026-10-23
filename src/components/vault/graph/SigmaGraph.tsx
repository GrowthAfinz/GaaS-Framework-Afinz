import { useEffect, useRef, useState } from "react";
import Graph from "graphology";
import Sigma from "sigma";
import { drawDiscNodeLabel } from "sigma/rendering";
import { Maximize2, ZoomIn, ZoomOut } from "lucide-react";
import { TOPIC_COLORS, type WikiGraph } from "./wikiGraph";

type Position = { id: string; x: number; y: number };
const cache = new Map<string, Position[]>();
export default function SigmaGraph({
  graph,
  focus,
  onSelect,
}: {
  graph: WikiGraph;
  focus: string;
  onSelect: (id: string) => void;
}) {
  const container = useRef<HTMLDivElement>(null),
    renderer = useRef<Sigma | null>(null);
  const select = useRef(onSelect),
    focused = useRef(focus);
  select.current = onSelect;
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
        const aspect = Math.max(
          1,
          Math.min(
            3,
            (container.current!.clientWidth /
              Math.max(1, container.current!.clientHeight)) *
              0.8,
          ),
        );
        graph.nodes.forEach((n) => {
          const p = coords.get(n.id)!;
          model.addNode(n.id, {
            x: p.x * aspect,
            y: p.y,
            label: n.title.length > 52 ? n.title.slice(0, 50) + "…" : n.title,
            size: n.radius,
            color: TOPIC_COLORS[n.topic] || "#7084ad",
          });
        });
        graph.edges.forEach((e) =>
          model.addDirectedEdge(e.source, e.target, {
            size: 0.45,
            color: "#d6dfe9",
          }),
        );
        const instance = new Sigma(model, container.current!, {
          stagePadding: 24,
          allowInvalidContainer: true,
          labelFont: "Segoe UI, Arial, sans-serif",
          labelSize: 11,
          labelWeight: "400",
          labelColor: { color: "#475569" },
          labelDensity: graph.nodes.length <= 35 ? 0.8 : 0.35,
          labelGridCellSize: graph.nodes.length <= 35 ? 80 : 100,
          labelRenderedSizeThreshold: graph.nodes.length <= 35 ? 0 : 7,
          defaultDrawNodeHover: (context, data, settings) => {
            context.beginPath();
            context.arc(data.x, data.y, data.size + 3, 0, Math.PI * 2);
            context.strokeStyle = data.color;
            context.lineWidth = 1.5;
            context.stroke();
            drawDiscNodeLabel(context, data, settings);
          },
          hideLabelsOnMove: true,
          enableCameraRotation: false,
          minCameraRatio: 0.04,
          maxCameraRatio: 3,
          zIndex: true,
          nodeReducer: (id, data) => {
            const f = focused.current;
            if (!f || !model.hasNode(f)) return data;
            const nearby = id === f || model.areNeighbors(id, f);
            return {
              ...data,
              color: nearby ? data.color : "#e0e5ee",
              zIndex: id === f ? 2 : nearby ? 1 : 0,
              highlighted: id === f,
              forceLabel: id === f,
            };
          },
          edgeReducer: (id, data) => {
            const f = focused.current;
            if (!f || !model.hasNode(f)) return data;
            const out = model.source(id) === f,
              incoming = model.target(id) === f;
            return {
              ...data,
              hidden: !out && !incoming,
              color: out ? "#159c9a" : "#a477d1",
              size: out || incoming ? 1 : 0.45,
            };
          },
        });
        instance.on("clickNode", ({ node }) => select.current(node));
        instance.on("clickStage", () => select.current(""));
        renderer.current = instance;
        setBusy(false);
      } catch {
        setError(
          "A visualização requer WebGL. Você pode navegar pelas notas na lista abaixo.",
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
  const button =
    "rounded-md p-1.5 text-slate-500 hover:bg-white hover:text-slate-900 focus-visible:outline-cyan-600";
  return (
    <div
      className="relative min-w-0 bg-[#f9fbfd]"
      style={{ height: "clamp(300px, 55vh, 480px)" }}
    >
      <div
        ref={container}
        className="absolute inset-0"
        role="img"
        aria-label="Mapa interativo de conexões. Arraste para mover e use a rolagem para ampliar. Alternativa acessível na lista de notas."
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
