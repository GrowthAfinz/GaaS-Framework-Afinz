import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertOctagon, AlertTriangle, ArrowRight, Bot, Check, CheckCircle2, ClipboardPaste, Copy, Download, FileArchive,
  FileCode2, FileJson, FileText, Folder, Image as ImageIcon, Loader2, Monitor, PackageOpen, RefreshCw, ShieldCheck,
  Smartphone, Sparkles, Upload, User, UserX,
} from 'lucide-react';
import { renderDynamicEmail } from '../ampscript/renderer';
import { BRIEFING_COLUMNS, type BriefingRow } from '../domain/briefing';
import { prepareEmailInput } from '../domain/emailInput';
import { planEmailInput, type ConflictChoices } from '../domain/emailInputPlan';
import type { ImportProblem, PlannedBriefing } from '../domain/xlsxImport';
import type { WorkspaceBriefing } from '../domain/workspace';
import {
  buildSkillPack, chatGptProjectInstructions, estimateTokens, markdownBundle, skillNameFor, summarizeRulers, zipSkillPack,
  type PackFile, type PackRulerSummary, type SkillPackContext,
} from '../export/skillPack';

export interface PromptAiWorkspaceProps {
  context: SkillPackContext;
  onSave: (text: string, file: string, sha256: string, choices: ConflictChoices) => Promise<string[]>;
  onOpen: (id: string) => void;
}

type Step = 'export' | 'use' | 'import';
type PackFormat = 'zip' | 'markdown';

const kb = (bytes: number) => (bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toLocaleString('pt-BR', { maximumFractionDigits: bytes < 10240 ? 1 : 0 })} KB`);
const sequenceNumber = (value: string) => Number(value.replace(/\D/g, '')) || 0;
const sha256 = async (text: string) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)))).map((b) => b.toString(16).padStart(2, '0')).join('');
const saveBlob = (name: string, blob: Blob) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
};
const STATUS_TONE: Record<string, string> = { ready: 'bg-emerald-500', draft: 'bg-amber-400', needs_review: 'bg-sky-500', blocked: 'bg-red-500' };
const STATUS_LABEL: Record<string, string> = { ready: 'pronto', draft: 'rascunho', needs_review: 'em revisão', blocked: 'bloqueado' };

const CopyButton = ({ text, label = 'Copiar' }: { text: string; label?: string }) => {
  const [done, setDone] = useState(false);
  return (
    <button type="button" onClick={() => { void navigator.clipboard.writeText(text).then(() => { setDone(true); setTimeout(() => setDone(false), 1600); }); }}
      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 shadow-sm transition hover:border-cyan-300 hover:text-cyan-800">
      {done ? <Check size={13} className="text-emerald-600"/> : <Copy size={13}/>}{done ? 'Copiado' : label}
    </button>
  );
};

// ------------------------------------------------------------------ passos

const STEPS: Array<{ id: Step; title: string; hint: string; icon: React.ReactNode }> = [
  { id: 'export', title: 'Exportar pacote', hint: 'Skill com produto, régua, regras e prévia', icon: <PackageOpen size={18}/> },
  { id: 'use', title: 'Criar com a IA', hint: 'Claude ou ChatGPT escrevem e mostram os quadros', icon: <Bot size={18}/> },
  { id: 'import', title: 'Importar e aprovar', hint: 'Validar, comparar e gravar como rascunho', icon: <Upload size={18}/> },
];

const StepRail = ({ step, onStep, importBadge }: { step: Step; onStep: (s: Step) => void; importBadge?: React.ReactNode }) => (
  <div role="tablist" aria-label="Ciclo Prompt e IA" className="grid gap-2 md:grid-cols-3">
    {STEPS.map((item, index) => {
      const active = step === item.id;
      return (
        <button key={item.id} role="tab" aria-selected={active} onClick={() => onStep(item.id)}
          className={`group relative flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-shadow ${active ? 'border-cyan-700 bg-gradient-to-br from-cyan-900 to-slate-900 text-white shadow-lg shadow-cyan-900/20' : 'border-slate-200 bg-white text-slate-700 hover:border-cyan-300 hover:bg-cyan-50/40'}`}>
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${active ? 'bg-white/15 text-white' : 'bg-cyan-50 text-cyan-800'}`}>{item.icon}</span>
          <span className="min-w-0">
            <span className={`block text-[11px] font-bold uppercase tracking-wider ${active ? 'text-cyan-200' : 'text-slate-400'}`}>Passo {index + 1}</span>
            <span className={`block text-sm font-bold ${active ? 'text-white' : 'text-slate-900'}`}>{item.title}</span>
            <span className={`block truncate text-xs ${active ? 'text-cyan-100/80' : 'text-slate-500'}`}>{item.hint}</span>
          </span>
          {item.id === 'import' && importBadge}
          {index < STEPS.length - 1 && <ArrowRight size={16} className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-white text-slate-300 md:block"/>}
        </button>
      );
    })}
  </div>
);

// ------------------------------------------------------------------ exportar

const RulerTimeline = ({ ruler }: { ruler: PackRulerSummary }) => (
  <div className="mt-2 flex flex-wrap items-center gap-1">
    {ruler.emails.map((email) => (
      <span key={email.sequence} title={`${email.sequence} · ${email.weekKey} · ${STATUS_LABEL[email.status] ?? email.status}${email.subject ? `\n${email.subject}` : ''}`}
        className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
        <span className={`h-1.5 w-1.5 rounded-full ${STATUS_TONE[email.status] ?? 'bg-slate-400'}`}/>E{sequenceNumber(email.sequence)}
      </span>
    ))}
    <span className="inline-flex items-center rounded-md border border-dashed border-amber-400 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">+E{ruler.emails.reduce((m, e) => Math.max(m, sequenceNumber(e.sequence)), 0) + 1}</span>
  </div>
);

const fileIcon = (file: PackFile) => file.kind === 'md' ? <FileText size={14} className="text-cyan-700"/> : file.kind === 'json' ? <FileJson size={14} className="text-amber-600"/> : file.kind === 'py' ? <FileCode2 size={14} className="text-violet-600"/> : file.kind === 'html' ? <ImageIcon size={14} className="text-rose-500"/> : <FileText size={14} className="text-slate-500"/>;

