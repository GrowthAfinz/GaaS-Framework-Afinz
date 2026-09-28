-- Metas herdadas: quando um mês não tem meta cadastrada, o app copia a do mês
-- anterior e marca a origem aqui. NULL = meta confirmada/cadastrada por alguém.
alter table public.goals add column if not exists herdada_de text;

comment on column public.goals.herdada_de is
  'Mês (yyyy-MM) de onde a meta foi copiada automaticamente. NULL quando a meta foi cadastrada ou confirmada manualmente.';
