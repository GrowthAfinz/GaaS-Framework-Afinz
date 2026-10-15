-- Header dinâmico (V13) ligado à biblioteca de ativos.
-- 1. Dois tipos novos de ativo: cartão e logo do header dinâmico.
-- 2. Cadastra as imagens que a régua TOPO DE FUNIL DINÂMICO já usa (3 cartões e o logo +amigo)
--    e o logo do Avenida que estava no cadastro "Logos por rede". Só referência: a imagem
--    continua no Content Builder.

alter table public.dynamic_email_assets drop constraint if exists dynamic_email_assets_slot_check;
alter table public.dynamic_email_assets add constraint dynamic_email_assets_slot_check
  check (slot = any (array['header', 'header_card', 'header_logo', 'banner_1', 'banner_2', 'banner_3', 'signature', 'generic']));

insert into public.dynamic_email_assets (name, external_url, slot, bu, partner, product, alt_text, tags, status, version)
values
  ('Cartão +amigo Visa · header E-mail 1', 'https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/c6f51660-3c13-448e-aef3-5a68efaf2310.png', 'header_card', 'Plurix', 'Plurix', '+amigo', 'Cartão +amigo Visa', array['header-dinamico', 'cartao'], 'ready', 1),
  ('Cartão +amigo Visa · header E-mail 2', 'https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/49b01a5b-dc3f-47a3-9ef5-afa14915626e.png', 'header_card', 'Plurix', 'Plurix', '+amigo', 'Cartão +amigo Visa', array['header-dinamico', 'cartao'], 'ready', 1),
  ('Cartão +amigo Visa · header E-mail 3', 'https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/29a7dd93-cebf-47eb-9a7c-822ffcfc2be2.png', 'header_card', 'Plurix', 'Plurix', '+amigo', 'Cartão +amigo Visa', array['header-dinamico', 'cartao'], 'ready', 1),
  ('Logo +amigo · header dinâmico', 'https://image.contato.clubemaisamigo.com.br/lib/fe3011747364047e721773/m/1/cb6902a6-95ad-453f-a208-62e182eabf77.png', 'header_logo', 'Plurix', 'Plurix', '+amigo', '+amigo', array['header-dinamico', 'logo'], 'ready', 1),
  ('Logo Avenida · header dinâmico', 'https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/a636b436-cc47-4c68-ab6a-4fd9a034ffe7.png', 'header_logo', 'Plurix', 'Plurix', 'AVENIDA', 'Supermercados Avenida', array['header-dinamico', 'logo'], 'ready', 1)
on conflict (external_url) do nothing;
