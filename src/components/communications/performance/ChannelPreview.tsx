import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Bell, ImageOff, Loader2, Mail, Maximize2, MessageCircle, MessageSquareText } from 'lucide-react';
import type { PreviewResolution } from '../../../utils/communicationVisualResolution';
import { CHANNELS, channelKeyOf } from './perfModel';
import { MessagePreview } from '../previews/MessagePreview';
import { PreviewModal, PreviewThumb, ProvenanceBadge, useResolvedAsset } from '../previews/ContentPreview';

const CHANNEL_ICON = {
  email: Mail,
  whatsapp: MessageCircle,
  push: Bell,
  sms: MessageSquareText,
} as const;

export const ChannelGlyph: React.FC<{ channel: string; size?: number; className?: string }> = ({ channel, size = 17, className }) => {
  const key = channelKeyOf(channel);
  const Icon = CHANNEL_ICON[key];
  const meta = CHANNELS[key];
  return <Icon size={size} strokeWidth={2} className={className} aria-hidden="true" title={meta.label} />;
};

const EMAIL_LOGICAL_WIDTH = 640; // largura lógica de render do e-mail antes de escalar

/**
 * Prévia em moldura (galeria e painel de detalhe). A origem vem de resolvePreview e fica visível:
 * conteúdo do pack (versão atual escolhida), catálogo ou indisponível. Clicar amplia em modal central.
 * Nenhuma consulta própria: versões vêm do índice carregado uma vez e arquivos usam URL assinada em cache.
 */
export const ChannelPreview: React.FC<{ res: PreviewResolution; width?: number; height?: number; title?: string; assetName?: string | null; zoomable?: boolean }> = ({ res, width = 300, height = 360, title, assetName, zoomable = true }) => {
  const asset = useResolvedAsset(res);
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const frame: React.CSSProperties = { width, height, background: '#fff', borderRadius: 16, overflow: 'hidden', border: '1px solid #e7ebf0', boxShadow: '0 12px 30px rgba(15,23,42,.12)' };
  const text = !res.visualOrigin&&(res.kind === 'pack_message' || res.kind === 'pack_current') && !!res.content;
  const ready = text || asset.state === 'ready';

  let body: React.ReactNode;
  if(asset.content?.email_html)body=<EmailFit html={asset.content.email_html} width={width} height={height-22} title={title??res.templateId??''}/>;
  else if(asset.content)body=<MessagePreview content={asset.content}/>;
  else if (text) body = <div className="h-full overflow-auto"><MessagePreview content={res.content!} /></div>;
  else if (asset.state === 'loading') body = <div className="flex h-full items-center justify-center bg-slate-50 text-slate-300"><Loader2 size={22} className="animate-spin" aria-label="Carregando prévia" /></div>;
  else if (asset.state === 'error') body = <div className="flex h-full flex-col items-center justify-center gap-2 bg-rose-50 p-4 text-center text-xs text-rose-800"><AlertTriangle size={20} aria-hidden="true" />Falha ao acessar o arquivo da prévia.<span className="text-rose-700/80">Tente atualizar; o vínculo não foi alterado.</span></div>;
  else if (res.kind === 'catalog_html' && asset.html) body = <EmailFit html={asset.html} width={width} height={height - 22} title={title ?? res.templateId ?? ''} />;
  else if (res.kind === 'catalog_image' && asset.url) body = <img src={asset.url} alt={`Peça ${res.templateId ?? ''}`} referrerPolicy="no-referrer" className="h-full w-full object-contain object-top" />;
  else body = <div className="flex h-full flex-col items-center justify-center gap-2 bg-slate-50 p-4 text-center text-xs text-slate-600"><ImageOff size={20} className="text-slate-400" aria-hidden="true" />{res.detail}</div>;

  return (
    <div style={frame} className="relative flex flex-col">
      <div className="flex shrink-0 items-center gap-1 border-b border-slate-100 bg-white px-2 py-1 pr-10"><ProvenanceBadge res={res} className="truncate" /></div>
      <div className="min-h-0 flex-1">{body}</div>
      {zoomable && ready && <button ref={trigger} type="button" onClick={(e) => { e.stopPropagation(); setOpen(true); }} aria-label="Ampliar prévia" title="Ampliar prévia" className="absolute bottom-2 right-2 z-20 grid h-8 w-8 place-items-center rounded-lg bg-cyan-800 text-white shadow-md hover:bg-cyan-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-700"><Maximize2 size={14} /></button>}
      {open && <PreviewModal res={res} asset={asset} title={title} assetName={assetName} onClose={() => { setOpen(false); requestAnimationFrame(() => trigger.current?.focus()); }} />}
    </div>
  );
};

/** Renderiza o e-mail em largura lógica fixa, mede a altura real e escala p/ caber inteiro. Sem scripts. */
const EmailFit: React.FC<{ html: string; width: number; height: number; title: string }> = ({ html, width, height, title }) => {
  const ref = useRef<HTMLIFrameElement | null>(null);
  const [natH, setNatH] = useState<number | null>(null);
  const measure = () => {
    const doc = ref.current?.contentDocument;
    if (!doc) return;
    const h = Math.max(doc.body?.scrollHeight ?? 0, doc.documentElement?.scrollHeight ?? 0);
    if (h > 0) setNatH(h);
  };
  useEffect(() => { setNatH(null); }, [html]);
  const scale = natH ? Math.min(width / EMAIL_LOGICAL_WIDTH, height / natH) : width / EMAIL_LOGICAL_WIDTH;
  return (
    <div className="relative h-full w-full overflow-hidden bg-white">
      {/* allow-same-origin só para medir a altura; sem allow-scripts, nenhum script do HTML importado roda. */}
      <iframe ref={ref} title={`Preview ${title}`} sandbox="allow-same-origin" srcDoc={html} onLoad={measure} scrolling="no" tabIndex={-1}
        style={{ width: EMAIL_LOGICAL_WIDTH, height: natH ?? Math.round(height / (width / EMAIL_LOGICAL_WIDTH)), border: 0, transform: `scale(${scale})`, transformOrigin: 'top left', marginLeft: Math.max(0, (width - EMAIL_LOGICAL_WIDTH * scale) / 2), background: '#fff', pointerEvents: 'none' }} />
    </div>
  );
};

/** Miniatura clicável (tabela/listas). */
export const ChannelThumb: React.FC<{ res: PreviewResolution; w?: number; h?: number; title?: string; assetName?: string | null;onOpen?:()=>void }> = ({ res, w = 42, h, title, assetName,onOpen }) => (
  <PreviewThumb onOpen={onOpen} res={res} w={w} h={h ?? Math.round(w * 1.25)} title={title} assetName={assetName} />
);
