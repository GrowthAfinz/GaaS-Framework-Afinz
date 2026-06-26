/**
 * Normalização e validação de template_id.
 *
 * REGRA: o `template_id` é EXATAMENTE o `af_sub3` do link AppsFlyer (caixa mista,
 * ex.: `b2c_email_copa_bsp_S1D01`). Preservar a caixa é obrigatório para a
 * atribuição casar — por isso NÃO fazemos uppercase. A constraint do banco aceita
 * `^[A-Za-z0-9][A-Za-z0-9_-]{2,79}$`.
 */

/** Limpa um id colado preservando a caixa (trim, remove acento, espaço→_). */
export function normalizeTemplateId(raw: string): string {
  return raw
    .trim()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // remove acentos (diacríticos combinantes)
    .replace(/\s+/g, '_');
}

/** Valida o formato exigido pela constraint `communication_templates_id_format`. */
export function isValidTemplateId(id: string): boolean {
  return /^[A-Za-z0-9][A-Za-z0-9_-]{2,79}$/.test(id);
}
