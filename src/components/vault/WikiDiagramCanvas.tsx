import { useCallback, useEffect, useId, useRef, useState, type PointerEvent } from 'react';
import mermaid from 'mermaid';
import DOMPurify from 'dompurify';

// Shared, restrained visual language. Notes cannot override security or inject configuration.
mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', suppressErrorRendering: true, theme: 'base', look: 'classic', htmlLabels: false,
  flowchart: { htmlLabels: false, useMaxWidth: false, curve: 'basis', nodeSpacing: 34, rankSpacing: 52, wrappingWidth: 360, padding: 14 },
  themeVariables: { fontFamily: 'Calibri, "Segoe UI", Arial, sans-serif', fontSize: '14px', primaryColor: '#f2f8f8', primaryTextColor: '#0f3f42', primaryBorderColor: '#8fbfc1', lineColor: '#94a3b0', secondaryColor: '#eef1f8', tertiaryColor: '#ffffff', clusterBkg: '#fbfcfc', clusterBorder: '#d5e1e2', edgeLabelBackground: '#ffffff' },
});

/** Node roles, read from the label: notes keep plain Mermaid and the Wiki gives them colour. */
export type DiagramTone = 'source' | 'query' | 'decision' | 'channel' | 'muted' | 'step';
export const DIAGRAM_TONES: Record<DiagramTone, { label: string; fill: string; stroke: string; text: string }> = {
  source: { label: 'Fonte de dados', fill: '#eef1f8', stroke: '#7d8fbf', text: '#26345c' },
  query: { label: 'Consulta SQL', fill: '#e3f2f1', stroke: '#007c80', text: '#00494c' },
  decision: { label: 'Decisão', fill: '#fdf5e4', stroke: '#d29a2c', text: '#6b4a0a' },
  channel: { label: 'Canal e experiência', fill: '#f3eefa', stroke: '#9a83c9', text: '#3d2a66' },
  muted: { label: 'Controle ou descarte', fill: '#f5f6f7', stroke: '#b8c1c8', text: '#5f6b75' },
  step: { label: 'Etapa', fill: '#f6faf9', stroke: '#a9cbc9', text: '#1f3d3f' },
};
const CLUSTERS = [
  { fill: '#f4f9f9', stroke: '#c5dddd', title: '#00595c' },
  { fill: '#f6f7fb', stroke: '#d3d9ea', title: '#2f3f6e' },
  { fill: '#fbf8f2', stroke: '#e6dcc6', title: '#6b4a0a' },
  { fill: '#f8f5fb', stroke: '#e0d6ee', title: '#4b347a' },
];

export function diagramTone(label: string, isDecision: boolean): DiagramTone {
  if (isDecision) return 'decision';
  if (/\b(controle|fora d|pular|inválid|vencid|descart|sem comunicação|não implementad)/i.test(label)) return 'muted';
  if (/\b(e-?mail|sms|whats\s?app|push|landing|cloudpage)\b/i.test(label) || /\bLP\b/.test(label)) return 'channel';
  if (/\bQ_[A-Z0-9_]+/.test(label)) return 'query';
  if (/^\s*[A-ZÀ-Ý][A-ZÀ-Ý0-9_]{2,}(?:[ _][A-ZÀ-Ý0-9_]{2,})*\b/.test(label)) return 'source';
  return 'step';
}

