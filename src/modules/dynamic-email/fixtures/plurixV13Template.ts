import { PLURIX_V12_TEMPLATE } from './plurixV12Template';
import { DEFAULT_HEADER_COLORS } from '../domain/topoPlurixV10';

export const PLURIX_V13_TEMPLATE_ID = 'builtin-plurix-v13';
export const PLURIX_V13_TEMPLATE_NAME = 'PLURIX V13 · topo dinâmico (header no briefing, limite e pool)';
export const PLURIX_V13_TP_CAMPANHA = 'Topo de Funil';

/**
 * V13 = V12 testada (motor único com sequência atual na DE de estado e faixa de limite
 * vinda de MENSAGEM_LIMITE) + o que a régua TOPO DE FUNIL DINÂMICO precisa:
 *
 * 1. Header dinâmico lido do próprio briefing, sem DE auxiliar: HEADER_TITULO,
 *    HEADER_SUBTITULO, HEADER_IMAGEM_CARTAO e HEADER_LOGO. Com título preenchido, o header
 *    é montado em HTML (texto sobre o azul do marketing). Sem título, HEADER continua
 *    funcionando como imagem HTTPS, como na V12.
 * 2. TP_CAMPANHA "Topo de Funil" e sequência de E-mail 1 a E-mail 8.
 * 3. Bloco 3 da V10: oferta do dia do pool (DE_POOL_OFERTAS_PLURIX). Sem oferta vigente,
 *    o bloco não aparece e o envio segue; o lookup nunca chama RaiseError.
 *
 * A prévia da Fábrica não executa este preparo: header e faixa são espelhados em
 * ampscript/renderer.ts e a oferta em domain/topoPlurixV10.ts (selectPoolOfferOfDay).
 */

const replaceOnce = (source: string, anchor: string, replacement: string, label: string) => {
  const parts = source.split(anchor);
  if (parts.length !== 2) throw new Error(`PLURIX V13: âncora "${label}" encontrada ${parts.length - 1} vezes na V12.`);
  return parts.join(replacement);
};

const { backgroundColor: FUNDO, titleColor: COR_TITULO, subtitleColor: COR_SUBTITULO } = DEFAULT_HEADER_COLORS;

const V12_HEADER_COMMENT = `/* PLURIX V12 (candidata): V11 + texto da faixa de limite vindo do briefing (MENSAGEM_LIMITE).`;
const V13_HEADER_COMMENT = `/* PLURIX V13 (candidata): topo dinâmico. V12 + header no briefing (HEADER_TITULO,
   HEADER_SUBTITULO, HEADER_IMAGEM_CARTAO, HEADER_LOGO), TP "Topo de Funil", E-mail 1 a 8 e pool.
   Base V12: V11 + texto da faixa de limite vindo do briefing (MENSAGEM_LIMITE).`;

const V12_TP = `SET @TpCampanha = "CRM"`;
const V13_TP = `SET @TpCampanha = "${PLURIX_V13_TP_CAMPANHA}"`;

const V12_SEQUENCE = `IF @Sequencia != "E-mail 1" AND @Sequencia != "E-mail 2" THEN
  RaiseError("PLX_SEQUENCE_INVALID: esperado E-mail 1 ou E-mail 2.", true)`;
const V13_SEQUENCE = `IF EMPTY(RegExMatch(@Sequencia, "^E-mail [1-8]$", 0)) THEN
  RaiseError("PLX_SEQUENCE_INVALID: esperado E-mail 1 a E-mail 8.", true)`;

const V12_LAST_FIELD = `SET @MensagemLimite = Field(@Row, "MENSAGEM_LIMITE")`;
const V13_LAST_FIELD = `SET @MensagemLimite = Field(@Row, "MENSAGEM_LIMITE")
SET @HdrTitulo = Field(@Row, "HEADER_TITULO")
SET @HdrSubtitulo = Field(@Row, "HEADER_SUBTITULO")
SET @HdrCartao = Field(@Row, "HEADER_IMAGEM_CARTAO")
SET @HdrLogo = Field(@Row, "HEADER_LOGO")`;

const V12_HEADER_MODE = `/* Operação desta semana: header somente por imagem HTTPS. */
SET @HeaderModo = ""
IF NOT EMPTY(@Header) THEN`;
const V13_HEADER_MODE = `/* V13: com HEADER_TITULO, header dinâmico em HTML; senão, HEADER como imagem HTTPS. */
SET @HeaderModo = ""
IF NOT EMPTY(@HdrTitulo) THEN
  SET @HeaderModo = "html"
ELSEIF NOT EMPTY(@Header) THEN`;

