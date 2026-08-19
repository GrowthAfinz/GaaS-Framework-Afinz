-- Substitui integralmente a caixa da Fábrica pelos dois e-mails Plurix aprovados.
-- Mantém a DE de 36 colunas e cria seis linhas técnicas por briefing visual.
delete from public.dynamic_email_briefings;

with signatures(product_key, display_name, footer_url, site_url, deeplink, banner_1_email_1) as (
  values
    ('AMIGAO', 'Amigão', 'https://stoplxmkt.blob.core.windows.net/plxmkt/20250625-EM-JORNADA_DE_AQUISICAO_MAIS_AMIGO-AFINZ-V2/footer-amigao.png', 'https://www.amigao.com/', 'https://mais-amigo.onelink.me/OfSm/fhmnfq0n', 'https://stoplxmkt.blob.core.windows.net/plxmkt/20250625-EM-JORNADA_DE_AQUISICAO_MAIS_AMIGO-AFINZ-V2/semana-01/beneficios-cartao-basicos-semana1-i2.png'),
    ('BOA', 'Boa Supermercados', 'https://stoplxmkt.blob.core.windows.net/plxmkt/20241125-EM-BOA-TEMPLATE-BLACK_FRIDAY_BANCO_DE_OFERTAS/footer-hd.png', 'https://www.boasupermercados.com.br/', 'https://mais-amigo.onelink.me/OfSm/21tz9kvu', 'https://stoplxmkt.blob.core.windows.net/plxmkt/20250625-EM-JORNADA_DE_AQUISICAO_MAIS_AMIGO-AFINZ-V2/semana-01/beneficios-cartao-flv-semana1-i2.png'),
    ('AVENIDA', 'Supermercados Avenida', 'https://stoplxmkt.blob.core.windows.net/plxmkt/20241125-EM-AVE-TEMPLATE-BLACK_FRIDAY_BANCO_DE_OFERTAS/footer-avenida.png', 'https://loja.supermercadosavenida.com.br/', 'https://mais-amigo.onelink.me/OfSm/igg3hn81', 'https://stoplxmkt.blob.core.windows.net/plxmkt/20250625-EM-JORNADA_DE_AQUISICAO_MAIS_AMIGO-AFINZ-V2/semana-01/beneficios-cartao-basicos-semana1-i2.png'),
    ('COMPRE MAIS', 'Compre Mais', 'https://stoplxmkt.blob.core.windows.net/plxmkt/20241125-EM-CPM-TEMPLATE-BLACK_FRIDAY_BANCO_DE_OFERTAS/footer-compre-mais.png', 'https://www.somoscompremais.com.br/', 'https://mais-amigo.onelink.me/OfSm/cvfabp9o', 'https://stoplxmkt.blob.core.windows.net/plxmkt/20250625-EM-JORNADA_DE_AQUISICAO_MAIS_AMIGO-AFINZ-V2/semana-01/banner-cartao-basicos.png'),
    ('PARANA', 'Paraná', 'https://stoplxmkt.blob.core.windows.net/plxmkt/20250625-EM-JORNADA_DE_AQUISICAO_MAIS_AMIGO-AFINZ-V2/footer-parana.png', 'https://www.paranasupermercados.com.br', 'https://mais-amigo.onelink.me/OfSm/8qywzwt2', 'https://stoplxmkt.blob.core.windows.net/plxmkt/20250625-EM-JORNADA_DE_AQUISICAO_MAIS_AMIGO-AFINZ-V2/semana-01/beneficios-cartao-basicos-semana1-i2.png'),
    ('SUPERPAO', 'Superpão', 'https://stoplxmkt.blob.core.windows.net/plxmkt/20241125-EM-SPO-TEMPLATE-BLACK_FRIDAY_BANCO_DE_OFERTAS/footer-superpao.png', 'https://loja.superpao.com.br/', 'https://mais-amigo.onelink.me/OfSm/hn04qjlj', 'https://stoplxmkt.blob.core.windows.net/plxmkt/20250625-EM-JORNADA_DE_AQUISICAO_MAIS_AMIGO-AFINZ-V2/semana-01/beneficios-cartao-basicos-semana1-i2.png')
),
email_groups(email_number, group_id) as (
  values (1, gen_random_uuid()), (2, gen_random_uuid())
),
inserted as (
  insert into public.dynamic_email_briefings
    (briefing_data, partner, segment, subgroup, week_key, activity_names, campaign_group_id, status, version, journey_confirmed, acknowledged_missing_activity)
  select
    case when g.email_number = 1 then jsonb_build_object(
      'DT_INICIO', '2026-08-17T00:00',
      'DT_FIM', '2028-10-01T23:59',
      'UTM_CAMPANHA', 'PLURIX_CRM_SEMANA1_EMAIL1_' || replace(s.product_key, ' ', '_'),
      'TP_CAMPANHA', 'CRM',
      'SEQUENCIA', 'E-mail 1',
      'ASSUNTO', '+5% de desconto em produtos selecionados 🤫',
      'PRE_CABECALHO', 'Só quem tem o cartão +amigo tem!',
      'HEADER', 'https://stoplxmkt.blob.core.windows.net/plxmkt/20250625-EM-JORNADA_DE_AQUISICAO_MAIS_AMIGO-AFINZ-V2/semana-01/header-semana1-i2.png',
      'CARTAO_NM_COMERCIAL', '+amigo',
      'NM_PRODUTO_INTERNO', s.product_key,
      'TITULO_COPY_1_AZUL', 'Conheça os benefícios do cartão +amigo',
      'COR_COPY_1', '#2C3490',
      'TAMANHO_DA_FONTE_TITULO_COPY_1', '24',
      'TITULO_CTA_1', 'QUERO MEU CARTÃO +AMIGO',
      'LINK_CTA_1', s.deeplink,
      'COPY_1_PRETO', 'Olá, %%=v(@FirstName)=%%! O cartão +amigo já está disponível. Conheça os benefícios:',
      'COR_COPY_PRETO_1', '#242424',
      'TAMANHO_DA_FONTE_TITULO_COPY_PRETO_1', '18',
      'TITULO_COPY_2', 'Saiba como solicitar seu cartão +amigo',
      'COR_TITULO_COPY_2', '#2C3490',
      'TAMANHO_DA_FONTE_TITULO_COPY_2', '28',
      'COPY_2_PRETO', 'Viu como é fácil?<br>Comece a aproveitar todos os benefícios hoje mesmo!',
      'COR_COPY_2', '#2C3490',
      'TAMANHO_DA_FONTE_COPY_2', '16',
      'TITULO_CTA_2', 'PEDIR CARTÃO +AMIGO',
      'LINK_CTA_2', s.deeplink,
      'BANNER_1_CORPO', s.banner_1_email_1,
      'LINK_BANNER_1_CORPO', s.deeplink,
      'BANNER_2_CORPO', 'https://stoplxmkt.blob.core.windows.net/plxmkt/20250625-EM-JORNADA_DE_AQUISICAO_MAIS_AMIGO-AFINZ-V2/semana-01/como-solicitar-cartao.png',
      'LINK_BANNER_2_CORPO', s.deeplink,
      'BANNER_3_CORPO', s.footer_url,
      'LINK_BANNER_3_CORPO', s.site_url,
      'NOTA_LEGAL', 'Consulte termos e condições em: https://clubemaisamigo.com.br/cartao',
      'COR_NOTA_LEGAL', '#242424',
      'TAMANHO_DA_FONTE_NOTA_LEGAL', '10',
      'RODAPE', 'Enviado por Banco Afinz S.A - Banco Múltiplo - CNPJ: 04.814.563/0001-74<br>Afinz Instituição de Pagamento S.A - CNPJ: 60.114.865/0001-00<br>Rua XV de Novembro, 45 - Sorocaba, SP'
    ) else jsonb_build_object(
      'DT_INICIO', '2026-08-17T00:00',
      'DT_FIM', '2028-10-01T23:59',
      'UTM_CAMPANHA', 'PLURIX_CRM_SEMANA1_EMAIL2_' || replace(s.product_key, ' ', '_'),
      'TP_CAMPANHA', 'CRM',
      'SEQUENCIA', 'E-mail 2',
      'ASSUNTO', 'O ' || s.display_name || ' tem um cartão para você!',
      'PRE_CABECALHO', 'Ative +5% de desconto em produtos selecionados',
      'HEADER', 'https://stoplxmkt.blob.core.windows.net/plxmkt/20250625-EM-JORNADA_DE_AQUISICAO_MAIS_AMIGO-AFINZ-V2/semana-02/header02-semana1-i1.png',
      'CARTAO_NM_COMERCIAL', '+amigo',
      'NM_PRODUTO_INTERNO', s.product_key,
      'TITULO_COPY_1_AZUL', 'Só com o cartão +amigo você economiza ainda mais',
      'COR_COPY_1', '#2C3490',
      'TAMANHO_DA_FONTE_TITULO_COPY_1', '24',
      'TITULO_CTA_1', 'QUERO MEU CARTÃO +AMIGO',
      'LINK_CTA_1', s.deeplink,
      'COPY_1_PRETO', '%%=v(@FirstName)=%%, o cartão +amigo está sempre ao seu lado, oferecendo descontos e benefícios que vão além das compras do dia a dia.',
      'COR_COPY_PRETO_1', '#242424',
      'TAMANHO_DA_FONTE_TITULO_COPY_PRETO_1', '18',
      'TITULO_COPY_2', 'Só quem tem o cartão +amigo, aproveita mais:',
      'COR_TITULO_COPY_2', '#242424',
      'TAMANHO_DA_FONTE_TITULO_COPY_2', '28',
      'COPY_2_PRETO', '<b>+5% de desconto</b> em Carnes e Aves Frescas<br><b>+5% de desconto</b> em Leite, Arroz e Feijão<br><b>Até 70% de desconto</b> em consultas e exames',
      'COR_COPY_2', '#242424',
      'TAMANHO_DA_FONTE_COPY_2', '17',
      'TITULO_CTA_2', 'PEDIR AGORA MEU CARTÃO +AMIGO',
      'LINK_CTA_2', s.deeplink,
      'BANNER_1_CORPO', '',
      'LINK_BANNER_1_CORPO', '',
      'BANNER_2_CORPO', 'https://stoplxmkt.blob.core.windows.net/plxmkt/20250625-EM-JORNADA_DE_AQUISICAO_MAIS_AMIGO-AFINZ-V2/semana-02/imagem-cartoes.png',
      'LINK_BANNER_2_CORPO', s.deeplink,
      'BANNER_3_CORPO', s.footer_url,
      'LINK_BANNER_3_CORPO', s.site_url,
      'NOTA_LEGAL', 'Consulte termos e condições em: https://clubemaisamigo.com.br/cartao',
      'COR_NOTA_LEGAL', '#242424',
      'TAMANHO_DA_FONTE_NOTA_LEGAL', '10',
      'RODAPE', 'Enviado por Banco Afinz S.A - Banco Múltiplo - CNPJ: 04.814.563/0001-74<br>Afinz Instituição de Pagamento S.A - CNPJ: 60.114.865/0001-00<br>Rua XV de Novembro, 45 - Sorocaba, SP'
    ) end,
    'N/A', 'CRM', s.display_name, 'Semana 1',
    array['PLURIX_CRM_' || replace(s.product_key, ' ', '_') || '_EMAIL' || g.email_number || '_SEMANA1_20260817'],
    g.group_id, 'ready', 1, false, false
  from signatures s cross join email_groups g
  returning *
)
insert into public.dynamic_email_briefing_versions
  (briefing_id, version, snapshot, change_summary, warnings)
