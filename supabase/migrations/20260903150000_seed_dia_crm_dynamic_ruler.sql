-- Régua DIA Topo de Funil (CRM): 8 e-mails, 4 semanas e um único template dinâmico.
-- Fonte editorial/visual: REGUA NOVA DIA.rtf, recebida em 2026-09-03.

do $$
begin
  if not exists (select 1 from public.dynamic_email_template_slots where id = 'b2c-classic-vibe-dynamic-v1') then
    raise exception 'Template dinâmico canônico b2c-classic-vibe-dynamic-v1 não encontrado';
  end if;
end $$;

with variants(sequence_no, week_no, subject, preheader, header_url, banner_1, banner_2, copy_1, title_2, copy_2, role_in_ruler, email_objective, key_message) as (
  values
  (1,1,'Peça seu cartão Dia Afinz Visa e concorra a R$100 mil todo mês!','Peça seu cartão Dia Afinz Visa e concorra a R$100 mil todo mês!','https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/40551a55-d4f8-45ce-9def-5f4911b948e9.png','https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/82ec3fce-c040-4f7a-b450-e96b9f062489.png','',
   'Peça seu <b>cartão Dia Afinz Visa</b> e ganhe créditos para aproveitar super ofertas e descontos no app Vibe.<br><br><b>E mais:</b> usando seus Créditos Vibe, você concorre a <b>R$100 mil todo mês!</b>','E não para por aí!','Com o cartão Dia Afinz Visa você tem benefícios exclusivos no App Vibe. Aproveite:',
   'Apresentar a proposta completa','Gerar consideração pelo cartão Dia Afinz Visa','Crédito, vantagens no DIA e benefícios Vibe'),
  (2,1,'GANHE Créditos Vibe para fazer mais no fim de semana!','Peça seu cartão Dia Afinz Visa e concorra a R$100 MIL todo mês.','https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/fba3035d-f5dd-411d-83e2-ea61d2d885ba.png','https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/cbe46733-4c4e-472a-8382-e8417d6891d3.png','',
   'Com o <b>cartão Dia Afinz Visa</b>, você faz suas compras no DIA Supermercados e ainda ganha Créditos Vibe para fazer mais no fim de semana.','Comece a usar agora','Peça o seu agora mesmo, comece a utilizar o cartão Afinz virtual e ganhe R$100 em Créditos Vibe fazendo a primeira compra. Veja como é fácil pedir o seu cartão e aproveitar todas essas vantagens. Garanta já o seu! ',
   'Reforçar utilidade imediata','Converter interesse em solicitação','Compras no DIA viram vantagens e Créditos Vibe'),
  (3,2,'Faça mais no supermercado com o seu cartão Dia Afinz Visa!','Ganhe até R$100 em Créditos Vibe na 1ª compra. Aproveite!','https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/10fbe158-bcf3-4f86-adae-be6e3452ecee.png','https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/e31039cf-fa85-41b7-bf16-9cbccacaaf10.gif','',
   'Está esperando o quê para pedir seu <b>cartão Dia Afinz Visa</b>? Além das vantagens exclusivas para comprar no DIA Supermercados, você transforma suas compras em Créditos Vibe para aproveitar ofertas e benefícios em diversas marcas.','Confira todos os benefícios','Com o cartão Dia Afinz Visa você também ganha Créditos Vibe exclusivos. Aproveite descontos no App Vibe em cinema, delivery, presentes e muito mais.',
   'Ampliar percepção de valor','Mostrar a amplitude dos benefícios','Vantagens no supermercado e em diversas marcas'),
  (4,2,'Peça já o seu cartão Dia Afinz Visa e concorra a R$100 mil todo mês!','Transforme suas compras em vantagens e faça mais no fim de semana.','https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/f6f75884-2220-4374-9f8c-dae73e5c9f7d.png','https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/82ec3fce-c040-4f7a-b450-e96b9f062489.png','',
   'Com o <b>cartão Dia Afinz Visa</b>, suas compras podem virar ainda mais vantagens para aproveitar no dia a dia. Ao pedir o seu cartão, você ganha Créditos Vibe para trocar por benefícios em diversas marcas e categorias.','Benefícios exclusivos no App Vibe','Peça já o seu novo cartão de crédito Dia Afinz Visa e faça mais.',
   'Consolidar a proposta','Reduzir a postergação da solicitação','Compras viram vantagens no dia a dia'),
  (5,3,'Seu cartão Dia Afinz Visa pode fazer mais por você!','Garanta seu cartão e concorra a R$100 mil todo mês.','https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/4745912c-12a6-491e-890a-84edb5cb07cd.png','https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/4db4ae3d-6fd9-4256-b87e-7b875b932ecc.png','https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/ea13cca4-e778-41d9-b346-bfdc9d148bad.png',
   'Não deixe para depois! Com o <b>cartão Dia Afinz Visa</b>, sua compra vira vantagem todo mês. Peça já o seu e comece a aproveitar as vantagens exclusivas.','Créditos Vibe em mais de 250 marcas','Aproveite descontos nas suas marcas favoritas direto no app Vibe. Veja como é fácil pedir o seu em poucos passos e faça seu dinheiro render.',
   'Retomar com prova de variedade','Acelerar conversão com benefícios concretos','Créditos Vibe e descontos em mais de 250 marcas'),
  (6,3,'Ainda dá tempo de pedir seu cartão Dia Afinz Visa!','Ganhe até R$100 em Créditos Vibe e concorra a R$100 MIL todo mês.','https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/59dbf7b1-4209-4c54-87e5-b02b2128d2df.png','https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/814bdf22-1f7d-4680-a707-682e9d61b9e8.png','',
   'Ainda não pediu seu <b>cartão Dia Afinz Visa</b>? Peça agora e faça sua compra virar vantagem todo mês. Não perca os créditos exclusivos para comprar nas melhores marcas, direto no app Vibe.','Peça agora e faça mais','O Vibe reúne descontos incríveis em grandes marcas, perfeito para você economizar.',
   'Criar senso de oportunidade','Recuperar quem ainda não solicitou','Ainda dá tempo de transformar compras em vantagens'),
  (7,4,'Não perca! GANHE R$100 em Créditos Vibe com o cartão Dia Afinz Visa!','Descontos em +250 marcas: delivery, viagens, cinema e muito mais.','https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/56312843-98f5-42b9-b460-3f54bc651abf.png','https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/3736d8c4-a8ce-47fb-944c-911039706324.png','https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/4a36a1a8-9294-48f7-b68d-7ea90723f469.png',
   'Não perca a chance de garantir os melhores descontos em cinema, delivery, viagens e muito mais com seu <b>cartão Dia Afinz Visa</b>.','Faça sua compra virar vantagem','Com o cartão Dia Afinz Visa você tem benefícios exclusivos e descontos em mais de 250 marcas no app Vibe.',
   'Intensificar urgência','Recuperar não convertidos com amplitude','Descontos em mais de 250 marcas e categorias'),
  (8,4,'ÚLTIMA CHANCE: Peça agora o seu cartão Dia Afinz Visa!','Concorra a R$100 MIL todo mês e ganhe R$100 em Créditos Vibe.','https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/6c27af06-ca71-4f98-9c92-562bfb1791c7.png','https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/82ec3fce-c040-4f7a-b450-e96b9f062489.png','https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/e31039cf-fa85-41b7-bf16-9cbccacaaf10.gif',
   '<b>Última chance</b> para pedir seu cartão Dia Afinz Visa! Peça seu cartão e ganhe Créditos Vibe para trocar por benefícios em mais de 250 grandes marcas e categorias como delivery, viagens, cinema e muito mais.','Benefícios e descontos exclusivos','Peça já o seu novo cartão de crédito Dia Afinz Visa e faça mais no seu dia a dia.',
   'Encerrar a régua com urgência','Capturar a conversão final','Última oportunidade para acessar cartão, créditos e benefícios')
), common as (
  select jsonb_build_object(
    'DT_INICIO','09/03/2026 00:00:00','DT_FIM','12/31/2028 23:59:59','TP_CAMPANHA','CRM',
    'CARTAO_NM_COMERCIAL','Dia Afinz Visa','NM_PRODUTO_INTERNO','DIA',
    'TITULO_COPY_1_AZUL','Olá, %%=v(@FirstName)=%%','COR_COPY_1','#00C6CC','TAMANHO_DA_FONTE_TITULO_COPY_1','22',
    'COR_COPY_PRETO_1','#111111','TAMANHO_DA_FONTE_TITULO_COPY_PRETO_1','19',
    'TITULO_CTA_1','Pedir meu cartão','COR_TITULO_COPY_2','#00C6CC','TAMANHO_DA_FONTE_TITULO_COPY_2','20',
    'COR_COPY_2','#111111','TAMANHO_DA_FONTE_COPY_2','18','TITULO_CTA_2','Pedir meu cartão',
    'LINK_BANNER_1_CORPO','','LINK_BANNER_2_CORPO','','BANNER_3_CORPO','','LINK_BANNER_3_CORPO','',
    'NOTA_LEGAL','*Desconto de R$20 disponível em até 10 dias após a data da ativação do cartão. Válido por 15 dias após a disponibilização no APP do Club Dia, apenas para a primeira compra acima de R$120. Para garantir a ativação do cartão, é necessário utilizá-lo em qualquer estabelecimento. / **Desconto de 5% disponível em até 10 dias após realizar 1 compra por mês. Desconto não aplicável para as categorias de Commodities (Leite, Café, Óleo, Açúcar e Arroz). Válido por 45 dias após a disponibilização no APP do Club Dia, apenas para compras acima de R$50 em produtos marca própria Dia. / ***Para ter acesso ao crédito de R$15 é necessário realizar 4 compras acima de R$50 dentro do mesmo mês, em dias diferentes. Para ter acesso ao crédito de R$30 é necessário realizar 6 compras acima de R$50 dentro do mesmo mês, em dias diferentes. Os créditos serão disponibilizados em até 10 dias no APP Club Dia e serão válidos por 20 dias, sendo limitado a 1 compra de produtos Marca Própria Dia. Os créditos não são válidos para as categorias de Commodities (Leite, Café, Óleo, Açúcar e Arroz). / ****Para ter acesso aos benefícios, é necessário se identificar no caixa com o CPF no Club Dia, estar logado no aplicativo e realizar a ativação dos descontos em ''Meus Cupons''. / *****Programa Você Bem com isenção de 6 meses. Sujeito à análise de crédito. Após realizar a primeira compra com o seu cartão com anuidade ativa, independentemente do valor, você receberá em até 5 dias úteis R$100 em créditos no App Vibe, com validade de até 6 meses. Para visualizar o seu saldo, baixe o App Vibe. A primeira compra deverá ser realizada em até 30 dias. / A cada fatura paga, com anuidade ativa, você receberá mais créditos no App Vibe, conforme condições da loja parceira, também com validade de até 6 meses. Os benefícios acumulados no app da Vibe podem ser trocados por descontos e vantagens das marcas parceiras. Eles são dinâmicos e podem ser alterados ou apresentados conforme as regras de elegibilidade de cada fornecedor parceiro. / Consulte o regulamento completo no app da Vibe. Promoção válida por tempo limitado, podendo ser alterada ou encerrada a qualquer momento, sem aviso prévio. / Sujeito a disponibilidade.',
    'COR_NOTA_LEGAL','#777777','TAMANHO_DA_FONTE_NOTA_LEGAL','9',
    'RODAPE','Ouvidoria: 0800 772 0602<br>Enviado por Banco Afinz S.A. - Banco Múltiplo - CNPJ: 04.814.563/0001-74 | Afinz Instituição de Pagamento S.A. - CNPJ: 60.114.865/0001-00<br>Rua XV de Novembro, 45 - Sorocaba, SP'
  ) data
), prepared as (
  select v.*,
    ((substr(md5('dia-crm-briefing-'||sequence_no),1,8)||'-'||substr(md5('dia-crm-briefing-'||sequence_no),9,4)||'-4'||substr(md5('dia-crm-briefing-'||sequence_no),14,3)||'-8'||substr(md5('dia-crm-briefing-'||sequence_no),18,3)||'-'||substr(md5('dia-crm-briefing-'||sequence_no),21,12))::uuid) briefing_id,
    ((substr(md5('dia-crm-group-'||sequence_no),1,8)||'-'||substr(md5('dia-crm-group-'||sequence_no),9,4)||'-4'||substr(md5('dia-crm-group-'||sequence_no),14,3)||'-8'||substr(md5('dia-crm-group-'||sequence_no),18,3)||'-'||substr(md5('dia-crm-group-'||sequence_no),21,12))::uuid) group_id,
    common.data || jsonb_build_object(
      'UTM_CAMPANHA','DIA_CRM_SEMANA'||week_no||'_EMAIL'||sequence_no,
      'SEQUENCIA','E-mail '||sequence_no,'ASSUNTO',subject,'PRE_CABECALHO',preheader,'HEADER',header_url,
      'COPY_1_PRETO',copy_1,'LINK_CTA_1','https://cartao-afinz.onelink.me/9ODN/mtuc2zhn?c=dia_topo_de_funil_vibe&af_sub1=crm&af_sub2=s'||week_no||'&af_sub3=dia_email_vibe_bsp_S'||week_no||'D0'||(case when sequence_no % 2 = 1 then 1 else 2 end),
      'TITULO_COPY_2',title_2,'COPY_2_PRETO',copy_2,'LINK_CTA_2','https://cartao-afinz.onelink.me/9ODN/mtuc2zhn?c=dia_topo_de_funil_vibe&af_sub1=crm&af_sub2=s'||week_no||'&af_sub3=dia_email_vibe_bsp_S'||week_no||'D0'||(case when sequence_no % 2 = 1 then 1 else 2 end),
      'BANNER_1_CORPO',banner_1,'BANNER_2_CORPO',banner_2
    ) briefing_data
  from variants v cross join common
), upserted as (
  insert into public.dynamic_email_briefings
    (id, briefing_data, partner, segment, subgroup, week_key, activity_names, campaign_group_id, template_slot_id, status, version, journey_confirmed, acknowledged_missing_activity, legal_override)
  select briefing_id, briefing_data, 'Dia', 'CRM', 'Dia', 'Semana '||week_no, '{}', group_id,
    'b2c-classic-vibe-dynamic-v1', 'needs_review', 1, false, true, false
  from prepared
  on conflict (id) do update set briefing_data=excluded.briefing_data, partner=excluded.partner, segment=excluded.segment,
    subgroup=excluded.subgroup, week_key=excluded.week_key, activity_names=excluded.activity_names,
    campaign_group_id=excluded.campaign_group_id, template_slot_id=excluded.template_slot_id,
    status=excluded.status, version=public.dynamic_email_briefings.version+1, updated_at=now()
  returning id
)
select count(*) from upserted;

