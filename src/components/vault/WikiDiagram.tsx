import { Children, isValidElement, lazy, Suspense, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Maximize2, Minus, Plus, RotateCcw, X } from 'lucide-react';

const DiagramCanvas = lazy(() => import('./WikiDiagramCanvas'));

export function WikiDiagram({ source }: { source: string }) {
  const [expanded, setExpanded] = useState(false);
  const [zoom, setZoom] = useState(100);
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLButtonElement>(null);
  const title = useId();
  useEffect(() => {
    if (expanded) dialog.current?.showModal();
  }, [expanded]);
  const close = () => { setExpanded(false); setZoom(100); opener.current?.focus(); };
  const canvas = (large: boolean) => <Suspense fallback={<p className="p-6 text-sm text-slate-500" role="status">Preparando fluxo…</p>}><DiagramCanvas source={source} zoom={large ? zoom : 100} expanded={large} /></Suspense>;
  return <figure className="my-6 overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-800">
    <figcaption className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs"><span>Fluxo de lógica e estratégia</span><button ref={opener} type="button" onClick={() => setExpanded(true)} className="inline-flex items-center gap-1 rounded-md px-2 py-1 font-medium text-cyan-800 hover:bg-cyan-50"><Maximize2 size={14} /> Ampliar fluxo</button></figcaption>
    {canvas(false)}
    {expanded && createPortal(<dialog ref={dialog} onCancel={close} onClose={close} aria-labelledby={title} className="m-auto h-[94dvh] w-[96vw] max-w-none overflow-hidden rounded-xl border border-slate-200 bg-white p-0 text-slate-800 shadow-2xl backdrop:bg-slate-950/60">
      <div className="flex h-full flex-col"><header className="flex flex-wrap items-center justify-between gap-2 border-b bg-slate-50 p-3"><h2 id={title} className="text-sm font-semibold">Fluxo de lógica e estratégia</h2><div className="flex items-center gap-2"><button type="button" aria-label="Diminuir fluxo" onClick={() => setZoom(z => Math.max(50, z - 25))} className="rounded border p-2"><Minus size={16}/></button><output className="w-12 text-center text-xs">{zoom}%</output><button type="button" aria-label="Aumentar fluxo" onClick={() => setZoom(z => Math.min(300, z + 25))} className="rounded border p-2"><Plus size={16}/></button><button type="button" onClick={() => setZoom(100)} className="inline-flex items-center gap-1 rounded border p-2 text-xs"><RotateCcw size={14}/> Ajustar</button><button type="button" onClick={close} aria-label="Fechar fluxo ampliado" className="rounded border p-2"><X size={16}/></button></div></header><p className="px-4 py-2 text-xs text-slate-500">Amplie para ler os detalhes. Use as barras de rolagem para percorrer o mapa completo.</p><div className="min-h-0 flex-1 overflow-auto">{canvas(true)}</div></div>
    </dialog>, document.body)}
  </figure>;
}

export function WikiCodeBlock({ children }: { children?: ReactNode }) {
  const code = Children.toArray(children).find(isValidElement);
  if (code && isValidElement<{ className?: string; children?: ReactNode }>(code) && code.props.className?.split(/\s+/).includes('language-mermaid')) {
    return <WikiDiagram source={String(code.props.children ?? '').trim()} />;
  }
  return <pre className="my-4 overflow-x-auto rounded-xl bg-slate-950 p-4 text-xs leading-6 text-slate-100 [&>code]:block [&>code]:bg-transparent [&>code]:p-0 [&>code]:text-inherit">{children}</pre>;
}
