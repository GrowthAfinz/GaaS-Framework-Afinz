import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, Crosshair, MessageSquareText, Paperclip, X } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { getUIScale, toLocalRect } from '../../context/UIScaleContext';
import { currentFeedbackPageTarget, notifyFeedbackChanged, onFeedbackOpen } from './feedbackBus';
import { FRONTS, ITEM_TYPES, KIND_LABELS, isGeneratedNote, resolvePage, type FeedbackKind, type FeedbackTarget } from './feedbackModel';
import { ACCEPTED_FILES, MAX_FILE_BYTES, createFeedback, feedbackError } from './feedbackService';

type Picked = { rect: { top: number; left: number; width: number; height: number } } | null;

const correctionsHref = () => {
  const params = new URLSearchParams();
  params.set('view', 'learning');
  params.set('section', 'corrections');
  return `${window.location.pathname}?${params}`;
};

const clean = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
const shorten = (value: string, max = 60) => value.length > max ? value.slice(0, value.lastIndexOf(' ', max) > 20 ? value.lastIndexOf(' ', max) : max).trim() + '…' : value;

/**
 * Rótulo curto do ponto marcado: nome acessível, título do bloco (ou do bloco pai) ou a primeira linha.
 * O texto completo continua indo como trecho citado (anchor.exact), não como localização.
 */
export function describeElement(element: Element): { text: string; label: string } {
  const html = element as HTMLElement;
  const text = clean(html.innerText || html.textContent).slice(0, 300);
  const named = clean(html.getAttribute('aria-label') || html.getAttribute('title'));
  const ownHeading = html.matches('h1,h2,h3,h4,h5,h6') ? html : html.querySelector('h1,h2,h3,h4,h5,h6');
  let heading = clean(ownHeading?.textContent);
  for (let node = html.parentElement; !heading && node && node !== document.body; node = node.parentElement) {
    const candidate = node.querySelector(':scope > h1, :scope > h2, :scope > h3, :scope > h4, :scope > header h1, :scope > header h2, :scope > header h3');
    heading = clean(candidate?.textContent);
  }
  const firstLine = clean((html.innerText || '').split('\n').find(line => line.trim()));
  const label = shorten(named || heading || firstLine || element.tagName.toLowerCase());
  return { text, label };
}

