import {supabase} from './supabaseClient';
import type {ProposalRow} from './communicationProposalService';
import type {FrameworkActivity,OrchestrationSlot} from '../utils/communicationOrchestrator';

/** Fetch the relevant universe, not a UI limit. RLS remains the access boundary. */
export async function readOrchestrationEvidence(rows:ProposalRow[]) {
 const names=[...new Set(rows.map(r=>r.message.payload.activity_name).filter(Boolean))];
 const journeys=[...new Set(rows.map(r=>r.message.payload.journey_name).filter(Boolean))];
 async function read<T>(table:string,column:string,values:string[]):Promise<T[]> {
  const result:T[]=[];
  for(let i=0;i<values.length;i+=40)for(let offset=0;;offset+=500){
   const {data,error}=await supabase.from(table).select('*').in(column.includes('/')?'"'+column+'"':column,values.slice(i,i+40)).order('id').range(offset,offset+499);
   if(error)throw error;result.push(...(data||[]) as T[]);if((data||[]).length<500)break;
  }
  return result;
 }
 const [named,journeyActivities,slots]=await Promise.all([
  read<FrameworkActivity>('activities','Activity name / Taxonomia',names),
  read<FrameworkActivity>('activities','jornada',journeys),
  read<OrchestrationSlot>('communication_slots','activity_name',names),
 ]);
 return {activities:[...new Map([...named,...journeyActivities].map(a=>[a.id,a])).values()],slots};
}
