import { evaluatePerformance, evaluateFreshness, evaluateRevision, selectRule } from '../../supabase/functions/_shared/growth-trigger-engine.ts';
import type { Operation, Rule, MonthlyAggregate } from '../../supabase/functions/_shared/growth-trigger-engine.ts';

export const operation: Operation = {operation_id:'CRM-synthetic',front:'crm_aquisicao',domain:'CRM',
  scope:{bu:'B2C',segment:'Synthetic',partner:'Synthetic'},lifecycle:'candidata',valid_from:'2025-01-01',valid_to:null,regime_start:null};
export const volumeRule: Rule = {rule_id:'synthetic_T1_v1',front:'crm_aquisicao',family:'T1',metric:'cards',enabled:true,mode:'observacao',version:1,valid_from:'2026-01-01',valid_to:null,
  params:{window_months:6,minimum_months:4,relative_threshold:'0.30',materiality:'50'}};
export const cacRule: Rule = {...volumeRule,rule_id:'synthetic_T2_v1',family:'T2',metric:'cac',params:{...volumeRule.params,minimum_cards:'30',materiality:'1000'}};
export function aggregate(month: string,cards: string | null,cost='1000'): MonthlyAggregate {
  return {month,bu:'B2C',segment:'Synthetic',partner:'Synthetic',cards,cost,dispatches:1,missing_cards:cards===null?1:0,missing_cost:0,unproven_execution:0};
}
const rows = (values: number[],target: number) => [...values.map((v,i)=>aggregate(`2026-0${i+3}-01`,String(v))),aggregate('2026-09-01',String(target))];
const run = (r: MonthlyAggregate[],op=operation,rule=volumeRule,period='2026-09') => evaluatePerformance(op,rule,period,'2026-10-27',r);

