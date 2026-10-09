import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, ImageOff, Loader2, Maximize2, X } from 'lucide-react';
import type { PreviewResolution } from '../../../utils/communicationVisualResolution';
import { cachedSignedUrl } from '../../../services/templateContentIndex';
import { MessagePreview } from './MessagePreview';
import { EmailPreviewPanel, EmailThumb, useTemplateHtml } from './EmailHtmlPreview';
import {readJourneyMessage} from '../../../services/journeyReadService';
import type {MessageContent} from '../../../modules/sfmc-package/types';

// Prévia única para fila, biblioteca e Performance. A resolução (qual conteúdo, de onde) vem de
// resolvePreview; aqui só se carrega o recurso e se distingue: carregando, falha de acesso e ausência.

type AssetState = { state: 'none' | 'loading' | 'ready' | 'error'; url?: string; html?: string;content?:MessageContent };

export function useResolvedAsset(res: PreviewResolution): AssetState {
  const originKey=res.visualOrigin?res.visualOrigin.snapshot_id+':'+res.visualOrigin.occurrence_key:'';
  const [recovered,setRecovered]=useState<AssetState&{key?:string}>({state:'none'});
  useEffect(()=>{let alive=true;setRecovered({state:res.visualOrigin?'loading':'none',key:originKey});if(res.visualOrigin)readJourneyMessage(res.visualOrigin.snapshot_id,res.visualOrigin.occurrence_key).then(m=>{if(alive)setRecovered({state:'ready',content:m.content,key:originKey});}).catch(()=>{if(alive)setRecovered({state:'error',key:originKey});});return()=>{alive=false;};},[originKey]);
  const [image, setImage] = useState<AssetState>({ state: 'none' });
  const isImage = res.kind === 'catalog_image' && !!res.assetPath;
  useEffect(() => {
    let alive = true;
    if (!isImage) { setImage({ state: 'none' }); return () => { alive = false; }; }
    setImage({ state: 'loading' });
    cachedSignedUrl(res.assetPath!).then((url) => { if (alive) setImage({ state: 'ready', url }); }).catch(() => { if (alive) setImage({ state: 'error' }); });
    return () => { alive = false; };
  }, [isImage, res.assetPath]);
  const email = useTemplateHtml(res.kind === 'catalog_html' ? res.template : null);
  if(res.visualOrigin)return recovered.key===originKey?recovered:{state:'loading'};
  if (res.kind === 'catalog_html') return email.html ? { state: 'ready', html: email.html } : email.failed ? { state: 'error' } : { state: 'loading' };
  if (isImage) return image;
  return { state: res.kind === 'pack_message' || res.kind === 'pack_current' ? 'ready' : 'none' };
}

const KIND_TONE: Record<PreviewResolution['kind'], string> = {
  pack_message: 'bg-cyan-50 text-cyan-900', pack_current: 'bg-cyan-50 text-cyan-900',
  catalog_html: 'bg-slate-50 text-slate-700', catalog_image: 'bg-slate-50 text-slate-700', none: 'bg-amber-50 text-amber-900',
};

