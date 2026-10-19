-- Completing approval must also resolve exact activity usages when the pack lacked af_sub3.
create or replace function gaas_sfmc_private.refresh_approved_proposal_links()
returns trigger language plpgsql security definer set search_path=pg_catalog,public as $$
declare message jsonb;
begin
 select m.payload into message from public.sfmc_package_messages m where m.id=new.message_id;
 update public.activities a set template_id=a.template_id where a.template_id is null
 and btrim(a."Activity name / Taxonomia")=btrim(message->>'activity_name')
 and a."Canal"=message->'content'->>'channel'
 and regexp_replace(upper(btrim(a.jornada)),'^JOR_AQUISICAO_','JOR_AQS_')=regexp_replace(upper(btrim(message->>'journey_name')),'^JOR_AQUISICAO_','JOR_AQS_');
 return new;
end $$;
revoke all on function gaas_sfmc_private.refresh_approved_proposal_links() from public,anon,authenticated;
create trigger approved_proposal_auto_links after update of status on public.communications_reconciliation_proposals
 for each row when(new.status='applied' and old.status is distinct from new.status)
 execute function gaas_sfmc_private.refresh_approved_proposal_links();