const V12_POOL_OFF = `/* Pool explicitamente desligado: nenhuma consulta e nenhum bloco. */`;
const V13_POOL = `/* V13 · oferta do dia do pool (mesma regra da V10 e de selectPoolOfferOfDay):
   ofertas ativas da rede, vigentes hoje e com preço; agrupadas por produto; vence o produto
   com mais linhas (regiões); empate, menor preço. Falha em silêncio: sem oferta, sem bloco. */
SET @OfertaProduto = ""
SET @OfertaPrecoTxt = ""
SET @OfertaImagem = ""
SET @OfertaData = ""
SET @HojeData = DateParse(Format(SystemDateToLocalDate(Now()), "yyyy-MM-dd"))
SET @PoolRows = LookupOrderedRows("DE_POOL_OFERTAS_PLURIX", 0, "PROMOTION_NAME ASC", "PARTNER_NAME", @Produto, "ACTIVE", "True")
SET @PoolCount = RowCount(@PoolRows)
SET @MelhorQtd = 0
SET @MelhorPreco = 0
SET @GrupoChave = ""
SET @GrupoQtd = 0
SET @GrupoPreco = 0
IF @PoolCount > 0 THEN
  FOR @i = 1 TO @PoolCount DO
    SET @PRow = Row(@PoolRows, @i)
    SET @PPrecoTxt = Trim(Field(@PRow, "SALE_PRICE"))
    SET @PPreco = Replace(Replace(Trim(Replace(@PPrecoTxt, "R$", "")), ".", ""), ",", ".")
    SET @PValida = "N"
    IF NOT EMPTY(RegExMatch(@PPreco, "^[0-9]+(\\.[0-9]+)?$", 0)) THEN
      IF DateDiff(DateParse(Field(@PRow, "START_DATE")), @HojeData, "D") >= 0 AND DateDiff(@HojeData, DateParse(Field(@PRow, "END_DATE")), "D") >= 0 THEN
        SET @PValida = "S"
      ENDIF
    ENDIF
    IF @PValida == "S" THEN
      SET @PNome = Trim(Field(@PRow, "PROMOTION_NAME"))
      SET @PChave = Uppercase(@PNome)
      IF @PChave != @GrupoChave THEN
        SET @Troca = "N"
        IF @GrupoQtd > @MelhorQtd THEN SET @Troca = "S" ENDIF
        IF @GrupoQtd > 0 AND @GrupoQtd == @MelhorQtd THEN
          IF Add(@GrupoPreco, 0) < Add(@MelhorPreco, 0) THEN SET @Troca = "S" ENDIF
        ENDIF
        IF @Troca == "S" THEN
          SET @MelhorQtd = @GrupoQtd
          SET @MelhorPreco = @GrupoPreco
          SET @OfertaProduto = @GrupoNome
          SET @OfertaPrecoTxt = @GrupoPrecoTxt
          SET @OfertaImagem = @GrupoImagem
        ENDIF
        SET @GrupoChave = @PChave
        SET @GrupoNome = @PNome
        SET @GrupoQtd = 0
        SET @GrupoPreco = @PPreco
        SET @GrupoPrecoTxt = @PPrecoTxt
        SET @GrupoImagem = Trim(Field(@PRow, "IMAGE_URL"))
      ENDIF
      SET @GrupoQtd = Add(@GrupoQtd, 1)
      IF Add(@PPreco, 0) < Add(@GrupoPreco, 0) THEN
        SET @GrupoPreco = @PPreco
        SET @GrupoPrecoTxt = @PPrecoTxt
        SET @GrupoImagem = Trim(Field(@PRow, "IMAGE_URL"))
      ENDIF
    ENDIF
  NEXT @i
  SET @Troca = "N"
  IF @GrupoQtd > @MelhorQtd THEN SET @Troca = "S" ENDIF
  IF @GrupoQtd > 0 AND @GrupoQtd == @MelhorQtd THEN
    IF Add(@GrupoPreco, 0) < Add(@MelhorPreco, 0) THEN SET @Troca = "S" ENDIF
  ENDIF
  IF @Troca == "S" THEN
    SET @OfertaProduto = @GrupoNome
    SET @OfertaPrecoTxt = @GrupoPrecoTxt
    SET @OfertaImagem = @GrupoImagem
  ENDIF
ENDIF
IF NOT EMPTY(@OfertaProduto) THEN
  SET @OfertaData = Format(@HojeData, "dd/MM")
ENDIF`;

