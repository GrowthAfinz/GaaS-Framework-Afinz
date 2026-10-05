import { PLURIX_V9_TEMPLATE } from './plurixV9Template';

export const PLURIX_V10_TEMPLATE_ID = 'builtin-plurix-v10';
export const PLURIX_V10_TEMPLATE_NAME = 'PLURIX V10 · header dinâmico, limite e pool';

/**
 * V10 = V9 + três recursos que dependem de dados fora do briefing:
 *
 * 1. Header dinâmico: HEADER com link "http..." continua sendo imagem; com um código
 *    (ex.: HDR_PECA_V1) o header é montado em HTML a partir da DE TB_HEADER_VARIACOES,
 *    com o logo da rede vindo de TB_REDE_ASSETS.
 * 2. Faixa de limite pré-aprovado: aparece em todos os e-mails para quem tem LIMITE.
 * 3. Bloco 3: oferta do dia do pool (DE_POOL_OFERTAS_PLURIX), escolhida dentro do
 *    AMPscript. Sem oferta vigente, o bloco não aparece; nunca derruba o envio.
 *
 * A prévia da Fábrica não executa este preparo: as mesmas regras estão espelhadas em
 * domain/topoPlurixV10.ts. Mudou uma, mude a outra.
 */

const SETUP_END = `ELSE RaiseError("Dados de briefing da campanha não encontrados.", true)
ENDIF
]%%`;

const V10_SETUP = `ELSE RaiseError("Dados de briefing da campanha não encontrados.", true)
ENDIF

/* ---------- V10 · header dinâmico ---------- */
SET @HeaderModo = ""
SET @HdrTitulo = ""
SET @HdrSubtitulo = ""
SET @HdrCartao = ""
SET @HdrFundo = "#4A5BA6"
SET @HdrCorTitulo = "#E7A921"
SET @HdrCorSubtitulo = "#EADFCE"
IF NOT EMPTY(@Header) THEN
  IF IndexOf(@Header, "http") == 1 THEN
    SET @HeaderModo = "imagem"
  ELSE
    SET @HdrRows = LookupRows("TB_HEADER_VARIACOES", "CODIGO", Trim(@Header))
    IF RowCount(@HdrRows) > 0 THEN
      SET @HdrRow = Row(@HdrRows, 1)
      SET @HeaderModo = "html"
      SET @HdrTitulo = Field(@HdrRow, "TITULO")
      SET @HdrSubtitulo = Field(@HdrRow, "SUBTITULO")
      SET @HdrCartao = Field(@HdrRow, "IMAGEM_CARTAO")
      SET @HdrFundo = Field(@HdrRow, "COR_FUNDO")
      SET @HdrCorTitulo = Field(@HdrRow, "COR_TITULO")
      SET @HdrCorSubtitulo = Field(@HdrRow, "COR_SUBTITULO")
    ENDIF
  ENDIF
ENDIF
SET @HdrLogoRede = Lookup("TB_REDE_ASSETS", "LOGO_HEADER", "NM_PRODUTO_INTERNO", @Produto)

/* ---------- V10 · limite pré-aprovado ---------- */
SET @LimiteFmt = Trim(Replace(@LimiteNovo, "R$", ""))
IF NOT EMPTY(@LimiteFmt) THEN
  IF NOT EMPTY(RegExMatch(@LimiteFmt, "^[0-9]+(\\.[0-9]{1,2})?$", 0)) THEN
    SET @LimiteFmt = FormatNumber(@LimiteFmt, "N2", "pt-BR")
  ENDIF
ENDIF

/* ---------- V10 · oferta do dia do pool ----------
   Regra (igual a selectPoolOfferOfDay): ofertas ativas da rede, vigentes hoje e com preço;
   agrupadas por nome do produto; vence o produto com mais linhas (regiões); empate, menor preço.
   Mostra "a partir de" o menor preço do produto, com a imagem dessa linha. */
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
ENDIF
]%%`;

const V9_HEADER_BLOCK = `          %%[ IF NOT EMPTY(@Header) THEN ]%%
          <tr>
            <td align="center" style="background-color:#eef1f5;">
              <img src="%%=v(@Header)=%%" alt="Oferta do cartão +amigo" width="600" style="display:block; width:100%; max-width:600px; height:auto; border:0;">
            </td>
          </tr>
          %%[ ENDIF ]%%`;

