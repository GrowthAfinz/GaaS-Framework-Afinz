-- Portão de hidratação do vault (decisão do Pablo, 04/11/2026, item 6 da fila de Correções e melhorias):
-- as skills de loop e de correções só reidratam snapshots quando a checagem estiver vencida.
-- Data e horário da última e da próxima checagem ficam no sistema; a frequência é reprogramável.
begin;

create table public.gaas_vault_hydration_policy (
 id integer primary key default 1 check(id=1),
 enabled boolean not null default true,
 cadence_hours integer not null default 168 check(cadence_hours between 1 and 2160),
 stale_after_days integer not null default 30 check(stale_after_days between 1 and 365),
 last_checked_at timestamptz,
 next_check_at timestamptz,
 last_checked_by text check(last_checked_by is null or length(last_checked_by)<=80),
 last_result jsonb check(last_result is null or (jsonb_typeof(last_result)='object' and length(last_result::text)<=100000)),
 updated_at timestamptz not null default now()
);
insert into public.gaas_vault_hydration_policy(id) values(1);

alter table public.gaas_vault_hydration_policy enable row level security;
revoke all on public.gaas_vault_hydration_policy from public,anon,authenticated;
grant select on public.gaas_vault_hydration_policy to authenticated;
grant all on public.gaas_vault_hydration_policy to service_role;
create policy gaas_vault_hydration_policy_read on public.gaas_vault_hydration_policy for select to authenticated using ((select auth.uid()) is not null);

-- Escreve quem é administrador no GaaS ou o agente com a chave de serviço.
create function public.gaas_vault_hydration_can_write() returns boolean language sql stable security definer set search_path='' as $$
 select coalesce(nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'role','')='service_role'
  or (auth.uid() is not null and public.gaas_vault_is_admin());
$$;
revoke all on function public.gaas_vault_hydration_can_write() from public,anon;

create function public.gaas_vault_hydration_status() returns jsonb language sql stable security definer set search_path='' as $$
 select to_jsonb(p) || jsonb_build_object('due', p.enabled and (p.next_check_at is null or p.next_check_at<=now()), 'now', now())
 from public.gaas_vault_hydration_policy p where p.id=1;
$$;

create function public.gaas_vault_hydration_record(p_result jsonb,p_checked_by text default null) returns jsonb language plpgsql security definer set search_path='' as $$
declare r public.gaas_vault_hydration_policy;
begin
 if not public.gaas_vault_hydration_can_write() then raise exception 'hydration_admin_required' using errcode='42501';end if;
 if p_result is null or jsonb_typeof(p_result)<>'object' then raise exception 'hydration_invalid_result';end if;
 update public.gaas_vault_hydration_policy set last_checked_at=now(),next_check_at=now()+make_interval(hours=>cadence_hours),
  last_checked_by=left(coalesce(p_checked_by,'agente'),80),last_result=p_result,updated_at=now() where id=1 returning * into r;
 return to_jsonb(r);
end$$;

-- Reprogramar: muda a frequência e recalcula a próxima checagem a partir da última.
create function public.gaas_vault_hydration_configure(p_cadence_hours integer,p_stale_after_days integer,p_enabled boolean) returns jsonb language plpgsql security definer set search_path='' as $$
declare r public.gaas_vault_hydration_policy;
begin
 if not public.gaas_vault_hydration_can_write() then raise exception 'hydration_admin_required' using errcode='42501';end if;
 update public.gaas_vault_hydration_policy set cadence_hours=coalesce(p_cadence_hours,cadence_hours),stale_after_days=coalesce(p_stale_after_days,stale_after_days),
  enabled=coalesce(p_enabled,enabled),updated_at=now() where id=1 returning * into r;
 update public.gaas_vault_hydration_policy set next_check_at=case when last_checked_at is null then null else last_checked_at+make_interval(hours=>cadence_hours) end where id=1 returning * into r;
 return to_jsonb(r);
end$$;

revoke all on function public.gaas_vault_hydration_status() from public,anon;
revoke all on function public.gaas_vault_hydration_record(jsonb,text) from public,anon;
revoke all on function public.gaas_vault_hydration_configure(integer,integer,boolean) from public,anon;
grant execute on function public.gaas_vault_hydration_status() to authenticated,service_role;
grant execute on function public.gaas_vault_hydration_record(jsonb,text) to authenticated,service_role;
grant execute on function public.gaas_vault_hydration_configure(integer,integer,boolean) to authenticated,service_role;
commit;
