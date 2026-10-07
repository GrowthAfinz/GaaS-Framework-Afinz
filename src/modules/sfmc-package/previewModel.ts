import type { MessageContent } from './types';
export function fieldExample(field: string) {
  if (/FIRST.?NAME|PRIMEIRO.?NOME/i.test(field)) return 'Maria';
  if (/LIMITE|LIMIT/i.test(field)) return '2.500';
  return '[' + field.replace(/%/g, '') + ']';
}
export function previewText(content: MessageContent, showFields = false): string {
  const parameter = (raw: string) => showFields ? '[' + raw.replace(/%/g, '') + ']' : raw.replace(/%%([\w]+)%%/g, (_, f) => fieldExample(f));
  return (content.body_text || '').replace(/\$\{(\d+)\}/g, (_, n) => parameter(content.body_params[Number(n) - 1] || 'CAMPO_' + n))
    .replace(/%%([\w]+)%%/g, (_, f) => showFields ? '[' + f + ']' : fieldExample(f));
}
const GSM = new Set(Array.from('@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞ\u001bÆæßÉ !\"#¤%&\'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà'));
const EXT = new Set(Array.from('^{}\\[~]|€\f'));
export function smsSegments(text: string) {
  let units = 0, gsm = true;
  for (const c of text) { if (GSM.has(c)) units++; else if (EXT.has(c)) units += 2; else { gsm = false; break; } }
  if (!gsm) units = text.length;
  const single = gsm ? 160 : 70, multi = gsm ? 153 : 67;
  return { encoding: gsm ? 'GSM-7' : 'UCS-2', units, segments: units === 0 ? 0 : units <= single ? 1 : Math.ceil(units / multi) };
}

