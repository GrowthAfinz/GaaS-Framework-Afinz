import { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, ChevronDown, ChevronRight, Download, RotateCcw, ShieldAlert, TriangleAlert } from 'lucide-react';
import {
  allSelectableKeys, buildExportTree, isPartialSelection, nodeState, pruneSelection,
  sanitizeExportFilename, selectionTotals, suggestExportFilename, toggleNode,
  type ExportGroupInput, type ExportNode, type TriState,
} from '../domain/exportScope';

type Props = {
  groups: ExportGroupInput[];
  today: string;
  segmentLabel?: (segment: string) => string;
  onClose: () => void;
  onConfirm: (weekKeys: Set<string>, filename: string) => void;
};

/** Checkbox com o estado indeterminado real do DOM (não dá para expressar em JSX). */
const TriCheckbox = ({ state, disabled, onChange, label }: {
  state: TriState; disabled?: boolean; onChange: (checked: boolean) => void; label: string;
}) => {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { if (ref.current) ref.current.indeterminate = state === 'indeterminate'; }, [state]);
  return <input
    ref={ref}
    type="checkbox"
    aria-label={label}
    disabled={disabled}
    checked={state === 'checked'}
    onChange={(event) => onChange(event.target.checked)}
    className="mt-0.5 h-4 w-4 shrink-0 accent-cyan-600 disabled:opacity-40"
  />;
};

const Counts = ({ emails, rows }: { emails: number; rows: number }) => <span className="text-xs text-slate-500">
  {emails} {emails === 1 ? 'e-mail' : 'e-mails'} · {rows} {rows === 1 ? 'linha' : 'linhas'}
</span>;

