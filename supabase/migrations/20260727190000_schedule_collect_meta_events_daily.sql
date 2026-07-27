-- =====================================================================
-- Agendamento diario governado de `collect-meta-events`.
--
-- Principios aplicados:
--  * Idempotente: pode rodar novamente sem duplicar cron jobs, tabelas ou linhas.
--  * Sem segredos no SQL versionado: a chave sai do Vault por NOME, nunca por valor.
--  * Sem segredos em URL: a autenticacao vai no header Authorization.
--  * Somente dias fechados: a Edge Function resolve `lastClosedDay()` em
--    America/Sao_Paulo e reprocessa os ultimos 28 dias fechados (mode='daily').
--  * Anti-sobreposicao: advisory lock + verificacao de runs 'pending' recentes.
--  * Lifecycle preservado: pending -> complete/failed. Um watchdog encerra runs
--    orfas como 'failed' para que nunca fiquem presas em 'pending'.
--  * Runs 'pending'/'failed' continuam invisiveis no BI (views ja filtram
--    status='complete' desde 20260722174307_meta_funnel_events.sql).
--
-- NAO reativa nenhum cron job legado. Os jobs antigos (process-collection-queue,
-- schedule-daily-collection, collect-meta-ads-daily, collect-google-ads-daily,
-- collect-media-ads-daily-v3) permanecem exatamente com o estado atual.
-- =====================================================================

create extension if not exists pg_cron;
create extension if not exists pg_net with schema public;

-- ---------------------------------------------------------------------
-- 1) Allowlist governada como DADO (nao hardcoded na funcao)
-- ---------------------------------------------------------------------
create table if not exists public.meta_governed_campaigns (
  campaign_id text primary key,
  campaign_label text not null,
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default now()
);

insert into public.meta_governed_campaigns (campaign_id, campaign_label, notes)
values
  ('120210447970060723', '[B2C] App Install Afinz',
   'Fase App Install. Entrega encerrada em 22/06/2026; mantida na coleta para maturacao/auditoria.'),
  ('120250049222750723', '[B2C] App Install Onboarding Afinz',
   'Fase Onboarding. Fonte do StartTrial atribuido a Meta em 7d click.')
on conflict (campaign_id) do update
  set campaign_label = excluded.campaign_label,
      notes = excluded.notes;

alter table public.meta_governed_campaigns enable row level security;
revoke insert, update, delete on public.meta_governed_campaigns from anon, authenticated;
grant select on public.meta_governed_campaigns to anon, authenticated;
drop policy if exists meta_governed_campaigns_read on public.meta_governed_campaigns;
create policy meta_governed_campaigns_read on public.meta_governed_campaigns
  for select to anon, authenticated using (true);

-- ---------------------------------------------------------------------
-- 2) Log de despacho (observabilidade do agendador, SEM payload sensivel)
-- ---------------------------------------------------------------------
create table if not exists public.meta_events_dispatch_log (
  id            bigserial primary key,
  requested_at  timestamptz not null default now(),
  mode          text not null,
  campaign_id   text,
  status        text not null,
  request_id    bigint,
  detail        text,
  constraint meta_dispatch_status_chk check (
    status in ('dispatched','skipped_overlap','skipped_missing_secret','skipped_disabled','error')
  )
);
create index if not exists ix_meta_dispatch_log_time
  on public.meta_events_dispatch_log (requested_at desc);

alter table public.meta_events_dispatch_log enable row level security;
revoke insert, update, delete on public.meta_events_dispatch_log from anon, authenticated;
grant select on public.meta_events_dispatch_log to anon, authenticated;
drop policy if exists meta_dispatch_log_read on public.meta_events_dispatch_log;
create policy meta_dispatch_log_read on public.meta_events_dispatch_log
  for select to anon, authenticated using (true);

-- ---------------------------------------------------------------------
-- 3) Watchdog de lifecycle: run 'pending' orfa vira 'failed'.
--    Garante que nada fique preso em 'pending' e, portanto, invisivel-mas-vivo.
-- ---------------------------------------------------------------------
create or replace function public.meta_collection_mark_stale_runs(p_minutes integer default 30)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  update public.paid_media_collection_runs
     set status = 'failed',
         finished_at = now(),
         error_summary = coalesce(error_summary, '')
           || format('watchdog: run sem finalizacao apos %s min', p_minutes)
   where source = 'meta'
     and status = 'pending'
     and started_at < now() - make_interval(mins => p_minutes);
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.meta_collection_mark_stale_runs(integer) from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- 4) Despachante seguro
--
--    A chave de autenticacao NAO esta neste arquivo. Ela e lida do Supabase
--    Vault pelo nome 'collect_meta_events_auth_key' e enviada apenas no header
--    Authorization. Provisione fora do versionamento:
--
--      select vault.create_secret('<chave>', 'collect_meta_events_auth_key',
--                                 'JWT usado pelo cron para chamar collect-meta-events');
--
--    Sem o segredo a funcao NAO chama a Edge Function: registra
--    'skipped_missing_secret' e emite WARNING (falha visivel, nunca silenciosa).
-- ---------------------------------------------------------------------
create or replace function public.collect_meta_events_dispatch(
  p_mode text default 'daily',
  p_timeout_ms integer default 240000
)
returns jsonb
language plpgsql
security definer
set search_path = public, vault
as $$
declare
  v_secret     text;
  v_url        text := 'https://mipiwxadnpwtcgfcedym.supabase.co/functions/v1/collect-meta-events';
  v_pending    integer;
  v_campaign   record;
  v_request_id bigint;
  v_results    jsonb := '[]'::jsonb;