export const ProvenanceBadge: React.FC<{ res: PreviewResolution; className?: string }> = ({ res, className = '' }) => (
  <span title={res.detail} className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold ${KIND_TONE[res.kind]} ${className}`}>
    {res.kind === 'none' && <ImageOff size={10} aria-hidden="true" />}{res.label}
  </span>
);

/** Conteúdo renderizado (sem moldura). `scaleTo` reduz mensagens de texto para miniaturas. */
const Body: React.FC<{ res: PreviewResolution; asset: AssetState; compact?: boolean; full?: boolean }> = ({ res, asset, compact, full }) => {
  if(asset.content)return <MessagePreview content={asset.content} compact={compact}/>;
  if (!res.visualOrigin&&(res.kind === 'pack_message' || res.kind === 'pack_current') && res.content) return <MessagePreview content={res.content} compact={compact} />;
  if (asset.state === 'loading') return <div className="grid h-full min-h-[48px] w-full place-items-center text-slate-400"><Loader2 size={16} className="animate-spin" aria-label="Carregando prévia" /></div>;
  if (asset.state === 'error') return <div className="grid h-full w-full place-items-center p-1 text-center text-[10px] leading-tight text-rose-700"><span><AlertTriangle size={12} className="mx-auto mb-0.5" aria-hidden="true" />Falha ao carregar a prévia</span></div>;
  if (res.kind === 'catalog_html' && asset.html) return full && res.template ? <EmailPreviewPanel html={asset.html} template={res.template} height="calc(var(--screen-h) * 0.6)" /> : <EmailThumb html={asset.html} />;
  if (res.kind === 'catalog_image' && asset.url) return <img src={asset.url} alt={`Peça do catálogo ${res.templateId ?? ''}`} referrerPolicy="no-referrer" className={full ? 'w-full object-contain' : 'h-full w-full object-cover object-top'} />;
  return <div className="grid h-full w-full place-items-center p-1 text-center text-[10px] leading-tight text-slate-600">{res.templateId ? 'ID identificado · sem prévia' : 'Sem prévia'}</div>;
};

export const PreviewModal: React.FC<{ res: PreviewResolution; asset: AssetState; title?: string; assetName?: string | null; onClose: () => void }> = ({ res, asset, title, assetName, onClose }) => {
  const dialog = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.current?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); onClose(); }
      if (e.key === 'Tab') {
        const nodes = dialog.current?.querySelectorAll<HTMLElement>('button, [href], input, select, textarea');
        if (!nodes?.length) return;
        const first = nodes[0], last = nodes[nodes.length - 1];
        if (e.shiftKey && (document.activeElement === first || document.activeElement === dialog.current)) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', key, true);
    return () => { document.body.style.overflow = previous; document.removeEventListener('keydown', key, true); };
  }, [onClose]);
  const wide = res.kind === 'catalog_html' || res.kind === 'catalog_image';
  return createPortal(
    <div className="fixed inset-0 z-[160] flex items-center justify-center bg-slate-950/70 p-4" onClick={onClose}>
      <div ref={dialog} tabIndex={-1} role="dialog" aria-modal="true" aria-label={`Prévia ${title ?? res.templateId ?? ''}`} onClick={(e) => e.stopPropagation()}
        className={`max-h-[90vh] w-full overflow-auto rounded-2xl bg-white p-5 shadow-2xl outline-none ${wide ? 'max-w-5xl' : 'max-w-xl'}`}>
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {title && <p className="truncate font-mono text-sm font-bold text-slate-900">{title}</p>}
            {assetName && <p className="mt-0.5 text-sm text-slate-700">Peça: {assetName}</p>}
            <div className="mt-1 flex flex-wrap items-center gap-2"><ProvenanceBadge res={res} /><span className="text-xs text-slate-600">{res.detail}</span></div>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar prévia" className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"><X size={16} /></button>
        </div>
        <Body res={res} asset={asset} full />
      </div>
    </div>, document.body);
};

/**
 * Miniatura clicável: abre o modal central amplo (Escape fecha, foco volta à miniatura).
 * Sem conteúdo disponível, mostra o motivo e não abre modal vazio.
 */
export const PreviewThumb: React.FC<{ res: PreviewResolution; title?: string; assetName?: string | null; w?: number; h?: number; showBadge?: boolean;onOpen?:()=>void }> = ({ res, title, assetName, w = 56, h = 64, showBadge,onOpen }) => {
  const asset = useResolvedAsset(res);
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const available = (res.kind === 'pack_message' || res.kind === 'pack_current') || asset.state === 'ready';
  const close = () => { setOpen(false); requestAnimationFrame(() => trigger.current?.focus()); };
  const textScale = Math.min(w / 300, 1);
  const inner = (res.kind === 'pack_message' || res.kind === 'pack_current')
    ? <div className="pointer-events-none origin-top-left" style={{ width: 300, transform: `scale(${textScale})` }} aria-hidden="true"><MessagePreview content={res.content!} compact /></div>
    : <Body res={res} asset={asset} />;
  const tip = [assetName, res.label, res.detail].filter(Boolean).join(' · ');
  return (
    <div className="inline-flex shrink-0 flex-col items-start gap-1">
      {available ? (
        <button ref={trigger} type="button" onClick={(e) => { e.stopPropagation(); if(onOpen)onOpen();else setOpen(true); }} title={tip} aria-label={`Ampliar prévia de ${title ?? res.templateId ?? 'comunicação'}`}
          className="relative block shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm hover:ring-2 hover:ring-cyan-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-700" style={{ width: w, height: h }}>
          {inner}
          <span aria-hidden="true" className="absolute bottom-1 right-1 grid h-4 w-4 place-items-center rounded bg-cyan-800 text-white"><Maximize2 size={10} /></span>
        </button>
      ) : (
        <span title={tip} className={`grid shrink-0 place-items-center overflow-hidden rounded-lg border border-dashed ${asset.state === 'error' ? 'border-rose-300 bg-rose-50' : 'border-slate-300 bg-slate-50'}`} style={{ width: w, height: h }}>
          <Body res={res} asset={asset} />
        </span>
      )}
      {showBadge && <ProvenanceBadge res={res} />}
      {open && <PreviewModal res={res} asset={asset} title={title} assetName={assetName} onClose={close} />}
    </div>
  );
};
