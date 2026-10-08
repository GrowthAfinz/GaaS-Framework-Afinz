import type {JourneySnapshot,PackageMessage} from './types';
type Summary=Pick<JourneySnapshot,'id'|'journey_name'|'journey_version'|'created_at'>;
export function sortJourneyVersions<T extends Summary>(rows:T[]):T[]{
 return [...rows].sort((a,b)=>b.created_at.localeCompare(a.created_at)||b.journey_version-a.journey_version||a.id.localeCompare(b.id));
}
export function versionsForJourney<T extends Summary>(rows:T[],name:string):T[]{
 return rows.filter(r=>r.journey_name===name).sort((a,b)=>b.journey_version-a.journey_version||b.created_at.localeCompare(a.created_at)||a.id.localeCompare(b.id));
}
export function findJourneyMessages(messages:PackageMessage[],query:string):PackageMessage[]{
 const needle=query.trim().toLocaleLowerCase('pt-BR');
 return messages.filter(m=>!needle||[m.activity_name,m.asset_name,m.utm.af_sub3,m.content.channel].some(v=>v?.toLocaleLowerCase('pt-BR').includes(needle)));
}
