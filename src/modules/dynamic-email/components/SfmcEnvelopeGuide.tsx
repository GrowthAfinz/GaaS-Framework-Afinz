import React, { useState } from 'react';
import { Copy } from 'lucide-react';
import { plurixEnvelope } from '../domain/sfmcEnvelope';

export function SfmcEnvelopeGuide({ source }: { source: string }) {
  const [message, setMessage] = useState('');
  const envelope = plurixEnvelope(source);
  if (!envelope) return null;
  const copy = async (value: string, label: string) => {
    try { await navigator.clipboard.writeText(value); setMessage(`${label} copiado.`); }
    catch { setMessage('Não foi possível copiar automaticamente. Selecione e copie o código abaixo.'); }
  };
  return <section aria-label="Configuração do assunto e pré-cabeçalho no SFMC" className="border-b border-slate-200 bg-cyan-50/50 p-4">
    <h3 className="text-sm font-bold text-slate-900">Como configurar a {envelope.version} no Content Builder</h3>
    <p className="mt-1 text-xs leading-5 text-slate-600">Cole o HTML abaixo no corpo do e-mail. Preencha também os dois campos separados no SFMC:</p>
    <div className="mt-3 grid gap-3 lg:grid-cols-2">
      <div className="rounded-lg border border-slate-200 bg-white p-3">
        <div className="flex items-center justify-between gap-2"><h4 className="text-xs font-bold text-slate-800">Assunto</h4><button type="button" onClick={() => copy(envelope.subject, 'Assunto')} className="inline-flex items-center gap-1 rounded border border-slate-200 px-2 py-1 text-xs font-semibold text-cyan-800"><Copy size={12}/>Copiar assunto</button></div>
        <p className="my-2 text-xs text-slate-600">Busca o campo ASSUNTO do briefing selecionado e resolve sua personalização.</p>
        <textarea aria-label="Código do assunto SFMC" readOnly value={envelope.subject} rows={2} className="w-full resize-y rounded border border-slate-200 bg-slate-50 p-2 font-mono text-xs"/>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-3">
        <div className="flex items-center justify-between gap-2"><h4 className="text-xs font-bold text-slate-800">Pré-cabeçalho</h4><button type="button" disabled={!envelope.preheader} onClick={() => copy(envelope.preheader, 'Pré-cabeçalho')} className="inline-flex items-center gap-1 rounded border border-slate-200 px-2 py-1 text-xs font-semibold text-cyan-800 disabled:opacity-40"><Copy size={12}/>Copiar pré-cabeçalho completo</button></div>
        <p className="my-2 text-xs leading-5 text-slate-600">Inclui o preparo da {envelope.version} e o campo PRE_CABECALHO. O SFMC processa este campo antes do HTML; por isso, copiar somente a expressão final não basta.</p>
        <details><summary className="cursor-pointer text-xs font-semibold text-cyan-800">Ver código completo do pré-cabeçalho</summary><textarea aria-label="Código completo do pré-cabeçalho SFMC" readOnly value={envelope.preheader} rows={8} className="mt-2 w-full resize-y rounded border border-slate-200 bg-slate-50 p-2 font-mono text-xs"/></details>
        {envelope.error && <p role="alert" className="mt-2 text-xs text-red-700">{envelope.error}</p>}
      </div>
    </div>
    <p role="status" className="mt-2 text-xs font-semibold text-cyan-800">{message}</p>
    <p className="mt-1 text-xs text-slate-600">Os códigos acompanham o HTML atual do editor. Após alterar a fonte, copie novamente os campos e valide no Test Send.</p>
  </section>;
}
