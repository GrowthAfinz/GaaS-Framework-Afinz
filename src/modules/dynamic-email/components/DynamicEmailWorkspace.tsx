import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  Code2,
  Copy,
  Download,
  ExternalLink,
  ImageIcon,
  Inbox,
  Link2,
  Mail,
  Maximize2,
  Plus,
  Save,
  Search,
  Trash2,
  Upload,
  Wand2,
  X,
} from 'lucide-react';
import { renderDynamicEmail, type SubscriberSample } from '../ampscript/renderer';
import {
  applyFix,
  emptyBriefingRow,
  exportBriefingCsv,
  parseBriefingCsv,
  rowKey,
  toDateInput,
  validateRows,
  type BriefingColumn,
  type BriefingRow,
  type ValidationIssue,
} from '../domain/briefing';
import { DEFAULT_DYNAMIC_EMAIL_TEMPLATE } from '../fixtures/defaultTemplate';

const TEMPLATE_KEY = 'gaas-dynamic-email-template-v1';
const ROWS_KEY = 'gaas-dynamic-email-briefings-v1';
const SAMPLE: SubscriberSample = { CPF: '00000000000', PRI_NOME: 'VANIA', LIMITE: 'R$ 3.500', PRODUTO: 'INSTITUCIONAL', SEQUENCIA: 'E-mail 1', TP_CAMPANHA: 'Repescagem' };
const LONG_FIELDS = new Set<BriefingColumn>(['COPY_1_PRETO', 'COPY_2_PRETO', 'NOTA_LEGAL', 'RODAPE', 'PRE_CABECALHO']);
const COLOR_FIELDS = new Set<BriefingColumn>(['COR_COPY_1', 'COR_COPY_PRETO_1', 'COR_TITULO_COPY_2', 'COR_COPY_2', 'COR_NOTA_LEGAL']);

const FIELD_LABELS: Partial<Record<BriefingColumn, string>> = {
  DT_INICIO: 'Início da campanha',
  DT_FIM: 'Fim da campanha',
  UTM_CAMPANHA: 'Identificação UTM',
  TP_CAMPANHA: 'Tipo de campanha',
  SEQUENCIA: 'Sequência',
  NM_PRODUTO_INTERNO: 'Parceiro / produto interno',
  CARTAO_NM_COMERCIAL: 'Nome comercial do cartão',
  ASSUNTO: 'Assunto',
  PRE_CABECALHO: 'Texto de pré-visualização',
  TITULO_COPY_1_AZUL: 'Título principal',
  COR_COPY_1: 'Cor do título principal',
  TAMANHO_DA_FONTE_TITULO_COPY_1: 'Tamanho do título principal',
  COPY_1_PRETO: 'Texto principal',
  COR_COPY_PRETO_1: 'Cor do texto principal',
  TAMANHO_DA_FONTE_TITULO_COPY_PRETO_1: 'Tamanho do texto principal',
  TITULO_CTA_1: 'Texto do botão principal',
  LINK_CTA_1: 'Link do botão principal',
  TITULO_COPY_2: 'Título do segundo bloco',
  COR_TITULO_COPY_2: 'Cor do segundo título',
  TAMANHO_DA_FONTE_TITULO_COPY_2: 'Tamanho do segundo título',
  COPY_2_PRETO: 'Texto complementar',
  COR_COPY_2: 'Cor do texto complementar',
  TAMANHO_DA_FONTE_COPY_2: 'Tamanho do texto complementar',
  TITULO_CTA_2: 'Texto do segundo botão',
  LINK_CTA_2: 'Link do segundo botão',
  NOTA_LEGAL: 'Nota legal',
  COR_NOTA_LEGAL: 'Cor da nota legal',
  TAMANHO_DA_FONTE_NOTA_LEGAL: 'Tamanho da nota legal',
  RODAPE: 'Rodapé',
};

type ImageSlot = { label: string; description: string; image: BriefingColumn; link?: BriefingColumn };
const IMAGE_SLOTS: Record<'header' | 'banner1' | 'banner2' | 'banner3', ImageSlot> = {
  header: { label: 'Header do e-mail', description: 'Imagem principal exibida no topo', image: 'HEADER' },
  banner1: { label: 'Banner do bloco principal', description: 'Imagem exibida após o primeiro botão', image: 'BANNER_1_CORPO', link: 'LINK_BANNER_1_CORPO' },
  banner2: { label: 'Banner do segundo bloco', description: 'Imagem exibida após o segundo botão', image: 'BANNER_2_CORPO', link: 'LINK_BANNER_2_CORPO' },
  banner3: { label: 'Banner de encerramento', description: 'Última imagem antes das informações legais', image: 'BANNER_3_CORPO', link: 'LINK_BANNER_3_CORPO' },
};

