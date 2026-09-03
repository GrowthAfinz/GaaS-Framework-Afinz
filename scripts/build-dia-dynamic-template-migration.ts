import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { DIA_CRM_DYNAMIC_TEMPLATE, DIA_CRM_DYNAMIC_TEMPLATE_ID } from '../src/modules/dynamic-email/fixtures/diaCrmDynamicTemplate';

const quote = (value: string) => `$dia$${value}$dia$`;
const output = process.argv[2] ?? join('supabase', 'migrations', '20260903190000_dia_crm_dynamic_template_v1.sql');
const sql = `begin;

insert into public.dynamic_email_template_slots
  (id, name, source, is_principal, status, version, created_by, updated_by)
values
  (${quote(DIA_CRM_DYNAMIC_TEMPLATE_ID)}, ${quote('DIA CRM - Régua dinâmica v1')}, ${quote(DIA_CRM_DYNAMIC_TEMPLATE)}, false, 'active', 1, null, null)
on conflict (id) do update set
  name = excluded.name,
  source = excluded.source,
  status = 'active',
  version = public.dynamic_email_template_slots.version + 1,
  updated_at = now();

update public.dynamic_email_briefings
set template_slot_id = ${quote(DIA_CRM_DYNAMIC_TEMPLATE_ID)},
    version = version + 1,
    updated_at = now()
where lower(partner) = 'dia'
  and upper(segment) = 'CRM'
  and briefing_data->>'NM_PRODUTO_INTERNO' = 'DIA';

do $$
declare affected integer;
begin
  select count(*) into affected
  from public.dynamic_email_briefings
  where lower(partner) = 'dia'
    and upper(segment) = 'CRM'
    and briefing_data->>'NM_PRODUTO_INTERNO' = 'DIA'
    and template_slot_id = ${quote(DIA_CRM_DYNAMIC_TEMPLATE_ID)};
  if affected <> 8 then
    raise exception 'DIA template assignment expected 8 briefings, got %', affected;
  end if;
end $$;

commit;
`;

mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, sql, 'utf8');
console.log(output);
