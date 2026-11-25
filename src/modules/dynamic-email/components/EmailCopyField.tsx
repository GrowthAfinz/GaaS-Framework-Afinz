import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, List, Plus, Trash2 } from 'lucide-react';
import { parseContentBlocks, renderContentBlocks, type ContentBlock } from '../domain/contentBlocks';
import type { CopyVariable } from '../domain/copyVariables';
import { opaqueEmailBackgrounds } from '../domain/opaqueEmailBackgrounds';
import { VisualCopyInput, visualCopyHtml } from './VisualCopyInput';

const labels: Record<ContentBlock['type'], string> = {
  lead: 'Texto', closing: 'Fechamento', steps: 'Passos numerados',
  check_list: 'Lista com marcadores', benefits_panel: 'Quadro de benefícios',
  benefit_grid: 'Grade de benefícios', stat_tiles: 'Destaques numéricos',
};

const control = 'rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs font-semibold text-slate-700 hover:border-cyan-500 focus-visible:outline focus-visible:outline-cyan-600 disabled:opacity-40';
const input = 'w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm font-normal focus-visible:outline focus-visible:outline-cyan-600';

function asTextBlock(value: string) {
  try {
    return renderContentBlocks([{ type: 'lead', text: value.replace(/\r\n?|\n/g, '<br>') }]);
  } catch {
    return null;
  }
}

function move<T>(items: T[], index: number, offset: number) {
  const next = [...items];
  [next[index], next[index + offset]] = [next[index + offset], next[index]];
  return next;
}

function RowActions({ label, index, count, onMove, onDelete }: {
  label: string; index: number; count: number; onMove: (offset: number) => void; onDelete: () => void;
}) {
  return <div className="flex shrink-0 gap-1">
    <button type="button" className={control} aria-label={`Subir ${label}`} disabled={index === 0} onClick={() => onMove(-1)}><ArrowUp size={14}/></button>
    <button type="button" className={control} aria-label={`Descer ${label}`} disabled={index === count - 1} onClick={() => onMove(1)}><ArrowDown size={14}/></button>
    <button type="button" className={control} aria-label={`Remover ${label}`} onClick={onDelete}><Trash2 size={14}/></button>
  </div>;
}

type EditorBlock = { id: number; block: ContentBlock };
type CopyProps = { id: string; label: string; field: string; value: string; onChange: (value: string) => void; variables: readonly CopyVariable[]; structured: boolean; scopeLabel?: string };