/** Botão fixo em todas as telas. Abre por clique, pelo atalho Ctrl+Shift+F ou por openFeedback(). */
export function FeedbackLauncher() {
  const frente = useAppStore(state => state.viewSettings.frente);
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<FeedbackKind>('knowledge');
  const [itemType, setItemType] = useState('');
  const [body, setBody] = useState('');
  const [front, setFront] = useState('');
  const [target, setTarget] = useState<FeedbackTarget | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [shot, setShot] = useState<{ file: File; url: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [picking, setPicking] = useState(false);
  const [hover, setHover] = useState<Picked>(null);
  const textArea = useRef<HTMLTextAreaElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setBody(''); setItemType(''); setFiles([]); setError(''); setDone(false);
    setShot(prev => { if (prev) URL.revokeObjectURL(prev.url); return null; });
  }, []);

  const start = useCallback((next?: FeedbackTarget) => {
    const t = next || currentFeedbackPageTarget();
    reset();
    setTarget(t || null);
    setKind(t?.kind || 'knowledge');
    setItemType(t?.itemType || '');
    setFront(t?.front || '');
    setOpen(true);
    window.setTimeout(() => textArea.current?.focus(), 30);
  }, [reset]);

  useEffect(() => onFeedbackOpen(start), [start]);
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'f') { event.preventDefault(); start(); }
      if (event.key === 'Escape' && picking) { setPicking(false); setOpen(true); }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [start, picking]);

  const page = resolvePage(window.location.search);
  const pageLabel = target?.pageLabel || page.pageLabel;
  const location = target?.locationLabel || pageLabel;
  const generated = target?.targetType === 'note' && (target.generated || isGeneratedNote(target.targetId));

  const takeScreenshot = async () => {
    setError('');
    setOpen(false);
    await new Promise(resolve => window.setTimeout(resolve, 120));
    try {
      const { toBlob } = await import('html-to-image');
      const blob = await toBlob(document.body, {
        cacheBust: true,
        pixelRatio: 1,
        width: Math.round(window.innerWidth / getUIScale()),
        height: Math.round(window.innerHeight / getUIScale()),
        filter: node => !(node instanceof HTMLElement && node.dataset.feedbackIgnore === 'true'),
      });
      if (!blob) throw new Error('sem imagem');
      const file = new File([blob], 'print-da-tela.png', { type: 'image/png' });
      setShot(prev => { if (prev) URL.revokeObjectURL(prev.url); return { file, url: URL.createObjectURL(file) }; });
    } catch {
      setError('Não consegui capturar a tela. Você pode anexar um print salvo pelo botão Anexar arquivo.');
    } finally {
      setOpen(true);
    }
  };

  const onPickMove = (event: React.MouseEvent) => {
    const overlay = event.currentTarget as HTMLElement;
    overlay.style.pointerEvents = 'none';
    const element = document.elementFromPoint(event.clientX, event.clientY);
    overlay.style.pointerEvents = 'auto';
    if (!element || element === document.body) { setHover(null); return; }
    const rect = toLocalRect(element.getBoundingClientRect());
    setHover({ rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height } });
  };

  const onPickClick = (event: React.MouseEvent) => {
    const overlay = event.currentTarget as HTMLElement;
    overlay.style.pointerEvents = 'none';
    const element = document.elementFromPoint(event.clientX, event.clientY);
    overlay.style.pointerEvents = 'auto';
    setPicking(false);
    setHover(null);
    if (element) {
      const { text, label } = describeElement(element);
      setTarget(prev => ({
        ...(prev || {}),
        targetType: prev?.targetType || 'element',
        anchor: { ...(prev?.anchor || {}), exact: text || undefined, selector: element.tagName.toLowerCase() },
        locationLabel: `${prev?.locationLabel || pageLabel} › ${label}`,
      }));
    }
    setOpen(true);
  };

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const accepted = Array.from(list).filter(file => ACCEPTED_FILES.split(',').includes(file.type) && file.size <= MAX_FILE_BYTES);
    if (accepted.length < list.length) setError('Alguns arquivos ficaram de fora: use imagem, PDF, CSV ou XLSX de até 10 MB.');
    setFiles(prev => [...prev, ...accepted].slice(0, 9));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (body.trim().length < 3) { setError('Escreva o que está errado ou o que pode melhorar.'); return; }
    setBusy(true); setError('');
    try {
      await createFeedback({
        kind,
        item_type: itemType || 'outro',
        body: body.trim(),
        front: front || null,
        subject: target?.subject || null,
        surface: target?.surface || page.surface,
        page_label: pageLabel,
        location_label: location,
        route: window.location.search,
        target_type: target?.targetType || 'page',
        target_id: target?.targetId || null,
        anchor: (target?.anchor || {}) as Record<string, unknown>,
        context: {
          frente_topo: frente,
          viewport: `${window.innerWidth}x${window.innerHeight}`,
          escala: getUIScale(),
          gerada_por_script: generated || undefined,
        },
      }, [...(shot ? [shot.file] : []), ...files]);
      notifyFeedbackChanged();
      setDone(true);
      setBody(''); setFiles([]);
      setShot(prev => { if (prev) URL.revokeObjectURL(prev.url); return null; });
    } catch (e) {
      setError(feedbackError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div data-feedback-ignore="true">
      {picking && (
        <div
          role="presentation"
          className="fixed inset-0 z-[10000] cursor-crosshair"
          onMouseMove={onPickMove}
          onClick={onPickClick}
        >
          <div className="pointer-events-none fixed left-1/2 top-4 -translate-x-1/2 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-lg">
            Clique no ponto da tela que você quer marcar · Esc cancela
          </div>
          {hover && <div className="pointer-events-none fixed rounded border-2 border-cyan-500 bg-cyan-400/10" style={hover.rect} />}
        </div>
      )}

      {open && (
        <section
          role="dialog"
          aria-modal="false"
          aria-labelledby="feedback-title"
          className="fixed right-14 top-1/2 z-[9990] max-h-[calc(100vh-2rem)] w-[min(420px,calc(100vw-5rem))] -translate-y-1/2 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 text-slate-800 shadow-2xl"
        >
          <div className="flex items-center justify-between">
            <h2 id="feedback-title" className="text-base font-bold text-slate-900">Declarar melhoria</h2>
            <button type="button" aria-label="Fechar" onClick={() => setOpen(false)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={16} /></button>
          </div>

          {done ? (
            <div className="mt-3 space-y-3 text-sm">
              <p className="rounded-xl bg-emerald-50 p-3 text-emerald-800">Enviado. O time e a IA já veem na aba Correções e melhorias.</p>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => start(target || undefined)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">Mandar outro</button>
                <a href={correctionsHref()} className="rounded-lg bg-teal-700 px-3 py-2 text-sm font-semibold text-white">Ver a fila</a>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} className="mt-3 space-y-3">
              <div role="radiogroup" aria-label="Para onde vai" className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1 text-xs">
                {(Object.keys(KIND_LABELS) as FeedbackKind[]).map(k => (
                  <button key={k} type="button" role="radio" aria-checked={kind === k} onClick={() => { setKind(k); setItemType(''); }}
                    className={`min-h-9 rounded-lg px-1 py-2 ${kind === k ? 'bg-white font-bold text-cyan-800 shadow-sm' : 'text-slate-600'}`}>
                    {KIND_LABELS[k]}
                  </button>
                ))}
              </div>

              <label className="block text-xs font-bold text-slate-700">
                O que está errado ou pode melhorar?
                <textarea ref={textArea} value={body} onChange={e => setBody(e.target.value)} rows={4} maxLength={8000}
                  className="mt-1 block w-full resize-y rounded-xl border border-slate-300 p-2.5 text-sm font-normal text-slate-800 focus:border-cyan-500 focus:outline-none" />
              </label>

              <div className="flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 py-1 pl-3 pr-1 text-xs text-cyan-900">
                <span className="shrink-0 rounded border border-slate-400 bg-white px-1.5 font-semibold text-slate-800">{pageLabel}</span>
                <span className="min-w-0 flex-1 truncate" title={location}>{location === pageLabel ? 'Página inteira' : location}</span>
                {target && <button type="button" aria-label="Remover contexto" onClick={() => setTarget(null)} className="rounded-full p-1 hover:bg-cyan-100"><X size={13} /></button>}
              </div>
              {target?.anchor?.exact && <blockquote className="max-h-20 overflow-hidden border-l-4 border-amber-400 bg-amber-50 px-2 py-1 text-xs text-slate-700">“{target.anchor.exact}”</blockquote>}
              {generated && <p className="rounded-lg bg-orange-50 p-2 text-xs text-orange-900">Esta nota é gerada por script. A correção vai para o gerador, não para a página.</p>}
              <p className="text-[11px] text-slate-500">Vai junto, sem você digitar: página, item aberto, filtros da URL, frente do topo e seu usuário.</p>

              <div>
                <p className="mb-1 text-xs font-bold text-slate-700">Tipo (opcional)</p>
                <div className="flex flex-wrap gap-1.5">
                  {ITEM_TYPES[kind].map(([value, label]) => (
                    <button key={value} type="button" aria-pressed={itemType === value} onClick={() => setItemType(itemType === value ? '' : value)}
                      className={`rounded-full border px-2.5 py-1 text-xs ${itemType === value ? 'border-cyan-600 bg-cyan-50 font-bold text-cyan-800' : 'border-slate-300 text-slate-700'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <label className="block text-xs font-bold text-slate-700">
                Frente (opcional)
                <select value={front} onChange={e => setFront(e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white p-2 text-sm font-normal">
                  <option value="">Sem frente</option>
                  {FRONTS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </label>

              <div className="grid grid-cols-3 gap-1.5 text-xs">
                <button type="button" onClick={() => void takeScreenshot()} className="flex min-h-10 items-center justify-center gap-1 rounded-lg border border-slate-300 font-semibold text-slate-700 hover:bg-slate-50"><Camera size={14} />Print da tela</button>
                <button type="button" onClick={() => { setOpen(false); setPicking(true); }} className="flex min-h-10 items-center justify-center gap-1 rounded-lg border border-slate-300 font-semibold text-slate-700 hover:bg-slate-50"><Crosshair size={14} />Marcar na tela</button>
                <button type="button" onClick={() => fileInput.current?.click()} className="flex min-h-10 items-center justify-center gap-1 rounded-lg border border-slate-300 font-semibold text-slate-700 hover:bg-slate-50"><Paperclip size={14} />Anexar arquivo</button>
                <input ref={fileInput} type="file" multiple accept={ACCEPTED_FILES} className="hidden" onChange={e => { addFiles(e.target.files); e.target.value = ''; }} />
              </div>
              {shot && (
                <div className="flex items-start gap-2 rounded-lg border border-slate-200 p-2 text-xs">
                  <img src={shot.url} alt="Prévia do print da tela" className="h-14 w-24 rounded object-cover object-top" />
                  <p className="flex-1 text-slate-600">Confira se o print não mostra dado pessoal de cliente antes de enviar.</p>
                  <button type="button" onClick={() => setShot(prev => { if (prev) URL.revokeObjectURL(prev.url); return null; })} className="font-semibold text-red-700">Não enviar</button>
                </div>
              )}
              {files.length > 0 && (
                <ul className="space-y-1 text-xs">
                  {files.map((file, index) => (
                    <li key={file.name + index} className="flex items-center justify-between rounded bg-slate-50 px-2 py-1">
                      <span className="truncate">{file.name}</span>
                      <button type="button" onClick={() => setFiles(prev => prev.filter((_, i) => i !== index))} className="font-semibold text-red-700">Remover</button>
                    </li>
                  ))}
                </ul>
              )}

              {error && <p role="alert" className="rounded-lg bg-red-50 p-2 text-xs text-red-800">{error}</p>}
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-500">Atalho: Ctrl + Shift + F</span>
                <div className="flex gap-1.5">
                  <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700">Cancelar</button>
                  <button type="submit" disabled={busy} className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{busy ? 'Enviando…' : 'Enviar'}</button>
                </div>
              </div>
            </form>
          )}
        </section>
      )}

      {!picking && (
        <button
          type="button"
          onClick={() => (open ? setOpen(false) : start())}
          aria-expanded={open}
          title="Declarar melhoria (Ctrl + Shift + F)"
          className="fixed right-0 top-1/2 z-[9989] flex -translate-y-1/2 rotate-180 items-center gap-2 rounded-r-xl bg-slate-900 px-2 py-3.5 text-xs font-semibold tracking-wide text-white shadow-lg [writing-mode:vertical-rl] hover:bg-slate-800"
        >
          <MessageSquareText size={15} aria-hidden="true" className="rotate-180" />
          Declarar melhoria
        </button>
      )}
    </div>
  );
}
