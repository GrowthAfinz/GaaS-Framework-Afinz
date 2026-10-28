import {writeFileSync} from 'node:fs';
import {PLURIX_V15_TEMPLATE,PLURIX_V15_TEMPLATE_ID,PLURIX_V15_TEMPLATE_NAME} from '../../src/modules/dynamic-email/fixtures/plurixV15Template';

const assets=['9a632d10-85e2-4a4e-b9c9-8b56eb0aa569','444740ce-dc51-4156-bdfa-ad0ab09a06b4','40c3316a-f124-4884-979e-9350fdb32987','32e872d2-1566-4c30-952b-4cbf9505270c'].map(id=>'https://image.contato.clubemaisamigo.com.br/lib/fe3011747364047e721773/m/1/'+id+'.png');
export const V15_HEADERS=assets;
const sql=`-- V15 e V3 sao novos registros; V2 e templates anteriores permanecem intactos.
do $guard$ begin
 if exists(select 1 from public.dynamic_email_template_slots where id='${PLURIX_V15_TEMPLATE_ID}') or exists(select 1 from public.dynamic_email_ruler_strategies where partner='Plurix' and segment='V3 TOPO DE FUNIL DINÂMICO') then raise exception 'V15/V3 ja existe; revisar antes de repetir.';end if;
 if (select md5(string_agg(id::text||':'||version::text||':'||md5(briefing_data::text),'|' order by id)) from public.dynamic_email_briefings where segment='V2 TOPO DE FUNIL DINÂMICO') is distinct from '8e96eb655888910a90eedcfaf0e94b1a' then raise exception 'V2 mudou desde a revisao';end if;
 if (select count(*) from public.dynamic_email_email_strategies where ruler_strategy_id='d2d20000-0000-4000-8000-000000000001')<>4 then raise exception 'Esperados quatro emails fonte';end if;
end $guard$;
insert into public.dynamic_email_template_slots(id,name,source,is_principal,status,version,created_by,updated_by) values ('${PLURIX_V15_TEMPLATE_ID}','${PLURIX_V15_TEMPLATE_NAME}',$v15$${PLURIX_V15_TEMPLATE}$v15$,false,'active',1,null,null);

create temporary table v15_groups on commit drop as select campaign_group_id old_id,gen_random_uuid() new_id from public.dynamic_email_email_strategies where ruler_strategy_id='d2d20000-0000-4000-8000-000000000001';
create temporary table v15_ruler on commit drop as select gen_random_uuid() id;
insert into public.dynamic_email_ruler_strategies select (jsonb_populate_record(null::public.dynamic_email_ruler_strategies,to_jsonb(r)||jsonb_build_object(
 'id',n.id,'name','V3 TOPO DE FUNIL DINÂMICO','segment','V3 TOPO DE FUNIL DINÂMICO','source_ruler_id',r.id,'template_slot_id','${PLURIX_V15_TEMPLATE_ID}',
 'description','V3 CRM: quatro headers completos publicados no Content Builder; vigencia 28/10 a 30/11/2026. Avenida conserva assinatura adicional fora da arte. Test Send pendente.',
 'editorial_status','draft','version',1,'created_at',now(),'updated_at',now(),'created_by',null,'updated_by',null))).* from public.dynamic_email_ruler_strategies r cross join v15_ruler n where r.id='d2d20000-0000-4000-8000-000000000001';

insert into public.dynamic_email_segments(technical_name,display_name,business_front,partner,bu,lifecycle_family,audience_description,origin,governance_status,created_by,updated_by)
select 'V3 TOPO DE FUNIL DINÂMICO','V3 TOPO DE FUNIL DINÂMICO','acquisition','Plurix','Plurix','Topo de Funil','Clube +amigo; campanha CRM; V15; em revisao.','planned','draft',null,null
where not exists(select 1 from public.dynamic_email_segments where technical_name='V3 TOPO DE FUNIL DINÂMICO' and partner='Plurix');

insert into public.dynamic_email_email_strategies select (jsonb_populate_record(null::public.dynamic_email_email_strategies,to_jsonb(e)||jsonb_build_object(
 'id',gen_random_uuid(),'ruler_strategy_id',r.id,'campaign_group_id',g.new_id,'segment','V3 TOPO DE FUNIL DINÂMICO',
 'technical_status','needs_review','editorial_status','draft','visual_status','needs_review','certification_status','not_tested','version',1,'created_at',now(),'updated_at',now(),'created_by',null,'updated_by',null,
 'updated_by_type','system','update_source','gaas','change_reason','V2 clonada para V3 CRM com header rasterizado e template V15',
 'field_provenance',e.field_provenance||jsonb_build_object('v3_source_email_strategy_id',e.id)))).* from public.dynamic_email_email_strategies e join v15_groups g on g.old_id=e.campaign_group_id cross join v15_ruler r;

insert into public.dynamic_email_briefings select (jsonb_populate_record(null::public.dynamic_email_briefings,to_jsonb(b)||jsonb_build_object(
 'id',n.id,'campaign_group_id',g.new_id,'segment','V3 TOPO DE FUNIL DINÂMICO','template_slot_id','${PLURIX_V15_TEMPLATE_ID}',
 'status','draft','version',1,'journey_confirmed',false,'acknowledged_missing_activity',false,'activity_names','[]'::jsonb,'created_at',now(),'updated_at',now(),'created_by',null,'updated_by',null,
 'import_source',jsonb_build_object('kind','v2_clone_v15','source_briefing_id',b.id,'source_version',b.version),
 'briefing_data',b.briefing_data||jsonb_build_object('__id',n.id,'__journeyConfirmed',false,'TP_CAMPANHA','CRM','DT_INICIO','2026-10-28T00:00','DT_FIM','2026-11-30T23:59','HEADER',
 case b.briefing_data->>'SEQUENCIA' ${assets.map((url,i)=>`when 'E-mail ${i+1}' then '${url}'`).join(' ')} else null end)))).*
from public.dynamic_email_briefings b join v15_groups g on g.old_id=b.campaign_group_id cross join lateral (select gen_random_uuid() id where b.id is not null) n;

do $verify$ begin
 if (select count(*) from public.dynamic_email_briefings where segment='V3 TOPO DE FUNIL DINÂMICO')<>24 then raise exception 'Esperadas 24 variacoes V3';end if;
 if exists(select 1 from public.dynamic_email_briefings where segment='V3 TOPO DE FUNIL DINÂMICO' and (briefing_data->>'HEADER' is null or briefing_data->>'TP_CAMPANHA'<>'CRM')) then raise exception 'V3 incompleta';end if;
end $verify$;
`;
if(process.argv[2]){writeFileSync(process.argv[2],sql);console.log(process.argv[2]);}
