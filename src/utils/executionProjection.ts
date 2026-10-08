import type {FrameworkActivity} from './communicationOrchestrator';
export interface ExecutionReview {id:number;group_key:string;member_ids:string[];keep_id:string;snapshots:FrameworkActivity[];approved:boolean}
function stable(value:unknown):string {
 if(typeof value==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:/.test(value)&&Number.isFinite(Date.parse(value)))return JSON.stringify(new Date(value).toISOString());
 if(Array.isArray(value))return '['+value.map(stable).join(',')+']';
 if(value&&typeof value==='object')return '{'+Object.entries(value).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>JSON.stringify(k)+':'+stable(v)).join(',')+'}';
 return JSON.stringify(value);
}
/** A changed source invalidates the decision. Partial query coverage never suppresses rows. */
export function projectExecutions(rows:FrameworkActivity[],reviews:ExecutionReview[]) {
 const latest=new Map<string,ExecutionReview>();
 for(const r of reviews)if(!latest.has(r.group_key)||latest.get(r.group_key)!.id<r.id)latest.set(r.group_key,r);
 const byId=new Map(rows.map(r=>[r.id,r])),suppressed=new Set<string>();
 for(const r of latest.values()) {
  if(!r.approved||r.member_ids.length!==2||!r.member_ids.includes(r.keep_id))continue;
  if(!r.member_ids.every(id=>byId.has(id)&&r.snapshots.some(s=>s.id===id&&stable(s)===stable(byId.get(id)))))continue;
  const ref=byId.get(r.keep_id)!;
  if(rows.some(a=>!r.member_ids.includes(a.id)&&a.jornada===ref.jornada&&a['Activity name / Taxonomia']===ref['Activity name / Taxonomia']&&a.Canal===ref.Canal&&a['Data de Disparo']===ref['Data de Disparo']))continue;
  for(const id of r.member_ids)if(id!==r.keep_id)suppressed.add(id);
 }
 return rows.filter(r=>!suppressed.has(r.id));
}
