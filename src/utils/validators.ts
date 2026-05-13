import { FrameworkRow } from '../types/framework';

const REQUIRED_COLUMNS = [
  'Activity name / Taxonomia',
  'Data de Disparo',
  'Canal',
  'BU',
  'Segmento',
  'Taxa de Entrega',
  'Taxa de Abertura ',  // Com espaço no final
  'Taxa de Proposta',
  'Cartões Gerados',    // Com til
  'CAC',
  'Custo Total Campanha'
];

export const validateColumns = (headers: string[]): { valid: boolean; missing: string[] } => {
  // Normaliza headers para comparação (remove caracteres especiais problemáticos)
  const normalizeForComparison = (str: string): string => {
    return str
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Remove caracteres especiais
      .replace(/\s+/g, ' '); // Normaliza espaços
  };

  const normalizedHeaders = headers.map(normalizeForComparison);
  const normalizedRequired = REQUIRED_COLUMNS.map(normalizeForComparison);

  const missing = normalizedRequired
    .filter(req => !normalizedHeaders.includes(req))
    .map(norm => {
      // Tenta encontrar a coluna original correspondente
      const idx = normalizedRequired.indexOf(norm);
      return REQUIRED_COLUMNS[idx];
    });

  return {
    valid: missing.length === 0,
    missing
  };
};

export const validateRow = (row: FrameworkRow): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!row['Activity name / Taxonomia'] || row['Activity name / Taxonomia'].trim() === '') {
    errors.push('Activity name vazia');
  }

  if (!row['Data de Disparo'] || row['Data de Disparo'].toString().trim() === '') {
    errors.push('Data de Disparo vazia');
  }

  if (!row['BU'] || row['BU'].toString().trim() === '') {
    errors.push('BU vazia');
  }

  const buValue = row['BU']?.toString().trim().toUpperCase();
  const validBUs = ['B2C', 'B2B2C', 'PLURIX', 'SEGUROS'];
  if (!validBUs.includes(buValue)) {
    errors.push(`BU inválida: ${row['BU']}`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

export const sanitizeRow = (row: FrameworkRow): FrameworkRow => {
  const sanitized = { ...row };
  
  // Remove espaços extras em TODAS as chaves e valores
  const cleaned: any = {};
  Object.keys(sanitized).forEach(key => {
    const cleanKey = key.trim();
    const value = sanitized[key];
    
    if (typeof value === 'string') {
      cleaned[cleanKey] = value.trim();
    } else if (value !== null && value !== undefined) {
      cleaned[cleanKey] = value;
    } else {
      cleaned[cleanKey] = '';
    }
  });

  // Normaliza BU: converte para valores aceitos
  if (cleaned['BU']) {
    const buUpper = cleaned['BU'].toString().toUpperCase().trim();
    if (buUpper === 'B2C') cleaned['BU'] = 'B2C';
    else if (buUpper === 'B2B2C') cleaned['BU'] = 'B2B2C';
    else if (buUpper === 'PLURIX') cleaned['BU'] = 'Plurix';
    else if (buUpper === 'SEGUROS') cleaned['BU'] = 'Seguros';
    else cleaned['BU'] = buUpper;
  }

  return cleaned;
};

export const getValidationErrorMessage = (missing: string[]): string => {
  return `Colunas obrigatórias ausentes:\n${missing.join('\n')}\n\nVerifique se o Framework CSV está correto.`;
};
