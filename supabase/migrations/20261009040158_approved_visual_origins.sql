-- A transport projection, not a content/version mutation. Ambiguous origins stay excluded.
create function public.read_approved_visual_origins() returns jsonb language sql stable security invoker set search_path=pg_catalog,public as $$
select coalesce(jsonb_agg(item),'[]'::jsonb) from (
 select jsonb_build_object('content_id',o.content_id,'origin',(jsonb_agg(jsonb_build_object('snapshot_id',s.id,'occurrence_key',m.payload->>'occurrence_key') order by o.observed_at,o.message_id)->0)) item
 from public.communication_template_content_observations o
 join public.communication_template_contents c on c.id=o.content_id and c.payload->>'channel'='E-mail'
 join public.sfmc_package_messages m on m.id=o.message_id
 join public.sfmc_journey_snapshots s on s.import_id=m.import_id and exists(select 1 from jsonb_array_elements(s.messages) sm where sm->>'occurrence_key'=m.payload->>'occurrence_key')
 left join public.sfmc_visual_messages v on v.import_id=m.import_id and v.occurrence_key=m.payload->>'occurrence_key'
 where (select auth.uid()) is not null
 group by o.content_id
 having count(*)=count(v.html) and count(distinct m.import_id)=1 and count(distinct v.html)=1
) verified;
$$;
revoke all on function public.read_approved_visual_origins() from public,anon;
grant execute on function public.read_approved_visual_origins() to authenticated,service_role;
