#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { build } from 'esbuild';
import { PROJECT, hash, isoToday, literal, validDate } from './crm-import/common.mjs';
import { McpTransport } from './crm-import/transport.mjs';
import { loadSnapshot, reconcileAppliedCache, statsSql, validateMetadata } from './crm-import/snapshot.mjs';
import { buildPlan, profileFor, validatePlan } from './crm-import/plan.mjs';
import { stageSql, stageHashSql, applySql, verificationSql } from './crm-import/sql.mjs';

const repo=path.resolve(fileURLToPath(new URL('..',import.meta.url)));
const require=createRequire(import.meta.url);
const HELP=`CRM CSV executor (project ${PROJECT})
  node scripts/activities-csv.mjs --csv FILE --out DIRECTORY [--apply]
  node scripts/activities-csv.mjs --apply-plan plan.json --expect-plan-id HASH --out DIRECTORY
  node scripts/activities-csv.mjs --verify-run UUID --out DIRECTORY
Options:
  --cache DIRECTORY          Verified local history (default outputs/crm-import/cache)
  --today YYYY-MM-DD         São Paulo calendar date; default current date
  --acquisition-from DATE    Default Monday of previous week
  --acquisition-to DATE      Default today
  --revision NAME            Explicit policy revision (default 1)
  --transport mcp            Host connector mailbox; no credentials in files
Without --apply, only SELECT queries are issued. --apply requires current user authorization.
Use scripts/crm-import/mcp-bridge.mjs to forward mailbox requests to the approved connector.
No SFMC activation, consumption load or schema changes are performed.`;
function argsFor(argv){const args={};for(let i=0;i<argv.length;i++){const key=argv[i];if(!key.startsWith('--'))throw new Error('Unexpected argument: '+key);if(['--apply','--help'].includes(key))args[key.slice(2)]=true;else{if(!argv[i+1]||argv[i+1].startsWith('--'))throw new Error('Missing argument for '+key);args[key.slice(2)]=argv[++i];}}const allowed=['apply','help','csv','out','cache','today','acquisition-from','acquisition-to','revision','transport','apply-plan','expect-plan-id','verify-run'];for(const k of Object.keys(args))if(!allowed.includes(k))throw new Error('Unknown option: '+k);return args;}
async function write(out,name,value){await fs.writeFile(path.join(out,name),JSON.stringify(value,null,2));}
const sourceKey = plan => hash({sourceHash:plan.sourceHash,profile:plan.profile,parserHash:plan.parserHash});
async function readOptional(file){try{return JSON.parse(await fs.readFile(file,'utf8'));}catch(error){if(error.code==='ENOENT')return null;throw error;}}
async function remember(cacheDir,plan,summary,metadata,out,previouslyApplied){
  if(!metadata)return;
  await fs.mkdir(path.join(cacheDir,'sources'),{recursive:true});
  await fs.writeFile(path.join(cacheDir,'sources',sourceKey(plan)+'.json'),JSON.stringify({summary,metadata,output:summary.pendingArtifacts??out,previouslyApplied}));
}
async function finishCache(transport,cacheDir,plan,summary,out,receipt){
  try{const meta=await reconcileAppliedCache(transport,cacheDir,plan);await remember(cacheDir,plan,summary,meta,out,Number(receipt.verification.applied));receipt.cacheReconciled=Boolean(meta);}
  catch(error){receipt.cacheReconciled=false;receipt.cacheWarning='Data applied and verified; cache refresh deferred: '+error.message;}
  await write(out,'receipt.json',receipt);return receipt;
}
async function runtime(out){const compiled=await build({entryPoints:[path.join(repo,'src/utils/crmCsvRuntime.ts')],bundle:true,platform:'node',format:'cjs',write:false,logLevel:'silent'});const code=compiled.outputFiles[0].text;const file=path.join(out,'runtime.cjs');await fs.writeFile(file,code);const policyFiles=['scripts/activities-csv.mjs',...(await fs.readdir(path.join(repo,'scripts/crm-import'))).filter(f=>f.endsWith('.mjs')).sort().map(f=>'scripts/crm-import/'+f)];const policy=await Promise.all(policyFiles.map(f=>fs.readFile(path.join(repo,f),'utf8').then(text=>text.replace(/\r\n/g,'\n'))));return {api:require(file),parserHash:hash({runtime:hash(code),executor:hash(policy.join('\0'))})};}
export async function execute({transport,args,api,parserHash,out,cacheDir}){
  const started=Date.now();
  if(args['verify-run']){if(!/^[a-f\d-]{36}$/i.test(args['verify-run']))throw new Error('Invalid run UUID');const receipt=(await transport.query(verificationSql(args['verify-run']),'verify'))[0];assertVerified(receipt);await write(out,'receipt.json',receipt);return receipt;}
  let plan,summary,snapshotMetadata;
  if(args['apply-plan']){
    plan=JSON.parse(await fs.readFile(path.resolve(args['apply-plan']),'utf8'));validatePlan(plan);
    if(args['expect-plan-id']!==plan.planId)throw new Error('Explicit expected plan ID is required');
    if(plan.parserHash!==parserHash)throw new Error('Parser changed; regenerate the plan');
    summary={planId:plan.planId,runId:plan.runId,sourceHash:plan.sourceHash,profile:plan.profile,selected:plan.changes.length,warnings:[],domains:domainSummary(plan)};
    const originalSummary=await readOptional(path.join(path.dirname(path.resolve(args['apply-plan'])),'summary.json'));
    if(originalSummary?.planId===plan.planId)summary={...originalSummary,...summary,sourceRows:originalSummary.physicalRows??originalSummary.sourceRows,warnings:originalSummary.warnings??[],pendingArtifacts:path.dirname(path.resolve(args['apply-plan']))};
  }else{
    if(!args.csv)throw new Error('--csv is required');
    const today=args.today??isoToday();if(!validDate(today))throw new Error('Invalid --today');
    const profile=profileFor(api,{today,acquisitionFrom:args['acquisition-from'],acquisitionTo:args['acquisition-to'],revision:args.revision});
    const bytes=await fs.readFile(path.resolve(args.csv));const sourceHash=hash(bytes);
    await fs.writeFile(path.join(out,'source.csv'),bytes);
    const remembered=await readOptional(path.join(cacheDir,'sources',sourceKey({sourceHash,profile,parserHash})+'.json'));
    if(remembered){
      const meta=(await transport.query(statsSql,'repeated-source-check'))[0]?.metadata;validateMetadata(meta);
      if(hash(meta)===hash(remembered.metadata)){
        const receipt={...remembered.summary,sourceRows:remembered.summary.physicalRows??remembered.summary.sourceRows,status:'already_processed',applied:0,previouslyApplied:remembered.previouslyApplied,downloads:{activities:0,rentabilizacao_activities:0},pendingArtifacts:remembered.output,durationMs:Date.now()-started};
        await write(out,'receipt.json',receipt);return receipt;
      }
    }
    const matrix=api.parseCsvBytes(bytes);
    if(!matrix.length)throw new Error('Empty source');
    const snapshot=await loadSnapshot(transport,cacheDir);
    snapshotMetadata=snapshot.metadata;
    const cards=await transport.query('select data_scope from public.crm_structure_cards where not archived','campaign-mapping');
    const exact=new Map(),ambiguous=new Set();
    // Same exact-journey eligibility used by loadImportCampaigns in the browser.
    cards.forEach((c,index)=>{const s=c.data_scope;if(s?.domain!=='renta')return;for(const rule of [s.scope,...(s.any_of??[])]){if(!rule?.journey||Object.keys(rule).length!==1||(s.scope&&Object.keys(s.scope).some(k=>k!=='journey')))continue;const key=api.normalizeKey(rule.journey);if(exact.has(key)&&exact.get(key)!==index)ambiguous.add(key);exact.set(key,index);}});
    ambiguous.forEach(key=>exact.delete(key));
    const result=api.processTotalCrmDinamicaBI(matrix,snapshot.rows.activities.map(x=>api.mapSqlToActivity(x.data)),api.buildRentHistoryIndex(snapshot.rows.rentabilizacao_activities.map(x=>x.data)),new Set(exact.keys()));
    if(!result.blocks.some(b=>b.detected)||!result.metrics.length)throw new Error('No valid CRM blocks found');
    const prepared=buildPlan(api,result,snapshot,{sourceHash,sourceName:path.basename(args.csv),parserHash,profile});
    ({plan,summary}=prepared);summary.blockRows=summary.sourceRows;summary.sourceRows=matrix.length;summary.physicalRows=matrix.length;
    await write(out,'plan.json',plan);await write(out,'summary.json',summary);await write(out,'pending.json',prepared.pending);await write(out,'excluded.json',prepared.excluded);
    await write(out,'source-audit.json',{sha256:sourceHash,physicalRows:matrix.length,blocks:result.blocks,insights:result.insights,warnings:result.warnings});
  }
  validatePlan(plan);
  if(!args.apply&&!args['apply-plan']){const receipt={...summary,status:'simulated',durationMs:Date.now()-started};await write(out,'receipt.json',receipt);return receipt;}
  if(!plan.changes.length){const receipt={...summary,status:'no_changes',applied:0,durationMs:Date.now()-started};await write(out,'receipt.json',receipt);await remember(cacheDir,plan,summary,snapshotMetadata,out,0);return receipt;}
  const previous=(await transport.query(`select status,summary->>'planId' plan_id from public.gaas_update_runs where id=${literal(plan.runId)}::uuid`,'existing-run'))[0];
  if(previous?.plan_id&&previous.plan_id!==plan.planId)throw new Error('Existing run has a different plan');
  if(previous?.status==='applied'){const verification=(await transport.query(verificationSql(plan.runId),'verify-replay'))[0];assertVerified(verification,plan.changes.length);const receipt={...summary,status:'already_applied',applied:0,previouslyApplied:verification.applied,verification};await write(out,'receipt.json',receipt);return finishCache(transport,cacheDir,plan,summary,out,receipt);}
  const stages=stageSql(plan,summary);
  for(let i=0;i<stages.length;i++){await fs.writeFile(path.join(out,`stage-${String(i).padStart(3,'0')}.sql`),stages[i]);await transport.query(stages[i],'stage:'+i);}
  const stage=(await transport.query(stageHashSql(plan.runId),'stage-integrity'))[0];
  if(Number(stage.count)!==plan.changes.length)throw new Error('Incomplete staging');
  const sql=applySql(plan,stage.hash);await fs.writeFile(path.join(out,'apply.sql'),sql);
  const applied=(await transport.query(sql,'apply-transaction'))[0];assertVerified(applied,plan.changes.length);
  const verified=(await transport.query(verificationSql(plan.runId),'verify-persistence'))[0];assertVerified(verified,plan.changes.length);
  // Keep full before/after evidence in the database; save a compact local receipt.
  const receipt={...summary,status:'applied',applied:Number(verified.applied),verification:verified,durationMs:Date.now()-started};await write(out,'receipt.json',receipt);
  return finishCache(transport,cacheDir,plan,summary,out,receipt);
}
function domainSummary(plan){return Object.fromEntries(['aquisicao','rentabilizacao'].map(d=>[d,{new:plan.changes.filter(c=>c.domain===d&&c.operation==='insert').length,updates:plan.changes.filter(c=>c.domain===d&&c.operation==='update').length}]));}
export function assertVerified(row,count){const fields=['applied','expected_applied','missing_targets','audit_drift','mismatched_fields'];if(!row||row.status!=='applied'||fields.some(k=>row[k]==null||!Number.isSafeInteger(Number(row[k]))||Number(row[k])<0)||Number(row.applied)!==Number(row.expected_applied)||Number(row.missing_targets)||Number(row.audit_drift)||Number(row.mismatched_fields)||(count!==undefined&&Number(row.applied)!==count))throw new Error('Persistence verification failed: '+JSON.stringify(row));}
async function main(){
  const args=argsFor(process.argv.slice(2));if(args.help){console.log(HELP);return;}
  if(!args.out)throw new Error('--out is required (private output directory)');
  if(args.transport&&args.transport!=='mcp')throw new Error('Only the authorized MCP transport is supported');
  const out=path.resolve(args.out),cacheDir=path.resolve(args.cache??path.join(repo,'outputs/crm-import/cache'));
  await fs.mkdir(out,{recursive:true});await fs.mkdir(cacheDir,{recursive:true});
  let lock;try{lock=await fs.open(path.join(cacheDir,'executor.lock'),'wx');await lock.writeFile(JSON.stringify({pid:process.pid,started:new Date().toISOString(),out}));}catch(error){if(error.code==='EEXIST')throw new Error('Another executor may be active. Inspect cache/executor.lock before removing a stale lock.');throw error;}
  try{await write(out,'status.json',{status:'running'});const {api,parserHash}=await runtime(out);const receipt=await execute({transport:new McpTransport(out),args,api,parserHash,out,cacheDir});await write(out,'status.json',{status:'complete'});console.log(JSON.stringify(receipt));}
  catch(error){await write(out,'status.json',{status:'failed',error:error.message});throw error;}
  finally{await lock.close();await fs.rm(path.join(cacheDir,'executor.lock'),{force:true});}
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(error=>{console.error(error.message);process.exitCode=1;});
