import type {Investigation,InvestigationMetric} from './investigation.types';
export const QUESTION_LABELS={result_change:'Investigar mudança de resultado',execution_review:'Avaliar repetição ou ajuste'};
export const METRIC_LABELS:Record<string,string>={cards:'Cartões',cost:'Custo registrado',cost_per_card:'Custo por cartão',proposals:'Propostas',approved:'Aprovados',actionable_exposures:'Exposições acionáveis',clicks:'Cliques'};
export function investigationState(i:Investigation){
 if(i.stale||i.state==='superseded')return 'Evidência desatualizada';
 if(i.state==='running')return 'Em análise pelo agente';
 if(i.state==='failed')return 'Erro de processamento';
 if(i.state==='blocked')return 'Pendência de dados';
 if(i.analysis_is_current)return 'Análise disponível';
 return 'Aguardando análise';
}
export function historicalMedian(metrics:InvestigationMetric[],period:string,key:string):number|null{
 const values=metrics.filter(m=>m.metric===key&&m.month<period&&m.status==='observed'&&m.value!==null&&
 (key!=='cost_per_card'||metrics.some(c=>c.month===m.month&&c.metric==='cards'&&c.status==='observed'&&(c.value??0)>=20)))
 .map(m=>m.value!).sort((a,b)=>a-b);
 if(values.length<4)return null;
 const mid=Math.floor(values.length/2);return values.length%2?values[mid]:(values[mid-1]+values[mid])/2;
}
export function investigationSearch(id?:string){const p=new URLSearchParams(window.location.search);p.set('view','learning');p.set('section','investigations');p.set('task_view','investigations');p.delete('dev_task');if(id)p.set('item',id);else p.delete('item');return '?'+p;}
