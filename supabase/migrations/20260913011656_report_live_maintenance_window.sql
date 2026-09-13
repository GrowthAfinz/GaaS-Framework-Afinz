create table public.report_live_runtime_settings (
  id text primary key default 'live' check(id='live'),
  maintenance boolean not null default false,
  message text,
  updated_at timestamptz not null default clock_timestamp(),
  updated_by uuid
);
insert into public.report_live_runtime_settings(id,maintenance,message)
values('live',false,null) on conflict(id) do nothing;

alter table public.report_live_runtime_settings enable row level security;
revoke all on public.report_live_runtime_settings from public,anon,authenticated;
grant select on public.report_live_runtime_settings to authenticated,service_role;
grant insert,update,delete on public.report_live_runtime_settings to service_role;
create policy report_live_runtime_settings_authenticated_read
  on public.report_live_runtime_settings for select to authenticated using(true);

create or replace function public.report_live_set_maintenance(
  p_enabled boolean,p_message text default null,p_actor uuid default null
)
returns jsonb language plpgsql security definer set search_path='' as $$
declare result public.report_live_runtime_settings;
begin
  insert into public.report_live_runtime_settings(id,maintenance,message,updated_at,updated_by)
  values('live',p_enabled,nullif(trim(p_message),''),clock_timestamp(),p_actor)
  on conflict(id) do update set maintenance=excluded.maintenance,message=excluded.message,
    updated_at=excluded.updated_at,updated_by=excluded.updated_by
  returning * into result;
  return to_jsonb(result);
end;
$$;
revoke all on function public.report_live_set_maintenance(boolean,text,uuid) from public,anon,authenticated;
grant execute on function public.report_live_set_maintenance(boolean,text,uuid) to service_role;

comment on table public.report_live_runtime_settings is
  'Operational switch that blocks user-triggered Report Live writes and downloads during controlled maintenance.';