function paint(svg: SVGSVGElement): DiagramTone[] {
  const used = new Set<DiagramTone>();
  const set = (el: Element, props: Record<string, string>) => { for (const [k, v] of Object.entries(props)) (el as SVGElement).style.setProperty(k, v); };
  svg.querySelectorAll('g.cluster').forEach((cluster, i) => {
    const tone = CLUSTERS[i % CLUSTERS.length];
    cluster.querySelectorAll(':scope > rect').forEach(rect => { set(rect, { fill: tone.fill, stroke: tone.stroke, 'stroke-width': '1px' }); rect.setAttribute('rx', '10'); rect.setAttribute('ry', '10'); });
    cluster.querySelectorAll('.cluster-label text, .cluster-label tspan').forEach(text => set(text, { fill: tone.title, 'font-weight': '700', 'letter-spacing': '.02em' }));
  });
  svg.querySelectorAll('g.node').forEach(node => {
    // Multi-line labels are separate tspans; join them with spaces so words from different lines do not merge.
    const words = [...node.querySelectorAll('tspan')].filter(t => !t.querySelector('tspan')).map(t => t.textContent || '');
    const label = (words.length ? words.join(' ') : node.textContent || '').replace(/\s+/g, ' ');
    const shapes = node.querySelectorAll(':scope > rect, :scope > polygon, :scope > path, :scope > circle, :scope > ellipse, :scope > g > rect, :scope > g > polygon, :scope > g > path');
    const isDecision = Boolean(node.querySelector('polygon')) || /question|diamond|rhombus/.test(node.getAttribute('class') || '');
    const toneKey = diagramTone(label, isDecision);
    const tone = DIAGRAM_TONES[toneKey];
    used.add(toneKey);
    shapes.forEach(shape => {
      set(shape, { fill: tone.fill, stroke: tone.stroke, 'stroke-width': toneKey === 'query' ? '1.6px' : '1.2px', ...(toneKey === 'muted' ? { 'stroke-dasharray': '4 3' } : {}) });
      if (shape.tagName.toLowerCase() === 'rect') { shape.setAttribute('rx', '8'); shape.setAttribute('ry', '8'); }
    });
    node.querySelectorAll('text, tspan').forEach(text => set(text, { fill: tone.text, ...(toneKey === 'query' || toneKey === 'decision' ? { 'font-weight': '600' } : {}) }));
  });
  svg.querySelectorAll('.edgePaths path, path.flowchart-link').forEach(path => set(path, { stroke: '#94a3b0', 'stroke-width': '1.4px' }));
  svg.querySelectorAll('marker path, marker circle').forEach(mark => set(mark, { fill: '#94a3b0', stroke: '#94a3b0' }));
  svg.querySelectorAll('.edgeLabel rect, .edgeLabel .background, .labelBkg').forEach(bg => set(bg, { fill: '#ffffff', opacity: '1' }));
  svg.querySelectorAll('.edgeLabel text, .edgeLabel tspan').forEach(text => set(text, { fill: '#42515b', 'font-weight': '600' }));
  return (Object.keys(DIAGRAM_TONES) as DiagramTone[]).filter(t => used.has(t));
}

/** 'width' fills the screen width, 'screen' shows the whole map, a number is a percentage of the natural size. */
export type DiagramFit = 'width' | 'screen' | number;
const MAX_FIT = 1.5;

