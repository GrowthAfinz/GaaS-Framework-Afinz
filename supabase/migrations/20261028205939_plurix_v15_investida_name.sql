-- V15 R3: corpo HTML preservado; nome da investida via variavel governada.
create temporary table investida_patch on commit drop as select * from jsonb_to_recordset($patch$[{"id":"00e3d8bc-cec4-467f-b64d-07906585f49d","version":1,"old_copy":"O <b>cartão de crédito +amigo</b> pode acompanhar você em muito mais momentos do que as compras no Paraná.<br>Com a bandeira Visa, ele é aceito em estabelecimentos no Brasil e no exterior e ainda traz <b>benefícios extras para você economizar</b> e cuidar da sua rotina.","new_copy":"O <b>cartão de crédito +amigo</b> pode acompanhar você em muito mais momentos do que as compras no %%=v(@NomeInvestida)=%%.<br>Com a bandeira Visa, ele é aceito em estabelecimentos no Brasil e no exterior e ainda traz <b>benefícios extras para você economizar</b> e cuidar da sua rotina."},{"id":"051f267d-9821-4493-af86-3407917c0df6","version":2,"old_copy":"Já pensou em aproveitar as melhores <b>vantagens e descontos dentro e fora do Supermercado</b>? Com o <b>cartão de crédito +amigo</b>, você pode <b>economizar em produtos selecionados</b> e ainda contar com benefícios que vão além das compras. Peça seu cartão e aproveite:","new_copy":"Já pensou em aproveitar as melhores <b>vantagens e descontos dentro e fora do %%=v(@NomeInvestida)=%%</b>? Com o <b>cartão de crédito +amigo</b>, você pode <b>economizar em produtos selecionados</b> e ainda contar com benefícios que vão além das compras. Peça seu cartão e aproveite:"},{"id":"0c8042e0-b542-4faa-a563-880edfbb6221","version":1,"old_copy":"Na hora de fazer as compras, <b>cada desconto conta!</b><br>Com o <b>cartão de crédito +amigo</b>, você pode aproveitar <b>vantagens extras</b> em produtos selecionados no Amigão.","new_copy":"Na hora de fazer as compras, <b>cada desconto conta!</b><br>Com o <b>cartão de crédito +amigo</b>, você pode aproveitar <b>vantagens extras</b> em produtos selecionados no %%=v(@NomeInvestida)=%%."},{"id":"0e6a4548-e2e9-4bc0-8a01-b5369e5a005c","version":2,"old_copy":"Já pensou em aproveitar as melhores <b>vantagens e descontos dentro e fora do Supermercado</b>? Com o <b>cartão de crédito +amigo</b>, você pode <b>economizar em produtos selecionados</b> e ainda contar com benefícios que vão além das compras. Peça seu cartão e aproveite:","new_copy":"Já pensou em aproveitar as melhores <b>vantagens e descontos dentro e fora do %%=v(@NomeInvestida)=%%</b>? Com o <b>cartão de crédito +amigo</b>, você pode <b>economizar em produtos selecionados</b> e ainda contar com benefícios que vão além das compras. Peça seu cartão e aproveite:"},{"id":"1b3f4e16-2f36-4a3a-a2f5-bc1a5d560ac1","version":1,"old_copy":"O <b>cartão de crédito +amigo</b> pode acompanhar você em muito mais momentos do que as compras no Avenida.<br>Com a bandeira Visa, ele é aceito em estabelecimentos no Brasil e no exterior e ainda traz <b>benefícios extras para você economizar</b> e cuidar da sua rotina.","new_copy":"O <b>cartão de crédito +amigo</b> pode acompanhar você em muito mais momentos do que as compras no %%=v(@NomeInvestida)=%%.<br>Com a bandeira Visa, ele é aceito em estabelecimentos no Brasil e no exterior e ainda traz <b>benefícios extras para você economizar</b> e cuidar da sua rotina."},{"id":"1c22d779-9938-439a-ac48-40799c50e29a","version":1,"old_copy":"O <b>cartão de crédito +amigo</b> pode acompanhar você em muito mais momentos do que as compras no seu supermercado.<br>Com a bandeira Visa, ele é aceito em estabelecimentos no Brasil e no exterior e ainda traz <b>benefícios extras para você economizar</b> e cuidar da sua rotina.","new_copy":"O <b>cartão de crédito +amigo</b> pode acompanhar você em muito mais momentos do que as compras no %%=v(@NomeInvestida)=%%.<br>Com a bandeira Visa, ele é aceito em estabelecimentos no Brasil e no exterior e ainda traz <b>benefícios extras para você economizar</b> e cuidar da sua rotina."},{"id":"202fe9a1-9a40-4c15-997b-676c059dc7f0","version":1,"old_copy":"O <b>cartão de crédito +amigo</b> pode acompanhar você em muito mais momentos do que as compras no seu supermercado.<br>Com a bandeira Visa, ele é aceito em estabelecimentos no Brasil e no exterior e ainda traz <b>benefícios extras para você economizar</b> e cuidar da sua rotina.","new_copy":"O <b>cartão de crédito +amigo</b> pode acompanhar você em muito mais momentos do que as compras no %%=v(@NomeInvestida)=%%.<br>Com a bandeira Visa, ele é aceito em estabelecimentos no Brasil e no exterior e ainda traz <b>benefícios extras para você economizar</b> e cuidar da sua rotina."},{"id":"211cb058-a7ba-4a04-b473-ac84f5356508","version":1,"old_copy":"Na hora de escolher como pagar suas compras, contar com <b>vantagens extras faz toda diferença.</b><br>O <b>cartão +amigo</b> foi feito para trazer mais possibilidades para sua rotina, com <b>DESCONTOS EXCLUSIVOS em produtos selecionados</b> no supermercado e benefícios para você aproveitar no dia a dia.","new_copy":"Na hora de escolher como pagar suas compras, contar com <b>vantagens extras faz toda diferença.</b><br>O <b>cartão +amigo</b> foi feito para trazer mais possibilidades para sua rotina, com <b>DESCONTOS EXCLUSIVOS em produtos selecionados</b> no %%=v(@NomeInvestida)=%% e benefícios para você aproveitar no dia a dia."},{"id":"2e7bf5f4-a2d3-4e5b-a06b-bee695d13f1a","version":1,"old_copy":"O <b>cartão de crédito +amigo</b> pode acompanhar você em muito mais momentos do que as compras no Amigão.<br>Com a bandeira Visa, ele é aceito em estabelecimentos no Brasil e no exterior e ainda traz <b>benefícios extras para você economizar</b> e cuidar da sua rotina.","new_copy":"O <b>cartão de crédito +amigo</b> pode acompanhar você em muito mais momentos do que as compras no %%=v(@NomeInvestida)=%%.<br>Com a bandeira Visa, ele é aceito em estabelecimentos no Brasil e no exterior e ainda traz <b>benefícios extras para você economizar</b> e cuidar da sua rotina."},{"id":"3ca0ce75-8b83-4d91-8684-4fa0125c53da","version":1,"old_copy":"Na hora de escolher como pagar suas compras, contar com <b>vantagens extras faz toda diferença.</b><br>O <b>cartão +amigo</b> foi feito para trazer mais possibilidades para sua rotina, com <b>DESCONTOS EXCLUSIVOS em produtos selecionados</b> no supermercado e benefícios para você aproveitar no dia a dia.","new_copy":"Na hora de escolher como pagar suas compras, contar com <b>vantagens extras faz toda diferença.</b><br>O <b>cartão +amigo</b> foi feito para trazer mais possibilidades para sua rotina, com <b>DESCONTOS EXCLUSIVOS em produtos selecionados</b> no %%=v(@NomeInvestida)=%% e benefícios para você aproveitar no dia a dia."},{"id":"4341e1e8-129b-4b10-b84d-28c4a38104e5","version":1,"old_copy":"Na hora de fazer as compras, <b>cada desconto conta!</b><br>Com o <b>cartão de crédito +amigo</b>, você pode aproveitar <b>vantagens extras</b> em produtos selecionados no Boa.","new_copy":"Na hora de fazer as compras, <b>cada desconto conta!</b><br>Com o <b>cartão de crédito +amigo</b>, você pode aproveitar <b>vantagens extras</b> em produtos selecionados no %%=v(@NomeInvestida)=%%."},{"id":"46388faf-2ba2-425a-87d5-501143c149d6","version":1,"old_copy":"Na hora de escolher como pagar suas compras, contar com <b>vantagens extras faz toda diferença.</b><br>O <b>cartão +amigo</b> foi feito para trazer mais possibilidades para sua rotina, com <b>DESCONTOS EXCLUSIVOS em produtos selecionados</b> no supermercado e benefícios para você aproveitar no dia a dia.","new_copy":"Na hora de escolher como pagar suas compras, contar com <b>vantagens extras faz toda diferença.</b><br>O <b>cartão +amigo</b> foi feito para trazer mais possibilidades para sua rotina, com <b>DESCONTOS EXCLUSIVOS em produtos selecionados</b> no %%=v(@NomeInvestida)=%% e benefícios para você aproveitar no dia a dia."},{"id":"529fe401-71eb-43ac-8244-b3214ff7ac04","version":1,"old_copy":"Na hora de escolher como pagar suas compras, contar com <b>vantagens extras faz toda diferença.</b><br>O <b>cartão +amigo</b> foi feito para trazer mais possibilidades para sua rotina, com <b>DESCONTOS EXCLUSIVOS em produtos selecionados</b> no supermercado e benefícios para você aproveitar no dia a dia.","new_copy":"Na hora de escolher como pagar suas compras, contar com <b>vantagens extras faz toda diferença.</b><br>O <b>cartão +amigo</b> foi feito para trazer mais possibilidades para sua rotina, com <b>DESCONTOS EXCLUSIVOS em produtos selecionados</b> no %%=v(@NomeInvestida)=%% e benefícios para você aproveitar no dia a dia."},{"id":"63ef6145-8cc8-4cc2-80b3-d9be02288dd8","version":1,"old_copy":"Na hora de fazer as compras, <b>cada desconto conta!</b><br>Com o <b>cartão de crédito +amigo</b>, você pode aproveitar <b>vantagens extras</b> em produtos selecionados no Avenida.","new_copy":"Na hora de fazer as compras, <b>cada desconto conta!</b><br>Com o <b>cartão de crédito +amigo</b>, você pode aproveitar <b>vantagens extras</b> em produtos selecionados no %%=v(@NomeInvestida)=%%."},{"id":"67185cd4-6949-4f8e-b54a-d5dc085b5b88","version":1,"old_copy":"O <b>cartão de crédito +amigo</b> pode acompanhar você em muito mais momentos do que as compras no Boa.<br>Com a bandeira Visa, ele é aceito em estabelecimentos no Brasil e no exterior e ainda traz <b>benefícios extras para você economizar</b> e cuidar da sua rotina.","new_copy":"O <b>cartão de crédito +amigo</b> pode acompanhar você em muito mais momentos do que as compras no %%=v(@NomeInvestida)=%%.<br>Com a bandeira Visa, ele é aceito em estabelecimentos no Brasil e no exterior e ainda traz <b>benefícios extras para você economizar</b> e cuidar da sua rotina."},{"id":"6b892bb0-4576-4494-af53-3d9f24df5b1f","version":2,"old_copy":"Já pensou em aproveitar as melhores <b>vantagens e descontos dentro e fora do Supermercado</b>? Com o <b>cartão de crédito +amigo</b>, você pode <b>economizar em produtos selecionados</b> e ainda contar com benefícios que vão além das compras. Peça seu cartão e aproveite:","new_copy":"Já pensou em aproveitar as melhores <b>vantagens e descontos dentro e fora do %%=v(@NomeInvestida)=%%</b>? Com o <b>cartão de crédito +amigo</b>, você pode <b>economizar em produtos selecionados</b> e ainda contar com benefícios que vão além das compras. Peça seu cartão e aproveite:"},{"id":"7ae362ef-2538-4af0-b715-002170c38f50","version":1,"old_copy":"Na hora de fazer as compras, <b>cada desconto conta!</b><br>Com o <b>cartão de crédito +amigo</b>, você pode aproveitar <b>vantagens extras</b> em produtos selecionados no Paraná.","new_copy":"Na hora de fazer as compras, <b>cada desconto conta!</b><br>Com o <b>cartão de crédito +amigo</b>, você pode aproveitar <b>vantagens extras</b> em produtos selecionados no %%=v(@NomeInvestida)=%%."},{"id":"a0a9375e-adf7-48fe-8dc9-a1a9646f97d6","version":2,"old_copy":"Já pensou em aproveitar as melhores <b>vantagens e descontos dentro e fora do Supermercado</b>? Com o <b>cartão de crédito +amigo</b>, você pode <b>economizar em produtos selecionados</b> e ainda contar com benefícios que vão além das compras. Peça seu cartão e aproveite:","new_copy":"Já pensou em aproveitar as melhores <b>vantagens e descontos dentro e fora do %%=v(@NomeInvestida)=%%</b>? Com o <b>cartão de crédito +amigo</b>, você pode <b>economizar em produtos selecionados</b> e ainda contar com benefícios que vão além das compras. Peça seu cartão e aproveite:"},{"id":"a84b182d-fa9f-458f-b7f5-425d3bdc1173","version":1,"old_copy":"Na hora de escolher como pagar suas compras, contar com <b>vantagens extras faz toda diferença.</b><br>O <b>cartão +amigo</b> foi feito para trazer mais possibilidades para sua rotina, com <b>DESCONTOS EXCLUSIVOS em produtos selecionados</b> no supermercado e benefícios para você aproveitar no dia a dia.","new_copy":"Na hora de escolher como pagar suas compras, contar com <b>vantagens extras faz toda diferença.</b><br>O <b>cartão +amigo</b> foi feito para trazer mais possibilidades para sua rotina, com <b>DESCONTOS EXCLUSIVOS em produtos selecionados</b> no %%=v(@NomeInvestida)=%% e benefícios para você aproveitar no dia a dia."},{"id":"ac7f4655-0e07-4a07-802d-62148bae9dbe","version":1,"old_copy":"Na hora de escolher como pagar suas compras, contar com <b>vantagens extras faz toda diferença.</b><br>O <b>cartão +amigo</b> foi feito para trazer mais possibilidades para sua rotina, com <b>DESCONTOS EXCLUSIVOS em produtos selecionados</b> no supermercado e benefícios para você aproveitar no dia a dia.","new_copy":"Na hora de escolher como pagar suas compras, contar com <b>vantagens extras faz toda diferença.</b><br>O <b>cartão +amigo</b> foi feito para trazer mais possibilidades para sua rotina, com <b>DESCONTOS EXCLUSIVOS em produtos selecionados</b> no %%=v(@NomeInvestida)=%% e benefícios para você aproveitar no dia a dia."},{"id":"bf71014f-e267-4419-a4d9-ab84c261244e","version":1,"old_copy":"Na hora de fazer as compras, <b>cada desconto conta!</b><br>Com o <b>cartão de crédito +amigo</b>, você pode aproveitar <b>vantagens extras</b> em produtos selecionados no seu supermercado.","new_copy":"Na hora de fazer as compras, <b>cada desconto conta!</b><br>Com o <b>cartão de crédito +amigo</b>, você pode aproveitar <b>vantagens extras</b> em produtos selecionados no %%=v(@NomeInvestida)=%%."},{"id":"c74b9657-62fc-452f-88fd-0c2066d34d53","version":2,"old_copy":"Já pensou em aproveitar as melhores <b>vantagens e descontos dentro e fora do Supermercado</b>? Com o <b>cartão de crédito +amigo</b>, você pode <b>economizar em produtos selecionados</b> e ainda contar com benefícios que vão além das compras. Peça seu cartão e aproveite:","new_copy":"Já pensou em aproveitar as melhores <b>vantagens e descontos dentro e fora do %%=v(@NomeInvestida)=%%</b>? Com o <b>cartão de crédito +amigo</b>, você pode <b>economizar em produtos selecionados</b> e ainda contar com benefícios que vão além das compras. Peça seu cartão e aproveite:"},{"id":"ccf4a581-0d42-4772-808d-5100af042820","version":2,"old_copy":"Já pensou em aproveitar as melhores <b>vantagens e descontos dentro e fora do Supermercado</b>? Com o <b>cartão de crédito +amigo</b>, você pode <b>economizar em produtos selecionados</b> e ainda contar com benefícios que vão além das compras. Peça seu cartão e aproveite:","new_copy":"Já pensou em aproveitar as melhores <b>vantagens e descontos dentro e fora do %%=v(@NomeInvestida)=%%</b>? Com o <b>cartão de crédito +amigo</b>, você pode <b>economizar em produtos selecionados</b> e ainda contar com benefícios que vão além das compras. Peça seu cartão e aproveite:"},{"id":"f244536c-f695-46e5-bcc9-85167d4f3334","version":1,"old_copy":"Na hora de fazer as compras, <b>cada desconto conta!</b><br>Com o <b>cartão de crédito +amigo</b>, você pode aproveitar <b>vantagens extras</b> em produtos selecionados no seu supermercado.","new_copy":"Na hora de fazer as compras, <b>cada desconto conta!</b><br>Com o <b>cartão de crédito +amigo</b>, você pode aproveitar <b>vantagens extras</b> em produtos selecionados no %%=v(@NomeInvestida)=%%."}]$patch$::jsonb) as p(id uuid,version integer,old_copy text,new_copy text);
do $guard$ begin
 if (select md5(source) from public.dynamic_email_template_slots where id='builtin-plurix-v15') is distinct from '0e0e640d1f2e2496764744640a14aa0a' then raise exception 'V15 mudou desde a revisao';end if;
 if (select count(*) from public.dynamic_email_briefings b join investida_patch p on p.id=b.id where b.segment='V3 TOPO DE FUNIL DINÂMICO' and b.version=p.version and b.briefing_data->>'COPY_1_PRETO'=p.old_copy)<>24 then raise exception 'V3 mudou desde a revisao';end if;
