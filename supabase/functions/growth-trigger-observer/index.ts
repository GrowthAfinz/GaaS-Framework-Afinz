import {createClient,type SupabaseClient} from '@supabase/supabase-js';
import {buildObservation,observationInputHash,parseObservationRequest} from '../_shared/growth-trigger-runtime.ts';
import type {ObservationInput} from '../_shared/growth-trigger-runtime.ts';
import {sha256} from '../report-sync/report-live-versioning.ts';
import type {ReportBuildArtifact} from '../report-sync/report-live-versioning.ts';

const headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization,apikey,content-type,x-client-info,x-report-worker-token','Access-Control-Allow-Methods':'POST,OPTIONS','Content-Type':'application/json'};
const response=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers});

export function createObservationHandler(admin:SupabaseClient<any>,serviceKey:string,clock:()=>Date=()=>new Date()){
async function run(period:string,requestedBy:string|null){
  const result=await admin.rpc('growth_trigger_observation_inputs',{p_period:period+'-01'});
  if(result.error||!result.data)throw new Error('observation_inputs_unavailable');
  const input=result.data as ObservationInput;
  const inputHash=await observationInputHash(input);
  const existing=await admin.from('growth_trigger_observation_runs').select('id').eq('input_hash',inputHash).maybeSingle();
  if(existing.error)throw new Error('observation_lookup_failed');
  if(existing.data)return {run_id:existing.data.id,reused:true,data_read_at:input.data_read_at};
  const started=await admin.from('growth_trigger_observation_attempts').insert({period:period+'-01',requested_by:requestedBy}).select('id').single();
  if(started.error)throw new Error('observation_attempt_unavailable');
  try{
    let artifact:ReportBuildArtifact|null=null;
    const downloaded=await admin.storage.from('report-live').download(input.certified.artifact_path);
    if(downloaded.data&&!downloaded.error){try{artifact=JSON.parse(await downloaded.data.text());}catch{/* T6 reports unavailable independently */}}
    const output=await buildObservation(input,artifact);
    const saved=await admin.rpc('growth_trigger_complete_observation',{p_input_hash:inputHash,p_output_hash:await sha256(output),p_input:input,p_output:output,p_requested_by:requestedBy});
    if(saved.error||!saved.data)throw new Error('observation_commit_failed');
    const finished=await admin.from('growth_trigger_observation_attempts').update({state:'completed',run_id:saved.data,finished_at:new Date().toISOString()}).eq('id',started.data.id);
    if(finished.error)throw new Error('observation_attempt_completion_failed');
    return {run_id:saved.data,reused:false,data_read_at:input.data_read_at};
  }catch(error){
    await admin.from('growth_trigger_observation_attempts').update({state:'failed',error_code:'executor_failed',finished_at:new Date().toISOString()}).eq('id',started.data.id);
    throw error;
  }
}

async function handleObservationRequest(req:Request){
  if(req.method==='OPTIONS')return new Response('ok',{headers});
  if(req.method!=='POST')return response({error:'Método não permitido.'},405);
  let body:ReturnType<typeof parseObservationRequest>;
  try{body=parseObservationRequest(await req.json());}catch{return response({error:'Solicitação inválida.'},400);}
  const bearer=req.headers.get('authorization')?.replace(/^Bearer\s+/i,'')??'';
  let internal=Boolean(serviceKey&&bearer===serviceKey),requestedBy:string|null=null;
  const worker=req.headers.get('x-report-worker-token')??bearer;
  if(!internal&&/^[a-f0-9]{64}$/i.test(worker)){
    const verified=await admin.rpc('report_live_verify_worker',{p_token:worker});
    if(verified.error)return response({error:'Autenticação interna indisponível.'},503);
    internal=verified.data===true;
  }
  if(!internal){
    if(!bearer)return response({error:'Autenticação obrigatória.'},401);
    const user=await admin.auth.getUser(bearer);
    if(user.error||!user.data.user)return response({error:'Sessão inválida.'},401);
    requestedBy=user.data.user.id;
    const membership=await admin.from('report_live_memberships').select('role,active').eq('user_id',requestedBy).maybeSingle();
    if(membership.error)return response({error:'Não foi possível verificar seu acesso.'},503);
    if(!membership.data?.active||!['analyst','publisher','admin'].includes(membership.data.role)||body.mode==='worker')return response({error:'Seu papel não permite esta operação.'},403);
  }
  let job:Record<string,unknown>|null=null;
  try{
    if(body.mode==='worker'){
      const claimed=await admin.rpc('growth_trigger_claim_observation_job');
      if(claimed.error)throw new Error('job_claim_failed');
      if(!claimed.data)return response({mode:'observacao',idle:true});
      job=claimed.data;
    }
    const today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(clock());
    const date=new Date(today+'T12:00:00Z');
    const defaultPeriod=new Date(Date.UTC(date.getUTCFullYear(),date.getUTCMonth()-1,1)).toISOString().slice(0,7);
    const period=job?String(job.period).slice(0,7):body.period??defaultPeriod;
    const output=await run(period,requestedBy);
    if(job){
      const finished=await admin.rpc('growth_trigger_finish_observation_job',{p_period:job.period,p_token:job.lease_token,p_run_id:output.run_id,p_error:null});
      if(finished.error||finished.data!==true)throw new Error('job_lease_lost');
    }else{
      const reconciled=await admin.rpc('growth_trigger_reconcile_manual_job',{p_period:period+'-01',p_run_id:output.run_id,p_read_at:output.data_read_at});
      if(reconciled.error)throw new Error('manual_job_reconciliation_failed');
    }
    return response({mode:'observacao',period,...output});
  }catch{
    if(job)await admin.rpc('growth_trigger_finish_observation_job',{p_period:job.period,p_token:job.lease_token,p_run_id:null,p_error:'executor_failed'});
    return response({error:'Não foi possível concluir a observação. A tentativa ficou registrada para revisão.'},503);
  }
}
return handleObservationRequest;
}
if(import.meta.main){
  const key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')??'';
  const admin=createClient(Deno.env.get('SUPABASE_URL')??'',key,{auth:{persistSession:false,autoRefreshToken:false}});
  Deno.serve(createObservationHandler(admin,key));
}
