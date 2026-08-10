import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, ChevronRight, Code2, Download, FileSpreadsheet, Mail, Plus, Save, ShieldAlert, Upload, Wand2 } from 'lucide-react';
import { renderDynamicEmail, type SubscriberSample } from '../ampscript/renderer';
import { applyFix, BRIEFING_COLUMNS, emptyBriefingRow, exportBriefingCsv, parseBriefingCsv, rowKey, toDateInput, validateRows, type BriefingColumn, type BriefingRow, type ValidationIssue } from '../domain/briefing';
import { DEFAULT_DYNAMIC_EMAIL_TEMPLATE } from '../fixtures/defaultTemplate';

const TEMPLATE_KEY = 'gaas-dynamic-email-template-v1';
const ROWS_KEY = 'gaas-dynamic-email-briefings-v1';
const SAMPLE: SubscriberSample = { CPF: '00000000000', PRI_NOME: 'VANIA', LIMITE: 'R$ 3.500', PRODUTO: 'INSTITUCIONAL', SEQUENCIA: 'E-mail 1', TP_CAMPANHA: 'Repescagem' };
const LONG_FIELDS = new Set<BriefingColumn>(['COPY_1_PRETO', 'COPY_2_PRETO', 'NOTA_LEGAL', 'RODAPE', 'PRE_CABECALHO']);
const COLOR_FIELDS = new Set<BriefingColumn>(['COR_COPY_1', 'COR_COPY_PRETO_1', 'COR_TITULO_COPY_2', 'COR_COPY_2', 'COR_NOTA_LEGAL']);

const FIELD_GROUPS: { label: string; fields: BriefingColumn[] }[] = [
  { label: 'Identidade e vigência', fields: ['DT_INICIO', 'DT_FIM', 'UTM_CAMPANHA', 'TP_CAMPANHA', 'SEQUENCIA', 'NM_PRODUTO_INTERNO', 'CARTAO_NM_COMERCIAL'] },
  { label: 'Envelope', fields: ['ASSUNTO', 'PRE_CABECALHO', 'HEADER'] },
  { label: 'Copy e CTA 1', fields: ['TITULO_COPY_1_AZUL', 'COR_COPY_1', 'TAMANHO_DA_FONTE_TITULO_COPY_1', 'COPY_1_PRETO', 'COR_COPY_PRETO_1', 'TAMANHO_DA_FONTE_TITULO_COPY_PRETO_1', 'TITULO_CTA_1', 'LINK_CTA_1'] },
  { label: 'Copy e CTA 2', fields: ['TITULO_COPY_2', 'COR_TITULO_COPY_2', 'TAMANHO_DA_FONTE_TITULO_COPY_2', 'COPY_2_PRETO', 'COR_COPY_2', 'TAMANHO_DA_FONTE_COPY_2', 'TITULO_CTA_2', 'LINK_CTA_2'] },
  { label: 'Banners', fields: ['BANNER_1_CORPO', 'LINK_BANNER_1_CORPO', 'BANNER_2_CORPO', 'LINK_BANNER_2_CORPO', 'BANNER_3_CORPO', 'LINK_BANNER_3_CORPO'] },
  { label: 'Legal e rodapé', fields: ['NOTA_LEGAL', 'COR_NOTA_LEGAL', 'TAMANHO_DA_FONTE_NOTA_LEGAL', 'RODAPE'] },
];

