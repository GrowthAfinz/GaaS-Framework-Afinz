import { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Bold, Undo2, Redo2 } from 'lucide-react';
import { COPY_TOKEN_PATTERN, COPY_VARIABLES, copyToken, copyVariable, withoutCopyTokens, type CopyVariable } from '../domain/copyVariables';

// Keep a text caret position after the non-editable token, including at the end of a field.
const chip = (name: CopyVariable) => `<span contenteditable="false" data-copy-variable="${name}" class="rounded bg-cyan-100 px-1 text-cyan-900">${COPY_VARIABLES[name]}</span>&#8203;`;
const escapeText = (text: string) => text.replace(/[&<>%]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '%': '&#37;' })[char]!);

export function visualCopyHtml(value: string): string | null {
  if (/%%/.test(withoutCopyTokens(value))) return null;
  // Only accept formatting the visual editor can represent without losing styles or blocks.
  const tagsRemoved = value.replace(/<\/?(?:b|strong|p)>|<br\s*\/?>/gi, '');
  if (/[<>]/.test(tagsRemoved)) return null;
  return value.replace(/\r\n?|\n/g, '<br>').replace(COPY_TOKEN_PATTERN, (token, rawName: string) => {
    const name = copyVariable(rawName);
    return name ? chip(name) : token;
  });
}

function serializeChildren(element: Node): string {
  const nodes = Array.from(element.childNodes);
  let html = '';
  nodes.forEach((node, index) => {
    if (node.nodeType === Node.TEXT_NODE) {
      html += escapeText((node.textContent ?? '').replace(/\u200b/g, '').replace(/\u00a0/g, ' '));
      return;
    }
    if (!(node instanceof HTMLElement)) return;
    const variable = copyVariable(node.getAttribute('data-copy-variable') ?? '');
    if (variable) {
      html += copyToken(variable);
      return;
    }
    if (node.tagName === 'BR') {
      if (index !== nodes.length - 1) html += '<br>';
      return;
    }
    const content = serializeChildren(node);
    if (node.matches('b,strong')) {
      html += content ? '<b>' + content + '</b>' : '';
      return;
    }
    if (node.matches('p,div') && index > 0) html += '<br><br>';
    html += content;
  });
  return html;
}

const button = 'inline-flex min-h-8 items-center gap-1 rounded px-2 text-slate-700 hover:bg-cyan-100 focus-visible:outline focus-visible:outline-cyan-600';

export function VisualCopyInput({ id, label, html, onChange, variables, compact, toolbarHost, onActivate }: {
  id?: string; label: string; html: string; onChange: (html: string) => void; variables: readonly CopyVariable[];
  compact?: boolean; toolbarHost?: HTMLElement | null; onActivate?: () => void;
}) {
  const editor = useRef<HTMLDivElement>(null);
  const lastValue = useRef<string>();
  const selection = useRef<Range>();
  const [bold, setBold] = useState(false);
  useLayoutEffect(() => {
    if (!editor.current || lastValue.current === html) return;
    const markup = visualCopyHtml(html) ?? '';
    editor.current.innerHTML = /<br\s*\/?>$/i.test(markup) ? markup + '<br>' : markup;
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

  const toolbar = <div role="group" aria-label={`Formatação de ${label.toLowerCase()}`} className="flex flex-wrap gap-1 bg-slate-50 p-1 text-xs">
      <button type="button" className={`${button} ${bold ? 'bg-cyan-100' : ''}`} aria-pressed={bold} onMouseDown={(event) => event.preventDefault()} onClick={() => run('bold')}><Bold size={14}/>Negrito</button>
      <button type="button" className={button} aria-label="Desfazer" title="Desfazer" onMouseDown={(event) => event.preventDefault()} onClick={() => run('undo')}><Undo2 size={15}/></button>
      <button type="button" className={button} aria-label="Refazer" title="Refazer" onMouseDown={(event) => event.preventDefault()} onClick={() => run('redo')}><Redo2 size={15}/></button>
      {variables.length > 0 && <select aria-label="Inserir variável" value="" className={button}
        onChange={(event) => {
          const name = copyVariable(event.target.value);
          if (name && variables.includes(name)) run('insertHTML', chip(name));
        }}>
        <option value="" disabled>Inserir variável</option>
        {variables.map((name) => <option key={name} value={name}>{COPY_VARIABLES[name]}</option>)}
      </select>}
    </div>;
  return <div className={compact ? 'min-w-0 flex-1 rounded focus-within:bg-cyan-50' : 'overflow-hidden rounded-lg border border-slate-300 focus-within:border-cyan-500'}>
    {compact ? toolbarHost && createPortal(toolbar, toolbarHost) : <div className="border-b border-slate-200">{toolbar}</div>}
    <div id={id} ref={editor} contentEditable suppressContentEditableWarning role="textbox" aria-label={label} aria-multiline="true"
      className={`${compact ? 'min-h-8 px-1 py-1' : 'min-h-20 px-3 py-2'} break-words whitespace-pre-wrap text-sm font-normal leading-5 text-slate-800 outline-none [&_p+p]:mt-3`}
      onInput={publish} onFocus={onActivate} onSelect={rememberSelection} onKeyUp={rememberSelection} onMouseUp={rememberSelection}
      onPaste={(event) => {
        event.preventDefault();
        rememberSelection();
        const text = event.clipboardData.getData('text/plain');
        run('insertHTML', escapeText(text).replace(/\r\n?|\n/g, '<br>'));
      }}
      onDrop={(event) => event.preventDefault()}/>
  </div>;
}
