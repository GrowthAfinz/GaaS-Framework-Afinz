import { beforeEach, describe, expect, it, vi } from 'vitest';
const mock=vi.hoisted(()=>({from:vi.fn()}));
vi.mock('../../../services/supabaseClient',()=>({supabase:mock}));
import { readAllRows, numberOrNull, fetchResultsSnapshot } from './resultsService';
beforeEach(()=>mock.from.mockReset());
function source(count:number,batches:{data:object[];error?:object}[],end=count){
 let page=0;const ranges:number[]=[];
 mock.from.mockImplementation(()=>({select:(_c:string,options:{head?:boolean}={})=>options.head?Promise.resolve({count:end,error:null}):{order:()=>({range:(start:number)=>{ranges.push(start);return Promise.resolve({count,data:batches[page]?.data||[],error:batches[page++]?.error||null});}})}}));
 return ranges;
}
describe('Complete source reads',()=>{
 it('sends the exact accented CRM schema names in the real snapshot request',async()=>{
  let selected='';
  mock.from.mockImplementation(()=>({select:(columns:string,options:{head?:boolean}={})=>{
   if(options.head)return Promise.resolve({count:0,error:null});
   selected=columns;return {order:()=>({range:()=>Promise.resolve({count:0,data:[],error:null})})};
  }}));
  await fetchResultsSnapshot('crm','schema-regression',true);
  expect(selected.split(',')).toHaveLength(54);
  for(const column of ['Data de Disparo','Activity name / Taxonomia','Cartões Gerados','Etapa de aquisição','Custo Total Campanha','Aprovados','Base Acionável','Emissões Assistidas','Perfil de Crédito','Ordem de disparo']){
   expect(selected.split(',')).toContain(JSON.stringify(column));
  }
 });
 it('transports recorded funnel counts and variant dimensions without imputing missing measures',async()=>{
  source(1,[{data:[{id:'record','Data de Disparo':'2026-09-01T12:00:00Z','Cartões Gerados':10,Propostas:100,Aprovados:80,'Base Acionável':200,'Emissões Assistidas':3,'Emissões Independentes':7,Abertura:null,Cliques:0,'Produto':'Classic','Ordem de disparo':2,status:'Realizado'}]}]);
  const snapshot=await fetchResultsSnapshot('crm','crm-detail-transport',true);
  expect(snapshot.rows[0].crm).toMatchObject({approved:80,actionable:200,independent:7,assisted:3,openings:null,clicks:0});
  expect(snapshot.rows[0].dimensions).toMatchObject({product:'Classic',order:'2'});
  expect(snapshot.rows[0].sourceStatus).toBe('Realizado');
 });
 it('quotes literal column names so PostgREST preserves spaces and reserved slash',async()=>{
  let selected='';
  mock.from.mockImplementation(()=>({select:(columns:string,options:{head?:boolean}={})=>{
   if(options.head)return Promise.resolve({count:0,error:null});
   selected=columns;return {order:()=>({range:()=>Promise.resolve({count:0,data:[],error:null})})};
  }}));
  await readAllRows('activities','id,Data de Disparo,Activity name / Taxonomia,Cartões Gerados');
  expect(selected).toBe(['id','Data de Disparo','Activity name / Taxonomia','Cartões Gerados'].map(column=>JSON.stringify(column)).join(','));
 });
 it('continues pagination when the server caps a page below the requested size',async()=>{
  const ranges=source(1200,[{data:Array.from({length:500},(_,id)=>({id}))},{data:Array.from({length:500},(_,id)=>({id:id+500}))},{data:Array.from({length:200},(_,id)=>({id:id+1000}))}]);
  expect(await readAllRows('activities','id')).toHaveLength(1200);expect(ranges).toEqual([0,500,1000]);
 });
 it('rejects a truncated read and a count changing during loading',async()=>{
  source(5,[{data:[{id:1}]}]);await expect(readAllRows('activities','id')).rejects.toThrow('fonte mudou');
  source(1,[{data:[{id:1}]}],2);await expect(readAllRows('activities','id')).rejects.toThrow('fonte mudou');
 });
 it('fails the whole read when a later page fails',async()=>{
  source(2,[{data:[{id:1}]},{data:[],error:new Error('network failed')}]);
  await expect(readAllRows('activities','id')).rejects.toThrow('network failed');
 });
 it('does not normalize absent values to zero',()=>{
  expect(numberOrNull(null)).toBeNull();expect(numberOrNull('')).toBeNull();expect(numberOrNull('invalid')).toBeNull();expect(numberOrNull(0)).toBe(0);
 });
});

