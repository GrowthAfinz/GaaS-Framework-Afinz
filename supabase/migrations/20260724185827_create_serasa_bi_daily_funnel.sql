create table if not exists public.serasa_bi_daily_funnel (
  data date primary key,
  consultas_motor integer,
  cpfs_unicos integer,
  aprovados_cpfs_unicos integer,
  ofertas_exibidas integer,
  pedidos_criados integer,
  pedidos_confirmados integer,
  cartoes integer,
  fee_canal numeric(16, 4),
  cpa numeric(16, 4),
  custos_credito numeric(16, 4),
  custos_plastico numeric(16, 4),
  custos_envio numeric(16, 4),
  cac_canal numeric(16, 4),
  quality_status text not null default 'complete',
  quality_notes text[] not null default '{}',
  source_file text not null,
  source_sheet text not null,
  source_hash text not null,
  imported_at timestamptz not null default now(),
  constraint serasa_bi_daily_funnel_nonnegative_volumes check (
    (consultas_motor is null or consultas_motor >= 0)
    and (cpfs_unicos is null or cpfs_unicos >= 0)
    and (aprovados_cpfs_unicos is null or aprovados_cpfs_unicos >= 0)
    and (ofertas_exibidas is null or ofertas_exibidas >= 0)
    and (pedidos_criados is null or pedidos_criados >= 0)
    and (pedidos_confirmados is null or pedidos_confirmados >= 0)
    and (cartoes is null or cartoes >= 0)
  ),
  constraint serasa_bi_daily_funnel_quality_status check (
    quality_status in ('complete', 'partial', 'suspect')
  )
);

comment on table public.serasa_bi_daily_funnel is
  'Snapshot diário normalizado do funil Serasa BI, importado do workbook Integrado_diario_2026.xlsx.';

comment on column public.serasa_bi_daily_funnel.quality_status is
  'complete quando todas as etapas centrais estão preenchidas; partial quando há lacunas; suspect quando a relação entre etapas exige revisão.';

alter table public.serasa_bi_daily_funnel enable row level security;

revoke all on table public.serasa_bi_daily_funnel from anon, authenticated;
grant select on table public.serasa_bi_daily_funnel to authenticated;

drop policy if exists "serasa_bi_daily_funnel_authenticated_read"
  on public.serasa_bi_daily_funnel;

create policy "serasa_bi_daily_funnel_authenticated_read"
  on public.serasa_bi_daily_funnel
  for select
  to authenticated
  using (true);
