-- Relatórios | Pool Visa: dados da LP dinâmica (GA4) por dia.
-- Só estrutura. A carga é feita pela função pool_visa_lp_replace (service_role),
-- chamada pelo script scripts/pool-visa-lp-ga4.py. Nenhum dado de negócio aqui: o repo é público.

create table if not exists public.pool_visa_lp_ingest_runs (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source in ('ga4_api', 'ga4_csv')),
  property_id text not null,
  date_start date not null,
  date_end date not null check (date_end >= date_start),
  status text not null check (status in ('ok', 'divergente')),
  rows_traffic integer not null default 0,
  rows_events integer not null default 0,
  sum_events integer not null default 0,
  api_total_events integer,
  note text,
  created_at timestamptz not null default now()
);

comment on table public.pool_visa_lp_ingest_runs is
  'Cada carga da LP do Pool Visa: período relido, linhas gravadas e conferência da soma de eventos contra o total pedido ao GA4. Carga divergente não substitui os dados.';

-- Visitas: dia × página × origem da sessão.
create table if not exists public.pool_visa_lp_traffic_daily (
  event_date date not null,
  host_name text not null,
  page_path text not null,
  source_medium text not null,
  sessions integer not null default 0 check (sessions >= 0),
  page_views integer not null default 0 check (page_views >= 0),
  users_day integer not null default 0 check (users_day >= 0),
  run_id uuid not null references public.pool_visa_lp_ingest_runs(id),
  primary key (event_date, host_name, page_path, source_medium)
);

comment on table public.pool_visa_lp_traffic_daily is
  'Sessões e page_views da LP do Pool Visa por dia, página e sessionSourceMedium (GA4). users_day só vale dentro da linha: não somar entre dias.';

-- Cliques: dia × evento × página × origem × marca × oferta × parceiro × grupo × célula.
-- Valores ausentes ficam como chegam do GA4, por exemplo '(not set)'.
create table if not exists public.pool_visa_lp_events_daily (
  event_date date not null,
  event_name text not null check (event_name in ('clique_oferta', 'clique_site_visa')),
  page_path text not null,
  source_medium text not null,
  marca_raw text not null,
  oferta_id_raw text not null,
  parceiro_raw text not null,
  grupo_raw text not null,
  celula_raw text not null,
  event_count integer not null default 0 check (event_count >= 0),
  users_day integer not null default 0 check (users_day >= 0),
  run_id uuid not null references public.pool_visa_lp_ingest_runs(id),
  primary key (event_date, event_name, page_path, source_medium, marca_raw, oferta_id_raw, parceiro_raw, grupo_raw, celula_raw)
);

comment on table public.pool_visa_lp_events_daily is
  'Eventos clique_oferta e clique_site_visa da LP do Pool Visa por dia (GA4), com marca, oferta, parceiro do cartão, grupo e célula brutos. event_count soma; users_day não.';

do $$
declare t text;
begin
  foreach t in array array['pool_visa_lp_ingest_runs', 'pool_visa_lp_traffic_daily', 'pool_visa_lp_events_daily'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from public, anon, authenticated', t);
    execute format('grant select on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('drop policy if exists %I on public.%I', t || '_read', t);
    execute format('create policy %I on public.%I for select to authenticated using ((select gaas_security.is_approved_member()))', t || '_read', t);
    execute format('drop policy if exists gaas_approved_member_gate on public.%I', t);
    execute format('create policy gaas_approved_member_gate on public.%I as restrictive for all to anon, authenticated using ((select gaas_security.is_approved_member())) with check ((select gaas_security.is_approved_member()))', t);
  end loop;
end $$;

-- Substitui o período inteiro numa transação. Se a soma dos eventos não bater com o total
-- informado pelo GA4, grava a execução como divergente e não mexe nos dados.
create or replace function public.pool_visa_lp_replace(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_start date := (p_payload->>'date_start')::date;
  v_end date := (p_payload->>'date_end')::date;
  v_api_total integer := nullif(p_payload->>'api_total_events', '')::integer;
  v_traffic jsonb := coalesce(p_payload->'traffic', '[]'::jsonb);
  v_events jsonb := coalesce(p_payload->'events', '[]'::jsonb);
  v_sum integer;
  v_run uuid;
  v_status text;
begin
  if v_start is null or v_end is null or v_end < v_start then
    raise exception 'pool_visa_lp_replace: período inválido';
  end if;
  if jsonb_typeof(v_traffic) <> 'array' or jsonb_typeof(v_events) <> 'array' then
    raise exception 'pool_visa_lp_replace: traffic e events precisam ser listas';
  end if;
  if exists (
    select 1 from jsonb_array_elements(v_traffic) r where (r->>'event_date')::date not between v_start and v_end
    union all
    select 1 from jsonb_array_elements(v_events) r where (r->>'event_date')::date not between v_start and v_end
  ) then
    raise exception 'pool_visa_lp_replace: linha fora do período informado';
  end if;

  select coalesce(sum((r->>'event_count')::integer), 0) into v_sum from jsonb_array_elements(v_events) r;
  v_status := case when v_api_total is not null and v_api_total <> v_sum then 'divergente' else 'ok' end;

  insert into public.pool_visa_lp_ingest_runs (source, property_id, date_start, date_end, status, rows_traffic, rows_events, sum_events, api_total_events, note)
  values (
    coalesce(p_payload->>'source', 'ga4_api'), coalesce(p_payload->>'property_id', ''), v_start, v_end, v_status,
    jsonb_array_length(v_traffic), jsonb_array_length(v_events), v_sum, v_api_total, p_payload->>'note'
  )
  returning id into v_run;

  if v_status = 'divergente' then
    return jsonb_build_object('run_id', v_run, 'status', v_status, 'sum_events', v_sum, 'api_total_events', v_api_total);
  end if;

  delete from public.pool_visa_lp_traffic_daily where event_date between v_start and v_end;
  delete from public.pool_visa_lp_events_daily where event_date between v_start and v_end;

  insert into public.pool_visa_lp_traffic_daily (event_date, host_name, page_path, source_medium, sessions, page_views, users_day, run_id)
  select (r->>'event_date')::date, r->>'host_name', r->>'page_path', r->>'source_medium',
         coalesce((r->>'sessions')::integer, 0), coalesce((r->>'page_views')::integer, 0), coalesce((r->>'users_day')::integer, 0), v_run
  from jsonb_array_elements(v_traffic) r;

  insert into public.pool_visa_lp_events_daily (event_date, event_name, page_path, source_medium, marca_raw, oferta_id_raw, parceiro_raw, grupo_raw, celula_raw, event_count, users_day, run_id)
  select (r->>'event_date')::date, r->>'event_name', r->>'page_path', r->>'source_medium',
         coalesce(r->>'marca_raw', '(not set)'), coalesce(r->>'oferta_id_raw', '(not set)'), coalesce(r->>'parceiro_raw', '(not set)'),
         coalesce(r->>'grupo_raw', '(not set)'), coalesce(r->>'celula_raw', '(not set)'),
         coalesce((r->>'event_count')::integer, 0), coalesce((r->>'users_day')::integer, 0), v_run
  from jsonb_array_elements(v_events) r;

  return jsonb_build_object('run_id', v_run, 'status', v_status, 'rows_traffic', jsonb_array_length(v_traffic), 'rows_events', jsonb_array_length(v_events), 'sum_events', v_sum);
end;
$$;

revoke all on function public.pool_visa_lp_replace(jsonb) from public, anon, authenticated;
grant execute on function public.pool_visa_lp_replace(jsonb) to service_role;
