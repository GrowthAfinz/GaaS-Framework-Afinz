import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

export type StructureAnchor = { kind: 'text' | 'image'; value: string };
export type StructureBlock = {
  id: string;
  num: number;
  label: string;
  anchor: StructureAnchor | null;
  status: 'filled' | 'empty' | 'warning';
  templateLocked?: boolean;
};

const DESKTOP_W = 680; // viewport fixo da prévia — garante o layout desktop do e-mail

const findAnchorEl = (doc: Document, anchor: StructureAnchor): Element | null => {
  if (anchor.kind === 'image') {
    const url = anchor.value;
    const seg = url.split('/').pop() || '';
    const imgs = Array.from(doc.querySelectorAll('img'));
    return imgs.find((img) => img.getAttribute('src') === url)
      || imgs.find((img) => img.src === url)
      || (seg.length > 3 ? imgs.find((img) => img.src.includes(seg)) : undefined)
      || null;
  }
  const needle = anchor.value.toLowerCase();
  const key = needle.slice(0, 18);
  if (key.length < 3) return null;
  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
  let node: Node | null;
  while ((node = walker.nextNode())) {
    const text = (node.textContent || '').trim().toLowerCase();
    if (text.length < 3) continue;
    if (needle.startsWith(text.slice(0, 18)) || text.startsWith(key) || text.includes(key)) {
      return node.parentElement;
    }
  }
  return null;
};

