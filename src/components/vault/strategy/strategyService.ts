import { supabase } from '../../../services/supabaseClient';
import { getVaultNote, canSyncVault } from '../vaultService';
import type { StrategyDocument, StrategyHead, StrategyRevision } from './strategyModel';
export async function loadStrategy(noteId:string) {
 const [source,access,result,session] = await Promise.all([getVaultNote(noteId),canSyncVault(),supabase.from('gaas_wiki_pilot_documents').select('*').eq('note_id',noteId).maybeSingle(),supabase.auth.getSession()]);
 if(result.error)throw result.error;
 return {source,canEdit:access,viewerId:session.data.session?.user.id||'',head:result.data as StrategyHead|null};
}
export async function saveStrategy(noteId:string,revision:number,sourceHash:string,document:StrategyDocument,reason:string,requestId:string,reconcile=false):Promise<StrategyHead> {
 const {data,error}=await supabase.rpc('gaas_wiki_pilot_save',{p_note:noteId,p_revision:revision,p_source_hash:sourceHash,p_document:document,p_request:requestId,p_reason:reason,p_reconcile:reconcile});
 if(error)throw error;return data as StrategyHead;
}
export async function strategyHistory(noteId:string):Promise<StrategyRevision[]> {
 const {data,error}=await supabase.from('gaas_wiki_pilot_revisions').select('*').eq('note_id',noteId).order('revision',{ascending:false}).limit(100);
 if(error)throw error;return (data||[]) as StrategyRevision[];
}
