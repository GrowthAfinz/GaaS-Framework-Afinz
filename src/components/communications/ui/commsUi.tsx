import React from 'react';
import { AlertTriangle, Bell, HelpCircle, Mail, MessageCircle, MessageSquareText, type LucideIcon } from 'lucide-react';

/** Cores das BUs no design system do GaaS (CLAUDE.md). */
export const BU_COLORS = {
  B2C: { hex: '#3B82F6', bg: 'bg-blue-50', text: 'text-blue-800', ring: 'ring-blue-200' },
  B2B2C: { hex: '#10B981', bg: 'bg-emerald-50', text: 'text-emerald-800', ring: 'ring-emerald-200' },
  Plurix: { hex: '#A855F7', bg: 'bg-purple-50', text: 'text-purple-800', ring: 'ring-purple-200' },
} as const;
export type BuKey = keyof typeof BU_COLORS;

const norm = (v: string) => v.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Resolve a BU a partir de um rótulo livre (frente, público do template ou parceiro). */
export function buOf(value: string | null | undefined): BuKey | null {
  if (!value) return null;
  const v = norm(value);
  if (/plurix|\bplx\b|\bplu\b|\+amigo/.test(v)) return 'Plurix';
  if (/b2b2c|bem barato|\bbbt?\b|\bdia\b|alvorada/.test(v)) return 'B2B2C';
  if (/b2c|afinz|proprietaria/.test(v)) return 'B2C';
  return null;
}

const CHANNEL_ICON: Record<string, LucideIcon> = {
  whatsapp: MessageCircle, sms: MessageSquareText, push: Bell, email: Mail,
};
export function channelIconOf(channel: string) {
  const v = norm(channel).replace(/[^a-z]/g, '');
  return CHANNEL_ICON[v === 'wpp' ? 'whatsapp' : v === 'mail' ? 'email' : v] ?? null;
}

export type TagKind = 'front' | 'partner' | 'channel' | 'segment' | 'subgroup' | 'offer' | 'campaign' | 'other';

/**
 * Etiqueta de dimensão. BU usa a cor do design system; canal ganha ícone; o resto é neutro.
 * Divergência aparece com ícone e texto, nunca só pela cor.
 */
export function DimTag({ kind, value, label, conflict, source }: { kind: TagKind; value: string; label?: string; conflict?: boolean; source?: string }) {
  const bu = kind === 'front' ? buOf(value) : null;
  const Icon = kind === 'channel' ? channelIconOf(value) : null;
  const title = [label ? `${label}: ${value}` : value, source ? `Fonte: ${source}` : '', conflict ? 'As fontes divergem; veja os detalhes da linha.' : ''].filter(Boolean).join('\n');
  const tone = conflict
    ? 'bg-amber-50 text-amber-900 ring-amber-300'
    : bu
      ? `${BU_COLORS[bu].bg} ${BU_COLORS[bu].text} ${BU_COLORS[bu].ring}`
      : 'bg-slate-100 text-slate-700 ring-slate-200';
  return (
    <span title={title} className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ${tone}`}>
      {bu && !conflict && <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ background: BU_COLORS[bu].hex }} />}
      {conflict && <AlertTriangle size={12} aria-hidden={true} />}
      {Icon && !conflict && <Icon size={12} aria-hidden={true} />}
      {label && <span className="sr-only">{label}:</span>}
      {value}
      {conflict && <span className="font-normal">· fontes divergem</span>}
    </span>
  );
}

/** Controle segmentado acessível (botões com aria-pressed). */
export function Segmented<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { id: T; label: string; count?: number }[]; onChange: (id: T) => void }) {
  return (
    <div role="group" aria-label={label} className="inline-flex flex-wrap overflow-hidden rounded-lg border border-slate-300 bg-white">
      {options.map((o, i) => {
        const active = o.id === value;
        return (
          <button
            key={o.id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(o.id)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cyan-600 ${i ? 'border-l border-slate-300' : ''} ${active ? 'bg-cyan-50 text-cyan-900' : 'text-slate-700 hover:bg-slate-50'}`}
          >
            {o.label}
            {o.count != null && <span className={`rounded-full px-1.5 text-xs font-bold ${active ? 'bg-cyan-100 text-cyan-900' : 'bg-slate-100 text-slate-600'}`}>{o.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

export const controlClass = 'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-600';

/** Explicação curta do fluxo e glossário, para quem chega na tela pela primeira vez. */
export function HowItWorks({ steps, glossary }: { steps: { title: string; text: string }[]; glossary?: { term: string; text: string }[] }) {
  return (
    <details className="group rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
      <summary className="flex cursor-pointer list-none items-center gap-2 font-semibold text-cyan-800">
        <HelpCircle size={16} aria-hidden={true} /> Como funciona
        <span className="text-xs font-normal text-slate-500 group-open:hidden">· abra para ver os passos e o glossário</span>
      </summary>
      <ol className="mt-3 grid gap-3 md:grid-cols-3">
        {steps.map((s, i) => (
          <li key={s.title} className="rounded-lg bg-slate-50 p-3">
            <p className="font-semibold text-slate-900"><span className="mr-2 inline-grid h-6 w-6 place-items-center rounded-full bg-cyan-600 text-xs text-white">{i + 1}</span>{s.title}</p>
            <p className="mt-1 text-sm text-slate-600">{s.text}</p>
          </li>
        ))}
      </ol>
      {glossary && glossary.length > 0 && (
        <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm md:grid-cols-2">
          {glossary.map((g) => (
            <div key={g.term}><dt className="inline font-semibold text-slate-900">{g.term}: </dt><dd className="inline text-slate-600">{g.text}</dd></div>
          ))}
        </dl>
      )}
    </details>
  );
}

export const fmtDay = (iso: string | null | undefined) => {
  if (!iso) return '';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return d && m && y ? `${d}/${m}/${y}` : iso;
};