const PackExplorer = ({ files, skillName }: { files: PackFile[]; skillName: string }) => {
  const [selected, setSelected] = useState(`${skillName}/SKILL.md`);
  useEffect(() => { if (!files.some((f) => f.path === selected)) setSelected(`${skillName}/SKILL.md`); }, [files, selected, skillName]);
  const groups = useMemo(() => {
    const map = new Map<string, PackFile[]>();
    for (const file of files) {
      const rel = file.path.slice(skillName.length + 1);
      const folder = rel.startsWith('assets/previa/') ? 'assets/previa' : rel.includes('/') ? rel.slice(0, rel.lastIndexOf('/')) : '';
      map.set(folder, [...(map.get(folder) ?? []), file]);
    }
    return [...map.entries()].sort(([a], [b]) => (a === '' ? -1 : b === '' ? 1 : a.localeCompare(b)));
  }, [files, skillName]);
  const [openPreviews, setOpenPreviews] = useState(false);
  const current = files.find((f) => f.path === selected) ?? files[0];
  return (
    <div className="grid min-h-[560px] overflow-hidden rounded-2xl border border-slate-200 bg-white lg:grid-cols-[300px_minmax(0,1fr)]">
      <nav aria-label="Arquivos do pacote" className="max-h-[680px] overflow-auto border-b border-slate-200 bg-slate-50/70 p-3 lg:border-b-0 lg:border-r">
        <div className="mb-2 flex items-center gap-2 px-1 font-mono text-xs font-bold text-slate-700"><Folder size={14} className="text-cyan-700"/>{skillName}/</div>
        {groups.map(([folder, items]) => {
          const previews = folder === 'assets/previa';
          const visible = previews && !openPreviews ? items.filter((f) => f.kind !== 'html') : items;
          return (
            <div key={folder || 'raiz'} className="mb-2">
              {folder && <div className="flex items-center gap-1.5 px-1 py-1 font-mono text-[11px] font-bold text-slate-500"><Folder size={12}/>{folder}/</div>}
              {visible.map((file) => {
                const name = file.path.slice(file.path.lastIndexOf('/') + 1);
                return (
                  <button key={file.path} onClick={() => setSelected(file.path)} title={file.role}
                    className={`flex w-full items-center gap-2 rounded-lg py-1.5 pr-2 text-left text-xs transition ${folder ? 'pl-5' : 'pl-1'} ${file.path === current?.path ? 'bg-cyan-100/70 font-bold text-cyan-900' : 'text-slate-700 hover:bg-white'}`}>
                    {fileIcon(file)}<span className="min-w-0 flex-1 truncate font-mono">{name}</span><span className="shrink-0 text-[10px] text-slate-400">{kb(new TextEncoder().encode(file.content).length)}</span>
                  </button>
                );
              })}
              {previews && (
                <button onClick={() => setOpenPreviews((v) => !v)} className="ml-5 mt-1 rounded-md px-1 text-[11px] font-bold text-cyan-800 hover:underline">
                  {openPreviews ? 'Recolher esqueletos' : `${items.filter((f) => f.kind === 'html').length} esqueletos de prévia (e-mail × rede)`}
                </button>
              )}
            </div>
          );
        })}
      </nav>
      <section aria-label="Conteúdo do arquivo" className="flex min-w-0 flex-col">
        {current && (
          <>
            <header className="flex flex-wrap items-center gap-2 border-b border-slate-200 px-4 py-2.5">
              {fileIcon(current)}<span className="font-mono text-xs font-bold text-slate-800">{current.path.slice(skillName.length + 1)}</span>
              <span className="text-xs text-slate-500">· {current.role}</span>
              <span className="ml-auto"><CopyButton text={current.content}/></span>
            </header>
            {current.kind === 'html'
              ? <div className="flex-1 overflow-auto bg-slate-100 p-4"><iframe title="Esqueleto de prévia" sandbox="" srcDoc={current.content} className="mx-auto block h-[620px] w-[680px] rounded-lg bg-white shadow"/></div>
              : <pre className="max-h-[630px] flex-1 overflow-auto whitespace-pre-wrap break-words p-4 font-mono text-[11.5px] leading-relaxed text-slate-700">{current.content.length > 60000 ? `${current.content.slice(0, 60000)}\n\n[... ${kb(current.content.length - 60000)} a mais no arquivo]` : current.content}</pre>}
          </>
        )}
      </section>
    </div>
  );
};

type Selection = { selected: string[]; setSelected: React.Dispatch<React.SetStateAction<string[]>>; partner: string; setPartner: (p: string) => void };

