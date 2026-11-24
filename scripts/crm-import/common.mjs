import { createHash } from 'node:crypto';
export const PROJECT = 'mipiwxadnpwtcgfcedym';
export const TABLES = ['activities', 'rentabilizacao_activities'];
export const VERSION = 'crm-csv-v1';
export const canonical = value => JSON.stringify(sort(value));
function sort(value) {
  if (Array.isArray(value)) return value.map(sort);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(key => [key, sort(value[key])]));
  return value;
}
export const hash = value => createHash('sha256').update(typeof value === 'string' || Buffer.isBuffer(value) ? value : canonical(value)).digest('hex');
export const md5 = value => createHash('md5').update(value).digest('hex');
export const uuid = value => { const h = hash(value); return `${h.slice(0,8)}-${h.slice(8,12)}-5${h.slice(13,16)}-a${h.slice(17,20)}-${h.slice(20,32)}`; };
export const literal = value => "'" + String(value).replaceAll("'", "''") + "'";
export const jsonSql = value => literal(JSON.stringify(value)) + '::jsonb';
export const isoToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());
export function validDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !isNaN(Date.parse(value)) && new Date(value+'T00:00:00Z').toISOString().slice(0,10) === value;
}
export function sqlRows(response) {
  if (Array.isArray(response)) return response;
  if (response.isError || response.structuredContent?.error_code) throw new Error(JSON.stringify(response));
  const text = response.content?.find(c => c.type === 'text')?.text;
  let decoded;
  try { decoded = JSON.parse(text); } catch { throw new Error('Invalid SQL connector response'); }
  if (decoded.error) throw new Error(JSON.stringify(decoded.error));
  const result = decoded.result;
  if (Array.isArray(result)) return result;
  const match = typeof result === 'string' && result.match(/(?:^|\n)<untrusted-data-[^>]+>\s*([\s\S]*?)\s*<\/untrusted-data-[^>]+>/);
  if (!match) throw new Error('SQL response has no result envelope');
  const rows = JSON.parse(match[1]);
  if (!Array.isArray(rows)) throw new Error('SQL rows must be an array');
  return rows;
}
