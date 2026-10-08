import {describe,it,expect} from 'vitest';
import {executionTemplateEvidence,executionContextKey} from './executionTemplateMatch';
import {allowsRepescagemReuse} from './communicationReuse';
import {orchestrateCommunication,type FrameworkActivity} from './communicationOrchestrator';
import type {ProposalRow} from '../services/communicationProposalService';
import type {CatalogEntry} from '../hooks/useReconciliation';
const a=(patch:Partial<FrameworkActivity>={})=>({id:'a',jornada:'JOR_AQS_BB_ANC_TEST','Activity name / Taxonomia':'afz_car_bbt_aqs_wpp_anc_menordispvibe3_pontual',Canal:'WhatsApp',BU:'B2B2C',Parceiro:'Bem Barato',Segmento:'Aprovados_nao_convertidos',Subgrupos:'Diario',Oferta:'Vibe',Promocional:'Padrao',...patch} as FrameworkActivity);
const p=(id='bb_wpp_vibe_ngd_D3')=>({proposed_template_id:id,status:'review',message:{payload:{paths:[],journey_name:a().jornada,activity_name:a()['Activity name / Taxonomia'],content:{channel:'WhatsApp',body_text:'Mensagem'},utm:{c:'repescagem_vibe',af_sub1:'negados',af_sub2:'d3',af_sub3:id}}}} as unknown as ProposalRow);
const cat=(id='bb_wpp_vibe_ngd_D3')=>[{id,channel:'WhatsApp',dims:{segmento:'negados'},raw:{metadata:{}}}] as CatalogEntry[];
describe('execution / template reconciliation',()=>{
 it('keeps ANC audience and permits intentional menor reuse without a segment conflict',()=>{
   expect(allowsRepescagemReuse(a()['Activity name / Taxonomia'],a().Segmento)).toBe(true);
   const o=orchestrateCommunication(p(),[a()],[],cat());
   expect(o.fields.segment.value).toBe('Aprovados_nao_convertidos');expect(o.fields.segment.conflict).toBe(false);
   expect(o.fields.reuse.value).toContain('Repescagem');expect(o.fields.campaign.conflict).toBe(false);
 });
 it('does not grant the exception to maior or misclassified Negados',()=>{
   expect(allowsRepescagemReuse(a()['Activity name / Taxonomia'].replace('menor','maior'),a().Segmento)).toBe(false);
   expect(allowsRepescagemReuse(a()['Activity name / Taxonomia'],'Negados')).toBe(false);
   const proposal=p();proposal.message.payload.activity_name=proposal.message.payload.activity_name.replace('menor','maior');
   expect(orchestrateCommunication(proposal,[a({'Activity name / Taxonomia':proposal.message.payload.activity_name})],[],cat()).fields.segment.conflict).toBe(true);
 });
 it('uses the exact pack and keeps reused piece ordinal independent from activity',()=>{
   const row=a({'Activity name / Taxonomia':'afz_car_bbt_aqs_wpp_anc_menordispvibe4_pontual'}),proposal=p();proposal.message.payload.activity_name=row['Activity name / Taxonomia'];
   const e=executionTemplateEvidence(row,[proposal],[],cat());expect(e.ids).toEqual(['bb_wpp_vibe_ngd_D3']);expect(e.source).toBe('pack');expect(orchestrateCommunication(proposal,[row],[],cat()).moment.dispatch).toBe(4);
 });
 it('does not merge same Activity Names across journey/channel/context',()=>{
   expect(executionContextKey(a())).not.toBe(executionContextKey(a({jornada:'OTHER'})));
   expect(executionContextKey(a())).not.toBe(executionContextKey(a({Canal:'SMS'})));
   expect(executionTemplateEvidence(a({jornada:'OTHER'}),[p()],[],cat()).source).toBe('none');
 });
 it('blocks batch eligibility for conflicting IDs, content versions and incomplete links',()=>{
   const one=p(),two=p('other');expect(executionTemplateEvidence(a(),[one,two],[],cat()).conflicts.join()).toContain('IDs concorrentes');
   const version=p();version.message.payload.content.body_text='Outra mensagem';expect(executionTemplateEvidence(a(),[one,version],[],cat()).versions).toBe(2);
   const missing=p();missing.message.payload.utm.c=null;expect(executionTemplateEvidence(a(),[missing],[],cat()).conflicts.join()).toContain('parametrização');
 });
 it('historical reuse respects partner/channel/offer and remains reviewable',()=>{
   const h=a({jornada:'OTHER',Segmento:'Negados',template_id:'bb_wpp_vibe_ngd_D3'});
   const e=executionTemplateEvidence(a(),[],[h],cat());expect(e.ids).toEqual(['bb_wpp_vibe_ngd_D3']);expect(e.conflicts.length).toBeGreaterThan(0);
   expect(executionTemplateEvidence(a({Parceiro:'Serasa'}),[],[h],cat()).ids).toEqual([]);
 });
});
