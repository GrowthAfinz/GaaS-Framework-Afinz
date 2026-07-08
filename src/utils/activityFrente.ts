import { Activity, Frente } from '../types/framework';

const COMBINING_MARKS = /[\u0300-\u036f]/g;

const normalizeTaxonomy = (value: unknown): string =>
  String(value ?? '')
    .normalize('NFD')
    .replace(COMBINING_MARKS, '')
    .trim()
    .toUpperCase();

export const isRentabilizacaoTaxonomy = (value: unknown): boolean => {
  const taxonomy = normalizeTaxonomy(value);
  if (!taxonomy || isAquisicaoTaxonomy(value)) return false;

  return taxonomy.startsWith('JOR_RENTABILIZACAO_')
    || taxonomy.startsWith('JOR_ATIVACAO')
    || taxonomy.startsWith('JOR_INCENTIVO_AO_USO_')
    || taxonomy.startsWith('JOR_POS_TOMBAMENTO_DESBLOQUEIO_')
    || taxonomy.startsWith('JOR_CARTAO_VC_WELCOME')
    || taxonomy.includes('SEGURO');
};

export const isAquisicaoTaxonomy = (value: unknown): boolean => {
  const taxonomy = normalizeTaxonomy(value);
  return taxonomy.startsWith('JOR_AQUISICAO_')
    || taxonomy.startsWith('DISP_AQUISICAO_')
    || taxonomy.startsWith('DISPARO_AQUISICAO_')
    || taxonomy.includes('_AQS_');
};

export const activityMatchesFrente = (activity: Activity, frente: Frente): boolean => {
  const raw = (activity.raw ?? {}) as Record<string, unknown>;
  const taxonomy = activity.jornada
    || raw['Jornada']
    || raw['jornada']
    || raw['Activity name / Taxonomia']
    || activity.id;
  const activityName = raw['Activity name / Taxonomia'] || activity.id;
  const isRentabilizacao = isRentabilizacaoTaxonomy(taxonomy) && !isAquisicaoTaxonomy(activityName);

  return frente === 'rentabilizacao' ? isRentabilizacao : !isRentabilizacao;
};
