/**
 * Normalização e validação de template_id.
 *
 * Dualidade consciente:
 * - O BANCO valida `^[A-Z0-9][A-Z0-9_-]{2,79}$` (MAIÚSCULAS). Antes de gravar em
 *   `communication_templates.template_id` ou `activities.template_id`, normalizamos
 *   para maiúscula via `normalizeTemplateId`.
 * - O link AppsFlyer (`af_sub3`) permanece MINÚSCULO, como a planilha de governança
 *   gera (ex.: `b2c_email_copa_bsp_001`). Não aplicar `normalizeTemplateId` ao link.
 */

/** Normaliza um id colado da planilha para o formato aceito pelo banco (maiúsculas). */
export function normalizeTemplateId(raw: string): string {
  return raw
    .trim()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // remove acentos (diacríticos combinantes)
    .replace(/\s+/g, '_')
    .toUpperCase();
}

/** Valida o formato exigido pela constraint `communication_templates_id_format`. */
export function isValidTemplateId(id: string): boolean {
  return /^[A-Z0-9][A-Z0-9_-]{2,79}$/.test(id);
}
