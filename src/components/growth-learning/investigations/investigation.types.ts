export interface InvestigationMetric {
 id:string;month:string;metric:string;value:number|null;recorded_row_sum:number|null;
 known_rows:number;total_rows:number;status:'observed'|'partial'|'blocked'|'unavailable';
}
export interface InvestigationPacket {
 operation_id:string;scope:{bu:string;segment:string;partner:string};filters:Record<string,string>;
 original_observation:{run_id:string;data_read_at:string;performance:Array<{family:string;current:number|null;median:number|null}>}|null;
 period:string;period_state:'open'|'closed';evidence:InvestigationMetric[];
 monthly:Array<{month:string;rows:number;ambiguous_rows:number;template_linked:number;cards_exclusion_policy:number|null}>;
 cuts:Array<{channel:string;journey:string;rows:number;recorded_row_sum:number|null;ambiguous_rows:number}>;
 source_rows:Array<{id:string;month:string;activity_name:string;execution_at:string;channel:string;journey:string|null;key_count:number;template_id:string|null}>;
 communications:Array<{template_id:string;title:string;version_label:string|null;historical_version_verified:boolean}>;
 memory_context:Array<{id:string;statement:string;source_ref:string;source_kind:string;review_due:boolean}>;
 limitations:string[];
}
export interface InvestigationAnalysis {
 id:string;body:{summary:string;status:string;facts:Array<{text:string;evidence_ids:string[]}>;
 hypotheses:Array<{text:string;evidence_ids:string[]}>;next_checks:string[];limitations:string[]};
 created_at:string;agent_metadata:{name:string;skill_version:string;commit:string};
}
export interface Investigation {
 id:string;operation_id:string;period:string;question_type:'result_change'|'execution_review';filters:Record<string,string>;
 current_revision:number;evidence_id:string;content_hash:string;read_at:string;packet:InvestigationPacket;
 state:string;attempts:number;last_error:string|null;stale:boolean;analysis:InvestigationAnalysis|null;
 analysis_is_current:boolean;candidate_id:string|null;candidate_event_id:string|null;candidate_is_current:boolean;
 decisions:Array<{id:string;decision:string;reason:string;created_at:string}>;
}
