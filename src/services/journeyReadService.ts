import {supabase} from './supabaseClient';
import type {JourneyIndexItem,JourneyManifest,JourneyReuse} from '../modules/sfmc-package/journeyV2';
import type {PackageMessage,TemplateContent} from '../modules/sfmc-package/types';
import type {FrameworkActivity} from '../utils/communicationOrchestrator';
import type {ExecutionReview} from '../utils/executionProjection';
import {JourneyReadCache} from './journeyReadCache';
const cache=new JourneyReadCache();let identity='';
const sessionIdentity=(session:any)=>session?session.user.id+':'+JSON.stringify(session.user.app_metadata||{}):'';
export function resetJourneyCache(){cache.clear();}
supabase.auth.onAuthStateChange((_event,session)=>{const next=sessionIdentity(session);if(next!==identity){identity=next;resetJourneyCache();}});
if(typeof window!=='undefined')for(const e of ['sfmc-package-changed','communication-links-changed'])window.addEventListener(e,resetJourneyCache);
export async function cachedJourneyRead<T>(key:string,ttl:number,load:()=>Promise<T>):Promise<T>{
 const {data}=await supabase.auth.getSession();const next=sessionIdentity(data.session);if(next!==identity){identity=next;resetJourneyCache();}
 if(!next)throw Error('Sessão necessária.');return cache.read(identity+':'+key,ttl,load);
}
async function rpc<T>(name:string,args:Record<string,unknown>={}){const {data,error}=await supabase.rpc(name,args);if(error)throw error;if(data===null)throw Error('Fonte indisponível ou sem acesso.');return data as T;}
export const readJourneyIndex=()=>cachedJourneyRead<JourneyIndexItem[]>('index',300000,()=>rpc('read_journey_flow_index'));
export const readJourneyManifest=(id:string)=>cachedJourneyRead<JourneyManifest>('manifest:'+id,3600000,()=>rpc('read_journey_flow_manifest',{p_snapshot:id}));
export const readJourneyMessage=(id:string,key:string)=>cachedJourneyRead<PackageMessage>('message:'+id+key,3600000,()=>rpc('read_journey_flow_message',{p_snapshot:id,p_occurrence:key}));
export interface ScopedResults {complete:boolean;rows:FrameworkActivity[];reviews:ExecutionReview[];exact_ids:string[];count:number}
export const readJourneyResults=(id:string,key:string,start:string,end:string,templates:boolean)=>cachedJourneyRead<ScopedResults>(JSON.stringify(['results',id,key,start,end,templates]),60000,()=>rpc('read_journey_flow_results',{p_snapshot:id,p_occurrence:key,p_start:start,p_end:end,p_templates:templates}));
export const readJourneyReuse=(id:string,key:string)=>cachedJourneyRead<JourneyReuse[]>('reuse:'+id+key,300000,()=>rpc('read_journey_flow_reuse',{p_snapshot:id,p_occurrence:key}));
export async function readCurrentContent(id:string):Promise<TemplateContent[]>{return cachedJourneyRead('current:'+id,60000,async()=>{const {data,error}=await supabase.from('communication_template_contents').select('*').eq('template_id',id).eq('is_current',true);if(error)throw error;return data||[];});}
