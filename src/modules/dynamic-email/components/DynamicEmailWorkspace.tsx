import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { getLocalViewport, toLocalRect } from '../../../context/UIScaleContext';
import {
  AlertTriangle,
  ArchiveRestore,
  ArrowRightLeft,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
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
  Lock,
  Mail,
  MessageSquareText,
  Maximize2,
  Pencil,
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
  parseBriefingDate,
  templateActiveColumns,
  toDateInput,
  validateRows,
  type BriefingColumn,
  type BriefingRow,
  type ValidationIssue,
} from '../domain/briefing';
import { DEFAULT_DYNAMIC_EMAIL_TEMPLATE } from '../fixtures/defaultTemplate';
import { PLURIX_UX_V2_TEMPLATE, PLURIX_UX_V2_TEMPLATE_ID } from '../fixtures/plurixUxV2Template';
import { PLURIX_V8_TEMPLATE, PLURIX_V8_TEMPLATE_ID, PLURIX_V8_TEMPLATE_NAME } from '../fixtures/plurixV8Template';
import { PLURIX_V9_TEMPLATE, PLURIX_V9_TEMPLATE_ID, PLURIX_V9_TEMPLATE_NAME } from '../fixtures/plurixV9Template';
import { B2C_CLASSIC_VIBE_DYNAMIC_TEMPLATE, B2C_CLASSIC_VIBE_DYNAMIC_TEMPLATE_ID } from '../fixtures/b2cClassicVibeDynamicTemplate';
import { applyWorkspaceField, briefingRowsForView, ensurePlurixVariants, normalizeLegacyRows, partnerLabel, PLURIX_SIGNATURES, withMeta, type ActivityTaxonomy, type EmailAsset, type EmailTemplateSlot, type LegalText, type SignatureSetting, type WorkspaceBriefing } from '../domain/workspace';
import { projectMarketingPreview } from '../domain/previewProjection';
import { deleteTemplateSlot as deleteSharedTemplateSlot, loadActivityTaxonomy, loadAssets, loadBriefings, loadLegalTexts, loadSignatureSettings, migrateLocalTemplateSlots, onlyCsvRows, recordExport, saveAsset, saveBriefing, saveBriefings, saveDraftEmailFactorySegment, saveSignatureSetting, saveTemplateSlot, setPrincipalTemplateSlot } from '../services/workspaceService';
import { countConfiguredStrategyFields, journeyContextForStrategy, STRATEGY_FIELD_COUNT, strategyReadiness, type EmailStrategy, type ExternalReviewRun, type ExternalSuggestion, type JourneyContext, type ProductContext, type ProductGuardrail } from '../domain/management';
import { createRulerManagementPlan, decideExternalSuggestion, loadEmailStrategies, loadExternalReviews, loadProductGovernance, saveEmailStrategy, saveProductContext, saveProductGuardrail } from '../services/managementService';
import { exportStrategyPlanXlsx } from '../export/strategyPlanXlsx';
import { CreateRulerDialog, type CreateRulerConfig } from './CreateRulerDialog';
import { DuplicateRulerDialog, type DuplicateRulerConfig } from './DuplicateRulerDialog';
import { MoveEmailDialog, type MoveEmailTarget } from './MoveEmailDialog';
import { PreviewWithStructure, type StructureBlock } from './PreviewWithStructure';
import { EmailPreviewFrame, emailPreviewContextKey } from './EmailPreviewFrame';

const TEMPLATE_KEY = 'gaas-dynamic-email-template-v1';
const TEMPLATE_SLOTS_KEY = 'gaas-dynamic-email-template-slots-v5';
const LEGACY_TEMPLATE_SLOTS_KEY = 'gaas-dynamic-email-template-slots-v4';
const OLDER_TEMPLATE_SLOTS_KEYS = ['gaas-dynamic-email-template-slots-v3', 'gaas-dynamic-email-template-slots-v2'];
const PRIMARY_TEMPLATE_KEY = 'gaas-dynamic-email-primary-template-v2';
const ROWS_KEY = 'gaas-dynamic-email-briefings-v1';
const COLS_KEY = 'gaas-email-factory-cols-v1';
const DEFAULT_COLS: [number, number, number] = [1.15, 2.55, 2.1];
const SAMPLE: SubscriberSample = { CPF: '00000000000', PRI_NOME: 'VANIA', LIMITE: 'R$ 3.500', PRODUTO: 'INSTITUCIONAL', SEQUENCIA: 'E-mail 1', TP_CAMPANHA: 'Repescagem' };
const LONG_FIELDS = new Set<BriefingColumn>(['COPY_1_PRETO', 'COPY_2_PRETO', 'NOTA_LEGAL', 'RODAPE', 'PRE_CABECALHO']);
const COLOR_FIELDS = new Set<BriefingColumn>(['COR_COPY_1', 'COR_COPY_PRETO_1', 'COR_TITULO_COPY_2', 'COR_COPY_2', 'COR_NOTA_LEGAL']);
const EDITORIAL_WEEKS = Array.from({ length: 12 }, (_, index) => `Semana ${index + 1}`);
const ACQUISITION_PARTNER_SLOTS = ['Dia', 'Bem Barato', 'Super Nosso'] as const;

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

const AUDIT_SECTION_ID = 'organizacao';
const ALL_EDITOR_BLOCK_IDS = [AUDIT_SECTION_ID, ...EDITOR_SECTIONS.map((section) => section.id)];

