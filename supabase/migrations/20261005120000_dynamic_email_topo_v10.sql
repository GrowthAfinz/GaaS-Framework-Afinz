-- Fábrica de E-mails · template PLURIX V10
-- Dados de apoio que o AMPscript do V10 lê no SFMC e que a prévia do GaaS espelha:
--   * dynamic_email_header_variants  -> exportado para a DE TB_HEADER_VARIACOES
--   * dynamic_email_signature_settings.header_logo_url -> exportado para a DE TB_REDE_ASSETS
--   * dynamic_email_pool_offers      -> cópia do export da DE_POOL_OFERTAS_PLURIX (só leitura na prévia)

create table if not exists public.dynamic_email_header_variants (
  code text primary key check (code ~ '^HDR_[A-Z0-9_]{2,40}$'),
  label text not null default '',
  title text not null check (char_length(title) between 1 and 34),
  subtitle text not null default '' check (char_length(subtitle) <= 60),
  card_image_url text not null default '' check (card_image_url = '' or card_image_url ~* '^https://'),
  background_color text not null default '#4A5BA6' check (background_color ~ '^#[0-9A-Fa-f]{6}$'),
  title_color text not null default '#E7A921' check (title_color ~ '^#[0-9A-Fa-f]{6}$'),
  subtitle_color text not null default '#EADFCE' check (subtitle_color ~ '^#[0-9A-Fa-f]{6}$'),
  status text not null default 'active' check (status in ('active', 'archived')),
  version integer not null default 1 check (version > 0),
  created_by uuid default auth.uid(),
  updated_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.dynamic_email_header_variants enable row level security;
grant select, insert, update on public.dynamic_email_header_variants to authenticated;

create policy "Authenticated users read header variants"
  on public.dynamic_email_header_variants for select to authenticated
  using ((select auth.uid()) is not null);
create policy "Authenticated users create header variants"
  on public.dynamic_email_header_variants for insert to authenticated
  with check ((select auth.uid()) is not null);
create policy "Authenticated users update header variants"
  on public.dynamic_email_header_variants for update to authenticated
  using ((select auth.uid()) is not null)
  with check ((select auth.uid()) is not null);

alter table public.dynamic_email_signature_settings
  add column if not exists header_logo_url text not null default ''
  check (header_logo_url = '' or header_logo_url ~* '^https://');

create table if not exists public.dynamic_email_pool_offers (
  offer_ref text primary key,
  partner_name text not null,
  promotion_name text not null,
  sale_price text not null default '',
  old_price text not null default '',
  start_date date not null,
  end_date date not null,
  image_url text not null default '',
  active boolean not null default false,
  segmentacao text not null default '',
  uf text not null default '',
  cidade text not null default '',
  legal_text text not null default '',
  offer_type text not null default '',
  source_file text not null default '',
  imported_by uuid default auth.uid(),
  imported_at timestamptz not null default now()
);

create index if not exists dynamic_email_pool_offers_partner_day
  on public.dynamic_email_pool_offers (partner_name, start_date, end_date);

alter table public.dynamic_email_pool_offers enable row level security;
grant select, insert, update, delete on public.dynamic_email_pool_offers to authenticated;

create policy "Authenticated users read pool offers"
  on public.dynamic_email_pool_offers for select to authenticated
  using ((select auth.uid()) is not null);
create policy "Authenticated users import pool offers"
  on public.dynamic_email_pool_offers for insert to authenticated
  with check ((select auth.uid()) is not null);
create policy "Authenticated users update pool offers"
  on public.dynamic_email_pool_offers for update to authenticated
  using ((select auth.uid()) is not null)
  with check ((select auth.uid()) is not null);
create policy "Authenticated users delete pool offers"
  on public.dynamic_email_pool_offers for delete to authenticated
  using ((select auth.uid()) is not null);

-- Primeira variação: o header desenhado pelo marketing (out/2026).
insert into public.dynamic_email_header_variants (code, label, title, subtitle, card_image_url)
values (
  'HDR_PECA_V1',
  'Peça seu cartão (marketing, out/2026)',
  'Peça seu cartão+amigo',
  'e aproveite as melhores vantagens!',
  'https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/c6f51660-3c13-448e-aef3-5a68efaf2310.png'
)
on conflict (code) do nothing;

-- Logo da rede usado no header do marketing. As demais redes aguardam o arquivo do marketing;
-- Compre Mais e Superpão ficam sem logo de propósito (transição de marca).
update public.dynamic_email_signature_settings
set header_logo_url = 'https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/a636b436-cc47-4c68-ab6a-4fd9a034ffe7.png'
where signature_key = 'AVENIDA' and header_logo_url = '';

-- Slot do template embutido. O HTML real é injetado pelo código (fixtures/plurixV10Template.ts),
-- como já acontece com o V9; o texto abaixo só existe para o registro não nascer vazio.
insert into public.dynamic_email_template_slots (id, name, source, is_principal, status, version)
values ('builtin-plurix-v10', 'PLURIX V10 · header dinâmico, limite e pool', '<!-- PLURIX V10: fonte carregada pelo GaaS -->', false, 'active', 1)
on conflict (id) do nothing;
