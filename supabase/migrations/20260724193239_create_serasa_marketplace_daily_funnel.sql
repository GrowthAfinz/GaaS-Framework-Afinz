create table if not exists public.serasa_marketplace_daily_funnel (
  data date primary key,
  ofertas integer not null,
  pedidos integer not null,
  pedidos_rate_source numeric(14, 12) not null,
  confirmados integer not null,
  confirmados_rate_source numeric(14, 12) not null,
  aprovados integer not null,
  aprovados_rate_source numeric(14, 12) not null,
  quality_status text not null default 'complete',
  quality_notes text[] not null default '{}',
  source_file text not null,
  source_hash text not null,
  imported_at timestamptz not null default now(),
  constraint serasa_marketplace_nonnegative_volumes check (
    ofertas >= 0
    and pedidos >= 0
    and confirmados >= 0
    and aprovados >= 0
  ),
  constraint serasa_marketplace_descending_funnel check (
    ofertas >= pedidos
    and pedidos >= confirmados
    and confirmados >= aprovados
  ),
  constraint serasa_marketplace_rates_between_zero_and_one check (
    pedidos_rate_source between 0 and 1
    and confirmados_rate_source between 0 and 1
    and aprovados_rate_source between 0 and 1
  ),
  constraint serasa_marketplace_quality_status check (
    quality_status in ('complete', 'partial', 'suspect')
  )
);

comment on table public.serasa_marketplace_daily_funnel is
  'Funil diário Serasa Marketplace: ofertas, pedidos, confirmados e aprovados.';

comment on column public.serasa_marketplace_daily_funnel.aprovados is
  'Aprovação do pedido Marketplace. Não equivale à aprovação de CPF da fonte Serasa BI.';

alter table public.serasa_marketplace_daily_funnel enable row level security;

revoke all on table public.serasa_marketplace_daily_funnel from anon, authenticated;
grant select on table public.serasa_marketplace_daily_funnel to authenticated;

drop policy if exists "serasa_marketplace_authenticated_read"
  on public.serasa_marketplace_daily_funnel;

create policy "serasa_marketplace_authenticated_read"
  on public.serasa_marketplace_daily_funnel
  for select
  to authenticated
  using (true);
