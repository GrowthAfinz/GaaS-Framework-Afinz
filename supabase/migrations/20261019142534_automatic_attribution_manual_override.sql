-- A manual correction/reversal must not be silently undone by automatic attribution.
alter table public.communication_auto_links add column revoked_at timestamptz;
create or replace function gaas_sfmc_private.automatic_activity_template()
returns trigger language plpgsql security definer set search_path=pg_catalog,public as $$
declare candidate text;origin uuid;ids integer;blocked boolean;known_bu text;source_count integer;
begin
 -- Explicit user changes override an automatic decision and survive subsequent ingestion.
 if old.template_id is not null and new.template_id is distinct from old.template_id then
  update public.communication_auto_links set revoked_at=now() where activity_id=new.id and revoked_at is null;
  return new;
 end if;
 if exists(select 1 from public.communication_auto_links l where l.activity_id=new.id and l.revoked_at is not null) then
  if new is not distinct from old then return null;end if;return new;
 end if;
 if new.template_id is not null or nullif(btrim(new.jornada),'') is null or nullif(btrim(new."Activity name / Taxonomia"),'') is null then if new is not distinct from old then return null;end if;return new;end if;
 select count(distinct c.template_id),min(c.template_id),bool_or(c.conflicted or not c.approved or c.template_id is null),count(distinct c.source_bu),min(c.source_bu)
 into ids,candidate,blocked,source_count,known_bu from gaas_sfmc_private.activity_candidates(new.jornada,new."Activity name / Taxonomia",new."Canal") c;
 if ids<>1 or coalesce(blocked,true) or source_count>1 then if new is not distinct from old then return null;end if;return new;end if;
 if known_bu is not null and ((known_bu='Plurix') is distinct from (coalesce(new."BU",'')='Plurix')) then if new is not distinct from old then return null;end if;return new;end if;
 -- A divergent historical attribution is an exception, never an overwrite.
 if exists(select 1 from public.activities a where regexp_replace(upper(btrim(a.jornada)),'^JOR_AQUISICAO_','JOR_AQS_')=regexp_replace(upper(btrim(new.jornada)),'^JOR_AQUISICAO_','JOR_AQS_') and btrim(a."Activity name / Taxonomia")=btrim(new."Activity name / Taxonomia") and a."Canal"=new."Canal" and a."BU" is not distinct from new."BU" and a.template_id is not null and a.template_id<>candidate) then if new is not distinct from old then return null;end if;return new;end if;
 select c.import_id into origin from gaas_sfmc_private.activity_candidates(new.jornada,new."Activity name / Taxonomia",new."Canal") c where c.template_id=candidate order by c.import_id limit 1;
 -- Record source before modification; this also makes automatic decisions reviewable.
 insert into public.communication_auto_links(activity_id,template_id,import_id,source_record) values(new.id,candidate,origin,to_jsonb(new)) on conflict(activity_id) do nothing;
 new.template_id:=candidate;return new;
end $$;
drop trigger activities_auto_content_update on public.activities;
create trigger activities_auto_content_update before update on public.activities for each row
 when(new.template_id is null or old.template_id is distinct from new.template_id)
 execute function gaas_sfmc_private.automatic_activity_template();
