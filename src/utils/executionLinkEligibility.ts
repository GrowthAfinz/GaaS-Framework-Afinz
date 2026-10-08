import type {CatalogEntry,OrphanRow} from '../hooks/useReconciliation';
import type {FrameworkActivity} from './communicationOrchestrator';
import {canalToId} from './taxonomy';

// Regra ÚNICA de vínculo em lote, usada pela fila (Cadastro) e pela Performance.
// Lote só aceita candidato único, contexto suficiente e nenhum conflito. O resto vai para revisão individual.

const missing=(v:unknown)=>{const s=String(v??'').trim();return !s||/^(n\/a|na|none|null|—|-|não identificado)$/i.test(s);};
const CONTEXT:[string,(a:FrameworkActivity)=>unknown][]=[
 ['Jornada',a=>a.jornada],['Activity Name',a=>a['Activity name / Taxonomia']],['Canal',a=>a.Canal],['BU',a=>a.BU],
 ['Parceiro',a=>a.parceiro_canonico||a.Parceiro],['Segmento',a=>a.Segmento],['Data de disparo',a=>a['Data de Disparo']],
];
export function missingExecutionContext(records:FrameworkActivity[]):string[] {
 return CONTEXT.filter(([,get])=>records.some(r=>missing(get(r)))).map(([label])=>label);
}

/** IDs candidatos distintos que o motor apresentou para o grupo (pack primeiro, depois match). */
export function candidateTemplateIds(o:OrphanRow):string[] {
 const ids=[...(o.packEvidence?.ids??[])];
 if(o.match&&!ids.includes(o.match.tpl.id))ids.push(o.match.tpl.id);
 return ids;
}

export interface BatchEligibility {eligible:boolean;templateId:string|null;reasons:string[]}

export function batchEligibility(o:OrphanRow,catalog:CatalogEntry[]):BatchEligibility {
 const reasons:string[]=[];
 const ids=candidateTemplateIds(o);
 const templateId=o.match?.tpl.id??null;
 if(!o.match)reasons.push('Sem template sugerido.');
 if(ids.length>1)reasons.push('Mais de um template candidato.');
 if(o.confidence!=='forte')reasons.push('Sugestão não é forte.');
 if(o.packEvidence?.conflicts.length)reasons.push('Há conflitos de evidência.');
 if(o.parsed.divergencias?.length&&o.packEvidence?.source!=='pack')reasons.push('Jornada e colunas divergem.');
 if(o.momentConflict)reasons.push('Momento do disparo sem template correspondente.');
 if(o.match&&!o.match.tpl.inCurrentFilter)reasons.push('Template fora dos filtros globais.');
 const tpl=templateId?catalog.find(t=>t.id===templateId):undefined;
 if(templateId&&!tpl)reasons.push('Template não cadastrado no catálogo.');
 if(tpl&&canalToId(tpl.channel)!==canalToId(o.canalLabel))reasons.push('Canal do template diverge da execução.');
 if(o.executionRecords.some(r=>r.template_id))reasons.push('Execução já vinculada.');
 const gaps=missingExecutionContext(o.executionRecords);
 if(gaps.length)reasons.push('Contexto incompleto: '+gaps.join(', ')+'.');
 return {eligible:reasons.length===0,templateId,reasons};
}

export interface BatchSelection {groups:OrphanRow[];executions:number}
/** Seleção efetiva = selecionados ∩ visíveis após filtros ∩ elegíveis. */
export function effectiveBatchSelection(visible:OrphanRow[],selected:Set<string>,catalog:CatalogEntry[]):BatchSelection {
 const groups=visible.filter(o=>selected.has(o.uid)&&batchEligibility(o,catalog).eligible);
 return {groups,executions:groups.reduce((n,o)=>n+o.executionRecords.length,0)};
}

export interface BatchOutcome {uid:string;templateId:string;ok:boolean;linked:number;error?:string}
/** Aplica grupo a grupo (o RPC é transacional por grupo) e devolve o resultado de cada um, sem parar no primeiro erro. */
export async function applyBatchLinks(groups:OrphanRow[],evidence:string,link:(row:OrphanRow,templateId:string,evidence:string)=>Promise<number>,describe:(e:unknown)=>string):Promise<BatchOutcome[]> {
 const out:BatchOutcome[]=[];
 for(const o of groups){
  const templateId=o.match?.tpl.id;
  if(!templateId){out.push({uid:o.uid,templateId:'',ok:false,linked:0,error:'Sem template sugerido.'});continue;}
  try{out.push({uid:o.uid,templateId,ok:true,linked:await link(o,templateId,evidence)});}
  catch(e){out.push({uid:o.uid,templateId,ok:false,linked:0,error:describe(e)});}
 }
 return out;
}