with ruler as (
  insert into public.dynamic_email_ruler_strategies
    (name, description, business_front, ruler_family, partner, product, segment, objective, audience, journey_stage, narrative_transformation, commercial_intensity, success_criteria, editorial_status, template_slot_id)
  values ('Topo de Funil DIA · CRM','Régua de quatro semanas e oito e-mails do cartão Dia Afinz Visa.','acquisition','top_of_funnel','Dia','Dia Afinz Visa','CRM','Converter a base CRM em solicitações do cartão Dia Afinz Visa.','Clientes DIA elegíveis na base CRM.','Topo de funil','Da descoberta dos benefícios à urgência final.','progressive','Solicitação do cartão','ready','b2c-classic-vibe-dynamic-v1')
  on conflict (partner,segment,coalesce(product,''),coalesce(name,''),version) do update set
    description=excluded.description, objective=excluded.objective, audience=excluded.audience,
    journey_stage=excluded.journey_stage, narrative_transformation=excluded.narrative_transformation,
    commercial_intensity=excluded.commercial_intensity, success_criteria=excluded.success_criteria,
    editorial_status=excluded.editorial_status, template_slot_id=excluded.template_slot_id, updated_at=now()
  returning id
), variants(sequence_no, week_no, subject, preheader, role_in_ruler, email_objective, key_message) as (
  values
  (1,1,'Peça seu cartão Dia Afinz Visa e concorra a R$100 mil todo mês!','Peça seu cartão Dia Afinz Visa e concorra a R$100 mil todo mês!','Apresentar a proposta completa','Gerar consideração','Crédito, DIA e Vibe'),
  (2,1,'GANHE Créditos Vibe para fazer mais no fim de semana!','Peça seu cartão Dia Afinz Visa e concorra a R$100 MIL todo mês.','Reforçar utilidade imediata','Converter interesse','Compras viram vantagens'),
  (3,2,'Faça mais no supermercado com o seu cartão Dia Afinz Visa!','Ganhe até R$100 em Créditos Vibe na 1ª compra. Aproveite!','Ampliar percepção de valor','Mostrar amplitude','Benefícios além do supermercado'),
  (4,2,'Peça já o seu cartão Dia Afinz Visa e concorra a R$100 mil todo mês!','Transforme suas compras em vantagens e faça mais no fim de semana.','Consolidar a proposta','Reduzir postergação','Compras viram vantagens'),
  (5,3,'Seu cartão Dia Afinz Visa pode fazer mais por você!','Garanta seu cartão e concorra a R$100 mil todo mês.','Retomar com variedade','Acelerar conversão','Mais de 250 marcas'),
  (6,3,'Ainda dá tempo de pedir seu cartão Dia Afinz Visa!','Ganhe até R$100 em Créditos Vibe e concorra a R$100 MIL todo mês.','Criar oportunidade','Recuperar não convertidos','Ainda dá tempo'),
  (7,4,'Não perca! GANHE R$100 em Créditos Vibe com o cartão Dia Afinz Visa!','Descontos em +250 marcas: delivery, viagens, cinema e muito mais.','Intensificar urgência','Recuperar com amplitude','Mais de 250 marcas'),
  (8,4,'ÚLTIMA CHANCE: Peça agora o seu cartão Dia Afinz Visa!','Concorra a R$100 MIL todo mês e ganhe R$100 em Créditos Vibe.','Encerrar com urgência','Capturar conversão final','Última oportunidade')
)
insert into public.dynamic_email_email_strategies
  (ruler_strategy_id,campaign_group_id,partner,segment,week_key,sequence,functional_name,subject,preheader,role_in_ruler,email_objective,key_message,expected_action,value_proposition,primary_benefit,secondary_benefits,objection_addressed,proof,visual_hierarchy_strategy,cta_strategy,technical_status,editorial_status,visual_status,certification_status,field_provenance)
