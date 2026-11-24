import { hash, uuid, VERSION, validDate } from './common.mjs';
export const METRICS = {sent:'Base Total',delivered:'Base Acionável',opens:'Abertura',clicks:'Cliques',proposals:'Propostas',approved:'Aprovados',finalized:'Cartões Gerados',assisted:'Emissões Assistidas',independent:'Emissões Independentes'};
export function profileFor(runtime, {today, acquisitionFrom, acquisitionTo, revision='1'}) {
  const profile={acquisitionFrom:acquisitionFrom??runtime.previousWeekStart(today),acquisitionTo:acquisitionTo??today,otherDomains:'full-file',revision};
  if(!validDate(today)||!validDate(profile.acquisitionFrom)||!validDate(profile.acquisitionTo)||profile.acquisitionFrom>profile.acquisitionTo)throw new Error('Invalid acquisition date range');
  return profile;
}
export function buildPlan(runtime,result,snapshot,{sourceHash,sourceName,parserHash,profile}) {
  const byId = new Map(snapshot.rows.activities.map(x=>[x.data.id,x]));
  const signatures = new Map();
  for(const row of snapshot.rows.rentabilizacao_activities){const d=row.data,k=runtime.buildDispatchSignature(d['Activity name / Taxonomia'],d.Canal,d['Data de Disparo']);if(!signatures.has(k))signatures.set(k,[]);signatures.get(k).push(row);}
  const logical=c=>JSON.stringify([c.domain,c.domain==='aquisicao'?runtime.acquisitionJourneyIdentity(c.journey):'',runtime.buildDispatchSignature(c.activityName,c.channel,c.date)]);
  const eligible=result.candidates.filter(c=>c.status==='ready'&&!c.auditRequired);
  const groupCounts=new Map();for(const c of eligible)groupCounts.set(logical(c),(groupCounts.get(logical(c))??0)+1);
  const pending=[],excluded=[],unchanged=[],changes=[];
  const brief=c=>({key:c.key,domain:c.domain,date:c.date,journey:c.journey,activityName:c.activityName,channel:c.channel,status:c.status,confidence:c.confidence});
  for(const original of result.candidates){
    const c={...original};
    if(c.domain==='aquisicao'&&(c.date<profile.acquisitionFrom||c.date>profile.acquisitionTo)){excluded.push({...brief(c),reason:'outside_acquisition_period'});continue;}
    if(['duplicate','ignored'].includes(c.status)){unchanged.push({...brief(c),reason:c.status});continue;}
    const hold=(reason,details)=>pending.push({...brief(c),reason,details});
    if(c.status!=='ready'||c.auditRequired){hold(c.conflictReason||c.fieldToReview||c.status);continue;}
    if(groupCounts.get(logical(c))>1){hold('duplicate_source_identity');continue;}
    if(!c.journey||!c.activityName||!validDate(c.date)||!['WhatsApp','E-mail','SMS','Push','ECRED-API'].includes(c.channel)){hold('invalid_identity');continue;}
    const governance=[];
    if(c.domain==='aquisicao'&&c.segmento==='Aprovados_nao_convertidos'){
      c.subgrupo='N/A';c.etapaAquisicao='Meio_de_Funil';governance.push('ANC contract confirmed 2026-10-26');
    }
    if(c.domain==='aquisicao'&&c.segmento!=='Abandonados'&&/^Abandonados/i.test(c.subgrupo??'')){hold('cart_subgroup_on_other_audience');continue;}
    let existing;
    if(c.domain==='aquisicao')existing=byId.get(c.matchedActivity?.raw?.id);
    else{const matches=signatures.get(runtime.buildDispatchSignature(c.activityName,c.channel,c.date))??[];if(matches.length>1){hold('multiple_database_targets');continue;}existing=matches[0];}
    if(c.metricRefresh&&!existing){hold('missing_existing_target');continue;}
    const before=existing?.data;
    const reductions=Object.entries(METRICS).filter(([k,f])=>c[k]!=null&&before?.[f]!=null&&Number(c[k])<Number(before[f])).map(([k,f])=>({field:f,before:before[f],after:c[k]}));
    if(reductions.length){hold('metric_reduction',reductions);continue;}
    const table=c.domain==='aquisicao'?'activities':'rentabilizacao_activities';
    const payload=before?runtime.numericPatch({...c,metricRefresh:true,canonicalDimensionRefresh:false,manualOverrides:[]}):c.domain==='aquisicao'?runtime.buildInsertPayload(c):runtime.buildRentabilizacaoInsertPayload(c);
    delete payload.updated_at;
    if(before){for(const key of Object.keys(payload))if(payload[key]===before[key]||(payload[key]!=null&&before[key]!=null&&typeof payload[key]==='number'&&payload[key]===Number(before[key])))delete payload[key];if(!Object.keys(payload).length){unchanged.push({...brief(c),reason:'no_metric_changes'});continue;}}
    const columns=new Set(snapshot.metadata.columns.filter(x=>x.table===table).map(x=>x.name));
    if(Object.keys(payload).some(key=>!columns.has(key)))throw new Error('Payload does not match live schema');
    changes.push({...brief(c),table,operation:before?'update':'insert',targetId:before?.id??uuid([sourceHash,logical(c)]),expectedHash:existing?.fingerprint??null,payload,governance});
  }
  const plan={version:VERSION,sourceHash,sourceName,parserHash,profile,contract:{schemaHash:snapshot.metadata.schemaHash,rpcHash:snapshot.metadata.rpcHash,triggerHash:snapshot.metadata.triggerHash,mappingHash:snapshot.metadata.mappingHash},snapshot:Object.fromEntries(Object.entries(snapshot.metadata.tables).map(([t,s])=>[t,{count:s.count,hash:s.hash}])),changes};
  plan.planId=hash(plan);plan.runId=uuid(plan.planId);
  const summary={planId:plan.planId,runId:plan.runId,sourceHash,profile,sourceRows:result.importedRows,metrics:result.metrics?.length??result.candidates.length,candidates:changes.length,applied:0,selected:changes.length,domains:Object.fromEntries(['aquisicao','rentabilizacao'].map(d=>[d,{new:changes.filter(c=>c.domain===d&&c.operation==='insert').length,updates:changes.filter(c=>c.domain===d&&c.operation==='update').length}])),pending:pending.length,pendingReasons:Object.fromEntries([...new Set(pending.map(c=>c.reason))].map(r=>[r,pending.filter(c=>c.reason===r).length])),unchanged:unchanged.length,excluded:excluded.length,warnings:result.warnings,downloads:snapshot.downloads};
  return {plan,summary,pending,excluded,unchanged};
}
export function validatePlan(plan) {
  const {planId,runId,...body}=plan;
  if(body.version!==VERSION||hash(body)!==planId||uuid(planId)!==runId)throw new Error('Plan integrity check failed');
  const ids=new Set();for(const row of body.changes){if(!['activities','rentabilizacao_activities'].includes(row.table)||ids.has(row.targetId)||!['insert','update'].includes(row.operation))throw new Error('Invalid or duplicate plan target');ids.add(row.targetId);}
}
