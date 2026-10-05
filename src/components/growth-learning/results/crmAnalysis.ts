import { CrmMeasure, ResultRow } from './results.types';
import { summarize } from './results.logic';

export const CRM_MEASURES:Record<CrmMeasure,string> = {
 baseTotal:'Base Total',actionable:'Base Acionável',approved:'Aprovados',openings:'Abertura',clicks:'Cliques',
 independent:'Emissões Independentes',assisted:'Emissões Assistidas',deliveryRate:'Taxa de Entrega',
 openingRate:'Taxa de Abertura',clickRate:'Taxa de Clique',proposalRate:'Taxa de Proposta',
 approvalRate:'Taxa de Aprovação',completionRate:'Taxa de Finalização',conversionRate:'Taxa de Conversão',
 optimization:'% Otimização de base',channelCost:'Custo total canal',offerCost:'Custo Total da Oferta',
 channelUnitCost:'Custo unitário do canal',offerUnitCost:'Custo Unitário Oferta',recordedCac:'CAC'
};
export const CRM_DIMENSIONS:Record<string,string> = {
 credit:'Perfil de Crédito',product:'Produto',offer:'Oferta',promotion:'Promocional',
 offer2:'Oferta 2',promotion2:'Promocional 2',order:'Ordem de disparo',template:'template_id'
};
export type ObservedMeasure={value:number|null;known:number;total:number};
const valid=(v:unknown):v is number=>typeof v==='number'&&Number.isFinite(v)&&v>=0;
export function crmSummary(rows:ResultRow[],duplicates:Set<string>){
 const usable=rows.filter(row=>!duplicates.has(row.id));
 const sum=(read:(r:ResultRow)=>number|null|undefined):ObservedMeasure=>{
  const values=usable.map(read).filter(valid);
  return {value:values.length?values.reduce((a,b)=>a+b,0):null,known:values.length,total:usable.length};
 };
 const cards=sum(r=>r.primary),proposals=sum(r=>r.secondary),approved=sum(r=>r.crm?.approved);
 const actionable=sum(r=>r.crm?.actionable),baseTotal=sum(r=>r.crm?.baseTotal);
 const rate=(numerator:(r:ResultRow)=>number|null|undefined,denominator:(r:ResultRow)=>number|null|undefined)=>{
  if(!usable.length||usable.some(r=>!valid(numerator(r))||!valid(denominator(r))||numerator(r)!>denominator(r)!))return null;
  const n=usable.reduce((s,r)=>s+numerator(r)!,0),d=usable.reduce((s,r)=>s+denominator(r)!,0);
  return d>0?100*n/d:null;
 };
 const splitValid=usable.length>0&&usable.every(r=>valid(r.primary)&&valid(r.crm?.independent)&&valid(r.crm?.assisted)&&r.primary===r.crm!.independent!+r.crm!.assisted!);
 return {cards,proposals,approved,actionable,baseTotal,openings:sum(r=>r.crm?.openings),clicks:sum(r=>r.crm?.clicks),
  channelCost:sum(r=>r.crm?.channelCost),offerCost:sum(r=>r.crm?.offerCost),
  independent:splitValid?sum(r=>r.crm?.independent):{value:null,known:0,total:usable.length},
  assisted:splitValid?sum(r=>r.crm?.assisted):{value:null,known:0,total:usable.length},
  approvalRate:rate(r=>r.crm?.approved,r=>r.secondary),
  completionRate:rate(r=>r.primary,r=>r.crm?.approved),
  cardRate:rate(r=>r.primary,r=>r.secondary),
  audienceRate:rate(r=>r.secondary,r=>r.crm?.actionable),
  // Openings/clicks are recorded counts; no cross-channel rate without an agreed denominator.
  incompatibleBase:usable.filter(r=>valid(r.secondary)&&valid(r.crm?.actionable)&&r.secondary>r.crm!.actionable!).length,
  splitMismatch:usable.filter(r=>valid(r.primary)&&valid(r.crm?.independent)&&valid(r.crm?.assisted)&&r.primary!==r.crm!.independent!+r.crm!.assisted!).length
 };
}
export function crmDimension(row:ResultRow,key:string):string{
 const value=key in CRM_DIMENSIONS?row.dimensions?.[key]:row[key as keyof ResultRow];
 return typeof value==='string'?value:'';
}
export function crmGroups(current:ResultRow[],previous:ResultRow[],duplicates:Set<string>,key:string){
 const total=summarize(current,duplicates);
 return [...new Set(current.map(r=>crmDimension(r,key)))].map(value=>{
  const rows=current.filter(r=>crmDimension(r,key)===value),before=previous.filter(r=>crmDimension(r,key)===value);
  const summary=summarize(rows,duplicates),prior=summarize(before,duplicates);
  return {value,label:value&&value!=='N/A'?value:'Não informado',summary,prior,detail:crmSummary(rows,duplicates),
   share:summary.primary!==null&&summary.usable>0&&summary.primaryKnown===summary.usable&&total.primaryKnown===total.usable&&total.primary!==null&&total.primary>0?100*summary.primary!/total.primary:null};
 }).sort((a,b)=>(b.summary.primary??-1)-(a.summary.primary??-1));
}

