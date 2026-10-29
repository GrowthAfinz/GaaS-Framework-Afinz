import {readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {PLURIX_V16_R2_TEMPLATE as PLURIX_V16_TEMPLATE,PLURIX_V16_BASE_TEMPLATE} from '../../src/modules/dynamic-email/fixtures/plurixV16Template';
import {emptyBriefingRow} from '../../src/modules/dynamic-email/domain/briefing';
import {buildSfmcExport} from '../../src/modules/dynamic-email/domain/sfmcExport';
import {plurixEnvelope} from '../../src/modules/dynamic-email/domain/sfmcEnvelope';
const out=resolve(process.argv[2]);
const before=JSON.parse(readFileSync(join(out,'v3-before.json'),'utf8'));
if(before.length!==24)throw Error('Expected 24 V3 briefings');
const amigao=before.find((b:any)=>b.briefing_data.NM_PRODUTO_INTERNO==='AMIGAO').briefing_data;
const patch=before.map((b:any)=>{
 const old=b.briefing_data.COPY_1_PRETO;
 const next=old.replace(/\b(do|no) %%=v\(@NomeInvestida\)=%%/g,'$1 supermercado %%=v(@NomeInvestida)=%%');
 if(next===old||(next.match(/supermercado %%=v\(@NomeInvestida\)=%%/g)||[]).length!==1)throw Error('Copy anchor changed: '+b.id);
 const delta:Record<string,string>={COPY_1_PRETO:next};
 if(['COMPRE MAIS','SUPERPAO'].includes(b.briefing_data.NM_PRODUTO_INTERNO)){
  delta.BANNER_3_CORPO=amigao.BANNER_3_CORPO;delta.LINK_BANNER_3_CORPO=amigao.LINK_BANNER_3_CORPO;
 }
 return {id:b.id,version:b.version,old,next,delta};
});
const after=before.map((b:any)=>({...b,version:b.version+1,briefing_data:{...b.briefing_data,...patch.find((p:any)=>p.id===b.id).delta}}));
const quote=(s:string)=>"'"+s.split("'").join("''")+"'";
const sql=`-- V16 R2: table-based tracked CTAs, native unsubscribe, supermarket wording.
create temporary table v16_r2_patch(id uuid,version integer,old text,delta jsonb) on commit drop;
insert into v16_r2_patch values ${patch.map((p:any)=>`('${p.id}'::uuid,${p.version},${quote(p.old)},${quote(JSON.stringify(p.delta))}::jsonb)`).join(',\n')};
do $guard$ begin
 if (select md5(source) from public.dynamic_email_template_slots where id='builtin-plurix-v16') is distinct from '${createHash('md5').update(PLURIX_V16_BASE_TEMPLATE).digest('hex')}' then raise exception 'V16 source changed';end if;
 if (select count(*) from public.dynamic_email_briefings b join v16_r2_patch p on p.id=b.id where b.version=p.version and b.briefing_data->>'COPY_1_PRETO'=p.old and b.segment='V3 TOPO DE FUNIL DINÂMICO' and b.template_slot_id='builtin-plurix-v16')<>24 then raise exception 'V3 briefings changed';end if;
end $guard$;
update public.dynamic_email_template_slots set source=$v16r2$${PLURIX_V16_TEMPLATE}$v16r2$,version=version+1,updated_at=now(),updated_by=null where id='builtin-plurix-v16';
insert into public.dynamic_email_briefing_versions(briefing_id,version,snapshot,change_summary,warnings,saved_by) select b.id,b.version,to_jsonb(b),'Anterior a V16 R2','[]'::jsonb,null from public.dynamic_email_briefings b join v16_r2_patch p on p.id=b.id on conflict(briefing_id,version) do nothing;
update public.dynamic_email_briefings b set briefing_data=b.briefing_data||p.delta,version=b.version+1,updated_at=now(),updated_by=null from v16_r2_patch p where p.id=b.id;
insert into public.dynamic_email_briefing_versions(briefing_id,version,snapshot,change_summary,warnings,saved_by) select b.id,b.version,to_jsonb(b),'V16 R2: supermercado antes do nome; assinatura Amigao nas adquiridas; checks preservados','[]'::jsonb,null from public.dynamic_email_briefings b join v16_r2_patch p on p.id=b.id;
`;
const migration=readdirSync('supabase/migrations').filter(f=>f.endsWith('_plurix_v16_table_buttons_unsubscribe.sql')).sort().pop();if(!migration)throw Error('Create migration using Supabase CLI first');
writeFileSync(join('supabase/migrations',migration),sql);
writeFileSync(join(out,'apply.sql'),sql);
writeFileSync(join(out,'v3-after-preview.json'),JSON.stringify(after,null,2));
for(const ext of ['html','txt'])writeFileSync(join(out,'PLURIX_V16_R2_CRM.'+ext),PLURIX_V16_TEMPLATE);
writeFileSync(join(out,'PLURIX_V3_CRM_V16_R2_24_LINHAS.csv'),buildSfmcExport(after.map((b:any)=>Object.assign(emptyBriefingRow(b.id),b.briefing_data)),{campaignType:'CRM',requireDynamicHeader:false}));
const envelope=plurixEnvelope(PLURIX_V16_TEMPLATE)!;
writeFileSync(join(out,'SFMC_ASSUNTO.txt'),envelope.subject);writeFileSync(join(out,'SFMC_PRE_CABECALHO.txt'),envelope.preheader);
const manifest={template:'builtin-plurix-v16',revision:2,md5:createHash('md5').update(PLURIX_V16_TEMPLATE).digest('hex'),chars:PLURIX_V16_TEMPLATE.length,rows:24,migration,changedBriefingFields:['COPY_1_PRETO','BANNER_3_CORPO','LINK_BANNER_3_CORPO'],signatureAliases:{'COMPRE MAIS':'Amigão',SUPERPAO:'Amigão'},sfmcCertified:false};
writeFileSync(join(out,'manifest.json'),JSON.stringify(manifest,null,2));console.log(JSON.stringify(manifest));