type EditorSection = {
  id: string;
  label: string;
  description: string;
  fields?: BriefingColumn[];
  imageSlot?: ImageSlot;
};

const EDITOR_SECTIONS: EditorSection[] = [
  { id: 'identity', label: 'Campanha e vigência', description: 'Identificação usada no CSV e no lookup do SFMC.', fields: ['DT_INICIO', 'DT_FIM', 'UTM_CAMPANHA', 'TP_CAMPANHA', 'SEQUENCIA', 'NM_PRODUTO_INTERNO', 'CARTAO_NM_COMERCIAL'] },
  { id: 'message', label: 'Informações da mensagem', description: 'O que aparece na caixa de entrada antes da abertura.', fields: ['ASSUNTO', 'PRE_CABECALHO'] },
  { id: 'header', label: 'Cabeçalho visual', description: 'Primeiro elemento visível do e-mail.', imageSlot: IMAGE_SLOTS.header },
  { id: 'primary', label: 'Bloco principal', description: 'Título, conteúdo, ação principal e primeiro banner.', fields: ['TITULO_COPY_1_AZUL', 'COR_COPY_1', 'TAMANHO_DA_FONTE_TITULO_COPY_1', 'COPY_1_PRETO', 'COR_COPY_PRETO_1', 'TAMANHO_DA_FONTE_TITULO_COPY_PRETO_1', 'TITULO_CTA_1', 'LINK_CTA_1'], imageSlot: IMAGE_SLOTS.banner1 },
  { id: 'secondary', label: 'Segundo bloco', description: 'Conteúdo complementar, segunda ação e banner.', fields: ['TITULO_COPY_2', 'COR_TITULO_COPY_2', 'TAMANHO_DA_FONTE_TITULO_COPY_2', 'COPY_2_PRETO', 'COR_COPY_2', 'TAMANHO_DA_FONTE_COPY_2', 'TITULO_CTA_2', 'LINK_CTA_2'], imageSlot: IMAGE_SLOTS.banner2 },
  { id: 'closing', label: 'Encerramento visual', description: 'Último banner do conteúdo.', imageSlot: IMAGE_SLOTS.banner3 },
  { id: 'legal', label: 'Informações legais', description: 'Nota legal e rodapé exibidos no fim do e-mail.', fields: ['NOTA_LEGAL', 'COR_NOTA_LEGAL', 'TAMANHO_DA_FONTE_NOTA_LEGAL', 'RODAPE'] },
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
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
}

