import { writeFileSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { PLURIX_V13_TEMPLATE } from '../../src/modules/dynamic-email/fixtures/plurixV13Template';
import { PLURIX_V14_TEMPLATE, PLURIX_V14_TEMPLATE_ID, PLURIX_V14_TEMPLATE_NAME } from '../../src/modules/dynamic-email/fixtures/plurixV14Template';
const md5=(value:string)=>createHash('md5').update(value).digest('hex');
const expected='d93d83a35b7e45d7c8cb0a976351cba2';
if(md5(PLURIX_V13_TEMPLATE)!==expected)throw new Error('V13 local diverge do snapshot operacional de 27/10/2026');
const current=md5(PLURIX_V14_TEMPLATE);
const sql=`-- V14 revisão 2: preserva tema claro no corpo, cards e rodapé.
do $verify$
begin
  if (select md5(source) from public.dynamic_email_template_slots where id='builtin-plurix-v13') is distinct from '${expected}' then
    raise exception 'V13 mudou desde a auditoria. Reconciliar antes de publicar V14.';
  end if;
  if (select md5(source) from public.dynamic_email_template_slots where id='builtin-plurix-v14') not in ('be4c15d7e76d6befe55507d4271556f2', '${current}') then
    raise exception 'V14 mudou desde a auditoria. Reconciliar antes de atualizar.';
  end if;
end $verify$;

update public.dynamic_email_template_slots
set name='${PLURIX_V14_TEMPLATE_NAME}', source=$v14$${PLURIX_V14_TEMPLATE}$v14$, version=2, status='active'
where id='${PLURIX_V14_TEMPLATE_ID}';
`;
const path='supabase/migrations/20261027184742_dynamic_email_plurix_v14_light_only.sql';
if(process.argv.includes('--check')){if(readFileSync(path,'utf8')!==sql)throw new Error('Migration diverge da fixture');}
else writeFileSync(path,sql);
console.log(JSON.stringify({id:PLURIX_V14_TEMPLATE_ID,md5:md5(PLURIX_V14_TEMPLATE),length:PLURIX_V14_TEMPLATE.length,path}));
