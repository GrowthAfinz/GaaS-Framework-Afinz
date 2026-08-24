-- Snapshot de Usuários Únicos deduplicados pelo GA4 (dashboard Hyperativa) para o
-- Big Numbers Rentabilização Copa. GA4 não expõe dedup incremental por dia — a soma
-- da série diária de "Usuários ativos" (copa_lp_daily.usuarios) infla o número por
-- visitantes recorrentes em dias diferentes. Este snapshot guarda o valor real (uma
-- linha por janela de fechamento), colado manualmente do dashboard a cada fechamento.

create table if not exists copa_ga4_unique_snapshots (
  data_fim date primary key,
  data_inicio date not null,
  usuarios_unicos integer not null,
  visualizacoes integer,
  raw_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table copa_ga4_unique_snapshots is
  'Snapshot de Usuários Únicos (deduplicados pelo GA4) para uma janela de fechamento Copa. Colado manualmente do dashboard Hyperativa a cada fechamento — GA4 não expõe dedup incremental por dia.';

insert into copa_ga4_unique_snapshots (data_fim, data_inicio, usuarios_unicos, visualizacoes, raw_payload)
values (
  '2026-08-15', '2026-04-15', 87227, 329094,
  '{"source":"Hyperativa GA4 dashboard","total_usuarios":87250,"visualizacoes_por_usuario":3.77,"usuarios_cadastre_se_home":37206,"loaded_on":"2026-08-24"}'::jsonb
)
on conflict (data_fim) do update set
  data_inicio = excluded.data_inicio,
  usuarios_unicos = excluded.usuarios_unicos,
  visualizacoes = excluded.visualizacoes,
  raw_payload = excluded.raw_payload,
  updated_at = now();
