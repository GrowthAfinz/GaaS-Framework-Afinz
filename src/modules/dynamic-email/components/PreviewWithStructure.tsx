import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

export type StructureAnchor = { kind: 'text' | 'image'; value: string };
export type StructureBlock = {
  id: string;
  num: number;
  label: string;
  anchor: StructureAnchor | null;
  status: 'filled' | 'empty' | 'warning';
};

type Placement = { visibleTop: number; docTop: number; height: number };

const RAIL_W = 150;

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
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const rafRef = useRef<number>();
  const [placements, setPlacements] = useState<Record<string, Placement | 'missing'>>({});
  const [frameH, setFrameH] = useState(0);

  const measure = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    let doc: Document | null = null;
    try { doc = iframe.contentDocument; } catch { doc = null; }
    setFrameH(iframe.clientHeight);
    if (!doc || !doc.body) { setPlacements({}); return; }
    let scrollY = 0;
    try { scrollY = iframe.contentWindow?.scrollY ?? 0; } catch { scrollY = 0; }
    const next: Record<string, Placement | 'missing'> = {};
    blocks.forEach((block) => {
      if (!block.anchor) return;
      const el = findAnchorEl(doc as Document, block.anchor);
      if (!el) { next[block.id] = 'missing'; return; }
      const rect = el.getBoundingClientRect();
      next[block.id] = { visibleTop: rect.top, docTop: rect.top + scrollY, height: rect.height };
    });
    setPlacements(next);
  }, [blocks]);

  useLayoutEffect(() => {
    const raf = requestAnimationFrame(measure);
    const timers = [300, 900, 1800].map((delay) => window.setTimeout(measure, delay));
    return () => { cancelAnimationFrame(raf); timers.forEach(window.clearTimeout); };
  }, [measure, html, contextKey]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const schedule = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(measure);
    };
    iframe.addEventListener('load', schedule);
    const resizeObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(schedule) : null;
    resizeObserver?.observe(iframe);
    let win: Window | null = null;
    let doc: Document | null = null;
    try { win = iframe.contentWindow; doc = iframe.contentDocument; } catch { win = null; doc = null; }
    win?.addEventListener('scroll', schedule, { passive: true });
    win?.addEventListener('resize', schedule);
    doc?.addEventListener('load', schedule, true);
    return () => {
      iframe.removeEventListener('load', schedule);
      resizeObserver?.disconnect();
      win?.removeEventListener('scroll', schedule);
      win?.removeEventListener('resize', schedule);
      doc?.removeEventListener('load', schedule, true);
    };
  }, [measure, html, contextKey]);

  useEffect(() => {
    if (!activeBlockId) return;
    const placement = placements[activeBlockId];
    if (!placement || placement === 'missing') return;
    try { iframeRef.current?.contentWindow?.scrollTo({ top: Math.max(0, placement.docTop - 44), behavior: 'smooth' }); } catch { /* sandboxed */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBlockId]);

  const inView: StructureBlock[] = [];
  const above: StructureBlock[] = [];
  const below: StructureBlock[] = [];
  const orphans: StructureBlock[] = [];
  blocks.forEach((block) => {
    const placement = placements[block.id];
    if (!block.anchor || placement === 'missing' || !placement) { orphans.push(block); return; }
    if (placement.visibleTop < -16) above.push(block);
    else if (placement.visibleTop > frameH + 16) below.push(block);
    else inView.push(block);
  });

  let band: { top: number; height: number } | null = null;
  const activePlacement = activeBlockId ? placements[activeBlockId] : null;
  if (activePlacement && activePlacement !== 'missing') {
    const top = Math.max(0, activePlacement.visibleTop);
    const nextTop = inView
      .map((block) => placements[block.id] as Placement)
      .filter((placement) => placement.visibleTop > activePlacement.visibleTop + 4)
      .sort((a, b) => a.visibleTop - b.visibleTop)[0]?.visibleTop ?? frameH;
    band = { top, height: Math.max(0, Math.min(frameH, nextTop) - top) };
  }

  const pinClass = (block: StructureBlock, active: boolean, open: boolean) =>
    `grid h-6 w-6 shrink-0 place-items-center rounded-full border text-[11px] font-extrabold shadow-sm transition ${active || open ? 'border-cyan-600 bg-cyan-600 text-white' : block.status === 'warning' ? 'border-amber-400 bg-amber-50 text-amber-700' : 'border-cyan-300 bg-white text-cyan-800 group-hover:border-cyan-500'}`;

  const OffscreenGroup = ({ list, arrow, anchorClass }: { list: StructureBlock[]; arrow: string; anchorClass: string }) => (
    <div className={`absolute ${anchorClass} left-1 right-1 flex flex-col gap-0.5`}>
      {list.map((block) => (
        <button
          key={block.id}
          type="button"
          onMouseEnter={() => onHoverBlock(block.id)}
          onMouseLeave={() => onHoverBlock(null)}
          onClick={() => onSelectBlock(block.id)}
          className="group flex items-center gap-1 rounded bg-white/90 outline-none"
          title={`Ir para o bloco “${block.label}”`}
        >
          <span className={pinClass(block, activeBlockId === block.id, openBlockIds.has(block.id))}>{block.num}</span>
          <span className="min-w-0 flex-1 truncate text-left text-[9.5px] font-bold text-slate-400">{block.label} {arrow}</span>
        </button>
      ))}
    </div>
  );

  return (
    <div className={`relative flex ${className}`}>
      <div className="relative w-[150px] shrink-0 border-r border-slate-200 bg-white">
        <span className="pointer-events-none absolute inset-y-0 left-[19px] w-px bg-slate-100"/>
        {above.length > 0 && <OffscreenGroup list={above} arrow="↑" anchorClass="top-1"/>}
        {inView.map((block) => {
          const placement = placements[block.id] as Placement;
          const active = activeBlockId === block.id;
          const open = openBlockIds.has(block.id);
          const top = Math.min(Math.max(placement.visibleTop, 10), Math.max(10, frameH - 10));
          return (
            <button
              key={block.id}
              type="button"
              onMouseEnter={() => onHoverBlock(block.id)}
              onMouseLeave={() => onHoverBlock(null)}
              onClick={() => onSelectBlock(block.id)}
              className="group absolute left-1.5 right-0 flex items-center gap-1.5 outline-none"
              style={{ top, transform: 'translateY(-50%)' }}
              title={`Ir para o bloco “${block.label}”`}
            >
              <span className={pinClass(block, active, open)}>{block.num}</span>
              <span className={`min-w-0 flex-1 truncate text-left text-[10px] font-bold leading-tight transition ${active || open ? 'text-cyan-900' : 'text-slate-500 group-hover:text-slate-800'}`}>{block.label}</span>
              <span className={`pointer-events-none absolute left-full top-1/2 h-px w-2 transition ${active ? 'bg-cyan-500' : 'bg-cyan-200 group-hover:bg-cyan-400'}`}/>
            </button>
          );
        })}
        {below.length > 0 && <OffscreenGroup list={below} arrow="↓" anchorClass={orphans.length > 0 ? 'bottom-[46px]' : 'bottom-1'}/>}
        {!inView.length && !above.length && !below.length && <p className="px-2.5 pt-3 text-[10px] leading-4 text-slate-400">A prévia ainda vai carregar os blocos.</p>}
        {orphans.length > 0 && <div className="absolute inset-x-0 bottom-0 space-y-1 border-t border-slate-100 bg-white/95 px-2 py-1.5">
          {orphans.map((block) => (
            <button
              key={block.id}
              type="button"
              onClick={() => onSelectBlock(block.id)}
              onMouseEnter={() => onHoverBlock(block.id)}
              onMouseLeave={() => onHoverBlock(null)}
              className="flex w-full items-center gap-1.5 text-left outline-none"
            >
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full border border-slate-200 text-[9px] font-extrabold text-slate-400">{block.num}</span>
              <span className="truncate text-[9.5px] font-semibold text-slate-400">{block.label} · {block.anchor ? 'fora da prévia' : 'vazio'}</span>
            </button>
          ))}
        </div>}
      </div>

      <iframe
        ref={iframeRef}
        key={contextKey}
        title="Conteúdo renderizado do e-mail dinâmico"
        sandbox="allow-same-origin"
        srcDoc={html}
        className="h-full flex-1 bg-white"
      />

      {band && band.height > 6 && (
        <div
          className="pointer-events-none absolute z-20 rounded-sm border-y-2 border-cyan-400/70 bg-cyan-300/[0.12]"
          style={{ left: RAIL_W, right: 0, top: band.top, height: band.height }}
        />
      )}
    </div>
  );
};