const V12_IMAGE_HEADER = `          %%[ IF @HeaderModo == "imagem" THEN ]%%
          <tr>
            <td align="center" style="background-color:#eef1f5;">
              <img src="%%=v(@Header)=%%" alt="Oferta do cartão +amigo" width="600" style="display:block; width:100%; max-width:600px; height:auto; border:0;">
            </td>
          </tr>
          %%[ ENDIF ]%%`;
/** Logo +amigo branco, fixo no header dinâmico (o mesmo da peça aprovada pelo marketing). */
export const V13_HEADER_BRAND_LOGO = 'https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/c460d98e-264a-4f75-940f-d62d6b40dabf.png';
const HEADER_FONT = 'Tahoma, Geneva, sans-serif';

// Reproduz a peça de referência do marketing: duas colunas de 50%, texto em Tahoma
// (título 28px negrito, apoio 18px), logo +amigo branco + logo da rede lado a lado, e o
// cartão ocupando a coluna da direita (300px), encostado no topo.
const V13_HTML_HEADER = `${V12_IMAGE_HEADER}
          %%[ IF @HeaderModo == "html" THEN ]%%
          <!-- V13: header dinâmico, textos e imagens do próprio briefing -->
          <tr>
            <td bgcolor="${FUNDO}" style="padding:0; background-color:${FUNDO};">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${FUNDO}" style="background-color:${FUNDO};">
                <tr>
                  <td width="50%" valign="top" class="stack-column hdr-copy" style="width:50%; padding:30px 3px 24px 20px; font-family:${HEADER_FONT};">
                    <div class="hdr-title" style="margin:0; font-family:${HEADER_FONT}; color:${COR_TITULO}; font-size:28px; line-height:1.25; font-weight:bold;">%%=v(@HdrTitulo)=%%</div>
                    %%[ IF NOT EMPTY(@HdrSubtitulo) THEN ]%%
                    <div class="hdr-sub" style="margin:18px 0 0 0; font-family:${HEADER_FONT}; color:${COR_SUBTITULO}; font-size:18px; line-height:1.5;">%%=v(@HdrSubtitulo)=%%</div>
                    %%[ ENDIF ]%%
                    <div class="hdr-logos" style="margin:22px 0 0 0; line-height:0; font-size:0;">
                      <img class="hdr-brand" src="${V13_HEADER_BRAND_LOGO}" alt="+amigo" width="80" height="21" style="display:inline-block; vertical-align:middle; width:80px; height:21px; border:0;">%%[ IF NOT EMPTY(@HdrLogo) THEN ]%%<img class="hdr-partner" src="%%=v(@HdrLogo)=%%" alt="" width="80" style="display:inline-block; vertical-align:middle; width:80px; height:auto; max-height:21px; margin-left:8px; border:0;">%%[ ENDIF ]%%
                    </div>
                  </td>
                  <td width="50%" align="center" valign="top" class="stack-column hdr-card" style="width:50%; padding:0 0 0 3px;">
                    %%[ IF NOT EMPTY(@HdrCartao) THEN ]%%
                    <img src="%%=v(@HdrCartao)=%%" alt="Cartão +amigo Visa" width="300" style="display:block; width:100%; max-width:300px; height:auto; border:0; margin:0 auto;">
                    %%[ ENDIF ]%%
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          %%[ ENDIF ]%%`;

/** Marcador inofensivo; a prévia troca por um pino invisível do bloco 3. */
export const V13_POOL_ANCHOR_COMMENT = '<!-- GAAS:POOL_ANCHOR -->';

