-- V2 TOPO DE FUNIL DINÂMICO: E-mails 3 e 4 da planilha de outubro, mais os ajustes de régua aprovados junto.
-- 1. PLURIX V13: segundo bloco sem imagem em largura total (E-mail 3 em diante) e faixa de limite
--    alternando amarelo (#E6A813, e-mails ímpares) e bege (#EBE0CF, pares). Mesmo texto do fixture.
-- 2. E-mail 1: número de cada quadro em negrito.  3. E-mail 2: volta a saudação própria da faixa.
-- 4. E-mail 3: segundo bloco preenchido (lista com check).  5. E-mail 4: novo, 6 redes, a partir do E-mail 3.
-- Gerado por scripts/email-factory/build_topo_dinamico_v2_e3e4.py.

update public.dynamic_email_template_slots set source = replace(replace(source, $gaas$          <tr>
            <td align="center" class="content-pad" bgcolor="#FFF4D6" style="padding:14px 32px; background-color:#FFF4D6;">
$gaas$, $gaas$          <tr>
            %%[ IF @Sequencia == "E-mail 2" OR @Sequencia == "E-mail 4" OR @Sequencia == "E-mail 6" OR @Sequencia == "E-mail 8" THEN ]%%
            <td align="center" class="content-pad" bgcolor="#EBE0CF" style="padding:14px 32px; background-color:#EBE0CF;">
            %%[ ELSE ]%%
            <td align="center" class="content-pad" bgcolor="#E6A813" style="padding:14px 32px; background-color:#E6A813;">
            %%[ ENDIF ]%%
$gaas$), $gaas$          %%[ ELSE ]%%
          %%[ IF NOT EMPTY(@TituloCopy2) OR NOT EMPTY(@Copy2Preto) OR (NOT EMPTY(@TituloCTA2) AND NOT EMPTY(@LinkCTA2)) OR NOT EMPTY(@Banner2Corpo) THEN ]%%
$gaas$, $gaas$          %%[ ELSE ]%%
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
              <a class="cta-link" href="%%=RedirectTo(TreatAsContent(@LinkCTA2))=%%" target="_blank" style="display:inline-block; min-width:280px; border-radius:10px; background-color:#2C3490; color:#ffffff; padding:15px 26px; font-size:15px; line-height:20px; text-align:center; text-decoration:none; font-weight:700;">%%=TreatAsContent(@TituloCTA2)=%%</a>
              %%[ ENDIF ]%%
            </td>
          </tr>
          %%[ ENDIF ]%%
          %%[ ENDIF ]%%
          %%[ IF NOT EMPTY(@Banner2Corpo) THEN ]%%
$gaas$), version = version + 1, updated_at = now()
where id = $gaas$builtin-plurix-v13$gaas$ and md5(source) = '2e037c82e124b5388da69cffe590ea41';

-- E-mail 1: Número de cada quadro em negrito (E-mail 1).
with rede(nm, patch) as (values
    ($gaas$AMIGAO$gaas$, $gaas${}$gaas$::jsonb),
    ($gaas$AVENIDA$gaas$, $gaas${}$gaas$::jsonb),
    ($gaas$BOA$gaas$, $gaas${}$gaas$::jsonb),
    ($gaas$COMPRE MAIS$gaas$, $gaas${}$gaas$::jsonb),
    ($gaas$PARANA$gaas$, $gaas${}$gaas$::jsonb),
    ($gaas$SUPERPAO$gaas$, $gaas${}$gaas$::jsonb)
), alvo as (
  select b.id, b.briefing_data || $gaas${"COPY_2_PRETO": "<p style=\"margin:0 0 14px 0;text-align:center;\">E para aproveitar benefícios em diferentes momentos da rotina, conheça algumas das vantagens de ter seu <b>cartão +amigo</b>:</p><table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"10\" border=\"0\" style=\"margin:0 auto;border-collapse:separate;\"><tr><td class=\"stack-column\" width=\"50%\" valign=\"top\" bgcolor=\"#F4F5FB\" style=\"width:50%;padding:16px;text-align:left;background-color:#F4F5FB;border:1px solid #E1E3F2;border-radius:12px;margin-bottom:10px;\"><div style=\"width:30px;height:30px;line-height:30px;border-radius:15px;background-color:#E7A921;color:#2C3490;font-size:14px;font-weight:700;text-align:center;\">&#10003;</div><p style=\"margin:10px 0 4px 0;font-size:14px;line-height:1.3;font-weight:700;color:#2C3490;\">Descontos extras no mercado</p><p style=\"margin:0;font-size:13px;line-height:1.45;color:#4A4F6A;\"><b style=\"color:#242424;\">A partir de 5%</b> em produtos selecionados, pagando com o cartão +amigo.</p></td><td class=\"stack-column\" width=\"50%\" valign=\"top\" bgcolor=\"#F4F5FB\" style=\"width:50%;padding:16px;text-align:left;background-color:#F4F5FB;border:1px solid #E1E3F2;border-radius:12px;margin-bottom:10px;\"><div style=\"width:30px;height:30px;line-height:30px;border-radius:15px;background-color:#E7A921;color:#2C3490;font-size:14px;font-weight:700;text-align:center;\">&#10003;</div><p style=\"margin:10px 0 4px 0;font-size:14px;line-height:1.3;font-weight:700;color:#2C3490;\">Mais prazo para pagar</p><p style=\"margin:0;font-size:13px;line-height:1.45;color:#4A4F6A;\"><b style=\"color:#242424;\">Até 40 dias</b>, conforme a data da compra e o vencimento da fatura.</p></td></tr><tr><td class=\"stack-column\" width=\"50%\" valign=\"top\" bgcolor=\"#F4F5FB\" style=\"width:50%;padding:16px;text-align:left;background-color:#F4F5FB;border:1px solid #E1E3F2;border-radius:12px;margin-bottom:10px;\"><div style=\"width:30px;height:30px;line-height:30px;border-radius:15px;background-color:#E7A921;color:#2C3490;font-size:14px;font-weight:700;text-align:center;\">&#10003;</div><p style=\"margin:10px 0 4px 0;font-size:14px;line-height:1.3;font-weight:700;color:#2C3490;\">Benefícios com Visa</p><p style=\"margin:0;font-size:13px;line-height:1.45;color:#4A4F6A;\">Acesso a promoções, descontos, sorteios e <b style=\"color:#242424;\">benefícios exclusivos</b>.</p></td><td class=\"stack-column\" width=\"50%\" valign=\"top\" bgcolor=\"#F4F5FB\" style=\"width:50%;padding:16px;text-align:left;background-color:#F4F5FB;border:1px solid #E1E3F2;border-radius:12px;margin-bottom:10px;\"><div style=\"width:30px;height:30px;line-height:30px;border-radius:15px;background-color:#E7A921;color:#2C3490;font-size:14px;font-weight:700;text-align:center;\">&#10003;</div><p style=\"margin:10px 0 4px 0;font-size:14px;line-height:1.3;font-weight:700;color:#2C3490;\">Vantagens para sua saúde</p><p style=\"margin:0;font-size:13px;line-height:1.45;color:#4A4F6A;\"><b style=\"color:#242424;\">Até 70% de desconto</b> em consultas, exames e medicamentos pelo Programa Você Bem Saúde.</p></td></tr></table><p style=\"margin:16px 0 0 0;text-align:center;font-weight:700;color:#2C3490;\">Peça seu cartão +amigo e descubra essas vantagens!</p>"}$gaas$::jsonb || rede.patch as dados
  from public.dynamic_email_briefings b
  join rede on rede.nm = b.briefing_data->>'NM_PRODUTO_INTERNO'
  where b.segment = $gaas$V2 TOPO DE FUNIL DINÂMICO$gaas$ and b.status <> 'archived' and b.briefing_data->>'SEQUENCIA' = $gaas$E-mail 1$gaas$
), atualizados as (
  update public.dynamic_email_briefings b set briefing_data = alvo.dados, version = b.version + 1, updated_at = now()
  from alvo where b.id = alvo.id and b.briefing_data is distinct from alvo.dados
  returning b.id, b.version, b.briefing_data
)
insert into public.dynamic_email_briefing_versions (briefing_id, version, snapshot, change_summary, warnings)
select id, version, briefing_data, $gaas$Número de cada quadro em negrito (E-mail 1).$gaas$, '[]'::jsonb from atualizados
on conflict (briefing_id, version) do nothing;

-- E-mail 2: Saudação da faixa volta a ser própria do E-mail 2.
with rede(nm, patch) as (values
    ($gaas$AMIGAO$gaas$, $gaas${}$gaas$::jsonb),
    ($gaas$AVENIDA$gaas$, $gaas${}$gaas$::jsonb),
    ($gaas$BOA$gaas$, $gaas${}$gaas$::jsonb),
    ($gaas$COMPRE MAIS$gaas$, $gaas${}$gaas$::jsonb),
    ($gaas$PARANA$gaas$, $gaas${}$gaas$::jsonb),
    ($gaas$SUPERPAO$gaas$, $gaas${}$gaas$::jsonb)
), alvo as (
  select b.id, b.briefing_data || $gaas${"MENSAGEM_LIMITE": "Seu cartão está mais perto, {{nome}}: você tem R$ {{limite}} de limite pré-aprovado no cartão +amigo."}$gaas$::jsonb || rede.patch as dados
  from public.dynamic_email_briefings b
  join rede on rede.nm = b.briefing_data->>'NM_PRODUTO_INTERNO'
  where b.segment = $gaas$V2 TOPO DE FUNIL DINÂMICO$gaas$ and b.status <> 'archived' and b.briefing_data->>'SEQUENCIA' = $gaas$E-mail 2$gaas$
), atualizados as (
  update public.dynamic_email_briefings b set briefing_data = alvo.dados, version = b.version + 1, updated_at = now()
  from alvo where b.id = alvo.id and b.briefing_data is distinct from alvo.dados
  returning b.id, b.version, b.briefing_data
)
insert into public.dynamic_email_briefing_versions (briefing_id, version, snapshot, change_summary, warnings)
select id, version, briefing_data, $gaas$Saudação da faixa volta a ser própria do E-mail 2.$gaas$, '[]'::jsonb from atualizados
on conflict (briefing_id, version) do nothing;

-- E-mail 3: Conteúdo da planilha de outubro; segundo bloco em lista com check; supermercado no texto.
with rede(nm, patch) as (values
    ($gaas$AMIGAO$gaas$, $gaas${"COPY_1_PRETO": "Na hora de fazer as compras, <b>cada desconto conta!</b><br>Com o <b>cartão de crédito +amigo</b>, você pode aproveitar <b>vantagens extras</b> em produtos selecionados no Amigão."}$gaas$::jsonb),
    ($gaas$AVENIDA$gaas$, $gaas${"COPY_1_PRETO": "Na hora de fazer as compras, <b>cada desconto conta!</b><br>Com o <b>cartão de crédito +amigo</b>, você pode aproveitar <b>vantagens extras</b> em produtos selecionados no Avenida."}$gaas$::jsonb),
    ($gaas$BOA$gaas$, $gaas${"COPY_1_PRETO": "Na hora de fazer as compras, <b>cada desconto conta!</b><br>Com o <b>cartão de crédito +amigo</b>, você pode aproveitar <b>vantagens extras</b> em produtos selecionados no Boa."}$gaas$::jsonb),
    ($gaas$PARANA$gaas$, $gaas${"COPY_1_PRETO": "Na hora de fazer as compras, <b>cada desconto conta!</b><br>Com o <b>cartão de crédito +amigo</b>, você pode aproveitar <b>vantagens extras</b> em produtos selecionados no Paraná."}$gaas$::jsonb),
    ($gaas$COMPRE MAIS$gaas$, $gaas${"COPY_1_PRETO": "Na hora de fazer as compras, <b>cada desconto conta!</b><br>Com o <b>cartão de crédito +amigo</b>, você pode aproveitar <b>vantagens extras</b> em produtos selecionados no seu supermercado."}$gaas$::jsonb),
    ($gaas$SUPERPAO$gaas$, $gaas${"COPY_1_PRETO": "Na hora de fazer as compras, <b>cada desconto conta!</b><br>Com o <b>cartão de crédito +amigo</b>, você pode aproveitar <b>vantagens extras</b> em produtos selecionados no seu supermercado."}$gaas$::jsonb)
), alvo as (
  select b.id, b.briefing_data || $gaas${"TP_CAMPANHA": "Topo de Funil", "SEQUENCIA": "E-mail 3", "ASSUNTO": "Mais economia no carrinho com o cartão +amigo", "PRE_CABECALHO": "Vantagens extras em produtos selecionados do supermercado.", "HEADER_TITULO": "Até 40 dias para pagar!", "HEADER_SUBTITULO": "Mais flexibilidade e economia para o seu bolso. Aproveite!", "HEADER_IMAGEM_CARTAO": "https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/29a7dd93-cebf-47eb-9a7c-822ffcfc2be2.png", "MENSAGEM_LIMITE": "Ainda dá tempo, {{nome}}: você tem R$ {{limite}} de limite pré-aprovado para pedir seu cartão +amigo.", "TITULO_COPY_1_AZUL": "Olá, %%=v(@FirstName)=%%!", "TITULO_CTA_1": "PEDIR CARTÃO +AMIGO", "BANNER_1_CORPO": "", "TITULO_COPY_2": "Mais motivos para aproveitar as compras", "COPY_2_PRETO": "<p style=\"margin:0 0 14px 0;text-align:center;\">Com o <b>cartão de crédito do Clube +amigo</b>, você paga suas compras com segurança e praticidade e ainda conta com <b>benefícios no dia a dia</b>:</p><table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"margin:0 auto;\"><tr><td width=\"38\" valign=\"top\" style=\"width:38px;padding:6px 0;\"><div style=\"width:30px;height:30px;line-height:30px;border-radius:15px;background-color:#E7A921;color:#2C3490;font-size:14px;font-weight:700;text-align:center;\">&#10003;</div></td><td valign=\"middle\" style=\"padding:6px 0;text-align:left;font-size:15px;line-height:1.45;color:#242424;\"><b>A partir de 5% de desconto</b> em produtos selecionados.</td></tr><tr><td width=\"38\" valign=\"top\" style=\"width:38px;padding:6px 0;\"><div style=\"width:30px;height:30px;line-height:30px;border-radius:15px;background-color:#E7A921;color:#2C3490;font-size:14px;font-weight:700;text-align:center;\">&#10003;</div></td><td valign=\"middle\" style=\"padding:6px 0;text-align:left;font-size:15px;line-height:1.45;color:#242424;\"><b>Até 40 dias para pagar</b>: mais flexibilidade para você.</td></tr><tr><td width=\"38\" valign=\"top\" style=\"width:38px;padding:6px 0;\"><div style=\"width:30px;height:30px;line-height:30px;border-radius:15px;background-color:#E7A921;color:#2C3490;font-size:14px;font-weight:700;text-align:center;\">&#10003;</div></td><td valign=\"middle\" style=\"padding:6px 0;text-align:left;font-size:15px;line-height:1.45;color:#242424;\"><b>Até 70% de desconto</b> em consultas, exames e medicamentos.</td></tr><tr><td width=\"38\" valign=\"top\" style=\"width:38px;padding:6px 0;\"><div style=\"width:30px;height:30px;line-height:30px;border-radius:15px;background-color:#E7A921;color:#2C3490;font-size:14px;font-weight:700;text-align:center;\">&#10003;</div></td><td valign=\"middle\" style=\"padding:6px 0;text-align:left;font-size:15px;line-height:1.45;color:#242424;\"><b>Benefícios com Visa</b>: aceito no Brasil e no mundo, com acesso a promoções, descontos, sorteios e benefícios exclusivos.</td></tr></table><p style=\"margin:16px 0 0 0;text-align:center;font-weight:700;color:#2C3490;\">Peça seu cartão +amigo e aproveite os descontos disponíveis!</p>", "TITULO_CTA_2": "QUERO MEU CARTÃO +AMIGO", "BANNER_2_CORPO": "", "TAMANHO_DA_FONTE_TITULO_COPY_2": "24"}$gaas$::jsonb || rede.patch as dados
  from public.dynamic_email_briefings b
  join rede on rede.nm = b.briefing_data->>'NM_PRODUTO_INTERNO'
  where b.segment = $gaas$V2 TOPO DE FUNIL DINÂMICO$gaas$ and b.status <> 'archived' and b.briefing_data->>'SEQUENCIA' = $gaas$E-mail 3$gaas$
), atualizados as (
  update public.dynamic_email_briefings b set briefing_data = alvo.dados, version = b.version + 1, updated_at = now()
  from alvo where b.id = alvo.id and b.briefing_data is distinct from alvo.dados
  returning b.id, b.version, b.briefing_data
)
insert into public.dynamic_email_briefing_versions (briefing_id, version, snapshot, change_summary, warnings)
select id, version, briefing_data, $gaas$Conteúdo da planilha de outubro; segundo bloco em lista com check; supermercado no texto.$gaas$, '[]'::jsonb from atualizados
on conflict (briefing_id, version) do nothing;

-- E-mail 4: uma linha por rede, copiada do E-mail 3 da mesma rede (ids ...0000012N -> ...0000013N).
insert into public.dynamic_email_email_strategies (ruler_strategy_id, campaign_group_id, partner, segment, week_key, sequence, subject, preheader, technical_status, editorial_status, visual_status, certification_status, field_provenance, updated_by_type, update_source, change_reason, llm_model, functional_name)
values ($gaas$d2d20000-0000-4000-8000-000000000001$gaas$::uuid, $gaas$d2d20000-0000-4000-8000-0000000000e4$gaas$::uuid, 'Plurix', $gaas$V2 TOPO DE FUNIL DINÂMICO$gaas$, $gaas$Semana 2$gaas$, 'E-mail 4',
  $gaas$Até 40 dias para pagar suas compras!$gaas$, $gaas$Peça o cartão +amigo e aproveite mais prazo, descontos extras e benefícios.$gaas$, 'draft', 'draft', 'needs_review', 'not_tested',
  $gaas${"origem": "planilha Regua_Plurix_TopoFunil_Proposta_Outubro26_3, aba Briefing Fábrica", "rede": "links, UTM, assinatura e nota legal do E-mail 3 da V2"}$gaas$::jsonb, 'llm', 'llm', $gaas$E-mail 4 da planilha de outubro em blocos visuais, aprovado pelo Pablo em 15/10/2026$gaas$, 'claude-opus-5-5',
  'V2 TOPO DINÂMICO · E-mail 4')
on conflict (campaign_group_id) do nothing;

with rede(nm, patch) as (values
    ($gaas$AMIGAO$gaas$, $gaas${"COPY_1_PRETO": "O <b>cartão de crédito +amigo</b> pode acompanhar você em muito mais momentos do que as compras no Amigão.<br>Com a bandeira Visa, ele é aceito em estabelecimentos no Brasil e no exterior e ainda traz <b>benefícios extras para você economizar</b> e cuidar da sua rotina."}$gaas$::jsonb),
    ($gaas$AVENIDA$gaas$, $gaas${"COPY_1_PRETO": "O <b>cartão de crédito +amigo</b> pode acompanhar você em muito mais momentos do que as compras no Avenida.<br>Com a bandeira Visa, ele é aceito em estabelecimentos no Brasil e no exterior e ainda traz <b>benefícios extras para você economizar</b> e cuidar da sua rotina."}$gaas$::jsonb),
    ($gaas$BOA$gaas$, $gaas${"COPY_1_PRETO": "O <b>cartão de crédito +amigo</b> pode acompanhar você em muito mais momentos do que as compras no Boa.<br>Com a bandeira Visa, ele é aceito em estabelecimentos no Brasil e no exterior e ainda traz <b>benefícios extras para você economizar</b> e cuidar da sua rotina."}$gaas$::jsonb),
    ($gaas$PARANA$gaas$, $gaas${"COPY_1_PRETO": "O <b>cartão de crédito +amigo</b> pode acompanhar você em muito mais momentos do que as compras no Paraná.<br>Com a bandeira Visa, ele é aceito em estabelecimentos no Brasil e no exterior e ainda traz <b>benefícios extras para você economizar</b> e cuidar da sua rotina."}$gaas$::jsonb),
    ($gaas$COMPRE MAIS$gaas$, $gaas${"COPY_1_PRETO": "O <b>cartão de crédito +amigo</b> pode acompanhar você em muito mais momentos do que as compras no seu supermercado.<br>Com a bandeira Visa, ele é aceito em estabelecimentos no Brasil e no exterior e ainda traz <b>benefícios extras para você economizar</b> e cuidar da sua rotina."}$gaas$::jsonb),
    ($gaas$SUPERPAO$gaas$, $gaas${"COPY_1_PRETO": "O <b>cartão de crédito +amigo</b> pode acompanhar você em muito mais momentos do que as compras no seu supermercado.<br>Com a bandeira Visa, ele é aceito em estabelecimentos no Brasil e no exterior e ainda traz <b>benefícios extras para você economizar</b> e cuidar da sua rotina."}$gaas$::jsonb)
), origem as (
  select b.*, rede.patch, ('d2d20000-0000-4000-8000-0000000001' || '3' || right(b.id::text, 1))::uuid as novo_id
  from public.dynamic_email_briefings b
  join rede on rede.nm = b.briefing_data->>'NM_PRODUTO_INTERNO'
  where b.segment = $gaas$V2 TOPO DE FUNIL DINÂMICO$gaas$ and b.status <> 'archived' and b.briefing_data->>'SEQUENCIA' = 'E-mail 3'
)
insert into public.dynamic_email_briefings (id, briefing_data, partner, segment, subgroup, week_key, activity_names, campaign_group_id, status, version, template_slot_id, journey_confirmed, import_source)
select o.novo_id,
  o.briefing_data || $gaas${"TP_CAMPANHA": "Topo de Funil", "SEQUENCIA": "E-mail 4", "ASSUNTO": "Até 40 dias para pagar suas compras!", "PRE_CABECALHO": "Peça o cartão +amigo e aproveite mais prazo, descontos extras e benefícios.", "HEADER_TITULO": "Use seu cartão dentro e fora do mercado!", "HEADER_SUBTITULO": "Peça seu cartão +amigo e aproveite os melhores descontos.", "HEADER_IMAGEM_CARTAO": "https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/c6f51660-3c13-448e-aef3-5a68efaf2310.png", "MENSAGEM_LIMITE": "Vale lembrar, {{nome}}: você tem R$ {{limite}} de limite pré-aprovado no cartão +amigo.", "TITULO_COPY_1_AZUL": "Olá, %%=v(@FirstName)=%%!", "TITULO_CTA_1": "PEDIR CARTÃO +AMIGO", "BANNER_1_CORPO": "", "TITULO_COPY_2": "Vantagens para as compras e para o dia a dia", "COPY_2_PRETO": "<p style=\"margin:0 0 14px 0;text-align:center;\">Com o <b>cartão de crédito +amigo</b>, você conta com:</p><table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"10\" border=\"0\" style=\"margin:0 auto;border-collapse:separate;\"><tr><td class=\"stack-column\" width=\"50%\" valign=\"top\" bgcolor=\"#F4F5FB\" style=\"width:50%;padding:16px;text-align:left;background-color:#F4F5FB;border:1px solid #E1E3F2;border-radius:12px;margin-bottom:10px;\"><div style=\"width:30px;height:30px;line-height:30px;border-radius:15px;background-color:#E7A921;color:#2C3490;font-size:14px;font-weight:700;text-align:center;\">&#10003;</div><p style=\"margin:10px 0 4px 0;font-size:14px;line-height:1.3;font-weight:700;color:#2C3490;\">Visa no Brasil e no mundo</p><p style=\"margin:0;font-size:13px;line-height:1.45;color:#4A4F6A;\">Mais possibilidades de uso e o <b style=\"color:#242424;\">Programa Vai de Visa</b>, com promoções, descontos, sorteios e benefícios exclusivos.</p></td><td class=\"stack-column\" width=\"50%\" valign=\"top\" bgcolor=\"#F4F5FB\" style=\"width:50%;padding:16px;text-align:left;background-color:#F4F5FB;border:1px solid #E1E3F2;border-radius:12px;margin-bottom:10px;\"><div style=\"width:30px;height:30px;line-height:30px;border-radius:15px;background-color:#E7A921;color:#2C3490;font-size:14px;font-weight:700;text-align:center;\">&#10003;</div><p style=\"margin:10px 0 4px 0;font-size:14px;line-height:1.3;font-weight:700;color:#2C3490;\">Desconto extra no mercado</p><p style=\"margin:0;font-size:13px;line-height:1.45;color:#4A4F6A;\"><b style=\"color:#242424;\">+5% de desconto extra</b> em produtos selecionados nas redes participantes.</p></td></tr><tr><td class=\"stack-column\" width=\"50%\" valign=\"top\" bgcolor=\"#F4F5FB\" style=\"width:50%;padding:16px;text-align:left;background-color:#F4F5FB;border:1px solid #E1E3F2;border-radius:12px;margin-bottom:10px;\"><div style=\"width:30px;height:30px;line-height:30px;border-radius:15px;background-color:#E7A921;color:#2C3490;font-size:14px;font-weight:700;text-align:center;\">&#10003;</div><p style=\"margin:10px 0 4px 0;font-size:14px;line-height:1.3;font-weight:700;color:#2C3490;\">Mais prazo para pagar</p><p style=\"margin:0;font-size:13px;line-height:1.45;color:#4A4F6A;\"><b style=\"color:#242424;\">Até 40 dias</b>, conforme a data da compra e o vencimento da fatura.</p></td><td class=\"stack-column\" width=\"50%\" valign=\"top\" bgcolor=\"#F4F5FB\" style=\"width:50%;padding:16px;text-align:left;background-color:#F4F5FB;border:1px solid #E1E3F2;border-radius:12px;margin-bottom:10px;\"><div style=\"width:30px;height:30px;line-height:30px;border-radius:15px;background-color:#E7A921;color:#2C3490;font-size:14px;font-weight:700;text-align:center;\">&#10003;</div><p style=\"margin:10px 0 4px 0;font-size:14px;line-height:1.3;font-weight:700;color:#2C3490;\">Desconto em saúde</p><p style=\"margin:0;font-size:13px;line-height:1.45;color:#4A4F6A;\"><b style=\"color:#242424;\">Até 70% de desconto</b> em consultas, exames e medicamentos pelo Programa Você Bem.</p></td></tr></table><p style=\"margin:16px 0 0 0;text-align:center;font-weight:700;color:#2C3490;\">Solicite seu cartão +amigo e descubra tudo o que ele pode oferecer!</p>", "TITULO_CTA_2": "QUERO MEU CARTÃO +AMIGO", "BANNER_2_CORPO": "", "TAMANHO_DA_FONTE_TITULO_COPY_2": "24"}$gaas$::jsonb || o.patch || jsonb_build_object(
    '__id', o.novo_id::text,
    'LINK_CTA_1', replace(o.briefing_data->>'LINK_CTA_1', 'S2D01', 'S2D02'),
    'LINK_CTA_2', replace(o.briefing_data->>'LINK_CTA_2', 'S2D01', 'S2D02'),
    'LINK_BANNER_1_CORPO', replace(o.briefing_data->>'LINK_BANNER_1_CORPO', 'S2D01', 'S2D02'),
    'LINK_BANNER_2_CORPO', replace(o.briefing_data->>'LINK_BANNER_2_CORPO', 'S2D01', 'S2D02'),
    'UTM_CAMPANHA', replace(o.briefing_data->>'UTM_CAMPANHA', '_EMAIL3_', '_EMAIL4_')),
  o.partner, o.segment, o.subgroup, $gaas$Semana 2$gaas$, array[]::text[], $gaas$d2d20000-0000-4000-8000-0000000000e4$gaas$::uuid, 'draft', 1, $gaas$builtin-plurix-v13$gaas$, false,
  $gaas${"origem": "planilha Regua_Plurix_TopoFunil_Proposta_Outubro26_3 (E-mail 4)", "mudanca": "segundo bloco em blocos visuais (content_blocks.py)", "rede": "E-mail 3 da V2 da mesma rede, link S2D02 e UTM EMAIL4"}$gaas$::jsonb || jsonb_build_object('importKey', $gaas$V2 TOPO DE FUNIL DINÂMICO|E-mail 4|$gaas$ || (o.briefing_data->>'NM_PRODUTO_INTERNO'))
from origem o
on conflict (id) do nothing;

insert into public.dynamic_email_briefing_versions (briefing_id, version, snapshot, change_summary, warnings)
select b.id, 1, b.briefing_data, 'E-mail 4 criado a partir da planilha de outubro e do E-mail 3 da mesma rede.', '[]'::jsonb
from public.dynamic_email_briefings b
where b.segment = $gaas$V2 TOPO DE FUNIL DINÂMICO$gaas$ and b.campaign_group_id = $gaas$d2d20000-0000-4000-8000-0000000000e4$gaas$::uuid
on conflict (briefing_id, version) do nothing;

do $check$
begin
  if (select md5(source) from public.dynamic_email_template_slots where id = $gaas$builtin-plurix-v13$gaas$) <> 'd93d83a35b7e45d7c8cb0a976351cba2' then
    raise exception 'PLURIX V13: template gravado diferente do fixture';
  end if;
  if (select count(*) from public.dynamic_email_briefings where segment = $gaas$V2 TOPO DE FUNIL DINÂMICO$gaas$ and status <> 'archived'
      and briefing_data->>'SEQUENCIA' = 'E-mail 4' and briefing_data->>'LINK_CTA_1' like '%S2D02%'
      and briefing_data->>'UTM_CAMPANHA' like '%\_EMAIL4\_%') <> 6 then
    raise exception 'V2 E-mail 4: esperado 6 redes com link S2D02 e UTM EMAIL4';
  end if;
  if exists (select 1 from public.dynamic_email_briefings where segment = $gaas$V2 TOPO DE FUNIL DINÂMICO$gaas$ and status <> 'archived'
      and briefing_data->>'SEQUENCIA' = $gaas$E-mail 1$gaas$ and md5(coalesce(briefing_data->>$gaas$COPY_2_PRETO$gaas$, '')) <> '7b59bc419a66da57675c692d1ee2570a')
    or not exists (select 1 from public.dynamic_email_briefings where segment = $gaas$V2 TOPO DE FUNIL DINÂMICO$gaas$ and status <> 'archived'
      and briefing_data->>'SEQUENCIA' = $gaas$E-mail 1$gaas$) then
    raise exception 'V2 E-mails 3 e 4: E-mail 1 COPY_2_PRETO diferente do gerado';
  end if;
  if exists (select 1 from public.dynamic_email_briefings where segment = $gaas$V2 TOPO DE FUNIL DINÂMICO$gaas$ and status <> 'archived'
      and briefing_data->>'SEQUENCIA' = $gaas$E-mail 2$gaas$ and md5(coalesce(briefing_data->>$gaas$MENSAGEM_LIMITE$gaas$, '')) <> '918477f37abb9300c14068394d9fd32f')
    or not exists (select 1 from public.dynamic_email_briefings where segment = $gaas$V2 TOPO DE FUNIL DINÂMICO$gaas$ and status <> 'archived'
      and briefing_data->>'SEQUENCIA' = $gaas$E-mail 2$gaas$) then
    raise exception 'V2 E-mails 3 e 4: E-mail 2 MENSAGEM_LIMITE diferente do gerado';
  end if;
  if exists (select 1 from public.dynamic_email_briefings where segment = $gaas$V2 TOPO DE FUNIL DINÂMICO$gaas$ and status <> 'archived'
      and briefing_data->>'SEQUENCIA' = $gaas$E-mail 3$gaas$ and md5(coalesce(briefing_data->>$gaas$COPY_2_PRETO$gaas$, '')) <> '98b712b393368b83aa9c2f5a64d9206a')
    or not exists (select 1 from public.dynamic_email_briefings where segment = $gaas$V2 TOPO DE FUNIL DINÂMICO$gaas$ and status <> 'archived'
      and briefing_data->>'SEQUENCIA' = $gaas$E-mail 3$gaas$) then
    raise exception 'V2 E-mails 3 e 4: E-mail 3 COPY_2_PRETO diferente do gerado';
  end if;
  if exists (select 1 from public.dynamic_email_briefings where segment = $gaas$V2 TOPO DE FUNIL DINÂMICO$gaas$ and status <> 'archived'
      and briefing_data->>'SEQUENCIA' = $gaas$E-mail 3$gaas$ and md5(coalesce(briefing_data->>$gaas$MENSAGEM_LIMITE$gaas$, '')) <> '213144eed4ffc144733d8ba1b77892a5')
    or not exists (select 1 from public.dynamic_email_briefings where segment = $gaas$V2 TOPO DE FUNIL DINÂMICO$gaas$ and status <> 'archived'
      and briefing_data->>'SEQUENCIA' = $gaas$E-mail 3$gaas$) then
    raise exception 'V2 E-mails 3 e 4: E-mail 3 MENSAGEM_LIMITE diferente do gerado';
  end if;
  if exists (select 1 from public.dynamic_email_briefings where segment = $gaas$V2 TOPO DE FUNIL DINÂMICO$gaas$ and status <> 'archived'
      and briefing_data->>'SEQUENCIA' = $gaas$E-mail 3$gaas$ and briefing_data->>'NM_PRODUTO_INTERNO' = $gaas$AMIGAO$gaas$ and md5(coalesce(briefing_data->>$gaas$COPY_1_PRETO$gaas$, '')) <> '48d804d707319d6c78c8d7d8d708ef2b')
    or not exists (select 1 from public.dynamic_email_briefings where segment = $gaas$V2 TOPO DE FUNIL DINÂMICO$gaas$ and status <> 'archived'
      and briefing_data->>'SEQUENCIA' = $gaas$E-mail 3$gaas$ and briefing_data->>'NM_PRODUTO_INTERNO' = $gaas$AMIGAO$gaas$) then
    raise exception 'V2 E-mails 3 e 4: E-mail 3 COPY_1_PRETO AMIGAO diferente do gerado';
  end if;
  if exists (select 1 from public.dynamic_email_briefings where segment = $gaas$V2 TOPO DE FUNIL DINÂMICO$gaas$ and status <> 'archived'
      and briefing_data->>'SEQUENCIA' = $gaas$E-mail 3$gaas$ and briefing_data->>'NM_PRODUTO_INTERNO' = $gaas$AVENIDA$gaas$ and md5(coalesce(briefing_data->>$gaas$COPY_1_PRETO$gaas$, '')) <> '2d346f1809b63d285fb23714bae657e0')
    or not exists (select 1 from public.dynamic_email_briefings where segment = $gaas$V2 TOPO DE FUNIL DINÂMICO$gaas$ and status <> 'archived'
      and briefing_data->>'SEQUENCIA' = $gaas$E-mail 3$gaas$ and briefing_data->>'NM_PRODUTO_INTERNO' = $gaas$AVENIDA$gaas$) then
    raise exception 'V2 E-mails 3 e 4: E-mail 3 COPY_1_PRETO AVENIDA diferente do gerado';
  end if;
  if exists (select 1 from public.dynamic_email_briefings where segment = $gaas$V2 TOPO DE FUNIL DINÂMICO$gaas$ and status <> 'archived'
      and briefing_data->>'SEQUENCIA' = $gaas$E-mail 3$gaas$ and briefing_data->>'NM_PRODUTO_INTERNO' = $gaas$BOA$gaas$ and md5(coalesce(briefing_data->>$gaas$COPY_1_PRETO$gaas$, '')) <> '62d6c40c5dec7580662565dbdcbece9d')
    or not exists (select 1 from public.dynamic_email_briefings where segment = $gaas$V2 TOPO DE FUNIL DINÂMICO$gaas$ and status <> 'archived'
      and briefing_data->>'SEQUENCIA' = $gaas$E-mail 3$gaas$ and briefing_data->>'NM_PRODUTO_INTERNO' = $gaas$BOA$gaas$) then
    raise exception 'V2 E-mails 3 e 4: E-mail 3 COPY_1_PRETO BOA diferente do gerado';
  end if;
  if exists (select 1 from public.dynamic_email_briefings where segment = $gaas$V2 TOPO DE FUNIL DINÂMICO$gaas$ and status <> 'archived'
      and briefing_data->>'SEQUENCIA' = $gaas$E-mail 3$gaas$ and briefing_data->>'NM_PRODUTO_INTERNO' = $gaas$PARANA$gaas$ and md5(coalesce(briefing_data->>$gaas$COPY_1_PRETO$gaas$, '')) <> '04058def21300b854cfdf21a5beaca5c')
    or not exists (select 1 from public.dynamic_email_briefings where segment = $gaas$V2 TOPO DE FUNIL DINÂMICO$gaas$ and status <> 'archived'
      and briefing_data->>'SEQUENCIA' = $gaas$E-mail 3$gaas$ and briefing_data->>'NM_PRODUTO_INTERNO' = $gaas$PARANA$gaas$) then
    raise exception 'V2 E-mails 3 e 4: E-mail 3 COPY_1_PRETO PARANA diferente do gerado';
  end if;
  if exists (select 1 from public.dynamic_email_briefings where segment = $gaas$V2 TOPO DE FUNIL DINÂMICO$gaas$ and status <> 'archived'
      and briefing_data->>'SEQUENCIA' = $gaas$E-mail 3$gaas$ and briefing_data->>'NM_PRODUTO_INTERNO' = $gaas$COMPRE MAIS$gaas$ and md5(coalesce(briefing_data->>$gaas$COPY_1_PRETO$gaas$, '')) <> '91bcde664dfaa62206d01a7ea1e4d4b3')
    or not exists (select 1 from public.dynamic_email_briefings where segment = $gaas$V2 TOPO DE FUNIL DINÂMICO$gaas$ and status <> 'archived'
      and briefing_data->>'SEQUENCIA' = $gaas$E-mail 3$gaas$ and briefing_data->>'NM_PRODUTO_INTERNO' = $gaas$COMPRE MAIS$gaas$) then
    raise exception 'V2 E-mails 3 e 4: E-mail 3 COPY_1_PRETO COMPRE MAIS diferente do gerado';
  end if;
  if exists (select 1 from public.dynamic_email_briefings where segment = $gaas$V2 TOPO DE FUNIL DINÂMICO$gaas$ and status <> 'archived'
      and briefing_data->>'SEQUENCIA' = $gaas$E-mail 3$gaas$ and briefing_data->>'NM_PRODUTO_INTERNO' = $gaas$SUPERPAO$gaas$ and md5(coalesce(briefing_data->>$gaas$COPY_1_PRETO$gaas$, '')) <> '91bcde664dfaa62206d01a7ea1e4d4b3')
    or not exists (select 1 from public.dynamic_email_briefings where segment = $gaas$V2 TOPO DE FUNIL DINÂMICO$gaas$ and status <> 'archived'
      and briefing_data->>'SEQUENCIA' = $gaas$E-mail 3$gaas$ and briefing_data->>'NM_PRODUTO_INTERNO' = $gaas$SUPERPAO$gaas$) then
    raise exception 'V2 E-mails 3 e 4: E-mail 3 COPY_1_PRETO SUPERPAO diferente do gerado';
  end if;
  if exists (select 1 from public.dynamic_email_briefings where segment = $gaas$V2 TOPO DE FUNIL DINÂMICO$gaas$ and status <> 'archived'
      and briefing_data->>'SEQUENCIA' = $gaas$E-mail 4$gaas$ and md5(coalesce(briefing_data->>$gaas$COPY_2_PRETO$gaas$, '')) <> '1fad10878e07ad7bd332c281c594da8b')
    or not exists (select 1 from public.dynamic_email_briefings where segment = $gaas$V2 TOPO DE FUNIL DINÂMICO$gaas$ and status <> 'archived'
      and briefing_data->>'SEQUENCIA' = $gaas$E-mail 4$gaas$) then
    raise exception 'V2 E-mails 3 e 4: E-mail 4 COPY_2_PRETO diferente do gerado';
  end if;
  if exists (select 1 from public.dynamic_email_briefings where segment = $gaas$V2 TOPO DE FUNIL DINÂMICO$gaas$ and status <> 'archived'
      and briefing_data->>'SEQUENCIA' = $gaas$E-mail 4$gaas$ and md5(coalesce(briefing_data->>$gaas$MENSAGEM_LIMITE$gaas$, '')) <> '6c39b6223394a3f894ad15ab8f0e7f91')
    or not exists (select 1 from public.dynamic_email_briefings where segment = $gaas$V2 TOPO DE FUNIL DINÂMICO$gaas$ and status <> 'archived'
      and briefing_data->>'SEQUENCIA' = $gaas$E-mail 4$gaas$) then
    raise exception 'V2 E-mails 3 e 4: E-mail 4 MENSAGEM_LIMITE diferente do gerado';
  end if;
  if exists (select 1 from public.dynamic_email_briefings where segment = $gaas$V2 TOPO DE FUNIL DINÂMICO$gaas$ and status <> 'archived'
      and briefing_data->>'SEQUENCIA' = $gaas$E-mail 4$gaas$ and briefing_data->>'NM_PRODUTO_INTERNO' = $gaas$AMIGAO$gaas$ and md5(coalesce(briefing_data->>$gaas$COPY_1_PRETO$gaas$, '')) <> 'b82a33230449ef3ae9d308fd37321fec')
    or not exists (select 1 from public.dynamic_email_briefings where segment = $gaas$V2 TOPO DE FUNIL DINÂMICO$gaas$ and status <> 'archived'
      and briefing_data->>'SEQUENCIA' = $gaas$E-mail 4$gaas$ and briefing_data->>'NM_PRODUTO_INTERNO' = $gaas$AMIGAO$gaas$) then
    raise exception 'V2 E-mails 3 e 4: E-mail 4 COPY_1_PRETO AMIGAO diferente do gerado';
  end if;
  if exists (select 1 from public.dynamic_email_briefings where segment = $gaas$V2 TOPO DE FUNIL DINÂMICO$gaas$ and status <> 'archived'
      and briefing_data->>'SEQUENCIA' = $gaas$E-mail 4$gaas$ and briefing_data->>'NM_PRODUTO_INTERNO' = $gaas$AVENIDA$gaas$ and md5(coalesce(briefing_data->>$gaas$COPY_1_PRETO$gaas$, '')) <> '7b850dbd4907620115d23b1e8783e1d0')
    or not exists (select 1 from public.dynamic_email_briefings where segment = $gaas$V2 TOPO DE FUNIL DINÂMICO$gaas$ and status <> 'archived'
      and briefing_data->>'SEQUENCIA' = $gaas$E-mail 4$gaas$ and briefing_data->>'NM_PRODUTO_INTERNO' = $gaas$AVENIDA$gaas$) then
    raise exception 'V2 E-mails 3 e 4: E-mail 4 COPY_1_PRETO AVENIDA diferente do gerado';
  end if;
  if exists (select 1 from public.dynamic_email_briefings where segment = $gaas$V2 TOPO DE FUNIL DINÂMICO$gaas$ and status <> 'archived'
      and briefing_data->>'SEQUENCIA' = $gaas$E-mail 4$gaas$ and briefing_data->>'NM_PRODUTO_INTERNO' = $gaas$BOA$gaas$ and md5(coalesce(briefing_data->>$gaas$COPY_1_PRETO$gaas$, '')) <> '4721204dffa82c0d59f59edc894c47d2')
    or not exists (select 1 from public.dynamic_email_briefings where segment = $gaas$V2 TOPO DE FUNIL DINÂMICO$gaas$ and status <> 'archived'
      and briefing_data->>'SEQUENCIA' = $gaas$E-mail 4$gaas$ and briefing_data->>'NM_PRODUTO_INTERNO' = $gaas$BOA$gaas$) then
    raise exception 'V2 E-mails 3 e 4: E-mail 4 COPY_1_PRETO BOA diferente do gerado';
  end if;
  if exists (select 1 from public.dynamic_email_briefings where segment = $gaas$V2 TOPO DE FUNIL DINÂMICO$gaas$ and status <> 'archived'
      and briefing_data->>'SEQUENCIA' = $gaas$E-mail 4$gaas$ and briefing_data->>'NM_PRODUTO_INTERNO' = $gaas$PARANA$gaas$ and md5(coalesce(briefing_data->>$gaas$COPY_1_PRETO$gaas$, '')) <> 'a388da0e45bc49cce5aff0224cc687c9')
    or not exists (select 1 from public.dynamic_email_briefings where segment = $gaas$V2 TOPO DE FUNIL DINÂMICO$gaas$ and status <> 'archived'
      and briefing_data->>'SEQUENCIA' = $gaas$E-mail 4$gaas$ and briefing_data->>'NM_PRODUTO_INTERNO' = $gaas$PARANA$gaas$) then
    raise exception 'V2 E-mails 3 e 4: E-mail 4 COPY_1_PRETO PARANA diferente do gerado';
  end if;
  if exists (select 1 from public.dynamic_email_briefings where segment = $gaas$V2 TOPO DE FUNIL DINÂMICO$gaas$ and status <> 'archived'
      and briefing_data->>'SEQUENCIA' = $gaas$E-mail 4$gaas$ and briefing_data->>'NM_PRODUTO_INTERNO' = $gaas$COMPRE MAIS$gaas$ and md5(coalesce(briefing_data->>$gaas$COPY_1_PRETO$gaas$, '')) <> 'd43b64898c6bed7f53949ebada5264a5')
    or not exists (select 1 from public.dynamic_email_briefings where segment = $gaas$V2 TOPO DE FUNIL DINÂMICO$gaas$ and status <> 'archived'
      and briefing_data->>'SEQUENCIA' = $gaas$E-mail 4$gaas$ and briefing_data->>'NM_PRODUTO_INTERNO' = $gaas$COMPRE MAIS$gaas$) then
    raise exception 'V2 E-mails 3 e 4: E-mail 4 COPY_1_PRETO COMPRE MAIS diferente do gerado';
  end if;
  if exists (select 1 from public.dynamic_email_briefings where segment = $gaas$V2 TOPO DE FUNIL DINÂMICO$gaas$ and status <> 'archived'
      and briefing_data->>'SEQUENCIA' = $gaas$E-mail 4$gaas$ and briefing_data->>'NM_PRODUTO_INTERNO' = $gaas$SUPERPAO$gaas$ and md5(coalesce(briefing_data->>$gaas$COPY_1_PRETO$gaas$, '')) <> 'd43b64898c6bed7f53949ebada5264a5')
    or not exists (select 1 from public.dynamic_email_briefings where segment = $gaas$V2 TOPO DE FUNIL DINÂMICO$gaas$ and status <> 'archived'
      and briefing_data->>'SEQUENCIA' = $gaas$E-mail 4$gaas$ and briefing_data->>'NM_PRODUTO_INTERNO' = $gaas$SUPERPAO$gaas$) then
    raise exception 'V2 E-mails 3 e 4: E-mail 4 COPY_1_PRETO SUPERPAO diferente do gerado';
  end if;
end
$check$;
