-- Internal operational retrospectives. Canonical definitions remain in the Wiki.
create table public.growth_result_retrospectives (
 id uuid primary key default gen_random_uuid(),
 domain text not null check (domain in ('crm','media','b2c')),
 scope jsonb not null check (jsonb_typeof(scope)='object' and octet_length(scope::text)<=4000),
 period date not null check (extract(day from period)=1),
 revision integer not null check (revision>0),
 observation text not null check (length(btrim(observation)) between 3 and 8000),
 interpretation text not null default '' check (length(interpretation)<=8000),
 learning text not null check (length(btrim(learning)) between 3 and 8000),
 next_action text not null check (length(btrim(next_action)) between 3 and 8000),
 evidence text not null check (length(btrim(evidence)) between 3 and 8000),
 source_snapshot jsonb not null default '{}' check (jsonb_typeof(source_snapshot)='object' and octet_length(source_snapshot::text)<=16000),
 author_id uuid not null references auth.users(id),
 created_at timestamptz not null default now(),
 unique (domain,scope,period,revision)
);
alter table public.growth_result_retrospectives enable row level security;
revoke all on public.growth_result_retrospectives from anon, authenticated;
grant select, insert on public.growth_result_retrospectives to authenticated;
create policy results_retrospective_read on public.growth_result_retrospectives for select to authenticated
 using ((select auth.uid()) is not null);
create policy results_retrospective_write on public.growth_result_retrospectives for insert to authenticated
 with check (author_id=(select auth.uid()) and (select auth.uid()) is not null);
create function public.growth_result_retrospective_guard() returns trigger
 language plpgsql security invoker set search_path='' as $$
declare v_revision integer;
begin
 if tg_op <> 'INSERT' then raise exception 'retrospectives_are_append_only'; end if;
 if auth.uid() is null or new.author_id <> auth.uid() then raise exception 'retrospective_author_required'; end if;
 if not (new.scope ?& array['bu','segment','partner','channel','campaign','type'])
  or new.scope-array['bu','segment','partner','channel','campaign','type'] <> '{}'::jsonb
  or exists(select 1 from jsonb_each(new.scope) e where jsonb_typeof(e.value)<>'string' or length(e.value#>>'{}')>300)
 then raise exception 'invalid_result_scope'; end if;
 if new.domain='crm' and (new.scope->>'campaign'<>'' or new.scope->>'type'<>'')
  or new.domain='media' and (new.scope->>'bu'<>'' or new.scope->>'segment'<>'' or new.scope->>'partner'<>'' or new.scope->>'type'<>'')
  or new.domain='b2c' and (new.scope->>'type' not in ('total','serasa_api','crm') or new.scope->>'bu'<>'' or new.scope->>'segment'<>'' or new.scope->>'partner'<>'' or new.scope->>'campaign'<>'' or new.scope->>'channel'<>'')
 then raise exception 'incompatible_result_scope'; end if;
 perform pg_advisory_xact_lock(hashtext(new.domain||new.scope::text||new.period::text));
 select coalesce(max(revision),0) into v_revision from public.growth_result_retrospectives
  where domain=new.domain and scope=new.scope and period=new.period;
 if new.revision<>v_revision+1 then raise exception 'retrospective_revision_conflict'; end if;
 new.created_at:=now();
 return new;
end $$;
create trigger growth_result_retrospective_guard before insert or update or delete on public.growth_result_retrospectives
 for each row execute function public.growth_result_retrospective_guard();
create function public.growth_append_result_retrospective(
 p_domain text,p_scope jsonb,p_period date,p_expected_revision integer,
 p_observation text,p_interpretation text,p_learning text,p_next_action text,p_evidence text,
 p_source_snapshot jsonb default '{}'
) returns public.growth_result_retrospectives
 language plpgsql security invoker set search_path='' as $$
declare v_revision integer; v_row public.growth_result_retrospectives;
begin
 if auth.uid() is null then raise exception 'authentication_required'; end if;
 perform pg_advisory_xact_lock(hashtext(p_domain||p_scope::text||p_period::text));
 select coalesce(max(revision),0) into v_revision from public.growth_result_retrospectives
  where domain=p_domain and scope=p_scope and period=p_period;
 if p_expected_revision is null or p_expected_revision<>v_revision then
  raise exception 'A retrospectiva mudou. Recarregue as versões antes de salvar.';
 end if;
 insert into public.growth_result_retrospectives(domain,scope,period,revision,observation,interpretation,learning,next_action,evidence,source_snapshot,author_id)
 values(p_domain,p_scope,p_period,v_revision+1,btrim(p_observation),coalesce(btrim(p_interpretation),''),btrim(p_learning),btrim(p_next_action),btrim(p_evidence),p_source_snapshot,auth.uid())
 returning * into v_row;
 return v_row;
end $$;
revoke all on function public.growth_append_result_retrospective(text,jsonb,date,integer,text,text,text,text,text,jsonb) from public,anon;
grant execute on function public.growth_append_result_retrospective(text,jsonb,date,integer,text,text,text,text,text,jsonb) to authenticated;
revoke all on function public.growth_result_retrospective_guard() from public,anon;
-- Extend the existing contextual-bet contract without changing its signature or other validation.
do $$
declare v_oid oid; v_definition text; v_updated text;
begin
 select oid into v_oid from pg_proc where pronamespace='public'::regnamespace and proname='growth_create_contextual_bet_with_memory';
 if v_oid is null then raise exception 'contextual_bet_contract_missing'; end if;
 v_definition:=pg_get_functiondef(v_oid);
 v_updated:=replace(v_definition,
  'v_surface not in (''reports_overview'', ''reports_daily'', ''reports_monthly'', ''acquisition_funnel'')',
  'v_surface not in (''reports_overview'', ''reports_daily'', ''reports_monthly'', ''acquisition_funnel'', ''results_dossier'')');
 if v_updated=v_definition and position('results_dossier' in v_definition)=0 then raise exception 'contextual_bet_contract_changed'; end if;
 execute v_updated;
end $$;

