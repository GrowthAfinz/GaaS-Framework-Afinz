import { useEffect, useRef, type ReactNode } from 'react';

export type MarkdownPart = { title?: string; content: string; offset: number };
// Explicit opt-in; code fences are opaque, so SQL and Mermaid remain unchanged.
export function splitWikiSections(content: string): MarkdownPart[] {
  const lines = content.split('\n');
  const parts: MarkdownPart[] = [];
  let start = 0, title: string | undefined, fence = '';
  for (let i = 0; i < lines.length; i++) {
    const marker = lines[i].match(/^\s*(`{3,}|~{3,})/);
    if (marker) { if (!fence) fence = marker[1]; else if (marker[1][0] === fence[0] && marker[1].length >= fence.length) fence = ''; continue; }
    if (fence) continue;
    const open = lines[i].match(/^:::details\s+(.+)$/);
    if (open && !title) { if (i > start) parts.push({ content: lines.slice(start, i).join('\n'), offset: start }); title = open[1]; start = i + 1; }
    else if (lines[i].trim() === ':::' && title) { parts.push({ title, content: lines.slice(start, i).join('\n'), offset: start }); title = undefined; start = i + 1; }
  }
  if (start < lines.length) parts.push({ title, content: lines.slice(start).join('\n'), offset: start });
  return parts;
}

export function WikiMarkdownSections({ content, render }: { content: string; render: (content: string, offset: number) => ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const parts = splitWikiSections(content);
  const hasDetails = parts.some(p => p.title);
  useEffect(() => {
    const reveal = () => {
      let hash: string;
      try { hash = decodeURIComponent(window.location.hash.slice(1)); } catch { return; }
      if (!hash) return;
      const element = document.getElementById(hash);
      if (!element || !root.current?.contains(element)) return;
      let parent = element.parentElement;
      while (parent && parent !== root.current) { if (parent instanceof HTMLDetailsElement) parent.open = true; parent = parent.parentElement; }
      element.scrollIntoView?.({ block: 'start' });
    };
    reveal(); window.addEventListener('hashchange', reveal);
    return () => window.removeEventListener('hashchange', reveal);
  }, [content]);
  const toggleAll = (open: boolean) => root.current?.querySelectorAll('details[data-wiki-section]').forEach(d => { (d as HTMLDetailsElement).open = open; });
  return <div ref={root}>{hasDetails && <div className="my-3 flex justify-end gap-2 text-xs"><button type="button" onClick={() => toggleAll(true)} className="rounded-md border border-slate-200 px-3 py-1.5 text-cyan-800 hover:bg-cyan-50">Expandir tudo</button><button type="button" onClick={() => toggleAll(false)} className="rounded-md border border-slate-200 px-3 py-1.5 text-slate-600 hover:bg-slate-50">Recolher tudo</button></div>}{parts.map((part, index) => part.title ? <details data-wiki-section key={`${index}-${part.title}`} className="group my-3 rounded-xl border border-slate-200 bg-white open:shadow-sm"><summary className="cursor-pointer rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 marker:text-cyan-700">{part.title}</summary><div className="px-4 pb-4">{render(part.content, part.offset)}</div></details> : <div key={index}>{render(part.content, part.offset)}</div>)}</div>;
}
