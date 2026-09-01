import type { BriefingColumn } from './briefing';
import type { EmailAsset, WorkspaceBriefing } from './workspace';
import { plurixLegacyReferenceAsset } from './plurixLegacyReferenceAssets';

const IMAGE_FIELDS = ['HEADER', 'BANNER_1_CORPO', 'BANNER_2_CORPO', 'BANNER_3_CORPO'] as const satisfies readonly BriefingColumn[];
type ImageField = typeof IMAGE_FIELDS[number];

export const isMarketingPending = (value: string) => /^\s*\[PENDENTE MKT\]/i.test(value);

/** Builds a preview-only row. Pending editorial instructions remain untouched in storage. */
export function projectMarketingPreview(row: WorkspaceBriefing, _rows: WorkspaceBriefing[], _assets: EmailAsset[]): WorkspaceBriefing {
  const projected = { ...row };
  IMAGE_FIELDS.forEach((field) => {
    if (isMarketingPending(projected[field])) projected[field] = plurixLegacyReferenceAsset(row, field);
  });
  return projected;
}

