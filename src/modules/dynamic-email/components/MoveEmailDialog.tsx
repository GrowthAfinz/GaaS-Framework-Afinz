import React, { useMemo, useState } from 'react';
import { ArrowRightLeft, X } from 'lucide-react';

export type MoveEmailTarget = { partner: string; segment: string; weekKey: string };

export const MoveEmailDialog = ({ emailLabel, current, partnerOptions, segmentsFor, weeksFor, onClose, onConfirm }: {
  emailLabel: string;
  current: MoveEmailTarget;
  partnerOptions: string[];
  segmentsFor: (partner: string) => string[];
  weeksFor: (partner: string, segment: string) => string[];
  onClose: () => void;
  onConfirm: (target: MoveEmailTarget) => Promise<void> | void;
}) => {
  const [partner, setPartner] = useState(current.partner);
  const [segment, setSegment] = useState(current.segment);
  const [weekKey, setWeekKey] = useState(current.weekKey);
  const [saving, setSaving] = useState(false);

  const segmentList = useMemo(() => segmentsFor(partner), [partner, segmentsFor]);
  const weekList = useMemo(() => weeksFor(partner, segment), [partner, segment, weeksFor]);

  const changed = partner.trim() !== current.partner || segment.trim() !== current.segment || weekKey.trim() !== current.weekKey;
  const valid = Boolean(partner.trim() && segment.trim() && weekKey.trim()) && changed;
  const contextChanged = partner.trim() !== current.partner || segment.trim() !== current.segment;

  const submit = async () => {
    setSaving(true);
    try { await onConfirm({ partner: partner.trim(), segment: segment.trim(), weekKey: weekKey.trim() }); }
    finally { setSaving(false); }
  };

  const INPUT = 'mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-cyan-400 focus-visible:ring-2 focus-visible:ring-cyan-100';

  return <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/55 p-4" role="dialog" aria-modal="true" aria-labelledby="move-email-title" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-cyan-50 text-cyan-700"><ArrowRightLeft size={18}/></span>
          <div><h2 id="move-email-title" className="font-bold text-slate-900">Mover “{emailLabel}”</h2><p className="mt-1 text-sm leading-5 text-slate-600">Leva este e-mail e todas as variações para outro parceiro, segmento ou semana. O conteúdo é mantido; a jornada volta a “não conferida” para você revalidar no SFMC.</p></div>
        </div>
        <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-500 outline-none hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-cyan-500" aria-label="Fechar"><X size={18}/></button>
      </div>

      <div className="mt-4 space-y-3">
        <label className="block text-xs font-semibold text-slate-700">Parceiro
          <select value={partner} onChange={(event) => { setPartner(event.target.value); setSegment(''); setWeekKey(''); }} className={INPUT}>
            {[...new Set([current.partner, ...partnerOptions].filter(Boolean))].map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>
        <label className="block text-xs font-semibold text-slate-700">Segmento
          <input list="move-segment-options" value={segment} onChange={(event) => { setSegment(event.target.value); setWeekKey(''); }} placeholder="Selecione ou digite um segmento" className={INPUT}/>
          <datalist id="move-segment-options">{segmentList.map((option) => <option key={option} value={option}/>)}</datalist>
        </label>
        <label className="block text-xs font-semibold text-slate-700">Semana
          <input list="move-week-options" value={weekKey} onChange={(event) => setWeekKey(event.target.value)} placeholder="Selecione ou digite uma semana" className={INPUT}/>
          <datalist id="move-week-options">{weekList.map((option) => <option key={option} value={option}/>)}</datalist>
        </label>
        {contextChanged && <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-4 text-amber-900">Ao mudar de parceiro ou segmento, o Activity Name de auditoria é limpo — selecione o correto no destino.</p>}
      </div>

      <div className="mt-5 flex justify-end gap-2">
        <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 outline-none hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-cyan-500">Cancelar</button>
        <button type="button" disabled={!valid || saving} onClick={() => void submit()} className="inline-flex items-center gap-2 rounded-lg bg-[#07595b] px-4 py-2 text-sm font-bold text-white outline-none hover:bg-[#064c4e] focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"><ArrowRightLeft size={15}/>{saving ? 'Movendo…' : 'Mover e-mail'}</button>
      </div>
    </div>
  </div>;
};
