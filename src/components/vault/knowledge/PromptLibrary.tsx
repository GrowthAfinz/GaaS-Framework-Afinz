import { useState } from 'react';
import { Check, Copy, Download, Search, Sparkles } from 'lucide-react';
import { downloadBytes } from './knowledgePack';
import { buildTeamPrompt, TEAM_PROMPTS, teamPromptMarkdown } from './teamPrompts';

export function PromptLibrary() {
  const [selectedId, setSelectedId] = useState(TEAM_PROMPTS[0].id);
  const [query, setQuery] = useState('');
  const [objective, setObjective] = useState('');
  const [message, setMessage] = useState('');
  const selected = TEAM_PROMPTS.find(prompt => prompt.id === selectedId)!;
  const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const filtered = TEAM_PROMPTS.filter(prompt => normalize(`${prompt.title} ${prompt.category} ${prompt.description}`).includes(normalize(query)));
  const text = buildTeamPrompt(selected, objective);
  const download = (body: string, filename: string) => downloadBytes(new TextEncoder().encode(body), filename, 'text/markdown;charset=utf-8');
  return <section className="space-y-4" aria-label="Prompts do time">
    <header className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-violet-100 bg-violet-50/50 p-5">
      <div><h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900"><Sparkles size={18} className="text-violet-600"/>Prompts para usar em equipe</h3><p className="mt-1 text-sm text-slate-600">Escolha uma tarefa, anexe os arquivos indicados e leve o prompt à sua IA.</p></div>
      <button type="button" className="knowledge-secondary" onClick={() => download(teamPromptMarkdown(), 'gaas-prompts-do-time.md')}><Download size={15}/>Baixar biblioteca para o time</button>
    </header>
    <div className="grid items-start gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
      <aside className="space-y-3">
        <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2"><Search size={15} className="text-slate-400"/><input aria-label="Buscar prompt" placeholder="Buscar tarefa ou assunto" value={query} onChange={event => { const next = event.target.value; setQuery(next); const first = TEAM_PROMPTS.find(prompt => normalize(`${prompt.title} ${prompt.category} ${prompt.description}`).includes(normalize(next))); if (first) setSelectedId(first.id); setMessage(''); }} className="min-w-0 flex-1 bg-transparent text-sm outline-none"/></label>
        <div role="group" aria-label="Escolher prompt" className="space-y-2">{filtered.map(prompt => <button key={prompt.id} type="button" aria-pressed={selectedId === prompt.id} className={'knowledge-prompt-option '+(selectedId === prompt.id ? 'knowledge-prompt-option--active' : '')} onClick={() => { setSelectedId(prompt.id); setMessage(''); }}><span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{prompt.category}</span><strong className="mt-1 block text-sm text-slate-800">{prompt.title}</strong><span className="mt-1 block text-xs text-slate-500">{prompt.cadence}</span></button>)}</div>
        {!filtered.length && <p className="p-3 text-sm text-slate-500">Nenhum prompt encontrado. Tente outro termo.</p>}
      </aside>
      <article className="min-w-0 space-y-4 rounded-xl border border-slate-200 bg-white p-5" aria-label="Prompt selecionado">
        <div><p className="text-xs font-semibold text-violet-700">Sugestão para o time · v1</p><h4 className="mt-1 text-xl font-semibold text-slate-900">{selected.title}</h4><p className="mt-2 text-sm leading-6 text-slate-600">{selected.description}</p></div>
        <dl className="grid gap-3 rounded-lg bg-slate-50 p-3 sm:grid-cols-2"><div><dt className="text-xs font-semibold text-slate-700">O que anexar</dt><dd className="mt-1 text-xs leading-5 text-slate-500">{selected.inputs}</dd></div><div><dt className="text-xs font-semibold text-slate-700">O que receber</dt><dd className="mt-1 text-xs leading-5 text-slate-500">{selected.output}</dd></div></dl>
        <label className="block text-sm font-medium text-slate-700">Recorte ou objetivo <span className="font-normal text-slate-400">(opcional)</span><textarea rows={2} maxLength={4000} value={objective} onChange={event => { setObjective(event.target.value); setMessage(''); }} placeholder="Ex.: outubro de 2026, Plurix, somente WhatsApp." className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal focus:outline-cyan-600"/></label>
        <div className="flex flex-wrap gap-2"><button type="button" className="knowledge-cta" onClick={() => void navigator.clipboard.writeText(text).then(() => setMessage('Prompt copiado. Anexe os arquivos indicados na conversa com a IA.')).catch(() => setMessage('Não foi possível copiar. Abra o texto completo ou baixe o prompt.'))}>{message.startsWith('Prompt copiado') ? <Check size={15}/> : <Copy size={15}/>}Copiar prompt</button><button type="button" className="knowledge-secondary" onClick={() => download(`# ${selected.title}\n\n${text}`, `gaas-prompt-${selected.id}.md`)}><Download size={15}/>Baixar este prompt</button></div>
        {message && <p role="status" className="text-xs text-cyan-800">{message}</p>}
        <details className="knowledge-options"><summary>Ver texto completo</summary><pre className="mt-3 max-h-[480px] overflow-y-auto whitespace-pre-wrap break-words rounded-lg bg-slate-50 p-4 text-xs leading-6 text-slate-700">{text}</pre></details>
        <p className="text-xs leading-5 text-slate-500">Os prompts orientam a análise; a IA precisa conferir os arquivos. Revise o resultado antes de incorporar ao trabalho do time.</p>
      </article>
    </div>
  </section>;
}