const initials = (value: string) => (value.trim().slice(0, 2) || '—').toUpperCase();
export const DynamicEmailWorkspace: React.FC = () => {
  const [rows, setRows] = useState<BriefingRow[]>(() => { try { return JSON.parse(localStorage.getItem(ROWS_KEY) ?? 'null') ?? demoRows(); } catch { return demoRows(); } });
  const [selectedId, setSelectedId] = useState(rows[0]?.__id ?? '');
  const [template, setTemplate] = useState(() => localStorage.getItem(TEMPLATE_KEY) ?? DEFAULT_DYNAMIC_EMAIL_TEMPLATE);
  const [savedTemplate, setSavedTemplate] = useState(template);
  const [mode, setMode] = useState<'briefings' | 'template'>('briefings');
  const [subscriber, setSubscriber] = useState<SubscriberSample>(SAMPLE);
  const [importMessages, setImportMessages] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ready' | 'needs-review'>('all');
  const [announcement, setAnnouncement] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { localStorage.setItem(ROWS_KEY, JSON.stringify(rows)); }, [rows]);
  const issuesByRow = useMemo(() => validateRows(rows), [rows]);
  const selected = rows.find((row) => row.__id === selectedId) ?? rows[0];
  const selectedIssues = selected ? issuesByRow.get(selected.__id) ?? [] : [];
  const render = useMemo(() => selected ? renderDynamicEmail(savedTemplate, selected, { ...subscriber, PRODUTO: selected.NM_PRODUTO_INTERNO, SEQUENCIA: selected.SEQUENCIA, TP_CAMPANHA: selected.TP_CAMPANHA }) : { html: '', diagnostics: [] }, [savedTemplate, selected, subscriber]);
  const allIssues = [...issuesByRow.values()].flat();
  const errorCount = allIssues.filter((issue) => issue.severity === 'error').length;
  const warningCount = allIssues.filter((issue) => issue.severity === 'warning').length;
  const filteredRows = useMemo(() => rows.filter((row) => {
    const issues = issuesByRow.get(row.__id) ?? [];
    const hasErrors = issues.some((issue) => issue.severity === 'error');
    if (statusFilter === 'ready' && hasErrors) return false;
    if (statusFilter === 'needs-review' && !hasErrors) return false;
    const haystack = [row.NM_PRODUTO_INTERNO, row.TP_CAMPANHA, row.SEQUENCIA, row.UTM_CAMPANHA, row.ASSUNTO].join(' ').toLowerCase();
    return haystack.includes(query.trim().toLowerCase());
  }), [issuesByRow, query, rows, statusFilter]);

  const updateSelected = (patch: Partial<BriefingRow>) => setRows((current) => current.map((row) => row.__id === selected?.__id ? { ...row, ...patch } : row));
  const fixIssue = (issue: ValidationIssue) => { if (selected) setRows((current) => current.map((row) => row.__id === selected.__id ? applyFix(row, issue) : row)); };
  const exportCsv = () => { if (!errorCount) downloadText(`TB_BRIEFING_CAMPANHA_AQUISICAO_${new Date().toISOString().slice(0, 10)}.csv`, exportBriefingCsv(rows)); };
  const onFile = async (file?: File) => {
    if (!file) return;
    const parsed = parseBriefingCsv(await file.text());
    setImportMessages(parsed.errors);
    if (parsed.rows.length) {
      setRows(parsed.rows);
      setSelectedId(parsed.rows[0].__id);
      setAnnouncement(`${parsed.rows.length} briefings importados.`);
    }
  };
  const createBriefing = () => {
    const row = emptyBriefingRow();
    setRows((current) => [...current, row]);
    setSelectedId(row.__id);
    setAnnouncement('Novo e-mail criado. Preencha a campanha e a sequência.');
  };
  const duplicateBriefing = () => {
    if (!selected) return;
    const copy: BriefingRow = { ...selected, __id: crypto.randomUUID(), __journeyConfirmed: false };
    setRows((current) => [...current, copy]);
    setSelectedId(copy.__id);
    setAnnouncement('E-mail duplicado. Revise a sequência e a vigência antes de exportar.');
    requestAnimationFrame(() => document.getElementById('dynamic-SEQUENCIA')?.focus());
  };
  const deleteBriefing = () => {
    if (!selected) return;
    const nextRows = rows.filter((row) => row.__id !== selected.__id);
    setRows(nextRows);
    setSelectedId(nextRows[0]?.__id ?? '');
    setDeleteOpen(false);
    setAnnouncement('E-mail excluído da caixa de briefings.');
  };
  const saveTemplate = () => {
    localStorage.setItem(TEMPLATE_KEY, template);
    setSavedTemplate(template);
    setAnnouncement('Template do SFMC salvo e aplicado à prévia.');
  };

  return <div className="min-h-full bg-slate-50 p-4 lg:p-5">
    <div aria-live="polite" className="sr-only">{announcement}</div>
    <header className="rounded-2xl bg-[#07595b] px-5 py-4 text-white shadow-sm lg:px-6" aria-label="E-mail Dinâmico">
      <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4">
        <div className="min-w-[220px]">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-100"><Mail size={13}/> Comunicação</div>
          <h1 className="mt-1 text-xl font-bold">E-mail Dinâmico</h1>
          <p className="mt-0.5 text-xs text-cyan-50/80">Crie, revise e prepare briefings para envio pelo SFMC.</p>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2" aria-label="Resumo dos briefings">
          <HeaderMetric icon={<Inbox size={16}/>} value={rows.length} label={rows.length === 1 ? 'briefing' : 'briefings'}/>
          <HeaderMetric icon={errorCount ? <CircleAlert size={16}/> : <CheckCircle2 size={16}/>} value={errorCount} label={errorCount === 1 ? 'ajuste necessário' : 'ajustes necessários'} tone={errorCount ? 'danger' : 'success'}/>
          <HeaderMetric icon={<AlertTriangle size={16}/>} value={warningCount} label={warningCount === 1 ? 'revisão sugerida' : 'revisões sugeridas'} tone="warning"/>
        </div>
        <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
          <div className="flex items-center rounded-xl bg-white/10 p-1" role="tablist" aria-label="Área do E-mail Dinâmico">
            <button role="tab" aria-selected={mode === 'briefings'} onClick={() => setMode('briefings')} className={`rounded-lg px-3 py-2 text-xs font-bold transition ${mode === 'briefings' ? 'bg-white text-slate-900 shadow-sm' : 'text-cyan-50 hover:bg-white/10'}`}>Campanhas</button>
            <button role="tab" aria-selected={mode === 'template'} onClick={() => setMode('template')} className={`rounded-lg px-3 py-2 text-xs font-bold transition ${mode === 'template' ? 'bg-white text-slate-900 shadow-sm' : 'text-cyan-50 hover:bg-white/10'}`}><Code2 className="mr-1.5 inline" size={14}/>Template-fonte</button>
          </div>
          {mode === 'briefings' && <>
            <input ref={fileRef} type="file" accept=".csv,text/csv" hidden onChange={(event) => onFile(event.target.files?.[0])}/>
            <HeaderAction onClick={() => fileRef.current?.click()} icon={<Upload size={15}/>} label="Importar CSV"/>
            <HeaderAction onClick={duplicateBriefing} disabled={!selected} icon={<Copy size={15}/>} label="Duplicar"/>
            <HeaderAction onClick={createBriefing} icon={<Plus size={15}/>} label="Novo"/>
            <HeaderAction onClick={() => setDeleteOpen(true)} disabled={!selected} icon={<Trash2 size={15}/>} label="Excluir" danger/>
            <HeaderAction onClick={() => setPreviewOpen(true)} disabled={!selected} icon={<Maximize2 size={15}/>} label="Visualizar e-mail" primary/>
            <button disabled={!!errorCount || !rows.length} onClick={exportCsv} className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-cyan-400 px-3 py-2 text-xs font-bold text-slate-950 outline-none transition hover:bg-cyan-300 focus-visible:ring-2 focus-visible:ring-white disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-white/50"><Download size={15}/>Exportar CSV</button>
          </>}
        </div>
      </div>
    </header>

    {mode === 'template' ? <main className="pt-4"><div className="mx-auto max-w-6xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-5"><div><h2 className="font-bold text-slate-900">Código do Content Builder</h2><p className="text-sm text-slate-500">Cole o HTML com AMPscript. O conteúdo fica salvo somente neste navegador.</p></div><button onClick={saveTemplate} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-bold text-white outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2"><Save size={16}/>Salvar e aplicar</button></div><textarea aria-label="Código do template do SFMC" value={template} onChange={(event) => setTemplate(event.target.value)} spellCheck={false} className="h-[68vh] w-full resize-none bg-slate-950 p-5 font-mono text-xs leading-5 text-slate-100 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-400"/></div></main> :
    <main className="pt-4">
      {importMessages.length > 0 && <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900" role="status">{importMessages.map((message) => <div key={message}>{message}</div>)}</div>}

      <div className="mx-auto grid min-h-[720px] max-w-[1380px] gap-4 xl:grid-cols-[minmax(390px,460px)_minmax(0,900px)]">
        <aside className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" aria-label="Caixa de briefings">
          <div className="border-b border-slate-200 p-3.5">
            <div className="flex items-center justify-between gap-2"><div><h2 className="font-bold text-slate-900">Caixa de briefings</h2><p className="text-xs text-slate-500">{filteredRows.length} de {rows.length} e-mails</p></div><Inbox className="text-cyan-700" size={18}/></div>
            <label className="mt-3 flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-slate-500 focus-within:border-cyan-400 focus-within:bg-white">
              <Search size={15}/><span className="sr-only">Buscar briefings</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar parceiro, campanha..." className="min-w-0 flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"/>
            </label>
            <div className="mt-2 flex gap-1" aria-label="Filtrar briefings por status">
              {([['all', 'Todos'], ['ready', 'Prontos'], ['needs-review', 'Com ajustes']] as const).map(([value, label]) => <button key={value} onClick={() => setStatusFilter(value)} className={`min-h-8 rounded-md px-2.5 text-xs font-semibold outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ${statusFilter === value ? 'bg-cyan-100 text-cyan-800' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'}`}>{label}</button>)}
            </div>
          </div>
          <div className="max-h-[790px] overflow-y-auto p-2.5">
            {filteredRows.length ? filteredRows.map((row) => {
              const issues = issuesByRow.get(row.__id) ?? [];
              const errors = issues.filter((issue) => issue.severity === 'error').length;
              const isSelected = selected?.__id === row.__id;
              return <button key={row.__id} onClick={() => setSelectedId(row.__id)} className={`mb-2 w-full rounded-xl border p-3 text-left outline-none transition focus-visible:ring-2 focus-visible:ring-cyan-500 ${isSelected ? 'border-cyan-300 bg-cyan-50 shadow-sm' : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50'}`}>
                <div className="flex items-start gap-3">
                  <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-extrabold ${isSelected ? 'bg-cyan-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{initials(row.NM_PRODUTO_INTERNO)}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2"><span className="truncate text-sm font-bold text-slate-900">{row.NM_PRODUTO_INTERNO || 'Produto não informado'}</span>{errors ? <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">{errors} {errors === 1 ? 'ajuste' : 'ajustes'}</span> : <span className="inline-flex shrink-0 items-center gap-1 text-[10px] font-bold text-emerald-700"><CheckCircle2 size={13}/>Pronto</span>}</div>
                    <div className="mt-1 truncate text-xs font-medium text-slate-600">{row.TP_CAMPANHA || 'Campanha não informada'} · {row.SEQUENCIA || 'Sequência pendente'}</div>
                    <div className="mt-2 line-clamp-2 text-sm font-semibold leading-5 text-slate-800">{row.ASSUNTO || 'Assunto não preenchido'}</div>
                    <div className="mt-1 line-clamp-2 text-xs leading-4 text-slate-500">{row.PRE_CABECALHO || row.UTM_CAMPANHA || 'Sem texto de pré-visualização'}</div>
                  </div>
                </div>
              </button>;
            }) : <div className="px-4 py-10 text-center text-sm text-slate-500"><Search className="mx-auto mb-2 text-slate-300" size={24}/><p className="font-semibold text-slate-700">Nenhum briefing encontrado</p><p className="mt-1 text-xs">Ajuste a busca ou o filtro de status.</p></div>}
          </div>
        </aside>

        {selected ? <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" aria-label="Editor do briefing selecionado">
          <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-4 py-3.5 backdrop-blur">
            <div className="flex flex-wrap items-start justify-between gap-2"><div><h2 className="font-bold text-slate-900">{rowKey(selected).replaceAll(' / ', ' · ')}</h2><p className="mt-0.5 text-xs text-slate-500">Suas alterações ficam salvas neste navegador.</p></div><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${selectedIssues.some((issue) => issue.severity === 'error') ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>{selectedIssues.filter((issue) => issue.severity === 'error').length ? `${selectedIssues.filter((issue) => issue.severity === 'error').length} ajustes necessários` : 'Pronto para exportar'}</span></div>
          </div>
          <div className="max-h-[790px] overflow-y-auto p-3.5">
            {selectedIssues.length > 0 && <div className="mb-3 space-y-2">{selectedIssues.map((issue, index) => <div key={`${issue.code}-${issue.field}-${index}`} className={`flex items-start justify-between gap-3 rounded-lg border px-3 py-2 text-xs ${issue.severity === 'error' ? 'border-red-200 bg-red-50 text-red-900' : 'border-amber-200 bg-amber-50 text-amber-900'}`}><span>{issue.message}</span>{issue.fix && <button onClick={() => fixIssue(issue)} className="shrink-0 rounded-md bg-white px-2 py-1 font-bold shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"><Wand2 className="mr-1 inline" size={12}/>Corrigir</button>}</div>)}</div>}

            <label className="mb-3 flex min-h-11 items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700"><input type="checkbox" checked={!!selected.__journeyConfirmed} onChange={(event) => updateSelected({ __journeyConfirmed: event.target.checked })} className="mt-0.5 h-4 w-4 accent-cyan-600"/><span><b>Jornada conferida no SFMC</b><br/><span className="text-xs text-slate-500">Confirma que esta campanha e sequência estão habilitadas para entrada.</span></span></label>

            <div className="space-y-2.5">
              {EDITOR_SECTIONS.map((section) => {
                return <details key={section.id} open className="group overflow-hidden rounded-xl border border-slate-200 bg-white">
                  <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-3.5 py-2.5 outline-none hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-500 [&::-webkit-details-marker]:hidden">
                    <div className="min-w-0"><div className="font-bold text-slate-800">{section.label}</div><div className="truncate text-xs text-slate-500">{section.description}</div></div>
                    <ChevronDown className="shrink-0 text-slate-400 transition-transform group-open:rotate-180" size={16}/>
                  </summary>
                  <div className="border-t border-slate-100 px-3.5 py-3">
                    {section.fields && <div className="grid gap-3 md:grid-cols-2">{section.fields.map((field) => <Field key={field} field={field} value={selected[field]} suggestions={[...new Set(rows.map((row) => row[field]).filter(Boolean))]} onChange={(value) => updateSelected({ [field]: value })}/>)}</div>}
                    {section.imageSlot && <div className={section.fields ? 'mt-3' : ''}><ImageUrlCard slot={section.imageSlot} imageUrl={selected[section.imageSlot.image]} destinationUrl={section.imageSlot.link ? selected[section.imageSlot.link] : undefined} onImageUrl={(value) => updateSelected({ [section.imageSlot!.image]: value })} onDestinationUrl={section.imageSlot.link ? (value) => updateSelected({ [section.imageSlot!.link!]: value }) : undefined}/></div>}
                  </div>
                </details>;
              })}
            </div>
          </div>
        </section> : <div/>}

      </div>
    </main>}

    {previewOpen && selected && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="email-preview-title" onMouseDown={(event) => { if (event.target === event.currentTarget) setPreviewOpen(false); }}>
      <section className="flex max-h-[94vh] w-full max-w-[1320px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl" aria-label="Prévia ampliada do e-mail">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 px-5 py-4"><div><div className="flex items-center gap-2"><h2 id="email-preview-title" className="text-lg font-bold text-slate-900">Visualização do e-mail</h2><span className="rounded-full bg-cyan-50 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-cyan-700">Simulação local</span></div><p className="mt-0.5 text-xs text-slate-500">Revise conteúdo e personalização. A certificação final acontece no Test Send do SFMC.</p></div><button autoFocus onClick={() => setPreviewOpen(false)} className="rounded-lg p-2 text-slate-500 outline-none hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-cyan-500" aria-label="Fechar visualização"><X size={19}/></button></div>
        <div className="grid gap-3 border-b border-slate-200 bg-slate-50 px-5 py-3 md:grid-cols-[1fr_180px_180px]"><div className="flex items-start gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-900 text-white"><Mail size={16}/></span><div className="min-w-0"><div className="font-bold text-slate-900">{selected.ASSUNTO || 'Assunto não preenchido'}</div><div className="text-xs text-slate-500">{selected.PRE_CABECALHO || 'Sem texto de pré-visualização'}</div><div className="mt-1 text-[11px] text-slate-500">{selected.NM_PRODUTO_INTERNO || 'Produto'} · {selected.TP_CAMPANHA || 'Campanha'} · {selected.SEQUENCIA || 'Sequência'} · Remetente definido no SFMC</div></div></div><MiniInput label="Nome de teste" value={subscriber.PRI_NOME} onChange={(value) => setSubscriber((current) => ({ ...current, PRI_NOME: value }))}/><MiniInput label="Limite de teste" value={subscriber.LIMITE} onChange={(value) => setSubscriber((current) => ({ ...current, LIMITE: value }))}/></div>
        <div className="min-h-0 flex-1 overflow-auto bg-slate-100">{render.diagnostics.length > 0 ? <div className="m-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">{render.diagnostics.map((diagnostic) => <div key={diagnostic}>{diagnostic}</div>)}</div> : <iframe title="Conteúdo renderizado do e-mail dinâmico" sandbox="" srcDoc={render.html} className="h-[72vh] w-full bg-slate-100"/>}</div>
      </section>
    </div>}

    {deleteOpen && selected && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4" role="dialog" aria-modal="true" aria-labelledby="delete-email-title" onMouseDown={(event) => { if (event.target === event.currentTarget) setDeleteOpen(false); }}><div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl"><div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-red-50 text-red-600"><Trash2 size={18}/></span><div><h2 id="delete-email-title" className="font-bold text-slate-900">Excluir este e-mail?</h2><p className="mt-1 text-sm leading-5 text-slate-600"><b>{selected.NM_PRODUTO_INTERNO || 'Produto não informado'} · {selected.SEQUENCIA || 'Sequência pendente'}</b> será removido da caixa de briefings e não aparecerá no próximo CSV exportado.</p></div></div><div className="mt-5 flex justify-end gap-2"><button autoFocus onClick={() => setDeleteOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 outline-none hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-cyan-500">Cancelar</button><button onClick={deleteBriefing} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white outline-none hover:bg-red-700 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2">Excluir e-mail</button></div></div></div>}
  </div>;
};

const HeaderMetric = ({ label, value, icon, tone = 'default' }: { label: string; value: number; icon: React.ReactNode; tone?: 'default' | 'success' | 'danger' | 'warning' }) => {
  const colors = { default: 'text-cyan-50', success: 'text-emerald-200', danger: 'text-red-200', warning: 'text-amber-200' };
  return <div className={`inline-flex items-center gap-2 ${colors[tone]}`}>{icon}<span className="text-lg font-extrabold text-white">{value}</span><span className="max-w-24 text-[11px] font-semibold leading-3">{label}</span></div>;
};

const HeaderAction = ({ label, icon, onClick, disabled, primary, danger }: { label: string; icon: React.ReactNode; onClick: () => void; disabled?: boolean; primary?: boolean; danger?: boolean }) => <button onClick={onClick} disabled={disabled} title={label} className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-bold outline-none transition focus-visible:ring-2 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-40 ${primary ? 'bg-white text-[#07595b] hover:bg-cyan-50' : danger ? 'border border-red-200/30 bg-red-500/15 text-red-100 hover:bg-red-500/25' : 'border border-white/20 bg-white/10 text-white hover:bg-white/20'}`}>{icon}<span className="hidden 2xl:inline">{label}</span><span className="sr-only 2xl:hidden">{label}</span></button>;

const MiniInput = ({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) => <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}<input value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-2.5 text-xs font-normal normal-case tracking-normal text-slate-700 outline-none focus:border-cyan-400 focus-visible:ring-2 focus-visible:ring-cyan-100"/></label>;

const isPublicImageUrl = (value: string) => { try { return new URL(value).protocol === 'https:'; } catch { return false; } };

const ImageUrlCard = ({ slot, imageUrl, destinationUrl, onImageUrl, onDestinationUrl }: { slot: ImageSlot; imageUrl: string; destinationUrl?: string; onImageUrl: (value: string) => void; onDestinationUrl?: (value: string) => void }) => {
  const [loadState, setLoadState] = useState<'idle' | 'loading' | 'loaded' | 'error'>(imageUrl ? 'loading' : 'idle');
  const [dimensions, setDimensions] = useState('');
  useEffect(() => { setLoadState(imageUrl ? 'loading' : 'idle'); setDimensions(''); }, [imageUrl]);
  const validUrl = !imageUrl || isPublicImageUrl(imageUrl);
  return <div className={`overflow-hidden rounded-xl border bg-white ${!validUrl || loadState === 'error' ? 'border-red-200' : loadState === 'loaded' ? 'border-emerald-200' : 'border-slate-200'}`}>
    <div className="flex items-start justify-between gap-3 px-3 py-2.5"><div><div className="flex items-center gap-2 text-sm font-bold text-slate-800"><ImageIcon size={15} className="text-cyan-600"/>{slot.label}{loadState === 'loaded' && <CheckCircle2 size={14} className="text-emerald-500"/>}</div><div className="mt-0.5 text-[11px] text-slate-500">{slot.description}{dimensions && ` · ${dimensions}`}</div></div>{imageUrl && <button type="button" onClick={() => onImageUrl('')} className="rounded-lg p-2 text-slate-400 outline-none hover:bg-red-50 hover:text-red-600 focus-visible:ring-2 focus-visible:ring-red-400" aria-label={`Remover ${slot.label}`}><Trash2 size={14}/></button>}</div>
    <div className="grid gap-3 border-t border-slate-100 p-3 md:grid-cols-[minmax(0,1fr)_minmax(180px,0.7fr)]">
      <div className="space-y-2"><label className="block text-[10px] font-bold uppercase tracking-wide text-slate-500">URL pública da imagem<div className="mt-1 flex items-center gap-2"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-400"><Link2 size={14}/></span><input type="url" value={imageUrl} onChange={(event) => onImageUrl(event.target.value.trim())} placeholder="https://.../imagem.jpg" className={`min-w-0 flex-1 rounded-lg border px-3 py-2 text-xs font-normal normal-case tracking-normal outline-none focus-visible:ring-2 ${validUrl ? 'border-slate-200 focus:border-cyan-400 focus-visible:ring-cyan-100' : 'border-red-300 bg-red-50 focus-visible:ring-red-100'}`}/>{imageUrl && validUrl && <a href={imageUrl} target="_blank" rel="noreferrer" className="rounded-lg border border-slate-200 p-2 text-slate-500 outline-none hover:border-cyan-300 hover:text-cyan-700 focus-visible:ring-2 focus-visible:ring-cyan-500" aria-label={`Abrir ${slot.label}`}><ExternalLink size={14}/></a>}</div></label>
        {onDestinationUrl && <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-500">Link ao clicar na imagem<input type="url" value={destinationUrl ?? ''} onChange={(event) => onDestinationUrl(event.target.value.trim())} placeholder="https://destino-da-campanha..." className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-normal normal-case tracking-normal outline-none focus:border-cyan-400 focus-visible:ring-2 focus-visible:ring-cyan-100"/></label>}
      </div>
      {imageUrl && validUrl ? <div className="flex min-h-24 items-center justify-center overflow-hidden rounded-lg bg-slate-100 p-2">{loadState === 'error' ? <div className="px-3 py-5 text-center text-xs text-red-700"><AlertTriangle className="mx-auto mb-2" size={19}/>Não foi possível carregar. Confirme se a URL é pública.</div> : <img src={imageUrl} alt={`Prévia de ${slot.label}`} onLoad={(event) => { setLoadState('loaded'); setDimensions(`${event.currentTarget.naturalWidth} × ${event.currentTarget.naturalHeight}px`); }} onError={() => setLoadState('error')} className="max-h-32 max-w-full object-contain"/>}</div> : <div className="flex min-h-24 items-center justify-center rounded-lg bg-slate-50 px-3 text-center text-xs text-slate-400"><div><ImageIcon className="mx-auto mb-2 text-slate-300" size={22}/>{imageUrl ? 'Use uma URL pública HTTPS' : 'A prévia aparecerá aqui'}</div></div>}
    </div>
  </div>;
};

const Field = ({ field, value, suggestions, onChange }: { field: BriefingColumn; value: string; suggestions: string[]; onChange: (value: string) => void }) => {
  const isDate = field === 'DT_INICIO' || field === 'DT_FIM';
  const id = `dynamic-${field}`;
  const label = FIELD_LABELS[field] ?? field;
  return <label htmlFor={id} className={`${LONG_FIELDS.has(field) ? 'md:col-span-2' : ''} text-xs font-semibold text-slate-700`}><span>{label}</span><span className="ml-1 font-normal text-slate-400" title={`Campo do CSV: ${field}`}>· {field}</span>
    <div className="mt-1 flex gap-2">{COLOR_FIELDS.has(field) && <input aria-label={`Selecionar ${label.toLowerCase()}`} type="color" value={/^#[0-9a-f]{6}$/i.test(value) ? value : '#000000'} onChange={(event) => onChange(event.target.value)} className="h-10 w-10 rounded-lg border border-slate-200 bg-white p-1 outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"/>}
    {LONG_FIELDS.has(field) ? <textarea id={id} value={value} onChange={(event) => onChange(event.target.value)} rows={field === 'PRE_CABECALHO' ? 2 : 3} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm leading-5 text-slate-800 outline-none focus:border-cyan-400 focus-visible:ring-2 focus-visible:ring-cyan-100"/> : <><input id={id} list={`${id}-suggestions`} type={isDate ? 'datetime-local' : 'text'} value={isDate ? toDateInput(value) : value} onChange={(event) => onChange(event.target.value)} className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-cyan-400 focus-visible:ring-2 focus-visible:ring-cyan-100"/><datalist id={`${id}-suggestions`}>{!isDate && suggestions.slice(0, 20).map((suggestion) => <option key={suggestion} value={suggestion}/>)}</datalist></>}</div>
  </label>;
};
