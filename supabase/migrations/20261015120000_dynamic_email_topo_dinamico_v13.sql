-- TOPO DE FUNIL DINÂMICO: régua nova de topo Plurix com o template PLURIX V13.
-- Gerado por scripts/email-factory/build-topo-dinamico-seed.ts a partir da aba "Briefing Fábrica"
-- (linhas 9 a 46, E-mail 1 a 3). Idempotente.
--
-- 1. Template candidato PLURIX V13 (fonte completa, sem placeholder).
-- 2. A régua V10 em rascunho (TP "Topo de Funil", nunca publicada) vai para a Lixeira: a régua nova
--    usa o mesmo TP_CAMPANHA e passa a ser a única com essa chave.
-- 3. Régua, 3 planos de e-mail e 18 rascunhos (3 e-mails x 6 redes), com versão 1 no histórico.
-- Colunas novas do header (HEADER_TITULO, HEADER_SUBTITULO, HEADER_IMAGEM_CARTAO, HEADER_LOGO)
-- vivem em briefing_data (jsonb): não exigem DDL.

insert into public.dynamic_email_template_slots (id, name, source, is_principal, status, version)
values ($gaas$builtin-plurix-v13$gaas$, $gaas$PLURIX V13 · topo dinâmico (header no briefing, limite e pool)$gaas$, $gaas$%%[
/* PLURIX V13 (candidata): topo dinâmico. V12 + header no briefing (HEADER_TITULO,
   HEADER_SUBTITULO, HEADER_IMAGEM_CARTAO, HEADER_LOGO), TP "Topo de Funil", E-mail 1 a 8 e pool.
   Base V12: V11 + texto da faixa de limite vindo do briefing (MENSAGEM_LIMITE).
   Base: PLURIX V11, um unico motor, dois toques CRM.
   Identidade/nome/rede/limite: COMUNICACAO_PLX.
   Posicao atual: ESTADO_SEQUENCIA_CRM, uma linha por CPF.
   Conteudo: TB_BRIEFING_CAMPANHA_AQUISICAO.
   Sem escrita em DE, sem sequencia fixa, sem fallback para snapshot.
   O mesmo preparo inicializa preheader e corpo uma vez por mensagem. */
IF EMPTY(@PLXV13Inicializado) THEN
SET @DE_AUDIENCIA = "COMUNICACAO_PLX"
SET @DE_ESTADO = "ESTADO_SEQUENCIA_CRM"
SET @DE_BRIEFING = "TB_BRIEFING_CAMPANHA_AQUISICAO"
SET @Chave = Trim(AttributeValue("CPF"))
IF EMPTY(@Chave) THEN
  SET @Chave = Trim(AttributeValue("_subscriberkey"))
ENDIF
IF EMPTY(@Chave) THEN
  RaiseError("PLX_KEY_MISSING: identificador ausente.", true)
ENDIF
SET @AudRows = LookupRows(@DE_AUDIENCIA, "CPF", @Chave)
IF RowCount(@AudRows) != 1 THEN
  RaiseError("PLX_AUDIENCE_CARDINALITY: esperado um registro.", true)
ENDIF
SET @AudRow = Row(@AudRows, 1)
SET @FirstName = Field(@AudRow, "FIRST_NAME")
SET @LimiteNovo = Trim(Field(@AudRow, "LIMITE_CRD"))
SET @Rede = Uppercase(Trim(Field(@AudRow, "INVESTIDA")))
SET @Produto = ""
IF @Rede == "AMIGAO" OR @Rede == "AMIGÃO" THEN
  SET @Produto = "AMIGAO"
ELSEIF @Rede == "BOA" THEN
  SET @Produto = "BOA"
ELSEIF @Rede == "AVENIDA" THEN
  SET @Produto = "AVENIDA"
ELSEIF @Rede == "COMPRE MAIS" THEN
  SET @Produto = "COMPRE MAIS"
ELSEIF @Rede == "PARANA" OR @Rede == "PARANÁ" THEN
  SET @Produto = "PARANA"
ELSEIF @Rede == "SUPERPAO" OR @Rede == "SUPERPÃO" THEN
  SET @Produto = "SUPERPAO"
ELSE
  RaiseError("PLX_NETWORK_UNKNOWN: INVESTIDA sem mapeamento aprovado.", true)
ENDIF
SET @TpCampanha = "Topo de Funil"
/* Consultar a posicao atual na DE separada, nunca na audiencia/entrada. */
SET @EstadoRows = LookupRows(@DE_ESTADO, "CPF", @Chave)
SET @EstadoCount = RowCount(@EstadoRows)
IF @EstadoCount != 1 THEN
  RaiseError("PLX_STATE_CARDINALITY: esperado um estado por CPF.", true)
ENDIF
SET @EstadoRow = Row(@EstadoRows, 1)
SET @Sequencia = Trim(Field(@EstadoRow, "SEQUENCIA"))
IF EMPTY(RegExMatch(@Sequencia, "^E-mail [1-8]$", 0)) THEN
  RaiseError("PLX_SEQUENCE_INVALID: esperado E-mail 1 a E-mail 8.", true)
ENDIF
SET @Today = NOW()
/* Duas linhas bastam para detectar duplicidade; não escolher a mais recente. */
SET @BriefingRows = LookupOrderedRows(@DE_BRIEFING, 2, "DT_INICIO DESC",
  "NM_PRODUTO_INTERNO", @Produto, "SEQUENCIA", @Sequencia, "TP_CAMPANHA", @TpCampanha)
SET @RowCount = RowCount(@BriefingRows)
IF @RowCount == 1 THEN
SET @Row = Row(@BriefingRows, 1)
SET @DtInicio = Field(@Row, "DT_INICIO")
SET @DtFim = Field(@Row, "DT_FIM")
IF EMPTY(@DtInicio) OR EMPTY(@DtFim) THEN
  RaiseError("PLX_VALIDITY_MISSING: vigencia obrigatoria.", true)
ENDIF
/* Datas devem ser campos Date, no mesmo referencial temporal da BU. */
IF @Today < @DtInicio OR @Today > @DtFim THEN
  RaiseError("PLX_VALIDITY_OUTSIDE: briefing fora da vigencia.", true)
ENDIF
SET @Assunto = Field(@Row, "ASSUNTO")
SET @PreCabecalho = Field(@Row, "PRE_CABECALHO")
SET @Header = Field(@Row, "HEADER")
SET @CartaoNmComercial = Field(@Row, "CARTAO_NM_COMERCIAL")
SET @TituloCopy1 = Field(@Row, "TITULO_COPY_1_AZUL")
SET @CorCopy1 = Field(@Row, "COR_COPY_1")
SET @TamanhoFonteTituloCopy1 = Field(@Row, "TAMANHO_DA_FONTE_TITULO_COPY_1")
SET @Copy1Preto = Field(@Row, "COPY_1_PRETO")
SET @CorCopyPreto1 = Field(@Row, "COR_COPY_PRETO_1")
SET @TamanhoFonteCopyPreto1 = Field(@Row, "TAMANHO_DA_FONTE_TITULO_COPY_PRETO_1")
SET @TituloCTA1 = Field(@Row, "TITULO_CTA_1")
SET @LinkCTA1 = Field(@Row, "LINK_CTA_1")
SET @TituloCopy2 = Field(@Row, "TITULO_COPY_2")
SET @CorTituloCopy2 = Field(@Row, "COR_TITULO_COPY_2")
SET @TamanhoFonteTituloCopy2 = Field(@Row, "TAMANHO_DA_FONTE_TITULO_COPY_2")
SET @Copy2Preto = Field(@Row, "COPY_2_PRETO")
SET @CorCopy2 = Field(@Row, "COR_COPY_2")
SET @TamanhoFonteCopy2 = Field(@Row, "TAMANHO_DA_FONTE_COPY_2")
SET @TituloCTA2 = Field(@Row, "TITULO_CTA_2")
SET @LinkCTA2 = Field(@Row, "LINK_CTA_2")
SET @Banner1Corpo = Field(@Row, "BANNER_1_CORPO")
SET @LinkBanner1 = Field(@Row, "LINK_BANNER_1_CORPO")
SET @Banner2Corpo = Field(@Row, "BANNER_2_CORPO")
SET @LinkBanner2 = Field(@Row, "LINK_BANNER_2_CORPO")
SET @Banner3Corpo = Field(@Row, "BANNER_3_CORPO")
SET @LinkBanner3 = Field(@Row, "LINK_BANNER_3_CORPO")
SET @NotaLegal = Field(@Row, "NOTA_LEGAL")
SET @CorNotaLegal = Field(@Row, "COR_NOTA_LEGAL")
SET @TamanhoFonteNotaLegal = Field(@Row, "TAMANHO_DA_FONTE_NOTA_LEGAL")
SET @Rodape = Field(@Row, "RODAPE")
SET @MensagemLimite = Field(@Row, "MENSAGEM_LIMITE")
SET @HdrTitulo = Field(@Row, "HEADER_TITULO")
SET @HdrSubtitulo = Field(@Row, "HEADER_SUBTITULO")
SET @HdrCartao = Field(@Row, "HEADER_IMAGEM_CARTAO")
SET @HdrLogo = Field(@Row, "HEADER_LOGO")
ELSE RaiseError("PLX_BRIEFING_CARDINALITY: chave ausente ou duplicada.", true)
ENDIF

/* ---------- V10 · nome do cliente ---------- */
/* PRI_NOME vem em maiúsculas da base (ex.: VANIA); a saudação usa só a inicial maiúscula (Vania). */
SET @FirstName = ProperCase(Trim(@FirstName))

/* V13: com HEADER_TITULO, header dinâmico em HTML; senão, HEADER como imagem HTTPS. */
SET @HeaderModo = ""
IF NOT EMPTY(@HdrTitulo) THEN
  SET @HeaderModo = "html"
ELSEIF NOT EMPTY(@Header) THEN
  IF IndexOf(Lowercase(Trim(@Header)), "https://") != 1 THEN
    RaiseError("PLX_HEADER_INVALID: usar imagem HTTPS nesta versao.", true)
  ENDIF
  SET @HeaderModo = "imagem"
ENDIF

/* LIMITE_CRD: campo numerico; ausente/zero não inventa pré-aprovação.
   Valor não numérico é erro de contrato. Elegibilidade fica fora do HTML. */
SET @LimiteFmt = ""
IF NOT EMPTY(@LimiteNovo) THEN
  IF EMPTY(RegExMatch(@LimiteNovo, "^[0-9]+(\.[0-9]{1,2})?$", 0)) THEN
    RaiseError("PLX_LIMIT_INVALID: LIMITE_CRD deve ser numerico.", true)
  ENDIF
  IF Add(@LimiteNovo, 0) > 0 THEN
    SET @LimiteFmt = FormatNumber(@LimiteNovo, "N2", "pt-BR")
  ENDIF
ENDIF

/* V12: texto da faixa vem do briefing. Apenas {{nome}} e {{limite}} sao trocados;
   o campo nao passa por TreatAsContent. Sem limite positivo ou sem mensagem, sem faixa. */
SET @FaixaLimite = ""
IF NOT EMPTY(@LimiteFmt) AND NOT EMPTY(@MensagemLimite) THEN
  SET @NomeFaixa = @FirstName
  IF EMPTY(@NomeFaixa) THEN
    SET @NomeFaixa = "cliente"
  ENDIF
  SET @FaixaLimite = Replace(Replace(Trim(@MensagemLimite), "{{nome}}", @NomeFaixa), "{{limite}}", @LimiteFmt)
  IF IndexOf(@FaixaLimite, "{{") > 0 OR IndexOf(@FaixaLimite, "%%") > 0 THEN
    SET @FaixaLimite = ""
  ENDIF
ENDIF

/* V13 · oferta do dia do pool (mesma regra da V10 e de selectPoolOfferOfDay):
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
    IF NOT EMPTY(RegExMatch(@PPreco, "^[0-9]+(\.[0-9]+)?$", 0)) THEN
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
SET @PLXV13Inicializado = "S"
ENDIF
]%%
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>%%=TreatAsContent(@Assunto)=%%</title>
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; }
    @media only screen and (max-width: 620px) {
      .email-shell { width: 100% !important; }
      .content-pad { padding-left: 22px !important; padding-right: 22px !important; }
      .brand-pad { padding-top: 20px !important; padding-bottom: 20px !important; }
      .brand-logo { width: 164px !important; }
      .headline { font-size: 24px !important; line-height: 1.2 !important; }
      .body-copy { font-size: 17px !important; line-height: 1.55 !important; }
      .cta-cell, .cta-link { display: block !important; width: 100% !important; box-sizing: border-box !important; }
      .cta-link { padding-left: 18px !important; padding-right: 18px !important; }
      .legal-pad { padding-left: 22px !important; padding-right: 22px !important; }
      .stack-column { display: block !important; width: 100% !important; box-sizing: border-box !important; }
      .stack-copy { padding: 24px 22px 10px 22px !important; text-align: center !important; }
      .stack-image { padding: 8px 22px 24px 22px !important; }
      .hdr-copy { padding: 26px 22px 8px 22px !important; text-align: center !important; }
      .hdr-title { font-size: 26px !important; }
      .hdr-logo { margin: 0 auto !important; }
      .hdr-card { padding: 8px 40px 0 40px !important; }
      .hdr-copy { padding: 26px 22px 8px 22px !important; text-align: center !important; }
      .hdr-title { font-size: 26px !important; }
      .hdr-logo { margin: 0 auto !important; }
      .hdr-card { padding: 8px 40px 0 40px !important; }
    }
  </style>
</head>
<body style="margin:0; padding:0; background-color:#f2f4f7; font-family:Arial, Helvetica, sans-serif; color:#242424;">
  <div style="display:none; max-height:0; overflow:hidden; opacity:0; color:transparent; mso-hide:all;">
    %%=TreatAsContent(@PreCabecalho)=%%&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%; background-color:#f2f4f7;">
    <tr>
      <td align="center" style="padding:18px 10px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" class="email-shell" style="width:600px; max-width:600px; background-color:#ffffff; border-radius:12px; overflow:hidden;">
          <tr>
            <td align="center" class="brand-pad" style="padding:24px 20px; background-color:#ffffff;">
              <a href="https://clubemaisamigo.com.br" target="_blank" rel="noopener noreferrer" style="text-decoration:none;">
                <img class="brand-logo" src="https://stoplxmkt.blob.core.windows.net/plxmkt/20240513-EM-JORNADA_DE_AQUISICAO_MAIS_AMIGO-AFINZ/logo-mais-amigo.png" alt="+amigo" width="190" style="display:block; width:190px; max-width:100%; height:auto; border:0;">
              </a>
            </td>
          </tr>
          %%[ IF @HeaderModo == "imagem" THEN ]%%
          <tr>
            <td align="center" style="background-color:#eef1f5;">
              <img src="%%=v(@Header)=%%" alt="Oferta do cartão +amigo" width="600" style="display:block; width:100%; max-width:600px; height:auto; border:0;">
            </td>
          </tr>
          %%[ ENDIF ]%%
          %%[ IF @HeaderModo == "html" THEN ]%%
          <!-- V13: header dinâmico, textos e imagens do próprio briefing -->
          <tr>
            <td bgcolor="#4A5BA6" style="padding:0; background-color:#4A5BA6;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="56%" valign="middle" class="stack-column hdr-copy" style="width:56%; padding:34px 12px 30px 30px;">
                    <div class="hdr-title" style="margin:0 0 12px 0; color:#E7A921; font-size:30px; line-height:1.15; font-weight:700;">%%=v(@HdrTitulo)=%%</div>
                    %%[ IF NOT EMPTY(@HdrSubtitulo) THEN ]%%
                    <div class="hdr-sub" style="margin:0 0 18px 0; color:#EADFCE; font-size:18px; line-height:1.4;">%%=v(@HdrSubtitulo)=%%</div>
                    %%[ ENDIF ]%%
                    %%[ IF NOT EMPTY(@HdrLogo) THEN ]%%
                    <img class="hdr-logo" src="%%=v(@HdrLogo)=%%" alt="+amigo" height="26" style="display:block; height:26px; width:auto; border:0;">
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
          %%[ IF NOT EMPTY(@FaixaLimite) THEN ]%%
          <!-- V12: faixa de limite pré-aprovado, texto da coluna MENSAGEM_LIMITE -->
          <tr>
            <td align="center" class="content-pad" bgcolor="#FFF4D6" style="padding:14px 32px; background-color:#FFF4D6;">
              <div style="max-width:520px; margin:0 auto; color:#2C3490; font-size:16px; line-height:1.45; font-weight:700; text-align:center;">%%=v(@FaixaLimite)=%%</div>
            </td>
          </tr>
          %%[ ENDIF ]%%
          %%[ IF @Sequencia == "E-mail 1" THEN ]%%
          <!-- E-mail 1: descoberta dos benefícios e passo a passo -->
          <tr>
            <td align="center" class="content-pad" style="padding:30px 32px 8px 32px; text-align:center;">
              %%[ IF NOT EMPTY(@TituloCopy1) THEN ]%%
              <h1 class="headline" style="max-width:500px; margin:0 auto 16px auto; color:%%=v(@CorCopy1)=%%; font-size:%%=v(@TamanhoFonteTituloCopy1)=%%px; line-height:1.25; font-weight:700; text-align:center;">%%=TreatAsContent(@TituloCopy1)=%%</h1>
              %%[ ENDIF ]%%
              %%[ IF NOT EMPTY(@Copy1Preto) THEN ]%%
              <div class="body-copy" style="max-width:500px; margin:0 auto; color:%%=v(@CorCopyPreto1)=%%; font-size:%%=v(@TamanhoFonteCopyPreto1)=%%px; line-height:1.55; text-align:center;">%%=TreatAsContent(@Copy1Preto)=%%</div>
              %%[ ENDIF ]%%
            </td>
          </tr>
          %%[ IF NOT EMPTY(@TituloCTA1) AND NOT EMPTY(@LinkCTA1) THEN ]%%
          <tr>
            <td align="center" class="content-pad cta-cell" style="padding:14px 32px 30px 32px;">
              <a class="cta-link" href="%%=RedirectTo(TreatAsContent(@LinkCTA1))=%%" target="_blank" style="display:inline-block; min-width:280px; border-radius:10px; background-color:#2C3490; color:#ffffff; padding:15px 26px; font-size:15px; line-height:20px; text-align:center; text-decoration:none; font-weight:700;">%%=TreatAsContent(@TituloCTA1)=%%</a>
            </td>
          </tr>
          %%[ ENDIF ]%%
          %%[ IF NOT EMPTY(@Banner1Corpo) THEN ]%%
          <tr>
            <td align="center" class="content-pad" style="padding:16px 32px 4px 32px;">
              %%[ IF NOT EMPTY(@LinkBanner1) THEN ]%%<a href="%%=RedirectTo(TreatAsContent(@LinkBanner1))=%%" target="_blank" style="text-decoration:none;">%%[ ENDIF ]%%
              <img src="%%=v(@Banner1Corpo)=%%" alt="Benefícios do cartão +amigo" width="536" style="display:block; width:100%; max-width:536px; height:auto; border:0;">
              %%[ IF NOT EMPTY(@LinkBanner1) THEN ]%%</a>%%[ ENDIF ]%%
            </td>
          </tr>
          %%[ ENDIF ]%%
          %%[ IF NOT EMPTY(@TituloCopy2) THEN ]%%
          <tr>
            <td align="center" bgcolor="#F6F6FB" class="content-pad" style="padding:26px 32px 24px 32px; background-color:#F6F6FB;">
              <h2 class="headline" style="max-width:500px; margin:0 auto 18px auto; color:%%=v(@CorTituloCopy2)=%%; font-size:%%=v(@TamanhoFonteTituloCopy2)=%%px; line-height:1.25; font-weight:700; text-align:center;">%%=TreatAsContent(@TituloCopy2)=%%</h2>
            </td>
          </tr>
          %%[ ENDIF ]%%
          %%[ IF NOT EMPTY(@Banner2Corpo) THEN ]%%
          <tr>
            <td align="center" bgcolor="#F6F6FB" class="content-pad" style="padding:0 32px 24px 32px; background-color:#F6F6FB;">
              %%[ IF NOT EMPTY(@LinkBanner2) THEN ]%%<a href="%%=RedirectTo(TreatAsContent(@LinkBanner2))=%%" target="_blank" style="text-decoration:none;">%%[ ENDIF ]%%
              <img src="%%=v(@Banner2Corpo)=%%" alt="Como solicitar o cartão +amigo" width="536" style="display:block; width:100%; max-width:536px; height:auto; border:0;">
              %%[ IF NOT EMPTY(@LinkBanner2) THEN ]%%</a>%%[ ENDIF ]%%
            </td>
          </tr>
          %%[ ENDIF ]%%
          %%[ IF NOT EMPTY(@Copy2Preto) OR (NOT EMPTY(@TituloCTA2) AND NOT EMPTY(@LinkCTA2)) THEN ]%%
          <tr>
            <td align="center" class="content-pad cta-cell" style="padding:24px 32px 32px 32px;">
              %%[ IF NOT EMPTY(@Copy2Preto) THEN ]%%
              <div class="body-copy" style="max-width:480px; margin:0 auto 18px auto; color:%%=v(@CorCopy2)=%%; font-size:%%=v(@TamanhoFonteCopy2)=%%px; line-height:1.6; text-align:center;">%%=TreatAsContent(@Copy2Preto)=%%</div>
              %%[ ENDIF ]%%
              %%[ IF NOT EMPTY(@TituloCTA2) AND NOT EMPTY(@LinkCTA2) THEN ]%%
              <a class="cta-link" href="%%=RedirectTo(TreatAsContent(@LinkCTA2))=%%" target="_blank" style="display:inline-block; min-width:280px; border-radius:10px; background-color:#2C3490; color:#ffffff; padding:15px 26px; font-size:15px; line-height:20px; text-align:center; text-decoration:none; font-weight:700;">%%=TreatAsContent(@TituloCTA2)=%%</a>
              %%[ ENDIF ]%%
            </td>
          </tr>
          %%[ ENDIF ]%%
          %%[ ELSE ]%%
          <!-- E-mail 2: economia, benefícios e conversão -->
          <tr>
            <td align="center" class="content-pad" style="padding:30px 32px 12px 32px; text-align:center;">
              %%[ IF NOT EMPTY(@TituloCopy1) THEN ]%%
              <h1 class="headline" style="max-width:500px; margin:0 auto 16px auto; color:%%=v(@CorCopy1)=%%; font-size:%%=v(@TamanhoFonteTituloCopy1)=%%px; line-height:1.25; font-weight:700; text-align:center;">%%=TreatAsContent(@TituloCopy1)=%%</h1>
              %%[ ENDIF ]%%
              %%[ IF NOT EMPTY(@Copy1Preto) THEN ]%%
              <div class="body-copy" style="max-width:500px; margin:0 auto; color:%%=v(@CorCopyPreto1)=%%; font-size:%%=v(@TamanhoFonteCopyPreto1)=%%px; line-height:1.55; text-align:center;">%%=TreatAsContent(@Copy1Preto)=%%</div>
              %%[ ENDIF ]%%
            </td>
          </tr>
          %%[ IF NOT EMPTY(@Banner1Corpo) THEN ]%%
          <tr>
            <td align="center" class="content-pad" style="padding:8px 32px 16px 32px;">
              %%[ IF NOT EMPTY(@LinkBanner1) THEN ]%%<a href="%%=RedirectTo(TreatAsContent(@LinkBanner1))=%%" target="_blank" style="text-decoration:none;">%%[ ENDIF ]%%
              <img src="%%=v(@Banner1Corpo)=%%" alt="" width="536" style="display:block; width:100%; max-width:536px; height:auto; border:0;">
              %%[ IF NOT EMPTY(@LinkBanner1) THEN ]%%</a>%%[ ENDIF ]%%
            </td>
          </tr>
          %%[ ENDIF ]%%
          %%[ IF NOT EMPTY(@TituloCTA1) AND NOT EMPTY(@LinkCTA1) THEN ]%%
          <tr>
            <td align="center" class="content-pad cta-cell" style="padding:14px 32px 30px 32px;">
              <a class="cta-link" href="%%=RedirectTo(TreatAsContent(@LinkCTA1))=%%" target="_blank" style="display:inline-block; min-width:280px; border-radius:10px; background-color:#2C3490; color:#ffffff; padding:15px 26px; font-size:15px; line-height:20px; text-align:center; text-decoration:none; font-weight:700;">%%=TreatAsContent(@TituloCTA1)=%%</a>
            </td>
          </tr>
          %%[ ENDIF ]%%
          %%[ IF @Sequencia == "E-mail 2" THEN ]%%
          %%[ IF NOT EMPTY(@TituloCopy2) OR NOT EMPTY(@Copy2Preto) THEN ]%%
          <tr>
            <td align="center" bgcolor="#F6F6FB" class="content-pad" style="padding:28px 32px; background-color:#F6F6FB;">
              %%[ IF NOT EMPTY(@TituloCopy2) THEN ]%%
              <h2 class="headline" style="max-width:500px; margin:0 auto 20px auto; color:%%=v(@CorTituloCopy2)=%%; font-size:%%=v(@TamanhoFonteTituloCopy2)=%%px; line-height:1.25; font-weight:700; text-align:center;">%%=TreatAsContent(@TituloCopy2)=%%</h2>
              %%[ ENDIF ]%%
              %%[ IF NOT EMPTY(@Copy2Preto) THEN ]%%
              <div class="body-copy" style="max-width:480px; margin:0 auto; padding:18px 20px; border:1px solid #E1E3F2; border-radius:12px; background-color:#ffffff; color:%%=v(@CorCopy2)=%%; font-size:%%=v(@TamanhoFonteCopy2)=%%px; line-height:1.75; text-align:left;">%%=TreatAsContent(@Copy2Preto)=%%</div>
              %%[ ENDIF ]%%
            </td>
          </tr>
          %%[ ENDIF ]%%
          %%[ IF NOT EMPTY(@TituloCTA2) OR NOT EMPTY(@Banner2Corpo) THEN ]%%
          <tr>
            <td style="padding:0; background-color:#ffffff;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="55%" valign="middle" class="stack-column stack-copy" style="width:55%; padding:30px 12px 30px 32px;">
                    <h2 style="margin:0 0 10px 0; color:#2C3490; font-size:24px; line-height:1.25; font-weight:700;">Peça agora seu cartão +amigo</h2>
                    <p style="margin:0 0 18px 0; color:#454A64; font-size:15px; line-height:1.55;">Comece a aproveitar os benefícios nas suas compras do dia a dia.</p>
                    %%[ IF NOT EMPTY(@TituloCTA2) AND NOT EMPTY(@LinkCTA2) THEN ]%%
                    <a href="%%=RedirectTo(TreatAsContent(@LinkCTA2))=%%" target="_blank" style="display:inline-block; border-radius:10px; background-color:#2C3490; color:#ffffff; padding:14px 20px; font-size:13px; line-height:18px; text-align:center; text-decoration:none; font-weight:700;">%%=TreatAsContent(@TituloCTA2)=%%</a>
                    %%[ ENDIF ]%%
                  </td>
                  <td width="45%" align="center" valign="middle" class="stack-column stack-image" style="width:45%; padding:24px 28px 24px 8px;">
                    %%[ IF NOT EMPTY(@Banner2Corpo) THEN ]%%
                    %%[ IF NOT EMPTY(@LinkBanner2) THEN ]%%<a href="%%=RedirectTo(TreatAsContent(@LinkBanner2))=%%" target="_blank" style="text-decoration:none;">%%[ ENDIF ]%%
                    <img src="%%=v(@Banner2Corpo)=%%" alt="Cartões +amigo" width="220" style="display:block; width:100%; max-width:220px; height:auto; border:0; margin:0 auto;">
                    %%[ IF NOT EMPTY(@LinkBanner2) THEN ]%%</a>%%[ ENDIF ]%%
                    %%[ ENDIF ]%%
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          %%[ ENDIF ]%%
          %%[ ELSE ]%%
          %%[ IF NOT EMPTY(@TituloCopy2) OR NOT EMPTY(@Copy2Preto) OR (NOT EMPTY(@TituloCTA2) AND NOT EMPTY(@LinkCTA2)) OR NOT EMPTY(@Banner2Corpo) THEN ]%%
          <tr>
            <td style="padding:0; background-color:#ffffff;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="55%" valign="middle" class="stack-column stack-copy" style="width:55%; padding:30px 12px 30px 32px;">
                    %%[ IF NOT EMPTY(@TituloCopy2) THEN ]%%
                    <h2 style="margin:0 0 10px 0; color:%%=v(@CorTituloCopy2)=%%; font-size:%%=v(@TamanhoFonteTituloCopy2)=%%px; line-height:1.25; font-weight:700;">%%=TreatAsContent(@TituloCopy2)=%%</h2>
                    %%[ ENDIF ]%%
                    %%[ IF NOT EMPTY(@Copy2Preto) THEN ]%%
                    <div style="margin:0 0 18px 0; color:%%=v(@CorCopy2)=%%; font-size:%%=v(@TamanhoFonteCopy2)=%%px; line-height:1.55;">%%=TreatAsContent(@Copy2Preto)=%%</div>
                    %%[ ENDIF ]%%
                    %%[ IF NOT EMPTY(@TituloCTA2) AND NOT EMPTY(@LinkCTA2) THEN ]%%
                    <a href="%%=RedirectTo(TreatAsContent(@LinkCTA2))=%%" target="_blank" style="display:inline-block; border-radius:10px; background-color:#2C3490; color:#ffffff; padding:14px 20px; font-size:13px; line-height:18px; text-align:center; text-decoration:none; font-weight:700;">%%=TreatAsContent(@TituloCTA2)=%%</a>
                    %%[ ENDIF ]%%
                  </td>
                  <td width="45%" align="center" valign="middle" class="stack-column stack-image" style="width:45%; padding:24px 28px 24px 8px;">
                    %%[ IF NOT EMPTY(@Banner2Corpo) THEN ]%%
                    %%[ IF NOT EMPTY(@LinkBanner2) THEN ]%%<a href="%%=RedirectTo(TreatAsContent(@LinkBanner2))=%%" target="_blank" style="text-decoration:none;">%%[ ENDIF ]%%
                    <img src="%%=v(@Banner2Corpo)=%%" alt="" width="220" style="display:block; width:100%; max-width:220px; height:auto; border:0; margin:0 auto;">
                    %%[ IF NOT EMPTY(@LinkBanner2) THEN ]%%</a>%%[ ENDIF ]%%
                    %%[ ENDIF ]%%
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          %%[ ENDIF ]%%
          %%[ ENDIF ]%%
          %%[ ENDIF ]%%
          %%[ IF NOT EMPTY(@OfertaProduto) THEN ]%%
          <!-- V13: bloco 3, oferta do dia do pool de ofertas -->
          <tr>
            <td class="content-pad" style="padding:8px 24px 28px 24px; background-color:#ffffff;">
              <!-- GAAS:POOL_ANCHOR -->
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
          %%[ IF NOT EMPTY(@Banner3Corpo) THEN ]%%
          <tr>
            <td align="center" style="padding:0 0 16px 0;">
              %%[ IF NOT EMPTY(@LinkBanner3) THEN ]%%<a href="%%=RedirectTo(TreatAsContent(@LinkBanner3))=%%" target="_blank" style="text-decoration:none;">%%[ ENDIF ]%%
              <img src="%%=v(@Banner3Corpo)=%%" alt="Assinatura da rede de supermercados" width="600" style="display:block; width:100%; max-width:600px; height:auto; border:0;">
              %%[ IF NOT EMPTY(@LinkBanner3) THEN ]%%</a>%%[ ENDIF ]%%
            </td>
          </tr>
          %%[ ENDIF ]%%
          %%[ IF NOT EMPTY(@NotaLegal) THEN ]%%
          <tr>
            <td class="legal-pad" style="padding:18px 32px 28px 32px; border-top:1px solid #e5e7eb; background-color:#ffffff;">
              %%[ IF NOT EMPTY(@NotaLegal) THEN ]%%
              <div style="margin:0 0 14px 0; color:%%=v(@CorNotaLegal)=%%; font-size:%%=v(@TamanhoFonteNotaLegal)=%%px; line-height:1.5;">%%=TreatAsContent(@NotaLegal)=%%</div>
              %%[ ENDIF ]%%
            </td>
          </tr>
          %%[ ENDIF ]%%
          <tr>
            <td align="center" class="legal-pad" style="padding:20px 32px 28px 32px; border-top:1px solid #e5e7eb; background-color:#ffffff; color:#6b7280; font-family:Arial, Helvetica, sans-serif; font-size:10px; line-height:1.5; text-align:center;">
              Este e-mail foi enviado por:<br>
              %%Member_Busname%%<br>
              %%Member_Addr%%, %%Member_City%% - %%Member_State%%<br>
              %%Member_PostalCode%% - %%Member_Country%%<br><br>
              <a href="%%profile_center_url%%" alias="Central de Preferências" target="_blank" style="color:#2C3490; text-decoration:underline;">Gerenciar preferências</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
  <custom name="opencounter" type="tracking"/>
</body>
</html>$gaas$, false, 'active', 1)
on conflict (id) do update set name = excluded.name, source = excluded.source, updated_at = now();

update public.dynamic_email_briefings
set status = 'archived', updated_at = now()
where segment = 'Topo de Funil' and briefing_data->>'TP_CAMPANHA' = 'Topo de Funil' and status = 'draft';

update public.dynamic_email_ruler_strategies
set editorial_status = 'archived', updated_at = now()
where id = 'c10e0000-0000-4000-8000-000000000001';

insert into public.dynamic_email_ruler_strategies (id, name, description, partner, product, segment, objective, audience, journey_stage, business_front, ruler_family, journey_family, journey_type, editorial_status, template_slot_id, version)
values ($gaas$d1d10000-0000-4000-8000-000000000001$gaas$::uuid, 'TOPO DE FUNIL DINÂMICO',
  $gaas$Régua de topo Plurix com header dinâmico (textos e imagens no próprio briefing), faixa de limite vinda do briefing e oferta do pool no bloco 3. Template PLURIX V13: motor único com sequência atual (base V12 testada). Começa com E-mail 1 a 3 da planilha Briefing Fábrica.$gaas$,
  'Plurix', '+amigo', $gaas$Topo de Funil Dinâmico$gaas$,
  'Levar membros do Clube +amigo das 6 redes a pedir o cartão pelo app.',
  'Somente membros do Clube +amigo das 6 redes Plurix. Faixa de limite só para LIMITE_CRD positivo.',
  'Topo de funil', 'acquisition', 'top_of_funnel', 'Aquisição', 'Topo de Funil', 'draft', $gaas$builtin-plurix-v13$gaas$, 1)
on conflict (id) do nothing;

insert into public.dynamic_email_email_strategies (ruler_strategy_id, campaign_group_id, partner, segment, week_key, sequence, subject, preheader, technical_status, editorial_status, visual_status, certification_status, field_provenance, updated_by_type, update_source, change_reason, llm_model, functional_name)
values
($gaas$d1d10000-0000-4000-8000-000000000001$gaas$::uuid, $gaas$d1d10000-0000-4000-8000-0000000000e1$gaas$::uuid, 'Plurix', $gaas$Topo de Funil Dinâmico$gaas$, $gaas$Semana 1$gaas$, $gaas$E-mail 1$gaas$, $gaas$Seu mercado pode render mais com o cartão +amigo$gaas$, $gaas$Você já tem o Clube. Com o cartão, ganha desconto extra em produtos selecionados.$gaas$, 'draft', 'draft', 'needs_review', 'not_tested', $gaas${"import":{"file":"Regua_Plurix_TopoFunil_Proposta_Outubro26.xlsx","sheet":"Briefing Fábrica","rows":"9-46","columns":"E-mail 1 a 3","importedAt":"2026-10-15"},"header":"header dinâmico no briefing (V13)"}$gaas$::jsonb, 'llm', 'llm', 'Importação da planilha Briefing Fábrica (E-mail 1 a 3) como rascunho', 'claude-opus-5-5', $gaas$TOPO DINÂMICO · E-mail 1$gaas$),
($gaas$d1d10000-0000-4000-8000-000000000001$gaas$::uuid, $gaas$d1d10000-0000-4000-8000-0000000000e2$gaas$::uuid, 'Plurix', $gaas$Topo de Funil Dinâmico$gaas$, $gaas$Semana 1$gaas$, $gaas$E-mail 2$gaas$, $gaas$+5% de desconto extra em produtos selecionados$gaas$, $gaas$Você já tem o Clube. Peça seu cartão +amigo e aproveite ainda mais.$gaas$, 'draft', 'draft', 'needs_review', 'not_tested', $gaas${"import":{"file":"Regua_Plurix_TopoFunil_Proposta_Outubro26.xlsx","sheet":"Briefing Fábrica","rows":"9-46","columns":"E-mail 1 a 3","importedAt":"2026-10-15"},"header":"header dinâmico no briefing (V13)"}$gaas$::jsonb, 'llm', 'llm', 'Importação da planilha Briefing Fábrica (E-mail 1 a 3) como rascunho', 'claude-opus-5-5', $gaas$TOPO DINÂMICO · E-mail 2$gaas$),
($gaas$d1d10000-0000-4000-8000-000000000001$gaas$::uuid, $gaas$d1d10000-0000-4000-8000-0000000000e3$gaas$::uuid, 'Plurix', $gaas$Topo de Funil Dinâmico$gaas$, $gaas$Semana 2$gaas$, $gaas$E-mail 3$gaas$, $gaas$Mais economia no carrinho com o cartão +amigo$gaas$, $gaas$Vantagens extras em produtos selecionados do supermercado.$gaas$, 'draft', 'draft', 'needs_review', 'not_tested', $gaas${"import":{"file":"Regua_Plurix_TopoFunil_Proposta_Outubro26.xlsx","sheet":"Briefing Fábrica","rows":"9-46","columns":"E-mail 1 a 3","importedAt":"2026-10-15"},"header":"header dinâmico no briefing (V13)"}$gaas$::jsonb, 'llm', 'llm', 'Importação da planilha Briefing Fábrica (E-mail 1 a 3) como rascunho', 'claude-opus-5-5', $gaas$TOPO DINÂMICO · E-mail 3$gaas$)
on conflict (campaign_group_id) do nothing;

insert into public.dynamic_email_briefings (id, briefing_data, partner, segment, subgroup, week_key, activity_names, campaign_group_id, status, version, template_slot_id, journey_confirmed, import_source)
values
($gaas$d1d10000-0000-4000-8000-000000000101$gaas$::uuid, $gaas${"__id":"d1d10000-0000-4000-8000-000000000101","DT_INICIO":"2026-10-15T00:00","DT_FIM":"2027-10-19T23:59","UTM_CAMPANHA":"PLURIX_TOPO_SEMANA1_EMAIL1_AMIGAO","TP_CAMPANHA":"Topo de Funil","SEQUENCIA":"E-mail 1","ASSUNTO":"Seu mercado pode render mais com o cartão +amigo","PRE_CABECALHO":"Você já tem o Clube. Com o cartão, ganha desconto extra em produtos selecionados.","HEADER":"","CARTAO_NM_COMERCIAL":"+amigo","NM_PRODUTO_INTERNO":"AMIGAO","TITULO_COPY_1_AZUL":"Olá, %%=v(@FirstName)=%%!","COR_COPY_1":"#2C3490","TAMANHO_DA_FONTE_TITULO_COPY_1":"24","TITULO_CTA_1":"Pedir cartão +amigo","LINK_CTA_1":"https://mais-amigo.onelink.me/YU3C/t6v9cyos?c=plx_topo_de_funil_padrao&af_sub1=crm&af_sub2=s1&af_sub3=plx_email_topo_v10_S1D01","COPY_1_PRETO":"Já pensou em aproveitar as melhores <b>vantagens e descontos dentro e fora do Supermercado</b>? Com o <b>cartão de crédito +amigo</b>, você pode <b>economizar em produtos selecionados</b> e ainda contar com benefícios que vão além das compras. Peça seu cartão e aproveite:","COR_COPY_PRETO_1":"#242424","TAMANHO_DA_FONTE_TITULO_COPY_PRETO_1":"18","TITULO_COPY_2":"São mais possibilidades para fazer suas <b>compras renderem</b> e aproveitar <b>benefícios em diferentes momentos da rotina.</b>","COR_TITULO_COPY_2":"#2C3490","TAMANHO_DA_FONTE_TITULO_COPY_2":"28","COPY_2_PRETO":"<b>Conheça algumas das vantagens de ter seu cartão +amigo:</b><br>• <b>Descontos extras no mercado:</b> a partir de 5% em produtos selecionados, pagando com o cartão +amigo<br>• <b>Mais prazo para pagar:</b> até 40 dias, conforme a data da compra e o vencimento da fatura.<br>• <b>Benefícios com Visa</b>: acesso a promoções, descontos, sorteios e benefícios exclusivos.<br>• <b>Vantagens para sua saúde:</b> descontos de até 70% em consultas, exames e medicamentos pelo Programa Você Bem Saúde<br><br><b>Peça seu cartão +amigo e descubra essas vantagens!</b>","COR_COPY_2":"#2C3490","TAMANHO_DA_FONTE_COPY_2":"16","TITULO_CTA_2":"Quero meu cartão +amigo","LINK_CTA_2":"https://mais-amigo.onelink.me/YU3C/t6v9cyos?c=plx_topo_de_funil_padrao&af_sub1=crm&af_sub2=s1&af_sub3=plx_email_topo_v10_S1D01","BANNER_1_CORPO":"","LINK_BANNER_1_CORPO":"https://mais-amigo.onelink.me/YU3C/t6v9cyos?c=plx_topo_de_funil_padrao&af_sub1=crm&af_sub2=s1&af_sub3=plx_email_topo_v10_S1D01","BANNER_2_CORPO":"","LINK_BANNER_2_CORPO":"https://mais-amigo.onelink.me/YU3C/t6v9cyos?c=plx_topo_de_funil_padrao&af_sub1=crm&af_sub2=s1&af_sub3=plx_email_topo_v10_S1D01","BANNER_3_CORPO":"https://stoplxmkt.blob.core.windows.net/plxmkt/20250625-EM-JORNADA_DE_AQUISICAO_MAIS_AMIGO-AFINZ-V2/footer-amigao.png","LINK_BANNER_3_CORPO":"https://www.amigao.com/","NOTA_LEGAL":"Sujeito a análise de crédito. Consulte termos e condições em: https://clubemaisamigo.com.br/cartao","COR_NOTA_LEGAL":"#242424","TAMANHO_DA_FONTE_NOTA_LEGAL":"10","RODAPE":"Enviado por Banco Afinz S.A - Banco Múltiplo - CNPJ: 04.814.563/0001-74<br>Afinz Instituição de Pagamento S.A - CNPJ: 60.114.865/0001-00<br>Rua XV de Novembro, 45 - Sorocaba, SP","MENSAGEM_LIMITE":"Boa notícia, {{nome}}: você tem R$ {{limite}} de limite pré-aprovado no cartão +amigo.","HEADER_TITULO":"Seu mercado rende mais!","HEADER_SUBTITULO":"+5% de desconto extra em produtos selecionados","HEADER_IMAGEM_CARTAO":"https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/c6f51660-3c13-448e-aef3-5a68efaf2310.png","HEADER_LOGO":"https://image.contato.clubemaisamigo.com.br/lib/fe3011747364047e721773/m/1/cb6902a6-95ad-453f-a208-62e182eabf77.png"}$gaas$::jsonb, 'Plurix', $gaas$Topo de Funil Dinâmico$gaas$, $gaas$Amigão$gaas$, $gaas$Semana 1$gaas$, array[]::text[], $gaas$d1d10000-0000-4000-8000-0000000000e1$gaas$::uuid, 'draft', 1, $gaas$builtin-plurix-v13$gaas$, false, $gaas${"file":"Regua_Plurix_TopoFunil_Proposta_Outubro26.xlsx","sheet":"Briefing Fábrica","rows":"9-46","columns":"E-mail 1 a 3","importedAt":"2026-10-15","importKey":"TOPO DE FUNIL DINÂMICO|E-mail 1|AMIGAO","network_fields_from":"rascunho V10 3f668ef2-fb76-9757-e6d7-7280da475949"}$gaas$::jsonb),
($gaas$d1d10000-0000-4000-8000-000000000102$gaas$::uuid, $gaas${"__id":"d1d10000-0000-4000-8000-000000000102","DT_INICIO":"2026-10-15T00:00","DT_FIM":"2027-10-19T23:59","UTM_CAMPANHA":"PLURIX_TOPO_SEMANA1_EMAIL1_AVENIDA","TP_CAMPANHA":"Topo de Funil","SEQUENCIA":"E-mail 1","ASSUNTO":"Seu mercado pode render mais com o cartão +amigo","PRE_CABECALHO":"Você já tem o Clube. Com o cartão, ganha desconto extra em produtos selecionados.","HEADER":"","CARTAO_NM_COMERCIAL":"+amigo","NM_PRODUTO_INTERNO":"AVENIDA","TITULO_COPY_1_AZUL":"Olá, %%=v(@FirstName)=%%!","COR_COPY_1":"#2C3490","TAMANHO_DA_FONTE_TITULO_COPY_1":"24","TITULO_CTA_1":"Pedir cartão +amigo","LINK_CTA_1":"https://mais-amigo.onelink.me/YU3C/t6v9cyos?c=plx_topo_de_funil_padrao&af_sub1=crm&af_sub2=s1&af_sub3=plx_email_topo_v10_S1D01","COPY_1_PRETO":"Já pensou em aproveitar as melhores <b>vantagens e descontos dentro e fora do Supermercado</b>? Com o <b>cartão de crédito +amigo</b>, você pode <b>economizar em produtos selecionados</b> e ainda contar com benefícios que vão além das compras. Peça seu cartão e aproveite:","COR_COPY_PRETO_1":"#242424","TAMANHO_DA_FONTE_TITULO_COPY_PRETO_1":"18","TITULO_COPY_2":"São mais possibilidades para fazer suas <b>compras renderem</b> e aproveitar <b>benefícios em diferentes momentos da rotina.</b>","COR_TITULO_COPY_2":"#2C3490","TAMANHO_DA_FONTE_TITULO_COPY_2":"28","COPY_2_PRETO":"<b>Conheça algumas das vantagens de ter seu cartão +amigo:</b><br>• <b>Descontos extras no mercado:</b> a partir de 5% em produtos selecionados, pagando com o cartão +amigo<br>• <b>Mais prazo para pagar:</b> até 40 dias, conforme a data da compra e o vencimento da fatura.<br>• <b>Benefícios com Visa</b>: acesso a promoções, descontos, sorteios e benefícios exclusivos.<br>• <b>Vantagens para sua saúde:</b> descontos de até 70% em consultas, exames e medicamentos pelo Programa Você Bem Saúde<br><br><b>Peça seu cartão +amigo e descubra essas vantagens!</b>","COR_COPY_2":"#2C3490","TAMANHO_DA_FONTE_COPY_2":"16","TITULO_CTA_2":"Quero meu cartão +amigo","LINK_CTA_2":"https://mais-amigo.onelink.me/YU3C/t6v9cyos?c=plx_topo_de_funil_padrao&af_sub1=crm&af_sub2=s1&af_sub3=plx_email_topo_v10_S1D01","BANNER_1_CORPO":"","LINK_BANNER_1_CORPO":"https://mais-amigo.onelink.me/YU3C/t6v9cyos?c=plx_topo_de_funil_padrao&af_sub1=crm&af_sub2=s1&af_sub3=plx_email_topo_v10_S1D01","BANNER_2_CORPO":"","LINK_BANNER_2_CORPO":"https://mais-amigo.onelink.me/YU3C/t6v9cyos?c=plx_topo_de_funil_padrao&af_sub1=crm&af_sub2=s1&af_sub3=plx_email_topo_v10_S1D01","BANNER_3_CORPO":"https://stoplxmkt.blob.core.windows.net/plxmkt/20241125-EM-AVE-TEMPLATE-BLACK_FRIDAY_BANCO_DE_OFERTAS/footer-avenida.png","LINK_BANNER_3_CORPO":"https://loja.supermercadosavenida.com.br/","NOTA_LEGAL":"Sujeito a análise de crédito. Consulte termos e condições em: https://clubemaisamigo.com.br/cartao","COR_NOTA_LEGAL":"#242424","TAMANHO_DA_FONTE_NOTA_LEGAL":"10","RODAPE":"Enviado por Banco Afinz S.A - Banco Múltiplo - CNPJ: 04.814.563/0001-74<br>Afinz Instituição de Pagamento S.A - CNPJ: 60.114.865/0001-00<br>Rua XV de Novembro, 45 - Sorocaba, SP","MENSAGEM_LIMITE":"Boa notícia, {{nome}}: você tem R$ {{limite}} de limite pré-aprovado no cartão +amigo.","HEADER_TITULO":"Seu mercado rende mais!","HEADER_SUBTITULO":"+5% de desconto extra em produtos selecionados","HEADER_IMAGEM_CARTAO":"https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/c6f51660-3c13-448e-aef3-5a68efaf2310.png","HEADER_LOGO":"https://image.contato.clubemaisamigo.com.br/lib/fe3011747364047e721773/m/1/cb6902a6-95ad-453f-a208-62e182eabf77.png"}$gaas$::jsonb, 'Plurix', $gaas$Topo de Funil Dinâmico$gaas$, $gaas$Supermercados Avenida$gaas$, $gaas$Semana 1$gaas$, array[]::text[], $gaas$d1d10000-0000-4000-8000-0000000000e1$gaas$::uuid, 'draft', 1, $gaas$builtin-plurix-v13$gaas$, false, $gaas${"file":"Regua_Plurix_TopoFunil_Proposta_Outubro26.xlsx","sheet":"Briefing Fábrica","rows":"9-46","columns":"E-mail 1 a 3","importedAt":"2026-10-15","importKey":"TOPO DE FUNIL DINÂMICO|E-mail 1|AVENIDA","network_fields_from":"rascunho V10 ab1d57ef-aad0-3e9d-cb16-7136005a1116"}$gaas$::jsonb),
($gaas$d1d10000-0000-4000-8000-000000000103$gaas$::uuid, $gaas${"__id":"d1d10000-0000-4000-8000-000000000103","DT_INICIO":"2026-10-15T00:00","DT_FIM":"2027-10-19T23:59","UTM_CAMPANHA":"PLURIX_TOPO_SEMANA1_EMAIL1_BOA","TP_CAMPANHA":"Topo de Funil","SEQUENCIA":"E-mail 1","ASSUNTO":"Seu mercado pode render mais com o cartão +amigo","PRE_CABECALHO":"Você já tem o Clube. Com o cartão, ganha desconto extra em produtos selecionados.","HEADER":"","CARTAO_NM_COMERCIAL":"+amigo","NM_PRODUTO_INTERNO":"BOA","TITULO_COPY_1_AZUL":"Olá, %%=v(@FirstName)=%%!","COR_COPY_1":"#2C3490","TAMANHO_DA_FONTE_TITULO_COPY_1":"24","TITULO_CTA_1":"Pedir cartão +amigo","LINK_CTA_1":"https://mais-amigo.onelink.me/YU3C/t6v9cyos?c=plx_topo_de_funil_padrao&af_sub1=crm&af_sub2=s1&af_sub3=plx_email_topo_v10_S1D01","COPY_1_PRETO":"Já pensou em aproveitar as melhores <b>vantagens e descontos dentro e fora do Supermercado</b>? Com o <b>cartão de crédito +amigo</b>, você pode <b>economizar em produtos selecionados</b> e ainda contar com benefícios que vão além das compras. Peça seu cartão e aproveite:","COR_COPY_PRETO_1":"#242424","TAMANHO_DA_FONTE_TITULO_COPY_PRETO_1":"18","TITULO_COPY_2":"São mais possibilidades para fazer suas <b>compras renderem</b> e aproveitar <b>benefícios em diferentes momentos da rotina.</b>","COR_TITULO_COPY_2":"#2C3490","TAMANHO_DA_FONTE_TITULO_COPY_2":"28","COPY_2_PRETO":"<b>Conheça algumas das vantagens de ter seu cartão +amigo:</b><br>• <b>Descontos extras no mercado:</b> a partir de 5% em produtos selecionados, pagando com o cartão +amigo<br>• <b>Mais prazo para pagar:</b> até 40 dias, conforme a data da compra e o vencimento da fatura.<br>• <b>Benefícios com Visa</b>: acesso a promoções, descontos, sorteios e benefícios exclusivos.<br>• <b>Vantagens para sua saúde:</b> descontos de até 70% em consultas, exames e medicamentos pelo Programa Você Bem Saúde<br><br><b>Peça seu cartão +amigo e descubra essas vantagens!</b>","COR_COPY_2":"#2C3490","TAMANHO_DA_FONTE_COPY_2":"16","TITULO_CTA_2":"Quero meu cartão +amigo","LINK_CTA_2":"https://mais-amigo.onelink.me/YU3C/t6v9cyos?c=plx_topo_de_funil_padrao&af_sub1=crm&af_sub2=s1&af_sub3=plx_email_topo_v10_S1D01","BANNER_1_CORPO":"","LINK_BANNER_1_CORPO":"https://mais-amigo.onelink.me/YU3C/t6v9cyos?c=plx_topo_de_funil_padrao&af_sub1=crm&af_sub2=s1&af_sub3=plx_email_topo_v10_S1D01","BANNER_2_CORPO":"","LINK_BANNER_2_CORPO":"https://mais-amigo.onelink.me/YU3C/t6v9cyos?c=plx_topo_de_funil_padrao&af_sub1=crm&af_sub2=s1&af_sub3=plx_email_topo_v10_S1D01","BANNER_3_CORPO":"https://stoplxmkt.blob.core.windows.net/plxmkt/20241125-EM-BOA-TEMPLATE-BLACK_FRIDAY_BANCO_DE_OFERTAS/footer-hd.png","LINK_BANNER_3_CORPO":"https://www.boasupermercados.com.br/","NOTA_LEGAL":"Sujeito a análise de crédito. Consulte termos e condições em: https://clubemaisamigo.com.br/cartao","COR_NOTA_LEGAL":"#242424","TAMANHO_DA_FONTE_NOTA_LEGAL":"10","RODAPE":"Enviado por Banco Afinz S.A - Banco Múltiplo - CNPJ: 04.814.563/0001-74<br>Afinz Instituição de Pagamento S.A - CNPJ: 60.114.865/0001-00<br>Rua XV de Novembro, 45 - Sorocaba, SP","MENSAGEM_LIMITE":"Boa notícia, {{nome}}: você tem R$ {{limite}} de limite pré-aprovado no cartão +amigo.","HEADER_TITULO":"Seu mercado rende mais!","HEADER_SUBTITULO":"+5% de desconto extra em produtos selecionados","HEADER_IMAGEM_CARTAO":"https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/c6f51660-3c13-448e-aef3-5a68efaf2310.png","HEADER_LOGO":"https://image.contato.clubemaisamigo.com.br/lib/fe3011747364047e721773/m/1/cb6902a6-95ad-453f-a208-62e182eabf77.png"}$gaas$::jsonb, 'Plurix', $gaas$Topo de Funil Dinâmico$gaas$, $gaas$Boa Supermercados$gaas$, $gaas$Semana 1$gaas$, array[]::text[], $gaas$d1d10000-0000-4000-8000-0000000000e1$gaas$::uuid, 'draft', 1, $gaas$builtin-plurix-v13$gaas$, false, $gaas${"file":"Regua_Plurix_TopoFunil_Proposta_Outubro26.xlsx","sheet":"Briefing Fábrica","rows":"9-46","columns":"E-mail 1 a 3","importedAt":"2026-10-15","importKey":"TOPO DE FUNIL DINÂMICO|E-mail 1|BOA","network_fields_from":"rascunho V10 cf5c9a1e-a866-4956-bda9-611866b9d6f5"}$gaas$::jsonb),
($gaas$d1d10000-0000-4000-8000-000000000104$gaas$::uuid, $gaas${"__id":"d1d10000-0000-4000-8000-000000000104","DT_INICIO":"2026-10-15T00:00","DT_FIM":"2027-10-19T23:59","UTM_CAMPANHA":"PLURIX_TOPO_SEMANA1_EMAIL1_COMPREMAIS","TP_CAMPANHA":"Topo de Funil","SEQUENCIA":"E-mail 1","ASSUNTO":"Seu mercado pode render mais com o cartão +amigo","PRE_CABECALHO":"Você já tem o Clube. Com o cartão, ganha desconto extra em produtos selecionados.","HEADER":"","CARTAO_NM_COMERCIAL":"+amigo","NM_PRODUTO_INTERNO":"COMPRE MAIS","TITULO_COPY_1_AZUL":"Olá, %%=v(@FirstName)=%%!","COR_COPY_1":"#2C3490","TAMANHO_DA_FONTE_TITULO_COPY_1":"24","TITULO_CTA_1":"Pedir cartão +amigo","LINK_CTA_1":"https://mais-amigo.onelink.me/YU3C/t6v9cyos?c=plx_topo_de_funil_padrao&af_sub1=crm&af_sub2=s1&af_sub3=plx_email_topo_v10_S1D01","COPY_1_PRETO":"Já pensou em aproveitar as melhores <b>vantagens e descontos dentro e fora do Supermercado</b>? Com o <b>cartão de crédito +amigo</b>, você pode <b>economizar em produtos selecionados</b> e ainda contar com benefícios que vão além das compras. Peça seu cartão e aproveite:","COR_COPY_PRETO_1":"#242424","TAMANHO_DA_FONTE_TITULO_COPY_PRETO_1":"18","TITULO_COPY_2":"São mais possibilidades para fazer suas <b>compras renderem</b> e aproveitar <b>benefícios em diferentes momentos da rotina.</b>","COR_TITULO_COPY_2":"#2C3490","TAMANHO_DA_FONTE_TITULO_COPY_2":"28","COPY_2_PRETO":"<b>Conheça algumas das vantagens de ter seu cartão +amigo:</b><br>• <b>Descontos extras no mercado:</b> a partir de 5% em produtos selecionados, pagando com o cartão +amigo<br>• <b>Mais prazo para pagar:</b> até 40 dias, conforme a data da compra e o vencimento da fatura.<br>• <b>Benefícios com Visa</b>: acesso a promoções, descontos, sorteios e benefícios exclusivos.<br>• <b>Vantagens para sua saúde:</b> descontos de até 70% em consultas, exames e medicamentos pelo Programa Você Bem Saúde<br><br><b>Peça seu cartão +amigo e descubra essas vantagens!</b>","COR_COPY_2":"#2C3490","TAMANHO_DA_FONTE_COPY_2":"16","TITULO_CTA_2":"Quero meu cartão +amigo","LINK_CTA_2":"https://mais-amigo.onelink.me/YU3C/t6v9cyos?c=plx_topo_de_funil_padrao&af_sub1=crm&af_sub2=s1&af_sub3=plx_email_topo_v10_S1D01","BANNER_1_CORPO":"","LINK_BANNER_1_CORPO":"https://mais-amigo.onelink.me/YU3C/t6v9cyos?c=plx_topo_de_funil_padrao&af_sub1=crm&af_sub2=s1&af_sub3=plx_email_topo_v10_S1D01","BANNER_2_CORPO":"","LINK_BANNER_2_CORPO":"https://mais-amigo.onelink.me/YU3C/t6v9cyos?c=plx_topo_de_funil_padrao&af_sub1=crm&af_sub2=s1&af_sub3=plx_email_topo_v10_S1D01","BANNER_3_CORPO":"","LINK_BANNER_3_CORPO":"","NOTA_LEGAL":"Sujeito a análise de crédito. Consulte termos e condições em: https://clubemaisamigo.com.br/cartao","COR_NOTA_LEGAL":"#242424","TAMANHO_DA_FONTE_NOTA_LEGAL":"10","RODAPE":"Enviado por Banco Afinz S.A - Banco Múltiplo - CNPJ: 04.814.563/0001-74<br>Afinz Instituição de Pagamento S.A - CNPJ: 60.114.865/0001-00<br>Rua XV de Novembro, 45 - Sorocaba, SP","MENSAGEM_LIMITE":"Boa notícia, {{nome}}: você tem R$ {{limite}} de limite pré-aprovado no cartão +amigo.","HEADER_TITULO":"Seu mercado rende mais!","HEADER_SUBTITULO":"+5% de desconto extra em produtos selecionados","HEADER_IMAGEM_CARTAO":"https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/c6f51660-3c13-448e-aef3-5a68efaf2310.png","HEADER_LOGO":"https://image.contato.clubemaisamigo.com.br/lib/fe3011747364047e721773/m/1/cb6902a6-95ad-453f-a208-62e182eabf77.png"}$gaas$::jsonb, 'Plurix', $gaas$Topo de Funil Dinâmico$gaas$, $gaas$Compre Mais$gaas$, $gaas$Semana 1$gaas$, array[]::text[], $gaas$d1d10000-0000-4000-8000-0000000000e1$gaas$::uuid, 'draft', 1, $gaas$builtin-plurix-v13$gaas$, false, $gaas${"file":"Regua_Plurix_TopoFunil_Proposta_Outubro26.xlsx","sheet":"Briefing Fábrica","rows":"9-46","columns":"E-mail 1 a 3","importedAt":"2026-10-15","importKey":"TOPO DE FUNIL DINÂMICO|E-mail 1|COMPRE MAIS","network_fields_from":"rascunho V10 e616b147-a11a-5ea0-f629-f36c994197ab"}$gaas$::jsonb),
($gaas$d1d10000-0000-4000-8000-000000000105$gaas$::uuid, $gaas${"__id":"d1d10000-0000-4000-8000-000000000105","DT_INICIO":"2026-10-15T00:00","DT_FIM":"2027-10-19T23:59","UTM_CAMPANHA":"PLURIX_TOPO_SEMANA1_EMAIL1_PARANA","TP_CAMPANHA":"Topo de Funil","SEQUENCIA":"E-mail 1","ASSUNTO":"Seu mercado pode render mais com o cartão +amigo","PRE_CABECALHO":"Você já tem o Clube. Com o cartão, ganha desconto extra em produtos selecionados.","HEADER":"","CARTAO_NM_COMERCIAL":"+amigo","NM_PRODUTO_INTERNO":"PARANA","TITULO_COPY_1_AZUL":"Olá, %%=v(@FirstName)=%%!","COR_COPY_1":"#2C3490","TAMANHO_DA_FONTE_TITULO_COPY_1":"24","TITULO_CTA_1":"Pedir cartão +amigo","LINK_CTA_1":"https://mais-amigo.onelink.me/YU3C/t6v9cyos?c=plx_topo_de_funil_padrao&af_sub1=crm&af_sub2=s1&af_sub3=plx_email_topo_v10_S1D01","COPY_1_PRETO":"Já pensou em aproveitar as melhores <b>vantagens e descontos dentro e fora do Supermercado</b>? Com o <b>cartão de crédito +amigo</b>, você pode <b>economizar em produtos selecionados</b> e ainda contar com benefícios que vão além das compras. Peça seu cartão e aproveite:","COR_COPY_PRETO_1":"#242424","TAMANHO_DA_FONTE_TITULO_COPY_PRETO_1":"18","TITULO_COPY_2":"São mais possibilidades para fazer suas <b>compras renderem</b> e aproveitar <b>benefícios em diferentes momentos da rotina.</b>","COR_TITULO_COPY_2":"#2C3490","TAMANHO_DA_FONTE_TITULO_COPY_2":"28","COPY_2_PRETO":"<b>Conheça algumas das vantagens de ter seu cartão +amigo:</b><br>• <b>Descontos extras no mercado:</b> a partir de 5% em produtos selecionados, pagando com o cartão +amigo<br>• <b>Mais prazo para pagar:</b> até 40 dias, conforme a data da compra e o vencimento da fatura.<br>• <b>Benefícios com Visa</b>: acesso a promoções, descontos, sorteios e benefícios exclusivos.<br>• <b>Vantagens para sua saúde:</b> descontos de até 70% em consultas, exames e medicamentos pelo Programa Você Bem Saúde<br><br><b>Peça seu cartão +amigo e descubra essas vantagens!</b>","COR_COPY_2":"#2C3490","TAMANHO_DA_FONTE_COPY_2":"16","TITULO_CTA_2":"Quero meu cartão +amigo","LINK_CTA_2":"https://mais-amigo.onelink.me/YU3C/t6v9cyos?c=plx_topo_de_funil_padrao&af_sub1=crm&af_sub2=s1&af_sub3=plx_email_topo_v10_S1D01","BANNER_1_CORPO":"","LINK_BANNER_1_CORPO":"https://mais-amigo.onelink.me/YU3C/t6v9cyos?c=plx_topo_de_funil_padrao&af_sub1=crm&af_sub2=s1&af_sub3=plx_email_topo_v10_S1D01","BANNER_2_CORPO":"","LINK_BANNER_2_CORPO":"https://mais-amigo.onelink.me/YU3C/t6v9cyos?c=plx_topo_de_funil_padrao&af_sub1=crm&af_sub2=s1&af_sub3=plx_email_topo_v10_S1D01","BANNER_3_CORPO":"https://stoplxmkt.blob.core.windows.net/plxmkt/20250625-EM-JORNADA_DE_AQUISICAO_MAIS_AMIGO-AFINZ-V2/footer-parana.png","LINK_BANNER_3_CORPO":"https://www.paranasupermercados.com.br","NOTA_LEGAL":"Sujeito a análise de crédito. Consulte termos e condições em: https://clubemaisamigo.com.br/cartao","COR_NOTA_LEGAL":"#242424","TAMANHO_DA_FONTE_NOTA_LEGAL":"10","RODAPE":"Enviado por Banco Afinz S.A - Banco Múltiplo - CNPJ: 04.814.563/0001-74<br>Afinz Instituição de Pagamento S.A - CNPJ: 60.114.865/0001-00<br>Rua XV de Novembro, 45 - Sorocaba, SP","MENSAGEM_LIMITE":"Boa notícia, {{nome}}: você tem R$ {{limite}} de limite pré-aprovado no cartão +amigo.","HEADER_TITULO":"Seu mercado rende mais!","HEADER_SUBTITULO":"+5% de desconto extra em produtos selecionados","HEADER_IMAGEM_CARTAO":"https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/c6f51660-3c13-448e-aef3-5a68efaf2310.png","HEADER_LOGO":"https://image.contato.clubemaisamigo.com.br/lib/fe3011747364047e721773/m/1/cb6902a6-95ad-453f-a208-62e182eabf77.png"}$gaas$::jsonb, 'Plurix', $gaas$Topo de Funil Dinâmico$gaas$, $gaas$Paraná$gaas$, $gaas$Semana 1$gaas$, array[]::text[], $gaas$d1d10000-0000-4000-8000-0000000000e1$gaas$::uuid, 'draft', 1, $gaas$builtin-plurix-v13$gaas$, false, $gaas${"file":"Regua_Plurix_TopoFunil_Proposta_Outubro26.xlsx","sheet":"Briefing Fábrica","rows":"9-46","columns":"E-mail 1 a 3","importedAt":"2026-10-15","importKey":"TOPO DE FUNIL DINÂMICO|E-mail 1|PARANA","network_fields_from":"rascunho V10 3adad9c6-67c7-e851-233e-ac5c0e610f1e"}$gaas$::jsonb),
($gaas$d1d10000-0000-4000-8000-000000000106$gaas$::uuid, $gaas${"__id":"d1d10000-0000-4000-8000-000000000106","DT_INICIO":"2026-10-15T00:00","DT_FIM":"2027-10-19T23:59","UTM_CAMPANHA":"PLURIX_TOPO_SEMANA1_EMAIL1_SUPERPAO","TP_CAMPANHA":"Topo de Funil","SEQUENCIA":"E-mail 1","ASSUNTO":"Seu mercado pode render mais com o cartão +amigo","PRE_CABECALHO":"Você já tem o Clube. Com o cartão, ganha desconto extra em produtos selecionados.","HEADER":"","CARTAO_NM_COMERCIAL":"+amigo","NM_PRODUTO_INTERNO":"SUPERPAO","TITULO_COPY_1_AZUL":"Olá, %%=v(@FirstName)=%%!","COR_COPY_1":"#2C3490","TAMANHO_DA_FONTE_TITULO_COPY_1":"24","TITULO_CTA_1":"Pedir cartão +amigo","LINK_CTA_1":"https://mais-amigo.onelink.me/YU3C/t6v9cyos?c=plx_topo_de_funil_padrao&af_sub1=crm&af_sub2=s1&af_sub3=plx_email_topo_v10_S1D01","COPY_1_PRETO":"Já pensou em aproveitar as melhores <b>vantagens e descontos dentro e fora do Supermercado</b>? Com o <b>cartão de crédito +amigo</b>, você pode <b>economizar em produtos selecionados</b> e ainda contar com benefícios que vão além das compras. Peça seu cartão e aproveite:","COR_COPY_PRETO_1":"#242424","TAMANHO_DA_FONTE_TITULO_COPY_PRETO_1":"18","TITULO_COPY_2":"São mais possibilidades para fazer suas <b>compras renderem</b> e aproveitar <b>benefícios em diferentes momentos da rotina.</b>","COR_TITULO_COPY_2":"#2C3490","TAMANHO_DA_FONTE_TITULO_COPY_2":"28","COPY_2_PRETO":"<b>Conheça algumas das vantagens de ter seu cartão +amigo:</b><br>• <b>Descontos extras no mercado:</b> a partir de 5% em produtos selecionados, pagando com o cartão +amigo<br>• <b>Mais prazo para pagar:</b> até 40 dias, conforme a data da compra e o vencimento da fatura.<br>• <b>Benefícios com Visa</b>: acesso a promoções, descontos, sorteios e benefícios exclusivos.<br>• <b>Vantagens para sua saúde:</b> descontos de até 70% em consultas, exames e medicamentos pelo Programa Você Bem Saúde<br><br><b>Peça seu cartão +amigo e descubra essas vantagens!</b>","COR_COPY_2":"#2C3490","TAMANHO_DA_FONTE_COPY_2":"16","TITULO_CTA_2":"Quero meu cartão +amigo","LINK_CTA_2":"https://mais-amigo.onelink.me/YU3C/t6v9cyos?c=plx_topo_de_funil_padrao&af_sub1=crm&af_sub2=s1&af_sub3=plx_email_topo_v10_S1D01","BANNER_1_CORPO":"","LINK_BANNER_1_CORPO":"https://mais-amigo.onelink.me/YU3C/t6v9cyos?c=plx_topo_de_funil_padrao&af_sub1=crm&af_sub2=s1&af_sub3=plx_email_topo_v10_S1D01","BANNER_2_CORPO":"","LINK_BANNER_2_CORPO":"https://mais-amigo.onelink.me/YU3C/t6v9cyos?c=plx_topo_de_funil_padrao&af_sub1=crm&af_sub2=s1&af_sub3=plx_email_topo_v10_S1D01","BANNER_3_CORPO":"","LINK_BANNER_3_CORPO":"","NOTA_LEGAL":"Sujeito a análise de crédito. Consulte termos e condições em: https://clubemaisamigo.com.br/cartao","COR_NOTA_LEGAL":"#242424","TAMANHO_DA_FONTE_NOTA_LEGAL":"10","RODAPE":"Enviado por Banco Afinz S.A - Banco Múltiplo - CNPJ: 04.814.563/0001-74<br>Afinz Instituição de Pagamento S.A - CNPJ: 60.114.865/0001-00<br>Rua XV de Novembro, 45 - Sorocaba, SP","MENSAGEM_LIMITE":"Boa notícia, {{nome}}: você tem R$ {{limite}} de limite pré-aprovado no cartão +amigo.","HEADER_TITULO":"Seu mercado rende mais!","HEADER_SUBTITULO":"+5% de desconto extra em produtos selecionados","HEADER_IMAGEM_CARTAO":"https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/c6f51660-3c13-448e-aef3-5a68efaf2310.png","HEADER_LOGO":"https://image.contato.clubemaisamigo.com.br/lib/fe3011747364047e721773/m/1/cb6902a6-95ad-453f-a208-62e182eabf77.png"}$gaas$::jsonb, 'Plurix', $gaas$Topo de Funil Dinâmico$gaas$, $gaas$Superpão$gaas$, $gaas$Semana 1$gaas$, array[]::text[], $gaas$d1d10000-0000-4000-8000-0000000000e1$gaas$::uuid, 'draft', 1, $gaas$builtin-plurix-v13$gaas$, false, $gaas${"file":"Regua_Plurix_TopoFunil_Proposta_Outubro26.xlsx","sheet":"Briefing Fábrica","rows":"9-46","columns":"E-mail 1 a 3","importedAt":"2026-10-15","importKey":"TOPO DE FUNIL DINÂMICO|E-mail 1|SUPERPAO","network_fields_from":"rascunho V10 728e8c43-ba6b-a552-52df-f5aea7188bdb"}$gaas$::jsonb),
($gaas$d1d10000-0000-4000-8000-000000000111$gaas$::uuid, $gaas${"__id":"d1d10000-0000-4000-8000-000000000111","DT_INICIO":"2026-10-15T00:00","DT_FIM":"2027-10-19T23:59","UTM_CAMPANHA":"PLURIX_TOPO_SEMANA1_EMAIL2_AMIGAO","TP_CAMPANHA":"Topo de Funil","SEQUENCIA":"E-mail 2","ASSUNTO":"+5% de desconto extra em produtos selecionados","PRE_CABECALHO":"Você já tem o Clube. Peça seu cartão +amigo e aproveite ainda mais.","HEADER":"","CARTAO_NM_COMERCIAL":"+amigo","NM_PRODUTO_INTERNO":"AMIGAO","TITULO_COPY_1_AZUL":"Olá, %%=v(@FirstName)=%%!","COR_COPY_1":"#2C3490","TAMANHO_DA_FONTE_TITULO_COPY_1":"24","TITULO_CTA_1":"Pedir cartão +amigo","LINK_CTA_1":"https://mais-amigo.onelink.me/YU3C/t6v9cyos?c=plx_topo_de_funil_padrao&af_sub1=crm&af_sub2=s1&af_sub3=plx_email_topo_v10_S1D02","COPY_1_PRETO":"Na hora de escolher como pagar suas compras, contar com <b>vantagens extras faz toda diferença.</b><br>O <b>cartão +amigo</b> foi feito para trazer mais possibilidades para sua rotina, com <b>DESCONTOS EXCLUSIVOS em produtos selecionados</b> no supermercado e benefícios para você aproveitar no dia a dia.","COR_COPY_PRETO_1":"#242424","TAMANHO_DA_FONTE_TITULO_COPY_PRETO_1":"18","TITULO_COPY_2":"Ganhe mais pagando com o <b>cartão de crédito +amigo.</b>","COR_TITULO_COPY_2":"#2C3490","TAMANHO_DA_FONTE_TITULO_COPY_2":"28","COPY_2_PRETO":"No Clube você conta com ofertas, eventos e sorteios. Com o <b>cartão +amigo</b> você conta com tudo isso <b>+5% de desconto extra em produtos selecionados</b> sempre que você paga com ele. As melhores vantagens do mercado na palma da sua mão! São muitas vantagens:<br><b>• +5% OFF em produtos selecionados</b><br><b>• Até 40 dias para pagar</b><br><b>• Até 70% OFF em medicamentos e consultas médicas</b><br><br>As melhores <b>vantagens do mercado</b> na palma da sua mão!","COR_COPY_2":"#2C3490","TAMANHO_DA_FONTE_COPY_2":"16","TITULO_CTA_2":"Quero meu cartão +amigo","LINK_CTA_2":"https://mais-amigo.onelink.me/YU3C/t6v9cyos?c=plx_topo_de_funil_padrao&af_sub1=crm&af_sub2=s1&af_sub3=plx_email_topo_v10_S1D02","BANNER_1_CORPO":"","LINK_BANNER_1_CORPO":"https://mais-amigo.onelink.me/YU3C/t6v9cyos?c=plx_topo_de_funil_padrao&af_sub1=crm&af_sub2=s1&af_sub3=plx_email_topo_v10_S1D02","BANNER_2_CORPO":"","LINK_BANNER_2_CORPO":"https://mais-amigo.onelink.me/YU3C/t6v9cyos?c=plx_topo_de_funil_padrao&af_sub1=crm&af_sub2=s1&af_sub3=plx_email_topo_v10_S1D02","BANNER_3_CORPO":"https://stoplxmkt.blob.core.windows.net/plxmkt/20250625-EM-JORNADA_DE_AQUISICAO_MAIS_AMIGO-AFINZ-V2/footer-amigao.png","LINK_BANNER_3_CORPO":"https://www.amigao.com/","NOTA_LEGAL":"Sujeito a análise de crédito. Consulte termos e condições em: https://clubemaisamigo.com.br/cartao","COR_NOTA_LEGAL":"#242424","TAMANHO_DA_FONTE_NOTA_LEGAL":"10","RODAPE":"Enviado por Banco Afinz S.A - Banco Múltiplo - CNPJ: 04.814.563/0001-74<br>Afinz Instituição de Pagamento S.A - CNPJ: 60.114.865/0001-00<br>Rua XV de Novembro, 45 - Sorocaba, SP","MENSAGEM_LIMITE":"Boa notícia, {{nome}}: você tem R$ {{limite}} de limite pré-aprovado no cartão +amigo.","HEADER_TITULO":"+5% de desconto extra!","HEADER_SUBTITULO":"Vantagens exclusivas para você economizar","HEADER_IMAGEM_CARTAO":"https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/49b01a5b-dc3f-47a3-9ef5-afa14915626e.png","HEADER_LOGO":"https://image.contato.clubemaisamigo.com.br/lib/fe3011747364047e721773/m/1/cb6902a6-95ad-453f-a208-62e182eabf77.png"}$gaas$::jsonb, 'Plurix', $gaas$Topo de Funil Dinâmico$gaas$, $gaas$Amigão$gaas$, $gaas$Semana 1$gaas$, array[]::text[], $gaas$d1d10000-0000-4000-8000-0000000000e2$gaas$::uuid, 'draft', 1, $gaas$builtin-plurix-v13$gaas$, false, $gaas${"file":"Regua_Plurix_TopoFunil_Proposta_Outubro26.xlsx","sheet":"Briefing Fábrica","rows":"9-46","columns":"E-mail 1 a 3","importedAt":"2026-10-15","importKey":"TOPO DE FUNIL DINÂMICO|E-mail 2|AMIGAO","network_fields_from":"rascunho V10 99709279-c64a-6559-40aa-4b92ee52745f"}$gaas$::jsonb),
($gaas$d1d10000-0000-4000-8000-000000000112$gaas$::uuid, $gaas${"__id":"d1d10000-0000-4000-8000-000000000112","DT_INICIO":"2026-10-15T00:00","DT_FIM":"2027-10-19T23:59","UTM_CAMPANHA":"PLURIX_TOPO_SEMANA1_EMAIL2_AVENIDA","TP_CAMPANHA":"Topo de Funil","SEQUENCIA":"E-mail 2","ASSUNTO":"+5% de desconto extra em produtos selecionados","PRE_CABECALHO":"Você já tem o Clube. Peça seu cartão +amigo e aproveite ainda mais.","HEADER":"","CARTAO_NM_COMERCIAL":"+amigo","NM_PRODUTO_INTERNO":"AVENIDA","TITULO_COPY_1_AZUL":"Olá, %%=v(@FirstName)=%%!","COR_COPY_1":"#2C3490","TAMANHO_DA_FONTE_TITULO_COPY_1":"24","TITULO_CTA_1":"Pedir cartão +amigo","LINK_CTA_1":"https://mais-amigo.onelink.me/YU3C/t6v9cyos?c=plx_topo_de_funil_padrao&af_sub1=crm&af_sub2=s1&af_sub3=plx_email_topo_v10_S1D02","COPY_1_PRETO":"Na hora de escolher como pagar suas compras, contar com <b>vantagens extras faz toda diferença.</b><br>O <b>cartão +amigo</b> foi feito para trazer mais possibilidades para sua rotina, com <b>DESCONTOS EXCLUSIVOS em produtos selecionados</b> no supermercado e benefícios para você aproveitar no dia a dia.","COR_COPY_PRETO_1":"#242424","TAMANHO_DA_FONTE_TITULO_COPY_PRETO_1":"18","TITULO_COPY_2":"Ganhe mais pagando com o <b>cartão de crédito +amigo.</b>","COR_TITULO_COPY_2":"#2C3490","TAMANHO_DA_FONTE_TITULO_COPY_2":"28","COPY_2_PRETO":"No Clube você conta com ofertas, eventos e sorteios. Com o <b>cartão +amigo</b> você conta com tudo isso <b>+5% de desconto extra em produtos selecionados</b> sempre que você paga com ele. As melhores vantagens do mercado na palma da sua mão! São muitas vantagens:<br><b>• +5% OFF em produtos selecionados</b><br><b>• Até 40 dias para pagar</b><br><b>• Até 70% OFF em medicamentos e consultas médicas</b><br><br>As melhores <b>vantagens do mercado</b> na palma da sua mão!","COR_COPY_2":"#2C3490","TAMANHO_DA_FONTE_COPY_2":"16","TITULO_CTA_2":"Quero meu cartão +amigo","LINK_CTA_2":"https://mais-amigo.onelink.me/YU3C/t6v9cyos?c=plx_topo_de_funil_padrao&af_sub1=crm&af_sub2=s1&af_sub3=plx_email_topo_v10_S1D02","BANNER_1_CORPO":"","LINK_BANNER_1_CORPO":"https://mais-amigo.onelink.me/YU3C/t6v9cyos?c=plx_topo_de_funil_padrao&af_sub1=crm&af_sub2=s1&af_sub3=plx_email_topo_v10_S1D02","BANNER_2_CORPO":"","LINK_BANNER_2_CORPO":"https://mais-amigo.onelink.me/YU3C/t6v9cyos?c=plx_topo_de_funil_padrao&af_sub1=crm&af_sub2=s1&af_sub3=plx_email_topo_v10_S1D02","BANNER_3_CORPO":"https://stoplxmkt.blob.core.windows.net/plxmkt/20241125-EM-AVE-TEMPLATE-BLACK_FRIDAY_BANCO_DE_OFERTAS/footer-avenida.png","LINK_BANNER_3_CORPO":"https://loja.supermercadosavenida.com.br/","NOTA_LEGAL":"Sujeito a análise de crédito. Consulte termos e condições em: https://clubemaisamigo.com.br/cartao","COR_NOTA_LEGAL":"#242424","TAMANHO_DA_FONTE_NOTA_LEGAL":"10","RODAPE":"Enviado por Banco Afinz S.A - Banco Múltiplo - CNPJ: 04.814.563/0001-74<br>Afinz Instituição de Pagamento S.A - CNPJ: 60.114.865/0001-00<br>Rua XV de Novembro, 45 - Sorocaba, SP","MENSAGEM_LIMITE":"Boa notícia, {{nome}}: você tem R$ {{limite}} de limite pré-aprovado no cartão +amigo.","HEADER_TITULO":"+5% de desconto extra!","HEADER_SUBTITULO":"Vantagens exclusivas para você economizar","HEADER_IMAGEM_CARTAO":"https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/49b01a5b-dc3f-47a3-9ef5-afa14915626e.png","HEADER_LOGO":"https://image.contato.clubemaisamigo.com.br/lib/fe3011747364047e721773/m/1/cb6902a6-95ad-453f-a208-62e182eabf77.png"}$gaas$::jsonb, 'Plurix', $gaas$Topo de Funil Dinâmico$gaas$, $gaas$Supermercados Avenida$gaas$, $gaas$Semana 1$gaas$, array[]::text[], $gaas$d1d10000-0000-4000-8000-0000000000e2$gaas$::uuid, 'draft', 1, $gaas$builtin-plurix-v13$gaas$, false, $gaas${"file":"Regua_Plurix_TopoFunil_Proposta_Outubro26.xlsx","sheet":"Briefing Fábrica","rows":"9-46","columns":"E-mail 1 a 3","importedAt":"2026-10-15","importKey":"TOPO DE FUNIL DINÂMICO|E-mail 2|AVENIDA","network_fields_from":"rascunho V10 3cba8469-ae27-1276-4edf-355585b508d8"}$gaas$::jsonb),
($gaas$d1d10000-0000-4000-8000-000000000113$gaas$::uuid, $gaas${"__id":"d1d10000-0000-4000-8000-000000000113","DT_INICIO":"2026-10-15T00:00","DT_FIM":"2027-10-19T23:59","UTM_CAMPANHA":"PLURIX_TOPO_SEMANA1_EMAIL2_BOA","TP_CAMPANHA":"Topo de Funil","SEQUENCIA":"E-mail 2","ASSUNTO":"+5% de desconto extra em produtos selecionados","PRE_CABECALHO":"Você já tem o Clube. Peça seu cartão +amigo e aproveite ainda mais.","HEADER":"","CARTAO_NM_COMERCIAL":"+amigo","NM_PRODUTO_INTERNO":"BOA","TITULO_COPY_1_AZUL":"Olá, %%=v(@FirstName)=%%!","COR_COPY_1":"#2C3490","TAMANHO_DA_FONTE_TITULO_COPY_1":"24","TITULO_CTA_1":"Pedir cartão +amigo","LINK_CTA_1":"https://mais-amigo.onelink.me/YU3C/t6v9cyos?c=plx_topo_de_funil_padrao&af_sub1=crm&af_sub2=s1&af_sub3=plx_email_topo_v10_S1D02","COPY_1_PRETO":"Na hora de escolher como pagar suas compras, contar com <b>vantagens extras faz toda diferença.</b><br>O <b>cartão +amigo</b> foi feito para trazer mais possibilidades para sua rotina, com <b>DESCONTOS EXCLUSIVOS em produtos selecionados</b> no supermercado e benefícios para você aproveitar no dia a dia.","COR_COPY_PRETO_1":"#242424","TAMANHO_DA_FONTE_TITULO_COPY_PRETO_1":"18","TITULO_COPY_2":"Ganhe mais pagando com o <b>cartão de crédito +amigo.</b>","COR_TITULO_COPY_2":"#2C3490","TAMANHO_DA_FONTE_TITULO_COPY_2":"28","COPY_2_PRETO":"No Clube você conta com ofertas, eventos e sorteios. Com o <b>cartão +amigo</b> você conta com tudo isso <b>+5% de desconto extra em produtos selecionados</b> sempre que você paga com ele. As melhores vantagens do mercado na palma da sua mão! São muitas vantagens:<br><b>• +5% OFF em produtos selecionados</b><br><b>• Até 40 dias para pagar</b><br><b>• Até 70% OFF em medicamentos e consultas médicas</b><br><br>As melhores <b>vantagens do mercado</b> na palma da sua mão!","COR_COPY_2":"#2C3490","TAMANHO_DA_FONTE_COPY_2":"16","TITULO_CTA_2":"Quero meu cartão +amigo","LINK_CTA_2":"https://mais-amigo.onelink.me/YU3C/t6v9cyos?c=plx_topo_de_funil_padrao&af_sub1=crm&af_sub2=s1&af_sub3=plx_email_topo_v10_S1D02","BANNER_1_CORPO":"","LINK_BANNER_1_CORPO":"https://mais-amigo.onelink.me/YU3C/t6v9cyos?c=plx_topo_de_funil_padrao&af_sub1=crm&af_sub2=s1&af_sub3=plx_email_topo_v10_S1D02","BANNER_2_CORPO":"","LINK_BANNER_2_CORPO":"https://mais-amigo.onelink.me/YU3C/t6v9cyos?c=plx_topo_de_funil_padrao&af_sub1=crm&af_sub2=s1&af_sub3=plx_email_topo_v10_S1D02","BANNER_3_CORPO":"https://stoplxmkt.blob.core.windows.net/plxmkt/20241125-EM-BOA-TEMPLATE-BLACK_FRIDAY_BANCO_DE_OFERTAS/footer-hd.png","LINK_BANNER_3_CORPO":"https://www.boasupermercados.com.br/","NOTA_LEGAL":"Sujeito a análise de crédito. Consulte termos e condições em: https://clubemaisamigo.com.br/cartao","COR_NOTA_LEGAL":"#242424","TAMANHO_DA_FONTE_NOTA_LEGAL":"10","RODAPE":"Enviado por Banco Afinz S.A - Banco Múltiplo - CNPJ: 04.814.563/0001-74<br>Afinz Instituição de Pagamento S.A - CNPJ: 60.114.865/0001-00<br>Rua XV de Novembro, 45 - Sorocaba, SP","MENSAGEM_LIMITE":"Boa notícia, {{nome}}: você tem R$ {{limite}} de limite pré-aprovado no cartão +amigo.","HEADER_TITULO":"+5% de desconto extra!","HEADER_SUBTITULO":"Vantagens exclusivas para você economizar","HEADER_IMAGEM_CARTAO":"https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/49b01a5b-dc3f-47a3-9ef5-afa14915626e.png","HEADER_LOGO":"https://image.contato.clubemaisamigo.com.br/lib/fe3011747364047e721773/m/1/cb6902a6-95ad-453f-a208-62e182eabf77.png"}$gaas$::jsonb, 'Plurix', $gaas$Topo de Funil Dinâmico$gaas$, $gaas$Boa Supermercados$gaas$, $gaas$Semana 1$gaas$, array[]::text[], $gaas$d1d10000-0000-4000-8000-0000000000e2$gaas$::uuid, 'draft', 1, $gaas$builtin-plurix-v13$gaas$, false, $gaas${"file":"Regua_Plurix_TopoFunil_Proposta_Outubro26.xlsx","sheet":"Briefing Fábrica","rows":"9-46","columns":"E-mail 1 a 3","importedAt":"2026-10-15","importKey":"TOPO DE FUNIL DINÂMICO|E-mail 2|BOA","network_fields_from":"rascunho V10 72413f76-4ada-c9b4-94ab-d869efe32434"}$gaas$::jsonb),
($gaas$d1d10000-0000-4000-8000-000000000114$gaas$::uuid, $gaas${"__id":"d1d10000-0000-4000-8000-000000000114","DT_INICIO":"2026-10-15T00:00","DT_FIM":"2027-10-19T23:59","UTM_CAMPANHA":"PLURIX_TOPO_SEMANA1_EMAIL2_COMPREMAIS","TP_CAMPANHA":"Topo de Funil","SEQUENCIA":"E-mail 2","ASSUNTO":"+5% de desconto extra em produtos selecionados","PRE_CABECALHO":"Você já tem o Clube. Peça seu cartão +amigo e aproveite ainda mais.","HEADER":"","CARTAO_NM_COMERCIAL":"+amigo","NM_PRODUTO_INTERNO":"COMPRE MAIS","TITULO_COPY_1_AZUL":"Olá, %%=v(@FirstName)=%%!","COR_COPY_1":"#2C3490","TAMANHO_DA_FONTE_TITULO_COPY_1":"24","TITULO_CTA_1":"Pedir cartão +amigo","LINK_CTA_1":"https://mais-amigo.onelink.me/YU3C/t6v9cyos?c=plx_topo_de_funil_padrao&af_sub1=crm&af_sub2=s1&af_sub3=plx_email_topo_v10_S1D02","COPY_1_PRETO":"Na hora de escolher como pagar suas compras, contar com <b>vantagens extras faz toda diferença.</b><br>O <b>cartão +amigo</b> foi feito para trazer mais possibilidades para sua rotina, com <b>DESCONTOS EXCLUSIVOS em produtos selecionados</b> no supermercado e benefícios para você aproveitar no dia a dia.","COR_COPY_PRETO_1":"#242424","TAMANHO_DA_FONTE_TITULO_COPY_PRETO_1":"18","TITULO_COPY_2":"Ganhe mais pagando com o <b>cartão de crédito +amigo.</b>","COR_TITULO_COPY_2":"#2C3490","TAMANHO_DA_FONTE_TITULO_COPY_2":"28","COPY_2_PRETO":"No Clube você conta com ofertas, eventos e sorteios. Com o <b>cartão +amigo</b> você conta com tudo isso <b>+5% de desconto extra em produtos selecionados</b> sempre que você paga com ele. As melhores vantagens do mercado na palma da sua mão! São muitas vantagens:<br><b>• +5% OFF em produtos selecionados</b><br><b>• Até 40 dias para pagar</b><br><b>• Até 70% OFF em medicamentos e consultas médicas</b><br><br>As melhores <b>vantagens do mercado</b> na palma da sua mão!","COR_COPY_2":"#2C3490","TAMANHO_DA_FONTE_COPY_2":"16","TITULO_CTA_2":"Quero meu cartão +amigo","LINK_CTA_2":"https://mais-amigo.onelink.me/YU3C/t6v9cyos?c=plx_topo_de_funil_padrao&af_sub1=crm&af_sub2=s1&af_sub3=plx_email_topo_v10_S1D02","BANNER_1_CORPO":"","LINK_BANNER_1_CORPO":"https://mais-amigo.onelink.me/YU3C/t6v9cyos?c=plx_topo_de_funil_padrao&af_sub1=crm&af_sub2=s1&af_sub3=plx_email_topo_v10_S1D02","BANNER_2_CORPO":"","LINK_BANNER_2_CORPO":"https://mais-amigo.onelink.me/YU3C/t6v9cyos?c=plx_topo_de_funil_padrao&af_sub1=crm&af_sub2=s1&af_sub3=plx_email_topo_v10_S1D02","BANNER_3_CORPO":"","LINK_BANNER_3_CORPO":"","NOTA_LEGAL":"Sujeito a análise de crédito. Consulte termos e condições em: https://clubemaisamigo.com.br/cartao","COR_NOTA_LEGAL":"#242424","TAMANHO_DA_FONTE_NOTA_LEGAL":"10","RODAPE":"Enviado por Banco Afinz S.A - Banco Múltiplo - CNPJ: 04.814.563/0001-74<br>Afinz Instituição de Pagamento S.A - CNPJ: 60.114.865/0001-00<br>Rua XV de Novembro, 45 - Sorocaba, SP","MENSAGEM_LIMITE":"Boa notícia, {{nome}}: você tem R$ {{limite}} de limite pré-aprovado no cartão +amigo.","HEADER_TITULO":"+5% de desconto extra!","HEADER_SUBTITULO":"Vantagens exclusivas para você economizar","HEADER_IMAGEM_CARTAO":"https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/49b01a5b-dc3f-47a3-9ef5-afa14915626e.png","HEADER_LOGO":"https://image.contato.clubemaisamigo.com.br/lib/fe3011747364047e721773/m/1/cb6902a6-95ad-453f-a208-62e182eabf77.png"}$gaas$::jsonb, 'Plurix', $gaas$Topo de Funil Dinâmico$gaas$, $gaas$Compre Mais$gaas$, $gaas$Semana 1$gaas$, array[]::text[], $gaas$d1d10000-0000-4000-8000-0000000000e2$gaas$::uuid, 'draft', 1, $gaas$builtin-plurix-v13$gaas$, false, $gaas${"file":"Regua_Plurix_TopoFunil_Proposta_Outubro26.xlsx","sheet":"Briefing Fábrica","rows":"9-46","columns":"E-mail 1 a 3","importedAt":"2026-10-15","importKey":"TOPO DE FUNIL DINÂMICO|E-mail 2|COMPRE MAIS","network_fields_from":"rascunho V10 751334e0-a6d0-1da1-fca1-a35945bf875b"}$gaas$::jsonb),
($gaas$d1d10000-0000-4000-8000-000000000115$gaas$::uuid, $gaas${"__id":"d1d10000-0000-4000-8000-000000000115","DT_INICIO":"2026-10-15T00:00","DT_FIM":"2027-10-19T23:59","UTM_CAMPANHA":"PLURIX_TOPO_SEMANA1_EMAIL2_PARANA","TP_CAMPANHA":"Topo de Funil","SEQUENCIA":"E-mail 2","ASSUNTO":"+5% de desconto extra em produtos selecionados","PRE_CABECALHO":"Você já tem o Clube. Peça seu cartão +amigo e aproveite ainda mais.","HEADER":"","CARTAO_NM_COMERCIAL":"+amigo","NM_PRODUTO_INTERNO":"PARANA","TITULO_COPY_1_AZUL":"Olá, %%=v(@FirstName)=%%!","COR_COPY_1":"#2C3490","TAMANHO_DA_FONTE_TITULO_COPY_1":"24","TITULO_CTA_1":"Pedir cartão +amigo","LINK_CTA_1":"https://mais-amigo.onelink.me/YU3C/t6v9cyos?c=plx_topo_de_funil_padrao&af_sub1=crm&af_sub2=s1&af_sub3=plx_email_topo_v10_S1D02","COPY_1_PRETO":"Na hora de escolher como pagar suas compras, contar com <b>vantagens extras faz toda diferença.</b><br>O <b>cartão +amigo</b> foi feito para trazer mais possibilidades para sua rotina, com <b>DESCONTOS EXCLUSIVOS em produtos selecionados</b> no supermercado e benefícios para você aproveitar no dia a dia.","COR_COPY_PRETO_1":"#242424","TAMANHO_DA_FONTE_TITULO_COPY_PRETO_1":"18","TITULO_COPY_2":"Ganhe mais pagando com o <b>cartão de crédito +amigo.</b>","COR_TITULO_COPY_2":"#2C3490","TAMANHO_DA_FONTE_TITULO_COPY_2":"28","COPY_2_PRETO":"No Clube você conta com ofertas, eventos e sorteios. Com o <b>cartão +amigo</b> você conta com tudo isso <b>+5% de desconto extra em produtos selecionados</b> sempre que você paga com ele. As melhores vantagens do mercado na palma da sua mão! São muitas vantagens:<br><b>• +5% OFF em produtos selecionados</b><br><b>• Até 40 dias para pagar</b><br><b>• Até 70% OFF em medicamentos e consultas médicas</b><br><br>As melhores <b>vantagens do mercado</b> na palma da sua mão!","COR_COPY_2":"#2C3490","TAMANHO_DA_FONTE_COPY_2":"16","TITULO_CTA_2":"Quero meu cartão +amigo","LINK_CTA_2":"https://mais-amigo.onelink.me/YU3C/t6v9cyos?c=plx_topo_de_funil_padrao&af_sub1=crm&af_sub2=s1&af_sub3=plx_email_topo_v10_S1D02","BANNER_1_CORPO":"","LINK_BANNER_1_CORPO":"https://mais-amigo.onelink.me/YU3C/t6v9cyos?c=plx_topo_de_funil_padrao&af_sub1=crm&af_sub2=s1&af_sub3=plx_email_topo_v10_S1D02","BANNER_2_CORPO":"","LINK_BANNER_2_CORPO":"https://mais-amigo.onelink.me/YU3C/t6v9cyos?c=plx_topo_de_funil_padrao&af_sub1=crm&af_sub2=s1&af_sub3=plx_email_topo_v10_S1D02","BANNER_3_CORPO":"https://stoplxmkt.blob.core.windows.net/plxmkt/20250625-EM-JORNADA_DE_AQUISICAO_MAIS_AMIGO-AFINZ-V2/footer-parana.png","LINK_BANNER_3_CORPO":"https://www.paranasupermercados.com.br","NOTA_LEGAL":"Sujeito a análise de crédito. Consulte termos e condições em: https://clubemaisamigo.com.br/cartao","COR_NOTA_LEGAL":"#242424","TAMANHO_DA_FONTE_NOTA_LEGAL":"10","RODAPE":"Enviado por Banco Afinz S.A - Banco Múltiplo - CNPJ: 04.814.563/0001-74<br>Afinz Instituição de Pagamento S.A - CNPJ: 60.114.865/0001-00<br>Rua XV de Novembro, 45 - Sorocaba, SP","MENSAGEM_LIMITE":"Boa notícia, {{nome}}: você tem R$ {{limite}} de limite pré-aprovado no cartão +amigo.","HEADER_TITULO":"+5% de desconto extra!","HEADER_SUBTITULO":"Vantagens exclusivas para você economizar","HEADER_IMAGEM_CARTAO":"https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/49b01a5b-dc3f-47a3-9ef5-afa14915626e.png","HEADER_LOGO":"https://image.contato.clubemaisamigo.com.br/lib/fe3011747364047e721773/m/1/cb6902a6-95ad-453f-a208-62e182eabf77.png"}$gaas$::jsonb, 'Plurix', $gaas$Topo de Funil Dinâmico$gaas$, $gaas$Paraná$gaas$, $gaas$Semana 1$gaas$, array[]::text[], $gaas$d1d10000-0000-4000-8000-0000000000e2$gaas$::uuid, 'draft', 1, $gaas$builtin-plurix-v13$gaas$, false, $gaas${"file":"Regua_Plurix_TopoFunil_Proposta_Outubro26.xlsx","sheet":"Briefing Fábrica","rows":"9-46","columns":"E-mail 1 a 3","importedAt":"2026-10-15","importKey":"TOPO DE FUNIL DINÂMICO|E-mail 2|PARANA","network_fields_from":"rascunho V10 301694d2-dd12-17ea-f3c6-f441c04d5e79"}$gaas$::jsonb),
($gaas$d1d10000-0000-4000-8000-000000000116$gaas$::uuid, $gaas${"__id":"d1d10000-0000-4000-8000-000000000116","DT_INICIO":"2026-10-15T00:00","DT_FIM":"2027-10-19T23:59","UTM_CAMPANHA":"PLURIX_TOPO_SEMANA1_EMAIL2_SUPERPAO","TP_CAMPANHA":"Topo de Funil","SEQUENCIA":"E-mail 2","ASSUNTO":"+5% de desconto extra em produtos selecionados","PRE_CABECALHO":"Você já tem o Clube. Peça seu cartão +amigo e aproveite ainda mais.","HEADER":"","CARTAO_NM_COMERCIAL":"+amigo","NM_PRODUTO_INTERNO":"SUPERPAO","TITULO_COPY_1_AZUL":"Olá, %%=v(@FirstName)=%%!","COR_COPY_1":"#2C3490","TAMANHO_DA_FONTE_TITULO_COPY_1":"24","TITULO_CTA_1":"Pedir cartão +amigo","LINK_CTA_1":"https://mais-amigo.onelink.me/YU3C/t6v9cyos?c=plx_topo_de_funil_padrao&af_sub1=crm&af_sub2=s1&af_sub3=plx_email_topo_v10_S1D02","COPY_1_PRETO":"Na hora de escolher como pagar suas compras, contar com <b>vantagens extras faz toda diferença.</b><br>O <b>cartão +amigo</b> foi feito para trazer mais possibilidades para sua rotina, com <b>DESCONTOS EXCLUSIVOS em produtos selecionados</b> no supermercado e benefícios para você aproveitar no dia a dia.","COR_COPY_PRETO_1":"#242424","TAMANHO_DA_FONTE_TITULO_COPY_PRETO_1":"18","TITULO_COPY_2":"Ganhe mais pagando com o <b>cartão de crédito +amigo.</b>","COR_TITULO_COPY_2":"#2C3490","TAMANHO_DA_FONTE_TITULO_COPY_2":"28","COPY_2_PRETO":"No Clube você conta com ofertas, eventos e sorteios. Com o <b>cartão +amigo</b> você conta com tudo isso <b>+5% de desconto extra em produtos selecionados</b> sempre que você paga com ele. As melhores vantagens do mercado na palma da sua mão! São muitas vantagens:<br><b>• +5% OFF em produtos selecionados</b><br><b>• Até 40 dias para pagar</b><br><b>• Até 70% OFF em medicamentos e consultas médicas</b><br><br>As melhores <b>vantagens do mercado</b> na palma da sua mão!","COR_COPY_2":"#2C3490","TAMANHO_DA_FONTE_COPY_2":"16","TITULO_CTA_2":"Quero meu cartão +amigo","LINK_CTA_2":"https://mais-amigo.onelink.me/YU3C/t6v9cyos?c=plx_topo_de_funil_padrao&af_sub1=crm&af_sub2=s1&af_sub3=plx_email_topo_v10_S1D02","BANNER_1_CORPO":"","LINK_BANNER_1_CORPO":"https://mais-amigo.onelink.me/YU3C/t6v9cyos?c=plx_topo_de_funil_padrao&af_sub1=crm&af_sub2=s1&af_sub3=plx_email_topo_v10_S1D02","BANNER_2_CORPO":"","LINK_BANNER_2_CORPO":"https://mais-amigo.onelink.me/YU3C/t6v9cyos?c=plx_topo_de_funil_padrao&af_sub1=crm&af_sub2=s1&af_sub3=plx_email_topo_v10_S1D02","BANNER_3_CORPO":"","LINK_BANNER_3_CORPO":"","NOTA_LEGAL":"Sujeito a análise de crédito. Consulte termos e condições em: https://clubemaisamigo.com.br/cartao","COR_NOTA_LEGAL":"#242424","TAMANHO_DA_FONTE_NOTA_LEGAL":"10","RODAPE":"Enviado por Banco Afinz S.A - Banco Múltiplo - CNPJ: 04.814.563/0001-74<br>Afinz Instituição de Pagamento S.A - CNPJ: 60.114.865/0001-00<br>Rua XV de Novembro, 45 - Sorocaba, SP","MENSAGEM_LIMITE":"Boa notícia, {{nome}}: você tem R$ {{limite}} de limite pré-aprovado no cartão +amigo.","HEADER_TITULO":"+5% de desconto extra!","HEADER_SUBTITULO":"Vantagens exclusivas para você economizar","HEADER_IMAGEM_CARTAO":"https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/49b01a5b-dc3f-47a3-9ef5-afa14915626e.png","HEADER_LOGO":"https://image.contato.clubemaisamigo.com.br/lib/fe3011747364047e721773/m/1/cb6902a6-95ad-453f-a208-62e182eabf77.png"}$gaas$::jsonb, 'Plurix', $gaas$Topo de Funil Dinâmico$gaas$, $gaas$Superpão$gaas$, $gaas$Semana 1$gaas$, array[]::text[], $gaas$d1d10000-0000-4000-8000-0000000000e2$gaas$::uuid, 'draft', 1, $gaas$builtin-plurix-v13$gaas$, false, $gaas${"file":"Regua_Plurix_TopoFunil_Proposta_Outubro26.xlsx","sheet":"Briefing Fábrica","rows":"9-46","columns":"E-mail 1 a 3","importedAt":"2026-10-15","importKey":"TOPO DE FUNIL DINÂMICO|E-mail 2|SUPERPAO","network_fields_from":"rascunho V10 dc8c370a-4d03-11e4-43b7-1ea7e75b1c7f"}$gaas$::jsonb),
($gaas$d1d10000-0000-4000-8000-000000000121$gaas$::uuid, $gaas${"__id":"d1d10000-0000-4000-8000-000000000121","DT_INICIO":"2026-10-15T00:00","DT_FIM":"2027-10-19T23:59","UTM_CAMPANHA":"PLURIX_TOPO_SEMANA2_EMAIL3_AMIGAO","TP_CAMPANHA":"Topo de Funil","SEQUENCIA":"E-mail 3","ASSUNTO":"Mais economia no carrinho com o cartão +amigo","PRE_CABECALHO":"Vantagens extras em produtos selecionados do supermercado.","HEADER":"","CARTAO_NM_COMERCIAL":"+amigo","NM_PRODUTO_INTERNO":"AMIGAO","TITULO_COPY_1_AZUL":"Olá, %%=v(@FirstName)=%%!","COR_COPY_1":"#2C3490","TAMANHO_DA_FONTE_TITULO_COPY_1":"24","TITULO_CTA_1":"Pedir cartão +amigo","LINK_CTA_1":"https://mais-amigo.onelink.me/YU3C/t6v9cyos?c=plx_topo_de_funil_padrao&af_sub1=crm&af_sub2=s2&af_sub3=plx_email_topo_v10_S2D01","COPY_1_PRETO":"Na hora de fazer as compras, <b>cada desconto conta!</b><br>Com o <b>cartão de crédito +amigo</b>, você pode aproveitar <b>vantagens extras</b> em produtos selecionados do supermercado.","COR_COPY_PRETO_1":"#242424","TAMANHO_DA_FONTE_TITULO_COPY_PRETO_1":"18","TITULO_COPY_2":"","COR_TITULO_COPY_2":"#2C3490","TAMANHO_DA_FONTE_TITULO_COPY_2":"28","COPY_2_PRETO":"","COR_COPY_2":"#2C3490","TAMANHO_DA_FONTE_COPY_2":"16","TITULO_CTA_2":"Quero meu cartão +amigo","LINK_CTA_2":"https://mais-amigo.onelink.me/YU3C/t6v9cyos?c=plx_topo_de_funil_padrao&af_sub1=crm&af_sub2=s2&af_sub3=plx_email_topo_v10_S2D01","BANNER_1_CORPO":"","LINK_BANNER_1_CORPO":"https://mais-amigo.onelink.me/YU3C/t6v9cyos?c=plx_topo_de_funil_padrao&af_sub1=crm&af_sub2=s2&af_sub3=plx_email_topo_v10_S2D01","BANNER_2_CORPO":"","LINK_BANNER_2_CORPO":"https://mais-amigo.onelink.me/YU3C/t6v9cyos?c=plx_topo_de_funil_padrao&af_sub1=crm&af_sub2=s2&af_sub3=plx_email_topo_v10_S2D01","BANNER_3_CORPO":"https://stoplxmkt.blob.core.windows.net/plxmkt/20250625-EM-JORNADA_DE_AQUISICAO_MAIS_AMIGO-AFINZ-V2/footer-amigao.png","LINK_BANNER_3_CORPO":"https://www.amigao.com/","NOTA_LEGAL":"Sujeito a análise de crédito. Consulte termos e condições em: https://clubemaisamigo.com.br/cartao","COR_NOTA_LEGAL":"#242424","TAMANHO_DA_FONTE_NOTA_LEGAL":"10","RODAPE":"Enviado por Banco Afinz S.A - Banco Múltiplo - CNPJ: 04.814.563/0001-74<br>Afinz Instituição de Pagamento S.A - CNPJ: 60.114.865/0001-00<br>Rua XV de Novembro, 45 - Sorocaba, SP","MENSAGEM_LIMITE":"Boa notícia, {{nome}}: você tem R$ {{limite}} de limite pré-aprovado no cartão +amigo.","HEADER_TITULO":"Até 40 dias para pagar!","HEADER_SUBTITULO":"Mais flexibilidade e economia para o seu bolso. Aproveite!","HEADER_IMAGEM_CARTAO":"https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/29a7dd93-cebf-47eb-9a7c-822ffcfc2be2.png","HEADER_LOGO":"https://image.contato.clubemaisamigo.com.br/lib/fe3011747364047e721773/m/1/cb6902a6-95ad-453f-a208-62e182eabf77.png"}$gaas$::jsonb, 'Plurix', $gaas$Topo de Funil Dinâmico$gaas$, $gaas$Amigão$gaas$, $gaas$Semana 2$gaas$, array[]::text[], $gaas$d1d10000-0000-4000-8000-0000000000e3$gaas$::uuid, 'draft', 1, $gaas$builtin-plurix-v13$gaas$, false, $gaas${"file":"Regua_Plurix_TopoFunil_Proposta_Outubro26.xlsx","sheet":"Briefing Fábrica","rows":"9-46","columns":"E-mail 1 a 3","importedAt":"2026-10-15","importKey":"TOPO DE FUNIL DINÂMICO|E-mail 3|AMIGAO","network_fields_from":"rascunho V10 8e7d12f7-0485-71cd-4957-d98540ee9c51"}$gaas$::jsonb),
($gaas$d1d10000-0000-4000-8000-000000000122$gaas$::uuid, $gaas${"__id":"d1d10000-0000-4000-8000-000000000122","DT_INICIO":"2026-10-15T00:00","DT_FIM":"2027-10-19T23:59","UTM_CAMPANHA":"PLURIX_TOPO_SEMANA2_EMAIL3_AVENIDA","TP_CAMPANHA":"Topo de Funil","SEQUENCIA":"E-mail 3","ASSUNTO":"Mais economia no carrinho com o cartão +amigo","PRE_CABECALHO":"Vantagens extras em produtos selecionados do supermercado.","HEADER":"","CARTAO_NM_COMERCIAL":"+amigo","NM_PRODUTO_INTERNO":"AVENIDA","TITULO_COPY_1_AZUL":"Olá, %%=v(@FirstName)=%%!","COR_COPY_1":"#2C3490","TAMANHO_DA_FONTE_TITULO_COPY_1":"24","TITULO_CTA_1":"Pedir cartão +amigo","LINK_CTA_1":"https://mais-amigo.onelink.me/YU3C/t6v9cyos?c=plx_topo_de_funil_padrao&af_sub1=crm&af_sub2=s2&af_sub3=plx_email_topo_v10_S2D01","COPY_1_PRETO":"Na hora de fazer as compras, <b>cada desconto conta!</b><br>Com o <b>cartão de crédito +amigo</b>, você pode aproveitar <b>vantagens extras</b> em produtos selecionados do supermercado.","COR_COPY_PRETO_1":"#242424","TAMANHO_DA_FONTE_TITULO_COPY_PRETO_1":"18","TITULO_COPY_2":"","COR_TITULO_COPY_2":"#2C3490","TAMANHO_DA_FONTE_TITULO_COPY_2":"28","COPY_2_PRETO":"","COR_COPY_2":"#2C3490","TAMANHO_DA_FONTE_COPY_2":"16","TITULO_CTA_2":"Quero meu cartão +amigo","LINK_CTA_2":"https://mais-amigo.onelink.me/YU3C/t6v9cyos?c=plx_topo_de_funil_padrao&af_sub1=crm&af_sub2=s2&af_sub3=plx_email_topo_v10_S2D01","BANNER_1_CORPO":"","LINK_BANNER_1_CORPO":"https://mais-amigo.onelink.me/YU3C/t6v9cyos?c=plx_topo_de_funil_padrao&af_sub1=crm&af_sub2=s2&af_sub3=plx_email_topo_v10_S2D01","BANNER_2_CORPO":"","LINK_BANNER_2_CORPO":"https://mais-amigo.onelink.me/YU3C/t6v9cyos?c=plx_topo_de_funil_padrao&af_sub1=crm&af_sub2=s2&af_sub3=plx_email_topo_v10_S2D01","BANNER_3_CORPO":"https://stoplxmkt.blob.core.windows.net/plxmkt/20241125-EM-AVE-TEMPLATE-BLACK_FRIDAY_BANCO_DE_OFERTAS/footer-avenida.png","LINK_BANNER_3_CORPO":"https://loja.supermercadosavenida.com.br/","NOTA_LEGAL":"Sujeito a análise de crédito. Consulte termos e condições em: https://clubemaisamigo.com.br/cartao","COR_NOTA_LEGAL":"#242424","TAMANHO_DA_FONTE_NOTA_LEGAL":"10","RODAPE":"Enviado por Banco Afinz S.A - Banco Múltiplo - CNPJ: 04.814.563/0001-74<br>Afinz Instituição de Pagamento S.A - CNPJ: 60.114.865/0001-00<br>Rua XV de Novembro, 45 - Sorocaba, SP","MENSAGEM_LIMITE":"Boa notícia, {{nome}}: você tem R$ {{limite}} de limite pré-aprovado no cartão +amigo.","HEADER_TITULO":"Até 40 dias para pagar!","HEADER_SUBTITULO":"Mais flexibilidade e economia para o seu bolso. Aproveite!","HEADER_IMAGEM_CARTAO":"https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/29a7dd93-cebf-47eb-9a7c-822ffcfc2be2.png","HEADER_LOGO":"https://image.contato.clubemaisamigo.com.br/lib/fe3011747364047e721773/m/1/cb6902a6-95ad-453f-a208-62e182eabf77.png"}$gaas$::jsonb, 'Plurix', $gaas$Topo de Funil Dinâmico$gaas$, $gaas$Supermercados Avenida$gaas$, $gaas$Semana 2$gaas$, array[]::text[], $gaas$d1d10000-0000-4000-8000-0000000000e3$gaas$::uuid, 'draft', 1, $gaas$builtin-plurix-v13$gaas$, false, $gaas${"file":"Regua_Plurix_TopoFunil_Proposta_Outubro26.xlsx","sheet":"Briefing Fábrica","rows":"9-46","columns":"E-mail 1 a 3","importedAt":"2026-10-15","importKey":"TOPO DE FUNIL DINÂMICO|E-mail 3|AVENIDA","network_fields_from":"rascunho V10 a0d583d1-1fa4-23ac-7c36-b60417e6bf85"}$gaas$::jsonb),
($gaas$d1d10000-0000-4000-8000-000000000123$gaas$::uuid, $gaas${"__id":"d1d10000-0000-4000-8000-000000000123","DT_INICIO":"2026-10-15T00:00","DT_FIM":"2027-10-19T23:59","UTM_CAMPANHA":"PLURIX_TOPO_SEMANA2_EMAIL3_BOA","TP_CAMPANHA":"Topo de Funil","SEQUENCIA":"E-mail 3","ASSUNTO":"Mais economia no carrinho com o cartão +amigo","PRE_CABECALHO":"Vantagens extras em produtos selecionados do supermercado.","HEADER":"","CARTAO_NM_COMERCIAL":"+amigo","NM_PRODUTO_INTERNO":"BOA","TITULO_COPY_1_AZUL":"Olá, %%=v(@FirstName)=%%!","COR_COPY_1":"#2C3490","TAMANHO_DA_FONTE_TITULO_COPY_1":"24","TITULO_CTA_1":"Pedir cartão +amigo","LINK_CTA_1":"https://mais-amigo.onelink.me/YU3C/t6v9cyos?c=plx_topo_de_funil_padrao&af_sub1=crm&af_sub2=s2&af_sub3=plx_email_topo_v10_S2D01","COPY_1_PRETO":"Na hora de fazer as compras, <b>cada desconto conta!</b><br>Com o <b>cartão de crédito +amigo</b>, você pode aproveitar <b>vantagens extras</b> em produtos selecionados do supermercado.","COR_COPY_PRETO_1":"#242424","TAMANHO_DA_FONTE_TITULO_COPY_PRETO_1":"18","TITULO_COPY_2":"","COR_TITULO_COPY_2":"#2C3490","TAMANHO_DA_FONTE_TITULO_COPY_2":"28","COPY_2_PRETO":"","COR_COPY_2":"#2C3490","TAMANHO_DA_FONTE_COPY_2":"16","TITULO_CTA_2":"Quero meu cartão +amigo","LINK_CTA_2":"https://mais-amigo.onelink.me/YU3C/t6v9cyos?c=plx_topo_de_funil_padrao&af_sub1=crm&af_sub2=s2&af_sub3=plx_email_topo_v10_S2D01","BANNER_1_CORPO":"","LINK_BANNER_1_CORPO":"https://mais-amigo.onelink.me/YU3C/t6v9cyos?c=plx_topo_de_funil_padrao&af_sub1=crm&af_sub2=s2&af_sub3=plx_email_topo_v10_S2D01","BANNER_2_CORPO":"","LINK_BANNER_2_CORPO":"https://mais-amigo.onelink.me/YU3C/t6v9cyos?c=plx_topo_de_funil_padrao&af_sub1=crm&af_sub2=s2&af_sub3=plx_email_topo_v10_S2D01","BANNER_3_CORPO":"https://stoplxmkt.blob.core.windows.net/plxmkt/20241125-EM-BOA-TEMPLATE-BLACK_FRIDAY_BANCO_DE_OFERTAS/footer-hd.png","LINK_BANNER_3_CORPO":"https://www.boasupermercados.com.br/","NOTA_LEGAL":"Sujeito a análise de crédito. Consulte termos e condições em: https://clubemaisamigo.com.br/cartao","COR_NOTA_LEGAL":"#242424","TAMANHO_DA_FONTE_NOTA_LEGAL":"10","RODAPE":"Enviado por Banco Afinz S.A - Banco Múltiplo - CNPJ: 04.814.563/0001-74<br>Afinz Instituição de Pagamento S.A - CNPJ: 60.114.865/0001-00<br>Rua XV de Novembro, 45 - Sorocaba, SP","MENSAGEM_LIMITE":"Boa notícia, {{nome}}: você tem R$ {{limite}} de limite pré-aprovado no cartão +amigo.","HEADER_TITULO":"Até 40 dias para pagar!","HEADER_SUBTITULO":"Mais flexibilidade e economia para o seu bolso. Aproveite!","HEADER_IMAGEM_CARTAO":"https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/29a7dd93-cebf-47eb-9a7c-822ffcfc2be2.png","HEADER_LOGO":"https://image.contato.clubemaisamigo.com.br/lib/fe3011747364047e721773/m/1/cb6902a6-95ad-453f-a208-62e182eabf77.png"}$gaas$::jsonb, 'Plurix', $gaas$Topo de Funil Dinâmico$gaas$, $gaas$Boa Supermercados$gaas$, $gaas$Semana 2$gaas$, array[]::text[], $gaas$d1d10000-0000-4000-8000-0000000000e3$gaas$::uuid, 'draft', 1, $gaas$builtin-plurix-v13$gaas$, false, $gaas${"file":"Regua_Plurix_TopoFunil_Proposta_Outubro26.xlsx","sheet":"Briefing Fábrica","rows":"9-46","columns":"E-mail 1 a 3","importedAt":"2026-10-15","importKey":"TOPO DE FUNIL DINÂMICO|E-mail 3|BOA","network_fields_from":"rascunho V10 87ac2f23-a66d-8741-2ffc-1574d1c61207"}$gaas$::jsonb),
($gaas$d1d10000-0000-4000-8000-000000000124$gaas$::uuid, $gaas${"__id":"d1d10000-0000-4000-8000-000000000124","DT_INICIO":"2026-10-15T00:00","DT_FIM":"2027-10-19T23:59","UTM_CAMPANHA":"PLURIX_TOPO_SEMANA2_EMAIL3_COMPREMAIS","TP_CAMPANHA":"Topo de Funil","SEQUENCIA":"E-mail 3","ASSUNTO":"Mais economia no carrinho com o cartão +amigo","PRE_CABECALHO":"Vantagens extras em produtos selecionados do supermercado.","HEADER":"","CARTAO_NM_COMERCIAL":"+amigo","NM_PRODUTO_INTERNO":"COMPRE MAIS","TITULO_COPY_1_AZUL":"Olá, %%=v(@FirstName)=%%!","COR_COPY_1":"#2C3490","TAMANHO_DA_FONTE_TITULO_COPY_1":"24","TITULO_CTA_1":"Pedir cartão +amigo","LINK_CTA_1":"https://mais-amigo.onelink.me/YU3C/t6v9cyos?c=plx_topo_de_funil_padrao&af_sub1=crm&af_sub2=s2&af_sub3=plx_email_topo_v10_S2D01","COPY_1_PRETO":"Na hora de fazer as compras, <b>cada desconto conta!</b><br>Com o <b>cartão de crédito +amigo</b>, você pode aproveitar <b>vantagens extras</b> em produtos selecionados do supermercado.","COR_COPY_PRETO_1":"#242424","TAMANHO_DA_FONTE_TITULO_COPY_PRETO_1":"18","TITULO_COPY_2":"","COR_TITULO_COPY_2":"#2C3490","TAMANHO_DA_FONTE_TITULO_COPY_2":"28","COPY_2_PRETO":"","COR_COPY_2":"#2C3490","TAMANHO_DA_FONTE_COPY_2":"16","TITULO_CTA_2":"Quero meu cartão +amigo","LINK_CTA_2":"https://mais-amigo.onelink.me/YU3C/t6v9cyos?c=plx_topo_de_funil_padrao&af_sub1=crm&af_sub2=s2&af_sub3=plx_email_topo_v10_S2D01","BANNER_1_CORPO":"","LINK_BANNER_1_CORPO":"https://mais-amigo.onelink.me/YU3C/t6v9cyos?c=plx_topo_de_funil_padrao&af_sub1=crm&af_sub2=s2&af_sub3=plx_email_topo_v10_S2D01","BANNER_2_CORPO":"","LINK_BANNER_2_CORPO":"https://mais-amigo.onelink.me/YU3C/t6v9cyos?c=plx_topo_de_funil_padrao&af_sub1=crm&af_sub2=s2&af_sub3=plx_email_topo_v10_S2D01","BANNER_3_CORPO":"","LINK_BANNER_3_CORPO":"","NOTA_LEGAL":"Sujeito a análise de crédito. Consulte termos e condições em: https://clubemaisamigo.com.br/cartao","COR_NOTA_LEGAL":"#242424","TAMANHO_DA_FONTE_NOTA_LEGAL":"10","RODAPE":"Enviado por Banco Afinz S.A - Banco Múltiplo - CNPJ: 04.814.563/0001-74<br>Afinz Instituição de Pagamento S.A - CNPJ: 60.114.865/0001-00<br>Rua XV de Novembro, 45 - Sorocaba, SP","MENSAGEM_LIMITE":"Boa notícia, {{nome}}: você tem R$ {{limite}} de limite pré-aprovado no cartão +amigo.","HEADER_TITULO":"Até 40 dias para pagar!","HEADER_SUBTITULO":"Mais flexibilidade e economia para o seu bolso. Aproveite!","HEADER_IMAGEM_CARTAO":"https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/29a7dd93-cebf-47eb-9a7c-822ffcfc2be2.png","HEADER_LOGO":"https://image.contato.clubemaisamigo.com.br/lib/fe3011747364047e721773/m/1/cb6902a6-95ad-453f-a208-62e182eabf77.png"}$gaas$::jsonb, 'Plurix', $gaas$Topo de Funil Dinâmico$gaas$, $gaas$Compre Mais$gaas$, $gaas$Semana 2$gaas$, array[]::text[], $gaas$d1d10000-0000-4000-8000-0000000000e3$gaas$::uuid, 'draft', 1, $gaas$builtin-plurix-v13$gaas$, false, $gaas${"file":"Regua_Plurix_TopoFunil_Proposta_Outubro26.xlsx","sheet":"Briefing Fábrica","rows":"9-46","columns":"E-mail 1 a 3","importedAt":"2026-10-15","importKey":"TOPO DE FUNIL DINÂMICO|E-mail 3|COMPRE MAIS","network_fields_from":"rascunho V10 f79a69ad-de67-c816-9bb0-01d4a2b6071e"}$gaas$::jsonb),
($gaas$d1d10000-0000-4000-8000-000000000125$gaas$::uuid, $gaas${"__id":"d1d10000-0000-4000-8000-000000000125","DT_INICIO":"2026-10-15T00:00","DT_FIM":"2027-10-19T23:59","UTM_CAMPANHA":"PLURIX_TOPO_SEMANA2_EMAIL3_PARANA","TP_CAMPANHA":"Topo de Funil","SEQUENCIA":"E-mail 3","ASSUNTO":"Mais economia no carrinho com o cartão +amigo","PRE_CABECALHO":"Vantagens extras em produtos selecionados do supermercado.","HEADER":"","CARTAO_NM_COMERCIAL":"+amigo","NM_PRODUTO_INTERNO":"PARANA","TITULO_COPY_1_AZUL":"Olá, %%=v(@FirstName)=%%!","COR_COPY_1":"#2C3490","TAMANHO_DA_FONTE_TITULO_COPY_1":"24","TITULO_CTA_1":"Pedir cartão +amigo","LINK_CTA_1":"https://mais-amigo.onelink.me/YU3C/t6v9cyos?c=plx_topo_de_funil_padrao&af_sub1=crm&af_sub2=s2&af_sub3=plx_email_topo_v10_S2D01","COPY_1_PRETO":"Na hora de fazer as compras, <b>cada desconto conta!</b><br>Com o <b>cartão de crédito +amigo</b>, você pode aproveitar <b>vantagens extras</b> em produtos selecionados do supermercado.","COR_COPY_PRETO_1":"#242424","TAMANHO_DA_FONTE_TITULO_COPY_PRETO_1":"18","TITULO_COPY_2":"","COR_TITULO_COPY_2":"#2C3490","TAMANHO_DA_FONTE_TITULO_COPY_2":"28","COPY_2_PRETO":"","COR_COPY_2":"#2C3490","TAMANHO_DA_FONTE_COPY_2":"16","TITULO_CTA_2":"Quero meu cartão +amigo","LINK_CTA_2":"https://mais-amigo.onelink.me/YU3C/t6v9cyos?c=plx_topo_de_funil_padrao&af_sub1=crm&af_sub2=s2&af_sub3=plx_email_topo_v10_S2D01","BANNER_1_CORPO":"","LINK_BANNER_1_CORPO":"https://mais-amigo.onelink.me/YU3C/t6v9cyos?c=plx_topo_de_funil_padrao&af_sub1=crm&af_sub2=s2&af_sub3=plx_email_topo_v10_S2D01","BANNER_2_CORPO":"","LINK_BANNER_2_CORPO":"https://mais-amigo.onelink.me/YU3C/t6v9cyos?c=plx_topo_de_funil_padrao&af_sub1=crm&af_sub2=s2&af_sub3=plx_email_topo_v10_S2D01","BANNER_3_CORPO":"https://stoplxmkt.blob.core.windows.net/plxmkt/20250625-EM-JORNADA_DE_AQUISICAO_MAIS_AMIGO-AFINZ-V2/footer-parana.png","LINK_BANNER_3_CORPO":"https://www.paranasupermercados.com.br","NOTA_LEGAL":"Sujeito a análise de crédito. Consulte termos e condições em: https://clubemaisamigo.com.br/cartao","COR_NOTA_LEGAL":"#242424","TAMANHO_DA_FONTE_NOTA_LEGAL":"10","RODAPE":"Enviado por Banco Afinz S.A - Banco Múltiplo - CNPJ: 04.814.563/0001-74<br>Afinz Instituição de Pagamento S.A - CNPJ: 60.114.865/0001-00<br>Rua XV de Novembro, 45 - Sorocaba, SP","MENSAGEM_LIMITE":"Boa notícia, {{nome}}: você tem R$ {{limite}} de limite pré-aprovado no cartão +amigo.","HEADER_TITULO":"Até 40 dias para pagar!","HEADER_SUBTITULO":"Mais flexibilidade e economia para o seu bolso. Aproveite!","HEADER_IMAGEM_CARTAO":"https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/29a7dd93-cebf-47eb-9a7c-822ffcfc2be2.png","HEADER_LOGO":"https://image.contato.clubemaisamigo.com.br/lib/fe3011747364047e721773/m/1/cb6902a6-95ad-453f-a208-62e182eabf77.png"}$gaas$::jsonb, 'Plurix', $gaas$Topo de Funil Dinâmico$gaas$, $gaas$Paraná$gaas$, $gaas$Semana 2$gaas$, array[]::text[], $gaas$d1d10000-0000-4000-8000-0000000000e3$gaas$::uuid, 'draft', 1, $gaas$builtin-plurix-v13$gaas$, false, $gaas${"file":"Regua_Plurix_TopoFunil_Proposta_Outubro26.xlsx","sheet":"Briefing Fábrica","rows":"9-46","columns":"E-mail 1 a 3","importedAt":"2026-10-15","importKey":"TOPO DE FUNIL DINÂMICO|E-mail 3|PARANA","network_fields_from":"rascunho V10 d08799f5-f090-5799-7e1e-df4c2907cc65"}$gaas$::jsonb),
($gaas$d1d10000-0000-4000-8000-000000000126$gaas$::uuid, $gaas${"__id":"d1d10000-0000-4000-8000-000000000126","DT_INICIO":"2026-10-15T00:00","DT_FIM":"2027-10-19T23:59","UTM_CAMPANHA":"PLURIX_TOPO_SEMANA2_EMAIL3_SUPERPAO","TP_CAMPANHA":"Topo de Funil","SEQUENCIA":"E-mail 3","ASSUNTO":"Mais economia no carrinho com o cartão +amigo","PRE_CABECALHO":"Vantagens extras em produtos selecionados do supermercado.","HEADER":"","CARTAO_NM_COMERCIAL":"+amigo","NM_PRODUTO_INTERNO":"SUPERPAO","TITULO_COPY_1_AZUL":"Olá, %%=v(@FirstName)=%%!","COR_COPY_1":"#2C3490","TAMANHO_DA_FONTE_TITULO_COPY_1":"24","TITULO_CTA_1":"Pedir cartão +amigo","LINK_CTA_1":"https://mais-amigo.onelink.me/YU3C/t6v9cyos?c=plx_topo_de_funil_padrao&af_sub1=crm&af_sub2=s2&af_sub3=plx_email_topo_v10_S2D01","COPY_1_PRETO":"Na hora de fazer as compras, <b>cada desconto conta!</b><br>Com o <b>cartão de crédito +amigo</b>, você pode aproveitar <b>vantagens extras</b> em produtos selecionados do supermercado.","COR_COPY_PRETO_1":"#242424","TAMANHO_DA_FONTE_TITULO_COPY_PRETO_1":"18","TITULO_COPY_2":"","COR_TITULO_COPY_2":"#2C3490","TAMANHO_DA_FONTE_TITULO_COPY_2":"28","COPY_2_PRETO":"","COR_COPY_2":"#2C3490","TAMANHO_DA_FONTE_COPY_2":"16","TITULO_CTA_2":"Quero meu cartão +amigo","LINK_CTA_2":"https://mais-amigo.onelink.me/YU3C/t6v9cyos?c=plx_topo_de_funil_padrao&af_sub1=crm&af_sub2=s2&af_sub3=plx_email_topo_v10_S2D01","BANNER_1_CORPO":"","LINK_BANNER_1_CORPO":"https://mais-amigo.onelink.me/YU3C/t6v9cyos?c=plx_topo_de_funil_padrao&af_sub1=crm&af_sub2=s2&af_sub3=plx_email_topo_v10_S2D01","BANNER_2_CORPO":"","LINK_BANNER_2_CORPO":"https://mais-amigo.onelink.me/YU3C/t6v9cyos?c=plx_topo_de_funil_padrao&af_sub1=crm&af_sub2=s2&af_sub3=plx_email_topo_v10_S2D01","BANNER_3_CORPO":"","LINK_BANNER_3_CORPO":"","NOTA_LEGAL":"Sujeito a análise de crédito. Consulte termos e condições em: https://clubemaisamigo.com.br/cartao","COR_NOTA_LEGAL":"#242424","TAMANHO_DA_FONTE_NOTA_LEGAL":"10","RODAPE":"Enviado por Banco Afinz S.A - Banco Múltiplo - CNPJ: 04.814.563/0001-74<br>Afinz Instituição de Pagamento S.A - CNPJ: 60.114.865/0001-00<br>Rua XV de Novembro, 45 - Sorocaba, SP","MENSAGEM_LIMITE":"Boa notícia, {{nome}}: você tem R$ {{limite}} de limite pré-aprovado no cartão +amigo.","HEADER_TITULO":"Até 40 dias para pagar!","HEADER_SUBTITULO":"Mais flexibilidade e economia para o seu bolso. Aproveite!","HEADER_IMAGEM_CARTAO":"https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/29a7dd93-cebf-47eb-9a7c-822ffcfc2be2.png","HEADER_LOGO":"https://image.contato.clubemaisamigo.com.br/lib/fe3011747364047e721773/m/1/cb6902a6-95ad-453f-a208-62e182eabf77.png"}$gaas$::jsonb, 'Plurix', $gaas$Topo de Funil Dinâmico$gaas$, $gaas$Superpão$gaas$, $gaas$Semana 2$gaas$, array[]::text[], $gaas$d1d10000-0000-4000-8000-0000000000e3$gaas$::uuid, 'draft', 1, $gaas$builtin-plurix-v13$gaas$, false, $gaas${"file":"Regua_Plurix_TopoFunil_Proposta_Outubro26.xlsx","sheet":"Briefing Fábrica","rows":"9-46","columns":"E-mail 1 a 3","importedAt":"2026-10-15","importKey":"TOPO DE FUNIL DINÂMICO|E-mail 3|SUPERPAO","network_fields_from":"rascunho V10 63dd5886-bb5f-2b07-2ea8-20b634ce0543"}$gaas$::jsonb)
on conflict (id) do nothing;

insert into public.dynamic_email_briefing_versions (briefing_id, version, snapshot, change_summary, warnings)
select b.id, 1, b.briefing_data, 'Importado da planilha Briefing Fábrica (linhas 9 a 46) como rascunho: negrito em <b>, quebras em <br>, lista em •.', $gaas$["O nome já aparece na faixa de limite e se repete no corpo. Revise o texto para não chamar a pessoa pelo nome duas vezes."]$gaas$::jsonb
from public.dynamic_email_briefings b
where b.id in ($gaas$d1d10000-0000-4000-8000-000000000101$gaas$::uuid, $gaas$d1d10000-0000-4000-8000-000000000102$gaas$::uuid, $gaas$d1d10000-0000-4000-8000-000000000103$gaas$::uuid, $gaas$d1d10000-0000-4000-8000-000000000104$gaas$::uuid, $gaas$d1d10000-0000-4000-8000-000000000105$gaas$::uuid, $gaas$d1d10000-0000-4000-8000-000000000106$gaas$::uuid, $gaas$d1d10000-0000-4000-8000-000000000111$gaas$::uuid, $gaas$d1d10000-0000-4000-8000-000000000112$gaas$::uuid, $gaas$d1d10000-0000-4000-8000-000000000113$gaas$::uuid, $gaas$d1d10000-0000-4000-8000-000000000114$gaas$::uuid, $gaas$d1d10000-0000-4000-8000-000000000115$gaas$::uuid, $gaas$d1d10000-0000-4000-8000-000000000116$gaas$::uuid, $gaas$d1d10000-0000-4000-8000-000000000121$gaas$::uuid, $gaas$d1d10000-0000-4000-8000-000000000122$gaas$::uuid, $gaas$d1d10000-0000-4000-8000-000000000123$gaas$::uuid, $gaas$d1d10000-0000-4000-8000-000000000124$gaas$::uuid, $gaas$d1d10000-0000-4000-8000-000000000125$gaas$::uuid, $gaas$d1d10000-0000-4000-8000-000000000126$gaas$::uuid)
on conflict (briefing_id, version) do nothing;
