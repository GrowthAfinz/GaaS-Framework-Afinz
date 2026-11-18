-- Tarefas e Wiki editáveis por todo membro aprovado (decisão do Pablo em 17/11/2026).
-- 1) gaas_can_edit_work: a tela pergunta se pode editar Tarefas e a seção de Tarefas da Wiki.
-- 2) gaas_wiki_pilot_save deixa de exigir admin; continua exigindo membro aprovado, revisão e histórico.
--    A troca é feita na definição atual do banco, para não reescrever o corpo da função à mão.
begin;

create or replace function public.gaas_can_edit_work()
returns boolean
language sql
stable
security definer
set search_path to ''
as $$
  select auth.uid() is not null and (public.gaas_vault_is_admin() or gaas_security.is_approved_member());
$$;
revoke all on function public.gaas_can_edit_work() from public, anon;
grant execute on function public.gaas_can_edit_work() to authenticated, service_role;

do $$
declare
  d text := pg_get_functiondef('public.gaas_wiki_pilot_save(uuid,integer,text,jsonb,uuid,text,boolean)'::regprocedure);
  gate text := ' or not public.gaas_vault_is_admin()';
begin
  if position(gate in d) > 0 then
    execute replace(d, gate, '');
  end if;
end $$;

commit;
