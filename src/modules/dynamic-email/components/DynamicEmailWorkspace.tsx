import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Group, Panel, Separator, useDefaultLayout } from 'react-resizable-panels';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
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
  Printer,
  RefreshCw,
  Save,
  Search,
  Settings2,
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
  toDateInput,
  validateRows,
  type BriefingColumn,
  type BriefingRow,
  type ValidationIssue,
} from '../domain/briefing';
import { DEFAULT_DYNAMIC_EMAIL_TEMPLATE } from '../fixtures/defaultTemplate';
import { PLURIX_UX_V2_TEMPLATE, PLURIX_UX_V2_TEMPLATE_ID } from '../fixtures/plurixUxV2Template';
import { applyWorkspaceField, ensurePlurixVariants, normalizeLegacyRows, partnerLabel, PLURIX_SIGNATURES, withMeta, type ActivityTaxonomy, type EmailAsset, type LegalText, type SignatureSetting, type WorkspaceBriefing } from '../domain/workspace';
import { loadActivityTaxonomy, loadAssets, loadBriefings, loadLegalTexts, loadSignatureSettings, onlyCsvRows, recordExport, saveAsset, saveBriefing, saveSignatureSetting } from '../services/workspaceService';

const TEMPLATE_KEY = 'gaas-dynamic-email-template-v1';
const TEMPLATE_SLOTS_KEY = 'gaas-dynamic-email-template-slots-v3';
const LEGACY_TEMPLATE_SLOTS_KEY = 'gaas-dynamic-email-template-slots-v2';
const PRIMARY_TEMPLATE_KEY = 'gaas-dynamic-email-primary-template-v2';
const ROWS_KEY = 'gaas-dynamic-email-briefings-v1';
const SAMPLE: SubscriberSample = { CPF: '00000000000', PRI_NOME: 'VANIA', LIMITE: 'R$ 3.500', PRODUTO: 'INSTITUCIONAL', SEQUENCIA: 'E-mail 1', TP_CAMPANHA: 'Repescagem' };
const LONG_FIELDS = new Set<BriefingColumn>(['COPY_1_PRETO', 'COPY_2_PRETO', 'NOTA_LEGAL', 'RODAPE', 'PRE_CABECALHO']);
const COLOR_FIELDS = new Set<BriefingColumn>(['COR_COPY_1', 'COR_COPY_PRETO_1', 'COR_TITULO_COPY_2', 'COR_COPY_2', 'COR_NOTA_LEGAL']);
const EDITORIAL_WEEKS = ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4', 'Semana 5'];

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
type EditorialGroup = { id: string; rows: WorkspaceBriefing[]; visibleRows: WorkspaceBriefing[]; representative: WorkspaceBriefing; hasErrors: boolean };
type NewBriefingConfig = { segment: string; weekKey: string; sequence: string; sourceGroupId: string; signatureKeys: string[] };
type TemplateSlot = { id: string; name: string; source: string; updatedAt: string };
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
const initialTemplateSlots = (): TemplateSlot[] => {
  try {
    const stored = JSON.parse(localStorage.getItem(TEMPLATE_SLOTS_KEY) ?? 'null');
    if (Array.isArray(stored) && stored.length) return stored;
  } catch { /* migra para o slot inicial abaixo */ }
  let migrated: TemplateSlot[] = [];
  try {
    const legacy = JSON.parse(localStorage.getItem(LEGACY_TEMPLATE_SLOTS_KEY) ?? 'null');
    if (Array.isArray(legacy) && legacy.length) migrated = legacy;
  } catch { /* usa o template principal legado abaixo */ }
  if (!migrated.length) migrated = [{ id: crypto.randomUUID(), name: 'Template principal', source: localStorage.getItem(TEMPLATE_KEY) ?? DEFAULT_DYNAMIC_EMAIL_TEMPLATE, updatedAt: new Date().toISOString() }];
  return migrated.some((slot) => slot.id === PLURIX_UX_V2_TEMPLATE_ID) ? migrated : [...migrated, { id: PLURIX_UX_V2_TEMPLATE_ID, name: 'Plurix aquisição UX v2', source: PLURIX_UX_V2_TEMPLATE, updatedAt: '2026-08-19T12:00:00.000Z' }];
};

