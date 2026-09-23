-- Release 5 hardening: close the internal revision authorization immediately
-- after the versioned update, instead of leaving it active until transaction end.

create or replace function public.growth_reset_learning_revision_context()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  perform set_config('app.growth_learning_revision', '', true);
  return null;
end;
$$;

create trigger growth_learnings_revision_context_reset
after update on public.growth_learnings
for each statement execute function public.growth_reset_learning_revision_context();

revoke execute on function public.growth_reset_learning_revision_context()
  from public, anon, authenticated;
grant execute on function public.growth_reset_learning_revision_context()
  to service_role;
