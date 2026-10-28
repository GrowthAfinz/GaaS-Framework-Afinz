-- V15 e V3 sao novos registros; V2 e templates anteriores permanecem intactos.
do $guard$ begin
 if exists(select 1 from public.dynamic_email_template_slots where id='builtin-plurix-v15') or exists(select 1 from public.dynamic_email_ruler_strategies where partner='Plurix' and segment='V3 TOPO DE FUNIL DINÂMICO') then raise exception 'V15/V3 ja existe; revisar antes de repetir.';end if;
 if (select md5(string_agg(id::text||':'||version::text||':'||md5(briefing_data::text),'|' order by id)) from public.dynamic_email_briefings where segment='V2 TOPO DE FUNIL DINÂMICO') is distinct from '8e96eb655888910a90eedcfaf0e94b1a' then raise exception 'V2 mudou desde a revisao';end if;
 if (select count(*) from public.dynamic_email_email_strategies where ruler_strategy_id='d2d20000-0000-4000-8000-000000000001')<>4 then raise exception 'Esperados quatro emails fonte';end if;
end $guard$;
insert into public.dynamic_email_template_slots(id,name,source,is_principal,status,version,created_by,updated_by) values ('builtin-plurix-v15','PLURIX V15 CRM · header em imagem',$v15$%%[
/* PLURIX V15 CRM: header completo em imagem HTTPS; sem pool de ofertas.
   Audiencia: TB_CAMPANHA_AQUISICAO (PRI_NOME, LIMITE, PRODUTO).
   Estado: ESTADO_SEQUENCIA_CRM; se ausente, usa E-mail 1 sem gravar na DE.
   A jornada atualiza o estado para E-mail 1 antes do envio.
   Briefing: TB_BRIEFING_CAMPANHA_AQUISICAO, TP_CAMPANHA CRM.
   Sem escrita em DE; estado existente prevalece; ausencia usa E-mail 1. */
IF EMPTY(@PLXV15Inicializado) THEN
SET @DE_AUDIENCIA = "TB_CAMPANHA_AQUISICAO"
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
SET @FirstName = Field(@AudRow, "PRI_NOME")
SET @LimiteNovo = Trim(Field(@AudRow, "LIMITE"))
SET @Rede = Uppercase(Trim(Field(@AudRow, "PRODUTO")))
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
  RaiseError("PLX_NETWORK_UNKNOWN: PRODUTO sem mapeamento aprovado.", true)
ENDIF
SET @TpCampanha = "CRM"
/* Consultar a posicao atual na DE separada, nunca na audiencia/entrada. */
SET @EstadoRows = LookupRows(@DE_ESTADO, "CPF", @Chave)
SET @EstadoCount = RowCount(@EstadoRows)
IF @EstadoCount == 0 THEN
  SET @Sequencia = "E-mail 1"
ELSEIF @EstadoCount == 1 THEN
  SET @EstadoRow = Row(@EstadoRows, 1)
  SET @Sequencia = Trim(Field(@EstadoRow, "SEQUENCIA"))
ELSE
  RaiseError("PLX_STATE_CARDINALITY: mais de um estado por CPF.", true)
ENDIF
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
SET @HdrLogo = Field(@Row, "HEADER_LOGO")
ELSEIF @RowCount == 0 THEN RaiseError(Concat("PLX_DEBUG: produto=[", @Produto, "] campanha=[", @TpCampanha, "] sequencia=[", @Sequencia, "] estados=", @EstadoCount, " briefings=", @RowCount), true)
ELSE RaiseError(Concat("PLX_DEBUG: produto=[", @Produto, "] campanha=[", @TpCampanha, "] sequencia=[", @Sequencia, "] estados=", @EstadoCount, " briefings=", @RowCount), true)
ENDIF

/* ---------- V10 · nome do cliente ---------- */
/* PRI_NOME vem em maiúsculas da base (ex.: VANIA); a saudação usa só a inicial maiúscula (Vania). */
SET @FirstName = ProperCase(Trim(@FirstName))

/* V15: HEADER e a arte completa. Titulo/subtitulo sao equivalentes acessiveis. */
SET @HeaderModo = "imagem"
IF EMPTY(@Header) THEN
  RaiseError("PLX_HEADER_MISSING: imagem do header obrigatoria.", true)
ENDIF
IF IndexOf(Lowercase(Trim(@Header)), "https://") != 1 THEN
  RaiseError("PLX_HEADER_INVALID: usar imagem HTTPS nesta versao.", true)
ENDIF

/* LIMITE: campo numerico; ausente/zero não inventa pré-aprovação.
   Valor não numérico é erro de contrato. Elegibilidade fica fora do HTML. */
SET @LimiteFmt = ""
IF NOT EMPTY(@LimiteNovo) THEN
  IF EMPTY(RegExMatch(@LimiteNovo, "^[0-9]+(\.[0-9]{1,2})?$", 0)) THEN
    RaiseError("PLX_LIMIT_INVALID: LIMITE deve ser numerico.", true)
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

SET @PLXV15Inicializado = "S"
ENDIF
]%%
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light only">
  <meta name="supported-color-schemes" content="light">
  <title>%%=TreatAsContent(@Assunto)=%%</title>
  <style>
    :root { color-scheme: light only; }
    [data-ogsc] .brand-text, [data-ogsc] .brand-text * { color:#ffffff !important; -webkit-text-fill-color:#ffffff !important; }
    [data-ogsb] .brand-header { background-color:#4A5BA6 !important; }
    [data-ogsb] .brand-odd { background-color:#2C3490 !important; }
    [data-ogsb] .brand-even { background-color:#343B61 !important; }

    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; }
    @media only screen and (max-width: 620px) {
      .email-shell { width: 100% !important; }
      .content-pad { padding-left: 22px !important; padding-right: 22px !important; }
      .headline { font-size: 24px !important; line-height: 1.2 !important; }
      .body-copy { font-size: 17px !important; line-height: 1.55 !important; }
      .cta-cell, .cta-link { display: block !important; width: 100% !important; box-sizing: border-box !important; }
      .cta-link { padding-left: 18px !important; padding-right: 18px !important; }
      .legal-pad { padding-left: 22px !important; padding-right: 22px !important; }
      .stack-column { display: block !important; width: 100% !important; box-sizing: border-box !important; }
      .stack-copy { padding: 24px 22px 10px 22px !important; text-align: center !important; }
      .stack-image { padding: 8px 22px 24px 22px !important; }
    }
      [data-ogsb] [bgcolor="#ffffff"], [data-ogsb] [style*="background-color:#ffffff"] { background-color:#ffffff !important; background-image:linear-gradient(#ffffff,#ffffff) !important; }
    [data-ogsb] [bgcolor="#F6F6FB"], [data-ogsb] [style*="background-color:#F6F6FB"] { background-color:#F6F6FB !important; background-image:linear-gradient(#F6F6FB,#F6F6FB) !important; }
    [data-ogsb] [bgcolor="#F4F5FB"], [data-ogsb] [style*="background-color:#F4F5FB"] { background-color:#F4F5FB !important; background-image:linear-gradient(#F4F5FB,#F4F5FB) !important; }
    [data-ogsb] [bgcolor="#f2f4f7"], [data-ogsb] [style*="background-color:#f2f4f7"] { background-color:#f2f4f7 !important; background-image:linear-gradient(#f2f4f7,#f2f4f7) !important; }
    [data-ogsb] [bgcolor="#eef1f5"], [data-ogsb] [style*="background-color:#eef1f5"] { background-color:#eef1f5 !important; background-image:linear-gradient(#eef1f5,#eef1f5) !important; }
    [data-ogsb] [bgcolor="#E7A921"], [data-ogsb] [style*="background-color:#E7A921"] { background-color:#E7A921 !important; background-image:linear-gradient(#E7A921,#E7A921) !important; }
    [data-ogsc] [style*="color:#242424;"] { color:#242424 !important; -webkit-text-fill-color:#242424 !important; }
    [data-ogsc] [style*="color:#2C3490;"] { color:#2C3490 !important; -webkit-text-fill-color:#2C3490 !important; }
    [data-ogsc] [style*="color:#4A4F6A;"] { color:#4A4F6A !important; -webkit-text-fill-color:#4A4F6A !important; }
    [data-ogsc] [style*="color:#454A64;"] { color:#454A64 !important; -webkit-text-fill-color:#454A64 !important; }
    [data-ogsc] [style*="color:#5A607F;"] { color:#5A607F !important; -webkit-text-fill-color:#5A607F !important; }
    [data-ogsc] [style*="color:#6b7280;"] { color:#6b7280 !important; -webkit-text-fill-color:#6b7280 !important; }
    [data-ogsc] [style*="color:#8A8FA8;"] { color:#8A8FA8 !important; -webkit-text-fill-color:#8A8FA8 !important; }
  </style>
</head>
<u></u>
<body class="body" style="color-scheme:light only; margin:0; padding:0; background-color:#f2f4f7; background-image:linear-gradient(#f2f4f7,#f2f4f7); font-family:Arial, Helvetica, sans-serif; color:#242424; -webkit-text-fill-color:#242424;">
  <div style="display:none; max-height:0; overflow:hidden; opacity:0; color:transparent; -webkit-text-fill-color:transparent; mso-hide:all;">
    %%=TreatAsContent(@PreCabecalho)=%%&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="table-layout:fixed; width:100%; background-color:#f2f4f7; background-image:linear-gradient(#f2f4f7,#f2f4f7);">
    <tr>
      <td align="center" style="padding:18px 10px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" class="email-shell" style="width:100%; table-layout:fixed; overflow-wrap:anywhere; max-width:600px; background-color:#ffffff; background-image:linear-gradient(#ffffff,#ffffff); border-radius:12px; overflow:hidden;">
          <tr>
            <td style="padding:0;line-height:0;font-size:0;">
              <img class="header-image" src="%%=v(@Header)=%%" alt="%%=v(@HdrTitulo)=%% %%=v(@HdrSubtitulo)=%%" width="600" style="display:block;width:100%;max-width:600px;height:auto;border:0;">
            </td>
          </tr>
          %%[ IF NOT EMPTY(@HdrLogo) THEN ]%%
          <tr><td align="left" bgcolor="#4A5BA6" style="padding:0 20px 12px;background-color:#4A5BA6;line-height:0;">
            <img src="%%=v(@HdrLogo)=%%" alt="Rede participante" width="80" style="display:block;width:80px;max-width:100%;height:auto;border:0;">
          </td></tr>
          %%[ ENDIF ]%%
          %%[ IF NOT EMPTY(@FaixaLimite) THEN ]%%
          <!-- V12: faixa de limite pré-aprovado, texto da coluna MENSAGEM_LIMITE -->
          <tr>
            %%[ IF @Sequencia == "E-mail 2" OR @Sequencia == "E-mail 4" OR @Sequencia == "E-mail 6" OR @Sequencia == "E-mail 8" THEN ]%%
            <td align="center" class="content-pad brand-even" bgcolor="#343B61" style="padding:14px 32px; background-color:#343B61; background-image:linear-gradient(#343B61,#343B61);">
            %%[ ELSE ]%%
            <td align="center" class="content-pad brand-odd" bgcolor="#2C3490" style="padding:14px 32px; background-color:#2C3490; background-image:linear-gradient(#2C3490,#2C3490);">
            %%[ ENDIF ]%%
              <div class="brand-text" style="max-width:520px; margin:0 auto; color:#ffffff; -webkit-text-fill-color:#ffffff; font-size:16px; line-height:1.45; font-weight:700; text-align:center;">%%=v(@FaixaLimite)=%%</div>
            </td>
          </tr>
          %%[ ENDIF ]%%
          %%[ IF @Sequencia == "E-mail 1" THEN ]%%
          <!-- E-mail 1: descoberta dos benefícios e passo a passo -->
          <tr>
            <td align="center" class="content-pad" style="padding:30px 32px 8px 32px; text-align:center;">
              %%[ IF NOT EMPTY(@TituloCopy1) THEN ]%%
              <h1 class="headline" style="max-width:500px; margin:0 auto 16px auto; color:%%=v(@CorCopy1)=%%; -webkit-text-fill-color:%%=v(@CorCopy1)=%%; font-size:%%=v(@TamanhoFonteTituloCopy1)=%%px; line-height:1.25; font-weight:700; text-align:center;">%%=TreatAsContent(Replace(Replace(Replace(Replace(Replace(Replace(Replace(Replace(Replace(Replace(Replace(@TituloCopy1, "background-color:#F4F5FB;", "background-color:#F4F5FB;background-image:linear-gradient(#F4F5FB,#F4F5FB);"), "background:#F4F5FB;", "background:#F4F5FB;background-image:linear-gradient(#F4F5FB,#F4F5FB);"), "background-color:#E7A921;", "background-color:#E7A921;background-image:linear-gradient(#E7A921,#E7A921);"), "background:#E7A921;", "background:#E7A921;background-image:linear-gradient(#E7A921,#E7A921);"), "background-color:#ffffff;", "background-color:#ffffff;background-image:linear-gradient(#ffffff,#ffffff);"), "background:#ffffff;", "background:#ffffff;background-image:linear-gradient(#ffffff,#ffffff);"), "background-color:#F6F6FB;", "background-color:#F6F6FB;background-image:linear-gradient(#F6F6FB,#F6F6FB);"), "background:#F6F6FB;", "background:#F6F6FB;background-image:linear-gradient(#F6F6FB,#F6F6FB);"), "color:#242424;", "color:#242424;-webkit-text-fill-color:#242424;"), "color:#2C3490;", "color:#2C3490;-webkit-text-fill-color:#2C3490;"), "color:#4A4F6A;", "color:#4A4F6A;-webkit-text-fill-color:#4A4F6A;"))=%%</h1>
              %%[ ENDIF ]%%
              %%[ IF NOT EMPTY(@Copy1Preto) THEN ]%%
              <div class="body-copy" style="max-width:500px; margin:0 auto; color:%%=v(@CorCopyPreto1)=%%; -webkit-text-fill-color:%%=v(@CorCopyPreto1)=%%; font-size:%%=v(@TamanhoFonteCopyPreto1)=%%px; line-height:1.55; text-align:center;">%%=TreatAsContent(Replace(Replace(Replace(Replace(Replace(Replace(Replace(Replace(Replace(Replace(Replace(@Copy1Preto, "background-color:#F4F5FB;", "background-color:#F4F5FB;background-image:linear-gradient(#F4F5FB,#F4F5FB);"), "background:#F4F5FB;", "background:#F4F5FB;background-image:linear-gradient(#F4F5FB,#F4F5FB);"), "background-color:#E7A921;", "background-color:#E7A921;background-image:linear-gradient(#E7A921,#E7A921);"), "background:#E7A921;", "background:#E7A921;background-image:linear-gradient(#E7A921,#E7A921);"), "background-color:#ffffff;", "background-color:#ffffff;background-image:linear-gradient(#ffffff,#ffffff);"), "background:#ffffff;", "background:#ffffff;background-image:linear-gradient(#ffffff,#ffffff);"), "background-color:#F6F6FB;", "background-color:#F6F6FB;background-image:linear-gradient(#F6F6FB,#F6F6FB);"), "background:#F6F6FB;", "background:#F6F6FB;background-image:linear-gradient(#F6F6FB,#F6F6FB);"), "color:#242424;", "color:#242424;-webkit-text-fill-color:#242424;"), "color:#2C3490;", "color:#2C3490;-webkit-text-fill-color:#2C3490;"), "color:#4A4F6A;", "color:#4A4F6A;-webkit-text-fill-color:#4A4F6A;"))=%%</div>
              %%[ ENDIF ]%%
            </td>
          </tr>
          %%[ IF NOT EMPTY(@TituloCTA1) AND NOT EMPTY(@LinkCTA1) THEN ]%%
          <tr>
            <td align="center" class="content-pad cta-cell" style="padding:14px 32px 30px 32px;">
              <a class="brand-text brand-odd cta-link" href="%%=RedirectTo(TreatAsContent(@LinkCTA1))=%%" target="_blank" style="display:inline-block; min-width:0; max-width:100%; box-sizing:border-box; border-radius:10px; background-color:#2C3490; background-image:linear-gradient(#2C3490,#2C3490); color:#ffffff; -webkit-text-fill-color:#ffffff; padding:15px 26px; font-size:15px; line-height:20px; text-align:center; text-decoration:none; font-weight:700;">%%=TreatAsContent(@TituloCTA1)=%%</a>
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
            <td align="center" bgcolor="#F6F6FB" class="content-pad" style="padding:26px 32px 24px 32px; background-color:#F6F6FB; background-image:linear-gradient(#F6F6FB,#F6F6FB);">
              <h2 class="headline" style="max-width:500px; margin:0 auto 18px auto; color:%%=v(@CorTituloCopy2)=%%; -webkit-text-fill-color:%%=v(@CorTituloCopy2)=%%; font-size:%%=v(@TamanhoFonteTituloCopy2)=%%px; line-height:1.25; font-weight:700; text-align:center;">%%=TreatAsContent(Replace(Replace(Replace(Replace(Replace(Replace(Replace(Replace(Replace(Replace(Replace(@TituloCopy2, "background-color:#F4F5FB;", "background-color:#F4F5FB;background-image:linear-gradient(#F4F5FB,#F4F5FB);"), "background:#F4F5FB;", "background:#F4F5FB;background-image:linear-gradient(#F4F5FB,#F4F5FB);"), "background-color:#E7A921;", "background-color:#E7A921;background-image:linear-gradient(#E7A921,#E7A921);"), "background:#E7A921;", "background:#E7A921;background-image:linear-gradient(#E7A921,#E7A921);"), "background-color:#ffffff;", "background-color:#ffffff;background-image:linear-gradient(#ffffff,#ffffff);"), "background:#ffffff;", "background:#ffffff;background-image:linear-gradient(#ffffff,#ffffff);"), "background-color:#F6F6FB;", "background-color:#F6F6FB;background-image:linear-gradient(#F6F6FB,#F6F6FB);"), "background:#F6F6FB;", "background:#F6F6FB;background-image:linear-gradient(#F6F6FB,#F6F6FB);"), "color:#242424;", "color:#242424;-webkit-text-fill-color:#242424;"), "color:#2C3490;", "color:#2C3490;-webkit-text-fill-color:#2C3490;"), "color:#4A4F6A;", "color:#4A4F6A;-webkit-text-fill-color:#4A4F6A;"))=%%</h2>
            </td>
          </tr>
          %%[ ENDIF ]%%
          %%[ IF NOT EMPTY(@Banner2Corpo) THEN ]%%
          <tr>
            <td align="center" bgcolor="#F6F6FB" class="content-pad" style="padding:0 32px 24px 32px; background-color:#F6F6FB; background-image:linear-gradient(#F6F6FB,#F6F6FB);">
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
              <div class="body-copy" style="max-width:480px; margin:0 auto 18px auto; color:%%=v(@CorCopy2)=%%; -webkit-text-fill-color:%%=v(@CorCopy2)=%%; font-size:%%=v(@TamanhoFonteCopy2)=%%px; line-height:1.6; text-align:center;">%%=TreatAsContent(Replace(Replace(Replace(Replace(Replace(Replace(Replace(Replace(Replace(Replace(Replace(@Copy2Preto, "background-color:#F4F5FB;", "background-color:#F4F5FB;background-image:linear-gradient(#F4F5FB,#F4F5FB);"), "background:#F4F5FB;", "background:#F4F5FB;background-image:linear-gradient(#F4F5FB,#F4F5FB);"), "background-color:#E7A921;", "background-color:#E7A921;background-image:linear-gradient(#E7A921,#E7A921);"), "background:#E7A921;", "background:#E7A921;background-image:linear-gradient(#E7A921,#E7A921);"), "background-color:#ffffff;", "background-color:#ffffff;background-image:linear-gradient(#ffffff,#ffffff);"), "background:#ffffff;", "background:#ffffff;background-image:linear-gradient(#ffffff,#ffffff);"), "background-color:#F6F6FB;", "background-color:#F6F6FB;background-image:linear-gradient(#F6F6FB,#F6F6FB);"), "background:#F6F6FB;", "background:#F6F6FB;background-image:linear-gradient(#F6F6FB,#F6F6FB);"), "color:#242424;", "color:#242424;-webkit-text-fill-color:#242424;"), "color:#2C3490;", "color:#2C3490;-webkit-text-fill-color:#2C3490;"), "color:#4A4F6A;", "color:#4A4F6A;-webkit-text-fill-color:#4A4F6A;"))=%%</div>
              %%[ ENDIF ]%%
              %%[ IF NOT EMPTY(@TituloCTA2) AND NOT EMPTY(@LinkCTA2) THEN ]%%
              <a class="brand-text brand-odd cta-link" href="%%=RedirectTo(TreatAsContent(@LinkCTA2))=%%" target="_blank" style="display:inline-block; min-width:0; max-width:100%; box-sizing:border-box; border-radius:10px; background-color:#2C3490; background-image:linear-gradient(#2C3490,#2C3490); color:#ffffff; -webkit-text-fill-color:#ffffff; padding:15px 26px; font-size:15px; line-height:20px; text-align:center; text-decoration:none; font-weight:700;">%%=TreatAsContent(@TituloCTA2)=%%</a>
              %%[ ENDIF ]%%
            </td>
          </tr>
          %%[ ENDIF ]%%
          %%[ ELSE ]%%
          <!-- E-mail 2: economia, benefícios e conversão -->
          <tr>
            <td align="center" class="content-pad" style="padding:30px 32px 12px 32px; text-align:center;">
              %%[ IF NOT EMPTY(@TituloCopy1) THEN ]%%
              <h1 class="headline" style="max-width:500px; margin:0 auto 16px auto; color:%%=v(@CorCopy1)=%%; -webkit-text-fill-color:%%=v(@CorCopy1)=%%; font-size:%%=v(@TamanhoFonteTituloCopy1)=%%px; line-height:1.25; font-weight:700; text-align:center;">%%=TreatAsContent(Replace(Replace(Replace(Replace(Replace(Replace(Replace(Replace(Replace(Replace(Replace(@TituloCopy1, "background-color:#F4F5FB;", "background-color:#F4F5FB;background-image:linear-gradient(#F4F5FB,#F4F5FB);"), "background:#F4F5FB;", "background:#F4F5FB;background-image:linear-gradient(#F4F5FB,#F4F5FB);"), "background-color:#E7A921;", "background-color:#E7A921;background-image:linear-gradient(#E7A921,#E7A921);"), "background:#E7A921;", "background:#E7A921;background-image:linear-gradient(#E7A921,#E7A921);"), "background-color:#ffffff;", "background-color:#ffffff;background-image:linear-gradient(#ffffff,#ffffff);"), "background:#ffffff;", "background:#ffffff;background-image:linear-gradient(#ffffff,#ffffff);"), "background-color:#F6F6FB;", "background-color:#F6F6FB;background-image:linear-gradient(#F6F6FB,#F6F6FB);"), "background:#F6F6FB;", "background:#F6F6FB;background-image:linear-gradient(#F6F6FB,#F6F6FB);"), "color:#242424;", "color:#242424;-webkit-text-fill-color:#242424;"), "color:#2C3490;", "color:#2C3490;-webkit-text-fill-color:#2C3490;"), "color:#4A4F6A;", "color:#4A4F6A;-webkit-text-fill-color:#4A4F6A;"))=%%</h1>
              %%[ ENDIF ]%%
              %%[ IF NOT EMPTY(@Copy1Preto) THEN ]%%
              <div class="body-copy" style="max-width:500px; margin:0 auto; color:%%=v(@CorCopyPreto1)=%%; -webkit-text-fill-color:%%=v(@CorCopyPreto1)=%%; font-size:%%=v(@TamanhoFonteCopyPreto1)=%%px; line-height:1.55; text-align:center;">%%=TreatAsContent(Replace(Replace(Replace(Replace(Replace(Replace(Replace(Replace(Replace(Replace(Replace(@Copy1Preto, "background-color:#F4F5FB;", "background-color:#F4F5FB;background-image:linear-gradient(#F4F5FB,#F4F5FB);"), "background:#F4F5FB;", "background:#F4F5FB;background-image:linear-gradient(#F4F5FB,#F4F5FB);"), "background-color:#E7A921;", "background-color:#E7A921;background-image:linear-gradient(#E7A921,#E7A921);"), "background:#E7A921;", "background:#E7A921;background-image:linear-gradient(#E7A921,#E7A921);"), "background-color:#ffffff;", "background-color:#ffffff;background-image:linear-gradient(#ffffff,#ffffff);"), "background:#ffffff;", "background:#ffffff;background-image:linear-gradient(#ffffff,#ffffff);"), "background-color:#F6F6FB;", "background-color:#F6F6FB;background-image:linear-gradient(#F6F6FB,#F6F6FB);"), "background:#F6F6FB;", "background:#F6F6FB;background-image:linear-gradient(#F6F6FB,#F6F6FB);"), "color:#242424;", "color:#242424;-webkit-text-fill-color:#242424;"), "color:#2C3490;", "color:#2C3490;-webkit-text-fill-color:#2C3490;"), "color:#4A4F6A;", "color:#4A4F6A;-webkit-text-fill-color:#4A4F6A;"))=%%</div>
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
              <a class="brand-text brand-odd cta-link" href="%%=RedirectTo(TreatAsContent(@LinkCTA1))=%%" target="_blank" style="display:inline-block; min-width:0; max-width:100%; box-sizing:border-box; border-radius:10px; background-color:#2C3490; background-image:linear-gradient(#2C3490,#2C3490); color:#ffffff; -webkit-text-fill-color:#ffffff; padding:15px 26px; font-size:15px; line-height:20px; text-align:center; text-decoration:none; font-weight:700;">%%=TreatAsContent(@TituloCTA1)=%%</a>
            </td>
          </tr>
          %%[ ENDIF ]%%
          %%[ IF @Sequencia == "E-mail 2" THEN ]%%
          %%[ IF NOT EMPTY(@TituloCopy2) OR NOT EMPTY(@Copy2Preto) THEN ]%%
          <tr>
            <td align="center" bgcolor="#F6F6FB" class="content-pad" style="padding:28px 32px; background-color:#F6F6FB; background-image:linear-gradient(#F6F6FB,#F6F6FB);">
              %%[ IF NOT EMPTY(@TituloCopy2) THEN ]%%
              <h2 class="headline" style="max-width:500px; margin:0 auto 20px auto; color:%%=v(@CorTituloCopy2)=%%; -webkit-text-fill-color:%%=v(@CorTituloCopy2)=%%; font-size:%%=v(@TamanhoFonteTituloCopy2)=%%px; line-height:1.25; font-weight:700; text-align:center;">%%=TreatAsContent(Replace(Replace(Replace(Replace(Replace(Replace(Replace(Replace(Replace(Replace(Replace(@TituloCopy2, "background-color:#F4F5FB;", "background-color:#F4F5FB;background-image:linear-gradient(#F4F5FB,#F4F5FB);"), "background:#F4F5FB;", "background:#F4F5FB;background-image:linear-gradient(#F4F5FB,#F4F5FB);"), "background-color:#E7A921;", "background-color:#E7A921;background-image:linear-gradient(#E7A921,#E7A921);"), "background:#E7A921;", "background:#E7A921;background-image:linear-gradient(#E7A921,#E7A921);"), "background-color:#ffffff;", "background-color:#ffffff;background-image:linear-gradient(#ffffff,#ffffff);"), "background:#ffffff;", "background:#ffffff;background-image:linear-gradient(#ffffff,#ffffff);"), "background-color:#F6F6FB;", "background-color:#F6F6FB;background-image:linear-gradient(#F6F6FB,#F6F6FB);"), "background:#F6F6FB;", "background:#F6F6FB;background-image:linear-gradient(#F6F6FB,#F6F6FB);"), "color:#242424;", "color:#242424;-webkit-text-fill-color:#242424;"), "color:#2C3490;", "color:#2C3490;-webkit-text-fill-color:#2C3490;"), "color:#4A4F6A;", "color:#4A4F6A;-webkit-text-fill-color:#4A4F6A;"))=%%</h2>
              %%[ ENDIF ]%%
              %%[ IF NOT EMPTY(@Copy2Preto) THEN ]%%
              <div class="body-copy" style="max-width:480px; margin:0 auto; padding:18px 20px; border:1px solid #E1E3F2; border-radius:12px; background-color:#ffffff; background-image:linear-gradient(#ffffff,#ffffff); color:%%=v(@CorCopy2)=%%; -webkit-text-fill-color:%%=v(@CorCopy2)=%%; font-size:%%=v(@TamanhoFonteCopy2)=%%px; line-height:1.75; text-align:left;">%%=TreatAsContent(Replace(Replace(Replace(Replace(Replace(Replace(Replace(Replace(Replace(Replace(Replace(@Copy2Preto, "background-color:#F4F5FB;", "background-color:#F4F5FB;background-image:linear-gradient(#F4F5FB,#F4F5FB);"), "background:#F4F5FB;", "background:#F4F5FB;background-image:linear-gradient(#F4F5FB,#F4F5FB);"), "background-color:#E7A921;", "background-color:#E7A921;background-image:linear-gradient(#E7A921,#E7A921);"), "background:#E7A921;", "background:#E7A921;background-image:linear-gradient(#E7A921,#E7A921);"), "background-color:#ffffff;", "background-color:#ffffff;background-image:linear-gradient(#ffffff,#ffffff);"), "background:#ffffff;", "background:#ffffff;background-image:linear-gradient(#ffffff,#ffffff);"), "background-color:#F6F6FB;", "background-color:#F6F6FB;background-image:linear-gradient(#F6F6FB,#F6F6FB);"), "background:#F6F6FB;", "background:#F6F6FB;background-image:linear-gradient(#F6F6FB,#F6F6FB);"), "color:#242424;", "color:#242424;-webkit-text-fill-color:#242424;"), "color:#2C3490;", "color:#2C3490;-webkit-text-fill-color:#2C3490;"), "color:#4A4F6A;", "color:#4A4F6A;-webkit-text-fill-color:#4A4F6A;"))=%%</div>
              %%[ ENDIF ]%%
            </td>
          </tr>
          %%[ ENDIF ]%%
          %%[ IF NOT EMPTY(@TituloCTA2) OR NOT EMPTY(@Banner2Corpo) THEN ]%%
          <tr>
            <td style="padding:0; background-color:#ffffff; background-image:linear-gradient(#ffffff,#ffffff);">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="table-layout:fixed;">
                <tr>
                  <td width="55%" valign="middle" class="stack-column stack-copy" style="width:55%; padding:30px 12px 30px 32px;">
                    <h2 style="margin:0 0 10px 0; color:#2C3490; -webkit-text-fill-color:#2C3490; font-size:24px; line-height:1.25; font-weight:700;">Peça agora seu cartão +amigo</h2>
                    <p style="margin:0 0 18px 0; color:#454A64; -webkit-text-fill-color:#454A64; font-size:15px; line-height:1.55;">Comece a aproveitar os benefícios nas suas compras do dia a dia.</p>
                    %%[ IF NOT EMPTY(@TituloCTA2) AND NOT EMPTY(@LinkCTA2) THEN ]%%
                    <a class="brand-text brand-odd" href="%%=RedirectTo(TreatAsContent(@LinkCTA2))=%%" target="_blank" style="display:inline-block; border-radius:10px; background-color:#2C3490; background-image:linear-gradient(#2C3490,#2C3490); color:#ffffff; -webkit-text-fill-color:#ffffff; padding:14px 20px; font-size:13px; line-height:18px; text-align:center; text-decoration:none; font-weight:700;">%%=TreatAsContent(@TituloCTA2)=%%</a>
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
            <td align="center" bgcolor="#F6F6FB" class="content-pad" style="padding:26px 32px 24px 32px; background-color:#F6F6FB; background-image:linear-gradient(#F6F6FB,#F6F6FB);">
              <h2 class="headline" style="max-width:500px; margin:0 auto 18px auto; color:%%=v(@CorTituloCopy2)=%%; -webkit-text-fill-color:%%=v(@CorTituloCopy2)=%%; font-size:%%=v(@TamanhoFonteTituloCopy2)=%%px; line-height:1.25; font-weight:700; text-align:center;">%%=TreatAsContent(Replace(Replace(Replace(Replace(Replace(Replace(Replace(Replace(Replace(Replace(Replace(@TituloCopy2, "background-color:#F4F5FB;", "background-color:#F4F5FB;background-image:linear-gradient(#F4F5FB,#F4F5FB);"), "background:#F4F5FB;", "background:#F4F5FB;background-image:linear-gradient(#F4F5FB,#F4F5FB);"), "background-color:#E7A921;", "background-color:#E7A921;background-image:linear-gradient(#E7A921,#E7A921);"), "background:#E7A921;", "background:#E7A921;background-image:linear-gradient(#E7A921,#E7A921);"), "background-color:#ffffff;", "background-color:#ffffff;background-image:linear-gradient(#ffffff,#ffffff);"), "background:#ffffff;", "background:#ffffff;background-image:linear-gradient(#ffffff,#ffffff);"), "background-color:#F6F6FB;", "background-color:#F6F6FB;background-image:linear-gradient(#F6F6FB,#F6F6FB);"), "background:#F6F6FB;", "background:#F6F6FB;background-image:linear-gradient(#F6F6FB,#F6F6FB);"), "color:#242424;", "color:#242424;-webkit-text-fill-color:#242424;"), "color:#2C3490;", "color:#2C3490;-webkit-text-fill-color:#2C3490;"), "color:#4A4F6A;", "color:#4A4F6A;-webkit-text-fill-color:#4A4F6A;"))=%%</h2>
            </td>
          </tr>
          %%[ ENDIF ]%%
          %%[ IF NOT EMPTY(@Copy2Preto) OR (NOT EMPTY(@TituloCTA2) AND NOT EMPTY(@LinkCTA2)) THEN ]%%
          <tr>
            <td align="center" class="content-pad cta-cell" style="padding:24px 32px 32px 32px;">
              %%[ IF NOT EMPTY(@Copy2Preto) THEN ]%%
              <div class="body-copy" style="max-width:480px; margin:0 auto 18px auto; color:%%=v(@CorCopy2)=%%; -webkit-text-fill-color:%%=v(@CorCopy2)=%%; font-size:%%=v(@TamanhoFonteCopy2)=%%px; line-height:1.6; text-align:center;">%%=TreatAsContent(Replace(Replace(Replace(Replace(Replace(Replace(Replace(Replace(Replace(Replace(Replace(@Copy2Preto, "background-color:#F4F5FB;", "background-color:#F4F5FB;background-image:linear-gradient(#F4F5FB,#F4F5FB);"), "background:#F4F5FB;", "background:#F4F5FB;background-image:linear-gradient(#F4F5FB,#F4F5FB);"), "background-color:#E7A921;", "background-color:#E7A921;background-image:linear-gradient(#E7A921,#E7A921);"), "background:#E7A921;", "background:#E7A921;background-image:linear-gradient(#E7A921,#E7A921);"), "background-color:#ffffff;", "background-color:#ffffff;background-image:linear-gradient(#ffffff,#ffffff);"), "background:#ffffff;", "background:#ffffff;background-image:linear-gradient(#ffffff,#ffffff);"), "background-color:#F6F6FB;", "background-color:#F6F6FB;background-image:linear-gradient(#F6F6FB,#F6F6FB);"), "background:#F6F6FB;", "background:#F6F6FB;background-image:linear-gradient(#F6F6FB,#F6F6FB);"), "color:#242424;", "color:#242424;-webkit-text-fill-color:#242424;"), "color:#2C3490;", "color:#2C3490;-webkit-text-fill-color:#2C3490;"), "color:#4A4F6A;", "color:#4A4F6A;-webkit-text-fill-color:#4A4F6A;"))=%%</div>
              %%[ ENDIF ]%%
              %%[ IF NOT EMPTY(@TituloCTA2) AND NOT EMPTY(@LinkCTA2) THEN ]%%
              <a class="brand-text brand-odd cta-link" href="%%=RedirectTo(TreatAsContent(@LinkCTA2))=%%" target="_blank" style="display:inline-block; min-width:0; max-width:100%; box-sizing:border-box; border-radius:10px; background-color:#2C3490; background-image:linear-gradient(#2C3490,#2C3490); color:#ffffff; -webkit-text-fill-color:#ffffff; padding:15px 26px; font-size:15px; line-height:20px; text-align:center; text-decoration:none; font-weight:700;">%%=TreatAsContent(@TituloCTA2)=%%</a>
              %%[ ENDIF ]%%
            </td>
          </tr>
          %%[ ENDIF ]%%
          %%[ ENDIF ]%%
          %%[ IF NOT EMPTY(@Banner2Corpo) THEN ]%%
          <tr>
            <td style="padding:0; background-color:#ffffff; background-image:linear-gradient(#ffffff,#ffffff);">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="table-layout:fixed;">
                <tr>
                  <td width="55%" valign="middle" class="stack-column stack-copy" style="width:55%; padding:30px 12px 30px 32px;">
                    %%[ IF NOT EMPTY(@TituloCopy2) THEN ]%%
                    <h2 style="margin:0 0 10px 0; color:%%=v(@CorTituloCopy2)=%%; -webkit-text-fill-color:%%=v(@CorTituloCopy2)=%%; font-size:%%=v(@TamanhoFonteTituloCopy2)=%%px; line-height:1.25; font-weight:700;">%%=TreatAsContent(Replace(Replace(Replace(Replace(Replace(Replace(Replace(Replace(Replace(Replace(Replace(@TituloCopy2, "background-color:#F4F5FB;", "background-color:#F4F5FB;background-image:linear-gradient(#F4F5FB,#F4F5FB);"), "background:#F4F5FB;", "background:#F4F5FB;background-image:linear-gradient(#F4F5FB,#F4F5FB);"), "background-color:#E7A921;", "background-color:#E7A921;background-image:linear-gradient(#E7A921,#E7A921);"), "background:#E7A921;", "background:#E7A921;background-image:linear-gradient(#E7A921,#E7A921);"), "background-color:#ffffff;", "background-color:#ffffff;background-image:linear-gradient(#ffffff,#ffffff);"), "background:#ffffff;", "background:#ffffff;background-image:linear-gradient(#ffffff,#ffffff);"), "background-color:#F6F6FB;", "background-color:#F6F6FB;background-image:linear-gradient(#F6F6FB,#F6F6FB);"), "background:#F6F6FB;", "background:#F6F6FB;background-image:linear-gradient(#F6F6FB,#F6F6FB);"), "color:#242424;", "color:#242424;-webkit-text-fill-color:#242424;"), "color:#2C3490;", "color:#2C3490;-webkit-text-fill-color:#2C3490;"), "color:#4A4F6A;", "color:#4A4F6A;-webkit-text-fill-color:#4A4F6A;"))=%%</h2>
                    %%[ ENDIF ]%%
                    %%[ IF NOT EMPTY(@Copy2Preto) THEN ]%%
                    <div style="margin:0 0 18px 0; color:%%=v(@CorCopy2)=%%; -webkit-text-fill-color:%%=v(@CorCopy2)=%%; font-size:%%=v(@TamanhoFonteCopy2)=%%px; line-height:1.55;">%%=TreatAsContent(Replace(Replace(Replace(Replace(Replace(Replace(Replace(Replace(Replace(Replace(Replace(@Copy2Preto, "background-color:#F4F5FB;", "background-color:#F4F5FB;background-image:linear-gradient(#F4F5FB,#F4F5FB);"), "background:#F4F5FB;", "background:#F4F5FB;background-image:linear-gradient(#F4F5FB,#F4F5FB);"), "background-color:#E7A921;", "background-color:#E7A921;background-image:linear-gradient(#E7A921,#E7A921);"), "background:#E7A921;", "background:#E7A921;background-image:linear-gradient(#E7A921,#E7A921);"), "background-color:#ffffff;", "background-color:#ffffff;background-image:linear-gradient(#ffffff,#ffffff);"), "background:#ffffff;", "background:#ffffff;background-image:linear-gradient(#ffffff,#ffffff);"), "background-color:#F6F6FB;", "background-color:#F6F6FB;background-image:linear-gradient(#F6F6FB,#F6F6FB);"), "background:#F6F6FB;", "background:#F6F6FB;background-image:linear-gradient(#F6F6FB,#F6F6FB);"), "color:#242424;", "color:#242424;-webkit-text-fill-color:#242424;"), "color:#2C3490;", "color:#2C3490;-webkit-text-fill-color:#2C3490;"), "color:#4A4F6A;", "color:#4A4F6A;-webkit-text-fill-color:#4A4F6A;"))=%%</div>
                    %%[ ENDIF ]%%
                    %%[ IF NOT EMPTY(@TituloCTA2) AND NOT EMPTY(@LinkCTA2) THEN ]%%
                    <a class="brand-text brand-odd" href="%%=RedirectTo(TreatAsContent(@LinkCTA2))=%%" target="_blank" style="display:inline-block; border-radius:10px; background-color:#2C3490; background-image:linear-gradient(#2C3490,#2C3490); color:#ffffff; -webkit-text-fill-color:#ffffff; padding:14px 20px; font-size:13px; line-height:18px; text-align:center; text-decoration:none; font-weight:700;">%%=TreatAsContent(@TituloCTA2)=%%</a>
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
            <td class="legal-pad" style="padding:18px 32px 28px 32px; border-top:1px solid #e5e7eb; background-color:#ffffff; background-image:linear-gradient(#ffffff,#ffffff);">
              %%[ IF NOT EMPTY(@NotaLegal) THEN ]%%
              <div style="margin:0 0 14px 0; color:%%=v(@CorNotaLegal)=%%; -webkit-text-fill-color:%%=v(@CorNotaLegal)=%%; font-size:%%=v(@TamanhoFonteNotaLegal)=%%px; line-height:1.5;">%%=TreatAsContent(Replace(Replace(Replace(Replace(Replace(Replace(Replace(Replace(Replace(Replace(Replace(@NotaLegal, "background-color:#F4F5FB;", "background-color:#F4F5FB;background-image:linear-gradient(#F4F5FB,#F4F5FB);"), "background:#F4F5FB;", "background:#F4F5FB;background-image:linear-gradient(#F4F5FB,#F4F5FB);"), "background-color:#E7A921;", "background-color:#E7A921;background-image:linear-gradient(#E7A921,#E7A921);"), "background:#E7A921;", "background:#E7A921;background-image:linear-gradient(#E7A921,#E7A921);"), "background-color:#ffffff;", "background-color:#ffffff;background-image:linear-gradient(#ffffff,#ffffff);"), "background:#ffffff;", "background:#ffffff;background-image:linear-gradient(#ffffff,#ffffff);"), "background-color:#F6F6FB;", "background-color:#F6F6FB;background-image:linear-gradient(#F6F6FB,#F6F6FB);"), "background:#F6F6FB;", "background:#F6F6FB;background-image:linear-gradient(#F6F6FB,#F6F6FB);"), "color:#242424;", "color:#242424;-webkit-text-fill-color:#242424;"), "color:#2C3490;", "color:#2C3490;-webkit-text-fill-color:#2C3490;"), "color:#4A4F6A;", "color:#4A4F6A;-webkit-text-fill-color:#4A4F6A;"))=%%</div>
              %%[ ENDIF ]%%
            </td>
          </tr>
          %%[ ENDIF ]%%
          <tr>
            <td align="center" class="legal-pad" style="padding:20px 32px 28px 32px; border-top:1px solid #e5e7eb; background-color:#ffffff; background-image:linear-gradient(#ffffff,#ffffff); color:#6b7280; -webkit-text-fill-color:#6b7280; font-family:Arial, Helvetica, sans-serif; font-size:10px; line-height:1.5; text-align:center;">
              Este e-mail foi enviado por:<br>
              %%Member_Busname%%<br>
              %%Member_Addr%%, %%Member_City%% - %%Member_State%%<br>
              %%Member_PostalCode%% - %%Member_Country%%<br><br>
              <a href="%%profile_center_url%%" alias="Central de Preferências" target="_blank" style="color:#2C3490; -webkit-text-fill-color:#2C3490; text-decoration:underline;">Gerenciar preferências</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
  <custom name="opencounter" type="tracking"/>
</body>
</html>$v15$,false,'active',1,null,null);

create temporary table v15_groups on commit drop as select campaign_group_id old_id,gen_random_uuid() new_id from public.dynamic_email_email_strategies where ruler_strategy_id='d2d20000-0000-4000-8000-000000000001';
create temporary table v15_ruler on commit drop as select gen_random_uuid() id;
insert into public.dynamic_email_ruler_strategies select (jsonb_populate_record(null::public.dynamic_email_ruler_strategies,to_jsonb(r)||jsonb_build_object(
 'id',n.id,'name','V3 TOPO DE FUNIL DINÂMICO','segment','V3 TOPO DE FUNIL DINÂMICO','source_ruler_id',r.id,'template_slot_id','builtin-plurix-v15',
 'description','V3 CRM: quatro headers completos publicados no Content Builder; vigencia 28/10 a 30/11/2026. Avenida conserva assinatura adicional fora da arte. Test Send pendente.',
 'editorial_status','draft','version',1,'created_at',now(),'updated_at',now(),'created_by',null,'updated_by',null))).* from public.dynamic_email_ruler_strategies r cross join v15_ruler n where r.id='d2d20000-0000-4000-8000-000000000001';

insert into public.dynamic_email_segments(technical_name,display_name,business_front,partner,bu,lifecycle_family,audience_description,origin,governance_status,created_by,updated_by)
select 'V3 TOPO DE FUNIL DINÂMICO','V3 TOPO DE FUNIL DINÂMICO','acquisition','Plurix','Plurix','Topo de Funil','Clube +amigo; campanha CRM; V15; em revisao.','planned','draft',null,null
where not exists(select 1 from public.dynamic_email_segments where technical_name='V3 TOPO DE FUNIL DINÂMICO' and partner='Plurix');

insert into public.dynamic_email_email_strategies select (jsonb_populate_record(null::public.dynamic_email_email_strategies,to_jsonb(e)||jsonb_build_object(
 'id',gen_random_uuid(),'ruler_strategy_id',r.id,'campaign_group_id',g.new_id,'segment','V3 TOPO DE FUNIL DINÂMICO',
 'technical_status','needs_review','editorial_status','draft','visual_status','needs_review','certification_status','not_tested','version',1,'created_at',now(),'updated_at',now(),'created_by',null,'updated_by',null,
 'updated_by_type','system','update_source','gaas','change_reason','V2 clonada para V3 CRM com header rasterizado e template V15',
 'field_provenance',e.field_provenance||jsonb_build_object('v3_source_email_strategy_id',e.id)))).* from public.dynamic_email_email_strategies e join v15_groups g on g.old_id=e.campaign_group_id cross join v15_ruler r;

insert into public.dynamic_email_briefings select (jsonb_populate_record(null::public.dynamic_email_briefings,to_jsonb(b)||jsonb_build_object(
 'id',n.id,'campaign_group_id',g.new_id,'segment','V3 TOPO DE FUNIL DINÂMICO','template_slot_id','builtin-plurix-v15',
 'status','draft','version',1,'journey_confirmed',false,'acknowledged_missing_activity',false,'activity_names','[]'::jsonb,'created_at',now(),'updated_at',now(),'created_by',null,'updated_by',null,
 'import_source',jsonb_build_object('kind','v2_clone_v15','source_briefing_id',b.id,'source_version',b.version),
 'briefing_data',b.briefing_data||jsonb_build_object('__id',n.id,'__journeyConfirmed',false,'TP_CAMPANHA','CRM','DT_INICIO','2026-10-28T00:00','DT_FIM','2026-11-30T23:59','HEADER',
 case b.briefing_data->>'SEQUENCIA' when 'E-mail 1' then 'https://image.contato.clubemaisamigo.com.br/lib/fe3011747364047e721773/m/1/9a632d10-85e2-4a4e-b9c9-8b56eb0aa569.png' when 'E-mail 2' then 'https://image.contato.clubemaisamigo.com.br/lib/fe3011747364047e721773/m/1/444740ce-dc51-4156-bdfa-ad0ab09a06b4.png' when 'E-mail 3' then 'https://image.contato.clubemaisamigo.com.br/lib/fe3011747364047e721773/m/1/40c3316a-f124-4884-979e-9350fdb32987.png' when 'E-mail 4' then 'https://image.contato.clubemaisamigo.com.br/lib/fe3011747364047e721773/m/1/32e872d2-1566-4c30-952b-4cbf9505270c.png' else null end)))).*
from public.dynamic_email_briefings b join v15_groups g on g.old_id=b.campaign_group_id cross join lateral (select gen_random_uuid() id where b.id is not null) n;

do $verify$ begin
 if (select count(*) from public.dynamic_email_briefings where segment='V3 TOPO DE FUNIL DINÂMICO')<>24 then raise exception 'Esperadas 24 variacoes V3';end if;
 if exists(select 1 from public.dynamic_email_briefings where segment='V3 TOPO DE FUNIL DINÂMICO' and (briefing_data->>'HEADER' is null or briefing_data->>'TP_CAMPANHA'<>'CRM')) then raise exception 'V3 incompleta';end if;
end $verify$;
