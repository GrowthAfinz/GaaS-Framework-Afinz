import { useLayoutEffect, useState } from 'react';
import type React from 'react';
import { Map as MapIcon, Minus, Plus, Shrink } from 'lucide-react';
import { getLocalViewport, toLocalPx } from '../../../context/UIScaleContext';
import type { useBoardViewport } from './useBoardViewport';

type Viewport = ReturnType<typeof useBoardViewport>;
interface MiniState { w: number; h: number; blocks: { x: number; y: number; w: number; h: number; c: string }[] }

/** Navegação comum dos quadros da Estrutura CRM (Board campanhas e Mapeamento): altura do canvas,
 * enquadramento inicial, barra de zoom e minimapa. Os blocos do minimapa vêm de [data-mini] no palco. */
export function useBoardChrome(vp: Viewport, opts: { ready: boolean; mini: boolean; minZoom?: number; deps?: unknown[] }) {
  useLayoutEffect(() => {
    const size = () => { const c = vp.canvasRef.current; if (!c) return; c.style.height = Math.max(380, Math.floor(getLocalViewport().height - toLocalPx(c.getBoundingClientRect().top) - 8)) + 'px'; vp.setView(v => v); };
    size(); window.addEventListener('resize', size); return () => window.removeEventListener('resize', size);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts.ready, ...(opts.deps || [])]);
  const [framed, setFramed] = useState(false);
  useLayoutEffect(() => {
    if (!opts.ready || framed || vp.hadStoredView) return;
    setFramed(true);
    window.requestAnimationFrame(() => { const c = vp.canvasRef.current, s = vp.stageRef.current; if (c && s) vp.setView({ x: 0, y: 0, z: Math.min(1, Math.max(opts.minZoom ?? 0.75, (c.clientWidth - 8) / s.offsetWidth)) }); });
  }, [opts.ready, framed, vp, opts.minZoom]);
  const [mini, setMini] = useState<MiniState>({ w: 1, h: 1, blocks: [] });
  useLayoutEffect(() => {
    const s = vp.stageRef.current; if (!s || !opts.mini) return;
    const blocks = [...s.querySelectorAll<HTMLElement>('[data-mini]')].map(el => ({ x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight, c: el.dataset.mini || '' }));
    setMini(m => (m.w === s.offsetWidth && m.h === s.offsetHeight && JSON.stringify(m.blocks) === JSON.stringify(blocks) ? m : { w: s.offsetWidth, h: s.offsetHeight, blocks }));
  });
  return mini;
}

export function BoardZoomBar({ vp, showMini, onToggleMini, children }: { vp: Viewport; showMini: boolean; onToggleMini: () => void; children?: React.ReactNode }) {
  return (
    <div className="cs-zbar" data-nopan>
      <button className="cs-zb" title="Afastar ( - )" onClick={() => vp.zoomAt(1 / 1.15)}><Minus /></button>
      <button className="cs-zb pct" title="Voltar para 100%" onClick={() => vp.zoomAt(1 / vp.view.z)}>{Math.round(vp.view.z * 100)}%</button>
      <button className="cs-zb" title="Aproximar ( + )" onClick={() => vp.zoomAt(1.15)}><Plus /></button>
      <button className="cs-zb" title="Ajustar à tela ( 0 )" onClick={vp.fit}><Shrink />Ajustar</button>
      {children}
      <button className={`cs-zb${showMini ? ' on' : ''}`} title="Minimapa ( M )" onClick={onToggleMini}><MapIcon /></button>
    </div>
  );
}

export function BoardMiniMap({ vp, mini }: { vp: Viewport; mini: MiniState }) {
  const z = vp.view.z, c = vp.canvasRef.current;
  // O minimapa cobre o quadro e a área visível juntos: quem foi para a área livre continua se vendo no mapa.
  const vx = -vp.view.x / z, vy = -vp.view.y / z, vw = (c?.clientWidth || 0) / z, vh = (c?.clientHeight || 0) / z;
  const minX = Math.min(0, vx), minY = Math.min(0, vy), spanX = Math.max(mini.w, vx + vw) - minX, spanY = Math.max(mini.h, vy + vh) - minY;
  const s = Math.min(200 / Math.max(1, spanX), 130 / Math.max(1, spanY)), h = Math.max(40, spanY * s);
  const go = (e: React.PointerEvent<HTMLDivElement>) => { if (!c) return; const r = e.currentTarget.getBoundingClientRect(); const mx = toLocalPx(e.clientX - r.left) / s + minX, my = toLocalPx(e.clientY - r.top) / s + minY; vp.setView(v => ({ ...v, x: -(mx * v.z - c.clientWidth / 2), y: -(my * v.z - c.clientHeight / 2) })); };
  return (
    <div className="cs-mini" data-nopan style={{ height: h }} onPointerDown={e => { try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* ponteiro sem captura */ } go(e); }} onPointerMove={e => { if (e.buttons) go(e); }}>
      {mini.blocks.map((b, i) => <i key={i} style={{ left: (b.x - minX) * s, top: (b.y - minY) * s, width: b.w * s, height: b.c ? 3 : b.h * s, background: b.c || 'rgba(15,23,42,.10)' }} />)}
      {c && <div className="cs-mview" style={{ left: (vx - minX) * s, top: (vy - minY) * s, width: vw * s, height: vh * s }} />}
    </div>
  );
}