const ExportPanel = ({ context, onNext, selection }: { context: SkillPackContext; onNext: () => void; selection: Selection }) => {
  const rulers = useMemo(() => summarizeRulers(context), [context]);
  const partners = useMemo(() => [...new Set(rulers.map((r) => r.partner))], [rulers]);
  const { selected, setSelected, partner, setPartner } = selection;
  const [query, setQuery] = useState('');
  const [format, setFormat] = useState<PackFormat>('zip');
  const [allNetworks, setAllNetworks] = useState(true);
  const [withSource, setWithSource] = useState(false);
  const pack = useMemo(() => buildSkillPack(context, {
    rulerKeys: selected, previewNetworks: allNetworks ? 'all' : 'first', includeTemplateSource: withSource, generatedAt: new Date().toISOString(),
  }), [context, selected, allNetworks, withSource]);
  const zipped = useMemo(() => (format === 'zip' ? zipSkillPack(pack) : undefined), [pack, format]);
  const markdown = useMemo(() => (format === 'markdown' ? markdownBundle(pack) : ''), [pack, format]);
  const visible = rulers.filter((r) => (!partner || r.partner === partner) && (!query || `${r.partner} ${r.segment}`.toLowerCase().includes(query.toLowerCase())));
  const toggle = (key: string) => setSelected((current) => (current.includes(key) ? current.filter((k) => k !== key) : [...current, key]));
  const size = format === 'zip' ? zipped?.length ?? 0 : new TextEncoder().encode(markdown).length;
  const download = () => {
    if (format === 'zip' && zipped) saveBlob(`${pack.skillName}.zip`, new Blob([zipped.buffer.slice(zipped.byteOffset, zipped.byteOffset + zipped.byteLength) as ArrayBuffer], { type: "application/zip" }));
    else saveBlob(`${pack.skillName}.md`, new Blob([markdown], { type: 'text/markdown;charset=utf-8' }));
  };
  return (
    <div className="grid gap-5 xl:grid-cols-[400px_minmax(0,1fr)]">
      <div className="space-y-4">
        <section className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-slate-900">Réguas no pacote</h3>
            <span className="text-xs text-slate-500">{selected.length} de {rulers.length}</span>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">Cada régua leva estratégia, textos atuais, aberturas da faixa já usadas e os esqueletos de prévia.</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {['', ...partners].map((p) => (
              <button key={p || 'todos'} onClick={() => setPartner(p)} className={`rounded-full px-3 py-1 text-xs font-bold transition ${partner === p ? 'bg-cyan-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{p || 'Todos'}</button>
            ))}
          </div>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar régua" aria-label="Buscar régua"
            className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-500"/>
          <div className="mt-2 max-h-[480px] space-y-1.5 overflow-auto pr-1">
            {visible.map((ruler) => {
              const on = selected.includes(ruler.key);
              return (
                <label key={ruler.key} className={`block cursor-pointer rounded-xl border p-3 transition ${on ? 'border-cyan-600 bg-cyan-50/60 ring-1 ring-cyan-600/20' : 'border-slate-200 hover:border-slate-300'}`}>
                  <span className="flex items-start gap-2.5">
                    <input type="checkbox" checked={on} onChange={() => toggle(ruler.key)} aria-label={`${ruler.partner} · ${ruler.segment}`} className="mt-0.5 h-4 w-4 accent-cyan-800"/>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5"><span className="rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-bold text-violet-700">{ruler.partner}</span><span className="truncate text-[11px] text-slate-500">{ruler.templateName}</span></span>
                      <span className="mt-1 block text-sm font-bold leading-tight text-slate-900">{ruler.segment}</span>
                      <RulerTimeline ruler={ruler}/>
                    </span>
                  </span>
                </label>
              );
            })}
            {!visible.length && <p className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-500">Nenhuma régua encontrada.</p>}
          </div>
          {!selected.length && <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">Sem régua marcada, o pacote leva só a skill: produto, regras, blocos e contrato.</p>}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-bold text-slate-900">Formato</h3>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {([
              ['zip', 'Skill .zip', 'Claude, ChatGPT e Claude Code. Com scripts e quadros PNG.', <FileArchive key="z" size={18}/>],
              ['markdown', 'Markdown único', 'Qualquer IA. Sem esqueletos de prévia.', <FileText key="m" size={18}/>],
            ] as const).map(([id, title, hint, icon]) => (
              <button key={id} onClick={() => setFormat(id)} aria-pressed={format === id}
                className={`rounded-xl border p-3 text-left transition ${format === id ? 'border-cyan-600 bg-cyan-50/60 ring-1 ring-cyan-600/20' : 'border-slate-200 hover:border-slate-300'}`}>
                <span className={`flex items-center gap-1.5 text-sm font-bold ${format === id ? 'text-cyan-900' : 'text-slate-800'}`}>{icon}{title}</span>
                <span className="mt-1 block text-[11px] leading-snug text-slate-500">{hint}</span>
              </button>
            ))}
          </div>
          <div className="mt-3 space-y-2 text-sm text-slate-700">
            <label className="flex items-center gap-2"><input type="checkbox" checked={allNetworks} onChange={(e) => setAllNetworks(e.target.checked)} className="h-4 w-4 accent-cyan-800"/>Prévia das 6 redes <span className="text-xs text-slate-400">(desmarcado: só a primeira, pacote mais leve)</span></label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={withSource} onChange={(e) => setWithSource(e.target.checked)} className="h-4 w-4 accent-cyan-800"/>Incluir AMPscript completo do template</label>
          </div>
        </section>

        <section className="rounded-2xl bg-gradient-to-br from-cyan-900 to-slate-900 p-4 text-white shadow-lg shadow-cyan-900/20">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div><div className="text-lg font-bold">{pack.files.length}</div><div className="text-[10px] uppercase tracking-wider text-cyan-200">arquivos</div></div>
            <div><div className="text-lg font-bold">{kb(size)}</div><div className="text-[10px] uppercase tracking-wider text-cyan-200">{format === 'zip' ? 'zip' : 'markdown'}</div></div>
            <div><div className="text-lg font-bold">~{Math.round(estimateTokens(pack.files) / 1000)}k</div><div className="text-[10px] uppercase tracking-wider text-cyan-200">tokens de texto</div></div>
          </div>
          <button onClick={download} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-cyan-950 transition hover:bg-cyan-50">
            <Download size={16}/>Baixar {format === 'zip' ? `${pack.skillName}.zip` : `${pack.skillName}.md`}
          </button>
          <button onClick={onNext} className="mt-2 flex w-full items-center justify-center gap-1.5 text-xs font-bold text-cyan-100 hover:text-white">Como usar na IA<ArrowRight size={13}/></button>
          {pack.warnings.length > 0 && <ul className="mt-3 space-y-1 rounded-lg bg-white/10 p-2 text-[11px] text-amber-100">{pack.warnings.slice(0, 4).map((w) => <li key={w}>{w}</li>)}</ul>}
        </section>
      </div>
      <div className="min-w-0">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Dentro do pacote</h3>
          <span className="text-xs text-slate-500">Montado agora, com os dados do GaaS. Nada de CPF, e-mail ou chave.</span>
        </div>
        <PackExplorer files={pack.files} skillName={pack.skillName}/>
      </div>
    </div>
  );
};

// ------------------------------------------------------------------ usar na IA

const starters = (segment: string) => [
  ['Criar o próximo e-mail', `Crie o próximo e-mail da régua ${segment}. Antes de escrever, me faça as perguntas que precisar. Depois me mostre os dois quadros (celular e desktop).`],
  ['Ajustar e-mails existentes', `Quero ajustar os E-mails [números] da régua ${segment}: [descreva a mudança]. Parta do estado atual da régua e me mostre os dois quadros antes de gerar o JSON.`],
  ['Transformar a aba Briefing Fábrica', `Segue a aba Briefing Fábrica da planilha, para a régua ${segment}. Leia os e-mails novos por rótulo, me faça as perguntas de alinhamento e só depois monte os e-mails e os quadros de prévia.`],
] as const;

const UsePanel = ({ context, onNext, selected }: { context: SkillPackContext; onNext: () => void; selected: string[] }) => {
  const rulers = useMemo(() => summarizeRulers(context).filter((r) => selected.includes(r.key)), [context, selected]);
  const skillName = skillNameFor([...new Set((rulers.length ? rulers : summarizeRulers(context)).map((r) => r.partner))]);
  const instructions = chatGptProjectInstructions({ skillName });
  const STARTERS = starters(rulers[0]?.segment ?? '[nome da régua]');
  const cards: Array<{ title: string; badge: string; steps: React.ReactNode[] }> = [
    { title: 'Claude', badge: 'recomendado', steps: [
      <>Baixe o <b>{skillName}.zip</b> no passo 1.</>,
      <>No claude.ai, abra <b>Personalizar &gt; Skills</b> e envie o zip (precisa da execução de código ligada).</>,
      <>Numa conversa nova, peça o e-mail. A skill entra sozinha quando o pedido fala de régua ou e-mail da Fábrica.</>,
      <>A IA devolve os <b>dois quadros PNG</b> e, depois do "aprovado", o <b>input_gaas_emails_*.json</b>.</>,
    ] },
    { title: 'ChatGPT', badge: 'Projeto', steps: [
      <>Crie um <b>Projeto</b> e envie o <b>{skillName}.zip</b> nos arquivos do projeto.</>,
      <>Cole as instruções abaixo nas <b>instruções do projeto</b>.</>,
      <>Converse dentro do projeto. O Code Interpreter descompacta a skill e roda os scripts.</>,
      <>Se o PNG não sair, ele entrega os quadros em HTML; a prévia fiel também aparece no passo 3.</>,
    ] },
    { title: 'Claude Code', badge: 'no computador', steps: [
      <>Descompacte o zip em <code className="rounded bg-slate-100 px-1">.claude/skills/</code> do projeto (ou em <code className="rounded bg-slate-100 px-1">~/.claude/skills/</code>).</>,
      <>Peça o e-mail normalmente; os quadros saem em <code className="rounded bg-slate-100 px-1">previa/</code>.</>,
    ] },
  ];
  return (
    <div className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-3">
        {cards.map((card) => (
          <section key={card.title} className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2"><Sparkles size={16} className="text-cyan-700"/><h3 className="text-sm font-bold text-slate-900">{card.title}</h3><span className="rounded-full bg-cyan-50 px-2 py-0.5 text-[10px] font-bold text-cyan-800">{card.badge}</span></div>
            <ol className="mt-3 space-y-2.5">
              {card.steps.map((stepNode, i) => (
                <li key={i} className="flex gap-2.5 text-xs leading-relaxed text-slate-600"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-900 text-[10px] font-bold text-white">{i + 1}</span><span>{stepNode}</span></li>
              ))}
            </ol>
          </section>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between gap-2"><h3 className="text-sm font-bold text-slate-900">Instruções do Projeto (ChatGPT)</h3><CopyButton text={instructions}/></div>
          <pre className="mt-2 max-h-56 overflow-auto whitespace-pre-wrap rounded-xl bg-slate-50 p-3 font-mono text-[11px] leading-relaxed text-slate-700">{instructions}</pre>
          <p className="mt-1 text-[11px] text-slate-400">{instructions.length.toLocaleString('pt-BR')} de ~8.000 caracteres.</p>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-bold text-slate-900">Primeira mensagem</h3>
          <div className="mt-2 space-y-2">
            {STARTERS.map(([title, text]) => (
              <div key={title} className="rounded-xl border border-slate-200 p-3">
                <div className="flex items-center justify-between gap-2"><span className="text-xs font-bold text-slate-800">{title}</span><CopyButton text={text}/></div>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">{text}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
      <section className="flex flex-wrap items-center gap-4 rounded-2xl border border-cyan-200 bg-cyan-50/60 p-4">
        <ShieldCheck size={22} className="text-cyan-800"/>
        <p className="min-w-0 flex-1 text-xs leading-relaxed text-slate-700">A IA não grava nada. O arquivo que ela entrega passa pelo passo 3: o GaaS confere de novo as regras, completa links, UTM e assinatura, mostra a régua inteira e só grava como rascunho depois da sua aprovação.</p>
        <button onClick={onNext} className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-900 px-4 py-2 text-sm font-bold text-white hover:bg-cyan-800">Importar arquivo<ArrowRight size={15}/></button>
      </section>
    </div>
  );
};

// ------------------------------------------------------------------ importar

type ProblemGroup = { severity: ImportProblem['severity']; sequence: string; field: string; message: string; networks: string[] };

function groupProblems(problems: ImportProblem[]): ProblemGroup[] {
  const map = new Map<string, ProblemGroup>();
  for (const p of problems) {
    const parts = p.where.split('.');
    const isEmail = /^E-mail \d+$/.test(parts[0]);
    const sequence = isEmail ? parts[0] : 'Arquivo';
    const network = isEmail && parts.length > 2 ? parts[1] : '';
    const field = isEmail ? parts.slice(network ? 2 : 1).join('.') : p.where;
    const key = `${p.severity}|${sequence}|${field}|${p.message}`;
    const group = map.get(key) ?? { severity: p.severity, sequence, field, message: p.message, networks: [] };
    if (network && !group.networks.includes(network)) group.networks.push(network);
    map.set(key, group);
  }
  return [...map.values()];
}

const AutoHeightFrame = ({ html, width, title }: { html: string; width: number; title: string }) => {
  const ref = useRef<HTMLIFrameElement>(null);
  const fit = useCallback(() => {
    const doc = ref.current?.contentDocument;
    if (!doc?.body || !ref.current) return;
    // Zera antes de medir: com a altura antiga, o documento nunca encolhe ao trocar de dispositivo.
    ref.current.style.height = '0px';
    ref.current.style.height = `${Math.max(doc.documentElement.scrollHeight, doc.body.scrollHeight)}px`;
  }, []);
  useEffect(() => { const t = setTimeout(fit, 600); return () => clearTimeout(t); }, [html, width, fit]);
  return <iframe ref={ref} title={title} sandbox="allow-same-origin" srcDoc={html} onLoad={fit} style={{ width, height: 900, border: 0, display: 'block', background: '#f2f4f7' }}/>;
};

const ImportPanel = ({ context, onSave, onOpen }: PromptAiWorkspaceProps) => {
  const [text, setText] = useState('');
  const [file, setFile] = useState('');
  const [hash, setHash] = useState('');
  const [choices, setChoices] = useState<ConflictChoices>({});
  const [network, setNetwork] = useState('');
  const [device, setDevice] = useState<'mobile' | 'desktop'>('mobile');
  const [withName, setWithName] = useState(true);
  const [zoom, setZoom] = useState(0.75);
  const [focus, setFocus] = useState('');
  const [tab, setTab] = useState<'problems' | 'diffs' | 'filled'>('problems');
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const [saved, setSaved] = useState<string[]>([]);

  const load = (value: string, name: string) => { setText(value); setFile(name); setChoices({}); setSaved([]); setMessage(null); setFocus(''); };
  useEffect(() => { let alive = true; if (text) void sha256(text).then((h) => { if (alive) setHash(h); }); else setHash(''); return () => { alive = false; }; }, [text]);

  const parsed = useMemo(() => { if (!text.trim()) return undefined; try { return { value: JSON.parse(text) as unknown }; } catch { return { error: true as const }; } }, [text]);
  const result = useMemo(() => {
    if (!parsed) return undefined;
    if ('error' in parsed) return { rows: [], filled: [], problems: [{ severity: 'error' as const, where: 'JSON', message: 'O arquivo não é um JSON válido. Confira vírgulas e aspas, ou peça para a IA gerar de novo.' }] };
    return prepareEmailInput(parsed.value, { briefings: context.briefings, products: context.productContexts, guardrails: context.productGuardrails });
  }, [parsed, context.briefings, context.productContexts, context.productGuardrails]);
  const plan = useMemo(() => (result ? planEmailInput(result, context.briefings, choices) : []), [result, context.briefings, choices]);
  const payload = result && 'payload' in result ? result.payload : undefined;
  const template = context.templates.find((t) => t.id === payload?.ruler.templateSlotId);
  const rulerRows = useMemo(() => (payload ? context.briefings.filter((r) => r.__meta.partner === payload.ruler.partner && r.__meta.segment === payload.ruler.segment && r.__meta.status !== 'archived') : []), [payload, context.briefings]);
  const networks = useMemo(() => [...new Set([...rulerRows.map((r) => r.NM_PRODUTO_INTERNO), ...plan.map((p) => p.incoming.network)])], [rulerRows, plan]);
  const activeNetwork = networks.includes(network) ? network : networks[0] ?? '';
  const incomingSequences = useMemo(() => [...new Set(plan.map((p) => p.incoming.sequence))], [plan]);
  const sequences = useMemo(() => [...new Set([...rulerRows.map((r) => r.SEQUENCIA), ...incomingSequences])].sort((a, b) => sequenceNumber(a) - sequenceNumber(b)), [rulerRows, incomingSequences]);
  const groups = useMemo(() => groupProblems(result?.problems ?? []), [result]);
  const blockers = groups.filter((g) => g.severity === 'error');
  const reviews = groups.filter((g) => g.severity === 'warning');
  const unresolved = plan.flatMap((item) => item.diffs.filter((d) => d.decision === 'conflict' && !choices[`${item.importKey}.${d.column}`]).map((d) => ({ item, d })));
  const counts = { create: plan.filter((p) => p.action === 'create').length, update: plan.filter((p) => p.action === 'update').length, same: plan.filter((p) => p.action === 'unchanged').length };
  const readyBack = plan.filter((p) => p.action === 'update' && rulerRows.find((r) => r.__id === p.existingId)?.__meta.status === 'ready');

  const columns = useMemo(() => {
    if (!template) return [];
    return sequences.map((sequence) => {
      const planned = plan.find((p) => p.incoming.sequence === sequence && p.incoming.network === activeNetwork);
      const existing = rulerRows.find((r) => r.SEQUENCIA === sequence && r.NM_PRODUTO_INTERNO === activeNetwork);
      const row: BriefingRow | undefined = planned?.next ?? existing;
      if (!row) return undefined;
      const rendered = renderDynamicEmail(template.source, row, { CPF: '00000000000', PRI_NOME: withName ? 'VANIA' : '', LIMITE: '3500', PRODUTO: activeNetwork, SEQUENCIA: sequence, TP_CAMPANHA: row.TP_CAMPANHA }, { pendingAssets: 'hidden' });
      const status = (existing as WorkspaceBriefing | undefined)?.__meta.status ?? '';
      const caption = planned ? (planned.action === 'create' ? 'proposta (novo)' : planned.action === 'unchanged' ? 'sem mudança' : 'proposta') : `${STATUS_LABEL[status] ?? status} (atual)`;
      const week = planned?.incoming.weekKey ?? (existing as WorkspaceBriefing | undefined)?.__meta.weekKey ?? '';
      const errors = groups.filter((g) => g.sequence === sequence && g.severity === 'error').length;
      const warns = groups.filter((g) => g.sequence === sequence && g.severity === 'warning').length;
      return { sequence, week, caption, html: rendered.html, diagnostics: rendered.diagnostics, proposed: Boolean(planned), isNew: planned?.action === 'create', errors, warns };
    }).filter((c): c is NonNullable<typeof c> => Boolean(c));
  }, [template, sequences, plan, rulerRows, activeNetwork, withName, groups]);

  const focused = focus || incomingSequences[0] || '';
  const focusGroups = groups.filter((g) => g.sequence === focused || g.sequence === 'Arquivo');
  const focusPlan = plan.filter((p) => p.incoming.sequence === focused);
  const focusFilled = (result?.filled ?? []).filter((f) => f.where.startsWith(`${focused}.`));
  const filledByField = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const f of focusFilled) map.set(f.field, (map.get(f.field) ?? new Set()).add(f.source.replace(/ \/ .*$/, '')));
    return [...map.entries()];
  }, [focusFilled]);
  const blockedSave = busy || !plan.length || blockers.length > 0 || unresolved.length > 0 || !template || counts.create + counts.update === 0;

  const save = async () => {
    setBusy(true); setMessage(null);
    try {
      const digest = await sha256(text);
      const ids = await onSave(text, file || 'JSON colado', digest, choices);
      setSaved(ids);
      setMessage({ tone: 'ok', text: `${counts.create + counts.update} rascunho(s) gravado(s) com histórico de versão. Importar o mesmo arquivo de novo não duplica nada.` });
    } catch (error) {
      setMessage({ tone: 'error', text: error instanceof Error ? error.message : String(error) });
    } finally { setBusy(false); }
  };

  const onDrop = async (event: React.DragEvent) => {
    event.preventDefault(); setDragging(false);
    const dropped = event.dataTransfer.files?.[0];
    if (dropped) load(await dropped.text(), dropped.name);
    else { const pasted = event.dataTransfer.getData('text'); if (pasted) load(pasted, 'JSON colado'); }
  };

  if (!text) {
    return (
      <div onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(e) => void onDrop(e)}
        className={`grid gap-5 rounded-3xl border-2 border-dashed p-8 transition lg:grid-cols-[minmax(0,1fr)_380px] ${dragging ? 'border-cyan-600 bg-cyan-50' : 'border-slate-300 bg-white'}`}>
        <div className="flex flex-col items-center justify-center text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-800"><Upload size={28}/></span>
          <h3 className="mt-4 text-lg font-bold text-slate-900">Solte aqui o input_gaas_emails_*.json</h3>
          <p className="mt-1 max-w-md text-sm text-slate-500">O arquivo que a IA entregou depois do "aprovado". Nada é gravado até você revisar a régua e clicar em aprovar.</p>
          <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-cyan-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-cyan-800">
            <FileJson size={16}/>Escolher arquivo
            <input aria-label="Arquivo JSON" type="file" accept=".json,application/json" className="sr-only" onChange={async (e) => { const f = e.target.files?.[0]; if (f) load(await f.text(), f.name); }}/>
          </label>
        </div>
        <div>
          <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600"><ClipboardPaste size={14}/>Ou cole o JSON</label>
          <textarea aria-label="Conteúdo JSON" onChange={(e) => load(e.target.value, 'JSON colado')} placeholder='{ "contract": "gaas-emails-input/1", ... }'
            className="mt-2 h-48 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 font-mono text-xs outline-none focus:border-cyan-500"/>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700"><FileJson size={20}/></span>
          <div className="min-w-0">
            <div className="truncate text-sm font-bold text-slate-900">{file || 'JSON colado'}</div>
            <div className="truncate text-xs text-slate-500">{payload ? `${payload.ruler.partner} · ${payload.ruler.segment} · ${payload.generatedBy.tool} ${payload.generatedBy.model}` : 'Arquivo não reconhecido'}{hash && <span className="font-mono"> · sha {hash.slice(0, 10)}</span>}</div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-bold">
          <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-slate-700">{incomingSequences.length} e-mail(s) × {networks.length} redes</span>
          {counts.create > 0 && <span className="rounded-lg bg-amber-50 px-2.5 py-1.5 text-amber-800">{counts.create} novas</span>}
          {counts.update > 0 && <span className="rounded-lg bg-cyan-50 px-2.5 py-1.5 text-cyan-800">{counts.update} alteradas</span>}
          {counts.same > 0 && <span className="rounded-lg bg-slate-50 px-2.5 py-1.5 text-slate-500">{counts.same} iguais</span>}
          <span className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 ${blockers.length ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>{blockers.length ? <AlertOctagon size={13}/> : <CheckCircle2 size={13}/>}{blockers.length} bloqueia</span>
          <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1.5 text-amber-800"><AlertTriangle size={13}/>{reviews.length} revisar</span>
          {unresolved.length > 0 && <span className="rounded-lg bg-violet-50 px-2.5 py-1.5 text-violet-800">{unresolved.length} conflitos</span>}
        </div>
        <button onClick={() => load('', '')} className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50"><RefreshCw size={13}/>Trocar arquivo</button>
      </section>

      {payload && (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <header className="flex flex-wrap items-center gap-2 border-b border-slate-200 px-4 py-2.5">
            <h3 className="mr-2 text-sm font-bold text-slate-900">Régua com a proposta</h3>
            <div className="flex flex-wrap gap-1" role="group" aria-label="Assinatura">
              {networks.map((n) => <button key={n} onClick={() => setNetwork(n)} aria-pressed={n === activeNetwork} className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition ${n === activeNetwork ? 'bg-cyan-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{n}</button>)}
            </div>
            <div className="ml-auto flex flex-wrap items-center gap-1.5">
              <div className="flex rounded-lg bg-slate-100 p-0.5" role="group" aria-label="Dispositivo">
                <button onClick={() => setDevice('mobile')} aria-pressed={device === 'mobile'} className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-bold ${device === 'mobile' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}><Smartphone size={13}/>Celular</button>
                <button onClick={() => setDevice('desktop')} aria-pressed={device === 'desktop'} className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-bold ${device === 'desktop' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}><Monitor size={13}/>Desktop</button>
              </div>
              <div className="flex rounded-lg bg-slate-100 p-0.5" role="group" aria-label="Amostra de nome">
                <button onClick={() => setWithName(true)} aria-pressed={withName} className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-bold ${withName ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}><User size={13}/>Com nome</button>
                <button onClick={() => setWithName(false)} aria-pressed={!withName} className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-bold ${!withName ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}><UserX size={13}/>Sem nome</button>
              </div>
              <select aria-label="Zoom da régua" value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-slate-600">
                {[0.5, 0.75, 1].map((z) => <option key={z} value={z}>{Math.round(z * 100)}%</option>)}
              </select>
            </div>
          </header>
          {!template && <p role="alert" className="m-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">O template {payload.ruler.templateSlotId} não está carregado no GaaS: a prévia e a gravação ficam bloqueadas.</p>}
          <div className="overflow-x-auto bg-[#e9ebf3] p-4">
            <div className="flex items-start gap-4" style={{ zoom }}>
              {columns.map((col) => (
                <div key={col.sequence} role="button" tabIndex={0} onClick={() => setFocus(col.sequence)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setFocus(col.sequence); } }} aria-pressed={focused === col.sequence}
                  className={`shrink-0 cursor-pointer rounded-xl p-2 text-left transition ${focused === col.sequence ? 'bg-white shadow-lg ring-2 ring-cyan-700' : 'hover:bg-white/60'}`}>
                  <div className="flex items-center gap-2 px-1">
                    <span className="text-[15px] font-bold text-[#2C3490]">{col.sequence} · {col.week}</span>
                    {col.errors > 0 && <span className="rounded bg-red-100 px-1.5 text-[10px] font-bold text-red-700">{col.errors}</span>}
                    {col.warns > 0 && <span className="rounded bg-amber-100 px-1.5 text-[10px] font-bold text-amber-800">{col.warns}</span>}
                  </div>
                  <div className={`mb-2 px-1 text-[11px] font-bold ${col.proposed ? 'text-cyan-800' : 'text-slate-500'}`}>{col.caption}</div>
                  <div className={`pointer-events-none rounded bg-[#f2f4f7] p-1.5 ${col.isNew ? 'outline-dashed outline-2 outline-[#E7A921]' : ''}`}>
                    {col.html ? <AutoHeightFrame html={col.html} width={device === 'mobile' ? 375 : 680} title={`${col.sequence} ${activeNetwork}`}/> : <p className="w-[375px] p-4 text-xs text-red-700">{col.diagnostics.join(' ')}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="rounded-2xl border border-slate-200 bg-white">
          <header className="flex flex-wrap items-center gap-2 border-b border-slate-200 px-4 py-2.5">
            <h3 className="text-sm font-bold text-slate-900">{focused ? `Detalhes do ${focused}` : 'Detalhes'}</h3>
            <div className="ml-auto flex rounded-lg bg-slate-100 p-0.5" role="tablist" aria-label="Detalhes do e-mail importado">
              {([['problems', `Conferência (${focusGroups.length})`], ['diffs', `Diferenças (${focusPlan.reduce((n, p) => n + p.diffs.length, 0)})`], ['filled', `Preenchido pelo GaaS (${filledByField.length})`]] as const).map(([id, label]) => (
                <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={`rounded-md px-2.5 py-1 text-xs font-bold ${tab === id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>{label}</button>
              ))}
            </div>
          </header>
          <div className="max-h-[460px] overflow-auto p-4">
            {tab === 'problems' && (focusGroups.length ? (
              <ul className="space-y-2">
                {[...focusGroups].sort((a, b) => (a.severity === b.severity ? 0 : a.severity === 'error' ? -1 : 1)).map((g, i) => (
                  <li key={i} className={`flex gap-2.5 rounded-xl border p-3 text-xs ${g.severity === 'error' ? 'border-red-200 bg-red-50/60' : 'border-amber-200 bg-amber-50/60'}`}>
                    {g.severity === 'error' ? <AlertOctagon size={15} className="mt-0.5 shrink-0 text-red-600"/> : <AlertTriangle size={15} className="mt-0.5 shrink-0 text-amber-600"/>}
                    <div className="min-w-0">
                      <div className="font-bold text-slate-800">{g.severity === 'error' ? 'Bloqueia' : 'Revisar'} · {g.field || g.sequence}</div>
                      <div className="mt-0.5 text-slate-700">{g.message}</div>
                      {g.networks.length > 0 && <div className="mt-1 text-[11px] text-slate-500">{g.networks.length === networks.length ? 'Todas as redes' : g.networks.join(', ')}</div>}
                    </div>
                  </li>
                ))}
              </ul>
            ) : <p className="flex items-center gap-2 text-sm text-emerald-700"><CheckCircle2 size={16}/>Nada a conferir neste e-mail.</p>)}
            {tab === 'diffs' && (
              <div className="space-y-3">
                {focusPlan.map((item) => (
                  <details key={item.importKey} open={item.incoming.network === activeNetwork} className="rounded-xl border border-slate-200">
                    <summary className="flex cursor-pointer items-center gap-2 px-3 py-2 text-xs font-bold text-slate-800">
                      {item.incoming.network}
                      <span className={`rounded px-1.5 py-0.5 text-[10px] ${item.action === 'create' ? 'bg-amber-100 text-amber-800' : item.action === 'update' ? 'bg-cyan-100 text-cyan-800' : 'bg-slate-100 text-slate-500'}`}>{item.action === 'create' ? 'novo' : item.action === 'update' ? `${item.diffs.length} campo(s)` : 'igual'}</span>
                    </summary>
                    <div className="space-y-2 border-t border-slate-100 p-3">
                      {item.action === 'create' && <p className="text-xs text-slate-500">E-mail novo nesta rede: todos os campos vêm do arquivo e do e-mail anterior.</p>}
                      {item.diffs.map((d) => <DiffRow key={d.column} item={item} column={d.column} gaas={d.gaas} sheet={d.sheet} decision={d.decision} choice={choices[`${item.importKey}.${d.column}`]} onChoice={(v) => setChoices((c) => ({ ...c, [`${item.importKey}.${d.column}`]: v }))}/>)}
                    </div>
                  </details>
                ))}
                {!focusPlan.length && <p className="text-sm text-slate-500">Este e-mail não está no arquivo.</p>}
              </div>
            )}
            {tab === 'filled' && (
              <div className="grid gap-1.5 sm:grid-cols-2">
                {filledByField.map(([field, sources]) => (
                  <div key={field} className="rounded-lg bg-slate-50 px-3 py-2 text-xs"><div className="font-mono font-bold text-slate-800">{field}</div><div className="text-slate-500">{[...sources].join(' · ')}</div></div>
                ))}
                {!filledByField.length && <p className="text-sm text-slate-500">Nada preenchido pelo GaaS neste e-mail.</p>}
              </div>
            )}
          </div>
        </div>

        <aside className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 xl:sticky xl:top-4 xl:self-start">
          <h3 className="text-sm font-bold text-slate-900">Aprovar e gravar</h3>
          <ul className="space-y-1.5 text-xs">
            {[
              [blockers.length === 0, blockers.length ? `${blockers.length} item(ns) bloqueiam a gravação` : 'Nenhum bloqueio'],
              [unresolved.length === 0, unresolved.length ? `${unresolved.length} conflito(s) entre arquivo e GaaS para decidir` : 'Sem conflitos pendentes'],
              [Boolean(template), template ? `Prévia com ${template.name}` : 'Template indisponível'],
              [counts.create + counts.update > 0, counts.create + counts.update ? `${counts.create + counts.update} versão(ões) para gravar` : 'Nada mudou em relação ao GaaS'],
            ].map(([ok, label]) => <li key={String(label)} className={`flex items-center gap-2 ${ok ? 'text-slate-700' : 'font-bold text-red-700'}`}>{ok ? <CheckCircle2 size={14} className="text-emerald-600"/> : <AlertOctagon size={14}/>}{label}</li>)}
          </ul>
          {readyBack.length > 0 && <p className="rounded-lg bg-amber-50 p-2.5 text-[11px] leading-relaxed text-amber-900">{[...new Set(readyBack.map((p) => p.incoming.sequence))].join(', ')} {readyBack.length > 1 ? 'estão' : 'está'} como pronto e volta(m) para rascunho ao gravar.</p>}
          <p className="text-[11px] leading-relaxed text-slate-500">Tudo entra como rascunho, com a proveniência do arquivo (nome, sha256, modelo) e uma versão no histórico. O template não muda.</p>
          <button onClick={() => void save()} disabled={blockedSave} className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-40">
            {busy ? <Loader2 size={16} className="animate-spin"/> : <ShieldCheck size={16}/>}{busy ? 'Gravando…' : 'Aprovar e gravar rascunhos'}
          </button>
          {message && <p role="status" className={`rounded-lg p-2.5 text-xs ${message.tone === 'ok' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}`}>{message.text}</p>}
          {saved.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {[...new Set(plan.map((p) => p.incoming.sequence))].map((sequence) => {
                const id = plan.find((p) => p.incoming.sequence === sequence && p.incoming.network === activeNetwork)?.next.__id ?? saved[0];
                return <button key={sequence} onClick={() => onOpen(id)} className="rounded-lg border border-cyan-200 px-2.5 py-1 text-xs font-bold text-cyan-800 hover:bg-cyan-50">Abrir {sequence}</button>;
              })}
            </div>
          )}
        </aside>
      </section>
    </div>
  );
};

const DiffRow = ({ item, column, gaas, sheet, decision, choice, onChoice }: { item: PlannedBriefing; column: string; gaas: string; sheet: string; decision: string; choice?: 'gaas' | 'file'; onChoice: (v: 'gaas' | 'file') => void }) => (
  <div className="rounded-lg bg-slate-50 p-2.5 text-xs">
    <div className="flex flex-wrap items-center gap-2">
      <span className="font-mono font-bold text-slate-800">{column}</span>
      {decision === 'conflict'
        ? <span className="ml-auto flex rounded-md bg-white p-0.5 shadow-sm" role="group" aria-label={`Decisão ${item.incoming.sequence} ${item.incoming.network} ${column}`}>
            <button onClick={() => onChoice('gaas')} aria-pressed={choice === 'gaas'} className={`rounded px-2 py-0.5 font-bold ${choice === 'gaas' ? 'bg-slate-800 text-white' : 'text-slate-500'}`}>Manter GaaS</button>
            <button onClick={() => onChoice('file')} aria-pressed={choice === 'file'} className={`rounded px-2 py-0.5 font-bold ${choice === 'file' ? 'bg-cyan-800 text-white' : 'text-slate-500'}`}>Usar arquivo</button>
          </span>
        : <span className="ml-auto text-[11px] text-slate-500">{decision === 'keep-gaas' ? 'Mantém a edição feita no GaaS' : 'Atualiza com o arquivo'}</span>}
    </div>
    <div className="mt-2 grid gap-2 md:grid-cols-2">
      <div className="min-w-0 rounded border border-slate-200 bg-white p-2"><div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">GaaS hoje</div><div className="break-words text-slate-600 line-through decoration-red-300/70">{gaas || '(vazio)'}</div></div>
      <div className="min-w-0 rounded border border-cyan-200 bg-white p-2"><div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-cyan-700">Arquivo</div><div className="break-words text-slate-800">{sheet || '(vazio)'}</div></div>
    </div>
  </div>
);

// ------------------------------------------------------------------ página

export function PromptAiWorkspace(props: PromptAiWorkspaceProps) {
  const [step, setStep] = useState<Step>('export');
  const [selected, setSelected] = useState<string[]>([]);
  const [partner, setPartner] = useState('');
  const rulers = useMemo(() => summarizeRulers(props.context), [props.context]);
  const defaulted = useRef(false);
  useEffect(() => {
    // Abre com a régua mais recente da Fábrica marcada (V2 de topo, quando existe).
    if (defaulted.current || !rulers.length) return;
    defaulted.current = true;
    const pick = rulers.find((r) => /V2 TOPO DE FUNIL/i.test(r.segment));
    if (pick) { setSelected([pick.key]); setPartner(pick.partner); }
  }, [rulers]);
  return (
    <main className="mt-4 space-y-5 text-slate-800">
      <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-white to-cyan-50/60 p-5">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900"><Sparkles size={20} className="text-cyan-700"/>Prompt e IA</h2>
            <p className="mt-1 max-w-3xl text-sm text-slate-500">Leve a Fábrica inteira para o Claude ou o ChatGPT: produto, régua, regras e prévia. A IA escreve e mostra os quadros; o arquivo volta para cá, você revisa a régua e aprova. Sem migration.</p>
          </div>
          <span className="rounded-full bg-white px-3 py-1 text-[11px] font-bold text-slate-500 shadow-sm ring-1 ring-slate-200">{BRIEFING_COLUMNS.length} colunas · contrato gaas-emails-input/1</span>
        </div>
        <StepRail step={step} onStep={setStep}/>
      </section>
      {step === 'export' && <ExportPanel context={props.context} onNext={() => setStep('use')} selection={{ selected, setSelected, partner, setPartner }}/>}
      {step === 'use' && <UsePanel context={props.context} selected={selected} onNext={() => setStep('import')}/>}
      {step === 'import' && <ImportPanel {...props}/>}
    </main>
  );
}