export const PreviewWithStructure = ({ html, contextKey, className, blocks, activeBlockId, openBlockIds, onSelectBlock, onHoverBlock }: {
  html: string;
  contextKey: string;
  className: string;
  blocks: StructureBlock[];
  activeBlockId: string | null;
  openBlockIds: Set<string>;
  onSelectBlock: (id: string) => void;
  onHoverBlock: (id: string | null) => void;
}) => {
  const boxRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const rafRef = useRef<number>();
  const [anchorTops, setAnchorTops] = useState<Record<string, number | 'missing'>>({});
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [contentH, setContentH] = useState(0);
  const [loaded, setLoaded] = useState(false);

  // escala que faz a peça inteira caber na área da prévia (poster) — sem scroll interno
  const scale = box.w > 0
    ? Math.min(1, box.w / DESKTOP_W, contentH > 0 ? Math.max(0.001, (box.h - 6) / contentH) : 1)
    : 1;

  const measure = useCallback(() => {
    const iframe = iframeRef.current;
    const el = boxRef.current;
    if (!iframe || !el) return;
    setBox((current) => (current.w === el.clientWidth && current.h === el.clientHeight ? current : { w: el.clientWidth, h: el.clientHeight }));
    let doc: Document | null = null;
    try { doc = iframe.contentDocument; } catch { doc = null; }
    if (!doc || !doc.body) { setAnchorTops({}); return; }
    const fullH = Math.max(doc.documentElement?.scrollHeight ?? 0, doc.body.scrollHeight ?? 0);
    setContentH((current) => (Math.abs(current - fullH) < 2 ? current : fullH));
    const next: Record<string, number | 'missing'> = {};
    blocks.forEach((block) => {
      if (!block.anchor) return;
      const anchorEl = findAnchorEl(doc as Document, block.anchor);
      if (!anchorEl) { next[block.id] = 'missing'; return; }
      next[block.id] = anchorEl.getBoundingClientRect().top + (iframe.contentWindow?.scrollY ?? 0);
    });
    setAnchorTops(next);
  }, [blocks]);

  useLayoutEffect(() => {
    setLoaded(false);
    const raf = requestAnimationFrame(measure);
    const timers = [250, 700, 1500, 2600].map((delay) => window.setTimeout(measure, delay));
    return () => { cancelAnimationFrame(raf); timers.forEach(window.clearTimeout); };
  }, [measure, html, contextKey]);

  useEffect(() => {
    const iframe = iframeRef.current;
    const el = boxRef.current;
    if (!iframe || !el) return;
    const schedule = () => {
      setLoaded(true);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(measure);
    };
    const boxObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(schedule) : null;
    boxObserver?.observe(el);
    let docObserver: ResizeObserver | null = null;
    const onLoad = () => {
      schedule();
      docObserver?.disconnect();
      try {
        const doc = iframe.contentDocument;
        if (doc?.documentElement && typeof ResizeObserver !== 'undefined') {
          docObserver = new ResizeObserver(schedule);
          docObserver.observe(doc.documentElement);
          if (doc.body) docObserver.observe(doc.body);
        }
        doc?.addEventListener('load', schedule, true);
      } catch { /* sandboxed */ }
    };
    iframe.addEventListener('load', onLoad);
    onLoad();
    return () => {
      iframe.removeEventListener('load', onLoad);
      boxObserver?.disconnect();
      docObserver?.disconnect();
    };
  }, [measure, html, contextKey]);

  const viewH = box.h;
  const inView: StructureBlock[] = [];
  const orphans: StructureBlock[] = [];
  blocks.forEach((block) => {
    const top = anchorTops[block.id];
    if (typeof top !== 'number') { orphans.push(block); return; }
    inView.push(block);
  });

  let band: { top: number; height: number } | null = null;
  const activeTop = activeBlockId ? anchorTops[activeBlockId] : undefined;
  if (typeof activeTop === 'number') {
    const start = activeTop * scale;
    const nextStart = inView
      .map((block) => (anchorTops[block.id] as number) * scale)
      .filter((value) => value > start + 6)
      .sort((a, b) => a - b)[0];
    band = { top: start, height: Math.max(0, ((nextStart ?? contentH * scale) || start + 120) - start) };
  }

  const pinClass = (block: StructureBlock, on: boolean) =>
    `relative grid h-6 w-6 shrink-0 place-items-center rounded-full border text-[11px] font-extrabold shadow-sm transition ${on ? 'border-cyan-600 bg-cyan-600 text-white' : block.status === 'warning' ? 'border-amber-400 bg-amber-50 text-amber-700' : 'border-cyan-300 bg-white text-cyan-800 group-hover/pin:border-cyan-500'}`;

  return (
    <div className={`flex ${className}`}>
      <div className="relative w-[30px] shrink-0 border-r border-slate-200 bg-white">
        <span className="pointer-events-none absolute inset-y-0 left-[14px] w-px bg-slate-100"/>
        {inView.map((block) => {
          const on = activeBlockId === block.id || openBlockIds.has(block.id);
          const y = Math.min(Math.max((anchorTops[block.id] as number) * scale, 12), Math.max(12, viewH - 12));
          return (
            <button
              key={block.id}
              type="button"
              onMouseEnter={() => onHoverBlock(block.id)}
              onMouseLeave={() => onHoverBlock(null)}
              onClick={() => onSelectBlock(block.id)}
              className="group/pin absolute left-1 outline-none"
              style={{ top: y, transform: 'translateY(-50%)' }}
              title={`Abrir “${block.label}” no editor`}
            >
              <span className={pinClass(block, on)}>
                {block.num}
                {block.templateLocked && <span className="absolute -right-1 -top-1 grid h-3 w-3 place-items-center rounded-full bg-slate-500 text-[7px] font-black leading-none text-white">A</span>}
              </span>
              <span className={`pointer-events-none absolute left-[24px] top-1/2 h-px w-2 -translate-y-1/2 transition ${on ? 'bg-cyan-500' : 'bg-cyan-200 group-hover/pin:bg-cyan-400'}`}/>
              <span className={`pointer-events-none absolute left-[28px] top-1/2 z-40 -translate-y-1/2 whitespace-nowrap rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold shadow-md transition-opacity ${on ? 'opacity-100 text-cyan-900' : 'opacity-0 text-slate-600 group-hover/pin:opacity-100'}`}>{block.num}. {block.label}{block.templateLocked ? ' · fixo no template' : ''}</span>
            </button>
          );
        })}
        {orphans.length > 0 && <div className="absolute bottom-1 left-1 flex flex-col gap-1">
          {orphans.map((block) => (
            <button key={block.id} type="button" onClick={() => onSelectBlock(block.id)} onMouseEnter={() => onHoverBlock(block.id)} onMouseLeave={() => onHoverBlock(null)} className="group/pin relative outline-none" title={`${block.label} · ${block.anchor ? 'fora da prévia' : 'sem conteúdo'}`}>
              <span className="grid h-6 w-6 place-items-center rounded-full border border-dashed border-slate-300 text-[11px] font-extrabold text-slate-400">{block.num}</span>
              <span className="pointer-events-none absolute left-[28px] top-1/2 z-40 -translate-y-1/2 whitespace-nowrap rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold text-slate-500 opacity-0 shadow-md transition-opacity group-hover/pin:opacity-100">{block.num}. {block.label} · {block.anchor ? 'fora da prévia' : 'sem conteúdo'}</span>
            </button>
          ))}
        </div>}
      </div>

      <div ref={boxRef} className="relative min-w-0 flex-1 overflow-hidden bg-slate-100">
        <iframe
          ref={iframeRef}
          key={contextKey}
          title="Conteúdo renderizado do e-mail dinâmico"
          sandbox="allow-same-origin"
          scrolling="no"
          srcDoc={html}
          style={{ position: 'absolute', top: 0, left: 0, width: DESKTOP_W, height: (contentH || box.h || 600) + 4, transform: `scale(${scale})`, transformOrigin: 'top left' }}
          className={`border-0 bg-white transition-opacity duration-200 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        />
        {band && band.height > 6 && (
          <div className="pointer-events-none absolute inset-x-0 z-10 border-y-2 border-cyan-400/70 bg-cyan-300/[0.12]" style={{ top: band.top, height: band.height }}/>
        )}
      </div>
    </div>
  );
};
