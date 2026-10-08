import {describe,it,expect} from 'vitest';
import {parseJornadaIdentity,resolveDim,parseSeq} from './taxonomy';
import {runReconciliationGoldenSet} from './taxonomy.goldenset';
import {orchestrateCommunication,type FrameworkActivity} from './communicationOrchestrator';
import type {ProposalRow} from '../services/communicationProposalService';
const row=()=>({id:'p',proposed_template_id:'b2c_car21_vibe_srsa_DispD2',resolved_context:{partner:'Serasa',segment:'Abandonados',subgroup:'21D',campaign:'Vibe'},message:{payload:{journey_name:'JOR_AQS_B2C_PROPRI_ABD_CARRINHO21D_PADRAO_21DIAS_SET26',activity_name:'carrinho21dserasa',content:{channel:'WhatsApp'},paths:[],utm:{}}}} as unknown as ProposalRow);
const activity=(patch:Partial<FrameworkActivity>={})=>({id:'a',jornada:row().message.payload.journey_name,'Activity name / Taxonomia':'carrinho21dserasa',Canal:'WhatsApp',BU:'B2C',Parceiro:'Serasa',Segmento:'Abandonados',Oferta:'Padrao',Promocional:'Vibe','Base Total':100,'Base Acionável':80,'Data de Disparo':'2026-09-24T03:00:00Z',...patch} as FrameworkActivity);
describe('communication orchestration',()=>{
 it('preserves the historical matcher golden set and recognizes Vibe and AQS',()=>{expect(runReconciliationGoldenSet().failed).toBe(0);expect(resolveDim('campanha','b2c_email_vibe_bsp_S1D01')).toBe('vibe');expect(parseJornadaIdentity('JOR_AQS_B2B2C_DIA_CRM_TEST').segmento).toBe('crm');});
 it('isolates execution metrics by journey and channel, leaving other contexts visible',()=>{const o=orchestrateCommunication(row(),[activity(),activity({id:'b',jornada:'OUTRA','Base Total':900}),activity({id:'c',Canal:'SMS','Base Total':800})],[],[]);expect(o.base).toBe(100);expect(o.actionable).toBe(80);expect(o.exec).toBe(1);expect(o.otherContexts).toBe(2);});
 it('preserves null and limits metrics using São Paulo dates',()=>{const o=orchestrateCommunication(row(),[activity({'Base Total':null}),activity({id:'b','Data de Disparo':'2026-09-25T01:00:00Z'})],[],[],{start:'2026-09-24',end:'2026-09-24'});expect(o.exec).toBe(2);expect(o.base).toBeNull();expect(o.actionable).toBe(160);});
 it('keeps offer and promotional separate and flags Serasa versus proprietary',()=>{const o=orchestrateCommunication(row(),[activity({Parceiro:'Proprietaria',Promocional:'Copa'})],[],[]);expect(o.fields.offer.value).toBe('Padrão');expect(o.fields.campaign.value).toBe('Copa');expect(o.fields.partner.conflict).toBe(true);expect(o.fields.campaign.conflict).toBe(false);expect(o.fields.segment.value).toBe('Abandonados');});
 it('does not treat 21D as dispatch 21, order zero or midnight as established moment',()=>{const r=row();r.message.payload.activity_name='afz_car_srs_aqs_wpp_car_disp21vibeecred_pontual';const o=orchestrateCommunication(r,[activity({'Activity name / Taxonomia':r.message.payload.activity_name,'Ordem de disparo':0,'Horário de Disparo':'00:00:00'})],[],[]);expect(o.moment.dispatch).toBe(2);expect(o.moment.confidence).toBe('alta');expect(o.moment.label).toBe('Disparo 2');expect(o.moment.reasons.join(' ')).toMatch(/ambíguo/);expect(o.moment.reasons.join(' ')).toMatch(/Ordem 0/);});
 it('uses scoped manual moment before ID suggestion',()=>{const r=row();const o=orchestrateCommunication(r,[],[{id:'s',journey_name:r.message.payload.journey_name,activity_name:r.message.payload.activity_name,channel:'WhatsApp',metadata:{moment_suggestion:{source:'manual',enabled:true,dispatch:3,week:2,label:'Semana 2 · Disparo 3'}}}],[]);expect(o.moment.dispatch).toBe(3);expect(o.moment.week).toBe(2);expect(o.moment.confidence).toBe('manual');});
 it('keeps a contradictory ID subgroup explicit without inventing a family field',()=>{const r=row();r.proposed_template_id='b2c_carsab_vibe_inst_DispD1';const o=orchestrateCommunication(r,[activity({Subgrupos:'Abandonados D-21 A D>7'})],[],[]);expect(o.fields.family).toBeUndefined();expect(o.fields.subgroup.conflict).toBe(true);expect(o.fields.partner.conflict).toBe(true);expect(o.templateParts).toContainEqual({label:'Variante',value:'Institucional'});expect(o.templateParts).toContainEqual({label:'Índice do template',value:'D1'});});
 it('prioritizes activities dimensions and compares offer and promotional independently',()=>{const r=row();r.message.payload.utm={af_sub1:'crm',c:'topo_vibe',af_sub2:'s1',af_sub3:'dia_email_vibe_bsp_S1D01'};r.proposed_template_id=r.message.payload.utm.af_sub3!;r.message.payload.content.channel='E-mail';const o=orchestrateCommunication(r,[activity({Canal:'E-mail',Segmento:'Base Proprietária',Promocional:'Copa'})],[],[]);expect(o.fields.segment.value).toBe('Base Proprietária');expect(o.fields.segment.conflict).toBe(true);expect(o.fields.campaign.value).toBe('Copa');expect(o.fields.campaign.conflict).toBe(false);expect(o.fields.offer.value).toBe('Padrão');expect(o.fields.offer.conflict).toBe(true);expect(o.moment.label).toBe('Semana 1 · Disparo 1');});
 it('separates DispD2 from tracking d1 and rejects date/recency orders',()=>{const r=row();r.message.payload.utm={af_sub1:'abandonados',c:'carrinho_vibe',af_sub2:'d1',af_sub3:r.proposed_template_id};for(const order of [21,31,20260917]){const o=orchestrateCommunication(r,[activity({'Ordem de disparo':order,Subgrupos:'Diario'})],[],[]);expect(o.moment.label).toBe('Disparo 2');expect(o.conflicts.join(' ')).toMatch(/af_sub2/);expect(o.fields.subgroup.value).toBe('Diário');expect(o.fields.subgroup.conflict).toBe(true);}});
 it('labels Negados Dn as a touch, not a calendar day',()=>{const r=row();r.message.payload.utm={af_sub1:'negados',c:'repescagem_vibe',af_sub2:'d1',af_sub3:'b2c_wpp_vibe_ngd_D1'};r.proposed_template_id=r.message.payload.utm.af_sub3!;expect(orchestrateCommunication(r,[],[],[]).moment.label).toBe('Disparo 1');});
 it('preserves dispatch boundaries and verifies the 21D subgroup from activities',()=>{
  const r=row();r.proposed_template_id='b2c_car_copa_inst_Dispd1_21d';r.message.payload.utm={af_sub3:r.proposed_template_id};
  const o=orchestrateCommunication(r,[activity({Subgrupos:'Abandonados D-21 A D>7',Parceiro:'Proprietaria',Oferta:'Padrao',Promocional:'Copa'})],[],[]);
  expect(parseSeq(r.proposed_template_id)).toBe('D1');expect(o.moment.dispatch).toBe(1);expect(o.moment.confidence).toBe('alta');expect(o.fields.subgroup.value).toBe('D-21 A D>7');expect(o.fields.subgroup.conflict).toBe(false);expect(o.fields.segment.value).toBe('Abandonados');
 });
 it('accepts Vibe offer with standard promotional and keeps Saturday under D-7',()=>{
  const r=row();r.proposed_template_id='b2c_carsab_vibe_srsa_Dispd1';r.message.payload.utm={af_sub3:r.proposed_template_id,c:'carrinho_vibe'};
  const o=orchestrateCommunication(r,[activity({Subgrupos:'Abandonados D-7',Oferta:'Vibe',Promocional:'Padrao'})],[],[]);
  expect(o.fields.offer.value).toBe('Vibe');expect(o.fields.offer.conflict).toBe(false);expect(o.fields.campaign.value).toBe('Padrão');expect(o.fields.campaign.conflict).toBe(false);expect(o.fields.subgroup.value).toBe('D-7');expect(o.fields.subgroup.conflict).toBe(false);
 });
 it('does not reclassify Diário from a 21D journey name, nor infer subgroups without sources',()=>{
  const r=row();r.proposed_template_id='b2c_car_vibe_srsa_Dispd1';
  expect(orchestrateCommunication(r,[activity({Subgrupos:'Diario'})],[],[]).fields.subgroup.value).toBe('Diário');
  expect(orchestrateCommunication(r,[],[],[]).fields.subgroup.value).toBe('Não identificado');
 });
 it('retains token boundaries in week/day and date-suffixed dispatch IDs',()=>{
  expect(parseSeq('b2c_email_vibe_bsp_S1D01_21d')).toBe('S1D01');
  expect(parseSeq('afz_car_vis_aqs_email_bsp_disp3s4vibe_pontual')).toBe('S4D03');
  expect(parseSeq('disp3_20260917')).toBe('D3');expect(parseSeq('Dispd2_7d')).toBe('D2');expect(parseSeq('b2c_wpp_vibe_ngd_D1_21d')).toBe('D1');expect(parseSeq('afz_car_vis_wpp_d3ecredcopa_diario')).toBe('D3');
 });

});
