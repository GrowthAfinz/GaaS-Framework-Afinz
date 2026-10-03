-- Preserve legacy six-key scope identities. Optional nonempty detail keys identify new recuts.
-- No change to RLS, permissions, old rows or append-only retrospective history.
alter table public.growth_result_retrospectives drop constraint growth_result_retrospectives_domain_check;
alter table public.growth_result_retrospectives add constraint growth_result_retrospectives_domain_check check (domain in ('crm','renta','media','b2c'));
create or replace function public.growth_result_retrospective_guard() returns trigger
 language plpgsql security invoker set search_path='' as $$
declare v_revision integer;
begin
 if tg_op <> 'INSERT' then raise exception 'retrospectives_are_append_only'; end if;
 if auth.uid() is null or new.author_id <> auth.uid() then raise exception 'retrospective_author_required'; end if;
 if not (new.scope ?& array['bu','segment','partner','channel','campaign','type'])
  or new.scope-array['bu','segment','partner','channel','campaign','type','stage','subgroup','journey','safra','operation_id','objective','grain'] <> '{}'::jsonb
  or exists(select 1 from jsonb_each(new.scope) e where jsonb_typeof(e.value)<>'string' or length(e.value#>>'{}')>300)
 then raise exception 'invalid_result_scope'; end if;
 if new.domain in ('crm','renta') and (new.scope->>'campaign'<>'' or new.scope->>'type'<>'')
  or new.domain='media' and (new.scope->>'bu'<>'' or new.scope->>'segment'<>'' or new.scope->>'partner'<>'' or new.scope->>'type'<>'')
  or new.domain='b2c' and (new.scope->>'type' not in ('total','serasa_api','crm') or new.scope->>'bu'<>'' or new.scope->>'segment'<>'' or new.scope->>'partner'<>'' or new.scope->>'campaign'<>'' or new.scope->>'channel'<>'')
 or new.domain in ('crm','renta') and (new.scope ? 'objective' or new.scope ? 'grain')
  or new.domain in ('media','b2c') and (new.scope ? 'stage' or new.scope ? 'subgroup' or new.scope ? 'journey' or new.scope ? 'safra')
  or new.domain='b2c' and (new.scope ? 'objective' or new.scope ? 'grain')
 then raise exception 'incompatible_result_scope'; end if;
 perform pg_advisory_xact_lock(hashtext(new.domain||new.scope::text||new.period::text));
 select coalesce(max(revision),0) into v_revision from public.growth_result_retrospectives
  where domain=new.domain and scope=new.scope and period=new.period;
 if new.revision<>v_revision+1 then raise exception 'retrospective_revision_conflict'; end if;
 new.created_at:=now();
 return new;
end $$;
