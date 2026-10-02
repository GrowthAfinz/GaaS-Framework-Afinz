import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanScope, comparisonWindow, duplicateIds, historyMonths, lastClosedDay, matchesScope, metricDelta, readResultsRoute, resultsSearch, summarize } from './results.logic';
import { EMPTY_SCOPE, ResultRow } from './results.types';
const row=(patch:Partial<ResultRow>={}):ResultRow=>({id:'1',date:'2026-09-01',domain:'crm',...EMPTY_SCOPE,campaignLabel:'',title:'',primary:10,secondary:100,spend:null,conversions:null,duplicateKey:'unique',mapped:true,...patch});
afterEach(()=>vi.useRealTimers());
describe('Results measurement contracts',()=>{
 it('preserves missing measures and actual zero separately',()=>{
  expect(summarize([row({primary:null,secondary:null})],new Set()).primary).toBeNull();
  expect(summarize([row({primary:0})],new Set()).primary).toBe(0);
  expect(summarize([],new Set()).ratio).toBeNull();
  expect(metricDelta(null,10)).toBe('Comparação indisponível');
  expect(metricDelta(10,0)).toContain('base anterior 0');
 });
 it('computes weighted rates only from paired valid observations',()=>{
  const summary=summarize([row(),row({id:'2',primary:30,secondary:100}),row({id:'3',primary:20,secondary:null}),row({id:'4',primary:200,secondary:1})],new Set());
  expect(summary.primary).toBe(260);expect(summary.ratio).toBe(20);expect(summary.ratioRows).toBe(2);
  expect(summary.spend).toBeNull();
 });
 it('detects duplicates globally before narrowing the segment',()=>{
  const rows=[row({segment:'A',duplicateKey:'same'}),row({id:'2',segment:'B',duplicateKey:'same'}),row({id:'3',segment:'A',duplicateKey:'distinct'})];
  const narrowed=rows.filter(r=>matchesScope(r,{...EMPTY_SCOPE,segment:'A'}));
  expect(summarize(narrowed,duplicateIds(rows))).toMatchObject({rows:2,usable:1,excluded:1,primary:10});
 });
 it('does not sum invalid media CTR observations into a rate',()=>{
  expect(summarize([row({domain:'media',primary:200,secondary:100})],new Set()).ratio).toBeNull();
 });
 it('retains calendar gaps in monthly evolution',()=>{
  expect(historyMonths('2025-12','2026-03')).toEqual(['2025-12','2026-01','2026-02','2026-03']);
 });
 it('aligns partial-month comparison and handles the previous short month',()=>{
  vi.useFakeTimers();vi.setSystemTime(new Date('2026-10-02T16:00:00Z'));
  expect(comparisonWindow('2026-10','2026-10-01')).toMatchObject({cut:1,previousEnd:'2026-09-01',partial:true});
  expect(comparisonWindow('2026-03','2026-09-27')).toMatchObject({cut:31,previousEnd:'2026-02-28',partial:false});
  expect(comparisonWindow('2026-01','2026-09-27').previous).toBe('2025-12');
 });
 it('uses the Brazil day boundary rather than UTC today',()=>{
  expect(lastClosedDay(new Date('2026-10-02T01:00:00Z'))).toBe('2026-09-30');
 });
 it('clears incompatible domains and protects result deep links',()=>{
  const search=resultsSearch('media','2026-09',cleanScope('media',{segment:'Dormant',channel:'Meta',campaign:'A & B'}),'?item=123&wiki_q=x&create=contextual-bet');
  expect(readResultsRoute(search)).toEqual({domain:'media',month:'2026-09',scope:{...EMPTY_SCOPE,channel:'Meta',campaign:'A & B'}});
  expect(search).not.toContain('item=');
  expect(readResultsRoute('?result_month=2026-99&result_domain=b2c&result_bu=B2C').scope.bu).toBe('');
  expect(readResultsRoute('?result_month=2026-99').month).toBe('');
 });
 it('keeps B2C total and Serasa separate rather than additive',()=>{
  const rows=[row({domain:'b2c',type:'total',primary:100}),row({id:'2',domain:'b2c',type:'serasa_api',primary:70}),row({id:'3',domain:'b2c',type:'crm',primary:30})];
  expect(summarize(rows.filter(r=>matchesScope(r,{...EMPTY_SCOPE,type:'total'})),duplicateIds(rows)).primary).toBe(100);
 });
});