function demoRows(): BriefingRow[] {
  const visa = emptyBriefingRow('fixture-visa');
  Object.assign(visa, { DT_INICIO: '2026-06-01T00:00', DT_FIM: '2026-12-31T23:59', UTM_CAMPANHA: 'repescagem_visa', TP_CAMPANHA: 'Repescagem', SEQUENCIA: 'E-mail 1', ASSUNTO: 'Seu cartão Afinz Visa com limite pré-aprovado!', PRE_CABECALHO: 'Peça já o seu! Limite disponível para usar na hora', CARTAO_NM_COMERCIAL: 'Afinz Visa', NM_PRODUTO_INTERNO: 'INSTITUCIONAL', TITULO_COPY_1_AZUL: 'Sua aprovação chegou!', COR_COPY_1: '#00C6CC', TAMANHO_DA_FONTE_TITULO_COPY_1: '24', COPY_1_PRETO: 'Olá, %%=v(@FirstName)=%%!<br><br>Sua solicitação de cartão <b>%%=v(@CartaoNmComercial)=%%</b> foi reavaliada e aprovada: limite de %%=v(@LimiteNovo)=%% já disponível.', COR_COPY_PRETO_1: '#222222', TAMANHO_DA_FONTE_TITULO_COPY_PRETO_1: '16', TITULO_CTA_1: 'PEÇA JÁ O SEU CARTÃO', LINK_CTA_1: 'https://cartao-afinz.onelink.me/I1Ur/zr4jy3g1' });
  const plurix = emptyBriefingRow('fixture-plurix');
  Object.assign(plurix, { DT_INICIO: '2026-08-10T00:00', DT_FIM: '2026-08-31T23:59', UTM_CAMPANHA: 'mais_amigo', TP_CAMPANHA: 'Aquisição', SEQUENCIA: 'E-mail 1', ASSUNTO: 'O Clube Amigão mudou!', PRE_CABECALHO: 'Conheça o +amigo', CARTAO_NM_COMERCIAL: '+amigo', NM_PRODUTO_INTERNO: 'PLURIX', COPY_1_PRETO: '%%=v(@FirstName)=%%, o Clube Amigão agora é +amigo, e chega com muito mais ofertas exclusivas para você!', COR_COPY_PRETO_1: '#222222', TAMANHO_DA_FONTE_TITULO_COPY_PRETO_1: '16', TITULO_COPY_2: 'E as novidades <br>não param por aí!', COR_TITULO_COPY_2: '#2C3490', TAMANHO_DA_FONTE_TITULO_COPY_2: '22' });
  return [visa, plurix];
}

function downloadText(name: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }));
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = name; anchor.click(); URL.revokeObjectURL(url);
}

