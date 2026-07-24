create table if not exists public.serasa_bi_neurotech_daily_funnel (
  data date primary key,
  consultas_neurotech integer not null,
  aprovados_neurotech integer not null,
  pedidos_confirmados integer not null,
  env_foto_biometria integer,
  env_documento integer,
  assinatura_cartao integer,
  total_emitidos integer not null,
  quality_status text not null default 'complete',
  quality_notes text[] not null default '{}',
  source_file text not null,
  source_hash text not null,
  imported_at timestamptz not null default now(),
  constraint serasa_bi_neurotech_nonnegative_volumes check (
    consultas_neurotech >= 0
    and aprovados_neurotech >= 0
    and pedidos_confirmados >= 0
    and (env_foto_biometria is null or env_foto_biometria >= 0)
    and (env_documento is null or env_documento >= 0)
    and (assinatura_cartao is null or assinatura_cartao >= 0)
    and total_emitidos >= 0
  ),
  constraint serasa_bi_neurotech_quality_status check (
    quality_status in ('complete', 'partial', 'suspect')
  )
);

comment on table public.serasa_bi_neurotech_daily_funnel is
  'Funil Serasa BI histórico restaurado: Neurotech, pedidos, coberturas operacionais e emitidos.';

comment on column public.serasa_bi_neurotech_daily_funnel.env_foto_biometria is
  'Nulo significa não informado pela fonte; nunca deve ser convertido silenciosamente em zero.';

alter table public.serasa_bi_neurotech_daily_funnel enable row level security;

revoke all on table public.serasa_bi_neurotech_daily_funnel from anon, authenticated;
grant select on table public.serasa_bi_neurotech_daily_funnel to authenticated;

drop policy if exists "serasa_bi_neurotech_authenticated_read"
  on public.serasa_bi_neurotech_daily_funnel;

create policy "serasa_bi_neurotech_authenticated_read"
  on public.serasa_bi_neurotech_daily_funnel
  for select
  to authenticated
  using (true);
