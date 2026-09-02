import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PLURIX_V9_TEMPLATE, PLURIX_V9_TEMPLATE_ID, PLURIX_V9_TEMPLATE_NAME } from '../src/modules/dynamic-email/fixtures/plurixV9Template';

const migrationPath = resolve(process.cwd(), 'supabase/migrations/20260902165400_create_plurix_v9_template.sql');
const delimiter = '$plurix_v9$';
if (PLURIX_V9_TEMPLATE.includes(delimiter)) throw new Error('Migration delimiter occurs inside V9 source.');

const sql = `-- Preserve Plurix V8 recovery and restore the E-mail 2 full-width benefit hierarchy.
-- Previous versions remain active for controlled comparison and rollback.
insert into public.dynamic_email_template_slots (
  id, name, source, is_principal, status, version, created_by, updated_by
)
values (
  '${PLURIX_V9_TEMPLATE_ID}',
  '${PLURIX_V9_TEMPLATE_NAME}',
  ${delimiter}${PLURIX_V9_TEMPLATE}${delimiter},
  false,
  'active',
  1,
  null,
  null
)
on conflict (id) do update set
  name = excluded.name,
  source = excluded.source,
  status = 'active',
  version = public.dynamic_email_template_slots.version + 1,
  updated_at = now();

-- The legacy helper updates all rows in one statement and conflicts with the
-- one-principal partial unique index. Clear first, then promote atomically.
update public.dynamic_email_template_slots
set is_principal = false, updated_at = now()
where is_principal = true and id <> '${PLURIX_V9_TEMPLATE_ID}';

update public.dynamic_email_template_slots
set is_principal = true, updated_at = now()
where id = '${PLURIX_V9_TEMPLATE_ID}' and status = 'active';
`;

writeFileSync(migrationPath, sql, 'utf8');
console.log(migrationPath);
