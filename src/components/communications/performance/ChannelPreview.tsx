import React, { useEffect, useRef, useState } from 'react';
import { FileImage, Loader2 } from 'lucide-react';
import type { TemplatePerformance } from '../../../hooks/useTemplatePerformance';
import { getSignedUrl } from '../../../services/communicationService';
import { isEmailChannel } from '../../../utils/inferChannel';
import { CHANNELS, channelKeyOf } from './perfModel';

const EMAIL_LOGICAL_WIDTH = 640; // largura lógica de render do e-mail antes de escalar

/**
 * Preview do CRIATIVO REAL do template (asset no storage).
 * - E-mail: HTML medido e ESCALADO para caber inteiro na moldura (sem scroll).
 * - WhatsApp/Push/SMS: imagem (object-contain, criativo completo).
 * - Sem asset: placeholder estilizado por canal.
 */
export const ChannelPreview: React.FC<{ item: TemplatePerformance; width?: number; height?: number }> = ({ item, width = 300, height = 360 }) => {
  const [url, setUrl] = useState<string | null>(null);
  const [html, setHtml] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const path = item.template.original_path ?? item.template.preview_path ?? null;
  const email = isEmailChannel(item.template.channel);
  const ch = CHANNELS[channelKeyOf(item.template.channel)];

  useEffect(() => {
    let active = true;
    setUrl(null); setHtml(null); setFailed(false);
    if (!path) { setFailed(true); return () => { active = false; }; }
    getSignedUrl(path)
      .then(async (u) => {
        if (!active) return;
        if (email) {
          const text = await fetch(u).then((r) => r.text());
          if (active) setHtml(text);
        } else {
          setUrl(u);
        }
      })
      .catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [path, email]);

  const frame: React.CSSProperties = {
    width, height, background: '#fff', borderRadius: 16, overflow: 'hidden',
    border: '1px solid #e7ebf0', boxShadow: '0 12px 30px rgba(15,23,42,.12)',
  };

  if (!path || failed) {
    return (
      <div style={{ ...frame, background: `linear-gradient(170deg, ${ch.tint}, #fff 72%)` }} className="flex flex-col items-center justify-center gap-3 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl text-white" style={{ background: ch.color }}><FileImage size={22} /></span>
        <p className="px-6 text-xs font-semibold text-slate-500">Sem asset vinculado para este {ch.label}.</p>
        <p className="px-8 text-[11px] leading-snug text-slate-400">Anexe o criativo no Cadastro para ver o preview real aqui.</p>
      </div>
    );
  }

  if (email) {
    if (html === null) return <div style={frame} className="flex items-center justify-center bg-slate-50 text-slate-300"><Loader2 size={22} className="animate-spin" /></div>;
    return <div style={frame}><EmailFit html={html} width={width} height={height} title={item.template.template_id} /></div>;
  }

  if (!url) return <div style={frame} className="flex items-center justify-center bg-slate-50 text-slate-300"><Loader2 size={22} className="animate-spin" /></div>;
  return (
    <div style={frame} className="flex items-start justify-center bg-white">
      <img src={url} alt={item.template.template_id} className="h-full w-full object-contain object-top" />
    </div>
  );
};

/** Renderiza o e-mail em largura lógica fixa, mede a altura real e escala p/ caber inteiro. */
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

  // escala para caber tanto na largura quanto na altura da moldura
  const scale = natH ? Math.min(width / EMAIL_LOGICAL_WIDTH, height / natH) : width / EMAIL_LOGICAL_WIDTH;

  return (
    <div className="relative h-full w-full overflow-hidden bg-white">
      <iframe
        ref={ref}
        title={`Preview ${title}`}
        sandbox="allow-same-origin"
        srcDoc={html}
        onLoad={measure}
        scrolling="no"
        style={{
          width: EMAIL_LOGICAL_WIDTH,
          height: natH ?? Math.round(height / (width / EMAIL_LOGICAL_WIDTH)),
          border: 0,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          // centraliza horizontalmente quando escalado
          marginLeft: Math.max(0, (width - EMAIL_LOGICAL_WIDTH * scale) / 2),
          background: '#fff',
        }}
      />
    </div>
  );
};

/** Thumbnail compacto e robusto (listas/tabela): tile com a sigla do canal. */
export const ChannelThumb: React.FC<{ item: TemplatePerformance; w?: number; h?: number }> = ({ item, w = 42, h }) => {
  const ch = CHANNELS[channelKeyOf(item.template.channel)];
  const height = h ?? Math.round(w * 1.25);
  return (
    <div className="flex shrink-0 items-center justify-center rounded-lg border" style={{ width: w, height, background: `linear-gradient(160deg, ${ch.tint}, #fff 80%)`, borderColor: '#e7ebf0' }}>
      <span className="text-[10px] font-bold tracking-wide" style={{ color: ch.dark }}>{ch.short}</span>
    </div>
  );
};
