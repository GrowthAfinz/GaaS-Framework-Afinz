import React, { useEffect, useState } from 'react';
import { FileImage, Loader2 } from 'lucide-react';
import type { TemplatePerformance } from '../../../hooks/useTemplatePerformance';
import { getSignedUrl } from '../../../services/communicationService';
import { isEmailChannel } from '../../../utils/inferChannel';
import { CHANNELS, channelKeyOf } from './perfModel';

/**
 * Preview do CRIATIVO REAL do template (asset no storage).
 * - E-mail: HTML em iframe sandbox.
 * - WhatsApp/Push/SMS: imagem (print do criativo).
 * - Sem asset: placeholder estilizado por canal.
 * A moldura/estética vem do design do protótipo; o conteúdo é o asset real.
 */
export const ChannelPreview: React.FC<{ item: TemplatePerformance; height?: number }> = ({ item, height = 360 }) => {
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
    width: 300,
    height,
    background: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    border: '1px solid #e7ebf0',
    boxShadow: '0 12px 30px rgba(15,23,42,.12)',
  };

  if (!path || failed) {
    return (
      <div
        style={{ ...frame, background: `linear-gradient(170deg, ${ch.tint}, #fff 72%)` }}
        className="flex flex-col items-center justify-center gap-3 text-center"
      >
        <span
          className="flex h-12 w-12 items-center justify-center rounded-2xl text-white"
          style={{ background: ch.color }}
        >
          <FileImage size={22} />
        </span>
        <p className="px-6 text-xs font-semibold text-slate-500">
          Sem asset vinculado para este {ch.label}.
        </p>
        <p className="px-8 text-[11px] leading-snug text-slate-400">
          Anexe o criativo no Cadastro para ver o preview real aqui.
        </p>
      </div>
    );
  }

  if (email) {
    if (html === null) {
      return <div style={frame} className="flex items-center justify-center bg-slate-50 text-slate-300"><Loader2 size={22} className="animate-spin" /></div>;
    }
    return (
      <div style={frame}>
        <iframe title={`Preview ${item.template.template_id}`} sandbox="" srcDoc={html} className="h-full w-full bg-white" />
      </div>
    );
  }

  if (!url) {
    return <div style={frame} className="flex items-center justify-center bg-slate-50 text-slate-300"><Loader2 size={22} className="animate-spin" /></div>;
  }
  return (
    <div style={frame} className="bg-slate-50">
      <img src={url} alt={item.template.template_id} className="h-full w-full object-cover object-top" />
    </div>
  );
};

/** Thumbnail compacto e robusto (listas/tabela): tile com a sigla do canal. */
export const ChannelThumb: React.FC<{ item: TemplatePerformance; w?: number; h?: number }> = ({ item, w = 42, h }) => {
  const ch = CHANNELS[channelKeyOf(item.template.channel)];
  const height = h ?? Math.round(w * 1.25);
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-lg border"
      style={{
        width: w, height,
        background: `linear-gradient(160deg, ${ch.tint}, #fff 80%)`,
        borderColor: '#e7ebf0',
      }}
    >
      <span className="text-[10px] font-black tracking-wide" style={{ color: ch.dark }}>{ch.short}</span>
    </div>
  );
};
