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
  if (!taxonomy || taxonomy.startsWith('JOR_AQUISICAO_')) return false;

  return taxonomy.startsWith('JOR_RENTABILIZACAO_')
    || taxonomy.startsWith('JOR_ATIVACAO')
    || taxonomy.startsWith('JOR_INCENTIVO_AO_USO_')
    || taxonomy.startsWith('JOR_POS_TOMBAMENTO_DESBLOQUEIO_')
    || taxonomy.startsWith('JOR_CARTAO_VC_WELCOME')
    || taxonomy.includes('SEGURO');
};

export const activityMatchesFrente = (activity: Activity, frente: Frente): boolean => {
  const raw = (activity.raw ?? {}) as Record<string, unknown>;
  const taxonomy = activity.jornada
    || raw['Jornada']
    || raw['jornada']
    || raw['Activity name / Taxonomia']
    || activity.id;
  const isRentabilizacao = isRentabilizacaoTaxonomy(taxonomy);

  return frente === 'rentabilizacao' ? isRentabilizacao : !isRentabilizacao;
};
