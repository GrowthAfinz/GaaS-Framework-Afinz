-- Régua Topo de Funil (CRM) do Bem Barato — cartão Bem Mais Afinz Visa.
-- Fonte de verdade: REGUA NOVA BEM BARATO.rtf (8 HTMLs originais).
-- Gerado por scripts/build-bem-barato-crm-migration.py — não editar à mão.
--
-- Transacional e idempotente. Falha se o número de briefings do Bem Barato
-- afetados for diferente de 8. Não altera briefings de outros parceiros e não
-- torna este slot principal global.

begin;

insert into public.dynamic_email_template_slots (id, name, source, is_principal, status, version)
values ('bem-barato-crm-dynamic-v1', 'Bem Barato CRM - Régua dinâmica v1', $bembarato$%%[
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
<style>
@media only screen and (max-width:620px){
.shell{width:100%!important}
.pad{padding-left:18px!important;padding-right:18px!important}
.buttonstyles{display:block!important}
.body-copy{font-size:16px!important}
.asset{width:100%!important;height:auto!important}
.grid-row td{display:block!important;width:100%!important;padding:4px 0!important}
}
</style></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:Tahoma,Geneva,sans-serif;color:#000000">
%%[ IF NOT EMPTY(@PreCabecalho) THEN ]%%<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">%%=TreatAsContent(@PreCabecalho)=%%&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>%%[ ENDIF ]%%
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td align="center" style="padding:0">
<table role="presentation" class="shell" width="600" cellspacing="0" cellpadding="0" border="0" style="width:600px;max-width:600px;background:#ffffff">

<tr><td align="center"><a href="https://afinz.com.br/" target="_blank"><img src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/160b947b-93b3-49f8-9537-84245584e143.png" width="600" alt="Afinz" style="display:block;width:100%;height:auto;border:0"></a></td></tr>

%%[ IF NOT EMPTY(@Header) THEN ]%%<tr><td><img class="asset" src="%%=v(@Header)=%%" width="600" alt="Cartão Bem Mais Afinz Visa" style="display:block;width:100%;height:auto;border:0"></td></tr>%%[ ENDIF ]%%

%%[ IF NOT EMPTY(@Copy1Preto) THEN ]%%<tr><td class="pad" align="center" style="padding:30px 30px 10px;text-align:center"><div class="body-copy" style="color:%%=v(@CorCopyPreto1)=%%;font-size:%%=v(@TamanhoFonteCopyPreto1)=%%px;font-family:Tahoma,Geneva,sans-serif;line-height:1.5">%%=TreatAsContent(@Copy1Preto)=%%</div></td></tr>%%[ ENDIF ]%%

%%[ IF @Sequencia == "E-mail 6" OR @Sequencia == "E-mail 8" THEN ]%%
%%[ IF NOT EMPTY(@TituloCTA1) AND NOT EMPTY(@LinkCTA1) THEN ]%%
<tr><td class="pad" align="center" style="padding:0 30px 6px">
<table role="presentation" border="0" cellspacing="0" cellpadding="0"><tr><td class="innertd buttonblock" bgcolor="#00C6CC" style="border-radius:5px;background-color:#00C6CC">
<a class="buttonstyles" href="%%=RedirectTo(TreatAsContent(@LinkCTA1))=%%" target="_blank" style="font-size:18px;font-family:Tahoma,Geneva,sans-serif;color:#000000;text-align:center;text-decoration:none;display:block;background-color:#00C6CC;border:0;padding:11px 20px;border-radius:5px">%%=TreatAsContent(@TituloCTA1)=%%</a>
</td></tr></table></td></tr>
<tr><td align="center" style="padding:0 30px 18px"><span style="font-size:11px;font-family:Tahoma,Geneva,sans-serif;color:#000000">Sujeito à análise de crédito</span></td></tr>
%%[ ENDIF ]%%
%%[ ENDIF ]%%

%%[ IF NOT EMPTY(@TituloCopy1) THEN ]%%<tr><td class="pad" align="center" style="padding:15px 40px 20px;text-align:center"><div style="color:%%=v(@CorCopy1)=%%;font-size:%%=v(@TamanhoFonteTituloCopy1)=%%px;font-family:Tahoma,Geneva,sans-serif;font-weight:bold;line-height:1.3">%%=TreatAsContent(@TituloCopy1)=%%</div></td></tr>%%[ ENDIF ]%%

%%[ IF @Sequencia == "E-mail 1" OR @Sequencia == "E-mail 2" OR @Sequencia == "E-mail 3" OR @Sequencia == "E-mail 4" THEN ]%%<tr><td class="pad" style="padding:0 25px 10px">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr class="grid-row"><td valign="top" align="center" style="width:50%;padding:3px 3px 3px 0"><img class="asset" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/dd5bd72f-fba0-4ed0-a6a4-e9fa78758810.png" width="600" alt="Benefício do cartão Bem Mais Afinz Visa" style="display:block;width:100%;height:auto;border:0"></td><td valign="top" align="center" style="width:50%;padding:3px 0 3px 3px"><img class="asset" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/3f2ff739-5b6d-4484-ba6a-d552390794ba.png" width="600" alt="Benefício do cartão Bem Mais Afinz Visa" style="display:block;width:100%;height:auto;border:0"></td></tr><tr class="grid-row"><td valign="top" align="center" style="width:50%;padding:3px 3px 3px 0"><img class="asset" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/63c27266-d881-4e29-b256-fb6c3a2348ed.png" width="600" alt="Benefício do cartão Bem Mais Afinz Visa" style="display:block;width:100%;height:auto;border:0"></td><td valign="top" align="center" style="width:50%;padding:3px 0 3px 3px"><img class="asset" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/87c5c98f-c6dd-47e1-8522-7e4f67172d1b.png" width="600" alt="Benefício do cartão Bem Mais Afinz Visa" style="display:block;width:100%;height:auto;border:0"></td></tr></table></td></tr>%%[ ENDIF ]%%
%%[ IF @Sequencia == "E-mail 7" THEN ]%%<tr><td class="pad" style="padding:0 25px 10px">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr class="grid-row"><td valign="top" align="center" style="width:50%;padding:3px 3px 3px 0"><img class="asset" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/3f2ff739-5b6d-4484-ba6a-d552390794ba.png" width="600" alt="Benefício do cartão Bem Mais Afinz Visa" style="display:block;width:100%;height:auto;border:0"></td><td valign="top" align="center" style="width:50%;padding:3px 0 3px 3px"><img class="asset" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/63c27266-d881-4e29-b256-fb6c3a2348ed.png" width="600" alt="Benefício do cartão Bem Mais Afinz Visa" style="display:block;width:100%;height:auto;border:0"></td></tr><tr class="grid-row"><td valign="top" align="center" style="width:50%;padding:3px 3px 3px 0"><img class="asset" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/87c5c98f-c6dd-47e1-8522-7e4f67172d1b.png" width="600" alt="Benefício do cartão Bem Mais Afinz Visa" style="display:block;width:100%;height:auto;border:0"></td><td valign="top" align="center" style="width:50%;padding:3px 0 3px 3px"><img class="asset" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/dd5bd72f-fba0-4ed0-a6a4-e9fa78758810.png" width="600" alt="Benefício do cartão Bem Mais Afinz Visa" style="display:block;width:100%;height:auto;border:0"></td></tr></table></td></tr>%%[ ENDIF ]%%
%%[ IF @Sequencia == "E-mail 5" THEN ]%%<tr><td class="pad" style="padding:0 25px 10px">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr class="grid-row"><td valign="top" align="center" style="width:33%;padding:3px 3px 3px 0"><img class="asset" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/dd5bd72f-fba0-4ed0-a6a4-e9fa78758810.png" width="600" alt="Benefício do cartão Bem Mais Afinz Visa" style="display:block;width:100%;height:auto;border:0"></td><td valign="top" align="center" style="width:33%;padding:3px 0 3px 3px"><img class="asset" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/63c27266-d881-4e29-b256-fb6c3a2348ed.png" width="600" alt="Benefício do cartão Bem Mais Afinz Visa" style="display:block;width:100%;height:auto;border:0"></td><td valign="top" align="center" style="width:33%;padding:3px 0 3px 3px"><img class="asset" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/3f2ff739-5b6d-4484-ba6a-d552390794ba.png" width="600" alt="Benefício do cartão Bem Mais Afinz Visa" style="display:block;width:100%;height:auto;border:0"></td></tr></table></td></tr>%%[ ENDIF ]%%
%%[ IF @Sequencia == "E-mail 6" THEN ]%%<tr><td class="pad" style="padding:0 25px 10px">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr class="grid-row"><td valign="top" align="center" style="width:50%;padding:3px 3px 3px 0"><img class="asset" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/dd5bd72f-fba0-4ed0-a6a4-e9fa78758810.png" width="600" alt="Benefício do cartão Bem Mais Afinz Visa" style="display:block;width:100%;height:auto;border:0"></td><td valign="top" align="center" style="width:50%;padding:3px 0 3px 3px"><img class="asset" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/87c5c98f-c6dd-47e1-8522-7e4f67172d1b.png" width="600" alt="Benefício do cartão Bem Mais Afinz Visa" style="display:block;width:100%;height:auto;border:0"></td></tr></table></td></tr>%%[ ENDIF ]%%
%%[ IF @Sequencia == "E-mail 8" THEN ]%%<tr><td class="pad" style="padding:0 25px 10px">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr class="grid-row"><td valign="top" align="center" style="width:50%;padding:3px 3px 3px 0"><img class="asset" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/63c27266-d881-4e29-b256-fb6c3a2348ed.png" width="600" alt="Benefício do cartão Bem Mais Afinz Visa" style="display:block;width:100%;height:auto;border:0"></td><td valign="top" align="center" style="width:50%;padding:3px 0 3px 3px"><img class="asset" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/3f2ff739-5b6d-4484-ba6a-d552390794ba.png" width="600" alt="Benefício do cartão Bem Mais Afinz Visa" style="display:block;width:100%;height:auto;border:0"></td></tr></table></td></tr>%%[ ENDIF ]%%

%%[ IF @Sequencia == "E-mail 1" OR @Sequencia == "E-mail 2" OR @Sequencia == "E-mail 3" OR @Sequencia == "E-mail 4" OR @Sequencia == "E-mail 5" OR @Sequencia == "E-mail 7" THEN ]%%
%%[ IF NOT EMPTY(@TituloCTA1) AND NOT EMPTY(@LinkCTA1) THEN ]%%
<tr><td class="pad" align="center" style="padding:0 30px 6px">
<table role="presentation" border="0" cellspacing="0" cellpadding="0"><tr><td class="innertd buttonblock" bgcolor="#00C6CC" style="border-radius:5px;background-color:#00C6CC">
<a class="buttonstyles" href="%%=RedirectTo(TreatAsContent(@LinkCTA1))=%%" target="_blank" style="font-size:18px;font-family:Tahoma,Geneva,sans-serif;color:#000000;text-align:center;text-decoration:none;display:block;background-color:#00C6CC;border:0;padding:11px 20px;border-radius:5px">%%=TreatAsContent(@TituloCTA1)=%%</a>
</td></tr></table></td></tr>
<tr><td align="center" style="padding:0 30px 18px"><span style="font-size:11px;font-family:Tahoma,Geneva,sans-serif;color:#000000">Sujeito à análise de crédito</span></td></tr>
%%[ ENDIF ]%%
%%[ ENDIF ]%%

%%[ IF NOT EMPTY(@TituloCopy2) OR NOT EMPTY(@Copy2Preto) THEN ]%%
<tr><td class="pad" align="center" style="padding:10px 30px 12px;text-align:center">
%%[ IF NOT EMPTY(@TituloCopy2) THEN ]%%<div style="color:%%=v(@CorTituloCopy2)=%%;font-size:%%=v(@TamanhoFonteTituloCopy2)=%%px;font-family:Tahoma,Geneva,sans-serif;font-weight:bold;line-height:1.3;padding-bottom:8px">%%=TreatAsContent(@TituloCopy2)=%%</div>%%[ ENDIF ]%%
%%[ IF NOT EMPTY(@Copy2Preto) THEN ]%%<div class="body-copy" style="color:%%=v(@CorCopy2)=%%;font-size:%%=v(@TamanhoFonteCopy2)=%%px;font-family:Tahoma,Geneva,sans-serif;line-height:1.5">%%=TreatAsContent(@Copy2Preto)=%%</div>%%[ ENDIF ]%%
</td></tr>
%%[ ENDIF ]%%

%%[ IF @Sequencia == "E-mail 1" OR @Sequencia == "E-mail 6" THEN ]%%<tr><td class="pad" style="padding:0 25px 10px">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr class="grid-row"><td valign="top" align="center" style="width:33%;padding:3px 3px 3px 0"><img class="asset" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/ba613caa-444d-4954-acd0-1b151dada6ec.png" width="600" alt="Benefício do cartão Bem Mais Afinz Visa" style="display:block;width:100%;height:auto;border:0"></td><td valign="top" align="center" style="width:33%;padding:3px 0 3px 3px"><img class="asset" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/c392c8ff-b97f-4a86-8c56-df49ea5b2374.png" width="600" alt="Benefício do cartão Bem Mais Afinz Visa" style="display:block;width:100%;height:auto;border:0"></td><td valign="top" align="center" style="width:33%;padding:3px 0 3px 3px"><img class="asset" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/82ec3fce-c040-4f7a-b450-e96b9f062489.png" width="600" alt="Benefício do cartão Bem Mais Afinz Visa" style="display:block;width:100%;height:auto;border:0"></td></tr></table></td></tr>%%[ ENDIF ]%%
%%[ IF @Sequencia == "E-mail 3" THEN ]%%<tr><td class="pad" style="padding:0 25px 10px">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr class="grid-row"><td valign="top" align="center" style="width:33%;padding:3px 3px 3px 0"><img class="asset" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/b3063d8e-942f-497d-bd51-ad7754b5abe7.png" width="600" alt="Benefício do cartão Bem Mais Afinz Visa" style="display:block;width:100%;height:auto;border:0"></td><td valign="top" align="center" style="width:33%;padding:3px 0 3px 3px"><img class="asset" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/2f1fef6e-62d6-491a-8df1-fbea4eac2046.png" width="600" alt="Benefício do cartão Bem Mais Afinz Visa" style="display:block;width:100%;height:auto;border:0"></td><td valign="top" align="center" style="width:33%;padding:3px 0 3px 3px"><img class="asset" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/82ec3fce-c040-4f7a-b450-e96b9f062489.png" width="600" alt="Benefício do cartão Bem Mais Afinz Visa" style="display:block;width:100%;height:auto;border:0"></td></tr></table></td></tr>%%[ ENDIF ]%%
%%[ IF @Sequencia == "E-mail 2" THEN ]%%<tr><td class="pad" style="padding:0 25px 10px">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr class="grid-row"><td valign="top" align="center" style="width:50%;padding:3px 3px 3px 0"><img class="asset" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/82ec3fce-c040-4f7a-b450-e96b9f062489.png" width="600" alt="Benefício do cartão Bem Mais Afinz Visa" style="display:block;width:100%;height:auto;border:0"></td><td valign="top" align="center" style="width:50%;padding:3px 0 3px 3px"><img class="asset" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/c392c8ff-b97f-4a86-8c56-df49ea5b2374.png" width="600" alt="Benefício do cartão Bem Mais Afinz Visa" style="display:block;width:100%;height:auto;border:0"></td></tr></table></td></tr>%%[ ENDIF ]%%
%%[ IF @Sequencia == "E-mail 4" THEN ]%%<tr><td class="pad" style="padding:0 25px 10px">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr class="grid-row"><td valign="top" align="center" style="width:50%;padding:3px 3px 3px 0"><img class="asset" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/b3063d8e-942f-497d-bd51-ad7754b5abe7.png" width="600" alt="Benefício do cartão Bem Mais Afinz Visa" style="display:block;width:100%;height:auto;border:0"></td><td valign="top" align="center" style="width:50%;padding:3px 0 3px 3px"><img class="asset" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/2f1fef6e-62d6-491a-8df1-fbea4eac2046.png" width="600" alt="Benefício do cartão Bem Mais Afinz Visa" style="display:block;width:100%;height:auto;border:0"></td></tr></table></td></tr>%%[ ENDIF ]%%
%%[ IF @Sequencia == "E-mail 5" OR @Sequencia == "E-mail 7" OR @Sequencia == "E-mail 8" THEN ]%%<tr><td class="pad" style="padding:0 25px 10px">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr class="grid-row"><td valign="top" align="center" style="width:50%;padding:3px 3px 3px 0"><img class="asset" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/ba613caa-444d-4954-acd0-1b151dada6ec.png" width="600" alt="Benefício do cartão Bem Mais Afinz Visa" style="display:block;width:100%;height:auto;border:0"></td><td valign="top" align="center" style="width:50%;padding:3px 0 3px 3px"><img class="asset" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/c392c8ff-b97f-4a86-8c56-df49ea5b2374.png" width="600" alt="Benefício do cartão Bem Mais Afinz Visa" style="display:block;width:100%;height:auto;border:0"></td></tr></table></td></tr>%%[ ENDIF ]%%

%%[ IF @Sequencia == "E-mail 1" OR @Sequencia == "E-mail 2" OR @Sequencia == "E-mail 3" OR @Sequencia == "E-mail 5" THEN ]%%
%%[ IF NOT EMPTY(@TituloCTA1) AND NOT EMPTY(@LinkCTA1) THEN ]%%
<tr><td class="pad" align="center" style="padding:0 30px 6px">
<table role="presentation" border="0" cellspacing="0" cellpadding="0"><tr><td class="innertd buttonblock" bgcolor="#00C6CC" style="border-radius:5px;background-color:#00C6CC">
<a class="buttonstyles" href="%%=RedirectTo(TreatAsContent(@LinkCTA1))=%%" target="_blank" style="font-size:18px;font-family:Tahoma,Geneva,sans-serif;color:#000000;text-align:center;text-decoration:none;display:block;background-color:#00C6CC;border:0;padding:11px 20px;border-radius:5px">%%=TreatAsContent(@TituloCTA1)=%%</a>
</td></tr></table></td></tr>
<tr><td align="center" style="padding:0 30px 18px"><span style="font-size:11px;font-family:Tahoma,Geneva,sans-serif;color:#000000">Sujeito à análise de crédito</span></td></tr>
%%[ ENDIF ]%%
%%[ ENDIF ]%%
%%[ IF NOT EMPTY(@Banner1Corpo) THEN ]%%
<tr><td class="pad" align="center" style="padding:6px 25px 14px">
%%[ IF NOT EMPTY(@LinkBanner1) THEN ]%%<a href="%%=RedirectTo(TreatAsContent(@LinkBanner1))=%%" target="_blank">%%[ ENDIF ]%%
<img class="asset" src="%%=v(@Banner1Corpo)=%%" width="550" alt="Vantagens do cartão Bem Mais Afinz Visa" style="display:block;width:100%;max-width:550px;height:auto;border:0">
%%[ IF NOT EMPTY(@LinkBanner1) THEN ]%%</a>%%[ ENDIF ]%%
</td></tr>
%%[ ENDIF ]%%
%%[ IF NOT EMPTY(@Banner2Corpo) THEN ]%%
<tr><td class="pad" align="center" style="padding:6px 25px 14px">
%%[ IF NOT EMPTY(@LinkBanner2) THEN ]%%<a href="%%=RedirectTo(TreatAsContent(@LinkBanner2))=%%" target="_blank">%%[ ENDIF ]%%
<img class="asset" src="%%=v(@Banner2Corpo)=%%" width="550" alt="Vantagens do cartão Bem Mais Afinz Visa" style="display:block;width:100%;max-width:550px;height:auto;border:0">
%%[ IF NOT EMPTY(@LinkBanner2) THEN ]%%</a>%%[ ENDIF ]%%
</td></tr>
%%[ ENDIF ]%%
%%[ IF NOT EMPTY(@Banner3Corpo) THEN ]%%
<tr><td class="pad" align="center" style="padding:6px 25px 14px">
%%[ IF NOT EMPTY(@LinkBanner3) THEN ]%%<a href="%%=RedirectTo(TreatAsContent(@LinkBanner3))=%%" target="_blank">%%[ ENDIF ]%%
<img class="asset" src="%%=v(@Banner3Corpo)=%%" width="550" alt="Vantagens do cartão Bem Mais Afinz Visa" style="display:block;width:100%;max-width:550px;height:auto;border:0">
%%[ IF NOT EMPTY(@LinkBanner3) THEN ]%%</a>%%[ ENDIF ]%%
</td></tr>
%%[ ENDIF ]%%
%%[ IF NOT EMPTY(@TituloCTA2) AND NOT EMPTY(@LinkCTA2) THEN ]%%
<tr><td class="pad" align="center" style="padding:0 30px 6px">
<table role="presentation" border="0" cellspacing="0" cellpadding="0"><tr><td class="innertd buttonblock" bgcolor="#00C6CC" style="border-radius:5px;background-color:#00C6CC">
<a class="buttonstyles" href="%%=RedirectTo(TreatAsContent(@LinkCTA2))=%%" target="_blank" style="font-size:18px;font-family:Tahoma,Geneva,sans-serif;color:#000000;text-align:center;text-decoration:none;display:block;background-color:#00C6CC;border:0;padding:11px 20px;border-radius:5px">%%=TreatAsContent(@TituloCTA2)=%%</a>
</td></tr></table></td></tr>
<tr><td align="center" style="padding:0 30px 18px"><span style="font-size:11px;font-family:Tahoma,Geneva,sans-serif;color:#000000">Sujeito à análise de crédito</span></td></tr>
%%[ ENDIF ]%%

%%[ IF NOT EMPTY(@NotaLegal) THEN ]%%<tr><td class="pad" style="padding:18px 30px;color:%%=v(@CorNotaLegal)=%%;font-size:%%=v(@TamanhoFonteNotaLegal)=%%px;font-family:Tahoma,Geneva,sans-serif;line-height:1.45;text-align:justify">%%=TreatAsContent(@NotaLegal)=%%</td></tr>%%[ ENDIF ]%%

<tr><td align="center" style="padding:22px 20px 6px"><div style="color:#00c6cc;font-size:28px;font-family:Tahoma,Geneva,sans-serif;font-weight:bold">Afinz, juntos fazemos mais!</div></td></tr>
<tr><td align="center" style="padding:6px 30px 12px"><div style="color:#000000;font-size:11px;font-family:Tahoma,Geneva,sans-serif"><b>Curta a Afinz</b> nas redes sociais e fique por dentro de tudo que acontece por aqui</div></td></tr>
<tr><td align="center" style="padding:0 20px 16px"><table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr><td align="center" style="padding:0 5px"><a href="https://www.instagram.com/afinzoficial/" target="_blank"><img src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/b07a3e46-7c00-409b-81fe-c1b5eceebf64.png" width="31" alt="Instagram da Afinz" style="display:block;border:0"></a></td><td align="center" style="padding:0 5px"><a href="https://web.facebook.com/Afinz" target="_blank"><img src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/8f2daf4e-a386-471d-bc7b-aea7a6c8c416.png" width="30" alt="Facebook da Afinz" style="display:block;border:0"></a></td><td align="center" style="padding:0 5px"><a href="https://www.tiktok.com/@afinzoficial" target="_blank"><img src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/31227d6c-28bc-41b4-8b27-c64795765698.png" width="30" alt="TikTok da Afinz" style="display:block;border:0"></a></td><td align="center" style="padding:0 5px"><a href="https://afinz.com.br/blog/" target="_blank"><img src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/f37dd205-17fa-47d9-a98a-4f538ef8d637.png" width="30" alt="Blog da Afinz" style="display:block;border:0"></a></td><td align="center" style="padding:0 5px"><a href="https://afinz.com.br/" target="_blank"><img src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/ef14c352-0006-411d-b873-9b35c7dffde9.png" width="31" alt="Site da Afinz" style="display:block;border:0"></a></td></tr></table></td></tr>
<tr><td align="center" style="padding:0 20px 18px"><a href="https://afinz.com.br/" target="_blank"><img src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/787eb5c7-39ee-4b30-987a-0a81a38241a3.png" width="90" alt="Afinz" style="display:block;border:0"></a></td></tr>

<tr><td align="center" style="padding:14px 30px;background:#000000"><div style="color:#ffffff;font-size:12px;font-family:Tahoma,Geneva,sans-serif;line-height:1.55">Por favor, não responda esse e-mail.<br>Essa é uma mensagem automática e não conseguimos te atender por aqui.</div></td></tr>
<tr><td align="center" style="padding:10px 30px;background:#000000"><div style="color:#ffffff;font-size:12px;font-family:Tahoma,Geneva,sans-serif;line-height:1.55"><b>Canal de atendimento:</b><br><br><b>Ouvidoria</b><br>0800 772 0602</div></td></tr>
%%[ IF NOT EMPTY(@Rodape) THEN ]%%<tr><td align="center" style="padding:0 30px 10px;background:#000000"><div style="color:#d1d5db;font-size:11px;font-family:Tahoma,Geneva,sans-serif;line-height:1.45">%%=TreatAsContent(@Rodape)=%%</div></td></tr>%%[ ENDIF ]%%
<tr><td align="center" style="padding:15px 30px;background:#000000"><div style="color:#ffffff;font-size:12px;font-family:Tahoma,Geneva,sans-serif;line-height:1.55">Enviado por <b>Banco Afinz S.A - Banco Múltiplo - CNPJ: 04.814.563/0001-74 | Afinz Instituição de Pagamento S.A - CNPJ: 60.114.865/0001-00</b><br>Rua XV de novembro, 45 - Sorocaba, SP</div></td></tr>

</table></td></tr></table></body></html>$bembarato$, false, 'active', 1)
on conflict (id) do update set
  name = excluded.name, source = excluded.source, status = 'active',
  version = public.dynamic_email_template_slots.version + 1, updated_at = now();

with variants(sequence_no, week_no, briefing_data) as (values
    (1, 1, '{"DT_INICIO": "2026-09-08T00:00", "DT_FIM": "2026-12-31T23:59", "UTM_CAMPANHA": "BEM_BARATO_CRM_SEMANA1_EMAIL1", "TP_CAMPANHA": "CRM", "SEQUENCIA": "E-mail 1", "ASSUNTO": "Faça mais com seu cartão Bem Mais Afinz Visa!", "PRE_CABECALHO": "Ganhe até R$100 Créditos Vibe na sua primeira compra com o cartão Bem Mais.", "HEADER": "https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/c1507c27-066c-4b04-9c5a-49385cb343e8.png", "CARTAO_NM_COMERCIAL": "Bem Mais Afinz Visa", "NM_PRODUTO_INTERNO": "BEM BARATO", "TITULO_COPY_1_AZUL": "Todos os benefícios que você precisa em um cartão!", "COR_COPY_1": "#00C6CC", "TAMANHO_DA_FONTE_TITULO_COPY_1": "24", "TITULO_CTA_1": "Pedir meu cartão", "LINK_CTA_1": "https://cartao-bem-mais.onelink.me/dJ0j/qcqop5rh?c=bb_topo_de_funil_vibe&af_sub1=crm&af_sub2=s1&af_sub3=bb_email_vibe_bsp_S1D01", "COPY_1_PRETO": "<b>Olá, %%=v(@FirstName)=%%</b><br><br>Quer fazer mais? Com o <b>cartão Bem Mais Afinz Visa</b> você <b>economiza</b> nas compras nos <b>Supermercados Bem Barato</b> e ainda <b>ganha até R$100 Créditos Vibe!</b>", "COR_COPY_PRETO_1": "#000000", "TAMANHO_DA_FONTE_TITULO_COPY_PRETO_1": "19", "TITULO_COPY_2": "E não para por aí!", "COR_TITULO_COPY_2": "#00C6CC", "TAMANHO_DA_FONTE_TITULO_COPY_2": "22", "COPY_2_PRETO": "Com o <b>cartão Bem Mais Afinz Visa</b> você ganha créditos Vibe e ainda concorre a <b>R$100 MIL todo mês!</b>", "COR_COPY_2": "#000000", "TAMANHO_DA_FONTE_COPY_2": "19", "TITULO_CTA_2": "Pedir meu cartão", "LINK_CTA_2": "https://cartao-bem-mais.onelink.me/dJ0j/qcqop5rh?c=bb_topo_de_funil_vibe&af_sub1=crm&af_sub2=s1&af_sub3=bb_email_vibe_bsp_S1D01", "BANNER_1_CORPO": "https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/e31039cf-fa85-41b7-bf16-9cbccacaaf10.gif", "LINK_BANNER_1_CORPO": "https://cartao-bem-mais.onelink.me/dJ0j/qcqop5rh?c=bb_topo_de_funil_vibe&af_sub1=crm&af_sub2=s1&af_sub3=bb_email_vibe_bsp_S1D01", "BANNER_2_CORPO": "", "LINK_BANNER_2_CORPO": "", "BANNER_3_CORPO": "", "LINK_BANNER_3_CORPO": "", "NOTA_LEGAL": "*Sujeito à aprovação de crédito. Consulte termos e condições em: grupobemmais.com.br/cartao. Após realizar a primeira compra com o seu cartão com anuidade ativa, independentemente do valor, você receberá em até 5 dias úteis R$ 100 em créditos no App Vibe, com validade de até 6 meses. Para visualizar o seu saldo, baixe o App Vibe. A primeira compra deverá ser realizada em até 30 dias. / A cada fatura paga, com anuidade ativa, você receberá mais créditos no App Vibe, conforme condições da loja parceira, também com validade de até 6 meses. Os benefícios acumulados no app da Vibe podem ser trocados por descontos e vantagens das marcas parceiras. Eles são dinâmicos e podem ser alterados ou apresentados conforme as regras de elegibilidade de cada fornecedor parceiro. / Consulte o regulamento completo no app da Vibe. Promoção válida por tempo limitado, podendo ser alterada ou encerrada a qualquer momento, sem aviso prévio. / Sujeito a disponibilidade.", "COR_NOTA_LEGAL": "#999999", "TAMANHO_DA_FONTE_NOTA_LEGAL": "9", "RODAPE": ""}'::jsonb),
    (2, 1, '{"DT_INICIO": "2026-09-08T00:00", "DT_FIM": "2026-12-31T23:59", "UTM_CAMPANHA": "BEM_BARATO_CRM_SEMANA1_EMAIL2", "TP_CAMPANHA": "CRM", "SEQUENCIA": "E-mail 2", "ASSUNTO": "Ganhe créditos Vibe para fazer mais no fim de semana!", "PRE_CABECALHO": "Peça seu cartão Bem Mais Afinz Visa e concorra a R$100 MIL todo mês.", "HEADER": "https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/d219d9c3-8a3b-43fb-bc4e-ccf2b77bb24c.png", "CARTAO_NM_COMERCIAL": "Bem Mais Afinz Visa", "NM_PRODUTO_INTERNO": "BEM BARATO", "TITULO_COPY_1_AZUL": "São muitas vantagens:", "COR_COPY_1": "#00C6CC", "TAMANHO_DA_FONTE_TITULO_COPY_1": "24", "TITULO_CTA_1": "Pedir meu cartão", "LINK_CTA_1": "https://cartao-bem-mais.onelink.me/dJ0j/qcqop5rh?c=bb_topo_de_funil_vibe&af_sub1=crm&af_sub2=s1&af_sub3=bb_email_vibe_bsp_S1D02", "COPY_1_PRETO": "<b>Olá, %%=v(@FirstName)=%%</b><br><br>Com o <b>cartão Bem Mais Afinz Visa</b>, você faz suas compras no <b>Supermercado Bem Barato</b>, e ainda <b>ganha créditos Vibe</b> para fazer mais no fim de semana!", "COR_COPY_PRETO_1": "#000000", "TAMANHO_DA_FONTE_TITULO_COPY_PRETO_1": "19", "TITULO_COPY_2": "E tem mais:", "COR_TITULO_COPY_2": "#00C6CC", "TAMANHO_DA_FONTE_TITULO_COPY_2": "22", "COPY_2_PRETO": "com o <b>cartão Bem Mais Afinz Visa</b> você <b>ganha créditos Vibe!</b>", "COR_COPY_2": "#000000", "TAMANHO_DA_FONTE_COPY_2": "19", "TITULO_CTA_2": "Pedir meu cartão", "LINK_CTA_2": "https://cartao-bem-mais.onelink.me/dJ0j/qcqop5rh?c=bb_topo_de_funil_vibe&af_sub1=crm&af_sub2=s1&af_sub3=bb_email_vibe_bsp_S1D02", "BANNER_1_CORPO": "https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/37f56012-cd80-455f-a6d0-248c321cc7e2.gif", "LINK_BANNER_1_CORPO": "", "BANNER_2_CORPO": "https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/02901600-5c44-4f6e-a4a2-2bae56c2f8d2.png", "LINK_BANNER_2_CORPO": "https://cartao-bem-mais.onelink.me/dJ0j/qcqop5rh?c=bb_topo_de_funil_vibe&af_sub1=crm&af_sub2=s1&af_sub3=bb_email_vibe_bsp_S1D02", "BANNER_3_CORPO": "", "LINK_BANNER_3_CORPO": "", "NOTA_LEGAL": "*Sujeito à aprovação de crédito. Consulte termos e condições em: grupobemmais.com.br/cartao. Após realizar a primeira compra com o seu cartão com anuidade ativa, independentemente do valor, você receberá em até 5 dias úteis R$ 100 em créditos no App Vibe, com validade de até 6 meses. Para visualizar o seu saldo, baixe o App Vibe. A primeira compra deverá ser realizada em até 30 dias. / A cada fatura paga, com anuidade ativa, você receberá mais créditos no App Vibe, conforme condições da loja parceira, também com validade de até 6 meses. Os benefícios acumulados no app da Vibe podem ser trocados por descontos e vantagens das marcas parceiras. Eles são dinâmicos e podem ser alterados ou apresentados conforme as regras de elegibilidade de cada fornecedor parceiro. / Consulte o regulamento completo no app da Vibe. Promoção válida por tempo limitado, podendo ser alterada ou encerrada a qualquer momento, sem aviso prévio. / Sujeito a disponibilidade.", "COR_NOTA_LEGAL": "#999999", "TAMANHO_DA_FONTE_NOTA_LEGAL": "9", "RODAPE": ""}'::jsonb),
    (3, 2, '{"DT_INICIO": "2026-09-08T00:00", "DT_FIM": "2026-12-31T23:59", "UTM_CAMPANHA": "BEM_BARATO_CRM_SEMANA2_EMAIL3", "TP_CAMPANHA": "CRM", "SEQUENCIA": "E-mail 3", "ASSUNTO": "Peça seu cartão Bem Mais Afinz Visa e faça mais. Aproveite!", "PRE_CABECALHO": "Ganhe até R$100 Créditos Vibe na sua primeira compra com o cartão Bem Mais.", "HEADER": "https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/d305678a-9c9d-41a7-8438-75dd23dfeba3.png", "CARTAO_NM_COMERCIAL": "Bem Mais Afinz Visa", "NM_PRODUTO_INTERNO": "BEM BARATO", "TITULO_COPY_1_AZUL": "Mais benefícios para o seu dia a dia, em um cartão só.", "COR_COPY_1": "#00C6CC", "TAMANHO_DA_FONTE_TITULO_COPY_1": "24", "TITULO_CTA_1": "Pedir meu cartão", "LINK_CTA_1": "https://cartao-bem-mais.onelink.me/dJ0j/qcqop5rh?c=bb_topo_de_funil_vibe&af_sub1=crm&af_sub2=s2&af_sub3=bb_email_vibe_bsp_S2D01", "COPY_1_PRETO": "<b>Olá, %%=v(@FirstName)=%%!</b><br><br>Com o <b>cartão Bem Mais Afinz Visa</b> suas compras viram <b>vantagens</b>, peça agora e tenha descontos exclusivos!", "COR_COPY_PRETO_1": "#000000", "TAMANHO_DA_FONTE_TITULO_COPY_PRETO_1": "19", "TITULO_COPY_2": "E não para por aí!", "COR_TITULO_COPY_2": "#00C6CC", "TAMANHO_DA_FONTE_TITULO_COPY_2": "22", "COPY_2_PRETO": "Com o <b>cartão Bem Mais Afinz Visa</b> você ganha Créditos Vibe e ainda concorre a <b>R$100 mil todo mês!</b>", "COR_COPY_2": "#000000", "TAMANHO_DA_FONTE_COPY_2": "19", "TITULO_CTA_2": "Pedir meu cartão", "LINK_CTA_2": "https://cartao-bem-mais.onelink.me/dJ0j/qcqop5rh?c=bb_topo_de_funil_vibe&af_sub1=crm&af_sub2=s2&af_sub3=bb_email_vibe_bsp_S2D01", "BANNER_1_CORPO": "https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/e31039cf-fa85-41b7-bf16-9cbccacaaf10.gif", "LINK_BANNER_1_CORPO": "", "BANNER_2_CORPO": "", "LINK_BANNER_2_CORPO": "", "BANNER_3_CORPO": "", "LINK_BANNER_3_CORPO": "", "NOTA_LEGAL": "*Sujeito à aprovação de crédito. Consulte termos e condições em: grupobemmais.com.br/cartao. Após realizar a primeira compra com o seu cartão com anuidade ativa, independentemente do valor, você receberá em até 5 dias úteis R$ 100 em créditos no App Vibe, com validade de até 6 meses. Para visualizar o seu saldo, baixe o App Vibe. A primeira compra deverá ser realizada em até 30 dias. / A cada fatura paga, com anuidade ativa, você receberá mais créditos no App Vibe, conforme condições da loja parceira, também com validade de até 6 meses. Os benefícios acumulados no app da Vibe podem ser trocados por descontos e vantagens das marcas parceiras. Eles são dinâmicos e podem ser alterados ou apresentados conforme as regras de elegibilidade de cada fornecedor parceiro. / Consulte o regulamento completo no app da Vibe. Promoção válida por tempo limitado, podendo ser alterada ou encerrada a qualquer momento, sem aviso prévio. / Sujeito a disponibilidade.", "COR_NOTA_LEGAL": "#999999", "TAMANHO_DA_FONTE_NOTA_LEGAL": "9", "RODAPE": ""}'::jsonb),
    (4, 2, '{"DT_INICIO": "2026-09-08T00:00", "DT_FIM": "2026-12-31T23:59", "UTM_CAMPANHA": "BEM_BARATO_CRM_SEMANA2_EMAIL4", "TP_CAMPANHA": "CRM", "SEQUENCIA": "E-mail 4", "ASSUNTO": "Transforme suas compras em vantagens com o cartão Bem Mais Afinz Visa!", "PRE_CABECALHO": "Benefícios e descontos exclusivos que facilitam o seu dia a dia.", "HEADER": "https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/5200206c-bd6a-42ff-bed3-be676bb49565.png", "CARTAO_NM_COMERCIAL": "Bem Mais Afinz Visa", "NM_PRODUTO_INTERNO": "BEM BARATO", "TITULO_COPY_1_AZUL": "Confira:", "COR_COPY_1": "#00C6CC", "TAMANHO_DA_FONTE_TITULO_COPY_1": "24", "TITULO_CTA_1": "Pedir meu cartão", "LINK_CTA_1": "https://cartao-bem-mais.onelink.me/dJ0j/qcqop5rh?c=bb_topo_de_funil_vibe&af_sub1=crm&af_sub2=s2&af_sub3=bb_email_vibe_bsp_S2D02", "COPY_1_PRETO": "<b>Olá, %%=v(@FirstName)=%%!</b><br><br>Com o <b>cartão Bem Mais Afinz Visa</b>, você faz suas compras, aproveita benefícios exclusivos e ganha Créditos Vibe para fazer mais!", "COR_COPY_PRETO_1": "#000000", "TAMANHO_DA_FONTE_TITULO_COPY_PRETO_1": "19", "TITULO_COPY_2": "Aproveite seus Créditos Vibe em +250 marcas!", "COR_TITULO_COPY_2": "#00C6CC", "TAMANHO_DA_FONTE_TITULO_COPY_2": "22", "COPY_2_PRETO": "Peça seu cartão e aproveite todos os benefícios onde estiver!", "COR_COPY_2": "#000000", "TAMANHO_DA_FONTE_COPY_2": "19", "TITULO_CTA_2": "Pedir meu cartão", "LINK_CTA_2": "https://cartao-bem-mais.onelink.me/dJ0j/qcqop5rh?c=bb_topo_de_funil_vibe&af_sub1=crm&af_sub2=s2&af_sub3=bb_email_vibe_bsp_S2D02", "BANNER_1_CORPO": "https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/02901600-5c44-4f6e-a4a2-2bae56c2f8d2.png", "LINK_BANNER_1_CORPO": "https://cartao-bem-mais.onelink.me/dJ0j/qcqop5rh?c=bb_topo_de_funil_vibe&af_sub1=crm&af_sub2=s2&af_sub3=bb_email_vibe_bsp_S2D02", "BANNER_2_CORPO": "", "LINK_BANNER_2_CORPO": "", "BANNER_3_CORPO": "", "LINK_BANNER_3_CORPO": "", "NOTA_LEGAL": "*Sujeito à aprovação de crédito. Consulte termos e condições em: grupobemmais.com.br/cartao. Após realizar a primeira compra com o seu cartão com anuidade ativa, independentemente do valor, você receberá em até 5 dias úteis R$ 100 em créditos no App Vibe, com validade de até 6 meses. Para visualizar o seu saldo, baixe o App Vibe. A primeira compra deverá ser realizada em até 30 dias. / A cada fatura paga, com anuidade ativa, você receberá mais créditos no App Vibe, conforme condições da loja parceira, também com validade de até 6 meses. Os benefícios acumulados no app da Vibe podem ser trocados por descontos e vantagens das marcas parceiras. Eles são dinâmicos e podem ser alterados ou apresentados conforme as regras de elegibilidade de cada fornecedor parceiro. / Consulte o regulamento completo no app da Vibe. Promoção válida por tempo limitado, podendo ser alterada ou encerrada a qualquer momento, sem aviso prévio. / Sujeito a disponibilidade.", "COR_NOTA_LEGAL": "#999999", "TAMANHO_DA_FONTE_NOTA_LEGAL": "9", "RODAPE": ""}'::jsonb),
    (5, 3, '{"DT_INICIO": "2026-09-08T00:00", "DT_FIM": "2026-12-31T23:59", "UTM_CAMPANHA": "BEM_BARATO_CRM_SEMANA3_EMAIL5", "TP_CAMPANHA": "CRM", "SEQUENCIA": "E-mail 5", "ASSUNTO": "Ganhe Créditos Vibe com o seu Cartão Bem Mais Afinz Visa!", "PRE_CABECALHO": "Garanta DESCONTOS exclusivos no App Vibe. Peça já o seu!", "HEADER": "https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/96f926ae-97d9-4f72-a570-faa9bf29ce67.png", "CARTAO_NM_COMERCIAL": "Bem Mais Afinz Visa", "NM_PRODUTO_INTERNO": "BEM BARATO", "TITULO_COPY_1_AZUL": "Não perca os descontos exclusivos:", "COR_COPY_1": "#00C6CC", "TAMANHO_DA_FONTE_TITULO_COPY_1": "24", "TITULO_CTA_1": "PEÇA JÁ O SEU", "LINK_CTA_1": "https://cartao-bem-mais.onelink.me/dJ0j/qcqop5rh?c=bb_topo_de_funil_vibe&af_sub1=crm&af_sub2=s3&af_sub3=bb_email_vibe_bsp_S3D01", "COPY_1_PRETO": "<b>Olá, %%=v(@FirstName)=%%</b><br><br>Com o <b>cartão Bem Mais Afinz Visa</b>, suas compras viram vantagens!", "COR_COPY_PRETO_1": "#000000", "TAMANHO_DA_FONTE_TITULO_COPY_PRETO_1": "19", "TITULO_COPY_2": "E não para por aí:", "COR_TITULO_COPY_2": "#00C6CC", "TAMANHO_DA_FONTE_TITULO_COPY_2": "22", "COPY_2_PRETO": "com o <b>cartão Bem Mais Afinz Visa</b> você ainda ganha Créditos Vibe.<br><br>Não vai perder, né? Peça já o seu cartão Bem Mais e veja suas compras virarem vantagens.", "COR_COPY_2": "#000000", "TAMANHO_DA_FONTE_COPY_2": "19", "TITULO_CTA_2": "Pedir meu cartão", "LINK_CTA_2": "https://cartao-bem-mais.onelink.me/dJ0j/qcqop5rh?c=bb_topo_de_funil_vibe&af_sub1=crm&af_sub2=s3&af_sub3=bb_email_vibe_bsp_S3D01", "BANNER_1_CORPO": "https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/b68e83ed-3ce4-4337-a2cf-a0f72cf6529a.png", "LINK_BANNER_1_CORPO": "", "BANNER_2_CORPO": "https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/ea13cca4-e778-41d9-b346-bfdc9d148bad.png", "LINK_BANNER_2_CORPO": "", "BANNER_3_CORPO": "", "LINK_BANNER_3_CORPO": "", "NOTA_LEGAL": "*Sujeito à aprovação de crédito. Consulte termos e condições em: grupobemmais.com.br/cartao. Após realizar a primeira compra com o seu cartão com anuidade ativa, independentemente do valor, você receberá em até 5 dias úteis R$ 100 em créditos no App Vibe, com validade de até 6 meses. Para visualizar o seu saldo, baixe o App Vibe. A primeira compra deverá ser realizada em até 30 dias. / A cada fatura paga, com anuidade ativa, você receberá mais créditos no App Vibe, conforme condições da loja parceira, também com validade de até 6 meses. Os benefícios acumulados no app da Vibe podem ser trocados por descontos e vantagens das marcas parceiras. Eles são dinâmicos e podem ser alterados ou apresentados conforme as regras de elegibilidade de cada fornecedor parceiro. / Consulte o regulamento completo no app da Vibe. Promoção válida por tempo limitado, podendo ser alterada ou encerrada a qualquer momento, sem aviso prévio. / Sujeito a disponibilidade.", "COR_NOTA_LEGAL": "#999999", "TAMANHO_DA_FONTE_NOTA_LEGAL": "9", "RODAPE": ""}'::jsonb),
    (6, 3, '{"DT_INICIO": "2026-09-08T00:00", "DT_FIM": "2026-12-31T23:59", "UTM_CAMPANHA": "BEM_BARATO_CRM_SEMANA3_EMAIL6", "TP_CAMPANHA": "CRM", "SEQUENCIA": "E-mail 6", "ASSUNTO": "Faça mais no supermercado com o seu cartão Bem Mais Afinz Visa!", "PRE_CABECALHO": "Ganhe até R$100 em Créditos Vibe na 1ª compra. Aproveite!", "HEADER": "https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/fabe966e-3e89-4789-8a66-5b5e98f4aa8f.png", "CARTAO_NM_COMERCIAL": "Bem Mais Afinz Visa", "NM_PRODUTO_INTERNO": "BEM BARATO", "TITULO_COPY_1_AZUL": "Confira todos os benefícios que o cartão Bem Mais Afinz Visa garante para você:", "COR_COPY_1": "#00C6CC", "TAMANHO_DA_FONTE_TITULO_COPY_1": "24", "TITULO_CTA_1": "Quero meu cartão", "LINK_CTA_1": "https://cartao-bem-mais.onelink.me/dJ0j/qcqop5rh?c=bb_topo_de_funil_vibe&af_sub1=crm&af_sub2=s3&af_sub3=bb_email_vibe_bsp_S3D02", "COPY_1_PRETO": "<b>Olá, %%=v(@FirstName)=%%</b><br><br>Com seu <b>cartão Bem Mais Afinz Visa</b>, você conta com vantagens exclusivas para aproveitar suas compras, trocar benefícios e fazer mais no seu dia a dia.", "COR_COPY_PRETO_1": "#000000", "TAMANHO_DA_FONTE_TITULO_COPY_PRETO_1": "19", "TITULO_COPY_2": "E não para por aí:", "COR_TITULO_COPY_2": "#00C6CC", "TAMANHO_DA_FONTE_TITULO_COPY_2": "22", "COPY_2_PRETO": "com o <b>cartão Bem Mais Afinz Visa</b> você ainda ganha Créditos Vibe exclusivos.<br><br>Aproveite descontos em diversas marcas direto no App Vibe.", "COR_COPY_2": "#000000", "TAMANHO_DA_FONTE_COPY_2": "19", "TITULO_CTA_2": "Pedir meu cartão", "LINK_CTA_2": "https://cartao-bem-mais.onelink.me/dJ0j/qcqop5rh?c=bb_topo_de_funil_vibe&af_sub1=crm&af_sub2=s3&af_sub3=bb_email_vibe_bsp_S3D02", "BANNER_1_CORPO": "https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/710a8574-9b6e-4fb5-87dc-975f4b7f5293.png", "LINK_BANNER_1_CORPO": "", "BANNER_2_CORPO": "", "LINK_BANNER_2_CORPO": "", "BANNER_3_CORPO": "", "LINK_BANNER_3_CORPO": "", "NOTA_LEGAL": "*Sujeito à aprovação de crédito. Consulte termos e condições em: grupobemmais.com.br/cartao. Após realizar a primeira compra com o seu cartão com anuidade ativa, independentemente do valor, você receberá em até 5 dias úteis R$ 100 em créditos no App Vibe, com validade de até 6 meses. Para visualizar o seu saldo, baixe o App Vibe. A primeira compra deverá ser realizada em até 30 dias. / A cada fatura paga, com anuidade ativa, você receberá mais créditos no App Vibe, conforme condições da loja parceira, também com validade de até 6 meses. Os benefícios acumulados no app da Vibe podem ser trocados por descontos e vantagens das marcas parceiras. Eles são dinâmicos e podem ser alterados ou apresentados conforme as regras de elegibilidade de cada fornecedor parceiro. / Consulte o regulamento completo no app da Vibe. Promoção válida por tempo limitado, podendo ser alterada ou encerrada a qualquer momento, sem aviso prévio. / Sujeito a disponibilidade.", "COR_NOTA_LEGAL": "#999999", "TAMANHO_DA_FONTE_NOTA_LEGAL": "9", "RODAPE": ""}'::jsonb),
    (7, 4, '{"DT_INICIO": "2026-09-08T00:00", "DT_FIM": "2026-12-31T23:59", "UTM_CAMPANHA": "BEM_BARATO_CRM_SEMANA4_EMAIL7", "TP_CAMPANHA": "CRM", "SEQUENCIA": "E-mail 7", "ASSUNTO": "Ainda dá tempo de aproveitar os benefícios com o cartão Bem Mais Afinz Visa!", "PRE_CABECALHO": "Garanta já seu cartão Bem Mais e ganhe até R$100 em Créditos Vibe.", "HEADER": "https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/450aeaa3-29b1-4d64-824f-583c8bff6d3e.png", "CARTAO_NM_COMERCIAL": "Bem Mais Afinz Visa", "NM_PRODUTO_INTERNO": "BEM BARATO", "TITULO_COPY_1_AZUL": "Confira os benefícios exclusivos:", "COR_COPY_1": "#00C6CC", "TAMANHO_DA_FONTE_TITULO_COPY_1": "24", "TITULO_CTA_1": "Pedir meu cartão", "LINK_CTA_1": "https://cartao-bem-mais.onelink.me/dJ0j/qcqop5rh?c=bb_topo_de_funil_vibe&af_sub1=crm&af_sub2=s4&af_sub3=bb_email_vibe_bsp_S4D01", "COPY_1_PRETO": "<b>Olá, %%=v(@FirstName)=%%</b><br><br>Ainda não pediu seu <b>cartão Bem Mais Afinz Visa</b>? Aproveite a chance de fazer mais nas compras!", "COR_COPY_PRETO_1": "#000000", "TAMANHO_DA_FONTE_TITULO_COPY_PRETO_1": "19", "TITULO_COPY_2": "Não perca a chance de aproveitar os CRÉDITOS exclusivos", "COR_TITULO_COPY_2": "#00C6CC", "TAMANHO_DA_FONTE_TITULO_COPY_2": "22", "COPY_2_PRETO": "para comprar nas <b>melhores marcas</b>, direto no app da Vibe!<br><br>Garanta já o seu cartão Bem Mais Afinz Visa e aproveite as vantagens.", "COR_COPY_2": "#000000", "TAMANHO_DA_FONTE_COPY_2": "19", "TITULO_CTA_2": "Pedir meu cartão", "LINK_CTA_2": "https://cartao-bem-mais.onelink.me/dJ0j/qcqop5rh?c=bb_topo_de_funil_vibe&af_sub1=crm&af_sub2=s4&af_sub3=bb_email_vibe_bsp_S4D01", "BANNER_1_CORPO": "", "LINK_BANNER_1_CORPO": "", "BANNER_2_CORPO": "", "LINK_BANNER_2_CORPO": "", "BANNER_3_CORPO": "", "LINK_BANNER_3_CORPO": "", "NOTA_LEGAL": "*Sujeito à aprovação de crédito. Consulte termos e condições em: grupobemmais.com.br/cartao. Após realizar a primeira compra com o seu cartão com anuidade ativa, independentemente do valor, você receberá em até 5 dias úteis R$ 100 em créditos no App Vibe, com validade de até 6 meses. Para visualizar o seu saldo, baixe o App Vibe. A primeira compra deverá ser realizada em até 30 dias. / A cada fatura paga, com anuidade ativa, você receberá mais créditos no App Vibe, conforme condições da loja parceira, também com validade de até 6 meses. Os benefícios acumulados no app da Vibe podem ser trocados por descontos e vantagens das marcas parceiras. Eles são dinâmicos e podem ser alterados ou apresentados conforme as regras de elegibilidade de cada fornecedor parceiro. / Consulte o regulamento completo no app da Vibe. Promoção válida por tempo limitado, podendo ser alterada ou encerrada a qualquer momento, sem aviso prévio. / Sujeito a disponibilidade.", "COR_NOTA_LEGAL": "#999999", "TAMANHO_DA_FONTE_NOTA_LEGAL": "9", "RODAPE": ""}'::jsonb),
    (8, 4, '{"DT_INICIO": "2026-09-08T00:00", "DT_FIM": "2026-12-31T23:59", "UTM_CAMPANHA": "BEM_BARATO_CRM_SEMANA4_EMAIL8", "TP_CAMPANHA": "CRM", "SEQUENCIA": "E-mail 8", "ASSUNTO": "ÚLTIMA CHANCE: Peça o seu novo cartão Bem Mais Afinz Visa!", "PRE_CABECALHO": "Aproveite descontos em +250 marcas com seus Créditos Vibe.", "HEADER": "https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/b81ea66d-b8f9-488b-92d3-7fd2ea770b9e.png", "CARTAO_NM_COMERCIAL": "Bem Mais Afinz Visa", "NM_PRODUTO_INTERNO": "BEM BARATO", "TITULO_COPY_1_AZUL": "Aproveite todos os benefícios exclusivos do cartão Bem Mais Afinz Visa para você:", "COR_COPY_1": "#00C6CC", "TAMANHO_DA_FONTE_TITULO_COPY_1": "24", "TITULO_CTA_1": "Pedir o meu cartão", "LINK_CTA_1": "https://cartao-bem-mais.onelink.me/dJ0j/qcqop5rh?c=bb_topo_de_funil_vibe&af_sub1=crm&af_sub2=s4&af_sub3=bb_email_vibe_bsp_S4D02", "COPY_1_PRETO": "<b>Olá, %%=v(@FirstName)=%%</b><br><br><b>Última chance</b> de garantir todos os benefícios do <b>cartão Bem Mais Afinz Visa</b> e fazer o seu dinheiro render mais!", "COR_COPY_PRETO_1": "#000000", "TAMANHO_DA_FONTE_TITULO_COPY_PRETO_1": "19", "TITULO_COPY_2": "Com o cartão Bem Mais Afinz Visa você tem benefícios exclusivos no App Vibe. Aproveite:", "COR_TITULO_COPY_2": "#00C6CC", "TAMANHO_DA_FONTE_TITULO_COPY_2": "22", "COPY_2_PRETO": "Você também tem descontos incríveis nas melhores marcas no app Vibe!", "COR_COPY_2": "#000000", "TAMANHO_DA_FONTE_COPY_2": "19", "TITULO_CTA_2": "Quero meu cartão", "LINK_CTA_2": "https://cartao-bem-mais.onelink.me/dJ0j/qcqop5rh?c=bb_topo_de_funil_vibe&af_sub1=crm&af_sub2=s4&af_sub3=bb_email_vibe_bsp_S4D02", "BANNER_1_CORPO": "https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/3e38098a-3f02-4a87-b4d0-6c62cdaa2e5e.png", "LINK_BANNER_1_CORPO": "", "BANNER_2_CORPO": "https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/4a36a1a8-9294-48f7-b68d-7ea90723f469.png", "LINK_BANNER_2_CORPO": "", "BANNER_3_CORPO": "", "LINK_BANNER_3_CORPO": "", "NOTA_LEGAL": "*Sujeito à aprovação de crédito. Consulte termos e condições em: grupobemmais.com.br/cartao. Após realizar a primeira compra com o seu cartão com anuidade ativa, independentemente do valor, você receberá em até 5 dias úteis R$ 100 em créditos no App Vibe, com validade de até 6 meses. Para visualizar o seu saldo, baixe o App Vibe. A primeira compra deverá ser realizada em até 30 dias. / A cada fatura paga, com anuidade ativa, você receberá mais créditos no App Vibe, conforme condições da loja parceira, também com validade de até 6 meses. Os benefícios acumulados no app da Vibe podem ser trocados por descontos e vantagens das marcas parceiras. Eles são dinâmicos e podem ser alterados ou apresentados conforme as regras de elegibilidade de cada fornecedor parceiro. / Consulte o regulamento completo no app da Vibe. Promoção válida por tempo limitado, podendo ser alterada ou encerrada a qualquer momento, sem aviso prévio. / Sujeito a disponibilidade.", "COR_NOTA_LEGAL": "#999999", "TAMANHO_DA_FONTE_NOTA_LEGAL": "9", "RODAPE": ""}'::jsonb)
), prepared as (
  select sequence_no, week_no, briefing_data,
    (substr(md5('bem-barato-crm-'||sequence_no),1,8)||'-'||substr(md5('bem-barato-crm-'||sequence_no),9,4)
     ||'-4'||substr(md5('bem-barato-crm-'||sequence_no),14,3)||'-8'||substr(md5('bem-barato-crm-'||sequence_no),18,3)
     ||'-'||substr(md5('bem-barato-crm-'||sequence_no),21,12))::uuid as briefing_id,
    (substr(md5('bem-barato-crm-group-'||sequence_no),1,8)||'-'||substr(md5('bem-barato-crm-group-'||sequence_no),9,4)
     ||'-4'||substr(md5('bem-barato-crm-group-'||sequence_no),14,3)||'-8'||substr(md5('bem-barato-crm-group-'||sequence_no),18,3)
     ||'-'||substr(md5('bem-barato-crm-group-'||sequence_no),21,12))::uuid as group_id
  from variants
), upserted as (
  insert into public.dynamic_email_briefings
    (id, briefing_data, partner, segment, subgroup, week_key, activity_names, campaign_group_id,
     template_slot_id, status, version, journey_confirmed, acknowledged_missing_activity, legal_override)
  select briefing_id, briefing_data, 'Bem Barato', 'CRM', 'Bem Barato', 'Semana '||week_no, '{}',
    group_id, 'bem-barato-crm-dynamic-v1', 'needs_review', 1, false, true, false
  from prepared
  on conflict (id) do update set
    briefing_data = excluded.briefing_data, partner = excluded.partner, segment = excluded.segment,
    subgroup = excluded.subgroup, week_key = excluded.week_key, campaign_group_id = excluded.campaign_group_id,
    template_slot_id = excluded.template_slot_id, status = excluded.status,
    version = public.dynamic_email_briefings.version + 1, updated_at = now()
  returning 1
)
select count(*) as briefings_upserted from upserted;

do $$
declare n integer;
begin
  select count(*) into n from public.dynamic_email_briefings
   where partner = 'Bem Barato' and template_slot_id = 'bem-barato-crm-dynamic-v1';
  if n <> 8 then
    raise exception 'Esperados 8 briefings do Bem Barato apontando para o slot; encontrados %', n;
  end if;
end $$;

insert into public.dynamic_email_segments
  (technical_name, display_name, business_front, source_table, source_value, partner, bu, origin, governance_status)
values ('CRM', 'Topo de Funil (CRM)', 'acquisition', 'activities', 'CRM', 'Bem Barato', 'B2B2C', 'operational', 'existing')
on conflict (business_front, lower(technical_name), lower(coalesce(partner,''))) where governance_status <> 'archived'
do update set display_name = excluded.display_name, source_table = excluded.source_table,
  source_value = excluded.source_value, origin = 'operational', governance_status = 'existing', updated_at = now();

insert into public.dynamic_email_ruler_strategies
  (name, description, business_front, ruler_family, partner, product, segment, objective, audience,
   journey_stage, narrative_transformation, commercial_intensity, success_criteria, editorial_status, template_slot_id)
values ('Topo de Funil BEM BARATO · CRM',
  'Régua de quatro semanas e oito e-mails do cartão Bem Mais Afinz Visa para a base CRM do Bem Barato.',
  'acquisition', 'top_of_funnel', 'Bem Barato', 'Bem Mais Afinz Visa', 'CRM',
  'Converter a base CRM do Bem Barato em solicitações do cartão Bem Mais Afinz Visa.',
  'Clientes Bem Barato elegíveis na base CRM.', 'Topo de funil',
  'Da apresentação dos benefícios do cartão à urgência de última chance.',
  'progressive', 'Solicitação do cartão', 'ready', 'bem-barato-crm-dynamic-v1')
on conflict (partner, segment, coalesce(product,''), coalesce(name,''), version) do update set
  description = excluded.description, objective = excluded.objective, audience = excluded.audience,
  journey_stage = excluded.journey_stage, narrative_transformation = excluded.narrative_transformation,
  commercial_intensity = excluded.commercial_intensity, success_criteria = excluded.success_criteria,
  editorial_status = excluded.editorial_status, template_slot_id = excluded.template_slot_id, updated_at = now();

insert into public.dynamic_email_ruler_segments (ruler_strategy_id, segment_id, is_primary)
select r.id, s.id, true
from public.dynamic_email_ruler_strategies r
cross join public.dynamic_email_segments s
where r.partner = 'Bem Barato' and r.segment = 'CRM' and r.product = 'Bem Mais Afinz Visa' and r.name = 'Topo de Funil BEM BARATO · CRM'
  and s.business_front = 'acquisition' and lower(s.technical_name) = lower('CRM')
  and lower(coalesce(s.partner,'')) = lower('Bem Barato')
on conflict (ruler_strategy_id, segment_id) do update set is_primary = true;

with ruler as (
  select id from public.dynamic_email_ruler_strategies
  where partner = 'Bem Barato' and segment = 'CRM' and product = 'Bem Mais Afinz Visa' and name = 'Topo de Funil BEM BARATO · CRM'
  order by version desc limit 1
), variants(sequence_no, week_no, subject, preheader, role_in_ruler, email_objective, key_message,
            value_proposition, objection_addressed, proof, visual_hierarchy_strategy, cta_strategy, cta_label) as (values
    (1, 1, 'Faça mais com seu cartão Bem Mais Afinz Visa!', 'Ganhe até R$100 Créditos Vibe na sua primeira compra com o cartão Bem Mais.', 'Abrir a régua com a proposta completa', 'Gerar consideração pelo cartão Bem Mais Afinz Visa', 'Apresentar os quatro benefícios do cartão e o ganho Vibe', 'Economia nas compras no Bem Barato somada a até R$100 em Créditos Vibe', 'Não sei o que esse cartão me dá', 'Grade com os quatro benefícios e o bloco de Créditos Vibe', 'Header, copy de abertura, grade 2x2 de benefícios, CTA, bloco Vibe, banner +250 marcas e CTA de fechamento', 'CTA repetido três vezes ao longo da leitura', 'Pedir meu cartão'),
    (2, 1, 'Ganhe créditos Vibe para fazer mais no fim de semana!', 'Peça seu cartão Bem Mais Afinz Visa e concorra a R$100 MIL todo mês.', 'Reforçar a utilidade imediata', 'Converter interesse em solicitação', 'Compras no Bem Barato viram créditos', 'Créditos Vibe para fazer mais no fim de semana', 'Não vejo utilidade no dia a dia', 'Grade de vantagens e arte de como pedir o cartão', 'Mesma grade 2x2, bloco Vibe reduzido a duas artes e dois banners de fechamento', 'CTA após cada bloco de argumento', 'Pedir meu cartão'),
    (3, 2, 'Peça seu cartão Bem Mais Afinz Visa e faça mais. Aproveite!', 'Ganhe até R$100 Créditos Vibe na sua primeira compra com o cartão Bem Mais.', 'Ampliar a percepção de valor', 'Mostrar a amplitude dos benefícios', 'Benefícios para o dia a dia em um cartão só', 'Compras viram vantagens com descontos exclusivos', 'Já tenho outro cartão', 'Grade de benefícios e trio de artes Vibe com foco em desconto', 'Header próprio, grade 2x2, bloco Vibe com artes de desconto e banner animado', 'CTA em três posições, fechando após o banner', 'Pedir meu cartão'),
    (4, 2, 'Transforme suas compras em vantagens com o cartão Bem Mais Afinz Visa!', 'Benefícios e descontos exclusivos que facilitam o seu dia a dia.', 'Consolidar a proposta', 'Reduzir a postergação da solicitação', 'Aproveitar os créditos em mais de 250 marcas', 'Benefícios exclusivos e Créditos Vibe em +250 marcas', 'Vou deixar para depois', 'Duas artes Vibe seguidas do banner de marcas parceiras', 'Grade 2x2, bloco Vibe com duas artes e banner de fechamento antes do CTA', 'Dois CTAs, o segundo após o banner', 'Pedir meu cartão'),
    (5, 3, 'Ganhe Créditos Vibe com o seu Cartão Bem Mais Afinz Visa!', 'Garanta DESCONTOS exclusivos no App Vibe. Peça já o seu!', 'Retomar com prova de variedade', 'Acelerar a conversão com benefícios concretos', 'Descontos exclusivos no App Vibe', 'Descontos exclusivos e Créditos Vibe nas marcas favoritas', 'Não sei como usar os créditos', 'Faixa de marcas parceiras e passo a passo de solicitação', 'Grade de três benefícios em linha, bloco Vibe, faixa de marcas e passo a passo', 'CTA de abertura "PEÇA JÁ O SEU" e CTA de fechamento', 'PEÇA JÁ O SEU'),
    (6, 3, 'Faça mais no supermercado com o seu cartão Bem Mais Afinz Visa!', 'Ganhe até R$100 em Créditos Vibe na 1ª compra. Aproveite!', 'Criar senso de oportunidade', 'Recuperar quem ainda não solicitou', 'Trocar benefícios e fazer mais no dia a dia', 'Vantagens exclusivas para aproveitar as compras', 'Ainda não me convenci', 'Grade reduzida a dois benefícios e trio de artes Vibe', 'CTA logo após a abertura, grade de dois benefícios e faixa de marcas', 'CTA no topo e no fechamento', 'Quero meu cartão'),
    (7, 4, 'Ainda dá tempo de aproveitar os benefícios com o cartão Bem Mais Afinz Visa!', 'Garanta já seu cartão Bem Mais e ganhe até R$100 em Créditos Vibe.', 'Intensificar a urgência', 'Recuperar com amplitude de benefício', 'Créditos exclusivos para comprar nas melhores marcas', 'Ainda dá tempo de fazer mais nas compras', 'Perdi o prazo', 'Grade completa de benefícios reordenada e duas artes Vibe', 'Grade 2x2 reordenada, bloco Vibe enxuto e sem banner', 'Dois CTAs, sem banner intermediário', 'Pedir meu cartão'),
    (8, 4, 'ÚLTIMA CHANCE: Peça o seu novo cartão Bem Mais Afinz Visa!', 'Aproveite descontos em +250 marcas com seus Créditos Vibe.', 'Encerrar com urgência', 'Capturar a conversão final', 'Benefícios exclusivos no App Vibe e descontos em +250 marcas', 'Última chance de garantir todos os benefícios', 'Deixei passar', 'Duas artes de benefício, duas artes Vibe e duas faixas de marcas', 'CTA logo após a abertura, grade reduzida e dois banners de fechamento', 'CTA de abertura e CTA final "Quero meu cartão"', 'Pedir o meu cartão')
), upserted as (
  insert into public.dynamic_email_email_strategies
    (ruler_strategy_id, campaign_group_id, partner, segment, week_key, sequence, functional_name, subject, preheader,
     role_in_ruler, email_objective, key_message, expected_action, value_proposition, primary_benefit,
     secondary_benefits, objection_addressed, proof, visual_hierarchy_strategy, cta_strategy,
     technical_status, editorial_status, visual_status, certification_status, field_provenance)
  select ruler.id,
    (substr(md5('bem-barato-crm-group-'||sequence_no),1,8)||'-'||substr(md5('bem-barato-crm-group-'||sequence_no),9,4)
     ||'-4'||substr(md5('bem-barato-crm-group-'||sequence_no),14,3)||'-8'||substr(md5('bem-barato-crm-group-'||sequence_no),18,3)
     ||'-'||substr(md5('bem-barato-crm-group-'||sequence_no),21,12))::uuid,
    'Bem Barato', 'CRM', 'Semana '||week_no, 'E-mail '||sequence_no,
    'E-mail '||sequence_no||' · Bem Barato CRM', subject, preheader,
    role_in_ruler, email_objective, key_message, cta_label, value_proposition, key_message,
    '["Preço baixo sempre no Bem Barato","Até 70% de desconto em saúde","Até 70% de desconto em cursos","Bandeira Visa aceita no Brasil e no exterior","Até R$100 em Créditos Vibe na primeira compra","Créditos Vibe a cada fatura paga","Concorre a R$100 mil todo mês","Descontos em mais de 250 marcas"]'::jsonb,
    objection_addressed, proof, visual_hierarchy_strategy, cta_strategy,
    'ready', 'ready', 'ready', 'not_tested',
    '{"source":"REGUA NOVA BEM BARATO.rtf","adaptation":"shared_dynamic_template","template_slot":"bem-barato-crm-dynamic-v1"}'::jsonb
  from ruler cross join variants
  on conflict (campaign_group_id) do update set
    ruler_strategy_id = excluded.ruler_strategy_id, subject = excluded.subject, preheader = excluded.preheader,
    role_in_ruler = excluded.role_in_ruler, email_objective = excluded.email_objective,
    key_message = excluded.key_message, expected_action = excluded.expected_action,
    value_proposition = excluded.value_proposition, primary_benefit = excluded.primary_benefit,
    secondary_benefits = excluded.secondary_benefits, objection_addressed = excluded.objection_addressed,
    proof = excluded.proof, visual_hierarchy_strategy = excluded.visual_hierarchy_strategy,
    cta_strategy = excluded.cta_strategy, technical_status = 'ready', editorial_status = 'ready',
    visual_status = 'ready', certification_status = 'not_tested', field_provenance = excluded.field_provenance,
    version = public.dynamic_email_email_strategies.version + 1, updated_at = now()
  returning 1
)
select count(*) as strategies_upserted from upserted;

do $$
declare n integer;
begin
  select count(*) into n from public.dynamic_email_email_strategies
   where partner = 'Bem Barato' and segment = 'CRM';
  if n <> 8 then
    raise exception 'Esperadas 8 estrategias do Bem Barato; encontradas %', n;
  end if;
end $$;

with asset(name, url, slot, email_tags, width) as (values
    ('Bem Barato CRM E-mail 1 · Header', 'https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/c1507c27-066c-4b04-9c5a-49385cb343e8.png', 'header', array['email-1'], 600),
    ('Bem Barato CRM E-mail 1 · Banner 1', 'https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/e31039cf-fa85-41b7-bf16-9cbccacaaf10.gif', 'banner_1', array['email-1','email-3'], null),
    ('Bem Barato CRM E-mail 2 · Header', 'https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/d219d9c3-8a3b-43fb-bc4e-ccf2b77bb24c.png', 'header', array['email-2'], 600),
    ('Bem Barato CRM E-mail 2 · Banner 1', 'https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/37f56012-cd80-455f-a6d0-248c321cc7e2.gif', 'banner_1', array['email-2'], null),
    ('Bem Barato CRM E-mail 2 · Banner 2', 'https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/02901600-5c44-4f6e-a4a2-2bae56c2f8d2.png', 'banner_2', array['email-2','email-4'], null),
    ('Bem Barato CRM E-mail 3 · Header', 'https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/d305678a-9c9d-41a7-8438-75dd23dfeba3.png', 'header', array['email-3'], 600),
    ('Bem Barato CRM E-mail 4 · Header', 'https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/5200206c-bd6a-42ff-bed3-be676bb49565.png', 'header', array['email-4'], 600),
    ('Bem Barato CRM E-mail 5 · Header', 'https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/96f926ae-97d9-4f72-a570-faa9bf29ce67.png', 'header', array['email-5'], 600),
    ('Bem Barato CRM E-mail 5 · Banner 1', 'https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/b68e83ed-3ce4-4337-a2cf-a0f72cf6529a.png', 'banner_1', array['email-5'], null),
    ('Bem Barato CRM E-mail 5 · Banner 2', 'https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/ea13cca4-e778-41d9-b346-bfdc9d148bad.png', 'banner_2', array['email-5'], null),
    ('Bem Barato CRM E-mail 6 · Header', 'https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/fabe966e-3e89-4789-8a66-5b5e98f4aa8f.png', 'header', array['email-6'], 600),
    ('Bem Barato CRM E-mail 6 · Banner 1', 'https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/710a8574-9b6e-4fb5-87dc-975f4b7f5293.png', 'banner_1', array['email-6'], null),
    ('Bem Barato CRM E-mail 7 · Header', 'https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/450aeaa3-29b1-4d64-824f-583c8bff6d3e.png', 'header', array['email-7'], 600),
    ('Bem Barato CRM E-mail 8 · Header', 'https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/b81ea66d-b8f9-488b-92d3-7fd2ea770b9e.png', 'header', array['email-8'], 600),
    ('Bem Barato CRM E-mail 8 · Banner 1', 'https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/3e38098a-3f02-4a87-b4d0-6c62cdaa2e5e.png', 'banner_1', array['email-8'], null),
    ('Bem Barato CRM E-mail 8 · Banner 2', 'https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/4a36a1a8-9294-48f7-b68d-7ea90723f469.png', 'banner_2', array['email-8'], null),
    ('Bem Barato · Preço baixo sempre', 'https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/dd5bd72f-fba0-4ed0-a6a4-e9fa78758810.png', 'generic', array['regua-fixa'], null),
    ('Bem Barato · Desconto em saúde', 'https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/3f2ff739-5b6d-4484-ba6a-d552390794ba.png', 'generic', array['regua-fixa'], null),
    ('Bem Barato · Desconto em cursos', 'https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/63c27266-d881-4e29-b256-fb6c3a2348ed.png', 'generic', array['regua-fixa'], null),
    ('Bem Barato · Bandeira Visa', 'https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/87c5c98f-c6dd-47e1-8522-7e4f67172d1b.png', 'generic', array['regua-fixa'], null),
    ('Vibe · R$100 na primeira compra', 'https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/ba613caa-444d-4954-acd0-1b151dada6ec.png', 'generic', array['regua-fixa'], null),
    ('Vibe · Créditos por fatura paga', 'https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/c392c8ff-b97f-4a86-8c56-df49ea5b2374.png', 'generic', array['regua-fixa'], null),
    ('Vibe · Concorra a R$100 mil', 'https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/82ec3fce-c040-4f7a-b450-e96b9f062489.png', 'generic', array['regua-fixa'], null),
    ('Vibe · Desconto exclusivo', 'https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/b3063d8e-942f-497d-bd51-ad7754b5abe7.png', 'generic', array['regua-fixa'], null),
    ('Vibe · Vantagens no app', 'https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/2f1fef6e-62d6-491a-8df1-fbea4eac2046.png', 'generic', array['regua-fixa'], null)
)
insert into public.dynamic_email_assets
  (name, external_url, click_url, slot, bu, partner, segment, subgroup, product, alt_text, width, tags, status, version)
select name, url, null, slot, 'B2B2C', 'Bem Barato', 'CRM', 'Bem Barato', 'Bem Mais Afinz Visa', name, width,
  array['bem-barato','crm','topo-de-funil','referencia-rtf'] || email_tags, 'ready', 1
from asset
on conflict (external_url) do update set
  tags = (select array_agg(distinct tag) from unnest(public.dynamic_email_assets.tags || excluded.tags) tag),
  partner = 'Bem Barato', segment = 'CRM', updated_at = now();

-- Guarda final: nenhum briefing de outro parceiro pode ter sido apontado para este slot.
do $$
declare n integer;
begin
  select count(*) into n from public.dynamic_email_briefings
   where template_slot_id = 'bem-barato-crm-dynamic-v1' and partner <> 'Bem Barato';
  if n <> 0 then
    raise exception 'Impacto lateral: % briefings de outro parceiro apontam para o slot', n;
  end if;
end $$;

commit;
