insert into public.dynamic_email_template_slots (id,name,source,is_principal,status,version,created_by,updated_by)
values ('b2c-classic-vibe-dynamic-v1', 'B2C Classic + Vibe · Dinâmico', $b2c$%%[
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
</table></td></tr></table></body></html>$b2c$, false, 'active', 1, null, null)
on conflict (id) do update set name=excluded.name, source=excluded.source, status='active', version=public.dynamic_email_template_slots.version+1, updated_at=now();

update public.dynamic_email_briefings set
briefing_data='{"DT_INICIO":"09/01/2026 00:00:00","DT_FIM":"12/31/2028 23:59:59","UTM_CAMPANHA":"B2C_CLASSIC_VIBE_S1_D1","TP_CAMPANHA":"Aquisicao","SEQUENCIA":"E-mail 1","ASSUNTO":"Peça seu cartão Afinz e concorra a R$100 mil todo mês!","PRE_CABECALHO":"Aproveite os descontos incríveis nas melhores marcas.","HEADER":"https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/1cff3901-45e3-4245-a0e5-59c8bf28c638.png","CARTAO_NM_COMERCIAL":"Afinz Visa","NM_PRODUTO_INTERNO":"INSTITUCIONAL","TITULO_COPY_1_AZUL":"Olá, %%=v(@FirstName)=%%","COR_COPY_1":"#00C6CC","TAMANHO_DA_FONTE_TITULO_COPY_1":"22","TITULO_CTA_1":"Quero meu cartão","LINK_CTA_1":"https://cartao-afinz.onelink.me/9ODN/mtuc2zhn?c=b2c_topo_de_funil_vibe&af_sub1=base_proprietaria&af_sub2=s1&af_sub3=b2c_email_vibe_bsp_S1D01","COPY_1_PRETO":"Peça seu <b>cartão Afinz Visa</b> e ganhe créditos para aproveitar super ofertas e descontos no App Vibe.<br><br><b>E mais:</b> usando seus Créditos Vibe, você concorre a <b>R$100 mil todo mês!</b>","COR_COPY_PRETO_1":"#111111","TAMANHO_DA_FONTE_TITULO_COPY_PRETO_1":"19","TITULO_COPY_2":"Não perca os benefícios e descontos","COR_TITULO_COPY_2":"#00C6CC","TAMANHO_DA_FONTE_TITULO_COPY_2":"20","COPY_2_PRETO":"Nas melhores marcas, direto no App Vibe!","COR_COPY_2":"#111111","TAMANHO_DA_FONTE_COPY_2":"18","TITULO_CTA_2":"Pedir meu cartão","LINK_CTA_2":"https://cartao-afinz.onelink.me/9ODN/mtuc2zhn?c=b2c_topo_de_funil_vibe&af_sub1=base_proprietaria&af_sub2=s1&af_sub3=b2c_email_vibe_bsp_S1D01","BANNER_1_CORPO":"https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/814bdf22-1f7d-4680-a707-682e9d61b9e8.png","LINK_BANNER_1_CORPO":"","BANNER_2_CORPO":"","LINK_BANNER_2_CORPO":"","BANNER_3_CORPO":"","LINK_BANNER_3_CORPO":"","NOTA_LEGAL":"*Após realizar a primeira compra com o seu cartão com anuidade ativa, independentemente do valor, você receberá em até 5 dias úteis R$ 100 em créditos no App Vibe, com validade de até 6 meses. Para visualizar o seu saldo, baixe o App Vibe. A primeira compra deverá ser realizada em até 30 dias. / A cada fatura paga, com anuidade ativa, você receberá mais créditos no App Vibe, conforme condições da loja parceira, também com validade de até 6 meses. Os benefícios acumulados no app da Vibe podem ser trocados por descontos e vantagens das marcas parceiras. Eles são dinâmicos e podem ser alterados ou apresentados conforme as regras de elegibilidade de cada fornecedor parceiro. / Consulte o regulamento completo no app da Vibe. Promoção válida por tempo limitado, podendo ser alterada ou encerrada a qualquer momento, sem aviso prévio. / Sujeito a disponibilidade.","COR_NOTA_LEGAL":"#777777","TAMANHO_DA_FONTE_NOTA_LEGAL":"9","RODAPE":"Ouvidoria: 0800 772 0602<br>Enviado por Banco Afinz S.A. - Banco Múltiplo - CNPJ: 04.814.563/0001-74 | Afinz Instituição de Pagamento S.A. - CNPJ: 60.114.865/0001-00<br>Rua XV de Novembro, 45 - Sorocaba, SP"}'::jsonb, template_slot_id='b2c-classic-vibe-dynamic-v1', status='ready', version=version+1, updated_at=now()
where id='b2c00000-0000-4000-8000-000000000001'::uuid;

update public.dynamic_email_email_strategies set
role_in_ruler='Apresentar a proposta completa',
email_objective='Gerar consideração pelo cartão',
key_message='Cartão Afinz combina crédito e vantagens Vibe',
expected_action='Solicitar o cartão',
value_proposition='Crédito com economia recorrente',
primary_benefit='R$100 em Créditos Vibe na primeira compra',
secondary_benefits='["Descontos no App Vibe", "Sorteio mensal de R$100 mil"]'::jsonb,
objection_addressed='Não perceber valor além do crédito',
proof='Oferta, benefícios e condições explicitados',
visual_hierarchy_strategy='Header de oferta, benefícios e reforço final',
cta_strategy='CTA direto no primeiro bloco e reforço no fechamento',
technical_status='ready',
editorial_status='ready',
visual_status='ready',
certification_status='not_tested',
field_provenance=coalesce(field_provenance,'{}'::jsonb)||'{"semantic_fields":"human_reference_migration"}'::jsonb,
version=version+1,
updated_at=now()
where campaign_group_id='b2c10000-0000-4000-8000-000000000001'::uuid;

update public.dynamic_email_briefings set
briefing_data='{"DT_INICIO":"09/01/2026 00:00:00","DT_FIM":"12/31/2028 23:59:59","UTM_CAMPANHA":"B2C_CLASSIC_VIBE_S1_D2","TP_CAMPANHA":"Aquisicao","SEQUENCIA":"E-mail 2","ASSUNTO":"GANHE Créditos Vibe com o cartão Afinz Visa! 💳","PRE_CABECALHO":"Peça seu cartão e tenha descontos em cinema, delivery e muito mais!","HEADER":"https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/0e8a7666-182b-41ef-a7c6-440f6855a478.png","CARTAO_NM_COMERCIAL":"Afinz Visa","NM_PRODUTO_INTERNO":"INSTITUCIONAL","TITULO_COPY_1_AZUL":"Olá, %%=v(@FirstName)=%%","COR_COPY_1":"#00C6CC","TAMANHO_DA_FONTE_TITULO_COPY_1":"22","TITULO_CTA_1":"Quero meu cartão","LINK_CTA_1":"https://cartao-afinz.onelink.me/9ODN/mtuc2zhn?c=b2c_topo_de_funil_vibe&af_sub1=base_proprietaria&af_sub2=s1&af_sub3=b2c_email_vibe_bsp_S1D02","COPY_1_PRETO":"Garanta seu <b>cartão Afinz Visa</b> e aproveite descontos incríveis nas melhores marcas, no <b>App Vibe</b>.","COR_COPY_PRETO_1":"#111111","TAMANHO_DA_FONTE_TITULO_COPY_PRETO_1":"19","TITULO_COPY_2":"Peça o seu agora mesmo","COR_TITULO_COPY_2":"#00C6CC","TAMANHO_DA_FONTE_TITULO_COPY_2":"20","COPY_2_PRETO":"Comece a utilizar o cartão Afinz virtual e ganhe R$100 em Créditos Vibe fazendo a primeira compra.","COR_COPY_2":"#111111","TAMANHO_DA_FONTE_COPY_2":"18","TITULO_CTA_2":"Pedir meu cartão","LINK_CTA_2":"https://cartao-afinz.onelink.me/9ODN/mtuc2zhn?c=b2c_topo_de_funil_vibe&af_sub1=base_proprietaria&af_sub2=s1&af_sub3=b2c_email_vibe_bsp_S1D02","BANNER_1_CORPO":"https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/3736d8c4-a8ce-47fb-944c-911039706324.png","LINK_BANNER_1_CORPO":"","BANNER_2_CORPO":"","LINK_BANNER_2_CORPO":"","BANNER_3_CORPO":"","LINK_BANNER_3_CORPO":"","NOTA_LEGAL":"*Após realizar a primeira compra com o seu cartão com anuidade ativa, independentemente do valor, você receberá em até 5 dias úteis R$ 100 em créditos no App Vibe, com validade de até 6 meses. Para visualizar o seu saldo, baixe o App Vibe. A primeira compra deverá ser realizada em até 30 dias. / A cada fatura paga, com anuidade ativa, você receberá mais créditos no App Vibe, conforme condições da loja parceira, também com validade de até 6 meses. Os benefícios acumulados no app da Vibe podem ser trocados por descontos e vantagens das marcas parceiras. Eles são dinâmicos e podem ser alterados ou apresentados conforme as regras de elegibilidade de cada fornecedor parceiro. / Consulte o regulamento completo no app da Vibe. Promoção válida por tempo limitado, podendo ser alterada ou encerrada a qualquer momento, sem aviso prévio. / Sujeito a disponibilidade.","COR_NOTA_LEGAL":"#777777","TAMANHO_DA_FONTE_NOTA_LEGAL":"9","RODAPE":"Ouvidoria: 0800 772 0602<br>Enviado por Banco Afinz S.A. - Banco Múltiplo - CNPJ: 04.814.563/0001-74 | Afinz Instituição de Pagamento S.A. - CNPJ: 60.114.865/0001-00<br>Rua XV de Novembro, 45 - Sorocaba, SP"}'::jsonb, template_slot_id='b2c-classic-vibe-dynamic-v1', status='ready', version=version+1, updated_at=now()
where id='b2c00000-0000-4000-8000-000000000002'::uuid;

update public.dynamic_email_email_strategies set
role_in_ruler='Reforçar utilidade imediata',
email_objective='Converter interesse em solicitação',
key_message='O cartão virtual permite começar a usar rapidamente',
expected_action='Pedir o cartão',
value_proposition='Acesso rápido a crédito e descontos',
primary_benefit='Uso do cartão virtual',
secondary_benefits='["R$100 em Créditos Vibe", "Descontos em diferentes categorias"]'::jsonb,
objection_addressed='Achar que o cartão demora para ficar disponível',
proof='Cartão virtual e crédito da primeira compra',
visual_hierarchy_strategy='Disponibilidade imediata antes do benefício promocional',
cta_strategy='CTA após a promessa de uso imediato',
technical_status='ready',
editorial_status='ready',
visual_status='ready',
certification_status='not_tested',
field_provenance=coalesce(field_provenance,'{}'::jsonb)||'{"semantic_fields":"human_reference_migration"}'::jsonb,
version=version+1,
updated_at=now()
where campaign_group_id='b2c10000-0000-4000-8000-000000000002'::uuid;

update public.dynamic_email_briefings set
briefing_data='{"DT_INICIO":"09/01/2026 00:00:00","DT_FIM":"12/31/2028 23:59:59","UTM_CAMPANHA":"B2C_CLASSIC_VIBE_S2_D1","TP_CAMPANHA":"Aquisicao","SEQUENCIA":"E-mail 3","ASSUNTO":"Concorra a R$100 MIL todo mês com o cartão Afinz!","PRE_CABECALHO":"Peça seu cartão e ganhe R$100 em créditos Vibe na 1ª compra.","HEADER":"https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/1cff3901-45e3-4245-a0e5-59c8bf28c638.png","CARTAO_NM_COMERCIAL":"Afinz Visa","NM_PRODUTO_INTERNO":"INSTITUCIONAL","TITULO_COPY_1_AZUL":"Olá, %%=v(@FirstName)=%%","COR_COPY_1":"#00C6CC","TAMANHO_DA_FONTE_TITULO_COPY_1":"22","TITULO_CTA_1":"Quero meu cartão","LINK_CTA_1":"https://cartao-afinz.onelink.me/9ODN/mtuc2zhn?c=b2c_topo_de_funil_vibe&af_sub1=base_proprietaria&af_sub2=s2&af_sub3=b2c_email_vibe_bsp_S2D01","COPY_1_PRETO":"Com o cartão Afinz Visa, você tem <b>crédito na hora</b> e já pode usar seu <b>cartão virtual</b> para compras online.","COR_COPY_PRETO_1":"#111111","TAMANHO_DA_FONTE_TITULO_COPY_PRETO_1":"19","TITULO_COPY_2":"Créditos para aproveitar no App Vibe","COR_TITULO_COPY_2":"#00C6CC","TAMANHO_DA_FONTE_TITULO_COPY_2":"20","COPY_2_PRETO":"Ganhe até <b>R$100</b> na primeira compra, receba Créditos Vibe ao pagar a fatura em dia e concorra a <b>R$100 mil todo mês</b>.","COR_COPY_2":"#111111","TAMANHO_DA_FONTE_COPY_2":"18","TITULO_CTA_2":"Pedir meu cartão","LINK_CTA_2":"https://cartao-afinz.onelink.me/9ODN/mtuc2zhn?c=b2c_topo_de_funil_vibe&af_sub1=base_proprietaria&af_sub2=s2&af_sub3=b2c_email_vibe_bsp_S2D01","BANNER_1_CORPO":"https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/4db4ae3d-6fd9-4256-b87e-7b875b932ecc.png","LINK_BANNER_1_CORPO":"","BANNER_2_CORPO":"","LINK_BANNER_2_CORPO":"","BANNER_3_CORPO":"","LINK_BANNER_3_CORPO":"","NOTA_LEGAL":"*Após realizar a primeira compra com o seu cartão com anuidade ativa, independentemente do valor, você receberá em até 5 dias úteis R$ 100 em créditos no App Vibe, com validade de até 6 meses. Para visualizar o seu saldo, baixe o App Vibe. A primeira compra deverá ser realizada em até 30 dias. / A cada fatura paga, com anuidade ativa, você receberá mais créditos no App Vibe, conforme condições da loja parceira, também com validade de até 6 meses. Os benefícios acumulados no app da Vibe podem ser trocados por descontos e vantagens das marcas parceiras. Eles são dinâmicos e podem ser alterados ou apresentados conforme as regras de elegibilidade de cada fornecedor parceiro. / Consulte o regulamento completo no app da Vibe. Promoção válida por tempo limitado, podendo ser alterada ou encerrada a qualquer momento, sem aviso prévio. / Sujeito a disponibilidade.","COR_NOTA_LEGAL":"#777777","TAMANHO_DA_FONTE_NOTA_LEGAL":"9","RODAPE":"Ouvidoria: 0800 772 0602<br>Enviado por Banco Afinz S.A. - Banco Múltiplo - CNPJ: 04.814.563/0001-74 | Afinz Instituição de Pagamento S.A. - CNPJ: 60.114.865/0001-00<br>Rua XV de Novembro, 45 - Sorocaba, SP"}'::jsonb, template_slot_id='b2c-classic-vibe-dynamic-v1', status='ready', version=version+1, updated_at=now()
where id='b2c00000-0000-4000-8000-000000000003'::uuid;

update public.dynamic_email_email_strategies set
role_in_ruler='Detalhar o ecossistema de benefícios',
email_objective='Aumentar desejo pela oferta',
key_message='O cartão gera créditos e vantagens recorrentes',
expected_action='Solicitar o cartão',
value_proposition='Benefícios em diferentes momentos da relação',
primary_benefit='Até R$100 em Créditos Vibe',
secondary_benefits='["Créditos mensais", "Sorteio de R$100 mil", "Descontos em marcas"]'::jsonb,
objection_addressed='Não entender como o Vibe agrega valor',
proof='Lista factual de benefícios da comunicação original',
visual_hierarchy_strategy='Progressão visual dos benefícios',
cta_strategy='CTA principal antes do aprofundamento',
technical_status='ready',
editorial_status='ready',
visual_status='ready',
certification_status='not_tested',
field_provenance=coalesce(field_provenance,'{}'::jsonb)||'{"semantic_fields":"human_reference_migration"}'::jsonb,
version=version+1,
updated_at=now()
where campaign_group_id='b2c10000-0000-4000-8000-000000000003'::uuid;

update public.dynamic_email_briefings set
briefing_data='{"DT_INICIO":"09/01/2026 00:00:00","DT_FIM":"12/31/2028 23:59:59","UTM_CAMPANHA":"B2C_CLASSIC_VIBE_S2_D2","TP_CAMPANHA":"Aquisicao","SEQUENCIA":"E-mail 4","ASSUNTO":"Cartão Afinz com limite para usar na hora. Peça já!","PRE_CABECALHO":"Ganhe até R$100 em Créditos Vibe para suas compras. Aproveite!","HEADER":"https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/413ba064-4762-41b5-80fe-eae9b0475fdb.png","CARTAO_NM_COMERCIAL":"Afinz Visa","NM_PRODUTO_INTERNO":"INSTITUCIONAL","TITULO_COPY_1_AZUL":"Olá, %%=v(@FirstName)=%%","COR_COPY_1":"#00C6CC","TAMANHO_DA_FONTE_TITULO_COPY_1":"22","TITULO_CTA_1":"Quero meu cartão","LINK_CTA_1":"https://cartao-afinz.onelink.me/9ODN/mtuc2zhn?c=b2c_topo_de_funil_vibe&af_sub1=base_proprietaria&af_sub2=s2&af_sub3=b2c_email_vibe_bsp_S2D02","COPY_1_PRETO":"Com o <b>cartão Afinz Visa</b> você tem <b>limite liberado na hora</b> e benefícios que ajudam a economizar.","COR_COPY_PRETO_1":"#111111","TAMANHO_DA_FONTE_TITULO_COPY_PRETO_1":"19","TITULO_COPY_2":"Aproveite os melhores descontos","COR_TITULO_COPY_2":"#00C6CC","TAMANHO_DA_FONTE_TITULO_COPY_2":"20","COPY_2_PRETO":"R$100 em Créditos Vibe na primeira compra, créditos mensais ao pagar a fatura em dia e até 70% de desconto em medicamentos, consultas e exames.","COR_COPY_2":"#111111","TAMANHO_DA_FONTE_COPY_2":"18","TITULO_CTA_2":"Pedir meu cartão","LINK_CTA_2":"https://cartao-afinz.onelink.me/9ODN/mtuc2zhn?c=b2c_topo_de_funil_vibe&af_sub1=base_proprietaria&af_sub2=s2&af_sub3=b2c_email_vibe_bsp_S2D02","BANNER_1_CORPO":"https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/e31039cf-fa85-41b7-bf16-9cbccacaaf10.gif","LINK_BANNER_1_CORPO":"","BANNER_2_CORPO":"","LINK_BANNER_2_CORPO":"","BANNER_3_CORPO":"","LINK_BANNER_3_CORPO":"","NOTA_LEGAL":"*Após realizar a primeira compra com o seu cartão com anuidade ativa, independentemente do valor, você receberá em até 5 dias úteis R$ 100 em créditos no App Vibe, com validade de até 6 meses. Para visualizar o seu saldo, baixe o App Vibe. A primeira compra deverá ser realizada em até 30 dias. / A cada fatura paga, com anuidade ativa, você receberá mais créditos no App Vibe, conforme condições da loja parceira, também com validade de até 6 meses. Os benefícios acumulados no app da Vibe podem ser trocados por descontos e vantagens das marcas parceiras. Eles são dinâmicos e podem ser alterados ou apresentados conforme as regras de elegibilidade de cada fornecedor parceiro. / Consulte o regulamento completo no app da Vibe. Promoção válida por tempo limitado, podendo ser alterada ou encerrada a qualquer momento, sem aviso prévio. / Sujeito a disponibilidade.","COR_NOTA_LEGAL":"#777777","TAMANHO_DA_FONTE_NOTA_LEGAL":"9","RODAPE":"Ouvidoria: 0800 772 0602<br>Enviado por Banco Afinz S.A. - Banco Múltiplo - CNPJ: 04.814.563/0001-74 | Afinz Instituição de Pagamento S.A. - CNPJ: 60.114.865/0001-00<br>Rua XV de Novembro, 45 - Sorocaba, SP"}'::jsonb, template_slot_id='b2c-classic-vibe-dynamic-v1', status='ready', version=version+1, updated_at=now()
where id='b2c00000-0000-4000-8000-000000000004'::uuid;

update public.dynamic_email_email_strategies set
role_in_ruler='Provar economia e conveniência',
email_objective='Reduzir objeção de utilidade',
key_message='Limite imediato e economia em saúde',
expected_action='Pedir o cartão',
value_proposition='Crédito com benefícios de uso cotidiano',
primary_benefit='Limite liberado na hora',
secondary_benefits='["Até 70% em saúde", "Créditos Vibe"]'::jsonb,
objection_addressed='Não enxergar uso prático',
proof='Categorias e percentuais presentes no original',
visual_hierarchy_strategy='Benefício imediato seguido de prova por categoria',
cta_strategy='CTA antes do bloco de descontos',
technical_status='ready',
editorial_status='ready',
visual_status='ready',
certification_status='not_tested',
field_provenance=coalesce(field_provenance,'{}'::jsonb)||'{"semantic_fields":"human_reference_migration"}'::jsonb,
version=version+1,
updated_at=now()
where campaign_group_id='b2c10000-0000-4000-8000-000000000004'::uuid;

update public.dynamic_email_briefings set
briefing_data='{"DT_INICIO":"09/01/2026 00:00:00","DT_FIM":"12/31/2028 23:59:59","UTM_CAMPANHA":"B2C_CLASSIC_VIBE_S3_D1","TP_CAMPANHA":"Aquisicao","SEQUENCIA":"E-mail 5","ASSUNTO":"Economize todo mês com seus Créditos Vibe!","PRE_CABECALHO":"Peça seu cartão Afinz e concorra a R$100 MIL todo mês.","HEADER":"https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/1e08e54a-716a-4a59-96a0-3b652119ed13.png","CARTAO_NM_COMERCIAL":"Afinz Visa","NM_PRODUTO_INTERNO":"INSTITUCIONAL","TITULO_COPY_1_AZUL":"Olá, %%=v(@FirstName)=%%","COR_COPY_1":"#00C6CC","TAMANHO_DA_FONTE_TITULO_COPY_1":"22","TITULO_CTA_1":"Quero meu cartão","LINK_CTA_1":"https://cartao-afinz.onelink.me/9ODN/mtuc2zhn?c=b2c_topo_de_funil_vibe&af_sub1=base_proprietaria&af_sub2=s3&af_sub3=b2c_email_vibe_bsp_S3D01","COPY_1_PRETO":"Com o <b>cartão Afinz</b> você ganha Créditos Vibe e <b>economiza todo mês</b>.","COR_COPY_PRETO_1":"#111111","TAMANHO_DA_FONTE_TITULO_COPY_PRETO_1":"19","TITULO_COPY_2":"Benefícios para aproveitar sempre","COR_TITULO_COPY_2":"#00C6CC","TAMANHO_DA_FONTE_TITULO_COPY_2":"20","COPY_2_PRETO":"<table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"4\"><tr><td width=\"33%\"><img src=\"https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/7b74ae58-653d-4037-b494-1a04d89c4fc7.png\" width=\"150\" style=\"display:block;width:100%;height:auto;border:0\" alt=\"Benefício Vibe\"></td><td width=\"33%\"><img src=\"https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/481a91c2-9f6a-4d43-84bd-dd06d5db3cb8.png\" width=\"150\" style=\"display:block;width:100%;height:auto;border:0\" alt=\"Benefício Vibe\"></td><td width=\"33%\"><img src=\"https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/fe5a60a4-6a4c-454b-8681-3d5722951429.png\" width=\"150\" style=\"display:block;width:100%;height:auto;border:0\" alt=\"Benefício Vibe\"></td></tr></table>","COR_COPY_2":"#111111","TAMANHO_DA_FONTE_COPY_2":"18","TITULO_CTA_2":"Pedir meu cartão","LINK_CTA_2":"https://cartao-afinz.onelink.me/9ODN/mtuc2zhn?c=b2c_topo_de_funil_vibe&af_sub1=base_proprietaria&af_sub2=s3&af_sub3=b2c_email_vibe_bsp_S3D01","BANNER_1_CORPO":"","LINK_BANNER_1_CORPO":"","BANNER_2_CORPO":"","LINK_BANNER_2_CORPO":"","BANNER_3_CORPO":"","LINK_BANNER_3_CORPO":"","NOTA_LEGAL":"*Após realizar a primeira compra com o seu cartão com anuidade ativa, independentemente do valor, você receberá em até 5 dias úteis R$ 100 em créditos no App Vibe, com validade de até 6 meses. Para visualizar o seu saldo, baixe o App Vibe. A primeira compra deverá ser realizada em até 30 dias. / A cada fatura paga, com anuidade ativa, você receberá mais créditos no App Vibe, conforme condições da loja parceira, também com validade de até 6 meses. Os benefícios acumulados no app da Vibe podem ser trocados por descontos e vantagens das marcas parceiras. Eles são dinâmicos e podem ser alterados ou apresentados conforme as regras de elegibilidade de cada fornecedor parceiro. / Consulte o regulamento completo no app da Vibe. Promoção válida por tempo limitado, podendo ser alterada ou encerrada a qualquer momento, sem aviso prévio. / Sujeito a disponibilidade.","COR_NOTA_LEGAL":"#777777","TAMANHO_DA_FONTE_NOTA_LEGAL":"9","RODAPE":"Ouvidoria: 0800 772 0602<br>Enviado por Banco Afinz S.A. - Banco Múltiplo - CNPJ: 04.814.563/0001-74 | Afinz Instituição de Pagamento S.A. - CNPJ: 60.114.865/0001-00<br>Rua XV de Novembro, 45 - Sorocaba, SP"}'::jsonb, template_slot_id='b2c-classic-vibe-dynamic-v1', status='ready', version=version+1, updated_at=now()
where id='b2c00000-0000-4000-8000-000000000005'::uuid;

update public.dynamic_email_email_strategies set
role_in_ruler='Reforçar recorrência',
email_objective='Mostrar valor mensal',
key_message='Créditos Vibe ajudam a economizar continuamente',
expected_action='Solicitar o cartão',
value_proposition='Economia recorrente vinculada ao uso',
primary_benefit='Economia todos os meses',
secondary_benefits='["Créditos Vibe", "Cartão virtual"]'::jsonb,
objection_addressed='Perceber o benefício como pontual',
proof='Conjunto de categorias visuais da campanha',
visual_hierarchy_strategy='Mensagem curta com mosaico de categorias',
cta_strategy='CTA após promessa de recorrência',
technical_status='ready',
editorial_status='ready',
visual_status='ready',
certification_status='not_tested',
field_provenance=coalesce(field_provenance,'{}'::jsonb)||'{"semantic_fields":"human_reference_migration"}'::jsonb,
version=version+1,
updated_at=now()
where campaign_group_id='b2c10000-0000-4000-8000-000000000005'::uuid;

update public.dynamic_email_briefings set
briefing_data='{"DT_INICIO":"09/01/2026 00:00:00","DT_FIM":"12/31/2028 23:59:59","UTM_CAMPANHA":"B2C_CLASSIC_VIBE_S3_D2","TP_CAMPANHA":"Aquisicao","SEQUENCIA":"E-mail 6","ASSUNTO":"Quer concorrer a R$100 MIL todo mês? Peça seu Cartão Afinz!","PRE_CABECALHO":"Ganhe R$100 em Créditos Vibe na 1ª compra e aproveite nas melhores marcas.","HEADER":"https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/ecc98b44-e31d-47cd-9ec8-a2bf6285ff7c.png","CARTAO_NM_COMERCIAL":"Afinz Visa","NM_PRODUTO_INTERNO":"INSTITUCIONAL","TITULO_COPY_1_AZUL":"Olá, %%=v(@FirstName)=%%","COR_COPY_1":"#00C6CC","TAMANHO_DA_FONTE_TITULO_COPY_1":"22","TITULO_CTA_1":"Quero meu cartão","LINK_CTA_1":"https://cartao-afinz.onelink.me/9ODN/mtuc2zhn?c=b2c_topo_de_funil_vibe&af_sub1=base_proprietaria&af_sub2=s3&af_sub3=b2c_email_vibe_bsp_S3D02","COPY_1_PRETO":"Peça já o seu cartão Afinz Visa e <b>ganhe R$100 em Créditos Vibe</b> fazendo a primeira compra!","COR_COPY_PRETO_1":"#111111","TAMANHO_DA_FONTE_TITULO_COPY_PRETO_1":"19","TITULO_COPY_2":"Aproveite o App Vibe","COR_TITULO_COPY_2":"#00C6CC","TAMANHO_DA_FONTE_TITULO_COPY_2":"20","COPY_2_PRETO":"Descontos incríveis nas melhores marcas e a chance de concorrer a R$100 mil todo mês.","COR_COPY_2":"#111111","TAMANHO_DA_FONTE_COPY_2":"18","TITULO_CTA_2":"Pedir meu cartão","LINK_CTA_2":"https://cartao-afinz.onelink.me/9ODN/mtuc2zhn?c=b2c_topo_de_funil_vibe&af_sub1=base_proprietaria&af_sub2=s3&af_sub3=b2c_email_vibe_bsp_S3D02","BANNER_1_CORPO":"https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/e31039cf-fa85-41b7-bf16-9cbccacaaf10.gif","LINK_BANNER_1_CORPO":"","BANNER_2_CORPO":"","LINK_BANNER_2_CORPO":"","BANNER_3_CORPO":"","LINK_BANNER_3_CORPO":"","NOTA_LEGAL":"*Após realizar a primeira compra com o seu cartão com anuidade ativa, independentemente do valor, você receberá em até 5 dias úteis R$ 100 em créditos no App Vibe, com validade de até 6 meses. Para visualizar o seu saldo, baixe o App Vibe. A primeira compra deverá ser realizada em até 30 dias. / A cada fatura paga, com anuidade ativa, você receberá mais créditos no App Vibe, conforme condições da loja parceira, também com validade de até 6 meses. Os benefícios acumulados no app da Vibe podem ser trocados por descontos e vantagens das marcas parceiras. Eles são dinâmicos e podem ser alterados ou apresentados conforme as regras de elegibilidade de cada fornecedor parceiro. / Consulte o regulamento completo no app da Vibe. Promoção válida por tempo limitado, podendo ser alterada ou encerrada a qualquer momento, sem aviso prévio. / Sujeito a disponibilidade.","COR_NOTA_LEGAL":"#777777","TAMANHO_DA_FONTE_NOTA_LEGAL":"9","RODAPE":"Ouvidoria: 0800 772 0602<br>Enviado por Banco Afinz S.A. - Banco Múltiplo - CNPJ: 04.814.563/0001-74 | Afinz Instituição de Pagamento S.A. - CNPJ: 60.114.865/0001-00<br>Rua XV de Novembro, 45 - Sorocaba, SP"}'::jsonb, template_slot_id='b2c-classic-vibe-dynamic-v1', status='ready', version=version+1, updated_at=now()
where id='b2c00000-0000-4000-8000-000000000006'::uuid;

update public.dynamic_email_email_strategies set
role_in_ruler='Retomar incentivo de entrada',
email_objective='Acelerar conversão com incentivo',
key_message='A primeira compra libera R$100 em Créditos Vibe',
expected_action='Pedir o cartão',
value_proposition='Entrada simples no ecossistema Vibe',
primary_benefit='R$100 na primeira compra',
secondary_benefits='["Cartão virtual", "Sorteio mensal"]'::jsonb,
objection_addressed='Adiar a solicitação',
proof='Condição promocional e nota legal',
visual_hierarchy_strategy='Incentivo dominante e reforço de variedade',
cta_strategy='CTA imediatamente após o incentivo',
technical_status='ready',
editorial_status='ready',
visual_status='ready',
certification_status='not_tested',
field_provenance=coalesce(field_provenance,'{}'::jsonb)||'{"semantic_fields":"human_reference_migration"}'::jsonb,
version=version+1,
updated_at=now()
where campaign_group_id='b2c10000-0000-4000-8000-000000000006'::uuid;

update public.dynamic_email_briefings set
briefing_data='{"DT_INICIO":"09/01/2026 00:00:00","DT_FIM":"12/31/2028 23:59:59","UTM_CAMPANHA":"B2C_CLASSIC_VIBE_S4_D1","TP_CAMPANHA":"Aquisicao","SEQUENCIA":"E-mail 7","ASSUNTO":"Não perca seu cartão Afinz com Créditos Vibe exclusivos!","PRE_CABECALHO":"Ganhe R$100 em Créditos Vibe para economizar nas melhores marcas.","HEADER":"https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/2e28aab8-b586-4223-a19a-bd7a90138594.png","CARTAO_NM_COMERCIAL":"Afinz Visa","NM_PRODUTO_INTERNO":"INSTITUCIONAL","TITULO_COPY_1_AZUL":"Olá, %%=v(@FirstName)=%%","COR_COPY_1":"#00C6CC","TAMANHO_DA_FONTE_TITULO_COPY_1":"22","TITULO_CTA_1":"Quero meu cartão","LINK_CTA_1":"https://cartao-afinz.onelink.me/9ODN/mtuc2zhn?c=b2c_topo_de_funil_vibe&af_sub1=base_proprietaria&af_sub2=s4&af_sub3=b2c_email_vibe_bsp_S4D01","COPY_1_PRETO":"Não perca esta chance de pedir seu <b>cartão Afinz Visa</b> e ganhar <b>R$100 em Créditos Vibe</b> para economizar nas melhores marcas.","COR_COPY_PRETO_1":"#111111","TAMANHO_DA_FONTE_TITULO_COPY_PRETO_1":"19","TITULO_COPY_2":"E mais: créditos todos os meses","COR_TITULO_COPY_2":"#00C6CC","TAMANHO_DA_FONTE_TITULO_COPY_2":"20","COPY_2_PRETO":"<table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"4\"><tr><td width=\"33%\"><img src=\"https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/7b74ae58-653d-4037-b494-1a04d89c4fc7.png\" width=\"150\" style=\"display:block;width:100%;height:auto;border:0\" alt=\"Benefício Vibe\"></td><td width=\"33%\"><img src=\"https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/481a91c2-9f6a-4d43-84bd-dd06d5db3cb8.png\" width=\"150\" style=\"display:block;width:100%;height:auto;border:0\" alt=\"Benefício Vibe\"></td><td width=\"33%\"><img src=\"https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/fe5a60a4-6a4c-454b-8681-3d5722951429.png\" width=\"150\" style=\"display:block;width:100%;height:auto;border:0\" alt=\"Benefício Vibe\"></td></tr></table>","COR_COPY_2":"#111111","TAMANHO_DA_FONTE_COPY_2":"18","TITULO_CTA_2":"Pedir meu cartão","LINK_CTA_2":"https://cartao-afinz.onelink.me/9ODN/mtuc2zhn?c=b2c_topo_de_funil_vibe&af_sub1=base_proprietaria&af_sub2=s4&af_sub3=b2c_email_vibe_bsp_S4D01","BANNER_1_CORPO":"","LINK_BANNER_1_CORPO":"","BANNER_2_CORPO":"","LINK_BANNER_2_CORPO":"","BANNER_3_CORPO":"","LINK_BANNER_3_CORPO":"","NOTA_LEGAL":"*Após realizar a primeira compra com o seu cartão com anuidade ativa, independentemente do valor, você receberá em até 5 dias úteis R$ 100 em créditos no App Vibe, com validade de até 6 meses. Para visualizar o seu saldo, baixe o App Vibe. A primeira compra deverá ser realizada em até 30 dias. / A cada fatura paga, com anuidade ativa, você receberá mais créditos no App Vibe, conforme condições da loja parceira, também com validade de até 6 meses. Os benefícios acumulados no app da Vibe podem ser trocados por descontos e vantagens das marcas parceiras. Eles são dinâmicos e podem ser alterados ou apresentados conforme as regras de elegibilidade de cada fornecedor parceiro. / Consulte o regulamento completo no app da Vibe. Promoção válida por tempo limitado, podendo ser alterada ou encerrada a qualquer momento, sem aviso prévio. / Sujeito a disponibilidade.","COR_NOTA_LEGAL":"#777777","TAMANHO_DA_FONTE_NOTA_LEGAL":"9","RODAPE":"Ouvidoria: 0800 772 0602<br>Enviado por Banco Afinz S.A. - Banco Múltiplo - CNPJ: 04.814.563/0001-74 | Afinz Instituição de Pagamento S.A. - CNPJ: 60.114.865/0001-00<br>Rua XV de Novembro, 45 - Sorocaba, SP"}'::jsonb, template_slot_id='b2c-classic-vibe-dynamic-v1', status='ready', version=version+1, updated_at=now()
where id='b2c00000-0000-4000-8000-000000000007'::uuid;

update public.dynamic_email_email_strategies set
role_in_ruler='Criar urgência de decisão',
email_objective='Recuperar quem ainda não converteu',
key_message='Ainda dá tempo de obter o cartão e seus benefícios',
expected_action='Solicitar agora',
value_proposition='Economia e créditos disponíveis após adesão',
primary_benefit='R$100 em Créditos Vibe',
secondary_benefits='["Créditos mensais", "Descontos em várias categorias"]'::jsonb,
objection_addressed='Continuar postergando',
proof='Benefícios repetidos de forma consistente na régua',
visual_hierarchy_strategy='Urgência no header e benefícios como sustentação',
cta_strategy='CTA com linguagem de ação imediata',
technical_status='ready',
editorial_status='ready',
visual_status='ready',
certification_status='not_tested',
field_provenance=coalesce(field_provenance,'{}'::jsonb)||'{"semantic_fields":"human_reference_migration"}'::jsonb,
version=version+1,
updated_at=now()
where campaign_group_id='b2c10000-0000-4000-8000-000000000007'::uuid;

update public.dynamic_email_briefings set
briefing_data='{"DT_INICIO":"09/01/2026 00:00:00","DT_FIM":"12/31/2028 23:59:59","UTM_CAMPANHA":"B2C_CLASSIC_VIBE_S4_D2","TP_CAMPANHA":"Aquisicao","SEQUENCIA":"E-mail 8","ASSUNTO":"ÚLTIMA CHANCE: ganhe até R$100 Créditos Vibe!","PRE_CABECALHO":"Concorra R$100 MIL todo mês e economize em +250 marcas. Aproveite!","HEADER":"https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/bcba23af-49bb-4435-a8e7-e66b8358c037.png","CARTAO_NM_COMERCIAL":"Afinz Visa","NM_PRODUTO_INTERNO":"INSTITUCIONAL","TITULO_COPY_1_AZUL":"Olá, %%=v(@FirstName)=%%","COR_COPY_1":"#00C6CC","TAMANHO_DA_FONTE_TITULO_COPY_1":"22","TITULO_CTA_1":"Quero meu cartão","LINK_CTA_1":"https://cartao-afinz.onelink.me/9ODN/mtuc2zhn?c=b2c_topo_de_funil_vibe&af_sub1=base_proprietaria&af_sub2=s4&af_sub3=b2c_email_vibe_bsp_S4D02","COPY_1_PRETO":"Com o <b>cartão Afinz</b> você ganha <b>Créditos Vibe</b> e economiza todo mês nas melhores marcas.","COR_COPY_PRETO_1":"#111111","TAMANHO_DA_FONTE_TITULO_COPY_PRETO_1":"19","TITULO_COPY_2":"Seus Créditos Vibe valem mais","COR_TITULO_COPY_2":"#00C6CC","TAMANHO_DA_FONTE_TITULO_COPY_2":"20","COPY_2_PRETO":"<table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"4\"><tr><td width=\"33%\"><img src=\"https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/7b74ae58-653d-4037-b494-1a04d89c4fc7.png\" width=\"150\" style=\"display:block;width:100%;height:auto;border:0\" alt=\"Benefício Vibe\"></td><td width=\"33%\"><img src=\"https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/481a91c2-9f6a-4d43-84bd-dd06d5db3cb8.png\" width=\"150\" style=\"display:block;width:100%;height:auto;border:0\" alt=\"Benefício Vibe\"></td><td width=\"33%\"><img src=\"https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/fe5a60a4-6a4c-454b-8681-3d5722951429.png\" width=\"150\" style=\"display:block;width:100%;height:auto;border:0\" alt=\"Benefício Vibe\"></td></tr></table><br>Aproveite mercado, cinema, moda, presentes e lazer. No Vibe Shop, use seus créditos para comprar com desconto no marketplace do App Vibe.","COR_COPY_2":"#111111","TAMANHO_DA_FONTE_COPY_2":"18","TITULO_CTA_2":"Pedir meu cartão","LINK_CTA_2":"https://cartao-afinz.onelink.me/9ODN/mtuc2zhn?c=b2c_topo_de_funil_vibe&af_sub1=base_proprietaria&af_sub2=s4&af_sub3=b2c_email_vibe_bsp_S4D02","BANNER_1_CORPO":"","LINK_BANNER_1_CORPO":"","BANNER_2_CORPO":"","LINK_BANNER_2_CORPO":"","BANNER_3_CORPO":"https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/dfcce93f-cd10-4245-aea6-2bd11ffc66e3.png","LINK_BANNER_3_CORPO":"","NOTA_LEGAL":"*Após realizar a primeira compra com o seu cartão com anuidade ativa, independentemente do valor, você receberá em até 5 dias úteis R$ 100 em créditos no App Vibe, com validade de até 6 meses. Para visualizar o seu saldo, baixe o App Vibe. A primeira compra deverá ser realizada em até 30 dias. / A cada fatura paga, com anuidade ativa, você receberá mais créditos no App Vibe, conforme condições da loja parceira, também com validade de até 6 meses. Os benefícios acumulados no app da Vibe podem ser trocados por descontos e vantagens das marcas parceiras. Eles são dinâmicos e podem ser alterados ou apresentados conforme as regras de elegibilidade de cada fornecedor parceiro. / Consulte o regulamento completo no app da Vibe. Promoção válida por tempo limitado, podendo ser alterada ou encerrada a qualquer momento, sem aviso prévio. / Sujeito a disponibilidade.","COR_NOTA_LEGAL":"#777777","TAMANHO_DA_FONTE_NOTA_LEGAL":"9","RODAPE":"Ouvidoria: 0800 772 0602<br>Enviado por Banco Afinz S.A. - Banco Múltiplo - CNPJ: 04.814.563/0001-74 | Afinz Instituição de Pagamento S.A. - CNPJ: 60.114.865/0001-00<br>Rua XV de Novembro, 45 - Sorocaba, SP"}'::jsonb, template_slot_id='b2c-classic-vibe-dynamic-v1', status='ready', version=version+1, updated_at=now()
where id='b2c00000-0000-4000-8000-000000000008'::uuid;

update public.dynamic_email_email_strategies set
role_in_ruler='Encerrar a régua com urgência',
email_objective='Capturar a conversão final',
key_message='Última oportunidade para acessar o ecossistema Afinz e Vibe',
expected_action='Pedir o cartão agora',
value_proposition='Cartão, créditos e marketplace em uma única proposta',
primary_benefit='Créditos Vibe para economizar',
secondary_benefits='["Mais de 250 marcas", "Vibe Shop", "Sorteio mensal"]'::jsonb,
objection_addressed='Não ver amplitude de uso',
proof='Categorias, marketplace e condições da oferta',
visual_hierarchy_strategy='Header de última chance e amplitude de uso',
cta_strategy='CTA final com máxima clareza e urgência',
technical_status='ready',
editorial_status='ready',
visual_status='ready',
certification_status='not_tested',
field_provenance=coalesce(field_provenance,'{}'::jsonb)||'{"semantic_fields":"human_reference_migration"}'::jsonb,
version=version+1,
updated_at=now()
where campaign_group_id='b2c10000-0000-4000-8000-000000000008'::uuid;

update public.dynamic_email_template_slots set status='archived', updated_at=now()
where id like 'b2c-classic-vibe-email-%-control';
