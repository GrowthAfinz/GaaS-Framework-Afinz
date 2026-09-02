import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Group, Panel, Separator, useDefaultLayout } from 'react-resizable-panels';
import { getLocalViewport, toLocalRect } from '../../../context/UIScaleContext';
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
  Info,
  LayoutPanelLeft,
  ListChecks,
  Mail,
  MessageSquareText,
  Maximize2,
  Plus,
  Printer,
  RefreshCw,
  Save,
  Search,
  Settings2,
  ShieldAlert,
  TableProperties,
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
import { PLURIX_V8_TEMPLATE, PLURIX_V8_TEMPLATE_ID, PLURIX_V8_TEMPLATE_NAME } from '../fixtures/plurixV8Template';
import { B2C_CLASSIC_VIBE_DYNAMIC_TEMPLATE, B2C_CLASSIC_VIBE_DYNAMIC_TEMPLATE_ID } from '../fixtures/b2cClassicVibeDynamicTemplate';
import { applyWorkspaceField, ensurePlurixVariants, normalizeLegacyRows, partnerLabel, PLURIX_SIGNATURES, withMeta, type ActivityTaxonomy, type EmailAsset, type EmailTemplateSlot, type LegalText, type SignatureSetting, type WorkspaceBriefing } from '../domain/workspace';
import { projectMarketingPreview } from '../domain/previewProjection';
import { deleteTemplateSlot as deleteSharedTemplateSlot, loadActivityTaxonomy, loadAssets, loadBriefings, loadLegalTexts, loadSignatureSettings, migrateLocalTemplateSlots, onlyCsvRows, recordExport, saveAsset, saveBriefing, saveBriefings, saveDraftEmailFactorySegment, saveSignatureSetting, saveTemplateSlot, setPrincipalTemplateSlot } from '../services/workspaceService';
import { countConfiguredStrategyFields, STRATEGY_FIELD_COUNT, strategyReadiness, type EmailStrategy, type ExternalReviewRun, type ExternalSuggestion, type ProductContext, type ProductGuardrail } from '../domain/management';
import { createRulerManagementPlan, decideExternalSuggestion, loadEmailStrategies, loadExternalReviews, loadProductGovernance, saveEmailStrategy } from '../services/managementService';
import { exportStrategyPlanXlsx } from '../export/strategyPlanXlsx';
import { CreateRulerDialog, type CreateRulerConfig } from './CreateRulerDialog';
import { EmailPreviewFrame, emailPreviewContextKey } from './EmailPreviewFrame';

const TEMPLATE_KEY = 'gaas-dynamic-email-template-v1';
const TEMPLATE_SLOTS_KEY = 'gaas-dynamic-email-template-slots-v5';
const LEGACY_TEMPLATE_SLOTS_KEY = 'gaas-dynamic-email-template-slots-v4';
const OLDER_TEMPLATE_SLOTS_KEYS = ['gaas-dynamic-email-template-slots-v3', 'gaas-dynamic-email-template-slots-v2'];
const PRIMARY_TEMPLATE_KEY = 'gaas-dynamic-email-primary-template-v2';
const ROWS_KEY = 'gaas-dynamic-email-briefings-v1';
const SAMPLE: SubscriberSample = { CPF: '00000000000', PRI_NOME: 'VANIA', LIMITE: 'R$ 3.500', PRODUTO: 'INSTITUCIONAL', SEQUENCIA: 'E-mail 1', TP_CAMPANHA: 'Repescagem' };
const LONG_FIELDS = new Set<BriefingColumn>(['COPY_1_PRETO', 'COPY_2_PRETO', 'NOTA_LEGAL', 'RODAPE', 'PRE_CABECALHO']);
const COLOR_FIELDS = new Set<BriefingColumn>(['COR_COPY_1', 'COR_COPY_PRETO_1', 'COR_TITULO_COPY_2', 'COR_COPY_2', 'COR_NOTA_LEGAL']);
const EDITORIAL_WEEKS = Array.from({ length: 12 }, (_, index) => `Semana ${index + 1}`);

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
type WeekSelection = { partner: string; segment: string; weekKey: string };
type SegmentSelection = { partner: string; segment: string };
type ReviewerSelection = SegmentSelection & { weekKey?: string };
type NewBriefingConfig = { partner: string; segment: string; weekKey: string; sequence: string; sourceGroupId: string; signatureKeys: string[] };
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
  anchor.style.display = 'none';
  // O anchor precisa estar no DOM e o revoke precisa ser adiado: o Chrome busca
  // o blob de forma assíncrona e um revoke síncrono cancela o download silenciosamente.
  document.body.appendChild(anchor);
  anchor.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
    anchor.remove();
  }, 0);
}

const initials = (value: string) => (value.trim().slice(0, 2) || '—').toUpperCase();
const segmentDisplayLabel = (value: string) => value === 'Base_Proprietaria' ? 'Topo de Funil (Base Proprietária)' : value === 'CRM' ? 'Topo de Funil (CRM)' : value;
const naturalLabelSort = (a: string, b: string) => a.localeCompare(b, 'pt-BR', { numeric: true, sensitivity: 'base' });
const initialTemplateSlots = (): EmailTemplateSlot[] => {
  const storedPrincipalId = localStorage.getItem(PRIMARY_TEMPLATE_KEY) ?? '';
  const normalize = (slots: Array<Partial<EmailTemplateSlot> & Pick<EmailTemplateSlot, 'id' | 'name' | 'source'>>): EmailTemplateSlot[] => {
    const principalId = slots.some((slot) => slot.id === storedPrincipalId) ? storedPrincipalId : slots[0]?.id;
    return slots.map((slot) => ({ ...slot, isPrincipal: slot.id === principalId, version: Number(slot.version ?? 1), updatedAt: slot.updatedAt ?? new Date().toISOString() }));
  };
  try {
    const stored = JSON.parse(localStorage.getItem(TEMPLATE_SLOTS_KEY) ?? 'null');
    if (Array.isArray(stored) && stored.length) return normalize(stored);
  } catch { /* migra para o slot inicial abaixo */ }
  let migrated: EmailTemplateSlot[] = [];
  try {
    const legacy = JSON.parse(localStorage.getItem(LEGACY_TEMPLATE_SLOTS_KEY) ?? 'null');
    if (Array.isArray(legacy) && legacy.length) migrated = legacy;
  } catch { /* usa o template principal legado abaixo */ }
  if (!migrated.length) {
    for (const key of OLDER_TEMPLATE_SLOTS_KEYS) {
      try {
        const older = JSON.parse(localStorage.getItem(key) ?? 'null');
        if (Array.isArray(older) && older.length) { migrated = older; break; }
      } catch { /* tenta a versão anterior */ }
    }
  }
  if (!migrated.length) migrated = [{ id: crypto.randomUUID(), name: 'Template principal', source: localStorage.getItem(TEMPLATE_KEY) ?? DEFAULT_DYNAMIC_EMAIL_TEMPLATE, isPrincipal: true, version: 1, updatedAt: new Date().toISOString() }];
  const refreshed = migrated.map((slot) => slot.id === PLURIX_UX_V2_TEMPLATE_ID
    ? { ...slot, name: 'Plurix aquisição UX v2', source: PLURIX_UX_V2_TEMPLATE, updatedAt: '2026-08-19T18:00:00.000Z' }
    : slot.id === PLURIX_V8_TEMPLATE_ID
      ? { ...slot, name: PLURIX_V8_TEMPLATE_NAME, source: PLURIX_V8_TEMPLATE, updatedAt: '2026-09-02T16:00:00.000Z' }
    : slot.id === B2C_CLASSIC_VIBE_DYNAMIC_TEMPLATE_ID
      ? { ...slot, name: 'B2C Classic + Vibe · Dinâmico', source: B2C_CLASSIC_VIBE_DYNAMIC_TEMPLATE, updatedAt: '2026-09-01T12:00:00.000Z' }
      : slot);
  const withPlurix = refreshed.some((slot) => slot.id === PLURIX_UX_V2_TEMPLATE_ID) ? refreshed : [...refreshed, { id: PLURIX_UX_V2_TEMPLATE_ID, name: 'Plurix aquisição UX v2', source: PLURIX_UX_V2_TEMPLATE, isPrincipal: false, version: 1, updatedAt: '2026-08-19T18:00:00.000Z' }];
  return normalize(withPlurix.some((slot) => slot.id === B2C_CLASSIC_VIBE_DYNAMIC_TEMPLATE_ID) ? withPlurix : [...withPlurix, { id: B2C_CLASSIC_VIBE_DYNAMIC_TEMPLATE_ID, name: 'B2C Classic + Vibe · Dinâmico', source: B2C_CLASSIC_VIBE_DYNAMIC_TEMPLATE, isPrincipal: false, version: 1, updatedAt: '2026-09-01T12:00:00.000Z' }]);
};