const V10_HEADER_BLOCK = `          %%[ IF @HeaderModo == "imagem" THEN ]%%
          <tr>
            <td align="center" style="background-color:#eef1f5;">
              <img src="%%=v(@Header)=%%" alt="Oferta do cartão +amigo" width="600" style="display:block; width:100%; max-width:600px; height:auto; border:0;">
            </td>
          </tr>
          %%[ ENDIF ]%%
          %%[ IF @HeaderModo == "html" THEN ]%%
          <!-- V10: header dinâmico (TB_HEADER_VARIACOES) -->
          <tr>
            <td bgcolor="%%=v(@HdrFundo)=%%" style="padding:0; background-color:%%=v(@HdrFundo)=%%;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="56%" valign="middle" class="stack-column hdr-copy" style="width:56%; padding:34px 12px 30px 30px;">
                    <div class="hdr-title" style="margin:0 0 12px 0; color:%%=v(@HdrCorTitulo)=%%; font-size:30px; line-height:1.15; font-weight:700;">%%=v(@HdrTitulo)=%%</div>
                    %%[ IF NOT EMPTY(@HdrSubtitulo) THEN ]%%
                    <div class="hdr-sub" style="margin:0 0 18px 0; color:%%=v(@HdrCorSubtitulo)=%%; font-size:18px; line-height:1.4;">%%=v(@HdrSubtitulo)=%%</div>
                    %%[ ENDIF ]%%
                    %%[ IF NOT EMPTY(@HdrLogoRede) THEN ]%%
                    <img class="hdr-logo" src="%%=v(@HdrLogoRede)=%%" alt="" height="18" style="display:block; height:18px; width:auto; border:0;">
                    %%[ ENDIF ]%%
                  </td>
                  <td width="44%" align="center" valign="bottom" class="stack-column hdr-card" style="width:44%; padding:22px 22px 0 0;">
                    %%[ IF NOT EMPTY(@HdrCartao) THEN ]%%
                    <img src="%%=v(@HdrCartao)=%%" alt="Cartão +amigo Visa" width="240" style="display:block; width:100%; max-width:240px; height:auto; border:0; margin:0 auto;">
                    %%[ ENDIF ]%%
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          %%[ ENDIF ]%%
          %%[ IF NOT EMPTY(@LimiteFmt) THEN ]%%
          <!-- V10: faixa de limite pré-aprovado (só para quem tem LIMITE) -->
          <tr>
            <td align="center" class="content-pad" bgcolor="#FFF4D6" style="padding:14px 32px; background-color:#FFF4D6;">
              <div style="max-width:520px; margin:0 auto; color:#2C3490; font-size:16px; line-height:1.45; font-weight:700; text-align:center;">Boa notícia, %%=v(@FirstName)=%%: você tem R$ %%=v(@LimiteFmt)=%% de limite pré-aprovado no cartão +amigo.</div>
            </td>
          </tr>
          %%[ ENDIF ]%%`;

/** Marcador inofensivo no HTML; a prévia da Fábrica troca por um pino invisível do bloco. */
export const POOL_ANCHOR_COMMENT = '<!-- GAAS:POOL_ANCHOR -->';

const BANNER_3_START = '          %%[ IF NOT EMPTY(@Banner3Corpo) THEN ]%%';

const POOL_BLOCK = `          %%[ IF NOT EMPTY(@OfertaProduto) THEN ]%%
          <!-- V10: bloco 3, oferta do dia do pool de ofertas -->
          <tr>
            <td class="content-pad" style="padding:8px 24px 28px 24px; background-color:#ffffff;">
              ${POOL_ANCHOR_COMMENT}
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
const MOBILE_V10 = `${MOBILE_ANCHOR}      .hdr-copy { padding: 26px 22px 8px 22px !important; text-align: center !important; }
      .hdr-title { font-size: 26px !important; }
      .hdr-logo { margin: 0 auto !important; }
      .hdr-card { padding: 8px 40px 0 40px !important; }
`;

const replaceOnce = (source: string, anchor: string, replacement: string, label: string) => {
  const count = source.split(anchor).length - 1;
  if (count !== 1) throw new Error(`PLURIX V10: âncora "${label}" encontrada ${count} vezes no V9 (esperado 1).`);
  return source.replace(anchor, replacement);
};

function buildPlurixV10Template(): string {
  let source = replaceOnce(PLURIX_V9_TEMPLATE, SETUP_END, V10_SETUP, 'fim do preparo');
  source = replaceOnce(source, V9_HEADER_BLOCK, V10_HEADER_BLOCK, 'header');
  source = replaceOnce(source, BANNER_3_START, `${POOL_BLOCK}${BANNER_3_START}`, 'banner 3');
  source = replaceOnce(source, MOBILE_ANCHOR, MOBILE_V10, 'CSS mobile');
  return source;
}

export const PLURIX_V10_TEMPLATE = buildPlurixV10Template();
