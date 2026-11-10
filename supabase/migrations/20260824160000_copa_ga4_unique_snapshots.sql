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

-- Conteúdo removido do repositório público em 2026-11-10.
-- O insert desta migration carregava o snapshot de usuários únicos GA4 da Copa.
-- O dado já está em produção (copa_ga4_unique_snapshots: 1 linha, conferido em 2026-11-10).
-- Original no backup privado: Supabase Storage repo-privado/2026-11-10/migrations-dados-2026-11-10.zip.
-- A criação da tabela acima continua valendo. Não colocar dado de negócio nem texto de nota em migration: o repositório é público.
