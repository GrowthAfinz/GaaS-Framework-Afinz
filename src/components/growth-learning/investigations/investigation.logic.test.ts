import {describe,it,expect} from 'vitest';
import {historicalMedian,investigationState} from './investigation.logic';
import type {Investigation,InvestigationMetric} from './investigation.types';
const metric=(month:string,value:number|null,status:InvestigationMetric['status']='observed'):InvestigationMetric=>({id:month+':cards',month,metric:'cards',value,recorded_row_sum:value,known_rows:1,total_rows:1,status});
describe('investigation evidence semantics',()=>{
 it('preserves zero and excludes target, missing and blocked historical values',()=>{
 expect(historicalMedian([metric('2026-04-01',0),metric('2026-05-01',10),metric('2026-06-01',20),metric('2026-07-01',30),metric('2026-08-01',999,'blocked'),metric('2026-09-01',100)],'2026-09-01','cards')).toBe(15);
 expect(historicalMedian([metric('2026-04-01',null)],'2026-09-01','cards')).toBeNull();
 });
 it('staleness takes precedence over completed analysis',()=>{
 expect(investigationState({stale:true,state:'completed',analysis_is_current:true} as Investigation)).toBe('Evidência desatualizada');
 expect(investigationState({stale:false,state:'blocked'} as Investigation)).toBe('Pendência de dados');
 });
});
