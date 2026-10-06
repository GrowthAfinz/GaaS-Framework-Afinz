import React, { useRef } from 'react';
import { AlertTriangle, Info } from 'lucide-react';
import type { ValidationIssue } from '../domain/briefing';
import { LIMIT_MESSAGE_MAX, LIMIT_NAME_FALLBACK, limitInputState, normalizeLimitInput, renderLimitMessage } from '../domain/limitMessage';

// Escapa tudo e só devolve as marcações permitidas na faixa (sem atributos).
const safeBandHtml = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/&lt;(\/?)(b|strong|i|em|br)\s*\/?&gt;/gi, '<$1$2>');

const properCase = (value: string) => value.trim().toLocaleLowerCase('pt-BR')
  .replace(/(^|\s)(\S)/g, (_, space: string, letter: string) => space + letter.toLocaleUpperCase('pt-BR'));

/** Bloco "Faixa de limite pré-aprovado": texto por e-mail, com marcadores e prévia ao vivo. */
export function LimitMessageEditor({ value, issues, networkCount, sampleName, sampleLimit, onChange }: {
  value: string;
  issues: ValidationIssue[];
  networkCount: number;
  sampleName: string;
  sampleLimit: string;
  onChange: (value: string) => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const insert = (marker: string) => {
    const element = ref.current;
    const start = element?.selectionStart ?? value.length;
    const end = element?.selectionEnd ?? value.length;
    onChange(`${value.slice(0, start)}${marker}${value.slice(end)}`);
    requestAnimationFrame(() => { element?.focus(); element?.setSelectionRange(start + marker.length, start + marker.length); });
  };
  const previewLimit = limitInputState(sampleLimit) === 'positive' ? sampleLimit : '3500';
  const withName = renderLimitMessage(value, properCase(sampleName) || 'Vania', previewLimit);
  const withoutName = renderLimitMessage(value, '', previewLimit);
  const errors = issues.filter((issue) => issue.severity === 'error');
  const warnings = issues.filter((issue) => issue.severity === 'warning');

  return <div className="space-y-3">
    <label className="block text-xs font-semibold text-slate-600" htmlFor="limit-message">Mensagem da faixa
      <textarea id="limit-message" ref={ref} value={value} onChange={(event) => onChange(event.target.value)} rows={3} maxLength={LIMIT_MESSAGE_MAX + 50}
        placeholder="Ex.: Parabéns, {{nome}}! Você tem R$ {{limite}} de limite pré-aprovado no cartão +amigo."
        className="mt-1 w-full resize-y rounded-lg border border-slate-200 p-2.5 text-sm font-normal text-slate-800 outline-none focus:border-cyan-400 focus-visible:ring-2 focus-visible:ring-cyan-100"/>
    </label>
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <span className="font-semibold text-slate-500">Inserir:</span>
      <button type="button" onClick={() => insert('{{nome}}')} className="rounded-md border border-cyan-200 bg-cyan-50 px-2 py-1 font-mono font-semibold text-cyan-900 hover:bg-cyan-100">{'{{nome}}'}</button>
      <button type="button" onClick={() => insert('{{limite}}')} className="rounded-md border border-cyan-200 bg-cyan-50 px-2 py-1 font-mono font-semibold text-cyan-900 hover:bg-cyan-100">{'{{limite}}'}</button>
      <span className={`ml-auto ${value.length > LIMIT_MESSAGE_MAX ? 'font-bold text-red-700' : 'text-slate-500'}`}>{value.length}/{LIMIT_MESSAGE_MAX}</span>
    </div>
    <p className="flex items-start gap-1.5 rounded-lg bg-slate-50 px-3 py-2 text-[11px] leading-4 text-slate-600"><Info size={12} className="mt-px shrink-0"/>
      <span>Vale para as {networkCount || 6} versões de rede deste e-mail; os outros e-mails têm a própria mensagem. {'{{limite}}'} sai como moeda (R$ 3.500,00). Sem nome na base, {'{{nome}}'} vira “{LIMIT_NAME_FALLBACK}”. Sem limite positivo ou com a mensagem vazia, a faixa não aparece. O texto não executa AMPscript.</span></p>
    {(errors.length > 0 || warnings.length > 0) && <ul className="space-y-1">
      {[...errors, ...warnings].map((issue) => <li key={`${issue.code}-${issue.message}`} className={`flex items-start gap-1.5 rounded-lg px-3 py-2 text-[11px] leading-4 ${issue.severity === 'error' ? 'bg-red-50 text-red-800' : 'bg-amber-50 text-amber-900'}`}><AlertTriangle size={12} className="mt-px shrink-0"/>{issue.message}</li>)}
    </ul>}
    <div className="grid gap-2 md:grid-cols-2">
      {[['Com nome', withName], ['Sem nome na base', withoutName]].map(([label, text]) => <div key={label} className="rounded-lg border border-slate-200 p-2">
        <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
        {text
          ? <div className="rounded-md px-3 py-2 text-center text-xs font-bold leading-5 text-[#2C3490]" style={{ backgroundColor: '#FFF4D6' }} dangerouslySetInnerHTML={{ __html: safeBandHtml(text) }}/>
          : <p className="text-xs italic text-slate-500">Sem faixa: {value.trim() ? 'confira os marcadores.' : 'mensagem vazia.'}</p>}
      </div>)}
    </div>
  </div>;
}

/** Limite de teste no formato do contrato (número com ponto decimal). Aceita "3.500" e converte. */
export function LimitTestInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const state = limitInputState(value);
  const hint = state === 'positive' ? `Faixa com R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    : state === 'zero' ? 'Zero: sem faixa' : state === 'absent' ? 'Sem limite: sem faixa' : 'Use só números, ex.: 3500 ou 1500.50';
  return <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Limite de teste (LIMITE_CRD)
    <input inputMode="decimal" value={value} onChange={(event) => onChange(event.target.value)} onBlur={(event) => onChange(normalizeLimitInput(event.target.value))} placeholder="3500"
      aria-invalid={state === 'invalid'}
      className={`mt-1 h-9 w-full rounded-lg border px-2.5 text-xs font-normal normal-case tracking-normal text-slate-700 outline-none focus:border-cyan-400 focus-visible:ring-2 focus-visible:ring-cyan-100 ${state === 'invalid' ? 'border-red-300' : 'border-slate-200'}`}/>
    <span className={`mt-1 block text-[10px] font-semibold normal-case tracking-normal ${state === 'invalid' ? 'text-red-700' : 'text-slate-500'}`}>{hint}</span>
  </label>;
}