select id, version, to_jsonb(inserted), 'Carga inicial dos dois e-mails Plurix CRM · Semana 1',
  '["Jornada TP_CAMPANHA + SEQUENCIA ainda precisa de conferência no SFMC"]'::jsonb
from inserted;

-- Acrescenta ao acervo os ativos novos encontrados nos dois HTMLs-fonte.
insert into public.dynamic_email_assets
  (name, external_url, slot, bu, product, alt_text, tags, status)
values
  ('Plurix · Header E-mail 2 · Semana 1', 'https://stoplxmkt.blob.core.windows.net/plxmkt/20250625-EM-JORNADA_DE_AQUISICAO_MAIS_AMIGO-AFINZ-V2/semana-02/header02-semana1-i1.png', 'header', 'Plurix', '+amigo', 'Só com o cartão +amigo você economiza ainda mais', array['historico','aprovado','semana-01','email-2'], 'ready'),
  ('Plurix · Cartões +amigo · E-mail 2', 'https://stoplxmkt.blob.core.windows.net/plxmkt/20250625-EM-JORNADA_DE_AQUISICAO_MAIS_AMIGO-AFINZ-V2/semana-02/imagem-cartoes.png', 'banner_2', 'Plurix', '+amigo', 'Cartões +amigo', array['historico','aprovado','semana-01','email-2'], 'ready'),
  ('Plurix · CTA longo pedir cartão · E-mail 1', 'https://stoplxmkt.blob.core.windows.net/plxmkt/20250625-EM-JORNADA_DE_AQUISICAO_MAIS_AMIGO-AFINZ-V2/semana-01/cta-longo-pedir-cartao.png', 'generic', 'Plurix', '+amigo', 'Pedir cartão +amigo', array['historico','aprovado','semana-01','email-1','cta'], 'ready'),
  ('Plurix · CTA quero meu cartão · E-mail 2', 'https://stoplxmkt.blob.core.windows.net/plxmkt/20250625-EM-JORNADA_DE_AQUISICAO_MAIS_AMIGO-AFINZ-V2/semana-02/cta-quero-meu-cartao.png', 'generic', 'Plurix', '+amigo', 'Quero meu cartão +amigo', array['historico','aprovado','semana-01','email-2','cta'], 'ready'),
  ('Plurix · CTA branco quero meu cartão · E-mail 2', 'https://stoplxmkt.blob.core.windows.net/plxmkt/20250625-EM-JORNADA_DE_AQUISICAO_MAIS_AMIGO-AFINZ-V2/semana-02/cta-branco-quero-meu-cartao.png', 'generic', 'Plurix', '+amigo', 'Quero meu cartão +amigo', array['historico','aprovado','semana-01','email-2','cta'], 'ready')
on conflict (external_url) do update set
  name = excluded.name, slot = excluded.slot, bu = excluded.bu, product = excluded.product,
  alt_text = excluded.alt_text, tags = excluded.tags, status = 'ready', updated_at = now();
