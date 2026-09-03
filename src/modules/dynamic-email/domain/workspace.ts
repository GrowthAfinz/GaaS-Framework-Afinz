import type { BriefingColumn, BriefingRow } from './briefing';

export const PLURIX_SIGNATURES = [
  { key: 'AMIGAO', label: 'Amigão' },
  { key: 'BOA', label: 'Boa' },
  { key: 'AVENIDA', label: 'Avenida' },
  { key: 'COMPRE MAIS', label: 'Compre Mais' },
  { key: 'PARANA', label: 'Paraná' },
  { key: 'SUPERPAO', label: 'Superpão' },
] as const;

export type BriefingStatus = 'draft' | 'needs_review' | 'ready' | 'exported' | 'test_pending' | 'certified' | 'archived';

export type EditorialMeta = {
  partner: string;
  segment: string;
  subgroup: string;
  weekKey: string;
  activityNames: string[];
  campaignGroupId: string;
  status: BriefingStatus;
  version: number;
  templateSlotId?: string;
  savedAt?: string;
  acknowledgedMissingActivity?: boolean;
  legalOverride?: boolean;
};

export type WorkspaceBriefing = BriefingRow & { __meta: EditorialMeta };

/** The normal inbox and the trash are mutually exclusive operational views. */
export const briefingRowsForView = (rows: WorkspaceBriefing[], trashOnly: boolean): WorkspaceBriefing[] =>
  rows.filter((row) => trashOnly ? row.__meta.status === 'archived' : row.__meta.status !== 'archived');

export type EmailAsset = {
  id: string;
  name: string;
  externalUrl: string;
  clickUrl?: string;
  slot: 'header' | 'banner_1' | 'banner_2' | 'banner_3' | 'signature' | 'generic';
  bu?: string;
  partner?: string;
  segment?: string;
  subgroup?: string;
  product?: string;
  altText?: string;
  width?: number;
  height?: number;
  tags: string[];
  status: 'draft' | 'ready' | 'archived';
  version: number;
};

export type LegalText = {
  id: string;
  name: string;
  legalText: string;
  color: string;
  fontSize: string;
  bu?: string;
  partner?: string;
  campaignType?: string;
  status: 'draft' | 'approved' | 'archived';
  version: number;
  notes?: string;
};

export type ActivityTaxonomy = {
  activityName: string;
  bu: string;
  partner: string;
  segment: string;
  subgroup: string;
  weekKey: string;
  product: string;
  order?: number;
  businessFront: 'acquisition' | 'monetization';
  sourceTable: 'activities' | 'rentabilizacao_activities';
};

export type SegmentGovernanceStatus = 'existing' | 'draft' | 'approved' | 'observed';

export type EmailFactorySegment = {
  id: string;
  technicalName: string;
  displayName: string;
  businessFront: 'acquisition' | 'monetization';
  sourceTable?: 'activities' | 'rentabilizacao_activities';
  sourceValue?: string;
  partner?: string;
  bu?: string;
  lifecycleFamily?: string;
  audienceDescription?: string;
  origin: 'operational' | 'planned';
  governanceStatus: SegmentGovernanceStatus;
};

export type SignatureSetting = {
  partner: string;
  signatureKey: string;
  signatureLabel: string;
  status: 'active' | 'inactive';
  effectiveFrom?: string;
};

export type EmailTemplateSlot = {
  id: string;
  name: string;
  source: string;
  isPrincipal: boolean;
  version: number;
  updatedAt: string;
};

export const emptyMeta = (): EditorialMeta => ({
  partner: '', segment: '', subgroup: '', weekKey: '', activityNames: [],
  campaignGroupId: crypto.randomUUID(), status: 'draft', version: 1,
});

export const withMeta = (row: BriefingRow, patch: Partial<EditorialMeta> = {}): WorkspaceBriefing => ({
  ...row,
  __meta: { ...emptyMeta(), ...patch },
});

export const normalizeLegacyRows = (rows: BriefingRow[] | WorkspaceBriefing[]): WorkspaceBriefing[] => rows.map((row) => {
  const candidate = row as WorkspaceBriefing;
  if (candidate.__meta) return candidate;
  return withMeta(row, {
    partner: row.NM_PRODUTO_INTERNO === 'INSTITUCIONAL' ? 'N/A' : '',
    segment: '', subgroup: '', weekKey: '',
  });
});

export const exportableRow = (row: WorkspaceBriefing): BriefingRow => {
  const clean = { ...row } as WorkspaceBriefing & Record<string, unknown>;
  delete clean.__meta;
  return clean as BriefingRow;
};

export const sharedFields: BriefingColumn[] = [
  'DT_INICIO', 'DT_FIM', 'TP_CAMPANHA', 'SEQUENCIA', 'ASSUNTO', 'PRE_CABECALHO',
  'CARTAO_NM_COMERCIAL', 'TITULO_COPY_1_AZUL', 'COR_COPY_1', 'TAMANHO_DA_FONTE_TITULO_COPY_1',
  'TITULO_CTA_1', 'COPY_1_PRETO', 'COR_COPY_PRETO_1', 'TAMANHO_DA_FONTE_TITULO_COPY_PRETO_1',
  'TITULO_COPY_2', 'COR_TITULO_COPY_2', 'TAMANHO_DA_FONTE_TITULO_COPY_2', 'COPY_2_PRETO',
  'COR_COPY_2', 'TAMANHO_DA_FONTE_COPY_2', 'TITULO_CTA_2', 'BANNER_2_CORPO',
  'NOTA_LEGAL', 'COR_NOTA_LEGAL', 'TAMANHO_DA_FONTE_NOTA_LEGAL',
];

export const signatureFields: BriefingColumn[] = [
  'NM_PRODUTO_INTERNO', 'HEADER', 'LINK_CTA_1', 'LINK_CTA_2', 'BANNER_1_CORPO',
  'LINK_BANNER_1_CORPO', 'LINK_BANNER_2_CORPO', 'BANNER_3_CORPO', 'LINK_BANNER_3_CORPO', 'RODAPE', 'UTM_CAMPANHA',
];

export const partnerLabel = (value: string) => value === 'N/A'
  ? 'Parceiro não informado (N/A)'
  : value || 'Parceiro não declarado';

export const applyWorkspaceField = (rows: WorkspaceBriefing[], selectedId: string, field: BriefingColumn, value: string) => {
  const selected = rows.find((row) => row.__id === selectedId);
  if (!selected) return rows;
  const propagate = sharedFields.includes(field) && !selected.__meta.legalOverride;
  return rows.map((row) => row.__id === selectedId || (propagate && row.__meta.status !== 'archived' && row.__meta.campaignGroupId === selected.__meta.campaignGroupId)
    ? { ...row, [field]: value }
    : row);
};

export const ensurePlurixVariants = (rows: WorkspaceBriefing[], selectedId: string, inactiveKeys: string[] = []): WorkspaceBriefing[] => {
  const selected = rows.find((row) => row.__id === selectedId);
  if (!selected) return rows;
  const group = rows.filter((row) => row.__meta.campaignGroupId === selected.__meta.campaignGroupId);
  const keys = new Set(group.map((row) => row.NM_PRODUTO_INTERNO.toUpperCase()));
  const additions = PLURIX_SIGNATURES.filter(({ key }) => !keys.has(key) && !inactiveKeys.includes(key)).map(({ key, label }) => withMeta({
    ...selected, __id: crypto.randomUUID(), NM_PRODUTO_INTERNO: key,
  }, { ...selected.__meta, subgroup: label, version: 1, status: 'draft', savedAt: undefined }));
  return [...rows, ...additions];
};