export const DynamicEmailWorkspace: React.FC = () => {
  const [rows, setRows] = useState<WorkspaceBriefing[]>(() => { try { return normalizeLegacyRows(JSON.parse(localStorage.getItem(ROWS_KEY) ?? 'null') ?? demoRows()); } catch { return normalizeLegacyRows(demoRows()); } });
  const [selectedId, setSelectedId] = useState(rows[0]?.__id ?? '');
  const initialSlotsRef = useRef<EmailTemplateSlot[]>(initialTemplateSlots());
  const [templateSlots, setTemplateSlots] = useState<EmailTemplateSlot[]>(initialSlotsRef.current);
  const [principalTemplateId, setPrincipalTemplateId] = useState(() => initialSlotsRef.current.find((slot) => slot.isPrincipal)?.id ?? initialSlotsRef.current[0].id);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const effectivePrincipalId = templateSlots.some((slot) => slot.id === principalTemplateId) ? principalTemplateId : templateSlots[0].id;
  const effectiveSelectedId = templateSlots.some((slot) => slot.id === selectedTemplateId) ? selectedTemplateId : effectivePrincipalId;
  const selectedTemplateSlot = templateSlots.find((slot) => slot.id === effectiveSelectedId)!;
  const [template, setTemplate] = useState(() => initialSlotsRef.current.find((slot) => slot.isPrincipal)?.source ?? initialSlotsRef.current[0].source);
  const [savedTemplate, setSavedTemplate] = useState(() => initialSlotsRef.current.find((slot) => slot.isPrincipal)?.source ?? initialSlotsRef.current[0].source);
  const [templateSyncState, setTemplateSyncState] = useState('Carregando catálogo compartilhado…');
  const [mode, setMode] = useState<'briefings' | 'strategy' | 'reviews' | 'library' | 'template'>('briefings');
  const [emailStrategies, setEmailStrategies] = useState<EmailStrategy[]>([]);
  const [productContexts, setProductContexts] = useState<ProductContext[]>([]);
  const [productGuardrails, setProductGuardrails] = useState<ProductGuardrail[]>([]);
  const [reviewRuns, setReviewRuns] = useState<ExternalReviewRun[]>([]);
  const [reviewSuggestions, setReviewSuggestions] = useState<ExternalSuggestion[]>([]);
  const [managementState, setManagementState] = useState('Carregando camada gerencial…');
  const [assets, setAssets] = useState<EmailAsset[]>([]);
  const [legalTexts, setLegalTexts] = useState<LegalText[]>([]);
  const [taxonomy, setTaxonomy] = useState<ActivityTaxonomy[]>([]);
  const [signatureSettings, setSignatureSettings] = useState<SignatureSetting[]>(PLURIX_SIGNATURES.map(({ key, label }) => ({ partner: 'Plurix', signatureKey: key, signatureLabel: label, status: 'active' })));
  const [taxonomyState, setTaxonomyState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [saveOpen, setSaveOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const savingRef = useRef(false);
  const [syncState, setSyncState] = useState('Carregando dados compartilhados…');
  const [subscriber, setSubscriber] = useState<SubscriberSample>(SAMPLE);
  const [importMessages, setImportMessages] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ready' | 'needs-review'>('all');
  const [announcement, setAnnouncement] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [showMarketingNotes, setShowMarketingNotes] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [signatureManagerOpen, setSignatureManagerOpen] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const [rulerOpen, setRulerOpen] = useState(false);
  const [newDefaults, setNewDefaults] = useState({ partner: 'Plurix', segment: 'CRM', weekKey: 'Semana 1' });
  const [selectedWeek, setSelectedWeek] = useState<WeekSelection | null>(null);
  const [selectedSegment, setSelectedSegment] = useState<SegmentSelection | null>(null);
  const [weekArchiveTarget, setWeekArchiveTarget] = useState<{ partner: string; segment: string; weekKey: string } | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const templateFileRef = useRef<HTMLInputElement>(null);
  const { defaultLayout: workspaceDefaultLayout, onLayoutChanged: onWorkspaceLayoutChanged } = useDefaultLayout({ id: 'gaas-email-briefing-workspace-v1', storage: localStorage });
  const { defaultLayout, onLayoutChanged } = useDefaultLayout({ id: 'gaas-email-editor-preview-v1', storage: localStorage });

  useEffect(() => { localStorage.setItem(ROWS_KEY, JSON.stringify(rows)); }, [rows]);
  useEffect(() => {
    localStorage.setItem(TEMPLATE_SLOTS_KEY, JSON.stringify(templateSlots));
    localStorage.setItem(PRIMARY_TEMPLATE_KEY, effectivePrincipalId);
  }, [effectivePrincipalId, templateSlots]);
  useEffect(() => { setTemplate(selectedTemplateSlot.source); }, [effectiveSelectedId]);
  useEffect(() => { setSavedTemplate(templateSlots.find((slot) => slot.id === effectivePrincipalId)?.source ?? DEFAULT_DYNAMIC_EMAIL_TEMPLATE); }, [effectivePrincipalId, templateSlots]);
  const refreshManagement = async () => {
    setManagementState('Atualizando camada gerencial…');
    const [strategiesResult, governanceResult, reviewsResult] = await Promise.allSettled([loadEmailStrategies(), loadProductGovernance(), loadExternalReviews()]);
    if (strategiesResult.status === 'fulfilled') setEmailStrategies(strategiesResult.value);
    if (governanceResult.status === 'fulfilled') { setProductContexts(governanceResult.value.contexts); setProductGuardrails(governanceResult.value.guardrails); }
    if (reviewsResult.status === 'fulfilled') { setReviewRuns(reviewsResult.value.runs); setReviewSuggestions(reviewsResult.value.suggestions); }
    setManagementState([strategiesResult, governanceResult, reviewsResult].every((result) => result.status === 'fulfilled') ? 'Sincronizado com o GaaS' : 'Parte da camada gerencial ainda não está disponível');
  };
  useEffect(() => { void refreshManagement(); }, []);
  const refreshTaxonomy = async () => {
    setTaxonomyState('loading');
    try { setTaxonomy(await loadActivityTaxonomy()); setTaxonomyState('ready'); }
    catch { setTaxonomyState('error'); }
  };
  useEffect(() => { Promise.allSettled([loadBriefings(), loadAssets(), loadLegalTexts(), loadSignatureSettings(), migrateLocalTemplateSlots(initialSlotsRef.current)]).then(([briefings, assetRows, legalRows, settings, sharedTemplates]) => {
    if (briefings.status === 'fulfilled') { setRows(briefings.value); setSelectedId(briefings.value.find((row) => row.__meta.status !== 'archived')?.__id ?? briefings.value[0]?.__id ?? ''); }
    if (assetRows.status === 'fulfilled') setAssets(assetRows.value);
    if (legalRows.status === 'fulfilled') setLegalTexts(legalRows.value);
    if (settings.status === 'fulfilled' && settings.value.length) setSignatureSettings(settings.value);
    if (sharedTemplates.status === 'fulfilled' && sharedTemplates.value.length) {
      const effectiveSharedTemplates = sharedTemplates.value.map((slot) => slot.id === PLURIX_UX_V2_TEMPLATE_ID
        ? { ...slot, name: 'Plurix aquisição UX v2', source: PLURIX_UX_V2_TEMPLATE, version: Math.max(slot.version, 2), updatedAt: '2026-08-31T12:00:00.000Z' }
        : slot.id === PLURIX_V8_TEMPLATE_ID
          ? { ...slot, name: PLURIX_V8_TEMPLATE_NAME, source: PLURIX_V8_TEMPLATE, version: Math.max(slot.version, 1), updatedAt: '2026-09-02T16:00:00.000Z' }
        : slot);
      const principal = effectiveSharedTemplates.find((slot) => slot.isPrincipal) ?? effectiveSharedTemplates[0];
      setTemplateSlots(effectiveSharedTemplates); setPrincipalTemplateId(principal.id); setSelectedTemplateId(principal.id); setTemplate(principal.source); setSavedTemplate(principal.source);
      setTemplateSyncState('Compartilhado com todos os usuários');
    } else setTemplateSyncState('Cache local — falha ao sincronizar templates');
    setSyncState(briefings.status === 'fulfilled' ? 'Sincronizado com o GaaS' : 'Rascunho local — não sincronizado');
  }); void refreshTaxonomy(); }, []);
  const activeRows = useMemo(() => rows.filter((row) => row.__meta.status !== 'archived'), [rows]);
  const issuesByRow = useMemo(() => validateRows(activeRows), [activeRows]);
  const selected = rows.find((row) => row.__id === selectedId) ?? rows[0];
  const selectedIssues = selected ? issuesByRow.get(selected.__id) ?? [] : [];
  const linkedTemplateId = selected?.__meta.templateSlotId && templateSlots.some((slot) => slot.id === selected.__meta.templateSlotId)
    ? selected.__meta.templateSlotId
    : effectivePrincipalId;
  const previewTemplate = templateSlots.find((slot) => slot.id === linkedTemplateId)?.source ?? savedTemplate;
  const previewRow = useMemo(() => selected && !showMarketingNotes ? projectMarketingPreview(selected, rows, assets) : selected, [assets, rows, selected, showMarketingNotes]);
  const render = useMemo(() => previewRow ? renderDynamicEmail(previewTemplate, previewRow, { ...subscriber, PRODUTO: previewRow.NM_PRODUTO_INTERNO, SEQUENCIA: previewRow.SEQUENCIA, TP_CAMPANHA: previewRow.TP_CAMPANHA }, { pendingAssets: showMarketingNotes ? 'observations' : 'hidden' }) : { html: '', diagnostics: [] }, [previewRow, previewTemplate, showMarketingNotes, subscriber]);
  const previewContextKey = emailPreviewContextKey(selected?.__id ?? '', linkedTemplateId);
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
  const selectedWeekGroups = useMemo(() => selectedWeek ? editorialGroups
    .filter((group) => group.visibleRows.length && group.representative.__meta.partner === selectedWeek.partner && group.representative.__meta.segment === selectedWeek.segment && group.representative.__meta.weekKey === selectedWeek.weekKey)
    .sort((a, b) => naturalLabelSort(a.representative.SEQUENCIA, b.representative.SEQUENCIA)) : [], [editorialGroups, selectedWeek]);
  const selectedSegmentGroups = useMemo(() => selectedSegment ? editorialGroups
    .filter((group) => group.visibleRows.length && group.representative.__meta.partner === selectedSegment.partner && group.representative.__meta.segment === selectedSegment.segment)
    .sort((a, b) => naturalLabelSort(a.representative.SEQUENCIA, b.representative.SEQUENCIA)) : [], [editorialGroups, selectedSegment]);
  const errorCount = editorialGroups.filter((group) => group.hasErrors).length;
  const activeEditorialGroupCount = editorialGroups.filter((group) => group.visibleRows.length > 0).length;
  const exportBlockReason = !rows.length
    ? 'Crie ou importe pelo menos um briefing antes de exportar.'
    : !activeRows.length
      ? 'Todos os briefings estão arquivados — não há nada para exportar.'
      : technicalErrorCount
        ? `Corrija ${technicalErrorCount} ${technicalErrorCount === 1 ? 'erro bloqueante' : 'erros bloqueantes'} antes de exportar${(() => { const nomes = [...new Set(editorialGroups.filter((group) => group.visibleRows.length && group.hasErrors).map((group) => `${group.representative.__meta.partner || 'Parceiro'} · ${group.representative.SEQUENCIA || 'Sequência'}`))]; return nomes.length ? `: ${nomes.slice(0, 3).join('; ')}${nomes.length > 3 ? '…' : ''}` : ''; })()}.`
        : '';
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
  const exportCsv = () => {
    if (exportBlockReason) { setAnnouncement(exportBlockReason); return; }
    const filename = `TB_BRIEFING_CAMPANHA_AQUISICAO_${new Date().toISOString().slice(0, 10)}.csv`;
    downloadText(filename, exportBriefingCsv(onlyCsvRows(rows)));
    setAnnouncement(`${filename} gerado para download.`);
    void recordExport(filename, activeRows, []);
  };
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
    const isPlurix = config.partner.toLowerCase() === 'plurix';
    const variantKeys = isPlurix ? config.signatureKeys : [''];
    const created = variantKeys.map((key) => {
      const signature = PLURIX_SIGNATURES.find((item) => item.key === key);
      return withMeta({ ...seed, __id: crypto.randomUUID(), NM_PRODUTO_INTERNO: isPlurix ? key : (seed.NM_PRODUTO_INTERNO || config.partner.toUpperCase()), SEQUENCIA: config.sequence, __journeyConfirmed: false }, { partner: config.partner, segment: config.segment, subgroup: isPlurix ? (signature?.label ?? key) : (source?.__meta.subgroup ?? ''), weekKey: config.weekKey, activityNames: [], campaignGroupId, status: 'draft', version: 1, savedAt: undefined });
    });
    setRows((current) => [...current, ...created]);
    setSelectedWeek(null); setSelectedId(created[0]?.__id ?? ''); setNewOpen(false);
    setAnnouncement(isPlurix ? `Novo e-mail criado com ${created.length} assinaturas ativas.` : 'Novo e-mail criado usando um segmento existente em activities.');
  };
  const createRuler = async (config: CreateRulerConfig) => {
    const partners = [...new Set([config.partner, ...config.adaptationPartners].filter(Boolean))];
    const now = new Date();
    const end = new Date(now); end.setFullYear(end.getFullYear() + 1);
    const isoMinute = (date: Date) => date.toISOString().slice(0, 16);
    const slug = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '').toUpperCase();
    const created: WorkspaceBriefing[] = [];
    const campaignGroups: Array<{ id: string; partner: string; weekKey: string; sequence: string; functionalName: string; role: string }> = [];
    partners.forEach((partnerName) => config.emails.forEach((email, index) => {
      const campaignGroupId = crypto.randomUUID();
      const sequence = `E-mail ${index + 1}`;
      const seed = emptyBriefingRow();
      Object.assign(seed, {
        DT_INICIO: isoMinute(now), DT_FIM: isoMinute(end),
        UTM_CAMPANHA: slug(`${config.rulerName}_${partnerName}_${sequence}`),
        TP_CAMPANHA: config.businessFront === 'acquisition' ? 'Aquisição' : 'Rentabilização',
        SEQUENCIA: sequence, NM_PRODUTO_INTERNO: slug(partnerName),
      });
      const row = withMeta(seed, { partner: partnerName, segment: config.segment, subgroup: '', weekKey: email.weekKey, activityNames: [], campaignGroupId, status: 'draft', version: 1, templateSlotId: config.templateSlotId || undefined });
      created.push(row);
      campaignGroups.push({ id: campaignGroupId, partner: partnerName, weekKey: email.weekKey, sequence, functionalName: email.functionalName, role: email.role });
    }));
    if (config.segmentMode === 'draft') await saveDraftEmailFactorySegment({ technicalName: config.segment, displayName: config.segmentAlias, businessFront: config.businessFront, partner: config.partner, bu: config.bu || undefined, lifecycleFamily: config.rulerFamily, audienceDescription: config.audienceDescription || undefined });
    const saved = await saveBriefings(created.map((row) => ({ row, warnings: ['Briefing criado pelo assistente de réguas; conteúdo, assets e Test Send ainda pendentes.'] })));
    await createRulerManagementPlan({ name: config.rulerName, description: config.audienceDescription, businessFront: config.businessFront, rulerFamily: config.rulerFamily, partner: config.partner, adaptationPartners: config.adaptationPartners, product: config.partner, segment: config.segment, objective: config.objective, templateSlotId: config.templateSlotId, campaignGroups });
    setRows((current) => [...current, ...saved]);
    setSelectedId(saved[0]?.__id ?? ''); setSelectedWeek(null); setSelectedSegment({ partner: config.partner, segment: config.segment });
    setRulerOpen(false); setAnnouncement(`${config.rulerName} criada com ${config.emails.length} e-mails, ${partners.length} ${partners.length === 1 ? 'parceiro' : 'parceiros'} e ${saved.length} briefings em rascunho.`);
    await refreshManagement();
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
  const saveTemplate = async () => {
    const current = templateSlots.find((slot) => slot.id === effectiveSelectedId); if (!current) return;
    try {
      const saved = await saveTemplateSlot({ ...current, source: template, version: current.version + 1, updatedAt: new Date().toISOString() });
      setTemplateSlots((slots) => slots.map((slot) => slot.id === saved.id ? saved : slot));
      if (saved.isPrincipal) { localStorage.setItem(TEMPLATE_KEY, saved.source); setSavedTemplate(saved.source); }
      setTemplateSyncState('Compartilhado com todos os usuários');
      setAnnouncement(saved.isPrincipal ? 'Template principal salvo no Supabase e aplicado à prévia de todos.' : 'Slot salvo no catálogo compartilhado. Defina-o como principal para usá-lo na prévia.');
    } catch (error) { setTemplateSyncState('Falha ao sincronizar templates'); setAnnouncement(error instanceof Error ? error.message : 'Falha ao salvar template.'); }
  };
  const createTemplateSlot = async () => {
    const slot: EmailTemplateSlot = { id: crypto.randomUUID(), name: `Template ${templateSlots.length + 1}`, source: DEFAULT_DYNAMIC_EMAIL_TEMPLATE, isPrincipal: false, version: 1, updatedAt: new Date().toISOString() };
    try { const saved = await saveTemplateSlot(slot); setTemplateSlots((current) => [...current, saved]); setSelectedTemplateId(saved.id); setTemplate(saved.source); setAnnouncement('Novo slot criado no catálogo compartilhado.'); }
    catch (error) { setAnnouncement(error instanceof Error ? error.message : 'Falha ao criar template.'); }
  };
  const selectTemplateSlot = (id: string) => {
    setTemplateSlots((current) => current.map((slot) => slot.id === effectiveSelectedId ? { ...slot, source: template } : slot));
    setSelectedTemplateId(id);
  };
  const duplicateTemplateSlot = async (id: string) => {
    const source = templateSlots.find((slot) => slot.id === id); if (!source) return;
    const slot: EmailTemplateSlot = { ...source, id: crypto.randomUUID(), name: `${source.name} — cópia`, source: id === effectiveSelectedId ? template : source.source, isPrincipal: false, version: 1, updatedAt: new Date().toISOString() };
    try { const saved = await saveTemplateSlot(slot); setTemplateSlots((current) => [...current, saved]); setSelectedTemplateId(saved.id); setTemplate(saved.source); setAnnouncement('Template duplicado no catálogo compartilhado.'); }
    catch (error) { setAnnouncement(error instanceof Error ? error.message : 'Falha ao duplicar template.'); }
  };
  const deleteTemplateSlot = async (id: string) => {
    if (templateSlots.length === 1) { setAnnouncement('Mantenha ao menos um template-fonte disponível.'); return; }
    const target = templateSlots.find((slot) => slot.id === id); if (!target || !window.confirm(`Apagar o slot “${target.name}” para todos os usuários?`)) return;
    try {
      const remaining = templateSlots.filter((slot) => slot.id !== id); const nextPrincipal = id === effectivePrincipalId ? remaining[0] : templateSlots.find((slot) => slot.id === effectivePrincipalId) ?? remaining[0];
      if (id === effectivePrincipalId) await setPrincipalTemplateSlot(nextPrincipal.id);
      await deleteSharedTemplateSlot(id);
      const normalized = remaining.map((slot) => ({ ...slot, isPrincipal: slot.id === nextPrincipal.id }));
      setTemplateSlots(normalized); setPrincipalTemplateId(nextPrincipal.id); setSelectedTemplateId(nextPrincipal.id); setTemplate(nextPrincipal.source); setSavedTemplate(nextPrincipal.source); localStorage.setItem(TEMPLATE_KEY, nextPrincipal.source); setAnnouncement(id === effectivePrincipalId ? 'Slot apagado para todos; outro template foi definido como principal.' : 'Slot apagado do catálogo compartilhado.');
    } catch (error) { setAnnouncement(error instanceof Error ? error.message : 'Falha ao apagar template.'); }
  };
  const makeTemplatePrincipal = async (id: string) => {
    const source = templateSlots.find((slot) => slot.id === id); if (!source) return;
    const sourceCode = id === effectiveSelectedId ? template : source.source;
    try {
      await saveTemplateSlot({ ...source, source: sourceCode, isPrincipal: false, version: source.version + 1, updatedAt: new Date().toISOString() });
      const shared = await setPrincipalTemplateSlot(id); const principal = shared.find((slot) => slot.id === id)!;
      setTemplateSlots(shared); setPrincipalTemplateId(id); setSavedTemplate(principal.source); localStorage.setItem(TEMPLATE_KEY, principal.source); setAnnouncement(`${principal.name} definido como principal para todos os usuários.`);
    } catch (error) { setAnnouncement(error instanceof Error ? error.message : 'Falha ao definir template principal.'); }
  };
  const uploadTemplate = async (file?: File) => {
    if (!file) return;
    const source = await file.text(); const cleanName = file.name.replace(/\.(html?|txt)$/i, '') || `Template ${templateSlots.length + 1}`;
    const slot: EmailTemplateSlot = { id: crypto.randomUUID(), name: cleanName, source, isPrincipal: false, version: 1, updatedAt: new Date().toISOString() };
    try { const saved = await saveTemplateSlot(slot); setTemplateSlots((current) => [...current, saved]); setSelectedTemplateId(saved.id); setTemplate(source); setAnnouncement(`${file.name} carregado no catálogo compartilhado. Revise e defina como principal quando estiver pronto.`); }
    catch (error) { setAnnouncement(error instanceof Error ? error.message : 'Falha ao subir template.'); }
  };
  const openNewBriefing = (partner = selected?.__meta.partner ?? 'Plurix', segment = selected?.__meta.segment ?? 'CRM', weekKey = selected?.__meta.weekKey ?? 'Semana 1') => { setNewDefaults({ partner, segment, weekKey }); setNewOpen(true); };
  const openNewWeek = (partner: string, segment: string) => {
    const usedNumbers = rows.filter((row) => row.__meta.partner === partner && row.__meta.segment === segment).map((row) => Number(row.__meta.weekKey.match(/\d+/)?.[0] ?? 0));
    setNewDefaults({ partner, segment, weekKey: `Semana ${Math.max(0, ...usedNumbers) + 1}` });
    setNewOpen(true);
  };
  const selectEmail = (id: string) => { setSelectedWeek(null); setSelectedSegment(null); setSelectedId(id); };
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
    if (!selected || savingRef.current) return;
    savingRef.current = true;
    const group = rows.filter((row) => row.__meta.campaignGroupId === selected.__meta.campaignGroupId && row.__meta.status !== 'archived').map((row) => ({ ...row, __meta: { ...row.__meta, status: ready ? 'ready' as const : 'draft' as const, version: row.__meta.savedAt ? row.__meta.version + 1 : row.__meta.version } }));
    setIsSaving(true);
    setAnnouncement('Salvando briefing…');
    try {
      const saved = await saveBriefings(group.map((row) => ({ row, warnings: (issuesByRow.get(row.__id) ?? []).map((issue) => issue.message) })));
      setRows((current) => current.map((row) => saved.find((item) => item.__id === row.__id) ?? row));
      setSyncState('Sincronizado com o GaaS');
      setAnnouncement(`Versão ${saved.find((item) => item.__id === selected.__id)?.__meta.version ?? group.find((item) => item.__id === selected.__id)?.__meta.version} salva e definida como atual.`);
      setSaveOpen(false);
    } catch (error) {
      setSyncState('Rascunho local — falha ao sincronizar');
      setAnnouncement(error instanceof Error ? error.message : 'Falha ao salvar.');
    } finally { savingRef.current = false; setIsSaving(false); }
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
            <button role="tab" aria-selected={mode === 'strategy'} onClick={() => setMode('strategy')} className={`rounded-lg px-3 py-2 text-xs font-bold transition ${mode === 'strategy' ? 'bg-white text-slate-900 shadow-sm' : 'text-cyan-50 hover:bg-white/10'}`}>Plano de Comunicação</button>
            <button role="tab" aria-selected={mode === 'reviews'} onClick={() => setMode('reviews')} className={`rounded-lg px-3 py-2 text-xs font-bold transition ${mode === 'reviews' ? 'bg-white text-slate-900 shadow-sm' : 'text-cyan-50 hover:bg-white/10'}`}>Revisões</button>
            <button role="tab" aria-selected={mode === 'library'} onClick={() => setMode('library')} className={`rounded-lg px-3 py-2 text-xs font-bold transition ${mode === 'library' ? 'bg-white text-slate-900 shadow-sm' : 'text-cyan-50 hover:bg-white/10'}`}><Images className="mr-1.5 inline" size={14}/>Biblioteca de ativos</button>
            <button role="tab" aria-selected={mode === 'template'} onClick={() => setMode('template')} className={`rounded-lg px-3 py-2 text-xs font-bold transition ${mode === 'template' ? 'bg-white text-slate-900 shadow-sm' : 'text-cyan-50 hover:bg-white/10'}`}><Code2 className="mr-1.5 inline" size={14}/>Template-fonte</button>
          </div>
          {mode === 'briefings' && <div className="flex flex-wrap items-center justify-end gap-2">
            <input ref={fileRef} type="file" accept=".csv,text/csv" hidden onChange={(event) => onFile(event.target.files?.[0])}/>
            <HeaderAction onClick={() => fileRef.current?.click()} icon={<Upload size={15}/>} label="Importar CSV"/>
            <HeaderAction onClick={duplicateBriefing} disabled={!selected} icon={<Copy size={15}/>} label="Duplicar"/>
            <HeaderAction onClick={() => setRulerOpen(true)} icon={<ListChecks size={15}/>} label="Criar régua"/>
            <HeaderAction onClick={() => openNewBriefing()} icon={<Plus size={15}/>} label="Novo e-mail"/>
            <HeaderAction onClick={() => setDeleteOpen(true)} disabled={!selected} icon={<Trash2 size={15}/>} label="Excluir" danger/>
            <button disabled={Boolean(exportBlockReason)} onClick={exportCsv} title={exportBlockReason || 'Baixar CSV pronto para importar no SFMC'} className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-cyan-400 px-3 py-2 text-xs font-bold text-slate-950 outline-none transition hover:bg-cyan-300 focus-visible:ring-2 focus-visible:ring-white disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-white/50"><Download size={15}/>Exportar CSV</button>
            {exportBlockReason && <p className="w-full text-right text-[11px] font-semibold text-amber-100">{exportBlockReason}</p>}
          </div>}
        </div>
      </div>
    </header>

    {mode === 'strategy' ? <StrategyWorkspace strategies={emailStrategies} contexts={productContexts} guardrails={productGuardrails} syncState={managementState} onRefresh={() => void refreshManagement()} onSaved={(saved) => setEmailStrategies((current) => current.map((item) => item.id === saved.id ? saved : item))}/> : mode === 'reviews' ? <ExternalReviewWorkspace runs={reviewRuns} suggestions={reviewSuggestions} syncState={managementState} onRefresh={() => void refreshManagement()} onDecide={async (id, status) => { await decideExternalSuggestion(id, status); await refreshManagement(); }}/> : mode === 'template' ? <TemplateSourceWorkspace slots={templateSlots} selectedId={effectiveSelectedId} principalId={effectivePrincipalId} source={template} syncState={templateSyncState} fileRef={templateFileRef} onSelect={selectTemplateSlot} onSourceChange={setTemplate} onRename={(id, name) => setTemplateSlots((current) => current.map((slot) => slot.id === id ? { ...slot, name } : slot))} onSave={() => void saveTemplate()} onCreate={() => void createTemplateSlot()} onUpload={(file) => void uploadTemplate(file)} onDuplicate={(id) => void duplicateTemplateSlot(id)} onDelete={(id) => void deleteTemplateSlot(id)} onMakePrincipal={(id) => void makeTemplatePrincipal(id)}/> : mode === 'library' ? <AssetLibrary assets={assets} setAssets={setAssets} taxonomy={taxonomy}/> :
    <main className="pt-4">
      {importMessages.length > 0 && <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900" role="status">{importMessages.map((message) => <div key={message}>{message}</div>)}</div>}

      <Group id="email-briefing-workspace" orientation="horizontal" defaultLayout={workspaceDefaultLayout ?? { briefings: 20, content: 80 }} onLayoutChanged={onWorkspaceLayoutChanged} className="min-h-[720px] min-w-0 overflow-hidden" resizeTargetMinimumSize={{ coarse: 20, fine: 10 }}>
        <Panel id="briefings" defaultSize="20%" minSize="14%" maxSize="38%" className="min-w-0">
        <aside className="h-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" aria-label="Caixa de briefings">
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
            {filteredGroups.length ? <BriefingTree
              groups={filteredGroups} selectedId={selected?.__id ?? ''} selectedWeek={selectedWeek} selectedSegment={selectedSegment} showArchived={showArchived}
              onSelect={selectEmail}
              onSelectSegment={(segment) => {
                setSelectedWeek(null); setSelectedSegment(segment);
                const first = editorialGroups.filter((group) => group.visibleRows.length && group.representative.__meta.partner === segment.partner && group.representative.__meta.segment === segment.segment)
                  .sort((a, b) => naturalLabelSort(a.representative.SEQUENCIA, b.representative.SEQUENCIA))[0]?.representative;
                if (first) setSelectedId(first.__id);
              }}
              onSelectWeek={(week) => {
                setSelectedSegment(null); setSelectedWeek(week);
                const first = editorialGroups.find((group) => group.visibleRows.length && group.representative.__meta.partner === week.partner && group.representative.__meta.segment === week.segment && group.representative.__meta.weekKey === week.weekKey)?.representative;
                if (first) setSelectedId(first.__id);
              }}
              onManage={(id) => { const target = rows.find((row) => row.__meta.campaignGroupId === id && row.__meta.status !== 'archived') ?? rows.find((row) => row.__meta.campaignGroupId === id); if (target) setSelectedId(target.__id); setSignatureManagerOpen(true); }}
              onNewWeek={openNewWeek} onNewEmail={openNewBriefing} onDuplicateWeek={duplicateWeek}
              onArchiveWeek={(partner, segment, weekKey) => setWeekArchiveTarget({ partner, segment, weekKey })}
              onDuplicateEmail={duplicateGroup}
              onArchiveEmail={(groupId) => { const target = rows.find((row) => row.__meta.campaignGroupId === groupId && row.__meta.status !== 'archived'); if (target) { setSelectedId(target.__id); setDeleteOpen(true); } }}
            /> : <div className="px-4 py-10 text-center text-sm text-slate-500"><Search className="mx-auto mb-2 text-slate-300" size={24}/><p className="font-semibold text-slate-700">Nenhum briefing encontrado</p><p className="mt-1 text-xs">Ajuste a busca ou o filtro de status.</p></div>}
          </div>
        </aside>
        </Panel>

        <Separator id="briefing-workspace-separator" aria-label="Ajustar largura da Caixa de briefings" className="group/sidebar-splitter relative mx-1.5 w-2 cursor-col-resize rounded-full outline-none focus-visible:ring-2 focus-visible:ring-cyan-500" title="Arraste para ajustar a largura da Caixa de briefings. Use as setas do teclado ou dê dois cliques para restaurar.">
          <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-slate-300 transition group-hover/sidebar-splitter:w-1 group-hover/sidebar-splitter:bg-cyan-500"/>
          <span className="absolute left-1/2 top-1/2 h-10 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-slate-300 bg-white shadow-sm transition group-hover/sidebar-splitter:border-cyan-500 group-hover/sidebar-splitter:bg-cyan-50"/>
        </Separator>

        <Panel id="content" defaultSize="80%" minSize="62%" className="min-w-0">
        <Group id="email-editor-preview" orientation="horizontal" defaultLayout={defaultLayout ?? { editor: 58, preview: 42 }} onLayoutChanged={onLayoutChanged} className="min-w-0 overflow-hidden rounded-2xl" resizeTargetMinimumSize={{ coarse: 20, fine: 10 }}>
          <Panel id="editor" defaultSize="58%" minSize="32%" className="min-w-0">
        {selectedSegment ? <WeekReviewer selection={selectedSegment} groups={selectedSegmentGroups} strategies={emailStrategies} issuesByRow={issuesByRow} selectedId={selected?.__id ?? ''} onSelect={setSelectedId} onEdit={(id) => selectEmail(id)}/> : selectedWeek ? <WeekReviewer selection={selectedWeek} groups={selectedWeekGroups} strategies={emailStrategies} issuesByRow={issuesByRow} selectedId={selected?.__id ?? ''} onSelect={setSelectedId} onEdit={(id) => selectEmail(id)} onNewEmail={() => openNewBriefing(selectedWeek.partner, selectedWeek.segment, selectedWeek.weekKey)} onDuplicate={() => duplicateWeek(selectedWeek.partner, selectedWeek.segment, selectedWeek.weekKey)}/> : selected ? <section id="email-editor-panel" className="h-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" aria-label="Editor do briefing selecionado">
          <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-4 py-3.5 backdrop-blur">
            <div className="flex flex-wrap items-start justify-between gap-2"><div><h2 className="font-bold text-slate-900">{selected.__meta.partner || 'Parceiro pendente'} · {selected.__meta.segment || 'Segmento pendente'} · {selected.SEQUENCIA || 'Sequência pendente'}</h2><p className="mt-0.5 text-xs text-slate-500">{selected.__meta.partner === 'Plurix' ? 'Assinatura' : 'Régua'} em edição: <b>{selected.__meta.subgroup || selected.NM_PRODUTO_INTERNO}</b> · {syncState} · versão {selected.__meta.version}</p></div><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${selected.__meta.status === 'archived' ? 'bg-slate-200 text-slate-700' : selectedIssues.some((issue) => issue.severity === 'error') ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>{selected.__meta.status === 'archived' ? 'Arquivada · somente leitura' : selectedIssues.filter((issue) => issue.severity === 'error').length ? `${selectedIssues.filter((issue) => issue.severity === 'error').length} ajustes necessários` : 'Pronto para exportar'}</span></div>
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
            {selected.__meta.partner === 'Plurix' && <SignatureMatrix rows={rows} selected={selected} onEnsure={() => setRows((current) => ensurePlurixVariants(current, selected.__id, signatureSettings.filter((item) => item.status === 'inactive').map((item) => item.signatureKey)))} onSelect={setSelectedId} onManage={() => setSignatureManagerOpen(true)}/>}

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
              <div className="border-b border-slate-200 bg-white px-3 py-2.5">
                <div className="grid items-start gap-2 min-[1500px]:grid-cols-[minmax(220px,1fr)_auto]">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2"><h2 className="font-bold text-slate-900">Prévia do e-mail</h2><span className="rounded-full bg-cyan-50 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-cyan-700">Simulação local</span><span className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide ${showMarketingNotes ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>{showMarketingNotes ? 'Observações MKT' : 'E-mail projetado'}</span></div>
                    <p className="mt-1 max-w-none whitespace-normal text-xs leading-[1.35rem] text-slate-500">Visualize a peça com conteúdo e ativos adaptados. Antes do envio, certifique pelo Test Send do SFMC.</p>
                  </div>
                  <div className="grid shrink-0 grid-cols-2 gap-1.5">
                    <button onClick={() => openRenderedPreview()} disabled={!selected || render.diagnostics.length > 0} className="inline-flex min-h-8 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-700 outline-none transition hover:border-cyan-300 hover:text-cyan-800 focus-visible:ring-2 focus-visible:ring-cyan-500 disabled:opacity-50"><ExternalLink size={14}/>Abrir em nova aba</button>
                    <button onClick={() => openRenderedPreview(true)} disabled={!selected || render.diagnostics.length > 0} title="Abre a impressão do navegador para salvar a prévia completa em PDF" className="inline-flex min-h-8 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-700 outline-none transition hover:border-cyan-300 hover:text-cyan-800 focus-visible:ring-2 focus-visible:ring-cyan-500 disabled:opacity-50"><Printer size={14}/>Salvar em PDF</button>
                    <button type="button" aria-pressed={showMarketingNotes} onClick={() => setShowMarketingNotes((current) => !current)} disabled={!selected} title="Alternar entre a peça projetada e as instruções pendentes para Marketing" className={`inline-flex min-h-8 items-center justify-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-bold outline-none transition focus-visible:ring-2 focus-visible:ring-cyan-500 disabled:opacity-50 ${showMarketingNotes ? 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100' : 'border-slate-200 bg-white text-slate-700 hover:border-amber-300 hover:text-amber-800'}`}><MessageSquareText size={14}/>Observações MKT</button>
                    <button onClick={() => setPreviewOpen(true)} disabled={!selected} className="inline-flex min-h-8 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-700 outline-none transition hover:border-cyan-300 hover:text-cyan-800 focus-visible:ring-2 focus-visible:ring-cyan-500 disabled:opacity-50"><Maximize2 size={14}/>Ampliar</button>
                  </div>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-[minmax(180px,1.25fr)_minmax(120px,0.75fr)_minmax(120px,0.75fr)]">
                  <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Template deste briefing
                    <span className="mt-1 flex h-9 items-center rounded-lg border border-slate-200 bg-white px-2 focus-within:border-cyan-400">
                      <select value={linkedTemplateId} onChange={(event) => { const id = event.target.value; setSelectedTemplateId(id); updateGroupMeta({ templateSlotId: id }); }} className="min-w-0 flex-1 bg-transparent text-xs font-semibold text-slate-700 outline-none" aria-label="Template vinculado ao briefing">
                        {templateSlots.map((slot) => <option key={slot.id} value={slot.id}>{slot.name}</option>)}
                      </select>
                      <button type="button" onClick={() => { setSelectedTemplateId(linkedTemplateId); setMode('template'); }} className="ml-1 rounded-md p-1.5 text-cyan-700 hover:bg-cyan-50" aria-label="Editar HTML e AMPscript completo do template vinculado" title="Editar HTML e AMPscript completo"><Code2 size={14}/></button>
                    </span>
                  </label>
                  <MiniInput label="Nome de teste" value={subscriber.PRI_NOME} onChange={(value) => setSubscriber((current) => ({ ...current, PRI_NOME: value }))}/>
                  <MiniInput label="Limite de teste" value={subscriber.LIMITE} onChange={(value) => setSubscriber((current) => ({ ...current, LIMITE: value }))}/>
                </div>
              </div>
              {selected && <div className="border-b border-slate-200 bg-slate-50 px-4 py-3"><div className="flex items-start gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-900 text-white"><Mail size={16}/></span><div className="min-w-0"><div className="line-clamp-2 text-sm font-bold leading-5 text-slate-900">{selected.ASSUNTO || 'Assunto não preenchido'}</div><div className="mt-0.5 line-clamp-1 text-xs text-slate-500">{selected.PRE_CABECALHO || 'Sem texto de pré-visualização'}</div><div className="mt-2 text-[11px] text-slate-500">{selected.__meta.partner || 'Parceiro'} · {selected.__meta.subgroup || selected.NM_PRODUTO_INTERNO || 'Assinatura'} · {selected.__meta.segment || selected.TP_CAMPANHA || 'Segmento'} · {selected.SEQUENCIA || 'Sequência'} · Remetente definido no SFMC</div></div></div></div>}
              {render.diagnostics.length > 0 ? <div className="m-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">{render.diagnostics.map((diagnostic) => <div key={diagnostic}>{diagnostic}</div>)}</div> : <EmailPreviewFrame html={render.html} contextKey={previewContextKey} className="h-[650px] w-full bg-slate-100"/>}
            </section>
          </Panel>
        </Group>
        </Panel>
      </Group>
    </main>}

    {previewOpen && selected && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="email-preview-title" onMouseDown={(event) => { if (event.target === event.currentTarget) setPreviewOpen(false); }}>
      <section className="flex max-h-[94vh] w-full max-w-[1320px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl" aria-label="Prévia ampliada do e-mail">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 px-5 py-4"><div><div className="flex items-center gap-2"><h2 id="email-preview-title" className="text-lg font-bold text-slate-900">Visualização do e-mail</h2><span className="rounded-full bg-cyan-50 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-cyan-700">Simulação local</span></div><p className="mt-0.5 text-xs text-slate-500">Revise conteúdo e personalização. A certificação final acontece no Test Send do SFMC.</p></div><button autoFocus onClick={() => setPreviewOpen(false)} className="rounded-lg p-2 text-slate-500 outline-none hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-cyan-500" aria-label="Fechar visualização"><X size={19}/></button></div>
        <div className="grid gap-3 border-b border-slate-200 bg-slate-50 px-5 py-3 md:grid-cols-[1fr_180px_180px]"><div className="flex items-start gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-900 text-white"><Mail size={16}/></span><div className="min-w-0"><div className="font-bold text-slate-900">{selected.ASSUNTO || 'Assunto não preenchido'}</div><div className="text-xs text-slate-500">{selected.PRE_CABECALHO || 'Sem texto de pré-visualização'}</div><div className="mt-1 text-[11px] text-slate-500">{selected.NM_PRODUTO_INTERNO || 'Produto'} · {selected.TP_CAMPANHA || 'Campanha'} · {selected.SEQUENCIA || 'Sequência'} · Remetente definido no SFMC</div></div></div><MiniInput label="Nome de teste" value={subscriber.PRI_NOME} onChange={(value) => setSubscriber((current) => ({ ...current, PRI_NOME: value }))}/><MiniInput label="Limite de teste" value={subscriber.LIMITE} onChange={(value) => setSubscriber((current) => ({ ...current, LIMITE: value }))}/></div>
        <div className="min-h-0 flex-1 overflow-auto bg-slate-100">{render.diagnostics.length > 0 ? <div className="m-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">{render.diagnostics.map((diagnostic) => <div key={diagnostic}>{diagnostic}</div>)}</div> : <EmailPreviewFrame html={render.html} contextKey={`${previewContextKey}::expanded`} className="h-[72vh] w-full bg-slate-100"/>}</div>
      </section>
    </div>}

    {deleteOpen && selected && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4" role="dialog" aria-modal="true" aria-labelledby="delete-email-title" onMouseDown={(event) => { if (event.target === event.currentTarget) setDeleteOpen(false); }}><div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl"><div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-red-50 text-red-600"><Trash2 size={18}/></span><div><h2 id="delete-email-title" className="font-bold text-slate-900">Arquivar este e-mail editorial?</h2><p className="mt-1 text-sm leading-5 text-slate-600"><b>{selected.__meta.partner || 'Parceiro não informado'} · {selected.SEQUENCIA || 'Sequência pendente'}</b> e suas variantes deixarão os próximos CSVs. Registros salvos permanecem no histórico; somente rascunhos nunca salvos são removidos.</p></div></div><div className="mt-5 flex justify-end gap-2"><button autoFocus onClick={() => setDeleteOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 outline-none hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-cyan-500">Cancelar</button><button onClick={() => void deleteBriefing()} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white outline-none hover:bg-red-700 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2">Arquivar e-mail</button></div></div></div>}
    {rulerOpen && <CreateRulerDialog taxonomy={taxonomy} templates={templateSlots} defaultPartner={newDefaults.partner} onClose={() => setRulerOpen(false)} onCreate={createRuler}/>}
    {newOpen && <NewBriefingDialog groups={editorialGroups.filter((group) => group.visibleRows.length)} settings={signatureSettings} taxonomy={taxonomy.filter((item) => item.businessFront === 'acquisition')} defaultPartner={newDefaults.partner} defaultSegment={newDefaults.segment} defaultWeekKey={newDefaults.weekKey} defaultSequence={`E-mail ${activeEditorialGroupCount + 1}`} onClose={() => setNewOpen(false)} onCreate={createBriefing}/>}
    {weekArchiveTarget && <div className="fixed inset-0 z-[75] grid place-items-center bg-slate-950/60 p-4" role="dialog" aria-modal="true" aria-labelledby="archive-week-title"><div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl"><h2 id="archive-week-title" className="font-bold text-slate-900">Arquivar {weekArchiveTarget.weekKey}?</h2><p className="mt-2 text-sm leading-5 text-slate-600">Todos os e-mails e variações ativos da semana sairão dos próximos CSVs. Registros já salvos continuarão no histórico.</p><div className="mt-5 flex justify-end gap-2"><button onClick={() => setWeekArchiveTarget(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700">Cancelar</button><button onClick={() => void archiveWeek(weekArchiveTarget)} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white">Arquivar semana</button></div></div></div>}
    {signatureManagerOpen && selected && <SignatureManagerModal rows={rows} selected={selected} settings={signatureSettings} onClose={() => setSignatureManagerOpen(false)} onVariantStatus={(row, status) => void changeVariantStatus(row, status)} onGlobalStatus={(setting, status) => void changeGlobalSignature(setting, status)} onAdd={addSignatureToSelectedGroup}/>}
    {saveOpen && selected && <SaveDialog selected={selected} errors={selectedGroupErrorCount} saving={isSaving} onClose={() => !isSaving && setSaveOpen(false)} onSave={saveCurrent} updateSelected={updateSelected}/>} 
  </div>;
};

const HeaderMetric = ({ label, value, icon, tone = 'default' }: { label: string; value: number; icon: React.ReactNode; tone?: 'default' | 'success' | 'danger' | 'warning' }) => {
  const colors = { default: 'text-cyan-50', success: 'text-emerald-200', danger: 'text-red-200', warning: 'text-amber-200' };
  return <div className={`inline-flex items-center gap-2 ${colors[tone]}`}>{icon}<span className="text-lg font-extrabold text-white">{value}</span><span className="max-w-24 text-[11px] font-semibold leading-3">{label}</span></div>;
};

const HeaderAction = ({ label, icon, onClick, disabled, danger }: { label: string; icon: React.ReactNode; onClick: () => void; disabled?: boolean; danger?: boolean }) => <button onClick={onClick} disabled={disabled} title={label} className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-bold outline-none transition focus-visible:ring-2 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-40 ${danger ? 'border border-red-200/30 bg-red-500/15 text-red-100 hover:bg-red-500/25' : 'border border-white/20 bg-white/10 text-white hover:bg-white/20'}`}>{icon}<span className="hidden 2xl:inline">{label}</span><span className="sr-only 2xl:hidden">{label}</span></button>;

const TemplateSourceWorkspace = ({ slots, selectedId, principalId, source, syncState, fileRef, onSelect, onSourceChange, onRename, onSave, onCreate, onUpload, onDuplicate, onDelete, onMakePrincipal }: { slots: EmailTemplateSlot[]; selectedId: string; principalId: string; source: string; syncState: string; fileRef: React.RefObject<HTMLInputElement>; onSelect: (id: string) => void; onSourceChange: (source: string) => void; onRename: (id: string, name: string) => void; onSave: () => void; onCreate: () => void; onUpload: (file?: File) => void; onDuplicate: (id: string) => void; onDelete: (id: string) => void; onMakePrincipal: (id: string) => void }) => {
  const selected = slots.find((slot) => slot.id === selectedId)!;
  return <main className="pt-4"><div className="mx-auto max-w-7xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-5"><div><div className="flex items-center gap-2"><h2 className="font-bold text-slate-900">Templates do Content Builder</h2><span className="rounded-full bg-cyan-50 px-2 py-1 text-[10px] font-bold text-cyan-800">{slots.length} {slots.length === 1 ? 'slot' : 'slots'}</span></div><p className="mt-1 text-sm text-slate-500">Catálogo hospedado no Supabase. Todos visualizam os mesmos slots; somente o principal alimenta a prévia.</p><p className="mt-1 text-[11px] font-semibold text-cyan-800">{syncState}</p></div><div className="flex flex-wrap gap-2"><input ref={fileRef} type="file" accept=".html,.htm,.txt,text/html,text/plain" hidden onChange={(event) => { onUpload(event.target.files?.[0]); event.currentTarget.value = ''; }}/><button onClick={() => fileRef.current?.click()} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-700 hover:bg-slate-50"><Upload size={15}/>Subir HTML</button><button onClick={onCreate} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#07595b] px-3 text-xs font-bold text-white"><Plus size={15}/>Novo slot</button></div></header>
    <div className="grid min-h-[68vh] lg:grid-cols-[300px_minmax(0,1fr)]">
      <aside className="border-b border-slate-200 bg-slate-50 p-3 lg:border-b-0 lg:border-r" aria-label="Slots de template"><div className="space-y-2">{slots.map((slot) => { const principal = slot.id === principalId; const active = slot.id === selectedId; return <button type="button" key={slot.id} onClick={() => onSelect(slot.id)} className={`w-full rounded-xl border p-3 text-left outline-none transition focus-visible:ring-2 focus-visible:ring-cyan-500 ${active ? 'border-cyan-400 bg-white shadow-sm' : 'border-slate-200 bg-white/70 hover:border-slate-300'}`}><span className="flex items-start justify-between gap-2"><span className="min-w-0"><span className="block truncate text-sm font-bold text-slate-900">{slot.name}</span><span className="mt-1 block text-[10px] text-slate-500">Atualizado {new Date(slot.updatedAt).toLocaleString('pt-BR')}</span></span>{principal && <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-1 text-[9px] font-extrabold uppercase tracking-wide text-emerald-800">Principal</span>}</span></button>; })}</div></aside>
      <section className="min-w-0"><div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 p-4"><label className="min-w-[220px] flex-1 text-xs font-semibold text-slate-600">Nome do slot<input value={selected.name} onChange={(event) => onRename(selected.id, event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-900 outline-none focus:border-cyan-400"/></label><div className="flex flex-wrap justify-end gap-2"><button onClick={() => onDuplicate(selected.id)} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-700 hover:bg-slate-50"><Copy size={14}/>Duplicar</button><button onClick={() => onDelete(selected.id)} disabled={slots.length === 1} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-red-200 px-3 text-xs font-bold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"><Trash2 size={14}/>Apagar</button>{selected.id !== principalId && <button onClick={() => onMakePrincipal(selected.id)} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-cyan-300 bg-cyan-50 px-3 text-xs font-bold text-cyan-900 hover:bg-cyan-100"><CheckCircle2 size={14}/>Definir como principal para visualização</button>}<button onClick={onSave} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-cyan-600 px-3 text-xs font-bold text-white hover:bg-cyan-700"><Save size={14}/>{selected.id === principalId ? 'Salvar e aplicar' : 'Salvar slot'}</button></div></div><textarea aria-label={`Código do template ${selected.name}`} value={source} onChange={(event) => onSourceChange(event.target.value)} spellCheck={false} className="h-[58vh] min-h-[520px] w-full resize-none bg-slate-950 p-5 font-mono text-xs leading-5 text-slate-100 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-400"/></section>
    </div>
  </div></main>;
};

type TreeMenuItem = { label: string; icon: React.ReactNode; onClick: () => void; danger?: boolean };

const TREE_MENU_WIDTH = 224; // w-56

const TreeActionMenu = ({ label, open, onToggle, items }: { label: string; open: boolean; onToggle: () => void; items: TreeMenuItem[] }) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  // O menu vive num portal com `position: fixed` porque a Caixa de briefings usa
  // `overflow-y-auto` e cortava os últimos itens ("Arquivar semana"/"Arquivar e-mail").
  // Rect vem em px físicos; `top`/`left` do portal são lidos em px locais (ver invariante 2 no CLAUDE.md).
  useLayoutEffect(() => {
    if (!open || !buttonRef.current) { setPos(null); return; }
    const rect = toLocalRect(buttonRef.current.getBoundingClientRect());
    const { width: vw, height: vh } = getLocalViewport();
    const estHeight = items.length * 40 + 12;
    const left = Math.max(8, Math.min(vw - TREE_MENU_WIDTH - 8, rect.right - TREE_MENU_WIDTH));
    let top = rect.bottom + 4;
    if (top + estHeight > vh - 8) top = Math.max(8, rect.top - estHeight - 4);
    setPos({ top, left });
  }, [open, items.length]);

  useEffect(() => {
    if (!open) return;
    const closeOnOutside = (event: PointerEvent) => {
      if (buttonRef.current?.contains(event.target as Node) || menuRef.current?.contains(event.target as Node)) return;
      onToggle();
    };
    const closeOnScroll = () => onToggle();
    document.addEventListener('pointerdown', closeOnOutside, true);
    window.addEventListener('scroll', closeOnScroll, true);
    window.addEventListener('resize', closeOnScroll);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutside, true);
      window.removeEventListener('scroll', closeOnScroll, true);
      window.removeEventListener('resize', closeOnScroll);
    };
  }, [open, onToggle]);

  return <div className="relative shrink-0">
    <button ref={buttonRef} type="button" onClick={onToggle} className="rounded-lg p-2 text-slate-500 outline-none hover:bg-white hover:text-cyan-800 focus-visible:ring-2 focus-visible:ring-cyan-500" aria-label={label} aria-expanded={open}><Settings2 size={15}/></button>
    {open && pos && createPortal(
      <div ref={menuRef} className="fixed z-[80] w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl" role="menu" style={{ top: pos.top, left: pos.left }}>{items.map((item) => <button type="button" key={item.label} onClick={item.onClick} className={`flex min-h-9 w-full items-center gap-2 rounded-lg px-2.5 text-left text-xs font-semibold outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ${item.danger ? 'text-red-700 hover:bg-red-50' : 'text-slate-700 hover:bg-slate-50'}`} role="menuitem">{item.icon}<span>{item.label}</span></button>)}</div>,
      document.body,
    )}
  </div>;
};

const WeekReviewer = ({ selection, groups, strategies, issuesByRow, selectedId, onSelect, onEdit, onNewEmail, onDuplicate }: { selection: ReviewerSelection; groups: EditorialGroup[]; strategies: EmailStrategy[]; issuesByRow: Map<string, ValidationIssue[]>; selectedId: string; onSelect: (id: string) => void; onEdit: (id: string) => void; onNewEmail?: () => void; onDuplicate?: () => void }) => {
  const summaries = groups.map((group) => {
    const rows = group.visibleRows;
    const representative = rows.find((row) => row.NM_PRODUTO_INTERNO.toUpperCase() === 'AMIGAO') ?? group.representative;
    const issueMap = new Map<string, ValidationIssue>();
    rows.flatMap((row) => issuesByRow.get(row.__id) ?? []).forEach((issue) => issueMap.set(`${issue.code}:${issue.field ?? ''}:${issue.message}`, issue));
    const issues = [...issueMap.values()];
    const assetCount = new Set(rows.flatMap((row) => [row.HEADER, row.BANNER_1_CORPO, row.BANNER_2_CORPO, row.BANNER_3_CORPO]).filter(Boolean)).size;
    return { group, representative, issues, assetCount, ready: rows.length > 0 && rows.every((row) => row.__meta.status === 'ready') && !issues.some((issue) => issue.severity === 'error') };
  });
  const readyCount = summaries.filter((item) => item.ready).length;
  const enrichedCount = groups.filter((group) => countConfiguredStrategyFields(strategies.find((item) => item.campaignGroupId === group.id)) >= 4).length;
  const totalAssets = new Set(groups.flatMap((group) => group.visibleRows.flatMap((row) => [row.HEADER, row.BANNER_1_CORPO, row.BANNER_2_CORPO, row.BANNER_3_CORPO])).filter(Boolean)).size;
  const fullRuler = !selection.weekKey;
  return <section className="h-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" aria-label={fullRuler ? `Régua completa de ${segmentDisplayLabel(selection.segment)}` : `Revisor de e-mails de ${selection.weekKey}`}>
    <header className="border-b border-slate-200 bg-white px-4 py-3.5"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2"><ListChecks size={18} className="text-cyan-700"/><h2 className="font-bold text-slate-900">{fullRuler ? 'Revisor da régua completa' : 'Revisor de e-mails'}</h2></div><p className="mt-1 text-xs text-slate-500">{selection.partner} · {segmentDisplayLabel(selection.segment)}{selection.weekKey ? ` · ${selection.weekKey}` : ' · E-mails 1 a 8'}</p></div>{onDuplicate && onNewEmail && <div className="flex flex-wrap gap-2"><button type="button" onClick={onDuplicate} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-700 hover:border-cyan-300"><Copy size={14}/>Duplicar semana</button><button type="button" onClick={onNewEmail} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-[#07595b] px-3 text-xs font-bold text-white"><Plus size={14}/>Criar e-mail</button></div>}</div>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5"><ReviewMetric label="E-mails" value={groups.length}/><ReviewMetric label="Prontos" value={`${readyCount}/${groups.length}`} tone={readyCount === groups.length ? 'success' : 'warning'}/><ReviewMetric label="Estratégia" value={`${enrichedCount}/${groups.length}`} tone={enrichedCount === groups.length ? 'success' : 'warning'}/><ReviewMetric label="Assets únicos" value={totalAssets}/><ReviewMetric label="Pendências únicas" value={summaries.reduce((total, item) => total + item.issues.filter((issue) => issue.severity === 'error').length, 0)} tone="danger"/></div>
    </header>
    <div className="max-h-[790px] overflow-auto p-3.5"><div className="mb-3 rounded-xl border border-cyan-100 bg-cyan-50/60 px-3 py-2 text-xs text-cyan-950"><b>Revisão da régua:</b> selecione uma linha para atualizar a prévia à direita; use “Editar” para abrir o briefing completo.</div><div className="overflow-hidden rounded-xl border border-slate-200"><div className="hidden grid-cols-[56px_minmax(150px,0.75fr)_minmax(220px,1.4fr)_72px_88px_88px] gap-3 border-b border-slate-200 bg-slate-50 px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-slate-500 xl:grid"><span>Ordem</span><span>E-mail</span><span>Mensagem</span><span>Assets</span><span>Variações</span><span>Ação</span></div>{summaries.map(({ group, representative, issues, assetCount, ready }, index) => { const selected = group.visibleRows.some((row) => row.__id === selectedId); const errorCount = issues.filter((issue) => issue.severity === 'error').length; return <article key={group.id} className={`grid gap-3 border-b border-slate-100 p-3 last:border-b-0 xl:grid-cols-[56px_minmax(150px,0.75fr)_minmax(220px,1.4fr)_72px_88px_88px] ${selected ? 'bg-cyan-50' : 'bg-white hover:bg-slate-50'}`}><button type="button" onClick={() => onSelect(representative.__id)} className="contents text-left"><span className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-xs font-extrabold text-slate-700">{index + 1}</span><span className="min-w-0"><span className="block truncate text-sm font-bold text-slate-900">{representative.SEQUENCIA || `E-mail ${index + 1}`}</span><span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[9px] font-extrabold ${ready ? 'bg-emerald-100 text-emerald-800' : errorCount ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'}`}>{ready ? 'Pronto' : errorCount ? `${errorCount} ajustes` : 'Revisar'}</span></span><span className="min-w-0"><span className="block line-clamp-2 text-xs font-bold leading-4 text-slate-900">{representative.ASSUNTO || 'Assunto não preenchido'}</span><span className="mt-1 block line-clamp-2 text-[11px] leading-4 text-slate-500">{representative.PRE_CABECALHO || 'Pré-cabeçalho não preenchido'}</span></span><span className="text-xs font-bold text-slate-700">{assetCount}</span><span className="text-xs font-bold text-slate-700">{group.visibleRows.length}</span></button><button type="button" onClick={() => onEdit(representative.__id)} className="inline-flex h-8 items-center justify-center gap-1 rounded-lg border border-slate-200 px-2 text-[10px] font-bold text-cyan-800 hover:border-cyan-300 hover:bg-white"><ExternalLink size={12}/>Editar</button></article>; })}</div>{!groups.length && <div className="py-16 text-center text-sm text-slate-500"><Mail className="mx-auto mb-2 text-slate-300"/><b>Nenhum e-mail ativo nesta semana.</b><p className="mt-1 text-xs">Crie o primeiro e-mail para iniciar a revisão.</p></div>}</div>
  </section>;
};

const ReviewMetric = ({ label, value, tone = 'default' }: { label: string; value: React.ReactNode; tone?: 'default' | 'success' | 'warning' | 'danger' }) => { const tones = { default: 'border-slate-200 bg-slate-50 text-slate-800', success: 'border-emerald-200 bg-emerald-50 text-emerald-800', warning: 'border-amber-200 bg-amber-50 text-amber-900', danger: 'border-red-200 bg-red-50 text-red-800' }; return <div className={`rounded-lg border px-3 py-2 ${tones[tone]}`}><div className="text-lg font-extrabold">{value}</div><div className="text-[10px] font-bold uppercase tracking-wide opacity-70">{label}</div></div>; };

const BriefingTree = ({ groups, selectedId, selectedWeek, selectedSegment, showArchived, onSelect, onSelectSegment, onSelectWeek, onManage, onNewWeek, onNewEmail, onDuplicateWeek, onArchiveWeek, onDuplicateEmail, onArchiveEmail }: { groups: EditorialGroup[]; selectedId: string; selectedWeek: WeekSelection | null; selectedSegment: SegmentSelection | null; showArchived: boolean; onSelect: (id: string) => void; onSelectSegment: (selection: SegmentSelection) => void; onSelectWeek: (selection: WeekSelection) => void; onManage: (groupId: string) => void; onNewWeek: (partner: string, segment: string) => void; onNewEmail: (partner: string, segment: string, weekKey: string) => void; onDuplicateWeek: (partner: string, segment: string, weekKey: string) => void; onArchiveWeek: (partner: string, segment: string, weekKey: string) => void; onDuplicateEmail: (groupId: string) => void; onArchiveEmail: (groupId: string) => void }) => {
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
  return <div><div className="mb-2 flex items-center justify-between gap-2"><span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Navegação</span><div className="flex gap-1"><button type="button" onClick={() => setExpanded(new Set())} className="rounded-md border border-slate-200 px-2 py-1 text-[10px] font-bold text-slate-600 hover:border-cyan-300 hover:text-cyan-800">Recolher tudo</button><button type="button" onClick={() => { const next = new Set<string>(); [...branches.entries()].forEach(([partner, segments]) => { next.add(`p:${partner}`); [...segments.keys()].forEach((segment) => next.add(`p:${partner}/s:${segment}`)); }); setExpanded(next); localStorage.setItem('gaas-email-tree-expanded-v1', JSON.stringify([...next])); }} className="rounded-md border border-slate-200 px-2 py-1 text-[10px] font-bold text-slate-600 hover:border-cyan-300 hover:text-cyan-800">Ver segmentos</button></div></div><div className="space-y-1">{[...branches.entries()].sort(([a], [b]) => naturalLabelSort(a, b)).map(([partner, segments]) => {
    const partnerKey = `p:${partner}`;
    const partnerCount = [...segments.values()].reduce((total, weeks) => total + [...weeks.values()].flat().length, 0);
    return <div key={partnerKey}>{disclosure(partnerKey, <span className="uppercase tracking-wide text-cyan-800">{partner}</span>, `${partnerCount} e-mails`)}{expanded.has(partnerKey) && [...segments.entries()].sort(([a], [b]) => naturalLabelSort(a, b)).map(([segment, weeks]) => {
      const segmentKey = `${partnerKey}/s:${segment}`;
      const segmentMenuKey = `menu:${segmentKey}`;
      const segmentSelected = selectedSegment?.partner === partner && selectedSegment.segment === segment;
      const segmentEmailCount = [...weeks.values()].flat().filter((group) => group.visibleRows.length).length;
      return <div key={segmentKey}><div className={`flex items-center rounded-lg ${segmentSelected ? 'bg-cyan-50 ring-1 ring-cyan-300' : ''}`}><button type="button" onClick={() => toggle(segmentKey)} aria-expanded={expanded.has(segmentKey)} aria-label={`${expanded.has(segmentKey) ? 'Recolher' : 'Expandir'} ${segmentDisplayLabel(segment)}`} className="ml-3 rounded-md p-1.5 text-slate-500 outline-none hover:bg-white focus-visible:ring-2 focus-visible:ring-cyan-500">{expanded.has(segmentKey) ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}</button><button type="button" onClick={() => onSelectSegment({ partner, segment })} className="flex min-h-9 min-w-0 flex-1 items-center gap-2 rounded-lg px-1 text-left text-xs font-bold text-slate-700 outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"><span className="min-w-0 flex-1 truncate">{segmentDisplayLabel(segment)}</span><span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">{segmentEmailCount} e-mails</span></button><TreeActionMenu label={`Configurar ${segmentDisplayLabel(segment)}`} open={menuOpen === segmentMenuKey} onToggle={() => setMenuOpen((current) => current === segmentMenuKey ? null : segmentMenuKey)} items={[{ label: 'Criar semana', icon: <Plus size={14}/>, onClick: () => { setMenuOpen(null); onNewWeek(partner, segment); } }]}/></div>{expanded.has(segmentKey) && [...weeks.entries()].sort(([a], [b]) => naturalLabelSort(a, b)).map(([week, weekGroups]) => {
        const weekKey = `${segmentKey}/w:${week}`;
        const hasActiveWeek = weekGroups.some((group) => group.rows.some((row) => row.__meta.status !== 'archived'));
        const weekMenuKey = `menu:${weekKey}`;
        const weekItems: TreeMenuItem[] = [{ label: 'Novo e-mail nesta semana', icon: <Plus size={14}/>, onClick: () => { setMenuOpen(null); onNewEmail(partner, segment, week); } }];
        if (hasActiveWeek) weekItems.push(
          { label: 'Duplicar semana e e-mails', icon: <Copy size={14}/>, onClick: () => { setMenuOpen(null); onDuplicateWeek(partner, segment, week); } },
          { label: 'Arquivar semana', icon: <Trash2 size={14}/>, danger: true, onClick: () => { setMenuOpen(null); onArchiveWeek(partner, segment, week); } },
        );
        const weekSelected = selectedWeek?.partner === partner && selectedWeek.segment === segment && selectedWeek.weekKey === week;
        return <div key={weekKey}><div className={`flex items-center rounded-lg ${weekSelected ? 'bg-cyan-50 ring-1 ring-cyan-300' : ''}`}><button type="button" onClick={() => toggle(weekKey)} aria-expanded={expanded.has(weekKey)} aria-label={`${expanded.has(weekKey) ? 'Recolher' : 'Expandir'} ${week}`} className="ml-6 rounded-md p-1.5 text-slate-500 outline-none hover:bg-white focus-visible:ring-2 focus-visible:ring-cyan-500">{expanded.has(weekKey) ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}</button><button type="button" onClick={() => onSelectWeek({ partner, segment, weekKey: week })} className="flex min-h-9 min-w-0 flex-1 items-center gap-2 rounded-lg px-1 text-left text-xs font-bold text-slate-700 outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"><span className="min-w-0 flex-1 truncate">{week}</span><span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">{weekGroups.length}</span></button><TreeActionMenu label={`Configurar ${week}`} open={menuOpen === weekMenuKey} onToggle={() => setMenuOpen((current) => current === weekMenuKey ? null : weekMenuKey)} items={weekItems}/></div>{expanded.has(weekKey) && weekGroups.sort((a, b) => naturalLabelSort(a.representative.SEQUENCIA, b.representative.SEQUENCIA)).map((group) => {
          const groupKey = `${weekKey}/e:${group.id}`;
          const active = group.rows.filter((row) => row.__meta.status !== 'archived');
          const selectedGroup = group.rows.some((row) => row.__id === selectedId);
          const emailMenuKey = `menu:${groupKey}`;
          const emailItems: TreeMenuItem[] = [{ label: 'Gerenciar assinaturas', icon: <Settings2 size={14}/>, onClick: () => { setMenuOpen(null); onManage(group.id); } }];
          if (active.length) emailItems.push(
            { label: 'Duplicar e-mail', icon: <Copy size={14}/>, onClick: () => { setMenuOpen(null); onDuplicateEmail(group.id); } },
            { label: 'Arquivar e-mail', icon: <Trash2 size={14}/>, danger: true, onClick: () => { setMenuOpen(null); onArchiveEmail(group.id); } },
          );
          const isPlurix = group.representative.__meta.partner === 'Plurix';
          return <div key={group.id} className={`ml-8 mt-1 rounded-xl border ${selectedGroup ? 'border-cyan-300 bg-cyan-50' : 'border-slate-200 bg-white'}`}><div className="flex items-center gap-1 p-1"><button type="button" onClick={() => { toggle(groupKey); const target = active.find((row) => row.NM_PRODUTO_INTERNO.toUpperCase() === 'AMIGAO') ?? active[0] ?? group.rows[0]; onSelect(target.__id); }} aria-expanded={expanded.has(groupKey)} className="flex min-h-10 min-w-0 flex-1 items-center gap-2 rounded-lg px-2 text-left outline-none hover:bg-white/70 focus-visible:ring-2 focus-visible:ring-cyan-500">{expanded.has(groupKey) ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}<span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#07595b] text-[10px] font-extrabold text-white">{initials(group.representative.__meta.partner)}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold text-slate-900">{group.representative.SEQUENCIA || 'E-mail'}</span><span className="block text-[10px] text-slate-500">{isPlurix ? `${active.length}/${PLURIX_SIGNATURES.length} assinaturas ativas` : `${group.representative.__meta.subgroup || 'Régua'} · ${active.length} versão ativa`}</span></span>{group.hasErrors ? <CircleAlert size={14} className="text-red-600"/> : <CheckCircle2 size={14} className="text-emerald-600"/>}</button><TreeActionMenu label={`Configurar ${group.representative.SEQUENCIA}`} open={menuOpen === emailMenuKey} onToggle={() => setMenuOpen((current) => current === emailMenuKey ? null : emailMenuKey)} items={emailItems}/></div>{expanded.has(groupKey) && <div className="border-t border-slate-100 bg-white/70 p-1.5">{group.rows.filter((row) => showArchived || row.__meta.status !== 'archived').map((row) => <button type="button" key={row.__id} onClick={() => onSelect(row.__id)} className={`flex min-h-9 w-full items-center gap-2 rounded-lg px-2 text-left text-xs outline-none hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-cyan-500 ${row.__id === selectedId ? 'bg-cyan-100 font-bold text-cyan-950' : row.__meta.status === 'archived' ? 'text-slate-400 line-through' : 'text-slate-700'}`}><span className={`h-2 w-2 rounded-full ${row.__meta.status === 'archived' ? 'bg-slate-300' : 'bg-emerald-500'}`}/><span className="min-w-0 flex-1 truncate">{row.__meta.subgroup || row.NM_PRODUTO_INTERNO}</span><span className="text-[10px]">{row.__meta.status === 'archived' ? 'Arquivada' : 'Ativa'}</span></button>)}</div>}</div>;
        })}</div>;
      })}</div>;
    })}</div>;
    })}</div></div>;
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

