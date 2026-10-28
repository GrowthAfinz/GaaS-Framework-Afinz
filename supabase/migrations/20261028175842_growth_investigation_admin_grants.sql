-- Report membership is the administrative authority; generic profile labels do not revoke its scope.
insert into public.growth_investigation_access(user_id,operation_id,can_write)
select m.user_id,o.operation_id,true
from public.report_live_memberships m cross join public.growth_operations o
join public.growth_trigger_runtime_settings s on s.id='pilot'
join public.growth_trigger_runtime_config c on c.version=s.config_version and o.operation_id=any(c.operation_ids)
where m.active and m.role in ('admin','publisher')
on conflict(user_id,operation_id) do nothing;
