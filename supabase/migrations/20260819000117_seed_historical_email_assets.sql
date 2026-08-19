-- Ativos historicamente usados e aprovados nos briefings SFMC.
-- Apenas URLs e metadados leves: nenhum binário é armazenado no Supabase.
insert into public.dynamic_email_assets
  (name, external_url, click_url, slot, bu, partner, product, alt_text, tags, status)
values
  ('Plurix · Header padrão semana 1', 'https://stoplxmkt.blob.core.windows.net/plxmkt/20250625-EM-JORNADA_DE_AQUISICAO_MAIS_AMIGO-AFINZ-V2/semana-01/header-semana1-i2.png', null, 'header', 'Plurix', null, '+amigo', 'Header da jornada de aquisição +amigo', array['historico','aprovado','semana-01','plurix'], 'ready'),
  ('Plurix · Header Compre Mais semana 1', 'https://stoplxmkt.blob.core.windows.net/plxmkt/20250625-EM-JORNADA_DE_AQUISICAO_MAIS_AMIGO-AFINZ-V2/semana-01/header-compre-mais-semana-1.png', null, 'header', 'Plurix', null, 'COMPRE MAIS', 'Header da migração do clube Compre Mais', array['historico','aprovado','semana-01','compre-mais'], 'ready'),
  ('Plurix · Benefícios cartão básicos', 'https://stoplxmkt.blob.core.windows.net/plxmkt/20250625-EM-JORNADA_DE_AQUISICAO_MAIS_AMIGO-AFINZ-V2/semana-01/beneficios-cartao-basicos-semana1-i2.png', null, 'banner_1', 'Plurix', null, '+amigo', 'Benefícios do cartão +amigo para cesta básica', array['historico','aprovado','beneficios','basicos'], 'ready'),
  ('Plurix · Benefícios cartão FLV', 'https://stoplxmkt.blob.core.windows.net/plxmkt/20250625-EM-JORNADA_DE_AQUISICAO_MAIS_AMIGO-AFINZ-V2/semana-01/beneficios-cartao-flv-semana1-i2.png', 'https://mais-amigo.onelink.me/OfSm/21tz9kvu', 'banner_1', 'Plurix', null, 'BOA', 'Benefícios do cartão +amigo para FLV', array['historico','aprovado','beneficios','boa','flv'], 'ready'),
  ('Plurix · Benefícios Compre Mais', 'https://stoplxmkt.blob.core.windows.net/plxmkt/20250625-EM-JORNADA_DE_AQUISICAO_MAIS_AMIGO-AFINZ-V2/semana-01/banner-cartao-basicos.png', 'https://mais-amigo.onelink.me/OfSm/cvfabp9o', 'banner_1', 'Plurix', null, 'COMPRE MAIS', 'Benefícios do cartão +amigo para Compre Mais', array['historico','aprovado','beneficios','compre-mais'], 'ready'),
  ('Plurix · Como solicitar o cartão', 'https://stoplxmkt.blob.core.windows.net/plxmkt/20250625-EM-JORNADA_DE_AQUISICAO_MAIS_AMIGO-AFINZ-V2/semana-01/como-solicitar-cartao.png', null, 'banner_2', 'Plurix', null, '+amigo', 'Passo a passo para solicitar o cartão +amigo', array['historico','aprovado','como-solicitar','plurix'], 'ready'),
  ('Assinatura · Amigão', 'https://stoplxmkt.blob.core.windows.net/plxmkt/20250625-EM-JORNADA_DE_AQUISICAO_MAIS_AMIGO-AFINZ-V2/footer-amigao.png', 'https://www.amigao.com/', 'signature', 'Plurix', null, 'AMIGAO', 'Assinatura Amigão Supermercados', array['historico','aprovado','assinatura','amigao'], 'ready'),
  ('Assinatura · Boa', 'https://stoplxmkt.blob.core.windows.net/plxmkt/20241125-EM-BOA-TEMPLATE-BLACK_FRIDAY_BANCO_DE_OFERTAS/footer-hd.png', 'https://www.boasupermercados.com.br/', 'signature', 'Plurix', null, 'BOA', 'Assinatura Boa Supermercados', array['historico','aprovado','assinatura','boa'], 'ready'),
  ('Assinatura · Avenida', 'https://stoplxmkt.blob.core.windows.net/plxmkt/20241125-EM-AVE-TEMPLATE-BLACK_FRIDAY_BANCO_DE_OFERTAS/footer-avenida.png', 'https://loja.supermercadosavenida.com.br/', 'signature', 'Plurix', null, 'AVENIDA', 'Assinatura Supermercados Avenida', array['historico','aprovado','assinatura','avenida'], 'ready'),
  ('Assinatura · Compre Mais', 'https://stoplxmkt.blob.core.windows.net/plxmkt/20241125-EM-CPM-TEMPLATE-BLACK_FRIDAY_BANCO_DE_OFERTAS/footer-compre-mais.png', 'https://www.somoscompremais.com.br/', 'signature', 'Plurix', null, 'COMPRE MAIS', 'Assinatura Compre Mais Supermercados', array['historico','aprovado','assinatura','compre-mais'], 'ready'),
  ('Assinatura · Paraná', 'https://stoplxmkt.blob.core.windows.net/plxmkt/20250625-EM-JORNADA_DE_AQUISICAO_MAIS_AMIGO-AFINZ-V2/footer-parana.png', 'https://www.paranasupermercados.com.br', 'signature', 'Plurix', null, 'PARANA', 'Assinatura Paraná Supermercados', array['historico','aprovado','assinatura','parana'], 'ready'),
  ('Assinatura · Superpão', 'https://stoplxmkt.blob.core.windows.net/plxmkt/20241125-EM-SPO-TEMPLATE-BLACK_FRIDAY_BANCO_DE_OFERTAS/footer-superpao.png', 'https://loja.superpao.com.br/', 'signature', 'Plurix', null, 'SUPERPAO', 'Assinatura Superpão Supermercados', array['historico','aprovado','assinatura','superpao'], 'ready'),
  ('Marca · Logo +amigo', 'https://stoplxmkt.blob.core.windows.net/plxmkt/20240513-EM-JORNADA_DE_AQUISICAO_MAIS_AMIGO-AFINZ/logo-mais-amigo.png', 'https://clubemaisamigo.com.br', 'generic', 'Plurix', null, '+amigo', 'Logo +amigo', array['historico','aprovado','marca','logo'], 'ready'),
  ('Institucional · Logo Afinz', 'https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/13f24bf4-4e15-484e-a63a-15a164d1254c.png', null, 'generic', 'B2C', 'Proprietaria', 'INSTITUCIONAL', 'Logo Afinz usado no e-mail institucional', array['historico','aprovado','institucional','logo'], 'ready'),
  ('Institucional · Header Visa', 'https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/2f20342d-7b3b-46c0-99f3-a51874e6ab0f.jpg', null, 'header', 'B2C', 'Proprietaria', 'INSTITUCIONAL', 'Header do e-mail institucional Afinz Visa', array['historico','aprovado','institucional','visa'], 'ready'),
  ('Institucional · Banner principal Visa', 'https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/60917897-3ecb-4d1f-ab7b-f2347cbadf3d.png', null, 'banner_1', 'B2C', 'Proprietaria', 'INSTITUCIONAL', 'Banner principal do e-mail institucional Afinz Visa', array['historico','aprovado','institucional','visa'], 'ready'),
  ('Institucional · Banner complementar Visa', 'https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/ca3642fc-2601-461c-8adc-a9a1ffcdb463.png', null, 'banner_2', 'B2C', 'Proprietaria', 'INSTITUCIONAL', 'Banner complementar do e-mail institucional Afinz Visa', array['historico','aprovado','institucional','visa'], 'ready')
on conflict (external_url) do update set
  name = excluded.name,
  click_url = coalesce(public.dynamic_email_assets.click_url, excluded.click_url),
  slot = excluded.slot,
  bu = excluded.bu,
  partner = excluded.partner,
  product = excluded.product,
  alt_text = excluded.alt_text,
  tags = (select array_agg(distinct tag) from unnest(public.dynamic_email_assets.tags || excluded.tags) tag),
  status = 'ready',
  updated_at = now();