// Blocos que viram uma região visível na peça renderizada — recebem número no editor e um pino na prévia.
const STRUCTURE_BLOCKS: { id: string; num: number; label: string; textFields: BriefingColumn[]; imageField?: BriefingColumn }[] = [
  { id: 'header', num: 1, label: 'Cabeçalho', textFields: [], imageField: 'HEADER' },
  { id: 'primary', num: 2, label: 'Bloco principal', textFields: ['TITULO_COPY_1_AZUL', 'COPY_1_PRETO', 'TITULO_CTA_1'], imageField: 'BANNER_1_CORPO' },
  { id: 'secondary', num: 3, label: 'Segundo bloco', textFields: ['TITULO_COPY_2', 'COPY_2_PRETO', 'TITULO_CTA_2'], imageField: 'BANNER_2_CORPO' },
  { id: 'closing', num: 4, label: 'Encerramento', textFields: [], imageField: 'BANNER_3_CORPO' },
  { id: 'legal', num: 5, label: 'Info. legais', textFields: ['NOTA_LEGAL', 'RODAPE'] },
];
const STRUCTURE_NUM: Record<string, number> = Object.fromEntries(STRUCTURE_BLOCKS.map((block) => [block.id, block.num]));
const stripHtmlToText = (value: string) => value.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').trim();
// remove AMPscript/handlebars inline (%%=v(@X)=%%, %%[ ... ]%%, {{ x }}) — a prévia renderiza esses tokens
// resolvidos, então a âncora precisa casar pelo texto literal que sobra.
const stripDynamicTokens = (value: string) => value
  .replace(/%%\[[\s\S]*?\]%%/g, ' ')
  .replace(/%%=[\s\S]*?=%%/g, ' ')
  .replace(/%%[\s\S]*?%%/g, ' ')
  .replace(/\{\{[\s\S]*?\}\}/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

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

function shiftBriefingDate(value: string, months: number, days: number): string {
  if (!months && !days) return value;
  const date = parseBriefingDate(value);
  if (!date) return value;
  const next = new Date(date);
  if (months) next.setMonth(next.getMonth() + months);
  if (days) next.setDate(next.getDate() + days);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${next.getFullYear()}-${pad(next.getMonth() + 1)}-${pad(next.getDate())}T${pad(next.getHours())}:${pad(next.getMinutes())}`;
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
    : slot.id === PLURIX_V9_TEMPLATE_ID
      ? { ...slot, name: PLURIX_V9_TEMPLATE_NAME, source: PLURIX_V9_TEMPLATE, updatedAt: '2026-09-02T20:45:00.000Z' }
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
  const [previewToolsOpen, setPreviewToolsOpen] = useState<boolean>(() => {
    try { return localStorage.getItem('gaas-email-preview-tools-v1') !== '0'; } catch { return true; }
  });
  useEffect(() => { try { localStorage.setItem('gaas-email-preview-tools-v1', previewToolsOpen ? '1' : '0'); } catch { /* ignore */ } }, [previewToolsOpen]);
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
  const [treeDimension, setTreeDimension] = useState<'partner' | 'journey'>(() => { try { return localStorage.getItem('gaas-email-tree-dimension-v1') === 'journey' ? 'journey' : 'partner'; } catch { return 'partner'; } });
  const [duplicateRulerOpen, setDuplicateRulerOpen] = useState(false);
  const [newDefaults, setNewDefaults] = useState<{ partner: string; segment: string; weekKey: string; journeyContext?: JourneyContext }>({ partner: 'Plurix', segment: 'CRM', weekKey: 'Semana 1' });
  const [selectedWeek, setSelectedWeek] = useState<WeekSelection | null>(null);
  const [selectedSegment, setSelectedSegment] = useState<SegmentSelection | null>(null);
  const [weekArchiveTarget, setWeekArchiveTarget] = useState<{ partner: string; segment: string; weekKey: string } | null>(null);
  const [segmentArchiveTarget, setSegmentArchiveTarget] = useState<{ partner: string; segment: string } | null>(null);
  const [renameTarget, setRenameTarget] = useState<{ kind: 'week' | 'segment'; partner: string; segment: string; weekKey?: string; current: string } | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [moveTarget, setMoveTarget] = useState<{ groupId: string; label: string; current: { partner: string; segment: string; weekKey: string } } | null>(null);
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());
  const [editorHoverBlock, setEditorHoverBlock] = useState<string | null>(null);
  const [railHoverBlock, setRailHoverBlock] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportSelection, setExportSelection] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{ id: number; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const templateFileRef = useRef<HTMLInputElement>(null);
  const workspaceGridRef = useRef<HTMLDivElement>(null);
  const [cols, setCols] = useState<[number, number, number]>(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(COLS_KEY) || 'null');
      if (Array.isArray(stored) && stored.length === 3 && stored.every((value) => typeof value === 'number' && value > 0)) {
        return stored as [number, number, number];
      }
    } catch { /* ignore */ }
    return [...DEFAULT_COLS] as [number, number, number];
  });
  useEffect(() => { localStorage.setItem(COLS_KEY, JSON.stringify(cols)); }, [cols]);
  const startColDrag = (edge: 0 | 1) => (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    const grid = workspaceGridRef.current;
    if (!grid) return;
    const width = grid.getBoundingClientRect().width;
    if (width <= 0) return;
    const startX = event.clientX;
    const base = [...cols] as [number, number, number];
    const total = base[0] + base[1] + base[2];
    const minFr = total * 0.13;
    const left = edge;
    const right = edge + 1;
    const onMove = (moveEvent: PointerEvent) => {
      const deltaFr = ((moveEvent.clientX - startX) / width) * total;
      let nextLeft = base[left] + deltaFr;
      let nextRight = base[right] - deltaFr;
      if (nextLeft < minFr) { nextRight -= minFr - nextLeft; nextLeft = minFr; }
      if (nextRight < minFr) { nextLeft -= minFr - nextRight; nextRight = minFr; }
      const next = [...base] as [number, number, number];
      next[left] = nextLeft;
      next[right] = nextRight;
      setCols(next);
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      document.body.style.removeProperty('cursor');
      document.body.style.removeProperty('user-select');
    };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };
  const resetCols = () => setCols([...DEFAULT_COLS] as [number, number, number]);

  useEffect(() => { localStorage.setItem(ROWS_KEY, JSON.stringify(rows)); }, [rows]);
  useEffect(() => {
    if (!announcement) return;
    const id = Date.now();
    setToast({ id, text: announcement });
    const timer = window.setTimeout(() => setToast((current) => (current?.id === id ? null : current)), 6000);
    return () => window.clearTimeout(timer);
  }, [announcement]);
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
        : slot.id === PLURIX_V9_TEMPLATE_ID
          ? { ...slot, name: PLURIX_V9_TEMPLATE_NAME, source: PLURIX_V9_TEMPLATE, version: Math.max(slot.version, 1), updatedAt: '2026-09-02T20:45:00.000Z' }
        : slot);
      const principal = effectiveSharedTemplates.find((slot) => slot.isPrincipal) ?? effectiveSharedTemplates[0];
      setTemplateSlots(effectiveSharedTemplates); setPrincipalTemplateId(principal.id); setSelectedTemplateId(principal.id); setTemplate(principal.source); setSavedTemplate(principal.source);
      setTemplateSyncState('Compartilhado com todos os usuários');
    } else setTemplateSyncState('Cache local — falha ao sincronizar templates');
    setSyncState(briefings.status === 'fulfilled' ? 'Sincronizado com o GaaS' : 'Rascunho local — não sincronizado');
  }); void refreshTaxonomy(); }, []);
  const activeRows = useMemo(() => rows.filter((row) => row.__meta.status !== 'archived'), [rows]);
  const issuesByRow = useMemo(() => validateRows(activeRows), [activeRows]);
  const rowsInCurrentView = useMemo(() => briefingRowsForView(rows, showArchived), [rows, showArchived]);
  const selected = rowsInCurrentView.find((row) => row.__id === selectedId) ?? rowsInCurrentView[0];
  useEffect(() => { setOpenSections(new Set()); setEditorHoverBlock(null); setRailHoverBlock(null); }, [selected?.__id]);
  const toggleSection = (id: string) => setOpenSections((current) => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  const focusStructureBlock = (id: string) => {
    setOpenSections((current) => (current.has(id) ? current : new Set(current).add(id)));
    setEditorHoverBlock(id);
    requestAnimationFrame(() => setTimeout(() => document.getElementById(`eb-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 30));
  };
  const activeStructureBlock = railHoverBlock ?? editorHoverBlock ?? [...openSections].find((id) => id in STRUCTURE_NUM) ?? null;
  const selectedIssues = selected ? issuesByRow.get(selected.__id) ?? [] : [];
  const linkedTemplateId = selected?.__meta.templateSlotId && templateSlots.some((slot) => slot.id === selected.__meta.templateSlotId)
    ? selected.__meta.templateSlotId
    : effectivePrincipalId;
  const previewTemplate = templateSlots.find((slot) => slot.id === linkedTemplateId)?.source ?? savedTemplate;
  const previewRow = useMemo(() => selected && !showMarketingNotes ? projectMarketingPreview(selected, rows, assets) : selected, [assets, rows, selected, showMarketingNotes]);
  const render = useMemo(() => previewRow ? renderDynamicEmail(previewTemplate, previewRow, { ...subscriber, PRODUTO: previewRow.NM_PRODUTO_INTERNO, SEQUENCIA: previewRow.SEQUENCIA, TP_CAMPANHA: previewRow.TP_CAMPANHA }, { pendingAssets: showMarketingNotes ? 'observations' : 'hidden' }) : { html: '', diagnostics: [] }, [previewRow, previewTemplate, showMarketingNotes, subscriber]);
  const previewContextKey = emailPreviewContextKey(selected?.__id ?? '', linkedTemplateId);
  const templateActiveCols = useMemo(() => templateActiveColumns(previewTemplate), [previewTemplate]);
  const isColumnEditable = (field: BriefingColumn) => templateActiveCols.size === 0 || templateActiveCols.has(field);
  const structureBlocks = useMemo<StructureBlock[]>(() => {
    const row = previewRow;
    if (!row) return [];
    const issueFields = new Set(selectedIssues.map((issue) => issue.field).filter(Boolean) as string[]);
    return STRUCTURE_BLOCKS.map((block) => {
      const rawTexts = block.textFields.map((field) => stripHtmlToText(row[field] ?? ''));
      const literalTexts = rawTexts.map(stripDynamicTokens);
      const text = literalTexts.find((value) => value.replace(/[^a-zA-ZÀ-ÿ0-9]/g, '').length >= 4)
        ?? literalTexts.find((value) => value.length > 1)
        ?? rawTexts.find((value) => value.length > 1)
        ?? '';
      const image = block.imageField ? (row[block.imageField] ?? '').trim() : '';
      const anchor = text
        ? { kind: 'text' as const, value: text }
        : /^https?:/i.test(image) ? { kind: 'image' as const, value: image } : null;
      const ownedFields = [...block.textFields, ...(block.imageField ? [block.imageField] : [])];
      const status: StructureBlock['status'] = !anchor ? 'empty' : ownedFields.some((field) => issueFields.has(field)) ? 'warning' : 'filled';
      const templateLocked = ownedFields.length > 0 && templateActiveCols.size > 0 && ownedFields.some((field) => !templateActiveCols.has(field));
      return { id: block.id, num: block.num, label: block.label, anchor, status, templateLocked };
    });
  }, [previewRow, selectedIssues, templateActiveCols]);
  const allIssues = [...issuesByRow.values()].flat();
  const technicalErrorCount = allIssues.filter((issue) => issue.severity === 'error').length;
  const editorialGroups = useMemo(() => [...new Set(rows.map((row) => row.__meta.campaignGroupId))].map((id) => {
    const groupRows = rows.filter((row) => row.__meta.campaignGroupId === id);
    const visibleRows = groupRows.filter((row) => row.__meta.status !== 'archived');
    const representative = visibleRows.find((row) => row.NM_PRODUTO_INTERNO.toUpperCase() === 'AMIGAO') ?? visibleRows[0] ?? groupRows[0];
    const issues = visibleRows.flatMap((row) => issuesByRow.get(row.__id) ?? []);
    return { id, rows: groupRows, visibleRows, representative, hasErrors: issues.some((issue) => issue.severity === 'error') };
  }), [issuesByRow, rows]);
  const filteredGroups = useMemo(() => editorialGroups.flatMap((group) => {
    const scopedRows = briefingRowsForView(group.rows, showArchived);
    if (!scopedRows.length) return [];
    const row = scopedRows.find((item) => item.NM_PRODUTO_INTERNO.toUpperCase() === 'AMIGAO') ?? scopedRows[0];
    const hasErrors = showArchived ? false : group.hasErrors;
    if (statusFilter === 'ready' && hasErrors) return [];
    if (statusFilter === 'needs-review' && !hasErrors) return [];
    const haystack = [row.__meta.partner, row.__meta.segment, row.__meta.weekKey, row.TP_CAMPANHA, row.SEQUENCIA, row.UTM_CAMPANHA, row.ASSUNTO, ...scopedRows.map((item) => item.__meta.subgroup)].join(' ').toLowerCase();
    if (!haystack.includes(query.trim().toLowerCase())) return [];
    return [{ ...group, rows: scopedRows, visibleRows: scopedRows, representative: row, hasErrors }];
  }), [editorialGroups, query, showArchived, statusFilter]);
  const emptyPartnerSlots = useMemo(() => {
    if (showArchived || statusFilter !== 'all') return [];
    const usedPartners = new Set(editorialGroups.flatMap((group) => group.visibleRows.map((row) => row.__meta.partner)));
    const search = query.trim().toLocaleLowerCase('pt-BR');
    return ACQUISITION_PARTNER_SLOTS.filter((partner) => !usedPartners.has(partner) && (!search || partner.toLocaleLowerCase('pt-BR').includes(search)));
  }, [editorialGroups, query, showArchived, statusFilter]);
  const selectedWeekGroups = useMemo(() => selectedWeek ? editorialGroups
    .filter((group) => group.visibleRows.length && group.representative.__meta.partner === selectedWeek.partner && group.representative.__meta.segment === selectedWeek.segment && group.representative.__meta.weekKey === selectedWeek.weekKey)
    .sort((a, b) => naturalLabelSort(a.representative.SEQUENCIA, b.representative.SEQUENCIA)) : [], [editorialGroups, selectedWeek]);
  const selectedSegmentGroups = useMemo(() => selectedSegment ? editorialGroups
    .filter((group) => group.visibleRows.length && group.representative.__meta.partner === selectedSegment.partner && group.representative.__meta.segment === selectedSegment.segment)
    .sort((a, b) => naturalLabelSort(a.representative.SEQUENCIA, b.representative.SEQUENCIA)) : [], [editorialGroups, selectedSegment]);
  const errorCount = editorialGroups.filter((group) => group.hasErrors).length;
  const activeEditorialGroupCount = editorialGroups.filter((group) => group.visibleRows.length > 0).length;
  const rulerExportOptions = useMemo(() => {
    const map = new Map<string, { key: string; partner: string; segment: string; label: string; total: number; errorGroups: number }>();
    editorialGroups.forEach((group) => {
      if (!group.visibleRows.length) return;
      const partner = group.representative.__meta.partner;
      const segment = group.representative.__meta.segment;
      const key = `${partner}|||${segment}`;
      const current = map.get(key) ?? { key, partner, segment, label: `${partner || 'Sem parceiro'} · ${segmentDisplayLabel(segment || 'Sem segmento')}`, total: 0, errorGroups: 0 };
      current.total += 1;
      if (group.hasErrors) current.errorGroups += 1;
      map.set(key, current);
    });
    return [...map.values()].sort((a, b) => naturalLabelSort(a.label, b.label));
  }, [editorialGroups]);
  const exportableRulerCount = rulerExportOptions.filter((option) => option.errorGroups === 0).length;
  const exportBlockReason = !rows.length
    ? 'Crie ou importe pelo menos um briefing antes de exportar.'
    : !activeRows.length
      ? 'Todos os briefings estão na Lixeira — não há nada para exportar.'
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
  const openExport = () => {
    if (!activeRows.length) { setAnnouncement(exportBlockReason || 'Nada para exportar.'); return; }
    setExportSelection(new Set(rulerExportOptions.filter((option) => option.errorGroups === 0).map((option) => option.key)));
    setExportOpen(true);
  };
  const confirmExport = () => {
    const chosen = new Set([...exportSelection].filter((key) => rulerExportOptions.some((option) => option.key === key && option.errorGroups === 0)));
    const exportRows = rows.filter((row) => row.__meta.status !== 'archived' && chosen.has(`${row.__meta.partner}|||${row.__meta.segment}`));
    if (!exportRows.length) { setAnnouncement('Selecione ao menos uma régua sem pendências para exportar.'); return; }
    const filename = `TB_BRIEFING_CAMPANHA_AQUISICAO_${new Date().toISOString().slice(0, 10)}.csv`;
    downloadText(filename, exportBriefingCsv(onlyCsvRows(exportRows)));
    const labels = rulerExportOptions.filter((option) => chosen.has(option.key)).map((option) => option.label);
    setAnnouncement(`${filename} gerado com ${labels.length} ${labels.length === 1 ? 'régua' : 'réguas'}: ${labels.join('; ')}.`);
    void recordExport(filename, exportRows, []);
    setExportOpen(false);
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
    await createRulerManagementPlan({ name: config.rulerName, description: config.audienceDescription, businessFront: config.businessFront, rulerFamily: config.rulerFamily, journeyFamily: config.journeyFamily, journeyType: config.journeyType, partner: config.partner, adaptationPartners: config.adaptationPartners, product: config.partner, segment: config.segment, objective: config.objective, templateSlotId: config.templateSlotId, campaignGroups });
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
      setRows(nextRows); setSelectedId(nextRows.find((row) => row.__meta.status !== 'archived')?.__id ?? nextRows[0]?.__id ?? '');
      setAnnouncement(archived.length ? 'E-mail movido para a Lixeira; histórico e versões foram preservados.' : 'Rascunho ainda não salvo removido.');
    } catch (error) { setAnnouncement(error instanceof Error ? error.message : 'Falha ao arquivar o e-mail.'); }
    finally { setDeleteOpen(false); }
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
  const openRuler = (partner = selected?.__meta.partner ?? 'Plurix', journeyContext?: JourneyContext) => { setNewDefaults((current) => ({ ...current, partner, journeyContext })); setRulerOpen(true); };
  const openNewBriefing = (partner = selected?.__meta.partner ?? 'Plurix', segment = selected?.__meta.segment ?? 'CRM', weekKey = selected?.__meta.weekKey ?? 'Semana 1') => { setNewDefaults((current) => ({ ...current, partner, segment, weekKey })); setNewOpen(true); };
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
  const duplicateRuler = async (config: DuplicateRulerConfig) => {
    if (!selectedSegment) return;
    const { partner, segment: sourceSegment } = selectedSegment;
    const sourceRows = rows.filter((row) => row.__meta.status !== 'archived' && row.__meta.partner === partner && row.__meta.segment === sourceSegment);
    if (!sourceRows.length) { setAnnouncement('Não há e-mails ativos nesta régua para duplicar.'); return; }
    const groupIdMap = new Map<string, string>();
    const clones = sourceRows.map((row) => {
      if (!groupIdMap.has(row.__meta.campaignGroupId)) groupIdMap.set(row.__meta.campaignGroupId, crypto.randomUUID());
      return {
        ...row,
        __id: crypto.randomUUID(),
        __journeyConfirmed: false,
        DT_INICIO: shiftBriefingDate(row.DT_INICIO, config.months, config.days),
        DT_FIM: shiftBriefingDate(row.DT_FIM, config.months, config.days),
        __meta: { ...row.__meta, segment: config.segment, campaignGroupId: groupIdMap.get(row.__meta.campaignGroupId)!, status: 'draft' as const, version: 1, savedAt: undefined, activityNames: [] },
      };
    });
    try {
      if (config.segmentMode === 'draft') {
        const businessFront = taxonomy.find((item) => item.partner === partner && item.segment === sourceSegment)?.businessFront ?? 'acquisition';
        await saveDraftEmailFactorySegment({ technicalName: config.segment, displayName: config.segmentAlias || config.segment, businessFront, partner, lifecycleFamily: 'Régua duplicada' });
      }
      const saved = await saveBriefings(clones.map((row) => ({ row, warnings: ['Régua duplicada; revise datas, conteúdo e assets antes de exportar.'] })));
      setRows((current) => [...current, ...saved]);
      setSelectedWeek(null); setSelectedSegment({ partner, segment: config.segment }); setSelectedId(saved[0]?.__id ?? '');
      setDuplicateRulerOpen(false);
      setAnnouncement(`Régua duplicada como “${config.segmentAlias || config.segment}” com ${groupIdMap.size} ${groupIdMap.size === 1 ? 'e-mail' : 'e-mails'} e ${saved.length} ${saved.length === 1 ? 'variação' : 'variações'} em rascunho.`);
    } catch (error) { setAnnouncement(error instanceof Error ? error.message : 'Falha ao duplicar a régua.'); }
  };
  const archiveWeek = async (target: { partner: string; segment: string; weekKey: string }) => {
    const targets = rows.filter((row) => row.__meta.partner === target.partner && row.__meta.segment === target.segment && row.__meta.weekKey === target.weekKey && row.__meta.status !== 'archived');
    try {
      const archived = await Promise.all(targets.filter((row) => row.__meta.savedAt).map((row) => saveBriefing({ ...row, __meta: { ...row.__meta, status: 'archived', version: row.__meta.version + 1 } }, [`${target.weekKey} arquivada pela árvore editorial.`])));
      const ids = new Set(targets.map((row) => row.__id));
      const next = rows.filter((row) => !ids.has(row.__id) || Boolean(row.__meta.savedAt)).map((row) => archived.find((item) => item.__id === row.__id) ?? row);
      setRows(next); setSelectedId(next.find((row) => row.__meta.status !== 'archived')?.__id ?? next[0]?.__id ?? ''); setAnnouncement(`${target.weekKey} movida para a Lixeira; e-mails salvos permanecem no histórico.`);
    } catch (error) { setAnnouncement(error instanceof Error ? error.message : 'Falha ao arquivar a semana.'); }
    finally { setWeekArchiveTarget(null); }
  };
  const restoreArchivedRows = async (targets: WorkspaceBriefing[], note: string) => {
    const restored = await Promise.all(targets.map((row) => saveBriefing({ ...row, __meta: { ...row.__meta, status: 'draft', version: row.__meta.version + 1 } }, [note])));
    setRows((current) => current.map((row) => restored.find((item) => item.__id === row.__id) ?? row));
    return restored;
  };
  const restoreGroup = async (groupId: string) => {
    const targets = rows.filter((row) => row.__meta.campaignGroupId === groupId && row.__meta.status === 'archived');
    if (!targets.length) { setAnnouncement('Este e-mail não tem variações na Lixeira para restaurar.'); return; }
    try {
      const restored = await restoreArchivedRows(targets, 'E-mail editorial restaurado do arquivo.');
      setSelectedWeek(null); setSelectedSegment(null); setSelectedId(restored[0].__id);
      setAnnouncement(`E-mail restaurado da Lixeira como rascunho (${restored.length} ${restored.length === 1 ? 'variação' : 'variações'}).`);
    } catch (error) { setAnnouncement(error instanceof Error ? error.message : 'Falha ao restaurar o e-mail.'); }
  };
  const restoreWeek = async (target: { partner: string; segment: string; weekKey: string }) => {
    const targets = rows.filter((row) => row.__meta.partner === target.partner && row.__meta.segment === target.segment && row.__meta.weekKey === target.weekKey && row.__meta.status === 'archived');
    if (!targets.length) { setAnnouncement('Esta semana não tem e-mails na Lixeira para restaurar.'); return; }
    try {
      const restored = await restoreArchivedRows(targets, `${target.weekKey} restaurada do arquivo.`);
      setSelectedId(restored[0].__id);
      setAnnouncement(`${target.weekKey} restaurada da Lixeira; e-mails voltaram como rascunho.`);
    } catch (error) { setAnnouncement(error instanceof Error ? error.message : 'Falha ao restaurar a semana.'); }
  };
  const restoreSelected = async () => {
    if (!selected || selected.__meta.status !== 'archived') return;
    try {
      const [saved] = await restoreArchivedRows([selected], 'Variação restaurada do arquivo.');
      if (saved) setSelectedId(saved.__id);
      setAnnouncement('Variação restaurada da Lixeira; agora está como rascunho editável.');
    } catch (error) { setAnnouncement(error instanceof Error ? error.message : 'Falha ao restaurar a variação.'); }
  };
  const openRename = (kind: 'week' | 'segment', partner: string, segment: string, weekKey?: string) => {
    const current = kind === 'week' ? (weekKey ?? '') : segment;
    setRenameValue(current);
    setRenameTarget({ kind, partner, segment, weekKey, current });
  };
  const confirmRename = async () => {
    if (!renameTarget) return;
    const next = renameValue.trim();
    if (!next || next === renameTarget.current) { setRenameTarget(null); return; }
    const { kind, partner, segment, weekKey } = renameTarget;
    const field = kind === 'week' ? 'weekKey' : 'segment';
    const matches = (row: WorkspaceBriefing) => row.__meta.partner === partner && row.__meta.segment === segment && (kind === 'segment' || row.__meta.weekKey === weekKey);
    const targets = rows.filter(matches);
    if (!targets.length) { setRenameTarget(null); return; }
    try {
      const saved = await Promise.all(targets.filter((row) => row.__meta.savedAt).map((row) => saveBriefing({ ...row, __meta: { ...row.__meta, [field]: next, version: row.__meta.version + 1 } }, [kind === 'week' ? `Semana renomeada para "${next}".` : `Régua renomeada para "${next}".`])));
      setRows((current) => current.map((row) => (matches(row) ? saved.find((item) => item.__id === row.__id) ?? { ...row, __meta: { ...row.__meta, [field]: next } } : row)));
      if (kind === 'week' && selectedWeek?.partner === partner && selectedWeek.segment === segment && selectedWeek.weekKey === weekKey) setSelectedWeek({ partner, segment, weekKey: next });
      if (kind === 'segment' && selectedSegment?.partner === partner && selectedSegment.segment === segment) setSelectedSegment({ partner, segment: next });
      setRenameTarget(null);
      setAnnouncement(kind === 'week' ? `Semana renomeada para "${next}" em ${targets.length} ${targets.length === 1 ? 'e-mail' : 'e-mails'}.` : `Régua renomeada para "${next}" em ${targets.length} ${targets.length === 1 ? 'e-mail' : 'e-mails'}.`);
    } catch (error) { setAnnouncement(error instanceof Error ? error.message : 'Falha ao renomear.'); }
  };
  const archiveSegment = async (target: { partner: string; segment: string }) => {
    const targets = rows.filter((row) => row.__meta.partner === target.partner && row.__meta.segment === target.segment && row.__meta.status !== 'archived');
    try {
      const archived = await Promise.all(targets.filter((row) => row.__meta.savedAt).map((row) => saveBriefing({ ...row, __meta: { ...row.__meta, status: 'archived', version: row.__meta.version + 1 } }, [`Régua ${target.segment} arquivada pela árvore editorial.`])));
      const ids = new Set(targets.map((row) => row.__id));
      const next = rows.filter((row) => !ids.has(row.__id) || Boolean(row.__meta.savedAt)).map((row) => archived.find((item) => item.__id === row.__id) ?? row);
      setRows(next); setSelectedSegment(null); setSelectedWeek(null); setSelectedId(next.find((row) => row.__meta.status !== 'archived')?.__id ?? next[0]?.__id ?? '');
      setAnnouncement(`Régua “${segmentDisplayLabel(target.segment)}” arquivada; e-mails salvos permanecem no histórico.`);
    } catch (error) { setAnnouncement(error instanceof Error ? error.message : 'Falha ao arquivar a régua.'); }
    finally { setSegmentArchiveTarget(null); }
  };
  const restoreSegment = async (partner: string, segment: string) => {
    const targets = rows.filter((row) => row.__meta.partner === partner && row.__meta.segment === segment && row.__meta.status === 'archived');
    if (!targets.length) { setAnnouncement('Esta régua não tem e-mails arquivados para restaurar.'); return; }
    try {
      const restored = await restoreArchivedRows(targets, `Régua ${segment} restaurada do arquivo.`);
      setSelectedWeek(null); setSelectedSegment({ partner, segment }); setSelectedId(restored[0].__id);
      setAnnouncement(`Régua “${segmentDisplayLabel(segment)}” restaurada; e-mails voltaram como rascunho.`);
    } catch (error) { setAnnouncement(error instanceof Error ? error.message : 'Falha ao restaurar a régua.'); }
  };
  const movePartnerOptions = useMemo(() => [...new Set(['Institucional B2C', 'Plurix', ...taxonomy.map((item) => item.partner).filter((partner) => partner && partner !== 'N/A'), ...rows.map((row) => row.__meta.partner).filter(Boolean)])].sort((a, b) => a.localeCompare(b, 'pt-BR')), [taxonomy, rows]);
  const moveSegmentsFor = (partner: string) => [...new Set([...taxonomy.filter((item) => item.partner === partner).map((item) => item.segment), ...rows.filter((row) => row.__meta.partner === partner).map((row) => row.__meta.segment)].filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR', { numeric: true }));
  const moveWeeksFor = (partner: string, segment: string) => [...new Set([...EDITORIAL_WEEKS, ...rows.filter((row) => row.__meta.partner === partner && row.__meta.segment === segment).map((row) => row.__meta.weekKey)].filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR', { numeric: true }));
  const moveEmail = async (groupId: string, target: MoveEmailTarget) => {
    const targets = rows.filter((row) => row.__meta.campaignGroupId === groupId && row.__meta.status !== 'archived');
    if (!targets.length) { setMoveTarget(null); setAnnouncement('Não há e-mail ativo para mover.'); return; }
    const contextChanged = targets.some((row) => row.__meta.partner !== target.partner || row.__meta.segment !== target.segment);
    const patchMeta = (meta: WorkspaceBriefing['__meta']) => ({ ...meta, partner: target.partner, segment: target.segment, weekKey: target.weekKey, activityNames: contextChanged ? [] : meta.activityNames });
    try {
      const saved = await Promise.all(targets.filter((row) => row.__meta.savedAt).map((row) => saveBriefing({ ...row, __journeyConfirmed: false, __meta: { ...patchMeta(row.__meta), version: row.__meta.version + 1 } }, [`E-mail movido para ${target.partner} · ${target.segment} · ${target.weekKey}.`])));
      setRows((current) => current.map((row) => (row.__meta.campaignGroupId === groupId && row.__meta.status !== 'archived' ? saved.find((item) => item.__id === row.__id) ?? { ...row, __journeyConfirmed: false, __meta: patchMeta(row.__meta) } : row)));
      setSelectedWeek(null); setSelectedSegment(null); setSelectedId(targets[0].__id);
      setMoveTarget(null);
      setAnnouncement(`E-mail movido para ${target.partner} · ${segmentDisplayLabel(target.segment)} · ${target.weekKey}. Reconfirme a jornada no SFMC.`);
    } catch (error) { setAnnouncement(error instanceof Error ? error.message : 'Falha ao mover o e-mail.'); }
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
    {toast && <div className="pointer-events-none fixed inset-x-0 top-4 z-[130] flex justify-center px-4">
      <div className="pointer-events-auto flex max-w-xl items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-xl">
        <Info size={16} className="mt-0.5 shrink-0 text-cyan-700"/>
        <span className="min-w-0">{toast.text}</span>
        <button type="button" onClick={() => setToast(null)} className="-my-1 ml-1 shrink-0 rounded-md p-1 text-slate-400 outline-none hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-cyan-500" aria-label="Fechar aviso"><X size={14}/></button>
      </div>
    </div>}
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
            <HeaderAction onClick={() => openRuler()} icon={<ListChecks size={15}/>} label="Criar régua"/>
            <HeaderAction onClick={() => openNewBriefing()} icon={<Plus size={15}/>} label="Novo e-mail"/>
            <HeaderAction onClick={() => setDeleteOpen(true)} disabled={!selected} icon={<Trash2 size={15}/>} label="Excluir" danger/>
            <button disabled={!activeRows.length} onClick={openExport} title={activeRows.length ? 'Escolher réguas e baixar o CSV para o SFMC' : (exportBlockReason || 'Nada para exportar')} className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-cyan-400 px-3 py-2 text-xs font-bold text-slate-950 outline-none transition hover:bg-cyan-300 focus-visible:ring-2 focus-visible:ring-white disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-white/50"><Download size={15}/>Exportar CSV</button>
            {exportBlockReason && !activeRows.length && <p className="w-full text-right text-[11px] font-semibold text-amber-100">{exportBlockReason}</p>}
            {Boolean(activeRows.length) && technicalErrorCount > 0 && <p className="w-full text-right text-[11px] font-semibold text-amber-100">{exportableRulerCount ? 'Réguas com pendências ficam fora do CSV — escolha as prontas ao exportar.' : `Corrija ${technicalErrorCount} ${technicalErrorCount === 1 ? 'erro bloqueante' : 'erros bloqueantes'} para liberar a exportação.`}</p>}
          </div>}
        </div>
      </div>
    </header>

    {mode === 'strategy' ? <StrategyWorkspace strategies={emailStrategies} contexts={productContexts} guardrails={productGuardrails} rows={rows} syncState={managementState} onRefresh={() => void refreshManagement()} onSaved={(saved) => setEmailStrategies((current) => current.map((item) => item.id === saved.id ? saved : item))} onSavedContext={(saved) => setProductContexts((current) => current.map((item) => item.id === saved.id ? saved : item))} onSavedGuardrail={(saved) => setProductGuardrails((current) => current.map((item) => item.id === saved.id ? saved : item))}/> : mode === 'reviews' ? <ExternalReviewWorkspace runs={reviewRuns} suggestions={reviewSuggestions} syncState={managementState} onRefresh={() => void refreshManagement()} onDecide={async (id, status) => { await decideExternalSuggestion(id, status); await refreshManagement(); }}/> : mode === 'template' ? <TemplateSourceWorkspace slots={templateSlots} selectedId={effectiveSelectedId} principalId={effectivePrincipalId} source={template} syncState={templateSyncState} fileRef={templateFileRef} onSelect={selectTemplateSlot} onSourceChange={setTemplate} onRename={(id, name) => setTemplateSlots((current) => current.map((slot) => slot.id === id ? { ...slot, name } : slot))} onSave={() => void saveTemplate()} onCreate={() => void createTemplateSlot()} onUpload={(file) => void uploadTemplate(file)} onDuplicate={(id) => void duplicateTemplateSlot(id)} onDelete={(id) => void deleteTemplateSlot(id)} onMakePrincipal={(id) => void makeTemplatePrincipal(id)}/> : mode === 'library' ? <AssetLibrary assets={assets} setAssets={setAssets} taxonomy={taxonomy}/> :
    <main className="pt-4">
      {importMessages.length > 0 && <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900" role="status">{importMessages.map((message) => <div key={message}>{message}</div>)}</div>}

      <div className="h-[calc(var(--screen-h,900px)_-_172px)] min-h-[480px] overflow-y-auto overflow-x-hidden overscroll-contain [scrollbar-gutter:stable]">
      <div ref={workspaceGridRef} className="grid items-start pb-1" style={{ gridTemplateColumns: `minmax(0,${cols[0]}fr) auto minmax(0,${cols[1]}fr) auto minmax(0,${cols[2]}fr)` }}>
        <div className="min-w-0">
        <aside className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" aria-label="Caixa de briefings">
          <div className="border-b border-slate-200 p-3.5">
            <div className="flex items-center justify-between gap-2"><div><h2 className="font-bold text-slate-900">Caixa de briefings</h2><p className="text-xs text-slate-500">{filteredGroups.length} de {activeEditorialGroupCount} e-mails · {activeRows.length} variantes ativas</p></div><Inbox className="text-cyan-700" size={18}/></div>
            <label className="mt-3 flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-slate-500 focus-within:border-cyan-400 focus-within:bg-white">
              <Search size={15}/><span className="sr-only">Buscar briefings</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar parceiro, campanha..." className="min-w-0 flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"/>
            </label>
            <div className="mt-2 flex flex-wrap gap-1" aria-label="Filtrar briefings por status">
              {([['all', 'Todos'], ['ready', 'Prontos'], ['needs-review', 'Com ajustes']] as const).map(([value, label]) => <button key={value} onClick={() => { setStatusFilter(value); setShowArchived(false); setSelectedId(rows.find((row) => row.__meta.status !== 'archived')?.__id ?? ''); }} className={`min-h-8 rounded-md px-2.5 text-xs font-semibold outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ${!showArchived && statusFilter === value ? 'bg-cyan-100 text-cyan-800' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'}`}>{label}</button>)}
              <button onClick={() => { setShowArchived(true); setStatusFilter('all'); setSelectedWeek(null); setSelectedSegment(null); setSelectedId(rows.find((row) => row.__meta.status === 'archived')?.__id ?? ''); }} aria-pressed={showArchived} className={`min-h-8 rounded-md px-2.5 text-xs font-semibold outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ${showArchived ? 'bg-slate-700 text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'}`}>Lixeira</button>
            </div>
          </div>
          <div className="p-2.5">
            <div className="mb-2 flex rounded-lg bg-slate-100 p-1" role="tablist" aria-label="Dimensão da caixa de briefings">{([['partner', 'Por parceiro'], ['journey', 'Por jornada']] as const).map(([value, label]) => <button key={value} type="button" role="tab" aria-selected={treeDimension === value} onClick={() => { setTreeDimension(value); localStorage.setItem('gaas-email-tree-dimension-v1', value); }} className={`min-h-8 flex-1 rounded-md px-2 text-[11px] font-bold outline-none transition focus-visible:ring-2 focus-visible:ring-cyan-500 ${treeDimension === value ? 'bg-white text-cyan-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>{label}</button>)}</div>
            <div className="mb-2 rounded-lg bg-slate-50 px-3 py-2 text-[11px] font-semibold text-slate-500">{treeDimension === 'partner' ? 'Parceiro › segmento › semana › e-mail › assinaturas' : 'Família › jornada › parceiro › segmento › semana › e-mail'}</div>
            {(filteredGroups.length || emptyPartnerSlots.length) ? <BriefingTree
              groups={filteredGroups} emptyPartnerSlots={emptyPartnerSlots} strategies={emailStrategies} viewMode={treeDimension} selectedId={selected?.__id ?? ''} selectedWeek={selectedWeek} selectedSegment={selectedSegment} showArchived={showArchived}
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
              onRestoreWeek={(partner, segment, weekKey) => void restoreWeek({ partner, segment, weekKey })}
              onRestoreEmail={(groupId) => void restoreGroup(groupId)}
              onRenameWeek={(partner, segment, weekKey) => openRename('week', partner, segment, weekKey)}
              onRenameSegment={(partner, segment) => openRename('segment', partner, segment)}
              onDuplicateRulerFromTree={(partner, segment) => { setSelectedWeek(null); setSelectedSegment({ partner, segment }); setDuplicateRulerOpen(true); }}
              onArchiveSegment={(partner, segment) => setSegmentArchiveTarget({ partner, segment })}
              onRestoreSegment={(partner, segment) => void restoreSegment(partner, segment)}
              onMoveEmail={(groupId) => { const group = rows.find((row) => row.__meta.campaignGroupId === groupId && row.__meta.status !== 'archived'); if (group) setMoveTarget({ groupId, label: group.SEQUENCIA || 'E-mail', current: { partner: group.__meta.partner, segment: group.__meta.segment, weekKey: group.__meta.weekKey } }); }}
              onCreatePartnerRuler={(partner, journeyContext) => openRuler(partner, journeyContext)}
            /> : <div className="px-4 py-10 text-center text-sm text-slate-500"><Search className="mx-auto mb-2 text-slate-300" size={24}/><p className="font-semibold text-slate-700">Nenhum briefing encontrado</p><p className="mt-1 text-xs">Ajuste a busca ou o filtro de status.</p></div>}
          </div>
        </aside>
        </div>

        <ResizeHandle label="Ajustar largura da Caixa de briefings" onPointerDown={startColDrag(0)} onReset={resetCols}/>

        {selectedSegment ? <div className="min-w-0"><WeekReviewer selection={selectedSegment} groups={selectedSegmentGroups} strategies={emailStrategies} issuesByRow={issuesByRow} selectedId={selected?.__id ?? ''} onSelect={setSelectedId} onEdit={(id) => selectEmail(id)} onDuplicateRuler={() => setDuplicateRulerOpen(true)} onOpenPlan={() => setMode('strategy')}/></div> : selectedWeek ? <div className="min-w-0"><WeekReviewer selection={selectedWeek} groups={selectedWeekGroups} strategies={emailStrategies} issuesByRow={issuesByRow} selectedId={selected?.__id ?? ''} onSelect={setSelectedId} onEdit={(id) => selectEmail(id)} onNewEmail={() => openNewBriefing(selectedWeek.partner, selectedWeek.segment, selectedWeek.weekKey)} onDuplicate={() => duplicateWeek(selectedWeek.partner, selectedWeek.segment, selectedWeek.weekKey)} onOpenPlan={() => setMode('strategy')}/></div> : selected ? <section id="email-editor-panel" className="flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white shadow-sm" aria-label="Editor do briefing selecionado">
          <div className="rounded-t-2xl border-b border-slate-200 bg-white px-4 py-3">
            <div className="flex flex-wrap items-start justify-between gap-2"><div><h2 className="font-bold text-slate-900">{selected.__meta.partner || 'Parceiro pendente'} · {selected.__meta.segment || 'Segmento pendente'} · {selected.SEQUENCIA || 'Sequência pendente'}</h2><p className="mt-0.5 text-xs text-slate-500">{selected.__meta.partner === 'Plurix' ? 'Assinatura' : 'Régua'} em edição: <b>{selected.__meta.subgroup || selected.NM_PRODUTO_INTERNO}</b> · {syncState} · versão {selected.__meta.version}</p></div><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${selected.__meta.status === 'archived' ? 'bg-slate-200 text-slate-700' : selectedIssues.some((issue) => issue.severity === 'error') ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>{selected.__meta.status === 'archived' ? 'Na Lixeira · somente leitura' : selectedIssues.filter((issue) => issue.severity === 'error').length ? `${selectedIssues.filter((issue) => issue.severity === 'error').length} ajustes necessários` : 'Pronto para exportar'}</span></div>
          </div>
          <div id="email-editor-scroll" className="p-3.5">
            <label className="mb-2.5 flex min-h-11 items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700"><input type="checkbox" checked={!!selected.__journeyConfirmed} onChange={(event) => updateSelected({ __journeyConfirmed: event.target.checked })} className="mt-0.5 h-4 w-4 accent-cyan-600"/><span><b>Jornada conferida no SFMC</b><br/><span className="text-xs text-slate-500">Confirma que esta campanha e sequência estão habilitadas para entrada.</span></span></label>
            {selectedIssues.length > 0 && <div className="mb-2.5 space-y-2">{selectedIssues.map((issue, index) => <div key={`${issue.code}-${issue.field}-${index}`} className={`flex items-start justify-between gap-3 rounded-lg border px-3 py-2 text-xs ${issue.severity === 'error' ? 'border-red-200 bg-red-50 text-red-900' : 'border-amber-200 bg-amber-50 text-amber-900'}`}><span>{issue.message}</span>{issue.fix && <button onClick={() => fixIssue(issue)} className="shrink-0 rounded-md bg-white px-2 py-1 font-bold shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"><Wand2 className="mr-1 inline" size={12}/>Corrigir</button>}</div>)}</div>}
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wide text-slate-400">Blocos do e-mail</span>
              <div className="flex gap-1">
                <button type="button" onClick={() => setOpenSections(new Set(ALL_EDITOR_BLOCK_IDS))} className="rounded-md border border-slate-200 px-2 py-1 text-[10px] font-bold text-slate-600 outline-none hover:border-cyan-300 hover:text-cyan-800 focus-visible:ring-2 focus-visible:ring-cyan-500">Expandir tudo</button>
                <button type="button" onClick={() => setOpenSections(new Set())} className="rounded-md border border-slate-200 px-2 py-1 text-[10px] font-bold text-slate-600 outline-none hover:border-cyan-300 hover:text-cyan-800 focus-visible:ring-2 focus-visible:ring-cyan-500">Recolher tudo</button>
              </div>
            </div>
            <div className="space-y-2.5">
              <CollapsibleBlock id={`eb-${AUDIT_SECTION_ID}`} marker={<BlockMarker/>} label="Organização e auditoria" description="Parceiro, segmento, semana e Activity Name usados no CSV e na auditoria." tone="audit" open={openSections.has(AUDIT_SECTION_ID)} onToggle={() => toggleSection(AUDIT_SECTION_ID)}>
                <div className="grid gap-2 md:grid-cols-2">
                  <TaxonomySelect label="Parceiro" value={selected.__meta.partner} options={taxonomyOptions.partners} onChange={(value) => updateGroupMeta({ partner: value, segment: '', weekKey: '', activityNames: [], ...(value !== 'Plurix' ? { subgroup: '' } : {}) })}/>
                  <TaxonomySelect label="Segmento" value={selected.__meta.segment} options={taxonomyOptions.segments} onChange={(value) => updateGroupMeta({ segment: value, activityNames: [] })}/>
                  <TaxonomySelect label="Assinatura / subgrupo" value={selected.__meta.subgroup} options={taxonomyOptions.subgroups} onChange={(value) => updateSelected({ __meta: { ...selected.__meta, subgroup: value } })}/>
                  <TaxonomySelect label="Semana editorial" value={selected.__meta.weekKey} options={taxonomyOptions.weeks} onChange={(value) => updateGroupMeta({ weekKey: value })}/>
                </div>
                <div className="mt-2"><ActivityNameSelect value={selected.__meta.activityNames[0] ?? ''} options={taxonomyOptions.activityNames} onChange={(value) => updateSelected({ __meta: { ...selected.__meta, activityNames: value ? [value] : [] } })}/></div>
                {taxonomyState === 'loading' && <p className="mt-2 text-xs text-slate-500">Carregando opções da tabela activities…</p>}
                {taxonomyState === 'error' && <div className="mt-2 flex items-center justify-between gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800"><span>Não foi possível carregar a taxonomia de activities.</span><button type="button" onClick={() => void refreshTaxonomy()} className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 font-bold"><RefreshCw size={12}/>Tentar novamente</button></div>}
              </CollapsibleBlock>

              {EDITOR_SECTIONS.map((section) => {
                const isContentBlock = STRUCTURE_NUM[section.id] != null;
                const lockedFields = isContentBlock ? (section.fields ?? []).filter((field) => !isColumnEditable(field)) : [];
                const imageLocked = isContentBlock && section.imageSlot ? !isColumnEditable(section.imageSlot.image) : false;
                return (
                <CollapsibleBlock key={section.id} id={`eb-${section.id}`} marker={<BlockMarker num={STRUCTURE_NUM[section.id]}/>} focused={activeStructureBlock === section.id} onHoverChange={STRUCTURE_NUM[section.id] ? (hovering) => setEditorHoverBlock(hovering ? section.id : null) : undefined} label={section.label} description={section.description} open={openSections.has(section.id)} onToggle={() => toggleSection(section.id)}>
                  {(lockedFields.length > 0 || imageLocked) && <p className="mb-3 flex items-start gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-[11px] leading-4 text-slate-600"><Lock size={12} className="mt-px shrink-0"/><span>Parte deste bloco é fixa no template <b>{templateSlots.find((slot) => slot.id === linkedTemplateId)?.name}</b> — vem direto do HTML/AMPscript e não pode ser ajustada aqui. Para mudar, troque o template ou edite o Template-fonte.</span></p>}
                  {section.id === 'legal' && <LegalTools selected={selected} legalTexts={legalTexts} updateSelected={updateSelected}/>}
                  {section.fields && <div className="grid gap-3 md:grid-cols-2">{section.fields.map((field) => <Field key={field} field={field} value={selected[field]} suggestions={[...new Set(rows.map((row) => row[field]).filter(Boolean))]} onChange={(value) => updateField(field, value)} locked={isContentBlock && !isColumnEditable(field)}/>)}</div>}
                  {section.id === 'message' && <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50/70 p-3">
                    <p className="mb-2 text-[11px] font-semibold text-slate-500">Amostra usada só na simulação da prévia — equivale aos dados do Test Send do SFMC, não vai no CSV.</p>
                    <div className="grid gap-3 md:grid-cols-2">
                      <MiniInput label="Nome de teste" value={subscriber.PRI_NOME} onChange={(value) => setSubscriber((current) => ({ ...current, PRI_NOME: value }))}/>
                      <MiniInput label="Limite de teste" value={subscriber.LIMITE} onChange={(value) => setSubscriber((current) => ({ ...current, LIMITE: value }))}/>
                    </div>
                  </div>}
                  {section.imageSlot && <div className={section.fields ? 'mt-3' : ''}><ImageUrlCard slot={section.imageSlot} imageUrl={selected[section.imageSlot.image]} destinationUrl={section.imageSlot.link ? selected[section.imageSlot.link] : undefined} assets={assets} contextProduct={selected.NM_PRODUTO_INTERNO} contextPartner={selected.__meta.partner} onImageUrl={(value) => updateField(section.imageSlot!.image, value)} onDestinationUrl={section.imageSlot.link ? (value) => updateField(section.imageSlot!.link!, value) : undefined} onCreateAsset={() => setMode('library')} locked={imageLocked}/></div>}
                  {section.id === 'closing' && selected.__meta.partner === 'Plurix' && <div className={section.imageSlot ? 'mt-3' : ''}><SignatureMatrix rows={rows} selected={selected} onEnsure={() => setRows((current) => ensurePlurixVariants(current, selected.__id, signatureSettings.filter((item) => item.status === 'inactive').map((item) => item.signatureKey)))} onSelect={setSelectedId} onManage={() => setSignatureManagerOpen(true)}/></div>}
                </CollapsibleBlock>
                );
              })}
            </div>
          </div>
          <div className="sticky bottom-0 z-30 rounded-b-2xl border-t border-slate-200 bg-white px-4 py-3 shadow-[0_-6px_20px_-4px_rgba(15,23,42,0.15)]">{selected.__meta.status === 'archived'
            ? <button type="button" onClick={() => void restoreSelected()} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#07595b] px-4 py-3 text-sm font-bold text-white outline-none transition hover:bg-[#064c4e] focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2"><ArchiveRestore size={16}/>Desarquivar e voltar a editar</button>
            : <><button type="button" onClick={() => setSaveOpen(true)} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#07595b] px-4 py-3 text-sm font-bold text-white shadow-sm outline-none transition hover:bg-[#064c4e] focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2"><Save size={16}/>Salvar briefing{selectedGroupErrorCount > 0 && <span className="rounded-full bg-white/20 px-1.5 text-[11px]">{selectedGroupErrorCount} pend.</span>}</button><p className="mt-1.5 text-center text-[11px] text-slate-500">Salve o rascunho ou marque como pronto depois de revisar os blocos.</p></>}</div>
        </section> : <div/>}

        <ResizeHandle label="Ajustar largura do editor e da prévia" onPointerDown={startColDrag(1)} onReset={resetCols}/>

        <div className="min-w-0">
            <section id="email-preview-panel" className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" aria-label="Prévia do e-mail">
              <div className="border-b border-slate-200 bg-white px-3 py-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2"><h2 className="font-bold text-slate-900">Prévia do e-mail</h2><span className="rounded-full bg-cyan-50 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-cyan-700">Simulação local</span><span className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide ${showMarketingNotes ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>{showMarketingNotes ? 'Observações MKT' : 'E-mail projetado'}</span></div>
                    {previewToolsOpen && <p className="mt-1 max-w-none whitespace-normal text-xs leading-[1.35rem] text-slate-500">Visualize a peça com conteúdo e ativos adaptados. Antes do envio, certifique pelo Test Send do SFMC.</p>}
                  </div>
                  <button type="button" onClick={() => setPreviewToolsOpen((current) => !current)} aria-expanded={previewToolsOpen} title={previewToolsOpen ? 'Minimizar controles e ampliar a prévia' : 'Mostrar os controles da prévia'} className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold text-slate-600 outline-none transition hover:border-cyan-300 hover:text-cyan-800 focus-visible:ring-2 focus-visible:ring-cyan-500">{previewToolsOpen ? <ChevronUp size={13}/> : <ChevronDown size={13}/>}{previewToolsOpen ? 'Minimizar' : 'Controles'}</button>
                </div>
                <div className={`mt-2 grid gap-1.5 ${previewToolsOpen ? 'grid-cols-2 min-[1180px]:grid-cols-4' : 'grid-cols-4'}`}>
                  <button onClick={() => openRenderedPreview()} disabled={!selected || render.diagnostics.length > 0} title="Abrir em nova aba" className="inline-flex min-h-8 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] font-bold text-slate-700 outline-none transition hover:border-cyan-300 hover:text-cyan-800 focus-visible:ring-2 focus-visible:ring-cyan-500 disabled:opacity-50"><ExternalLink size={14}/>{previewToolsOpen && <span className="truncate">Abrir em nova aba</span>}</button>
                  <button onClick={() => openRenderedPreview(true)} disabled={!selected || render.diagnostics.length > 0} title="Abre a impressão do navegador para salvar a prévia completa em PDF" className="inline-flex min-h-8 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] font-bold text-slate-700 outline-none transition hover:border-cyan-300 hover:text-cyan-800 focus-visible:ring-2 focus-visible:ring-cyan-500 disabled:opacity-50"><Printer size={14}/>{previewToolsOpen && <span className="truncate">Salvar em PDF</span>}</button>
                  <button type="button" aria-pressed={showMarketingNotes} onClick={() => setShowMarketingNotes((current) => !current)} disabled={!selected} title="Alternar entre a peça projetada e as instruções pendentes para Marketing" className={`inline-flex min-h-8 items-center justify-center gap-1.5 rounded-lg border px-2 py-1.5 text-[11px] font-bold outline-none transition focus-visible:ring-2 focus-visible:ring-cyan-500 disabled:opacity-50 ${showMarketingNotes ? 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100' : 'border-slate-200 bg-white text-slate-700 hover:border-amber-300 hover:text-amber-800'}`}><MessageSquareText size={14}/>{previewToolsOpen && <span className="truncate">Observações MKT</span>}</button>
                  <button onClick={() => setPreviewOpen(true)} disabled={!selected} title="Ampliar" className="inline-flex min-h-8 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] font-bold text-slate-700 outline-none transition hover:border-cyan-300 hover:text-cyan-800 focus-visible:ring-2 focus-visible:ring-cyan-500 disabled:opacity-50"><Maximize2 size={14}/>{previewToolsOpen && <span className="truncate">Ampliar</span>}</button>
                </div>
                {previewToolsOpen && <label className="mt-2 block text-[10px] font-bold uppercase tracking-wide text-slate-500">Template deste briefing
                  <span className="mt-1 flex h-9 items-center rounded-lg border border-slate-200 bg-white px-2 focus-within:border-cyan-400">
                    <select value={linkedTemplateId} onChange={(event) => { const id = event.target.value; setSelectedTemplateId(id); updateGroupMeta({ templateSlotId: id }); }} className="min-w-0 flex-1 bg-transparent text-xs font-semibold text-slate-700 outline-none" aria-label="Template vinculado ao briefing">
                      {templateSlots.map((slot) => <option key={slot.id} value={slot.id}>{slot.name}</option>)}
                    </select>
                    <button type="button" onClick={() => { setSelectedTemplateId(linkedTemplateId); setMode('template'); }} className="ml-1 rounded-md p-1.5 text-cyan-700 hover:bg-cyan-50" aria-label="Editar HTML e AMPscript completo do template vinculado" title="Editar HTML e AMPscript completo"><Code2 size={14}/></button>
                  </span>
                </label>}
              </div>
              {selected && <div className="space-y-1.5 border-b border-slate-200 bg-white px-4 py-3">
                <div className="flex gap-2 text-sm"><span className="w-[92px] shrink-0 pt-0.5 text-[11px] font-extrabold uppercase tracking-wide text-slate-500">Assunto:</span><span className="min-w-0 font-semibold text-slate-900">{selected.ASSUNTO || <span className="font-normal italic text-red-500">— não preenchido</span>}</span></div>
                <div className="flex gap-2 text-sm"><span className="w-[92px] shrink-0 pt-0.5 text-[11px] font-extrabold uppercase tracking-wide text-slate-500">Pré-cabeçalho:</span><span className="min-w-0 text-slate-600">{selected.PRE_CABECALHO || <span className="italic text-amber-600">— vazio, o cliente verá o início do corpo do e-mail</span>}</span></div>
              </div>}
              {render.diagnostics.length > 0 ? <div className="m-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">{render.diagnostics.map((diagnostic) => <div key={diagnostic}>{diagnostic}</div>)}</div> : <PreviewWithStructure html={render.html} contextKey={previewContextKey} className="min-h-[300px] bg-slate-100" blocks={structureBlocks} activeBlockId={activeStructureBlock} openBlockIds={openSections} onSelectBlock={focusStructureBlock} onHoverBlock={setRailHoverBlock}/>}
            </section>
        </div>
      </div>
      </div>
    </main>}

    {previewOpen && selected && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="email-preview-title" onMouseDown={(event) => { if (event.target === event.currentTarget) setPreviewOpen(false); }}>
      <section className="flex max-h-[94vh] w-full max-w-[1320px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl" aria-label="Prévia ampliada do e-mail">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 px-5 py-4"><div><div className="flex items-center gap-2"><h2 id="email-preview-title" className="text-lg font-bold text-slate-900">Visualização do e-mail</h2><span className="rounded-full bg-cyan-50 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-cyan-700">Simulação local</span></div><p className="mt-0.5 text-xs text-slate-500">Revise conteúdo e personalização. A certificação final acontece no Test Send do SFMC.</p></div><button autoFocus onClick={() => setPreviewOpen(false)} className="rounded-lg p-2 text-slate-500 outline-none hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-cyan-500" aria-label="Fechar visualização"><X size={19}/></button></div>
        <div className="grid gap-3 border-b border-slate-200 bg-white px-5 py-3 md:grid-cols-[1fr_180px_180px]">
          <div className="space-y-1.5 self-center">
            <div className="flex gap-2 text-sm"><span className="w-[104px] shrink-0 pt-0.5 text-[11px] font-extrabold uppercase tracking-wide text-slate-500">Assunto:</span><span className="min-w-0 font-semibold text-slate-900">{selected.ASSUNTO || <span className="font-normal italic text-red-500">— não preenchido</span>}</span></div>
            <div className="flex gap-2 text-sm"><span className="w-[104px] shrink-0 pt-0.5 text-[11px] font-extrabold uppercase tracking-wide text-slate-500">Pré-cabeçalho:</span><span className="min-w-0 text-slate-600">{selected.PRE_CABECALHO || <span className="italic text-amber-600">— vazio, o cliente verá o início do corpo</span>}</span></div>
          </div>
          <MiniInput label="Nome de teste" value={subscriber.PRI_NOME} onChange={(value) => setSubscriber((current) => ({ ...current, PRI_NOME: value }))}/><MiniInput label="Limite de teste" value={subscriber.LIMITE} onChange={(value) => setSubscriber((current) => ({ ...current, LIMITE: value }))}/>
        </div>
        <div className="min-h-0 flex-1 overflow-auto bg-slate-100">{render.diagnostics.length > 0 ? <div className="m-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">{render.diagnostics.map((diagnostic) => <div key={diagnostic}>{diagnostic}</div>)}</div> : <EmailPreviewFrame html={render.html} contextKey={`${previewContextKey}::expanded`} className="h-[72vh] w-full bg-slate-100"/>}</div>
      </section>
    </div>}

    {deleteOpen && selected && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4" role="dialog" aria-modal="true" aria-labelledby="delete-email-title" onMouseDown={(event) => { if (event.target === event.currentTarget) setDeleteOpen(false); }}><div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl"><div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-red-50 text-red-600"><Trash2 size={18}/></span><div><h2 id="delete-email-title" className="font-bold text-slate-900">Arquivar este e-mail editorial?</h2><p className="mt-1 text-sm leading-5 text-slate-600"><b>{selected.__meta.partner || 'Parceiro não informado'} · {selected.SEQUENCIA || 'Sequência pendente'}</b> e suas variantes deixarão os próximos CSVs. Registros salvos permanecem no histórico; somente rascunhos nunca salvos são removidos.</p></div></div><div className="mt-5 flex justify-end gap-2"><button autoFocus onClick={() => setDeleteOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 outline-none hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-cyan-500">Cancelar</button><button onClick={() => void deleteBriefing()} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white outline-none hover:bg-red-700 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2">Arquivar e-mail</button></div></div></div>}
    {rulerOpen && <CreateRulerDialog taxonomy={taxonomy} templates={templateSlots} defaultPartner={newDefaults.partner} defaultJourneyContext={newDefaults.journeyContext} onClose={() => setRulerOpen(false)} onCreate={createRuler}/>}
    {duplicateRulerOpen && selectedSegment && <DuplicateRulerDialog
      sourceLabel={`${selectedSegment.partner} · ${segmentDisplayLabel(selectedSegment.segment)}`}
      sourceSegment={selectedSegment.segment}
      emailCount={selectedSegmentGroups.length}
      variantCount={selectedSegmentGroups.reduce((total, group) => total + group.visibleRows.length, 0)}
      segmentOptions={[...new Set(taxonomy.filter((item) => item.partner === selectedSegment.partner).map((item) => item.segment).filter(Boolean))].sort((a, b) => naturalLabelSort(a, b))}
      onClose={() => setDuplicateRulerOpen(false)}
      onConfirm={duplicateRuler}
    />}
    {moveTarget && <MoveEmailDialog
      emailLabel={moveTarget.label}
      current={moveTarget.current}
      partnerOptions={movePartnerOptions}
      segmentsFor={moveSegmentsFor}
      weeksFor={moveWeeksFor}
      onClose={() => setMoveTarget(null)}
      onConfirm={(target) => moveEmail(moveTarget.groupId, target)}
    />}
    {newOpen && <NewBriefingDialog groups={editorialGroups.filter((group) => group.visibleRows.length)} settings={signatureSettings} taxonomy={taxonomy.filter((item) => item.businessFront === 'acquisition')} defaultPartner={newDefaults.partner} defaultSegment={newDefaults.segment} defaultWeekKey={newDefaults.weekKey} defaultSequence={`E-mail ${activeEditorialGroupCount + 1}`} onClose={() => setNewOpen(false)} onCreate={createBriefing}/>}
    {weekArchiveTarget && <div className="fixed inset-0 z-[75] grid place-items-center bg-slate-950/60 p-4" role="dialog" aria-modal="true" aria-labelledby="archive-week-title"><div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl"><h2 id="archive-week-title" className="font-bold text-slate-900">Arquivar {weekArchiveTarget.weekKey}?</h2><p className="mt-2 text-sm leading-5 text-slate-600">Todos os e-mails e variações ativos da semana sairão dos próximos CSVs. Registros já salvos continuarão no histórico.</p><div className="mt-5 flex justify-end gap-2"><button onClick={() => setWeekArchiveTarget(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700">Cancelar</button><button onClick={() => void archiveWeek(weekArchiveTarget)} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white">Arquivar semana</button></div></div></div>}
    {segmentArchiveTarget && <div className="fixed inset-0 z-[75] grid place-items-center bg-slate-950/60 p-4" role="dialog" aria-modal="true" aria-labelledby="archive-segment-title"><div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl"><h2 id="archive-segment-title" className="font-bold text-slate-900">Arquivar a régua “{segmentDisplayLabel(segmentArchiveTarget.segment)}”?</h2><p className="mt-2 text-sm leading-5 text-slate-600">Todas as semanas e e-mails ativos desta régua sairão dos próximos CSVs. Registros já salvos continuarão no histórico e podem ser restaurados.</p><div className="mt-5 flex justify-end gap-2"><button onClick={() => setSegmentArchiveTarget(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700">Cancelar</button><button onClick={() => void archiveSegment(segmentArchiveTarget)} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white">Arquivar régua</button></div></div></div>}
    {renameTarget && <div className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/60 p-4" role="dialog" aria-modal="true" aria-labelledby="rename-title" onMouseDown={(event) => { if (event.target === event.currentTarget) setRenameTarget(null); }}><div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl"><h2 id="rename-title" className="font-bold text-slate-900">{renameTarget.kind === 'week' ? 'Renomear semana' : 'Renomear régua'}</h2><p className="mt-1 text-sm leading-5 text-slate-600">{renameTarget.kind === 'week' ? 'O novo nome vale para todos os e-mails desta semana.' : 'O novo segmento vale para todos os e-mails da régua. Ele fica como rascunho de taxonomia até ser vinculado a um segmento observado em activities.'}</p><label className="mt-3 block text-xs font-semibold text-slate-700">{renameTarget.kind === 'week' ? 'Nome da semana' : 'Segmento técnico'}<input autoFocus value={renameValue} onChange={(event) => setRenameValue(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') void confirmRename(); }} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-cyan-400 focus-visible:ring-2 focus-visible:ring-cyan-100"/></label><div className="mt-5 flex justify-end gap-2"><button onClick={() => setRenameTarget(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">Cancelar</button><button disabled={!renameValue.trim() || renameValue.trim() === renameTarget.current} onClick={() => void confirmRename()} className="inline-flex items-center gap-2 rounded-lg bg-[#07595b] px-4 py-2 text-sm font-bold text-white hover:bg-[#064c4e] disabled:cursor-not-allowed disabled:opacity-40"><Pencil size={15}/>Salvar</button></div></div></div>}
    {signatureManagerOpen && selected && <SignatureManagerModal rows={rows} selected={selected} settings={signatureSettings} onClose={() => setSignatureManagerOpen(false)} onVariantStatus={(row, status) => void changeVariantStatus(row, status)} onGlobalStatus={(setting, status) => void changeGlobalSignature(setting, status)} onAdd={addSignatureToSelectedGroup}/>}
    {saveOpen && selected && <SaveDialog selected={selected} errors={selectedGroupErrorCount} saving={isSaving} onClose={() => !isSaving && setSaveOpen(false)} onSave={saveCurrent} updateSelected={updateSelected}/>}
    {exportOpen && <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 p-4" role="dialog" aria-modal="true" aria-labelledby="export-csv-title" onMouseDown={(event) => { if (event.target === event.currentTarget) setExportOpen(false); }}>
      <div className="flex max-h-[92vh] w-full max-w-lg flex-col rounded-2xl bg-white p-5 shadow-2xl">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-cyan-50 text-cyan-700"><Download size={18}/></span>
          <div className="min-w-0"><h2 id="export-csv-title" className="font-bold text-slate-900">Exportar CSV para o SFMC</h2><p className="mt-1 text-sm leading-5 text-slate-600">Escolha quais réguas entram no arquivo <code className="rounded bg-slate-100 px-1 text-[11px]">TB_BRIEFING_CAMPANHA_AQUISICAO</code>. Réguas com pendências bloqueantes não podem ser exportadas.</p></div>
        </div>
        <div className="mt-4 min-h-0 flex-1 space-y-1.5 overflow-y-auto">
          {rulerExportOptions.map((option) => {
            const blocked = option.errorGroups > 0;
            const checked = exportSelection.has(option.key) && !blocked;
            return <label key={option.key} className={`flex items-start gap-3 rounded-xl border px-3 py-2.5 text-sm ${blocked ? 'cursor-not-allowed border-slate-200 bg-slate-50 opacity-70' : checked ? 'cursor-pointer border-cyan-300 bg-cyan-50/60' : 'cursor-pointer border-slate-200 hover:border-cyan-200'}`}>
              <input type="checkbox" disabled={blocked} checked={checked} onChange={(event) => setExportSelection((current) => { const next = new Set(current); if (event.target.checked) next.add(option.key); else next.delete(option.key); return next; })} className="mt-0.5 h-4 w-4 accent-cyan-600"/>
              <span className="min-w-0 flex-1"><span className="block font-bold text-slate-900">{option.label}</span><span className="mt-0.5 block text-xs text-slate-500">{option.total} {option.total === 1 ? 'e-mail' : 'e-mails'}{blocked ? ` · ${option.errorGroups} com pendência bloqueante` : ''}</span></span>
              {blocked ? <ShieldAlert size={15} className="mt-0.5 shrink-0 text-red-500"/> : <CheckCircle2 size={15} className={`mt-0.5 shrink-0 ${checked ? 'text-cyan-600' : 'text-slate-300'}`}/>}
            </label>;
          })}
          {!rulerExportOptions.length && <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-6 text-center text-sm text-slate-500">Nenhuma régua ativa para exportar.</p>}
        </div>
        <div className="mt-3 flex items-center justify-between gap-2">
          <button type="button" onClick={() => setExportSelection(new Set(rulerExportOptions.filter((option) => option.errorGroups === 0).map((option) => option.key)))} className="text-xs font-bold text-cyan-700 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-cyan-500">Selecionar todas as prontas</button>
          <span className="text-xs text-slate-500">{[...exportSelection].filter((key) => rulerExportOptions.some((option) => option.key === key && option.errorGroups === 0)).length} selecionada(s)</span>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={() => setExportOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 outline-none hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-cyan-500">Cancelar</button>
          <button type="button" onClick={confirmExport} disabled={![...exportSelection].some((key) => rulerExportOptions.some((option) => option.key === key && option.errorGroups === 0))} className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-bold text-white outline-none hover:bg-cyan-700 focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"><Download size={15}/>Baixar CSV</button>
        </div>
      </div>
    </div>}
  </div>;
};

const CollapsibleBlock = ({ id, label, description, open, onToggle, tone = 'default', marker, focused, onHoverChange, children }: { id?: string; label: string; description?: string; open: boolean; onToggle: () => void; tone?: 'default' | 'audit'; marker?: React.ReactNode; focused?: boolean; onHoverChange?: (hovering: boolean) => void; children: React.ReactNode }) => (
  <div
    id={id}
    onMouseEnter={onHoverChange ? () => onHoverChange(true) : undefined}
    onMouseLeave={onHoverChange ? () => onHoverChange(false) : undefined}
    className={`scroll-mt-24 overflow-hidden rounded-xl border transition ${focused ? 'border-cyan-400 ring-2 ring-cyan-200' : tone === 'audit' ? 'border-cyan-200 bg-cyan-50/40' : 'border-slate-200 bg-white'}`}
  >
    <button type="button" onClick={onToggle} aria-expanded={open} className="flex min-h-12 w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left outline-none transition hover:bg-slate-50/80 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-500">
      <div className="flex min-w-0 items-center gap-2.5">
        {marker}
        <div className="min-w-0">
          <div className={`font-bold ${tone === 'audit' ? 'text-cyan-900' : 'text-slate-800'}`}>{label}</div>
          {description && <div className="truncate text-xs text-slate-500">{description}</div>}
        </div>
      </div>
      <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg border text-xs font-bold transition ${open ? 'border-cyan-300 bg-cyan-50 text-cyan-700' : 'border-slate-300 bg-white text-slate-500'}`} aria-hidden="true">
        <ChevronDown size={17} className={`transition-transform duration-150 ${open ? 'rotate-180' : ''}`}/>
      </span>
    </button>
    {open && <div className="border-t border-slate-100 px-3.5 py-3">{children}</div>}
  </div>
);

const ResizeHandle = ({ label, onPointerDown, onReset }: { label: string; onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => void; onReset: () => void }) => (
  <div
    role="separator"
    aria-orientation="vertical"
    aria-label={label}
    title="Arraste para ajustar a largura. Dois cliques para restaurar."
    onPointerDown={onPointerDown}
    onDoubleClick={onReset}
    className="group/handle relative z-20 flex w-3 shrink-0 cursor-col-resize touch-none select-none justify-center self-stretch outline-none"
  >
    <span className="pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-slate-200 transition group-hover/handle:bg-cyan-400"/>
    <span className="pointer-events-none sticky top-[calc(50%-1.25rem)] my-3 h-10 w-1.5 self-start rounded-full border border-slate-300 bg-white shadow-sm transition group-hover/handle:border-cyan-500 group-hover/handle:bg-cyan-50"/>
  </div>
);

const BlockMarker = ({ num }: { num?: number }) => (
  num
    ? <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-cyan-600 text-[11px] font-extrabold text-white">{num}</span>
    : <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-slate-300 text-slate-400"><Settings2 size={12}/></span>
);

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

const REVIEWER_GRID = 'grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_92px_58px_30px]';

const WeekReviewer = ({ selection, groups, strategies, issuesByRow, selectedId, onSelect, onEdit, onNewEmail, onDuplicate, onDuplicateRuler, onOpenPlan }: { selection: ReviewerSelection; groups: EditorialGroup[]; strategies: EmailStrategy[]; issuesByRow: Map<string, ValidationIssue[]>; selectedId: string; onSelect: (id: string) => void; onEdit: (id: string) => void; onNewEmail?: () => void; onDuplicate?: () => void; onDuplicateRuler?: () => void; onOpenPlan?: () => void }) => {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const toggleRow = (id: string) => setExpandedRows((current) => { const next = new Set(current); next.has(id) ? next.delete(id) : next.add(id); return next; });
  const summaries = groups.map((group) => {
    const rows = group.visibleRows;
    const representative = rows.find((row) => row.NM_PRODUTO_INTERNO.toUpperCase() === 'AMIGAO') ?? group.representative;
    const issueMap = new Map<string, ValidationIssue>();
    rows.flatMap((row) => issuesByRow.get(row.__id) ?? []).forEach((issue) => issueMap.set(`${issue.code}:${issue.field ?? ''}:${issue.message}`, issue));
    const issues = [...issueMap.values()];
    const assetCount = new Set(rows.flatMap((row) => [row.HEADER, row.BANNER_1_CORPO, row.BANNER_2_CORPO, row.BANNER_3_CORPO]).filter(Boolean)).size;
    const strategy = strategies.find((item) => item.campaignGroupId === group.id);
    return { group, representative, issues, assetCount, strategy, planFields: countConfiguredStrategyFields(strategy), planTone: strategyReadiness(strategy).tone, ready: rows.length > 0 && rows.every((row) => row.__meta.status === 'ready') && !issues.some((issue) => issue.severity === 'error') };
  });
  const readyCount = summaries.filter((item) => item.ready).length;
  const withPlanCount = summaries.filter((item) => item.planFields >= 4).length;
  const totalAssets = new Set(groups.flatMap((group) => group.visibleRows.flatMap((row) => [row.HEADER, row.BANNER_1_CORPO, row.BANNER_2_CORPO, row.BANNER_3_CORPO])).filter(Boolean)).size;
  const pendingCount = summaries.reduce((total, item) => total + item.issues.filter((issue) => issue.severity === 'error').length, 0);
  const fullRuler = !selection.weekKey;
  const planBar = (tone: string) => tone === 'success' ? 'bg-emerald-500' : tone === 'danger' ? 'bg-red-400' : 'bg-amber-400';
  return <section className="flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" aria-label={fullRuler ? `Régua completa de ${segmentDisplayLabel(selection.segment)}` : `Revisor de e-mails de ${selection.weekKey}`}>
    <header className="border-b border-slate-200 bg-white px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0"><div className="flex items-center gap-2"><ListChecks size={17} className="shrink-0 text-cyan-700"/><h2 className="font-bold text-slate-900">{fullRuler ? 'Revisor da régua completa' : 'Revisor de e-mails'}</h2></div><p className="mt-0.5 text-xs text-slate-500">{selection.partner} · {segmentDisplayLabel(selection.segment)}{selection.weekKey ? ` · ${selection.weekKey}` : ' · E-mails 1 a 8'}</p></div>
        {(onDuplicateRuler || (onDuplicate && onNewEmail)) && <div className="flex flex-wrap gap-2">{fullRuler && onDuplicateRuler && <button type="button" onClick={onDuplicateRuler} disabled={!groups.length} className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 text-xs font-bold text-slate-700 outline-none hover:border-cyan-300 focus-visible:ring-2 focus-visible:ring-cyan-500 disabled:opacity-40"><Copy size={13}/>Duplicar régua</button>}{onDuplicate && onNewEmail && <><button type="button" onClick={onDuplicate} className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 text-xs font-bold text-slate-700 hover:border-cyan-300"><Copy size={13}/>Duplicar semana</button><button type="button" onClick={onNewEmail} className="inline-flex min-h-8 items-center gap-1.5 rounded-lg bg-[#07595b] px-2.5 text-xs font-bold text-white"><Plus size={13}/>Criar e-mail</button></>}</div>}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] font-semibold text-slate-500">
        <span><b className="text-slate-800">{groups.length}</b> e-mails</span><span className="text-slate-300">·</span>
        <span className={groups.length > 0 && readyCount === groups.length ? 'text-emerald-700' : ''}><b>{readyCount}</b> prontos</span><span className="text-slate-300">·</span>
        <span className={groups.length > 0 && withPlanCount === groups.length ? 'text-emerald-700' : 'text-amber-700'}><b>{withPlanCount}</b> com plano</span><span className="text-slate-300">·</span>
        <span><b className="text-slate-800">{totalAssets}</b> assets</span>
        {pendingCount > 0 && <><span className="text-slate-300">·</span><span className="text-red-700"><b>{pendingCount}</b> pendências</span></>}
      </div>
    </header>
    <div className="min-h-0 flex-1 overflow-auto p-3">
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <div className={`grid ${REVIEWER_GRID} min-w-[440px] gap-2 border-b border-slate-200 bg-slate-50 px-3 py-1.5 text-[9px] font-bold uppercase tracking-wide text-slate-400`}>
          <span>E-mail</span><span>Assunto</span><span>Plano de comunicação</span><span className="text-right">Assets·var</span><span aria-hidden="true"/>
        </div>
        {summaries.map(({ group, representative, issues, assetCount, strategy, planFields, planTone, ready }, index) => {
          const isSel = group.visibleRows.some((row) => row.__id === selectedId);
          const errorCount = issues.filter((issue) => issue.severity === 'error').length;
          const editId = group.visibleRows.find((row) => row.__id === selectedId)?.__id ?? representative.__id;
          const open = expandedRows.has(group.id);
          const statusDot = ready ? 'bg-emerald-500' : errorCount ? 'bg-red-500' : 'bg-amber-500';
          return <div key={group.id} className={`border-b border-slate-100 last:border-b-0 ${isSel ? 'bg-cyan-50' : ''}`}>
            <div className={`grid ${REVIEWER_GRID} min-w-[440px] items-center gap-2 px-3 py-1.5 text-xs ${isSel ? '' : 'hover:bg-slate-50'}`}>
              <div className="flex min-w-0 items-center gap-1">
                <button type="button" onClick={() => toggleRow(group.id)} aria-expanded={open} aria-label={open ? 'Recolher detalhes' : 'Ver detalhes do plano'} className="grid h-5 w-5 shrink-0 place-items-center rounded text-slate-400 outline-none hover:bg-slate-200 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-cyan-500">{open ? <ChevronDown size={13}/> : <ChevronRight size={13}/>}</button>
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-slate-100 text-[10px] font-extrabold text-slate-600">{index + 1}</span>
                <button type="button" onClick={() => onSelect(representative.__id)} className="min-w-0 flex-1 truncate text-left font-bold text-slate-900 outline-none hover:text-cyan-800 focus-visible:ring-2 focus-visible:ring-cyan-500" title="Atualizar a prévia com este e-mail">{representative.SEQUENCIA || `E-mail ${index + 1}`}</button>
                <span className={`h-2 w-2 shrink-0 rounded-full ${statusDot}`} title={ready ? 'Pronto' : errorCount ? `${errorCount} ajustes` : 'Revisar'}/>
              </div>
              <button type="button" onClick={() => onSelect(representative.__id)} className="min-w-0 truncate text-left text-slate-600 outline-none hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-cyan-500" title={representative.ASSUNTO || 'Assunto não preenchido'}>{representative.ASSUNTO || <span className="italic text-slate-400">Assunto não preenchido</span>}</button>
              <button type="button" onClick={() => toggleRow(group.id)} className="flex min-w-0 items-center gap-1.5 outline-none focus-visible:ring-2 focus-visible:ring-cyan-500" title={strategy ? `${planFields} de ${STRATEGY_FIELD_COUNT} diretrizes do plano preenchidas` : 'Nenhum plano de comunicação vinculado'}>
                <span className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-slate-200"><span className={`block h-full rounded-full ${planBar(planTone)}`} style={{ width: `${Math.round((planFields / STRATEGY_FIELD_COUNT) * 100)}%` }}/></span>
                <span className="shrink-0 text-[10px] font-bold text-slate-500">{planFields}/{STRATEGY_FIELD_COUNT}</span>
              </button>
              <span className="text-right text-[11px] font-semibold text-slate-500">{assetCount} · {group.visibleRows.length}v</span>
              <button type="button" onClick={() => onEdit(editId)} title="Abrir o editor completo deste e-mail" className="grid h-7 w-7 place-items-center rounded-lg bg-[#07595b] text-white outline-none transition hover:bg-[#064c4e] focus-visible:ring-2 focus-visible:ring-cyan-500"><Pencil size={12}/></button>
            </div>
            {open && <div className="border-t border-slate-100 bg-slate-50/70 px-3 py-2.5 pl-[46px] text-xs">
              <div className="grid gap-x-4 gap-y-2 sm:grid-cols-2">
                <PlanBit label="Papel na régua" value={strategy?.roleInRuler}/>
                <PlanBit label="Objetivo do e-mail" value={strategy?.emailObjective}/>
                <PlanBit label="Mensagem-chave" value={strategy?.keyMessage}/>
                <PlanBit label="Ação esperada" value={strategy?.expectedAction}/>
                <PlanBit label="Benefício principal" value={strategy?.primaryBenefit}/>
                <PlanBit label="Pré-cabeçalho (atual)" value={representative.PRE_CABECALHO}/>
              </div>
              {strategy?.keyMessage && <div className="mt-2 rounded-lg border border-slate-200 bg-white p-2 leading-4">
                <div className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Assunto · planejado × atual</div>
                <div className="mt-0.5 text-[11px] text-slate-600"><b className="text-slate-400">Direção do plano:</b> {strategy.keyMessage}</div>
                <div className="text-[11px] text-slate-800"><b className="text-slate-400">Assunto atual:</b> {representative.ASSUNTO || '—'}</div>
              </div>}
              <div className="mt-2 flex flex-wrap gap-2">
                <button type="button" onClick={() => onEdit(editId)} className="inline-flex h-7 items-center gap-1 rounded-lg bg-[#07595b] px-2.5 text-[11px] font-bold text-white outline-none hover:bg-[#064c4e] focus-visible:ring-2 focus-visible:ring-cyan-500"><Pencil size={12}/>Editar e-mail</button>
                {onOpenPlan && <button type="button" onClick={onOpenPlan} className="inline-flex h-7 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] font-bold text-cyan-800 outline-none hover:border-cyan-300 focus-visible:ring-2 focus-visible:ring-cyan-500">Ver no Plano de Comunicação →</button>}
              </div>
            </div>}
          </div>;
        })}
      </div>
      {!groups.length && <div className="py-14 text-center text-sm text-slate-500"><Mail className="mx-auto mb-2 text-slate-300"/><b>Nenhum e-mail ativo nesta semana.</b><p className="mt-1 text-xs">Crie o primeiro e-mail para iniciar a revisão.</p></div>}
    </div>
  </section>;
};

const PlanBit = ({ label, value }: { label: string; value?: string }) => <div className="min-w-0">
  <div className="text-[9px] font-bold uppercase tracking-wide text-slate-400">{label}</div>
  <div className={`text-[11px] leading-4 ${value ? 'text-slate-700' : 'italic text-amber-600'}`}>{value || 'não definido no plano'}</div>
</div>;

type BriefingTreeActions = { selectedId: string; selectedWeek: WeekSelection | null; selectedSegment: SegmentSelection | null; showArchived: boolean; onSelect: (id: string) => void; onSelectSegment: (selection: SegmentSelection) => void; onSelectWeek: (selection: WeekSelection) => void; onManage: (groupId: string) => void; onNewWeek: (partner: string, segment: string) => void; onNewEmail: (partner: string, segment: string, weekKey: string) => void; onDuplicateWeek: (partner: string, segment: string, weekKey: string) => void; onArchiveWeek: (partner: string, segment: string, weekKey: string) => void; onDuplicateEmail: (groupId: string) => void; onArchiveEmail: (groupId: string) => void; onRestoreWeek: (partner: string, segment: string, weekKey: string) => void; onRestoreEmail: (groupId: string) => void; onRenameWeek: (partner: string, segment: string, weekKey: string) => void; onRenameSegment: (partner: string, segment: string) => void; onDuplicateRulerFromTree: (partner: string, segment: string) => void; onArchiveSegment: (partner: string, segment: string) => void; onRestoreSegment: (partner: string, segment: string) => void; onMoveEmail: (groupId: string) => void; onCreatePartnerRuler: (partner: string, journeyContext?: JourneyContext) => void };
type PartnerBriefingTreeProps = BriefingTreeActions & { groups: EditorialGroup[]; emptyPartnerSlots: readonly string[] };
type BriefingTreeProps = PartnerBriefingTreeProps & { strategies: EmailStrategy[]; viewMode: 'partner' | 'journey' };
const CANONICAL_JOURNEYS: JourneyContext[] = [{ family: 'Aquisição', type: 'Topo de Funil' }, { family: 'Ciclo de Vida', type: 'Welcome' }, { family: 'Ciclo de Vida', type: 'Desbloqueio' }, { family: 'Ciclo de Vida', type: 'Ativação' }];

const BriefingTree = ({ viewMode, strategies, ...props }: BriefingTreeProps) => viewMode === 'journey' ? <JourneyBriefingTree {...props} strategies={strategies}/> : <PartnerBriefingTree {...props}/>;

const JourneyBriefingTree = ({ groups, strategies, emptyPartnerSlots, showArchived, onCreatePartnerRuler, ...actions }: Omit<BriefingTreeProps, 'viewMode'>) => {
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(['Aquisição', 'Aquisição::Topo de Funil']));
  const strategyByGroup = useMemo(() => new Map(strategies.map((strategy) => [strategy.campaignGroupId, strategy])), [strategies]);
  const partners = useMemo(() => [...new Set([...groups.map((group) => group.representative.__meta.partner || 'Sem parceiro'), ...emptyPartnerSlots])].sort(naturalLabelSort), [emptyPartnerSlots, groups]);
  const entries = useMemo(() => {
    const map = new Map<string, { context: JourneyContext; groups: EditorialGroup[] }>();
    if (!showArchived) CANONICAL_JOURNEYS.forEach((context) => map.set(`${context.family}::${context.type}`, { context, groups: [] }));
    groups.forEach((group) => { const context = journeyContextForStrategy(strategyByGroup.get(group.id), group.representative.TP_CAMPANHA, group.representative.__meta.segment); const key = `${context.family}::${context.type}`; const entry = map.get(key) ?? { context, groups: [] }; entry.groups.push(group); map.set(key, entry); });
    return [...map.values()];
  }, [groups, showArchived, strategyByGroup]);
  const families = useMemo(() => { const map = new Map<string, typeof entries>(); entries.forEach((entry) => map.set(entry.context.family, [...(map.get(entry.context.family) ?? []), entry])); return map; }, [entries]);
  const toggle = (key: string) => setExpanded((current) => { const next = new Set(current); next.has(key) ? next.delete(key) : next.add(key); return next; });
  const node = (key: string, label: string, count: string, level = 0) => <button type="button" onClick={() => toggle(key)} aria-expanded={expanded.has(key)} className="flex min-h-9 w-full items-center gap-1.5 rounded-lg px-2 text-left text-xs font-bold text-slate-700 outline-none hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-cyan-500" style={{ paddingLeft: `${8 + level * 12}px` }}>{expanded.has(key) ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}<span className="min-w-0 flex-1 truncate">{label}</span><span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">{count}</span></button>;
  return <div><div className="mb-2 flex items-center justify-between gap-2"><span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{showArchived ? 'Lixeira por jornada' : 'Orquestração'}</span><div className="flex gap-1"><button type="button" onClick={() => setExpanded(new Set())} className="rounded-md border border-slate-200 px-2 py-1 text-[10px] font-bold text-slate-600">Recolher</button><button type="button" onClick={() => setExpanded(new Set([...families.entries()].flatMap(([family, items]) => [family, ...items.map(({ context }) => `${family}::${context.type}`)])))} className="rounded-md border border-slate-200 px-2 py-1 text-[10px] font-bold text-slate-600">Ver jornadas</button></div></div>{[...families.entries()].sort(([a], [b]) => naturalLabelSort(a, b)).map(([family, items]) => <div key={family}>{node(family, family.toUpperCase(), `${items.reduce((total, item) => total + item.groups.length, 0)} e-mails`)}{expanded.has(family) && items.sort((a, b) => naturalLabelSort(a.context.type, b.context.type)).map(({ context, groups: typeGroups }) => { const key = `${family}::${context.type}`; const covered = new Set(typeGroups.map((group) => group.representative.__meta.partner || 'Sem parceiro')); return <div key={key} className="ml-3">{node(key, context.type, `${covered.size}/${partners.length} parceiros`, 1)}{expanded.has(key) && <div className="ml-3 border-l border-cyan-100 pl-1"><PartnerBriefingTree {...actions} showArchived={showArchived} groups={typeGroups} emptyPartnerSlots={showArchived ? [] : partners.filter((partner) => !covered.has(partner))} onCreatePartnerRuler={(partner) => onCreatePartnerRuler(partner, context)}/></div>}</div>; })}</div>)}</div>;
};

const PartnerBriefingTree = ({ groups, emptyPartnerSlots, selectedId, selectedWeek, selectedSegment, showArchived, onSelect, onSelectSegment, onSelectWeek, onManage, onNewWeek, onNewEmail, onDuplicateWeek, onArchiveWeek, onDuplicateEmail, onArchiveEmail, onRestoreWeek, onRestoreEmail, onRenameWeek, onRenameSegment, onDuplicateRulerFromTree, onArchiveSegment, onRestoreSegment, onMoveEmail, onCreatePartnerRuler }: PartnerBriefingTreeProps) => {
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
    emptyPartnerSlots.forEach((partner) => { if (!partners.has(partner)) partners.set(partner, new Map()); });
    return partners;
  }, [emptyPartnerSlots, groups]);
  const disclosure = (key: string, label: React.ReactNode, count?: string, level = 0) => <button type="button" onClick={() => toggle(key)} aria-expanded={expanded.has(key)} className="flex min-h-9 w-full items-center gap-1.5 rounded-lg px-2 text-left text-xs font-bold text-slate-700 outline-none hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-cyan-500" style={{ paddingLeft: `${8 + level * 12}px` }}>{expanded.has(key) ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}<span className="min-w-0 flex-1 truncate">{label}</span>{count && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">{count}</span>}</button>;
  return <div><div className="mb-2 flex items-center justify-between gap-2"><span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{showArchived ? 'Lixeira' : 'Navegação'}</span><div className="flex gap-1"><button type="button" onClick={() => setExpanded(new Set())} className="rounded-md border border-slate-200 px-2 py-1 text-[10px] font-bold text-slate-600 hover:border-cyan-300 hover:text-cyan-800">Recolher tudo</button><button type="button" onClick={() => { const next = new Set<string>(); [...branches.entries()].forEach(([partner, segments]) => { next.add(`p:${partner}`); [...segments.keys()].forEach((segment) => next.add(`p:${partner}/s:${segment}`)); }); setExpanded(next); localStorage.setItem('gaas-email-tree-expanded-v1', JSON.stringify([...next])); }} className="rounded-md border border-slate-200 px-2 py-1 text-[10px] font-bold text-slate-600 hover:border-cyan-300 hover:text-cyan-800">Ver segmentos</button></div></div>{branches.size === 0 && <div className="rounded-xl border border-dashed border-slate-200 px-4 py-10 text-center"><Trash2 className="mx-auto mb-2 text-slate-300" size={24}/><b className="text-sm text-slate-700">{showArchived ? 'A Lixeira está vazia' : 'Nenhum briefing neste filtro'}</b><p className="mt-1 text-xs leading-5 text-slate-500">{showArchived ? 'E-mails e semanas removidos aparecerão aqui e poderão ser restaurados.' : 'Ajuste a busca ou selecione outro status.'}</p></div>}<div className="space-y-1">{[...branches.entries()].map(([partner, segments]) => ({ partner, segments, volume: [...segments.values()].reduce((total, weeks) => total + [...weeks.values()].flat().length, 0) })).sort((a, b) => b.volume - a.volume || naturalLabelSort(a.partner, b.partner)).map(({ partner, segments, volume }) => {
    const partnerKey = `p:${partner}`;
    const partnerCount = volume;
    const emptySlot = segments.size === 0;
    return <div key={partnerKey}>{disclosure(partnerKey, <span className="uppercase tracking-wide text-cyan-800">{partner}</span>, emptySlot ? undefined : `${partnerCount} e-mails`)}{expanded.has(partnerKey) && emptySlot && <div className="ml-7 mr-1 mt-1 rounded-xl border border-dashed border-cyan-200 bg-cyan-50/50 p-3"><div className="text-xs font-bold text-cyan-950">Campanha de aquisição</div><p className="mt-1 text-[11px] leading-4 text-slate-500">Espaço reservado. Nenhum briefing foi criado ainda.</p><button type="button" onClick={() => onCreatePartnerRuler(partner)} className="mt-2 inline-flex min-h-8 items-center gap-1.5 rounded-lg bg-[#07595b] px-3 text-[11px] font-bold text-white outline-none hover:bg-[#064c4e] focus-visible:ring-2 focus-visible:ring-cyan-500"><Plus size={13}/>Criar régua</button></div>}{expanded.has(partnerKey) && [...segments.entries()].sort(([a], [b]) => naturalLabelSort(a, b)).map(([segment, weeks]) => {
      const segmentKey = `${partnerKey}/s:${segment}`;
      const segmentMenuKey = `menu:${segmentKey}`;
      const segmentSelected = selectedSegment?.partner === partner && selectedSegment.segment === segment;
      const segmentEmailCount = [...weeks.values()].flat().filter((group) => group.visibleRows.length).length;
      const segmentGroups = [...weeks.values()].flat();
      const segmentActive = segmentGroups.some((group) => group.rows.some((row) => row.__meta.status !== 'archived'));
      const segmentItems: TreeMenuItem[] = [
        { label: 'Criar semana', icon: <Plus size={14}/>, onClick: () => { setMenuOpen(null); onNewWeek(partner, segment); } },
        { label: 'Renomear régua', icon: <Pencil size={14}/>, onClick: () => { setMenuOpen(null); onRenameSegment(partner, segment); } },
      ];
      if (segmentActive) segmentItems.push(
        { label: 'Duplicar régua', icon: <Copy size={14}/>, onClick: () => { setMenuOpen(null); onDuplicateRulerFromTree(partner, segment); } },
        { label: 'Arquivar régua', icon: <Trash2 size={14}/>, danger: true, onClick: () => { setMenuOpen(null); onArchiveSegment(partner, segment); } },
      );
      else if (segmentGroups.some((group) => group.rows.some((row) => row.__meta.status === 'archived'))) segmentItems.push(
        { label: 'Restaurar régua do arquivo', icon: <ArchiveRestore size={14}/>, onClick: () => { setMenuOpen(null); onRestoreSegment(partner, segment); } },
      );
      return <div key={segmentKey}><div className={`flex items-center rounded-lg ${segmentSelected ? 'bg-cyan-50 ring-1 ring-cyan-300' : ''}`}><button type="button" onClick={() => toggle(segmentKey)} aria-expanded={expanded.has(segmentKey)} aria-label={`${expanded.has(segmentKey) ? 'Recolher' : 'Expandir'} ${segmentDisplayLabel(segment)}`} className="ml-3 rounded-md p-1.5 text-slate-500 outline-none hover:bg-white focus-visible:ring-2 focus-visible:ring-cyan-500">{expanded.has(segmentKey) ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}</button><button type="button" onClick={() => onSelectSegment({ partner, segment })} className="flex min-h-9 min-w-0 flex-1 items-center gap-2 rounded-lg px-1 text-left text-xs font-bold text-slate-700 outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"><span className="min-w-0 flex-1 truncate">{segmentDisplayLabel(segment)}</span><span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">{segmentEmailCount} e-mails</span></button><TreeActionMenu label={`Configurar ${segmentDisplayLabel(segment)}`} open={menuOpen === segmentMenuKey} onToggle={() => setMenuOpen((current) => current === segmentMenuKey ? null : segmentMenuKey)} items={segmentItems}/></div>{expanded.has(segmentKey) && [...weeks.entries()].sort(([a], [b]) => naturalLabelSort(a, b)).map(([week, weekGroups]) => {
        const weekKey = `${segmentKey}/w:${week}`;
        const hasActiveWeek = weekGroups.some((group) => group.rows.some((row) => row.__meta.status !== 'archived'));
        const weekMenuKey = `menu:${weekKey}`;
        const weekItems: TreeMenuItem[] = [
          { label: 'Novo e-mail nesta semana', icon: <Plus size={14}/>, onClick: () => { setMenuOpen(null); onNewEmail(partner, segment, week); } },
          { label: 'Renomear semana', icon: <Pencil size={14}/>, onClick: () => { setMenuOpen(null); onRenameWeek(partner, segment, week); } },
        ];
        if (hasActiveWeek) weekItems.push(
          { label: 'Duplicar semana e e-mails', icon: <Copy size={14}/>, onClick: () => { setMenuOpen(null); onDuplicateWeek(partner, segment, week); } },
          { label: 'Mover semana para a Lixeira', icon: <Trash2 size={14}/>, danger: true, onClick: () => { setMenuOpen(null); onArchiveWeek(partner, segment, week); } },
        );
        if (!hasActiveWeek && weekGroups.some((group) => group.rows.some((row) => row.__meta.status === 'archived'))) weekItems.push(
          { label: 'Restaurar semana da Lixeira', icon: <ArchiveRestore size={14}/>, onClick: () => { setMenuOpen(null); onRestoreWeek(partner, segment, week); } },
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
            { label: 'Mover para outra semana/segmento…', icon: <ArrowRightLeft size={14}/>, onClick: () => { setMenuOpen(null); onMoveEmail(group.id); } },
            { label: 'Mover e-mail para a Lixeira', icon: <Trash2 size={14}/>, danger: true, onClick: () => { setMenuOpen(null); onArchiveEmail(group.id); } },
          );
          else if (group.rows.some((row) => row.__meta.status === 'archived')) emailItems.push(
            { label: 'Restaurar e-mail da Lixeira', icon: <ArchiveRestore size={14}/>, onClick: () => { setMenuOpen(null); onRestoreEmail(group.id); } },
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

const PLAN_FIELDS: { key: 'roleInRuler' | 'emailObjective' | 'objectionAddressed' | 'keyMessage' | 'valueProposition' | 'primaryBenefit' | 'secondaryBenefits' | 'proof' | 'expectedAction' | 'ctaStrategy' | 'visualHierarchyStrategy'; label: string; help: string; result: string; step: 0 | 1 | 2; list?: boolean }[] = [
  { key: 'roleInRuler', label: 'Papel na régua', step: 0, help: 'Explique a função deste contato dentro da sequência: apresentar, aprofundar, provar, recuperar ou converter.', result: 'Ajuda a equipe a evitar repetição e garante progressão entre os e-mails.' },
  { key: 'emailObjective', label: 'Objetivo do e-mail', step: 0, help: 'Registre o resultado de comunicação esperado neste envio, sem confundir com a meta geral da campanha.', result: 'Permite revisar se assunto, conteúdo e CTAs trabalham para o mesmo objetivo.' },
  { key: 'objectionAddressed', label: 'Objeção trabalhada', step: 0, help: 'Indique a dúvida, barreira ou receio que o conteúdo deve reduzir.', result: 'Direciona argumentos e provas para uma resistência real do público.' },
  { key: 'keyMessage', label: 'Mensagem-chave', step: 1, help: 'Escreva em uma frase o que a pessoa deve lembrar depois de ler o e-mail.', result: 'Cria uma âncora para título, copy, imagem e repetição da mensagem.' },
  { key: 'valueProposition', label: 'Proposta de valor', step: 1, help: 'Descreva por que a oferta é relevante para este público e o valor que ela entrega.', result: 'Mantém a criação conectada ao produto, não apenas à promoção do momento.' },
  { key: 'primaryBenefit', label: 'Benefício principal', step: 1, help: 'Escolha o benefício que deve receber maior destaque e aparecer primeiro na hierarquia.', result: 'Define a prioridade editorial e visual do e-mail.' },
  { key: 'secondaryBenefits', label: 'Benefícios complementares', step: 1, list: true, help: 'Liste um benefício por linha. Inclua apenas argumentos que reforcem a proposta principal.', result: 'Dá repertório para blocos secundários e futuras adaptações sem disputar com a mensagem central.' },
  { key: 'proof', label: 'Prova ou sustentação', step: 1, help: 'Registre fatos, condições, dados, demonstrações ou evidências aprovadas que sustentam a promessa.', result: 'Reduz claims frágeis e facilita a revisão jurídica e de produto.' },
  { key: 'expectedAction', label: 'Ação esperada', step: 2, help: 'Descreva o comportamento que se espera após o contato: conhecer, simular, solicitar, retomar ou concluir.', result: 'Serve de critério para avaliar os CTAs e o destino dos links.' },
  { key: 'ctaStrategy', label: 'Estratégia de CTAs', step: 2, help: 'Defina quantidade, textos, posições e destinos. O plano pode repetir o CTA principal ou combinar mais de uma chamada quando isso apoiar a conversão.', result: 'Permite usar múltiplos CTAs de forma intencional e mensurável, sem criar uma restrição artificial.' },
  { key: 'visualHierarchyStrategy', label: 'Hierarquia visual', step: 2, help: 'Explique o que precisa aparecer primeiro, quais blocos ganham destaque e como a leitura deve evoluir até os CTAs.', result: 'Traduz a estratégia em uma ordem visual reproduzível por designers e por IA.' },
];
const PLAN_STEP_TITLES = ['Função na régua', 'Argumento e proposta', 'Conversão e hierarquia'];
const PLAN_STOPWORDS = new Set(['para', 'com', 'sua', 'seu', 'como', 'voce', 'todos', 'todas', 'esse', 'essa', 'isso', 'mais', 'pela', 'pelo', 'uma', 'das', 'dos', 'que', 'nao', 'sem', 'por', 'the', 'and', 'seus', 'suas']);
const planTokens = (value?: string) => new Set(((value ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').match(/[a-z0-9]{4,}/g) ?? []).filter((word) => !PLAN_STOPWORDS.has(word)));

const BENEFIT_CATEGORY_LABEL: Record<string, string> = {
  desconto: 'Desconto', cashback: 'Cashback', prazo: 'Prazo', saude: 'Saúde', seguro: 'Seguro',
  cartao_virtual: 'Cartão virtual', aceitacao: 'Aceitação', frete: 'Frete', sorteio: 'Sorteio',
  pontos: 'Pontos', vibe: 'Vibe', app: 'App', atendimento: 'Atendimento', outro: 'Outros',
};
// enquanto a migration de estrutura de benefício não roda, a categoria é inferida do texto.
const inferBenefitCategory = (g: ProductGuardrail): string => {
  if (g.category) return g.category;
  const t = `${g.title} ${g.ruleText}`.toLowerCase();
  if (/vibe|cr[ée]dito/.test(t)) return 'vibe';
  if (/cashback|dinheiro de volta/.test(t)) return 'cashback';
  if (/sa[úu]de|consulta|exame|medicament|farm[áa]cia|odonto|voc[êe] bem/.test(t)) return 'saude';
  if (/seguro/.test(t)) return 'seguro';
  if (/cart[ãa]o virtual/.test(t)) return 'cartao_virtual';
  if (/frete/.test(t)) return 'frete';
  if (/sorteio|pr[êe]mio/.test(t)) return 'sorteio';
  if (/ponto|selo/.test(t)) return 'pontos';
  if (/parcel|prazo|anuidad|fatura/.test(t)) return 'prazo';
  if (/aceit|internacional|bandeira visa|todos os estabelecimentos/.test(t)) return 'aceitacao';
  if (/desconto|% off|\boff\b|\d+\s*%/.test(t)) return 'desconto';
  if (/aplicativo|\bapp\b/.test(t)) return 'app';
  if (/atendimento|\bsac\b|suporte/.test(t)) return 'atendimento';
  return 'outro';
};
const benefitVigencia = (g: { validFrom?: string; validTo?: string }): { label: string; tone: 'ok' | 'expired' | 'nodate' | 'future' } => {
  const today = new Date().toISOString().slice(0, 10);
  const fmt = (d: string) => { const [y, m, day] = d.slice(0, 10).split('-'); return `${day}/${m}/${y}`; };
  if (g.validFrom && g.validFrom.slice(0, 10) > today) return { label: `a partir de ${fmt(g.validFrom)}`, tone: 'future' };
  if (!g.validTo) return { label: 'sem data de fim', tone: 'nodate' };
  if (g.validTo.slice(0, 10) < today) return { label: `expirou ${fmt(g.validTo)}`, tone: 'expired' };
  return { label: `vigente até ${fmt(g.validTo)}`, tone: 'ok' };
};
const CITATION_LABEL: Record<string, { label: string; cls: string }> = {
  pode: { label: 'pode citar', cls: 'bg-emerald-50 text-emerald-700' },
  cuidado: { label: 'cuidado', cls: 'bg-amber-50 text-amber-800' },
  checar: { label: 'checar', cls: 'bg-slate-100 text-slate-600' },
  nao: { label: 'não citar', cls: 'bg-red-50 text-red-700' },
};
const citationOf = (g: ProductGuardrail) => CITATION_LABEL[g.citationStatus ?? ({ allowed: 'pode', conditional: 'cuidado', blocked: 'nao' }[g.allowedStatus] ?? 'checar')] ?? CITATION_LABEL.checar;

const RecapField = ({ label, value, editing, onChange, onLabel, list, full, rows, hint }: { label: string; value?: string; editing: boolean; onChange: (v: string) => void; onLabel?: React.ReactNode; list?: boolean; full?: boolean; rows?: number; hint?: string }) => <div className={full ? 'sm:col-span-2' : ''}>
  <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide text-slate-400">{label}{onLabel}</div>
  {editing
    ? <><textarea value={value ?? ''} onChange={(event) => onChange(event.target.value)} rows={rows ?? (list ? 3 : 2)} className="mt-0.5 w-full resize-y rounded-lg border border-cyan-300 px-2 py-1 text-[11px] leading-4 text-slate-800 outline-none focus-visible:ring-2 focus-visible:ring-cyan-100"/>{hint && <p className="mt-0.5 text-[9px] leading-3 text-slate-400">{hint}</p>}</>
    : (list && value ? <div className="flex flex-wrap gap-1">{value.split('\n').filter(Boolean).map((item, index) => <span key={index} className="rounded bg-cyan-100 px-1.5 py-0.5 text-[10px] font-semibold text-cyan-800">{item}</span>)}</div> : <div className={`whitespace-pre-wrap text-[11px] leading-4 ${value ? 'text-slate-700' : 'italic text-amber-600'}`}>{value || 'definir'}</div>)}
</div>;

const GUARDRAIL_TYPE_LABEL: Record<string, string> = { benefit: 'Benefício', claim: 'Alegação', eligibility: 'Elegibilidade', legal: 'Legal', visual: 'Visual', tone: 'Tom', deeplink: 'Deeplink', prohibited: 'Proibição' };
const SEVERITY_OPT: [ProductGuardrail['severity'], string][] = [['hard_block', 'Bloqueia publicação'], ['requires_review', 'Exige validação'], ['advisory', 'Orientação']];
const ALLOWED_OPT: [ProductGuardrail['allowedStatus'], string][] = [['allowed', 'Liberado'], ['conditional', 'Condicional'], ['blocked', 'Bloqueado']];
const severityBadge = (s: ProductGuardrail['severity']) => s === 'hard_block' ? { label: 'BLOQUEIA', cls: 'bg-red-100 text-red-700' } : s === 'requires_review' ? { label: 'VALIDAR', cls: 'bg-amber-100 text-amber-800' } : { label: 'ORIENTA', cls: 'bg-slate-100 text-slate-600' };

const GuardrailEditor = ({ guardrail, onSaved, onClose }: { guardrail: ProductGuardrail; onSaved: (guardrail: ProductGuardrail) => void; onClose: () => void }) => {
  const [draft, setDraft] = useState(guardrail);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  useEffect(() => { setDraft(guardrail); }, [guardrail.id, guardrail.version]);
  const set = (patch: Partial<ProductGuardrail>) => setDraft((current) => ({ ...current, ...patch }));
  const inp = 'mt-0.5 w-full rounded border border-cyan-300 px-2 py-1 text-[11px] text-slate-800 outline-none focus-visible:ring-2 focus-visible:ring-cyan-100';
  const save = async () => { setSaving(true); setErr(''); try { onSaved(await saveProductGuardrail(draft)); onClose(); } catch (error) { setErr(error instanceof Error ? error.message : 'Falha ao salvar.'); } finally { setSaving(false); } };
  return <div className="mt-1 rounded-lg border border-cyan-300 bg-cyan-50/40 p-2">
    <div className="grid gap-1.5 sm:grid-cols-2">
      <label className="text-[9px] font-bold uppercase tracking-wide text-slate-400 sm:col-span-2">Título<input value={draft.title} onChange={(event) => set({ title: event.target.value })} className={inp}/></label>
      <label className="text-[9px] font-bold uppercase tracking-wide text-slate-400 sm:col-span-2">Regra — o que fazer / não fazer<textarea rows={2} value={draft.ruleText} onChange={(event) => set({ ruleText: event.target.value })} className={`${inp} resize-y leading-4`}/></label>
      <label className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Severidade<select value={draft.severity} onChange={(event) => set({ severity: event.target.value as ProductGuardrail['severity'] })} className={inp}>{SEVERITY_OPT.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Pode usar<select value={draft.allowedStatus} onChange={(event) => set({ allowedStatus: event.target.value as ProductGuardrail['allowedStatus'] })} className={inp}>{ALLOWED_OPT.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Vigente de<input type="date" value={(draft.validFrom ?? '').slice(0, 10)} onChange={(event) => set({ validFrom: event.target.value || undefined })} className={inp}/></label>
      <label className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Vigente até<input type="date" value={(draft.validTo ?? '').slice(0, 10)} onChange={(event) => set({ validTo: event.target.value || undefined })} className={inp}/></label>
      <label className="text-[9px] font-bold uppercase tracking-wide text-slate-400 sm:col-span-2">Evidência — quem/o quê confirma<textarea rows={2} value={draft.evidence ?? ''} onChange={(event) => set({ evidence: event.target.value || undefined })} className={`${inp} resize-y leading-4`}/></label>
      <label className="text-[9px] font-bold uppercase tracking-wide text-slate-400 sm:col-span-2">URL da fonte<input value={draft.sourceUrl ?? ''} onChange={(event) => set({ sourceUrl: event.target.value || undefined })} className={inp}/></label>
    </div>
    <div className="mt-1.5 flex items-center justify-end gap-2 text-[11px] font-bold">{err && <span className="font-normal text-red-600">{err}</span>}<button type="button" onClick={onClose} className="text-slate-500 hover:underline">descartar</button><button type="button" disabled={saving} onClick={() => void save()} className="text-cyan-700 hover:underline disabled:opacity-40">{saving ? 'salvando…' : 'salvar'}</button></div>
  </div>;
};

const ProductRecap = ({ context, guardrails, productName, onSaved, onSavedGuardrail }: { context: ProductContext | null; guardrails: ProductGuardrail[]; productName: string; onSaved: (context: ProductContext) => void; onSavedGuardrail: (guardrail: ProductGuardrail) => void }) => {
  const [open, setOpen] = useState(() => { try { return localStorage.getItem('gaas-plano-recap-open-v1') !== '0'; } catch { return true; } });
  useEffect(() => { try { localStorage.setItem('gaas-plano-recap-open-v1', open ? '1' : '0'); } catch { /* ignore */ } }, [open]);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<ProductContext | null>(context);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [editingGuardrail, setEditingGuardrail] = useState<string | null>(null);
  useEffect(() => { setDraft(context); setEditing(false); setErr(''); setEditingGuardrail(null); }, [context?.id, context?.version]);

  const benefits = guardrails.filter((item) => item.guardrailType === 'benefit');
  const rules = guardrails.filter((item) => item.guardrailType !== 'benefit');
  const byCat = new Map<string, ProductGuardrail[]>();
  benefits.forEach((benefit) => { const cat = inferBenefitCategory(benefit); byCat.set(cat, [...(byCat.get(cat) ?? []), benefit]); });
  const cats = [...byCat.keys()].sort((a, b) => (BENEFIT_CATEGORY_LABEL[a] ?? a).localeCompare(BENEFIT_CATEGORY_LABEL[b] ?? b));
  const vigentes = benefits.filter((benefit) => ['ok', 'nodate', 'future'].includes(benefitVigencia(benefit).tone)).length;
  const expirados = benefits.filter((benefit) => benefitVigencia(benefit).tone === 'expired').length;
  const blockRules = rules.filter((rule) => rule.severity === 'hard_block').length;
  const set = (patch: Partial<ProductContext>) => setDraft((current) => current ? { ...current, ...patch } : current);
  const save = async () => {
    if (!draft) return;
    setSaving(true); setErr('');
    try { onSaved(await saveProductContext(draft)); setEditing(false); }
    catch (error) { setErr(error instanceof Error ? error.message : 'Falha ao salvar.'); }
    finally { setSaving(false); }
  };
  const guardrailRow = (guardrail: ProductGuardrail, extra?: React.ReactNode) => {
    if (editingGuardrail === guardrail.id) return <GuardrailEditor key={guardrail.id} guardrail={guardrail} onSaved={onSavedGuardrail} onClose={() => setEditingGuardrail(null)}/>;
    const vg = benefitVigencia(guardrail);
    return <div key={guardrail.id} className={`group/gr grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2 border-b border-slate-100 py-1 last:border-b-0 ${vg.tone === 'expired' ? 'opacity-70' : ''}`}>
      <span className="min-w-0 text-[11px] leading-4">
        <span className={`font-semibold ${vg.tone === 'expired' ? 'text-slate-500 line-through' : 'text-slate-800'}`}>{guardrail.title}</span>
        {guardrail.valueExact && <span className="text-slate-500"> — {guardrail.valueExact}</span>}
        {guardrail.ruleText && guardrail.ruleText.trim() && guardrail.ruleText.trim() !== guardrail.title.trim() && <span className="block text-[10px] text-slate-400">{guardrail.ruleText}</span>}
        {guardrail.evidence && <span className="block text-[10px] text-slate-400"><b>Evidência:</b> {guardrail.evidence}</span>}
        {extra}
      </span>
      <span className="flex shrink-0 flex-col items-end gap-0.5 text-[9px] font-bold">
        {guardrail.guardrailType === 'benefit'
          ? <><span className={`rounded px-1.5 py-0.5 ${vg.tone === 'ok' ? 'bg-emerald-50 text-emerald-700' : vg.tone === 'expired' ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-500'}`}>{vg.label}</span><span className={`rounded px-1.5 py-0.5 ${citationOf(guardrail).cls}`}>{citationOf(guardrail).label}</span></>
          : <span className={`rounded px-1.5 py-0.5 ${severityBadge(guardrail.severity).cls}`}>{severityBadge(guardrail.severity).label}</span>}
        {guardrail.sourceUrl && <a href={guardrail.sourceUrl} target="_blank" rel="noreferrer" className="text-cyan-700 hover:underline">fonte ↗</a>}
        <button type="button" onClick={() => setEditingGuardrail(guardrail.id)} className="text-slate-400 opacity-0 transition group-hover/gr:opacity-100 hover:text-cyan-700 focus-visible:opacity-100"><Pencil size={11}/></button>
      </span>
    </div>;
  };

  return <section className="rounded-xl border border-cyan-200 bg-gradient-to-br from-cyan-50/70 to-white">
    <button type="button" onClick={() => setOpen((current) => !current)} aria-expanded={open} className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-cyan-500">
      <span className="flex min-w-0 flex-wrap items-center gap-2">
        {open ? <ChevronDown size={14} className="shrink-0 text-cyan-700"/> : <ChevronRight size={14} className="shrink-0 text-cyan-700"/>}
        <b className="text-sm text-slate-900">Ficha de Produto — {productName}</b>
        {context
          ? <span className="text-[11px] font-semibold text-slate-500">{vigentes} benefícios vigentes{expirados ? ` · ${expirados} expirado${expirados > 1 ? 's' : ''}` : ''}{blockRules ? ` · ${blockRules} regra${blockRules > 1 ? 's' : ''} que bloqueia${blockRules > 1 ? 'm' : ''}` : ''}</span>
          : <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">sem ficha cadastrada</span>}
      </span>
      <span className="shrink-0 text-[10px] font-bold text-slate-400">{open ? 'ocultar' : 'ver'}</span>
    </button>

    {open && <div className="border-t border-cyan-100 p-3">
      {!context && <p className="text-xs text-slate-500">Nenhuma Ficha de Produto cadastrada para <b>{productName}</b>. Cadastre uma ou peça a uma IA autorizada para preencher (via chat, nunca automático) — guia de redação em <code className="rounded bg-slate-100 px-1">Afinz-CRM-Midia-Vault/04-Operacao/Ficha-de-Produto-Guia.md</code>.</p>}
      {context && draft && <>
        <div className="flex items-start justify-between gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Identidade · o suco do produto <span className="ml-1 font-normal text-slate-400">v{context.version}</span></span>
          {editing
            ? <span className="flex shrink-0 items-center gap-2 text-[11px] font-bold">{err && <span className="font-normal text-red-600">{err}</span>}<button type="button" onClick={() => { setDraft(context); setEditing(false); setErr(''); }} className="text-slate-500 hover:underline">descartar</button><button type="button" disabled={saving} onClick={() => void save()} className="text-cyan-700 hover:underline disabled:opacity-40">{saving ? 'salvando…' : 'salvar'}</button></span>
            : <button type="button" onClick={() => setEditing(true)} className="shrink-0 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-bold text-slate-600 hover:border-cyan-300 hover:text-cyan-800"><Pencil size={10} className="mr-1 inline"/>editar</button>}
        </div>
        <div className="mt-1.5 grid gap-2 sm:grid-cols-2">
          <RecapField label="Proposta de valor" value={draft.valueProposition} editing={editing} onChange={(value) => set({ valueProposition: value })} full rows={2} hint="Uma frase: o benefício central + a âncora mental do cliente."/>
          <RecapField label="Diferenciais (um por linha)" value={draft.differentiators.join('\n')} editing={editing} list onChange={(value) => set({ differentiators: value.split('\n').map((item) => item.trim()).filter(Boolean) })}/>
          <RecapField label="Tom de voz" value={draft.toneOfVoice} editing={editing} onChange={(value) => set({ toneOfVoice: value })} rows={3} hint="Como falar e como não falar. Palavras a usar/evitar."/>
          <RecapField label="Público elegível" value={draft.eligibleAudience} editing={editing} onChange={(value) => set({ eligibleAudience: value })} full rows={3} hint="Quem é, o que conhece, o que NÃO conhece, e o tamanho do público endereçável (ex.: 800K+ CPFs; não confundir com a base do Clube)."/>
          <RecapField label="Contexto de marca" value={draft.brandContext} editing={editing} onChange={(value) => set({ brandContext: value })} full rows={5} hint="História, posicionamento, o que a marca representa, relação com o parceiro/emissor, o que a marca NÃO é. Vários parágrafos — não uma frase."/>
          <RecapField label="Fonte / proveniência" value={draft.provenance} editing={editing} onChange={(value) => set({ provenance: value })}/>
        </div>
        {context.sourceUrl && !editing && <a href={context.sourceUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block text-[10px] font-bold text-cyan-700 hover:underline">fonte ↗</a>}
        <p className="mt-1.5 text-[10px] leading-4 text-slate-400">Ficha, benefícios e regras também podem ser preenchidos por uma IA autorizada a ler o Supabase — via chat, nunca automático. A IA segue o guia de redação da Ficha de Produto no vault. Toda alteração fica versionada.</p>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Benefícios · {benefits.length}</span>
          {benefits.some((benefit) => !benefit.category) && <span className="text-[9px] text-slate-400">categoria inferida do texto — estrutura completa após o sync da planilha</span>}
        </div>
        {!benefits.length && <p className="mt-1 text-[11px] text-slate-500">Nenhum benefício estruturado ainda. Rode o sync do <code className="rounded bg-slate-100 px-1">Dicionario_Produtos_Afinz_v3.xlsx</code> ou peça à IA.</p>}
        {cats.map((cat) => <div key={cat} className="mt-1.5">
          <div className="text-[10px] font-bold text-cyan-800">{BENEFIT_CATEGORY_LABEL[cat] ?? cat}</div>
          {byCat.get(cat)!.map((benefit) => guardrailRow(benefit, benefit.appliesTo && Object.values(benefit.appliesTo).some((value) => value?.length) ? <span className="block text-[10px] text-cyan-700">escopo — {Object.entries(benefit.appliesTo).filter(([, value]) => value?.length).map(([key, value]) => `${key}: ${value!.join(', ')}`).join(' · ')}</span> : null))}
        </div>)}

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-slate-400"><ShieldAlert size={11} className="text-amber-700"/>Regras do produto · {rules.length}</span>
          {!!rules.length && <span className="text-[9px] font-semibold text-slate-500"><span className="text-red-700">{rules.filter((rule) => rule.severity === 'hard_block').length} bloqueiam</span> · <span className="text-amber-700">{rules.filter((rule) => rule.severity === 'requires_review').length} validar</span> · {rules.filter((rule) => rule.severity === 'advisory').length} orientam</span>}
        </div>
        {!rules.length && <p className="mt-1 text-[11px] text-slate-500">Nenhuma regra cadastrada para este produto.</p>}
        {['prohibited', 'claim', 'eligibility', 'legal', 'deeplink', 'visual', 'tone'].filter((type) => rules.some((rule) => rule.guardrailType === type)).map((type) => <div key={type} className="mt-1.5">
          <div className="text-[10px] font-bold text-slate-500">{GUARDRAIL_TYPE_LABEL[type] ?? type}</div>
          {rules.filter((rule) => rule.guardrailType === type).map((rule) => guardrailRow(rule))}
        </div>)}
        <p className="mt-2 text-[10px] text-slate-400">Essas regras valem para todo o produto. A aba “Regras aplicáveis” de cada e-mail mostra o mesmo conjunto filtrado por severidade.</p>
      </>}
    </div>}
  </section>;
};

const StrategyWorkspace = ({ strategies, contexts, guardrails, rows, syncState, onRefresh, onSaved, onSavedContext, onSavedGuardrail }: { strategies: EmailStrategy[]; contexts: ProductContext[]; guardrails: ProductGuardrail[]; rows: WorkspaceBriefing[]; syncState: string; onRefresh: () => void; onSaved: (strategy: EmailStrategy) => void; onSavedContext: (context: ProductContext) => void; onSavedGuardrail: (guardrail: ProductGuardrail) => void }) => {
  const partners = useMemo(() => [...new Set(strategies.map((item) => item.partner).filter(Boolean))].sort(naturalLabelSort), [strategies]);
  const [selectedId, setSelectedId] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [query, setQuery] = useState('');
  const [weekFilter, setWeekFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [onlyPending, setOnlyPending] = useState(false);
  const [viewMode, setViewMode] = useState<'overview' | 'detail'>('detail');
  const [detailTab, setDetailTab] = useState<'plan' | 'comparison' | 'rules'>('plan');
  const [density, setDensity] = useState<'compact' | 'cozy'>(() => { try { return localStorage.getItem('gaas-plano-density-v1') === 'cozy' ? 'cozy' : 'compact'; } catch { return 'compact'; } });
  useEffect(() => { try { localStorage.setItem('gaas-plano-density-v1', density); } catch { /* ignore */ } }, [density]);
  const [editAll, setEditAll] = useState(false);
  const [planStep, setPlanStep] = useState<0 | 1 | 2>(0);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState<'product' | 'all' | ''>('');
  const [message, setMessage] = useState('');
  const [exportMessage, setExportMessage] = useState('');

  const activeProduct = selectedProduct && partners.includes(selectedProduct) ? selectedProduct : partners[0] || '';
  const productStrategies = useMemo(() => activeProduct ? strategies.filter((item) => item.partner === activeProduct) : strategies, [strategies, activeProduct]);
  const productContext = useMemo(() => {
    if (!activeProduct) return null;
    const target = activeProduct.toLowerCase();
    return contexts.find((context) => [context.partner, context.product].filter(Boolean).some((name) => { const value = (name as string).toLowerCase(); return value === target || value.includes(target) || target.includes(value); })) ?? null;
  }, [contexts, activeProduct]);
  const productRecapGuardrails = useMemo(() => productContext ? guardrails.filter((item) => item.productContextId === productContext.id) : [], [guardrails, productContext]);
  const weeks = useMemo(() => [...new Set(productStrategies.map((item) => item.weekKey).filter(Boolean) as string[])].sort(naturalLabelSort), [productStrategies]);
  const briefingByGroup = useMemo(() => { const map = new Map<string, WorkspaceBriefing>(); rows.forEach((row) => { if (row.__meta.status === 'archived' || map.has(row.__meta.campaignGroupId)) return; map.set(row.__meta.campaignGroupId, row); }); return map; }, [rows]);
  const adherenceOf = (item: EmailStrategy): 'ok' | 'drift' | 'none' => {
    const subject = briefingByGroup.get(item.campaignGroupId)?.ASSUNTO?.trim();
    if (!subject) return 'none';
    if (!item.keyMessage?.trim()) return 'drift';
    const written = planTokens(subject);
    for (const word of planTokens(item.keyMessage)) if (written.has(word)) return 'ok';
    return 'drift';
  };
  const filtered = useMemo(() => productStrategies.filter((item) => {
    const readiness = strategyReadiness(item);
    const haystack = [item.weekKey, item.sequence, item.subject, item.roleInRuler, item.emailObjective, item.keyMessage, item.valueProposition, item.primaryBenefit].join(' ').toLocaleLowerCase('pt-BR');
    return (!query.trim() || haystack.includes(query.trim().toLocaleLowerCase('pt-BR')))
      && (!weekFilter || item.weekKey === weekFilter)
      && (!statusFilter || readiness.label === statusFilter)
      && (!onlyPending || readiness.tone !== 'success' || countConfiguredStrategyFields(item) < STRATEGY_FIELD_COUNT);
  }), [productStrategies, query, weekFilter, statusFilter, onlyPending]);
  const selected = filtered.find((item) => item.id === selectedId) ?? filtered[0] ?? null;
  const [draft, setDraft] = useState<EmailStrategy | null>(selected);
  useEffect(() => { setDraft(selected); setEditingField(null); setEditAll(false); setDirty(false); }, [selected?.id, selected?.version]);
  const update = (field: keyof EmailStrategy, value: string | string[]) => { setDirty(true); setDraft((current) => current ? { ...current, [field]: value } : current); };
  const activeFilters = Number(Boolean(query.trim())) + Number(Boolean(weekFilter)) + Number(Boolean(statusFilter)) + Number(onlyPending);
  const clearFilters = () => { setQuery(''); setWeekFilter(''); setStatusFilter(''); setOnlyPending(false); };
  const pendingCount = productStrategies.filter((item) => strategyReadiness(item).tone !== 'success' || countConfiguredStrategyFields(item) < STRATEGY_FIELD_COUNT).length;
  const blockedCount = productStrategies.filter((item) => strategyReadiness(item).tone === 'danger').length;
  const completeCount = productStrategies.filter((item) => countConfiguredStrategyFields(item) === STRATEGY_FIELD_COUNT).length;
  const rulerLabels = [...new Set(productStrategies.map((item) => segmentDisplayLabel(item.segment)))].sort(naturalLabelSort);
  const save = async () => { if (!draft) return; setSaving(true); setMessage(''); try { const saved = await saveEmailStrategy(draft); onSaved(saved); setDraft(saved); setDirty(false); setEditingField(null); setMessage('Plano salvo com nova versão auditável.'); } catch (error) { setMessage(error instanceof Error ? error.message : 'Falha ao salvar.'); } finally { setSaving(false); } };
  const openDetail = (id: string) => { setSelectedId(id); setViewMode('detail'); setDetailTab('plan'); };
  const runExport = async (scope: 'product' | 'all', details?: HTMLDetailsElement | null) => {
    const items = scope === 'product' ? productStrategies : strategies;
    if (!items.length) { setExportMessage('Não há planos disponíveis para exportar.'); return; }
    setExporting(scope); setExportMessage(''); details?.removeAttribute('open');
    try { const filename = await exportStrategyPlanXlsx({ strategies: items, contexts, guardrails }, scope === 'product' ? activeProduct : 'todos-produtos'); setExportMessage(`${filename} gerado com ${items.length} ${items.length === 1 ? 'e-mail' : 'e-mails'}.`); }
    catch (error) { setExportMessage(error instanceof Error ? error.message : 'Não foi possível gerar a planilha.'); }
    finally { setExporting(''); }
  };
  const scrollBox = 'max-h-[calc(var(--screen-h,900px)_-_240px)] min-h-[260px] overflow-auto';

  return <main className="mt-3 space-y-2">
    <section className="rounded-xl border border-slate-200 bg-white px-3 py-2.5" aria-label="Controles do plano de comunicação">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-base font-bold text-slate-900">Plano de Comunicação</h2>
          {partners.length > 0 && <div className="flex gap-0.5 rounded-lg bg-slate-100 p-0.5">{partners.map((partner) => { const items = strategies.filter((item) => item.partner === partner); const active = partner === activeProduct; return <button type="button" key={partner} onClick={() => { setSelectedProduct(partner); setSelectedId(items[0]?.id ?? ''); }} className={`rounded-md px-2.5 py-1 text-xs font-bold outline-none transition focus-visible:ring-2 focus-visible:ring-cyan-500 ${active ? 'bg-white text-cyan-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>{partner} <span className="font-semibold opacity-60">{items.length}</span></button>; })}</div>}
          <span className="hidden text-[11px] text-slate-500 lg:inline">{rulerLabels.join(' + ') || 'sem régua'} · {syncState}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button type="button" onClick={() => setDensity((current) => current === 'compact' ? 'cozy' : 'compact')} title={density === 'compact' ? 'Ver em modo confortável' : 'Ver em modo compacto'} className="rounded-lg border border-slate-200 px-2 py-1 text-[10px] font-bold text-slate-600 outline-none hover:border-cyan-300 hover:text-cyan-800 focus-visible:ring-2 focus-visible:ring-cyan-500">{density === 'compact' ? 'Compacto' : 'Confortável'}</button>
          <details className="group relative"><summary className="inline-flex cursor-pointer list-none items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-cyan-900 hover:border-cyan-300 focus-visible:ring-2 focus-visible:ring-cyan-400"><Download size={13}/>{exporting ? 'Gerando…' : 'Exportar'}<ChevronDown size={12} className="transition-transform group-open:rotate-180"/></summary><div className="absolute right-0 top-9 z-30 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"><div className="border-b border-slate-100 px-4 py-3"><b className="text-xs text-slate-900">Baixar plano editorial V2</b><p className="mt-1 text-[11px] leading-4 text-slate-500">Visão macro do produto e plano dos e-mails em abas amigáveis. IDs e rastreabilidade ficam em uma aba técnica oculta.</p></div><button type="button" disabled={Boolean(exporting) || !activeProduct} onClick={(event) => void runExport('product', event.currentTarget.closest('details'))} className="block w-full px-4 py-3 text-left hover:bg-cyan-50 disabled:opacity-40"><b className="block text-xs text-slate-800">Produto: {activeProduct || 'nenhum'}</b><span className="mt-0.5 block text-[11px] text-slate-500">2 abas visíveis · {productStrategies.length} e-mails</span></button><button type="button" disabled={Boolean(exporting) || !strategies.length} onClick={(event) => void runExport('all', event.currentTarget.closest('details'))} className="block w-full border-t border-slate-100 px-4 py-3 text-left hover:bg-cyan-50 disabled:opacity-40"><b className="block text-xs text-slate-800">Todos os produtos</b><span className="mt-0.5 block text-[11px] text-slate-500">{partners.length * 2} abas · {partners.length} {partners.length === 1 ? 'produto' : 'produtos'} · {strategies.length} e-mails</span></button><p className="border-t border-slate-100 bg-slate-50 px-4 py-2 text-[10px] leading-4 text-slate-500">A atualização em massa permanece exclusiva para LLM/API; não há importação manual de XLSX.</p></div></details>
          <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5"><button type="button" onClick={() => setViewMode('detail')} className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-bold ${viewMode === 'detail' ? 'bg-white text-cyan-800 shadow-sm' : 'text-slate-500'}`}><LayoutPanelLeft size={13}/>Editar</button><button type="button" onClick={() => setViewMode('overview')} className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-bold ${viewMode === 'overview' ? 'bg-white text-cyan-800 shadow-sm' : 'text-slate-500'}`}><TableProperties size={13}/>Visão geral</button></div>
          <button type="button" onClick={onRefresh} className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:border-cyan-300" aria-label="Atualizar plano"><RefreshCw size={14}/></button>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <label className="flex h-8 min-w-[170px] flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 focus-within:border-cyan-400 focus-within:bg-white sm:max-w-xs"><Search size={14} className="text-slate-400"/><span className="sr-only">Buscar no plano</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar e-mail, objetivo ou benefício…" className="min-w-0 flex-1 bg-transparent text-xs outline-none"/></label>
        <FilterSelect label="Semana" value={weekFilter} onChange={setWeekFilter} options={weeks}/>
        <FilterSelect label="Status" value={statusFilter} onChange={setStatusFilter} options={['Bloqueado', 'Enriquecer estratégia', 'Em revisão', 'Pronto para teste', 'Certificado']}/>
        <label className={`flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 text-[11px] font-bold ${onlyPending ? 'border-amber-300 bg-amber-50 text-amber-900' : 'border-slate-200 text-slate-600'}`}><input type="checkbox" checked={onlyPending} onChange={(event) => setOnlyPending(event.target.checked)} className="accent-amber-600"/>Só pendências</label>
        <span className="mx-0.5 hidden h-4 w-px bg-slate-200 sm:block"/>
        <span className="text-[11px] font-semibold text-slate-500"><b className="text-slate-800">{productStrategies.length}</b> e-mails · <b className={pendingCount ? 'text-amber-700' : ''}>{pendingCount}</b> pendentes · <b className={blockedCount ? 'text-red-700' : ''}>{blockedCount}</b> bloqueados · <b className={productStrategies.length > 0 && completeCount === productStrategies.length ? 'text-emerald-700' : ''}>{completeCount}</b> completos</span>
        <span className="ml-auto text-[11px] text-slate-500">Exibindo <b className="text-slate-800">{filtered.length}</b>{activeFilters > 0 && <button type="button" onClick={clearFilters} className="ml-1.5 font-bold text-cyan-700 hover:underline">Limpar {activeFilters}</button>}</span>
      </div>
      {exportMessage && <div role="status" className="mt-2 rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-xs text-cyan-900">{exportMessage}</div>}
    </section>

    <ProductRecap context={productContext} guardrails={productRecapGuardrails} productName={productContext?.product || activeProduct || 'produto'} onSaved={onSavedContext} onSavedGuardrail={onSavedGuardrail}/>

    {viewMode === 'overview' ? <StrategyOverview strategies={filtered} onOpen={openDetail}/> : <div className="grid gap-2 xl:grid-cols-[minmax(260px,32fr)_minmax(0,68fr)]">
      <StrategyEmailList strategies={filtered} selectedId={selected?.id ?? ''} density={density} scrollBox={scrollBox} adherenceOf={adherenceOf} onSelect={setSelectedId} onClear={clearFilters}/>
      <section className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white">
        {draft ? <>
          <header className="border-b border-slate-200 px-3 py-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0 text-xs text-slate-600"><b className="text-slate-900">{draft.weekKey || 'Semana ?'} · {draft.sequence || 'E-mail'}</b><span className="ml-1.5 text-slate-400">v{draft.version} · {draft.updatedByType === 'llm' ? `LLM${draft.llmModel ? ` (${draft.llmModel})` : ''}` : draft.updatedByType === 'human' ? 'edição humana' : 'sistema'}{draft.updatedAt ? ` · ${new Date(draft.updatedAt).toLocaleDateString('pt-BR')}` : ''}</span></div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">{countConfiguredStrategyFields(draft)}/{STRATEGY_FIELD_COUNT} diretrizes</span>
                <button type="button" onClick={() => void save()} disabled={saving || !dirty} className="rounded-lg bg-[#07595b] px-3 py-1.5 text-xs font-bold text-white outline-none transition hover:bg-[#064c4e] focus-visible:ring-2 focus-visible:ring-cyan-500 disabled:opacity-40"><Save className="mr-1 inline" size={13}/>{saving ? 'Salvando…' : dirty ? 'Salvar versão' : 'Salvo'}</button>
              </div>
            </div>
            <div className="mt-1.5 flex items-center gap-1" role="tablist" aria-label="Detalhes do e-mail">{([['plan', 'Plano'], ['comparison', 'Planejado × executado'], ['rules', 'Regras aplicáveis']] as const).map(([id, label]) => <button type="button" role="tab" aria-selected={detailTab === id} key={id} onClick={() => setDetailTab(id)} className={`rounded-md px-2.5 py-1 text-[11px] font-bold ${detailTab === id ? 'bg-cyan-50 text-cyan-900' : 'text-slate-500 hover:bg-slate-50'}`}>{label}</button>)}</div>
          </header>
          <div className={scrollBox}>
            {message && <div role="status" className="m-3 mb-0 rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-xs text-cyan-900">{message}</div>}
            {detailTab === 'plan' && (editAll
              ? <PlanAccordion draft={draft} update={update} step={planStep} setStep={setPlanStep} onClose={() => setEditAll(false)}/>
              : <div className="p-1.5">
                  <div className="flex items-center justify-between px-1.5 pb-1"><span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Ficha do plano · clique numa linha para editar</span><button type="button" onClick={() => setEditAll(true)} className="rounded-md border border-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600 hover:border-cyan-300 hover:text-cyan-800"><Pencil size={11} className="mr-1 inline"/>Editar tudo</button></div>
                  {PLAN_FIELDS.map((field) => <FichaRow key={field.key} field={field} draft={draft} density={density} editing={editingField === field.key} onEdit={() => setEditingField(field.key)} onDone={() => setEditingField(null)} update={update}/>)}
                </div>)}
            {detailTab === 'comparison' && <PlannedExecutedComparison strategy={draft} briefing={briefingByGroup.get(draft.campaignGroupId)}/>}
            {detailTab === 'rules' && <div className="space-y-2 p-3"><p className="text-[10px] text-slate-400">A <b>Ficha de Produto</b> (identidade, benefícios e regras editáveis) fica no topo. Aqui é a mesma lista de regras filtrada e em modo leitura.</p><GuardrailList contexts={contexts} guardrails={guardrails} partner={draft.partner}/></div>}
          </div>
        </> : <div className="p-6"><EmptyManagementState/></div>}
      </section>
    </div>}
  </main>;
};

const StrategyEmailList = ({ strategies, selectedId, density, scrollBox, adherenceOf, onSelect, onClear }: { strategies: EmailStrategy[]; selectedId: string; density: 'compact' | 'cozy'; scrollBox: string; adherenceOf: (item: EmailStrategy) => 'ok' | 'drift' | 'none'; onSelect: (id: string) => void; onClear: () => void }) => {
  const byWeek = new Map<string, EmailStrategy[]>();
  strategies.forEach((item) => { const key = item.weekKey || 'Sem semana'; byWeek.set(key, [...(byWeek.get(key) ?? []), item]); });
  const weekKeys = [...byWeek.keys()].sort(naturalLabelSort);
  const rowPad = density === 'compact' ? 'py-1' : 'py-1.5';
  return <aside className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white">
    <div className="shrink-0 border-b border-slate-200 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">E-mails da régua · {strategies.length}</div>
    <div className={scrollBox}>
      {weekKeys.map((weekKey) => <div key={weekKey}>
        <div className="sticky top-0 z-10 bg-slate-50 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">{weekKey}</div>
        {byWeek.get(weekKey)!.map((item) => {
          const readiness = strategyReadiness(item);
          const configured = countConfiguredStrategyFields(item);
          const active = item.id === selectedId;
          const adherence = adherenceOf(item);
          return <button type="button" key={item.id} onClick={() => onSelect(item.id)} aria-selected={active} className={`grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-b border-slate-100 px-3 text-left outline-none last:border-b-0 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-500 ${rowPad} ${active ? 'bg-cyan-50' : 'hover:bg-slate-50'}`}>
            <span className="flex min-w-0 items-center gap-1.5">
              <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${readiness.tone === 'success' ? 'bg-emerald-500' : readiness.tone === 'danger' ? 'bg-red-500' : 'bg-amber-500'}`} title={readiness.label}/>
              <span className="shrink-0 text-xs font-bold text-slate-900">{item.sequence || 'E-mail'}</span>
              <span className="min-w-0 truncate text-[11px] text-slate-500">{item.roleInRuler || 'papel a definir'}</span>
            </span>
            <span className="flex shrink-0 items-center gap-1.5">
              <span title={adherence === 'ok' ? 'Assunto do briefing segue a direção do plano' : adherence === 'drift' ? 'Assunto do briefing diverge da mensagem-chave' : 'Briefing ainda sem assunto'} className={`h-1.5 w-1.5 rounded-full ${adherence === 'ok' ? 'bg-emerald-400' : adherence === 'drift' ? 'bg-amber-400' : 'bg-slate-200'}`}/>
              <span className="h-1 w-9 overflow-hidden rounded-full bg-slate-200"><span className="block h-full rounded-full bg-cyan-500" style={{ width: `${Math.round((configured / STRATEGY_FIELD_COUNT) * 100)}%` }}/></span>
              <span className="w-8 text-right text-[10px] font-bold text-slate-500">{configured}/{STRATEGY_FIELD_COUNT}</span>
            </span>
          </button>;
        })}
      </div>)}
      {!strategies.length && <div className="p-8 text-center text-xs text-slate-500">Nenhum e-mail nos filtros.<button type="button" onClick={onClear} className="mt-2 block w-full font-bold text-cyan-700">Limpar filtros</button></div>}
    </div>
  </aside>;
};

const FieldHelp = ({ label, help, result }: { label: string; help: string; result: string }) => <details className="group relative inline-block align-middle"><summary className="list-none rounded-full text-slate-400 outline-none hover:text-cyan-700 focus-visible:ring-2 focus-visible:ring-cyan-400" aria-label={`Ajuda sobre ${label}`}><Info size={13}/></summary><div className="absolute left-0 top-5 z-40 w-72 rounded-xl border border-slate-200 bg-white p-3 text-left font-normal shadow-xl"><b className="text-xs text-slate-900">O que preencher</b><p className="mt-1 text-xs leading-5 text-slate-600">{help}</p><b className="mt-2 block text-xs text-cyan-900">Resultado esperado</b><p className="mt-1 text-xs leading-5 text-slate-600">{result}</p></div></details>;

const FichaRow = ({ field, draft, density, editing, onEdit, onDone, update }: { field: typeof PLAN_FIELDS[number]; draft: EmailStrategy; density: 'compact' | 'cozy'; editing: boolean; onEdit: () => void; onDone: () => void; update: (field: keyof EmailStrategy, value: string | string[]) => void }) => {
  const raw = draft[field.key];
  const listValue = Array.isArray(raw) ? raw : [];
  const textValue = typeof raw === 'string' ? raw : '';
  const display = field.list ? listValue.filter(Boolean).join(' · ') : textValue;
  const provenance = draft.fieldProvenance?.[field.key];
  if (editing) return <div className="border-b border-slate-100 bg-cyan-50/40 px-3 py-2">
    <div className="mb-1 flex items-center justify-between gap-2"><span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700">{field.label}<FieldHelp label={field.label} help={field.help} result={field.result}/></span><button type="button" onClick={onDone} className="text-[11px] font-bold text-cyan-700 hover:underline">concluir</button></div>
    <textarea autoFocus value={field.list ? listValue.join('\n') : textValue} onChange={(event) => update(field.key, field.list ? event.target.value.split(/\n|;/).map((item) => item.trim()).filter(Boolean) : event.target.value)} rows={field.list ? 4 : 2} placeholder="Clique no (i) para ver como preencher." className="w-full resize-y rounded-lg border border-cyan-300 px-2.5 py-1.5 text-xs leading-5 text-slate-800 outline-none placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-cyan-100"/>
  </div>;
  return <button type="button" onClick={onEdit} className={`grid w-full grid-cols-[minmax(92px,132px)_minmax(0,1fr)] items-start gap-2 border-b border-slate-100 px-3 text-left outline-none hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-500 ${density === 'compact' ? 'py-1' : 'py-1.5'}`}>
    <span className="flex flex-wrap items-center gap-1 pt-0.5 text-[11px] font-bold text-slate-500">{field.label}{provenance && <span className="rounded bg-slate-100 px-1 text-[8px] font-bold text-slate-400">{provenance}</span>}</span>
    <span className={`${density === 'compact' ? 'line-clamp-1' : 'line-clamp-2'} text-xs ${display ? 'text-slate-800' : 'italic text-amber-600'}`} title={display || 'definir'}>{display || 'definir'}</span>
  </button>;
};

const PlanAccordion = ({ draft, update, step, setStep, onClose }: { draft: EmailStrategy; update: (field: keyof EmailStrategy, value: string | string[]) => void; step: 0 | 1 | 2; setStep: (step: 0 | 1 | 2) => void; onClose: () => void }) => {
  const fields = PLAN_FIELDS.filter((item) => item.step === step);
  return <div className="p-3">
    <div className="mb-2 flex items-center justify-between gap-2">
      <div className="flex flex-wrap gap-1">{PLAN_STEP_TITLES.map((title, index) => { const done = PLAN_FIELDS.filter((f) => f.step === index).every((f) => { const value = draft[f.key]; return Array.isArray(value) ? value.some(Boolean) : Boolean((value as string)?.trim()); }); return <button type="button" key={title} onClick={() => setStep(index as 0 | 1 | 2)} className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-bold ${step === index ? 'bg-cyan-600 text-white' : done ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{index + 1}. {title}</button>; })}</div>
      <button type="button" onClick={onClose} className="shrink-0 rounded-md border border-slate-200 px-2 py-1 text-[10px] font-bold text-slate-600 hover:border-cyan-300">Ver ficha</button>
    </div>
    <div className="grid gap-2 md:grid-cols-2">{fields.map((field) => { const raw = draft[field.key]; return <SemanticField key={field.key} fieldName={field.key} label={field.label} help={field.help} result={field.result} provenance={draft.fieldProvenance?.[field.key]} value={field.list ? (Array.isArray(raw) ? raw.join('\n') : '') : (typeof raw === 'string' ? raw : '')} onChange={(value) => update(field.key, field.list ? value.split(/\n|;/).map((item) => item.trim()).filter(Boolean) : value)}/>; })}</div>
    <div className="mt-2 flex justify-between">
      <button type="button" disabled={step === 0} onClick={() => setStep((step - 1) as 0 | 1 | 2)} className="rounded-md px-2 py-1 text-[11px] font-bold text-slate-500 disabled:opacity-30">← Anterior</button>
      <button type="button" disabled={step === 2} onClick={() => setStep((step + 1) as 0 | 1 | 2)} className="rounded-md px-2 py-1 text-[11px] font-bold text-cyan-700 disabled:opacity-30">Próximo →</button>
    </div>
  </div>;
};

const PlannedExecutedComparison = ({ strategy, briefing }: { strategy: EmailStrategy; briefing?: WorkspaceBriefing }) => {
  const b = briefing;
  const copyText = b ? stripHtmlToText([b.TITULO_COPY_1_AZUL, b.COPY_1_PRETO, b.TITULO_COPY_2, b.COPY_2_PRETO].filter(Boolean).join('  ·  ')).slice(0, 320) : '';
  const ctaText = b ? [b.TITULO_CTA_1 && `“${b.TITULO_CTA_1}” → ${b.LINK_CTA_1 || 'sem link'}`, b.TITULO_CTA_2 && `“${b.TITULO_CTA_2}” → ${b.LINK_CTA_2 || 'sem link'}`].filter(Boolean).join('   ·   ') : '';
  const pairs = [
    { label: 'Direção da mensagem', planned: strategy.keyMessage, executed: b?.ASSUNTO || strategy.subject, executedLabel: 'Assunto no briefing' },
    { label: 'Objetivo e abertura', planned: strategy.emailObjective, executed: b?.PRE_CABECALHO || strategy.preheader, executedLabel: 'Pré-cabeçalho no briefing' },
    { label: 'Benefício prioritário', planned: strategy.primaryBenefit, executed: copyText, executedLabel: 'Copy principal do briefing' },
    { label: 'Estratégia de CTAs', planned: strategy.ctaStrategy, executed: ctaText, executedLabel: 'CTAs e links do briefing' },
  ];
  return <section className="p-3">
    <div className="rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2 text-[11px] leading-4 text-cyan-950"><b>Leitura comparativa.</b> {b ? 'Assunto, pré-cabeçalho, copy e CTAs vêm da versão atual do briefing deste e-mail.' : 'Nenhum briefing vinculado ainda — à direita aparece só o que o próprio plano guardou.'}</div>
    <div className="mt-2 space-y-2">{pairs.map((pair) => { const hasExecuted = Boolean(pair.executed?.trim()); return <article key={pair.label} className="overflow-hidden rounded-lg border border-slate-200"><header className="flex items-center justify-between gap-2 bg-slate-50 px-3 py-1.5"><b className="text-[11px] text-slate-900">{pair.label}</b><span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${hasExecuted ? 'bg-cyan-100 text-cyan-800' : 'bg-amber-100 text-amber-800'}`}>{hasExecuted ? 'disponível' : 'briefing vazio'}</span></header><div className="grid gap-px bg-slate-200 sm:grid-cols-2"><ComparisonValue label="Planejado" value={pair.planned}/><ComparisonValue label={pair.executedLabel} value={pair.executed}/></div></article>; })}</div>
  </section>;
};

const ComparisonValue = ({ label, value }: { label: string; value?: string }) => <div className="min-h-16 bg-white px-3 py-2"><span className="text-[9px] font-bold uppercase tracking-wide text-slate-400">{label}</span><p className={`mt-0.5 text-xs leading-5 ${value ? 'text-slate-700' : 'italic text-slate-400'}`}>{value || 'sem conteúdo nesta camada'}</p></div>;

const FilterSelect = ({ label, value, onChange, options, labels = {} }: { label: string; value: string; onChange: (value: string) => void; options: string[]; labels?: Record<string, string> }) => <label><span className="sr-only">{label}</span><select aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-[11px] font-semibold text-slate-700 outline-none focus:border-cyan-400 focus-visible:ring-2 focus-visible:ring-cyan-100"><option value="">{label}: todos</option>{options.map((option) => <option key={option} value={option}>{labels[option] ?? option}</option>)}</select></label>;
const StrategyOverview = ({ strategies, onOpen }: { strategies: EmailStrategy[]; onOpen: (id: string) => void }) => <section className="overflow-hidden rounded-xl border border-slate-200 bg-white"><div className="overflow-x-auto"><table className="min-w-[1000px] w-full text-left"><thead className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500"><tr><th className="px-3 py-2">E-mail</th><th className="px-3 py-2">Papel na régua</th><th className="px-3 py-2">Benefício principal</th><th className="px-3 py-2">Proposta de valor</th><th className="px-3 py-2">Completude</th><th className="px-3 py-2">Status</th><th className="px-3 py-2"><span className="sr-only">Ação</span></th></tr></thead><tbody className="divide-y divide-slate-100">{strategies.map((item) => { const readiness = strategyReadiness(item); const configured = countConfiguredStrategyFields(item); return <tr key={item.id} className="align-top hover:bg-cyan-50/40"><td className="px-3 py-1.5"><b className="block text-xs text-slate-900">{item.weekKey} · {item.sequence}</b><span className="text-[10px] text-slate-500">{item.partner} · {segmentDisplayLabel(item.segment)}</span></td><td className="max-w-56 px-3 py-1.5 text-xs text-slate-700"><span className="line-clamp-2">{item.roleInRuler || <span className="text-amber-700">Preencher</span>}</span></td><td className="max-w-56 px-3 py-1.5 text-xs text-slate-700"><span className="line-clamp-2">{item.primaryBenefit || <span className="text-amber-700">Preencher</span>}</span></td><td className="max-w-64 px-3 py-1.5 text-xs text-slate-700"><span className="line-clamp-2">{item.valueProposition || <span className="text-amber-700">Preencher</span>}</span></td><td className="px-3 py-1.5"><span className="text-xs font-bold text-slate-800">{configured}/{STRATEGY_FIELD_COUNT}</span><span className="mt-0.5 block h-1 w-20 overflow-hidden rounded-full bg-slate-100"><span className="block h-full rounded-full bg-cyan-600" style={{ width: `${Math.round((configured / STRATEGY_FIELD_COUNT) * 100)}%` }}/></span></td><td className="px-3 py-1.5"><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${readiness.tone === 'danger' ? 'bg-red-50 text-red-700' : readiness.tone === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'}`}>{readiness.label}</span></td><td className="px-3 py-1.5 text-right"><button type="button" onClick={() => onOpen(item.id)} className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-bold text-cyan-800 hover:border-cyan-300">Editar</button></td></tr>; })}</tbody></table>{!strategies.length && <div className="p-10 text-center text-sm text-slate-500">Nenhum e-mail corresponde aos filtros selecionados.</div>}</div></section>;
const SemanticField = ({ fieldName, label, help, result, value, provenance, onChange }: { fieldName: string; label: string; help: string; result: string; value: string; provenance?: string; onChange: (value: string) => void }) => <label className="relative block text-xs font-bold text-slate-700"><span className="flex items-center gap-1.5">{label}<FieldHelp label={label} help={help} result={result}/>{provenance && <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-semibold text-slate-500">{provenance}</span>}</span><textarea name={fieldName} value={value} onChange={(event) => onChange(event.target.value)} rows={2} className="mt-1 w-full resize-y rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm font-normal leading-5 text-slate-800 outline-none placeholder:text-slate-400 focus:border-cyan-400 focus-visible:ring-2 focus-visible:ring-cyan-100" placeholder="Clique no (i) para ver como preencher."/></label>;
const GuardrailList = ({ contexts, guardrails, partner }: { contexts: ProductContext[]; guardrails: ProductGuardrail[]; partner: string }) => {
  const [severity, setSeverity] = useState<ProductGuardrail['severity'] | ''>('');
  const ids = new Set(contexts.filter((item) => !item.partner || item.partner === partner).map((item) => item.id));
  const applicable = guardrails.filter((item) => ids.has(item.productContextId));
  const items = severity ? applicable.filter((item) => item.severity === severity) : applicable;
  const counts: Record<ProductGuardrail['severity'], number> = { hard_block: applicable.filter((item) => item.severity === 'hard_block').length, requires_review: applicable.filter((item) => item.severity === 'requires_review').length, advisory: applicable.filter((item) => item.severity === 'advisory').length };
  return <section className="rounded-lg border border-slate-200 p-2.5">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-1.5"><ShieldAlert size={14} className="text-amber-700"/><h3 className="text-xs font-bold text-slate-900">Regras aplicáveis</h3></div>
      <div className="flex gap-1">{([['', 'todas', 0], ['hard_block', 'bloqueiam', counts.hard_block], ['requires_review', 'validar', counts.requires_review], ['advisory', 'orientam', counts.advisory]] as const).map(([value, label, count]) => <button type="button" key={label} onClick={() => setSeverity(value as ProductGuardrail['severity'] | '')} className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${severity === value ? 'bg-cyan-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{label}{value ? ` ${count}` : ''}</button>)}</div>
    </div>
    <p className="mt-1 text-[11px] text-slate-500">Valem para o contexto do parceiro; não significam que uma violação foi encontrada.</p>
    {items.length ? items.map((item) => <details key={item.id} open={item.severity !== 'advisory'} className={`mt-1.5 rounded-lg border ${item.severity === 'hard_block' ? 'border-red-200 bg-red-50' : item.severity === 'requires_review' ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-slate-50'}`}><summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-2.5 py-1.5"><b className="text-[11px]">{item.title}</b><span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase ${item.severity === 'hard_block' ? 'bg-red-100 text-red-700' : item.severity === 'requires_review' ? 'bg-amber-100 text-amber-800' : 'bg-white text-slate-600'}`}>{item.severity === 'hard_block' ? 'bloqueia' : item.severity === 'requires_review' ? 'validar' : 'orienta'}</span></summary><div className="border-t border-black/5 px-2.5 pb-2"><p className="mt-1.5 text-xs leading-5 text-slate-700">{item.ruleText}</p>{item.evidence && <p className="mt-1 text-[10px] leading-4 text-slate-500"><b>Evidência:</b> {item.evidence}</p>}</div></details>) : <p className="mt-2 rounded-lg bg-slate-50 p-2.5 text-[11px] text-slate-500">Nenhuma regra neste filtro. Isso não representa liberação automática de claims.</p>}
  </section>;
};

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

const ImageUrlCard = ({ slot, imageUrl, destinationUrl, assets = [], contextProduct = '', contextPartner = '', onImageUrl, onDestinationUrl, onCreateAsset, locked }: { slot: ImageSlot; imageUrl: string; destinationUrl?: string; assets?: EmailAsset[]; contextProduct?: string; contextPartner?: string; onImageUrl: (value: string) => void; onDestinationUrl?: (value: string) => void; onCreateAsset: () => void; locked?: boolean }) => {
  const [loadState, setLoadState] = useState<'idle' | 'loading' | 'loaded' | 'error'>(imageUrl ? 'loading' : 'idle');
  const [dimensions, setDimensions] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  useEffect(() => { setLoadState(imageUrl ? 'loading' : 'idle'); setDimensions(''); }, [imageUrl]);
  const validUrl = !imageUrl || isPublicImageUrl(imageUrl);
  return <div className={`overflow-hidden rounded-xl border bg-white ${locked ? 'border-slate-200' : !validUrl || loadState === 'error' ? 'border-red-200' : loadState === 'loaded' ? 'border-emerald-200' : 'border-slate-200'}`}>
    <div className="flex items-start justify-between gap-3 px-3 py-2.5"><div><div className="flex items-center gap-2 text-sm font-bold text-slate-800"><ImageIcon size={15} className="text-cyan-600"/>{slot.label}{locked ? <span className="inline-flex items-center gap-1 rounded bg-slate-200 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-600"><Lock size={9}/>fixo no AMP</span> : loadState === 'loaded' && <CheckCircle2 size={14} className="text-emerald-500"/>}</div><div className="mt-0.5 text-[11px] text-slate-500">{locked ? 'Este banner é fixo no template atual — troque de template para poder alterá-lo.' : slot.description}{dimensions && ` · ${dimensions}`}</div></div>{imageUrl && !locked && <button type="button" onClick={() => onImageUrl('')} className="rounded-lg p-2 text-slate-400 outline-none hover:bg-red-50 hover:text-red-600 focus-visible:ring-2 focus-visible:ring-red-400" aria-label={`Remover ${slot.label}`}><Trash2 size={14}/></button>}</div>
    <div className="grid gap-3 border-t border-slate-100 p-3 md:grid-cols-[minmax(0,1fr)_minmax(180px,0.7fr)]">
      <div className={`space-y-2 ${locked ? 'pointer-events-none opacity-50' : ''}`}>
        <button type="button" onClick={() => setPickerOpen(true)} disabled={!assets.length || locked} className="flex w-full items-center justify-between rounded-lg border border-cyan-300 bg-cyan-50 px-3 py-3 text-left text-xs font-bold text-cyan-900 outline-none hover:border-cyan-500 hover:bg-cyan-100 focus-visible:ring-2 focus-visible:ring-cyan-500 disabled:cursor-not-allowed disabled:opacity-50"><span><Images className="mr-2 inline" size={16}/>Selecionar imagem salva</span><span className="rounded-full bg-white px-2 py-0.5 text-[10px] text-cyan-700">{assets.length} ativos</span></button>
        <div className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-[11px] text-slate-500"><span className="min-w-0 truncate">{imageUrl ? 'Ativo selecionado na biblioteca' : 'Nenhum ativo selecionado'}</span><div className="flex shrink-0 items-center gap-1">{imageUrl && validUrl && <a href={imageUrl} target="_blank" rel="noreferrer" className="rounded-md p-1.5 text-slate-500 hover:bg-white hover:text-cyan-700" aria-label={`Abrir ${slot.label}`}><ExternalLink size={13}/></a>}<button type="button" onClick={onCreateAsset} disabled={locked} className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 font-bold text-cyan-700 hover:bg-white disabled:opacity-50"><Upload size={13}/>Subir novo ativo</button></div></div>
        {onDestinationUrl && <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-500">Link ao clicar na imagem<input type="url" disabled={locked} value={destinationUrl ?? ''} onChange={(event) => onDestinationUrl(event.target.value.trim())} placeholder="https://destino-da-campanha..." className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-normal normal-case tracking-normal outline-none focus:border-cyan-400 focus-visible:ring-2 focus-visible:ring-cyan-100 disabled:bg-slate-100 disabled:text-slate-400"/></label>}
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

const Field = ({ field, value, suggestions, onChange, locked }: { field: BriefingColumn; value: string; suggestions: string[]; onChange: (value: string) => void; locked?: boolean }) => {
  const isDate = field === 'DT_INICIO' || field === 'DT_FIM';
  const id = `dynamic-${field}`;
  const label = FIELD_LABELS[field] ?? field;
  const inputCls = `min-w-0 flex-1 rounded-lg border px-3 py-2 text-sm outline-none focus:border-cyan-400 focus-visible:ring-2 focus-visible:ring-cyan-100 ${locked ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400' : 'border-slate-200 text-slate-800'}`;
  return <label htmlFor={id} className={`${LONG_FIELDS.has(field) ? 'md:col-span-2' : ''} text-xs font-semibold text-slate-700`}>
    <span className="flex flex-wrap items-center gap-1"><span>{label}</span><span className="font-normal text-slate-400" title={`Campo do CSV: ${field}`}>· {field}</span>{locked && <span className="inline-flex items-center gap-1 rounded bg-slate-200 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-600" title="Este campo não é usado pelo template selecionado — o valor vem fixo do HTML/AMPscript. Troque de template ou edite o Template-fonte para mudar."><Lock size={9}/>fixo no AMP</span>}</span>
    <div className="mt-1 flex gap-2">{COLOR_FIELDS.has(field) && <input disabled={locked} aria-label={`Selecionar ${label.toLowerCase()}`} type="color" value={/^#[0-9a-f]{6}$/i.test(value) ? value : '#000000'} onChange={(event) => onChange(event.target.value)} className="h-10 w-10 rounded-lg border border-slate-200 bg-white p-1 outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 disabled:opacity-50"/>}
    {LONG_FIELDS.has(field) ? <textarea id={id} disabled={locked} value={value} onChange={(event) => onChange(event.target.value)} rows={field === 'PRE_CABECALHO' ? 2 : 3} className={`w-full leading-5 ${inputCls}`}/> : <><input id={id} disabled={locked} list={`${id}-suggestions`} type={isDate ? 'datetime-local' : 'text'} value={isDate ? toDateInput(value) : value} onChange={(event) => onChange(event.target.value)} className={inputCls}/><datalist id={`${id}-suggestions`}>{!isDate && suggestions.slice(0, 20).map((suggestion) => <option key={suggestion} value={suggestion}/>)}</datalist></>}</div>
  </label>;
};
