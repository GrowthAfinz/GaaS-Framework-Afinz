import { supabase } from './supabaseClient';
import type { StoredMessage, ReviewDecision, ApplyPreview } from '../modules/sfmc-package/types';
export interface CommunicationProposal {
 id: string; message_id: string; analysis_id: string; revision: number;
 observed_template_id: string | null; proposed_template_id: string;
 resolved_context: Record<string, unknown>; reasons: string[]; conflicts: string[]; alternatives: string[];
 review: ReviewDecision; status: 'ready' | 'review' | 'technical' | 'rejected' | 'applied';
 reviewed_by: string | null; updated_at: string;
}
export interface ProposalRow extends CommunicationProposal { message: StoredMessage }
export interface ProposalEvent { id: number; proposal_id: string; actor: string | null; action: string; snapshot: Record<string, unknown>; created_at: string }
async function all<T>(table: string): Promise<T[]> {
 const result: T[] = [];
 for (let offset=0;;offset+=500) {
  const {data,error}=await supabase.from(table).select('*').order('id').range(offset,offset+499);
  if(error)throw error; result.push(...(data||[]) as T[]); if((data||[]).length<500)return result;
 }
}
export async function readProposalInbox(): Promise<ProposalRow[]> {
 const [proposals,messages]=await Promise.all([all<CommunicationProposal>('communications_reconciliation_proposals'),all<StoredMessage>('sfmc_package_messages')]);
 const byId=new Map(messages.map(m=>[m.id,m]));
 return proposals.map(p=>{const message=byId.get(p.message_id);if(!message)throw Error('Origem da proposta indisponível; atualize a fila.');return {...p,message};});
}
export async function readProposalEvents():Promise<ProposalEvent[]> {
 const [events,links]=await Promise.all([all<ProposalEvent>('communications_proposal_events'),all<{id:number;actor:string;template_id:string;created_at:string;evidence:string;snapshots:Record<string,unknown>[];start_date:string;end_date:string}>('communication_execution_links')]);
 return [...events,...links.map(l=>({id:-Number(l.id),proposal_id:'execution-link:'+l.id,actor:l.actor,action:'execution_linked',created_at:l.created_at,snapshot:{note:l.evidence,template_id:l.template_id,activity_name:l.snapshots.map(s=>s['Activity name / Taxonomia']).join(' · '),start_date:l.start_date,end_date:l.end_date,executions:l.snapshots}}))].sort((a,b)=>a.created_at.localeCompare(b.created_at));
}
export interface AgentNote { kind: 'erro'|'hipotese'|'pergunta'|'info'; text: string }
export async function readAgentNotes(proposalId: string): Promise<{agent:string;created_at:string;notes:AgentNote[]}[]> {
 const {data,error}=await supabase.from('communications_proposal_events').select('snapshot,created_at').eq('proposal_id',proposalId).eq('action','agent_note').order('id',{ascending:false});
 if(error)throw error;
 return (data||[]).map(r=>({agent:String((r.snapshot as {agent?:string}).agent||'agente'),created_at:r.created_at as string,notes:((r.snapshot as {notes?:AgentNote[]}).notes||[])}));
}
export async function saveProposal(p: ProposalRow, review: ReviewDecision, resolved: boolean, note: string) {
 const {error}=await supabase.rpc('save_communication_proposal',{p_id:p.id,p_revision:p.revision,p_review:review,p_resolved:resolved,p_note:note});if(error)throw error;
}
export async function reviewProposals(rows: ProposalRow[], action: 'preview'|'apply'|'reject', token: string|null=null, key: string|null=null,note='') {
 const {data,error}=await supabase.rpc('review_communication_proposals',{p_selection:rows.map(p=>({id:p.id,revision:p.revision})),p_action:action,p_token:token,p_key:key,p_note:note});
 if(error)throw error; return data as ApplyPreview & {preview_token:string; rejected?:number};
}
export function proposalGroup(p: ProposalRow) {
 const {evidence,order,tracking_moment,candidate_ordinal,...context}=p.resolved_context;
 return p.message.import_id+':'+JSON.stringify(Object.entries(context).sort(([a],[b])=>a.localeCompare(b)));
}
export function normalizeCommunicationText(text: string|null) {return (text||'').replace(/\\n/g,' ').replace(/\s+/g,' ').trim();}

export interface ProposalReuse { coverage:{approved_versions:number;linked_activities:number}; matches:{template_id:string;content_id:string;is_current:boolean;linked_activities:number;first_dispatch:string|null;last_dispatch:string|null;same_context_activities:number}[] }
export async function readProposalReuse(id:string):Promise<ProposalReuse> {const {data,error}=await supabase.rpc('communication_proposal_reuse',{p_id:id});if(error)throw error;return data as ProposalReuse;}
export async function publishCommunicationsAnalysis(importId:string, analysis:{rule_version:string;source_refs:Record<string,unknown>;proposals:{message_id:string;proposed_template_id:string;resolved_context:Record<string,unknown>;reasons:string[];conflicts:string[];alternatives:string[]}[]}) {
 const {data,error}=await supabase.rpc('publish_communications_analysis',{p_import_id:importId,p_analysis:analysis});if(error)throw error;return data as string;
}