// Business contract cases shared by Node and Vitest; all records are synthetic.
export const contractCases = [
  {name:'open month has no performance verdict',check:()=>run(rows([100,100,100,100,100,100],200),operation,volumeRule,'2026-10').state==='open_period'},
  {name:'regime cut never reaches backwards to fill sample',check:()=>run(rows([100,100,100,100,100,100],200),{...operation,regime_start:'2026-06-01'}).state==='insufficient_sample'},
  {name:'no execution is not zero',check:()=>run(rows([100,100,100,100,100,100],200).filter(r=>r.month!=='2026-09-01')).state==='no_activity'},
  {name:'proven execution with zero cards is volume observation',check:()=>run(rows([100,100,100,100,100,100],0)).state==='triggered'},
  {name:'three history months are insufficient',check:()=>run(rows([100,100,100],200)).state==='insufficient_sample'},
  {name:'outside range fires below median and materiality thresholds',check:()=>run(rows([100,100,100,100,100,100],101)).paths.includes('outside_range')},
  {name:'median deviation without materiality does not fire inside range',check:()=>run(rows([0,100,100,100,100,200],130)).state==='no_deviation_detected'},
  {name:'exact relative and absolute thresholds are inclusive',check:()=>run(rows([0,100,200,200,200,400],260)).paths.includes('median_with_materiality')},
  {name:'range boundaries are inclusive',check:()=>run(rows([0,100,100,100,100,200],200)).paths.includes('outside_range')===false},
  {name:'zero median leaves relative deviation undefined',check:()=>{const r=run(rows([0,0,0,0,0,100],40));return r.state==='no_deviation_detected'&&r.relative_deviation===null;}},
  {name:'null cards cannot be silently summed as zero',check:()=>{const r=rows([100,100,100,100,100,100],200);r[2].missing_cards=1;return run(r).state==='incomplete_coverage';}},
  {name:'unknown target cost blocks CAC',check:()=>{const r=rows([100,100,100,100,100,100],200);r[6].cost=null;r[6].missing_cost=1;return run(r,operation,cacRule).state==='incomplete_coverage';}},
  {name:'observed zero cost is valid CAC',check:()=>{const r=rows([100,100,100,100,100,100],100);r[6].cost='0';return run(r,operation,cacRule).state==='triggered';}},
  {name:'zero cards has undefined CAC',check:()=>run(rows([100,100,100,100,100,100],0),operation,cacRule).state==='invalid_denominator'},
  {name:'CAC requires minimum cards in current month',check:()=>run(rows([100,100,100,100,100,100],29),operation,cacRule).state==='insufficient_sample'},
  {name:'two eligible CAC history months cannot trigger',check:()=>run(rows([1,2,3,4,100,100],100),operation,cacRule).state==='insufficient_sample'},
  {name:'CAC is ratio of aggregate sums',check:()=>{const r=rows([100,100,100,100,100,100],100);r[6].cost='1234.56';return run(r,operation,cacRule).exact.current==='7716/625';}},
  {name:'retired operation cannot trigger',check:()=>run(rows([100,100,100,100,100,100],200),{...operation,lifecycle:'aposentada'}).state==='out_of_scope'},
  {name:'duplicate monthly grain is rejected',check:()=>{const r=rows([100,100,100,100,100,100],200);try{run([...r,r[0]]);return false;}catch{return true;}}},
  {name:'same input is deterministic and immutable',check:()=>{const r=rows([100,100,100,100,100,100],200),before=JSON.stringify(r);return JSON.stringify(run(r))===JSON.stringify(run(r))&&JSON.stringify(r)===before&&!run(r).feed_eligible;}},
  {name:'conflicting rule versions fail closed',check:()=>{try{selectRule([volumeRule,{...volumeRule,version:2}],'T1','crm_aquisicao','2026-10-27');return false;}catch{return true;}}},
  {name:'T5 does not fire at exact tolerance',check:()=>evaluateFreshness({...volumeRule,family:'T5',params:{tolerance_days:7}},'2026-10-20','2026-10-27').state==='no_deviation_detected'},
  {name:'T5 fires one day after tolerance',check:()=>evaluateFreshness({...volumeRule,family:'T5',params:{tolerance_days:7}},'2026-10-19','2026-10-27').state==='triggered'},
  {name:'T5 unknown source date remains missing',check:()=>evaluateFreshness({...volumeRule,family:'T5',params:{tolerance_days:7}},null,'2026-10-27').state==='missing_data'},
  {name:'T5 future dates cannot certify freshness',check:()=>evaluateFreshness({...volumeRule,family:'T5',params:{tolerance_days:7}},'2026-10-28','2026-10-27').state==='incomparable_scope'},
  {name:'T5 selection distinguishes platform partitions',check:()=>selectRule([{...volumeRule,family:'T5',metric:'meta'},{...volumeRule,rule_id:'google',family:'T5',metric:'google'}],'T5','crm_aquisicao','2026-10-27','google').rule_id==='google'},
  {name:'T6 synthetic zero baseline uses absolute threshold',check:()=>evaluateRevision({...volumeRule,family:'T6',params:{absolute_threshold:'20',relative_threshold:'0.02'}},{certified:'0',current:'20',hashVerified:true,comparableScope:true,currentComplete:true,snapshotId:'synthetic',scopeKey:'synthetic',period:'2026-08'}).state==='triggered'},
  {name:'T6 exact 2 percent threshold fires',check:()=>evaluateRevision({...volumeRule,family:'T6',params:{absolute_threshold:'20',relative_threshold:'0.02'}},{certified:'100',current:'98',hashVerified:true,comparableScope:true,currentComplete:true,snapshotId:'synthetic',scopeKey:'synthetic',period:'2026-08'}).state==='triggered'},
  {name:'T6 cannot compare an unverified snapshot',check:()=>evaluateRevision({...volumeRule,family:'T6',params:{absolute_threshold:'20',relative_threshold:'0.02'}},{certified:'100',current:'0',hashVerified:false,comparableScope:true,currentComplete:true,snapshotId:'synthetic',scopeKey:'synthetic',period:'2026-08'}).state==='incomparable_scope'},
];