select ruler.id,
  ((substr(md5('dia-crm-group-'||sequence_no),1,8)||'-'||substr(md5('dia-crm-group-'||sequence_no),9,4)||'-4'||substr(md5('dia-crm-group-'||sequence_no),14,3)||'-8'||substr(md5('dia-crm-group-'||sequence_no),18,3)||'-'||substr(md5('dia-crm-group-'||sequence_no),21,12))::uuid),
  'Dia','CRM','Semana '||week_no,'E-mail '||sequence_no,'E-mail '||sequence_no||' · DIA CRM',subject,preheader,
  role_in_ruler,email_objective,key_message,'Pedir o cartão','Crédito com vantagens DIA e Vibe','Benefícios do cartão Dia Afinz Visa',
  '["Créditos Vibe","Descontos no DIA","Descontos em marcas parceiras"]'::jsonb,'Adiar a solicitação','Oferta, benefícios, imagens e condições presentes na referência','Header específico, proposta, benefício e CTA','CTA direto para solicitação','ready','ready','ready','not_tested','{"source":"REGUA NOVA DIA.rtf","adaptation":"shared_dynamic_template"}'::jsonb
from ruler cross join variants
on conflict (campaign_group_id) do update set ruler_strategy_id=excluded.ruler_strategy_id,subject=excluded.subject,
  preheader=excluded.preheader,role_in_ruler=excluded.role_in_ruler,email_objective=excluded.email_objective,
  key_message=excluded.key_message,technical_status='ready',editorial_status='ready',visual_status='ready',
  certification_status='not_tested',field_provenance=excluded.field_provenance,version=public.dynamic_email_email_strategies.version+1,updated_at=now();

