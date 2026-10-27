import { writeFileSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { PLURIX_V13_TEMPLATE } from '../../src/modules/dynamic-email/fixtures/plurixV13Template';
import { PLURIX_V14_TEMPLATE, PLURIX_V14_TEMPLATE_ID, PLURIX_V14_TEMPLATE_NAME } from '../../src/modules/dynamic-email/fixtures/plurixV14Template';
const md5=(value:string)=>createHash('md5').update(value).digest('hex');
const expected='d93d83a35b7e45d7c8cb0a976351cba2';
if(md5(PLURIX_V13_TEMPLATE)!==expected)throw new Error('V13 local diverge do snapshot operacional de 27/10/2026');
const sql=`-- V14 candidata. Preserva principal, V13 e todos os briefings.
do $verify$
begin
  if (select md5(source) from public.dynamic_email_template_slots where id='builtin-plurix-v13') is distinct from '${expected}' then
    raise exception 'V13 mudou desde a auditoria. Reconciliar antes de publicar V14.';
  end if;
end $verify$;

insert into public.dynamic_email_template_slots (id,name,source,is_principal,status,version)
values ('${PLURIX_V14_TEMPLATE_ID}', '${PLURIX_V14_TEMPLATE_NAME}', $v14$${PLURIX_V14_TEMPLATE}$v14$, false, 'active', 1)
on conflict (id) do update set name=excluded.name,source=excluded.source,is_principal=false,status='active',version=1;

insert into public.dynamic_email_assets (name,external_url,slot,bu,partner,product,alt_text,tags,status,version)
values ('Logo +amigo branco: topo V14', 'https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/c460d98e-264a-4f75-940f-d62d6b40dabf.png', 'header_logo', 'Plurix', 'Plurix', '+amigo', '+amigo', array['header-dinamico','logo','v14'], 'ready', 1)
on conflict (external_url) do nothing;
`;
const path='supabase/migrations/20261027155015_dynamic_email_plurix_v14_dark_mode.sql';
if(process.argv.includes('--check')){if(readFileSync(path,'utf8')!==sql)throw new Error('Migration diverge da fixture');}
else writeFileSync(path,sql);
console.log(JSON.stringify({id:PLURIX_V14_TEMPLATE_ID,md5:md5(PLURIX_V14_TEMPLATE),length:PLURIX_V14_TEMPLATE.length,path}));
