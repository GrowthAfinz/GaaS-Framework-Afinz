import React, { useEffect, useMemo, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { Group, Panel, Separator, useDefaultLayout } from 'react-resizable-panels';
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
  Images,
  Inbox,
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
import { applyWorkspaceField, ensurePlurixVariants, normalizeLegacyRows, partnerLabel, PLURIX_SIGNATURES, withMeta, type ActivityTaxonomy, type EmailAsset, type LegalText, type WorkspaceBriefing } from '../domain/workspace';
import { loadActivityTaxonomy, loadAssets, loadBriefings, loadLegalTexts, onlyCsvRows, recordExport, saveAsset, saveBriefing } from '../services/workspaceService';

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
  const visa = emptyBriefingRow('00000000-0000-4000-8000-000000000001');
  Object.assign(visa, { DT_INICIO: '2026-06-01T00:00', DT_FIM: '2026-12-31T23:59', UTM_CAMPANHA: 'repescagem_visa', TP_CAMPANHA: 'Repescagem', SEQUENCIA: 'E-mail 1', ASSUNTO: 'Seu cartão Afinz Visa com limite pré-aprovado!', PRE_CABECALHO: 'Peça já o seu! Limite disponível para usar na hora', CARTAO_NM_COMERCIAL: 'Afinz Visa', NM_PRODUTO_INTERNO: 'INSTITUCIONAL', TITULO_COPY_1_AZUL: 'Sua aprovação chegou!', COR_COPY_1: '#00C6CC', TAMANHO_DA_FONTE_TITULO_COPY_1: '24', COPY_1_PRETO: 'Olá, %%=v(@FirstName)=%%!<br><br>Sua solicitação de cartão <b>%%=v(@CartaoNmComercial)=%%</b> foi reavaliada e aprovada: limite de %%=v(@LimiteNovo)=%% já disponível.', COR_COPY_PRETO_1: '#222222', TAMANHO_DA_FONTE_TITULO_COPY_PRETO_1: '16', TITULO_CTA_1: 'PEÇA JÁ O SEU CARTÃO', LINK_CTA_1: 'https://cartao-afinz.onelink.me/I1Ur/zr4jy3g1' });
  const plurix = emptyBriefingRow('00000000-0000-4000-8000-000000000002');
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
  const [rows, setRows] = useState<WorkspaceBriefing[]>(() => { try { return normalizeLegacyRows(JSON.parse(localStorage.getItem(ROWS_KEY) ?? 'null') ?? demoRows()); } catch { return normalizeLegacyRows(demoRows()); } });
  const [selectedId, setSelectedId] = useState(rows[0]?.__id ?? '');
  const [template, setTemplate] = useState(() => localStorage.getItem(TEMPLATE_KEY) ?? DEFAULT_DYNAMIC_EMAIL_TEMPLATE);
  const [savedTemplate, setSavedTemplate] = useState(template);
  const [mode, setMode] = useState<'briefings' | 'library' | 'template'>('briefings');
  const [assets, setAssets] = useState<EmailAsset[]>([]);
  const [legalTexts, setLegalTexts] = useState<LegalText[]>([]);
  const [taxonomy, setTaxonomy] = useState<ActivityTaxonomy[]>([]);
  const [saveOpen, setSaveOpen] = useState(false);
  const [syncState, setSyncState] = useState('Carregando dados compartilhados…');
  const [subscriber, setSubscriber] = useState<SubscriberSample>(SAMPLE);
  const [importMessages, setImportMessages] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ready' | 'needs-review'>('all');
  const [announcement, setAnnouncement] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [downloadingPreview, setDownloadingPreview] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const previewFrameRef = useRef<HTMLIFrameElement>(null);
  const { defaultLayout, onLayoutChanged } = useDefaultLayout({ id: 'gaas-email-editor-preview-v1', storage: localStorage });

  useEffect(() => { localStorage.setItem(ROWS_KEY, JSON.stringify(rows)); }, [rows]);
  useEffect(() => { Promise.allSettled([loadBriefings(), loadAssets(), loadLegalTexts(), loadActivityTaxonomy()]).then(([briefings, assetRows, legalRows, activities]) => {
    if (briefings.status === 'fulfilled') { setRows(briefings.value); setSelectedId(briefings.value[0]?.__id ?? ''); }
    if (assetRows.status === 'fulfilled') setAssets(assetRows.value);
    if (legalRows.status === 'fulfilled') setLegalTexts(legalRows.value);
    if (activities.status === 'fulfilled') setTaxonomy(activities.value);
    setSyncState(briefings.status === 'fulfilled' ? 'Sincronizado com o GaaS' : 'Rascunho local — não sincronizado');
  }); }, []);
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
  const taxonomyOptions = useMemo(() => {
    if (!selected) return { partners: [], segments: [], subgroups: [], weeks: [], activityNames: [] };
    const withCurrent = (values: string[], current: string) => [...new Set([...values.filter(Boolean), current].filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
    const partnerRows = taxonomy.filter((item) => !selected.__meta.partner || item.partner === selected.__meta.partner);
    const segmentRows = partnerRows.filter((item) => !selected.__meta.segment || item.segment === selected.__meta.segment);
    const subgroupRows = segmentRows.filter((item) => !selected.__meta.subgroup || item.subgroup === selected.__meta.subgroup);
    const weekRows = subgroupRows.filter((item) => !selected.__meta.weekKey || item.weekKey === selected.__meta.weekKey);
    return {
      partners: withCurrent(taxonomy.map((item) => item.partner), selected.__meta.partner),
      segments: withCurrent(partnerRows.map((item) => item.segment), selected.__meta.segment),
      subgroups: withCurrent(segmentRows.map((item) => item.subgroup), selected.__meta.subgroup),
      weeks: withCurrent(subgroupRows.map((item) => item.weekKey), selected.__meta.weekKey),
      activityNames: withCurrent(weekRows.map((item) => item.activityName), selected.__meta.activityNames[0] ?? ''),
    };
  }, [selected, taxonomy]);

  const updateSelected = (patch: Partial<WorkspaceBriefing>) => setRows((current) => current.map((row) => row.__id === selected?.__id ? { ...row, ...patch } : row));
  const updateField = (field: BriefingColumn, value: string) => selected && setRows((current) => applyWorkspaceField(current, selected.__id, field, value));
  const fixIssue = (issue: ValidationIssue) => { if (selected) setRows((current) => current.map((row) => row.__id === selected.__id ? { ...applyFix(row, issue), __meta: row.__meta } : row)); };
  const exportCsv = () => { if (!errorCount) { const filename = `TB_BRIEFING_CAMPANHA_AQUISICAO_${new Date().toISOString().slice(0, 10)}.csv`; downloadText(filename, exportBriefingCsv(onlyCsvRows(rows))); void recordExport(filename, rows, []); } };
  const onFile = async (file?: File) => {
    if (!file) return;
    const parsed = parseBriefingCsv(await file.text());
    setImportMessages(parsed.errors);
    if (parsed.rows.length) {
      setRows(normalizeLegacyRows(parsed.rows));
      setSelectedId(parsed.rows[0].__id);
      setAnnouncement(`${parsed.rows.length} briefings importados.`);
    }
  };
  const createBriefing = () => {
    const row = withMeta(emptyBriefingRow());
    setRows((current) => [...current, row]);
    setSelectedId(row.__id);
    setAnnouncement('Novo e-mail criado. Preencha a campanha e a sequência.');
  };
  const duplicateBriefing = () => {
    if (!selected) return;
    const copy: WorkspaceBriefing = { ...selected, __id: crypto.randomUUID(), __journeyConfirmed: false, __meta: { ...selected.__meta, campaignGroupId: crypto.randomUUID(), status: 'draft', version: 1 } };
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
  const saveCurrent = async (ready: boolean) => {
    if (!selected) return;
    const group = rows.filter((row) => row.__meta.campaignGroupId === selected.__meta.campaignGroupId).map((row) => ({ ...row, __meta: { ...row.__meta, status: ready ? 'ready' as const : 'draft' as const, version: row.__meta.savedAt ? row.__meta.version + 1 : row.__meta.version } }));
    try { const saved = await Promise.all(group.map((row) => saveBriefing(row, (issuesByRow.get(row.__id) ?? []).map((issue) => issue.message)))); setRows((current) => current.map((row) => saved.find((item) => item.__id === row.__id) ?? row)); setSyncState('Sincronizado com o GaaS'); setAnnouncement('Briefing e histórico de versão salvos.'); setSaveOpen(false); }
    catch (error) { setSyncState('Rascunho local — falha ao sincronizar'); setAnnouncement(error instanceof Error ? error.message : 'Falha ao salvar.'); }
  };
  const downloadPreview = async () => {
    const frame = previewFrameRef.current;
    const documentBody = frame?.contentDocument?.body;
    if (!selected || !documentBody) { setAnnouncement('A prévia ainda não está pronta para baixar.'); return; }
    setDownloadingPreview(true);
    try {
      await frame.contentDocument?.fonts?.ready;
      await Promise.all([...documentBody.querySelectorAll('img')].map((image) => image.complete ? Promise.resolve() : new Promise<void>((resolve) => { image.addEventListener('load', () => resolve(), { once: true }); image.addEventListener('error', () => resolve(), { once: true }); })));
      const canvas = await html2canvas(documentBody, { backgroundColor: '#ffffff', scale: 2, useCORS: true, allowTaint: false, logging: false, width: documentBody.scrollWidth, height: documentBody.scrollHeight, windowWidth: documentBody.scrollWidth, windowHeight: documentBody.scrollHeight });
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((result) => result ? resolve(result) : reject(new Error('Falha ao gerar o JPEG.')), 'image/jpeg', 0.92));
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${rowKey(selected).replaceAll(' / ', '-').replace(/[^a-z0-9-_]+/gi, '-')}-preview.jpg`;
      anchor.click();
      URL.revokeObjectURL(url);
      setAnnouncement('Prévia renderizada e baixada em JPEG.');
    } catch (error) {
      setAnnouncement(error instanceof Error ? `Não foi possível gerar o JPEG: ${error.message}` : 'Não foi possível gerar o JPEG.');
    } finally { setDownloadingPreview(false); }
  };

  return <div className="min-h-full bg-slate-50 p-4 lg:p-5">
    <div aria-live="polite" className="sr-only">{announcement}</div>
    <header className="rounded-2xl bg-[#07595b] px-5 py-4 text-white shadow-sm lg:px-6" aria-label="Fábrica de E-mails">
      <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4">
        <div className="min-w-[220px]">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-100"><Mail size={13}/> Comunicação</div>
          <h1 className="mt-1 text-xl font-bold">Fábrica de E-mails</h1>
          <p className="mt-0.5 text-xs text-cyan-50/80">Crie, revise e prepare briefings para envio pelo SFMC.</p>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2" aria-label="Resumo dos briefings">
          <HeaderMetric icon={<Inbox size={16}/>} value={rows.length} label={rows.length === 1 ? 'briefing' : 'briefings'}/>
          <HeaderMetric icon={errorCount ? <CircleAlert size={16}/> : <CheckCircle2 size={16}/>} value={errorCount} label={errorCount === 1 ? 'ajuste necessário' : 'ajustes necessários'} tone={errorCount ? 'danger' : 'success'}/>
          <HeaderMetric icon={<AlertTriangle size={16}/>} value={warningCount} label={warningCount === 1 ? 'revisão sugerida' : 'revisões sugeridas'} tone="warning"/>
        </div>
        <div className="ml-auto flex flex-col items-end gap-2">
          <div className="flex items-center rounded-xl bg-white/10 p-1" role="tablist" aria-label="Área da Fábrica de E-mails">
            <button role="tab" aria-selected={mode === 'briefings'} onClick={() => setMode('briefings')} className={`rounded-lg px-3 py-2 text-xs font-bold transition ${mode === 'briefings' ? 'bg-white text-slate-900 shadow-sm' : 'text-cyan-50 hover:bg-white/10'}`}>E-mails</button>
            <button role="tab" aria-selected={mode === 'library'} onClick={() => setMode('library')} className={`rounded-lg px-3 py-2 text-xs font-bold transition ${mode === 'library' ? 'bg-white text-slate-900 shadow-sm' : 'text-cyan-50 hover:bg-white/10'}`}><Images className="mr-1.5 inline" size={14}/>Biblioteca de ativos</button>
            <button role="tab" aria-selected={mode === 'template'} onClick={() => setMode('template')} className={`rounded-lg px-3 py-2 text-xs font-bold transition ${mode === 'template' ? 'bg-white text-slate-900 shadow-sm' : 'text-cyan-50 hover:bg-white/10'}`}><Code2 className="mr-1.5 inline" size={14}/>Template-fonte</button>
          </div>
          {mode === 'briefings' && <div className="flex flex-wrap items-center justify-end gap-2">
            <input ref={fileRef} type="file" accept=".csv,text/csv" hidden onChange={(event) => onFile(event.target.files?.[0])}/>
            <HeaderAction onClick={() => fileRef.current?.click()} icon={<Upload size={15}/>} label="Importar CSV"/>
            <HeaderAction onClick={duplicateBriefing} disabled={!selected} icon={<Copy size={15}/>} label="Duplicar"/>
            <HeaderAction onClick={createBriefing} icon={<Plus size={15}/>} label="Novo"/>
            <HeaderAction onClick={() => setDeleteOpen(true)} disabled={!selected} icon={<Trash2 size={15}/>} label="Excluir" danger/>
            <button disabled={!!errorCount || !rows.length} onClick={exportCsv} className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-cyan-400 px-3 py-2 text-xs font-bold text-slate-950 outline-none transition hover:bg-cyan-300 focus-visible:ring-2 focus-visible:ring-white disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-white/50"><Download size={15}/>Exportar CSV</button>
          </div>}
        </div>
      </div>
    </header>

    {mode === 'template' ? <main className="pt-4"><div className="mx-auto max-w-6xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-5"><div><h2 className="font-bold text-slate-900">Código do Content Builder</h2><p className="text-sm text-slate-500">Cole o HTML com AMPscript. O conteúdo fica salvo somente neste navegador.</p></div><button onClick={saveTemplate} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-bold text-white outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2"><Save size={16}/>Salvar e aplicar</button></div><textarea aria-label="Código do template do SFMC" value={template} onChange={(event) => setTemplate(event.target.value)} spellCheck={false} className="h-[68vh] w-full resize-none bg-slate-950 p-5 font-mono text-xs leading-5 text-slate-100 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-400"/></div></main> : mode === 'library' ? <AssetLibrary assets={assets} setAssets={setAssets} taxonomy={taxonomy}/> :
    <main className="pt-4">
      {importMessages.length > 0 && <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900" role="status">{importMessages.map((message) => <div key={message}>{message}</div>)}</div>}

      <div className="grid min-h-[720px] gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
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
            <div className="mb-2 rounded-lg bg-slate-50 px-3 py-2 text-[11px] font-semibold text-slate-500">Parceiro › segmento › subgrupo › semana › briefing</div>
            {filteredRows.length ? filteredRows.map((row) => {
              const issues = issuesByRow.get(row.__id) ?? [];
              const errors = issues.filter((issue) => issue.severity === 'error').length;
              const isSelected = selected?.__id === row.__id;
              return <button key={row.__id} onClick={() => setSelectedId(row.__id)} className={`mb-2 w-full rounded-xl border p-3 text-left outline-none transition focus-visible:ring-2 focus-visible:ring-cyan-500 ${isSelected ? 'border-cyan-300 bg-cyan-50 shadow-sm' : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50'}`}>
                <div className="mb-2 truncate text-[10px] font-bold uppercase tracking-wide text-cyan-700">{partnerLabel(row.__meta.partner)} › {row.__meta.segment || 'Sem segmento'} › {row.__meta.subgroup || 'Sem subgrupo'} › {row.__meta.weekKey || 'Sem semana'}</div>
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

        <Group id="email-editor-preview" orientation="horizontal" defaultLayout={defaultLayout ?? { editor: 58, preview: 42 }} onLayoutChanged={onLayoutChanged} className="min-w-0 overflow-hidden rounded-2xl" resizeTargetMinimumSize={{ coarse: 20, fine: 10 }}>
          <Panel id="editor" defaultSize="58%" minSize="32%" className="min-w-0">
        {selected ? <section id="email-editor-panel" className="h-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" aria-label="Editor do briefing selecionado">
          <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-4 py-3.5 backdrop-blur">
            <div className="flex flex-wrap items-start justify-between gap-2"><div><h2 className="font-bold text-slate-900">{rowKey(selected).replaceAll(' / ', ' · ')}</h2><p className="mt-0.5 text-xs text-slate-500">{syncState} · versão {selected.__meta.version}</p></div><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${selectedIssues.some((issue) => issue.severity === 'error') ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>{selectedIssues.filter((issue) => issue.severity === 'error').length ? `${selectedIssues.filter((issue) => issue.severity === 'error').length} ajustes necessários` : 'Pronto para exportar'}</span></div>
          </div>
          <div className="max-h-[790px] overflow-y-auto p-3.5">
            <section className="mb-3 rounded-xl border border-cyan-100 bg-cyan-50/60 p-3" aria-label="Organização e auditoria">
              <div className="mb-2 text-xs font-bold uppercase tracking-wide text-cyan-800">Organização e auditoria</div>
              <div className="grid gap-2 md:grid-cols-2">
                <TaxonomySelect label="Parceiro" value={selected.__meta.partner} options={taxonomyOptions.partners} onChange={(value) => updateSelected({ __meta: { ...selected.__meta, partner: value, segment: '', subgroup: '', weekKey: '', activityNames: [] } } as Partial<BriefingRow>)}/>
                <TaxonomySelect label="Segmento" value={selected.__meta.segment} options={taxonomyOptions.segments} onChange={(value) => updateSelected({ __meta: { ...selected.__meta, segment: value, subgroup: '', weekKey: '', activityNames: [] } } as Partial<BriefingRow>)}/>
                <TaxonomySelect label="Subgrupo" value={selected.__meta.subgroup} options={taxonomyOptions.subgroups} onChange={(value) => updateSelected({ __meta: { ...selected.__meta, subgroup: value, weekKey: '', activityNames: [] } } as Partial<BriefingRow>)}/>
                <TaxonomySelect label="Semana / safra" value={selected.__meta.weekKey} options={taxonomyOptions.weeks} onChange={(value) => updateSelected({ __meta: { ...selected.__meta, weekKey: value, activityNames: [] } } as Partial<BriefingRow>)}/>
              </div>
              <div className="mt-2"><TaxonomySelect label="Activity Name para auditoria (opcional, mas recomendado)" value={selected.__meta.activityNames[0] ?? ''} options={taxonomyOptions.activityNames} onChange={(value) => updateSelected({ __meta: { ...selected.__meta, activityNames: value ? [value] : [] } } as Partial<BriefingRow>)}/></div>
              {selected.__meta.partner === 'N/A' && <p className="mt-2 rounded-lg bg-amber-50 px-2 py-1.5 text-xs text-amber-900"><b>Parceiro não informado (N/A).</b> O valor de origem será preservado; isso não classifica o briefing como Proprietária.</p>}
            </section>
            {selectedIssues.length > 0 && <div className="mb-3 space-y-2">{selectedIssues.map((issue, index) => <div key={`${issue.code}-${issue.field}-${index}`} className={`flex items-start justify-between gap-3 rounded-lg border px-3 py-2 text-xs ${issue.severity === 'error' ? 'border-red-200 bg-red-50 text-red-900' : 'border-amber-200 bg-amber-50 text-amber-900'}`}><span>{issue.message}</span>{issue.fix && <button onClick={() => fixIssue(issue)} className="shrink-0 rounded-md bg-white px-2 py-1 font-bold shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"><Wand2 className="mr-1 inline" size={12}/>Corrigir</button>}</div>)}</div>}

            <label className="mb-3 flex min-h-11 items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700"><input type="checkbox" checked={!!selected.__journeyConfirmed} onChange={(event) => updateSelected({ __journeyConfirmed: event.target.checked })} className="mt-0.5 h-4 w-4 accent-cyan-600"/><span><b>Jornada conferida no SFMC</b><br/><span className="text-xs text-slate-500">Confirma que esta campanha e sequência estão habilitadas para entrada.</span></span></label>
            <SignatureMatrix rows={rows} selected={selected} onEnsure={() => setRows((current) => ensurePlurixVariants(current, selected.__id))} onSelect={setSelectedId}/>

            <div className="space-y-2.5">
              {EDITOR_SECTIONS.map((section) => {
                return <details key={section.id} open className="group overflow-hidden rounded-xl border border-slate-200 bg-white">
                  <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-3.5 py-2.5 outline-none hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-500 [&::-webkit-details-marker]:hidden">
                    <div className="min-w-0"><div className="font-bold text-slate-800">{section.label}</div><div className="truncate text-xs text-slate-500">{section.description}</div></div>
                    <ChevronDown className="shrink-0 text-slate-400 transition-transform group-open:rotate-180" size={16}/>
                  </summary>
                  <div className="border-t border-slate-100 px-3.5 py-3">
                    {section.id === 'legal' && <LegalTools selected={selected} legalTexts={legalTexts} updateSelected={updateSelected}/>}
                    {section.fields && <div className="grid gap-3 md:grid-cols-2">{section.fields.map((field) => <Field key={field} field={field} value={selected[field]} suggestions={[...new Set(rows.map((row) => row[field]).filter(Boolean))]} onChange={(value) => updateField(field, value)}/>)}</div>}
                    {section.imageSlot && <div className={section.fields ? 'mt-3' : ''}><ImageUrlCard slot={section.imageSlot} imageUrl={selected[section.imageSlot.image]} destinationUrl={section.imageSlot.link ? selected[section.imageSlot.link] : undefined} assets={assets} contextProduct={selected.NM_PRODUTO_INTERNO} contextPartner={selected.__meta.partner} onImageUrl={(value) => updateField(section.imageSlot!.image, value)} onDestinationUrl={section.imageSlot.link ? (value) => updateField(section.imageSlot!.link!, value) : undefined} onCreateAsset={() => setMode('library')}/></div>}
                  </div>
                </details>;
              })}
            </div>
            <div className="mt-4 border-t border-slate-200 pt-4"><button type="button" onClick={() => setSaveOpen(true)} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#07595b] px-4 py-3 text-sm font-bold text-white outline-none transition hover:bg-[#064c4e] focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2"><Save size={17}/>Salvar briefing</button><p className="mt-2 text-center text-xs text-slate-500">Salve o rascunho ou marque como pronto depois de revisar todos os blocos.</p></div>
          </div>
        </section> : <div/>}
          </Panel>

          <Separator id="email-editor-preview-separator" aria-label="Ajustar largura do editor e da prévia" className="group/splitter relative mx-1.5 w-2 cursor-col-resize rounded-full outline-none focus-visible:ring-2 focus-visible:ring-cyan-500" title="Arraste para ajustar. Use as setas do teclado ou dê dois cliques para restaurar.">
            <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-slate-300 transition group-hover/splitter:w-1 group-hover/splitter:bg-cyan-500"/>
            <span className="absolute left-1/2 top-1/2 h-10 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-slate-300 bg-white shadow-sm transition group-hover/splitter:border-cyan-500 group-hover/splitter:bg-cyan-50"/>
          </Separator>

          <Panel id="preview" defaultSize="42%" minSize="25%" className="min-w-0">
            <section id="email-preview-panel" className="h-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" aria-label="Prévia do e-mail">
              <div className="border-b border-slate-200 bg-white p-3.5">
                <div className="flex items-start justify-between gap-3"><div><div className="flex items-center gap-2"><h2 className="font-bold text-slate-900">Prévia do e-mail</h2><span className="rounded-full bg-cyan-50 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-cyan-700">Simulação local</span></div><p className="mt-0.5 text-xs leading-4 text-slate-500">Confira o conteúdo com dados de teste. Antes do envio, valide pelo Test Send do SFMC.</p></div><div className="flex shrink-0 gap-2"><button onClick={downloadPreview} disabled={!selected || downloadingPreview || render.diagnostics.length > 0} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none transition hover:border-cyan-300 hover:text-cyan-800 focus-visible:ring-2 focus-visible:ring-cyan-500 disabled:opacity-50"><Download size={15}/>{downloadingPreview ? 'Gerando…' : 'Baixar imagem'}</button><button onClick={() => setPreviewOpen(true)} disabled={!selected} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none transition hover:border-cyan-300 hover:text-cyan-800 focus-visible:ring-2 focus-visible:ring-cyan-500 disabled:opacity-50"><Maximize2 size={15}/>Ampliar</button></div></div>
                <div className="mt-3 grid grid-cols-2 gap-2"><MiniInput label="Nome de teste" value={subscriber.PRI_NOME} onChange={(value) => setSubscriber((current) => ({ ...current, PRI_NOME: value }))}/><MiniInput label="Limite de teste" value={subscriber.LIMITE} onChange={(value) => setSubscriber((current) => ({ ...current, LIMITE: value }))}/></div>
              </div>
              {selected && <div className="border-b border-slate-200 bg-slate-50 px-4 py-3"><div className="flex items-start gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-900 text-white"><Mail size={16}/></span><div className="min-w-0"><div className="line-clamp-2 text-sm font-bold leading-5 text-slate-900">{selected.ASSUNTO || 'Assunto não preenchido'}</div><div className="mt-0.5 line-clamp-1 text-xs text-slate-500">{selected.PRE_CABECALHO || 'Sem texto de pré-visualização'}</div><div className="mt-2 text-[11px] text-slate-500">{selected.NM_PRODUTO_INTERNO || 'Produto'} · {selected.TP_CAMPANHA || 'Campanha'} · {selected.SEQUENCIA || 'Sequência'} · Remetente definido no SFMC</div></div></div></div>}
              {render.diagnostics.length > 0 ? <div className="m-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">{render.diagnostics.map((diagnostic) => <div key={diagnostic}>{diagnostic}</div>)}</div> : <iframe ref={previewFrameRef} title="Conteúdo renderizado do e-mail dinâmico" sandbox="allow-same-origin" srcDoc={render.html} className="h-[650px] w-full bg-slate-100"/>}
            </section>
          </Panel>
        </Group>

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
    {saveOpen && selected && <SaveDialog selected={selected} errors={selectedIssues.filter((issue) => issue.severity === 'error').length} onClose={() => setSaveOpen(false)} onSave={saveCurrent} updateSelected={updateSelected}/>}
  </div>;
};

const HeaderMetric = ({ label, value, icon, tone = 'default' }: { label: string; value: number; icon: React.ReactNode; tone?: 'default' | 'success' | 'danger' | 'warning' }) => {
  const colors = { default: 'text-cyan-50', success: 'text-emerald-200', danger: 'text-red-200', warning: 'text-amber-200' };
  return <div className={`inline-flex items-center gap-2 ${colors[tone]}`}>{icon}<span className="text-lg font-extrabold text-white">{value}</span><span className="max-w-24 text-[11px] font-semibold leading-3">{label}</span></div>;
};

const HeaderAction = ({ label, icon, onClick, disabled, danger }: { label: string; icon: React.ReactNode; onClick: () => void; disabled?: boolean; danger?: boolean }) => <button onClick={onClick} disabled={disabled} title={label} className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-bold outline-none transition focus-visible:ring-2 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-40 ${danger ? 'border border-red-200/30 bg-red-500/15 text-red-100 hover:bg-red-500/25' : 'border border-white/20 bg-white/10 text-white hover:bg-white/20'}`}>{icon}<span className="hidden 2xl:inline">{label}</span><span className="sr-only 2xl:hidden">{label}</span></button>;

const MiniInput = ({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) => <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}<input value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-2.5 text-xs font-normal normal-case tracking-normal text-slate-700 outline-none focus:border-cyan-400 focus-visible:ring-2 focus-visible:ring-cyan-100"/></label>;

const isPublicImageUrl = (value: string) => { try { return new URL(value).protocol === 'https:'; } catch { return false; } };

const MetaField = ({ label, value, list, onChange }: { label: string; value: string; list: string; onChange: (value: string) => void }) => <label className="text-xs font-semibold text-slate-700">{label}<input list={list} value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-400"/></label>;

const TaxonomySelect = ({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) => <label className="block text-xs font-semibold text-slate-700">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-cyan-400 focus-visible:ring-2 focus-visible:ring-cyan-100"><option value="">Selecione na base de activities…</option>{options.map((option) => <option key={option} value={option}>{option === 'N/A' ? 'Parceiro não informado (N/A)' : option}</option>)}</select></label>;

const SignatureMatrix = ({ rows, selected, onEnsure, onSelect }: { rows: WorkspaceBriefing[]; selected: WorkspaceBriefing; onEnsure: () => void; onSelect: (id: string) => void }) => {
  const group = rows.filter((row) => row.__meta.campaignGroupId === selected.__meta.campaignGroupId);
  const isPlurix = group.some((row) => PLURIX_SIGNATURES.some(({ key }) => key === row.NM_PRODUTO_INTERNO.toUpperCase()));
  if (!isPlurix) return null;
  return <div className="mb-3 rounded-xl border border-violet-200 bg-violet-50 p-3"><div className="flex items-center justify-between gap-2"><div><b className="text-sm text-violet-950">Assinaturas Plurix</b><p className="text-xs text-violet-700">Um briefing visual; seis linhas técnicas no CSV.</p></div><button onClick={onEnsure} className="rounded-lg bg-violet-700 px-3 py-2 text-xs font-bold text-white">Completar 6 bandeiras</button></div><div className="mt-2 flex flex-wrap gap-1.5">{PLURIX_SIGNATURES.map(({ key, label }) => { const row = group.find((item) => item.NM_PRODUTO_INTERNO.toUpperCase() === key); return <button key={key} disabled={!row} onClick={() => row && onSelect(row.__id)} className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${row?.__id === selected.__id ? 'border-violet-700 bg-violet-700 text-white' : row ? 'border-violet-200 bg-white text-violet-800' : 'border-slate-200 text-slate-400'}`}>{label} {row ? '✓' : '—'}</button>; })}</div></div>;
};

const LegalTools = ({ selected, legalTexts, updateSelected }: { selected: WorkspaceBriefing; legalTexts: LegalText[]; updateSelected: (patch: Partial<WorkspaceBriefing>) => void }) => <div className="mb-3 rounded-lg bg-slate-50 p-3"><div className="flex flex-wrap items-end gap-2"><label className="min-w-52 flex-1 text-xs font-semibold text-slate-700">Texto legal salvo<select defaultValue="" onChange={(event) => { const item = legalTexts.find((legal) => legal.id === event.target.value); if (item) updateSelected({ NOTA_LEGAL: item.legalText, COR_NOTA_LEGAL: item.color, TAMANHO_DA_FONTE_NOTA_LEGAL: item.fontSize }); }} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"><option value="">Escolha um texto aprovado…</option>{legalTexts.map((item) => <option key={item.id} value={item.id}>{item.name} · v{item.version}</option>)}</select></label><label className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900"><input type="checkbox" checked={!!selected.__meta.legalOverride} onChange={(event) => updateSelected({ __meta: { ...selected.__meta, legalOverride: event.target.checked } })}/>Editar só esta linha</label></div><p className="mt-2 text-[11px] text-slate-500">Por padrão, a nota legal é compartilhada entre as assinaturas. O override avançado evita propagação e fica registrado na auditoria.</p></div>;

const SaveDialog = ({ selected, errors, onClose, onSave, updateSelected }: { selected: WorkspaceBriefing; errors: number; onClose: () => void; onSave: (ready: boolean) => void; updateSelected: (patch: Partial<WorkspaceBriefing>) => void }) => { const missing = !selected.__meta.activityNames.length; return <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/60 p-4" role="dialog" aria-modal="true"><div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl"><h2 className="text-lg font-bold text-slate-900">Salvar briefing</h2><p className="mt-1 text-sm text-slate-600">Será criada a versão {selected.__meta.savedAt ? selected.__meta.version + 1 : selected.__meta.version} com registro de auditoria.</p>{missing && <label className="mt-4 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950"><input type="checkbox" checked={!!selected.__meta.acknowledgedMissingActivity} onChange={(event) => updateSelected({ __meta: { ...selected.__meta, acknowledgedMissingActivity: event.target.checked } })}/><span><b>Activity Name não informado.</b><br/>Confirmo que quero salvar sem o identificador recomendado para auditoria.</span></label>}{errors > 0 && <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-800">Existem {errors} erros. Salve como rascunho e corrija antes de marcar como pronto.</p>}<div className="mt-5 flex justify-end gap-2"><button onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold">Cancelar</button><button onClick={() => onSave(false)} disabled={missing && !selected.__meta.acknowledgedMissingActivity} className="rounded-lg border border-cyan-700 px-4 py-2 text-sm font-bold text-cyan-800 disabled:opacity-40">Salvar rascunho</button><button onClick={() => onSave(true)} disabled={errors > 0 || (missing && !selected.__meta.acknowledgedMissingActivity)} className="rounded-lg bg-cyan-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-40">Salvar como pronto</button></div></div></div>; };

const AssetLibrary = ({ assets, setAssets, taxonomy }: { assets: EmailAsset[]; setAssets: React.Dispatch<React.SetStateAction<EmailAsset[]>>; taxonomy: ActivityTaxonomy[] }) => {
  const [draft, setDraft] = useState<EmailAsset>({ id: crypto.randomUUID(), name: '', externalUrl: '', slot: 'generic', tags: [], status: 'ready', version: 1 });
  const [message, setMessage] = useState('');
  const [filterQuery, setFilterQuery] = useState('');
  const [filterSlot, setFilterSlot] = useState('');
  const [filterPartner, setFilterPartner] = useState('');
  const [filterSubgroup, setFilterSubgroup] = useState('');
  const partnerOptions = [...new Set(['Institucional B2C', ...taxonomy.map((item) => item.partner), ...assets.map((item) => item.partner ?? '')].filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  const subgroupOptions = [...new Set([...taxonomy.map((item) => item.subgroup), ...assets.map((item) => item.subgroup ?? '')].filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  const filteredAssets = assets.filter((asset) => {
    const matchesQuery = [asset.name, asset.partner, asset.product, asset.subgroup, asset.slot, ...asset.tags].join(' ').toLowerCase().includes(filterQuery.trim().toLowerCase());
    return matchesQuery && (!filterSlot || asset.slot === filterSlot) && (!filterPartner || asset.partner === filterPartner) && (!filterSubgroup || asset.subgroup === filterSubgroup);
  });
  const clearFilters = () => { setFilterQuery(''); setFilterSlot(''); setFilterPartner(''); setFilterSubgroup(''); };
  const persist = async () => { if (!draft.name || !isPublicImageUrl(draft.externalUrl)) { setMessage('Informe um nome e uma URL pública HTTPS do Salesforce.'); return; } try { const saved = await saveAsset(draft); setAssets((current) => [saved, ...current.filter((item) => item.id !== saved.id)]); setDraft({ id: crypto.randomUUID(), name: '', externalUrl: '', slot: 'generic', tags: [], status: 'ready', version: 1 }); setMessage('Ativo salvo. Nenhuma imagem foi enviada ao Supabase.'); } catch (error) { setMessage(error instanceof Error ? error.message : 'Falha ao salvar ativo.'); } };
  return <main className="pt-4"><div className="grid gap-4 xl:grid-cols-[380px_1fr]"><section id="asset-library-form" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-bold text-slate-900">Cadastrar URL do Salesforce</h2><p className="mt-1 text-sm text-slate-500">A biblioteca guarda só a referência e os metadados; o arquivo continua no Content Builder.</p><div className="mt-4 space-y-3"><MetaField label="Nome do ativo" value={draft.name} list="none" onChange={(name) => setDraft({ ...draft, name })}/><MetaField label="URL pública da imagem" value={draft.externalUrl} list="none" onChange={(externalUrl) => setDraft({ ...draft, externalUrl })}/><MetaField label="Link ao clicar (opcional)" value={draft.clickUrl ?? ''} list="none" onChange={(clickUrl) => setDraft({ ...draft, clickUrl })}/><label className="block text-xs font-semibold text-slate-700">Posição<select value={draft.slot} onChange={(event) => setDraft({ ...draft, slot: event.target.value as EmailAsset['slot'] })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">{['header','banner_1','banner_2','banner_3','signature','generic'].map((slot) => <option key={slot}>{slot}</option>)}</select></label><div className="grid grid-cols-2 gap-2"><LibrarySelect label="Parceiro" value={draft.partner ?? ''} placeholder="Selecione…" options={partnerOptions} onChange={(partner) => setDraft({ ...draft, partner })}/><LibrarySelect label="Subgrupo" value={draft.subgroup ?? ''} placeholder="Selecione…" options={subgroupOptions} onChange={(subgroup) => setDraft({ ...draft, subgroup })}/></div>{draft.externalUrl && isPublicImageUrl(draft.externalUrl) && <img src={draft.externalUrl} alt="Prévia do novo ativo" className="max-h-44 w-full rounded-lg bg-slate-100 object-contain"/>}<button onClick={persist} className="w-full rounded-lg bg-cyan-700 px-4 py-3 text-sm font-bold text-white"><Save className="mr-2 inline" size={15}/>Salvar na biblioteca</button>{message && <p className="text-xs text-slate-600">{message}</p>}</div></section><section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><div><h2 className="font-bold text-slate-900">Ativos disponíveis</h2><p className="text-sm text-slate-500">{filteredAssets.length} de {assets.length} referências</p></div><Images className="text-cyan-700"/></div><div className="sticky top-2 z-10 mt-4 grid gap-2 rounded-xl border border-slate-200 bg-slate-50/95 p-3 shadow-sm backdrop-blur md:grid-cols-[minmax(180px,1fr)_repeat(3,minmax(130px,0.55fr))_auto]"><label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3"><Search size={15} className="text-slate-400"/><span className="sr-only">Buscar ativos</span><input value={filterQuery} onChange={(event) => setFilterQuery(event.target.value)} placeholder="Buscar nome, bandeira ou tag…" className="h-10 min-w-0 flex-1 text-sm outline-none"/></label><LibrarySelect label="" value={filterSlot} placeholder="Todas as posições" options={['header','banner_1','banner_2','banner_3','signature','generic']} onChange={setFilterSlot}/><LibrarySelect label="" value={filterPartner} placeholder="Todos os parceiros" options={partnerOptions} onChange={setFilterPartner}/><LibrarySelect label="" value={filterSubgroup} placeholder="Todos os subgrupos" options={subgroupOptions} onChange={setFilterSubgroup}/><button type="button" onClick={clearFilters} className="min-h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 hover:border-cyan-300 hover:text-cyan-800">Limpar</button></div><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{filteredAssets.map((asset) => <article key={asset.id} className="overflow-hidden rounded-xl border border-slate-200"><div className="grid h-36 place-items-center bg-slate-100"><img src={asset.externalUrl} alt={asset.altText || asset.name} className="max-h-36 w-full object-contain"/></div><div className="p-3"><div className="font-bold text-slate-800">{asset.name}</div><div className="mt-1 text-xs text-slate-500">{asset.slot} · {partnerLabel(asset.partner ?? '')}{asset.subgroup ? ` · ${asset.subgroup}` : ''}</div><button onClick={() => navigator.clipboard.writeText(asset.externalUrl)} className="mt-2 text-xs font-bold text-cyan-700">Copiar URL</button></div></article>)}</div>{filteredAssets.length === 0 && <div className="py-16 text-center text-sm text-slate-500"><Search className="mx-auto mb-2 text-slate-300" size={28}/><b className="text-slate-700">Nenhum ativo neste recorte</b><p className="mt-1 text-xs">Limpe um filtro ou ajuste a busca.</p></div>}</section></div></main>;
};

const LibrarySelect = ({ label, value, placeholder, options, onChange }: { label: string; value: string; placeholder: string; options: string[]; onChange: (value: string) => void }) => <label className="block text-xs font-semibold text-slate-700">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-cyan-400 focus-visible:ring-2 focus-visible:ring-cyan-100"><option value="">{placeholder}</option>{options.map((option) => <option key={option} value={option}>{option === 'N/A' ? 'Parceiro não informado (N/A)' : option}</option>)}</select></label>;

const ImageUrlCard = ({ slot, imageUrl, destinationUrl, assets = [], contextProduct = '', contextPartner = '', onImageUrl, onDestinationUrl, onCreateAsset }: { slot: ImageSlot; imageUrl: string; destinationUrl?: string; assets?: EmailAsset[]; contextProduct?: string; contextPartner?: string; onImageUrl: (value: string) => void; onDestinationUrl?: (value: string) => void; onCreateAsset: () => void }) => {
  const [loadState, setLoadState] = useState<'idle' | 'loading' | 'loaded' | 'error'>(imageUrl ? 'loading' : 'idle');
  const [dimensions, setDimensions] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  useEffect(() => { setLoadState(imageUrl ? 'loading' : 'idle'); setDimensions(''); }, [imageUrl]);
  const validUrl = !imageUrl || isPublicImageUrl(imageUrl);
  return <div className={`overflow-hidden rounded-xl border bg-white ${!validUrl || loadState === 'error' ? 'border-red-200' : loadState === 'loaded' ? 'border-emerald-200' : 'border-slate-200'}`}>
    <div className="flex items-start justify-between gap-3 px-3 py-2.5"><div><div className="flex items-center gap-2 text-sm font-bold text-slate-800"><ImageIcon size={15} className="text-cyan-600"/>{slot.label}{loadState === 'loaded' && <CheckCircle2 size={14} className="text-emerald-500"/>}</div><div className="mt-0.5 text-[11px] text-slate-500">{slot.description}{dimensions && ` · ${dimensions}`}</div></div>{imageUrl && <button type="button" onClick={() => onImageUrl('')} className="rounded-lg p-2 text-slate-400 outline-none hover:bg-red-50 hover:text-red-600 focus-visible:ring-2 focus-visible:ring-red-400" aria-label={`Remover ${slot.label}`}><Trash2 size={14}/></button>}</div>
    <div className="grid gap-3 border-t border-slate-100 p-3 md:grid-cols-[minmax(0,1fr)_minmax(180px,0.7fr)]">
      <div className="space-y-2">
        <button type="button" onClick={() => setPickerOpen(true)} disabled={!assets.length} className="flex w-full items-center justify-between rounded-lg border border-cyan-300 bg-cyan-50 px-3 py-3 text-left text-xs font-bold text-cyan-900 outline-none hover:border-cyan-500 hover:bg-cyan-100 focus-visible:ring-2 focus-visible:ring-cyan-500 disabled:cursor-not-allowed disabled:opacity-50"><span><Images className="mr-2 inline" size={16}/>Selecionar imagem salva</span><span className="rounded-full bg-white px-2 py-0.5 text-[10px] text-cyan-700">{assets.length} ativos</span></button>
        <div className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-[11px] text-slate-500"><span className="min-w-0 truncate">{imageUrl ? 'Ativo selecionado na biblioteca' : 'Nenhum ativo selecionado'}</span><div className="flex shrink-0 items-center gap-1">{imageUrl && validUrl && <a href={imageUrl} target="_blank" rel="noreferrer" className="rounded-md p-1.5 text-slate-500 hover:bg-white hover:text-cyan-700" aria-label={`Abrir ${slot.label}`}><ExternalLink size={13}/></a>}<button type="button" onClick={onCreateAsset} className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 font-bold text-cyan-700 hover:bg-white"><Upload size={13}/>Subir novo ativo</button></div></div>
        {onDestinationUrl && <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-500">Link ao clicar na imagem<input type="url" value={destinationUrl ?? ''} onChange={(event) => onDestinationUrl(event.target.value.trim())} placeholder="https://destino-da-campanha..." className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-normal normal-case tracking-normal outline-none focus:border-cyan-400 focus-visible:ring-2 focus-visible:ring-cyan-100"/></label>}
      </div>
      {imageUrl && validUrl ? <div className="flex min-h-24 items-center justify-center overflow-hidden rounded-lg bg-slate-100 p-2">{loadState === 'error' ? <div className="px-3 py-5 text-center text-xs text-red-700"><AlertTriangle className="mx-auto mb-2" size={19}/>Não foi possível carregar. Confirme se a URL é pública.</div> : <img src={imageUrl} alt={`Prévia de ${slot.label}`} onLoad={(event) => { setLoadState('loaded'); setDimensions(`${event.currentTarget.naturalWidth} × ${event.currentTarget.naturalHeight}px`); }} onError={() => setLoadState('error')} className="max-h-32 max-w-full object-contain"/>}</div> : <div className="flex min-h-24 items-center justify-center rounded-lg bg-slate-50 px-3 text-center text-xs text-slate-400"><div><ImageIcon className="mx-auto mb-2 text-slate-300" size={22}/>{imageUrl ? 'Use uma URL pública HTTPS' : 'A prévia aparecerá aqui'}</div></div>}
    </div>
    {pickerOpen && <AssetPickerModal
      assets={assets}
      slot={slot}
      selectedUrl={imageUrl}
      contextProduct={contextProduct}
      contextPartner={contextPartner}
      onClose={() => setPickerOpen(false)}
      onSelect={(asset) => { onImageUrl(asset.externalUrl); if (asset.clickUrl && onDestinationUrl) onDestinationUrl(asset.clickUrl); setPickerOpen(false); }}
    />}
  </div>;
};

const assetSlotFor = (slot: ImageSlot): EmailAsset['slot'] => slot.image === 'HEADER' ? 'header' : slot.image === 'BANNER_1_CORPO' ? 'banner_1' : slot.image === 'BANNER_2_CORPO' ? 'banner_2' : 'banner_3';

const AssetPickerModal = ({ assets, slot, selectedUrl, contextProduct, contextPartner, onClose, onSelect }: { assets: EmailAsset[]; slot: ImageSlot; selectedUrl: string; contextProduct: string; contextPartner: string; onClose: () => void; onSelect: (asset: EmailAsset) => void }) => {
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<'recommended' | 'all'>('recommended');
  const targetSlot = assetSlotFor(slot);
  const context = `${contextProduct} ${contextPartner}`.toUpperCase();
  const contextual = (asset: EmailAsset) => !!asset.product && context.includes(asset.product.toUpperCase());
  const matching = assets.filter((asset) => asset.slot === targetSlot || asset.slot === 'generic' || (targetSlot === 'banner_3' && asset.slot === 'signature')).sort((a, b) => Number(contextual(b)) - Number(contextual(a)));
  const source = scope === 'recommended' && matching.length ? matching : assets;
  const filtered = source.filter((asset) => [asset.name, asset.partner, asset.product, asset.subgroup, ...asset.tags].join(' ').toLowerCase().includes(query.trim().toLowerCase()));
  return <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/70 p-4" role="dialog" aria-modal="true" aria-label={`Selecionar ${slot.label}`} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><div className="flex max-h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"><header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-5"><div><h2 className="text-lg font-bold text-slate-900">Escolher {slot.label.toLowerCase()}</h2><p className="text-sm text-slate-500">Ativos aprovados; a URL continua hospedada fora do Supabase.</p></div><button onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Fechar biblioteca"><X size={20}/></button></header><div className="flex flex-wrap gap-2 border-b border-slate-200 bg-slate-50 p-4"><label className="flex min-w-64 flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3"><Search size={15} className="text-slate-400"/><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar bandeira, campanha ou nome…" className="h-10 min-w-0 flex-1 text-sm outline-none"/></label><div className="flex rounded-lg border border-slate-200 bg-white p-1">{([['recommended','Recomendados'],['all','Todos']] as const).map(([value, label]) => <button key={value} onClick={() => setScope(value)} className={`rounded-md px-3 py-2 text-xs font-bold ${scope === value ? 'bg-cyan-100 text-cyan-800' : 'text-slate-500'}`}>{label}</button>)}</div></div><div className="overflow-y-auto p-4"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{filtered.map((asset) => <button key={asset.id} onClick={() => onSelect(asset)} className={`overflow-hidden rounded-xl border bg-white text-left outline-none transition hover:-translate-y-0.5 hover:border-cyan-400 hover:shadow-md focus-visible:ring-2 focus-visible:ring-cyan-500 ${selectedUrl === asset.externalUrl ? 'border-cyan-500 ring-2 ring-cyan-100' : 'border-slate-200'}`}><div className="relative grid h-44 place-items-center bg-slate-100 p-2"><img src={asset.externalUrl} alt={asset.altText || asset.name} className="max-h-40 w-full object-contain"/><span className="absolute left-2 top-2 rounded-full bg-emerald-600 px-2 py-1 text-[10px] font-bold text-white">Aprovado</span>{asset.slot === targetSlot && <span className="absolute right-2 top-2 rounded-full bg-cyan-700 px-2 py-1 text-[10px] font-bold text-white">Recomendado</span>}</div><div className="p-3"><div className="truncate text-sm font-bold text-slate-900">{asset.name}</div><div className="mt-1 text-xs text-slate-500">{asset.product || asset.partner || 'Uso geral'} · {asset.width && asset.height ? `${asset.width} × ${asset.height}px` : asset.slot}</div><div className="mt-2 flex flex-wrap gap-1">{asset.tags.slice(0, 3).map((tag) => <span key={tag} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">{tag}</span>)}</div></div></button>)}</div>{filtered.length === 0 && <div className="py-16 text-center text-sm text-slate-500"><ImageIcon className="mx-auto mb-2 text-slate-300" size={28}/>Nenhum ativo encontrado neste filtro.</div>}</div></div></div>;
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
