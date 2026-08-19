export const PLURIX_UX_V2_TEMPLATE_ID = 'builtin-plurix-acquisition-ux-v2';

export const PLURIX_UX_V2_TEMPLATE = `%%[
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
          %%[ IF NOT EMPTY(@Header) THEN ]%%
          <tr>
            <td align="center" style="background-color:#eef1f5;">
              <img src="%%=v(@Header)=%%" alt="Oferta do cartão +amigo" width="600" style="display:block; width:100%; max-width:600px; height:auto; border:0;">
            </td>
          </tr>
          %%[ ENDIF ]%%
          <tr>
            <td align="center" class="content-pad" style="padding:30px 32px 8px 32px; text-align:center;">
              %%[ IF NOT EMPTY(@TituloCopy1) THEN ]%%
              <h1 class="headline" style="max-width:500px; margin:0 auto 14px auto; color:%%=v(@CorCopy1)=%%; font-size:%%=v(@TamanhoFonteTituloCopy1)=%%px; line-height:1.25; font-weight:700; text-align:center;">%%=TreatAsContent(@TituloCopy1)=%%</h1>
              %%[ ENDIF ]%%
              %%[ IF NOT EMPTY(@Copy1Preto) THEN ]%%
              <div class="body-copy" style="max-width:500px; margin:0 auto; color:%%=v(@CorCopyPreto1)=%%; font-size:%%=v(@TamanhoFonteCopyPreto1)=%%px; line-height:1.55; text-align:center;">%%=TreatAsContent(@Copy1Preto)=%%</div>
              %%[ ENDIF ]%%
            </td>
          </tr>
          %%[ IF NOT EMPTY(@Banner1Corpo) THEN ]%%
          <tr>
            <td align="center" class="content-pad" style="padding:16px 32px 4px 32px;">
              %%[ IF NOT EMPTY(@LinkBanner1) THEN ]%%<a href="%%=RedirectTo(TreatAsContent(@LinkBanner1))=%%" target="_blank" style="text-decoration:none;">%%[ ENDIF ]%%
              <img src="%%=v(@Banner1Corpo)=%%" alt="Benefícios do cartão +amigo" width="536" style="display:block; width:100%; max-width:536px; height:auto; border:0;">
              %%[ IF NOT EMPTY(@LinkBanner1) THEN ]%%</a>%%[ ENDIF ]%%
            </td>
          </tr>
          %%[ ENDIF ]%%
          %%[ IF NOT EMPTY(@TituloCTA1) AND NOT EMPTY(@LinkCTA1) THEN ]%%
          <tr>
            <td align="center" class="content-pad cta-cell" style="padding:20px 32px 32px 32px;">
              <a class="cta-link" href="%%=RedirectTo(TreatAsContent(@LinkCTA1))=%%" target="_blank" style="display:inline-block; min-width:280px; border-radius:10px; background-color:#2C3490; color:#ffffff; padding:15px 26px; font-size:15px; line-height:20px; text-align:center; text-decoration:none; font-weight:700;">%%=TreatAsContent(@TituloCTA1)=%%</a>
            </td>
          </tr>
          %%[ ENDIF ]%%
          %%[ IF NOT EMPTY(@TituloCopy2) OR NOT EMPTY(@Copy2Preto) OR NOT EMPTY(@Banner2Corpo) THEN ]%%
          <tr>
            <td align="center" bgcolor="#F6F6FB" class="content-pad" style="padding:26px 32px 24px 32px; background-color:#F6F6FB;">
              %%[ IF NOT EMPTY(@TituloCopy2) THEN ]%%
              <h2 class="headline" style="max-width:500px; margin:0 auto 18px auto; color:%%=v(@CorTituloCopy2)=%%; font-size:%%=v(@TamanhoFonteTituloCopy2)=%%px; line-height:1.25; font-weight:700; text-align:center;">%%=TreatAsContent(@TituloCopy2)=%%</h2>
              %%[ ENDIF ]%%
              %%[ IF NOT EMPTY(@Copy2Preto) THEN ]%%
              <div class="body-copy" style="max-width:480px; margin:0 auto; color:%%=v(@CorCopy2)=%%; font-size:%%=v(@TamanhoFonteCopy2)=%%px; line-height:1.65; text-align:left;">%%=TreatAsContent(@Copy2Preto)=%%</div>
              %%[ ENDIF ]%%
            </td>
          </tr>
          %%[ IF NOT EMPTY(@Banner2Corpo) THEN ]%%
          <tr>
            <td align="center" class="content-pad" style="padding:16px 32px 4px 32px;">
              %%[ IF NOT EMPTY(@LinkBanner2) THEN ]%%<a href="%%=RedirectTo(TreatAsContent(@LinkBanner2))=%%" target="_blank" style="text-decoration:none;">%%[ ENDIF ]%%
              <img src="%%=v(@Banner2Corpo)=%%" alt="Como solicitar o cartão +amigo" width="536" style="display:block; width:100%; max-width:536px; height:auto; border:0;">
              %%[ IF NOT EMPTY(@LinkBanner2) THEN ]%%</a>%%[ ENDIF ]%%
            </td>
          </tr>
          %%[ ENDIF ]%%
          %%[ IF NOT EMPTY(@TituloCTA2) AND NOT EMPTY(@LinkCTA2) THEN ]%%
          <tr>
            <td align="center" class="content-pad cta-cell" style="padding:20px 32px 34px 32px;">
              <a class="cta-link" href="%%=RedirectTo(TreatAsContent(@LinkCTA2))=%%" target="_blank" style="display:inline-block; min-width:280px; border-radius:10px; background-color:#2C3490; color:#ffffff; padding:15px 26px; font-size:15px; line-height:20px; text-align:center; text-decoration:none; font-weight:700;">%%=TreatAsContent(@TituloCTA2)=%%</a>
            </td>
          </tr>
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
          %%[ IF NOT EMPTY(@NotaLegal) OR NOT EMPTY(@Rodape) THEN ]%%
          <tr>
            <td class="legal-pad" style="padding:18px 32px 28px 32px; border-top:1px solid #e5e7eb; background-color:#ffffff;">
              %%[ IF NOT EMPTY(@NotaLegal) THEN ]%%
              <div style="margin:0 0 14px 0; color:%%=v(@CorNotaLegal)=%%; font-size:%%=v(@TamanhoFonteNotaLegal)=%%px; line-height:1.5;">%%=TreatAsContent(@NotaLegal)=%%</div>
              %%[ ENDIF ]%%
              %%[ IF NOT EMPTY(@Rodape) THEN ]%%
              <div style="margin:0; color:#6b7280; font-size:11px; line-height:1.45; text-align:center;">%%=TreatAsContent(@Rodape)=%%</div>
              %%[ ENDIF ]%%
            </td>
          </tr>
          %%[ ENDIF ]%%
        </table>
      </td>
    </tr>
  </table>
  <custom name="opencounter" type="tracking"/>
</body>
</html>`;
