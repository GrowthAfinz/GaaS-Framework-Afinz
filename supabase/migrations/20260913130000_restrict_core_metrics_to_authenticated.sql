-- The application has an authentication wall, but these core datasets still
-- exposed table privileges to anon. Preserve the current authenticated CRUD
-- contract while making RLS enforce that wall for every direct API request.

alter table public.activities enable row level security;
alter table public.paid_media_metrics enable row level security;
alter table public.b2c_daily_metrics enable row level security;

drop policy if exists "Acesso Total Activities" on public.activities;
drop policy if exists "Allow all actions for authenticated users" on public.paid_media_metrics;
drop policy if exists "Allow all actions for authenticated users" on public.b2c_daily_metrics;

revoke all on table public.activities from anon;
revoke all on table public.paid_media_metrics from anon;
revoke all on table public.b2c_daily_metrics from anon;

revoke truncate, references, trigger on table public.activities from authenticated;
revoke truncate, references, trigger on table public.paid_media_metrics from authenticated;
revoke truncate, references, trigger on table public.b2c_daily_metrics from authenticated;

grant select, insert, update, delete on table public.activities to authenticated;
grant select, insert, update, delete on table public.paid_media_metrics to authenticated;
grant select, insert, update, delete on table public.b2c_daily_metrics to authenticated;

create policy activities_authenticated_all
  on public.activities for all to authenticated
  using ((select auth.uid()) is not null)
  with check ((select auth.uid()) is not null);

create policy paid_media_metrics_authenticated_all
  on public.paid_media_metrics for all to authenticated
  using ((select auth.uid()) is not null)
  with check ((select auth.uid()) is not null);

create policy b2c_daily_metrics_authenticated_all
  on public.b2c_daily_metrics for all to authenticated
  using ((select auth.uid()) is not null)
  with check ((select auth.uid()) is not null);

grant all on table public.activities to service_role;
grant all on table public.paid_media_metrics to service_role;
grant all on table public.b2c_daily_metrics to service_role;

comment on policy activities_authenticated_all on public.activities is
  'GaaS requires authentication; legacy direct CRUD remains available to signed-in users.';
comment on policy paid_media_metrics_authenticated_all on public.paid_media_metrics is
  'GaaS requires authentication; legacy direct CRUD remains available to signed-in users.';
comment on policy b2c_daily_metrics_authenticated_all on public.b2c_daily_metrics is
  'GaaS requires authentication; legacy direct CRUD remains available to signed-in users.';