const StrategyWorkspace = ({ strategies, contexts, guardrails, syncState, onRefresh, onSaved }: { strategies: EmailStrategy[]; contexts: ProductContext[]; guardrails: ProductGuardrail[]; syncState: string; onRefresh: () => void; onSaved: (strategy: EmailStrategy) => void }) => {
  const [selectedId, setSelectedId] = useState('');
  const [query, setQuery] = useState('');
  const [partnerFilter, setPartnerFilter] = useState('');
  const [weekFilter, setWeekFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState<ProductGuardrail['severity'] | ''>('');
  const [onlyPending, setOnlyPending] = useState(false);
  const [viewMode, setViewMode] = useState<'overview' | 'detail'>('detail');
  const [detailTab, setDetailTab] = useState<'plan' | 'comparison' | 'rules'>('plan');
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState<'product' | 'all' | ''>('');
  const [message, setMessage] = useState('');
  const [exportMessage, setExportMessage] = useState('');
  const partners = useMemo(() => [...new Set(strategies.map((item) => item.partner).filter(Boolean))].sort(naturalLabelSort), [strategies]);
  const weeks = useMemo(() => [...new Set(strategies.map((item) => item.weekKey).filter(Boolean) as string[])].sort(naturalLabelSort), [strategies]);
  const applicableGuardrails = (item: EmailStrategy) => { const ids = new Set(contexts.filter((context) => !context.partner || context.partner === item.partner).map((context) => context.id)); return guardrails.filter((guardrail) => ids.has(guardrail.productContextId)); };
  const filtered = useMemo(() => strategies.filter((item) => {
    const readiness = strategyReadiness(item);
    const haystack = [item.partner, item.segment, item.weekKey, item.sequence, item.subject, item.roleInRuler, item.emailObjective, item.keyMessage, item.valueProposition, item.primaryBenefit].join(' ').toLocaleLowerCase('pt-BR');
    return (!query.trim() || haystack.includes(query.trim().toLocaleLowerCase('pt-BR')))
      && (!partnerFilter || item.partner === partnerFilter)
      && (!weekFilter || item.weekKey === weekFilter)
      && (!statusFilter || readiness.label === statusFilter)
      && (!severityFilter || applicableGuardrails(item).some((guardrail) => guardrail.severity === severityFilter))
      && (!onlyPending || readiness.tone !== 'success' || countConfiguredStrategyFields(item) < STRATEGY_FIELD_COUNT);
  }), [strategies, contexts, guardrails, query, partnerFilter, weekFilter, statusFilter, severityFilter, onlyPending]);
  const selected = filtered.find((item) => item.id === selectedId) ?? filtered[0] ?? null;
  const [draft, setDraft] = useState<EmailStrategy | null>(selected);
  useEffect(() => { setDraft(selected); }, [selected?.id, selected?.version]);
  const update = (field: keyof EmailStrategy, value: string | string[]) => setDraft((current) => current ? { ...current, [field]: value } : current);
  const activeFilters = Number(Boolean(query.trim())) + Number(Boolean(partnerFilter)) + Number(Boolean(weekFilter)) + Number(Boolean(statusFilter)) + Number(Boolean(severityFilter)) + Number(onlyPending);
  const clearFilters = () => { setQuery(''); setPartnerFilter(''); setWeekFilter(''); setStatusFilter(''); setSeverityFilter(''); setOnlyPending(false); };
  const pendingCount = strategies.filter((item) => strategyReadiness(item).tone !== 'success' || countConfiguredStrategyFields(item) < STRATEGY_FIELD_COUNT).length;
  const blockedCount = strategies.filter((item) => strategyReadiness(item).tone === 'danger').length;
  const completeCount = strategies.filter((item) => countConfiguredStrategyFields(item) === STRATEGY_FIELD_COUNT).length;
  const save = async () => { if (!draft) return; setSaving(true); setMessage(''); try { const saved = await saveEmailStrategy(draft); onSaved(saved); setDraft(saved); setMessage('Plano salvo com nova versão auditável.'); } catch (error) { setMessage(error instanceof Error ? error.message : 'Falha ao salvar.'); } finally { setSaving(false); } };
  const openDetail = (id: string) => { setSelectedId(id); setViewMode('detail'); setDetailTab('plan'); };
  const selectedPartner = partnerFilter || selected?.partner || partners[0] || '';
  const productStrategies = selectedPartner ? strategies.filter((item) => item.partner === selectedPartner) : strategies;
  const productPending = productStrategies.filter((item) => strategyReadiness(item).tone !== 'success' || countConfiguredStrategyFields(item) < STRATEGY_FIELD_COUNT).length;
  const productBlocked = productStrategies.filter((item) => strategyReadiness(item).tone === 'danger').length;
  const productComplete = productStrategies.filter((item) => countConfiguredStrategyFields(item) === STRATEGY_FIELD_COUNT).length;
  const rulerLabels = [...new Set(productStrategies.map((item) => segmentDisplayLabel(item.segment)))].sort(naturalLabelSort);
  const runExport = async (scope: 'product' | 'all', details?: HTMLDetailsElement | null) => {
    const items = scope === 'product' ? productStrategies : strategies;
    if (!items.length) { setExportMessage('Não há planos disponíveis para exportar.'); return; }
    setExporting(scope);
    setExportMessage('');
    details?.removeAttribute('open');
    try {
      const filename = await exportStrategyPlanXlsx({ strategies: items, contexts, guardrails }, scope === 'product' ? selectedPartner : 'todos-produtos');
      setExportMessage(`${filename} gerado com ${items.length} ${items.length === 1 ? 'e-mail' : 'e-mails'}.`);
    } catch (error) {
      setExportMessage(error instanceof Error ? error.message : 'Não foi possível gerar a planilha.');
    } finally {
      setExporting('');
    }
  };
  return <main className="mt-4 min-h-[720px] space-y-4">
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm" aria-label="Filtros do plano de comunicação">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-bold text-slate-900">Plano de Comunicação</h2><p className="mt-0.5 text-xs text-slate-500">Planeje o papel de cada e-mail, organize os argumentos e consulte as regras aplicáveis antes da produção.</p></div><div className="flex flex-wrap items-center gap-2"><details className="group relative"><summary className="inline-flex cursor-pointer list-none items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-cyan-900 hover:border-cyan-300 focus-visible:ring-2 focus-visible:ring-cyan-400"><Download size={14}/>{exporting ? 'Gerando…' : 'Exportar plano'}<ChevronDown size={13} className="transition-transform group-open:rotate-180"/></summary><div className="absolute right-0 top-11 z-30 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"><div className="border-b border-slate-100 px-4 py-3"><b className="text-xs text-slate-900">Baixar plano editorial V2</b><p className="mt-1 text-[11px] leading-4 text-slate-500">Visão macro do produto e plano dos e-mails em abas amigáveis. IDs e rastreabilidade ficam em uma aba técnica oculta.</p></div><button type="button" disabled={Boolean(exporting) || !selectedPartner} onClick={(event) => void runExport('product', event.currentTarget.closest('details'))} className="block w-full px-4 py-3 text-left hover:bg-cyan-50 disabled:opacity-40"><b className="block text-xs text-slate-800">Produto selecionado: {selectedPartner || 'nenhum'}</b><span className="mt-0.5 block text-[11px] text-slate-500">2 abas visíveis · {productStrategies.length} e-mails</span></button><button type="button" disabled={Boolean(exporting) || !strategies.length} onClick={(event) => void runExport('all', event.currentTarget.closest('details'))} className="block w-full border-t border-slate-100 px-4 py-3 text-left hover:bg-cyan-50 disabled:opacity-40"><b className="block text-xs text-slate-800">Todos os produtos</b><span className="mt-0.5 block text-[11px] text-slate-500">{partners.length * 2} abas visíveis · {partners.length} {partners.length === 1 ? 'produto' : 'produtos'} · {strategies.length} e-mails</span></button><p className="border-t border-slate-100 bg-slate-50 px-4 py-2 text-[10px] leading-4 text-slate-500">A atualização em massa permanece exclusiva para LLM/API; não há importação manual de XLSX.</p></div></details><div className="flex rounded-lg border border-slate-200 bg-slate-50 p-1" aria-label="Tipo de visualização"><button type="button" onClick={() => setViewMode('overview')} className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold ${viewMode === 'overview' ? 'bg-white text-cyan-800 shadow-sm' : 'text-slate-500'}`}><TableProperties size={14}/>Visão geral</button><button type="button" onClick={() => setViewMode('detail')} className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold ${viewMode === 'detail' ? 'bg-white text-cyan-800 shadow-sm' : 'text-slate-500'}`}><LayoutPanelLeft size={14}/>Editar e-mail</button></div><button type="button" onClick={onRefresh} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:border-cyan-300" aria-label="Atualizar plano de comunicação"><RefreshCw size={15}/></button></div></div>
      {exportMessage && <div role="status" className="mt-3 rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs text-cyan-900">{exportMessage}</div>}
      <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-[minmax(240px,1.5fr)_repeat(4,minmax(140px,0.7fr))_auto]"><label className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 focus-within:border-cyan-400 focus-within:bg-white"><Search size={15} className="text-slate-400"/><span className="sr-only">Buscar no plano</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar e-mail, objetivo ou benefício…" className="min-w-0 flex-1 bg-transparent text-xs outline-none"/></label><FilterSelect label="Parceiro" value={partnerFilter} onChange={setPartnerFilter} options={partners}/><FilterSelect label="Semana" value={weekFilter} onChange={setWeekFilter} options={weeks}/><FilterSelect label="Status" value={statusFilter} onChange={setStatusFilter} options={['Bloqueado', 'Enriquecer estratégia', 'Em revisão', 'Pronto para teste', 'Certificado']}/><FilterSelect label="Regra aplicável" value={severityFilter} onChange={(value) => setSeverityFilter(value as ProductGuardrail['severity'] | '')} options={['hard_block', 'requires_review', 'advisory']} labels={{ hard_block: 'Bloqueia publicação', requires_review: 'Exige validação', advisory: 'Orientação' }}/><label className={`flex h-10 cursor-pointer items-center gap-2 rounded-lg border px-3 text-xs font-bold ${onlyPending ? 'border-amber-300 bg-amber-50 text-amber-900' : 'border-slate-200 text-slate-600'}`}><input type="checkbox" checked={onlyPending} onChange={(event) => setOnlyPending(event.target.checked)} className="accent-amber-600"/>Só pendências</label></div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3"><div className="flex flex-wrap gap-2"><SummaryChip label="E-mails" value={strategies.length}/><SummaryChip label="Pendentes" value={pendingCount} tone="warning"/><SummaryChip label="Bloqueados" value={blockedCount} tone="danger"/><SummaryChip label="Planos completos" value={completeCount} tone="success"/></div><div className="text-xs text-slate-500">Exibindo <b className="text-slate-800">{filtered.length}</b> de {strategies.length}{activeFilters > 0 && <button type="button" onClick={clearFilters} className="ml-2 font-bold text-cyan-700 hover:underline">Limpar {activeFilters} {activeFilters === 1 ? 'filtro' : 'filtros'}</button>}</div></div>
    </section>
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" aria-label="Produto e régua selecionados">
      <div className="border-b border-slate-200 px-4 py-3"><div className="flex flex-wrap items-center gap-2"><span className="mr-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">Produto</span>{partners.map((partner) => { const items = strategies.filter((item) => item.partner === partner); const active = partner === selectedPartner; return <button type="button" key={partner} onClick={() => { setPartnerFilter(partner); setSelectedId(items[0]?.id ?? ''); }} className={`rounded-lg border px-3 py-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ${active ? 'border-cyan-500 bg-cyan-50 text-cyan-950' : 'border-slate-200 text-slate-600 hover:border-cyan-300'}`}><b className="block text-xs">{partner}</b><span className="text-[10px] opacity-70">{items.length} e-mails</span></button>; })}</div></div>
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50/70 px-4 py-3"><div><span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Régua</span><div className="mt-0.5 flex flex-wrap items-center gap-2"><b className="text-sm text-slate-900">{rulerLabels.join(' + ') || 'Sem régua identificada'}</b><span className="text-xs text-slate-500">{productStrategies.length} e-mails · {syncState}</span></div></div><div className="flex flex-wrap gap-2"><SummaryChip label="completos" value={productComplete} tone="success"/><SummaryChip label="pendentes" value={productPending} tone="warning"/><SummaryChip label="bloqueados" value={productBlocked} tone="danger"/></div></div>
    </section>
    {viewMode === 'overview' ? <StrategyOverview strategies={filtered} onOpen={openDetail}/> : <div className="grid gap-4 xl:grid-cols-[minmax(520px,42fr)_minmax(620px,58fr)]">
      <StrategyEmailTable strategies={filtered} selectedId={selected?.id ?? ''} onSelect={setSelectedId} onClear={clearFilters}/>
      <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><header className="border-b border-slate-200 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-bold text-slate-900">Plano do e-mail</h2><p className="text-xs text-slate-500">Edite a direção, compare com o briefing e consulte as regras sem perder a régua.</p></div>{draft && <button type="button" onClick={() => void save()} disabled={saving} className="rounded-lg bg-[#07595b] px-4 py-2 text-xs font-bold text-white disabled:opacity-50"><Save className="mr-1.5 inline" size={14}/>{saving ? 'Salvando…' : 'Salvar nova versão'}</button>}</div>{draft && <div className="mt-3 flex gap-1 border-t border-slate-100 pt-3" role="tablist" aria-label="Detalhes do e-mail">{([['plan', 'Plano'], ['comparison', 'Planejado × executado'], ['rules', 'Regras aplicáveis']] as const).map(([id, label]) => <button type="button" role="tab" aria-selected={detailTab === id} key={id} onClick={() => setDetailTab(id)} className={`rounded-lg px-3 py-2 text-xs font-bold ${detailTab === id ? 'bg-cyan-50 text-cyan-900' : 'text-slate-500 hover:bg-slate-50'}`}>{label}</button>)}</div>}</header><div className="max-h-[760px] overflow-auto p-4">{message && <div role="status" className="mb-3 rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs text-cyan-900">{message}</div>}{draft ? <><div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2"><div className="text-xs text-slate-600"><b className="text-slate-900">{draft.partner} · {draft.weekKey} · {draft.sequence}</b><span className="ml-2">versão {draft.version}</span><span className="ml-2 text-slate-400">· {draft.updatedByType === 'llm' ? `LLM${draft.llmModel ? ` (${draft.llmModel})` : ''}` : draft.updatedByType === 'human' ? 'edição humana' : 'sistema'}{draft.updatedAt ? ` em ${new Date(draft.updatedAt).toLocaleString('pt-BR')}` : ''}</span></div><span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-slate-600">{countConfiguredStrategyFields(draft)} de {STRATEGY_FIELD_COUNT} diretrizes preenchidas</span></div>{detailTab === 'plan' && <StrategyPlanForm draft={draft} update={update}/>} {detailTab === 'comparison' && <PlannedExecutedComparison strategy={draft}/>} {detailTab === 'rules' && <div className="space-y-4"><ContextCard contexts={contexts} partner={draft.partner}/><GuardrailList contexts={contexts} guardrails={guardrails} partner={draft.partner} severityFilter={severityFilter}/></div>}</> : <EmptyManagementState/>}</div></section>
    </div>}
  </main>;
};