export function EmailCopyField({ id, label, field, value, onChange, variables, structured, scopeLabel }: CopyProps) {
  const [mode, setMode] = useState<'visual' | 'html'>('visual');
  const [organizing, setOrganizing] = useState(false);
  const originalBlocks = structured ? parseContentBlocks(value) : null;
  // V16/V17 briefings can contain white backgrounds generated for dark mode.
  // Round-trip the transformation before accepting it as a known block.
  const undecorated = structured && !originalBlocks ? value.replace(/<[a-z][^>]*>/gi, (tag) =>
    tag.replace(/ style="background-color:#ffffff;"/g, '')
      .replace(/background-color:#ffffff;(?=")/g, '').replace(/ bgcolor="#ffffff"/g, '')) : value;
  const decorated = undecorated !== value && opaqueEmailBackgrounds(undecorated) === value;
  const blocks = originalBlocks ?? (decorated ? parseContentBlocks(undecorated) : null);
  const canEditVisually = visualCopyHtml(value) !== null;
  const showHtml = mode === 'html' || (!canEditVisually && !blocks);
  const organized = structured && !blocks && canEditVisually ? asTextBlock(value) : null;
  const editableBlocks = blocks ?? (organizing && organized !== null ? parseContentBlocks(organized) : null);
  return <div className="space-y-1.5 md:col-span-2">
    <div className="flex items-center justify-between gap-2">
      <label htmlFor={id} className="text-xs font-semibold text-slate-700">{label}</label>
      <button type="button" className={control} disabled={showHtml && !canEditVisually && !blocks}
        onClick={() => setMode(showHtml ? 'visual' : 'html')}>{showHtml ? 'Edição visual' : 'HTML avançado'}</button>
    </div>
    {scopeLabel && <p className="text-xs text-slate-600">{scopeLabel}</p>}
    {showHtml ? <>
      <textarea id={id} value={value} onChange={(event) => { setMode('html'); onChange(event.target.value); }} rows={5} className={input}/>
      <p className="text-xs text-slate-600">Campo CSV {field}. {(!canEditVisually && !blocks) && 'Este conteúdo tem formatação personalizada e abre no modo HTML.'}</p>
    </> : editableBlocks ? <StructuredCopyEditor blocks={editableBlocks} label={label} value={value} decorated={decorated}
      onApply={(html) => { setOrganizing(true); onChange(html); }}
      variables={variables}/> : <>
      <VisualCopyInput id={id} label={label} html={value} onChange={onChange} variables={variables}/>
      {organized !== null && <button type="button" className={control} onClick={() => setOrganizing(true)}>Organizar em blocos</button>}
    </>}
  </div>;
}

function StructuredCopyEditor({ blocks, label, value, decorated, onApply, variables }: {
  blocks: ContentBlock[]; label: string; value: string; decorated: boolean; onApply: (value: string) => void; variables: readonly CopyVariable[];
}) {
  const initial = useRef(blocks.map((block, id) => ({ block, id })));
  const [draft, setDraft] = useState<EditorBlock[]>(initial.current);
  const [nextId, setNextId] = useState(blocks.length);
  const update = (id: number, block: ContentBlock) => setDraft((current) => current.map((entry) => entry.id === id ? { ...entry, block } : entry));
  const insert = (index: number, block: ContentBlock) => {
    setDraft((current) => [...current.slice(0, index), { id: nextId, block }, ...current.slice(index)]);
    setNextId(nextId + 1);
  };
  const convert = (index: number, entry: EditorBlock, lines: string[]) => {
    update(entry.id, { type: 'lead', text: lines[0] });
    insert(index + 1, { type: 'benefits_panel', items: lines.slice(1) });
  };
  let output: string | undefined;
  let error = '';
  let emptyItems = false;
  try {
    const rendered = draft.flatMap<ContentBlock>(({ block }) => {
      if (block.type === 'check_list' || block.type === 'benefits_panel') {
        const items = block.items.filter((item) => item.replace(/<br\s*\/?\s*>/gi, '').trim());
        emptyItems ||= items.length !== block.items.length;
        return items.length ? [{ ...block, items }] : [];
      }
      if (block.type === 'steps') {
        const items = block.items.filter((item) => item.title.trim());
        emptyItems ||= items.length !== block.items.length;
        return items.length ? [{ ...block, items }] : [];
      }
      return [block];
    });
    const html = renderContentBlocks(rendered);
    const finalHtml = decorated ? opaqueEmailBackgrounds(html) : html;
    if (Array.from(finalHtml).length > 4000) throw new Error('O texto complementar ultrapassou o limite do SFMC de 4.000 caracteres após a formatação.');
    output = finalHtml;
  } catch (reason) {
    error = reason instanceof Error ? reason.message : 'Revise o conteúdo.';
  }
  useEffect(() => {
    if (draft !== initial.current && output !== undefined && output !== value) onApply(output);
  }, [draft, onApply, output, value]);

  return <div className="space-y-2" role="group" aria-label={label}>
    <div className="space-y-2">
      {draft.map((entry, index) => {
        const { id, block } = entry;
        const name = labels[block.type];
        const lines = block.type === 'lead' ? block.text.split(/<br>/i).map((line) => line.trim()).filter(Boolean) : [];
        return <div key={id} className="space-y-2 rounded-lg border border-slate-200 bg-white p-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-700">{name}</span>
            <RowActions label={`bloco ${index + 1}: ${name}`} index={index} count={draft.length}
              onMove={(offset) => setDraft((current) => move(current, index, offset))}
              onDelete={() => setDraft((current) => current.filter((item) => item.id !== id))}/>
          </div>
          {'text' in block && <>
            <VisualCopyInput label={name} html={block.text} variables={variables} onChange={(text) => update(id, { ...block, text })}/>
            {lines.length >= 3 && <button type="button" className={control} onClick={() => convert(index, entry, lines)}><List size={14} className="mr-1 inline"/>Transformar linhas em benefícios</button>}
          </>}
          {(block.type === 'check_list' || block.type === 'benefits_panel') &&
            <BenefitList block={block} variables={variables} onChange={(next) => update(id, next)}/>}
          {block.type === 'steps' && <>
            {block.items.map((item, itemIndex) => <div key={itemIndex} className="space-y-1">
              <div className="flex items-center gap-1">
                <input className={input} aria-label={`Passo ${itemIndex + 1}`} value={item.title}
                  onChange={(event) => update(id, { ...block, items: block.items.map((old, position) => position === itemIndex ? { ...old, title: event.target.value } : old) })}/>
                <RowActions label={`passo ${itemIndex + 1}`} index={itemIndex} count={block.items.length}
                  onMove={(offset) => update(id, { ...block, items: move(block.items, itemIndex, offset) })}
                  onDelete={() => update(id, { ...block, items: block.items.filter((_, position) => position !== itemIndex) })}/>
              </div>
              <input className={input} aria-label={`Descrição do passo ${itemIndex + 1}`} placeholder="Descrição opcional" value={item.text}
                onChange={(event) => update(id, { ...block, items: block.items.map((old, position) => position === itemIndex ? { ...old, text: event.target.value } : old) })}/>
            </div>)}
            <button type="button" className={control} onClick={() => update(id, { ...block, items: [...block.items, { title: '', text: '' }] })}>Adicionar passo</button>
          </>}
          {(block.type === 'benefit_grid' || block.type === 'stat_tiles') &&
            <ul className="space-y-1 pl-4 text-xs text-slate-600">{block.items.map((item, itemIndex) => <li key={itemIndex}>{'title' in item ? item.title : `${item.number} ${item.label}`}</li>)}</ul>}
        </div>;
      })}
    </div>
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" className={control} onClick={() => insert(draft.length, { type: 'lead', text: '' })}><Plus size={13} className="mr-1 inline"/>Texto</button>
      <button type="button" className={control} onClick={() => insert(draft.length, { type: 'steps', items: [{ title: '', text: '' }] })}><Plus size={13} className="mr-1 inline"/>Passos</button>
      <button type="button" className={control} onClick={() => insert(draft.length, { type: 'benefits_panel', items: [''] })}><Plus size={13} className="mr-1 inline"/>Benefícios</button>
    </div>
    {error ? <p role="alert" className="text-xs text-amber-900">{error} A prévia e o briefing mantêm o último conteúdo válido.</p> :
      emptyItems && <p className="text-xs text-slate-600">Itens vazios entram na prévia após o preenchimento.</p>}
  </div>;
}

type BenefitBlock = Extract<ContentBlock, { type: 'check_list' | 'benefits_panel' }>;
function BenefitList({ block, variables, onChange }: { block: BenefitBlock; variables: readonly CopyVariable[]; onChange: (block: BenefitBlock) => void }) {
  const [toolbarHost, setToolbarHost] = useState<HTMLDivElement | null>(null);
  const [active, setActive] = useState(0);
  const activeIndex = Math.min(active, block.items.length - 1);
  return <>
    <div className="overflow-hidden rounded-lg border border-slate-300">
      <div ref={setToolbarHost} className="border-b border-slate-200 bg-slate-50"/>
      <ul className="space-y-0.5 px-2 py-1">
        {block.items.map((item, index) => <li key={index} className="flex items-start gap-1">
          <span aria-hidden="true" className="px-1 py-1 text-cyan-800">•</span>
          <VisualCopyInput label={`Benefício ${index + 1}`} html={item} variables={variables} compact
            toolbarHost={index === activeIndex ? toolbarHost : null} onActivate={() => setActive(index)}
            onChange={(text) => onChange({ ...block, items: block.items.map((old, position) => position === index ? text : old) })}/>
          <RowActions label={`benefício ${index + 1}`} index={index} count={block.items.length}
            onMove={(offset) => { setActive(index + offset); onChange({ ...block, items: move(block.items, index, offset) }); }}
            onDelete={() => onChange({ ...block, items: block.items.filter((_, position) => position !== index) })}/>
        </li>)}
      </ul>
    </div>
    <div className="flex flex-wrap items-center justify-between gap-2">
      <button type="button" className={control} onClick={() => onChange({ ...block, items: [...block.items, ''] })}>Adicionar benefício</button>
      <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">Aparência
        <select className={control} value={block.type === 'check_list' ? 'check_list' : block.appearance ?? 'panel'} onChange={(event) => {
          const appearance = event.target.value;
          const { items } = block;
          onChange(appearance === 'check_list' ? { type: 'check_list', items } :
            appearance === 'plain' ? { type: 'benefits_panel', items, appearance } : { type: 'benefits_panel', items });
        }}>
          <option value="check_list">Lista com selo</option>
          <option value="plain">Lista com marcadores</option>
          <option value="panel">Quadro de benefícios</option>
        </select>
      </label>
    </div>
  </>;
}
