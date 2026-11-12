import React, { useEffect, useRef, useState } from 'react';
import { Bold, Italic, Strikethrough, Code, Link, Palette } from 'lucide-react';
import { Block, NotionColor } from '../../types/notion';
import { toLocalPx } from '../../../../context/UIScaleContext';

/**
 * Barra de formatação sobre o texto selecionado num bloco (adição GaaS).
 * Os blocos são texto puro, então a formatação vira marcação Markdown (a mesma da Wiki e do briefing
 * para agentes) e a cor vale para o bloco inteiro.
 */
interface FormattingBarProps {
  onUpdateBlock: (blockId: string, partial: Partial<Block>) => void;
}

const COLORS: { name: string; color: NotionColor; class: string }[] = [
  { name: 'Padrão', color: 'default', class: 'text-[var(--notion-text)]' },
  { name: 'Cinza', color: 'gray', class: 'text-gray-500' },
  { name: 'Marrom', color: 'brown', class: 'text-amber-800' },
  { name: 'Laranja', color: 'orange', class: 'text-orange-500' },
  { name: 'Amarelo', color: 'yellow', class: 'text-amber-500' },
  { name: 'Verde', color: 'green', class: 'text-emerald-500' },
  { name: 'Azul', color: 'blue', class: 'text-blue-500' },
  { name: 'Roxo', color: 'purple', class: 'text-purple-500' },
  { name: 'Rosa', color: 'pink', class: 'text-pink-500' },
  { name: 'Vermelho', color: 'red', class: 'text-red-500' },
];

type Field = HTMLTextAreaElement | HTMLInputElement;
interface Target { el: Field; blockId: string; start: number; end: number }

export const FormattingBar: React.FC<FormattingBarProps> = ({ onUpdateBlock }) => {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const [showColors, setShowColors] = useState(false);
  const target = useRef<Target | null>(null);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const check = () => {
      const el = document.activeElement as Field | null;
      const ok = el && (el.tagName === 'TEXTAREA' || (el.tagName === 'INPUT' && (el as HTMLInputElement).type === 'text'));
      const blockId = ok ? el!.closest<HTMLElement>('[data-block-id]')?.dataset.blockId : undefined;
      if (!ok || !blockId || el!.selectionStart == null || el!.selectionStart === el!.selectionEnd) {
        if (!barRef.current?.contains(document.activeElement)) { setPos(null); setShowColors(false); }
        return;
      }
      target.current = { el: el!, blockId, start: el!.selectionStart!, end: el!.selectionEnd! };
      const box = el!.getBoundingClientRect();
      const root = el!.closest('.nt-root')?.getBoundingClientRect();
      setPos({ top: toLocalPx(box.top - (root?.top || 0)) - 40, left: Math.max(8, toLocalPx(box.left - (root?.left || 0))) });
    };
    document.addEventListener('selectionchange', check);
    document.addEventListener('mouseup', check);
    document.addEventListener('keyup', check);
    return () => { document.removeEventListener('selectionchange', check); document.removeEventListener('mouseup', check); document.removeEventListener('keyup', check); };
  }, []);

  if (!pos) return null;

  const wrap = (before: string, after = before) => {
    const t = target.current; if (!t) return;
    const v = t.el.value, sel = v.slice(t.start, t.end);
    const already = v.slice(t.start - before.length, t.start) === before && v.slice(t.end, t.end + after.length) === after;
    const next = already
      ? v.slice(0, t.start - before.length) + sel + v.slice(t.end + after.length)
      : v.slice(0, t.start) + before + sel + after + v.slice(t.end);
    onUpdateBlock(t.blockId, { content: next });
    const s = already ? t.start - before.length : t.start + before.length;
    requestAnimationFrame(() => { t.el.focus(); t.el.setSelectionRange(s, s + sel.length); });
  };
  const link = () => {
    const url = window.prompt('Endereço do link (https://…)');
    if (url && /^https?:\/\//i.test(url.trim())) wrap('[', `](${url.trim()})`);
  };
  const btn = 'p-1.5 rounded hover:bg-[var(--notion-hover)] transition-colors';
  const keep = (e: React.MouseEvent) => e.preventDefault(); // não tira o foco do bloco

  return (
    <div ref={barRef} onMouseDown={keep} style={{ top: pos.top, left: pos.left }}
      className="absolute z-50 flex items-center gap-0.5 rounded-lg border border-[var(--notion-border)] bg-[var(--notion-card)] p-1 shadow-xl text-[var(--notion-text)]">
      <button onClick={() => wrap('**')} className={btn} title="Negrito (**texto**)"><Bold size={14} /></button>
      <button onClick={() => wrap('*')} className={btn} title="Itálico (*texto*)"><Italic size={14} /></button>
      <button onClick={() => wrap('~~')} className={btn} title="Tachado (~~texto~~)"><Strikethrough size={14} /></button>
      <button onClick={() => wrap('`')} className={btn} title="Código (`texto`)"><Code size={14} /></button>
      <button onClick={link} className={btn} title="Link"><Link size={14} /></button>
      <div className="w-px h-4 bg-[var(--notion-border)] mx-0.5" />
      <div className="relative">
        <button onClick={() => setShowColors(!showColors)} className={btn} title="Cor do bloco"><Palette size={14} /></button>
        {showColors && (
          <div className="absolute left-0 top-8 z-50 w-40 rounded-lg border border-[var(--notion-border)] bg-[var(--notion-card)] p-1.5 shadow-2xl">
            {COLORS.map((c) => (
              <button key={c.color}
                onClick={() => { const t = target.current; if (t) onUpdateBlock(t.blockId, { color: c.color === 'default' ? undefined : c.color }); setShowColors(false); }}
                className="flex items-center gap-2 w-full px-2 py-1 text-xs rounded hover:bg-[var(--notion-hover)] text-left">
                <span className={`font-semibold ${c.class}`}>A</span><span>{c.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