const StrategyEmailTable = ({ strategies, selectedId, onSelect, onClear }: { strategies: EmailStrategy[]; selectedId: string; onSelect: (id: string) => void; onClear: () => void }) => <aside className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><header className="border-b border-slate-200 p-4"><h2 className="font-bold text-slate-900">E-mails da régua</h2><p className="text-xs text-slate-500">Compare função, benefício e prontidão antes de editar.</p></header><div className="max-h-[760px] overflow-auto"><table className="w-full min-w-[590px] table-fixed text-left"><thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-wide text-slate-500"><tr><th className="w-[22%] px-3 py-2.5">E-mail</th><th className="w-[25%] px-3 py-2.5">Papel</th><th className="w-[31%] px-3 py-2.5">Benefício principal</th><th className="w-[22%] px-3 py-2.5">Status</th></tr></thead><tbody className="divide-y divide-slate-100">{strategies.map((item) => { const readiness = strategyReadiness(item); const configured = countConfiguredStrategyFields(item); const active = item.id === selectedId; return <tr key={item.id} onClick={() => onSelect(item.id)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') onSelect(item.id); }} tabIndex={0} aria-selected={active} className={`cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-500 ${active ? 'bg-cyan-50' : 'hover:bg-slate-50'}`}><td className="px-3 py-3 align-top"><b className="block text-xs text-slate-900">{item.weekKey}</b><span className="mt-0.5 block text-[11px] text-slate-500">{item.sequence}</span></td><td className="px-3 py-3 align-top text-xs leading-4 text-slate-700"><span className="line-clamp-2">{item.roleInRuler || <span className="text-amber-700">Preencher</span>}</span></td><td className="px-3 py-3 align-top text-xs leading-4 text-slate-700"><span className="line-clamp-2">{item.primaryBenefit || <span className="text-amber-700">Preencher</span>}</span></td><td className="px-3 py-3 align-top"><span className={`inline-flex rounded-full px-2 py-1 text-[9px] font-bold ${readiness.tone === 'danger' ? 'bg-red-50 text-red-700' : readiness.tone === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'}`}>{readiness.label}</span><span className="mt-1.5 block text-[10px] text-slate-500">{configured}/{STRATEGY_FIELD_COUNT} campos</span></td></tr>; })}</tbody></table>{!strategies.length && <div className="p-8 text-center text-xs text-slate-500">Nenhum e-mail corresponde aos filtros.<button type="button" onClick={onClear} className="mt-2 block w-full font-bold text-cyan-700">Limpar filtros</button></div>}</div></aside>;

