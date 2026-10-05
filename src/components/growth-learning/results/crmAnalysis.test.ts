import { describe,it,expect } from 'vitest';
import { crmSummary,crmGroups } from './crmAnalysis';
import { ResultRow,EMPTY_SCOPE } from './results.types';
const row=(p:Partial<ResultRow>={}):ResultRow=>({id:'1',date:'2026-09-01',domain:'crm',...EMPTY_SCOPE,campaignLabel:'',title:'',primary:10,secondary:100,spend:50,conversions:null,duplicateKey:'1',mapped:true,crm:{approved:50,actionable:200,independent:7,assisted:3,openings:null,clicks:0},...p});
describe('CRM comparative contracts',()=>{
 it('weights approval/finalization using complete comparable counts',()=>{
  const s=crmSummary([row(),row({id:'2',primary:30,secondary:200,crm:{approved:100,actionable:400}})],new Set());
  expect(s.approvalRate).toBe(50);expect(s.completionRate).toBeCloseTo(40/150*100);
  expect(s.cardRate).toBeCloseTo(40/300*100);expect(s.actionable.value).toBe(600);
 });
 it('blocks a rate with missing or inconsistent counts, without hiding the known totals',()=>{
  const s=crmSummary([row(),row({id:'2',secondary:5,crm:{approved:20,actionable:3}})],new Set());
  expect(s.approved.value).toBe(70);expect(s.approvalRate).toBeNull();expect(s.audienceRate).toBeNull();
  expect(s.cardRate).toBeNull();expect(s.incompatibleBase).toBe(1);
  expect(crmSummary([row({crm:{approved:null}})],new Set()).approvalRate).toBeNull();
 });
 it('preserves absent engagement and actual zero independently',()=>{
  const s=crmSummary([row()],new Set());expect(s.openings.value).toBeNull();expect(s.clicks.value).toBe(0);
 });
 it('does not publish emission decomposition when it fails reconciliation',()=>{
  expect(crmSummary([row()],new Set()).independent.value).toBe(7);
  const s=crmSummary([row({primary:11})],new Set());expect(s.independent.value).toBeNull();expect(s.splitMismatch).toBe(1);
 });
 it('applies global duplicate exclusions consistently to groups, shares and costs',()=>{
  const current=[row({partner:'A',channel:'SMS'}),row({id:'2',partner:'B',primary:20,spend:200}),row({id:'bad',partner:'B',primary:999})];
  const groups=crmGroups(current,[row({partner:'A',primary:5})],new Set(['bad']),'partner');
  expect(groups[0].label).toBe('B');expect(groups[0].share).toBeCloseTo(200/3);
  expect(groups[0].summary.cac).toBe(10);expect(groups[1].prior.primary).toBe(5);
  expect(groups[0].summary.excluded).toBe(1);
 });
 it('never computes production share from partial totals and groups actual product dimensions',()=>{
  const groups=crmGroups([row({dimensions:{product:'Classic'}}),row({id:'2',primary:null,dimensions:{product:'Platinum'}})],[],new Set(),'product');
  expect(groups[0].share).toBeNull();expect(groups[0].label).toBe('Classic');
 });
});
