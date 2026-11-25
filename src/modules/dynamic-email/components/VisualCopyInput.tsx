import { useLayoutEffect, useRef, useState } from 'react';
import { Bold, Undo2, Redo2 } from 'lucide-react';

export const FIRST_NAME = '%%=v(@FirstName)=%%';
const chip = '<span contenteditable="false" data-first-name class="rounded bg-cyan-100 px-1 text-cyan-900">Primeiro nome</span>';
const escapeText = (text: string) => text.replace(/[&<>%]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '%': '&#37;' })[char]!);

export function visualCopyHtml(value: string): string | null {
  if (/%%/.test(value.split(FIRST_NAME).join(''))) return null;
  // Only accept formatting the visual editor can represent without losing styles or blocks.
  const tagsRemoved = value.replace(/<\/?(?:b|strong|p)>|<br\s*\/?>/gi, '');
  if (/[<>]/.test(tagsRemoved)) return null;
  return value.replace(/\r\n?|\n/g, '<br>').split(FIRST_NAME).join(chip);
}

function serializeChildren(element: Node): string {
  const nodes = Array.from(element.childNodes);
  let html = '';
  nodes.forEach((node, index) => {
    if (node.nodeType === Node.TEXT_NODE) {
      html += escapeText((node.textContent ?? '').replace(/\u00a0/g, ' '));
      return;
    }
    if (!(node instanceof HTMLElement)) return;
    if (node.hasAttribute('data-first-name')) {
      html += FIRST_NAME;
      return;
    }
    if (node.tagName === 'BR') {
      if (index !== nodes.length - 1 || node.previousSibling?.nodeName === 'BR') html += '<br>';
      return;
    }
    const content = serializeChildren(node);
    if (node.matches('b,strong')) {
      html += content ? '<b>' + content + '</b>' : '';
      return;
    }
    if (node.matches('p,div') && index > 0) html += node.tagName === 'P' ? '<br><br>' : '<br>';
    html += content;
  });
  return html;
}

const button = 'inline-flex min-h-8 items-center gap-1 rounded px-2 text-slate-700 hover:bg-cyan-100 focus-visible:outline focus-visible:outline-cyan-600';

export function VisualCopyInput({ id, label, html, onChange, firstName }: {
  id?: string; label: string; html: string; onChange: (html: string) => void; firstName: boolean;
}) {
  const editor = useRef<HTMLDivElement>(null);
  const lastValue = useRef<string>();
  const selection = useRef<Range>();
  const [bold, setBold] = useState(false);
  useLayoutEffect(() => {
    if (!editor.current || lastValue.current === html) return;
    editor.current.innerHTML = visualCopyHtml(html) ?? '';
    lastValue.current = html;
    selection.current = undefined;
    setBold(false);
  }, [html]);

  const rememberSelection = () => {
    const current = window.getSelection();
    if (!current?.rangeCount || !editor.current?.contains(current.getRangeAt(0).commonAncestorContainer)) return;
    selection.current = current.getRangeAt(0).cloneRange();
    setBold(document.queryCommandState('bold'));
  };

  const publish = () => {
    const value = serializeChildren(editor.current!);
    if (lastValue.current !== value) {
      lastValue.current = value;
      onChange(value);
    }
    rememberSelection();
  };

  const run = (command: string, value?: string) => {
    const element = editor.current!;
    element.focus();
    const current = window.getSelection();
    if (current && selection.current && element.contains(selection.current.commonAncestorContainer)) {
      current.removeAllRanges();
      current.addRange(selection.current);
    }
    document.execCommand(command, false, value);
    publish();
  };

  return <div className="overflow-hidden rounded-lg border border-slate-300 focus-within:border-cyan-500">
    <div role="group" aria-label={`Formatação de ${label.toLowerCase()}`} className="flex flex-wrap gap-1 border-b border-slate-200 bg-slate-50 p-1 text-xs">
      <button type="button" className={`${button} ${bold ? 'bg-cyan-100' : ''}`} aria-pressed={bold} onMouseDown={(event) => event.preventDefault()} onClick={() => run('bold')}><Bold size={14}/>Negrito</button>
      <button type="button" className={button} aria-label="Desfazer" title="Desfazer" onMouseDown={(event) => event.preventDefault()} onClick={() => run('undo')}><Undo2 size={15}/></button>
      <button type="button" className={button} aria-label="Refazer" title="Refazer" onMouseDown={(event) => event.preventDefault()} onClick={() => run('redo')}><Redo2 size={15}/></button>
      {firstName && <button type="button" className={button} onMouseDown={(event) => event.preventDefault()} onClick={() => run('insertHTML', chip)}>+ Primeiro nome</button>}
    </div>
    <div id={id} ref={editor} contentEditable suppressContentEditableWarning role="textbox" aria-label={label} aria-multiline="true"
      className="min-h-20 break-words whitespace-pre-wrap px-3 py-2 text-sm font-normal leading-5 text-slate-800 outline-none [&_p+p]:mt-3"
      onInput={publish} onSelect={rememberSelection} onKeyUp={rememberSelection} onMouseUp={rememberSelection}
      onKeyDown={(event) => {
        if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
          event.preventDefault();
          run('insertHTML', event.shiftKey ? '<br>' : '<br><br>');
        }
      }}
      onPaste={(event) => {
        event.preventDefault();
        const text = event.clipboardData.getData('text/plain');
        run('insertHTML', escapeText(text).replace(/\r\n?|\n/g, '<br>'));
      }}
      onDrop={(event) => event.preventDefault()}/>
  </div>;
}
