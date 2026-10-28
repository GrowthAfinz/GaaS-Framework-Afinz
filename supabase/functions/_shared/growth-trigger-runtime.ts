import {ENGINE_VERSION,evaluatePerformance,evaluateFreshness,evaluateRevision,selectRule} from './growth-trigger-engine.ts';
import type {Operation,Rule,MonthlyAggregate} from './growth-trigger-engine.ts';
import {sha256,validateArtifactIntegrity} from '../report-sync/report-live-versioning.ts';
import type {ReportBuildArtifact} from '../report-sync/report-live-versioning.ts';

export const RUNTIME_VERSION='8.2-observation';
export interface ObservationInput {
  period:string; evaluation_as_of:string; data_read_at:string;
  config:{version:number;operation_ids:string[];rule_ids:string[];responsible_label:string;[key:string]:unknown};
  operations:Operation[]; rules:Rule[]; monthly:MonthlyAggregate[];
  freshness:{source:string;latest:string|null}[];
  certified:{run_id:string;artifact_path:string;content_hash:string;certification_status:string;period:string;
    partners_current:{partner:string;cards:string|null;missing_cards:number;unproven_execution:number}[]};
}
export function parseObservationRequest(value:unknown):{mode:'run'|'worker';period?:string} {
  if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('Invalid request');
  const body=value as Record<string,unknown>;
  if(body.mode!=='run'&&body.mode!=='worker')throw new Error('Invalid mode');
  if(body.period!==undefined&&(!/^\d{4}-(0[1-9]|1[0-2])$/.test(String(body.period))||body.mode==='worker'))throw new Error('Invalid period');
  return {mode:body.mode,period:body.period as string|undefined};
}
export async function observationInputHash(input:ObservationInput):Promise<string>{
  const {data_read_at:_,...stable}=input;
  return await sha256({runtime:RUNTIME_VERSION,engine:ENGINE_VERSION,input:stable});
}
export async function buildObservation(input:ObservationInput,artifact:ReportBuildArtifact|null){
  if(input.operations.length!==input.config.operation_ids.length||new Set(input.config.operation_ids).size!==input.operations.length
    ||input.operations.some(o=>!input.config.operation_ids.includes(o.operation_id)||o.lifecycle!=='confirmada')
    ||input.rules.some(r=>!input.config.rule_ids.includes(r.rule_id)||r.mode!=='observacao'))throw new Error('Invalid pilot configuration');
  const performance=input.operations.flatMap(op=>['T1','T2'].map(family=>{
    const rule=selectRule(input.rules,family as Rule['family'],op.front,input.evaluation_as_of);
    return evaluatePerformance(op,rule,input.period,input.evaluation_as_of,input.monthly);
  }));
  const freshness=input.rules.filter(r=>r.family==='T5').map(rule=>({source:rule.metric,rule_id:rule.rule_id,rule_version:rule.version,
    ...evaluateFreshness(rule,input.freshness.find(f=>f.source===rule.metric)?.latest??null,input.evaluation_as_of)}));
  const revisionRule=selectRule(input.rules,'T6','crm_aquisicao',input.evaluation_as_of,'cards');
  const integrity=artifact?await validateArtifactIntegrity(artifact):[];
  const hashVerified=Boolean(artifact&&input.certified.certification_status==='certified'&&artifact.run_id===input.certified.run_id
    &&artifact.content_hash===input.certified.content_hash&&integrity.length>0&&integrity.every(c=>c.status==='passed'));
  const revisions:Record<string,unknown>[]=[];
  if(hashVerified&&artifact){
    const partners=new Set(input.operations.map(o=>o.scope.partner));
    for(const [view,rows] of Object.entries(artifact.tabs)){
      if(!/^VP_.*_RESULT$/.test(view)||!rows.length)continue;
      const headers=rows[0].map(String),row=rows.slice(1).find(r=>r[headers.indexOf('metric')]==='cards');
      if(!row)continue;
      const partner=String(row[headers.indexOf('partner')]); if(!partners.has(partner))continue;
      const state=row[headers.indexOf('state')],certified=row[headers.indexOf('current')];
      const current=input.certified.partners_current.find(r=>r.partner===partner);
      revisions.push({partner,grain:'partner',certified,current:current?.cards??null,
        ...evaluateRevision(revisionRule,{certified:certified===null?null:String(certified),current:current?.cards??null,hashVerified,
          comparableScope:state==='valor_observado'||state==='zero_observado',currentComplete:Boolean(current&&current.missing_cards===0&&current.unproven_execution===0),
          snapshotId:input.certified.run_id,scopeKey:'partner:'+partner,period:input.certified.period})});
    }
  }
  return {mode:'observacao',runtime_version:RUNTIME_VERSION,engine_version:ENGINE_VERSION,period:input.period,
    evaluation_as_of:input.evaluation_as_of,responsible_label:input.config.responsible_label,
    performance,freshness,revisions,revision_status:hashVerified?'verified_partner_grain':'snapshot_unverifiable',
    limitations:['Cobertura de campos nas linhas disponíveis não certifica toda a população ingerida.',
      'T6 permanece no grão de parceiro; sem alocação por operação.',
      'Modo observação: nenhum evento, candidata ou aposta é criado.']};
}
