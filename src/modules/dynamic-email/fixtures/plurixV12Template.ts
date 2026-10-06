import { PLURIX_V11_TEMPLATE } from './plurixV11Template';
import { LIMIT_NAME_FALLBACK } from '../domain/limitMessage';

export const PLURIX_V12_TEMPLATE_ID = 'builtin-plurix-v12';
export const PLURIX_V12_TEMPLATE_NAME = 'PLURIX V12 · mensagem de limite no briefing (candidata)';

/**
 * V12 = V11 testada (06/10/2026, E-mail 1 e E-mail 2 recebidos pelo mesmo motor) com uma
 * única mudança de contrato: o texto da faixa de limite sai do HTML e passa a vir da
 * coluna MENSAGEM_LIMITE do briefing (37ª coluna).
 *
 * - A faixa só aparece com LIMITE_CRD positivo E mensagem preenchida.
 * - Só {{nome}} e {{limite}} são substituídos, com Replace. O campo nunca passa por
 *   TreatAsContent, então AMPscript escrito ali não executa.
 * - Sem nome na audiência, {{nome}} vira "cliente".
 * - Sobrou marcador desconhecido: a faixa some em vez de vazar {{ }}.
 *
 * Tudo o mais (audiência, estado, chave CRM, vigência, header por imagem, sem pool) é
 * idêntico à V11. O espelho TypeScript desta regra está em domain/limitMessage.ts.
 */

const replaceOnce = (source: string, anchor: string, replacement: string, label: string) => {
  const parts = source.split(anchor);
  if (parts.length !== 2) throw new Error(`PLURIX V12: âncora "${label}" encontrada ${parts.length - 1} vezes na V11.`);
  return parts.join(replacement);
};

const V11_HEADER_COMMENT = `/* PLURIX V11: um unico motor, dois toques CRM.`;
const V12_HEADER_COMMENT = `/* PLURIX V12 (candidata): V11 + texto da faixa de limite vindo do briefing (MENSAGEM_LIMITE).
   Base: PLURIX V11, um unico motor, dois toques CRM.`;

const V11_LAST_FIELD = `SET @Rodape = Field(@Row, "RODAPE")`;
const V12_LAST_FIELD = `SET @Rodape = Field(@Row, "RODAPE")
SET @MensagemLimite = Field(@Row, "MENSAGEM_LIMITE")`;

const V11_POOL_COMMENT = `/* Pool explicitamente desligado: nenhuma consulta e nenhum bloco. */`;
const V12_LIMIT_BAND = `/* V12: texto da faixa vem do briefing. Apenas {{nome}} e {{limite}} sao trocados;
   o campo nao passa por TreatAsContent. Sem limite positivo ou sem mensagem, sem faixa. */
SET @FaixaLimite = ""
IF NOT EMPTY(@LimiteFmt) AND NOT EMPTY(@MensagemLimite) THEN
  SET @NomeFaixa = @FirstName
  IF EMPTY(@NomeFaixa) THEN
    SET @NomeFaixa = "${LIMIT_NAME_FALLBACK}"
  ENDIF
  SET @FaixaLimite = Replace(Replace(Trim(@MensagemLimite), "{{nome}}", @NomeFaixa), "{{limite}}", @LimiteFmt)
  IF IndexOf(@FaixaLimite, "{{") > 0 OR IndexOf(@FaixaLimite, "%%") > 0 THEN
    SET @FaixaLimite = ""
  ENDIF
ENDIF

${V11_POOL_COMMENT}`;

const V11_BAND = `%%[ IF NOT EMPTY(@LimiteFmt) THEN ]%%
          <!-- V10: faixa de limite pré-aprovado (só para quem tem LIMITE) -->`;
const V12_BAND = `%%[ IF NOT EMPTY(@FaixaLimite) THEN ]%%
          <!-- V12: faixa de limite pré-aprovado, texto da coluna MENSAGEM_LIMITE -->`;

const V11_BAND_TEXT = `Boa notícia%%[ IF NOT EMPTY(@FirstName) THEN ]%%, %%=v(@FirstName)=%%%%[ ENDIF ]%%: você tem R$ %%=v(@LimiteFmt)=%% de limite pré-aprovado no cartão +amigo.`;
const V12_BAND_TEXT = `%%=v(@FaixaLimite)=%%`;

function buildPlurixV12(): string {
  let source = replaceOnce(PLURIX_V11_TEMPLATE, V11_HEADER_COMMENT, V12_HEADER_COMMENT, 'comentário de abertura');
  source = source.split('@PLXV11Inicializado').join('@PLXV12Inicializado');
  source = replaceOnce(source, V11_LAST_FIELD, V12_LAST_FIELD, 'leitura do briefing');
  source = replaceOnce(source, V11_POOL_COMMENT, V12_LIMIT_BAND, 'composição da faixa');
  source = replaceOnce(source, V11_BAND, V12_BAND, 'condição da faixa');
  source = replaceOnce(source, V11_BAND_TEXT, V12_BAND_TEXT, 'texto fixo da faixa');
  return source;
}

export const PLURIX_V12_TEMPLATE = buildPlurixV12();