export const DynamicEmailWorkspace: React.FC = () => {
  const [rows, setRows] = useState<BriefingRow[]>(() => { try { return JSON.parse(localStorage.getItem(ROWS_KEY) ?? 'null') ?? demoRows(); } catch { return demoRows(); } });
  const [selectedId, setSelectedId] = useState(rows[0]?.__id ?? '');
  const [template, setTemplate] = useState(() => localStorage.getItem(TEMPLATE_KEY) ?? DEFAULT_DYNAMIC_EMAIL_TEMPLATE);
  const [savedTemplate, setSavedTemplate] = useState(template);
  const [mode, setMode] = useState<'campaigns' | 'template'>('campaigns');
  const [subscriber, setSubscriber] = useState<SubscriberSample>(SAMPLE);
  const [importMessages, setImportMessages] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { localStorage.setItem(ROWS_KEY, JSON.stringify(rows)); }, [rows]);
  const issuesByRow = useMemo(() => validateRows(rows), [rows]);
  const selected = rows.find((row) => row.__id === selectedId) ?? rows[0];
  const selectedIssues = selected ? issuesByRow.get(selected.__id) ?? [] : [];
  const render = useMemo(() => selected ? renderDynamicEmail(savedTemplate, selected, { ...subscriber, PRODUTO: selected.NM_PRODUTO_INTERNO, SEQUENCIA: selected.SEQUENCIA, TP_CAMPANHA: selected.TP_CAMPANHA }) : { html: '', diagnostics: [] }, [savedTemplate, selected, subscriber]);
  const errorCount = [...issuesByRow.values()].flat().filter((issue) => issue.severity === 'error').length;
  const warningCount = [...issuesByRow.values()].flat().filter((issue) => issue.severity === 'warning').length;

  const updateSelected = (patch: Partial<BriefingRow>) => setRows((current) => current.map((row) => row.__id === selected?.__id ? { ...row, ...patch } : row));
  const fixIssue = (issue: ValidationIssue) => { if (selected) setRows((current) => current.map((row) => row.__id === selected.__id ? applyFix(row, issue) : row)); };
  const exportCsv = () => { if (!errorCount) downloadText(`TB_BRIEFING_CAMPANHA_AQUISICAO_${new Date().toISOString().slice(0, 10)}.csv`, exportBriefingCsv(rows)); };
  const onFile = async (file?: File) => { if (!file) return; const parsed = parseBriefingCsv(await file.text()); setImportMessages(parsed.errors); if (parsed.rows.length) { setRows(parsed.rows); setSelectedId(parsed.rows[0].__id); } };
  const saveTemplate = () => { localStorage.setItem(TEMPLATE_KEY, template); setSavedTemplate(template); };

  return <div className="min-h-full bg-slate-50">
    <header className="border-b border-slate-200 bg-white px-6 py-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700"><Mail size={14}/> Comunicação</div><h1 className="mt-1 text-2xl font-bold text-slate-950">E-mail Dinâmico</h1><p className="mt-1 text-sm text-slate-500">Revise, renderize e exporte briefings prontos para o SFMC.</p></div>
        <div className="flex items-center gap-2">
          <button onClick={() => setMode('campaigns')} className={`rounded-lg px-4 py-2 text-sm font-semibold ${mode === 'campaigns' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}>Campanhas</button>
          <button onClick={() => setMode('template')} className={`rounded-lg px-4 py-2 text-sm font-semibold ${mode === 'template' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}><Code2 className="mr-2 inline" size={15}/>Template-fonte</button>
        </div>
      </div>
    </header>

    {mode === 'template' ? <main className="p-6"><div className="mx-auto max-w-6xl rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center justify-between border-b border-slate-200 p-5"><div><h2 className="font-bold text-slate-900">Código do Content Builder</h2><p className="text-sm text-slate-500">Cole o HTML + AMPscript bruto. A V1 salva somente neste navegador.</p></div><button onClick={saveTemplate} className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-bold text-white"><Save size={16}/>Salvar e aplicar</button></div><textarea aria-label="Template-fonte" value={template} onChange={(e) => setTemplate(e.target.value)} spellCheck={false} className="h-[68vh] w-full resize-none rounded-b-2xl bg-slate-950 p-5 font-mono text-xs leading-5 text-slate-100 outline-none"/></div></main> :
    <main className="p-6">
      <section className="mb-5 grid gap-3 md:grid-cols-4">
        <StatusCard label="Linhas carregadas" value={rows.length} icon={<FileSpreadsheet size={18}/>} tone="slate"/>
        <StatusCard label="Erros bloqueantes" value={errorCount} icon={<ShieldAlert size={18}/>} tone={errorCount ? 'red' : 'green'}/>
        <StatusCard label="Avisos" value={warningCount} icon={<AlertTriangle size={18}/>} tone="amber"/>
        <div className="flex items-center justify-end gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><input ref={fileRef} type="file" accept=".csv,text/csv" hidden onChange={(e) => onFile(e.target.files?.[0])}/><button onClick={() => fileRef.current?.click()} className="rounded-lg border border-slate-200 p-2.5 text-slate-600" title="Importar CSV"><Upload size={18}/></button><button onClick={() => { const row = emptyBriefingRow(); setRows((r) => [...r, row]); setSelectedId(row.__id); }} className="rounded-lg border border-slate-200 p-2.5 text-slate-600" title="Nova linha"><Plus size={18}/></button><button disabled={!!errorCount || !rows.length} onClick={exportCsv} className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-3 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-300"><Download size={17}/>Exportar</button></div>
      </section>
      {importMessages.length > 0 && <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{importMessages.map((message) => <div key={message}>{message}</div>)}</div>}
      <div className="grid min-h-[720px] gap-5 xl:grid-cols-[280px_minmax(420px,0.9fr)_minmax(440px,1.1fr)]">
        <aside className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-200 px-4 py-3 text-sm font-bold text-slate-900">Briefings</div><div className="max-h-[780px] overflow-y-auto p-2">{rows.map((row) => { const issues = issuesByRow.get(row.__id) ?? []; const errors = issues.filter((i) => i.severity === 'error').length; return <button key={row.__id} onClick={() => setSelectedId(row.__id)} className={`mb-1 w-full rounded-xl border p-3 text-left transition ${selected?.__id === row.__id ? 'border-cyan-300 bg-cyan-50' : 'border-transparent hover:bg-slate-50'}`}><div className="flex items-start justify-between gap-2"><div className="min-w-0"><div className="truncate text-sm font-bold text-slate-900">{row.NM_PRODUTO_INTERNO || 'Produto pendente'}</div><div className="mt-1 truncate text-xs text-slate-500">{row.TP_CAMPANHA || '—'} · {row.SEQUENCIA || '—'}</div></div>{errors ? <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">{errors}</span> : <CheckCircle2 className="text-emerald-500" size={16}/>}</div><div className="mt-2 truncate text-xs text-slate-400">{row.ASSUNTO || 'Sem assunto'}</div></button>; })}</div></aside>
        {selected ? <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-200 p-4"><h2 className="font-bold text-slate-900">{rowKey(selected)}</h2><p className="text-xs text-slate-500">Alterações salvas automaticamente neste navegador.</p></div><div className="max-h-[780px] overflow-y-auto p-4">
          {selectedIssues.length > 0 && <div className="mb-5 space-y-2">{selectedIssues.map((issue, index) => <div key={`${issue.code}-${issue.field}-${index}`} className={`flex items-start justify-between gap-3 rounded-lg border px-3 py-2 text-xs ${issue.severity === 'error' ? 'border-red-200 bg-red-50 text-red-800' : 'border-amber-200 bg-amber-50 text-amber-800'}`}><span>{issue.message}</span>{issue.fix && <button onClick={() => fixIssue(issue)} className="shrink-0 rounded-md bg-white px-2 py-1 font-bold shadow-sm"><Wand2 className="mr-1 inline" size={12}/>Corrigir</button>}</div>)}</div>}
          <label className="mb-5 flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700"><input type="checkbox" checked={!!selected.__journeyConfirmed} onChange={(e) => updateSelected({ __journeyConfirmed: e.target.checked })} className="mt-0.5"/><span><b>Jornada ativa confirmada</b><br/><span className="text-xs text-slate-500">Validação manual no SFMC para esta campanha e sequência.</span></span></label>
          {FIELD_GROUPS.map((group) => <fieldset key={group.label} className="mb-6"><legend className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">{group.label}</legend><div className="grid gap-3 md:grid-cols-2">{group.fields.map((field) => <Field key={field} field={field} value={selected[field]} suggestions={[...new Set(rows.map((row) => row[field]).filter(Boolean))]} onChange={(value) => updateSelected({ [field]: value })}/>)}</div></fieldset>)}
        </div></section> : <div/>}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-200 p-4"><div className="flex items-center justify-between"><div><h2 className="font-bold text-slate-900">Preview local</h2><p className="text-xs text-slate-500">Fiel ao subconjunto AMPscript suportado · certificação final via Test Send</p></div><ChevronRight className="text-slate-300" size={18}/></div><div className="mt-3 grid grid-cols-2 gap-2"><MiniInput label="Nome" value={subscriber.PRI_NOME} onChange={(value) => setSubscriber((s) => ({ ...s, PRI_NOME: value }))}/><MiniInput label="Limite" value={subscriber.LIMITE} onChange={(value) => setSubscriber((s) => ({ ...s, LIMITE: value }))}/></div></div>{render.diagnostics.length > 0 ? <div className="m-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{render.diagnostics.map((d) => <div key={d}>{d}</div>)}</div> : <iframe title="Preview do e-mail dinâmico" sandbox="" srcDoc={render.html} className="h-[720px] w-full bg-slate-100"/>}</section>
      </div>
    </main>}
  </div>;
};