export const ExportCsvDialog = ({ groups, today, segmentLabel = (value) => value, onClose, onConfirm }: Props) => {
  const tree = useMemo(() => buildExportTree(groups), [groups]);

  const [selection, setSelection] = useState<Set<string>>(() => allSelectableKeys(tree));
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  // A árvore pode mudar embaixo do diálogo (correção de erro, arquivamento).
  useEffect(() => { setSelection((current) => pruneSelection(tree, current)); }, [tree]);

  const suggested = useMemo(() => suggestExportFilename(tree, selection, today), [tree, selection, today]);
  // Inicializa já com a sugestão: esperar o efeito faria o campo piscar vazio.
  const [filename, setFilename] = useState(suggested);
  const [renamed, setRenamed] = useState(false);
  useEffect(() => { if (!renamed) setFilename(suggested); }, [suggested, renamed]);

  const totals = selectionTotals(tree, selection);
  const partial = isPartialSelection(tree, selection);
  const finalName = sanitizeExportFilename(filename);
  const blockedWeeks = tree.flatMap((partner) => partner.rulers.flatMap((ruler) => ruler.weeks)).filter((week) => week.blocked);

  const toggle = (node: ExportNode, checked: boolean) => setSelection((current) => toggleNode(node, current, checked));
  const toggleCollapse = (key: string) => setCollapsed((current) => {
    const next = new Set(current);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 p-4"
      role="dialog" aria-modal="true" aria-labelledby="export-csv-title"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <div className="flex max-h-[92vh] w-full max-w-xl flex-col rounded-2xl bg-white p-5 shadow-2xl">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-cyan-50 text-cyan-700"><Download size={18}/></span>
          <div className="min-w-0">
            <h2 id="export-csv-title" className="font-bold text-slate-900">Exportar CSV para o SFMC</h2>
            <p className="mt-1 text-sm leading-5 text-slate-600">
              Escolha parceiro, régua e semana que entram no arquivo <code className="rounded bg-slate-100 px-1 text-[11px]">TB_BRIEFING_CAMPANHA_AQUISICAO</code>.
              Semana com pendência bloqueante não pode ser exportada.
            </p>
          </div>
        </div>

        <div className="mt-4 min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-1">
          {tree.map((partner) => {
            const open = !collapsed.has(partner.key);
            return (
              <div key={partner.key} className="rounded-xl border border-slate-200">
                <div className="flex items-start gap-2 px-3 py-2.5">
                  <TriCheckbox state={nodeState(partner, selection)} label={`Selecionar ${partner.label}`} onChange={(checked) => toggle(partner, checked)}/>
                  <button
                    type="button" onClick={() => toggleCollapse(partner.key)}
                    aria-expanded={open}
                    className="flex min-w-0 flex-1 items-center gap-1.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                  >
                    {open ? <ChevronDown size={14} className="shrink-0 text-slate-400"/> : <ChevronRight size={14} className="shrink-0 text-slate-400"/>}
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold text-slate-900">{partner.label}</span>
                      <Counts emails={partner.emails} rows={partner.rows}/>
                    </span>
                  </button>
                </div>

                {open && <div className="border-t border-slate-100 px-3 py-2">
                  {partner.rulers.map((ruler) => (
                    <div key={ruler.key} className="mb-1.5 last:mb-0">
                      <label className="flex items-start gap-2 rounded-lg px-1 py-1 hover:bg-slate-50">
                        <TriCheckbox state={nodeState(ruler, selection)} label={`Selecionar régua ${ruler.label}`} onChange={(checked) => toggle(ruler, checked)}/>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-xs font-bold text-slate-700">{segmentLabel(ruler.label)}</span>
                        </span>
                      </label>
                      <div className="ml-5 mt-0.5 space-y-0.5">
                        {ruler.weeks.map((week) => (
                          <label
                            key={week.key}
                            className={`flex items-start gap-2 rounded-lg px-2 py-1.5 text-sm ${week.blocked ? 'cursor-not-allowed bg-red-50/50 opacity-80' : 'cursor-pointer hover:bg-cyan-50/60'}`}
                          >
                            <TriCheckbox
                              state={nodeState(week, selection)} disabled={week.blocked}
                              label={`Selecionar ${week.label} de ${partner.label}`}
                              onChange={(checked) => toggle(week, checked)}
                            />
                            <span className="min-w-0 flex-1">
                              <span className="block text-xs font-semibold text-slate-800">{week.label}</span>
                              <span className="text-[11px] text-slate-500">
                                {week.emails} {week.emails === 1 ? 'e-mail' : 'e-mails'} · {week.rows} {week.rows === 1 ? 'linha' : 'linhas'}
                                {week.blocked ? ` · ${week.blockedEmails} com pendência bloqueante` : ''}
                              </span>
                            </span>
                            {week.blocked
                              ? <ShieldAlert size={14} className="mt-0.5 shrink-0 text-red-500"/>
                              : <CheckCircle2 size={14} className={`mt-0.5 shrink-0 ${nodeState(week, selection) === 'checked' ? 'text-cyan-600' : 'text-slate-300'}`}/>}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>}
              </div>
            );
          })}
          {!tree.length && <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-6 text-center text-sm text-slate-500">Nenhuma régua ativa para exportar.</p>}
        </div>

        <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
          <button
            type="button" onClick={() => setSelection(allSelectableKeys(tree))}
            className="text-xs font-bold text-cyan-700 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-cyan-500"
          >Selecionar tudo que está pronto</button>
          <span className="text-xs text-slate-500">{totals.emails} e-mails · <b className="text-slate-700">{totals.rows} linhas</b> no CSV</span>
        </div>

        <div className="mt-3">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="export-filename" className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Nome do arquivo</label>
            {renamed && <button
              type="button" onClick={() => { setRenamed(false); setFilename(suggested); }}
              className="inline-flex items-center gap-1 text-[10px] font-bold text-cyan-700 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-cyan-500"
            ><RotateCcw size={11}/>Restaurar sugestão</button>}
          </div>
          <input
            id="export-filename" type="text" value={filename}
            onChange={(event) => { setRenamed(true); setFilename(event.target.value); }}
            spellCheck={false}
            className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-2 font-mono text-xs text-slate-800 outline-none focus-visible:border-cyan-400 focus-visible:ring-2 focus-visible:ring-cyan-500"
          />
          {finalName !== filename && <p className="mt-1 text-[10px] text-slate-500">Será salvo como <code className="rounded bg-slate-100 px-1">{finalName}</code></p>}
        </div>

        {partial && <p className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-4 text-amber-900">
          <TriangleAlert size={14} className="mt-0.5 shrink-0"/>
          <span><b>Seleção parcial.</b> Importe com <b>Adicionar e Atualizar</b>. Em modo Overwrite, este arquivo apagaria da Data Extension as semanas que ficaram de fora.</span>
        </p>}

        {blockedWeeks.length > 0 && <p className="mt-2 text-[11px] text-red-700">
          {blockedWeeks.length} {blockedWeeks.length === 1 ? 'semana está travada' : 'semanas estão travadas'} por pendência bloqueante e {blockedWeeks.length === 1 ? 'não entra' : 'não entram'} no arquivo.
        </p>}

        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 outline-none hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-cyan-500">Cancelar</button>
          <button
            type="button" disabled={!totals.weeks}
            onClick={() => onConfirm(new Set(selection), finalName)}
            className="inline-flex items-center gap-2 rounded-lg bg-[#07595b] px-4 py-2 text-sm font-bold text-white outline-none transition hover:bg-[#064446] focus-visible:ring-2 focus-visible:ring-cyan-500 disabled:cursor-not-allowed disabled:opacity-50"
          ><Download size={15}/>Baixar CSV</button>
        </div>
      </div>
    </div>
  );
};
