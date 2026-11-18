-- Comentários da Tarefa, uma linha por comentário (antes ficavam dentro do JSON da página do módulo,
-- e dois comentários ao mesmo tempo podiam se perder). Autor apaga o próprio comentário; nada some do histórico.
begin;

create table public.growth_task_comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.growth_development_tasks(id),
  author_id uuid not null references auth.users(id),
  body text not null check (length(trim(body)) between 1 and 4000),
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index growth_task_comments_task on public.growth_task_comments (task_id, created_at);
alter table public.growth_task_comments enable row level security;
revoke all on public.growth_task_comments from public, anon, authenticated;
grant select on public.growth_task_comments to authenticated;
grant all on public.growth_task_comments to service_role;
create policy growth_task_comments_read on public.growth_task_comments for select to authenticated using ((select gaas_security.is_approved_member()));
create policy gaas_approved_member_gate on public.growth_task_comments as restrictive for all to anon, authenticated
  using ((select gaas_security.is_approved_member())) with check ((select gaas_security.is_approved_member()));

create or replace function public.growth_add_task_comment(p_task uuid, p_body text)
returns jsonb language plpgsql security definer set search_path to '' as $$
declare c public.growth_task_comments;
begin
  if auth.uid() is null or not (public.gaas_vault_is_admin() or gaas_security.is_approved_member()) then raise exception 'development_access_denied'; end if;
  if not exists (select 1 from public.growth_development_tasks where id = p_task) then raise exception 'task_not_found'; end if;
  if length(trim(coalesce(p_body, ''))) = 0 then raise exception 'comment_required'; end if;
  insert into public.growth_task_comments (task_id, author_id, body) values (p_task, auth.uid(), trim(p_body)) returning * into c;
  return to_jsonb(c);
end $$;
revoke all on function public.growth_add_task_comment(uuid, text) from public, anon;
grant execute on function public.growth_add_task_comment(uuid, text) to authenticated, service_role;

create or replace function public.growth_delete_task_comment(p_id uuid)
returns void language plpgsql security definer set search_path to '' as $$
begin
  update public.growth_task_comments set deleted_at = clock_timestamp()
   where id = p_id and author_id = auth.uid() and deleted_at is null;
  if not found then raise exception 'comment_not_found'; end if;
end $$;
revoke all on function public.growth_delete_task_comment(uuid) from public, anon;
grant execute on function public.growth_delete_task_comment(uuid) to authenticated, service_role;

commit;
