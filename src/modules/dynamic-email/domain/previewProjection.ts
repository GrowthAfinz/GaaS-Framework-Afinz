import type { BriefingColumn } from './briefing';
import type { EmailAsset, WorkspaceBriefing } from './workspace';

const IMAGE_FIELDS = ['HEADER', 'BANNER_1_CORPO', 'BANNER_2_CORPO', 'BANNER_3_CORPO'] as const satisfies readonly BriefingColumn[];
type ImageField = typeof IMAGE_FIELDS[number];

const FIELD_SLOT: Record<ImageField, EmailAsset['slot']> = {
  HEADER: 'header',
  BANNER_1_CORPO: 'banner_1',
  BANNER_2_CORPO: 'banner_2',
  BANNER_3_CORPO: 'banner_3',
};

export const isMarketingPending = (value: string) => /^\s*\[PENDENTE MKT\]/i.test(value);
const isPublicImage = (value: string) => /^https:\/\/\S+$/i.test(value) && !isMarketingPending(value);
const sequenceOrder = (value: string) => Number(value.match(/\d+/)?.[0] ?? 999);

function scoreAsset(asset: EmailAsset, row: WorkspaceBriefing, field: ImageField): number {
  const expectedSlot = FIELD_SLOT[field];
  let score = asset.slot === expectedSlot ? 80 : asset.slot === 'generic' ? 10 : -100;
  if (field === 'BANNER_3_CORPO' && asset.slot === 'signature') score = 70;
  const product = row.NM_PRODUTO_INTERNO.toUpperCase();
  const subgroup = row.__meta.subgroup.toUpperCase();
  if (asset.product?.toUpperCase() === product) score += 45;
  if (asset.subgroup?.toUpperCase() === subgroup) score += 35;
  if (asset.partner?.toUpperCase() === row.__meta.partner.toUpperCase()) score += 20;
  if (asset.segment?.toUpperCase() === row.__meta.segment.toUpperCase()) score += 10;
  if (asset.status === 'ready') score += 5;
  return score;
}

function projectedImage(row: WorkspaceBriefing, field: ImageField, rows: WorkspaceBriefing[], assets: EmailAsset[]): string {
  const currentOrder = sequenceOrder(row.SEQUENCIA);
  const sibling = rows
    .filter((candidate) => candidate.__id !== row.__id
      && candidate.__meta.status !== 'archived'
      && candidate.__meta.partner === row.__meta.partner
      && candidate.__meta.segment === row.__meta.segment
      && candidate.NM_PRODUTO_INTERNO === row.NM_PRODUTO_INTERNO
      && isPublicImage(candidate[field]))
    .sort((a, b) => Math.abs(sequenceOrder(a.SEQUENCIA) - currentOrder) - Math.abs(sequenceOrder(b.SEQUENCIA) - currentOrder))[0];
  if (sibling) return sibling[field];

  return assets
    .filter((asset) => isPublicImage(asset.externalUrl))
    .map((asset) => ({ asset, score: scoreAsset(asset, row, field) }))
    .filter(({ score }) => score >= 0)
    .sort((a, b) => b.score - a.score)[0]?.asset.externalUrl ?? '';
}

/** Builds a preview-only row. Pending editorial instructions remain untouched in storage. */
export function projectMarketingPreview(row: WorkspaceBriefing, rows: WorkspaceBriefing[], assets: EmailAsset[]): WorkspaceBriefing {
  const projected = { ...row };
  IMAGE_FIELDS.forEach((field) => {
    if (isMarketingPending(projected[field])) projected[field] = projectedImage(row, field, rows, assets);
  });
  return projected;
}

