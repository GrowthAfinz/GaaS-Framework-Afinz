export const DEFAULT_DYNAMIC_EMAIL_TEMPLATE = `%%[
SET @FirstName = [PRI_NOME]
SET @LimiteNovo = [LIMITE]
SET @Produto = [PRODUTO]
SET @Sequencia = [SEQUENCIA]
SET @TpCampanha = [TP_CAMPANHA]
SET @Today = NOW()
SET @BriefingRows = LookupOrderedRows("TB_BRIEFING_CAMPANHA_AQUISICAO",1,"DT_INICIO DESC","NM_PRODUTO_INTERNO",@Produto,"SEQUENCIA",@Sequencia,"TP_CAMPANHA",@TpCampanha)
SET @RowCount = RowCount(@BriefingRows)
IF @RowCount > 0 THEN
SET @Row = Row(@BriefingRows, 1)
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
ELSE RaiseError("Dados de briefing da campanha não encontrados.", true)
ENDIF
]%%
<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>%%=TreatAsContent(@Assunto)=%%</title></head>
<body style="margin:0;background:#f4f4f4;font-family:Arial,sans-serif"><table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr><td align="center">
<table role="presentation" cellpadding="0" cellspacing="0" width="600" style="width:100%;max-width:600px;background:#fff">
%%[ IF NOT EMPTY(@PreCabecalho) THEN ]%%<tr><td style="display:none;max-height:0;overflow:hidden">%%=TreatAsContent(@PreCabecalho)=%%</td></tr>%%[ ENDIF ]%%
%%[ IF NOT EMPTY(@Header) THEN ]%%<tr><td><img src="%%=v(@Header)=%%" alt="" width="600" style="display:block;width:100%;height:auto;border:0"></td></tr>%%[ ENDIF ]%%
<tr><td style="padding:28px">
%%[ IF NOT EMPTY(@TituloCopy1) THEN ]%%<h1 style="color:%%=v(@CorCopy1)=%%;font-size:%%=v(@TamanhoFonteTituloCopy1)=%%px">%%=TreatAsContent(@TituloCopy1)=%%</h1>%%[ ENDIF ]%%
%%[ IF NOT EMPTY(@Copy1Preto) THEN ]%%<div style="color:%%=v(@CorCopyPreto1)=%%;font-size:%%=v(@TamanhoFonteCopyPreto1)=%%px;line-height:1.5">%%=TreatAsContent(@Copy1Preto)=%%</div>%%[ ENDIF ]%%
%%[ IF NOT EMPTY(@TituloCTA1) AND NOT EMPTY(@LinkCTA1) THEN ]%%<p style="text-align:center;margin:28px 0"><a href="%%=RedirectTo(TreatAsContent(@LinkCTA1))=%%" style="display:inline-block;border-radius:8px;background:#00C6CC;color:#fff;padding:14px 28px;text-decoration:none;font-weight:bold">%%=TreatAsContent(@TituloCTA1)=%%</a></p>%%[ ENDIF ]%%
%%[ IF NOT EMPTY(@Banner1Corpo) THEN ]%%<p><img src="%%=v(@Banner1Corpo)=%%" alt="" style="display:block;width:100%;height:auto"></p>%%[ ENDIF ]%%
%%[ IF NOT EMPTY(@TituloCopy2) THEN ]%%<h2 style="color:%%=v(@CorTituloCopy2)=%%;font-size:%%=v(@TamanhoFonteTituloCopy2)=%%px">%%=TreatAsContent(@TituloCopy2)=%%</h2>%%[ ENDIF ]%%
%%[ IF NOT EMPTY(@Copy2Preto) THEN ]%%<div style="color:%%=v(@CorCopy2)=%%;font-size:%%=v(@TamanhoFonteCopy2)=%%px;line-height:1.6">%%=TreatAsContent(@Copy2Preto)=%%</div>%%[ ENDIF ]%%
%%[ IF NOT EMPTY(@TituloCTA2) AND NOT EMPTY(@LinkCTA2) THEN ]%%<p style="text-align:center;margin:28px 0"><a href="%%=RedirectTo(TreatAsContent(@LinkCTA2))=%%" style="display:inline-block;border-radius:8px;background:#00C6CC;color:#fff;padding:14px 28px;text-decoration:none;font-weight:bold">%%=TreatAsContent(@TituloCTA2)=%%</a></p>%%[ ENDIF ]%%
%%[ IF NOT EMPTY(@Banner2Corpo) THEN ]%%<p><img src="%%=v(@Banner2Corpo)=%%" alt="" style="display:block;width:100%;height:auto"></p>%%[ ENDIF ]%%
%%[ IF NOT EMPTY(@Banner3Corpo) THEN ]%%<p><img src="%%=v(@Banner3Corpo)=%%" alt="" style="display:block;width:100%;height:auto"></p>%%[ ENDIF ]%%
%%[ IF NOT EMPTY(@NotaLegal) THEN ]%%<hr style="border:0;border-top:1px solid #eee"><p style="color:%%=v(@CorNotaLegal)=%%;font-size:%%=v(@TamanhoFonteNotaLegal)=%%px">%%=TreatAsContent(@NotaLegal)=%%</p>%%[ ENDIF ]%%
%%[ IF NOT EMPTY(@Rodape) THEN ]%%<div style="text-align:center;font-size:11px;color:#777">%%=TreatAsContent(@Rodape)=%%</div>%%[ ENDIF ]%%
</td></tr></table></td></tr></table></body></html>`;