export const DynamicEmailWorkspace: React.FC = () => {
  const [rows, setRows] = useState<WorkspaceBriefing[]>(() => { try { return normalizeLegacyRows(JSON.parse(localStorage.getItem(ROWS_KEY) ?? 'null') ?? demoRows()); } catch { return normalizeLegacyRows(demoRows()); } });
  const [selectedId, setSelectedId] = useState(rows[0]?.__id ?? '');
  const [templateSlots, setTemplateSlots] = useState<TemplateSlot[]>(initialTemplateSlots);
  const [principalTemplateId, setPrincipalTemplateId] = useState(() => localStorage.getItem(PRIMARY_TEMPLATE_KEY) ?? '');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const effectivePrincipalId = templateSlots.some((slot) => slot.id === principalTemplateId) ? principalTemplateId : templateSlots[0].id;
  const effectiveSelectedId = templateSlots.some((slot) => slot.id === selectedTemplateId) ? selectedTemplateId : effectivePrincipalId;
  const selectedTemplateSlot = templateSlots.find((slot) => slot.id === effectiveSelectedId)!;
  const [template, setTemplate] = useState(() => initialTemplateSlots()[0].source);
  const [savedTemplate, setSavedTemplate] = useState(() => initialTemplateSlots()[0].source);
  const [mode, setMode] = useState<'briefings' | 'library' | 'template'>('briefings');
  const [assets, setAssets] = useState<EmailAsset[]>([]);
  const [legalTexts, setLegalTexts] = useState<LegalText[]>([]);
  const [taxonomy, setTaxonomy] = useState<ActivityTaxonomy[]>([]);
  const [signatureSettings, setSignatureSettings] = useState<SignatureSetting[]>(PLURIX_SIGNATURES.map(({ key, label }) => ({ partner: 'Plurix', signatureKey: key, signatureLabel: label, status: 'active' })));
  const [taxonomyState, setTaxonomyState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [saveOpen, setSaveOpen] = useState(false);
  const [syncState, setSyncState] = useState('Carregando dados compartilhados…');
  const [subscriber, setSubscriber] = useState<SubscriberSample>(SAMPLE);
  const [importMessages, setImportMessages] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ready' | 'needs-review'>('all');
  const [announcement, setAnnouncement] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [signatureManagerOpen, setSignatureManagerOpen] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const [newDefaults, setNewDefaults] = useState({ segment: 'CRM', weekKey: 'Semana 1' });
  const [weekArchiveTarget, setWeekArchiveTarget] = useState<{ partner: string; segment: string; weekKey: string } | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const templateFileRef = useRef<HTMLInputElement>(null);
  const { defaultLayout, onLayoutChanged } = useDefaultLayout({ id: 'gaas-email-editor-preview-v1', storage: localStorage });

  useEffect(() => { localStorage.setItem(ROWS_KEY, JSON.stringify(rows)); }, [rows]);
  useEffect(() => {
    localStorage.setItem(TEMPLATE_SLOTS_KEY, JSON.stringify(templateSlots));
    localStorage.setItem(PRIMARY_TEMPLATE_KEY, effectivePrincipalId);
  }, [effectivePrincipalId, templateSlots]);
  useEffect(() => { setTemplate(selectedTemplateSlot.source); }, [effectiveSelectedId]);
  useEffect(() => { setSavedTemplate(templateSlots.find((slot) => slot.id === effectivePrincipalId)?.source ?? DEFAULT_DYNAMIC_EMAIL_TEMPLATE); }, [effectivePrincipalId, templateSlots]);
  const refreshTaxonomy = async () => {
    setTaxonomyState('loading');
    try { setTaxonomy(await loadActivityTaxonomy()); setTaxonomyState('ready'); }
    catch { setTaxonomyState('error'); }
  };
  useEffect(() => { Promise.allSettled([loadBriefings(), loadAssets(), loadLegalTexts(), loadSignatureSettings()]).then(([briefings, assetRows, legalRows, settings]) => {
    if (briefings.status === 'fulfilled') { setRows(briefings.value); setSelectedId(briefings.value.find((row) => row.__meta.status !== 'archived')?.__id ?? briefings.value[0]?.__id ?? ''); }
    if (assetRows.status === 'fulfilled') setAssets(assetRows.value);
    if (legalRows.status === 'fulfilled') setLegalTexts(legalRows.value);
    if (settings.status === 'fulfilled' && settings.value.length) setSignatureSettings(settings.value);
    setSyncState(briefings.status === 'fulfilled' ? 'Sincronizado com o GaaS' : 'Rascunho local — não sincronizado');
  }); void refreshTaxonomy(); }, []);
  const activeRows = useMemo(() => rows.filter((row) => row.__meta.status !== 'archived'), [rows]);
  const issuesByRow = useMemo(() => validateRows(activeRows), [activeRows]);
  const selected = rows.find((row) => row.__id === selectedId) ?? rows[0];
  const selectedIssues = selected ? issuesByRow.get(selected.__id) ?? [] : [];
  const render = useMemo(() => selected ? renderDynamicEmail(savedTemplate, selected, { ...subscriber, PRODUTO: selected.NM_PRODUTO_INTERNO, SEQUENCIA: selected.SEQUENCIA, TP_CAMPANHA: selected.TP_CAMPANHA }) : { html: '', diagnostics: [] }, [savedTemplate, selected, subscriber]);
  const allIssues = [...issuesByRow.values()].flat();
  const technicalErrorCount = allIssues.filter((issue) => issue.severity === 'error').length;
  const editorialGroups = useMemo(() => [...new Set(rows.map((row) => row.__meta.campaignGroupId))].map((id) => {
    const groupRows = rows.filter((row) => row.__meta.campaignGroupId === id);
    const visibleRows = groupRows.filter((row) => row.__meta.status !== 'archived');
    const representative = visibleRows.find((row) => row.NM_PRODUTO_INTERNO.toUpperCase() === 'AMIGAO') ?? visibleRows[0] ?? groupRows[0];
    const issues = visibleRows.flatMap((row) => issuesByRow.get(row.__id) ?? []);
    return { id, rows: groupRows, visibleRows, representative, hasErrors: issues.some((issue) => issue.severity === 'error') };
  }), [issuesByRow, rows]);
  const filteredGroups = useMemo(() => editorialGroups.filter((group) => {
    const { representative: row, hasErrors } = group;
    if (!showArchived && !group.visibleRows.length) return false;
    if (statusFilter === 'ready' && hasErrors) return false;
    if (statusFilter === 'needs-review' && !hasErrors) return false;
    const haystack = [row.__meta.partner, row.__meta.segment, row.__meta.weekKey, row.TP_CAMPANHA, row.SEQUENCIA, row.UTM_CAMPANHA, row.ASSUNTO, ...group.rows.map((item) => item.__meta.subgroup)].join(' ').toLowerCase();
    return haystack.includes(query.trim().toLowerCase());
  }), [editorialGroups, query, showArchived, statusFilter]);
  const errorCount = editorialGroups.filter((group) => group.hasErrors).length;
  const activeEditorialGroupCount = editorialGroups.filter((group) => group.visibleRows.length > 0).length;
  const warningCount = editorialGroups.filter((group) => group.rows.some((row) => (issuesByRow.get(row.__id) ?? []).some((issue) => issue.severity === 'warning'))).length;
  const selectedGroupErrorCount = selected ? activeRows.filter((row) => row.__meta.campaignGroupId === selected.__meta.campaignGroupId).flatMap((row) => issuesByRow.get(row.__id) ?? []).filter((issue) => issue.severity === 'error').length : 0;
  const taxonomyOptions = useMemo(() => {
    if (!selected) return { partners: [], segments: [], subgroups: [], weeks: [], activityNames: [] };
    const withCurrent = (values: string[], current: string) => [...new Set([...values.filter(Boolean), current].filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
    const partnerRows = taxonomy.filter((item) => !selected.__meta.partner || item.partner === selected.__meta.partner);
    const segmentRows = partnerRows.filter((item) => !selected.__meta.segment || item.segment === selected.__meta.segment);
    const isPlurix = selected.__meta.partner.toLowerCase() === 'plurix';
    return {
      partners: withCurrent(['Institucional B2C', ...taxonomy.map((item) => item.partner).filter((partner) => partner !== 'N/A')], selected.__meta.partner),
      segments: withCurrent(partnerRows.map((item) => item.segment), selected.__meta.segment),
      subgroups: withCurrent(isPlurix ? PLURIX_SIGNATURES.map((item) => item.label) : segmentRows.map((item) => item.subgroup), selected.__meta.subgroup),
      weeks: withCurrent(EDITORIAL_WEEKS, selected.__meta.weekKey),
      activityNames: withCurrent(segmentRows.map((item) => item.activityName), selected.__meta.activityNames[0] ?? ''),
    };
  }, [selected, taxonomy]);

  const updateSelected = (patch: Partial<WorkspaceBriefing>) => selected?.__meta.status !== 'archived' && setRows((current) => current.map((row) => row.__id === selected?.__id ? { ...row, ...patch } : row));
  const updateGroupMeta = (patch: Partial<WorkspaceBriefing['__meta']>) => selected && selected.__meta.status !== 'archived' && setRows((current) => current.map((row) => row.__meta.campaignGroupId === selected.__meta.campaignGroupId && row.__meta.status !== 'archived' ? { ...row, __meta: { ...row.__meta, ...patch } } : row));
  const updateField = (field: BriefingColumn, value: string) => selected && selected.__meta.status !== 'archived' && setRows((current) => applyWorkspaceField(current, selected.__id, field, value));
  const fixIssue = (issue: ValidationIssue) => { if (selected) setRows((current) => current.map((row) => row.__id === selected.__id ? { ...applyFix(row, issue), __meta: row.__meta } : row)); };
  const exportCsv = () => { if (!technicalErrorCount) { const filename = `TB_BRIEFING_CAMPANHA_AQUISICAO_${new Date().toISOString().slice(0, 10)}.csv`; downloadText(filename, exportBriefingCsv(onlyCsvRows(rows))); void recordExport(filename, activeRows, []); } };
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
  const createBriefing = (config: NewBriefingConfig) => {
    const source = rows.find((row) => row.__meta.campaignGroupId === config.sourceGroupId && row.__meta.status !== 'archived');
    const seed = source ? { ...source } : emptyBriefingRow();
    const campaignGroupId = crypto.randomUUID();
    const created = config.signatureKeys.map((key) => { const signature = PLURIX_SIGNATURES.find((item) => item.key === key)!; return withMeta({ ...seed, __id: crypto.randomUUID(), NM_PRODUTO_INTERNO: key, SEQUENCIA: config.sequence, __journeyConfirmed: false }, { partner: 'Plurix', segment: config.segment, subgroup: signature.label, weekKey: config.weekKey, activityNames: [], campaignGroupId, status: 'draft', version: 1, savedAt: undefined }); });
    setRows((current) => [...current, ...created]);
    setSelectedId(created[0]?.__id ?? ''); setNewOpen(false);
    setAnnouncement(`Novo e-mail criado com ${created.length} assinaturas ativas.`);
  };
  const duplicateBriefing = () => {
    if (!selected) return;
    const campaignGroupId = crypto.randomUUID();
    const copies = rows.filter((row) => row.__meta.campaignGroupId === selected.__meta.campaignGroupId && row.__meta.status !== 'archived').map((row) => ({ ...row, __id: crypto.randomUUID(), __journeyConfirmed: false, __meta: { ...row.__meta, campaignGroupId, status: 'draft' as const, version: 1, savedAt: undefined } }));
    setRows((current) => [...current, ...copies]);
    setSelectedId(copies[0].__id);
    setAnnouncement('E-mail duplicado. Revise a sequência e a vigência antes de exportar.');
    requestAnimationFrame(() => document.getElementById('dynamic-SEQUENCIA')?.focus());
  };
  const deleteBriefing = async () => {
    if (!selected) return;
    const targets = rows.filter((row) => row.__meta.campaignGroupId === selected.__meta.campaignGroupId && row.__meta.status !== 'archived');
    try {
      const archived = await Promise.all(targets.filter((row) => row.__meta.savedAt).map((row) => saveBriefing({ ...row, __meta: { ...row.__meta, status: 'archived', version: row.__meta.version + 1 } }, ['E-mail editorial arquivado.'])));
      const targetIds = new Set(targets.map((row) => row.__id));
      const nextRows = rows.filter((row) => !targetIds.has(row.__id) || Boolean(row.__meta.savedAt)).map((row) => archived.find((item) => item.__id === row.__id) ?? row);
      setRows(nextRows); setSelectedId(nextRows.find((row) => row.__meta.status !== 'archived')?.__id ?? nextRows[0]?.__id ?? ''); setDeleteOpen(false);
      setAnnouncement(archived.length ? 'E-mail editorial arquivado; histórico e versões foram preservados.' : 'Rascunho ainda não salvo removido.');
    } catch (error) { setAnnouncement(error instanceof Error ? error.message : 'Falha ao arquivar o e-mail.'); }
  };
  const saveTemplate = () => {
    const updatedAt = new Date().toISOString();
    setTemplateSlots((current) => current.map((slot) => slot.id === effectiveSelectedId ? { ...slot, source: template, updatedAt } : slot));
    if (effectiveSelectedId === effectivePrincipalId) {
      localStorage.setItem(TEMPLATE_KEY, template);
      setSavedTemplate(template);
      setAnnouncement('Template principal salvo e aplicado à prévia.');
    } else setAnnouncement('Slot salvo. Defina-o como principal para usá-lo na prévia.');
  };
  const createTemplateSlot = () => {
    const slot: TemplateSlot = { id: crypto.randomUUID(), name: `Template ${templateSlots.length + 1}`, source: DEFAULT_DYNAMIC_EMAIL_TEMPLATE, updatedAt: new Date().toISOString() };
    setTemplateSlots((current) => [...current, slot]); setSelectedTemplateId(slot.id); setTemplate(slot.source); setAnnouncement('Novo slot criado. Cole ou edite o AMPscript e salve.');
  };
  const selectTemplateSlot = (id: string) => {
    setTemplateSlots((current) => current.map((slot) => slot.id === effectiveSelectedId ? { ...slot, source: template } : slot));
    setSelectedTemplateId(id);
  };
  const duplicateTemplateSlot = (id: string) => {
    const source = templateSlots.find((slot) => slot.id === id); if (!source) return;
    const slot: TemplateSlot = { ...source, id: crypto.randomUUID(), name: `${source.name} — cópia`, source: id === effectiveSelectedId ? template : source.source, updatedAt: new Date().toISOString() };
    setTemplateSlots((current) => [...current, slot]); setSelectedTemplateId(slot.id); setTemplate(slot.source); setAnnouncement('Template duplicado em um novo slot.');
  };
  const deleteTemplateSlot = (id: string) => {
    if (templateSlots.length === 1) { setAnnouncement('Mantenha ao menos um template-fonte disponível.'); return; }
    const target = templateSlots.find((slot) => slot.id === id); if (!target || !window.confirm(`Apagar o slot “${target.name}”? Esta ação remove apenas a cópia salva neste navegador.`)) return;
    const remaining = templateSlots.filter((slot) => slot.id !== id); const nextPrincipal = id === effectivePrincipalId ? remaining[0] : templateSlots.find((slot) => slot.id === effectivePrincipalId) ?? remaining[0];
    setTemplateSlots(remaining); setPrincipalTemplateId(nextPrincipal.id); setSelectedTemplateId(nextPrincipal.id); setTemplate(nextPrincipal.source); setSavedTemplate(nextPrincipal.source); localStorage.setItem(TEMPLATE_KEY, nextPrincipal.source); setAnnouncement(id === effectivePrincipalId ? 'Slot apagado; outro template foi definido como principal.' : 'Slot de template apagado.');
  };
  const makeTemplatePrincipal = (id: string) => {
    const source = templateSlots.find((slot) => slot.id === id); if (!source) return;
    const sourceCode = id === effectiveSelectedId ? template : source.source;
    const updatedAt = new Date().toISOString();
    setTemplateSlots((current) => current.map((slot) => slot.id === id ? { ...slot, source: sourceCode, updatedAt } : slot)); setPrincipalTemplateId(id); setSavedTemplate(sourceCode); localStorage.setItem(TEMPLATE_KEY, sourceCode); setAnnouncement(`${source.name} definido como principal para a visualização.`);
  };
  const uploadTemplate = async (file?: File) => {
    if (!file) return;
    const source = await file.text(); const cleanName = file.name.replace(/\.(html?|txt)$/i, '') || `Template ${templateSlots.length + 1}`;
    const slot: TemplateSlot = { id: crypto.randomUUID(), name: cleanName, source, updatedAt: new Date().toISOString() };
    setTemplateSlots((current) => [...current, slot]); setSelectedTemplateId(slot.id); setTemplate(source); setAnnouncement(`${file.name} carregado em um novo slot. Revise e defina como principal quando estiver pronto.`);
  };
  const openNewBriefing = (segment = 'CRM', weekKey = 'Semana 1') => { setNewDefaults({ segment, weekKey }); setNewOpen(true); };
  const duplicateGroup = (groupId: string) => {
    const sourceRows = rows.filter((row) => row.__meta.campaignGroupId === groupId && row.__meta.status !== 'archived');
    if (!sourceRows.length) return;
    const campaignGroupId = crypto.randomUUID();
    const copies = sourceRows.map((row) => ({ ...row, __id: crypto.randomUUID(), __journeyConfirmed: false, __meta: { ...row.__meta, campaignGroupId, status: 'draft' as const, version: 1, savedAt: undefined } }));
    setRows((current) => [...current, ...copies]); setSelectedId(copies[0].__id); setAnnouncement('E-mail duplicado como rascunho. Revise sequência, vigência e Activity Name.');
  };
  const duplicateWeek = (partner: string, segment: string, weekKey: string) => {
    const weekRows = rows.filter((row) => row.__meta.partner === partner && row.__meta.segment === segment && row.__meta.weekKey === weekKey && row.__meta.status !== 'archived');
    if (!weekRows.length) return;
    const usedNumbers = rows.filter((row) => row.__meta.partner === partner && row.__meta.segment === segment).map((row) => Number(row.__meta.weekKey.match(/\d+/)?.[0] ?? 0));
    const targetWeek = `Semana ${Math.max(0, ...usedNumbers) + 1}`;
    const groupIds = new Map<string, string>();
    const copies = weekRows.map((row) => { if (!groupIds.has(row.__meta.campaignGroupId)) groupIds.set(row.__meta.campaignGroupId, crypto.randomUUID()); return { ...row, __id: crypto.randomUUID(), __journeyConfirmed: false, __meta: { ...row.__meta, weekKey: targetWeek, campaignGroupId: groupIds.get(row.__meta.campaignGroupId)!, status: 'draft' as const, version: 1, savedAt: undefined } }; });
    setRows((current) => [...current, ...copies]); setSelectedId(copies[0].__id); setAnnouncement(`${weekKey} duplicada como ${targetWeek}, com ${groupIds.size} e-mails e ${copies.length} variações.`);
  };
  const archiveWeek = async (target: { partner: string; segment: string; weekKey: string }) => {
    const targets = rows.filter((row) => row.__meta.partner === target.partner && row.__meta.segment === target.segment && row.__meta.weekKey === target.weekKey && row.__meta.status !== 'archived');
    try {
      const archived = await Promise.all(targets.filter((row) => row.__meta.savedAt).map((row) => saveBriefing({ ...row, __meta: { ...row.__meta, status: 'archived', version: row.__meta.version + 1 } }, [`${target.weekKey} arquivada pela árvore editorial.`])));
      const ids = new Set(targets.map((row) => row.__id));
      const next = rows.filter((row) => !ids.has(row.__id) || Boolean(row.__meta.savedAt)).map((row) => archived.find((item) => item.__id === row.__id) ?? row);
      setRows(next); setSelectedId(next.find((row) => row.__meta.status !== 'archived')?.__id ?? next[0]?.__id ?? ''); setWeekArchiveTarget(null); setAnnouncement(`${target.weekKey} arquivada; e-mails salvos permanecem no histórico.`);
    } catch (error) { setAnnouncement(error instanceof Error ? error.message : 'Falha ao arquivar a semana.'); }
  };
  const saveCurrent = async (ready: boolean) => {
    if (!selected) return;
    const group = rows.filter((row) => row.__meta.campaignGroupId === selected.__meta.campaignGroupId && row.__meta.status !== 'archived').map((row) => ({ ...row, __meta: { ...row.__meta, status: ready ? 'ready' as const : 'draft' as const, version: row.__meta.savedAt ? row.__meta.version + 1 : row.__meta.version } }));
    try { const saved = await Promise.all(group.map((row) => saveBriefing(row, (issuesByRow.get(row.__id) ?? []).map((issue) => issue.message)))); setRows((current) => current.map((row) => saved.find((item) => item.__id === row.__id) ?? row)); setSyncState('Sincronizado com o GaaS'); setAnnouncement('Briefing e histórico de versão salvos.'); setSaveOpen(false); }
    catch (error) { setSyncState('Rascunho local — falha ao sincronizar'); setAnnouncement(error instanceof Error ? error.message : 'Falha ao salvar.'); }
  };
  const changeVariantStatus = async (target: WorkspaceBriefing, status: 'draft' | 'archived') => {
    if (status === 'archived' && !target.__meta.savedAt) {
      const remaining = rows.filter((row) => row.__id !== target.__id);
      setRows(remaining); setSelectedId(remaining.find((row) => row.__meta.campaignGroupId === target.__meta.campaignGroupId)?.__id ?? remaining[0]?.__id ?? '');
      setAnnouncement('Variação ainda não salva removida do rascunho.');
      return;
    }
    const changed = { ...target, __meta: { ...target.__meta, status, version: target.__meta.version + 1 } };
    try { const saved = await saveBriefing(changed, [status === 'archived' ? 'Assinatura desativada neste e-mail.' : 'Assinatura restaurada neste e-mail.']); setRows((current) => current.map((row) => row.__id === saved.__id ? saved : row)); if (status === 'archived') setSelectedId(rows.find((row) => row.__meta.campaignGroupId === target.__meta.campaignGroupId && row.__id !== target.__id && row.__meta.status !== 'archived')?.__id ?? target.__id); setAnnouncement(status === 'archived' ? 'Assinatura arquivada neste e-mail; o histórico foi preservado.' : 'Assinatura restaurada neste e-mail.'); }
    catch (error) { setAnnouncement(error instanceof Error ? error.message : 'Falha ao atualizar a assinatura.'); }
  };
  const changeGlobalSignature = async (setting: SignatureSetting, status: 'active' | 'inactive') => {
    try {
      const savedSetting = await saveSignatureSetting({ ...setting, status, effectiveFrom: status === 'inactive' ? new Date().toISOString().slice(0, 10) : undefined });
      setSignatureSettings((current) => [...current.filter((item) => !(item.partner === savedSetting.partner && item.signatureKey === savedSetting.signatureKey)), savedSetting]);
      if (status === 'inactive') {
        const targets = rows.filter((row) => row.__meta.partner === setting.partner && row.NM_PRODUTO_INTERNO.toUpperCase() === setting.signatureKey && row.__meta.status !== 'archived');
        const archived = await Promise.all(targets.filter((row) => row.__meta.savedAt).map((row) => saveBriefing({ ...row, __meta: { ...row.__meta, status: 'archived', version: row.__meta.version + 1 } }, ['Assinatura desativada globalmente.'])));
        setRows((current) => current.filter((row) => !targets.some((target) => target.__id === row.__id && !target.__meta.savedAt)).map((row) => archived.find((item) => item.__id === row.__id) ?? row));
      }
      setAnnouncement(status === 'inactive' ? `${setting.signatureLabel} desativada para novos e-mails Plurix; variações existentes foram arquivadas.` : `${setting.signatureLabel} reativada para novos e-mails Plurix.`);
    } catch (error) { setAnnouncement(error instanceof Error ? error.message : 'Falha ao atualizar a governança da assinatura.'); }
  };
  const addSignatureToSelectedGroup = (signatureKey: string) => {
    if (!selected) return;
    const next = ensurePlurixVariants(rows, selected.__id, PLURIX_SIGNATURES.filter((item) => item.key !== signatureKey).map((item) => item.key));
    setRows(next);
    const created = next.find((row) => row.__meta.campaignGroupId === selected.__meta.campaignGroupId && row.NM_PRODUTO_INTERNO.toUpperCase() === signatureKey && row.__meta.status !== 'archived');
    if (created) setSelectedId(created.__id);
    setAnnouncement('Assinatura adicionada ao e-mail como rascunho.');
  };
  const openRenderedPreview = (print = false) => {
    if (!selected || render.diagnostics.length) { setAnnouncement('Corrija a prévia antes de abri-la.'); return; }
    const popup = window.open('', '_blank');
    if (!popup) { setAnnouncement('O navegador bloqueou a nova aba. Libere pop-ups para o GaaS e tente novamente.'); return; }
    popup.opener = null;
    popup.document.open(); popup.document.write(render.html); popup.document.close();
    if (print) {
      const printReady = async () => {
        await popup.document.fonts?.ready;
        await Promise.race([Promise.all([...popup.document.images].map((image) => image.complete ? Promise.resolve() : new Promise<void>((resolve) => { image.addEventListener('load', () => resolve(), { once: true }); image.addEventListener('error', () => resolve(), { once: true }); }))), new Promise((resolve) => window.setTimeout(resolve, 10000))]);
        popup.focus(); popup.print();
      };
      if (popup.document.readyState === 'complete') void printReady(); else popup.addEventListener('load', () => void printReady(), { once: true });
      setAnnouncement('Prévia aberta. Escolha “Salvar como PDF” na janela de impressão.');
    } else setAnnouncement('Prévia aberta em uma nova aba.');
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
          <HeaderMetric icon={<Inbox size={16}/>} value={activeEditorialGroupCount} label={activeEditorialGroupCount === 1 ? 'e-mail editorial' : 'e-mails editoriais'}/>
          <HeaderMetric icon={<Copy size={16}/>} value={activeRows.length} label="variantes ativas"/>
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
            <HeaderAction onClick={() => openNewBriefing()} icon={<Plus size={15}/>} label="Novo"/>
            <HeaderAction onClick={() => setDeleteOpen(true)} disabled={!selected} icon={<Trash2 size={15}/>} label="Excluir" danger/>
            <button disabled={!!technicalErrorCount || !rows.length} onClick={exportCsv} className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-cyan-400 px-3 py-2 text-xs font-bold text-slate-950 outline-none transition hover:bg-cyan-300 focus-visible:ring-2 focus-visible:ring-white disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-white/50"><Download size={15}/>Exportar CSV</button>
          </div>}
        </div>
      </div>
    </header>

    {mode === 'template' ? <TemplateSourceWorkspace slots={templateSlots} selectedId={effectiveSelectedId} principalId={effectivePrincipalId} source={template} fileRef={templateFileRef} onSelect={selectTemplateSlot} onSourceChange={setTemplate} onRename={(id, name) => setTemplateSlots((current) => current.map((slot) => slot.id === id ? { ...slot, name } : slot))} onSave={saveTemplate} onCreate={createTemplateSlot} onUpload={(file) => void uploadTemplate(file)} onDuplicate={duplicateTemplateSlot} onDelete={deleteTemplateSlot} onMakePrincipal={makeTemplatePrincipal}/> : mode === 'library' ? <AssetLibrary assets={assets} setAssets={setAssets} taxonomy={taxonomy}/> :
    <main className="pt-4">
      {importMessages.length > 0 && <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900" role="status">{importMessages.map((message) => <div key={message}>{message}</div>)}</div>}

      <div className="grid min-h-[720px] gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" aria-label="Caixa de briefings">
          <div className="border-b border-slate-200 p-3.5">
            <div className="flex items-center justify-between gap-2"><div><h2 className="font-bold text-slate-900">Caixa de briefings</h2><p className="text-xs text-slate-500">{filteredGroups.length} de {activeEditorialGroupCount} e-mails · {activeRows.length} variantes ativas</p></div><Inbox className="text-cyan-700" size={18}/></div>
            <label className="mt-3 flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-slate-500 focus-within:border-cyan-400 focus-within:bg-white">
              <Search size={15}/><span className="sr-only">Buscar briefings</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar parceiro, campanha..." className="min-w-0 flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"/>
            </label>
            <div className="mt-2 flex flex-wrap gap-1" aria-label="Filtrar briefings por status">
              {([['all', 'Todos'], ['ready', 'Prontos'], ['needs-review', 'Com ajustes']] as const).map(([value, label]) => <button key={value} onClick={() => setStatusFilter(value)} className={`min-h-8 rounded-md px-2.5 text-xs font-semibold outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ${statusFilter === value ? 'bg-cyan-100 text-cyan-800' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'}`}>{label}</button>)}
              <button onClick={() => setShowArchived((value) => !value)} aria-pressed={showArchived} className={`min-h-8 rounded-md px-2.5 text-xs font-semibold outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ${showArchived ? 'bg-slate-700 text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'}`}>Arquivadas</button>
            </div>
          </div>
          <div className="max-h-[790px] overflow-y-auto p-2.5">
            <div className="mb-2 rounded-lg bg-slate-50 px-3 py-2 text-[11px] font-semibold text-slate-500">Parceiro › segmento › semana › e-mail › assinaturas</div>
            {filteredGroups.length ? <BriefingTree groups={filteredGroups} selectedId={selected?.__id ?? ''} showArchived={showArchived} onSelect={setSelectedId} onManage={(id) => { const target = rows.find((row) => row.__meta.campaignGroupId === id && row.__meta.status !== 'archived') ?? rows.find((row) => row.__meta.campaignGroupId === id); if (target) setSelectedId(target.__id); setSignatureManagerOpen(true); }} onNewEmail={(segment, weekKey) => openNewBriefing(segment, weekKey)} onDuplicateWeek={duplicateWeek} onArchiveWeek={(partner, segment, weekKey) => setWeekArchiveTarget({ partner, segment, weekKey })} onDuplicateEmail={duplicateGroup} onArchiveEmail={(groupId) => { const target = rows.find((row) => row.__meta.campaignGroupId === groupId && row.__meta.status !== 'archived'); if (target) { setSelectedId(target.__id); setDeleteOpen(true); } }}/> : <div className="px-4 py-10 text-center text-sm text-slate-500"><Search className="mx-auto mb-2 text-slate-300" size={24}/><p className="font-semibold text-slate-700">Nenhum briefing encontrado</p><p className="mt-1 text-xs">Ajuste a busca ou o filtro de status.</p></div>}
          </div>
        </aside>

        <Group id="email-editor-preview" orientation="horizontal" defaultLayout={defaultLayout ?? { editor: 58, preview: 42 }} onLayoutChanged={onLayoutChanged} className="min-w-0 overflow-hidden rounded-2xl" resizeTargetMinimumSize={{ coarse: 20, fine: 10 }}>
          <Panel id="editor" defaultSize="58%" minSize="32%" className="min-w-0">
        {selected ? <section id="email-editor-panel" className="h-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" aria-label="Editor do briefing selecionado">
          <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-4 py-3.5 backdrop-blur">
            <div className="flex flex-wrap items-start justify-between gap-2"><div><h2 className="font-bold text-slate-900">{selected.__meta.partner || 'Parceiro pendente'} · {selected.__meta.segment || 'Segmento pendente'} · {selected.SEQUENCIA || 'Sequência pendente'}</h2><p className="mt-0.5 text-xs text-slate-500">Assinatura em edição: <b>{selected.__meta.subgroup || selected.NM_PRODUTO_INTERNO}</b> · {syncState} · versão {selected.__meta.version}</p></div><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${selected.__meta.status === 'archived' ? 'bg-slate-200 text-slate-700' : selectedIssues.some((issue) => issue.severity === 'error') ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>{selected.__meta.status === 'archived' ? 'Arquivada · somente leitura' : selectedIssues.filter((issue) => issue.severity === 'error').length ? `${selectedIssues.filter((issue) => issue.severity === 'error').length} ajustes necessários` : 'Pronto para exportar'}</span></div>
          </div>
          <div className="max-h-[790px] overflow-y-auto p-3.5">
            <section className="mb-3 rounded-xl border border-cyan-100 bg-cyan-50/60 p-3" aria-label="Organização e auditoria">
              <div className="mb-2 text-xs font-bold uppercase tracking-wide text-cyan-800">Organização e auditoria</div>
              <div className="grid gap-2 md:grid-cols-2">
                <TaxonomySelect label="Parceiro" value={selected.__meta.partner} options={taxonomyOptions.partners} onChange={(value) => updateGroupMeta({ partner: value, segment: '', weekKey: '', activityNames: [], ...(value !== 'Plurix' ? { subgroup: '' } : {}) })}/>
                <TaxonomySelect label="Segmento" value={selected.__meta.segment} options={taxonomyOptions.segments} onChange={(value) => updateGroupMeta({ segment: value, activityNames: [] })}/>
                <TaxonomySelect label="Assinatura / subgrupo" value={selected.__meta.subgroup} options={taxonomyOptions.subgroups} onChange={(value) => updateSelected({ __meta: { ...selected.__meta, subgroup: value } })}/>
                <TaxonomySelect label="Semana editorial" value={selected.__meta.weekKey} options={taxonomyOptions.weeks} onChange={(value) => updateGroupMeta({ weekKey: value })}/>
              </div>
              <div className="mt-2"><ActivityNameSelect value={selected.__meta.activityNames[0] ?? ''} options={taxonomyOptions.activityNames} onChange={(value) => updateSelected({ __meta: { ...selected.__meta, activityNames: value ? [value] : [] } })}/></div>
              {taxonomyState === 'loading' && <p className="mt-2 text-xs text-slate-500">Carregando opções da tabela activities…</p>}
              {taxonomyState === 'error' && <div className="mt-2 flex items-center justify-between gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800"><span>Não foi possível carregar a taxonomia de activities.</span><button type="button" onClick={() => void refreshTaxonomy()} className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 font-bold"><RefreshCw size={12}/>Tentar novamente</button></div>}
            </section>
            {selectedIssues.length > 0 && <div className="mb-3 space-y-2">{selectedIssues.map((issue, index) => <div key={`${issue.code}-${issue.field}-${index}`} className={`flex items-start justify-between gap-3 rounded-lg border px-3 py-2 text-xs ${issue.severity === 'error' ? 'border-red-200 bg-red-50 text-red-900' : 'border-amber-200 bg-amber-50 text-amber-900'}`}><span>{issue.message}</span>{issue.fix && <button onClick={() => fixIssue(issue)} className="shrink-0 rounded-md bg-white px-2 py-1 font-bold shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"><Wand2 className="mr-1 inline" size={12}/>Corrigir</button>}</div>)}</div>}

            <label className="mb-3 flex min-h-11 items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700"><input type="checkbox" checked={!!selected.__journeyConfirmed} onChange={(event) => updateSelected({ __journeyConfirmed: event.target.checked })} className="mt-0.5 h-4 w-4 accent-cyan-600"/><span><b>Jornada conferida no SFMC</b><br/><span className="text-xs text-slate-500">Confirma que esta campanha e sequência estão habilitadas para entrada.</span></span></label>
            <SignatureMatrix rows={rows} selected={selected} onEnsure={() => setRows((current) => ensurePlurixVariants(current, selected.__id, signatureSettings.filter((item) => item.status === 'inactive').map((item) => item.signatureKey)))} onSelect={setSelectedId} onManage={() => setSignatureManagerOpen(true)}/>

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
            <div className="mt-4 border-t border-slate-200 pt-4"><button type="button" disabled={selected.__meta.status === 'archived'} onClick={() => setSaveOpen(true)} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#07595b] px-4 py-3 text-sm font-bold text-white outline-none transition hover:bg-[#064c4e] focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300"><Save size={17}/>{selected.__meta.status === 'archived' ? 'Variante arquivada' : 'Salvar briefing'}</button><p className="mt-2 text-center text-xs text-slate-500">{selected.__meta.status === 'archived' ? 'Restaure esta assinatura no gerenciador para voltar a editá-la.' : 'Salve o rascunho ou marque como pronto depois de revisar todos os blocos.'}</p></div>
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
                <div className="flex items-start justify-between gap-3"><div><div className="flex items-center gap-2"><h2 className="font-bold text-slate-900">Prévia do e-mail</h2><span className="rounded-full bg-cyan-50 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-cyan-700">Simulação local</span></div><p className="mt-0.5 text-xs leading-4 text-slate-500">Confira o conteúdo com dados de teste. Antes do envio, valide pelo Test Send do SFMC.</p></div><div className="flex shrink-0 flex-wrap justify-end gap-2"><button onClick={() => openRenderedPreview()} disabled={!selected || render.diagnostics.length > 0} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none transition hover:border-cyan-300 hover:text-cyan-800 focus-visible:ring-2 focus-visible:ring-cyan-500 disabled:opacity-50"><ExternalLink size={15}/>Abrir em nova aba</button><button onClick={() => openRenderedPreview(true)} disabled={!selected || render.diagnostics.length > 0} title="Abre a impressão do navegador para salvar a prévia completa em PDF" className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none transition hover:border-cyan-300 hover:text-cyan-800 focus-visible:ring-2 focus-visible:ring-cyan-500 disabled:opacity-50"><Printer size={15}/>Salvar em PDF</button><button onClick={() => setPreviewOpen(true)} disabled={!selected} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none transition hover:border-cyan-300 hover:text-cyan-800 focus-visible:ring-2 focus-visible:ring-cyan-500 disabled:opacity-50"><Maximize2 size={15}/>Ampliar</button></div></div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-[minmax(180px,1.25fr)_minmax(120px,0.75fr)_minmax(120px,0.75fr)]">
                  <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Template da prévia
                    <span className="mt-1 flex h-9 items-center rounded-lg border border-slate-200 bg-white px-2 focus-within:border-cyan-400">
                      <select value={effectivePrincipalId} onChange={(event) => { const id = event.target.value; setSelectedTemplateId(id); makeTemplatePrincipal(id); }} className="min-w-0 flex-1 bg-transparent text-xs font-semibold text-slate-700 outline-none" aria-label="Template principal da prévia">
                        {templateSlots.map((slot) => <option key={slot.id} value={slot.id}>{slot.name}</option>)}
                      </select>
                      <button type="button" onClick={() => { setSelectedTemplateId(effectivePrincipalId); setMode('template'); }} className="ml-1 rounded-md p-1.5 text-cyan-700 hover:bg-cyan-50" aria-label="Editar AMPscript completo do template selecionado" title="Editar HTML e AMPscript completo"><Code2 size={14}/></button>
                    </span>
                  </label>
                  <MiniInput label="Nome de teste" value={subscriber.PRI_NOME} onChange={(value) => setSubscriber((current) => ({ ...current, PRI_NOME: value }))}/>
                  <MiniInput label="Limite de teste" value={subscriber.LIMITE} onChange={(value) => setSubscriber((current) => ({ ...current, LIMITE: value }))}/>
                </div>
              </div>
              {selected && <div className="border-b border-slate-200 bg-slate-50 px-4 py-3"><div className="flex items-start gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-900 text-white"><Mail size={16}/></span><div className="min-w-0"><div className="line-clamp-2 text-sm font-bold leading-5 text-slate-900">{selected.ASSUNTO || 'Assunto não preenchido'}</div><div className="mt-0.5 line-clamp-1 text-xs text-slate-500">{selected.PRE_CABECALHO || 'Sem texto de pré-visualização'}</div><div className="mt-2 text-[11px] text-slate-500">{selected.__meta.partner || 'Parceiro'} · {selected.__meta.subgroup || selected.NM_PRODUTO_INTERNO || 'Assinatura'} · {selected.__meta.segment || selected.TP_CAMPANHA || 'Segmento'} · {selected.SEQUENCIA || 'Sequência'} · Remetente definido no SFMC</div></div></div></div>}
              {render.diagnostics.length > 0 ? <div className="m-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">{render.diagnostics.map((diagnostic) => <div key={diagnostic}>{diagnostic}</div>)}</div> : <iframe title="Conteúdo renderizado do e-mail dinâmico" sandbox="" srcDoc={render.html} className="h-[650px] w-full bg-slate-100"/>}
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

    {deleteOpen && selected && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4" role="dialog" aria-modal="true" aria-labelledby="delete-email-title" onMouseDown={(event) => { if (event.target === event.currentTarget) setDeleteOpen(false); }}><div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl"><div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-red-50 text-red-600"><Trash2 size={18}/></span><div><h2 id="delete-email-title" className="font-bold text-slate-900">Arquivar este e-mail editorial?</h2><p className="mt-1 text-sm leading-5 text-slate-600"><b>{selected.__meta.partner || 'Parceiro não informado'} · {selected.SEQUENCIA || 'Sequência pendente'}</b> e suas variantes deixarão os próximos CSVs. Registros salvos permanecem no histórico; somente rascunhos nunca salvos são removidos.</p></div></div><div className="mt-5 flex justify-end gap-2"><button autoFocus onClick={() => setDeleteOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 outline-none hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-cyan-500">Cancelar</button><button onClick={() => void deleteBriefing()} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white outline-none hover:bg-red-700 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2">Arquivar e-mail</button></div></div></div>}
    {newOpen && <NewBriefingDialog groups={editorialGroups.filter((group) => group.visibleRows.length)} settings={signatureSettings} defaultSegment={newDefaults.segment} defaultWeekKey={newDefaults.weekKey} defaultSequence={`E-mail ${activeEditorialGroupCount + 1}`} onClose={() => setNewOpen(false)} onCreate={createBriefing}/>}
    {weekArchiveTarget && <div className="fixed inset-0 z-[75] grid place-items-center bg-slate-950/60 p-4" role="dialog" aria-modal="true" aria-labelledby="archive-week-title"><div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl"><h2 id="archive-week-title" className="font-bold text-slate-900">Arquivar {weekArchiveTarget.weekKey}?</h2><p className="mt-2 text-sm leading-5 text-slate-600">Todos os e-mails e variações ativos da semana sairão dos próximos CSVs. Registros já salvos continuarão no histórico.</p><div className="mt-5 flex justify-end gap-2"><button onClick={() => setWeekArchiveTarget(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700">Cancelar</button><button onClick={() => void archiveWeek(weekArchiveTarget)} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white">Arquivar semana</button></div></div></div>}
    {signatureManagerOpen && selected && <SignatureManagerModal rows={rows} selected={selected} settings={signatureSettings} onClose={() => setSignatureManagerOpen(false)} onVariantStatus={(row, status) => void changeVariantStatus(row, status)} onGlobalStatus={(setting, status) => void changeGlobalSignature(setting, status)} onAdd={addSignatureToSelectedGroup}/>}
    {saveOpen && selected && <SaveDialog selected={selected} errors={selectedGroupErrorCount} onClose={() => setSaveOpen(false)} onSave={saveCurrent} updateSelected={updateSelected}/>}
  </div>;
};

const HeaderMetric = ({ label, value, icon, tone = 'default' }: { label: string; value: number; icon: React.ReactNode; tone?: 'default' | 'success' | 'danger' | 'warning' }) => {
  const colors = { default: 'text-cyan-50', success: 'text-emerald-200', danger: 'text-red-200', warning: 'text-amber-200' };
  return <div className={`inline-flex items-center gap-2 ${colors[tone]}`}>{icon}<span className="text-lg font-extrabold text-white">{value}</span><span className="max-w-24 text-[11px] font-semibold leading-3">{label}</span></div>;
};

const HeaderAction = ({ label, icon, onClick, disabled, danger }: { label: string; icon: React.ReactNode; onClick: () => void; disabled?: boolean; danger?: boolean }) => <button onClick={onClick} disabled={disabled} title={label} className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-bold outline-none transition focus-visible:ring-2 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-40 ${danger ? 'border border-red-200/30 bg-red-500/15 text-red-100 hover:bg-red-500/25' : 'border border-white/20 bg-white/10 text-white hover:bg-white/20'}`}>{icon}<span className="hidden 2xl:inline">{label}</span><span className="sr-only 2xl:hidden">{label}</span></button>;

const TemplateSourceWorkspace = ({ slots, selectedId, principalId, source, fileRef, onSelect, onSourceChange, onRename, onSave, onCreate, onUpload, onDuplicate, onDelete, onMakePrincipal }: { slots: TemplateSlot[]; selectedId: string; principalId: string; source: string; fileRef: React.RefObject<HTMLInputElement>; onSelect: (id: string) => void; onSourceChange: (source: string) => void; onRename: (id: string, name: string) => void; onSave: () => void; onCreate: () => void; onUpload: (file?: File) => void; onDuplicate: (id: string) => void; onDelete: (id: string) => void; onMakePrincipal: (id: string) => void }) => {
  const selected = slots.find((slot) => slot.id === selectedId)!;
  return <main className="pt-4"><div className="mx-auto max-w-7xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-5"><div><div className="flex items-center gap-2"><h2 className="font-bold text-slate-900">Templates do Content Builder</h2><span className="rounded-full bg-cyan-50 px-2 py-1 text-[10px] font-bold text-cyan-800">{slots.length} {slots.length === 1 ? 'slot' : 'slots'}</span></div><p className="mt-1 text-sm text-slate-500">Teste diferentes HTMLs e AMPscript no navegador. Somente o principal alimenta a prévia dos e-mails.</p></div><div className="flex flex-wrap gap-2"><input ref={fileRef} type="file" accept=".html,.htm,.txt,text/html,text/plain" hidden onChange={(event) => { onUpload(event.target.files?.[0]); event.currentTarget.value = ''; }}/><button onClick={() => fileRef.current?.click()} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-700 hover:bg-slate-50"><Upload size={15}/>Subir HTML</button><button onClick={onCreate} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#07595b] px-3 text-xs font-bold text-white"><Plus size={15}/>Novo slot</button></div></header>
    <div className="grid min-h-[68vh] lg:grid-cols-[300px_minmax(0,1fr)]">
      <aside className="border-b border-slate-200 bg-slate-50 p-3 lg:border-b-0 lg:border-r" aria-label="Slots de template"><div className="space-y-2">{slots.map((slot) => { const principal = slot.id === principalId; const active = slot.id === selectedId; return <button type="button" key={slot.id} onClick={() => onSelect(slot.id)} className={`w-full rounded-xl border p-3 text-left outline-none transition focus-visible:ring-2 focus-visible:ring-cyan-500 ${active ? 'border-cyan-400 bg-white shadow-sm' : 'border-slate-200 bg-white/70 hover:border-slate-300'}`}><span className="flex items-start justify-between gap-2"><span className="min-w-0"><span className="block truncate text-sm font-bold text-slate-900">{slot.name}</span><span className="mt-1 block text-[10px] text-slate-500">Atualizado {new Date(slot.updatedAt).toLocaleString('pt-BR')}</span></span>{principal && <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-1 text-[9px] font-extrabold uppercase tracking-wide text-emerald-800">Principal</span>}</span></button>; })}</div></aside>
      <section className="min-w-0"><div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 p-4"><label className="min-w-[220px] flex-1 text-xs font-semibold text-slate-600">Nome do slot<input value={selected.name} onChange={(event) => onRename(selected.id, event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-900 outline-none focus:border-cyan-400"/></label><div className="flex flex-wrap justify-end gap-2"><button onClick={() => onDuplicate(selected.id)} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-700 hover:bg-slate-50"><Copy size={14}/>Duplicar</button><button onClick={() => onDelete(selected.id)} disabled={slots.length === 1} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-red-200 px-3 text-xs font-bold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"><Trash2 size={14}/>Apagar</button>{selected.id !== principalId && <button onClick={() => onMakePrincipal(selected.id)} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-cyan-300 bg-cyan-50 px-3 text-xs font-bold text-cyan-900 hover:bg-cyan-100"><CheckCircle2 size={14}/>Definir como principal para visualização</button>}<button onClick={onSave} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-cyan-600 px-3 text-xs font-bold text-white hover:bg-cyan-700"><Save size={14}/>{selected.id === principalId ? 'Salvar e aplicar' : 'Salvar slot'}</button></div></div><textarea aria-label={`Código do template ${selected.name}`} value={source} onChange={(event) => onSourceChange(event.target.value)} spellCheck={false} className="h-[58vh] min-h-[520px] w-full resize-none bg-slate-950 p-5 font-mono text-xs leading-5 text-slate-100 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-400"/></section>
    </div>
  </div></main>;
};

type TreeMenuItem = { label: string; icon: React.ReactNode; onClick: () => void; danger?: boolean };

const TreeActionMenu = ({ label, open, onToggle, items }: { label: string; open: boolean; onToggle: () => void; items: TreeMenuItem[] }) => <div className="relative shrink-0">
  <button type="button" onClick={onToggle} className="rounded-lg p-2 text-slate-500 outline-none hover:bg-white hover:text-cyan-800 focus-visible:ring-2 focus-visible:ring-cyan-500" aria-label={label} aria-expanded={open}><Settings2 size={15}/></button>
  {open && <div className="absolute right-0 top-9 z-40 w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl" role="menu">{items.map((item) => <button type="button" key={item.label} onClick={item.onClick} className={`flex min-h-9 w-full items-center gap-2 rounded-lg px-2.5 text-left text-xs font-semibold outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ${item.danger ? 'text-red-700 hover:bg-red-50' : 'text-slate-700 hover:bg-slate-50'}`} role="menuitem">{item.icon}<span>{item.label}</span></button>)}</div>}
</div>;

const BriefingTree = ({ groups, selectedId, showArchived, onSelect, onManage, onNewEmail, onDuplicateWeek, onArchiveWeek, onDuplicateEmail, onArchiveEmail }: { groups: EditorialGroup[]; selectedId: string; showArchived: boolean; onSelect: (id: string) => void; onManage: (groupId: string) => void; onNewEmail: (segment: string, weekKey: string) => void; onDuplicateWeek: (partner: string, segment: string, weekKey: string) => void; onArchiveWeek: (partner: string, segment: string, weekKey: string) => void; onDuplicateEmail: (groupId: string) => void; onArchiveEmail: (groupId: string) => void }) => {
  const [expanded, setExpanded] = useState<Set<string>>(() => { try { const saved = localStorage.getItem('gaas-email-tree-expanded-v1'); return saved ? new Set(JSON.parse(saved)) : new Set(['p:Plurix', 'p:Plurix/s:CRM', 'p:Plurix/s:CRM/w:Semana 1']); } catch { return new Set(); } });
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const toggle = (key: string) => setExpanded((current) => { const next = new Set(current); if (next.has(key)) next.delete(key); else next.add(key); localStorage.setItem('gaas-email-tree-expanded-v1', JSON.stringify([...next])); return next; });
  const branches = useMemo(() => {
    const partners = new Map<string, Map<string, Map<string, EditorialGroup[]>>>();
    groups.forEach((group) => {
      const row = group.representative;
      const partner = row.__meta.partner || 'Sem parceiro'; const segment = row.__meta.segment || 'Sem segmento'; const week = row.__meta.weekKey || 'Sem semana';
      if (!partners.has(partner)) partners.set(partner, new Map());
      if (!partners.get(partner)!.has(segment)) partners.get(partner)!.set(segment, new Map());
      const weeks = partners.get(partner)!.get(segment)!; weeks.set(week, [...(weeks.get(week) ?? []), group]);
    });
    return partners;
  }, [groups]);
  const disclosure = (key: string, label: React.ReactNode, count?: string, level = 0) => <button type="button" onClick={() => toggle(key)} aria-expanded={expanded.has(key)} className="flex min-h-9 w-full items-center gap-1.5 rounded-lg px-2 text-left text-xs font-bold text-slate-700 outline-none hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-cyan-500" style={{ paddingLeft: `${8 + level * 12}px` }}>{expanded.has(key) ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}<span className="min-w-0 flex-1 truncate">{label}</span>{count && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">{count}</span>}</button>;
  return <div className="space-y-1">{[...branches.entries()].map(([partner, segments]) => {
    const partnerKey = `p:${partner}`;
    const partnerCount = [...segments.values()].reduce((total, weeks) => total + [...weeks.values()].flat().length, 0);
    return <div key={partnerKey}>{disclosure(partnerKey, <span className="uppercase tracking-wide text-cyan-800">{partner}</span>, `${partnerCount} e-mails`)}{expanded.has(partnerKey) && [...segments.entries()].map(([segment, weeks]) => {
      const segmentKey = `${partnerKey}/s:${segment}`;
      return <div key={segmentKey}>{disclosure(segmentKey, segment, undefined, 1)}{expanded.has(segmentKey) && [...weeks.entries()].map(([week, weekGroups]) => {
        const weekKey = `${segmentKey}/w:${week}`;
        const hasActiveWeek = weekGroups.some((group) => group.rows.some((row) => row.__meta.status !== 'archived'));
        const weekMenuKey = `menu:${weekKey}`;
        const weekItems: TreeMenuItem[] = [{ label: 'Novo e-mail nesta semana', icon: <Plus size={14}/>, onClick: () => { setMenuOpen(null); onNewEmail(segment, week); } }];
        if (hasActiveWeek) weekItems.push(
          { label: 'Duplicar semana e e-mails', icon: <Copy size={14}/>, onClick: () => { setMenuOpen(null); onDuplicateWeek(partner, segment, week); } },
          { label: 'Arquivar semana', icon: <Trash2 size={14}/>, danger: true, onClick: () => { setMenuOpen(null); onArchiveWeek(partner, segment, week); } },
        );
        return <div key={weekKey}><div className="flex items-center"><div className="min-w-0 flex-1">{disclosure(weekKey, week, `${weekGroups.length}`, 2)}</div><TreeActionMenu label={`Configurar ${week}`} open={menuOpen === weekMenuKey} onToggle={() => setMenuOpen((current) => current === weekMenuKey ? null : weekMenuKey)} items={weekItems}/></div>{expanded.has(weekKey) && weekGroups.map((group) => {
          const groupKey = `${weekKey}/e:${group.id}`;
          const active = group.rows.filter((row) => row.__meta.status !== 'archived');
          const selectedGroup = group.rows.some((row) => row.__id === selectedId);
          const emailMenuKey = `menu:${groupKey}`;
          const emailItems: TreeMenuItem[] = [{ label: 'Gerenciar assinaturas', icon: <Settings2 size={14}/>, onClick: () => { setMenuOpen(null); onManage(group.id); } }];
          if (active.length) emailItems.push(
            { label: 'Duplicar e-mail', icon: <Copy size={14}/>, onClick: () => { setMenuOpen(null); onDuplicateEmail(group.id); } },
            { label: 'Arquivar e-mail', icon: <Trash2 size={14}/>, danger: true, onClick: () => { setMenuOpen(null); onArchiveEmail(group.id); } },
          );
          return <div key={group.id} className={`ml-8 mt-1 rounded-xl border ${selectedGroup ? 'border-cyan-300 bg-cyan-50' : 'border-slate-200 bg-white'}`}><div className="flex items-center gap-1 p-1"><button type="button" onClick={() => { toggle(groupKey); const target = active.find((row) => row.NM_PRODUTO_INTERNO.toUpperCase() === 'AMIGAO') ?? active[0] ?? group.rows[0]; onSelect(target.__id); }} aria-expanded={expanded.has(groupKey)} className="flex min-h-10 min-w-0 flex-1 items-center gap-2 rounded-lg px-2 text-left outline-none hover:bg-white/70 focus-visible:ring-2 focus-visible:ring-cyan-500">{expanded.has(groupKey) ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}<span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#07595b] text-[10px] font-extrabold text-white">{initials(group.representative.__meta.partner)}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold text-slate-900">{group.representative.SEQUENCIA || 'E-mail'}</span><span className="block text-[10px] text-slate-500">{active.length}/{PLURIX_SIGNATURES.length} assinaturas ativas</span></span>{group.hasErrors ? <CircleAlert size={14} className="text-red-600"/> : <CheckCircle2 size={14} className="text-emerald-600"/>}</button><TreeActionMenu label={`Configurar ${group.representative.SEQUENCIA}`} open={menuOpen === emailMenuKey} onToggle={() => setMenuOpen((current) => current === emailMenuKey ? null : emailMenuKey)} items={emailItems}/></div>{expanded.has(groupKey) && <div className="border-t border-slate-100 bg-white/70 p-1.5">{group.rows.filter((row) => showArchived || row.__meta.status !== 'archived').map((row) => <button type="button" key={row.__id} onClick={() => onSelect(row.__id)} className={`flex min-h-9 w-full items-center gap-2 rounded-lg px-2 text-left text-xs outline-none hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-cyan-500 ${row.__id === selectedId ? 'bg-cyan-100 font-bold text-cyan-950' : row.__meta.status === 'archived' ? 'text-slate-400 line-through' : 'text-slate-700'}`}><span className={`h-2 w-2 rounded-full ${row.__meta.status === 'archived' ? 'bg-slate-300' : 'bg-emerald-500'}`}/><span className="min-w-0 flex-1 truncate">{row.__meta.subgroup || row.NM_PRODUTO_INTERNO}</span><span className="text-[10px]">{row.__meta.status === 'archived' ? 'Arquivada' : 'Ativa'}</span></button>)}</div>}</div>;
        })}</div>;
      })}</div>;
    })}</div>;
  })}</div>;
};

const MiniInput = ({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) => <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}<input value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-2.5 text-xs font-normal normal-case tracking-normal text-slate-700 outline-none focus:border-cyan-400 focus-visible:ring-2 focus-visible:ring-cyan-100"/></label>;

const isPublicImageUrl = (value: string) => { try { return new URL(value).protocol === 'https:'; } catch { return false; } };

const MetaField = ({ label, value, list, onChange }: { label: string; value: string; list: string; onChange: (value: string) => void }) => <label className="text-xs font-semibold text-slate-700">{label}<input list={list} value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-400"/></label>;

const TaxonomySelect = ({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) => <label className="block text-xs font-semibold text-slate-700">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-cyan-400 focus-visible:ring-2 focus-visible:ring-cyan-100"><option value="" disabled>Selecione uma opção…</option>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>;

const ActivityNameSelect = ({ value, options, onChange }: { value: string; options: string[]; onChange: (value: string) => void }) => {
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState('');
  return <div><label className="block text-xs font-semibold text-slate-700">Activity Name para auditoria <span className="font-normal text-slate-500">(opcional, mas recomendado)</span><select value={creating ? '__new__' : value} onChange={(event) => { if (event.target.value === '__new__') { setCreating(true); setDraft(''); } else onChange(event.target.value); }} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-cyan-400 focus-visible:ring-2 focus-visible:ring-cyan-100"><option value="">Não informado (opcional)</option>{options.map((option) => <option key={option} value={option}>{option}</option>)}<option value="__new__">+ Cadastrar novo Activity Name…</option></select></label>{creating && <div className="mt-2 flex gap-2"><input autoFocus value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Digite o novo Activity Name" className="min-w-0 flex-1 rounded-lg border border-cyan-300 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"/><button type="button" disabled={!draft.trim()} onClick={() => { onChange(draft.trim()); setCreating(false); }} className="rounded-lg bg-cyan-700 px-3 py-2 text-xs font-bold text-white disabled:opacity-40">Usar</button><button type="button" onClick={() => setCreating(false)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600">Cancelar</button></div>}</div>;
};

const SignatureMatrix = ({ rows, selected, onEnsure, onSelect, onManage }: { rows: WorkspaceBriefing[]; selected: WorkspaceBriefing; onEnsure: () => void; onSelect: (id: string) => void; onManage: () => void }) => {
  const group = rows.filter((row) => row.__meta.campaignGroupId === selected.__meta.campaignGroupId);
  const isPlurix = group.some((row) => PLURIX_SIGNATURES.some(({ key }) => key === row.NM_PRODUTO_INTERNO.toUpperCase()));
  if (!isPlurix) return null;
  return <div className="mb-3 rounded-xl border border-violet-200 bg-violet-50 p-3"><div className="flex items-center justify-between gap-2"><div><b className="text-sm text-violet-950">Assinaturas Plurix</b><p className="text-xs text-violet-700">Um briefing visual; somente assinaturas ativas entram no CSV.</p></div><div className="flex gap-2"><button onClick={onEnsure} className="rounded-lg border border-violet-300 bg-white px-3 py-2 text-xs font-bold text-violet-800">Completar ativas</button><button onClick={onManage} className="inline-flex items-center gap-1 rounded-lg bg-violet-700 px-3 py-2 text-xs font-bold text-white"><Settings2 size={13}/>Gerenciar</button></div></div><div className="mt-2 flex flex-wrap gap-1.5">{PLURIX_SIGNATURES.map(({ key, label }) => { const row = group.find((item) => item.NM_PRODUTO_INTERNO.toUpperCase() === key && item.__meta.status !== 'archived'); return <button key={key} disabled={!row} onClick={() => row && onSelect(row.__id)} className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${row?.__id === selected.__id ? 'border-violet-700 bg-violet-700 text-white' : row ? 'border-violet-200 bg-white text-violet-800' : 'border-slate-200 text-slate-400'}`}>{label} {row ? '✓' : '—'}</button>; })}</div></div>;
};

const NewBriefingDialog = ({ groups, settings, defaultSegment, defaultWeekKey, defaultSequence, onClose, onCreate }: { groups: EditorialGroup[]; settings: SignatureSetting[]; defaultSegment: string; defaultWeekKey: string; defaultSequence: string; onClose: () => void; onCreate: (config: NewBriefingConfig) => void }) => {
  const available = PLURIX_SIGNATURES.filter(({ key }) => settings.find((item) => item.partner === 'Plurix' && item.signatureKey === key)?.status !== 'inactive');
  const [segment, setSegment] = useState(defaultSegment); const [weekKey, setWeekKey] = useState(defaultWeekKey); const [sequence, setSequence] = useState(defaultSequence); const [sourceGroupId, setSourceGroupId] = useState(''); const [signatureKeys, setSignatureKeys] = useState<string[]>(available.map((item) => item.key));
  const toggleSignature = (key: string) => setSignatureKeys((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key]);
  return <div className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/65 p-4" role="dialog" aria-modal="true" aria-labelledby="new-briefing-title" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl"><header className="flex items-start justify-between border-b border-slate-200 p-5"><div><h2 id="new-briefing-title" className="text-lg font-bold text-slate-900">Novo e-mail editorial Plurix</h2><p className="mt-1 text-sm text-slate-500">Escolha a organização, a origem do conteúdo e as assinaturas participantes.</p></div><button onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Fechar"><X size={19}/></button></header><div className="space-y-5 p-5"><div className="grid gap-3 sm:grid-cols-3"><label className="text-xs font-semibold text-slate-700">Segmento<select value={segment} onChange={(event) => setSegment(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"><option>CRM</option></select></label><label className="text-xs font-semibold text-slate-700">Semana editorial<select value={weekKey} onChange={(event) => setWeekKey(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">{EDITORIAL_WEEKS.map((week) => <option key={week}>{week}</option>)}</select></label><label className="text-xs font-semibold text-slate-700">Sequência<input value={sequence} onChange={(event) => setSequence(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"/></label></div><label className="block text-xs font-semibold text-slate-700">Origem do conteúdo<select value={sourceGroupId} onChange={(event) => setSourceGroupId(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"><option value="">Começar em branco</option>{groups.map((group) => <option key={group.id} value={group.id}>Duplicar {group.representative.__meta.weekKey} · {group.representative.SEQUENCIA} · {group.representative.ASSUNTO || 'sem assunto'}</option>)}</select></label><fieldset><legend className="text-xs font-semibold text-slate-700">Assinaturas deste e-mail</legend><div className="mt-2 grid gap-2 sm:grid-cols-2 md:grid-cols-3">{available.map(({ key, label }) => <label key={key} className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border px-3 text-sm font-semibold ${signatureKeys.includes(key) ? 'border-cyan-300 bg-cyan-50 text-cyan-950' : 'border-slate-200 text-slate-500'}`}><input type="checkbox" checked={signatureKeys.includes(key)} onChange={() => toggleSignature(key)} className="accent-cyan-700"/>{label}</label>)}</div>{available.length < PLURIX_SIGNATURES.length && <p className="mt-2 text-xs text-amber-800">Assinaturas desativadas globalmente não aparecem nesta criação.</p>}</fieldset></div><footer className="flex justify-end gap-2 border-t border-slate-200 p-5"><button onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700">Cancelar</button><button disabled={!segment || !weekKey || !sequence.trim() || !signatureKeys.length} onClick={() => onCreate({ segment, weekKey, sequence: sequence.trim(), sourceGroupId, signatureKeys })} className="rounded-lg bg-[#07595b] px-4 py-2 text-sm font-bold text-white disabled:opacity-40">Criar {signatureKeys.length} variações</button></footer></div></div>;
};

const SignatureManagerModal = ({ rows, selected, settings, onClose, onVariantStatus, onGlobalStatus, onAdd }: { rows: WorkspaceBriefing[]; selected: WorkspaceBriefing; settings: SignatureSetting[]; onClose: () => void; onVariantStatus: (row: WorkspaceBriefing, status: 'draft' | 'archived') => void; onGlobalStatus: (setting: SignatureSetting, status: 'active' | 'inactive') => void; onAdd: (signatureKey: string) => void }) => {
  const group = rows.filter((row) => row.__meta.campaignGroupId === selected.__meta.campaignGroupId);
  return <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/65 p-4" role="dialog" aria-modal="true" aria-labelledby="signature-manager-title" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><div className="flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"><header className="flex items-start justify-between gap-3 border-b border-slate-200 p-5"><div><h2 id="signature-manager-title" className="text-lg font-bold text-slate-900">Gerenciar assinaturas</h2><p className="mt-1 text-sm text-slate-500">{selected.__meta.partner} · {selected.__meta.weekKey} · {selected.SEQUENCIA}. Desativar preserva o histórico e retira a variante dos próximos CSVs.</p></div><button autoFocus onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Fechar gerenciador"><X size={19}/></button></header><div className="overflow-y-auto p-5"><div className="overflow-hidden rounded-xl border border-slate-200">{PLURIX_SIGNATURES.map(({ key, label }) => { const setting = settings.find((item) => item.partner === 'Plurix' && item.signatureKey === key) ?? { partner: 'Plurix', signatureKey: key, signatureLabel: label, status: 'active' as const }; const row = group.find((item) => item.NM_PRODUTO_INTERNO.toUpperCase() === key); const globalInactive = setting.status === 'inactive'; const variantArchived = row?.__meta.status === 'archived'; return <div key={key} className="grid gap-3 border-b border-slate-100 p-4 last:border-b-0 md:grid-cols-[minmax(150px,1fr)_minmax(170px,0.8fr)_auto]"><div className="flex items-center gap-3"><span className={`h-2.5 w-2.5 rounded-full ${globalInactive ? 'bg-slate-300' : variantArchived || !row ? 'bg-amber-400' : 'bg-emerald-500'}`}/><div><div className="font-bold text-slate-900">{label}</div><div className="text-xs text-slate-500">{globalInactive ? 'Inativa para novos e-mails Plurix' : variantArchived ? 'Arquivada neste e-mail' : row ? 'Ativa neste e-mail' : 'Não adicionada neste e-mail'}</div></div></div><div className="text-xs text-slate-500">{setting.effectiveFrom && globalInactive ? `Desativada desde ${new Date(`${setting.effectiveFrom}T12:00:00`).toLocaleDateString('pt-BR')}` : globalInactive ? 'Desativada globalmente' : 'Disponível globalmente'}</div><div className="flex flex-wrap justify-end gap-2">{globalInactive ? <button type="button" onClick={() => onGlobalStatus(setting, 'active')} className="rounded-lg border border-emerald-300 px-3 py-2 text-xs font-bold text-emerald-800">Reativar na Plurix</button> : <>{!row && <button type="button" onClick={() => onAdd(key)} className="rounded-lg bg-cyan-700 px-3 py-2 text-xs font-bold text-white">Adicionar ao e-mail</button>}{row && variantArchived && <button type="button" onClick={() => onVariantStatus(row, 'draft')} className="rounded-lg border border-cyan-300 px-3 py-2 text-xs font-bold text-cyan-800">Restaurar neste e-mail</button>}{row && !variantArchived && <button type="button" onClick={() => onVariantStatus(row, 'archived')} className="rounded-lg border border-amber-300 px-3 py-2 text-xs font-bold text-amber-900">Desativar neste e-mail</button>}<button type="button" onClick={() => onGlobalStatus(setting, 'inactive')} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-700">Desativar na Plurix</button></>}</div></div>; })}</div><div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600"><b>Regra de segurança:</b> variações nunca salvas são removidas do rascunho. Variações com histórico são arquivadas e continuam disponíveis no filtro <b>Arquivadas</b>.</div></div></div></div>;
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