const StrategyPlanForm = ({ draft, update }: { draft: EmailStrategy; update: (field: keyof EmailStrategy, value: string | string[]) => void }) => <><PlanSection title="1. Função na régua" description="Defina por que este e-mail existe e que avanço ele deve provocar."><SemanticField fieldName="roleInRuler" label="Papel na régua" help="Explique a função deste contato dentro da sequência: apresentar, aprofundar, provar, recuperar ou converter." result="Ajuda a equipe a evitar repetição e garante progressão entre os e-mails." value={draft.roleInRuler ?? ''} provenance={draft.fieldProvenance.roleInRuler} onChange={(value) => update('roleInRuler', value)}/><SemanticField fieldName="emailObjective" label="Objetivo do e-mail" help="Registre o resultado de comunicação esperado neste envio, sem confundir com a meta geral da campanha." result="Permite revisar se assunto, conteúdo e CTAs trabalham para o mesmo objetivo." value={draft.emailObjective ?? ''} provenance={draft.fieldProvenance.emailObjective} onChange={(value) => update('emailObjective', value)}/><SemanticField fieldName="objectionAddressed" label="Objeção trabalhada" help="Indique a dúvida, barreira ou receio que o conteúdo deve reduzir." result="Direciona argumentos e provas para uma resistência real do público." value={draft.objectionAddressed ?? ''} provenance={draft.fieldProvenance.objectionAddressed} onChange={(value) => update('objectionAddressed', value)}/></PlanSection><PlanSection title="2. Argumento e proposta de valor" description="Organize a promessa central, os benefícios e as evidências que a sustentam."><SemanticField fieldName="keyMessage" label="Mensagem-chave" help="Escreva em uma frase o que a pessoa deve lembrar depois de ler o e-mail." result="Cria uma âncora para título, copy, imagem e repetição da mensagem." value={draft.keyMessage ?? ''} provenance={draft.fieldProvenance.keyMessage} onChange={(value) => update('keyMessage', value)}/><SemanticField fieldName="valueProposition" label="Proposta de valor" help="Descreva por que a oferta é relevante para este público e o valor que ela entrega." result="Mantém a criação conectada ao produto, não apenas à promoção do momento." value={draft.valueProposition ?? ''} provenance={draft.fieldProvenance.valueProposition} onChange={(value) => update('valueProposition', value)}/><SemanticField fieldName="primaryBenefit" label="Benefício principal" help="Escolha o benefício que deve receber maior destaque e aparecer primeiro na hierarquia." result="Define a prioridade editorial e visual do e-mail." value={draft.primaryBenefit ?? ''} provenance={draft.fieldProvenance.primaryBenefit} onChange={(value) => update('primaryBenefit', value)}/><SemanticField fieldName="secondaryBenefits" label="Benefícios complementares" help="Liste um benefício por linha. Inclua apenas argumentos que reforcem a proposta principal." result="Dá repertório para blocos secundários e futuras adaptações sem disputar com a mensagem central." value={draft.secondaryBenefits.join('\n')} provenance={draft.fieldProvenance.secondaryBenefits} onChange={(value) => update('secondaryBenefits', value.split(/\n|;/).map((item) => item.trim()).filter(Boolean))}/><SemanticField fieldName="proof" label="Prova ou sustentação" help="Registre fatos, condições, dados, demonstrações ou evidências aprovadas que sustentam a promessa." result="Reduz claims frágeis e facilita a revisão jurídica e de produto." value={draft.proof ?? ''} provenance={draft.fieldProvenance.proof} onChange={(value) => update('proof', value)}/></PlanSection><PlanSection title="3. Conversão e hierarquia" description="Oriente como a pessoa deve agir e como o conteúdo deve conduzir a leitura."><SemanticField fieldName="expectedAction" label="Ação esperada" help="Descreva o comportamento que se espera após o contato: conhecer, simular, solicitar, retomar ou concluir." result="Serve de critério para avaliar os CTAs e o destino dos links." value={draft.expectedAction ?? ''} provenance={draft.fieldProvenance.expectedAction} onChange={(value) => update('expectedAction', value)}/><SemanticField fieldName="ctaStrategy" label="Estratégia de CTAs" help="Defina quantidade, textos, posições e destinos. O plano pode repetir o CTA principal ou combinar mais de uma chamada quando isso apoiar a conversão." result="Permite usar múltiplos CTAs de forma intencional e mensurável, sem criar uma restrição artificial." value={draft.ctaStrategy ?? ''} provenance={draft.fieldProvenance.ctaStrategy} onChange={(value) => update('ctaStrategy', value)}/><SemanticField fieldName="visualHierarchyStrategy" label="Hierarquia visual" help="Explique o que precisa aparecer primeiro, quais blocos ganham destaque e como a leitura deve evoluir até os CTAs." result="Traduz a estratégia em uma ordem visual reproduzível por designers e por IA." value={draft.visualHierarchyStrategy ?? ''} provenance={draft.fieldProvenance.visualHierarchyStrategy} onChange={(value) => update('visualHierarchyStrategy', value)}/></PlanSection></>;

