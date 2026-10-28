import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {PLURIX_V15_TEMPLATE} from '../../src/modules/dynamic-email/fixtures/plurixV15Template';
import {personalizeInvestidaCopy} from '../../src/modules/dynamic-email/domain/plurixInvestida';
import {emptyBriefingRow} from '../../src/modules/dynamic-email/domain/briefing';
import {buildSfmcExport} from '../../src/modules/dynamic-email/domain/sfmcExport';
import {plurixEnvelope} from '../../src/modules/dynamic-email/domain/sfmcEnvelope';
const out=resolve(process.argv[3]);mkdirSync(out,{recursive:true});
const rows=JSON.parse(readFileSync(join(out,'v3-before.json'),'utf8'));
if(rows.length!==24||rows.some((b:any)=>b.segment!=='V3 TOPO DE FUNIL DINÂMICO'))throw Error('Esperados 24 briefings V3');
const patch=rows.map((b:any)=>({id:b.id,version:b.version,old_copy:b.briefing_data.COPY_1_PRETO,new_copy:personalizeInvestidaCopy(b.briefing_data.COPY_1_PRETO,b.briefing_data.NM_PRODUTO_INTERNO)}));
if(patch.some((p:any)=>p.old_copy===p.new_copy||!p.new_copy.includes('%%=v(@NomeInvestida)=%%')))throw Error('Referencia da investida ausente');
const sql=`-- V15 R3: corpo HTML preservado; nome da investida via variavel governada.
create temporary table investida_patch on commit drop as select * from jsonb_to_recordset($patch$${JSON.stringify(patch)}$patch$::jsonb) as p(id uuid,version integer,old_copy text,new_copy text);
do $guard$ begin
 if (select md5(source) from public.dynamic_email_template_slots where id='builtin-plurix-v15') is distinct from '0e0e640d1f2e2496764744640a14aa0a' then raise exception 'V15 mudou desde a revisao';end if;
 if (select count(*) from public.dynamic_email_briefings b join investida_patch p on p.id=b.id where b.segment='V3 TOPO DE FUNIL DINÂMICO' and b.version=p.version and b.briefing_data->>'COPY_1_PRETO'=p.old_copy)<>24 then raise exception 'V3 mudou desde a revisao';end if;
end $guard$;
insert into public.dynamic_email_briefing_versions(briefing_id,version,snapshot,change_summary,warnings,saved_by)
select b.id,b.version,to_jsonb(b),'Snapshot anterior a V15 R3: referencia da investida','[]'::jsonb,null from public.dynamic_email_briefings b join investida_patch p on p.id=b.id on conflict(briefing_id,version) do nothing;
update public.dynamic_email_template_slots set source=$v15$${PLURIX_V15_TEMPLATE}$v15$,version=3,updated_at=now() where id='builtin-plurix-v15';
update public.dynamic_email_briefings b set briefing_data=jsonb_set(b.briefing_data,'{COPY_1_PRETO}',to_jsonb(p.new_copy)),version=b.version+1,updated_at=now(),updated_by=null from investida_patch p where p.id=b.id;
insert into public.dynamic_email_briefing_versions(briefing_id,version,snapshot,change_summary,warnings,saved_by)
select b.id,b.version,to_jsonb(b),'V15 R3: COPY_1_PRETO usa NomeInvestida derivado de PRODUTO; corpo segue HTML','[]'::jsonb,null from public.dynamic_email_briefings b join investida_patch p on p.id=b.id;
`;
writeFileSync(process.argv[2],sql);
const updated=rows.map((b:any)=>({...b,briefing_data:{...b.briefing_data,COPY_1_PRETO:patch.find((p:any)=>p.id===b.id).new_copy}}));
writeFileSync(join(out,'v3-after-preview.json'),JSON.stringify(updated,null,2));
writeFileSync(join(out,'PLURIX_V3_CRM_INVESTIDA_24_LINHAS.csv'),buildSfmcExport(updated.map((b:any)=>Object.assign(emptyBriefingRow(b.id),b.briefing_data)),{campaignType:'CRM',requireDynamicHeader:false}));
for(const ext of ['html','txt'])writeFileSync(join(out,'PLURIX_V15_CRM_R3.'+ext),PLURIX_V15_TEMPLATE);
const e=plurixEnvelope(PLURIX_V15_TEMPLATE)!;writeFileSync(join(out,'SFMC_ASSUNTO.txt'),e.subject);writeFileSync(join(out,'SFMC_PRE_CABECALHO.txt'),e.preheader);
console.log(JSON.stringify({md5:createHash('md5').update(PLURIX_V15_TEMPLATE).digest('hex'),chars:PLURIX_V15_TEMPLATE.length,briefings:updated.length}));
