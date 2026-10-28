import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
export const SKILL_VERSION='1.0.0';
export const SKILL_PATH='.claude/skills/gaas-growth-investigation/SKILL.md';
export function skillHash(){const hash=createHash('sha256');for(const path of [SKILL_PATH,'.claude/skills/gaas-growth-investigation/references/output-contract.md','scripts/growth-investigation-agent.mjs'])hash.update(path+'\n'+readFileSync(path,'utf8').replaceAll('\r\n','\n')+'\n');return hash.digest('hex');}
export function validateAnalysis(claim,body){
 const errors=[];const evidence=new Map((claim.packet?.evidence||[]).map(e=>[e.id,e]));
 if(!['conclusive','inconclusive','blocked'].includes(body.status))errors.push('invalid_status');
 if(typeof body.summary!=='string'||body.summary.trim().length<10)errors.push('summary_required');
 for(const key of ['facts','hypotheses','limitations','next_checks'])if(!Array.isArray(body[key]))errors.push('invalid_'+key);
 if(!body.facts?.length||!body.limitations?.length||!body.next_checks?.length)errors.push('empty_required_section');
 for(const f of [...(Array.isArray(body.facts)?body.facts:[]),...(Array.isArray(body.hypotheses)?body.hypotheses:[])]){
 if(typeof f.text!=='string'||f.text.length<5||!Array.isArray(f.evidence_ids)||!f.evidence_ids.length){errors.push('claim_requires_evidence');continue;}
 for(const id of f.evidence_ids)if(!evidence.has(id))errors.push('unknown_evidence:'+id);
 if(f.values!==undefined&&!Array.isArray(f.values))errors.push('invalid_values');
 for(const v of Array.isArray(f.values)?f.values:[])if(!evidence.has(v.evidence_id)||evidence.get(v.evidence_id).value!==v.value||!f.evidence_ids.includes(v.evidence_id))errors.push('value_mismatch');
 }
 if(body.candidate){const c=body.candidate;const metric=evidence.get(claim.packet?.period+':'+c.metric);
 if(body.status!=='conclusive'||claim.packet?.period_state!=='closed'||!metric||metric.status!=='observed'||metric.value===null)errors.push('candidate_not_eligible');
 if(!['cards','cost_per_card','proposals','approved'].includes(c.metric)||typeof c.action!=='string'||c.action.length<10||typeof c.title!=='string'||c.title.length<10||typeof c.success_criterion!=='string'||c.success_criterion.length<10)errors.push('candidate_contract_required');
 }
 return errors;
}
if(process.argv[1]?.replaceAll('\\','/').endsWith('/growth-investigation-agent.mjs')){
 const command=process.argv[2];
 if(command==='identity'){
 const name=process.argv[3];if(!['codex','claude'].includes(name))throw Error('Use codex ou claude');
 process.stdout.write(JSON.stringify({name,skill_version:SKILL_VERSION,skill_hash:skillHash(),commit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim()})+'\n');
 }else if(command==='validate'){
 const errors=validateAnalysis(JSON.parse(readFileSync(process.argv[3],'utf8')),JSON.parse(readFileSync(process.argv[4],'utf8')));
 process.stdout.write(JSON.stringify({valid:errors.length===0,errors})+'\n');if(errors.length)process.exitCode=1;
 }else throw Error('Use identity <codex|claude> ou validate <claim.json> <analysis.json>');
}
