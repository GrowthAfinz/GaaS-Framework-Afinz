export const B2C_CLASSIC_VIBE_DYNAMIC_TEMPLATE_ID = 'b2c-classic-vibe-dynamic-v1';

/**
 * Canonical B2C acquisition renderer. Every message variation lives in the
 * 36-field briefing contract; the HTML does not branch by e-mail number.
 */
export const B2C_CLASSIC_VIBE_DYNAMIC_TEMPLATE = `%%[
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
<!doctype html>
<html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>%%=TreatAsContent(@Assunto)=%%</title>
<style>@media only screen and (max-width:620px){.shell{width:100%!important}.pad{padding-left:22px!important;padding-right:22px!important}.cta{display:block!important;min-width:0!important}.body-copy{font-size:16px!important}.asset{width:100%!important;height:auto!important}}</style></head>
<body style="margin:0;padding:0;background:#f3f5f7;font-family:Arial,Tahoma,sans-serif;color:#111827">
%%[ IF NOT EMPTY(@PreCabecalho) THEN ]%%<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">%%=TreatAsContent(@PreCabecalho)=%%&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>%%[ ENDIF ]%%
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td align="center" style="padding:18px 8px">
<table role="presentation" class="shell" width="600" cellspacing="0" cellpadding="0" border="0" style="width:600px;max-width:600px;background:#ffffff">
<tr><td align="center"><a href="https://afinz.com.br/" target="_blank"><img src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/160b947b-93b3-49f8-9537-84245584e143.png" width="600" alt="Afinz" style="display:block;width:100%;height:auto;border:0"></a></td></tr>
%%[ IF NOT EMPTY(@Header) THEN ]%%<tr><td><img class="asset" src="%%=v(@Header)=%%" width="600" alt="Oferta do cartão Afinz Visa" style="display:block;width:100%;height:auto;border:0"></td></tr>%%[ ENDIF ]%%
<tr><td class="pad" style="padding:28px 34px 12px;text-align:center">
%%[ IF NOT EMPTY(@TituloCopy1) THEN ]%%<h1 style="margin:0 0 14px;color:%%=v(@CorCopy1)=%%;font-size:%%=v(@TamanhoFonteTituloCopy1)=%%px;line-height:1.25">%%=TreatAsContent(@TituloCopy1)=%%</h1>%%[ ENDIF ]%%
%%[ IF NOT EMPTY(@Copy1Preto) THEN ]%%<div class="body-copy" style="color:%%=v(@CorCopyPreto1)=%%;font-size:%%=v(@TamanhoFonteCopyPreto1)=%%px;line-height:1.55">%%=TreatAsContent(@Copy1Preto)=%%</div>%%[ ENDIF ]%%
%%[ IF NOT EMPTY(@TituloCTA1) AND NOT EMPTY(@LinkCTA1) THEN ]%%<div style="padding:22px 0 8px"><a class="cta" href="%%=RedirectTo(TreatAsContent(@LinkCTA1))=%%" target="_blank" style="display:inline-block;min-width:250px;border-radius:5px;background:#00C6CC;color:#000000;padding:13px 24px;text-decoration:none;font-size:16px;font-weight:700">%%=TreatAsContent(@TituloCTA1)=%%</a></div><div style="font-size:11px;font-weight:700">Sujeito à análise de crédito</div>%%[ ENDIF ]%%
</td></tr>
%%[ IF NOT EMPTY(@Banner1Corpo) THEN ]%%<tr><td class="pad" align="center" style="padding:14px 34px">%%[ IF NOT EMPTY(@LinkBanner1) THEN ]%%<a href="%%=RedirectTo(TreatAsContent(@LinkBanner1))=%%" target="_blank">%%[ ENDIF ]%%<img class="asset" src="%%=v(@Banner1Corpo)=%%" width="532" alt="Benefícios do cartão Afinz" style="display:block;width:100%;max-width:532px;height:auto;border:0">%%[ IF NOT EMPTY(@LinkBanner1) THEN ]%%</a>%%[ ENDIF ]%%</td></tr>%%[ ENDIF ]%%
%%[ IF NOT EMPTY(@TituloCopy2) OR NOT EMPTY(@Copy2Preto) THEN ]%%<tr><td class="pad" style="padding:20px 34px;text-align:center">%%[ IF NOT EMPTY(@TituloCopy2) THEN ]%%<h2 style="margin:0 0 12px;color:%%=v(@CorTituloCopy2)=%%;font-size:%%=v(@TamanhoFonteTituloCopy2)=%%px;line-height:1.3">%%=TreatAsContent(@TituloCopy2)=%%</h2>%%[ ENDIF ]%%%%[ IF NOT EMPTY(@Copy2Preto) THEN ]%%<div class="body-copy" style="color:%%=v(@CorCopy2)=%%;font-size:%%=v(@TamanhoFonteCopy2)=%%px;line-height:1.55">%%=TreatAsContent(@Copy2Preto)=%%</div>%%[ ENDIF ]%%%%[ IF NOT EMPTY(@TituloCTA2) AND NOT EMPTY(@LinkCTA2) THEN ]%%<div style="padding:22px 0 0"><a class="cta" href="%%=RedirectTo(TreatAsContent(@LinkCTA2))=%%" target="_blank" style="display:inline-block;min-width:250px;border-radius:5px;background:#00C6CC;color:#000000;padding:13px 24px;text-decoration:none;font-size:16px;font-weight:700">%%=TreatAsContent(@TituloCTA2)=%%</a></div>%%[ ENDIF ]%%</td></tr>%%[ ENDIF ]%%
%%[ IF NOT EMPTY(@Banner2Corpo) THEN ]%%<tr><td class="pad" align="center" style="padding:12px 34px">%%[ IF NOT EMPTY(@LinkBanner2) THEN ]%%<a href="%%=RedirectTo(TreatAsContent(@LinkBanner2))=%%" target="_blank">%%[ ENDIF ]%%<img class="asset" src="%%=v(@Banner2Corpo)=%%" width="532" alt="Mais vantagens Afinz" style="display:block;width:100%;max-width:532px;height:auto;border:0">%%[ IF NOT EMPTY(@LinkBanner2) THEN ]%%</a>%%[ ENDIF ]%%</td></tr>%%[ ENDIF ]%%
%%[ IF NOT EMPTY(@Banner3Corpo) THEN ]%%<tr><td class="pad" align="center" style="padding:12px 34px 22px">%%[ IF NOT EMPTY(@LinkBanner3) THEN ]%%<a href="%%=RedirectTo(TreatAsContent(@LinkBanner3))=%%" target="_blank">%%[ ENDIF ]%%<img class="asset" src="%%=v(@Banner3Corpo)=%%" width="532" alt="Cartão Afinz Visa" style="display:block;width:100%;max-width:532px;height:auto;border:0">%%[ IF NOT EMPTY(@LinkBanner3) THEN ]%%</a>%%[ ENDIF ]%%</td></tr>%%[ ENDIF ]%%
%%[ IF NOT EMPTY(@NotaLegal) THEN ]%%<tr><td class="pad" style="padding:18px 34px;border-top:1px solid #e5e7eb;color:%%=v(@CorNotaLegal)=%%;font-size:%%=v(@TamanhoFonteNotaLegal)=%%px;line-height:1.45;text-align:justify">%%=TreatAsContent(@NotaLegal)=%%</td></tr>%%[ ENDIF ]%%
<tr><td align="center" style="padding:20px 28px"><div style="color:#00C6CC;font-size:22px;font-weight:700">Cartão Afinz, vantagens de ponta a ponta!</div><div style="padding-top:14px"><a href="https://www.instagram.com/afinzoficial/"><img src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/b07a3e46-7c00-409b-81fe-c1b5eceebf64.png" width="31" alt="Instagram" style="margin:0 5px;border:0"></a><a href="https://web.facebook.com/Afinz"><img src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/8f2daf4e-a386-471d-bc7b-aea7a6c8c416.png" width="30" alt="Facebook" style="margin:0 5px;border:0"></a><a href="https://www.tiktok.com/@afinzoficial"><img src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/31227d6c-28bc-41b4-8b27-c64795765698.png" width="30" alt="TikTok" style="margin:0 5px;border:0"></a></div></td></tr>
<tr><td style="padding:20px 28px;text-align:center;background:#000000;color:#ffffff"><div style="font-size:12px;line-height:1.55">Por favor, não responda este e-mail.<br>Esta é uma mensagem automática e não conseguimos atender por aqui.</div>%%[ IF NOT EMPTY(@Rodape) THEN ]%%<div style="margin-top:12px;font-size:10px;line-height:1.45;color:#d1d5db">%%=TreatAsContent(@Rodape)=%%</div>%%[ ENDIF ]%%</td></tr>
</table></td></tr></table></body></html>`;
