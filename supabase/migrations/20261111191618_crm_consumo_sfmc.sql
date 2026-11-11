-- Consumo SFMC na Estrutura CRM: contrato de consumíveis por frente e canal, envios diários do SFMC,
-- regras que ligam jornada a campanha/frente e meta de volume por campanha.
-- Só estrutura: contrato, regras e envios entram direto no Supabase (repo público).

create table public.sfmc_contract_plan (
  front text not null check (length(btrim(front)) between 2 and 80),
  channel text not null check (channel in ('EMAIL', 'WPPM', 'WPPU', 'SMS')),
  month date not null check (extract(day from month) = 1),
  volume numeric not null default 0 check (volume >= 0),
  primary key (front, channel, month)
);

create table public.sfmc_dispatch_daily (
  channel text not null check (channel in ('EMAIL', 'PUSH', 'WPP', 'SMS')),
  activity_name text not null check (length(activity_name) between 1 and 300),
  dispatch_date date not null,
  journey text not null default '',
  sent numeric not null default 0 check (sent >= 0),
  delivered numeric check (delivered is null or delivered >= 0),
  source text not null default 'dinamica_bi',
  loaded_at timestamptz not null default now(),
  primary key (channel, activity_name, dispatch_date, journey)
);
create index sfmc_dispatch_daily_date_idx on public.sfmc_dispatch_daily (dispatch_date);

create table public.sfmc_pillar_fronts (
  front text primary key check (length(btrim(front)) between 2 and 80),
  pillar_id uuid references public.crm_structure_pillars(id),
  position integer not null default 0
);

create table public.sfmc_consumo_rules (
  id uuid primary key default gen_random_uuid(),
  priority integer not null default 100,
  pattern text not null check (length(pattern) between 1 and 300),
  front text,
  card_id uuid references public.crm_structure_cards(id),
  group_label text check (group_label is null or length(btrim(group_label)) between 2 and 80),
  created_at timestamptz not null default now(),
  check (card_id is not null or group_label is not null)
);
create index sfmc_consumo_rules_priority_idx on public.sfmc_consumo_rules (priority);

create table public.sfmc_card_goals (
  card_id uuid not null references public.crm_structure_cards(id),
  channel text not null check (channel in ('EMAIL', 'WPP', 'SMS')),
  monthly_volume numeric not null check (monthly_volume > 0),
  updated_at timestamptz not null default now(),
  updated_by uuid,
  primary key (card_id, channel)
);

alter table public.sfmc_contract_plan enable row level security;
alter table public.sfmc_dispatch_daily enable row level security;
alter table public.sfmc_pillar_fronts enable row level security;
alter table public.sfmc_consumo_rules enable row level security;
alter table public.sfmc_card_goals enable row level security;

revoke all on public.sfmc_contract_plan, public.sfmc_dispatch_daily, public.sfmc_pillar_fronts, public.sfmc_consumo_rules, public.sfmc_card_goals from public, anon, authenticated;
grant select on public.sfmc_contract_plan, public.sfmc_dispatch_daily, public.sfmc_pillar_fronts, public.sfmc_consumo_rules, public.sfmc_card_goals to authenticated;
grant all on public.sfmc_contract_plan, public.sfmc_dispatch_daily, public.sfmc_pillar_fronts, public.sfmc_consumo_rules, public.sfmc_card_goals to service_role;

create policy sfmc_contract_plan_read on public.sfmc_contract_plan for select to authenticated using ((select auth.uid()) is not null);
create policy sfmc_dispatch_daily_read on public.sfmc_dispatch_daily for select to authenticated using ((select auth.uid()) is not null);
create policy sfmc_pillar_fronts_read on public.sfmc_pillar_fronts for select to authenticated using ((select auth.uid()) is not null);
create policy sfmc_consumo_rules_read on public.sfmc_consumo_rules for select to authenticated using ((select auth.uid()) is not null);
create policy sfmc_card_goals_read on public.sfmc_card_goals for select to authenticated using ((select auth.uid()) is not null);

-- Envios em formato compacto: um envio por activity, dia e canal (quando a mesma activity aparece
-- em mais de uma jornada, fica a jornada com mais volume). Uma chamada só, sem limite de linhas.
create function public.sfmc_consumo_dispatches(p_from date)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  with d as (
    select distinct on (channel, activity_name, dispatch_date)
      channel, activity_name, dispatch_date, journey, sent, delivered
    from public.sfmc_dispatch_daily
    where dispatch_date >= p_from and sent > 0
    order by channel, activity_name, dispatch_date, sent desc, journey
  ),
  j as (select journey, (row_number() over (order by journey))::int - 1 as ji from (select distinct journey from d) x),
  a as (select activity_name, (row_number() over (order by activity_name))::int - 1 as ai from (select distinct activity_name from d) x)
  select jsonb_build_object(
    'journeys', coalesce((select jsonb_agg(journey order by ji) from j), '[]'::jsonb),
    'activities', coalesce((select jsonb_agg(activity_name order by ai) from a), '[]'::jsonb),
    'rows', coalesce((select jsonb_agg(jsonb_build_array(j.ji, a.ai, d.channel, d.dispatch_date, d.sent, d.delivered) order by d.dispatch_date)
                      from d join j using (journey) join a using (activity_name)), '[]'::jsonb),
    'last', (select max(dispatch_date) from public.sfmc_dispatch_daily),
    'loaded_at', (select max(loaded_at) from public.sfmc_dispatch_daily)
  );
$$;
revoke all on function public.sfmc_consumo_dispatches(date) from public, anon;
grant execute on function public.sfmc_consumo_dispatches(date) to authenticated, service_role;

-- Meta de volume por campanha e canal. Volume nulo ou zero apaga a meta. Só admin.
create function public.sfmc_save_card_goal(p_card_id uuid, p_channel text, p_volume numeric)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.gaas_vault_is_admin() then raise exception 'crm_structure_access_denied'; end if;
  if p_channel not in ('EMAIL', 'WPP', 'SMS') then raise exception 'sfmc_goal_channel_invalid'; end if;
  if not exists (select 1 from public.crm_structure_cards c where c.id = p_card_id and not c.archived) then raise exception 'sfmc_goal_card_invalid'; end if;
  if p_volume is null or p_volume <= 0 then
    delete from public.sfmc_card_goals where card_id = p_card_id and channel = p_channel;
  else
    insert into public.sfmc_card_goals (card_id, channel, monthly_volume, updated_at, updated_by)
    values (p_card_id, p_channel, round(p_volume), now(), auth.uid())
    on conflict (card_id, channel) do update set monthly_volume = excluded.monthly_volume, updated_at = now(), updated_by = auth.uid();
  end if;
end;
$$;
revoke all on function public.sfmc_save_card_goal(uuid, text, numeric) from public, anon;
grant execute on function public.sfmc_save_card_goal(uuid, text, numeric) to authenticated, service_role;
