-- Decisions are append-only; source activities are never changed or deleted.
create table public.communication_execution_reviews (
 id bigint generated always as identity primary key,
 group_key text not null, member_ids uuid[] not null, keep_id uuid not null,
 snapshots jsonb not null, approved boolean not null,
 actor uuid not null, note text not null, created_at timestamptz not null default now()
);
create index communication_execution_reviews_group on public.communication_execution_reviews(group_key,id desc);
alter table public.communication_execution_reviews enable row level security;
revoke all on public.communication_execution_reviews from public,anon,authenticated;
grant select on public.communication_execution_reviews to authenticated;
create policy execution_review_read on public.communication_execution_reviews for select to authenticated using ((select auth.uid()) is not null);

create or replace function gaas_sfmc_private.execution_duplicates(p_start date,p_end date)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $fn$
begin
 if auth.uid() is null then raise exception 'Sessão autenticada necessária'; end if;
 if p_start is null or p_end is null or p_end<p_start then raise exception 'Período inválido'; end if;
 return (with grouped as (
 select jsonb_agg(to_jsonb(a) order by a.id) members,array_agg(a.id order by a.id) ids,
 count(*) n,
 count(distinct (to_jsonb(a)-array['id','created_at','updated_at'])) identical,
 count(distinct (to_jsonb(a)-array['id','created_at','updated_at','template_id'])) compatible,
 count(distinct a.template_id) template_count
 from public.activities a
 where a."Data de Disparo">=p_start::timestamp at time zone 'America/Sao_Paulo'
 and a."Data de Disparo"<(p_end+1)::timestamp at time zone 'America/Sao_Paulo'
 and a.jornada is not null and a."Activity name / Taxonomia" is not null and a."Canal" is not null
 group by a.jornada,a."Activity name / Taxonomia",a."Canal",a."Data de Disparo" having count(*)>1
 ), keyed as (select *,md5(array_to_string(ids,',')) key from grouped)
 select coalesce(jsonb_agg(jsonb_build_object('key',g.key,'members',g.members,'fingerprint',md5(g.members::text),
 'safe',g.n=2 and g.compatible=1 and g.template_count<=1,
 'kind',case when g.identical=1 then 'Idênticos' when g.compatible=1 and g.template_count<=1 then 'Somente template' else 'Dados divergentes' end,
 'approved',coalesce(r.approved and r.snapshots=g.members,false),'keep_id',r.keep_id) order by g.key),'[]')
 from keyed g left join lateral (select * from public.communication_execution_reviews e where e.group_key=g.key order by id desc limit 1) r on true);
end $fn$;

create or replace function gaas_sfmc_private.review_execution_duplicate(p_ids uuid[],p_keep uuid,p_fingerprint text,p_approved boolean,p_note text)
returns void language plpgsql security definer set search_path=pg_catalog,public as $fn$
declare snapshots jsonb; ids uuid[]; n integer; compatible integer; templates integer; natural_keys integer; k text;
begin
 if auth.uid() is null then raise exception 'Sessão autenticada necessária'; end if;
 if p_ids is null or cardinality(p_ids)<>2 or array_position(p_ids,null) is not null or p_ids[1]=p_ids[2] or p_keep is null or not p_keep=any(p_ids) or p_note is null or length(btrim(p_note))<3 or p_approved is null then raise exception 'Seleção ou justificativa inválida'; end if;
 select array_agg(x order by x) into ids from unnest(p_ids) x;
 k:=md5(array_to_string(ids,','));
 perform pg_advisory_xact_lock(hashtextextended(k,0));
 perform id from public.activities where id=any(ids) order by id for update;
 select jsonb_agg(to_jsonb(a) order by a.id),count(*),
 count(distinct (to_jsonb(a)-array['id','created_at','updated_at','template_id'])),count(distinct a.template_id),
 count(distinct jsonb_build_array(a.jornada,a."Activity name / Taxonomia",a."Canal",a."Data de Disparo"))
 into snapshots,n,compatible,templates,natural_keys from public.activities a where id=any(ids);
 if n<>2 or md5(snapshots::text) is distinct from p_fingerprint then raise exception 'Registros mudaram; consulte novamente'; end if;
 if p_approved and (compatible<>1 or templates>1 or natural_keys<>1 or exists(select 1 from public.activities a where a.id=any(ids) and (a.jornada is null or a."Activity name / Taxonomia" is null or a."Canal" is null or a."Data de Disparo" is null))) then raise exception 'Diferenças operacionais exigem revisão individual'; end if;
 if p_approved and (select count(*) from public.activities a join public.activities ref on ref.id=ids[1]
 and a.jornada=ref.jornada and a."Activity name / Taxonomia"=ref."Activity name / Taxonomia" and a."Canal"=ref."Canal" and a."Data de Disparo"=ref."Data de Disparo")<>2 then raise exception 'Grupo ampliado; revise todos os registros'; end if;
 if p_approved and exists(select 1 from public.activities where id=any(ids) and template_id is not null)
 and not exists(select 1 from public.activities where id=p_keep and template_id is not null) then raise exception 'Preserve o registro com template preenchido'; end if;
 insert into public.communication_execution_reviews(group_key,member_ids,keep_id,snapshots,approved,actor,note)
 values(k,ids,p_keep,snapshots,p_approved,auth.uid(),p_note);
end $fn$;
create function public.read_execution_duplicates(p_start date,p_end date) returns jsonb language sql security invoker set search_path=pg_catalog as $$select gaas_sfmc_private.execution_duplicates(p_start,p_end)$$;
create function public.review_execution_duplicate(p_ids uuid[],p_keep uuid,p_fingerprint text,p_approved boolean,p_note text) returns void language sql security invoker set search_path=pg_catalog as $$select gaas_sfmc_private.review_execution_duplicate(p_ids,p_keep,p_fingerprint,p_approved,p_note)$$;
revoke all on function gaas_sfmc_private.execution_duplicates(date,date),gaas_sfmc_private.review_execution_duplicate(uuid[],uuid,text,boolean,text),public.read_execution_duplicates(date,date),public.review_execution_duplicate(uuid[],uuid,text,boolean,text) from public,anon;
grant execute on function gaas_sfmc_private.execution_duplicates(date,date),gaas_sfmc_private.review_execution_duplicate(uuid[],uuid,text,boolean,text),public.read_execution_duplicates(date,date),public.review_execution_duplicate(uuid[],uuid,text,boolean,text) to authenticated;
