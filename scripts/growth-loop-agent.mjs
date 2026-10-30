import {readFileSync,writeFileSync,existsSync,realpathSync} from 'node:fs';
import {resolve,relative,isAbsolute,sep} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const skill='.claude/skills/gaas-growth-loop-operator/SKILL.md';
export const SKILL_VERSION='1.0.1';
const digest=s=>createHash('sha256').update(s).digest('hex');
export const skillHash=()=>digest([skill,'scripts/growth-loop-agent.mjs'].map(p=>p+'\n'+readFileSync(p,'utf8').replaceAll('\r\n','\n')+'\n').join(''));
export function validate(claim,body){
 const errors=[];const evidence=claim.packet?.evidence||{};
 if(!['blocked','inconclusive','conclusive'].includes(body.status))errors.push('invalid_status');
 if(typeof body.summary!=='string'||body.summary.trim().length<20||body.summary.length>4000)errors.push('invalid_summary');
 for(const key of ['facts','limitations','next_checks'])if(!Array.isArray(body[key])||!body[key].length)errors.push('invalid_'+key);
 for(const key of ['limitations','next_checks'])for(const x of Array.isArray(body[key])?body[key]:[])if(typeof x!=='string'||x.trim().length<5)errors.push('invalid_'+key+'_text');
 for(const f of Array.isArray(body.facts)?body.facts:[]){if(!f||typeof f.text!=='string'||f.text.length<5||!Object.hasOwn(evidence,f.evidence_key))errors.push('invalid_reference');else if(Object.hasOwn(f,'value')&&JSON.stringify(f.value)!==JSON.stringify(evidence[f.evidence_key]))errors.push('invalid_value');}
 if(Object.hasOwn(body,'candidate'))errors.push('source_candidate_forbidden');
 return errors;
}
export function applyApproved(contribution,vault){
 if(contribution.status!=='approved'||!contribution.approved_at||!Array.isArray(contribution.changes)||!contribution.changes.length)throw Error('approved_backend_record_required');
 const root=realpathSync(resolve(vault)),seen=new Set();
 const changes=contribution.changes.map(c=>{
  if(typeof c.path!=='string'||!c.path.endsWith('.md')||/(^\/|\\|:|(^|\/)\.|\/\/|[\x00-\x1f])/.test(c.path)||c.path.startsWith('99-Templates/')||seen.has(c.path))throw Error('invalid_path');seen.add(c.path);
  const target=resolve(root,...c.path.split('/'));const rel=relative(root,target);
  if(isAbsolute(rel)||rel==='..'||rel.startsWith('..'+sep)||!existsSync(target)||realpathSync(target)!==target)throw Error('existing_canonical_note_required');
  if(typeof c.markdown!=='string'||!c.markdown.trim()||digest(c.markdown)!==c.expected_hash)throw Error('invalid_expected_hash');
  const current=digest(readFileSync(target));if(current!==c.base_hash&&current!==c.expected_hash)throw Error('stale_base:'+c.path);
  return {target,markdown:c.markdown,path:c.path,reused:current===c.expected_hash};
 });
 for(const c of changes)if(!c.reused)writeFileSync(c.target,c.markdown,'utf8');
 return changes.map(({path,reused})=>({path,reused}));
}
if(process.argv[1]?.replaceAll('\\','/').endsWith('/growth-loop-agent.mjs')){
 const [command,a,b]=process.argv.slice(2);
 if(command==='identity'){if(!['codex','claude'].includes(a))throw Error('Use codex ou claude');console.log(JSON.stringify({name:a,skill_version:SKILL_VERSION,skill_hash:skillHash(),commit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim()}));}
 else if(command==='validate'){const errors=validate(JSON.parse(readFileSync(a,'utf8')),JSON.parse(readFileSync(b,'utf8')));console.log(JSON.stringify({valid:!errors.length,errors}));if(errors.length)process.exitCode=1;}
 else if(command==='apply-approved')console.log(JSON.stringify(applyApproved(JSON.parse(readFileSync(a,'utf8')),b)));
 else throw Error('Use identity <codex|claude>, validate <claim.json> <analysis.json> ou apply-approved <registro-backend.json> <vault-absoluto>');
}
