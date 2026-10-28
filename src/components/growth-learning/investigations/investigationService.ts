import {supabase} from '../../../services/supabaseClient';
import type {Investigation} from './investigation.types';
export interface PilotOperation {operation_id:string;scope:{bu:string;segment:string;partner:string}}
export async function listInvestigations():Promise<Investigation[]>{const {data,error}=await supabase.rpc('growth_list_investigations');if(error)throw error;return data||[];}
export async function pilotOperations():Promise<PilotOperation[]>{const {data,error}=await supabase.rpc('growth_investigation_operations');if(error)throw error;return data||[];}
export async function requestInvestigation(operation:string,month:string,question:string,filters:Record<string,string>={}){
 const {data,error}=await supabase.rpc('growth_request_investigation',{p_operation:operation,p_period:month+'-01',p_question:question,p_filters:filters});if(error)throw error;return String(data);
}
export async function decideInvestigation(i:Investigation,decision:string,reason:string){const {error}=await supabase.rpc('growth_decide_investigation',{p_id:i.id,p_revision:i.current_revision,p_decision:decision,p_reason:reason});if(error)throw error;}
export async function retryInvestigation(id:string){const {error}=await supabase.rpc('growth_retry_investigation',{p_id:id});if(error)throw error;}
