import { supabase } from '../../../services/supabaseClient';
import { cleanScope } from './results.logic';
import { CRM_MEASURES, CRM_DIMENSIONS } from './crmAnalysis';
import { CrmMeasure } from './results.types';
import { ResultRetrospective, ResultRow, ResultsDomain, ResultsScope, ResultsSnapshot } from './results.types';

const cache=new Map<string,{expires:number;snapshot:ResultsSnapshot}>();
const fields = {
  crm: 'id,prog_gaas,status,created_at,updated_at,BU,jornada,Activity name / Taxonomia,Canal,Data de Disparo,Data Fim,Safra,Parceiro,SIGLA_Parceiro,Segmento,SIGLA_Segmento,Subgrupos,Etapa de aquisição,Perfil de Crédito,Produto,Oferta,Promocional,SIGLA_Oferta,Oferta 2,Promocional 2,Ordem de disparo,Base Total,Base Acionável,% Otimização de base,Custo Unitário Oferta,Custo Total da Oferta,Custo unitário do canal,Custo total canal,Custo Total Campanha,CAC,Taxa de Entrega,Taxa de Abertura,Taxa de Clique,Taxa de Proposta,Taxa de Aprovação,Taxa de Finalização,Taxa de Conversão,Cartões Gerados,Aprovados,Propostas,Emissões Independentes,Emissões Assistidas,Horário de Disparo,Abertura,Cliques,template_id,parceiro_canonico,parceiro_canonico_motivo,parceiro_canonico_confianca',
  renta: 'id,Data de Disparo,Activity name / Taxonomia,BU,Segmento,Parceiro,Canal,Base Acionável,Cliques,Custo Total Campanha,Etapa de aquisição,Subgrupos,jornada,Safra,Perfil de Crédito,Produto,Oferta,Promocional,Oferta 2,Promocional 2,Ordem de disparo',
  media: 'id,date,channel,campaign,objective,ad_id,ad_name,adset_id,adset_name,spend,impressions,clicks,conversions',
  b2c: 'id,data,tipo,propostas_total,emissoes_total',
};
const sources = { crm:'activities', renta:'rentabilizacao_activities', media:'paid_media_metrics', b2c:'b2c_daily_metrics' };
export const numberOrNull=(value:unknown):number|null => value===null||value===undefined||value===''?null:Number.isFinite(Number(value))?Number(value):null;
export async function readAllRows(table:string,columns:string,primaryKey='id') {
  const rows:Record<string,unknown>[]=[];
  let expected: number|null=null;
  for(let offset=0;;){
    const {data,error,count}=await supabase.from(table).select(columns.split(',').map(column=>JSON.stringify(column.trim())).join(','),offset===0?{count:'exact'}:{}).order(primaryKey).range(offset,offset+999);
    if(error)throw error;
    if(offset===0)expected=count;
    const batch=(data||[]) as unknown as Record<string,unknown>[];
    rows.push(...batch);
    if(!batch.length || expected!==null&&rows.length>=expected)break;
    offset+=batch.length;
  }
  const {count,error}=await supabase.from(table).select(primaryKey,{count:'exact',head:true});
  if(error)throw error;
  if(count!==rows.length || expected!==rows.length)throw new Error('A fonte mudou durante a leitura. Atualize para carregar o histórico completo.');
  return rows;
}
export async function fetchResultsSnapshot(domain:ResultsDomain,userId:string,refresh=false):Promise<ResultsSnapshot>{
  const key=userId+':'+domain;
  if(!refresh){const hit=cache.get(key);if(hit&&hit.expires>Date.now())return hit.snapshot;}
  const raw=await readAllRows(sources[domain],fields[domain]);
  let aliases:Record<string,unknown>[]=[],canonical:Record<string,unknown>[]=[];
  if(domain==='media'){
    [aliases,canonical]=await Promise.all([
      readAllRows('paid_media_campaign_aliases','id,platform,source_campaign_name,canonical_campaign_id'),
      readAllRows('canonical_paid_media_campaigns','canonical_campaign_id,display_name','canonical_campaign_id'),
    ]);
  }
  const str=(v:unknown)=>typeof v==='string'?v:'';
  let rows:ResultRow[]=raw.map(r=>{
    const crm=domain==='crm'||domain==='renta',renta=domain==='renta',media=domain==='media';
    const date=crm?new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(str(r['Data de Disparo']))):str(r[media?'date':'data']);
    const channel=str(r[crm?'Canal':'channel']);
    const campaignRaw=str(r.campaign);
    const ids=[...new Set(aliases.filter(a=>a.platform===channel&&a.source_campaign_name===campaignRaw).map(a=>str(a.canonical_campaign_id)))];
    const identity=ids.length===1?ids[0]:campaignRaw;
    const label=str(canonical.find(c=>c.canonical_campaign_id===identity)?.display_name)||campaignRaw;
    return {id:str(r.id),date,domain,bu:str(r.BU),segment:str(r.Segmento),partner:str(r[renta?'Parceiro':'parceiro_canonico']),
      stage:str(r['Etapa de aquisição']),subgroup:str(r.Subgrupos),journey:str(r.jornada),safra:str(r.Safra),objective:str(r.objective),grain:media?(r.ad_id||r.ad_name?'ad':r.adset_id||r.adset_name?'adset':'campaign'):'',
      channel,campaign:identity,campaignLabel:label,type:str(r.tipo),
      title:crm?str(r['Activity name / Taxonomia']):media?campaignRaw:str(r.tipo),
      primary:numberOrNull(r[renta?'Cliques':crm?'Cartões Gerados':media?'clicks':'emissoes_total']),
      secondary:numberOrNull(r[renta?'Base Acionável':crm?'Propostas':media?'impressions':'propostas_total']),
      spend:numberOrNull(r[crm?'Custo Total Campanha':'spend']),conversions:media?numberOrNull(r.conversions):null,
      duplicateKey:crm?JSON.stringify([r['Activity name / Taxonomia'],r['Data de Disparo'],r.BU,r.Canal]):str(r.id),
      crm:domain==='crm'?Object.fromEntries(Object.entries(CRM_MEASURES).map(([key,column])=>[key,numberOrNull(r[column])])) as Partial<Record<CrmMeasure,number|null>>:undefined,
      dimensions:crm?Object.fromEntries(Object.entries(CRM_DIMENSIONS).filter(([key])=>!renta||key!=='template').map(([key,column])=>[key,r[column]==null?'':String(r[column])])):undefined,sourceStatus:str(r.status),
      mapped:!media||ids.length===1};
  });
  // Never add overlapping campaign/adset/ad levels for a campaign on the same day.
  if(domain==='media') {
    const levels=new Map<string,Set<string>>();
    for(const row of rows){const key=JSON.stringify([row.date,row.channel,row.campaign]);const group=levels.get(key)||new Set<string>();group.add(row.grain||'');levels.set(key,group);}
    rows=rows.map(row=>levels.get(JSON.stringify([row.date,row.channel,row.campaign]))!.size>1?{...row,primary:null,secondary:null,spend:null,conversions:null}:row);
  }
  const snapshot={rows,fetchedAt:new Date().toISOString(),source:sources[domain]};
  // In-memory, scoped to the signed-in user; no operational data in localStorage or the static bundle.
  for(const oldKey of cache.keys())if(!oldKey.startsWith(userId+':'))cache.delete(oldKey);
  cache.set(key,{expires:Date.now()+300000,snapshot});
  return snapshot;
}
export async function fetchRetrospectives(domain:ResultsDomain,scope:ResultsScope,month:string):Promise<ResultRetrospective[]>{
  const {data,error}=await supabase.from('growth_result_retrospectives').select('id,domain,scope,period,revision,observation,interpretation,learning,next_action,evidence,created_at')
    .eq('domain',domain).eq('scope',JSON.stringify(cleanScope(domain,scope))).eq('period',month+'-01').order('revision',{ascending:false}).limit(50);
  if(error)throw error;return(data||[]) as ResultRetrospective[];
}
export async function appendRetrospective(domain:ResultsDomain,scope:ResultsScope,month:string,expectedRevision:number,draft:{observation:string;interpretation:string;learning:string;next_action:string;evidence:string},sourceSnapshot:Record<string,unknown>){
  const {data,error}=await supabase.rpc('growth_append_result_retrospective',{
    p_domain:domain,p_scope:cleanScope(domain,scope),p_period:month+'-01',p_expected_revision:expectedRevision,
    p_observation:draft.observation,p_interpretation:draft.interpretation,p_learning:draft.learning,p_next_action:draft.next_action,p_evidence:draft.evidence,p_source_snapshot:sourceSnapshot,
  });
  if(error)throw error;return data;
}