begin
  if p_mode <> 'daily' then
    raise exception 'collect_meta_events_dispatch aceita apenas mode=daily (recebido: %)', p_mode;
  end if;

  -- (a) anti-sobreposicao entre chamadas concorrentes do proprio agendador
  if not pg_try_advisory_xact_lock(hashtext('collect_meta_events_dispatch')) then
    insert into public.meta_events_dispatch_log (mode, status, detail)
    values (p_mode, 'skipped_overlap', 'advisory lock ocupado por outro despacho');
    return jsonb_build_object('skipped', 'advisory_lock');
  end if;

  -- (b) anti-sobreposicao com uma coleta ainda em andamento
  select count(*) into v_pending
    from public.paid_media_collection_runs
   where source = 'meta'
     and status = 'pending'
     and started_at > now() - interval '2 hours';
  if v_pending > 0 then
    insert into public.meta_events_dispatch_log (mode, status, detail)
    values (p_mode, 'skipped_overlap', format('%s run(s) meta ainda em pending', v_pending));
    return jsonb_build_object('skipped', 'run_pending', 'pending', v_pending);
  end if;

  -- (c) segredo por NOME (nunca literal no SQL versionado)
  select decrypted_secret into v_secret
    from vault.decrypted_secrets
   where name = 'collect_meta_events_auth_key'
   limit 1;

  if v_secret is null or length(v_secret) = 0 then
    insert into public.meta_events_dispatch_log (mode, status, detail)
    values (p_mode, 'skipped_missing_secret',
            'vault.secrets "collect_meta_events_auth_key" ausente ou vazio');
    raise warning 'collect_meta_events_dispatch: segredo collect_meta_events_auth_key ausente no Vault';
    return jsonb_build_object('skipped', 'missing_secret');
  end if;

  -- (d) uma chamada por campanha governada ativa. A Edge Function resolve
  --     o ultimo dia FECHADO em America/Sao_Paulo e reprocessa 28 dias fechados.
  for v_campaign in
    select campaign_id from public.meta_governed_campaigns
     where is_active order by campaign_id
  loop
    select net.http_post(
      url := v_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || v_secret   -- header, nunca query string
      ),
      body := jsonb_build_object('mode', 'daily', 'campaign_id', v_campaign.campaign_id),
      timeout_milliseconds := p_timeout_ms
    ) into v_request_id;

    insert into public.meta_events_dispatch_log (mode, campaign_id, status, request_id, detail)
    values (p_mode, v_campaign.campaign_id, 'dispatched', v_request_id,
            'daily: 28 dias fechados, America/Sao_Paulo');

    v_results := v_results || jsonb_build_object(
      'campaign_id', v_campaign.campaign_id, 'request_id', v_request_id);
  end loop;

  return jsonb_build_object('dispatched', v_results);
end;
$$;

revoke all on function public.collect_meta_events_dispatch(text, integer) from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- 5) Agendamento idempotente
--    11:20 UTC = 08:20 America/Sao_Paulo -> o dia anterior ja esta fechado
--    e a Meta ja teve algumas horas para consolidar a entrega.
-- ---------------------------------------------------------------------
do $$
begin
  perform cron.unschedule('collect-meta-events-daily')
   where exists (select 1 from cron.job where jobname = 'collect-meta-events-daily');
  perform cron.unschedule('meta-collection-watchdog')
   where exists (select 1 from cron.job where jobname = 'meta-collection-watchdog');
end;
$$;

select cron.schedule(
  'collect-meta-events-daily',
  '20 11 * * *',
  $$select public.collect_meta_events_dispatch('daily');$$
);

select cron.schedule(
  'meta-collection-watchdog',
  '*/10 * * * *',
  $$select public.meta_collection_mark_stale_runs(30);$$
);

comment on function public.collect_meta_events_dispatch(text, integer) is
  'Despacha collect-meta-events (mode=daily, 28 dias fechados) para cada campanha governada ativa. Chave lida do Vault por nome; enviada apenas no header Authorization.';
comment on function public.meta_collection_mark_stale_runs(integer) is
  'Watchdog: encerra como failed runs meta presas em pending. Runs failed nunca aparecem nas views produtivas.';
