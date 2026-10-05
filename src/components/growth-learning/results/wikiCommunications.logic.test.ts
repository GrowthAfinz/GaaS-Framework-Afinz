import { describe,it,expect } from 'vitest';
import { assetReferences,configuredPieces,journeySteps,linkedPieces,safeAssetUrl,type FactoryAsset,type Slot } from './wikiCommunications.logic';
import { EMPTY_SCOPE,type ResultRow } from './results.types';
import type { CommunicationTemplate } from '../../../types/communication';
const row=(p:Partial<ResultRow>={}):ResultRow=>({id:'1',date:'2026-06-01',domain:'crm',...EMPTY_SCOPE,bu:'B2C',partner:'Serasa',segment:'Abandonados',channel:'SMS',journey:'J1',stage:'Aquisição',safra:'2026-06',campaignLabel:'',title:'EXECUTION',primary:10,secondary:100,spend:50,conversions:null,duplicateKey:'1',mapped:true,dimensions:{template:'T1',order:'2',product:'Classic'},...p});
const template={template_id:'T1',title:'Peça',channel:'SMS',status:'active',original_path:null} as CommunicationTemplate;
const slot={id:'S1',journey_name:'J1',activity_name:'EXECUTION',channel:'SMS',current_template_id:'T1',lifecycle_status:'active'} as Slot;
const asset={id:'A1',name:'Asset',external_url:'https://example.com/image.png',partner:'Serasa',bu:'B2C',segment:'Abandonados',subgroup:null,product:'Classic',status:'ready',slot:'header',version:1,alt_text:''} as FactoryAsset;
describe('Wiki communication evidence',()=>{
 it('only joins a used piece by an explicit template identity, retaining a missing catalog',()=>{
  expect(linkedPieces([row({dimensions:{}})],[template])).toEqual([]);
  const pieces=linkedPieces([row(),row({id:'2'})],[]);expect(pieces).toHaveLength(1);expect(pieces[0].rows).toHaveLength(2);expect(pieces[0].template).toBeUndefined();
 });
 it('configuration requires exact execution, journey and channel and never becomes used evidence',()=>{
  expect(configuredPieces([row()],[slot],[template])[0].rows).toEqual([]);
  for(const change of [{activity_name:'OTHER'},{journey_name:'J2'},{channel:'E-mail'},{lifecycle_status:'retired'}])expect(configuredPieces([row()],[{...slot,...change}],[template])).toEqual([]);
 });
 it('does not treat blank dimensions or a different partner as compatibility',()=>{
  const scope={...EMPTY_SCOPE,bu:'B2C',partner:'Serasa',segment:'Abandonados'};
  expect(assetReferences([{...asset,partner:null,segment:null}],scope,[row()])).toEqual([]);
  expect(assetReferences([{...asset,partner:'Plurix'}],scope,[row()])).toEqual([]);
  expect(assetReferences([{...asset,bu:'B2B2C'}],scope,[row()])).toEqual([]);
 });
 it('marks a broader same-partner reference with mismatched audience for validation',()=>{
  const pieces=assetReferences([{...asset,segment:'CRM'}],{...EMPTY_SCOPE,partner:'Serasa',segment:'Abandonados'},[row()]);
  expect(pieces[0].reason).toContain('validar público');expect(pieces[0].rows).toEqual([]);
  expect(assetReferences([{...asset,status:'draft'}],EMPTY_SCOPE,[row()])).toEqual([]);
  expect(assetReferences([asset],{...EMPTY_SCOPE,channel:'WhatsApp'},[row()])).toEqual([]);
  expect(assetReferences([asset],{...EMPTY_SCOPE,bu:'B2C',partner:'Serasa',segment:'Abandonados'},[])[0].reason).toContain('confirmar produto');
 });
 it('preserves variants, subgroup and safra rather than manufacturing a single journey',()=>{
  expect(journeySteps([row(),row({id:'2',safra:'2026-07'}),row({id:'3',subgroup:'A'})])).toHaveLength(3);
  const steps=journeySteps([row({dimensions:{order:'D0'}}),row({id:'2',dimensions:{order:'1'}})]);expect(steps[0].order).toBe(1);expect(steps[1].order).toBeNull();
  expect(journeySteps([row({dimensions:{order:'0'}})])[0].order).toBeNull();
 });
 it('rejects executable and insecure asset URLs',()=>{
  for(const url of ['javascript:alert(1)','data:image/png;base64,x','http://example.com/a','/a.png'])expect(safeAssetUrl(url)).toBeNull();
  expect(safeAssetUrl('https://example.com/a')).toBe('https://example.com/a');
 });
});