insert into public.dynamic_email_segments
  (technical_name,display_name,business_front,source_table,source_value,partner,bu,origin,governance_status)
values ('CRM','Topo de Funil (CRM)','acquisition','activities','CRM','Dia','B2C','operational','existing')
on conflict (business_front,lower(technical_name),lower(coalesce(partner,''))) where governance_status <> 'archived'
do update set display_name=excluded.display_name,source_table=excluded.source_table,source_value=excluded.source_value,
  origin='operational',governance_status='existing',updated_at=now();

insert into public.dynamic_email_ruler_segments (ruler_strategy_id,segment_id,is_primary)
select r.id,s.id,true from public.dynamic_email_ruler_strategies r cross join public.dynamic_email_segments s
where r.partner='Dia' and r.segment='CRM' and r.product='Dia Afinz Visa' and r.name='Topo de Funil DIA · CRM'
  and s.business_front='acquisition' and lower(s.technical_name)='crm' and lower(coalesce(s.partner,''))='dia'
on conflict (ruler_strategy_id,segment_id) do update set is_primary=true;

with asset(name,url,slot,email_tags,width,height) as (values
  ('DIA CRM E-mail 1 · Header','https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/40551a55-d4f8-45ce-9def-5f4911b948e9.png','header',array['email-1'],600,null),
  ('DIA CRM E-mail 2 · Header','https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/fba3035d-f5dd-411d-83e2-ea61d2d885ba.png','header',array['email-2'],600,300),
  ('DIA CRM E-mail 3 · Header','https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/10fbe158-bcf3-4f86-adae-be6e3452ecee.png','header',array['email-3'],600,300),
  ('DIA CRM E-mail 4 · Header','https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/f6f75884-2220-4374-9f8c-dae73e5c9f7d.png','header',array['email-4'],600,null),
  ('DIA CRM E-mail 5 · Header','https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/4745912c-12a6-491e-890a-84edb5cb07cd.png','header',array['email-5'],600,300),
  ('DIA CRM E-mail 6 · Header','https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/59dbf7b1-4209-4c54-87e5-b02b2128d2df.png','header',array['email-6'],600,300),
  ('DIA CRM E-mail 7 · Header','https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/56312843-98f5-42b9-b460-3f54bc651abf.png','header',array['email-7'],600,300),
  ('DIA CRM E-mail 8 · Header','https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/6c27af06-ca71-4f98-9c92-562bfb1791c7.png','header',array['email-8'],600,null),
  ('DIA · Benefícios do cartão','https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/82ec3fce-c040-4f7a-b450-e96b9f062489.png','banner_1',array['email-1','email-4','email-8'],180,null),
  ('DIA · Como pedir o cartão','https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/cbe46733-4c4e-472a-8382-e8417d6891d3.png','banner_1',array['email-2'],600,283),
  ('DIA · Benefícios animados','https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/e31039cf-fa85-41b7-bf16-9cbccacaaf10.gif','banner_1',array['email-3','email-8'],600,null),
  ('DIA · Créditos e marcas','https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/4db4ae3d-6fd9-4256-b87e-7b875b932ecc.png','banner_1',array['email-5'],600,null),
  ('DIA · Passo a passo','https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/ea13cca4-e778-41d9-b346-bfdc9d148bad.png','banner_2',array['email-5'],500,88),
  ('DIA · Vibe marcas','https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/814bdf22-1f7d-4680-a707-682e9d61b9e8.png','banner_1',array['email-6'],600,null),
  ('DIA · Vibe e descontos','https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/3736d8c4-a8ce-47fb-944c-911039706324.png','banner_1',array['email-7'],600,null),
  ('DIA · Mais de 250 marcas','https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/4a36a1a8-9294-48f7-b68d-7ea90723f469.png','banner_2',array['email-7'],600,null)
)
insert into public.dynamic_email_assets
  (name,external_url,click_url,slot,bu,partner,segment,subgroup,product,alt_text,width,height,tags,status,version)
select name,url,null,slot,'B2C','Dia','CRM','Dia','Dia Afinz Visa',name,width,height,
  array['dia','crm','topo-de-funil','referencia-rtf']||email_tags,'ready',1 from asset
on conflict (external_url) do update set
  tags=(select array_agg(distinct tag) from unnest(public.dynamic_email_assets.tags||excluded.tags) tag),
  partner='Dia',segment='CRM',updated_at=now();
