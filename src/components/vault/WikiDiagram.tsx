import { Children, isValidElement, lazy, Suspense, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Maximize2, Minus, Plus, RotateCcw, X } from 'lucide-react';
import './wikiDiagram.css';

const DiagramCanvas = lazy(() => import('./WikiDiagramCanvas'));
type DiagramFit = 'width' | 'screen' | number;
const STEP = 25;

export function WikiDiagram({ source }: { source: string }) {
  const [expanded, setExpanded] = useState(false);
  const [fit, setFit] = useState<DiagramFit>('width'), [percent, setPercent] = useState(100);
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLButtonElement>(null);
  const title = useId();
  useEffect(() => {
    if (expanded) dialog.current?.showModal();
  }, [expanded]);
  const close = () => { setExpanded(false); setFit('width'); opener.current?.focus(); };
  const step = (delta: number) => setFit(Math.min(400, Math.max(25, (Math.round(percent / STEP) + delta) * STEP)));
  const canvas = (large: boolean) => <Suspense fallback={<p className="p-6 text-sm text-slate-500" role="status">Preparando fluxo…</p>}><DiagramCanvas source={source} fit={large ? fit : 'width'} expanded={large} onScale={large ? setPercent : undefined} /></Suspense>;
  const zoomButton = 'inline-flex h-8 min-w-8 items-center justify-center gap-1 rounded-md px-2 text-xs text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40';
  return <figure className="my-6 overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-800">
    <figcaption className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-2 text-xs"><span className="font-medium text-slate-600">Fluxo de lógica e estratégia</span><button ref={opener} type="button" onClick={() => setExpanded(true)} className="inline-flex items-center gap-1 rounded-md px-2 py-1 font-medium text-cyan-800 hover:bg-cyan-50"><Maximize2 size={14} /> Ampliar fluxo</button></figcaption>
    {canvas(false)}
    {/* The app scales its root with CSS zoom; --screen-w/--screen-h undo it so the dialog really covers the screen. */}
    {expanded && createPortal(<dialog ref={dialog} onCancel={close} onClose={close} aria-labelledby={title} className="wiki-diagram-dialog m-0 overflow-hidden border-0 bg-white p-0 text-slate-800 backdrop:bg-slate-950/70" style={{ width: 'var(--screen-w, 100vw)', height: 'var(--screen-h, 100vh)', maxWidth: 'none', maxHeight: 'none', inset: 0 }}>
      <div className="flex h-full flex-col">
        <header className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-200 bg-white px-4 py-2">
          <h2 id={title} className="text-sm font-semibold text-slate-800">Fluxo de lógica e estratégia</h2>
          <div className="flex items-center gap-1">
            <button type="button" aria-label="Diminuir fluxo" disabled={percent <= 25} onClick={() => step(-1)} className={zoomButton}><Minus size={16}/></button>
            <output className="w-12 text-center text-xs tabular-nums text-slate-600">{percent}%</output>
            <button type="button" aria-label="Aumentar fluxo" disabled={percent >= 400} onClick={() => step(1)} className={zoomButton}><Plus size={16}/></button>
            <button type="button" aria-pressed={fit === 'width'} onClick={() => setFit('width')} className={`${zoomButton} ${fit === 'width' ? 'bg-slate-100 text-slate-900' : ''}`}><RotateCcw size={14}/> Largura</button>
            <button type="button" aria-pressed={fit === 'screen'} onClick={() => setFit('screen')} className={`${zoomButton} ${fit === 'screen' ? 'bg-slate-100 text-slate-900' : ''}`}><Maximize2 size={14}/> Ver inteiro</button>
            <span className="mx-1 h-5 w-px bg-slate-200" aria-hidden/>
            <button type="button" onClick={close} aria-label="Fechar fluxo ampliado" className={zoomButton}><X size={18}/></button>
          </div>
        </header>
        <div className="min-h-0 flex-1">{canvas(true)}</div>
      </div>
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
