import { useState } from 'react';
import type { MessageContent } from '../../../modules/sfmc-package/types';
import { safeHttps } from '../../../modules/sfmc-package/parsePackage';
import { previewText, smsSegments } from '../../../modules/sfmc-package/previewModel';
function formatted(text: string) {
  return text.split(/(\*[^*\n]+\*|_[^_\n]+_|~[^~\n]+~|https:\/\/[^\s]+)/g).map((part, i) =>
    part.startsWith('*') && part.endsWith('*') ? <strong key={i}>{part.slice(1,-1)}</strong> :
    part.startsWith('_') && part.endsWith('_') ? <em key={i}>{part.slice(1,-1)}</em> :
    part.startsWith('~') && part.endsWith('~') ? <s key={i}>{part.slice(1,-1)}</s> :
    part.startsWith('https://') ? <span key={i} className="break-all text-cyan-800 underline">{part}</span> : part);
}
export function MessagePreview({ content, compact = false }: { content: MessageContent; compact?: boolean }) {
  const [fields, setFields] = useState(false), [failedBanner, setFailedBanner] = useState<string | null>(null);
  const banner = safeHttps(content.banner_url);
  const text = previewText(content, fields);
  const sms = smsSegments(text);
  if (!content.body_text || !['WhatsApp','SMS'].includes(content.channel)) return <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">{content.channel === 'E-mail' ? 'O pacote traz o e-mail sem as imagens publicadas. A prévia vem do HTML do template no catálogo; e-mail dinâmico (AMPscript, Plurix) depende do briefing.' : 'Texto completo não disponível para este canal.'}</p>;
  return <div className={'overflow-hidden rounded-xl border border-slate-200 bg-slate-50 ' + (compact ? 'text-[11px]' : 'text-sm')}>
    <div className="flex items-center justify-between gap-2 bg-white px-3 py-2">
      <span className="font-semibold">{content.channel === 'SMS' ? content.sms_from || 'SMS' : 'Afinz · WhatsApp'}</span>
      {!compact && <button type="button" onClick={() => setFields(!fields)} className="rounded border px-2 py-1 text-xs text-cyan-800">{fields ? 'Mostrar exemplo' : 'Mostrar campos'}</button>}
    </div>
    <div className={'p-3 ' + (content.channel === 'WhatsApp' ? 'bg-[#e9f0e7]' : 'bg-slate-100')}>
      <div className={'overflow-hidden rounded-lg border p-3 shadow-sm ' + (content.channel === 'WhatsApp' ? 'border-emerald-100 bg-[#d9fdd3]' : 'border-slate-200 bg-white')}>
        {banner && failedBanner !== banner && <img src={banner} alt="Imagem do cabeçalho" loading="lazy" referrerPolicy="no-referrer" onError={() => setFailedBanner(banner)} className="mb-3 max-h-64 w-full rounded object-contain" />}
        {banner && failedBanner === banner && <p className="mb-2 text-xs text-slate-600">Imagem indisponível na origem</p>}
        <div className={'whitespace-pre-wrap break-words leading-relaxed ' + (compact ? 'max-h-48 overflow-hidden' : '')}>{formatted(text)}</div>
        {content.footer && <p className="mt-3 text-xs text-slate-600">{content.footer}</p>}
        {content.buttons.map((button, i) => <div key={i} className="mt-2 border-t border-emerald-200 pt-2 text-center font-medium text-cyan-800">{button.type === 'url' ? '↗ ' : '↩ '}{button.title}</div>)}
      </div>
    </div>
    {!compact && content.channel === 'SMS' && <p className="px-3 py-2 text-xs text-slate-600">{sms.units} unidades · {sms.encoding} · {sms.segments} segmento(s) estimados no exemplo</p>}
    <p className="px-3 py-2 text-xs text-slate-600">Prévia gerada do texto do SFMC · valores de exemplo</p>
  </div>;
}

