import { SkillsManager } from "./SkillsManager";
import { useEffect, useMemo, useState } from 'react';
import { Download, ExternalLink, Search, BookOpen, Package, Plus, Trash2 } from 'lucide-react';

interface Skill {
  id: string; name: string; description: string; kind: 'owned';
  process: string[]; agents: string[]; version: string | null; origin?: string;
  license: string; source_url: string; archive?: string;
  wiki_path?: string; bytes?: number; sha256?: string; note?: string; changelog?: string;
  entry_tokens?: number; reference_tokens?: number; suggested_context_tokens?: number; token_method?: string;
  packaged_at?: string; last_validated: string | null;
}
const base = `${import.meta.env.BASE_URL}skills/`;
const field = 'rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800';
const link = 'inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-cyan-600';
export const skillSize = (bytes: number) => bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

export function SkillsLibrary() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true), [error, setError] = useState('');
  const [query, setQuery] = useState(''), [process, setProcess] = useState(''), [agent, setAgent] = useState('');
  const [retry, setRetry] = useState(0);
  const [manage, setManage] = useState(false), [target,setTarget] = useState<Skill|null>(null);
  const [notice,setNotice] = useState('');
  useEffect(() => {
    const abort = new AbortController(); setLoading(true); setError('');
    fetch(`${base}catalog.json`, { signal: abort.signal }).then(async response => {
      if (!response.ok) throw new Error('Catálogo indisponível. Tente novamente.');
      const data = await response.json();
      if (data.schema !== 'gaas-skills/1' || !Array.isArray(data.skills)) throw new Error('Formato de catálogo inválido.');
      setSkills(data.skills.filter((s: Skill) => s.kind === 'owned'));
    }).catch(e => { if (!abort.signal.aborted) setError(e instanceof Error ? e.message : 'Não foi possível carregar.'); })
      .finally(() => { if (!abort.signal.aborted) setLoading(false); });
    return () => abort.abort();
  }, [retry]);
  const processes = useMemo(() => [...new Set(skills.flatMap(s => s.process))].sort(), [skills]);
  const agents = useMemo(() => [...new Set(skills.flatMap(s => s.agents))].sort(), [skills]);
  const visible = skills.filter(s => (!process || s.process.includes(process)) && (!agent || s.agents.includes(agent)) && `${s.name} ${s.description} ${s.process.join(' ')}`.toLocaleLowerCase('pt-BR').includes(query.toLocaleLowerCase('pt-BR')));
  return <section className="space-y-5" aria-label="Biblioteca de Skills">
    <header className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2 text-cyan-800"><Package size={20}/><h3 className="text-lg font-semibold">Skills do time</h3></div><button type="button" className={link} onClick={()=>{setTarget(null);setManage(true);}}><Plus size={15}/>Adicionar nova skill</button></div>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Encontre o procedimento para sua tarefa, confira as dependências e leve a pasta completa para sua IA. Os pacotes próprios são públicos e versionados no GitHub.</p>
      <p className="mt-2 text-sm text-slate-500">{skills.length} skills do time</p>
    </header>
    {notice && <p role="status" className="rounded-lg bg-cyan-50 p-3 text-sm text-cyan-900">{notice} <button className="underline" onClick={()=>setRetry(r=>r+1)}>Atualizar catálogo</button></p>}
    {manage && <SkillsManager target={target} onClose={()=>setManage(false)} onPublished={(name,remove)=>setNotice(`${name}: ${remove?"exclusão":"inclusão"} gravada na main. O catálogo será atualizado após o deploy do GitHub.`)}/>}
    <details className="rounded-xl border border-slate-200 bg-white p-4">
      <summary className="cursor-pointer text-sm font-semibold text-slate-700">Como instalar e usar em cada IA</summary>
      <div className="mt-3 space-y-3 text-sm leading-6 text-slate-600">
        <p><strong>Claude Code:</strong> extraia a pasta da skill em <code>.claude/skills/</code> do projeto e abra uma nova sessão. Mantenha os arquivos auxiliares juntos.</p>
        <p><strong>Codex:</strong> extraia em <code>$CODEX_HOME/skills/</code> (normalmente <code>~/.codex/skills/</code>) e abra uma nova sessão. Também pode pedir ao agente que leia o SKILL.md do repositório.</p>
        <p><strong>Cowork / ChatGPT:</strong> use a importação de skills quando disponível no produto. Caso contrário, anexe o ZIP ou seus arquivos e peça para ler SKILL.md. Scripts e conectores dependem das ferramentas disponíveis na conversa.</p>
        <p>As IAs listadas indicam destinos de uso das instruções. A execução de cada pacote ainda precisa ser validada no seu ambiente. Confira permissões e entradas antes de rodar.</p>
      </div>
    </details>
    <div className="grid gap-3 sm:grid-cols-3">
      <label className="space-y-1 text-xs font-semibold text-slate-600"><span className="flex items-center gap-1"><Search size={13}/>Buscar skill</span><input className={`${field} w-full`} value={query} onChange={e => setQuery(e.target.value)} placeholder="Tarefa, nome ou processo"/></label>
      <label className="space-y-1 text-xs font-semibold text-slate-600">Processo<select className={`${field} w-full`} value={process} onChange={e => setProcess(e.target.value)}><option value="">Todos os processos</option>{processes.map(p => <option key={p}>{p}</option>)}</select></label>
      <label className="space-y-1 text-xs font-semibold text-slate-600">IA<select className={`${field} w-full`} value={agent} onChange={e => setAgent(e.target.value)}><option value="">Todas as IAs</option>{agents.map(a => <option key={a}>{a}</option>)}</select></label>
    </div>
    {loading ? <p role="status">Carregando skills…</p> : error ? <div role="alert" className="text-sm text-rose-700">{error} <button className={link} onClick={() => setRetry(r => r + 1)}>Tentar novamente</button></div> : <>
      <p role="status" className="text-sm text-slate-500">{visible.length} skills encontradas</p>
      {!visible.length && <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">Nenhuma skill corresponde aos filtros. Experimente outro termo ou processo.</p>}
      <div className="grid items-start gap-4 lg:grid-cols-2">{visible.map(s => <article key={s.id} className="min-w-0 space-y-3 rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-2"><span className="rounded-full bg-cyan-50 px-2 py-1 text-xs font-semibold text-cyan-800">Pacote do time</span><span className="text-xs text-slate-500">{s.version ? `v${s.version}` : 'Versão na origem'}</span></div>
        <h4 className="break-words text-base font-semibold text-slate-900">{s.name}</h4>
        <p className="text-sm leading-6 text-slate-600">{s.description.length>180 ? s.description.slice(0,177)+"…" : s.description}</p>
        <div className="flex flex-wrap gap-2">{s.process.map(p => <span key={p} className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600">{p}</span>)}</div>
        <p className="text-xs leading-5 text-slate-500">IAs: {s.agents.join(', ')}<br/>{s.packaged_at ? `Publicação: ${s.packaged_at.split('-').reverse().join('/')}. ` : ''}{s.last_validated ? `Validada em ${s.last_validated}` : 'Execução por ambiente não verificada.'}</p>
        {s.entry_tokens !== undefined && <p className="text-xs leading-5 text-slate-600">Contexto inicial: ~{s.entry_tokens.toLocaleString("pt-BR")} tokens · com todas as referências: ~{s.suggested_context_tokens?.toLocaleString("pt-BR")} tokens</p>}
        <div className="flex flex-wrap gap-2">
          {s.archive && <a className={`${link} border-cyan-200 bg-cyan-50 text-cyan-900`} href={`${base}${s.archive}`} download><Download size={15}/>Baixar ZIP · {skillSize(s.bytes || 0)}</a>}
          <a className={link} href={s.source_url} target="_blank" rel="noopener noreferrer"><ExternalLink size={14}/>Código e arquivos</a>
          {s.note && <a className={link} href={`?view=learning&section=vault&wiki_path=${encodeURIComponent(s.wiki_path || "")}`}><BookOpen size={14}/>Abrir na Wiki</a>}
          <button type="button" className={`${link} text-rose-700`} onClick={()=>{setTarget(s);setManage(true);}}><Trash2 size={14}/>Excluir</button>
        </div>
        <details className="text-xs leading-5 text-slate-500"><summary className="cursor-pointer">Detalhes, caso de uso e histórico</summary><p className="mt-2 text-sm text-slate-600"><strong>Quando usar:</strong> {s.description}</p>{s.token_method && <p className="mt-2">{s.token_method}</p>}<p className="mt-2">{s.origin} · {s.license}</p>{s.sha256 && <p className="mt-2 break-all">SHA-256: {s.sha256}</p>}{s.changelog && <pre className="mt-2 whitespace-pre-wrap font-sans">{s.changelog}</pre>}</details>
      </article>)}</div>
    </>}
  </section>;
}
