-- O refresh sob demanda morria por statement timeout.
--
-- report_live_refresh_media_actions() leva ~28-41 s (reconstroi 50 mil linhas a
-- partir de 460 mil). Chamada por RPC a partir da Edge Function, herdava o
-- statement_timeout curto do papel da conexao e era cancelada antes de terminar
-- — observado em 10/09/2026: "canceling statement due to statement timeout".
--
-- O tratamento no runtime funcionou (a falha nao derrubou o run, so registrou
-- aviso), mas o mecanismo em si nao cumpria o proposito: o run seguia lendo a
-- materializada antiga sem que o refresh tivesse acontecido.
--
-- O SET no cabecalho vale so durante a execucao da funcao.
-- Verificado apos aplicar: refresh completo em 41 s.

create or replace function public.report_live_refresh_media_actions()
returns interval
language plpgsql
security definer
set search_path = public
set statement_timeout to '600s'
as $$
declare
  t0 timestamptz := clock_timestamp();
  dur interval;
begin
  refresh materialized view concurrently public.mv_paid_media_actions_latest;
  dur := clock_timestamp() - t0;
  raise notice 'mv_paid_media_actions_latest atualizada em %', dur;
  return dur;
end $$;

comment on function public.report_live_refresh_media_actions() is
  'Atualiza mv_paid_media_actions_latest (deduplicacao de paid_media_actions lida pelo Report Live). Retorna a duracao. Chamada sob demanda pelo report-sync no inicio de loadInputs; statement_timeout proprio de 600s porque o refresh leva ~28-41s e o timeout herdado da conexao a cancelava.';
