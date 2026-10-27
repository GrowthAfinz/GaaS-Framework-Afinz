-- V14 candidata. Preserva principal, V13 e todos os briefings.
do $verify$
begin
  if (select md5(source) from public.dynamic_email_template_slots where id='builtin-plurix-v13') is distinct from 'd93d83a35b7e45d7c8cb0a976351cba2' then
    raise exception 'V13 mudou desde a auditoria. Reconciliar antes de publicar V14.';
  end if;
end $verify$;

insert into public.dynamic_email_template_slots (id,name,source,is_principal,status,version)
values ('builtin-plurix-v14', 'PLURIX V14 · topo dinâmico blindado para tema escuro (candidata)', $v14$%%[
/* PLURIX V14 (candidata): topo dinâmico. V12 + header no briefing (HEADER_TITULO,
   HEADER_SUBTITULO, HEADER_IMAGEM_CARTAO, HEADER_LOGO), TP "Topo de Funil", E-mail 1 a 8 e pool.
   Base V12: V11 + texto da faixa de limite vindo do briefing (MENSAGEM_LIMITE).
   Base: PLURIX V11, um unico motor, dois toques CRM.
   Identidade/nome/rede/limite: COMUNICACAO_PLX.
   Posicao atual: ESTADO_SEQUENCIA_CRM, uma linha por CPF.
   Conteudo: TB_BRIEFING_CAMPANHA_AQUISICAO.
   Sem escrita em DE, sem sequencia fixa, sem fallback para snapshot.
   O mesmo preparo inicializa preheader e corpo uma vez por mensagem. */
IF EMPTY(@PLXV14Inicializado) THEN
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
   o campo nao passa por TreatAsContent. Sem limite positivo ou sem mensagem, sem faixa.
   Sem nome, {{nome}} sai junto com a virgula: "Boa noticia, {{nome}}:" vira "Boa noticia:". */
SET @FaixaLimite = ""
IF NOT EMPTY(@LimiteFmt) AND NOT EMPTY(@MensagemLimite) THEN
  IF EMPTY(@FirstName) THEN
    SET @FaixaTexto = Replace(Replace(Replace(Replace(Trim(@MensagemLimite), ", {{nome}}", ""), "{{nome}}, ", ""), " {{nome}}", ""), "{{nome}}", "")
  ELSE
    SET @FaixaTexto = Replace(Trim(@MensagemLimite), "{{nome}}", @FirstName)
  ENDIF
  SET @FaixaLimite = Replace(@FaixaTexto, "{{limite}}", @LimiteFmt)
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
SET @PLXV14Inicializado = "S"
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
    :root { color-scheme: light only; }
    u + .body .gmail-blend-screen { background:#000; mix-blend-mode:screen; }
    u + .body .gmail-blend-difference { background:#000; mix-blend-mode:difference; }
    [data-ogsc] .brand-text, [data-ogsc] .brand-text * { color:#ffffff !important; }
    [data-ogsb] .brand-header { background-color:#4A5BA6 !important; }
    [data-ogsb] .brand-odd { background-color:#2C3490 !important; }
    [data-ogsb] .brand-even { background-color:#343B61 !important; }
    [data-ogsb] .brand-top { background-color:#4A5BA6 !important; }
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
      .hdr-sub { font-size: 16px !important; margin-top: 12px !important; }
      .hdr-copy { padding: 26px 22px 8px 22px !important; text-align: center !important; }
      .hdr-title { font-size: 26px !important; }
      .hdr-logo { margin: 0 auto !important; }
      .hdr-card { padding: 8px 40px 0 40px !important; }
    }
  </style>
</head>
<u></u>
<body class="body" style="margin:0; padding:0; background-color:#f2f4f7; font-family:Arial, Helvetica, sans-serif; color:#242424;">
  <div style="display:none; max-height:0; overflow:hidden; opacity:0; color:transparent; mso-hide:all;">
    %%=TreatAsContent(@PreCabecalho)=%%&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="table-layout:fixed; width:100%; background-color:#f2f4f7;">
    <tr>
      <td align="center" style="padding:18px 10px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" class="email-shell" style="width:100%; table-layout:fixed; overflow-wrap:anywhere; max-width:600px; background-color:#ffffff; border-radius:12px; overflow:hidden;">
          <tr>
            <td align="center" class="brand-pad brand-top" bgcolor="#4A5BA6" style="padding:24px 20px; background-color:#4A5BA6; background-image:linear-gradient(#4A5BA6,#4A5BA6);">
              <a href="https://clubemaisamigo.com.br" target="_blank" rel="noopener noreferrer" style="text-decoration:none;">
                <img class="brand-logo" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/c460d98e-264a-4f75-940f-d62d6b40dabf.png" alt="+amigo" width="190" style="display:block; width:190px; max-width:100%; height:auto; border:0;">
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
            <td bgcolor="#4A5BA6" class="brand-header" style="padding:0; background-color:#4A5BA6; background-image:linear-gradient(#4A5BA6,#4A5BA6);">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#4A5BA6" class="brand-header" style="table-layout:fixed; background-color:#4A5BA6; background-image:linear-gradient(#4A5BA6,#4A5BA6);">
                <tr>
                  <td width="50%" valign="top" class="stack-column hdr-copy" style="width:50%; padding:30px 3px 24px 20px; font-family:Tahoma, Geneva, sans-serif;">
                    <div class="hdr-title brand-text" style="margin:0; font-family:Tahoma, Geneva, sans-serif; color:#ffffff; font-size:28px; line-height:1.25; font-weight:bold;"><span class="gmail-blend-screen"><span class="gmail-blend-difference">%%=v(@HdrTitulo)=%%</span></span></div>
                    %%[ IF NOT EMPTY(@HdrSubtitulo) THEN ]%%
                    <div class="hdr-sub brand-text" style="margin:18px 0 0 0; font-family:Tahoma, Geneva, sans-serif; color:#ffffff; font-size:18px; line-height:1.5;"><span class="gmail-blend-screen"><span class="gmail-blend-difference">%%=v(@HdrSubtitulo)=%%</span></span></div>
                    %%[ ENDIF ]%%
                    <div class="hdr-logos" style="margin:22px 0 0 0; line-height:0; font-size:0;">
                      <img class="hdr-brand" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/c460d98e-264a-4f75-940f-d62d6b40dabf.png" alt="+amigo" width="80" height="21" style="display:inline-block; vertical-align:middle; width:80px; height:21px; border:0;">%%[ IF NOT EMPTY(@HdrLogo) THEN ]%%<img class="hdr-partner" src="%%=v(@HdrLogo)=%%" alt="" width="80" style="display:inline-block; vertical-align:middle; width:80px; height:auto; max-height:21px; margin-left:8px; border:0;">%%[ ENDIF ]%%
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
          %%[ ENDIF ]%%
          %%[ IF NOT EMPTY(@FaixaLimite) THEN ]%%
          <!-- V12: faixa de limite pré-aprovado, texto da coluna MENSAGEM_LIMITE -->
          <tr>
            %%[ IF @Sequencia == "E-mail 2" OR @Sequencia == "E-mail 4" OR @Sequencia == "E-mail 6" OR @Sequencia == "E-mail 8" THEN ]%%
            <td align="center" class="content-pad brand-even" bgcolor="#343B61" style="padding:14px 32px; background-color:#343B61; background-image:linear-gradient(#343B61,#343B61);">
            %%[ ELSE ]%%
            <td align="center" class="content-pad brand-odd" bgcolor="#2C3490" style="padding:14px 32px; background-color:#2C3490; background-image:linear-gradient(#2C3490,#2C3490);">
            %%[ ENDIF ]%%
              <div class="brand-text" style="max-width:520px; margin:0 auto; color:#ffffff; font-size:16px; line-height:1.45; font-weight:700; text-align:center;"><span class="gmail-blend-screen"><span class="gmail-blend-difference">%%=v(@FaixaLimite)=%%</span></span></div>
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
              <a class="brand-text brand-odd cta-link" href="%%=RedirectTo(TreatAsContent(@LinkCTA1))=%%" target="_blank" style="display:inline-block; min-width:0; max-width:100%; box-sizing:border-box; border-radius:10px; background-color:#2C3490; background-image:linear-gradient(#2C3490,#2C3490); color:#ffffff; padding:15px 26px; font-size:15px; line-height:20px; text-align:center; text-decoration:none; font-weight:700;"><span class="gmail-blend-screen"><span class="gmail-blend-difference">%%=TreatAsContent(@TituloCTA1)=%%</span></span></a>
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
              <a class="brand-text brand-odd cta-link" href="%%=RedirectTo(TreatAsContent(@LinkCTA2))=%%" target="_blank" style="display:inline-block; min-width:0; max-width:100%; box-sizing:border-box; border-radius:10px; background-color:#2C3490; background-image:linear-gradient(#2C3490,#2C3490); color:#ffffff; padding:15px 26px; font-size:15px; line-height:20px; text-align:center; text-decoration:none; font-weight:700;"><span class="gmail-blend-screen"><span class="gmail-blend-difference">%%=TreatAsContent(@TituloCTA2)=%%</span></span></a>
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
              <a class="brand-text brand-odd cta-link" href="%%=RedirectTo(TreatAsContent(@LinkCTA1))=%%" target="_blank" style="display:inline-block; min-width:0; max-width:100%; box-sizing:border-box; border-radius:10px; background-color:#2C3490; background-image:linear-gradient(#2C3490,#2C3490); color:#ffffff; padding:15px 26px; font-size:15px; line-height:20px; text-align:center; text-decoration:none; font-weight:700;"><span class="gmail-blend-screen"><span class="gmail-blend-difference">%%=TreatAsContent(@TituloCTA1)=%%</span></span></a>
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
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="table-layout:fixed;">
                <tr>
                  <td width="55%" valign="middle" class="stack-column stack-copy" style="width:55%; padding:30px 12px 30px 32px;">
                    <h2 style="margin:0 0 10px 0; color:#2C3490; font-size:24px; line-height:1.25; font-weight:700;">Peça agora seu cartão +amigo</h2>
                    <p style="margin:0 0 18px 0; color:#454A64; font-size:15px; line-height:1.55;">Comece a aproveitar os benefícios nas suas compras do dia a dia.</p>
                    %%[ IF NOT EMPTY(@TituloCTA2) AND NOT EMPTY(@LinkCTA2) THEN ]%%
                    <a class="brand-text brand-odd" href="%%=RedirectTo(TreatAsContent(@LinkCTA2))=%%" target="_blank" style="display:inline-block; border-radius:10px; background-color:#2C3490; background-image:linear-gradient(#2C3490,#2C3490); color:#ffffff; padding:14px 20px; font-size:13px; line-height:18px; text-align:center; text-decoration:none; font-weight:700;"><span class="gmail-blend-screen"><span class="gmail-blend-difference">%%=TreatAsContent(@TituloCTA2)=%%</span></span></a>
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
          %%[ IF EMPTY(@Banner2Corpo) THEN ]%%
          <!-- V13: segundo bloco sem imagem, largura total como no E-mail 1 -->
          %%[ IF NOT EMPTY(@TituloCopy2) THEN ]%%
          <tr>
            <td align="center" bgcolor="#F6F6FB" class="content-pad" style="padding:26px 32px 24px 32px; background-color:#F6F6FB;">
              <h2 class="headline" style="max-width:500px; margin:0 auto 18px auto; color:%%=v(@CorTituloCopy2)=%%; font-size:%%=v(@TamanhoFonteTituloCopy2)=%%px; line-height:1.25; font-weight:700; text-align:center;">%%=TreatAsContent(@TituloCopy2)=%%</h2>
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
              <a class="brand-text brand-odd cta-link" href="%%=RedirectTo(TreatAsContent(@LinkCTA2))=%%" target="_blank" style="display:inline-block; min-width:0; max-width:100%; box-sizing:border-box; border-radius:10px; background-color:#2C3490; background-image:linear-gradient(#2C3490,#2C3490); color:#ffffff; padding:15px 26px; font-size:15px; line-height:20px; text-align:center; text-decoration:none; font-weight:700;"><span class="gmail-blend-screen"><span class="gmail-blend-difference">%%=TreatAsContent(@TituloCTA2)=%%</span></span></a>
              %%[ ENDIF ]%%
            </td>
          </tr>
          %%[ ENDIF ]%%
          %%[ ENDIF ]%%
          %%[ IF NOT EMPTY(@Banner2Corpo) THEN ]%%
          <tr>
            <td style="padding:0; background-color:#ffffff;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="table-layout:fixed;">
                <tr>
                  <td width="55%" valign="middle" class="stack-column stack-copy" style="width:55%; padding:30px 12px 30px 32px;">
                    %%[ IF NOT EMPTY(@TituloCopy2) THEN ]%%
                    <h2 style="margin:0 0 10px 0; color:%%=v(@CorTituloCopy2)=%%; font-size:%%=v(@TamanhoFonteTituloCopy2)=%%px; line-height:1.25; font-weight:700;">%%=TreatAsContent(@TituloCopy2)=%%</h2>
                    %%[ ENDIF ]%%
                    %%[ IF NOT EMPTY(@Copy2Preto) THEN ]%%
                    <div style="margin:0 0 18px 0; color:%%=v(@CorCopy2)=%%; font-size:%%=v(@TamanhoFonteCopy2)=%%px; line-height:1.55;">%%=TreatAsContent(@Copy2Preto)=%%</div>
                    %%[ ENDIF ]%%
                    %%[ IF NOT EMPTY(@TituloCTA2) AND NOT EMPTY(@LinkCTA2) THEN ]%%
                    <a class="brand-text brand-odd" href="%%=RedirectTo(TreatAsContent(@LinkCTA2))=%%" target="_blank" style="display:inline-block; border-radius:10px; background-color:#2C3490; background-image:linear-gradient(#2C3490,#2C3490); color:#ffffff; padding:14px 20px; font-size:13px; line-height:18px; text-align:center; text-decoration:none; font-weight:700;"><span class="gmail-blend-screen"><span class="gmail-blend-difference">%%=TreatAsContent(@TituloCTA2)=%%</span></span></a>
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
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#F6F6FB" style="table-layout:fixed; border:1px solid #E1E3F2; border-radius:14px; background-color:#F6F6FB;">
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
                    <a class="brand-text brand-odd" alias="bloco3_oferta" href="%%=RedirectTo(TreatAsContent(@LinkCTA1))=%%" target="_blank" style="display:inline-block; border-radius:10px; background-color:#2C3490; background-image:linear-gradient(#2C3490,#2C3490); color:#ffffff; padding:13px 20px; font-size:13px; line-height:18px; text-align:center; text-decoration:none; font-weight:700;"><span class="gmail-blend-screen"><span class="gmail-blend-difference">PEDIR MEU CARTÃO +AMIGO</span></span></a>
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
</html>$v14$, false, 'active', 1)
on conflict (id) do update set name=excluded.name,source=excluded.source,is_principal=false,status='active',version=1;

insert into public.dynamic_email_assets (name,external_url,slot,bu,partner,product,alt_text,tags,status,version)
values ('Logo +amigo branco: topo V14', 'https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/c460d98e-264a-4f75-940f-d62d6b40dabf.png', 'header_logo', 'Plurix', 'Plurix', '+amigo', '+amigo', array['header-dinamico','logo','v14'], 'ready', 1)
on conflict (external_url) do nothing;
