import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {PLURIX_V15_TEMPLATE} from '../../src/modules/dynamic-email/fixtures/plurixV15Template';
import {plurixEnvelope} from '../../src/modules/dynamic-email/domain/sfmcEnvelope';
const original=readFileSync('supabase/migrations/20261028151825_dynamic_email_plurix_v15_v3.sql','utf8').split('$v15$')[1];
if(original.slice(0,original.indexOf('<!DOCTYPE html>'))!==PLURIX_V15_TEMPLATE.slice(0,PLURIX_V15_TEMPLATE.indexOf('<!DOCTYPE html>')))throw Error('Preparo CRM alterado');
const hash=createHash('md5').update(PLURIX_V15_TEMPLATE).digest('hex');
const sql=`-- Somente V15 revisao 2. Nao altera reguas nem briefings.
do $guard$ begin
 if (select md5(source) from public.dynamic_email_template_slots where id='builtin-plurix-v15') is distinct from '5df0e2d7a883963d45cd2cb36290826f' then raise exception 'V15 mudou desde a revisao';end if;
end $guard$;
update public.dynamic_email_template_slots set source=$v15$${PLURIX_V15_TEMPLATE}$v15$, version=2,updated_at=now() where id='builtin-plurix-v15';
`;
writeFileSync(process.argv[2],sql);
const out=resolve(process.argv[3]);mkdirSync(out,{recursive:true});
for(const ext of ['html','txt'])writeFileSync(join(out,'PLURIX_V15_CRM_R2.'+ext),PLURIX_V15_TEMPLATE);
const e=plurixEnvelope(PLURIX_V15_TEMPLATE)!;writeFileSync(join(out,'SFMC_ASSUNTO.txt'),e.subject);writeFileSync(join(out,'SFMC_PRE_CABECALHO.txt'),e.preheader);
console.log(JSON.stringify({md5:hash,chars:PLURIX_V15_TEMPLATE.length,setupUnchanged:true}));