const PlannedExecutedComparison = ({ strategy }: { strategy: EmailStrategy }) => { const pairs = [{ label: 'Direção da mensagem', planned: strategy.keyMessage, executed: strategy.subject, executedLabel: 'Assunto atual' }, { label: 'Objetivo e abertura', planned: strategy.emailObjective, executed: strategy.preheader, executedLabel: 'Pré-cabeçalho atual' }, { label: 'Benefício prioritário', planned: strategy.primaryBenefit, executed: '', executedLabel: 'Conteúdo do briefing' }, { label: 'Estratégia de CTAs', planned: strategy.ctaStrategy, executed: '', executedLabel: 'CTAs do briefing' }]; return <section><div className="rounded-xl border border-cyan-200 bg-cyan-50 p-3 text-xs leading-5 text-cyan-950"><b>Leitura comparativa</b><p>O assunto e o pré-cabeçalho já vêm da versão atual do briefing. Conteúdo e CTAs permanecem marcados como pendentes de integração para não inferir aderência sem evidência.</p></div><div className="mt-3 space-y-3">{pairs.map((pair) => { const hasExecuted = Boolean(pair.executed?.trim()); return <article key={pair.label} className="overflow-hidden rounded-xl border border-slate-200"><header className="flex items-center justify-between gap-2 bg-slate-50 px-3 py-2"><b className="text-xs text-slate-900">{pair.label}</b><span className={`rounded-full px-2 py-1 text-[9px] font-bold ${hasExecuted ? 'bg-cyan-100 text-cyan-800' : 'bg-amber-100 text-amber-800'}`}>{hasExecuted ? 'Disponível para revisão' : 'Integração pendente'}</span></header><div className="grid gap-px bg-slate-200 md:grid-cols-2"><ComparisonValue label="Planejado" value={pair.planned}/><ComparisonValue label={pair.executedLabel} value={pair.executed}/></div></article>; })}</div></section>; };