end $guard$;
insert into public.dynamic_email_briefing_versions(briefing_id,version,snapshot,change_summary,warnings,saved_by)
select b.id,b.version,to_jsonb(b),'Snapshot anterior a V15 R3: referencia da investida','[]'::jsonb,null from public.dynamic_email_briefings b join investida_patch p on p.id=b.id on conflict(briefing_id,version) do nothing;
update public.dynamic_email_template_slots set source=$v15$%%[
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
/* V15 R3: nome de exibicao da investida; PRODUTO segue como chave tecnica. */
SET @NomeInvestida = ""
IF @Produto == "AMIGAO" THEN
  SET @NomeInvestida = "Amigão"
ELSEIF @Produto == "BOA" THEN
  SET @NomeInvestida = "Boa"
ELSEIF @Produto == "AVENIDA" THEN
  SET @NomeInvestida = "Avenida"
ELSEIF @Produto == "COMPRE MAIS" THEN
  SET @NomeInvestida = "Compre Mais"
ELSEIF @Produto == "PARANA" THEN
  SET @NomeInvestida = "Paraná"
ELSEIF @Produto == "SUPERPAO" THEN
  SET @NomeInvestida = "Superpão"
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
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
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
  
/* V15 revision 2: explicit paired light theme, including Outlook's own attributes. */
@media (prefers-color-scheme: dark) {
.v15-surface-ffffff,[bgcolor="#ffffff"],[data-ogsb="#ffffff"],[style*="background-color:#ffffff;"] {background-color:#ffffff !important;background:#ffffff linear-gradient(#ffffff,#ffffff) repeat !important;}
.v15-surface-f2f4f7,[bgcolor="#f2f4f7"],[data-ogsb="#f2f4f7"],[style*="background-color:#f2f4f7;"] {background-color:#f2f4f7 !important;background:#f2f4f7 linear-gradient(#f2f4f7,#f2f4f7) repeat !important;}
.v15-surface-f6f6fb,[bgcolor="#F6F6FB"],[data-ogsb="#F6F6FB"],[style*="background-color:#F6F6FB;"] {background-color:#F6F6FB !important;background:#F6F6FB linear-gradient(#F6F6FB,#F6F6FB) repeat !important;}
.v15-surface-f4f5fb,[bgcolor="#F4F5FB"],[data-ogsb="#F4F5FB"],[style*="background-color:#F4F5FB;"] {background-color:#F4F5FB !important;background:#F4F5FB linear-gradient(#F4F5FB,#F4F5FB) repeat !important;}
.v15-surface-eef1f5,[bgcolor="#eef1f5"],[data-ogsb="#eef1f5"],[style*="background-color:#eef1f5;"] {background-color:#eef1f5 !important;background:#eef1f5 linear-gradient(#eef1f5,#eef1f5) repeat !important;}
.v15-surface-e7a921,[bgcolor="#E7A921"],[data-ogsb="#E7A921"],[style*="background-color:#E7A921;"] {background-color:#E7A921 !important;background:#E7A921 linear-gradient(#E7A921,#E7A921) repeat !important;}
.v15-surface-2c3490,[bgcolor="#2C3490"],[data-ogsb="#2C3490"],[style*="background-color:#2C3490;"] {background-color:#2C3490 !important;background:#2C3490 linear-gradient(#2C3490,#2C3490) repeat !important;}
.v15-surface-343b61,[bgcolor="#343B61"],[data-ogsb="#343B61"],[style*="background-color:#343B61;"] {background-color:#343B61 !important;background:#343B61 linear-gradient(#343B61,#343B61) repeat !important;}
.v15-surface-4a5ba6,[bgcolor="#4A5BA6"],[data-ogsb="#4A5BA6"],[style*="background-color:#4A5BA6;"] {background-color:#4A5BA6 !important;background:#4A5BA6 linear-gradient(#4A5BA6,#4A5BA6) repeat !important;}
.v15-copy-title {color:%%=v(@CorCopy1)=%% !important;-webkit-text-fill-color:%%=v(@CorCopy1)=%% !important;}
.v15-copy-main {color:%%=v(@CorCopyPreto1)=%% !important;-webkit-text-fill-color:%%=v(@CorCopyPreto1)=%% !important;}
.v15-copy-title2 {color:%%=v(@CorTituloCopy2)=%% !important;-webkit-text-fill-color:%%=v(@CorTituloCopy2)=%% !important;}
.v15-copy-second {color:%%=v(@CorCopy2)=%% !important;-webkit-text-fill-color:%%=v(@CorCopy2)=%% !important;}
.v15-copy-legal {color:%%=v(@CorNotaLegal)=%% !important;-webkit-text-fill-color:%%=v(@CorNotaLegal)=%% !important;}
[data-ogsc="#242424"],[style*="color:#242424;"] {color:#242424 !important;-webkit-text-fill-color:#242424 !important;}
[data-ogsc="#2C3490"],[style*="color:#2C3490;"] {color:#2C3490 !important;-webkit-text-fill-color:#2C3490 !important;}
[data-ogsc="#4A4F6A"],[style*="color:#4A4F6A;"] {color:#4A4F6A !important;-webkit-text-fill-color:#4A4F6A !important;}
[data-ogsc="#454A64"],[style*="color:#454A64;"] {color:#454A64 !important;-webkit-text-fill-color:#454A64 !important;}
[data-ogsc="#5A607F"],[style*="color:#5A607F;"] {color:#5A607F !important;-webkit-text-fill-color:#5A607F !important;}
[data-ogsc="#6b7280"],[style*="color:#6b7280;"] {color:#6b7280 !important;-webkit-text-fill-color:#6b7280 !important;}
[data-ogsc="#8A8FA8"],[style*="color:#8A8FA8;"] {color:#8A8FA8 !important;-webkit-text-fill-color:#8A8FA8 !important;}
[data-ogsc="#ffffff"],[style*="color:#ffffff;"] {color:#ffffff !important;-webkit-text-fill-color:#ffffff !important;}
.brand-text,.brand-text * {color:#ffffff !important;-webkit-text-fill-color:#ffffff !important;}
}
[data-ogsb] .v15-surface-ffffff,.v15-surface-ffffff[data-ogsb],[data-ogsb] [bgcolor="#ffffff"],[bgcolor="#ffffff"][data-ogsb],[data-ogsb] [data-ogsb="#ffffff"],[data-ogsb="#ffffff"][data-ogsb],[data-ogsb] [style*="background-color:#ffffff;"],[style*="background-color:#ffffff;"][data-ogsb] {background-color:#ffffff !important;background:#ffffff linear-gradient(#ffffff,#ffffff) repeat !important;}
[data-ogsb] .v15-surface-f2f4f7,.v15-surface-f2f4f7[data-ogsb],[data-ogsb] [bgcolor="#f2f4f7"],[bgcolor="#f2f4f7"][data-ogsb],[data-ogsb] [data-ogsb="#f2f4f7"],[data-ogsb="#f2f4f7"][data-ogsb],[data-ogsb] [style*="background-color:#f2f4f7;"],[style*="background-color:#f2f4f7;"][data-ogsb] {background-color:#f2f4f7 !important;background:#f2f4f7 linear-gradient(#f2f4f7,#f2f4f7) repeat !important;}
[data-ogsb] .v15-surface-f6f6fb,.v15-surface-f6f6fb[data-ogsb],[data-ogsb] [bgcolor="#F6F6FB"],[bgcolor="#F6F6FB"][data-ogsb],[data-ogsb] [data-ogsb="#F6F6FB"],[data-ogsb="#F6F6FB"][data-ogsb],[data-ogsb] [style*="background-color:#F6F6FB;"],[style*="background-color:#F6F6FB;"][data-ogsb] {background-color:#F6F6FB !important;background:#F6F6FB linear-gradient(#F6F6FB,#F6F6FB) repeat !important;}
[data-ogsb] .v15-surface-f4f5fb,.v15-surface-f4f5fb[data-ogsb],[data-ogsb] [bgcolor="#F4F5FB"],[bgcolor="#F4F5FB"][data-ogsb],[data-ogsb] [data-ogsb="#F4F5FB"],[data-ogsb="#F4F5FB"][data-ogsb],[data-ogsb] [style*="background-color:#F4F5FB;"],[style*="background-color:#F4F5FB;"][data-ogsb] {background-color:#F4F5FB !important;background:#F4F5FB linear-gradient(#F4F5FB,#F4F5FB) repeat !important;}
[data-ogsb] .v15-surface-eef1f5,.v15-surface-eef1f5[data-ogsb],[data-ogsb] [bgcolor="#eef1f5"],[bgcolor="#eef1f5"][data-ogsb],[data-ogsb] [data-ogsb="#eef1f5"],[data-ogsb="#eef1f5"][data-ogsb],[data-ogsb] [style*="background-color:#eef1f5;"],[style*="background-color:#eef1f5;"][data-ogsb] {background-color:#eef1f5 !important;background:#eef1f5 linear-gradient(#eef1f5,#eef1f5) repeat !important;}
[data-ogsb] .v15-surface-e7a921,.v15-surface-e7a921[data-ogsb],[data-ogsb] [bgcolor="#E7A921"],[bgcolor="#E7A921"][data-ogsb],[data-ogsb] [data-ogsb="#E7A921"],[data-ogsb="#E7A921"][data-ogsb],[data-ogsb] [style*="background-color:#E7A921;"],[style*="background-color:#E7A921;"][data-ogsb] {background-color:#E7A921 !important;background:#E7A921 linear-gradient(#E7A921,#E7A921) repeat !important;}
[data-ogsb] .v15-surface-2c3490,.v15-surface-2c3490[data-ogsb],[data-ogsb] [bgcolor="#2C3490"],[bgcolor="#2C3490"][data-ogsb],[data-ogsb] [data-ogsb="#2C3490"],[data-ogsb="#2C3490"][data-ogsb],[data-ogsb] [style*="background-color:#2C3490;"],[style*="background-color:#2C3490;"][data-ogsb] {background-color:#2C3490 !important;background:#2C3490 linear-gradient(#2C3490,#2C3490) repeat !important;}
[data-ogsb] .v15-surface-343b61,.v15-surface-343b61[data-ogsb],[data-ogsb] [bgcolor="#343B61"],[bgcolor="#343B61"][data-ogsb],[data-ogsb] [data-ogsb="#343B61"],[data-ogsb="#343B61"][data-ogsb],[data-ogsb] [style*="background-color:#343B61;"],[style*="background-color:#343B61;"][data-ogsb] {background-color:#343B61 !important;background:#343B61 linear-gradient(#343B61,#343B61) repeat !important;}
[data-ogsb] .v15-surface-4a5ba6,.v15-surface-4a5ba6[data-ogsb],[data-ogsb] [bgcolor="#4A5BA6"],[bgcolor="#4A5BA6"][data-ogsb],[data-ogsb] [data-ogsb="#4A5BA6"],[data-ogsb="#4A5BA6"][data-ogsb],[data-ogsb] [style*="background-color:#4A5BA6;"],[style*="background-color:#4A5BA6;"][data-ogsb] {background-color:#4A5BA6 !important;background:#4A5BA6 linear-gradient(#4A5BA6,#4A5BA6) repeat !important;}
[data-ogsc] .v15-copy-title,.v15-copy-title[data-ogsc] {color:%%=v(@CorCopy1)=%% !important;-webkit-text-fill-color:%%=v(@CorCopy1)=%% !important;}
[data-ogsc] .v15-copy-main,.v15-copy-main[data-ogsc] {color:%%=v(@CorCopyPreto1)=%% !important;-webkit-text-fill-color:%%=v(@CorCopyPreto1)=%% !important;}
[data-ogsc] .v15-copy-title2,.v15-copy-title2[data-ogsc] {color:%%=v(@CorTituloCopy2)=%% !important;-webkit-text-fill-color:%%=v(@CorTituloCopy2)=%% !important;}
[data-ogsc] .v15-copy-second,.v15-copy-second[data-ogsc] {color:%%=v(@CorCopy2)=%% !important;-webkit-text-fill-color:%%=v(@CorCopy2)=%% !important;}
[data-ogsc] .v15-copy-legal,.v15-copy-legal[data-ogsc] {color:%%=v(@CorNotaLegal)=%% !important;-webkit-text-fill-color:%%=v(@CorNotaLegal)=%% !important;}
[data-ogsc] [data-ogsc="#242424"],[data-ogsc="#242424"][data-ogsc],[data-ogsc] [style*="color:#242424;"],[style*="color:#242424;"][data-ogsc] {color:#242424 !important;-webkit-text-fill-color:#242424 !important;}
[data-ogsc] [data-ogsc="#2C3490"],[data-ogsc="#2C3490"][data-ogsc],[data-ogsc] [style*="color:#2C3490;"],[style*="color:#2C3490;"][data-ogsc] {color:#2C3490 !important;-webkit-text-fill-color:#2C3490 !important;}
[data-ogsc] [data-ogsc="#4A4F6A"],[data-ogsc="#4A4F6A"][data-ogsc],[data-ogsc] [style*="color:#4A4F6A;"],[style*="color:#4A4F6A;"][data-ogsc] {color:#4A4F6A !important;-webkit-text-fill-color:#4A4F6A !important;}
[data-ogsc] [data-ogsc="#454A64"],[data-ogsc="#454A64"][data-ogsc],[data-ogsc] [style*="color:#454A64;"],[style*="color:#454A64;"][data-ogsc] {color:#454A64 !important;-webkit-text-fill-color:#454A64 !important;}
[data-ogsc] [data-ogsc="#5A607F"],[data-ogsc="#5A607F"][data-ogsc],[data-ogsc] [style*="color:#5A607F;"],[style*="color:#5A607F;"][data-ogsc] {color:#5A607F !important;-webkit-text-fill-color:#5A607F !important;}
[data-ogsc] [data-ogsc="#6b7280"],[data-ogsc="#6b7280"][data-ogsc],[data-ogsc] [style*="color:#6b7280;"],[style*="color:#6b7280;"][data-ogsc] {color:#6b7280 !important;-webkit-text-fill-color:#6b7280 !important;}
[data-ogsc] [data-ogsc="#8A8FA8"],[data-ogsc="#8A8FA8"][data-ogsc],[data-ogsc] [style*="color:#8A8FA8;"],[style*="color:#8A8FA8;"][data-ogsc] {color:#8A8FA8 !important;-webkit-text-fill-color:#8A8FA8 !important;}
[data-ogsc] [data-ogsc="#ffffff"],[data-ogsc="#ffffff"][data-ogsc],[data-ogsc] [style*="color:#ffffff;"],[style*="color:#ffffff;"][data-ogsc] {color:#ffffff !important;-webkit-text-fill-color:#ffffff !important;}
[data-ogsc] .brand-text,.brand-text[data-ogsc],[data-ogsc] .brand-text *,.brand-text *[data-ogsc] {color:#ffffff !important;-webkit-text-fill-color:#ffffff !important;}
</style>
</head>
<u></u>
<body class="v15-surface-f2f4f7 body" style="background-color:#f2f4f7;background:#f2f4f7 linear-gradient(#f2f4f7,#f2f4f7) repeat;color-scheme:light only; margin:0; padding:0; background-color:#f2f4f7; background:#f2f4f7 linear-gradient(#f2f4f7,#f2f4f7) repeat; font-family:Arial, Helvetica, sans-serif; color:#242424; -webkit-text-fill-color:#242424;" bgcolor="#f2f4f7">
  <div style="display:none; max-height:0; overflow:hidden; opacity:0; color:transparent; -webkit-text-fill-color:transparent; mso-hide:all;">
    %%=TreatAsContent(@PreCabecalho)=%%&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f2f4f7;background:#f2f4f7 linear-gradient(#f2f4f7,#f2f4f7) repeat;table-layout:fixed; width:100%; background-color:#f2f4f7; background:#f2f4f7 linear-gradient(#f2f4f7,#f2f4f7) repeat;" class="v15-surface-f2f4f7" bgcolor="#f2f4f7">
    <tr>
      <td align="center" style="background-color:#ffffff;background:#ffffff linear-gradient(#ffffff,#ffffff) repeat;padding:18px 10px;" class="v15-surface-ffffff" bgcolor="#ffffff">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" class="v15-surface-ffffff email-shell" style="background-color:#ffffff;background:#ffffff linear-gradient(#ffffff,#ffffff) repeat;width:100%; table-layout:fixed; overflow-wrap:anywhere; max-width:600px; background-color:#ffffff; background:#ffffff linear-gradient(#ffffff,#ffffff) repeat; border-radius:12px; overflow:hidden;" bgcolor="#ffffff">
          <tr>
            <td style="background-color:#ffffff;background:#ffffff linear-gradient(#ffffff,#ffffff) repeat;padding:0;line-height:0;font-size:0;" class="v15-surface-ffffff" bgcolor="#ffffff">
              <img class="header-image" src="%%=v(@Header)=%%" alt="%%=v(@HdrTitulo)=%% %%=v(@HdrSubtitulo)=%%" width="600" style="display:block;width:100%;max-width:600px;height:auto;border:0;">
            </td>
          </tr>
          %%[ IF NOT EMPTY(@HdrLogo) THEN ]%%
          <tr><td align="left" bgcolor="#4A5BA6" style="background-color:#4A5BA6;background:#4A5BA6 linear-gradient(#4A5BA6,#4A5BA6) repeat;padding:0 20px 12px;background-color:#4A5BA6;line-height:0;" class="v15-surface-4a5ba6">
            <img src="%%=v(@HdrLogo)=%%" alt="Rede participante" width="80" style="display:block;width:80px;max-width:100%;height:auto;border:0;">
          </td></tr>
          %%[ ENDIF ]%%
          %%[ IF NOT EMPTY(@FaixaLimite) THEN ]%%
          <!-- V12: faixa de limite pré-aprovado, texto da coluna MENSAGEM_LIMITE -->
          <tr>
            %%[ IF @Sequencia == "E-mail 2" OR @Sequencia == "E-mail 4" OR @Sequencia == "E-mail 6" OR @Sequencia == "E-mail 8" THEN ]%%
            <td align="center" class="v15-surface-343b61 content-pad brand-even" bgcolor="#343B61" style="background-color:#343B61;background:#343B61 linear-gradient(#343B61,#343B61) repeat;padding:14px 32px; background-color:#343B61; background:#343B61 linear-gradient(#343B61,#343B61) repeat;">
            %%[ ELSE ]%%
            <td align="center" class="v15-surface-2c3490 content-pad brand-odd" bgcolor="#2C3490" style="background-color:#2C3490;background:#2C3490 linear-gradient(#2C3490,#2C3490) repeat;padding:14px 32px; background-color:#2C3490; background:#2C3490 linear-gradient(#2C3490,#2C3490) repeat;">
            %%[ ENDIF ]%%
              <div class="brand-text" style="max-width:520px; margin:0 auto; color:#ffffff; -webkit-text-fill-color:#ffffff; font-size:16px; line-height:1.45; font-weight:700; text-align:center;">%%=v(@FaixaLimite)=%%</div>
            </td>
          </tr>
          %%[ ENDIF ]%%
          %%[ IF @Sequencia == "E-mail 1" THEN ]%%
          <!-- E-mail 1: descoberta dos benefícios e passo a passo -->
          <tr>
            <td align="center" class="v15-surface-ffffff content-pad" style="background-color:#ffffff;background:#ffffff linear-gradient(#ffffff,#ffffff) repeat;padding:30px 32px 8px 32px; text-align:center;" bgcolor="#ffffff">
              %%[ IF NOT EMPTY(@TituloCopy1) THEN ]%%
              <h1 class="v15-copy-title headline" style="max-width:500px; margin:0 auto 16px auto; color:%%=v(@CorCopy1)=%%; -webkit-text-fill-color:%%=v(@CorCopy1)=%%; font-size:%%=v(@TamanhoFonteTituloCopy1)=%%px; line-height:1.25; font-weight:700; text-align:center;">%%=TreatAsContent(Replace(Replace(Replace(Replace(Replace(Replace(Replace(Replace(Replace(Replace(Replace(@TituloCopy1, "background-color:#F4F5FB;", "background-color:#F4F5FB;background:#F4F5FB linear-gradient(#F4F5FB,#F4F5FB) repeat;"), "background:#F4F5FB;", "background:#F4F5FB;background:#F4F5FB linear-gradient(#F4F5FB,#F4F5FB) repeat;"), "background-color:#E7A921;", "background-color:#E7A921;background:#E7A921 linear-gradient(#E7A921,#E7A921) repeat;"), "background:#E7A921;", "background:#E7A921;background:#E7A921 linear-gradient(#E7A921,#E7A921) repeat;"), "background-color:#ffffff;", "background-color:#ffffff;background:#ffffff linear-gradient(#ffffff,#ffffff) repeat;"), "background:#ffffff;", "background:#ffffff;background:#ffffff linear-gradient(#ffffff,#ffffff) repeat;"), "background-color:#F6F6FB;", "background-color:#F6F6FB;background:#F6F6FB linear-gradient(#F6F6FB,#F6F6FB) repeat;"), "background:#F6F6FB;", "background:#F6F6FB;background:#F6F6FB linear-gradient(#F6F6FB,#F6F6FB) repeat;"), "color:#242424;", "color:#242424;-webkit-text-fill-color:#242424;"), "color:#2C3490;", "color:#2C3490;-webkit-text-fill-color:#2C3490;"), "color:#4A4F6A;", "color:#4A4F6A;-webkit-text-fill-color:#4A4F6A;"))=%%</h1>
              %%[ ENDIF ]%%
              %%[ IF NOT EMPTY(@Copy1Preto) THEN ]%%
              <div class="v15-copy-main body-copy" style="max-width:500px; margin:0 auto; color:%%=v(@CorCopyPreto1)=%%; -webkit-text-fill-color:%%=v(@CorCopyPreto1)=%%; font-size:%%=v(@TamanhoFonteCopyPreto1)=%%px; line-height:1.55; text-align:center;">%%=TreatAsContent(Replace(Replace(Replace(Replace(Replace(Replace(Replace(Replace(Replace(Replace(Replace(@Copy1Preto, "background-color:#F4F5FB;", "background-color:#F4F5FB;background:#F4F5FB linear-gradient(#F4F5FB,#F4F5FB) repeat;"), "background:#F4F5FB;", "background:#F4F5FB;background:#F4F5FB linear-gradient(#F4F5FB,#F4F5FB) repeat;"), "background-color:#E7A921;", "background-color:#E7A921;background:#E7A921 linear-gradient(#E7A921,#E7A921) repeat;"), "background:#E7A921;", "background:#E7A921;background:#E7A921 linear-gradient(#E7A921,#E7A921) repeat;"), "background-color:#ffffff;", "background-color:#ffffff;background:#ffffff linear-gradient(#ffffff,#ffffff) repeat;"), "background:#ffffff;", "background:#ffffff;background:#ffffff linear-gradient(#ffffff,#ffffff) repeat;"), "background-color:#F6F6FB;", "background-color:#F6F6FB;background:#F6F6FB linear-gradient(#F6F6FB,#F6F6FB) repeat;"), "background:#F6F6FB;", "background:#F6F6FB;background:#F6F6FB linear-gradient(#F6F6FB,#F6F6FB) repeat;"), "color:#242424;", "color:#242424;-webkit-text-fill-color:#242424;"), "color:#2C3490;", "color:#2C3490;-webkit-text-fill-color:#2C3490;"), "color:#4A4F6A;", "color:#4A4F6A;-webkit-text-fill-color:#4A4F6A;"))=%%</div>
              %%[ ENDIF ]%%
            </td>
          </tr>
          %%[ IF NOT EMPTY(@TituloCTA1) AND NOT EMPTY(@LinkCTA1) THEN ]%%
          <tr>
            <td align="center" class="v15-surface-ffffff content-pad cta-cell" style="background-color:#ffffff;background:#ffffff linear-gradient(#ffffff,#ffffff) repeat;padding:14px 32px 30px 32px;" bgcolor="#ffffff">
              <a class="brand-text brand-odd cta-link" href="%%=RedirectTo(TreatAsContent(@LinkCTA1))=%%" target="_blank" style="display:inline-block; min-width:0; max-width:100%; box-sizing:border-box; border-radius:10px; background-color:#2C3490; background:#2C3490 linear-gradient(#2C3490,#2C3490) repeat; color:#ffffff; -webkit-text-fill-color:#ffffff; padding:15px 26px; font-size:15px; line-height:20px; text-align:center; text-decoration:none; font-weight:700;">%%=TreatAsContent(@TituloCTA1)=%%</a>
            </td>
          </tr>
          %%[ ENDIF ]%%
          %%[ IF NOT EMPTY(@Banner1Corpo) THEN ]%%
          <tr>
            <td align="center" class="v15-surface-ffffff content-pad" style="background-color:#ffffff;background:#ffffff linear-gradient(#ffffff,#ffffff) repeat;padding:16px 32px 4px 32px;" bgcolor="#ffffff">
              %%[ IF NOT EMPTY(@LinkBanner1) THEN ]%%<a href="%%=RedirectTo(TreatAsContent(@LinkBanner1))=%%" target="_blank" style="text-decoration:none;">%%[ ENDIF ]%%
              <img src="%%=v(@Banner1Corpo)=%%" alt="Benefícios do cartão +amigo" width="536" style="display:block; width:100%; max-width:536px; height:auto; border:0;">
              %%[ IF NOT EMPTY(@LinkBanner1) THEN ]%%</a>%%[ ENDIF ]%%
            </td>
          </tr>
          %%[ ENDIF ]%%
          %%[ IF NOT EMPTY(@TituloCopy2) THEN ]%%
          <tr>
            <td align="center" bgcolor="#F6F6FB" class="v15-surface-f6f6fb content-pad" style="background-color:#F6F6FB;background:#F6F6FB linear-gradient(#F6F6FB,#F6F6FB) repeat;padding:26px 32px 24px 32px; background-color:#F6F6FB; background:#F6F6FB linear-gradient(#F6F6FB,#F6F6FB) repeat;">
              <h2 class="v15-copy-title2 headline" style="max-width:500px; margin:0 auto 18px auto; color:%%=v(@CorTituloCopy2)=%%; -webkit-text-fill-color:%%=v(@CorTituloCopy2)=%%; font-size:%%=v(@TamanhoFonteTituloCopy2)=%%px; line-height:1.25; font-weight:700; text-align:center;">%%=TreatAsContent(Replace(Replace(Replace(Replace(Replace(Replace(Replace(Replace(Replace(Replace(Replace(@TituloCopy2, "background-color:#F4F5FB;", "background-color:#F4F5FB;background:#F4F5FB linear-gradient(#F4F5FB,#F4F5FB) repeat;"), "background:#F4F5FB;", "background:#F4F5FB;background:#F4F5FB linear-gradient(#F4F5FB,#F4F5FB) repeat;"), "background-color:#E7A921;", "background-color:#E7A921;background:#E7A921 linear-gradient(#E7A921,#E7A921) repeat;"), "background:#E7A921;", "background:#E7A921;background:#E7A921 linear-gradient(#E7A921,#E7A921) repeat;"), "background-color:#ffffff;", "background-color:#ffffff;background:#ffffff linear-gradient(#ffffff,#ffffff) repeat;"), "background:#ffffff;", "background:#ffffff;background:#ffffff linear-gradient(#ffffff,#ffffff) repeat;"), "background-color:#F6F6FB;", "background-color:#F6F6FB;background:#F6F6FB linear-gradient(#F6F6FB,#F6F6FB) repeat;"), "background:#F6F6FB;", "background:#F6F6FB;background:#F6F6FB linear-gradient(#F6F6FB,#F6F6FB) repeat;"), "color:#242424;", "color:#242424;-webkit-text-fill-color:#242424;"), "color:#2C3490;", "color:#2C3490;-webkit-text-fill-color:#2C3490;"), "color:#4A4F6A;", "color:#4A4F6A;-webkit-text-fill-color:#4A4F6A;"))=%%</h2>
            </td>
          </tr>
          %%[ ENDIF ]%%
          %%[ IF NOT EMPTY(@Banner2Corpo) THEN ]%%
          <tr>
            <td align="center" bgcolor="#F6F6FB" class="v15-surface-f6f6fb content-pad" style="background-color:#F6F6FB;background:#F6F6FB linear-gradient(#F6F6FB,#F6F6FB) repeat;padding:0 32px 24px 32px; background-color:#F6F6FB; background:#F6F6FB linear-gradient(#F6F6FB,#F6F6FB) repeat;">
              %%[ IF NOT EMPTY(@LinkBanner2) THEN ]%%<a href="%%=RedirectTo(TreatAsContent(@LinkBanner2))=%%" target="_blank" style="text-decoration:none;">%%[ ENDIF ]%%
              <img src="%%=v(@Banner2Corpo)=%%" alt="Como solicitar o cartão +amigo" width="536" style="display:block; width:100%; max-width:536px; height:auto; border:0;">
              %%[ IF NOT EMPTY(@LinkBanner2) THEN ]%%</a>%%[ ENDIF ]%%
            </td>
          </tr>
          %%[ ENDIF ]%%
          %%[ IF NOT EMPTY(@Copy2Preto) OR (NOT EMPTY(@TituloCTA2) AND NOT EMPTY(@LinkCTA2)) THEN ]%%
          <tr>
            <td align="center" class="v15-surface-ffffff content-pad cta-cell" style="background-color:#ffffff;background:#ffffff linear-gradient(#ffffff,#ffffff) repeat;padding:24px 32px 32px 32px;" bgcolor="#ffffff">
              %%[ IF NOT EMPTY(@Copy2Preto) THEN ]%%
              <div class="v15-copy-second body-copy" style="max-width:480px; margin:0 auto 18px auto; color:%%=v(@CorCopy2)=%%; -webkit-text-fill-color:%%=v(@CorCopy2)=%%; font-size:%%=v(@TamanhoFonteCopy2)=%%px; line-height:1.6; text-align:center;">%%=TreatAsContent(Replace(Replace(Replace(Replace(Replace(Replace(Replace(Replace(Replace(Replace(Replace(@Copy2Preto, "background-color:#F4F5FB;", "background-color:#F4F5FB;background:#F4F5FB linear-gradient(#F4F5FB,#F4F5FB) repeat;"), "background:#F4F5FB;", "background:#F4F5FB;background:#F4F5FB linear-gradient(#F4F5FB,#F4F5FB) repeat;"), "background-color:#E7A921;", "background-color:#E7A921;background:#E7A921 linear-gradient(#E7A921,#E7A921) repeat;"), "background:#E7A921;", "background:#E7A921;background:#E7A921 linear-gradient(#E7A921,#E7A921) repeat;"), "background-color:#ffffff;", "background-color:#ffffff;background:#ffffff linear-gradient(#ffffff,#ffffff) repeat;"), "background:#ffffff;", "background:#ffffff;background:#ffffff linear-gradient(#ffffff,#ffffff) repeat;"), "background-color:#F6F6FB;", "background-color:#F6F6FB;background:#F6F6FB linear-gradient(#F6F6FB,#F6F6FB) repeat;"), "background:#F6F6FB;", "background:#F6F6FB;background:#F6F6FB linear-gradient(#F6F6FB,#F6F6FB) repeat;"), "color:#242424;", "color:#242424;-webkit-text-fill-color:#242424;"), "color:#2C3490;", "color:#2C3490;-webkit-text-fill-color:#2C3490;"), "color:#4A4F6A;", "color:#4A4F6A;-webkit-text-fill-color:#4A4F6A;"))=%%</div>
              %%[ ENDIF ]%%
              %%[ IF NOT EMPTY(@TituloCTA2) AND NOT EMPTY(@LinkCTA2) THEN ]%%
              <a class="brand-text brand-odd cta-link" href="%%=RedirectTo(TreatAsContent(@LinkCTA2))=%%" target="_blank" style="display:inline-block; min-width:0; max-width:100%; box-sizing:border-box; border-radius:10px; background-color:#2C3490; background:#2C3490 linear-gradient(#2C3490,#2C3490) repeat; color:#ffffff; -webkit-text-fill-color:#ffffff; padding:15px 26px; font-size:15px; line-height:20px; text-align:center; text-decoration:none; font-weight:700;">%%=TreatAsContent(@TituloCTA2)=%%</a>
              %%[ ENDIF ]%%
            </td>
          </tr>
          %%[ ENDIF ]%%
          %%[ ELSE ]%%
          <!-- E-mail 2: economia, benefícios e conversão -->
          <tr>
            <td align="center" class="v15-surface-ffffff content-pad" style="background-color:#ffffff;background:#ffffff linear-gradient(#ffffff,#ffffff) repeat;padding:30px 32px 12px 32px; text-align:center;" bgcolor="#ffffff">
              %%[ IF NOT EMPTY(@TituloCopy1) THEN ]%%
              <h1 class="v15-copy-title headline" style="max-width:500px; margin:0 auto 16px auto; color:%%=v(@CorCopy1)=%%; -webkit-text-fill-color:%%=v(@CorCopy1)=%%; font-size:%%=v(@TamanhoFonteTituloCopy1)=%%px; line-height:1.25; font-weight:700; text-align:center;">%%=TreatAsContent(Replace(Replace(Replace(Replace(Replace(Replace(Replace(Replace(Replace(Replace(Replace(@TituloCopy1, "background-color:#F4F5FB;", "background-color:#F4F5FB;background:#F4F5FB linear-gradient(#F4F5FB,#F4F5FB) repeat;"), "background:#F4F5FB;", "background:#F4F5FB;background:#F4F5FB linear-gradient(#F4F5FB,#F4F5FB) repeat;"), "background-color:#E7A921;", "background-color:#E7A921;background:#E7A921 linear-gradient(#E7A921,#E7A921) repeat;"), "background:#E7A921;", "background:#E7A921;background:#E7A921 linear-gradient(#E7A921,#E7A921) repeat;"), "background-color:#ffffff;", "background-color:#ffffff;background:#ffffff linear-gradient(#ffffff,#ffffff) repeat;"), "background:#ffffff;", "background:#ffffff;background:#ffffff linear-gradient(#ffffff,#ffffff) repeat;"), "background-color:#F6F6FB;", "background-color:#F6F6FB;background:#F6F6FB linear-gradient(#F6F6FB,#F6F6FB) repeat;"), "background:#F6F6FB;", "background:#F6F6FB;background:#F6F6FB linear-gradient(#F6F6FB,#F6F6FB) repeat;"), "color:#242424;", "color:#242424;-webkit-text-fill-color:#242424;"), "color:#2C3490;", "color:#2C3490;-webkit-text-fill-color:#2C3490;"), "color:#4A4F6A;", "color:#4A4F6A;-webkit-text-fill-color:#4A4F6A;"))=%%</h1>
              %%[ ENDIF ]%%
              %%[ IF NOT EMPTY(@Copy1Preto) THEN ]%%
              <div class="v15-copy-main body-copy" style="max-width:500px; margin:0 auto; color:%%=v(@CorCopyPreto1)=%%; -webkit-text-fill-color:%%=v(@CorCopyPreto1)=%%; font-size:%%=v(@TamanhoFonteCopyPreto1)=%%px; line-height:1.55; text-align:center;">%%=TreatAsContent(Replace(Replace(Replace(Replace(Replace(Replace(Replace(Replace(Replace(Replace(Replace(@Copy1Preto, "background-color:#F4F5FB;", "background-color:#F4F5FB;background:#F4F5FB linear-gradient(#F4F5FB,#F4F5FB) repeat;"), "background:#F4F5FB;", "background:#F4F5FB;background:#F4F5FB linear-gradient(#F4F5FB,#F4F5FB) repeat;"), "background-color:#E7A921;", "background-color:#E7A921;background:#E7A921 linear-gradient(#E7A921,#E7A921) repeat;"), "background:#E7A921;", "background:#E7A921;background:#E7A921 linear-gradient(#E7A921,#E7A921) repeat;"), "background-color:#ffffff;", "background-color:#ffffff;background:#ffffff linear-gradient(#ffffff,#ffffff) repeat;"), "background:#ffffff;", "background:#ffffff;background:#ffffff linear-gradient(#ffffff,#ffffff) repeat;"), "background-color:#F6F6FB;", "background-color:#F6F6FB;background:#F6F6FB linear-gradient(#F6F6FB,#F6F6FB) repeat;"), "background:#F6F6FB;", "background:#F6F6FB;background:#F6F6FB linear-gradient(#F6F6FB,#F6F6FB) repeat;"), "color:#242424;", "color:#242424;-webkit-text-fill-color:#242424;"), "color:#2C3490;", "color:#2C3490;-webkit-text-fill-color:#2C3490;"), "color:#4A4F6A;", "color:#4A4F6A;-webkit-text-fill-color:#4A4F6A;"))=%%</div>
              %%[ ENDIF ]%%
            </td>
          </tr>
          %%[ IF NOT EMPTY(@Banner1Corpo) THEN ]%%
          <tr>
            <td align="center" class="v15-surface-ffffff content-pad" style="background-color:#ffffff;background:#ffffff linear-gradient(#ffffff,#ffffff) repeat;padding:8px 32px 16px 32px;" bgcolor="#ffffff">
              %%[ IF NOT EMPTY(@LinkBanner1) THEN ]%%<a href="%%=RedirectTo(TreatAsContent(@LinkBanner1))=%%" target="_blank" style="text-decoration:none;">%%[ ENDIF ]%%
              <img src="%%=v(@Banner1Corpo)=%%" alt="" width="536" style="display:block; width:100%; max-width:536px; height:auto; border:0;">
              %%[ IF NOT EMPTY(@LinkBanner1) THEN ]%%</a>%%[ ENDIF ]%%
            </td>
          </tr>
          %%[ ENDIF ]%%
          %%[ IF NOT EMPTY(@TituloCTA1) AND NOT EMPTY(@LinkCTA1) THEN ]%%
          <tr>
            <td align="center" class="v15-surface-ffffff content-pad cta-cell" style="background-color:#ffffff;background:#ffffff linear-gradient(#ffffff,#ffffff) repeat;padding:14px 32px 30px 32px;" bgcolor="#ffffff">
              <a class="brand-text brand-odd cta-link" href="%%=RedirectTo(TreatAsContent(@LinkCTA1))=%%" target="_blank" style="display:inline-block; min-width:0; max-width:100%; box-sizing:border-box; border-radius:10px; background-color:#2C3490; background:#2C3490 linear-gradient(#2C3490,#2C3490) repeat; color:#ffffff; -webkit-text-fill-color:#ffffff; padding:15px 26px; font-size:15px; line-height:20px; text-align:center; text-decoration:none; font-weight:700;">%%=TreatAsContent(@TituloCTA1)=%%</a>
            </td>
          </tr>
          %%[ ENDIF ]%%
          %%[ IF @Sequencia == "E-mail 2" THEN ]%%
          %%[ IF NOT EMPTY(@TituloCopy2) OR NOT EMPTY(@Copy2Preto) THEN ]%%
          <tr>
            <td align="center" bgcolor="#F6F6FB" class="v15-surface-f6f6fb content-pad" style="background-color:#F6F6FB;background:#F6F6FB linear-gradient(#F6F6FB,#F6F6FB) repeat;padding:28px 32px; background-color:#F6F6FB; background:#F6F6FB linear-gradient(#F6F6FB,#F6F6FB) repeat;">
              %%[ IF NOT EMPTY(@TituloCopy2) THEN ]%%
              <h2 class="v15-copy-title2 headline" style="max-width:500px; margin:0 auto 20px auto; color:%%=v(@CorTituloCopy2)=%%; -webkit-text-fill-color:%%=v(@CorTituloCopy2)=%%; font-size:%%=v(@TamanhoFonteTituloCopy2)=%%px; line-height:1.25; font-weight:700; text-align:center;">%%=TreatAsContent(Replace(Replace(Replace(Replace(Replace(Replace(Replace(Replace(Replace(Replace(Replace(@TituloCopy2, "background-color:#F4F5FB;", "background-color:#F4F5FB;background:#F4F5FB linear-gradient(#F4F5FB,#F4F5FB) repeat;"), "background:#F4F5FB;", "background:#F4F5FB;background:#F4F5FB linear-gradient(#F4F5FB,#F4F5FB) repeat;"), "background-color:#E7A921;", "background-color:#E7A921;background:#E7A921 linear-gradient(#E7A921,#E7A921) repeat;"), "background:#E7A921;", "background:#E7A921;background:#E7A921 linear-gradient(#E7A921,#E7A921) repeat;"), "background-color:#ffffff;", "background-color:#ffffff;background:#ffffff linear-gradient(#ffffff,#ffffff) repeat;"), "background:#ffffff;", "background:#ffffff;background:#ffffff linear-gradient(#ffffff,#ffffff) repeat;"), "background-color:#F6F6FB;", "background-color:#F6F6FB;background:#F6F6FB linear-gradient(#F6F6FB,#F6F6FB) repeat;"), "background:#F6F6FB;", "background:#F6F6FB;background:#F6F6FB linear-gradient(#F6F6FB,#F6F6FB) repeat;"), "color:#242424;", "color:#242424;-webkit-text-fill-color:#242424;"), "color:#2C3490;", "color:#2C3490;-webkit-text-fill-color:#2C3490;"), "color:#4A4F6A;", "color:#4A4F6A;-webkit-text-fill-color:#4A4F6A;"))=%%</h2>
              %%[ ENDIF ]%%
              %%[ IF NOT EMPTY(@Copy2Preto) THEN ]%%
              <div class="v15-copy-second body-copy" style="max-width:480px; margin:0 auto; padding:18px 20px; border:1px solid #E1E3F2; border-radius:12px; background-color:#ffffff; background:#ffffff linear-gradient(#ffffff,#ffffff) repeat; color:%%=v(@CorCopy2)=%%; -webkit-text-fill-color:%%=v(@CorCopy2)=%%; font-size:%%=v(@TamanhoFonteCopy2)=%%px; line-height:1.75; text-align:left;">%%=TreatAsContent(Replace(Replace(Replace(Replace(Replace(Replace(Replace(Replace(Replace(Replace(Replace(@Copy2Preto, "background-color:#F4F5FB;", "background-color:#F4F5FB;background:#F4F5FB linear-gradient(#F4F5FB,#F4F5FB) repeat;"), "background:#F4F5FB;", "background:#F4F5FB;background:#F4F5FB linear-gradient(#F4F5FB,#F4F5FB) repeat;"), "background-color:#E7A921;", "background-color:#E7A921;background:#E7A921 linear-gradient(#E7A921,#E7A921) repeat;"), "background:#E7A921;", "background:#E7A921;background:#E7A921 linear-gradient(#E7A921,#E7A921) repeat;"), "background-color:#ffffff;", "background-color:#ffffff;background:#ffffff linear-gradient(#ffffff,#ffffff) repeat;"), "background:#ffffff;", "background:#ffffff;background:#ffffff linear-gradient(#ffffff,#ffffff) repeat;"), "background-color:#F6F6FB;", "background-color:#F6F6FB;background:#F6F6FB linear-gradient(#F6F6FB,#F6F6FB) repeat;"), "background:#F6F6FB;", "background:#F6F6FB;background:#F6F6FB linear-gradient(#F6F6FB,#F6F6FB) repeat;"), "color:#242424;", "color:#242424;-webkit-text-fill-color:#242424;"), "color:#2C3490;", "color:#2C3490;-webkit-text-fill-color:#2C3490;"), "color:#4A4F6A;", "color:#4A4F6A;-webkit-text-fill-color:#4A4F6A;"))=%%</div>
              %%[ ENDIF ]%%
            </td>
          </tr>
          %%[ ENDIF ]%%
          %%[ IF NOT EMPTY(@TituloCTA2) OR NOT EMPTY(@Banner2Corpo) THEN ]%%
          <tr>
            <td style="background-color:#ffffff;background:#ffffff linear-gradient(#ffffff,#ffffff) repeat;padding:0; background-color:#ffffff; background:#ffffff linear-gradient(#ffffff,#ffffff) repeat;" class="v15-surface-ffffff" bgcolor="#ffffff">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;background:#ffffff linear-gradient(#ffffff,#ffffff) repeat;table-layout:fixed;" class="v15-surface-ffffff" bgcolor="#ffffff">
                <tr>
                  <td width="55%" valign="middle" class="v15-surface-ffffff stack-column stack-copy" style="background-color:#ffffff;background:#ffffff linear-gradient(#ffffff,#ffffff) repeat;width:55%; padding:30px 12px 30px 32px;" bgcolor="#ffffff">
                    <h2 style="margin:0 0 10px 0; color:#2C3490; -webkit-text-fill-color:#2C3490; font-size:24px; line-height:1.25; font-weight:700;">Peça agora seu cartão +amigo</h2>
                    <p style="margin:0 0 18px 0; color:#454A64; -webkit-text-fill-color:#454A64; font-size:15px; line-height:1.55;">Comece a aproveitar os benefícios nas suas compras do dia a dia.</p>
                    %%[ IF NOT EMPTY(@TituloCTA2) AND NOT EMPTY(@LinkCTA2) THEN ]%%
                    <a class="brand-text brand-odd" href="%%=RedirectTo(TreatAsContent(@LinkCTA2))=%%" target="_blank" style="display:inline-block; border-radius:10px; background-color:#2C3490; background:#2C3490 linear-gradient(#2C3490,#2C3490) repeat; color:#ffffff; -webkit-text-fill-color:#ffffff; padding:14px 20px; font-size:13px; line-height:18px; text-align:center; text-decoration:none; font-weight:700;">%%=TreatAsContent(@TituloCTA2)=%%</a>
                    %%[ ENDIF ]%%
                  </td>
                  <td width="45%" align="center" valign="middle" class="v15-surface-ffffff stack-column stack-image" style="background-color:#ffffff;background:#ffffff linear-gradient(#ffffff,#ffffff) repeat;width:45%; padding:24px 28px 24px 8px;" bgcolor="#ffffff">
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
            <td align="center" bgcolor="#F6F6FB" class="v15-surface-f6f6fb content-pad" style="background-color:#F6F6FB;background:#F6F6FB linear-gradient(#F6F6FB,#F6F6FB) repeat;padding:26px 32px 24px 32px; background-color:#F6F6FB; background:#F6F6FB linear-gradient(#F6F6FB,#F6F6FB) repeat;">
              <h2 class="v15-copy-title2 headline" style="max-width:500px; margin:0 auto 18px auto; color:%%=v(@CorTituloCopy2)=%%; -webkit-text-fill-color:%%=v(@CorTituloCopy2)=%%; font-size:%%=v(@TamanhoFonteTituloCopy2)=%%px; line-height:1.25; font-weight:700; text-align:center;">%%=TreatAsContent(Replace(Replace(Replace(Replace(Replace(Replace(Replace(Replace(Replace(Replace(Replace(@TituloCopy2, "background-color:#F4F5FB;", "background-color:#F4F5FB;background:#F4F5FB linear-gradient(#F4F5FB,#F4F5FB) repeat;"), "background:#F4F5FB;", "background:#F4F5FB;background:#F4F5FB linear-gradient(#F4F5FB,#F4F5FB) repeat;"), "background-color:#E7A921;", "background-color:#E7A921;background:#E7A921 linear-gradient(#E7A921,#E7A921) repeat;"), "background:#E7A921;", "background:#E7A921;background:#E7A921 linear-gradient(#E7A921,#E7A921) repeat;"), "background-color:#ffffff;", "background-color:#ffffff;background:#ffffff linear-gradient(#ffffff,#ffffff) repeat;"), "background:#ffffff;", "background:#ffffff;background:#ffffff linear-gradient(#ffffff,#ffffff) repeat;"), "background-color:#F6F6FB;", "background-color:#F6F6FB;background:#F6F6FB linear-gradient(#F6F6FB,#F6F6FB) repeat;"), "background:#F6F6FB;", "background:#F6F6FB;background:#F6F6FB linear-gradient(#F6F6FB,#F6F6FB) repeat;"), "color:#242424;", "color:#242424;-webkit-text-fill-color:#242424;"), "color:#2C3490;", "color:#2C3490;-webkit-text-fill-color:#2C3490;"), "color:#4A4F6A;", "color:#4A4F6A;-webkit-text-fill-color:#4A4F6A;"))=%%</h2>
            </td>
          </tr>
          %%[ ENDIF ]%%
          %%[ IF NOT EMPTY(@Copy2Preto) OR (NOT EMPTY(@TituloCTA2) AND NOT EMPTY(@LinkCTA2)) THEN ]%%
          <tr>
            <td align="center" class="v15-surface-ffffff content-pad cta-cell" style="background-color:#ffffff;background:#ffffff linear-gradient(#ffffff,#ffffff) repeat;padding:24px 32px 32px 32px;" bgcolor="#ffffff">
              %%[ IF NOT EMPTY(@Copy2Preto) THEN ]%%
              <div class="v15-copy-second body-copy" style="max-width:480px; margin:0 auto 18px auto; color:%%=v(@CorCopy2)=%%; -webkit-text-fill-color:%%=v(@CorCopy2)=%%; font-size:%%=v(@TamanhoFonteCopy2)=%%px; line-height:1.6; text-align:center;">%%=TreatAsContent(Replace(Replace(Replace(Replace(Replace(Replace(Replace(Replace(Replace(Replace(Replace(@Copy2Preto, "background-color:#F4F5FB;", "background-color:#F4F5FB;background:#F4F5FB linear-gradient(#F4F5FB,#F4F5FB) repeat;"), "background:#F4F5FB;", "background:#F4F5FB;background:#F4F5FB linear-gradient(#F4F5FB,#F4F5FB) repeat;"), "background-color:#E7A921;", "background-color:#E7A921;background:#E7A921 linear-gradient(#E7A921,#E7A921) repeat;"), "background:#E7A921;", "background:#E7A921;background:#E7A921 linear-gradient(#E7A921,#E7A921) repeat;"), "background-color:#ffffff;", "background-color:#ffffff;background:#ffffff linear-gradient(#ffffff,#ffffff) repeat;"), "background:#ffffff;", "background:#ffffff;background:#ffffff linear-gradient(#ffffff,#ffffff) repeat;"), "background-color:#F6F6FB;", "background-color:#F6F6FB;background:#F6F6FB linear-gradient(#F6F6FB,#F6F6FB) repeat;"), "background:#F6F6FB;", "background:#F6F6FB;background:#F6F6FB linear-gradient(#F6F6FB,#F6F6FB) repeat;"), "color:#242424;", "color:#242424;-webkit-text-fill-color:#242424;"), "color:#2C3490;", "color:#2C3490;-webkit-text-fill-color:#2C3490;"), "color:#4A4F6A;", "color:#4A4F6A;-webkit-text-fill-color:#4A4F6A;"))=%%</div>
              %%[ ENDIF ]%%
              %%[ IF NOT EMPTY(@TituloCTA2) AND NOT EMPTY(@LinkCTA2) THEN ]%%
              <a class="brand-text brand-odd cta-link" href="%%=RedirectTo(TreatAsContent(@LinkCTA2))=%%" target="_blank" style="display:inline-block; min-width:0; max-width:100%; box-sizing:border-box; border-radius:10px; background-color:#2C3490; background:#2C3490 linear-gradient(#2C3490,#2C3490) repeat; color:#ffffff; -webkit-text-fill-color:#ffffff; padding:15px 26px; font-size:15px; line-height:20px; text-align:center; text-decoration:none; font-weight:700;">%%=TreatAsContent(@TituloCTA2)=%%</a>
              %%[ ENDIF ]%%
            </td>
          </tr>
          %%[ ENDIF ]%%
          %%[ ENDIF ]%%
          %%[ IF NOT EMPTY(@Banner2Corpo) THEN ]%%
          <tr>
            <td style="background-color:#ffffff;background:#ffffff linear-gradient(#ffffff,#ffffff) repeat;padding:0; background-color:#ffffff; background:#ffffff linear-gradient(#ffffff,#ffffff) repeat;" class="v15-surface-ffffff" bgcolor="#ffffff">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;background:#ffffff linear-gradient(#ffffff,#ffffff) repeat;table-layout:fixed;" class="v15-surface-ffffff" bgcolor="#ffffff">
                <tr>
                  <td width="55%" valign="middle" class="v15-surface-ffffff stack-column stack-copy" style="background-color:#ffffff;background:#ffffff linear-gradient(#ffffff,#ffffff) repeat;width:55%; padding:30px 12px 30px 32px;" bgcolor="#ffffff">
                    %%[ IF NOT EMPTY(@TituloCopy2) THEN ]%%
                    <h2 style="margin:0 0 10px 0; color:%%=v(@CorTituloCopy2)=%%; -webkit-text-fill-color:%%=v(@CorTituloCopy2)=%%; font-size:%%=v(@TamanhoFonteTituloCopy2)=%%px; line-height:1.25; font-weight:700;" class="v15-copy-title2">%%=TreatAsContent(Replace(Replace(Replace(Replace(Replace(Replace(Replace(Replace(Replace(Replace(Replace(@TituloCopy2, "background-color:#F4F5FB;", "background-color:#F4F5FB;background:#F4F5FB linear-gradient(#F4F5FB,#F4F5FB) repeat;"), "background:#F4F5FB;", "background:#F4F5FB;background:#F4F5FB linear-gradient(#F4F5FB,#F4F5FB) repeat;"), "background-color:#E7A921;", "background-color:#E7A921;background:#E7A921 linear-gradient(#E7A921,#E7A921) repeat;"), "background:#E7A921;", "background:#E7A921;background:#E7A921 linear-gradient(#E7A921,#E7A921) repeat;"), "background-color:#ffffff;", "background-color:#ffffff;background:#ffffff linear-gradient(#ffffff,#ffffff) repeat;"), "background:#ffffff;", "background:#ffffff;background:#ffffff linear-gradient(#ffffff,#ffffff) repeat;"), "background-color:#F6F6FB;", "background-color:#F6F6FB;background:#F6F6FB linear-gradient(#F6F6FB,#F6F6FB) repeat;"), "background:#F6F6FB;", "background:#F6F6FB;background:#F6F6FB linear-gradient(#F6F6FB,#F6F6FB) repeat;"), "color:#242424;", "color:#242424;-webkit-text-fill-color:#242424;"), "color:#2C3490;", "color:#2C3490;-webkit-text-fill-color:#2C3490;"), "color:#4A4F6A;", "color:#4A4F6A;-webkit-text-fill-color:#4A4F6A;"))=%%</h2>
                    %%[ ENDIF ]%%
                    %%[ IF NOT EMPTY(@Copy2Preto) THEN ]%%
                    <div style="margin:0 0 18px 0; color:%%=v(@CorCopy2)=%%; -webkit-text-fill-color:%%=v(@CorCopy2)=%%; font-size:%%=v(@TamanhoFonteCopy2)=%%px; line-height:1.55;" class="v15-copy-second">%%=TreatAsContent(Replace(Replace(Replace(Replace(Replace(Replace(Replace(Replace(Replace(Replace(Replace(@Copy2Preto, "background-color:#F4F5FB;", "background-color:#F4F5FB;background:#F4F5FB linear-gradient(#F4F5FB,#F4F5FB) repeat;"), "background:#F4F5FB;", "background:#F4F5FB;background:#F4F5FB linear-gradient(#F4F5FB,#F4F5FB) repeat;"), "background-color:#E7A921;", "background-color:#E7A921;background:#E7A921 linear-gradient(#E7A921,#E7A921) repeat;"), "background:#E7A921;", "background:#E7A921;background:#E7A921 linear-gradient(#E7A921,#E7A921) repeat;"), "background-color:#ffffff;", "background-color:#ffffff;background:#ffffff linear-gradient(#ffffff,#ffffff) repeat;"), "background:#ffffff;", "background:#ffffff;background:#ffffff linear-gradient(#ffffff,#ffffff) repeat;"), "background-color:#F6F6FB;", "background-color:#F6F6FB;background:#F6F6FB linear-gradient(#F6F6FB,#F6F6FB) repeat;"), "background:#F6F6FB;", "background:#F6F6FB;background:#F6F6FB linear-gradient(#F6F6FB,#F6F6FB) repeat;"), "color:#242424;", "color:#242424;-webkit-text-fill-color:#242424;"), "color:#2C3490;", "color:#2C3490;-webkit-text-fill-color:#2C3490;"), "color:#4A4F6A;", "color:#4A4F6A;-webkit-text-fill-color:#4A4F6A;"))=%%</div>
                    %%[ ENDIF ]%%
                    %%[ IF NOT EMPTY(@TituloCTA2) AND NOT EMPTY(@LinkCTA2) THEN ]%%
                    <a class="brand-text brand-odd" href="%%=RedirectTo(TreatAsContent(@LinkCTA2))=%%" target="_blank" style="display:inline-block; border-radius:10px; background-color:#2C3490; background:#2C3490 linear-gradient(#2C3490,#2C3490) repeat; color:#ffffff; -webkit-text-fill-color:#ffffff; padding:14px 20px; font-size:13px; line-height:18px; text-align:center; text-decoration:none; font-weight:700;">%%=TreatAsContent(@TituloCTA2)=%%</a>
                    %%[ ENDIF ]%%
                  </td>
                  <td width="45%" align="center" valign="middle" class="v15-surface-ffffff stack-column stack-image" style="background-color:#ffffff;background:#ffffff linear-gradient(#ffffff,#ffffff) repeat;width:45%; padding:24px 28px 24px 8px;" bgcolor="#ffffff">
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
            <td align="center" style="background-color:#ffffff;background:#ffffff linear-gradient(#ffffff,#ffffff) repeat;padding:0 0 16px 0;" class="v15-surface-ffffff" bgcolor="#ffffff">
              %%[ IF NOT EMPTY(@LinkBanner3) THEN ]%%<a href="%%=RedirectTo(TreatAsContent(@LinkBanner3))=%%" target="_blank" style="text-decoration:none;">%%[ ENDIF ]%%
              <img src="%%=v(@Banner3Corpo)=%%" alt="Assinatura da rede de supermercados" width="600" style="display:block; width:100%; max-width:600px; height:auto; border:0;">
              %%[ IF NOT EMPTY(@LinkBanner3) THEN ]%%</a>%%[ ENDIF ]%%
            </td>
          </tr>
          %%[ ENDIF ]%%
          %%[ IF NOT EMPTY(@NotaLegal) THEN ]%%
          <tr>
            <td class="v15-surface-ffffff legal-pad" style="background-color:#ffffff;background:#ffffff linear-gradient(#ffffff,#ffffff) repeat;padding:18px 32px 28px 32px; border-top:1px solid #e5e7eb; background-color:#ffffff; background:#ffffff linear-gradient(#ffffff,#ffffff) repeat;" bgcolor="#ffffff">
              %%[ IF NOT EMPTY(@NotaLegal) THEN ]%%
              <div style="margin:0 0 14px 0; color:%%=v(@CorNotaLegal)=%%; -webkit-text-fill-color:%%=v(@CorNotaLegal)=%%; font-size:%%=v(@TamanhoFonteNotaLegal)=%%px; line-height:1.5;" class="v15-copy-legal">%%=TreatAsContent(Replace(Replace(Replace(Replace(Replace(Replace(Replace(Replace(Replace(Replace(Replace(@NotaLegal, "background-color:#F4F5FB;", "background-color:#F4F5FB;background:#F4F5FB linear-gradient(#F4F5FB,#F4F5FB) repeat;"), "background:#F4F5FB;", "background:#F4F5FB;background:#F4F5FB linear-gradient(#F4F5FB,#F4F5FB) repeat;"), "background-color:#E7A921;", "background-color:#E7A921;background:#E7A921 linear-gradient(#E7A921,#E7A921) repeat;"), "background:#E7A921;", "background:#E7A921;background:#E7A921 linear-gradient(#E7A921,#E7A921) repeat;"), "background-color:#ffffff;", "background-color:#ffffff;background:#ffffff linear-gradient(#ffffff,#ffffff) repeat;"), "background:#ffffff;", "background:#ffffff;background:#ffffff linear-gradient(#ffffff,#ffffff) repeat;"), "background-color:#F6F6FB;", "background-color:#F6F6FB;background:#F6F6FB linear-gradient(#F6F6FB,#F6F6FB) repeat;"), "background:#F6F6FB;", "background:#F6F6FB;background:#F6F6FB linear-gradient(#F6F6FB,#F6F6FB) repeat;"), "color:#242424;", "color:#242424;-webkit-text-fill-color:#242424;"), "color:#2C3490;", "color:#2C3490;-webkit-text-fill-color:#2C3490;"), "color:#4A4F6A;", "color:#4A4F6A;-webkit-text-fill-color:#4A4F6A;"))=%%</div>
              %%[ ENDIF ]%%
            </td>
          </tr>
          %%[ ENDIF ]%%
          <tr>
            <td align="center" class="v15-surface-ffffff legal-pad" style="background-color:#ffffff;background:#ffffff linear-gradient(#ffffff,#ffffff) repeat;padding:20px 32px 28px 32px; border-top:1px solid #e5e7eb; background-color:#ffffff; background:#ffffff linear-gradient(#ffffff,#ffffff) repeat; color:#6b7280; -webkit-text-fill-color:#6b7280; font-family:Arial, Helvetica, sans-serif; font-size:10px; line-height:1.5; text-align:center;" bgcolor="#ffffff">
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
</html>$v15$,version=3,updated_at=now() where id='builtin-plurix-v15';
update public.dynamic_email_briefings b set briefing_data=jsonb_set(b.briefing_data,'{COPY_1_PRETO}',to_jsonb(p.new_copy)),version=b.version+1,updated_at=now(),updated_by=null from investida_patch p where p.id=b.id;
insert into public.dynamic_email_briefing_versions(briefing_id,version,snapshot,change_summary,warnings,saved_by)
select b.id,b.version,to_jsonb(b),'V15 R3: COPY_1_PRETO usa NomeInvestida derivado de PRODUTO; corpo segue HTML','[]'::jsonb,null from public.dynamic_email_briefings b join investida_patch p on p.id=b.id;
