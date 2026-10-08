-- Scoped, optimistic, auditable links. No mutation by Activity Name alone.
create table public.communication_execution_links (
 id bigint generated always as identity primary key,
 actor uuid not null, template_id text not null, snapshots jsonb not null,
 start_date date not null, end_date date not null, evidence text not null,
 created_at timestamptz not null default now()
);
alter table public.communication_execution_links enable row level security;
revoke all on public.communication_execution_links from public,anon,authenticated;
grant select on public.communication_execution_links to authenticated;
create policy execution_links_read on public.communication_execution_links for select to authenticated using ((select auth.uid()) is not null);
create function gaas_sfmc_private.link_executions(p_template text,p_snapshots jsonb,p_start date,p_end date,p_evidence text)
returns integer language plpgsql security definer set search_path=pg_catalog,public as $fn$
declare snap jsonb; current_row jsonb; ids uuid[]; n integer;
begin
 if auth.uid() is null then raise exception 'Sessão autenticada necessária'; end if;
 if p_start is null or p_end is null or p_end<p_start then raise exception 'Período inválido'; end if;
 if p_snapshots is null or jsonb_typeof(p_snapshots)<>'array' or jsonb_array_length(p_snapshots)=0 or jsonb_array_length(p_snapshots)>500 then raise exception 'Selecione de 1 a 500 execuções'; end if;
 if length(trim(coalesce(p_evidence,'')))<3 then raise exception 'Confirme a evidência do vínculo'; end if;
 if not exists(select 1 from public.communication_templates where template_id=p_template) then raise exception 'Template não cadastrado'; end if;
 select array_agg((v->>'id')::uuid order by v->>'id'),count(distinct v->>'id') into ids,n from jsonb_array_elements(p_snapshots) v;
 if n<>jsonb_array_length(p_snapshots) then raise exception 'Execuções repetidas na seleção'; end if;
 -- Lock in deterministic order; concurrent changes invalidate the whole selection.
 perform 1 from public.activities where id=any(ids) order by id for update;
 for snap in select value from jsonb_array_elements(p_snapshots) loop
  select to_jsonb(a) into current_row from public.activities a where id=(snap->>'id')::uuid;
  if current_row is null or current_row<>snap then raise exception 'Execução alterada; atualize e revise novamente'; end if;
  if current_row->>'template_id' is not null then raise exception 'Execução já vinculada'; end if;
  if current_row->>'jornada' is null or current_row->>'Activity name / Taxonomia' is null or current_row->>'Canal' is null then raise exception 'Contexto incompleto'; end if;
  if not exists(select 1 from public.communication_templates t where t.template_id=p_template and t.channel=current_row->>'Canal') then raise exception 'Canal do template diverge da execução'; end if;
  if (current_row->>'Data de Disparo')::timestamptz < p_start::timestamp at time zone 'America/Sao_Paulo' or
     (current_row->>'Data de Disparo')::timestamptz >= (p_end+1)::timestamp at time zone 'America/Sao_Paulo' or current_row->>'Data de Disparo' is null then raise exception 'Execução fora do período'; end if;
 end loop;
 insert into public.communication_execution_links(actor,template_id,snapshots,start_date,end_date,evidence) values(auth.uid(),p_template,p_snapshots,p_start,p_end,p_evidence);
 update public.activities set template_id=p_template,updated_at=now() where id=any(ids) and template_id is null;
 get diagnostics n=row_count;
 return n;
end $fn$;
create function public.link_communication_executions(p_template text,p_snapshots jsonb,p_start date,p_end date,p_evidence text)
returns integer language sql security invoker set search_path=pg_catalog as $$select gaas_sfmc_private.link_executions(p_template,p_snapshots,p_start,p_end,p_evidence)$$;
revoke all on function gaas_sfmc_private.link_executions(text,jsonb,date,date,text),public.link_communication_executions(text,jsonb,date,date,text) from public,anon;
grant execute on function gaas_sfmc_private.link_executions(text,jsonb,date,date,text),public.link_communication_executions(text,jsonb,date,date,text) to authenticated;