export default function WikiDiagramCanvas({ source, fit = 'width', expanded, onScale }: { source: string; fit?: DiagramFit; expanded: boolean; onScale?: (percent: number) => void }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const host = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; left: number; top: number } | null>(null);
  const [error, setError] = useState(false);
  const [legend, setLegend] = useState<DiagramTone[]>([]);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [room, setRoom] = useState<{ w: number; h: number } | null>(null);
  // Room for the map in the full-screen view. Measured on open, when the drawing is ready, on fit changes and on resize;
  // a hidden element (dialog not open yet) reports zero and is skipped.
  const measure = useCallback(() => {
    const el = scroller.current; if (!expanded || !el || !el.clientWidth) return;
    const next = { w: Math.max(120, el.clientWidth - 40), h: Math.max(120, el.clientHeight - 40) };
    setRoom(r => r && Math.abs(r.w - next.w) < 1 && Math.abs(r.h - next.h) < 1 ? r : next);
  }, [expanded]);
  useEffect(() => {
    const el = scroller.current; if (!expanded || !el) return;
    measure(); const timer = window.setTimeout(measure, 80);
    const observer = new ResizeObserver(measure); observer.observe(el); window.addEventListener('resize', measure);
    return () => { window.clearTimeout(timer); observer.disconnect(); window.removeEventListener('resize', measure); };
  }, [expanded, measure]);
  useEffect(() => { measure(); }, [fit, natural, measure]);
  useEffect(() => {
    let active = true;
    setError(false);
    const render = async () => {
      try {
        if (source.length > 50000 || /%%\s*\{|^\s*---|\bclick\s+\S+\s+(?:href|call|"|')/m.test(source)) throw new Error('unsupported_diagram');
        const { svg } = await mermaid.render(`wiki-flow-${id}${expanded ? 'x' : ''}`, source);
        if (active && host.current) {
          host.current.innerHTML = DOMPurify.sanitize(svg, { USE_PROFILES: { svg: true, svgFilters: true }, FORBID_TAGS: ['foreignObject', 'script', 'a', 'image'], FORBID_ATTR: ['onload', 'onclick'] });
          const diagram = host.current.querySelector('svg');
          if (diagram) {
            setLegend(paint(diagram));
            const [, , naturalWidth, naturalHeight] = (diagram.getAttribute('viewBox') || '').trim().split(/\s+/).map(Number);
            if (naturalWidth && naturalHeight) setNatural({ w: naturalWidth, h: naturalHeight });
            if (naturalWidth && !expanded) diagram.style.maxWidth = `${naturalWidth}px`;
          }
        }
      } catch { if (active) setError(true); }
    };
    void render();
    return () => { active = false; };
  }, [source, id, expanded]);
  const scale = !natural || !room ? null : typeof fit === 'number' ? fit / 100 : Math.min(MAX_FIT, fit === 'screen' ? Math.min(room.w / natural.w, room.h / natural.h) : room.w / natural.w);
  const percent = scale ? Math.round(scale * 100) : null;
  useEffect(() => { if (expanded && percent) onScale?.(percent); }, [expanded, percent, onScale]);
  // In the full-screen view the map can be dragged like a canvas.
  const startDrag = (e: PointerEvent<HTMLDivElement>) => { if (!expanded || e.button !== 0 || !scroller.current) return; drag.current = { x: e.clientX, y: e.clientY, left: scroller.current.scrollLeft, top: scroller.current.scrollTop }; e.currentTarget.setPointerCapture(e.pointerId); };
  const moveDrag = (e: PointerEvent<HTMLDivElement>) => { const d = drag.current, el = scroller.current; if (!d || !el) return; el.scrollLeft = d.left - (e.clientX - d.x); el.scrollTop = d.top - (e.clientY - d.y); };
  const endDrag = () => { drag.current = null; };
  if (error) return <div className="p-5 text-sm" role="alert"><p>Não foi possível desenhar este fluxo. Confira a sintaxe Mermaid na nota-fonte.</p><details className="mt-3"><summary className="cursor-pointer text-cyan-800">Consultar definição do fluxo</summary><pre className="mt-2 overflow-auto whitespace-pre-wrap text-xs">{source}</pre></details></div>;
  return <div className={`wiki-diagram-surface flex flex-col ${expanded ? 'h-full' : ''}`}>
    <div ref={scroller} className={`min-h-0 flex-1 overflow-auto p-5 ${expanded ? 'cursor-grab active:cursor-grabbing' : ''}`} tabIndex={0} aria-label="Diagrama; role ou arraste para percorrer o fluxo" onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag}>
      <div ref={host} role="img" aria-label="Fluxo descrito na seção da estratégia" style={expanded ? (scale && natural ? { width: natural.w * scale, height: natural.h * scale, margin: '0 auto' } : { width: '100%' }) : { width: '100%', minWidth: 560 }} className="[&>svg]:mx-auto [&>svg]:h-auto [&>svg]:w-full" />
    </div>
    {legend.length > 1 && <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-slate-200/80 bg-white/80 px-4 py-2 text-[11px] text-slate-500" aria-label="Legenda do fluxo">
      {legend.map(t => <li key={t} className="inline-flex items-center gap-1.5"><span aria-hidden className="inline-block h-2.5 w-3.5 rounded-[3px] border" style={{ background: DIAGRAM_TONES[t].fill, borderColor: DIAGRAM_TONES[t].stroke, borderStyle: t === 'muted' ? 'dashed' : 'solid' }}/>{DIAGRAM_TONES[t].label}</li>)}
    </ul>}
  </div>;
}
