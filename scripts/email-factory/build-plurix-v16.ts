import {readFileSync,writeFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
import {PLURIX_V16_TEMPLATE,PLURIX_V16_TEMPLATE_ID,PLURIX_V16_TEMPLATE_NAME} from '../../src/modules/dynamic-email/fixtures/plurixV16Template';
import {opaqueEmailBackgrounds} from '../../src/modules/dynamic-email/domain/opaqueEmailBackgrounds';
import {emptyBriefingRow} from '../../src/modules/dynamic-email/domain/briefing';
import {buildSfmcExport} from '../../src/modules/dynamic-email/domain/sfmcExport';
import {plurixEnvelope} from '../../src/modules/dynamic-email/domain/sfmcEnvelope';
const out=resolve(process.argv[3]);
const rows=JSON.parse(readFileSync(join(out,'v3-before.json'),'utf8'));
if(rows.length!==24)throw Error('Esperadas 24 variacoes');
const fields=['TITULO_COPY_1_AZUL','COPY_1_PRETO','TITULO_COPY_2','COPY_2_PRETO','NOTA_LEGAL','RODAPE'];
const md5=(s:string)=>createHash('md5').update(s).digest('hex');
const patch=rows.map((b:any)=>{
 const delta:Record<string,string>={};for(const field of fields){const old=b.briefing_data[field]??'';const next=opaqueEmailBackgrounds(old);if(next!==old)delta[field]=next;}
 return {id:b.id,version:b.version,delta};
});
const updated=rows.map((b:any)=>({...b,template_slot_id:PLURIX_V16_TEMPLATE_ID,briefing_data:{...b.briefing_data,...patch.find((p:any)=>p.id===b.id).delta}}));
const sql=`-- V16: mesma composicao da V15, com fundos materializados tambem nos fragmentos.
create temporary table v16_patch on commit drop as select * from jsonb_to_recordset($patch$${JSON.stringify(patch)}$patch$::jsonb) as p(id uuid,version integer,delta jsonb);
do $guard$ begin
 if (select md5(source) from public.dynamic_email_template_slots where id='builtin-plurix-v15') is distinct from 'f53a3890fc3e18dcd469e6d05d420b50' then raise exception 'V15 mudou';end if;
 if exists(select 1 from public.dynamic_email_template_slots where id='${PLURIX_V16_TEMPLATE_ID}') then raise exception 'V16 ja existe';end if;
 if (select count(*) from public.dynamic_email_briefings b join v16_patch p on p.id=b.id where b.version=p.version and b.segment='V3 TOPO DE FUNIL DINÂMICO' and b.template_slot_id='builtin-plurix-v15')<>24 then raise exception 'V3 mudou';end if;
end $guard$;
insert into public.dynamic_email_template_slots(id,name,source,is_principal,status,version,created_by,updated_by) values('${PLURIX_V16_TEMPLATE_ID}','${PLURIX_V16_TEMPLATE_NAME}',$v16$${PLURIX_V16_TEMPLATE}$v16$,false,'active',1,null,null);
insert into public.dynamic_email_briefing_versions(briefing_id,version,snapshot,change_summary,warnings,saved_by) select b.id,b.version,to_jsonb(b),'Snapshot anterior a V16','[]'::jsonb,null from public.dynamic_email_briefings b join v16_patch p on p.id=b.id on conflict(briefing_id,version) do nothing;
update public.dynamic_email_briefings b set briefing_data=b.briefing_data||p.delta,template_slot_id='${PLURIX_V16_TEMPLATE_ID}',version=b.version+1,updated_at=now(),updated_by=null from v16_patch p where p.id=b.id;
insert into public.dynamic_email_briefing_versions(briefing_id,version,snapshot,change_summary,warnings,saved_by) select b.id,b.version,to_jsonb(b),'V16: fundos dos fragmentos preenchidos com a cor herdada; textos e composicao preservados','[]'::jsonb,null from public.dynamic_email_briefings b join v16_patch p on p.id=b.id;
update public.dynamic_email_ruler_strategies set template_slot_id='${PLURIX_V16_TEMPLATE_ID}',version=version+1,updated_at=now() where partner='Plurix' and segment='V3 TOPO DE FUNIL DINÂMICO' and template_slot_id='builtin-plurix-v15';
`;
writeFileSync(process.argv[2],sql);
writeFileSync(join(out,'v3-after-preview.json'),JSON.stringify(updated,null,2));
writeFileSync(join(out,'PLURIX_V3_CRM_V16_24_LINHAS.csv'),buildSfmcExport(updated.map((b:any)=>Object.assign(emptyBriefingRow(b.id),b.briefing_data)),{campaignType:'CRM',requireDynamicHeader:false}));
for(const ext of ['html','txt'])writeFileSync(join(out,'PLURIX_V16_CRM.'+ext),PLURIX_V16_TEMPLATE);
const e=plurixEnvelope(PLURIX_V16_TEMPLATE)!;writeFileSync(join(out,'SFMC_ASSUNTO.txt'),e.subject);writeFileSync(join(out,'SFMC_PRE_CABECALHO.txt'),e.preheader);
console.log(JSON.stringify({md5:md5(PLURIX_V16_TEMPLATE),chars:PLURIX_V16_TEMPLATE.length,patchFields:[...new Set(patch.flatMap((p:any)=>Object.keys(p.delta)))],rows:updated.length}));