const ComparisonValue = ({ label, value }: { label: string; value?: string }) => <div className="min-h-24 bg-white p-3"><span className="text-[9px] font-bold uppercase tracking-wide text-slate-400">{label}</span><p className={`mt-1 text-xs leading-5 ${value ? 'text-slate-700' : 'italic text-slate-400'}`}>{value || 'Ainda não disponível nesta camada.'}</p></div>;

const FilterSelect = ({ label, value, onChange, options, labels = {} }: { label: string; value: string; onChange: (value: string) => void; options: string[]; labels?: Record<string, string> }) => <label><span className="sr-only">{label}</span><select aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none focus:border-cyan-400 focus-visible:ring-2 focus-visible:ring-cyan-100"><option value="">{label}: todos</option>{options.map((option) => <option key={option} value={option}>{labels[option] ?? option}</option>)}</select></label>;
const SummaryChip = ({ label, value, tone = 'neutral' }: { label: string; value: number; tone?: 'neutral' | 'warning' | 'danger' | 'success' }) => <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${tone === 'danger' ? 'bg-red-50 text-red-700' : tone === 'warning' ? 'bg-amber-50 text-amber-800' : tone === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}><b>{value}</b> {label}</span>;
const StrategyOverview = ({ strategies, onOpen }: { strategies: EmailStrategy[]; onOpen: (id: string) => void }) => <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="overflow-x-auto"><table className="min-w-[1050px] w-full text-left"><thead className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">E-mail</th><th className="px-4 py-3">Papel na régua</th><th className="px-4 py-3">Benefício principal</th><th className="px-4 py-3">Proposta de valor</th><th className="px-4 py-3">Completude</th><th className="px-4 py-3">Status</th><th className="px-4 py-3"><span className="sr-only">Ação</span></th></tr></thead><tbody className="divide-y divide-slate-100">{strategies.map((item) => { const readiness = strategyReadiness(item); const configured = countConfiguredStrategyFields(item); return <tr key={item.id} className="hover:bg-cyan-50/40"><td className="px-4 py-3"><b className="block text-xs text-slate-900">{item.weekKey} · {item.sequence}</b><span className="text-[10px] text-slate-500">{item.partner} · {segmentDisplayLabel(item.segment)}</span></td><td className="max-w-56 px-4 py-3 text-xs text-slate-700">{item.roleInRuler || <span className="text-amber-700">Preencher</span>}</td><td className="max-w-56 px-4 py-3 text-xs text-slate-700">{item.primaryBenefit || <span className="text-amber-700">Preencher</span>}</td><td className="max-w-64 px-4 py-3 text-xs text-slate-700">{item.valueProposition || <span className="text-amber-700">Preencher</span>}</td><td className="px-4 py-3"><span className="text-xs font-bold text-slate-800">{configured}/{STRATEGY_FIELD_COUNT}</span><span className="mt-1 block h-1.5 w-24 overflow-hidden rounded-full bg-slate-100"><span className="block h-full rounded-full bg-cyan-600" style={{ width: `${Math.round((configured / STRATEGY_FIELD_COUNT) * 100)}%` }}/></span></td><td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${readiness.tone === 'danger' ? 'bg-red-50 text-red-700' : readiness.tone === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'}`}>{readiness.label}</span></td><td className="px-4 py-3 text-right"><button type="button" onClick={() => onOpen(item.id)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-cyan-800 hover:border-cyan-300">Editar plano</button></td></tr>; })}</tbody></table>{!strategies.length && <div className="p-12 text-center text-sm text-slate-500">Nenhum e-mail corresponde aos filtros selecionados.</div>}</div></section>;
const PlanSection = ({ title, description, children }: { title: string; description: string; children: React.ReactNode }) => <section className="mb-4 rounded-xl border border-slate-200"><header className="border-b border-slate-100 bg-slate-50/70 px-4 py-3"><h3 className="text-sm font-bold text-slate-900">{title}</h3><p className="mt-0.5 text-xs text-slate-500">{description}</p></header><div className="grid gap-3 p-4 md:grid-cols-2">{children}</div></section>;
const SemanticField = ({ fieldName, label, help, result, value, provenance, onChange }: { fieldName: string; label: string; help: string; result: string; value: string; provenance?: string; onChange: (value: string) => void }) => <label className="relative text-xs font-bold text-slate-700"><span className="flex items-center gap-1.5">{label}<details className="group relative"><summary className="list-none rounded-full text-slate-400 outline-none hover:text-cyan-700 focus-visible:ring-2 focus-visible:ring-cyan-400" aria-label={`Ajuda sobre ${label}`}><Info size={14}/></summary><div className="absolute left-0 top-6 z-20 w-72 rounded-xl border border-slate-200 bg-white p-3 text-left shadow-xl"><b className="text-xs text-slate-900">O que preencher</b><p className="mt-1 text-xs font-normal leading-5 text-slate-600">{help}</p><b className="mt-2 block text-xs text-cyan-900">Resultado esperado</b><p className="mt-1 text-xs font-normal leading-5 text-slate-600">{result}</p></div></details>{provenance && <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-semibold text-slate-500">{provenance}</span>}</span><textarea name={fieldName} value={value} onChange={(event) => onChange(event.target.value)} rows={3} className="mt-1 w-full resize-y rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal leading-5 text-slate-800 outline-none placeholder:text-slate-400 focus:border-cyan-400 focus-visible:ring-2 focus-visible:ring-cyan-100" placeholder="Clique no (i) para ver como preencher."/></label>;
const ContextCard = ({ contexts, partner }: { contexts: ProductContext[]; partner: string }) => { const items = contexts.filter((item) => !item.partner || item.partner === partner); return <section className="rounded-xl border border-slate-200 p-3"><div className="flex items-center gap-2"><Info size={15} className="text-cyan-700"/><h3 className="text-sm font-bold text-slate-900">Referências de produto</h3></div><p className="mt-1 text-[11px] text-slate-500">Contexto governado para apoiar o preenchimento; não substitui a validação dos claims.</p>{items.length ? items.map((item) => <div key={item.id} className="mt-2 rounded-lg bg-slate-50 p-3"><div className="flex items-center justify-between gap-2"><b className="text-xs">{item.product}</b><span className="text-[10px] text-slate-500">v{item.version} · {item.provenance || 'sem fonte'}</span></div><p className="mt-1 text-xs leading-5 text-slate-600">{item.valueProposition || 'Proposta de valor ainda não cadastrada.'}</p></div>) : <p className="mt-2 text-xs text-slate-500">Nenhuma referência governada para este parceiro.</p>}</section>; };
const GuardrailList = ({ contexts, guardrails, partner, severityFilter }: { contexts: ProductContext[]; guardrails: ProductGuardrail[]; partner: string; severityFilter: ProductGuardrail['severity'] | '' }) => { const ids = new Set(contexts.filter((item) => !item.partner || item.partner === partner).map((item) => item.id)); const applicable = guardrails.filter((item) => ids.has(item.productContextId)); const items = severityFilter ? applicable.filter((item) => item.severity === severityFilter) : applicable; const counts = { hard_block: applicable.filter((item) => item.severity === 'hard_block').length, requires_review: applicable.filter((item) => item.severity === 'requires_review').length, advisory: applicable.filter((item) => item.severity === 'advisory').length }; return <section className="rounded-xl border border-slate-200 p-3"><div className="flex flex-wrap items-start justify-between gap-2"><div><div className="flex items-center gap-2"><ShieldAlert size={15} className="text-amber-700"/><h3 className="text-sm font-bold text-slate-900">Regras aplicáveis</h3></div><p className="mt-1 text-[11px] text-slate-500">Estas regras valem para o contexto selecionado; não significam que uma violação foi encontrada.</p></div><div className="flex gap-1"><SummaryChip label="bloqueiam" value={counts.hard_block} tone="danger"/><SummaryChip label="validar" value={counts.requires_review} tone="warning"/><SummaryChip label="orientam" value={counts.advisory}/></div></div>{items.length ? items.map((item) => <details key={item.id} open={item.severity !== 'advisory'} className={`mt-2 rounded-lg border ${item.severity === 'hard_block' ? 'border-red-200 bg-red-50' : item.severity === 'requires_review' ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-slate-50'}`}><summary className="flex cursor-pointer list-none items-center justify-between gap-2 p-3"><b className="text-xs">{item.title}</b><span className={`rounded-full px-2 py-1 text-[9px] font-bold uppercase ${item.severity === 'hard_block' ? 'bg-red-100 text-red-700' : item.severity === 'requires_review' ? 'bg-amber-100 text-amber-800' : 'bg-white text-slate-600'}`}>{item.severity === 'hard_block' ? 'Bloqueia publicação' : item.severity === 'requires_review' ? 'Exige validação' : 'Orientação'}</span></summary><div className="border-t border-black/5 px-3 pb-3"><p className="mt-2 text-xs leading-5 text-slate-700">{item.ruleText}</p>{item.evidence && <p className="mt-1 text-[10px] leading-4 text-slate-500"><b>Evidência:</b> {item.evidence}</p>}</div></details>) : <p className="mt-3 rounded-lg bg-slate-50 p-3 text-xs text-slate-500">Nenhuma regra neste filtro. Isso não representa liberação automática de claims.</p>}</section>; };

const ExternalReviewWorkspace = ({ runs, suggestions, syncState, onRefresh, onDecide }: { runs: ExternalReviewRun[]; suggestions: ExternalSuggestion[]; syncState: string; onRefresh: () => void; onDecide: (id: string, status: 'accepted' | 'rejected') => Promise<void> }) => <main className="mt-4 min-h-[720px] rounded-2xl border border-slate-200 bg-white shadow-sm"><header className="border-b border-slate-200 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-bold text-slate-900">Revisões externas</h2><p className="text-xs text-slate-500">{syncState}. A Fábrica não executa IA automaticamente.</p></div><button type="button" onClick={onRefresh} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold"><RefreshCw size={14}/>Atualizar resultados</button></div></header><div className="grid gap-4 p-4 xl:grid-cols-[340px_minmax(0,1fr)]"><section><div className="rounded-xl border border-violet-200 bg-violet-50 p-3 text-xs text-violet-950"><b>Como funciona</b><p className="mt-1">Peça a análise no chat para uma IA autorizada a ler o Supabase. Ela registra contexto, evidências e sugestões; esta tela apenas permite revisar e decidir.</p></div><div className="mt-3 space-y-2">{runs.map((run) => <div key={run.id} className="rounded-xl border border-slate-200 p-3"><div className="flex items-center justify-between gap-2"><b className="text-xs">{run.analysisType}</b><span className="rounded-full bg-slate-100 px-2 py-1 text-[9px] font-bold uppercase">{run.status}</span></div><p className="mt-1 text-[11px] text-slate-500">{run.scopeType} · {run.scopeId}</p><p className="mt-1 text-[10px] text-slate-400">Executor: {run.executor} · {new Date(run.createdAt).toLocaleString('pt-BR')}</p></div>)}{!runs.length && <EmptyManagementState/>}</div></section><section><h3 className="mb-2 text-sm font-bold text-slate-900">Sugestões com comparação</h3><div className="space-y-3">{suggestions.map((item) => <article key={item.id} className="rounded-xl border border-slate-200 p-3"><div className="flex flex-wrap items-center justify-between gap-2"><b className="text-xs text-slate-900">{item.fieldName}</b><span className="text-[10px] text-slate-500">Confiança: {item.confidence == null ? 'não informada' : `${Math.round(item.confidence * 100)}%`}</span></div><div className="mt-2 grid gap-2 md:grid-cols-2"><DiffValue label="Antes" value={item.previousValue}/><DiffValue label="Sugestão" value={item.suggestedValue} proposed/></div><p className="mt-2 text-xs text-slate-700">{item.justification}</p>{item.status === 'suggested' ? <div className="mt-3 flex gap-2"><button type="button" onClick={() => void onDecide(item.id, 'accepted')} className="rounded-lg bg-[#07595b] px-3 py-2 text-xs font-bold text-white">Aceitar para aplicação manual</button><button type="button" onClick={() => void onDecide(item.id, 'rejected')} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700">Rejeitar</button></div> : <span className="mt-3 inline-flex rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase">{item.status}</span>}</article>)}{!suggestions.length && <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">Nenhuma sugestão externa registrada.</p>}</div></section></div></main>;
const DiffValue = ({ label, value, proposed = false }: { label: string; value: unknown; proposed?: boolean }) => <div className={`rounded-lg border p-2 ${proposed ? 'border-emerald-200 bg-emerald-50' : 'border-red-100 bg-red-50/50'}`}><div className="text-[9px] font-bold uppercase text-slate-500">{label}</div><pre className="mt-1 whitespace-pre-wrap break-words font-sans text-xs text-slate-800">{typeof value === 'string' ? value : JSON.stringify(value, null, 2)}</pre></div>;
const EmptyManagementState = () => <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-xs text-slate-500">A camada existe, mas ainda não recebeu conteúdo governado.</div>;

const SignatureMatrix = ({ rows, selected, onEnsure, onSelect, onManage }: { rows: WorkspaceBriefing[]; selected: WorkspaceBriefing; onEnsure: () => void; onSelect: (id: string) => void; onManage: () => void }) => {
  const group = rows.filter((row) => row.__meta.campaignGroupId === selected.__meta.campaignGroupId);
  const isPlurix = group.some((row) => PLURIX_SIGNATURES.some(({ key }) => key === row.NM_PRODUTO_INTERNO.toUpperCase()));
  if (!isPlurix) return null;
  return <div className="mb-3 rounded-xl border border-violet-200 bg-violet-50 p-3"><div className="flex items-center justify-between gap-2"><div><b className="text-sm text-violet-950">Assinaturas Plurix</b><p className="text-xs text-violet-700">Um briefing visual; somente assinaturas ativas entram no CSV.</p></div><div className="flex gap-2"><button onClick={onEnsure} className="rounded-lg border border-violet-300 bg-white px-3 py-2 text-xs font-bold text-violet-800">Completar ativas</button><button onClick={onManage} className="inline-flex items-center gap-1 rounded-lg bg-violet-700 px-3 py-2 text-xs font-bold text-white"><Settings2 size={13}/>Gerenciar</button></div></div><div className="mt-2 flex flex-wrap gap-1.5">{PLURIX_SIGNATURES.map(({ key, label }) => { const row = group.find((item) => item.NM_PRODUTO_INTERNO.toUpperCase() === key && item.__meta.status !== 'archived'); return <button key={key} disabled={!row} onClick={() => row && onSelect(row.__id)} className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${row?.__id === selected.__id ? 'border-violet-700 bg-violet-700 text-white' : row ? 'border-violet-200 bg-white text-violet-800' : 'border-slate-200 text-slate-400'}`}>{label} {row ? '✓' : '—'}</button>; })}</div></div>;
};

const NewBriefingDialog = ({ groups, settings, taxonomy, defaultPartner, defaultSegment, defaultWeekKey, defaultSequence, onClose, onCreate }: { groups: EditorialGroup[]; settings: SignatureSetting[]; taxonomy: ActivityTaxonomy[]; defaultPartner: string; defaultSegment: string; defaultWeekKey: string; defaultSequence: string; onClose: () => void; onCreate: (config: NewBriefingConfig) => void }) => {
  const available = PLURIX_SIGNATURES.filter(({ key }) => settings.find((item) => item.partner === 'Plurix' && item.signatureKey === key)?.status !== 'inactive');
  const partnerOptions = [...new Set(taxonomy.map((item) => item.partner).filter((value) => value && value !== 'N/A'))].sort(naturalLabelSort);
  const initialPartner = partnerOptions.includes(defaultPartner) ? defaultPartner : partnerOptions[0] ?? defaultPartner;
  const [partner, setPartner] = useState(initialPartner);
  const segmentOptions = useMemo(() => [...new Set(taxonomy.filter((item) => item.partner === partner).map((item) => item.segment).filter(Boolean))].sort(naturalLabelSort), [partner, taxonomy]);
  const [segment, setSegment] = useState(segmentOptions.includes(defaultSegment) ? defaultSegment : segmentOptions[0] ?? ''); const [weekKey, setWeekKey] = useState(defaultWeekKey); const [sequence, setSequence] = useState(defaultSequence); const [sourceGroupId, setSourceGroupId] = useState(''); const [signatureKeys, setSignatureKeys] = useState<string[]>(available.map((item) => item.key));
  useEffect(() => { if (!segmentOptions.includes(segment)) setSegment(segmentOptions[0] ?? ''); }, [segment, segmentOptions]);
  const toggleSignature = (key: string) => setSignatureKeys((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key]);
  const isPlurix = partner.toLowerCase() === 'plurix';
  const sourceGroups = groups.filter((group) => group.representative.__meta.partner === partner && group.representative.__meta.segment === segment);
  const canCreate = taxonomyStateAllows(partnerOptions, segmentOptions, partner, segment) && weekKey && sequence.trim() && (!isPlurix || signatureKeys.length > 0);
  return <div className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/65 p-4" role="dialog" aria-modal="true" aria-labelledby="new-briefing-title" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl"><header className="flex items-start justify-between border-b border-slate-200 p-5"><div><h2 id="new-briefing-title" className="text-lg font-bold text-slate-900">Novo e-mail editorial</h2><p className="mt-1 text-sm text-slate-500">Parceiros e segmentos são selecionados exclusivamente da taxonomia existente em activities.</p></div><button onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Fechar"><X size={19}/></button></header><div className="space-y-5 p-5"><div className="grid gap-3 sm:grid-cols-2"><label className="text-xs font-semibold text-slate-700">Parceiro<select value={partner} onChange={(event) => setPartner(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">{partnerOptions.map((value) => <option key={value}>{value}</option>)}</select></label><label className="text-xs font-semibold text-slate-700">Segmento existente em activities<select value={segment} onChange={(event) => setSegment(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">{segmentOptions.map((value) => <option key={value} value={value}>{segmentDisplayLabel(value)}</option>)}</select></label><label className="text-xs font-semibold text-slate-700">Semana editorial<select value={weekKey} onChange={(event) => setWeekKey(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">{EDITORIAL_WEEKS.map((week) => <option key={week}>{week}</option>)}</select></label><label className="text-xs font-semibold text-slate-700">Sequência<input value={sequence} onChange={(event) => setSequence(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"/></label></div><label className="block text-xs font-semibold text-slate-700">Origem do conteúdo<select value={sourceGroupId} onChange={(event) => setSourceGroupId(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"><option value="">Começar em branco</option>{sourceGroups.map((group) => <option key={group.id} value={group.id}>Duplicar {group.representative.__meta.weekKey} · {group.representative.SEQUENCIA} · {group.representative.ASSUNTO || 'sem assunto'}</option>)}</select></label>{isPlurix && <fieldset><legend className="text-xs font-semibold text-slate-700">Assinaturas deste e-mail</legend><div className="mt-2 grid gap-2 sm:grid-cols-2 md:grid-cols-3">{available.map(({ key, label }) => <label key={key} className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border px-3 text-sm font-semibold ${signatureKeys.includes(key) ? 'border-cyan-300 bg-cyan-50 text-cyan-950' : 'border-slate-200 text-slate-500'}`}><input type="checkbox" checked={signatureKeys.includes(key)} onChange={() => toggleSignature(key)} className="accent-cyan-700"/>{label}</label>)}</div></fieldset>}</div><footer className="flex justify-end gap-2 border-t border-slate-200 p-5"><button onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700">Cancelar</button><button disabled={!canCreate} onClick={() => onCreate({ partner, segment, weekKey, sequence: sequence.trim(), sourceGroupId, signatureKeys })} className="rounded-lg bg-[#07595b] px-4 py-2 text-sm font-bold text-white disabled:opacity-40">{isPlurix ? `Criar ${signatureKeys.length} variações` : 'Criar e-mail'}</button></footer></div></div>;
};

const taxonomyStateAllows = (partners: string[], segments: string[], partner: string, segment: string) => partners.includes(partner) && segments.includes(segment);

const SignatureManagerModal = ({ rows, selected, settings, onClose, onVariantStatus, onGlobalStatus, onAdd }: { rows: WorkspaceBriefing[]; selected: WorkspaceBriefing; settings: SignatureSetting[]; onClose: () => void; onVariantStatus: (row: WorkspaceBriefing, status: 'draft' | 'archived') => void; onGlobalStatus: (setting: SignatureSetting, status: 'active' | 'inactive') => void; onAdd: (signatureKey: string) => void }) => {
  const group = rows.filter((row) => row.__meta.campaignGroupId === selected.__meta.campaignGroupId);
  return <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/65 p-4" role="dialog" aria-modal="true" aria-labelledby="signature-manager-title" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><div className="flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"><header className="flex items-start justify-between gap-3 border-b border-slate-200 p-5"><div><h2 id="signature-manager-title" className="text-lg font-bold text-slate-900">Gerenciar assinaturas</h2><p className="mt-1 text-sm text-slate-500">{selected.__meta.partner} · {selected.__meta.weekKey} · {selected.SEQUENCIA}. Desativar preserva o histórico e retira a variante dos próximos CSVs.</p></div><button autoFocus onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Fechar gerenciador"><X size={19}/></button></header><div className="overflow-y-auto p-5"><div className="overflow-hidden rounded-xl border border-slate-200">{PLURIX_SIGNATURES.map(({ key, label }) => { const setting = settings.find((item) => item.partner === 'Plurix' && item.signatureKey === key) ?? { partner: 'Plurix', signatureKey: key, signatureLabel: label, status: 'active' as const }; const row = group.find((item) => item.NM_PRODUTO_INTERNO.toUpperCase() === key); const globalInactive = setting.status === 'inactive'; const variantArchived = row?.__meta.status === 'archived'; return <div key={key} className="grid gap-3 border-b border-slate-100 p-4 last:border-b-0 md:grid-cols-[minmax(150px,1fr)_minmax(170px,0.8fr)_auto]"><div className="flex items-center gap-3"><span className={`h-2.5 w-2.5 rounded-full ${globalInactive ? 'bg-slate-300' : variantArchived || !row ? 'bg-amber-400' : 'bg-emerald-500'}`}/><div><div className="font-bold text-slate-900">{label}</div><div className="text-xs text-slate-500">{globalInactive ? 'Inativa para novos e-mails Plurix' : variantArchived ? 'Arquivada neste e-mail' : row ? 'Ativa neste e-mail' : 'Não adicionada neste e-mail'}</div></div></div><div className="text-xs text-slate-500">{setting.effectiveFrom && globalInactive ? `Desativada desde ${new Date(`${setting.effectiveFrom}T12:00:00`).toLocaleDateString('pt-BR')}` : globalInactive ? 'Desativada globalmente' : 'Disponível globalmente'}</div><div className="flex flex-wrap justify-end gap-2">{globalInactive ? <button type="button" onClick={() => onGlobalStatus(setting, 'active')} className="rounded-lg border border-emerald-300 px-3 py-2 text-xs font-bold text-emerald-800">Reativar na Plurix</button> : <>{!row && <button type="button" onClick={() => onAdd(key)} className="rounded-lg bg-cyan-700 px-3 py-2 text-xs font-bold text-white">Adicionar ao e-mail</button>}{row && variantArchived && <button type="button" onClick={() => onVariantStatus(row, 'draft')} className="rounded-lg border border-cyan-300 px-3 py-2 text-xs font-bold text-cyan-800">Restaurar neste e-mail</button>}{row && !variantArchived && <button type="button" onClick={() => onVariantStatus(row, 'archived')} className="rounded-lg border border-amber-300 px-3 py-2 text-xs font-bold text-amber-900">Desativar neste e-mail</button>}<button type="button" onClick={() => onGlobalStatus(setting, 'inactive')} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-700">Desativar na Plurix</button></>}</div></div>; })}</div><div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600"><b>Regra de segurança:</b> variações nunca salvas são removidas do rascunho. Variações com histórico são arquivadas e continuam disponíveis no filtro <b>Arquivadas</b>.</div></div></div></div>;
};

const LegalTools = ({ selected, legalTexts, updateSelected }: { selected: WorkspaceBriefing; legalTexts: LegalText[]; updateSelected: (patch: Partial<WorkspaceBriefing>) => void }) => <div className="mb-3 rounded-lg bg-slate-50 p-3"><div className="flex flex-wrap items-end gap-2"><label className="min-w-52 flex-1 text-xs font-semibold text-slate-700">Texto legal salvo<select defaultValue="" onChange={(event) => { const item = legalTexts.find((legal) => legal.id === event.target.value); if (item) updateSelected({ NOTA_LEGAL: item.legalText, COR_NOTA_LEGAL: item.color, TAMANHO_DA_FONTE_NOTA_LEGAL: item.fontSize }); }} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"><option value="">Escolha um texto aprovado…</option>{legalTexts.map((item) => <option key={item.id} value={item.id}>{item.name} · v{item.version}</option>)}</select></label><label className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900"><input type="checkbox" checked={!!selected.__meta.legalOverride} onChange={(event) => updateSelected({ __meta: { ...selected.__meta, legalOverride: event.target.checked } })}/>Editar só esta linha</label></div><p className="mt-2 text-[11px] text-slate-500">Por padrão, a nota legal é compartilhada entre as assinaturas. O override avançado evita propagação e fica registrado na auditoria.</p></div>;

const SaveDialog = ({ selected, errors, saving, onClose, onSave, updateSelected }: { selected: WorkspaceBriefing; errors: number; saving: boolean; onClose: () => void; onSave: (ready: boolean) => void; updateSelected: (patch: Partial<WorkspaceBriefing>) => void }) => { const missing = !selected.__meta.activityNames.length; return <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/60 p-4" role="dialog" aria-modal="true"><div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl"><h2 className="text-lg font-bold text-slate-900">Salvar briefing</h2><p className="mt-1 text-sm text-slate-600">Será criada a versão {selected.__meta.savedAt ? selected.__meta.version + 1 : selected.__meta.version} com registro de auditoria e ela será definida como a versão atual.</p>{missing && <label className="mt-4 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950"><input type="checkbox" disabled={saving} checked={!!selected.__meta.acknowledgedMissingActivity} onChange={(event) => updateSelected({ __meta: { ...selected.__meta, acknowledgedMissingActivity: event.target.checked } })}/><span><b>Activity Name não informado.</b><br/>Confirmo que quero salvar sem o identificador recomendado para auditoria.</span></label>}{errors > 0 && <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-800">Existem {errors} erros. Salve como rascunho e corrija antes de marcar como pronto.</p>}<div className="mt-5 flex justify-end gap-2"><button type="button" onClick={onClose} disabled={saving} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold disabled:opacity-40">Cancelar</button><button type="button" onClick={() => onSave(false)} disabled={saving || (missing && !selected.__meta.acknowledgedMissingActivity)} className="rounded-lg border border-cyan-700 px-4 py-2 text-sm font-bold text-cyan-800 disabled:opacity-40">{saving ? 'Salvando…' : 'Salvar rascunho'}</button><button type="button" onClick={() => onSave(true)} disabled={saving || errors > 0 || (missing && !selected.__meta.acknowledgedMissingActivity)} className="rounded-lg bg-cyan-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-40">{saving ? 'Salvando…' : 'Salvar como pronto'}</button></div></div></div>; };

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
