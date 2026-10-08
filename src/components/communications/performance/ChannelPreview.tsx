import React, { useEffect, useRef, useState } from 'react';
import { Bell, FileImage, Loader2, Mail, MessageCircle, MessageSquareText } from 'lucide-react';
import type { TemplatePerformance } from '../../../hooks/useTemplatePerformance';
import { getSignedUrl } from '../../../services/communicationService';
import { isEmailChannel } from '../../../utils/inferChannel';
import { CHANNELS, channelKeyOf } from './perfModel';

import {readContents} from '../../../services/sfmcPackageService';
import type {TemplateContent} from '../../../modules/sfmc-package/types';
import {MessagePreview} from '../previews/MessagePreview';
import {isHtmlTemplate} from '../previews/EmailHtmlPreview';
import { TemplateTextPreview } from '../previews/TemplateTextPreview';

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
 * Preview do CRIATIVO REAL do template (asset no storage).
 * - E-mail: HTML medido e ESCALADO para caber inteiro na moldura (sem scroll).
 * - WhatsApp/Push/SMS: imagem (object-contain, criativo completo).
 * - Sem asset: placeholder estilizado por canal.
 */
export const ChannelPreview: React.FC<{ item: TemplatePerformance; width?: number; height?: number }> = ({ item, width = 300, height = 360 }) => {
  const [url, setUrl] = useState<string | null>(null);
  const [html, setHtml] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [current,setCurrent]=useState<TemplateContent|null>(null);
  const [checking,setChecking]=useState(true);
  useEffect(()=>{let alive=true;const load=()=>{setChecking(true);setCurrent(null);readContents(item.template.template_id).then(rows=>{if(alive)setCurrent(rows.find(r=>r.is_current&&!!r.payload.body_text&&['WhatsApp','SMS','Push'].includes(r.payload.channel)&&channelKeyOf(r.payload.channel)===channelKeyOf(item.template.channel))||null);}).catch(()=>{}).finally(()=>{if(alive)setChecking(false);});};load();window.addEventListener('sfmc-package-changed',load);return()=>{alive=false;window.removeEventListener('sfmc-package-changed',load);};},[item.template.template_id,item.template.channel]);
  const path = item.template.original_path ?? item.template.preview_path ?? item.template.thumbnail_path ?? null;
  const email = isEmailChannel(item.template.channel)&&isHtmlTemplate(item.template);
  const ch = CHANNELS[channelKeyOf(item.template.channel)];

  useEffect(() => {
    let active = true;
    setUrl(null); setHtml(null); setFailed(false);
    if (!path) { setFailed(true); return () => { active = false; }; }
    getSignedUrl(path)
      .then(async (u) => {
        if (!active) return;
        if (email) {
          const text = await fetch(u).then((r) => {if(!r.ok)throw Error('HTML indisponível');return r.text();});
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

  if(checking&&!path)return <div style={frame} className="grid place-items-center"><Loader2 className="animate-spin" size={20}/></div>;
  if(current)return <div style={frame} className="overflow-auto">{width>=100&&<p className="bg-cyan-50 px-2 py-1 text-[10px] text-cyan-900">Pack SFMC · versão atual escolhida</p>}<div style={width<100?{width:300,transform:`scale(${width/300})`,transformOrigin:'top left'}:{}}><MessagePreview content={current.payload} compact={width<100}/></div></div>;
  if (!path || failed) {
    return <div style={frame} className="overflow-y-auto p-2"><TemplateTextPreview templateId={item.template.template_id} /></div>;
  }

  if (email) {
    if (html === null) return <div style={frame} className="flex items-center justify-center bg-slate-50 text-slate-300"><Loader2 size={22} className="animate-spin" /></div>;
    return <div style={frame}>{width>=100&&<p className="bg-slate-50 px-2 text-[10px] text-slate-600">Catálogo · versão histórica não certificada</p>}<EmailFit html={html} width={width} height={height} title={item.template.template_id} /></div>;
  }

  if (!url) return <div style={frame} className="flex items-center justify-center bg-slate-50 text-slate-300"><Loader2 size={22} className="animate-spin" /></div>;
  return (
    <div style={frame} className="relative flex items-start justify-center bg-white">
      {width>=100&&<span className="absolute bottom-0 left-0 right-0 bg-white/90 px-1 text-[10px] text-slate-600">Catálogo</span>}<img src={url} onError={() => setFailed(true)} alt={item.template.template_id} className="h-full w-full object-contain object-top" />
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

/** Thumbnail compacto e robusto (listas/tabela): tile com ícone semântico do canal. */
export const ChannelThumb: React.FC<{ item: TemplatePerformance; w?: number; h?: number }> = ({ item, w = 42, h }) => {
  return <ChannelPreview item={item} width={w} height={h??Math.round(w*1.25)}/>;
};
