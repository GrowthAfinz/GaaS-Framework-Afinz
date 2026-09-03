import React, { useState } from 'react';
import { Copy, X } from 'lucide-react';

export type DuplicateRulerConfig = {
  segment: string;
  segmentAlias: string;
  segmentMode: 'existing' | 'draft';
  months: number;
  days: number;
};

export const DuplicateRulerDialog = ({ sourceLabel, sourceSegment, emailCount, variantCount, segmentOptions, onClose, onConfirm }: {
  sourceLabel: string;
  sourceSegment: string;
  emailCount: number;
  variantCount: number;
  segmentOptions: string[];
  onClose: () => void;
  onConfirm: (config: DuplicateRulerConfig) => Promise<void> | void;
}) => {
  const [segmentMode, setSegmentMode] = useState<'existing' | 'draft'>('draft');
  const [existingSegment, setExistingSegment] = useState(segmentOptions.find((option) => option !== sourceSegment) ?? segmentOptions[0] ?? '');
  const [draftSegment, setDraftSegment] = useState(`${sourceSegment} (cópia)`);
  const [alias, setAlias] = useState(`${sourceLabel} — cópia`);
  const [shift, setShift] = useState<'0' | '7' | '14' | 'month' | 'custom'>('month');
  const [customDays, setCustomDays] = useState(30);
  const [saving, setSaving] = useState(false);

  const segment = (segmentMode === 'existing' ? existingSegment : draftSegment).trim();
  const { months, days } = shift === 'month' ? { months: 1, days: 0 } : shift === 'custom' ? { months: 0, days: customDays } : { months: 0, days: Number(shift) };
  const valid = Boolean(segment && alias.trim());

  const submit = async () => {
    setSaving(true);
    try { await onConfirm({ segment, segmentAlias: alias.trim(), segmentMode, months, days }); }
    finally { setSaving(false); }
  };

  return <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/55 p-4" role="dialog" aria-modal="true" aria-labelledby="dup-ruler-title" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-cyan-50 text-cyan-700"><Copy size={18}/></span>
          <div><h2 id="dup-ruler-title" className="font-bold text-slate-900">Duplicar régua completa</h2><p className="mt-1 text-sm leading-5 text-slate-600">Clona <b>{emailCount}</b> {emailCount === 1 ? 'e-mail' : 'e-mails'} · <b>{variantCount}</b> {variantCount === 1 ? 'variação' : 'variações'} de <b>{sourceLabel}</b> como rascunho. Conteúdo e assets são copiados; a jornada no SFMC continua sendo tarefa à parte.</p></div>
        </div>
        <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-500 outline-none hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-cyan-500" aria-label="Fechar"><X size={18}/></button>
      </div>

      <div className="mt-4 space-y-4">
        <label className="block text-xs font-semibold text-slate-700">Nome da nova régua
          <input value={alias} onChange={(event) => setAlias(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-cyan-400 focus-visible:ring-2 focus-visible:ring-cyan-100"/>
        </label>

        <div>
          <span className="text-xs font-semibold text-slate-700">Segmento técnico</span>
          <div className="mt-1 grid gap-2 sm:grid-cols-2">
            <button type="button" onClick={() => setSegmentMode('draft')} className={`rounded-xl border p-3 text-left text-xs outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ${segmentMode === 'draft' ? 'border-cyan-500 bg-cyan-50 ring-1 ring-cyan-500' : 'border-slate-200 hover:border-cyan-300'}`}><b className="block text-slate-900">Propor novo (rascunho)</b><span className="text-slate-500">Não escreve em activities.</span></button>
            <button type="button" disabled={!segmentOptions.length} onClick={() => setSegmentMode('existing')} className={`rounded-xl border p-3 text-left text-xs outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 disabled:opacity-40 ${segmentMode === 'existing' ? 'border-cyan-500 bg-cyan-50 ring-1 ring-cyan-500' : 'border-slate-200 hover:border-cyan-300'}`}><b className="block text-slate-900">Usar existente</b><span className="text-slate-500">Da taxonomia observada.</span></button>
          </div>
          {segmentMode === 'existing'
            ? <select value={existingSegment} onChange={(event) => setExistingSegment(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-cyan-400 focus-visible:ring-2 focus-visible:ring-cyan-100">{segmentOptions.map((option) => <option key={option} value={option}>{option}</option>)}</select>
            : <input value={draftSegment} onChange={(event) => setDraftSegment(event.target.value)} placeholder="Nome técnico do segmento" className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-cyan-400 focus-visible:ring-2 focus-visible:ring-cyan-100"/>}
        </div>

        <label className="block text-xs font-semibold text-slate-700">Datas de vigência
          <select value={shift} onChange={(event) => setShift(event.target.value as typeof shift)} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-cyan-400 focus-visible:ring-2 focus-visible:ring-cyan-100">
            <option value="0">Manter as mesmas datas</option>
            <option value="7">Avançar 1 semana</option>
            <option value="14">Avançar 2 semanas</option>
            <option value="month">Avançar 1 mês</option>
            <option value="custom">Avançar X dias…</option>
          </select>
        </label>
        {shift === 'custom' && <label className="block text-xs font-semibold text-slate-700">Dias a avançar
          <input type="number" min={1} value={customDays} onChange={(event) => setCustomDays(Math.max(1, Number(event.target.value) || 1))} className="mt-1 w-32 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-cyan-400 focus-visible:ring-2 focus-visible:ring-cyan-100"/>
        </label>}
      </div>

      <div className="mt-5 flex justify-end gap-2">
        <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 outline-none hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-cyan-500">Cancelar</button>
        <button type="button" disabled={!valid || saving} onClick={() => void submit()} className="inline-flex items-center gap-2 rounded-lg bg-[#07595b] px-4 py-2 text-sm font-bold text-white outline-none hover:bg-[#064c4e] focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"><Copy size={15}/>{saving ? 'Duplicando…' : 'Duplicar régua'}</button>
      </div>
    </div>
  </div>;
};
