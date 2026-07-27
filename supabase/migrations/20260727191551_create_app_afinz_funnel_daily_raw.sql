create table if not exists public.app_afinz_funnel_daily_raw (
  business_date date not null,
  stage_code text not null,
  stage_label text not null,
  status text not null default '',
  marc_plurix text not null,
  cpf_count integer not null,
  quality_status text not null default 'complete',
  quality_notes text[] not null default '{}',
  source_file text not null,
  source_hash text not null,
  imported_at timestamptz not null default now(),
  primary key (business_date, stage_code, status, marc_plurix),
  constraint app_afinz_funnel_stage_code_check check (
    stage_code in (
      'cpf',
      'onboarding',
      'geo',
      'docs',
      'bio',
      'address',
      'personalization',
      'signature',
      'auto_finalization',
      'completed',
      'loss'
    )
  ),
  constraint app_afinz_funnel_status_check check (
    status in ('', 'APROVADO')
  ),
  constraint app_afinz_funnel_plurix_check check (
    marc_plurix in ('0', 'NAO', 'SIM')
  ),
  constraint app_afinz_funnel_cpf_count_check check (cpf_count >= 0),
  constraint app_afinz_funnel_quality_status_check check (
    quality_status in ('complete', 'partial', 'suspect')
  )
);

comment on table public.app_afinz_funnel_daily_raw is
  'Funil diário do App Afinz no grão data x etapa x status x marcador Plurix.';

comment on column public.app_afinz_funnel_daily_raw.marc_plurix is
  'SIM identifica Plurix; NAO representa o restante do App sem separar B2C de B2B2C; 0 identifica referências totais.';

comment on column public.app_afinz_funnel_daily_raw.quality_status is
  'Dias abertos ou linhas com cobertura incompleta permanecem parciais; ausência nunca deve ser convertida em zero.';

create index if not exists app_afinz_funnel_daily_raw_date_idx
  on public.app_afinz_funnel_daily_raw (business_date);

alter table public.app_afinz_funnel_daily_raw enable row level security;

revoke all on table public.app_afinz_funnel_daily_raw from anon, authenticated;
grant select on table public.app_afinz_funnel_daily_raw to authenticated;

drop policy if exists "app_afinz_funnel_authenticated_read"
  on public.app_afinz_funnel_daily_raw;

create policy "app_afinz_funnel_authenticated_read"
  on public.app_afinz_funnel_daily_raw
  for select
  to authenticated
  using (true);