const StatusCard = ({ label, value, icon, tone }: { label: string; value: number; icon: React.ReactNode; tone: 'slate' | 'red' | 'green' | 'amber' }) => { const colors = { slate: 'bg-slate-100 text-slate-600', red: 'bg-red-100 text-red-700', green: 'bg-emerald-100 text-emerald-700', amber: 'bg-amber-100 text-amber-700' }; return <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><span className={`grid h-10 w-10 place-items-center rounded-xl ${colors[tone]}`}>{icon}</span><div><div className="text-2xl font-bold text-slate-950">{value}</div><div className="text-xs text-slate-500">{label}</div></div></div>; };
const MiniInput = ({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) => <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}<input value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full rounded-md border border-slate-200 px-2 py-1.5 text-xs font-normal normal-case tracking-normal text-slate-700 outline-none focus:border-cyan-400"/></label>;

const Field = ({ field, value, suggestions, onChange }: { field: BriefingColumn; value: string; suggestions: string[]; onChange: (value: string) => void }) => {
  const isDate = field === 'DT_INICIO' || field === 'DT_FIM'; const id = `dynamic-${field}`;
  return <label className={`${LONG_FIELDS.has(field) ? 'md:col-span-2' : ''} text-xs font-semibold text-slate-600`}>{field}
    <div className="mt-1 flex gap-2">{COLOR_FIELDS.has(field) && <input aria-label={`${field} seletor de cor`} type="color" value={/^#[0-9a-f]{6}$/i.test(value) ? value : '#000000'} onChange={(e) => onChange(e.target.value)} className="h-10 w-10 rounded-lg border border-slate-200 bg-white p-1"/>}
    {LONG_FIELDS.has(field) ? <textarea id={id} value={value} onChange={(e) => onChange(e.target.value)} rows={4} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-cyan-400"/> : <><input id={id} list={`${id}-suggestions`} type={isDate ? 'datetime-local' : 'text'} value={isDate ? toDateInput(value) : value} onChange={(e) => onChange(e.target.value)} className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-cyan-400"/><datalist id={`${id}-suggestions`}>{!isDate && suggestions.slice(0, 20).map((suggestion) => <option key={suggestion} value={suggestion}/>)}</datalist></>}</div>
  </label>;
};
