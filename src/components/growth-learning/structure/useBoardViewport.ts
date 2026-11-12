import { useCallback, useEffect, useRef, useState } from 'react';
import type React from 'react';
import { toLocalPx } from '../../../context/UIScaleContext';

export interface BoardView { x: number; y: number; z: number }
export const ZOOM_MIN = 0.1;
export const ZOOM_MAX = 2.5;
/** Área livre em volta do quadro: dá para arrastar para longe dos pilares, mas sempre sobra este tanto do conteúdo à vista. */
const KEEP_VISIBLE = 160;
const GRID = 20;

function readView(key: string): BoardView | null {
  try {
    const v = JSON.parse(localStorage.getItem(key) || 'null');
    return v && typeof v.x === 'number' && typeof v.y === 'number' && typeof v.z === 'number' ? v : null;
  } catch { return null; }
}

/** Quadro navegável: arrastar o fundo move, Ctrl+roda/pinça dá zoom no cursor, roda rola.
 * Mouse e retângulos vêm em px físicos; o transform é escrito em px locais (zoom global do app). */
export function useBoardViewport(storageKey: string, active = true) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const stored = useRef(readView(storageKey));
  const [view, setViewRaw] = useState<BoardView>(stored.current || { x: 0, y: 0, z: 1 });
  const viewRef = useRef(view);
  viewRef.current = view;

  const clamp = useCallback((v: BoardView): BoardView => {
    const canvas = canvasRef.current, stage = stageRef.current;
    if (!canvas || !stage) return v;
    const z = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, v.z));
    const cw = canvas.clientWidth, ch = canvas.clientHeight, w = stage.offsetWidth * z, h = stage.offsetHeight * z;
    const keepX = Math.min(KEEP_VISIBLE, w, cw / 2), keepY = Math.min(KEEP_VISIBLE, h, ch / 2);
    const x = Math.min(cw - keepX, Math.max(v.x, keepX - w));
    const y = Math.min(ch - keepY, Math.max(v.y, keepY - h));
    return { x, y, z };
  }, []);
  const setView = useCallback((v: BoardView | ((prev: BoardView) => BoardView)) => {
    setViewRaw(prev => {
      const next = clamp(typeof v === 'function' ? v(prev) : v);
      return next.x === prev.x && next.y === prev.y && next.z === prev.z ? prev : next;
    });
  }, [clamp]);

  const localPoint = (clientX: number, clientY: number) => {
    const r = canvasRef.current!.getBoundingClientRect();
    return { x: toLocalPx(clientX - r.left), y: toLocalPx(clientY - r.top) };
  };
  const zoomAt = useCallback((factor: number, cx?: number, cy?: number) => {
    setView(prev => {
      const z = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, prev.z * factor));
      const canvas = canvasRef.current;
      const px = cx ?? (canvas ? canvas.clientWidth / 2 : 0), py = cy ?? (canvas ? canvas.clientHeight / 2 : 0);
      return { x: px - (px - prev.x) * (z / prev.z), y: py - (py - prev.y) * (z / prev.z), z };
    });
  }, [setView]);
  const fit = useCallback(() => {
    const canvas = canvasRef.current, stage = stageRef.current;
    if (!canvas || !stage) return;
    const z = Math.min(1, Math.max(ZOOM_MIN, (canvas.clientWidth - 8) / stage.offsetWidth));
    setView({ x: 0, y: 0, z });
  }, [setView]);
  /** Centraliza um elemento do quadro se ele estiver fora da área visível. */
  const reveal = useCallback((el: Element | null) => {
    const canvas = canvasRef.current, stage = stageRef.current;
    if (!el || !canvas || !stage) return;
    const cr = canvas.getBoundingClientRect(), r = el.getBoundingClientRect(), sr = stage.getBoundingClientRect();
    const inside = r.left >= cr.left + 16 && r.right <= cr.right - 16 && r.top >= cr.top + 16 && r.bottom <= cr.bottom - 56;
    if (inside) return;
    const z = viewRef.current.z;
    const lx = toLocalPx(r.left - sr.left) / z, ly = toLocalPx(r.top - sr.top) / z;
    setView({ x: -lx * z + canvas.clientWidth / 2 - toLocalPx(r.width) / 2, y: -ly * z + Math.min(canvas.clientHeight / 3, 160), z });
  }, [setView]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onWheel = (e: WheelEvent) => {
      if ((e.target as Element).closest('[data-wheel-own]')) return;
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        const p = localPoint(e.clientX, e.clientY);
        zoomAt(Math.exp(-e.deltaY * 0.0012), p.x, p.y);
      } else if (e.shiftKey) setView(v => ({ ...v, x: v.x - toLocalPx(e.deltaY) }));
      else setView(v => ({ ...v, x: v.x - toLocalPx(e.deltaX), y: v.y - toLocalPx(e.deltaY) }));
    };
    // Rolagem programática (focus, scrollIntoView) não pode deslocar o conteúdo transformado.
    const onScroll = () => { if (canvas.scrollTop || canvas.scrollLeft) { canvas.scrollTop = 0; canvas.scrollLeft = 0; } };
    // Ctrl/Cmd + "+", "-" e "0" dão zoom no quadro (e não na página), como no explorador de jornadas.
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.altKey || !canvas.isConnected || !canvas.offsetParent) return;
      const a = document.activeElement as HTMLElement | null;
      if (a && (/INPUT|TEXTAREA|SELECT/.test(a.tagName) || a.isContentEditable)) return;
      if (e.key === '+' || e.key === '=') zoomAt(1.15);
      else if (e.key === '-' || e.key === '_') zoomAt(1 / 1.15);
      else if (e.key === '0') fit();
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    canvas.addEventListener('wheel', onWheel, { passive: false });
    canvas.addEventListener('scroll', onScroll);
    const onResize = () => setView(v => v);
    window.addEventListener('resize', onResize);
    return () => { window.removeEventListener('keydown', onKey); canvas.removeEventListener('wheel', onWheel); canvas.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onResize); };
    // `active` religa roda e atalhos quando o canvas aparece (ex.: depois da tela de carregamento).
  }, [setView, zoomAt, fit, active]);

  useEffect(() => {
    const t = window.setTimeout(() => { try { localStorage.setItem(storageKey, JSON.stringify(view)); } catch { /* preferência local */ } }, 300);
    return () => window.clearTimeout(t);
  }, [storageKey, view]);

  const pan = useRef<{ sx: number; sy: number; x: number; y: number; moved: boolean } | null>(null);
  const [panning, setPanning] = useState(false);
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const target = e.target as Element;
    const blocked = target.closest('[data-nopan],button,input,textarea,select,a,[contenteditable="true"]');
    if (!(e.button === 1 || (e.button === 0 && !blocked))) return;
    if (e.button === 1) e.preventDefault();
    pan.current = { sx: e.clientX, sy: e.clientY, x: viewRef.current.x, y: viewRef.current.y, moved: false };
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* ponteiro sem captura */ }
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const p = pan.current;
    if (!p) return;
    const dx = toLocalPx(e.clientX - p.sx), dy = toLocalPx(e.clientY - p.sy);
    if (!p.moved && Math.hypot(dx, dy) < 4) return;
    if (!p.moved) { p.moved = true; setPanning(true); }
    setView(v => ({ ...v, x: p.x + dx, y: p.y + dy }));
  };
  const onPointerUp = () => { pan.current = null; setPanning(false); };
  /** Durante o arrasto de um card, o quadro anda sozinho perto das bordas. */
  const lastAuto = useRef(0);
  const onDragOverEdge = (e: React.DragEvent<HTMLDivElement>) => {
    const now = performance.now();
    if (now - lastAuto.current < 16 || !canvasRef.current) return;
    lastAuto.current = now;
    const r = canvasRef.current.getBoundingClientRect(), edge = 70;
    let dx = 0, dy = 0;
    if (e.clientX < r.left + edge) dx = 14; else if (e.clientX > r.right - edge) dx = -14;
    if (e.clientY < r.top + edge) dy = 12; else if (e.clientY > r.bottom - edge) dy = -12;
    if (dx || dy) setView(v => ({ ...v, x: v.x + dx, y: v.y + dy }));
  };

  /** Pontilhado do fundo acompanha arrasto e zoom, para a área livre parecer parte do quadro. */
  const gridStyle: React.CSSProperties = { backgroundPosition: `${Math.round(view.x)}px ${Math.round(view.y)}px`, backgroundSize: `${GRID * view.z}px ${GRID * view.z}px` };

  return {
    canvasRef, stageRef, view, setView, zoomAt, fit, reveal, panning, gridStyle, hadStoredView: Boolean(stored.current),
    handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp, onDragOver: onDragOverEdge },
  };
}
