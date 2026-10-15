/**
 * Faixa de limite pré-aprovado com texto vindo do briefing (coluna MENSAGEM_LIMITE).
 *
 * O template PLURIX V12 só consulta os dados e substitui dois marcadores. Este módulo
 * é o espelho exato dessa regra para a prévia e para a validação do GaaS: qualquer
 * mudança aqui precisa ser refletida no AMPscript de fixtures/plurixV12Template.ts.
 */

export const LIMIT_MESSAGE_MARKERS = ['{{nome}}', '{{limite}}'] as const;
/**
 * Sem nome na audiência, {{nome}} some junto com a vírgula ou o espaço que o acompanha
 * ("Boa notícia, {{nome}}:" vira "Boa notícia:"). Decisão de 15/10/2026, no lugar de "cliente".
 * A ordem importa e é a mesma do AMPscript (LIMIT_NAME_REMOVALS).
 */
export const LIMIT_NAME_REMOVALS = [', {{nome}}', '{{nome}}, ', ' {{nome}}', '{{nome}}'] as const;

export function removeNameMarker(text: string): string {
  return LIMIT_NAME_REMOVALS.reduce((current, marker) => current.split(marker).join(''), text);
}
/** Mesmo comprimento da coluna Text na DE TB_BRIEFING_CAMPANHA_AQUISICAO. */
export const LIMIT_MESSAGE_MAX = 300;
const ALLOWED_TAGS = /^<\/?(?:b|strong|i|em|br)\s*\/?>$/i;
// Promessas que o produto não sustenta: pré-aprovação continua sujeita a análise.
const RISKY_PROMISES = /garantid|aprova[çc][ãa]o (?:j[áa] )?(?:definitiv|certa)|sem an[áa]lise|100% aprovad|j[áa] est[áa] aprovad/i;

export type LimitMessageIssue = { severity: 'error' | 'warning'; code: string; message: string };

const PLAIN_NUMBER = /^[0-9]+(\.[0-9]{1,2})?$/;

/** Mesmo contrato do LIMITE_CRD na V11/V12: número com ponto decimal, positivo. */
export function formatLimitValue(raw: string): string {
  const value = raw.trim();
  if (!PLAIN_NUMBER.test(value) || !(Number(value) > 0)) return '';
  return Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export type LimitInputState = 'absent' | 'zero' | 'positive' | 'invalid';

export function limitInputState(raw: string): LimitInputState {
  const value = raw.trim();
  if (!value) return 'absent';
  if (!PLAIN_NUMBER.test(value)) return 'invalid';
  return Number(value) > 0 ? 'positive' : 'zero';
}

export function validateLimitMessage(message: string): LimitMessageIssue[] {
  const text = message.trim();
  if (!text) return [];
  const issues: LimitMessageIssue[] = [];
  const markers = [...text.matchAll(/\{\{\s*([^}]*?)\s*\}\}/g)];
  const unknown = [...new Set(markers.map((match) => match[0]).filter((marker) => !(LIMIT_MESSAGE_MARKERS as readonly string[]).includes(marker)))];
  if (unknown.length) issues.push({ severity: 'error', code: 'limit-marker-unknown', message: `Marcador não suportado: ${unknown.join(', ')}. Use apenas {{nome}} e {{limite}}, em minúsculas.` });
  if (/\{\{|\}\}/.test(text.replace(/\{\{[^{}]*\}\}/g, ''))) {
    issues.push({ severity: 'error', code: 'limit-marker-broken', message: 'Há chaves {{ }} abertas ou fechadas sem par.' });
  }
  if (/%%/.test(text)) issues.push({ severity: 'error', code: 'limit-ampscript', message: 'A mensagem da faixa não aceita AMPscript (%%). Use {{nome}} e {{limite}}.' });
  const tags = text.match(/<[^>]*>/g) ?? [];
  if (tags.some((tag) => !ALLOWED_TAGS.test(tag))) issues.push({ severity: 'error', code: 'limit-html', message: 'Só são aceitas as marcações <b>, <strong>, <i>, <em> e <br>.' });
  if (text.length > LIMIT_MESSAGE_MAX) issues.push({ severity: 'error', code: 'limit-length', message: `A mensagem tem ${text.length} caracteres; o máximo é ${LIMIT_MESSAGE_MAX}.` });
  if (/^\s*(<[^>]+>\s*)*\{\{nome\}\}/.test(text)) issues.push({ severity: 'warning', code: 'limit-name-start', message: 'Evite começar com {{nome}}: sem nome na base, a frase começaria em minúscula. Prefira "Boa notícia, {{nome}}: ...".' });
  if (!text.includes('{{limite}}')) issues.push({ severity: 'warning', code: 'limit-without-value', message: 'A mensagem não mostra o valor do limite ({{limite}}).' });
  if (RISKY_PROMISES.test(text)) issues.push({ severity: 'warning', code: 'limit-promise', message: 'Revise a promessa: pré-aprovação continua sujeita a análise de crédito.' });
  return issues;
}

/**
 * Texto final da faixa. Vazio quando não há limite positivo, quando a mensagem está
 * vazia ou quando sobra marcador desconhecido (a faixa some, nunca vaza {{ }}).
 */
export function renderLimitMessage(message: string, firstName: string, limitRaw: string): string {
  const text = message.trim();
  const limit = formatLimitValue(limitRaw);
  if (!text || !limit) return '';
  const name = firstName.trim();
  const withName = name ? text.split('{{nome}}').join(name) : removeNameMarker(text);
  const result = withName.split('{{limite}}').join(limit);
  return result.includes('{{') || result.includes('%%') ? '' : result;
}

/** Converte o que a pessoa digita (3.500, 3500,50, R$ 1.500) para o contrato numérico. */
export function normalizeLimitInput(raw: string): string {
  const value = raw.replace(/R\$\s*/i, '').replace(/\s+/g, '');
  if (!value) return '';
  if (/^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(value) || /^\d+,\d{1,2}$/.test(value)) {
    return value.replace(/\./g, '').replace(',', '.');
  }
  return value;
}