const BANNER_3_START = '          %%[ IF NOT EMPTY(@Banner3Corpo) THEN ]%%';
const POOL_BLOCK = `          %%[ IF NOT EMPTY(@OfertaProduto) THEN ]%%
          <!-- V13: bloco 3, oferta do dia do pool de ofertas -->
          <tr>
            <td class="content-pad" style="padding:8px 24px 28px 24px; background-color:#ffffff;">
              ${V13_POOL_ANCHOR_COMMENT}
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#F6F6FB" style="border:1px solid #E1E3F2; border-radius:14px; background-color:#F6F6FB;">
                <tr>
                  <td colspan="2" style="padding:20px 22px 4px 22px;">
                    <div style="color:#2C3490; font-size:18px; line-height:1.3; font-weight:700;">E tem mais: toda semana tem oferta exclusiva para quem tem o cartão +amigo</div>
                  </td>
                </tr>
                <tr>
                  <td width="58%" valign="middle" class="stack-column stack-copy" style="width:58%; padding:10px 12px 18px 22px;">
                    <div style="color:#242424; font-size:15px; line-height:1.5;">Oferta de %%=v(@OfertaData)=%%: <b>%%=v(@OfertaProduto)=%%</b></div>
                    <div style="margin:8px 0 4px 0; color:#2C3490; font-size:26px; line-height:1.15; font-weight:700;"><span style="font-size:14px; font-weight:400;">a partir de</span> R$ %%=v(@OfertaPrecoTxt)=%%</div>
                    <div style="margin:0 0 16px 0; color:#5A607F; font-size:12px; line-height:1.45;">pagando com o cartão +amigo, em cidades e regiões participantes. Acompanhe as ofertas da semana.</div>
                    %%[ IF NOT EMPTY(@LinkCTA1) THEN ]%%
                    <a alias="bloco3_oferta" href="%%=RedirectTo(TreatAsContent(@LinkCTA1))=%%" target="_blank" style="display:inline-block; border-radius:10px; background-color:#2C3490; color:#ffffff; padding:13px 20px; font-size:13px; line-height:18px; text-align:center; text-decoration:none; font-weight:700;">PEDIR MEU CARTÃO +AMIGO</a>
                    %%[ ENDIF ]%%
                  </td>
                  <td width="42%" align="center" valign="middle" class="stack-column stack-image" style="width:42%; padding:10px 22px 18px 8px;">
                    %%[ IF NOT EMPTY(@OfertaImagem) THEN ]%%
                    <img src="%%=v(@OfertaImagem)=%%" alt="%%=v(@OfertaProduto)=%%" width="200" style="display:block; width:100%; max-width:200px; height:auto; border:0; margin:0 auto; border-radius:10px;">
                    %%[ ENDIF ]%%
                  </td>
                </tr>
                <tr>
                  <td colspan="2" style="padding:0 22px 18px 22px; color:#8A8FA8; font-size:10px; line-height:1.45;">Ofertas válidas na data indicada, nas lojas das cidades e regiões participantes, enquanto durarem os estoques. Preço promocional exclusivo para pagamento com o Cartão de crédito +amigo, sujeito a análise de crédito. Limite por cliente conforme a oferta. Imagens meramente ilustrativas.</td>
                </tr>
              </table>
            </td>
          </tr>
          %%[ ENDIF ]%%
`;

const MOBILE_ANCHOR = '      .stack-image { padding: 8px 22px 24px 22px !important; }\n';
const MOBILE_V13 = `${MOBILE_ANCHOR}      .hdr-copy { padding: 26px 20px 6px 20px !important; }
      .hdr-title { font-size: 24px !important; }
      .hdr-sub { font-size: 16px !important; margin-top: 12px !important; }
      .hdr-card { padding: 4px 48px 0 48px !important; }
`;

function buildPlurixV13(): string {
  let source = replaceOnce(PLURIX_V12_TEMPLATE, V12_HEADER_COMMENT, V13_HEADER_COMMENT, 'comentário de abertura');
  source = source.split('@PLXV12Inicializado').join('@PLXV13Inicializado');
  source = replaceOnce(source, V12_TP, V13_TP, 'tipo de campanha');
  source = replaceOnce(source, V12_SEQUENCE, V13_SEQUENCE, 'sequência');
  source = replaceOnce(source, V12_LAST_FIELD, V13_LAST_FIELD, 'campos do header');
  source = replaceOnce(source, V12_HEADER_MODE, V13_HEADER_MODE, 'modo do header');
  source = replaceOnce(source, V12_POOL_OFF, V13_POOL, 'pool');
  source = replaceOnce(source, V12_IMAGE_HEADER, V13_HTML_HEADER, 'header HTML');
  source = replaceOnce(source, BANNER_3_START, `${POOL_BLOCK}${BANNER_3_START}`, 'bloco 3');
  source = replaceOnce(source, MOBILE_ANCHOR, MOBILE_V13, 'CSS mobile');
  return source;
}

export const PLURIX_V13_TEMPLATE = buildPlurixV13();
