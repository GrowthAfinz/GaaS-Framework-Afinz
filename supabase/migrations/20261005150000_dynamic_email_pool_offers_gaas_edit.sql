-- Edição de ofertas do pool na Fábrica (só afeta a prévia do GaaS; o SFMC lê a DE_POOL_OFERTAS_PLURIX).
alter table public.dynamic_email_pool_offers
  add column if not exists edited_in_gaas_at timestamptz,
  add column if not exists edited_by uuid default null;
comment on column public.dynamic_email_pool_offers.edited_in_gaas_at is 'Preenchido quando a oferta é alterada na Fábrica. Vale só para a prévia; a próxima importação do export da DE_POOL_OFERTAS_PLURIX sobrescreve.';
