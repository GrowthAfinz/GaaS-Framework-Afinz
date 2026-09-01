import type { BriefingColumn } from './briefing';
import type { WorkspaceBriefing } from './workspace';

type ProjectedImageField = Extract<BriefingColumn, 'HEADER' | 'BANNER_1_CORPO' | 'BANNER_2_CORPO' | 'BANNER_3_CORPO'>;
type ReferenceSet = Partial<Record<ProjectedImageField, string>>;

const ROOT = 'https://stoplxmkt.blob.core.windows.net/plxmkt';
const V2 = `${ROOT}/20250625-EM-JORNADA_DE_AQUISICAO_MAIS_AMIGO-AFINZ-V2`;
const V1 = `${ROOT}/20240513-EM-JORNADA_DE_AQUISICAO_MAIS_AMIGO-AFINZ`;

/**
 * Visual references transcribed from REGUA ANTIGA +AMIGO.pdf.
 * They are preview-only: editorial [PENDENTE MKT] values remain stored and exported unchanged.
 */
const REFERENCES: Record<string, ReferenceSet> = {
  'E-mail 3': {
    HEADER: `${V2}/semana-01/header-amigao-semana-1.png`,
    BANNER_1_CORPO: `${V2}/semana-01/banner-cartao-basicos.png`,
    BANNER_2_CORPO: `${V2}/semana-01/imagem-destaque-semana-1.png`,
  },
  'E-mail 4': {
    HEADER: `${V2}/semana-02/header-semana1-i2.png`,
    BANNER_1_CORPO: `${V2}/semana-02/bem-saude.png`,
    BANNER_2_CORPO: `${V2}/semana-02/bem-farmacia.png`,
  },
  'E-mail 5': {
    HEADER: `${V2}/semana-03/header-i1.png`,
    BANNER_1_CORPO: `${V2}/semana-03/vale-amigao.png`,
    BANNER_2_CORPO: `${V2}/semana-03/icone-pontos.png`,
  },
  'E-mail 6': {
    HEADER: `${V2}/semana-03/header-i2.png`,
    BANNER_1_CORPO: `${V1}/semana-3/benefit-image-2.png`,
    BANNER_2_CORPO: `${V2}/semana-03/banner-final-cartao.png`,
  },
  'E-mail 7': {
    HEADER: `${V2}/semana-04/header-i1.png`,
    BANNER_1_CORPO: `${V2}/semana-04/comparacao-basicos.png`,
  },
  'E-mail 8': {
    HEADER: `${V2}/semana-04/header-i2.png`,
    BANNER_1_CORPO: `${V2}/semana-04/comparacao-carne.png`,
  },
};

export function plurixLegacyReferenceAsset(row: WorkspaceBriefing, field: ProjectedImageField): string {
  if (row.__meta.partner !== 'Plurix' || row.__meta.segment !== 'CRM') return '';
  // The E-mail 3 source explicitly names Amigão; applying it to another signature would be misleading.
  if (row.SEQUENCIA === 'E-mail 3' && field === 'HEADER' && row.NM_PRODUTO_INTERNO.toUpperCase() !== 'AMIGAO') return '';
  return REFERENCES[row.SEQUENCIA]?.[field] ?? '';
}

