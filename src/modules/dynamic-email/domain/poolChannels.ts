/** Contract/simulation only. No audience is written or dispatched by this module. */
export const POOL_CHANNEL_CAPS = { whatsapp: 5000, sms: 100000 } as const;
export type PoolChannel = 'email' | 'whatsapp' | 'sms';
export interface PoolChannelContact {
 id:string; group:string; cell:string; businessChannel:'B2C'|'B2B2C'; commonEligible:boolean;
 email:string; phone:string; emailBlocked:boolean|null; mobileBlocked:boolean|null;
 emailSuppressed:boolean; whatsappSuppressed:boolean; smsSuppressed:boolean;
 lastAppUse:string|null;
}
const validDay=(value:string)=>/^\d{4}-\d{2}-\d{2}$/.test(value)&&!Number.isNaN(Date.parse(value+'T00:00:00Z'))&&new Date(value+'T00:00:00Z').toISOString().slice(0,10)===value;
/** Both inputs are DATE values already normalized to America/Sao_Paulo by the source contract. */
export function recentPoolAppUse(last:string|null,today:string):boolean {
 if(!last||!validDay(last)||!validDay(today))return false;
 const days=(Date.parse(today+'T00:00:00Z')-Date.parse(last+'T00:00:00Z'))/86400000;
 return days>=0&&days<=60;
}
export function poolChannelEligibility(contact:PoolChannelContact,today:string):Record<PoolChannel,boolean> {
 if(!contact.commonEligible||!['SEG-A','SEG-B','GEN-A'].includes(contact.cell))return {email:false,whatsapp:false,sms:false};
 const mobile=!!contact.phone.trim()&&contact.mobileBlocked===false&&recentPoolAppUse(contact.lastAppUse,today);
 return {email:!!contact.email.trim()&&contact.emailBlocked===false&&!contact.emailSuppressed,whatsapp:mobile&&!contact.whatsappSuppressed,sms:mobile&&!contact.smsSuppressed};
}
export interface PoolChannelPolicy {id:string;weights:Record<PoolChannel,number>;whatsappCap:number;smsCap:number}
const score=(s:string)=>{let h=2166136261;for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619);return h>>>0;};
export function validatePoolChannelPolicy(p:PoolChannelPolicy):boolean {
 return !!p.id.trim()&&Object.values(p.weights).every(n=>Number.isFinite(n)&&n>=0)&&Object.values(p.weights).reduce((a,b)=>a+b,0)>0&&Number.isInteger(p.whatsappCap)&&p.whatsappCap>=0&&p.whatsappCap<=POOL_CHANNEL_CAPS.whatsapp&&Number.isInteger(p.smsCap)&&p.smsCap>=0&&p.smsCap<=POOL_CHANNEL_CAPS.sms;
}
/** Same weights in A/B. No spending rank, implicit fallback or quota filling. Policy must be explicitly supplied. */
export function simulatePoolChannelRound(contacts:PoolChannelContact[],today:string,round:string,policy?:PoolChannelPolicy) {
 if(!policy||!round.trim()||!validatePoolChannelPolicy(policy))return {status:'parameters_pending' as const,assignments:[] as {id:string;channel:PoolChannel;profile:string}[]};
 const total=Object.values(policy.weights).reduce((a,b)=>a+b,0);
 const unique=new Map<string,PoolChannelContact>();
 for(const c of contacts){if(unique.has(c.id))throw Error('pool_duplicate_participant');unique.set(c.id,c);}
 const selected=[...unique.values()].flatMap(c=>{
  const profile=c.group+'|'+c.businessChannel;
  const bucket=score(c.id+'|'+round+'|'+policy.id+'|'+profile)/4294967296*total;
  const channel:PoolChannel=bucket<policy.weights.email?'email':bucket<policy.weights.email+policy.weights.whatsapp?'whatsapp':'sms';
  return poolChannelEligibility(c,today)[channel]?[{id:c.id,channel,profile,order:score('cap|'+c.id+'|'+round+'|'+policy.id)}]:[];
 }).sort((a,b)=>a.order-b.order||a.id.localeCompare(b.id));
 const counts={email:0,whatsapp:0,sms:0};
 return {status:'simulation_only' as const,assignments:selected.filter(c=>{const cap=c.channel==='email'?Infinity:c.channel==='whatsapp'?policy.whatsappCap:policy.smsCap;return counts[c.channel]++<cap;}).map(({id,channel,profile})=>({id,channel,profile}))};
}
