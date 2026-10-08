import {supabase} from './supabaseClient';
import type {JourneySnapshot} from '../modules/sfmc-package/types';
export type JourneySummary=Pick<JourneySnapshot,'id'|'import_id'|'reference'|'journey_name'|'journey_version'|'created_at'>;
export async function listJourneySnapshots():Promise<JourneySummary[]> {
 const rows:JourneySummary[]=[];
 for(let offset=0;;offset+=200){const {data,error}=await supabase.from('sfmc_journey_snapshots').select('id,import_id,reference,journey_name,journey_version,created_at').order('created_at',{ascending:false}).order('id').range(offset,offset+199);if(error)throw error;rows.push(...(data||[]));if((data||[]).length<200)return rows;}
}
export async function readJourneySnapshot(id:string):Promise<JourneySnapshot>{const {data,error}=await supabase.from('sfmc_journey_snapshots').select('*').eq('id',id).single();if(error)throw error;return data as JourneySnapshot;}
